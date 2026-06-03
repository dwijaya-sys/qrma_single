# QRMA Dashboard — Project Master Map
**Last updated:** 2026-06-02 → amended 2026-06-03 (v5.0 Module 9 Digestive complete; FIX 5 HRV export bridge; B4+B5 complete)  
**Compiled from:** CLAUDE.md, CLAUDE_final.md, HANDOVER.md, CHANGELOG.md, hrv-flask-session-handover.md, hrv_logic_layer_handover.md, hrv-integration-next-ai-handover.md, current_run.yaml  
**Purpose:** Single file an AI session or developer reads first. Replaces need to reconcile 5+ context docs.

> ⚠️ **Unverified files** (exist on local disk, not in repo snapshot):  
> `qrma-dashboard-v5.html`, `03_Scripts/server.py`, `03_Scripts/hrv-engine.js`,  
> `03_Scripts/zone-scoring.js`, `03_Scripts/importer.js`, `03_Scripts/json_exporter.py`  
> Sections referencing these are derived from design docs — treat as spec until verified against actual files.

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
Date:          2026-06-03
Active build:  v5.0 — COMPLETE (Module 9 Digestive shipped 2026-06-03)
Active HTML:   qrma-dashboard-v5.html
Last QA:       Playwright headless QA — VERDICT: PASS (all 12 items)
Last hotfix:   FIX 5 — window.hrvState export bridge (hrv-engine.js v1.1.3, 2026-06-03)
Next build:    Build 3b — Body comp manual input panel + cMt() rewrite
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

---

## 3. FILE INVENTORY

### 3.1 Active Files (deploy these)

| File | Version | Role |
|---|---|---|
| `qrma-dashboard-v5.html` | v5 | **ACTIVE** single-file dashboard app — 9 modules ⚠️ not in repo snapshot |
| `03_Scripts/server.py` | — | Flask microserver — PDF drop → pipeline → browser ⚠️ not in repo snapshot |
| `03_Scripts/hrv-engine.js` | v1.1.3 | HRV logic module + renderHrvStrip_Digestive() + window.hrvState bridge ⚠️ not in repo snapshot |
| `03_Scripts/zone-scoring.js` | v1.0 | Zone-to-score + language module ⚠️ not in repo snapshot |
| `03_Scripts/importer.js` | v1.5.1 | JSON importer adapter (IIFE: QRMAImporter) ⚠️ not in repo snapshot |
| `03_Scripts/csv_exporter_v2.py` | v2 | PDF → CSV (imports from parser_v3) |
| `03_Scripts/json_exporter.py` | — | CSV → JSON payload for browser ⚠️ not in repo snapshot |
| `03_Scripts/parser_v3.py` | v3 | PDF → raw values + zone derivation + SQLite — updated: orphan-name fix + higher-worse inversion |
| `03_Scripts/mappings.json` | current | Indonesian PDF name → dashboard field ID — updated: 9 dg-* fields mapped |
| `database.py` | stable | SQLAlchemy models — **do not rename, shared with another dev** |

**Script load order in `<head>` — must be preserved:**
```html
<script src="03_Scripts/zone-scoring.js"></script>
<script src="03_Scripts/importer.js"></script>
<script src="03_Scripts/hrv-engine.js"></script>
<!-- inline <script> block last -->
```

### 3.2 Superseded Files (keep, do not use)

| File | Reason |
|---|---|
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
Operator drops PDF onto qrma-dashboard-v5.html drop zone
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
  → populates window.zoneData + DOM field IDs
  ↓
calcAll()   (score orchestrator)
  → cBioAge, cOx, cTx, cMt, cCr, cNt, cSk, cDg
  ↓
renderHrvPanel()   (HRV post-pass, no-op if hrvState is null)
  ↓
lucide.createIcons()
nav('dashboard')
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
| `mt-bmi` / `mt-wc` permanent PDF gaps | By design | Section headings in PDF — require manual input panel (Build 3b) |
| Body comp fields `bc-*` not yet in scoring | By design | Scoring spec locked (§5.7) — implementation in Build 3b |
| Debug logs in v5 HTML | Deferred | Retained intentionally during dev; remove before production release (B7) |
| `parser_v3.py` orphan-name truncation | **Fixed v5.0** | Multi-line PDF param names now merged correctly — dg-lc was affected |
| `parser_v3.py` higher-worse zone inversion | **Fixed v5.0** | dg-ip and any future higher-worse fields now zone correctly |
| `window.hrvState` not readable by `exportSessionReport()` | **Fixed FIX 5** | `let hrvState` (script scope) bridged to `window.hrvState` in hrv-engine.js v1.1.3. HRV block verified in MD + TXT exports via Playwright. |

