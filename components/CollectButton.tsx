import Link from 'next/link';
import { actionFor, type ResolvedArtifact } from '@/lib/artifact';

const base = 'flex min-h-11 items-center justify-between gap-3 border-t border-line text-meta';

function Inner({
  label,
  title,
  timer,
  arrow = '→',
}: {
  label: string;
  title: string;
  timer?: string;
  arrow?: string;
}) {
  return (
    <>
      <span>
        {label}
        <span className="sr-only"> · {title}</span>
      </span>
      <span className="flex items-center gap-2">
        {timer && <span className="text-muted tabular-nums">{timer}</span>}
        <span aria-hidden="true">{arrow}</span>
      </span>
    </>
  );
}

// Interface stays `artifact in, UI out` so a marketplace widget can replace it later.
export function CollectButton({
  artifact,
  onPage = false,
}: {
  artifact: ResolvedArtifact;
  onPage?: boolean;
}) {
  const action = actionFor(artifact, onPage);
  const props = { label: action.label, title: artifact.title, timer: action.timer };

  switch (action.mode) {
    case 'download':
      return (
        <a href={action.href} download className={base}>
          <Inner {...props} />
        </a>
      );
    case 'link':
      return (
        <a href={action.href} target="_blank" rel="noopener" className={base}>
          <Inner {...props} />
        </a>
      );
    case 'page':
      return onPage ? (
        <a href={action.href} className={base}>
          <Inner {...props} arrow="↓" />
        </a>
      ) : (
        <Link href={action.href} className={base}>
          <Inner {...props} />
        </Link>
      );
    case 'pending':
      return (
        <span aria-disabled="true" className={base}>
          <Inner {...props} />
        </span>
      );
    case 'muted':
      return (
        <span aria-disabled="true" className={`${base} text-muted`}>
          <Inner {...props} />
        </span>
      );
  }
}
