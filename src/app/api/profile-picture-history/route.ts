import { NextRequest, NextResponse } from 'next/server';
import { profilePictureHistoryService } from '../../../application/profilePictureHistoryService';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  if (id) {
    const pph = await profilePictureHistoryService.getProfilePictureHistoryById(id);
    if (!pph) return NextResponse.json({ error: 'ProfilePictureHistory not found' }, { status: 404 });
    return NextResponse.json(pph);
  }
  // List all profile picture histories if no id is provided
  const pphs = await profilePictureHistoryService.listProfilePictureHistories();
  return NextResponse.json(pphs);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  if (!body.profileId || !body.profilePictureUrl) {
    return NextResponse.json({ error: 'Missing profileId or profilePictureUrl' }, { status: 400 });
  }
  try {
    const pph = await profilePictureHistoryService.createProfilePictureHistory({
      profileId: body.profileId,
      profilePictureUrl: body.profilePictureUrl,
      updatedAt: new Date(),
    });
    return NextResponse.json(pph, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to create profile picture history' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });
  const body = await req.json();
  try {
    const updated = await profilePictureHistoryService.updateProfilePictureHistory(id, body);
    return NextResponse.json(updated);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to update profile picture history' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });
  try {
    await profilePictureHistoryService.deleteProfilePictureHistory(id);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to delete profile picture history' }, { status: 500 });
  }
}