---

## 5. DASHBOARD MODULES

### 5.1 Module Table

| # | ID | Score Type | Confidence | Key Field IDs |
|---|---|---|---|---|
| 1 | `basic` | Bio Age estimate | Well-supported | `bv, cp, art, ins, bs, fr, hyp, ph, pb, hg, ce, cs, cj, coq, gsh, vc, ve, ost` |
| 2 | `oxidative` | Risk ↑ worse | Exploratory | `ox-gsh, ox-coq, ox-vc, ox-ve, ox-sel, ox-fr, ox-hyp, ox-ph` |
| 3 | `toxic` | Risk ↑ worse | Needs lab confirm | `tx-pb, tx-hg, tx-cd, tx-as, tx-st, tx-tb, tx-ps` |
| 4 | `metabolic` | Risk ↑ worse | Well-supported | `mt-tg, mt-ug, mt-ins, mt-fm, mt-bmi*, mt-wc*, bc-fat*, bc-vf*, bc-muscle*, bc-bmr*, bc-whr*` |
| 5 | `digestive` | Risk ↑ worse | Exploratory | `dg-lp, dg-la, dg-sp, dg-sa, dg-lc, dg-ca, dg-bi, dg-ip†, dg-ds` |
| 6 | `cardio` | Risk ↑ worse | Needs lab confirm | `cr-ch, cr-vf, cr-lv, cr-ua, cr-pt, cr-k, cr-mg` |
| 7 | `nutrient` | Resilience ↑ better | Exploratory | `nt-zn, nt-mg, nt-k, nt-io, nt-si, nt-b6, nt-vc, nt-d3, nt-ve, nt-fo` |
| 8 | `skin` | Resilience ↑ better | Exploratory | `sk-sc, sk-el, sk-tw‡, sk-sb, sk-ml, sk-sn, sk-ec, sk-jc` |
| 9 | `action` | Aggregated output | Inherits | Output layer only — no direct inputs |
| HRV | `hrv` | ALI (0–100) | Independent domain | `rmssd, meanHr, sdnn, lnRmssd, durationSec, artifactPct` |

`*` permanent gaps / manual-input-only fields — never extractable from QRMA PDF.  
`†` `dg-ip` direction is higher-worse — zone derivation inverted in parser_v3.py. Ridwan: 3.206 → sedang.  
`‡` direction ambiguity — flagged, under investigation

### 5.2 Scoring Functions

```javascript
cBioAge()   // Zone burden → weighted 3-pillar bio age offset
cOx()       // ax (antioxidant reserve) + px (pro-oxidant load)
cTx()       // hm (heavy metals) + lb (lifestyle burden)
cMt()       // gc (glycemic) + lp (lipid) + bc (body comp — adaptive weight, see §5.7)
cCr()       // cai (cardiac) + ri (renal)
cNt()       // resilience — avg zone score × 10 nutrients
cSk()       // resilience — cl (collagen) + bf (barrier) + sn
cDg()       // mt (motility 40%) + ab (absorption 35%) + pi (pressure 25%) — see §5.8
calcAll()   // master orchestrator — calls all above, then renderHrvPanel()
```

All scoring is zone-driven (v3). No raw numeric thresholds in scoring functions.  
`buildAction()` still uses raw numeric thresholds from PDF reference ranges — zone-gate migration deferred.

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

| Patient | Gender | Fields | Zones | Bio Age | Console |
|---|---|---|---|---|---|
| Ridwan | Male | 71/73 | 71/71 | 42y (+2y) | Clean |
| Kamiyanti | Female | 62/64 | 62/62 | 43y (+2y) | Clean |
| Frans | — | — | — | 53y (+6y) | Clean |

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

### 5.7 Body Composition — Scoring Spec (cMt() Addendum)

**Status:** Design locked 2026-06-02. Implementation target: Build 3b.  
**Replaces:** Current v2 holdover BMI/waist raw threshold logic in `cMt()`.

#### Guiding principles

