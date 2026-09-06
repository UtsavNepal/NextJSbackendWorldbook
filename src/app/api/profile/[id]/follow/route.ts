import { NextRequest } from 'next/server';
import { prisma } from '@/infrastructure/prisma';
import { fail, ok, requireUserId } from '@/utils/http';
import { getProfileForUser, notify, resolveProfileId, withdrawNotification } from '@/utils/social';
import { ERRORS } from '@/constants/errors';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const userId = await requireUserId(req);
  if (!userId) return fail(ERRORS.UNAUTHORIZED, 401);
  const { id } = await params;
  const actor = await getProfileForUser(userId);
  const profileId = await resolveProfileId(id);
  if (!actor || !profileId) return fail(ERRORS.profile.notFound, 404);
  if (actor.id === profileId) return fail(ERRORS.profile.cannotFollowSelf);
  await prisma.follow.upsert({
    where: { followerId_followingId: { followerId: actor.id, followingId: profileId } },
    create: { followerId: actor.id, followingId: profileId },
    update: {},
  });
  await notify({
    recipientId: profileId,
    actorId: actor.id,
    notificationType: 'follow',
    message: `${actor.username} started following you`,
  });
  return ok({ message: 'Followed successfully' });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const userId = await requireUserId(req);
  if (!userId) return fail(ERRORS.UNAUTHORIZED, 401);
  const { id } = await params;
  const actor = await getProfileForUser(userId);
  const profileId = await resolveProfileId(id);
  if (!actor || !profileId) return fail(ERRORS.profile.notFound, 404);
  await prisma.follow.deleteMany({
    where: { followerId: actor.id, followingId: profileId },
  });
  await withdrawNotification({
    recipientId: profileId,
    actorId: actor.id,
    notificationType: 'follow',
  });
  return ok({ message: 'Unfollowed successfully' });
}
