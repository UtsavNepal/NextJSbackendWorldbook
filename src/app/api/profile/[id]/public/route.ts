import { NextRequest } from 'next/server';
import { prisma } from '@/infrastructure/prisma';
import { fail, ok } from '@/utils/http';
import { profileInclude, serializeProfile } from '@/utils/serializers';
import { resolveProfileId } from '@/utils/social';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const profileId = await resolveProfileId(id);
  if (!profileId) return fail('Profile not found', 404);
  const profile = await prisma.profile.findUnique({
    where: { id: profileId },
    include: profileInclude,
  });
  return ok(serializeProfile(profile, { withPosts: true }));
}
