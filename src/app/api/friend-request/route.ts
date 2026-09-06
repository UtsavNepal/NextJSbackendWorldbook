import { NextRequest } from 'next/server';
import { prisma } from '@/infrastructure/prisma';
import { fail, ok, readJson, requireUserId } from '@/utils/http';
import { friendRequestInclude, serializeFriendRequest } from '@/utils/serializers';
import { getProfileForUser, notify, resolveProfileId } from '@/utils/social';
import { ERRORS } from '@/constants/errors';

export async function GET(req: NextRequest) {
  const userId = await requireUserId(req);
  if (!userId) return fail(ERRORS.UNAUTHORIZED, 401);
  const requests = await prisma.friendRequest.findMany({
    where: { toUserId: userId, status: 'pending' },
    include: friendRequestInclude,
    orderBy: { createdAt: 'desc' },
  });
  return ok(requests.map(serializeFriendRequest));
}

export async function POST(req: NextRequest) {
  const userId = await requireUserId(req);
  if (!userId) return fail(ERRORS.UNAUTHORIZED, 401);
  const body = await readJson(req);
  const rawTarget = body.to_user_id || body.toUserId || body.userId;
  if (!rawTarget) return fail(ERRORS.validation.missingTargetUser);

  let toUserId = String(rawTarget);
  const profileId = await resolveProfileId(toUserId);
  if (profileId) {
    const targetProfile = await prisma.profile.findUnique({ where: { id: profileId } });
    if (targetProfile) toUserId = targetProfile.userId;
  }

  if (toUserId === userId) return fail(ERRORS.friend.cannotFriendSelf);
  const existing = await prisma.friendRequest.findFirst({
    where: {
      OR: [
        { fromUserId: userId, toUserId, status: 'pending' },
        { fromUserId: toUserId, toUserId: userId, status: 'pending' },
      ],
    },
  });
  if (existing) return fail(ERRORS.friend.alreadySent);

  const request = await prisma.friendRequest.create({
    data: { fromUserId: userId, toUserId, status: 'pending' },
    include: friendRequestInclude,
  });
  const actor = await getProfileForUser(userId);
  const recipient = await getProfileForUser(toUserId);
  if (actor && recipient) {
    await notify({
      recipientId: recipient.id,
      actorId: actor.id,
      notificationType: 'friend_request',
      message: `${actor.username} sent you a friend request`,
    });
  }
  return ok(serializeFriendRequest(request), 201);
}
