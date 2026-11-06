import { ImageResponse } from 'next/og';
import { blurredDotGradient } from '@/lib/blurred-dot';

export const size = { width: 180, height: 180 };
export const contentType = 'image/png';

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          backgroundColor: '#FAFAF8',
          backgroundImage: blurredDotGradient(size, 104, 0.04, '#121010'),
        }}
      />
    ),
    size,
  );
}
