/**
 * Item data model. Items are plain JSON-serializable objects (no behavior), so
 * they drop straight into the inventory, equipment, and save systems. Loot is
 * assembled from a base template plus optional random prefix/suffix and
 * enchantments (see loot.ts).
 */

export enum ItemType {
  Weapon = "Weapon",
  Armor = "Armor",
  Jewelry = "Jewelry",
  Consumable = "Consumable",
  Ingredient = "Ingredient",
  Misc = "Misc",
}

export enum EquipSlot {
  Head = "Head",
  Chest = "Chest",
  Hands = "Hands",
  Feet = "Feet",
  Shield = "Shield",
  MainHand = "Main-Hand",
  OffHand = "Off-Hand",
  Ring = "Ring",
  Necklace = "Necklace",
}

/** Ordered list of all equipment slots (for menu rendering). */
export const EQUIP_SLOTS: EquipSlot[] = [
  EquipSlot.Head,
  EquipSlot.Chest,
  EquipSlot.Hands,
  EquipSlot.Feet,
  EquipSlot.Shield,
  EquipSlot.MainHand,
  EquipSlot.OffHand,
  EquipSlot.Ring,
  EquipSlot.Necklace,
];

export type WeaponClass = "oneHanded" | "twoHanded" | "bow";
export type ArmorType = "light" | "heavy";

/** A stat an enchantment can fortify. Maps onto Character derived modifiers. */
export type EnchantStat =
  | "health"
  | "magicka"
  | "stamina"
  | "armorRating"
  | "healthRegen"
  | "magickaRegen"
  | "staminaRegen"
  | "fireDamage";

export interface Enchantment {
  stat: EnchantStat;
  magnitude: number;
}

export interface Item {
  /** Unique per-instance id. */
  uid: string;
  /** Template id this item was built from. */
  baseId: string;
  name: string;
  type: ItemType;
  weight: number;
  value: number;

  slot?: EquipSlot;
  weaponClass?: WeaponClass;
  armorType?: ArmorType;
  /** Base weapon damage (weapons only). */
  damage?: number;
  /** Base armor rating (armor pieces only). */
  armor?: number;

  prefix?: string;
  suffix?: string;
  enchantments: Enchantment[];

  /** Consumables (potions) stack; equipment does not. */
  stackable?: boolean;
  quantity?: number;
  /** For consumables: what drinking it does. */
  effect?: { stat: "hp" | "mp" | "sp"; magnitude: number };
}

let uidCounter = 0;
/** Generate a unique instance id for a new item. */
export function newUid(): string {
  uidCounter += 1;
  return `i${uidCounter}_${Math.floor(Math.random() * 1e6).toString(36)}`;
}

/** Human-readable display name: "Sturdy Iron Sword of Flames". */
export function itemDisplayName(item: Item): string {
  return [item.prefix, item.name, item.suffix].filter(Boolean).join(" ");
}

/** Which skill governs a weapon, for use-to-level XP and damage scaling. */
export function weaponSkillOf(
  item: Item | null,
): "oneHanded" | "twoHanded" | "archery" {
  switch (item?.weaponClass) {
    case "twoHanded":
      return "twoHanded";
    case "bow":
      return "archery";
    default:
      return "oneHanded"; // unarmed / one-handed default
  }
}
