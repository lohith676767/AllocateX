import { prisma } from '../../db/client.js';
import { ApiError } from '../../utils/errors.js';
import { AuditEvents, logAudit } from '../audit.js';
import { evaluateDueMilestones } from './milestoneEngine.js';
import { getProjectWithDetails } from './projectView.js';

const MAX_SIMULATED_MONTH = 24;

/**
 * The judge controls project time directly — this is a simulated clock,
 * never real elapsed time. Advancing the clock is what makes due milestones
 * get evaluated (see milestoneEngine.evaluateDueMilestones).
 */
export async function advanceMonths(projectId: string, months: number) {
  if (!Number.isFinite(months) || months <= 0) {
    throw ApiError.badRequest('months must be a positive number');
  }
  const project = await prisma.project.findUnique({ where: { id: projectId } });
  if (!project) throw ApiError.notFound('Project not found');

  const nextMonth = Math.min(MAX_SIMULATED_MONTH, project.currentSimulatedMonth + Math.round(months));
  await prisma.project.update({ where: { id: projectId }, data: { currentSimulatedMonth: nextMonth } });
  await logAudit(AuditEvents.SIMULATION_ADVANCED, `Project clock for "${project.name}" advanced to Month ${nextMonth}.`);

  return evaluateDueMilestones(projectId);
}

export async function rewindMonth(projectId: string) {
  const project = await prisma.project.findUnique({ where: { id: projectId } });
  if (!project) throw ApiError.notFound('Project not found');

  const prevMonth = Math.max(0, project.currentSimulatedMonth - 1);
  await prisma.project.update({ where: { id: projectId }, data: { currentSimulatedMonth: prevMonth } });
  await logAudit(AuditEvents.SIMULATION_ADVANCED, `Project clock for "${project.name}" rewound to Month ${prevMonth}.`);

  return getProjectWithDetails(projectId);
}

export async function jumpToNextMilestone(projectId: string) {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: { milestones: true },
  });
  if (!project) throw ApiError.notFound('Project not found');

  const next = project.milestones
    .filter((m) => m.status === 'UPCOMING' || m.status === 'IN_PROGRESS')
    .sort((a, b) => a.dueMonth - b.dueMonth)[0];

  if (!next) throw ApiError.conflict('No upcoming milestone to jump to');

  const targetMonth = Math.min(MAX_SIMULATED_MONTH, Math.max(project.currentSimulatedMonth, next.dueMonth));
  await prisma.project.update({ where: { id: projectId }, data: { currentSimulatedMonth: targetMonth } });
  await logAudit(
    AuditEvents.SIMULATION_ADVANCED,
    `Project clock for "${project.name}" jumped to Month ${targetMonth} (next milestone: "${next.name}").`
  );

  return evaluateDueMilestones(projectId);
}
