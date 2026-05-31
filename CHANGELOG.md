# QRMA Dashboard — Changelog

---

## 2026-05-30 — Bug Fixes: Nutrient Fields + Input Hints

### Fixes Applied to qrma-dashboard-v4.html + mappings.json

#### FIX 1 — Removed hardcoded patient name from input hint text
- 17 `.irg` hint divs in the basic input section contained `| Frans: X.XX (high/low)`
- These were hardcoded from a previous QA session and never cleared
- Stripped from all 17 fields — hint text now shows `Normal: X` only
- Affected fields: bv, cp, art, ins, bs, fr, ph, pb, hg, ce, cs, cj, coq, gsh, vc, ve, ost

#### FIX 2 — Corrected nutrient field normal ranges, scale labels, and step precision
- All 10 nutrient input fields had wrong `Normal:` ranges (written for a 0–10 scale)
- Actual PDF values are on a much smaller raw bioresonance scale (0–8 approx)
- Ranges corrected from PDF Referensi Standar (verified from QRMA_Ridwan_November_21.md):

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

- `(0-10)` scale label removed from all 10 nutrient field labels
- `step` corrected to `0.001` for all 10 fields (values have 3 decimal places)
- Default `value=` attributes updated to midpoint of correct normal range

#### FIX 3 — Fixed mappings.json normal_range for 9 nutrient entries
- Root cause of `—` (unknown) zone badges in nutrient module
- `normal_range` was empty string for 9 out of 10 nutrient fields
- Parser uses `normal_range` to derive zones — empty range = `unknown` zone = `—` badge
- All 9 entries now populated with correct ranges from PDF

**Pipeline verification (Ridwan 2025-11-10):**

| Field | Value | Zone |
|---|---|---|
| nt-zn | 1.888 | normal |
| nt-mg | 0.932 | normal |
| nt-k | 0.637 | ringan ← genuine finding |
| nt-io | 2.794 | normal |
| nt-si | 3.609 | normal |
| nt-b6 | 0.895 | normal |
| nt-vc | 5.013 | normal |
| nt-d3 | 6.046 | normal |
| nt-ve | 4.907 | normal |
| nt-fo | 1.600 | normal |

Zero unknown zones. nt-k ringan is a genuine finding (0.637 below 0.689 floor).

### Known issue logged (not fixed here)
- `parser_v3.py` line 917: UnicodeEncodeError on Windows cp1252 terminal when printing
  warnings containing `α` character. CSV output is unaffected — cosmetic terminal only.
  Fix deferred.

### Pipeline note
- Kamiyanti and Frans CSVs/JSONs in `01_Data/` are stale for nutrient fields.
  Re-run pipeline on both PDFs to get correct nutrient zones.

### Files Modified
- `qrma-dashboard-v4.html` — FIX 1 + FIX 2
- `03_Scripts/mappings.json` — FIX 3

---

## 2026-05-30 — Build 1 Complete: Flask Microserver + v4 Dashboard

### Status: SHIPPED ✓

### What Was Built
- `03_Scripts/server.py` — Flask microserver, port 5000
- `qrma-dashboard-v4.html` — v3 base + PDF drop zone + Flask integration

### server.py — Implementation Details
- Path setup via `__file__` self-location (same pattern as `csv_exporter_v2.py`)
- Routes: `GET /` health check, `POST /upload` multipart PDF
- Pipeline: `parse_qrma_pdf()` → `export_dashboard_csv()` → `csv_to_json_payload()` → returns JSON
- CSV always written to `01_Data/csv/` as permanent audit trail — never bypassed
- Temp PDF deleted after processing (`finally` block)
- CORS enabled (localhost-only server)
- 50 MB upload limit
- Flask-CORS dependency added (`pip install flask-cors`)

### qrma-dashboard-v4.html — What Changed from v3
- 170 lines added, zero v3 lines removed or modified
- PDF drop zone modal (drag-and-drop + click to browse)
- "Import PDF" button in topbar between Import CSV and lang toggle
- Loading spinner during upload
- Server connection status indicator (green/amber)
- On success: JSON passed directly to `QRMAImporter.importFromPayload()`
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
  Click "Import PDF" → drop PDF → dashboard loads automatically
