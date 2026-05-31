# QRMA Project — Session Handover
## Date: 2026-05-30
## Topic: HRV Integration + Flask Microserver — Architecture, Design & Build 1

---

## Purpose of This Document

Baseline handover for the next AI session or developer picking up Build 2. Every decision made today is recorded here with its reasoning. Read this before touching any code.

---

## Project State at End of Session

### Build 1 — COMPLETE ✓
- `03_Scripts/server.py` — Flask microserver, port 5000, tested and passing
- `qrma-dashboard-v4.html` — PDF drop zone + Flask integration, v3 fully intact
- 3 patients tested via PDF drop: all passing, zero console errors
- Audit trail confirmed: CSV + JSON written for all 3 patients

### Build 2 — NOT STARTED
- `03_Scripts/hrv-engine.js` — to be created
- `qrma-dashboard-v4.html` — to be updated with HRV layer (Build 1 as base)

---

## server.py — Architecture Notes

Path setup uses `__file__` self-location (same as `csv_exporter_v2.py`):
```python
SCRIPT_DIR   = os.path.dirname(os.path.abspath(__file__))  # 03_Scripts/
PROJECT_ROOT = os.path.dirname(SCRIPT_DIR)                  # qrma_single/
```

Pipeline (never bypasses CSV):
```
POST /upload (multipart, field name "pdf")
  ↓ save to tempfile
  ↓ parse_qrma_pdf()           ← parser_v3
  ↓ load_mappings()            ← parser_v3
  ↓ export_dashboard_csv()     ← parser_v3  → writes 01_Data/csv/{name}_{date}.csv
  ↓ csv_to_json_payload()      ← json_exporter reads that CSV
  ↓ write 01_Data/json/{name}_{date}.json
  ↓ return JSON payload to browser
  ↓ delete temp PDF (finally block)
```

Response shape (same as importer.js expects):
```json
{ "patient": {...}, "values": {"field": 1.23, "field_zone": "sedang"}, "meta": {...}, "warnings": [...] }
```

---

## Build Sequence — Why Flask First

HRV Phase 1 depends on data getting into the app cleanly. Building Flask first means the operator has a single coherent flow (drop PDF → dashboard loads → enter HRV values) rather than multiple manual steps. Flask is also the scaffold for future HRV file import.

---

## HRV Architecture Decisions (all locked, Build 2 must follow)

### Core principle
HRV is an independent witness. Displays its own findings based purely on its own data. Does not check QRMA results first. Does not gate on QRMA alert state. Enrichment happens in the client's mind when they read both together.

### What HRV does NOT do
- Never alters any of the 7 QRMA module scores
- Never reads from QRMA alert containers
- Never uses QRMA zone vocabulary (normal/ringan/sedang/berat)
- Never implies it confirms or contradicts a QRMA finding

### ALI Vocabulary — fixed, do not translate to QRMA zone words
| Band | RMSSD | Meaning |
|---|---|---|
| Very Low | < 20 ms | Severe vagal withdrawal |
| Low | 20–40 ms | Suboptimal vagal tone |
| Adaptive | 40–70 ms | Reasonable autonomic flexibility |
| High | > 70 ms | Strong parasympathetic tone |

ALI translates to CSS color only at render time. Never mapped to normal/ringan/sedang/berat.

### hrv-engine.js — what it owns
All HRV logic. Nothing HRV-related inline in the HTML script block.
- `HRV_CONFIG` — thresholds, weights, protocol definitions
- `computeALI(rmssd, meanHr)` → 0–100
- `aliBand(ali)` → very_low | low | adaptive | high
- `computeQualityFlag(durationSec, artifactPct)` → pass | caution | reject
- `computeRmssdBand(rmssd)` → very_low | low | adaptive | high
- `computeRecoveryState(ali)` → strained | guarded | adaptive
- `getProtocolsForBand(band)` → array of protocol objects to show
- `renderHrvPanel()` — orchestrator, called at end of calcAll()
- Per-module strip renderers: `renderHrvStrip_BioAge()` ... `renderHrvStrip_Sk()`

---

## HRV Display Design (all locked, Build 2 must follow)

### 1. HRV Sidebar Module (own page in sidebar nav)

**Autonomic Status Card**
4 metrics: RMSSD · ALI band · Resting HR · Quality (pass/caution/reject)
ALI interpretation paragraph — band-driven, uses HRV doc Section 4.2 language
No reference to QRMA findings whatsoever.

