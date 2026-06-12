# Credits

## Art

### Sunny Land — Luis Zuno (@ansimuz)
- **License:** CC0 1.0 (public domain — no attribution required; credited here as a courtesy)
- **Used for:** the **field** theme — ground tileset (`assets/tiles.png`) and parallax
  backdrops (`assets/bg/field_back.png`, `assets/bg/field_mid.png`), sliced from the
  pack by `tools/build_assets.py`.
- **Source:** https://opengameart.org/content/sunny-land-2d-pixel-art-pack
  (direct mirror: `https://opengameart.org/sites/default/files/sunny-land-files.zip`)
- **Rebuild:** download the pack into `assets/raw/sunny-land/` (git-ignored), then run
  `python3 tools/build_assets.py` and bump `ASSET_VERSION` in `src/config.ts`.

### DungeonTileset II — @0x72
- **License:** CC0 1.0 (public domain — no attribution required; credited here as a courtesy)
- **Used for:** the character **sprite atlas** (`assets/atlas.png`) — the hero, enemies,
  and NPCs. `tools/build_assets.py` maps each game entity to its closest 0x72 character
  (e.g. hero→knight, draugr→skeleton, battle-mage→wizard) with per-faction tints, then
  packs idle/walk/attack frames into the grid `src/rendering/Atlas.ts` expects.
- **Source:** https://0x72.itch.io/dungeontileset-ii (CC0). The build reads the v1.7
  atlas + `tile_list_v1.7` frame map; drop both in `assets/raw/dungeon-tileset-ii/`
  (git-ignored) as `atlas.png` + `tile_list.txt` to rebuild.

The dragons, cave/Dwemer themes, HUD, particles, and banner remain procedural/original,
drawn at runtime by the renderer in `src/rendering/`. The character sprites approximate
the game's custom cast (draugr, Dwemer mages, faction NPCs) with the closest pack art.
