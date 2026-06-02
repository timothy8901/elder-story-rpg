import { PLAYER_H, TILE_SIZE } from "../../config.js";
import { Tilemap } from "../../physics/Tilemap.js";
import { TileType } from "../../types.js";
/**
 * A small fluent helper for hand-authoring tile grids, so each map factory stays
 * short and readable. Coordinates are tile columns/rows; out-of-bounds writes
 * are ignored.
 */
export class MapBuilder {
    constructor(cols, rows) {
        this.cols = cols;
        this.rows = rows;
        this.grid = Array.from({ length: rows }, () => Array.from({ length: cols }, () => TileType.Empty));
    }
    set(col, row, t) {
        if (row >= 0 && row < this.rows && col >= 0 && col < this.cols)
            this.grid[row][col] = t;
        return this;
    }
    row(r, c0, c1, t = TileType.Solid) {
        for (let c = c0; c <= c1; c++)
            this.set(c, r, t);
        return this;
    }
    col(c, r0, r1, t = TileType.Solid) {
        for (let r = r0; r <= r1; r++)
            this.set(c, r, t);
        return this;
    }
    rect(c0, r0, c1, r1, t = TileType.Solid) {
        for (let r = r0; r <= r1; r++)
            for (let c = c0; c <= c1; c++)
                this.set(c, r, t);
        return this;
    }
    /** Solid earth from row `top` down to the bottom across [c0, c1] (full width by default). */
    ground(top, c0 = 0, c1 = this.cols - 1) {
        return this.rect(c0, top, c1, this.rows - 1, TileType.Solid);
    }
    /** A one-way (drop-through) platform. */
    platform(r, c0, c1) {
        return this.row(r, c0, c1, TileType.OneWay);
    }
    /** A solid wall down a full column (used to seal a closed edge). */
    wall(c) {
        return this.col(c, 0, this.rows - 1, TileType.Solid);
    }
    build() {
        return new Tilemap(this.grid);
    }
}
/** Standing spawn so the player's feet rest on top of tile row `rowTop`. */
export function standOn(col, rowTop) {
    return { x: col * TILE_SIZE, y: rowTop * TILE_SIZE - PLAYER_H - 1 };
}
/** A walk-off gate on the left screen edge. */
export function leftExit(rows, toMapId, toSpawn, label) {
    return { rect: { x: 0, y: 0, w: TILE_SIZE, h: rows * TILE_SIZE }, toMapId, toSpawn, label, kind: "edge" };
}
/** A walk-off gate on the right screen edge. */
export function rightExit(cols, rows, toMapId, toSpawn, label) {
    return { rect: { x: (cols - 1) * TILE_SIZE, y: 0, w: TILE_SIZE, h: rows * TILE_SIZE }, toMapId, toSpawn, label, kind: "edge" };
}
//# sourceMappingURL=builder.js.map