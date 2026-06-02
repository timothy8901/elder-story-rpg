import { COLORS, TILE_SIZE } from "../../config.js";
import { TileType } from "../../types.js";
import type { GameMap } from "../GameMap.js";
import { MapBuilder, leftExit, rightExit, standOn } from "./builder.js";

const COLS = 46;
const ROWS = 18;

/**
 * Whispering Woods — denser, more vertical terrain with stacked one-way canopy
 * platforms and a low ridge. Bandits and a wolf lurk here. Connects west to the
 * Meadow and east to the Old Imperial Ruins.
 */
export function createWoodsMap(): GameMap {
  const b = new MapBuilder(COLS, ROWS);
  b.ground(14);
  // A low ridge to clamber over.
  b.rect(20, 13, 27, 13, TileType.Solid);
  b.rect(23, 12, 24, 12, TileType.Solid);
  // Tiered canopy.
  b.platform(11, 4, 9);
  b.platform(8, 11, 16);
  b.platform(11, 18, 23);
  b.platform(7, 25, 30);
  b.platform(10, 32, 38);
  b.platform(12, 40, 44);

  const fromWest = standOn(2, 14);
  const fromEast = standOn(COLS - 3, 14);
  return {
    id: "woods",
    name: "Whispering Woods",
    theme: "field",
    tilemap: b.build(),
    spawn: fromWest,
    spawnPoints: { default: fromWest, fromWest, fromEast },
    bgColor: COLORS.sky,
    enemySpawns: [
      { x: 12 * TILE_SIZE, y: 14 * TILE_SIZE - 40, kind: "Bandit", health: 60, damage: 12, lootLevel: 2 },
      { x: 30 * TILE_SIZE, y: 14 * TILE_SIZE - 40, kind: "Wolf", health: 45, damage: 10, lootLevel: 2 },
      { x: 42 * TILE_SIZE, y: 14 * TILE_SIZE - 40, kind: "Bandit", health: 60, damage: 12, lootLevel: 2 },
    ],
    npcSpawns: [{ faction: "thievesGuild", x: 6 * TILE_SIZE, y: 14 * TILE_SIZE - 42 }],
    exits: [
      leftExit(ROWS, "meadow", "fromEast", "◄ Sunlit Meadow"),
      rightExit(COLS, ROWS, "ruins", "fromWest", "Imperial Ruins ►"),
    ],
  };
}
