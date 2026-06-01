import { useState, useMemo, useRef, useEffect } from "react";

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Rajdhani:wght@400;500;600;700&display=swap');
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
body { background: #f4f2ed; font-family: 'Rajdhani', sans-serif; }

.codex-outer { background: #f4f2ed; min-height: 100vh; padding: 20px; }
.codex-page  { background: #fff; max-width: 900px; margin: 0 auto 32px; padding: 20mm 18mm; box-shadow: 0 2px 12px rgba(0,0,0,0.12); }

.faction-header { border-bottom: 3px solid #1a1a1a; padding-bottom: 10px; margin-bottom: 18px; display: flex; justify-content: space-between; align-items: flex-end; flex-wrap: wrap; gap: 8px; }
.faction-name { font-size: 28pt; font-weight: 700; letter-spacing: 0.02em; line-height: 1; }
.faction-subtitle { font-size: 9pt; color: #888; letter-spacing: 0.2em; text-transform: uppercase; margin-top: 2px; }
.faction-version { font-size: 8pt; color: #bbb; text-align: right; }

.codex-nav-wrap { position: sticky; top: 0; z-index: 20; background: #1a1a1a; }
.codex-nav { background: #1a1a1a; color: #e8e0d0; padding: 10px 18px; display: flex; gap: 6px; flex-wrap: wrap; align-items: center; max-width: 900px; margin: 0 auto; }
.codex-nav .nav-label { font-size: 9pt; color: #999; text-transform: uppercase; letter-spacing: 0.1em; margin-right: 4px; white-space: nowrap; }
.nav-btn { font-family: 'Rajdhani', sans-serif; font-size: 10pt; font-weight: 600; letter-spacing: 0.06em; text-transform: uppercase; padding: 4px 10px; border-radius: 3px; border: 1px solid #444; background: transparent; color: #c9a84c; cursor: pointer; transition: background 0.15s; white-space: nowrap; }
.nav-btn:hover, .nav-btn.active { background: #2a2008; border-color: #c9a84c; }
.nav-print-toggle { display: flex; align-items: center; gap: 8px; padding-left: 4px; }
.nav-print-label { font-family: 'Rajdhani', sans-serif; font-size: 10pt; font-weight: 600; letter-spacing: 0.06em; text-transform: uppercase; color: #888; cursor: pointer; white-space: nowrap; }
.nav-print-label:hover { color: #c9a84c; }
.nav-search-wrap { position: relative; }
.nav-search-input { font-family: 'Rajdhani', sans-serif; font-size: 10pt; font-weight: 500; padding: 4px 10px; border-radius: 3px; border: 1px solid #555; background: #111; color: #e8e0d0; outline: none; width: 150px; transition: border-color 0.15s; }
.nav-search-input::placeholder { color: #666; }
.nav-search-input:focus { border-color: #c9a84c; background: #141414; }
.nav-search-dropdown { position: absolute; top: calc(100% + 6px); left: 0; min-width: 230px; background: #1a1a1a; border: 1px solid #555; border-radius: 4px; z-index: 200; box-shadow: 0 6px 20px rgba(0,0,0,0.6); overflow-y: auto; max-height: 300px; }
.nav-search-item { padding: 8px 12px; cursor: pointer; border-bottom: 1px solid #2a2a2a; }
.nav-search-item:last-child { border-bottom: none; }
.nav-search-item:hover { background: #2a2008; }
.nav-search-name { font-size: 10pt; font-weight: 600; color: #e8e0d0; }
.nav-search-slot { font-size: 8pt; color: #888; text-transform: uppercase; letter-spacing: 0.08em; margin-top: 1px; }
.nav-search-none { padding: 10px 12px; color: #666; font-size: 9.5pt; font-style: italic; }

.section-head { font-weight: 700; font-size: 11pt; letter-spacing: 0.14em; text-transform: uppercase; color: #7a5800; margin: 16px 0 8px; border-bottom: 2px solid #e8d48a; padding-bottom: 2px; }
.group-head { font-weight: 700; font-size: 9.5pt; letter-spacing: 0.10em; text-transform: uppercase; color: #333; margin: 0 0 5px; border-bottom: 1px solid #ccc; padding-bottom: 2px; }
.col-block { break-inside: avoid; padding-top: 10px; }
.col-block-tight { break-inside: avoid; padding-top: 2px; }
.two-col { columns: 2; column-gap: 18px; column-fill: balance; margin-top: -10px; }

.slot-badge { font-size: 9pt; font-weight: 700; letter-spacing: 0.14em; text-transform: uppercase; border-radius: 3px; padding: 1px 7px; display: inline-block; margin-bottom: 3px; }

.slot-section-row { display: flex; align-items: baseline; justify-content: space-between; border-bottom: 3px solid #1a1a1a; padding-bottom: 6px; margin: 0 0 20px; }
.slot-section-head { font-size: 16pt; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; color: #1a1a1a; }
.slot-section-limits { font-size: 10pt; font-weight: 600; color: #1a1a1a; }

.unit-header { display: flex; align-items: flex-start; justify-content: space-between; border-bottom: 2.5px solid #1a1a1a; padding-bottom: 6px; margin-bottom: 10px; position: sticky; top: var(--nav-height, 44px); background: #fff; z-index: 10; padding-top: 8px; margin-top: -8px; box-shadow: 0 3px 8px rgba(255,255,255,1); }
@media print { .unit-header { position: static; box-shadow: none; padding-top: 0; margin-top: 0; } }
.unit-name { font-size: 24pt; font-weight: 700; letter-spacing: 0.02em; line-height: 1; color: #1a1a1a; }
.unit-comp { font-size: 10pt; font-weight: 500; color: #555; margin-top: 3px; }
.unit-pts-block { text-align: right; flex-shrink: 0; padding-left: 12px; }
.unit-pts { font-size: 20pt; font-weight: 700; color: #7a5800; line-height: 1; }
.unit-pts-label { font-size: 9pt; font-weight: 600; letter-spacing: 0.1em; text-transform: uppercase; color: #999; }

.stat-table { width: 100%; border-collapse: collapse; table-layout: fixed; margin-bottom: 10px; }
.stat-table th { font-weight: 700; font-size: 7.5pt; letter-spacing: 0.08em; text-transform: uppercase; color: #666; background: #f5f5f5; padding: 3px; text-align: center; border-bottom: 1px solid #ddd; }
.stat-table th:first-child { text-align: left; }
.stat-table td { font-size: 10pt; font-weight: 500; padding: 2.5px 3px; border-bottom: 1px solid #f0f0f0; text-align: center; color: #1a1a1a; vertical-align: middle; }
.stat-table td:first-child { text-align: left; font-size: 9.5pt; }
.stat-table tr:last-child td { border-bottom: none; }
.stat-table tr:nth-child(even) td { background: #fafafa; }
.stat-col-model { width: 22%; }
.stat-col { width: 7.2%; }

.wep-table, .ref-table { width: 100%; border-collapse: collapse; font-size: 9pt; font-weight: 500; }
.wep-table th, .ref-table th { font-weight: 700; font-size: 7.5pt; letter-spacing: 0.08em; text-transform: uppercase; color: #666; background: #f5f5f5; padding: 3px 5px; text-align: center; border-bottom: 1px solid #ddd; }
.wep-table th:first-child, .ref-table th:first-child { text-align: left; }
.wep-table td, .ref-table td { padding: 2.5px 5px; border-bottom: 1px solid #f0f0f0; text-align: center; color: #1a1a1a; vertical-align: middle; }
.wep-table td:first-child, .ref-table td:first-child { text-align: left; font-weight: 600; }
.wep-table tr:last-child td, .ref-table tr:last-child td { border-bottom: none; }
.stripe-a td { background: #fff !important; }
.stripe-b td { background: #fafafa !important; }
.rules-col { text-align: left !important; font-size: 8.5pt; color: #444; }
.arc-col { font-size: 8pt; color: #888; }
.mp-first td, .mp-cont td { border-bottom: none; }
.mp-last td { border-bottom: 1px solid #f0f0f0; }

.pills { display: flex; flex-wrap: wrap; gap: 5px; margin-bottom: 2px; }
.pill { display: inline-flex; align-items: baseline; gap: 5px; background: #f5f5f5; border: 1px solid #ddd; border-radius: 3px; padding: 2px 8px; font-size: 9pt; line-height: 1.4; cursor: default; position: relative; }
.pill-name { font-weight: 600; color: #1a1a1a; }
.pill-cost { font-weight: 500; color: #7a5800; font-size: 8.5pt; }
.pill.clickable { cursor: pointer; }
.pill.clickable:hover, .rule-pill:hover { background: #eef4ff; border-color: #7a9fd4; }

.rules-tbl { width: 100%; border-collapse: collapse; }
.rules-tbl td { padding: 3px 0; vertical-align: text-top; border: none; background: none !important; }
.rules-model-label { font-size: 8.5pt; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; color: #999; white-space: nowrap; padding-right: 14px; width: 1%; }
.rules-pills { display: flex; flex-wrap: wrap; gap: 5px; padding-left: 6px; align-items: center; }
.rule-pill { display: inline-block; background: #f5f5f5; border: 1px solid #ddd; border-radius: 3px; padding: 2px 8px; font-size: 9pt; font-weight: 600; color: #1a1a1a; line-height: 1.4; cursor: pointer; position: relative; }

.option-list { list-style: none; }
.option-list li { font-size: 9pt; font-weight: 500; padding: 2.5px 0; border-bottom: 1px solid #f0f0f0; line-height: 1.4; }
.option-list li:last-child { border-bottom: none; }
.option-cost { color: #7a5800; font-weight: 600; margin-left: 4px; }
.upgrade-note { font-size: 8.5pt; font-weight: 400; color: #666; font-style: italic; display: block; line-height: 1.4; margin-top: 1px; }

.platoon-badge { display: inline-block; font-size: 7.5pt; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; color: #6e1a1a; background: #fff0f0; border: 1px solid #c06060; border-radius: 3px; padding: 1px 6px; margin-left: 6px; vertical-align: middle; }
.platoon-composition { font-size: 9pt; color: #555; margin-top: 4px; line-height: 1.5; }
.platoon-toggle { font-family: 'Rajdhani', sans-serif; font-size: 9pt; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase; background: #f5f5f5; border: 1px solid #ddd; border-radius: 3px; padding: 4px 12px; cursor: pointer; color: #6e1a1a; margin-top: 10px; display: inline-flex; align-items: center; gap: 6px; transition: background 0.15s; }
.platoon-toggle:hover { background: #ffe8e8; border-color: #c06060; }
.platoon-units { border-left: 3px solid #e8d48a; padding-left: 16px; margin-top: 14px; display: flex; flex-direction: column; gap: 20px; }
.platoon-unit-label { font-size: 7.5pt; font-weight: 700; letter-spacing: 0.14em; text-transform: uppercase; color: #888; margin-bottom: 4px; }
.platoon-squad-count { font-size: 8.5pt; color: #888; font-style: italic; margin-left: 8px; }

@media (max-width: 600px) {
  .two-col { columns: 1; margin-top: 0; }
  .codex-page { padding: 16px 14px; }
  .unit-name { font-size: 18pt; }
  .faction-name { font-size: 20pt; }
}
.detail-mode .two-col { columns: 1; }
@media (min-width: 780px) {
  .detail-mode .two-col { columns: 2; }
}

/* Popover — hover + tap */
.popover-wrap { position: relative; display: inline-block; }
.popover-box {
  display: none; position: fixed;
  background: #1a1a1a; color: #e8e0d0; font-size: 8pt; font-weight: 500;
  padding: 8px 12px; border-radius: 4px; white-space: normal; z-index: 500;
  line-height: 1.5; width: 260px;
  pointer-events: none; box-shadow: 0 4px 12px rgba(0,0,0,0.3);
}
.popover-wrap.open .popover-box { display: block; }
.popover-box strong { display: block; font-size: 9pt; color: #c9a84c; margin-bottom: 3px; }
.popover-box .pop-meta { font-size: 7.5pt; color: #999; margin-bottom: 4px; font-style: italic; display: block; }
.pop-wep-table { width: 100%; border-collapse: collapse; margin-top: 4px; }
.pop-wep-table th { font-size: 7pt; color: #888; text-transform: uppercase; letter-spacing: 0.06em; padding: 1px 4px; text-align: center; border-bottom: 1px solid #333; }
.pop-wep-table th:first-child { text-align: left; }
.pop-wep-table td { font-size: 8pt; color: #ddd; padding: 2px 4px; text-align: center; border-bottom: 1px solid #2a2a2a; }
.pop-wep-table td:first-child { text-align: left; color: #fff; }
.pop-wep-table tr:last-child td { border-bottom: none; }
.pop-wep-table.multi-profile td { border-bottom: none; }

.unit-divider { margin: 28px 0; border: none; border-top: 1px solid #ddd; }

.rule-entry { margin-bottom: 6px; }
.rule-entry-name { font-size: 10.5pt; font-weight: 700; color: #1a1a1a; }
.rule-entry-desc { font-size: 9.5pt; color: #444; margin-top: 1px; line-height: 1.4; }
.subfaction-head { font-size: 13pt; font-weight: 700; letter-spacing: 0.06em; color: #1a1a1a; margin: 14px 0 4px; border-bottom: 1px solid #ccc; padding-bottom: 2px; }

/* Print mode — rules list */
.rules-list { list-style: none; }
.rules-list li { padding: 2.5px 0; border-bottom: 1px solid #f0f0f0; font-size: 9pt; font-weight: 500; line-height: 1.4; }
.rules-list li:last-child { border-bottom: none; }
.rule-name { font-weight: 700; font-size: 9pt; color: #1a1a1a; }
.rules-model-section { margin-bottom: 6px; }
.rules-model-head { font-size: 8.5pt; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; color: #999; margin-bottom: 3px; }
.options-intro { font-size: 10pt; line-height: 1.6; color: #444; margin-bottom: 20px; padding: 14px 16px; background: #fdf3d7; border: 1px solid #e8d48a; border-radius: 4px; }
.options-intro strong { color: #7a5800; }
.options-controls { display: flex; gap: 12px; align-items: center; flex-wrap: wrap; margin-bottom: 20px; }
.options-select { font-family: 'Rajdhani', sans-serif; font-size: 11pt; font-weight: 600; padding: 6px 12px; border: 1px solid #ccc; border-radius: 4px; background: #fff; cursor: pointer; }
.options-slot-head { font-size: 11pt; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; color: #7a5800; border-bottom: 2px solid #e8d48a; padding-bottom: 2px; margin: 16px 0 8px; }
.unit-toggle-row { display: flex; align-items: center; justify-content: space-between; padding: 5px 0; border-bottom: 1px solid #f0f0f0; }
.unit-toggle-row:last-child { border-bottom: none; }
.unit-toggle-name { font-size: 10pt; font-weight: 600; }
.unit-toggle-pts { font-size: 9pt; color: #888; margin-left: 8px; font-weight: 500; }
.toggle-switch { position: relative; display: inline-block; width: 36px; height: 20px; flex-shrink: 0; }
.toggle-switch input { opacity: 0; width: 0; height: 0; }
.toggle-slider { position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0; background: #ccc; border-radius: 20px; transition: 0.2s; }
.toggle-slider:before { position: absolute; content: ""; height: 14px; width: 14px; left: 3px; bottom: 3px; background: white; border-radius: 50%; transition: 0.2s; }
input:checked + .toggle-slider { background: #555; }
input:checked + .toggle-slider:before { transform: translateX(16px); }

@media print {
  .codex-nav-wrap { display: none; }
  .codex-outer { padding: 0; background: #fff; }
  .codex-page { box-shadow: none; margin: 0; padding: 12mm 14mm; max-width: 100%; }
  .col-block { break-inside: avoid; }
  .unit-block { break-inside: avoid; }
  .popover-box { display: none !important; }
  .two-col { columns: 2; }
}
`;

const SLOT_STYLE = {
  "HQ":             { bg:"#e8f0ff", color:"#1a3a6e", border:"#4a7fc1" },
  "Advisor":        { bg:"#e8ffe8", color:"#1a5a1a", border:"#3a9950" },
  "Troop":          { bg:"#ffe8e8", color:"#6e1a1a", border:"#b94040" },
  "Elite":          { bg:"#f0e8ff", color:"#5a2080", border:"#7a4ab9" },
  "Fast Attack":    { bg:"#fff8e0", color:"#5a4a00", border:"#b99340" },
  "Heavy Support":  { bg:"#e0f4ff", color:"#004a5a", border:"#3a8099" },
  "Flyer":          { bg:"#e0fff4", color:"#005a3a", border:"#3a9980" },
  "Ded. Transport": { bg:"#ffe0fa", color:"#5a0050", border:"#994080" },
  "Lord of War":    { bg:"#fff0e8", color:"#6e2a00", border:"#c06030" },
  "Fortification":  { bg:"#f0f0f0", color:"#3a3a3a", border:"#708090" },
};
const SLOT_ORDER = ["HQ","Advisor","Troop","Elite","Fast Attack","Heavy Support","Flyer","Ded. Transport","Lord of War","Fortification"];

function fmtStat(val, key) {
  if (val === null || val === undefined) return "—";
  if (key === "M") return `${val}"`;
  if (["WS","BS","Sv"].includes(key)) return typeof val === "number" ? `${val}+` : val;
  return String(val);
}
function fmtRange(p) {
  if (p.templateType === "Flame") return "Flame";
  if (p.templateType === "Hellstorm") return "Hellstorm";
  if (!p.maxRange && !p.templateType) return "Melee";
  const min = p.minRange ? `${p.minRange}"–` : "";
  return `${min}${p.maxRange}"`;
}
// ── Persistence ──────────────────────────────────────────────────────────────
const stateKey = (file) => `alt40k-${file}`;

function saveState(file, hiddenUnits, selectedSubfaction, detailMode, activePage, scrollY) {
  try {
    localStorage.setItem(stateKey(file), JSON.stringify({
      hidden: [...hiddenUnits],
      subfaction: selectedSubfaction,
      detail: detailMode,
      page: activePage,
      scrollY: Math.round(scrollY),
    }));
  } catch(_) {}
}

function readState(file) {
  try {
    const raw = localStorage.getItem(stateKey(file));
    if (!raw) return null;
    const s = JSON.parse(raw);
    return {
      hiddenUnits:        new Set(Array.isArray(s.hidden) ? s.hidden : []),
      selectedSubfaction: s.subfaction ?? '',
      detailMode:         !!s.detail,
      activePage:         s.page ?? 'army-rules',
      scrollY:            s.scrollY ?? 0,
    };
  } catch(_) { return null; }
}

function resolveRef(ref) {
  if (typeof ref === "string") return { weaponId: ref, arcType: null };
  return { arcType: null, ...ref };
}
function wepById(id, weapons) { return weapons.find(w => w.id === id); }
function ruleById(id, armyRules, coreRules, inlineRules) {
  return (inlineRules||[]).find(r=>r.id===id) || (armyRules||[]).find(r=>r.id===id) || (coreRules||[]).find(r=>r.id===id);
}
function idToLabel(id) {
  return id.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}
function resolveRuleNames(ids, coreRules, armyRules) {
  if (!ids || !ids.length) return "—";
  return ids.map(id => {
    const r = (coreRules||[]).find(r => r.id === id) || (armyRules||[]).find(r => r.id === id);
    return r ? r.name : id;
  }).join(", ");
}

function slotLimitStr(limits) {
  if (!limits) return null;
  const [min, max] = limits;
  if (min === 0 && max === null) return "0+";
  if (min === max) return `${min}`;
  if (max === null) return `${min}+`;
  return `${min}–${max}`;
}

// ── Popover (hover + tap, viewport-aware positioning) ────────────────────────
function Popover({ trigger, content }) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState({ top: -9999, left: -9999 });
  const wrapRef = useRef(null);
  const boxRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    function handler(e) {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("pointerdown", handler);
    return () => document.removeEventListener("pointerdown", handler);
  }, [open]);

  // After box renders, measure its actual height and reposition
  useEffect(() => {
    if (!open || !boxRef.current || !wrapRef.current) return;
    const trigRect = wrapRef.current.getBoundingClientRect();
    const boxH = boxRef.current.offsetHeight;
    const boxW = 260;
    const vw = window.innerWidth;

    // Prefer above; fall back to below if not enough room
    let top = trigRect.top - boxH - 6;
    if (top < 8) top = trigRect.bottom + 6;

    // Centre horizontally, clamp to viewport
    let left = trigRect.left + trigRect.width / 2 - boxW / 2;
    left = Math.max(8, Math.min(left, vw - boxW - 8));

    setPos({ top, left });
  }, [open]);

  function handleOpen() {
    // Position off-screen first so box can render and be measured
    setPos({ top: -9999, left: -9999 });
    setOpen(true);
  }

  return (
    <span ref={wrapRef} className={`popover-wrap${open ? " open" : ""}`}
      onPointerEnter={handleOpen}
      onPointerLeave={() => setOpen(false)}
      onPointerDown={e => { e.stopPropagation(); if (open) setOpen(false); else handleOpen(); }}>
      {trigger}
      <span ref={boxRef} className="popover-box" style={{ top: pos.top, left: pos.left }}>
        {content}
      </span>
    </span>
  );
}

function WeaponPopoverContent({ weapon, coreRules, armyRules }) {
  if (!weapon) return null;
  return (
    <>
      <strong>{weapon.name}</strong>
      <table className={`pop-wep-table${weapon.profiles.length>1?" multi-profile":""}`}>
        <thead><tr>
          <th>Rng</th><th>S</th><th>AP</th><th style={{textAlign:"left"}}>Rules</th>
        </tr></thead>
        <tbody>
          {weapon.profiles.map((p,i) => (
            <tr key={i}>
              <td>{fmtRange(p)}</td><td>{p.strength}</td><td>{p.ap}</td>
              <td style={{textAlign:"left",fontSize:"7.5pt"}}>{resolveRuleNames(p.rules, coreRules, armyRules)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}

function RulePopoverContent({ rule }) {
  if (!rule) return null;
  return <><strong>{rule.name}</strong>{rule.shortDesc||rule.fullDesc||rule.text}</>;
}

function SpellPopoverContent({ spell }) {
  if (!spell) return null;
  return (
    <>
      <strong>{spell.name}</strong>
      <span className="pop-meta">Cast {spell.castValue}+ · {spell.pts} pts · Range {spell.range}"</span>
      {spell.description}
    </>
  );
}

function WargearPill({ weaponId, label, cost, weapons, coreRules, armyRules }) {
  const w = wepById(weaponId, weapons);
  const trigger = (
    <span className={`pill${w?" clickable":""}`}>
      <span className="pill-name">{label||w?.name||weaponId}</span>
      {cost ? <span className="pill-cost">+{cost} pts</span> : null}
    </span>
  );
  if (!w) return trigger;
  return <Popover trigger={trigger} content={<WeaponPopoverContent weapon={w} coreRules={coreRules} armyRules={armyRules}/>}/>;
}

function RulePill({ ruleId, label, armyRules, coreRules, inlineRules }) {
  const rule = ruleById(ruleId, armyRules, coreRules, inlineRules);
  const displayName = label || rule?.name || idToLabel(ruleId);
  const trigger = <span className="rule-pill">{displayName}</span>;
  const content = rule
    ? <RulePopoverContent rule={rule}/>
    : <><strong>{displayName}</strong><span style={{color:"#888",fontStyle:"italic",fontWeight:400}}> — Keyword only</span></>;
  return <Popover trigger={trigger} content={content}/>;
}

function isRealWeapon(w) {
  return w?.profiles?.some(p => p.strength !== "-");
}

function UpgradePill({ label, cost, note, grantsWargear, grantsRules, weapons, coreRules, armyRules }) {
  const grantedWeapons = (grantsWargear || []).map(ref => {
    const id = typeof ref === "string" ? ref : ref.weaponId;
    const w = id ? wepById(id, weapons || []) : null;
    return isRealWeapon(w) ? w : null;
  }).filter(Boolean);

  const grantedRules = (grantsRules || []).map(id =>
    ruleById(id, armyRules, coreRules, [])
  ).filter(Boolean);

  const hasContent = note || grantedWeapons.length > 0 || grantedRules.length > 0;
  const trigger = (
    <span className={`pill${hasContent ? " clickable" : ""}`}>
      <span className="pill-name">{label}</span>
      {cost ? <span className="pill-cost">+{cost} pts</span> : null}
    </span>
  );
  if (!hasContent) return trigger;

  const hasBody = grantedRules.length > 0 || grantedWeapons.length > 0;
  const content = (
    <>
      {note && (
        <>
          <strong>{label}</strong>
          <span style={{display:"block", marginBottom: hasBody ? 6 : 0, fontStyle:"italic", color:"#aaa"}}>{note}</span>
        </>
      )}
      {grantedRules.map(r => <RulePopoverContent key={r.id} rule={r}/>)}
      {grantedWeapons.map(w => <WeaponPopoverContent key={w.id} weapon={w} coreRules={coreRules} armyRules={armyRules}/>)}
    </>
  );
  return <Popover trigger={trigger} content={content}/>;
}

function SlotBadge({ slot }) {
  const s = SLOT_STYLE[slot] || { bg:"#eee", color:"#333", border:"#aaa" };
  return <span className="slot-badge" style={{background:s.bg,color:s.color,border:`1px solid ${s.border}`}}>{slot}</span>;
}

function StatTable({ models }) {
  const types = models.map(m => m.statline?.type);
  const isVehicle = types.some(t => t === "vehicle");
  const isFort = !isVehicle && types.some(t => t === "fortification");
  const cols = isVehicle
    ? ["M","WS","BS","S","FA","SA","RA","W","I","A","Ld","Sv"]
    : ["M","WS","BS","S","T","W","I","A","Ld","Sv"];
  const usedCols = isFort ? cols.filter(c => models.some(m => m.statline?.[c] != null)) : cols;
  return (
    <table className="stat-table">
      <colgroup>
        <col className="stat-col-model"/>
        {usedCols.map(c=><col key={c} className="stat-col"/>)}
      </colgroup>
      <thead><tr><th>Model</th>{usedCols.map(c=><th key={c}>{c}</th>)}</tr></thead>
      <tbody>
        {models.map(m=>(
          <tr key={m.id}>
            <td>{m.name}</td>
            {usedCols.map(c=><td key={c}>{fmtStat(m.statline?.[c],c)}</td>)}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

// Build synthetic rules for transport and psychic from unit-level data
function buildSyntheticRules(unit, coreRules, armyRules) {
  const synthetic = [];

  if (unit.transport) {
    const t = unit.transport;
    const parts = [`Capacity ${t.capacity}`];
    if (t.firePorts?.length) parts.push(`Fire Ports: ${t.firePorts.join(", ")}`);
    if (t.accessPoints?.length) parts.push(`Access: ${t.accessPoints.join(", ")}`);
    synthetic.push({
      id: "__transport__",
      name: `Transport ${t.capacity}`,
      shortDesc: parts.join(" · "),
    });
  }

  if (unit.psychic) {
    const p = unit.psychic;
    const parts = [`Mastery Level ${p.masteryLevel}`];
    if (p.denyBonusPerPhase) parts.push(`+${p.denyBonusPerPhase} Deny per phase`);
    synthetic.push({
      id: "__psychic__",
      name: `Psychic Mastery ${p.masteryLevel}`,
      shortDesc: parts.join(" · "),
    });
  }

  return synthetic;
}

function SpecialRulesSection({ unit, models, armyRules, coreRules, inlineRules }) {
  const synthetic = buildSyntheticRules(unit, coreRules, armyRules);
  const allInline = [...(inlineRules||[]), ...synthetic];

  const allSets = models.map(m => new Set(m.specialRules || []));
  const shared = models.length ? [...allSets[0]].filter(r => allSets.every(s => s.has(r))) : [];
  const specific = models.map(m => ({
    name: m.name,
    rules: (m.specialRules||[]).filter(r => !shared.includes(r)),
  })).filter(m => m.rules.length);

  function sortRules(ids) {
    return [...ids].sort((a,b) => {
      const na = (ruleById(a, armyRules, coreRules, allInline)?.name || a).toLowerCase();
      const nb = (ruleById(b, armyRules, coreRules, allInline)?.name || b).toLowerCase();
      return na.localeCompare(nb);
    });
  }

  // Add synthetic rule IDs to shared rules
  const sharedWithSynthetic = [
    ...sortRules(shared),
    ...synthetic.map(s => s.id),
  ];

  const rows = [
    { label:"All models", rules: sharedWithSynthetic, isAll: true },
    ...specific.map(m => ({ label:`${m.name} only`, rules: sortRules(m.rules), isAll: false })),
  ].filter(r => r.rules.length);

  if (!rows.length) return null;

  const onlyOneRow = rows.length === 1;

  return (
    <>
      <div className="section-head">Special Rules</div>
      {onlyOneRow ? (
        // Single model type — just pills, no label
        <div className="rules-pills" style={{paddingLeft:0}}>
          {rows[0].rules.map(id => (
            <RulePill key={id} ruleId={id} armyRules={armyRules} coreRules={coreRules} inlineRules={allInline}/>
          ))}
        </div>
      ) : (
        <table className="rules-tbl">
          <tbody>
            {rows.map((row,i) => (
              <tr key={i}>
                <td className="rules-model-label">{row.label}</td>
                <td>
                  <div className="rules-pills">
                    {row.rules.map(id => (
                      <RulePill key={id} ruleId={id} armyRules={armyRules} coreRules={coreRules} inlineRules={allInline}/>
                    ))}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </>
  );
}

function OptionsSection({ unit, weapons, weaponLists, namedUpgrades, spellPools, coreRules, armyRules }) {
  const opts = unit.options || [];
  const hasBaseWargear = unit.models.some(m => (m.baseWargear||[]).length > 0);
  if (!opts.length && !hasBaseWargear) return null;

  function resolveChoices(opt) {
    if (opt.weaponListId && weaponLists[opt.weaponListId]) {
      const base = weaponLists[opt.weaponListId];
      const ov = opt.ptsOverrides || {};
      return base.map(c => ({ ...c, pts: ov[c.weaponId] ?? c.pts }));
    }
    return opt.choices || [];
  }

  const squadSizeOpts = opts.filter(o => o.type === "squadSize");
  const upgradeOpts   = opts.filter(o => o.type === "toggle" || o.type === "namedUpgrade");
  const swapOpts      = opts.filter(o => o.type === "weaponSwap");
  const perModelOpts  = opts.filter(o => o.type === "perModelWeapon");
  const spellOpts     = opts.filter(o => o.type === "spellPick");

  function getWargearGroups() {
    const seen = new Map();
    for (const m of unit.models) {
      const key = (m.baseWargear||[]).map(r => typeof r==="string"?r:r.weaponId).join(",");
      if (!seen.has(key)) seen.set(key, { refs: m.baseWargear||[], names:[m.name] });
      else seen.get(key).names.push(m.name);
    }
    return [...seen.values()].filter(g=>g.refs.length>0);
  }
  const wargearGroups = getWargearGroups();
  const multiGroup = wargearGroups.length > 1;

  return (
    <>
      <div className="section-head">Wargear &amp; Options</div>
      <div className="two-col">

        {squadSizeOpts.map(o => (
          <div key={o.id} className="col-block">
            <div className="group-head">Squad size</div>
            <ul className="option-list">
              <li>{o.label} <span className="option-cost">+{o.ptsEach} pts each</span></li>
            </ul>
          </div>
        ))}

        {wargearGroups.map((g,i) => (
          <div key={i} className="col-block">
            <div className="group-head">Base wargear{multiGroup?` — ${g.names.join(" & ")}`:""}</div>
            <div className="pills">
              {g.refs.map((ref,j) => {
                const r = resolveRef(ref);
                return <WargearPill key={j} weaponId={r.weaponId} weapons={weapons} coreRules={coreRules} armyRules={armyRules}/>;
              })}
            </div>
          </div>
        ))}

        {upgradeOpts.length > 0 && (
          <div className="col-block">
            <div className="group-head">Upgrades</div>
            <div className="pills">
              {upgradeOpts.map(o => {
                const named = o.type==="namedUpgrade" ? namedUpgrades?.[o.upgradeId] : null;
                const grantsWargear = o.grantsWargear || named?.grantsWargear;
                const grantsRules = o.grantsRules || named?.grantsRules;
                return <UpgradePill key={o.id} label={named?.label||o.label} cost={o.pts} note={named?.note||o.note} grantsWargear={grantsWargear} grantsRules={grantsRules} weapons={weapons} coreRules={coreRules} armyRules={armyRules}/>;
              })}
            </div>
          </div>
        )}

        {swapOpts.map(o => {
          const choices = resolveChoices(o).filter(c => c.pts);
          if (!choices.length) return null;
          return (
            <div key={o.id} className="col-block">
              <div className="group-head">{o.label}</div>
              <div className="pills">
                {choices.map(c => (
                  <WargearPill key={c.weaponId||c.label} weaponId={c.weaponId} label={c.label} cost={c.pts} weapons={weapons} coreRules={coreRules} armyRules={armyRules}/>
                ))}
              </div>
            </div>
          );
        })}

        {perModelOpts.map(o => {
          const choices = (o.choices||[]).filter(c => c.pts);
          if (!choices.length) return null;
          return (
            <div key={o.id} className="col-block">
              <div className="group-head">{o.label} <span style={{fontWeight:400,fontSize:"8.5pt",color:"#888"}}>(per model)</span></div>
              <div className="pills">
                {choices.map(c => (
                  <WargearPill key={c.weaponId||c.label} weaponId={c.weaponId} label={c.label} cost={c.pts} weapons={weapons} coreRules={coreRules} armyRules={armyRules}/>
                ))}
              </div>
            </div>
          );
        })}

        {unit.psychic && spellOpts.length > 0 && (() => {
          const pool = spellPools?.[unit.psychic.spellPoolId] || [];
          return (
            <div className="col-block">
              <div className="group-head">
                Psychic — Mastery {unit.psychic.masteryLevel}
                {unit.psychic.denyBonusPerPhase ? ` · +${unit.psychic.denyBonusPerPhase} Deny` : ""}
              </div>
              <div className="pills">
                {pool.map(spell => (
                  <Popover key={spell.id}
                    trigger={
                      <span className="pill clickable">
                        <span className="pill-name">{spell.name}</span>
                        <span className="pill-cost">+{spell.pts} pts</span>
                      </span>
                    }
                    content={<SpellPopoverContent spell={spell}/>}
                  />
                ))}
              </div>
            </div>
          );
        })()}

        {unit.transport && (
          <div className="col-block">
            <div className="group-head">Transport</div>
            <ul className="option-list">
              <li>Capacity: {unit.transport.capacity} models</li>
              {(unit.transport.firePorts||[]).length > 0 && (
                <li>Fire Ports: {unit.transport.firePorts.join(", ")}</li>
              )}
              {(unit.transport.accessPoints||[]).length > 0 && (
                <li>Access Points: {unit.transport.accessPoints.join(", ")}</li>
              )}
            </ul>
          </div>
        )}

      </div>
    </>
  );
}

function compStr(models) {
  return models.map(m => m.minCount===m.maxCount ? `${m.minCount} ${m.name}` : `${m.minCount}–${m.maxCount} ${m.name}`).join(" + ");
}

// ── Print mode: special rules as definition list ─────────────────────────────
function DetailSpecialRules({ unit, models, armyRules, coreRules, inlineRules }) {
  const synthetic = buildSyntheticRules(unit, coreRules, armyRules);
  const allInline = [...(inlineRules||[]), ...synthetic];

  const allSets = models.map(m => new Set(m.specialRules || []));
  const shared = models.length ? [...allSets[0]].filter(r => allSets.every(s => s.has(r))) : [];
  const specific = models.flatMap(m =>
    (m.specialRules||[]).filter(r => !shared.includes(r)).map(r => ({ id: r, label: `${m.name} only` }))
  );

  function sortRules(ids) {
    return [...ids].sort((a,b) => {
      const na = (ruleById(a, armyRules, coreRules, allInline)?.name || a).toLowerCase();
      const nb = (ruleById(b, armyRules, coreRules, allInline)?.name || b).toLowerCase();
      return na.localeCompare(nb);
    });
  }

  // All rules as a flat sorted list — shared first, then model-specific
  const allRuleIds = [...sortRules([...shared, ...synthetic.map(s=>s.id)]),
    ...specific.map(r => r.id)];
  const seen = new Set();
  const deduped = allRuleIds.filter(id => { if (seen.has(id)) return false; seen.add(id); return true; });

  if (!deduped.length) return null;

  return (
    <>
      <div className="section-head">Special Rules</div>
      <div className="two-col">
        {deduped.map(id => {
          const rule = ruleById(id, armyRules, coreRules, allInline);
          const modelNote = specific.find(r => r.id === id)?.label;
          return (
            <div key={id} className="col-block-tight">
              <li style={{listStyle:"none", padding:"3px 0", fontSize:"9pt", lineHeight:1.4}}>
                <span className="rule-name">{rule?.name || idToLabel(id)}</span>
                {modelNote && <span style={{fontSize:"8pt",color:"#888",marginLeft:4}}>({modelNote})</span>}
                {rule
                  ? (rule.shortDesc || rule.fullDesc) && <span> — {rule.shortDesc || rule.fullDesc}</span>
                  : <span style={{color:"#888",fontStyle:"italic"}}> — Keyword only</span>
                }
              </li>
            </div>
          );
        })}
      </div>
    </>
  );
}

// ── Print mode: options with full weapon profiles ─────────────────────────────
function DetailOptionsSection({ unit, weapons, weaponLists, namedUpgrades, spellPools, armyRules, coreRules }) {
  const opts = unit.options || [];
  const hasBaseWargear = unit.models.some(m => (m.baseWargear||[]).length > 0);
  if (!opts.length && !hasBaseWargear) return null;

  function resolveChoices(opt) {
    if (opt.weaponListId && weaponLists[opt.weaponListId]) {
      const base = weaponLists[opt.weaponListId];
      const ov = opt.ptsOverrides || {};
      return base.map(c => ({ ...c, pts: ov[c.weaponId] ?? c.pts }));
    }
    return opt.choices || [];
  }

  function WepProfileTable({ refs, showArc }) {
    const rows = refs.map(r => ({ ...resolveRef(r), weapon: wepById(resolveRef(r).weaponId, weapons) })).filter(r => r.weapon);
    if (!rows.length) return null;
    return (
      <table className="wep-table">
        <thead>
          <tr>
            <th>Weapon</th>
            {showArc && <th>Arc</th>}
            <th>Range</th><th>S</th><th>AP</th>
            <th className="rules-col">Rules</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, ri) => {
            const w = r.weapon;
            const sc = ri%2===0 ? "stripe-a" : "stripe-b";
            if (w.profiles.length === 1) {
              const p = w.profiles[0];
              return (
                <tr key={ri} className={sc}>
                  <td>{w.name}</td>
                  {showArc && <td className="arc-col">{r.arcType||""}</td>}
                  <td>{fmtRange(p)}</td><td>{p.strength}</td><td>{p.ap}</td>
                  <td className="rules-col">{resolveRuleNames(p.rules, coreRules, armyRules)}</td>
                </tr>
              );
            }
            return w.profiles.map((p, pi) => (
              <tr key={`${ri}-${pi}`} className={`${pi===0?"mp-first":"mp-cont"}${pi===w.profiles.length-1?" mp-last":""} ${sc}`}>
                <td>{pi===0?w.name:""}</td>
                {showArc && <td className="arc-col">{pi===0?(r.arcType||""):""}</td>}
                <td>{fmtRange(p)}</td><td>{p.strength}</td><td>{p.ap}</td>
                <td className="rules-col">{resolveRuleNames(p.rules, coreRules, armyRules)}</td>
              </tr>
            ));
          })}
        </tbody>
      </table>
    );
  }

  function getWargearGroups() {
    const seen = new Map();
    for (const m of unit.models) {
      const key = (m.baseWargear||[]).map(r => typeof r==="string"?r:r.weaponId).join(",");
      if (!seen.has(key)) seen.set(key, { refs: m.baseWargear||[], names:[m.name] });
      else seen.get(key).names.push(m.name);
    }
    return [...seen.values()].filter(g=>g.refs.length>0);
  }

  const wargearGroups = getWargearGroups();
  const multiGroup = wargearGroups.length > 1;
  const squadSizeOpts = opts.filter(o => o.type === "squadSize");
  const upgradeOpts   = opts.filter(o => o.type === "toggle" || o.type === "namedUpgrade");
  const swapOpts      = opts.filter(o => o.type === "weaponSwap");
  const perModelOpts  = opts.filter(o => o.type === "perModelWeapon");
  const spellOpts     = opts.filter(o => o.type === "spellPick");

  return (
    <>
      <div className="section-head">Wargear &amp; Options</div>
      <div className="two-col">

        {squadSizeOpts.map(o => (
          <div key={o.id} className="col-block">
            <div className="group-head">Squad size</div>
            <ul className="option-list">
              <li>{o.label} <span className="option-cost">+{o.ptsEach} pts each</span></li>
            </ul>
          </div>
        ))}

        {wargearGroups.map((g, i) => (
          <div key={i} className="col-block">
            <div className="group-head">Base wargear{multiGroup ? ` — ${g.names.join(" & ")}` : ""}</div>
            <WepProfileTable refs={g.refs} showArc={false}/>
          </div>
        ))}

        {upgradeOpts.length > 0 && (
          <div className="col-block">
            <div className="group-head">Upgrades</div>
            <ul className="option-list">
              {upgradeOpts.map(o => {
                const named = o.type==="namedUpgrade" ? namedUpgrades?.[o.upgradeId] : null;
                const note = named?.note || o.note;
                return (
                  <li key={o.id}>{named?.label||o.label}
                    <span className="option-cost"> +{o.pts} pts</span>
                    {note && <span className="upgrade-note">{note}</span>}
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        {swapOpts.map(o => {
          const choices = resolveChoices(o).filter(c => c.pts);
          if (!choices.length) return null;
          const wepRefs = choices.map(c => ({ weaponId: c.weaponId, _pts: c.pts, _label: c.label }));
          return (
            <div key={o.id} className="col-block">
              <div className="group-head">{o.label}</div>
              <table className="wep-table">
                <thead><tr><th>Weapon</th><th>Range</th><th>S</th><th>AP</th><th className="rules-col">Rules</th><th>Cost</th></tr></thead>
                <tbody>
                  {choices.map((c, ci) => {
                    const w = wepById(c.weaponId, weapons);
                    if (!w) return <tr key={ci}><td>{c.label||c.weaponId}</td><td></td><td></td><td></td><td></td><td className="rules-col" style={{textAlign:"right",color:"#7a5800",fontWeight:700}}>+{c.pts} pts</td></tr>;
                    const sc = ci%2===0 ? "stripe-a" : "stripe-b";
                    if (w.profiles.length === 1) {
                      const p = w.profiles[0];
                      return (
                        <tr key={ci} className={sc}>
                          <td>{c.label||w.name}</td>
                          <td>{fmtRange(p)}</td><td>{p.strength}</td><td>{p.ap}</td>
                          <td className="rules-col">{resolveRuleNames(p.rules, coreRules, armyRules)}</td>
                          <td style={{textAlign:"right",color:"#7a5800",fontWeight:700,whiteSpace:"nowrap"}}>+{c.pts} pts</td>
                        </tr>
                      );
                    }
                    return w.profiles.map((p, pi) => (
                      <tr key={`${ci}-${pi}`} className={`${pi===0?"mp-first":"mp-cont"}${pi===w.profiles.length-1?" mp-last":""} ${sc}`}>
                        <td>{pi===0?(c.label||w.name):""}</td>
                        <td>{fmtRange(p)}</td><td>{p.strength}</td><td>{p.ap}</td>
                        <td className="rules-col">{resolveRuleNames(p.rules, coreRules, armyRules)}</td>
                        <td style={{textAlign:"right",color:"#7a5800",fontWeight:700,whiteSpace:"nowrap"}}>{pi===0?`+${c.pts} pts`:""}</td>
                      </tr>
                    ));
                  })}
                </tbody>
              </table>
            </div>
          );
        })}

        {perModelOpts.map(o => {
          const choices = (o.choices||[]).filter(c => c.pts);
          if (!choices.length) return null;
          return (
            <div key={o.id} className="col-block">
              <div className="group-head">{o.label} <span style={{fontWeight:400,fontSize:"8.5pt",color:"#888"}}>(per model)</span></div>
              <table className="wep-table">
                <thead><tr><th>Weapon</th><th>Range</th><th>S</th><th>AP</th><th className="rules-col">Rules</th><th>Cost</th></tr></thead>
                <tbody>
                  {choices.map((c, ci) => {
                    const w = wepById(c.weaponId, weapons);
                    const sc = ci%2===0 ? "stripe-a" : "stripe-b";
                    if (!w) return <tr key={ci} className={sc}><td>{c.label||c.weaponId}</td><td></td><td></td><td></td><td></td><td style={{textAlign:"right",color:"#7a5800",fontWeight:700}}>+{c.pts} pts</td></tr>;
                    const p = w.profiles[0];
                    return (
                      <tr key={ci} className={sc}>
                        <td>{c.label||w.name}</td>
                        <td>{fmtRange(p)}</td><td>{p.strength}</td><td>{p.ap}</td>
                        <td className="rules-col">{resolveRuleNames(p.rules, coreRules, armyRules)}</td>
                        <td style={{textAlign:"right",color:"#7a5800",fontWeight:700,whiteSpace:"nowrap"}}>+{c.pts} pts</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          );
        })}

        {unit.psychic && spellOpts.length > 0 && (() => {
          const pool = spellPools?.[unit.psychic.spellPoolId] || [];
          return (
            <div className="col-block">
              <div className="group-head">Psychic — Mastery {unit.psychic.masteryLevel}{unit.psychic.denyBonusPerPhase ? ` · +${unit.psychic.denyBonusPerPhase} Deny` : ""}</div>
              <ul className="option-list">
                {pool.map(spell => (
                  <li key={spell.id}>
                    <strong>{spell.name}</strong> <span className="option-cost">+{spell.pts} pts</span>
                    <span style={{color:"#888",fontSize:"8.5pt"}}> · Cast {spell.castValue}+ · {spell.range}"</span>
                    <span className="upgrade-note">{spell.description}</span>
                  </li>
                ))}
              </ul>
            </div>
          );
        })()}

        {unit.transport && (
          <div className="col-block">
            <div className="group-head">Transport</div>
            <ul className="option-list">
              <li>Capacity: {unit.transport.capacity} models</li>
              {(unit.transport.firePorts||[]).length > 0 && <li>Fire Ports: {unit.transport.firePorts.join(", ")}</li>}
              {(unit.transport.accessPoints||[]).length > 0 && <li>Access Points: {unit.transport.accessPoints.join(", ")}</li>}
            </ul>
          </div>
        )}

      </div>
    </>
  );
}

function UnitSearch({ allUnits, hiddenUnits, onSelect }) {
  const [query, setQuery] = useState("");
  const wrapRef = useRef(null);

  const results = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    return allUnits
      .filter(u => u.name.toLowerCase().includes(q))
      .slice(0, 12);
  }, [query, allUnits]);

  const open = query.trim().length > 0;

  useEffect(() => {
    if (!open) return;
    function handler(e) {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setQuery("");
    }
    document.addEventListener("pointerdown", handler);
    return () => document.removeEventListener("pointerdown", handler);
  }, [open]);

  return (
    <div ref={wrapRef} className="nav-search-wrap">
      <input
        className="nav-search-input"
        type="text"
        placeholder="Find unit…"
        value={query}
        onChange={e => setQuery(e.target.value)}
        onKeyDown={e => e.key === "Escape" && setQuery("")}
      />
      {open && (
        <div className="nav-search-dropdown">
          {results.length === 0
            ? <div className="nav-search-none">No units found</div>
            : results.map(u => {
                const isHidden = hiddenUnits.has(u.id);
                return (
                  <div
                    key={u.id}
                    className="nav-search-item"
                    style={isHidden ? {opacity:0.45} : undefined}
                    onPointerDown={e => { e.preventDefault(); onSelect(u); setQuery(""); }}
                  >
                    <div className="nav-search-name">
                      {u.name}
                      {isHidden && <span style={{fontSize:"8pt",color:"#888",fontWeight:400,marginLeft:6}}>Hidden</span>}
                    </div>
                    <div className="nav-search-slot">{u.slot}</div>
                  </div>
                );
              })
          }
        </div>
      )}
    </div>
  );
}

function PlatoonUnitBlock({ pu, weapons, weaponLists, namedUpgrades, armyRules, coreRules, spellPools, detailMode }) {
  const squadCount = (pu.minSquads != null || pu.maxSquads != null)
    ? (pu.minSquads === pu.maxSquads ? `${pu.minSquads} per platoon` : `${pu.minSquads ?? 0}–${pu.maxSquads ?? "∞"} per platoon`)
    : null;
  return (
    <div>
      <div className="platoon-unit-label">
        {pu.name}
        {squadCount && <span className="platoon-squad-count">({squadCount})</span>}
      </div>
      <div className="unit-block" style={{marginTop:0}}>
        <div className="unit-header">
          <div>
            <div className="unit-name" style={{fontSize:"18pt"}}>{pu.name}</div>
            <div className="unit-comp">Composition: {compStr(pu.models)}</div>
          </div>
          <div className="unit-pts-block">
            <div className="unit-pts-label">Per squad</div>
            <div className="unit-pts">{pu.basePts} pts</div>
          </div>
        </div>
        <StatTable models={pu.models}/>
        {detailMode
          ? <DetailSpecialRules unit={pu} models={pu.models} armyRules={armyRules} coreRules={coreRules} inlineRules={pu.inlineRules}/>
          : <SpecialRulesSection unit={pu} models={pu.models} armyRules={armyRules} coreRules={coreRules} inlineRules={pu.inlineRules}/>
        }
        {detailMode
          ? <DetailOptionsSection unit={pu} weapons={weapons} weaponLists={weaponLists} namedUpgrades={namedUpgrades} spellPools={spellPools} armyRules={armyRules} coreRules={coreRules}/>
          : <OptionsSection unit={pu} weapons={weapons} weaponLists={weaponLists} namedUpgrades={namedUpgrades} spellPools={spellPools} coreRules={coreRules} armyRules={armyRules}/>
        }
      </div>
    </div>
  );
}

function UnitBlock({ unit, weapons, weaponLists, namedUpgrades, armyRules, coreRules, spellPools, hidden, detailMode }) {
  const [platoonOpen, setPlatoonOpen] = useState(false);
  if (hidden) return null;

  if (unit.platoon) {
    return (
      <div className="unit-block" id={`unit-${unit.id}`}>
        <div className="unit-header" style={{position:"static",boxShadow:"none",paddingTop:0,marginTop:0}}>
          <div>
            <SlotBadge slot={unit.slot}/>
            <span className="platoon-badge">Platoon</span>
            <div className="unit-name">{unit.name}</div>
            {unit.platoonComposition && (
              <div className="platoon-composition">{unit.platoonComposition}</div>
            )}
          </div>
        </div>
        <button className="platoon-toggle" onClick={() => setPlatoonOpen(o => !o)}>
          {platoonOpen ? "▲ Hide units" : "▼ Show units"}
        </button>
        {platoonOpen && (
          <div className="platoon-units">
            {(unit.platoonUnits || []).map(pu => (
              <PlatoonUnitBlock key={pu.id} pu={pu} weapons={weapons} weaponLists={weaponLists}
                namedUpgrades={namedUpgrades} armyRules={armyRules} coreRules={coreRules}
                spellPools={spellPools} detailMode={detailMode}/>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="unit-block">
      <div className="unit-header">
        <div>
          <SlotBadge slot={unit.slot}/>
          {unit.isUnique && <span style={{fontSize:"8pt",fontWeight:700,color:"#7a5800",marginLeft:6}}>UNIQUE</span>}
          <div className="unit-name">{unit.name}</div>
          <div className="unit-comp">Composition: {compStr(unit.models)}</div>
        </div>
        <div className="unit-pts-block">
          <div className="unit-pts-label">Base cost</div>
          <div className="unit-pts">{unit.basePts} pts</div>
        </div>
      </div>
      {unit.chapterRestriction && (
        <div style={{fontSize:"8.5pt",color:"#888",fontStyle:"italic",marginBottom:4}}>
          Requires chapter: {unit.chapterRestriction}
        </div>
      )}
      <StatTable models={unit.models}/>
      {detailMode
        ? <DetailSpecialRules unit={unit} models={unit.models} armyRules={armyRules} coreRules={coreRules} inlineRules={unit.inlineRules}/>
        : <SpecialRulesSection unit={unit} models={unit.models} armyRules={armyRules} coreRules={coreRules} inlineRules={unit.inlineRules}/>
      }
      {detailMode
        ? <DetailOptionsSection unit={unit} weapons={weapons} weaponLists={weaponLists} namedUpgrades={namedUpgrades} spellPools={spellPools} armyRules={armyRules} coreRules={coreRules}/>
        : <OptionsSection unit={unit} weapons={weapons} weaponLists={weaponLists} namedUpgrades={namedUpgrades} spellPools={spellPools} coreRules={coreRules} armyRules={armyRules}/>
      }
    </div>
  );
}

function ArmyRulesPage({ faction, armyRules, selectedSubfaction }) {
  const subfactionLabel = faction.subfactionLabel || "Chapter";
  const allSubfactions = faction.subfactions || [];
  const visibleSubfactions = selectedSubfaction
    ? allSubfactions.filter(sf => sf.id === selectedSubfaction)
    : allSubfactions;

  // Collapse "Name N" rules that have multiple numbered variants into a single "Name X" entry
  const baseCounts = new Map();
  for (const r of armyRules) {
    const m = r.name.match(/^(.+) (\d+)$/);
    if (m) baseCounts.set(m[1], (baseCounts.get(m[1]) || 0) + 1);
  }
  const seenBases = new Set();
  const displayRules = [];
  for (const r of armyRules) {
    const m = r.name.match(/^(.+) (\d+)$/);
    if (m && baseCounts.get(m[1]) > 1) {
      const base = m[1];
      if (seenBases.has(base)) continue;
      seenBases.add(base);
      const rx = (s: string|undefined) => s?.replace(/\b\d+\b/, 'X');
      displayRules.push({ ...r, name: `${base} X`, shortDesc: rx(r.shortDesc), fullDesc: rx(r.fullDesc) });
    } else {
      displayRules.push(r);
    }
  }

  return (
    <div>
      <div className="section-head">Army Special Rules</div>
      <div className="two-col">
        {displayRules.map(r => (
          <div key={r.id} className="col-block rule-entry">
            <div className="rule-entry-name">{r.name}</div>
            <div className="rule-entry-desc">{r.fullDesc||r.shortDesc}</div>
          </div>
        ))}
      </div>
      {visibleSubfactions.length > 0 && <>
        <div className="section-head" style={{marginTop:20}}>{subfactionLabel} Rules</div>
        {visibleSubfactions.map(sf => (
          <div key={sf.id} style={{marginBottom:14}}>
            <div className="subfaction-head">{sf.name}</div>
            <div className="two-col">
              {(sf.rules||[]).map(r => (
                <div key={r.id} className="col-block rule-entry">
                  <div className="rule-entry-name">{r.name||"—"}</div>
                  <div className="rule-entry-desc">{r.fullDesc||r.shortDesc||""}</div>
                </div>
              ))}
            </div>
            {(sf.slotReclassifications||[]).length > 0 && (
              <div style={{fontSize:"8.5pt",color:"#666",fontStyle:"italic",marginTop:4}}>
                Slot changes: {sf.slotReclassifications.map(s=>`${s.unitId} → ${s.toSlot||s.newSlot}`).join("; ")}
              </div>
            )}
          </div>
        ))}
      </>}
    </div>
  );
}

function OptionsPage({ faction, unitsBySlot, hiddenUnits, setHiddenUnits, selectedSubfaction, setSelectedSubfaction, detailMode, setDetailMode }) {
  const subfactionLabel = faction.subfactionLabel || "Chapter";
  const subfactions = faction.subfactions || [];

  function toggleUnit(id) {
    setHiddenUnits(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  return (
    <div>
      <div className="options-intro">
        <strong>Customise your codex view.</strong> Use the toggles below to hide units you don't own or don't use — they'll be removed from all unit listings. Select your {subfactionLabel.toLowerCase()} to highlight relevant rules on the Army Rules page. All units are shown by default.
      </div>

      <div className="options-controls">
        <label style={{fontWeight:700,fontSize:"10pt"}}>{subfactionLabel}:</label>
        <select className="options-select" value={selectedSubfaction} onChange={e=>setSelectedSubfaction(e.target.value)}>
          <option value="">— Please select —</option>
          {subfactions.map(sf => (
            <option key={sf.id} value={sf.id}>{sf.name}</option>
          ))}
        </select>
        <button className="nav-btn" style={{fontSize:"9pt",padding:"4px 10px",color:"#c9a84c",borderColor:"#444",background:"#1a1a1a"}}
          onClick={()=>setHiddenUnits(new Set())}>
          Show all units
        </button>
      </div>

      {/* Print mode toggle */}
      {SLOT_ORDER.filter(s=>unitsBySlot[s]).map(slot => (
        <div key={slot}>
          <div className="options-slot-head">{slot}</div>
          {unitsBySlot[slot].map(u => (
            <div key={u.id} className="unit-toggle-row">
              <div>
                <span className="unit-toggle-name">{u.name}</span>
                <span className="unit-toggle-pts">{u.basePts} pts</span>
              </div>
              <label className="toggle-switch">
                <input type="checkbox" checked={!hiddenUnits.has(u.id)} onChange={()=>toggleUnit(u.id)}/>
                <span className="toggle-slider"/>
              </label>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

export default function App() {
  const [factionList, setFactionList] = useState(null);
  const [factionData, setFactionData] = useState(null);
  const [coreRulesData, setCoreRulesData] = useState(null);
  const [currentFile, setCurrentFile] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activePage, setActivePage] = useState("army-rules");
  const [navHeight, setNavHeight] = useState(44);
  const [hiddenUnits, setHiddenUnits] = useState(new Set());
  const [selectedSubfaction, setSelectedSubfaction] = useState("");
  const [detailMode, setDetailMode] = useState(false);
  const [pendingScroll, setPendingScroll] = useState<string|null>(null);
  const [pendingScrollY, setPendingScrollY] = useState<number|null>(null);
  const navWrapRef = useRef(null);
  const activePageRef = useRef(activePage);
  const scrollSaveTimer = useRef<ReturnType<typeof setTimeout>|null>(null);

  useEffect(() => {
    fetch(`${import.meta.env.BASE_URL}factions.json`)
      .then(r => r.json())
      .then(list => setFactionList(list))
      .catch(e => setError("Failed to load faction list: " + e.message));
  }, []);

  function loadFaction(file) {
    setLoading(true);
    setError(null);
    const fetches = [fetch(`${import.meta.env.BASE_URL}${file}`).then(r => r.json())];
    if (!coreRulesData) {
      fetches.push(fetch(`${import.meta.env.BASE_URL}core-rules.json`).then(r => r.json()));
    }
    Promise.all(fetches)
      .then(([faction, core]) => {
        const saved = readState(file);
        setFactionData(faction);
        if (core) setCoreRulesData(core.rules || core);
        setCurrentFile(file);
        setHiddenUnits(saved?.hiddenUnits       ?? new Set());
        setSelectedSubfaction(saved?.selectedSubfaction ?? "");
        setActivePage(saved?.activePage         ?? "army-rules");
        setDetailMode(saved?.detailMode         ?? false);
        setPendingScrollY(saved?.scrollY        ?? 0);
      })
      .catch(e => setError("Failed to load faction: " + e.message))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    if (!navWrapRef.current) return;
    const ro = new ResizeObserver(entries => setNavHeight(entries[0].contentRect.height));
    ro.observe(navWrapRef.current);
    return () => ro.disconnect();
  }, [factionData]);

  const unitsBySlot = useMemo(() => {
    if (!factionData) return {};
    const g = {};
    for (const u of factionData.units||[]) { if(!g[u.slot]) g[u.slot]=[]; g[u.slot].push(u); }
    return g;
  }, [factionData]);

  // Keep ref in sync so the scroll listener can read current activePage
  useEffect(() => { activePageRef.current = activePage; }, [activePage]);

  // Save state on significant changes (page nav, options, subfaction, detail mode)
  useEffect(() => {
    if (!currentFile) return;
    saveState(currentFile, hiddenUnits, selectedSubfaction, detailMode, activePage, window.scrollY);
  }, [currentFile, hiddenUnits, selectedSubfaction, detailMode, activePage]);

  // Debounced scroll save
  useEffect(() => {
    if (!currentFile) return;
    function onScroll() {
      if (scrollSaveTimer.current) clearTimeout(scrollSaveTimer.current);
      scrollSaveTimer.current = setTimeout(() => {
        saveState(currentFile, hiddenUnits, selectedSubfaction, detailMode, activePageRef.current, window.scrollY);
      }, 200);
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => { window.removeEventListener("scroll", onScroll); };
  }, [currentFile, hiddenUnits, selectedSubfaction, detailMode]);

  // Restore scroll position after faction loads and renders
  useEffect(() => {
    if (pendingScrollY === null) return;
    const y = pendingScrollY;
    setPendingScrollY(null);
    // Double RAF ensures the full page has painted before we scroll
    requestAnimationFrame(() => requestAnimationFrame(() => window.scrollTo({ top: y, behavior: "instant" as ScrollBehavior })));
  }, [pendingScrollY]);

  // If the current slot page becomes fully hidden or doesn't exist, redirect to army-rules
  useEffect(() => {
    if (!activePage.startsWith("slot-")) return;
    const slot = activePage.replace("slot-", "");
    if (!unitsBySlot[slot] || unitsBySlot[slot].every(u => hiddenUnits.has(u.id))) {
      setActivePage("army-rules");
    }
  }, [hiddenUnits, activePage, unitsBySlot]);

  // Scroll to a unit after navigating to its slot page
  useEffect(() => {
    if (!pendingScroll) return;
    const id = pendingScroll;
    setPendingScroll(null);
    requestAnimationFrame(() => {
      const el = document.getElementById(`unit-${id}`);
      if (!el) return;
      const navH = navWrapRef.current ? (navWrapRef.current as HTMLElement).offsetHeight : 56;
      const y = el.getBoundingClientRect().top + window.scrollY - navH - 12;
      window.scrollTo({ top: Math.max(0, y), behavior: "smooth" });
    });
  }, [pendingScroll]);

  function handleUnitSelect(unit) {
    setActivePage(`slot-${unit.slot}`);
    setPendingScroll(unit.id);
  }

  if (!factionData) {
    return (
      <div style={{fontFamily:"'Rajdhani',sans-serif",background:"#1a1a1a",minHeight:"100vh",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:20}}>
        <style>{CSS}</style>
        <div style={{marginBottom:32,textAlign:"center"}}>
          <div style={{fontSize:"28pt",fontWeight:700,color:"#e8e0d0",letterSpacing:"0.04em",lineHeight:1}}>ALTERNATE 40K</div>
          <div style={{fontSize:"10pt",color:"#888",letterSpacing:"0.2em",textTransform:"uppercase",marginTop:6}}>Unofficial Codex</div>
        </div>
        {error && <div style={{color:"#c0392b",fontSize:"11pt",marginBottom:20,maxWidth:400,textAlign:"center"}}>{error}</div>}
        {loading || !factionList
          ? <div style={{color:"#c9a84c",fontSize:"13pt",letterSpacing:"0.1em"}}>{loading ? "LOADING CODEX..." : "LOADING..."}</div>
          : (
            <div style={{display:"flex",flexWrap:"wrap",gap:14,justifyContent:"center",maxWidth:640}}>
              {factionList.map((f, i) => (
                <button key={i} onClick={() => loadFaction(f.file)}
                  style={{fontFamily:"'Rajdhani',sans-serif",fontSize:"14pt",fontWeight:700,letterSpacing:"0.06em",textTransform:"uppercase",
                    background:"#111",color:"#c9a84c",border:"1px solid #444",borderRadius:4,padding:"14px 28px",
                    cursor:"pointer",transition:"background 0.15s, border-color 0.15s",minWidth:180}}
                  onMouseEnter={e=>{e.currentTarget.style.background="#2a2008";e.currentTarget.style.borderColor="#c9a84c";}}
                  onMouseLeave={e=>{e.currentTarget.style.background="#111";e.currentTarget.style.borderColor="#444";}}>
                  {f.name}
                </button>
              ))}
            </div>
          )
        }
      </div>
    );
  }

  const weapons      = factionData.commonWargear || [];
  const weaponLists  = factionData.weaponLists || {};
  const namedUpgrades = factionData.namedUpgrades || {};
  const armyRules    = factionData.armyRules || [];
  const coreRules    = coreRulesData || [];
  const spellPools   = factionData.spellPools || {};
  const faction      = factionData.faction || {};
  const slotLimits   = faction.slotLimits || {};

  const navPages = [
    { id:"army-rules", label:"Army Rules" },
    ...SLOT_ORDER.filter(s => unitsBySlot[s] && unitsBySlot[s].some(u => !hiddenUnits.has(u.id))).map(s=>({ id:`slot-${s}`, label:s })),
    { id:"options", label:"Options" },
  ];

  function openPrintTab() {
    const visibleUnits = SLOT_ORDER.flatMap(slot =>
      (unitsBySlot[slot] || []).filter(u => !hiddenUnits.has(u.id))
    );
    const ds = JSON.stringify({ faction, armyRules, weapons, weaponLists, namedUpgrades, spellPools, slotLimits, visibleUnits, coreRules: coreRulesData||[], selectedSubfaction });
    const css = `*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
body { font-family: 'Rajdhani', sans-serif; font-size: 10pt; font-weight: 500; color: #1a1a1a; background: #fff; padding: 15mm 16mm; line-height: 1.35; }
.faction-header { border-bottom: 3px solid #1a1a1a; padding-bottom: 8px; margin-bottom: 16px; display: flex; justify-content: space-between; align-items: flex-end; }
.faction-name { font-size: 26pt; font-weight: 700; letter-spacing: 0.02em; line-height: 1; }
.faction-subtitle { font-size: 8pt; color: #888; letter-spacing: 0.2em; text-transform: uppercase; margin-top: 2px; }
.slot-section-row { display: flex; align-items: baseline; justify-content: space-between; border-bottom: 3px solid #1a1a1a; padding-bottom: 5px; margin: 24px 0 0; }
.slot-section-head { font-size: 16pt; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; }
.slot-section-limits { font-size: 10pt; font-weight: 600; }
.unit-divider { margin: 20px 0; border: none; border-top: 1px solid #ddd; }
.unit-header { display: flex; align-items: flex-start; justify-content: space-between; border-bottom: 2.5px solid #1a1a1a; padding-bottom: 5px; margin-bottom: 8px; }
.slot-badge { font-size: 8pt; font-weight: 700; letter-spacing: 0.14em; text-transform: uppercase; border-radius: 3px; padding: 1px 6px; display: inline-block; margin-bottom: 3px; }
.unit-name { font-size: 20pt; font-weight: 700; letter-spacing: 0.02em; line-height: 1; }
.unit-comp { font-size: 9.5pt; color: #555; margin-top: 2px; }
.unit-pts { font-size: 18pt; font-weight: 700; color: #7a5800; line-height: 1; }
.unit-pts-label { font-size: 8pt; font-weight: 600; letter-spacing: 0.1em; text-transform: uppercase; color: #999; text-align: right; }
.section-head { font-weight: 700; font-size: 12pt; letter-spacing: 0.14em; text-transform: uppercase; color: #7a5800; margin: 14px 0 0; border-bottom: 2px solid #e8d48a; padding-bottom: 2px; }
.group-head { font-weight: 700; font-size: 9pt; letter-spacing: 0.10em; text-transform: uppercase; color: #333; margin: 8px 0 4px; border-bottom: 1px solid #ccc; padding-bottom: 2px; }
.two-col { columns: 2; column-gap: 16px; column-fill: balance; margin-top: -8px; }
.col-block { break-inside: avoid; padding-top: 8px; }
.col-block-tight { break-inside: avoid; padding-top: 2px; }
table { width: 100%; border-collapse: collapse; font-size: 9pt; font-weight: 500; }
th { font-weight: 700; font-size: 7.5pt; letter-spacing: 0.08em; text-transform: uppercase; color: #666; background: #f5f5f5; padding: 3px 4px; text-align: center; border-bottom: 1px solid #ddd; }
th:first-child { text-align: left; }
td { padding: 2px 4px; border-bottom: 1px solid #f0f0f0; text-align: center; color: #1a1a1a; vertical-align: middle; font-size: 9pt; }
td:first-child { text-align: left; font-weight: 600; }
tr:last-child td { border-bottom: none; }
.stripe-a td { background: #fff; }
.stripe-b td { background: #fafafa; }
.mp-first td, .mp-cont td { border-bottom: none; }
.mp-last td { border-bottom: 1px solid #f0f0f0; }
.rules-col { text-align: left !important; font-size: 8pt; color: #444; }
.rule-name { font-weight: 700; font-size: 9pt; }
.option-list { list-style: none; }
.option-list li { font-size: 9pt; padding: 2px 0; border-bottom: 1px solid #f0f0f0; line-height: 1.4; }
.option-list li:last-child { border-bottom: none; }
.option-cost { color: #7a5800; font-weight: 600; margin-left: 4px; }
.upgrade-note { font-size: 8pt; color: #666; font-style: italic; display: block; line-height: 1.4; }
@media print { body { padding: 10mm 12mm; } .col-block { break-inside: avoid; } }`;

    const js = `const d=window.__D__;
const SO=["HQ","Advisor","Troop","Elite","Fast Attack","Heavy Support","Flyer","Ded. Transport","Lord of War","Fortification"];
const SS={"HQ":["#e8f0ff","#1a3a6e","#4a7fc1"],"Advisor":["#e8ffe8","#1a5a1a","#3a9950"],"Troop":["#ffe8e8","#6e1a1a","#b94040"],"Elite":["#f0e8ff","#5a2080","#7a4ab9"],"Fast Attack":["#fff8e0","#5a4a00","#b99340"],"Heavy Support":["#e0f4ff","#004a5a","#3a8099"],"Flyer":["#e0fff4","#005a3a","#3a9980"],"Ded. Transport":["#ffe0fa","#5a0050","#994080"],"Lord of War":["#fff0e8","#6e2a00","#c06030"],"Fortification":["#f0f0f0","#3a3a3a","#708090"]};
function fS(v,k){if(v==null)return"—";if(k==="M")return v+'"';if(["WS","BS","Sv"].includes(k))return typeof v==="number"?v+"+":v;return String(v);}
function fR(p){if(p.templateType==="Flame")return"Flame";if(p.templateType==="Hellstorm")return"Hellstorm";if(!p.maxRange&&!p.templateType)return"Melee";return(p.minRange?p.minRange+'"–':"")+p.maxRange+'"';}
function wB(id){return d.weapons.find(w=>w.id===id);}
function rB(id,inl){return(inl||[]).find(r=>r.id===id)||d.armyRules.find(r=>r.id===id)||d.coreRules.find(r=>r.id===id);}
function rN(ids){return(ids&&ids.length)?ids.map(id=>{const r=rB(id,[]);return r?r.name:id;}).join(", "):"—";}
function slStr(lim){if(!lim)return"";const[mn,mx]=lim;if(mn===mx)return mn+" slot"+(mn!==1?"s":"");if(mx===null)return mn+"+ slots";return mn+"–"+mx+" slots";}
function synth(u){const o=[];if(u.transport){const t=u.transport;o.push({id:"__transport__",name:"Transport "+t.capacity,shortDesc:["Capacity "+t.capacity,t.firePorts?.length?"Fire Ports: "+t.firePorts.join(", "):"",t.accessPoints?.length?"Access: "+t.accessPoints.join(", "):""].filter(Boolean).join(" · ")});}if(u.psychic){const p=u.psychic;o.push({id:"__psychic__",name:"Psychic Mastery "+p.masteryLevel,shortDesc:"Mastery Level "+p.masteryLevel+(p.denyBonusPerPhase?" · +"+p.denyBonusPerPhase+" Deny per phase":"")});}return o;}
function wepTbl(refs,showArc,choices){
  const rows=(choices||refs.map(r=>typeof r==="string"?{weaponId:r,arcType:null}:{arcType:null,...r})).map((c,i)=>({w:wB(c.weaponId),pts:c.pts,label:c.label,arc:c.arcType,i})).filter(x=>x.w);
  if(!rows.length)return"";
  const hC=choices!=null;
  let t='<table><thead><tr><th>Weapon</th>'+(showArc?'<th>Arc</th>':'')+'<th>Range</th><th>S</th><th>AP</th><th class="rules-col">Rules</th>'+(hC?'<th>Cost</th>':'')+'</tr></thead><tbody>';
  rows.forEach(({w,pts,label,arc,i})=>{
    const sc=i%2===0?"stripe-a":"stripe-b";
    if(w.profiles.length===1){const p=w.profiles[0];t+='<tr class="'+sc+'"><td>'+(label||w.name)+'</td>'+(showArc?'<td class="arc-col">'+(arc||"")+'</td>':'')+'<td>'+fR(p)+'</td><td>'+p.strength+'</td><td>'+p.ap+'</td><td class="rules-col">'+rN(p.rules)+'</td>'+(hC?'<td style="text-align:right;color:#7a5800;font-weight:700;white-space:nowrap">+'+pts+' pts</td>':'')+'</tr>';}
    else{w.profiles.forEach((p,pi)=>{t+='<tr class="'+(pi===0?"mp-first":"mp-cont")+' '+sc+'"><td>'+(pi===0?(label||w.name):"")+'</td>'+(showArc?'<td class="arc-col">'+(pi===0?(arc||""):"")+'</td>':'')+'<td>'+fR(p)+'</td><td>'+p.strength+'</td><td>'+p.ap+'</td><td class="rules-col">'+rN(p.rules)+'</td>'+(hC?'<td style="text-align:right;color:#7a5800;font-weight:700;white-space:nowrap">'+(pi===0?"+"+pts+" pts":"")+'</td>':'')+'</tr>';});}
  });
  return t+'</tbody></table>';}
function renderUnit(unit){
  const sy=synth(unit);const inl=[...(unit.inlineRules||[]),...sy];
  const isV=unit.models.some(m=>m.statline?.type==="vehicle");
  const isF=!isV&&unit.models.some(m=>m.statline?.type==="fortification");
  const cols=isV?["M","WS","BS","S","FA","SA","RA","W","I","A","Ld","Sv"]:["M","WS","BS","S","T","W","I","A","Ld","Sv"];
  const uC=isF?cols.filter(c=>unit.models.some(m=>m.statline?.[c]!=null)):cols;
  let stat='<table style="margin-bottom:8px;table-layout:fixed"><thead><tr><th style="width:22%">Model</th>'+uC.map(c=>'<th style="width:7.2%">'+c+'</th>').join("")+'</tr></thead><tbody>';
  unit.models.forEach((m,mi)=>{stat+='<tr'+(mi%2===1?' style="background:#fafafa"':'')+'><td>'+m.name+'</td>'+uC.map(c=>'<td>'+fS(m.statline?.[c],c)+'</td>').join("")+'</tr>';});
  stat+='</tbody></table>';
  const allS=unit.models.map(m=>new Set(m.specialRules||[]));
  const shared=unit.models.length?[...allS[0]].filter(r=>allS.every(s=>s.has(r))):[];
  const spec=unit.models.flatMap(m=>(m.specialRules||[]).filter(r=>!shared.includes(r)).map(r=>({id:r,label:m.name+" only"})));
  const allR=[...[...shared,...sy.map(s=>s.id)].sort((a,b)=>{const na=(rB(a,inl)?.name||a).toLowerCase(),nb=(rB(b,inl)?.name||b).toLowerCase();return na.localeCompare(nb);}), ...spec.map(r=>r.id)];
  const seen=new Set();const ded=allR.filter(id=>{if(seen.has(id))return false;seen.add(id);return true;});
  let rules='<div class="section-head">Special Rules</div><div class="two-col">';
  ded.forEach(id=>{const rule=rB(id,inl);const mn=spec.find(r=>r.id===id)?.label;rules+='<div class="col-block-tight"><li style="list-style:none;padding:3px 0;font-size:9pt;line-height:1.4"><span class="rule-name">'+(rule?.name||id)+'</span>'+(mn?'<span style="font-size:8pt;color:#888;margin-left:4px">('+mn+')</span>':'')+((rule?.shortDesc||rule?.fullDesc)?' — '+(rule.shortDesc||rule.fullDesc):'')+'</li></div>';});
  rules+='</div>';
  const opts=unit.options||[];
  function rCh(o){if(o.weaponListId&&d.weaponLists[o.weaponListId]){const b=d.weaponLists[o.weaponListId],ov=o.ptsOverrides||{};return b.map(c=>({...c,pts:ov[c.weaponId]??c.pts}));}return o.choices||[];}
  const sqSz=opts.filter(o=>o.type==="squadSize");
  const upg=opts.filter(o=>o.type==="toggle"||o.type==="namedUpgrade");
  const sw=opts.filter(o=>o.type==="weaponSwap");
  const pm=opts.filter(o=>o.type==="perModelWeapon");
  const sp=opts.filter(o=>o.type==="spellPick");
  const wgM=new Map();unit.models.forEach(m=>{const k=(m.baseWargear||[]).map(r=>typeof r==="string"?r:r.weaponId).join(",");if(!wgM.has(k))wgM.set(k,{refs:m.baseWargear||[],names:[m.name]});else wgM.get(k).names.push(m.name);});
  const wgG=[...wgM.values()].filter(g=>g.refs.length>0);const mg=wgG.length>1;
  let optContent='';
  sqSz.forEach(o=>{optContent+='<div class="col-block"><div class="group-head">Squad size</div><ul class="option-list"><li>'+o.label+'<span class="option-cost">+'+o.ptsEach+' pts each</span></li></ul></div>';});
  wgG.forEach(g=>{optContent+='<div class="col-block"><div class="group-head">Base wargear'+(mg?' — '+g.names.join(" & "):"")+' </div>'+wepTbl(g.refs,isV,null)+'</div>';});
  if(upg.length){optContent+='<div class="col-block"><div class="group-head">Upgrades</div><ul class="option-list">';upg.forEach(o=>{const named=o.type==="namedUpgrade"?d.namedUpgrades?.[o.upgradeId]:null;const note=named?.note||o.note;optContent+='<li>'+(named?.label||o.label)+'<span class="option-cost"> +'+o.pts+' pts</span>'+(note?'<span class="upgrade-note">'+note+'</span>':'')+'</li>';});optContent+='</ul></div>';}
  sw.forEach(o=>{const ch=rCh(o).filter(c=>c.pts);if(!ch.length)return;optContent+='<div class="col-block"><div class="group-head">'+o.label+'</div>'+wepTbl(null,false,ch)+'</div>';});
  pm.forEach(o=>{const ch=(o.choices||[]).filter(c=>c.pts);if(!ch.length)return;optContent+='<div class="col-block"><div class="group-head">'+o.label+' <span style="font-weight:400;font-size:8pt;color:#888">(per model)</span></div>'+wepTbl(null,false,ch)+'</div>';});
  if(unit.psychic&&sp.length){const pool=d.spellPools?.[unit.psychic.spellPoolId]||[];if(pool.length){optContent+='<div class="col-block"><div class="group-head">Psychic — Mastery '+unit.psychic.masteryLevel+(unit.psychic.denyBonusPerPhase?' · +'+unit.psychic.denyBonusPerPhase+' Deny':'')+'</div><ul class="option-list">';pool.forEach(s=>{optContent+='<li>'+s.name+'<span class="option-cost">+'+s.pts+' pts</span><span class="upgrade-note">Cast '+s.castValue+'+ · '+s.description+'</span></li>';});optContent+='</ul></div>';}}
  if(unit.transport){const t=unit.transport;optContent+='<div class="col-block"><div class="group-head">Transport</div><ul class="option-list"><li>Capacity: '+t.capacity+' models</li>'+(t.firePorts?.length?'<li>Fire Ports: '+t.firePorts.join(", ")+'</li>':'')+(t.accessPoints?.length?'<li>Access Points: '+t.accessPoints.join(", ")+'</li>':'')+'</ul></div>';}
  const opt = optContent ? '<div class="section-head">Wargear &amp; Options</div><div class="two-col">'+optContent+'</div>' : '';
  const [bg,color,border]=SS[unit.slot]||["#eee","#333","#aaa"];
  return '<div class="unit-block"><div class="unit-header"><div><span class="slot-badge" style="background:'+bg+';color:'+color+';border:1px solid '+border+'">'+unit.slot+'</span><div class="unit-name">'+unit.name+'</div><div class="unit-comp">Composition: '+unit.models.map(m=>m.minCount===m.maxCount?m.minCount+" "+m.name:m.minCount+"–"+m.maxCount+" "+m.name).join(" + ")+'</div></div><div style="text-align:right;flex-shrink:0;padding-left:12px"><div class="unit-pts-label">Base cost</div><div class="unit-pts">'+unit.basePts+' pts</div></div></div>'+stat+rules+opt+'</div>';}
const bySlot={};d.visibleUnits.forEach(u=>{if(!bySlot[u.slot])bySlot[u.slot]=[];bySlot[u.slot].push(u);});
// Army rules page
let armyRulesHtml='<div class="section-head">Army Special Rules</div><div class="two-col">';
d.armyRules.forEach(r=>{armyRulesHtml+='<div class="col-block"><div style="font-weight:700;font-size:10.5pt;margin-bottom:2px">'+r.name+'</div><div style="font-size:9.5pt;color:#444;line-height:1.4">'+(r.fullDesc||r.shortDesc||'')+'</div></div>';});
armyRulesHtml+='</div>';
const visibleSubfactions=(d.faction.subfactions||[]).filter(sf=>!d.selectedSubfaction||sf.id===d.selectedSubfaction);
if(visibleSubfactions.length){armyRulesHtml+='<div class="section-head">'+(d.faction.subfactionLabel||"Chapter")+' Rules</div>';visibleSubfactions.forEach(sf=>{armyRulesHtml+='<div style="font-size:13pt;font-weight:700;letter-spacing:0.06em;border-bottom:1px solid #ccc;padding-bottom:2px;margin:12px 0 4px">'+sf.name+'</div><div class="two-col">';(sf.rules||[]).forEach(r=>{armyRulesHtml+='<div class="col-block"><div style="font-weight:700;font-size:10pt;margin-bottom:2px">'+(r.name||'')+'</div><div style="font-size:9.5pt;color:#444;line-height:1.4">'+(r.fullDesc||r.shortDesc||'')+'</div></div>';});armyRulesHtml+='</div>';});}
let body='<div class="faction-header"><div><div class="faction-name">'+(d.faction.name||"Codex")+'</div><div class="faction-subtitle">Alternate 40k Rules · Unofficial Codex</div></div><div style="text-align:right;font-size:8pt;color:#bbb">v'+(d.faction.version||"1.0")+'</div></div>'+armyRulesHtml;
SO.filter(s=>bySlot[s]).forEach(slot=>{const lim=d.slotLimits[slot];body+='<div class="slot-section-row"><div class="slot-section-head">'+slot+'</div>'+(lim?'<div class="slot-section-limits">'+slStr(lim)+'</div>':'')+'</div>';bySlot[slot].forEach((unit,i)=>{if(i>0)body+='<hr class="unit-divider">';body+=renderUnit(unit);});});
document.body.innerHTML+=body;`;

    const factionName = (faction.name || "Codex").replace(/[<>"]/g, '');
    const html = `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><title>${factionName} — Full Codex</title><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Rajdhani:wght@400;500;600;700&display=swap"><style>${css}</style></head><body><script>window.__D__=${ds};<\/script><script>${js}<\/script></body></html>`;
    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    window.open(url, "_blank");
    setTimeout(() => URL.revokeObjectURL(url), 10000);
  }

  return (
    <div style={{"--nav-height":`${navHeight}px`}}>
      <style>{CSS}</style>
      <div className="codex-nav-wrap" ref={navWrapRef}>
        <nav className="codex-nav">
          <span className="nav-label">{faction.name||"Codex"}</span>
          {navPages.map(p=>{
            const isFn = p.id === "options";
            return (
              <button key={p.id}
                className={`nav-btn${activePage===p.id?" active":""}`}
                style={isFn ? {color:"#888",borderColor:"#333"} : undefined}
                onClick={()=>setActivePage(p.id)}>
                {p.label}
              </button>
            );
          })}
          <UnitSearch allUnits={factionData.units||[]} hiddenUnits={hiddenUnits} onSelect={handleUnitSelect}/>
          <button className="nav-btn" onClick={()=>{setFactionData(null);setCurrentFile(null);setError(null);}} style={{color:"#888",borderColor:"#333"}}>← Factions</button>
          <span className="nav-print-toggle">
            <Popover
              trigger={
                <span className="nav-print-label" onClick={()=>setDetailMode(m=>!m)}>
                  Print View
                </span>
              }
              content={<>
                <strong>Print View</strong>
                Replaces interactive pills with full weapon profiles and written-out special rule descriptions — ideal for printing or use without a screen.
              </>}
            />
            <label className="toggle-switch" style={{flexShrink:0}}>
              <input type="checkbox" checked={detailMode} onChange={e=>setDetailMode(e.target.checked)}/>
              <span className="toggle-slider"/>
            </label>
          </span>
          <button className="nav-btn" onClick={openPrintTab} style={{color:"#888",borderColor:"#333"}}>
            ⎙ Print
          </button>
        </nav>
      </div>

      <div className="codex-outer">
        <div className={`codex-page${detailMode?" detail-mode":""}`}>
          <div className="faction-header">
            <div>
              <div className="faction-name">{faction.name||"Unknown Faction"}</div>
              <div className="faction-subtitle">Alternate 40k Rules · Unofficial Codex</div>
            </div>
            <div className="faction-version">v{faction.version||"1.0"}</div>
          </div>

          {activePage==="army-rules" && <ArmyRulesPage faction={faction} armyRules={armyRules} selectedSubfaction={selectedSubfaction}/>}

          {SLOT_ORDER.filter(s=>unitsBySlot[s]).map(slot => activePage===`slot-${slot}` && (
            <div key={slot}>
              <div className="slot-section-row">
                <div className="slot-section-head">{slot}</div>
                {slotLimits[slot] && (
                  <div className="slot-section-limits">{slotLimitStr(slotLimits[slot])} slots</div>
                )}
              </div>
              {unitsBySlot[slot].map((unit,i)=>(
                <div key={unit.id} id={`unit-${unit.id}`}>
                  {i>0 && !hiddenUnits.has(unit.id) && !hiddenUnits.has(unitsBySlot[slot][i-1]?.id) && <hr className="unit-divider"/>}
                  <UnitBlock
                    unit={unit} weapons={weapons} weaponLists={weaponLists}
                    namedUpgrades={namedUpgrades} armyRules={armyRules}
                    coreRules={coreRules} spellPools={spellPools}
                    hidden={hiddenUnits.has(unit.id)}
                    detailMode={detailMode}
                  />
                </div>
              ))}
            </div>
          ))}

          {activePage==="options" && (
            <OptionsPage
              faction={faction} unitsBySlot={unitsBySlot}
              hiddenUnits={hiddenUnits} setHiddenUnits={setHiddenUnits}
              selectedSubfaction={selectedSubfaction} setSelectedSubfaction={setSelectedSubfaction}
              detailMode={detailMode} setDetailMode={setDetailMode}
            />
          )}
        </div>
      </div>
    </div>
  );
}