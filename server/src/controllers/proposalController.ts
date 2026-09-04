import type { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/errors.js';
import { acceptProposal, listInboxForUser, listSentProposals, previewProposal, rejectProposal, submitProposal } from '../services/proposals.js';

export const postPreviewProposal = asyncHandler(async (req: Request, res: Response) => {
  if (!req.file) throw ApiError.badRequest('Attach a proposal file (PDF, DOCX, or plain text).');
  res.json(await previewProposal(req.file));
});

export const postSubmitProposal = asyncHandler(async (req: Request, res: Response) => {
  const { filename, extracted, companyIds } = req.body ?? {};
  if (!filename || !extracted) throw ApiError.badRequest('Missing the reviewed proposal data — extract it again before submitting.');
  const ids = ([] as string[]).concat(companyIds ?? []);
  const proposal = await submitProposal(req.user!.sub, filename, extracted, ids);
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
