# Alternate 40k — Faction JSON Schema v1.3

> Supersedes v1.2. Changes from v1.2 are marked **[NEW]** or **[CHANGED]**.
> Validated against: Space Marines, Chaos Undivided, Tyranids, Imperial Guard.

---

## Changelog from v1.2

| # | Change | Type | Reason |
|---|---|---|---|
| 1 | `arcType` + `mountingTags` moved from weapon definition to weapon reference on units | **Breaking** | Mounting is a property of how a unit carries a weapon, not of the weapon itself |
| 2 | `namedUpgrades` pool added to faction file | **New** | Terminator Armour, Jump Pack, Bike, Chapter Master etc. repeat across ~10 units with identical effects but varying costs |
| 3 | `weaponLists` pool added to faction file | **New** | Sergeant melee swap list, special weapon slot choices etc. repeat across ~15 units |
| 4 | Weapon references in `baseWargear` and `choices[]` changed from plain id strings to objects | **Breaking** | Needed to carry `arcType` and `mountingTags` per-reference |

---

## 0. File shape

```jsonc
{
  "schemaVersion": "1.3",
  "faction":        { /* FactionMeta */ },
  "armyRules":      [ /* SpecialRule[] — faction-specific rules defined once */ ],
  "commonWargear":  [ /* Weapon[] — weapon profiles defined once, referenced by id */ ],
  "namedUpgrades":  { /* upgradeId → NamedUpgrade — repeated toggle definitions */ },
  "weaponLists":    { /* listId → WeaponChoice[] — repeated weapon choice arrays */ },
  "spellPools":     { /* poolId → Spell[] */ },
  "units":          [ /* Unit[] */ ]
}
```

---

## 1. FactionMeta *(unchanged from v1.2)*

```jsonc
{
  "id":      "space_marines",
  "name":    "Space Marines",
  "version": "1.0.0",
  "subfactions": [ /* Subfaction[] */ ],
  "markSystem": { /* MarkSystem — Chaos only, omit otherwise */ },
  "slotLimits": {
    "HQ": [1, 2], "Advisor": [0, null], "Troop": [2, 6],
    "Elite": [0, 3], "Fast Attack": [0, 3], "Heavy Support": [0, 3],
    "Flyer": [0, 2], "Ded. Transport": [0, null],
    "Lord of War": [0, 1], "Fortification": [0, null]
  }
}
```

---

## 2. Weapon  **[CHANGED]**

Weapons are defined **once** in `commonWargear`. A weapon entry describes only the
weapon's intrinsic profile — what it does, regardless of what carries it.

**Mounting information (`arcType`, `Primary` etc.) is NOT stored here.**
It lives on the weapon reference at the unit level (see §6b).

```jsonc
{
  "id":   "assault-cannon",
  "name": "Assault Cannon",
  "profiles": [
    {
      "maxRange": 36,
      "strength": "6",
      "ap":       "4+",
      "rules":    ["Assault 4", "rending"]
    }
  ]
}
```

**Key principle:** If two units carry the "same weapon" but one mounts it on a Hull
and one on a Turret, they reference the **same weapon id** with different
`arcType` values on their unit entries. Do not create `assault-cannon-hull`
and `assault-cannon-turret` as separate weapons.

**Rules in `rules[]`:** All rules are **human-readable display strings** taken directly
from the codex. No kebab-case IDs are used in weapon profile `rules[]`.

| Rule type | Format | Examples |
|---|---|---|
| Shot-type rules | `"Type N"` — number from codex | `"Assault 2"`, `"Heavy 1"`, `"Pistol 1"`, `"Rapid Fire 1"`, `"Grenade 1"` |
| Linked weapons | append multiplier | `"Assault 3 x2"`, `"Heavy 1 x4"` |
| Target-number rules | include `(N+)` | `"Poisoned (3+)"`, `"Sniper (3+)"`, `"Haywire (3+)"` |
| Extra attacks | `"Extra Attack N"` | `"Extra Attack 1"`, `"Extra Attack 2"` |
| Other named rules | Title Case | `"Rending"`, `"Monsterbane"`, `"Melta"`, `"Lance"`, `"Armourbane"`, `"Slow"`, `"Gets Hot!"`, `"Tesla"`, `"Gauss"`, `"Destroyer"`, `"Ordnance"`, `"AA"`, `"Pinning"`, `"Accurate"`, `"Nonblast"`, `"Auxiliary"`, `"Counterattack"` etc. |
| Blast sizes, unique effects | as written | `"3\" Blast"`, `"5\" Blast"`, `"(Monsterbane)"`, `"5+ Invulnerability Save against Ranged Attacks"` |

