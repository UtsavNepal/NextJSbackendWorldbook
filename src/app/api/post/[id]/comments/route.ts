import { NextRequest } from 'next/server';
import { prisma } from '@/infrastructure/prisma';
import { fail, ok, readJson, requireUserId } from '@/utils/http';
import { serializeComment } from '@/utils/serializers';
import { getProfileForUser, notify } from '@/utils/social';
import { censorText } from '@/utils/censorText';

type NestedComment = NonNullable<ReturnType<typeof serializeComment>> & { replies: NestedComment[] };

function nestComments(comments: Array<{ id: string; parentId?: string | null }>) {
  const map: Record<string, NestedComment> = {};
  const roots: NestedComment[] = [];
  comments.forEach((comment) => {
    map[comment.id] = { ...serializeComment(comment), replies: [] };
  });
  comments.forEach((comment) => {
    if (comment.parentId && map[comment.parentId]) {
      map[comment.parentId].replies.push(map[comment.id]);
    } else {
      roots.push(map[comment.id]);
    }
  });
  return roots;
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const comments = await prisma.comment.findMany({
    where: { postId: id },
    include: { profile: { include: { user: true } } },
    orderBy: { createdAt: 'asc' },
  });
  return ok(nestComments(comments));
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const userId = await requireUserId(req);
  if (!userId) return fail('Unauthorized', 401);
  const { id } = await params;
  const profile = await getProfileForUser(userId);
  if (!profile) return fail('Profile not found', 404);
  const body = await readJson(req);
  if (!body.comment) return fail('Missing comment');
  const post = await prisma.post.findUnique({ where: { id } });
  if (!post) return fail('Post not found', 404);
  const comment = await prisma.comment.create({
    data: {
      profileId: profile.id,
      postId: id,
      comment: censorText(body.comment),
      parentId: body.parent || body.parentId || null,
    },
    include: { profile: { include: { user: true } } },
  });
  await notify({
    recipientId: post.profileId,
    actorId: profile.id,
    notificationType: 'comment',
    message: `${profile.username} commented on your post`,
    relatedPostId: id,
    relatedCommentId: comment.id,
  });
  return ok(serializeComment(comment), 201);
}
