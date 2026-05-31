# Codex Source Document — Known Errors

Errors found during JSON conversion across all three source codex files.
Please send to the codex author for correction.

---

## Ork Codex (`ork-codex.md`)

| # | Unit | Issue |
|---|---|---|
| 1 | Deffkoptas (Fast Attack) | **Points value missing** — "Points:" field is completely blank |
| 2 | Squighog Boyz (Fast Attack) | **Points value missing** — "Points:" field is completely blank |
| 3 | Kustom Mega Blasta Kannon | **Inconsistent rules between units** — listed as "Assault 1, 7\" Blast" on Mek Gunz (no Monsterbane), but "Assault 1, 7\" Blast, Monsterbane" on Morkanaut. Should it have Monsterbane everywhere? |

---

## Eldar Codex (`eldar-codex-new.md`)

| # | Unit / Section | Issue |
|---|---|---|
| 4 | Army Abilities intro | **Wrong faction name** — reads "The Dark Eldar have a series of special rules" — should be "The Eldar have…" |
| 5 | Autarch ranged options | **Lasblaster AP wrong** — listed as AP 3+ in the Autarch's options. The Swooping Hawks entry (the authoritative unit) lists it as AP 5+ everywhere. Should be AP 5+ |
| 6 | Prince Yriel wargear block | **Wrong model name header** — says "Autarch:" instead of "Yriel:" (copy-pasted from Autarch entry) |
| 7 | Dire Avengers Exarch options | **Avenger Shuriken Catapult Strength inconsistency** — the "OR +2 pts" Exarch swap option lists it as S4, but the regular Dire Avenger's base wargear entry lists it as S3. Same weapon, two different values |
| 8 | Shroud Runners | **Two missing values** — overall points cost is blank ("Points:  "), AND the per-model add cost is also blank ("for \+ points each") |
| 9 | Wraithlord, Wraithseer | **Plasma Missile Launcher blast Strength column wrong** — shows "8 Or 4+" in the Strength column for the blast profile; should be "8 Or 4". The "+" belongs to AP, not S. All other units (War Walker, Wave Serpent, etc.) show this correctly |
| 10 | Voidweaver | **Typo in blast size** — Prismatic Cannon lists "5' Blast" (foot symbol) instead of 5" Blast (inches). Appears twice in the options table |
| 11 | Phoenix Lords section + multiple units | **"Pheonix" misspelling throughout** — "Phoenix" is misspelled as "Pheonix" consistently: the "Pheonix Lords" section header, Asurmen, Baharroth, Lhykhis, Maugan Ra rules entries, Phoenix Bomber wargear, Vampire Raider wargear |
| 12 | Scorpion (Lord of War) | **Wrong swap reference** — Options say "May swap Distort Empaler for T" but the Scorpion's base wargear is "2 Linked Pulsars". Distort Empaler is the Cobra's weapon — this line was copy-pasted from the Cobra entry |
| 13 | Wraithknight (standard, not Skathach) | **Scattershield cost looks wrong** — listed as "A Scattershield +0 points". The Skathach Wraithknight has the same upgrade at -14 points. If they are the same upgrade, one of these costs is incorrect |

---

## Necron Codex (`necron-codex.md`)

| # | Unit | Issue |
|---|---|---|
| 14 | Command Barge options | **Options reference weapons the unit doesn't have** — says "May swap Staff of Light for M" and "May swap Gauss Cannon for H", but base wargear is only "Void Blade" and "Tesla Carbine". These swap options appear to belong to a different unit |
| 15 | Anrakyr the Traveler | **Base wargear name mismatch** — wargear box lists "Warscythe" but the weapon table's M slot shows "War Glaive" (different weapon: +2/2+/Counterattack vs X2/2+/Slow/Monsterbane). One of them is wrong |
| 16 | Psychomancer | **Unit header uses wrong unit name** — both the composition and wargear block say "Plasmancer" instead of "Psychomancer" (copy-pasted from the Plasmancer entry directly above it) |
| 17 | Royal Warden | **Rules block header wrong** — rules column says "Technomancer:" instead of "Royal Warden:" (copy-pasted from Technomancer) |
| 18 | Lychguard | **Rules block header wrong** — rules column says "Flayed One:" instead of "Lychguard:" (copy-pasted from Flayed One entry) |
| 19 | Lokhust Destroyers | **Gauss Cannon missing Gauss keyword** — weapon listed as "Rapid Fire 2" only. All other Gauss Cannons in the codex include "Gauss" in their rules column |
| 20 | Void Dragon (C'Tan Shard) | **Spear of the Void Dragon melee Strength value invalid** — the split-row melee profile shows "3+" in the Strength column, which is not a valid strength value. Likely should be something like "X2", "+3", or "User" |

---

## Previously documented (already in workflow notes)

These were caught during earlier conversions and noted in `alt40k-new-faction-workflow.md`:

- **Eldar** — Vaul's Wrath Battery: base wargear was "Shuriken Cannon", should be "Vibro Cannon" *(appears already corrected in the current eldar-codex-new.md)*
- **Eldar** — Windriders: model name copy-pasted as "Shining Spear" *(not present in current eldar-codex-new.md — may already be fixed)*
- **Necron** — Mephrit dynasty: source lists 3 rules but only 2 have IDs; third rule needs an ID added
- **Space Marines** — all weapon profiles had `castValue: null` throughout *(a JSON formatting issue, not a source codex error)*
