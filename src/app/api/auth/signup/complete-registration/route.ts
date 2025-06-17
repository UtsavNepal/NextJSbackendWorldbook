import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@/generated/prisma';
import bcrypt from 'bcryptjs';
const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { email, password } = body;
  if (!email || !password) {
    return NextResponse.json({ error: 'Missing email or password.' }, { status: 400 });
  }
  const record = await prisma.signupOtp.findUnique({ where: { email } });
  if (!record || !record.verified) {
    return NextResponse.json({ error: 'OTP not verified.' }, { status: 400 });
  }
  // Create user
  const hashedPassword = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: {
      email: record.email,
      firstname: record.firstname,
      lastname: record.lastname,
      birthday: record.birthday,
      gender: record.gender,
      password: hashedPassword,
      emailActive: true,
      isActive: true,
      isStaff: false,
      isVerified: true,
      joinedAt: new Date(),
      profilePicture: null,
      otp: null,
    },
  });
  // Delete temp record
  await prisma.signupOtp.delete({ where: { email } });
  return NextResponse.json({ message: 'Registration completed successfully.', user });
} 