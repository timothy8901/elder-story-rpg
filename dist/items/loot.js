import { EquipSlot, ItemType, newUid, } from "./Item.js";
const BASES = [
    // Weapons
    { baseId: "iron_sword", name: "Iron Sword", type: ItemType.Weapon, slot: EquipSlot.MainHand, weaponClass: "oneHanded", damage: 7, weight: 9, value: 25 },
    { baseId: "steel_greatsword", name: "Steel Greatsword", type: ItemType.Weapon, slot: EquipSlot.MainHand, weaponClass: "twoHanded", damage: 15, weight: 17, value: 90 },
    { baseId: "hunting_bow", name: "Hunting Bow", type: ItemType.Weapon, slot: EquipSlot.MainHand, weaponClass: "bow", damage: 7, weight: 7, value: 50 },
    { baseId: "iron_dagger", name: "Iron Dagger", type: ItemType.Weapon, slot: EquipSlot.MainHand, weaponClass: "oneHanded", damage: 4, weight: 2, value: 10 },
    // Armor — light
    { baseId: "leather_helmet", name: "Leather Helmet", type: ItemType.Armor, slot: EquipSlot.Head, armorType: "light", armor: 12, weight: 2, value: 35 },
    { baseId: "leather_armor", name: "Leather Armor", type: ItemType.Armor, slot: EquipSlot.Chest, armorType: "light", armor: 26, weight: 6, value: 75 },
    { baseId: "leather_bracers", name: "Leather Bracers", type: ItemType.Armor, slot: EquipSlot.Hands, armorType: "light", armor: 10, weight: 2, value: 30 },
    { baseId: "leather_boots", name: "Leather Boots", type: ItemType.Armor, slot: EquipSlot.Feet, armorType: "light", armor: 10, weight: 2, value: 30 },
    // Armor — heavy
    { baseId: "iron_helmet", name: "Iron Helmet", type: ItemType.Armor, slot: EquipSlot.Head, armorType: "heavy", armor: 17, weight: 5, value: 60 },
    { baseId: "iron_armor", name: "Iron Armor", type: ItemType.Armor, slot: EquipSlot.Chest, armorType: "heavy", armor: 35, weight: 30, value: 125 },
    { baseId: "iron_shield", name: "Iron Shield", type: ItemType.Armor, slot: EquipSlot.Shield, armorType: "heavy", armor: 20, weight: 12, value: 60 },
    // Jewelry
    { baseId: "silver_ring", name: "Silver Ring", type: ItemType.Jewelry, slot: EquipSlot.Ring, weight: 0, value: 40 },
    { baseId: "silver_necklace", name: "Silver Necklace", type: ItemType.Jewelry, slot: EquipSlot.Necklace, weight: 0, value: 60 },
    // Consumables
    { baseId: "potion_health", name: "Potion of Healing", type: ItemType.Consumable, weight: 0.5, value: 30, effect: { stat: "hp", magnitude: 60 } },
    { baseId: "potion_magicka", name: "Potion of Magicka", type: ItemType.Consumable, weight: 0.5, value: 30, effect: { stat: "mp", magnitude: 60 } },
    { baseId: "potion_stamina", name: "Potion of Stamina", type: ItemType.Consumable, weight: 0.5, value: 25, effect: { stat: "sp", magnitude: 60 } },
    // Faction reward gear (granted on promotion; not in the random drop pool below).
    { baseId: "imperial_sword", name: "Imperial Sword", type: ItemType.Weapon, slot: EquipSlot.MainHand, weaponClass: "oneHanded", damage: 10, weight: 9, value: 110 },
    { baseId: "imperial_helmet", name: "Imperial Helmet", type: ItemType.Armor, slot: EquipSlot.Head, armorType: "heavy", armor: 18, weight: 5, value: 85 },
    { baseId: "stormcloak_axe", name: "Stormcloak War Axe", type: ItemType.Weapon, slot: EquipSlot.MainHand, weaponClass: "oneHanded", damage: 11, weight: 11, value: 120 },
    { baseId: "stormcloak_cuirass", name: "Stormcloak Cuirass", type: ItemType.Armor, slot: EquipSlot.Chest, armorType: "heavy", armor: 32, weight: 28, value: 135 },
    { baseId: "skyforge_sword", name: "Skyforge Steel Sword", type: ItemType.Weapon, slot: EquipSlot.MainHand, weaponClass: "oneHanded", damage: 13, weight: 9, value: 200, enchantments: [{ stat: "fireDamage", magnitude: 6 }] },
    { baseId: "college_robes", name: "College Robes", type: ItemType.Armor, slot: EquipSlot.Chest, armorType: "light", armor: 8, weight: 3, value: 160, enchantments: [{ stat: "magicka", magnitude: 40 }, { stat: "magickaRegen", magnitude: 4 }] },
    // Thieves Guild
    { baseId: "nightingale_blade", name: "Nightingale Blade", type: ItemType.Weapon, slot: EquipSlot.MainHand, weaponClass: "oneHanded", damage: 14, weight: 9, value: 250, enchantments: [{ stat: "fireDamage", magnitude: 8 }] },
    { baseId: "thieves_armor", name: "Thieves Guild Armor", type: ItemType.Armor, slot: EquipSlot.Chest, armorType: "light", armor: 14, weight: 6, value: 190, enchantments: [{ stat: "stamina", magnitude: 25 }] },
    // Dark Brotherhood
    { baseId: "blade_of_woe", name: "Blade of Woe", type: ItemType.Weapon, slot: EquipSlot.MainHand, weaponClass: "oneHanded", damage: 16, weight: 6, value: 300 },
    { baseId: "shrouded_armor", name: "Shrouded Armor", type: ItemType.Armor, slot: EquipSlot.Chest, armorType: "light", armor: 12, weight: 4, value: 210, enchantments: [{ stat: "stamina", magnitude: 20 }] },
    // The Blades
    { baseId: "akaviri_katana", name: "Akaviri Katana", type: ItemType.Weapon, slot: EquipSlot.MainHand, weaponClass: "oneHanded", damage: 16, weight: 10, value: 280, enchantments: [{ stat: "fireDamage", magnitude: 6 }] },
    { baseId: "blades_armor", name: "Blades Armor", type: ItemType.Armor, slot: EquipSlot.Chest, armorType: "heavy", armor: 34, weight: 30, value: 220 },
    // Bards College
    { baseId: "lute", name: "Fine Lute", type: ItemType.Weapon, slot: EquipSlot.MainHand, weaponClass: "oneHanded", damage: 4, weight: 3, value: 90 },
    { baseId: "amulet_of_tales", name: "Amulet of Tales", type: ItemType.Jewelry, slot: EquipSlot.Necklace, weight: 0.5, value: 200, enchantments: [{ stat: "magicka", magnitude: 35 }, { stat: "magickaRegen", magnitude: 3 }] },
];
/** Base ids that are quest rewards, excluded from the random loot pool. */
const REWARD_ONLY = new Set([
    "imperial_sword",
    "imperial_helmet",
    "stormcloak_axe",
    "stormcloak_cuirass",
    "skyforge_sword",
    "college_robes",
    "nightingale_blade",
    "thieves_armor",
    "blade_of_woe",
    "shrouded_armor",
    "akaviri_katana",
    "blades_armor",
    "lute",
    "amulet_of_tales",
]);
/** Prefixes scale base damage/armor. */
const PREFIXES = [
    { word: "Sturdy", mult: 1.15 },
    { word: "Honed", mult: 1.25 },
    { word: "Fine", mult: 1.4 },
    { word: "Exquisite", mult: 1.6 },
];
/** Suffixes attach an enchantment (stat + magnitude). */
const SUFFIXES = [
    { word: "of Flames", stat: "fireDamage", magnitude: 8 },
    { word: "of Health", stat: "health", magnitude: 20 },
    { word: "of the Mage", stat: "magicka", magnitude: 20 },
    { word: "of Vigor", stat: "stamina", magnitude: 20 },
    { word: "of Warding", stat: "armorRating", magnitude: 25 },
    { word: "of Regeneration", stat: "healthRegen", magnitude: 2 },
];
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const chance = (p) => Math.random() < p;
/** Instantiate a specific base template by id (no random affixes). */
export function makeItem(baseId) {
    const base = BASES.find((b) => b.baseId === baseId) ?? BASES[0];
    return buildItem(base, [], []);
}
/**
 * Roll a random item. Higher `level` raises the odds (and strength) of affixes.
 */
