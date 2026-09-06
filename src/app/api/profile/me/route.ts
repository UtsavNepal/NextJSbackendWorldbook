import { NextRequest } from 'next/server';
import { prisma } from '@/infrastructure/prisma';
import { fail, ok, requireUserId } from '@/utils/http';
import { profileInclude, serializeProfile } from '@/utils/serializers';
import { ERRORS } from '@/constants/errors';

export async function GET(req: NextRequest) {
  const userId = await requireUserId(req);
  if (!userId) return fail(ERRORS.UNAUTHORIZED, 401);
  const profile = await prisma.profile.findUnique({
    where: { userId },
    include: profileInclude,
  });
  if (!profile) return fail(ERRORS.profile.notFound, 404);
  return ok(serializeProfile(profile, { withPosts: true, viewerProfileId: profile.id }));
}
