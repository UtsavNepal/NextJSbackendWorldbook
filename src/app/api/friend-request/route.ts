import { NextRequest, NextResponse } from 'next/server';
import { friendRequestService } from '../../../application/friendRequestService';
import { getUserIdFromRequest } from '../../../utils/tokenUtils';

export async function GET(req: NextRequest) {
  const { searchParams, pathname } = new URL(req.url);
  const id = searchParams.get('id');
  if (id) {
    const fr = await friendRequestService.getFriendRequestById(id);
    if (!fr) return NextResponse.json({ error: 'FriendRequest not found' }, { status: 404 });
    return NextResponse.json(fr);
  }
  if (pathname.endsWith('/friend/list')) {
    const userId = await getUserIdFromRequest(req);
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const friends = await friendRequestService.listFriends(userId);
    return NextResponse.json(friends);
  }
  // List all friend requests if no id is provided
  const frs = await friendRequestService.listFriendRequests();
  return NextResponse.json(frs);
}

export async function POST(req: NextRequest) {
  const { pathname } = new URL(req.url);
  if (pathname.endsWith('/friend-request/accept')) {
    const body = await req.json();
    const userId = await getUserIdFromRequest(req);
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const result = await friendRequestService.acceptFriendRequest(userId, body.requestId);
    return NextResponse.json(result);
  }
  if (pathname.endsWith('/friend-request/reject')) {
    const body = await req.json();
    const userId = await getUserIdFromRequest(req);
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const result = await friendRequestService.rejectFriendRequest(userId, body.requestId);
    return NextResponse.json(result);
  }
  if (pathname.endsWith('/friend-request/cancel')) {
    const body = await req.json();
    const userId = await getUserIdFromRequest(req);
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const result = await friendRequestService.cancelFriendRequest(userId, body.requestId);
    return NextResponse.json(result);
  }
  if (pathname.endsWith('/friend/delete')) {
    const body = await req.json();
    const userId = await getUserIdFromRequest(req);
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const result = await friendRequestService.deleteFriend(userId, body.friendId);
    return NextResponse.json(result);
  }
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