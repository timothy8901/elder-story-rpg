import { TILE_SIZE as T, ASSET_VERSION } from "../config.js";
import { TileType } from "../types.js";
/**
 * Sunny Land (CC0, by @ansimuz) field tileset, assembled by tools/build_assets.py.
 * Columns: inner, top, topL, topR, left, right, oneway (16px each); row 0 = field.
 * If the PNG is missing the renderer falls back to the procedural draws below.
 */
const SRC_T = 16;
const tilesImg = new Image();
let tilesReady = false;
tilesImg.onload = () => {
    tilesReady = true;
};
tilesImg.src = `assets/tiles.png?v=${ASSET_VERSION}`;
/** Source column for a field solid tile: grass-capped when its top is exposed, else plain dirt. */
function fieldSolidCol(map, col, row) {
    return map.tileAt(col, row - 1) !== TileType.Solid ? 1 : 0;
}
/** Stable pseudo-random in [0,1) from tile coords — keeps speckles from flickering. */
function hash(c, r) {
    const s = Math.sin(c * 127.1 + r * 311.7) * 43758.5453;
    return s - Math.floor(s);
}
/**
 * Draw the visible tiles with MapleStory-flavored art: grass-topped earth and
 * wooden footholds in the field, carved stone in caves. Edges are detected from
 * neighbors so exposed surfaces get grass/highlights and buried ones stay plain.
 */
