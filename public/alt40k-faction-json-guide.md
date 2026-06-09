# Alternate 40k — Faction JSON Authoring Guide

> This guide explains the structure and logic of `.faction.json` files so
> that new faction files can be created correctly in any conversation,
> without needing the schema document in context.
>
> Read this before writing any faction JSON.

---

## The big picture

A faction JSON file is a **single source of truth** that powers two apps:

1. **The codex viewer** — renders unit datasheets exactly as they appear in
   the PDF codex, with weapon profiles, special rules, and options.
2. **The list builder** — lets players select units, configure options, and
   track points toward a target.

The file is designed so that **nothing is defined twice**. Weapons, rules,
and common upgrade packages are defined once and referenced everywhere else
by id.

---

## File structure at a glance

```
faction.json
├── schemaVersion          "1.3"
├── faction                Who this army is and how many slots they get
├── armyRules[]            Faction-specific special rules (defined once)
├── commonWargear[]        All weapon profiles (defined once)
├── namedUpgrades{}        Repeated toggle upgrades (Terminator Armour etc.)
├── weaponLists{}          Repeated weapon choice menus (Sergeant melee etc.)
├── spellPools{}           Spell lists for psychic factions
└── units[]                Every unit in the codex
```

---

## Section by section

---

### `faction` — Army identity and org chart

Contains:

- `id` — snake_case unique identifier e.g. `"space_marines"`
- `name` — display name
- `version` — semver of this data file, bump when data changes
- `subfactions[]` — Chapters / Warbands / Hive Fleets / Regiments etc.
  Each has its own `rules[]` (army-wide effects), `slotOverrides[]`
  (e.g. Elysians losing Heavy Support), `slotReclassifications[]`
  (e.g. Death Watch treating Scouts as Troops), and `weaponOverrides[]`
  (e.g. Catachan shortening Lasguns).
- `markSystem` — **Chaos only**. Defines Marks and Pure Blessings.
  Omit entirely for non-Chaos factions.
- `slotLimits` — the army org chart as `[min, max]` pairs.
  Three slots always use `[0, null]` — the app computes the max dynamically
  from the current list state (same rule for every faction):
  - `"Advisor": [0, null]` — max = 3 × number of Troop units in the list
  - `"Ded. Transport": [0, null]` — max = number of units in the list whose
    models carry the Infantry, Bulky, or Very Bulky special rule
  - `"Fortification": [0, null]` — max = 1 per 1000 pts of the battle limit
    (e.g. 2 in a 2000 pt game, regardless of points spent)
  All other slots use a fixed `[min, max]` pair (or `[min, null]` if
  genuinely unbounded).

**Decision rule:** If a faction has no sub-factions (e.g. Tyranids with
Splinter Fleet as the base option), `subfactions` can be omitted or set
to a single "use as written" entry.

---

### `armyRules[]` — Faction-specific special rules

Contains rules that are **unique to this faction** and not in
`core-rules.json`. Each rule has:

- `id` — kebab-case, unique within the file
- `name` — display name
- `fullDesc` — complete rule text, copied verbatim from the codex

**Decision rule:**
- Is the rule in the core rulebook's Terminology section?
  → It's already in `core-rules.json`. Do NOT duplicate it here.
  Just reference its id from `core-rules.json` in unit `specialRules[]`.
- Is the rule unique to this faction (Synapse, Bolter Discipline,
  Adjusted Tactics, Malicious Volleys etc.)?
  → Define it here in `armyRules`.
- Is the rule unique to one specific unit (Gulp, Termagaunt Gestation)?
  → Define it in that unit's `inlineRules[]` instead.

---

### `commonWargear[]` — All weapon profiles

Contains every distinct weapon in this faction, defined **once**.

