'use client';

import { useState } from 'react';
import { mediaKind } from '@/lib/media';
import { labelClass, textareaClass } from './ui';
import { uploadFile } from './upload-file';

export function MediaField({ defaultValue = [], useBlob }: { defaultValue?: string[]; useBlob: boolean }) {
  const [value, setValue] = useState(defaultValue.join('\n'));
  const [status, setStatus] = useState('');
  const urls = value.split('\n').map((l) => l.trim()).filter(Boolean);

  async function onFiles(files: FileList | null) {
    if (!files?.length) return;
    const list = Array.from(files);
    try {
      const added: string[] = [];
      for (const [i, file] of list.entries()) {
        setStatus(`uploading ${i + 1} of ${list.length}…`);
        added.push((await uploadFile(file, 'media', useBlob)).url);
      }
      setValue((v) => [...v.split('\n').map((l) => l.trim()).filter(Boolean), ...added].join('\n'));
      setStatus('received.');
    } catch (error) {
      console.error(error);
      setStatus('try again.');
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <label className={labelClass}>
        images, films and sounds on the object’s page (one address per line, in order)
        <textarea
          name="media"
          rows={Math.max(3, urls.length + 1)}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="/uploads/… or https://…"
          className={textareaClass}
        />
      </label>
      <div className="flex flex-wrap items-center gap-3 text-meta text-muted">
        <input
          type="file"
          multiple
          accept="image/*,video/mp4,video/webm,video/quicktime,audio/*"
          aria-label="upload images, films and sounds"
          onChange={(e) => onFiles(e.target.files)}
          className="max-w-full cursor-pointer text-meta file:mr-3 file:min-h-11 file:cursor-pointer file:rounded-full file:border file:border-line file:bg-transparent file:px-4 file:text-fg"
        />
        <span aria-live="polite">{status}</span>
      </div>
      {urls.length > 0 && (
        <ul className="flex flex-wrap gap-2">
          {urls.map((url) =>
            mediaKind(url) === 'image' ? (
              <li key={url}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={url} alt="" className="h-20 w-auto bg-line" />
              </li>
            ) : (
              <li key={url} className="flex h-20 items-center border border-line px-3 text-meta text-muted">
                {mediaKind(url)}
              </li>
            ),
          )}
        </ul>
      )}
    </div>
  );
}
