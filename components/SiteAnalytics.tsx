'use client';

import { Analytics, type BeforeSendEvent } from '@vercel/analytics/next';
import { VIA_KEY, readVia } from '@/lib/via';

function withVia(event: BeforeSendEvent): BeforeSendEvent | null {
  const url = new URL(event.url);
  if (url.pathname.startsWith('/admin')) return null;
  const fromUrl = readVia(url.searchParams.get('via'));
  let stored: ReturnType<typeof readVia>;
  try {
    stored = readVia(sessionStorage.getItem(VIA_KEY));
  } catch {
    stored = undefined;
  }
  const via = fromUrl ?? stored;
  if (url.searchParams.has('via')) url.searchParams.delete('via');
  if (via) url.searchParams.set('via', via);
  return { ...event, url: url.toString() };
}

export function SiteAnalytics() {
  return <Analytics beforeSend={withVia} />;
}
