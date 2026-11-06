import { promises as fs } from 'node:fs';
import path from 'node:path';
import { LOCAL_UPLOADS } from '@/lib/store';

const TYPES: Record<string, string> = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.mp3': 'audio/mpeg',
  '.wav': 'audio/wav',
  '.flac': 'audio/flac',
  '.m4a': 'audio/mp4',
  '.aac': 'audio/aac',
  '.ogg': 'audio/ogg',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.mov': 'video/quicktime',
  '.zip': 'application/zip',
  '.pdf': 'application/pdf',
};

// Serves uploads kept on this machine (local development without a blob store).
export async function GET(request: Request, { params }: RouteContext<'/uploads/[...path]'>) {
  const { path: parts } = await params;
  const file = path.resolve(LOCAL_UPLOADS, ...parts);
  if (!file.startsWith(LOCAL_UPLOADS + path.sep)) return new Response('not found', { status: 404 });

  try {
    const data = await fs.readFile(file);
    const headers = new Headers({
      'content-type': TYPES[path.extname(file).toLowerCase()] ?? 'application/octet-stream',
      'cache-control': 'public, max-age=31536000, immutable',
    });
    if (new URL(request.url).searchParams.has('download')) {
      headers.set('content-disposition', `attachment; filename="${path.basename(file)}"`);
    }
    return new Response(data, { headers });
  } catch {
    return new Response('not found', { status: 404 });
  }
}
