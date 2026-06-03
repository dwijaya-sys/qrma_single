# audit_v5.md — QRMA Dashboard v5 Code Audit
**Source file:** `qrma-dashboard-v5.html` (1,959 lines)
**Audit date:** 2026-06-03

---

## 1. Module inventory

### Sidebar navigation modules (9 pages)

| Page ID | Name | Description | Key functions |
|---|---|---|---|
| `dashboard` | Dashboard Overview | KPI tiles for all 8 domains + allostatic load + gut. Radar chart (higher=better) and bar chart (lower=better). | `drawCharts()`, `calcAll()` |
| `basic` | Basic Info & Bio Age | Demographics (age, gender, BMI) + 3-pillar biological age model: P1 Metabolic/Vascular, P2 Oxidative/Toxic, P3 Regenerative Deficits. Includes client identity card. | `cBioAge()`, `calcAll()` |
| `oxidative` | Oxidative Stress & Recovery | Antioxidant reserve (glutathione, CoQ10, Vit C/E, Se) vs pro-oxidant load (skin free radicals, hypoxia, pH). | `cOx()` |
| `toxic` | Toxic Exposure Flags | Heavy metals (Pb, Hg, Cd, As) + lifestyle burden (stimulants, tobacco, pesticides). | `cTx()` |
| `metabolic` | Metabolic Risk | Glycemic burden (glucose, insulin), lipid burden (triglycerides, fat metabolism), anthropometric (BMI, waist). | `cMt()` |
| `cardio` | Cardio-Renal Strain | Cardiac index (cholesterol plaque, vascular flexibility, LV ejection) + renal index (uric acid, proteinuria, K, Mg). | `cCr()` |
| `nutrient` | Nutrient Sufficiency | 10-nutrient resilience panel (Zn, Mg, K, I, Si, B6, C, D3, E, Folate). Higher = better. | `cNt()` |
| `skin` | Skin & Collagen Resilience | Collagen index (skin, eye, joint) + barrier function (elasticity, TEWL). Higher = better. | `cSk()` |
| `digestive` | Gut / Digestive Function | Motility/transit (gastric, SI, LI peristalsis), absorption (gastric+SI+colonic+bacteria), pressure/integrity (intraluminal pressure + system overall). | `cDg()` |

### Results and utility panels

| Panel | Description | Key functions |
|---|---|---|
| Action Plan (`action`) | Aggregated confirmatory tests table, food-first interventions, high-priority alerts. | `buildAction()` |
| HRV Reading (`hrv`) | RMSSD-based ALI computation, autonomic status card, micro-protocol stack (V1-V5), balance bar, provenance block. | `ingestHrv()`, `renderHrvPanel()`, `renderHrvModule()` |
| Client Card | Patient identity display (name, age, gender, test date, initials avatar). Shown after import. | `confirmImport()` |
| CSV / JSON Import Modal | File picker supporting CSV (first-row headers) and JSON (structured payload). Preview with field match count. | `initImportCSV()`, `_parseCSV()`, `_jsonToRow()`, `_showImportModal()`, `confirmImport()`, `closeImportModal()` |
| PDF Upload Modal | Drag-drop PDF uploader; sends to Flask server on `http://localhost:5000/upload`; receives JSON payload. | `openPdfModal()`, `closePdfModal()`, `handlePdfUpload()`, `initPdfDrop()`, `_checkServer()` |
| Export Report | MD/TXT download button with split-button format picker. Builds a full patient report from DOM state. | `exportSessionReport()`, `mdToTxt()`, `setExportFmt()`, `toggleExportDd()` |

### Per-module HRV strips

Each module page (`basic`, `oxidative`, `toxic`, `metabolic`, `cardio`, `nutrient`, `skin`, `digestive`) has a 2-line strip at the top populated by:
- `renderHrvStrip_BioAge()`, `renderHrvStrip_Oxidative()`, `renderHrvStrip_Toxic()`, `renderHrvStrip_Metabolic()`, `renderHrvStrip_Cardio()`, `renderHrvStrip_Nutrient()`, `renderHrvStrip_Skin()`, `renderHrvStrip_Digestive()`
- All delegate to `_renderStrip(moduleId, containerId)` in `hrv-engine.js`

