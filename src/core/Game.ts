import { COLORS } from "../config.js";
import { CombatSystem, type CombatContext } from "../combat/CombatSystem.js";
import { SPELLS } from "../combat/spells.js";
import { SHOUTS, SHOUT_ORDER, type ShoutId } from "../combat/shouts.js";
import { Dragon } from "../entities/Dragon.js";
import { Enemy } from "../entities/Enemy.js";
import { NPC } from "../entities/NPC.js";
import { Player } from "../entities/Player.js";
import { Equipment } from "../items/Equipment.js";
import { EQUIP_SLOTS, EquipSlot, itemDisplayName } from "../items/Item.js";
import { Inventory } from "../items/Inventory.js";
import { generateLoot, makeItem } from "../items/loot.js";
import { intersects } from "../physics/AABB.js";
import { Character, type DerivedModifiers, type ProgressEvent } from "../progression/Character.js";
import { SaveManager, type SaveState } from "../save/SaveManager.js";
import { HUD } from "../ui/HUD.js";
import { Menu } from "../ui/Menu.js";
import { Dialogue, type DialogueNode } from "../ui/Dialogue.js";
import { Factions } from "../world/Factions.js";
import { FACTION_DATA, type FactionId } from "../world/factionData.js";
import { QuestLog } from "../world/Quests.js";
import { MainQuest } from "../story/MainQuest.js";
import type { GameMap, MapExit } from "../world/GameMap.js";
import { createMap, FIRST_MAP_ID } from "../world/maps/index.js";
import { drawBackground } from "../rendering/Background.js";
import { drawTilemap } from "../rendering/Tiles.js";
import { drawNpc, drawPortal } from "../rendering/sprites.js";
import { Camera } from "./Camera.js";
import { Input } from "./Input.js";
import { Renderer } from "./Renderer.js";

const MENU_KEYS = ["KeyI", "Escape"];

/**
 * Top-level coordinator. Owns the world, player, and every RPG subsystem
 * (progression, items, combat, UI, persistence), wires their interactions each
 * step, and drives the auto-save triggers required by the spec (map change,
 * level-up, menu open).
 */
export class Game {
  private readonly input: Input;
  private readonly renderer: Renderer;
  private readonly camera: Camera;
  private debug = false;

  private readonly player: Player;
  private readonly character = new Character();
  private readonly inventory = new Inventory();
  private readonly equipment = new Equipment();
  private readonly combat = new CombatSystem();
  private readonly hud = new HUD();
  private readonly menu = new Menu();
  private readonly quests = new QuestLog();
  private readonly factions = new Factions();
  private readonly mainQuest = new MainQuest();
  private readonly dialogue = new Dialogue();
  private npcs: NPC[] = [];
  // Dragon Shouts.
  private selectedShout: ShoutId | null = null;
  private shoutCooldown = 0;

  private map: GameMap;
  private mapId = FIRST_MAP_ID;
  private selectedSpell = 0;
  private sneakXpTimer = 0;
  /** Animation clock (seconds) for backgrounds, sprites, portals. */
  private animTime = 0;
  // Beast Form (Companions unlock).
  private beastTimer = 0;
  private beastCooldown = 0;

  constructor(canvas: HTMLCanvasElement) {
    this.input = new Input();
    this.renderer = new Renderer(canvas);
    this.player = new Player(0, 0);

    const save = SaveManager.load();
    if (save) {
      this.applyState(save);
      this.map = createMap(this.mapId);
      this.player.body.pos.x = save.player.x;
      this.player.body.pos.y = save.player.y;
      this.hud.pushToast("Save loaded", "#cfe3ff");
    } else {
      this.newGame();
      this.map = createMap(this.mapId);
      this.player.body.pos.x = this.map.spawn.x;
      this.player.body.pos.y = this.map.spawn.y;
    }

    this.camera = new Camera(this.map.tilemap.pixelWidth, this.map.tilemap.pixelHeight);
    this.recomputeStats();
    this.populateEnemies();
    this.populateNpcs();
    if (!this.isSpellAvailable(this.selectedSpell)) this.selectedSpell = 0;
    this.camera.snapTo(this.player.body.centerX, this.player.body.centerY);
  }

