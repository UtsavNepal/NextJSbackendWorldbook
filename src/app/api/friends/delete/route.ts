import { NextRequest } from 'next/server';
import { prisma } from '@/infrastructure/prisma';
import { fail, ok, readJson, requireUserId } from '@/utils/http';
import { resolveProfileId } from '@/utils/social';

export async function POST(req: NextRequest) {
  const userId = await requireUserId(req);
  if (!userId) return fail('Unauthorized', 401);
  const body = await readJson(req);
  let friendId = String(body.friend_id || body.friendId || '');
  if (!friendId) return fail('Missing friend_id');
  const profileId = await resolveProfileId(friendId);
  if (profileId) {
    const profile = await prisma.profile.findUnique({ where: { id: profileId } });
    if (profile) friendId = profile.userId;
  }
  await prisma.friendship.deleteMany({
    where: {
      OR: [
        { user1Id: userId, user2Id: friendId },
        { user1Id: friendId, user2Id: userId },
      ],
    },
  });
  await prisma.profile.updateMany({
    where: { userId: { in: [userId, friendId] } },
    data: { totalFriends: { decrement: 1 } },
  });
  return ok({ message: 'Friend deleted' });
}
