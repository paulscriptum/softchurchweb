import Link from 'next/link';
import { Suspense } from 'react';
import { connection } from 'next/server';
import { LoginForm } from '@/components/admin/LoginForm';
import { SettingsForm } from '@/components/admin/SettingsForm';
import { ghostButtonClass, panelClass } from '@/components/admin/ui';
import { resolveArtifact, serviceLine } from '@/lib/artifact';
import { adminConfigured, isAdmin } from '@/lib/auth';
import { readSiteData } from '@/lib/data';
import { pad3 } from '@/lib/format';
import {
  currentService,
  doorsOpenAt,
  formatInstant,
  formatRemaining,
  serviceOpensAt,
  serviceWeekday,
} from '@/lib/schedule';
import { usesBlobData, usesBlobMedia } from '@/lib/store';

import { letterFrom, resendConfigured } from '@/lib/resend';
import { listWitnesses } from '@/lib/witness';
import { SITE_URL } from '@/config/site';
import { LetterForm } from '@/components/admin/LetterForm';
import type { ArtifactRecord } from '@/content/types';
import { logout } from './actions';

const requestTime = () => Date.now();

/** A starting point for the letter of the service that is open now. */
function draftLetter(current: number, artifacts: ArtifactRecord[]) {
  if (current === 0) {
    return { subject: 'statement 000 is open.', body: `the doors are open.\n\n${SITE_URL}/#manifesto` };
  }
  const open = artifacts.filter((a) => a.service === current && !a.draft);
  const titles = open.map((a) => a.title);
  const cover = open.find((a) => a.image);
  return {
    image: cover?.image,
    imageAlt: cover ? cover.alt || cover.title : undefined,
    subject: `service ${pad3(current)} is open.`,
    body: `${titles.length ? `${titles.join(', ')}.` : 'something new is given.'}\n\n${SITE_URL}/#objects`,
  };
}

