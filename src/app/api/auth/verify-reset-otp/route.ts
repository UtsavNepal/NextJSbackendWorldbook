import { NextRequest } from 'next/server';
import { prisma } from '@/infrastructure/prisma';
import { fail, ok, readJson } from '@/utils/http';
import { ERRORS } from '@/constants/errors';

export async function POST(req: NextRequest) {
  const { email, otp } = await readJson(req);
  if (!email || !otp) return fail(ERRORS.validation.missingEmailOrOtp);
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !user.otp || user.otp !== otp) {
    return fail(ERRORS.signup.invalidOtp);
  }
  await prisma.user.update({ where: { email }, data: { otp: 'VERIFIED' } });
  return ok({ message: 'OTP verified' });
}
