# QRMA Dashboard — Project Master Map
**Last updated:** 2026-06-04 — CR scale corrections (cr-ch/vf/lv/k/mg), CR breakdown cards, CR strain formula display  
**Compiled from:** CLAUDE.md, CHANGELOG.md, audit_v5.md, v5_orientation.md, hrv-flask-session-handover.md, hrv_logic_layer_handover.md, hrv-integration-next-ai-handover.md, current_run.yaml  
**Purpose:** Single file an AI session or developer reads first. Replaces need to reconcile 5+ context docs.

---

## 1. PROJECT IDENTITY

| Field | Value |
|---|---|
| **Name** | QRMA Health Screening Dashboard |
| **Brand** | Swasthya Usadha |
| **Program** | Usaka Wellness |
| **Root folder** | `F:\TeleTCM_Project\qrma_single\` |
| **Output format** | Single self-contained HTML file + companion scripts in `03_Scripts\` |
| **Purpose** | Convert QRMA/bioresonance device PDF reports into a structured health screening dashboard for clinician-assisted review |
| **Legal constraint** | Screening only — never diagnostic. All outputs are reference indicators, not diagnoses. |
| **Disclaimer (non-dismissable)** | "For Reference Only · Not a Diagnosis" |
| **Reference patient** | Ridwan, 40y Male — `QRMA_Ridwan_November_21.pdf` (95 pages, Bahasa Indonesia) |

---

## 2. CURRENT STATUS SNAPSHOT

```
Date:          2026-06-04
Active build:  v6.2 — CR scale corrections + CR breakdown cards + CR strain formula display
Active HTML:   qrma-dashboard-v6.html  (2,945 lines)
Last QA:       Automated self-check — all passes (CR field scale fixes, zone verification)
Last hotfix:   cr-ch/cr-vf/cr-lv/cr-k/cr-mg scale corrections; renderCrBreakdown(); crBk formula
Next build:    Build 3 cont — B3 Phase 2 (bmr() span labels), B3 Phase 3 (mappings.json en_display/id_display)
```

### Build History (condensed)

| Date | Build | Status | Key Output |
|---|---|---|---|
| Pre-2026-05-28 | v2 → v3 migration | Complete | Zone-based scoring, JSON importer, mappings layer |
| 2026-05-28 | v3 QA Session | Approved | Language toggle, zone badge fixes, sk-jc remapped, 62/64 fields |
| 2026-05-30 | Architecture Session | Design locked | HRV + Flask decisions; no code written |
| 2026-05-31 | Build 1 | Complete ✓ | `server.py` + `qrma-dashboard-v4.html` (Flask + PDF drop zone) |
| 2026-06-01 | Build 2 | Complete ✓ | `hrv-engine.js` + v4 HTML HRV layer (ALI, protocols, per-module strips) |
| 2026-06-01 | Bug fix session | Complete | FIX 4 (nutrient deficient count), Bio Age pillar rescale + verbal labels |
| 2026-06-03 | v5.0 — Module 9 | Complete ✓ | `qrma-dashboard-v5.html` — Digestive module, 9-axis radar, parser fixes |
| 2026-06-03 | FIX 5 | Complete ✓ | `hrv-engine.js` v1.1.3 — `window.hrvState` bridge; HRV block now appears in MD + TXT exports |
| 2026-06-04 | v6.0 — Module 10 | Complete ✓ | `qrma-dashboard-v6.html` — Body Composition module, 8-axis charts, export section 9, bcRefreshLabels |
| 2026-06-04 | B3 Phase 1 | Complete ✓ | `field_labels.js` + `applyLabels()` — bilingual field/UI/module labels wired to language toggle |
| 2026-06-04 | Zone engine fix | Complete ✓ | `computeAllZones()` + `liveZone()` + `set()` — all 55 module fields now compute live zones; cMt() female waist override; bmiP/wcP zone-based |
| 2026-06-04 | Bio Age zone fix | Complete ✓ | `cBioAge()` self-computes zones for all 18 Bio Age fields from raw DOM values; writes back to window.zoneData |
| 2026-06-04 | dg-redflag removal | Complete ✓ | Alarm-symptoms checkbox removed by design decision; cDg() and buildAction() cleaned of all redFlag references |
| 2026-06-04 | Digestive strip i18n | Complete ✓ | "Digestive Pattern Flagged" / "Pola Pencernaan Terdeteksi" bilingual; `renderHrvStrip_Digestive()` re-renders on language toggle |
| 2026-06-04 | CR scale corrections | Complete ✓ | cr-ch/cr-vf/cr-lv/cr-k/cr-mg input hints, defaults, step sizes, and computeAllZones() thresholds corrected to match mappings.json raw QRMA scale; TODO flags added for cr-ua/cr-pt |
| 2026-06-04 | CR breakdown cards | Complete ✓ | `renderCrBreakdown()` — per-parameter zone chips on Cardiac Index and Renal Index cards; bilingual; re-renders on language toggle |
| 2026-06-04 | CR strain formula | Complete ✓ | `id="r-crbk"` inside CR Strain card — shows weighted formula: Cardiac×0.55 + Renal×0.45 = Total, colour-coded by score band; bilingual labels |

---

## 3. FILE INVENTORY

### 3.1 Active Files (deploy these)

| File | Version | Role |
|---|---|---|
| `qrma-dashboard-v6.html` | v6.1 | **ACTIVE** single-file dashboard app — 10 modules + HRV, 2,892 lines |
| `03_Scripts/server.py` | — | Flask microserver — PDF drop → pipeline → browser |
| `03_Scripts/hrv-engine.js` | v1.1.3 | HRV logic module + all strip renderers + window.hrvState bridge |
| `03_Scripts/zone-scoring.js` | v1.1 | Zone-to-score + language module (default EN) — **unmodified by zone fix** |
| `03_Scripts/field_labels.js` | v1.0 | **NEW** — bilingual label lookup table; sets `window.QRMA_LABELS`; generated from `field_labels.json` |
| `03_Scripts/field_labels.json` | v1.0 | **NEW** — source-of-truth for EN/ID/MS/VI/TH field labels; edit this, then regenerate `.js` |
| `03_Scripts/importer.js` | v1.5.1 | JSON importer adapter (IIFE: QRMAImporter) |
| `03_Scripts/csv_exporter_v2.py` | v2 | PDF → CSV (imports from parser_v3) |
| `03_Scripts/json_exporter.py` | — | CSV → JSON payload for browser |
| `03_Scripts/parser_v3.py` | v3 | PDF → raw values + zone derivation + SQLite — updated: orphan-name fix + higher-worse inversion |
| `03_Scripts/mappings.json` | current | Indonesian PDF name → dashboard field ID — 9 dg-* fields mapped; bc-* fields are manual-input-only (no PDF mapping needed) |
| `database.py` | stable | SQLAlchemy models — **do not rename, shared with another dev** |

**Script load order in `<head>` — must be preserved:**
```html
<script src="03_Scripts/field_labels.js"></script>   <!-- sets window.QRMA_LABELS -->
<script src="03_Scripts/zone-scoring.js"></script>
<script src="03_Scripts/hrv-engine.js"></script>
<script src="03_Scripts/importer.js"></script>
<!-- inline <script> block last -->
```
`field_labels.js` must load before the inline block so `applyLabels()` has `window.QRMA_LABELS` available on `DOMContentLoaded`.

### 3.2 Superseded Files (keep, do not use)

| File | Reason |
|---|---|
| `qrma-dashboard-v5.html` | Superseded by v6 |
| `qrma-dashboard-v4.html` | Superseded by v5 |
| `qrma-dashboard-v3.html` | Superseded by v4 |
| `qrma-dashboard-v2.html` | Superseded by v3/v4 |
| `parser.py` | Original — no mapping layer, no zone support |
| `csv_exporter.py` | v1 — imports from parser_v2, no zone columns |

### 3.3 Reference Documents (keep in repo, do not edit)

| File | Read for |
|---|---|
| `CLAUDE.md` | Original product rules, module specs, alert language (v3-era — use CLAUDE_final.md for active rules) |
| `CLAUDE_final.md` | Active working rules for Claude Code sessions (v3/v4 era) |
| `HANDOVER.md` | Architecture history, pipeline spec (generated 2026-05-24 — partially stale) |
| `hrv-flask-session-handover.md` | **HRV + Flask canonical spec** — read this for Build 2 context |
| `hrv_logic_layer_handover.md` | HRV engine architecture, rule namespaces, build phases |
| `hrv-integration-next-ai-handover.md` | Data contracts, adapter architecture, session payload schema |
| `HRV_Integration_Design_Document__TeleTCM___Usaka_Autonomic_Bridge.md` | Clinical context, ALI bands, micro-protocol content, CPT mapping |
| `QRMA_Ridwan_November_21.md` | Full 95-page PDF as markdown — parameter reference |
| `QRMA_Ridwan_November_21.pdf` | Source QRMA PDF (primary test vector) |
| `qrma-dashboard-v2-handover.md` | Original architecture spec (mostly superseded) |
| `current_run.yaml` | Single-run SSOT for Operator/Tester/Reviewer QA workflow |
| `CHANGELOG.md` | Authoritative build history |
| `QRMA_SKILL_dashboard_operator.md` | Operator QA role definition and walkthrough |
| `MODULE_9_DIGESTIVE_SPEC.md` | Full Module 9 spec — field definitions, cDg() logic, sub-indices, parser rules, HRV integration, alert language |
| `Logic_Layer_Specification_Document__QRMA-GDV_Health_Intelligence_Engine.docx` | Future v6.0 architecture — QRMA + GDV dual-instrument engine, TCM patterns, AI narrative. Not applicable until GDV integrated. |
| `PROJECT_MAP.md` | **This file** |

### 3.4 Versioning Rules

- All scripts use explicit version suffixes: `parser_v3.py`, `csv_exporter_v2.py`
- Never overwrite previous versions — create new suffix
- `database.py` has no suffix — shared with another dev, never rename
- Next version names: `qrma-dashboard-v6.html`, `csv_exporter_v3.py`, `parser_v4.py`
- `SCRIPT_DIR` must be defined **before** `sys.path.insert` **before** any project imports in all scripts

---

## 4. PIPELINE ARCHITECTURE

### 4.1 Full Pipeline (with Flask)

```
Operator drops PDF onto qrma-dashboard-v6.html drop zone
  ↓
