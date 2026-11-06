import { upload } from '@vercel/blob/client';

export interface Uploaded {
  url: string;
  downloadUrl: string;
}

export async function uploadFile(file: File, folder: string, useBlob: boolean): Promise<Uploaded> {
  if (useBlob) {
    const result = await upload(`${folder}/${file.name}`, file, {
      access: 'public',
      handleUploadUrl: '/api/admin/upload',
      multipart: file.size > 8 * 1024 * 1024,
    });
    return { url: result.url, downloadUrl: result.downloadUrl };
  }
  const body = new FormData();
  body.append('file', file);
  const res = await fetch('/api/admin/upload', { method: 'POST', body });
  if (!res.ok) throw new Error(String(res.status));
  return res.json();
}
