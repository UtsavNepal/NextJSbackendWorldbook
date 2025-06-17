import { NextRequest, NextResponse } from 'next/server';
import { friendRequestService } from '../../../application/friendRequestService';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  if (id) {
    const fr = await friendRequestService.getFriendRequestById(id);
    if (!fr) return NextResponse.json({ error: 'FriendRequest not found' }, { status: 404 });
    return NextResponse.json(fr);
  }
  // List all friend requests if no id is provided
  const frs = await friendRequestService.listFriendRequests();
  return NextResponse.json(frs);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  if (!body.fromUserId || !body.toUserId) {
    return NextResponse.json({ error: 'Missing fromUserId or toUserId' }, { status: 400 });
  }
  try {
    const fr = await friendRequestService.createFriendRequest({
        fromUserId: body.fromUserId,
        toUserId: body.toUserId,
        status: body.status ?? 'pending',
        createdAt: new Date()
    });
    return NextResponse.json(fr, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to create friend request' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });
  const body = await req.json();
  try {
    const updated = await friendRequestService.updateFriendRequest(id, body);
    return NextResponse.json(updated);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to update friend request' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });
  try {
    await friendRequestService.deleteFriendRequest(id);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to delete friend request' }, { status: 500 });
  }
} 