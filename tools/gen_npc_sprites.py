#!/usr/bin/env python3
"""
Generate ONE sprite sheet of original, flat pixel-art "retro handheld" sprites
for the most important named Skyrim NPCs (Jarls, Greybeards, the Companions,
College, Thieves Guild, Dark Brotherhood, Blades, civil-war leaders, etc.).

These are ORIGINAL stylized fan-art figures (simple geometric pixel characters
varied by race/role/gear) — not copies of Bethesda's artwork. Each sprite is
drawn on a tiny logical canvas then nearest-neighbour upscaled for crisp pixels,
and laid out in a labeled grid. Output: assets/skyrim-npc-sprites.png
"""
import os
from PIL import Image, ImageDraw, ImageFont

W, H, PX = 18, 26, 6          # logical sprite size + upscale factor
SPR_W, SPR_H = W * PX, H * PX   # 108 x 156
CELL_W, CELL_H = SPR_W + 24, SPR_H + 34
COLS = 8
MARGIN, HEADER = 18, 64

# --- Race presets (skin / ears / eyes / muzzle) ---------------------------
RACES = {
    "nord":     dict(skin="#f0c8a0", ear="human", eyes="#3a3a3a"),
    "imperial": dict(skin="#e8b890", ear="human", eyes="#3a3a3a"),
    "redguard": dict(skin="#8a5230", ear="human", eyes="#2a2a2a"),
    "breton":   dict(skin="#eec2a2", ear="human", eyes="#3a3a3a"),
    "dunmer":   dict(skin="#7d7079", ear="elf",   eyes="#d24040"),
    "altmer":   dict(skin="#d6c878", ear="elf",   eyes="#caa23a"),
    "bosmer":   dict(skin="#c39a64", ear="elf",   eyes="#6a8a3a"),
    "orc":      dict(skin="#7e9a58", ear="human", eyes="#c03030", tusks=True),
    "khajiit":  dict(skin="#c8a468", ear="cat",   eyes="#e0c030", snout="khajiit"),
    "argonian": dict(skin="#5d8a5a", ear="none",  eyes="#e0b020", snout="argonian", horns=True),
}

DEFAULTS = dict(
    skin="#f0c8a0", ear="human", snout=None, eyes="#3a3a3a",
    hair="#3a2a18", hairstyle="short", beard=False, beard_color=None,
    head=None, body="#6a6f7a", body_style="tunic", accent="#454a55",
    weapon=None, tusks=False, horns=False, cape=None,
)


def resolve(npc):
    p = dict(DEFAULTS)
    p.update(RACES.get(npc.get("race", "nord"), {}))
    p.update({k: v for k, v in npc.items() if k not in ("name", "race", "kind")})
    if p["beard"] and not p["beard_color"]:
        p["beard_color"] = p["hair"]
    return p


def fillp(d, poly, c):
    d.polygon(poly, fill=c)


