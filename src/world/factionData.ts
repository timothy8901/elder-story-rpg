/**
 * Static definitions for the joinable factions. Pure data (no imports beyond the
 * id type) so it can be shared by the faction state machine, NPCs, dialogue,
 * spells, and the menu without creating dependency cycles.
 */

export type FactionId =
  | "legion"
  | "stormcloaks"
  | "college"
  | "companions"
  | "thievesGuild"
  | "darkBrotherhood"
  | "blades"
  | "bards";

/** A perk/spell/power unlocked when a faction questline is completed. */
export type FactionUnlock = "beastForm" | "lightning";

export type ObjectiveType = "kill" | "killBoss" | "killSpell" | "sneakKill" | "dragonKill" | "gold";

export interface FactionData {
  id: FactionId;
  name: string;
  recruiter: string;
  /** Sprite/robe accent color. */
  color: string;
  /** Recruiter's opening pitch. */
  blurb: string;
  /** The task given on joining. */
  objective: string;
  objectiveType: ObjectiveType;
  objectiveCount: number;
  /** Rank titles indexed by rank (0 = starting rank). */
  ranks: string[];
  rewardText: string;
  /** Item base ids granted on promotion. */
  rewards: string[];
  /** Special mechanic/spell granted on promotion. */
  unlock?: FactionUnlock;
  /** Mutually-exclusive faction (joining one bars the other). */
  rival?: FactionId;
}

export const FACTION_DATA: Record<FactionId, FactionData> = {
  legion: {
    id: "legion",
    name: "Imperial Legion",
    recruiter: "Legate Rikke",
    color: "#c0413a",
    blurb: "The Empire needs steady swords to hold Skyrim together. Will you serve?",
    objective: "Defeat 3 foes in the Empire's name.",
    objectiveType: "kill",
    objectiveCount: 3,
    ranks: ["Auxiliary", "Quaestor", "Legate"],
    rewardText: "Imperial steel and the Legion's discipline (+armor).",
    rewards: ["imperial_sword", "imperial_helmet"],
    rival: "stormcloaks",
  },
  stormcloaks: {
    id: "stormcloaks",
    name: "Stormcloaks",
    recruiter: "Galmar Stone-Fist",
    color: "#3b6fb0",
    blurb: "Skyrim belongs to her sons and daughters. Will you fight for her freedom?",
    objective: "Defeat 3 foes for the rebellion.",
    objectiveType: "kill",
    objectiveCount: 3,
    ranks: ["Unblooded", "Ice-Veins", "Bone-Breaker"],
    rewardText: "Stormcloak arms and a Nord's vigor (+health).",
    rewards: ["stormcloak_axe", "stormcloak_cuirass"],
    rival: "legion",
  },
  companions: {
    id: "companions",
    name: "The Companions",
    recruiter: "Aela the Huntress",
    color: "#9c7b43",
    blurb: "We are shield-siblings, bound by honor. Prove yourself in battle.",
    objective: "Slay the Draugr Lord in Hollowdeep Cave.",
    objectiveType: "killBoss",
    objectiveCount: 1,
    ranks: ["Whelp", "Shield-Sibling", "Harbinger"],
    rewardText: "A Skyforge blade and the gift of Beast Form — press R to transform.",
    rewards: ["skyforge_sword"],
    unlock: "beastForm",
  },
  college: {
    id: "college",
    name: "College of Winterhold",
    recruiter: "Tolfdir",
    color: "#6f6bd6",
    blurb: "The arcane arts reward a curious mind. Will you study with us?",
    objective: "Defeat 2 foes using spells.",
    objectiveType: "killSpell",
    objectiveCount: 2,
    ranks: ["Apprentice", "Adept", "Arch-Mage"],
    rewardText: "College robes and the Lightning Bolt spell — cycle to it with Q.",
    rewards: ["college_robes"],
    unlock: "lightning",
  },
  thievesGuild: {
    id: "thievesGuild",
    name: "Thieves Guild",
    recruiter: "Brynjolf",
    color: "#2f6b4a",
    blurb: "Lookin' for coin, friend? The Guild rewards those with light fingers and lighter morals.",
    objective: "Prove your guile — carry 300 gold at once.",
    objectiveType: "gold",
    objectiveCount: 300,
    ranks: ["Footpad", "Prowler", "Guild Master"],
    rewardText: "The Nightingale Blade, Guild leathers (+stamina), and a knack for finding extra coin.",
    rewards: ["nightingale_blade", "thieves_armor"],
  },
  darkBrotherhood: {
    id: "darkBrotherhood",
    name: "Dark Brotherhood",
    recruiter: "Astrid",
    color: "#5a2733",
    blurb: "We know what you did. We can use someone with your talents… for the right kind of work.",
    objective: "Fulfill a contract — land 3 sneak kills.",
    objectiveType: "sneakKill",
    objectiveCount: 3,
    ranks: ["Initiate", "Assassin", "Listener"],
    rewardText: "The Blade of Woe, Shrouded Armor, and deadlier strikes from the shadows.",
    rewards: ["blade_of_woe", "shrouded_armor"],
  },
  blades: {
    id: "blades",
    name: "The Blades",
    recruiter: "Delphine",
    color: "#9c3a34",
    blurb: "Dragonslayers, once sworn to the Dragonborn. The dragons have returned — and so must we.",
    objective: "Hunt the winged scourge — slay 2 dragons.",
    objectiveType: "dragonKill",
    objectiveCount: 2,
    ranks: ["Initiate", "Blade", "Grandmaster"],
    rewardText: "An Akaviri katana and Blades armor (+armor, +health).",
    rewards: ["akaviri_katana", "blades_armor"],
  },
  bards: {
    id: "bards",
    name: "Bards College",
    recruiter: "Viarmo",
    color: "#c08a3e",
    blurb: "Every hero needs a song. Gather tales of valor, and we'll make you legend in verse.",
    objective: "Collect tales of valor — defeat 4 foes.",
    objectiveType: "kill",
    objectiveCount: 4,
    ranks: ["Student", "Bard", "Poet Laureate"],
    rewardText: "A fine Lute, an Amulet of Tales (+magicka), and a poet's vigor.",
    rewards: ["lute", "amulet_of_tales"],
  },
};

export const FACTION_IDS = Object.keys(FACTION_DATA) as FactionId[];