---

## 2. Scoring functions

### `cBioAge()` — Biological Age Estimate
- **Inputs:** `age` (DOM), `window.zoneData` zone labels for 18 fields
  - P1 fields: `bv`, `cp`, `art`, `ins`, `bs`
  - P2 fields: `fr`, `hyp`, `ph`, `pb`, `hg`
  - P3 fields: `ce`, `cs`, `cj`, `coq`, `gsh`, `vc`, `ve`, `ost`
- **Logic:** Converts zone label to burden score (normal=1, ringan=4, sedang=7, berat=9, unknown=5). Averages each pillar. Weighted sum: P1x0.35 + P2x0.35 + P3x0.30, multiplied by scale factor 1.2. Result added to chronological age.
- **Outputs:** `{ ba, age, p1, p2, p3 }`
- **Score type:** Age estimate (not 0-100); delta > 3 = monitor, > 10 = high priority
- **Logic type:** Zone-based

### `cOx()` — Oxidative Stress Score (0-100, risk)
- **Inputs:** `window.zoneData` for `ox-gsh`, `ox-coq`, `ox-vc`, `ox-ve`, `ox-sel` (antioxidants), `ox-fr`, `ox-hyp`, `ox-ph` (pro-oxidants); raw values from DOM
- **Logic:** Antioxidant reserve `ax` = avg zone score x (100/9). Pro-oxidant load `px` = avg burden score x (100/9). Combined: `(100 - ax) x 0.55 + px x 0.45`.
- **Outputs:** `{ s, ax, px, gsh, coq, vc, ve, sel, fr, hyp, ph }`
- **Logic type:** Zone-based

### `cTx()` — Toxic Burden Score (0-100, risk)
- **Inputs:** `window.zoneData` for `tx-pb`, `tx-hg`, `tx-cd`, `tx-as`, `tx-st`, `tx-tb`, `tx-ps`; raw values from DOM
- **Logic:** Heavy metal index `hm` = avg burden score for 4 metals x (100/9). Lifestyle index `lb` = avg burden for 3 lifestyle fields. Combined: `hm x 0.6 + lb x 0.4`.
- **Outputs:** `{ s, hm, lb, pb, hg, cd, as_, st, tb, ps }`
- **Logic type:** Zone-based

### `cMt()` — Metabolic Risk Score (0-100, risk)
- **Inputs:** `window.zoneData` for `mt-ug`, `mt-ins` (glycemic), `mt-tg`, `mt-fm` (lipid); raw DOM values for `mt-bmi` and `mt-wc`; `gender` select
- **Logic:** Glycemic `gc` and lipid `lp` from zone burden averages. BMI penalty: raw `bmi > 25` triggers linear scale to max 15 points. Waist penalty: raw `wc > 90cm` (male) or `> 80cm` (female) triggers linear scale to max 10 points. Final: `gc x 0.40 + lp x 0.35 + bmiP + wcP`.
- **Outputs:** `{ s, gc, lp, tg, ug, ins, fm, bmi, wc }`
- **Logic type:** MIXED — glycemic/lipid zone-based; BMI/waist use raw numeric thresholds

### `cCr()` — Cardio-Renal Strain (0-100, risk)
- **Inputs:** `window.zoneData` for `cr-ch`, `cr-vf`, `cr-lv` (cardiac), `cr-ua`, `cr-pt`, `cr-k`, `cr-mg` (renal)
- **Logic:** Cardiac index `cai` = avg burden of 3 cardiac fields x (100/9). Renal index `ri` = avg burden of 4 renal fields x (100/9). Combined: `cai x 0.55 + ri x 0.45`.
- **Outputs:** `{ s, cai, ri, ch, vf, lv, ua, pt, k, mg }`
- **Logic type:** Zone-based

