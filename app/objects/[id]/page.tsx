import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import { Footer } from '@/components/Footer';
import { Header } from '@/components/Header';
import { ObjectDetail } from '@/components/ObjectDetail';
import { SITE_NAME } from '@/config/site';
import { seedArtifacts } from '@/content/artifacts';
import { isAdmin } from '@/lib/auth';
import { getSiteData, readSiteData } from '@/lib/data';
import { objectPath, serviceLine } from '@/lib/artifact';

export async function generateStaticParams() {
  try {
    const { artifacts } = await getSiteData();
    if (artifacts.length > 0) return artifacts.map((a) => ({ id: a.id }));
  } catch {
    // storage may be out of reach while building; objects added later render on first visit
  }
  return seedArtifacts.map((a) => ({ id: a.id }));
}

export async function generateMetadata({ params }: PageProps<'/objects/[id]'>): Promise<Metadata> {
  const { id } = await params;
  const { artifacts } = await getSiteData();
  const a = artifacts.find((x) => x.id === id);
  if (!a) return { title: SITE_NAME, robots: { index: false, follow: false } };

  const title = `${a.title} · ${SITE_NAME}`;
  const description = a.description?.split(/\n\s*\n/)[0].slice(0, 160) || `${serviceLine(a)} · ${a.alt}`;
  const images = a.image ? [{ url: a.image, width: 600, height: 1300, alt: a.alt }] : undefined;
  return {
    title,
    description,
    alternates: { canonical: objectPath(a) },
    openGraph: { title, description, url: objectPath(a), siteName: SITE_NAME, type: 'article', images },
    twitter: { card: a.image ? 'summary_large_image' : 'summary', title, description },
  };
}

async function Detail({ params }: Pick<PageProps<'/objects/[id]'>, 'params'>) {
  const { id } = await params;
  const site = await getSiteData();
  const record = site.artifacts.find((a) => a.id === id);
  if (record) return <ObjectDetail record={record} settings={site.settings} renderedAt={site.renderedAt} />;

  const draft = (await isAdmin()) && (await readSiteData()).artifacts.find((a) => a.id === id && a.draft);
  if (!draft) notFound();
  return (
    <>
      <p className="border border-line px-4 py-3 text-meta text-muted">
        a draft. only you can see this page.{' '}
        <Link href={`/admin/artifacts/${draft.id}`} className="text-fg underline underline-offset-4">
          back to it
        </Link>
      </p>
      <ObjectDetail record={draft} settings={site.settings} renderedAt={site.renderedAt} />
    </>
  );
}

export default async function ObjectPage({ params }: PageProps<'/objects/[id]'>) {
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
