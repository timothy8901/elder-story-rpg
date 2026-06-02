import { COLORS, TILE_SIZE } from "../../config.js";
import { TileType } from "../../types.js";
import type { GameMap } from "../GameMap.js";
import { MapBuilder, leftExit, standOn } from "./builder.js";

const COLS = 42;
const ROWS = 18;

/**
 * Old Imperial Ruins — the eastern terminus of the overworld. Broken pillars to
 * vault and crumbled lintels (one-ways), guarded by hardened bandits. Connects
 * west to the Whispering Woods; the east side is sealed by collapsed stone.
 */
export function createRuinsMap(): GameMap {
  const b = new MapBuilder(COLS, ROWS);
  b.ground(14);
  // Broken pillars (3 tiles tall — vault over or hop up).
  b.col(9, 11, 13, TileType.Solid);
  b.col(17, 11, 13, TileType.Solid);
  b.col(26, 11, 13, TileType.Solid);
  b.col(33, 11, 13, TileType.Solid);
  // Crumbled lintels.
  b.platform(9, 14, 19);
  b.platform(8, 23, 28);
  b.platform(10, 30, 36);
  b.wall(COLS - 1); // collapsed stone seals the east

  const fromWest = standOn(2, 14);
  return {
    id: "ruins",
    name: "Old Imperial Ruins",
    theme: "field",
    tilemap: b.build(),
    spawn: fromWest,
    spawnPoints: { default: fromWest, fromWest },
    bgColor: COLORS.sky,
    enemySpawns: [
      { x: 13 * TILE_SIZE, y: 14 * TILE_SIZE - 40, kind: "Bandit", health: 75, damage: 14, lootLevel: 3 },
      { x: 22 * TILE_SIZE, y: 14 * TILE_SIZE - 40, kind: "Bandit", health: 75, damage: 14, lootLevel: 3 },
      { x: 31 * TILE_SIZE, y: 14 * TILE_SIZE - 40, kind: "Bandit", health: 90, damage: 16, lootLevel: 3 },
    ],
    npcSpawns: [{ faction: "blades", x: 5 * TILE_SIZE, y: 14 * TILE_SIZE - 42 }],
    exits: [leftExit(ROWS, "woods", "fromEast", "◄ Whispering Woods")],
  };
}
