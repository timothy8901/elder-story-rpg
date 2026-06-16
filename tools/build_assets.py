#!/usr/bin/env python3
"""
Build in-game art from CC0 asset packs in assets/raw/.

Packs (both CC0, no attribution required — credited in CREDITS.md as courtesy):
  - Sunny Land (@ansimuz)            -> FIELD tiles + parallax backgrounds
  - DungeonTileset II (@0x72)        -> character/enemy/NPC sprite atlas

Outputs (committed):
  assets/tiles.png       — field tile variants (cols: inner,top,topL,topR,left,right,oneway)
  assets/bg/field_*.png  — parallax layers
  assets/atlas.png       — 12x20 grid of 54x78 cells, one entity per row, frames
                           packed idle(0-1) / walk(2-5) / attack(6-8) to match
                           the layout src/rendering/Atlas.ts expects (unchanged).

Run: python3 tools/build_assets.py   (then bump ASSET_VERSION in src/config.ts)
"""
import os
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SL = os.path.join(ROOT, "assets", "raw", "sunny-land", "Sunny-land-assets-files", "PNG")
DT = os.path.join(ROOT, "assets", "raw", "dungeon-tileset-ii")
T = 16  # source tile size (Sunny Land)
VARIANTS = ["inner", "top", "topL", "topR", "left", "right", "oneway"]
THEMES = ["field", "cave", "dwarven"]


# ---------------------------------------------------------------------------
# Field tiles + parallax (Sunny Land)
# ---------------------------------------------------------------------------

def cell(img, c, r):
    return img.crop((c * T, r * T, c * T + T, r * T + T))


def build_tiles():
    # --- field: Sunny Land grass/dirt (row 0) ---
    ts = Image.open(os.path.join(SL, "environment/layers/tileset.png")).convert("RGBA")
    plat = Image.open(os.path.join(SL, "environment/props/small-platform.png")).convert("RGBA").resize((T, T), Image.NEAREST)
    grass = cell(ts, 1, 1)  # grass-capped dirt
    dirt = cell(ts, 1, 3)   # plain dirt body
    field = {
        "inner": dirt, "top": grass, "topL": grass, "topR": grass,
        "left": dirt, "right": dirt, "oneway": plat,
    }

    # --- cave: 0x72 grey stone brick (row 1); Dwemer = bronze-tinted (row 2) ---
    dt = Image.open(os.path.join(DT, "atlas.png")).convert("RGBA")
    rects = _load_rects(os.path.join(DT, "tile_list.txt"))

    def dcell(name):
        r = rects[name]
        return dt.crop((r[0], r[1], r[0] + r[2], r[1] + r[3]))

    wall, wleft, wright, wtop = dcell("wall_mid"), dcell("wall_left"), dcell("wall_right"), dcell("wall_top_mid")
    capped = wall.copy()                               # brick body with a light stone lip on top
    capped.alpha_composite(wtop.crop((0, 0, T, 6)), (0, 0))
    cave = {
        "inner": wall, "top": capped, "topL": capped, "topR": capped,
        "left": wleft, "right": wright, "oneway": wtop,
    }
    dwarven = {v: _tint(im, (212, 158, 90)) for v, im in cave.items()}  # warm Dwemer bronze

    sheet = Image.new("RGBA", (len(VARIANTS) * T, len(THEMES) * T), (0, 0, 0, 0))
    for row, variants in enumerate([field, cave, dwarven]):  # field=0, cave=1, dwarven=2
        for ci, v in enumerate(VARIANTS):
            sheet.alpha_composite(variants[v], (ci * T, row * T))
    out = os.path.join(ROOT, "assets", "tiles.png")
    sheet.save(out)
    print(f"tiles.png {sheet.size} (field+cave+dwarven) -> {out}")


def build_bg():
    bgdir = os.path.join(ROOT, "assets", "bg")
    os.makedirs(bgdir, exist_ok=True)
    for src, dst in [("environment/layers/back.png", "field_back.png"),
                     ("environment/layers/middle.png", "field_mid.png")]:
        Image.open(os.path.join(SL, src)).convert("RGBA").save(os.path.join(bgdir, dst))
    print("bg -> field_back.png, field_mid.png")


# ---------------------------------------------------------------------------
# Character atlas (DungeonTileset II)
# ---------------------------------------------------------------------------

CW, CH = 54, 78   # atlas cell (matches Atlas.ts: W*PX=54, H*PX=78)
COLS, ROWS = 12, 20

