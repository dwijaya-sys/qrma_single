# QRMA Project — Session Handover
## Date: 2026-05-30
## Topic: HRV Integration + Flask Microserver — Architecture & Design Decisions

---

## Purpose of This Document

This is the baseline handover for the next AI session or developer picking up Build 1 and Build 2. It summarizes every decision made today, the reasoning behind each, and the exact state of the project at end of session. Read this before touching any code.

---

## Project State at Start of Session

- `qrma-dashboard-v3.html` — active dashboard, 996 lines, QA-approved 2026-05-28
- Pipeline: `parser_v3.py` → `csv_exporter_v2.py` → `json_exporter.py` → manual JSON import in browser
- External scripts in `03_Scripts/`: `zone-scoring.js`, `importer.js` (confirmed present locally, not in repo upload)
- No HRV integration anywhere. No Flask server.
- Three HRV design documents present in repo (integration design doc, logic layer handover, next-AI handover)

---

## Build Sequence Decided

### Build 1 — Flask Microserver
**Files:** `03_Scripts/server.py` + `qrma-dashboard-v4.html`

Replace the manual terminal pipeline + file picker import with a browser-native PDF drop. Operator starts the server once (`python server.py`), then all sessions happen entirely in the browser.

**Pipeline stays intact — never bypass the CSV:**
```
PDF drop in browser
  → Flask server.py receives file
  → runs csv_exporter_v2.py  → writes CSV to 01_Data/csv/
  → runs json_exporter.py    → writes JSON to 01_Data/json/
  → reads JSON, returns to browser
  → browser calls QRMAImporter.importFromPayload()
  → calcAll() runs, dashboard loads
```

CSV is kept as a permanent audit trail. The reason: if the PDF format changes, only the parser needs updating — the JSON contract to the browser stays stable. CSV is the format buffer between the two.

Dashboard must remain fully functional without the server running (file picker import still works as fallback).

### Build 2 — HRV Phase 1
**Files:** `03_Scripts/hrv-engine.js` + `qrma-dashboard-v4.html` (Build 1 as base)

Add the HRV layer on top of the stable Build 1 foundation. HRV data is manual entry only in Phase 1 — operator types values from EliteHRV / Polar Flow / Beat app. No device import yet. No data retention.

---

## HRV Architecture Decisions (all locked)

### Core principle
HRV is an independent witness. It displays its own findings based purely on its own data and its own rules. It does not check QRMA results first. It does not gate on QRMA alert state. Enrichment happens in the client's mind when they read both together.

### What HRV does NOT do
- Never alters any of the 7 QRMA module scores
- Never reads from QRMA alert containers
- Never uses QRMA zone vocabulary (normal/ringan/sedang/berat)
- Never implies it confirms or contradicts a QRMA finding

### ALI Vocabulary — fixed, do not translate
| Band | RMSSD | Meaning |
|---|---|---|
| Very Low | < 20 ms | Severe vagal withdrawal |
| Low | 20–40 ms | Suboptimal vagal tone |
| Adaptive | 40–70 ms | Reasonable autonomic flexibility |
| High | > 70 ms | Strong parasympathetic tone |

ALI is computed from raw HRV values inside `hrv-engine.js`. It translates to a CSS color only at render time. Never mapped to normal/ringan/sedang/berat.

### hrv-engine.js — what it owns
All HRV logic lives here. Nothing HRV-related goes inline in the HTML script block.
- `HRV_CONFIG` — thresholds, weights, protocol definitions
- `computeALI(rmssd, meanHr)` → 0–100
- `aliBand(ali)` → very_low | low | adaptive | high
- `computeQualityFlag(durationSec, artifactPct)` → pass | caution | reject
- `computeRmssdBand(rmssd)` → very_low | low | adaptive | high
- `computeRecoveryState(ali)` → strained | guarded | adaptive
- `getProtocolsForBand(band)` → array of protocol objects to show
- `renderHrvPanel()` — orchestrator called after calcAll()
- Per-module renderers: `renderHrvStrip_BioAge()`, `renderHrvStrip_Ox()`, etc.

---

## HRV Display Design (all locked)

### 1. HRV Sidebar Module (own page in sidebar nav)

Three sections top to bottom:

**Autonomic Status Card**
- 4 metrics: RMSSD (ms) · ALI band · Resting HR (bpm) · Quality (pass/caution/reject)
- ALI interpretation paragraph — band-driven, from doc Section 4.2 language
- No reference to QRMA findings

**ALI-Gated Micro-Protocol Stack**
Shows ONLY protocols appropriate for current ALI band. No "coming soon" or deferred protocols shown.
- Very Low → V1 (Pre-Meal Breathing), V3 (Sleep Wind-Down), V4 (ANS Reset)
- Low → V1, V2 (Post-Meal Walk), V3, V4
- Adaptive → V1, V2, V3, V4, V5 (Full HRV Biofeedback)
- High → V2, V4, V5

Each protocol card: name · timing · technique · duration. Plain language only.

**Reading Provenance**
- Device · Protocol · Duration · Artifact% · Timestamp
- Compliance disclaimer (from doc Section 4.2 implementation note)

**Empty state (no HRV data)**
Single neutral message: *"No HRV data for this session. Enter your reading to see your autonomic practices."*

