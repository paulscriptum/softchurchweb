import 'server-only';
import { cacheLife, cacheTag } from 'next/cache';
import { DEFAULT_SETTINGS } from '@/config/site';
import { seedArtifacts } from '@/content/artifacts';
import { manifesto } from '@/content/manifesto';
import { statements } from '@/content/statements';
import { KINDS, type SiteData } from '@/content/types';
import { MINUTE } from './schedule';
import { readJson, writeJson } from './store';

export const SITE_TAG = 'site';
const SITE_KEY = 'site.json';

function normalize(data: SiteData | null): SiteData {
  return {
    settings: { ...DEFAULT_SETTINGS, ...data?.settings },
    artifacts: [...(data?.artifacts ?? seedArtifacts)].sort(
      (a, b) => a.service - b.service || KINDS.indexOf(a.kind) - KINDS.indexOf(b.kind),
    ),
  };
}

/** Uncached read, for the admin. */
export async function readSiteData(): Promise<SiteData> {
  return normalize(await readJson<SiteData>(SITE_KEY));
}

export async function writeSiteData(data: SiteData): Promise<void> {
  await writeJson(SITE_KEY, normalize(data));
}

/** Cached read for the public page. `renderedAt` seeds the clocks before hydration. */
export async function getSiteData(): Promise<SiteData & { renderedAt: number }> {
  'use cache';
  cacheTag(SITE_TAG);
  cacheLife({ stale: 300, revalidate: 300, expire: 86_400 });

  const data = await readSiteData();
  return {
    ...data,
    artifacts: data.artifacts.filter((a) => !a.draft),
    renderedAt: Math.floor(Date.now() / MINUTE) * MINUTE,
  };
}

export async function getStatements(): Promise<string[]> {
  return statements;
}

export async function getManifesto() {
  return manifesto;
}
