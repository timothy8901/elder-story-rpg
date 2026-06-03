import { COLORS, TILE_SIZE } from "../../config.js";
import { TileType } from "../../types.js";
import { MapBuilder, groundPortal, standOn } from "./builder.js";
const COLS = 46;
const ROWS = 18;
/**
 * Whispering Woods — denser, more vertical terrain with stacked one-way canopy
 * platforms and a low ridge. Walls seal both ends; travel is via ground portals
 * (west to the Meadow, east to the Old Imperial Ruins).
 */
export function createWoodsMap() {
    const b = new MapBuilder(COLS, ROWS);
    b.ground(14);
    b.wall(0);
    b.wall(COLS - 1);
    // A low ridge to clamber over.
    b.rect(20, 13, 27, 13, TileType.Solid);
    b.rect(23, 12, 24, 12, TileType.Solid);
    // Tiered canopy.
    b.platform(11, 4, 9);
    b.platform(8, 11, 16);
    b.platform(11, 18, 23);
    b.platform(7, 25, 30);
    b.platform(10, 32, 37);
    const fromMeadow = standOn(6, 14);
    const fromRuins = standOn(38, 14);
    return {
        id: "woods",
        name: "Whispering Woods",
        theme: "field",
        tilemap: b.build(),
        spawn: fromMeadow,
        spawnPoints: { default: fromMeadow, fromMeadow, fromRuins },
        bgColor: COLORS.sky,
        enemySpawns: [
            { x: 13 * TILE_SIZE, y: 14 * TILE_SIZE - 40, kind: "Bandit", health: 60, damage: 12, lootLevel: 2 },
            { x: 30 * TILE_SIZE, y: 14 * TILE_SIZE - 40, kind: "Wolf", health: 45, damage: 10, lootLevel: 2 },
            { x: 35 * TILE_SIZE, y: 14 * TILE_SIZE - 40, kind: "Bandit", health: 60, damage: 12, lootLevel: 2 },
        ],
        npcSpawns: [{ faction: "thievesGuild", x: 9 * TILE_SIZE, y: 14 * TILE_SIZE - 42 }],
        exits: [
            groundPortal(3, 14, "meadow", "fromWoods", "Sunlit Meadow"),
            groundPortal(41, 14, "ruins", "fromWoods", "Imperial Ruins"),
        ],
    };
}
//# sourceMappingURL=woodsMap.js.map