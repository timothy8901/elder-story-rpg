import { AIR_ACCEL, COYOTE_TIME, DROP_THROUGH_TIME, FRICTION, HURT_STUN, JUMP_BUFFER, JUMP_CUT, JUMP_VELOCITY, KNOCKBACK, MAX_RUN_SPEED, MOVE_ACCEL, PLAYER_H, PLAYER_W, TILE_SIZE, } from "../config.js";
import { Body } from "../physics/Body.js";
import * as Physics from "../physics/Physics.js";
import { drawPlayer } from "../rendering/sprites.js";
import { TileType } from "../types.js";
import { Entity } from "./Entity.js";
/** Key bindings, by `KeyboardEvent.code`. Multiple keys map to one action. */
const KEYS = {
    left: ["ArrowLeft", "KeyA"],
    right: ["ArrowRight", "KeyD"],
    jump: ["Space", "ArrowUp", "KeyW"],
    down: ["ArrowDown", "KeyS"],
    attack: ["KeyJ"],
    block: ["KeyL"],
    sneak: ["ShiftLeft", "ShiftRight", "KeyC"],
};
/** Sneaking scales movement speed by this factor. */
const SNEAK_SPEED_SCALE = 0.5;
/** Brief invulnerability after taking a hit. */
const HURT_INVULN = 0.6;
/**
 * The player avatar. Translates input into acceleration and jumps, applies a
 * few feel niceties (coyote time, jump buffering, variable jump height,
 * drop-through), then hands its body to the physics resolver.
 */
export class Player extends Entity {
    constructor(x, y) {
        super();
        /** Time left during which a jump is still allowed after leaving the ground. */
        this.coyote = 0;
        /** Time left during which a buffered jump press stays valid. */
        this.buffer = 0;
        // --- Combat state (read by the CombatSystem / Game) ---
        /** >0 while a melee swing is animating. */
        this.attackTimer = 0;
        /** >0 while another attack cannot yet start. */
        this.attackCooldown = 0;
        this.blocking = false;
        this.sneaking = false;
        /** Movement speed multiplier (e.g. Companions' Beast Form). */
        this.speedMult = 1;
        /** Whether Beast Form is active (drives the sprite tint). */
        this.beastMode = false;
        /** >0 briefly after taking a hit (flash + knockback). */
        this.hurtTimer = 0;
        this.invuln = 0;
        this.pendingAttack = false;
        this.body = new Body(x, y, PLAYER_W, PLAYER_H);
    }
    update(dt, ctx) {
        const { input, map } = ctx;
        const b = this.body;
        const left = input.anyDown(KEYS.left);
        const right = input.anyDown(KEYS.right);
        const down = input.anyDown(KEYS.down);
        const jumpPressed = input.anyPressed(KEYS.jump);
        const jumpReleased = input.anyReleased(KEYS.jump);
        // Combat-related input + timers.
        this.sneaking = input.anyDown(KEYS.sneak) && b.onGround;
        this.blocking = input.anyDown(KEYS.block) && b.onGround;
        this.attackTimer = Math.max(0, this.attackTimer - dt);
        this.attackCooldown = Math.max(0, this.attackCooldown - dt);
        this.hurtTimer = Math.max(0, this.hurtTimer - dt);
        this.invuln = Math.max(0, this.invuln - dt);
        // Stagger: while hurt the player can't act and carries the knockback.
        if (this.hurtTimer > 0) {
            this.sneaking = false;
            this.blocking = false;
            this.coyote = Math.max(0, this.coyote - dt);
            this.buffer = Math.max(0, this.buffer - dt);
            Physics.step(b, map, dt);
            return;
        }
        if (!this.blocking && this.attackCooldown <= 0 && input.anyPressed(KEYS.attack)) {
            this.pendingAttack = true;
            this.attackTimer = 0.18;
            this.attackCooldown = 0.32;
        }
        const speedScale = this.blocking ? 0.35 : this.sneaking ? SNEAK_SPEED_SCALE : 1;
        this.applyHorizontal(dt, left, right, speedScale);
        // Refresh coyote/buffer timers.
        this.coyote = b.onGround ? COYOTE_TIME : Math.max(0, this.coyote - dt);
        this.buffer = jumpPressed ? JUMP_BUFFER : Math.max(0, this.buffer - dt);
        if (down && jumpPressed && this.isOnOneWay(map)) {
            // Drop through the platform instead of jumping.
            b.dropThroughTimer = DROP_THROUGH_TIME;
            b.onGround = false;
            this.buffer = 0;
        }
        else if (this.buffer > 0 && this.coyote > 0) {
            // Jump (works within the coyote/buffer grace windows).
            b.vel.y = -JUMP_VELOCITY;
            b.onGround = false;
            this.buffer = 0;
            this.coyote = 0;
        }
        // Variable jump height: releasing jump early cuts the rise short.
        if (jumpReleased && b.vel.y < 0) {
            b.vel.y *= JUMP_CUT;
        }
        Physics.step(b, map, dt);
    }
    /** Horizontal acceleration toward the input direction, or friction when idle. */
    applyHorizontal(dt, left, right, speedScale = 1) {
        const b = this.body;
        const accel = b.onGround ? MOVE_ACCEL : AIR_ACCEL;
        const maxSpeed = MAX_RUN_SPEED * speedScale * this.speedMult;
        if (left && !right) {
            b.vel.x -= accel * dt;
            b.facing = -1;
        }
        else if (right && !left) {
            b.vel.x += accel * dt;
            b.facing = 1;
        }
        else {
            const drop = FRICTION * dt;
            if (Math.abs(b.vel.x) <= drop)
                b.vel.x = 0;
            else
                b.vel.x -= Math.sign(b.vel.x) * drop;
        }
        b.vel.x = Math.max(-maxSpeed, Math.min(maxSpeed, b.vel.x));
    }
    /** Consume a queued attack (returns true exactly once per swing). */
    consumeAttack() {
        if (!this.pendingAttack)
            return false;
        this.pendingAttack = false;
        return true;
    }
    /** Apply a hit: knockback + brief invulnerability. */
    applyHurt(knockDir) {
        this.body.vel.x = knockDir * KNOCKBACK.player;
        this.body.vel.y = -160;
        this.body.onGround = false;
        this.hurtTimer = HURT_STUN;
        this.invuln = HURT_INVULN;
    }
    get isInvulnerable() {
        return this.invuln > 0;
    }
    /** True if the player is standing on a one-way platform (drop-through allowed). */
    isOnOneWay(map) {
        if (!this.body.onGround)
            return false;
        const b = this.body;
        const row = map.rowAt(b.bottom + 1);
        const c0 = map.colAt(b.pos.x);
        const c1 = map.colAt(b.right - 1e-4);
        for (let col = c0; col <= c1; col++) {
            if (map.tileAt(col, row) === TileType.OneWay)
                return true;
        }
        return false;
    }
    render(r, cam, time) {
        r.withWorld(cam, (ctx) => drawPlayer(ctx, this, time));
    }
    /** Tile coordinate of the player's center (for the debug overlay). */
    tileCoord() {
        return {
            col: Math.floor(this.body.centerX / TILE_SIZE),
            row: Math.floor(this.body.centerY / TILE_SIZE),
        };
    }
}
//# sourceMappingURL=Player.js.map