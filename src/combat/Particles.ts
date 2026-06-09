import type { Camera } from "../core/Camera.js";
import type { Renderer } from "../core/Renderer.js";

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  age: number;
  life: number;
  size: number;
  color: string;
  gravity: number;
}

interface BurstOpts {
  speed?: number;
  life?: number;
  color?: string;
  size?: number;
  gravity?: number;
  spread?: number; // angular spread (radians) around `dir`
  dir?: number; // central direction (radians); 0 = right
  rise?: number; // initial upward bias (px/s)
}

const MAX = 500; // hard cap; oldest is recycled past this

/**
 * A tiny pooled particle system — square pixels in world (or screen) space, for
 * hit sparks, footstep dust, ambient motes and weather. Modeled on the
 * DamageNumbers pool: no per-frame allocation churn beyond the array filter.
 */
export class Particles {
  private ps: Particle[] = [];

  /** `screen` particles ignore the camera (for weather that blankets the view). */
  constructor(private readonly screen = false) {}

  spawn(x: number, y: number, vx: number, vy: number, life: number, color: string, size = 2, gravity = 0): void {
    if (this.ps.length >= MAX) this.ps.shift();
    this.ps.push({ x, y, vx, vy, age: 0, life, size, color, gravity });
  }

  /** A radial spray (hit sparks / dust puffs). */
  burst(x: number, y: number, count: number, opts: BurstOpts = {}): void {
    const { speed = 90, life = 0.4, color = "#ffffff", size = 2, gravity = 320, spread = Math.PI * 2, dir = 0, rise = 30 } = opts;
    for (let i = 0; i < count; i++) {
      const a = dir + (Math.random() - 0.5) * spread;
      const s = speed * (0.4 + Math.random() * 0.7);
      this.spawn(x, y, Math.cos(a) * s, Math.sin(a) * s - rise, life * (0.6 + Math.random() * 0.7), color, size, gravity);
    }
  }

  update(dt: number): void {
    for (const p of this.ps) {
      p.age += dt;
      p.vy += p.gravity * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
    }
    this.ps = this.ps.filter((p) => p.age < p.life);
  }

  get count(): number {
    return this.ps.length;
  }

  render(r: Renderer, cam: Camera): void {
    if (this.ps.length === 0) return;
    const ctx = r.ctx;
    const ox = this.screen ? 0 : cam.renderX;
    const oy = this.screen ? 0 : cam.renderY;
    const prevSmooth = ctx.imageSmoothingEnabled;
    ctx.imageSmoothingEnabled = false;
    for (const p of this.ps) {
      ctx.globalAlpha = Math.max(0, 1 - p.age / p.life);
      ctx.fillStyle = p.color;
      ctx.fillRect(Math.round(p.x - ox), Math.round(p.y - oy), p.size, p.size);
    }
    ctx.globalAlpha = 1;
    ctx.imageSmoothingEnabled = prevSmooth;
  }
}
