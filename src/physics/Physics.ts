import { GRAVITY, TERMINAL_VY, TILE_SIZE } from "../config.js";
import { TileType } from "../types.js";
import type { Body } from "./Body.js";
import type { Tilemap } from "./Tilemap.js";

/** Tiny inset so a body exactly filling N tiles doesn't "touch" the next one. */
const EPS = 1e-4;

/**
 * Advance a body by one fixed step against the tilemap.
 *
 * Movement is resolved one axis at a time — horizontal first, then vertical —
 * which is the standard trick for tile platformers: it avoids corner snags and
 * keeps wall-sliding and floor-landing independent and easy to reason about.
 *
 * Step speeds here (< ~24px/step) are well under one tile, so there is no
 * tunnelling and we only need to test the leading edge of travel.
 */
export function step(body: Body, map: Tilemap, dt: number): void {
  if (body.dropThroughTimer > 0) {
    body.dropThroughTimer = Math.max(0, body.dropThroughTimer - dt);
  }

  // Gravity (clamped to terminal velocity).
  body.vel.y = Math.min(body.vel.y + GRAVITY * dt, TERMINAL_VY);

  // --- Horizontal axis: move, then push out of solid walls. ---
  body.pos.x += body.vel.x * dt;
  resolveX(body, map);

  // --- Vertical axis: move, then resolve floors/ceilings/one-ways. ---
  // The bottom *before* the vertical move decides whether we may land on a
  // one-way platform (you only catch it coming down from above it).
  const prevBottom = body.bottom;
  body.onGround = false;
  body.pos.y += body.vel.y * dt;
  resolveY(body, map, prevBottom);
}

/** Resolve the body against solid tiles on the horizontal axis (walls). */
function resolveX(body: Body, map: Tilemap): void {
  const top = body.pos.y;
  const bottom = body.bottom;
  const minRow = map.rowAt(top);
  const maxRow = map.rowAt(bottom - EPS);

  if (body.vel.x > 0) {
    const col = map.colAt(body.right - EPS);
    for (let row = minRow; row <= maxRow; row++) {
      if (map.tileAt(col, row) === TileType.Solid) {
        body.pos.x = col * TILE_SIZE - body.w; // snap left of the wall
        body.vel.x = 0;
        return;
      }
    }
  } else if (body.vel.x < 0) {
    const col = map.colAt(body.pos.x);
    for (let row = minRow; row <= maxRow; row++) {
      if (map.tileAt(col, row) === TileType.Solid) {
        body.pos.x = (col + 1) * TILE_SIZE; // snap right of the wall
        body.vel.x = 0;
        return;
      }
    }
  }
}

/** Resolve the body against floors, ceilings, and one-way platforms. */
function resolveY(body: Body, map: Tilemap, prevBottom: number): void {
  const left = body.pos.x;
  const right = body.right;
  const minCol = map.colAt(left);
  const maxCol = map.colAt(right - EPS);

  if (body.vel.y > 0) {
    // Falling — test the row at the feet.
    const row = map.rowAt(body.bottom - EPS);
    for (let col = minCol; col <= maxCol; col++) {
      const tile = map.tileAt(col, row);
      const tileTop = row * TILE_SIZE;

      if (tile === TileType.Solid) {
        body.pos.y = tileTop - body.h;
        body.vel.y = 0;
        body.onGround = true;
        return;
      }
      if (tile === TileType.OneWay) {
        // Land only if we came from above its surface and aren't dropping through.
        if (body.dropThroughTimer <= 0 && prevBottom <= tileTop + 1) {
          body.pos.y = tileTop - body.h;
          body.vel.y = 0;
          body.onGround = true;
          return;
        }
      }
    }
  } else if (body.vel.y < 0) {
    // Rising — test the row at the head; one-way platforms are passable upward.
    const row = map.rowAt(body.pos.y);
    for (let col = minCol; col <= maxCol; col++) {
      if (map.tileAt(col, row) === TileType.Solid) {
        body.pos.y = (row + 1) * TILE_SIZE; // bonk: snap below the ceiling
        body.vel.y = 0;
        return;
      }
    }
  }
}
