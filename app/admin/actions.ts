'use server';

import { updateTag } from 'next/cache';
import { redirect } from 'next/navigation';
import {
  ARTIFACT_TYPES,
  EDITIONS,
  KINDS,
  STATUSES,
  TOOLS,
  type ArtifactRecord,
  type ArtifactType,
  type Edition,
  type Kind,
} from '@/content/types';
import { checkPassword, endSession, requireAdmin, startSession } from '@/lib/auth';
import { SITE_TAG, readSiteData, writeSiteData } from '@/lib/data';
import { zonedToUtc } from '@/lib/schedule';
import { StorageUnavailableError, deleteMedia } from '@/lib/store';

export interface FormState {
  ok?: boolean;
  message?: string;
}

const text = (fd: FormData, key: string) => String(fd.get(key) ?? '').trim();
const optional = (fd: FormData, key: string) => text(fd, key) || undefined;

function storageMessage(error: unknown): FormState {
  if (error instanceof StorageUnavailableError) {
    return { message: 'storage is not connected. add the private blob store as DATA in vercel.' };
  }
  console.error(error);
  return { message: 'could not save. try again.' };
}

export async function login(_: FormState, fd: FormData): Promise<FormState> {
  if (!checkPassword(text(fd, 'password'))) {
    await new Promise((r) => setTimeout(r, 600));
    return { message: 'not this one.' };
  }
  await startSession();
  redirect('/admin');
}

export async function logout(): Promise<void> {
  await endSession();
  redirect('/admin');
}

export async function saveSettings(_: FormState, fd: FormData): Promise<FormState> {
  await requireAdmin();

  const timezone = text(fd, 'timezone') || 'Europe/Berlin';
  const [year, month, day] = text(fd, 'firstDate').split('-').map(Number);
  const [hour, minute] = text(fd, 'firstTime').split(':').map(Number);
  const totalServices = Number(text(fd, 'totalServices'));

  try {
    new Intl.DateTimeFormat('en', { timeZone: timezone });
  } catch {
    return { message: 'unknown time zone.' };
  }
  if (![year, month, day, hour, minute].every(Number.isFinite)) {
    return { message: 'the first service needs a date and a time.' };
  }
  if (!Number.isInteger(totalServices) || totalServices < 1 || totalServices > 999) {
    return { message: 'total services must be between 1 and 999.' };
  }

  try {
    const data = await readSiteData();
    data.settings = {
      firstServiceAt: new Date(zonedToUtc(year, month - 1, day, hour, minute, timezone)).toISOString(),
      timezone,
      totalServices,
      instagram: text(fd, 'instagram') || data.settings.instagram,
      archive: text(fd, 'archive') || data.settings.archive,
    };
    await writeSiteData(data);
  } catch (error) {
    return storageMessage(error);
  }

  updateTag(SITE_TAG);
  return { ok: true, message: 'kept.' };
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function parseArtifact(fd: FormData): ArtifactRecord | string {
  const title = text(fd, 'title').toLowerCase();
  const service = Number(text(fd, 'service'));
  const kind = text(fd, 'kind') as Kind;
  const type = text(fd, 'type') as ArtifactType;
  const status = text(fd, 'status');
  const editionRaw = text(fd, 'edition');

  if (!title) return 'a title is needed.';
  if (!Number.isInteger(service) || service < 1 || service > 999) return 'service must be a number.';
  if (!KINDS.includes(kind)) return 'unknown kind.';
  if (!ARTIFACT_TYPES.includes(type)) return 'unknown type.';
  if (status !== 'auto' && !STATUSES.includes(status as never)) return 'unknown status.';

  let edition: Edition | undefined;
  if (kind === 'relic') edition = 1;
  else if (kind === 'keeping') {
    edition = Number(editionRaw) as Edition;
    if (!EDITIONS.includes(edition)) return 'choose an edition.';
  }


  const isAddress = (value: string) => value.startsWith('/') || /^https:\/\//.test(value);
  for (const key of ['href', 'download', 'image', 'embed']) {
    const value = text(fd, key);
    if (value && !isAddress(value)) return `${key} must start with https:// or /.`;
  }
  const media = text(fd, 'media')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);
  const wrong = media.find((url) => !isAddress(url));
  if (wrong) return `${wrong} must start with https:// or /.`;
  const description = text(fd, 'description').replace(/\r\n/g, '\n').toLowerCase();

  return {
    id: slugify(text(fd, 'id') || title),
    service,
    kind,
    type,
    title,
    image: text(fd, 'image'),
    alt: text(fd, 'alt').toLowerCase(),
    status: status as ArtifactRecord['status'],
    edition,
    price: kind === 'keeping' ? optional(fd, 'price') : undefined,
    href: optional(fd, 'href'),
    download: kind === 'offering' ? optional(fd, 'download') : undefined,
    guest: optional(fd, 'guest')?.toLowerCase(),
    description: description || undefined,
    embed: optional(fd, 'embed'),
    tool: TOOLS.find((t) => t === text(fd, 'tool')),
    media: media.length ? media : undefined,
    draft: text(fd, 'intent') === 'draft' || undefined,
  };
}

export async function saveArtifact(_: FormState, fd: FormData): Promise<FormState> {
  await requireAdmin();
  const originalId = text(fd, 'originalId');
  const parsed = parseArtifact(fd);
  if (typeof parsed === 'string') return { message: parsed };
  if (!parsed.id) return { message: 'the title needs at least one latin letter or digit.' };

  try {
    const data = await readSiteData();
    const clash = data.artifacts.find((a) => a.id === parsed.id && a.id !== originalId);
    if (clash) return { message: `the id ${parsed.id} is already used.` };
    const rest = data.artifacts.filter((a) => a.id !== originalId);
    data.artifacts = [...rest, parsed];
    await writeSiteData(data);
  } catch (error) {
    return storageMessage(error);
  }

  updateTag(SITE_TAG);
  redirect(`/admin?saved=${parsed.draft ? 'draft' : 'published'}`);
}

export async function deleteArtifact(fd: FormData): Promise<void> {
  await requireAdmin();
  const id = text(fd, 'id');
  const data = await readSiteData();
  const target = data.artifacts.find((a) => a.id === id);
  if (target) {
    data.artifacts = data.artifacts.filter((a) => a.id !== id);
    await writeSiteData(data);
    const files = [target.image, target.download, ...(target.media ?? [])].filter(Boolean);
    await Promise.all(files.map((u) => deleteMedia(u!)));
    updateTag(SITE_TAG);
  }
  redirect('/admin');
}