POST /upload  →  03_Scripts/server.py  (Flask, port 5000)
  ↓
parser_v3.py: parse_qrma_pdf()          PDF → raw items + demographics
parser_v3.py: load_mappings()           load mappings.json
parser_v3.py: export_dashboard_csv()    → 01_Data/csv/{name}_{date}.csv  (audit trail)
  ↓
json_exporter.py: csv_to_json_payload() → 01_Data/json/{name}_{date}.json
  ↓
JSON payload returned to browser
  ↓
importer.js: QRMAImporter.importFromPayload()
  → populates window.zoneData + DOM field IDs (QRMA fields only; bc-* excluded from QRMA import)
  ↓
calcAll()   (score orchestrator)
  → cBioAge, cOx, cTx, cMt, cCr, cNt, cSk, cDg, cBc
  → window.bcResult = bc  (exposes to export + buildAction)
  → bc zones written to window.zoneData for worstZone() in export
  ↓
renderHrvPanel()   (HRV post-pass, no-op if hrvState is null)
renderHrvStrip_BodyComp()   (bc strip — inline in v6 HTML, keeps hrv-engine.js unmodified)
  ↓
lucide.createIcons()
nav('dashboard')
```

**Body Composition data path (separate from QRMA pipeline):**
```
Operator enters bc-* values manually in Body Comp module
  OR imports via body_comp_template.csv (bcConfirmCsv())
  ↓
bcAutoCalc()   — auto-computes bmi (from height+weight) and whr (from wc/height)
  ↓