def draw_char(p):
    img = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    cx = 9
    skin, body, accent = p["skin"], p["body"], p["accent"]

    # Shadow
    d.ellipse([4, 24, 13, 25], fill="#00000040")

    # Cape (behind body)
    if p["cape"]:
        fillp(d, [(4, 13), (13, 13), (15, 25), (2, 25)], p["cape"])

    # Legs / boots
    d.rectangle([6, 22, 8, 25], fill="#3a2c1c")
    d.rectangle([9, 22, 11, 25], fill="#3a2c1c")

    # Torso
    if p["body_style"] == "robe":
        fillp(d, [(5, 13), (12, 13), (14, 24), (3, 24)], body)
        d.rectangle([8, 13, 9, 24], fill=accent)            # robe seam
    elif p["body_style"] == "armor":
        d.rectangle([4, 13, 13, 22], fill=body)
        d.ellipse([2, 12, 6, 16], fill=body)                # pauldrons
        d.ellipse([11, 12, 15, 16], fill=body)
        d.rectangle([4, 19, 13, 20], fill=accent)           # belt
    else:  # tunic / clothes
        d.rectangle([5, 13, 12, 23], fill=body)
        d.rectangle([5, 13, 12, 15], fill=accent)           # collar

    # Arms
    d.rectangle([3, 14, 4, 19], fill=skin if p["body_style"] != "armor" else body)
    d.rectangle([13, 14, 14, 19], fill=skin if p["body_style"] != "armor" else body)

    # Head
    d.ellipse([3, 2, 14, 13], fill=skin)

    # Ears
    if p["ear"] == "elf":
        fillp(d, [(3, 6), (1, 4), (4, 8)], skin)
        fillp(d, [(14, 6), (16, 4), (13, 8)], skin)
    elif p["ear"] == "cat":
        fillp(d, [(4, 3), (4, 0), (7, 3)], skin)
        fillp(d, [(13, 3), (13, 0), (10, 3)], skin)

    # Snout / muzzle
    if p["snout"] == "khajiit":
        d.ellipse([6, 8, 11, 12], fill="#e8d8b0")
        d.point((8, 10), fill="#3a2a18")
    elif p["snout"] == "argonian":
        fillp(d, [(8, 7), (16, 9), (8, 12)], skin)

    # Horns
    if p["horns"]:
        fillp(d, [(4, 3), (1, 0), (5, 4)], "#cdb98a")
        fillp(d, [(13, 3), (16, 0), (12, 4)], "#cdb98a")

    # Hair
    hair = p["hair"]
    if p["hairstyle"] == "long":
        d.rectangle([2, 5, 4, 14], fill=hair)
        d.rectangle([13, 5, 15, 14], fill=hair)
        d.chord([3, 1, 14, 9], 180, 360, fill=hair)
    elif p["hairstyle"] == "short":
        d.chord([3, 1, 14, 9], 180, 360, fill=hair)
        fillp(d, [(3, 5), (8, 3), (14, 5), (14, 4), (3, 4)], hair)
    elif p["hairstyle"] == "wild":
        d.chord([2, 0, 15, 9], 180, 360, fill=hair)
        for hx in (2, 5, 9, 12, 15):
            fillp(d, [(hx - 1, 4), (hx, 0), (hx + 1, 4)], hair)
    # "bald" / "none": nothing

    # Beard
    if p["beard"]:
        fillp(d, [(5, 9), (12, 9), (10, 14), (7, 14)], p["beard_color"])

    # Eyes (skip if a mask/full helm hides the face)
    if p["head"] not in ("mask", "fullhelm"):
        d.point((7, 7), fill=p["eyes"])
        d.point((10, 7), fill=p["eyes"])
        if p["tusks"]:
            d.point((7, 11), fill="#fff8e0")
            d.point((10, 11), fill="#fff8e0")

    # Headgear
    head = p["head"]
    if head == "hood":
        c = p.get("hood_color", accent)
        fillp(d, [(2, 7), (2, 3), (8, 0), (15, 3), (15, 7), (12, 4), (5, 4)], c)
    elif head == "greybeard_hood":
        fillp(d, [(2, 8), (2, 3), (8, 0), (15, 3), (15, 8), (12, 5), (5, 5)], "#8a8d92")
    elif head == "helm":
        d.chord([2, 0, 15, 10], 180, 360, fill="#8a8a94")
        d.rectangle([8, 4, 9, 9], fill="#75757f")           # nose guard
    elif head == "horned_helm":
        d.chord([2, 0, 15, 10], 180, 360, fill="#8a8a94")
        fillp(d, [(3, 3), (0, 1), (4, 4)], "#e8e0c8")
        fillp(d, [(14, 3), (17, 1), (13, 4)], "#e8e0c8")
    elif head == "circlet":
        d.rectangle([3, 4, 14, 5], fill="#e8c84a")
    elif head == "crown":
        d.rectangle([3, 4, 14, 5], fill="#e8c84a")
        for hx in (4, 8, 13):
            fillp(d, [(hx - 1, 4), (hx, 1), (hx + 1, 4)], "#e8c84a")
    elif head == "mask":
        d.ellipse([3, 2, 14, 13], fill=p.get("mask_color", "#b8a050"))
        d.rectangle([5, 7, 7, 8], fill="#101010")
        d.rectangle([10, 7, 12, 8], fill="#101010")
    elif head == "jester":
        fillp(d, [(3, 5), (8, 3), (14, 5), (16, 0), (12, 4), (8, 1), (5, 4), (1, 0)], "#a02828")

    # Weapon (in the right hand)
    wpn = p["weapon"]
    if wpn == "sword":
        d.rectangle([15, 9, 16, 20], fill="#cdd3dc"); d.rectangle([14, 13, 17, 14], fill="#6b4a2a")
    elif wpn == "axe":
        d.rectangle([15, 11, 16, 21], fill="#6b4a2a"); fillp(d, [(14, 9), (17, 10), (17, 13), (14, 12)], "#9aa0aa")
    elif wpn == "hammer":
        d.rectangle([15, 11, 16, 22], fill="#6b4a2a"); d.rectangle([13, 8, 17, 12], fill="#80808a")
    elif wpn == "staff":
        d.rectangle([15, 7, 16, 22], fill="#6b4a2a"); d.ellipse([13, 4, 17, 8], fill="#8ad8ff")
    elif wpn == "dagger":
        d.rectangle([15, 13, 16, 19], fill="#cdd3dc")
    elif wpn == "bow":
        d.arc([13, 8, 18, 22], 300, 60, fill="#7a5a2a"); d.line([16, 9, 16, 21], fill="#d8d8d8")
    elif wpn == "lute":
        d.ellipse([13, 16, 17, 22], fill="#9c6b3f"); d.rectangle([15, 8, 16, 17], fill="#6b4a2a")

    return img


