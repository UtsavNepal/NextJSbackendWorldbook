import { NextRequest } from 'next/server';
import { prisma } from '@/infrastructure/prisma';
import { fail, ok, requireUserId } from '@/utils/http';
import { profileInclude, serializeProfile } from '@/utils/serializers';
import { getProfileForUser } from '@/utils/social';
import { saveUploadedFile } from '@/utils/uploadFile';

export async function POST(req: NextRequest) {
  const userId = await requireUserId(req);
  if (!userId) return fail('Unauthorized', 401);
  const profile = await getProfileForUser(userId);
  if (!profile) return fail('Profile not found', 404);
  const form = await req.formData();
  const file = form.get('profile_picture') || form.get('file') || form.get('image');
  if (!(file instanceof File) || file.size === 0) return fail('No file uploaded');
  const url = await saveUploadedFile(file, 'profile_pictures', profile.username);
  const updated = await prisma.profile.update({
    where: { id: profile.id },
    data: { profilePicture: url },
    include: profileInclude,
  });
  await prisma.profilePictureHistory.create({
    data: { profileId: profile.id, profilePicture: url },
  });
  return ok(serializeProfile(updated, { withPosts: true }));
}
