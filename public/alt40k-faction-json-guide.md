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
  `null` upper limit = unbounded (app enforces special rules like
  "3 Advisors per Troop slot" in code).

**Decision rule:** If a faction has no sub-factions (e.g. Tyranids with
Splinter Fleet as the base option), `subfactions` can be omitted or set
to a single "use as written" entry.

---

### `armyRules[]` — Faction-specific special rules

Contains rules that are **unique to this faction** and not in
`core-rules.json`. Each rule has:

- `id` — kebab-case, unique within the file
- `name` — display name
- `shortDesc` — one sentence, shown in tooltips
- `fullDesc` — complete rule text as written in the codex

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
  - `rules` — array of **human-readable display strings** taken directly from the codex.
    All rules use Title Case display strings — no kebab-case IDs in weapon profiles.
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

Each definition contains everything **except** `pts`, which is set per-unit
when the upgrade is referenced:

```jsonc
// In namedUpgrades:
"terminator-armour": {
  "type": "toggle", "label": "Terminator Armour",
  "statModifiers": [...], "grantsRules": [...], ...
}

// In a unit's options[]:
{ "id": "terminator-armour", "type": "namedUpgrade",
  "upgradeId": "terminator-armour", "pts": 10 }
```

The `modelId` `"__sergeant__"` in `statModifiers` is a placeholder meaning
"the Character / leader model in this unit". The app resolves it to the
actual model id.

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

**`options[]`** — list of available upgrades. Types:
- `squadSize` — number spinner for extra models
- `weaponSwap` — replace a weapon; uses inline `choices[]` or `weaponListId`
- `perModelWeapon` — independent weapon choice per model instance
- `toggle` — checkbox for a unit-specific upgrade
- `namedUpgrade` — checkbox for a shared upgrade (from `namedUpgrades`)
- `spellPick` — spell slot selector
- `markPick` — Mark of Chaos selector (Chaos only)
- `pureBlessingPick` — Pure Blessing selector (Chaos only)

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

## Step-by-step: how to write a new faction file

1. **Read the codex PDF** — extract army abilities, subfaction rules,
   common wargear section, then all unit entries.

2. **Write `faction` and `armyRules`** — faction identity, subfactions
   with their rules, slot limits.

3. **Inventory the weapons** — list every distinct weapon profile. Group
   multi-profile weapons (Missile Launcher, combi-weapons). Identify
   weapons that are the same weapon mounted differently — those are one
   entry. Write `commonWargear`.

4. **Identify repeated upgrades** — scan all unit option lists for toggles
   that appear 3+ times identically. Write `namedUpgrades`.

5. **Identify repeated weapon lists** — scan for `choices[]` arrays that
   appear 3+ times. Write `weaponLists`.

6. **Write spell pools** — if the faction has psykers, write `spellPools`.

7. **Write units** — for each unit in slot order (HQ → Advisor → Troop → ...):
   - Write `id`, `name`, `slot`, `basePts`, `inlineRules`
   - Write `models[]` with statlines and base wargear
   - Write `transport` and `psychic` if applicable
   - Write `options[]` — use `namedUpgrade` and `weaponListId` wherever possible

8. **Validate** — run the validation checklist. Every referenced id must
   exist. No duplicate ids. Symmetric `mutuallyExcludes`.

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
| Using `"assault"`, `"heavy"`, `"pistol"` etc. without a shot count | All weapon rules are display strings with numbers: `"Assault 2"`, `"Heavy 1"`, `"Pistol 1"` |
| Using `"poisoned"`, `"sniper"`, `"haywire"` without a target number | Always embed the target from the codex: `"Poisoned (3+)"`, `"Sniper (3+)"`, `"Haywire (3+)"` |
| Using kebab-case ids like `"rending"`, `"monsterbane"` in weapon profile rules | Weapon profile `rules[]` use display strings only: `"Rending"`, `"Monsterbane"` |
| Writing `null`, `[]`, or `false` fields on weapons or units | Omit them entirely; the app treats missing fields as their default |
| Omitting `schemaVersion` | Always include `"schemaVersion": "1.3"` |
