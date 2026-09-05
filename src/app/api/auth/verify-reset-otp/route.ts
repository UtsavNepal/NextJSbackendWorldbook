import { NextRequest } from 'next/server';
import { prisma } from '@/infrastructure/prisma';
import { fail, ok, readJson } from '@/utils/http';

export async function POST(req: NextRequest) {
  const { email, otp } = await readJson(req);
  if (!email || !otp) return fail('Missing email or otp');
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !user.otp || user.otp !== otp) {
    return fail('Invalid OTP');
  }
  await prisma.user.update({ where: { email }, data: { otp: 'VERIFIED' } });
  return ok({ message: 'OTP verified' });
}
