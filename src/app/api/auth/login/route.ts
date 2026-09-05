import { NextRequest } from 'next/server';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { userRepository } from '@/infrastructure/repositories/userRepository';
import { fail, ok, readJson } from '@/utils/http';
import { serializeUser } from '@/utils/serializers';
import { prisma } from '@/infrastructure/prisma';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const JWT_SECRET = process.env.JWT_SECRET || 'changeme';

export async function POST(req: NextRequest) {
  const body = await readJson(req);
  if (!body.email || !body.password) {
    return fail('Missing email or password', 400);
  }
  const user = await userRepository.getUserByEmail(body.email);
  if (!user) return fail('Invalid credentials', 401);
  const valid = await bcrypt.compare(body.password, user.password);
  if (!valid) return fail('Invalid credentials', 401);

  const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
  const fullUser = await prisma.user.findUnique({
    where: { id: user.id },
    include: { profile: true },
  });
  const safeUser = serializeUser(fullUser);

  return ok({
    token,
    access: token,
    refresh: token,
    user: safeUser,
  });
}
