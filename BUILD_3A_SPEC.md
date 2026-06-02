# Build 3a — Batch Pipeline Spec
**Status:** Ready to build  
**Date:** 2026-06-02 → amended 2026-06-02 (body comp scoring spec addendum added)  
**Depends on:** Build 2 complete (hrv-engine.js + qrma-dashboard-v4.html) ✓  
**Does NOT modify:** parser_v3.py, csv_exporter_v2.py, hrv-engine.js, server.py, any existing HTML

---

## 1. WHAT BUILD 3A DELIVERS

Three new files. Nothing existing is touched.

```
03_Scripts/
  hrv_batch_reader.py       NEW — reads hrv_batch.csv → lookup dict
  batch_runner.py           NEW — loops PDFs + merges HRV → writes session JSONs

02_Templates/
  hrv_batch_template.csv    NEW — operator fills this per screening day
```

**End result for operator:**

```
Screening day prep (once per client, ~30 sec each):
  Fill one row in hrv_batch_template.csv per client

Batch run (terminal, once):
  python 03_Scripts\batch_runner.py

Output — one session JSON per client in 01_Data\sessions\:
  session_ridwan_2026-06-01.json
  session_kamiyanti_2026-06-01.json
  session_frans_2026-06-01.json
  ...

These session JSONs feed directly into the dashboard batch queue (Build 3b).
```

---

## 2. FOLDER STRUCTURE

### Input layout (operator prepares this)

```
F:\TeleTCM_Project\qrma_single\
│
├── 02_Batch\
│   ├── 2026-06-01\                   ← one folder per screening day
│   │   ├── ridwan_qrma.pdf
│   │   ├── kamiyanti_qrma.pdf
│   │   ├── frans_qrma.pdf
│   │   └── hrv_batch.csv             ← HRV data for this day's batch
│   │
│   └── 2026-06-08\
│       ├── ...
│       └── hrv_batch.csv
│
├── 01_Data\
│   ├── csv\                          ← existing, one CSV per client (audit trail)
│   ├── json\                         ← existing, one JSON per client (QRMA only)
│   └── sessions\                     ← NEW — merged session JSONs (QRMA + HRV)
│
└── 03_Scripts\
    ├── batch_runner.py               ← NEW
    ├── hrv_batch_reader.py           ← NEW
    └── ...existing scripts
```

### Why a batch folder per day

One screening day = one coherent set. PDFs and HRV CSV travel together. No confusion about which HRV row belongs to which PDF when running old batches again.

---

## 3. HRV BATCH CSV FORMAT

### File: `02_Batch\{date}\hrv_batch.csv`

```
client_id, name,       date,        rmssd, meanHr, sdnn, durationSec, artifactPct, device,    protocol,         bmi,  waist_cm, notes
rid001,    ridwan,     2026-06-01,  28,    74,     42,   300,         2.1,         Polar H10, supine_rest_5min, ,     ,
kam001,    kamiyanti,  2026-06-01,  41,    68,     55,   300,         1.8,         Polar H10, supine_rest_5min, 22.5, 72,
fra001,    frans,      2026-06-01,  19,    82,     31,   300,         3.2,         Polar H10, supine_rest_5min, ,     ,
```

### Column definitions

