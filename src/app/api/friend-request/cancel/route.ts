import { NextRequest } from 'next/server';
import { prisma } from '@/infrastructure/prisma';
import { fail, ok, readJson, requireUserId } from '@/utils/http';

export async function POST(req: NextRequest) {
  const userId = await requireUserId(req);
  if (!userId) return fail('Unauthorized', 401);
  const body = await readJson(req);
  const requestId = body.request_id || body.requestId || body.id;
  if (!requestId) return fail('Missing request_id');
  const request = await prisma.friendRequest.findUnique({ where: { id: requestId } });
  if (!request || request.fromUserId !== userId) return fail('Friend request not found', 404);
  await prisma.friendRequest.delete({ where: { id: requestId } });
  return ok({ message: 'Friend request cancelled' });
}

export async function DELETE(req: NextRequest) {
  return POST(req);
}
