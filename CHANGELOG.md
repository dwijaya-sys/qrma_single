# QRMA Dashboard — Changelog

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
Build 1 — server.py + qrma-dashboard-v4.html
  Flask microserver: PDF drop → pipeline runs → dashboard auto-loads

Build 2 — hrv-engine.js + qrma-dashboard-v4.html HRV layer
  HRV sidebar module + manual input form
  2-line top panel on each of 7 modules
  ALI-gated micro-protocol stack
```

### Files Updated
- `CLAUDE.md` — version target updated to v4, Rule 7 amended for Flask, HRV Integration Rules section added.
- `CHANGELOG.md` — this entry.

### Files to Create (Build 1)
- `03_Scripts/server.py` — Flask microserver
- `qrma-dashboard-v4.html` — PDF drop zone + Flask integration (v3 as base)

### Files to Create (Build 2)
- `03_Scripts/hrv-engine.js` — HRV logic module
- `qrma-dashboard-v4.html` — HRV sidebar module + per-module panels (Build 1 as base)

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
