import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { put } from '@vercel/blob';
import { ERRORS } from '@/constants/errors';

type BlobAccess = 'public' | 'private';

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

function hasBlobCredentials() {
  return Boolean(
    process.env.BLOB_READ_WRITE_TOKEN
    || process.env.BLOB_STORE_ID
  );
}

function blobAuth() {
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  return token ? { token } : {};
}

function displayUrl(url: string) {
  if (url.includes('.public.blob.vercel-storage.com')) return url;
  return `/api/media?url=${encodeURIComponent(url)}`;
}

async function putWithAccess(file: File, pathname: string, access: BlobAccess) {
  return put(pathname, file, {
    access,
    addRandomSuffix: true,
    contentType: file.type || 'image/jpeg',
    ...blobAuth(),
  });
}

async function saveToBlob(file: File, folder: string, ownerKey: string) {
  const pathname = `media/${folder}/${ownerKey}/${safeFileName(file)}`;
  try {
    const blob = await putWithAccess(file, pathname, 'public');
    return displayUrl(blob.url);
  } catch (publicError) {
    try {
      const blob = await putWithAccess(file, pathname, 'private');
      return displayUrl(blob.url);
    } catch (privateError) {
      console.error('blob upload failed', { publicError, privateError });
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
  if (hasBlobCredentials()) {
    try {
      return await saveToBlob(file, folder, ownerKey);
    } catch (error) {
      console.error('blob upload failed', error);
      throw new Error(ERRORS.upload.storageNotConfigured);
    }
  }
  if (process.env.VERCEL) {
    throw new Error(ERRORS.upload.storageNotConfigured);
  }
  return saveToLocalDisk(file, folder, ownerKey);
}
