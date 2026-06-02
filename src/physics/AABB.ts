import type { Rect } from "../types.js";

/**
 * Pure axis-aligned bounding-box helpers. No state — just geometry.
 */

/** True if two rectangles overlap. Edges merely touching do not count. */
export function intersects(a: Rect, b: Rect): boolean {
  return (
    a.x < b.x + b.w &&
    a.x + a.w > b.x &&
    a.y < b.y + b.h &&
    a.y + a.h > b.y
  );
}

/** True if the point (px, py) lies inside the rectangle. */
export function containsPoint(r: Rect, px: number, py: number): boolean {
  return px >= r.x && px <= r.x + r.w && py >= r.y && py <= r.y + r.h;
}
