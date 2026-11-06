import type { GodraysParams } from './params';
import { COMPOSE, MASK, VERTEX } from './shaders';

type Uniforms = Record<string, WebGLUniformLocation | null>;
type Point = [number, number];

interface Target {
  texture: WebGLTexture;
  framebuffer: WebGLFramebuffer;
  size: [number, number];
}

const PROBE_HEIGHT = 160;

function compile(gl: WebGL2RenderingContext, type: number, source: string): WebGLShader {
  const shader = gl.createShader(type)!;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    throw new Error(gl.getShaderInfoLog(shader) || 'the shader did not compile');
  }
  return shader;
}

function program(gl: WebGL2RenderingContext, fragment: string, names: string[]) {
  const p = gl.createProgram()!;
  gl.attachShader(p, compile(gl, gl.VERTEX_SHADER, VERTEX));
  gl.attachShader(p, compile(gl, gl.FRAGMENT_SHADER, fragment));
  gl.bindAttribLocation(p, 0, 'aPos');
  gl.linkProgram(p);
  if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p) || 'link');
  const uniforms: Uniforms = {};
  for (const name of names) uniforms[name] = gl.getUniformLocation(p, name);
  return { p, uniforms };
}

/** Picks the place where the light is hidden behind a shape but has a few gaps to leak through. */
function settleLight(occ: Uint8Array, w: number, h: number, params: GodraysParams): Point {
  const at = (x: number, y: number) => occ[((h - 1 - y) * w + x) * 4] / 255;
  const radius = Math.round(0.045 * h);
  const [px, py] = params.light;
  let best: Point = params.light;
  let bestScore = -Infinity;

  const y0 = Math.max(radius, Math.round((params.band - 0.13) * h));
  const y1 = Math.min(h - radius - 1, Math.round((params.band + 0.13) * h));
  const x0 = Math.max(radius, Math.round(0.15 * w));
  const x1 = Math.min(w - radius - 1, Math.round(0.85 * w));

  for (let y = y0; y <= y1; y += 2) {
    for (let x = x0; x <= x1; x += 2) {
      if (at(x, y) < 0.9) continue;
      let open = 0;
      let count = 0;
      for (let dy = -radius; dy <= radius; dy++) {
        for (let dx = -radius; dx <= radius; dx++) {
          if (dx * dx + dy * dy > radius * radius) continue;
          open += 1 - at(x + dx, y + dy);
          count++;
        }
      }
      const gaps = open / count;
      const u = x / w;
      const v = y / h;
      const away = Math.hypot((u - px) * (w / h), v - py);
      const score = -Math.abs(gaps - 0.22) * 4 - away;
      if (score > bestScore) {
        bestScore = score;
        best = [u, v];
      }
    }
  }
  return best;
}

export class GodraysRenderer {
  private gl: WebGL2RenderingContext;
  private mask;
  private compose;
  private full: Target;
  private probe: Target;
  private settled = new Map<string, Point>();

  constructor(private canvas: HTMLCanvasElement) {
    const gl = canvas.getContext('webgl2', {
      antialias: false,
      preserveDrawingBuffer: true,
      alpha: false,
    });
    if (!gl) throw new Error('webgl2');
    this.gl = gl;

    this.mask = program(gl, MASK, [
      'uAspect', 'uBand', 'uOffset', 'uScale', 'uWarp', 'uBandHeight', 'uThreshold', 'uPx',
    ]);
    this.compose = program(gl, COMPOSE, ['uMask', 'uAspect', 'uLight', 'uRays', 'uWarmth', 'uGrain', 'uSeed']);

    const vao = gl.createVertexArray();
    gl.bindVertexArray(vao);
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

    this.full = this.target();
    this.probe = this.target();
  }

  private static byCanvas = new WeakMap<HTMLCanvasElement, GodraysRenderer>();

  /** A canvas keeps one context for its whole life, so its renderer is kept with it. */
  static for(canvas: HTMLCanvasElement): GodraysRenderer {
    let renderer = GodraysRenderer.byCanvas.get(canvas);
    if (!renderer) {
      renderer = new GodraysRenderer(canvas);
      GodraysRenderer.byCanvas.set(canvas, renderer);
    }
    return renderer;
  }

  static supported(): boolean {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl2');
    gl?.getExtension('WEBGL_lose_context')?.loseContext();
    return Boolean(gl);
  }

  private target(): Target {
    const { gl } = this;
    return { texture: gl.createTexture()!, framebuffer: gl.createFramebuffer()!, size: [0, 0] };
  }

  private size(t: Target, width: number, height: number) {
    if (t.size[0] === width && t.size[1] === height) return;
    const { gl } = this;
    gl.bindTexture(gl.TEXTURE_2D, t.texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.bindFramebuffer(gl.FRAMEBUFFER, t.framebuffer);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, t.texture, 0);
    t.size = [width, height];
  }

  private drawMask(params: GodraysParams, t: Target, width: number, height: number) {
    const { gl } = this;
    this.size(t, width, height);
    gl.bindFramebuffer(gl.FRAMEBUFFER, t.framebuffer);
    gl.viewport(0, 0, width, height);
    gl.useProgram(this.mask.p);
    const u = this.mask.uniforms;
    gl.uniform1f(u.uAspect, width / height);
    gl.uniform1f(u.uBand, 1 - params.band);
    gl.uniform2f(u.uOffset, ...params.offset);
    gl.uniform1f(u.uScale, params.scale);
    gl.uniform1f(u.uWarp, params.warp);
    gl.uniform1f(u.uBandHeight, params.bandHeight);
    gl.uniform1f(u.uThreshold, params.threshold);
    gl.uniform1f(u.uPx, Math.max(width, height) / 1400);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }

  /** Where the light of this seed settles for this shape of picture; the same every time. */
  lightFor(params: GodraysParams, aspect: number): Point {
    const key = `${params.seed}:${aspect.toFixed(3)}`;
    const known = this.settled.get(key);
    if (known) return known;

    const h = PROBE_HEIGHT;
    const w = Math.max(8, Math.round(h * aspect));
    this.drawMask(params, this.probe, w, h);
    const pixels = new Uint8Array(w * h * 4);
    this.gl.readPixels(0, 0, w, h, this.gl.RGBA, this.gl.UNSIGNED_BYTE, pixels);
    const light = settleLight(pixels, w, h, params);
    this.settled.set(key, light);
    return light;
  }

  /** Draws the picture; `light` overrides where the light settles. Returns the light used. */
  render(params: GodraysParams, width: number, height: number, light?: Point): Point {
    const { gl } = this;
    const used = light ?? this.lightFor(params, width / height);

    this.drawMask(params, this.full, width, height);

    if (this.canvas.width !== width) this.canvas.width = width;
    if (this.canvas.height !== height) this.canvas.height = height;
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, width, height);
    gl.useProgram(this.compose.p);
    const u = this.compose.uniforms;
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.full.texture);
    gl.uniform1i(u.uMask, 0);
    gl.uniform1f(u.uAspect, width / height);
    gl.uniform2f(u.uLight, used[0], 1 - used[1]);
    gl.uniform1f(u.uRays, params.rays);
    gl.uniform1f(u.uWarmth, params.warmth);
    gl.uniform1f(u.uGrain, params.grain);
    gl.uniform1f(u.uSeed, params.seed % 9973);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    return used;
  }

  dispose() {
    this.gl.getExtension('WEBGL_lose_context')?.loseContext();
  }
}