calcAll()   — cBc() reads bc-* DOM fields, produces window.bcResult
```

**Critical constraint:** CSV is never bypassed — always written as audit trail.

### 4.2 Fallback (without Flask)

Dashboard runs standalone as a static HTML file. JSON import via file picker modal (QRMAImporter). All functionality intact. Flask is automation only.

### 4.3 Script Internal Import Order (Python)

```python
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))   # MUST BE FIRST
sys.path.insert(0, SCRIPT_DIR)                             # SECOND
from parser_v3 import ...                                  # THIRD
```
Reversing this order causes `NameError`. This is a known bug pattern.

### 4.4 Known Bugs / Constraints

| Bug | Status | Notes |
|---|---|---|
| `parser_v3.py` UnicodeEncodeError on Windows cp1252 | Open | Affects console output only, not data |
| `mt-bmi` / `mt-wc` permanent PDF gaps | By design | Section headings in PDF — use manual input or bc-* CSV path |
| `parser_v3.py` orphan-name truncation | **Fixed v5.0** | Multi-line PDF param names now merged correctly |
| `parser_v3.py` higher-worse zone inversion | **Fixed v5.0** | dg-ip and future higher-worse fields zone correctly |
| `window.hrvState` not readable by `exportSessionReport()` | **Fixed FIX 5** | `window.hrvState` bridge in hrv-engine.js v1.1.3 |
| CSS tokens `--card`, `--rad` in HRV balance card | **Fixed v6.0** | Replaced with `--surf2`, `--rlg` |
| Gut redflag alert `class="abox aerr"` | **Fixed v6.0** | Corrected to `class="aal aerr"` |
| `dg-redflag` checkbox (alarm symptoms) in Gut panel | **Removed by design** | Checkbox, result panel, cDg() redFlag path, and all buildAction() redFlag branches fully removed — not a data field, not in PDF |
| Gut/Digestive fields missing from `_ALL_FIELDS` | **Fixed v6.0** | All 9 `dg-*` fields added |
| Lucide CDN unpinned (`@latest`) | **Fixed v6.0** | Pinned to `@0.344.0` |
| Recursive `renderHrvPanel` wrapper in v6 scaffold | **Fixed v6.0** | Removed wrapper; `renderHrvStrip_BodyComp()` called directly in `calcAll()` |
| Debug `console.log` calls in `confirmImport()` | **Fixed v6.0** | Removed (were labelled for removal before production) |
| bc-* fields inflate QRMA import modal "not found" count | **Fixed v6.0** | `_showImportModal` filters `bc-` prefix before counting — denominator is 73 (not 82) |
| `buildAction()` 4th column text muted grey | **Fixed v6.0** | Color set to `#000000` |
| **All module scorers read stale `window.zoneData`** | **Fixed v6.1** | `computeAllZones()` called at start of `calcAll()` — reads all 55 module fields live from DOM; `liveZone()` and `set()` at module scope. Manual edits now immediately reflected in all module scores. |
| **Bio Age pillar bars stuck on import-era zones** | **Fixed v6.1** | `cBioAge()` self-computes zones for all 18 Bio Age fields via inline `BIO_THR` table + `rawToZone()`, writes back to `window.zoneData`. No longer reads stale CSV-import zones. |
| **`cMt()` bmiP/wcP ignored zones** | **Fixed v6.1** | `bmiP`/`wcP` now use `bd('mt-bmi')` and `bd('mt-wc')` zone burden; female waist threshold (hi=80 cm) applied via `liveZone()` override before scoring. |
| **"Digestive Pattern Flagged" hardcoded in English** | **Fixed v6.1** | Both `calcAll()` render and new `renderHrvStrip_Digestive()` function use `currentLang` to select EN/ID strings. Language toggle calls `renderHrvStrip_Digestive()` to refresh live. |
| **cr-k/cr-mg input scale mismatch** | **Fixed v6.2** | cr-k was using 4.5–7.0 threshold on 0-10 input; cr-mg was 5.0–7.5. Both corrected to match mappings.json raw QRMA scale (cr-k: 0.689–0.987 `bi`; cr-mg: 0.568–0.992 `bi`). step corrected to 0.001. Default values corrected. |
| **cr-ch/cr-vf/cr-lv input scale mismatch** | **Fixed v6.2** | cr-ch was `hi`/50 (wrong); cr-vf was `lo`/6.0 on 0–10 (wrong); cr-lv was `hi`/5.0 on 0–10 (wrong). All corrected to `bi` with mappings.json ranges (cr-ch: 56.749–67.522; cr-vf: 1.672–1.978; cr-lv: 1.554–1.988). step corrected to 0.001 for vf/lv. TODO flags added for cr-ua/cr-pt (no mappings.json ref). |

---

## 5. DASHBOARD MODULES

### 5.1 Module Table

| # | ID | Score Type | Confidence | Key Field IDs |
|---|---|---|---|---|
| 1 | `basic` | Bio Age estimate | Well-supported | `bv, cp, art, ins, bs, fr, hyp, ph, pb, hg, ce, cs, cj, coq, gsh, vc, ve, ost` |
| 2 | `oxidative` | Risk ↑ worse | Exploratory | `ox-gsh, ox-coq, ox-vc, ox-ve, ox-sel, ox-fr, ox-hyp, ox-ph` |
| 3 | `toxic` | Risk ↑ worse | Needs lab confirm | `tx-pb, tx-hg, tx-cd, tx-as, tx-st, tx-tb, tx-ps` |
| 4 | `metabolic` | Risk ↑ worse | Well-supported | `mt-tg, mt-ug, mt-ins, mt-fm, mt-bmi*, mt-wc*` |
| 5 | `digestive` | Risk ↑ worse | Exploratory | `dg-lp, dg-la, dg-sp, dg-sa, dg-lc, dg-ca, dg-bi, dg-ip†, dg-ds` |
| 6 | `cardio` | Risk ↑ worse | Needs lab confirm | `cr-ch, cr-vf, cr-lv, cr-ua, cr-pt, cr-k, cr-mg` |
| 7 | `nutrient` | Resilience ↑ better | Exploratory | `nt-zn, nt-mg, nt-k, nt-io, nt-si, nt-b6, nt-vc, nt-d3, nt-ve, nt-fo` |
| 8 | `skin` | Resilience ↑ better | Exploratory | `sk-sc, sk-el, sk-tw‡, sk-sb, sk-ml, sk-sn, sk-ec, sk-jc` |
| 9 | `action` | Aggregated output | Inherits | Output layer only — no direct inputs |
| 10 | `bodycomp` | Risk ↑ worse | Needs lab confirm | `bc-gender*, bc-age*, bc-height*, bc-weight*, bc-bmi*§, bc-wc*, bc-bf*, bc-vf*, bc-whr*§` |
| HRV | `hrv` | ALI (0–100) | Independent domain | `rmssd, meanHr, sdnn, lnRmssd, durationSec, artifactPct` |

`*` manual-input-only fields — never extractable from QRMA PDF.  
`†` `dg-ip` direction is higher-worse — zone derivation inverted in parser_v3.py. Ridwan: 3.206 → sedang.  
`‡` direction ambiguity — flagged, under investigation.  
`§` auto-calculated from other fields (`bc-bmi` from height+weight; `bc-whr` from wc/height); manual override supported.

### 5.2 Scoring Functions

