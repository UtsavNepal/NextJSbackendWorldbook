import { NextRequest } from 'next/server';
import { prisma } from '@/infrastructure/prisma';
import { fail, ok, requireUserId } from '@/utils/http';
import { postInclude, serializePost } from '@/utils/serializers';
import { getProfileForUser, notify, withdrawNotification } from '@/utils/social';
import { ERRORS } from '@/constants/errors';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const userId = await requireUserId(req);
  if (!userId) return fail(ERRORS.UNAUTHORIZED, 401);
  const { id } = await params;
  const profile = await getProfileForUser(userId);
  if (!profile) return fail(ERRORS.profile.notFound, 404);
  const existing = await prisma.post.findUnique({
    where: { id },
    include: { likes: true },
  });
  if (!existing) return fail(ERRORS.post.notFound, 404);

  const alreadyLiked = existing.likes.some((like) => like.id === profile.id);
  const updated = await prisma.post.update({
    where: { id },
    data: alreadyLiked
      ? { likes: { disconnect: { id: profile.id } } }
      : { likes: { connect: { id: profile.id } } },
    include: postInclude,
  });

  if (alreadyLiked) {
    await withdrawNotification({
      recipientId: existing.profileId,
      actorId: profile.id,
      notificationType: 'like',
      relatedPostId: id,
    });
  } else {
    await notify({
      recipientId: existing.profileId,
      actorId: profile.id,
      notificationType: 'like',
      message: `${profile.username} liked your post`,
      relatedPostId: id,
    });
  }
  return ok(serializePost(updated, profile.id));
}
