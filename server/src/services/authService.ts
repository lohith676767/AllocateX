import { prisma } from '../db/client.js';
import { ApiError } from '../utils/errors.js';
import { verifyPassword } from '../utils/password.js';
import { signAuthToken } from '../utils/jwt.js';

export async function login(email: string, password: string) {
  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase().trim() },
    include: { companies: { include: { company: true } }, ngo: true },
  });
  if (!user) throw ApiError.unauthorized('Invalid email or password');

  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) throw ApiError.unauthorized('Invalid email or password');

  const token = signAuthToken({ sub: user.id, email: user.email, role: user.role as 'COMPANY' | 'NGO' });
  return { token, profile: toProfile(user) };
}

export async function getProfile(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { companies: { include: { company: true } }, ngo: true },
  });
  if (!user) throw ApiError.unauthorized();
  return toProfile(user);
}

function toProfile(user: {
  id: string;
  email: string;
  name: string;
  role: string;
  ngo: { id: string; name: string } | null;
  companies: { company: { id: string; name: string } }[];
}) {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    ngo: user.ngo ? { id: user.ngo.id, name: user.ngo.name } : null,
    companies: user.companies.map((c) => c.company),
  };
}
