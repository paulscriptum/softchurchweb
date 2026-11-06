'use client';

import { useEffect, useRef, type CSSProperties } from 'react';
import { BlurDot } from './BlurDot';

const HOLD = 0.2;
const FADE = 0.5;

function smoothstep(x: number) {
  const t = Math.min(1, Math.max(0, (x - HOLD) / (FADE - HOLD)));
  return t * t * (3 - 2 * t);
}

export function Statements({ statements }: { statements: string[] }) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const track = ref.current;
    if (!track || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const lines = Array.from(track.querySelectorAll<HTMLElement>('.about-text'));
    const last = lines.length - 1;
    const applied = lines.map(() => -1);
    // A per-frame text blur repaints the whole line; phones and Safari drop frames on it.
    const softBlur =
      window.matchMedia('(hover: hover) and (pointer: fine)').matches &&
      !/^((?!chrome|android).)*safari/i.test(navigator.userAgent);
    let frame = 0;

    const update = () => {
      frame = 0;
      const rect = track.getBoundingClientRect();
      const distance = rect.height - window.innerHeight;
      const progress = distance > 0 ? Math.min(1, Math.max(0, -rect.top / distance)) : 0;
      const position = progress * last;

      lines.forEach((el, i) => {
        const d = position - i;
        const leaving = d > 0 && i < last;
        const arriving = d < 0 && i > 0;
        const k = Math.round((leaving || arriving ? smoothstep(Math.abs(d)) : 0) * 200) / 200;
        const key = leaving ? -k : k;
        if (applied[i] === key) return;
        applied[i] = key;
        const y = leaving ? -24 * k : 16 * k;
        el.style.opacity = String(1 - k);
        el.style.transform = `translate3d(0, ${y.toFixed(2)}px, 0)`;
        if (softBlur) el.style.filter = k > 0 ? `blur(${(k * 6).toFixed(2)}px)` : '';
      });
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };

    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <section
      ref={ref}
      id="about"
      aria-label="about"
      className="about-track"
      style={{ '--count': statements.length } as CSSProperties}
    >
      <div className="about-stage mx-auto max-w-about px-6 text-center">
        <div className="about-lines">
          {statements.map((text) => (
            <div key={text} className="about-item flex flex-col items-center gap-9 py-[150px]">
              {/* at 10px the brand ratio is too faint, so separators keep the reference 2px */}
              <BlurDot size={10} blurRatio={0.2} className="about-dot block" />
              <p className="about-text text-statement leading-[1.25] tracking-tight">{text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
