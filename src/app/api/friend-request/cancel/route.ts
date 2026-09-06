import { NextRequest } from 'next/server';
import { prisma } from '@/infrastructure/prisma';
import { fail, ok, readJson, requireUserId } from '@/utils/http';
import { withdrawFriendRequestNotification } from '@/utils/social';
import { ERRORS } from '@/constants/errors';

export async function POST(req: NextRequest) {
  const userId = await requireUserId(req);
  if (!userId) return fail(ERRORS.UNAUTHORIZED, 401);
  const body = await readJson(req);
  const requestId = body.request_id || body.requestId || body.id;
  if (!requestId) return fail(ERRORS.validation.missingRequestId);
  const request = await prisma.friendRequest.findUnique({ where: { id: requestId } });
  if (!request || request.fromUserId !== userId) return fail(ERRORS.friend.requestNotFound, 404);
  await prisma.friendRequest.delete({ where: { id: requestId } });
  await withdrawFriendRequestNotification(request.fromUserId, request.toUserId);
  return ok({ message: 'Friend request cancelled' });
}

export async function DELETE(req: NextRequest) {
  return POST(req);
}
