/**
 * Canvas 2D Perlin Flow Field Renderer
 *
 * Inspired by arjun.lol/art Perlin Flow
 */
import type { FlowFieldConfig, FlowFieldRenderer } from "./types";

const fract = (e: number) => e - Math.floor(e);
const hash = (e: number) => fract(43758.5453123 * Math.sin(e));

function noise2D(x: number, y: number): number {
  const ix = Math.floor(x);
  const iy = Math.floor(y);
  const fx = fract(x);
  const fy = fract(y);

  const n00 = hash(ix + 57 * iy);
  const n10 = hash(ix + 1 + 57 * iy);
  const n01 = hash(ix + (iy + 1) * 57);
  const n11 = hash(ix + 1 + (iy + 1) * 57);

  const ux = fx * fx * (3 - 2 * fx);
  const uy = fy * fy * (3 - 2 * fy);

  return (
    n00 +
    (n10 - n00) * ux +
    (n01 - n00) * uy +
    (n00 - n10 - n01 + n11) * ux * uy
  );
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  age: number;
}

export class Canvas2DFlowField implements FlowFieldRenderer {
  private ctx: CanvasRenderingContext2D | null = null;
  private canvas: HTMLCanvasElement | null = null;
  private config: FlowFieldConfig | null = null;
  private particles: Particle[] = [];
  private animationId: number | null = null;
  private paused = false;
  private time = 0;
  private mouseX = -1000;
  private mouseY = -1000;

  async init(
    canvas: HTMLCanvasElement,
    config: FlowFieldConfig,
  ): Promise<boolean> {
    const ctx = canvas.getContext("2d");
    if (!ctx) return false;

    this.ctx = ctx;
    this.canvas = canvas;
    this.config = config;
    this.initParticles();
    return true;
  }

  private initParticles() {
    if (!this.canvas || !this.config) return;
    this.particles = Array.from({ length: this.config.particleCount }, () => ({
      x: Math.random() * this.canvas!.width,
      y: Math.random() * this.canvas!.height,
      vx: 0,
      vy: 0,
      age: Math.random() * this.config!.maxAge,
    }));
  }

  start() {
    const frame = () => {
      if (!this.ctx || !this.config || !this.canvas) return;

      if (!this.paused) {
        this.time++;
        const {
          noiseScale,
          force,
          damping,
          fadeAlpha,
          angleMult,
          timeSpeed,
          maxAge,
          particleSize,
          mouseRadius,
          mouseForce,
          dark,
        } = this.config;
        const { width, height } = this.canvas;
        const timeOffset = this.time * timeSpeed;
        const ctx = this.ctx;
        const mouseRadiusSq = mouseRadius * mouseRadius;

        ctx.fillStyle = dark
          ? `rgba(10, 15, 26, ${fadeAlpha})`
          : `rgba(250, 250, 250, ${fadeAlpha})`;
        ctx.fillRect(0, 0, width, height);

        ctx.fillStyle = dark
          ? "rgba(255, 255, 255, 0.6)"
          : "rgba(0, 0, 0, 0.7)";

        const path = new Path2D();

        for (const p of this.particles) {
          const angle =
            noise2D(p.x * noiseScale, p.y * noiseScale + timeOffset) *
            angleMult;

          p.vx += force * Math.cos(angle);
          p.vy += force * Math.sin(angle);

          const dx = p.x - this.mouseX;
          const dy = p.y - this.mouseY;
          const distSq = dx * dx + dy * dy;
          if (distSq < mouseRadiusSq) {
            const dist = Math.sqrt(distSq);
            const strength = (mouseRadius - dist) / mouseRadius;
            const repelAngle = Math.atan2(dy, dx);
            p.vx += Math.cos(repelAngle) * strength * mouseForce;
            p.vy += Math.sin(repelAngle) * strength * mouseForce;
          }

          p.vx *= damping;
          p.vy *= damping;

          p.x += p.vx;
          p.y += p.vy;
          p.age++;

          if (
            p.x < 0 ||
            p.x > width ||
            p.y < 0 ||
            p.y > height ||
            p.age > maxAge
          ) {
            p.x = Math.random() * width;
            p.y = Math.random() * height;
            p.vx = 0;
            p.vy = 0;
            p.age = 0;
          }

          path.rect(p.x, p.y, particleSize, particleSize);
        }

        ctx.fill(path);
      }

      this.animationId = requestAnimationFrame(frame);
    };
    frame();
  }

  stop() {
    if (this.animationId !== null) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }

  updateMouse(x: number, y: number) {
    this.mouseX = x;
    this.mouseY = y;
  }

  updateTheme(dark: boolean) {
    if (this.config && this.ctx && this.canvas) {
      this.config.dark = dark;
      this.ctx.fillStyle = dark ? "rgb(10, 15, 26)" : "rgb(250, 250, 250)";
      this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }
  }

  resize(width: number, height: number) {
    if (!this.canvas) return;
    this.canvas.width = width;
    this.canvas.height = height;
    this.initParticles();
  }

  setPaused(paused: boolean) {
    this.paused = paused;
  }

  destroy() {
    this.stop();
    this.particles = [];
    this.ctx = null;
    this.canvas = null;
  }
}
