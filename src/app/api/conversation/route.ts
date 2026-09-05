import { NextRequest } from 'next/server';
import { prisma } from '@/infrastructure/prisma';
import { fail, ok, readJson, requireUserId } from '@/utils/http';
import { conversationInclude, serializeConversation } from '@/utils/serializers';

export async function GET(req: NextRequest) {
  const userId = await requireUserId(req);
  if (!userId) return fail('Unauthorized', 401);
  const conversations = await prisma.conversation.findMany({
    where: { participants: { some: { id: userId } } },
    include: conversationInclude,
    orderBy: { updatedAt: 'desc' },
  });
  return ok(conversations.map(serializeConversation));
}

export async function POST(req: NextRequest) {
  const userId = await requireUserId(req);
  if (!userId) return fail('Unauthorized', 401);
  const body = await readJson(req);
  const participantIds = Array.from(
    new Set([userId, ...(body.participants || body.participantIds || [])].map(String))
  );
  const conversation = await prisma.conversation.create({
    data: {
      name: body.name,
      isGroup: body.is_group ?? body.isGroup ?? participantIds.length > 2,
      participants: { connect: participantIds.map((id) => ({ id })) },
    },
    include: conversationInclude,
  });
  return ok(serializeConversation(conversation), 201);
}
