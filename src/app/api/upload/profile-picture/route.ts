import { NextRequest } from 'next/server';
import { prisma } from '@/infrastructure/prisma';
import { fail, ok, requireUserId } from '@/utils/http';
import { profileInclude, serializeProfile } from '@/utils/serializers';
import { getProfileForUser } from '@/utils/social';
import { saveUploadedFile } from '@/utils/uploadFile';
import { createProfileUpdatePost } from '@/utils/profileUpdatePost';
import { ERRORS } from '@/constants/errors';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const userId = await requireUserId(req);
    if (!userId) return fail(ERRORS.UNAUTHORIZED, 401);
    const profile = await getProfileForUser(userId);
    if (!profile) return fail(ERRORS.profile.notFound, 404);
    const form = await req.formData();
    const file = form.get('profile_picture') || form.get('file') || form.get('image');
    if (!(file instanceof File) || file.size === 0) return fail(ERRORS.upload.noFile);
    const url = await saveUploadedFile(file, 'profile_pictures', profile.username);
    const updated = await prisma.profile.update({
      where: { id: profile.id },
      data: { profilePicture: url },
      include: profileInclude,
    });
    await prisma.profilePictureHistory.create({
      data: { profileId: profile.id, profilePicture: url },
    });
    await createProfileUpdatePost(profile.id, url, 'profile_picture');
    return ok(serializeProfile(updated, { withPosts: true }));
  } catch (error) {
    const message = error instanceof Error ? error.message : ERRORS.upload.failed;
    return fail(message, 500);
  }
}
