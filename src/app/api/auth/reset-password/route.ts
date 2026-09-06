import { NextRequest } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/infrastructure/prisma';
import { fail, ok, readJson } from '@/utils/http';
import { ERRORS } from '@/constants/errors';

export async function POST(req: NextRequest) {
  const body = await readJson(req);
  const email = body.email;
  const newPassword = body.new_password || body.newPassword;
  if (!email || !newPassword) return fail(ERRORS.MISSING_FIELDS);
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || user.otp !== 'VERIFIED') {
    return fail(ERRORS.password.otpNotVerified);
  }
  const hashed = await bcrypt.hash(newPassword, 10);
  await prisma.user.update({ where: { email }, data: { password: hashed, otp: null } });
  return ok({ message: 'Password reset successful' });
}
