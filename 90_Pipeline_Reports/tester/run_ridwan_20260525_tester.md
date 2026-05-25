# Tester Report
run_id: run_ridwan_20260525_final
run_date: 2026-05-25
patient_name: ridwan
tester_status: PASS

## Pre-flight
operator_report_status: PASS
csv_exists: yes — 01_Data\csv\ridwan_2025-11-10.csv
json_exists: yes — 01_Data\json\ridwan_2025-11-10.json

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
  - Demographics: name=ridwan, gender=male, age=40, test_date=10/11/2025 17:01 ✓
  - No invalid zone labels (all values in: normal | ringan | sedang | berat | unknown) ✓
  - Warnings column: 2 entries, both expected structural types:
    [1] PDF PARAMETERS WITH NO MAPPING (161)
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
  - patient.name: ridwan | age: 40 (int) | gender: male | testdate: 10/11/2025 17:01 ✓
  - no NaN / Infinity / null in raw fields ✓
  - no string values in raw fields (all floats) ✓
  - no invalid zone labels ✓
  - zone pair spot-checks: all 5 pairs present and valid
    bv/bv_zone: 61.274/normal ✓
    cp/cp_zone: 67.24/normal ✓
    cr-ua/cr-ua_zone: 1.927/normal ✓
    ox-gsh/ox-gsh_zone: 1.03/normal ✓
    sk-sc/sk-sc_zone: 2.69/sedang ✓
  - meta.source: qrma-parser-v3 ✓
  - meta.version: 3.0 ✓
  - meta.run_id: run_ridwan_20260525_final ✓
  - meta.generated_at: 2026-05-25T20:00:58.854790 ✓
  - meta.csv_source: ridwan_2025-11-10.csv ✓
  - warnings: list, count=2 ✓

## Zone Spot-Checks
bv:    expected=normal  actual=normal  → PASS  (raw: 61.274)
cp:    expected=normal  actual=normal  → PASS  (raw: 67.24)
art:   expected=ringan  actual=ringan  → PASS  (raw: 0.96)
sk-sc: expected=sedang  actual=sedang  → PASS  (raw: 2.69)
ph:    expected=normal  actual=normal  → PASS  (raw: 3.656)

All 5 spot-checks pass against the updated skill reference table.
bv is now correctly zoned as normal (was berat in prior run — zone fix confirmed).

## Baseline Comparison
PASS

  fixture: 01_Data\json\fixtures\ridwan_2025-11-10.json
  patient.name match:   True (ridwan = ridwan) ✓
  patient.gender match: True (male = male) ✓
  raw field count: baseline=60, current=60 — no decrease ✓
  bv_zone:    baseline=normal, current=normal → MATCH ✓
  cp_zone:    baseline=normal, current=normal → MATCH ✓
  cr-vf_zone: baseline=normal, current=normal → MATCH ✓

  Note: Baseline fixture now reflects corrected zones (bv=normal). Fixture is
  consistent with this run's output, confirming the zone fix is stable.

## Verdict
Pipeline output is safe to send to Reviewer.

All structural, demographic, zone-integrity, zone spot-check, and baseline
consistency checks passed. No blockers, no warnings. The bv zone direction
issue identified in the previous Reviewer cycle has been resolved.
