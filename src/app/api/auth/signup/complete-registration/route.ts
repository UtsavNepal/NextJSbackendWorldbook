import { NextRequest } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/infrastructure/prisma';
import { fail, ok, readJson } from '@/utils/http';
import { serializeUser } from '@/utils/serializers';
import { uniqueUsername } from '@/utils/social';
import { ERRORS } from '@/constants/errors';

export async function POST(req: NextRequest) {
  const body = await readJson(req);
  const { email, password } = body;
  if (!email || !password) {
    return fail(ERRORS.signup.missingEmailOrPassword);
  }
  if (String(password).length < 6) {
    return fail(ERRORS.signup.passwordTooShort);
  }
  const record = await prisma.signupOtp.findUnique({ where: { email } });
  if (!record || !record.verified) {
    return fail(ERRORS.signup.otpNotVerified);
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return fail(ERRORS.signup.userExists);
  }

  const hashedPassword = await bcrypt.hash(password, 10);
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
      isVerified: true,
      joinedAt: new Date(),
      profilePicture: null,
      otp: null,
    },
  });

  await prisma.profile.create({
    data: {
      userId: user.id,
      username: await uniqueUsername(user.email),
      bio: '',
      profilePicture: null,
      totalPosts: 0,
      totalFriends: 0,
    },
  });

  await prisma.signupOtp.delete({ where: { email } });
  const fullUser = await prisma.user.findUnique({
    where: { id: user.id },
    include: { profile: true },
  });

  return ok({
    message: 'Registration completed successfully.',
    user: serializeUser(fullUser),
  });
}
