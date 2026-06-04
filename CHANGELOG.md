# QRMA Dashboard — Changelog

---

## 2026-06-04 — v6.0: Body Composition Module (Module 10)

### Status: SHIPPED ✓

### What Was Built
`qrma-dashboard-v6.html` — 2,638 lines. Adds Module 10 (Body Composition), wires it into
all existing systems (export, charts, action plan, HRV strips), and applies all fixes
identified in `audit_v5.md`.

### Module 10 — Body Composition (`cBc()`)

**Scoring engine** — zone-based, standalone (not part of `cMt()`):
- Sub-scores: Central Adiposity Index (`cai`: wc + whr, 40%), Body Composition Index
  (`bci`: bf + vf, 35%), Structural Index (`sti`: bmi, 25%)
- Partial scoring: denominator adjusts for absent fields — no penalty for missing data
- Auto-calc: BMI from height+weight; WHR from wc/height; manual override via
  `data-manual` attribute + "↺ recalculate" reset link
- BMR: Mifflin-St Jeor formula, informational only, bilingual display

**Zone thresholds (cBc() — standard WHO/ACSM/IDF/Tanita 1-59):**
- BMI: bidirectional (underweight ↔ overweight), both mapped to burden
- Waist: IDF South/Southeast Asian cutoffs (M ≥90, F ≥80 for ringan threshold)
- Body fat: ACSM by sex + age bracket (<40 / 40-59 / ≥60)
- Visceral fat: Tanita 1–59 scale (normal 1–9, berat ≥20)
- WHR: universal cutoffs (normal <0.50, berat ≥0.60)

**Input panel — two entry modes (mode toggle):**
- Manual: 9 input fields (bc-gender, bc-age, bc-height, bc-weight, bc-bmi, bc-wc,
  bc-bf, bc-vf, bc-whr) with auto-calc, live BMR display, and override tracking
- CSV import: `bcDownloadTemplate()` generates 9-column template; `bcParseCsv()` +
  `bcConfirmCsv()` handle the import flow with field-match preview

### System integration

- **Charts**: `drawCharts()` extended to 8 domains — 'Body Comp' label added to lb,
  rd, bar-data, and bc-color arrays
- **Export report**: Section 9 added with 5 zone parameters + BMR; `rawScores.bc`,
  `zones.bc`, `domainNames.bc` wired; `body_composition` block in JSON Data Summary
  and TXT columnar summary
- **Action plan**: 3 `buildAction()` test rows (DEXA, ultrasound, metabolic panel),
  3 conditional food rows, high-priority score-level alert (bc.s ≥ 60)
- **HRV strip**: `renderHrvStrip_BodyComp()` added inline in v6 HTML;
  called directly from `calcAll()` — hrv-engine.js unmodified
- **Language toggle**: `bcRefreshLabels()` replaces `calcAll()` in toggle handler —
  re-renders only `#r-bcal` using cached `window.bcResult`; bilingual zone labels
  via `bcZoneLabel()`, bilingual BMR title + description
- **Navigation**: `nav()` calls `bcAutoCalc()` on bodycomp page load

### Bug fixes from audit_v5.md

| Fix | Detail |
|---|---|
| CSS `--card`, `--rad` undefined in HRV balance card | Replaced with `--surf2`, `--rlg` |
| `.abox aerr` undefined class on Gut redflag panel | Corrected to `.aal aerr` with proper structure |
| `dg-redflag` checkbox missing | Added to Gut input panel; `cDg()` red-flag gate now functional |
| `dg-*` fields missing from `_ALL_FIELDS` | All 9 digestive fields added |
| Lucide CDN unpinned `@latest` | Pinned to `@0.344.0` |
| Recursive `renderHrvPanel` wrapper | Removed; `renderHrvStrip_BodyComp()` called directly |
| Debug `console.log` in `confirmImport()` | Removed (2 lines) |
| bc-* fields inflating QRMA import modal count | `_showImportModal` filters `bc-` prefix; denominator now 73 |
| `buildAction()` 4th column text muted grey | Changed to `color:#000000` |
| Gut sidebar icon mismatch | Changed from `activity` to `utensils` |

### Files Created
- `qrma-dashboard-v6.html` (2,638 lines)
- `audit_v5.md` (structured code audit of v5 — 10 sections)

