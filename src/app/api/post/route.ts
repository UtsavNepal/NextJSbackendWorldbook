import { NextRequest, NextResponse } from 'next/server';
import { postService } from '../../../application/postService';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  if (id) {
    const post = await postService.getPostById(id);
    if (!post) return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    return NextResponse.json(post);
  }
  // List all posts if no id is provided
  const posts = await postService.listPosts();
  return NextResponse.json(posts);
}

export async function POST(req: NextRequest) {
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
      // taggedProfiles and likes can be handled as needed
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
    const updated = await postService.updatePost(id, body);
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
