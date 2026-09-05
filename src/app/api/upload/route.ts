import { NextRequest } from 'next/server';
import { fail, ok, requireUserId } from '@/utils/http';
import { getProfileForUser } from '@/utils/social';
import { saveUploadedFile } from '@/utils/uploadFile';

export async function POST(req: NextRequest) {
  const userId = await requireUserId(req);
  if (!userId) return fail('Unauthorized', 401);
  const profile = await getProfileForUser(userId);
  if (!profile) return fail('Profile not found', 404);
  const form = await req.formData();
  const file = form.get('file') || form.get('image') || form.get('profile_picture');
  if (!(file instanceof File) || file.size === 0) return fail('No file uploaded');
  const url = await saveUploadedFile(file, 'uploads', profile.username);
  return ok({ url });
}