| Column | Required | Type | Default if empty | Notes |
|---|---|---|---|---|
| `client_id` | **yes** | string | — | Primary join key. Must match PDF filename prefix. e.g. `rid001` → matches `rid001_qrma.pdf` |
| `name` | yes | string | — | Fallback match if client_id match fails. Compared against PDF `demo["name"]`, case-insensitive |
| `date` | yes | YYYY-MM-DD | — | Must match the screening batch date |
| `rmssd` | **yes** | float | — | Core HRV metric in ms |
| `meanHr` | **yes** | float | — | Resting heart rate in bpm |
| `sdnn` | no | float | `""` → null | Optional. Leave blank if not available |
| `durationSec` | no | int | `300` | Recording duration in seconds |
| `artifactPct` | no | float | `0` | Artifact percentage 0–100 |
| `device` | no | string | `"Polar H10"` | Device name for provenance |
| `protocol` | no | string | `"supine_rest_5min"` | Dropdown value: `supine_rest_5min`, `seated_rest_3min`, `post_exercise_5min`, `other` |
| `bmi` | no | float | `""` → null | ~~Moved to `body_comp_batch.csv`~~ — do not add to HRV CSV. See Section 13. |
| `waist_cm` | no | float | `""` → null | ~~Moved to `body_comp_batch.csv`~~ — do not add to HRV CSV. See Section 13. |
| `notes` | no | string | `""` | Free text, carried into session JSON meta only |

### Matching rules (in priority order)

1. **client_id match** — PDF filename starts with `client_id` (case-insensitive). `rid001_qrma.pdf` matches `rid001`.
2. **name match** — `demo["name"]` from parsed PDF lowercased and stripped matches `name` column lowercased and stripped. `"Ridwan Maulana"` matches `"ridwan"` if first-word match enabled (see `--strict-name` flag below).
3. **No match** — session JSON is written with no HRV block. Batch continues. Warning logged.

### Why client_id is the primary key

PDF names are inconsistent in practice (`QRMA_Ridwan_November_21.pdf`, `ridwan_nov.pdf`, `Ridwan.pdf` — all valid). The `client_id` in the filename (`rid001_qrma.pdf`) is operator-controlled and deterministic. It decouples matching from whatever naming convention the QRMA device outputs.

**PDF naming convention for Build 3a:**
```
{client_id}_qrma.pdf
e.g.  rid001_qrma.pdf
      kam001_qrma.pdf
```

---

## 4. hrv_batch_reader.py

### Location: `03_Scripts\hrv_batch_reader.py`

### Responsibilities
- Read `hrv_batch.csv`
- Validate required columns present
- Apply safe defaults to optional fields
- Return a lookup dict keyed by `client_id` (primary) and `name` (secondary)
- Never raise on missing optional fields — log warnings only

### Public API

```python
def load_hrv_batch(csv_path: str) -> dict:
    """
    Reads hrv_batch.csv and returns a lookup dict.

    Returns:
        {
          "by_id":   { "rid001": hrv_record, ... },
          "by_name": { "ridwan": hrv_record, ... }
        }

    hrv_record shape:
        {
          "client_id":    "rid001",
          "name":         "ridwan",
          "date":         "2026-06-01",
          "rmssd":        28.0,
          "meanHr":       74.0,
          "sdnn":         42.0,        # None if blank
          "durationSec":  300,
          "artifactPct":  2.1,
          "device":       "Polar H10",
          "protocol":     "supine_rest_5min",
          "bmi":          None,        # None if blank
          "waist_cm":     None,        # None if blank
          "notes":        ""
        }
    """
```

```python
def lookup_hrv(hrv_data: dict, client_id: str, name: str,
               strict_name: bool = False) -> tuple:
    """
    Find the matching HRV record for a client.

    Match order:
      1. by_id[client_id.lower()]
      2. by_name[name.lower()]  (full name)
      3. by_name[name.split()[0].lower()]  (first word) — only if strict_name=False

    Returns:
      (hrv_record, match_type)   where match_type is "id" | "name" | "first_name" | None
    """
```

### Import order (Windows rule — must follow)

```python
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))   # FIRST
import sys
sys.path.insert(0, SCRIPT_DIR)                             # SECOND
import csv, os                                             # stdlib only — no project imports needed
```

---

## 5. batch_runner.py

### Location: `03_Scripts\batch_runner.py`

