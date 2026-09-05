import { NextRequest } from 'next/server';
import { prisma } from '@/infrastructure/prisma';
import { fail, ok, readJson, requireUserId } from '@/utils/http';
import { profileInclude, serializeProfile } from '@/utils/serializers';
import { getProfileForUser, getViewerProfileId } from '@/utils/social';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  if (id) {
    const profile = await prisma.profile.findFirst({
      where: { OR: [{ id }, { userId: id }] },
      include: profileInclude,
    });
    if (!profile) return fail('Profile not found', 404);
    const viewerProfileId = await getViewerProfileId(await requireUserId(req));
    return ok(serializeProfile(profile, { withPosts: true, viewerProfileId }));
  }
  const userId = await requireUserId(req);
  if (!userId) return fail('Unauthorized', 401);
  const profiles = await prisma.profile.findMany({
    where: { userId: { not: userId } },
    include: { user: true, followers: true, following: true },
  });
  return ok(profiles.map((profile) => serializeProfile(profile)));
}

export async function POST(req: NextRequest) {
  const userId = await requireUserId(req);
  if (!userId) return fail('Unauthorized', 401);
  const body = await readJson(req);
  const existing = await getProfileForUser(userId);
  if (existing) return ok(serializeProfile(existing));
  if (!body.username) return fail('Missing username');
  const profile = await prisma.profile.create({
    data: {
      userId,
      username: body.username,
      bio: body.bio ?? '',
      profilePicture: body.profile_picture ?? body.profilePicture ?? null,
    },
    include: profileInclude,
  });
  return ok(serializeProfile(profile, { withPosts: true }), 201);
}

async function updateCurrentProfile(req: NextRequest) {
  const userId = await requireUserId(req);
  if (!userId) return fail('Unauthorized', 401);
  const profile = await getProfileForUser(userId);
  if (!profile) return fail('Profile not found', 404);
  const body = await readJson(req);
  const updated = await prisma.profile.update({
    where: { id: profile.id },
    data: {
      username: body.username ?? undefined,
      bio: body.bio ?? undefined,
      profilePicture: body.profile_picture === undefined ? undefined : body.profile_picture,
      coverPhoto: body.cover_photo === undefined ? undefined : body.cover_photo,
    },
    include: profileInclude,
  });
  if (body.gender) {
    await prisma.user.update({ where: { id: userId }, data: { gender: body.gender } });
  }
  return ok(serializeProfile(updated, { withPosts: true }));
}

export async function PUT(req: NextRequest) {
  return updateCurrentProfile(req);
}

export async function PATCH(req: NextRequest) {
  return updateCurrentProfile(req);
}

export async function DELETE(req: NextRequest) {
  const userId = await requireUserId(req);
  if (!userId) return fail('Unauthorized', 401);
  const profile = await prisma.profile.findUnique({ where: { userId } });
  if (profile) {
    await prisma.notification.deleteMany({
      where: { OR: [{ recipientId: profile.id }, { actorId: profile.id }] },
    });
    await prisma.comment.deleteMany({ where: { profileId: profile.id } });
    await prisma.post.deleteMany({ where: { profileId: profile.id } });
    await prisma.follow.deleteMany({
      where: { OR: [{ followerId: profile.id }, { followingId: profile.id }] },
    });
    await prisma.profilePictureHistory.deleteMany({ where: { profileId: profile.id } });
    await prisma.profile.delete({ where: { id: profile.id } });
  }
  await prisma.friendRequest.deleteMany({
    where: { OR: [{ fromUserId: userId }, { toUserId: userId }] },
  });
  await prisma.friendship.deleteMany({
    where: { OR: [{ user1Id: userId }, { user2Id: userId }] },
  });
  await prisma.reaction.deleteMany({ where: { userId } });
  await prisma.message.deleteMany({ where: { senderId: userId } });
  await prisma.user.delete({ where: { id: userId } });
  return ok({ success: true, message: 'Account deleted' });
}
