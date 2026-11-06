'use client';

import { useEffect, useRef } from 'react';
import { BlurDot, dotBleed } from './BlurDot';

// A touch softer than the brand ratio: the old animated blur breathed around this value.
const HERO_BLUR_RATIO = 0.1;

export function HeroDot({ size }: { size: number }) {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const hero = el.closest('section');
    let frame = 0;
    let last = -1;

    const update = () => {
      frame = 0;
      const distance = hero ? hero.offsetTop + hero.offsetHeight * 0.6 : window.innerHeight;
      const p = Math.round(Math.min(1, Math.max(0, window.scrollY / distance)) * 1000) / 1000;
      if (p === last) return;
      last = p;
      el.style.transform = `translate3d(0, ${(p * 200).toFixed(1)}px, 0) scale(${(1 - p * 0.6).toFixed(3)})`;
      el.style.opacity = (1 - p * 0.8).toFixed(3);
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };

    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      cancelAnimationFrame(frame);
    };
  }, []);

  // iOS Safari clips animated layers to their own box, so every layer here spans
  // the whole blur and the negative margin gives the space back to the layout.
  return (
    <span ref={ref} className="hero-dot block" style={{ margin: -dotBleed(size, HERO_BLUR_RATIO) }}>
      <span className="hero-breath block">
        <BlurDot size={size} blurRatio={HERO_BLUR_RATIO} bare />
      </span>
    </span>
  );
}
