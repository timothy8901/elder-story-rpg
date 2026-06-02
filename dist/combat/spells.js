export const SPELLS = [
    { id: "firebolt", name: "Firebolt", skill: "destruction", magickaCost: 18, kind: "projectile", power: 18, color: "#ff8a3d" },
    { id: "healing", name: "Healing", skill: "restoration", magickaCost: 22, kind: "heal", power: 45, color: "#7dffa0" },
    { id: "oakflesh", name: "Oakflesh", skill: "alteration", magickaCost: 25, kind: "buff", power: 40, color: "#9ad0ff" },
    { id: "fury", name: "Fury", skill: "illusion", magickaCost: 20, kind: "fear", power: 1, color: "#d18aff" },
    { id: "boundBolt", name: "Bound Bolt", skill: "conjuration", magickaCost: 24, kind: "projectile", power: 24, color: "#8ad8ff" },
    { id: "lightning", name: "Lightning Bolt", skill: "destruction", magickaCost: 30, kind: "projectile", power: 34, color: "#bfe8ff", lockedToFaction: "college" },
];
export function findSpell(id) {
    return SPELLS.find((s) => s.id === id);
}
//# sourceMappingURL=spells.js.map