import { NextRequest, NextResponse } from 'next/server';
import { sendMail } from '@/infrastructure/emailService';
import { prisma } from '@/infrastructure/prisma';
import { ERRORS, errorFromUnknown } from '@/constants/errors';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function generateOtp() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { firstname, lastname, birthday, gender, email } = body;
    if (!firstname || !lastname || !birthday || !gender || !email) {
      return NextResponse.json({ error: ERRORS.signup.allFieldsRequired }, { status: 400 });
    }
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: ERRORS.signup.userExists }, { status: 400 });
    }
    const otp = generateOtp();
    await prisma.signupOtp.upsert({
      where: { email },
      update: { otp, firstname, lastname, birthday: new Date(birthday), gender, verified: false },
      create: { email, otp, firstname, lastname, birthday: new Date(birthday), gender, verified: false },
    });
    await sendMail({ to: email, subject: 'Your OTP Code', text: `Your OTP is: ${otp}` });
    return NextResponse.json({ success: true, message: 'OTP sent to email.' });
  } catch (error) {
    const prismaCode = error && typeof error === 'object' && 'code' in error
      ? String((error as { code?: string }).code)
      : '';
    let message = errorFromUnknown(error, ERRORS.signup.failed);
    if (prismaCode === 'P1001' || prismaCode === 'P1000') {
      message = ERRORS.DATABASE_UNREACHABLE;
    } else if (prismaCode === 'P2021') {
      message = ERRORS.DATABASE_TABLES_MISSING;
    }
    console.error('signup/start failed', prismaCode, error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
} 