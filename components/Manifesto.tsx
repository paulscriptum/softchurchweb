import type { manifesto as ManifestoData } from '@/content/manifesto';

function ScriptureRef({
  id,
  reference,
  verse,
}: {
  id: string;
  reference: string;
  verse: string;
}) {
  return (
    <p className="relative mt-1.5">
      <button
        type="button"
        className="peer cursor-help border-0 bg-transparent p-0 font-[inherit] text-meta font-normal text-muted lowercase underline decoration-line decoration-from-font underline-offset-2"
        aria-describedby={id}
      >
        {reference}
      </button>
      <span
        id={id}
        role="tooltip"
        className="pointer-events-none invisible absolute bottom-full left-0 z-10 mb-1.5 w-max max-w-[min(100%,20rem)] border border-line bg-bg px-2.5 py-2 text-left text-meta leading-[1.45] text-body peer-hover:visible peer-focus:visible"
      >
        {verse}
      </span>
    </p>
  );
}

export function Manifesto({ manifesto }: { manifesto: typeof ManifestoData }) {
  return (
    <section
      id="manifesto"
      aria-labelledby="manifesto-title"
      className="mx-auto flex max-w-manifesto flex-col gap-10 px-6 py-[120px] text-base leading-[1.6]"
    >
      <div>
        <h2 id="manifesto-title" className="text-meta font-normal">
          {manifesto.label}
        </h2>
        <p className="mt-1.5 text-lead leading-[1.25] tracking-tight">{manifesto.lead}</p>
      </div>
      {manifesto.theses.map((t) => (
        <div key={t.number}>
          <h3 className="mb-1.5 font-normal">{`${t.number}. ${t.title}`}</h3>
          <p className="text-body">{t.body}</p>
          {t.reference && t.verse && (
            <ScriptureRef id={`verse-${t.number}`} reference={t.reference} verse={t.verse} />
          )}
        </div>
      ))}
      <div>
        <p>
          {manifesto.closing.map((line, i) => (
            <span key={line}>
              {i > 0 ? <br /> : null}
              {line}
            </span>
          ))}
        </p>
        <p className="mt-10 text-meta text-muted lowercase">{manifesto.referencesNote}</p>
        <p className="mt-6 text-meta text-muted">{manifesto.identity}</p>
      </div>
    </section>
  );
}