```javascript
computeAllZones()   // NEW (v6.1) — reads all 55 module fields live from DOM; writes window.zoneData
liveZone(val, dir, lo, hi)  // NEW (v6.1, module scope) — converts raw value to zone string
set(id, dir, lo, hi)        // NEW (v6.1, module scope) — DOM read + liveZone + window.zoneData write

cBioAge()   // Zone burden → weighted 3-pillar bio age offset
            //   UPDATED (v6.1): self-computes zones for all 18 Bio Age fields via BIO_THR table;
            //   writes back to window.zoneData — no longer reads stale import zones
cOx()       // ax (antioxidant reserve) + px (pro-oxidant load)
cTx()       // hm (heavy metals) + lb (lifestyle burden)
cMt()       // gc (glycemic) + lp (lipid) — QRMA signals only (bc-* now in separate cBc())
            //   UPDATED (v6.1): bmiP/wcP use zone-based bd(); female waist override via liveZone()
cCr()       // cai (cardiac) + ri (renal)
            //   UPDATED (v6.2): all 5 cr-* field thresholds corrected to raw QRMA scale;
            //   cr-ch bi(56.749,67.522), cr-vf bi(1.672,1.978), cr-lv bi(1.554,1.988),
            //   cr-k bi(0.689,0.987), cr-mg bi(0.568,0.992)
renderCrBreakdown()  // NEW (v6.2) — writes per-parameter zone chips to r-cai-desc / r-ri-desc;
            //   bilingual (Cardiac/Kardiak, Renal/Renal); called in calcAll() + language toggle
            //   r-crbk: weighted formula display (Cardiac×0.55 + Renal×0.45 = Total) in CR Strain card
cNt()       // resilience — avg zone score × 10 nutrients
cSk()       // resilience — cl (collagen) + bf (barrier) + sn
cDg()       // mt (motility 40%) + ab (absorption 35%) + pi (pressure 25%) — see §5.8
            //   UPDATED (v6.1): redFlag path removed entirely
cBc()       // risk — cai (waist+whr 40%) + bci (bf+vf 35%) + sti (bmi 25%) — see §5.7
calcAll()   // master orchestrator — first line now: computeAllZones(); then calls all above,
            //   sets window.bcResult, then renderHrvPanel()
```

All scoring is zone-driven (v3+). All 55 module fields now compute zones live from DOM on every `calcAll()` call via `computeAllZones()`. The 18 Bio Age fields additionally compute zones inside `cBioAge()` using the `BIO_THR` threshold table.  
`buildAction()` bc entries use zone-based logic. Legacy QRMA entries still use raw numeric thresholds — zone-gate migration deferred (B2).

### 5.3 Zone System

| Zone | Score | CSS Class | Color Token | PDF Label |
|---|---|---|---|---|
| normal | 9 | zone-normal | --ok | Normal(-) |
| ringan | 6 | zone-ringan | --blue | Abnormal Ringan(+) |
| sedang | 3 | zone-sedang | --gold | Abnormal Sedang(++) |
| berat | 1 | zone-berat | --err | Abnormal Berat(+++) |
| unknown | 0 | zone-unknown | --txtM | — |

**Module card colour (worst-zone-wins):** any berat → red · any sedang → orange · else → green

**`zone-scoring.js` public API:**
```javascript
scoreFromZone(zone)    // → number
getBadge(zone)         // → string (uses currentLang)
getColor(zone)         // → CSS class string
setLang('en' | 'id')   // → void
```

### 5.4 Display Bands

```
Score 8–10   → Low Concern
Score 4–7    → Monitor
Score 1–3    → Needs Lab Confirmation
```

### 5.5 Bio Age — 3-Pillar Model

| Pillar | Contributors |
|---|---|
| 1 — Metabolic/Vascular Wear | blood viscosity, cholesterol plaque, arteriosclerosis, insulin secretion, blood sugar |
| 2 — Oxidative/Toxic Burden | free radicals, hypoxia, pH, heavy metals |
| 3 — Regenerative Deficits | collagen signals, antioxidant reserves, nutrient status |

Verbal burden labels (bilingual):
- < 3.0 → Minimal Load / Beban Minimal
- < 5.0 → Mild Load / Beban Ringan
- < 7.0 → Moderate Load / Beban Sedang
- ≥ 7.0 → High Load / Beban Tinggi

### 5.6 Validated Baseline

| Patient | Gender | QRMA Fields (v6 denom=73) | Zones | Bio Age | Console |
|---|---|---|---|---|---|
| Ridwan | Male | 64/73 (dg-* gaps expected) | 64/64 | 42y (+2y) | Clean |
| Kamiyanti | Female | ~55/73 (dg-* gaps expected) | — | 43y (+2y) | Clean |
| Frans | — | — | — | 53y (+6y) | Clean |

Note: v6 `_ALL_FIELDS` denominator is 82 total (73 QRMA + 9 bc-*). The import modal shows `X / 73` — bc-* fields are excluded from the QRMA import match count by design.

**v5.0 digestive baseline (Ridwan) — confirmed correct, do not re-open:**
- `dg-lp = 55.724` → sedang (gastric peristalsis moderately reduced)
- `dg-la = 34.531` → normal
- `dg-sp = 132.189` → ringan
- `dg-sa = 3.154` → ringan (PDF zone table — not berat, spec estimate was wrong)
- `dg-lc = 3.771` → ringan (fixed by orphan-name pre-pass)
- `dg-ca = 1.942` → ringan (PDF zone table — not berat, spec estimate was wrong)
- `dg-bi = 1.511` → ringan
- `dg-ip = 3.206` → sedang (higher-worse, fixed by zone inversion in parser)
- `dg-ds = 3.607` → normal
- Gut Score: 50% — Monitor band ✓

**Previously confirmed — do not re-open:**
- `sk-sc = 2.69` → "sedang" (berat threshold is < 1.453)
- `ox-sel` → "normal" (v2 threshold was wrong; v3 zone-based is correct)
- `tx-pb = 0.144` → "normal" (PDF range 0.052–0.643; prior "sedang" baseline was incorrect)

### 5.8 Digestive Function — Scoring Spec (cDg())

**Status:** COMPLETE — shipped v5.0 (2026-06-03).  
**Full spec:** `MODULE_9_DIGESTIVE_SPEC.md`

#### Sub-index structure

| Sub-index | Fields | Weight |
|---|---|---|
| A — Motility / Transit | dg-lp, dg-sp, dg-lc | 40% |
| B — Absorption / Environment | dg-la, dg-sa, dg-ca, dg-bi | 35% |
| C — Pressure / Integrity | dg-ip (×1.5), dg-ds (×0.5) | 25% |

#### Ridwan baseline scores (v5.0 QA confirmed)

| Sub-index | Score | Interpretation |
|---|---|---|
| Motility | 56% | Monitor — broad mild peristaltic reduction |
| Absorption | 36% | Monitor — absorption mildly reduced across gut |
| Pressure | 61% | Monitor — dg-ip sedang drives this sub-index |
| **Overall Gut Score** | **50%** | **Monitor band** |

#### Pattern flags (fire when co-occurrence thresholds met)

| Flag | Condition | Ridwan |
|---|---|---|
| Bloating + Reduced Transit | dg-ip ≥ sedang AND dg-lc ≥ sedang | No — dg-lc ringan |
| Upper GI Digestion Strain | dg-lp ≥ sedang AND dg-sa ≥ sedang | No — dg-sa ringan |
| Absorption Deficit | dg-sa = berat OR dg-ca = berat | No — both ringan |

#### Parser fixes shipped with v5.0

- **Orphan-name pre-pass** — fixes multi-line PDF parameter names being truncated (was: `Besar:` only, now: full `Kofisien Fungsi Peristaltik Usus Besar`)
- **Higher-worse zone inversion** — fields with `"direction": "higher-worse"` in mappings.json now correctly map elevated values to worse zones (ratio-based: 1.00–1.25× → ringan, 1.25–1.60× → sedang, >1.60× → berat)

