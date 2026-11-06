import { NextResponse } from 'next/server';
import { isEmail, subscribe } from '@/lib/witness';

async function readEmail(request: Request): Promise<unknown> {
  const type = request.headers.get('content-type') ?? '';
  if (type.includes('application/json')) {
    const body = await request.json().catch(() => null);
    return body?.email;
  }
  const form = await request.formData().catch(() => null);
  return form?.get('email');
}

export async function POST(request: Request) {
  const raw = await readEmail(request);
  const email = typeof raw === 'string' ? raw.trim().toLowerCase() : raw;
  const fromForm = !(request.headers.get('content-type') ?? '').includes('application/json');

  if (!isEmail(email)) {
    return fromForm
      ? NextResponse.redirect(new URL('/#witness', request.url), 303)
      : NextResponse.json({ ok: false }, { status: 400 });
  }

  try {
    await subscribe(email);
  } catch {
    return NextResponse.json({ ok: false }, { status: 502 });
  }

  return fromForm
    ? NextResponse.redirect(new URL('/#witness', request.url), 303)
    : NextResponse.json({ ok: true });
}
