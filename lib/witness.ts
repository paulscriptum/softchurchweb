import 'server-only';
import { createHash, createHmac, timingSafeEqual } from 'node:crypto';
import { SITE_URL } from '@/config/site';
import { confirmLetter } from './letters';
import { addWitness, sendEmail } from './resend';
import { listJson, readJson, writeJson } from './store';

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
  /** when the confirmation letter was last sent */
  askedAt?: string;
  /** when the witness confirmed; only confirmed witnesses receive letters */
  confirmedAt?: string;
}

const keyFor = (email: string) =>
  `witnesses/${createHash('sha256').update(email).digest('hex').slice(0, 32)}.json`;

function secret(): string {
  const value = process.env.WITNESS_SECRET || process.env.ADMIN_SECRET || process.env.ADMIN_PASSWORD;
  if (!value) throw new Error('set ADMIN_PASSWORD (or WITNESS_SECRET) to sign witness links');
  return value;
}

const sign = (payload: string) => createHmac('sha256', secret()).update(payload).digest('base64url');

function confirmLink(email: string): string {
  const expires = String(Date.now() + CONFIRM_DAYS * 24 * 60 * 60 * 1000);
  const e = Buffer.from(email).toString('base64url');
  return `${SITE_URL}/api/witness/confirm?e=${e}&x=${expires}&s=${sign(`${email}.${expires}`)}`;
}

/** Returns the email a confirmation link was made for, or null if it is forged or expired. */
export function readConfirmLink(params: URLSearchParams): string | null {
  const email = Buffer.from(params.get('e') ?? '', 'base64url').toString();
  const expires = params.get('x') ?? '';
  const signature = params.get('s') ?? '';
  if (!isEmail(email) || !expires || Number(expires) < Date.now()) return null;
  const expected = Buffer.from(sign(`${email}.${expires}`));
  const given = Buffer.from(signature);
  return expected.length === given.length && timingSafeEqual(expected, given) ? email : null;
}

/** Keeps the address and sends it a letter asking to confirm. */
export async function subscribe(email: string, origin: string = SITE_URL): Promise<void> {
  const key = keyFor(email);
  const now = new Date();
  const existing = await readJson<Witness>(key);
  if (existing?.askedAt && now.getTime() - Date.parse(existing.askedAt) < RESEND_AFTER_MS) return;

  const link = confirmLink(email).replace(SITE_URL, origin);
  await sendEmail({ to: email, ...confirmLetter(link) });
  await writeJson(key, { ...existing, email, at: existing?.at ?? now.toISOString(), askedAt: now.toISOString() });
}

export async function confirm(email: string): Promise<void> {
  await addWitness(email);
  const key = keyFor(email);
  const existing = await readJson<Witness>(key);
  if (!existing?.confirmedAt) {
    const now = new Date().toISOString();
    await writeJson(key, { ...existing, email, at: existing?.at ?? now, confirmedAt: now });
  }
}

export async function listWitnesses(): Promise<Witness[]> {
  const all = await listJson<Witness>('witnesses/');
  return all.sort((a, b) => a.at.localeCompare(b.at));
}
