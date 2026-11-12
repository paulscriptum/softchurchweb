import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/config/site';
import { objectPath, resolveArtifact } from '@/lib/artifact';
import { getSiteData } from '@/lib/data';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const site = await getSiteData();
  const opened = site.artifacts.filter(
    (artifact) => resolveArtifact(artifact, site.renderedAt, site.settings).status !== 'upcoming',
  );
  return [
    { url: SITE_URL, changeFrequency: 'weekly', priority: 1 },
    { url: `${SITE_URL}/imprint`, changeFrequency: 'yearly', priority: 0.2 },
    { url: `${SITE_URL}/privacy`, changeFrequency: 'yearly', priority: 0.2 },
    ...opened.map((artifact) => ({
      url: `${SITE_URL}${objectPath(artifact)}`,
      changeFrequency: 'weekly' as const,
      priority: 0.6,
    })),
  ];
}
