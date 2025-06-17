import { NextRequest, NextResponse } from 'next/server';
import { profileService } from '../../../application/profileService';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });
  const profile = await profileService.getProfileById(id);
  if (!profile) return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
  return NextResponse.json(profile);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  if (!body.userId) {
    return NextResponse.json({ error: 'Missing userId' }, { status: 400 });
  }
  const profile = await profileService.createProfile({
      userId: body.userId, bio: body.bio, username: body.username,
      profilePicture: null,
      totalPosts: 0,
      totalFriends: 0,
      createdAt: new Date()
  });
  return NextResponse.json(profile, { status: 201 });
}

export async function PUT(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });
  const body = await req.json();
  try {
    const updated = await profileService.updateProfile(id, body);
    return NextResponse.json(updated);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to update profile' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });
  try {
    await profileService.deleteProfile(id);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to delete profile' }, { status: 500 });
  }
} 