1. QRMA glycemic + lipid signals remain primary (75% base weight). Body comp is supplementary — it does not override the QRMA instrument.
2. Waist circumference outranks BMI clinically. Visceral fat outranks both. Scoring reflects this priority order.
3. Adaptive weighting: contribution scales up as more fields are populated. Missing fields contribute 0 and do not penalise the score.
4. All body comp values are zone-classified on entry using the thresholds below — stored in `window.zoneData` identically to QRMA fields. `cMt()` reads zones, not raw numbers (consistent with all other v3 scoring).
5. Body comp data source is device-agnostic. The scoring engine only sees zone labels — it does not know or care whether values came from manual entry, InBody, or Xiaomi scale.
6. Asian-specific thresholds apply throughout. Standard WHO/IDF European values must not be used.

#### Field inventory

| Field ID | Label (UI) | Unit | Feeds scoring | Data tier |
|---|---|---|---|---|
| `mt-bmi` | BMI | kg/m² | Yes — `cMt()` | Tier B: manual or auto-calc |
| `mt-wc` | Waist | cm | Yes — `cMt()` | Tier B: manual |
| `bc-fat` | Body Fat % | % | Yes — `cMt()` (if `bc-vf` absent) | Tier A: device preferred |
| `bc-vf` | Visceral Fat Level | device scale | Yes — `cMt()` (priority over `bc-fat`) | Tier A: device preferred |
| `bc-muscle` | Muscle Mass | kg | Metadata only now; future sarcopenia signal | Tier A: device preferred |
| `bc-bmr` | BMR | kcal/day | Metadata only now | Tier A: device preferred |
| `bc-whr` | Waist-to-Height Ratio | ratio | Metadata only now; future replacement for BMI | Tier B: auto-calc |
| `bc-height` | Height | cm | Derived only (BMI calc) | Tier B: manual |
| `bc-weight` | Weight | kg | Derived only (BMI calc) | Tier B: manual |
| `bc-source` | Source | string | Provenance only | — |
| `bc-date` | Measurement Date | YYYY-MM-DD | Provenance only | — |
| `bc-vf-scale` | VF Device Scale | string | Provenance only | — |

**Auto-calculation rules:**
- If `bc-height` + `bc-weight` both entered → compute `mt-bmi`, lock field with "calculated" indicator
- If `mt-bmi` entered directly → accept, do not require height/weight
- If both present and conflict by > 0.5 BMI units → show warning, use directly-entered value
- `bc-whr` = `mt-wc` / (`bc-height` × 100) — computed only, never entered directly

#### Zone thresholds (Asian-specific)

**BMI — Asian WHO cutoffs (not standard WHO):**

| Zone | BMI range | Clinical meaning |
|---|---|---|
| berat | < 17.0 | Severely underweight |
| sedang | 17.0–18.4 | Underweight |
| normal | 18.5–22.9 | Optimal (Asian) |
| ringan | 23.0–24.9 | At risk (Asian) |
| sedang | 25.0–29.9 | Obese I |
| berat | ≥ 30.0 | Obese II+ |

Note: BMI is bidirectional (both extremes are risk). Low-end zones use same sedang/berat labels but burden scoring must handle direction: underweight → burden, overweight → burden, normal → no burden.

**Waist circumference — Asian IDF:**

| Zone | Male | Female |
|---|---|---|
| normal | < 90 cm | < 80 cm |
| ringan | 90–94 cm | 80–84 cm |
| sedang | 95–99 cm | 85–89 cm |
| berat | ≥ 100 cm | ≥ 90 cm |

**Body fat % — general population, gender-specific:**

| Zone | Male | Female |
|---|---|---|
| normal | 10–20% | 18–28% |
| ringan | 20–25% | 28–33% |
| sedang | 25–30% | 33–38% |
| berat | > 30% | > 38% |

**Visceral fat level — InBody/Xiaomi 1–20 scale:**

| Zone | Level |
|---|---|
| normal | 1–9 |
| ringan | 10–12 |
| sedang | 13–16 |
| berat | 17–20 |

Store `bc-vf-scale: "inbody_1_20"` alongside the value. Do not zone-classify visceral fat from a different device scale without verifying equivalence first. If scale unknown → store raw value + provenance, display as context only, do not zone-classify.

#### cMt() revised scoring logic