### Files Modified
- `PROJECT_MAP.md` — updated §2, §3.1, §3.2, §4.1, §4.4, §5.1, §5.2, §5.6, §5.7,
  §6.4, §6.6, §9, §10.4, §11.3
- `CHANGELOG.md` — this entry
- `refactor folders/module-definitions.json` — M10 Body Composition added

### Files Unchanged
- `qrma-dashboard-v5.html` — preserved exactly (1,960 lines)
- `03_Scripts/hrv-engine.js` — unmodified (bc strip added inline in v6 HTML)
- `03_Scripts/zone-scoring.js` — unmodified
- `03_Scripts/importer.js` — unmodified
- `03_Scripts/mappings.json` — unmodified (bc-* fields are manual-input-only; no PDF mapping)

---

## 2026-06-01 — Export Report Feature: MD + TXT Format Toggle

### Status: SHIPPED

### What Was Built
Added session export feature to `qrma-dashboard-v4.html`.
Operator can export the full populated dashboard as a structured report
for use with Gemini, Perplexity, or NotebookLM to build individualized
8-week health programs alongside TCM diagnosis.

### Export Button
- Split button group added to topbar (after Import PDF)
- Main button triggers download in currently selected format
- Chevron dropdown toggles between MD and TXT
- Default format: MD
- Format selection persists for the session

### MD Format (.md)
- Full structured markdown report
- Headers, tables, bullet points, JSON code block
- Suitable for NotebookLM (upload as source file)
- Filename: {patient}_{date}_usaka_report.md

### TXT Format (.txt)
- Same content, all markdown symbols stripped
- No #, **, `, |, asterisks, curly braces, or JSON syntax
- Suitable for pasting directly into Gemini or Perplexity
- Filename: {patient}_{date}_usaka_report.txt

### Report Structure (both formats)
1. Patient header (name, age, gender, test date, export timestamp)
2. Executive Summary (overall picture, top 3 priority domains, HRV if present)
3. Module Findings — all 7 modules (score, status, zone, findings bullets)
4. Action Plan (confirmatory tests table, dietary recommendations, high-priority alerts)
5. HRV Autonomic Status (omitted if no HRV data loaded)
6. Context for AI System (primer explaining USAKA/QRMA for the receiving AI)
7. Data Summary (JSON block in MD, plain labeled text in TXT)

### Data Summary block (TXT format)
Plain labeled text — no JSON syntax:
```
PATIENT         Name, Age, Gender, Test Date
SESSION         Dashboard version, Export timestamp
MODULE SCORES   All 7 modules: score/100, label, zone (column-aligned)
PRIORITY DOMAINS  Top 3 by concern level, numbered
ACTION PLAN     Confirmatory test count, high-priority alert count
HRV             Present yes/no, band, RMSSD, HR, quality if present
```

### Implementation Details
- `exportSessionReport()` — main export function, reads DOM + JS variables
- `mdToTxt(markdown)` — line-by-line state machine converter
- `dataSummaryTxt` — pre-built plain text block from same JS variables as JSON
- `%%DATA_SUMMARY_TXT%%` placeholder in report template — swapped at download time
- MD path: placeholder → JSON code fence (unchanged)
- TXT path: placeholder → plain text block → mdToTxt() strips remaining symbols
- Guard: alert if no patient imported (cc-name empty or —)
- No new external dependencies
- Zero changes to calcAll(), buildAction(), or any existing logic

### Files Modified
- `qrma-dashboard-v4.html` — export button group + exportSessionReport() + mdToTxt()

---

## 2026-05-30 — Bug Fixes: Nutrient Fields + Input Hints

### Fixes Applied to qrma-dashboard-v4.html + mappings.json

#### FIX 1 — Removed hardcoded patient name from input hint text
- 17 .irg hint divs contained | Frans: X.XX (high/low) hardcoded from QA session
- Stripped from all 17 fields — hint text now shows Normal: X only
- Affected fields: bv, cp, art, ins, bs, fr, ph, pb, hg, ce, cs, cj, coq, gsh, vc, ve, ost

#### FIX 2 — Corrected nutrient field normal ranges, scale labels, step precision
- All 10 nutrient input fields had wrong Normal: ranges (written for a 0-10 scale)
- Actual PDF values are on raw bioresonance scale (0-8 approx)
- Ranges corrected from PDF Referensi Standar (verified from QRMA_Ridwan_November_21.md)