The shot count and target number **must** come from the codex — they differ per weapon.
Never write bare `"assault"`, `"heavy"`, `"pistol"`, `"poisoned"` etc.

**Multi-profile example (Missile Launcher):**
```jsonc
{
  "id":   "missile-launcher",
  "name": "Missile Launcher",
  "profiles": [
    {"label": "Krak", "maxRange": 48, "strength": "8", "ap": "3+", "rules": ["Heavy 1", "Monsterbane"]},
    {"label": "Frag", "maxRange": 48, "strength": "4", "ap": "6+", "rules": ["Heavy 1", "3\" Blast"]}
  ]
}
```

**Psychic attack weapon (castValue non-null — only field that breaks the omit-if-null rule):**
```jsonc
{
  "id":   "warp-blast",
  "name": "Warp Blast",
  "profiles": [
    {"maxRange": 18, "strength": "5", "ap": "3+",
     "rules": ["Assault 1", "3\" Blast"], "castValue": 6}
  ]
}
```

**Fields to omit when empty/null:** `label`, `minRange`, `castValue`,
`keywords`, `templateType` — omit these entirely rather than writing `null`
or `[]`. Only include them when they carry a real value.

### Range encoding

| Situation | `minRange` | `maxRange` | `templateType` |
|---|---|---|---|
| Standard ranged | `null` | `48` | `null` |
| Minimum range | `12` | `48` | `null` |
| Melee | `null` | `null` | `null` |
| Flame template | `null` | `null` | `"Flame"` |
| Hellstorm template | `null` | `null` | `"Hellstorm"` |

---

## 3. WeaponReference  **[NEW concept]**

Wherever a weapon id was previously used as a plain string in `baseWargear`
or `choices[]`, it is now a **WeaponReference object**:

```jsonc
{
  "weaponId":    "assault-cannon",
  "arcType":     "Hull",          // null | "Hull" | "Turret" | "Sponson" | "Pintle"
  "mountingTags": ["Primary"]     // [] by default; ["Primary"] for primary vehicle weapons
}
```

`arcType` and `mountingTags` are **always omitted for infantry weapons** (they
are always null / empty). Only vehicle/fortification weapons need them.

**Shorthand:** When `arcType` is null and `mountingTags` is empty, the
weapon reference may be written as a plain string id for brevity:

```jsonc
// These are equivalent:
"baseWargear": ["bolt-pistol", "chainsword", "frag-grenades"]

"baseWargear": [
  { "weaponId": "bolt-pistol",    "arcType": null, "mountingTags": [] },
  { "weaponId": "chainsword",     "arcType": null, "mountingTags": [] },
  { "weaponId": "frag-grenades",  "arcType": null, "mountingTags": [] }
]
```

Use the shorthand (plain strings) for infantry. Use the full object form
for vehicle weapons that need `arcType` or `mountingTags`.

---

## 4. NamedUpgrade  **[NEW]**

Upgrades that appear on multiple units with identical mechanical effects but
varying costs are defined once in the `namedUpgrades` map.

