import { COLORS, TILE_SIZE } from "../../config.js";
import { TileType } from "../../types.js";
import type { GameMap } from "../GameMap.js";
import { MapBuilder, groundPortal, standOn } from "./builder.js";

const COLS = 42;
const ROWS = 18;

/**
 * Old Imperial Ruins — the eastern terminus of the overworld. Broken pillars to
 * vault and crumbled lintels (one-ways), guarded by hardened bandits. Walls seal
 * both ends; a single ground portal leads back to the Whispering Woods.
 */
export function createRuinsMap(): GameMap {
  const b = new MapBuilder(COLS, ROWS);
  b.ground(14);
  b.wall(0);
  b.wall(COLS - 1);
  // Broken pillars (3 tiles tall — vault over or hop up).
  b.col(13, 11, 13, TileType.Solid);
  b.col(20, 11, 13, TileType.Solid);
  b.col(28, 11, 13, TileType.Solid);
  b.col(34, 11, 13, TileType.Solid);
  // Crumbled lintels.
  b.platform(9, 16, 22);
  b.platform(8, 25, 30);
  b.platform(10, 32, 37);

  const fromWoods = standOn(6, 14);
  return {
    id: "ruins",
    name: "Old Imperial Ruins",
    theme: "field",
    tilemap: b.build(),
    spawn: fromWoods,
    spawnPoints: { default: fromWoods, fromWoods },
    bgColor: COLORS.sky,
    enemySpawns: [
      { x: 17 * TILE_SIZE, y: 14 * TILE_SIZE - 40, kind: "Bandit", health: 75, damage: 14, lootLevel: 3 },
      { x: 24 * TILE_SIZE, y: 14 * TILE_SIZE - 40, kind: "Bandit", health: 75, damage: 14, lootLevel: 3 },
      { x: 31 * TILE_SIZE, y: 14 * TILE_SIZE - 40, kind: "Bandit", health: 90, damage: 16, lootLevel: 3 },
    ],
    npcSpawns: [{ faction: "blades", x: 9 * TILE_SIZE, y: 14 * TILE_SIZE - 42 }],
    exits: [groundPortal(3, 14, "woods", "fromRuins", "Whispering Woods")],
  };
}
