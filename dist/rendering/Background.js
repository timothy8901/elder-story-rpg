/**
 * Multi-layer parallax backdrops drawn in screen space. Each layer scrolls at a
 * fraction of the camera (further = slower) for depth, MapleStory-style: bright
 * sky + drifting clouds + rolling hills outdoors, a moody glow + crystals in caves.
 */
export function drawBackground(r, cam, map, time) {
    if (map.theme === "cave")
        drawCave(r, cam, time);
    else if (map.theme === "dwarven")
        drawDwarven(r, cam, time);
    else
        drawField(r, cam, time);
}
/** A Dwemer ruin: warm bronze gloom with glowing pipes, gears and rune motifs. */
function drawDwarven(r, cam, time) {
    const ctx = r.ctx;
    const { width: W, height: H } = r;
    const bg = ctx.createLinearGradient(0, 0, 0, H);
    bg.addColorStop(0, "#241a10");
    bg.addColorStop(1, "#140d07");
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);
    // Distant pipe-work silhouettes.
    const span = 220;
    const off = wrap(cam.x * 0.3, span);
    ctx.strokeStyle = "#3a2c18";
    ctx.lineWidth = 8;
    for (let x = off - span; x < W + span; x += span) {
        ctx.beginPath();
        ctx.moveTo(x + 40, H * 0.2);
        ctx.lineTo(x + 40, H * 0.8);
        ctx.lineTo(x + 140, H * 0.8);
        ctx.stroke();
    }
    // Glowing gears + rune lights, gently pulsing.
    const gspan = 300;
    const goff = wrap(cam.x * 0.5, gspan);
    for (let x = goff - gspan, i = 0; x < W + gspan; x += gspan, i++) {
        const pulse = 0.5 + 0.5 * Math.sin(time * 2 + i);
        gear(ctx, x + 90, H * 0.32, 22, `rgba(255,180,70,${0.18 + pulse * 0.18})`);
        const glow = ctx.createRadialGradient(x + 200, H * 0.6, 1, x + 200, H * 0.6, 26);
        glow.addColorStop(0, `rgba(120,220,255,${0.4 + pulse * 0.35})`);
        glow.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(x + 200, H * 0.6, 26, 0, Math.PI * 2);
        ctx.fill();
    }
}
function gear(ctx, x, y, rad, color) {
    ctx.fillStyle = color;
    for (let t = 0; t < Math.PI * 2; t += Math.PI / 6) {
        ctx.fillRect(x + Math.cos(t) * rad - 3, y + Math.sin(t) * rad - 3, 6, 6);
    }
    ctx.beginPath();
    ctx.arc(x, y, rad * 0.7, 0, Math.PI * 2);
    ctx.fill();
}
/** Wrap an offset into [-span, 0) so a repeating motif tiles seamlessly. */
function wrap(offset, span) {
    let o = -(offset % span);
    if (o > 0)
        o -= span;
    return o;
}
function drawField(r, cam, time) {
    const ctx = r.ctx;
    const { width: W, height: H } = r;
    // Sky gradient.
    const sky = ctx.createLinearGradient(0, 0, 0, H);
    sky.addColorStop(0, "#6ec6f5");
    sky.addColorStop(0.55, "#b6e6fb");
    sky.addColorStop(1, "#e9f8ef");
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, W, H);
    // Sun glow (top-right, fixed).
    const sun = ctx.createRadialGradient(W - 140, 96, 12, W - 140, 96, 130);
    sun.addColorStop(0, "rgba(255,250,210,0.95)");
    sun.addColorStop(1, "rgba(255,250,210,0)");
    ctx.fillStyle = sun;
    ctx.beginPath();
    ctx.arc(W - 140, 96, 130, 0, Math.PI * 2);
    ctx.fill();
    // Far rolling hills.
    drawHills(ctx, W, H, wrap(cam.x * 0.2, 460), 460, H * 0.62, 150, "#bfe3a4");
    drawHills(ctx, W, H, wrap(cam.x * 0.35, 380), 380, H * 0.72, 130, "#9fd47e");
    // Drifting clouds (slow parallax + gentle time drift).
    const cloudSpan = 360;
    const cloudOff = wrap(cam.x * 0.15 + time * 8, cloudSpan);
    ctx.fillStyle = "rgba(255,255,255,0.92)";
    for (let x = cloudOff - cloudSpan; x < W + cloudSpan; x += cloudSpan) {
        cloud(ctx, x + 60, 70);
        cloud(ctx, x + 230, 130);
    }
    // Near tree/bush silhouettes along the bottom.
    drawHills(ctx, W, H, wrap(cam.x * 0.55, 300), 300, H * 0.84, 120, "#79bd66");
}
function cloud(ctx, x, y) {
    ctx.beginPath();
    ctx.arc(x, y, 16, 0, Math.PI * 2);
    ctx.arc(x + 18, y - 8, 20, 0, Math.PI * 2);
    ctx.arc(x + 40, y, 16, 0, Math.PI * 2);
    ctx.arc(x + 20, y + 6, 18, 0, Math.PI * 2);
    ctx.fill();
}
/** A row of overlapping soft mounds forming a hill band down to the bottom. */
function drawHills(ctx, W, H, offset, span, baseY, amp, color) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(offset - span, H);
    for (let x = offset - span; x < W + span; x += span) {
        ctx.quadraticCurveTo(x + span * 0.5, baseY - amp, x + span, baseY);
    }
    ctx.lineTo(W + span, H);
    ctx.closePath();
    ctx.fill();
}
function drawCave(r, cam, time) {
    const ctx = r.ctx;
    const { width: W, height: H } = r;
    const bg = ctx.createLinearGradient(0, 0, 0, H);
    bg.addColorStop(0, "#1b1530");
    bg.addColorStop(1, "#0b0814");
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);
    // Distant rock layers (jagged silhouettes).
    rockLayer(ctx, W, H, wrap(cam.x * 0.25, 240), 240, H * 0.55, "#241d3a");
    rockLayer(ctx, W, H, wrap(cam.x * 0.45, 200), 200, H * 0.68, "#2c2347");
    // Glowing crystals, gently pulsing.
    const span = 320;
    const off = wrap(cam.x * 0.45, span);
    for (let x = off - span, i = 0; x < W + span; x += span, i++) {
        const pulse = 0.6 + 0.4 * Math.sin(time * 2 + i);
        crystal(ctx, x + 90, H * 0.7, 10, 26, `rgba(120,220,255,${0.5 + pulse * 0.4})`);
        crystal(ctx, x + 210, H * 0.62, 7, 18, `rgba(180,150,255,${0.4 + pulse * 0.4})`);
    }
}
function rockLayer(ctx, W, H, offset, span, baseY, color) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(offset - span, H);
    let toggle = 0;
    for (let x = offset - span; x < W + span; x += span / 2) {
        ctx.lineTo(x + span / 4, baseY - (toggle ? 26 : -10));
        toggle ^= 1;
    }
    ctx.lineTo(W + span, H);
    ctx.closePath();
    ctx.fill();
}
function crystal(ctx, x, y, w, h, color) {
    const glow = ctx.createRadialGradient(x, y, 1, x, y, h);
    glow.addColorStop(0, color);
    glow.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(x, y, h, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(x, y - h);
    ctx.lineTo(x + w, y);
    ctx.lineTo(x, y + h);
    ctx.lineTo(x - w, y);
    ctx.closePath();
    ctx.fill();
}
//# sourceMappingURL=Background.js.map