import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound, permanentRedirect } from 'next/navigation';
import { Suspense } from 'react';
import { Footer } from '@/components/Footer';
import { Header } from '@/components/Header';
import { JsonLd } from '@/components/JsonLd';
import { ObjectDetail } from '@/components/ObjectDetail';
import { SITE_NAME } from '@/config/site';
import { seedArtifacts } from '@/content/artifacts';
import { isAdmin } from '@/lib/auth';
import { getSiteData, readSiteData } from '@/lib/data';
import { objectPath, serviceLine } from '@/lib/artifact';
import { pad3 } from '@/lib/format';
import { creativeWorkLd } from '@/lib/structured-data';

function withQuery(path: string, query: Record<string, string | string[] | undefined>): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (typeof value === 'string') params.append(key, value);
    else if (value) for (const item of value) params.append(key, item);
  }
  const search = params.toString();
  return search ? `${path}?${search}` : path;
}

export async function generateStaticParams() {
  // Published objects 308 to /001, so only drafts are real pages at this address.
  try {
    const drafts = (await readSiteData()).artifacts.filter((artifact) => artifact.draft);
    if (drafts.length > 0) return drafts.map((artifact) => ({ id: artifact.id }));
  } catch {
    // storage may be out of reach while building; objects added later render on first visit
  }
  const drafts = seedArtifacts.filter((artifact) => artifact.draft);
  return (drafts.length > 0 ? drafts : seedArtifacts).map((artifact) => ({ id: artifact.id }));
}

export async function generateMetadata({ params }: PageProps<'/objects/[id]'>): Promise<Metadata> {
  const { id } = await params;
  const { artifacts } = await getSiteData();
  const published =
    artifacts.find((artifact) => artifact.id === id) ??
    (/^\d{1,3}$/.test(id) ? artifacts.find((artifact) => pad3(artifact.service) === pad3(Number(id))) : undefined);
  if (published) permanentRedirect(objectPath(published));
  const a = artifacts.find((x) => x.id === id);
  if (!a) return { title: 'nothing is kept here', robots: { index: false, follow: false } };

  const title = `${a.title} · ${SITE_NAME}`;
  const description = a.description?.split(/\n\s*\n/)[0].slice(0, 160) || `${serviceLine(a)} · ${a.alt}`;
  const images = a.image ? [{ url: a.image, width: 600, height: 1300, alt: a.alt }] : undefined;
  return {
    title: { absolute: title },
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
  if (record) {
    return (
      <>
        <JsonLd data={creativeWorkLd(record, site.settings)} />
        <ObjectDetail record={record} settings={site.settings} renderedAt={site.renderedAt} />
      </>
    );
  }

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
      <ObjectDetail record={draft} settings={site.settings} renderedAt={site.renderedAt} preview />
    </>
  );
}

export default async function ObjectPage({ params, searchParams }: PageProps<'/objects/[id]'>) {
  const { id } = await params;
  const site = await getSiteData();
  const published =
    site.artifacts.find((artifact) => artifact.id === id) ??
    (/^\d{1,3}$/.test(id) ? site.artifacts.find((artifact) => pad3(artifact.service) === pad3(Number(id))) : undefined);
  if (published) permanentRedirect(withQuery(objectPath(published), await searchParams));
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