**ALI-Gated Micro-Protocol Stack**
Shows ONLY protocols for current ALI band. No deferred protocols. No "coming soon."
- Very Low → V1 (Pre-Meal Breathing), V3 (Sleep Wind-Down), V4 (ANS Reset)
- Low      → V1, V2 (Post-Meal Walk), V3, V4
- Adaptive → V1, V2, V3, V4, V5 (Full HRV Biofeedback)
- High     → V2, V4, V5

Each protocol card: name · timing · technique · duration. Plain language only.

**Reading Provenance**
Device · Protocol · Duration · Artifact% · Timestamp
Compliance disclaimer (from HRV design doc Section 4.2).

**Empty state (no HRV data)**
"No HRV data for this session. Enter your reading to see your autonomic practices."

### 2. Per-Module Top Panel (on all 7 module pages)

2-line strip at the top of each module page.
Line 1 — vitals strip (identical on every module): RMSSD · ALI band · HR · Quality
Line 2 — context sentence (unique per module, never references QRMA findings):

| Module | Context sentence |
|---|---|
| Bio Age | "Elevated sustained autonomic load is associated with accelerated cellular aging patterns." |
| Oxidative | "Reduced vagal tone is associated with increased oxidative stress exposure." |
| Toxic/Detox | "Vagal tone supports hepatic bile secretion and detoxification capacity." |
| Metabolic | "Metabolic stress and autonomic load have a bidirectional relationship — each amplifies the other." |
| Cardio-Renal | "RMSSD reflects current cardiac autonomic balance. Reduced HRV is an independent cardiovascular risk marker." |
| Nutrients | "Adequate vagal tone is required for optimal digestive enzyme output and nutrient absorption." |
| Skin/Collagen | "Sustained sympathetic dominance elevates cortisol, which is associated with accelerated collagen turnover." |

Empty state: "No HRV data available for this session." — single line, neutral.
No micro-protocols on module pages — those live in HRV sidebar only.

---

## HRV Data Contract (locked)

`hrvState` — session-only in-memory. No database. No localStorage in Phase 1.

```javascript
let hrvState = null;  // null = no HRV this session

// When populated:
{
  // Provenance
  readingTimestamp: '2026-05-30T07:15:00',
  device:           'Polar H10',
  protocol:         'supine_rest_5min',

  // Quality gate — 3 distinct fields, not one boolean
  durationSec:  300,
  artifactPct:  2.1,
  qualityFlag:  'pass',      // pass | caution | reject

  // Raw metrics
  meanHr:    74,
  rmssd:     28,
  sdnn:      42,
  lnRmssd:   3.33,           // for Phase 3 baseline math
  lfHfRatio: null,           // optional, nullable

  // Derived — computed by hrv-engine.js, never entered manually
  rmssdBand:          'low',      // very_low | low | adaptive | high
  baselineStatus:     'unknown',  // unknown | below | near | above (Phase 3)
  autonomicLoadIndex: 72,         // 0–100
  recoveryState:      'guarded',  // strained | guarded | adaptive
  readinessBand:      'low'
}
```

`baselineStatus` and `lnRmssd` are carried now to protect the Phase 3 upgrade path.

---

## Integration Hook in calcAll()

One line added at end of `calcAll()`, before `lucide.createIcons()`:

```javascript
buildAction({ba, ox, tx, mt, cr, nt, sk, al: alv});
renderHrvPanel();      // ← HRV post-pass, no-op if hrvState is null
lucide.createIcons();
nav('dashboard');
```

---

## Manual Input Form (HRV Sidebar Module)

| Field | Type | Required | Default |
|---|---|---|---|
| RMSSD (ms) | number | yes | — |
| Resting HR (bpm) | number | yes | — |
| SDNN (ms) | number | no | — |
| Duration (sec) | number | yes | 300 |
| Artifact % | number | no | 0 |
| Device | text | no | Polar H10 |
| Protocol | dropdown | no | supine_rest_5min |

"Load HRV" button → `ingestHrv()` → computes derived fields → sets `hrvState` → calls `renderHrvPanel()`.

---

## Build 2 — Claude Code Prompt (ready to use)