async function Dashboard({ searchParams }: { searchParams: PageProps<'/admin'>['searchParams'] }) {
  await connection();

  if (!adminConfigured()) {
    return (
      <section className="flex max-w-[520px] flex-col gap-3">
        <h1 className="text-lead tracking-tight">the door has no key yet.</h1>
        <p className="text-meta text-muted">
          set ADMIN_PASSWORD in the environment (.env.local here, project settings in vercel) and
          reload.
        </p>
      </section>
    );
  }

  if (!(await isAdmin())) return <LoginForm />;

  const [{ settings, artifacts }, witnesses, params] = await Promise.all([
    readSiteData(),
    listWitnesses(),
    searchParams,
  ]);
  const now = requestTime();
  const current = currentService(now, settings);
  const next = Math.min(current + 1, settings.totalServices);
  const nextAt = serviceOpensAt(next, settings);
  const opensAt = doorsOpenAt(settings);
  const services = [...new Set(artifacts.map((a) => a.service))].sort((a, b) => a - b);
  const confirmed = witnesses.filter((w) => w.confirmedAt).length;
  const letter = draftLetter(current, artifacts);
  const drafts = artifacts.filter((a) => a.draft).length;

  return (
    <>
      <section className="flex flex-wrap items-end justify-between gap-6">
        <div className="flex flex-col gap-1.5">
          <h1 className="text-lead tracking-tight">
            {now < opensAt
              ? 'before the doors open.'
              : current === 0
                ? 'statement 000 is open.'
                : `service ${pad3(current)} is open.`}
          </h1>
          {now < opensAt && (
            <p className="text-meta text-muted">
              {`statement 000 opens ${formatInstant(opensAt, settings)} · in ${formatRemaining(opensAt - now)}`}
            </p>
          )}
          <p className="text-meta text-muted">
            {current < settings.totalServices
              ? `service ${pad3(next)} opens ${formatInstant(nextAt, settings)} · in ${formatRemaining(nextAt - now)}`
              : 'this is the last service.'}
          </p>
          {params.saved && (
            <p className="text-meta">
              {params.saved === 'draft' ? 'kept as a draft. the site does not show it.' : 'kept. it is on the site.'}
            </p>
          )}
        </div>
        <form action={logout}>
          <button type="submit" className={ghostButtonClass}>
            close the door
          </button>
        </form>
      </section>

      {(!usesBlobData() || !usesBlobMedia()) && (
        <p className="border border-line px-4 py-3 text-meta text-muted">
          {usesBlobData() ? '' : 'data is kept in ./.data on this machine. '}
          {usesBlobMedia() ? '' : 'uploads are kept in ./.data/uploads. '}
          on vercel, connect two blob stores: a private one with prefix DATA and a public one with
          prefix MEDIA.
        </p>
      )}

      <section aria-labelledby="objects-admin" className={panelClass}>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h2 id="objects-admin" className="text-meta font-normal">
            objects · {artifacts.length}
            {drafts > 0 && <span className="text-muted"> · {drafts} in drafts</span>}
          </h2>
          <Link href={`/admin/artifacts/new?service=${next}`} className={ghostButtonClass + ' inline-flex items-center'}>
            add an artifact to service {pad3(next)}
          </Link>
        </div>
        {services.map((service) => (
          <div key={service} className="flex flex-col">
            <h3 className="pb-2 text-meta text-muted">
              service {pad3(service)} · {formatInstant(serviceOpensAt(service, settings), settings)}
            </h3>
            <ul className="flex flex-col">
              {artifacts
                .filter((a) => a.service === service)
                .map((record) => {
                  const a = resolveArtifact(record, now, settings);
                  return (
                    <li key={a.id}>
                      <Link
                        href={`/admin/artifacts/${a.id}`}
                        className="grid min-h-11 grid-cols-[1fr_auto] items-center gap-4 border-t border-line text-nav sm:grid-cols-[180px_1fr_auto]"
                      >
                        <span className="hidden text-muted sm:block">{serviceLine(a)}</span>
                        <span className={a.draft ? 'text-muted' : undefined}>{a.title}</span>
                        <span className="text-meta text-muted">
                          {a.draft ? 'draft · ' : ''}
                          {a.status}
                          {record.status !== 'auto' ? ' · pinned' : ''}
                          {a.kind !== 'offering' && !a.href ? ' · no link' : ''}
                          {a.kind === 'offering' && !a.download && !a.href && !a.embed && !a.media?.length
                            ? ' · nothing to receive yet'
                            : ''}
                        </span>
                      </Link>
                    </li>
                  );
                })}
            </ul>
          </div>
        ))}
      </section>

      <section aria-labelledby="schedule-admin" className={panelClass}>
        <h2 id="schedule-admin" className="text-meta font-normal">
          the schedule · every {serviceWeekday(settings)}
        </h2>
        <SettingsForm settings={settings} />
      </section>

      <section aria-labelledby="witnesses-admin" className={panelClass}>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h2 id="witnesses-admin" className="text-meta font-normal">
            witnesses · {confirmed}
            {witnesses.length > confirmed && (
              <span className="text-muted"> · {witnesses.length - confirmed} not confirmed yet</span>
            )}
          </h2>
          <a href="/admin/witnesses.csv" className={ghostButtonClass + ' inline-flex items-center'}>
            download as csv
          </a>
        </div>
        <p className="text-meta text-muted">
          {resendConfigured()
            ? `letters go out through resend from ${letterFrom()}. those who leave are handled by resend.`
            : 'resend is not connected. set RESEND_API_KEY; until then letters are only written to the server log.'}
        </p>
        <ul className="flex flex-col text-nav">
          {witnesses
            .slice(-12)
            .reverse()
            .map((w) => (
              <li key={w.email} className="flex min-h-11 items-center justify-between gap-4 border-t border-line">
                <span className={`truncate ${w.confirmedAt ? '' : 'text-muted'}`}>{w.email}</span>
                <span className="text-meta text-muted">
                  {w.confirmedAt ? w.confirmedAt.slice(0, 10) : 'waiting'}
                </span>
              </li>
            ))}
        </ul>
      </section>

      <section aria-labelledby="letter-admin" className={panelClass}>
        <h2 id="letter-admin" className="text-meta font-normal">
          the letter · to {confirmed} {confirmed === 1 ? 'witness' : 'witnesses'}
        </h2>
        <LetterForm {...letter} />
      </section>
    </>
  );
}

export default function AdminPage({ searchParams }: PageProps<'/admin'>) {
  return (
    <Suspense fallback={<p className="text-meta text-muted">opening…</p>}>
      <Dashboard searchParams={searchParams} />
    </Suspense>
  );
}
