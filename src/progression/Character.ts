import { findPerk, type PerkEffect, SKILL_IDS, SKILLS, type SkillId } from "./skills.js";

export type AttributeId = "health" | "magicka" | "stamina";

export interface SkillState {
  level: number;
  /** Experience toward the next skill level. */
  xp: number;
}

/** Bonuses contributed by equipment & temporary effects; recomputed on change. */
export interface DerivedModifiers {
  health: number;
  magicka: number;
  stamina: number;
  armorRating: number;
  healthRegen: number;
  magickaRegen: number;
  staminaRegen: number;
}

/** Plain serializable snapshot of a character (for the save system). */
export interface CharacterSave {
  characterLevel: number;
  characterXp: number;
  perkPoints: number;
  attributePoints: number;
  attributes: Record<AttributeId, number>;
  skills: Record<SkillId, SkillState>;
  unlockedPerks: string[];
  hp: number;
  mp: number;
  sp: number;
}

/** Something noteworthy that happened during {@link Character.gainSkillXp}. */
export interface ProgressEvent {
  skill?: { id: SkillId; level: number };
  characterLevel?: number;
}

// --- Tuning ---------------------------------------------------------------
const BASE_POOL = 100; // health/magicka/stamina each start at 100
const PER_ATTRIBUTE = 10; // each allocated attribute point adds this to its pool
const emptyMods = (): DerivedModifiers => ({
  health: 0,
  magicka: 0,
  stamina: 0,
  armorRating: 0,
  healthRegen: 1, // base out-of-combat regen, per second
  magickaRegen: 5,
  staminaRegen: 12,
});

/** XP required to advance a skill from `level` to `level + 1`. */
export function skillXpToNext(level: number): number {
  return 20 + level * 10;
}
/** Skill-level-ups required to advance the character from `level` to `level+1`. */
export function charXpToNext(level: number): number {
  return 3 + level;
}

/**
 * The player's progression sheet: attributes, the three resource pools, and the
 * use-to-level skill/perk machinery. Knows nothing about combat or items — other
 * systems call {@link gainSkillXp} when a skill is used and read the perk/stat
 * helpers. Equipment feeds in through {@link applyModifiers}.
 */
export class Character {
  characterLevel = 1;
  characterXp = 0; // counts skill-level-ups toward the next character level
  perkPoints = 0;
  attributePoints = 0;

  attributes: Record<AttributeId, number> = { health: 0, magicka: 0, stamina: 0 };
  skills: Record<SkillId, SkillState>;
  unlockedPerks = new Set<string>();

  hp: number;
  mp: number;
  sp: number;

  /** Transient outgoing-damage multiplier (e.g. Companions' Beast Form). */
  outgoingDamageMult = 1;
  /** Extra sneak-attack multiplier (Dark Brotherhood). Set from faction state. */
  sneakAttackBonus = 0;

  private mods: DerivedModifiers = emptyMods();
  /** Temporary armor from buff spells (e.g. Oakflesh). */
  private buffArmor = 0;
  private buffTimer = 0;

  constructor() {
    this.skills = {} as Record<SkillId, SkillState>;
    for (const id of SKILL_IDS) this.skills[id] = { level: 5, xp: 0 };
    this.hp = this.maxHealth;
    this.mp = this.maxMagicka;
    this.sp = this.maxStamina;
  }

  get maxHealth(): number {
    return BASE_POOL + this.attributes.health * PER_ATTRIBUTE + this.mods.health;
  }
  get maxMagicka(): number {
    return BASE_POOL + this.attributes.magicka * PER_ATTRIBUTE + this.mods.magicka;
  }
  get maxStamina(): number {
    return BASE_POOL + this.attributes.stamina * PER_ATTRIBUTE + this.mods.stamina;
  }
  get armorRating(): number {
    return this.mods.armorRating + this.buffArmor;
  }

  /** Add a temporary armor buff (replacing any weaker active one). */
  addArmorBuff(amount: number, seconds: number): void {
    this.buffArmor = Math.max(this.buffArmor, amount);
    this.buffTimer = seconds;
  }

  /** Tick down temporary buffs. */
  updateBuffs(dt: number): void {
    if (this.buffTimer > 0) {
      this.buffTimer -= dt;
      if (this.buffTimer <= 0) this.buffArmor = 0;
    }
  }

  /** Replace equipment/effect modifiers and re-clamp the pools to new maxima. */
  applyModifiers(mods: DerivedModifiers): void {
    this.mods = mods;
    this.hp = Math.min(this.hp, this.maxHealth);
    this.mp = Math.min(this.mp, this.maxMagicka);
    this.sp = Math.min(this.sp, this.maxStamina);
  }

