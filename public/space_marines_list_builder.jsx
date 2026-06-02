import { useState, useMemo, useRef } from "react";

const CHAPTERS = ["Ultramarines","Blood Angels","Space Wolves","Dark Angels","Imperial Fists","Iron Hands","Salamanders","Raven Guard","Black Templars","Crimson Fists","White Scars","Death Watch","Flesh Tearers","Blood Ravens","Emperor's Spears","Exorcists","Drake Slayers","Silver Templars","Tome Keepers","White Consuls","Wolfspears","Average"];
const SLOT_COLORS = { HQ:"#1a3a6e", Troop:"#6e1a1a", Elite:"#3a1a6e", "Fast Attack":"#5a4a00", "Heavy Support":"#004a5a", Flyer:"#005a3a", "Ded. Transport":"#5a0050", "Lord of War":"#6e2a00", Advisor:"#1a5a1a", Fortification:"#3a3a3a" };
const SLOT_BG = { HQ:"#e8f0ff", Troop:"#ffe8e8", Elite:"#f0e8ff", "Fast Attack":"#fff8e0", "Heavy Support":"#e0f4ff", Flyer:"#e0fff4", "Ded. Transport":"#ffe0fa", "Lord of War":"#fff0e8", Advisor:"#e8ffe8", Fortification:"#f0f0f0" };
const SLOT_LIMITS = { HQ:[1,2], Troop:[2,6], Elite:[0,3], "Fast Attack":[0,3], "Heavy Support":[0,3], Flyer:[0,2], "Ded. Transport":[null,null], "Lord of War":[0,1], Advisor:[null,null], Fortification:[null,null] };
const SLOT_ORDER = ["HQ","Advisor","Troop","Elite","Fast Attack","Heavy Support","Flyer","Ded. Transport","Lord of War","Fortification"];

// Option types:
//   toggle  – checkbox, flat pts cost
//   number  – spinner, ptsEach per increment
//   select  – dropdown, each choice has its own pts delta
//   permodel_select – one dropdown PER model in the unit (models determined by base + extra_* number option)
//                     modelLabel: label shown above each model's row, e.g. "Dreadnought 1"
//                     modelCount: id of the "extra models" option (added to minModels for total)

