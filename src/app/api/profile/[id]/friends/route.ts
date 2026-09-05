import { NextRequest } from 'next/server';
import { prisma } from '@/infrastructure/prisma';
import { fail, ok } from '@/utils/http';
import { serializeProfile } from '@/utils/serializers';
import { resolveProfileId } from '@/utils/social';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const profileId = await resolveProfileId(id);
  if (!profileId) return fail('Profile not found', 404);
  const profile = await prisma.profile.findUnique({ where: { id: profileId } });
  if (!profile) return fail('Profile not found', 404);
  const friendships = await prisma.friendship.findMany({
    where: { OR: [{ user1Id: profile.userId }, { user2Id: profile.userId }] },
  });
  const friendUserIds = friendships.map((friendship) =>
    friendship.user1Id === profile.userId ? friendship.user2Id : friendship.user1Id
  );
  const friends = await prisma.profile.findMany({
    where: { userId: { in: friendUserIds } },
    include: { user: true },
  });
  return ok(friends.map((friend) => serializeProfile(friend)));
}
