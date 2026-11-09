const rows: { lead: string; rest?: string }[] = [
  {
    lead: 'every sunday at 3:33 pm berlin, one object opens: a sign, a sound or a small tool.',
  },
  {
    lead: 'given objects are free to receive for seven days.',
    rest: 'kept ones come in editions of 333, 33, 12 or 3. a relic is one of one and leaves by auction.',
  },
  {
    lead: 'volume i holds 33 objects.',
    rest: 'then the doors close.',
  },
];

export function HowItWorks() {
  return (
    <section
      id="how"
      aria-labelledby="how-title"
      className="mx-auto flex max-w-content scroll-mt-4 flex-col gap-10 px-6 py-[120px]"
    >
      <h2 id="how-title" className="text-meta font-normal">
        how it works.
      </h2>
      <ol className="flex max-w-about flex-col gap-10">
        {rows.map((row, i) => (
          <li key={row.lead} className="flex items-start gap-4">
            <span
              aria-hidden="true"
              className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full border border-line text-meta leading-none"
            >
              {i + 1}
            </span>
            <div className="min-w-0">
              <p className="font-normal leading-[1.6]">{row.lead}</p>
              {row.rest ? <p className="mt-1.5 text-meta leading-[1.45] text-muted">{row.rest}</p> : null}
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