const UNITS = [
  // ── HQ ──────────────────────────────────────────────────────────
  { slot:"HQ", name:"Captain (Firstborn)", basePts:190, minModels:1, maxModels:1,
    notes:"Independent Char, Know No Fear, Obj. Secured, Battle Drills aura (reroll 1s to hit)",
    statline:"M6 WS2+ BS2+ S4 T4 W5 I4 A4 Ld10 Sv3+",
    baseWargear:"Stormbolter, Bolt Pistol, Combat Knife, Frag/Krak Grenades, Iron Halo",
    options:[
      {id:"terminator_armour",label:"B: Terminator Armour",type:"toggle",pts:10,note:"M-2, W+1, Monstrous Infantry, Steady, Deepstrike. Lose P&G"},
      {id:"jump_pack",label:"B: Jump Pack",type:"toggle",pts:20,note:"M+6, Fly, Deepstrike"},
      {id:"bike",label:"B: Bike",type:"toggle",pts:34,note:"M+6, T+1, W+1, Steed"},
      {id:"stormshield",label:"A: Stormshield",type:"toggle",pts:12,note:"Sv-1 (improves), 4+ Invuln"},
      {id:"chapter_master",label:"C: Chapter Master",type:"toggle",pts:140,note:"W+1, A+1, Orbital Strike"},
      {id:"ranged_swap",label:"Swap Stormbolter for",type:"select",choices:[{label:"Keep Stormbolter",pts:0},{label:"Combi-Flamer",pts:4},{label:"Combi-Grav",pts:6},{label:"Combi-Plasma",pts:6},{label:"Combi-Melta",pts:21}]},
      {id:"pistol_swap",label:"Swap Bolt Pistol for",type:"select",choices:[{label:"Keep Bolt Pistol",pts:0},{label:"Hand Flamer",pts:3},{label:"Plasma Pistol",pts:7},{label:"Grav Pistol",pts:8},{label:"Inferno Pistol",pts:24}]},
      {id:"melee_swap",label:"Swap Combat Knife for",type:"select",choices:[{label:"Keep Combat Knife",pts:0},{label:"Chainsword",pts:0},{label:"Lightning Claw",pts:5},{label:"Power Sword",pts:6},{label:"Power Axe",pts:8},{label:"Power Maul",pts:14},{label:"Relic Blade",pts:16},{label:"Power Fist",pts:28},{label:"Thunderhammer",pts:57}]},
    ]},
  { slot:"HQ", name:"Chaplain (Firstborn)", basePts:185, minModels:1, maxModels:1,
    notes:"Canticle of Hate aura (Rapid Fire→Assault), Zealot (reroll To Hit on charge)",
    statline:"M6 WS2+ BS2+ S4 T4 W5 I4 A4 Ld10 Sv3+",
    baseWargear:"Boltgun, Bolt Pistol, Crozium Arcanum, Frag/Krak Grenades, Rosarius (4+ Invuln)",
    options:[
      {id:"terminator_armour",label:"B: Terminator Armour",type:"toggle",pts:10,note:"M-2, W+1, Monstrous Infantry, Steady"},
      {id:"jump_pack",label:"B: Jump Pack",type:"toggle",pts:20,note:"M+6, Fly, Deepstrike"},
      {id:"bike",label:"B: Bike",type:"toggle",pts:34,note:"M+6, T+1, W+1, Steed"},
      {id:"chief_chaplain",label:"C: Chief Chaplain",type:"toggle",pts:17,note:"W+1, A+1, extra Litany slot"},
      {id:"litany",label:"H: Litany",type:"select",choices:[{label:"None",pts:0},{label:"Omen of Potency (A+3)",pts:18},{label:"Litany of Intimidation (enemy Ld on 3d6 drop lowest)",pts:20},{label:"Litany of Faith (5+ Invuln aura)",pts:40},{label:"True Sight (BS-1 improves aura)",pts:50},{label:"Exhortation of Rage (A+1 + reroll wounds in melee aura)",pts:60}]},
    ]},
  { slot:"HQ", name:"Librarian (Firstborn)", basePts:192, minModels:1, maxModels:1,
    notes:"Psychic Mastery 2, Psychic Hood (+1 Deny). Casts up to 2 spells per phase.",
    statline:"M6 WS2+ BS2+ S4 T4 W5 I4 A4 Ld10 Sv3+",
    baseWargear:"Boltgun, Bolt Pistol, Force Sword, Frag/Krak Grenades, Iron Halo, Psychic Hood",
    options:[
      {id:"terminator_armour",label:"B: Terminator Armour",type:"toggle",pts:10,note:"M-2, W+1, Monstrous Infantry"},
      {id:"chief_librarian",label:"C: Chief Librarian",type:"toggle",pts:72,note:"W+1, A+1, Psychic Mastery +1, Deny twice per phase"},
      {id:"melee_swap",label:"Swap Force Sword for",type:"select",choices:[{label:"Keep Force Sword",pts:0},{label:"Force Axe (+4)",pts:4},{label:"Force Stave (+8)",pts:8}]},
      {id:"spell1",label:"Spell 1 (S slot)",type:"select",choices:[{label:"None",pts:0},{label:"Cause Misfortune – Cast 7+, target gains Rending all attacks",pts:10},{label:"Forewarning – Cast 6+, target 4+ Cover Save",pts:10},{label:"Bolster – Cast 6+, target counts as not moved for shooting",pts:15},{label:"Enfeeble – Cast 8+, target T-1",pts:20},{label:"Endurance – Cast 7+, target T+1",pts:20},{label:"Melting Beam – Cast 7+, Assault 1 Armourbane Beam",pts:22}]},
      {id:"spell2",label:"Spell 2 (S slot)",type:"select",choices:[{label:"None",pts:0},{label:"Cause Misfortune – Cast 7+",pts:10},{label:"Forewarning – Cast 6+",pts:10},{label:"Bolster – Cast 6+",pts:15},{label:"Enfeeble – Cast 8+",pts:20},{label:"Endurance – Cast 7+",pts:20},{label:"Melting Beam – Cast 7+",pts:22}]},
    ]},
  { slot:"HQ", name:"Primaris Captain", basePts:217, minModels:1, maxModels:1,
    notes:"Monstrous Infantry, Transhuman Physiology (5+ FNP), Stubborn, Battle Drills aura",
    statline:"M6 WS2+ BS2+ S4 T4 W6 I4 A5 Ld10 Sv3+",
    baseWargear:"Stormbolter, Bolt Pistol, Combat Knife, Frag/Krak Grenades, Iron Halo",
    options:[
      {id:"terminator_armour",label:"B: Terminator Armour",type:"toggle",pts:9,note:"M-2, W+1, Deepstrike"},
      {id:"jump_pack",label:"B: Jump Pack",type:"toggle",pts:20,note:"M+6, Fly, Deepstrike"},
      {id:"stormshield",label:"A: Stormshield",type:"toggle",pts:12,note:"Sv-1 (improves), 4+ Invuln"},
      {id:"camo_cloak",label:"B: Camo Cloak",type:"toggle",pts:8,note:"Infiltrate, Stealth"},
      {id:"chapter_master",label:"C: Chapter Master",type:"toggle",pts:140,note:"W+1, A+1, Orbital Strike"},
      {id:"ranged_swap",label:"Swap Stormbolter for",type:"select",choices:[{label:"Keep Stormbolter",pts:0},{label:"Boltstorm Gauntlet",pts:0},{label:"Mastercrafted Auto Bolt Rifle",pts:4},{label:"Combi-Flamer",pts:4},{label:"Combi-Grav",pts:6},{label:"Combi-Plasma",pts:6},{label:"Mastercrafted Bolt Carbine",pts:2},{label:"Stalker Bolt Rifle",pts:11},{label:"Combi-Melta",pts:21}]},
      {id:"melee_swap",label:"Swap Combat Knife for",type:"select",choices:[{label:"Keep Combat Knife",pts:0},{label:"Chainsword",pts:0},{label:"Lightning Claw",pts:5},{label:"Power Sword",pts:5},{label:"Power Fist",pts:16},{label:"Thunderhammer",pts:28}]},
    ]},
  { slot:"HQ", name:"Primaris Chaplain", basePts:200, minModels:1, maxModels:1,
    notes:"Transhuman Physiology, Bulky, Canticle of Hate, Zealot, Stubborn",
    statline:"M6 WS2+ BS2+ S4 T4 W5 I4 A5 Ld10 Sv3+",
    baseWargear:"Absolver Bolt Pistol, Crozium Arcanum, Frag/Krak Grenades, Rosarius",
    options:[
      {id:"terminator_armour",label:"B: Terminator Armour",type:"toggle",pts:14,note:"M-2, W+1, Deepstrike, Very Bulky"},
      {id:"jump_pack",label:"B: Jump Pack",type:"toggle",pts:20,note:"M+6, Fly, Deepstrike"},
      {id:"bike",label:"B: Bike",type:"toggle",pts:41,note:"M+6, T+1, W+1, Steed, Devastating Charge"},
      {id:"stormshield",label:"A: Stormshield",type:"toggle",pts:12,note:"Sv-1 (improves), 4+ Invuln"},
      {id:"chief_chaplain",label:"C: Chief Chaplain",type:"toggle",pts:17,note:"W+1, A+1, extra Litany"},
      {id:"litany",label:"H: Litany",type:"select",choices:[{label:"None",pts:0},{label:"Omen of Potency (A+3)",pts:18},{label:"Litany of Intimidation",pts:20},{label:"Litany of Faith (5+ Invuln aura)",pts:40},{label:"True Sight (BS-1 improves aura)",pts:50},{label:"Exhortation of Rage (A+1 + reroll wounds aura)",pts:60}]},
    ]},
  { slot:"HQ", name:"Primaris Librarian", basePts:215, minModels:1, maxModels:1,
    notes:"Monstrous Infantry, Transhuman Physiology, Psychic Mastery 2, Psychic Hood, Stubborn, Very Bulky",
    statline:"M6 WS2+ BS2+ S4 T4 W6 I4 A5 Ld10 Sv3+",
    baseWargear:"Bolt Pistol, Force Sword, Frag/Krak Grenades, Iron Halo, Psychic Hood",
    options:[
      {id:"terminator_armour",label:"B: Terminator Armour",type:"toggle",pts:4,note:"M-2, W+1, Deepstrike"},
      {id:"chief_librarian",label:"C: Chief Librarian",type:"toggle",pts:71,note:"W+1, A+1, Psychic Mastery +1, Deny twice"},
      {id:"spell1",label:"Spell 1",type:"select",choices:[{label:"None",pts:0},{label:"Cause Misfortune – Cast 7+",pts:10},{label:"Forewarning – Cast 6+",pts:10},{label:"Bolster – Cast 6+",pts:15},{label:"Enfeeble – Cast 8+",pts:20},{label:"Endurance – Cast 7+",pts:20},{label:"Melting Beam – Cast 7+",pts:22}]},
      {id:"spell2",label:"Spell 2",type:"select",choices:[{label:"None",pts:0},{label:"Cause Misfortune – Cast 7+",pts:10},{label:"Forewarning – Cast 6+",pts:10},{label:"Bolster – Cast 6+",pts:15},{label:"Enfeeble – Cast 8+",pts:20},{label:"Endurance – Cast 7+",pts:20},{label:"Melting Beam – Cast 7+",pts:22}]},
    ]},

  // ── Advisors ─────────────────────────────────────────────────────
  { slot:"Advisor", name:"Apothecary (Firstborn)", basePts:123, minModels:1, maxModels:1,
    notes:"6\" Aura: 5+ FNP. Independent Char.",
    statline:"M6 WS3+ BS3+ S4 T4 W4 I4 A3 Ld9 Sv3+",
    baseWargear:"Bolt Pistol, Combat Knife, Frag/Krak Grenades",
    options:[
      {id:"bike",label:"B: Bike",type:"toggle",pts:34,note:"M+6, T+1, W+1, Stormbolter, Steed"},
      {id:"terminator",label:"B: Terminator Armour",type:"toggle",pts:23,note:"M-2, W+1, Stormbolter, Monstrous Infantry, Deepstrike"},
      {id:"chief_apothecary",label:"C: Chief Apothecary",type:"toggle",pts:42,note:"W+1, A+1, aura reroll 1s for FNP"},
      {id:"melee_swap",label:"Swap Combat Knife for",type:"select",choices:[{label:"Keep Combat Knife",pts:0},{label:"Power Fist",pts:16}]},
    ]},
  { slot:"Advisor", name:"Primaris Apothecary", basePts:156, minModels:1, maxModels:1,
    notes:"Monstrous Infantry, Transhuman Physiology, 6\" Aura: 5+ FNP",
    statline:"M6 WS3+ BS3+ S4 T4 W4 I4 A3 Ld9 Sv3+",
    baseWargear:"Bolt Pistol, Combat Knife, Frag/Krak Grenades",
    options:[
      {id:"chief_apothecary",label:"C: Chief Apothecary",type:"toggle",pts:42,note:"W+1, A+1, aura reroll 1s for FNP"},
    ]},
  { slot:"Advisor", name:"Company Ancient", basePts:146, minModels:1, maxModels:1,
    notes:"Standard: 6\" aura reroll failed Ld, A+1",
    statline:"M6 WS3+ BS3+ S4 T4 W4 I4 A3 Ld9 Sv3+",
    baseWargear:"Boltgun, Bolt Pistol, Combat Knife, Standard",
    options:[
      {id:"bike",label:"Bike upgrade",type:"toggle",pts:34,note:"M+6, T+1, W+1, Steed"},
      {id:"chapter_ancient",label:"C: Chapter Ancient",type:"toggle",pts:42,note:"W+1, A+1, extended aura"},
    ]},
  { slot:"Advisor", name:"Techmarine (Firstborn)", basePts:149, minModels:1, maxModels:1,
    notes:"Repair (restore wounds/secondary damage to vehicles). Servo-arm.",
    statline:"M6 WS3+ BS3+ S4 T4 W4 I4 A3 Ld9 Sv3+",
    baseWargear:"Boltgun, Bolt Pistol, Servo-arm, Frag/Krak Grenades",
    options:[
      {id:"bike",label:"Bike upgrade",type:"toggle",pts:34,note:"M+6, T+1, W+1, Steed"},
    ]},
  { slot:"Advisor", name:"Primaris Lieutenant", basePts:162, minModels:1, maxModels:1,
    notes:"Monstrous Infantry, Transhuman Physiology, Tactical Precision aura (reroll 1s To Wound)",
    statline:"M6 WS3+ BS3+ S4 T4 W5 I4 A4 Ld9 Sv3+",
    baseWargear:"Bolt Pistol, Power Sword, Frag/Krak Grenades",
    options:[
      {id:"jump_pack",label:"Jump Pack",type:"toggle",pts:20,note:"M+6, Fly, Deepstrike"},
      {id:"bike",label:"Bike",type:"toggle",pts:34,note:"M+6, T+1, W+1, Steed"},
    ]},

  // ── Troops ───────────────────────────────────────────────────────
  { slot:"Troop", name:"Tactical Squad", basePts:199, minModels:5, maxModels:10,
    notes:"Infantry, Adjusted Tactics, Bolter Discipline, Tactical Squads rule, Obj. Secured",
    statline:"Sgt M6 WS3+ BS3+ S4 T4 W2 I4 A2 Ld9 Sv3+ / Marine W1 A1",
    baseWargear:"Boltgun, Bolt Pistol, Combat Knife, Frag/Krak Grenades (all models)",
    options:[
      {id:"extra_marines",label:"Extra Marines",type:"number",min:0,max:5,ptsEach:39,note:"Up to 5 more, +39 pts each (max squad 10)"},
      {id:"stormshield",label:"A: Stormshield (Sgt)",type:"toggle",pts:10,note:"Sv-1, 4+ Invuln"},
      {id:"terminator_armour",label:"B: Terminator Armour (Sgt)",type:"toggle",pts:6,note:"M-2, W+1, Monstrous Infantry"},
      {id:"sgt_ranged",label:"Sgt: Swap Boltgun for",type:"select",choices:[{label:"Keep Boltgun",pts:0},{label:"Stormbolter",pts:2},{label:"Combi-Flamer",pts:6},{label:"Combi-Grav",pts:8},{label:"Combi-Plasma",pts:8},{label:"Combi-Melta",pts:23}]},
      {id:"sgt_pistol",label:"Sgt: Swap Bolt Pistol for",type:"select",choices:[{label:"Keep Bolt Pistol",pts:0},{label:"Hand Flamer",pts:3},{label:"Plasma Pistol",pts:7},{label:"Grav Pistol",pts:8},{label:"Inferno Pistol",pts:24}]},
      {id:"sgt_melee",label:"Sgt: Swap Combat Knife for",type:"select",choices:[{label:"Keep Combat Knife",pts:0},{label:"Chainsword",pts:0},{label:"Lightning Claw",pts:3},{label:"Power Sword",pts:3},{label:"Power Axe",pts:4},{label:"Power Maul",pts:5},{label:"Power Fist",pts:10},{label:"Thunderhammer",pts:18}]},
      {id:"sgt_grenades",label:"Sgt: Swap Krak for",type:"select",choices:[{label:"Keep Krak",pts:0},{label:"Meltabombs",pts:5}]},
      {id:"special_weapon",label:"One Marine: Swap Boltgun for special weapon",type:"select",choices:[{label:"None",pts:0},{label:"Flamer",pts:4},{label:"Grav Gun",pts:6},{label:"Plasma Gun",pts:6},{label:"Meltagun",pts:21}]},
      {id:"heavy_weapon",label:"One Marine: Swap Boltgun for heavy weapon",type:"select",choices:[{label:"None",pts:0},{label:"Heavy Flamer",pts:7},{label:"Heavy Bolter",pts:9},{label:"Plasma Cannon",pts:14},{label:"Grav Cannon",pts:14},{label:"Missile Launcher",pts:19},{label:"Lascannon",pts:21},{label:"Multimelta",pts:27}]},
    ]},
  { slot:"Troop", name:"Scout Squad", basePts:189, minModels:5, maxModels:10,
    notes:"Infantry, Adjusted Tactics, Infiltrate, Scout, Obj. Secured, Stealth",
    statline:"Sgt M6 WS3+ BS3+ S4 T4 W2 I4 A2 Ld9 Sv4+ / Scout W1 A1",
    baseWargear:"Shotgun, Bolt Pistol, Combat Knife, Frag/Krak Grenades (all models)",
    options:[
      {id:"extra_scouts",label:"Extra Scouts",type:"number",min:0,max:5,ptsEach:37,note:"Up to 5 more, +37 pts each"},
      {id:"camo_cloaks",label:"E: Camo Cloaks (whole unit)",type:"number",min:0,max:10,ptsEach:2,note:"+2 pts per model in unit (enter total model count)"},
      {id:"sgt_ranged",label:"Sgt: Swap Shotgun for",type:"select",choices:[{label:"Keep Shotgun",pts:0},{label:"Boltgun",pts:1},{label:"Combi-Flamer",pts:6},{label:"Combi-Grav",pts:8},{label:"Combi-Plasma",pts:8},{label:"Combi-Melta",pts:23}]},
      {id:"sgt_pistol",label:"Sgt: Swap Bolt Pistol for",type:"select",choices:[{label:"Keep Bolt Pistol",pts:0},{label:"Hand Flamer",pts:3},{label:"Plasma Pistol",pts:7}]},
      {id:"sgt_melee",label:"Sgt: Swap Combat Knife for",type:"select",choices:[{label:"Keep Combat Knife",pts:0},{label:"Chainsword",pts:0},{label:"Power Sword",pts:3},{label:"Power Axe",pts:4},{label:"Power Fist",pts:10}]},
      {id:"any_ranged",label:"Any Scout: Swap Shotgun for",type:"select",choices:[{label:"Keep Shotguns",pts:0},{label:"All swap to Boltgun (+1 each — enter extra cost manually or add here)",pts:0}]},
      {id:"special_weapon",label:"One Scout: Swap for special weapon",type:"select",choices:[{label:"None",pts:0},{label:"Flamer",pts:4},{label:"Grav Gun",pts:6},{label:"Plasma Gun",pts:6},{label:"Meltagun",pts:21}]},
      {id:"heavy_weapon",label:"One Scout: Swap for heavy weapon",type:"select",choices:[{label:"None",pts:0},{label:"Heavy Bolter",pts:9},{label:"Missile Launcher",pts:14},{label:"Lascannon",pts:21}]},
    ]},
  { slot:"Troop", name:"Intercessor Squad", basePts:234, minModels:5, maxModels:10,
    notes:"Monstrous Infantry, Transhuman Physiology (5+ FNP), Bolter Discipline, Obj. Secured, Stubborn",
    statline:"Sgt M6 WS3+ BS3+ S4 T4 W2 I4 A2 Ld9 Sv3+ / Marine W2 A1",
    baseWargear:"Bolt Rifle, Bolt Pistol, Combat Knife, Frag/Krak Grenades",
    options:[
      {id:"extra_marines",label:"Extra Intercessors",type:"number",min:0,max:5,ptsEach:40,note:"Up to 5 more, +40 pts each"},
      {id:"sgt_pistol",label:"Sgt: Swap Bolt Pistol for",type:"select",choices:[{label:"Keep Bolt Pistol",pts:0},{label:"Hand Flamer",pts:3},{label:"Plasma Pistol",pts:7}]},
      {id:"sgt_melee",label:"Sgt: Swap Combat Knife for",type:"select",choices:[{label:"Keep Combat Knife",pts:0},{label:"Chainsword",pts:0},{label:"Power Sword",pts:5},{label:"Power Fist",pts:15},{label:"Thunderhammer",pts:28}]},
    ]},
  { slot:"Troop", name:"Heavy Intercessor Squad", basePts:278, minModels:3, maxModels:6,
    notes:"Monstrous Infantry, Transhuman Physiology, Bolter Discipline, Steady, Very Bulky, Stubborn",
    statline:"Sgt M6 WS3+ BS3+ S4 T5 W3 I4 A3 Ld9 Sv3+ / Marine W3 A2",
    baseWargear:"Heavy Bolt Rifle, Bolt Pistol, Combat Knife, Frag/Krak Grenades",
    options:[
      {id:"extra_marines",label:"Extra Heavy Intercessors",type:"number",min:0,max:3,ptsEach:91,note:"Up to 3 more, +91 pts each"},
      {id:"sgt_pistol",label:"Sgt: Swap Bolt Pistol for",type:"select",choices:[{label:"Keep Bolt Pistol",pts:0},{label:"Hand Flamer",pts:3},{label:"Plasma Pistol",pts:7}]},
      {id:"sgt_melee",label:"Sgt: Swap Combat Knife for",type:"select",choices:[{label:"Keep Combat Knife",pts:0},{label:"Chainsword",pts:0},{label:"Power Sword",pts:5},{label:"Power Fist",pts:15},{label:"Thunderhammer",pts:28}]},
      {id:"marine_rifles",label:"All Marines (not Sgt): Swap Heavy Bolt Rifles for",type:"select",choices:[{label:"Keep Heavy Bolt Rifles",pts:0},{label:"Executor Bolt Rifles (+1 per marine)",pts:0,note:"enter per-model cost manually"},{label:"Hellstorm Bolt Rifles (+2 per marine)",pts:0}]},
      {id:"heavy_bolters",label:"Up to 2 Marines: Swap for Heavy Bolter",type:"select",choices:[{label:"None",pts:0},{label:"1 Heavy Bolter",pts:5},{label:"2 Heavy Bolters",pts:10}]},
    ]},
  { slot:"Troop", name:"Assault Intercessor Squad", basePts:219, minModels:5, maxModels:10,
    notes:"Monstrous Infantry, Transhuman Physiology, Shock Assault, Stubborn",
    statline:"Sgt M6 WS3+ BS3+ S4 T4 W2 I4 A3 Ld9 Sv3+ / Marine W2 A2",
    baseWargear:"Heavy Bolt Pistol, Chainsword, Frag/Krak Grenades",
    options:[
      {id:"extra_marines",label:"Extra Assault Intercessors",type:"number",min:0,max:5,ptsEach:38,note:"Up to 5 more, +38 pts each"},
      {id:"sgt_pistol",label:"Sgt: Swap Bolt Pistol for",type:"select",choices:[{label:"Keep Heavy Bolt Pistol",pts:0},{label:"Plasma Pistol",pts:7},{label:"Hand Flamer",pts:3}]},
      {id:"sgt_melee",label:"Sgt: Swap Chainsword for",type:"select",choices:[{label:"Keep Chainsword",pts:0},{label:"Power Sword",pts:3},{label:"Power Axe",pts:4},{label:"Power Fist",pts:10},{label:"Thunderhammer",pts:18}]},
    ]},
  { slot:"Troop", name:"Infiltrator Squad", basePts:254, minModels:5, maxModels:10,
    notes:"Monstrous Infantry, Transhuman Physiology, Infiltrate, Helix Gauntlet (FNP aura), Obj. Secured",
    statline:"Sgt M6 WS3+ BS3+ S4 T4 W2 I4 A2 Ld9 Sv3+",
    baseWargear:"Marksman Bolt Carbine, Bolt Pistol, Combat Knife, Frag/Krak Grenades",
    options:[
      {id:"extra_marines",label:"Extra Infiltrators",type:"number",min:0,max:5,ptsEach:46,note:"Up to 5 more, +46 pts each"},
    ]},

  // ── Elites ───────────────────────────────────────────────────────
  { slot:"Elite", name:"Dreadnoughts", basePts:138, minModels:1, maxModels:3,
    notes:"Vehicle, Combat Walker. Each model can be independently armed.",
    statline:"M6 WS2+ BS2+ S6 FA13 SA12 RA10 W10 I4 A4 Ld10 Sv3+",
    baseWargear:"Dreadnought Combat Weapon & Stormbolter, Dreadnought Missile Launcher",
    perModelOptions: true,
    options:[
      {id:"extra_dreadnoughts",label:"Extra Dreadnoughts",type:"number",min:0,max:2,ptsEach:138,note:"Up to 2 more, +138 pts each"},
      {id:"extra_armour",label:"E: Extra Armour (whole unit)",type:"toggle",pts:5,note:"Per model: Crew Stun → Weapon Disabled"},
      {id:"smoke_launchers",label:"E: Smoke Launchers (whole unit)",type:"toggle",pts:10,note:"Per model: One Use, 5\" Smoke Cloud"},
    ],
    perModelWeapons:[
      {id:"left_arm",label:"Left arm weapon",choices:[{label:"Dreadnought Combat Weapon & Stormbolter",pts:0},{label:"Dreadnought Combat Weapon & Heavy Flamer",pts:1},{label:"Inferno Cannon",pts:1},{label:"Multimelta",pts:2},{label:"Assault Cannon",pts:5},{label:"2 Linked Lascannons",pts:11},{label:"Heavy Plasma Cannon",pts:28}]},
      {id:"right_arm",label:"Right arm weapon",choices:[{label:"Dreadnought Missile Launcher",pts:0},{label:"Dreadnought Combat Weapon & Stormbolter",pts:0},{label:"Inferno Cannon",pts:1},{label:"Multimelta",pts:2},{label:"Assault Cannon",pts:5},{label:"2 Linked Lascannons",pts:11},{label:"Heavy Plasma Cannon",pts:28}]},
    ]},
  { slot:"Elite", name:"Ironclad Dreadnoughts", basePts:143, minModels:1, maxModels:2,
    notes:"Vehicle, Combat Walker, heavy close combat specialist. Each model independently armed.",
    statline:"M6 WS2+ BS2+ S6 FA13 SA13 RA10 W10 I4 A4 Ld10 Sv3+",
    baseWargear:"Seismic Hammer & Stormbolter, Dreadnought Chainfist, Hunter-Killer Missile",
    perModelOptions: true,
    options:[
      {id:"extra_ironclad",label:"Extra Ironclad",type:"number",min:0,max:1,ptsEach:143,note:"1 more, +143 pts"},
      {id:"extra_armour",label:"E: Extra Armour (whole unit)",type:"toggle",pts:5},
      {id:"smoke_launchers",label:"E: Smoke Launchers (whole unit)",type:"toggle",pts:10},
    ],
    perModelWeapons:[
      {id:"arm_weapon",label:"Arm weapon swap",choices:[{label:"Keep Seismic Hammer",pts:0},{label:"Hurricane Bolter",pts:5},{label:"Heavy Flamer",pts:7},{label:"Multimelta",pts:9}]},
    ]},
  { slot:"Elite", name:"Contemptor Dreadnought", basePts:153, minModels:1, maxModels:1,
    notes:"Vehicle, Combat Walker, 5+ Invulnerability Save",
    statline:"M6 WS2+ BS2+ S6 FA13 SA12 RA10 W10 I4 A4 Ld10 Sv3+",
    baseWargear:"Dreadnought CCW & Stormbolter, Dreadnought CCW",
    options:[
      {id:"left_arm",label:"Left arm",type:"select",choices:[{label:"Dreadnought CCW & Stormbolter",pts:0},{label:"Multi-Melta",pts:2},{label:"Assault Cannon",pts:5},{label:"Lascannon",pts:11},{label:"Heavy Plasma Cannon",pts:28}]},
      {id:"right_arm",label:"Right arm",type:"select",choices:[{label:"Dreadnought CCW & Stormbolter",pts:0},{label:"Multi-Melta",pts:2},{label:"Assault Cannon",pts:5},{label:"Lascannon",pts:11}]},
    ]},
  { slot:"Elite", name:"Terminators", basePts:455, minModels:5, maxModels:10,
    notes:"Infantry, Terminator Armour (2+ Sv, 5+ Invuln), Deepstrike, Know No Fear",
    statline:"Sgt M6 WS3+ BS3+ S4 T4 W2 I4 A2 Ld9 Sv2+ / Terminator W2 A1",
    baseWargear:"Stormbolter & Power Fist (all). Sgt: Power Sword.",
    options:[
      {id:"extra_terminators",label:"Extra Terminators",type:"number",min:0,max:5,ptsEach:91,note:"Up to 5 more, +91 pts each"},
      {id:"storm_shields",label:"Any: Swap Stormbolter for Stormshield (qty)",type:"number",min:0,max:9,ptsEach:10,note:"+10 pts per model, 4+ Invuln"},
      {id:"heavy_weapon",label:"One: Heavy weapon",type:"select",choices:[{label:"None",pts:0},{label:"Assault Cannon",pts:5},{label:"Heavy Flamer",pts:7},{label:"Cyclone Missile Launcher",pts:14}]},
    ]},
  { slot:"Elite", name:"Assault Terminators", basePts:335, minModels:5, maxModels:10,
    notes:"Infantry, Terminator Armour (2+ Sv, 5+ Invuln), Deepstrike. Thunder Hammers or Lightning Claws.",
    statline:"Sgt M6 WS3+ BS3+ S4 T4 W2 I4 A2 Ld9 Sv2+",
    baseWargear:"Thunder Hammer & Stormshield (all models by default)",
    options:[
      {id:"extra_terminators",label:"Extra Assault Terminators",type:"number",min:0,max:5,ptsEach:67,note:"Up to 5 more, +67 pts each"},
      {id:"lightning_claws",label:"Models swapping to dual Lightning Claws (qty)",type:"number",min:0,max:9,ptsEach:-5,note:"-5 pts per model (dual LC cheaper than hammer+shield)"},
    ]},
  { slot:"Elite", name:"Bladeguard Veterans", basePts:455, minModels:5, maxModels:10,
    notes:"Monstrous Infantry, Transhuman Physiology, 4+ Invuln (Stormshield), Stubborn",
    statline:"Sgt M6 WS3+ BS3+ S4 T4 W2 I4 A3 Ld9 Sv3+",
    baseWargear:"Master-crafted Power Sword, Stormshield, Heavy Bolt Pistol",
    options:[
      {id:"extra_bladeguard",label:"Extra Bladeguard Veterans",type:"number",min:0,max:5,ptsEach:91,note:"Up to 5 more, +91 pts each"},
    ]},
  { slot:"Elite", name:"Redemptor Dreadnought", basePts:204, minModels:1, maxModels:1,
    notes:"Vehicle, Combat Walker, Onslaught Gatling Cannon or Macro Plasma Incinerator",
    statline:"M6 WS3+ BS3+ S7 FA13 SA13 RA10 W12 I4 A4 Ld10 Sv3+",
    baseWargear:"Onslaught Gatling Cannon, Fragstorm Grenade Launcher, Dreadnought CCW, Icarus Rocket Pod",
    options:[
      {id:"main_gun",label:"Main gun",type:"select",choices:[{label:"Onslaught Gatling Cannon",pts:0},{label:"Macro Plasma Incinerator (+21)",pts:21}]},
      {id:"fist_weapon",label:"Fist weapon",type:"select",choices:[{label:"Dreadnought CCW",pts:0},{label:"Onslaught Gauntlet (+5)",pts:5}]},
      {id:"extra_armour",label:"Extra Armour",type:"toggle",pts:5},
      {id:"smoke_launchers",label:"Smoke Launchers",type:"toggle",pts:10},
    ]},
  { slot:"Elite", name:"Leviathan Dreadnought", basePts:191, minModels:1, maxModels:1,
    notes:"Vehicle, Combat Walker, Void Shields 1",
    statline:"M6 WS2+ BS2+ S8 FA14 SA13 RA12 W14 I4 A5 Ld10 Sv2+",
    baseWargear:"2x Dreadnought CCW, 2x Meltagun",
    options:[
      {id:"left_arm",label:"Left arm",type:"select",choices:[{label:"Leviathan Siege Claw & Meltagun",pts:0},{label:"Leviathan Siege Drill & Meltagun",pts:0},{label:"Grav-Flux Bombard",pts:14},{label:"Cyclonic Melta Lance",pts:9}]},
      {id:"right_arm",label:"Right arm",type:"select",choices:[{label:"Leviathan Siege Claw & Meltagun",pts:0},{label:"Leviathan Siege Drill & Meltagun",pts:0},{label:"Grav-Flux Bombard",pts:14},{label:"Cyclonic Melta Lance",pts:9}]},
      {id:"extra_armour",label:"Extra Armour",type:"toggle",pts:5},
    ]},

  // ── Fast Attack ──────────────────────────────────────────────────
  { slot:"Fast Attack", name:"Attack Bikes", basePts:82, minModels:1, maxModels:3,
    notes:"Infantry, Steed, Weapons Platform (counts as not moved for shooting), Obj. Secured. Each bike independently armed.",
    statline:"M12 WS3+ BS3+ S4 T5 W4 I4 A2 Ld8 Sv3+",
    baseWargear:"Heavy Bolter, Stormbolter, Bolt Pistol",
    perModelOptions: true,
    options:[
      {id:"extra_bikes",label:"Extra Attack Bikes",type:"number",min:0,max:2,ptsEach:82,note:"Up to 2 more, +82 pts each"},
    ],
    perModelWeapons:[
      {id:"sidecar_weapon",label:"Sidecar weapon",choices:[{label:"Heavy Bolter",pts:0},{label:"Multimelta (+18)",pts:18}]},
    ]},
  { slot:"Fast Attack", name:"Bike Squad", basePts:163, minModels:3, maxModels:9,
    notes:"Infantry, Steed, Adjusted Tactics, Bolter Discipline, Obj. Secured",
    statline:"Sgt M12 WS3+ BS3+ S4 T5 W3 I4 A2 Ld9 Sv3+ / Marine W3 A1",
    baseWargear:"Stormbolter (twin), Bolt Pistol, Combat Knife, Frag/Krak Grenades",
    options:[
      {id:"extra_marines",label:"Extra Bikers",type:"number",min:0,max:6,ptsEach:53,note:"Up to 6 more, +53 pts each"},
      {id:"attack_bike",label:"Add one Attack Bike",type:"toggle",pts:82,note:"+82 pts, Heavy Bolter sidecar"},
      {id:"special_weapons",label:"Up to 2 Marines: Swap Boltgun for special weapon",type:"select",choices:[{label:"None",pts:0},{label:"1× Flamer",pts:0},{label:"2× Flamers",pts:0},{label:"1× Grav Gun",pts:7},{label:"2× Grav Guns",pts:14},{label:"1× Plasma Gun",pts:7},{label:"2× Plasma Guns",pts:14},{label:"1× Meltagun",pts:22},{label:"2× Meltaguns",pts:44}]},
      {id:"sgt_melee",label:"Sgt: Swap Combat Knife for",type:"select",choices:[{label:"Keep Combat Knife",pts:0},{label:"Chainsword",pts:0},{label:"Lightning Claw",pts:3},{label:"Power Sword",pts:3},{label:"Power Fist",pts:10},{label:"Thunderhammer",pts:18}]},
    ]},
  { slot:"Fast Attack", name:"Land Speeders", basePts:106, minModels:1, maxModels:3,
    notes:"Vehicle, Flyer. Each speeder can be independently armed.",
    statline:"M14 WS4+ BS3+ S5 FA10 SA10 RA10 W6 I1 A2 Ld10 Sv3+",
    baseWargear:"Heavy Bolter, Assault Cannon",
    perModelOptions: true,
    options:[
      {id:"extra_speeders",label:"Extra Land Speeders",type:"number",min:0,max:2,ptsEach:106,note:"Up to 2 more, +106 pts each"},
    ],
    perModelWeapons:[
      {id:"main_weapon",label:"Main weapon",choices:[{label:"Heavy Bolter",pts:0},{label:"Multi-Melta (+2)",pts:2},{label:"Assault Cannon (+5)",pts:5},{label:"Plasma Cannon (+14)",pts:14}]},
      {id:"secondary_weapon",label:"Secondary weapon",choices:[{label:"Assault Cannon",pts:0},{label:"Heavy Flamer (+7)",pts:7},{label:"Typhoon Missile Launcher (+14)",pts:14}]},
    ]},
  { slot:"Fast Attack", name:"Scout Bike Squad", basePts:175, minModels:3, maxModels:9,
    notes:"Infantry, Steed, Scout rule, Infiltrate, Obj. Secured",
    statline:"Sgt M12 WS3+ BS3+ S4 T5 W3 I4 A2 Ld9 Sv4+ / Scout W3 A1",
    baseWargear:"Stormbolter (twin), Bolt Pistol, Combat Knife, Cluster Mines",
    options:[
      {id:"extra_scouts",label:"Extra Scout Bikers",type:"number",min:0,max:6,ptsEach:53,note:"Up to 6 more, +53 pts each"},
      {id:"sgt_melee",label:"Sgt: Swap Combat Knife for",type:"select",choices:[{label:"Keep Combat Knife",pts:0},{label:"Chainsword",pts:0},{label:"Power Sword",pts:3},{label:"Power Fist",pts:10}]},
    ]},

  // ── Heavy Support ────────────────────────────────────────────────
  { slot:"Heavy Support", name:"Devastator Squad", basePts:199, minModels:5, maxModels:10,
    notes:"Infantry, Adjusted Tactics, Bolter Discipline, heavy weapon specialists. Signum: one model gets BS reroll.",
    statline:"Sgt M6 WS3+ BS3+ S4 T4 W2 I4 A2 Ld9 Sv3+ / Marine W1 A1",
    baseWargear:"Boltgun, Bolt Pistol, Combat Knife, Frag/Krak Grenades",
    options:[
      {id:"extra_marines",label:"Extra Devastators",type:"number",min:0,max:5,ptsEach:38,note:"Up to 5 more, +38 pts each"},
      {id:"heavy1",label:"Marine 1: heavy weapon",type:"select",choices:[{label:"Keep Boltgun",pts:0},{label:"Heavy Flamer",pts:7},{label:"Heavy Bolter",pts:9},{label:"Plasma Cannon",pts:14},{label:"Grav Cannon",pts:14},{label:"Missile Launcher",pts:19},{label:"Lascannon",pts:21},{label:"Multimelta",pts:27}]},
      {id:"heavy2",label:"Marine 2: heavy weapon",type:"select",choices:[{label:"Keep Boltgun",pts:0},{label:"Heavy Flamer",pts:7},{label:"Heavy Bolter",pts:9},{label:"Plasma Cannon",pts:14},{label:"Grav Cannon",pts:14},{label:"Missile Launcher",pts:19},{label:"Lascannon",pts:21},{label:"Multimelta",pts:27}]},
      {id:"heavy3",label:"Marine 3: heavy weapon",type:"select",choices:[{label:"Keep Boltgun",pts:0},{label:"Heavy Flamer",pts:7},{label:"Heavy Bolter",pts:9},{label:"Plasma Cannon",pts:14},{label:"Grav Cannon",pts:14},{label:"Missile Launcher",pts:19},{label:"Lascannon",pts:21},{label:"Multimelta",pts:27}]},
      {id:"heavy4",label:"Marine 4: heavy weapon",type:"select",choices:[{label:"Keep Boltgun",pts:0},{label:"Heavy Flamer",pts:7},{label:"Heavy Bolter",pts:9},{label:"Plasma Cannon",pts:14},{label:"Grav Cannon",pts:14},{label:"Missile Launcher",pts:19},{label:"Lascannon",pts:21},{label:"Multimelta",pts:27}]},
      {id:"sgt_melee",label:"Sgt: Swap Combat Knife for",type:"select",choices:[{label:"Keep Combat Knife",pts:0},{label:"Chainsword",pts:0},{label:"Power Sword",pts:3},{label:"Power Fist",pts:10}]},
    ]},
  { slot:"Heavy Support", name:"Predators", basePts:145, minModels:1, maxModels:3,
    notes:"Vehicle, Tank. Each Predator can have different sponson loadout.",
    statline:"M10 WS4+ BS3+ S6 FA13 SA11 RA10 W10 I1 A3 Ld10 Sv3+",
    baseWargear:"Predator Autocannon",
    perModelOptions: true,
    options:[
      {id:"extra_predators",label:"Extra Predators",type:"number",min:0,max:2,ptsEach:145,note:"Up to 2 more, +145 pts each"},
      {id:"extra_armour",label:"E: Extra Armour (whole unit)",type:"toggle",pts:5},
      {id:"smoke_launchers",label:"E: Smoke Launchers (whole unit)",type:"toggle",pts:10},
    ],
    perModelWeapons:[
      {id:"sponsons",label:"Sponsons",choices:[{label:"No sponsons",pts:0},{label:"Heavy Bolters (+9)",pts:9},{label:"Lascannons (+27)",pts:27}]},
      {id:"hunter_killer",label:"Hunter-Killer Missile",choices:[{label:"None",pts:0},{label:"Hunter-Killer Missile (+9)",pts:9}]},
    ]},
  { slot:"Heavy Support", name:"Vindicators", basePts:160, minModels:1, maxModels:3,
    notes:"Vehicle, Tank, Demolisher Cannon (5\" blast, S10, AP2+). Per-model upgrades available.",
    statline:"M10 WS4+ BS3+ S6 FA13 SA11 RA10 W10 I1 A3 Ld10 Sv3+",
    baseWargear:"Demolisher Cannon, Storm Bolter",
    perModelOptions: true,
    options:[
      {id:"extra_vindicators",label:"Extra Vindicators",type:"number",min:0,max:2,ptsEach:160,note:"Up to 2 more, +160 pts each"},
      {id:"extra_armour",label:"E: Extra Armour (whole unit)",type:"toggle",pts:5},
    ],
    perModelWeapons:[
      {id:"upgrades",label:"Per-model upgrades",choices:[{label:"None",pts:0},{label:"Smoke Launchers (+10)",pts:10},{label:"Hunter-Killer Missile (+9)",pts:9},{label:"Dozerblade (+5)",pts:5}]},
    ]},
  { slot:"Heavy Support", name:"Whirlwinds", basePts:116, minModels:1, maxModels:3,
    notes:"Vehicle, Tank, Indirect Fire artillery. Each can have different missile type.",
    statline:"M10 WS4+ BS3+ S6 FA11 SA11 RA10 W10 I1 A3 Ld10 Sv3+",
    baseWargear:"Whirlwind Multiple Missile Launcher, Storm Bolter",
    perModelOptions: true,
    options:[
      {id:"extra_whirlwinds",label:"Extra Whirlwinds",type:"number",min:0,max:2,ptsEach:116,note:"Up to 2 more, +116 pts each"},
      {id:"extra_armour",label:"E: Extra Armour (whole unit)",type:"toggle",pts:5},
    ],
    perModelWeapons:[
      {id:"missile_type",label:"Missile type",choices:[{label:"Vengeance – S5 Frag, Indirect",pts:0},{label:"Castellan – S8 AP3+ Krak, Indirect (+5)",pts:5}]},
    ]},
  { slot:"Heavy Support", name:"Land Raider", basePts:293, minModels:1, maxModels:1,
    notes:"Vehicle, Tank, Transport 10 (Assault Ramps), twin Lascannon sponsons ×2",
    statline:"M6 WS4+ BS2+ S8 FA14 SA14 RA14 W16 I1 A6 Ld10 Sv3+",
    baseWargear:"Twin Heavy Bolter, 2× 2 Linked Lascannons",
    options:[
      {id:"extra_armour",label:"E: Extra Armour",type:"toggle",pts:5},
      {id:"smoke_launchers",label:"E: Smoke Launchers",type:"toggle",pts:10},
      {id:"frag_launchers",label:"E: Frag Launchers",type:"toggle",pts:10,note:"Units charging from LR ignore cover disorg. penalty"},
      {id:"hunter_killer",label:"D: Hunter-Killer Missile",type:"toggle",pts:9,note:"One Use, S10 AP3+, Monsterbane"},
      {id:"dozer_blade",label:"M: Dozerblade",type:"toggle",pts:5},
      {id:"pintle_storm",label:"P1: Pintle Stormbolter",type:"toggle",pts:7},
      {id:"pintle_plasma",label:"P2: Pintle Combi-Plasma",type:"toggle",pts:13},
    ]},
  { slot:"Heavy Support", name:"Gladiator", basePts:226, minModels:1, maxModels:1,
    notes:"Vehicle, Tank, Primaris. Three weapon variants.",
    statline:"M10 WS4+ BS3+ S6 FA13 SA12 RA11 W14 I1 A4 Ld10 Sv3+",
    baseWargear:"Lancer / Reaper / Valiant variant — choose below",
    options:[
      {id:"variant",label:"Variant",type:"select",choices:[{label:"Gladiator Lancer (Lascannon focus)",pts:0},{label:"Gladiator Reaper (Rotary cannon spam)",pts:0},{label:"Gladiator Valiant (Melta focus)",pts:0}]},
      {id:"extra_armour",label:"Extra Armour",type:"toggle",pts:5},
      {id:"smoke_launchers",label:"Smoke Launchers",type:"toggle",pts:10},
    ]},
  { slot:"Heavy Support", name:"Sicaran Battle Tank", basePts:194, minModels:1, maxModels:1,
    notes:"Vehicle, Tank, twin Accelerator Autocannons, fast for Heavy Support",
    statline:"M12 WS4+ BS3+ S6 FA13 SA12 RA10 W12 I1 A4 Ld10 Sv3+",
    baseWargear:"Twin Accelerator Autocannon, Storm Bolter",
    options:[
      {id:"sponsons",label:"Sponsons",type:"select",choices:[{label:"No sponsons",pts:0},{label:"Lascannons (+27)",pts:27},{label:"Heavy Bolters (+9)",pts:9},{label:"Heavy Flamers (+14)",pts:14}]},
      {id:"extra_armour",label:"Extra Armour",type:"toggle",pts:5},
    ]},

  // ── Flyers ───────────────────────────────────────────────────────
  { slot:"Flyer", name:"Stormhawk Interceptor", basePts:218, minModels:1, maxModels:1,
    notes:"Vehicle, High Altitude, AA specialist, Interceptor rule",
    statline:"M20 WS5+ BS2+ S6 FA12 SA12 RA11 W8 I1 A3 Ld10 Sv3+",
    baseWargear:"Las-talon or 2 Linked Lascannons, Icarus Stormcannon, Twin Assault Cannons",
    options:[
      {id:"icarus_swap",label:"Swap Icarus for",type:"select",choices:[{label:"Keep Icarus Stormcannon",pts:0},{label:"Typhoon Missile Launcher",pts:5}]},
    ]},
  { slot:"Flyer", name:"Stormraven Gunship", basePts:317, minModels:1, maxModels:1,
    notes:"Vehicle, High Altitude, Transport 12, Bloodstrike Missiles",
    statline:"M20 WS5+ BS2+ S8 FA12 SA12 RA11 W14 I1 A4 Ld10 Sv3+",
    baseWargear:"Twin Assault Cannon, Twin Heavy Bolter, 2× Stormstrike Missiles",
    options:[
      {id:"main_gun",label:"Swap Twin Assault Cannon for",type:"select",choices:[{label:"Keep Twin Assault Cannon",pts:0},{label:"Twin Lascannon",pts:14},{label:"Twin Multi-Melta",pts:9},{label:"Twin Plasma Cannon",pts:12}]},
      {id:"hull_gun",label:"Swap Twin Heavy Bolter hull for",type:"select",choices:[{label:"Keep Twin Heavy Bolter",pts:0},{label:"Twin Lascannon",pts:14},{label:"Twin Multi-Melta",pts:9}]},
      {id:"extra_armour",label:"Extra Armour",type:"toggle",pts:5},
    ]},
  { slot:"Flyer", name:"Stormtalon Gunship", basePts:224, minModels:1, maxModels:1,
    notes:"Vehicle, High Altitude, escort flyer, Skyhammer Missiles, AA capable",
    statline:"M20 WS5+ BS2+ S6 FA11 SA11 RA10 W10 I1 A3 Ld10 Sv3+",
    baseWargear:"Twin Assault Cannon, 2× Skyhammer Missiles",
    options:[
      {id:"secondary",label:"Secondary weapon swap",type:"select",choices:[{label:"Keep Skyhammer Missiles",pts:0},{label:"Twin Lascannon (+14)",pts:14},{label:"Typhoon Missile Launcher (+5)",pts:5},{label:"Heavy Bolters (+9)",pts:9}]},
    ]},

  // ── Dedicated Transports ─────────────────────────────────────────
  { slot:"Ded. Transport", name:"Rhino", basePts:136, minModels:1, maxModels:1,
    notes:"Vehicle, Tank, Transport 10, Smoke Launchers, Repair (5+ restore secondary damage)",
    statline:"M12 WS4+ BS3+ S6 FA11 SA11 RA10 W10 I1 A3 Ld10 Sv3+",
    baseWargear:"Storm Bolter, Smoke Launchers",
    options:[
      {id:"extra_armour",label:"Extra Armour",type:"toggle",pts:5,note:"Crew Stun → Weapon Disabled"},
      {id:"dozer_blade",label:"Dozerblade",type:"toggle",pts:9},
      {id:"hunter_killer",label:"Hunter-Killer Missile",type:"toggle",pts:9},
      {id:"pintle_storm",label:"Pintle Stormbolter",type:"toggle",pts:5},
    ]},
  { slot:"Ded. Transport", name:"Drop Pod", basePts:125, minModels:1, maxModels:1,
    notes:"Vehicle, Deep Strike. One-time use.",
    statline:"M0 FA12 SA12 RA12 W8",
    baseWargear:"Storm Bolter (immovable after landing)",
    options:[
      {id:"deathwind",label:"Swap Storm Bolter for Deathwind Missile Launcher",type:"toggle",pts:15,note:"S6 AP4+, 5\" blast on landing"},
    ]},
  { slot:"Ded. Transport", name:"Impulsor", basePts:184, minModels:1, maxModels:1,
    notes:"Vehicle, Tank, Primaris, Transport 6, Assault Ramps",
    statline:"M12 WS4+ BS3+ S5 FA11 SA11 RA10 W10 I1 A3 Ld10 Sv3+",
    baseWargear:"2× Storm Bolters, Smoke Launchers",
    options:[
      {id:"shield_dome",label:"Shield Dome",type:"toggle",pts:20,note:"5+ Invuln Save vs Ranged"},
      {id:"bellicatus",label:"Bellicatus Missile Array",type:"toggle",pts:14,note:"Icarus: AA S7 AP4+, or Krak: S8 AP3+"},
      {id:"extra_armour",label:"Extra Armour",type:"toggle",pts:5},
    ]},

  // ── Lords of War ─────────────────────────────────────────────────
  { slot:"Lord of War", name:"Spartan Assault Tank", basePts:608, minModels:1, maxModels:1,
    notes:"Titanic Vehicle, Transport 25, 4× Lascannons, Assault Ramps, Fearless",
    statline:"M10 WS4+ BS2+ S10 FA15 SA15 RA14 W22 I1 A6 Ld10 Sv2+",
    baseWargear:"4× Lascannons (sponsons), Twin Heavy Bolter, Demolisher Cannon",
    options:[
      {id:"extra_armour",label:"Extra Armour",type:"toggle",pts:10},
      {id:"void_shields",label:"Void Shields upgrade",type:"toggle",pts:40,note:"Void Shields 2"},
      {id:"hunter_killer",label:"Hunter-Killer Missile",type:"toggle",pts:9},
    ]},
  { slot:"Lord of War", name:"Fellblade", basePts:853, minModels:1, maxModels:1,
    notes:"Titanic Vehicle, Accelerator Cannon (huge S10 AP1+ blast), Transport 8, Fearless",
    statline:"M10 WS4+ BS2+ S10 FA15 SA15 RA14 W25 I1 A8 Ld10 Sv2+",
    baseWargear:"Accelerator Cannon, 2× Lascannons, 2× Heavy Bolters, Demolisher Cannon",
    options:[
      {id:"extra_armour",label:"Extra Armour",type:"toggle",pts:10},
      {id:"smoke_launchers",label:"Smoke Launchers",type:"toggle",pts:10},
      {id:"void_shields",label:"Void Shields",type:"toggle",pts:50,note:"Void Shields 2"},
    ]},
  { slot:"Lord of War", name:"Astraeus Super-heavy Tank", basePts:724, minModels:1, maxModels:1,
    notes:"Titanic Vehicle, Primaris, Macro-accelerator Cannon, Void Shields, Transport 6",
    statline:"M10 WS4+ BS2+ S10 FA15 SA15 RA14 W24 I1 A8 Ld10 Sv2+",
    baseWargear:"Macro-accelerator Cannon, 2× Twin Las-talon, 2× Twin Boltstorm Gauntlet",
    options:[
      {id:"extra_armour",label:"Extra Armour",type:"toggle",pts:10},
    ]},

  // ── Fortifications ───────────────────────────────────────────────
  { slot:"Fortification", name:"Aegis Defence Line", basePts:66, minModels:1, maxModels:1,
    notes:"Terrain, 5+ Cover Save walls, one weapon emplacement",
    baseWargear:"Aegis sections + weapon emplacement",
    options:[
      {id:"weapon",label:"Emplacement weapon",type:"select",choices:[{label:"Quad Gun – AA Heavy 4, Interceptor",pts:0},{label:"Icarus Lascannon – AA, Interceptor (+10)",pts:10}]},
    ]},
  { slot:"Fortification", name:"Hammerfall Bunker", basePts:352, minModels:1, maxModels:1,
    notes:"Terrain Fortification, Transport 10 (inside), automated weapons, very durable",
    baseWargear:"Quad Heavy Bolters, Storm Bolter",
    options:[
      {id:"main_weapon",label:"Main weapon",type:"select",choices:[{label:"Hammerfall Heavy Bolter Array",pts:0},{label:"Hammerfall Missile Launcher Array (+20)",pts:20}]},
    ]},
  { slot:"Fortification", name:"Void Shield Generator", basePts:307, minModels:1, maxModels:1,
    notes:"Terrain, Void Shields 3 in radius — protects nearby units from ranged attacks",
    baseWargear:"Void Shield emitters",
    options:[]},
];

