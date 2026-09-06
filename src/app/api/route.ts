import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    docs: '/docs',
    openapi: '/api/docs',
    message: 'Interactive API docs are at /docs',
  });
}