# row order MUST match SPRITES in src/rendering/Atlas.ts.
# (game_key, 0x72_base, tint_rgb_or_None) — tints add faction flavor when a base
# is reused (multiply over the sprite, transparent pixels untouched).
ATLAS_MAP = [
    ("hero", "knight_m", None),                             # the only untinted teal knight — stands out from faction knights
    ("werewolf", "ogre", None),
    ("wolf", "chort", None),
    ("bandit", "masked_orc", None),
    ("draugr", "skelet", None),
    ("draugr_overlord", "big_zombie", None),
    ("dwarven_battlemage", "wizzard_m", (150, 210, 255)),   # arcane cyan
    ("dwarven_warlord", "orc_shaman", None),
    ("npc_legion", "knight_m", (255, 180, 150)),            # imperial warm steel (teal tabard greens under gold)
    ("npc_stormcloaks", "knight_f", (150, 180, 255)),       # nord blue
    ("npc_companions", "dwarf_m", None),
    ("npc_college", "wizzard_f", (190, 160, 255)),          # violet
    ("npc_thievesGuild", "elf_m", (120, 150, 120)),         # shadow green
    ("npc_darkBrotherhood", "wogol", None),                 # hooded cultist
    ("npc_blades", "knight_m", (200, 95, 95)),              # deep crimson order (distinct from Legion)
    ("npc_bards", "elf_f", (255, 170, 220)),                # magenta
    ("npc_courier", "doc", None),
    ("npc_arngeir", "wizzard_m", (205, 205, 215)),          # grey greybeard
    ("npc_calcelmo", "wizzard_f", (220, 200, 160)),         # tan scholar
    ("npc_merchant", "elf_m", (170, 210, 150)),             # green merchant
]


def _load_rects(path):
    rects = {}
    with open(path) as fh:
        for line in fh:
            p = line.split()
            if len(p) >= 5:
                rects[p[0]] = (int(p[1]), int(p[2]), int(p[3]), int(p[4]))
    return rects


