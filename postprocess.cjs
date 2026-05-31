#!/usr/bin/env node
/**
 * postprocess.cjs — Alternate 40k faction JSON post-processor
 *
 * Usage:
 *   node postprocess.cjs public/eldar_faction.json
 *   node postprocess.cjs public/eldar_faction.json --dry-run
 *
 * Does three things, all locally and for free:
 *   1. CLEAN  — strips null/empty fields per schema §12
 *   2. NORM   — normalises weapon rule strings to core-rule IDs via rule-map.json
 *   3. VALID  — validates all cross-references and reports anything needing manual attention
 */

const fs   = require('fs');
const path = require('path');

// ── Config ────────────────────────────────────────────────────────────────────
const ROOT        = __dirname;
const CORE_PATH   = path.join(ROOT, 'public/core-rules.json');
const MAP_PATH    = path.join(ROOT, 'rule-map.json');

// Weapon rule patterns handled procedurally (any numeric suffix)
const RULE_PATTERNS = [
  [/^Assault\s+\d[\d\s(x×*]*$/i,      'assault'],
  [/^Heavy\s+\d[\d\s(x×*]*$/i,        'heavy'],
  [/^Rapid\s+Fire\s+\d[\d\s(x×*]*$/i, 'rapid-fire'],
  [/^Pistol\s+\d[\d\s(x×*]*$/i,       'pistol'],
  [/^Grenade\s+\d[\d\s(x×*]*$/i,      'grenade'],
];

// ── Helpers ───────────────────────────────────────────────────────────────────
function load(p) {
  try { return JSON.parse(fs.readFileSync(p, 'utf8')); }
  catch (e) { die(`Cannot read ${p}: ${e.message}`); }
}
function die(msg) { console.error('ERROR:', msg); process.exit(1); }
function fmt(n) { return String(n).padStart(4); }

// ── 1. CLEAN — strip null/empty fields ───────────────────────────────────────
function stripNulls(obj) {
  if (Array.isArray(obj)) return obj.map(stripNulls).filter(v => v !== null && v !== undefined);
  if (obj === null || obj === undefined) return undefined;
  if (typeof obj !== 'object') return obj;
  const out = {};
  for (const [k, v] of Object.entries(obj)) {
    // Always keep required identity fields even if falsy
    const required = ['id','name','slot','type','schemaVersion'];
    if (required.includes(k)) { out[k] = v; continue; }
    // Omit null / undefined / false / empty array
    if (v === null || v === undefined) continue;
    if (v === false) continue;
    if (Array.isArray(v) && v.length === 0) continue;
    // Omit empty object
    if (typeof v === 'object' && !Array.isArray(v) && Object.keys(v).length === 0) continue;
    // Recurse
    const cleaned = stripNulls(v);
    if (cleaned !== undefined) out[k] = cleaned;
  }
  return out;
}

function countNulls(obj) {
  if (obj === null || obj === undefined || obj === false) return 1;
  if (Array.isArray(obj)) return obj.reduce((n, v) => n + countNulls(v), 0);
  if (typeof obj !== 'object') return 0;
  let n = 0;
  for (const [k, v] of Object.entries(obj)) {
    if (v === null || v === undefined || v === false) n++;
    else if (Array.isArray(v) && v.length === 0) n++;
    else if (typeof v === 'object' && !Array.isArray(v) && Object.keys(v).length === 0) n++;
    else n += countNulls(v);
  }
  return n;
}

// ── 2. NORM — normalise weapon rule strings ───────────────────────────────────
function normaliseRule(str, coreIds, ruleMap) {
  if (coreIds.has(str)) return { id: str, changed: false };         // already a core ID
  if (ruleMap[str])     return { id: ruleMap[str], changed: true }; // exact map hit
  for (const [pat, id] of RULE_PATTERNS)
    if (pat.test(str))  return { id, changed: true };               // pattern match
  return { id: str, changed: false };                               // unmapped, keep as-is
}

function normaliseWeapons(weapons, coreIds, ruleMap) {
  // Weapon profile rules are intentionally kept as display strings (per schema spec).
  // This function only reports unmapped strings for informational purposes; it does
  // NOT modify p.rules.
  const mapped = {};
  const unmapped = {};

  for (const w of weapons) {
    for (const p of (w.profiles || [])) {
      if (!p.rules) continue;
      for (const r of p.rules) {
        const { id, changed } = normaliseRule(r, coreIds, ruleMap);
        if (changed) mapped[r] = id;
        if (!coreIds.has(id)) unmapped[r] = (unmapped[r] || 0) + 1;
      }
    }
  }
  return { mapped, unmapped };
}

// ── 3. VALID — check all cross-references ────────────────────────────────────
function validate(d, coreIds) {
  const errors   = [];
  const warnings = [];

  const wepIds     = new Set(d.commonWargear.map(w => w.id));
  const armyIds    = new Set((d.armyRules || []).map(r => r.id));
  const spellIds   = new Set(Object.keys(d.spellPools || {}));
  const upgradeIds = new Set(Object.keys(d.namedUpgrades || {}));
  const listIds    = new Set(Object.keys(d.weaponLists || {}));
  const unitIds    = new Set();

  // Duplicate weapon IDs
  const wepSeen = {};
  for (const w of d.commonWargear) {
    if (wepSeen[w.id]) errors.push(`Duplicate weapon id: "${w.id}"`);
    wepSeen[w.id] = true;
  }

  for (const u of (d.units || [])) {
    // Duplicate unit IDs
    if (unitIds.has(u.id)) errors.push(`Duplicate unit id: "${u.id}"`);
    unitIds.add(u.id);

    const inlineIds = new Set((u.inlineRules || []).map(r => r.id));
    const keywordIds = new Set((d.factionKeywords || []).map(k => k.id));
    const allRuleIds = new Set([...coreIds, ...armyIds, ...inlineIds, ...keywordIds]);

    for (const m of (u.models || [])) {
      // Base wargear weapon refs
      for (const ref of (m.baseWargear || [])) {
        const wid = typeof ref === 'string' ? ref : ref.weaponId;
        if (wid && !wepIds.has(wid))
          errors.push(`${u.name}/${m.name} baseWargear → unknown weapon "${wid}"`);
      }
      // Special rules
      for (const r of (m.specialRules || [])) {
        if (!allRuleIds.has(r))
          warnings.push(`${u.name}/${m.name} specialRules → unknown rule "${r}"`);
      }
    }

    // Options
    for (const o of (u.options || [])) {
      if (o.type === 'spellPick' && o.spellPoolId && !spellIds.has(o.spellPoolId))
        errors.push(`${u.name} option "${o.id}" → unknown spellPool "${o.spellPoolId}"`);
      if (o.type === 'namedUpgrade' && !upgradeIds.has(o.upgradeId))
        errors.push(`${u.name} option "${o.id}" → unknown namedUpgrade "${o.upgradeId}"`);
      if (o.weaponListId && !listIds.has(o.weaponListId))
        errors.push(`${u.name} option "${o.id}" → unknown weaponList "${o.weaponListId}"`);
      for (const c of (o.choices || [])) {
        if (c.weaponId && !wepIds.has(c.weaponId))
          errors.push(`${u.name} option "${o.id}" choice → unknown weapon "${c.weaponId}"`);
      }
    }

    // Psychic spell pool ref
    if (u.psychic?.spellPoolId && !spellIds.has(u.psychic.spellPoolId))
      errors.push(`${u.name} psychic.spellPoolId → unknown pool "${u.psychic.spellPoolId}"`);

    // chapterRestriction must match a subfaction id
    if (u.chapterRestriction) {
      const sfIds = new Set((d.faction.subfactions || []).map(s => s.id));
      if (!sfIds.has(u.chapterRestriction))
        warnings.push(`${u.name} chapterRestriction "${u.chapterRestriction}" has no matching subfaction`);
    }

    // Platoon sub-units — validate weapon and rule refs the same way as top-level units
    for (const pu of (u.platoonUnits || [])) {
      const puInlineIds = new Set((pu.inlineRules || []).map(r => r.id));
      const puAllRuleIds = new Set([...coreIds, ...armyIds, ...puInlineIds, ...keywordIds]);
      for (const m of (pu.models || [])) {
        for (const ref of (m.baseWargear || [])) {
          const wid = typeof ref === 'string' ? ref : ref.weaponId;
          if (wid && !wepIds.has(wid))
            errors.push(`${u.name}/${pu.name}/${m.name} baseWargear → unknown weapon "${wid}"`);
        }
        for (const r of (m.specialRules || [])) {
          if (!puAllRuleIds.has(r))
            warnings.push(`${u.name}/${pu.name}/${m.name} specialRules → unknown rule "${r}"`);
        }
      }
      for (const o of (pu.options || [])) {
        if (o.type === 'namedUpgrade' && !upgradeIds.has(o.upgradeId))
          errors.push(`${u.name}/${pu.name} option "${o.id}" → unknown namedUpgrade "${o.upgradeId}"`);
        if (o.weaponListId && !listIds.has(o.weaponListId))
          errors.push(`${u.name}/${pu.name} option "${o.id}" → unknown weaponList "${o.weaponListId}"`);
        for (const c of (o.choices || [])) {
          if (c.weaponId && !wepIds.has(c.weaponId))
            errors.push(`${u.name}/${pu.name} option "${o.id}" choice → unknown weapon "${c.weaponId}"`);
        }
      }
    }
  }

  return { errors, warnings };
}

// ── Main ──────────────────────────────────────────────────────────────────────
const args    = process.argv.slice(2).filter(a => !a.startsWith('--'));
const flags   = process.argv.slice(2).filter(a => a.startsWith('--'));
const dryRun  = flags.includes('--dry-run');
const filePath = args[0];

if (!filePath) die('Usage: node postprocess.cjs <faction-file.json> [--dry-run]');
if (!fs.existsSync(filePath)) die(`File not found: ${filePath}`);

const coreData  = load(CORE_PATH);
const ruleMap   = load(MAP_PATH);
const faction   = load(filePath);

// Strip the _comment key from ruleMap
delete ruleMap._comment;

const coreRules = coreData.rules || coreData;
const coreIds   = new Set(coreRules.map(r => r.id));

const label = path.basename(filePath);
console.log(`\n${'═'.repeat(60)}`);
console.log(` POSTPROCESSOR — ${label}`);
console.log(`${'═'.repeat(60)}\n`);

// ── Phase 1: Clean ─────────────────────────────────────────────────────────
const nullsBefore = countNulls(faction);
const cleaned     = stripNulls(faction);
const nullsAfter  = countNulls(cleaned);
const stripped    = nullsBefore - nullsAfter;
console.log(`[CLEAN] Stripped ${stripped} null/empty/false fields`);

// ── Phase 2: Normalise ─────────────────────────────────────────────────────
const { mapped, unmapped } = normaliseWeapons(cleaned.commonWargear || [], coreIds, ruleMap);
const mappedCount = Object.keys(mapped).length;

if (mappedCount > 0) {
  console.log(`[NORM]  ${mappedCount} weapon rule string(s) have core ID equivalents (kept as display strings):`);
  for (const [from, to] of Object.entries(mapped))
    console.log(`          "${from}" (core: "${to}")`);
} else {
  console.log('[NORM]  All weapon rules are display strings with no core ID conflicts');
}

const unmappedCount = Object.keys(unmapped).length;
if (unmappedCount > 0) {
  console.log(`[NORM]  ${unmappedCount} string(s) have no core ID (kept as readable text):`);
  for (const [s, n] of Object.entries(unmapped))
    console.log(`          "${s}" (×${n})`);
}

// ── Phase 3: Validate ──────────────────────────────────────────────────────
const { errors, warnings } = validate(cleaned, coreIds);

if (errors.length === 0 && warnings.length === 0) {
  console.log('[VALID] All references OK ✓');
} else {
  if (errors.length) {
    console.log(`[VALID] ${errors.length} ERROR(S) — must fix manually:`);
    errors.forEach(e => console.log(`          ✗ ${e}`));
  }
  if (warnings.length) {
    console.log(`[VALID] ${warnings.length} WARNING(S):`);
    warnings.forEach(w => console.log(`          ⚠ ${w}`));
  }
}

// ── Summary ────────────────────────────────────────────────────────────────
console.log('');
console.log(`  Units:    ${fmt((cleaned.units||[]).length)}`);
console.log(`  Weapons:  ${fmt((cleaned.commonWargear||[]).length)}`);
console.log(`  ArmyRules:${fmt((cleaned.armyRules||[]).length)}`);
console.log('');

if (dryRun) {
  console.log('[DRY-RUN] No file written.\n');
} else if (errors.length === 0) {
  fs.writeFileSync(filePath, JSON.stringify(cleaned, null, 2));
  console.log(`[WRITE] ${filePath} updated.\n`);
} else {
  console.log(`[WRITE] Skipped — fix errors above first.\n`);
}

process.exit(errors.length > 0 ? 1 : 0);