### Responsibilities
- Accept a batch folder path as CLI argument
- Discover all `*_qrma.pdf` files in that folder
- Run the existing QRMA pipeline per PDF (reuses `parse_qrma_pdf`, `load_mappings`, `export_dashboard_csv` from `parser_v3`)
- Run `json_exporter` to get QRMA JSON payload
- Look up HRV record from `hrv_batch.csv` in same folder
- Merge HRV into session JSON
- Write `01_Data\sessions\session_{client_id}_{date}.json`
- Print a per-client status line and a final summary

### CLI interface

```
python 03_Scripts\batch_runner.py 02_Batch\2026-06-01
```

Optional flags:
```
--dry-run          Parse and validate all inputs, write nothing
--skip-hrv         Skip HRV merge entirely (QRMA-only session JSONs)
--strict-name      Disable first-word fallback in name matching
--overwrite        Re-process clients whose session JSON already exists
                   (default: skip existing)
```

### Import order

```python
SCRIPT_DIR   = os.path.dirname(os.path.abspath(__file__))   # FIRST
PROJECT_ROOT = os.path.dirname(SCRIPT_DIR)                   # SECOND
import sys
sys.path.insert(0, SCRIPT_DIR)                               # THIRD
from parser_v3 import parse_qrma_pdf, load_mappings, export_dashboard_csv
from hrv_batch_reader import load_hrv_batch, lookup_hrv      # FOURTH — after path set
```

### Core loop (pseudocode)

```python
def run_batch(batch_dir, flags):

    # 1. Load HRV lookup
    hrv_csv = os.path.join(batch_dir, "hrv_batch.csv")
    hrv_data = load_hrv_batch(hrv_csv) if os.path.exists(hrv_csv) else None
    if hrv_data is None:
        print("[!] No hrv_batch.csv found — sessions will have no HRV block")

    # 2. Discover PDFs
    pdfs = sorted(glob(os.path.join(batch_dir, "*_qrma.pdf")))
    print(f"[batch] Found {len(pdfs)} PDF(s) in {batch_dir}")

    results = []

    for pdf_path in pdfs:
        client_id = extract_client_id(pdf_path)   # "rid001" from "rid001_qrma.pdf"
        print(f"\n[{client_id}] Processing {os.path.basename(pdf_path)}")

        # 3. Skip if session already exists and --overwrite not set
        session_path = build_session_path(client_id)
        if os.path.exists(session_path) and not flags.overwrite:
            print(f"  [skip] Session already exists: {session_path}")
            results.append({"client_id": client_id, "status": "skipped"})
            continue

        # 4. QRMA pipeline (existing functions — unchanged)
        try:
            parsed     = parse_qrma_pdf(pdf_path)
            mappings   = load_mappings(MAPPINGS_PATH)
            csv_path   = build_csv_path(client_id, parsed)
            export_dashboard_csv(parsed, mappings, csv_path)       # writes audit CSV
            qrma_json  = csv_to_json_payload(csv_path)             # existing json_exporter
        except Exception as e:
            print(f"  [ERROR] QRMA pipeline failed: {e}")
            results.append({"client_id": client_id, "status": "error", "reason": str(e)})
            continue

        # 5. HRV merge
        hrv_block = None
        hrv_match = "none"
        if hrv_data and not flags.skip_hrv:
            hrv_record, hrv_match = lookup_hrv(
                hrv_data,
                client_id,
                parsed["demographics"]["name"],
                strict_name=flags.strict_name
            )
            if hrv_record:
                hrv_block = build_hrv_block(hrv_record)
                print(f"  [hrv]  Matched via {hrv_match}: "
                      f"RMSSD={hrv_record['rmssd']} HR={hrv_record['meanHr']}")
            else:
                print(f"  [hrv]  No match found — session will have no HRV block")

        # 6. Build session JSON
        session = build_session_json(qrma_json, hrv_block, parsed["demographics"])

        # 7. Write session JSON
        if not flags.dry_run:
            write_session_json(session, session_path)
            print(f"  [ok]   Session written: {session_path}")

        results.append({
            "client_id": client_id,
            "status":    "ok",
            "hrv":       hrv_match,
            "fields":    count_populated_fields(qrma_json)
        })

    # 8. Summary
    print_summary(results)
```

