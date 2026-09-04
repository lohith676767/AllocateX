import type { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/errors.js';
import { AUTH_COOKIE_NAME } from '../middleware/auth.js';
import { getProfile, login } from '../services/authService.js';

const COOKIE_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

export const postLogin = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body ?? {};
  if (!email || !password) throw ApiError.badRequest('Email and password are required');

  const { token, profile } = await login(email, password);
  res.cookie(AUTH_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: COOKIE_MAX_AGE_MS,
  });
  res.json(profile);
});

export const postLogout = asyncHandler(async (_req: Request, res: Response) => {
  res.clearCookie(AUTH_COOKIE_NAME);
  res.json({ message: 'Logged out.' });
});

export const getMe = asyncHandler(async (req: Request, res: Response) => {
  const profile = await getProfile(req.user!.sub);
  res.json(profile);
});
