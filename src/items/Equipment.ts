import type { Character, DerivedModifiers } from "../progression/Character.js";
import { EQUIP_SLOTS, EquipSlot, type Item, weaponSkillOf } from "./Item.js";

/**
 * The nine worn equipment slots. Equipping recomputes nothing on its own — the
 * owner calls {@link modifiers} after any change and feeds the result into
 * {@link Character.applyModifiers}, so stat changes are immediate.
 */
export class Equipment {
  slots: Record<EquipSlot, Item | null>;

  constructor() {
    this.slots = {} as Record<EquipSlot, Item | null>;
    for (const slot of EQUIP_SLOTS) this.slots[slot] = null;
  }

  /** Equip an item into its slot, returning whatever was displaced (or null). */
  equip(item: Item): Item | null {
    if (!item.slot) return null;
    const prev = this.slots[item.slot];
    this.slots[item.slot] = item;
    return prev;
  }

  unequip(slot: EquipSlot): Item | null {
    const prev = this.slots[slot];
    this.slots[slot] = null;
    return prev;
  }

  isEquipped(uid: string): boolean {
    return EQUIP_SLOTS.some((s) => this.slots[s]?.uid === uid);
  }

  get mainHand(): Item | null {
    return this.slots[EquipSlot.MainHand];
  }

  /** The skill that governs the equipped main-hand weapon. */
  weaponSkill(): "oneHanded" | "twoHanded" | "archery" {
    return weaponSkillOf(this.mainHand);
  }

  /** Effective weapon damage: base × skill scaling × perk multipliers. */
  weaponDamage(character: Character): number {
    const w = this.mainHand;
    const base = w?.damage ?? 4; // unarmed fallback
    const skill = this.weaponSkill();
    const skillScale = 1 + character.skills[skill].level / 200; // up to +50% at 100
    const perkMult = 1 + character.perkBonus(skill, "damageMult");
    return base * skillScale * perkMult;
  }

  /** Bonus elemental damage from a weapon enchantment (e.g. of Flames). */
  weaponFireDamage(): number {
    const w = this.mainHand;
    if (!w) return 0;
    return w.enchantments
      .filter((e) => e.stat === "fireDamage")
      .reduce((s, e) => s + e.magnitude, 0);
  }

  /**
   * Aggregate all worn gear into derived modifiers. Armor rating scales with the
   * relevant armor skill (so taking hits while armored improves protection),
   * and enchantments fortify the resource pools / regen.
   */
  modifiers(character: Character): DerivedModifiers {
    const mods: DerivedModifiers = {
      health: 0,
      magicka: 0,
      stamina: 0,
      armorRating: 0,
      healthRegen: 1,
      magickaRegen: 5,
      staminaRegen: 12,
    };

    for (const slot of EQUIP_SLOTS) {
      const item = this.slots[slot];
      if (!item) continue;

      if (item.armor != null && item.armorType) {
        const skillId = item.armorType === "heavy" ? "heavyArmor" : "lightArmor";
        const skillScale = 1 + character.skills[skillId].level / 100; // up to +100%
        const perkMult = 1 + character.perkBonus(skillId, "armorMult");
        mods.armorRating += item.armor * skillScale * perkMult;
      }

      for (const e of item.enchantments) {
        switch (e.stat) {
          case "health":
            mods.health += e.magnitude;
            break;
          case "magicka":
            mods.magicka += e.magnitude;
            break;
          case "stamina":
            mods.stamina += e.magnitude;
            break;
          case "armorRating":
            mods.armorRating += e.magnitude;
            break;
          case "healthRegen":
            mods.healthRegen += e.magnitude;
            break;
          case "magickaRegen":
            mods.magickaRegen += e.magnitude;
            break;
          case "staminaRegen":
            mods.staminaRegen += e.magnitude;
            break;
          case "fireDamage":
            break; // applied to weapon hits, not worn stats
        }
      }
    }

    mods.armorRating = Math.round(mods.armorRating);
    return mods;
  }

  // --- Serialization ------------------------------------------------------

  toJSON(): Record<string, Item | null> {
    return structuredClone(this.slots);
  }

  load(save: Record<string, Item | null>): void {
    for (const slot of EQUIP_SLOTS) {
      this.slots[slot] = (save[slot] as Item | null) ?? null;
    }
  }
}
