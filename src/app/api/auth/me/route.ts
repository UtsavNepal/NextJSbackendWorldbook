import { NextRequest } from 'next/server';
import { prisma } from '@/infrastructure/prisma';
import { fail, ok, requireUserId } from '@/utils/http';
import { serializeUser } from '@/utils/serializers';

export async function GET(req: NextRequest) {
  const userId = await requireUserId(req);
  if (!userId) return fail('Unauthorized', 401);
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { profile: true },
  });
  if (!user) return fail('User not found', 404);
  return ok(serializeUser(user));
}
