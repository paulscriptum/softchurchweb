'use client';

import { Analytics } from '@vercel/analytics/next';

export function SiteAnalytics() {
  return (
    <Analytics
      beforeSend={(event) => (new URL(event.url).pathname.startsWith('/admin') ? null : event)}
    />
  );
}
