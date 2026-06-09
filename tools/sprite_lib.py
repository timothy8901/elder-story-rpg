#!/usr/bin/env python3
"""
Shared pixel-art sprite drawing for the sprite-sheet generators.

Draws original, flat "retro handheld" chibi figures on a tiny logical canvas
(then nearest-neighbour upscaled for crisp pixels), plus a side-view beast and a
dragon. `build_sheet` lays rendered sprites into a labeled grid PNG.
"""
from PIL import Image, ImageDraw, ImageFont

W, H, PX = 18, 26, 6            # logical sprite size + upscale factor
SPR_W, SPR_H = W * PX, H * PX     # 108 x 156
CELL_W, CELL_H = SPR_W + 24, SPR_H + 34
MARGIN, HEADER = 18, 64

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
    "draugr":   dict(skin="#9aa6ac", ear="human", eyes="#6fe0ff"),
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


def _char_pose(pose, frame):
    """Per-frame pixel offsets for the humanoid: whole-figure bob, each leg
    (dx,dy), arm-swing (aw: right +, left -), and weapon (wpx,wpy)."""
    if pose == "walk":
        return [
            dict(bob=0, llx=-1, lly=0, lrx=1, lry=1, aw=1, wpx=0, wpy=0),
            dict(bob=-1, llx=0, lly=0, lrx=0, lry=0, aw=0, wpx=0, wpy=0),
            dict(bob=0, llx=1, lly=1, lrx=-1, lry=0, aw=-1, wpx=0, wpy=0),
            dict(bob=-1, llx=0, lly=0, lrx=0, lry=0, aw=0, wpx=0, wpy=0),
        ][frame % 4]
    if pose == "attack":
        return [
            dict(bob=0, llx=0, lly=0, lrx=0, lry=0, aw=-1, wpx=-2, wpy=-4),  # wind up
            dict(bob=0, llx=0, lly=0, lrx=1, lry=0, aw=3, wpx=3, wpy=2),     # strike / lunge
            dict(bob=0, llx=0, lly=0, lrx=0, lry=0, aw=1, wpx=1, wpy=0),     # recover
        ][frame % 3]
    return dict(bob=(0 if frame % 2 == 0 else -1), llx=0, lly=0, lrx=0, lry=0, aw=0, wpx=0, wpy=0)


