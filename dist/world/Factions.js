import { FACTION_DATA, FACTION_IDS } from "./factionData.js";
const fresh = () => ({ joined: false, rank: 0, stage: 0, progress: 0, rival: false });
/**
 * The player's standing with each faction and the small state machine that
 * drives the questlines. Mutually-exclusive civil-war factions (Legion vs.
 * Stormcloaks) lock each other out on join, which is the core "your choice
 * changes the game" mechanic; promotion grants passive stat bonuses and unlocks.
 */
export class Factions {
    constructor() {
        this.state = {};
        for (const id of FACTION_IDS)
            this.state[id] = fresh();
    }
    get(id) {
        return this.state[id];
    }
    isJoined(id) {
        return this.state[id].joined;
    }
    isPromoted(id) {
        return this.state[id].stage >= 3;
    }
    isRival(id) {
        return this.state[id].rival;
    }
    canJoin(id) {
        const s = this.state[id];
        return !s.joined && !s.rival;
    }
    /** Join a faction. Locks the rival civil-war faction. Returns false if barred. */
    join(id) {
        if (!this.canJoin(id))
            return false;
        const s = this.state[id];
        s.joined = true;
        s.stage = 1;
        s.progress = 0;
        s.rank = 0;
        const rival = FACTION_DATA[id].rival;
        if (rival)
            this.state[rival].rival = true;
        return true;
    }
    /**
     * Advance questline objectives on an enemy kill. Returns any "objective
     * complete" messages for the HUD.
     */
    onKill(info) {
        const msgs = [];
        for (const id of FACTION_IDS) {
            const s = this.state[id];
            if (!s.joined || s.stage !== 1)
                continue;
            const d = FACTION_DATA[id];
            let inc = 0;
            if (d.objectiveType === "kill")
                inc = 1;
            else if (d.objectiveType === "killSpell" && info.bySpell)
                inc = 1;
            else if (d.objectiveType === "killBoss" && info.kind === "Draugr Lord")
                inc = 1;
            else if (d.objectiveType === "sneakKill" && info.sneaking)
                inc = 1;
            else if (d.objectiveType === "dragonKill" && info.isDragon)
                inc = 1;
            if (inc) {
                s.progress += inc;
                if (s.progress >= d.objectiveCount) {
                    s.stage = 2;
                    msgs.push(`${d.name}: objective complete — report to ${d.recruiter}.`);
                }
            }
        }
        return msgs;
    }
    /** Track gold-based objectives (Thieves Guild). Returns completion messages. */
    checkGold(gold) {
        const msgs = [];
        for (const id of FACTION_IDS) {
            const s = this.state[id];
            const d = FACTION_DATA[id];
            if (!s.joined || s.stage !== 1 || d.objectiveType !== "gold")
                continue;
            s.progress = Math.min(gold, d.objectiveCount);
            if (gold >= d.objectiveCount) {
                s.stage = 2;
                msgs.push(`${d.name}: objective complete — report to ${d.recruiter}.`);
            }
        }
        return msgs;
    }
    /** Promote (turn in) a faction whose objective is met. */
    promote(id) {
        const s = this.state[id];
        s.stage = 3;
        s.rank = Math.min(s.rank + 1, FACTION_DATA[id].ranks.length - 1);
    }
    rankTitle(id) {
        return FACTION_DATA[id].ranks[this.state[id].rank] ?? FACTION_DATA[id].ranks[0];
    }
    /** Whether a mechanic/spell unlock has been earned (faction promoted). */
    hasUnlock(unlock) {
        return FACTION_IDS.some((id) => FACTION_DATA[id].unlock === unlock && this.isPromoted(id));
    }
    /** Passive stat bonuses from membership, merged into derived stats. */
    passiveModifiers() {
        const m = {};
        const add = (k, v) => {
            m[k] = (m[k] ?? 0) + v;
        };
        if (this.isJoined("legion"))
            add("armorRating", 25);
        if (this.isJoined("stormcloaks"))
            add("health", 25);
        if (this.isJoined("companions"))
            add("stamina", 20);
        if (this.isJoined("college")) {
            add("magicka", 30);
            add("magickaRegen", 3);
        }
        if (this.isJoined("thievesGuild"))
            add("stamina", 20);
        if (this.isJoined("darkBrotherhood")) {
            add("health", 10);
            add("stamina", 10);
        }
        if (this.isJoined("blades")) {
            add("armorRating", 20);
            add("health", 15);
        }
        if (this.isJoined("bards")) {
            add("magicka", 10);
            add("magickaRegen", 2);
            add("stamina", 10);
        }
        return m;
    }
    /** Bonus to the sneak-attack multiplier once the Dark Brotherhood honors you. */
    sneakAttackBonus() {
        return this.isPromoted("darkBrotherhood") ? 1.5 : 0;
    }
    /** Loot-gold multiplier — the Thieves Guild teaches you where the coin hides. */
    goldFindMult() {
        return this.isJoined("thievesGuild") ? 1.5 : 1;
    }
    toJSON() {
        return { state: structuredClone(this.state) };
    }
    load(save) {
        for (const id of FACTION_IDS)
            this.state[id] = save.state?.[id] ?? fresh();
    }
}
//# sourceMappingURL=Factions.js.map