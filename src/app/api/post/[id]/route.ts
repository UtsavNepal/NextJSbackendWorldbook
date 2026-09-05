import { NextRequest } from 'next/server';
import { prisma } from '@/infrastructure/prisma';
import { fail, ok, requireUserId } from '@/utils/http';
import { postInclude, serializePost } from '@/utils/serializers';
import { getProfileForUser } from '@/utils/social';
import { saveUploadedFile } from '@/utils/uploadFile';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const post = await prisma.post.findUnique({ where: { id }, include: postInclude });
  if (!post) return fail('Post not found', 404);
  return ok(serializePost(post));
}

async function updatePost(req: NextRequest, id: string) {
  const userId = await requireUserId(req);
  if (!userId) return fail('Unauthorized', 401);
  const profile = await getProfileForUser(userId);
  const existing = await prisma.post.findUnique({ where: { id } });
  if (!profile || !existing) return fail('Post not found', 404);
  if (existing.profileId !== profile.id) return fail('Forbidden', 403);

  const contentType = req.headers.get('content-type') || '';
  let data: any = {};
  if (contentType.includes('multipart/form-data')) {
    const form = await req.formData();
    data.content = String(form.get('content') || existing.content || '');
    data.visibility = String(form.get('visibility') || existing.visibility);
    const file = form.get('image');
    if (file instanceof File && file.size > 0) {
      data.image = await saveUploadedFile(file, 'posts', profile.username);
    }
  } else {
    const body = await req.json();
    data = {
      content: body.content ?? existing.content,
      visibility: body.visibility ?? existing.visibility,
      image: body.image ?? existing.image,
    };
  }

  const updated = await prisma.post.update({
    where: { id },
    data,
    include: postInclude,
  });
  return ok(serializePost(updated));
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return updatePost(req, id);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return updatePost(req, id);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const userId = await requireUserId(req);
  if (!userId) return fail('Unauthorized', 401);
  const { id } = await params;
  const profile = await getProfileForUser(userId);
  const existing = await prisma.post.findUnique({ where: { id } });
  if (!profile || !existing) return fail('Post not found', 404);
  if (existing.profileId !== profile.id) return fail('Forbidden', 403);
  await prisma.post.delete({ where: { id } });
  await prisma.profile.update({
    where: { id: profile.id },
    data: { totalPosts: { decrement: 1 } },
  });
  return ok({ success: true });
}
