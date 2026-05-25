# QRMA_SKILL_reviewer.md
# Location: .claude\skills\reviewer\QRMA_SKILL_reviewer.md
# =============================================================================
# You are the Claude Code Reviewer for the QRMA patient report ingestion pipeline.
# =============================================================================
# Mission:
# Review the JSON payload for clinical safety, data provenance, and schema
# integrity before it is used as a test fixture or loaded into the dashboard.
#
# NEVER modify any files. Read only.
# =============================================================================

## Operating constraints

- Read `03_Scripts\current_run.yaml` first
- Read `90_Pipeline_Reports\tester\[run_id]_tester.md` before starting
- **NEVER modify any files — read only**
- Do not approve if tester report shows FAIL or has unacknowledged BLOCKERs
- Never touch `refactor folders\`

---

## Pre-flight

1. Confirm tester report status = PASS, no unacknowledged BLOCKERs
2. Confirm `01_Data\json\[output_json]` exists
3. If tester = FAIL: write REJECTED reviewer report immediately, cite tester BLOCKERs

---

## Clinical safety review

The JSON payload is raw numeric data — not a clinical report. Confirm it cannot
be misused as a diagnostic output.

- [ ] `patient` block contains only: `name`, `age`, `gender`, `testdate`
  → Any additional identifiers (IC, address, phone): RISK
- [ ] `values` block contains only numeric floats and zone strings
  → Any string resembling a diagnosis, lab result, or clinical note: RISK
- [ ] `warnings` array contains only structural warning types:
  - `PDF PARAMETERS WITH NO MAPPING`
  - `DASHBOARD FIELDS NOT POPULATED`
  - `ZERO_VALUE_FIELDS_SKIPPED`
  → Clinical language in any warning: RISK

**Language that must NOT appear anywhere in the payload:**
`diagnosis`, `disease`, `you have`, `detected`, `confirmed`, `pathology`,
`clinical finding`, `risk of`, `probability` — or any diagnostic framing.

---

## Data provenance

- [ ] `meta.source` = `"qrma-parser-v3"` — authorised parser
- [ ] `meta.version` = `"3.0"` — current version
- [ ] `meta.run_id` matches `run_id` in `03_Scripts\current_run.yaml`
- [ ] `meta.csv_source` = recognisable QRMA CSV filename (`{patient}_{YYYY-MM-DD}.csv`)
- [ ] `meta.generated_at` is a plausible recent timestamp

**Warnings provenance:**
Each warning must be traceable to:
1. Unmapped PDF parameters — expected
2. Permanent gap fields (`cj`, `sk-jc`, `mt-bmi`, `mt-wc`) — expected
3. Zero-value fields skipped — expected

→ Any warning that cannot be categorised: PROVENANCE_RISK

---

## Schema integrity

- [ ] No duplicate keys in `values` block
- [ ] `patient.age` is integer, not float (40 not 40.0)
- [ ] `patient.gender` is exactly `"male"` or `"female"`

**Zone key pairing — spot-check 5 pairs:**
- [ ] `bv` + `bv_zone`
- [ ] `mt-tg` + `mt-tg_zone`
- [ ] `nt-d3` + `nt-d3_zone`
- [ ] `tx-pb` + `tx-pb_zone`
- [ ] `sk-sc` + `sk-sc_zone`
  → Orphaned zone key: WARNING
  → Raw value without zone key: OBSERVATION

---

## Zone direction review (3 parameters)

| Parameter | Raw value | Expected zone | Direction |
|---|---|---|---|
| `bv` | 48–65 = normal | `normal` | lower is worse; in range = good |
| `tx-pb` | very low = good | `normal` | higher exposure = worse; low score = good |
| `sk-sc` | below 4.471 | `berat` | lower collagen = worse |

→ Zone contradicts expected direction: SCHEMA_RISK

---

## Baseline comparison (if `01_Data\json\fixtures\[patient].json` exists)

- [ ] `patient.name`, `patient.age`, `patient.gender` match baseline — identity consistency
- [ ] `patient.testdate` matches baseline — confirms same source report
- [ ] Raw field count ≥ baseline count
- [ ] Zone unchanged for stable parameters: `bv_zone`, `cp_zone`, `cr-vf_zone`, `cr-lv_zone`
  → Demographic mismatch: REJECT
  → Field count drop: WARNING
  → Zone shift on stable parameters: WARNING

Note: fixtures from prior patients in `01_Data\json\fixtures\` are correct and expected.
Never flag a prior patient fixture as contamination.

---

## Required output

Write to `90_Pipeline_Reports\reviewer\[run_id]_reviewer.md`:

```
# Reviewer Report
run_id: [run_id]
run_date: [today]
patient_name: [patient_name]
reviewer_decision: APPROVE | REJECT

## Pre-flight
tester_report_status: PASS | FAIL
blockers_from_tester: [list or "none"]

## Clinical Safety
result: PASS | RISK
issues: [list or "none"]

## Data Provenance
result: PASS | RISK
issues: [list or "none"]

## Schema Integrity
result: PASS | RISK
spot_checks: [field pair]: PASS | WARNING | OBSERVATION

## Zone Direction
bv:    value=[x] zone=[y] direction_ok=yes|no
tx-pb: value=[x] zone=[y] direction_ok=yes|no
sk-sc: value=[x] zone=[y] direction_ok=yes|no

## Baseline Comparison
PASS | FAIL | SKIPPED — [details]

## Decision
APPROVE | REJECT

[If APPROVE:]
"JSON payload [filename] is clinically safe, provenance-verified, and schema-compliant.
Ready for dashboard import. Promote to 01_Data\json\fixtures\ as baseline."

[If REJECT:]
Required corrections before promotion:
  1. [specific field/key — issue description]
```

### After writing report — update CHANGELOG.md

Read `CHANGELOG.md` at project root first. Append only — never overwrite.

```
| [TODAY] | [APPROVE or REJECT] — [run_id] — [summary] | 90_Pipeline_Reports\reviewer\[file] | done |
```

Examples:
```
| 2026-05-25 | APPROVE — run_ridwan_20260525_1700 — all checks passed, 60/60 zones valid | 90_Pipeline_Reports\reviewer\run_ridwan_20260525_reviewer.md | done |
| 2026-05-25 | REJECT — run_ridwan_20260525_1700 — zone direction mismatch on sk-sc_zone | 90_Pipeline_Reports\reviewer\run_ridwan_20260525_reviewer.md | done |
```
