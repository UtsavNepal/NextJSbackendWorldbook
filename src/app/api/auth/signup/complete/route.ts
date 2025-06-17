import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@/generated/prisma';
import bcrypt from 'bcryptjs';
const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { email } = body;
  if (!email) {
    return NextResponse.json({ error: 'Missing email.' }, { status: 400 });
  }
  const record = await prisma.signupOtp.findUnique({ where: { email } });
  if (!record || !record.verified) {
    return NextResponse.json({ error: 'OTP not verified.' }, { status: 400 });
  }
  // Create user
  const hashedPassword = await bcrypt.hash(record.otp, 10);
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
      isVerified: false,
      joinedAt: new Date(),
      profilePicture: null,
      otp: null,
    },
  });
  // Delete temp record
  await prisma.signupOtp.delete({ where: { email } });
  return NextResponse.json({ success: true, user });
} 