### 2. Per-Module Top Panel (on all 7 module pages)

A 2-line strip at the top of each module page. Always identical in structure, content is module-specific.

- **Line 1 (vitals strip):** RMSSD · ALI band · HR · Quality — same on every module
- **Line 2 (context sentence):** one sentence linking HRV domain to the module's domain — unique per module, never references QRMA findings

Per-module context sentences:
| Module | Context sentence |
|---|---|
| Bio Age | "Elevated sustained autonomic load is associated with accelerated cellular aging patterns." |
| Oxidative | "Reduced vagal tone is associated with increased oxidative stress exposure." |
| Toxic/Detox | "Vagal tone supports hepatic bile secretion and detoxification capacity." |
| Metabolic | "Metabolic stress and autonomic load have a bidirectional relationship — each amplifies the other." |
| Cardio-Renal | "RMSSD reflects current cardiac autonomic balance. Reduced HRV is an independent cardiovascular risk marker." |
| Nutrients | "Adequate vagal tone is required for optimal digestive enzyme output and nutrient absorption." |
| Skin/Collagen | "Sustained sympathetic dominance elevates cortisol, which is associated with accelerated collagen turnover." |

**Empty state (no HRV data):** *"No HRV data available for this session."* — single line, no panel rendered.

No micro-protocols on module pages. Those live in the HRV sidebar module only.

---

## HRV Data Contract (locked)

`hrvState` — session-only in-memory object. No database. No localStorage in Phase 1.

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
  lnRmssd:   3.33,
  lfHfRatio: null,           // optional, nullable

  // Derived — computed by hrv-engine.js, never entered manually
  rmssdBand:          'low',      // very_low | low | adaptive | high
  baselineStatus:     'unknown',  // unknown | below | near | above (Phase 3)
  autonomicLoadIndex: 72,         // 0–100
  recoveryState:      'guarded',  // strained | guarded | adaptive
  readinessBand:      'low'
}
```

`baselineStatus` and `lnRmssd` are included now even though Phase 1 doesn't use them. They protect the Phase 3 upgrade path (baseline-aware HRV from rolling history) from requiring a schema change.

---

## Integration Hook in calcAll()

One line added at the end of `calcAll()`, immediately before `lucide.createIcons()`:

```javascript
// existing end of calcAll():
drawCharts(GS);
buildAction({ba, ox, tx, mt, cr, nt, sk, al: alv});
renderHrvPanel();    // ← new: HRV post-pass, reads hrvState, no-op if null
lucide.createIcons();
nav('dashboard');
```

`renderHrvPanel()` is a no-op if `hrvState` is null. Zero side effects on existing behaviour.

---

## Manual Input Form (HRV Sidebar Module)

Fields the operator enters (values from EliteHRV / Polar Flow / Beat app):

| Field | Type | Required |
|---|---|---|
| RMSSD (ms) | number | yes |
| Resting HR (bpm) | number | yes |
| SDNN (ms) | number | no |
| Duration (sec) | number | yes, default 300 |
| Artifact % | number | no, default 0 |
| Device | text | no, default "Polar H10" |
| Protocol | dropdown | no, default "supine_rest_5min" |

"Load HRV" button triggers `ingestHrv()` → computes derived fields → sets `hrvState` → calls `renderHrvPanel()`.

---

## What Stays Deferred

These items were already deferred before today and remain deferred:
- buildAction() zone gates
- sk-tw direction ambiguity
- Debug log removal before production release
- Parameter name translation (ID/EN display labels)
- Manual input form for mt-bmi and mt-wc
- PyWebView wrapper (Option C desktop packaging)

These are new deferrals from today:
- HRV file import (Polar / Garmin / Apple JSON) — Phase 2
- localStorage for HRV history across sessions — Phase 2
- Baseline-aware HRV (rolling comparison) — Phase 3
- Flask-served HRV import alongside PDF drop — Phase 3

---

## Files to Create

### Build 1
| File | Location | Purpose |
|---|---|---|
| `server.py` | `03_Scripts/` | Flask microserver |
| `qrma-dashboard-v4.html` | project root | v3 + PDF drop zone + Flask fetch |

### Build 2
| File | Location | Purpose |
|---|---|---|
| `hrv-engine.js` | `03_Scripts/` | HRV logic module |
| `qrma-dashboard-v4.html` | project root | Build 1 + HRV sidebar + per-module panels |

### Already Updated Today
| File | Change |
|---|---|
| `CLAUDE.md` | Version → v4, Rule 7 amended, HRV Integration Rules section added |
| `CHANGELOG.md` | 2026-05-30 entry added |

---

## Reference Documents in Repo

| File | Purpose |
|---|---|
| `HRV_Integration_Design_Document__TeleTCM___Usaka_Autonomic_Bridge.md` | WHY + WHAT — protocol design, ALI bands, micro-protocols, CPT mapping |
| `hrv_logic_layer_handover.md` | HOW — reasoning engine architecture, rule namespaces, build phases |
| `hrv-integration-next-ai-handover.md` | BUILD THIS — data contracts, adapter architecture, session payload schema |

Read the design document first for clinical context. Read the logic layer handover for engine architecture. Read the next-AI handover for the data contract spec.

