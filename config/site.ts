import type { Settings } from '@/content/types';

export const SITE_NAME = 'soft.church';
export const SITE_URL = 'https://soft.church';
export const SITE_DESCRIPTION =
  'a quiet house for given things. one service every seventh day. 333 in total.';

export const COPYRIGHT_YEAR = 2026;
export const INSTAGRAM_HANDLE = '@soft.church';

/** Used until the admin saves its own settings. Service 001: sunday 1 november 2026, 12:00 berlin. */
export const DEFAULT_SETTINGS: Settings = {
  firstServiceAt: '2026-11-01T11:00:00.000Z',
  timezone: 'Europe/Berlin',
  totalServices: 333,
  instagram: 'https://instagram.com/soft.church',
  archive: 'https://333objects.com',
};