// ── Cost calculation ──────────────────────────────────────────────
function calcModelPerWeaponCost(unit, modelOpts) {
  if (!unit.perModelWeapons) return 0;
  let total = 0;
  for (const wep of unit.perModelWeapons) {
    const val = modelOpts?.[wep.id];
    const choice = wep.choices.find(c=>c.label===val) || wep.choices[0];
    total += choice?.pts || 0;
  }
  return total;
}

function totalModelCount(unit, opts) {
  const extraOpt = unit.options.find(o=>o.type==="number" && o.id.startsWith("extra_"));
  const extraCount = extraOpt ? (parseInt(opts[extraOpt.id])||0) : 0;
  return unit.minModels + extraCount;
}

function calcUnitCost(unit, opts, perModelOpts) {
  let total = unit.basePts;
  for (const opt of unit.options) {
    const val = opts[opt.id];
    if (val === undefined) continue;
    if (opt.type==="toggle" && val) total += opt.pts;
    if (opt.type==="number") total += (parseInt(val)||0) * (opt.ptsEach||0);
    if (opt.type==="select") {
      const choice = opt.choices?.find(c=>c.label===val);
      if (choice) total += choice.pts;
    }
  }
  if (unit.perModelOptions && perModelOpts) {
    const count = totalModelCount(unit, opts);
    for (let i=0; i<count; i++) {
      total += calcModelPerWeaponCost(unit, perModelOpts[i]);
    }
  }
  return total;
}

