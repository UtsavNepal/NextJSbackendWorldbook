import { NextRequest } from 'next/server';
import { prisma } from '@/infrastructure/prisma';
import { fail, ok, readJson, requireUserId } from '@/utils/http';
import { serializeMessage } from '@/utils/serializers';

const messageInclude = {
  sender: { include: { profile: true } },
  reactions: { include: { user: { include: { profile: true } } } },
};

async function getParticipantMessage(id: string, userId: string) {
  return prisma.message.findFirst({
    where: { id, conversation: { participants: { some: { id: userId } } } },
    include: messageInclude,
  });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const userId = await requireUserId(req);
  if (!userId) return fail('Unauthorized', 401);
  const { id } = await params;
  const body = await readJson(req);
  const action = String(body.action || '');
  const existing = await getParticipantMessage(id, userId);
  if (!existing) return fail('Message not found', 404);

  if (action === 'unsend') {
    if (existing.senderId !== userId) return fail('Only the sender can unsend this message', 403);
    const updated = await prisma.message.update({
      where: { id },
      data: { deleted: true, text: null, imageUrl: null, gifUrl: null },
      include: messageInclude,
    });
    return ok(serializeMessage(updated));
  }

  if (action === 'hide') {
    const hiddenFor = Array.from(new Set([...(existing.hiddenFor ?? []), userId]));
    await prisma.message.update({
      where: { id },
      data: { hiddenFor },
    });
    return ok({ id, hidden: true });
  }

  return fail('Invalid action');
}

export async function PUT(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  return PATCH(req, context);
}
