import { prisma } from '@/infrastructure/prisma';

export async function uniqueUsername(email: string) {
  const base = (email.split('@')[0] || 'user').replace(/[^a-zA-Z0-9_]/g, '').slice(0, 20) || 'user';
  let username = base;
  let suffix = 0;
  while (await prisma.profile.findUnique({ where: { username } })) {
    suffix += 1;
    username = `${base}${suffix}`;
  }
  return username;
}

export async function getProfileForUser(userId: string) {
  return prisma.profile.findUnique({
    where: { userId },
    include: { user: true },
  });
}

export async function resolveProfileId(id: string) {
  const byProfile = await prisma.profile.findUnique({ where: { id } });
  if (byProfile) return byProfile.id;
  const byUser = await prisma.profile.findUnique({ where: { userId: id } });
  return byUser?.id ?? null;
}

export async function notify(data: {
  recipientId: string;
  actorId: string;
  notificationType: string;
  message: string;
  relatedPostId?: string;
  relatedCommentId?: string;
}) {
  if (data.recipientId === data.actorId) return;
  await prisma.notification.create({
    data: {
      recipientId: data.recipientId,
      actorId: data.actorId,
      notificationType: data.notificationType,
      message: data.message,
      relatedPostId: data.relatedPostId,
      relatedCommentId: data.relatedCommentId,
      isRead: false,
    },
  });
}
