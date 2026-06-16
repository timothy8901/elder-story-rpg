import type { Dragon } from "../entities/Dragon.js";
import type { DwarfMage } from "../entities/DwarfMage.js";
import type { Enemy } from "../entities/Enemy.js";
import type { NPC } from "../entities/NPC.js";
import type { Player } from "../entities/Player.js";
import type { MapExit } from "../world/GameMap.js";
import { atlas, type AnimState } from "./Atlas.js";

/**
 * Procedural "pixel-art-adjacent" sprite drawing. Everything is composed from
 * canvas primitives (rounded rects, arcs, gradients) so the look is bright and
 * cartoony — MapleStory-flavored — with no external image assets. All functions
 * draw in world coordinates and expect a camera-translated context.
 */

const OUTLINE = "#241c2e";

/** Horizontal speed (px/s) above which a grounded entity reads as "walking". */
const WALK_VX = 18;

function playerState(p: Player): AnimState {
  if (p.hurtTimer > 0) return "hurt";
  if (p.attackTimer > 0) return "attack";
  if (p.body.onGround && Math.abs(p.body.vel.x) > WALK_VX) return "walk";
  return "idle";
}

function groundState(e: { hurtTimer: number; body: { onGround: boolean; vel: { x: number } } }): AnimState {
  if (e.hurtTimer > 0) return "hurt";
  if (e.body.onGround && Math.abs(e.body.vel.x) > WALK_VX) return "walk";
  return "idle";
}

// ---------------------------------------------------------------------------
// Player — a chibi adventurer
// ---------------------------------------------------------------------------

