import { NextRequest } from 'next/server';
import { prisma } from '@/infrastructure/prisma';
import { fail, ok, readJson, requireUserId } from '@/utils/http';
import { notificationInclude, serializeNotification } from '@/utils/serializers';
import { getProfileForUser } from '@/utils/social';
import { ERRORS } from '@/constants/errors';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const userId = await requireUserId(req);
  if (!userId) return fail(ERRORS.UNAUTHORIZED, 401);
  const profile = await getProfileForUser(userId);
  if (!profile) return fail(ERRORS.profile.notFound, 404);
  const { id } = await params;
  const body = await readJson(req);
  const existing = await prisma.notification.findUnique({ where: { id } });
  if (!existing || existing.recipientId !== profile.id) return fail(ERRORS.notification.notFound, 404);
  const updated = await prisma.notification.update({
    where: { id },
    data: { isRead: body.is_read ?? body.isRead ?? true },
    include: notificationInclude,
  });
  return ok(serializeNotification(updated));
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const userId = await requireUserId(req);
  if (!userId) return fail(ERRORS.UNAUTHORIZED, 401);
  const profile = await getProfileForUser(userId);
  if (!profile) return fail(ERRORS.profile.notFound, 404);
  const { id } = await params;
  const existing = await prisma.notification.findUnique({ where: { id } });
  if (!existing || existing.recipientId !== profile.id) return fail(ERRORS.notification.notFound, 404);
  await prisma.notification.delete({ where: { id } });
  return ok({ success: true });
}
