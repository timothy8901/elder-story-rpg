import type { Input } from "../core/Input.js";
import type { Renderer } from "../core/Renderer.js";
import { Equipment } from "../items/Equipment.js";
import { EQUIP_SLOTS, type Item, ItemType, itemDisplayName } from "../items/Item.js";
import type { Inventory } from "../items/Inventory.js";
import { makeItem } from "../items/loot.js";
import { type Character, type ProgressEvent, skillXpToNext } from "../progression/Character.js";
import { SKILLS, SKILL_IDS, type SkillId } from "../progression/skills.js";
import type { Factions } from "../world/Factions.js";
import { FACTION_DATA, FACTION_IDS } from "../world/factionData.js";
import type { MainQuest } from "../story/MainQuest.js";
import type { DwarvenQuest } from "../story/DwarvenQuest.js";

const PAGES = ["Stats & Skills", "Inventory", "Equipment", "Crafting", "Factions", "Quests"] as const;

interface CraftResult {
  ok: boolean;
  msg: string;
}

interface CraftAction {
  label: string;
  skill: SkillId;
  /** Performs the craft; returns ok:false (with no side effects) on failure. */
  run: (c: Character, inv: Inventory, eq: Equipment) => CraftResult;
}

const fail = (msg: string): CraftResult => ({ ok: false, msg });
const done = (msg: string): CraftResult => ({ ok: true, msg });

/** Result of one menu update, applied by Game (save/recompute/toasts). */
export interface MenuResult {
  progress: ProgressEvent[];
  equipmentChanged: boolean;
  messages: string[];
}

/**
 * The pause-screen character sheet rendered on the canvas: attributes & skills
 * (with perk and attribute-point spending), inventory (equip/use), the nine
 * equipment slots (unequip), and crafting actions that exercise the
 * Smithing / Alchemy / Enchanting skills. Fully keyboard-driven.
 */
export class Menu {
  open = false;
  private page = 0;
  private cursor = [0, 0, 0, 0, 0, 0];
  /** Latest action result, shown inside the panel so it isn't hidden by it. */
  private feedback: { text: string; ttl: number } | null = null;

  /** Each improvement is capped, and every craft costs gold (and scales), so
   *  it can't be spammed for free. */
  private static readonly TEMPER_CAP = 5;

