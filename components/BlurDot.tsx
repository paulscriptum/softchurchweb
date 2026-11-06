import type { CSSProperties } from 'react';

export const BRAND_BLUR_RATIO = 0.082;

interface BlurDotProps {
  size: number;
  blurRatio?: number;
  className?: string;
}

export function BlurDot({ size, blurRatio = BRAND_BLUR_RATIO, className = '' }: BlurDotProps) {
  const blur = `${size * blurRatio}px`;
  return (
    <span
      aria-hidden="true"
      className={`inline-block shrink-0 rounded-full bg-current ${className}`}
      style={{ width: size, height: size, filter: `blur(${blur})`, '--dot-blur': blur } as CSSProperties}
    />
  );
}
