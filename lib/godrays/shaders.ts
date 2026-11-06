export const VERTEX = /* glsl */ `#version 300 es
in vec2 aPos;
out vec2 vUv;
void main() {
  vUv = aPos * 0.5 + 0.5;
  gl_Position = vec4(aPos, 0.0, 1.0);
}`;

const NOISE = /* glsl */ `
vec3 permute(vec3 x) { return mod(((x * 34.0) + 1.0) * x, 289.0); }

float snoise(vec2 v) {
  const vec4 C = vec4(0.211324865405187, 0.366025403784439, -0.577350269189626, 0.024390243902439);
  vec2 i = floor(v + dot(v, C.yy));
  vec2 x0 = v - i + dot(i, C.xx);
  vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
  vec4 x12 = x0.xyxy + C.xxzz;
  x12.xy -= i1;
  i = mod(i, 289.0);
  vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));
  vec3 m = max(0.5 - vec3(dot(x0, x0), dot(x12.xy, x12.xy), dot(x12.zw, x12.zw)), 0.0);
  m = m * m;
  m = m * m;
  vec3 x = 2.0 * fract(p * C.www) - 1.0;
  vec3 h = abs(x) - 0.5;
  vec3 ox = floor(x + 0.5);
  vec3 a0 = x - ox;
  m *= 1.79284291400159 - 0.85373472095314 * (a0 * a0 + h * h);
  vec3 g;
  g.x = a0.x * x0.x + h.x * x0.y;
  g.yz = a0.yz * x12.xz + h.yz * x12.yw;
  return 130.0 * dot(m, g);
}

float fbm(vec2 p) {
  float sum = 0.0;
  float amp = 0.5;
  mat2 turn = mat2(0.8, -0.6, 0.6, 0.8);
  for (int i = 0; i < 4; i++) {
    sum += amp * snoise(p);
    p = turn * p * 2.03 + 17.1;
    amp *= 0.5;
  }
  return sum;
}`;

/** Pass one: the torn shapes in front of the light. r = how much they block, g = their rim, b = how dense they are. */
export const MASK = /* glsl */ `#version 300 es
precision highp float;
in vec2 vUv;
out vec4 outColor;
uniform float uAspect;
uniform float uBand;
uniform vec2 uOffset;
uniform float uScale;
uniform float uWarp;
uniform float uBandOffset;
uniform float uBandHeight;
uniform float uThreshold;
uniform float uPx;
${NOISE}
void main() {
  vec2 p = vec2(vUv.x * uAspect, vUv.y);
  float dy = (p.y - uBand) / uBandHeight;
  float dx = (p.x - 0.5 * uAspect) / max(uBandHeight * 3.5, 0.0001);
  float band = exp(-dy * dy) * mix(0.8, 1.0, exp(-dx * dx));

  vec2 q = p * uScale + uOffset;
  vec2 w = vec2(fbm(q), fbm(q + vec2(5.2, 1.3)));
  float n = fbm(q + uWarp * w);
  float f = band + n * 0.95 - uThreshold;

  float aa = fwidth(f) * 2.0 * uPx + 1e-5;
  float occ = smoothstep(-aa, aa, f);

  float n2 = fbm(q * 1.6 + vec2(11.3, 4.1) + w * 0.8);
  float dense = smoothstep(-0.2, 0.25, n2 + f * 1.3);
  float rim = 1.0 - smoothstep(aa * 0.3, aa * 1.6, abs(f));

  outColor = vec4(occ * mix(0.85, 1.0, dense), rim, dense, 1.0);
}`;

/** Pass two: light leaks through the gaps and is carried outward along rays. */
export const COMPOSE = /* glsl */ `#version 300 es
precision highp float;
in vec2 vUv;
out vec4 outColor;
uniform sampler2D uMask;
uniform float uAspect;
uniform vec2 uLight;
uniform float uRays;
uniform float uWarmth;
uniform float uGrain;
uniform float uSeed;

float hash(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}

float source(vec2 uv) {
  vec2 d = (uv - uLight) * vec2(uAspect, 1.0);
  float r = length(d);
  return exp(-r * 11.0) + 1.5 * exp(-r * 50.0);
}

void main() {
  vec4 m = texture(uMask, vUv);
  vec2 d = (vUv - uLight) * vec2(uAspect, 1.0);
  float r = length(d);

  float sky = 0.12 + 0.08 * smoothstep(0.0, 1.0, vUv.y);
  sky += 0.09 * exp(-r * 2.5) + 0.25 * exp(-r * 14.0) + 3.0 * exp(-r * 60.0);

  float shade = mix(0.24, 0.085, m.b) + 0.12 * exp(-r * 4.0) * (1.0 - m.b);
  float lum = mix(sky, shade, m.r);
  lum += m.g * (0.015 + 0.3 * exp(-r * 3.5));

  const int N = 110;
  vec2 delta = (vUv - uLight) / float(N);
  vec2 c = vUv - delta * hash(gl_FragCoord.xy + uSeed);
  float acc = 0.0;
  for (int i = 0; i < N; i++) {
    c -= delta;
    acc += (1.0 - texture(uMask, c).r) * source(c);
  }
  acc /= float(N);
  lum += acc * uRays * exp(-r * 0.4);

  lum = 1.0 - exp(-lum * 1.05);

  vec2 v = (vUv - vec2(0.5, 0.55)) * vec2(min(uAspect, 1.0) * 1.4, 1.0);
  lum *= 1.0 - 0.5 * dot(v, v);

  vec3 tint = mix(vec3(1.0), vec3(1.0, 0.95, 0.875), uWarmth);
  vec3 col = lum * tint;
  col += (hash(gl_FragCoord.xy * 1.37 + uSeed * 7.1) - 0.5) * uGrain;
  outColor = vec4(col, 1.0);
}`;
