#!/usr/bin/env node
/**
 * One-shot script: convert flat IG weapon definitions to profiles-array format.
 * Reads public/imperial-guard/03-common-wargear.json, converts in-place.
 */
const fs = require('fs');
const path = require('path');

const FILE = path.join(__dirname, 'public/imperial-guard/03-common-wargear.json');
const data = JSON.parse(fs.readFileSync(FILE, 'utf8'));

function parseRange(range) {
  // Returns { maxRange, minRange?, templateType? }
  if (range === null || range === undefined || range === "-" || range === "Melee") {
    return { maxRange: null };
  }
  if (range === "Flame")     return { templateType: "Flame",     maxRange: null };
  if (range === "Hellstorm") return { templateType: "Hellstorm", maxRange: null };
  if (range === "Bomb")      return { templateType: "Bomb",       maxRange: null };

  if (typeof range === "number") return { maxRange: range };

  // String range like "12-48", "6-24", "24-240" etc.
  const m = String(range).match(/^(\d+)[\s\-–]+(\d+)$/);
  if (m) return { minRange: Number(m[1]), maxRange: Number(m[2]) };

  // Plain number string
  const n = Number(range);
  if (!isNaN(n)) return { maxRange: n };

  // Fallback: keep as-is in maxRange
  return { maxRange: range };
}

function convertWeapon(w) {
  // Already has profiles array — leave it alone
  if (Array.isArray(w.profiles)) return w;

  const rangeInfo = parseRange(w.range);
  const profile = {
    ...( rangeInfo.minRange != null ? { minRange: rangeInfo.minRange } : {} ),
    maxRange: rangeInfo.maxRange,
    strength: w.strength !== undefined ? String(w.strength) : undefined,
    ap: w.ap,
    rules: w.rules,
  };
  // Strip undefined from profile
  Object.keys(profile).forEach(k => { if (profile[k] === undefined) delete profile[k]; });

  const converted = { id: w.id, name: w.name };
  if (rangeInfo.templateType) converted.templateType = rangeInfo.templateType;
  converted.profiles = [profile];
  return converted;
}

function convertMultiProfileWeapon(w) {
  // Already correct — leave it alone
  if (Array.isArray(w.profiles)) return w;
  return convertWeapon(w);
}

data.commonWargear = data.commonWargear.map(w => {
  // Already has profiles array — but profiles may still have `range` instead of `maxRange`
  if (Array.isArray(w.profiles)) {
    const converted = { ...w };
    converted.profiles = w.profiles.map(p => {
      if ('range' in p) {
        // Convert profile-level range to maxRange/minRange/templateType
        const ri = parseRange(p.range);
        const newP = {};
        if (p.label) newP.label = p.label;
        if (ri.minRange != null) newP.minRange = ri.minRange;
        newP.maxRange = ri.maxRange;
        newP.strength = p.strength !== undefined ? String(p.strength) : undefined;
        newP.ap = p.ap;
        newP.rules = p.rules;
        Object.keys(newP).forEach(k => { if (newP[k] === undefined) delete newP[k]; });
        // If templateType needed, set on weapon object (not profile)
        if (ri.templateType && !converted.templateType) converted.templateType = ri.templateType;
        return newP;
      }
      // Also ensure strength is string
      if (p.strength !== undefined && typeof p.strength !== 'string') {
        return { ...p, strength: String(p.strength) };
      }
      return p;
    });
    return converted;
  }
  return convertWeapon(w);
});

fs.writeFileSync(FILE, JSON.stringify(data, null, 2), 'utf8');
console.log('Done. Converted', data.commonWargear.length, 'weapons to profiles format.');

// Spot-check
const lasgun = data.commonWargear.find(w => w.id === 'lasgun');
console.log('Lasgun sample:', JSON.stringify(lasgun));
const flamer = data.commonWargear.find(w => w.id === 'heavy-flamer');
console.log('Heavy Flamer sample:', JSON.stringify(flamer));
const mortar = data.commonWargear.find(w => w.id === 'mortar');
console.log('Mortar sample:', JSON.stringify(mortar));
