/**
 * Decoration props (assets/props/*.png, built by tools/build_assets.py from Sunny
 * Land scenery + DungeonTileset II dungeon props). Purely cosmetic — drawn in world
 * space behind entities, bottom-center anchored so they stand on the ground. Each
 * prop is its own PNG; nothing draws until its image has loaded.
 */
import { ASSET_VERSION } from "../config.js";
import type { Camera } from "../core/Camera.js";
import type { Renderer } from "../core/Renderer.js";
import type { GameMap } from "../world/GameMap.js";

const PROP_KEYS = ["tree", "bush", "rock", "sign", "shrooms", "column", "column_bronze", "crate", "skull"];

class PropAtlas {
  private imgs: Record<string, HTMLImageElement> = {};
  private ready: Record<string, boolean> = {};

  load(): void {
    for (const key of PROP_KEYS) {
      if (this.imgs[key]) continue;
      const img = new Image();
      img.onload = () => {
        this.ready[key] = true;
      };
      img.src = `assets/props/${key}.png?v=${ASSET_VERSION}`;
      this.imgs[key] = img;
    }
  }

  /** Draw a prop bottom-center anchored at world (x, y) (its natural pixel size). */
  draw(ctx: CanvasRenderingContext2D, key: string, x: number, y: number): void {
    const img = this.imgs[key];
    if (!img || !this.ready[key]) return;
    const prev = ctx.imageSmoothingEnabled;
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(img, Math.round(x - img.width / 2), Math.round(y - img.height), img.width, img.height);
    ctx.imageSmoothingEnabled = prev;
  }
}

export const props = new PropAtlas();

/** Draw a map's decoration props in world space (call between tilemap and entities). */
export function drawDecorations(r: Renderer, cam: Camera, map: GameMap): void {
  if (!map.decorations || map.decorations.length === 0) return;
  r.withWorld(cam, (ctx) => {
    for (const d of map.decorations!) props.draw(ctx, d.key, d.x, d.y);
  });
}
