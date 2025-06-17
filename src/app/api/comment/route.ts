import { NextRequest, NextResponse } from 'next/server';
import { commentService } from '../../../application/commentService';
import { Comment } from '../../../domain/comment';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  if (id) {
    const comment = await commentService.getCommentById(id);
    if (!comment) return NextResponse.json({ error: 'Comment not found' }, { status: 404 });
    return NextResponse.json(comment);
  }
  const { pathname } = new URL(req.url);
  const match = pathname.match(/\/post\/(.+)\/comments$/);
  if (match) {
    const postId = match[1];
    // Fetch all comments for the post
    const comments: Comment[] = await commentService.getCommentsByPostId(postId);
    // Build nested structure
    function nest(comments: Comment[]): Comment[] {
      const map: { [id: string]: Comment & { replies: Comment[] } } = {};
      const roots: (Comment & { replies: Comment[] })[] = [];
      comments.forEach((c: Comment) => { map[c.id] = { ...c, replies: [] }; });
      comments.forEach((c: Comment) => {
        if (c.parentId && map[c.parentId]) map[c.parentId].replies.push(map[c.id]);
        else roots.push(map[c.id]);
      });
      return roots;
    }
    return NextResponse.json(nest(comments));
  }
  // List all comments if no id is provided
  const comments = await commentService.listComments();
  return NextResponse.json(comments);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  if (!body.profileId || !body.postId || !body.comment) {
    return NextResponse.json({ error: 'Missing profileId, postId, or comment' }, { status: 400 });
  }
  try {
    const comment = await commentService.createComment({
      profileId: body.profileId,
      postId: body.postId,
      comment: body.comment,
      parentId: body.parentId ?? null,
    });
    return NextResponse.json(comment, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to create comment' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });
  const body = await req.json();
  try {
    const updated = await commentService.updateComment(id, body);
    return NextResponse.json(updated);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to update comment' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });
  try {
    await commentService.deleteComment(id);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to delete comment' }, { status: 500 });
  }
} 