#### HRV context sentence (digestive)

"The vagus nerve directly governs gut motility and digestive enzyme secretion. Low autonomic load index is associated with reduced peristalsis and impaired digestive transformation."

---

### 5.7 Body Composition — Scoring Implementation (cBc())

**Status:** COMPLETE — shipped v6.0 (2026-06-04).  
**Architecture:** Standalone `cBc()` function — separate module from `cMt()`. Body comp fields (`bc-*`) are entirely manual-input; they are never populated from the QRMA PDF pipeline.

#### Field inventory (v6 actual)

| Field ID | Label (UI) | Unit | Role in cBc() | Entry |
|---|---|---|---|---|
| `bc-gender` | Gender | male/female | Zone threshold selection (BF% age brackets) | Select; fallback to top-level `gender` |
| `bc-age` | Age | years | Zone threshold selection (BF% age brackets) | Number; fallback to top-level `age` |
| `bc-height` | Height | cm | Auto-calc BMI + WHR | Number |
| `bc-weight` | Weight | kg | Auto-calc BMI + BMR | Number |
| `bc-bmi` | BMI | kg/m² | Structural Index (sti ×0.25) | Auto-calc or manual; `data-manual` tracks override |
| `bc-wc` | Waist Circumference | cm | Central Adiposity Index (cai ×0.40) | Number |
| `bc-bf` | Body Fat % | % | Body Composition Index (bci ×0.35) | Number |
| `bc-vf` | Visceral Fat Index | 1–59 | Body Composition Index (bci ×0.35) | Number |
| `bc-whr` | Waist-to-Height Ratio | ratio | Central Adiposity Index (cai ×0.40) | Auto-calc or manual; `data-manual` tracks override |

**Auto-calculation rules (bcAutoCalc()):**
- `bc-bmi` = `bc-weight` / (`bc-height`/100)² — fires on height or weight change; skipped if `data-manual="true"`
- `bc-whr` = `bc-wc` / `bc-height` — fires on wc or height change; skipped if `data-manual="true"`
- BMR display = Mifflin-St Jeor formula — informational only, no zone classification
- Manual override reset: "↺ recalculate" button sets `data-manual="false"` and re-fires auto-calc

#### Zone thresholds (actual v6 implementation)

**BMI — standard WHO (bidirectional, both extremes are burden):**

| Zone | BMI range | Direction |
|---|---|---|
| berat | < 16.0 | Severely underweight |
| sedang | 16.0–16.9 | Underweight |
| ringan | 17.0–18.4 | Underweight mild |
| normal | 18.5–24.9 | — |
| ringan | 25.0–27.4 | Overweight |
| sedang | 27.5–29.9 | Overweight |
| berat | ≥ 30.0 | Obese |

**Waist circumference — IDF South/Southeast Asian cutoffs:**

| Zone | Male | Female |
|---|---|---|
| normal | < 90 cm | < 80 cm |
| ringan | 90–94 cm | 80–84 cm |
| sedang | 95–99 cm | 85–89 cm |
| berat | ≥ 100 cm | ≥ 90 cm |

**Body fat % — ACSM, by sex and age bracket:**

| Zone | Male <40 | Male 40–59 | Male ≥60 | Female <40 | Female 40–59 | Female ≥60 |
|---|---|---|---|---|---|---|
| normal | < 20% | < 22% | < 24% | < 28% | < 30% | < 32% |
| ringan | 20–24% | 22–26% | 24–28% | 28–32% | 30–34% | 32–36% |
| sedang | 25–29% | 27–31% | 29–33% | 33–37% | 35–39% | 37–41% |
| berat | ≥ 30% | ≥ 32% | ≥ 34% | ≥ 38% | ≥ 40% | ≥ 42% |

**Visceral fat — Tanita 1–59 scale:**

| Zone | Range |
|---|---|
| normal | 1–9 |
| ringan | 10–14 |
| sedang | 15–19 |
| berat | ≥ 20 |

**Waist-to-height ratio (universal):**

| Zone | Range |
|---|---|
| normal | < 0.50 |
| ringan | 0.50–0.549 |
| sedang | 0.55–0.599 |
| berat | ≥ 0.60 |

#### cBc() scoring structure

```
Central Adiposity Index (cai) = avg burden(bc-wc, bc-whr) × (100/9)
Body Composition Index  (bci) = (burden(bc-bf)×0.6 + burden(bc-vf)×0.4) × (100/9)
Structural Index        (sti) = burden(bc-bmi) × (100/9)

Final score = (cai×0.40 + bci×0.35 + sti×0.25) / sum-of-present-weights
  → Partial scoring when fields are absent — denominator only counts present sub-scores
```

Burden scale: `normal→1, ringan→4, sedang→7, berat→9, unknown→5`

#### Export section (v6 export report)

Section 9 in the MD/TXT export report contains all 5 zone-classified parameters plus BMR. Structured JSON `modules.body_composition` block included in the Data Summary. `zones.bc` uses `worstZone(['bc-bmi','bc-wc','bc-bf','bc-vf','bc-whr'])` via `window.zoneData` (populated in `calcAll()` when cBc() runs).

#### Language toggle behaviour

Zone label chips on bc alerts use `bcZoneLabel(zone)` — bilingual, responds to EN/ID toggle via `bcRefreshLabels()`. BMR description is also bilingual. Language toggle calls `bcRefreshLabels()` (not `calcAll()`) — lightweight re-render of `#r-bcal` only.

#### CSV import path

`bcDownloadTemplate()` generates `body_comp_template.csv` (9 columns: gender, age, height_cm, weight_kg, bmi, waist_cm, body_fat_pct, visceral_fat_index, whr). `bcParseCsv()` + `bcConfirmCsv()` handle the import flow. Separate from the main QRMA CSV importer.

---

## 6. HRV INTEGRATION

### 6.1 Core Principle

HRV is an **independent witness**. It displays its own findings purely from its own data. It never reads from QRMA alert containers, never alters QRMA scores, never uses QRMA zone vocabulary.

### 6.2 ALI Vocabulary (never map to QRMA zone words)

| Band | RMSSD | ALI Range | Meaning |
|---|---|---|---|
| very_low | < 20 ms | 0–24 | Severe vagal withdrawal |
| low | 20–40 ms | 25–49 | Suboptimal vagal tone |
| adaptive | 40–70 ms | 50–74 | Reasonable autonomic flexibility |
| high | > 70 ms | 75–100 | Strong parasympathetic tone |

Color translation happens only at render time. ALI bands are **never** translated to normal/ringan/sedang/berat.

### 6.3 hrvState Data Contract

