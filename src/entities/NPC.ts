import type { Rect } from "../types.js";
import { FACTION_DATA, type FactionId } from "../world/factionData.js";

/** Spawn/init data for an NPC — either a faction recruiter or a story character. */
export interface NpcInit {
  x: number;
  y: number;
  /** Faction recruiter (name/color derived from faction data). */
  faction?: FactionId;
  /** Story character id (e.g. "courier", "arngeir"); requires name/color. */
  story?: string;
  name?: string;
  color?: string;
}

/**
 * A non-combat character standing in the world: faction recruiters and
 * main-story figures alike. Static (no physics); the player walks up and
 * interacts. Game decides what dialogue to show based on faction/story state.
 */
export class NPC {
  readonly faction?: FactionId;
  readonly story?: string;
  readonly name: string;
  readonly color: string;
  readonly x: number;
  readonly y: number;
  readonly w = 26;
  readonly h = 42;
  /** Faces the player when nearby (set by Game). */
  facing: 1 | -1 = -1;

  constructor(init: NpcInit) {
    this.x = init.x;
    this.y = init.y;
    if (init.faction) {
      this.faction = init.faction;
      this.name = FACTION_DATA[init.faction].recruiter;
      this.color = FACTION_DATA[init.faction].color;
    } else {
      this.story = init.story;
      this.name = init.name ?? "?";
      this.color = init.color ?? "#9a8cc0";
    }
  }

  get isFaction(): boolean {
    return this.faction !== undefined;
  }
  get centerX(): number {
    return this.x + this.w / 2;
  }
  get rect(): Rect {
    return { x: this.x, y: this.y, w: this.w, h: this.h };
  }
}
