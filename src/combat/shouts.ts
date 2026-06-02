/**
 * Dragon Shouts (Thu'um) — a Dragonborn-only combat system, separate from
 * spells. Words of Power are learned at story beats; using a shout has a
 * cooldown rather than a resource cost.
 */

export type ShoutId = "unrelentingForce" | "fireBreath" | "dragonrend";

export type ShoutKind = "force" | "fire" | "dragonrend";

export interface ShoutDef {
  id: ShoutId;
  name: string;
  /** The three Words of Power, for flavor. */
  words: string;
  kind: ShoutKind;
  cooldown: number;
  /** Reach of the shout's effect in front of the player (pixels). */
  range: number;
  /** Base damage (force/fire) or effect seconds (dragonrend). */
  power: number;
  color: string;
}

export const SHOUTS: Record<ShoutId, ShoutDef> = {
  unrelentingForce: {
    id: "unrelentingForce",
    name: "Unrelenting Force",
    words: "Fus Ro Dah",
    kind: "force",
    cooldown: 3,
    range: 150,
    power: 22,
    color: "#cfe3ff",
  },
  fireBreath: {
    id: "fireBreath",
    name: "Fire Breath",
    words: "Yol Toor Shul",
    kind: "fire",
    cooldown: 6,
    range: 180,
    power: 40,
    color: "#ff8a3d",
  },
  dragonrend: {
    id: "dragonrend",
    name: "Dragonrend",
    words: "Joor Zah Frul",
    kind: "dragonrend",
    cooldown: 8,
    range: 460,
    power: 8, // seconds a dragon is forced down & made mortal
    color: "#b06bff",
  },
};

/** Stable display order for cycling. */
export const SHOUT_ORDER: ShoutId[] = ["unrelentingForce", "fireBreath", "dragonrend"];
