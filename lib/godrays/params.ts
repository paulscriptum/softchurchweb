/** Everything a godrays picture is made of. One seed always gives the same picture. */
export interface GodraysParams {
  seed: number;
  /** where the light would like to hide, 0..1 from the top-left corner; the renderer settles it behind a shape */
  light: [number, number];
  /** height of the band of shapes, 0..1 from the top */
  band: number;
  offset: [number, number];
  scale: number;
  warp: number;
  bandHeight: number;
  threshold: number;
  rays: number;
  warmth: number;
  grain: number;
}

export const SEED_LIMIT = 1_000_000;

export function randomSeed(): number {
  return Math.floor(Math.random() * SEED_LIMIT);
}

export function serial(seed: number): string {
  return `n° ${String(seed).padStart(6, '0')}`;
}

function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** The ranges are narrow on purpose: every picture is a sibling of the others. */
export function paramsFromSeed(seed: number): GodraysParams {
  const rand = mulberry32(seed * 2654435761);
  const between = (min: number, max: number) => min + (max - min) * rand();
  return {
    seed,
    light: [between(0.36, 0.64), between(0.3, 0.4)],
    offset: [between(0, 200), between(0, 200)],
    scale: between(1.8, 2.5),
    warp: between(0.45, 0.8),
    band: between(0.3, 0.4),
    bandHeight: between(0.22, 0.3),
    threshold: between(0.66, 0.74),
    rays: between(1.4, 1.8),
    warmth: between(0.55, 1),
    grain: between(0.035, 0.055),
  };
}
