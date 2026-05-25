# Tester Report
run_id: run_kamiyanti_20260525_final
run_date: 2026-05-25
patient_name: kamiyanti
tester_status: PASS

## Pre-flight
operator_report_status: PASS
csv_exists: yes — 01_Data\csv\kamiyanti_2025-11-11.csv
json_exists: yes — 01_Data\json\kamiyanti_2025-11-11.json

## CSV Validation
result: PASS
fields_populated: 60 / 64
zone_coverage: 60 / 60
issues:
  BLOCKER: none
  WARNING: none
  OBSERVATION:
    - cj: in header, empty — permanent gap (expected)
    - sk-jc: in header, empty — permanent gap (expected)
    - mt-bmi: in header, empty — permanent gap (expected)
    - mt-wc: in header, empty — permanent gap (expected)

Detail:
  - All structure spot-check headers present: bv, bv_zone, cr-ua, cr-ua_zone,
    name, age, gender, test_date, warnings ✓
  - Demographics: name=Kamiyanti (matches "kamiyanti", case-insensitive),
    gender=female, age=41, test_date=11/11/2025 09:06 ✓
  - No invalid zone labels (all values in: normal | ringan | sedang | berat | unknown) ✓
  - Warnings column: 2 entries, both expected structural types:
    [1] PDF PARAMETERS WITH NO MAPPING (170)
    [2] DASHBOARD FIELDS NOT POPULATED (4): cj | mt-bmi | mt-wc | sk-jc

## JSON Validation
result: PASS
raw_fields: 60
zone_fields: 64 (60 resolved, 4 unknown — permanent gaps)
meta_valid: yes
issues:
  BLOCKER: none
  WARNING: none

Detail:
  - top-level keys: patient, values, meta, warnings ✓
  - patient.name: Kamiyanti | age: 41 (int, in range 1–120) | gender: female | testdate: 11/11/2025 09:06 ✓
  - no NaN / Infinity / null in raw fields ✓
  - no string values in raw fields (all floats) ✓
  - no invalid zone labels ✓
  - zone pair spot-checks: all 5 pairs present and valid:
      bv/bv_zone:       54.597 / normal  ✓
      cp/cp_zone:       65.509 / normal  ✓
      cr-ua/cr-ua_zone:  1.531 / normal  ✓
      ox-gsh/ox-gsh_zone: 1.279 / normal ✓
      sk-sc/sk-sc_zone:  3.862 / ringan  ✓
  - meta.source: qrma-parser-v3 ✓
  - meta.version: 3.0 ✓
  - meta.run_id: run_kamiyanti_20260525_final ✓
  - meta.generated_at: 2026-05-25T20:28:00.143813 ✓
  - meta.csv_source: kamiyanti_2025-11-11.csv ✓
  - warnings: list, count=2 ✓

## Zone Spot-Checks
SKIPPED — zone spot-checks not applicable — no reference fixture for this patient.
patient_name is "kamiyanti"; reference values defined for "ridwan" only.

Observed values for Reviewer context (no pass/fail applied):
  bv:    54.597 → normal
  cp:    65.509 → normal
  sk-sc:  3.862 → ringan  (in range 2.879–4.471 per Ridwan zone table)
  bv and cp within expected normal ranges; sk-sc in ringan range (vs sedang for Ridwan)

## Baseline Comparison
SKIPPED — no baseline fixture found at 01_Data\json\fixtures\kamiyanti_2025-11-11.json.
First run for this patient. Reviewer should promote approved JSON to fixtures\ after approval.

## Verdict
Pipeline output is safe to send to Reviewer.

All structural, demographic, zone-integrity, and key-pairing checks passed.
No blockers, no warnings. Zone spot-checks and baseline comparison both skipped
as expected for a first-run new patient with no established fixture.