```jsonc
"namedUpgrades": {
  "terminator-armour": {
    "type":   "toggle",
    "label":  "Terminator Armour",
    // All mechanical effects — defined once here:
    "statModifiers": [
      { "modelId": "__sergeant__", "stat": "M", "op": "add", "value": -2 },
      { "modelId": "__sergeant__", "stat": "W", "op": "add", "value":  1 }
    ],
    "grantsRules":    ["monstrous-infantry", "deepstrike", "steady"],
    "removesRules":   ["infantry", "objective-secured"],
    "grantsWargear":  [],
    "removesWargear": ["frag-grenades", "krak-grenades"],
    "mutuallyExcludes": ["jump-pack", "bike"],
    "note": "M–2, W+1. Gain Monstrous Infantry, Deepstrike, Steady. Lose Infantry, Objective Secured, Grenades."
  },

  "jump-pack": {
    "type":  "toggle",
    "label": "Jump Pack",
    "statModifiers": [
      { "modelId": "__sergeant__", "stat": "M", "op": "add", "value": 6 }
    ],
    "grantsRules":    ["deepstrike", "flyer"],
    "removesRules":   [],
    "grantsWargear":  [],
    "removesWargear": [],
    "mutuallyExcludes": ["terminator-armour", "bike"],
    "note": "M+6. Gain Deepstrike, Flying."
  },

  "bike": {
    "type":  "toggle",
    "label": "Bike",
    "statModifiers": [
      { "modelId": "__sergeant__", "stat": "M", "op": "add", "value":  6 },
      { "modelId": "__sergeant__", "stat": "T", "op": "add", "value":  1 },
      { "modelId": "__sergeant__", "stat": "W", "op": "add", "value":  1 }
    ],
    "grantsRules":    ["steed"],
    "grantsWargear":  ["stormbolter"],
    "removesWargear": [],
    "mutuallyExcludes": ["terminator-armour", "jump-pack"],
    "note": "M+6, T+1, W+1. Gain Steed. Gain a Stormbolter."
  },

  "chapter-master": {
    "type":          "toggle",
    "label":         "Chapter Master",
    "isUniqueMaker": true,
    "statModifiers": [
      { "modelId": "__sergeant__", "stat": "W", "op": "add", "value": 1 },
      { "modelId": "__sergeant__", "stat": "A", "op": "add", "value": 1 }
    ],
    "grantsRules":   ["orbital-strike"],
    "grantsWargear": ["orbital-strike"],
    "note": "W+1, A+1. Gain Orbital Strike. Gain Unique."
  }
  // ... chief-librarian, chief-chaplain, chief-apothecary etc.
}
```

### `modelId` in namedUpgrades

Named upgrades use `"__sergeant__"` as a placeholder meaning "the Character /
leader model in this unit". The app resolves this to the actual model id when
applying the upgrade to a specific unit. If a unit has no Character model,
the first model in `models[]` is used.

### Referencing a namedUpgrade from a unit option

```jsonc
{
  "id":        "terminator-armour",
  "type":      "namedUpgrade",
  "upgradeId": "terminator-armour",   // key in namedUpgrades map
  "pts":       10                     // overrides nothing in the definition; just adds cost
}
```

The `pts` field is the only thing that varies per unit. Everything else comes
from the definition.

---

## 5. WeaponList  **[NEW]**

Weapon choice arrays that repeat across multiple units are defined once in
the `weaponLists` map.

