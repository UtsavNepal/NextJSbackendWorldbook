import { NextRequest } from 'next/server';
import { prisma } from '@/infrastructure/prisma';
import { fail, ok, requireUserId } from '@/utils/http';
import { postInclude, serializePost } from '@/utils/serializers';
import { getProfileForUser } from '@/utils/social';
import { collectImageFiles, saveUploadedFiles } from '@/utils/uploadFile';
import { censorText } from '@/utils/censorText';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const userId = await requireUserId(req);
  const viewer = userId ? await getProfileForUser(userId) : null;
  const post = await prisma.post.findUnique({ where: { id }, include: postInclude });
  if (!post) return fail('Post not found', 404);
  return ok(serializePost(post, viewer?.id));
}

async function updatePost(req: NextRequest, id: string) {
  const userId = await requireUserId(req);
  if (!userId) return fail('Unauthorized', 401);
  const profile = await getProfileForUser(userId);
  const existing = await prisma.post.findUnique({ where: { id } });
  if (!profile || !existing) return fail('Post not found', 404);
  if (existing.profileId !== profile.id) return fail('Forbidden', 403);

  const contentType = req.headers.get('content-type') || '';
  let data: {
    content?: string;
    visibility?: string;
    images?: string[];
    image?: string | null;
  } = {};
  const existingImages = (existing.images?.length ? existing.images : existing.image ? [existing.image] : []) as string[];
  if (contentType.includes('multipart/form-data')) {
    const form = await req.formData();
    data.content = censorText(String(form.get('content') || existing.content || ''));
    data.visibility = String(form.get('visibility') || existing.visibility);
    const keepRaw = String(form.get('keep_images') || '');
    let keep = existingImages;
    if (keepRaw) {
      try {
        const parsed = JSON.parse(keepRaw);
        if (Array.isArray(parsed)) keep = parsed.filter(Boolean);
      } catch {
        keep = existingImages;
      }
    }
    const uploaded = await saveUploadedFiles(collectImageFiles(form), 'posts', profile.username);
    const images = [...keep, ...uploaded];
    data.images = images;
    data.image = images[0] || null;
  } else {
    const body = await req.json();
    const images = Array.isArray(body.images)
      ? body.images
      : body.image
        ? [body.image]
        : existingImages;
    data = {
      content: censorText(body.content ?? existing.content),
      visibility: body.visibility ?? existing.visibility,
      images,
      image: images[0] || null,
    };
  }

  const updated = await prisma.post.update({
    where: { id },
    data,
    include: postInclude,
  });
  return ok(serializePost(updated, profile.id));
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
