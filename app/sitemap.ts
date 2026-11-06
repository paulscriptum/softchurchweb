import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/config/site';
import { objectPath } from '@/lib/artifact';
import { getSiteData } from '@/lib/data';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const { artifacts } = await getSiteData();
  return [
    { url: SITE_URL, changeFrequency: 'weekly', priority: 1 },
    ...artifacts.map((a) => ({
      url: `${SITE_URL}${objectPath(a)}`,
      changeFrequency: 'weekly' as const,
      priority: 0.6,
    })),
  ];
}
