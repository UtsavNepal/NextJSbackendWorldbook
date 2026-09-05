import { NextRequest } from 'next/server';
import { prisma } from '@/infrastructure/prisma';
import { fail, ok, requireUserId } from '@/utils/http';
import { getProfileForUser, notify, resolveProfileId } from '@/utils/social';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const userId = await requireUserId(req);
  if (!userId) return fail('Unauthorized', 401);
  const { id } = await params;
  const actor = await getProfileForUser(userId);
  const profileId = await resolveProfileId(id);
  if (!actor || !profileId) return fail('Profile not found', 404);
  if (actor.id === profileId) return fail('Cannot follow yourself');
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
  if (!userId) return fail('Unauthorized', 401);
  const { id } = await params;
  const actor = await getProfileForUser(userId);
  const profileId = await resolveProfileId(id);
  if (!actor || !profileId) return fail('Profile not found', 404);
  await prisma.follow.deleteMany({
    where: { followerId: actor.id, followingId: profileId },
  });
  return ok({ message: 'Unfollowed successfully' });
}
