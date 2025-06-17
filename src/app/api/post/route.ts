import { NextRequest, NextResponse } from 'next/server';
import { postService } from '../../../application/postService';
import { getUserIdFromRequest } from '../../../utils/tokenUtils';

export async function GET(req: NextRequest) {
  const { searchParams, pathname } = new URL(req.url);
  const id = searchParams.get('id');
  if (pathname.endsWith('/feed')) {
    const userId = await getUserIdFromRequest(req);
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const posts = await postService.getFeedForUser(userId);
    return NextResponse.json(posts);
  }
  if (id) {
    const post = await postService.getPostById(id);
    if (!post) return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    return NextResponse.json(post);
  }
  const posts = await postService.listPosts();
  return NextResponse.json(posts);
}

export async function POST(req: NextRequest) {
  const { pathname } = new URL(req.url);
  const likeMatch = pathname.match(/\/post\/([\w-]+)\/like$/);
  const unlikeMatch = pathname.match(/\/post\/([\w-]+)\/unlike$/);
  if (likeMatch) {
    const postId = likeMatch[1];
    const userId = await getUserIdFromRequest(req);
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const updated = await postService.likePost(postId, userId);
    if (!updated) return NextResponse.json({ error: 'Post not found or like failed' }, { status: 404 });
    return NextResponse.json(updated);
  }
  if (unlikeMatch) {
    const postId = unlikeMatch[1];
    const userId = await getUserIdFromRequest(req);
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const updated = await postService.unlikePost(postId, userId);
    if (!updated) return NextResponse.json({ error: 'Post not found or unlike failed' }, { status: 404 });
    return NextResponse.json(updated);
  }
  const body = await req.json();
  if (!body.profileId) {
    return NextResponse.json({ error: 'Missing profileId' }, { status: 400 });
  }
  try {
    const post = await postService.createPost({
      profileId: body.profileId,
      content: body.content,
      image: body.image,
      visibility: body.visibility ?? 'public',
      taggedProfiles: body.taggedProfiles ?? [],
    });
    return NextResponse.json(post, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to create post' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });
  const body = await req.json();
  try {
    const updated = await postService.updatePost(id, {
      ...body,
      taggedProfiles: body.taggedProfiles ?? [],
    });
    return NextResponse.json(updated);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to update post' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });
  try {
    await postService.deletePost(id);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to delete post' }, { status: 500 });
  }
}
