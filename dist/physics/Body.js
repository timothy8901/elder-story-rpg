/**
 * A movable physics body: an axis-aligned box with a position and velocity,
 * plus the small bits of state the collision resolver needs. Pure data —
 * {@link Physics.step} mutates it; entities own one.
 */
export class Body {
    constructor(x, y, w, h) {
        /** Velocity in pixels per second. */
        this.vel = { x: 0, y: 0 };
        /** Set by the resolver when the body is resting on a floor this step. */
        this.onGround = false;
        /** Last horizontal direction of intent; used for rendering / hitboxes. */
        this.facing = 1;
        /** While > 0, the body falls through one-way platforms. Counts down each step. */
        this.dropThroughTimer = 0;
        this.pos = { x, y };
        this.w = w;
        this.h = h;
    }
    /** The body's current bounding rectangle (a fresh object each call). */
    get rect() {
        return { x: this.pos.x, y: this.pos.y, w: this.w, h: this.h };
    }
    get centerX() {
        return this.pos.x + this.w / 2;
    }
    get centerY() {
        return this.pos.y + this.h / 2;
    }
    get right() {
        return this.pos.x + this.w;
    }
    get bottom() {
        return this.pos.y + this.h;
    }
}
//# sourceMappingURL=Body.js.map