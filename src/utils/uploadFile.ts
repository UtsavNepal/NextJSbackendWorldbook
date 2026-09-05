import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

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

export async function saveUploadedFile(file: File, folder: string, ownerKey: string) {
  const bytes = Buffer.from(await file.arrayBuffer());
  const safeName = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
  const destFolder = path.join(process.cwd(), 'public', 'media', folder, ownerKey);
  await mkdir(destFolder, { recursive: true });
  await writeFile(path.join(destFolder, safeName), bytes);
  return `/media/${folder}/${ownerKey}/${safeName}`;
}
