import 'server-only';
import { createHash, createHmac, timingSafeEqual } from 'node:crypto';
import { SITE_URL } from '@/config/site';
import { confirmLetter } from './letters';
import { addWitness, sendEmail } from './resend';
import { listJson, readJson, writeJson } from './store';
import { readVia, type Via } from './via';

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const CONFIRM_DAYS = 7;
// one confirmation letter per address in this window, so the form can't be used to flood an inbox
const RESEND_AFTER_MS = 10 * 60 * 1000;

export function isEmail(value: unknown): value is string {
  return typeof value === 'string' && value.length <= 254 && EMAIL.test(value);
}

export interface Witness {
  email: string;
  /** when the address was first left on the site */
  at: string;
  /** unconfirmed addresses are kept, and receive only the confirmation letter */
  status: 'unconfirmed' | 'confirmed';
  /** when the confirmation letter was last sent */
  askedAt?: string;
  /** when the witness confirmed; this is the consent time. only then do letters go out */
  confirmedAt?: string;
  /** where they arrived from, when the link or the form carried a known via */
  via?: Via;
}

const keyFor = (email: string) =>
  `witnesses/${createHash('sha256').update(email).digest('hex').slice(0, 32)}.json`;

function secret(): string {
  const value = process.env.WITNESS_SECRET || process.env.ADMIN_SECRET || process.env.ADMIN_PASSWORD;
  if (!value) throw new Error('set ADMIN_PASSWORD (or WITNESS_SECRET) to sign witness links');
  return value;
}

const sign = (payload: string) => createHmac('sha256', secret()).update(payload).digest('base64url');

function confirmLink(email: string, origin: string, via?: Via): string {
  const expires = String(Date.now() + CONFIRM_DAYS * 24 * 60 * 60 * 1000);
  const e = Buffer.from(email).toString('base64url');
  const payload = via ? `${email}.${expires}.${via}` : `${email}.${expires}`;
  const url = new URL('/api/witness/confirm', origin);
  url.searchParams.set('e', e);
  url.searchParams.set('x', expires);
  url.searchParams.set('s', sign(payload));
  if (via) url.searchParams.set('via', via);
  return url.toString();
}

/** Returns the address a confirmation link was made for, or null if it is forged or expired. */
export function readConfirmLink(params: URLSearchParams): { email: string; via?: Via } | null {
  const email = Buffer.from(params.get('e') ?? '', 'base64url').toString();
  const expires = params.get('x') ?? '';
  const signature = params.get('s') ?? '';
  const via = readVia(params.get('via'));
  if (!isEmail(email) || !expires || Number(expires) < Date.now()) return null;
  const payload = via ? `${email}.${expires}.${via}` : `${email}.${expires}`;
  const expected = Buffer.from(sign(payload));
  const given = Buffer.from(signature);
  return expected.length === given.length && timingSafeEqual(expected, given) ? { email, via } : null;
}

/** Keeps the address as unconfirmed and sends one confirmation letter. Confirmed addresses are left alone. */
export async function subscribe(email: string, origin: string = SITE_URL, via?: Via): Promise<void> {
  const key = keyFor(email);
  const now = new Date();
  const existing = await readJson<Witness>(key);
  if (existing?.status === 'confirmed' || existing?.confirmedAt) return;

  const record: Witness = {
    email,
    at: existing?.at ?? now.toISOString(),
    status: 'unconfirmed',
    ...(existing?.askedAt ? { askedAt: existing.askedAt } : {}),
  };
  const recentlyAsked = existing?.askedAt && now.getTime() - Date.parse(existing.askedAt) < RESEND_AFTER_MS;
  if (!recentlyAsked) record.askedAt = now.toISOString();
  await writeJson(key, record);
  if (recentlyAsked) return;

  const link = confirmLink(email, origin, via);
  await sendEmail({ to: email, ...confirmLetter(link) });
}

/** Confirms the address, records consent, and only then adds them to the witness list. */
export async function confirm(email: string, via?: Via): Promise<void> {
  await addWitness(email);
  const key = keyFor(email);
  const existing = await readJson<Witness>(key);
  const now = new Date().toISOString();
  const kept = via ?? existing?.via;
  await writeJson(key, {
    ...existing,
    email,
    at: existing?.at ?? now,
    status: 'confirmed',
    confirmedAt: existing?.confirmedAt ?? now,
    ...(kept ? { via: kept } : {}),
  });
}

export async function listWitnesses(): Promise<Witness[]> {
  const all = await listJson<Witness>('witnesses/');
  return all.sort((a, b) => a.at.localeCompare(b.at));
}
