import type { ReactNode } from 'react';
import { Footer } from '@/components/Footer';
import { Header } from '@/components/Header';
import type { Settings } from '@/content/types';

export function QuietPage({
  title,
  settings,
  children,
}: {
  title: string;
  settings: Settings;
  children: ReactNode;
}) {
  return (
    <>
      <Header home={false} />
      <main className="mx-auto flex min-h-[60svh] max-w-manifesto flex-col gap-6 px-6 py-[120px]">
        <h1 className="text-meta font-normal">{title}</h1>
        <div className="text-base leading-[1.6] text-body">{children}</div>
      </main>
      <Footer settings={settings} />
    </>
  );
}
