'use client';

import { useState } from 'react';
import { inputClass, labelClass } from './ui';
import { uploadFile } from './upload-file';

interface FileFieldProps {
  name: string;
  label: string;
  hint?: string;
  defaultValue?: string;
  accept: string;
  folder: string;
  useBlob: boolean;
  /** store the forced-download url (for wallpapers) instead of the plain url */
  asDownload?: boolean;
  preview?: boolean;
}

export function FileField({
  name,
  label,
  hint,
  defaultValue = '',
  accept,
  folder,
  useBlob,
  asDownload,
  preview,
}: FileFieldProps) {
  const [value, setValue] = useState(defaultValue);
  const [status, setStatus] = useState('');

  async function onFile(file: File | undefined) {
    if (!file) return;
    setStatus('uploading…');
    try {
      const { url, downloadUrl } = await uploadFile(file, folder, useBlob);
      setValue(asDownload ? downloadUrl : url);
      setStatus('received.');
    } catch (error) {
      console.error(error);
      setStatus('try again.');
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <label className={labelClass}>
        {label}
        <input
          name={name}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="/objects/… or https://…"
          className={inputClass}
        />
      </label>
      <div className="flex flex-wrap items-center gap-3 text-meta text-muted">
        <input
          type="file"
          accept={accept}
          aria-label={`upload ${label}`}
          onChange={(e) => onFile(e.target.files?.[0])}
          className="max-w-full cursor-pointer text-meta file:mr-3 file:min-h-11 file:cursor-pointer file:rounded-full file:border file:border-line file:bg-transparent file:px-4 file:text-fg"
        />
        <span aria-live="polite">{status}</span>
        {hint && <span>{hint}</span>}
      </div>
      {preview && value && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={value} alt="" className="aspect-[6/13] w-24 bg-line object-cover" />
      )}
    </div>
  );
}
