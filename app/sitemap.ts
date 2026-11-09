import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/config/site';
import { objects } from '@/content/objects';
import { objectPath } from '@/lib/artifact';
import { getSiteData } from '@/lib/data';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const { artifacts } = await getSiteData();
  return [
    { url: SITE_URL, changeFrequency: 'weekly', priority: 1 },
    { url: `${SITE_URL}/imprint`, changeFrequency: 'yearly', priority: 0.2 },
    { url: `${SITE_URL}/privacy`, changeFrequency: 'yearly', priority: 0.2 },
    ...objects.map((object) => ({
      url: `${SITE_URL}/${object.id}`,
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    })),
    ...artifacts.map((a) => ({
      url: `${SITE_URL}${objectPath(a)}`,
      changeFrequency: 'weekly' as const,
      priority: 0.6,
    })),
  ];
}
