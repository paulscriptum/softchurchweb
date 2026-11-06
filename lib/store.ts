import 'server-only';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { del, get, list, put } from '@vercel/blob';

// Two vercel blob stores: a private one for site data and witnesses,
// a public one for images and wallpapers. Without tokens everything lives in ./.data (local dev).
const dataToken = () => process.env.DATA_READ_WRITE_TOKEN;
const mediaToken = () => process.env.MEDIA_READ_WRITE_TOKEN;

export const usesBlobData = () => Boolean(dataToken());
export const usesBlobMedia = () => Boolean(mediaToken());
export const mediaUploadToken = () => mediaToken();

const LOCAL_ROOT = path.join(process.cwd(), '.data');
export const LOCAL_UPLOADS = path.join(LOCAL_ROOT, 'uploads');

function localPath(key: string): string {
  const resolved = path.resolve(LOCAL_ROOT, key);
  if (!resolved.startsWith(LOCAL_ROOT + path.sep)) throw new Error('invalid key');
  return resolved;
}

function isMissing(error: unknown): boolean {
  return (error as NodeJS.ErrnoException)?.code === 'ENOENT';
}

export class StorageUnavailableError extends Error {}

function assertWritable() {
  if (!usesBlobData() && process.env.VERCEL) {
    throw new StorageUnavailableError('connect a private blob store as DATA');
  }
}

export async function readJson<T>(key: string): Promise<T | null> {
  const token = dataToken();
  if (token) {
    const res = await get(key, { access: 'private', useCache: false, token });
    if (!res || res.statusCode !== 200) return null;
    return JSON.parse(await new Response(res.stream).text()) as T;
  }
  try {
    return JSON.parse(await fs.readFile(localPath(key), 'utf8')) as T;
  } catch (error) {
    if (isMissing(error)) return null;
    throw error;
  }
}

export async function writeJson(key: string, value: unknown): Promise<void> {
  assertWritable();
  const body = JSON.stringify(value, null, 2);
  const token = dataToken();
  if (token) {
    await put(key, body, {
      access: 'private',
      token,
      addRandomSuffix: false,
      allowOverwrite: true,
      contentType: 'application/json',
    });
    return;
  }
  const file = localPath(key);
  await fs.mkdir(path.dirname(file), { recursive: true });
  await fs.writeFile(file, body);
}

export async function listJson<T>(prefix: string): Promise<T[]> {
  const token = dataToken();
  if (token) {
    const keys: string[] = [];
    let cursor: string | undefined;
    do {
      const page = await list({ prefix, cursor, token });
      keys.push(...page.blobs.map((b) => b.pathname));
      cursor = page.hasMore ? page.cursor : undefined;
    } while (cursor);
    const items = await Promise.all(keys.map((k) => readJson<T>(k)));
    return items.filter((x): x is Awaited<T> => x !== null) as T[];
  }
  try {
    const dir = localPath(prefix.replace(/\/$/, '') + '/.keep');
    const names = await fs.readdir(path.dirname(dir));
    const items = await Promise.all(
      names.filter((n) => n.endsWith('.json')).map((n) => readJson<T>(path.join(prefix, n))),
    );
    return items.filter((x): x is Awaited<T> => x !== null) as T[];
  } catch (error) {
    if (isMissing(error)) return [];
    throw error;
  }
}

export interface StoredFile {
  url: string;
  downloadUrl: string;
}

/** Server-side upload, used locally where the browser cannot upload to blob directly. */
export async function saveLocalUpload(name: string, file: File): Promise<StoredFile> {
  assertWritable();
  const safe = name.toLowerCase().replace(/[^a-z0-9._-]+/g, '-');
  const key = `${Date.now().toString(36)}-${safe}`;
  await fs.mkdir(LOCAL_UPLOADS, { recursive: true });
  await fs.writeFile(path.join(LOCAL_UPLOADS, key), Buffer.from(await file.arrayBuffer()));
  return { url: `/uploads/${key}`, downloadUrl: `/uploads/${key}?download=1` };
}

export async function deleteMedia(url: string): Promise<void> {
  const token = mediaToken();
  if (token && url.includes('.blob.vercel-storage.com')) {
    await del(url, { token }).catch(() => undefined);
  }
}