### build_hrv_block() — maps CSV row → hrv block in session JSON

```python
def build_hrv_block(hrv_record: dict) -> dict:
    """
    Converts an hrv_record from hrv_batch_reader into the
    session JSON hrv block shape that importFromPayload() expects.
    Matches the hrvState contract from hrv-engine.js.
    """
    return {
        "present":      True,
        "source":       "manual_csv_batch",
        "device":       hrv_record["device"],
        "protocol":     hrv_record["protocol"],
        "readingDate":  hrv_record["date"],
        "durationSec":  hrv_record["durationSec"],
        "artifactPct":  hrv_record["artifactPct"],
        "rmssd":        hrv_record["rmssd"],
        "meanHr":       hrv_record["meanHr"],
        "sdnn":         hrv_record["sdnn"],    # None is valid
        "notes":        hrv_record["notes"]
        # Derived fields (autonomicLoadIndex, rmssdBand, etc.)
        # are computed by hrv-engine.js on import — not pre-computed here
    }
```

### build_session_json() — assembles final output

```python
def build_session_json(qrma_json: dict, hrv_block: dict | None,
                       demographics: dict) -> dict:
    """
    Assembles the final session JSON consumed by importFromPayload().

    Shape contract (importer.js expects):
      {
        "patient":  { name, age, gender, testdate },
        "values":   { field_id: value, field_id_zone: zone, ... },
        "meta":     { parser_version, batch_run, ... },
        "warnings": [...],
        "hrv":      { ...hrv_block } | null
      }

    The "hrv" key is NEW — importFromPayload() must be updated in Build 3b
    to detect this key and call ingestHrv() programmatically.
    The key is safe to include now; current importFromPayload() will ignore it.
    """
    session = dict(qrma_json)   # copy — never mutate the original
    session["hrv"] = hrv_block  # None if no HRV match

    # NOTE: mt-bmi, mt-wc and all bc-* fields are NO LONGER injected from
    # hrv_batch.csv. They come from body_comp_batch.csv (Build 3c) or manual
    # entry in the dashboard (Build 3b). Do not add bmi/waist injection here.

    session.setdefault("meta", {})
    session["meta"]["batch_run"]      = True
    session["meta"]["batch_date"]     = demographics.get("test_date", "")
    session["meta"]["parser_version"] = "parser_v3"

    return session
```

### print_summary() — terminal output after batch completes

```
==============================================================
 BATCH SUMMARY — 02_Batch\2026-06-01
==============================================================
 CLIENT        STATUS    HRV        FIELDS
 rid001        ok        id         62/64
 kam001        ok        name       62/64
 fra001        ok        first_name 62/64
 bud002        ok        none       62/64   [!] No HRV match
 error_005     ERROR     —          —       QRMA parse failed
--------------------------------------------------------------
 Total: 5 | OK: 4 | Skipped: 0 | Errors: 1
 Session JSONs written to: 01_Data\sessions\
==============================================================
```

---

## 6. SESSION JSON OUTPUT FORMAT

### File: `01_Data\sessions\session_{client_id}_{date}.json`

Full shape consumed by `importFromPayload()`:

```json
{
  "patient": {
    "name":     "Ridwan",
    "age":      "40",
    "gender":   "male",
    "testdate": "2025-11-10"
  },
  "values": {
    "bv":        3.484,
    "bv_zone":   "berat",
    "cp":        1.886,
    "cp_zone":   "ringan",
    "..."
  },
  "meta": {
    "parser_version": "parser_v3",
    "batch_run":      true,
    "batch_date":     "2026-06-01"
  },
  "warnings": [],
  "hrv": {
    "present":      true,
    "source":       "manual_csv_batch",
    "device":       "Polar H10",
    "protocol":     "supine_rest_5min",
    "readingDate":  "2026-06-01",
    "durationSec":  300,
    "artifactPct":  2.1,
    "rmssd":        28.0,
    "meanHr":       74.0,
    "sdnn":         42.0,
    "notes":        ""
  },
  "body_comp": null
}
```

