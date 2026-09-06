import { NextRequest, NextResponse } from 'next/server';
import { get } from '@vercel/blob';
import { fail } from '@/utils/http';
import { ERRORS } from '@/constants/errors';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function isBlobUrl(value: string) {
  try {
    const host = new URL(value).hostname;
    return host.endsWith('.blob.vercel-storage.com');
  } catch {
    return false;
  }
}

export async function GET(req: NextRequest) {
  const target = req.nextUrl.searchParams.get('url') || '';
  if (!isBlobUrl(target)) return fail(ERRORS.upload.noFile, 400);

  const token = process.env.BLOB_READ_WRITE_TOKEN
    ? { token: process.env.BLOB_READ_WRITE_TOKEN }
    : {};

  try {
    const result = await get(target, { access: 'private', ...token })
      || await get(target, { access: 'public', ...token });
    if (!result?.stream) return fail(ERRORS.history.notFound, 404);
    return new NextResponse(result.stream as ReadableStream, {
      headers: {
        'Content-Type': result.blob.contentType || 'image/jpeg',
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch (error) {
    console.error('media proxy failed', error);
    return fail(ERRORS.history.notFound, 404);
  }
}
