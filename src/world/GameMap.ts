import type { Tilemap } from "../physics/Tilemap.js";
import type { Rect, Vec2 } from "../types.js";
import type { FactionId } from "./factionData.js";

/** Where an NPC stands on a map — a faction recruiter or a story character. */
export interface NpcSpawn {
  x: number;
  y: number;
  faction?: FactionId;
  /** Story character id (e.g. "courier", "arngeir"). */
  story?: string;
  name?: string;
  color?: string;
  /** A shopkeeper (opens the buy/sell shop on interact). */
  vendor?: boolean;
}

/** Visual theme that drives background and tile rendering. */
export type MapTheme = "field" | "cave" | "dwarven";

/** Where an enemy starts on a map. */
export interface EnemySpawn {
  x: number;
  y: number;
  kind?: string;
  health?: number;
  damage?: number;
  lootLevel?: number;
}

/** A doorway/portal: stepping into `rect` travels to another map. */
export interface MapExit {
  rect: Rect;
  toMapId: string;
  /** Named spawn point to arrive at in the destination map. */
  toSpawn: string;
  label: string;
  /**
   * How it's drawn: "portal" = a swirling gateway (default), "edge" = a side
   * gate at the screen edge with directional chevrons (MapleStory-style walk-off).
   */
  kind?: "portal" | "edge";
}

/**
 * A self-contained level: its collision grid, spawn points, theme, enemy
 * spawns, and exits to other maps.
 */
export interface GameMap {
  readonly id: string;
  readonly name: string;
  readonly theme: MapTheme;
  readonly tilemap: Tilemap;
  /** Default spawn (new game / fallback). */
  readonly spawn: Vec2;
  /** Named arrival points used when entering via an exit. */
  readonly spawnPoints: Record<string, Vec2>;
  readonly bgColor: string;
  readonly enemySpawns: EnemySpawn[];
  readonly npcSpawns: NpcSpawn[];
  readonly exits: MapExit[];
}
