'use client';

import { useState, type FormEvent } from 'react';

type State = 'idle' | 'empty' | 'invalid' | 'sending' | 'received' | 'error';

const messages: Record<State, string> = {
  idle: '',
  empty: 'leave an address.',
  invalid: 'that is not an address.',
  sending: 'one moment.',
  received: 'almost. a letter is on its way to confirm.',
  error: 'try again.',
};

// Same rule as lib/witness isEmail. That module is server-only, so the check lives here too.
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function addressState(value: string): 'empty' | 'invalid' | 'ok' {
  const email = value.trim();
  if (!email) return 'empty';
  if (email.length > 254 || !EMAIL.test(email)) return 'invalid';
  return 'ok';
}

export function WitnessBlock() {
  const [state, setState] = useState<State>('idle');

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (state === 'sending') return;
    const form = event.currentTarget;
    const raw = new FormData(form).get('email');
    const email = typeof raw === 'string' ? raw : '';
    const check = addressState(email);
    if (check !== 'ok') {
      setState(check);
      return;
    }
    setState('sending');
    try {
      const res = await fetch('/api/witness', {
        method: 'POST',
        headers: { 'content-type': 'application/json', accept: 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      });
      if (res.status === 400) {
        setState('invalid');
        return;
      }
      if (!res.ok) throw new Error(String(res.status));
      form.reset();
      setState('received');
    } catch {
      setState('error');
    }
  }

  const invalid = state === 'empty' || state === 'invalid';

  return (
    <section
      id="stay"
      aria-labelledby="stay-title"
      className="mx-auto flex max-w-manifesto scroll-mt-4 flex-col gap-10 px-6 py-[120px]"
    >
      <div>
        <h2 id="stay-title" className="text-meta font-normal">
          witness
        </h2>
        <p className="mt-1.5 text-lead leading-[1.25] tracking-tight">
          stay. witness what is set down next.
        </p>
      </div>
      <form
        action="/api/witness"
        method="post"
        onSubmit={onSubmit}
        noValidate
        aria-busy={state === 'sending'}
        className="flex flex-col gap-3.5"
      >
        <label htmlFor="stay-email" className="text-meta text-muted">
          email
        </label>
        <input
          id="stay-email"
          name="email"
          type="email"
          inputMode="email"
          autoComplete="email"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          placeholder="you@somewhere"
          required
          aria-invalid={invalid}
          aria-describedby="stay-status"
          disabled={state === 'sending'}
          onInput={() => {
            if (state !== 'idle' && state !== 'sending') setState('idle');
          }}
          className={`min-h-11 w-full rounded-full border bg-transparent px-3.5 text-nav text-fg placeholder:text-muted disabled:opacity-60 ${invalid ? 'border-fg' : 'border-line'}`}
        />
        <button
          type="submit"
          disabled={state === 'sending'}
          className="min-h-11 w-fit cursor-pointer self-start rounded-full bg-fg px-[22px] text-nav text-bg disabled:cursor-default disabled:opacity-60"
        >
          witness
        </button>
        <p id="stay-status" role="status" aria-live="polite" className="min-h-9 text-meta text-muted">
          {messages[state]}
        </p>
      </form>
    </section>
  );
}
