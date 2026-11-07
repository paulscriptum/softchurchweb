import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { ImageResponse } from 'next/og';
import { BRAND_BLUR_RATIO } from '@/components/BlurDot';
import { SITE_NAME } from '@/config/site';
import { blurredDotGradient } from '@/lib/blurred-dot';

export const alt = 'soft.church: a soft blurred dot above the words a quiet house for given things';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

const DOT_BOX = 360;

export default async function OpengraphImage() {
  const [light, regular] = await Promise.all([
    readFile(join(process.cwd(), 'app/_og/hanken-grotesk-300.ttf')),
    readFile(join(process.cwd(), 'app/_og/hanken-grotesk-400.ttf')),
  ]);
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#FAFAF8',
          fontFamily: 'Hanken Grotesk',
        }}
      >
        <div
          style={{
            width: DOT_BOX,
            height: DOT_BOX,
            marginTop: 0,
            backgroundImage: blurredDotGradient({ width: DOT_BOX, height: DOT_BOX }, 150, BRAND_BLUR_RATIO, '#121010'),
          }}
        />
        <div style={{ fontSize: 56, fontWeight: 300, letterSpacing: -1.5, color: '#121010', marginTop: -70 }}>
          {SITE_NAME}
        </div>
        <div style={{ fontSize: 26, fontWeight: 400, color: '#6b6872', marginTop: 14 }}>
          a quiet house for given things
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: 'Hanken Grotesk', data: light, weight: 300, style: 'normal' },
        { name: 'Hanken Grotesk', data: regular, weight: 400, style: 'normal' },
      ],
    },
  );
}
