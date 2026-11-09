import { SITE_NAME } from '@/config/site';

export type ObjectType = 'sign' | 'psalm' | 'instrument' | 'object';

/** One published object. id is the route: /001. */
export interface HouseObject {
  id: string;
  title: string;
  type: ObjectType;
  date: string;
  edition: string;
  /** one line from the author */
  description: string;
  files: string[];
}

export const objects: HouseObject[] = [
  {
    id: '001',
    title: 'godrays',
    type: 'instrument',
    date: '15 november 2026',
    edition: 'free',
    description: 'a small instrument for light.',
    files: ['/objects/obj-001-godrays.jpg'],
  },
];

export function findObject(id: string): HouseObject | undefined {
  return objects.find((object) => object.id === id);
}

export function objectTitle(object: HouseObject): string {
  const line = object.description.replace(/\.$/, '');
  return `${object.id} · ${object.title} — ${line} · ${SITE_NAME}`;
}