Each weapon has:
- `id` — kebab-case
- `name` — display name
- `profiles[]` — one entry per firing mode. Each profile has:
  - `label` — `null` for single-mode; `"Krak"` / `"Frag"` for multi-mode
  - `minRange` — number or `null`
  - `maxRange` — number or `null` (null = Melee or template)
  - `strength` — string: `"4"`, `"X2"`, `"User"`, `"*"`, `"+1"`, `"D"`
  - `ap` — string: `"5+"`, `"2+"`, `"-"`, `"1+"`
  - `rules` — a **single string** of comma-separated display rules taken directly from the codex.
    All rules use Title Case display strings — no kebab-case IDs in weapon profiles.
    Multiple rules are joined with `, `: `"Assault 2, Rending, Monsterbane"`.
    - **Shot/count rules** embed the number from the codex: `"Assault 2"`, `"Heavy 1"`,
      `"Pistol 1"`, `"Rapid Fire 1"`, `"Grenade 1"`, `"Extra Attack 1"`.
      Linked variants add a multiplier: `"Assault 3 x2"`, `"Heavy 1 x4"`.
    - **Target-number rules** embed the value: `"Poisoned (3+)"`, `"Sniper (3+)"`,
      `"Haywire (3+)"`.
    - **Other rules** use their display name: `"Rending"`, `"Monsterbane"`, `"Melta"`,
      `"Lance"`, `"Armourbane"`, `"Slow"`, `"Gets Hot!"`, `"One Use Only"`,
      `"Indirect"`, `"Pinning"`, `"Accurate"`, `"Scatter"`, `"Tesla"`, `"Gauss"`,
      `"Destroyer"`, `"Ordnance"`, `"AA"`, `"Ignores Cover"`, `"Nonblast"`,
      `"Auxiliary"`, `"Counterattack"`, `"Dakka"` etc.
    - **Blast sizes and unique effects** are written as-is: `"3\" Blast"`, `"5\" Blast"`,
      `"(Monsterbane)"` (conditional), `"5+ Invulnerability Save against Ranged Attacks"`.
    - The shot count and target numbers **must** come from the codex — they differ per weapon.
  - `castValue` — include only for psychic attack weapons (non-null integer).
    Omit entirely for normal weapons.
- `keywords[]` — include only when non-empty (e.g. `["Bolter"]`). Omit otherwise.
- `templateType` — include only when `"Flame"` or `"Hellstorm"`. Omit otherwise.
- `removesWargear[]` — optional. List of wargear IDs to automatically strip from the model when this item is granted. Use when equipping this weapon is mutually exclusive with another piece of wargear (e.g. a Stormshield variant that removes the model's bolter). Omit unless needed.

**Omit all profile fields that are null** (`label`, `minRange`) and all
weapon-level fields that are empty/null (`castValue`, `keywords`,
`templateType`). See the forward compatibility section.

**Critical rule — NO MOUNTING INFO HERE:**
`arcType` (Hull/Turret/Sponson) and `Primary` keyword live on the **unit's
weapon reference**, not on the weapon definition. The same Assault Cannon
is one entry whether it's Hull-mounted, Turret-mounted, or carried by
infantry. Do not create `assault-cannon-hull` and `assault-cannon-turret`
as separate weapons.

**What counts as a distinct weapon:**
- Different name → different entry
- Same name, same profile, different mounting → **same entry**, mounting
  handled at unit level
- Same name, genuinely different profile (e.g. mastercrafted variant with
  different S/AP) → different entry with a distinguishing id suffix

**Common wargear items that aren't weapons** (Iron Halo, Psychic Hood,
Smoke Launchers, Company Standard etc.) also live here as entries with
`strength: "-"` and rules describing their effect. This lets them appear
in unit wargear sections and codex reference tables.

---

### `namedUpgrades{}` — Shared toggle definitions

A map of upgrade definitions that appear on **3 or more units** with
identical mechanical effects but different point costs.

**When to use namedUpgrades vs inline toggle:**
- Appears on 3+ units with identical effects → `namedUpgrades`
- Unit-specific (Camo Cloaks, specific aura upgrades) → inline `toggle`
  in the unit's `options[]`

**Common Space Marines entries:** `terminator-armour`, `jump-pack`,
`bike`, `chapter-master`, `chief-librarian`, `chief-chaplain`,
`chief-apothecary`, `master-of-the-forge`

Each definition contains everything **except** the point cost, which is set
per-unit when the upgrade is referenced. Use `pts` for a flat cost, or
`ptsPerModel` when the cost scales with the number of models in the unit
(e.g. jump packs on a squad):

```jsonc
// In namedUpgrades:
"jump-pack": {
  "type": "toggle", "label": "Jump Pack",
  "statModifiers": [...], "grantsRules": [...], ...
}

// In a unit's options[] — flat cost (HQ):
{ "id": "cap-jump-pack", "type": "namedUpgrade",
  "upgradeId": "jump-pack", "pts": 20 }

// In a unit's options[] — per-model cost (squad):
{ "id": "ai-jump-packs", "type": "namedUpgrade",
  "upgradeId": "jump-pack", "label": "Jump Packs (entire unit)",
  "ptsPerModel": 10 }
```

