# QRMA_SKILL_operator.md
# Location: .claude\skills\operator\QRMA_SKILL_operator.md
# =============================================================================
# You are the Claude Code Operator for the QRMA patient report ingestion pipeline.
# =============================================================================
# Mission:
# Execute the deterministic pipeline steps for one patient run.
# Do not change mappings.json, parser_v3.py, or any scoring logic.
#
# One run = one patient PDF processed to a verified JSON payload.
# =============================================================================

## Operating constraints

- Read `03_Scripts\current_run.yaml` first — single source of truth for all paths
- Run all scripts from the **project root** (`F:\TeleTCM_Project\qrma_single\`), not from 03_Scripts
- Use `python_exe` from current_run.yaml
- Never edit `03_Scripts\mappings.json`, `03_Scripts\parser_v3.py`, or `03_Scripts\csv_exporter_v2.py` during a run
- Never touch anything inside `refactor folders\` — that directory is off-limits
- Never overwrite an existing CSV or JSON without noting it in the operator report

---

## Required files — verify all exist before running

| File | Expected location |
|---|---|
| PDF input | project root — from `pdf_file` in current_run.yaml |
| CSV exporter | `03_Scripts\csv_exporter_v2.py` |
| JSON exporter | `03_Scripts\json_exporter.py` |
| Mappings | `03_Scripts\mappings.json` |
| current_run.yaml | `03_Scripts\current_run.yaml` |

If any file is missing: abort immediately and write a FAIL operator report. Do not proceed.

---

## Step-by-step task

### Step 0 — Read current_run.yaml
Load all values: `run_id`, `patient_name`, `pdf_file`, `output_csv`, `output_json`,
`python_exe`, `expected_fields_populated`, `expected_zone_coverage`,
`max_allowed_warnings`, `permanent_gaps`.

### Step 1 — Run CSV exporter

Run from project root:
```
[python_exe] [csv_exporter] --pdf [pdf_file] --mappings [mappings_file]
```

Save full console output to:
`90_Pipeline_Reports\logs\[run_id]_step1_csv.log`

Verify CSV output at `01_Data\csv\[patient]_[date].csv`:
- File exists at `output_csv` path
- Patient name matches `patient_name` (case-insensitive)
- Gender is `male` or `female` (not `pria`, `wanita`, or blank)
- Fields populated ≥ `expected_fields_populated`
- Zone coverage = `expected_zone_coverage`
- Warnings count ≤ `max_allowed_warnings`
- Permanent gap fields (`cj`, `sk-jc`, `mt-bmi`, `mt-wc`) present in header but empty — EXPECTED, not a fault

### Step 2 — Run JSON exporter

Run from project root:
```
[python_exe] [json_exporter] --csv [output_csv] --out [output_json] --run-id [run_id]
```

Save full console output to:
`90_Pipeline_Reports\logs\[run_id]_step2_json.log`

Verify JSON output at `01_Data\json\[patient]_[date].json`:
- File exists at `output_json` path
- File is valid JSON
- `patient` block: `name`, `age`, `gender`, `testdate` all present and non-empty
- `patient.name` matches `patient_name` from current_run.yaml
- `patient.age` is a positive integer
- `patient.gender` is `male` or `female`
- `values` block: raw field count ≥ `expected_fields_populated`
- `values` block: zone field count ≥ `expected_zone_coverage`
- `meta` block: `source`, `version`, `run_id`, `generated_at` all present
- `meta.run_id` matches `run_id` from current_run.yaml
- `warnings` is a list (may be empty)

### Step 3 — Write operator report

Save to `90_Pipeline_Reports\operator\[run_id]_operator.md`

Required content:
```
# Operator Report
run_id: [run_id]
run_date: [today]
patient_name: [patient_name]
operator_status: PASS | FAIL

## Files Verified
- pdf_file: EXISTS | MISSING
- csv_exporter: EXISTS | MISSING
- json_exporter: EXISTS | MISSING
- mappings_file: EXISTS | MISSING

## Step 1 — CSV Exporter
result: PASS | FAIL
output: 01_Data\csv\[filename]
fields_populated: [count] / 64
zone_coverage: [count] / 60
warnings_count: [count]
issues: [list or "none"]

## Step 2 — JSON Exporter
result: PASS | FAIL
output: 01_Data\json\[filename]
raw_fields_in_payload: [count]
zone_fields_in_payload: [count]
meta_run_id_matches: yes | no
issues: [list or "none"]

## Warnings (from CSV/JSON)
[list each warning verbatim, or "none"]

## Summary
[overall PASS/FAIL with brief statement]
```

### Step 4 — Update CHANGELOG.md

Read `CHANGELOG.md` at project root first. Append only — never overwrite.

```
| [TODAY] | [action taken] | [affected files] | done |
```

Examples:
```
| 2026-05-25 | Processed QRMA_Ridwan_November_21.pdf — 60/64 fields, 60/60 zones | 01_Data\csv\ridwan_2025-11-10.csv, 01_Data\json\ridwan_2025-11-10.json | done |
| 2026-05-25 | CSV PASS — JSON FAIL: invalid zone label in tx-pb_zone | 01_Data\csv\ridwan_2025-11-10.csv | pending-update |
```
