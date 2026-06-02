const QUESTS = [{ id: "cull", name: "Cull the Wilds", target: 5 }];
/**
 * Minimal quest + world-state tracker. Stores arbitrary named flags (for world
 * changes like "visited the cave") and drives a simple slay-count quest. All
 * state is plain numbers/booleans so it serializes directly into the save.
 */
export class QuestLog {
    constructor() {
        this.flags = {};
        this.enemiesSlain = 0;
    }
    setFlag(name, value = 1) {
        this.flags[name] = value;
    }
    getFlag(name) {
        return this.flags[name] ?? 0;
    }
    /** Record a kill; returns a completion message when a quest threshold is met. */
    onEnemySlain() {
        this.enemiesSlain += 1;
        for (const q of QUESTS) {
            if (this.enemiesSlain === q.target && !this.getFlag(`quest_${q.id}`)) {
                this.setFlag(`quest_${q.id}`);
                return `Quest complete: ${q.name}!`;
            }
        }
        return null;
    }
    /** Human-readable progress for the active quest (for the HUD/menu). */
    activeQuestStatus() {
        const q = QUESTS[0];
        if (this.getFlag(`quest_${q.id}`))
            return `${q.name}: complete`;
        return `${q.name}: ${Math.min(this.enemiesSlain, q.target)}/${q.target}`;
    }
    toJSON() {
        return { flags: { ...this.flags }, enemiesSlain: this.enemiesSlain };
    }
    load(save) {
        this.flags = { ...save.flags };
        this.enemiesSlain = save.enemiesSlain;
    }
}
//# sourceMappingURL=Quests.js.map