  // --- Setup --------------------------------------------------------------

  private newGame(): void {
    const sword = makeItem("iron_sword");
    const armor = makeItem("leather_armor");
    this.equipment.equip(sword);
    this.equipment.equip(armor);
    this.inventory.add(makeItem("iron_dagger"));
    this.inventory.add(makeItem("potion_health"));
    this.inventory.add(makeItem("potion_health"));
    this.inventory.add(makeItem("potion_magicka"));
    this.inventory.gold = 25;
    this.mapId = FIRST_MAP_ID;
  }

  private populateEnemies(): void {
    const enemies: Enemy[] = this.map.enemySpawns.map(
      (s) => new Enemy(s.x, s.y, { health: s.health, damage: s.damage, kind: s.kind, lootLevel: s.lootLevel }),
    );
    // The main story injects dragons into certain maps at certain stages.
    for (const d of this.mainQuest.extraSpawns(this.mapId)) {
      enemies.push(new Dragon(d.x, d.y, { health: d.health, damage: d.damage, kind: d.kind, named: d.named, requiresDragonrend: d.requiresDragonrend }));
    }
    this.combat.setEnemies(enemies);
  }

  /** Spawn the current stage's story dragon into the map we're already standing in. */
  private spawnStoryDragonsHere(): void {
    if (this.combat.enemies.some((e) => e.isDragon)) return; // one dragon at a time
    for (const d of this.mainQuest.extraSpawns(this.mapId)) {
      this.combat.enemies.push(new Dragon(d.x, d.y, { health: d.health, damage: d.damage, kind: d.kind, named: d.named, requiresDragonrend: d.requiresDragonrend }));
      this.hud.pushToast("A dragon descends from the sky!", "#ff6a4a");
    }
  }

  private populateNpcs(): void {
    this.npcs = this.map.npcSpawns.map((s) => new NPC(s));
  }

  /** Merge equipment + faction-passive modifiers into the character's stats. */
  private recomputeStats(): void {
    const mods = this.equipment.modifiers(this.character);
    const passive = this.factions.passiveModifiers();
    (Object.keys(passive) as (keyof DerivedModifiers)[]).forEach((k) => {
      mods[k] += passive[k] ?? 0;
    });
    this.character.applyModifiers(mods);
    this.character.sneakAttackBonus = this.factions.sneakAttackBonus();
  }

  // --- Update -------------------------------------------------------------

  update(dt: number): void {
    this.animTime += dt;
    if (this.input.justPressed("Backquote")) this.debug = !this.debug;

    // A conversation takes over all input while it's open.
    if (this.dialogue.open) {
      this.dialogue.update(this.input);
      this.hud.update(dt);
      this.input.clearTransients();
      return;
    }

    if (this.input.anyPressed(MENU_KEYS)) {
      this.menu.toggle();
      this.autosave(); // saving on open (and close) per spec
    }

    if (this.menu.open) this.updateMenu();
    else this.updateWorld(dt);

    this.hud.update(dt);
    this.input.clearTransients();
  }

  private updateMenu(): void {
    const res = this.menu.update(this.input, this.character, this.inventory, this.equipment);
    if (res.equipmentChanged) this.recomputeStats();
    this.hud.pushProgress(res.progress);
    for (const m of res.messages) this.hud.pushToast(m);
  }

