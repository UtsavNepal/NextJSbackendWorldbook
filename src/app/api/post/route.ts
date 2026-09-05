import { NextRequest } from 'next/server';
import { prisma } from '@/infrastructure/prisma';
import { fail, ok, requireUserId } from '@/utils/http';
import { postInclude, serializePost } from '@/utils/serializers';
import { getProfileForUser } from '@/utils/social';
import { saveUploadedFile } from '@/utils/uploadFile';

export async function GET(req: NextRequest) {
  const userId = await requireUserId(req);
  if (!userId) return fail('Unauthorized', 401);
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  if (id) {
    const post = await prisma.post.findUnique({ where: { id }, include: postInclude });
    if (!post) return fail('Post not found', 404);
    return ok(serializePost(post));
  }
  const posts = await prisma.post.findMany({
    include: postInclude,
    orderBy: { createdAt: 'desc' },
  });
  return ok(posts.map(serializePost));
}

export async function POST(req: NextRequest) {
  const userId = await requireUserId(req);
  if (!userId) return fail('Unauthorized', 401);
  const profile = await getProfileForUser(userId);
  if (!profile) return fail('Profile not found', 404);

  const contentType = req.headers.get('content-type') || '';
  let content = '';
  let visibility = 'public';
  let image: string | undefined;
  let taggedProfiles: string[] = [];

  if (contentType.includes('multipart/form-data')) {
    const form = await req.formData();
    content = String(form.get('content') || '');
    visibility = String(form.get('visibility') || 'public');
    const file = form.get('image');
    if (file instanceof File && file.size > 0) {
      image = await saveUploadedFile(file, 'posts', profile.username);
    }
  } else {
    const body = await req.json();
    content = body.content || '';
    visibility = body.visibility || 'public';
    image = body.image;
    taggedProfiles = body.taggedProfiles || body.tagged_profiles || [];
  }

  const post = await prisma.post.create({
    data: {
      profileId: profile.id,
      content,
      visibility,
      image,
      taggedProfiles: taggedProfiles.length
        ? { connect: taggedProfiles.map((id: string) => ({ id })) }
        : undefined,
    },
    include: postInclude,
  });
  await prisma.profile.update({
    where: { id: profile.id },
    data: { totalPosts: { increment: 1 } },
  });
  return ok(serializePost(post), 201);
}
