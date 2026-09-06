import { NextRequest } from 'next/server';
import { prisma } from '@/infrastructure/prisma';
import { fail, ok, requireUserId } from '@/utils/http';
import { profileInclude, serializeProfile } from '@/utils/serializers';
import { getFriendshipStatus, getViewerProfileId, resolveProfileId } from '@/utils/social';
import { ERRORS } from '@/constants/errors';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const profileId = await resolveProfileId(id);
  if (!profileId) return fail(ERRORS.profile.notFound, 404);
  const viewerUserId = await requireUserId(req);
  const viewerProfileId = await getViewerProfileId(viewerUserId);
  const profile = await prisma.profile.findUnique({
    where: { id: profileId },
    include: profileInclude,
  });
  if (!profile) return fail(ERRORS.profile.notFound, 404);
  const friendship = await getFriendshipStatus(viewerUserId, profile.userId);
  return ok(serializeProfile(profile, { withPosts: true, viewerProfileId, friendship }));
}
