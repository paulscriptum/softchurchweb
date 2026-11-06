'use client';

import type { Settings } from '@/content/types';
import { pad3 } from '@/lib/format';
import {
  currentService,
  doorsCloseAt,
  formatRemaining,
  serviceOpensAt,
} from '@/lib/schedule';
import { useNow } from '@/lib/use-now';

export function HeroMeta({ settings, renderedAt }: { settings: Settings; renderedAt: number }) {
  const now = useNow(renderedAt);
  const current = currentService(now, settings);
  const total = settings.totalServices;
  const closed = now >= doorsCloseAt(settings);

  let countdown: string;
  if (closed) countdown = 'the doors are closed.';
  else if (current >= total) countdown = `the last service · ${formatRemaining(doorsCloseAt(settings) - now)} left`;
  else countdown = `next service in ${formatRemaining(serviceOpensAt(current + 1, settings) - now)}`;

  return (
    <>
      <span>
        service {pad3(Math.max(current, 1))}/{pad3(total)} · the seventh day
      </span>
      <span className="tabular-nums">{countdown}</span>
    </>
  );
}
