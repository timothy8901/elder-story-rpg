import { COLORS, TILE_SIZE } from "../../config.js";
import { TileType } from "../../types.js";
import type { GameMap } from "../GameMap.js";
import { MapBuilder, standOn } from "./builder.js";

const COLS = 22;
const ROWS = 30;

/**
 * The Throat of the World — a tall vertical climb (the "7000 Steps") up to the
 * High Hrothgar terrace, where the Greybeard Arngeir teaches the Voice and,
 * later, the World-Eater himself descends for the final battle. Walls on both
 * sides keep the climb contained; one-way ledges zig-zag to the summit.
 */
export function createThroatMap(): GameMap {
  const b = new MapBuilder(COLS, ROWS);
  b.ground(27); // entrance floor at the mountain's foot
  b.wall(0);
  b.wall(COLS - 1);

  // Ascending one-way ledges.
  b.platform(24, 3, 8);
  b.platform(21, 12, 18);
  b.platform(18, 4, 10);
  b.platform(15, 12, 18);
  b.platform(12, 4, 10);
  b.platform(9, 11, 17);
  b.platform(6, 5, 12);

  // The summit terrace (solid).
  b.rect(5, 4, 17, 5, TileType.Solid);

  const entrance = standOn(3, 27);
  return {
    id: "throat",
    name: "Throat of the World",
    theme: "field",
    tilemap: b.build(),
    spawn: entrance,
    spawnPoints: { default: entrance, fromOverworld: entrance },
    bgColor: COLORS.sky,
    enemySpawns: [],
    npcSpawns: [{ story: "arngeir", name: "Arngeir", color: "#8a8f98", x: 10 * TILE_SIZE, y: 4 * TILE_SIZE - 42 }],
    exits: [
      {
        rect: { x: 1 * TILE_SIZE, y: 25 * TILE_SIZE, w: TILE_SIZE, h: 2 * TILE_SIZE },
        toMapId: "overworld",
        toSpawn: "fromThroat",
        label: "Descend ↓",
        kind: "portal",
      },
    ],
  };
}
