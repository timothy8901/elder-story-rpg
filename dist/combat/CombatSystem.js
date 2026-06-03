import { KNOCKBACK } from "../config.js";
import { intersects } from "../physics/AABB.js";
import { TileType } from "../types.js";
import { drawProjectile } from "../rendering/sprites.js";
import { DamageNumbers } from "./DamageNumbers.js";
// XP granted per use (the use-to-level economy).
const XP_MELEE_HIT = 6;
const XP_RANGED_HIT = 7;
const XP_SPELL_CAST = 9;
/**
 * Owns transient combat objects (melee hitboxes, projectiles) and the active
 * enemies, and resolves all interactions each step — translating *using* a
 * weapon or spell into damage, knockback, floating numbers, and skill XP.
 */
export class CombatSystem {
    constructor() {
        this.enemies = [];
        this.damageNumbers = new DamageNumbers();
        this.hits = [];
        this.projectiles = [];
    }
    setEnemies(enemies) {
        this.enemies = enemies;
        this.hits = [];
        this.projectiles = [];
    }
    /** Spawn a melee swing hitbox in front of the player. */
    meleeAttack(player, character, equipment, sneaking) {
        const b = player.body;
        const skill = equipment.weaponSkill();
        let damage = equipment.weaponDamage(character) * character.outgoingDamageMult;
        if (sneaking)
            damage *= 2 + character.perkBonus("sneak", "damageMult") + character.sneakAttackBonus; // sneak attack
        const reach = 34;
        const rect = {
            x: b.facing === 1 ? b.right : b.pos.x - reach,
            y: b.pos.y + 4,
            w: reach,
            h: b.h - 6,
        };
        this.hits.push({
            rect,
            life: 0.12,
            damage,
            fire: equipment.weaponFireDamage(),
            skill,
            knockDir: b.facing,
            // A sneak/power attack launches the target much further than a normal swing.
            knockback: sneaking ? KNOCKBACK.power : KNOCKBACK.hit,
            alreadyHit: new Set(),
        });
    }
    /**
     * Attempt to cast a spell. Returns false (and pops a message) if there isn't
     * enough magicka. On success: spends magicka, applies the effect, trains the
     * spell's skill.
     */
    castSpell(spell, player, character, ctx) {
        const costMult = 1 + character.perkBonus(spell.skill, "spellCostMult");
        const cost = Math.max(1, spell.magickaCost * costMult);
        const b = player.body;
        if (character.mp < cost) {
            this.damageNumbers.spawnText(b.centerX, b.pos.y - 12, "No Magicka", "#7db4ff");
            return false;
        }
        character.mp -= cost;
        const potency = 1 + character.perkBonus(spell.skill, "potencyMult") + character.skills[spell.skill].level / 200;
        const power = spell.power * potency;
        switch (spell.kind) {
            case "projectile":
            case "summon":
                this.projectiles.push({
                    x: b.centerX,
                    y: b.centerY,
                    vx: b.facing * 440,
                    vy: 0,
                    life: 1.3,
                    damage: power * character.outgoingDamageMult,
                    skill: spell.skill,
                    color: spell.color,
                });
                break;
            case "heal":
                character.hp = Math.min(character.maxHealth, character.hp + power);
                this.damageNumbers.spawn(b.centerX, b.pos.y - 10, power, spell.color);
                break;
            case "buff":
                character.addArmorBuff(power, 30);
                this.damageNumbers.spawnText(b.centerX, b.pos.y - 10, "+Armor", spell.color);
                break;
            case "fear": {
                const target = this.nearestEnemy(b.centerX, b.centerY, 260);
                if (target) {
                    target.fear(6);
                    this.damageNumbers.spawnText(target.body.centerX, target.body.pos.y - 12, "Feared", spell.color);
                }
                break;
            }
        }
        ctx.onProgress(character.gainSkillXp(spell.skill, XP_SPELL_CAST));
        return true;
    }
    /** Use a Dragon Shout (Thu'um). Cooldown is managed by the caller. */
    shout(shout, player) {
        const b = player.body;
        if (shout.kind === "dragonrend") {
            let best = null;
            let bestD = shout.range;
            for (const e of this.enemies) {
                if (!e.isDragon)
                    continue;
                const d = Math.hypot(e.body.centerX - b.centerX, e.body.centerY - b.centerY);
                if (d < bestD) {
                    bestD = d;
                    best = e;
                }
            }
            if (best) {
                best.applyDragonrend(shout.power);
                this.damageNumbers.spawnText(best.body.centerX, best.body.pos.y - 10, "DRAGONREND", shout.color);
            }
            else {
                this.damageNumbers.spawnText(b.centerX, b.pos.y - 14, shout.words, shout.color);
            }
            return;
        }
        // Force / Fire Breath: a wide hitbox in front of the player.
        const rect = {
            x: b.facing === 1 ? b.right : b.pos.x - shout.range,
            y: b.pos.y - 20,
            w: shout.range,
            h: b.h + 40,
        };
        const kb = shout.kind === "force" ? KNOCKBACK.shoutForce : KNOCKBACK.shoutFire; // Fus Ro Dah!
        for (const e of this.enemies) {
            if (!intersects(rect, e.body.rect))
                continue;
            if (e.isImmune()) {
                this.damageNumbers.spawnText(e.body.centerX, e.body.pos.y, "Immune", "#9aa4b2");
                continue;
            }
            e.lastHitBySpell = false;
            e.takeHit(shout.power, b.facing, kb);
            this.damageNumbers.spawn(e.body.centerX, e.body.pos.y, shout.power, shout.color);
        }
        this.damageNumbers.spawnText(b.centerX, b.pos.y - 14, shout.words, shout.color);
    }
    update(dt, ctx) {
        const { map, character } = ctx;
        this.updateMeleeHits(dt, ctx);
        this.updateProjectiles(dt, ctx);
        // Enemies: AI + contact damage + ranged attack zones (dragon fire breath).
        const pb = ctx.player.body;
        for (const e of this.enemies) {
            e.update(dt, map, pb.centerX, pb.centerY);
            const knockDir = pb.centerX >= e.body.centerX ? 1 : -1;
            if (e.attackCooldown <= 0 && intersects(e.body.rect, pb.rect)) {
                ctx.onPlayerDamaged(e.contactDamage, knockDir);
                e.attackCooldown = 1.0;
            }
            const zone = e.attackZone();
            if (zone && e.attackCooldown <= 0 && intersects(zone, pb.rect)) {
                ctx.onPlayerDamaged(e.breathDamage, knockDir);
                e.attackCooldown = 0.8;
            }
        }
        // Remove the dead, granting loot.
        const survivors = [];
        for (const e of this.enemies) {
            if (e.dead)
                ctx.onEnemyDeath(e);
            else
                survivors.push(e);
        }
        this.enemies = survivors;
        character.regen(dt);
        character.updateBuffs(dt);
        this.damageNumbers.update(dt);
    }
    updateMeleeHits(dt, ctx) {
        for (const hit of this.hits) {
            hit.life -= dt;
            for (const e of this.enemies) {
                if (hit.alreadyHit.has(e) || !intersects(hit.rect, e.body.rect))
                    continue;
                hit.alreadyHit.add(e);
                if (e.isImmune()) {
                    this.damageNumbers.spawnText(e.body.centerX, e.body.pos.y, "Immune", "#9aa4b2");
                    continue;
                }
                e.lastHitBySpell = false;
                e.takeHit(hit.damage, hit.knockDir, hit.knockback);
                this.damageNumbers.spawn(e.body.centerX, e.body.pos.y, hit.damage);
                if (hit.fire > 0) {
                    e.takeHit(hit.fire, hit.knockDir, 0); // no extra knockback for the fire tick
                    this.damageNumbers.spawn(e.body.centerX, e.body.pos.y - 14, hit.fire, "#ff8a3d");
                }
                ctx.onProgress(ctx.character.gainSkillXp(hit.skill, XP_MELEE_HIT));
            }
        }
        this.hits = this.hits.filter((h) => h.life > 0);
    }
    updateProjectiles(dt, ctx) {
        const { map } = ctx;
        const alive = [];
        outer: for (const p of this.projectiles) {
            p.life -= dt;
            p.x += p.vx * dt;
            p.y += p.vy * dt;
            if (p.life <= 0)
                continue;
            // Hit a solid wall?
            if (map.tileAt(map.colAt(p.x), map.rowAt(p.y)) === TileType.Solid)
                continue;
            // Hit an enemy?
            const r = { x: p.x - 5, y: p.y - 5, w: 10, h: 10 };
            for (const e of this.enemies) {
                if (intersects(r, e.body.rect)) {
                    if (e.isImmune()) {
                        this.damageNumbers.spawnText(e.body.centerX, e.body.pos.y, "Immune", "#9aa4b2");
                        continue outer;
                    }
                    e.lastHitBySpell = true;
                    e.takeHit(p.damage, Math.sign(p.vx) || 1, KNOCKBACK.spell);
                    this.damageNumbers.spawn(e.body.centerX, e.body.pos.y, p.damage, p.color);
                    ctx.onProgress(ctx.character.gainSkillXp(p.skill, XP_RANGED_HIT));
                    continue outer; // projectile consumed
                }
            }
            alive.push(p);
        }
        this.projectiles = alive;
    }
    nearestEnemy(x, y, maxDist) {
        let best = null;
        let bestD = maxDist;
        for (const e of this.enemies) {
            const d = Math.hypot(e.body.centerX - x, e.body.centerY - y);
            if (d < bestD) {
                bestD = d;
                best = e;
            }
        }
        return best;
    }
    render(r, cam, time) {
        for (const e of this.enemies)
            e.render(r, cam, time);
        r.withWorld(cam, (ctx) => {
            for (const p of this.projectiles)
                drawProjectile(ctx, p, time);
        });
        this.damageNumbers.render(r, cam);
    }
}
//# sourceMappingURL=CombatSystem.js.map