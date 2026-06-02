import type { Facing, Rect, Vec2 } from "../types.js";

/**
 * A movable physics body: an axis-aligned box with a position and velocity,
 * plus the small bits of state the collision resolver needs. Pure data —
 * {@link Physics.step} mutates it; entities own one.
 */
export class Body {
  /** Top-left corner in world space (pixels). */
  pos: Vec2;
  /** Velocity in pixels per second. */
  vel: Vec2 = { x: 0, y: 0 };
  readonly w: number;
  readonly h: number;

  /** Set by the resolver when the body is resting on a floor this step. */
  onGround = false;
  /** Last horizontal direction of intent; used for rendering / hitboxes. */
  facing: Facing = 1;
  /** While > 0, the body falls through one-way platforms. Counts down each step. */
  dropThroughTimer = 0;

  constructor(x: number, y: number, w: number, h: number) {
    this.pos = { x, y };
    this.w = w;
    this.h = h;
  }

  /** The body's current bounding rectangle (a fresh object each call). */
  get rect(): Rect {
    return { x: this.pos.x, y: this.pos.y, w: this.w, h: this.h };
  }

  get centerX(): number {
    return this.pos.x + this.w / 2;
  }
  get centerY(): number {
    return this.pos.y + this.h / 2;
  }
  get right(): number {
    return this.pos.x + this.w;
  }
  get bottom(): number {
    return this.pos.y + this.h;
  }
}
