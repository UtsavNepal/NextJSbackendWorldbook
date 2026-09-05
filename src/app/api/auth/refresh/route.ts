import { NextRequest } from 'next/server';
import jwt from 'jsonwebtoken';
import { fail, ok, readJson } from '@/utils/http';

const JWT_SECRET = process.env.JWT_SECRET || 'changeme';

export async function POST(req: NextRequest) {
  const body = await readJson(req);
  const refreshToken = body.refreshToken || body.refresh;
  if (!refreshToken) return fail('Missing refresh token', 401);
  try {
    const decoded = jwt.verify(refreshToken, JWT_SECRET) as { id: string; email: string };
    const access = jwt.sign({ id: decoded.id, email: decoded.email }, JWT_SECRET, { expiresIn: '7d' });
    return ok({ accessToken: access, access, token: access, refresh: access });
  } catch {
    return fail('Invalid refresh token', 401);
  }
}
