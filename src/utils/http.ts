import { NextRequest, NextResponse } from 'next/server';
import { getUserIdFromRequest } from './tokenUtils';

export function ok(data: unknown, status = 200) {
  return NextResponse.json(data, { status });
}

export function fail(error: string, status = 400) {
  return NextResponse.json({ error, message: error }, { status });
}

export async function requireUserId(req: NextRequest): Promise<string | null> {
  return getUserIdFromRequest(req);
}

export async function readJson(req: NextRequest): Promise<any> {
  try {
    return await req.json();
  } catch {
    return {};
  }
}
