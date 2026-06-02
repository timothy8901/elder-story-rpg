/**
 * Shared, dependency-free type definitions used across the engine.
 * Keep this file free of imports so any module can pull from it.
 */

/** A 2D vector / point in world or screen space (pixels). */
export interface Vec2 {
  x: number;
  y: number;
}

/** An axis-aligned rectangle. `x,y` is the top-left corner; `w,h` the size. */
export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

/**
 * The kinds of tile a {@link Tilemap} cell can hold. Numeric values let map
 * data be authored compactly and serialized cheaply later.
 */
export enum TileType {
  /** Open air — no collision. */
  Empty = 0,
  /** Floors, ceilings and walls — collide on every side. */
  Solid = 1,
  /** One-way platform — you can jump up through it, land on top, and drop down. */
  OneWay = 2,
}

/** Horizontal facing direction. 1 = right, -1 = left. */
export type Facing = 1 | -1;