`"hrv": null` when no HRV match.  
`"body_comp": null` in Build 3a — populated by manual input panel (Build 3b) or `body_comp_batch.csv` (Build 3c).  
Both keys are safe to include as null now — `importFromPayload()` will ignore null blocks.

---

## 7. WHAT BUILD 3B MUST ADD (not in scope here, documented for continuity)

### 7.1 HRV — importFromPayload() extension

`importFromPayload()` in `qrma-dashboard-v4.html` needs one addition:

```javascript
function importFromPayload(payload, warnings) {
    // ... existing QRMA import logic unchanged ...

    // NEW — detect hrv block and ingest programmatically
    if (payload.hrv && payload.hrv.present === true) {
        ingestHrvFromPayload(payload.hrv);   // new function in hrv-engine.js
    }

    // NEW — detect body_comp block and ingest programmatically
    if (payload.body_comp && payload.body_comp.present === true) {
        ingestBodyCompFromPayload(payload.body_comp);  // new, see §7.2
    }

    // ... rest unchanged ...
}
```

`ingestHrvFromPayload(hrvBlock)` in `hrv-engine.js`:
- Accepts the hrv block from session JSON
- Builds `hrvState` exactly as `ingestHrv()` does from form fields
- Calls `renderHrvPanel()`
- No DOM form interaction — reads from the object directly

This is a small, surgical addition. `ingestHrv()` (form-based) stays intact. Both paths coexist.

### 7.2 Body Composition — new components for Build 3b

**New: `bodyCompState` object** (mirrors `hrvState` pattern)

```javascript
let bodyCompState = null;   // null = no body comp this session

// When populated:
{
  present:         true,
  source:          "manual",         // "manual" | "csv_batch" | "inbody" | ...
  sourceDevice:    null,
  measurementDate: "2026-06-01",
  height_cm:       170,
  weight_kg:       71,
  bmi:             24.6,
  bmi_calc:        false,            // true = auto-calculated from h+w
  waist_cm:        88,
  bodyFatPct:      21.6,
  muscleMass_kg:   30.8,
  visceralFatLevel: null,
  vfScale:         null,
  bmr_kcal:        1617,
  whr:             null,
  notes:           ""
}
```

**New: `ingestBodyCompFromPayload(bcBlock)`** — called when session JSON has `body_comp` block  
**New: Manual input panel** — post-import supplementary card, Option A  
**New: Zone classification on entry** for `mt-bmi`, `mt-wc`, `bc-fat`, `bc-vf`  
**Updated: `cMt()`** — adaptive body comp scoring (full spec in `PROJECT_MAP.md §5.7`)  
**Updated: `calcAll()`** — re-fires after body comp Apply  
**Updated: `exportSessionReport()`** — include body comp block when `bodyCompState` is present

### 7.3 Body comp scoring spec reference

Full zone thresholds, field definitions, cMt() revised logic, and UI rules are in:
`PROJECT_MAP.md` → Section 5.7  
Do not re-derive or guess. Read §5.7 before writing any code for this section.

---

## 8. TEMPLATE FILE

### File: `02_Templates\hrv_batch_template.csv`

```csv
client_id,name,date,rmssd,meanHr,sdnn,durationSec,artifactPct,device,protocol,notes
rid001,ridwan,YYYY-MM-DD,,,,300,0,Polar H10,supine_rest_5min,
kam001,kamiyanti,YYYY-MM-DD,,,,300,0,Polar H10,supine_rest_5min,
```

Operator copies this template into `02_Batch\{date}\hrv_batch.csv` each screening day and fills in the required columns (`rmssd`, `meanHr`, `date`). Everything else has safe defaults.