  /** Regenerate resource pools over time. */
  regen(dt: number): void {
    this.hp = Math.min(this.maxHealth, this.hp + this.mods.healthRegen * dt);
    this.mp = Math.min(this.maxMagicka, this.mp + this.mods.magickaRegen * dt);
    this.sp = Math.min(this.maxStamina, this.sp + this.mods.staminaRegen * dt);
  }

  /**
   * Award experience to a skill from *using* it. Cascades into skill level-ups
   * and, via those, character level-ups. Returns the notable events for the HUD.
   */
  gainSkillXp(id: SkillId, amount: number): ProgressEvent[] {
    const events: ProgressEvent[] = [];
    const s = this.skills[id];
    s.xp += amount;
    while (s.level < 100 && s.xp >= skillXpToNext(s.level)) {
      s.xp -= skillXpToNext(s.level);
      s.level += 1;
      events.push({ skill: { id, level: s.level } });
      // Each skill level-up nudges the character toward the next level.
      this.characterXp += 1;
      while (this.characterXp >= charXpToNext(this.characterLevel)) {
        this.characterXp -= charXpToNext(this.characterLevel);
        this.characterLevel += 1;
        this.perkPoints += 1;
        this.attributePoints += 1;
        events.push({ characterLevel: this.characterLevel });
      }
    }
    return events;
  }

  /** Spend an attribute point, raising one pool and topping it off. */
  allocateAttribute(attr: AttributeId): boolean {
    if (this.attributePoints <= 0) return false;
    this.attributes[attr] += 1;
    this.attributePoints -= 1;
    // Top off the boosted pool by the gain so the increase is felt immediately.
    if (attr === "health") this.hp += PER_ATTRIBUTE;
    if (attr === "magicka") this.mp += PER_ATTRIBUTE;
    if (attr === "stamina") this.sp += PER_ATTRIBUTE;
    return true;
  }

  /** Whether a perk can currently be purchased. */
  canUnlock(perkId: string): boolean {
    if (this.perkPoints <= 0 || this.unlockedPerks.has(perkId)) return false;
    const node = findPerk(perkId);
    if (!node) return false;
    const skillId = this.skillOfPerk(perkId);
    if (!skillId || this.skills[skillId].level < node.reqLevel) return false;
    if (node.requires?.some((r) => !this.unlockedPerks.has(r))) return false;
    return true;
  }

  /** Purchase a perk node, spending one perk point. */
  unlockPerk(perkId: string): boolean {
    if (!this.canUnlock(perkId)) return false;
    this.unlockedPerks.add(perkId);
    this.perkPoints -= 1;
    return true;
  }

  /** Sum the value of all unlocked perks of `skillId` whose effect is `kind`. */
  perkBonus(skillId: SkillId, kind: PerkEffect["kind"]): number {
    let sum = 0;
    for (const p of SKILLS[skillId].perks) {
      if (this.unlockedPerks.has(p.id) && p.effect?.kind === kind) sum += p.effect.value;
    }
    return sum;
  }

  /** Total flat carry-weight bonus from all unlocked perks. */
  carryWeightBonus(): number {
    let sum = 0;
    for (const id of SKILL_IDS) sum += this.perkBonus(id, "carryWeight");
    return sum;
  }

  private skillOfPerk(perkId: string): SkillId | undefined {
    return SKILL_IDS.find((id) => SKILLS[id].perks.some((p) => p.id === perkId));
  }

  // --- Serialization ------------------------------------------------------

  toJSON(): CharacterSave {
    return {
      characterLevel: this.characterLevel,
      characterXp: this.characterXp,
      perkPoints: this.perkPoints,
      attributePoints: this.attributePoints,
      attributes: { ...this.attributes },
      skills: structuredClone(this.skills),
      unlockedPerks: [...this.unlockedPerks],
      hp: this.hp,
      mp: this.mp,
      sp: this.sp,
    };
  }

  load(save: CharacterSave): void {
    this.characterLevel = save.characterLevel;
    this.characterXp = save.characterXp;
    this.perkPoints = save.perkPoints;
    this.attributePoints = save.attributePoints;
    this.attributes = { ...save.attributes };
    for (const id of SKILL_IDS) {
      if (save.skills[id]) this.skills[id] = { ...save.skills[id] };
    }
    this.unlockedPerks = new Set(save.unlockedPerks);
    this.hp = save.hp;
    this.mp = save.mp;
    this.sp = save.sp;
  }
}
