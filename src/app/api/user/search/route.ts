import { NextRequest } from 'next/server';
import { prisma } from '@/infrastructure/prisma';
import { fail, ok, requireUserId } from '@/utils/http';
import { serializeUser } from '@/utils/serializers';

export async function GET(req: NextRequest) {
  const userId = await requireUserId(req);
  if (!userId) return fail('Unauthorized', 401);
  const query = new URL(req.url).searchParams.get('query')
    || new URL(req.url).searchParams.get('q')
    || '';
  if (!query.trim()) return ok([]);
  const users = await prisma.user.findMany({
    where: {
      id: { not: userId },
      OR: [
        { email: { contains: query, mode: 'insensitive' } },
        { firstname: { contains: query, mode: 'insensitive' } },
        { lastname: { contains: query, mode: 'insensitive' } },
        { profile: { username: { contains: query, mode: 'insensitive' } } },
      ],
    },
    include: { profile: true },
    take: 20,
  });
  return ok(users.map(serializeUser));
}
