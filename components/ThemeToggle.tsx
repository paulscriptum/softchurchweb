'use client';

import { useSyncExternalStore } from 'react';
import { THEME_STORAGE_KEY } from './ThemeScript';

function subscribe(onChange: () => void) {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, { attributeFilter: ['data-theme'] });
  return () => observer.disconnect();
}

const isDark = () => document.documentElement.getAttribute('data-theme') === 'dark';

export function ThemeToggle() {
  const dark = useSyncExternalStore(subscribe, isDark, () => false);

  function toggle() {
    const next = dark ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, next);
    } catch {}
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={dark}
      className="min-h-11 cursor-pointer py-3 hover:opacity-60"
    >
      invert
    </button>
  );
}
