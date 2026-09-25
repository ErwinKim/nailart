'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';

export type AetherHeroProps = {
  title?: string;
  subtitle?: string;
  ctaLabel?: string;
  ctaHref?: string;
  secondaryCtaLabel?: string;
  secondaryCtaHref?: string;
  align?: 'left' | 'center' | 'right';
  maxWidth?: number;
  overlayGradient?: string;
  textColor?: string;
  fragmentSource?: string;
  dprMax?: number;
  clearColor?: [number, number, number, number];
  height?: string | number;
  className?: string;
  ariaLabel?: string;
};

const DEFAULT_FRAG = `#version 300 es
precision highp float;
out vec4 O;
uniform float time;
uniform vec2 resolution;
#define FC gl_FragCoord.xy
#define R resolution
#define T time
float pattern(vec2 uv) {
  float d = 0.0;
  for (float i = 0.0; i < 3.0; i++) {
    uv.x += sin(T * (1.0 + i) + uv.y * 1.5) * 0.2;
    d += 0.005 / abs(uv.x);
  }
  return d;
}
vec3 scene(vec2 uv) {
  vec3 col = vec3(0.0);
  uv = vec2(atan(uv.x, uv.y) * 2.0 / 6.28318, -log(length(uv)) + T);
  for (float i = 0.0; i < 3.0; i++) {
    int k = int(mod(i, 3.0));
    col[k] += pattern(uv + i * 6.0 / min(R.x, R.y));
  }
  return col;
}
void main() {
  float mn = min(R.x, R.y);
  vec2 uv = (FC - 0.5 * R) / mn;
  vec3 col = vec3(0.0);
  col += 0.0009 / (sin(uv.x * 12.0) * cos(uv.y * 12.0));
  uv.y += 0.5;
  col += scene(uv);
  O = vec4(col, 1.0);
}`;

const VERT_SRC = `#version 300 es
precision highp float;
in vec2 position;
void main() { gl_Position = vec4(position, 0.0, 1.0); }`;

function compileShader(
  gl: WebGL2RenderingContext,
  source: string,
  type: number,
) {
  const shader = gl.createShader(type);
  if (!shader) throw new Error('Unable to create shader.');

  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const info = gl.getShaderInfoLog(shader) || 'Unknown shader error';
    gl.deleteShader(shader);
    throw new Error(info);
  }
  return shader;
}

function createProgram(gl: WebGL2RenderingContext, fragmentSource: string) {
  const vertexShader = compileShader(gl, VERT_SRC, gl.VERTEX_SHADER);
  const fragmentShader = compileShader(gl, fragmentSource, gl.FRAGMENT_SHADER);
  const program = gl.createProgram();
  if (!program) throw new Error('Unable to create shader program.');

  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);
  gl.deleteShader(vertexShader);
  gl.deleteShader(fragmentShader);

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    const info = gl.getProgramInfoLog(program) || 'Program link error';
    gl.deleteProgram(program);
    throw new Error(info);
  }
  return program;
}

