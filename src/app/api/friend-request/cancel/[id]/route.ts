import { NextRequest } from 'next/server';
import { prisma } from '@/infrastructure/prisma';
import { fail, ok, requireUserId } from '@/utils/http';
import { withdrawFriendRequestNotification } from '@/utils/social';

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const userId = await requireUserId(req);
  if (!userId) return fail('Unauthorized', 401);
  const { id } = await params;
  const request = await prisma.friendRequest.findUnique({ where: { id } });
  if (!request || request.fromUserId !== userId) return fail('Friend request not found', 404);
  await prisma.friendRequest.delete({ where: { id } });
  await withdrawFriendRequestNotification(request.fromUserId, request.toUserId);
  return ok({ message: 'Friend request cancelled' });
}