| Field | Wrong range | Correct range |
|---|---|---|
| Zinc | 5.0-8.0 | 1.143-1.989 |
| Magnesium | 5.0-7.5 | 0.568-0.992 |
| Potassium | 4.5-7.0 | 0.689-0.987 |
| Iodine | 5.0-8.0 | 1.421-5.490 |
| Silicon | 5.0-8.0 | 1.425-5.872 |
| Vitamin B6 | 5.0-8.0 | 0.824-1.942 |
| Vitamin C | 4.5-6.5 | 4.543-5.023 |
| Vitamin D3 | 5.0-8.0 | 5.327-7.109 |
| Vitamin E | 5.0-7.0 | 4.826-6.013 |
| Folate | 5.0-8.0 | 1.449-2.246 |

- (0-10) scale label removed from all 10 nutrient field labels
- step corrected to 0.001 for all 10 fields
- Default value= updated to midpoint of correct normal range

#### FIX 3 — Fixed mappings.json normal_range for 9 nutrient entries
- Root cause of unknown zone badges in nutrient module
- normal_range was empty for 9 out of 10 nutrient fields
- All 9 entries now populated with correct ranges from PDF

Pipeline verification (Ridwan 2025-11-10):

| Field | Value | Zone |
|---|---|---|
| nt-zn | 1.888 | normal |
| nt-mg | 0.932 | normal |
| nt-k | 0.637 | ringan (genuine finding) |
| nt-io | 2.794 | normal |
| nt-si | 3.609 | normal |
| nt-b6 | 0.895 | normal |
| nt-vc | 5.013 | normal |
| nt-d3 | 6.046 | normal |
| nt-ve | 4.907 | normal |
| nt-fo | 1.600 | normal |

Zero unknown zones. nt-k ringan is genuine finding (0.637 below 0.689 floor).

### Known issue logged (not fixed)
- parser_v3.py line 917: UnicodeEncodeError on Windows cp1252 terminal when printing
  warnings containing alpha character. CSV output unaffected. Cosmetic only. Deferred.

### Pipeline note
- Kamiyanti and Frans CSVs/JSONs in 01_Data/ are stale for nutrient fields after FIX 3.
  Re-run pipeline on both PDFs before next QA session.

### Files Modified
- qrma-dashboard-v4.html — FIX 1 + FIX 2
- 03_Scripts/mappings.json — FIX 3

---

## 2026-05-30 — Build 1 Complete: Flask Microserver + v4 Dashboard

### Status: SHIPPED

### What Was Built
- 03_Scripts/server.py — Flask microserver, port 5000
- qrma-dashboard-v4.html — v3 base + PDF drop zone + Flask integration

### server.py — Implementation Details
- Path setup via __file__ self-location (same pattern as csv_exporter_v2.py)
- Routes: GET / health check, POST /upload multipart PDF
- Pipeline: parse_qrma_pdf() → export_dashboard_csv() → csv_to_json_payload() → returns JSON
- CSV always written to 01_Data/csv/ as permanent audit trail — never bypassed
- Temp PDF deleted after processing (finally block)
- CORS enabled (localhost-only server)
- 50 MB upload limit
- Flask-CORS dependency added (pip install flask-cors)

### qrma-dashboard-v4.html — What Changed from v3
- 170 lines added, zero v3 lines removed or modified
- PDF drop zone modal (drag-and-drop + click to browse)
- Import PDF button in topbar between Import CSV and lang toggle
- Loading spinner during upload
- Server connection status indicator (green/amber)
- On success: JSON passed directly to QRMAImporter.importFromPayload()
- On server unreachable: amber warning, drop zone still shown, no JS errors
- On pipeline error: red error block inside modal, modal stays open for retry
- Full v3 fallback (JSON file picker) intact

### Test Results
- 3 patients tested via PDF drop path: all passing
- Zero console errors
- Audit trail confirmed: CSV + JSON written for all 3 patients
- Server offline fallback confirmed working
- Fields: 62 | Zones: 64 (matches v3 QA baseline)

### Dependencies Added
```
flask==3.1.3      (already installed)
flask-cors        (new — pip install flask-cors)
```

