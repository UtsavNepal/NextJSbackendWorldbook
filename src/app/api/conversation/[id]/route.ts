import { NextRequest } from 'next/server';
import { prisma } from '@/infrastructure/prisma';
import { fail, ok, requireUserId } from '@/utils/http';
import { conversationInclude, serializeConversation } from '@/utils/serializers';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const userId = await requireUserId(req);
  if (!userId) return fail('Unauthorized', 401);
  const { id } = await params;
  const conversation = await prisma.conversation.findFirst({
    where: { id, participants: { some: { id: userId } } },
    include: conversationInclude,
  });
  if (!conversation) return fail('Conversation not found', 404);
  return ok(serializeConversation(conversation));
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const userId = await requireUserId(req);
  if (!userId) return fail('Unauthorized', 401);
  const { id } = await params;
  const conversation = await prisma.conversation.findFirst({
    where: { id, participants: { some: { id: userId } } },
  });
  if (!conversation) return fail('Conversation not found', 404);
  await prisma.conversation.delete({ where: { id } });
  return ok({ success: true });
}
