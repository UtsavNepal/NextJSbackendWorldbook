import { NextRequest } from 'next/server';
import { prisma } from '@/infrastructure/prisma';
import { fail, ok, readJson, requireUserId } from '@/utils/http';
import { notificationInclude, serializeNotification } from '@/utils/serializers';
import { getProfileForUser } from '@/utils/social';

export async function GET(req: NextRequest) {
  const userId = await requireUserId(req);
  if (!userId) return fail('Unauthorized', 401);
  const profile = await getProfileForUser(userId);
  if (!profile) return ok([]);
  const notifications = await prisma.notification.findMany({
    where: { recipientId: profile.id },
    include: notificationInclude,
    orderBy: { timestamp: 'desc' },
  });
  return ok(notifications.map(serializeNotification));
}

export async function PATCH(req: NextRequest) {
  const userId = await requireUserId(req);
  if (!userId) return fail('Unauthorized', 401);
  const profile = await getProfileForUser(userId);
  if (!profile) return fail('Profile not found', 404);
  const body = await readJson(req);
  if (body.all_read || body.allRead) {
    await prisma.notification.updateMany({
      where: { recipientId: profile.id },
      data: { isRead: true },
    });
  }
  return ok({ message: 'Notifications updated' });
}
