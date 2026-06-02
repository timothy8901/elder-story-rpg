const KEY = "elder-story-rpg/save/v1";
const VERSION = 3;
/**
 * LocalStorage serialization manager. The game calls {@link save} on the events
 * the spec requires — map changes, level-ups, and opening the menu — and
 * {@link load} once on boot. All state is plain JSON; no backend involved.
 */
export const SaveManager = {
    version: VERSION,
    save(state) {
        try {
            localStorage.setItem(KEY, JSON.stringify(state));
            return true;
        }
        catch (err) {
            console.warn("Save failed:", err);
            return false;
        }
    },
    load() {
        try {
            const raw = localStorage.getItem(KEY);
            if (!raw)
                return null;
            const parsed = JSON.parse(raw);
            if (parsed.version !== VERSION)
                return null; // ignore incompatible saves
            return parsed;
        }
        catch (err) {
            console.warn("Load failed:", err);
            return null;
        }
    },
    exists() {
        try {
            return localStorage.getItem(KEY) !== null;
        }
        catch {
            return false;
        }
    },
    clear() {
        try {
            localStorage.removeItem(KEY);
        }
        catch {
            /* ignore */
        }
    },
};
//# sourceMappingURL=SaveManager.js.map