**`modelId` placeholders in `statModifiers`:**
- `"__sergeant__"` — the Character / leader model (resolved via the option
  with `upgradeGroup: "Sergeant"`, or the model with minCount===maxCount===1).
  Use this for HQ-only upgrades (Terminator Armour, Bike etc.) where only
  the single character model gains the stat change.
- `"__all__"` — every model in the unit. Use this for unit-wide upgrades
  like jump packs, where every model's stat row should be updated.

---

### `weaponLists{}` — Shared weapon choice menus

A map of weapon choice arrays that appear on **3 or more units**.

**When to use weaponLists vs inline choices:**
- Standard menu that repeats (Sergeant melee, pistol upgrades,
  special weapon slot, heavy weapon slot) → `weaponLists`
- Unit-specific choices (Dreadnought arm options, unique weapon combos)
  → inline `choices[]` in the unit's `weaponSwap` option

Each list is an array of WeaponChoice objects with `weaponId`, `label`,
`pts`. A `null` weaponId means "take nothing / keep current weapon".

Units reference a list with `weaponListId` and can patch individual costs
with `ptsOverrides`:

```jsonc
{
  "id": "sgt-melee", "type": "weaponSwap", "scope": "perModelType",
  "applies": ["sergeant"], "replaces": "combat-knife",
  "label": "Sergeant — swap Combat Knife for",
  "weaponListId": "sergeant-melee",
  "ptsOverrides": { "power-fist": 10 }   // this unit's cost differs from the default
}
```

---

### `spellPools{}` — Psychic spell lists

A map of named spell lists. Factions with no psykers omit this section
entirely (or set it to `{}`).

Each spell has: `id`, `name`, `castMechanic` (`"roll"` or `"sacrifice"`),
`castValue`, `pts`, `range`, `description`, `isAttack`.

**Chaos-specific:** Multiple pools exist (`hereticus`, `khorne`, `nurgle`,
`slaanesh`, `tzeentch`). A unit's active pool is determined at list-build
time by its Mark selection. Spell pick options use `"spellPoolId": "$mark"`
as a token that resolves dynamically.

**Space Marines:** One pool `"librarius"`. Librarians pick spells from it.

**Tyranids:** One pool `"tyranid-biomancy"`. Most Synapse creatures draw
from it.

---

### `units[]` — All units in the codex

Each unit contains:

**Identity fields:**
- `id` — kebab-case, stable once published (army lists reference this)
- `name` — display name
- `slot` — one of: `HQ`, `Advisor`, `Troop`, `Elite`, `Fast Attack`,
  `Heavy Support`, `Flyer`, `Ded. Transport`, `Lord of War`, `Fortification`
- `isUnique` — `true` for named characters (one per army)
- `isCompound` — `true` only for compound multi-squad units (Infantry Platoon)
- `chapterRestriction` — subfaction `id` if this unit is locked to one
  chapter/warband, otherwise `null`
- `basePts` — cost at minimum legal composition with all base wargear
- `inlineRules[]` — rules unique to this unit not defined in `armyRules`

**`models[]`** — One entry per distinct model type in the unit:
- `id`, `name`
- `minCount` / `maxCount` — legal composition range for this model type
- `ptsEach` — cost per additional model beyond minCount (0 if included in basePts)
- `isImmobile` — `true` for Drop Pods, Sporocysts etc. that cannot move
- `statline` — with `type`: `"infantry"`, `"vehicle"`, or `"fortification"`
  - Infantry: M, WS, BS, S, T, W, I, A, Ld, Sv
  - Vehicle: M, WS, BS, S, FA, SA, RA, W, I, A, Ld, Sv
  - Fortification: same columns as infantry; null where inapplicable
- `baseWargear[]` — weapon references. **Plain strings for infantry**
  (arcType null, no mounting tags). **Full objects for vehicles**
  with `arcType` and `mountingTags`.
- `specialRules[]` — rule ids from `armyRules` or `core-rules.json`
  or this unit's `inlineRules`

**`transport`** — omit if no transport capacity; otherwise:
`{ capacity, firePorts[], accessPoints[] }`

**`psychic`** — omit if not a psyker; otherwise:
`{ masteryLevel, spellPoolId, denyBonusPerPhase, masteryUpgrade }`

`masteryUpgrade` (optional) records the codex upgrade path: `{ toLevel, pts }`. It is **informational only** — the list builder enforces mastery level through `grantsMasteryLevel` on a `toggle` option (see below).

