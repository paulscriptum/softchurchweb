'use client';

import Link from 'next/link';
import { useState, type FormEvent } from 'react';
import { VIA_KEY, readVia } from '@/lib/via';

type State = 'idle' | 'sending' | 'received' | 'error';

const messages: Record<Exclude<State, 'received'>, string> = {
  idle: '',
  sending: '',
  error: 'try again.',
};

export function WitnessForm({ id = 'witness-email' }: { id?: string }) {
  const [state, setState] = useState<State>('idle');

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const email = new FormData(form).get('email');
    const via = readVia(sessionStorage.getItem(VIA_KEY));
    setState('sending');
    try {
      const res = await fetch('/api/witness', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(via ? { email, via } : { email }),
      });
      if (!res.ok) throw new Error(String(res.status));
      form.reset();
      setState('received');
    } catch {
      setState('error');
    }
  }

  if (state === 'received') {
    return (
      <div role="status" className="flex max-w-[460px] flex-[1_1_320px] flex-col gap-1.5">
        <p className="text-lead font-light tracking-tight">you are a witness now.</p>
        <p className="text-meta text-muted">the first letter comes on sunday.</p>
      </div>
    );
  }

  return (
    <form
      action="/api/witness"
      method="post"
      onSubmit={onSubmit}
      className="flex max-w-[460px] flex-[1_1_320px] flex-col gap-3.5"
    >
      <h2 className="text-lead font-light tracking-tight">become a witness.</h2>
      <p className="text-meta text-muted">one letter every seventh day. nothing else.</p>
      <label htmlFor={id} className="text-meta text-muted">
        email
      </label>
      <div className="flex flex-wrap gap-3">
        <input
          id={id}
          name="email"
          type="email"
          autoComplete="email"
          placeholder="you@somewhere"
          required
          onInput={() => state !== 'idle' && state !== 'sending' && setState('idle')}
          className="min-h-11 min-w-0 flex-[1_1_200px] rounded-full border border-line bg-transparent px-3.5 text-nav text-fg placeholder:text-muted"
        />
        <button
          type="submit"
          disabled={state === 'sending'}
          className="min-h-11 cursor-pointer rounded-full bg-fg px-[22px] text-nav text-bg disabled:cursor-default disabled:opacity-60"
        >
          witness
        </button>
      </div>
      <p className="text-meta text-muted">
        one letter every seventh day. unsubscribe anytime.{' '}
        <Link href="/privacy" className="underline decoration-line decoration-from-font underline-offset-2">
          privacy
        </Link>
      </p>
      <p aria-live="polite" className="min-h-[18px] text-meta text-muted">
        {messages[state]}
      </p>
    </form>
  );
}
