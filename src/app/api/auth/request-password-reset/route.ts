import { NextRequest } from 'next/server';
import { prisma } from '@/infrastructure/prisma';
import { sendMail } from '@/infrastructure/emailService';
import { fail, ok, readJson } from '@/utils/http';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const { email } = await readJson(req);
  if (!email) return fail('Missing email');
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return fail('User not found', 404);
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  await prisma.user.update({ where: { email }, data: { otp } });
  await sendMail({ to: email, subject: 'Password Reset OTP', text: `Your OTP is: ${otp}` });
  return ok({ message: 'OTP sent to email' });
}
