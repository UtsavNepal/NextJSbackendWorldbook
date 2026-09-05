import { NextRequest } from 'next/server';
import { prisma } from '@/infrastructure/prisma';
import { fail, ok, requireUserId } from '@/utils/http';
import { profileInclude, serializeProfile } from '@/utils/serializers';

export async function GET(req: NextRequest) {
  const userId = await requireUserId(req);
  if (!userId) return fail('Unauthorized', 401);
  const profile = await prisma.profile.findUnique({
    where: { userId },
    include: profileInclude,
  });
  if (!profile) return fail('Profile not found', 404);
  return ok(serializeProfile(profile, { withPosts: true, viewerProfileId: profile.id }));
}