```javascript
function cMt() {
  const zd   = window.zoneData || {};
  const gend = document.getElementById('gender')?.value || 'male';

  // Burden score helper (zone → burden, higher = worse)
  // normal(9)→1  ringan(6)→4  sedang(3)→7  berat(1)→9  unknown→5
  function bd(id) {
    const s = scoreFromZone(zd[id + '_zone'] || 'unknown');
    return s === 0 ? 5 : 10 - s;
  }

  // Raw value helper
  function g(id) {
    return parseFloat(document.getElementById(id)?.value) || null;
  }

  // ── QRMA signals (unchanged, always 75% base) ───────────────────────────
  const gc = ((bd('mt-ug') + bd('mt-ins')) / 2) * (100 / 9);   // glycemic burden
  const lp = ((bd('mt-tg') + bd('mt-fm')) / 2) * (100 / 9);   // lipid burden

  // ── Body composition — adaptive, priority-ordered ───────────────────────
  // Max total bc = 25 pts. Contribution scales with data available.
  // Priority: visceral fat (12) > waist (8) > BMI (5)
  // bc-fat substitutes for bc-vf when visceral fat absent (max 10 instead of 12)

  let bc = 0;

  const vf  = g('bc-vf');    // visceral fat level (device scale)
  const wc  = g('mt-wc');    // waist circumference cm
  const bmi = g('mt-bmi');   // BMI kg/m²
  const fat = g('bc-fat');   // body fat %

  // Priority 1 — Visceral fat (strongest predictor, max 12 pts)
  if (vf !== null && zd['bc-vf_zone']) {
    bc += bd('bc-vf') * (12 / 9);
  }

  // Priority 2 — Waist circumference (clinical standard, max 8 pts)
  if (wc !== null && zd['mt-wc_zone']) {
    bc += bd('mt-wc') * (8 / 9);
  }

  // Priority 3 — BMI (context marker, max 5 pts)
  // Bidirectional: underweight and overweight both add burden
  if (bmi !== null && zd['mt-bmi_zone']) {
    bc += bd('mt-bmi') * (5 / 9);
  }

  // Priority 4 — Body fat % (substitutes for visceral fat when absent, max 10 pts)
  if (vf === null && fat !== null && zd['bc-fat_zone']) {
    bc += bd('bc-fat') * (10 / 9);
  }

  // ── Final score ─────────────────────────────────────────────────────────
  // gc×0.40 + lp×0.35 = 75% base. bc = up to 25 pts.
  // When bc = 0 (no body comp data), gc+lp are implicitly scaled to 100%.
  const gcLp = gc * 0.40 + lp * 0.35;
  const s = Math.min(100, Math.max(0, Math.round(gcLp + bc)));

  return {
    s,
    gc: Math.round(gc), lp: Math.round(lp), bc: Math.round(bc),
    tg: g('mt-tg'), ug: g('mt-ug'), ins: g('mt-ins'), fm: g('mt-fm'),
    bmi, wc, vf, fat
  };
}
```

**Max bc contribution by data availability:**

| Data entered | Max bc pts | % of total score |
|---|---|---|
| Nothing | 0 | 0% (gc+lp scale to 100%) |
| BMI only | 5 | ~5% |
| BMI + waist | 13 | ~13% |
| BMI + waist + body fat % | 20 | ~20% |
| BMI + waist + visceral fat | 25 | ~25% |

#### Body comp data contract (session JSON)

```json
"body_comp": {
  "present":    true,
  "source":     "manual",
  "sourceDevice": null,
  "measurementDate": "2026-06-01",
  "height_cm":  170,
  "weight_kg":  71,
  "bmi":        24.6,
  "bmi_calc":   false,
  "waist_cm":   88,
  "bodyFatPct": 21.6,
  "muscleMass_kg": 30.8,
  "visceralFatLevel": null,
  "vfScale":    null,
  "bmr_kcal":   1617,
  "whr":        null,
  "notes":      ""
}
```

`bmi_calc: true` means BMI was auto-calculated from height+weight. `bmi_calc: false` means operator entered it directly. Scoring treats both identically — this field is for audit trail only.

#### UI label (operator-facing)

Internal key: `body_comp`  
Display label: **"Body Measurements"** (EN) / **"Pengukuran Tubuh"** (ID)  
Never use "Anthropometric" in the UI.

#### Source dropdown values (device-agnostic)

```
manual          ← Build 3b (now)
inbody          ← Build 4+ (deferred)
xiaomi_scale    ← Build 4+ (deferred)
other_device    ← Build 4+ (deferred)
csv_batch       ← Build 3c batch path (deferred)
```