```jsonc
"weaponLists": {
  "sergeant-melee": [
    { "weaponId": "combat-knife",  "label": "Keep Combat Knife", "pts": 0  },
    { "weaponId": "chainsword",    "label": "Chainsword",        "pts": 0  },
    { "weaponId": "power-sword",   "label": "Power Sword",       "pts": 5  },
    { "weaponId": "power-axe",     "label": "Power Axe",         "pts": 6  },
    { "weaponId": "power-maul",    "label": "Power Maul",        "pts": 8  },
    { "weaponId": "power-fist",    "label": "Power Fist",        "pts": 16 },
    { "weaponId": "thunderhammer", "label": "Thunderhammer",     "pts": 18 }
  ],

  "sergeant-ranged-hq": [
    { "weaponId": "stormbolter",  "label": "Keep Stormbolter",  "pts": 0  },
    { "weaponId": "combi-flamer", "label": "Combi-Flamer",      "pts": 4  },
    { "weaponId": "combi-grav",   "label": "Combi-Grav",        "pts": 6  },
    { "weaponId": "combi-plasma", "label": "Combi-Plasma",      "pts": 6  },
    { "weaponId": "combi-melta",  "label": "Combi-Melta",       "pts": 21 }
  ],

  "pistol-upgrades": [
    { "weaponId": "bolt-pistol",   "label": "Keep Bolt Pistol",  "pts": 0  },
    { "weaponId": "hand-flamer",   "label": "Hand Flamer",       "pts": 3  },
    { "weaponId": "plasma-pistol", "label": "Plasma Pistol",     "pts": 7  },
    { "weaponId": "grav-pistol",   "label": "Grav Pistol",       "pts": 8  },
    { "weaponId": "inferno-pistol","label": "Inferno Pistol",    "pts": 24 }
  ],

  "special-weapon-slot": [
    { "weaponId": null,          "label": "None",        "pts": 0  },
    { "weaponId": "flamer",      "label": "Flamer",      "pts": 4  },
    { "weaponId": "grav-gun",    "label": "Grav Gun",    "pts": 6  },
    { "weaponId": "plasma-gun",  "label": "Plasma Gun",  "pts": 6  },
    { "weaponId": "meltagun",    "label": "Meltagun",    "pts": 21 }
  ],

  "heavy-weapon-slot": [
    { "weaponId": null,              "label": "None",             "pts": 0  },
    { "weaponId": "heavy-flamer",    "label": "Heavy Flamer",     "pts": 7  },
    { "weaponId": "heavy-bolter",    "label": "Heavy Bolter",     "pts": 9  },
    { "weaponId": "plasma-cannon",   "label": "Plasma Cannon",    "pts": 14 },
    { "weaponId": "grav-cannon",     "label": "Grav Cannon",      "pts": 14 },
    { "weaponId": "missile-launcher","label": "Missile Launcher", "pts": 19 },
    { "weaponId": "lascannon",       "label": "Lascannon",        "pts": 21 },
    { "weaponId": "multimelta",      "label": "Multimelta",       "pts": 27 }
  ],

  "grenade-upgrades": [
    { "weaponId": "krak-grenades", "label": "Keep Krak Grenades", "pts": 0 },
    { "weaponId": "meltabombs",    "label": "Meltabombs",         "pts": 5 }
  ]
}
```

### Referencing a weaponList from a unit option

```jsonc
{
  "id":           "sgt-melee-swap",
  "type":         "weaponSwap",
  "scope":        "perModelType",
  "applies":      ["sergeant"],
  "label":        "Sergeant — swap Combat Knife for",
  "replaces":     "combat-knife",
  "weaponListId": "sergeant-melee",       // reference to weaponLists map
  // Optional: override specific pts values for this unit only:
  "ptsOverrides": { "power-sword": 3, "power-fist": 10 }
}
```

When `weaponListId` is set, `choices[]` is omitted — the list comes from
`weaponLists`. `ptsOverrides` patches individual costs without redefining
the whole list.

---

## 6. Unit

### 6a. Identity

```jsonc
{
  "id":                 "tactical-squad",
  "name":               "Tactical Squad",
  "slot":               "Troop",
  "isUnique":           false,
  "isCompound":         false,
  "chapterRestriction": null,
  "fluff":              null,
  "basePts":            199,
  "inlineRules":        []
}
```

### 6b. Models  **[CHANGED — baseWargear now uses WeaponReferences]**