function defaultOpts(unit) {
  const o = {};
  for (const opt of unit.options) {
    if (opt.type==="toggle") o[opt.id] = false;
    else if (opt.type==="number") o[opt.id] = opt.min||0;
    else if (opt.type==="select") o[opt.id] = opt.choices?.[0]?.label || "";
  }
  return o;
}

function defaultPerModelOpts(unit, count) {
  if (!unit.perModelWeapons) return [];
  return Array.from({length: count}, () => {
    const m = {};
    for (const wep of unit.perModelWeapons) m[wep.id] = wep.choices[0].label;
    return m;
  });
}

// ── Summary text builder ──────────────────────────────────────────
function buildSummaryLines(unit, opts, perModelOpts) {
  const lines = [];
  const modelCount = totalModelCount(unit, opts);
  lines.push(`${modelCount} model${modelCount!==1?"s":""}`);

  for (const opt of unit.options) {
    const val = opts[opt.id];
    if (opt.type==="toggle" && val) lines.push(opt.label.replace(/^[A-Z]+: /,""));
    if (opt.type==="number" && parseInt(val)>0) {
      if (opt.id.startsWith("extra_")) {
        // already captured in model count
      } else {
        lines.push(`${val}× ${opt.label}`);
      }
    }
    if (opt.type==="select") {
      const choice = opt.choices?.find(c=>c.label===val);
      if (choice && choice.pts!==0) lines.push(`${opt.label}: ${val}`);
      else if (choice && !choice.label.startsWith("Keep") && !choice.label.startsWith("None") && !choice.label.startsWith("No ") && choice.pts===0 && val!==opt.choices[0].label) lines.push(`${opt.label}: ${val}`);
    }
  }

  if (unit.perModelOptions && perModelOpts?.length) {
    const count = totalModelCount(unit, opts);
    const modelName = unit.name.replace(/s$/,"").replace(" Squad","").replace(" Dreadnoughts","");
    for (let i=0; i<count; i++) {
      const mOpts = perModelOpts[i] || {};
      const wepParts = (unit.perModelWeapons||[]).map(wep => {
        const val = mOpts[wep.id] || wep.choices[0].label;
        if (val === wep.choices[0].label) return null;
        return `${wep.label}: ${val}`;
      }).filter(Boolean);
      if (wepParts.length) lines.push(`${modelName} ${i+1}: ${wepParts.join(", ")}`);
    }
  }
  return lines;
}

