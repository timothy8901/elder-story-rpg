#!/usr/bin/env python3
"""
Sprite sheet for Elder-Story-RPG's own cast & bestiary in the same flat pixel-art
style: the player, the game's monsters (wolves, bandits, draugr, dwarves,
dragons) and the game-specific NPCs. (Named human NPCs — recruiters, the
Greybeard, the scholar — are in skyrim-npc-sprites.png.)
Output: assets/elder-story-cast-sprites.png
"""
import os
from sprite_lib import resolve, draw_char, draw_dragon, draw_wolf, build_sheet

CAST = [
    # The player
    dict(name="Hero (You)", race="nord", body="#3f78c0", body_style="tunic", accent="#2d5994", hair="#5a3a1c", weapon="sword"),
    # Beasts & bandits (overworld + cave foes)
    dict(name="Wolf", kind="wolf", body="#8a8f98", accent="#62666e", eyes="#ffd24a"),
    dict(name="Bandit", race="nord", body="#6a5a3a", body_style="armor", accent="#41331f", hair="#3a2a18", beard=True, head="hood", hood_color="#4a3a26", hairstyle="none", weapon="axe"),
    dict(name="Draugr", race="draugr", body="#4a4636", body_style="armor", accent="#34301f", beard=True, beard_color="#8a8d80", head="horned_helm", hairstyle="none", weapon="sword"),
    dict(name="Draugr Overlord", race="draugr", body="#26262e", body_style="armor", accent="#caa24a", head="mask", mask_color="#caa24a", weapon="sword"),
    # Dwemer battle-mages
    dict(name="Dwarven Battle-Mage", race="nord", body="#9c7a3e", body_style="armor", accent="#6e5428", beard=True, beard_color="#b9a06a", head="horned_helm", hairstyle="none", weapon="hammer"),
    dict(name="Dwarven Warlord", race="nord", body="#cda94e", body_style="armor", accent="#8a6e2c", beard=True, beard_color="#d8c074", head="crown", hairstyle="none", weapon="hammer"),
    # Dragons
    dict(name="Dragon", kind="dragon", body="#3f7d4a", accent="#2f5e38", eyes="#ffd24a"),
    dict(name="Sahloknir", kind="dragon", body="#7d6a3a", accent="#5e4f2c", eyes="#ffd24a"),
    dict(name="Alduin", kind="dragon", body="#2b2533", accent="#1a1626", eyes="#ff3b30"),
    # Game-specific NPCs
    dict(name="Courier", race="imperial", body="#b9a04a", body_style="tunic", accent="#6a5a3a", hair="#5a4a3a"),
    dict(name="Merchant", race="breton", body="#6a5a8a", body_style="tunic", accent="#caa24a", hair="#3a2a18", beard=True),
]


def render(c):
    p = resolve(c)
    k = c.get("kind")
    if k == "dragon":
        return draw_dragon(p)
    if k == "wolf":
        return draw_wolf(p)
    return draw_char(p)


def main():
    items = [(render(c), c["name"]) for c in CAST]
    out = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "assets", "elder-story-cast-sprites.png"))
    os.makedirs(os.path.dirname(out), exist_ok=True)
    w, h = build_sheet(items, "Elder-Story-RPG  -  Cast & Bestiary  (original flat pixel-art)", out, cols=6)
    print(f"Wrote {out}  ({w}x{h}, {len(items)} sprites)")


if __name__ == "__main__":
    main()
