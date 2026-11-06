'use client';

import { useSyncExternalStore } from 'react';
import { MINUTE } from './schedule';

function subscribe(onTick: () => void) {
  let interval: ReturnType<typeof setInterval> | undefined;
  const timeout = setTimeout(() => {
    onTick();
    interval = setInterval(onTick, MINUTE);
  }, MINUTE - (Date.now() % MINUTE));
  return () => {
    clearTimeout(timeout);
    clearInterval(interval);
  };
}

const currentMinute = () => Math.floor(Date.now() / MINUTE) * MINUTE;

/** Live clock with minute precision. `serverNow` is used for the server render and hydration. */
export function useNow(serverNow: number): number {
  return useSyncExternalStore(subscribe, currentMinute, () => serverNow);
}