  private readonly crafts: CraftAction[] = [
    {
      label: "Forge — Improve Main-Hand weapon (+damage)",
      skill: "smithing",
      run: (c, inv, eq) => {
        const w = eq.mainHand;
        if (!w || w.damage == null) return fail("No weapon equipped to improve.");
        if ((w.tempered ?? 0) >= Menu.TEMPER_CAP) return fail(`${itemDisplayName(w)} is already fully tempered.`);
        const cost = 20 + Math.round(w.damage) * 3;
        if (inv.gold < cost) return fail(`Need ${cost}g of materials to improve ${itemDisplayName(w)}.`);
        const gain = Math.round(2 * (1 + c.perkBonus("smithing", "potencyMult")) * (1 + c.skills.smithing.level / 200));
        inv.gold -= cost;
        w.tempered = (w.tempered ?? 0) + 1;
        w.damage += gain;
        w.value += gain * 6;
        return done(`Improved ${itemDisplayName(w)} (+${gain} damage, -${cost}g).`);
      },
    },
    {
      label: "Forge — Improve Chest armor (+armor)",
      skill: "smithing",
      run: (c, inv, eq) => {
        const a = eq.slots.Chest;
        if (!a || a.armor == null) return fail("No chest armor equipped to improve.");
        if ((a.tempered ?? 0) >= Menu.TEMPER_CAP) return fail(`${itemDisplayName(a)} is already fully tempered.`);
        const cost = 20 + Math.round(a.armor) * 3;
        if (inv.gold < cost) return fail(`Need ${cost}g of materials to improve ${itemDisplayName(a)}.`);
        const gain = Math.round(3 * (1 + c.perkBonus("smithing", "potencyMult")) * (1 + c.skills.smithing.level / 200));
        inv.gold -= cost;
        a.tempered = (a.tempered ?? 0) + 1;
        a.armor += gain;
        a.value += gain * 5;
        return done(`Improved ${itemDisplayName(a)} (+${gain} armor, -${cost}g).`);
      },
    },
    {
      label: "Brew — Healing Potion (20g ingredients)",
      skill: "alchemy",
      run: (c, inv) => {
        const cost = 20;
        if (inv.gold < cost) return fail(`Need ${cost}g of ingredients to brew a potion.`);
        const potion = makeItem("potion_health");
        const mult = 1 + c.perkBonus("alchemy", "potencyMult");
        if (potion.effect) potion.effect.magnitude = Math.round(potion.effect.magnitude * mult);
        inv.gold -= cost;
        inv.add(potion);
        return done(`Brewed ${potion.name} (heals ${potion.effect?.magnitude}, -${cost}g).`);
      },
    },
    {
      label: "Enchant — Main-Hand: Flames (60g)",
      skill: "enchanting",
      run: (c, inv, eq) => {
        const w = eq.mainHand;
        if (!w) return fail("No weapon equipped to enchant.");
        if (w.enchantments.some((e) => e.stat === "fireDamage")) return fail("Weapon already enchanted with Flames.");
        const cost = 60;
        if (inv.gold < cost) return fail(`Need ${cost}g of soul-energy to enchant.`);
        const mag = Math.round(8 * (1 + c.perkBonus("enchanting", "potencyMult")));
        inv.gold -= cost;
        w.enchantments.push({ stat: "fireDamage", magnitude: mag });
        w.suffix = "of Flames";
        return done(`Enchanted ${itemDisplayName(w)} (+${mag} fire, -${cost}g).`);
      },
    },
    {
      label: "Enchant — Chest: Fortify Health (60g)",
      skill: "enchanting",
      run: (c, inv, eq) => {
        const a = eq.slots.Chest;
        if (!a) return fail("No chest armor equipped to enchant.");
        if (a.enchantments.some((e) => e.stat === "health")) return fail("Armor already enchanted with Health.");
        const cost = 60;
        if (inv.gold < cost) return fail(`Need ${cost}g of soul-energy to enchant.`);
        const mag = Math.round(20 * (1 + c.perkBonus("enchanting", "potencyMult")));
        inv.gold -= cost;
        a.enchantments.push({ stat: "health", magnitude: mag });
        a.suffix = "of Health";
        return done(`Enchanted ${itemDisplayName(a)} (+${mag} health, -${cost}g).`);
      },
    },
  ];

  toggle(): void {
    this.open = !this.open;
  }

  /** Handle one frame of menu input. */
  update(input: Input, character: Character, inventory: Inventory, equipment: Equipment): MenuResult {
    const result: MenuResult = { progress: [], equipmentChanged: false, messages: [] };

    // Page switching.
    if (input.anyPressed(["ArrowLeft", "KeyA"])) this.page = (this.page + PAGES.length - 1) % PAGES.length;
    if (input.anyPressed(["ArrowRight", "KeyD"])) this.page = (this.page + 1) % PAGES.length;

    const count = this.itemCount(inventory);
    if (count > 0) {
      if (input.anyPressed(["ArrowUp", "KeyW"])) this.cursor[this.page] = (this.cursor[this.page]! + count - 1) % count;
      if (input.anyPressed(["ArrowDown", "KeyS"])) this.cursor[this.page] = (this.cursor[this.page]! + 1) % count;
    }
    this.cursor[this.page] = Math.min(this.cursor[this.page]!, Math.max(0, count - 1));

    const activate = input.anyPressed(["Enter", "Space", "KeyJ"]);

    switch (PAGES[this.page]) {
      case "Stats & Skills":
        this.updateStats(input, character, result, activate);
        break;
      case "Inventory":
        if (activate) this.useOrEquip(character, inventory, equipment, result);
        break;
      case "Equipment":
        if (activate) this.unequip(inventory, equipment, result);
        break;
      case "Crafting":
        if (activate) this.craft(character, inventory, equipment, result);
        break;
      case "Factions":
      case "Quests":
        break; // read-only summaries
    }

    // Surface the latest message inside the panel (toasts are hidden behind it).
    if (this.feedback) {
      this.feedback.ttl -= 1;
      if (this.feedback.ttl <= 0) this.feedback = null;
    }
    if (result.messages.length) {
      this.feedback = { text: result.messages[result.messages.length - 1]!, ttl: 240 };
    }
    return result;
  }

