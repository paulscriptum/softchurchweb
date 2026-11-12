import { objectPath } from './artifact';

/** A published object, enough to turn an old address into `/001`. */
export interface ObjectAlias {
  id: string;
  service: number;
  draft?: boolean;
}

const STATIC = new Set([
  'admin',
  'api',
  'apple-icon',
  'favicon.ico',
  'icon',
  'imprint',
  'manifest.webmanifest',
  'opengraph-image',
  'privacy',
  'robots.txt',
  'sitemap.xml',
  'twitter-image',
  'uploads',
  'witness',
  '_not-found',
]);

/**
 * `null` means this is not an object address. `undefined` means ask the catalog.
 * An exact `/001` is already the canonical shape. A trailing `/001/` is not: `/008/` is not an object.
 */
export function directCanonical(pathname: string): null | undefined {
  const trimmed = pathname.replace(/\/+$/, '') || '/';
  const trailing = pathname !== '/' && pathname !== trimmed;
  // A trailing /001/ still has to be checked against the catalog: /008/ is not an object.
  if (/^\/\d{3}$/.test(trimmed)) return trailing ? undefined : null;

  const parts = trimmed.split('/').filter(Boolean);
  if (parts.some((part) => part.includes('.'))) return null;
  if (parts.length === 1 && STATIC.has(parts[0])) return null;
  if (parts.length === 1) return undefined;
  if (parts.length === 2 && parts[0] === 'objects') return undefined;
  return null;
}

/**
 * Old and short object addresses that should 308 to the canonical path.
 * Returns null when the request is already canonical, or is not an object.
 * The slug is the object's id. Nothing here is a hardcoded name.
 */
export function objectAlias(pathname: string, artifacts: readonly ObjectAlias[]): string | null {
  const trimmed = pathname.replace(/\/+$/, '') || '/';
  const trailing = pathname !== '/' && pathname !== trimmed;
  const parts = trimmed.split('/').filter(Boolean);
  if (parts.some((part) => part.includes('.'))) return null;
  if (parts.length === 1 && STATIC.has(parts[0])) return null;

  const published = artifacts.filter((artifact) => !artifact.draft);
  const byService = (service: number) => published.find((artifact) => artifact.service === service);
  const bySlug = (slug: string) => published.find((artifact) => artifact.id === slug);

  let match: ObjectAlias | undefined;
  if (parts.length === 1) {
    const segment = parts[0];
    match = /^\d{1,3}$/.test(segment) ? byService(Number(segment)) : bySlug(segment);
  } else if (parts.length === 2 && parts[0] === 'objects') {
    const segment = parts[1];
    match = /^\d{1,3}$/.test(segment) ? byService(Number(segment)) : bySlug(segment);
  }
  if (!match) return null;

  const canonical = objectPath(match);
  if (canonical === trimmed && !trailing) return null;
  return canonical;
}

/** A service number, short or padded, with no published object behind it. */
export function missingObjectNumber(pathname: string, artifacts: readonly ObjectAlias[]): boolean {
  const parts = (pathname.replace(/\/+$/, '') || '/').split('/').filter(Boolean);
  const digits =
    parts.length === 1 && /^\d{1,3}$/.test(parts[0])
      ? parts[0]
      : parts.length === 2 && parts[0] === 'objects' && /^\d{1,3}$/.test(parts[1])
        ? parts[1]
        : undefined;
  if (!digits) return false;
  const service = Number(digits);
  return !artifacts.some((artifact) => !artifact.draft && artifact.service === service);
}
