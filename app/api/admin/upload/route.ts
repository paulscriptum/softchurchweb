import { handleUpload, type HandleUploadBody } from '@vercel/blob/client';
import { NextResponse } from 'next/server';
import { isAdmin } from '@/lib/auth';
import { mediaUploadToken, saveLocalUpload, usesBlobMedia } from '@/lib/store';

const ALLOWED = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'audio/mpeg',
  'audio/wav',
  'audio/x-wav',
  'audio/flac',
  'audio/mp4',
  'audio/x-m4a',
  'audio/aac',
  'audio/ogg',
  'video/mp4',
  'video/webm',
  'video/quicktime',
  'application/zip',
  'application/pdf',
];

export async function POST(request: Request) {
  const authed = await isAdmin();
  const type = request.headers.get('content-type') ?? '';

  if (type.startsWith('multipart/form-data')) {
    if (!authed) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
    if (usesBlobMedia()) return NextResponse.json({ error: 'use client upload' }, { status: 400 });
    const file = (await request.formData()).get('file');
    if (!(file instanceof File) || !ALLOWED.includes(file.type)) {
      return NextResponse.json({ error: 'unsupported file' }, { status: 400 });
    }
    return NextResponse.json(await saveLocalUpload(file.name, file));
  }

  const body = (await request.json()) as HandleUploadBody;
  try {
    const result = await handleUpload({
      body,
      request,
      token: mediaUploadToken(),
      onBeforeGenerateToken: async () => {
        if (!authed) throw new Error('unauthorized');
        return {
          allowedContentTypes: ALLOWED,
          addRandomSuffix: true,
          maximumSizeInBytes: 200 * 1024 * 1024,
        };
      },
    });
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 400 });
  }
}