```

### Files Created
- `03_Scripts/server.py`
- `qrma-dashboard-v4.html`

### Next: Build 2 — HRV Phase 1
- `03_Scripts/hrv-engine.js`
- `qrma-dashboard-v4.html` updated with HRV sidebar module + per-module panels

---

## 2026-05-30 — Architecture & Design Session: HRV Integration + Flask Microserver

### Session Type
Design decisions and architecture planning. No code written. Baseline for Build 1 and Build 2.

### Decisions Locked

#### HRV Integration Architecture
- HRV is its own domain with its own vocabulary and rules. Never maps to QRMA zone words.
- ALI (Autonomic Load Index) computed from raw HRV values. Native bands: Very Low / Low / Adaptive / High (0–24 / 25–49 / 50–74 / 75–100). Color translation only at render time.
- HRV never alters any of the 7 QRMA module scores.
- HRV renders independently — does not gate on QRMA alert state.
- Missing HRV = Option A empty state. Dashboard behaves exactly as today.
- HRV logic lives in a dedicated `03_Scripts/hrv-engine.js` module (mirrors `zone-scoring.js` pattern).

#### HRV Display Design
- **HRV Sidebar Module** (dedicated page): Autonomic Status Card → ALI-gated Micro-Protocol Stack → Reading Provenance + Disclaimer.
- **Per-module top panel** (on all 7 modules): 2-line strip — vitals (RMSSD · ALI · HR · Quality) + one module-specific context sentence. No micro-protocols in module panels.
- **Micro-protocol stack is ALI-gated** (show only current, hide deferred):
  - Very Low → V1, V3, V4
  - Low → V1, V2, V3, V4
  - Adaptive → V1, V2, V3, V4, V5
  - High → V2, V4, V5
- Each protocol card shows: name, timing, technique, duration. Plain language. No jargon.

#### HRV Data Contract
- `hrvState` is session-only in-memory (no database, no localStorage in Phase 1).
- 14 fields: 9 stored (provenance + quality gate + raw metrics) + 5 derived (computed by hrv-engine.js).
- Quality gate uses 3 distinct fields (`durationSec`, `artifactPct`, `qualityFlag`) — not a single boolean.
- `baselineStatus` and `lnRmssd` included now for Phase 3 upgrade path (baseline-aware HRV).
- HRV data entry: manual input form in HRV sidebar module (RMSSD, HR, SDNN, duration, artifact%, device, protocol).

#### Flask Microserver
- Build 1 = Flask microserver (`03_Scripts/server.py`) + `qrma-dashboard-v4.html`.
- Full pipeline preserved: PDF → `csv_exporter_v2.py` → CSV → `json_exporter.py` → JSON → browser.
- CSV kept as audit trail. Never bypassed.
- Terminal used only once to start server (`python server.py`). All subsequent sessions via browser.
- Dashboard remains fully functional without the server running.

#### Build Sequence Confirmed
```
Build 1 — server.py + qrma-dashboard-v4.html        ← COMPLETE
Build 2 — hrv-engine.js + qrma-dashboard-v4.html    ← NEXT
```

### Still Deferred
- buildAction() zone gates
- sk-tw direction ambiguity
- Debug log removal before production release
- Parameter name translation (ID/EN display labels)
- Manual input form for mt-bmi and mt-wc
- PyWebView wrapper (Option C desktop packaging) — after Flask is stable
- parser_v3.py UnicodeEncodeError on Windows cp1252 (α character in warning strings)

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
- getBadge('unknown') fallback: returns '—' instead of blank

### CSS Fixes
- Pillar bar label font size increased, colour set to --txt
- Confirmatory test column font size increased
- Hint text and reference range text set to --txt (full black light mode)
- Alert description .aald set to --txt

### Baseline Corrections
- tx-pb corrected to normal (0.144 within PDF range 0.052-0.643)
  Previous baseline claiming sedang was incorrect
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
