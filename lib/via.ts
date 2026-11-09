export const VIAS = ['reddit', 'pinterest', 'hn', 'linkedin', 'telegram', 'arena', 'letter'] as const;

export type Via = (typeof VIAS)[number];

export const VIA_KEY = 'via';

/** A known arrival, or nothing. Unknown values are dropped. */
export function readVia(value: unknown): Via | undefined {
  if (typeof value !== 'string') return undefined;
  const via = value.trim().toLowerCase();
  return (VIAS as readonly string[]).includes(via) ? (via as Via) : undefined;
}
