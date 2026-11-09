'use client';

import { useState } from 'react';
import { WitnessForm } from './WitnessForm';

export function ReceiveOffer({ file }: { file: string }) {
  const [received, setReceived] = useState(false);

  function onReceive() {
    const link = document.createElement('a');
    link.href = file;
    link.download = file.split('/').pop() || 'object';
    document.body.appendChild(link);
    link.click();
    link.remove();
    setReceived(true);
  }

  if (received) {
    return (
      <div className="flex max-w-[460px] flex-col gap-8">
        <p className="text-lead font-light tracking-tight">one letter every seventh day</p>
        <WitnessForm />
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={onReceive}
      className="min-h-11 w-fit cursor-pointer rounded-full bg-fg px-[22px] text-nav text-bg"
    >
      receive
    </button>
  );
}