def draw_char(p, pose="idle", frame=0):
    o = _char_pose(pose, frame)
    aw, wx, wy = o["aw"], o["wpx"], o["wpy"]
    img = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    ImageDraw.Draw(img).ellipse([4, 24, 13, 25], fill="#00000040")  # shadow stays put
    fig = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(fig)
    cx = 9
    skin, body, accent = p["skin"], p["body"], p["accent"]
    if p["cape"]:
        fillp(d, [(4, 13), (13, 13), (15, 25), (2, 25)], p["cape"])
    d.rectangle([6 + o["llx"], 22 + o["lly"], 8 + o["llx"], 25 + o["lly"]], fill="#3a2c1c")
    d.rectangle([9 + o["lrx"], 22 + o["lry"], 11 + o["lrx"], 25 + o["lry"]], fill="#3a2c1c")
    if p["body_style"] == "robe":
        fillp(d, [(5, 13), (12, 13), (14, 24), (3, 24)], body)
        d.rectangle([8, 13, 9, 24], fill=accent)
    elif p["body_style"] == "armor":
        d.rectangle([4, 13, 13, 22], fill=body)
        d.ellipse([2, 12, 6, 16], fill=body)
        d.ellipse([11, 12, 15, 16], fill=body)
        d.rectangle([4, 19, 13, 20], fill=accent)
    else:
        d.rectangle([5, 13, 12, 23], fill=body)
        d.rectangle([5, 13, 12, 15], fill=accent)
    armskin = skin if p["body_style"] != "armor" else body
    d.rectangle([3 - aw, 14, 4 - aw, 19], fill=armskin)
    d.rectangle([13 + aw, 14, 14 + aw, 19], fill=armskin)
    d.ellipse([3, 2, 14, 13], fill=skin)
    if p["ear"] == "elf":
        fillp(d, [(3, 6), (1, 4), (4, 8)], skin)
        fillp(d, [(14, 6), (16, 4), (13, 8)], skin)
    elif p["ear"] == "cat":
        fillp(d, [(4, 3), (4, 0), (7, 3)], skin)
        fillp(d, [(13, 3), (13, 0), (10, 3)], skin)
    if p["snout"] == "khajiit":
        d.ellipse([6, 8, 11, 12], fill="#e8d8b0")
        d.point((8, 10), fill="#3a2a18")
    elif p["snout"] == "argonian":
        fillp(d, [(8, 7), (16, 9), (8, 12)], skin)
    if p["horns"]:
        fillp(d, [(4, 3), (1, 0), (5, 4)], "#cdb98a")
        fillp(d, [(13, 3), (16, 0), (12, 4)], "#cdb98a")
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
    if p["beard"]:
        fillp(d, [(5, 9), (12, 9), (10, 14), (7, 14)], p["beard_color"])
    if p["head"] not in ("mask", "fullhelm"):
        d.point((7, 7), fill=p["eyes"])
        d.point((10, 7), fill=p["eyes"])
        if p["tusks"]:
            d.point((7, 11), fill="#fff8e0")
            d.point((10, 11), fill="#fff8e0")
    head = p["head"]
    if head == "hood":
        c = p.get("hood_color", accent)
        fillp(d, [(2, 7), (2, 3), (8, 0), (15, 3), (15, 7), (12, 4), (5, 4)], c)
    elif head == "greybeard_hood":
        fillp(d, [(2, 8), (2, 3), (8, 0), (15, 3), (15, 8), (12, 5), (5, 5)], "#8a8d92")
    elif head == "helm":
        d.chord([2, 0, 15, 10], 180, 360, fill="#8a8a94")
        d.rectangle([8, 4, 9, 9], fill="#75757f")
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
    wpn = p["weapon"]
    if wpn == "sword":
        d.rectangle([15 + wx, 9 + wy, 16 + wx, 20 + wy], fill="#cdd3dc"); d.rectangle([14 + wx, 13 + wy, 17 + wx, 14 + wy], fill="#6b4a2a")
    elif wpn == "axe":
        d.rectangle([15 + wx, 11 + wy, 16 + wx, 21 + wy], fill="#6b4a2a"); fillp(d, [(14 + wx, 9 + wy), (17 + wx, 10 + wy), (17 + wx, 13 + wy), (14 + wx, 12 + wy)], "#9aa0aa")
    elif wpn == "hammer":
        d.rectangle([15 + wx, 11 + wy, 16 + wx, 22 + wy], fill="#6b4a2a"); d.rectangle([13 + wx, 8 + wy, 17 + wx, 12 + wy], fill="#80808a")
    elif wpn == "staff":
        d.rectangle([15 + wx, 7 + wy, 16 + wx, 22 + wy], fill="#6b4a2a"); d.ellipse([13 + wx, 4 + wy, 17 + wx, 8 + wy], fill="#8ad8ff")
    elif wpn == "dagger":
        d.rectangle([15 + wx, 13 + wy, 16 + wx, 19 + wy], fill="#cdd3dc")
    elif wpn == "bow":
        d.arc([13 + wx, 8 + wy, 18 + wx, 22 + wy], 300, 60, fill="#7a5a2a"); d.line([16 + wx, 9 + wy, 16 + wx, 21 + wy], fill="#d8d8d8")
    elif wpn == "lute":
        d.ellipse([13 + wx, 16 + wy, 17 + wx, 22 + wy], fill="#9c6b3f"); d.rectangle([15 + wx, 8 + wy, 16 + wx, 17 + wy], fill="#6b4a2a")
    img.alpha_composite(fig, (0, o["bob"]))
    return img


def draw_dragon(p):
    img = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    c, c2, eye = p["body"], p["accent"], p["eyes"]
    d.ellipse([4, 24, 14, 25], fill="#00000040")
    fillp(d, [(6, 12), (1, 5), (3, 14), (8, 15)], c2)
    d.ellipse([4, 12, 13, 20], fill=c)
    fillp(d, [(3, 14), (0, 11), (4, 17)], c)
    fillp(d, [(11, 14), (15, 5), (17, 8), (13, 16)], c)
    d.ellipse([13, 4, 18, 9], fill=c)
    fillp(d, [(16, 4), (18, 1), (17, 6)], c2)
    d.point((16, 6), fill=eye)
    return img


def _wolf_pose(pose, frame):
    """bob (whole-body y), lift (per-leg dy for the 4 legs), lunge (whole-body dx)."""
    if pose == "walk":
        return [
            dict(bob=0, lift=(-1, 0, -1, 0), lunge=0),
            dict(bob=-1, lift=(0, 0, 0, 0), lunge=0),
            dict(bob=0, lift=(0, -1, 0, -1), lunge=0),
            dict(bob=-1, lift=(0, 0, 0, 0), lunge=0),
        ][frame % 4]
    if pose == "attack":
        return [
            dict(bob=0, lift=(0, 0, 0, 0), lunge=-1),
            dict(bob=0, lift=(0, 0, 0, 0), lunge=2),
            dict(bob=0, lift=(0, 0, 0, 0), lunge=1),
        ][frame % 3]
    return dict(bob=(0 if frame % 2 == 0 else -1), lift=(0, 0, 0, 0), lunge=0)


