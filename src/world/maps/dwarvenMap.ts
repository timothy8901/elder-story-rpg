import { TILE_SIZE } from "../../config.js";
import { TileType } from "../../types.js";
import type { GameMap } from "../GameMap.js";
import { MapBuilder, groundPortal, standOn } from "./builder.js";

const COLS = 46;
const ROWS = 18;

/**
 * Nchuand-Zel — a Dwemer ruin deep beneath Hollowdeep Cave, where heavily-armored
 * Dwarven battle-mages have stirred. Metal machinery to clamber over, one-way
 * gantries overhead, and (once the quest is active) a Warlord in the depths.
 */
export function createDwarvenMap(): GameMap {
  const b = new MapBuilder(COLS, ROWS);
  b.ground(14);
  b.wall(0);
  b.wall(COLS - 1);

  // Central machinery block + side plinths to fight around.
  b.rect(22, 12, 26, 13, TileType.Solid);
  b.rect(11, 13, 13, 13, TileType.Solid);
  // Gantries (one-way).
  b.platform(10, 5, 10);
  b.platform(8, 15, 20);
  b.platform(11, 28, 34);
  b.platform(9, 37, 43);

  const entrance = standOn(5, 14);
  return {
    id: "dwarven",
    name: "Nchuand-Zel",
    theme: "dwarven",
    tilemap: b.build(),
    spawn: entrance,
    spawnPoints: { default: entrance, fromCave: entrance },
    bgColor: "#140d07",
    enemySpawns: [
      { x: 9 * TILE_SIZE, y: 14 * TILE_SIZE - 40, kind: "Dwarven Battlemage", health: 90, damage: 14, lootLevel: 3 },
      { x: 19 * TILE_SIZE, y: 14 * TILE_SIZE - 40, kind: "Dwarven Battlemage", health: 90, damage: 14, lootLevel: 3 },
      { x: 33 * TILE_SIZE, y: 14 * TILE_SIZE - 40, kind: "Dwarven Battlemage", health: 100, damage: 15, lootLevel: 3 },
    ],
    npcSpawns: [],
    exits: [groundPortal(2, 14, "cave", "fromDwarven", "Hollowdeep Cave")],
  };
}
