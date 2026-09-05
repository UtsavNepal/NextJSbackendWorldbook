import { NextRequest } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/infrastructure/prisma';
import { fail, ok, readJson } from '@/utils/http';
import { serializeUser } from '@/utils/serializers';
import { uniqueUsername } from '@/utils/social';

export async function POST(req: NextRequest) {
  const body = await readJson(req);
  const { email, password } = body;
  if (!email || !password) {
    return fail('Missing email or password.');
  }
  const record = await prisma.signupOtp.findUnique({ where: { email } });
  if (!record || !record.verified) {
    return fail('OTP not verified.');
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return fail('User already exists.');
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: {
      email: record.email,
      firstname: body.firstname || record.firstname,
      lastname: body.lastname || record.lastname,
      birthday: body.birthday ? new Date(body.birthday) : record.birthday,
      gender: body.gender || record.gender,
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
