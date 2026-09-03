import { prisma } from '../../db/client.js';
import { ApiError } from '../../utils/errors.js';
import { AuditEvents, logAudit } from '../audit.js';
import { evaluateSalvage } from '../fairfill/salvage.js';
import { proposeReallocation } from '../fairfill/reallocation.js';
import { assertTransition, ProjectState } from './stateMachine.js';
import { getProjectWithDetails } from './projectView.js';

const UNRESOLVED_MILESTONE_STATUSES = ['UPCOMING', 'IN_PROGRESS'];
const RESOLVED_MILESTONE_STATUSES = ['COMPLETED', 'MISSED', 'UNDER_REVIEW'];

/**
 * Runs after the simulated clock moves. A milestone whose due month has
 * been reached gets one of these automatic treatments:
 *  - EXTERNAL_DEPENDENCY: immediately paused for human review, no penalty —
 *    the whole point is that the system itself detects and pauses without
 *    waiting for a judge to click anything.
 *  - SELF_CONTROLLED, strictly in the PAST (dueMonth < currentMonth, e.g. a
 *    routine earlier checkpoint jumped straight over by a multi-month
 *    advance): auto-succeeds at its expected completion, so the judge isn't
 *    forced to individually resolve every earlier housekeeping milestone.
 *  - SELF_CONTROLLED, due EXACTLY this month (dueMonth === currentMonth —
 *    "arrived today"): moves to IN_PROGRESS and is NEVER auto-resolved. It
 *    stays pending until the judge explicitly calls completeCurrentMilestone
 *    (success) or simulateFailure (failure) — the clock alone must never
 *    decide the outcome of the milestone the judge just landed on.
 * Processing halts the moment a project leaves IN_PROGRESS, or the moment a
 * milestone becomes newly due-today, since later milestones can't
 * meaningfully be due while an earlier one is still unresolved.
 */
export async function evaluateDueMilestones(projectId: string) {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: { milestones: { orderBy: { order: 'asc' } } },
  });
  if (!project) throw ApiError.notFound('Project not found');

  let status = project.status as ProjectState;
  const maxOrder = Math.max(0, ...project.milestones.map((m) => m.order));

  for (const milestone of project.milestones) {
    if (status !== 'IN_PROGRESS') break;
    if (RESOLVED_MILESTONE_STATUSES.includes(milestone.status)) continue;
    if (milestone.dueMonth > project.currentSimulatedMonth) continue;
    if (milestone.status !== 'UPCOMING') break; // already marked due-today, awaiting a judge decision

    if (milestone.type === 'EXTERNAL_DEPENDENCY') {
      await prisma.milestone.update({ where: { id: milestone.id }, data: { status: 'UNDER_REVIEW' } });
      status = chainTransition(status, ['PAUSED', 'UNDER_REVIEW']);
      await logAudit(
        AuditEvents.MILESTONE_PAUSED_EXTERNAL,
        `Milestone "${milestone.name}" missed its due date, but it depends on an external party. Project paused for human review — no penalty applied to the NGO.`
      );
    } else if (milestone.dueMonth < project.currentSimulatedMonth) {
      await prisma.milestone.update({
        where: { id: milestone.id },
        data: { status: 'COMPLETED', actualCompletion: milestone.expectedCompletion },
      });
      const isLast = milestone.order === maxOrder;
      status = chainTransition(status, isLast ? ['MILESTONE_COMPLETED', 'COMPLETED'] : ['MILESTONE_COMPLETED', 'IN_PROGRESS']);
      await prisma.project.update({ where: { id: project.id }, data: { completionPercentage: milestone.expectedCompletion * 100 } });
      await logAudit(
        AuditEvents.MILESTONE_COMPLETED,
        `Milestone "${milestone.name}" completed on schedule at ${(milestone.expectedCompletion * 100).toFixed(0)}%.`
      );
    } else {
      await prisma.milestone.update({ where: { id: milestone.id }, data: { status: 'IN_PROGRESS' } });
      break; // due today — awaiting the judge's Complete / Simulate Failure action
    }
  }

  if (status !== project.status) {
    await prisma.project.update({ where: { id: project.id }, data: { status } });
  }

  return getProjectWithDetails(project.id);
}

/** Explicit judge action: push the current pending milestone to completion. */
export async function completeCurrentMilestone(projectId: string) {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: { milestones: { orderBy: { order: 'asc' } } },
  });
  if (!project) throw ApiError.notFound('Project not found');
  if (project.status !== 'IN_PROGRESS') {
    throw ApiError.conflict(`Project must be IN_PROGRESS to complete a milestone (current status: ${project.status})`);
  }

  const milestone = project.milestones.find((m) => UNRESOLVED_MILESTONE_STATUSES.includes(m.status));
  if (!milestone) throw ApiError.conflict('No pending milestone available to complete');

  await prisma.milestone.update({
    where: { id: milestone.id },
    data: { status: 'COMPLETED', actualCompletion: milestone.expectedCompletion },
  });

  const maxOrder = Math.max(0, ...project.milestones.map((m) => m.order));
  const isLast = milestone.order === maxOrder;
  const status = chainTransition('IN_PROGRESS', isLast ? ['MILESTONE_COMPLETED', 'COMPLETED'] : ['MILESTONE_COMPLETED', 'IN_PROGRESS']);

  await prisma.project.update({
    where: { id: project.id },
    data: { status, completionPercentage: milestone.expectedCompletion * 100 },
  });

  await logAudit(AuditEvents.MILESTONE_COMPLETED, `Milestone "${milestone.name}" marked complete by the CSR administrator.`);

  return getProjectWithDetails(project.id);
}

