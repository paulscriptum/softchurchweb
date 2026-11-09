'use client';

import {
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type KeyboardEvent,
  type PointerEvent,
  type ReactNode,
} from 'react';
import { paramsFromSeed, randomSeed, serial, type GodraysParams } from '@/lib/godrays/params';
import { GodraysRenderer } from '@/lib/godrays/renderer';
import { WitnessForm } from '../WitnessForm';

const FORMATS = {
  phone: { label: 'for a phone', width: 1290, height: 2796 },
  screen: { label: 'for a screen', width: 3840, height: 2160 },
} as const;
type Format = keyof typeof FORMATS;

const PREVIEW_LONG_SIDE = 1400;
const chip =
  'min-h-11 cursor-pointer rounded-full border border-line px-[18px] text-nav aria-pressed:border-fg';
const row = 'flex min-h-11 cursor-pointer items-center justify-between border-t border-line text-left';
const clamp = (v: number) => Math.min(0.95, Math.max(0.05, v));

function previewSize(format: Format, scale = 1): [number, number] {
  const { width, height } = FORMATS[format];
  const k = (PREVIEW_LONG_SIDE * scale) / Math.max(width, height);
  return [Math.round(width * k), Math.round(height * k)];
}

/** `?n=048213` brings back a picture someone has already received. */
function seedFromAddress(): number | null {
  const n = new URLSearchParams(window.location.search).get('n');
  if (!n || !/^\d{1,6}$/.test(n)) return null;
  return Number(n);
}

// Chosen once per visit in the browser; the server has no seed, so it renders an empty frame.
let visitSeed: number | undefined;
let canDraw: boolean | undefined;
const noSubscribe = () => () => {};
const browserSeed = () => (visitSeed ??= seedFromAddress() ?? randomSeed());
const browserCanDraw = () => (canDraw ??= GodraysRenderer.supported());

function toBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('blob'))), 'image/jpeg', 0.95),
  );
}

async function exportPicture(
  params: GodraysParams,
  format: Format,
  light?: [number, number],
): Promise<Blob> {
  const canvas = document.createElement('canvas');
  const renderer = new GodraysRenderer(canvas);
  try {
    renderer.render(params, FORMATS[format].width, FORMATS[format].height, light);
    return await toBlob(canvas);
  } finally {
    renderer.dispose();
  }
}