**`options[]`** — list of available upgrades. Types:
- `squadSize` — number spinner for extra models
- `weaponSwap` — replace a weapon; uses inline `choices[]` or `weaponListId`. **Always requires `scope`** — see the Weapon Swap Scopes section below.
- `perModelWeapon` — independent weapon choice per model instance (dropdowns)
- `toggle` — checkbox for a unit-specific upgrade. Add `"applies": ["modelId"]` to make it **per-model** — see Per-model toggle upgrades below. Add `"grantsMasteryLevel": N` to make this toggle upgrade the unit's effective Psychic Mastery level — see Psychic Mastery upgrades below.
- `namedUpgrade` — checkbox for a shared upgrade (from `namedUpgrades`). Use `pts` for a flat cost or `ptsPerModel` when the cost scales with squad size.
- `spellPick` — one spell slot. The unit may pick one spell from the pool for this slot. Add one `spellPick` option per mastery level (i.e. a Mastery 3 unit has three `spellPick` options). The list builder shows only as many slots as the effective mastery level and caps each slot to one selection.
- `markPick` — Mark of Chaos selector (Chaos only). Requires `choices[]` where each choice has `markId` and `ptsPerModel`.
- `pureBlessingPick` — Pure Blessing selector (Chaos only). Requires `requiresOptionId` (id of the markPick option it depends on) and `choices[]` where each choice has `markId` and `pts`. Only rendered when the matching mark is selected.

---

## Subfaction-specific options

Some upgrades and weapon choices are only legal for a specific chapter or subfaction.
Use the `subfaction` field to gate them — the list builder hides them unless the
matching subfaction is active.

### Rule of thumb

| What you're gating | Where to put `subfaction` |
|---|---|
| An entire new option (e.g. Terminator Armour for Space Wolves sergeant) | On the option object itself |
| One choice inside an existing swap list (inline `choices[]`) | On the individual choice entry |
| Extra choices for a weapon list referenced via `weaponListId` | In `subfactionChoices[]` on the option |

---

### 1. Gating an entire option

Add `"subfaction": "<subfaction-id>"` to the option. The whole option is hidden
unless the active list's subfaction matches.

```jsonc
{
  "id": "dev-sgt-terminator",
  "type": "namedUpgrade",
  "upgradeId": "terminator-armour",
  "pts": 26,
  "subfaction": "space_wolves",
  "upgradeGroup": "Sergeant"
}
```

Use this for completely new options that have no equivalent in the base unit —
extra weapons, unique wargear, or per-subfaction stat upgrades.

---

### 2. Adding a choice to an inline `choices[]` list

Add `"subfaction": "<subfaction-id>"` on the individual choice object.
The choice is shown only when that subfaction is active; otherwise the option
appears as normal but without that entry in the dropdown/counter.

```jsonc
{
  "id": "ic-arm",
  "type": "perModelWeapon",
  "choices": [
    { "weaponId": "dreadnought-missile-launcher", "label": "Dreadnought Missile Launcher" },
    { "weaponId": "multimelta",                   "label": "Multimelta",     "pts": 2,  "arcType": "Hull", "mountingTags": ["Primary"] },
    { "weaponId": "frag-cannon",                  "label": "Frag Cannon",    "pts": 3,  "arcType": "Hull", "mountingTags": ["Primary"], "subfaction": "blood_angels" },
    { "weaponId": "helfrost-cannon",              "label": "Helfrost Cannon","pts": 16, "arcType": "Hull", "mountingTags": ["Primary"], "subfaction": "space_wolves" }
  ]
}
```

Do **not** annotate the label with `"(Blood Angels only)"` — the `subfaction` field
carries that information and the label is shown as-is when visible.

---

### 3. Adding extra choices to a `weaponListId` reference

When an option references a shared weapon list (`weaponListId`), you cannot add
subfaction choices to the shared list without affecting every unit that uses it.
Use `subfactionChoices[]` on the option instead — these are appended to the
resolved list when the matching subfaction is active.

```jsonc
{
  "id": "as-special",
  "type": "weaponSwap",
  "scope": "limitedSlot",
  "applies": ["as-marine"],
  "label": "Up to 2 Marines: swap Chainsword for special weapon",
  "replaces": "chainsword",
  "choices": [
    { "weaponId": "chainsword",    "label": "None" },
    { "weaponId": "flamer",        "label": "Flamer",        "pts": 8 },
    { "weaponId": "plasma-pistol", "label": "Plasma Pistol", "pts": 7 }
  ],
  "subfactionChoices": [
    {
      "subfaction": "blood_angels",
      "choices": [
        { "weaponId": "plasma-gun", "label": "Plasma Gun", "pts": 6 },
        { "weaponId": "meltagun",   "label": "Meltagun",   "pts": 21 }
      ]
    }
  ],
  "slots": 2
}
```