// ── App ───────────────────────────────────────────────────────────
export default function App() {
  const [gameSize, setGameSize] = useState(2000);
  const [chapter, setChapter] = useState("Ultramarines");
  const [armyName, setArmyName] = useState("My Army");
  const [entries, setEntries] = useState([]);
  const [showAdd, setShowAdd] = useState(false);
  const [selectedUnit, setSelectedUnit] = useState(null);
  const [pendingOpts, setPendingOpts] = useState({});
  const [pendingPerModel, setPendingPerModel] = useState([]);
  const [editIdx, setEditIdx] = useState(null);
  const [filterSlot, setFilterSlot] = useState("All");
  const [activeTab, setActiveTab] = useState("builder");
  const fileInputRef = useRef(null);

  const totalPts = useMemo(() => entries.reduce((s,e)=>s+e.cost,0), [entries]);
  const slotCounts = useMemo(() => { const c={}; for(const e of entries) c[e.slot]=(c[e.slot]||0)+1; return c; }, [entries]);
  const sortedEntries = useMemo(() => [...entries].sort((a,b)=>(SLOT_ORDER.indexOf(a.slot)||99)-(SLOT_ORDER.indexOf(b.slot)||99)), [entries]);

  function issues() {
    const r=[];
    const hq=slotCounts["HQ"]||0, tr=slotCounts["Troop"]||0, el=slotCounts["Elite"]||0, fa=slotCounts["Fast Attack"]||0, hs=slotCounts["Heavy Support"]||0, fl=slotCounts["Flyer"]||0, lw=slotCounts["Lord of War"]||0;
    if(hq<1) r.push("Need at least 1 HQ");
    if(hq>2) r.push("Max 2 HQ slots");
    if(tr<2) r.push("Need at least 2 Troop slots");
    if(tr>6) r.push("Max 6 Troop slots");
    if(el>3) r.push("Max 3 Elite slots");
    if(fa>3) r.push("Max 3 Fast Attack slots");
    if(hs>3) r.push("Max 3 Heavy Support slots");
    if(fl>2) r.push("Max 2 Flyer slots");
    if(lw>1) r.push("Max 1 Lord of War");
    if(totalPts>gameSize) r.push(`Over limit by ${totalPts-gameSize}pts`);
    return r;
  }

  function openAdd() { setSelectedUnit(null); setPendingOpts({}); setPendingPerModel([]); setEditIdx(null); setShowAdd(true); }

  function selectUnit(u) {
    const opts = defaultOpts(u);
    const count = totalModelCount(u, opts);
    setSelectedUnit(u);
    setPendingOpts(opts);
    setPendingPerModel(defaultPerModelOpts(u, count));
  }

  function updateOpts(id, val) {
    setPendingOpts(prev => {
      const next = {...prev, [id]: val};
      // resize perModelOpts if model count changed
      if (selectedUnit?.perModelOptions) {
        const newCount = totalModelCount(selectedUnit, next);
        setPendingPerModel(prev2 => {
          if (prev2.length === newCount) return prev2;
          if (newCount > prev2.length) {
            const extras = defaultPerModelOpts(selectedUnit, newCount - prev2.length);
            return [...prev2, ...extras];
          }
          return prev2.slice(0, newCount);
        });
      }
      return next;
    });
  }

  function updatePerModel(modelIdx, weapId, val) {
    setPendingPerModel(prev => prev.map((m,i) => i===modelIdx ? {...m,[weapId]:val} : m));
  }

  function confirmAdd() {
    if (!selectedUnit) return;
    const cost = calcUnitCost(selectedUnit, pendingOpts, pendingPerModel);
    const summary = buildSummaryLines(selectedUnit, pendingOpts, pendingPerModel);
    const entry = { id: editIdx !== null ? entries[editIdx].id : Date.now(), name: selectedUnit.name, slot: selectedUnit.slot, cost, opts:{...pendingOpts}, perModelOpts:[...pendingPerModel], unitRef: selectedUnit.name, summary };
    if (editIdx !== null) setEntries(prev=>prev.map((e,i)=>i===editIdx?entry:e));
    else setEntries(prev=>[...prev,entry]);
    setShowAdd(false); setSelectedUnit(null); setPendingOpts({}); setPendingPerModel([]); setEditIdx(null);
  }

  function editEntry(idx) {
    const e = entries[idx];
    const u = UNITS.find(u=>u.name===e.unitRef);
    if (!u) return;
    setSelectedUnit(u); setPendingOpts({...e.opts}); setPendingPerModel([...(e.perModelOpts||[])]);
    setEditIdx(idx); setShowAdd(true);
  }

  function removeEntry(idx) { setEntries(prev=>prev.filter((_,i)=>i!==idx)); }

  // ── Save / Load ───────────────────────────────────────────────────
  function saveArmy() {
    const data = { armyName, chapter, gameSize, entries, version:1 };
    const blob = new Blob([JSON.stringify(data,null,2)], {type:"application/json"});
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `${armyName.replace(/[^a-z0-9]/gi,"_")}_army.json`;
    a.click(); URL.revokeObjectURL(url);
  }

  function loadArmy(e) {
    const file = e.target.files?.[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      try {
        const data = JSON.parse(ev.target.result);
        if (data.version && data.entries) {
          setArmyName(data.armyName||"Loaded Army");
          setChapter(data.chapter||"Ultramarines");
          setGameSize(data.gameSize||2000);
          setEntries(data.entries);
        } else { alert("Unrecognised file format."); }
      } catch { alert("Could not read file."); }
    };
    reader.readAsText(file);
    e.target.value = "";
  }

  const pct = Math.min(100, Math.round(totalPts/gameSize*100));
  const overBudget = totalPts > gameSize;
  const nearBudget = !overBudget && totalPts/gameSize > 0.9;
  const filteredUnits = filterSlot==="All" ? UNITS : UNITS.filter(u=>u.slot===filterSlot);
  const currentIssues = issues();
  const currentModelCount = selectedUnit ? totalModelCount(selectedUnit, pendingOpts) : 1;
  const currentCost = selectedUnit ? calcUnitCost(selectedUnit, pendingOpts, pendingPerModel) : 0;
  const modelLabel = (idx) => {
    if (!selectedUnit) return `Model ${idx+1}`;
    const base = selectedUnit.name.replace(/s$/,"").replace(" Squad","");
    if (idx===0 && selectedUnit.minModels>1) return `${base} 1 (Sergeant)`;
    return `${base} ${idx+1}`;
  };

  const C = {
    bg:"#0e1014", surface:"#16191f", surfaceHi:"#1e2229", border:"#2a2e38", borderHi:"#3d4455",
    gold:"#c9a84c", goldDim:"#7a6130", red:"#c0392b", green:"#27ae60", amber:"#d68910",
    textPri:"#e8e0d0", textSec:"#8a8f9e", textDim:"#555b6b",
  };
  const SLOT_ACCENT = {
    HQ:"#4a7fc1", Troop:"#b94040", Elite:"#7a4ab9", "Fast Attack":"#b99340",
    "Heavy Support":"#3a8099", Flyer:"#3a9980", "Ded. Transport":"#994080",
    "Lord of War":"#c06030", Advisor:"#3a9950", Fortification:"#708090",
  };

  const css = `
    @import url('https://fonts.googleapis.com/css2?family=Rajdhani:wght@400;500;600;700&family=Inter:wght@400;500&display=swap');
    * { box-sizing: border-box; }
    body { background: ${C.bg}; margin: 0; }
    ::-webkit-scrollbar { width: 6px; }
    ::-webkit-scrollbar-track { background: ${C.surface}; }
    ::-webkit-scrollbar-thumb { background: ${C.border}; border-radius: 3px; }
    input, select {
      background: ${C.surfaceHi} !important; color: ${C.textPri} !important;
      border: 1px solid ${C.border} !important; border-radius: 6px !important;
      padding: 8px 12px !important; font-size: 15px !important;
      font-family: 'Inter', sans-serif !important; outline: none; transition: border-color 0.15s;
    }
    input:focus, select:focus { border-color: ${C.gold} !important; }
    input[type=checkbox] { width:18px; height:18px; accent-color:${C.gold}; padding:0 !important; cursor:pointer; }
    select option { background: ${C.surface}; }
    button:hover { opacity: 0.85; }
  `;

  const RajFont = { fontFamily:"'Rajdhani', sans-serif" };
  const InterFont = { fontFamily:"'Inter', sans-serif" };

  function Btn({ children, onClick, style={}, gold=false, danger=false, small=false }) {
    return (
      <button onClick={onClick} style={{
        display:"inline-flex", alignItems:"center", gap:6, cursor:"pointer",
        border:`1px solid ${gold ? C.goldDim : danger ? "#7a2020" : C.border}`,
        background: gold ? "linear-gradient(135deg,#2a2010,#1a1508)" : danger ? "#1f0e0e" : C.surfaceHi,
        color: gold ? C.gold : danger ? "#e05050" : C.textSec,
        borderRadius:6, ...RajFont, fontWeight:700,
        fontSize: small ? 13 : 15, letterSpacing:"0.04em", textTransform:"uppercase",
        padding: small ? "5px 12px" : "9px 18px", transition:"opacity 0.15s",
        ...style,
      }}>{children}</button>
    );
  }

  function SlotBadge({ slot }) {
    const accent = SLOT_ACCENT[slot] || "#666";
    return (
      <span style={{
        fontSize:12, fontWeight:700, padding:"2px 8px", borderRadius:3,
        background:`${accent}22`, color:accent, border:`1px solid ${accent}55`,
        ...RajFont, letterSpacing:"0.06em", textTransform:"uppercase", whiteSpace:"nowrap",
      }}>{slot}</span>
    );
  }

  function SectionHead({ children }) {
    return (
      <div style={{ display:"flex", alignItems:"center", gap:10, margin:"20px 0 10px" }}>
        <div style={{height:1, width:12, background:C.goldDim}}/>
        <span style={{...RajFont, fontSize:13, color:C.gold, letterSpacing:"0.12em", textTransform:"uppercase", fontWeight:700}}>{children}</span>
        <div style={{height:1, flex:1, background:C.border}}/>
      </div>
    );
  }

  function StatBar({ used, total }) {
    const p = Math.min(100, Math.round(used/total*100));
    const color = used>total ? C.red : used/total>0.9 ? C.amber : C.green;
    return (
      <div>
        <div style={{display:"flex", justifyContent:"space-between", alignItems:"baseline", marginBottom:5}}>
          <span style={{...RajFont, fontSize:26, fontWeight:700, color: used>total ? C.red : C.gold}}>{used.toLocaleString()}</span>
          <span style={{fontSize:15, color:C.textDim, ...InterFont}}>/ {total.toLocaleString()} pts</span>
        </div>
        <div style={{height:4, background:C.border, borderRadius:2, overflow:"hidden"}}>
          <div style={{height:"100%", width:`${p}%`, background:color, borderRadius:2, transition:"width 0.4s ease"}}/>
        </div>
        {used>total && <div style={{fontSize:14, color:C.red, marginTop:3, ...InterFont}}>⚠ over limit by {used-total} pts</div>}
      </div>
    );
  }

  return (
    <div style={{...InterFont, background:C.bg, minHeight:"100vh", padding:"0 0 60px"}}>
      <style>{css}</style>

      {/* Header */}
      <div style={{
        background:`linear-gradient(180deg,#1a1208 0%,${C.surface} 100%)`,
        borderBottom:`1px solid ${C.goldDim}`,
        padding:"20px 24px 16px",
      }}>
        <div style={{display:"flex", alignItems:"flex-end", justifyContent:"space-between", flexWrap:"wrap", gap:12}}>
          <div>
            <h1 style={{...RajFont, fontSize:34, margin:0, color:C.gold, fontWeight:700, letterSpacing:"0.04em", lineHeight:1}}>
              ⚔ SPACE MARINES
            </h1>
            <div style={{...RajFont, fontSize:14, color:C.textDim, letterSpacing:"0.2em", marginTop:3, textTransform:"uppercase"}}>
              Army List Builder · Alternate 40K Rules
            </div>
          </div>
          <div style={{display:"flex", gap:8}}>
            <Btn gold onClick={saveArmy}><i className="ti ti-download"/>Save army</Btn>
            <Btn onClick={()=>fileInputRef.current?.click()}><i className="ti ti-upload"/>Load army</Btn>
            <input ref={fileInputRef} type="file" accept=".json" style={{display:"none"}} onChange={loadArmy}/>
          </div>
        </div>

        <div style={{display:"flex", gap:16, alignItems:"flex-end", flexWrap:"wrap", marginTop:16}}>
          {[
            {label:"Army name", el:<input style={{width:160}} value={armyName} onChange={e=>setArmyName(e.target.value)}/>},
            {label:"Chapter", el:<select style={{width:170}} value={chapter} onChange={e=>setChapter(e.target.value)}>{CHAPTERS.map(c=><option key={c}>{c}</option>)}</select>},
            {label:"Points limit", el:<input style={{width:90}} type="number" step="250" value={gameSize} onChange={e=>setGameSize(parseInt(e.target.value)||2000)}/>},
          ].map(({label,el})=>(
            <div key={label} style={{display:"flex", flexDirection:"column", gap:4}}>
              <label style={{fontSize:12, color:C.textDim, ...RajFont, letterSpacing:"0.1em", textTransform:"uppercase"}}>{label}</label>
              {el}
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div style={{display:"flex", borderBottom:`1px solid ${C.border}`, background:C.surface, padding:"0 24px"}}>
        {["builder","summary"].map(t=>(
          <button key={t} onClick={()=>setActiveTab(t)} style={{
            padding:"14px 20px", fontSize:14, cursor:"pointer", border:"none", background:"transparent",
            ...RajFont, fontWeight:700, letterSpacing:"0.1em", textTransform:"uppercase",
            color: activeTab===t ? C.gold : C.textDim,
            borderBottom: activeTab===t ? `2px solid ${C.gold}` : "2px solid transparent",
            marginBottom:-1, transition:"color 0.15s",
          }}>
            {t==="builder" ? "List Builder" : "Summary & Compliance"}
          </button>
        ))}
      </div>

      <div style={{padding:"20px 24px"}}>

      {/* Builder tab */}
      {activeTab==="builder" && <>
        <div style={{display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:20, gap:16, flexWrap:"wrap"}}>
          <div style={{flex:1, minWidth:200}}><StatBar used={totalPts} total={gameSize}/></div>
          <Btn gold onClick={openAdd} style={{flexShrink:0}}><i className="ti ti-plus"/>Add unit</Btn>
        </div>

        {sortedEntries.length===0 && (
          <div style={{
            textAlign:"center", padding:"60px 20px",
            border:`1px dashed ${C.border}`, borderRadius:8,
            color:C.textDim, ...RajFont, fontSize:17, letterSpacing:"0.08em",
          }}>NO UNITS MUSTERED — CLICK ADD UNIT TO BEGIN</div>
        )}

        {SLOT_ORDER.filter(slot=>sortedEntries.some(e=>e.slot===slot)).map(slot=>{
          const accent = SLOT_ACCENT[slot]||"#666";
          const limit = SLOT_LIMITS[slot];
          return (
            <div key={slot} style={{marginBottom:4}}>
              <div style={{display:"flex", alignItems:"center", gap:10, margin:"18px 0 8px"}}>
                <div style={{height:2, width:4, background:accent, borderRadius:1}}/>
                <span style={{...RajFont, fontWeight:700, fontSize:13, color:accent, letterSpacing:"0.14em", textTransform:"uppercase"}}>
                  {slot}
                  {limit[1]!=null && <span style={{color:C.textDim, marginLeft:6, fontWeight:400}}>({slotCounts[slot]||0}/{limit[1]})</span>}
                </span>
                <div style={{flex:1, height:1, background:C.border}}/>
              </div>
              {sortedEntries.filter(e=>e.slot===slot).map(entry=>{
                const realIdx = entries.indexOf(entry);
                return (
                  <div key={entry.id} style={{
                    display:"flex", alignItems:"flex-start", gap:10,
                    padding:"10px 14px", marginBottom:4, borderRadius:6,
                    background:C.surface, border:`1px solid ${C.border}`,
                    borderLeft:`3px solid ${accent}`,
                  }}>
                    <div style={{flex:1, minWidth:0}}>
                      <div style={{display:"flex", alignItems:"baseline", gap:10}}>
                        <span style={{...RajFont, fontSize:18, fontWeight:600, color:C.textPri}}>{entry.name}</span>
                        <span style={{...RajFont, fontSize:17, fontWeight:700, color:C.gold, marginLeft:"auto", whiteSpace:"nowrap"}}>{entry.cost} pts</span>
                      </div>
                      {entry.summary?.length>0 && (
                        <div style={{fontSize:14, color:C.textSec, marginTop:4, ...InterFont, lineHeight:1.7}}>
                          {entry.summary.join(" · ")}
                        </div>
                      )}
                    </div>
                    <button title="Edit" onClick={()=>editEntry(realIdx)} style={{background:"none",border:"none",cursor:"pointer",color:C.textDim,fontSize:20,padding:"4px 6px",flexShrink:0,transition:"color 0.15s"}} onMouseEnter={e=>e.currentTarget.style.color=C.gold} onMouseLeave={e=>e.currentTarget.style.color=C.textDim}>
                      <i className="ti ti-edit"/>
                    </button>
                    <button title="Remove" onClick={()=>removeEntry(realIdx)} style={{background:"none",border:"none",cursor:"pointer",color:C.textDim,fontSize:20,padding:"4px 6px",flexShrink:0,transition:"color 0.15s"}} onMouseEnter={e=>e.currentTarget.style.color=C.red} onMouseLeave={e=>e.currentTarget.style.color=C.textDim}>
                      <i className="ti ti-trash"/>
                    </button>
                  </div>
                );
              })}
            </div>
          );
        })}

        {sortedEntries.length>0 && (
          <div style={{
            marginTop:24, padding:"14px 18px", borderRadius:6,
            background:`linear-gradient(135deg,${C.surface},#1a1508)`,
            border:`1px solid ${C.goldDim}`,
            display:"flex", justifyContent:"space-between", alignItems:"center",
          }}>
            <span style={{...RajFont, fontWeight:700, fontSize:16, color:C.textSec, letterSpacing:"0.1em"}}>TOTAL POINTS</span>
            <span style={{...RajFont, fontWeight:700, fontSize:26, color: overBudget ? C.red : C.gold}}>
              {totalPts.toLocaleString()} <span style={{fontSize:14, color:C.textDim}}>/ {gameSize.toLocaleString()}</span>
            </span>
          </div>
        )}
      </>}

      {/* Summary tab */}
      {activeTab==="summary" && <>
        {currentIssues.length===0
          ? <div style={{display:"flex", alignItems:"center", gap:8, padding:"12px 16px", borderRadius:6, background:"#0d1f14", border:"1px solid #1e5e30", color:C.green, fontSize:15, marginBottom:16, ...InterFont}}>
              <i className="ti ti-shield-check" style={{fontSize:18}}/> Army list is legal and within points limit
            </div>
          : <div style={{padding:"12px 16px", borderRadius:6, background:"#1f0d0d", border:"1px solid #5e1e1e", color:"#e05050", fontSize:15, marginBottom:16, ...InterFont}}>
              {currentIssues.map((is,i)=><div key={i} style={{display:"flex",alignItems:"center",gap:6}}><i className="ti ti-alert-triangle" style={{fontSize:16}}/>{is}</div>)}
            </div>
        }

        <div style={{display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(110px,1fr))", gap:8, marginBottom:20}}>
          {SLOT_ORDER.filter(sl=>SLOT_LIMITS[sl][0]!=null).map(slot=>{
            const count=slotCounts[slot]||0, [mn,mx]=SLOT_LIMITS[slot], ok=count>=(mn||0)&&count<=(mx||99);
            const accent = SLOT_ACCENT[slot]||"#666";
            return (
              <div key={slot} style={{background:C.surface, borderRadius:6, padding:"10px 12px", border:`1px solid ${ok ? C.border : "#5e1e1e"}`, borderTop:`2px solid ${ok ? accent : C.red}`}}>
                <div style={{fontSize:12, color:C.textDim, ...RajFont, letterSpacing:"0.1em", textTransform:"uppercase", marginBottom:4}}>{slot}</div>
                <div style={{...RajFont, fontWeight:700, fontSize:24, color: ok ? accent : C.red}}>{count}</div>
                <div style={{fontSize:13, color:C.textDim, ...InterFont}}>{mn}–{mx}</div>
              </div>
            );
          })}
        </div>

        <div style={{background:C.surface, borderRadius:8, border:`1px solid ${C.border}`, overflow:"hidden"}}>
          <div style={{padding:"14px 18px", borderBottom:`1px solid ${C.border}`, background:`linear-gradient(135deg,${C.surface},#1a1508)`}}>
            <div style={{...RajFont, fontWeight:700, fontSize:22, color:C.gold}}>{armyName}</div>
            <div style={{fontSize:14, color:C.textDim, ...InterFont, marginTop:2}}>{chapter} · {gameSize.toLocaleString()} pts game</div>
          </div>
          {SLOT_ORDER.filter(slot=>sortedEntries.some(e=>e.slot===slot)).map(slot=>(
            <div key={slot}>
              <div style={{padding:"7px 18px", background:C.surfaceHi, borderBottom:`1px solid ${C.border}`}}>
                <span style={{...RajFont, fontWeight:700, fontSize:13, color:SLOT_ACCENT[slot]||C.textDim, letterSpacing:"0.12em", textTransform:"uppercase"}}>{slot}</span>
              </div>
              {sortedEntries.filter(e=>e.slot===slot).map((entry,i,arr)=>(
                <div key={entry.id} style={{padding:"10px 18px", borderBottom:i<arr.length-1?`1px solid ${C.border}`:"none"}}>
                  <div style={{display:"flex", justifyContent:"space-between", alignItems:"baseline"}}>
                    <span style={{...RajFont, fontWeight:600, fontSize:17, color:C.textPri}}>{entry.name}</span>
                    <span style={{...RajFont, fontWeight:700, fontSize:16, color:C.gold}}>{entry.cost} pts</span>
                  </div>
                  {entry.summary?.length>0 && <div style={{fontSize:14, color:C.textSec, marginTop:3, ...InterFont, lineHeight:1.6}}>{entry.summary.join(" · ")}</div>}
                </div>
              ))}
            </div>
          ))}
          <div style={{padding:"14px 18px", borderTop:`1px solid ${C.goldDim}`, background:`linear-gradient(135deg,${C.surface},#1a1508)`, display:"flex", justifyContent:"space-between", alignItems:"baseline"}}>
            <span style={{...RajFont, fontWeight:700, fontSize:15, color:C.textSec, letterSpacing:"0.1em"}}>TOTAL</span>
            <span style={{...RajFont, fontWeight:700, fontSize:24, color: overBudget ? C.red : C.gold}}>{totalPts.toLocaleString()} pts</span>
          </div>
        </div>
      </>}

      {/* Add / Edit panel */}
      {showAdd && (
        <div style={{
          marginTop:20, background:C.surface, borderRadius:8,
          border:`1px solid ${C.borderHi}`, borderTop:`2px solid ${C.gold}`,
          overflow:"hidden",
        }}>
          <div style={{
            display:"flex", justifyContent:"space-between", alignItems:"center",
            padding:"14px 18px", borderBottom:`1px solid ${C.border}`,
            background:`linear-gradient(135deg,${C.surface},#1a1508)`,
          }}>
            <span style={{...RajFont, fontWeight:700, fontSize:20, color:C.gold, letterSpacing:"0.06em"}}>
              {editIdx!==null ? "EDIT UNIT" : "ADD UNIT"}
            </span>
            <button onClick={()=>{setShowAdd(false);setSelectedUnit(null);}} style={{background:"none",border:"none",cursor:"pointer",color:C.textDim,fontSize:22,padding:4}}>
              <i className="ti ti-x"/>
            </button>
          </div>

          <div style={{padding:"16px 18px"}}>

          {/* Unit picker */}
          {!selectedUnit && <>
            <div style={{display:"flex", gap:6, flexWrap:"wrap", marginBottom:14}}>
              {["All",...SLOT_ORDER].map(sl=>{
                const active = filterSlot===sl;
                const accent = sl==="All" ? C.gold : (SLOT_ACCENT[sl]||C.textDim);
                return (
                  <button key={sl} onClick={()=>setFilterSlot(sl)} style={{
                    padding:"5px 12px", borderRadius:4,
                    border:`1px solid ${active ? accent : C.border}`,
                    background: active ? `${accent}22` : "transparent",
                    color: active ? accent : C.textDim, cursor:"pointer",
                    ...RajFont, fontWeight:700, fontSize:13,
                    letterSpacing:"0.06em", textTransform:"uppercase",
                  }}>{sl}</button>
                );
              })}
            </div>
            <div style={{maxHeight:460, overflowY:"auto", display:"flex", flexDirection:"column", gap:4}}>
              {filteredUnits.map(u=>{
                const accent = SLOT_ACCENT[u.slot]||"#666";
                return (
                  <div key={u.name} onClick={()=>selectUnit(u)} style={{
                    padding:"10px 14px", borderRadius:6, cursor:"pointer",
                    background:C.surfaceHi, border:`1px solid ${C.border}`,
                    borderLeft:`3px solid ${accent}44`,
                    transition:"all 0.15s",
                  }}
                  onMouseEnter={e=>{e.currentTarget.style.borderLeftColor=accent;e.currentTarget.style.background="#232830";}}
                  onMouseLeave={e=>{e.currentTarget.style.borderLeftColor=`${accent}44`;e.currentTarget.style.background=C.surfaceHi;}}>
                    <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", gap:8, flexWrap:"wrap"}}>
                      <div style={{display:"flex", alignItems:"center", gap:8}}>
                        <SlotBadge slot={u.slot}/>
                        <span style={{...RajFont, fontWeight:600, fontSize:17, color:C.textPri}}>{u.name}</span>
                        {u.perModelOptions && (
                          <span style={{fontSize:12, color:"#4a9fd4", border:"1px solid #4a9fd455", borderRadius:3, padding:"2px 6px", ...RajFont, letterSpacing:"0.06em", fontWeight:700}}>PER-MODEL</span>
                        )}
                      </div>
                      <span style={{...RajFont, fontWeight:700, fontSize:16, color:C.gold, whiteSpace:"nowrap"}}>{u.basePts} pts</span>
                    </div>
                    <div style={{fontSize:13, color:C.textDim, marginTop:4, ...InterFont}}>{u.notes}</div>
                  </div>
                );
              })}
            </div>
          </>}

          {/* Configurator */}
          {selectedUnit && <>
            <div style={{display:"flex", alignItems:"center", gap:10, marginBottom:12, flexWrap:"wrap"}}>
              <SlotBadge slot={selectedUnit.slot}/>
              <span style={{...RajFont, fontWeight:700, fontSize:20, color:C.textPri}}>{selectedUnit.name}</span>
              <button onClick={()=>{setSelectedUnit(null);setPendingOpts({});setPendingPerModel([]);}} style={{
                background:"none", border:"none", cursor:"pointer", color:C.textDim,
                ...RajFont, fontSize:12, letterSpacing:"0.06em", fontWeight:700, textTransform:"uppercase",
                display:"flex", alignItems:"center", gap:4, marginLeft:"auto",
              }}>
                <i className="ti ti-arrow-left"/>Back
              </button>
            </div>

            {selectedUnit.statline && (
              <div style={{
                padding:"7px 12px", marginBottom:8, borderRadius:4,
                background:C.surfaceHi, border:`1px solid ${C.border}`,
                ...RajFont, fontSize:14, color:C.textSec, letterSpacing:"0.04em",
              }}>
                <span style={{color:C.textDim, marginRight:6}}>STATS</span>{selectedUnit.statline}
              </div>
            )}
            <div style={{fontSize:14, color:C.textDim, marginBottom:2, ...InterFont}}>
              <strong style={{color:C.textSec}}>Base wargear:</strong> {selectedUnit.baseWargear}
            </div>
            <div style={{fontSize:14, color:C.textDim, marginBottom:14, ...InterFont}}>{selectedUnit.notes}</div>

            {selectedUnit.options.length>0 && <>
              <SectionHead>Unit options</SectionHead>
              {selectedUnit.options.map(opt=>(
                <div key={opt.id} style={{marginBottom:10}}>
                  {opt.type==="toggle" && (
                    <label style={{
                      display:"flex", alignItems:"flex-start", gap:10, cursor:"pointer",
                      padding:"9px 12px", borderRadius:5,
                      border:`1px solid ${pendingOpts[opt.id] ? C.goldDim : C.border}`,
                      background: pendingOpts[opt.id] ? `${C.goldDim}22` : C.surfaceHi,
                      transition:"all 0.15s",
                    }}>
                      <input type="checkbox" checked={!!pendingOpts[opt.id]} onChange={e=>updateOpts(opt.id,e.target.checked)} style={{marginTop:1}}/>
                      <div style={{flex:1}}>
                        <span style={{...InterFont, fontSize:15, color:C.textPri}}>{opt.label}</span>
                        <span style={{...RajFont, fontWeight:700, color:C.gold, marginLeft:8, fontSize:15}}>+{opt.pts} pts</span>
                        {opt.note && <div style={{fontSize:13, color:C.textDim, marginTop:2, ...InterFont}}>{opt.note}</div>}
                      </div>
                    </label>
                  )}
                  {opt.type==="number" && (
                    <div>
                      <label style={{fontSize:13, color:C.textSec, ...RajFont, fontWeight:700, letterSpacing:"0.06em", textTransform:"uppercase", display:"block", marginBottom:6}}>
                        {opt.label} {opt.ptsEach!==0 && <span style={{color:C.gold}}>+{opt.ptsEach} pts each</span>}
                      </label>
                      <input type="number" min={opt.min||0} max={opt.max||99} value={pendingOpts[opt.id]||0}
                        onChange={e=>updateOpts(opt.id,Math.max(opt.min||0,Math.min(opt.max||99,parseInt(e.target.value)||0)))}
                        style={{width:90}}/>
                      {opt.note && <div style={{fontSize:13, color:C.textDim, marginTop:4, ...InterFont}}>{opt.note}</div>}
                    </div>
                  )}
                  {opt.type==="select" && (
                    <div>
                      <label style={{fontSize:13, color:C.textSec, ...RajFont, fontWeight:700, letterSpacing:"0.06em", textTransform:"uppercase", display:"block", marginBottom:6}}>{opt.label}</label>
                      <select value={pendingOpts[opt.id]||opt.choices[0].label} onChange={e=>updateOpts(opt.id,e.target.value)} style={{width:"100%",maxWidth:460}}>
                        {opt.choices.map(c=><option key={c.label} value={c.label}>{c.label}{c.pts>0?` [+${c.pts}pts]`:c.pts<0?` [${c.pts}pts]`:""}</option>)}
                      </select>
                    </div>
                  )}
                </div>
              ))}
            </>}

            {selectedUnit.perModelOptions && selectedUnit.perModelWeapons && pendingPerModel.length>0 && <>
              <SectionHead>Per-model weapons — {currentModelCount} model{currentModelCount!==1?"s":""}</SectionHead>
              <div style={{display:"flex", flexDirection:"column", gap:8}}>
                {Array.from({length:currentModelCount},(_,i)=>(
                  <div key={i} style={{
                    padding:"12px 14px", borderRadius:6,
                    background:C.surfaceHi, border:`1px solid ${C.border}`,
                    borderLeft:`3px solid ${C.goldDim}`,
                  }}>
                    <div style={{...RajFont, fontWeight:700, fontSize:15, color:C.gold, marginBottom:10, letterSpacing:"0.06em"}}>
                      {modelLabel(i).toUpperCase()}
                    </div>
                    {selectedUnit.perModelWeapons.map(wep=>(
                      <div key={wep.id} style={{marginBottom:8}}>
                        <label style={{fontSize:13, color:C.textSec, ...RajFont, fontWeight:700, letterSpacing:"0.06em", textTransform:"uppercase", display:"block", marginBottom:5}}>{wep.label}</label>
                        <select value={pendingPerModel[i]?.[wep.id]||wep.choices[0].label} onChange={e=>updatePerModel(i,wep.id,e.target.value)} style={{width:"100%",maxWidth:400}}>
                          {wep.choices.map(c=><option key={c.label} value={c.label}>{c.label}</option>)}
                        </select>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </>}

            <div style={{
              display:"flex", justifyContent:"space-between", alignItems:"center",
              padding:"12px 16px", marginTop:16, borderRadius:6,
              background:`linear-gradient(135deg,${C.surface},#1a1508)`,
              border:`1px solid ${C.goldDim}`,
            }}>
              <span style={{...RajFont, fontWeight:700, fontSize:15, color:C.textSec, letterSpacing:"0.1em"}}>UNIT TOTAL</span>
              <span style={{...RajFont, fontWeight:700, fontSize:28, color:C.gold}}>{currentCost} pts</span>
            </div>
            <Btn gold onClick={confirmAdd} style={{width:"100%", justifyContent:"center", marginTop:10, fontSize:16, padding:"14px 16px"}}>
              <i className={`ti ti-${editIdx!==null?"device-floppy":"circle-plus"}`}/>
              {editIdx!==null ? "Save changes" : "Add to army"}
            </Btn>
          </>}
          </div>
        </div>
      )}

      </div>
    </div>
  );
}
