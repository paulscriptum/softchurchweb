'use client';

import type { ArtifactRecord, Settings } from '@/content/types';
import { resolveArtifact } from '@/lib/artifact';
import { pad3 } from '@/lib/format';
import { currentService, doorsCloseAt, doorsOpenAt, serviceWeekday } from '@/lib/schedule';
import { useNow } from '@/lib/use-now';
import { ObjectCard } from './ObjectCard';

function headline(now: number, settings: Settings): string {
  const current = currentService(now, settings);
  const weekday = serviceWeekday(settings);
  if (now >= doorsCloseAt(settings)) return `${settings.totalServices} services · the doors are closed`;
  if (now < doorsOpenAt(settings)) return `the doors open on ${weekday} · service 001 a week later`;
  if (current === 0) return `statement 000 is open · service 001 arrives on ${weekday}`;
  if (current >= settings.totalServices) return `service ${pad3(current)} is open · the last one`;
  return `service ${pad3(current)} is open · the next arrives on ${weekday}`;
}

export function ObjectsGrid({
  artifacts,
  settings,
  renderedAt,
}: {
  artifacts: ArtifactRecord[];
  settings: Settings;
  renderedAt: number;
}) {
  const now = useNow(renderedAt);

  return (
    <section
      id="objects"
      aria-labelledby="objects-title"
      className="mx-auto flex max-w-content scroll-mt-4 flex-col gap-10 px-6 py-[120px]"
    >
      <div className="flex flex-wrap justify-between gap-x-6 gap-y-2 text-meta">
        <h2 id="objects-title" className="font-normal">
          objects
        </h2>
        <span className="text-muted">{headline(now, settings)}</span>
      </div>
      <div className="grid grid-cols-[repeat(auto-fill,minmax(150px,1fr))] gap-x-7 gap-y-12">
        {artifacts.map((record) => (
          <ObjectCard key={record.id} artifact={resolveArtifact(record, now, settings)} />
        ))}
      </div>
    </section>
  );
}