/** Resolves a specific milestone by id (used by POST /api/milestones/:id/complete). */
export async function completeMilestoneById(milestoneId: string) {
  const milestone = await prisma.milestone.findUnique({ where: { id: milestoneId } });
  if (!milestone) throw ApiError.notFound('Milestone not found');
  if (!UNRESOLVED_MILESTONE_STATUSES.includes(milestone.status)) {
    throw ApiError.conflict(`Milestone has already been resolved (${milestone.status})`);
  }
  return completeCurrentMilestone(milestone.projectId);
}

/**
 * Explicit judge action: force the current pending milestone to fail.
 * SELF_CONTROLLED failures trigger salvage evaluation and (if below
 * threshold) a reallocation proposal. EXTERNAL_DEPENDENCY "failures" are
 * always treated as a no-penalty pause, matching evaluateDueMilestones.
 */
export async function simulateFailure(projectId: string, actualCompletionOverride?: number) {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: { milestones: { orderBy: { order: 'asc' } } },
  });
  if (!project) throw ApiError.notFound('Project not found');
  if (project.status !== 'IN_PROGRESS') {
    throw ApiError.conflict(`Project must be IN_PROGRESS to simulate a milestone failure (current status: ${project.status})`);
  }

  const milestone = project.milestones.find((m) => UNRESOLVED_MILESTONE_STATUSES.includes(m.status));
  if (!milestone) throw ApiError.conflict('No pending milestone available to fail');

  const actual =
    actualCompletionOverride !== undefined
      ? clamp01(actualCompletionOverride)
      : Math.round(milestone.expectedCompletion * 0.5 * 100) / 100;

  if (milestone.type === 'EXTERNAL_DEPENDENCY') {
    await prisma.milestone.update({ where: { id: milestone.id }, data: { status: 'UNDER_REVIEW', actualCompletion: actual } });
    const status = chainTransition('IN_PROGRESS', ['PAUSED', 'UNDER_REVIEW']);
    await prisma.project.update({ where: { id: project.id }, data: { status } });
    await logAudit(
      AuditEvents.MILESTONE_PAUSED_EXTERNAL,
      `Milestone "${milestone.name}" delayed by an external dependency. No penalty applied; paused for human review.`
    );
    return getProjectWithDetails(project.id);
  }

  await prisma.milestone.update({ where: { id: milestone.id }, data: { status: 'MISSED', actualCompletion: actual } });
  const missedStatus = chainTransition('IN_PROGRESS', ['MILESTONE_MISSED']);
  await prisma.project.update({
    where: { id: project.id },
    data: { status: missedStatus, completionPercentage: actual * 100 },
  });
  await logAudit(
    AuditEvents.MILESTONE_MISSED,
    `Milestone "${milestone.name}" missed — expected ${(milestone.expectedCompletion * 100).toFixed(0)}%, actual ${(actual * 100).toFixed(0)}% (self-controlled).`
  );

  const salvage = evaluateSalvage(actual, project.salvageThreshold);
  await prisma.project.update({
    where: { id: project.id },
    data: { lastSalvageDecision: salvage.decision, lastSalvageReason: salvage.reason },
  });
  await logAudit(AuditEvents.SALVAGE_EVALUATED, salvage.reason);

  if (salvage.decision === 'REALLOCATE') {
    await proposeReallocation(project.id, salvage.reason);
  } else {
    const reviewStatus = chainTransition('MILESTONE_MISSED', ['UNDER_REVIEW']);
    await prisma.project.update({ where: { id: project.id }, data: { status: reviewStatus } });
  }

  return getProjectWithDetails(project.id);
}

export async function submitEvidence(
  milestoneId: string,
  input: { filename: string; description: string; simulatedLocation: string }
) {
  const milestone = await prisma.milestone.findUnique({ where: { id: milestoneId }, include: { project: true } });
  if (!milestone) throw ApiError.notFound('Milestone not found');

  const evidence = await prisma.evidence.upsert({
    where: { milestoneId },
    create: { milestoneId, ...input },
    update: { ...input, reviewStatus: 'SUBMITTED', timestamp: new Date() },
  });

  await logAudit(
    AuditEvents.EVIDENCE_SUBMITTED,
    `Evidence submitted for milestone "${milestone.name}" on "${milestone.project.name}": ${input.filename}.`
  );

  return evidence;
}

const EVIDENCE_REVIEW_STATUSES = ['REVIEWED', 'FLAGGED'];

/** A human reviewer marking evidence — evidence is never auto-verified. */
export async function reviewEvidence(evidenceId: string, status: 'REVIEWED' | 'FLAGGED') {
  if (!EVIDENCE_REVIEW_STATUSES.includes(status)) {
    throw ApiError.badRequest(`Invalid review status: ${status}`);
  }
  const evidence = await prisma.evidence.findUnique({
    where: { id: evidenceId },
    include: { milestone: { include: { project: true } } },
  });
  if (!evidence) throw ApiError.notFound('Evidence not found');

  const updated = await prisma.evidence.update({ where: { id: evidenceId }, data: { reviewStatus: status } });

  await logAudit(
    AuditEvents.EVIDENCE_REVIEWED,
    `Evidence for milestone "${evidence.milestone.name}" on "${evidence.milestone.project.name}" marked ${status.toLowerCase()} by a human reviewer.`
  );

  return updated;
}

function chainTransition(from: ProjectState, hops: ProjectState[]): ProjectState {
  let current = from;
  for (const next of hops) {
    assertTransition(current, next);
    current = next;
  }
  return current;
}

function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value));
}
