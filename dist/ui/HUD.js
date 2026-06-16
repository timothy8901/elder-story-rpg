import { icons, iconForItem } from "../rendering/Icons.js";
import { itemDisplayName } from "../items/Item.js";
import { SKILLS } from "../progression/skills.js";
/**
 * Heads-up display: the three resource pools, gold, the readied weapon/spell,
 * and a stack of transient "skill up / level up / loot" toasts.
 */
export class HUD {
    constructor() {
        this.toasts = [];
        /** Seconds remaining on the subtle "Saved" indicator (separate from toasts). */
        this.savedFlash = 0;
    }
    pushToast(text, color = "#e8edf4") {
        this.toasts.push({ text, color, age: 0, life: 2.4 });
        if (this.toasts.length > 6)
            this.toasts.shift();
    }
    /** Ping the subtle corner "Saved" flash (called on every successful save). */
    flashSaved() {
        this.savedFlash = HUD.SAVED_FLASH_LIFE;
    }
    /** Turn progression events into player-facing toasts. */
    pushProgress(events) {
        for (const e of events) {
            if (e.skill)
                this.pushToast(`${SKILLS[e.skill.id].name} increased to ${e.skill.level}`, "#cfe3ff");
            if (e.characterLevel)
                this.pushToast(`Level Up! You are now level ${e.characterLevel}`, "#ffd45e");
        }
    }
    update(dt) {
        for (const t of this.toasts)
            t.age += dt;
        this.toasts = this.toasts.filter((t) => t.age < t.life);
        if (this.savedFlash > 0)
            this.savedFlash = Math.max(0, this.savedFlash - dt);
    }
    render(r, character, equipment, selectedSpell, gold) {
        const h = r.height;
        const ctx = r.ctx;
        // --- Resource bars (bottom-left), in a framed panel ---
        const bx = 22, bw = 200, bh = 14, rowGap = 20;
        const top = h - 76;
        r.fillRoundRect(8, top - 8, bw + 26, 3 * rowGap + 6, 6, "rgba(10,14,22,0.5)");
        const bar = (rowI, label, cur, max, c1, c2) => {
            const y = top + rowI * rowGap;
            const frac = Math.max(0, Math.min(1, cur / max));
            r.fillRoundRect(8, y + 2, 9, bh - 4, 2, c1); // icon pip
            r.fillRoundRect(bx, y, bw, bh, 4, "rgba(6,8,14,0.7)"); // track
            if (frac > 0) {
                const g = ctx.createLinearGradient(0, y, 0, y + bh);
                g.addColorStop(0, c1);
                g.addColorStop(1, c2);
                r.fillRoundRect(bx, y, Math.max(4, bw * frac), bh, 4, g); // gradient fill
            }
            for (let t = 1; t < 5; t++)
                r.fillRectScreen(bx + Math.round((bw * t) / 5), y + 2, 1, bh - 4, "rgba(0,0,0,0.28)"); // segment ticks
            r.strokeRoundRect(bx, y, bw, bh, 4, "rgba(0,0,0,0.5)", 1);
            r.text(`${label} ${Math.round(cur)}/${Math.round(max)}`, bx + 6, y + bh - 3, "#ffffff", "bold 10px monospace");
        };
        bar(0, "HP", character.hp, character.maxHealth, "#e2554d", "#8f2f2a");
        bar(1, "MP", character.mp, character.maxMagicka, "#4f8fe0", "#274f8f");
        bar(2, "SP", character.sp, character.maxStamina, "#54c065", "#2c7a3a");
        // --- Readied gear + level (top-left), framed ---
        const fullWeapon = equipment.mainHand ? itemDisplayName(equipment.mainHand) : "Unarmed";
        const weapon = fullWeapon.length > 28 ? `${fullWeapon.slice(0, 27)}…` : fullWeapon; // keep within the 250px frame
        r.fillRoundRect(8, 10, 250, 58, 6, "rgba(10,14,22,0.45)");
        const drewWpn = equipment.mainHand ? icons.draw(ctx, iconForItem(equipment.mainHand), 16, 14, 18) : false;
        r.text(`${drewWpn ? "" : "⚔ "}${weapon}`, drewWpn ? 38 : 18, 28, "#e8edf4", "12px monospace");
        r.text(`✦ ${selectedSpell}`, 18, 46, "#9ad0ff", "12px monospace");
        r.text(`Lvl ${character.characterLevel}`, 18, 62, "#ffd45e", "bold 12px monospace");
        // Gold (top-right), framed — coin icon when loaded, else a ◆ glyph.
        const goldStr = `${icons.ready ? "" : "◆ "}${gold}`;
        const gw = goldStr.length * 8 + (icons.ready ? 32 : 16);
        r.fillRoundRect(r.width - 14 - gw, 10, gw, 22, 6, "rgba(10,14,22,0.45)");
        icons.draw(ctx, "coin", r.width - 14 - gw + 6, 12, 18);
        r.text(goldStr, r.width - 18, 25, "#ffd45e", "bold 12px monospace", "right");
        // Perk/attribute reminder (below the top-center area banner).
        if (character.perkPoints > 0 || character.attributePoints > 0) {
            r.text(`Press [I] — ${character.perkPoints} perk · ${character.attributePoints} attribute point(s) to spend`, r.width / 2, 50, "#ffd45e", "12px monospace", "center");
        }
        // Toasts rising near the top-center.
        this.toasts.forEach((t, i) => {
            const alpha = 1 - Math.max(0, (t.age - (t.life - 0.6)) / 0.6);
            r.ctx.globalAlpha = Math.max(0, Math.min(1, alpha));
            r.text(t.text, r.width / 2, 80 + i * 18, t.color, "bold 13px monospace", "center");
            r.ctx.globalAlpha = 1;
        });
        // Subtle "Saved" flash, bottom-right (one line above the quest objective).
        if (this.savedFlash > 0) {
            r.ctx.globalAlpha = Math.max(0, Math.min(1, this.savedFlash / HUD.SAVED_FADE));
            r.text("✓ Saved", r.width - 16, h - 34, "#7dffa0", "bold 12px monospace", "right");
            r.ctx.globalAlpha = 1;
        }
    }
}
HUD.SAVED_FLASH_LIFE = 1.0;
HUD.SAVED_FADE = 0.4;
//# sourceMappingURL=HUD.js.map