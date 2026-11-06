import type { Settings } from '@/content/types';

export const SITE_NAME = 'soft.church';
export const SITE_URL = 'https://soft.church';
export const SITE_DESCRIPTION =
  'a quiet house for given things. one service every seventh day. 333 in total.';

export const COPYRIGHT_YEAR = 2026;
export const INSTAGRAM_HANDLE = '@soft.church';
export const CURATOR_NAME = 'pavel shchepochkin';
export const CURATOR_URL = 'https://shchepochk.in/';

/**
 * Used until the admin saves its own settings. The doors open with statement 000 on
 * sunday 8 november 2026, 12:00 berlin; service 001 follows a week later.
 */
export const DEFAULT_SETTINGS: Settings = {
  firstServiceAt: '2026-11-15T11:00:00.000Z',
  timezone: 'Europe/Berlin',
  totalServices: 333,
  instagram: 'https://instagram.com/soft.church',
  archive: 'https://333objects.com',
};
