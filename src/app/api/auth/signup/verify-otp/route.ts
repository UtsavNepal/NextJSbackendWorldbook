import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/infrastructure/prisma';
import { ERRORS } from '@/constants/errors';

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { email, otp } = body;
  if (!email || !otp) {
    return NextResponse.json({ error: ERRORS.validation.missingEmailOrOtp }, { status: 400 });
  }
  const record = await prisma.signupOtp.findUnique({ where: { email } });
  if (!record || record.otp !== otp) {
    return NextResponse.json({ error: ERRORS.signup.invalidOtp }, { status: 400 });
  }
  // Mark as verified
  await prisma.signupOtp.update({ where: { email }, data: { verified: true } });
  return NextResponse.json({ success: true });
} 