  private updateWorld(dt: number): void {
    const ctx = this.combatContext();

    // Talk to a nearby faction recruiter.
    if (this.input.justPressed("KeyE")) {
      const npc = this.nearbyNpc();
      if (npc) {
        this.talkTo(npc);
        this.input.clearTransients();
        return; // dialogue takes over next frame
      }
    }

    // Enter a ground portal with ↑ / W (portals never trigger automatically).
    if (this.input.anyPressed(["ArrowUp", "KeyW"])) {
      const exit = this.currentExit();
      if (exit) {
        this.transitionTo(exit.toMapId, exit.toSpawn);
        this.input.clearTransients();
        return;
      }
    }

    this.player.update(dt, { input: this.input, map: this.map.tilemap });
    this.updateBeastForm(dt);

    // Combat actions.
    if (this.player.consumeAttack()) {
      this.combat.meleeAttack(this.player, this.character, this.equipment, this.player.sneaking);
    }
    if (this.input.justPressed("KeyK") && this.isSpellAvailable(this.selectedSpell)) {
      this.combat.castSpell(SPELLS[this.selectedSpell]!, this.player, this.character, ctx);
    }
    if (this.input.justPressed("KeyQ")) this.cycleSpell();
    if (this.input.justPressed("KeyF")) this.useHealthPotion();
    if (this.input.justPressed("KeyR")) this.tryBeastForm();
    if (this.input.justPressed("KeyV")) this.cycleShout();
    if (this.input.justPressed("KeyZ")) this.useShout();
    if (this.shoutCooldown > 0) this.shoutCooldown = Math.max(0, this.shoutCooldown - dt);

    // Thieves Guild: gold-carrying objective.
    for (const m of this.factions.checkGold(this.inventory.gold)) {
      this.hud.pushToast(m, "#ffd45e");
      this.autosave();
    }

    // Sneaking trains Sneak over time.
    if (this.player.sneaking && Math.abs(this.player.body.vel.x) > 10) {
      this.sneakXpTimer += dt;
      if (this.sneakXpTimer >= 0.6) {
        this.sneakXpTimer = 0;
        this.hud.pushProgress(this.character.gainSkillXp("sneak", 2));
      }
    }

    this.combat.update(dt, ctx);
    this.camera.follow(this.player.body.centerX, this.player.body.centerY);
  }

  // --- Spells -------------------------------------------------------------

  private isSpellAvailable(index: number): boolean {
    const spell = SPELLS[index];
    if (!spell) return false;
    return !spell.lockedToFaction || this.factions.isPromoted(spell.lockedToFaction);
  }

  private cycleSpell(): void {
    for (let i = 1; i <= SPELLS.length; i++) {
      const next = (this.selectedSpell + i) % SPELLS.length;
      if (this.isSpellAvailable(next)) {
        this.selectedSpell = next;
        this.hud.pushToast(`Readied ${SPELLS[next]!.name}`, "#9ad0ff");
        return;
      }
    }
  }

  // --- Dragon Shouts (Thu'um) ---------------------------------------------

  /** Known shouts in display order. */
  private knownShouts(): ShoutId[] {
    return SHOUT_ORDER.filter((id) => this.mainQuest.knowsShout(id));
  }

  /** Keep the readied shout valid (defaults to the first known one). */
  private ensureSelectedShout(): void {
    const known = this.knownShouts();
    if (this.selectedShout && known.includes(this.selectedShout)) return;
    this.selectedShout = known[0] ?? null;
  }

  private cycleShout(): void {
    const known = this.knownShouts();
    if (known.length === 0) {
      this.hud.pushToast("You know no Shouts yet.", "#9aa4b2");
      return;
    }
    const i = this.selectedShout ? known.indexOf(this.selectedShout) : -1;
    this.selectedShout = known[(i + 1) % known.length]!;
    this.hud.pushToast(`Readied Shout: ${SHOUTS[this.selectedShout].name}`, "#cfe3ff");
  }

  private useShout(): void {
    this.ensureSelectedShout();
    if (!this.selectedShout) {
      this.hud.pushToast("You are no Dragonborn… yet.", "#9aa4b2");
      return;
    }
    if (this.shoutCooldown > 0) return;
    const shout = SHOUTS[this.selectedShout];
    this.combat.shout(shout, this.player);
    this.shoutCooldown = shout.cooldown;
  }

  // --- Factions: dialogue, recruitment, rewards ---------------------------

  /** The faction recruiter the player is standing next to, if any. */
  private nearbyNpc(): NPC | null {
    const px = this.player.body.centerX;
    const py = this.player.body.centerY;
    for (const npc of this.npcs) {
      if (Math.abs(npc.centerX - px) < 42 && Math.abs(npc.y + npc.h / 2 - py) < 60) return npc;
    }
    return null;
  }

