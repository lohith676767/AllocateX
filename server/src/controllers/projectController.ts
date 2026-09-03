import type { Request, Response } from 'express';
import { prisma } from '../db/client.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/errors.js';
import { calculateScore } from '../services/fairfill/scoring.js';
import { getProjectWithDetails } from '../services/simulation/projectView.js';
import { allowedNextStates } from '../services/simulation/stateMachine.js';

export const listProjects = asyncHandler(async (_req: Request, res: Response) => {
  const projects = await prisma.project.findMany({
    include: {
      region: true,
      ngo: true,
      tiers: { orderBy: { order: 'asc' } },
      milestones: { orderBy: { order: 'asc' }, include: { evidence: true } },
    },
    orderBy: { createdAt: 'asc' },
  });
  res.json(projects);
});

export const getProject = asyncHandler(async (req: Request, res: Response) => {
  const project = await getProjectWithDetails(req.params.id);
  const scoreBreakdown = calculateScore({
    impactUnits: project.impactUnits,
    amount: project.requestedBudget,
    trustMultiplier: project.trustMultiplier || project.ngo.trustMultiplier,
    underserviceScore: project.underserviceScore,
    equityScore: project.equityScore,
  });
  res.json({ ...project, scoreBreakdown, allowedNextStates: allowedNextStates(project.status as any) });
});

export const getProjectMilestones = asyncHandler(async (req: Request, res: Response) => {
  const project = await prisma.project.findUnique({ where: { id: req.params.id } });
  if (!project) throw ApiError.notFound('Project not found');
  const milestones = await prisma.milestone.findMany({
    where: { projectId: req.params.id },
    orderBy: { order: 'asc' },
    include: { evidence: true },
  });
  res.json(milestones);
});
