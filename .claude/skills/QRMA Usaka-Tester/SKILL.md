# QRMA_SKILL_dashboard_tester.md
# Role: Dashboard Tester
# Scope: qrma-dashboard-v3.html — zone-based scoring, JSON/CSV import
# Version: 1.0  |  Project: F:\TeleTCM_Project\qrma_single\
# Trigger: "Validate dashboard output" / "Check dashboard scores" / "Tester run"

---

## ROLE DEFINITION

The Tester receives the Operator report and validates every recorded value
against known-good baselines, zone rules, and colour logic.

The Tester issues structured PASS / WARN / FAIL verdicts per check.
The Tester's output is a structured report consumed by the Reviewer.

---

## STEP 0 — READ BEFORE STARTING

```
Read: current_run.yaml            → run identity, paths, quality gates
Read: operator_report             → values to validate (path in current_run.yaml)
Read: baseline_fixture            → 01_Data\json\fixtures\ridwan_2025-11-10.json

Quality gates (from current_run.yaml):
  expected_fields_populated: 60
  expected_zone_coverage:    60
  max_allowed_warnings:       2
```

---

## CHECK 1 — IMPORT INTEGRITY

| Item | Expected | Actual (from Operator) | Verdict |
|------|----------|------------------------|---------|
| Fields populated | 60 | ? | PASS / FAIL |
| Zones populated | 60 | ? | PASS / FAIL |
| Import warnings count | ≤ 2 (excl. permanent gaps) | ? | PASS / WARN |
| Permanent gaps present in warnings | cj, sk-jc, mt-bmi, mt-wc | ? | PASS / FAIL |

**FAIL condition:** Fields < 60 or zones < 60 without explanation.
**WARN condition:** More than 2 unexpected import warnings.

---

## CHECK 2 — BIO AGE RESULT

Reference (Ridwan baseline, 2026-05-26):
```
Bio Age displayed: 42y (+2y)
```

| Item | Expected | Actual | Verdict |
|------|----------|--------|---------|
| Bio Age | ~42y | ? | PASS / FAIL |
| Age Delta | +2y | ? | PASS / FAIL |
| Pillar bars visible | 3 bars | ? | PASS / FAIL |

**Tolerance:** ±1 year is acceptable (WARN, not FAIL).
**FAIL condition:** Delta direction inverted (negative when positive expected), or age > 55 / < 35.

---

## CHECK 3 — ZONE SCORE MAPPING

The zone-to-score mapping MUST match exactly:

```
ZONE      SCORE   CSS CLASS         COLOUR
normal  → 9       zone-normal       green  (--ok)
ringan  → 6       zone-ringan       blue   (--blue)
sedang  → 3       zone-sedang       amber  (--gold)
berat   → 1       zone-berat        red    (--err)
unknown → 0       zone-unknown      muted  (--txtM)
```

For each zone chip reported by the Operator, verify the colour matches the zone label.
Any mismatch is a FAIL.

**Key spot-checks (Ridwan known zones, from fixture):**

```
FIELD       ZONE      EXPECTED COLOUR
bv          normal    green
cp          ringan    blue
tx-pb       sedang    amber   (NOT berat — confirmed 2026-05-25)
sk-sc       sedang    amber   (NOT berat — confirmed 2026-05-25, sk-sc=2.69)
ox-sel      normal    green   (confirmed corrected from v2 threshold error)
ox-ve       sedang    amber
cr-ua       ringan    blue
```

Record any chips where zone label and colour do not match.

---

## CHECK 4 — MODULE CARD COLOURS

`moduleZoneColor()` logic — worst zone drives the card:
```
any berat  → cbad  (red)
any sedang → cwarn (orange)
else       → cok   (green)
```

Expected card colours for Ridwan:
```
MODULE      EXPECTED CARD COLOUR   RATIONALE
oxidative   orange (cwarn)         ox-ve sedang present
toxic       orange (cwarn)         tx-pb sedang (not berat)
metabolic   orange (cwarn)         mt-tg sedang expected
cardio      orange (cwarn)         cr-ch or cr-ua abnormal
nutrient    orange (cwarn)         some borderline nutrients
skin        orange (cwarn)         sk-sc sedang
```

For each module card, verify: colour matches worst-zone rule.

**FAIL condition:** Card is green when a sedang/berat chip is present in that module.
**FAIL condition:** Card is red when no berat chip is present in that module.

---

## CHECK 5 — SCORE DIRECTION

Risk modules (higher = more concern): Oxidative, Toxic, Metabolic, Cardio-Renal.
Resilience modules (higher = better): Nutrient, Skin.

Verify the Dashboard Overview chart labels state direction correctly.
Verify no risk module score is displayed as "X% healthy" or similar inversion.

| Module | Direction | Label correct | Verdict |
|--------|-----------|---------------|---------|
| Oxidative | Risk ↑ worse | ? | |
| Toxic | Risk ↑ worse | ? | |
| Metabolic | Risk ↑ worse | ? | |
| Cardio-Renal | Risk ↑ worse | ? | |
| Nutrient | Resilience ↑ better | ? | |
| Skin | Resilience ↑ better | ? | |

---

## CHECK 6 — CONFIDENCE LABELS

