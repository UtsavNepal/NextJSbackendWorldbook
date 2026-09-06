import { NextRequest } from 'next/server';
import { prisma } from '@/infrastructure/prisma';
import { fail, ok, requireUserId } from '@/utils/http';
import { withdrawFriendRequestNotification } from '@/utils/social';
import { ERRORS } from '@/constants/errors';

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const userId = await requireUserId(req);
  if (!userId) return fail(ERRORS.UNAUTHORIZED, 401);
  const { id } = await params;
  const request = await prisma.friendRequest.findUnique({ where: { id } });
  if (!request || request.fromUserId !== userId) return fail(ERRORS.friend.requestNotFound, 404);
  await prisma.friendRequest.delete({ where: { id } });
  await withdrawFriendRequestNotification(request.fromUserId, request.toUserId);
  return ok({ message: 'Friend request cancelled' });
}