```jsonc
"models": [
  {
    "id":        "sergeant",
    "name":      "Sergeant",
    "minCount":  1,
    "maxCount":  1,
    "ptsEach":   0,
    "isImmobile": false,

    "statline": {
      "type": "infantry",
      "M": 6, "WS": 3, "BS": 3, "S": 4,
      "T": 4, "W": 2,  "I": 4,  "A": 2, "Ld": 9, "Sv": 3
    },

    // Plain strings for infantry (arcType null, no mountingTags)
    "baseWargear": [
      "boltgun", "bolt-pistol", "combat-knife",
      "frag-grenades", "krak-grenades"
    ],

    "specialRules": [
      "character", "infantry", "adjusted-tactics", "bolter-discipline",
      "know-no-fear", "tactical-squads", "night-vision",
      "objective-secured", "shock-assault"
    ]
  },
  {
    "id":       "space-marine",
    "name":     "Space Marine",
    "minCount": 4,
    "maxCount": 9,
    "ptsEach":  39,
    "isImmobile": false,
    "statline": {
      "type": "infantry",
      "M": 6, "WS": 3, "BS": 3, "S": 4,
      "T": 4, "W": 2,  "I": 4,  "A": 1, "Ld": 8, "Sv": 3
    },
    "baseWargear": [
      "boltgun", "bolt-pistol", "combat-knife",
      "frag-grenades", "krak-grenades"
    ],
    "specialRules": [
      "infantry", "adjusted-tactics", "bolter-discipline",
      "know-no-fear", "tactical-squads", "night-vision",
      "objective-secured", "shock-assault"
    ]
  }
]
```

**Vehicle model with weapon references:**
```jsonc
{
  "id":       "contemptor",
  "name":     "Contemptor",
  "minCount": 1, "maxCount": 1, "ptsEach": 0,
  "isImmobile": false,
  "statline": {
    "type": "vehicle",
    "M": 8, "WS": 3, "BS": 3, "S": 7,
    "FA": 12, "SA": 12, "RA": 10,
    "W": 9, "I": 4, "A": 4, "Ld": 10, "Sv": 3
  },
  // Full WeaponReference objects for vehicle weapons:
  "baseWargear": [
    { "weaponId": "volkite-culverin", "arcType": "Hull", "mountingTags": ["Primary"] },
    { "weaponId": "volkite-culverin", "arcType": "Hull", "mountingTags": ["Primary"] },
    { "weaponId": "atomantic-shielding", "arcType": null, "mountingTags": [] }
  ],
  "specialRules": [
    "vehicle", "combat-walker", "adjusted-tactics", "bolter-discipline",
    "know-no-fear", "night-vision", "shock-assault", "steady"
  ]
}
```

### 6c. Transport block *(unchanged)*

```jsonc
"transport": {
  "capacity": 10,
  "firePorts": [{ "count": 2, "facing": "Front", "arc": 90 }],
  "accessPoints": ["Rear"]
}
// Omit entirely if unit has no transport capacity
```

### 6d. Psychic block *(unchanged)*

```jsonc
"psychic": {
  "masteryLevel": 2,
  "spellPoolId": "librarius",
  "denyBonusPerPhase": 0
  // masteryUpgrade omitted if null
  // Or: "masteryUpgrade": { "toLevel": 4, "pts": 75 }
}
// Omit entirely if unit is not a psyker
```

---

## 7. Options — full reference

### 7a. `squadSize` *(unchanged)*

```jsonc
{
  "id": "extra-marines", "type": "squadSize",
  "label": "Additional Space Marines",
  "targetModelId": "space-marine",
  "ptsEach": 39, "min": 0, "max": 5
}
```

### 7b. `weaponSwap` **[CHANGED — now supports weaponListId]**

```jsonc
// Using an inline choices array (for unit-specific lists):
{
  "id": "one-special-weapon", "type": "weaponSwap",
  "scope": "limitedSlot", "slots": 1,
  "applies": ["space-marine"],
  "label": "One Marine — swap Boltgun for special weapon",
  "replaces": "boltgun",
  "choices": [
    { "weaponId": null,         "label": "None",       "pts": 0  },
    { "weaponId": "flamer",     "label": "Flamer",     "pts": 4  },
    { "weaponId": "plasma-gun", "label": "Plasma Gun", "pts": 6  },
    { "weaponId": "meltagun",   "label": "Meltagun",   "pts": 21 }
  ]
}

// Using a shared weaponList (for standard lists that repeat everywhere):
{
  "id": "sgt-melee", "type": "weaponSwap",
  "scope": "perModelType", "applies": ["sergeant"],
  "label": "Sergeant — swap Combat Knife for",
  "replaces": "combat-knife",
  "weaponListId": "sergeant-melee",
  "ptsOverrides": { "power-fist": 10, "thunderhammer": 18 }
}
```

