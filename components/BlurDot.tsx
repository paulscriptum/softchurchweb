import type { CSSProperties } from 'react';
import { blurredDotGradient } from '@/lib/blurred-dot';

export const BRAND_BLUR_RATIO = 0.082;

interface BlurDotProps {
  size: number;
  blurRatio?: number;
  className?: string;
  /** Render only the full blurred box (size plus the blur on every side), for callers that size and offset it themselves. */
  bare?: boolean;
}

/** How far the blur reaches past the disc on each side. */
export function dotBleed(size: number, blurRatio = BRAND_BLUR_RATIO) {
  return 3.5 * size * blurRatio;
}

// The blur is a precomputed gradient mask, not a CSS filter: filters on moving
// layers re-rasterize every frame on iOS Safari and stall scrolling.
export function BlurDot({ size, blurRatio = BRAND_BLUR_RATIO, className = '', bare = false }: BlurDotProps) {
  const spread = dotBleed(size, blurRatio);
  const box = size + 2 * spread;
  const mask = blurredDotGradient({ width: box, height: box }, size, blurRatio, '#000000');
  const maskStyle = { maskImage: mask, WebkitMaskImage: mask } as CSSProperties;

  if (bare) {
    return (
      <span
        aria-hidden="true"
        className={`block shrink-0 bg-current ${className}`}
        style={{ width: box, height: box, ...maskStyle }}
      />
    );
  }

  return (
    <span
      aria-hidden="true"
      className={`relative inline-block shrink-0 ${className}`}
      style={{ width: size, height: size }}
    >
      <span className="pointer-events-none absolute bg-current" style={{ inset: -spread, ...maskStyle }} />
    </span>
  );
}
