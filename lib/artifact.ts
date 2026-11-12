import type { Artifact, ArtifactRecord, Settings } from '@/content/types';
import { pad3 } from './format';
import {
  currentService,
  formatRemainingShort,
  serviceOpensAt,
  serviceWeekday,
  type Weekday,
} from './schedule';

export interface ResolvedArtifact extends Artifact {
  opensAt: number;
  closesAt: number;
  /** true when this artifact belongs to the service that opens next */
  isNext: boolean;
  /** time left until it opens */
  remaining?: number;
  weekday: Weekday;
}

export function resolveArtifact(
  record: ArtifactRecord,
  now: number,
  settings: Settings,
): ResolvedArtifact {
  const opensAt = serviceOpensAt(record.service, settings);
  const closesAt = serviceOpensAt(record.service + 1, settings);
  const status = record.status !== 'auto' ? record.status : now < opensAt ? 'upcoming' : 'open';
  const remaining = status === 'upcoming' && now < opensAt ? opensAt - now : undefined;

  return {
    ...record,
    status,
    opensAt,
    closesAt,
    isNext: record.service === currentService(now, settings) + 1,
    remaining,
    weekday: serviceWeekday(settings),
  };
}

export function serviceLine(a: Pick<Artifact, 'service' | 'kind'>): string {
  return `service ${pad3(a.service)} · ${a.kind}`;
}

/** Each entry is meant to stay on one line in the narrow grid card. */
export function metaLines(a: Artifact): string[] {
  let lines: string[];
  switch (a.kind) {
    case 'offering':
      lines = [`${a.type} · free`, 'for seven days'];
      break;
    case 'keeping':
      lines = [`${a.type} · edition of ${a.edition}`];
      break;
    case 'relic':
      lines = [`${a.type} · 1/1 · auction`];
      break;
  }
  return a.guest ? [...lines, `guest: ${a.guest}`] : lines;
}

export function metaLine(a: Artifact): string {
  const [first, ...rest] = metaLines(a);
  const line = a.kind === 'offering' ? `${first} ${rest.shift()}` : first;
  return [line, ...rest].join(' · ');
}

export type Action =
  | { mode: 'download'; label: string; href: string; timer?: string }
  | { mode: 'link'; label: string; href: string; timer?: string }
  | { mode: 'page'; label: string; href: string; timer?: string }
  | { mode: 'pending'; label: string; timer?: string }
  | { mode: 'muted'; label: string; timer?: string };

/** Canonical object URL: three digits, no trailing slash, no query. `/001`. */
export function objectPath(a: Pick<Artifact, 'service'>): string {
  return `/${pad3(a.service)}`;
}

export const INSIDE_ID = 'inside';

export function hasInside(a: Artifact): boolean {
  return Boolean(a.tool || a.embed || a.media?.length);
}

/** What lies below the fold of the object's page is given only while its service can be entered. */
export function insideIsOpen(a: ResolvedArtifact): boolean {
  if (a.status === 'upcoming') return false;
  return a.kind !== 'offering' || a.status === 'open';
}

function isFullyKept(a: Artifact): boolean {
  return a.edition !== undefined && a.kept !== undefined && a.kept >= a.edition;
}

/** `onPage` is true on the object's own page, where receiving points down to what is inside. */
export function actionFor(a: ResolvedArtifact, onPage = false): Action {
  if (a.status === 'kept' || isFullyKept(a)) return { mode: 'muted', label: 'kept' };
  if (a.status === 'closed') return { mode: 'muted', label: 'closed' };

  const timer = a.remaining !== undefined ? formatRemainingShort(a.remaining) : undefined;

  if (a.status === 'upcoming') {
    return a.isNext
      ? { mode: 'muted', label: a.weekday, timer }
      : { mode: 'muted', label: 'soon' };
  }

  if (a.kind === 'offering') {
    if (a.download) return { mode: 'download', label: 'receive', href: a.download, timer };
    if (a.href) return { mode: 'link', label: 'receive', href: a.href, timer };
    if (hasInside(a)) {
      const href = onPage ? `#${INSIDE_ID}` : objectPath(a);
      return { mode: 'page', label: 'receive', href, timer };
    }
    return { mode: 'pending', label: 'receive', timer };
  }

  const label = a.kind === 'relic' ? 'bid' : a.price ? `keep · ${a.price}` : 'keep';
  return a.href
    ? { mode: 'link', label, href: a.href, timer }
    : { mode: 'pending', label, timer };
}