```javascript
let hrvState = null;  // null = no HRV this session

// When populated — session-only, no database, no localStorage (Phase 1):
{
  // Provenance
  readingTimestamp: '2026-05-30T07:15:00',
  device:           'Polar H10',
  protocol:         'supine_rest_5min',

  // Quality gate (3 distinct fields — not a boolean)
  durationSec:  300,
  artifactPct:  2.1,
  qualityFlag:  'pass',   // pass | caution | reject

  // Raw metrics (manually entered)
  meanHr:    74,
  rmssd:     28,
  sdnn:      42,
  lnRmssd:   3.33,        // Phase 3 baseline math
  lfHfRatio: null,        // optional, nullable

  // Derived (computed by hrv-engine.js — never entered manually)
  rmssdBand:          'low',       // very_low | low | adaptive | high
  baselineStatus:     'unknown',   // unknown | below | near | above (Phase 3)
  autonomicLoadIndex: 72,          // 0–100
  recoveryState:      'guarded',   // strained | guarded | adaptive
  readinessBand:      'low'
}
```

### 6.4 hrv-engine.js Public API

```javascript
HRV_CONFIG              // thresholds, weights, protocol definitions
computeALI(rmssd, meanHr)              // → 0–100
aliBand(ali)                           // → very_low | low | adaptive | high
computeQualityFlag(durationSec, pct)   // → pass | caution | reject
computeRmssdBand(rmssd)                // → very_low | low | adaptive | high
computeRecoveryState(ali)              // → strained | guarded | adaptive
getProtocolsForBand(band)             // → array of protocol objects
ingestHrv()                           // reads form, builds hrvState, calls renderHrvPanel()
renderHrvPanel()                      // orchestrator — no-op if hrvState is null
// Per-module strip renderers (in hrv-engine.js):
renderHrvStrip_BioAge()      // hrv-strip-ba
renderHrvStrip_Oxidative()   // hrv-strip-ox
renderHrvStrip_Toxic()       // hrv-strip-tx
renderHrvStrip_Metabolic()   // hrv-strip-mt
renderHrvStrip_Cardio()      // hrv-strip-cr
renderHrvStrip_Nutrient()    // hrv-strip-nt
renderHrvStrip_Skin()        // hrv-strip-sk
renderHrvStrip_Digestive()   // hrv-strip-dg  ← ALSO now inline in HTML (v6.1): re-renders
                              //   r-dgal with bilingual "Digestive Pattern Flagged" string
                              //   on language toggle — calls cDg() live. hrv-engine.js
                              //   version remains the original; HTML version overrides only
                              //   the r-dgal text node, not the HRV strip element.
// BodyComp strip renderer (inline in v6 HTML — keeps hrv-engine.js unmodified):
renderHrvStrip_BodyComp()    // hrv-strip-bc
```

### 6.5 ALI-Gated Micro-Protocol Stack

| ALI Band | Protocols Shown |
|---|---|
| very_low | V1 (Pre-Meal Breathing), V3 (Sleep Wind-Down), V4 (ANS Reset) |
| low | V1, V2 (Post-Meal Walk), V3, V4 |
| adaptive | V1, V2, V3, V4, V5 (Full HRV Biofeedback) |
| high | V2, V4, V5 |

Only current band protocols shown. No deferred protocols. No "coming soon."

### 6.6 Per-Module HRV Context Sentences

| Module | Context sentence |
|---|---|
| Bio Age | "Elevated sustained autonomic load is associated with accelerated cellular aging patterns." |
| Oxidative | "Reduced vagal tone is associated with increased oxidative stress exposure." |
| Toxic/Detox | "Vagal tone supports hepatic bile secretion and detoxification capacity." |
| Metabolic | "Metabolic stress and autonomic load have a bidirectional relationship — each amplifies the other." |
| Cardio-Renal | "RMSSD reflects current cardiac autonomic balance. Reduced HRV is an independent cardiovascular risk marker." |
| Nutrients | "Adequate vagal tone is required for optimal digestive enzyme output and nutrient absorption." |
| Skin/Collagen | "Sustained sympathetic dominance elevates cortisol, which is associated with accelerated collagen turnover." |
| Gut/Digestive | "The vagus nerve directly governs gut motility and digestive enzyme secretion. Low autonomic load index is associated with reduced peristalsis and impaired digestive transformation." |
| Body Comp | *(not yet in hrv-engine.js `getModuleContextSentence` — strip renders vitals line only; context sentence deferred to Build 3c)* |

Empty state (no HRV data): `"No HRV data available for this session."` — single line only.

### 6.7 HRV Manual Input Form Fields

| Field | Type | Required | Default |
|---|---|---|---|
| RMSSD (ms) | number | yes | — |
| Resting HR (bpm) | number | yes | — |
| SDNN (ms) | number | no | — |
| Duration (sec) | number | yes | 300 |
| Artifact % | number | no | 0 |
| Device | text | no | Polar H10 |
| Protocol | dropdown | no | supine_rest_5min |

### 6.8 HRV Build Phases

| Phase | Scope | Status |
|---|---|---|
| Phase 1 | Manual entry, in-memory only, ALI display, protocols | **COMPLETE** (Build 2) |
| Phase 2 | HRV file import (Polar/Garmin/Apple JSON), localStorage history | Deferred |
| Phase 3 | Baseline-aware rolling comparison, Flask-served HRV import | Deferred |

### 6.9 Known HRV Implementation Detail (FIX 5)

`let hrvState = null` in `hrv-engine.js` is script-scoped — browsers do not add `let`/`const` to `window`. This meant `exportSessionReport()` (in the main inline script) always saw `window.hrvState === undefined`.

**Fix (hrv-engine.js v1.1.3):**
```javascript
// Section 3 — State declaration
let hrvState = null;
window.hrvState = null;      // bridge for exportSessionReport()

// Section 4 — end of ingestHrv() assignment block
window.hrvState = hrvState;  // keep window in sync
```

`renderHrvPanel()` was unaffected (reads `let` variable directly within the same script scope). Only the export path was broken. Both MD and TXT exports verified via Playwright after fix.

---

## 7. NON-NEGOTIABLE PRODUCT RULES

These rules must survive every change, refactor, or new feature without exception.

1. **Never produce diagnostic output.** No sentence may say "you have X", "this means disease Y", or assign any percentage probability to a medical event.
2. **Every abnormal flag must answer three questions:** What is flagged? What could this pattern suggest? What standard lab test could confirm or refute it?
3. **Food-first advice** must accompany every domain that shows a flag, before any supplement or clinical recommendation.
4. **Confidence labels** must remain visible on every module screen and on the dashboard summary: `Well-supported` / `Exploratory` / `Needs lab confirmation`.
5. **Approved alert language only** — see Section 8.
6. **Default values must load immediately** — no blank-state on first open.
7. **Single HTML file for dashboard.** No npm, no bundlers, no frameworks. Flask microserver (`server.py`) handles PDF pipeline only — it is a separate process, never embedded in the HTML. Dashboard must remain fully functional without server running.