  private itemCount(inventory: Inventory): number {
    switch (PAGES[this.page]) {
      case "Stats & Skills":
        return SKILL_IDS.length;
      case "Inventory":
        return inventory.items.length;
      case "Equipment":
        return EQUIP_SLOTS.length;
      case "Crafting":
        return this.crafts.length;
      case "Factions":
        return FACTION_IDS.length;
      case "Quests":
        return 1; // read-only journal
    }
  }

  private updateStats(input: Input, c: Character, result: MenuResult, activate: boolean): void {
    if (input.justPressed("Digit1") && c.allocateAttribute("health")) result.messages.push("+10 Health");
    if (input.justPressed("Digit2") && c.allocateAttribute("magicka")) result.messages.push("+10 Magicka");
    if (input.justPressed("Digit3") && c.allocateAttribute("stamina")) result.messages.push("+10 Stamina");
    if (activate) {
      const skillId = SKILL_IDS[this.cursor[0]!]!;
      const next = SKILLS[skillId].perks.find((p) => !c.unlockedPerks.has(p.id));
      if (!next) result.messages.push(`${SKILLS[skillId].name}: all perks unlocked.`);
      else if (c.unlockPerk(next.id)) result.messages.push(`Unlocked perk: ${next.name}`);
      else if (c.perkPoints <= 0) result.messages.push("No perk points to spend.");
      else result.messages.push(`${next.name} needs ${SKILLS[skillId].name} ${next.reqLevel}.`);
    }
  }

  private useOrEquip(c: Character, inv: Inventory, eq: Equipment, result: MenuResult): void {
    const item = inv.items[this.cursor[1]!];
    if (!item) return;
    if (item.type === ItemType.Consumable && item.effect) {
      const { stat, magnitude } = item.effect;
      if (stat === "hp") c.hp = Math.min(c.maxHealth, c.hp + magnitude);
      if (stat === "mp") c.mp = Math.min(c.maxMagicka, c.mp + magnitude);
      if (stat === "sp") c.sp = Math.min(c.maxStamina, c.sp + magnitude);
      inv.remove(item.uid);
      result.messages.push(`Used ${item.name}.`);
    } else if (item.slot) {
      inv.remove(item.uid);
      const displaced = eq.equip(item);
      if (displaced) inv.add(displaced);
      result.equipmentChanged = true;
      result.messages.push(`Equipped ${itemDisplayName(item)}.`);
    } else {
      result.messages.push(`${item.name} can't be used.`);
    }
  }

  private unequip(inv: Inventory, eq: Equipment, result: MenuResult): void {
    const slot = EQUIP_SLOTS[this.cursor[2]!]!;
    const removed = eq.unequip(slot);
    if (removed) {
      inv.add(removed);
      result.equipmentChanged = true;
      result.messages.push(`Unequipped ${itemDisplayName(removed)}.`);
    }
  }

  private craft(c: Character, inv: Inventory, eq: Equipment, result: MenuResult): void {
    const action = this.crafts[this.cursor[3]!]!;
    const res = action.run(c, inv, eq);
    result.messages.push(res.msg);
    // XP and a save are only earned when the craft actually succeeds.
    if (res.ok) {
      result.progress.push(...c.gainSkillXp(action.skill, 12));
      result.equipmentChanged = true;
    }
  }

  // --- Rendering ----------------------------------------------------------

