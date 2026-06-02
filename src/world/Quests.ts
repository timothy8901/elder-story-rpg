export interface QuestSave {
  flags: Record<string, number>;
  enemiesSlain: number;
}

/** A scripted quest with a completion threshold. */
interface QuestDef {
  id: string;
  name: string;
  target: number;
}

const QUESTS: QuestDef[] = [{ id: "cull", name: "Cull the Wilds", target: 5 }];

/**
 * Minimal quest + world-state tracker. Stores arbitrary named flags (for world
 * changes like "visited the cave") and drives a simple slay-count quest. All
 * state is plain numbers/booleans so it serializes directly into the save.
 */
export class QuestLog {
  flags: Record<string, number> = {};
  enemiesSlain = 0;

  setFlag(name: string, value = 1): void {
    this.flags[name] = value;
  }
  getFlag(name: string): number {
    return this.flags[name] ?? 0;
  }

  /** Record a kill; returns a completion message when a quest threshold is met. */
  onEnemySlain(): string | null {
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
  activeQuestStatus(): string {
    const q = QUESTS[0]!;
    if (this.getFlag(`quest_${q.id}`)) return `${q.name}: complete`;
    return `${q.name}: ${Math.min(this.enemiesSlain, q.target)}/${q.target}`;
  }

  toJSON(): QuestSave {
    return { flags: { ...this.flags }, enemiesSlain: this.enemiesSlain };
  }
  load(save: QuestSave): void {
    this.flags = { ...save.flags };
    this.enemiesSlain = save.enemiesSlain;
  }
}
