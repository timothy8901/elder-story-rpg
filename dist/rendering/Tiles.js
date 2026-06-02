import { TILE_SIZE as T } from "../config.js";
import { TileType } from "../types.js";
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
                    if (theme === "cave")
                        drawStone(ctx, map, col, row, x, y);
                    else
                        drawEarth(ctx, map, col, row, x, y);
                }
                else {
                    drawFoothold(ctx, x, y, theme);
                }
            }
        }
    });
}
function drawEarth(ctx, map, col, row, x, y) {
    const topOpen = map.tileAt(col, row - 1) !== TileType.Solid;
    const leftOpen = map.tileAt(col - 1, row) !== TileType.Solid;
    const rightOpen = map.tileAt(col + 1, row) !== TileType.Solid;
    // Dirt body.
    const g = ctx.createLinearGradient(0, y, 0, y + T);
    g.addColorStop(0, "#a9743f");
    g.addColorStop(1, "#7c4f27");
    ctx.fillStyle = g;
    ctx.fillRect(x, y, T, T);
    // Pebble speckles.
    ctx.fillStyle = "rgba(60,38,18,0.5)";
    for (let i = 0; i < 4; i++) {
        const px = x + hash(col * 4 + i, row) * (T - 5) + 2;
        const py = y + hash(col, row * 4 + i) * (T - 6) + 4;
        ctx.fillRect(px, py, 2, 2);
    }
    // Edge shading.
    if (leftOpen) {
        ctx.fillStyle = "rgba(0,0,0,0.18)";
        ctx.fillRect(x, y, 3, T);
    }
    if (rightOpen) {
        ctx.fillStyle = "rgba(255,220,160,0.12)";
        ctx.fillRect(x + T - 3, y, 3, T);
    }
    // Grassy cap on exposed top.
    if (topOpen) {
        const grassH = 11;
        ctx.fillStyle = "#62a83e";
        ctx.beginPath();
        ctx.moveTo(x, y + grassH);
        ctx.lineTo(x, y + 3);
        // wavy bottom edge of the grass so adjacent tiles blend
        ctx.lineTo(x, y);
        ctx.lineTo(x + T, y);
        ctx.lineTo(x + T, y + grassH);
        ctx.quadraticCurveTo(x + T * 0.75, y + grassH + 4, x + T * 0.5, y + grassH);
        ctx.quadraticCurveTo(x + T * 0.25, y + grassH - 4, x, y + grassH);
        ctx.closePath();
        ctx.fill();
        // brighter top highlight
        ctx.fillStyle = "#7ac74f";
        ctx.fillRect(x, y, T, 4);
        // a couple of blades
        ctx.strokeStyle = "#4f8f30";
        ctx.lineWidth = 1.5;
        for (let i = 0; i < 2; i++) {
            const bx = x + 6 + i * 14 + hash(col, row + i) * 6;
            ctx.beginPath();
            ctx.moveTo(bx, y + 2);
            ctx.lineTo(bx + (i ? 2 : -2), y - 4);
            ctx.stroke();
        }
    }
}
function drawStone(ctx, map, col, row, x, y) {
    const topOpen = map.tileAt(col, row - 1) !== TileType.Solid;
    const g = ctx.createLinearGradient(0, y, 0, y + T);
    g.addColorStop(0, "#4b4663");
    g.addColorStop(1, "#322d46");
    ctx.fillStyle = g;
    ctx.fillRect(x, y, T, T);
    // Cracks.
    ctx.strokeStyle = "rgba(20,16,30,0.55)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    const cxp = x + 6 + hash(col, row) * 18;
    ctx.moveTo(cxp, y + 4);
    ctx.lineTo(cxp + 4, y + 14);
    ctx.lineTo(cxp - 3, y + 24);
    ctx.stroke();
    if (topOpen) {
        ctx.fillStyle = "#5e587a";
        ctx.fillRect(x, y, T, 4);
        ctx.fillStyle = "rgba(150,200,255,0.12)";
        ctx.fillRect(x, y, T, 2);
    }
}
function drawFoothold(ctx, x, y, theme) {
    const h = 11;
    const wood = theme === "cave" ? "#5b5570" : "#9c6b3f";
    const top = theme === "cave" ? "#7d769a" : "#c79a5e";
    const under = theme === "cave" ? "#332f44" : "#5e3d1f";
    // Rounded plank.
    ctx.fillStyle = wood;
    rr(ctx, x + 1, y, T - 2, h, 5);
    ctx.fill();
    // Top highlight.
    ctx.fillStyle = top;
    rr(ctx, x + 1, y, T - 2, 4, 4);
    ctx.fill();
    // Underside shadow.
    ctx.fillStyle = under;
    ctx.fillRect(x + 3, y + h - 2, T - 6, 2);
    // Plank seam.
    ctx.strokeStyle = "rgba(0,0,0,0.18)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x + T / 2, y + 3);
    ctx.lineTo(x + T / 2, y + h - 2);
    ctx.stroke();
}
/** Rounded-rect path (uses arcTo for broad browser support). */
function rr(ctx, x, y, w, h, radius) {
    const r = Math.min(radius, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
}
//# sourceMappingURL=Tiles.js.map