### `cNt()` — Nutrient Sufficiency Score (0-100, resilience)
- **Inputs:** `window.zoneData` for 10 nutrients: `nt-zn`, `nt-mg`, `nt-k`, `nt-io`, `nt-si`, `nt-b6`, `nt-vc`, `nt-d3`, `nt-ve`, `nt-fo`
- **Logic:** Avg zone score (higher zone = better reserve) normalized to 0-100. Counts `def` (any non-normal zone) and `opt` (normal zone only).
- **Outputs:** `{ s, def, opt, items[] }` — each item: `{ n, v, zone, score }`
- **Logic type:** Zone-based

### `cSk()` — Skin Resilience Score (0-100, resilience)
- **Inputs:** `window.zoneData` for `sk-sc`, `sk-ec`, `sk-jc` (collagen), `sk-el`, `sk-tw` (barrier), `sk-sn` (sensitivity)
- **Logic:** Collagen index `cl` = avg zone score for 3 collagen fields. Barrier `bf` = avg zone score for elasticity + TEWL. Sensitivity `sn` = zone score. Combined: `cl x 0.5 + bf x 0.3 + sn x 0.2`. Note: `sk-jc` is a permanent gap (zone defaults to unknown = neutral score 5).
- **Outputs:** `{ s, cl, bf, sc, el, tw, sb, ml, sn, ec, jc }`
- **Logic type:** Zone-based (with permanent-gap comment)

### `cDg()` — Gut/Digestive Risk Score (0-100, risk)
- **Inputs:** `window.zoneData` for `dg-lp`, `dg-sp`, `dg-lc` (motility), `dg-la`, `dg-sa`, `dg-ca`, `dg-bi` (absorption), `dg-ip`, `dg-ds` (pressure). Checks `dg-redflag` checkbox for alarm-symptoms gate.
- **Logic:** Motility `mt` = avg burden x (100/9). Absorption `ab` = avg burden x (100/9). Pressure/integrity `pi` = weighted burden (`ip x 1.5 + ds x 0.5`) / 2 x (100/9). Combined: `mt x 0.40 + ab x 0.35 + pi x 0.25`. Pattern flags: `bloatingConstipation`, `upperGiStrain`, `absorptionDeficit` derived from zone comparisons.
- **Outputs:** `{ s, redFlag, mt, ab, pi, lp, la, sp, sa, lc, ca, bi, ip, ds, bloatingConstipation, upperGiStrain, absorptionDeficit }`
- **Logic type:** Zone-based

### `calcAll()` — Master Orchestrator
Calls all 8 scoring functions, updates all KPI tiles and result panels, computes Allostatic Load (average of inverted resilience + risk scores across 7 domains), calls `drawCharts()`, `buildAction()`, `renderHrvPanel()`.
- Allostatic Load formula: `avg([ox.s, tx.s, mt.s, cr.s, 100-nt.s, 100-sk.s, dg.s||0]) / 7`

### `buildAction()` — Action Plan Builder
- **Logic type:** Raw numeric threshold checks throughout — NOT zone-based. Alert conditions fire on raw value comparisons: `pb > 1.2`, `hg > 0.5`, `cd > 0.5`, `ug > 6.1`, `ins < 3`, `tg > 5`, `ch > 50`, `pt > 3`, `vf < 6`, `ua > 7.2`, `gsh < 0.9`, `coq < 0.9`. Alert thresholds and zone scores can disagree.

### Helper functions

| Function | Purpose |
|---|---|
| `se(id, val, cls)` | Set element text + colour class |
| `clrc(v, lo, hi)` | Return colour class based on thresholds |
| `lbl(v, lo, hi)` | Return threshold label string |
| `bar(label, val, max, cls)` | Build progress bar HTML |
| `bmr(name, val, st, zone)` | Build biomarker row HTML with zone chip |
| `aal(type, title, desc)` | Build alert box HTML |
| `ftrow(label, foods)` | Build food tag row HTML |
| `barPillar(label, val, cls)` | Build pillar bar with bilingual load label |
| `moduleZoneColor(fields)` | Return worst-zone colour class for a module |
| `zbs(fieldId, type)` | Convert zone label to bmr status string |

