import { NextRequest, NextResponse } from 'next/server';
import { userService } from '../../../../application/userService';
import bcrypt from 'bcryptjs';

export async function POST(req: NextRequest) {
  const body = await req.json();
  if (!body.email || !body.password) {
    return NextResponse.json({ error: 'Missing email or password' }, { status: 400 });
  }
  try {
    const hashedPassword = await bcrypt.hash(body.password, 10);
    const user = await userService.createUser({
      email: body.email,
      firstname: body.firstname ?? null,
      lastname: body.lastname ?? null,
      birthday: body.birthday ?? null,
      gender: body.gender ?? null,
      emailActive: true,
      profilePicture: null,
      isActive: true,
      isStaff: false,
      isVerified: false,
      otp: null,
      joinedAt: new Date(),
      password: hashedPassword,
    });
    return NextResponse.json(user, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to signup' }, { status: 500 });
  }
} 