  private talkTo(npc: NPC): void {
    npc.facing = this.player.body.centerX >= npc.centerX ? 1 : -1;
    const node = npc.faction ? this.buildFactionDialogue(npc.faction) : this.buildStoryDialogue(npc);
    this.dialogue.start(node);
  }

  /** Build the recruiter's dialogue tree from the faction's current stage. */
  private buildFactionDialogue(id: FactionId): DialogueNode {
    const d = FACTION_DATA[id];
    const s = this.factions.get(id);
    const leave = { label: "Leave.", run: () => null };

    if (this.factions.isRival(id)) {
      return { speaker: d.recruiter, text: `You sided with our enemy. The ${d.name} has no place for a traitor.`, options: [leave] };
    }
    if (!s.joined) {
      const warn = d.rival ? " (This bars you from the rival faction.)" : "";
      return {
        speaker: d.recruiter,
        text: `${d.blurb}${warn}`,
        options: [
          {
            label: `Join the ${d.name}.`,
            run: () => {
              this.factions.join(id);
              this.recomputeStats();
              this.hud.pushToast(`Joined the ${d.name}.`, "#ffd45e");
              this.autosave();
              return { speaker: d.recruiter, text: `Welcome, ${this.factions.rankTitle(id)}. ${d.objective}`, options: [leave] };
            },
          },
          { label: "Not now.", run: () => null },
        ],
      };
    }
    if (s.stage === 1) {
      const prog = d.objectiveType === "killBoss" ? "" : ` (${s.progress}/${d.objectiveCount})`;
      return { speaker: d.recruiter, text: `${d.objective}${prog} Return when it is done.`, options: [leave] };
    }
    if (s.stage === 2) {
      return {
        speaker: d.recruiter,
        text: "Well fought! You've proven yourself.",
        options: [
          {
            label: "Claim your reward.",
            run: () => {
              this.promoteFaction(id);
              return { speaker: d.recruiter, text: `You are now ${this.factions.rankTitle(id)} of the ${d.name}. ${d.rewardText}`, options: [leave] };
            },
          },
        ],
      };
    }
    // Promoted.
    return { speaker: d.recruiter, text: `Stand tall, ${this.factions.rankTitle(id)}. The ${d.name} is honored to have you.`, options: [leave] };
  }

  /** Dialogue for main-story characters (the Courier and Arngeir the Greybeard). */
  private buildStoryDialogue(npc: NPC): DialogueNode {
    const leave = { label: "Leave.", run: () => null };
    const mq = this.mainQuest;

    if (npc.story === "courier") {
      if (mq.stage === "notStarted") {
        return {
          speaker: "Courier",
          text: "You there — I've urgent news, and a feeling you ought to hear it.",
          options: [
            {
              label: "What news?",
              run: () => {
                const lines = mq.startFromCourier();
                this.hud.pushToast("Main Quest: Dragon Rising", "#ffd45e");
                this.autosave();
                return this.narration("Courier", lines);
              },
            },
            { label: "Not now.", run: () => null },
          ],
        };
      }
      return { speaker: "Courier", text: "The fate of Skyrim rests with you now, friend. Walk with the gods.", options: [leave] };
    }

    if (npc.story === "arngeir") {
      if (mq.stage === "wayOfVoice") {
        return {
          speaker: "Arngeir",
          text: "So. The Dragonborn comes to High Hrothgar. We shall teach you the first Word of Power: FUS — Force.",
          options: [
            {
              label: "Learn the Voice.",
              run: () => {
                mq.learnShout("unrelentingForce");
                mq.setStage("bladeInDark");
                this.ensureSelectedShout();
                this.hud.pushToast("Learned Shout: Unrelenting Force (press Z, V to cycle).", "#cfe3ff");
                this.spawnStoryDragonsHere();
                this.autosave();
                return { speaker: "Arngeir", text: "The dragon Sahloknir stirs above the summit. Face it, and prove your Thu'um.", options: [leave] };
              },
            },
          ],
        };
      }
      if (mq.stage === "alduinsBane") {
        return {
          speaker: "Arngeir",
          text: "Alduin cannot be slain by steel alone while he rides the winds. You must learn to bring him down: JOOR ZAH FRUL — Dragonrend.",
          options: [
            {
              label: "Learn Dragonrend.",
              run: () => {
                mq.learnShout("dragonrend");
                mq.setStage("dragonslayer");
                this.ensureSelectedShout();
                this.hud.pushToast("Learned Shout: Dragonrend — ground Alduin, then strike!", "#b06bff");
                this.spawnStoryDragonsHere();
                this.autosave();
                return { speaker: "Arngeir", text: "The World-Eater descends. Cycle to Dragonrend with V, shout with Z to hold him to the earth.", options: [leave] };
              },
            },
          ],
        };
      }
      if (mq.stage === "bladeInDark") {
        return { speaker: "Arngeir", text: "Sahloknir awaits above. Use your Voice — FUS RO DAH.", options: [leave] };
      }
      if (mq.stage === "dragonslayer") {
        return { speaker: "Arngeir", text: "Alduin is here! Ground him with Dragonrend, Dragonborn!", options: [leave] };
      }
      if (mq.stage === "complete") {
        return { speaker: "Arngeir", text: "The World-Eater is no more. Sky above, Voice within — the Greybeards honor you, Dragonborn.", options: [leave] };
      }
      return { speaker: "Arngeir", text: "Seek your destiny below before you climb to us, Dragonborn.", options: [leave] };
    }

    return { speaker: npc.name, text: "…", options: [leave] };
  }

