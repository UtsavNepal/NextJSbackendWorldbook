import { NextRequest } from 'next/server';
import { prisma } from '@/infrastructure/prisma';
import { fail, ok, requireUserId } from '@/utils/http';
import { serializeMessage } from '@/utils/serializers';
import { saveUploadedFile } from '@/utils/uploadFile';

const messageInclude = {
  sender: { include: { profile: true } },
  reactions: { include: { user: { include: { profile: true } } } },
};

export async function GET(req: NextRequest) {
  const userId = await requireUserId(req);
  if (!userId) return fail('Unauthorized', 401);
  const conversationId = new URL(req.url).searchParams.get('conversation')
    || new URL(req.url).searchParams.get('conversationId');
  if (!conversationId) return fail('Missing conversation');
  const conversation = await prisma.conversation.findFirst({
    where: { id: conversationId, participants: { some: { id: userId } } },
  });
  if (!conversation) return fail('Conversation not found', 404);
  const messages = await prisma.message.findMany({
    where: { conversationId },
    include: messageInclude,
    orderBy: { createdAt: 'asc' },
  });
  return ok(messages.map(serializeMessage));
}

export async function POST(req: NextRequest) {
  const userId = await requireUserId(req);
  if (!userId) return fail('Unauthorized', 401);
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

  if (!conversationId) return fail('Missing conversationId');
  const conversation = await prisma.conversation.findFirst({
    where: { id: conversationId, participants: { some: { id: userId } } },
  });
  if (!conversation) return fail('Conversation not found', 404);

  const message = await prisma.message.create({
    data: {
      conversationId,
      senderId: userId,
      text,
      gifUrl,
      imageUrl,
    },
    include: messageInclude,
  });
  await prisma.conversation.update({
    where: { id: conversationId },
    data: { updatedAt: new Date() },
  });
  return ok(serializeMessage(message), 201);
}
