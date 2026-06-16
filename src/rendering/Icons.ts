/**
 * Item icon atlas (assets/icons.png, built by tools/build_assets.py from 0x72
 * DungeonTileset II weapons/flasks/coin + simple slot glyphs). Loaded async at
 * startup; callers fall back to text-only labels until it's ready.
 *
 * One row of 24x24 cells; cell index = position in ICON_KEYS (mirror the same
 * list in build_assets.py).
 */
import { ASSET_VERSION } from "../config.js";
import { EquipSlot, type Item, ItemType } from "../items/Item.js";

const ICON_KEYS = [
  "sword", "dagger", "greatsword", "bow", "axe", "katana", "mace", "staff",
  "potion_hp", "potion_mp", "potion_sp", "coin",
  "helm", "chest", "hands", "feet", "shield", "ring", "necklace", "misc",
] as const;
type IconKey = (typeof ICON_KEYS)[number];

const IC = 24; // source cell size
const INDEX: Record<string, number> = {};
ICON_KEYS.forEach((k, i) => (INDEX[k] = i));

class IconAtlas {
  private img = new Image();
  ready = false;

  load(src = "assets/icons.png"): void {
    if (this.img.src) return;
    this.img.onload = () => {
      this.ready = true;
    };
    this.img.onerror = () => {
      console.warn(`[Icons] failed to load ${src}; using text labels.`);
    };
    this.img.src = `${src}?v=${ASSET_VERSION}`;
  }

  /** Blit an icon as a `size`-px square with its top-left at (x, y). False if not ready / unknown. */
  draw(ctx: CanvasRenderingContext2D, key: string, x: number, y: number, size: number): boolean {
    const i = INDEX[key];
    if (!this.ready || i === undefined) return false;
    const prev = ctx.imageSmoothingEnabled;
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(this.img, i * IC, 0, IC, IC, x, y, size, size);
    ctx.imageSmoothingEnabled = prev;
    return true;
  }
}

export const icons = new IconAtlas();

/** Pick the icon key that best represents an item (by type, weapon class, name). */
export function iconForItem(item: Item): IconKey {
  switch (item.type) {
    case ItemType.Consumable: {
      const s = item.effect?.stat;
      return s === "mp" ? "potion_mp" : s === "sp" ? "potion_sp" : "potion_hp";
    }
    case ItemType.Weapon: {
      if (item.weaponClass === "bow") return "bow";
      const n = `${item.baseId} ${item.name}`.toLowerCase();
      if (n.includes("axe")) return "axe";
      if (n.includes("dagger")) return "dagger";
      if (n.includes("katana")) return "katana";
      if (n.includes("greatsword") || item.weaponClass === "twoHanded") return "greatsword";
      if (n.includes("mace") || n.includes("hammer")) return "mace";
      if (n.includes("lute") || n.includes("staff")) return "staff";
      return "sword";
    }
    case ItemType.Armor:
      switch (item.slot) {
        case EquipSlot.Head:
          return "helm";
        case EquipSlot.Hands:
          return "hands";
        case EquipSlot.Feet:
          return "feet";
        case EquipSlot.Shield:
          return "shield";
        default:
          return "chest";
      }
    case ItemType.Jewelry:
      return item.slot === EquipSlot.Necklace ? "necklace" : "ring";
    default:
      return "misc";
  }
}

/** Icon key for an empty equipment slot (placeholder in the equip menu). */
export function iconForSlot(slot: EquipSlot): IconKey {
  switch (slot) {
    case EquipSlot.Head:
      return "helm";
    case EquipSlot.Chest:
      return "chest";
    case EquipSlot.Hands:
      return "hands";
    case EquipSlot.Feet:
      return "feet";
    case EquipSlot.Shield:
      return "shield";
    case EquipSlot.OffHand:
      return "misc"; // distinct from the Shield slot's placeholder
    case EquipSlot.Ring:
      return "ring";
    case EquipSlot.Necklace:
      return "necklace";
    case EquipSlot.MainHand:
      return "sword";
    default:
      return "misc";
  }
}
