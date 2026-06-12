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

All other art (player, enemies, NPCs, dragons, cave/Dwemer themes, HUD, particles,
banner) is procedural/original and drawn at runtime by the renderer in `src/rendering/`.
