# Operator Report
run_id: run_ridwan_20260525_final
run_date: 2026-05-25
patient_name: ridwan
operator_status: PASS

## Files Verified
- pdf_file: EXISTS — QRMA_Ridwan_November_21.pdf
- csv_exporter: EXISTS — 03_Scripts\csv_exporter_v2.py
- json_exporter: EXISTS — 03_Scripts\json_exporter.py
- mappings_file: EXISTS — 03_Scripts\mappings.json

## Overwrite Notice
Output files already existed from prior runs (run_ridwan_20260525_1700). Both overwritten:
  - 01_Data\csv\ridwan_2025-11-10.csv
  - 01_Data\json\ridwan_2025-11-10.json

## Step 1 — CSV Exporter
result: PASS
output: 01_Data\csv\ridwan_2025-11-10.csv
fields_populated: 60 / 64
zone_coverage: 60 / 60
warnings_count: 2
issues: none

Demographics:
  - name: ridwan ✓
  - gender: male ✓
  - age: 40 ✓
  - test_date: 10/11/2025 17:01 ✓

Permanent gaps (expected, not faults):
  - cj: header present, value empty ✓
  - sk-jc: header present, value empty ✓
  - mt-bmi: header present, value empty ✓
  - mt-wc: header present, value empty ✓

Note: Console reported 2 warnings and 60/60 zones — consistent with data.
No false warnings observed (contrast with prior re-run on same run_id).

## Step 2 — JSON Exporter
result: PASS
output: 01_Data\json\ridwan_2025-11-10.json
raw_fields_in_payload: 60
zone_fields_in_payload: 64 (60 resolved, 4 unknown — permanent gaps)
meta_run_id_matches: yes
issues: none

Verified:
  - patient.name: ridwan ✓
  - patient.age: 40 (int) ✓
  - patient.gender: male ✓
  - patient.testdate: 10/11/2025 17:01 ✓
  - no null/NaN/Infinity in raw fields ✓
  - meta.source: qrma-parser-v3 ✓
  - meta.version: 3.0 ✓
  - meta.run_id: run_ridwan_20260525_final ✓
  - meta.generated_at: 2026-05-25T20:00:58.854790 ✓
  - meta.csv_source: ridwan_2025-11-10.csv ✓
  - warnings: list, count=2 ✓

## Warnings (from CSV/JSON)
1. PDF PARAMETERS WITH NO MAPPING (161): Koefisien Tekanan Intraluminal | Fungsi Detoksifikasi | Fungsi Sekresi Empedu | Kandungan Lemak Hati | [+157 more unmapped PDF parameters]
2. DASHBOARD FIELDS NOT POPULATED (4): cj | mt-bmi | mt-wc | sk-jc

## Summary
PASS — Both steps completed without errors. CSV: 60/64 fields populated, 60/60 zones
resolved, 2 structural warnings within threshold (≤ 2). JSON: valid payload, all meta
fields correct, run_id matches. Permanent gap fields accounted for. Pipeline output
is ready for Tester validation.
