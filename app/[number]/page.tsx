import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import { Footer } from '@/components/Footer';
import { Header } from '@/components/Header';
import { JsonLd } from '@/components/JsonLd';
import { ObjectDetail } from '@/components/ObjectDetail';
import { SITE_NAME } from '@/config/site';
import type { ArtifactRecord } from '@/content/types';
import { objectPath, serviceLine } from '@/lib/artifact';
import { getSiteData } from '@/lib/data';
import { pad3 } from '@/lib/format';
import { creativeWorkLd } from '@/lib/structured-data';

type Props = { params: Promise<{ number: string }> };

async function published(number: string): Promise<ArtifactRecord | undefined> {
  if (!/^\d{3}$/.test(number)) return undefined;
  const { artifacts } = await getSiteData();
  return artifacts.find((artifact) => pad3(artifact.service) === number);
}

export async function generateStaticParams() {
  const { artifacts } = await getSiteData();
  return artifacts.map((artifact) => ({ number: pad3(artifact.service) }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const record = await published((await params).number);
  if (!record) return { title: 'nothing is kept here', robots: { index: false, follow: false } };

  const title = `${record.title} · ${SITE_NAME}`;
  const description = record.description?.split(/\n\s*\n/)[0].slice(0, 160) || `${serviceLine(record)} · ${record.alt}`;
  const images = record.image ? [{ url: record.image, width: 600, height: 1300, alt: record.alt }] : undefined;
  return {
    title: { absolute: title },
    description,
    alternates: { canonical: objectPath(record) },
    openGraph: { title, description, url: objectPath(record), siteName: SITE_NAME, type: 'article', images },
    twitter: { card: record.image ? 'summary_large_image' : 'summary', title, description },
  };
}

async function Detail({ params }: Props) {
  const record = await published((await params).number);
  if (!record) notFound();
  const site = await getSiteData();
  return (
    <>
      <JsonLd data={creativeWorkLd(record, site.settings)} />
      <ObjectDetail record={record} settings={site.settings} renderedAt={site.renderedAt} />
    </>
  );
}

export default async function ObjectNumberPage({ params }: Props) {
  const site = await getSiteData();
  return (
    <>
      <Header home={false} />
      <main className="mx-auto flex max-w-content flex-col gap-10 px-6 pt-6 pb-[120px]">
        <Link href="/#objects" className="self-start py-3 text-meta text-muted">
          ← objects
        </Link>
        <Suspense fallback={<div className="aspect-[6/13] w-full max-w-[280px] bg-line md:max-w-[360px]" />}>
          <Detail params={params} />
        </Suspense>
      </main>
      <Footer settings={site.settings} />
    </>
  );
}