> **Note:** `bmi` and `waist_cm` columns have been **removed** from this template. Body measurements travel in a separate `body_comp_batch.csv` (Build 3c). Keeping them separate avoids one bloated CSV and allows body comp measurements (which may happen on a different date or device) to be managed independently of HRV readings.

---

## 9. ERROR HANDLING RULES

| Scenario | Behaviour |
|---|---|
| PDF parse fails | Log error, skip client, continue batch |
| `hrv_batch.csv` missing | Warn once, run batch without HRV for all clients |
| HRV row missing for a client | Log per-client warning, write session JSON with `"hrv": null` |
| `rmssd` or `meanHr` blank in CSV row | Treat row as invalid, log warning, skip HRV for that client |
| `sdnn`, `artifactPct` blank | Use `None` / `0` — these are optional |
| Session JSON already exists | Skip (unless `--overwrite`) |
| Output directory missing | Create it (`os.makedirs(..., exist_ok=True)`) |

---

## 10. BUILD CHECKLIST

```
Python side (Build 3a — no dashboard changes):
  [ ] hrv_batch_reader.py — load_hrv_batch(), lookup_hrv()
  [ ] batch_runner.py — CLI, core loop, build_hrv_block(), build_session_json()
  [ ] 02_Templates/hrv_batch_template.csv
  [ ] Smoke test: 3 existing PDFs (Ridwan, Kamiyanti, Frans)
      with hrv_batch.csv → confirm 3 session JSONs written
  [ ] Smoke test --dry-run flag
  [ ] Smoke test missing hrv_batch.csv → QRMA-only sessions
  [ ] Smoke test missing HRV row for one client → null hrv block

Dashboard side (Build 3b — separate build):
  HRV:
  [ ] ingestHrvFromPayload() in hrv-engine.js
  [ ] importFromPayload() detects hrv block → calls ingestHrvFromPayload()

  Body Comp (scoring spec: PROJECT_MAP.md §5.7):
  [ ] bodyCompState object (session-only, no localStorage)
  [ ] Manual input panel — post-import supplementary card
  [ ] Auto-calc BMI from height + weight, lock with "calculated" badge
  [ ] Zone classification on entry: mt-bmi, mt-wc, bc-fat, bc-vf
  [ ] body_comp block written to session JSON on Apply
  [ ] ingestBodyCompFromPayload() for batch path
  [ ] importFromPayload() detects body_comp block → calls ingestBodyCompFromPayload()
  [ ] cMt() updated to adaptive scoring logic from PROJECT_MAP.md §5.7
  [ ] calcAll() re-fires after body comp Apply
  [ ] exportSessionReport() includes body comp block

  Batch queue:
  [ ] Batch queue UI in qrma-dashboard-v5.html
  [ ] Auto-export per session
```

---

## 11. FILES CHANGED / CREATED SUMMARY

| File | Action | Notes |
|---|---|---|
| `03_Scripts/hrv_batch_reader.py` | **CREATE** | New |
| `03_Scripts/batch_runner.py` | **CREATE** | New |
| `02_Templates/hrv_batch_template.csv` | **CREATE** | New |
| `03_Scripts/parser_v3.py` | **NO CHANGE** | |
| `03_Scripts/csv_exporter_v2.py` | **NO CHANGE** | |
| `03_Scripts/server.py` | **NO CHANGE** | |
| `03_Scripts/hrv-engine.js` | **NO CHANGE** | |
| `qrma-dashboard-v4.html` | **NO CHANGE** | |
| `03_Scripts/json_exporter.py` | **CALLED** — not modified | batch_runner imports its function |

---

## 12. HANDOVER NOTE FOR NEXT AI SESSION

Build 3a is **Python-only**. No dashboard files are touched.

