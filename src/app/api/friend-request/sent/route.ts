import { NextRequest } from 'next/server';
import { prisma } from '@/infrastructure/prisma';
import { fail, ok, requireUserId } from '@/utils/http';
import { friendRequestInclude, serializeFriendRequest } from '@/utils/serializers';
import { ERRORS } from '@/constants/errors';

export async function GET(req: NextRequest) {
  const userId = await requireUserId(req);
  if (!userId) return fail(ERRORS.UNAUTHORIZED, 401);
  const requests = await prisma.friendRequest.findMany({
    where: { fromUserId: userId, status: 'pending' },
    include: friendRequestInclude,
    orderBy: { createdAt: 'desc' },
  });
  return ok(requests.map(serializeFriendRequest));
}
