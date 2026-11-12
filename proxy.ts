import { NextResponse, type NextRequest } from 'next/server';
import { seedArtifacts } from '@/content/artifacts';
import { readSiteData } from '@/lib/data';
import { directCanonical, missingObjectNumber, objectAlias, type ObjectAlias } from '@/lib/object-alias';

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|.*\\..*).*)'],
};

async function catalog(): Promise<ObjectAlias[]> {
  try {
    return (await readSiteData()).artifacts;
  } catch {
    return seedArtifacts;
  }
}

function redirectTo(request: NextRequest, pathname: string) {
  // A cloned NextURL remembers the request's trailing slash and would put it back.
  const url = new URL(pathname, request.nextUrl.origin);
  url.search = request.nextUrl.search;
  return NextResponse.redirect(url, 308);
}

/** The site's own not-found page, with a 404 status on the first request. */
function notFound(request: NextRequest) {
  const url = new URL('/_not-found', request.nextUrl.origin);
  return NextResponse.rewrite(url);
}

function trailingSlash(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const trimmed = pathname.replace(/\/+$/, '') || '/';
  if (pathname !== '/' && pathname !== trimmed) return redirectTo(request, trimmed);
  return NextResponse.next();
}

/** 308 old object addresses to `/001`, keeping the query, including `via`. */
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const direct = directCanonical(pathname);
  if (direct === null && !/^\/\d{3}$/.test(pathname)) return trailingSlash(request);

  const artifacts = await catalog();
  const destination = direct === undefined ? objectAlias(pathname, artifacts) : null;
  if (destination) return redirectTo(request, destination);
  if (missingObjectNumber(pathname, artifacts)) return notFound(request);
  if (direct === undefined && !draftPreview(pathname, artifacts)) return notFound(request);
  return trailingSlash(request);
}

/** Drafts stay on `/objects/<id>` so the keeper can preview them. They are not public. */
function draftPreview(pathname: string, artifacts: readonly ObjectAlias[]) {
  const parts = (pathname.replace(/\/+$/, '') || '/').split('/').filter(Boolean);
  return (
    parts.length === 2 &&
    parts[0] === 'objects' &&
    artifacts.some((artifact) => artifact.draft && artifact.id === parts[1])
  );
}
