# Alternate 40k — New Faction Authoring Workflow

> **Read this before writing any faction JSON.**
> Also read `alt40k-faction-schema-v1.3.md` and `alt40k-faction-json-guide.md` in this directory.
> This document covers the *project workflow* — the things not in those two docs.
>
> **Reference faction:** Use `necrons_faction.json` as your structural reference when building new factions. Do **not** load `space-marines_faction.json` as a reference — it is the largest faction file and will exceed the standard context window.

---

## Quick start

1. Read the source codex document in full before writing anything
2. Create a working subfolder: `public/<faction-name>/`
3. Write each section as a **separate numbered file** inside that folder (see [Batch authoring](#batch-authoring) below)
4. When all sections are done, run `node join-faction.cjs public/<faction-name>/` to assemble them
5. Run `node postprocess.cjs public/<faction-id>_faction.json` — fixes nulls, normalises rules, validates all refs
6. Fix any ERRORs reported. WARNINGs and unmapped rule strings may need new core rules or are fine as readable text
7. Add one line to `public/factions.json` — the faction appears in the selector automatically

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

## File naming and registration

- Faction file: `public/<kebab-name>_faction.json` (e.g. `eldar_faction.json`)
- Register in `public/factions.json`:
  ```json
  { "name": "Eldar", "file": "eldar_faction.json" }
  ```
- No code changes needed.

---

## Key conventions (project-specific)

### Omit null/empty fields
Per schema §12: omit `null`, `[]`, `false`. The postprocessor strips these automatically, but writing clean JSON saves a postprocess round-trip.

**Required regardless:** `schemaVersion`, `id`, `name`, `slot` (on units), `type` (on options).

### Weapon rules use display strings
All weapon profile `rules[]` entries are **human-readable display strings** — no kebab-case IDs.

```json
"rules": ["Assault 2", "Rending"]             // correct
"rules": ["assault", "rending"]               // wrong — bare IDs not used in weapon rules
"rules": ["Pistol 1", "Poisoned (3+)"]        // correct
"rules": ["pistol", "poisoned"]               // wrong

"rules": ["Heavy 1", "5\" Blast", "Monsterbane"]  // correct
"rules": ["heavy", "monsterbane"]                 // wrong
```

Shot counts and target numbers **must** come from the codex — they differ per weapon:
- Shot-count rules: `"Assault 2"`, `"Heavy 1"`, `"Pistol 1"`, `"Rapid Fire 1"`, `"Grenade 1"`
- Target-number rules: `"Poisoned (3+)"`, `"Sniper (3+)"`, `"Haywire (3+)"`
- Extra attacks: `"Extra Attack 1"`, `"Extra Attack 2"`
- Linked variants: `"Assault 3 x2"`, `"Heavy 1 x4"`
- Other rules: `"Rending"`, `"Monsterbane"`, `"Melta"`, `"Lance"`, `"Armourbane"`, `"Slow"`, `"Gets Hot!"`, `"Tesla"`, `"Gauss"`, `"AA"`, `"Ordnance"`, `"Accurate"`, `"Counterattack"` etc.
- Blast sizes and bespoke effects: `"3\" Blast"`, `"5\" Blast"`, `"(Monsterbane)"`, `"5+ Invulnerability Save against Ranged Attacks"`

The `rule-map.json` and postprocessor normalise display strings in **unit** `specialRules[]` (e.g. `"Rending"` → `"rending"` for tooltip lookups) but weapon profile rules are intentionally kept as display strings.

### Unit option types — use these exact strings

The app only recognises these `type` values. **Do not invent your own.**  Verify against an existing faction JSON before writing — the Necron codex is the reference.

| `type` | Purpose | Required fields |
|---|---|---|
| `"weaponSwap"` | Swap a weapon for one or more alternatives | `id`, `label`, `replaces` (if replacing existing), `choices[]` or `weaponListId` |
| `"toggle"` | Equipment/upgrade that can be switched on | `id`, `label`, `pts`; optionally `grantsWargear[]`, `grantsRules[]`, `note` |
| `"namedUpgrade"` | Reference a shared upgrade from `namedUpgrades` | `id`, `upgradeId`, `pts` |
| `"squadSize"` | Add more models to a unit | `id`, `label`, `targetModelId`, `ptsEach`, `max` |
| `"spellPick"` | Let the unit pick from a spell pool | `id`, `spellPoolId` |

**Every option must have a unique `id` field** — the app uses it to track state.

`weaponSwap` examples:

```json
// Choices inline — one option, many alternatives
{ "id": "wb-ranged", "type": "weaponSwap", "applies": ["model-id"],
  "label": "Swap Slugga for", "replaces": "slugga",
  "choices": [
    { "weaponId": "shoota", "label": "Shoota", "pts": 2 },
    { "weaponId": "meltagun", "label": "Meltagun", "pts": 24 }
  ]
}

// Using a weapon list (costs come from the list definition)
{ "id": "wb-melee", "type": "weaponSwap", "applies": ["model-id"],
  "label": "Swap Choppa for", "replaces": "choppa",
  "weaponListId": "boyz-melee"
}

// Vehicle weapon with arc — arc goes on the choice, not the weapon definition
{ "weaponId": "big-shoota", "label": "Big Shoota", "pts": 1,
  "arcType": "Hull", "mountingTags": ["Primary"] }
```

`toggle` example:

```json
{ "id": "jk-deff-rolla", "type": "toggle", "label": "Deff Rolla (+28 pts)",
  "pts": 28, "grantsWargear": ["deff-rolla"] }
```

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
- Infantry/monster/fortification: M, WS, BS, S, T, W, I, A, Ld, Sv
- Vehicle: M, WS, BS, S, FA, SA, RA, W, I, A, Ld, Sv
- Sv with no save: string `"-"` (not null)
- Strength `"User"`, `"X2"`, `"*"`, `"+1"` etc. are strings; numeric values are numbers

---

## Authoring order

### 1. Faction meta
- Set `subfactionLabel` (e.g. `"Dynasty"`, `"Craft World"`, `"Chapter"`)
- Write each subfaction's `rules[]` with `id`, `name`, `shortDesc`, `fullDesc`
- The same rule ID can appear in multiple subfactions (each is scoped to its subfaction)
- Set `slotLimits` — use `null` for unbounded upper limit

### 2. armyRules
- Faction-specific rules only — rules already in `core-rules.json` go there by ID
- Rules shared across 2+ units → `armyRules`
- Rules unique to one unit → that unit's `inlineRules[]`
- Each needs `id`, `name`, `shortDesc`, `fullDesc`

### 3. commonWargear
- Every distinct weapon defined **once**, referenced everywhere by ID
- Same weapon, different mounting = same entry; arc goes on the unit reference
- Multi-profile weapons need a `label` on each profile
- Equipment items (invuln saves, special gear) also go here with `strength: "-"`
- Strip `castValue` unless it's a psychic attack weapon (non-null integer)
- Strip `templateType` unless `"Flame"` or `"Hellstorm"`
- Strip `keywords` unless non-empty

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

### 7. Units (slot by slot)
Write in slot order: HQ → Advisor → Troop → Elite → Fast Attack → Heavy Support → Flyer → Ded. Transport → Lord of War → Fortification.

For each unit:
- Write identity fields (`id`, `name`, `slot`, `basePts`)
- Write `inlineRules[]` for rules unique to this unit
- Write each model in `models[]` with statline and baseWargear
- Add `transport` block if applicable (omit otherwise)
- Add `psychic` block if applicable (omit otherwise)
- Write `options[]` — prefer `namedUpgrade` and `weaponListId` over duplicating inline

---

## Reading a messy source document

Codex documents (especially markdown conversions) contain frequent formatting artefacts:

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
node postprocess.cjs public/<faction>_faction.json
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
{ "id": "new-rule", "name": "New Rule", "shortDesc": "...", "fullDesc": "..." }
```
Then reference it by ID in the faction files and add the mapping to `rule-map.json` if needed.

---

## Validation checklist

The postprocessor covers most of these automatically, but keep them in mind while writing:

- [ ] Every `weaponId` in `baseWargear`, `choices[]`, `weaponLists` exists in `commonWargear`
- [ ] Every rule ID in `specialRules` exists in `core-rules.json`, `armyRules`, or the unit's `inlineRules`
- [ ] Every `spellPoolId` exists in `spellPools`
- [ ] Every `upgradeId` exists in `namedUpgrades`
- [ ] Every `weaponListId` exists in `weaponLists`
- [ ] No two weapons share an `id`; no two units share an `id`
- [ ] Unique characters have `isUnique: true` on the unit, not `"unique"` in `specialRules`
- [ ] Vehicle weapons have `arcType`/`mountingTags` on unit references; infantry weapons use plain strings
- [ ] `chapterRestriction` values match a subfaction `id`
- [ ] Faction registered in `public/factions.json`
