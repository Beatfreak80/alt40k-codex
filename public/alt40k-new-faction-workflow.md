# Alternate 40k — New Faction Authoring Workflow

> **Read this before writing any faction JSON.**
> Also read `alt40k-faction-schema-v1.3.md` and `alt40k-faction-json-guide.md` in this directory.
> This document covers the *project workflow* — the things not in those two docs.

---

## Quick start

1. Read the source codex document in full before writing anything
2. Write the JSON in this order: faction meta → armyRules → commonWargear → namedUpgrades → weaponLists → spellPools → units (slot by slot)
3. Run `node postprocess.cjs public/<faction>_faction.json` — fixes nulls, normalises rules, validates all refs
4. Fix any ERRORs reported. WARNINGs and unmapped rule strings may need new core rules or are fine as readable text
5. Add one line to `public/factions.json` — the faction appears in the selector automatically

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

### Weapon rules use core IDs
Use kebab-case IDs from `core-rules.json` — never human-readable strings for rules that exist there.

```json
"rules": ["assault", "rending"]          // correct
"rules": ["Assault 2", "Rending"]        // wrong — postprocessor will fix, but avoid it
```

For weapon-unique effects with no core entry (invuln saves, bespoke aura text), a readable string is correct:
```json
"rules": ["heavy", "5+ Invulnerability Save"]
```

The mapping from common human-readable strings → IDs lives in `rule-map.json`. Check it before adding a new core rule — the string may already be mapped.

### baseWargear format
- Infantry/cavalry: plain strings `"bolt-pistol"`
- Vehicle weapons that have a firing arc: full object `{ "weaponId": "...", "arcType": "Hull", "mountingTags": ["Primary"] }`
- Omit `arcType` and `mountingTags` entirely for non-vehicle weapons

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
| Rules with parameters like "Sniper (3+)", "Haywire (2+)" | Map to core ID (`sniper`, `haywire`); parameter is implied by the rule definition |
| Weapon type + shots like "Assault 3", "Heavy 2 x4" | Map to core ID (`assault`, `heavy`); shot count is not tracked in the schema |
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
