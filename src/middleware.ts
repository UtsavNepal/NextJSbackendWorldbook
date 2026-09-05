import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const allowedOrigins = (process.env.CORS_ORIGIN || 'http://localhost:5173,http://localhost:4173')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

function corsHeaders(origin: string) {
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Allow-Methods': 'GET,POST,PUT,PATCH,DELETE,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };
}

function resolveOrigin(request: NextRequest) {
  const origin = request.headers.get('origin') || '';
  if (allowedOrigins.includes(origin)) return origin;
  return allowedOrigins[0] || 'http://localhost:5173';
}

export function middleware(request: NextRequest) {
  const origin = resolveOrigin(request);
  if (request.method === 'OPTIONS') {
    return new NextResponse(null, { status: 204, headers: corsHeaders(origin) });
  }
  const response = NextResponse.next();
  Object.entries(corsHeaders(origin)).forEach(([key, value]) => {
    response.headers.set(key, value);
  });
  return response;
}

export const config = {
  matcher: '/api/:path*',
};
