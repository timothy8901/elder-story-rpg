/**
 * Skill definitions — the Skyrim "use-to-level" backbone. Every skill is a node
 * in a modular structural array (here a keyed record) carrying its category and
 * a small perk tree. The 15 skills span three categories:
 *   Combat  : One-Handed, Two-Handed, Archery, Block, Light Armor, Heavy Armor
 *   Magic   : Destruction, Restoration, Conjuration, Illusion, Alteration
 *   Stealth/Crafting : Sneak, Alchemy, Smithing, Enchanting
 */

export enum SkillCategory {
  Combat = "Combat",
  Magic = "Magic",
  StealthCraft = "Stealth / Crafting",
}

export type SkillId =
  | "oneHanded"
  | "twoHanded"
  | "archery"
  | "block"
  | "lightArmor"
  | "heavyArmor"
  | "destruction"
  | "restoration"
  | "conjuration"
  | "illusion"
  | "alteration"
  | "sneak"
  | "alchemy"
  | "smithing"
  | "enchanting";

/**
 * A mechanical effect a perk grants once unlocked. `kind` is read by the system
 * that cares (combat, armor, spell cost, crafting); `value` is additive within
 * its kind and applied as a multiplier (e.g. 0.2 => +20%).
 */
export interface PerkEffect {
  kind:
    | "damageMult" // boosts damage of this perk's skill
    | "armorMult" // boosts armor rating contribution of this skill
    | "blockMult" // boosts blocked damage fraction
    | "spellCostMult" // reduces magicka cost (negative value = cheaper)
    | "potencyMult" // boosts spell/potion/enchant magnitude
    | "carryWeight"; // flat carry-weight bonus
  value: number;
}

export interface PerkNode {
  id: string;
  name: string;
  description: string;
  /** Skill level required before this perk can be purchased. */
  reqLevel: number;
  /** Perk ids that must already be unlocked. */
  requires?: string[];
  effect?: PerkEffect;
}

export interface SkillDef {
  id: SkillId;
  name: string;
  category: SkillCategory;
  description: string;
  perks: PerkNode[];
}

/** Helper to keep the definition table terse. */
function perk(
  id: string,
  name: string,
  reqLevel: number,
  description: string,
  effect?: PerkEffect,
  requires?: string[],
): PerkNode {
  return { id, name, reqLevel, description, effect, requires };
}