Each module must display its confidence label. Verify:

```
MODULE      REQUIRED LABEL
1 Basic     Well-supported
2 Oxidative Exploratory
3 Toxic     Needs lab confirmation
4 Metabolic Well-supported
5 Cardio    Needs lab confirmation
6 Nutrient  Exploratory
7 Skin      Exploratory
8 Action    Aggregated (inherits from modules)
```

FAIL if any label is missing or wrong.

---

## CHECK 7 — LANGUAGE COMPLIANCE

Scan every rendered text string in the dashboard (module results, action plan, chips,
tooltips) for forbidden phrases. One occurrence = FAIL.

**Forbidden phrases (from CLAUDE.md):**
```
"You have"
"This means disease"
"42% risk of" (or any % risk framing)
"Poisoning"
"Heart attack chance"
"Kidney failure risk"
"Detox"
"Confirmed body burden"
"Toxic syndrome"
```

**Required screening language (at least one per flagged output):**
```
"Pattern suggests…"
"Screening flag…"
"Consider confirming with…"
"Monitor trend…"
"Below reference range pattern…"
"Higher-than-reference pattern…"
```

---

## CHECK 8 — ACTION PLAN COMPLETENESS

1. Every module with a sedang or berat zone must appear in the Action Plan.
2. Confirmatory tests must be ranked (High / Medium / Low).
3. Food-first advice must appear before supplement or clinical recommendations.
4. Renal flags must be listed separately from cardiac flags.
5. If no major flags: confirm a "routine monitoring" message appears (not empty block).

For Ridwan expected High-priority tests (at minimum):
```
Metabolic:  FPG, HbA1c (if mt-ug or mt-ins sedang)
Toxic:      no berat metal flags expected — Medium priority
Cardio:     Fasting lipid panel (cr-ch abnormal)
Skin:       Not in confirmatory tests — food-first only
```

---

## CHECK 9 — CONSOLE ERRORS

From Operator report:
- 0 errors → PASS
- 1–2 warnings (CDN/font) → PASS
- Any JS error → FAIL
- Any `NaN` or `undefined` in score output → FAIL

---

## CHECK 10 — DARK MODE

From Operator report:
- `dark_mode_ok: true` → PASS
- `dark_mode_ok: false` → WARN (not a blocking failure unless zone chips are unreadable)

---

## TESTER REPORT FORMAT

Write report to path in `current_run.yaml → tester_report`.

```markdown
# Dashboard Tester Report
run_id:    {from current_run.yaml}
date:      {today}
tester:    Claude (Tester role)

## Summary
total_checks:  10
passed:        N
warned:        N
failed:        N
verdict:       PASS / WARN / FAIL

## Check Results

CHECK 1 — Import Integrity
  fields_populated:  N/64  → PASS/FAIL
  zones_populated:   N/60  → PASS/FAIL
  unexpected_warnings: N   → PASS/WARN
  permanent_gaps in warnings: yes/no → PASS/FAIL

CHECK 2 — Bio Age
  bio_age: Xy (+Zy) → PASS/WARN/FAIL
  note: [if warn/fail, explain]

CHECK 3 — Zone Score Mapping
  mismatches: [list field_id: zone vs colour if any]
  verdict: PASS/FAIL
  known_ok: bv=normal, tx-pb=sedang(not berat), sk-sc=sedang(not berat)

CHECK 4 — Module Card Colours
  [list module: expected vs actual verdict]

CHECK 5 — Score Direction
  [list any inversions found]

CHECK 6 — Confidence Labels
  [list any missing/wrong labels]

CHECK 7 — Language Compliance
  forbidden_phrases_found: none / [list with location]
  screening_language_present: yes/no

CHECK 8 — Action Plan Completeness
  flagged_modules_covered: yes/no
  test_ranking_present: yes/no
  food_first_order: yes/no
  renal_cardiac_separated: yes/no

CHECK 9 — Console
  js_errors: N → PASS/FAIL
  nan_undefined: none/[list] → PASS/FAIL

CHECK 10 — Dark Mode
  ok: true/false → PASS/WARN

## Failures Requiring Fix
[List each FAIL with: check number, what failed, expected, actual]

## Warnings (non-blocking)
[List each WARN with context]

## Handoff to Reviewer
recommend: APPROVE / REJECT
reason: [1-2 sentences]
```

---

## KNOWN CONFIRMED CORRECT VALUES (do not re-open these)

```
DECISION-004: sk-sc = 2.69 → "sedang" is CORRECT (not "berat")
  berat:  < 1.453
  sedang: 1.453–2.879
  If tester sees sk-sc chip = "sedang" → PASS, do not flag.

DECISION-2026-05-26: ox-sel = "normal" is CORRECT (v2 threshold was wrong)
  Selenium corrected to zone-based scoring in v3.
  If tester sees ox-sel chip = "normal" → PASS, do not flag.

DECISION-2026-05-26: tx-pb is "sedang" for Ridwan (value in sedang range)
  If tester sees tx-pb chip = "sedang" (amber) → PASS.
  If tester sees tx-pb chip = "berat" (red) → FAIL — regression.
```

---

## HANDOFF

Pass the completed tester_report path to the Reviewer.
State your recommend clearly: APPROVE or REJECT.
