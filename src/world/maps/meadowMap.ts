import { COLORS, TILE_SIZE } from "../../config.js";
import { TileType } from "../../types.js";
import type { GameMap } from "../GameMap.js";
import { MapBuilder, leftExit, rightExit, standOn } from "./builder.js";

const COLS = 44;
const ROWS = 18;

/**
 * Sunlit Meadow — the open grassland east of Greenreach Vale. Flat, breezy
 * traversal with one-way platforms overhead and a few wolves. Connects west to
 * Greenreach and east to the Whispering Woods.
 */
export function createMeadowMap(): GameMap {
  const b = new MapBuilder(COLS, ROWS);
  b.ground(14); // continuous grass underfoot, edge to edge
  // Optional canopy of one-way platforms.
  b.platform(11, 5, 10);
  b.platform(9, 16, 22);
  b.platform(11, 27, 32);
  b.platform(8, 36, 41);
  // A low solid knoll to vault.
  b.rect(33, 13, 35, 13, TileType.Solid);

  const fromWest = standOn(2, 14);
  const fromEast = standOn(COLS - 3, 14);
  return {
    id: "meadow",
    name: "Sunlit Meadow",
    theme: "field",
    tilemap: b.build(),
    spawn: fromWest,
    spawnPoints: { default: fromWest, fromWest, fromEast },
    bgColor: COLORS.sky,
    enemySpawns: [
      { x: 14 * TILE_SIZE, y: 14 * TILE_SIZE - 40, kind: "Wolf", health: 40, damage: 9, lootLevel: 1 },
      { x: 23 * TILE_SIZE, y: 14 * TILE_SIZE - 40, kind: "Wolf", health: 40, damage: 9, lootLevel: 1 },
      { x: 29 * TILE_SIZE, y: 14 * TILE_SIZE - 40, kind: "Bandit", health: 55, damage: 11, lootLevel: 2 },
    ],
    npcSpawns: [{ faction: "bards", x: 6 * TILE_SIZE, y: 14 * TILE_SIZE - 42 }],
    exits: [
      leftExit(ROWS, "overworld", "fromEast", "◄ Greenreach Vale"),
      rightExit(COLS, ROWS, "woods", "fromWest", "Whispering Woods ►"),
    ],
  };
}