  /** Turn an array of lines into a chain of dialogue nodes ("Continue"). */
  private narration(speaker: string, lines: string[]): DialogueNode {
    const build = (i: number): DialogueNode => ({
      speaker,
      text: lines[i]!,
      options: [{ label: i < lines.length - 1 ? "Continue." : "I understand.", run: () => (i < lines.length - 1 ? build(i + 1) : null) }],
    });
    return build(0);
  }

  private promoteFaction(id: FactionId): void {
    this.factions.promote(id);
    const d = FACTION_DATA[id];
    for (const baseId of d.rewards) {
      const item = makeItem(baseId);
      if (item.slot && !this.equipment.slots[item.slot]) {
        this.equipment.equip(item); // auto-equip into an empty slot
      } else {
        this.inventory.add(item);
      }
      this.hud.pushToast(`Received ${itemDisplayName(item)}.`, "#ffd45e");
    }
    if (d.unlock === "lightning") this.hud.pushToast("Learned Lightning Bolt — cycle spells with Q.", "#bfe8ff");
    if (d.unlock === "beastForm") this.hud.pushToast("Gained Beast Form — press R in battle.", "#e0a0ff");
    this.recomputeStats();
    this.autosave(); // save on promotion
  }

  // --- Beast Form (Companions) --------------------------------------------

  private tryBeastForm(): void {
    if (!this.factions.hasUnlock("beastForm")) return;
    if (this.beastTimer > 0 || this.beastCooldown > 0) return;
    this.beastTimer = 10;
    this.character.outgoingDamageMult = 1.6;
    this.player.speedMult = 1.4;
    this.player.beastMode = true;
    this.hud.pushToast("Beast Form! You feel the blood of the wolf.", "#e0a0ff");
  }

  private updateBeastForm(dt: number): void {
    if (this.beastTimer > 0) {
      this.beastTimer -= dt;
      if (this.beastTimer <= 0) {
        this.character.outgoingDamageMult = 1;
        this.player.speedMult = 1;
        this.player.beastMode = false;
        this.beastCooldown = 22;
        this.hud.pushToast("You return to your mortal form.", "#b6c0d4");
      }
    } else if (this.beastCooldown > 0) {
      this.beastCooldown = Math.max(0, this.beastCooldown - dt);
    }
  }

  /** Build the callback bundle the combat system needs this step. */
  private combatContext(): CombatContext {
    return {
      player: this.player,
      character: this.character,
      equipment: this.equipment,
      map: this.map.tilemap,
      sneaking: this.player.sneaking,
      onPlayerDamaged: (raw, knockDir) => this.damagePlayer(raw, knockDir),
      onProgress: (events) => this.onProgress(events),
      onEnemyDeath: (enemy) => this.onEnemyDeath(enemy),
    };
  }

