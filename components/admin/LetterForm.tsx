'use client';

import { startTransition, useActionState, type FormEvent } from 'react';
import { sendLetter, type FormState } from '@/app/admin/actions';
import { buttonClass, ghostButtonClass, inputClass, labelClass, textareaClass } from './ui';

interface Props {
  subject: string;
  body: string;
  image?: string;
  imageAlt?: string;
}

export function LetterForm({ subject, body, image, imageAlt }: Props) {
  const [state, action, pending] = useActionState<FormState, FormData>(sendLetter, {});

  // Submitted by hand so the fields survive a test: a form action would reset them to the
  // draft, and the letter sent to everyone must be the one that was tested.
  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const submitter = (event.nativeEvent as SubmitEvent).submitter;
    const fd = new FormData(event.currentTarget, submitter);
    startTransition(() => action(fd));
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <label className={labelClass}>
        subject
        <input name="subject" required defaultValue={subject} className={inputClass} />
      </label>
      <label className={labelClass}>
        the letter (an empty line starts a new paragraph; links stay links)
        <textarea name="body" required rows={7} defaultValue={body} className={textareaClass} />
      </label>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className={labelClass}>
          an image above the letter (optional)
          <input name="image" defaultValue={image} placeholder="/objects/… or https://…" className={inputClass} />
        </label>
        <label className={labelClass}>
          what the image shows
          <input name="imageAlt" defaultValue={imageAlt} className={inputClass} />
        </label>
      </div>
      <div className="flex flex-wrap items-end gap-3">
        <label className={`${labelClass} flex-[1_1_240px]`}>
          send a test to
          <input name="testTo" type="email" placeholder="you@somewhere" className={inputClass} />
        </label>
        <button type="submit" name="intent" value="test" disabled={pending} className={ghostButtonClass}>
          send a test
        </button>
      </div>
      <div className="flex flex-wrap items-center gap-4">
        <label className="flex min-h-11 cursor-pointer items-center gap-2 text-meta text-muted">
          <input type="checkbox" name="sure" value="yes" className="size-4 accent-current" />
          i read it twice
        </label>
        <button type="submit" name="intent" value="all" disabled={pending} className={buttonClass}>
          send to every witness
        </button>
        <p aria-live="polite" className="text-meta text-muted">
          {state.message}
        </p>
      </div>
    </form>
  );
}