`subfactionChoices` is an array so you can add entries for multiple subfactions
on the same option:

```jsonc
"subfactionChoices": [
  { "subfaction": "blood_angels", "choices": [...] },
  { "subfaction": "space_wolves", "choices": [...] }
]
```

---

### 4. Adding a second model instance for a subfaction

Some subfactions allow a unit to upgrade a regular model into a second copy of
a specialist model (e.g., Space Wolves may upgrade a Marine to a second Sergeant).
Use `grantsExtraModelOf` on a toggle option to enable this.

When the toggle is active:
- A **"2nd Sergeant"** section appears in the list builder with the same upgrade
  options as the base model (all options in the same `upgradeGroup` that apply to
  that model).
- The second sergeant's choices are stored independently from the first sergeant's.
- The toggle's `pts` covers the model upgrade cost (+4 pts); the second sergeant's
  own upgrades (weapon swaps, Terminator Armour, etc.) add on top.

```jsonc
// Tactical Squad — Space Wolves can add a second Sergeant
{
  "id": "tac-second-sergeant",
  "type": "toggle",
  "label": "Upgrade a Marine to Sergeant",
  "pts": 4,
  "subfaction": "space_wolves",
  "grantsExtraModelOf": "tactical-sgt",   // must match a model id in unit.models[]
  "upgradeGroup": "Sergeant"              // determines which options appear for the 2nd sergeant
}
```

Place this option at the **end** of the group it belongs to (so it appears after all
the regular sergeant options). The `upgradeGroup` must match the group used by the
model's existing weapon swaps and upgrades.

The postprocessor validates that `grantsExtraModelOf` references a real model ID
within the unit's `models[]` array.

---

### Subfaction ID reference (Space Marines)

| Subfaction | `id` |
|---|---|
| Blood Angels | `blood_angels` |
| Space Wolves | `space_wolves` |
| Dark Angels  | `dark_angels`  |
| Death Watch  | `death_watch`  |
| Black Templars | `black_templar` |

Other factions follow the same pattern — match the `id` fields in
`faction.subfactions[]`.

---

### postprocess.cjs validation

The postprocessor validates all `subfaction` values (on options and choices) against
`faction.subfactions[].id` and reports unknowns as warnings. Weapon IDs inside
`subfactionChoices` are validated as errors, the same as regular choice entries.

---

## Psychic Mastery upgrades

Some psykers can pay points to increase their Psychic Mastery level, gaining an extra spell slot. The list builder enforces the mastery level as a hard cap on spell selections — a Mastery 1 psyker may only pick 1 spell; upgrading to Mastery 2 unlocks the second slot.

### Pattern

1. Give the unit one `spellPick` option per potential spell slot (i.e. `masteryUpgrade.toLevel` options total).
2. Add a `toggle` option with `"grantsMasteryLevel": N` where N is the upgraded level. Place it **before** the `spellPick` options in the array.

```jsonc
// Warlock — base ML 1, can upgrade to ML 2
"psychic": { "masteryLevel": 1, "spellPoolId": "runes-of-fate",
             "masteryUpgrade": { "toLevel": 2, "pts": 15 } },
"options": [
  {
    "id": "wl-mastery2", "type": "toggle",
    "label": "Upgrade to Psychic Mastery 2", "pts": 15,
    "grantsMasteryLevel": 2
  },
  { "id": "wl-spells-1", "type": "spellPick", "spellPoolId": "runes-of-fate" },
  { "id": "wl-spells-2", "type": "spellPick", "spellPoolId": "runes-of-fate" }
]
```

- At base ML 1: only slot 1 (`wl-spells-1`) is shown; slot 2 is hidden.
- After taking the toggle: both slots are shown.
- If the toggle is later unchecked, any spell in slot 2 is automatically cleared.

### Units with no mastery upgrade

If the unit's mastery level is fixed, just add the right number of `spellPick` options and no toggle:

```jsonc
// Be'lakor — fixed ML 3
"psychic": { "masteryLevel": 3, "spellPoolId": "hereticus" },
"options": [
  { "id": "bl-spell-1", "type": "spellPick", "spellPoolId": "hereticus" },
  { "id": "bl-spell-2", "type": "spellPick", "spellPoolId": "hereticus" },
  { "id": "bl-spell-3", "type": "spellPick", "spellPoolId": "hereticus" }
]
```

