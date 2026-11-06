import type { Settings } from '@/content/types';

export type Weekday =
  | 'sunday'
  | 'monday'
  | 'tuesday'
  | 'wednesday'
  | 'thursday'
  | 'friday'
  | 'saturday';

const WEEKDAYS: Weekday[] = [
  'sunday',
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
];

export const MINUTE = 60_000;
const DAY = 24 * 60 * MINUTE;
const WEEK = 7 * DAY;

export interface WallClock {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  weekday: number;
}

const formatters = new Map<string, Intl.DateTimeFormat>();

export function wallClock(instant: number, timeZone: string): WallClock {
  let fmt = formatters.get(timeZone);
  if (!fmt) {
    fmt = new Intl.DateTimeFormat('en-US', {
      timeZone,
      hourCycle: 'h23',
      weekday: 'long',
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
    });
    formatters.set(timeZone, fmt);
  }
  const parts = Object.fromEntries(
    fmt.formatToParts(new Date(instant)).map((p) => [p.type, p.value]),
  );
  return {
    year: Number(parts.year),
    month: Number(parts.month),
    day: Number(parts.day),
    hour: Number(parts.hour),
    minute: Number(parts.minute),
    weekday: WEEKDAYS.indexOf(parts.weekday.toLowerCase() as Weekday),
  };
}

function offsetMs(instant: number, timeZone: string): number {
  const w = wallClock(instant, timeZone);
  const asUtc = Date.UTC(w.year, w.month - 1, w.day, w.hour, w.minute);
  return asUtc - Math.floor(instant / MINUTE) * MINUTE;
}

/** Converts a wall-clock time in `timeZone` to a UTC instant. Day overflow is allowed. */
export function zonedToUtc(
  year: number,
  monthIndex: number,
  day: number,
  hour: number,
  minute: number,
  timeZone: string,
): number {
  const guess = Date.UTC(year, monthIndex, day, hour, minute);
  const first = guess - offsetMs(guess, timeZone);
  return guess - offsetMs(first, timeZone);
}

/** Opening instant of service `n`, keeping the same local time across daylight saving changes. */
export function serviceOpensAt(n: number, settings: Settings): number {
  const first = Date.parse(settings.firstServiceAt);
  const w = wallClock(first, settings.timezone);
  return zonedToUtc(w.year, w.month - 1, w.day + (n - 1) * 7, w.hour, w.minute, settings.timezone);
}

/** When the doors open with statement 000: one week before service 001. */
export function doorsOpenAt(settings: Settings): number {
  return serviceOpensAt(0, settings);
}

/** The latest service that has opened at `now`: 0 before service 001, capped at the total. */
export function currentService(now: number, settings: Settings): number {
  const first = Date.parse(settings.firstServiceAt);
  if (now < first) return 0;
  let n = Math.floor((now - first) / WEEK) + 1;
  while (n > 1 && serviceOpensAt(n, settings) > now) n--;
  while (serviceOpensAt(n + 1, settings) <= now) n++;
  return Math.min(n, settings.totalServices);
}

export function serviceWeekday(settings: Settings): Weekday {
  return WEEKDAYS[wallClock(Date.parse(settings.firstServiceAt), settings.timezone).weekday];
}

/** When the doors close: the end of the last service's seven days. */
export function doorsCloseAt(settings: Settings): number {
  return serviceOpensAt(settings.totalServices + 1, settings);
}

function split(ms: number) {
  const total = Math.max(0, Math.ceil(ms / MINUTE));
  return {
    days: Math.floor(total / (24 * 60)),
    hours: Math.floor((total % (24 * 60)) / 60),
    minutes: total % 60,
  };
}

/** `2d 04h 17m` */
export function formatInstant(instant: number, settings: Settings): string {
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: settings.timezone,
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
    .format(instant)
    .toLowerCase();
}

export function formatRemaining(ms: number): string {
  const { days, hours, minutes } = split(ms);
  return `${days}d ${String(hours).padStart(2, '0')}h ${String(minutes).padStart(2, '0')}m`;
}

/** `6d 20h`, or `3h 05m` on the last day. */
export function formatRemainingShort(ms: number): string {
  const { days, hours, minutes } = split(ms);
  if (days > 0) return `${days}d ${String(hours).padStart(2, '0')}h`;
  return `${hours}h ${String(minutes).padStart(2, '0')}m`;
}