---

## 8. ALERT LANGUAGE STANDARDS

### Approved phrases
- "Pattern suggests…"
- "Screening flag…"
- "Consider confirming with…"
- "Monitor trend…"
- "Below reference range pattern…"
- "Higher-than-reference pattern…"
- "Low concern"
- "Biologically older than expected for age"

### Forbidden phrases
- "You have…"
- "This means disease…"
- "X% risk of…"
- "Poisoning"
- "Detox" / "Toxic syndrome" / "Confirmed body burden"
- "Heart attack chance"
- "Kidney failure risk" (unless from a validated external calculator, clearly separated)

### Digestive module — additional forbidden phrases
- "You have IBS" → use "Pattern suggests functional gut sensitivity"
- "Leaky gut" → use "Intestinal barrier pattern"
- "Dysbiosis confirmed" → use "Intestinal bacteria balance pattern"
- "Candida overgrowth" → do not mention — not a QRMA output
- "Detox your gut" → use "Support digestive function through…"
- "You are constipated" → use "Reduced transit pattern"
- Any mention of inflammatory bowel disease → only under red flag: "requires clinical evaluation"

---

## 9. OPEN BACKLOG

Consolidated from all CHANGELOG deferred blocks. Ordered by estimated priority.

| # | Item | Source | Phase |
|---|---|---|---|
| B1 | ~~**Body comp manual input panel + cBc() module**~~ | **COMPLETE 2026-06-04** — Standalone `cBc()` scoring engine, manual input panel with CSV import path, export section 9, buildAction() entries, bilingual zone labels, 8-domain charts. See §5.7. | ✓ Done |
| B2 | **buildAction() zone gates for QRMA entries** | Legacy QRMA alert rows still use raw numeric thresholds — migrate to zone-based logic to match module scores | Build 3 |
| B3 | **Parameter name translation (ID/EN display labels)** | **Phase 1 COMPLETE 2026-06-04** — `field_labels.js` + `window.QRMA_LABELS` + `applyLabels(lang)` wired to language toggle and DOMContentLoaded. Covers all field labels (`data-label-key`), UI strings (`data-ui-key`), and module titles (`data-module-key`) across all 10 modules. Phase 2: update `bmr()` spans (still hardcoded English). Phase 3: `en_display`/`id_display` in mappings.json. | Build 3 cont |
| B4 | ~~**Export Report HRV block**~~ | **COMPLETE 2026-06-03** — HRV section present in MD + TXT when hrvState populated. | ✓ Done |
| B5 | ~~**Export Report format toggle (MD/TXT)**~~ | **COMPLETE 2026-06-03** — MD + TXT both verified for all 8 modules including HRV and Digestive. | ✓ Done |
| B6 | **sk-tw direction ambiguity** | Zone direction under investigation — flagged by Reviewer in run_ridwan_20260528 | Investigate |
| B7 | ~~**Debug log removal**~~ | **COMPLETE 2026-06-04** — Two `console.log` debug calls removed from `confirmImport()`. Only intentional `_testCBc()` console output remains. | ✓ Done |
| B8 | **HRV file import** | Polar/Garmin/Apple JSON → ingestHrv() | HRV Phase 2 |
| B9 | **localStorage for HRV history** | Session persistence across browser refreshes | HRV Phase 2 |
| B10 | **Baseline-aware HRV rolling comparison** | lnRmssd baseline math — field already in hrvState | HRV Phase 3 |
| B11 | **Flask-served HRV file import** | Server-side HRV file handling | HRV Phase 3 |
| B12 | **PyWebView wrapper (Option C)** | Full desktop packaging — deferred until Flask is proven stable | Post-Phase 3 |
| B13 | **parser_v3.py UnicodeEncodeError on Windows cp1252** | Affects console output only, not data | Low priority |
| B14 | **body_comp_template.csv pipeline + batch_runner extension** | Parser support for bc-* CSV path, batch_runner merges body_comp block | Build 3c |
| B15 | **HRV context sentence for Body Comp strip** | Add `body_comp` entry to `getModuleContextSentence()` in hrv-engine.js | Build 3c |
| B16 | **Device import parsers (InBody, Xiaomi)** | Each device → normalise to bc-* fields; source indicator in UI; zero scoring changes | Build 4+ |
| B17 | **GDV integration layer** | Dual-instrument session JSON schema, GDV parser, correlation rules engine, TCM pattern activation, AI narrative generation via Claude API. Spec: Logic_Layer_Specification_Document. | v7.0 |

---

## 10. QA WORKFLOW

### 10.1 Roles

| Role | Responsibility |
|---|---|
| **Operator** | Drives the dashboard through a complete QA run — load → import → calculate → inspect → report. Does NOT judge pass/fail. |
| **Tester** | Consumes Operator report, applies blocking rules, issues PASS/FAIL verdict. |
| **Reviewer** | Final sign-off, approves deferred items, updates baseline fixture on APPROVE. |

Skill files:
```
.claude\skills\operator\QRMA_SKILL_dashboard_operator.md
.claude\skills\tester\QRMA_SKILL_dashboard_tester.md
.claude\skills\reviewer\QRMA_SKILL_dashboard_reviewer.md
```

### 10.2 Run Setup

Read `current_run.yaml` first. Fields used:
- `patient_name`, `pdf_file`
- `output_csv`, `output_json`
- `operator_report`, `tester_report`, `reviewer_report`
- `baseline_fixture`
- `expected_fields_populated` (target: 60), `expected_zone_coverage` (target: 60), `max_allowed_warnings` (2)

### 10.3 Quality Gates (Tester blocking rules)

- All 8 modules calculate without JS errors
- Dashboard summary updates when module scores change
- Confidence badges visible on all module pages
- No diagnostic output anywhere
- Every flagged result has food-first suggestion or confirmatory test prompt
- Charts do not invert score direction (risk vs resilience labels correct)
- Mobile navigation exposes all modules
- Default values produce non-trivial first-run demo state
- Light and dark themes render without broken colors
- No external dependencies beyond declared CDN links
- Disclaimer is non-dismissable and visible

### 10.4 Known Permanent Gaps (not QA failures)

```
mt-bmi   →  PDF section heading, not data row — enter via bc-bmi or mt-bmi manual field
mt-wc    →  Not in PDF table rows — enter via bc-wc manual field
bc-*     →  All body comp fields are manual-input-only — never from PDF by design
             Import via body_comp_template.csv (bcDownloadTemplate / bcConfirmCsv)
             These 9 fields (bc-gender, bc-age, bc-height, bc-weight, bc-bmi, bc-wc,
             bc-bf, bc-vf, bc-whr) are excluded from the QRMA import modal count.
             QRMA import denominator: 73 fields.
```