### Single-pool Eldar / Space Marines pattern

Eldar and Space Marine psykers pick multiple spells from one pool rather than having discrete slots. Model this with **one** `spellPick` option — the list builder automatically limits total selections to the unit's effective mastery level:

```jsonc
// Farseer — ML 3, picks up to 3 spells from one pool
"psychic": { "masteryLevel": 3, "spellPoolId": "runes-of-fate" },
"options": [
  { "id": "spells", "type": "spellPick", "spellPoolId": "runes-of-fate" }
]
```

The header shows `Psychic Spells — Mastery 3 (0/3)` and greys out uncheckable spells once the limit is reached.

### Chaos `$mark` pools

Chaos psykers draw from the pool that matches their active Mark. Set `"spellPoolId": "$mark"` on the `spellPick` options — the list builder resolves it to the correct pool at runtime using the unit's `markPick` selection.

---

## Weapon Swap Scopes

Every `weaponSwap` option must have a `scope` field. The scope controls both **how many models** can take the swap and **what UI is shown** in the list builder.

### `scope: "unit"` — whole-unit swap

One selection applies to every model in the unit. Renders as a single dropdown. Use when all models must carry the same weapon variant.

Add `"ptsPerModel": true` when the cost scales with the number of models that still carry the replaced weapon. The engine automatically deducts any models that have already swapped that same weapon away via a `limitedSlot` or `perModelType` option — so those models are not charged for the squad-wide upgrade.

```jsonc
// Fixed cost — one vehicle, one choice
{ "id": "leman-russ-main", "type": "weaponSwap", "scope": "unit",
  "applies": ["leman-russ"], "label": "Main battle cannon",
  "replaces": "battle-cannon", "weaponListId": "leman-russ-mains" }

// Per-model cost — squad upgrades their rifles, but marines who already
// swapped to a Heavy Bolter (via a limitedSlot option) are excluded
{ "id": "hi-squad-rifle", "type": "weaponSwap", "scope": "unit",
  "applies": ["heavy-int-sgt", "heavy-int-marine"],
  "label": "Squad: swap Heavy Bolt Rifles for",
  "replaces": "heavy-bolt-rifle", "ptsPerModel": true,
  "choices": [
    { "weaponId": "heavy-bolt-rifle",    "label": "Keep Heavy Bolt Rifle" },
    { "weaponId": "executor-bolt-rifle", "label": "Executor Bolt Rifle", "pts": 1 },
    { "weaponId": "hellstorm-bolt-rifle","label": "Hellstorm Bolt Rifle", "pts": 2 }
  ] }
```

### `scope: "perModelType"` — each model independently

Every model of the specified type can independently take the swap. Renders as:
- **Single model** (leader/character — `maxCount: 1`): a dropdown
- **Multiple models** (`maxCount > 1`): count spinners per choice with a live pool counter

**Pool rule:** If multiple `perModelType` options share the same `applies` model and `replaces` weapon, they compete for the same pool. E.g. if 9 marines can each swap their bolt pistol, two separate options offering different alternatives still share those 9 slots.

**MIXED applies** (leader + troops in the same option): When `applies` includes both a single-model leader and a multi-model troop type (e.g. `["sergeant", "marine"]`), the option renders as count spinners with the leader's 1 slot included in the pool. Use this when the codex rule genuinely says "any model" and the sergeant is included.

```jsonc
// All marines (and optionally the sergeant) may independently swap
{ "id": "tac-marine-pistol", "type": "weaponSwap", "scope": "perModelType",
  "applies": ["tactical-sgt", "tactical-marine"],
  "label": "Any model: swap Bolt Pistol for",
  "replaces": "bolt-pistol", "weaponListId": "pistol-upgrades" }

// Sergeant only (single model → dropdown)
{ "id": "tac-sgt-ranged", "type": "weaponSwap", "scope": "perModelType",
  "applies": ["tactical-sgt"],
  "label": "Sergeant: swap Boltgun for",
  "replaces": "boltgun", "weaponListId": "sergeant-ranged-standard" }
```

### `scope: "limitedSlot"` — up to N models

Only a fixed number of models in the unit may take this swap. The number of available slots is controlled by `slots` (and optionally `slotsPerN`).

**`slots: 1`** — renders as a single None + weapon dropdown. The "None" option means the slot is not taken. Use for "One model may swap…" rules.

