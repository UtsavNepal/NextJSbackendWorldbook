import { NextRequest } from 'next/server';
import { prisma } from '@/infrastructure/prisma';
import { fail, ok, requireUserId } from '@/utils/http';
import { serializeUser } from '@/utils/serializers';
import { ERRORS } from '@/constants/errors';

export async function GET(req: NextRequest) {
  const userId = await requireUserId(req);
  if (!userId) return fail(ERRORS.UNAUTHORIZED, 401);
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  if (id) {
    const user = await prisma.user.findUnique({
      where: { id },
      include: { profile: true },
    });
    if (!user) return fail(ERRORS.user.notFound, 404);
    return ok(serializeUser(user));
  }
  const users = await prisma.user.findMany({
    where: { id: { not: userId } },
    include: { profile: true },
  });
  return ok(users.map(serializeUser));
}

export async function DELETE(req: NextRequest) {
  const userId = await requireUserId(req);
  if (!userId) return fail(ERRORS.UNAUTHORIZED, 401);
  await prisma.user.delete({ where: { id: userId } });
  return ok({ success: true });
}