---

## 11. TECH STACK & DESIGN TOKENS

### 11.1 Stack

| Layer | Choice |
|---|---|
| Structure | HTML5, semantic sectioning |
| Styling | Embedded CSS, CSS custom properties (design tokens) |
| Logic | Vanilla JavaScript — no framework |
| Charts | Chart.js 4.4.0 (radar + bar) |
| Icons | Lucide (unpkg CDN) |
| Fonts | Fontshare — Cabinet Grotesk (headings `--fD`), Satoshi (body `--fB`) |
| Theme | Light/dark via `data-theme="dark"` on `<html>` |
| Server | Flask (Python) — optional, pipeline only |

### 11.2 CSS Design Tokens (preserve all names)

```
Colors:    --pri  --priH  --priHi
           --ok   --okHi
           --warn --warnHi
           --err  --errHi
           --gold --goldHi
           --blue --blueHi
           --purp --purpHi

Surface:   --bg  --surf  --surf2  --sOff  --sOff2  --div  --brd

Text:      --txt  --txtM  --txtF

Radius:    --rsm  --rmd  --rlg  --rxl  --rfull

Spacing:   --sp1 through --sp16

Typography: --text-xs  --text-sm  --text-base  --text-lg  --text-xl
            --fD (Cabinet Grotesk)  --fB (Satoshi)

Shadow:    --shsm  --shmd  --shlg
Transition: --tr
```

### 11.3 Internal Code Organization (inside single HTML file)

```
CONFIG / CONSTANTS      thresholds, pillar weights, module metadata
ZONE ENGINE (v6.1)      liveZone(val, dir, lo, hi)   — raw value → zone string (module scope)
                        set(id, dir, lo, hi)          — DOM read + liveZone + window.zoneData write
                        computeAllZones()             — calls set() for all 55 module fields;
                                                        called as first line of calcAll()
LANGUAGE (B3 Phase 1)   applyLabels(lang)             — applies QRMA_LABELS translations to
                                                        data-label-key / data-ui-key / data-module-key
                        renderHrvStrip_Digestive()    — re-renders r-dgal with bilingual alert text
SCORE ENGINE            cBioAge (+ BIO_THR table, rawToZone — live zone self-computation)
                        cOx, cTx, cMt (zone-based bmiP/wcP + female override), cCr, cNt, cSk,
                        cDg (redFlag path removed), cBc, calcAll (computeAllZones first)
CR HELPERS (v6.2)       renderCrBreakdown() — per-parameter zone chips for Cardiac/Renal index cards;
                        crBk formula display (r-crbk) inside CR Strain .sc card
BC HELPERS              getBcLabel, bcZoneLabel, bcRefreshLabels
BC INPUT PANEL          bcSetMode, bcAutoCalc, bcMarkManual, bcResetAuto,
                        bcParseCsv, bcConfirmCsv, bcDownloadTemplate, _initBcCsvInput
RENDER HELPERS          se, aal (forceTitleBlack param), bar, barPillar, bmr,
                        ftrow, lbl, clrc, getBcLabel, getBadge
UI / DOM                nav (bodycomp bcAutoCalc hook), drawCharts (8 domains),
                        buildAction (bc test rows + food + hi-priority alert)
EXPORT                  exportSessionReport, mdToTxt, setExportFmt, toggleExportDd
PDF IMPORT              openPdfModal, closePdfModal, handlePdfUpload, initPdfDrop,
                        _checkServer
CSV IMPORT (QRMA)       initImportCSV, _parseCSV, _jsonToRow, _showImportModal,
                        confirmImport, closeImportModal
EVENT LISTENERS         DOMContentLoaded (theme toggle, language toggle→bcRefreshLabels,
                        lucide, initImportCSV, initPdfDrop, _initBcCsvInput,
                        export dropdown close)
HRV STRIP (v6 inline)   renderHrvStrip_BodyComp, renderHrvPanel (extends hrv-engine.js)
```

---

## 12. WORKING RULES FOR AI SESSIONS

1. Use `str_replace` for targeted edits. **Never rewrite the full HTML.**
2. Read `CLAUDE_final.md` + this file at session start.
3. Read `current_run.yaml` before any QA session.
4. For HRV changes, read `hrv-flask-session-handover.md` first.
5. All HRV logic lives in `hrv-engine.js` — nothing HRV-related goes inline in the HTML script block.
6. Never add `localStorage`, `sessionStorage`, or any browser storage API — HRV state is session-only in Phase 1.
7. `database.py` has no version suffix — do not rename it under any circumstances.
8. `SCRIPT_DIR` must be defined before `sys.path.insert` before any project imports in every Python script.
9. Windows shell limitation: cannot run multi-line `python -c` commands — wrap into a single line or write to a `.py` file first.
10. When in doubt about current state, check `CHANGELOG.md` — it is the most reliable timeline.
11. **`window.hrvState` bridge rule:** `hrv-engine.js` uses `let hrvState` (script scope). Any function outside that script that needs to read HRV state must use `window.hrvState`, which is kept in sync by `ingestHrv()`. Never read `hrvState` directly from the HTML inline script — it will always be undefined.
12. **Zone engine rule (v6.1+):** `computeAllZones()` runs at the very start of `calcAll()` and overwrites all 55 module field zones in `window.zoneData` from live DOM values. Do not manually set `window.zoneData` for module fields outside of `computeAllZones()` — edits will be overwritten on the next `calcAll()` call. Exception: `cBioAge()` additionally writes its 18 Bio Age fields (unprefixed IDs like `bv_zone`) which are separate keys not written by `computeAllZones()`. Exception: `cBc()` writes `bc-*` zones after `calcAll()` has already run.
13. **Label translation rule (B3 Phase 1+):** All visible field, UI, and module title strings that need bilingual support must carry a `data-label-key`, `data-ui-key`, or `data-module-key` attribute. Add the translation entry to `field_labels.json` first, then regenerate `field_labels.js` by copying the JSON content into the `window.QRMA_LABELS = {...}` assignment. Never edit `field_labels.js` directly.

---

## 13. FUTURE ROADMAP

### If project outgrows single file, split in this order:

```
/modules
  biological-age.js, oxidative.js, toxic.js, metabolic.js
  cardio-renal.js, nutrient.js, skin.js, action-plan.js

/core
  thresholds.js, severity.js, score-utils.js, mappings.js

/ui
  cards.js, charts.js, forms.js, alerts.js
```

### Planned but not scheduled

- Dual-view toggle: Consumer (simplified) vs Clinician (expanded sub-scores, raw values)
- Lab value integration: real lab results override QRMA estimates in scoring
- Multi-patient session support
- Report archiving and comparison across sessions
