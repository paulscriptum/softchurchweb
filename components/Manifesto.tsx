import type { manifesto as ManifestoData } from '@/content/manifesto';

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
          <p className="mt-1.5 text-meta text-muted lowercase">{t.reference}</p>
        </div>
      ))}
      <div>
        <p>
          {manifesto.closing[0]}
          <br />
          {manifesto.closing[1]}
        </p>
        <p className="mt-10 text-meta text-muted lowercase">{manifesto.referencesNote}</p>
      </div>
    </section>
  );
}
