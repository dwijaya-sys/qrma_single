# CHANGELOG

| Date | Action | Affected Files | Status |
|---|---|---|---|
| 2026-05-25 | Processed QRMA_Ridwan_November_21.pdf — 60/64 fields, 60/60 zones, run_id: run_ridwan_20260525_1700 | 01_Data\csv\ridwan_2025-11-10.csv, 01_Data\json\ridwan_2025-11-10.json | done |
| 2026-05-25 | Tester PASS — all structural, zone-integrity, and baseline checks passed; output identical to approved fixture | 90_Pipeline_Reports\tester\run_ridwan_20260525_tester.md | done |
| 2026-05-25 | REJECT — run_ridwan_20260525_1700 — SCHEMA_RISK: bv zone direction inverted (61.274 in normal range → berat); sk-sc under-flagged (2.69 below 4.471 threshold → sedang, expected berat) | 90_Pipeline_Reports\reviewer\run_ridwan_20260525_reviewer.md | pending-fix |
| 2026-05-25 | Re-run operator — 60/64 fields, 60/60 zones; false console warning from csv_exporter_v2.py (mt-tg_zone reported missing but present in data — exporter reporting bug) | 01_Data\csv\ridwan_2025-11-10.csv, 01_Data\json\ridwan_2025-11-10.json | done |
| 2026-05-25 | Operator PASS — run_ridwan_20260525_final — 60/64 fields, 60/60 zones, 2 warnings | 01_Data\csv\ridwan_2025-11-10.csv, 01_Data\json\ridwan_2025-11-10.json | done |
| 2026-05-25 | Tester PASS — run_ridwan_20260525_final — all checks clean; bv zone fix confirmed (normal); all 5 spot-checks pass | 90_Pipeline_Reports\tester\run_ridwan_20260525_tester.md | done |
| 2026-05-25 | APPROVE — run_ridwan_20260525_final — all checks passed, 60/60 zones valid, zone directions correct, fixture current | 90_Pipeline_Reports\reviewer\run_ridwan_20260525_reviewer.md | done |
| 2026-05-25 | Operator PASS — run_kamiyanti_20260525_final — first run, female age 41, 60/64 fields, 60/60 zones, 2 warnings | 01_Data\csv\kamiyanti_2025-11-11.csv, 01_Data\json\kamiyanti_2025-11-11.json | done |
| 2026-05-25 | Tester PASS — run_kamiyanti_20260525_final — all checks clean; spot-checks and baseline skipped (first-run new patient) | 90_Pipeline_Reports\tester\run_kamiyanti_20260525_tester.md | done |
| 2026-05-25 | APPROVE — run_kamiyanti_20260525_final — all checks passed, 60/60 zones valid, zone directions correct; promote to fixtures\ | 90_Pipeline_Reports\reviewer\run_kamiyanti_20260525_reviewer.md | done |