### zone-scoring.js functions

| Function | Purpose |
|---|---|
| `scoreFromZone(label)` | Returns numeric score: normal=9, ringan=6, sedang=3, berat=1, unknown=0 |
| `getBadge(label)` | Returns bilingual badge string for zone chip |
| `getColor(label)` | Returns CSS class string |
| `setLang(lang)` | Sets module-level `currentLang` global |

### hrv-engine.js pure computation functions

| Function | Inputs | Outputs |
|---|---|---|
| `computeRmssdBand(rmssd)` | number ms | `'very_low'` / `'low'` / `'adaptive'` / `'high'` |
| `computeALI(rmssd, meanHr)` | numbers | 0-100 integer |
| `aliBand(ali)` | 0-100 | band string |
| `computeQualityFlag(durationSec, artifactPct)` | numbers | `'pass'` / `'caution'` / `'reject'` |
| `computeRecoveryState(ali)` | 0-100 | `'strained'` / `'guarded'` / `'adaptive'` |
| `computeBalanceScore(lfhf, rmssd)` | numbers | 0-100 |
| `balanceZone(score)` | 0-100 | zone string |
| `getProtocolsForBand(band)` | band string | protocol object array |
| `getAliInterpretation(band, lang)` | strings | bilingual paragraph string |
| `getBalanceInterpretation(zone, lang)` | strings | bilingual paragraph string |
| `getModuleContextSentence(moduleId, lang)` | strings | bilingual one-liner |
| `buildAliGauge(ali, band, lang)` | primitives | HTML+SVG string |
| `buildBalanceBar(lfhf, rmssd, lang)` | primitives | HTML+SVG string |

---

## 3. mappings.json

- **Status:** External file at `03_Scripts/mappings.json`. It is **not loaded or fetched** by the HTML file at runtime.
- **Used by:** Python pipeline scripts (`parser_v3.py`, `csv_exporter_v2.py`, `json_exporter.py`) to resolve Indonesian QRMA field names to dashboard IDs.
- **NOT used at runtime by the dashboard:** `confirmImport()` calls `QRMAImporter.importFromPayload(_jsonPayload, [])` — the second argument (mappings) is passed as an empty array `[]`. The importer therefore falls back to direct DOM ID matching, bypassing all `also_maps_to` multi-field mappings defined in mappings.json.

**Schema per entry:**
```
{
  "id":                 string  (Indonesian QRMA field name),
  "en":                 string  (English QRMA field name),
  "dashboard_id":       string  (target HTML input id),
  "also_maps_to":       string[] (additional HTML input ids),
  "module":             string  (module name),
  "normal_range":       string,
  "actual_value":       number,
  "needs_verification": boolean,
  "note":               string
}
```

**Known multi-field mapping bypassed at runtime:**
- `Kristal Atau Plak Kolesterol` maps to primary `cp` AND also to `cr-ch` via `also_maps_to`. This dual-write does NOT happen via the JSON import path because mappings array is empty.

---

## 4. CSV import

**Present:** Yes.

**Trigger:** `document.getElementById('csv-file-input')` change event (file picker in topbar). Same input also handles `.json` files — if filename ends in `.json`, it takes the JSON parse branch.

**CSV format expected:** Single header row + one data row (only `lines[1]` is read).

