import { NextRequest } from 'next/server';
import { prisma } from '@/infrastructure/prisma';
import { fail, ok, readJson, requireUserId } from '@/utils/http';
import { serializeMessage } from '@/utils/serializers';
import { ERRORS } from '@/constants/errors';

export async function GET(req: NextRequest) {
  const userId = await requireUserId(req);
  if (!userId) return fail(ERRORS.UNAUTHORIZED, 401);
  const messageId = new URL(req.url).searchParams.get('message')
    || new URL(req.url).searchParams.get('messageId');
  if (!messageId) return fail(ERRORS.validation.missingMessage);
  const reactions = await prisma.reaction.findMany({
    where: { messageId },
    include: { user: { include: { profile: true } } },
  });
  return ok(reactions.map((reaction) => ({
    id: reaction.id,
    user: reaction.user,
    message: reaction.messageId,
    emoji: reaction.emoji,
    created_at: reaction.createdAt,
  })));
}

export async function POST(req: NextRequest) {
  const userId = await requireUserId(req);
  if (!userId) return fail(ERRORS.UNAUTHORIZED, 401);
  const body = await readJson(req);
  const messageId = body.message || body.messageId;
  const emoji = body.emoji;
  if (!messageId || !emoji) return fail(ERRORS.validation.missingMessageOrEmoji);
  await prisma.reaction.upsert({
    where: { messageId_userId_emoji: { messageId, userId, emoji } },
    create: { messageId, userId, emoji },
    update: {},
  });
  const message = await prisma.message.findUnique({
    where: { id: messageId },
    include: {
      sender: { include: { profile: true } },
      reactions: { include: { user: { include: { profile: true } } } },
    },
  });
  return ok(serializeMessage(message), 201);
}
