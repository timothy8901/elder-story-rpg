#!/usr/bin/env python3
"""
Sprite sheet of original, flat pixel-art "retro handheld" sprites for the most
important named Skyrim NPCs. ORIGINAL stylized fan art (not Bethesda assets).
Drawer + grid layout live in sprite_lib.py. Output: assets/skyrim-npc-sprites.png
"""
import os
from sprite_lib import resolve, draw_char, draw_dragon, build_sheet

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
    items = []
    for npc in NPCS:
        p = resolve(npc)
        img = draw_dragon(p) if npc.get("kind") == "dragon" else draw_char(p)
        items.append((img, npc["name"]))
    out = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "assets", "skyrim-npc-sprites.png"))
    os.makedirs(os.path.dirname(out), exist_ok=True)
    w, h = build_sheet(items, "Elder-Story-RPG  -  NPC Sprite Sheet  (original flat pixel-art, fan-made)", out, cols=8)
    print(f"Wrote {out}  ({w}x{h}, {len(items)} sprites)")


if __name__ == "__main__":
    main()
