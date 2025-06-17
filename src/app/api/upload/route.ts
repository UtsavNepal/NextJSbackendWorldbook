import { NextRequest, NextResponse } from 'next/server';
import formidable from 'formidable';
import fs from 'fs';
import path from 'path';
import { getUserIdFromRequest } from '../../../utils/tokenUtils';
import { PrismaClient } from '@/generated/prisma';

const prisma = new PrismaClient();

export const config = {
  api: {
    bodyParser: false,
  },
};

async function parseForm(req: NextRequest): Promise<{ fields: any; files: any }> {
  return new Promise((resolve, reject) => {
    const form = formidable({ multiples: false });
    form.parse(req as any, (err: any, fields: any, files: any) => {
      if (err) reject(err);
      else resolve({ fields, files });
    });
  });
}

export async function POST(req: NextRequest) {
  const { searchParams, pathname } = new URL(req.url);
  const userId = await getUserIdFromRequest(req);
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });
  const email = user.email;
  const { fields, files } = await parseForm(req);
  const file = files.file || files.image;
  if (!file) return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
  const ext = path.extname(file.originalFilename || file.name || '');
  let destFolder = '';
  if (pathname.endsWith('/upload/profile-picture')) {
    destFolder = path.join(process.cwd(), 'media', 'profile_pictures', email);
  } else if (pathname.endsWith('/upload/post-image')) {
    destFolder = path.join(process.cwd(), 'media', 'posts', email);
  } else {
    return NextResponse.json({ error: 'Invalid upload endpoint' }, { status: 400 });
  }
  fs.mkdirSync(destFolder, { recursive: true });
  const filename = `${Date.now()}_${file.originalFilename || file.name}`;
  const destPath = path.join(destFolder, filename);
  fs.copyFileSync(file.filepath || file.path, destPath);
  // Return public URL
  const publicUrl = `/media/${pathname.endsWith('/profile-picture') ? 'profile_pictures' : 'posts'}/${email}/${filename}`;
  return NextResponse.json({ url: publicUrl });
} 