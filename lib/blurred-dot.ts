// next/og (satori) has no CSS filter, so the blurred dot is drawn as a radial
// gradient that follows the edge profile of a gaussian-blurred disc.

function erf(x: number): number {
  const t = 1 / (1 + 0.3275911 * Math.abs(x));
  const y =
    1 -
    ((((1.061405429 * t - 1.453152027) * t + 1.421413741) * t - 0.284496736) * t + 0.254829592) *
      t *
      Math.exp(-x * x);
  return x >= 0 ? y : -y;
}

function hexToRgb(hex: string): [number, number, number] {
  const n = parseInt(hex.replace('#', ''), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

export function blurredDotGradient(
  canvas: { width: number; height: number },
  diameter: number,
  blurRatio: number,
  color: string,
): string {
  const radius = diameter / 2;
  const sigma = diameter * blurRatio;
  const extent = Math.min(canvas.width, canvas.height) / 2;
  const [r, g, b] = hexToRgb(color);
  const stops: string[] = [];
  // Dense stops: with sparse ones the linear steps between them show up as rings on dark backgrounds.
  for (let k = -3.5; k <= 3.5001; k += 0.125) {
    const at = Math.max(0, radius + k * sigma);
    const alpha = 0.5 * (1 - erf(k / Math.SQRT2));
    stops.push(`rgba(${r},${g},${b},${alpha.toFixed(3)}) ${((at / extent) * 100).toFixed(2)}%`);
  }
  return `radial-gradient(circle closest-side at center, ${stops.join(', ')})`;
}
