#!/usr/bin/env python3
"""
Build in-game art from CC0 asset packs in assets/raw/.

Currently: Sunny Land (CC0, by Luis Zuno / @ansimuz, via OpenGameArt) — used for
the FIELD theme's tiles + parallax backgrounds. Outputs (committed):
  assets/tiles.png       — variant grid: cols = inner,top,topL,topR,left,right,oneway; rows = field,cave,dwarven (only field filled so far)
  assets/bg/field_back.png, field_mid.png  — parallax layers

Other themes (cave/dwarven) keep the procedural renderer until their packs land.
Run: python3 tools/build_assets.py   (bump ASSET_VERSION in src/config.ts after)
"""
import os
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SL = os.path.join(ROOT, "assets", "raw", "sunny-land", "Sunny-land-assets-files", "PNG")
T = 16  # source tile size
VARIANTS = ["inner", "top", "topL", "topR", "left", "right", "oneway"]
THEMES = ["field", "cave", "dwarven"]


def cell(img, c, r):
    return img.crop((c * T, r * T, c * T + T, r * T + T))


def build_tiles():
    ts = Image.open(os.path.join(SL, "environment/layers/tileset.png")).convert("RGBA")
    plat = Image.open(os.path.join(SL, "environment/props/small-platform.png")).convert("RGBA").resize((T, T), Image.NEAREST)
    grass = cell(ts, 1, 1)  # grass-capped dirt
    dirt = cell(ts, 1, 3)   # plain dirt body
    field = {
        "inner": dirt, "top": grass, "topL": grass, "topR": grass,
        "left": dirt, "right": dirt, "oneway": plat,
    }
    sheet = Image.new("RGBA", (len(VARIANTS) * T, len(THEMES) * T), (0, 0, 0, 0))
    for ci, v in enumerate(VARIANTS):
        sheet.alpha_composite(field[v], (ci * T, 0))  # field = row 0
    out = os.path.join(ROOT, "assets", "tiles.png")
    sheet.save(out)
    print(f"tiles.png {sheet.size} -> {out}")


def build_bg():
    bgdir = os.path.join(ROOT, "assets", "bg")
    os.makedirs(bgdir, exist_ok=True)
    for src, dst in [("environment/layers/back.png", "field_back.png"),
                     ("environment/layers/middle.png", "field_mid.png")]:
        Image.open(os.path.join(SL, src)).convert("RGBA").save(os.path.join(bgdir, dst))
    print("bg -> field_back.png, field_mid.png")


if __name__ == "__main__":
    build_tiles()
    build_bg()
