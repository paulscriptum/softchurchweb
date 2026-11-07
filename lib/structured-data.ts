import { CURATOR_NAME, CURATOR_URL, SITE_DESCRIPTION, SITE_NAME, SITE_URL } from '@/config/site';
import type { ArtifactRecord, Settings } from '@/content/types';
import { objectPath, serviceLine } from './artifact';
import { serviceOpensAt } from './schedule';

const ORG_ID = `${SITE_URL}/#organization`;
const SITE_ID = `${SITE_URL}/#website`;

const absolute = (src: string) => (src.startsWith('/') ? `${SITE_URL}${src}` : src);

export function siteLd(settings: Settings) {
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        '@id': ORG_ID,
        name: SITE_NAME,
        url: SITE_URL,
        logo: `${SITE_URL}/apple-icon`,
        description: SITE_DESCRIPTION,
        founder: { '@type': 'Person', name: CURATOR_NAME, url: CURATOR_URL },
        sameAs: [settings.instagram, settings.archive].filter(Boolean),
      },
      {
        '@type': 'WebSite',
        '@id': SITE_ID,
        name: SITE_NAME,
        url: SITE_URL,
        description: SITE_DESCRIPTION,
        inLanguage: 'en',
        publisher: { '@id': ORG_ID },
      },
    ],
  };
}

export function creativeWorkLd(a: ArtifactRecord, settings: Settings) {
  return {
    '@context': 'https://schema.org',
    '@type': 'CreativeWork',
    name: a.title,
    url: `${SITE_URL}${objectPath(a)}`,
    description: a.description?.split(/\n\s*\n/)[0] || `${serviceLine(a)} · ${a.alt}`,
    image: a.image ? absolute(a.image) : undefined,
    datePublished: new Date(serviceOpensAt(a.service, settings)).toISOString(),
    creator: a.guest ? { '@type': 'Person', name: a.guest } : { '@id': ORG_ID },
    publisher: { '@id': ORG_ID },
    isPartOf: { '@id': SITE_ID },
    inLanguage: 'en',
  };
}
