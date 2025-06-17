import { NextRequest, NextResponse } from 'next/server';
import { profileService } from '../../../application/profileService';
import { getUserIdFromRequest } from '../../../utils/tokenUtils';

export async function GET(req: NextRequest) {
  const { searchParams, pathname } = new URL(req.url);
  const id = searchParams.get('id');
  const meMatch = pathname.endsWith('/me');
  const publicMatch = pathname.match(/\/profile\/([\w-]+)\/public$/);
  const followersMatch = pathname.match(/\/profile\/([\w-]+)\/followers$/);
  const followingMatch = pathname.match(/\/profile\/([\w-]+)\/following$/);
  if (meMatch) {
    const userId = await getUserIdFromRequest(req);
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const profile = await profileService.getProfileById(userId);
    return NextResponse.json(profile);
  }
  if (publicMatch) {
    const profileId = publicMatch[1];
    const profile = await profileService.getPublicProfile(profileId);
    return NextResponse.json(profile);
  }
  if (followersMatch) {
    const profileId = followersMatch[1];
    const followers = await profileService.getFollowers(profileId);
    return NextResponse.json(followers);
  }
  if (followingMatch) {
    const profileId = followingMatch[1];
    const following = await profileService.getFollowing(profileId);
    return NextResponse.json(following);
  }
  if (id) {
    const profile = await profileService.getProfileById(id);
    if (!profile) return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    return NextResponse.json(profile);
  }
  const profiles = await profileService.listProfiles();
  return NextResponse.json(profiles);
}

export async function POST(req: NextRequest) {
  const { pathname } = new URL(req.url);
  const followMatch = pathname.match(/\/profile\/([\w-]+)\/follow$/);
  if (followMatch) {
    const profileId = followMatch[1];
    const userId = await getUserIdFromRequest(req);
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const result = await profileService.followProfile(userId, profileId);
    return NextResponse.json(result);
  }
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
  const { pathname } = new URL(req.url);
  const unfollowMatch = pathname.match(/\/profile\/([\w-]+)\/unfollow$/);
  if (unfollowMatch) {
    const profileId = unfollowMatch[1];
    const userId = await getUserIdFromRequest(req);
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const result = await profileService.unfollowProfile(userId, profileId);
    return NextResponse.json(result);
  }
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