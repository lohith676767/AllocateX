import type { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';
import { advanceMonths, jumpToNextMilestone, rewindMonth } from '../services/simulation/simulationClock.js';
import { simulateFailure } from '../services/simulation/milestoneEngine.js';

export const postAdvanceSimulation = asyncHandler(async (req: Request, res: Response) => {
  const months = Number(req.body?.months ?? 1);
  const project = await advanceMonths(req.params.projectId, months);
  res.json(project);
});

export const postRewindSimulation = asyncHandler(async (req: Request, res: Response) => {
  const project = await rewindMonth(req.params.projectId);
  res.json(project);
});

export const postJumpSimulation = asyncHandler(async (req: Request, res: Response) => {
  const project = await jumpToNextMilestone(req.params.projectId);
  res.json(project);
});

export const postFailMilestone = asyncHandler(async (req: Request, res: Response) => {
  const override = req.body?.actualCompletion !== undefined ? Number(req.body.actualCompletion) : undefined;
  const project = await simulateFailure(req.params.projectId, override);
  res.json(project);
});