  private onProgress(events: ProgressEvent[]): void {
    this.hud.pushProgress(events);
    if (events.some((e) => e.characterLevel != null)) this.autosave(); // save on level-up
  }

  private damagePlayer(raw: number, knockDir: number): void {
    if (this.player.isInvulnerable) return;

    const armor = this.character.armorRating;
    const reduction = Math.min(0.85, armor / (armor + 200));
    let dmg = raw * (1 - reduction);

    if (this.player.blocking) {
      const blockFrac = Math.min(0.9, 0.5 * (1 + this.character.perkBonus("block", "blockMult")));
      dmg *= 1 - blockFrac;
      this.hud.pushProgress(this.character.gainSkillXp("block", 5));
      this.combat.damageNumbers.spawnText(this.player.body.centerX, this.player.body.pos.y - 14, "Block!", "#cfd6e0");
    }

    dmg = Math.max(1, Math.round(dmg));
    this.character.hp -= dmg;
    this.player.applyHurt(knockDir);
    this.combat.damageNumbers.spawn(this.player.body.centerX, this.player.body.pos.y, dmg, "#ff8a8a");

    // Wearing armor and taking a hit trains the matching armor skill.
    const armorSkill = this.armorSkillInUse();
    if (armorSkill) this.hud.pushProgress(this.character.gainSkillXp(armorSkill, 5));

    if (this.character.hp <= 0) this.respawn();
  }

  private onEnemyDeath(enemy: Enemy): void {
    const loot = generateLoot(enemy.lootLevel);
    this.inventory.add(loot);
    const gold = Math.round((4 + Math.floor(Math.random() * 12) * enemy.lootLevel) * this.factions.goldFindMult());
    this.inventory.gold += gold;
    this.hud.pushToast(`Looted ${itemDisplayName(loot)} (+${gold}g)`, "#ffd45e");
    const questMsg = this.quests.onEnemySlain();
    if (questMsg) {
      this.hud.pushToast(questMsg, "#7dffa0");
      this.autosave();
    }
    // Advance any faction questline objectives this kill satisfies.
    const facMsgs = this.factions.onKill({ bySpell: enemy.lastHitBySpell, kind: enemy.kind, sneaking: this.player.sneaking, isDragon: enemy.isDragon });
    for (const m of facMsgs) this.hud.pushToast(m, "#ffd45e");
    if (facMsgs.length) this.autosave();

    // Slaying a dragon: absorb its soul and advance the main story.
    if (enemy.isDragon) {
      this.character.hp = this.character.maxHealth; // a soul restores you
      const res = this.mainQuest.onDragonSlain(enemy.kind);
      for (const m of res.messages) this.hud.pushToast(m, res.victory ? "#ffd45e" : "#b06bff");
      this.ensureSelectedShout();
      this.autosave();
    }
  }

  private respawn(): void {
    this.character.hp = this.character.maxHealth;
    this.character.mp = this.character.maxMagicka;
    this.character.sp = this.character.maxStamina;
    const fee = Math.floor(this.inventory.gold * 0.1);
    this.inventory.gold -= fee;
    const sp = this.map.spawnPoints.default ?? this.map.spawn;
    this.player.body.pos.x = sp.x;
    this.player.body.pos.y = sp.y;
    this.player.body.vel.x = 0;
    this.player.body.vel.y = 0;
    this.camera.snapTo(this.player.body.centerX, this.player.body.centerY);
    this.hud.pushToast(`You fell in battle. Recovered at the entrance (-${fee}g).`, "#ff9d9d");
  }

  private useHealthPotion(): void {
    const potion = this.inventory.items.find((i) => i.effect?.stat === "hp");
    if (!potion?.effect) {
      this.hud.pushToast("No healing potions.", "#9aa4b2");
      return;
    }
    this.character.hp = Math.min(this.character.maxHealth, this.character.hp + potion.effect.magnitude);
    this.combat.damageNumbers.spawn(this.player.body.centerX, this.player.body.pos.y - 10, potion.effect.magnitude, "#7dffa0");
    this.inventory.remove(potion.uid);
  }

