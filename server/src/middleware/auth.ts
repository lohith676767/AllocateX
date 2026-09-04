import type { NextFunction, Request, Response } from 'express';
import { ApiError } from '../utils/errors.js';
import { verifyAuthToken, type AuthTokenPayload } from '../utils/jwt.js';

export const AUTH_COOKIE_NAME = 'fairfill_token';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: AuthTokenPayload;
    }
  }
}

export function requireAuth(req: Request, _res: Response, next: NextFunction) {
  const token = req.cookies?.[AUTH_COOKIE_NAME];
  if (!token) return next(ApiError.unauthorized());
  try {
    req.user = verifyAuthToken(token);
    next();
  } catch {
    next(ApiError.unauthorized('Session expired — please log in again'));
  }
}

export function requireRole(...roles: Array<'COMPANY' | 'NGO'>) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) return next(ApiError.unauthorized());
    if (!roles.includes(req.user.role)) return next(ApiError.forbidden());
    next();
  };
}
