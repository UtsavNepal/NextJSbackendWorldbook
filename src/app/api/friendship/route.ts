import { NextRequest, NextResponse } from 'next/server';
import { friendshipService } from '../../../application/friendshipService';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  if (id) {
    const fs = await friendshipService.getFriendshipById(id);
    if (!fs) return NextResponse.json({ error: 'Friendship not found' }, { status: 404 });
    return NextResponse.json(fs);
  }
  // List all friendships if no id is provided
  const fss = await friendshipService.listFriendships();
  return NextResponse.json(fss);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  if (!body.user1Id || !body.user2Id) {
    return NextResponse.json({ error: 'Missing user1Id or user2Id' }, { status: 400 });
  }
  try {
    const fs = await friendshipService.createFriendship({
      user1Id: body.user1Id,
      user2Id: body.user2Id,
      createdAt: new Date(),
    });
    return NextResponse.json(fs, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to create friendship' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });
  const body = await req.json();
  try {
    const updated = await friendshipService.updateFriendship(id, body);
    return NextResponse.json(updated);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to update friendship' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });
  try {
    await friendshipService.deleteFriendship(id);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to delete friendship' }, { status: 500 });
  }
} 