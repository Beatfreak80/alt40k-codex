#!/usr/bin/env node
/**
 * join-faction.cjs — Assemble a faction JSON from numbered sub-files
 *
 * Usage:
 *   node join-faction.cjs public/orks
 *   node join-faction.cjs public/orks --dry-run
 *
 * Reads all files matching [0-9][0-9]-*.json inside the given directory,
 * sorted numerically, and merges them into a single faction JSON written to
 * public/<faction-id>_faction.json (derived from faction.id in 01-meta.json).
 *
 * Merge rules:
 *   - Arrays (armyRules, commonWargear, units, …): concatenated in file order
 *   - Objects (namedUpgrades, weaponLists, spellPools, faction): shallow-merged
 *   - Scalars (schemaVersion): first file wins
 *
 * Run node postprocess.cjs on the output file afterwards.
 */

const fs   = require('fs');
const path = require('path');

// ── Args ─────────────────────────────────────────────────────────────────────
const args    = process.argv.slice(2);
const dryRun  = args.includes('--dry-run');
const dirArg  = args.find(a => !a.startsWith('--'));
if (!dirArg) die('Usage: node join-faction.cjs public/<faction-dir> [--dry-run]');

const ROOT   = __dirname;
const srcDir = path.resolve(ROOT, dirArg);
if (!fs.existsSync(srcDir)) die(`Directory not found: ${srcDir}`);

// ── Helpers ───────────────────────────────────────────────────────────────────
function die(msg) { console.error('ERROR:', msg); process.exit(1); }
function load(p) {
  try { return JSON.parse(fs.readFileSync(p, 'utf8')); }
  catch (e) { die(`Cannot parse ${path.basename(p)}: ${e.message}`); }
}

// ── Find numbered sub-files ───────────────────────────────────────────────────
const files = fs.readdirSync(srcDir)
  .filter(f => /^\d{2}-.*\.json$/.test(f))
  .sort()
  .map(f => path.join(srcDir, f));

if (files.length === 0) die(`No numbered JSON files (e.g. 01-meta.json) found in ${srcDir}`);

console.log('════════════════════════════════════════════════════════════');
console.log(` JOIN-FACTION — ${path.basename(srcDir)}`);
console.log('════════════════════════════════════════════════════════════');
console.log(`Found ${files.length} sub-file(s):`);
files.forEach(f => console.log(`  ${path.basename(f)}`));
console.log('');

// ── Merge ─────────────────────────────────────────────────────────────────────
// Top-level keys whose values should be concatenated (arrays)
const ARRAY_KEYS = new Set(['armyRules', 'commonWargear', 'units']);
// Top-level keys whose values should be shallow-merged (objects)
const OBJECT_KEYS = new Set(['namedUpgrades', 'weaponLists', 'spellPools', 'faction']);

const merged = {};
const counts = {};

for (const filePath of files) {
  const chunk = load(filePath);
  const label = path.basename(filePath);
  for (const [key, val] of Object.entries(chunk)) {
    if (ARRAY_KEYS.has(key)) {
      if (!Array.isArray(val)) die(`${label}: expected "${key}" to be an array`);
      merged[key] = (merged[key] || []).concat(val);
      counts[key] = (counts[key] || 0) + val.length;
    } else if (OBJECT_KEYS.has(key)) {
      if (typeof val !== 'object' || Array.isArray(val)) die(`${label}: expected "${key}" to be an object`);
      merged[key] = Object.assign(merged[key] || {}, val);
    } else {
      // Scalar — first file wins
      if (!(key in merged)) merged[key] = val;
    }
  }
}

// ── Derive output path from faction.id ────────────────────────────────────────
const factionId = merged.faction && merged.faction.id;
if (!factionId) die('No faction.id found — make sure 01-meta.json contains "faction": { "id": "..." }');

const outPath = path.join(ROOT, 'public', `${factionId}_faction.json`);

// ── Report ────────────────────────────────────────────────────────────────────
console.log('Merge summary:');
for (const [key, count] of Object.entries(counts)) {
  console.log(`  ${key}: ${count} item(s)`);
}
for (const key of Object.keys(OBJECT_KEYS)) {
  if (merged[key]) {
    const n = Object.keys(merged[key]).length;
    if (n) console.log(`  ${key}: ${n} key(s)`);
  }
}
console.log('');
console.log(`Output: ${path.relative(ROOT, outPath)}`);

if (dryRun) {
  console.log('[DRY RUN] No file written.');
  process.exit(0);
}

// ── Write ─────────────────────────────────────────────────────────────────────
fs.writeFileSync(outPath, JSON.stringify(merged, null, 2), 'utf8');
console.log('[WRITE] Done. Run postprocess next:');
console.log(`  node postprocess.cjs public/${factionId}_faction.json`);
