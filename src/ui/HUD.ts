import type { Renderer } from "../core/Renderer.js";
import type { Equipment } from "../items/Equipment.js";
import { itemDisplayName } from "../items/Item.js";
import type { Character, ProgressEvent } from "../progression/Character.js";
import { SKILLS } from "../progression/skills.js";

interface Toast {
  text: string;
  color: string;
  age: number;
  life: number;
}

/**
 * Heads-up display: the three resource pools, gold, the readied weapon/spell,
 * and a stack of transient "skill up / level up / loot" toasts.
 */
export class HUD {
  private toasts: Toast[] = [];

  pushToast(text: string, color = "#e8edf4"): void {
    this.toasts.push({ text, color, age: 0, life: 2.4 });
    if (this.toasts.length > 6) this.toasts.shift();
  }

  /** Turn progression events into player-facing toasts. */
  pushProgress(events: ProgressEvent[]): void {
    for (const e of events) {
      if (e.skill) this.pushToast(`${SKILLS[e.skill.id].name} increased to ${e.skill.level}`, "#cfe3ff");
      if (e.characterLevel) this.pushToast(`Level Up! You are now level ${e.characterLevel}`, "#ffd45e");
    }
  }

  update(dt: number): void {
    for (const t of this.toasts) t.age += dt;
    this.toasts = this.toasts.filter((t) => t.age < t.life);
  }

  render(
    r: Renderer,
    character: Character,
    equipment: Equipment,
    selectedSpell: string,
    gold: number,
  ): void {
    const h = r.height;
    const bar = (y: number, label: string, cur: number, max: number, color: string) => {
      const x = 16;
      const w = 210;
      r.fillRectScreen(x, y, w, 16, "rgba(0,0,0,0.5)");
      r.fillRectScreen(x, y, w * Math.max(0, Math.min(1, cur / max)), 16, color);
      r.text(`${label} ${Math.round(cur)}/${Math.round(max)}`, x + 6, y + 12, "#ffffff", "11px monospace");
    };
    bar(h - 74, "HP", character.hp, character.maxHealth, "#c0504d");
    bar(h - 54, "MP", character.mp, character.maxMagicka, "#3b6ea5");
    bar(h - 34, "SP", character.sp, character.maxStamina, "#3f8f4f");

    // Readied gear + gold (top-left strip).
    const weapon = equipment.mainHand ? itemDisplayName(equipment.mainHand) : "Unarmed";
    r.text(`⚔ ${weapon}`, 16, 22, "#e8edf4", "12px monospace");
    r.text(`✦ ${selectedSpell}`, 16, 40, "#9ad0ff", "12px monospace");
    r.text(`Lvl ${character.characterLevel}`, 16, 58, "#ffd45e", "12px monospace");

    // Gold (top-right).
    r.text(`◆ ${gold}`, r.width - 16, 22, "#ffd45e", "12px monospace", "right");

    // Perk/attribute reminders.
    if (character.perkPoints > 0 || character.attributePoints > 0) {
      r.text(
        `Press [I] — ${character.perkPoints} perk · ${character.attributePoints} attribute point(s) to spend`,
        r.width / 2,
        22,
        "#ffd45e",
        "12px monospace",
        "center",
      );
    }

    // Toasts rising near the top-center.
    this.toasts.forEach((t, i) => {
      const alpha = 1 - Math.max(0, (t.age - (t.life - 0.6)) / 0.6);
      r.ctx.globalAlpha = Math.max(0, Math.min(1, alpha));
      r.text(t.text, r.width / 2, 80 + i * 18, t.color, "bold 13px monospace", "center");
      r.ctx.globalAlpha = 1;
    });
  }
}
