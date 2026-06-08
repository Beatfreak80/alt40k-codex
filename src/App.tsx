import { useState, useMemo, useRef, useEffect, useLayoutEffect, Fragment } from "react";

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
.codex-nav .nav-label { font-size: 9pt; font-weight: 700; color: #c9a84c; text-transform: uppercase; letter-spacing: 0.1em; margin-right: 4px; white-space: nowrap; }
.nav-btn { font-family: 'Rajdhani', sans-serif; font-size: 10pt; font-weight: 600; letter-spacing: 0.06em; text-transform: uppercase; padding: 4px 10px; border-radius: 3px; border: 1px solid #444; background: transparent; color: #c9a84c; cursor: pointer; transition: background 0.15s; white-space: nowrap; }
.nav-btn:hover, .nav-btn.active { background: #2a2008; border-color: #c9a84c; }
.nav-mobile-select { font-family: 'Rajdhani', sans-serif; font-size: 10pt; font-weight: 500; padding: 4px 10px; border-radius: 3px; border: 1px solid #c9a84c; background: #2a2008; color: #c9a84c; cursor: pointer; }
.nav-page-btn { display: none !important; }
.nav-search-wrap { position: relative; }
.nav-search-input { font-family: 'Rajdhani', sans-serif; font-size: 10pt; font-weight: 500; padding: 4px 10px; border-radius: 3px; border: 1px solid #555; background: #111; color: #e8e0d0; outline: none; width: 110px; transition: border-color 0.15s; }
.nav-search-input::placeholder { color: #666; }
.nav-search-input:focus { border-color: #c9a84c; background: #141414; }
.nav-search-dropdown { position: absolute; top: calc(100% + 6px); left: 0; min-width: 230px; background: #1a1a1a; border: 1px solid #555; border-radius: 4px; z-index: 200; box-shadow: 0 6px 20px rgba(0,0,0,0.6); overflow-y: auto; max-height: 300px; }
.nav-search-item { padding: 8px 12px; cursor: pointer; border-bottom: 1px solid #2a2a2a; }
.nav-search-item:last-child { border-bottom: none; }
.nav-search-item:hover { background: #2a2008; }
.nav-search-name { font-size: 10pt; font-weight: 600; color: #e8e0d0; }
.nav-search-slot { font-size: 8pt; color: #888; text-transform: uppercase; letter-spacing: 0.08em; margin-top: 1px; }
.nav-search-none { padding: 10px 12px; color: #666; font-size: 9.5pt; font-style: italic; }
.rules-search-dropdown { min-width: 360px; }
.rules-search-item { cursor: default; }
.rules-search-item:hover { background: inherit; }
.rules-search-desc { font-size: 8.5pt; color: #999; margin-top: 3px; line-height: 1.4; }

.section-head { font-weight: 700; font-size: 11pt; letter-spacing: 0.14em; text-transform: uppercase; color: #7a5800; margin: 16px 0 8px; border-bottom: 2px solid #e8d48a; padding-bottom: 2px; }
.group-head { font-weight: 700; font-size: 9.5pt; letter-spacing: 0.10em; text-transform: uppercase; color: #333; margin: 0 0 5px; border-bottom: 1px solid #ccc; padding-bottom: 2px; }
.upgrade-group-head { column-span: all; font-weight: 700; font-size: 9.5pt; letter-spacing: 0.14em; text-transform: uppercase; color: #7a5800; margin: 10px 0 0; padding: 3px 0 2px; border-top: 1px solid #e8d48a; border-bottom: 1px solid #e8d48a; background: #fffdf5; }
.col-block { break-inside: avoid; padding-top: 10px; }
.col-block-tight { break-inside: avoid; padding-top: 2px; }
.two-col { columns: 2; column-gap: 18px; column-fill: balance; margin-top: -10px; }

.slot-section-row { display: flex; align-items: baseline; justify-content: space-between; border-bottom: 2px solid #e8d48a; padding-bottom: 6px; margin: 0 0 20px; position: sticky; top: var(--nav-height, 44px); background: #fff; z-index: 11; }
.slot-section-head { font-size: 22pt; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; color: #7a5800; }
.slot-section-limits { font-size: 10pt; font-weight: 600; color: #1a1a1a; }

.unit-header { display: flex; align-items: flex-start; justify-content: space-between; border-bottom: 2.5px solid #1a1a1a; padding-bottom: 6px; margin-bottom: 10px; position: sticky; top: calc(var(--nav-height, 44px) + 40px); background: #fff; z-index: 10; padding-top: 8px; margin-top: -8px; box-shadow: 0 3px 8px rgba(255,255,255,1); }
@media print { .unit-header { position: static; box-shadow: none; padding-top: 0; margin-top: 0; } }
.unit-name { font-size: 24pt; font-weight: 700; letter-spacing: 0.02em; line-height: 1; color: #1a1a1a; }
.unit-comp { font-size: 10pt; font-weight: 500; color: #555; margin-top: 3px; }
.unit-pts-block { text-align: right; flex-shrink: 0; padding-left: 12px; display: flex; flex-direction: column; align-items: flex-end; gap: 6px; }
.unit-pts { font-size: 20pt; font-weight: 700; color: #7a5800; line-height: 1; }
.unit-pts-label { font-size: 9pt; font-weight: 600; letter-spacing: 0.1em; text-transform: uppercase; color: #999; }
.add-to-list-btn { font-family: 'Rajdhani', sans-serif; font-size: 8.5pt; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase; background: #fff8e8; border: 1px solid #c9a84c; border-radius: 3px; padding: 3px 9px; color: #7a5800; cursor: pointer; white-space: nowrap; transition: background 0.15s; }
.add-to-list-btn:hover { background: #fef0c8; border-color: #7a5800; }
@media print { .add-to-list-btn { display: none; } }
.atl-select { font-family: 'Rajdhani', sans-serif; font-size: 10pt; font-weight: 600; padding: 4px 8px; border: 1px solid #ccc; border-radius: 4px; background: #fafafa; color: #1a1a1a; }

.stat-table { width: 100%; border-collapse: collapse; table-layout: fixed; margin-bottom: 10px; }
.stat-table th { font-weight: 700; font-size: 7.5pt; letter-spacing: 0.08em; text-transform: uppercase; color: #666; background: #f5f5f5; padding: 3px; text-align: center; border-bottom: 1px solid #ddd; }
.stat-table th:first-child { text-align: left; }
.stat-table td { font-size: 10pt; font-weight: 500; padding: 2.5px 3px; border-bottom: 1px solid #f0f0f0; text-align: center; color: #1a1a1a; vertical-align: middle; }
.stat-table td:first-child { text-align: left; font-size: 9.5pt; }
.stat-table tr:last-child td { border-bottom: none; }
.stat-table tr:nth-child(even) td { background: #fafafa; }
.stat-col-model { width: 22%; }
.stat-col { width: 7.2%; }

.wep-table, .ref-table { width: 100%; border-collapse: collapse; font-size: 9pt; font-weight: 500; table-layout: fixed; }
.wep-table th, .ref-table th { font-weight: 700; font-size: 7.5pt; letter-spacing: 0.08em; text-transform: uppercase; color: #666; background: #f5f5f5; padding: 3px 5px; text-align: center; border-bottom: 1px solid #ddd; }
.wep-table th:first-child, .ref-table th:first-child { text-align: left; }
.wep-table td, .ref-table td { padding: 2.5px 5px; border-bottom: 1px solid #f0f0f0; text-align: center; color: #1a1a1a; vertical-align: middle; }
.wep-table td:first-child, .ref-table td:first-child { text-align: left; font-weight: 600; }
.wep-table tr:last-child td, .ref-table tr:last-child td { border-bottom: none; }
.stripe-a td { background: #fff !important; }
.stripe-b td { background: #fafafa !important; }
.rules-col { text-align: left !important; font-size: 8.5pt; color: #444; white-space: pre-line; }
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
.platoon-toggle { font-family: 'Rajdhani', sans-serif; font-size: 9pt; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase; background: #fff8e8; border: 1px solid #7a5800; border-radius: 3px; padding: 4px 12px; cursor: pointer; color: #7a5800; margin-top: 10px; display: inline-flex; align-items: center; gap: 6px; transition: background 0.15s; }
.platoon-toggle:hover { background: #fef0c8; border-color: #5a4000; color: #5a4000; }
.platoon-units { border-left: 3px solid #e8d48a; padding-left: 16px; margin-top: 14px; display: flex; flex-direction: column; gap: 20px; }
.platoon-unit-label { font-size: 7.5pt; font-weight: 700; letter-spacing: 0.14em; text-transform: uppercase; color: #888; margin-bottom: 4px; }
.platoon-squad-count { font-size: 8.5pt; color: #888; font-style: italic; margin-left: 8px; }

@media (max-width: 768px) {
  .codex-outer { padding: 0; }
  .codex-page { padding: 12px; box-shadow: none; max-width: 100%; }
  .two-col { columns: 1; margin-top: 0; }
  .faction-name { font-size: 22pt; }
  .faction-subtitle { font-size: 10pt; }
  .unit-name { font-size: 20pt; }
  .unit-comp { font-size: 12pt; }
  .unit-pts { font-size: 22pt; }
  .unit-pts-label { font-size: 11pt; }
  .slot-section-head { font-size: 20pt; }
  .slot-section-limits { font-size: 12pt; }
  .section-head { font-size: 13pt; }
  .group-head { font-size: 11pt; }
  .stat-table th { font-size: 9pt; }
  .stat-table td { font-size: 11pt; }
  .stat-table td:first-child { font-size: 11pt; }
  .wep-table th, .ref-table th { font-size: 9pt; }
  .wep-table td, .ref-table td { font-size: 10.5pt; }
  .rules-col { font-size: 9.5pt; }
  .pill { font-size: 11pt; padding: 3px 10px; }
  .pill-name { font-size: 11pt; }
  .pill-cost { font-size: 10pt; }
  .rule-pill { font-size: 11pt; padding: 3px 10px; }
  .rules-model-label { font-size: 10pt; }
  .option-list li { font-size: 11pt; padding: 4px 0; }
  .option-cost { font-size: 10.5pt; }
  .upgrade-note { font-size: 10pt; }
  .rule-entry-name { font-size: 12pt; }
  .rule-entry-desc { font-size: 11pt; }
  .subfaction-head { font-size: 15pt; }
  .platoon-composition { font-size: 11pt; }
  .platoon-toggle { font-size: 11pt; }
  .popover-box { font-size: 10pt; width: 240px; }
  .nav-search-input { width: 90px; font-size: 11pt; }
  .nav-search-name { font-size: 11pt; }
}


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
.rule-name-clickable { cursor: pointer; text-decoration: underline dotted; text-underline-offset: 2px; }
.rule-name-clickable:hover { color: #7a5800; }
.rules-detail-li { font-size: 9pt; }
@media (max-width: 768px) {
  .rule-name { font-size: 12pt; }
  .rules-detail-li { font-size: 10.5pt; }
}
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

/* ── List Builder ───────────────────────────────────────────────────────── */
.lb-header { display:flex; align-items:center; gap:10px; flex-wrap:wrap; padding:12px 0 16px; border-bottom:2px solid #e8d48a; margin-bottom:18px; }
.lb-name-input { font-family:'Rajdhani',sans-serif; font-size:16pt; font-weight:700; border:none; border-bottom:2px solid transparent; background:transparent; color:#1a1a1a; outline:none; padding:2px 0; min-width:120px; flex:1; cursor:pointer; }
.lb-name-input:focus { border-color:#7a5800; cursor:text; }
.lb-btn { font-family:'Rajdhani',sans-serif; font-size:9.5pt; font-weight:600; letter-spacing:.06em; text-transform:uppercase; padding:4px 11px; border-radius:3px; border:1px solid #b09040; background:transparent; color:#7a5800; cursor:pointer; white-space:nowrap; transition:background .12s, border-color .12s; }
.lb-btn:hover { background:#fdf3d7; border-color:#7a5800; }
.lb-btn-danger { color:#c04040; border-color:#c04040; }
.lb-btn-danger:hover { background:#fff0f0; border-color:#c04040; }
.lb-btn-primary { background:#2a2008; border-color:#b09040; color:#c9a84c; }
.lb-btn-primary:hover { background:#3a2a10; border-color:#c9a84c; }
.lb-list-grid { display:flex; flex-direction:column; gap:8px; margin:16px 0; }
.lb-list-card { display:flex; align-items:center; gap:12px; background:#fdf3d7; border:1px solid #e8d48a; border-radius:4px; padding:12px 16px; cursor:pointer; transition:background .12s; }
.lb-list-card:hover { background:#f5e8a0; }
.lb-list-name { font-size:13pt; font-weight:700; color:#1a1a1a; flex:1; }
.lb-list-meta { font-size:9.5pt; color:#666; margin-top:2px; }
.lb-foc { display:flex; flex-wrap:wrap; gap:5px; margin-bottom:14px; padding:9px 12px; background:#f9f9f9; border:1px solid #e4e4e4; border-radius:4px; }
.lb-foc-chip { display:inline-flex; align-items:center; gap:4px; padding:2px 8px; border-radius:3px; font-size:8.5pt; font-weight:700; border:1px solid #ccc; }
.lb-foc-ok { border-color:#4a9a4a; background:#f0fff0; color:#2a6a2a; }
.lb-foc-warn { border-color:#b09040; background:#fffde0; color:#7a5800; }
.lb-foc-err { border-color:#c04040; background:#fff2f2; color:#802020; }
.lb-slot-head { font-size:9.5pt; font-weight:700; letter-spacing:.12em; text-transform:uppercase; color:#7a5800; border-bottom:1px solid #e8d48a; padding-bottom:3px; margin:16px 0 7px; }
.lb-entry { display:flex; align-items:center; gap:8px; padding:7px 11px; border:1px solid #e0e0e0; border-radius:4px; margin-bottom:5px; background:#fff; transition:border-color .12s; }
.lb-entry:hover { border-color:#c9a84c; background:#fdf9f0; }
.lb-entry-name { font-size:10.5pt; font-weight:700; color:#1a1a1a; flex:1; }
.lb-entry-pts { font-size:10pt; font-weight:700; color:#7a5800; white-space:nowrap; }
.lb-icon-btn { background:none; border:1px solid transparent; border-radius:3px; cursor:pointer; padding:2px 7px; font-size:10pt; color:#888; }
.lb-icon-btn:hover { background:#f0f0f0; color:#333; border-color:#ddd; }
.lb-icon-btn.danger:hover { background:#fff0f0; color:#c04040; border-color:#e8a0a0; }
.lb-entry-confirm { border-color:#e8a0a0 !important; background:#fff8f8 !important; }
.lb-del-confirm { font-family:'Rajdhani',sans-serif; font-size:8.5pt; font-weight:700; letter-spacing:.05em; text-transform:uppercase; padding:2px 10px; border-radius:3px; border:1px solid #c04040; background:#fff0f0; color:#c04040; cursor:pointer; white-space:nowrap; }
.lb-del-confirm:hover { background:#ffe0e0; border-color:#a02020; color:#a02020; }
.lb-modal-overlay { position:fixed; inset:0; background:rgba(0,0,0,.62); z-index:1000; display:flex; align-items:center; justify-content:center; padding:20px; }
.lb-modal { background:#fff; border-radius:6px; max-width:640px; width:100%; max-height:88vh; overflow-y:auto; padding:0 24px 24px; position:relative; }
.lb-modal-sticky { position:sticky; top:0; background:#fff; z-index:2; padding:24px 0 0; margin-bottom:0; }
.lb-modal-sticky-inner { padding-bottom:12px; border-bottom:1px solid #e8e4da; margin-bottom:4px; }
.lb-modal-head { font-size:16pt; font-weight:700; color:#1a1a1a; display:flex; align-items:center; justify-content:space-between; gap:12px; }
.lb-modal-pts { font-size:10pt; color:#7a5800; font-weight:700; margin-left:10px; }
.lb-modal-sub { font-size:9.5pt; color:#888; margin:2px 0 0; }
.lb-opt-section { margin:10px 0 0; }
.lb-opt-section-head { font-size:8.5pt; font-weight:700; letter-spacing:.12em; text-transform:uppercase; color:#7a5800; padding-bottom:2px; border-bottom:1px solid #e8d48a; margin-bottom:5px; }
.lb-exclusive-group { margin:6px 0 2px; padding:6px 8px 2px; background:#f9f7f2; border:1px solid #e0d4aa; border-radius:4px; }
.lb-exclusive-label { font-size:7.5pt; font-weight:700; letter-spacing:.12em; text-transform:uppercase; color:#9a7000; margin-bottom:4px; }
.lb-opt-row-exclusive { opacity:0.38; pointer-events:none; }
.lb-opt-group-head { font-size:9.5pt; font-weight:700; letter-spacing:.14em; text-transform:uppercase; color:#7a5800; margin:16px 0 4px; padding:3px 0 2px; border-top:1px solid #e8d48a; border-bottom:1px solid #e8d48a; background:#fffdf5; }
.lb-opt-row { display:flex; align-items:flex-start; justify-content:space-between; padding:5px 0; border-bottom:1px solid #f6f6f6; gap:10px; }
.lb-opt-row:last-child { border-bottom:none; }
.lb-opt-label { font-size:10pt; font-weight:600; color:#1a1a1a; flex:1; }
.lb-opt-pts { font-size:9pt; color:#7a5800; font-weight:600; }
.lb-opt-note { font-size:8.5pt; color:#888; font-style:italic; display:block; margin-top:1px; }
.lb-select { font-family:'Rajdhani',sans-serif; font-size:10pt; font-weight:600; padding:3px 8px; border:1px solid #ccc; border-radius:3px; background:#fff; cursor:pointer; }
.lb-num-ctrl { display:flex; align-items:center; gap:6px; }
.lb-num-btn { width:24px; height:24px; border:1px solid #bbb; border-radius:3px; background:#f5f5f5; cursor:pointer; font-size:14pt; line-height:1; display:flex; align-items:center; justify-content:center; color:#333; }
.lb-num-btn:hover { background:#e8e8e8; }
.lb-num-val { font-size:11pt; font-weight:700; min-width:22px; text-align:center; }
.lb-modal-actions { display:flex; gap:9px; justify-content:flex-end; margin-top:14px; padding-top:12px; border-top:1px solid #f0f0f0; }
.lb-pick-filter { display:flex; flex-wrap:wrap; gap:5px; margin-bottom:10px; }
.lb-pick-slot-head { font-size:8.5pt; font-weight:700; letter-spacing:.12em; text-transform:uppercase; color:#7a5800; border-bottom:1px solid #e8d48a; padding-bottom:2px; margin:10px 0 5px; }
.lb-platoon-squads { margin: 2px 0 6px 18px; border-left: 2px solid #e8d48a; padding-left: 10px; display: flex; flex-direction: column; gap: 3px; }
.lb-squad-entry { display:flex; align-items:center; gap:8px; padding:5px 10px; border:1px solid #eeeeee; border-radius:3px; background:#fafafa; cursor:pointer; transition:border-color .12s, background .12s; }
.lb-squad-entry:hover { border-color:#c9a84c; background:#fdf9f0; }
.lb-squad-name { font-size:9.5pt; font-weight:600; color:#333; flex:1; }
.lb-joined-ic-inline { font-size:9pt; font-weight:400; color:#7a5800; cursor:pointer; text-decoration:underline; }
.lb-pick-row { display:flex; align-items:center; gap:10px; padding:5px 9px; border:1px solid #e8e8e8; border-radius:3px; cursor:pointer; margin-bottom:3px; }
.lb-pick-row:hover { background:#fdf3d7; border-color:#c9a84c; }
.lb-pick-name { font-size:10pt; font-weight:700; flex:1; color:#1a1a1a; }
.lb-pick-pts { font-size:9.5pt; color:#7a5800; font-weight:600; }
.lb-battle-entry { display:flex; align-items:center; gap:10px; padding:8px 14px; border:1px solid #e0e0e0; border-radius:4px; cursor:pointer; background:#fff; transition:border-color .12s; margin-bottom:4px; }
.lb-battle-entry.lb-active { border-color:#c9a84c; background:#fdf3d7; }
.lb-battle-entry:hover { border-color:#c9a84c; }
.lb-battle-name { font-size:11pt; font-weight:700; color:#1a1a1a; flex:1; }
.lb-battle-pts { font-size:9.5pt; color:#7a5800; font-weight:600; white-space:nowrap; }
.lb-resolved-head { font-weight:700; font-size:10pt; letter-spacing:.12em; text-transform:uppercase; color:#7a5800; border-bottom:2px solid #e8d48a; padding-bottom:2px; margin:12px 0 7px; }
.lb-collapse-head { cursor:pointer; display:flex; align-items:center; gap:6px; }
.lb-collapse-head:hover { opacity:0.7; }
.lb-collapse-icon { font-size:9pt; color:#888; font-weight:400; letter-spacing:0; text-transform:none; }
.rules-names-only-btn { font-family:inherit; font-size:7.5pt; font-weight:600; letter-spacing:0.08em; text-transform:uppercase; color:#7a5800; background:none; border:1px solid #e8d48a; border-radius:3px; padding:1px 7px; cursor:pointer; line-height:1.5; flex-shrink:0; }
.rules-names-only-btn:hover { background:#fffdf5; }
.lb-permodel-tbl { width:100%; border-collapse:collapse; font-size:9pt; margin:4px 0 8px; }
.lb-permodel-tbl td { padding:2px 6px; border-bottom:1px solid #f0f0f0; }
.lb-permodel-tbl td:first-child { font-weight:600; color:#555; width:30%; }
.lb-permodel-tbl tr:last-child td { border-bottom:none; }
.lb-pts-bar { background:#e0e0e0; border-radius:3px; height:5px; margin:4px 0 0; overflow:hidden; flex:0 0 100%; order:99; }
.lb-pts-fill { background:#7a5800; height:100%; border-radius:3px; transition:width .2s; }
.lb-pts-fill.over { background:#c04040; }
.lb-foc-slots { display:flex; flex-wrap:wrap; gap:6px; margin-bottom:12px; }
.lb-foc-slot-btn { font-family:'Rajdhani',sans-serif; font-size:9pt; font-weight:700; letter-spacing:.08em; text-transform:uppercase; padding:5px 12px; border-radius:3px; cursor:pointer; border:1px solid #b09040; background:transparent; color:#7a5800; display:inline-flex; align-items:center; gap:7px; transition:background .12s, border-color .12s; white-space:nowrap; line-height:1.3; }
.lb-foc-slot-btn:hover { background:#fdf3d7; border-color:#7a5800; }
.lb-foc-slot-err { border-color:#c04040; color:#802020; background:#fff2f2; }
.lb-foc-slot-err:hover { background:#ffe4e4; border-color:#c04040; }
.lb-foc-slot-count { font-weight:500; font-size:8pt; letter-spacing:0; text-transform:none; opacity:0.75; }
@media (max-width:768px) {
  .lb-modal { padding:0 16px 16px; }
  .lb-modal-sticky { padding:16px 0 0; }
  .lb-list-name { font-size:12pt; }
  .lb-entry-name { font-size:10pt; }
  .lb-pick-filter { gap:4px; }
  .lb-foc-slot-btn { font-size:10pt; padding:6px 13px; }
}
`;

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

function saveState(file, hiddenUnits, selectedSubfaction, activePage, scrollY) {
  try {
    localStorage.setItem(stateKey(file), JSON.stringify({
      hidden: [...hiddenUnits],
      subfaction: selectedSubfaction,
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
      activePage:         typeof s.page === 'string' && s.page ? s.page : 'list-builder',
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
  if (!ids) return "—";
  if (typeof ids === "string") return ids || "—";
  if (!ids.length) return "—";
  return ids.map(id => {
    const r = (coreRules||[]).find(r => r.id === id) || (armyRules||[]).find(r => r.id === id);
    return r ? r.name : id;
  }).join(", ");
}

function slotLimitStr(limits, slotName?: string) {
  if (!limits) return null;
  if (slotName === "Advisor") return "0–3 per Troop";
  if (slotName === "Ded. Transport") return "0–1 per transportable unit";
  if (slotName === "Fortification") return "0–1 per 1000pts";
  const [min, max] = limits;
  if (min === max) return `${min} slot${min !== 1 ? 's' : ''}`;
  if (max === null) return min > 0 ? `${min}+ slots` : "0+ slots";
  return `${min}–${max} slots`;
}

// ── List Builder Utilities ───────────────────────────────────────────────────

function toRoman(n: number): string {
  if (n < 1) return String(n);
  const vals = [1000,900,500,400,100,90,50,40,10,9,5,4,1];
  const syms = ["M","CM","D","CD","C","XC","L","XL","X","IX","V","IV","I"];
  let r = ""; for (let i = 0; i < vals.length; i++) while (n >= vals[i]) { r += syms[i]; n -= vals[i]; } return r;
}
function genId(): string { return Math.random().toString(36).slice(2, 10); }

const listsKey = (f: string) => `alt40k-lists-${f}`;
function loadLists(file: string): any[] {
  try { const r = localStorage.getItem(listsKey(file)); return r ? JSON.parse(r) : []; } catch { return []; }
}
function saveLists(file: string, lists: any[]) {
  try { localStorage.setItem(listsKey(file), JSON.stringify(lists)); } catch {}
}

function resolveChoicesForOpt(o: any, wL: any): any[] {
  if (o.weaponListId && wL[o.weaponListId]) {
    const ov = o.ptsOverrides || {};
    return wL[o.weaponListId].map((c: any) => ({ ...c, pts: ov[c.weaponId] ?? c.pts }));
  }
  return o.choices || [];
}

// Like resolveChoicesForOpt but filters/extends by active subfaction for UI rendering.
// Cost calculation still uses resolveChoicesForOpt (full list) so stale selections
// don't break pricing if the user later switches subfactions.
function resolveChoicesForDisplay(o: any, wL: any, subfactionId?: string): any[] {
  let choices = resolveChoicesForOpt(o, wL);
  choices = choices.filter((c: any) => !c.subfaction || c.subfaction === subfactionId);
  if (subfactionId) {
    const extra = (o.subfactionChoices || []).find((sc: any) => sc.subfaction === subfactionId);
    if (extra?.choices?.length) choices = [...choices, ...extra.choices];
  }
  return choices;
}

// returns true if this weaponSwap option targets a model type with maxCount > 1
function isMultiModelSwap(o: any, unit: any): boolean {
  return (o.applies||[]).some((mid: string) => {
    const model = (unit.models||[]).find((m: any) => m.id === mid);
    return !!model && model.maxCount > 1;
  });
}

// sum of model counts across all applies IDs (including squad size additions)
function totalAppliesCount(unit: any, opt: any, options: any): number {
  return (opt.applies||[]).reduce((s: number, mid: string) => s + modelTypeCount(unit, mid, options), 0);
}

// total count of a model type including any squadSize additions
function modelTypeCount(unit: any, modelId: string, options: any): number {
  const model = (unit.models||[]).find((m: any) => m.id === modelId);
  if (!model) return 1;
  const sq = (unit.options||[]).find((o: any) => o.type === "squadSize" && o.targetModelId === modelId);
  return (model.minCount ?? 0) + (sq ? (options[sq.id] || 0) : 0);
}

// how many models sharing applies+replaces have already consumed slots
function poolUsed(unit: any, applies: string[], replacesId: string, options: any): number {
  let used = 0;
  for (const o of (unit.options||[])) {
    if (o.type !== "weaponSwap") continue;
    if (!(o.applies||[]).some((mid: string) => applies.includes(mid))) continue;
    if (o.replaces !== replacesId && !(o.alsoReplaces||[]).includes(replacesId)) continue;
    const v = options[o.id];
    if (o.scope === "perModelType" && isMultiModelSwap(o, unit)) {
      if (typeof v === "number") used += v;
      else if (v && typeof v === "object") used += Object.values(v as Record<string,number>).reduce((s: number, n: any) => s+n, 0);
    } else if (o.scope === "limitedSlot") {
      if ((o.slots||1) > 1 && v && typeof v === "object")
        used += Object.values(v as Record<string,number>).reduce((s: number, n: any) => s+n, 0);
      else if (v != null) used += 1;
    }
  }
  return used;
}

// minimum additional squad size allowed given currently assigned options
function minSquadSizeAdditional(unit: any, sqOpt: any, options: any): number {
  const model = (unit.models||[]).find((m: any) => m.id === sqOpt.targetModelId);
  const minCount = model?.minCount ?? 0;
  let minAdditional = 0;
  const seenPools = new Set<string>();
  for (const swap of (unit.options||[])) {
    if (swap.type !== "weaponSwap") continue;
    if (!(swap.applies||[]).includes(sqOpt.targetModelId)) continue;
    const poolKey = `${[...(swap.applies||[])].sort().join(',')}|${swap.replaces}`;
    if (seenPools.has(poolKey)) continue;
    seenPools.add(poolKey);
    const used = poolUsed(unit, swap.applies||[], swap.replaces, options);
    if (used <= 0) continue;
    const otherCount = (swap.applies||[])
      .filter((mid: string) => mid !== sqOpt.targetModelId)
      .reduce((s: number, mid: string) => s + modelTypeCount(unit, mid, options), 0);
    const requiredFromThis = Math.max(0, used - otherCount);
    minAdditional = Math.max(minAdditional, Math.max(0, requiredFromThis - minCount));
  }
  return minAdditional;
}

// total model count across all model types
function totalUnitModels(unit: any, options: any): number {
  return (unit.models||[]).reduce((s: number, m: any) => s + modelTypeCount(unit, m.id, options), 0);
}

// how many slots a limitedSlot option provides (scales with squad size if slotsPerN set)
function availableSlots(o: any, unit: any, options: any): number {
  const slots = o.slots || 1;
  if (!o.slotsPerN) return slots;
  return slots * Math.floor(totalUnitModels(unit, options) / o.slotsPerN);
}

function defaultOpts(unit: any, wL: any): Record<string, any> {
  const out: Record<string, any> = {};
  if (unit.platoon) {
    for (const pu of (unit.platoonUnits || [])) out[pu.id] = pu.minSquads ?? 0;
    return out;
  }
  for (const o of (unit.options || [])) {
    if (o.type === "squadSize") out[o.id] = 0;
    else if (o.type === "toggle") out[o.id] = false;
    else if (o.type === "namedUpgrade") out[o.id] = false;
    else if (o.type === "markPick") out[o.id] = null;
    else if (o.type === "pureBlessingPick") out[o.id] = false;
    else if (o.type === "spellPick") out[o.id] = [];
    else if (o.type === "weaponSwap") {
      if (o.scope === "limitedSlot") {
        out[o.id] = (o.slots||1) > 1 ? {} : null;
      } else if (o.scope === "perModelType" && isMultiModelSwap(o, unit)) {
        out[o.id] = {};  // { weaponId: count }
      } else {
        // scope: "unit" or perModelType single-model
        const ch = resolveChoicesForOpt(o, wL);
        out[o.id] = ch[0]?.weaponId ?? null;
      }
    }
  }
  return out;
}

function defaultPerModel(unit: any): Record<string, Record<string, string>> {
  const out: Record<string, Record<string, string>> = {};
  for (const o of (unit.options || [])) {
    if (o.type === "perModelWeapon") {
      const ch = o.choices || []; if (!ch[0]) continue;
      const model = (unit.models || []).find((m: any) => (o.applies || []).includes(m.id));
      const modelCount = model?.minCount ?? 1;
      const weaponCount = (model?.baseWargear || []).filter((r: any) => {
        const wid = typeof r === 'string' ? r : r.weaponId;
        if (wid !== o.replaces) return false;
        if (o.replacesArcType && typeof r !== 'string' && r.arcType !== o.replacesArcType) return false;
        return true;
      }).length || 1;
      const count = modelCount * weaponCount;
      out[o.id] = {};
      for (let i = 0; i < count; i++) out[o.id][String(i)] = ch[0].weaponId;
    } else if (o.type === "perModelToggle") {
      const applyModels = (unit.models || []).filter((m: any) => (o.applies || []).includes(m.id));
      const totalCount = applyModels.reduce((s: number, m: any) => s + (m.minCount ?? 1), 0);
      out[o.id] = {};
      for (let i = 0; i < totalCount; i++) out[o.id][String(i)] = "0";
    }
  }
  return out;
}

function calcEntryCost(entry: any, unit: any, fd: any): number {
  if (unit.platoon) {
    return (entry.squads || []).reduce((sum: number, squad: any) => {
      const pu = (unit.platoonUnits || []).find((p: any) => p.id === squad.puId);
      if (!pu) return sum;
      return sum + calcEntryCost({ options: squad.options || {}, perModelOptions: squad.perModelOptions || {} }, pu, fd);
    }, 0);
  }
  let c = unit.basePts;
  const wL = fd.weaponLists || {}, sP = fd.spellPools || {};

  // Mirror the UI's isSwapHidden logic: build removed-weapon sets from active toggles/namedUpgrades
  const _grw = new Map<string | null, Set<string>>();
  const _nU = fd.namedUpgrades || {};
  for (const o of (unit.options || [])) {
    if (!entry.options?.[o.id]) continue;
    const removesW: any[] = o.type === "namedUpgrade"
      ? (_nU[o.upgradeId]?.removesWargear || [])
      : o.type === "toggle" ? [
          ...(o.removesWargear || []),
          ...((o.grantsWargear || []).flatMap((wid: string) => {
            const item = (fd.commonWargear || []).find((x: any) => x.id === wid);
            return item?.removesWargear || [];
          }))
        ] : [];
    if (!removesW.length) continue;
    const grp: string | null = o.upgradeGroup ?? null;
    if (!_grw.has(grp)) _grw.set(grp, new Set());
    for (const w of removesW) _grw.get(grp)!.add(typeof w === "string" ? w : w.weaponId);
  }
  const _swapHidden = (o: any) => {
    if (!o.replaces) return false;
    const grp: string | null = o.upgradeGroup ?? null;
    return !!(_grw.get(null)?.has(o.replaces) || (grp !== null && _grw.get(grp)?.has(o.replaces)));
  };

  for (const o of (unit.options || [])) {
    const v = entry.options?.[o.id];
    if (o.type === "squadSize" && v != null) c += (v as number) * o.ptsEach;
    else if ((o.type === "toggle" || o.type === "namedUpgrade") && v) c += o.ptsPerModel ? o.ptsPerModel * totalUnitModels(unit, entry.options || {}) : (o.pts || 0);
    else if (o.type === "markPick" && v) {
      const ch = (o.choices||[]).find((x: any) => x.markId === v);
      if (ch) c += (ch.ptsPerModel || 0) * totalUnitModels(unit, entry.options || {});
    }
    else if (o.type === "pureBlessingPick" && v) {
      const reqOpt = (unit.options||[]).find((x: any) => x.id === o.requiresOptionId);
      const mark = reqOpt ? entry.options?.[reqOpt.id] : null;
      const ch = (o.choices||[]).find((x: any) => x.markId === mark);
      if (ch) c += ch.pts || 0;
    }
    else if (o.type === "weaponSwap") {
      if (_swapHidden(o)) continue;
      if (o.scope === "limitedSlot") {
        const choices = resolveChoicesForOpt(o, wL);
        if ((o.slots||1) > 1 && v && typeof v === "object") {
          for (const [wid, cnt] of Object.entries(v as Record<string,number>)) {
            const ch = choices.find((x: any) => x.weaponId === wid);
            c += (cnt as number) * (ch?.pts || 0);
          }
        } else if (v != null && typeof v === "string") {
          const ch = choices.find((x: any) => x.weaponId === v);
          if (ch) c += ch.pts || 0;
        }
      } else if (o.scope === "perModelType" && isMultiModelSwap(o, unit)) {
        const choices = resolveChoicesForOpt(o, wL);
        if (typeof v === "number") {
          c += v * (choices[0]?.pts || 0);
        } else if (v && typeof v === "object") {
          for (const [wid, cnt] of Object.entries(v as Record<string, number>)) {
            const ch = choices.find((x: any) => x.weaponId === wid);
            c += cnt * (ch?.pts || 0);
          }
        }
      } else if (v != null) {
        const ch = resolveChoicesForOpt(o, wL).find((x: any) => x.weaponId === v);
        if (ch) {
          const applyCount = o.ptsPerModel
            ? totalAppliesCount(unit, o, entry.options || {}) - poolUsed(unit, o.applies || [], o.replaces, entry.options || {})
            : 1;
          c += (ch.pts || 0) * applyCount;
        }
      }
    }
    else if (o.type === "spellPick" && Array.isArray(v)) {
      const rawPoolId = o.spellPoolId || unit.psychic?.spellPoolId || "";
      const resolvedId = rawPoolId === "$mark"
        ? (() => { const mOpt = (unit.options||[]).find((x: any) => x.type === "markPick"); return mOpt ? (entry.options?.[mOpt.id] || "") : ""; })()
        : rawPoolId;
      const pool = sP[resolvedId] || [];
      for (const sid of v as string[]) { const s = pool.find((x: any) => x.id === sid); if (s) c += s.pts || 0; }
    }
  }
  for (const o of (unit.options || [])) {
    if (o.type !== "perModelWeapon") continue;
    for (const idx of Object.keys(entry.perModelOptions?.[o.id] || {})) {
      const wid = entry.perModelOptions[o.id][idx];
      const ch = (o.choices || []).find((x: any) => x.weaponId === wid);
      if (ch) c += ch.pts || 0;
    }
  }
  for (const o of (unit.options || [])) {
    if (o.type !== "perModelToggle") continue;
    for (const countStr of Object.values(entry.perModelOptions?.[o.id] || {})) {
      c += (parseInt(countStr as string) || 0) * (o.ptsEach || 0);
    }
  }
  const seenExcGroups = new Set<string>();
  for (const o of (unit.options || [])) {
    if ((o.type !== "toggle" && o.type !== "namedUpgrade") || !o.applies || !o.exclusiveGroup) continue;
    if (seenExcGroups.has(o.exclusiveGroup)) continue;
    seenExcGroups.add(o.exclusiveGroup);
    const groupOpts = (unit.options || []).filter((x: any) => x.exclusiveGroup === o.exclusiveGroup);
    const modelSelections: Record<string,string> = entry.perModelOptions?.[o.exclusiveGroup] || {};
    for (const selectedId of Object.values(modelSelections)) {
      if (!selectedId) continue;
      const selOpt = groupOpts.find((x: any) => x.id === selectedId);
      if (selOpt) c += selOpt.pts || 0;
    }
  }
  return c;
}

function calcListTotal(list: any, fd: any): number {
  const units = fd.units || [];
  return (list.entries || []).reduce((s: number, e: any) => {
    const u = units.find((x: any) => x.id === e.unitId);
    return s + (u ? calcEntryCost(e, u, fd) : 0);
  }, 0);
}

function effectiveSlot(unitId: string, baseSlot: string, subfaction: any): string {
  if (!subfaction) return baseSlot;
  const r = (subfaction.slotReclassifications || []).find((x: any) => x.unitId === unitId);
  return r ? (r.toSlot || r.newSlot || baseSlot) : baseSlot;
}

const TRANSPORTABLE_RULES = new Set(["infantry", "bulky", "very-bulky"]);

function buildFOC(entries: any[], faction: any, subfaction: any, allUnits: any[] = [], battleLimit: number = 0, namedUpgrades: any = {}) {
  const limits = faction.slotLimits || {};
  const counts: Record<string, number> = {};
  for (const e of entries) counts[e.slot] = (counts[e.slot] || 0) + 1;

  const troopCount = counts["Troop"] || 0;
  const transportableCount = entries.filter(e => {
    const unit = allUnits.find((u: any) => u.id === e.unitId);
    if (!unit) return false;
    const hasTransportable = (unit.models || []).some((m: any) =>
      (m.specialRules || []).some((r: string) => TRANSPORTABLE_RULES.has(r))
    );
    return hasTransportable && !entryHasSteed(e, unit, namedUpgrades);
  }).length;
  const fortLimit = Math.floor(battleLimit / 1000);

  return SLOT_ORDER.filter(s => limits[s]).map(s => {
    const [mn, mx] = limits[s]; const cnt = counts[s] || 0;
    let mxSafe: number | null = (mx === undefined ? null : mx);
    if (s === "Advisor") mxSafe = troopCount * 3;
    if (s === "Ded. Transport") mxSafe = transportableCount;
    if (s === "Fortification") mxSafe = fortLimit;
    return { slot: s, count: cnt, min: mn, max: mxSafe, ok: cnt >= mn && (mxSafe === null || cnt <= mxSafe) };
  });
}

function buildDisplayNames(entries: any[], units: any[]): Map<string, string> {
  const byUnitId: Record<string, string[]> = {};
  for (const e of entries) { if (!byUnitId[e.unitId]) byUnitId[e.unitId] = []; byUnitId[e.unitId].push(e.entryId); }
  const m = new Map<string, string>();
  for (const e of entries) {
    const u = units.find((x: any) => x.id === e.unitId);
    const base = u?.name || e.unitId;
    const ids = byUnitId[e.unitId];
    m.set(e.entryId, ids.length === 1 ? base : `${base} ${toRoman(ids.indexOf(e.entryId) + 1)}`);
  }
  return m;
}


function unitHasRule(unit: any, rule: string): boolean {
  return (unit.models || []).some((m: any) => (m.specialRules || []).includes(rule));
}
function isICInfantry(unit: any): boolean {
  return unitHasRule(unit, 'independent-character') && unitHasRule(unit, 'infantry');
}
function isDedicatedTransport(unit: any): boolean {
  return unit.slot === 'Ded. Transport';
}
function canJoinUnit(unit: any): boolean {
  return isICInfantry(unit) || isDedicatedTransport(unit);
}
function isJoinableUnit(unit: any): boolean {
  return unitHasRule(unit, 'infantry') || unitHasRule(unit, 'monstrous-infantry');
}
function entryHasSteed(entry: any, unit: any, namedUpgrades: any = {}): boolean {
  if (unitHasRule(unit, 'steed')) return true;
  for (const o of (unit.options || [])) {
    if (!entry?.options?.[o.id]) continue;
    const nUpg = o.type === 'namedUpgrade' ? (namedUpgrades[o.upgradeId] || null) : null;
    const grantsR: string[] = nUpg?.grantsRules || o.grantsRules || [];
    if (grantsR.includes('steed')) return true;
  }
  return false;
}

function isRealWeapon(w) {
  return w?.profiles?.some(p => p.strength !== "-");
}

function StatTable({ models, statDeltas = null, invSaves = null }: any) {
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
            {usedCols.map(c => {
              const base = m.statline?.[c];
              const delta: number = statDeltas?.get(m.id)?.[c] ?? 0;
              const inv: number | null = c === "Sv" ? (invSaves?.get(m.id) ?? null) : null;
              if ((delta !== 0 && typeof base === "number") || inv !== null) {
                const arrow = delta > 0 ? "▲" : "▼";
                return (
                  <td key={c} style={{whiteSpace:"nowrap"}}>
                    {delta !== 0 && typeof base === "number" ? fmtStat(base + delta, c) : fmtStat(base, c)}
                    {delta !== 0 && typeof base === "number" && (
                      <span style={{fontSize:"7pt",color:delta>0?"#2a7a2a":"#b00",marginLeft:2,fontWeight:700}}>
                        {arrow}{Math.abs(delta)}
                      </span>
                    )}
                    {inv !== null && (
                      <span style={{fontSize:"7pt",color:"#2a7a2a",marginLeft:3,fontWeight:700}}>
                        {inv}+inv
                      </span>
                    )}
                  </td>
                );
              }
              return <td key={c}>{fmtStat(base, c)}</td>;
            })}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

// Build synthetic rules for transport and psychic from unit-level data
function buildSyntheticRules(unit, coreRules, armyRules, entryOptions?: any) {
  const synthetic = [];

  if (unit.transport) {
    const t = unit.transport;
    const parts = [`Capacity ${t.capacity}`];
    if (t.firePorts?.length) parts.push(`Fire Ports: ${t.firePorts.join(", ")}`);
    if (t.accessPoints?.length) parts.push(`Access: ${t.accessPoints.join(", ")}`);
    const unitDetails = parts.join(" · ");
    const coreRule = (coreRules||[]).find(r => r.id === "transport");
    const coreDesc = coreRule?.fullDesc || coreRule?.shortDesc || "";
    synthetic.push({
      id: "__transport__",
      name: `Transport ${t.capacity}`,
      shortDesc: unitDetails,
      fullDesc: [unitDetails, coreDesc].filter(Boolean).join(". "),
    });
  }

  if (unit.psychic) {
    const p = unit.psychic;
    const masteryUpgradeOpt = (unit.options||[]).find((o: any) => o.grantsMasteryLevel != null);
    const effectiveML: number = (entryOptions && masteryUpgradeOpt && entryOptions[masteryUpgradeOpt.id])
      ? masteryUpgradeOpt.grantsMasteryLevel
      : (p.masteryLevel ?? 0);
    const parts = [`Mastery Level ${effectiveML}`];
    if (p.denyBonusPerPhase) parts.push(`+${p.denyBonusPerPhase} Deny per phase`);
    const unitDetails = parts.join(" · ");
    const coreRule = (coreRules||[]).find((r: any) => r.id === "psychic-mastery");
    const coreDesc = coreRule?.fullDesc || coreRule?.shortDesc || "";
    synthetic.push({
      id: "__psychic__",
      name: `Psychic Mastery ${effectiveML}`,
      shortDesc: unitDetails,
      fullDesc: [unitDetails, coreDesc].filter(Boolean).join(". "),
    });
  }

  return synthetic;
}

function compStr(models) {
  return models.map(m => { const mn = m.minCount ?? 0; return mn===m.maxCount ? `${mn} ${m.name}` : `${mn}–${m.maxCount} ${m.name}`; }).join(" + ");
}

function resolvedCompStr(unit: any, options: any) {
  return (unit.models || []).map((m: any) => `${modelTypeCount(unit, m.id, options)} ${m.name}`).join(" + ");
}

// ── Print mode: special rules as definition list ─────────────────────────────
function DetailSpecialRules({ unit, models, armyRules, coreRules, inlineRules, entryOptions = null, collapsed = false, onToggle = null }: any) {
  const [namesOnly, setNamesOnly] = useState(() => {
    try { return localStorage.getItem("alt40k-rules-names-only") === "1"; } catch { return false; }
  });
  const [ruleDialog, setRuleDialog] = useState<{ name: string; desc: string } | null>(null);
  function toggleNamesOnly(e: React.MouseEvent) {
    e.stopPropagation();
    setNamesOnly(v => {
      const next = !v;
      try { localStorage.setItem("alt40k-rules-names-only", next ? "1" : "0"); } catch {}
      return next;
    });
  }
  const synthetic = buildSyntheticRules(unit, coreRules, armyRules, entryOptions);
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
      <div className={`section-head${onToggle ? " lb-collapse-head" : ""}`}
           style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}
           onClick={onToggle || undefined}>
        <span style={{display:"flex",alignItems:"center",gap:6}}>
          {onToggle && <span className="lb-collapse-icon">{collapsed ? "▶" : "▼"}</span>}
          Special Rules
        </span>
        {!collapsed && (
          <button className="rules-names-only-btn" onClick={toggleNamesOnly}>
            {namesOnly ? "Show full rules" : "Names only"}
          </button>
        )}
      </div>
      {!collapsed && (
        <div className="two-col" style={{marginTop:0}}>
          {deduped.map(id => {
            const rule = ruleById(id, armyRules, coreRules, allInline);
            const modelNote = specific.find(r => r.id === id)?.label;
            const isInline = allInline.some(r => r.id === id);
            const desc = isInline ? rule?.fullDesc : (rule?.fullDesc || rule?.shortDesc);
            const ruleName = rule?.name || idToLabel(id);
            return (
              <div key={id} className="col-block-tight">
                <li className="rules-detail-li" style={{listStyle:"none", padding:"1px 0", lineHeight:1.4}}>
                  {namesOnly && desc
                    ? <span className="rule-name rule-name-clickable" onClick={() => setRuleDialog({ name: ruleName, desc })}>{ruleName}</span>
                    : <span className="rule-name">{ruleName}</span>
                  }
                  {modelNote && <span style={{fontSize:"8pt",color:"#888",marginLeft:4}}>({modelNote})</span>}
                  {!namesOnly && (rule
                    ? desc && <span> — {desc}</span>
                    : <span style={{color:"#888",fontStyle:"italic"}}> — Keyword only</span>
                  )}
                </li>
              </div>
            );
          })}
        </div>
      )}
      {ruleDialog && (
        <div className="lb-modal-overlay" onPointerDown={e => { if (e.target === e.currentTarget) setRuleDialog(null); }}>
          <div className="lb-modal" style={{maxWidth:400}}>
            <div className="lb-modal-sticky">
              <div className="lb-modal-sticky-inner">
                <div className="lb-modal-head">
                  <span>{ruleDialog.name}</span>
                  <button className="lb-icon-btn" onClick={() => setRuleDialog(null)}>✕</button>
                </div>
              </div>
            </div>
            <p style={{fontSize:"10pt",lineHeight:1.5,color:"#333",margin:"12px 0 0"}}>{ruleDialog.desc}</p>
          </div>
        </div>
      )}
    </>
  );
}

// ── Print mode: options with full weapon profiles ─────────────────────────────
function DetailOptionsSection({ unit, weapons, weaponLists, namedUpgrades, spellPools, armyRules, coreRules, inlineRules, collapsed = false, onToggle = null }: any) {
  const opts = unit.options || [];
  const hasBaseWargear = unit.models.some(m => (m.baseWargear||[]).length > 0);
  if (!opts.length && !hasBaseWargear) return null;

  const allInline = [...(inlineRules||[]), ...(unit.inlineRules||[])];
  function upgradeDesc(o: any, named: any): string | undefined {
    const granted = (o.grantsRules || named?.grantsRules || []);
    if (granted.length === 1) {
      const rule = allInline.find(r => r.id === granted[0]);
      if (rule?.fullDesc) return rule.fullDesc;
    }
    return named?.note || o.note;
  }

  function resolveChoices(opt) {
    if (opt.weaponListId && weaponLists[opt.weaponListId]) {
      const base = weaponLists[opt.weaponListId];
      const ov = opt.ptsOverrides || {};
      return base.map(c => ({ ...c, pts: ov[c.weaponId] ?? c.pts }));
    }
    return opt.choices || [];
  }

  function WepProfileTable({ refs, showArc }) {
    const resolved = refs.map(r => ({ ...resolveRef(r), weapon: wepById(resolveRef(r).weaponId, weapons) }));
    const seenR = new Set<string>(); const seenP = new Set<string>();
    const rows = resolved.filter(r => { if (!r.weapon || seenR.has(r.weaponId) || (!isRealWeapon(r.weapon) && !r.weapon.profiles?.some((p: any) => p.rules))) return false; seenR.add(r.weaponId); return true; });
    const wargearOnly = resolved.filter(r => { if (!r.weapon || seenP.has(r.weaponId) || isRealWeapon(r.weapon) || r.weapon.profiles?.some((p: any) => p.rules)) return false; seenP.add(r.weaponId); return true; });
    if (!rows.length && !wargearOnly.length) return null;
    return (
      <>
        {rows.length > 0 && (
          <table className="wep-table">
            <colgroup>
              <col style={{width:"30%"}}/>
              {showArc && <col style={{width:"8%"}}/>}
              <col style={{width:"13%"}}/>
              <col style={{width:"8%"}}/>
              <col style={{width:"8%"}}/>
              <col/>
            </colgroup>
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
                if (!isRealWeapon(w)) {
                  const rulesText = w.profiles?.map((p: any) => p.rules).filter(Boolean).join("; ") || "—";
                  return (
                    <tr key={ri} className={sc}>
                      <td>{w.name}</td>
                      {showArc && <td className="arc-col">{r.arcType||""}</td>}
                      <td>—</td><td>—</td><td>—</td>
                      <td className="rules-col">{rulesText}</td>
                    </tr>
                  );
                }
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
        )}
        {wargearOnly.length > 0 && (
          <div className="pills">
            {wargearOnly.map((r, i) => <span key={i} className="pill"><span className="pill-name">{r.weapon.name}</span></span>)}
          </div>
        )}
      </>
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

  const ungroupedUpgrades2 = upgradeOpts.filter(o => !o.upgradeGroup);
  const ungroupedSwaps2    = swapOpts.filter(o => !o.upgradeGroup);
  const ungroupedPerModel2 = perModelOpts.filter(o => !o.upgradeGroup);
  const upgradeGroupMap2 = new Map<string, any[]>();
  for (const o of opts) {
    if (o.upgradeGroup) {
      if (!upgradeGroupMap2.has(o.upgradeGroup)) upgradeGroupMap2.set(o.upgradeGroup, []);
      upgradeGroupMap2.get(o.upgradeGroup)!.push(o);
    }
  }

  function stripGroupPrefix2(label: string, groupName: string): string {
    const p1 = groupName + ": ";
    const p2 = groupName + " — ";
    if (label.startsWith(p1)) return label.slice(p1.length);
    if (label.startsWith(p2)) return label.slice(p2.length);
    return label;
  }

  function renderSwapTable(o: any, groupName?: string) {
    const choices = resolveChoices(o).filter(c => c.pts);
    if (!choices.length) return null;
    const headLabel = groupName ? stripGroupPrefix2(o.label, groupName) : o.label;
    return (
      <div key={o.id} className="col-block">
        <div className="group-head">{headLabel}</div>
        <table className="wep-table">
          <colgroup>
            <col style={{width:"28%"}}/>
            <col style={{width:"13%"}}/>
            <col style={{width:"7%"}}/>
            <col style={{width:"7%"}}/>
            <col/>
            <col style={{width:"12%"}}/>
          </colgroup>
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
  }

  function renderPerModelTable(o: any, groupName?: string) {
    const choices = (o.choices||[]).filter(c => c.pts);
    if (!choices.length) return null;
    const headLabel = groupName ? stripGroupPrefix2(o.label, groupName) : o.label;
    return (
      <div key={o.id} className="col-block">
        <div className="group-head">{headLabel} <span style={{fontWeight:400,fontSize:"8.5pt",color:"#888"}}>(per model)</span></div>
        <table className="wep-table">
          <colgroup>
            <col style={{width:"28%"}}/>
            <col style={{width:"13%"}}/>
            <col style={{width:"7%"}}/>
            <col style={{width:"7%"}}/>
            <col/>
            <col style={{width:"12%"}}/>
          </colgroup>
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
  }

  return (
    <>
      <div className={`section-head${onToggle ? " lb-collapse-head" : ""}`} onClick={onToggle || undefined}>
        {onToggle && <span className="lb-collapse-icon">{collapsed ? "▶" : "▼"}</span>}
        Wargear &amp; Options
      </div>
      {!collapsed && <div className="two-col">

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

        {ungroupedUpgrades2.length > 0 && (
          <div className="col-block">
            <div className="group-head">Upgrades</div>
            <ul className="option-list">
              {ungroupedUpgrades2.map(o => {
                const named = o.type==="namedUpgrade" ? namedUpgrades?.[o.upgradeId] : null;
                const note = upgradeDesc(o, named);
                return (
                  <li key={o.id}>{named?.label||o.label}
                    <span className="option-cost">{o.ptsPerModel > 0 ? ` +${o.ptsPerModel} pts per model` : ` +${o.pts} pts`}</span>
                    {note && <span className="upgrade-note">{note}</span>}
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        {ungroupedSwaps2.map(o => renderSwapTable(o))}
        {ungroupedPerModel2.map(o => renderPerModelTable(o))}

        {[...upgradeGroupMap2.entries()].map(([groupName, groupOpts]) => {
          const gUpgrades   = groupOpts.filter(o => o.type==="toggle" || o.type==="namedUpgrade");
          const gSwaps      = groupOpts.filter(o => o.type==="weaponSwap");
          const gPerModel   = groupOpts.filter(o => o.type==="perModelWeapon");
          return (
            <Fragment key={groupName}>
              <div className="upgrade-group-head">{groupName}</div>
              {gUpgrades.length > 0 && (
                <div className="col-block">
                  <div className="group-head">{groupName} Upgrades</div>
                  <ul className="option-list">
                    {gUpgrades.map(o => {
                      const named = o.type==="namedUpgrade" ? namedUpgrades?.[o.upgradeId] : null;
                      const note = upgradeDesc(o, named);
                      return (
                        <li key={o.id}>{named?.label||o.label}
                          <span className="option-cost">{o.ptsPerModel > 0 ? ` +${o.ptsPerModel} pts per model` : ` +${o.pts} pts`}</span>
                          {note && <span className="upgrade-note">{note}</span>}
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}
              {gSwaps.map(o => renderSwapTable(o, groupName))}
              {gPerModel.map(o => renderPerModelTable(o, groupName))}
            </Fragment>
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

      </div>}
    </>
  );
}

function UnitSearch({ allUnits, hiddenUnits, onSelect }) {
  const [query, setQuery] = useState("");
  const wrapRef = useRef(null);
  const dropRef = useRef<HTMLDivElement>(null);
  const [alignRight, setAlignRight] = useState(false);

  const results = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    return allUnits
      .filter(u => u.name.toLowerCase().includes(q))
      .slice(0, 12);
  }, [query, allUnits]);

  const open = query.trim().length > 0;

  useLayoutEffect(() => {
    if (!open) { setAlignRight(false); return; }
    if (alignRight || !dropRef.current) return;
    const rect = dropRef.current.getBoundingClientRect();
    if (rect.right > window.innerWidth - 8) setAlignRight(true);
  }, [open, results, alignRight]);

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
        autoComplete="off"
        placeholder="Find unit…"
        value={query}
        onChange={e => setQuery(e.target.value)}
        onKeyDown={e => e.key === "Escape" && setQuery("")}
      />
      {open && (
        <div ref={dropRef} className="nav-search-dropdown" style={alignRight ? {left:'auto',right:0} : undefined}>
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

function nameToId(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function RulesSearch({ coreRules, armyRules, commonWargearRef }) {
  const [query, setQuery] = useState("");
  const wrapRef = useRef(null);
  const dropRef = useRef<HTMLDivElement>(null);
  const [alignRight, setAlignRight] = useState(false);

  const allItems = useMemo(() => [
    ...(coreRules || []).map((r: any) => ({ id: `core-${r.id}`, name: r.name, desc: r.fullDesc || r.shortDesc || '' })),
    ...(armyRules || []).map((r: any) => ({ id: `army-${r.id}`, name: r.name, desc: r.fullDesc || r.shortDesc || '' })),
    ...(commonWargearRef || []).map((w: any) => ({ id: `wargear-${nameToId(w.name)}`, name: w.name, desc: w.desc || '' })),
  ], [coreRules, armyRules, commonWargearRef]);

  const results = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    return allItems
      .filter(item => item.name.toLowerCase().includes(q))
      .sort((a, b) => {
        const aStarts = a.name.toLowerCase().startsWith(q);
        const bStarts = b.name.toLowerCase().startsWith(q);
        if (aStarts !== bStarts) return aStarts ? -1 : 1;
        return a.name.localeCompare(b.name);
      })
      .slice(0, 8);
  }, [query, allItems]);

  const open = query.trim().length > 0;

  useLayoutEffect(() => {
    if (!open) { setAlignRight(false); return; }
    if (alignRight || !dropRef.current) return;
    const rect = dropRef.current.getBoundingClientRect();
    if (rect.right > window.innerWidth - 8) setAlignRight(true);
  }, [open, results, alignRight]);

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
        autoComplete="off"
        placeholder="Find rule…"
        value={query}
        onChange={e => setQuery(e.target.value)}
        onKeyDown={e => e.key === "Escape" && setQuery("")}
      />
      {open && (
        <div ref={dropRef} className="nav-search-dropdown rules-search-dropdown" style={alignRight ? {left:'auto',right:0} : undefined}>
          {results.length === 0
            ? <div className="nav-search-none">No rules found</div>
            : results.map(item => (
              <div key={item.id} className="nav-search-item rules-search-item">
                <div className="nav-search-name">{item.name}</div>
                <div className="rules-search-desc">{item.desc}</div>
              </div>
            ))
          }
        </div>
      )}
    </div>
  );
}

function PlatoonUnitBlock({ pu, weapons, weaponLists, namedUpgrades, armyRules, coreRules, spellPools, collapsedSections, toggleSection }: any) {
  const rulesCollapsed = collapsedSections?.has("specialRules") ?? false;
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
        <DetailSpecialRules unit={pu} models={pu.models} armyRules={armyRules} coreRules={coreRules} inlineRules={pu.inlineRules}
            collapsed={rulesCollapsed} onToggle={() => toggleSection("specialRules")}/>
        <DetailOptionsSection unit={pu} weapons={weapons} weaponLists={weaponLists} namedUpgrades={namedUpgrades} spellPools={spellPools} armyRules={armyRules} coreRules={coreRules} inlineRules={pu.inlineRules}
            collapsed={collapsedSections?.has("wargear")} onToggle={() => toggleSection("wargear")}/>
      </div>
    </div>
  );
}

function UnitBlock({ unit, weapons, weaponLists, namedUpgrades, armyRules, coreRules, spellPools, hidden, collapsedSections, toggleSection, onAddToList }: any) {
  const [platoonOpen, setPlatoonOpen] = useState(false);
  const rulesCollapsed = collapsedSections?.has("specialRules") ?? false;
  if (hidden) return null;

  if (unit.platoon) {
    return (
      <div className="unit-block" id={`unit-${unit.id}`}>
        <div className="unit-header" style={{position:"static",boxShadow:"none",paddingTop:0,marginTop:0}}>
          <div>
            <div className="unit-name">{unit.name}</div>
            {unit.platoonComposition && (
              <div className="platoon-composition">{unit.platoonComposition}</div>
            )}
          </div>
          {onAddToList && (
            <button className="add-to-list-btn" onClick={() => onAddToList(unit)}>+ List</button>
          )}
        </div>
        <button className="platoon-toggle" onClick={() => setPlatoonOpen(o => !o)}>
          {platoonOpen ? "▲ Hide units" : "▼ Show units"}
        </button>
        {platoonOpen && (
          <div className="platoon-units">
            {(unit.platoonUnits || []).map(pu => (
              <PlatoonUnitBlock key={pu.id} pu={pu} weapons={weapons} weaponLists={weaponLists}
                namedUpgrades={namedUpgrades} armyRules={armyRules} coreRules={coreRules}
                spellPools={spellPools}
                collapsedSections={collapsedSections} toggleSection={toggleSection}/>
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
          {unit.isUnique && <span style={{fontSize:"8pt",fontWeight:700,color:"#7a5800",marginLeft:6}}>UNIQUE</span>}
          <div className="unit-name">{unit.name}</div>
          <div className="unit-comp">Composition: {compStr(unit.models)}</div>
        </div>
        <div className="unit-pts-block">
          <div>
            <div className="unit-pts-label">Base cost</div>
            <div className="unit-pts">{unit.basePts} pts</div>
          </div>
          {onAddToList && (
            <button className="add-to-list-btn" onClick={() => onAddToList(unit)}>+ List</button>
          )}
        </div>
      </div>
      {unit.chapterRestriction && (
        <div style={{fontSize:"8.5pt",color:"#888",fontStyle:"italic",marginBottom:4}}>
          Requires chapter: {unit.chapterRestriction}
        </div>
      )}
      <StatTable models={unit.models}/>
      <DetailSpecialRules unit={unit} models={unit.models} armyRules={armyRules} coreRules={coreRules} inlineRules={unit.inlineRules}
          collapsed={rulesCollapsed} onToggle={() => toggleSection("specialRules")}/>
      <DetailOptionsSection unit={unit} weapons={weapons} weaponLists={weaponLists} namedUpgrades={namedUpgrades} spellPools={spellPools} armyRules={armyRules} coreRules={coreRules} inlineRules={unit.inlineRules}
          collapsed={collapsedSections?.has("wargear")} onToggle={() => toggleSection("wargear")}/>
    </div>
  );
}

// ── List Builder Components ───────────────────────────────────────────────────

function LBModal({ children, onClose }: { children: any; onClose: () => void }) {
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, []);

  return (
    <div className="lb-modal-overlay" onPointerDown={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="lb-modal">{children}</div>
    </div>
  );
}

function FOCSlotPanel({ foc, onAddUnit }: { foc: any[]; onAddUnit: (slot: string) => void }) {
  return (
    <div className="lb-foc-slots">
      {foc.map(f => {
        const cls = !f.ok ? "lb-foc-slot-err" : "";
        const countLabel = f.max !== null
          ? `${f.count} / ${f.max}`
          : f.min > 0
            ? `${f.count} / ${f.min}+`
            : String(f.count);
        return (
          <button key={f.slot} className={`lb-foc-slot-btn ${cls}`} onClick={() => onAddUnit(f.slot)}>
            + {f.slot}
            <span className="lb-foc-slot-count">{countLabel}</span>
          </button>
        );
      })}
    </div>
  );
}

// Returns model IDs that an option applies to, based on its upgradeGroup.
// No group = all models; named group = the champion model(s) in that group.
function resolveChampionModelIds(opt: any, unit: any): string[] {
  const group: string | null = opt.upgradeGroup ?? null;
  if (!group) return (unit.models || []).map((m: any) => m.id);
  for (const o of (unit.options || [])) {
    if (o.upgradeGroup === group && o.applies?.length) return o.applies;
  }
  const singles = (unit.models || []).filter((m: any) => m.minCount === 1 && m.maxCount === 1);
  return singles.map((m: any) => m.id);
}

function ResolvedWargearSection({ entry, unit, weapons, weaponLists, namedUpgrades, spellPools, armyRules, coreRules, collapsedWargear = false, onToggleWargear = null }: any) {
  const wL = weaponLists || {};

  function wName(id: string) {
    return (weapons||[]).find((x: any) => x.id === id)?.name || id;
  }

  // Apply swaps that have a single string value (scope:unit or single-model perModelType).
  // limitedSlot is excluded: it applies to only one model instance, so modelWargear (per type) stays unchanged.
  const modelWargear: Map<string, string[]> = new Map();
  for (const m of (unit.models || [])) {
    modelWargear.set(m.id, (m.baseWargear || []).map((r: any) => typeof r === "string" ? r : r.weaponId));
  }
  for (const o of (unit.options || [])) {
    if (o.type !== "weaponSwap") continue;
    if (o.scope === "limitedSlot") continue; // only affects one model instance; merged into modelWargear below
    const v = entry.options?.[o.id];
    if (!v || typeof v !== "string") continue; // skip multi-model count objects
    const choices = resolveChoicesForOpt(o, wL);
    if (choices[0]?.weaponId === v) continue; // default, unchanged
    const applyTo: string[] = o.applies ?? (unit.models||[]).map((m: any) => m.id);
    for (const mid of applyTo) {
      const weps = [...(modelWargear.get(mid) || [])];
      const idx = weps.indexOf(o.replaces);
      if (idx !== -1) weps[idx] = v; else weps.push(v);
      modelWargear.set(mid, weps);
    }
  }
  for (const o of (unit.options || [])) {
    if (o.type !== "toggle" || !entry.options?.[o.id] || !o.grantsWargear) continue;
    const targetSet = new Set(resolveChampionModelIds(o, unit));
    for (const [mid, weps] of modelWargear) {
      if (!targetSet.has(mid)) continue;
      let updated = [...weps, ...o.grantsWargear];
      for (const grantedId of o.grantsWargear) {
        const grantedItem = (weapons||[]).find((x: any) => x.id === grantedId);
        if (grantedItem?.removesWargear?.length) {
          const removeSet = new Set<string>(grantedItem.removesWargear);
          updated = updated.filter((w: string) => !removeSet.has(w));
        }
      }
      modelWargear.set(mid, updated);
    }
  }
  for (const o of (unit.options || [])) {
    if (o.type !== "namedUpgrade" || !entry.options?.[o.id]) continue;
    const named = namedUpgrades?.[o.upgradeId];
    if (!named) continue;
    const targetSet = new Set(resolveChampionModelIds(o, unit));
    if (named.grantsWargear?.length) {
      for (const [mid, weps] of modelWargear)
        if (targetSet.has(mid)) modelWargear.set(mid, [...weps, ...named.grantsWargear]);
    }
    if (named.removesWargear?.length) {
      const removeSet = new Set<string>(named.removesWargear.map((w: any) => typeof w === "string" ? w : w.weaponId));
      for (const [mid, weps] of modelWargear)
        if (targetSet.has(mid)) modelWargear.set(mid, weps.filter((w: string) => !removeSet.has(w)));
    }
  }
  for (const o of (unit.options || [])) {
    if (o.type !== "perModelToggle" || !o.grantsWargear?.length) continue;
    const modelOpts = entry.perModelOptions?.[o.id] || {};
    const anyActive = Object.values(modelOpts).some((v: any) => (parseInt(v) || 0) > 0);
    if (!anyActive) continue;
    const applyModels = (unit.models||[]).filter((m: any) => (o.applies||[]).includes(m.id));
    for (const model of applyModels) {
      const weps = [...(modelWargear.get(model.id) || []), ...o.grantsWargear];
      modelWargear.set(model.id, weps);
    }
  }

  // Remove dominated inv-save items: keep only the best (lowest) per model.
  function wepInvSave(wid: string): number | null {
    const w = (weapons||[]).find((x: any) => x.id === wid);
    for (const p of (w?.profiles || [])) {
      if (typeof p.rules === "string") {
        const m = p.rules.match(/(\d+)\+\s*Invulnerability/i);
        if (m) return parseInt(m[1]);
      }
    }
    return null;
  }
  for (const [mid, weps] of modelWargear) {
    const invItems = weps.map(wid => ({ wid, save: wepInvSave(wid) })).filter(x => x.save !== null) as { wid: string; save: number }[];
    if (invItems.length <= 1) continue;
    const best = Math.min(...invItems.map(x => x.save));
    const dominated = new Set(invItems.filter(x => x.save > best).map(x => x.wid));
    modelWargear.set(mid, weps.filter(wid => !dominated.has(wid)));
  }

  // Merge chosen weapons into the appropriate model type's wargear so they appear
  // inline in that model's weapon table instead of a separate "Selected Weapons" block.
  for (const o of (unit.options || [])) {
    if (o.type === "weaponSwap") {
      const v = entry.options?.[o.id];
      if (v && typeof v === "object") {
        const applyTo: string[] = o.applies ?? (unit.models||[]).map((m: any) => m.id);
        const totalAssigned = Object.values(v as Record<string,number>).reduce((s: number, n: any) => s + (n as number), 0);
        const totalModels = totalAppliesCount(unit, o, entry.options || {});
        for (const [wid, cnt] of Object.entries(v as Record<string,number>)) {
          if ((cnt as number) > 0) {
            for (const mid of applyTo) {
              const weps = modelWargear.get(mid) || [];
              if (!weps.includes(wid)) modelWargear.set(mid, [...weps, wid]);
            }
          }
        }
        if (o.replaces && totalModels > 0 && totalAssigned >= totalModels) {
          const toRemove = new Set([o.replaces, ...(o.alsoReplaces || [])]);
          for (const mid of applyTo)
            modelWargear.set(mid, (modelWargear.get(mid) || []).filter((w: string) => !toRemove.has(w)));
        }
      } else if (v && typeof v === "string" && o.scope === "limitedSlot") {
        const choices = resolveChoicesForOpt(o, wL);
        if (choices[0]?.weaponId !== v) {
          const applyTo: string[] = o.applies ?? (unit.models||[]).map((m: any) => m.id);
          for (const mid of applyTo) {
            const weps = modelWargear.get(mid) || [];
            if (!weps.includes(v)) modelWargear.set(mid, [...weps, v]);
          }
        }
      }
    } else if (o.type === "perModelWeapon") {
      const modelOpts = entry.perModelOptions?.[o.id] || {};
      const applyTo: string[] = o.applies ?? (unit.models||[]).map((m: any) => m.id);
      for (const wid of Object.values(modelOpts) as string[]) {
        if (!wid) continue;
        for (const mid of applyTo) {
          const weps = modelWargear.get(mid) || [];
          if (!weps.includes(wid)) modelWargear.set(mid, [...weps, wid]);
        }
      }
    }
  }

  const isV = (unit.models||[]).some((m: any) => m.statline?.type === "vehicle");

  // Build per-weapon model counts for each model type (for "(xN)" display)
  const weaponCountByMid = new Map<string, Map<string, number>>();
  for (const m of (unit.models || [])) {
    const mid = m.id;
    const total = modelTypeCount(unit, mid, entry.options || {});
    if (total === 0) continue;
    const counts = new Map<string, number>();
    for (const r of (m.baseWargear || [])) {
      const wid = typeof r === "string" ? r : r.weaponId;
      counts.set(wid, total);
    }
    weaponCountByMid.set(mid, counts);
  }
  for (const o of (unit.options || [])) {
    if (o.type !== "weaponSwap" || o.scope !== "perModelType" || !isMultiModelSwap(o, unit)) continue;
    const v = entry.options?.[o.id];
    if (!v || typeof v !== "object") continue;
    const applyTo: string[] = o.applies ?? (unit.models||[]).map((m: any) => m.id);
    // v stores TOTAL counts across all applies model types combined. Distribute
    // proportionally so that mergedCounts (which sums per-type counts) yields the
    // correct totals rather than multiplying by the number of model types.
    const validMids = applyTo.filter((mid: string) => weaponCountByMid.has(mid));
    const totalApplies = validMids.reduce((s: number, mid: string) => s + modelTypeCount(unit, mid, entry.options || {}), 0);
    if (totalApplies === 0) continue;
    const swapEntries = Object.entries(v as Record<string, number>).filter(([wid, cnt]) => (cnt as number) > 0 && wid !== o.replaces);
    const soFar: Record<string, number> = {};
    for (const [wid] of swapEntries) soFar[wid] = 0;
    for (let i = 0; i < validMids.length; i++) {
      const mid = validMids[i];
      const counts = weaponCountByMid.get(mid)!;
      const thisTotal = modelTypeCount(unit, mid, entry.options || {});
      const isLast = i === validMids.length - 1;
      let swappedHere = 0;
      for (const [wid, cnt] of swapEntries) {
        const typeCnt = isLast
          ? (cnt as number) - soFar[wid]
          : Math.floor((cnt as number) * thisTotal / totalApplies);
        soFar[wid] += typeCnt;
        swappedHere += typeCnt;
        if (typeCnt > 0) counts.set(wid, typeCnt);
      }
      if (o.replaces) counts.set(o.replaces, Math.max(0, thisTotal - swappedHere));
    }
  }
  for (const o of (unit.options || [])) {
    if (o.type !== "weaponSwap" || o.scope !== "limitedSlot") continue;
    const v = entry.options?.[o.id];
    if (!v) continue;
    const choices = resolveChoicesForOpt(o, wL);
    const defaultWid = choices[0]?.weaponId;
    const applyTo: string[] = o.applies ?? (unit.models||[]).map((m: any) => m.id);
    if (typeof v === "string" && v !== defaultWid) {
      for (const mid of applyTo) {
        const counts = weaponCountByMid.get(mid);
        if (!counts) continue;
        counts.set(v, (counts.get(v) ?? 0) + 1);
        if (o.replaces && counts.has(o.replaces))
          counts.set(o.replaces, Math.max(0, (counts.get(o.replaces) ?? 0) - 1));
      }
    } else if (typeof v === "object") {
      for (const [wid, cnt] of Object.entries(v as Record<string, number>)) {
        if ((cnt as number) <= 0 || wid === defaultWid) continue;
        for (const mid of applyTo) {
          const counts = weaponCountByMid.get(mid);
          if (!counts) continue;
          counts.set(wid, (counts.get(wid) ?? 0) + (cnt as number));
          if (o.replaces && counts.has(o.replaces))
            counts.set(o.replaces, Math.max(0, (counts.get(o.replaces) ?? 0) - (cnt as number)));
        }
      }
    }
  }
  for (const o of (unit.options || [])) {
    if (!entry.options?.[o.id]) continue;
    const wargearList: string[] = o.type === "toggle" ? (o.grantsWargear || [])
      : o.type === "namedUpgrade" ? (namedUpgrades?.[o.upgradeId]?.grantsWargear || [])
      : [];
    if (!wargearList.length) continue;
    const targetMids = new Set(resolveChampionModelIds(o, unit));
    for (const [mid, counts] of weaponCountByMid) {
      if (!targetMids.has(mid)) continue;
      const total = modelTypeCount(unit, mid, entry.options || {});
      for (const wid of wargearList) if (!counts.has(wid)) counts.set(wid, total);
    }
  }

  // Group models by resolved wargear, skipping optional models with 0 count
  const groups: Map<string, { refs: string[]; names: string[]; mids: string[] }> = new Map();
  for (const m of (unit.models||[])) {
    if (modelTypeCount(unit, m.id, entry.options || {}) === 0) continue;
    const key = (modelWargear.get(m.id)||[]).join(",");
    if (!groups.has(key)) groups.set(key, { refs: modelWargear.get(m.id)||[], names: [], mids: [] });
    groups.get(key)!.names.push(m.name);
    groups.get(key)!.mids.push(m.id);
  }
  const wgGroups = [...groups.values()].filter(g => g.refs.length > 0);
  const multiGroup = wgGroups.length > 1;

  // Build "chosen options" lines for multi-model perModelType + limitedSlot + mark + blessing + squads
  const chosenLines: Array<{text: string, modelIdx: number | null}> = [];
  const cl = (text: string, modelIdx: number | null = null) => chosenLines.push({text, modelIdx});

  for (const o of (unit.options||[])) {
    if (o.type === "squadSize") {
      const extra = entry.options?.[o.id] as number;
      if (extra > 0) { const m2 = (unit.models||[]).find((x: any) => x.id === o.targetModelId); cl(`+${extra} ${m2?.name||"models"}`); }
    }
    else if (o.type === "markPick" && entry.options?.[o.id]) {
      const mk = entry.options[o.id] as string;
      cl(`Mark of ${mk.charAt(0).toUpperCase()+mk.slice(1)}`);
    }
    else if (o.type === "pureBlessingPick" && entry.options?.[o.id]) {
      const reqOpt = (unit.options||[]).find((x: any) => x.id === o.requiresOptionId);
      const mk = reqOpt ? entry.options?.[reqOpt.id] : null;
      if (mk) cl(`${mk.charAt(0).toUpperCase()+mk.slice(1)} Pure Blessing`);
    }
    else if (o.type === "namedUpgrade" && entry.options?.[o.id]) {
      const named = namedUpgrades?.[o.upgradeId];
      cl(named?.label || o.label || o.upgradeId);
    }
    else if (o.type === "toggle" && entry.options?.[o.id]) {
      cl(o.label || o.id);
    }
    else if (o.type === "weaponSwap" && o.scope === "limitedSlot") {
      const v = entry.options?.[o.id];
      if ((o.slots||1) > 1 && v && typeof v === "object") {
        const choices = resolveChoicesForOpt(o, wL);
        for (const [wid, cnt] of Object.entries(v as Record<string,number>)) {
          if ((cnt as number) > 0) {
            const ch = choices.find((c: any) => c.weaponId === wid);
            cl(`${cnt}× ${ch?.label || wName(wid)} (${o.label})`);
          }
        }
      } else if (v && typeof v === "string") {
        const choices = resolveChoicesForOpt(o, wL);
        const ch = choices.find((c: any) => c.weaponId === v);
        cl(`${ch?.label || wName(v)} (${o.label})`);
      }
    }
    else if (o.type === "weaponSwap" && o.scope === "perModelType" && isMultiModelSwap(o, unit)) {
      const v = entry.options?.[o.id];
      if (v && typeof v === "object") {
        const choices = resolveChoicesForOpt(o, wL);
        for (const [wid, cnt] of Object.entries(v as Record<string,number>)) {
          if (cnt > 0) {
            const ch = choices.find((c: any) => c.weaponId === wid);
            cl(`${cnt}× ${ch?.label || wName(wid)}`);
          }
        }
      }
    }
  }
  const seenExclGroups = new Set<string>();
  for (const o of (unit.options||[])) {
    if ((o.type !== "toggle" && o.type !== "namedUpgrade") || !o.applies || !o.exclusiveGroup) continue;
    if (seenExclGroups.has(o.exclusiveGroup)) continue;
    seenExclGroups.add(o.exclusiveGroup);
    const groupOpts = (unit.options||[]).filter((x: any) => x.exclusiveGroup === o.exclusiveGroup);
    const modelSelections: Record<string,string> = entry.perModelOptions?.[o.exclusiveGroup] || {};
    for (const [idx, selectedId] of Object.entries(modelSelections)) {
      if (!selectedId) continue;
      const selOpt = groupOpts.find((x: any) => x.id === selectedId);
      if (selOpt) cl(`Model ${Number(idx)+1}: ${selOpt.label}${selOpt.pts ? ` +${selOpt.pts} pts` : ""}`, Number(idx));
    }
  }

  // Per-model weapon swaps → Chosen Options pills
  for (const o of (unit.options||[])) {
    if (o.type !== "perModelWeapon") continue;
    const modelOpts = entry.perModelOptions?.[o.id] || {};
    const choices = o.choices || [];
    const applyModels = (unit.models||[]).filter((m: any) => (o.applies||[]).includes(m.id));
    let totalModels = 0;
    const pmSlots: { i: number; mNum: number; wepIdx: number; wc: number }[] = [];
    for (const model of applyModels) {
      const mc = modelTypeCount(unit, model.id, entry.options || {});
      const wc = (model.baseWargear || []).filter((r: any) => {
        const wid = typeof r === 'string' ? r : r.weaponId;
        if (wid !== o.replaces) return false;
        if (o.replacesArcType && typeof r !== 'string' && r.arcType !== o.replacesArcType) return false;
        return true;
      }).length || 1;
      for (let mi = 0; mi < mc; mi++) {
        for (let wi = 0; wi < wc; wi++) pmSlots.push({ i: pmSlots.length, mNum: totalModels, wepIdx: wi, wc });
        totalModels++;
      }
    }
    const rows = pmSlots.map(({ i, mNum, wepIdx, wc }) => {
      const wid = modelOpts[String(i)] || choices[0]?.weaponId || "";
      const ch = choices.find((c: any) => c.weaponId === wid);
      let rowLabel: string;
      if (totalModels === 1) rowLabel = wc > 1 ? `Wpn ${wepIdx + 1}` : "";
      else if (wc === 1) rowLabel = `Model ${mNum + 1}`;
      else rowLabel = `Model ${mNum + 1} Wpn ${wepIdx + 1}`;
      return { idx: i, modelIdx: mNum, rowLabel, label: ch?.label || wName(wid) };
    });
    for (const row of rows) cl(row.rowLabel ? `${row.rowLabel}: ${row.label}` : row.label, totalModels > 1 ? row.modelIdx : null);
  }
  // Per-model toggle upgrades → Chosen Options pills
  for (const o of (unit.options||[])) {
    if (o.type !== "perModelToggle") continue;
    const modelOpts = entry.perModelOptions?.[o.id] || {};
    const maxCount = o.maxCount ?? 1;
    const applyModels = (unit.models||[]).filter((m: any) => (o.applies||[]).includes(m.id));
    let totalModels = 0;
    const ptSlots: { i: number; mNum: number }[] = [];
    for (const model of applyModels) {
      const mc = modelTypeCount(unit, model.id, entry.options || {});
      for (let mi = 0; mi < mc; mi++) { ptSlots.push({ i: ptSlots.length, mNum: totalModels }); totalModels++; }
    }
    for (const { i, mNum } of ptSlots) {
      const count = parseInt(modelOpts[String(i)] || "0") || 0;
      if (count === 0) continue;
      const rowLabel = totalModels > 1 ? `Model ${mNum + 1}` : "";
      const label = count === 1 ? o.label : `${count}× ${o.label}`;
      cl(rowLabel ? `${rowLabel}: ${label}` : label, totalModels > 1 ? mNum : null);
    }
  }

  // Chosen spells
  const chosenSpells: any[] = [];
  for (const o of (unit.options||[])) {
    if (o.type !== "spellPick") continue;
    const rawPoolId = o.spellPoolId || unit.psychic?.spellPoolId || "";
    const resolvedPoolId = rawPoolId === "$mark"
      ? (() => { const mOpt = (unit.options||[]).find((x: any) => x.type === "markPick"); return mOpt ? (entry.options?.[mOpt.id] || "") : ""; })()
      : rawPoolId;
    const pool = spellPools?.[resolvedPoolId] || [];
    for (const sid of (entry.options?.[o.id] || []) as string[]) {
      const s = pool.find((x: any) => x.id === sid);
      if (s) chosenSpells.push(s);
    }
  }

  function renderWeaponTable(refs: string[], weaponCounts?: Map<string, number>, totalCount?: number) {
    // Wargear with rules profiles go in the table; purely decorative wargear stays as pills.
    const seenT = new Set<string>(); const seenPill = new Set<string>();
    const tableRefs = refs.filter(wid => {
      if (seenT.has(wid)) return false;
      const w = (weapons||[]).find((x: any) => x.id === wid);
      if (w && (isRealWeapon(w) || w.profiles?.some((p: any) => p.rules))) { seenT.add(wid); return true; }
      return false;
    });
    const pillRefs = refs.filter(wid => {
      if (seenPill.has(wid)) return false;
      const w = (weapons||[]).find((x: any) => x.id === wid);
      if (w && !isRealWeapon(w) && !w.profiles?.some((p: any) => p.rules)) { seenPill.add(wid); return true; }
      return false;
    });
    function wepLabel(wid: string, name: string): string {
      if (!weaponCounts || !totalCount || totalCount <= 1) return name;
      const cnt = weaponCounts.get(wid);
      return (cnt !== undefined && cnt < totalCount) ? `${name} (x${cnt})` : name;
    }
    return (
      <>
        {tableRefs.length > 0 && (
          <table className="wep-table">
            <colgroup>
              <col style={{width:"30%"}}/>
              {isV && <col style={{width:"8%"}}/>}
              <col style={{width:"13%"}}/>
              <col style={{width:"8%"}}/>
              <col style={{width:"8%"}}/>
              <col/>
            </colgroup>
            <thead><tr><th>Weapon</th>{isV&&<th>Arc</th>}<th>Range</th><th>S</th><th>AP</th><th className="rules-col">Rules</th></tr></thead>
            <tbody>
              {tableRefs.map((wid, wi) => {
                const w = (weapons||[]).find((x: any) => x.id === wid);
                if (!w) return <tr key={wid}><td colSpan={6}>{wid}</td></tr>;
                if (!isRealWeapon(w)) {
                  // Wargear-only entry with rules: show dashes for Range/S/AP
                  const rulesText = w.profiles?.map((p: any) => p.rules).filter(Boolean).join("; ") || "—";
                  return (
                    <tr key={wid} className={wi%2===0?"stripe-a":"stripe-b"}>
                      <td>{wepLabel(wid, w.name)}</td>{isV&&<td/>}<td>—</td><td>—</td><td>—</td>
                      <td className="rules-col">{rulesText}</td>
                    </tr>
                  );
                }
                return w.profiles.length === 1 ? (
                  <tr key={wid} className={wi%2===0?"stripe-a":"stripe-b"}>
                    <td>{wepLabel(wid, w.name)}</td>{isV&&<td/>}<td>{fmtRange(w.profiles[0])}</td>
                    <td>{w.profiles[0].strength}</td><td>{w.profiles[0].ap}</td>
                    <td className="rules-col">{resolveRuleNames(w.profiles[0].rules, coreRules||[], armyRules||[])}</td>
                  </tr>
                ) : w.profiles.map((p: any, pi: number) => (
                  <tr key={`${wid}-${pi}`} className={pi===0?"mp-first":(pi===w.profiles.length-1?"mp-last":"mp-cont")}>
                    <td>{pi===0?wepLabel(wid, w.name):""}</td>{isV&&<td/>}<td>{fmtRange(p)}</td>
                    <td>{p.strength}</td><td>{p.ap}</td>
                    <td className="rules-col">{resolveRuleNames(p.rules, coreRules||[], armyRules||[])}</td>
                  </tr>
                ));
              })}
            </tbody>
          </table>
        )}
        {pillRefs.length > 0 && (
          <div className="pills">
            {pillRefs.map(wid => { const w = (weapons||[]).find((x: any) => x.id === wid); return <span key={wid} className="pill"><span className="pill-name">{wepLabel(wid, w?.name||wid)}</span></span>; })}
          </div>
        )}
      </>
    );
  }

  return (
    <div>
      <div className={`lb-resolved-head${onToggleWargear ? " lb-collapse-head" : ""}`} onClick={onToggleWargear || undefined}>
        {onToggleWargear && <span className="lb-collapse-icon">{collapsedWargear ? "▶" : "▼"}</span>}
        Wargear
      </div>
      {!collapsedWargear && (<>
      {wgGroups.map((g, gi) => {
        const totalCount = g.mids.reduce((s: number, mid: string) => s + modelTypeCount(unit, mid, entry.options || {}), 0);
        let mergedCounts: Map<string, number> | undefined;
        if (totalCount > 1) {
          mergedCounts = new Map<string, number>();
          for (const mid of g.mids) {
            const counts = weaponCountByMid.get(mid);
            if (!counts) continue;
            for (const [wid, cnt] of counts) mergedCounts.set(wid, (mergedCounts.get(wid) ?? 0) + cnt);
          }
        }
        return (
          <div key={gi} style={{marginBottom:8}}>
            {multiGroup && <div className="group-head">{g.names.join(" & ")}{totalCount > 1 ? <span style={{textTransform:"none"}}>{` (x${totalCount})`}</span> : ""}</div>}
            {renderWeaponTable(g.refs, mergedCounts, totalCount)}
          </div>
        );
      })}

      {chosenLines.length > 0 && (
        <div style={{marginBottom:8}}>
          <div className="group-head">Chosen Options</div>
          <div className="pills">
            {[...chosenLines.filter(l => l.modelIdx === null),
              ...[...new Set(chosenLines.filter(l => l.modelIdx !== null).map(l => l.modelIdx))].sort((a,b)=>(a??0)-(b??0)).flatMap(mi => chosenLines.filter(l => l.modelIdx === mi))
            ].map((l, i) => <span key={i} className="pill"><span className="pill-name">{l.text}</span></span>)}
          </div>
        </div>
      )}

      {chosenSpells.length > 0 && (
        <div>
          <div className="group-head">Chosen Spells</div>
          <ul className="option-list">
            {chosenSpells.map((s: any) => <li key={s.id}><strong>{s.name}</strong> — Cast {s.castValue}+: {s.description}</li>)}
          </ul>
        </div>
      )}
      </>)}
    </div>
  );
}

function BattleUnitBlock({ entry, displayName, unit, weapons, weaponLists, namedUpgrades, spellPools, armyRules, coreRules, entryCost, collapsedSections, toggleSection }: any) {
  const rulesCollapsed = collapsedSections?.has("specialRules") ?? false;
  const wargearCollapsed = collapsedSections?.has("wargear") ?? false;

  // Compute per-model stat deltas from active namedUpgrades and toggles.
  // statModifiers use modelId explicitly; __sergeant__ resolves via upgradeGroup lookup.
  const statDeltas = new Map<string, Record<string, number>>();
  const modelGrantedRules = new Map<string, Set<string>>();
  const modelRemovedRules = new Map<string, Set<string>>();

  function resolveModifierModelIds(modelId: string): string[] {
    if (modelId === "__all__") {
      return (unit.models || []).map((m: any) => m.id);
    }
    if (modelId === "__sergeant__") {
      for (const o of (unit.options || []))
        if (o.upgradeGroup === "Sergeant" && o.applies?.length) return o.applies;
      const singles = (unit.models||[]).filter((m: any) => m.minCount===1 && m.maxCount===1);
      return singles.map((m: any) => m.id);
    }
    return [modelId];
  }

  for (const o of (unit.options || [])) {
    if (!entry?.options?.[o.id]) continue;
    const nUpg = o.type === "namedUpgrade" ? (namedUpgrades?.[o.upgradeId] || null) : null;
    const statMods: any[] = nUpg?.statModifiers || o.statModifiers || [];
    const grantsR: string[] = nUpg?.grantsRules || o.grantsRules || [];
    const removesR: string[] = nUpg?.removesRules || o.removesRules || [];

    for (const mod of statMods) {
      for (const mid of resolveModifierModelIds(mod.modelId)) {
        if (!statDeltas.has(mid)) statDeltas.set(mid, {});
        if (mod.op === "add")
          statDeltas.get(mid)![mod.stat] = (statDeltas.get(mid)![mod.stat] || 0) + mod.value;
      }
    }

    const ruleTargets = resolveChampionModelIds(o, unit);
    for (const mid of ruleTargets) {
      if (grantsR.length) {
        if (!modelGrantedRules.has(mid)) modelGrantedRules.set(mid, new Set());
        for (const r of grantsR) modelGrantedRules.get(mid)!.add(r);
      }
      if (removesR.length) {
        if (!modelRemovedRules.has(mid)) modelRemovedRules.set(mid, new Set());
        for (const r of removesR) modelRemovedRules.get(mid)!.add(r);
      }
    }
  }

  const effectiveModels = (unit.models || []).map((m: any) => {
    const grants = modelGrantedRules.get(m.id);
    const removes = modelRemovedRules.get(m.id);
    if (!grants && !removes) return m;
    const rules = new Set<string>(m.specialRules || []);
    if (removes) for (const r of removes) rules.delete(r);
    if (grants) for (const r of grants) rules.add(r);
    return { ...m, specialRules: [...rules] };
  });

  // Compute per-model invulnerable save from effective wargear (base + grants − removes).
  // Takes the best (lowest) value when multiple inv-save items are present.
  function parseInvSave(rules: any): number | null {
    if (typeof rules !== "string") return null;
    const m = rules.match(/(\d+)\+\s*Invulnerability/i);
    return m ? parseInt(m[1]) : null;
  }
  const modelInvSaves = new Map<string, number>();
  for (const m of (unit.models || [])) {
    const wids = new Set<string>((m.baseWargear || []).map((r: any) => typeof r === "string" ? r : r.weaponId));
    for (const o of (unit.options || [])) {
      if (!entry?.options?.[o.id]) continue;
      const nUpg = o.type === "namedUpgrade" ? (namedUpgrades?.[o.upgradeId] || null) : null;
      const targets = new Set(resolveChampionModelIds(o, unit));
      if (!targets.has(m.id)) continue;
      for (const w of (nUpg?.removesWargear || []))
        wids.delete(typeof w === "string" ? w : w.weaponId);
      for (const w of (nUpg?.grantsWargear || o.grantsWargear || []))
        wids.add(typeof w === "string" ? w : w.weaponId);
    }
    let best: number | null = null;
    for (const wid of wids) {
      const w = (weapons||[]).find((x: any) => x.id === wid);
      for (const p of (w?.profiles || [])) {
        const val = parseInvSave(p.rules);
        if (val !== null && (best === null || val < best)) best = val;
      }
    }
    if (best !== null) modelInvSaves.set(m.id, best);
  }

  return (
    <div className="unit-block">
      <div className="unit-header" style={{top:"var(--nav-height, 44px)"}}>
        <div>
          {unit.isUnique && <span style={{fontSize:"8pt",fontWeight:700,color:"#7a5800",marginLeft:6}}>UNIQUE</span>}
          <div className="unit-name">{displayName}</div>
          <div className="unit-comp">Composition: {resolvedCompStr(unit, entry.options || {})}</div>
        </div>
        <div className="unit-pts-block">
          <div className="unit-pts-label">Army cost</div>
          <div className="unit-pts">{entryCost} pts</div>
        </div>
      </div>
      <StatTable models={unit.models} statDeltas={statDeltas} invSaves={modelInvSaves}/>
      <DetailSpecialRules unit={unit} models={effectiveModels} armyRules={armyRules} coreRules={coreRules} inlineRules={unit.inlineRules}
          entryOptions={entry.options}
          collapsed={rulesCollapsed} onToggle={toggleSection ? () => toggleSection("specialRules") : null}/>
      <ResolvedWargearSection
        entry={entry} unit={unit} weapons={weapons} weaponLists={weaponLists}
        namedUpgrades={namedUpgrades} spellPools={spellPools}
        armyRules={armyRules} coreRules={coreRules}
        collapsedWargear={wargearCollapsed}
        onToggleWargear={toggleSection ? () => toggleSection("wargear") : null}
      />
    </div>
  );
}

function EntryOptionConfig({ unit, factionData, options, setOptions, perModelOptions, setPerModelOptions, subfactionId }: any) {
  const wL = factionData.weaponLists || {};
  const nU = factionData.namedUpgrades || {};
  const sP = factionData.spellPools || {};
  const opts = (unit.options || []).filter((o: any) => !o.subfaction || o.subfaction === subfactionId);
  const allInline = [...(factionData.inlineRules||[]), ...(unit.inlineRules||[])];
  const [squadSizeError, setSquadSizeError] = useState<string|null>(null);
  const squadSizeErrorTimer = useRef<any>(null);

  if (opts.length === 0) {
    return <div style={{color:"#888",fontSize:"9.5pt",fontStyle:"italic",padding:"8px 0"}}>No configurable options for this unit.</div>;
  }

  function upgradeDesc(o: any, named: any): string | undefined {
    const granted: string[] = o.grantsRules || named?.grantsRules || [];
    if (granted.length === 1) {
      const rule = allInline.find((r: any) => r.id === granted[0]);
      if (rule?.fullDesc) return rule.fullDesc;
    }
    return named?.note || o.note;
  }

  function wepName(weaponId: string, choice?: any): string {
    const w = (factionData.commonWargear||[]).find((x: any) => x.id === weaponId);
    return choice?.label || w?.name || weaponId;
  }

  return (
    <div>

      {/* Squad Size */}
      {opts.filter((o: any) => o.type === "squadSize").map((o: any) => {
        const model = (unit.models||[]).find((m: any) => m.id === o.targetModelId);
        const minCount = model?.minCount ?? 0;
        const additional = options[o.id] || 0;
        const totalCount = minCount + additional;
        const totalMax = minCount + o.max;
        const modelNamePlural = o.label.replace(/^Additional\s+/i, '');
        const minAdditional = minSquadSizeAdditional(unit, o, options);
        const isBlocked = additional <= minAdditional;
        return (
          <div key={o.id} className="lb-opt-section">
            <div className="lb-opt-section-head">Squad Size</div>
            <div className="lb-opt-row">
              <span className="lb-opt-label">{minCount}–{totalMax} {modelNamePlural}</span>
              <div className="lb-num-ctrl">
                <div style={{position:'relative',display:'inline-flex'}}>
                  <button className="lb-num-btn" style={isBlocked ? {opacity:0.4,cursor:'not-allowed'} : undefined}
                    onClick={() => {
                      if (isBlocked) {
                        setSquadSizeError(o.id);
                        clearTimeout(squadSizeErrorTimer.current);
                        squadSizeErrorTimer.current = setTimeout(() => setSquadSizeError(null), 2000);
                      } else {
                        setOptions((p: any) => ({...p, [o.id]: Math.max(minSquadSizeAdditional(unit, o, p), (p[o.id]||0)-1)}));
                      }
                    }}>−</button>
                  {squadSizeError === o.id && (
                    <div style={{position:'absolute',bottom:'calc(100% + 5px)',left:'50%',transform:'translateX(-50%)',background:'#222',color:'#fff',fontSize:'8pt',padding:'4px 8px',borderRadius:'4px',whiteSpace:'nowrap',pointerEvents:'none',zIndex:200}}>
                      Too many options assigned.
                    </div>
                  )}
                </div>
                <span className="lb-num-val">{totalCount}</span>
                <button className="lb-num-btn" onClick={() => setOptions((p: any) => ({...p, [o.id]: Math.min(o.max, (p[o.id]||0)+1)}))}>+</button>
                <span className="lb-opt-pts">+{o.ptsEach} pts each</span>
              </div>
            </div>
          </div>
        );
      })}

      {/* Mark of Chaos */}
      {opts.filter((o: any) => o.type === "markPick").map((o: any) => {
        const totalModels = totalUnitModels(unit, options);
        return (
          <div key={o.id} className="lb-opt-section">
            <div className="lb-opt-section-head">{o.label}</div>
            <div className="lb-opt-row">
              <select className="lb-select" style={{flex:1}} value={options[o.id]||""}
                onChange={e => setOptions((p: any) => ({...p, [o.id]: e.target.value || null}))}>
                <option value="">— None —</option>
                {(o.choices||[]).map((c: any) => {
                  const label = c.markId.charAt(0).toUpperCase() + c.markId.slice(1);
                  const cost = c.ptsPerModel * totalModels;
                  return <option key={c.markId} value={c.markId}>{label} (+{c.ptsPerModel}×{totalModels} = {cost} pts)</option>;
                })}
              </select>
            </div>
          </div>
        );
      })}

      {/* Pure Blessing (conditional on mark) */}
      {opts.filter((o: any) => o.type === "pureBlessingPick").map((o: any) => {
        const reqOpt = opts.find((x: any) => x.id === o.requiresOptionId);
        const mark = reqOpt ? options[reqOpt.id] : null;
        if (!mark) return null;
        const ch = (o.choices||[]).find((c: any) => c.markId === mark);
        if (!ch) return null;
        const label = mark.charAt(0).toUpperCase() + mark.slice(1);
        return (
          <div key={o.id} className="lb-opt-section">
            <div className="lb-opt-section-head">{o.label}</div>
            <label className="lb-opt-row" style={{cursor:"pointer",display:"flex"}}>
              <span className="lb-opt-label">
                <input type="checkbox" checked={!!options[o.id]}
                  onChange={e => setOptions((p: any) => ({...p, [o.id]: e.target.checked}))}
                  style={{marginRight:8}}/>
                {label} Blessing
                <span className="lb-opt-pts"> +{ch.pts} pts</span>
              </span>
            </label>
          </div>
        );
      })}

      {/* Upgrades / Swaps / Per-model — partitioned by upgradeGroup */}
      {(() => {
        const upgradeOpts = opts.filter((o: any) => o.type === "toggle" || o.type === "namedUpgrade");

        // Track removed wargear per upgradeGroup.
        // null group = unit-wide (suppresses swaps in every group).
        // Named group = model-specific (suppresses only swaps in the same group).
        const groupRemovedWeapons = new Map<string | null, Set<string>>();
        for (const o of opts) {
          if (!options[o.id]) continue;
          const removesW: any[] = o.type === "namedUpgrade"
            ? (nU[o.upgradeId]?.removesWargear || [])
            : o.type === "toggle" ? [
                ...(o.removesWargear || []),
                ...((o.grantsWargear || []).flatMap((wid: string) => {
                  const item = (factionData.commonWargear || []).find((x: any) => x.id === wid);
                  return item?.removesWargear || [];
                }))
              ] : [];
          if (!removesW.length) continue;
          const group: string | null = o.upgradeGroup ?? null;
          if (!groupRemovedWeapons.has(group)) groupRemovedWeapons.set(group, new Set());
          for (const w of removesW)
            groupRemovedWeapons.get(group)!.add(typeof w === "string" ? w : w.weaponId);
        }
        function isSwapHidden(o: any): boolean {
          if (!o.replaces) return false;
          const group: string | null = o.upgradeGroup ?? null;
          return !!(groupRemovedWeapons.get(null)?.has(o.replaces) ||
                   (group !== null && groupRemovedWeapons.get(group)?.has(o.replaces)));
        }
        const swapOpts = opts.filter((o: any) => o.type === "weaponSwap" && !isSwapHidden(o));
        const pmOpts            = opts.filter((o: any) => o.type === "perModelWeapon");
        const pmToggleOpts      = opts.filter((o: any) => o.type === "perModelToggle");

        const ungroupedUpgrades  = upgradeOpts.filter((o: any) => !o.upgradeGroup);
        const ungroupedSwaps     = swapOpts.filter((o: any) => !o.upgradeGroup);
        const ungroupedPm        = pmOpts.filter((o: any) => !o.upgradeGroup);
        const ungroupedPmToggle  = pmToggleOpts.filter((o: any) => !o.upgradeGroup);
        const optGroupMap = new Map<string, any[]>();
        for (const o of opts) {
          if (o.upgradeGroup) {
            if (!optGroupMap.has(o.upgradeGroup)) optGroupMap.set(o.upgradeGroup, []);
            optGroupMap.get(o.upgradeGroup)!.push(o);
          }
        }

        function renderUpgradeBlock(topts: any[], sectionLabel: string) {
          if (!topts.length) return null;

          // Build ordered blocks preserving JSON order; exclusive-group members collapse into one block
          const blocks: Array<{kind:"single",opt:any}|{kind:"exclusive",group:string,opts:any[]}|{kind:"perModelExclusive",group:string,opts:any[],applies:string[]}> = [];
          const seenGroups = new Set<string>();
          for (const o of topts) {
            if (o.exclusiveGroup) {
              if (!seenGroups.has(o.exclusiveGroup)) {
                seenGroups.add(o.exclusiveGroup);
                const groupOpts = topts.filter((x:any) => x.exclusiveGroup === o.exclusiveGroup);
                const applies = groupOpts.find((x: any) => x.applies?.length)?.applies;
                if (applies?.length) {
                  blocks.push({kind:"perModelExclusive", group:o.exclusiveGroup, opts: groupOpts, applies});
                } else {
                  blocks.push({kind:"exclusive", group:o.exclusiveGroup, opts: groupOpts});
                }
              }
            } else {
              blocks.push({kind:"single", opt:o});
            }
          }

          return (
            <div className="lb-opt-section">
              <div className="lb-opt-section-head">{sectionLabel}</div>
              {blocks.map((block) => {
                if (block.kind === "single") {
                  const o = block.opt;
                  const named = o.type === "namedUpgrade" ? (nU[o.upgradeId]||null) : null;
                  const label = named?.label || o.label || o.upgradeId;
                  const note = upgradeDesc(o, named);
                  const glExp = o.groupLimitExpansion;
                  return (
                    <label key={o.id} className="lb-opt-row" style={{cursor:"pointer",display:"flex"}}>
                      <span className="lb-opt-label">
                        <input type="checkbox" checked={!!options[o.id]}
                          onChange={e => {
                            const checked = e.target.checked;
                            setOptions((p: any) => {
                              const next = {...p, [o.id]: checked};
                              if (!checked && glExp) {
                                const grp = (topts as any[]).filter(x => x.exclusiveGroup === glExp.group);
                                const sel = grp.filter(x => next[x.id]);
                                sel.slice(1).forEach(x => { next[x.id] = false; });
                              }
                              if (!checked && o.grantsMasteryLevel != null) {
                                const baseML: number = unit.psychic?.masteryLevel ?? 0;
                                const spellPicks = opts.filter((x: any) => x.type === "spellPick");
                                if (spellPicks.length > 1) {
                                  spellPicks.forEach((sp: any, i: number) => {
                                    if (i >= baseML) next[sp.id] = [];
                                  });
                                } else if (spellPicks.length === 1) {
                                  const sp = spellPicks[0];
                                  const cur = (next[sp.id] || []) as string[];
                                  if (cur.length > baseML) next[sp.id] = cur.slice(0, baseML);
                                }
                              }
                              return next;
                            });
                          }}
                          style={{marginRight:8}}/>
                        {label}
                        {o.ptsPerModel > 0 ? <span className="lb-opt-pts"> +{o.ptsPerModel} pts per model</span> : o.pts > 0 ? <span className="lb-opt-pts"> +{o.pts} pts</span> : null}
                        {note && <span className="lb-opt-note">{note}</span>}
                      </span>
                    </label>
                  );
                }
                if (block.kind === "perModelExclusive") {
                  const {group, opts: pmGrpOpts, applies} = block as {kind:"perModelExclusive",group:string,opts:any[],applies:string[]};
                  const pmModelCount = modelTypeCount(unit, applies[0], options);
                  return (
                    <Fragment key={group}>
                      {Array.from({length: pmModelCount}, (_, modelIdx) => {
                        const selectedId: string = perModelOptions?.[group]?.[String(modelIdx)] || "";
                        return (
                          <div key={modelIdx} className="lb-exclusive-group">
                            <div className="lb-exclusive-label">Model {modelIdx + 1} — may take one:</div>
                            {pmGrpOpts.map((o: any) => {
                              const named = o.type === "namedUpgrade" ? (nU[o.upgradeId]||null) : null;
                              const label = named?.label || o.label || o.upgradeId;
                              const note = upgradeDesc(o, named);
                              const isSelected = selectedId === o.id;
                              return (
                                <label key={o.id} className="lb-opt-row" style={{cursor:"pointer",display:"flex"}}>
                                  <span className="lb-opt-label">
                                    <input type="radio" checked={isSelected}
                                      onClick={() => setPerModelOptions((p: any) => ({
                                        ...p,
                                        [group]: { ...(p[group]||{}), [String(modelIdx)]: isSelected ? "" : o.id }
                                      }))}
                                      onChange={() => {}}
                                      style={{marginRight:8}}/>
                                    {label}
                                    {o.pts > 0 ? <span className="lb-opt-pts"> +{o.pts} pts</span> : null}
                                    {note && <span className="lb-opt-note">{note}</span>}
                                  </span>
                                </label>
                              );
                            })}
                          </div>
                        );
                      })}
                    </Fragment>
                  );
                }
                // Exclusive group — radio buttons (1 pick) or checkboxes (N picks) depending on active expansions
                const {opts: groupOpts} = block as {kind:"exclusive",group:string,opts:any[]};
                const maxSel = (topts as any[])
                  .filter(x => x.groupLimitExpansion?.group === block.group && !!options[x.id])
                  .reduce((m: number, x: any) => Math.max(m, x.groupLimitExpansion.maxSelections), 1);
                const selectedCount = groupOpts.filter((o: any) => !!options[o.id]).length;
                if (maxSel === 1) {
                  const selectedId = groupOpts.find((o:any) => !!options[o.id])?.id ?? null;
                  return (
                    <div key={block.group} className="lb-exclusive-group">
                      <div className="lb-exclusive-label">May take one:</div>
                      {groupOpts.map((o:any) => {
                        const named = o.type === "namedUpgrade" ? (nU[o.upgradeId]||null) : null;
                        const label = named?.label || o.label || o.upgradeId;
                        const note = upgradeDesc(o, named);
                        const isSelected = selectedId === o.id;
                        return (
                          <label key={o.id} className="lb-opt-row"
                            style={{cursor: "pointer", display:"flex"}}>
                            <span className="lb-opt-label">
                              <input type="radio" checked={isSelected}
                                onClick={() => setOptions((p:any) => {
                                  const next = {...p};
                                  for (const s of groupOpts) next[s.id] = false;
                                  if (!isSelected) next[o.id] = true;
                                  return next;
                                })}
                                onChange={() => {}}
                                style={{marginRight:8}}/>
                              {label}
                              {o.ptsPerModel > 0 ? <span className="lb-opt-pts"> +{o.ptsPerModel} pts per model</span> : o.pts > 0 ? <span className="lb-opt-pts"> +{o.pts} pts</span> : null}
                              {note && <span className="lb-opt-note">{note}</span>}
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  );
                }
                return (
                  <div key={block.group} className="lb-exclusive-group">
                    <div className="lb-exclusive-label">May take up to {maxSel}:</div>
                    {groupOpts.map((o:any) => {
                      const named = o.type === "namedUpgrade" ? (nU[o.upgradeId]||null) : null;
                      const label = named?.label || o.label || o.upgradeId;
                      const note = upgradeDesc(o, named);
                      const isSelected = !!options[o.id];
                      const isDisabled = !isSelected && selectedCount >= maxSel;
                      return (
                        <label key={o.id} className="lb-opt-row"
                          style={{cursor: isDisabled ? "not-allowed" : "pointer", display:"flex", opacity: isDisabled ? 0.45 : 1}}>
                          <span className="lb-opt-label">
                            <input type="checkbox" checked={isSelected}
                              disabled={isDisabled}
                              onChange={() => setOptions((p:any) => ({...p, [o.id]: !p[o.id]}))}
                              style={{marginRight:8}}/>
                            {label}
                            {o.ptsPerModel > 0 ? <span className="lb-opt-pts"> +{o.ptsPerModel} pts per model</span> : o.pts > 0 ? <span className="lb-opt-pts"> +{o.pts} pts</span> : null}
                            {note && <span className="lb-opt-note">{note}</span>}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          );
        }

        function renderSwapOpt(o: any) {
          const choices = resolveChoicesForDisplay(o, wL, subfactionId);
          if (o.scope === "unit" || !isMultiModelSwap(o, unit)) {
            return (
              <div key={o.id} className="lb-opt-section">
                <div className="lb-opt-section-head">{o.label}</div>
                <div className="lb-opt-row">
                  <select className="lb-select" style={{flex:1}} value={options[o.id]||""}
                    onChange={e => setOptions((p: any) => ({...p, [o.id]: e.target.value}))}>
                    {choices.map((c: any) => (
                      <option key={c.weaponId} value={c.weaponId}>
                        {wepName(c.weaponId, c)}{c.pts ? ` (+${c.pts} pts${o.ptsPerModel ? " each" : ""})` : ""}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            );
          }
          if (o.scope === "perModelType") {
            const modelCount = totalAppliesCount(unit, o, options);
            const used = poolUsed(unit, o.applies||[], o.replaces, options);
            const remaining = modelCount - used;
            const curCounts = (options[o.id] || {}) as Record<string, number>;
            return (
              <div key={o.id} className="lb-opt-section">
                <div className="lb-opt-section-head" style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                  <span>{o.label}</span>
                  <span style={{fontWeight:400,textTransform:"none",fontSize:"8pt",color:remaining===0?"#4a9a4a":"#888"}}>{used}/{modelCount} assigned</span>
                </div>
                {choices.filter((c: any) => c.weaponId !== o.replaces).map((c: any) => {
                  const cur = curCounts[c.weaponId] || 0;
                  return (
                    <div key={c.weaponId} className="lb-opt-row">
                      <span className="lb-opt-label" style={{fontSize:"9.5pt"}}>
                        {wepName(c.weaponId, c)}
                        {c.pts > 0 && <span className="lb-opt-pts"> +{c.pts} pts each</span>}
                      </span>
                      <div className="lb-num-ctrl">
                        <button className="lb-num-btn" disabled={cur===0}
                          onClick={() => setOptions((p: any) => { const v: Record<string,number>={...(p[o.id]||{}),[c.weaponId]:Math.max(0,(p[o.id]?.[c.weaponId]||0)-1)}; if(!v[c.weaponId])delete v[c.weaponId]; return {...p,[o.id]:v}; })}>−</button>
                        <span className="lb-num-val">{cur}</span>
                        <button className="lb-num-btn" disabled={remaining<=0}
                          onClick={() => setOptions((p: any) => ({...p,[o.id]:{...(p[o.id]||{}),[c.weaponId]:(p[o.id]?.[c.weaponId]||0)+1}}))}>+</button>
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          }
          if (o.scope === "limitedSlot" && (o.slots||1) > 1) {
            const slotBudget = availableSlots(o, unit, options);
            const allUsed = poolUsed(unit, o.applies||[], o.replaces, options);
            const ownCounts = (options[o.id] || {}) as Record<string,number>;
            const ownUsed = Object.values(ownCounts).reduce((s: number, n: any) => s+n, 0);
            const remaining = Math.min(slotBudget - ownUsed, totalAppliesCount(unit, o, options) - allUsed);
            return (
              <div key={o.id} className="lb-opt-section">
                <div className="lb-opt-section-head" style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                  <span>{o.label}</span>
                  <span style={{fontWeight:400,textTransform:"none",fontSize:"8pt",color:ownUsed===slotBudget?"#4a9a4a":"#888"}}>{ownUsed}/{slotBudget} slots used</span>
                </div>
                {choices.filter((c: any) => c.weaponId !== o.replaces).map((c: any) => {
                  const cur = ownCounts[c.weaponId] || 0;
                  return (
                    <div key={c.weaponId} className="lb-opt-row">
                      <span className="lb-opt-label" style={{fontSize:"9.5pt"}}>
                        {wepName(c.weaponId, c)}
                        {c.pts > 0 && <span className="lb-opt-pts"> +{c.pts} pts each</span>}
                      </span>
                      <div className="lb-num-ctrl">
                        <button className="lb-num-btn" disabled={cur===0}
                          onClick={() => setOptions((p: any) => { const v: Record<string,number>={...(p[o.id]||{}),[c.weaponId]:Math.max(0,(p[o.id]?.[c.weaponId]||0)-1)}; if(!v[c.weaponId])delete v[c.weaponId]; return {...p,[o.id]:v}; })}>−</button>
                        <span className="lb-num-val">{cur}</span>
                        <button className="lb-num-btn" disabled={remaining<=0}
                          onClick={() => setOptions((p: any) => ({...p,[o.id]:{...(p[o.id]||{}),[c.weaponId]:(p[o.id]?.[c.weaponId]||0)+1}}))}>+</button>
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          }
          if (o.scope === "limitedSlot") {
            const modelCount = totalAppliesCount(unit, o, options);
            const used = poolUsed(unit, o.applies||[], o.replaces, options);
            const isTaken = options[o.id] != null;
            const remaining = modelCount - used;
            const canTake = isTaken || remaining > 0;
            return (
              <div key={o.id} className="lb-opt-section">
                <div className="lb-opt-section-head">{o.label}</div>
                <div className="lb-opt-row">
                  <select className="lb-select" value={options[o.id]||""} disabled={!canTake}
                    style={{opacity:canTake?1:0.45}}
                    onChange={e => setOptions((p: any) => ({...p,[o.id]:e.target.value||null}))}>
                    <option value="">None{!canTake?" (pool exhausted)":""}</option>
                    {choices.filter((c: any) => c.label !== "None").map((c: any) => (
                      <option key={c.weaponId} value={c.weaponId}>
                        {wepName(c.weaponId, c)}{c.pts?` (+${c.pts} pts)`:""}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            );
          }
          return null;
        }

        function renderPmOpt(o: any) {
          const choices = o.choices || [];
          const applyModels = (unit.models||[]).filter((m: any) => (o.applies||[]).includes(m.id));
          let totalModels = 0;
          const pmSlots: { i: number; mNum: number; wepIdx: number; wc: number }[] = [];
          for (const model of applyModels) {
            const mc = modelTypeCount(unit, model.id, options);
            const wc = (model.baseWargear || []).filter((r: any) => {
              const wid = typeof r === 'string' ? r : r.weaponId;
              if (wid !== o.replaces) return false;
              if (o.replacesArcType && typeof r !== 'string' && r.arcType !== o.replacesArcType) return false;
              return true;
            }).length || 1;
            for (let mi = 0; mi < mc; mi++) {
              for (let wi = 0; wi < wc; wi++) pmSlots.push({ i: pmSlots.length, mNum: totalModels, wepIdx: wi, wc });
              totalModels++;
            }
          }
          return (
            <div key={o.id} className="lb-opt-section">
              <div className="lb-opt-section-head">{o.label} — per model</div>
              {pmSlots.map(({ i, mNum, wepIdx, wc }) => {
                const isFirstWepOfModel = wepIdx === 0;
                const isLastWepOfModel = wepIdx === wc - 1;
                let rowLabel: string;
                if (totalModels === 1) rowLabel = wc > 1 ? `Wpn ${wepIdx + 1}` : "";
                else if (wc === 1) rowLabel = `Model ${mNum + 1}`;
                else rowLabel = isFirstWepOfModel ? `Model ${mNum + 1}` : "";
                const borderBottom = (totalModels > 1 && wc > 1)
                  ? (isLastWepOfModel ? "1px solid #f6f6f6" : "none")
                  : undefined;
                return (
                  <div key={i} className="lb-opt-row" style={borderBottom !== undefined ? {borderBottom} : undefined}>
                    {(rowLabel || (totalModels > 1 && wc > 1))
                      ? <span className="lb-opt-label" style={{fontSize:"9.5pt", visibility: rowLabel ? undefined : "hidden"}}>{rowLabel || " "}</span>
                      : null}
                    <select className="lb-select" style={(!rowLabel && !(totalModels > 1 && wc > 1)) ? {flex:1} : undefined}
                      value={perModelOptions[o.id]?.[String(i)] || choices[0]?.weaponId || ""}
                      onChange={e => setPerModelOptions((p: any) => ({...p,[o.id]:{...(p[o.id]||{}),[String(i)]:e.target.value}}))}>
                      {choices.map((c: any) => (
                        <option key={c.weaponId} value={c.weaponId}>
                          {wepName(c.weaponId, c)}{c.pts?` (+${c.pts} pts)`:""}
                        </option>
                      ))}
                    </select>
                  </div>
                );
              })}
            </div>
          );
        }

        function renderPmToggle(o: any) {
          const maxCount = o.maxCount ?? 1;
          const ptsEach = o.ptsEach || 0;
          const applyModels = (unit.models||[]).filter((m: any) => (o.applies||[]).includes(m.id));
          let totalModels = 0;
          const pmSlots: { i: number; mNum: number }[] = [];
          for (const model of applyModels) {
            const mc = modelTypeCount(unit, model.id, options);
            for (let mi = 0; mi < mc; mi++) { pmSlots.push({ i: pmSlots.length, mNum: totalModels }); totalModels++; }
          }
          return (
            <div key={o.id} className="lb-opt-section">
              <div className="lb-opt-section-head">{o.label} — per model</div>
              {pmSlots.map(({ i, mNum }) => {
                const cur = parseInt(perModelOptions[o.id]?.[String(i)] || "0") || 0;
                const rowLabel = totalModels > 1 ? `Model ${mNum + 1}` : "";
                if (maxCount === 1) {
                  return (
                    <label key={i} className="lb-opt-row" style={{cursor:"pointer",display:"flex"}}>
                      {rowLabel ? <span className="lb-opt-label" style={{fontSize:"9.5pt"}}>{rowLabel}</span> : null}
                      <span className="lb-opt-label">
                        <input type="checkbox" checked={cur > 0}
                          onChange={e => setPerModelOptions((p: any) => ({...p,[o.id]:{...(p[o.id]||{}),[String(i)]:e.target.checked?"1":"0"}}))}/>
                        {" "}{o.label}{ptsEach ? <span style={{color:"#c8a84b",fontWeight:500}}> +{ptsEach} pts</span> : null}
                      </span>
                      {o.note ? <span className="lb-opt-note" style={{alignSelf:"center"}}>{o.note}</span> : null}
                    </label>
                  );
                }
                return (
                  <div key={i} className="lb-opt-row">
                    {rowLabel ? <span className="lb-opt-label" style={{fontSize:"9.5pt"}}>{rowLabel}</span> : null}
                    <select className="lb-select"
                      value={String(cur)}
                      onChange={e => setPerModelOptions((p: any) => ({...p,[o.id]:{...(p[o.id]||{}),[String(i)]:e.target.value}}))}>
                      {Array.from({length: maxCount + 1}, (_, n) => (
                        <option key={n} value={String(n)}>
                          {n === 0 ? "None" : `${n} ${o.label}${n > 1 ? "s" : ""}`}{n > 0 && ptsEach ? ` (+${n * ptsEach} pts)` : ""}
                        </option>
                      ))}
                    </select>
                    {o.note ? <span className="lb-opt-note" style={{alignSelf:"center",marginLeft:6}}>{o.note}</span> : null}
                  </div>
                );
              })}
            </div>
          );
        }

        return (
          <>
            {renderUpgradeBlock(ungroupedUpgrades, "Upgrades")}
            {ungroupedSwaps.map(renderSwapOpt)}
            {ungroupedPmToggle.map(renderPmToggle)}
            {ungroupedPm.map(renderPmOpt)}
            {[...optGroupMap.entries()].map(([groupName, groupOpts]) => {
              const gUpgrades = groupOpts.filter((o: any) => o.type==="toggle"||o.type==="namedUpgrade");
              const gSwaps    = groupOpts.filter((o: any) => o.type==="weaponSwap" && !isSwapHidden(o));
              const gPmToggle = groupOpts.filter((o: any) => o.type==="perModelToggle");
              const gPm       = groupOpts.filter((o: any) => o.type==="perModelWeapon");
              return (
                <Fragment key={groupName}>
                  <div className="lb-opt-group-head">{groupName}</div>
                  {renderUpgradeBlock(gUpgrades, groupName + " Upgrades")}
                  {gSwaps.map(renderSwapOpt)}
                  {gPmToggle.map(renderPmToggle)}
                  {gPm.map(renderPmOpt)}
                </Fragment>
              );
            })}
          </>
        );
      })()}

      {/* Psychic spells */}
      {(() => {
        const spellOptsList = opts.filter((o: any) => o.type === "spellPick");
        if (!spellOptsList.length || !unit.psychic) return null;

        const masteryUpgradeOpt = opts.find((o: any) => o.grantsMasteryLevel != null);
        const effectiveML: number = (masteryUpgradeOpt && options[masteryUpgradeOpt.id])
          ? masteryUpgradeOpt.grantsMasteryLevel
          : (unit.psychic.masteryLevel ?? 0);

        const multiSlot = spellOptsList.length > 1;

        function resolvePool(o: any): any[] {
          const rawId: string = o.spellPoolId || unit.psychic?.spellPoolId || "";
          if (rawId === "$mark") {
            const markOpt = opts.find((x: any) => x.type === "markPick");
            const mark = markOpt ? options[markOpt.id] : null;
            return mark ? (sP[mark] || []) : [];
          }
          return sP[rawId] || [];
        }

        const singleChosen: string[] = !multiSlot ? ((options[spellOptsList[0].id] || []) as string[]) : [];

        return (
          <>
            {spellOptsList.map((o: any, oi: number) => {
              if (multiSlot && oi >= effectiveML) return null;
              const pool = resolvePool(o);
              const chosen = (options[o.id] || []) as string[];
              if (!pool.length) return null;
              const slotLabel = multiSlot
                ? `Psychic Spell ${oi + 1} — Mastery ${effectiveML}`
                : `Psychic Spells — Mastery ${effectiveML} (${singleChosen.length}/${effectiveML})`;
              return (
                <div key={o.id} className="lb-opt-section">
                  <div className="lb-opt-section-head">{slotLabel}</div>
                  {pool.map((s: any) => {
                    const isChosen = chosen.includes(s.id);
                    const atLimit = multiSlot
                      ? chosen.length >= 1 && !isChosen
                      : singleChosen.length >= effectiveML && !isChosen;
                    return (
                      <label key={s.id} className="lb-opt-row"
                        style={{cursor: atLimit ? "not-allowed" : "pointer", display:"flex", opacity: atLimit ? 0.45 : 1}}>
                        <span className="lb-opt-label">
                          <input type="checkbox" checked={isChosen} disabled={atLimit}
                            onChange={e => {
                              const nx = e.target.checked ? [...chosen, s.id] : chosen.filter((x: string) => x !== s.id);
                              setOptions((p: any) => ({...p, [o.id]: nx}));
                            }}
                            style={{marginRight:8}}/>
                          {s.name}
                          <span className="lb-opt-pts"> +{s.pts} pts</span>
                          <span className="lb-opt-note">Cast {s.castValue}+: {s.description}</span>
                        </span>
                      </label>
                    );
                  })}
                </div>
              );
            })}
          </>
        );
      })()}

    </div>
  );
}

function PlatoonSquadConfig({ unit, options, setOptions }: any) {
  return (
    <div>
      {(unit.platoonUnits || []).map((pu: any) => {
        const fixed = pu.minSquads != null && pu.minSquads === pu.maxSquads;
        const count = options[pu.id] ?? pu.minSquads ?? 0;
        const min = pu.minSquads ?? 0;
        const max = pu.maxSquads ?? 99;
        return (
          <div key={pu.id} className="lb-opt-section">
            <div className="lb-opt-section-head" style={{display:"flex",justifyContent:"space-between",alignItems:"baseline"}}>
              <span>{pu.name}</span>
              <span style={{fontWeight:500,fontSize:"8pt",color:"#888",letterSpacing:0,textTransform:"none"}}>
                {fixed ? `${min} required` : `${min}–${max === 99 ? "∞" : max} squads`}
              </span>
            </div>
            <div className="lb-opt-row">
              <span className="lb-opt-label">{pu.basePts} pts / squad</span>
              <div className="lb-num-ctrl">
                {fixed ? (
                  <span className="lb-num-val">{count}</span>
                ) : (
                  <>
                    <button className="lb-num-btn"
                      onClick={() => setOptions((p: any) => ({...p, [pu.id]: Math.max(min, (p[pu.id] ?? min) - 1)}))}>−</button>
                    <span className="lb-num-val">{count}</span>
                    <button className="lb-num-btn"
                      onClick={() => setOptions((p: any) => ({...p, [pu.id]: Math.min(max, (p[pu.id] ?? min) + 1)}))}>+</button>
                  </>
                )}
                <span className="lb-opt-pts">{count * pu.basePts} pts</span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function AddEditEntryModal({ unit, existingEntry, factionData, onChange, onClose, allEntries, displayNames, onJoinChange, lists, activeListId, onConfirm, subfactionId: subfactionIdProp }: any) {
  const [options, setOptions] = useState(() => {
    if (existingEntry && unit.platoon) {
      return (unit.platoonUnits || []).reduce((acc: any, pu: any) => {
        acc[pu.id] = (existingEntry.squads || []).filter((s: any) => s.puId === pu.id).length;
        return acc;
      }, {});
    }
    return existingEntry ? { ...existingEntry.options } : defaultOpts(unit, factionData.weaponLists || {});
  });
  const [perModelOptions, setPerModelOptions] = useState(() =>
    existingEntry ? { ...existingEntry.perModelOptions } : defaultPerModel(unit)
  );
  const [selectedListId, setSelectedListId] = useState<string>(() =>
    activeListId && (lists||[]).some((l: any) => l.listId === activeListId)
      ? activeListId
      : (lists?.[0]?.listId || "")
  );
  const cost = calcEntryCost({ options, perModelOptions }, unit, factionData);
  const subfactionId: string = lists
    ? (lists.find((l: any) => l.listId === selectedListId)?.subfactionId || '')
    : (subfactionIdProp || '');
  const isFirst = useRef(true);

  useEffect(() => {
    if (isFirst.current) { isFirst.current = false; return; }
    if (onChange) onChange({ options, perModelOptions });
  }, [options, perModelOptions]);

  function handleDone() {
    if (onConfirm) onConfirm(selectedListId, options, perModelOptions);
    onClose();
  }

  return (
    <LBModal onClose={onClose}>
      <div className="lb-modal-sticky">
        <div className="lb-modal-sticky-inner">
          <div className="lb-modal-head">
            <span>{unit.name}<span className="lb-modal-pts">{cost} pts</span></span>
            {lists && lists.length > 0 && (
              <select className="atl-select" style={{margin:0,flex:"0 1 200px"}} value={selectedListId} onChange={e => setSelectedListId(e.target.value)}>
                {lists.map((l: any) => <option key={l.listId} value={l.listId}>{l.name}</option>)}
              </select>
            )}
            <button className="lb-btn" onClick={handleDone}>{onConfirm ? "Add" : "Done"}</button>
          </div>
          {unit.platoon
            ? <div className="lb-modal-sub">{unit.platoonComposition}</div>
            : <div className="lb-modal-sub">Base: {unit.basePts} pts · {compStr(unit.models)}</div>
          }
        </div>
      </div>
      {unit.platoon
        ? <PlatoonSquadConfig unit={unit} options={options} setOptions={setOptions}/>
        : <EntryOptionConfig
            unit={unit} factionData={factionData}
            options={options} setOptions={setOptions}
            perModelOptions={perModelOptions} setPerModelOptions={setPerModelOptions}
            subfactionId={subfactionId}
          />
      }
      {onJoinChange && allEntries && canJoinUnit(unit) && (() => {
        const eligible = (allEntries as any[]).filter((e: any) => {
          if (e.entryId === existingEntry?.entryId) return false;
          const tu = (factionData.units || []).find((u: any) => u.id === e.unitId);
          return tu && isJoinableUnit(tu) && !canJoinUnit(tu) && !entryHasSteed(e, tu, factionData.namedUpgrades || {});
        });
        const currentJoin = existingEntry?.joinedToEntryId || '';
        return (
          <div className="lb-opt-section">
            <div className="lb-opt-section-head">Joined Unit</div>
            <div className="lb-opt-row">
              <select className="lb-select" style={{flex:1}} value={currentJoin}
                onChange={ev => onJoinChange(ev.target.value || null)}>
                <option value="">— None (Independent) —</option>
                {eligible.map((e: any) => (
                  <option key={e.entryId} value={e.entryId}>
                    {displayNames?.get(e.entryId) || (factionData.units||[]).find((u: any) => u.id === e.unitId)?.name || e.unitId}
                  </option>
                ))}
              </select>
            </div>
          </div>
        );
      })()}
    </LBModal>
  );
}

function UnitPickerModal({ factionData, onSelect, onCancel, initialSlot }: any) {
  const units = factionData.units || [];
  const filtered = initialSlot ? units.filter((u: any) => u.slot === initialSlot) : units;
  const grouped: Record<string, any[]> = {};
  for (const u of filtered) { if (!grouped[u.slot]) grouped[u.slot] = []; grouped[u.slot].push(u); }

  return (
    <LBModal onClose={onCancel}>
      <div className="lb-modal-head" style={{marginTop:16}}>Add {initialSlot || "Unit"}</div>
      <div className="lb-modal-sub">Select a unit to add to your list</div>
      {SLOT_ORDER.filter(s => grouped[s]).map(s => (
        <div key={s}>
          {!initialSlot && <div className="lb-pick-slot-head">{s}</div>}
          {grouped[s].map((u: any) => (
            <div key={u.id} className="lb-pick-row" onClick={() => onSelect(u)}>
              <span className="lb-pick-name">{u.name}</span>
              <span className="lb-pick-pts">
                {u.platoon
                  ? `${(u.platoonUnits||[]).reduce((s: number, pu: any) => s + (pu.minSquads??0)*(pu.basePts||0), 0)}+ pts`
                  : `${u.basePts} pts`}
              </span>
            </div>
          ))}
        </div>
      ))}
    </LBModal>
  );
}

function CoreRulesOverlay({ coreRules, onClose }: any) {
  const [query, setQuery] = useState("");
  const rules = (coreRules || []).filter((r: any) =>
    !query || r.name.toLowerCase().includes(query.toLowerCase())
  );
  return (
    <div>
      <div className="lb-header">
        <button className="lb-btn" onClick={onClose}>← Back</button>
        <div style={{flex:1,fontSize:"13pt",fontWeight:700,color:"#1a1a1a"}}>Core Rules</div>
        <input autoFocus
          style={{flex:"0 0 200px",padding:"4px 9px",border:"1px solid #d0c090",borderRadius:3,fontFamily:"'Rajdhani',sans-serif",fontSize:"10pt"}}
          placeholder="Search rules..."
          value={query}
          onChange={(e: any) => setQuery(e.target.value)}
        />
      </div>
      {rules.length === 0
        ? <div style={{color:"#888",fontStyle:"italic",padding:"12px 2px"}}>No rules match "{query}"</div>
        : rules.map((r: any) => (
          <div key={r.id} style={{padding:"9px 2px",borderBottom:"1px solid #f0e8d0"}}>
            <div style={{fontWeight:700,fontSize:"10.5pt",color:"#1a1a1a",marginBottom:2}}>{r.name}</div>
            <div style={{fontSize:"9.5pt",color:"#444",lineHeight:1.45}}>{r.fullDesc || r.shortDesc}</div>
          </div>
        ))
      }
    </div>
  );
}


function ListBuilderTab({ factionData, currentFile, weapons, weaponLists, namedUpgrades, spellPools, armyRules, coreRules, faction, selectedSubfaction, setSelectedSubfaction, collapsedSections, toggleSection, lists, setLists, activeListId, setActiveListId }: any) {
  const subfactions = faction.subfactions || [];
  const sfLabel = faction.subfactionLabel || "Chapter";
  const lastPtsKey = "alt40k-last-pts";
  const getLastPts = () => { try { return parseInt(localStorage.getItem(lastPtsKey)||"") || 2000; } catch { return 2000; } };
  const saveLastPts = (v: number) => { try { localStorage.setItem(lastPtsKey, String(v)); } catch {} };

  const [battleMode, setBattleMode] = useState(false);
  const [showCoreRules, setShowCoreRules] = useState(false);
  const [showUnitPicker, setShowUnitPicker] = useState(false);
  const [pickerInitialSlot, setPickerInitialSlot] = useState<string|null>(null);
  const [pendingNewUnit, setPendingNewUnit] = useState<any>(null);
  const [editEntryId, setEditEntryId] = useState<string|null>(null);
  const [editSquad, setEditSquad] = useState<{entryId:string,squadId:string}|null>(null);
  const [pendingDelete, setPendingDelete] = useState<string|null>(null);
  const [expandedBattleId, setExpandedBattleId] = useState<string|null>(null);
  const [renamingListId, setRenamingListId] = useState<string|null>(null);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement).tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || (e.target as HTMLElement).isContentEditable) return;
      if (e.key === "b" || e.key === "B") {
        setBattleMode(prev => { if (prev) return false; setExpandedBattleId(null); return true; });
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const activeList = lists.find(l => l.listId === activeListId) || null;
  const activeSubfaction = subfactions.find((s: any) => s.id === activeList?.subfactionId) || null;
  const foc = activeList ? buildFOC(activeList.entries, faction, activeSubfaction, factionData.units || [], activeList.pointsTarget || 0, factionData.namedUpgrades || {}) : [];
  const ptsUsed = activeList ? calcListTotal(activeList, factionData) : 0;
  const displayNames = activeList ? buildDisplayNames(activeList.entries, factionData.units||[]) : new Map<string,string>();

  function updateList(listId: string, updater: (l: any) => any) {
    setLists(lists.map(l => l.listId === listId ? updater(l) : l));
  }

  function createList() {
    const pts = getLastPts();
    const newList = { listId: genId(), name: "New List", subfactionId: selectedSubfaction||"", pointsTarget: pts, entries: [] };
    setLists([...lists, newList]);
    setActiveListId(newList.listId);
    setBattleMode(false);
  }

  function loadList(listId: string) {
    const l = lists.find(x => x.listId === listId);
    if (!l) return;
    setActiveListId(listId);
    setBattleMode(false);
    setExpandedBattleId(null);
    if (l.subfactionId) setSelectedSubfaction(l.subfactionId);
  }

  function deleteList(listId: string) {
    setLists(lists.filter(l => l.listId !== listId));
    if (activeListId === listId) { setActiveListId(null); setBattleMode(false); }
  }

  function makePlatoonSquads(unit: any, counts: Record<string, number>, existingSquads: any[] = []) {
    const wL = factionData.weaponLists || {};
    const squads: any[] = [];
    for (const pu of (unit.platoonUnits || [])) {
      const count = counts[pu.id] ?? pu.minSquads ?? 0;
      const prev = existingSquads.filter((s: any) => s.puId === pu.id);
      for (let i = 0; i < count; i++) {
        squads.push(i < prev.length ? prev[i] : {
          squadId: genId(), puId: pu.id,
          options: defaultOpts(pu, wL), perModelOptions: defaultPerModel(pu)
        });
      }
    }
    return squads;
  }

  function addEntry(unit: any, options: any, perModelOptions: any): string {
    if (!activeList) return '';
    const entryId = genId();
    const slot = effectiveSlot(unit.id, unit.slot, activeSubfaction);
    if (unit.platoon) {
      const squads = makePlatoonSquads(unit, options);
      updateList(activeList.listId, l => ({ ...l, entries: [...l.entries, { entryId, unitId: unit.id, slot, squads }] }));
      return entryId;
    }
    updateList(activeList.listId, l => ({ ...l, entries: [...l.entries, { entryId, unitId: unit.id, slot, options, perModelOptions }] }));
    return entryId;
  }

  function updateEntry(entryId: string, unit: any, options: any, perModelOptions: any) {
    if (!activeList) return;
    if (unit.platoon) {
      const existing = activeList.entries.find((e: any) => e.entryId === entryId);
      const squads = makePlatoonSquads(unit, options, existing?.squads || []);
      updateList(activeList.listId, l => ({
        ...l, entries: l.entries.map((e: any) => e.entryId === entryId ? { ...e, squads } : e)
      }));
      return;
    }
    const nU = factionData.namedUpgrades || {};
    const nowHasSteed = entryHasSteed({ options, perModelOptions }, unit, nU);
    updateList(activeList.listId, l => ({
      ...l, entries: l.entries.map((e: any) => {
        if (e.entryId === entryId) return { ...e, options, perModelOptions };
        if (nowHasSteed && e.joinedToEntryId === entryId) {
          const joinedUnit = (factionData.units || []).find((u: any) => u.id === e.unitId);
          if (joinedUnit && isDedicatedTransport(joinedUnit)) return { ...e, joinedToEntryId: undefined };
        }
        return e;
      })
    }));
  }

  function updateSquadOptions(entryId: string, squadId: string, options: any, perModelOptions: any) {
    if (!activeList) return;
    updateList(activeList.listId, l => ({
      ...l, entries: l.entries.map((e: any) => {
        if (e.entryId !== entryId) return e;
        return { ...e, squads: (e.squads || []).map((s: any) =>
          s.squadId === squadId ? { ...s, options, perModelOptions } : s
        )};
      })
    }));
  }

  function updateEntryJoin(entryId: string, joinedToEntryId: string | null) {
    if (!activeList) return;
    updateList(activeList.listId, l => ({
      ...l, entries: l.entries.map((e: any) =>
        e.entryId === entryId ? { ...e, joinedToEntryId: joinedToEntryId || undefined } : e
      )
    }));
  }

  function deleteEntry(entryId: string) {
    if (!activeList) return;
    updateList(activeList.listId, l => ({ ...l, entries: l.entries.filter((e: any) => e.entryId !== entryId) }));
  }

  function exportList(list: any) {
    const blob = new Blob([JSON.stringify(list, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `${list.name.replace(/\s+/g, "_")}.json`; a.click();
    setTimeout(() => URL.revokeObjectURL(url), 5000);
  }

  function importList() {
    const inp = document.createElement("input");
    inp.type = "file"; inp.accept = ".json";
    inp.onchange = (e: any) => {
      const f = e.target.files?.[0]; if (!f) return;
      const reader = new FileReader();
      reader.onload = ev => {
        try {
          const data = JSON.parse(ev.target?.result as string);
          if (!data.entries) { alert("Invalid list file"); return; }
          setLists([...lists, { ...data, listId: genId() }]);
        } catch { alert("Could not parse list file"); }
      };
      reader.readAsText(f);
    };
    inp.click();
  }

  // ── No active list: list selector ────────────────────────────────────────
  if (!activeList) {
    return (
      <div>
        <div className="lb-header">
          <div style={{fontSize:"18pt",fontWeight:700,flex:1,color:"#1a1a1a"}}>Army Lists</div>
          <button className="lb-btn" onClick={importList}>↑ Import</button>
          <button className="lb-btn lb-btn-primary" onClick={createList}>+ New List</button>
        </div>
        {lists.length === 0 ? (
          <div style={{color:"#888",fontSize:"10pt",fontStyle:"italic",padding:"20px 0"}}>No lists yet. Click "New List" to get started.</div>
        ) : (
          <div className="lb-list-grid">
            {lists.map(l => {
              const used = calcListTotal(l, factionData);
              const sf = subfactions.find((s: any) => s.id === l.subfactionId);
              const over = used > l.pointsTarget;
              return (
                <div key={l.listId} className="lb-list-card" onClick={() => loadList(l.listId)}>
                  <div style={{flex:1}}>
                    <div className="lb-list-name">
                      {l.name}
                      <span style={{fontWeight:500,color:over?"#c04040":"#888",fontSize:"11pt",marginLeft:10}}>
                        ({used}/{l.pointsTarget})
                      </span>
                    </div>
                    <div className="lb-list-meta">
                      {sf ? sf.name : `No ${sfLabel.toLowerCase()}`} · {l.entries.length} unit{l.entries.length!==1?"s":""}
                    </div>
                  </div>
                  <button className="lb-btn lb-btn-danger" style={{flexShrink:0}}
                    onClick={e => { e.stopPropagation(); if (confirm(`Delete "${l.name}"?`)) deleteList(l.listId); }}>
                    Delete
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  if (showCoreRules) {
    return <CoreRulesOverlay coreRules={coreRules} onClose={() => setShowCoreRules(false)} />;
  }

  // ── Shared header (used in build + battle mode) ──────────────────────────
  const pct = Math.min(100, Math.round(ptsUsed / activeList.pointsTarget * 100));
  const over = ptsUsed > activeList.pointsTarget;

  const listHeader = (
    <div className="lb-header">
      {battleMode
        ? <button className="lb-btn" onClick={() => setShowCoreRules(true)}>Core Rules</button>
        : <button className="lb-btn" onClick={() => setActiveListId(null)}>← Lists</button>
      }

      {renamingListId === activeList.listId
        ? <input autoFocus className="lb-name-input"
            defaultValue={activeList.name}
            onBlur={e => { updateList(activeList.listId, l => ({...l, name: e.target.value.trim()||"New List"})); setRenamingListId(null); }}
            onKeyDown={e => { if (e.key==="Enter"||e.key==="Escape") (e.target as HTMLInputElement).blur(); }}
          />
        : <div className="lb-name-input" onClick={() => setRenamingListId(activeList.listId)} title="Click to rename">
            {activeList.name}
          </div>
      }

      <select className="lb-select" value={activeList.subfactionId}
        onChange={e => { updateList(activeList.listId, l => ({...l, subfactionId: e.target.value})); setSelectedSubfaction(e.target.value); }}>
        <option value="">— {sfLabel} —</option>
        {subfactions.map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
      </select>

      <div style={{display:"flex",alignItems:"center",gap:5}}>
        <span style={{fontSize:"18pt",fontWeight:700,color:over?"#c04040":"#7a5800"}}>{ptsUsed}</span>
        <span style={{fontSize:"11pt",color:"#999"}}>/</span>
        <input type="number" className="lb-select" style={{width:70,textAlign:"center",fontWeight:700,fontSize:"11pt"}}
          value={activeList.pointsTarget}
          onChange={e => { const v=parseInt(e.target.value)||2000; saveLastPts(v); updateList(activeList.listId, l=>({...l,pointsTarget:v})); }}
        />
        <span style={{fontSize:"9.5pt",color:"#888"}}>pts</span>
      </div>

      <span style={{display:"flex",alignItems:"center",gap:7,marginLeft:4}}>
        <span style={{fontSize:"9.5pt",color:"#888",fontWeight:600,letterSpacing:".06em",textTransform:"uppercase"}}>Battle</span>
        <label className="toggle-switch" style={{flexShrink:0}}>
          <input type="checkbox" checked={battleMode} onChange={e => { setBattleMode(e.target.checked); setExpandedBattleId(null); }}/>
          <span className="toggle-slider"/>
        </label>
      </span>

      {!battleMode && <button className="lb-btn" onClick={() => exportList(activeList)}>↓ Export</button>}

      <div className="lb-pts-bar" style={{width:"100%"}}>
        <div className={`lb-pts-fill${over?" over":""}`} style={{width:`${pct}%`}}/>
      </div>
    </div>
  );

  // ── Battle mode ──────────────────────────────────────────────────────────
  if (battleMode) {
    const bmJoinedByTarget = new Map<string, any[]>();
    const bmJoinedIds = new Set<string>();
    for (const e of activeList.entries) {
      if (e.joinedToEntryId && activeList.entries.some((t: any) => t.entryId === e.joinedToEntryId)) {
        if (!bmJoinedByTarget.has(e.joinedToEntryId)) bmJoinedByTarget.set(e.joinedToEntryId, []);
        bmJoinedByTarget.get(e.joinedToEntryId)!.push(e);
        bmJoinedIds.add(e.entryId);
      }
    }
    const bySlot: Record<string, any[]> = {};
    for (const e of activeList.entries) {
      if (bmJoinedIds.has(e.entryId)) continue;
      if (!bySlot[e.slot]) bySlot[e.slot] = [];
      bySlot[e.slot].push(e);
    }
    return (
      <div>
        {listHeader}
        {activeList.entries.length === 0 && (
          <div style={{color:"#888",fontSize:"10pt",fontStyle:"italic"}}>No units in this list.</div>
        )}
        {SLOT_ORDER.filter(s => bySlot[s]).map(s => (
          <div key={s}>
            <div className="lb-slot-head">{s}</div>
            {bySlot[s].map((e: any) => {
              const unit = (factionData.units||[]).find((u: any) => u.id === e.unitId);
              if (!unit) return null;
              const dn = displayNames.get(e.entryId) || unit.name;
              const cost = calcEntryCost(e, unit, factionData);
              const expanded = expandedBattleId === e.entryId;
              const bmJoinedICs = bmJoinedByTarget.get(e.entryId) || [];
              const bmTotalCost = cost + bmJoinedICs.reduce((sum: number, ic: any) => {
                const icUnit = (factionData.units||[]).find((u: any) => u.id === ic.unitId);
                return sum + (icUnit ? calcEntryCost(ic, icUnit, factionData) : 0);
              }, 0);
              return (
                <div key={e.entryId}>
                  <div className={`lb-battle-entry${expanded?" lb-active":""}`}
                    onClick={() => setExpandedBattleId(expanded ? null : e.entryId)}>
                    <span className="lb-battle-name">{dn}</span>
                    <span className="lb-battle-pts">{bmTotalCost} pts</span>
                    <span style={{color:"#aaa",fontSize:"9pt"}}>{expanded?"▲":"▼"}</span>
                  </div>
                  {expanded && (
                    <div style={{marginBottom:10}}>
                      <BattleUnitBlock
                        entry={e} displayName={dn} unit={unit}
                        weapons={weapons} weaponLists={weaponLists}
                        namedUpgrades={namedUpgrades} spellPools={spellPools}
                        armyRules={armyRules} coreRules={coreRules}
                        entryCost={cost}
                        collapsedSections={collapsedSections}
                        toggleSection={toggleSection}
                      />
                      {bmJoinedICs.map((ic: any) => {
                        const icUnit = (factionData.units||[]).find((u: any) => u.id === ic.unitId);
                        if (!icUnit) return null;
                        const icCost = calcEntryCost(ic, icUnit, factionData);
                        const icDn = displayNames.get(ic.entryId) || icUnit.name;
                        return (
                          <BattleUnitBlock key={ic.entryId}
                            entry={ic} displayName={`+ ${icDn}`} unit={icUnit}
                            weapons={weapons} weaponLists={weaponLists}
                            namedUpgrades={namedUpgrades} spellPools={spellPools}
                            armyRules={armyRules} coreRules={coreRules}
                            entryCost={icCost}
                            collapsedSections={collapsedSections}
                            toggleSection={toggleSection}
                          />
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    );
  }

  // ── Build mode ───────────────────────────────────────────────────────────
  const joinedICsByTarget = new Map<string, any[]>();
  const joinedEntryIds = new Set<string>();
  for (const e of activeList.entries) {
    if (e.joinedToEntryId && activeList.entries.some((t: any) => t.entryId === e.joinedToEntryId)) {
      if (!joinedICsByTarget.has(e.joinedToEntryId)) joinedICsByTarget.set(e.joinedToEntryId, []);
      joinedICsByTarget.get(e.joinedToEntryId)!.push(e);
      joinedEntryIds.add(e.entryId);
    }
  }

  const bySlot2: Record<string, any[]> = {};
  for (const e of activeList.entries) {
    if (joinedEntryIds.has(e.entryId)) continue;
    if (!bySlot2[e.slot]) bySlot2[e.slot] = [];
    bySlot2[e.slot].push(e);
  }
  const focOk = foc.every(f => f.ok);

  return (
    <div>
      {listHeader}
      {foc.length > 0 && (
        <FOCSlotPanel foc={foc} onAddUnit={slot => { setPickerInitialSlot(slot); setShowUnitPicker(true); }}/>
      )}
      {!focOk && (
        <div style={{fontSize:"9pt",color:"#c04040",marginBottom:10,fontStyle:"italic"}}>
          ⚠ FOC requirements not met — check slot counts above.
        </div>
      )}

      {activeList.entries.length === 0 ? (
        <div style={{color:"#888",fontSize:"10pt",fontStyle:"italic",padding:"10px 0"}}>No units yet — click a slot above to start building.</div>
      ) : (
        SLOT_ORDER.filter(s => bySlot2[s]).map(slot => (
          <div key={slot}>
            <div className="lb-slot-head">{slot}</div>
            {bySlot2[slot].map((e: any) => {
              const unit = (factionData.units||[]).find((u: any) => u.id === e.unitId);
              if (!unit) return null;
              const dn = displayNames.get(e.entryId) || unit.name;
              const cost = calcEntryCost(e, unit, factionData);
              if (unit.platoon) {
                return (
                  <div key={e.entryId}>
                    <div className={`lb-entry${pendingDelete === e.entryId ? " lb-entry-confirm" : ""}`}
                      onClick={() => { if (pendingDelete === e.entryId) { setPendingDelete(null); return; } setEditEntryId(e.entryId); }} style={{cursor:"pointer"}}>
                      <span className="lb-entry-name">{dn}</span>
                      {pendingDelete === e.entryId ? (
                        <>
                          <span style={{fontSize:"8.5pt",color:"#c04040",fontWeight:600,whiteSpace:"nowrap"}}>Remove?</span>
                          <button className="lb-del-confirm" onClick={ev => { ev.stopPropagation(); deleteEntry(e.entryId); setPendingDelete(null); }}>Confirm</button>
                          <button className="lb-icon-btn" onClick={ev => { ev.stopPropagation(); setPendingDelete(null); }}>✕</button>
                        </>
                      ) : (
                        <>
                          <span className="lb-entry-pts">{cost} pts</span>
                          <button className="lb-icon-btn danger" title="Remove"
                            onClick={ev => { ev.stopPropagation(); setPendingDelete(e.entryId); }}>✕</button>
                        </>
                      )}
                    </div>
                    <div className="lb-platoon-squads">
                      {(e.squads || []).map((squad: any) => {
                        const pu = (unit.platoonUnits || []).find((p: any) => p.id === squad.puId);
                        if (!pu) return null;
                        const squadCost = calcEntryCost({ options: squad.options || {}, perModelOptions: squad.perModelOptions || {} }, pu, factionData);
                        const sameType = (e.squads || []).filter((s: any) => s.puId === squad.puId);
                        const typeIdx = sameType.indexOf(squad);
                        const label = sameType.length > 1 ? `${pu.name} ${toRoman(typeIdx + 1)}` : pu.name;
                        return (
                          <div key={squad.squadId} className="lb-squad-entry"
                            onClick={() => setEditSquad({ entryId: e.entryId, squadId: squad.squadId })}>
                            <span className="lb-squad-name">{label}</span>
                            <span className="lb-entry-pts">{squadCost} pts</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              }
              const joinedICs = joinedICsByTarget.get(e.entryId) || [];
              const totalCost = cost + joinedICs.reduce((sum: number, ic: any) => {
                const icUnit = (factionData.units||[]).find((u: any) => u.id === ic.unitId);
                return sum + (icUnit ? calcEntryCost(ic, icUnit, factionData) : 0);
              }, 0);
              return (
                <div key={e.entryId} className={`lb-entry${pendingDelete === e.entryId ? " lb-entry-confirm" : ""}`}
                  onClick={() => { if (pendingDelete === e.entryId) { setPendingDelete(null); return; } setEditEntryId(e.entryId); }} style={{cursor:"pointer"}}>
                  <span className="lb-entry-name">
                    {dn}
                    {joinedICs.map((ic: any) => {
                      const icUnit = (factionData.units||[]).find((u: any) => u.id === ic.unitId);
                      if (!icUnit) return null;
                      const icCost = calcEntryCost(ic, icUnit, factionData);
                      return (
                        <span key={ic.entryId}>
                          <span style={{margin:'0 5px'}}>+</span>
                          <span className="lb-joined-ic-inline"
                            onClick={ev => { ev.stopPropagation(); setEditEntryId(ic.entryId); }}>
                            {displayNames.get(ic.entryId) || icUnit.name} ({icCost}pts)
                          </span>
                        </span>
                      );
                    })}
                  </span>
                  {pendingDelete === e.entryId ? (
                    <>
                      <span style={{fontSize:"8.5pt",color:"#c04040",fontWeight:600,whiteSpace:"nowrap"}}>Remove?</span>
                      <button className="lb-del-confirm" onClick={ev => { ev.stopPropagation(); deleteEntry(e.entryId); setPendingDelete(null); }}>Confirm</button>
                      <button className="lb-icon-btn" onClick={ev => { ev.stopPropagation(); setPendingDelete(null); }}>✕</button>
                    </>
                  ) : (
                    <>
                      <span className="lb-entry-pts">{totalCost} pts</span>
                      <button className="lb-icon-btn danger" title="Remove"
                        onClick={ev => { ev.stopPropagation(); setPendingDelete(e.entryId); }}>✕</button>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        ))
      )}

      {showUnitPicker && (
        <UnitPickerModal factionData={factionData} initialSlot={pickerInitialSlot}
          onSelect={u => {
            setShowUnitPicker(false);
            setPickerInitialSlot(null);
            setPendingNewUnit(u);
          }}
          onCancel={() => { setShowUnitPicker(false); setPickerInitialSlot(null); }}
        />
      )}

      {pendingNewUnit && (
        <AddEditEntryModal unit={pendingNewUnit} factionData={factionData}
          subfactionId={activeList?.subfactionId || ''}
          onConfirm={(_listId: string, options: any, perModelOptions: any) => {
            addEntry(pendingNewUnit, options, perModelOptions);
          }}
          onClose={() => setPendingNewUnit(null)}
        />
      )}

      {editEntryId && (() => {
        const e = activeList.entries.find((x: any) => x.entryId === editEntryId);
        const unit = e ? (factionData.units||[]).find((u: any) => u.id === e.unitId) : null;
        if (!e || !unit) return null;
        const icUnit = canJoinUnit(unit);
        return (
          <AddEditEntryModal unit={unit} existingEntry={e} factionData={factionData}
            subfactionId={activeList?.subfactionId || ''}
            onChange={({ options, perModelOptions }) => updateEntry(editEntryId, unit, options, perModelOptions)}
            onClose={() => setEditEntryId(null)}
            allEntries={icUnit ? activeList.entries : undefined}
            displayNames={icUnit ? displayNames : undefined}
            onJoinChange={icUnit ? (targetId: string | null) => updateEntryJoin(editEntryId, targetId) : undefined}
          />
        );
      })()}

      {editSquad && (() => {
        const e = activeList.entries.find((x: any) => x.entryId === editSquad.entryId);
        const platoonUnit = e ? (factionData.units||[]).find((u: any) => u.id === e.unitId) : null;
        const squad = e?.squads?.find((s: any) => s.squadId === editSquad.squadId);
        const pu = squad ? (platoonUnit?.platoonUnits || []).find((p: any) => p.id === squad.puId) : null;
        if (!squad || !pu) return null;
        return (
          <AddEditEntryModal unit={pu} existingEntry={squad} factionData={factionData}
            subfactionId={activeList?.subfactionId || ''}
            onChange={({ options, perModelOptions }) => updateSquadOptions(editSquad.entryId, editSquad.squadId, options, perModelOptions)}
            onClose={() => setEditSquad(null)}
          />
        );
      })()}
    </div>
  );
}


function OptionsPage({ faction, unitsBySlot, hiddenUnits, setHiddenUnits, selectedSubfaction, setSelectedSubfaction }) {
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
        <strong>Customise your codex view.</strong> Use the toggles below to hide units you don't own or don't use — they'll be removed from all unit listings. All units are shown by default.
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

      {selectedSubfaction && (() => {
        const sf = subfactions.find((s: any) => s.id === selectedSubfaction);
        const rules = sf?.rules || [];
        if (!sf || rules.length === 0) return null;
        return (
          <div style={{marginBottom:20}}>
            <div className="section-head">{sf.name} Rules</div>
            {rules.map((r: any) => (
              <div key={r.id} className="rule-entry" style={{padding:"8px 0"}}>
                <div className="rule-entry-name">{r.name}</div>
                <div className="rule-entry-desc">{r.fullDesc||r.shortDesc||""}</div>
              </div>
            ))}
          </div>
        );
      })()}

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
  const [activePage, setActivePage] = useState("list-builder");
  const [navHeight, setNavHeight] = useState(44);
  const [hiddenUnits, setHiddenUnits] = useState(new Set());
  const [selectedSubfaction, setSelectedSubfaction] = useState("");
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(() => {
    try { const s = localStorage.getItem("alt40k-collapsed-sections"); return new Set(s ? JSON.parse(s) : ["specialRules", "wargear"]); }
    catch { return new Set(["specialRules", "wargear"]); }
  });
  function toggleSection(id: string) {
    setCollapsedSections(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      try { localStorage.setItem("alt40k-collapsed-sections", JSON.stringify([...next])); } catch {}
      return next;
    });
  }
  const [lists, setListsRaw] = useState<any[]>([]);
  const [activeListId, setActiveListId] = useState<string|null>(null);
  const [addToListUnit, setAddToListUnit] = useState<any>(null);
  function setLists(next: any[]) { setListsRaw(next); if (currentFile) saveLists(currentFile, next); }

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

  useEffect(() => {
    if (currentFile) { setListsRaw(loadLists(currentFile)); setActiveListId(null); }
  }, [currentFile]);

  function confirmAddToList(unit: any, listId: string, options: any, perModelOptions: any) {
    const list = lists.find((l: any) => l.listId === listId);
    if (!list || !factionData) return;
    const subfaction = (factionData.faction?.subfactions || []).find((s: any) => s.id === list.subfactionId) || null;
    const slot = effectiveSlot(unit.id, unit.slot, subfaction);
    const entryId = genId();
    const newEntry = unit.platoon
      ? { entryId, unitId: unit.id, slot, squads: [] }
      : { entryId, unitId: unit.id, slot, options, perModelOptions };
    setLists(lists.map((l: any) => l.listId === listId ? { ...l, entries: [...l.entries, newEntry] } : l));
  }

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
        setActivePage(saved?.activePage         ?? "list-builder");
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

  // Save state on significant changes (page nav, options, subfaction)
  useEffect(() => {
    if (!currentFile) return;
    saveState(currentFile, hiddenUnits, selectedSubfaction, activePage, window.scrollY);
  }, [currentFile, hiddenUnits, selectedSubfaction, activePage]);

  // Debounced scroll save
  useEffect(() => {
    if (!currentFile) return;
    function onScroll() {
      if (scrollSaveTimer.current) clearTimeout(scrollSaveTimer.current);
      scrollSaveTimer.current = setTimeout(() => {
        saveState(currentFile, hiddenUnits, selectedSubfaction, activePageRef.current, window.scrollY);
      }, 200);
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => { window.removeEventListener("scroll", onScroll); };
  }, [currentFile, hiddenUnits, selectedSubfaction]);

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
    if (activePage === "core-rules" || activePage === "army-rules") { setActivePage("list-builder"); return; }
    if (typeof activePage !== 'string' || !activePage.startsWith("slot-")) return;
    const slot = activePage.replace("slot-", "");
    if (!unitsBySlot[slot] || unitsBySlot[slot].every(u => hiddenUnits.has(u.id))) {
      setActivePage("list-builder");
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
    ...SLOT_ORDER.filter(s => unitsBySlot[s] && unitsBySlot[s].some(u => !hiddenUnits.has(u.id))).map(s=>({ id:`slot-${s}`, label:s })),
    { id:"list-builder", label:"List Builder" },
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
.group-head { font-weight: 700; font-size: 9.5pt; letter-spacing: 0.10em; text-transform: uppercase; color: #333; margin: 8px 0 4px; border-bottom: 1px solid #ccc; padding-bottom: 2px; }
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
.rules-col { text-align: left !important; font-size: 8.5pt; color: #444; white-space: pre-line; }
.rule-name { font-weight: 700; font-size: 9pt; color: #1a1a1a; }
.option-list { list-style: none; }
.option-list li { font-size: 9pt; font-weight: 500; padding: 2.5px 0; border-bottom: 1px solid #f0f0f0; line-height: 1.4; }
.option-list li:last-child { border-bottom: none; }
.option-cost { color: #7a5800; font-weight: 600; margin-left: 4px; }
.upgrade-note { font-size: 8.5pt; font-weight: 400; color: #666; font-style: italic; display: block; line-height: 1.4; margin-top: 1px; }
@media print { body { padding: 10mm 12mm; } .col-block { break-inside: avoid; } }`;

    const js = `const d=window.__D__;
const SO=["HQ","Advisor","Troop","Elite","Fast Attack","Heavy Support","Flyer","Ded. Transport","Lord of War","Fortification"];
const SS={"HQ":["#e8f0ff","#1a3a6e","#4a7fc1"],"Advisor":["#e8ffe8","#1a5a1a","#3a9950"],"Troop":["#ffe8e8","#6e1a1a","#b94040"],"Elite":["#f0e8ff","#5a2080","#7a4ab9"],"Fast Attack":["#fff8e0","#5a4a00","#b99340"],"Heavy Support":["#e0f4ff","#004a5a","#3a8099"],"Flyer":["#e0fff4","#005a3a","#3a9980"],"Ded. Transport":["#ffe0fa","#5a0050","#994080"],"Lord of War":["#fff0e8","#6e2a00","#c06030"],"Fortification":["#f0f0f0","#3a3a3a","#708090"]};
function fS(v,k){if(v==null)return"—";if(k==="M")return v+'"';if(["WS","BS","Sv"].includes(k))return typeof v==="number"?v+"+":v;return String(v);}
function fR(p){if(p.templateType==="Flame")return"Flame";if(p.templateType==="Hellstorm")return"Hellstorm";if(!p.maxRange&&!p.templateType)return"Melee";return(p.minRange?p.minRange+'"–':"")+p.maxRange+'"';}
function wB(id){return d.weapons.find(w=>w.id===id);}
function rB(id,inl){return(inl||[]).find(r=>r.id===id)||d.armyRules.find(r=>r.id===id)||d.coreRules.find(r=>r.id===id);}
function rN(ids){if(!ids)return"—";if(typeof ids==="string")return ids||"—";return ids.length?ids.map(id=>{const r=rB(id,[]);return r?r.name:id;}).join(", "):"—";}
function slStr(lim,slot){if(!lim)return"";if(slot==="Advisor")return"0–3 per Troop";if(slot==="Ded. Transport")return"0–1 per transportable unit";if(slot==="Fortification")return"0–1 per 1000pts";const[mn,mx]=lim;if(mn===mx)return mn+" slot"+(mn!==1?"s":"");if(mx===null)return mn+"+ slots";return mn+"–"+mx+" slots";}
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
  ded.forEach(id=>{const rule=rB(id,inl);const mn=spec.find(r=>r.id===id)?.label;const isInl=inl.some(r=>r.id===id);const desc=isInl?rule?.fullDesc:(rule?.fullDesc||rule?.shortDesc);rules+='<div class="col-block-tight"><li style="list-style:none;padding:3px 0;font-size:9pt;line-height:1.4"><span class="rule-name">'+(rule?.name||id)+'</span>'+(mn?'<span style="font-size:8pt;color:#888;margin-left:4px">('+mn+')</span>':'')+(desc?' — '+desc:'')+'</li></div>';});
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
SO.filter(s=>bySlot[s]).forEach(slot=>{const lim=d.slotLimits[slot];body+='<div class="slot-section-row"><div class="slot-section-head">'+slot+'</div>'+(lim?'<div class="slot-section-limits">'+slStr(lim,slot)+'</div>':'')+'</div>';bySlot[slot].forEach((unit,i)=>{if(i>0)body+='<hr class="unit-divider">';body+=renderUnit(unit);});});
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
          <select className="nav-mobile-select" value={activePage.startsWith("slot-")?activePage:""} style={activePage.startsWith("slot-")?undefined:{color:"#888",borderColor:"#444",background:"#1a1a1a"}} onChange={e=>setActivePage(e.target.value)}>
            <option value="" disabled>Unit Types</option>
            {navPages.filter(p=>p.id!=="list-builder"&&p.id!=="options").map(p=><option key={p.id} value={p.id}>{p.label}</option>)}
          </select>
          {navPages.filter(p=>p.id!=="list-builder"&&p.id!=="options").map(p=>(
            <button key={p.id}
              className={`nav-btn nav-page-btn${activePage===p.id?" active":""}`}
              onClick={()=>setActivePage(p.id)}>
              {p.label}
            </button>
          ))}
          <button
            className={`nav-btn${activePage==="list-builder"?" active":""}`}
            style={activePage==="list-builder"?undefined:{color:"#888",borderColor:"#333"}}
            onClick={()=>setActivePage("list-builder")}>
            My Lists
          </button>
          <button
            className={`nav-btn${activePage==="options"?" active":""}`}
            style={activePage==="options"?undefined:{color:"#888",borderColor:"#333"}}
            onClick={()=>setActivePage("options")}>
            Options
          </button>
          <UnitSearch allUnits={factionData.units||[]} hiddenUnits={hiddenUnits} onSelect={handleUnitSelect}/>
          <RulesSearch coreRules={coreRules} armyRules={armyRules} commonWargearRef={faction.commonWargearRef||[]}/>
          <button className="nav-btn" onClick={openPrintTab} style={{color:"#888",borderColor:"#333"}}>
            ⎙ Print
          </button>
          <button className="nav-btn" onClick={()=>{setFactionData(null);setCurrentFile(null);setError(null);}} style={{color:"#888",borderColor:"#333"}}>← Factions</button>
        </nav>
      </div>

      <div className="codex-outer">
        <div className="codex-page">
          <div className="faction-header">
            <div>
              <div className="faction-name">{faction.name||"Unknown Faction"}</div>
              <div className="faction-subtitle">Alternate 40k Rules · Unofficial Codex</div>
            </div>
            <div className="faction-version">v{faction.version||"1.0"}</div>
          </div>


          {SLOT_ORDER.filter(s=>unitsBySlot[s]).map(slot => activePage===`slot-${slot}` && (
            <div key={slot}>
              <div className="slot-section-row">
                <div className="slot-section-head">{slot}</div>
                {slotLimits[slot] && (
                  <div className="slot-section-limits">{slotLimitStr(slotLimits[slot], slot)}</div>
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
                    collapsedSections={collapsedSections} toggleSection={toggleSection}
                    onAddToList={setAddToListUnit}
                  />
                </div>
              ))}
            </div>
          ))}

          {activePage==="list-builder" && (
            <ListBuilderTab
              factionData={factionData} currentFile={currentFile}
              weapons={weapons} weaponLists={weaponLists}
              namedUpgrades={namedUpgrades} spellPools={spellPools}
              armyRules={armyRules} coreRules={coreRules}
              faction={faction}
              selectedSubfaction={selectedSubfaction} setSelectedSubfaction={setSelectedSubfaction}
              collapsedSections={collapsedSections} toggleSection={toggleSection}
              lists={lists} setLists={setLists} activeListId={activeListId} setActiveListId={setActiveListId}
            />
          )}

          {activePage==="options" && (
            <OptionsPage
              faction={faction} unitsBySlot={unitsBySlot}
              hiddenUnits={hiddenUnits} setHiddenUnits={setHiddenUnits}
              selectedSubfaction={selectedSubfaction} setSelectedSubfaction={setSelectedSubfaction}
            />
          )}

        </div>
      </div>

      {addToListUnit && factionData && (
        <AddEditEntryModal
          unit={addToListUnit}
          factionData={factionData}
          lists={lists}
          activeListId={activeListId}
          onConfirm={(listId: string, options: any, perModelOptions: any) =>
            confirmAddToList(addToListUnit, listId, options, perModelOptions)
          }
          onClose={() => setAddToListUnit(null)}
        />
      )}
    </div>
  );
}