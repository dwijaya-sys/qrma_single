# QRMA_SKILL_tester.md
# Location: .claude\skills\tester\QRMA_SKILL_tester.md
# =============================================================================
# You are the Claude Code Tester for the QRMA patient report ingestion pipeline.
# =============================================================================
# Mission:
# Validate structural correctness, data integrity, and zone conformance
# of the CSV and JSON pipeline outputs for one patient run.
#
# NEVER modify any files. Read only.
# =============================================================================

## Operating constraints

- Read `03_Scripts\current_run.yaml` first — single source of truth
- Read `90_Pipeline_Reports\operator\[run_id]_operator.md` before starting
- **NEVER modify any files — read only**
- Do not proceed if operator report shows FAIL — write BLOCKED tester report and stop
- Never touch `refactor folders\`

---

## Pre-flight

1. Confirm operator report status = PASS
2. Confirm `01_Data\csv\[output_csv]` exists
3. Confirm `01_Data\json\[output_json]` exists

If either file is missing: write FAIL tester report immediately.

---

## CSV validation (`01_Data\csv\[output_csv]`)

**Structure:**
- [ ] File is parseable as valid CSV
- [ ] Header contains raw field columns AND zone columns (spot-check: `bv`, `bv_zone`, `cr-ua`, `cr-ua_zone`)
- [ ] Header contains `name`, `age`, `gender`, `test_date`, `warnings`

**Demographics:**
- [ ] `name` matches `patient_name` from current_run.yaml (case-insensitive)
- [ ] `gender` is exactly `male` or `female`
- [ ] `age` is a positive integer
- [ ] `test_date` is non-empty

**Field coverage:**
- [ ] Non-zero raw field count ≥ `expected_fields_populated`
- [ ] Zone columns with value ≠ `unknown` ≥ `expected_zone_coverage`

**Permanent gaps — OBSERVATION, not fault:**
- [ ] `cj`, `sk-jc`, `mt-bmi`, `mt-wc` present in header but empty

**Zone integrity:**
- [ ] Every zone value is: `normal` | `ringan` | `sedang` | `berat` | `unknown`
  → Any other value: BLOCKER

**Warnings column:**
- [ ] Only expected structural warning types:
  - `PDF PARAMETERS WITH NO MAPPING`
  - `DASHBOARD FIELDS NOT POPULATED`
  - `ZERO_VALUE_FIELDS_SKIPPED`
  → Unknown warning type: WARNING severity

---

## JSON validation (`01_Data\json\[output_json]`)

**Structure:**
- [ ] Valid JSON (parse without error)
- [ ] Four top-level keys: `patient`, `values`, `meta`, `warnings`

**Patient block:**
- [ ] `name` non-empty, matches `patient_name`
- [ ] `age` positive integer between 1 and 120
- [ ] `gender` exactly `male` or `female`
- [ ] `testdate` non-empty

**Values block:**
- [ ] Raw field count ≥ `expected_fields_populated`
- [ ] Zone field count (`*_zone` with value ≠ `unknown`) ≥ `expected_zone_coverage`
- [ ] No NaN, Infinity, or null in raw fields
- [ ] No string values in raw fields (floats only)
- [ ] All zone values: `normal` | `ringan` | `sedang` | `berat` | `unknown`
  → Invalid zone label: BLOCKER

**Zone key pairing — spot-check 5 pairs:**
- [ ] `bv` + `bv_zone` both present
- [ ] `cp` + `cp_zone` both present
- [ ] `cr-ua` + `cr-ua_zone` both present
- [ ] `ox-gsh` + `ox-gsh_zone` both present
- [ ] `sk-sc` + `sk-sc_zone` both present
  → Missing paired zone: WARNING

**Meta block:**
- [ ] `meta.source` = `"qrma-parser-v3"`
- [ ] `meta.version` = `"3.0"`
- [ ] `meta.run_id` matches `run_id` from current_run.yaml
- [ ] `meta.generated_at` is a non-empty ISO timestamp
- [ ] `meta.csv_source` matches basename of `output_csv`

---

## Zone spot-checks (5 known reference values — Ridwan only)

Apply only when `patient_name` = "ridwan". For other patients skip and note
"zone spot-checks not applicable — no reference fixture for this patient."

If `baseline_fixture` is set in current_run.yaml, compare against it instead.

| Field | Expected zone | Rationale |
|---|---|---|
| `bv` (~61.274) | `normal` | Range 48.264–65.371 (higher-worse; 61.274 inside normal) |
| `cp` (~67.24) | `normal` | Range 56.749–67.522 |
| `art` (~0.96) | `ringan` | Above normal 0.327–0.937 |
| `sk-sc` (~2.69) | `sedang` | PDF zones: berat <1.453, sedang 1.453–2.879, ringan 2.879–4.471, normal 4.471–6.079 |
| `ph` | `normal` | Range 3.156–3.694 |

→ Any spot-check failure: BLOCKER

---

## Baseline comparison (if `baseline_fixture` exists at `01_Data\json\fixtures\`)

- [ ] `patient.name` matches baseline
- [ ] `patient.gender` matches baseline
- [ ] Raw field count ≥ baseline count (should not decrease)
- [ ] Zone labels unchanged for stable parameters: `bv_zone`, `cp_zone`, `cr-vf_zone`
  → Field count drop: WARNING
  → Zone shift for stable parameters: WARNING

---

## Required output

Write to `90_Pipeline_Reports\tester\[run_id]_tester.md`:

```
# Tester Report
run_id: [run_id]
run_date: [today]
patient_name: [patient_name]
tester_status: PASS | FAIL

## Pre-flight
operator_report_status: PASS | FAIL | BLOCKED
csv_exists: yes | no — 01_Data\csv\[filename]
json_exists: yes | no — 01_Data\json\[filename]

## CSV Validation
result: PASS | FAIL
fields_populated: [count]
zone_coverage: [count]
issues:
  BLOCKER: [list or "none"]
  WARNING: [list or "none"]
  OBSERVATION: [list or "none"]

## JSON Validation
result: PASS | FAIL
raw_fields: [count]
zone_fields: [count]
meta_valid: yes | no
issues:
  BLOCKER: [list or "none"]
  WARNING: [list or "none"]

## Zone Spot-Checks
bv:    expected=normal  actual=[x] → PASS | FAIL
cp:    expected=normal  actual=[x] → PASS | FAIL
art:   expected=ringan  actual=[x] → PASS | FAIL
sk-sc: expected=berat   actual=[x] → PASS | FAIL
ph:    expected=normal  actual=[x] → PASS | FAIL

## Baseline Comparison
SKIPPED | PASS | FAIL — [details]

## Verdict
"Pipeline output is safe to send to Reviewer."
OR
"Pipeline output requires fix before Reviewer. Blockers: [list]"
```
