import type { Item } from "../items/Item.js";
import type { CharacterSave } from "../progression/Character.js";
import type { MainQuestSave } from "../story/MainQuest.js";
import type { FactionsSave } from "../world/Factions.js";
import type { QuestSave } from "../world/Quests.js";

/** The complete, serializable snapshot written to LocalStorage. */
export interface SaveState {
  version: number;
  mapId: string;
  player: { x: number; y: number };
  selectedSpell: number;
  character: CharacterSave;
  inventory: { items: Item[]; gold: number };
  equipment: Record<string, Item | null>;
  quests: QuestSave;
  factions: FactionsSave;
  mainQuest: MainQuestSave;
}

const KEY = "elder-story-rpg/save/v1";
const VERSION = 3;

/**
 * LocalStorage serialization manager. The game calls {@link save} on the events
 * the spec requires — map changes, level-ups, and opening the menu — and
 * {@link load} once on boot. All state is plain JSON; no backend involved.
 */
export const SaveManager = {
  version: VERSION,

  save(state: SaveState): boolean {
    try {
      localStorage.setItem(KEY, JSON.stringify(state));
      return true;
    } catch (err) {
      console.warn("Save failed:", err);
      return false;
    }
  },

  load(): SaveState | null {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw) as SaveState;
      if (parsed.version !== VERSION) return null; // ignore incompatible saves
      return parsed;
    } catch (err) {
      console.warn("Load failed:", err);
      return null;
    }
  },

  exists(): boolean {
    try {
      return localStorage.getItem(KEY) !== null;
    } catch {
      return false;
    }
  },

  clear(): void {
    try {
      localStorage.removeItem(KEY);
    } catch {
      /* ignore */
    }
  },
};
