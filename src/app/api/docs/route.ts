import { NextRequest, NextResponse } from 'next/server';
import { buildOpenApiSpec } from '@/lib/openapi';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const origin = new URL(req.url).origin;
  return NextResponse.json(buildOpenApiSpec(origin));
}