def draw_wolf(p, pose="idle", frame=0):
    """A side-view chibi beast (wolf/animal)."""
    o = _wolf_pose(pose, frame)
    lift = o["lift"]
    img = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    ImageDraw.Draw(img).ellipse([3, 23, 16, 25], fill="#00000040")  # shadow fixed
    fig = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(fig)
    c, c2, eye = p["body"], p["accent"], p["eyes"]
    # tail
    fillp(d, [(2, 16), (0, 11), (4, 18)], c2)
    # legs (per-leg vertical lift for the gait)
    for k, lx in enumerate((5, 8, 11, 13)):
        d.rectangle([lx, 20 + lift[k], lx + 1, 24 + lift[k]], fill=c2)
    # body
    d.ellipse([3, 13, 14, 22], fill=c)
    d.ellipse([4, 18, 13, 23], fill=c2)  # belly shade
    # head (front-right) + snout
    d.ellipse([10, 10, 17, 18], fill=c)
    fillp(d, [(15, 13), (18, 14), (15, 17)], c)   # snout
    d.point((17, 15), fill="#1a1a1a")             # nose
    # ears
    fillp(d, [(11, 11), (10, 7), (13, 11)], c)
    fillp(d, [(14, 11), (16, 7), (15, 11)], c)
    # eye
    d.point((14, 13), fill=eye)
    img.alpha_composite(fig, (o["lunge"], o["bob"]))
    return img


def _beast_pose(pose, frame):
    """bob, leg dx (llx/lrx), arm-swing ax (right +, left -), lunge dx."""
    if pose == "walk":
        return [
            dict(bob=0, llx=-1, lrx=1, ax=1, lunge=0),
            dict(bob=-1, llx=0, lrx=0, ax=0, lunge=0),
            dict(bob=0, llx=1, lrx=-1, ax=-1, lunge=0),
            dict(bob=-1, llx=0, lrx=0, ax=0, lunge=0),
        ][frame % 4]
    if pose == "attack":
        return [
            dict(bob=0, llx=0, lrx=0, ax=-1, lunge=-1),
            dict(bob=0, llx=0, lrx=0, ax=3, lunge=2),
            dict(bob=0, llx=0, lrx=0, ax=1, lunge=1),
        ][frame % 3]
    return dict(bob=(0 if frame % 2 == 0 else -1), llx=0, lrx=0, ax=0, lunge=0)


def draw_werewolf(p, pose="idle", frame=0):
    """A hunched bipedal beast (also the player's Beast Form)."""
    o = _beast_pose(pose, frame)
    ax = o["ax"]
    img = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    ImageDraw.Draw(img).ellipse([4, 24, 14, 25], fill="#00000040")  # shadow fixed
    fig = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(fig)
    c, c2, eye = p["body"], p["accent"], p["eyes"]
    d.rectangle([6 + o["llx"], 20, 8 + o["llx"], 25], fill=c2)   # legs
    d.rectangle([10 + o["lrx"], 20, 12 + o["lrx"], 25], fill=c2)
    d.ellipse([4, 11, 14, 21], fill=c)              # hunched torso
    d.ellipse([5, 15, 12, 21], fill=c2)             # belly
    d.rectangle([2 - ax, 12, 4 - ax, 19], fill=c)   # arms (swing)
    d.rectangle([14 + ax, 12, 16 + ax, 19], fill=c)
    fillp(d, [(2 - ax, 19), (3 - ax, 22), (4 - ax, 19)], "#e8e4d8")    # claws
    fillp(d, [(15 + ax, 19), (16 + ax, 22), (17 + ax, 19)], "#e8e4d8")
    d.ellipse([8, 3, 17, 12], fill=c)               # wolf head
    fillp(d, [(16, 7), (18, 8), (16, 10)], c)       # snout
    d.point((17, 9), fill="#1a1a1a")
    fillp(d, [(9, 4), (8, 0), (11, 4)], c)          # ears
    fillp(d, [(14, 4), (16, 0), (15, 4)], c)
    d.point((12, 7), fill=eye)
    d.point((15, 7), fill=eye)
    img.alpha_composite(fig, (o["lunge"], o["bob"]))
    return img