**Expected columns:**
- `name`, `age`, `gender`, `test_date` — patient identity
- All 63 fields in `_ALL_FIELDS` array (Bio Age, Oxidative, Toxic, Metabolic, Cardio-Renal, Nutrient, Skin):
  `bv`, `cp`, `art`, `ins`, `bs`, `fr`, `hyp`, `ph`, `pb`, `hg`, `ce`, `cs`, `cj`, `coq`, `gsh`, `vc`, `ve`, `ost`, `ox-gsh`, `ox-coq`, `ox-vc`, `ox-ve`, `ox-sel`, `ox-fr`, `ox-hyp`, `ox-ph`, `tx-pb`, `tx-hg`, `tx-cd`, `tx-as`, `tx-st`, `tx-tb`, `tx-ps`, `mt-tg`, `mt-ug`, `mt-ins`, `mt-fm`, `mt-bmi`, `mt-wc`, `cr-ch`, `cr-vf`, `cr-lv`, `cr-ua`, `cr-pt`, `cr-k`, `cr-mg`, `nt-zn`, `nt-mg`, `nt-k`, `nt-io`, `nt-si`, `nt-b6`, `nt-vc`, `nt-d3`, `nt-ve`, `nt-fo`, `sk-sc`, `sk-el`, `sk-tw`, `sk-sb`, `sk-ml`, `sk-sn`, `sk-ec`, `sk-jc`
- Optional `_zone` suffix columns alongside each field (e.g. `bv_zone`) — loaded into `window.zoneData`

**GAP — Gut module fields missing from `_ALL_FIELDS`:** `dg-lp`, `dg-la`, `dg-sp`, `dg-sa`, `dg-lc`, `dg-ca`, `dg-bi`, `dg-ip`, `dg-ds` are NOT in `_ALL_FIELDS`. CSV import will not populate the Gut / Digestive module.

**Handler chain:** `initImportCSV()` → `_parseCSV()` → `_showImportModal()` → `confirmImport()` → `calcAll()`

---

## 5. Export Report block

**Output formats:** Markdown (`.md`, default) and Plain Text (`.txt`). User selects via split-button dropdown in topbar.

**Guard:** Requires patient name to be present in the client card (imported); alerts and aborts if name is `—`.

**Function:** `exportSessionReport()` — reads current DOM state only; does not re-run calculations.

**Sections in output order:**
1. Patient header (name, age, gender, test date, export timestamp, dashboard version)
2. Executive Summary — auto-generated narrative text; top-3 priority domains; includes HRV ALI band if `window.hrvState` is set
3. Module Findings — 8 numbered sub-sections:
   - 1. Biological Age — synthetic 0-100 score, status label, worst zone, narrative findings
   - 2. Oxidative Stress — score, label, zone, antioxidant/pro-oxidant sub-findings
   - 3. Toxic / Detox Load — score, label, zone, alerts extracted from `r-txal` DOM
   - 4. Metabolic Health — score, label, zone, alerts extracted from `r-mtal` DOM
   - 5. Cardio-Renal Function — score, label, zone, alerts extracted from `r-cral` DOM
   - 6. Nutrient Sufficiency — score, label, zone, deficient/optimal counts
   - 7. Skin & Collagen — score, label, zone, collagen index / barrier function findings
   - 8. Gut / Digestive Function — score, label, zone, motility/absorption/pressure sub-scores, findings text
4. Action Plan:
   - Priority Confirmatory Tests — Markdown table (MD) or columnar text (TXT), extracted from `r-acttbl` DOM
   - Dietary & Lifestyle Recommendations — extracted from `r-actfood` DOM
   - High Priority Alerts section (if any High-priority rows exist)
5. Context for AI System — static framing paragraph for TCM/AI integration
6. HRV Autonomic Status section — if `window.hrvState` is set: ALI band, RMSSD, HR, quality, interpretation, recommended protocols
7. Data Summary:
   - MD format: JSON code block with structured `{ patient, session, modules, priority_domains, action_plan, hrv }`
   - TXT format: Fixed-width columnar plain text block (same data, no JSON)

**Supporting functions:**
- `mdToTxt(md)` — strips MD syntax (fences, tables, headers, bold/italic) to produce clean plain text
- `setExportFmt(fmt)` / `toggleExportDd(e)` — format picker UI

---

## 6. Language toggle

**Present:** Yes. Button `[data-lang]` in topbar. Initial state: `'id'` (Indonesian). Clicking toggles EN/ID.

**What the toggle currently affects:**
- Zone badge chip labels — via `getBadge()` in `zone-scoring.js`; all `[data-zone]` elements re-rendered
- Pillar load labels — `getPillarLabel()` re-renders `[data-pillar-label]` elements
- Full HRV panel — `renderHrvPanel()` re-renders all HRV content
- Gauge labels — `[data-gauge-label]` and `[data-gauge-band]` elements re-rendered from `HRV_BAND_LABELS`