export function generateLoot(level = 1) {
    const base = pick(BASES.filter((b) => !REWARD_ONLY.has(b.baseId)));
    const canEnchant = base.type === ItemType.Weapon || base.type === ItemType.Armor || base.type === ItemType.Jewelry;
    const prefixes = [];
    const suffixes = [];
    if (base.damage != null || base.armor != null) {
        if (chance(0.35 + level * 0.03))
            prefixes.push(pick(PREFIXES));
    }
    if (canEnchant && chance(0.3 + level * 0.03))
        suffixes.push(pick(SUFFIXES));
    return buildItem(base, prefixes, suffixes);
}
function buildItem(base, prefixes, suffixes) {
    const prefixMult = prefixes.reduce((m, p) => m * p.mult, 1);
    const item = {
        uid: newUid(),
        baseId: base.baseId,
        name: base.name,
        type: base.type,
        weight: base.weight,
        value: base.value,
        slot: base.slot,
        weaponClass: base.weaponClass,
        armorType: base.armorType,
        enchantments: [],
    };
    if (base.damage != null)
        item.damage = Math.round(base.damage * prefixMult);
    if (base.armor != null)
        item.armor = Math.round(base.armor * prefixMult);
    if (base.effect)
        item.effect = { ...base.effect };
    if (base.enchantments)
        item.enchantments.push(...base.enchantments.map((e) => ({ ...e })));
    if (base.type === ItemType.Consumable) {
        item.stackable = true;
        item.quantity = 1;
    }
    if (prefixes.length)
        item.prefix = prefixes[prefixes.length - 1].word;
    if (suffixes.length) {
        const s = suffixes[0];
        item.suffix = s.word;
        item.enchantments.push({ stat: s.stat, magnitude: s.magnitude });
    }
    // Recompute value from final stats so good rolls are worth more.
    let value = base.value * prefixMult;
    for (const e of item.enchantments)
        value += e.magnitude * 8;
    item.value = Math.round(value);
    return item;
}
//# sourceMappingURL=loot.js.map