```
Read these files first in this order:
1. CLAUDE.md  (pay attention to the HRV Integration Rules section)
2. hrv-flask-session-handover.md  (full HRV display spec and data contract)
3. 03_Scripts/zone-scoring.js  (understand the existing module pattern to mirror it)
4. qrma-dashboard-v4.html  (base file — do not break anything existing)
5. HRV_Integration_Design_Document__TeleTCM___Usaka_Autonomic_Bridge.md
   (clinical context for ALI bands, micro-protocol content, compliance language)

Then build:

FILE 1 — 03_Scripts/hrv-engine.js
  - HRV_CONFIG constant block (thresholds, ALI weights, protocol definitions)
  - computeALI(rmssd, meanHr) → 0–100
  - aliBand(ali) → very_low | low | adaptive | high
  - computeQualityFlag(durationSec, artifactPct) → pass | caution | reject
  - computeRmssdBand(rmssd) → very_low | low | adaptive | high
  - computeRecoveryState(ali) → strained | guarded | adaptive
  - getProtocolsForBand(band) → array of protocol objects
  - ingestHrv() — reads form fields, builds hrvState, calls renderHrvPanel()
  - renderHrvPanel() — orchestrator, no-op if hrvState is null
  - Per-module strip renderers for all 7 modules

FILE 2 — qrma-dashboard-v4.html updated (Build 1 as base):
  - Add <script src="03_Scripts/hrv-engine.js"> after zone-scoring.js
  - Add HRV sidebar nav item
  - Add HRV module page (pg-hrv): Status Card + Protocol Stack + Provenance
  - Add HRV manual input form in HRV module page
  - Add 2-line HRV strip at top of each of the 7 module pages
  - Add renderHrvPanel() call at end of calcAll() before lucide.createIcons()
  - Zero existing lines removed or modified

RULES:
  - HRV never alters QRMA scores
  - HRV renders independently — no gating on QRMA alert state
  - ALI uses own vocabulary (very_low/low/adaptive/high) — never normal/ringan/sedang/berat
  - Missing HRV = empty state only, dashboard behaves as today
  - Single HTML file constraint maintained
  - All Build 1 functionality intact
```

---

## What Stays Deferred

Pre-existing:
- buildAction() zone gates
- sk-tw direction ambiguity
- Debug log removal before production release
- Parameter name translation (ID/EN display labels)
- Manual input form for mt-bmi and mt-wc
- PyWebView wrapper (Option C)

New from today (post-Phase 1):
- HRV file import (Polar/Garmin/Apple JSON) — Phase 2
- localStorage for HRV history — Phase 2
- Baseline-aware HRV rolling comparison — Phase 3
- Flask-served HRV file import — Phase 3

---

## Reference Documents in Repo

| File | Read for |
|---|---|
| `HRV_Integration_Design_Document__TeleTCM___Usaka_Autonomic_Bridge.md` | Clinical context, ALI bands, micro-protocol content, CPT mapping |
| `hrv_logic_layer_handover.md` | Engine architecture, rule namespaces, build phases |
| `hrv-integration-next-ai-handover.md` | Data contracts, adapter architecture, session payload schema |

Read the design document first for clinical context. Logic layer handover for engine architecture. Next-AI handover for the full data contract spec.

---

## Bug Fixes Applied Post-Build 1 (2026-05-30)

### FIX 1 — Frans patient name in hint text (qrma-dashboard-v4.html)
17 `.irg` hint divs had `| Frans: X.XX (high/low)` hardcoded from QA session.
Stripped from all 17 fields. Hint text now shows `Normal: X` only.

### FIX 2 — Nutrient field ranges, scale labels, step precision (qrma-dashboard-v4.html)
All 10 nutrient input fields had wrong ranges (written for a 0–10 scale).
Corrected to PDF Referensi Standar values. `(0-10)` labels removed. `step` set to `0.001`.
Default `value=` updated to midpoint of correct normal range.

### FIX 3 — mappings.json normal_range for 9 nutrient entries
Root cause: empty `normal_range` → parser couldn't derive zones → `unknown` → `—` badge.
All 9 entries now have correct ranges. Zero unknown zones on re-run.
Potassium (nt-k) confirmed `ringan` for Ridwan — genuine finding (0.637 < 0.689 floor).

### Known Issue (not fixed)
`parser_v3.py` line 917: UnicodeEncodeError on Windows cp1252 when printing warnings
containing `α`. CSV output unaffected. Cosmetic terminal issue only. Deferred.

### Pipeline Note
Kamiyanti and Frans CSVs/JSONs in `01_Data/` are stale for nutrient fields after FIX 3.
Re-run pipeline on both PDFs before next QA session.
