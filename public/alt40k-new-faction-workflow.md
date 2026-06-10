# Alternate 40k — New Faction Authoring Workflow

> **Read this before writing any faction JSON.**
> Also read `alt40k-faction-json-guide.md` in this directory.
> This document covers the *project workflow* — the things not in those two docs.
>
> **Reference faction:** Use `necrons/necrons_faction.json` as your structural reference when building new factions. Do **not** load `space-marines/space-marines_faction.json` as a reference — it is the largest faction file and will exceed the standard context window.

---

## Quick start

1. Read the source codex document in full before writing anything
2. Create the faction's permanent subdirectory: `public/<faction-name>/`
3. Write each section as a **separate numbered file** inside that folder (see [Batch authoring](#batch-authoring) below)
4. When all sections are done, run `node join-faction.cjs public/<faction-name>/` to assemble them
   — output is written to `public/<faction-name>/<faction-id>_faction.json`
5. Run `node postprocess.cjs public/<faction-name>/<faction-id>_faction.json` — fixes nulls, normalises rules, validates all refs
6. Fix any ERRORs reported. WARNINGs and unmapped rule strings may need new core rules or are fine as readable text
7. Add an entry to `public/factions.json` (see [File naming and registration](#file-naming-and-registration)) — the faction appears in the selector automatically

---

## Batch authoring

Writing a full faction in one session risks timing out mid-way and losing work. The solution is to write one section file at a time, saving each before moving on. If a session ends early, the completed files are already on disk — just resume from the next section.

### Subfolder structure

Create `public/<faction-name>/` and write these files in order:

| File | Contents |
|---|---|
| `01-meta.json` | `schemaVersion` + `faction` object (subfactions, slotLimits) |
| `02-army-rules.json` | `armyRules` array |
| `03-common-wargear.json` | `commonWargear` array |
| `04-named-upgrades.json` | `namedUpgrades` object (omit file if none) |
| `05-weapon-lists.json` | `weaponLists` object (omit file if none) |
| `06-spell-pools.json` | `spellPools` object (omit file if no psykers) |
| `07-units-hq.json` | `units` array — HQ slot only |
| `08-units-advisor.json` | `units` array — Advisor slot only |
| `09-units-troop.json` | `units` array — Troop slot only |
| `10-units-elite.json` | `units` array — Elite slot only |
| `11-units-fast-attack.json` | `units` array — Fast Attack slot only |
| `12-units-heavy-support.json` | `units` array — Heavy Support slot only |
| `13-units-flyer.json` | `units` array — Flyer slot only |
| `14-units-transport.json` | `units` array — Ded. Transport slot only |
| `15-units-low.json` | `units` array — Lord of War slot only |
| `16-units-fortification.json` | `units` array — Fortification slot only |

Each file is valid JSON on its own — just the keys it owns, nothing else. Example `01-meta.json`:

```json
{
  "schemaVersion": "1.3",
  "faction": {
    "id": "orks",
    "name": "Orks",
    "version": "1.0.0",
    "subfactions": [ ... ],
    "slotLimits": { ... }
  }
}
```

Example `07-units-hq.json`:

```json
{
  "units": [
    { "id": "warboss", "name": "Warboss", "slot": "HQ", ... },
    { "id": "weirdboy",  "name": "Weirdboy",  "slot": "HQ", ... }
  ]
}
```

### Resuming after a timeout

The completed files are already saved. Open the subfolder, check which file was last written, and continue from the next one. Nothing already done needs to be repeated.

### Joining

Once all section files are present, assemble them:

```
node join-faction.cjs public/<faction-name>/
```

This writes `public/<faction-id>_faction.json` by concatenating all `units` arrays, all `armyRules` arrays, and merging all object sections. Then run the postprocessor as normal:

```
node postprocess.cjs public/<faction-id>_faction.json
```

---

## Authoring a supplement (subfaction-specific units)

Some subfactions have unique named characters that don't appear in the main faction codex. These live in **supplement JSON files** alongside the faction in its subdirectory.

### When to use a supplement

A supplement is appropriate when:
- Units are exclusive to one subfaction (Lysander / Imperial Fists, Ragnar / Space Wolves)
- The `.md` source document for that subfaction exists separately from the main codex

Subfactions that only have chapter rules (no extra units) need **no supplement file** — their rules already live in `faction.subfactions[].rules[]` inside the main faction JSON.

### Supplement JSON format

```json
{
  "schemaVersion": "supplement-1.0",
  "subfaction": "imperial_fists",
  "commonWargear": [
    { "id": "fist-of-dorn", "name": "Fist of Dorn", "profiles": [...] }
  ],
  "units": [
    {
      "id": "lysander",
      "name": "Lysander",
      "slot": "HQ",
      "isUnique": true,
      "basePts": 305,
      "models": [...],
      "options": [...]
    }
  ]
}
```

Rules:
- `subfaction` must match a `subfaction.id` in the parent faction's JSON. The app auto-applies this as `chapterRestriction` on every unit at load time.
- `commonWargear` lists only weapons **unique to this supplement**. To reference weapons already defined in the parent faction, use their IDs directly in unit `baseWargear` and option `choices` — they will be resolved at load time.
- `units` follows exactly the same format as units in the main faction JSON. See the guide for full field documentation.
- Omit `armyRules`, `namedUpgrades`, `weaponLists`, `spellPools` — these are inherited from the parent faction.

### Validating a supplement

```
node postprocess.cjs public/space-marines/imperial-fist.json \
  --supplement public/space-marines/space-marines_faction.json
```

The postprocessor merges parent weapon and rule IDs before validation so references to parent-faction weapons resolve correctly.

### Registering a supplement

Add it to `subfactionSupplements` in `public/factions.json` (see [File naming and registration](#file-naming-and-registration)). The app fetches it automatically when the faction loads.

---

## File naming and registration

Each faction lives in its own permanent subdirectory:

```
public/
  eldar/
    eldar-codex.md
    eldar_faction.json
  space-marines/
    space-marines-codex.md
    space-marines_faction.json
    imperial-fist.md        ← supplement source doc
    imperial-fist.json      ← supplement data file
    space-wolves.md
    space-wolves.json
```

Register the faction in `public/factions.json`. For factions with no supplements:
```json
{ "name": "Eldar", "file": "eldar/eldar_faction.json" }
```

For factions with supplement files, add `subfactionSupplements` (optional — omit if no supplements exist):
```json
{
  "name": "Space Marines",
  "file": "space-marines/space-marines_faction.json",
  "subfactionSupplements": {
    "imperial_fists": "space-marines/imperial-fist.json",
    "space_wolves":   "space-marines/space-wolves.json"
  }
}
```

Keys in `subfactionSupplements` must match a `subfaction.id` in the faction's JSON. Subfactions without supplement files need no entry here — they can have rules in the main faction JSON but no extra units.

No code changes needed.

---

## Key conventions (project-specific)

### Omit null/empty fields
Per schema §12: omit `null`, `[]`, `false`. The postprocessor strips these automatically, but writing clean JSON saves a postprocess round-trip.

**Required regardless:** `schemaVersion`, `id`, `name`, `slot` (on units), `type` (on options).

### Weapon rules use display strings
Weapon profile `rules` is a **single comma-separated string** — no arrays, no kebab-case IDs.

```json
"rules": "Assault 2, Rending"                 // correct
"rules": ["Assault 2", "Rending"]             // wrong — must be a string, not an array
"rules": "assault, rending"                   // wrong — bare IDs not used in weapon rules
"rules": "Pistol 1, Poisoned (3+)"            // correct
"rules": "pistol, poisoned"                   // wrong

"rules": "Heavy 1, 5\" Blast, Monsterbane"    // correct
"rules": ["Heavy 1", "5\" Blast"]             // wrong — array
"rules": "heavy, monsterbane"                 // wrong — bare IDs
```

Shot counts and target numbers **must** come from the codex — they differ per weapon. See the guide's `commonWargear` section for the complete list of valid rule strings.

The `rule-map.json` and postprocessor normalise display strings in **unit** `specialRules[]` (e.g. `"Rending"` → `"rending"` for tooltip lookups) but weapon profile rules are intentionally kept as display strings.

### Weapon range encoding

| Situation | `minRange` | `maxRange` | `templateType` |
|---|---|---|---|
| Standard ranged | *(omit)* | `48` | *(omit)* |
| Has a minimum range | `12` | `48` | *(omit)* |
| Melee | *(omit)* | *(omit)* | *(omit)* |
| Flame template | *(omit)* | *(omit)* | `"Flame"` |
| Hellstorm template | *(omit)* | *(omit)* | `"Hellstorm"` |
| Bomb | *(omit)* | *(omit)* | `"Bomb"` |

Omit `minRange`, `maxRange`, and `templateType` entirely when they carry no value (per §12 / omit-null rule).

### Unit option types — use these exact strings

The app only recognises these `type` values. **Do not invent your own.**  Verify against an existing faction JSON before writing — the Necron codex is the reference.

| `type` | Purpose | Required fields |
|---|---|---|
| `"weaponSwap"` | Swap a weapon for one or more alternatives | `id`, `label`, `scope`, `applies[]`, `replaces`, `choices[]` or `weaponListId` |
| `"toggle"` | Equipment/upgrade that can be switched on. Add `applies[]` + `exclusiveGroup` for per-model independent selection. Add `grantsMasteryLevel: N` to upgrade a psyker's effective mastery level (see guide § Psychic Mastery upgrades). | `id`, `label`, `pts`; optionally `grantsWargear[]`, `grantsRules[]`, `note`, `applies[]`, `exclusiveGroup`, `grantsMasteryLevel` |
| `"namedUpgrade"` | Reference a shared upgrade from `namedUpgrades` | `id`, `upgradeId`, `pts` or `ptsPerModel` (use `ptsPerModel` when cost scales with squad size) |
| `"squadSize"` | Add more models to a unit | `id`, `label`, `targetModelId`, `ptsEach`, `max` |
| `"spellPick"` | One spell slot — unit picks one spell from the pool. Add one per mastery level. Use `"spellPoolId": "$mark"` for Chaos mark-based pools. | `id`, `spellPoolId` |
| `"markPick"` | Mark of Chaos selector (Chaos only) | `id`, `label`, `choices[]` — each choice: `markId`, `name`, `ptsPerModel` |
| `"pureBlessingPick"` | Pure Blessing checkbox (Chaos only, conditional on mark) | `id`, `label`, `requiresOptionId` (id of the `markPick` option), `choices[]` — each choice: `markId`, `pts` |

**`weaponSwap` scopes** — `scope` is required on every weaponSwap:

| `scope` | Meaning | `slots` | `slotsPerN` | `ptsPerModel` | List builder UI |
|---|---|---|---|---|---|
| `"unit"` | One choice for the whole unit | — | — | optional — cost scales per model still carrying the replaced weapon | Single dropdown |
| `"perModelType"` | Each model of the type independently | — | — | — | Dropdown (single model) or count spinners (multi-model) |
| `"limitedSlot"` | Up to N models in the unit may take it | required | optional | — | Dropdown with None (slots 1) or count spinners (slots > 1) |

`slotsPerN` scales available slots with squad size: `slots × floor(totalModels / slotsPerN)`. Use for rules like "Per 10 models, up to 3 may swap…"

**MIXED applies** — `applies[]` may include both a single-model leader and a multi-model troop type (e.g. `["sergeant", "marine"]`) when the codex rule genuinely says "any model" and includes the leader. The list builder treats the leader's 1 slot as part of the shared pool.

**Every option must have a unique `id` field** — the app uses it to track state.

For `weaponSwap` scope patterns and inline-choices/weaponList examples, see the guide's Weapon Swap Scopes section.

**Vehicle weapon choices** carry arc on the choice entry, not the weapon definition:

```json
{ "weaponId": "big-shoota", "label": "Big Shoota", "pts": 1,
  "arcType": "Hull", "mountingTags": ["Primary"] }
```

`toggle` example (unit-wide):

```json
{ "id": "jk-deff-rolla", "type": "toggle", "label": "Deff Rolla (+28 pts)",
  "pts": 28, "grantsWargear": ["deff-rolla"] }
```

For per-model toggle groups (`exclusiveGroup` + `applies`), see the guide's Per-model toggle upgrades section.

`namedUpgrade` definitions in the `namedUpgrades` map must use:
- `"type": "toggle"` (not `"statChange"` or anything else)
- `"label"` for the display name (not `"name"` or `"description"`)
- `"statModifiers"` array (not `"statChanges"`)
- `"grantsRules"` (not `"gainRules"`)

```json
"boss-nob": {
  "type": "toggle",
  "label": "Boss Nob",
  "statModifiers": [
    { "modelId": "__sergeant__", "stat": "S", "op": "add", "value": 1 }
  ],
  "grantsRules": ["bulky", "character"],
  "note": "S+1, W+1, A+1, gains Bulky."
}
```

For `modelId` placeholders in `statModifiers` (`__sergeant__`, `__all__`), see the guide's namedUpgrades section.

**What went wrong with the Ork codex first pass:** custom types (`"weapon"`, `"equipment"`, `"addModel"`) were invented without reading an existing faction JSON. This made all weapon options invisible in the app. Always open `space-marines_faction.json` or `necrons_faction.json` and read a unit's `options` block before writing any options.

### baseWargear format
- Infantry/cavalry: plain strings `"bolt-pistol"`
- Vehicle weapons that have a firing arc: full object `{ "weaponId": "...", "arcType": "Hull", "mountingTags": ["Primary"] }`
- Omit `arcType` and `mountingTags` entirely for non-vehicle weapons

### Platoon units

Some factions (e.g. Imperial Guard) group squads into **Platoons** — a single Troop choice that contains multiple sub-unit types. Model this with `"platoon": true` on the parent unit and a `platoonUnits` array for the sub-units.

**Key rules:**
- The platoon itself has **no `basePts`**, no `models`, and no `options`. It is a named container only.
- Sub-units inside `platoonUnits` are **not** listed as top-level units — they can only be purchased as part of their platoon.
- Each sub-unit has `minSquads`/`maxSquads` (how many of that squad type the platoon may include) rather than the normal `models[].minCount`/`maxCount`.
- The app renders each platoon as a collapsible card; clicking "Show units" expands all sub-units inline beneath it.
- The postprocessor validates weapon and rule refs inside `platoonUnits` the same as top-level units.

**Points:** The platoon's source cost is the minimum-roster cost (e.g. "153 pts" = 1 Command Squad + 2 Guardsman Squads). Derive each sub-unit's `basePts` from that: total − (other required squads × their cost).

```json
{
  "id": "infantry-platoon",
  "name": "Infantry Platoon",
  "slot": "Troop",
  "platoon": true,
  "platoonComposition": "Requires 1 Platoon Command Squad and 2–5 Guardsman Squads. May also include 0–2 Special Weapon Squads, 0–5 Heavy Weapon Squads, and 0–1 Conscript Squads.",
  "platoonUnits": [
    {
      "id": "platoon-command-squad",
      "name": "Platoon Command Squad",
      "basePts": 23,
      "minSquads": 1,
      "maxSquads": 1,
      "models": [ { "id": "platoon-commander", "name": "Platoon Commander", ... } ],
      "options": [ ... ]
    },
    {
      "id": "guardsman-squad",
      "name": "Guardsman Squad",
      "basePts": 65,
      "minSquads": 2,
      "maxSquads": 5,
      "models": [ { "id": "guardsman", "name": "Guardsman", ... } ],
      "options": [ ... ]
    }
  ]
}
```

### `isUnique` flag vs `unique` special rule
Mark unique characters with `"isUnique": true` on the unit. Do **not** add `"unique"` to `specialRules` — the app handles display from the flag.

### Vehicle type descriptors as rules
`tank`, `open-topped`, `titanic`, `combat-walker` etc. go in `specialRules` (they exist in `core-rules.json`). They are not statline types — statline type is one of `infantry`, `vehicle`, `monstrous-infantry`, `monster`, `fortification`.

### Statline notes

Stat fields present per statline type:
- **Infantry / monster / monstrous-infantry / fortification:** M, WS, BS, S, T, W, I, A, Ld, Sv
- **Vehicle:** M, WS, BS, S, FA, SA, RA, W, I, A, Ld, Sv

Storage and display:

| Stat | Storage | Renders as |
|---|---|---|
| `M` | integer | appends `"` — `6"` |
| `WS`, `BS`, `Sv` | integer 1–7 | appends `+` — `3+` |
| `Sv` (no save) | string `"-"` | `–` |
| `S`, `T`, `W`, `I`, `A`, `Ld`, `FA`, `SA`, `RA` | integer | as-is |
| Null / not applicable | *(omit)* | `–` |
| Non-numeric | string | as-is — `"User"`, `"X2"`, `"*"`, `"+1"` |

- `Sv` must be an integer (1–7) or the literal string `"-"` — never `"4+"` etc.
- Vehicle Combat Walkers have `I` and `A` in their statline; standard tanks do not.
- Fortification / immobile models: `"isImmobile": true`, `M` omitted.

---

## Authoring order

### 1. Faction meta
- Set `subfactionLabel` (e.g. `"Dynasty"`, `"Craft World"`, `"Chapter"`)
- Write each subfaction's `rules[]` with `id`, `name`, `fullDesc` (verbatim from codex)
- The same rule ID can appear in multiple subfactions (each is scoped to its subfaction)
- For any subfaction whose rules **restrict which units may be taken** (e.g. "may only include
  models with X rule", "may not field any Y models"), also add a `listBuildingFilters[]` entry
  on that subfaction. Rule text in `rules[]` is display-only; `listBuildingFilters` is what
  the app enforces. See the guide's *Subfaction list-building filters* section for the three
  supported filter types (`requireRule`, `excludeType`, `requireTypes`, `requireTypesForRule`) and real examples.
- For any subfaction that reclassifies units into different slots (e.g. "Scouts may be taken
  as Troops"), add `slotReclassifications[]` to that subfaction.
- Set `slotLimits` — three slots are always `[0, null]` (dynamic, same for every faction):
  `"Advisor"`, `"Ded. Transport"`, `"Fortification"`. The app computes their
  max at runtime (3 per Troop / 1 per transportable unit / 1 per 1000 pts).
  All other slots use a fixed `[min, max]` pair.

### 2. armyRules
- Faction-specific rules only — rules already in `core-rules.json` go there by ID
- Rules shared across 2+ units → `armyRules`
- Rules unique to one unit → that unit's `inlineRules[]`
- Each needs `id`, `name`, `fullDesc` (verbatim from codex)

### 3. commonWargear
- Every distinct weapon defined **once**, referenced everywhere by ID
- Same weapon, different mounting = same entry; arc goes on the unit reference
- Multi-profile weapons need a `label` on each profile
- **AND vs OR between profiles:** If the source codex separates two weapon modes with **AND** (e.g. "Rapid Fire 2 AND Assault 1"), both profiles can fire simultaneously — add `"Simultaneous Fire"` to each profile's `rules` string in addition to its existing rules. If separated by **OR**, only one may be chosen per turn — no extra rule needed.
- Equipment items (invuln saves, special gear) also go here with `strength: "-"`
- Strip `castValue` unless it's a psychic attack weapon (non-null integer)
- Strip `templateType` unless `"Flame"` or `"Hellstorm"`
- Strip `keywords` unless non-empty
- Add `removesWargear: [id, ...]` only when equipping this item should automatically remove another piece of wargear (e.g. a Stormshield variant that displaces a bolter)

### 4. namedUpgrades
- Toggles that appear on 3+ units with identical effects but different costs
- Each definition has everything except `pts` (which is set per-unit in the option)
- Common candidates: jump packs, mounts, armour upgrades, faction-specific wargear upgrades

### 5. weaponLists
- Weapon choice arrays that repeat on 3+ units
- Standard examples: sergeant melee, special weapon slot, heavy weapon slot, pistol upgrades
- Units reference these with `weaponListId` + optional `ptsOverrides`

### 6. spellPools
- Only if the faction has psykers
- One pool per distinct spell list; army-wide pool + unique pools if needed
- Each spell: `id`, `name`, `castMechanic`, `castValue`, `pts`, `range`, `description`, `isAttack`
- Chaos: pools are named by mark (`khorne`, `nurgle`, `slaanesh`, `tzeentch`); units with variable marks use `"spellPoolId": "$mark"` on their `spellPick` options

### 7. Units (slot by slot)
Write in slot order: HQ → Advisor → Troop → Elite → Fast Attack → Heavy Support → Flyer → Ded. Transport → Lord of War → Fortification.

For each unit:
- Write identity fields (`id`, `name`, `slot`, `basePts`)
- Write `inlineRules[]` for rules unique to this unit
- Write each model in `models[]` with statline and baseWargear
- **For every model where `maxCount > minCount`** — add a `squadSize` option to `options[]`. Without this the list builder shows no +/- controls and the squad size is frozen at `minCount`. Use:
  ```json
  {
    "id": "<unit-id>-<model-id>-sq",
    "type": "squadSize",
    "label": "Additional <ModelName>",
    "targetModelId": "<model-id>",
    "ptsEach": <model.ptsEach>,
    "max": <maxCount - minCount>
  }
  ```
  Place `squadSize` options first in the `options[]` array, before weapon swaps and toggles.
- Add `transport` block if applicable (omit otherwise)
- Add `psychic` block if applicable (omit otherwise)
- Write `options[]` — prefer `namedUpgrade` and `weaponListId` over duplicating inline

---

## Reading a messy source document

Codex documents (especially markdown conversions) contain frequent formatting artefacts:

**Copy names and text verbatim — never abbreviate or interpret.** Use exactly the words from the source. If the codex says "Special Issue Stormbolter", that is the weapon name — do not shorten it to "SI Stormbolter" or any other abbreviation. The only permitted exception is correcting an obvious OCR/formatting typo (e.g. a missing space or transposed letter) where the intended text is unambiguous.

| Source pattern | What to do |
|---|---|
| Merged table cells split across rows | Reconstruct the full profile by reading preceding rows for context |
| Base wargear lists weapon X but options say "swap weapon Y" | The base wargear is probably wrong; infer the correct base from the options |
| Same weapon name with different stats in different unit entries | Pick the most consistent version; note the discrepancy |
| Page numbers appearing mid-table | Ignore — OCR/conversion artefact |
| "Unique" or "Harlequin" in rules column | Convert to flag (`isUnique: true`) or army rule reference, not a specialRule string |
| Rules with parameters like "Sniper (3+)", "Haywire (2+)" | Copy the full display string including the value: `"Sniper (3+)"`, `"Haywire (2+)"` |
| Weapon type + shots like "Assault 3", "Heavy 2 x4" | Copy the full display string: `"Assault 3"`, `"Heavy 2 x4"` — shot count is part of the rule |
| Vehicle weapons with "Hull, Primary" in the rules column | Strip from rules; add `arcType: "Hull"` and `mountingTags: ["Primary"]` to the unit WeaponReference |
| Abbreviated weapon or rule names (e.g. "SI Stormbolter") | Expand to the full source name ("Special Issue Stormbolter") — never use the abbreviation |

---

## Common source document errors seen in practice

- **Vaul's Wrath Battery** (Eldar): base wargear listed as "Shuriken Cannon" but options said "swap Vibro Cannon" — base was Vibro Cannon
- **Lasblaster** (Eldar): AP listed as 3+ in character options, 5+ in the Hawk unit — 5+ is correct (specialist unit is authoritative)
- **Windriders** (Eldar): model name was copy-pasted as "Shining Spear" — should be "Windrider"
- **Mephrit dynasty** (Necrons): 3 rules in source, only 2 IDs in JSON — needed a new ID added
- **Space Marines castValue**: every weapon profile had `castValue: null` — strip it

---

## Post-processing

After writing the JSON, always run:
```
node postprocess.cjs public/<faction-name>/<faction-id>_faction.json
```

For supplement files, pass `--supplement` with the parent faction path so weapon and rule IDs from the parent are available for validation:
```
node postprocess.cjs public/space-marines/imperial-fist.json \
  --supplement public/space-marines/space-marines_faction.json
```

The postprocessor:
1. **Strips** all null/empty/false fields (free, idempotent)
2. **Normalises** weapon rule strings using `rule-map.json` and built-in patterns
3. **Validates** all cross-references and reports errors vs warnings

**ERRORs** must be fixed: duplicate IDs, missing weapon/rule/upgrade/list references.

**Warnings** need judgement: usually an unknown rule ID that belongs in `core-rules.json` or `armyRules`.

**Unmapped rule strings** listed at the end are kept as readable text. If a string recurs across factions, add it to `rule-map.json`.

### Adding to rule-map.json
When a new faction uses a human-readable rule string that maps to a core ID:
```json
"Warp Charge": "psychic-disruption"
```
One entry in `rule-map.json` — all future factions benefit automatically.

### Adding to core-rules.json
When a rule appears on units across multiple factions but doesn't exist in core rules yet:
```json
{ "id": "new-rule", "name": "New Rule", "fullDesc": "..." }
```
Then reference it by ID in the faction files and add the mapping to `rule-map.json` if needed.

---

## Points calculation reference

The app calculates unit cost at runtime using this formula:

```
unitTotal = basePts
  + Σ squadSize.value × ptsEach
  + Σ toggle.active (unit-wide, no applies)  ? pts                              : 0
  + Σ_model toggle.active (per-model, has applies[]) ? pts                     : 0
  + Σ namedUpgrade.active   ? (ptsPerModel × totalModelCount | pts) : 0
  + Σ markPick.chosen       ? ptsPerModel × totalModelCount    : 0
  + Σ pureBlessingPick.active ? pts (from matching mark choice) : 0
  + Σ weaponSwap (scope "unit", no ptsPerModel)                → selectedChoice.pts
  + Σ weaponSwap (scope "unit", ptsPerModel: true)             → selectedChoice.pts × (appliesCount − poolUsed)
  + Σ weaponSwap (scope "perModelType" single-model)           → selectedChoice.pts
  + Σ weaponSwap (scope "perModelType" multi-model)            → Σ_choice count[choice] × choice.pts
  + Σ weaponSwap (scope "limitedSlot", slots 1)                → selectedChoice.pts if taken, else 0
  + Σ weaponSwap (scope "limitedSlot", slots > 1)              → Σ_choice count[choice] × choice.pts
  + Σ_i perModelWeapon[i].selectedChoice.pts
  + Σ spellPick.selectedSpell.pts
```

Per-model toggle cost: each model that selects an upgrade contributes that upgrade's `pts` individually. A unit of 3 Dreadnoughts where 2 take Smoke Launchers (+10 pts each) and 1 takes Extra Armour (+5 pts) costs +25 pts total from upgrades.

`basePts` is the cost of the unit at minimum legal size with default wargear — all selectable costs sit on top.

---

## Validation checklist

The postprocessor covers most of these automatically, but keep them in mind while writing:

- [ ] Every model where `maxCount > minCount` has a `squadSize` option with `targetModelId` = that model's id, `ptsEach` matching `model.ptsEach`, and `max` = `maxCount − minCount`
- [ ] Every `weaponId` in `baseWargear`, `choices[]`, `weaponLists` exists in `commonWargear`
- [ ] Every rule ID in `specialRules` exists in `core-rules.json`, `armyRules`, or the unit's `inlineRules`
- [ ] Every `spellPoolId` exists in `spellPools` (or is the literal `"$mark"` for Chaos)
- [ ] Psyker units: number of `spellPick` options equals the maximum possible mastery level (base or upgraded); a `toggle` with `grantsMasteryLevel` is present if the unit can upgrade mastery
- [ ] Every `upgradeId` exists in `namedUpgrades`
- [ ] Every `weaponListId` exists in `weaponLists`
- [ ] No two weapons share an `id`; no two units share an `id`
- [ ] Unique characters have `isUnique: true` on the unit, not `"unique"` in `specialRules`
- [ ] Vehicle weapons have `arcType`/`mountingTags` on unit references; infantry weapons use plain strings
- [ ] `chapterRestriction` values match a subfaction `id`
- [ ] Per-model toggle groups (`exclusiveGroup` + `applies`): `applies` is present on **every** option in the group and all reference the same model id
- [ ] `mutuallyExcludes` arrays are symmetric — if A excludes B, B must also exclude A
- [ ] Faction registered in `public/factions.json` with correct subdirectory path (e.g. `"file": "eldar/eldar_faction.json"`)
- [ ] If supplement files exist, `subfactionSupplements` keys match real subfaction IDs in the faction JSON
- [ ] Subfactions with unit inclusion restrictions ("may only include X", "may not field Y") have `listBuildingFilters[]` entries — not just rule text
- [ ] Subfactions with slot reclassifications ("may be taken as Troops") have `slotReclassifications[]` entries
