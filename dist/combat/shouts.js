/**
 * Dragon Shouts (Thu'um) — a Dragonborn-only combat system, separate from
 * spells. Words of Power are learned at story beats; using a shout has a
 * cooldown rather than a resource cost.
 */
export const SHOUTS = {
    unrelentingForce: {
        id: "unrelentingForce",
        name: "Unrelenting Force",
        words: "Fus Ro Dah",
        kind: "force",
        cooldown: 3,
        range: 150,
        power: 22,
        color: "#cfe3ff",
    },
    fireBreath: {
        id: "fireBreath",
        name: "Fire Breath",
        words: "Yol Toor Shul",
        kind: "fire",
        cooldown: 6,
        range: 180,
        power: 40,
        color: "#ff8a3d",
    },
    dragonrend: {
        id: "dragonrend",
        name: "Dragonrend",
        words: "Joor Zah Frul",
        kind: "dragonrend",
        cooldown: 8,
        range: 460,
        power: 8, // seconds a dragon is forced down & made mortal
        color: "#b06bff",
    },
};
/** Stable display order for cycling. */
export const SHOUT_ORDER = ["unrelentingForce", "fireBreath", "dragonrend"];
//# sourceMappingURL=shouts.js.map