  private armorSkillInUse(): "lightArmor" | "heavyArmor" | null {
    const chest = this.equipment.slots[EquipSlot.Chest];
    const piece = chest ?? EQUIP_SLOTS.map((s) => this.equipment.slots[s]).find((it) => it?.armorType);
    if (!piece?.armorType) return null;
    return piece.armorType === "heavy" ? "heavyArmor" : "lightArmor";
  }

  /** The ground portal the player is currently standing in, if any. */
  private currentExit(): MapExit | null {
    for (const exit of this.map.exits) {
      if (intersects(this.player.body.rect, exit.rect)) return exit;
    }
    return null;
  }

  private transitionTo(mapId: string, spawnName: string): void {
    this.map = createMap(mapId);
    this.mapId = mapId;
    const sp = this.map.spawnPoints[spawnName] ?? this.map.spawn;
    this.player.body.pos.x = sp.x;
    this.player.body.pos.y = sp.y;
    this.player.body.vel.x = 0;
    this.player.body.vel.y = 0;
    this.camera.setBounds(this.map.tilemap.pixelWidth, this.map.tilemap.pixelHeight);
    this.camera.snapTo(this.player.body.centerX, this.player.body.centerY);
    this.populateEnemies();
    this.populateNpcs();
    this.quests.setFlag(`visited_${mapId}`);
    this.hud.pushToast(`Entering ${this.map.name}`, "#cfe3ff");
    this.autosave(); // save on map change
  }

  // --- Persistence --------------------------------------------------------

  private buildState(): SaveState {
    return {
      version: SaveManager.version,
      mapId: this.mapId,
      player: { x: this.player.body.pos.x, y: this.player.body.pos.y },
      selectedSpell: this.selectedSpell,
      character: this.character.toJSON(),
      inventory: this.inventory.toJSON(),
      equipment: this.equipment.toJSON(),
      quests: this.quests.toJSON(),
      factions: this.factions.toJSON(),
      mainQuest: this.mainQuest.toJSON(),
    };
  }

  private applyState(save: SaveState): void {
    this.mapId = save.mapId;
    this.selectedSpell = save.selectedSpell;
    this.character.load(save.character);
    this.inventory.load(save.inventory);
    this.equipment.load(save.equipment);
    this.quests.load(save.quests);
    if (save.factions) this.factions.load(save.factions);
    if (save.mainQuest) this.mainQuest.load(save.mainQuest);
    this.ensureSelectedShout();
  }

  private autosave(): void {
    SaveManager.save(this.buildState());
  }

  // --- Render -------------------------------------------------------------

  render(fps: number): void {
    const r = this.renderer;
    const cam = this.camera;
    const time = this.animTime;

    drawBackground(r, cam, this.map, time);
    drawTilemap(r, cam, this.map.tilemap, this.map.theme);
    r.withWorld(cam, (ctx) => {
      for (const exit of this.map.exits) drawPortal(ctx, exit, time);
      for (const npc of this.npcs) drawNpc(ctx, npc, this.npcMarker(npc), time);
    });
    this.player.render(r, cam, time);
    this.combat.render(r, cam, time); // enemies, projectiles, floating numbers

    if (this.menu.open) {
      this.menu.render(r, this.character, this.inventory, this.equipment, this.factions);
    } else {
      this.hud.render(r, this.character, this.equipment, SPELLS[this.selectedSpell]!.name, this.inventory.gold);

      // Objective: the main story takes precedence over faction/slay quests.
      const objective = this.mainQuest.active ? `◆ ${this.mainQuest.objective}` : this.quests.activeQuestStatus();
      r.text(objective, r.width - 16, r.height - 16, this.mainQuest.active ? "#ffd45e" : "#b6c0d4", "12px monospace", "right");

      // Current area name, top-center.
      r.fillRectScreen(r.width / 2 - 92, 10, 184, 24, "rgba(0,0,0,0.4)");
      r.text(this.map.name, r.width / 2, 27, "#ffffff", "bold 14px monospace", "center");
      this.renderBeastStatus();
      this.renderDragonborn();

      // "Press E" prompt over a nearby NPC.
      const npc = this.nearbyNpc();
      if (npc && !this.dialogue.open) {
        r.text("Press E to talk", npc.centerX - cam.x, npc.y - cam.y - 38, "#ffffff", "bold 11px monospace", "center");
      }
      // "Press ↑" prompt when standing in a ground portal.
      const exit = this.currentExit();
      if (exit && !this.dialogue.open) {
        const b = this.player.body;
        r.text(`Press ↑ to enter ${exit.label}`, b.centerX - cam.x, b.pos.y - cam.y - 16, "#ffffff", "bold 12px monospace", "center");
      }
      // (Keyboard controls are shown below the canvas, in index.html.)

      if (this.mainQuest.stage === "complete") {
        r.text("✦ ALDUIN IS SLAIN — you are the Dragonborn of legend ✦", r.width / 2, 52, "#ffd45e", "bold 15px monospace", "center");
      }
    }

    this.dialogue.render(r);
    if (this.debug) this.renderDebug(fps);
  }