**Fields with dual-language support:**
- Zone badge labels: Normal / Perlu Perhatian / Perlu Tindakan / Prioritas Utama
- Pillar load labels: Minimal Load / Beban Minimal, Mild Load / Beban Ringan, Moderate Load / Beban Sedang, High Load / Beban Tinggi
- All HRV content: ALI band labels, quality flags, recovery state, balance labels, all 5 protocol texts (name, timing, technique, duration), ALI interpretation paragraphs, balance interpretation paragraphs, module context sentences (8 modules), gauge title, strip vitals line, strip context line, provenance section labels, compliance disclaimer

**English-only (not toggled):**
- All module page titles and section headings
- Alert titles and descriptions from `aal()`
- Food tag content from `ftrow()`
- Score threshold labels: "Low Concern / Monitor / Needs Lab Confirmation"
- KPI tile labels and sub-text
- Confirmatory test names in `buildAction()`
- Per-nutrient, per-skin, per-cardio BMR row labels
- Sub-score descriptions in result panels
- Export report content
- Import/export modal content

---

## 7. Console.log calls

**Total: 2 calls** — both in `qrma-dashboard-v5.html`, both inside `confirmImport()`, annotated with `// DEBUG — retain for development; remove before production release`.

| Line | Call | Description |
|---|---|---|
| 1764 | `console.log('mode:', _importMode)` | Logs current import mode (csv or json) |
| 1765 | `console.log('payload:', !!_jsonPayload, _jsonPayload ? Object.keys(_jsonPayload) : 'null')` | Logs JSON payload presence and top-level keys |

**In external JS files:** Zero console.log / console.warn / console.error calls in `zone-scoring.js`, `hrv-engine.js`, or `importer.js`.

---

## 8. Dependency inventory

### External scripts / CDN

| Library | URL | Notes |
|---|---|---|
| Fontshare (CSS) | `https://api.fontshare.com/v2/css?f[]=satoshi@400,500,700&f[]=cabinet-grotesk@400,500,700,800&display=swap` | Cabinet Grotesk + Satoshi fonts |
| Chart.js 4.4.0 | `https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js` | Radar + bar charts. Version pinned. |
| Lucide | `https://unpkg.com/lucide@latest/dist/umd/lucide.js` | Icon set. Version UNPINNED (@latest). |

### Local scripts (relative to dashboard HTML file)

| File | Path | Purpose |
|---|---|---|
| `zone-scoring.js` | `03_Scripts/zone-scoring.js` | Zone-to-score mapping, badge labels, language state |
| `hrv-engine.js` | `03_Scripts/hrv-engine.js` | HRV computation, ALI, protocols, all rendering |
| `importer.js` | `03_Scripts/importer.js` | JSON payload to DOM field mapper (`QRMAImporter`) |

All three confirmed present in `03_Scripts/`.

### External JSON files referenced

| File | Path | Used by |
|---|---|---|
| `mappings.json` | `03_Scripts/mappings.json` | Python pipeline only. Not loaded by the HTML at runtime. |

---

## 9. Red flags

### Broken references / CSS bugs

1. **`dg-redflag` checkbox does not exist in DOM** — `cDg()` reads `document.getElementById('dg-redflag')?.checked||false` but no input with this ID exists in the Gut module HTML. The red-flag gate is always `false`; alarm symptoms can never be flagged regardless of operator intent.

2. **`.abox` CSS class undefined on Gut module red-flag panel** (line 651) — The HTML uses `class="abox aerr"` but `.abox` is not defined in the stylesheet. The correct class should be `aal aerr`. The red-flag alert panel renders unstyled.

3. **CSS token `--card` undefined** (line 257 in `<style>`) — `.hrv-balance-card { background: var(--card); }` — `--card` is not in the design token block (see Section: Design Tokens). Background renders as transparent. Should be `var(--surf2)`.