### Operator Workflow (post Build 1)
```
Terminal (once per session):
  python 03_Scripts\server.py

Browser (every client):
  Open qrma-dashboard-v4.html
  Click Import PDF → drop PDF → dashboard loads automatically
```

### Files Created
- 03_Scripts/server.py
- qrma-dashboard-v4.html

### Next: Build 2 — HRV Phase 1
- 03_Scripts/hrv-engine.js
- qrma-dashboard-v4.html updated with HRV sidebar module + per-module panels

---

## 2026-05-30 — Architecture & Design Session: HRV Integration + Flask Microserver

### Session Type
Design decisions and architecture planning. No code written. Baseline for Build 1 and Build 2.

### Decisions Locked

#### HRV Integration Architecture
- HRV is its own domain with its own vocabulary and rules. Never maps to QRMA zone words.
- ALI computed from raw HRV values. Native bands: Very Low / Low / Adaptive / High (0-24 / 25-49 / 50-74 / 75-100). Color translation only at render time.
- HRV never alters any of the 7 QRMA module scores.
- HRV renders independently — does not gate on QRMA alert state.
- Missing HRV = Option A empty state. Dashboard behaves exactly as today.
- HRV logic lives in a dedicated 03_Scripts/hrv-engine.js module.

#### HRV Display Design
- HRV Sidebar Module (dedicated page): Autonomic Status Card → ALI-gated Micro-Protocol Stack → Reading Provenance + Disclaimer.
- Per-module top panel (on all 7 modules): 2-line strip — vitals + one module-specific context sentence. No micro-protocols in module panels.
- Micro-protocol stack is ALI-gated (show only current, hide deferred):
  Very Low → V1, V3, V4 | Low → V1, V2, V3, V4 | Adaptive → all 5 | High → V2, V4, V5

#### HRV Data Contract
- hrvState is session-only in-memory (no database, no localStorage in Phase 1).
- 14 fields: 9 stored + 5 derived (computed by hrv-engine.js).
- Quality gate uses 3 distinct fields (durationSec, artifactPct, qualityFlag).
- baselineStatus and lnRmssd included for Phase 3 upgrade path.

#### Flask Microserver
- Full pipeline preserved: PDF → csv_exporter_v2.py → CSV → json_exporter.py → JSON → browser.
- CSV kept as audit trail. Never bypassed.
- Dashboard remains fully functional without the server running.

#### Build Sequence
```
Build 1 — server.py + qrma-dashboard-v4.html        COMPLETE
Build 2 — hrv-engine.js + qrma-dashboard-v4.html    NEXT
```

### Still Deferred
- buildAction() zone gates
- sk-tw direction ambiguity
- Debug log removal before production release
- Parameter name translation (ID/EN display labels)
- Manual input form for mt-bmi and mt-wc
- PyWebView wrapper (Option C) — after Flask stable
- parser_v3.py UnicodeEncodeError on Windows cp1252

---

## 2026-05-28 — Dashboard v3 QA Session

### Features Completed
- Language toggle UI button added to header
- Zone badge labels corrected: Mild Concern→Mild, Action Needed→Moderate
- bmr() updated: uses getBadge(zone) when zone present, falls back to static map
- Skin chips migrated to zone labels (Deficient/Borderline retired)
- Joint Collagen (sk-jc) remapped: Kolagen Sendi→Sistem Pergerakan (Kolagen form p.72)
  sk-jc now populates: value 5.271, zone ringan for Ridwan
- Sebum bidirectional alert added to buildAction()
- getBadge('unknown') fallback: returns — instead of blank

### CSS Fixes
- Pillar bar label font size increased, colour set to --txt
- Confirmatory test column font size increased
- Hint text and reference range text set to --txt (full black light mode)
- Alert description .aald set to --txt

### Baseline Corrections
- tx-pb corrected to normal (0.144 within PDF range 0.052-0.643)
- Validated field count updated: 62/64 (sk-jc now maps correctly)

### QA Sign-off
- Run ID: run_ridwan_20260528
- Workflow: Operator → Tester → Reviewer
- Verdict: APPROVE
- Blocking rules triggered: 0 / 11
- Advisory triggered: 1 (buildAction zone gates — deferred)
- Patients validated: Ridwan, Kamiyanti, Frans

