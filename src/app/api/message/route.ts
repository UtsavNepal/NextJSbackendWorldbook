import { NextRequest } from 'next/server';
import { prisma } from '@/infrastructure/prisma';
import { fail, ok, requireUserId } from '@/utils/http';
import { serializeMessage } from '@/utils/serializers';
import { saveUploadedFile } from '@/utils/uploadFile';
import { censorText } from '@/utils/censorText';
import { areFriends, notifyMessageRequest } from '@/utils/conversationRequest';
import { ERRORS } from '@/constants/errors';

const messageInclude = {
  sender: { include: { profile: true } },
  reactions: { include: { user: { include: { profile: true } } } },
};

export async function GET(req: NextRequest) {
  const userId = await requireUserId(req);
  if (!userId) return fail(ERRORS.UNAUTHORIZED, 401);
  const conversationId = new URL(req.url).searchParams.get('conversation')
    || new URL(req.url).searchParams.get('conversationId');
  if (!conversationId) return fail(ERRORS.validation.missingConversation);
  const conversation = await prisma.conversation.findFirst({
    where: { id: conversationId, participants: { some: { id: userId } } },
  });
  if (!conversation) return fail(ERRORS.chat.conversationNotFound, 404);
  const messages = await prisma.message.findMany({
    where: { conversationId },
    include: messageInclude,
    orderBy: { createdAt: 'asc' },
  });
  const visible = messages.filter((message) => !((message as { hiddenFor?: string[] }).hiddenFor ?? []).includes(userId));
  return ok(visible.map(serializeMessage));
}

export async function POST(req: NextRequest) {
  const userId = await requireUserId(req);
  if (!userId) return fail(ERRORS.UNAUTHORIZED, 401);
  const contentType = req.headers.get('content-type') || '';
  let conversationId = '';
  let text: string | undefined;
  let gifUrl: string | undefined;
  let imageUrl: string | undefined;

  if (contentType.includes('multipart/form-data')) {
    const form = await req.formData();
    conversationId = String(form.get('conversation') || form.get('conversationId') || '');
    text = String(form.get('text') || '') || undefined;
    gifUrl = String(form.get('gif_url') || form.get('gifUrl') || '') || undefined;
    const file = form.get('image');
    if (file instanceof File && file.size > 0) {
      imageUrl = await saveUploadedFile(file, 'messages', userId);
    }
  } else {
    const body = await req.json();
    conversationId = body.conversationId || body.conversation;
    text = body.text;
    gifUrl = body.gif_url || body.gifUrl;
    imageUrl = body.imageUrl || body.image;
  }

  if (!conversationId) return fail(ERRORS.validation.missingConversation);
  const conversation = await prisma.conversation.findFirst({
    where: { id: conversationId, participants: { some: { id: userId } } },
    include: { participants: true },
  });
  if (!conversation) return fail(ERRORS.chat.conversationNotFound, 404);

  const otherId = conversation.participants.find((participant) => participant.id !== userId)?.id;
  const status = conversation.requestStatus || 'accepted';
  if (otherId && await areFriends(userId, otherId) && status === 'pending') {
    await prisma.conversation.update({
      where: { id: conversationId },
      data: { requestStatus: 'accepted' },
    });
  } else if (status === 'pending' && conversation.requestedById && conversation.requestedById !== userId) {
    return fail(ERRORS.chat.acceptRequestToReply, 403);
  } else if (status === 'declined' && conversation.requestedById && conversation.requestedById !== userId) {
    await prisma.conversation.update({
      where: { id: conversationId },
      data: { requestStatus: 'accepted' },
    });
  }

  const message = await prisma.message.create({
    data: {
      conversationId,
      senderId: userId,
      text: text ? censorText(text) : text,
      gifUrl,
      imageUrl,
    },
    include: messageInclude,
  });
  await prisma.conversation.update({
    where: { id: conversationId },
    data: { updatedAt: new Date() },
  });
  if (status === 'pending' && conversation.requestedById === userId && otherId) {
    await notifyMessageRequest(userId, otherId);
  }
  return ok(serializeMessage(message), 201);
}
