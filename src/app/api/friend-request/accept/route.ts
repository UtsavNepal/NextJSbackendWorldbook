import { NextRequest } from 'next/server';
import { prisma } from '@/infrastructure/prisma';
import { fail, ok, readJson, requireUserId } from '@/utils/http';
import { getProfileForUser, notify } from '@/utils/social';

export async function POST(req: NextRequest) {
  const userId = await requireUserId(req);
  if (!userId) return fail('Unauthorized', 401);
  const body = await readJson(req);
  const requestId = body.request_id || body.requestId;
  if (!requestId) return fail('Missing request_id');
  const request = await prisma.friendRequest.findUnique({ where: { id: requestId } });
  if (!request || request.toUserId !== userId) return fail('Friend request not found', 404);
  await prisma.friendRequest.update({ where: { id: requestId }, data: { status: 'accepted' } });
  await prisma.friendship.upsert({
    where: { user1Id_user2Id: { user1Id: request.fromUserId, user2Id: request.toUserId } },
    create: { user1Id: request.fromUserId, user2Id: request.toUserId },
    update: {},
  });
  await prisma.profile.updateMany({
    where: { userId: { in: [request.fromUserId, request.toUserId] } },
    data: { totalFriends: { increment: 1 } },
  });
  const actor = await getProfileForUser(userId);
  const recipient = await getProfileForUser(request.fromUserId);
  if (actor && recipient) {
    await notify({
      recipientId: recipient.id,
      actorId: actor.id,
      notificationType: 'friend_accept',
      message: `${actor.username} accepted your friend request`,
    });
  }
  return ok({ message: 'Friend request accepted' });
}
