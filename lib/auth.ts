import 'server-only';
import { createHash, createHmac, timingSafeEqual } from 'node:crypto';
import { cookies } from 'next/headers';
import { connection } from 'next/server';

const COOKIE = 'sc_admin';
const SESSION_DAYS = 30;

function secret(): string | null {
  const value = process.env.ADMIN_SECRET || process.env.ADMIN_PASSWORD;
  return value ? value : null;
}

export function adminConfigured(): boolean {
  return Boolean(process.env.ADMIN_PASSWORD);
}

function sign(payload: string, key: string): string {
  return createHmac('sha256', key).update(payload).digest('base64url');
}

function safeEqual(a: string, b: string): boolean {
  const ha = createHash('sha256').update(a).digest();
  const hb = createHash('sha256').update(b).digest();
  return timingSafeEqual(ha, hb);
}

export function checkPassword(candidate: string): boolean {
  const expected = process.env.ADMIN_PASSWORD;
  return Boolean(expected) && safeEqual(candidate, expected as string);
}

export function verifyToken(token: string | undefined): boolean {
  const key = secret();
  if (!key || !token) return false;
  const [expires, signature] = token.split('.');
  if (!expires || !signature || Number(expires) < Date.now()) return false;
  return safeEqual(signature, sign(expires, key));
}

export async function isAdmin(): Promise<boolean> {
  await connection();
  const jar = await cookies();
  return verifyToken(jar.get(COOKIE)?.value);
}

export async function startSession(): Promise<void> {
  const key = secret();
  if (!key) throw new Error('ADMIN_PASSWORD is not set');
  const expires = String(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);
  const jar = await cookies();
  jar.set(COOKIE, `${expires}.${sign(expires, key)}`, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_DAYS * 24 * 60 * 60,
  });
}

export async function endSession(): Promise<void> {
  const jar = await cookies();
  jar.delete(COOKIE);
}

export async function requireAdmin(): Promise<void> {
  if (!(await isAdmin())) throw new Error('unauthorized');
}

export function tokenFromCookieHeader(header: string | null): string | undefined {
  return header
    ?.split(';')
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${COOKIE}=`))
    ?.slice(COOKIE.length + 1);
}