`scope` values: `"perModelType"` | `"limitedSlot"` | `"unit"`

### 7c. `perModelWeapon` *(unchanged — choices use WeaponReference objects)*

```jsonc
{
  "id": "arm-left", "type": "perModelWeapon",
  "applies": ["contemptor"],
  "modelCountSource": null,
  "label": "Arm 1 — swap Volkite Culverin for",
  "replaces": "volkite-culverin",
  "choices": [
    { "weaponId": "volkite-culverin",   "label": "Volkite Culverin",   "pts": 0,
      "arcType": "Hull", "mountingTags": ["Primary"] },
    { "weaponId": "dread-ccw-stormbolter", "label": "CCW + Stormbolter", "pts": 17,
      "arcType": "Hull", "mountingTags": ["Primary"] },
    { "weaponId": "assault-cannon",     "label": "Assault Cannon",     "pts": 10,
      "arcType": "Hull", "mountingTags": ["Primary"] }
  ]
}
```

### 7d. `toggle` *(unchanged for unit-specific toggles)*

```jsonc
{
  "id": "camo-cloaks", "type": "toggle",
  "label": "Camo Cloaks",
  "pts": 0, "ptsPerModel": 2,
  "ptsPerModelAppliesTo": null,
  "mutuallyExcludes": [],
  "statModifiers":  [],
  "grantsRules":    ["stealth"],
  "removesRules":   [],
  "grantsWargear":  [],
  "removesWargear": [],
  "isUniqueMaker":  false,
  "psychicModifiers": null,
  "doctrineGroup":  null,
  "note": "Gain Stealth (+1 to Cover Save, max 3+)."
}
```

### 7e. `namedUpgrade` **[NEW]**

References a definition from the `namedUpgrades` map. Only `pts` varies.

```jsonc
{ "id": "terminator-armour", "type": "namedUpgrade", "upgradeId": "terminator-armour", "pts": 10 }
{ "id": "jump-pack",         "type": "namedUpgrade", "upgradeId": "jump-pack",         "pts": 20 }
{ "id": "bike",              "type": "namedUpgrade", "upgradeId": "bike",              "pts": 34 }
{ "id": "chapter-master",    "type": "namedUpgrade", "upgradeId": "chapter-master",    "pts": 140 }
```

### 7f–7h. `spellPick`, `markPick`, `pureBlessingPick` *(unchanged from v1.2)*

---

## 8. Option type summary

| type | Description | Key fields |
|---|---|---|
| `squadSize` | Extra models spinner | `targetModelId`, `ptsEach`, `min`, `max` |
| `weaponSwap` | Replace weapon from list | `scope`, `applies`, `replaces`, `choices[]` or `weaponListId` |
| `perModelWeapon` | Per-model instance dropdown | `applies`, `replaces`, `choices[]` |
| `toggle` | Checkbox, unit-specific | `pts`, `ptsPerModel`, `grantsRules` etc. |
| `namedUpgrade` | Checkbox, shared definition | `upgradeId`, `pts` |
| `spellPick` | Spell slot selector | `spellPoolId` |
| `markPick` | Mark of Chaos selector | `choices[]` with `markId` |
| `pureBlessingPick` | Conditional blessing | `requiresOptionId`, `choices[]` |

---

## 9. Points calculation algorithm

```
unitTotal = basePts
  + Σ squadSize.value × ptsEach
  + Σ toggle.active    ? pts    : 0
  + Σ toggle.active    ? (modelCount × ptsPerModel) : 0
  + Σ namedUpgrade.active ? pts : 0
  + Σ weaponSwap.selectedChoice.pts   (with ptsOverrides applied)
  + Σ_i perModelWeapon[i].selectedChoice.pts
  + Σ spellPick.selectedSpell.pts
  + Σ_modelType markPick.ptsPerModel × count(modelType)
  + Σ_modelType pureBlessingPick.ptsPerModel × count(modelType)
```

