import { NextRequest, NextResponse } from 'next/server';
import { followService } from '../../../application/followService';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  if (id) {
    const follow = await followService.getFollowById(id);
    if (!follow) return NextResponse.json({ error: 'Follow not found' }, { status: 404 });
    return NextResponse.json(follow);
  }
  // List all follows if no id is provided
  const follows = await followService.listFollows();
  return NextResponse.json(follows);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  if (!body.followerId || !body.followingId) {
    return NextResponse.json({ error: 'Missing followerId or followingId' }, { status: 400 });
  }
  try {
    const follow = await followService.createFollow({
      followerId: body.followerId,
      followingId: body.followingId,
      createdAt: new Date(),
    });
    return NextResponse.json(follow, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to create follow' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });
  const body = await req.json();
  try {
    const updated = await followService.updateFollow(id, body);
    return NextResponse.json(updated);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to update follow' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });
  try {
    await followService.deleteFollow(id);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to delete follow' }, { status: 500 });
  }
} 