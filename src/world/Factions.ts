import type { DerivedModifiers } from "../progression/Character.js";
import { FACTION_DATA, FACTION_IDS, type FactionId, type FactionUnlock } from "./factionData.js";

/**
 * Per-faction membership state.
 * - `stage`: 0 not joined · 1 objective in progress · 2 objective met (turn in)
 *   · 3 promoted/complete.
 * - `rival`: locked out because the player chose the opposing civil-war faction.
 */
export interface FactionState {
  joined: boolean;
  rank: number;
  stage: number;
  progress: number;
  rival: boolean;
}

export interface FactionsSave {
  state: Record<FactionId, FactionState>;
}

const fresh = (): FactionState => ({ joined: false, rank: 0, stage: 0, progress: 0, rival: false });

/**
 * The player's standing with each faction and the small state machine that
 * drives the questlines. Mutually-exclusive civil-war factions (Legion vs.
 * Stormcloaks) lock each other out on join, which is the core "your choice
 * changes the game" mechanic; promotion grants passive stat bonuses and unlocks.
 */
export class Factions {
  state: Record<FactionId, FactionState>;

  constructor() {
    this.state = {} as Record<FactionId, FactionState>;
    for (const id of FACTION_IDS) this.state[id] = fresh();
  }

  get(id: FactionId): FactionState {
    return this.state[id];
  }
  isJoined(id: FactionId): boolean {
    return this.state[id].joined;
  }
  isPromoted(id: FactionId): boolean {
    return this.state[id].stage >= 3;
  }
  isRival(id: FactionId): boolean {
    return this.state[id].rival;
  }
  canJoin(id: FactionId): boolean {
    const s = this.state[id];
    return !s.joined && !s.rival;
  }

  /** Join a faction. Locks the rival civil-war faction. Returns false if barred. */
  join(id: FactionId): boolean {
    if (!this.canJoin(id)) return false;
    const s = this.state[id];
    s.joined = true;
    s.stage = 1;
    s.progress = 0;
    s.rank = 0;
    const rival = FACTION_DATA[id].rival;
    if (rival) this.state[rival].rival = true;
    return true;
  }

  /**
   * Advance questline objectives on an enemy kill. Returns any "objective
   * complete" messages for the HUD.
   */
  onKill(info: { bySpell: boolean; kind: string; sneaking: boolean; isDragon: boolean }): string[] {
    const msgs: string[] = [];
    for (const id of FACTION_IDS) {
      const s = this.state[id];
      if (!s.joined || s.stage !== 1) continue;
      const d = FACTION_DATA[id];
      let inc = 0;
      if (d.objectiveType === "kill") inc = 1;
      else if (d.objectiveType === "killSpell" && info.bySpell) inc = 1;
      else if (d.objectiveType === "killBoss" && info.kind === "Draugr Lord") inc = 1;
      else if (d.objectiveType === "sneakKill" && info.sneaking) inc = 1;
      else if (d.objectiveType === "dragonKill" && info.isDragon) inc = 1;
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
  checkGold(gold: number): string[] {
    const msgs: string[] = [];
    for (const id of FACTION_IDS) {
      const s = this.state[id];
      const d = FACTION_DATA[id];
      if (!s.joined || s.stage !== 1 || d.objectiveType !== "gold") continue;
      s.progress = Math.min(gold, d.objectiveCount);
      if (gold >= d.objectiveCount) {
        s.stage = 2;
        msgs.push(`${d.name}: objective complete — report to ${d.recruiter}.`);
      }
    }
    return msgs;
  }

  /** Promote (turn in) a faction whose objective is met. */
  promote(id: FactionId): void {
    const s = this.state[id];
    s.stage = 3;
    s.rank = Math.min(s.rank + 1, FACTION_DATA[id].ranks.length - 1);
  }

  rankTitle(id: FactionId): string {
    return FACTION_DATA[id].ranks[this.state[id].rank] ?? FACTION_DATA[id].ranks[0]!;
  }

  /** Whether a mechanic/spell unlock has been earned (faction promoted). */
  hasUnlock(unlock: FactionUnlock): boolean {
    return FACTION_IDS.some((id) => FACTION_DATA[id].unlock === unlock && this.isPromoted(id));
  }

  /** Passive stat bonuses from membership, merged into derived stats. */
  passiveModifiers(): Partial<DerivedModifiers> {
    const m: Partial<DerivedModifiers> = {};
    const add = (k: keyof DerivedModifiers, v: number) => {
      m[k] = (m[k] ?? 0) + v;
    };
    if (this.isJoined("legion")) add("armorRating", 25);
    if (this.isJoined("stormcloaks")) add("health", 25);
    if (this.isJoined("companions")) add("stamina", 20);
    if (this.isJoined("college")) {
      add("magicka", 30);
      add("magickaRegen", 3);
    }
    if (this.isJoined("thievesGuild")) add("stamina", 20);
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
  sneakAttackBonus(): number {
    return this.isPromoted("darkBrotherhood") ? 1.5 : 0;
  }

  /** Loot-gold multiplier — the Thieves Guild teaches you where the coin hides. */
  goldFindMult(): number {
    return this.isJoined("thievesGuild") ? 1.5 : 1;
  }

  toJSON(): FactionsSave {
    return { state: structuredClone(this.state) };
  }
  load(save: FactionsSave): void {
    for (const id of FACTION_IDS) this.state[id] = save.state?.[id] ?? fresh();
  }
}
