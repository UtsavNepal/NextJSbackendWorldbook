import { NextRequest } from 'next/server';
import { prisma } from '@/infrastructure/prisma';
import { fail, ok, requireUserId } from '@/utils/http';
import { serializeProfile } from '@/utils/serializers';

export async function GET(req: NextRequest) {
  const userId = await requireUserId(req);
  if (!userId) return fail('Unauthorized', 401);
  const profiles = await prisma.profile.findMany({
    where: { userId: { not: userId } },
    include: { user: true },
  });
  return ok(profiles.map((profile) => serializeProfile(profile)));
}