/** `intro` is the object's own words; the instrument stands where its picture would. */
export function Godrays({ title, intro }: { title: string; intro: ReactNode }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const dragging = useRef(false);
  const shownLight = useRef<[number, number] | null>(null);
  const drawnOnce = useRef(false);
  const firstSeed = useSyncExternalStore(noSubscribe, browserSeed, () => null);
  const supported = useSyncExternalStore(noSubscribe, browserCanDraw, () => true);
  const [chosenSeed, setChosenSeed] = useState<number | null>(null);
  const [light, setLight] = useState<[number, number] | null>(null);
  const [format, setFormat] = useState<Format>('phone');
  const [status, setStatus] = useState('');
  const [invited, setInvited] = useState(false);
  const [failed, setFailed] = useState(false);
  const [touched, setTouched] = useState(false);

  const seed = chosenSeed ?? firstSeed;
  const params = seed === null ? null : paramsFromSeed(seed);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !params || !supported) return;
    const draw = (scale: number) => {
      try {
        const [w, h] = previewSize(format, scale);
        shownLight.current = GodraysRenderer.for(canvas).render(params, w, h, light ?? undefined);
      } catch (error) {
        console.error(error);
        setFailed(true);
      }
    };
    // the first picture arrives rough and quick, then settles into full detail when the page is idle
    if (!drawnOnce.current) {
      drawnOnce.current = true;
      const frame = requestAnimationFrame(() => draw(0.5));
      const idle = setTimeout(() => draw(1), 600);
      return () => {
        cancelAnimationFrame(frame);
        clearTimeout(idle);
      };
    }
    const frame = requestAnimationFrame(() => draw(1));
    return () => cancelAnimationFrame(frame);
  });

  useEffect(() => {
    if (seed === null) return;
    const url = new URL(window.location.href);
    url.searchParams.set('n', String(seed).padStart(6, '0'));
    window.history.replaceState(window.history.state, '', url);
  }, [seed]);

  function another() {
    setChosenSeed(randomSeed());
    setLight(null);
    setStatus('');
  }

  function moveTo(e: PointerEvent<HTMLCanvasElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    setLight([clamp((e.clientX - rect.left) / rect.width), clamp((e.clientY - rect.top) / rect.height)]);
  }

  function nudge(e: KeyboardEvent<HTMLCanvasElement>) {
    if (!params) return;
    const step = e.shiftKey ? 0.08 : 0.02;
    const moves: Record<string, [number, number]> = {
      ArrowLeft: [-step, 0],
      ArrowRight: [step, 0],
      ArrowUp: [0, -step],
      ArrowDown: [0, step],
    };
    const move = moves[e.key];
    if (!move) return;
    e.preventDefault();
    const [x, y] = shownLight.current ?? params.light;
    setLight([clamp(x + move[0]), clamp(y + move[1])]);
  }

  async function receive() {
    if (!params || seed === null) return;
    setStatus('receiving…');
    try {
      const blob = await exportPicture(params, format, light ?? undefined);
      const name = `soft-church-${title.replace(/\s+/g, '-')}-${String(seed).padStart(6, '0')}.jpg`;
      const file = new File([blob], name, { type: 'image/jpeg' });
      const touch = window.matchMedia('(pointer: coarse)').matches;
      if (touch && navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: serial(seed) }).catch(() => undefined);
      } else {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = name;
        a.click();
        setTimeout(() => URL.revokeObjectURL(url), 10_000);
      }
      setStatus('received.');
      setInvited(true);
    } catch (error) {
      console.error(error);
      setStatus('try again.');
    }
  }

  const working = supported && !failed;
  const [w, h] = previewSize(format);
  const phone = format === 'phone';

  return (
    <article
      className={
        phone
          ? 'grid gap-10 md:grid-cols-[auto_minmax(0,1fr)] md:gap-16'
          : 'flex flex-col gap-10'
      }
    >
      <div className={`flex flex-col gap-3 ${phone ? 'mx-auto w-fit max-w-full md:mx-0' : 'w-full'}`}>
        <div className="relative">
          <canvas
            ref={canvasRef}
            width={w}
            height={h}
            role="img"
            aria-label={seed === null ? title : `${title}, ${serial(seed)}. arrow keys move the light.`}
            tabIndex={working ? 0 : -1}
            onPointerDown={(e) => {
              dragging.current = true;
              setTouched(true);
              e.currentTarget.setPointerCapture(e.pointerId);
              moveTo(e);
            }}
            onPointerMove={(e) => dragging.current && moveTo(e)}
            onPointerUp={() => (dragging.current = false)}
            onPointerCancel={() => (dragging.current = false)}
            onKeyDown={(e) => {
              setTouched(true);
              nudge(e);
            }}
            style={{ aspectRatio: `${w} / ${h}` }}
            className={`block cursor-crosshair touch-none bg-[#1a1817] ${
              phone ? 'h-[min(68svh,820px)] w-auto max-w-full md:h-[min(78svh,820px)]' : 'h-auto w-full'
            }`}
          />
          {working && seed !== null && (
            <p
              aria-hidden="true"
              className={`pointer-events-none absolute inset-x-0 bottom-6 flex justify-center px-4 transition-opacity duration-700 ${
                touched ? 'opacity-0' : 'opacity-100'
              }`}
            >
              <span className="inline-flex rounded-full bg-black/45 px-4 py-2 text-meta text-white/90 backdrop-blur-sm">
                <span className="md:hidden">move your finger across the picture</span>
                <span className="hidden md:inline">drag across the picture</span>
              </span>
            </p>
          )}
        </div>

        {working && (
          <div className="flex min-h-11 items-center justify-between gap-4 text-meta">
            <span className="text-muted">
              <span className="md:hidden">move your finger to move the light</span>
              <span className="hidden md:inline">drag to move the light</span>
            </span>
            <button
              type="button"
              onClick={another}
              className="-mr-2 min-h-11 cursor-pointer px-2 text-nav"
            >
              another pattern <span aria-hidden="true">↻</span>
            </button>
          </div>
        )}
      </div>

      <div className="flex max-w-[460px] flex-col gap-8 md:sticky md:top-10 md:self-start md:pt-2">
        {intro}

        {working ? (
          <div className="flex flex-col gap-6 text-meta">
            <div className="flex flex-col gap-1.5">
              <span className="text-nav tabular-nums">{seed === null ? 'n° ······' : serial(seed)}</span>
              <span className="text-muted">
                every pattern has its own number. move the light, choose a size, then receive it.
              </span>
            </div>

            <div className="flex flex-wrap gap-2" role="group" aria-label="size">
              {(Object.keys(FORMATS) as Format[]).map((f) => (
                <button
                  key={f}
                  type="button"
                  aria-pressed={format === f}
                  onClick={() => setFormat(f)}
                  className={chip}
                >
                  {FORMATS[f].label}
                </button>
              ))}
            </div>

            <div className="flex flex-col gap-4">
              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={receive}
                  disabled={!params || status === 'receiving…'}
                  className="min-h-11 cursor-pointer rounded-full bg-fg px-[22px] text-nav text-bg disabled:cursor-default disabled:opacity-60"
                >
                  receive<span className="sr-only"> · {title}</span>
                </button>
                <span className="text-muted tabular-nums">
                  {FORMATS[format].width}×{FORMATS[format].height}
                </span>
              </div>
              <button type="button" onClick={another} className={`${row} max-md:hidden`}>
                <span>another pattern</span>
                <span aria-hidden="true">↻</span>
              </button>
              <p aria-live="polite" className="min-h-[18px] text-muted">
                {status}
              </p>
              {invited ? (
                <div className="flex flex-col gap-8">
                  <p className="text-lead font-light tracking-tight">one letter every seventh day</p>
                  <WitnessForm />
                </div>
              ) : null}
            </div>
          </div>
        ) : (
          <p className="text-base text-muted">this instrument needs a newer browser.</p>
        )}
      </div>
    </article>
  );
}
