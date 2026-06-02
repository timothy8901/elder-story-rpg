# Elder-Story-RPG

A single-player 2D side-scrolling RPG: **MapleStory**-style platforming physics married to **Skyrim**-style progression (use-to-level skills, perks, modular loot, LocalStorage saves). Web-native — HTML5 `<canvas>` + vanilla **TypeScript**, no game engine, no backend. Built to deploy as a static site on GitHub Pages.

> **Status — feature-complete vertical slice.** Custom 2D physics, real-time combat with floating damage numbers, the full use-to-level progression of 15 skills (perks + attributes), modular loot across 9 equipment slots, crafting, a **connected MapleStory-style overworld** (hand-built areas stitched together with edge portals + a cave descent), quests, and a LocalStorage auto-save system. The world is rendered with **procedural, MapleStory-flavored art** — sky/cloud/hill backdrops, grass-topped terrain and wooden footholds, a chibi adventurer, cute mushroom monsters, glowing spell orbs and swirling portals — all drawn on the canvas with no external image assets (hand-authored sprites can replace it later).

## Controls

| Action                | Keys                        |
| --------------------- | --------------------------- |
| Move                  | `←` / `→` or `A` / `D`      |
| Jump (hold = higher)  | `Space` / `↑` / `W`         |
| Drop through platform | `↓` (or `S`) **+** jump     |
| Attack (melee)        | `J`                         |
| Cast spell            | `K`                         |
| Cycle readied spell   | `Q`                         |
| Block (with shield)   | `L`                         |
| Sneak                 | `Shift` (or `C`)            |
| Drink health potion   | `F`                         |
| Talk to NPC           | `E` (when nearby)           |
| Shout / cycle Shout   | `Z` / `V` (Dragonborn)      |
| Beast Form (Companions) | `R`                       |
| Character menu        | `I` or `Esc`                |
| Toggle debug overlay  | `` ` `` (backtick)          |

In the menu: `←/→` switch tabs (Stats & Skills / Inventory / Equipment / Crafting), `↑/↓` select, `Enter` use/equip/craft, `1`/`2`/`3` raise Health/Magicka/Stamina.

## Systems

- **Use-to-level:** swinging trains One-/Two-Handed or Archery, casting trains the matching Magic school, taking hits trains Light/Heavy Armor, blocking trains Block, sneaking trains Sneak, crafting trains Smithing/Alchemy/Enchanting. There is **no kill XP** — skills level from use, and skill gains drive the character level, each granting an attribute point and a perk point.
- **Items & equipment:** loot is generated with random prefixes/suffixes and enchantments (damage/armor, weight, value); nine slots (Head, Chest, Hands, Feet, Shield, Main-Hand, Off-Hand, Ring, Necklace) recompute stats the moment you equip.
- **Main story (Dragonborn):** a faithful, condensed take on Skyrim's main quest — a courier's tale of **Helgen**, slaying your first **dragon** to discover you're **Dragonborn**, climbing the **Throat of the World** to learn the Voice from Arngeir, then learning **Dragonrend** to ground and slay **Alduin** the World-Eater. Driven by a quest state machine with objectives shown in the HUD.
- **Dragons & Thu'um:** flying dragons that hover, swoop, and breathe fire; slaying one absorbs its **soul**. **Shouts** (`Z` to shout, `V` to cycle) are a Dragonborn-only system: **Unrelenting Force** (Fus Ro Dah — knockback), **Fire Breath**, and **Dragonrend** (Joor Zah Frul — the only way to make Alduin mortal). *(This is the main-quest arc with the iconic mechanics — not a 1:1 reproduction of the entire game's content.)*
- **Guilds (8 joinable factions):** recruiter NPCs scattered across the world, with branching dialogue, objectives, gear, and passives — tracked on the menu's Factions tab; talk with `E`.
  - **Imperial Legion** / **Stormcloaks** (Greenreach) — mutually exclusive; your choice sticks.
  - **Companions** (Greenreach) — grant **Beast Form** (`R`); **College of Winterhold** (Greenreach) — teaches **Lightning Bolt**.
  - **Bards College** (Sunlit Meadow) — defeat foes for tales → Lute + Amulet of Tales.
  - **Thieves Guild** (Whispering Woods) — carry 300 gold → Nightingale Blade + 1.5× loot gold.
  - **The Blades** (Imperial Ruins) — slay dragons → Akaviri Katana + Blades armor.
  - **Dark Brotherhood** (Hollowdeep Cave) — land sneak kills → Blade of Woe + deadlier sneak attacks.
- **Persistence:** the full state (coordinates + map, skills/XP, attributes/perks, inventory with enchantments, quest flags, faction membership/rank) auto-saves to LocalStorage on map change, level-up, opening the menu, and faction joins/promotions, and reloads on boot.

## Run locally

The project compiles TypeScript to **native ES modules** with `tsc` — no bundler. ES modules must be served over HTTP (not opened from `file://`), so use the bundled static server.

