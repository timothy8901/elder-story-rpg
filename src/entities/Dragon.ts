import type { Camera } from "../core/Camera.js";
import type { Renderer } from "../core/Renderer.js";
import type { Tilemap } from "../physics/Tilemap.js";
import { drawDragon } from "../rendering/sprites.js";
import type { Rect } from "../types.js";
import { Enemy } from "./Enemy.js";

export interface DragonOpts {
  health: number;
  damage: number;
  kind: string;
  /** Named story dragons (Sahloknir, Alduin) — flagged for soul/quest handling. */
  named?: boolean;
  /** Alduin: invulnerable until grounded by the Dragonrend shout. */
  requiresDragonrend?: boolean;
}

/**
 * A flying dragon. Unlike ground enemies it ignores tilemap gravity: it hovers
 * above the player, periodically swoops down (where melee/spells can reach it)
 * and breathes fire straight down. Alduin can only be harmed while a Dragonrend
 * shout holds him to the earth.
 */
export class Dragon extends Enemy {
  readonly named: boolean;
  readonly requiresDragonrend: boolean;
  dragonrendTimer = 0;

  private t = 0;
  private breathTimer = 2.5;
  private breathActive = 0;
  private breathZone: Rect | null = null;

  constructor(x: number, y: number, opts: DragonOpts) {
    super(x, y, { health: opts.health, damage: opts.damage, kind: opts.kind, lootLevel: 3, w: 80, h: 42 });
    this.isDragon = true;
    this.breathDamage = opts.damage;
    this.named = opts.named ?? false;
    this.requiresDragonrend = opts.requiresDragonrend ?? false;
  }

  override isImmune(): boolean {
    return this.requiresDragonrend && this.dragonrendTimer <= 0;
  }

  override applyDragonrend(seconds: number): void {
    this.dragonrendTimer = Math.max(this.dragonrendTimer, seconds);
  }

  override attackZone(): Rect | null {
    return this.breathActive > 0 ? this.breathZone : null;
  }

  override takeHit(damage: number, _knockDir: number): void {
    if (this.isImmune()) return;
    this.health -= damage;
    this.hurtTimer = 0.16;
    if (this.health <= 0) this.dead = true;
  }

  /** Whether the dragon is low enough that the player can reach it with melee. */
  get vulnerableLow(): boolean {
    return this.dragonrendTimer > 0;
  }

  override update(dt: number, _map: Tilemap, playerCenterX: number, playerCenterY = 0): void {
    this.t += dt;
    this.hurtTimer = Math.max(0, this.hurtTimer - dt);
    this.attackCooldown = Math.max(0, this.attackCooldown - dt);
    this.dragonrendTimer = Math.max(0, this.dragonrendTimer - dt);
    this.breathActive = Math.max(0, this.breathActive - dt);
    if (this.breathActive <= 0) this.breathZone = null;

    const b = this.body;
    const grounded = this.dragonrendTimer > 0;
    const cyc = this.t % 3.6;
    const swooping = cyc < 1.1;

    // Horizontal: drift toward the player, circling a little.
    const targetX = playerCenterX - b.w / 2 + Math.sin(this.t * 0.8) * 70;
    b.pos.x += (targetX - b.pos.x) * 0.04;

    // Altitude: forced low when Dragonrended, dives during a swoop, else hovers high.
    let targetY: number;
    if (grounded) targetY = playerCenterY - b.h * 0.3;
    else if (swooping) targetY = playerCenterY - b.h * 0.5;
    else targetY = playerCenterY - 160;
    b.pos.y += (targetY - b.pos.y) * 0.05;

    b.facing = playerCenterX >= b.centerX ? 1 : -1;

    // Fire breath: while hovering and roughly above the player.
    this.breathTimer -= dt;
    if (this.breathTimer <= 0 && !grounded && !swooping && Math.abs(playerCenterX - b.centerX) < 130) {
      this.breathTimer = 3.5 + Math.random() * 2;
      this.breathActive = 0.5;
      this.breathZone = { x: b.centerX - 20 + b.facing * 12, y: b.bottom, w: 40, h: 460 };
    }
  }

  override render(r: Renderer, cam: Camera, time: number): void {
    r.withWorld(cam, (ctx) => drawDragon(ctx, this, time));
  }
}