4. **CSS token `--rad` undefined** (line 257) — `.hrv-balance-card { border-radius: var(--rad); }` — `--rad` is not a defined token. Should be `var(--rlg)`.

5. **`mappings.json` passed as empty array at runtime** — `QRMAImporter.importFromPayload(_jsonPayload, [])` — the `also_maps_to` dual-write mappings are never applied via the JSON path (e.g. cholesterol plaque `cp` → `cr-ch`).

### Functional gaps

6. **Gut module fields absent from `_ALL_FIELDS`** — `dg-lp`, `dg-la`, `dg-sp`, `dg-sa`, `dg-lc`, `dg-ca`, `dg-bi`, `dg-ip`, `dg-ds` are not listed. CSV / JSON import skips all Gut inputs.

7. **`window.zoneData` stale across partial re-imports** — On CSV import, `window.zoneData = {}` is reset before writing. But if a second import has fewer `_zone` columns than the first, no explicit reset clears stale keys from the first session. (The reset does happen at line 1802, so the issue only occurs if a CSV without `_zone` columns is loaded after one that had them — the reset at line 1802 covers the CSV path correctly. The JSON path at line 1769 also resets. Low severity.)

### Consistency issues

8. **`buildAction()` uses raw numeric thresholds, not zone-based logic** — Alert triggers in `buildAction()` (pb>1.2, hg>0.5, cd>0.5, ug>6.1, ins<3, tg>5, ch>50, pt>3, vf<6, ua>7.2, gsh<0.9, coq<0.9) are raw value comparisons. Module scores are zone-based. A field can be zone='normal' but still fire a raw-threshold alert, or be zone='berat' with no alert if the raw value happens to fall below the hardcoded threshold.

9. **Duplicate overlapping input fields** — These DOM field pairs share biological meaning but are separate inputs requiring sync by import logic. The `also_maps_to` mechanism that was supposed to handle this is bypassed at runtime:
   - `gsh` (bio age P3) and `ox-gsh` (oxidative module)
   - `vc` (bio age P3), `ox-vc` (oxidative), `nt-vc` (nutrient)
   - `ve` (bio age P3), `ox-ve` (oxidative), `nt-ve` (nutrient)
   - `coq` (bio age P3) and `ox-coq` (oxidative)
   - `pb` (bio age P2) and `tx-pb` (toxic)
   - `hg` (bio age P2) and `tx-hg` (toxic)
   - `cp` (bio age P1) and `cr-ch` (cardio)
   - `ins` (bio age P1) and `mt-ins` (metabolic)
   - `bs` (bio age P1) and `mt-ug` (metabolic)

### Hardcoded paths

10. **PDF server URL hardcoded to localhost** (line 1831): `const PDF_SERVER='http://localhost:5000';` — breaks in any non-local environment.

11. **Lucide unpinned** (`@latest`) — a breaking Lucide API change would silently break all icons across the dashboard.

### TODO / FIXME markers

12. **Debug console.log calls** (lines 1764-1765): Tagged `// DEBUG — retain for development; remove before production release`.

13. **`dg-redflag` gate is dead code** — referenced in `cDg()` but the input checkbox was never added to the HTML. Planned feature, not finished.

14. **`baselineStatus: 'unknown'`** in HRV state (hrv-engine.js line 362): Commented "Phase 3: baseline-aware comparison". Not implemented.

15. **`sleep` and `stress` weight slots in `HRV_CONFIG.aliWeights`** (hrv-engine.js lines 37-38): Reserved for Phase 3. ALI only uses 70% of its weight budget (rmssd=0.5 + meanHr=0.2). Remaining 30% is unused.

---

## 10. Build notes for v6

### Can be copied to v6 unchanged

