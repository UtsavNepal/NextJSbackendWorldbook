import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

export async function saveUploadedFile(file: File, folder: string, ownerKey: string) {
  const bytes = Buffer.from(await file.arrayBuffer());
  const safeName = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
  const destFolder = path.join(process.cwd(), 'public', 'media', folder, ownerKey);
  await mkdir(destFolder, { recursive: true });
  await writeFile(path.join(destFolder, safeName), bytes);
  return `/media/${folder}/${ownerKey}/${safeName}`;
}