The `"hrv"` and `"body_comp"` keys added to session JSON are forward-compatible — current `importFromPayload()` in v4 HTML will silently ignore null blocks. No breakage.

Build 3b is the dashboard half: body comp manual panel + cMt() rewrite + HRV ingest from payload + batch queue UI. Build 3b should be built **after** Build 3a is validated with real PDFs.

Read in this order before starting Build 3b:
1. `PROJECT_MAP.md` — current state, especially §5.7 (body comp scoring spec)
2. `BUILD_3A_SPEC.md` — this file, §7 (Build 3b contract)
3. `hrv-flask-session-handover.md` — HRV architecture rules
4. `CLAUDE_final.md` — working rules for HTML edits

---

## 13. BODY COMP BATCH PATH (Build 3c — deferred, spec here for continuity)

Body comp follows the same pattern as HRV — a separate CSV per batch day, merged by `batch_runner.py`.

### File: `02_Batch\{date}\body_comp_batch.csv`

```csv
client_id, name,       date,        height_cm, weight_kg, bmi,  waist_cm, body_fat_pct, muscle_mass_kg, visceral_fat, vf_scale,      bmr_kcal, notes
rid001,    ridwan,     2026-06-01,  170,       71,        24.6, 88,       21.6,         30.8,           ,             ,              1617,
kam001,    kamiyanti,  2026-06-01,  158,       54,        21.6, 72,       28.1,         23.2,           8,            inbody_1_20,   1312,
```

### Column rules

| Column | Required | Notes |
|---|---|---|
| `client_id` | yes | Primary join key — matches PDF filename prefix |
| `name` | yes | Fallback match |
| `date` | yes | Measurement date — may differ from QRMA screening date |
| `height_cm` | no | Used to auto-calc BMI if `bmi` blank |
| `weight_kg` | no | Used to auto-calc BMI if `bmi` blank |
| `bmi` | no | Direct entry takes priority over calculated |
| `waist_cm` | no | Asian IDF thresholds apply in zone classification |
| `body_fat_pct` | no | Gender-specific zones |
| `muscle_mass_kg` | no | Metadata only in Build 3c |
| `visceral_fat` | no | Device scale value |
| `vf_scale` | no | Required if `visceral_fat` present. e.g. `inbody_1_20` |
| `bmr_kcal` | no | Metadata only |
| `notes` | no | Free text |

### `build_body_comp_block()` — equivalent to `build_hrv_block()`

```python
def build_body_comp_block(bc_record: dict) -> dict:
    bmi = bc_record.get("bmi")
    bmi_calc = False
    if not bmi and bc_record.get("height_cm") and bc_record.get("weight_kg"):
        h = float(bc_record["height_cm"]) / 100
        bmi = round(float(bc_record["weight_kg"]) / (h * h), 1)
        bmi_calc = True

    return {
        "present":          True,
        "source":           "csv_batch",
        "sourceDevice":     None,
        "measurementDate":  bc_record["date"],
        "height_cm":        bc_record.get("height_cm") or None,
        "weight_kg":        bc_record.get("weight_kg") or None,
        "bmi":              bmi,
        "bmi_calc":         bmi_calc,
        "waist_cm":         bc_record.get("waist_cm") or None,
        "bodyFatPct":       bc_record.get("body_fat_pct") or None,
        "muscleMass_kg":    bc_record.get("muscle_mass_kg") or None,
        "visceralFatLevel": bc_record.get("visceral_fat") or None,
        "vfScale":          bc_record.get("vf_scale") or None,
        "bmr_kcal":         bc_record.get("bmr_kcal") or None,
        "whr":              None,   # computed by dashboard from waist + height
        "notes":            bc_record.get("notes", "")
    }
```

### Summary update for batch runner (Build 3c)

```
 CLIENT        STATUS    HRV        BODY_COMP  FIELDS
 rid001        ok        id         id         62/64
 kam001        ok        name       name       62/64
 fra001        ok        none       none       62/64
```
