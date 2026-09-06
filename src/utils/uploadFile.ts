import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { v2 as cloudinary } from 'cloudinary';
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

function safeFolderPart(value: string) {
  return value.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 80) || 'user';
}

function envValue(name: string) {
  return (process.env[name] || '').trim().replace(/^["']|["']$/g, '');
}

function hasCloudinaryCredentials() {
  if (envValue('CLOUDINARY_URL')) return true;
  return Boolean(
    envValue('CLOUDINARY_CLOUD_NAME')
    && envValue('CLOUDINARY_API_KEY')
    && envValue('CLOUDINARY_API_SECRET')
  );
}

function configureCloudinary() {
  const fromUrl = envValue('CLOUDINARY_URL');
  if (fromUrl) {
    try {
      const parsed = new URL(fromUrl);
      cloudinary.config({
        cloud_name: parsed.hostname,
        api_key: decodeURIComponent(parsed.username),
        api_secret: decodeURIComponent(parsed.password),
        secure: true,
      });
      return;
    } catch {
      // Use CLOUDINARY_* vars below if the URL cannot be parsed.
    }
  }
  cloudinary.config({
    cloud_name: envValue('CLOUDINARY_CLOUD_NAME'),
    api_key: envValue('CLOUDINARY_API_KEY'),
    api_secret: envValue('CLOUDINARY_API_SECRET'),
    secure: true,
  });
}

function cloudinaryMessage(error: unknown) {
  if (!error || typeof error !== 'object') return '';
  const record = error as { message?: string; error?: { message?: string } };
  return record.message || record.error?.message || '';
}

async function uploadToCloudinary(file: File, folder: string, ownerKey: string) {
  const bytes = Buffer.from(await file.arrayBuffer());
  const mime = file.type && file.type.startsWith('image/') ? file.type : 'image/jpeg';
  const dataUri = `data:${mime};base64,${bytes.toString('base64')}`;
  const result = await cloudinary.uploader.upload(dataUri, {
    folder: `worldbook/${safeFolderPart(folder)}/${safeFolderPart(ownerKey)}`,
    resource_type: 'image',
    unique_filename: true,
    overwrite: false,
    use_filename: false,
  });
  if (!result.secure_url) {
    throw new Error(ERRORS.upload.failed);
  }
  return result.secure_url;
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
  if (!hasCloudinaryCredentials()) {
    if (process.env.VERCEL) {
      throw new Error(ERRORS.upload.storageNotConfigured);
    }
    return saveToLocalDisk(file, folder, ownerKey);
  }

  try {
    configureCloudinary();
    return await uploadToCloudinary(file, folder, ownerKey);
  } catch (error) {
    const message = cloudinaryMessage(error).toLowerCase();
    console.error('cloudinary upload failed', {
      message: cloudinaryMessage(error),
      hasUrl: Boolean(envValue('CLOUDINARY_URL')),
      hasCloud: Boolean(envValue('CLOUDINARY_CLOUD_NAME')),
      hasKey: Boolean(envValue('CLOUDINARY_API_KEY')),
      hasSecret: Boolean(envValue('CLOUDINARY_API_SECRET')),
    });
    if (
      message.includes('invalid')
      || message.includes('api key')
      || message.includes('api_key')
      || message.includes('signature')
      || message.includes('cloud_name')
      || message.includes('must supply')
    ) {
      throw new Error(ERRORS.upload.storageNotConfigured);
    }
    throw new Error(ERRORS.upload.failed);
  }
}
