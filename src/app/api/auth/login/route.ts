import { NextRequest, NextResponse } from 'next/server';
import { userRepository } from '../../../../infrastructure/repositories/userRepository';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'changeme';

export async function POST(req: NextRequest) {
  const body = await req.json();
  if (!body.email || !body.password) {
    return NextResponse.json({ error: 'Missing email or password' }, { status: 400 });
  }
  const user = await userRepository.getUserByEmail(body.email);
  if (!user) {
    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
  }
  const valid = await bcrypt.compare(body.password, user.password);
  if (!valid) {
    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
  }
  const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
  // Return user info (excluding password)
  const { password, ...userInfo } = user;
  return NextResponse.json({ token, user: userInfo });
} 