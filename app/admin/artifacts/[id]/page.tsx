import Link from 'next/link';
import { Suspense } from 'react';
import { notFound, redirect } from 'next/navigation';
import { ArtifactForm } from '@/components/admin/ArtifactForm';
import { ghostButtonClass } from '@/components/admin/ui';
import { Tool } from '@/components/tools/Tool';
import { metaLine, objectPath, serviceLine } from '@/lib/artifact';
import { isAdmin } from '@/lib/auth';
import { readSiteData } from '@/lib/data';
import { pad3 } from '@/lib/format';
import { usesBlobMedia } from '@/lib/store';
import { deleteArtifact } from '../../actions';

async function Editor({ params, searchParams }: PageProps<'/admin/artifacts/[id]'>) {
  if (!(await isAdmin())) redirect('/admin');

  const [{ id }, query, data] = await Promise.all([params, searchParams, readSiteData()]);
  const isNew = id === 'new';
  const existing = data.artifacts.find((a) => a.id === id);
  if (!isNew && !existing) notFound();

  const service = Number(query.service) || existing?.service || 1;
  const artifact = existing ?? { service };

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-lead tracking-tight">
          {isNew ? `a new artifact for service ${pad3(service)}` : existing?.title}
        </h1>
        <div className="flex flex-wrap gap-3">
          {existing && (
            <Link
              href={existing.draft ? `/objects/${existing.id}` : objectPath(existing)}
              className={ghostButtonClass + ' inline-flex items-center'}
            >
              {existing.draft ? 'see the draft' : 'its page'}
            </Link>
          )}
          <Link href="/admin" className={ghostButtonClass + ' inline-flex items-center'}>
            back
          </Link>
        </div>
      </div>

      {existing?.tool ? (
        <section aria-label={`${existing.title} preview`} className="flex flex-col gap-6">
          <p className="text-meta text-muted">preview</p>
          <Tool
            id={existing.tool}
            title={existing.title}
            intro={
              <>
                <div className="flex flex-col gap-1.5">
                  <span className="text-meta text-muted">{serviceLine(existing)}</span>
                  <h2 className="text-lead font-normal tracking-tight">{existing.title}</h2>
                  <span className="text-meta text-muted">{metaLine({ ...existing, status: 'open' })}</span>
                </div>
                {existing.description ? (
                  <div className="flex flex-col gap-4 text-base text-body">
                    {existing.description
                      .split(/\n\s*\n/)
                      .map((paragraph) => paragraph.trim())
                      .filter(Boolean)
                      .map((paragraph) => (
                        <p key={paragraph} className="whitespace-pre-line">
                          {paragraph}
                        </p>
                      ))}
                  </div>
                ) : null}
              </>
            }
          />
        </section>
      ) : null}

      <ArtifactForm artifact={artifact} useBlob={usesBlobMedia()} />

      {existing && (
        <form action={deleteArtifact} className="border-t border-line pt-8">
          <input type="hidden" name="id" value={existing.id} />
          <button type="submit" className={ghostButtonClass}>
            remove {existing.title} from the site
          </button>
        </form>
      )}
    </>
  );
}

export default function ArtifactPage(props: PageProps<'/admin/artifacts/[id]'>) {
  return (
    <Suspense fallback={<p className="text-meta text-muted">opening…</p>}>
      <Editor {...props} />
    </Suspense>
  );
}
