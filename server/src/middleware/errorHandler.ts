import type { NextFunction, Request, Response } from 'express';
import { ApiError } from '../utils/errors.js';

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof ApiError) {
    res.status(err.statusCode).json({ error: err.message, details: err.details ?? null });
    return;
  }

  console.error(err);
  const message = err instanceof Error ? err.message : 'Unexpected server error';
  res.status(500).json({ error: message });
}

export function notFoundHandler(_req: Request, res: Response) {
  res.status(404).json({ error: 'Route not found' });
}