  render(r: Renderer, character: Character, inventory: Inventory, equipment: Equipment, factions: Factions, mainQuest: MainQuest, dwarvenQuest: DwarvenQuest): void {
    const x = 40;
    const y = 28;
    const w = r.width - 80;
    const h = r.height - 56;
    r.fillRectScreen(0, 0, r.width, r.height, "rgba(6,8,14,0.78)");
    r.fillRectScreen(x, y, w, h, "rgba(16,20,30,0.97)");

    // Tabs (spaced to fit the panel width).
    const tabW = (w - 40) / PAGES.length;
    PAGES.forEach((name, i) => {
      const tx = x + 20 + i * tabW;
      const active = i === this.page;
      r.text(name, tx, y + 26, active ? "#ffd45e" : "#7e879a", active ? "bold 13px monospace" : "13px monospace");
    });
    r.fillRectScreen(x, y + 36, w, 1, "#2c3550");

    const cx = x + 24;
    let cy = y + 64;
    const cursor = this.cursor[this.page]!;

    switch (PAGES[this.page]) {
      case "Stats & Skills":
        this.renderStats(r, character, cx, cy, cursor);
        break;
      case "Inventory":
        this.renderInventory(r, character, inventory, cx, cy, cursor);
        break;
      case "Equipment":
        this.renderEquipment(r, character, equipment, cx, cy, cursor);
        break;
      case "Crafting":
        this.renderCrafting(r, character, cx, cy, cursor);
        break;
      case "Factions":
        this.renderFactions(r, factions, cx, cy, cursor);
        break;
      case "Quests":
        this.renderQuests(r, mainQuest, dwarvenQuest, factions, cx, cy);
        break;
    }

    if (this.feedback) {
      r.fillRectScreen(x, y + h - 52, w, 22, "rgba(255,212,94,0.10)");
      r.text(this.feedback.text, r.width / 2, y + h - 37, "#ffe08a", "bold 13px monospace", "center");
    }

    r.text(
      "[←→] tab   [↑↓] select   [Enter] use/equip/craft   [1/2/3] raise attribute   [I or Esc] close",
      r.width / 2,
      y + h - 14,
      "#7e879a",
      "12px monospace",
      "center",
    );
  }

  private renderStats(r: Renderer, c: Character, x: number, y: number, cursor: number): void {
    r.text(
      `Level ${c.characterLevel}    Perk Points: ${c.perkPoints}    Attribute Points: ${c.attributePoints}`,
      x,
      y,
      "#ffd45e",
      "bold 13px monospace",
    );
    r.text(`[1] Health ${Math.round(c.maxHealth)}   [2] Magicka ${Math.round(c.maxMagicka)}   [3] Stamina ${Math.round(c.maxStamina)}   Armor ${c.armorRating}`, x, y + 20, "#cfe3ff");

    // Skills in two columns.
    let row = 0;
    const colW = 360;
    const startY = y + 48;
    const drawSkill = (id: SkillId, idx: number) => {
      const col = row >= 8 ? 1 : 0;
      const ry = startY + (row % 8) * 30;
      const rx = x + col * colW;
      const s = c.skills[id];
      const selected = idx === cursor;
      if (selected) r.fillRectScreen(rx - 6, ry - 13, colW - 16, 28, "rgba(255,212,94,0.14)");
      r.text(`${SKILLS[id].name}`, rx, ry, selected ? "#ffd45e" : "#e8edf4", "12px monospace");
      r.text(`Lv ${s.level}`, rx + 200, ry, "#9ad0ff", "12px monospace");
      // xp bar
      const frac = s.xp / skillXpToNext(s.level);
      r.fillRectScreen(rx, ry + 4, 180, 4, "#2c3550");
      r.fillRectScreen(rx, ry + 4, 180 * Math.max(0, Math.min(1, frac)), 4, "#ffd45e");
      row++;
    };
    // Maintain a global index that matches SKILL_IDS order for the cursor.
    SKILL_IDS.forEach((id, idx) => drawSkill(id, idx));

    // Next perk for the selected skill.
    const selId = SKILL_IDS[cursor]!;
    const next = SKILLS[selId].perks.find((p) => !c.unlockedPerks.has(p.id));
    const msg = next
      ? `Next perk: ${next.name} (req ${SKILLS[selId].name} ${next.reqLevel}) — ${next.description}`
      : `${SKILLS[selId].name}: all perks unlocked.`;
    r.text(msg, x, startY + 8 * 30 + 16, "#b6c0d4", "12px monospace");
  }

