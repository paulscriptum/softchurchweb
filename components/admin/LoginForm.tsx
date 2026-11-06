'use client';

import { useActionState } from 'react';
import { login, type FormState } from '@/app/admin/actions';
import { buttonClass, inputClass, labelClass } from './ui';

export function LoginForm() {
  const [state, action, pending] = useActionState<FormState, FormData>(login, {});

  return (
    <form action={action} className="flex max-w-[360px] flex-col gap-4">
      <h1 className="text-lead tracking-tight">the keeper&apos;s door.</h1>
      <label className={labelClass}>
        password
        <input
          name="password"
          type="password"
          autoComplete="current-password"
          required
          autoFocus
          className={inputClass}
        />
      </label>
      <button type="submit" disabled={pending} className={`${buttonClass} self-start`}>
        enter
      </button>
      <p aria-live="polite" className="min-h-[18px] text-meta text-muted">
        {state.message}
      </p>
    </form>
  );
}
