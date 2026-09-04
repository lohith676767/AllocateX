import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET ?? 'fairfill-dev-secret-change-me';
const JWT_EXPIRES_IN = '7d';

export interface AuthTokenPayload {
  sub: string; // user id
  email: string;
  name: string;
  role: 'COMPANY' | 'NGO';
}

export function signAuthToken(payload: AuthTokenPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

export function verifyAuthToken(token: string): AuthTokenPayload {
  return jwt.verify(token, JWT_SECRET) as AuthTokenPayload;
}