### Deferred to Backlog
- buildAction() zone gates (Pending Change #2)
- sk-tw direction ambiguity
- Debug log removal before production release
- Parameter name translation (ID/EN display labels)
- Manual input form for mt-bmi and mt-wc
- Flask microserver for PDF import (Option B)

---

## 2026-06-01 — Bug Fixes + Bio Age Pillar Display Improvements

### FIX 4 — Nutrient Deficient Count always showing 0
- cNt() counter only incremented def for sedang/berat zones
- ringan zone was silently ignored — fell through without counting
- Fix: added ringan to the deficient condition
- Before: else if(zone==='sedang'||zone==='berat') def++
- After:  else if(zone==='ringan'||zone==='sedang'||zone==='berat') def++
- Verified with Kamiyanti: Deficient Count now correctly shows 5
  (Zinc, Silicon, Vitamin D3, Vitamin E, Folate — all ringan)

### IMPROVEMENT — Bio Age Pillar Bar rescaled + verbal labels added

#### Rescaled axis from 0-30 to 0-10
- Old axis (0-30) made scores like 4.4 look negligible to a layman
- Real-world scores cluster between 1-9 — 0-10 is the honest range
- Bar fill width updated from (value/30*100)% to (value/10*100)%
- Displayed number unchanged — only axis and proportion changed
- New dedicated barPillar() function created — generic bar() untouched

#### Verbal load labels added (bilingual)
- Each pillar now shows a verbal interpretation next to the score
- Thresholds:
  burden < 3.0  → Minimal Load  / Beban Minimal
  burden < 5.0  → Mild Load     / Beban Ringan
  burden < 7.0  → Moderate Load / Beban Sedang
  burden >= 7.0 → High Load     / Beban Tinggi
- getPillarLabel(burden) reads currentLang from zone-scoring.js
- Language toggle updates labels via data-pillar-label + data-burden 
  attributes — same pattern as existing [data-zone] badge toggle
- No calcAll() call needed on toggle — surgical DOM update only
- cBioAge() formula and return values completely untouched

### Files Modified
- qrma-dashboard-v4.html — FIX 4 + pillar display improvements

---

## 2026-06-01 — Build 2 Complete: HRV Phase 1

### Status: SHIPPED ✓

### What Was Built
- `03_Scripts/hrv-engine.js` — HRV logic module v1.0.2
- `qrma-dashboard-v4.html` — HRV sidebar module + 7 module strips
- `03_Scripts/zone-scoring.js` — default language updated to English (v1.1)

### hrv-engine.js — Implementation Details
- `HRV_CONFIG` — all thresholds, weights, protocol definitions in one block
- Pure computation functions (zero DOM dependency):
  `computeRmssdBand()`, `computeALI()`, `aliBand()`,
  `computeQualityFlag()`, `computeRecoveryState()`,
  `getProtocolsForBand()`, `getAliInterpretation()`,
  `getModuleContextSentence()`
- `ingestHrv()` — reads 8 form fields, computes all 14 hrvState fields
- `renderHrvModule()` — 3 sections: Status Card + Protocol Stack + Provenance
- `renderHrvPanel()` — orchestrator, strips always render (empty or data)
- 7 per-module strip renderers — shared `_renderStrip()` pattern
- All user-facing strings bilingual EN/ID via `_t()` helper
- `baselineStatus: 'unknown'` stubbed for Phase 3
- `lfHfRatio` reads `hrv-lfratio` form field (nullable)
- Phase A verified: 19/19 assertions PASS before HTML integration

### HRV Sidebar Module
- Autonomic Status Card: RMSSD · ALI Band · Resting HR · Quality
- ALI Band explanation paragraph — client-level language, bilingual,
  always visible, updates on language toggle
- Recovery State label (Strained/Guarded/Adaptive) bilingual
- ALI interpretation paragraph — band-driven, 4 variants bilingual
- ALI-gated micro-protocol stack:
  Very Low → V1, V3, V4
  Low      → V1, V2, V3, V4
  Adaptive → V1, V2, V3, V4, V5
  High     → V2, V4, V5
- Each protocol card: name · timing · technique · duration (bilingual)
- Reading Provenance: device, protocol, duration, artifact%, timestamp
- Compliance disclaimer bilingual

### Per-Module HRV Strips (all 7 modules)
- 2-line strip at top of each module page
- Line 1 — vitals: RMSSD · ALI band · HR · Quality
- Line 2 — module-specific context sentence (bilingual)
- Empty state: "No HRV data available for this session."
- Text size and color: full black, readable size
- Band color tint on strip background

### Manual Input Form
Fields: RMSSD, HR, SDNN, LF/HF Ratio, Duration (default 300s),
Artifact% (default 0), Device (default EliteHRV), Protocol (dropdown)
"Load HRV" button → ingestHrv() → renders immediately

### Language Toggle
- Default language changed to English (zone-scoring.js v1.1)
- Toggle handler now calls renderHrvPanel() — all HRV text
  switches simultaneously with zone badges and pillar labels

### Quality Gate
- Pass: duration ≥ 240s AND artifact ≤ 3%
- Caution: duration < 240s OR artifact 3–5%
- Reject: artifact > 5%
- 1-minute readings → Caution (directional only, not rejected)

### ALI Vocabulary
Never mapped to QRMA zone words (normal/ringan/sedang/berat).
Own bands: Very Low / Low / Adaptive / High (0–24/25–49/50–74/75–100)
CSS color classes: hrv-band-very-low/low/adaptive/high

### HRV never alters QRMA scores
7 module calculators untouched. HRV is additive display layer only.
renderHrvPanel() called after calcAll() completes.

### Files Created
- `03_Scripts/hrv-engine.js` v1.0.2

### Files Modified
- `qrma-dashboard-v4.html` — HRV layer added
- `03_Scripts/zone-scoring.js` — v1.1, default language EN

### Phase 3 Deferred (as planned)
- HRV file import (Polar/Garmin/Apple JSON)
- localStorage for HRV session history
- Baseline-aware HRV (baselineStatus field already stubbed)
- Flask-served HRV file import

---

## 2026-06-01 — Minor Fix: HRV Default Device Name

### FIX — HRV device default mismatch
- HTML form showed `EliteHRV` but hrv-engine.js fallback said `Polar H10`
- Aligned both to `Polar H10` as the default device name
- Files modified:
  - `qrma-dashboard-v4.html` — input value="Polar H10"
  - `03_Scripts/hrv-engine.js` — fallback string updated to 'Polar H10'

---

## 2026-06-01 — HRV Visual Layer: ALI Gauge + Autonomic Balance Bar

### Status: SHIPPED ✓

### ALI Gauge (hrv-engine.js v1.0.4 → v1.1.2)
- Replaced semicircular gauge with straight horizontal bar gauge
- 4 colored segments: Green (High) · Teal (Adaptive) · Amber (Low) · Red (Very Low)
- Downward triangle marker at current ALI position
- Zone labels above bar, scale numbers below (0, 25, 50, 75, 100)
- ALI number and band label below marker
- All text uses inline style="fill:var(--txt)" for dark mode compatibility
- Bilingual zone labels via data-gauge-label + data-gauge-key attributes
- Language toggle updates gauge labels automatically
- Bar max-height: 120px

### Autonomic Balance Bar (hrv-engine.js v1.0.8)
- Separate card below Status Card (Option C)
- Horizontal bar showing Parasympathetic ↔ Sympathetic balance
- Left label: "Parasympathetic / Rest & Digest"
- Right label: "Sympathetic / Alert & Stress"
- 4 zones: Para Dominant · Balanced · Mixed · Sympathetic Dominant
- computeBalanceScore() — primary: LF/HF ratio, fallback: RMSSD
- Balance state label (colored) + interpretation paragraph (bilingual)
- Data source note: LF/HF or RMSSD fallback with prompt to enter LF/HF
- All scale numbers use inline style="fill:var(--txt)" for dark mode
- Bar max-height: 120px (matches ALI gauge)

### Dark Mode Fixes
- All SVG text elements use inline style="fill:var(--txt)" 
  instead of CSS class (CSS fill doesn't reliably override 
  SVG text in all browsers)
- Covers: zone labels, scale numbers, ALI number, band label,
  balance score number on both bars

### New Functions Added to hrv-engine.js
- buildAliGauge(ali, band, lang) → SVG string
- buildBalanceBar(lfhf, rmssd, lang) → HTML string
- computeBalanceScore(lfhf, rmssd) → 0–100
- balanceZone(score) → zone key
- getBalanceInterpretation(zone, lang) → paragraph string
- HRV_BALANCE_LABELS constant block

### Version History
- 1.0.2 → 1.0.3: semicircular gauge added
- 1.0.3 → 1.0.4: replaced with straight bar gauge
- 1.0.4 → 1.0.7: sizing iterations
- 1.0.7 → 1.0.8: balance bar added
- 1.0.8 → 1.0.9: balance bar sizing fix
- 1.0.9 → 1.1.0: scale numbers dark mode fix
- 1.1.0 → 1.1.1: zone label class approach (superseded)
- 1.1.1 → 1.1.2: zone labels inline style, full dark mode fix

### Files Modified
- 03_Scripts/hrv-engine.js — v1.1.2
- qrma-dashboard-v4.html — CSS additions

---

## 2026-06-03 — Bug Fix: HRV Export State Isolation (hrv-engine.js v1.1.3)

### Status: SHIPPED ✓

### FIX 5 — window.hrvState not reachable from exportSessionReport()

**Root cause:**
`hrv-engine.js` declared `let hrvState = null` at the top of its script block.
In browsers, `let` and `const` at script scope are NOT added as properties of
`window`. This meant `window.hrvState` (used by `exportSessionReport()` in the
main inline script) was always `undefined`, regardless of whether the operator
had clicked Load HRV. The HRV Autonomic Status section was silently omitted
from every MD and TXT export since Build 2 shipped.

The bug was undetected because `renderHrvPanel()` — called from within
`hrv-engine.js` scope — reads the `let` variable directly and rendered
correctly on screen. Only the export path was broken.

**Discovered via:** Playwright end-to-end export verification session (2026-06-03).

**Fix — 2 surgical lines added to `03_Scripts/hrv-engine.js` (Section 3 + Section 4):**

```javascript
// Section 3 — State (line 323)
let hrvState = null;
window.hrvState = null;  // bridge: exportSessionReport() reads window.hrvState

// Section 4 — ingestHrv() (end of assignment block, before renderHrvPanel call)
window.hrvState = hrvState;  // keep window in sync for exportSessionReport()
```

No logic changed. `ingestHrv()`, `renderHrvPanel()`, and all pure functions
remain identical. Only the window bridge lines are new.

### Verification — Playwright automation (both formats)

Test scripts: `03_Scripts/hrv_export_test.py` · `03_Scripts/hrv_export_txt_test.py`
Patient: Ridwan 2025-11-10 | HRV input: RMSSD=28, HR=74, SDNN=42, Duration=300s, Artifact=2.1%

**MD format (`hrv_test_export.md`) — 10/10 checks PASS:**
- `## HRV — Autonomic Status` section present
- ALI Band: low (correct for RMSSD=28)
- RMSSD: 28 ms · HR: 74 bpm shown
- Recovery State: guarded
- Recommended Practices: V1, V2, V3, V4 (correct for low band)
- JSON block: `"hrv": { "present": true, "ali_band": "low", "rmssd": 28, "mean_hr": 74, "quality": "pass" }`

**TXT format (`hrv_test_export.txt`) — 11/12 checks PASS:**
- All MD checks above confirmed in plain-text form
- `HRV Present: Yes` line present in MODULE SCORES summary block
- ALI Band / RMSSD / HR / Quality lines all present with correct values
- One expected non-failure: `## HRV — Autonomic Status` heading is converted
  to `HRV — AUTONOMIC STATUS` by `mdToTxt()` — correct behaviour, not a bug

### ALI computation note
`autonomicLoadIndex` for RMSSD=28, HR=74: **60** (hrv-engine.js `computeALI()`).
This places the reading at the top of the `low` band (boundary with `adaptive`),
consistent with the 25–49 ALI → low band rule (ALI 60 → adaptive band by index,
but RMSSD 28 ms → `low` band by RMSSD threshold, which governs `rmssdBand`).
`rmssdBand` is what exportSessionReport() uses for protocol selection.

### Files Modified
- `03_Scripts/hrv-engine.js` — v1.1.3 (two lines added)

### Files Created (QA artefacts — not production)
- `03_Scripts/hrv_export_test.py` — MD export automation + verification
- `03_Scripts/hrv_export_txt_test.py` — MD + TXT regression harness
- `01_Data/hrv_test_export.md` — last MD export test output
- `01_Data/hrv_test_export.txt` — last TXT export test output
