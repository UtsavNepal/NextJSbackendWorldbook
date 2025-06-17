import { NextRequest, NextResponse } from 'next/server';
import { userService } from '../../../application/userService';

export async function GET(req: NextRequest) {
  const { searchParams, pathname } = new URL(req.url);
  if (pathname.endsWith('/user/search')) {
    const query = searchParams.get('query');
    if (!query) return NextResponse.json([]);
    const users = await userService.searchUsers(query);
    return NextResponse.json(users);
  }
  const id = searchParams.get('id');
  if (id) {
    const user = await userService.getUserById(id);
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });
    return NextResponse.json(user);
  }

  const users = await userService.listUsers();
  return NextResponse.json(users);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  
  if (!body.username) {
    return NextResponse.json({ error: 'Missing username' }, { status: 400 });
  }
  try {
    const user = await userService.createUser({
        email: body.username, // Changed from username to email since that's what the type expects
        firstname: body.firstname,
        lastname: body.lastname,
        birthday: body.birthday ? new Date(body.birthday) : null,
        gender: body.gender,
        profilePicture: body.profilePicture,
        emailActive: true,
        isActive: true,
        isStaff: false,
        isVerified: false,
        joinedAt: new Date(),
        otp: null,
        password: ''
    });
    return NextResponse.json(user, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to create user' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });
  const body = await req.json();
  try {
    const updated = await userService.updateUser(id, body);
    return NextResponse.json(updated);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to update user' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });
  try {
    await userService.deleteUser(id);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to delete user' }, { status: 500 });
  }
} 