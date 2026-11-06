import { ImageResponse } from 'next/og';
import { BRAND_BLUR_RATIO } from '@/components/BlurDot';
import { blurredDotGradient } from '@/lib/blurred-dot';

export const alt = 'soft.church';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          backgroundColor: '#FAFAF8',
          backgroundImage: blurredDotGradient(size, 260, BRAND_BLUR_RATIO, '#121010'),
        }}
      />
    ),
    size,
  );
}