**`slots > 1`** — renders as count spinners per weapon choice with a "X/N slots used" counter, exactly like `perModelType` multi-model. Use for "Up to N models may swap…" rules.

**`slotsPerN`** — optional. When set, available slots scale with squad size: `slots × floor(totalModels / slotsPerN)`. Use for rules like "Per 10 models, up to 3 may swap…".

All `limitedSlot` options that share the same `applies` model type and `replaces` weapon compete for the same model pool. If one marine takes the special weapon slot, the heavy weapon slot shows one fewer marine available.

```jsonc
// One marine may take a special weapon
{ "id": "tac-special", "type": "weaponSwap", "scope": "limitedSlot",
  "applies": ["tactical-marine"], "slots": 1,
  "label": "One Marine: swap Boltgun for special weapon",
  "replaces": "boltgun",
  "choices": [
    { "weaponId": "flamer",    "label": "Flamer",    "pts": 4 },
    { "weaponId": "melta-gun", "label": "Meltagun",  "pts": 21 }
  ] }

// Per 10 models, up to 3 may take a heavy weapon
{ "id": "cult-special", "type": "weaponSwap", "scope": "limitedSlot",
  "applies": ["cultist"], "slots": 3, "slotsPerN": 10,
  "label": "Per 10 models — up to three may swap Autogun for",
  "replaces": "autogun",
  "choices": [
    { "weaponId": "flamer",           "label": "Flamer",           "pts": 7 },
    { "weaponId": "heavy-stubber",    "label": "Heavy Stubber",    "pts": 10 }
  ] }
```

---

## Per-model toggle upgrades

Some vehicles and walkers allow each model in a multi-model unit to independently take one upgrade from a list — e.g. "Any Dreadnought may take one of: Extra Armour, Smoke Launchers, Blizzard Shield, Magna Grapple."

**When to use:** the source codex text says "Any [model name] may take" or "Each [model name] may be equipped with" and the unit can contain more than one model.

**How to mark it in JSON:** add `"applies": ["modelId"]` to **every** toggle in the exclusive group. This is the same `applies` field used by `perModelWeapon` and `weaponSwap` — it signals "resolved independently per model of this type."

```jsonc
// Each Dreadnought in a 1–3 unit picks zero or one upgrade
{ "id": "dr-extra-armour", "type": "toggle",
  "exclusiveGroup": "dr-upgrades", "applies": ["dreadnought"],
  "label": "Extra Armour", "pts": 5,
  "grantsWargear": ["extra-armour"], "note": "Crew Stun becomes Weapon Disabled." },
{ "id": "dr-smoke", "type": "toggle",
  "exclusiveGroup": "dr-upgrades", "applies": ["dreadnought"],
  "label": "Smoke Launchers", "pts": 10,
  "grantsWargear": ["smoke-launchers"], "note": "One Use Only." }
```

**List builder behaviour:** renders one "Model N — may take one:" radio group per model in the unit. The count updates live as squad size changes. Default is nothing selected; clicking a selected radio deselects it (returning the model to no upgrade).

**Cost:** each model's selection adds its `pts` to the unit total independently. Three Dreadnoughts each taking Smoke Launchers costs +30 pts.

**Without `applies`:** an `exclusiveGroup` of toggles without `applies` remains unit-wide — one radio group for the whole unit, regardless of squad size.

**Do not confuse with `perModelWeapon`:** `perModelWeapon` handles weapon slot swaps rendered as dropdowns. `toggle` + `applies` + `exclusiveGroup` handles equipment/upgrade choices rendered as per-model radio groups.

---

## Weapon reference rules

**For infantry weapons** — plain string is fine:
```jsonc
"baseWargear": ["boltgun", "bolt-pistol", "frag-grenades"]
```

**For vehicle weapons** — full object with mounting info:
```jsonc
"baseWargear": [
  { "weaponId": "predator-autocannon", "arcType": "Turret", "mountingTags": ["Primary"] },
  { "weaponId": "heavy-bolter",        "arcType": "Sponson", "mountingTags": [] },
  { "weaponId": "smoke-launchers",     "arcType": null,     "mountingTags": [] }
]
```

`arcType` values: `null` (infantry / non-directional), `"Hull"` (90° front),
`"Sponson"` (90–180° side), `"Turret"` (270–360°), `"Pintle"` (360°).

`mountingTags`: `["Primary"]` marks the vehicle's primary weapon
(Weapon Destroyed becomes Weapon Disabled; still takes +2 Wounds).

