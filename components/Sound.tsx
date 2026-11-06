'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from 'react';

const TRACK_URL = 'https://soundcloud.com/unseelie_nyc/peaceseeker';
const API_SRC = 'https://w.soundcloud.com/player/api.js';
const STORAGE_KEY = 'soft.church:sound';

interface Widget {
  bind(event: string, listener: () => void): void;
  play(): void;
  pause(): void;
  seekTo(ms: number): void;
  setVolume(volume: number): void;
  isPaused(callback: (paused: boolean) => void): void;
}

declare global {
  interface Window {
    SC?: {
      Widget: ((iframe: HTMLIFrameElement) => Widget) & {
        Events: Record<'READY' | 'PLAY' | 'PLAY_PROGRESS' | 'PAUSE' | 'FINISH', string>;
      };
    };
  }
}

let apiPromise: Promise<void> | null = null;

function loadApi(): Promise<void> {
  if (window.SC) return Promise.resolve();
  apiPromise ??= new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = API_SRC;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => {
      apiPromise = null;
      reject(new Error('soundcloud api failed to load'));
    };
    document.head.appendChild(script);
  });
  return apiPromise;
}

const CHANGE_EVENT = 'soft.church:sound-change';

function subscribe(onChange: () => void) {
  window.addEventListener(CHANGE_EVENT, onChange);
  window.addEventListener('storage', onChange);
  return () => {
    window.removeEventListener(CHANGE_EVENT, onChange);
    window.removeEventListener('storage', onChange);
  };
}

function readPreference(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) !== 'off';
  } catch {
    return true;
  }
}

function writePreference(on: boolean) {
  try {
    localStorage.setItem(STORAGE_KEY, on ? 'on' : 'off');
  } catch {}
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

const SoundContext = createContext<{
  on: boolean;
  toggle: () => void;
  setSilenced: (silenced: boolean) => void;
} | null>(null);

export function SoundProvider({ children }: { children: ReactNode }) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const widgetRef = useRef<Widget | null>(null);
  const on = useSyncExternalStore(subscribe, readPreference, () => true);
  const [silenced, setSilenced] = useState(false);
  const allowed = on && !silenced;
  const allowedRef = useRef(allowed);
  const [mounted, setMounted] = useState(false);

  // The widget pulls in a heavy player; keep it off the first paint and load it
  // once the page is idle, or straight away on the first touch.
  useEffect(() => {
    if (mounted) return;
    let idle = 0;
    let timer = 0;
    const mount = () => setMounted(true);
    const schedule = () => {
      if (typeof window.requestIdleCallback === 'function')
        idle = window.requestIdleCallback(mount, { timeout: 4000 });
      else timer = setTimeout(mount, 1500) as unknown as number;
    };
    if (document.readyState === 'complete') schedule();
    else window.addEventListener('load', schedule, { once: true });
    const early = ['pointerdown', 'keydown'] as const;
    early.forEach((type) => window.addEventListener(type, mount, { once: true, passive: true }));
    return () => {
      window.removeEventListener('load', schedule);
      early.forEach((type) => window.removeEventListener(type, mount));
      if (idle) window.cancelIdleCallback(idle);
      window.clearTimeout(timer);
    };
  }, [mounted]);

  useEffect(() => {
    allowedRef.current = allowed;
    const widget = widgetRef.current;
    if (!widget) return;
    if (allowed) widget.play();
    else widget.pause();
  }, [allowed]);

  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;
    let cancelled = false;
    let removeGesture = () => {};

    // Autoplay with sound is usually blocked until the visitor touches the page,
    // so the first click, tap or key anywhere (except the toggle itself) starts it.
    const startOnGesture = (event: Event) => {
      if ((event.target as Element | null)?.closest?.('[data-sound-toggle]')) return;
      if (allowedRef.current) widgetRef.current?.play();
    };
    const gestures = ['pointerdown', 'click', 'keydown', 'touchend'] as const;

    loadApi()
      .then(() => {
        if (cancelled || !window.SC) return;
        const { Widget: create } = window.SC;
        const widget = create(iframe);
        const { READY, PLAY, PLAY_PROGRESS, FINISH } = create.Events;

        widget.bind(READY, () => {
          widgetRef.current = widget;
          widget.setVolume(60);
          if (allowedRef.current) widget.play();
          gestures.forEach((type) => window.addEventListener(type, startOnGesture, { passive: true }));
          removeGesture = () =>
            gestures.forEach((type) => window.removeEventListener(type, startOnGesture));
        });
        // PLAY also fires for attempts the browser then blocks; only progress proves sound.
        widget.bind(PLAY_PROGRESS, () => removeGesture());
        widget.bind(PLAY, () => {
          if (!allowedRef.current) widget.pause();
        });
        widget.bind(FINISH, () => {
          widget.seekTo(0);
          if (allowedRef.current) widget.play();
        });
      })
      .catch(() => {});

    return () => {
      cancelled = true;
      removeGesture();
      widgetRef.current = null;
    };
  }, [mounted]);

  const toggle = useCallback(() => writePreference(!readPreference()), []);

  const src = `https://w.soundcloud.com/player/?url=${encodeURIComponent(TRACK_URL)}&auto_play=false&visual=false&show_artwork=false&buying=false&sharing=false&download=false&show_comments=false&show_playcount=false&show_user=false`;

  return (
    <SoundContext.Provider value={{ on, toggle, setSilenced }}>
      {children}
      {mounted && (
        <iframe
          ref={iframeRef}
          src={src}
          title="background sound"
          allow="autoplay"
          aria-hidden="true"
          tabIndex={-1}
          className="pointer-events-none fixed -left-[9999px] top-0 h-px w-px opacity-0"
        />
      )}
    </SoundContext.Provider>
  );
}

/** Keeps the house quiet while mounted, e.g. on the admin pages. */
export function Silence() {
  const setSilenced = useContext(SoundContext)?.setSilenced;
  useEffect(() => {
    if (!setSilenced) return;
    setSilenced(true);
    return () => setSilenced(false);
  }, [setSilenced]);
  return null;
}

export function SoundToggle() {
  const sound = useContext(SoundContext);
  if (!sound) return null;
  return (
    <button
      type="button"
      data-sound-toggle
      onClick={sound.toggle}
      aria-pressed={sound.on}
      className={`min-h-11 cursor-pointer py-3 hover:opacity-60 ${sound.on ? '' : 'text-muted line-through'}`}
    >
      sound
    </button>
  );
}
