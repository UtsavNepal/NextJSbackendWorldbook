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

async function saveToBlob(file: File, folder: string, ownerKey: string) {
  const blob = await put(`media/${folder}/${ownerKey}/${safeFileName(file)}`, file, {
    access: 'public',
    addRandomSuffix: false,
  });
  return blob.url;
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
  if (process.env.BLOB_READ_WRITE_TOKEN) {
    return saveToBlob(file, folder, ownerKey);
  }
  if (process.env.VERCEL) {
    throw new Error(ERRORS.upload.storageNotConfigured);
  }
  return saveToLocalDisk(file, folder, ownerKey);
}
