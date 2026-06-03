import { itemDisplayName } from "../items/Item.js";
import { makeItem } from "../items/loot.js";
/** Fraction of an item's value the player gets when selling. */
const SELL_FRACTION = 0.4;
/** Vendor stock (base id + buy price). Names are precomputed once. */
const STOCK = [
    { baseId: "potion_health", price: 45 },
    { baseId: "potion_magicka", price: 45 },
    { baseId: "potion_stamina", price: 40 },
    { baseId: "iron_dagger", price: 18 },
    { baseId: "iron_sword", price: 40 },
    { baseId: "hunting_bow", price: 75 },
    { baseId: "leather_helmet", price: 50 },
    { baseId: "leather_armor", price: 110 },
    { baseId: "iron_shield", price: 90 },
].map((s) => ({ ...s, name: itemDisplayName(makeItem(s.baseId)) }));
const sellPrice = (value) => Math.max(1, Math.round(value * SELL_FRACTION));
/**
 * A keyboard-driven buy/sell shop opened by talking to a vendor NPC. Buying
 * spends gold and adds the item; selling removes the item and pays out a
 * fraction of its value.
 */
export class Shop {
    constructor() {
        this.open = false;
        this.vendorName = "Merchant";
        this.tab = "buy";
        this.cursor = 0;
    }
    start(vendorName) {
        this.open = true;
        this.vendorName = vendorName;
        this.tab = "buy";
        this.cursor = 0;
    }
    close() {
        this.open = false;
    }
    /** Handle input for one frame; returns toast messages (purchases/sales). */
    update(input, inventory) {
        if (!this.open)
            return [];
        const msgs = [];
        if (input.justPressed("Escape") || input.justPressed("KeyI") || input.justPressed("KeyE")) {
            this.close();
            return msgs;
        }
        if (input.anyPressed(["ArrowLeft", "KeyA", "ArrowRight", "KeyD"])) {
            this.tab = this.tab === "buy" ? "sell" : "buy";
            this.cursor = 0;
        }
        const count = this.tab === "buy" ? STOCK.length : inventory.items.length;
        if (count > 0) {
            if (input.anyPressed(["ArrowUp", "KeyW"]))
                this.cursor = (this.cursor + count - 1) % count;
            if (input.anyPressed(["ArrowDown", "KeyS"]))
                this.cursor = (this.cursor + 1) % count;
        }
        if (input.anyPressed(["Enter", "Space", "KeyJ"])) {
            if (this.tab === "buy")
                this.buy(inventory, msgs);
            else
                this.sell(inventory, msgs);
        }
        this.cursor = Math.max(0, Math.min(this.cursor, Math.max(0, count - 1)));
        return msgs;
    }
    buy(inventory, msgs) {
        const entry = STOCK[this.cursor];
        if (!entry)
            return;
        if (inventory.gold < entry.price) {
            msgs.push("Not enough gold.");
            return;
        }
        inventory.gold -= entry.price;
        const item = makeItem(entry.baseId);
        inventory.add(item);
        msgs.push(`Bought ${itemDisplayName(item)} (-${entry.price}g)`);
    }
    sell(inventory, msgs) {
        const item = inventory.items[this.cursor];
        if (!item)
            return;
        const price = sellPrice(item.value ?? 1);
        inventory.remove(item.uid);
        inventory.gold += price;
        msgs.push(`Sold ${itemDisplayName(item)} (+${price}g)`);
    }
    render(r, inventory) {
        if (!this.open)
            return;
        const W = r.width;
        const H = r.height;
        const x = 80;
        const y = 56;
        const w = W - 160;
        const h = H - 150;
        r.fillRectScreen(0, 0, W, H, "rgba(0,0,0,0.55)");
        r.fillRectScreen(x, y, w, h, "rgba(16,20,30,0.97)");
        r.fillRectScreen(x, y, w, 2, "#ffd45e");
        r.text(`${this.vendorName} — Wares`, x + 18, y + 26, "#ffd45e", "bold 15px monospace");
        r.text(`Gold: ${inventory.gold}`, x + w - 18, y + 26, "#ffe45e", "13px monospace", "right");
        r.text(this.tab === "buy" ? "[ BUY ]" : "  buy", x + 18, y + 50, this.tab === "buy" ? "#ffd45e" : "#8b94a6", "13px monospace");
        r.text(this.tab === "sell" ? "[ SELL ]" : "  sell", x + 110, y + 50, this.tab === "sell" ? "#ffd45e" : "#8b94a6", "13px monospace");
        const rows = this.tab === "buy"
            ? STOCK.map((s) => ({ label: s.name, price: s.price, affordable: inventory.gold >= s.price }))
            : inventory.items.map((it) => ({
                label: itemDisplayName(it) + (it.quantity && it.quantity > 1 ? ` x${it.quantity}` : ""),
                price: sellPrice(it.value ?? 1),
                affordable: true,
            }));
        const startY = y + 78;
        const rowH = 19;
        const maxRows = Math.floor((h - 96) / rowH);
        if (rows.length === 0) {
            r.text(this.tab === "buy" ? "(out of stock)" : "(nothing to sell)", x + 24, startY, "#8b94a6", "13px monospace");
        }
        const top = Math.max(0, Math.min(this.cursor - Math.floor(maxRows / 2), Math.max(0, rows.length - maxRows)));
        for (let i = top; i < Math.min(rows.length, top + maxRows); i++) {
            const row = rows[i];
            const ry = startY + (i - top) * rowH;
            const sel = i === this.cursor;
            if (sel)
                r.fillRectScreen(x + 12, ry - 14, w - 24, rowH, "rgba(255,212,94,0.15)");
            r.text(row.label, x + 24, ry, sel ? "#ffd45e" : "#e8edf4", "13px monospace");
            const priceColor = this.tab === "buy" ? (row.affordable ? "#9affa0" : "#ff8a8a") : "#ffe45e";
            r.text(`${row.price}g`, x + w - 24, ry, priceColor, "13px monospace", "right");
        }
        r.text("[←→] buy/sell   [↑↓] choose   [Enter] trade   [Esc] leave", W / 2, y + h - 12, "#7e879a", "11px monospace", "center");
    }
}
//# sourceMappingURL=Shop.js.map