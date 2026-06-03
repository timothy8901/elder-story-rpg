import { COLORS, TILE_SIZE } from "../../config.js";
import { TileType } from "../../types.js";
import type { GameMap } from "../GameMap.js";
import { MapBuilder, groundPortal, standOn } from "./builder.js";

const COLS = 44;
const ROWS = 18;

/**
 * Sunlit Meadow — the open grassland between Greenreach Vale and the Whispering
 * Woods. Walls seal both ends; travel is via the two ground portals.
 */
export function createMeadowMap(): GameMap {
  const b = new MapBuilder(COLS, ROWS);
  b.ground(14); // continuous grass underfoot, edge to edge
  b.wall(0);
  b.wall(COLS - 1);
  // Optional canopy of one-way platforms.
  b.platform(11, 5, 10);
  b.platform(9, 16, 22);
  b.platform(11, 27, 32);
  b.platform(8, 36, 41);
  // A low solid knoll to vault.
  b.rect(30, 13, 32, 13, TileType.Solid);

  const fromOverworld = standOn(6, 14);
  const fromWoods = standOn(35, 14);
  return {
    id: "meadow",
    name: "Sunlit Meadow",
    theme: "field",
    tilemap: b.build(),
    spawn: fromOverworld,
    spawnPoints: { default: fromOverworld, fromOverworld, fromWoods },
    bgColor: COLORS.sky,
    enemySpawns: [
      { x: 14 * TILE_SIZE, y: 14 * TILE_SIZE - 40, kind: "Wolf", health: 40, damage: 9, lootLevel: 1 },
      { x: 23 * TILE_SIZE, y: 14 * TILE_SIZE - 40, kind: "Wolf", health: 40, damage: 9, lootLevel: 1 },
      { x: 28 * TILE_SIZE, y: 14 * TILE_SIZE - 40, kind: "Bandit", health: 55, damage: 11, lootLevel: 2 },
    ],
    npcSpawns: [{ faction: "bards", x: 9 * TILE_SIZE, y: 14 * TILE_SIZE - 42 }],
    exits: [
      groundPortal(3, 14, "overworld", "fromMeadow", "Greenreach Vale"),
      groundPortal(38, 14, "woods", "fromMeadow", "Whispering Woods"),
    ],
  };
}
