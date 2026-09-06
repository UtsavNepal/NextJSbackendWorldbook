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

function hasCloudinaryCredentials() {
  if (process.env.CLOUDINARY_URL) return true;
  return Boolean(
    process.env.CLOUDINARY_CLOUD_NAME
    && process.env.CLOUDINARY_API_KEY
    && process.env.CLOUDINARY_API_SECRET
  );
}

function configureCloudinary() {
  if (process.env.CLOUDINARY_URL) return;
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
  });
}

function uploadToCloudinary(file: File, folder: string, ownerKey: string) {
  return new Promise<string>((resolve, reject) => {
    void file.arrayBuffer().then((bytes) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: `worldbook/${folder}/${ownerKey}`,
          resource_type: 'image',
          unique_filename: true,
          overwrite: false,
        },
        (error, result) => {
          if (error || !result?.secure_url) {
            reject(error || new Error(ERRORS.upload.failed));
            return;
          }
          resolve(result.secure_url);
        }
      );
      stream.end(Buffer.from(bytes));
    }).catch(reject);
  });
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
  if (hasCloudinaryCredentials()) {
    try {
      configureCloudinary();
      return await uploadToCloudinary(file, folder, ownerKey);
    } catch (error) {
      console.error('cloudinary upload failed', error);
      throw new Error(ERRORS.upload.failed);
    }
  }
  if (process.env.VERCEL) {
    throw new Error(ERRORS.upload.storageNotConfigured);
  }
  return saveToLocalDisk(file, folder, ownerKey);
}
