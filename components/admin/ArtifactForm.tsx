'use client';

import { useActionState, useState } from 'react';
import { saveArtifact, type FormState } from '@/app/admin/actions';
import {
  ARTIFACT_TYPES,
  EDITIONS,
  KINDS,
  STATUSES,
  TOOLS,
  TOOL_LABELS,
  type ArtifactRecord,
  type Kind,
} from '@/content/types';
import { FileField } from './FileField';
import { MediaField } from './MediaField';
import { buttonClass, ghostButtonClass, inputClass, labelClass, selectClass, textareaClass } from './ui';

export function ArtifactForm({
  artifact,
  useBlob,
}: {
  artifact: Partial<ArtifactRecord> & { service: number };
  useBlob: boolean;
}) {
  const [state, action, pending] = useActionState<FormState, FormData>(saveArtifact, {});
  const [kind, setKind] = useState<Kind>(artifact.kind ?? 'offering');
  const published = Boolean(artifact.id) && !artifact.draft;

  return (
    <form action={action} className="grid gap-4 sm:grid-cols-2">
      <input type="hidden" name="originalId" value={artifact.id ?? ''} />

      <label className={labelClass}>
        title
        <input name="title" required defaultValue={artifact.title} className={inputClass} />
      </label>
      <label className={labelClass}>
        id (for the url, made from the title when empty)
        <input name="id" defaultValue={artifact.id} className={inputClass} />
      </label>

      <label className={labelClass}>
        service
        <input
          name="service"
          type="number"
          min={1}
          max={999}
          required
          defaultValue={artifact.service}
          className={inputClass}
        />
      </label>
      <label className={labelClass}>
        kind
        <select
          name="kind"
          value={kind}
          onChange={(e) => setKind(e.target.value as Kind)}
          className={selectClass}
        >
          {KINDS.map((k) => (
            <option key={k}>{k}</option>
          ))}
        </select>
      </label>

      <label className={labelClass}>
        type
        <select name="type" defaultValue={artifact.type ?? 'sign'} className={selectClass}>
          {ARTIFACT_TYPES.map((t) => (
            <option key={t}>{t}</option>
          ))}
        </select>
      </label>
      <label className={labelClass}>
        status
        <select name="status" defaultValue={artifact.status ?? 'auto'} className={selectClass}>
          <option value="auto">auto · follows the schedule</option>
          {STATUSES.map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
      </label>

      <div className="sm:col-span-2">
        <FileField
          name="image"
          label="image for the grid (6:13, about 600×1300)"
          defaultValue={artifact.image}
          accept="image/jpeg,image/png,image/webp"
          folder="objects"
          useBlob={useBlob}
          preview
        />
      </div>
      <label className={`${labelClass} sm:col-span-2`}>
        image description (for people who cannot see it)
        <input name="alt" required defaultValue={artifact.alt} className={inputClass} />
      </label>

      {kind === 'offering' && (
        <div className="sm:col-span-2">
          <FileField
            name="download"
            label="file to receive (the full wallpaper, the mix, the tool)"
            defaultValue={artifact.download}
            accept="image/*,audio/*,video/mp4,application/zip,application/pdf"
            folder="wallpapers"
            useBlob={useBlob}
            asDownload
          />
          <label className={`${labelClass} mt-4`}>
            or a link to receive it elsewhere (used when there is no file)
            <input
              name="href"
              type="url"
              placeholder="https://…"
              defaultValue={artifact.href}
              className={inputClass}
            />
          </label>
        </div>
      )}

      {kind === 'keeping' && (
        <>
          <label className={labelClass}>
            edition
            <select
              name="edition"
              defaultValue={artifact.edition ?? 33}
              className={selectClass}
            >
              {EDITIONS.filter((e) => e !== 1).map((e) => (
                <option key={e}>{e}</option>
              ))}
            </select>
          </label>
          <label className={labelClass}>
            price (shown as written, e.g. 33 €)
            <input name="price" defaultValue={artifact.price} className={inputClass} />
          </label>
        </>
      )}

      {kind !== 'offering' && (
        <label className={labelClass}>
          {kind === 'relic' ? 'auction link' : 'keep link (marketplace)'}
          <input
            name="href"
            type="url"
            placeholder="https://…"
            defaultValue={artifact.href}
            className={inputClass}
          />
        </label>
      )}

      <label className={labelClass}>
        guest (optional)
        <input name="guest" defaultValue={artifact.guest} className={inputClass} />
      </label>

      <h2 className="mt-6 border-t border-line pt-6 text-nav sm:col-span-2">the object’s own page</h2>

      <label className={`${labelClass} sm:col-span-2`}>
        words (an empty line starts a new paragraph)
        <textarea
          name="description"
          rows={5}
          defaultValue={artifact.description}
          className={textareaClass}
        />
      </label>

      <label className={`${labelClass} sm:col-span-2`}>
        an instrument built into the site
        <select name="tool" defaultValue={artifact.tool ?? ''} className={selectClass}>
          <option value="">none</option>
          {TOOLS.map((t) => (
            <option key={t} value={t}>
              {TOOL_LABELS[t]}
            </option>
          ))}
        </select>
      </label>

      <label className={`${labelClass} sm:col-span-2`}>
        a web page to show inside (a tool, a film, a piece of software · https://…)
        <input
          name="embed"
          type="url"
          placeholder="https://…"
          defaultValue={artifact.embed}
          className={inputClass}
        />
      </label>

      <div className="sm:col-span-2">
        <MediaField defaultValue={artifact.media} useBlob={useBlob} />
      </div>

      <p className="text-meta text-muted sm:col-span-2">
        what is inside opens with the service.
      </p>

      <p className="text-meta text-muted sm:col-span-2">
        {published
          ? 'this object is on the site.'
          : 'a draft is seen only here and on its page while you are signed in.'}
      </p>

      <div className="flex flex-wrap items-center gap-4 sm:col-span-2">
        {published ? (
          <>
            <button type="submit" name="intent" value="publish" disabled={pending} className={buttonClass}>
              keep
            </button>
            <button type="submit" name="intent" value="draft" disabled={pending} className={ghostButtonClass}>
              take back to drafts
            </button>
          </>
        ) : (
          <>
            <button type="submit" name="intent" value="draft" disabled={pending} className={ghostButtonClass}>
              keep as a draft
            </button>
            <button type="submit" name="intent" value="publish" disabled={pending} className={buttonClass}>
              publish
            </button>
          </>
        )}
        <p aria-live="polite" className="text-meta text-muted">
          {state.message}
        </p>
      </div>
    </form>
  );
}