---

## Statline encoding

All stat values are stored as their raw type:

| Stat | Type | Examples |
|---|---|---|
| M | number | `6`, `12`, `50` |
| WS, BS, Sv | number | `3`, `5` (renderer adds `+`) |
| Sv special | string | `"-"` (no save) |
| S, T, W, I, A, Ld | number | `4`, `1` |
| FA, SA, RA | number | `12`, `14` |
| Non-numeric | string | `"User"`, `"X2"`, `"*"`, `"+1"` |
| Not applicable | null | null (fortifications, immobile) |

Renderer adds `"` after M, `+` after WS/BS/Sv, shows `–` for null.

---

## Forward compatibility rules

Every faction file must include `"schemaVersion": "1.3"` (or current version).

**Omit fields that would be null, [], false, or 0.** The app treats missing
fields as their default value using defensive access (`unit.inlineRules ?? []`,
`unit.transport ?? null` etc.), so empty fields add noise without benefit.

The only fields that must always be present are those needed to identify the
object type: `schemaVersion`, `id`, `name`, `slot`, `type` (on options).
Everything else can be omitted when empty.

```jsonc
// Verbose — avoid this:
{
  "id": "tactical-squad",
  "inlineRules": [],
  "transport": null,
  "psychic": null,
  "chapterRestriction": null,
  "isUnique": false,
  "isCompound": false
}

// Clean — prefer this:
{
  "id": "tactical-squad"
}
```

Unknown fields in a file are **preserved, never stripped**, so a newer-format
file opened in an older app won't lose data.

---

## Where to go next

See `alt40k-new-faction-workflow.md` for the step-by-step authoring process, batch file structure, post-processing instructions, and the full validation checklist.

---

## Common mistakes to avoid

| Mistake | Correct approach |
|---|---|
| Creating `assault-cannon-hull` and `assault-cannon-turret` as separate weapons | One `assault-cannon` entry; set `arcType` on the unit's weapon reference |
| Duplicating Terminator Armour as a full `toggle` on each unit | Use `namedUpgrade` referencing `"terminator-armour"` |
| Putting core rulebook rules (Rending, Deepstrike etc.) in `armyRules` | Reference them by id from `core-rules.json` |
| Putting unit-unique rules (Gulp, Termagaunt Gestation) in `armyRules` | Define them in the unit's `inlineRules[]` |
| Using the `arcType` field on a weapon in `commonWargear` | `arcType` lives on the unit's weapon reference only |
| Writing the same `choices[]` array on ten different units | Extract to `weaponLists` and reference with `weaponListId` |
| Using `"3+"` strings for WS/BS/Sv values | Store as number `3`; renderer adds `+` |
| Using `"6\""` strings for M values | Store as number `6`; renderer adds `"` |
| Using `"assault"`, `"heavy"`, `"pistol"` etc. without a shot count | Weapon `rules` is a comma-separated string with numbers: `"Assault 2"`, `"Heavy 1"`, `"Pistol 1"` |
| Using `"poisoned"`, `"sniper"`, `"haywire"` without a target number | Always embed the target from the codex: `"Poisoned (3+)"`, `"Sniper (3+)"`, `"Haywire (3+)"` |
| Using an array for weapon profile `rules` | `rules` is a single string: `"Assault 2, Rending, Monsterbane"` — not `["Assault 2", "Rending"]` |
| Using kebab-case ids like `"rending"`, `"monsterbane"` in weapon profile rules | Weapon profile `rules` uses display strings only: `"Rending"`, `"Monsterbane"` |
| Writing `null`, `[]`, or `false` fields on weapons or units | Omit them entirely; the app treats missing fields as their default |
| Omitting `schemaVersion` | Always include `"schemaVersion": "1.3"` |
| Marking a vehicle upgrade group as per-model by adding `applies` to only some options in the `exclusiveGroup` | Add `"applies": ["modelId"]` to **every** option in the group — the app reads it from the first matching option, but consistency is required |
| Using a unit-wide `exclusiveGroup` toggle for a rule that says "Any [model name] may take" | Add `"applies": ["modelId"]` to make it per-model; without it the group renders as a single unit-wide choice |
| Abbreviating or paraphrasing names from the source codex (e.g. "SI Stormbolter" for "Special Issue Stormbolter") | Copy names and text verbatim from the source — never abbreviate, shorten, or rephrase. Correcting obvious OCR typos is the only permitted exception |
