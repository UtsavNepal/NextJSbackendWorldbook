import { NextRequest } from 'next/server';
import { prisma } from '@/infrastructure/prisma';
import { fail, ok, requireUserId } from '@/utils/http';
import { postInclude, serializePost } from '@/utils/serializers';
import { getProfileForUser } from '@/utils/social';

export async function GET(req: NextRequest) {
  const userId = await requireUserId(req);
  if (!userId) return fail('Unauthorized', 401);
  const profile = await getProfileForUser(userId);
  if (!profile) return ok([]);

  const friendships = await prisma.friendship.findMany({
    where: { OR: [{ user1Id: userId }, { user2Id: userId }] },
  });
  const friendUserIds = friendships.map((f) => (f.user1Id === userId ? f.user2Id : f.user1Id));
  const friendProfiles = await prisma.profile.findMany({
    where: { userId: { in: friendUserIds } },
  });
  const friendProfileIds = friendProfiles.map((p) => p.id);
  const following = await prisma.follow.findMany({ where: { followerId: profile.id } });
  const followingIds = following.map((f) => f.followingId);

  const posts = await prisma.post.findMany({
    where: {
      OR: [
        { visibility: 'public' },
        { profileId: profile.id },
        { taggedProfiles: { some: { id: profile.id } } },
        { profileId: { in: friendProfileIds }, visibility: { in: ['authenticated', 'public'] } },
        { profileId: { in: followingIds }, visibility: { in: ['authenticated', 'public'] } },
      ],
    },
    include: postInclude,
    orderBy: { createdAt: 'desc' },
  });
  return ok(posts.map((post) => serializePost(post, profile.id)));
}
