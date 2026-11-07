import Link from 'next/link';
import { BlurDot } from './BlurDot';

export function WitnessState({ title, line, back }: { title: string; line: string; back: string }) {
  return (
    <main className="flex min-h-svh flex-col items-center justify-center gap-8 px-6 text-center">
      <BlurDot size={48} />
      <div className="flex flex-col gap-2">
        <h1 className="text-lead font-normal tracking-tight">{title}</h1>
        <p className="text-meta text-muted">{line}</p>
      </div>
      <Link href={back} className="text-nav text-muted">
        back to the house
      </Link>
    </main>
  );
}
