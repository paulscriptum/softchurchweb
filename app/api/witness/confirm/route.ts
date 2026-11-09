import { NextResponse } from 'next/server';
import { publicOrigin } from '@/lib/origin';
import { confirm, readConfirmLink } from '@/lib/witness';

export async function GET(request: Request) {
  const origin = publicOrigin(request);
  const parsed = readConfirmLink(new URL(request.url).searchParams);
  if (!parsed) return NextResponse.redirect(new URL('/witness/expired', origin), 303);

  try {
    await confirm(parsed.email, parsed.via);
  } catch (error) {
    console.error('[witness] confirm failed', error);
    return new NextResponse('could not confirm. try the link again in a moment.', { status: 502 });
  }
  return NextResponse.redirect(new URL('/witness/confirmed', origin), 303);
}
