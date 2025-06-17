import { NextRequest, NextResponse } from 'next/server';
import { sendMail } from '../../../../infrastructure/emailService';
import { PrismaClient } from '@/generated/prisma';
const prisma = new PrismaClient();

function generateOtp() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { firstname, lastname, birthday, gender, email } = body;
  if (!firstname || !lastname || !birthday || !gender || !email) {
    return NextResponse.json({ error: 'All fields are required.' }, { status: 400 });
  }
  // Check if user already exists
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json({ error: 'User already exists.' }, { status: 400 });
  }
  // Generate OTP and store in temp table
  const otp = generateOtp();
  await prisma.signupOtp.upsert({
    where: { email },
    update: { otp, firstname, lastname, birthday: new Date(birthday), gender, verified: false },
    create: { email, otp, firstname, lastname, birthday: new Date(birthday), gender, verified: false },
  });
  await sendMail({ to: email, subject: 'Your OTP Code', text: `Your OTP is: ${otp}` });
  return NextResponse.json({ success: true, message: 'OTP sent to email.' });
} 