export const SKILLS: Record<SkillId, SkillDef> = {
  oneHanded: {
    id: "oneHanded",
    name: "One-Handed",
    category: SkillCategory.Combat,
    description: "Swords, axes and maces wielded in one hand.",
    perks: [
      perk("armsman", "Armsman", 0, "One-handed weapons do 20% more damage.", { kind: "damageMult", value: 0.2 }),
      perk("fighting_stance", "Fighting Stance", 25, "Power attacks cost less stamina (+20% damage).", { kind: "damageMult", value: 0.2 }, ["armsman"]),
      perk("savage_strike", "Savage Strike", 50, "Power attacks do 25% bonus damage.", { kind: "damageMult", value: 0.25 }, ["fighting_stance"]),
    ],
  },
  twoHanded: {
    id: "twoHanded",
    name: "Two-Handed",
    category: SkillCategory.Combat,
    description: "Greatswords, battleaxes and warhammers.",
    perks: [
      perk("barbarian", "Barbarian", 0, "Two-handed weapons do 25% more damage.", { kind: "damageMult", value: 0.25 }),
      perk("champions_stance", "Champion's Stance", 30, "Heavy swings land harder (+20% damage).", { kind: "damageMult", value: 0.2 }, ["barbarian"]),
      perk("devastating_blow", "Devastating Blow", 60, "Power attacks do 25% extra damage.", { kind: "damageMult", value: 0.25 }, ["champions_stance"]),
    ],
  },
  archery: {
    id: "archery",
    name: "Archery",
    category: SkillCategory.Combat,
    description: "Bows and arrows fired at range.",
    perks: [
      perk("overdraw", "Overdraw", 0, "Bows do 25% more damage.", { kind: "damageMult", value: 0.25 }),
      perk("eagle_eye", "Eagle Eye", 30, "Steadier aim improves damage 15%.", { kind: "damageMult", value: 0.15 }, ["overdraw"]),
      perk("power_shot", "Power Shot", 50, "Arrows stagger and deal 20% more.", { kind: "damageMult", value: 0.2 }, ["eagle_eye"]),
    ],
  },
  block: {
    id: "block",
    name: "Block",
    category: SkillCategory.Combat,
    description: "Deflecting blows with a shield or weapon.",
    perks: [
      perk("shield_wall", "Shield Wall", 0, "Blocking is 25% more effective.", { kind: "blockMult", value: 0.25 }),
      perk("deflect_arrows", "Deflect Arrows", 30, "Block 20% more incoming force.", { kind: "blockMult", value: 0.2 }, ["shield_wall"]),
    ],
  },
  lightArmor: {
    id: "lightArmor",
    name: "Light Armor",
    category: SkillCategory.Combat,
    description: "Hide, leather and elven armors.",
    perks: [
      perk("agile_defender", "Agile Defender", 0, "Light armor gives 25% more protection.", { kind: "armorMult", value: 0.25 }),
      perk("custom_fit", "Custom Fit", 30, "Worn light armor protects 20% more.", { kind: "armorMult", value: 0.2 }, ["agile_defender"]),
    ],
  },
  heavyArmor: {
    id: "heavyArmor",
    name: "Heavy Armor",
    category: SkillCategory.Combat,
    description: "Iron, steel and plate armors.",
    perks: [
      perk("juggernaut", "Juggernaut", 0, "Heavy armor gives 25% more protection.", { kind: "armorMult", value: 0.25 }),
      perk("well_fitted", "Well Fitted", 30, "Worn heavy armor protects 20% more.", { kind: "armorMult", value: 0.2 }, ["juggernaut"]),
    ],
  },
  destruction: {
    id: "destruction",
    name: "Destruction",
    category: SkillCategory.Magic,
    description: "Fire, frost and shock damage spells.",
    perks: [
      perk("novice_destruction", "Novice Destruction", 0, "Destruction spells cost 30% less.", { kind: "spellCostMult", value: -0.3 }),
      perk("augmented_flames", "Augmented Flames", 30, "Destruction spells do 25% more.", { kind: "potencyMult", value: 0.25 }, ["novice_destruction"]),
      perk("intense_flames", "Intense Flames", 60, "Spells deal a further 25%.", { kind: "potencyMult", value: 0.25 }, ["augmented_flames"]),
    ],
  },
  restoration: {
    id: "restoration",
    name: "Restoration",
    category: SkillCategory.Magic,
    description: "Healing and warding magic.",
    perks: [
      perk("novice_restoration", "Novice Restoration", 0, "Restoration spells cost 30% less.", { kind: "spellCostMult", value: -0.3 }),
      perk("regeneration", "Regeneration", 30, "Healing spells are 25% stronger.", { kind: "potencyMult", value: 0.25 }, ["novice_restoration"]),
    ],
  },
  conjuration: {
    id: "conjuration",
    name: "Conjuration",
    category: SkillCategory.Magic,
    description: "Summoning bound weapons and allies.",
    perks: [
      perk("novice_conjuration", "Novice Conjuration", 0, "Conjuration spells cost 30% less.", { kind: "spellCostMult", value: -0.3 }),
      perk("mystic_binding", "Mystic Binding", 30, "Bound weapons hit 25% harder.", { kind: "potencyMult", value: 0.25 }, ["novice_conjuration"]),
    ],
  },
  illusion: {
    id: "illusion",
    name: "Illusion",
    category: SkillCategory.Magic,
    description: "Fear, calm and frenzy effects.",
    perks: [
      perk("novice_illusion", "Novice Illusion", 0, "Illusion spells cost 30% less.", { kind: "spellCostMult", value: -0.3 }),
      perk("hypnotic_gaze", "Hypnotic Gaze", 30, "Illusion effects are 25% stronger.", { kind: "potencyMult", value: 0.25 }, ["novice_illusion"]),
    ],
  },
  alteration: {
    id: "alteration",
    name: "Alteration",
    category: SkillCategory.Magic,
    description: "Magical armor and manipulation.",
    perks: [
      perk("novice_alteration", "Novice Alteration", 0, "Alteration spells cost 30% less.", { kind: "spellCostMult", value: -0.3 }),
      perk("mage_armor", "Mage Armor", 30, "Flesh spells give 25% more armor.", { kind: "potencyMult", value: 0.25 }, ["novice_alteration"]),
    ],
  },
  sneak: {
    id: "sneak",
    name: "Sneak",
    category: SkillCategory.StealthCraft,
    description: "Moving unseen and striking from shadow.",
    perks: [
      perk("stealth", "Stealth", 0, "You are 25% harder to detect.", { kind: "potencyMult", value: 0.25 }),
      perk("deadly_aim", "Deadly Aim", 40, "Sneak attacks do 50% more damage.", { kind: "damageMult", value: 0.5 }, ["stealth"]),
    ],
  },
  alchemy: {
    id: "alchemy",
    name: "Alchemy",
    category: SkillCategory.StealthCraft,
    description: "Brewing potions and poisons.",
    perks: [
      perk("alchemist", "Alchemist", 0, "Potions you mix are 20% stronger.", { kind: "potencyMult", value: 0.2 }),
      perk("physician", "Physician", 40, "Healing potions are 25% stronger.", { kind: "potencyMult", value: 0.25 }, ["alchemist"]),
    ],
  },
  smithing: {
    id: "smithing",
    name: "Smithing",
    category: SkillCategory.StealthCraft,
    description: "Forging and improving gear.",
    perks: [
      perk("craftsmanship", "Craftsmanship", 0, "Improve weapons & armor 25% more.", { kind: "potencyMult", value: 0.25 }),
      perk("carry_smith", "Pack Mule", 40, "Carry 25 more weight.", { kind: "carryWeight", value: 25 }, ["craftsmanship"]),
    ],
  },
  enchanting: {
    id: "enchanting",
    name: "Enchanting",
    category: SkillCategory.StealthCraft,
    description: "Binding magical effects to gear.",
    perks: [
      perk("enchanter", "Enchanter", 0, "New enchantments are 20% stronger.", { kind: "potencyMult", value: 0.2 }),
      perk("insightful_enchanter", "Insightful Enchanter", 40, "Skill enchantments are 25% stronger.", { kind: "potencyMult", value: 0.25 }, ["enchanter"]),
    ],
  },
};

/** Stable ordered list of every skill id. */
export const SKILL_IDS = Object.keys(SKILLS) as SkillId[];

/** Skills grouped by category, in declaration order — for menu rendering. */
export const SKILLS_BY_CATEGORY: Record<SkillCategory, SkillDef[]> = {
  [SkillCategory.Combat]: [],
  [SkillCategory.Magic]: [],
  [SkillCategory.StealthCraft]: [],
};
for (const id of SKILL_IDS) {
  const def = SKILLS[id];
  SKILLS_BY_CATEGORY[def.category].push(def);
}

/** Look up a single perk node by its id (searches all skills). */
export function findPerk(perkId: string): PerkNode | undefined {
  for (const id of SKILL_IDS) {
    const found = SKILLS[id].perks.find((p) => p.id === perkId);
    if (found) return found;
  }
  return undefined;
}
