/**
 * Classic floating combat text: numbers pop above a target, drift upward and
 * fade out. Pooled in a simple array and culled when expired.
 */
export class DamageNumbers {
    constructor() {
        this.nums = [];
    }
    spawn(x, y, value, color = "#ff5d5d") {
        this.nums.push({
            x: x + (Math.random() * 14 - 7),
            y,
            vy: -60,
            text: String(Math.max(1, Math.round(value))),
            age: 0,
            life: 0.8,
            color,
        });
    }
    /** Free-text popup (e.g. "Block!", "Miss"). */
    spawnText(x, y, text, color) {
        this.nums.push({ x, y, vy: -50, text, age: 0, life: 0.9, color });
    }
    update(dt) {
        for (const n of this.nums) {
            n.age += dt;
            n.y += n.vy * dt;
            n.vy += 40 * dt; // ease the rise
        }
        this.nums = this.nums.filter((n) => n.age < n.life);
    }
    render(r, cam) {
        for (const n of this.nums) {
            const alpha = 1 - n.age / n.life;
            const sx = Math.round(n.x - cam.x);
            const sy = Math.round(n.y - cam.y);
            r.ctx.globalAlpha = Math.max(0, alpha);
            r.text(n.text, sx + 1, sy + 1, "rgba(0,0,0,0.7)", "bold 16px monospace", "center");
            r.text(n.text, sx, sy, n.color, "bold 16px monospace", "center");
        }
        r.ctx.globalAlpha = 1;
    }
}
//# sourceMappingURL=DamageNumbers.js.map