export function drawTilemap(r, cam, map, theme) {
    const startCol = Math.max(0, map.colAt(cam.x));
    const endCol = Math.min(map.cols - 1, map.colAt(cam.x + r.width));
    const startRow = Math.max(0, map.rowAt(cam.y));
    const endRow = Math.min(map.rows - 1, map.rowAt(cam.y + r.height));
    r.withWorld(cam, (ctx) => {
        for (let row = startRow; row <= endRow; row++) {
            for (let col = startCol; col <= endCol; col++) {
                const tile = map.tileAt(col, row);
                if (tile === TileType.Empty)
                    continue;
                const x = col * T;
                const y = row * T;
                if (tile === TileType.Solid) {
                    if (theme === "field" && tilesReady) {
                        ctx.drawImage(tilesImg, fieldSolidCol(map, col, row) * SRC_T, 0, SRC_T, SRC_T, x, y, T, T);
                    }
                    else if (theme === "cave")
                        drawStone(ctx, map, col, row, x, y);
                    else if (theme === "dwarven")
                        drawMetal(ctx, map, col, row, x, y);
                    else
                        drawEarth(ctx, map, col, row, x, y);
                }
                else {
                    // One-way platform: Sunny Land plank for the field, procedural elsewhere.
                    if (theme === "field" && tilesReady) {
                        ctx.drawImage(tilesImg, 6 * SRC_T, 0, SRC_T, SRC_T, x, y, T, 16);
                    }
                    else {
                        drawFoothold(ctx, x, y, theme);
                    }
                }
            }
        }
    });
}
/** Flat two-band body + chunky 2px speckles (no smooth gradients — pixel style). */
function banded(ctx, x, y, top, bot, speck, col, row) {
    ctx.fillStyle = top;
    ctx.fillRect(x, y, T, T);
    ctx.fillStyle = bot;
    ctx.fillRect(x, y + (T >> 1), T, T >> 1);
    ctx.fillStyle = speck;
    for (let i = 0; i < 4; i++) {
        const px = x + Math.floor(hash(col * 4 + i, row) * (T - 4)) + 1;
        const py = y + Math.floor(hash(col, row * 4 + i) * (T - 7)) + 5;
        ctx.fillRect(px, py, 2, 2);
    }
}
function drawEarth(ctx, map, col, row, x, y) {
    const topOpen = map.tileAt(col, row - 1) !== TileType.Solid;
    const leftOpen = map.tileAt(col - 1, row) !== TileType.Solid;
    const rightOpen = map.tileAt(col + 1, row) !== TileType.Solid;
    banded(ctx, x, y, "#9c6638", "#774a24", "#5e3d1f", col, row);
    if (leftOpen) {
        ctx.fillStyle = "rgba(0,0,0,0.22)";
        ctx.fillRect(x, y, 2, T);
    }
    if (rightOpen) {
        ctx.fillStyle = "rgba(255,220,160,0.14)";
        ctx.fillRect(x + T - 2, y, 2, T);
    }
    // Flat, chunky grass cap on an exposed top.
    if (topOpen) {
        ctx.fillStyle = "#56a038";
        ctx.fillRect(x, y, T, 9);
        ctx.fillStyle = "#7ac74f";
        ctx.fillRect(x, y, T, 3);
        // chunky dithered bottom edge so the grass doesn't read as a flat line
        ctx.fillStyle = "#56a038";
        for (let i = 0; i < T; i += 4) {
            if ((col * 5 + (i >> 2)) % 2 === 0)
                ctx.fillRect(x + i, y + 9, 4, 2);
        }
        // a couple of blades poking up
        ctx.fillStyle = "#4f8f30";
        ctx.fillRect(x + 5, y - 3, 2, 4);
        ctx.fillRect(x + T - 9, y - 2, 2, 3);
    }
}
function drawStone(ctx, map, col, row, x, y) {
    const topOpen = map.tileAt(col, row - 1) !== TileType.Solid;
    banded(ctx, x, y, "#494363", "#2f2a44", "#211c33", col, row);
    // Chunky crack (a few dark pixels stepping down).
    ctx.fillStyle = "rgba(18,14,28,0.6)";
    const cxp = x + 5 + Math.floor(hash(col, row) * 16);
    ctx.fillRect(cxp, y + 4, 2, 4);
    ctx.fillRect(cxp + 2, y + 12, 2, 4);
    ctx.fillRect(cxp - 1, y + 20, 2, 4);
    if (topOpen) {
        ctx.fillStyle = "#5e587a";
        ctx.fillRect(x, y, T, 3);
        ctx.fillStyle = "#8aa0d0";
        ctx.fillRect(x, y, T, 1);
    }
}
function drawMetal(ctx, map, col, row, x, y) {
    const topOpen = map.tileAt(col, row - 1) !== TileType.Solid;
    banded(ctx, x, y, "#79612f", "#4f3f20", "#2e2410", col, row);
    // Rivets at the corners.
    ctx.fillStyle = "#e8c878";
    ctx.fillRect(x + 3, y + 3, 2, 2);
    ctx.fillRect(x + T - 5, y + 3, 2, 2);
    ctx.fillRect(x + 3, y + T - 5, 2, 2);
    ctx.fillRect(x + T - 5, y + T - 5, 2, 2);
    // Hard panel seam (1px square frame).
    ctx.strokeStyle = "rgba(20,14,6,0.55)";
    ctx.lineWidth = 1;
    ctx.strokeRect(x + 1.5, y + 1.5, T - 3, T - 3);
    if (topOpen) {
        ctx.fillStyle = "#b99550";
        ctx.fillRect(x, y, T, 3);
    }
}
function drawFoothold(ctx, x, y, theme) {
    const h = 10;
    const wood = theme === "cave" ? "#5b5570" : theme === "dwarven" ? "#8a6f3c" : "#9c6b3f";
    const top = theme === "cave" ? "#7d769a" : theme === "dwarven" ? "#bfa05a" : "#c79a5e";
    const under = theme === "cave" ? "#332f44" : theme === "dwarven" ? "#42351a" : "#5e3d1f";
    // Square plank, flat bands (pixel style).
    ctx.fillStyle = wood;
    ctx.fillRect(x + 1, y, T - 2, h);
    ctx.fillStyle = top;
    ctx.fillRect(x + 1, y, T - 2, 3);
    ctx.fillStyle = under;
    ctx.fillRect(x + 1, y + h - 2, T - 2, 2);
    // a couple of plank seams
    ctx.fillStyle = "rgba(0,0,0,0.22)";
    ctx.fillRect(x + (T >> 1), y + 3, 1, h - 4);
    ctx.fillRect(x + (T >> 2), y + 3, 1, h - 4);
}
//# sourceMappingURL=Tiles.js.map