'use client';

import Image from 'next/image';
import type { ArtifactRecord, Settings } from '@/content/types';
import {
  INSIDE_ID,
  insideIsOpen,
  metaLine,
  resolveArtifact,
  serviceLine,
  type ResolvedArtifact,
} from '@/lib/artifact';
import { mediaKind } from '@/lib/media';
import { formatInstant, formatRemaining } from '@/lib/schedule';
import { useNow } from '@/lib/use-now';
import { CollectButton } from './CollectButton';
import { Tool } from './tools/Tool';

function timeLine(a: ResolvedArtifact, settings: Settings): string | null {
  if (a.status === 'upcoming') {
    const when = formatInstant(a.opensAt, settings);
    return a.remaining !== undefined ? `opens ${when} · in ${formatRemaining(a.remaining)}` : `opens ${when}`;
  }
  if (a.status === 'closed') return 'this service is closed.';
  return null;
}

function Embed({ src, title }: { src: string; title: string }) {
  return (
    <figure className="flex flex-col gap-2">
      <iframe
        src={src}
        title={title}
        loading="lazy"
        allow="autoplay; fullscreen; clipboard-write; encrypted-media; picture-in-picture"
        allowFullScreen
        sandbox="allow-scripts allow-same-origin allow-popups allow-forms allow-pointer-lock allow-downloads"
        referrerPolicy="strict-origin-when-cross-origin"
        className="block aspect-[3/4] max-h-[85svh] w-full border border-line bg-bg sm:aspect-video"
      />
      <figcaption className="text-meta text-muted">
        <a href={src} target="_blank" rel="noopener">
          open on its own ↗
        </a>
      </figcaption>
    </figure>
  );
}

function Media({ url, title }: { url: string; title: string }) {
  switch (mediaKind(url)) {
    case 'video':
      return (
        <video
          src={url}
          controls
          playsInline
          preload="metadata"
          className="mx-auto block max-h-[90svh] w-full bg-line object-contain"
        >
          <a href={url}>{title}</a>
        </video>
      );
    case 'audio':
      return <audio src={url} aria-label={title} controls preload="metadata" className="mx-auto block w-full max-w-[620px]" />;
    case 'image':
      return (
        // sizes of uploaded images are not known ahead, so they keep their own proportions
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={url}
          alt=""
          loading="lazy"
          decoding="async"
          className="mx-auto block h-auto max-h-[90svh] w-auto max-w-full bg-line"
        />
      );
  }
}

export function ObjectDetail({
  record,
  settings,
  renderedAt,
  preview = false,
}: {
  record: ArtifactRecord;
  settings: Settings;
  renderedAt: number;
  /** A draft the keeper is looking at. The instrument is usable before the service opens. */
  preview?: boolean;
}) {
  const now = useNow(renderedAt);
  const a = resolveArtifact(record, now, settings);
  const time = timeLine(a, settings);
  const paragraphs = (a.description ?? '').split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);
  const open = insideIsOpen(a);
  const toolOpen = Boolean(a.tool) && (open || preview);
  const showInside = Boolean(a.embed || a.media?.length) && open;

  const words = (
    <>
      <div className="flex flex-col gap-1.5">
        <span className="text-meta text-muted">{serviceLine(a)}</span>
        <h1 className="text-lead font-normal tracking-tight">{a.title}</h1>
        <span className="text-meta text-muted">{metaLine(a)}</span>
      </div>

      {paragraphs.length > 0 && (
        <div className="flex flex-col gap-4 text-base text-body">
          {paragraphs.map((p, i) => (
            <p key={i} className="whitespace-pre-line">
              {p}
            </p>
          ))}
        </div>
      )}
    </>
  );

  const inside = showInside && (
    <section id={INSIDE_ID} aria-label={`inside ${a.title}`} className="mt-[120px] flex scroll-mt-6 flex-col gap-12">
      {a.embed && <Embed src={a.embed} title={a.title} />}
      {a.media?.map((url) => (
        <Media key={url} url={url} title={a.title} />
      ))}
    </section>
  );

  if (toolOpen && a.tool) {
    return (
      <>
        <Tool
          id={a.tool}
          title={a.title}
          intro={
            <>
              {words}
              {time && <p className="text-meta text-muted tabular-nums">{time}</p>}
            </>
          }
        />
        {inside}
      </>
    );
  }

  return (
    <>
      <article className="grid gap-10 md:grid-cols-[minmax(0,360px)_minmax(0,1fr)] md:gap-16">
        {a.image ? (
          <Image
            src={a.image}
            alt={a.alt}
            width={600}
            height={1300}
            priority
            sizes="(min-width: 768px) 360px, 280px"
            className="mx-auto block aspect-[6/13] w-full max-w-[280px] bg-line object-cover md:max-w-none"
          />
        ) : (
          <div aria-hidden="true" className="mx-auto aspect-[6/13] w-full max-w-[280px] bg-line md:max-w-none" />
        )}

        <div className="flex max-w-[460px] flex-col gap-8 md:sticky md:top-10 md:self-start md:pt-2">
          {words}

          <div className="flex flex-col gap-2">
            <CollectButton artifact={a} onPage />
            {time && <p className="text-meta text-muted tabular-nums">{time}</p>}
          </div>
        </div>
      </article>
      {inside}
    </>
  );
}
