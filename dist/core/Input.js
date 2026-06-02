/**
 * Keyboard input tracker.
 *
 * Distinguishes three states keyed by `KeyboardEvent.code`:
 *  - **held**     — currently down (level-triggered; e.g. run while held)
 *  - **pressed**  — went down this step (edge-triggered; e.g. jump)
 *  - **released** — came up this step (edge-triggered; e.g. variable jump height)
 *
 * The edge sets are cleared once per fixed update via {@link clearTransients},
 * so each press/release is observed by exactly one simulation step.
 */
/** Keys whose default browser action (page scroll) we suppress. */
const PREVENT_DEFAULT = new Set([
    "ArrowLeft",
    "ArrowRight",
    "ArrowUp",
    "ArrowDown",
    "Space",
]);
export class Input {
    constructor(target = window) {
        this.held = new Set();
        this.pressed = new Set();
        this.released = new Set();
        this.onKeyDown = (e) => {
            if (PREVENT_DEFAULT.has(e.code))
                e.preventDefault();
            if (e.repeat)
                return; // auto-repeat is not a fresh press
            if (!this.held.has(e.code))
                this.pressed.add(e.code);
            this.held.add(e.code);
        };
        this.onKeyUp = (e) => {
            this.held.delete(e.code);
            this.released.add(e.code);
        };
        target.addEventListener("keydown", this.onKeyDown);
        target.addEventListener("keyup", this.onKeyUp);
    }
    isDown(code) {
        return this.held.has(code);
    }
    justPressed(code) {
        return this.pressed.has(code);
    }
    justReleased(code) {
        return this.released.has(code);
    }
    /** True if any of the given codes is currently held. */
    anyDown(codes) {
        return codes.some((c) => this.held.has(c));
    }
    /** True if any of the given codes went down this step. */
    anyPressed(codes) {
        return codes.some((c) => this.pressed.has(c));
    }
    /** True if any of the given codes came up this step. */
    anyReleased(codes) {
        return codes.some((c) => this.released.has(c));
    }
    /** Clear edge-triggered sets. Call once at the end of every fixed update. */
    clearTransients() {
        this.pressed.clear();
        this.released.clear();
    }
}
//# sourceMappingURL=Input.js.map