  private renderInventory(r: Renderer, c: Character, inv: Inventory, x: number, y: number, cursor: number): void {
    r.text(
      `Gold: ${inv.gold}    Weight: ${Math.round(inv.totalWeight())}/${Math.round(inv.maxWeight(c))}`,
      x,
      y,
      inv.isOverEncumbered(c) ? "#ff7d7d" : "#cfe3ff",
      "13px monospace",
    );
    if (inv.items.length === 0) {
      r.text("(empty — slay enemies to find loot)", x, y + 30, "#7e879a");
      return;
    }
    inv.items.forEach((item, i) => {
      const ry = y + 28 + i * 22;
      if (ry > r.height - 90) return; // simple clip
      const selected = i === cursor;
      if (selected) r.fillRectScreen(x - 6, ry - 13, r.width - 80 - 36, 20, "rgba(255,212,94,0.14)");
      const detail = describeItem(item);
      r.text(itemDisplayName(item) + (item.quantity && item.quantity > 1 ? ` x${item.quantity}` : ""), x, ry, selected ? "#ffd45e" : "#e8edf4", "12px monospace");
      r.text(detail, x + 320, ry, "#9aa4b2", "12px monospace");
    });
  }

  private renderEquipment(r: Renderer, c: Character, eq: Equipment, x: number, y: number, cursor: number): void {
    r.text(`Armor Rating: ${c.armorRating}    Weapon Damage: ${Math.round(eq.weaponDamage(c))}`, x, y, "#cfe3ff", "13px monospace");
    EQUIP_SLOTS.forEach((slot, i) => {
      const ry = y + 30 + i * 26;
      const selected = i === cursor;
      if (selected) r.fillRectScreen(x - 6, ry - 14, r.width - 80 - 36, 22, "rgba(255,212,94,0.14)");
      const item = eq.slots[slot];
      r.text(slot, x, ry, "#9aa4b2", "12px monospace");
      r.text(item ? itemDisplayName(item) : "(empty)", x + 130, ry, item ? (selected ? "#ffd45e" : "#e8edf4") : "#5b6473", "12px monospace");
      if (item) r.text(describeItem(item), x + 430, ry, "#9aa4b2", "12px monospace");
    });
  }

  private renderCrafting(r: Renderer, c: Character, x: number, y: number, cursor: number): void {
    r.text("Crafting trains Smithing, Alchemy and Enchanting.", x, y, "#cfe3ff", "13px monospace");
    this.crafts.forEach((a, i) => {
      const ry = y + 34 + i * 28;
      const selected = i === cursor;
      if (selected) r.fillRectScreen(x - 6, ry - 14, r.width - 80 - 36, 24, "rgba(255,212,94,0.14)");
      r.text(a.label, x, ry, selected ? "#ffd45e" : "#e8edf4", "12px monospace");
      r.text(`[${SKILLS[a.skill].name} ${c.skills[a.skill].level}]`, x + 470, ry, "#9ad0ff", "12px monospace");
    });
  }

