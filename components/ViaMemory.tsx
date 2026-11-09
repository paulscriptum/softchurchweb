'use client';

import { useEffect } from 'react';
import { VIA_KEY, readVia } from '@/lib/via';

/** Keeps a known ?via= for the rest of the visit. Unknown values are ignored. */
export function ViaMemory() {
  useEffect(() => {
    const via = readVia(new URLSearchParams(window.location.search).get('via'));
    if (via) sessionStorage.setItem(VIA_KEY, via);
  }, []);
  return null;
}
