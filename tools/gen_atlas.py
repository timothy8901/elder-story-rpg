#!/usr/bin/env python3
"""
Pack the in-game character sprites into a transparent texture atlas the game
loads at runtime (rendering/Atlas.ts). No labels/backdrops — just the figures,
nearest-neighbour upscaled by PX. Prints the TS index to paste into Atlas.ts.
Output: assets/atlas.png
"""
import os
from PIL import Image
from sprite_lib import (W, H, resolve, draw_char, draw_dragon, draw_wolf,
                        draw_werewolf, draw_skeleton, draw_spider, draw_crab)

PX = 3
CW, CH = W * PX, H * PX     # 54 x 78 per cell
COLS = 8

# key -> sprite config (drawer chosen by optional "kind")
ATLAS = [
    ("hero", dict(race="nord", body="#3f78c0", body_style="tunic", accent="#2d5994", hair="#5a3a1c", weapon="sword")),
    ("werewolf", dict(kind="werewolf", body="#4a3f33", accent="#2e261d", eyes="#ffd24a")),
    # ground enemies
    ("wolf", dict(kind="wolf", body="#8a8f98", accent="#62666e", eyes="#ffd24a")),
    ("bandit", dict(race="nord", body="#6a5a3a", body_style="armor", accent="#41331f", hair="#3a2a18", beard=True, head="hood", hood_color="#4a3a26", hairstyle="none", weapon="axe")),
    ("draugr", dict(race="draugr", body="#4a4636", body_style="armor", accent="#34301f", beard=True, beard_color="#8a8d80", head="horned_helm", hairstyle="none", weapon="sword")),
    ("draugr_overlord", dict(race="draugr", body="#26262e", body_style="armor", accent="#caa24a", head="mask", mask_color="#caa24a", weapon="sword")),
    # dwemer mages
    ("dwarven_battlemage", dict(race="nord", body="#9c7a3e", body_style="armor", accent="#6e5428", beard=True, beard_color="#b9a06a", head="horned_helm", hairstyle="none", weapon="hammer")),
    ("dwarven_warlord", dict(race="nord", body="#cda94e", body_style="armor", accent="#8a6e2c", beard=True, beard_color="#d8c074", head="crown", hairstyle="none", weapon="hammer")),
    # faction recruiters (key = faction id)
    ("npc_legion", dict(race="nord", body="#8a8f98", body_style="armor", accent="#7a2a2a", hair="#caa24a", hairstyle="long")),
    ("npc_stormcloaks", dict(race="nord", body="#5a4632", body_style="armor", accent="#7a6a4a", beard=True, beard_color="#9a9a9a", head="horned_helm", weapon="axe")),
    ("npc_companions", dict(race="nord", body="#5a4632", body_style="armor", accent="#7a2a2a", hair="#b0482a", hairstyle="long", weapon="bow")),
    ("npc_college", dict(race="nord", body="#3a5a8a", body_style="robe", accent="#caa24a", beard=True, beard_color="#cfd2d6", head="hood", hood_color="#3a5a8a", hairstyle="none", weapon="staff")),
    ("npc_thievesGuild", dict(race="nord", body="#2f4a36", body_style="armor", accent="#1c2c20", hair="#b0482a", beard=True, beard_color="#b0482a", weapon="dagger")),
    ("npc_darkBrotherhood", dict(race="nord", body="#2a1c22", body_style="armor", accent="#7a2a2a", head="hood", hood_color="#2a1c22", hairstyle="none", weapon="dagger")),
    ("npc_blades", dict(race="breton", body="#7a6a4a", body_style="armor", accent="#caa24a", hair="#e8d27a", hairstyle="long", weapon="sword")),
    ("npc_bards", dict(race="altmer", body="#caa24a", body_style="tunic", accent="#7a2a2a", hair="#e8e8e8", hairstyle="long", weapon="lute")),
    # story NPCs + vendor
    ("npc_courier", dict(race="imperial", body="#b9a04a", body_style="tunic", accent="#6a5a3a", hair="#5a4a3a")),
    ("npc_arngeir", dict(race="nord", body="#6a6d72", body_style="robe", accent="#4a4d52", beard=True, beard_color="#cfd2d6", head="greybeard_hood", hairstyle="none")),
    ("npc_calcelmo", dict(race="breton", body="#5a4a8a", body_style="robe", accent="#8aa0c0", beard=True, beard_color="#cfd2d6", hairstyle="none", weapon="staff")),
    ("npc_merchant", dict(race="breton", body="#6a5a8a", body_style="tunic", accent="#caa24a", hair="#3a2a18", beard=True)),
]

DRAWERS = {"dragon": draw_dragon, "wolf": draw_wolf, "werewolf": draw_werewolf,
           "skeleton": draw_skeleton, "spider": draw_spider, "crab": draw_crab}


def render(c):
    p = resolve(c)
    fn = DRAWERS.get(c.get("kind"))
    return fn(p) if fn else draw_char(p)


def main():
    n = len(ATLAS)
    rows = (n + COLS - 1) // COLS
    sheet = Image.new("RGBA", (COLS * CW, rows * CH), (0, 0, 0, 0))
    index = {}
    for i, (key, cfg) in enumerate(ATLAS):
        spr = render(cfg).resize((CW, CH), Image.NEAREST)
        col, row = i % COLS, i // COLS
        sheet.alpha_composite(spr, (col * CW, row * CH))
        index[key] = (col, row)
    out = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "assets", "atlas.png"))
    os.makedirs(os.path.dirname(out), exist_ok=True)
    sheet.save(out)
    print(f"Wrote {out}  ({sheet.width}x{sheet.height}, {n} sprites, PX={PX} cell={CW}x{CH} cols={COLS})")
    print("---- paste into Atlas.ts ----")
    print(f"const PX = {PX}, COLS = {COLS};")
    body = ",\n  ".join(f'{k}: [{c}, {r}]' for k, (c, r) in index.items())
    print("const SPRITES: Record<string, [number, number]> = {\n  " + body + ",\n};")


if __name__ == "__main__":
    main()
