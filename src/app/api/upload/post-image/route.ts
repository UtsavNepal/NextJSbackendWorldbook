import { NextRequest } from 'next/server';
import { fail, ok, requireUserId } from '@/utils/http';
import { getProfileForUser } from '@/utils/social';
import { saveUploadedFile } from '@/utils/uploadFile';
import { ERRORS } from '@/constants/errors';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const userId = await requireUserId(req);
    if (!userId) return fail(ERRORS.UNAUTHORIZED, 401);
    const profile = await getProfileForUser(userId);
    if (!profile) return fail(ERRORS.profile.notFound, 404);
    const form = await req.formData();
    const file = form.get('image') || form.get('file');
    if (!(file instanceof File) || file.size === 0) return fail(ERRORS.upload.noFile);
    const url = await saveUploadedFile(file, 'posts', profile.username);
    return ok({ url });
  } catch (error) {
    const message = error instanceof Error ? error.message : ERRORS.upload.failed;
    return fail(message, 500);
  }
}
