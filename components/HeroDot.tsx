'use client';

import { useEffect, useRef } from 'react';
import { BlurDot } from './BlurDot';

export function HeroDot({ size }: { size: number }) {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const hero = el.closest('section');
    let frame = 0;

    const update = () => {
      frame = 0;
      const distance = hero ? hero.offsetTop + hero.offsetHeight * 0.6 : window.innerHeight;
      const p = Math.min(1, Math.max(0, window.scrollY / distance));
      el.style.setProperty('--p', p.toFixed(4));
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

  return (
    <span ref={ref} className="hero-dot block">
      <BlurDot size={size} className="block" />
    </span>
  );
}
