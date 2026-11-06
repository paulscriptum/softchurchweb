import Image from 'next/image';
import Link from 'next/link';
import { metaLines, objectPath, serviceLine, type ResolvedArtifact } from '@/lib/artifact';
import { CollectButton } from './CollectButton';

export function ObjectCard({ artifact }: { artifact: ResolvedArtifact }) {
  const href = objectPath(artifact);
  return (
    <article className="flex min-w-0 flex-col gap-3.5">
      {/* the title carries the link for keyboards and screen readers; the image repeats it for the hand */}
      <Link href={href} tabIndex={-1} aria-hidden="true" className="block">
        {artifact.image ? (
          <Image
            src={artifact.image}
            alt=""
            width={600}
            height={1300}
            sizes="(min-width: 1200px) 170px, (min-width: 768px) 22vw, 45vw"
            className="block aspect-[6/13] w-full bg-line object-cover"
          />
        ) : (
          <div className="aspect-[6/13] w-full bg-line" />
        )}
      </Link>
      <div className="flex flex-col gap-[3px] text-meta">
        <span className="text-muted">{serviceLine(artifact)}</span>
        <h3 className="font-normal">
          <Link href={href}>{artifact.title}</Link>
        </h3>
        {metaLines(artifact).map((line) => (
          <span key={line} className="text-muted">
            {line}
          </span>
        ))}
      </div>
      <div className="mt-auto">
        <CollectButton artifact={artifact} />
      </div>
    </article>
  );
}
