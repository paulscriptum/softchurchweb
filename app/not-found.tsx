import Link from 'next/link';
import { BlurDot } from '@/components/BlurDot';

export default function NotFound() {
  return (
    <main className="flex min-h-svh flex-col items-center justify-center gap-8 px-6 text-center">
      <BlurDot size={48} />
      <h1 className="text-lead font-normal tracking-tight">nothing is kept here.</h1>
      <Link href="/" className="text-nav text-muted">
        back to the house
      </Link>
    </main>
  );
}
