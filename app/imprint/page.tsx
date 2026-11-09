import type { Metadata } from 'next';
import { QuietPage } from '@/components/QuietPage';
import { CURATOR_NAME, CURATOR_URL, INSTAGRAM_HANDLE } from '@/config/site';
import { getSiteData } from '@/lib/data';

export const metadata: Metadata = { title: 'imprint' };

export default async function ImprintPage() {
  const { settings } = await getSiteData();
  return (
    <QuietPage title="imprint" settings={settings}>
      <p>soft.church is an independent art project. it is not a church, and it is not a religious institution.</p>
      <p>published by {CURATOR_NAME}.</p>
      <p>
        <a href={settings.instagram} rel="noopener" className="underline decoration-line underline-offset-2">
          instagram · {INSTAGRAM_HANDLE}
        </a>
        {' · '}
        <a href={CURATOR_URL} rel="noopener" className="underline decoration-line underline-offset-2">
          shchepochk.in
        </a>
        {' · '}
        <a href="mailto:service@soft.church" className="underline decoration-line underline-offset-2">
          service@soft.church
        </a>
      </p>
    </QuietPage>
  );
}
