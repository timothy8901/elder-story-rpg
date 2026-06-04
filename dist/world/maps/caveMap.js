import { PLAYER_H, TILE_SIZE } from "../../config.js";
import { Tilemap } from "../../physics/Tilemap.js";
import { TileType } from "../../types.js";
const COLS = 40;
const ROWS = 16;
/**
 * A darker dungeon reached through the overworld portal. Tighter quarters, a
 * couple of one-way ledges, tougher Draugr, and a portal back near the entrance.
 */
export function createCaveMap() {
    const grid = Array.from({ length: ROWS }, () => Array.from({ length: COLS }, () => TileType.Empty));
    const fillRow = (row, c0, c1, t) => {
        for (let c = c0; c <= c1; c++)
            grid[row][c] = t;
    };
    const fillCol = (col, r0, r1, t) => {
        for (let r = r0; r <= r1; r++)
            grid[r][col] = t;
    };
    // Enclosed cavern: floor, ceiling, walls.
    fillRow(15, 0, COLS - 1, TileType.Solid);
    fillRow(0, 0, COLS - 1, TileType.Solid);
    fillCol(0, 0, ROWS - 1, TileType.Solid);
    fillCol(COLS - 1, 0, ROWS - 1, TileType.Solid);
    // A raised solid shelf on the right and stepped one-way ledges.
    fillRow(12, 28, 38, TileType.Solid);
    fillRow(13, 28, 38, TileType.Solid);
    fillRow(14, 28, 38, TileType.Solid);
    fillRow(11, 8, 13, TileType.OneWay);
    fillRow(8, 16, 22, TileType.OneWay);
    fillRow(10, 22, 27, TileType.OneWay);
    // A pillar to fight around.
    fillCol(20, 12, 14, TileType.Solid);
    const tilemap = new Tilemap(grid);
    const entrance = { x: 3 * TILE_SIZE, y: 15 * TILE_SIZE - PLAYER_H - 1 };
    return {
        id: "cave",
        name: "Hollowdeep Cave",
        theme: "cave",
        tilemap,
        spawn: entrance,
        spawnPoints: {
            default: entrance,
            fromOverworld: entrance,
            // Climbing back up from the Dwarven ruins.
            fromDwarven: { x: 22 * TILE_SIZE, y: 15 * TILE_SIZE - PLAYER_H - 1 },
        },
        bgColor: "#0e0c14",
        enemySpawns: [
            { x: 14 * TILE_SIZE, y: 15 * TILE_SIZE - 40, kind: "Draugr", health: 60, damage: 12, lootLevel: 2 },
            { x: 24 * TILE_SIZE, y: 9 * TILE_SIZE - 40, kind: "Draugr", health: 60, damage: 12, lootLevel: 2 },
            { x: 33 * TILE_SIZE, y: 12 * TILE_SIZE - 40, kind: "Draugr Lord", health: 90, damage: 16, lootLevel: 3 },
        ],
        npcSpawns: [{ faction: "darkBrotherhood", x: 5 * TILE_SIZE, y: 15 * TILE_SIZE - 42 }],
        exits: [
            {
                rect: { x: 1 * TILE_SIZE, y: 13 * TILE_SIZE, w: TILE_SIZE, h: 2 * TILE_SIZE },
                toMapId: "overworld",
                toSpawn: "fromCave",
                label: "Exit",
            },
            // A sealed Dwemer gate, deeper down.
            {
                rect: { x: 24 * TILE_SIZE, y: 13 * TILE_SIZE, w: 2 * TILE_SIZE, h: 2 * TILE_SIZE },
                toMapId: "dwarven",
                toSpawn: "fromCave",
                label: "Nchuand-Zel ↓",
                kind: "portal",
            },
        ],
    };
}
//# sourceMappingURL=caveMap.js.map