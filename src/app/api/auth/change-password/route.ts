import { NextRequest } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/infrastructure/prisma';
import { fail, ok, readJson, requireUserId } from '@/utils/http';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const userId = await requireUserId(req);
  if (!userId) return fail('Unauthorized', 401);
  const body = await readJson(req);
  const oldPassword = body.old_password || body.oldPassword;
  const newPassword = body.new_password || body.newPassword;
  if (!oldPassword || !newPassword) return fail('Missing fields');
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return fail('User not found', 404);
  const valid = await bcrypt.compare(oldPassword, user.password);
  if (!valid) return fail('Invalid old password');
  const hashed = await bcrypt.hash(newPassword, 10);
  await prisma.user.update({ where: { id: userId }, data: { password: hashed } });
  return ok({ message: 'Password changed successfully' });
}