Source dropdown is display-only in Build 3b — all sources write to the same fields via the same panel.

#### Build 3b checklist additions (body comp)

```
[ ] bodyCompState object (mirrors hrvState pattern) — session-only, no localStorage
[ ] Manual input panel — post-import supplementary card (Option A)
[ ] Auto-calc BMI from height + weight with "calculated" badge
[ ] Zone classification on entry for mt-bmi, mt-wc, bc-fat, bc-vf
[ ] body_comp block written to session JSON on Apply
[ ] cMt() updated to new adaptive logic above
[ ] calcAll() re-fires after body comp Apply
[ ] QA: metabolic score increases correctly when waist > threshold
[ ] QA: score unchanged when no body comp entered (regression check)
[ ] body_comp_batch.csv template (parallel to hrv_batch.csv) — for batch path
```

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
// Per-module strip renderers:
renderHrvStrip_BioAge()
renderHrvStrip_Ox()
renderHrvStrip_Tx()
renderHrvStrip_Mt()
renderHrvStrip_Cr()
renderHrvStrip_Nt()
renderHrvStrip_Sk()
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
| B1 | **Body comp manual input panel + cMt() rewrite** | Scoring spec locked §5.7. Manual input panel (Option A post-import), bodyCompState, zone classification on entry, adaptive cMt() | Build 3b |
| B2 | **buildAction() zone gates** | Replace v2 numeric thresholds with zone-driven logic | Build 3 |
| B3 | **Parameter name translation (ID/EN display labels)** | Add `en_display`/`id_display` to mappings.json, update bmr() spans + language toggle | Build 3 |
| B4 | ~~**Export Report HRV block**~~ | **COMPLETE 2026-06-03** — HRV section present in MD + TXT when hrvState populated. Root cause was `let` scope isolation (FIX 5). Verified via Playwright. | ✓ Done |
| B5 | ~~**Export Report format toggle (MD/TXT)**~~ | **COMPLETE 2026-06-03** — MD + TXT both verified for all 8 modules including HRV and Digestive. `mdToTxt()` strips markdown symbols correctly. | ✓ Done |
| B6 | **sk-tw direction ambiguity** | Zone direction under investigation — flagged by Reviewer in run_ridwan_20260528 | Investigate |
| B7 | **Debug log removal** | Remove console.log calls before production release | Pre-release |
| B8 | **HRV file import** | Polar/Garmin/Apple JSON → ingestHrv() | HRV Phase 2 |
| B9 | **localStorage for HRV history** | Session persistence across browser refreshes | HRV Phase 2 |
| B10 | **Baseline-aware HRV rolling comparison** | lnRmssd baseline math — field already in hrvState | HRV Phase 3 |
| B11 | **Flask-served HRV file import** | Server-side HRV file handling | HRV Phase 3 |
| B12 | **PyWebView wrapper (Option C)** | Full desktop packaging — deferred until Flask is proven stable | Post-Phase 3 |
| B13 | **parser_v3.py UnicodeEncodeError on Windows cp1252** | Affects console output only, not data | Low priority |
| B14 | **body_comp_batch.csv template + batch_runner.py extension** | Parallel to HRV batch path — batch_runner merges body_comp block from CSV | Build 3c |
| B15 | **Device import parsers (InBody, Xiaomi)** | Each device → normalise to body_comp block; source dropdown gains new options; zero UI changes | Build 4+ |
| B16 | **GDV integration layer (v6.0)** | Dual-instrument session JSON schema, GDV parser, correlation rules engine (CR-001 to CR-024), TCM pattern activation, AI narrative generation via Claude API. Spec: Logic_Layer_Specification_Document. | v6.0 |

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
mt-bmi   →  PDF section heading, not data row — requires manual input panel (Build 3b)
mt-wc    →  Not in PDF table rows — requires manual input panel (Build 3b)
bc-*     →  All body comp fields are manual-input-only — never from PDF by design
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
SCORE ENGINE            cBioAge, cOx, cTx, cMt, cCr, cNt, cSk, calcAll
RENDER HELPERS          se, aal, bar, barPillar, bmr, ftrow, lbl, clrc, getBadge
UI / DOM                nav, drawCharts, buildAction
EVENT LISTENERS         DOMContentLoaded, theme toggle, language toggle
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
