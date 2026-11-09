import { NextResponse } from 'next/server';
import { publicOrigin } from '@/lib/origin';
import { readVia } from '@/lib/via';
import { isEmail, subscribe } from '@/lib/witness';

async function readSubmission(request: Request): Promise<{ email: unknown; via: unknown }> {
  const type = request.headers.get('content-type') ?? '';
  if (type.includes('application/json')) {
    const body = await request.json().catch(() => null);
    return { email: body?.email, via: body?.via };
  }
  const form = await request.formData().catch(() => null);
  return { email: form?.get('email'), via: form?.get('via') };
}

export async function POST(request: Request) {
  const submission = await readSubmission(request);
  const raw = submission.email;
  const email = typeof raw === 'string' ? raw.trim().toLowerCase() : raw;
  const fromForm = !(request.headers.get('content-type') ?? '').includes('application/json');

  if (!isEmail(email)) {
    return fromForm
      ? NextResponse.redirect(new URL('/#witness', publicOrigin(request)), 303)
      : NextResponse.json({ ok: false }, { status: 400 });
  }

  try {
    await subscribe(email, publicOrigin(request), readVia(submission.via));
  } catch (error) {
    console.error('[witness] subscribe failed', error);
    return NextResponse.json({ ok: false }, { status: 502 });
  }

  return fromForm
    ? NextResponse.redirect(new URL('/#witness', publicOrigin(request)), 303)
    : NextResponse.json({ ok: true });
}
