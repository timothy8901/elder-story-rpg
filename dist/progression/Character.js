import { findPerk, SKILL_IDS, SKILLS } from "./skills.js";
// --- Tuning ---------------------------------------------------------------
const BASE_POOL = 100; // health/magicka/stamina each start at 100
const PER_ATTRIBUTE = 10; // each allocated attribute point adds this to its pool
const emptyMods = () => ({
    health: 0,
    magicka: 0,
    stamina: 0,
    armorRating: 0,
    healthRegen: 1, // base out-of-combat regen, per second
    magickaRegen: 5,
    staminaRegen: 12,
});
/** XP required to advance a skill from `level` to `level + 1`. */
export function skillXpToNext(level) {
    return 20 + level * 10;
}
/** Skill-level-ups required to advance the character from `level` to `level+1`. */
export function charXpToNext(level) {
    return 3 + level;
}
/**
 * The player's progression sheet: attributes, the three resource pools, and the
 * use-to-level skill/perk machinery. Knows nothing about combat or items — other
 * systems call {@link gainSkillXp} when a skill is used and read the perk/stat
 * helpers. Equipment feeds in through {@link applyModifiers}.
 */
export class Character {
    constructor() {
        this.characterLevel = 1;
        this.characterXp = 0; // counts skill-level-ups toward the next character level
        this.perkPoints = 0;
        this.attributePoints = 0;
        this.attributes = { health: 0, magicka: 0, stamina: 0 };
        this.unlockedPerks = new Set();
        /** Transient outgoing-damage multiplier (e.g. Companions' Beast Form). */
        this.outgoingDamageMult = 1;
        /** Extra sneak-attack multiplier (Dark Brotherhood). Set from faction state. */
        this.sneakAttackBonus = 0;
        this.mods = emptyMods();
        /** Temporary armor from buff spells (e.g. Oakflesh). */
        this.buffArmor = 0;
        this.buffTimer = 0;
        this.skills = {};
        for (const id of SKILL_IDS)
            this.skills[id] = { level: 5, xp: 0 };
        this.hp = this.maxHealth;
        this.mp = this.maxMagicka;
        this.sp = this.maxStamina;
    }
    get maxHealth() {
        return BASE_POOL + this.attributes.health * PER_ATTRIBUTE + this.mods.health;
    }
    get maxMagicka() {
        return BASE_POOL + this.attributes.magicka * PER_ATTRIBUTE + this.mods.magicka;
    }
    get maxStamina() {
        return BASE_POOL + this.attributes.stamina * PER_ATTRIBUTE + this.mods.stamina;
    }
    get armorRating() {
        return this.mods.armorRating + this.buffArmor;
    }
    /** Add a temporary armor buff (replacing any weaker active one). */
    addArmorBuff(amount, seconds) {
        this.buffArmor = Math.max(this.buffArmor, amount);
        this.buffTimer = seconds;
    }
    /** Tick down temporary buffs. */
    updateBuffs(dt) {
        if (this.buffTimer > 0) {
            this.buffTimer -= dt;
            if (this.buffTimer <= 0)
                this.buffArmor = 0;
        }
    }
    /** Replace equipment/effect modifiers and re-clamp the pools to new maxima. */
    applyModifiers(mods) {
        this.mods = mods;
        this.hp = Math.min(this.hp, this.maxHealth);
        this.mp = Math.min(this.mp, this.maxMagicka);
        this.sp = Math.min(this.sp, this.maxStamina);
    }
    /** Regenerate resource pools over time. */
    regen(dt) {
        this.hp = Math.min(this.maxHealth, this.hp + this.mods.healthRegen * dt);
        this.mp = Math.min(this.maxMagicka, this.mp + this.mods.magickaRegen * dt);
        this.sp = Math.min(this.maxStamina, this.sp + this.mods.staminaRegen * dt);
    }
    /**
     * Award experience to a skill from *using* it. Cascades into skill level-ups
     * and, via those, character level-ups. Returns the notable events for the HUD.
     */
    gainSkillXp(id, amount) {
        const events = [];
        const s = this.skills[id];
        s.xp += amount;
        while (s.level < 100 && s.xp >= skillXpToNext(s.level)) {
            s.xp -= skillXpToNext(s.level);
            s.level += 1;
            events.push({ skill: { id, level: s.level } });
            // Each skill level-up nudges the character toward the next level.
            this.characterXp += 1;
            while (this.characterXp >= charXpToNext(this.characterLevel)) {
                this.characterXp -= charXpToNext(this.characterLevel);
                this.characterLevel += 1;
                this.perkPoints += 1;
                this.attributePoints += 1;
                events.push({ characterLevel: this.characterLevel });
            }
        }
        return events;
    }
    /** Spend an attribute point, raising one pool and topping it off. */
    allocateAttribute(attr) {
        if (this.attributePoints <= 0)
            return false;
        this.attributes[attr] += 1;
        this.attributePoints -= 1;
        // Top off the boosted pool by the gain so the increase is felt immediately.
        if (attr === "health")
            this.hp += PER_ATTRIBUTE;
        if (attr === "magicka")
            this.mp += PER_ATTRIBUTE;
        if (attr === "stamina")
            this.sp += PER_ATTRIBUTE;
        return true;
    }
    /** Whether a perk can currently be purchased. */
    canUnlock(perkId) {
        if (this.perkPoints <= 0 || this.unlockedPerks.has(perkId))
            return false;
        const node = findPerk(perkId);
        if (!node)
            return false;
        const skillId = this.skillOfPerk(perkId);
        if (!skillId || this.skills[skillId].level < node.reqLevel)
            return false;
        if (node.requires?.some((r) => !this.unlockedPerks.has(r)))
            return false;
        return true;
    }
    /** Purchase a perk node, spending one perk point. */
    unlockPerk(perkId) {
        if (!this.canUnlock(perkId))
            return false;
        this.unlockedPerks.add(perkId);
        this.perkPoints -= 1;
        return true;
    }
    /** Sum the value of all unlocked perks of `skillId` whose effect is `kind`. */
    perkBonus(skillId, kind) {
        let sum = 0;
        for (const p of SKILLS[skillId].perks) {
            if (this.unlockedPerks.has(p.id) && p.effect?.kind === kind)
                sum += p.effect.value;
        }
        return sum;
    }
    /** Total flat carry-weight bonus from all unlocked perks. */
    carryWeightBonus() {
        let sum = 0;
        for (const id of SKILL_IDS)
            sum += this.perkBonus(id, "carryWeight");
        return sum;
    }
    skillOfPerk(perkId) {
        return SKILL_IDS.find((id) => SKILLS[id].perks.some((p) => p.id === perkId));
    }
    // --- Serialization ------------------------------------------------------
    toJSON() {
        return {
            characterLevel: this.characterLevel,
            characterXp: this.characterXp,
            perkPoints: this.perkPoints,
            attributePoints: this.attributePoints,
            attributes: { ...this.attributes },
            skills: structuredClone(this.skills),
            unlockedPerks: [...this.unlockedPerks],
            hp: this.hp,
            mp: this.mp,
            sp: this.sp,
        };
    }
    load(save) {
        this.characterLevel = save.characterLevel;
        this.characterXp = save.characterXp;
        this.perkPoints = save.perkPoints;
        this.attributePoints = save.attributePoints;
        this.attributes = { ...save.attributes };
        for (const id of SKILL_IDS) {
            if (save.skills[id])
                this.skills[id] = { ...save.skills[id] };
        }
        this.unlockedPerks = new Set(save.unlockedPerks);
        this.hp = save.hp;
        this.mp = save.mp;
        this.sp = save.sp;
    }
}
//# sourceMappingURL=Character.js.map