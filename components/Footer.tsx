import Link from 'next/link';
import { COPYRIGHT_YEAR, CURATOR_NAME, CURATOR_URL, INSTAGRAM_HANDLE, SITE_NAME } from '@/config/site';
import type { Settings } from '@/content/types';
import { WitnessForm } from './WitnessForm';

export function Footer({ settings }: { settings: Settings }) {
  return (
    <footer id="witness" className="border-t border-line">
      <div className="mx-auto flex max-w-content flex-col gap-[72px] px-6 pt-20 pb-10">
        <div className="flex flex-wrap justify-between gap-12">
          <WitnessForm />
          <nav aria-label="Elsewhere" className="flex flex-col text-nav">
            <a href={settings.instagram} rel="noopener" className="py-3">
              instagram · {INSTAGRAM_HANDLE}
            </a>
            <a href={settings.archive} rel="noopener" className="py-3">
              the archive
            </a>
            <Link href="/#manifesto" className="py-3">
              statement 000
            </Link>
            <a href={CURATOR_URL} rel="noopener" className="py-3">
              curated by {CURATOR_NAME}
            </a>
          </nav>
        </div>
        <div className="flex flex-wrap justify-between gap-x-6 gap-y-2 text-meta text-muted">
          <span>received with gratitude.</span>
          <span>volume i</span>
          <span>
            © {COPYRIGHT_YEAR} {SITE_NAME}
            {' · '}
            <Link href="/imprint">imprint</Link>
            {' · '}
            <Link href="/privacy">privacy</Link>
          </span>
        </div>
      </div>
    </footer>
  );
}
