import type { Metadata } from 'next';
import { Suspense } from 'react';
import Link from 'next/link';
import { BlurDot } from '@/components/BlurDot';
import { Silence } from '@/components/Sound';
import { ThemeToggle } from '@/components/ThemeToggle';

export const metadata: Metadata = {
  title: 'admin · soft.church',
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: LayoutProps<'/admin'>) {
  return (
    <div className="mx-auto flex min-h-svh max-w-content flex-col gap-12 px-6 pb-24">
      <Silence />
      <header className="flex flex-wrap items-center justify-between gap-x-6 py-5 text-nav">
        <Link href="/admin" className="flex items-center py-3 text-base tracking-[-0.01em]">
          <span>soft</span>
          <BlurDot size={6} blurRatio={1 / 6} className="mx-[3px] mt-1" />
          <span>church</span>
          <span className="ml-2 text-muted">· admin</span>
        </Link>
        <div className="flex items-center gap-6">
          <Link href="/" className="py-3">
            the site
          </Link>
          <ThemeToggle />
        </div>
      </header>
      <main className="flex flex-col gap-12">
        <Suspense fallback={<p className="text-meta text-muted">opening…</p>}>{children}</Suspense>
      </main>
    </div>
  );
}
