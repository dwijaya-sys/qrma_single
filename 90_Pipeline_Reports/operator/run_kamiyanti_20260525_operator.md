# Operator Report
run_id: run_kamiyanti_20260525_final
run_date: 2026-05-25
patient_name: kamiyanti
operator_status: PASS

## Files Verified
- pdf_file: EXISTS — Kamiyanti QRMA November.pdf
- csv_exporter: EXISTS — 03_Scripts\csv_exporter_v2.py
- json_exporter: EXISTS — 03_Scripts\json_exporter.py
- mappings_file: EXISTS — 03_Scripts\mappings.json

## Overwrite Notice
First run for this patient — no prior output files existed. No overwrite occurred.

## Step 1 — CSV Exporter
result: PASS
output: 01_Data\csv\kamiyanti_2025-11-11.csv
fields_populated: 60 / 64
zone_coverage: 60 / 60
warnings_count: 2
issues: none

Demographics:
  - name: Kamiyanti ✓ (matches patient_name "kamiyanti", case-insensitive)
  - gender: female ✓
  - age: 41 ✓
  - test_date: 11/11/2025 09:06 ✓

Permanent gaps (expected, not faults):
  - cj: header present, value empty ✓
  - sk-jc: header present, value empty ✓
  - mt-bmi: header present, value empty ✓
  - mt-wc: header present, value empty ✓

Console output: 2 warnings, 60/60 zones — consistent with data.
No false warnings observed.

## Step 2 — JSON Exporter
result: PASS
output: 01_Data\json\kamiyanti_2025-11-11.json
raw_fields_in_payload: 60
zone_fields_in_payload: 64 (60 resolved, 4 unknown — permanent gaps)
meta_run_id_matches: yes
issues: none

Verified:
  - patient.name: Kamiyanti ✓
  - patient.age: 41 (int) ✓
  - patient.gender: female ✓
  - patient.testdate: 11/11/2025 09:06 ✓
  - no null/NaN/Infinity in raw fields ✓
  - meta.source: qrma-parser-v3 ✓
  - meta.version: 3.0 ✓
  - meta.run_id: run_kamiyanti_20260525_final ✓
  - meta.generated_at: 2026-05-25T20:28:00.143813 ✓
  - warnings: list, count=2 ✓

## Warnings (from CSV/JSON)
1. PDF PARAMETERS WITH NO MAPPING (170): [170 unmapped PDF parameters — not dashboard fields]
2. DASHBOARD FIELDS NOT POPULATED (4): cj | mt-bmi | mt-wc | sk-jc

## Summary
PASS — First run for patient kamiyanti. Both steps completed without errors.
CSV: 60/64 fields populated, 60/60 zones resolved, 2 structural warnings within
threshold (≤ 2). JSON: valid payload, all meta fields correct, run_id matches.
Permanent gap fields accounted for. Note: PDF for Kamiyanti contains 170 unmapped
parameters (vs 161 for Ridwan) — within expected range for this device report format.
Pipeline output is ready for Tester validation.
