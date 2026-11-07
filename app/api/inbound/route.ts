import { createHmac, timingSafeEqual } from 'node:crypto';
import { NextResponse } from 'next/server';
import { forwardReceived } from '@/lib/resend';

// Resend signs webhooks the svix way: base64 HMAC-SHA256 of "id.timestamp.body",
// keyed with the base64 part of the whsec_ secret.
function verified(request: Request, body: string): boolean {
  const secret = process.env.RESEND_WEBHOOK_SECRET;
  const id = request.headers.get('svix-id');
  const timestamp = request.headers.get('svix-timestamp');
  const signatures = request.headers.get('svix-signature');
  if (!secret || !id || !timestamp || !signatures) return false;
  if (Math.abs(Date.now() / 1000 - Number(timestamp)) > 5 * 60) return false;

  const key = Buffer.from(secret.replace(/^whsec_/, ''), 'base64');
  const expected = createHmac('sha256', key).update(`${id}.${timestamp}.${body}`).digest();
  return signatures.split(' ').some((entry) => {
    const given = Buffer.from(entry.split(',')[1] ?? '', 'base64');
    return given.length === expected.length && timingSafeEqual(given, expected);
  });
}

export async function POST(request: Request) {
  const body = await request.text();
  if (!verified(request, body)) return new NextResponse('unsigned', { status: 401 });

  const event = JSON.parse(body) as { type?: string; data?: { email_id?: string } };
  const to = process.env.INBOUND_FORWARD_TO;
  if (event.type !== 'email.received' || !event.data?.email_id || !to) return NextResponse.json({ ok: true });

  try {
    await forwardReceived(event.data.email_id, to);
  } catch (error) {
    console.error('[inbound] forward failed', error);
    return new NextResponse('could not forward', { status: 502 });
  }
  return NextResponse.json({ ok: true });
}
