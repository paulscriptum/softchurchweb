import type { Metadata } from 'next';
import { QuietPage } from '@/components/QuietPage';
import { getSiteData } from '@/lib/data';

export const metadata: Metadata = { title: 'privacy' };

export default async function PrivacyPage() {
  const { settings } = await getSiteData();
  return (
    <QuietPage title="privacy" settings={settings}>
      <p>
        an address left here is kept as unconfirmed. one letter asks you to confirm. the sunday letter goes out only
        after that, and only to confirmed addresses. unsubscribe anytime.
      </p>
      <p>
        the time of confirmation is stored then. if you arrived from reddit, pinterest, hn, linkedin, telegram, arena,
        or letter, that name is stored then too. any other name is dropped.
      </p>
      <p>
        the site is hosted on vercel. letters go through resend. vercel web analytics is on, and a known arrival can
        travel with the page view. addresses are not sold.
      </p>
    </QuietPage>
  );
}