def draw_dragon(p):
    img = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    c, c2, eye = p["body"], p["accent"], p["eyes"]
    d.ellipse([4, 24, 14, 25], fill="#00000040")
    # wing
    fillp(d, [(6, 12), (1, 5), (3, 14), (8, 15)], c2)
    # body + tail
    d.ellipse([4, 12, 13, 20], fill=c)
    fillp(d, [(3, 14), (0, 11), (4, 17)], c)
    # neck + head
    fillp(d, [(11, 14), (15, 5), (17, 8), (13, 16)], c)
    d.ellipse([13, 4, 18, 9], fill=c)
    fillp(d, [(16, 4), (18, 1), (17, 6)], c2)   # horn
    d.point((16, 6), fill=eye)
    return img


# --- Curated important NPCs ------------------------------------------------
NPCS = [
    # Civil war & Jarls
    dict(name="Ulfric Stormcloak", race="nord", body="#2f5e9c", body_style="armor", accent="#caa24a", hair="#caa24a", beard=True, cape="#5a3a1c", weapon="sword"),
    dict(name="General Tullius", race="imperial", body="#7a2a2a", body_style="armor", accent="#b0b0b8", hair="#8a8a8a", beard=True, beard_color="#8a8a8a"),
    dict(name="Galmar Stone-Fist", race="nord", body="#5a4632", body_style="armor", accent="#7a6a4a", beard=True, beard_color="#9a9a9a", head="horned_helm", weapon="axe"),
    dict(name="Legate Rikke", race="nord", body="#8a8f98", body_style="armor", accent="#7a2a2a", hair="#caa24a", hairstyle="long"),
    dict(name="Balgruuf the Greater", race="nord", body="#3a6ea5", body_style="robe", accent="#caa24a", hair="#caa24a", beard=True, head="circlet"),
    dict(name="Elisif the Fair", race="nord", body="#3a8a8a", body_style="robe", accent="#e8c84a", hair="#e8d27a", hairstyle="long", head="circlet"),
    dict(name="Jarl Korir", race="nord", body="#4a5a6a", body_style="robe", accent="#9a8a5a", hair="#d8c8a8", hairstyle="long"),
    # Greybeards & Blades
    dict(name="Arngeir", race="nord", body="#6a6d72", body_style="robe", accent="#4a4d52", beard=True, beard_color="#cfd2d6", head="greybeard_hood", hairstyle="none"),
    dict(name="Master Borri", race="nord", body="#6a6d72", body_style="robe", accent="#4a4d52", beard=True, beard_color="#cfd2d6", head="greybeard_hood", hairstyle="none"),
    dict(name="Delphine", race="breton", body="#7a6a4a", body_style="armor", accent="#caa24a", hair="#e8d27a", hairstyle="long", weapon="sword"),
    dict(name="Esbern", race="nord", body="#5a4632", body_style="robe", accent="#3a2c1c", beard=True, beard_color="#cfd2d6", head="hood", hood_color="#5a4632", hairstyle="none"),
    # Companions
    dict(name="Kodlak Whitemane", race="nord", body="#6a5a3a", body_style="armor", accent="#8a7a5a", hair="#e8e8e8", beard=True, beard_color="#e8e8e8"),
    dict(name="Aela the Huntress", race="nord", body="#5a4632", body_style="armor", accent="#7a2a2a", hair="#b0482a", hairstyle="long", weapon="bow"),
    dict(name="Vilkas", race="nord", body="#4a4636", body_style="armor", accent="#6a6a4a", hair="#2a2018", beard=True, weapon="sword"),
    dict(name="Farkas", race="nord", body="#4a4636", body_style="armor", accent="#6a6a4a", hair="#2a2018", beard=True),
    dict(name="Skjor", race="nord", body="#5a4632", body_style="armor", accent="#7a6a4a", hair="#8a8a8a", beard=True, beard_color="#8a8a8a"),
    # College of Winterhold
    dict(name="Tolfdir", race="nord", body="#3a5a8a", body_style="robe", accent="#caa24a", beard=True, beard_color="#cfd2d6", head="hood", hood_color="#3a5a8a", hairstyle="none", weapon="staff"),
    dict(name="Savos Aren", race="dunmer", body="#4a2a6a", body_style="robe", accent="#caa24a", hairstyle="bald", weapon="staff"),
    dict(name="Mirabelle Ervine", race="breton", body="#3a5a8a", body_style="robe", accent="#8aa0c0", hair="#6a5a3a", hairstyle="long"),
    dict(name="Ancano", race="altmer", body="#1c1c22", body_style="robe", accent="#caa24a", hair="#e8e8e8", hairstyle="long"),
    dict(name="J'zargo", race="khajiit", body="#3a5a8a", body_style="robe", accent="#caa24a", weapon="staff"),
    dict(name="Brelyna Maryon", race="dunmer", body="#5a3a8a", body_style="robe", accent="#8aa0c0", hair="#1a1a1a", hairstyle="long"),
    dict(name="Onmund", race="nord", body="#3a5a8a", body_style="robe", accent="#8aa0c0", hair="#caa24a"),
    # Thieves Guild
    dict(name="Brynjolf", race="nord", body="#2f4a36", body_style="armor", accent="#1c2c20", hair="#b0482a", beard=True, beard_color="#b0482a", weapon="dagger"),
    dict(name="Mercer Frey", race="breton", body="#2a2a30", body_style="armor", accent="#3a3a44", hair="#5a4a3a", beard=True),
    dict(name="Karliah", race="dunmer", body="#23232c", body_style="armor", accent="#4a3a6a", head="hood", hood_color="#23232c", hairstyle="none", weapon="bow"),
    dict(name="Delvin Mallory", race="breton", body="#3a3228", body_style="armor", accent="#2a241c", hairstyle="bald", beard=True, beard_color="#6a5a3a"),
    dict(name="Vex", race="nord", body="#2f4a36", body_style="armor", accent="#1c2c20", hair="#e8d27a", hairstyle="long", weapon="dagger"),
    dict(name="Maven Black-Briar", race="nord", body="#6a2a3a", body_style="robe", accent="#caa24a", hair="#8a7a6a", hairstyle="long"),
    # Dark Brotherhood
    dict(name="Astrid", race="nord", body="#2a1c22", body_style="armor", accent="#7a2a2a", head="hood", hood_color="#2a1c22", hairstyle="none", weapon="dagger"),
    dict(name="Cicero", race="imperial", body="#7a2828", body_style="tunic", accent="#1c1c1c", head="jester"),
    dict(name="Nazir", race="redguard", body="#2a1c22", body_style="robe", accent="#7a2a2a", beard=True, beard_color="#1a1a1a", head="hood", hood_color="#2a1c22", hairstyle="none"),
    dict(name="Babette", race="breton", body="#3a2030", body_style="tunic", accent="#7a2a2a", hair="#3a2a18", hairstyle="long", eyes="#d24040"),
    # Followers, smiths, priests, misc
    dict(name="Lydia", race="nord", body="#8a8f98", body_style="armor", accent="#5a5f68", hair="#3a2a18", hairstyle="long", weapon="sword"),
    dict(name="Hadvar", race="imperial", body="#8a8f98", body_style="armor", accent="#7a2a2a", hair="#5a4a3a"),
    dict(name="Ralof", race="nord", body="#2f5e9c", body_style="armor", accent="#5a3a1c", hair="#caa24a", beard=True),
    dict(name="Belethor", race="breton", body="#6a5a8a", body_style="tunic", accent="#caa24a", hair="#3a2a18", beard=True),
    dict(name="Adrianne Avenicci", race="imperial", body="#6a4a32", body_style="tunic", accent="#3a2c1c", hair="#3a2a18", hairstyle="long", weapon="hammer"),
    dict(name="Eorlund Gray-Mane", race="nord", body="#6a4a32", body_style="tunic", accent="#3a2c1c", hair="#cfd2d6", beard=True, beard_color="#cfd2d6", weapon="hammer"),
    dict(name="Nazeem", race="redguard", body="#5a3a8a", body_style="robe", accent="#caa24a", beard=True, beard_color="#1a1a1a"),
    dict(name="Heimskr", race="nord", body="#8a7a4a", body_style="robe", accent="#caa24a", hairstyle="wild", beard=True, beard_color="#caa24a"),
    dict(name="Maramal", race="redguard", body="#7a3a2a", body_style="robe", accent="#caa24a", beard=True, beard_color="#1a1a1a", head="hood", hood_color="#7a3a2a", hairstyle="none"),
    dict(name="Calcelmo", race="breton", body="#5a4a8a", body_style="robe", accent="#8aa0c0", beard=True, beard_color="#cfd2d6", hairstyle="none", weapon="staff"),
    dict(name="Viarmo", race="altmer", body="#caa24a", body_style="tunic", accent="#7a2a2a", hair="#e8e8e8", hairstyle="long", weapon="lute"),
    dict(name="Uthgerd", race="nord", body="#6a6f7a", body_style="armor", accent="#5a4632", hair="#5a4a3a", hairstyle="long", weapon="sword"),
    dict(name="Ysolda", race="nord", body="#7a6a4a", body_style="tunic", accent="#caa24a", hair="#b0482a", hairstyle="long"),
    dict(name="M'aiq the Liar", race="khajiit", body="#5a4632", body_style="tunic", accent="#7a6a4a"),
    dict(name="Sheogorath", race="imperial", body="#7a3a6a", body_style="tunic", accent="#3a8a3a", hairstyle="wild", beard=True, beard_color="#cfd2d6"),
    # Dragons
    dict(name="Alduin", kind="dragon", body="#2b2533", accent="#1a1626", eyes="#ff3b30"),
    dict(name="Paarthurnax", kind="dragon", body="#7a7d86", accent="#5a5d66", eyes="#caa23a"),
]


