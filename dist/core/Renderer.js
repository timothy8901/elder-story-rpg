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
        this.ctx.fillRect(Math.round(x - cam.renderX), Math.round(y - cam.renderY), Math.round(w), Math.round(h));
    }
    strokeRectWorld(cam, x, y, w, h, color, lineWidth = 1) {
        this.ctx.strokeStyle = color;
        this.ctx.lineWidth = lineWidth;
        // +0.5 aligns the 1px stroke to the pixel grid.
        this.ctx.strokeRect(Math.round(x - cam.renderX) + 0.5, Math.round(y - cam.renderY) + 0.5, Math.round(w) - 1, Math.round(h) - 1);
    }
    /**
     * Run a draw callback in world space: the context is translated by the
     * (rounded) camera offset so callers can draw rich sprites directly in world
     * coordinates. Used for entities, tiles, projectiles and portals.
     */
    withWorld(cam, draw) {
        const ctx = this.ctx;
        ctx.save();
        ctx.translate(-Math.round(cam.renderX), -Math.round(cam.renderY));
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
    /**
     * Lighting/atmosphere post-pass (screen space): an optional warm glow centered
     * on a focus point, a per-theme color tint, and an edge vignette. Drawn after
     * the world but before the HUD so UI stays full-bright. Glows/gradients are
     * intentionally smooth — light reads fine that way over pixel art.
     */
    vignette(tint, tintAlpha, focusX, focusY) {
        const ctx = this.ctx;
        const W = this.width, H = this.height;
        ctx.save();
        if (focusX != null && focusY != null) {
            const glow = ctx.createRadialGradient(focusX, focusY, 8, focusX, focusY, 230);
            glow.addColorStop(0, "rgba(255,244,206,0.16)");
            glow.addColorStop(1, "rgba(255,244,206,0)");
            ctx.fillStyle = glow;
            ctx.fillRect(0, 0, W, H);
        }
        if (tint) {
            ctx.globalAlpha = tintAlpha;
            ctx.fillStyle = tint;
            ctx.fillRect(0, 0, W, H);
            ctx.globalAlpha = 1;
        }
        const rad = Math.max(W, H) * 0.78;
        const vg = ctx.createRadialGradient(W / 2, H * 0.46, rad * 0.55, W / 2, H * 0.46, rad);
        vg.addColorStop(0, "rgba(0,0,0,0)");
        vg.addColorStop(1, "rgba(0,0,0,0.5)");
        ctx.fillStyle = vg;
        ctx.fillRect(0, 0, W, H);
        ctx.restore();
    }
    // --- Rounded rectangles (UI panels / bars) ---
    roundPath(x, y, w, h, radius) {
        const ctx = this.ctx;
        const r = Math.min(radius, w / 2, h / 2);
        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.arcTo(x + w, y, x + w, y + h, r);
        ctx.arcTo(x + w, y + h, x, y + h, r);
        ctx.arcTo(x, y + h, x, y, r);
        ctx.arcTo(x, y, x + w, y, r);
        ctx.closePath();
    }
    fillRoundRect(x, y, w, h, radius, color) {
        this.roundPath(x, y, w, h, radius);
        this.ctx.fillStyle = color;
        this.ctx.fill();
    }
    strokeRoundRect(x, y, w, h, radius, color, lineWidth = 1) {
        this.roundPath(x, y, w, h, radius);
        this.ctx.strokeStyle = color;
        this.ctx.lineWidth = lineWidth;
        this.ctx.stroke();
    }
}
//# sourceMappingURL=Renderer.js.map