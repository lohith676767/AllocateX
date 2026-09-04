import type { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/errors.js';
import { acceptProposal, listInboxForUser, listSentProposals, rejectProposal, submitProposal } from '../services/proposals.js';

export const postSubmitProposal = asyncHandler(async (req: Request, res: Response) => {
  if (!req.file) throw ApiError.badRequest('Attach a proposal file (PDF, DOCX, or plain text).');
  const companyIds = ([] as string[]).concat(req.body.companyIds ?? []);
  const proposal = await submitProposal(req.user!.sub, req.file, companyIds);
  res.status(201).json(proposal);
});

export const getSentProposals = asyncHandler(async (req: Request, res: Response) => {
  res.json(await listSentProposals(req.user!.sub));
});

export const getInbox = asyncHandler(async (req: Request, res: Response) => {
  res.json(await listInboxForUser(req.user!.sub));
});

export const postAcceptProposal = asyncHandler(async (req: Request, res: Response) => {
  res.json(await acceptProposal(req.params.id, req.user!.sub));
});

export const postRejectProposal = asyncHandler(async (req: Request, res: Response) => {
  res.json(await rejectProposal(req.params.id, req.user!.sub));
});
