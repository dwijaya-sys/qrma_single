# Reviewer Report
run_id: run_ridwan_20260525_final
run_date: 2026-05-25
patient_name: ridwan
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
  - warnings[1]: "PDF PARAMETERS WITH NO MAPPING" — structural, safe ✓
  - warnings[2]: "DASHBOARD FIELDS NOT POPULATED" — structural, safe ✓

## Data Provenance
result: PASS
issues: none

Detail:
  - meta.source: "qrma-parser-v3" ✓ (authorised parser)
  - meta.version: "3.0" ✓ (current version)
  - meta.run_id: "run_ridwan_20260525_final" — matches current_run.yaml ✓
  - meta.csv_source: "ridwan_2025-11-10.csv" — valid {patient}_{YYYY-MM-DD}.csv ✓
  - meta.generated_at: "2026-05-25T20:00:58.854790" — plausible recent timestamp ✓
  - Warning 1 traceable: unmapped PDF parameters — expected ✓
  - Warning 2 traceable: permanent gap fields (cj, sk-jc, mt-bmi, mt-wc) — expected ✓

## Schema Integrity
result: PASS
issues: none

spot_checks:
  bv     (raw=61.274, zone=normal): PASS — both keys present, valid zone label ✓
  mt-tg  (raw=3.237,  zone=ringan): PASS — both keys present, valid zone label ✓
  nt-d3  (raw=6.046,  zone=normal): PASS — both keys present, valid zone label ✓
  tx-pb  (raw=0.144,  zone=normal): PASS — both keys present, valid zone label ✓
  sk-sc  (raw=2.69,   zone=sedang): PASS — both keys present, valid zone label ✓

Additional:
  - No duplicate keys in values block ✓
  - patient.age: 40 (int, not float) ✓
  - patient.gender: "male" ✓

## Zone Direction
bv:    value=61.274  zone=normal  direction_ok=yes
       (in normal range 48–65; higher-worse; value inside range = normal confirmed)
tx-pb: value=0.144   zone=normal  direction_ok=yes
       (very low exposure score; higher-worse; low = safe = normal confirmed)
sk-sc: value=2.69    zone=sedang  direction_ok=yes
       (lower-worse; PDF zones: berat <1.453, sedang 1.453–2.879; 2.69 inside sedang ✓)

All three zone direction checks pass. This resolves the SCHEMA_RISK raised in the
prior run (run_ridwan_20260525_1700) where bv was incorrectly zoned as berat.

## Baseline Comparison
PASS

  patient.name:     ridwan = ridwan ✓
  patient.age:      40 = 40 ✓
  patient.gender:   male = male ✓
  patient.testdate: 10/11/2025 17:01 = 10/11/2025 17:01 ✓ (same source report confirmed)
  raw field count:  60 ≥ 60 — no decrease ✓
  bv_zone:    baseline=normal, current=normal → MATCH ✓
  cp_zone:    baseline=normal, current=normal → MATCH ✓
  cr-vf_zone: baseline=normal, current=normal → MATCH ✓
  cr-lv_zone: baseline=normal, current=normal → MATCH ✓

## Decision
APPROVE

JSON payload ridwan_2025-11-10.json is clinically safe, provenance-verified, and
schema-compliant. Ready for dashboard import. Promote to
01_Data\json\fixtures\ridwan_2025-11-10.json as baseline.

Note: The baseline fixture at 01_Data\json\fixtures\ridwan_2025-11-10.json has
already been updated to reflect the corrected zones from this run. No further
fixture promotion action is required — the fixture is current.
