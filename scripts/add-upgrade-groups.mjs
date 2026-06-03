// One-shot script: adds "upgradeGroup" to faction JSON options.
// Run with: node scripts/add-upgrade-groups.mjs
import { readFileSync, writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dir = dirname(fileURLToPath(import.meta.url));
const PUBLIC = join(__dir, "../public");

// Map of optionId → upgradeGroup value.
// Keyed by option id (scoped within a unit, but ids are descriptive enough to be unique globally in practice).
// Where the same id appears in multiple units (e.g. inf-sgt-pistol in Infiltrators AND Infernus),
// the same group assignment applies to both — which is correct.
const GROUPS = {
  // ── SPACE MARINES ──────────────────────────────────────────────────
  // Primaris Techmarine
  "ptm-grenades": "Techmarine",
  "ptm-servitor-weapon": "Servitor",
  "ptm-master-of-the-forge": "Techmarine",
  // Techmarine
  "tm-grenades": "Techmarine",
  "tm-servitor-weapon": "Servitor",
  "tm-bike": "Techmarine",
  "tm-master-of-the-forge": "Techmarine",
  // Assault Intercessor
  "ai-sgt-pistol": "Sergeant",
  "ai-sgt-melee": "Sergeant",
  "ai-sgt-grenades": "Sergeant",
  // Incursor
  "inc-sgt-pistol": "Sergeant",
  "inc-sgt-melee": "Sergeant",
  "inc-sgt-grenades": "Sergeant",
  // Infiltrator
  "inf-sgt-pistol": "Sergeant",
  "inf-sgt-melee": "Sergeant",
  "inf-sgt-grenades": "Sergeant",
  "inf-comms-array": "Sergeant",
  // Intercessor
  "int-sgt-pistol": "Sergeant",
  "int-sgt-melee": "Sergeant",
  "int-sgt-grenades": "Sergeant",
  "int-aux-grenade": "Marine",
  // Tactical Squad
  "tac-sgt-ranged": "Sergeant",
  "tac-sgt-pistol": "Sergeant",
  "tac-sgt-melee": "Sergeant",
  "tac-sgt-grenades": "Sergeant",
  "tac-special": "Marine",
  "tac-heavy": "Marine",
  "tac-sgt-stormshield": "Sergeant",
  "tac-sgt-terminator-armour": "Sergeant",
  // Heavy Intercessor
  "hi-sgt-pistol": "Sergeant",
  "hi-sgt-melee": "Sergeant",
  "hi-sgt-grenades": "Sergeant",
  "hi-heavy-bolter": "Marine",
  // Bladeguard Veterans
  "bg-sgt-pistol": "Sergeant",
  // Company Veterans
  "cv-sgt-grenades": "Sergeant",
  "cv-heavy": "Veteran",
  // Damned Legionnaires
  "dl-sgt-ranged": "Sergeant",
  "dl-sgt-pistol": "Sergeant",
  "dl-sgt-melee": "Sergeant",
  "dl-sgt-grenades": "Sergeant",
  "dl-special": "Marine",
  "dl-heavy": "Marine",
  // Primaris Sternguard
  "ps-sgt-grenades": "Sergeant",
  // Reiver
  "rv-sgt-pistol": "Sergeant",
  // Scout Squad
  "sc-sgt-ranged": "Sergeant",
  "sc-sgt-pistol": "Sergeant",
  "sc-sgt-melee": "Sergeant",
  "sc-sgt-grenades": "Sergeant",
  "sc-marine-ranged": "Scout",
  "sc-special": "Scout",
  "sc-heavy": "Scout",
  // Sternguard Veterans
  "sv-sgt-grenades": "Sergeant",
  // Primaris Scout
  "psc-sgt-ranged": "Sergeant",
  "psc-sgt-pistol": "Sergeant",
  "psc-sgt-melee": "Sergeant",
  "psc-sgt-grenades": "Sergeant",
  "psc-marine-ranged": "Scout",
  "psc-heavy": "Scout",
  // Primaris Vanguard Veterans
  "pvv-sgt-melee": "Sergeant",
  "pvv-sgt-grenades": "Sergeant",
  "pvv-melee": "Veteran",
  // Vanguard Veterans
  "vv-sgt-grenades": "Sergeant",
  // Terminators
  "term-sgt-melee": "Sergeant",
  "term-melee": "Terminator",
  // Primaris Terminators
  "pt-sgt-melee": "Sergeant",
  "pt-melee": "Terminator",
  // Assault Squad
  "as-sgt-pistol": "Sergeant",
  "as-sgt-melee": "Sergeant",
  "as-sgt-grenades": "Sergeant",
  "as-special": "Marine",
  // Bike Squad
  "bs-sgt-pistol": "Sergeant",
  "bs-sgt-melee": "Sergeant",
  "bs-sgt-grenades": "Sergeant",
  "bs-special": "Marine",
  "bs-ab-heavy": "Attack Bike",
  // Outrider
  "or-sgt-grenades": "Sergeant",
  // Scout Bike
  "sb-sgt-ranged": "Sergeant",
  "sb-sgt-pistol": "Sergeant",
  "sb-sgt-melee": "Sergeant",
  "sb-sgt-grenades": "Sergeant",
  // Desolation Squad
  "des-sgt-heavy": "Sergeant",
  "des-sgt-melee": "Sergeant",
  "des-sgt-grenades": "Sergeant",
  "des-squad-heavy": "Marine",
  // Devastator Squad
  "dv-sgt-ranged": "Sergeant",
  "dv-sgt-pistol": "Sergeant",
  "dv-sgt-melee": "Sergeant",
  "dv-sgt-grenades": "Sergeant",
  "dv-heavy": "Marine",
  "dv-stormshield": "Sergeant",
  "dv-terminator-armour": "Sergeant",
  // Infernus Squad
  "inf-squad-weapon": null,  // squad-wide, no group (overrides inf-sgt-* above if needed)
  // Hellblaster Squad
  "hb-sgt-pistol": "Sergeant",
  "hb-sgt-melee": "Sergeant",
  "hb-sgt-grenades": "Sergeant",
  // Eliminator Squad
  "el-grenades": "Sergeant",
  // Eradicator Squad
  "er-grenades": "Sergeant",
  "er-heavy": "Eradicator",

  // ── CHAOS UNDIVIDED ────────────────────────────────────────────────
  // Dark Commune
  "commune-dem-pistol": "Demagogue",
  "commune-dem-ranged": "Demagogue",
  "commune-dem-melee": "Demagogue",
  "commune-ib-melee": "Icon Bearer",
  "commune-spell-1": "Mindwitch",
  "commune-spell-2": "Mindwitch",
  // Beastmen Horde
  "bh-champ-pistol": "Champion",
  // Chaos Space Marines
  "csm-champ-pistol": "Champion",
  "csm-champ-ranged": "Champion",
  "csm-champ-melee": "Champion",
  "csm-marine-ranged": "Marine",
  "csm-marine-melee": "Marine",
  "csm-special-1": "Marine",
  "csm-special-2": "Marine",
  // Chaos Terminators
  "term-champ-melee": "Champion",
  "term-ranged": "Terminator",
  "term-heavy-2": "Terminator",
  // Chaos Bikers
  "bik-champ-pistol": "Champion",
  "bik-champ-melee": "Champion",
  "bik-marine-melee": "Marine",
  "bik-special": "Marine",
  // Raptors
  "rap-champ-pistol": "Champion",
  "rap-champ-melee": "Champion",
  "rap-special": "Marine",
  // Havocs
  "hav-champ-pistol": "Champion",
  "hav-champ-melee": "Champion",
  "hav-marine-heavy": "Marine",
  "hav-marine-melee": "Marine",

  // ── IMPERIAL GUARD ─────────────────────────────────────────────────
  // Company Command Squad
  "ccs-cmd-pistol": "Company Commander",
  "ccs-cmd-melee": "Company Commander",
  "ccs-vet-rifle": "Veteran",
  "ccs-vet-hf": "Veteran",
  "ccs-vet-special": "Veteran",
  "ccs-demochg": "Veteran",
  "ccs-hwt-swap": "Veteran Heavy Weapon Team",
  "ccs-vet-melee": "Veteran",
  "ccs-vet-sword": "Veteran",
  // Commissar Graves
  "graves-vigilance-augar": "Vigilance",
  "graves-vigilance-camo": "Vigilance",
  "graves-vigilance-extra": "Vigilance",
  "graves-vigilance-recovery": "Vigilance",
  "graves-vigilance-searchlight": "Vigilance",
  "graves-vigilance-smoke": "Vigilance",
  // Enginseer
  "eng-grenade": "Enginseer",
  "eng-servitor-weapon": "Servitor",
  // Ministorum Priest
  "mp-pistol": "Ministorum Priest",
  "mp-plasma-ranged": "Ministorum Priest",
  "mp-melee": "Ministorum Priest",
  "mp-prayer-protects": "Ministorum Priest",
  "mp-prayer-strength": "Ministorum Priest",
  "mp-prayer-righteous": "Ministorum Priest",
  // Veterans
  "vet-sgt-pistol": "Veteran Sergeant",
  "vet-sgt-melee": "Veteran Sergeant",
  "vet-rifle": "Veteran",
  "vet-hf": "Veteran",
  "vet-special": "Veteran",
  "vet-demochg": "Veteran",
  "vet-hwt-swap": "Veteran Heavy Weapon Team",
  // Platoon Command Squad (IG platoon units share similar patterns)
  "pcs-cmd-pistol": "Platoon Commander",
  "pcs-cmd-melee": "Platoon Commander",
  "pcs-vet-hf": "Veteran",
  "pcs-vet-special": "Veteran",
  "gs-sgt-pistol": "Sergeant",
  "gs-sgt-melee": "Sergeant",
  "gs-hf": "Guardsman",
  "gs-special": "Guardsman",
  "gs-heavy": "Guardsman",

  // ── ELDAR ──────────────────────────────────────────────────────────
  // All aspect warrior squads: exarch swaps
  "exarch-ranged-swap": "Exarch",
  "exarch-melee-swap": "Exarch",
  "exarch-melee": "Exarch",
  "exarch-weapon-swap": "Exarch",
  // Guardian Defenders
  "ranged-swap": "Defender",
  "platform-weapon-swap": "Platform",
  // Storm Guardians
  "special-weapon": "Guardian",

  // ── ORKS ───────────────────────────────────────────────────────────
  // Ork Boyz
  "ob-boss-nob": "Boss Boy",
  "ob-boss-ranged": "Boss Boy",
  "ob-boss-melee": "Boss Boy",
  "ob-boy-melee": "Ork Boy",
  "ob-special": "Ork Boy",
  // Burna Boyz
  "bb-boss-nob": "Spanner",
  "bb-grot-oiler": "Spanner",
  "bb-spanner-ranged": "Spanner",
  "bb-spanner-melee": "Spanner",
  "bb-boy-burna": "Burna Boy",
  // Kommandoz
  "ko-boss-nob": "Boss Boy",
  "ko-boss-ranged": "Boss Boy",
  "ko-boss-melee": "Boss Boy",
  "ko-special": "Kommando",
  // Tank Bustas
  "tb-boss-nob": "Boss Boy",
  "tb-boss-melee": "Boss Boy",
  "tb-special": "Tank Busta",
  // Deffkoptas
  "dk-boss-nob": "Boss Boy",
  "dk-boss-melee": "Boss Boy",
  // Nob Warbikerz
  "nwb-tandem": "Boss Nob",
  "nwb-boss-ranged": "Boss Nob",
  // Squighog Boyz
  "sqh-boss-nob": "Boss Boy",
  // Storm Boyz
  "sb-boss-nob": "Boss Boy",
  "sb-boss-ranged": "Boss Boy",
  "sb-boss-melee": "Boss Boy",
  "sb-special": "Storm Boy",
  // Warbikerz
  "wb3-boss-nob": "Boss Nob",
  // Grot Tankz
  "gt-kommanda-hull": "Grot Kommanda",
  // Lootaz
  "lo-boss-weapon": "Boss Nob",
  "lo-grot-oiler": "Boss Nob",
};

// Ids that should explicitly have NO upgradeGroup (null = skip even if id looks like it should match)
const SKIP_IDS = new Set([
  "inf-squad-weapon",  // Infernus squad-wide swap
  "inf-helix-gauntlet", // Infiltrator squad-wide
  "int-squad-rifle",   // Intercessor squad-wide
  "hi-squad-rifle",    // Heavy Intercessor squad-wide
  "hb-squad-plasma",   // Hellblaster squad-wide
]);

const FILES = [
  "space-marines_faction.json",
  "chaos-undivided_faction.json",
  "imperial-guard_faction.json",
  "eldar_faction.json",
  "orks_faction.json",
  "necrons_faction.json",
];

let totalUpdated = 0;

for (const file of FILES) {
  const path = join(PUBLIC, file);
  let data;
  try {
    data = JSON.parse(readFileSync(path, "utf8"));
  } catch {
    console.error(`Could not read ${file}`);
    continue;
  }

  let count = 0;
  const processOptions = (opts) => {
    for (const opt of (opts || [])) {
      if (SKIP_IDS.has(opt.id)) continue;
      if (opt.id in GROUPS && GROUPS[opt.id] !== null) {
        if (opt.upgradeGroup !== GROUPS[opt.id]) {
          opt.upgradeGroup = GROUPS[opt.id];
          count++;
        }
      }
    }
  };

  for (const unit of (data.units || [])) {
    processOptions(unit.options);
    // Some units embed sub-unit option arrays (e.g. platoon-style)
    for (const opt of (unit.options || [])) {
      if (opt.options) processOptions(opt.options);
    }
  }

  writeFileSync(path, JSON.stringify(data, null, 2), "utf8");
  console.log(`${file}: updated ${count} options`);
  totalUpdated += count;
}

console.log(`\nTotal options updated: ${totalUpdated}`);
