import 'server-only';

// Resend over plain fetch. Without RESEND_API_KEY every call is a logged no-op,
// so the whole witness flow can be walked through locally.
const API = 'https://api.resend.com';
const SEGMENT_NAME = 'witnesses';

export const resendConfigured = () => Boolean(process.env.RESEND_API_KEY);

export const letterFrom = () => process.env.RESEND_FROM || 'soft.church <service@soft.church>';

export class ResendError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
  }
}

async function call<T>(method: string, path: string, body?: unknown): Promise<T> {
  const res = await fetch(`${API}${path}`, {
    method,
    headers: {
      authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      'content-type': 'application/json',
    },
    body: body === undefined ? undefined : JSON.stringify(body),
    cache: 'no-store',
  });
  const data = (await res.json().catch(() => ({}))) as T & { message?: string };
  if (!res.ok) throw new ResendError(res.status, `resend ${method} ${path}: ${res.status} ${data.message ?? ''}`);
  return data;
}

let segmentCache: string | null = null;

/** The segment witnesses live in: RESEND_SEGMENT_ID, or one named "witnesses", created on first use. */
export async function witnessSegment(): Promise<string> {
  const fixed = process.env.RESEND_SEGMENT_ID || process.env.RESEND_AUDIENCE_ID;
  if (fixed) return fixed;
  if (segmentCache) return segmentCache;
  const list = await call<{ data: { id: string; name: string }[] }>('GET', '/segments');
  const found = list.data.find((s) => s.name === SEGMENT_NAME);
  segmentCache = found ? found.id : (await call<{ id: string }>('POST', '/segments', { name: SEGMENT_NAME })).id;
  return segmentCache;
}

export interface Letter {
  to: string;
  subject: string;
  html: string;
  text: string;
}

export async function sendEmail(letter: Letter): Promise<void> {
  if (!resendConfigured()) {
    console.info(`[resend:mock] email to ${letter.to} · ${letter.subject}\n${letter.text}`);
    return;
  }
  await call('POST', '/emails', { from: letterFrom(), ...letter });
}

/** Adds the email as a subscribed contact in the witness segment, re-subscribing it if it left before. */
export async function addWitness(email: string): Promise<void> {
  if (!resendConfigured()) {
    console.info(`[resend:mock] contact ${email} joins the witnesses`);
    return;
  }
  const segment = await witnessSegment();
  try {
    await call('POST', '/contacts', { email, unsubscribed: false, segments: [{ id: segment }] });
  } catch (error) {
    if (!(error instanceof ResendError) || (error.status !== 409 && error.status !== 422)) throw error;
    const path = `/contacts/${encodeURIComponent(email)}`;
    await call('PATCH', path, { unsubscribed: false });
    await call('POST', `${path}/segments/${segment}`).catch((e) => {
      if (!(e instanceof ResendError) || e.status !== 409) throw e;
    });
  }
}

interface Received {
  from: string;
  subject: string | null;
  html: string | null;
  text: string | null;
}

/** Passes a letter received at soft.church on to a real inbox; replies go to the original sender. */
export async function forwardReceived(emailId: string, to: string): Promise<void> {
  const mail = await call<Received>('GET', `/emails/receiving/${emailId}`);
  await call('POST', '/emails', {
    from: letterFrom(),
    to,
    reply_to: mail.from,
    subject: mail.subject || '(no subject)',
    html: mail.html || undefined,
    text: mail.text || (mail.html ? undefined : ''),
  });
}

/** Sends one broadcast to every subscribed witness. Returns the broadcast id. */
export async function sendBroadcast(letter: Omit<Letter, 'to'> & { name: string }): Promise<string> {
  if (!resendConfigured()) {
    console.info(`[resend:mock] broadcast · ${letter.subject}\n${letter.text}`);
    return 'mock';
  }
  const { id } = await call<{ id: string }>('POST', '/broadcasts', {
    segment_id: await witnessSegment(),
    from: letterFrom(),
    send: true,
    ...letter,
  });
  return id;
}
