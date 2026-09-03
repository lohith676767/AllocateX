import type { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';
import { resetDemo } from '../services/demo.js';

export const postResetDemo = asyncHandler(async (_req: Request, res: Response) => {
  const counts = await resetDemo();
  res.json({ message: 'Demo scenario reset to its seeded state.', ...counts });
});
