import { SITE_URL } from '@/config/site';

/**
 * Where links in letters and redirects should point. In production always the site itself;
 * in development the host the request came in on, so links work from a phone on the LAN too.
 */
export function publicOrigin(request: Request): string {
  if (process.env.NODE_ENV === 'production') return SITE_URL;
  const host = request.headers.get('host');
  return host ? `http://${host}` : new URL(request.url).origin;
}
