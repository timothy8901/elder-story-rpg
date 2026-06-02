import { TILE_SIZE } from "../config.js";
import { TileType } from "../types.js";
/**
 * A fixed grid of tiles addressed as `grid[row][col]`. Provides the world<->tile
 * coordinate conversions and tile lookups the collision resolver and renderer
 * need. Out-of-bounds reads return {@link TileType.Empty} (open air) so the
 * player can fall off the edges / into pits without special-casing.
 */
export class Tilemap {
    constructor(grid) {
        this.grid = grid;
        this.rows = grid.length;
        this.cols = grid[0]?.length ?? 0;
    }
    get pixelWidth() {
        return this.cols * TILE_SIZE;
    }
    get pixelHeight() {
        return this.rows * TILE_SIZE;
    }
    /** Tile at a grid coordinate; out-of-bounds is treated as {@link TileType.Empty}. */
    tileAt(col, row) {
        if (row < 0 || row >= this.rows || col < 0 || col >= this.cols) {
            return TileType.Empty;
        }
        return this.grid[row][col];
    }
    /** World X (px) -> column index. */
    colAt(x) {
        return Math.floor(x / TILE_SIZE);
    }
    /** World Y (px) -> row index. */
    rowAt(y) {
        return Math.floor(y / TILE_SIZE);
    }
}
//# sourceMappingURL=Tilemap.js.map