```bash
cd Elder-Story-RPG
npm install          # one-time: installs the TypeScript compiler
npm run build        # compiles src/ -> dist/
npm run serve        # serves the folder at http://localhost:8080
```

Then open <http://localhost:8080>. While iterating, run `npm run watch` (incremental recompile) in one terminal and `npm run serve` in another.

## Project layout

```
src/
  main.ts            Entry point: builds the Game and starts the loop.
  config.ts          Gameplay tunables (gravity, speeds, camera, palette).
  types.ts           Shared types (Vec2, Rect, TileType).
  core/              Engine: GameLoop, Game, Input, Camera, Renderer.
  physics/           AABB, Body, Tilemap, Physics (collision resolution).
  entities/          Entity base, Player, Enemy, Dragon (flying), NPC.
  combat/            CombatSystem, spells, shouts (Thu'um), DamageNumbers.
  progression/       skills (15 defs + perks), Character (use-to-level engine).
  items/             Item model, loot generation, Inventory, Equipment.
  story/             MainQuest (Skyrim main-quest state machine + Dragonborn state).
  ui/                HUD, Menu (stats/inventory/equipment/crafting/factions), Dialogue.
  save/              SaveManager (LocalStorage serialization).
  world/             GameMap, Quests, Factions, factionData, maps/ (builder + 6 connected areas).
  rendering/         Background, Tiles, sprites (procedural art).
```

**Tuning the feel:** every movement/physics constant lives in [`src/config.ts`](src/config.ts). Adjust `GRAVITY`, `JUMP_VELOCITY`, `MAX_RUN_SPEED`, `CAMERA_LERP`, etc. and rebuild.

**Why `.js` in imports?** Source files import with explicit `.js` extensions (e.g. `import { Game } from "./core/Game.js"`). TypeScript resolves these to the `.ts` source at compile time, and the emitted `dist/*.js` runs natively in the browser without a bundler.

## Deploy to GitHub Pages

A workflow at [`.github/workflows/deploy-pages.yml`](../.github/workflows/deploy-pages.yml) builds this folder with `tsc` and publishes it to Pages on every push to `main`. To activate it:

1. Create a GitHub repository and push this project.
2. In **Settings → Pages**, set **Source** to **GitHub Actions**.

The site then serves at `https://<user>.github.io/<repo>/`. (`dist/` is git-ignored and rebuilt by the workflow, so no compiled output is committed.)

## Roadmap

| Phase | Scope | Status |
| ----- | ----- | ------ |
| 1 | Game loop, 2D physics (gravity, jump, solid/one-way/wall collision, drop-through), player movement, lerp camera, mock rendering, debug overlay. | ✅ done |
| 2 | Combat: enemies with AI, melee hitboxes, spell projectiles, floating damage numbers, blocking, i-frames. | ✅ done |
| 3 | Progression: 15 use-to-level skills (Combat / Magic / Stealth-Crafting), attributes, character level, perk trees. | ✅ done |
| 4 | Items: modular loot (prefix/suffix, enchantments, ratings, weight, value), inventory, 9 equipment slots with live stat recompute, crafting. | ✅ done |
| 5 | Persistence: LocalStorage saves (map change / level up / menu), quest flags, a connected overworld (Greenreach ⇄ Meadow ⇄ Woods ⇄ Ruins, plus a cave) linked by edge portals. | ✅ done |
| Next | Replace placeholder blocks with pixel-art sprites & tilesets; more maps, enemies, quests, and spells. | ⏳ future |
