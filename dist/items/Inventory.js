import { ItemType } from "./Item.js";
const BASE_CARRY = 200;
/** A bag of items plus the player's gold. Consumables stack by base id. */
export class Inventory {
    constructor() {
        this.items = [];
        this.gold = 0;
    }
    /** Add an item, stacking consumables of the same base id. */
    add(item) {
        if (item.stackable) {
            const existing = this.items.find((i) => i.stackable && i.baseId === item.baseId);
            if (existing) {
                existing.quantity = (existing.quantity ?? 1) + (item.quantity ?? 1);
                return;
            }
        }
        this.items.push(item);
    }
    /** Remove one of an item by uid (decrements a stack, or removes outright). */
    remove(uid) {
        const idx = this.items.findIndex((i) => i.uid === uid);
        if (idx < 0)
            return null;
        const item = this.items[idx];
        if (item.stackable && (item.quantity ?? 1) > 1) {
            item.quantity = (item.quantity ?? 1) - 1;
            return item;
        }
        this.items.splice(idx, 1);
        return item;
    }
    find(uid) {
        return this.items.find((i) => i.uid === uid);
    }
    totalWeight() {
        return this.items.reduce((sum, i) => sum + i.weight * (i.quantity ?? 1), 0);
    }
    /** Carry capacity = base + stamina investment + perk bonuses. */
    maxWeight(character) {
        return BASE_CARRY + character.attributes.stamina * 5 + character.carryWeightBonus();
    }
    isOverEncumbered(character) {
        return this.totalWeight() > this.maxWeight(character);
    }
    /** Convenience: every consumable currently held. */
    consumables() {
        return this.items.filter((i) => i.type === ItemType.Consumable);
    }
    // --- Serialization ------------------------------------------------------
    toJSON() {
        return { items: structuredClone(this.items), gold: this.gold };
    }
    load(save) {
        this.items = structuredClone(save.items);
        this.gold = save.gold;
    }
}
//# sourceMappingURL=Inventory.js.map