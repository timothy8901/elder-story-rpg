import { FACTION_DATA } from "../world/factionData.js";
/**
 * A non-combat character standing in the world: faction recruiters and
 * main-story figures alike. Static (no physics); the player walks up and
 * interacts. Game decides what dialogue to show based on faction/story state.
 */
export class NPC {
    constructor(init) {
        this.w = 26;
        this.h = 42;
        /** Faces the player when nearby (set by Game). */
        this.facing = -1;
        this.x = init.x;
        this.y = init.y;
        this.vendor = init.vendor ?? false;
        if (init.faction) {
            this.faction = init.faction;
            this.name = FACTION_DATA[init.faction].recruiter;
            this.color = FACTION_DATA[init.faction].color;
        }
        else {
            this.story = init.story;
            this.name = init.name ?? "?";
            this.color = init.color ?? "#9a8cc0";
        }
    }
    get isFaction() {
        return this.faction !== undefined;
    }
    get centerX() {
        return this.x + this.w / 2;
    }
    get rect() {
        return { x: this.x, y: this.y, w: this.w, h: this.h };
    }
}
//# sourceMappingURL=NPC.js.map