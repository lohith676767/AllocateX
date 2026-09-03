import type { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';
import { importScenario } from '../services/importData.js';

export const postImportData = asyncHandler(async (req: Request, res: Response) => {
  const counts = await importScenario(req.body ?? {});
  res.json({ message: 'Import complete.', ...counts });
});
