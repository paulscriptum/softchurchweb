import type { ArtifactRecord, Settings } from '@/content/types';
import { pad3 } from '@/lib/format';
import { HeroMeta } from './HeroMeta';
import { WitnessForm } from './WitnessForm';

/** A declared object whose service has not opened. No picture, no instrument. */
export function ObjectWaiting({
  record,
  settings,
  renderedAt,
}: {
  record: ArtifactRecord;
  settings: Settings;
  renderedAt: number;
}) {
  return (
    <div className="flex max-w-[460px] flex-col gap-10">
      <div className="flex flex-col gap-1.5">
        <span className="text-meta text-muted">service {pad3(record.service)}</span>
        <h1 className="text-lead font-normal tracking-tight">{record.title}</h1>
        <p className="text-meta text-muted">opens sunday, 3:33 pm berlin</p>
      </div>
      <div className="flex flex-col gap-1.5 text-meta text-muted">
        <HeroMeta settings={settings} renderedAt={renderedAt} />
      </div>
      <WitnessForm id="waiting-witness" />
    </div>
  );
}
