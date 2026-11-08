import type { Settings } from '@/content/types';
import { HeroDot } from './HeroDot';
import { HeroMeta } from './HeroMeta';

export function Hero({ settings, renderedAt }: { settings: Settings; renderedAt: number }) {
  return (
    <section
      aria-label="soft.church"
      className="flex min-h-[740px] overflow-x-clip flex-col items-center justify-center gap-14 px-6 pt-[104px] sm:min-h-[780px] sm:pt-[136px] pb-14 text-center"
    >
      <HeroDot size={260} />
      <h1 className="relative max-w-manifesto text-hero leading-[1.15] font-normal text-body tracking-[-0.025em]">
        everything is given.
        <br />
        some of it is kept.
      </h1>
      <div className="flex flex-col gap-1.5 self-stretch text-meta text-muted">
        <HeroMeta settings={settings} renderedAt={renderedAt} />
        <span>scroll slowly.</span>
        <a
          href="#objects"
          className="inline-flex min-h-11 items-center gap-1.5 self-center text-fg"
        >
          or go straight to the objects <span aria-hidden="true">↓</span>
        </a>
        <span>soft.church is an art project, not a church.</span>
      </div>
    </section>
  );
}