export function drawPlayer(ctx: CanvasRenderingContext2D, p: Player, time: number): void {
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
    if (p.sneaking) ctx.globalAlpha = 0.9;
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
    if (p.attackTimer > 0) slashFx(ctx, cx, y + h * 0.45, dir, 1 - p.attackTimer / 0.18);
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
  if (p.sneaking) ctx.globalAlpha = 0.85;
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

function drawArmWeapon(
  ctx: CanvasRenderingContext2D,
  p: Player,
  cx: number,
  y: number,
  shift: number,
  dir: number,
  skin: string,
  behind: boolean,
): void {
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
function enemyKey(kind: string): string {
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

function enemyScale(key: string): number {
  // Quadrupeds sit in the lower part of the cell, so scale them up to read at a
  // comparable size to the upright figures.
  return key === "wolf" ? 1.9 : 1.6;
}

function capColorFor(kind: string): { cap: string; capShade: string } {
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

export function drawEnemy(ctx: CanvasRenderingContext2D, e: Enemy, time: number): void {
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
  } else {
    eye(ctx, cx - 5 + dir * 2, bodyTop + 9);
    eye(ctx, cx + 6 + dir * 2, bodyTop + 9);
    // mouth
    ctx.strokeStyle = "#7a4a36";
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    if (e.fleeTimer > 0) {
      ctx.arc(cx + dir, bodyTop + 16, 2.2, Math.PI, 0); // worried (open)
    } else {
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

function dragonPalette(kind: string): { body: string; belly: string; wing: string; horn: string; eye: string; hi: string } {
  if (kind === "Alduin") return { body: "#2b2533", belly: "#463f54", wing: "#1c1726", horn: "#0c0a12", eye: "#ff3b30", hi: "#5b5168" };
  if (kind === "Sahloknir") return { body: "#7d6a3a", belly: "#b79a55", wing: "#5e4f2c", horn: "#352b1c", eye: "#ffd24a", hi: "#c9ad6a" };
  return { body: "#3f7d4a", belly: "#80c06a", wing: "#2f5e38", horn: "#23401f", eye: "#ffd24a", hi: "#9ad97e" };
}

/** Dark outline + a reusable low-res buffer so the dragon renders as crisp flat pixel art. */
const DRAGON_OUTLINE = "#15101c";
let dragonBuf: HTMLCanvasElement | null = null;

export function drawDragon(ctx: CanvasRenderingContext2D, d: Dragon, time: number): void {
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
    // Flat banded flame (no smooth gradient) to match the pixel art.
    ctx.imageSmoothingEnabled = false;
    const bands: Array<[string, number, number]> = [
      ["rgba(206,58,26,0.8)", 0.62, 1.95], // outer red, drawn first (widest)
      ["rgba(255,150,55,0.92)", 0.32, 1.45], // mid orange
      ["rgba(255,236,150,0.96)", 0, 1.0], // bright core
    ];
    for (const [col, t, spread] of bands) {
      const yy = z.y + z.h * t;
      ctx.fillStyle = col;
      ctx.beginPath();
      ctx.moveTo(z.x - z.w * (spread - 1) * 0.5, yy);
      ctx.lineTo(z.x + z.w * (1 + (spread - 1) * 0.5), yy);
      ctx.lineTo(z.x + z.w * spread, z.y + z.h);
      ctx.lineTo(z.x - z.w * (spread - 1), z.y + z.h);
      ctx.closePath();
      ctx.fill();
    }
  }

  // --- Body: draw into a low-res buffer, then upscale nearest-neighbor so the
  // curves become crisp pixels (3 screen px per art pixel, matching the cast). ---
  const PXD = 3;
  const LMINX = -Math.max(w * 0.74, 72); // covers the fixed-size wings on small dragons
  const LMINY = -Math.max(h * 0.8, 54);
  const MAXX = Math.max(w * 0.72, 20);
  const MAXY = Math.max(h * 0.52, 30);
  const LW = MAXX - LMINX;
  const LH = MAXY - LMINY;
  const bcw = Math.max(1, Math.round(LW / PXD));
  const bch = Math.max(1, Math.round(LH / PXD));
  if (!dragonBuf) dragonBuf = document.createElement("canvas");
  dragonBuf.width = bcw;
  dragonBuf.height = bch;
  const g = dragonBuf.getContext("2d");
  if (g) {
    g.imageSmoothingEnabled = false;
    g.save();
    g.scale(1 / PXD, 1 / PXD);
    g.translate(-LMINX, -LMINY); // draw in the same local coords as before
    g.lineJoin = "round";
    g.lineWidth = PXD; // ~1 buffer pixel
    g.strokeStyle = DRAGON_OUTLINE;

    // Wings (flap above the body).
    g.fillStyle = pal.wing;
    const wingA = -0.5 + flap * 0.4;
    for (const off of [4, -10]) {
      g.save();
      g.translate(-6, -8);
      g.rotate(wingA);
      g.beginPath();
      g.moveTo(0, 0);
      g.quadraticCurveTo(-34, -30, -58, -10 + off);
      g.lineTo(-40, 2 + off * 0.4);
      g.lineTo(-46, 12 + off * 0.3);
      g.lineTo(-26, 6);
      g.quadraticCurveTo(-14, 6, 0, 8);
      g.closePath();
      g.fill();
      g.stroke();
      g.restore();
    }

    // Tail.
    g.fillStyle = pal.body;
    g.beginPath();
    g.moveTo(-w * 0.3, -2);
    g.quadraticCurveTo(-w * 0.6, -10, -w * 0.52, 2);
    g.quadraticCurveTo(-w * 0.62, 2, -w * 0.52, 8);
    g.quadraticCurveTo(-w * 0.6, 12, -w * 0.3, 8);
    g.closePath();
    g.fill();
    g.stroke();

    // Body + lighter belly + back highlight (flat tone bands).
    g.beginPath();
    g.ellipse(0, 0, w * 0.34, h * 0.42, 0, 0, Math.PI * 2);
    g.fillStyle = pal.body;
    g.fill();
    g.stroke();
    g.fillStyle = pal.belly;
    g.beginPath();
    g.ellipse(0, h * 0.16, w * 0.26, h * 0.22, 0, 0, Math.PI * 2);
    g.fill();
    g.fillStyle = pal.hi;
    g.beginPath();
    g.ellipse(-w * 0.04, -h * 0.16, w * 0.2, h * 0.1, 0, 0, Math.PI * 2);
    g.fill();

    // Legs.
    g.fillStyle = pal.body;
    for (const lx of [-w * 0.08, w * 0.16]) {
      g.beginPath();
      rr(g, lx, h * 0.2, 7, 12, 3);
      g.fill();
      g.stroke();
    }

    // Neck + head (front).
    g.fillStyle = pal.body;
    g.beginPath();
    g.moveTo(w * 0.2, -h * 0.1);
    g.quadraticCurveTo(w * 0.4, -h * 0.5, w * 0.5, -h * 0.32);
    g.lineTo(w * 0.5, -h * 0.05);
    g.quadraticCurveTo(w * 0.36, 0, w * 0.2, h * 0.1);
    g.closePath();
    g.fill();
    g.stroke();
    g.beginPath();
    g.ellipse(w * 0.5, -h * 0.34, 11, 8, 0, 0, Math.PI * 2);
    g.fill();
    g.stroke();
    // Snout.
    g.beginPath();
    g.moveTo(w * 0.56, -h * 0.4);
    g.lineTo(w * 0.66, -h * 0.34);
    g.lineTo(w * 0.56, -h * 0.26);
    g.closePath();
    g.fill();
    g.stroke();
    // Horns.
    g.fillStyle = pal.horn;
    g.beginPath();
    g.moveTo(w * 0.46, -h * 0.42);
    g.lineTo(w * 0.4, -h * 0.62);
    g.lineTo(w * 0.5, -h * 0.46);
    g.closePath();
    g.fill();
    // Eye (a hard pixel block).
    g.fillStyle = pal.eye;
    g.fillRect(w * 0.5, -h * 0.39, 3, 3);
    g.restore();
  }

  // Blit the buffer to the world, mirrored by facing, upscaled crisp.
  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(b.facing, 1);
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(dragonBuf, 0, 0, bcw, bch, LMINX, LMINY, bcw * PXD, bch * PXD);

  // Dragonrend shackles — pixel sparks orbiting the dragon.
  if (d.dragonrendTimer > 0) {
    ctx.globalAlpha = 0.7;
    ctx.fillStyle = "#b06bff";
    for (let i = 0; i < 6; i++) {
      const a = time * 5 + i * 1.05;
      const px = Math.round((Math.cos(a) * w * 0.34) / PXD) * PXD;
      const py = Math.round((Math.sin(a) * h * 0.32) / PXD) * PXD;
      ctx.fillRect(px - PXD, py - PXD, PXD * 2, PXD * 2);
    }
    ctx.globalAlpha = 1;
  }

  // Hurt flash (body-shaped white pop).
  if (d.hurtTimer > 0) {
    ctx.globalAlpha = 0.4;
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.ellipse(0, -h * 0.02, w * 0.38, h * 0.46, 0, 0, Math.PI * 2);
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

export function drawDwarf(ctx: CanvasRenderingContext2D, d: DwarfMage, time: number): void {
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

// ---------------------------------------------------------------------------
// NPCs — robed faction recruiters with a name tag + quest marker
// ---------------------------------------------------------------------------

export type NpcMarker = "" | "?" | "!" | "$";

export function drawNpc(ctx: CanvasRenderingContext2D, npc: NPC, marker: NpcMarker, time: number): void {
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
function npcKey(npc: NPC): string {
  if (npc.vendor) return "npc_merchant";
  if (npc.faction) return `npc_${npc.faction}`;
  if (npc.story === "arngeir") return "npc_arngeir";
  if (npc.story === "calcelmo") return "npc_calcelmo";
  return "npc_courier";
}

/** Floating name tag + quest marker, shared by both NPC render paths. */
function drawNpcTag(
  ctx: CanvasRenderingContext2D,
  npc: NPC,
  marker: NpcMarker,
  time: number,
  cx: number,
  y: number,
): void {
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
export function drawQuestArrow(ctx: CanvasRenderingContext2D, cx: number, topY: number, time: number): void {
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

export function drawProjectile(
  ctx: CanvasRenderingContext2D,
  p: { x: number; y: number; vx: number; color: string },
  time: number,
): void {
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
export function drawEdgeGate(ctx: CanvasRenderingContext2D, exit: MapExit, mapWidth: number, time: number): void {
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

export function drawPortal(ctx: CanvasRenderingContext2D, exit: MapExit, time: number): void {
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

function rr(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, radius: number): void {
  const r = Math.min(radius, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function limb(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, color: string): void {
  ctx.fillStyle = color;
  rr(ctx, x, y, w, h, 3);
  ctx.fill();
  ctx.stroke();
}

function shadow(ctx: CanvasRenderingContext2D, cx: number, y: number, rx: number): void {
  ctx.save();
  ctx.globalAlpha = 0.22;
  ctx.fillStyle = "#000";
  ctx.beginPath();
  ctx.ellipse(cx, y - 1, rx, 4.5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function eye(ctx: CanvasRenderingContext2D, x: number, y: number): void {
  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  ctx.ellipse(x, y, 2.6, 3.2, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#241c2e";
  ctx.beginPath();
  ctx.arc(x, y + 0.5, 1.5, 0, Math.PI * 2);
  ctx.fill();
}

function crossEye(ctx: CanvasRenderingContext2D, x: number, y: number): void {
  ctx.beginPath();
  ctx.moveTo(x - 2.5, y - 2.5);
  ctx.lineTo(x + 2.5, y + 2.5);
  ctx.moveTo(x + 2.5, y - 2.5);
  ctx.lineTo(x - 2.5, y + 2.5);
  ctx.stroke();
}

function foot(ctx: CanvasRenderingContext2D, x: number, y: number): void {
  ctx.beginPath();
  ctx.ellipse(x, y, 4, 3, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
}

function spot(ctx: CanvasRenderingContext2D, x: number, y: number, r: number): void {
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
}

/** A bright crescent sweep in front of the player during a melee swing (t: 0..1). */
function slashFx(ctx: CanvasRenderingContext2D, cx: number, cy: number, dir: number, t: number): void {
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
function healthBar(
  ctx: CanvasRenderingContext2D,
  health: number,
  max: number,
  cx: number,
  by: number,
  bw: number,
  opts?: { hi?: string; name?: string; nameColor?: string },
): void {
  if (health >= max) return;
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
