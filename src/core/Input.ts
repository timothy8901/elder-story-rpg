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
  private readonly held = new Set<string>();
  private readonly pressed = new Set<string>();
  private readonly released = new Set<string>();

  constructor(target: Window = window) {
    target.addEventListener("keydown", this.onKeyDown);
    target.addEventListener("keyup", this.onKeyUp);
  }

  private readonly onKeyDown = (e: KeyboardEvent): void => {
    if (PREVENT_DEFAULT.has(e.code)) e.preventDefault();
    if (e.repeat) return; // auto-repeat is not a fresh press
    if (!this.held.has(e.code)) this.pressed.add(e.code);
    this.held.add(e.code);
  };

  private readonly onKeyUp = (e: KeyboardEvent): void => {
    this.held.delete(e.code);
    this.released.add(e.code);
  };

  isDown(code: string): boolean {
    return this.held.has(code);
  }
  justPressed(code: string): boolean {
    return this.pressed.has(code);
  }
  justReleased(code: string): boolean {
    return this.released.has(code);
  }

  /** True if any of the given codes is currently held. */
  anyDown(codes: readonly string[]): boolean {
    return codes.some((c) => this.held.has(c));
  }
  /** True if any of the given codes went down this step. */
  anyPressed(codes: readonly string[]): boolean {
    return codes.some((c) => this.pressed.has(c));
  }
  /** True if any of the given codes came up this step. */
  anyReleased(codes: readonly string[]): boolean {
    return codes.some((c) => this.released.has(c));
  }

  /** Clear edge-triggered sets. Call once at the end of every fixed update. */
  clearTransients(): void {
    this.pressed.clear();
    this.released.clear();
  }
}
