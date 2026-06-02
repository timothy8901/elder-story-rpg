/**
 * A thin wrapper over the 2D canvas context. Offers two coordinate spaces:
 *  - **World** draws (`*World`) are offset by the camera — for tiles, entities.
 *  - **Screen** draws (`*Screen`, `text`) are absolute — for HUD / debug.
 *
 * World draws snap to integer pixels to keep placeholder blocks crisp.
 */
export class Renderer {
    constructor(canvas) {
        const ctx = canvas.getContext("2d");
        if (!ctx)
            throw new Error("Could not acquire a 2D canvas context.");
        this.ctx = ctx;
        this.width = canvas.width;
        this.height = canvas.height;
        this.ctx.imageSmoothingEnabled = false;
    }
    /** Fill the whole canvas with a solid color. */
    clear(color) {
        this.ctx.fillStyle = color;
        this.ctx.fillRect(0, 0, this.width, this.height);
    }
    // --- World space (camera-relative) ---
    fillRectWorld(cam, x, y, w, h, color) {
        this.ctx.fillStyle = color;
        this.ctx.fillRect(Math.round(x - cam.x), Math.round(y - cam.y), Math.round(w), Math.round(h));
    }
    strokeRectWorld(cam, x, y, w, h, color, lineWidth = 1) {
        this.ctx.strokeStyle = color;
        this.ctx.lineWidth = lineWidth;
        // +0.5 aligns the 1px stroke to the pixel grid.
        this.ctx.strokeRect(Math.round(x - cam.x) + 0.5, Math.round(y - cam.y) + 0.5, Math.round(w) - 1, Math.round(h) - 1);
    }
    /**
     * Run a draw callback in world space: the context is translated by the
     * (rounded) camera offset so callers can draw rich sprites directly in world
     * coordinates. Used for entities, tiles, projectiles and portals.
     */
    withWorld(cam, draw) {
        const ctx = this.ctx;
        ctx.save();
        ctx.translate(-Math.round(cam.x), -Math.round(cam.y));
        draw(ctx);
        ctx.restore();
    }
    // --- Screen space (absolute) ---
    fillRectScreen(x, y, w, h, color) {
        this.ctx.fillStyle = color;
        this.ctx.fillRect(x, y, w, h);
    }
    text(text, x, y, color, font = "12px monospace", align = "left") {
        this.ctx.font = font;
        this.ctx.fillStyle = color;
        this.ctx.textAlign = align;
        this.ctx.textBaseline = "alphabetic";
        this.ctx.fillText(text, x, y);
    }
}
//# sourceMappingURL=Renderer.js.map