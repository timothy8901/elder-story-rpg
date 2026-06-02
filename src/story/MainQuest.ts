import { TILE_SIZE } from "../config.js";
import type { ShoutId } from "../combat/shouts.js";

/**
 * The main-story state machine — a faithful, condensed take on Skyrim's main
 * quest: escape Helgen → become Dragonborn → learn the Voice → learn Dragonrend
 * → slay Alduin. It also carries the Dragonborn state (absorbed souls and known
 * shouts), since those are story-gated.
 */
export type Stage =
  | "notStarted"
  | "dragonRising" // slay the first dragon (Sunlit Meadow)
  | "wayOfVoice" // climb the Throat of the World, learn Unrelenting Force
  | "bladeInDark" // slay the dragon Sahloknir at the summit
  | "alduinsBane" // return to Arngeir, learn Dragonrend
  | "dragonslayer" // ground Alduin with Dragonrend and slay him
  | "complete";

/** A dragon the story spawns into a map at the current stage. */
export interface DragonSpawn {
  x: number;
  y: number;
  kind: string;
  health: number;
  damage: number;
  named?: boolean;
  requiresDragonrend?: boolean;
}

export interface MainQuestSave {
  stage: Stage;
  dragonSouls: number;
  isDragonborn: boolean;
  shouts: ShoutId[];
}

const OBJECTIVES: Record<Stage, string> = {
  notStarted: "Seek the courier in Greenreach Vale.",
  dragonRising: "A dragon was sighted over the Sunlit Meadow. Slay it.",
  wayOfVoice: "Climb the Throat of the World and seek Arngeir.",
  bladeInDark: "Prove your Voice — slay the dragon Sahloknir at the summit.",
  alduinsBane: "Return to Arngeir to learn the Shout Dragonrend.",
  dragonslayer: "Alduin has come. Ground him with Dragonrend, then slay the World-Eater.",
  complete: "Alduin is slain. Skyrim is saved, Dragonborn.",
};

export class MainQuest {
  stage: Stage = "notStarted";
  dragonSouls = 0;
  isDragonborn = false;
  readonly shouts = new Set<ShoutId>();

  get objective(): string {
    return OBJECTIVES[this.stage];
  }
  get active(): boolean {
    return this.stage !== "notStarted" && this.stage !== "complete";
  }

  knowsShout(id: ShoutId): boolean {
    return this.shouts.has(id);
  }
  learnShout(id: ShoutId): void {
    this.shouts.add(id);
  }
  setStage(stage: Stage): void {
    this.stage = stage;
  }

  /** The courier's tale of Helgen kicks off the quest. Returns narration lines. */
  startFromCourier(): string[] {
    if (this.stage === "notStarted") this.stage = "dragonRising";
    return [
      "Word from the south — the town of Helgen is ash and cinder.",
      "A great black dragon fell from the sky and burned it to the ground.",
      "They say it spoke. They say it was Alduin, the World-Eater, returned.",
      "You walked out of that fire alive. Perhaps you are meant for more.",
    ];
  }

  /**
   * Absorb a slain dragon's soul and advance the arc if this was the dragon the
   * story was waiting on. Returns HUD messages and whether the world was saved.
   */
  onDragonSlain(kind: string): { messages: string[]; victory: boolean } {
    this.dragonSouls += 1;
    const messages: string[] = ["A dragon's soul rushes into you…"];
    let victory = false;

    if (kind === "Alduin" && this.stage === "dragonslayer") {
      this.stage = "complete";
      victory = true;
      messages.push("Alduin, the World-Eater, is no more.");
    } else if (kind === "Sahloknir" && this.stage === "bladeInDark") {
      this.stage = "alduinsBane";
      messages.push("Sahloknir falls. Return to Arngeir.");
    } else if (this.stage === "dragonRising") {
      this.isDragonborn = true;
      this.stage = "wayOfVoice";
      messages.push("You are DRAGONBORN — your soul is that of a dragon.");
      messages.push("The Greybeards call to you from the Throat of the World.");
    }

    // A taste of the Thu'um comes naturally with souls.
    if (this.dragonSouls >= 2 && !this.shouts.has("fireBreath")) {
      this.shouts.add("fireBreath");
      messages.push("You instinctively know a new Shout: Fire Breath.");
    }
    return { messages, victory };
  }

  /** Dragons the story injects into a given map at the current stage. */
  extraSpawns(mapId: string): DragonSpawn[] {
    if (this.stage === "dragonRising" && mapId === "meadow") {
      return [{ x: 22 * TILE_SIZE, y: 4 * TILE_SIZE, kind: "Dragon", health: 120, damage: 14 }];
    }
    if (this.stage === "bladeInDark" && mapId === "throat") {
      return [{ x: 11 * TILE_SIZE, y: 3 * TILE_SIZE, kind: "Sahloknir", named: true, health: 190, damage: 18 }];
    }
    if (this.stage === "dragonslayer" && mapId === "throat") {
      return [{ x: 11 * TILE_SIZE, y: 3 * TILE_SIZE, kind: "Alduin", named: true, requiresDragonrend: true, health: 320, damage: 22 }];
    }
    return [];
  }

  toJSON(): MainQuestSave {
    return { stage: this.stage, dragonSouls: this.dragonSouls, isDragonborn: this.isDragonborn, shouts: [...this.shouts] };
  }
  load(save: MainQuestSave): void {
    this.stage = save.stage ?? "notStarted";
    this.dragonSouls = save.dragonSouls ?? 0;
    this.isDragonborn = save.isDragonborn ?? false;
    this.shouts.clear();
    for (const s of save.shouts ?? []) this.shouts.add(s);
  }
}
