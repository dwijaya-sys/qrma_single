# QRMA_SKILL_dashboard_operator.md
# Role: Dashboard Operator
# Scope: qrma-dashboard-v3.html — zone-based scoring, JSON/CSV import
# Version: 1.0  |  Project: F:\TeleTCM_Project\qrma_single\
# Trigger: "Run dashboard QA" / "Test the dashboard" / "Validate import"

---

## ROLE DEFINITION

The Operator drives the dashboard through a complete QA run:
load → import → calculate → inspect → report.

The Operator does NOT judge pass/fail — that is the Tester's job.
The Operator's output is a structured report that the Tester consumes.

---

## STEP 0 — READ BEFORE STARTING

```
Read current_run.yaml to find:
  - patient_name        (e.g. "ridwan")
  - output_json         (e.g. 01_Data\json\ridwan_2025-11-10.json)
  - output_csv          (e.g. 01_Data\csv\ridwan_2025-11-10.csv)
  - operator_report     (write your output here)

Active dashboard file: qrma-dashboard-v3.html
Reference fixture:     01_Data\json\fixtures\ridwan_2025-11-10.json
```

---

## STEP 1 — OPEN DASHBOARD

1. Open `qrma-dashboard-v3.html` in a browser (Chrome recommended).
2. Confirm sticky disclaimer is visible: **"For Reference Only · Not a Diagnosis"**
3. Confirm default values are loaded (no blank fields on first view).
4. Open browser DevTools → Console tab. Clear any existing messages.

Record: `default_load_ok: true/false`, `console_errors_on_load: N`

---

## STEP 2 — JSON IMPORT (primary path)

```
File to import:  {output_json from current_run.yaml}
Fallback:        01_Data\json\fixtures\ridwan_2025-11-10.json
```

1. Click **Import** button.
2. Select the JSON file.
3. Confirm the import modal appears showing:
   - Patient name
   - Age and gender
   - Field count (expect 60 of 64)
   - Warning list (expect ≤4 warnings for permanent gaps: cj, sk-jc, mt-bmi, mt-wc)
4. Click **Load Report**.
5. Confirm `calcAll()` fires and dashboard navigates to Overview.

Record all fields shown in import modal. Note any unexpected warnings.

---

## STEP 3 — CALCULATE ALL

1. Click **Calculate All Scores** (sidebar or module button).
2. Wait for all 8 module cards to populate on the Dashboard Overview.
3. Note the Bio Age result: expected `~42y (+2y)` for Ridwan.

Record: `bio_age_displayed`, `modules_populated: N/8`

---

## STEP 4 — MODULE WALKTHROUGH

Visit each module page in order. For each, record:

| Module | Score shown | Sub-scores | Chips visible | Zone badges | Confidence label |
|--------|-------------|------------|---------------|-------------|------------------|
| 1 Basic / Bio Age | | | — | — | Well-supported |
| 2 Oxidative | | ax / px | yes | yes | Exploratory |
| 3 Toxic | | hm / lb | yes | yes | Needs lab confirm |
| 4 Metabolic | | gc / lp / bmi | yes | yes | Well-supported |
| 5 Cardio-Renal | | cai / ri | yes | yes | Needs lab confirm |
| 6 Nutrient | | per-nutrient | yes | yes | Exploratory |
| 7 Skin | | cl / bf / sn | yes | yes | Exploratory |
| 8 Action Plan | | — | — | — | Aggregated |

For each chip, record the zone label displayed (`normal` / `ringan` / `sedang` / `berat` / `unknown`).

---

## STEP 5 — ZONE COLOUR SPOT-CHECK

For each module card on the Dashboard Overview, record the card's colour class:
- Green (`cok`) — all zones normal/ringan
- Orange (`cwarn`) — worst zone is sedang
- Red (`cbad`) — at least one zone is berat

Expected for Ridwan (from 2026-05-26 validation):
```
Bio Age:    orange (sedang zones present in metabolic/toxic pillars)
Oxidative:  orange
Toxic:      orange or red (tx-pb berat expected)
Metabolic:  orange
Cardio:     orange
Nutrient:   orange (some borderline nutrients)
Skin:       orange  (~66% orange per prior run)
```

Record any card colours that differ from expectation. Do NOT judge — report.

---

## STEP 6 — CONSOLE CHECK

In DevTools Console, record:
- Count of errors (red)
- Count of warnings (yellow)
- Any `undefined`, `NaN`, or `null` in score output
- Any failed network requests

Acceptable: 0 errors. Warnings only for known CDN or font-load timing.

---

## STEP 7 — DARK MODE SPOT-CHECK

1. Click the theme toggle button (moon/sun icon in header).
2. Confirm dashboard switches to dark theme.
3. Confirm zone chips remain readable (no white-on-white or black-on-black).
4. Toggle back to light mode.

Record: `dark_mode_ok: true/false`

---

## STEP 8 — ACTION PLAN CHECK

1. Navigate to **Action Plan** page.
2. Confirm three output blocks are present:
   - Confirmatory tests table (ranked High / Medium / Low)
   - Food-first actions (per domain)
   - Active alerts
3. Confirm no output uses forbidden language:
   - ❌ "You have…"
   - ❌ "This means disease…"
   - ❌ "Detox" / "Poisoning" / "Confirmed body burden"
4. Confirm every flagged domain has at least one food suggestion.

Record any language violations verbatim.

---

## STEP 9 — OPERATOR REPORT

Write report to path in `current_run.yaml → operator_report`.

```markdown
# Dashboard Operator Report
run_id:        {from current_run.yaml}
date:          {today}
operator:      Claude (Operator role)
dashboard:     qrma-dashboard-v3.html
patient:       {patient_name}
json_source:   {output_json}

## Import Result
fields_populated:  N / 64
zones_populated:   N / 60
unexpected_warnings: [list]

## Bio Age
displayed: Xy (+Zy)

## Module Scores (raw as displayed)
basic:     ...
oxidative: ...
toxic:     ...
metabolic: ...
cardio:    ...
nutrient:  ...
skin:      ...

## Module Card Colours
basic:     green/orange/red
oxidative: ...
[continue for all 7]

## Zone Chips — Notable Values
[list any chips showing sedang or berat, with field ID]

## Console
errors:   N
warnings: N
notes:    [any specific messages]

## Dark Mode
ok: true/false
notes: [if false, describe]

## Language Check
violations: none / [list verbatim]

## Handoff Note
Ready for Tester: yes/no
Blockers: [if any]
```

---

## KNOWN PERMANENT GAPS (not failures)

```
cj      — Kolagen Sendi not in PDF → expect empty / unknown
sk-jc   — same source as cj
mt-bmi  — Kegemukan is section heading → expect empty / manual entry only
mt-wc   — Lingkar Pinggang not in PDF → expect empty / manual entry only
```

These 4 gaps MUST appear in the import modal warning list. If they do NOT appear,
flag as unexpected (the parser may have incorrectly populated them).

---

## HANDOFF

Pass the completed operator_report path to the Tester.
Do not modify the dashboard HTML. Do not modify the JSON fixture.
