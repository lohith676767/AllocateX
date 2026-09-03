import type { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/errors.js';
import { completeMilestoneById, reviewEvidence, submitEvidence } from '../services/simulation/milestoneEngine.js';

export const postCompleteMilestone = asyncHandler(async (req: Request, res: Response) => {
  const project = await completeMilestoneById(req.params.id);
  res.json(project);
});

export const postMilestoneEvidence = asyncHandler(async (req: Request, res: Response) => {
  const { filename, description, simulatedLocation } = req.body ?? {};
  if (!filename || !description || !simulatedLocation) {
    throw ApiError.badRequest('filename, description and simulatedLocation are required');
  }
  const evidence = await submitEvidence(req.params.id, { filename, description, simulatedLocation });
  res.json(evidence);
});

export const postReviewEvidence = asyncHandler(async (req: Request, res: Response) => {
  const { status } = req.body ?? {};
  if (status !== 'REVIEWED' && status !== 'FLAGGED') {
    throw ApiError.badRequest('status must be REVIEWED or FLAGGED');
  }
  const evidence = await reviewEvidence(req.params.id, status);
  res.json(evidence);
});
