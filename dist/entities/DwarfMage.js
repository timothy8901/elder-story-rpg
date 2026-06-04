import { KNOCKBACK } from "../config.js";
import { drawDwarf } from "../rendering/sprites.js";
import { Enemy } from "./Enemy.js";
/**
 * A Dwemer battle-mage: stout and heavily armored (it soaks damage and resists
 * knockback), it closes to swing a warhammer (high contact damage), lobs
 * destruction bolts from range, and periodically wards itself with a defensive
 * spell that halves incoming damage.
 */
export class DwarfMage extends Enemy {
    constructor(x, y, opts) {
        super(x, y, {
            health: opts.health,
            damage: opts.damage,
            kind: opts.kind,
            lootLevel: opts.lootLevel,
            w: opts.boss ? 40 : 32,
            h: opts.boss ? 50 : 42,
        });
        this.shieldTimer = 0;
        this.pending = null;
        this.boss = opts.boss ?? false;
        this.castTimer = 1.5 + Math.random() * 1.5;
        this.shieldCooldown = 2 + Math.random() * 3;
    }
    /** True while the ward is up (drives the shield bubble + damage soak). */
    get shielded() {
        return this.shieldTimer > 0;
    }
    takeHit(damage, knockDir, knockback = KNOCKBACK.hit) {
        // Heavy armor soaks ~20%; the ward soaks ~60%. Heavy frame resists knockback.
        const reduced = this.shieldTimer > 0 ? damage * 0.4 : damage * 0.8;
        super.takeHit(Math.max(1, reduced), knockDir, knockback * 0.45);
    }
    consumeRangedAttack() {
        const r = this.pending;
        this.pending = null;
        return r;
    }
    update(dt, map, playerCenterX, playerCenterY = 0) {
        this.castTimer -= dt;
        this.shieldTimer = Math.max(0, this.shieldTimer - dt);
        this.shieldCooldown = Math.max(0, this.shieldCooldown - dt);
        super.update(dt, map, playerCenterX, playerCenterY); // chase/patrol + physics + hitstun
        if (this.knockTimer > 0 || this.dead)
            return; // staggered — no casting
        const b = this.body;
        const dx = playerCenterX - b.centerX;
        const dist = Math.abs(dx);
        // Cast the defensive ward when off cooldown.
        if (this.shieldCooldown <= 0 && this.shieldTimer <= 0 && Math.random() < 0.012) {
            this.shieldTimer = 4.5;
            this.shieldCooldown = 9;
        }
        // Lob a destruction bolt at the player from range.
        if (this.castTimer <= 0 && b.onGround && dist > 50 && dist < 380) {
            this.castTimer = this.boss ? 1.3 : 2.4;
            const speed = this.boss ? 360 : 300;
            const ang = Math.atan2(playerCenterY - (b.centerY - 6), dx || (b.facing >= 0 ? 1 : -1));
            this.pending = {
                vx: Math.cos(ang) * speed,
                vy: Math.sin(ang) * speed,
                damage: Math.max(1, Math.round(this.contactDamage * 0.8)),
                color: this.boss ? "#b06bff" : "#ff8a3d",
            };
        }
    }
    render(r, cam, time) {
        r.withWorld(cam, (ctx) => drawDwarf(ctx, this, time));
    }
}
//# sourceMappingURL=DwarfMage.js.map