def draw_skeleton(p):
    img = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    c, c2 = p["body"], p["accent"]
    d.ellipse([4, 24, 13, 25], fill="#00000040")
    d.rectangle([7, 21, 8, 25], fill=c)             # legs
    d.rectangle([10, 21, 11, 25], fill=c)
    d.rectangle([6, 13, 12, 21], fill=c)            # ribcage
    for ry in (15, 17, 19):
        d.line([7, ry, 11, ry], fill=c2)            # ribs
    d.line([9, 13, 9, 20], fill=c2)                 # spine
    d.rectangle([4, 13, 5, 19], fill=c)             # arms
    d.rectangle([13, 13, 14, 19], fill=c)
    d.ellipse([4, 3, 14, 13], fill=c)               # skull
    d.rectangle([6, 7, 8, 9], fill="#141414")       # eye sockets
    d.rectangle([10, 7, 12, 9], fill="#141414")
    d.point((9, 10), fill="#141414")                # nasal
    d.line([7, 12, 11, 12], fill=c2)                # teeth
    if p["weapon"] == "sword":
        d.rectangle([15, 9, 16, 20], fill="#cdd3dc")
        d.rectangle([14, 13, 17, 14], fill="#6b4a2a")
    return img


def draw_spider(p):
    img = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    c, c2, eye = p["body"], p["accent"], p["eyes"]
    d.ellipse([3, 23, 15, 25], fill="#00000040")
    for k, ly in enumerate((12, 15, 18, 21)):       # 8 splayed legs
        d.line([7, 16, 0, ly], fill=c2)
        d.line([11, 16, 18, ly], fill=c2)
    d.ellipse([4, 13, 14, 23], fill=c)              # abdomen
    d.ellipse([6, 10, 12, 16], fill=c2)             # cephalothorax
    for ex, ey in ((7, 12), (10, 12), (8, 13), (9, 13)):
        d.point((ex, ey), fill=eye)                 # eye cluster
    d.point((7, 15), fill="#fff8e0")                # fangs
    d.point((11, 15), fill="#fff8e0")
    return img


def draw_crab(p):
    img = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    c, c2, eye = p["body"], p["accent"], p["eyes"]
    d.ellipse([3, 23, 15, 25], fill="#00000040")
    for lx in (2, 4):                               # legs
        d.line([6, 21, lx, 24], fill=c2)
    for lx in (13, 15):
        d.line([11, 21, lx, 24], fill=c2)
    d.ellipse([0, 15, 5, 20], fill=c)               # left claw
    d.ellipse([12, 15, 17, 20], fill=c)             # right claw
    d.rectangle([4, 17, 6, 18], fill=c2)
    d.rectangle([11, 17, 13, 18], fill=c2)
    d.chord([4, 12, 13, 24], 180, 360, fill=c)      # shell dome
    d.ellipse([4, 18, 13, 23], fill=c2)
    d.line([7, 14, 7, 10], fill=c2)                 # eye stalks
    d.line([10, 14, 10, 10], fill=c2)
    d.point((7, 9), fill=eye)
    d.point((10, 9), fill=eye)
    return img


def build_sheet(items, title, out_path, cols=8):
    """items: list of (PIL RGBA image at logical WxH, label). Saves a labeled grid PNG."""
    n = len(items)
    rows = (n + cols - 1) // cols
    sheet_w = cols * CELL_W + 2 * MARGIN
    sheet_h = HEADER + rows * CELL_H + MARGIN
    sheet = Image.new("RGBA", (sheet_w, sheet_h), "#161b27")
    sd = ImageDraw.Draw(sheet)
    font = ImageFont.load_default()
    sd.text((MARGIN, 20), title, fill="#ffd45e", font=font)
    for i, (img, label) in enumerate(items):
        spr = img.resize((SPR_W, SPR_H), Image.NEAREST)
        col, row = i % cols, i // cols
        cx0 = MARGIN + col * CELL_W
        cy0 = HEADER + row * CELL_H
        sd.rectangle([cx0 + 2, cy0 + 2, cx0 + CELL_W - 4, cy0 + CELL_H - 4], fill="#1e2433", outline="#2c3550")
        sheet.alpha_composite(spr, (cx0 + (CELL_W - SPR_W) // 2, cy0 + 6))
        line1, line2 = label, ""
        if len(label) > 16 and " " in label:
            parts = label.split(" ")
            half = len(parts) // 2 or 1
            line1, line2 = " ".join(parts[:half]), " ".join(parts[half:])
        ly = cy0 + SPR_H + 10
        for li, line in enumerate((line1, line2)):
            if not line:
                continue
            w = sd.textlength(line, font=font)
            sd.text((cx0 + (CELL_W - w) // 2, ly + li * 11), line, fill="#e8edf4", font=font)
    sheet.convert("RGB").save(out_path)
    return sheet_w, sheet_h