---

## 10. Statline display rules

| Stat | Storage | Renderer output |
|---|---|---|
| `M` | number | append `"` → `6"` |
| `WS`, `BS`, `Sv` | number | append `+` → `3+` |
| `Sv` special | `"-"` string | render as `–` |
| All others | number | as-is |
| Null / inapplicable | `null` | `–` |
| Non-numeric | string | as-is (`"User"`, `"X2"`, `"*"`, `"+1"`) |

---

## 11. Compound units *(unchanged from v1.2)*

Compound units (e.g. Imperial Guard Infantry Platoon) use `isCompound: true`
and a `subUnits[]` array. See v1.2 §7 for the full spec.

---

## 12. Omitting empty fields  **[NEW in v1.3]**

**Omit any field whose value would be `null`, `[]`, `false`, or `0`.**
The app uses defensive access (`unit.inlineRules ?? []`, `unit.transport ?? null`)
so missing fields are treated as their default automatically.

Fields that must **always** be present regardless:
- `schemaVersion` on the root object
- `id` and `name` on every named object
- `slot` on units
- `type` on every option

Everything else — `inlineRules`, `transport`, `psychic`, `isUnique`,
`isCompound`, `chapterRestriction`, `ptsPerModel`, `mutuallyExcludes`,
`doctrineGroup`, `note`, `castValue`, `templateType`, `mountingTags` when
empty — should be omitted rather than written as null or [].

```jsonc
// Verbose — avoid:
{
  "id": "tactical-squad",
  "name": "Tactical Squad",
  "slot": "Troop",
  "isUnique": false,
  "isCompound": false,
  "chapterRestriction": null,
  "inlineRules": [],
  "transport": null,
  "psychic": null
}

// Clean — prefer:
{
  "id": "tactical-squad",
  "name": "Tactical Squad",
  "slot": "Troop"
}
```

---

## 13. Validation checklist

- [ ] Every `weaponId` in `baseWargear`, `choices[]`, or `weaponLists` exists in `commonWargear`
- [ ] Every rule id in `specialRules` / `grantsRules` exists in `armyRules` or `core-rules.json`
- [ ] Every `spellPoolId` exists as a key in `spellPools`
- [ ] Every `upgradeId` in `namedUpgrade` options exists in `namedUpgrades`
- [ ] Every `weaponListId` in `weaponSwap` options exists in `weaponLists`
- [ ] `arcType` and `mountingTags` are present on vehicle weapon references; omitted (or null/[]) on infantry
- [ ] No two weapons share the same `id`; no two units share the same `id`
- [ ] `mutuallyExcludes` lists are symmetric
- [ ] Vehicle Combat Walkers have `I` and `A` in their statline
- [ ] Fortification / immobile models: `isImmobile: true`, `M: null`
- [ ] `chapterRestriction` values match a subfaction `id`
- [ ] `ptsOverrides` keys in `weaponSwap` match `weaponId` values in the referenced `weaponList`

---

## 14. Migration from v1.2

### Weapon references
Replace every plain string weapon id in `baseWargear` for vehicle models
with a WeaponReference object. Infantry can keep plain strings.

Remove `arcType` from weapon definitions in `commonWargear` — it now lives
only on unit-level weapon references.

### namedUpgrades
Identify toggles that appear on 3+ units with identical effects.
Move the definition to `namedUpgrades`, replace each unit's toggle with a
`namedUpgrade` reference carrying only `pts`.

### weaponLists
Identify `choices[]` arrays that appear on 3+ units.
Move to `weaponLists`, replace with `weaponListId` + optional `ptsOverrides`.

---

## 15. Extension points *(reserved)*

- `unit.advisorSlots`
- `unit.dedicatedTransportEligible`
- `weapon.linkedTo` — Co-Axial pairs
- `faction.terrainEntries`
- `unit.mergeGroup` — Infantry Tactics combine-squads
- `subfaction.uniqueUnitIds`
