import { TILE_SIZE } from "../config.js";
const OBJECTIVES = {
    notStarted: "Speak with Calcelmo in Greenreach Vale.",
    investigate: "Descend through Hollowdeep Cave into Nchuand-Zel and destroy the Dwarven Warlord.",
    returnToCalcelmo: "Return to Calcelmo — the Warlord is destroyed.",
    complete: "Nchuand-Zel is silent once more.",
};
export class DwarvenQuest {
    constructor() {
        this.stage = "notStarted";
    }
    get objective() {
        return OBJECTIVES[this.stage];
    }
    get active() {
        return this.stage === "investigate" || this.stage === "returnToCalcelmo";
    }
    setStage(stage) {
        this.stage = stage;
    }
    /** Calcelmo briefs you on the awakened ruin. */
    startFromCalcelmo() {
        if (this.stage === "notStarted")
            this.stage = "investigate";
        return [
            "The deep machines stir again. Nchuand-Zel — the old Dwemer hall beneath Hollowdeep Cave — has woken.",
            "Armored conjurer-smiths walk its halls now: warhammers in hand, fire on their tongues, light wrapped about them as a shield.",
            "Their Warlord directs them all. Silence it, and bring me what you find. The College will reward you richly.",
        ];
    }
    /** Slaying the Warlord advances the quest. */
    onWarlordSlain() {
        if (this.stage === "investigate") {
            this.stage = "returnToCalcelmo";
            return ["The Dwarven Warlord collapses into a heap of gears and steam.", "Return to Calcelmo with the news."];
        }
        return [];
    }
    /** The Warlord the quest injects into Nchuand-Zel while active. */
    extraSpawns(mapId) {
        if (this.stage === "investigate" && mapId === "dwarven") {
            return [{ x: 41 * TILE_SIZE, y: 14 * TILE_SIZE - 50, kind: "Dwarven Warlord", health: 240, damage: 20, lootLevel: 4, boss: true }];
        }
        return [];
    }
    toJSON() {
        return { stage: this.stage };
    }
    load(save) {
        this.stage = save?.stage ?? "notStarted";
    }
}
//# sourceMappingURL=DwarvenQuest.js.map