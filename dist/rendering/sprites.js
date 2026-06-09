import { atlas } from "./Atlas.js";
/**
 * Procedural "pixel-art-adjacent" sprite drawing. Everything is composed from
 * canvas primitives (rounded rects, arcs, gradients) so the look is bright and
 * cartoony — MapleStory-flavored — with no external image assets. All functions
 * draw in world coordinates and expect a camera-translated context.
 */
const OUTLINE = "#241c2e";
/** Horizontal speed (px/s) above which a grounded entity reads as "walking". */
const WALK_VX = 18;
function playerState(p) {
    if (p.hurtTimer > 0)
        return "hurt";
    if (p.attackTimer > 0)
        return "attack";
    if (p.body.onGround && Math.abs(p.body.vel.x) > WALK_VX)
        return "walk";
    return "idle";
}
function groundState(e) {
    if (e.hurtTimer > 0)
        return "hurt";
    if (e.body.onGround && Math.abs(e.body.vel.x) > WALK_VX)
        return "walk";
    return "idle";
}
// ---------------------------------------------------------------------------
// Player — a chibi adventurer
// ---------------------------------------------------------------------------
export function drawPlayer(ctx, p, time) {
    const b = p.body;
    const dir = b.facing;
    const x = b.pos.x;
    const y = b.pos.y;
    const w = b.w;
    const h = b.h;
    const cx = x + w / 2;
    const feetY = y + h;
    // Pixel-art sprite path (falls back to the procedural figure below).
    const pkey = p.beastMode ? "werewolf" : "hero";
    if (atlas.has(pkey)) {
        ctx.save();
        shadow(ctx, cx, feetY, w * 0.5);
        if (p.sneaking)
            ctx.globalAlpha = 0.9;
        const pPhase = p.attackTimer > 0 ? 1 - p.attackTimer / 0.18 : undefined;
        // Squash/stretch while airborne (feet stay planted), eased to none at apex.
        const k = b.onGround ? 0 : Math.min(1, Math.abs(b.vel.y) / 900);
        ctx.save();
        if (k > 0) {
            ctx.translate(cx, feetY);
            ctx.scale(1 - 0.12 * k, 1 + 0.16 * k);
            ctx.translate(-cx, -feetY);
        }
        atlas.drawAnimated(ctx, pkey, playerState(p), cx, feetY, h * (p.sneaking ? 1.32 : 1.5), dir < 0, time, pPhase);
        ctx.restore();
        ctx.globalAlpha = 1;
        if (p.attackTimer > 0)
            slashFx(ctx, cx, y + h * 0.45, dir, 1 - p.attackTimer / 0.18);
        if (p.blocking) {
            const sxp = cx + dir * 13;
            const syp = y + h * 0.55;
            ctx.lineJoin = "round";
            ctx.lineWidth = 1.5;
            ctx.strokeStyle = OUTLINE;
            ctx.fillStyle = "#cfd6e0";
            rr(ctx, sxp - 5, syp - 9, 10, 18, 5);
            ctx.fill();
            ctx.stroke();
            ctx.fillStyle = "#9aa6b6";
            ctx.beginPath();
            ctx.arc(sxp, syp, 3, 0, Math.PI * 2);
            ctx.fill();
        }
        if (p.hurtTimer > 0) {
            ctx.globalAlpha = 0.4;
            ctx.fillStyle = "#ff5555";
            rr(ctx, x - 2, y - 4, w + 4, h + 6, 8);
            ctx.fill();
            ctx.globalAlpha = 1;
        }
        ctx.restore();
        return;
    }
    const crouch = p.sneaking ? 7 : 0;
    const moving = b.onGround && Math.abs(b.vel.x) > 20;
    const phase = time * 12;
    const walk = moving ? Math.sin(phase) : 0;
    const bob = moving ? Math.abs(Math.cos(phase)) * 1.5 : 0;
    const shift = crouch - bob;
    ctx.save();
    if (p.sneaking)
        ctx.globalAlpha = 0.85;
    ctx.lineJoin = "round";
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = OUTLINE;
    // Shadow.
    shadow(ctx, cx, feetY, w * 0.5);
    const beast = p.beastMode;
    const skin = beast ? "#7a5230" : "#ffd9a8";
    const hair = beast ? "#41280f" : "#5a3a1c";
    const tunic = beast ? "#5a3a1c" : "#3f78c0";
    const tunicShade = beast ? "#43290f" : "#2d5994";
    const pants = beast ? "#41280f" : "#39405a";
    // Legs (swing while walking).
    const legY = feetY - 12;
    limb(ctx, cx - 7 + walk * 3, legY, 7, 12, pants);
    limb(ctx, cx + 1 - walk * 3, legY, 7, 12, pants);
    // Back arm + weapon behind the body (drawn first so it sits behind torso).
    drawArmWeapon(ctx, p, cx, y, shift, dir, skin, /* behind */ true);
    // Torso.
    const torsoY = y + 21 + shift;
    rr(ctx, cx - 10, torsoY, 20, 15, 5);
    ctx.fillStyle = tunic;
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = tunicShade;
    rr(ctx, cx - 10, torsoY + 9, 20, 6, 4);
    ctx.fill();
    // Head.
    const headCy = y + 12 + shift;
    ctx.beginPath();
    ctx.arc(cx, headCy, 11, 0, Math.PI * 2);
    ctx.fillStyle = skin;
    ctx.fill();
    ctx.stroke();
    // Hair (top cap + fringe).
    ctx.save();
    ctx.beginPath();
    ctx.rect(cx - 13, headCy - 14, 26, 13);
    ctx.clip();
    ctx.beginPath();
    ctx.arc(cx, headCy, 12, 0, Math.PI * 2);
    ctx.fillStyle = hair;
    ctx.fill();
    ctx.restore();
    ctx.fillStyle = hair;
    ctx.beginPath();
    ctx.moveTo(cx - 11, headCy - 1);
    ctx.quadraticCurveTo(cx + dir * 4, headCy + 3, cx + 11, headCy - 2);
    ctx.lineTo(cx + 11, headCy - 5);
    ctx.lineTo(cx - 11, headCy - 5);
    ctx.closePath();
    ctx.fill();
    // Beast Form: pointed ears.
    if (beast) {
        ctx.fillStyle = hair;
        for (const sx of [-8, 8]) {
            ctx.beginPath();
            ctx.moveTo(cx + sx - 3, headCy - 8);
            ctx.lineTo(cx + sx + 3, headCy - 8);
            ctx.lineTo(cx + sx, headCy - 16);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
        }
    }
    // Face (eyes look toward facing; small smile).
    const ex = cx + dir * 2;
    eye(ctx, ex + dir * 4, headCy + 2);
    eye(ctx, ex - dir * 2, headCy + 2);
    ctx.strokeStyle = "#9c5a3c";
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.arc(ex + dir * 1, headCy + 6, 2.4, 0.15 * Math.PI, 0.85 * Math.PI);
    ctx.stroke();
    // Front arm + weapon.
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = 1.5;
    drawArmWeapon(ctx, p, cx, y, shift, dir, skin, /* behind */ false);
    // Shield while blocking.
    if (p.blocking) {
        const sx = cx + dir * 12;
        const sy = y + 24 + shift;
        ctx.fillStyle = "#cfd6e0";
        rr(ctx, sx - 5, sy - 9, 10, 18, 5);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = "#9aa6b6";
        ctx.beginPath();
        ctx.arc(sx, sy, 3, 0, Math.PI * 2);
        ctx.fill();
    }
    // Hurt flash.
    if (p.hurtTimer > 0) {
        ctx.globalAlpha = 0.4;
        ctx.fillStyle = "#ff5555";
        rr(ctx, x - 2, y - 4, w + 4, h + 6, 8);
        ctx.fill();
        ctx.globalAlpha = 1;
    }
    ctx.restore();
}
function drawArmWeapon(ctx, p, cx, y, shift, dir, skin, behind) {
    // Only the front (weapon) arm draws the sword; the back arm is a simple stub.
    if (behind) {
        limb(ctx, cx - dir * 9 - 3, y + 24 + shift, 5, 11, skin);
        return;
    }
    const shoulderX = cx + dir * 8;
    const shoulderY = y + 25 + shift;
    // Swing angle: rest pose, or sweep during an attack.
    let angle = -0.5;
    if (p.attackTimer > 0) {
        const t = 1 - p.attackTimer / 0.18; // 0..1 through the swing
        angle = -1.3 + t * 2.2;
    }
    ctx.save();
    ctx.translate(shoulderX, shoulderY);
    ctx.scale(dir, 1);
    ctx.rotate(angle);
    // Arm.
    ctx.fillStyle = skin;
    rr(ctx, -2, -2, 12, 5, 2.5);
    ctx.fill();
    ctx.stroke();
    // Sword: hilt, guard, blade.
    ctx.fillStyle = "#6b4a2a";
    ctx.fillRect(9, -1.5, 5, 3); // grip
    ctx.fillStyle = "#caa24a";
    ctx.fillRect(13, -4, 2, 8); // guard
    const blade = ctx.createLinearGradient(15, 0, 34, 0);
    blade.addColorStop(0, "#eef2f7");
    blade.addColorStop(1, "#a9b6c7");
    ctx.fillStyle = blade;
    ctx.beginPath();
    ctx.moveTo(15, -2.5);
    ctx.lineTo(31, -2);
    ctx.lineTo(35, 0);
    ctx.lineTo(31, 2);
    ctx.lineTo(15, 2.5);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();
}
// ---------------------------------------------------------------------------
// Enemies — cute mushroom monsters
// ---------------------------------------------------------------------------
/** Map an enemy `kind` to its atlas sprite, and a per-sprite height factor. */
function enemyKey(kind) {
    switch (kind) {
        case "Wolf":
            return "wolf";
        case "Bandit":
            return "bandit";
        case "Draugr":
            return "draugr";
        case "Draugr Lord":
            return "draugr_overlord";
        default:
            return "bandit";
    }
}
function enemyScale(key) {
    // Quadrupeds sit in the lower part of the cell, so scale them up to read at a
    // comparable size to the upright figures.
    return key === "wolf" ? 1.9 : 1.6;
}
function capColorFor(kind) {
    switch (kind) {
        case "Wolf":
            return { cap: "#8a8f98", capShade: "#6c727c" };
        case "Bandit":
            return { cap: "#d39a4e", capShade: "#a9762f" };
        case "Draugr":
            return { cap: "#6f7bd6", capShade: "#505bb0" };
        case "Draugr Lord":
            return { cap: "#9b6fd6", capShade: "#7650b0" };
        default:
            return { cap: "#e06a52", capShade: "#b84a36" };
    }
}
export function drawEnemy(ctx, e, time) {
    const b = e.body;
    const x = b.pos.x;
    const y = b.pos.y;
    const w = b.w;
    const h = b.h;
    const cx = x + w / 2;
    const feetY = y + h;
    const dir = b.facing;
    // Pixel-art sprite path (falls back to the mushroom figure below).
    const ekey = enemyKey(e.kind);
    if (atlas.has(ekey)) {
        ctx.save();
        shadow(ctx, cx, feetY, w * 0.5);
        atlas.drawAnimated(ctx, ekey, groundState(e), cx, feetY, h * enemyScale(ekey), dir < 0, time);
        if (e.hurtTimer > 0) {
            ctx.globalAlpha = 0.5;
            ctx.fillStyle = "#ffffff";
            rr(ctx, x, y, w, h, 8);
            ctx.fill();
            ctx.globalAlpha = 1;
        }
        ctx.restore();
        healthBar(ctx, e.health, e.maxHealth, cx, y - 10, w + 4);
        return;
    }
    const bob = Math.sin(time * 6 + cx * 0.12) * 1.4;
    const { cap, capShade } = capColorFor(e.kind);
    ctx.save();
    ctx.lineJoin = "round";
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = OUTLINE;
    shadow(ctx, cx, feetY, w * 0.5);
    // Little feet shuffle.
    const step = Math.sin(time * 8 + cx) * 2;
    ctx.fillStyle = "#caa46f";
    foot(ctx, cx - 6 + step, feetY - 3);
    foot(ctx, cx + 6 - step, feetY - 3);
    // Cream body.
    const bodyTop = y + h * 0.42 + bob;
    ctx.fillStyle = "#f4e7ca";
    rr(ctx, x + 3, bodyTop, w - 6, feetY - bodyTop - 1, 8);
    ctx.fill();
    ctx.stroke();
    // Mushroom cap dome.
    const capCy = bodyTop + 2;
    const g = ctx.createLinearGradient(0, capCy - h * 0.36, 0, capCy);
    g.addColorStop(0, cap);
    g.addColorStop(1, capShade);
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.ellipse(cx, capCy, w / 2 + 3, h * 0.36, 0, Math.PI, 0);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    // Spots.
    ctx.fillStyle = "rgba(255,248,232,0.92)";
    spot(ctx, cx - 7, capCy - 7, 3);
    spot(ctx, cx + 6, capCy - 5, 2.4);
    spot(ctx, cx + 1, capCy - 11, 2);
    // Face.
    const hurt = e.hurtTimer > 0;
    if (hurt) {
        ctx.strokeStyle = "#5a2b2b";
        ctx.lineWidth = 1.6;
        crossEye(ctx, cx - 5 + dir * 2, bodyTop + 9);
        crossEye(ctx, cx + 6 + dir * 2, bodyTop + 9);
        ctx.strokeStyle = OUTLINE;
    }
    else {
        eye(ctx, cx - 5 + dir * 2, bodyTop + 9);
        eye(ctx, cx + 6 + dir * 2, bodyTop + 9);
        // mouth
        ctx.strokeStyle = "#7a4a36";
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        if (e.fleeTimer > 0) {
            ctx.arc(cx + dir, bodyTop + 16, 2.2, Math.PI, 0); // worried (open)
        }
        else {
            ctx.arc(cx + dir, bodyTop + 14, 2.4, 0.1 * Math.PI, 0.9 * Math.PI);
        }
        ctx.stroke();
    }
    // Hurt flash overlay.
    if (hurt) {
        ctx.globalAlpha = 0.5;
        ctx.fillStyle = "#ffffff";
        rr(ctx, x, y, w, h, 8);
        ctx.fill();
        ctx.globalAlpha = 1;
    }
    ctx.restore();
    // Health bar (only when damaged).
    if (e.health < e.maxHealth) {
        const frac = Math.max(0, e.health / e.maxHealth);
        const bw = w + 4;
        const bx = cx - bw / 2;
        const by = y - 10;
        ctx.fillStyle = "rgba(0,0,0,0.55)";
        rr(ctx, bx - 1, by - 1, bw + 2, 6, 3);
        ctx.fill();
        ctx.fillStyle = frac > 0.5 ? "#5cd167" : frac > 0.25 ? "#e0c14a" : "#e0584a";
        rr(ctx, bx, by, bw * frac, 4, 2);
        ctx.fill();
    }
}
// ---------------------------------------------------------------------------
// Dragons
// ---------------------------------------------------------------------------
function dragonPalette(kind) {
    if (kind === "Alduin")
        return { body: "#2b2533", belly: "#463f54", wing: "#1c1726", horn: "#0c0a12", eye: "#ff3b30" };
    if (kind === "Sahloknir")
        return { body: "#7d6a3a", belly: "#b79a55", wing: "#5e4f2c", horn: "#352b1c", eye: "#ffd24a" };
    return { body: "#3f7d4a", belly: "#80c06a", wing: "#2f5e38", horn: "#23401f", eye: "#ffd24a" };
}
export function drawDragon(ctx, d, time) {
    const b = d.body;
    const cx = b.centerX;
    const cy = b.centerY;
    const w = b.w;
    const h = b.h;
    const pal = dragonPalette(d.kind);
    const flap = Math.sin(time * 7);
    // Fire breath (drawn in world space, pours straight down).
    const z = d.attackZone();
    if (z) {
        const fg = ctx.createLinearGradient(0, z.y, 0, z.y + z.h);
        fg.addColorStop(0, "rgba(255,225,130,0.95)");
        fg.addColorStop(0.4, "rgba(255,140,50,0.8)");
        fg.addColorStop(1, "rgba(190,40,20,0)");
        ctx.fillStyle = fg;
        ctx.beginPath();
        ctx.moveTo(z.x, z.y);
        ctx.lineTo(z.x + z.w, z.y);
        ctx.lineTo(z.x + z.w * 1.9, z.y + z.h);
        ctx.lineTo(z.x - z.w * 0.9, z.y + z.h);
        ctx.closePath();
        ctx.fill();
    }
    ctx.save();
    ctx.translate(cx, cy);
    ctx.scale(b.facing, 1); // art is authored facing +x
    ctx.lineJoin = "round";
    ctx.lineWidth = 2;
    ctx.strokeStyle = "#15101c";
    // Wings (flap above the body).
    ctx.fillStyle = pal.wing;
    const wingA = -0.5 + flap * 0.4;
    for (const off of [4, -10]) {
        ctx.save();
        ctx.translate(-6, -8);
        ctx.rotate(wingA);
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.quadraticCurveTo(-34, -30, -58, -10 + off);
        ctx.lineTo(-40, 2 + off * 0.4);
        ctx.lineTo(-46, 12 + off * 0.3);
        ctx.lineTo(-26, 6);
        ctx.quadraticCurveTo(-14, 6, 0, 8);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();
    }
    // Tail.
    ctx.fillStyle = pal.body;
    ctx.beginPath();
    ctx.moveTo(-w * 0.3, -2);
    ctx.quadraticCurveTo(-w * 0.6, -10, -w * 0.52, 2);
    ctx.quadraticCurveTo(-w * 0.62, 2, -w * 0.52, 8);
    ctx.quadraticCurveTo(-w * 0.6, 12, -w * 0.3, 8);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    // Body.
    ctx.beginPath();
    ctx.ellipse(0, 0, w * 0.34, h * 0.42, 0, 0, Math.PI * 2);
    ctx.fillStyle = pal.body;
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = pal.belly;
    ctx.beginPath();
    ctx.ellipse(0, h * 0.16, w * 0.26, h * 0.22, 0, 0, Math.PI * 2);
    ctx.fill();
    // Legs.
    ctx.fillStyle = pal.body;
    for (const lx of [-w * 0.08, w * 0.16]) {
        ctx.beginPath();
        rr(ctx, lx, h * 0.2, 7, 12, 3);
        ctx.fill();
        ctx.stroke();
    }
    // Neck + head (front).
    ctx.fillStyle = pal.body;
    ctx.beginPath();
    ctx.moveTo(w * 0.2, -h * 0.1);
    ctx.quadraticCurveTo(w * 0.4, -h * 0.5, w * 0.5, -h * 0.32);
    ctx.lineTo(w * 0.5, -h * 0.05);
    ctx.quadraticCurveTo(w * 0.36, 0, w * 0.2, h * 0.1);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    // Head.
    ctx.beginPath();
    ctx.ellipse(w * 0.5, -h * 0.34, 11, 8, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    // Snout.
    ctx.beginPath();
    ctx.moveTo(w * 0.56, -h * 0.4);
    ctx.lineTo(w * 0.66, -h * 0.34);
    ctx.lineTo(w * 0.56, -h * 0.26);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    // Horns.
    ctx.fillStyle = pal.horn;
    ctx.beginPath();
    ctx.moveTo(w * 0.46, -h * 0.42);
    ctx.lineTo(w * 0.4, -h * 0.62);
    ctx.lineTo(w * 0.5, -h * 0.46);
    ctx.closePath();
    ctx.fill();
    // Eye.
    ctx.fillStyle = pal.eye;
    ctx.beginPath();
    ctx.arc(w * 0.52, -h * 0.36, 2.2, 0, Math.PI * 2);
    ctx.fill();
    // Dragonrend shackles (held to the earth).
    if (d.dragonrendTimer > 0) {
        ctx.globalAlpha = 0.5;
        ctx.strokeStyle = "#b06bff";
        ctx.lineWidth = 2;
        for (let i = 0; i < 5; i++) {
            const a = time * 6 + i;
            ctx.beginPath();
            ctx.arc(Math.cos(a) * w * 0.3, Math.sin(a) * h * 0.3, 3, 0, Math.PI * 2);
            ctx.stroke();
        }
        ctx.globalAlpha = 1;
    }
    // Hurt flash.
    if (d.hurtTimer > 0) {
        ctx.globalAlpha = 0.45;
        ctx.fillStyle = "#ffffff";
        ctx.beginPath();
        ctx.ellipse(0, 0, w * 0.4, h * 0.5, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
    }
    ctx.restore();
    // Name + health bar for named dragons or any damaged dragon.
    if (d.health < d.maxHealth) {
        const frac = Math.max(0, d.health / d.maxHealth);
        const bw = w * 0.8;
        const bx = cx - bw / 2;
        const by = cy - h * 0.7;
        ctx.fillStyle = "rgba(0,0,0,0.6)";
        rr(ctx, bx - 1, by - 1, bw + 2, 7, 3);
        ctx.fill();
        ctx.fillStyle = d.isImmune() ? "#7e879a" : frac > 0.4 ? "#e0584a" : "#ffd24a";
        rr(ctx, bx, by, bw * frac, 5, 2);
        ctx.fill();
        if (d.named) {
            ctx.fillStyle = "#eaf6ff";
            ctx.font = "bold 11px monospace";
            ctx.textAlign = "center";
            ctx.fillText(d.kind, cx, by - 5);
        }
    }
}
// ---------------------------------------------------------------------------
// Dwemer battle-mages
// ---------------------------------------------------------------------------
export function drawDwarf(ctx, d, time) {
    const b = d.body;
    const x = b.pos.x;
    const y = b.pos.y;
    const w = b.w;
    const h = b.h;
    const cx = x + w / 2;
    const feetY = y + h;
    const dir = b.facing;
    const bronze = d.boss ? "#cda94e" : "#9c7a3e";
    const bronzeDk = d.boss ? "#8a6e2c" : "#6e5428";
    const steel = "#80808e";
    const beard = d.boss ? "#d8c074" : "#b9a06a";
    // Pixel-art sprite path (falls back to the procedural figure below).
    const dkey = d.boss ? "dwarven_warlord" : "dwarven_battlemage";
    if (atlas.has(dkey)) {
        ctx.save();
        shadow(ctx, cx, feetY, w * 0.55);
        atlas.drawAnimated(ctx, dkey, groundState(d), cx, feetY, h * 1.55, dir < 0, time);
        if (d.shielded) {
            ctx.strokeStyle = "rgba(120,200,255,0.85)";
            ctx.fillStyle = `rgba(120,200,255,${0.12 + 0.06 * Math.sin(time * 8)})`;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(cx, y + h * 0.45, w * 0.75, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
        }
        if (d.hurtTimer > 0) {
            ctx.globalAlpha = 0.45;
            ctx.fillStyle = "#ffffff";
            rr(ctx, x, y, w, h, 6);
            ctx.fill();
            ctx.globalAlpha = 1;
        }
        ctx.restore();
        const frac = Math.max(0, d.health / d.maxHealth);
        healthBar(ctx, d.health, d.maxHealth, cx, y - (d.boss ? 14 : 10), w + 4, {
            hi: frac > 0.4 ? "#cda94e" : "#e0584a",
            name: d.boss ? d.kind : undefined,
            nameColor: "#e8d27a",
        });
        return;
    }
    ctx.save();
    ctx.lineJoin = "round";
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = OUTLINE;
    shadow(ctx, cx, feetY, w * 0.55);
    // Legs (short, armored).
    ctx.fillStyle = bronzeDk;
    for (const lx of [cx - 8, cx + 1]) {
        rr(ctx, lx, feetY - 12, 8, 12, 3);
        ctx.fill();
        ctx.stroke();
    }
    // Warhammer (behind the body), raised.
    ctx.save();
    ctx.translate(cx - dir * 10, y + h * 0.4);
    ctx.scale(dir, 1);
    ctx.strokeStyle = OUTLINE;
    ctx.fillStyle = "#6b4a2a";
    rr(ctx, -3, -26, 5, 34, 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = steel;
    rr(ctx, -10, -34, 18, 14, 3);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
    // Torso (broad bronze cuirass).
    ctx.fillStyle = bronze;
    rr(ctx, cx - w * 0.42, y + h * 0.34, w * 0.84, h * 0.5, 8);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = bronzeDk;
    ctx.fillRect(cx - w * 0.42, y + h * 0.62, w * 0.84, 4); // belt
    // Pauldrons.
    ctx.fillStyle = bronze;
    for (const sx of [cx - w * 0.42, cx + w * 0.42]) {
        ctx.beginPath();
        ctx.arc(sx, y + h * 0.4, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
    }
    // Head: skin, big beard, steel helm with horns.
    const headCy = y + h * 0.2;
    ctx.fillStyle = "#d9b48a";
    ctx.beginPath();
    ctx.arc(cx, headCy, 9, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    // Beard (trapezoid under the face).
    ctx.fillStyle = beard;
    ctx.beginPath();
    ctx.moveTo(cx - 8, headCy + 2);
    ctx.lineTo(cx + 8, headCy + 2);
    ctx.lineTo(cx + 5, y + h * 0.42);
    ctx.lineTo(cx - 5, y + h * 0.42);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    // Helm.
    ctx.fillStyle = steel;
    ctx.beginPath();
    ctx.arc(cx, headCy - 1, 9.5, Math.PI, 0);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = steel;
    ctx.fillRect(cx - 9, headCy - 2, 18, 3); // brow band
    // Horns.
    ctx.fillStyle = d.boss ? "#e8d27a" : "#5a5560";
    for (const s of [-1, 1]) {
        ctx.beginPath();
        ctx.moveTo(cx + s * 8, headCy - 3);
        ctx.lineTo(cx + s * 13, headCy - 11);
        ctx.lineTo(cx + s * 6, headCy - 5);
        ctx.closePath();
        ctx.fill();
    }
    // Glowing eyes.
    ctx.fillStyle = d.boss ? "#ff6b6b" : "#ffd24a";
    ctx.fillRect(cx + dir * 2 - 4, headCy, 3, 2);
    ctx.fillRect(cx + dir * 2 + 1, headCy, 3, 2);
    // Defensive ward bubble.
    if (d.shielded) {
        ctx.strokeStyle = "rgba(120,200,255,0.85)";
        ctx.fillStyle = `rgba(120,200,255,${0.12 + 0.06 * Math.sin(time * 8)})`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(cx, y + h * 0.45, w * 0.75, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
    }
    // Hurt flash.
    if (d.hurtTimer > 0) {
        ctx.globalAlpha = 0.45;
        ctx.fillStyle = "#ffffff";
        rr(ctx, x, y, w, h, 6);
        ctx.fill();
        ctx.globalAlpha = 1;
    }
    ctx.restore();
    // Health bar (+ name for the Warlord).
    if (d.health < d.maxHealth) {
        const frac = Math.max(0, d.health / d.maxHealth);
        const bw = w + 4;
        const bx = cx - bw / 2;
        const by = y - (d.boss ? 14 : 10);
        ctx.fillStyle = "rgba(0,0,0,0.6)";
        rr(ctx, bx - 1, by - 1, bw + 2, 6, 3);
        ctx.fill();
        ctx.fillStyle = frac > 0.4 ? "#cda94e" : "#e0584a";
        rr(ctx, bx, by, bw * frac, 4, 2);
        ctx.fill();
        if (d.boss) {
            ctx.fillStyle = "#e8d27a";
            ctx.font = "bold 11px monospace";
            ctx.textAlign = "center";
            ctx.fillText(d.kind, cx, by - 5);
        }
    }
}
export function drawNpc(ctx, npc, marker, time) {
    const { x, y, w, h, color, facing } = npc;
    const cx = x + w / 2;
    const feetY = y + h;
    // Pixel-art sprite path (falls back to the robed figure below).
    const nkey = npcKey(npc);
    if (atlas.has(nkey)) {
        ctx.save();
        shadow(ctx, cx, feetY, w * 0.5);
        atlas.drawAnimated(ctx, nkey, "idle", cx, feetY, h * 1.5, facing < 0, time);
        ctx.restore();
        drawNpcTag(ctx, npc, marker, time, cx, y);
        return;
    }
    ctx.save();
    ctx.lineJoin = "round";
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = OUTLINE;
    shadow(ctx, cx, feetY, w * 0.5);
    // Robe (tapered body).
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(cx - 6, y + 18);
    ctx.lineTo(cx + 6, y + 18);
    ctx.lineTo(cx + 11, feetY);
    ctx.lineTo(cx - 11, feetY);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    // Head + hood.
    const headCy = y + 12;
    ctx.beginPath();
    ctx.arc(cx, headCy, 10, 0, Math.PI * 2);
    ctx.fillStyle = "#ffd9a8";
    ctx.fill();
    ctx.stroke();
    ctx.save();
    ctx.beginPath();
    ctx.rect(cx - 12, headCy - 12, 24, 9);
    ctx.clip();
    ctx.beginPath();
    ctx.arc(cx, headCy, 11, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
    ctx.restore();
    // Eyes toward the player.
    eye(ctx, cx + facing * 3 + 2, headCy + 2);
    eye(ctx, cx + facing * 3 - 3, headCy + 2);
    ctx.restore();
    drawNpcTag(ctx, npc, marker, time, cx, y);
}
/** Choose the atlas sprite for an NPC by vendor/faction/story identity. */
function npcKey(npc) {
    if (npc.vendor)
        return "npc_merchant";
    if (npc.faction)
        return `npc_${npc.faction}`;
    if (npc.story === "arngeir")
        return "npc_arngeir";
    if (npc.story === "calcelmo")
        return "npc_calcelmo";
    return "npc_courier";
}
/** Floating name tag + quest marker, shared by both NPC render paths. */
function drawNpcTag(ctx, npc, marker, time, cx, y) {
    ctx.fillStyle = "rgba(0,0,0,0.55)";
    ctx.font = "11px monospace";
    ctx.textAlign = "center";
    const tagW = ctx.measureText(npc.name).width + 12;
    rr(ctx, cx - tagW / 2, y - 22, tagW, 15, 4);
    ctx.fill();
    ctx.fillStyle = "#e8edf4";
    ctx.fillText(npc.name, cx, y - 11);
    // Marker bobbing above: "?" quest to give, "!" quest to complete, "$" vendor.
    if (marker) {
        const by = y - 34 + Math.sin(time * 4) * 2;
        ctx.font = "bold 20px monospace";
        ctx.fillStyle = marker === "!" ? "#7dffa0" : marker === "$" ? "#ffe45e" : "#ffd45e";
        ctx.textAlign = "center";
        ctx.fillText(marker, cx, by);
    }
}
/** A small bobbing down-arrow drawn above an enemy tied to an active quest. */
export function drawQuestArrow(ctx, cx, topY, time) {
    const y = topY - 14 + Math.sin(time * 5) * 3;
    ctx.fillStyle = "#ffd45e";
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(cx - 6, y);
    ctx.lineTo(cx + 6, y);
    ctx.lineTo(cx, y + 9);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
}
// ---------------------------------------------------------------------------
// Projectiles & portals
// ---------------------------------------------------------------------------
export function drawProjectile(ctx, p, time) {
    // Soft glow halo.
    const halo = ctx.createRadialGradient(p.x, p.y, 1, p.x, p.y, 16);
    halo.addColorStop(0, p.color);
    halo.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = halo;
    ctx.beginPath();
    ctx.arc(p.x, p.y, 16, 0, Math.PI * 2);
    ctx.fill();
    // Trailing sparkles behind the direction of travel.
    const dir = Math.sign(p.vx) || 1;
    for (let i = 1; i <= 3; i++) {
        ctx.globalAlpha = 0.5 / i;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x - dir * i * 7, p.y + Math.sin(time * 20 + i) * 2, 4 - i, 0, Math.PI * 2);
        ctx.fill();
    }
    ctx.globalAlpha = 1;
    // Bright core.
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
    ctx.fill();
}
/**
 * A MapleStory-style side gate: a soft glow column at the map edge with
 * chevrons sliding toward it and the destination name. `mapWidth` locates the
 * right edge; a `rect.x` of 0 means the left edge.
 */
export function drawEdgeGate(ctx, exit, mapWidth, time) {
    const r = exit.rect;
    const left = r.x < 1;
    const dir = left ? -1 : 1;
    const bandW = 64;
    const bandX = left ? 0 : mapWidth - bandW;
    const grad = ctx.createLinearGradient(left ? bandX + bandW : bandX, 0, left ? bandX : bandX + bandW, 0);
    grad.addColorStop(0, "rgba(150,210,255,0)");
    grad.addColorStop(1, "rgba(150,210,255,0.4)");
    ctx.fillStyle = grad;
    ctx.fillRect(bandX, r.y, bandW, r.h);
    // Chevrons sliding toward the edge.
    const midY = r.y + r.h * 0.6;
    for (let i = 0; i < 3; i++) {
        const t = (time * 36 + i * 18) % 54;
        const cxp = left ? 50 - t : mapWidth - 50 + t;
        ctx.strokeStyle = `rgba(225,242,255,${0.85 - i * 0.22})`;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(cxp - dir * 7, midY - 9);
        ctx.lineTo(cxp, midY);
        ctx.lineTo(cxp - dir * 7, midY + 9);
        ctx.stroke();
    }
    // Destination label.
    ctx.fillStyle = "#eaf6ff";
    ctx.font = "bold 12px monospace";
    ctx.textAlign = "center";
    ctx.fillText(exit.label, left ? 78 : mapWidth - 78, r.y + r.h * 0.34);
}
export function drawPortal(ctx, exit, time) {
    const r = exit.rect;
    const cx = r.x + r.w / 2;
    const cy = r.y + r.h / 2;
    const rx = r.w * 0.7;
    const ry = r.h * 0.5;
    // Outer glow.
    const glow = ctx.createRadialGradient(cx, cy, 2, cx, cy, ry);
    glow.addColorStop(0, "rgba(150,210,255,0.55)");
    glow.addColorStop(1, "rgba(80,140,255,0)");
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
    ctx.fill();
    // Concentric swirling rings.
    for (let i = 0; i < 4; i++) {
        const t = time * 1.5 + i * 0.6;
        const scale = 0.5 + 0.5 * Math.abs(Math.sin(t));
        ctx.strokeStyle = `rgba(${140 + i * 20}, ${200 - i * 10}, 255, ${0.5})`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.ellipse(cx, cy, rx * scale, ry * scale, 0, 0, Math.PI * 2);
        ctx.stroke();
    }
    // Orbiting sparkle.
    const a = time * 3;
    ctx.fillStyle = "#eaf6ff";
    ctx.beginPath();
    ctx.arc(cx + Math.cos(a) * rx * 0.7, cy + Math.sin(a) * ry * 0.7, 2.2, 0, Math.PI * 2);
    ctx.fill();
    // Label.
    ctx.fillStyle = "#dcecff";
    ctx.font = "bold 11px monospace";
    ctx.textAlign = "center";
    ctx.fillText(exit.label, cx, r.y - 6);
}
// ---------------------------------------------------------------------------
// Shared primitives
// ---------------------------------------------------------------------------
function rr(ctx, x, y, w, h, radius) {
    const r = Math.min(radius, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
}
function limb(ctx, x, y, w, h, color) {
    ctx.fillStyle = color;
    rr(ctx, x, y, w, h, 3);
    ctx.fill();
    ctx.stroke();
}
function shadow(ctx, cx, y, rx) {
    ctx.save();
    ctx.globalAlpha = 0.22;
    ctx.fillStyle = "#000";
    ctx.beginPath();
    ctx.ellipse(cx, y - 1, rx, 4.5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
}
function eye(ctx, x, y) {
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.ellipse(x, y, 2.6, 3.2, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#241c2e";
    ctx.beginPath();
    ctx.arc(x, y + 0.5, 1.5, 0, Math.PI * 2);
    ctx.fill();
}
function crossEye(ctx, x, y) {
    ctx.beginPath();
    ctx.moveTo(x - 2.5, y - 2.5);
    ctx.lineTo(x + 2.5, y + 2.5);
    ctx.moveTo(x + 2.5, y - 2.5);
    ctx.lineTo(x - 2.5, y + 2.5);
    ctx.stroke();
}
function foot(ctx, x, y) {
    ctx.beginPath();
    ctx.ellipse(x, y, 4, 3, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
}
function spot(ctx, x, y, r) {
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
}
/** A bright crescent sweep in front of the player during a melee swing (t: 0..1). */
function slashFx(ctx, cx, cy, dir, t) {
    const a = -1.0 + t * 2.0; // sweep top -> bottom
    ctx.save();
    ctx.translate(cx + dir * 6, cy);
    ctx.scale(dir, 1);
    ctx.globalAlpha = 0.35 + 0.5 * (1 - t);
    ctx.lineCap = "round";
    ctx.strokeStyle = "rgba(255,255,255,0.95)";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(0, 0, 26, a - 0.55, a + 0.1);
    ctx.stroke();
    ctx.strokeStyle = "rgba(170,215,255,0.7)";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(0, 0, 21, a - 0.55, a + 0.1);
    ctx.stroke();
    ctx.restore();
    ctx.globalAlpha = 1;
}
/** A floating health bar (drawn only when damaged); optional name above it. */
function healthBar(ctx, health, max, cx, by, bw, opts) {
    if (health >= max)
        return;
    const frac = Math.max(0, health / max);
    const bx = cx - bw / 2;
    ctx.fillStyle = "rgba(0,0,0,0.6)";
    rr(ctx, bx - 1, by - 1, bw + 2, 6, 3);
    ctx.fill();
    ctx.fillStyle = opts?.hi ?? (frac > 0.5 ? "#5cd167" : frac > 0.25 ? "#e0c14a" : "#e0584a");
    rr(ctx, bx, by, bw * frac, 4, 2);
    ctx.fill();
    if (opts?.name) {
        ctx.fillStyle = opts.nameColor ?? "#ffffff";
        ctx.font = "bold 11px monospace";
        ctx.textAlign = "center";
        ctx.fillText(opts.name, cx, by - 5);
    }
}
//# sourceMappingURL=sprites.js.map