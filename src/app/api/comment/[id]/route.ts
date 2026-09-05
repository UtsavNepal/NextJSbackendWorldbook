import { NextRequest } from 'next/server';
import { prisma } from '@/infrastructure/prisma';
import { fail, ok, readJson, requireUserId } from '@/utils/http';
import { serializeComment } from '@/utils/serializers';
import { getProfileForUser } from '@/utils/social';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const userId = await requireUserId(req);
  if (!userId) return fail('Unauthorized', 401);
  const { id } = await params;
  const profile = await getProfileForUser(userId);
  const existing = await prisma.comment.findUnique({ where: { id } });
  if (!profile || !existing) return fail('Comment not found', 404);
  if (existing.profileId !== profile.id) return fail('Forbidden', 403);
  const body = await readJson(req);
  const updated = await prisma.comment.update({
    where: { id },
    data: { comment: body.comment },
    include: { profile: { include: { user: true } } },
  });
  return ok(serializeComment(updated));
}

export async function PUT(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  return PATCH(req, context);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const userId = await requireUserId(req);
  if (!userId) return fail('Unauthorized', 401);
  const { id } = await params;
  const profile = await getProfileForUser(userId);
  const existing = await prisma.comment.findUnique({ where: { id } });
  if (!profile || !existing) return fail('Comment not found', 404);
  if (existing.profileId !== profile.id) return fail('Forbidden', 403);
  await prisma.comment.delete({ where: { id } });
  return ok({ success: true });
}
