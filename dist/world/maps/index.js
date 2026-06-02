import { createCaveMap } from "./caveMap.js";
import { createMeadowMap } from "./meadowMap.js";
import { createRuinsMap } from "./ruinsMap.js";
import { createTestMap } from "./testMap.js";
import { createThroatMap } from "./throatMap.js";
import { createWoodsMap } from "./woodsMap.js";
/** Map id the player begins a new game in. */
export const FIRST_MAP_ID = "overworld";
/**
 * Build a fresh instance of a map by id. The overworld is one contiguous,
 * MapleStory-style world stitched from segments:
 *   Ruins ◄ Woods ◄ Meadow ◄ Greenreach Vale (overworld) ▼ Hollowdeep Cave
 */
export function createMap(id) {
    switch (id) {
        case "cave":
            return createCaveMap();
        case "meadow":
            return createMeadowMap();
        case "woods":
            return createWoodsMap();
        case "ruins":
            return createRuinsMap();
        case "throat":
            return createThroatMap();
        case "overworld":
        default:
            return createTestMap();
    }
}
//# sourceMappingURL=index.js.map