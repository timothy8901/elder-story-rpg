import { PLAYER_H, TILE_SIZE } from "../../config.js";
import { Tilemap } from "../../physics/Tilemap.js";
import { TileType } from "../../types.js";
import type { Vec2 } from "../../types.js";
import type { MapExit } from "../GameMap.js";

/**
 * A small fluent helper for hand-authoring tile grids, so each map factory stays
 * short and readable. Coordinates are tile columns/rows; out-of-bounds writes
 * are ignored.
 */
export class MapBuilder {
  readonly grid: TileType[][];

  constructor(
    readonly cols: number,
    readonly rows: number,
  ) {
    this.grid = Array.from({ length: rows }, () => Array.from({ length: cols }, () => TileType.Empty));
  }

  set(col: number, row: number, t: TileType): this {
    if (row >= 0 && row < this.rows && col >= 0 && col < this.cols) this.grid[row]![col] = t;
    return this;
  }
  row(r: number, c0: number, c1: number, t: TileType = TileType.Solid): this {
    for (let c = c0; c <= c1; c++) this.set(c, r, t);
    return this;
  }
  col(c: number, r0: number, r1: number, t: TileType = TileType.Solid): this {
    for (let r = r0; r <= r1; r++) this.set(c, r, t);
    return this;
  }
  rect(c0: number, r0: number, c1: number, r1: number, t: TileType = TileType.Solid): this {
    for (let r = r0; r <= r1; r++) for (let c = c0; c <= c1; c++) this.set(c, r, t);
    return this;
  }
  /** Solid earth from row `top` down to the bottom across [c0, c1] (full width by default). */
  ground(top: number, c0 = 0, c1 = this.cols - 1): this {
    return this.rect(c0, top, c1, this.rows - 1, TileType.Solid);
  }
  /** A one-way (drop-through) platform. */
  platform(r: number, c0: number, c1: number): this {
    return this.row(r, c0, c1, TileType.OneWay);
  }
  /** A solid wall down a full column (used to seal a closed edge). */
  wall(c: number): this {
    return this.col(c, 0, this.rows - 1, TileType.Solid);
  }
  build(): Tilemap {
    return new Tilemap(this.grid);
  }
}

/** Standing spawn so the player's feet rest on top of tile row `rowTop`. */
export function standOn(col: number, rowTop: number): Vec2 {
  return { x: col * TILE_SIZE, y: rowTop * TILE_SIZE - PLAYER_H - 1 };
}

/**
 * A ground portal: a 2×2-tile entry pad resting on top of `groundRow`. The
 * player steps onto it and presses ↑/W to travel. These are the *only* scene
 * transitions — areas are otherwise sealed by walls at their edges.
 */
export function groundPortal(col: number, groundRow: number, toMapId: string, toSpawn: string, label: string): MapExit {
  return {
    rect: { x: col * TILE_SIZE, y: (groundRow - 2) * TILE_SIZE, w: 2 * TILE_SIZE, h: 2 * TILE_SIZE },
    toMapId,
    toSpawn,
    label,
    kind: "portal",
  };
}
