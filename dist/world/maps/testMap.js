import { COLORS, PLAYER_H, TILE_SIZE } from "../../config.js";
import { Tilemap } from "../../physics/Tilemap.js";
import { TileType } from "../../types.js";
import { rightExit } from "./builder.js";
const COLS = 50;
const ROWS = 18;
/**
 * Build the Phase-1 test level. It deliberately exercises every collision case:
 *  - long **solid** ground at row 14, split by a **pit** (cols 22–28),
 *  - a recessed world floor at row 17 the pit drops to,
 *  - an interior **wall/step** (col 18) to bump into and climb,
 *  - a **solid block** (cols 40–45) you land on but cannot pass through,
 *  - several **one-way** platforms to jump up through and drop down from.
 */
export function createTestMap() {
    const grid = Array.from({ length: ROWS }, () => Array.from({ length: COLS }, () => TileType.Empty));
    const set = (col, row, t) => {
        if (row >= 0 && row < ROWS && col >= 0 && col < COLS)
            grid[row][col] = t;
    };
    const fillRow = (row, c0, c1, t) => {
        for (let c = c0; c <= c1; c++)
            set(c, row, t);
    };
    const fillCol = (col, r0, r1, t) => {
        for (let r = r0; r <= r1; r++)
            set(col, r, t);
    };
    // World boundaries: floor along the bottom + a wall on the (closed) west side.
    // The east side is OPEN — a walk-off gate leads to the Sunlit Meadow.
    fillRow(17, 0, COLS - 1, TileType.Solid);
    fillCol(0, 0, ROWS - 1, TileType.Solid);
    // Main ground (rows 14–16), with a gap/pit at columns 22–28, extended east.
    for (let row = 14; row <= 16; row++) {
        fillRow(row, 1, 21, TileType.Solid);
        fillRow(row, 29, COLS - 1, TileType.Solid);
    }
    // Interior wall / step rising from the ground (bump into it, or jump on top).
    fillCol(18, 11, 13, TileType.Solid);
    // Raised solid block — landable on top, impassable from below.
    fillRow(10, 40, 45, TileType.Solid);
    fillRow(11, 40, 45, TileType.Solid);
    // One-way platforms (jump up through, drop down with ↓ + jump).
    fillRow(11, 4, 9, TileType.OneWay);
    fillRow(8, 12, 17, TileType.OneWay);
    fillRow(14, 22, 28, TileType.OneWay); // bridge over the pit — drop through to reach the cave below
    fillRow(11, 32, 37, TileType.OneWay);
    const tilemap = new Tilemap(grid);
    const spawn = { x: 3 * TILE_SIZE, y: 14 * TILE_SIZE - PLAYER_H - 1 };
    return {
        id: "overworld",
        name: "Greenreach Vale",
        theme: "field",
        tilemap,
        spawn,
        spawnPoints: {
            default: spawn,
            // Climbing back out of the cave: on the ground just east of the pit.
            fromCave: { x: 30 * TILE_SIZE, y: 14 * TILE_SIZE - PLAYER_H - 1 },
            // Arriving from the Meadow: just inside the east edge.
            fromEast: { x: 46 * TILE_SIZE, y: 14 * TILE_SIZE - PLAYER_H - 1 },
            // Descending from the Throat of the World.
            fromThroat: { x: 42 * TILE_SIZE, y: 14 * TILE_SIZE - PLAYER_H - 1 },
        },
        bgColor: COLORS.sky,
        enemySpawns: [
            { x: 31 * TILE_SIZE, y: 14 * TILE_SIZE - 40, kind: "Wolf", health: 35, damage: 8, lootLevel: 1 },
            { x: 37 * TILE_SIZE, y: 14 * TILE_SIZE - 40, kind: "Bandit", health: 50, damage: 10, lootLevel: 2 },
        ],
        npcSpawns: [
            { faction: "legion", x: 4 * TILE_SIZE, y: 14 * TILE_SIZE - 42 },
            { faction: "stormcloaks", x: 8 * TILE_SIZE, y: 14 * TILE_SIZE - 42 },
            { faction: "companions", x: 12 * TILE_SIZE, y: 14 * TILE_SIZE - 42 },
            { faction: "college", x: 16 * TILE_SIZE, y: 14 * TILE_SIZE - 42 },
            // Main-story quest giver.
            { story: "courier", name: "Courier", color: "#b9a04a", x: 20 * TILE_SIZE, y: 14 * TILE_SIZE - 42 },
        ],
        exits: [
            // Descend into the cave through the gap beneath the bridge (↓ + jump).
            {
                rect: { x: 24 * TILE_SIZE, y: 16 * TILE_SIZE, w: 2 * TILE_SIZE, h: TILE_SIZE },
                toMapId: "cave",
                toSpawn: "fromOverworld",
                label: "Hollowdeep Cave ↓",
                kind: "portal",
            },
            // The mountain path to the Greybeards.
            {
                rect: { x: 44 * TILE_SIZE, y: 12 * TILE_SIZE, w: TILE_SIZE, h: 2 * TILE_SIZE },
                toMapId: "throat",
                toSpawn: "fromOverworld",
                label: "Throat of the World ↥",
                kind: "portal",
            },
            // Walk off the east edge into the Sunlit Meadow.
            rightExit(COLS, ROWS, "meadow", "fromWest", "Sunlit Meadow ►"),
        ],
    };
}
//# sourceMappingURL=testMap.js.map