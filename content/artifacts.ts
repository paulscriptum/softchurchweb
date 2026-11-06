import type { ArtifactRecord } from './types';

/** What the site starts with before the admin saves anything. Drafts stay off the public site. */
export const seedArtifacts: ArtifactRecord[] = [
  {
    id: 'godrays',
    service: 1,
    kind: 'offering',
    type: 'instrument',
    title: 'godrays',
    image: '/objects/obj-001-godrays.jpg',
    alt: 'light breaking through torn dark shapes in rays',
    status: 'auto',
    tool: 'godrays',
    description:
      'a small instrument for light.\n\nevery visit lets a different light through. move it until it finds you, then keep it as your wallpaper.',
    draft: true,
  },
  {
    id: 'melting-dot',
    service: 2,
    kind: 'keeping',
    type: 'sign',
    title: 'melting dot',
    image: '/objects/obj-001-melting-dot.jpg',
    alt: 'a white dot melting downward in streaks',
    status: 'auto',
    edition: 333,
    price: '33 €',
    href: 'https://manifold.xyz/@softchurch/id/melting-dot',
    draft: true,
  },
];
