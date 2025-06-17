import { NextRequest, NextResponse } from 'next/server';
import { getUserIdFromRequest } from '../../../utils/tokenUtils';
import nodemailer from 'nodemailer';
import { PrismaClient } from '@/generated/prisma';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();
const otpStore: { [email: string]: { otp: string; expires: number } } = {};

export async function POST(req: NextRequest) {
  const { pathname } = new URL(req.url);
  if (pathname.endsWith('/auth/request-password-reset')) {
    const { email } = await req.json();
    if (!email) return NextResponse.json({ error: 'Missing email' }, { status: 400 });
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });
    // Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    otpStore[email] = { otp, expires: Date.now() + 10 * 60 * 1000 };
    // Send email
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: Number(process.env.EMAIL_PORT),
      secure: false,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Password Reset OTP',
      text: `Your OTP is: ${otp}`,
    });
    return NextResponse.json({ message: 'OTP sent to email' });
  }
  if (pathname.endsWith('/auth/verify-reset-otp')) {
    const { email, otp } = await req.json();
    if (!email || !otp) return NextResponse.json({ error: 'Missing email or otp' }, { status: 400 });
    const record = otpStore[email];
    if (!record || record.otp !== otp || record.expires < Date.now()) {
      return NextResponse.json({ error: 'Invalid or expired OTP' }, { status: 400 });
    }
    return NextResponse.json({ message: 'OTP verified' });
  }
  if (pathname.endsWith('/auth/reset-password')) {
    const { email, otp, newPassword } = await req.json();
    if (!email || !otp || !newPassword) return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    const record = otpStore[email];
    if (!record || record.otp !== otp || record.expires < Date.now()) {
      return NextResponse.json({ error: 'Invalid or expired OTP' }, { status: 400 });
    }
    const hashed = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({ where: { email }, data: { password: hashed } });
    delete otpStore[email];
    return NextResponse.json({ message: 'Password reset successful' });
  }
  if (pathname.endsWith('/auth/change-password')) {
    const { oldPassword, newPassword } = await req.json();
    const userId = await getUserIdFromRequest(req);
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });
    const valid = await bcrypt.compare(oldPassword, user.password);
    if (!valid) return NextResponse.json({ error: 'Invalid old password' }, { status: 400 });
    const hashed = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({ where: { id: userId }, data: { password: hashed } });
    return NextResponse.json({ message: 'Password changed successfully' });
  }
}