  private renderFactions(r: Renderer, factions: Factions, x: number, y: number, cursor: number): void {
    r.text("Recruiters wait in the field — walk up and press E to speak.", x, y, "#cfe3ff", "13px monospace");
    FACTION_IDS.forEach((id, i) => {
      const d = FACTION_DATA[id];
      const s = factions.get(id);
      const ry = y + 34 + i * 44;
      if (i === cursor) r.fillRectScreen(x - 6, ry - 15, r.width - 80 - 36, 40, "rgba(255,212,94,0.10)");

      let status: string;
      let color: string;
      if (factions.isRival(id)) {
        status = "Barred — you chose the rival faction";
        color = "#ff7d7d";
      } else if (!s.joined) {
        status = "Not joined";
        color = "#9aa4b2";
      } else if (s.stage >= 3) {
        status = `${factions.rankTitle(id)} — questline complete`;
        color = "#7dffa0";
      } else if (s.stage === 2) {
        status = `${factions.rankTitle(id)} — objective met, report back`;
        color = "#ffd45e";
      } else {
        const prog = d.objectiveType === "killBoss" ? (s.progress >= 1 ? "1/1" : "0/1") : `${s.progress}/${d.objectiveCount}`;
        status = `${factions.rankTitle(id)} — ${d.objective} ${prog}`;
        color = "#ffd45e";
      }

      r.text(d.name, x, ry, factions.isJoined(id) ? "#ffd45e" : "#e8edf4", "bold 13px monospace");
      r.text(status, x, ry + 16, color, "12px monospace");
      r.text(d.rewardText, x, ry + 31, "#7e879a", "11px monospace");
    });
  }

  private renderQuests(r: Renderer, mainQuest: MainQuest, dwarvenQuest: DwarvenQuest, factions: Factions, x: number, y: number): void {
    r.text("Journal — your active quests", x, y, "#cfe3ff", "13px monospace");
    let ry = y + 36;

    // Main quest.
    r.text("⚔ The World-Eater (Main Quest)", x, ry, "#ffd45e", "bold 14px monospace");
    const mqText =
      mainQuest.stage === "complete"
        ? "Completed — Alduin is slain and Skyrim is saved."
        : mainQuest.stage === "notStarted"
          ? "Not started — seek the Courier in Greenreach Vale."
          : mainQuest.objective;
    r.text(mqText, x, ry + 17, "#e8edf4", "12px monospace");
    ry += 46;

    // Dwarven side quest (only once begun).
    if (dwarvenQuest.stage !== "notStarted") {
      r.text("⚙ Echoes of the Deep (Calcelmo)", x, ry, "#cda94e", "bold 14px monospace");
      r.text(dwarvenQuest.stage === "complete" ? "Completed — Nchuand-Zel is silenced." : dwarvenQuest.objective, x, ry + 17, "#e8edf4", "12px monospace");
      ry += 46;
    }

    // Active faction quests (joined, not yet complete).
    const active = FACTION_IDS.filter((id) => factions.isJoined(id) && !factions.isPromoted(id));
    r.text("Faction Quests", x, ry, "#ffd45e", "bold 14px monospace");
    ry += 22;
    if (active.length === 0) {
      r.text("None active. Recruiters across the land show a '?' — talk to them to join.", x, ry, "#8b94a6", "12px monospace");
    } else {
      for (const id of active) {
        const d = FACTION_DATA[id];
        const s = factions.get(id);
        const detail =
          s.stage === 2
            ? `Objective complete — report to ${d.recruiter}.`
            : d.objectiveType === "killBoss"
              ? d.objective
              : `${d.objective} (${s.progress}/${d.objectiveCount})`;
        r.text(`• ${d.name}`, x, ry, "#ffd45e", "bold 12px monospace");
        r.text(detail, x + 16, ry + 15, "#e8edf4", "12px monospace");
        ry += 38;
      }
    }
  }
}

/** One-line item stat summary for list views. */
function describeItem(item: Item): string {
  const parts: string[] = [];
  if (item.damage != null) parts.push(`${item.damage} dmg`);
  if (item.armor != null) parts.push(`${item.armor} armor`);
  for (const e of item.enchantments) parts.push(`+${e.magnitude} ${e.stat}`);
  if (item.effect) parts.push(`+${item.effect.magnitude} ${item.effect.stat}`);
  parts.push(`${item.weight}wt`, `${item.value}g`);
  return parts.join("  ");
}
