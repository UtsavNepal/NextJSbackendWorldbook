import { NextRequest } from 'next/server';
import { prisma } from '@/infrastructure/prisma';
import { fail, ok } from '@/utils/http';
import { serializeProfile } from '@/utils/serializers';
import { resolveProfileId } from '@/utils/social';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const profileId = await resolveProfileId(id);
  if (!profileId) return fail('Profile not found', 404);
  const follows = await prisma.follow.findMany({
    where: { followingId: profileId },
    include: { follower: { include: { user: true } } },
  });
  return ok(follows.map((follow) => serializeProfile(follow.follower)));
}
