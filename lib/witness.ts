import 'server-only';
import { createHash } from 'node:crypto';
import { listJson, readJson, writeJson } from './store';

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function isEmail(value: unknown): value is string {
  return typeof value === 'string' && value.length <= 254 && EMAIL.test(value);
}

export interface Witness {
  email: string;
  at: string;
}

const keyFor = (email: string) =>
  `witnesses/${createHash('sha256').update(email).digest('hex').slice(0, 32)}.json`;

/**
 * Optional forwarding to an email provider. Set BUTTONDOWN_API_KEY, or RESEND_API_KEY
 * with RESEND_AUDIENCE_ID. Witnesses are always kept in our own store as well.
 */
async function forwardToProvider(email: string): Promise<void> {
  if (process.env.BUTTONDOWN_API_KEY) {
    const res = await fetch('https://api.buttondown.com/v1/subscribers', {
      method: 'POST',
      headers: {
        authorization: `Token ${process.env.BUTTONDOWN_API_KEY}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify({ email_address: email }),
    });
    if (!res.ok && res.status !== 400 && res.status !== 409) {
      throw new Error(`buttondown ${res.status}`);
    }
    return;
  }

  if (process.env.RESEND_API_KEY && process.env.RESEND_AUDIENCE_ID) {
    const res = await fetch(
      `https://api.resend.com/audiences/${process.env.RESEND_AUDIENCE_ID}/contacts`,
      {
        method: 'POST',
        headers: {
          authorization: `Bearer ${process.env.RESEND_API_KEY}`,
          'content-type': 'application/json',
        },
        body: JSON.stringify({ email, unsubscribed: false }),
      },
    );
    if (!res.ok && res.status !== 409) throw new Error(`resend ${res.status}`);
  }
}

export async function subscribe(email: string): Promise<void> {
  const key = keyFor(email);
  if (!(await readJson<Witness>(key))) {
    await writeJson(key, { email, at: new Date().toISOString() } satisfies Witness);
  }
  try {
    await forwardToProvider(email);
  } catch (error) {
    console.error('[witness] provider failed', error);
  }
}

export async function listWitnesses(): Promise<Witness[]> {
  const all = await listJson<Witness>('witnesses/');
  return all.sort((a, b) => a.at.localeCompare(b.at));
}

export function providerName(): string | null {
  if (process.env.BUTTONDOWN_API_KEY) return 'buttondown';
  if (process.env.RESEND_API_KEY && process.env.RESEND_AUDIENCE_ID) return 'resend';
  return null;
}
