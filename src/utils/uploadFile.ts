import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { put } from '@vercel/blob';
import { ERRORS } from '@/constants/errors';

export function collectImageFiles(form: FormData): File[] {
  return [...form.getAll('images'), ...form.getAll('image')].filter(
    (file): file is File => file instanceof File && file.size > 0
  );
}

export async function saveUploadedFiles(files: File[], folder: string, ownerKey: string) {
  const saved: string[] = [];
  for (const file of files) {
    saved.push(await saveUploadedFile(file, folder, ownerKey));
  }
  return saved;
}

function safeFileName(file: File) {
  return `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
}

function canUseBlob() {
  return Boolean(
    process.env.BLOB_READ_WRITE_TOKEN
    || process.env.BLOB_STORE_ID
    || process.env.VERCEL
  );
}

async function saveToBlob(file: File, folder: string, ownerKey: string) {
  const body = Buffer.from(await file.arrayBuffer());
  const pathname = `media/${folder}/${ownerKey}/${safeFileName(file)}`;
  const options = {
    contentType: file.type || 'application/octet-stream',
    addRandomSuffix: false as const,
  };

  try {
    const blob = await put(pathname, body, { ...options, access: 'public' });
    return blob.url;
  } catch (publicError) {
    try {
      const blob = await put(pathname, body, { ...options, access: 'private' });
      return blob.url;
    } catch {
      throw publicError;
    }
  }
}

async function saveToLocalDisk(file: File, folder: string, ownerKey: string) {
  const bytes = Buffer.from(await file.arrayBuffer());
  const safeName = safeFileName(file);
  const destFolder = path.join(process.cwd(), 'public', 'media', folder, ownerKey);
  await mkdir(destFolder, { recursive: true });
  await writeFile(path.join(destFolder, safeName), bytes);
  return `/media/${folder}/${ownerKey}/${safeName}`;
}

export async function saveUploadedFile(file: File, folder: string, ownerKey: string) {
  if (canUseBlob()) {
    try {
      return await saveToBlob(file, folder, ownerKey);
    } catch (error) {
      console.error('blob upload failed', error);
      throw new Error(ERRORS.upload.failed);
    }
  }
  return saveToLocalDisk(file, folder, ownerKey);
}
