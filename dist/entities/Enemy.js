import { KNOCKBACK, KNOCK_STUN } from "../config.js";
import { Body } from "../physics/Body.js";
import * as Physics from "../physics/Physics.js";
import { drawEnemy } from "../rendering/sprites.js";
import { TileType } from "../types.js";
const SPEED = 55;
const AGGRO_RANGE = 240;
const CHASE_SPEED = 95;
/**
 * A basic melee enemy with patrol + chase behavior. It walks back and forth,
 * turns at walls and ledges, charges the player when close, and can be feared
 * (Illusion). Combat resolution (taking hits, dealing contact damage) lives in
 * {@link CombatSystem}; this class owns movement, health, and rendering.
 */
export class Enemy {
    /** Can this enemy currently be damaged? (Alduin is immune unless Dragonrended.) */
    isImmune() {
        return false;
    }
    /** Apply the Dragonrend shout (grounds dragons + makes them mortal). No-op for normal foes. */
    applyDragonrend(_seconds) { }
    /** An active ranged damage zone (e.g. fire breath), or null. */
    attackZone() {
        return null;
    }
    /** A projectile the enemy fires this frame (e.g. a Dwarf's destruction bolt), or null. */
    consumeRangedAttack() {
        return null;
    }
    constructor(x, y, opts) {
        this.dead = false;
        this.hurtTimer = 0;
        this.attackCooldown = 0;
        this.fleeTimer = 0;
        /** While > 0, the enemy is staggered and carries its knockback (no steering). */
        this.knockTimer = 0;
        /** Whether the most recent hit came from a spell (for faction kill objectives). */
        this.lastHitBySpell = false;
        /** True for flying dragon-type enemies (subclass {@link Dragon}). */
        this.isDragon = false;
        /** Damage dealt by a ranged attack zone (e.g. a dragon's fire breath). */
        this.breathDamage = 0;
        this.dir = -1;
        this.body = new Body(x, y, opts?.w ?? 30, opts?.h ?? 38);
        this.maxHealth = opts?.health ?? 40;
        this.health = this.maxHealth;
        this.contactDamage = opts?.damage ?? 9;
        this.kind = opts?.kind ?? "Draugr";
        this.lootLevel = opts?.lootLevel ?? 1;
    }
    /** Apply a hit: damage, brief flash, and knockback (with hitstun so it carries). */
    takeHit(damage, knockDir, knockback = KNOCKBACK.hit) {
        this.health -= damage;
        this.hurtTimer = 0.18;
        if (knockback > 0) {
            this.body.vel.x += knockDir * knockback;
            this.body.vel.y = -Math.min(260, 80 + knockback * 0.3);
            this.knockTimer = KNOCK_STUN;
        }
        if (this.health <= 0)
            this.dead = true;
    }
    fear(seconds) {
        this.fleeTimer = Math.max(this.fleeTimer, seconds);
    }
    update(dt, map, playerCenterX, _playerCenterY = 0) {
        const b = this.body;
        this.hurtTimer = Math.max(0, this.hurtTimer - dt);
        this.attackCooldown = Math.max(0, this.attackCooldown - dt);
        this.fleeTimer = Math.max(0, this.fleeTimer - dt);
        // Hitstun: while knocked back, carry the launch velocity without steering.
        if (this.knockTimer > 0) {
            this.knockTimer -= dt;
            Physics.step(b, map, dt);
            return;
        }
        const dx = playerCenterX - b.centerX;
        const dist = Math.abs(dx);
        const toPlayer = dx >= 0 ? 1 : -1;
        if (this.fleeTimer > 0) {
            // Run away from the player.
            this.dir = (-toPlayer);
            b.vel.x = this.dir * CHASE_SPEED;
        }
        else if (dist < AGGRO_RANGE) {
            // Chase.
            this.dir = toPlayer;
            b.vel.x = this.dir * CHASE_SPEED;
        }
        else {
            // Patrol.
            b.vel.x = this.dir * SPEED;
        }
        b.facing = this.dir;
        Physics.step(b, map, dt);
        // Turn around at walls (velocity zeroed by the resolver) or at ledges.
        if (b.onGround) {
            const blocked = Math.abs(b.vel.x) < 1 && this.fleeTimer <= 0 && dist >= AGGRO_RANGE;
            const footAheadX = this.dir > 0 ? b.right + 2 : b.pos.x - 2;
            const ground = map.tileAt(map.colAt(footAheadX), map.rowAt(b.bottom + 2));
            const atLedge = ground === TileType.Empty;
            if (blocked || atLedge)
                this.dir = (-this.dir);
        }
    }
    render(r, cam, time) {
        r.withWorld(cam, (ctx) => drawEnemy(ctx, this, time));
    }
}
//# sourceMappingURL=Enemy.js.map