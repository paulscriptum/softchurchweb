'use client';

import type { Settings } from '@/content/types';
import { pad3 } from '@/lib/format';
import {
  currentService,
  doorsCloseAt,
  doorsOpenAt,
  formatRemaining,
  serviceOpensAt,
} from '@/lib/schedule';
import { useNow } from '@/lib/use-now';

export function HeroMeta({ settings, renderedAt }: { settings: Settings; renderedAt: number }) {
  const now = useNow(renderedAt);
  const current = currentService(now, settings);
  const total = settings.totalServices;
  const opensAt = doorsOpenAt(settings);
  const closed = now >= doorsCloseAt(settings);

  let countdown: string;
  if (closed) countdown = 'the doors are closed.';
  else if (now < opensAt) countdown = `the doors open in ${formatRemaining(opensAt - now)}`;
  else if (current >= total) countdown = `the last service · ${formatRemaining(doorsCloseAt(settings) - now)} left`;
  else countdown = `next service in ${formatRemaining(serviceOpensAt(current + 1, settings) - now)}`;

  return (
    <>
      <span>
        {current === 0 ? 'statement 000' : `service ${pad3(current)}/${pad3(total)}`} · the seventh day
      </span>
      <span className="tabular-nums">{countdown}</span>
    </>
  );
}