def _tint(im, rgb):
    r, g, b = rgb
    rb, gb, bb, ab = im.split()
    rb = rb.point(lambda v: v * r // 255)
    gb = gb.point(lambda v: v * g // 255)
    bb = bb.point(lambda v: v * b // 255)
    return Image.merge("RGBA", (rb, gb, bb, ab))


def build_atlas():
    sheet = Image.open(os.path.join(DT, "atlas.png")).convert("RGBA")
    rects = _load_rects(os.path.join(DT, "tile_list.txt"))

    def crop(name):
        r = rects.get(name)
        return sheet.crop((r[0], r[1], r[0] + r[2], r[1] + r[3])) if r else None

    def frame(base, kind, i):
        return crop(f"{base}_{kind}_anim_f{i}")

    def idle2(base):
        f0 = frame(base, "idle", 0)
        return [f0, frame(base, "idle", 1) or f0]

    def run4(base):
        rs = [frame(base, "run", i) for i in range(4)]
        rs = [r for r in rs if r]
        if not rs:
            rs = idle2(base)
        return (rs * 4)[:4]

    def atk3(base):
        i0 = frame(base, "idle", 0)
        hit = frame(base, "hit", 0) or frame(base, "run", 1) or i0
        return [i0, hit, i0]

    atlas = Image.new("RGBA", (COLS * CW, ROWS * CH), (0, 0, 0, 0))

    def place(col, row, fr, tint):
        if fr is None:
            return
        w, h = fr.size
        s = min(CW / w, CH / h) * 0.96           # fit cell, small headroom
        nw, nh = max(1, round(w * s)), max(1, round(h * s))
        im = fr.resize((nw, nh), Image.NEAREST)
        if tint:
            im = _tint(im, tint)
        px = col * CW + (CW - nw) // 2            # centered horizontally
        py = row * CH + (CH - nh)                 # feet anchored to cell bottom
        atlas.alpha_composite(im, (px, py))

    for row, (key, base, tint) in enumerate(ATLAS_MAP):
        idle, run, atk = idle2(base), run4(base), atk3(base)
        cells = [idle[0], idle[1], run[0], run[1], run[2], run[3], atk[0], atk[1], atk[2]]
        for col, fr in enumerate(cells):
            place(col, row, fr, tint)

    out = os.path.join(ROOT, "assets", "atlas.png")
    atlas.save(out)
    print(f"atlas.png {atlas.size} ({len(ATLAS_MAP)} sprites) -> {out}")


# ---------------------------------------------------------------------------
# Item icons (DungeonTileset II weapons/flasks/coin + procedural slot glyphs)
# ---------------------------------------------------------------------------

# Icon order = cell index in assets/icons.png (mirror ICON_KEYS in src/rendering/Icons.ts).
ICON_KEYS = [
    "sword", "dagger", "greatsword", "bow", "axe", "katana", "mace", "staff",
    "potion_hp", "potion_mp", "potion_sp", "coin",
    "helm", "chest", "hands", "feet", "shield", "ring", "necklace", "misc",
]
# game icon key -> 0x72 source sprite (the rest are drawn as glyphs)
ICON_SRC = {
    "sword": "weapon_regular_sword", "dagger": "weapon_knife", "greatsword": "weapon_anime_sword",
    "bow": "weapon_bow", "axe": "weapon_axe", "katana": "weapon_katana", "mace": "weapon_mace",
    "staff": "weapon_green_magic_staff",
    "potion_hp": "flask_red", "potion_mp": "flask_blue", "potion_sp": "flask_green",
    "coin": "coin_anim_f0",
}
IC = 24  # icon cell size


def _glyph(kind):
    from PIL import ImageDraw
    im = Image.new("RGBA", (IC, IC), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    steel, dark, gold, leather, gem = (176, 184, 198, 255), (40, 44, 58, 255), (224, 184, 92, 255), (150, 96, 54, 255), (120, 200, 255, 255)
    cx = IC // 2
    if kind == "helm":
        d.rectangle([5, 6, IC - 6, 14], fill=steel, outline=dark); d.rectangle([5, 14, IC - 6, 18], fill=steel, outline=dark)
    elif kind == "chest":
        d.rectangle([5, 4, IC - 6, IC - 5], fill=steel, outline=dark); d.line([cx, 5, cx, IC - 6], fill=dark)
    elif kind == "hands":
        d.rectangle([4, 7, 10, 18], fill=leather, outline=dark); d.rectangle([14, 7, 20, 18], fill=leather, outline=dark)
    elif kind == "feet":
        d.rectangle([4, 11, 10, 19], fill=leather, outline=dark); d.rectangle([14, 11, 20, 19], fill=leather, outline=dark)
    elif kind == "shield":
        d.polygon([(cx, 4), (IC - 5, 8), (IC - 7, 16), (cx, IC - 4), (6, 16), (4, 8)], fill=steel, outline=dark)
    elif kind == "ring":
        d.ellipse([6, 9, 18, IC - 4], outline=gold, width=2); d.rectangle([10, 5, 13, 9], fill=gem)
    elif kind == "necklace":
        d.arc([5, 4, IC - 5, IC - 4], 25, 155, fill=gold, width=2); d.polygon([(cx - 2, 14), (cx + 2, 14), (cx, 19)], fill=gem)
    else:  # misc
        d.rectangle([5, 5, IC - 6, IC - 6], fill=(126, 112, 92, 255), outline=dark)
    return im


def build_icons():
    dt = Image.open(os.path.join(DT, "atlas.png")).convert("RGBA")
    rects = _load_rects(os.path.join(DT, "tile_list.txt"))
    sheet = Image.new("RGBA", (len(ICON_KEYS) * IC, IC), (0, 0, 0, 0))
    for i, key in enumerate(ICON_KEYS):
        if key in ICON_SRC:
            x, y, w, h = rects[ICON_SRC[key]]
            sprite = dt.crop((x, y, x + w, y + h))
            s = min((IC - 4) / w, (IC - 4) / h)               # fit with a 2px margin
            nw, nh = max(1, round(w * s)), max(1, round(h * s))
            sprite = sprite.resize((nw, nh), Image.NEAREST)
            cell_img = Image.new("RGBA", (IC, IC), (0, 0, 0, 0))
            cell_img.alpha_composite(sprite, ((IC - nw) // 2, (IC - nh) // 2))
        else:
            cell_img = _glyph(key)
        sheet.alpha_composite(cell_img, (i * IC, 0))
    out = os.path.join(ROOT, "assets", "icons.png")
    sheet.save(out)
    print(f"icons.png {sheet.size} ({len(ICON_KEYS)} icons) -> {out}")


if __name__ == "__main__":
    build_tiles()
    build_bg()
    build_atlas()
    build_icons()
