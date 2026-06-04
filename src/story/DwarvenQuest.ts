import { TILE_SIZE } from "../config.js";

/**
 * "Echoes of the Deep" — a side questline given by the scholar Calcelmo: descend
 * into the Dwemer ruin of Nchuand-Zel, destroy the awakened Dwarven Warlord, and
 * return for a reward. The Dwarven battle-mages roam the ruin regardless; the
 * Warlord only appears while the quest is active.
 */
export type DwarvenStage = "notStarted" | "investigate" | "returnToCalcelmo" | "complete";

export interface DwarfSpawn {
  x: number;
  y: number;
  kind: string;
  health: number;
  damage: number;
  lootLevel: number;
  boss?: boolean;
}

export interface DwarvenQuestSave {
  stage: DwarvenStage;
}

const OBJECTIVES: Record<DwarvenStage, string> = {
  notStarted: "Speak with Calcelmo in Greenreach Vale.",
  investigate: "Descend through Hollowdeep Cave into Nchuand-Zel and destroy the Dwarven Warlord.",
  returnToCalcelmo: "Return to Calcelmo — the Warlord is destroyed.",
  complete: "Nchuand-Zel is silent once more.",
};

export class DwarvenQuest {
  stage: DwarvenStage = "notStarted";

  get objective(): string {
    return OBJECTIVES[this.stage];
  }
  get active(): boolean {
    return this.stage === "investigate" || this.stage === "returnToCalcelmo";
  }
  setStage(stage: DwarvenStage): void {
    this.stage = stage;
  }

  /** Calcelmo briefs you on the awakened ruin. */
  startFromCalcelmo(): string[] {
    if (this.stage === "notStarted") this.stage = "investigate";
    return [
      "The deep machines stir again. Nchuand-Zel — the old Dwemer hall beneath Hollowdeep Cave — has woken.",
      "Armored conjurer-smiths walk its halls now: warhammers in hand, fire on their tongues, light wrapped about them as a shield.",
      "Their Warlord directs them all. Silence it, and bring me what you find. The College will reward you richly.",
    ];
  }

  /** Slaying the Warlord advances the quest. */
  onWarlordSlain(): string[] {
    if (this.stage === "investigate") {
      this.stage = "returnToCalcelmo";
      return ["The Dwarven Warlord collapses into a heap of gears and steam.", "Return to Calcelmo with the news."];
    }
    return [];
  }

  /** The Warlord the quest injects into Nchuand-Zel while active. */
  extraSpawns(mapId: string): DwarfSpawn[] {
    if (this.stage === "investigate" && mapId === "dwarven") {
      return [{ x: 41 * TILE_SIZE, y: 14 * TILE_SIZE - 50, kind: "Dwarven Warlord", health: 240, damage: 20, lootLevel: 4, boss: true }];
    }
    return [];
  }

  toJSON(): DwarvenQuestSave {
    return { stage: this.stage };
  }
  load(save: DwarvenQuestSave): void {
    this.stage = save?.stage ?? "notStarted";
  }
}
