import { NextRequest } from 'next/server';
import { prisma } from '@/infrastructure/prisma';
import { fail, ok, requireUserId } from '@/utils/http';
import { serializeProfile } from '@/utils/serializers';

export async function GET(req: NextRequest) {
  const userId = await requireUserId(req);
  if (!userId) return fail('Unauthorized', 401);
  const friendships = await prisma.friendship.findMany({
    where: { OR: [{ user1Id: userId }, { user2Id: userId }] },
  });
  const friendUserIds = friendships.map((friendship) =>
    friendship.user1Id === userId ? friendship.user2Id : friendship.user1Id
  );
  const friends = await prisma.profile.findMany({
    where: { userId: { in: friendUserIds } },
    include: { user: true },
  });
  return ok(friends.map((friend) => serializeProfile(friend)));
}
