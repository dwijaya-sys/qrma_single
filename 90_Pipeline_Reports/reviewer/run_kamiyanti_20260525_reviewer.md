# Reviewer Report
run_id: run_kamiyanti_20260525_final
run_date: 2026-05-25
patient_name: kamiyanti
reviewer_decision: APPROVE

## Pre-flight
tester_report_status: PASS
blockers_from_tester: none

## Clinical Safety
result: PASS
issues: none

Detail:
  - patient block keys: name, age, gender, testdate only — no additional identifiers ✓
  - No forbidden clinical language found anywhere in payload
    (checked: diagnosis, disease, you have, detected, confirmed, pathology,
     clinical finding, risk of, probability)
  - All raw values are numeric floats — no strings resembling clinical notes ✓
  - warnings[1]: "PDF PARAMETERS WITH NO MAPPING (170)" — structural, safe ✓
  - warnings[2]: "DASHBOARD FIELDS NOT POPULATED (4)" — structural, safe ✓

## Data Provenance
result: PASS
issues: none

Detail:
  - meta.source: "qrma-parser-v3" ✓ (authorised parser)
  - meta.version: "3.0" ✓ (current version)
  - meta.run_id: "run_kamiyanti_20260525_final" — matches current_run.yaml ✓
  - meta.csv_source: "kamiyanti_2025-11-11.csv" — valid {patient}_{YYYY-MM-DD}.csv ✓
  - meta.generated_at: "2026-05-25T20:28:00.143813" — plausible recent timestamp ✓
  - Warning 1 traceable: 170 unmapped PDF parameters — expected ✓
  - Warning 2 traceable: permanent gap fields (cj, sk-jc, mt-bmi, mt-wc) — expected ✓

## Schema Integrity
result: PASS
issues: none

spot_checks:
  bv    (raw=54.597, zone=normal): PASS — both keys present, valid zone label ✓
  mt-tg (raw=2.951,  zone=ringan): PASS — both keys present, valid zone label ✓
  nt-d3 (raw=5.157,  zone=ringan): PASS — both keys present, valid zone label ✓
  tx-pb (raw=0.059,  zone=normal): PASS — both keys present, valid zone label ✓
  sk-sc (raw=3.862,  zone=ringan): PASS — both keys present, valid zone label ✓

Additional:
  - No duplicate keys in values block ✓
  - patient.age: 41 (int, not float) ✓
  - patient.gender: "female" ✓

## Zone Direction
bv:    value=54.597  zone=normal  direction_ok=yes
       (in normal range 48–65; higher-worse; 54.597 inside range = normal confirmed)
tx-pb: value=0.059   zone=normal  direction_ok=yes
       (very low exposure score; higher-worse; 0.059 = safe = normal confirmed)
sk-sc: value=3.862   zone=ringan  direction_ok=yes
       (lower-worse; PDF thresholds: berat<1.453, sedang 1.453–2.879,
        ringan 2.879–4.471, normal 4.471–6.079; 3.862 inside ringan range ✓)

All three zone direction checks pass. Values differ from Ridwan (bv=54.597 vs 61.274,
sk-sc=3.862 vs 2.69) — both patients within valid zone ranges for their respective values.

## Baseline Comparison
SKIPPED — no fixture found at 01_Data\json\fixtures\kamiyanti_2025-11-11.json.
First run for this patient. This APPROVE triggers first-time fixture promotion.

## Decision
APPROVE

JSON payload kamiyanti_2025-11-11.json is clinically safe, provenance-verified, and
schema-compliant. Ready for dashboard import. Promote to
01_Data\json\fixtures\kamiyanti_2025-11-11.json as baseline.

Action required: copy 01_Data\json\kamiyanti_2025-11-11.json to
01_Data\json\fixtures\kamiyanti_2025-11-11.json to establish the first approved
baseline fixture for this patient.
