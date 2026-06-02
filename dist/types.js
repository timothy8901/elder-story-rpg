/**
 * Shared, dependency-free type definitions used across the engine.
 * Keep this file free of imports so any module can pull from it.
 */
/**
 * The kinds of tile a {@link Tilemap} cell can hold. Numeric values let map
 * data be authored compactly and serialized cheaply later.
 */
export var TileType;
(function (TileType) {
    /** Open air — no collision. */
    TileType[TileType["Empty"] = 0] = "Empty";
    /** Floors, ceilings and walls — collide on every side. */
    TileType[TileType["Solid"] = 1] = "Solid";
    /** One-way platform — you can jump up through it, land on top, and drop down. */
    TileType[TileType["OneWay"] = 2] = "OneWay";
})(TileType || (TileType = {}));
//# sourceMappingURL=types.js.map