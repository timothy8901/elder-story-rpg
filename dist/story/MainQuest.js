import { TILE_SIZE } from "../config.js";
const OBJECTIVES = {
    notStarted: "Seek the courier in Greenreach Vale.",
    dragonRising: "A dragon was sighted over the Sunlit Meadow. Slay it.",
    wayOfVoice: "Climb the Throat of the World and seek Arngeir.",
    bladeInDark: "Prove your Voice — slay the dragon Sahloknir at the summit.",
    alduinsBane: "Return to Arngeir to learn the Shout Dragonrend.",
    dragonslayer: "Alduin has come. Ground him with Dragonrend, then slay the World-Eater.",
    complete: "Alduin is slain. Skyrim is saved, Dragonborn.",
};
export class MainQuest {
    constructor() {
        this.stage = "notStarted";
        this.dragonSouls = 0;
        this.isDragonborn = false;
        this.shouts = new Set();
    }
    get objective() {
        return OBJECTIVES[this.stage];
    }
    get active() {
        return this.stage !== "notStarted" && this.stage !== "complete";
    }
    knowsShout(id) {
        return this.shouts.has(id);
    }
    learnShout(id) {
        this.shouts.add(id);
    }
    setStage(stage) {
        this.stage = stage;
    }
    /** The courier's tale of Helgen kicks off the quest. Returns narration lines. */
    startFromCourier() {
        if (this.stage === "notStarted")
            this.stage = "dragonRising";
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
    onDragonSlain(kind) {
        this.dragonSouls += 1;
        const messages = ["A dragon's soul rushes into you…"];
        let victory = false;
        if (kind === "Alduin" && this.stage === "dragonslayer") {
            this.stage = "complete";
            victory = true;
            messages.push("Alduin, the World-Eater, is no more.");
        }
        else if (kind === "Sahloknir" && this.stage === "bladeInDark") {
            this.stage = "alduinsBane";
            messages.push("Sahloknir falls. Return to Arngeir.");
        }
        else if (this.stage === "dragonRising") {
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
    extraSpawns(mapId) {
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
    toJSON() {
        return { stage: this.stage, dragonSouls: this.dragonSouls, isDragonborn: this.isDragonborn, shouts: [...this.shouts] };
    }
    load(save) {
        this.stage = save.stage ?? "notStarted";
        this.dragonSouls = save.dragonSouls ?? 0;
        this.isDragonborn = save.isDragonborn ?? false;
        this.shouts.clear();
        for (const s of save.shouts ?? [])
            this.shouts.add(s);
    }
}
//# sourceMappingURL=MainQuest.js.map