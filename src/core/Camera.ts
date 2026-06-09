import { CAMERA_LERP, VIEW_H, VIEW_W } from "../config.js";

/**
 * A 2D camera that smoothly follows a world-space target and never reveals
 * space outside the map. `(x, y)` is the world coordinate shown at the
 * top-left of the viewport; the renderer subtracts it to map world -> screen.
 */
export class Camera {
  x = 0;
  y = 0;
  // Transient screen-shake offset (added only at render time, not to x/y).
  private offX = 0;
  private offY = 0;
  private shakeMag = 0;
  private shakeT = 0;
  private shakeDur = 0;

  constructor(
    private worldW: number,
    private worldH: number,
  ) {}

  /** World-space coords actually used for rendering (position + shake). */
  get renderX(): number {
    return this.x + this.offX;
  }
  get renderY(): number {
    return this.y + this.offY;
  }

  /** Kick a screen shake of `mag` pixels decaying over `dur` seconds. */
  shake(mag: number, dur: number): void {
    this.shakeMag = Math.max(this.shakeMag, mag);
    this.shakeDur = Math.max(this.shakeDur, dur);
    this.shakeT = this.shakeDur;
  }

  private updateShake(dt: number): void {
    if (this.shakeT <= 0) {
      this.offX = 0;
      this.offY = 0;
      return;
    }
    this.shakeT = Math.max(0, this.shakeT - dt);
    const k = this.shakeDur > 0 ? this.shakeT / this.shakeDur : 0;
    const m = this.shakeMag * k * k; // ease out
    this.offX = (Math.random() * 2 - 1) * m;
    this.offY = (Math.random() * 2 - 1) * m;
    if (this.shakeT <= 0) {
      this.shakeMag = 0;
      this.shakeDur = 0;
      this.offX = 0;
      this.offY = 0;
    }
  }

  /** Update the map bounds (e.g. after a map change). */
  setBounds(worldW: number, worldH: number): void {
    this.worldW = worldW;
    this.worldH = worldH;
  }

  /** Ease toward centering on a world-space target point. */
  follow(targetX: number, targetY: number): void {
    this.updateShake(1 / 60); // follow() runs once per fixed step
    const destX = targetX - VIEW_W / 2;
    const destY = targetY - VIEW_H / 2;
    this.x += (destX - this.x) * CAMERA_LERP;
    this.y += (destY - this.y) * CAMERA_LERP;
    this.clamp();
  }

  /** Jump instantly to center on a target (no easing) — used on spawn. */
  snapTo(targetX: number, targetY: number): void {
    this.x = targetX - VIEW_W / 2;
    this.y = targetY - VIEW_H / 2;
    this.clamp();
  }

  /** Keep the viewport inside the map. If the map is smaller, pin to 0. */
  private clamp(): void {
    const maxX = Math.max(0, this.worldW - VIEW_W);
    const maxY = Math.max(0, this.worldH - VIEW_H);
    this.x = Math.min(Math.max(this.x, 0), maxX);
    this.y = Math.min(Math.max(this.y, 0), maxY);
  }
}