- All CSS (design tokens, layout, component classes, HRV classes, responsive media queries, modal CSS, export button CSS)
- `zone-scoring.js` — complete, v1.1
- `hrv-engine.js` — complete, v1.1.3
- `importer.js` — logic correct; only call site needs updating
- Nav and topbar HTML (add BodyComp nav entry)
- All 8 module input panel HTML
- Client card HTML
- CSV Import modal HTML
- PDF Upload modal HTML
- Export split-button HTML and dropdown HTML
- Theme toggle IIFE (line 760)
- `nav()` function
- All render helpers: `se()`, `clrc()`, `lbl()`, `bar()`, `bmr()`, `aal()`, `ftrow()`, `barPillar()`, `getPillarLabel()`, `moduleZoneColor()`, `zbs()`
- `mdToTxt()`, `setExportFmt()`, `toggleExportDd()`
- PDF upload functions: `openPdfModal()`, `closePdfModal()`, `_pdfReset()`, `_pdfSetLoading()`, `_pdfShowErr()`, `_checkServer()`, `handlePdfUpload()`, `initPdfDrop()`
- DOMContentLoaded listener (language toggle + lucide init + import init + export dropdown close)
- `drawCharts()` — copy, then add BodyComp data point

### Needs refactoring before copying

1. **`buildAction()`** — Replace raw numeric threshold alert checks with zone-based logic (`window.zoneData[field+'_zone']` comparisons) so alerts are consistent with module scores. Add BodyComp entries.

2. **`calcAll()`** — Split monolithic render block into per-module render functions. Update Allostatic Load divisor from 7 to 8 when BodyComp is added.

3. **`_ALL_FIELDS`** — Add all `dg-*` gut fields. Add BodyComp fields when defined.

4. **`confirmImport()`** — Pass actual `mappings.json` contents (loaded on DOMContentLoaded or bundled inline) to `QRMAImporter.importFromPayload()` so `also_maps_to` dual-writes work. Remove two debug `console.log` calls.

5. **Gut module HTML** — Add missing alarm symptoms checkbox: `<input type="checkbox" id="dg-redflag">` with label, so `cDg()` red-flag gate functions.

6. **CSS bugs** — `.hrv-balance-card`: replace `var(--card)` with `var(--surf2)` and `var(--rad)` with `var(--rlg)`. Fix Gut red-flag alert HTML: `abox aerr` → `aal aerr`.

7. **Pin Lucide CDN** — Replace `@latest` with a fixed version (e.g. `@0.344.0`).

### What the BodyComp module stub will need to hook into

1. **Sidebar nav** — Add `<button class="sni" onclick="nav('bodycomp')" data-nav="bodycomp">` after Skin entry.
2. **Mobile nav** — Add `<button class="mtab" onclick="nav('bodycomp')" data-mn="bodycomp">` entry.
3. **Dashboard KPI tile** — Add `<div class="kpi">` with IDs `k-bc` (value) and `k-bcl` (sub-label) in `kgrid`.
4. **Page section** — `<section class="pg" id="pg-bodycomp">` with `<div id="hrv-strip-bc">` at top, input panel, and result panel with IDs `r-bc`, `r-bcs`, `r-bcl`.
5. **HRV strip** — Add `renderHrvStrip_BodyComp()` calling `_renderStrip('body_comp', 'hrv-strip-bc')`. Add to `renderHrvPanel()`. Add `body_comp` entry to `getModuleContextSentence()` in `hrv-engine.js`.
6. **Score function** — Create `cBc()` following zone-based burden pattern. Fields TBD from BodyComp QRMA categories. Return `{ s, sub1, sub2, … }`.
7. **`calcAll()`** — Call `cBc()` after `cSk()`. Render result panel. Add to `GS` object. Update Allostatic Load divisor to 8.
8. **`drawCharts()`** — Add `'BodyComp'` label and corresponding score to radar and bar data arrays.
9. **`buildAction()`** — Add BodyComp alert conditions and lab test rows.
10. **`exportSessionReport()`** — Add `bc` to `rawScores`, `domainNames`, `priorityDomains`, `zones` object, and module findings sections.
11. **`_ALL_FIELDS`** — Append BodyComp field IDs.
12. **`worstZone()` in export** — Add BodyComp field list.

---

*End of audit_v5.md*
