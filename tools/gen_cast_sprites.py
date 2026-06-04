#!/usr/bin/env python3
"""
Sprite sheet for Elder-Story-RPG's own cast & bestiary in the same flat pixel-art
style: the player, the game's monsters (wolves, bandits, draugr, dwarves,
dragons) and the game-specific NPCs. (Named human NPCs — recruiters, the
Greybeard, the scholar — are in skyrim-npc-sprites.png.)
Output: assets/elder-story-cast-sprites.png
"""
import os
from sprite_lib import (resolve, draw_char, draw_dragon, draw_wolf,
                        draw_werewolf, draw_skeleton, draw_spider, draw_crab, build_sheet)

CAST = [
    # The player
    dict(name="Hero (You)", race="nord", body="#3f78c0", body_style="tunic", accent="#2d5994", hair="#5a3a1c", weapon="sword"),
    dict(name="Hero (Beast Form)", kind="werewolf", body="#4a3f33", accent="#2e261d", eyes="#ffd24a"),
    # Beasts & bandits (overworld + cave foes)
    dict(name="Wolf", kind="wolf", body="#8a8f98", accent="#62666e", eyes="#ffd24a"),
    dict(name="Sabre Cat", kind="wolf", body="#b89a5a", accent="#8a6f3a", eyes="#caa23a"),
    dict(name="Bandit", race="nord", body="#6a5a3a", body_style="armor", accent="#41331f", hair="#3a2a18", beard=True, head="hood", hood_color="#4a3a26", hairstyle="none", weapon="axe"),
    dict(name="Draugr", race="draugr", body="#4a4636", body_style="armor", accent="#34301f", beard=True, beard_color="#8a8d80", head="horned_helm", hairstyle="none", weapon="sword"),
    dict(name="Draugr Overlord", race="draugr", body="#26262e", body_style="armor", accent="#caa24a", head="mask", mask_color="#caa24a", weapon="sword"),
    dict(name="Skeleton", kind="skeleton", body="#e6e2d4", accent="#9a968a", weapon="sword"),
    # Cave & wilds creatures
    dict(name="Frostbite Spider", kind="spider", body="#3a4450", accent="#222a32", eyes="#8ad8ff"),
    dict(name="Mudcrab", kind="crab", body="#7a5a3a", accent="#4a3522", eyes="#1a1a1a"),
    dict(name="Frost Troll", race="nord", skin="#dfe6ec", body="#cdd6de", body_style="tunic", accent="#aab4be", hairstyle="wild", hair="#eef2f6", beard=True, beard_color="#eef2f6", eyes="#3a8ad8"),
    dict(name="Giant", race="nord", skin="#b09a78", body="#7a6a52", body_style="tunic", accent="#4a3a26", hairstyle="long", hair="#5a4a3a", beard=True, beard_color="#5a4a3a", weapon="hammer"),
    # Dwemer battle-mages
    dict(name="Dwarven Battle-Mage", race="nord", body="#9c7a3e", body_style="armor", accent="#6e5428", beard=True, beard_color="#b9a06a", head="horned_helm", hairstyle="none", weapon="hammer"),
    dict(name="Dwarven Warlord", race="nord", body="#cda94e", body_style="armor", accent="#8a6e2c", beard=True, beard_color="#d8c074", head="crown", hairstyle="none", weapon="hammer"),
    # Dragons
    dict(name="Dragon", kind="dragon", body="#3f7d4a", accent="#2f5e38", eyes="#ffd24a"),
    dict(name="Sahloknir", kind="dragon", body="#7d6a3a", accent="#5e4f2c", eyes="#ffd24a"),
    dict(name="Alduin", kind="dragon", body="#2b2533", accent="#1a1626", eyes="#ff3b30"),
    # Human foes & NPCs
    dict(name="Whiterun Guard", race="nord", body="#caa24a", body_style="armor", accent="#3a5a8a", head="helm", hairstyle="none", weapon="sword"),
    dict(name="Necromancer", race="breton", body="#1c1c22", body_style="robe", accent="#6a2a8a", head="hood", hood_color="#1c1c22", hairstyle="none", eyes="#a050d0", weapon="staff"),
    dict(name="Vampire", race="nord", skin="#cdd0d8", body="#3a2030", body_style="robe", accent="#7a2a2a", hair="#1a1a1a", hairstyle="long", eyes="#ff3030", cape="#2a1018"),
    dict(name="Courier", race="imperial", body="#b9a04a", body_style="tunic", accent="#6a5a3a", hair="#5a4a3a"),
    dict(name="Merchant", race="breton", body="#6a5a8a", body_style="tunic", accent="#caa24a", hair="#3a2a18", beard=True),
]

DRAWERS = {
    "dragon": draw_dragon, "wolf": draw_wolf, "werewolf": draw_werewolf,
    "skeleton": draw_skeleton, "spider": draw_spider, "crab": draw_crab,
}


def render(c):
    p = resolve(c)
    fn = DRAWERS.get(c.get("kind"))
    return fn(p) if fn else draw_char(p)


def main():
    items = [(render(c), c["name"]) for c in CAST]
    out = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "assets", "elder-story-cast-sprites.png"))
    os.makedirs(os.path.dirname(out), exist_ok=True)
    w, h = build_sheet(items, "Elder-Story-RPG  -  Cast & Bestiary  (original flat pixel-art)", out, cols=6)
    print(f"Wrote {out}  ({w}x{h}, {len(items)} sprites)")


if __name__ == "__main__":
    main()
