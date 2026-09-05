import { NextRequest } from 'next/server';
import { prisma } from '@/infrastructure/prisma';
import { fail, ok, readJson, requireUserId } from '@/utils/http';
import { conversationInclude, serializeConversation } from '@/utils/serializers';
import { requestFieldsForNewConversation } from '@/utils/conversationRequest';

function isVisibleToViewer(conversation: any, userId: string) {
  const status = conversation.requestStatus || 'accepted';
  if (status === 'declined' && conversation.requestedById !== userId) return false;
  return true;
}

export async function GET(req: NextRequest) {
  const userId = await requireUserId(req);
  if (!userId) return fail('Unauthorized', 401);
  const conversations = await prisma.conversation.findMany({
    where: { participants: { some: { id: userId } } },
    include: conversationInclude,
    orderBy: { updatedAt: 'desc' },
  });
  return ok(
    conversations
      .filter((conversation) => isVisibleToViewer(conversation, userId))
      .map((conversation) => serializeConversation(conversation, userId))
  );
}

export async function POST(req: NextRequest) {
  const userId = await requireUserId(req);
  if (!userId) return fail('Unauthorized', 401);
  const body = await readJson(req);
  const participantIds = Array.from(
    new Set([userId, ...(body.participants || body.participantIds || [])].map(String))
  );
  const isGroup = body.is_group ?? body.isGroup ?? participantIds.length > 2;

  if (!isGroup && participantIds.length === 2) {
    const existing = await prisma.conversation.findFirst({
      where: {
        isGroup: false,
        AND: [
          { participants: { some: { id: participantIds[0] } } },
          { participants: { some: { id: participantIds[1] } } },
        ],
      },
      include: conversationInclude,
    });
    if (existing && existing.participants.length === 2) {
      return ok(serializeConversation(existing, userId));
    }
  }

  const requestFields = await requestFieldsForNewConversation(participantIds, userId, isGroup);
  const conversation = await prisma.conversation.create({
    data: {
      name: body.name,
      isGroup,
      requestStatus: requestFields.requestStatus,
      requestedById: requestFields.requestedById,
      participants: { connect: participantIds.map((id) => ({ id })) },
    },
    include: conversationInclude,
  });
  return ok(serializeConversation(conversation, userId), 201);
}