def main():
    n = len(NPCS)
    rows = (n + COLS - 1) // COLS
    sheet_w = COLS * CELL_W + 2 * MARGIN
    sheet_h = HEADER + rows * CELL_H + MARGIN
    sheet = Image.new("RGBA", (sheet_w, sheet_h), "#161b27")
    sd = ImageDraw.Draw(sheet)
    try:
        font = ImageFont.load_default()
    except Exception:
        font = None

    sd.text((MARGIN, 20), "Elder-Story-RPG  -  NPC Sprite Sheet  (original flat pixel-art, fan-made)",
            fill="#ffd45e", font=font)

    for i, npc in enumerate(NPCS):
        p = resolve(npc)
        spr = (draw_dragon(p) if npc.get("kind") == "dragon" else draw_char(p)).resize((SPR_W, SPR_H), Image.NEAREST)
        col, row = i % COLS, i // COLS
        cx0 = MARGIN + col * CELL_W
        cy0 = HEADER + row * CELL_H
        # cell backdrop
        sd.rectangle([cx0 + 2, cy0 + 2, cx0 + CELL_W - 4, cy0 + CELL_H - 4], fill="#1e2433", outline="#2c3550")
        sheet.alpha_composite(spr, (cx0 + (CELL_W - SPR_W) // 2, cy0 + 6))
        # label (wrapped to two lines)
        name = npc["name"]
        line1, line2 = name, ""
        if len(name) > 16 and " " in name:
            parts = name.split(" ")
            half = len(parts) // 2 or 1
            line1, line2 = " ".join(parts[:half]), " ".join(parts[half:])
        ly = cy0 + SPR_H + 10
        for li, line in enumerate((line1, line2)):
            if not line:
                continue
            w = sd.textlength(line, font=font) if hasattr(sd, "textlength") else len(line) * 6
            sd.text((cx0 + (CELL_W - w) // 2, ly + li * 11), line, fill="#e8edf4", font=font)

    out_dir = os.path.join(os.path.dirname(__file__), "..", "assets")
    os.makedirs(out_dir, exist_ok=True)
    out = os.path.abspath(os.path.join(out_dir, "skyrim-npc-sprites.png"))
    sheet.convert("RGB").save(out)
    print(f"Wrote {out}  ({sheet_w}x{sheet_h}, {n} sprites)")


if __name__ == "__main__":
    main()
