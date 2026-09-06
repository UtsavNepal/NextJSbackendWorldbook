import { NextRequest, NextResponse } from 'next/server';
import { profilePictureHistoryService } from '../../../application/profilePictureHistoryService';
import { ERRORS } from '@/constants/errors';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  if (id) {
    const pph = await profilePictureHistoryService.getProfilePictureHistoryById(id);
    if (!pph) return NextResponse.json({ error: ERRORS.history.notFound }, { status: 404 });
    return NextResponse.json(pph);
  }
  // List all profile picture histories if no id is provided
  const pphs = await profilePictureHistoryService.listProfilePictureHistories();
  return NextResponse.json(pphs);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  if (!body.profileId || !body.profilePictureUrl) {
    return NextResponse.json({ error: ERRORS.validation.missingProfilePicture }, { status: 400 });
  }
  try {
    const pph = await profilePictureHistoryService.createProfilePictureHistory({
      profileId: body.profileId,
      profilePictureUrl: body.profilePictureUrl,
      updatedAt: new Date(),
    });
    return NextResponse.json(pph, { status: 201 });
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : ERRORS.history.createFailed }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: ERRORS.MISSING_ID }, { status: 400 });
  const body = await req.json();
  try {
    const updated = await profilePictureHistoryService.updateProfilePictureHistory(id, body);
    return NextResponse.json(updated);
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : ERRORS.history.updateFailed }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: ERRORS.MISSING_ID }, { status: 400 });
  try {
    await profilePictureHistoryService.deleteProfilePictureHistory(id);
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : ERRORS.history.deleteFailed }, { status: 500 });
  }
}