export default function AetherHero({
  title = 'Make thumbnails people cannot scroll past.',
  subtitle = 'NailArt AI turns a video idea into a bold, click-worthy YouTube thumbnail in seconds.',
  ctaLabel = 'Create a thumbnail',
  ctaHref = '/auth',
  secondaryCtaLabel = 'Explore the studio',
  secondaryCtaHref = '#about',
  align = 'left',
  maxWidth = 720,
  overlayGradient = 'linear-gradient(90deg, rgba(6, 7, 14, .92), rgba(6, 7, 14, .45) 58%, rgba(6, 7, 14, .1))',
  textColor = '#f8f7f2',
  fragmentSource = DEFAULT_FRAG,
  dprMax = 2,
  clearColor = [0.02, 0.02, 0.05, 1],
  height = 'min(820px, 100vh)',
  className = '',
  ariaLabel = 'Animated aurora background',
}: AetherHeroProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext('webgl2', { alpha: true, antialias: true });
    if (!gl) return;

    let program: WebGLProgram;
    try {
      program = createProgram(gl, fragmentSource);
    } catch (error) {
      console.error('Unable to initialize hero shader.', error);
      return;
    }

    const buffer = gl.createBuffer();
    if (!buffer) return;

    const vertices = new Float32Array([-1, 1, -1, -1, 1, 1, 1, -1]);
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
    gl.useProgram(program);

    const position = gl.getAttribLocation(program, 'position');
    const time = gl.getUniformLocation(program, 'time');
    const resolution = gl.getUniformLocation(program, 'resolution');
    gl.enableVertexAttribArray(position);
    gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);
    gl.clearColor(...clearColor);

    const resize = () => {
      const dpr = Math.min(Math.max(window.devicePixelRatio || 1, 1), dprMax);
      const bounds = canvas.getBoundingClientRect();
      const width = Math.max(1, Math.floor(bounds.width * dpr));
      const height = Math.max(1, Math.floor(bounds.height * dpr));
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
      }
      gl.viewport(0, 0, canvas.width, canvas.height);
    };

    resize();
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(canvas);

    let animationFrame = 0;
    const render = (now: number) => {
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.useProgram(program);
      if (resolution) gl.uniform2f(resolution, canvas.width, canvas.height);
      if (time) gl.uniform1f(time, now * 0.001);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      animationFrame = requestAnimationFrame(render);
    };
    animationFrame = requestAnimationFrame(render);

    return () => {
      resizeObserver.disconnect();
      cancelAnimationFrame(animationFrame);
      gl.deleteBuffer(buffer);
      gl.deleteProgram(program);
    };
  }, [clearColor, dprMax, fragmentSource]);

  const justifyContent = align === 'left' ? 'flex-start' : align === 'right' ? 'flex-end' : 'center';
  const textAlign = align;

  return (
    <section
      className={`aurora-hero ${className}`.trim()}
      aria-label="Hero"
      style={{ height, position: 'relative', overflow: 'hidden', background: '#070812' }}
    >
      <canvas
        ref={canvasRef}
        className="aurora-canvas"
        role="img"
        aria-label={ariaLabel}
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', display: 'block' }}
      />
      <div aria-hidden="true" style={{ position: 'absolute', inset: 0, background: overlayGradient }} />
      <nav className="site-nav" aria-label="Main navigation">
        <Link className="site-logo" href="/" aria-label="NailArt AI home">
          <span className="site-logo-mark">N</span>
          <span>NailArt <em>AI</em></span>
        </Link>
        <div className="site-nav-links">
          <a href="#about">How it works</a>
          <a href="#pricing">Pricing</a>
        </div>
        <div className="site-nav-actions">
          <Link className="site-sign-in" href="/auth">Sign in</Link>
        </div>
      </nav>
      <div
        style={{
          position: 'relative',
          zIndex: 1,
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent,
          padding: 'clamp(32px, 8vw, 112px)',
          color: textColor,
          textAlign,
          fontFamily: 'var(--font-baloo-2), sans-serif',
        }}
      >
        <div style={{ width: '100%', maxWidth }}>
          <h1 style={{ margin: 0, maxWidth: 760, fontSize: 'clamp(2.8rem, 7vw, 6.5rem)', lineHeight: 0.98, letterSpacing: '-0.04em', fontWeight: 700, textWrap: 'balance' }}>
            {title}
          </h1>
          {subtitle ? <p style={{ maxWidth: 560, margin: '28px 0 0', fontSize: 'clamp(1rem, 1.7vw, 1.2rem)', lineHeight: 1.6, color: 'rgba(248,247,242,.72)' }}>{subtitle}</p> : null}
          {(ctaLabel || secondaryCtaLabel) ? (
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 36 }}>
              {ctaLabel ? <a className="aurora-button aurora-button-primary" href={ctaHref}>{ctaLabel}<span aria-hidden="true">↗</span></a> : null}
              {secondaryCtaLabel ? <a className="aurora-button aurora-button-secondary" href={secondaryCtaHref}>{secondaryCtaLabel}</a> : null}
            </div>
          ) : null}
        </div>
        <div className="thumbnail-preview" aria-hidden="true">
          <div className="thumbnail-window-bar">
            <span className="thumbnail-window-title">AI thumbnail preview</span>
            <span className="thumbnail-live"><i /> LIVE</span>
          </div>
          <div className="thumbnail-art">
            <span className="thumbnail-art-label">THE NEXT<br />BIG THING</span>
            <span className="thumbnail-art-orb" />
            <span className="thumbnail-art-caption">Turn views<br />into momentum.</span>
          </div>
          <div className="thumbnail-meta">
            <span><strong>92</strong> / 100 click score</span>
            <span className="thumbnail-check">✓ Ready to publish</span>
          </div>
        </div>
      </div>
    </section>
  );
}

export { AetherHero };