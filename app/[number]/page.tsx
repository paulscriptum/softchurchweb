import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound, permanentRedirect } from 'next/navigation';
import { Suspense } from 'react';
import { Footer } from '@/components/Footer';
import { Header } from '@/components/Header';
import { JsonLd } from '@/components/JsonLd';
import { ObjectDetail } from '@/components/ObjectDetail';
import { ObjectWaiting } from '@/components/ObjectWaiting';
import { SITE_NAME, SITE_URL } from '@/config/site';
import { seedArtifacts } from '@/content/artifacts';
import type { ArtifactRecord } from '@/content/types';
import { objectPath, resolveArtifact, serviceLine } from '@/lib/artifact';
import { getSiteData } from '@/lib/data';
import { pad3 } from '@/lib/format';
import { creativeWorkLd } from '@/lib/structured-data';

type Props = { params: Promise<{ number: string }> };

const SHARED_OG = {
  url: '/opengraph-image',
  width: 1200,
  height: 630,
  alt: 'soft.church: a soft blurred dot above the words a quiet house for given things',
};

function canonicalUrl(record: Pick<ArtifactRecord, 'service'>): string {
  return `${SITE_URL}${objectPath(record)}`;
}

/** The opening line only. The picture and the instrument stay off this description. */
function waitingDescription(record: ArtifactRecord): string {
  return `${record.title}, service ${pad3(record.service)} of soft.church. opens sunday, 3:33 pm berlin.`;
}

function openDescription(record: ArtifactRecord): string {
  return record.description?.split(/\n\s*\n/)[0].slice(0, 160) || `${serviceLine(record)} · ${record.alt}`;
}

async function load(number: string) {
  const site = await getSiteData();
  const published = /^\d{3}$/.test(number)
    ? site.artifacts.find((artifact) => pad3(artifact.service) === number)
    : undefined;
  const alias = published
    ? undefined
    : /^\d{1,3}$/.test(number)
      ? site.artifacts.find((artifact) => artifact.service === Number(number))
      : site.artifacts.find((artifact) => artifact.id === number);
  return { site, published, alias };
}

export async function generateStaticParams() {
  try {
    const { artifacts } = await getSiteData();
    if (artifacts.length > 0) return artifacts.map((artifact) => ({ number: pad3(artifact.service) }));
  } catch {
    // storage may be out of reach while building
  }
  return seedArtifacts.filter((artifact) => !artifact.draft).map((artifact) => ({ number: pad3(artifact.service) }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { site, published, alias } = await load((await params).number);
  if (alias) permanentRedirect(canonicalUrl(alias));
  if (!published) return { title: 'nothing is kept here', robots: { index: false, follow: false } };

  const resolved = resolveArtifact(published, site.renderedAt, site.settings);
  const title = `${published.title} · ${SITE_NAME}`;
  const url = canonicalUrl(published);
  const waiting = resolved.status === 'upcoming';
  const description = waiting ? waitingDescription(published) : openDescription(published);
  const images = waiting
    ? [SHARED_OG]
    : published.image
      ? [{ url: published.image, width: 600, height: 1300, alt: published.alt }]
      : [SHARED_OG];

  return {
    title: { absolute: title },
    description,
    alternates: { canonical: url },
    robots: waiting ? { index: false, follow: true } : undefined,
    openGraph: {
      title,
      description,
      url,
      siteName: SITE_NAME,
      type: 'article',
      images,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: images.map((image) => image.url),
    },
  };
}

async function Detail({ params }: Props) {
  const { site, published, alias } = await load((await params).number);
  if (alias) permanentRedirect(canonicalUrl(alias));
  if (!published) notFound();

  const resolved = resolveArtifact(published, site.renderedAt, site.settings);
  if (resolved.status === 'upcoming') {
    return <ObjectWaiting record={published} settings={site.settings} renderedAt={site.renderedAt} />;
  }

  return (
    <>
      <JsonLd data={creativeWorkLd(published, site.settings)} />
      <ObjectDetail record={published} settings={site.settings} renderedAt={site.renderedAt} />
    </>
  );
}

export default async function ObjectNumberPage({ params }: Props) {
  const { site, published, alias } = await load((await params).number);
  if (alias) permanentRedirect(canonicalUrl(alias));
  if (!published) notFound();
  return (
    <>
      <Header home={false} />
      <main className="mx-auto flex max-w-content flex-col gap-10 px-6 pt-6 pb-[120px]">
        <Link href="/#objects" className="self-start py-3 text-meta text-muted">
          ← objects
        </Link>
        <Suspense fallback={<div className="min-h-40" />}>
          <Detail params={params} />
        </Suspense>
      </main>
      <Footer settings={site.settings} />
    </>
  );
}
