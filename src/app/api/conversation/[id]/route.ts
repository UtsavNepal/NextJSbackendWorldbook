import { NextRequest } from 'next/server';
import { prisma } from '@/infrastructure/prisma';
import { fail, ok, readJson, requireUserId } from '@/utils/http';
import { conversationInclude, serializeConversation } from '@/utils/serializers';
import { withdrawMessageRequestNotification } from '@/utils/conversationRequest';
import { ERRORS } from '@/constants/errors';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const userId = await requireUserId(req);
  if (!userId) return fail(ERRORS.UNAUTHORIZED, 401);
  const { id } = await params;
  const conversation = await prisma.conversation.findFirst({
    where: { id, participants: { some: { id: userId } } },
    include: conversationInclude,
  });
  if (!conversation) return fail(ERRORS.chat.conversationNotFound, 404);
  return ok(serializeConversation(conversation, userId));
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const userId = await requireUserId(req);
  if (!userId) return fail(ERRORS.UNAUTHORIZED, 401);
  const { id } = await params;
  const body = await readJson(req);
  const action = String(body.action || '');
  const conversation = await prisma.conversation.findFirst({
    where: { id, participants: { some: { id: userId } } },
    include: { participants: true },
  });
  if (!conversation) return fail(ERRORS.chat.conversationNotFound, 404);
  if ((conversation.requestStatus || 'accepted') !== 'pending') {
    return fail(ERRORS.chat.notPendingRequest);
  }
  if (conversation.requestedById === userId) {
    return fail(ERRORS.chat.onlyRecipientCanRespond, 403);
  }

  const senderId = conversation.requestedById;
  if (action === 'accept') {
    const updated = await prisma.conversation.update({
      where: { id },
      data: { requestStatus: 'accepted' },
      include: conversationInclude,
    });
    if (senderId) await withdrawMessageRequestNotification(senderId, userId);
    return ok(serializeConversation(updated, userId));
  }
  if (action === 'reject') {
    await prisma.conversation.update({
      where: { id },
      data: { requestStatus: 'declined' },
    });
    if (senderId) await withdrawMessageRequestNotification(senderId, userId);
    return ok({ id, rejected: true });
  }
  return fail(ERRORS.chat.invalidAction);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const userId = await requireUserId(req);
  if (!userId) return fail(ERRORS.UNAUTHORIZED, 401);
  const { id } = await params;
  const conversation = await prisma.conversation.findFirst({
    where: { id, participants: { some: { id: userId } } },
  });
  if (!conversation) return fail(ERRORS.chat.conversationNotFound, 404);
  await prisma.conversation.delete({ where: { id } });
  return ok({ success: true });
}
