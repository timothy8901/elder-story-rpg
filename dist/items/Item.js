/**
 * Item data model. Items are plain JSON-serializable objects (no behavior), so
 * they drop straight into the inventory, equipment, and save systems. Loot is
 * assembled from a base template plus optional random prefix/suffix and
 * enchantments (see loot.ts).
 */
export var ItemType;
(function (ItemType) {
    ItemType["Weapon"] = "Weapon";
    ItemType["Armor"] = "Armor";
    ItemType["Jewelry"] = "Jewelry";
    ItemType["Consumable"] = "Consumable";
    ItemType["Ingredient"] = "Ingredient";
    ItemType["Misc"] = "Misc";
})(ItemType || (ItemType = {}));
export var EquipSlot;
(function (EquipSlot) {
    EquipSlot["Head"] = "Head";
    EquipSlot["Chest"] = "Chest";
    EquipSlot["Hands"] = "Hands";
    EquipSlot["Feet"] = "Feet";
    EquipSlot["Shield"] = "Shield";
    EquipSlot["MainHand"] = "Main-Hand";
    EquipSlot["OffHand"] = "Off-Hand";
    EquipSlot["Ring"] = "Ring";
    EquipSlot["Necklace"] = "Necklace";
})(EquipSlot || (EquipSlot = {}));
/** Ordered list of all equipment slots (for menu rendering). */
export const EQUIP_SLOTS = [
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
let uidCounter = 0;
/** Generate a unique instance id for a new item. */
export function newUid() {
    uidCounter += 1;
    return `i${uidCounter}_${Math.floor(Math.random() * 1e6).toString(36)}`;
}
/** Human-readable display name: "Sturdy Iron Sword of Flames". */
export function itemDisplayName(item) {
    return [item.prefix, item.name, item.suffix].filter(Boolean).join(" ");
}
/** Which skill governs a weapon, for use-to-level XP and damage scaling. */
export function weaponSkillOf(item) {
    switch (item?.weaponClass) {
        case "twoHanded":
            return "twoHanded";
        case "bow":
            return "archery";
        default:
            return "oneHanded"; // unarmed / one-handed default
    }
}
//# sourceMappingURL=Item.js.map