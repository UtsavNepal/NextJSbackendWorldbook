import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@/generated/prisma';
const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { email, otp } = body;
  if (!email || !otp) {
    return NextResponse.json({ error: 'Missing email or otp.' }, { status: 400 });
  }
  const record = await prisma.signupOtp.findUnique({ where: { email } });
  if (!record || record.otp !== otp) {
    return NextResponse.json({ error: 'Invalid OTP.' }, { status: 400 });
  }
  // Mark as verified
  await prisma.signupOtp.update({ where: { email }, data: { verified: true } });
  return NextResponse.json({ success: true });
} 