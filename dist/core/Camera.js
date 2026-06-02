import { CAMERA_LERP, VIEW_H, VIEW_W } from "../config.js";
/**
 * A 2D camera that smoothly follows a world-space target and never reveals
 * space outside the map. `(x, y)` is the world coordinate shown at the
 * top-left of the viewport; the renderer subtracts it to map world -> screen.
 */
export class Camera {
    constructor(worldW, worldH) {
        this.worldW = worldW;
        this.worldH = worldH;
        this.x = 0;
        this.y = 0;
    }
    /** Update the map bounds (e.g. after a map change). */
    setBounds(worldW, worldH) {
        this.worldW = worldW;
        this.worldH = worldH;
    }
    /** Ease toward centering on a world-space target point. */
    follow(targetX, targetY) {
        const destX = targetX - VIEW_W / 2;
        const destY = targetY - VIEW_H / 2;
        this.x += (destX - this.x) * CAMERA_LERP;
        this.y += (destY - this.y) * CAMERA_LERP;
        this.clamp();
    }
    /** Jump instantly to center on a target (no easing) — used on spawn. */
    snapTo(targetX, targetY) {
        this.x = targetX - VIEW_W / 2;
        this.y = targetY - VIEW_H / 2;
        this.clamp();
    }
    /** Keep the viewport inside the map. If the map is smaller, pin to 0. */
    clamp() {
        const maxX = Math.max(0, this.worldW - VIEW_W);
        const maxY = Math.max(0, this.worldH - VIEW_H);
        this.x = Math.min(Math.max(this.x, 0), maxX);
        this.y = Math.min(Math.max(this.y, 0), maxY);
    }
}
//# sourceMappingURL=Camera.js.map