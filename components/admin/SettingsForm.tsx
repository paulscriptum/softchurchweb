'use client';

import { useActionState } from 'react';
import { saveSettings, type FormState } from '@/app/admin/actions';
import type { Settings } from '@/content/types';
import { wallClock } from '@/lib/schedule';
import { buttonClass, inputClass, labelClass } from './ui';

const two = (n: number) => String(n).padStart(2, '0');

export function SettingsForm({ settings }: { settings: Settings }) {
  const [state, action, pending] = useActionState<FormState, FormData>(saveSettings, {});
  const w = wallClock(Date.parse(settings.firstServiceAt), settings.timezone);

  return (
    <form action={action} className="grid gap-4 sm:grid-cols-2">
      <label className={labelClass}>
        service 001 opens on
        <input
          name="firstDate"
          type="date"
          required
          defaultValue={`${w.year}-${two(w.month)}-${two(w.day)}`}
          className={inputClass}
        />
      </label>
      <label className={labelClass}>
        at (local time)
        <input
          name="firstTime"
          type="time"
          required
          defaultValue={`${two(w.hour)}:${two(w.minute)}`}
          className={inputClass}
        />
      </label>
      <label className={labelClass}>
        time zone
        <input name="timezone" required defaultValue={settings.timezone} className={inputClass} />
      </label>
      <label className={labelClass}>
        services in total
        <input
          name="totalServices"
          type="number"
          min={1}
          max={999}
          required
          defaultValue={settings.totalServices}
          className={inputClass}
        />
      </label>
      <label className={labelClass}>
        instagram
        <input name="instagram" type="url" defaultValue={settings.instagram} className={inputClass} />
      </label>
      <label className={labelClass}>
        the archive
        <input name="archive" type="url" defaultValue={settings.archive} className={inputClass} />
      </label>
      <div className="flex items-center gap-4 sm:col-span-2">
        <button type="submit" disabled={pending} className={buttonClass}>
          keep the schedule
        </button>
        <p aria-live="polite" className="text-meta text-muted">
          {state.message}
        </p>
      </div>
    </form>
  );
}
