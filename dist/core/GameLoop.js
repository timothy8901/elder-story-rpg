import { FIXED_DT, MAX_FRAME_TIME } from "../config.js";
/** Hard cap on physics steps per frame, preventing a "spiral of death". */
const MAX_STEPS = 8;
/**
 * A fixed-timestep game loop driven by `requestAnimationFrame`.
 *
 * Real elapsed time is accumulated and consumed in fixed {@link FIXED_DT} slices,
 * so physics behaves identically regardless of display refresh rate. Rendering
 * happens once per animation frame after the simulation has caught up.
 */
export class GameLoop {
    constructor(update, render) {
        this.update = update;
        this.render = render;
        this.running = false;
        this.rafId = 0;
        this.lastTime = 0;
        this.accumulator = 0;
        // Rolling FPS estimate (refreshed ~2x/second).
        this._fps = 0;
        this.fpsAccum = 0;
        this.fpsFrames = 0;
        this.frame = (now) => {
            if (!this.running)
                return;
            let frameTime = (now - this.lastTime) / 1000;
            this.lastTime = now;
            if (frameTime > MAX_FRAME_TIME)
                frameTime = MAX_FRAME_TIME;
            this.accumulator += frameTime;
            let steps = 0;
            while (this.accumulator >= FIXED_DT && steps < MAX_STEPS) {
                this.update(FIXED_DT);
                this.accumulator -= FIXED_DT;
                steps++;
            }
            // If we maxed out, drop the backlog instead of trying to catch up forever.
            if (steps === MAX_STEPS)
                this.accumulator = 0;
            this.render();
            this.trackFps(frameTime);
            this.rafId = requestAnimationFrame(this.frame);
        };
    }
    /** Most recent frames-per-second estimate. */
    get fps() {
        return this._fps;
    }
    start() {
        if (this.running)
            return;
        this.running = true;
        this.lastTime = performance.now();
        this.rafId = requestAnimationFrame(this.frame);
    }
    stop() {
        this.running = false;
        cancelAnimationFrame(this.rafId);
    }
    trackFps(frameTime) {
        this.fpsAccum += frameTime;
        this.fpsFrames++;
        if (this.fpsAccum >= 0.5) {
            this._fps = Math.round(this.fpsFrames / this.fpsAccum);
            this.fpsAccum = 0;
            this.fpsFrames = 0;
        }
    }
}
//# sourceMappingURL=GameLoop.js.map