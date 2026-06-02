import type { Camera } from "./Camera.js";

export type TextAlign = "left" | "center" | "right";

/**
 * A thin wrapper over the 2D canvas context. Offers two coordinate spaces:
 *  - **World** draws (`*World`) are offset by the camera — for tiles, entities.
 *  - **Screen** draws (`*Screen`, `text`) are absolute — for HUD / debug.
 *
 * World draws snap to integer pixels to keep placeholder blocks crisp.
 */
export class Renderer {
  readonly ctx: CanvasRenderingContext2D;
  readonly width: number;
  readonly height: number;

  constructor(canvas: HTMLCanvasElement) {
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Could not acquire a 2D canvas context.");
    this.ctx = ctx;
    this.width = canvas.width;
    this.height = canvas.height;
    this.ctx.imageSmoothingEnabled = false;
  }

  /** Fill the whole canvas with a solid color. */
  clear(color: string): void {
    this.ctx.fillStyle = color;
    this.ctx.fillRect(0, 0, this.width, this.height);
  }

  // --- World space (camera-relative) ---

  fillRectWorld(
    cam: Camera,
    x: number,
    y: number,
    w: number,
    h: number,
    color: string,
  ): void {
    this.ctx.fillStyle = color;
    this.ctx.fillRect(
      Math.round(x - cam.x),
      Math.round(y - cam.y),
      Math.round(w),
      Math.round(h),
    );
  }

  strokeRectWorld(
    cam: Camera,
    x: number,
    y: number,
    w: number,
    h: number,
    color: string,
    lineWidth = 1,
  ): void {
    this.ctx.strokeStyle = color;
    this.ctx.lineWidth = lineWidth;
    // +0.5 aligns the 1px stroke to the pixel grid.
    this.ctx.strokeRect(
      Math.round(x - cam.x) + 0.5,
      Math.round(y - cam.y) + 0.5,
      Math.round(w) - 1,
      Math.round(h) - 1,
    );
  }

  /**
   * Run a draw callback in world space: the context is translated by the
   * (rounded) camera offset so callers can draw rich sprites directly in world
   * coordinates. Used for entities, tiles, projectiles and portals.
   */
  withWorld(cam: Camera, draw: (ctx: CanvasRenderingContext2D) => void): void {
    const ctx = this.ctx;
    ctx.save();
    ctx.translate(-Math.round(cam.x), -Math.round(cam.y));
    draw(ctx);
    ctx.restore();
  }

  // --- Screen space (absolute) ---

  fillRectScreen(x: number, y: number, w: number, h: number, color: string): void {
    this.ctx.fillStyle = color;
    this.ctx.fillRect(x, y, w, h);
  }

  text(
    text: string,
    x: number,
    y: number,
    color: string,
    font = "12px monospace",
    align: TextAlign = "left",
  ): void {
    this.ctx.font = font;
    this.ctx.fillStyle = color;
    this.ctx.textAlign = align;
    this.ctx.textBaseline = "alphabetic";
    this.ctx.fillText(text, x, y);
  }
}
