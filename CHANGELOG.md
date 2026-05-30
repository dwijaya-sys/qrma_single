# QRMA Dashboard — Changelog

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