  /** Quest marker shown above an NPC: "!" available, "?" turn-in ready. */
  private npcMarker(npc: NPC): "" | "!" | "?" {
    if (npc.faction) {
      if (this.factions.isRival(npc.faction)) return "";
      const s = this.factions.get(npc.faction);
      if (!s.joined) return "!";
      if (s.stage === 2) return "?";
      return "";
    }
    // Story characters.
    const st = this.mainQuest.stage;
    if (npc.story === "courier") return st === "notStarted" ? "!" : "";
    if (npc.story === "arngeir") return st === "wayOfVoice" || st === "alduinsBane" ? "!" : "";
    return "";
  }

  private renderBeastStatus(): void {
    if (!this.factions.hasUnlock("beastForm")) return;
    const r = this.renderer;
    let text = "Beast [R]: ready";
    let color = "#e0a0ff";
    if (this.beastTimer > 0) {
      text = `Beast Form: ${this.beastTimer.toFixed(1)}s`;
      color = "#ffcaff";
    } else if (this.beastCooldown > 0) {
      text = `Beast [R]: ${this.beastCooldown.toFixed(0)}s`;
      color = "#9aa4b2";
    }
    r.text(text, 16, r.height - 92, color, "12px monospace");
  }

  private renderDragonborn(): void {
    if (!this.mainQuest.isDragonborn && this.knownShouts().length === 0) return;
    const r = this.renderer;
    const shoutName = this.selectedShout ? SHOUTS[this.selectedShout].name : "—";
    const cd = this.shoutCooldown > 0 ? ` (${this.shoutCooldown.toFixed(1)}s)` : "";
    r.text(
      `Souls ${this.mainQuest.dragonSouls}   Shout [Z] ${shoutName}${cd}`,
      16,
      r.height - 110,
      this.shoutCooldown > 0 ? "#9aa4b2" : "#cfe3ff",
      "12px monospace",
    );
  }

  private renderDebug(fps: number): void {
    const r = this.renderer;
    const b = this.player.body;
    const { col, row } = this.player.tileCoord();
    const lines = [
      `FPS        ${fps}`,
      `map        ${this.mapId}`,
      `pos        ${b.pos.x.toFixed(1)}, ${b.pos.y.toFixed(1)}`,
      `vel        ${b.vel.x.toFixed(1)}, ${b.vel.y.toFixed(1)}`,
      `onGround   ${b.onGround}`,
      `tile       ${col}, ${row}`,
      `enemies    ${this.combat.enemies.length}`,
      `hp/mp/sp   ${Math.round(this.character.hp)}/${Math.round(this.character.mp)}/${Math.round(this.character.sp)}`,
    ];
    r.fillRectScreen(8, 70, 240, lines.length * 16 + 12, COLORS.panel);
    lines.forEach((line, i) => r.text(line, 16, 88 + i * 16, COLORS.text));
    r.strokeRectWorld(this.camera, b.pos.x, b.pos.y, b.w, b.h, COLORS.debugBox, 1);
  }
}
