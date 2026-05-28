# QRMA_SKILL_dashboard_reviewer.md
# Role: Dashboard Reviewer
# Scope: qrma-dashboard-v3.html — zone-based scoring, JSON/CSV import
# Version: 1.0  |  Project: F:\TeleTCM_Project\qrma_single\
# Trigger: "Review dashboard" / "Final dashboard check" / "Reviewer run"

---

## ROLE DEFINITION

The Reviewer receives the Tester report and makes the final APPROVE / REJECT decision.

The Reviewer does NOT re-run every check. The Reviewer:
1. Audits the Tester's reasoning for any FAIL or WARN.
2. Applies blocking rules (see below) — any single block = REJECT.
3. Applies advisory rules — accumulation of WARNs can escalate to REJECT.
4. Issues the final verdict and a signed reviewer_report.

---

## STEP 0 — READ BEFORE STARTING

```
Read: current_run.yaml     → run identity, quality gates
Read: tester_report        → verdicts, failures, warnings
Read: baseline_fixture     → 01_Data\json\fixtures\ridwan_2025-11-10.json
```

---

## BLOCKING RULES — ANY ONE = REJECT

If the Tester reported any of these, the Reviewer MUST REJECT without deliberation:

```
BLOCK-01  fields_populated < 60 (excludes permanent gaps)
BLOCK-02  zones_populated < 60
BLOCK-03  Any zone chip colour does not match its zone label
          (e.g. "sedang" chip rendered green, or "normal" chip rendered red)
BLOCK-04  Any module card colour violates worst-zone rule
          (green card when sedang/berat chip present in that module)
BLOCK-05  Any JS error in console (not warning — error)
BLOCK-06  Any NaN or undefined in a displayed score
BLOCK-07  Any forbidden language phrase found in dashboard output
BLOCK-08  Bio Age delta direction is inverted
          (expected positive for Ridwan; negative = scoring regression)
BLOCK-09  Any confidence label is missing from a module page
BLOCK-10  tx-pb chip shows "sedang" or "berat" for Ridwan
          (confirmed normal — 0.144 is within PDF normal range 0.052-0.643)
BLOCK-11  sk-sc chip shows "berat" (red) for Ridwan
          (confirmed sedang — sk-sc=2.69 is in 1.453–2.879 range)
```

---

## ADVISORY RULES — ACCUMULATION CAN ESCALATE

Three or more advisory findings = escalate to REJECT with explanation.

```
ADV-01  Bio Age outside ±1y of 42y (Ridwan baseline)
ADV-02  Dark mode chip colours unreadable
ADV-03  More than 2 unexpected import warnings (beyond 4 permanent gaps)
ADV-04  Action Plan missing a flagged module
ADV-05  Food-first advice absent for a module with sedang/berat flags
ADV-06  Confirmatory test ranking absent or disordered (High before Medium before Low)
ADV-07  Score direction label wrong on chart axis
ADV-08  Renal and cardiac flags not separated in Action Plan
```

---

## REVIEWER VALIDATION OF TESTER REASONING

For each Tester FAIL, the Reviewer must confirm the Tester's logic is correct
before accepting it as a REJECT reason. Common pitfalls:

**Do not reject for known-correct values:**
```
sk-sc = "sedang" → CORRECT per DECISION-004.  If Tester flagged this as FAIL, override.
ox-sel = "normal" → CORRECT (v2 threshold was wrong, v3 zone-based is right).
tx-pb = "normal"  → CORRECT for Ridwan (0.144 within 0.052–0.643). Flag if "sedang" or "berat".
```

**Do not reject for permanent gaps:**
```
cj, sk-jc, mt-bmi, mt-wc empty → expected. If Tester flagged these as failures, override.
```

**Do reject for regressions:**
```
If any previously passing check now fails → escalate, even if it seems minor.
The fixture exists precisely to catch regressions.
```

---

## REVIEWER SIGN-OFF CONDITIONS

### APPROVE when:
- Zero BLOCK-level failures.
- Fewer than 3 advisory findings.
- Tester's reasoning is sound for all WARN items.
- No regressions vs. baseline fixture.

### REJECT when:
- Any BLOCK-level failure (even one).
- Three or more advisory findings.
- Tester reasoning is incorrect on a FAIL item AND the corrected analysis
  reveals a BLOCK-level issue.

### CONDITIONAL APPROVE when:
- No BLOCK-level failures.
- 1–2 advisory findings that are cosmetic or deferred-feature items
  (e.g. dark mode chip contrast mildly low, language toggle not yet built).
- Document the condition: "Approve with noted items for next sprint."

---

## REVIEWER REPORT FORMAT

Write report to path in `current_run.yaml → reviewer_report`.

```markdown
# Dashboard Reviewer Report
run_id:    {from current_run.yaml}
date:      {today}
reviewer:  Claude (Reviewer role)

## Final Verdict
APPROVE / REJECT / CONDITIONAL APPROVE

## Tester Summary Review
tester_recommendation: APPROVE / REJECT
reviewer_agrees: yes / no
override_reason: [if no, explain]

## Blocking Rule Audit
[For each block rule, state: triggered / not triggered]
BLOCK-01 fields_populated:    not triggered / TRIGGERED — [detail]
BLOCK-02 zones_populated:     not triggered / TRIGGERED — [detail]
BLOCK-03 zone colour mismatch: not triggered / TRIGGERED — [field, zone, colour seen]
BLOCK-04 card colour wrong:    not triggered / TRIGGERED — [module, expected, actual]
BLOCK-05 JS errors:            not triggered / TRIGGERED — [error text]
BLOCK-06 NaN/undefined:        not triggered / TRIGGERED — [location]
BLOCK-07 forbidden language:   not triggered / TRIGGERED — [phrase, location]
BLOCK-08 bio age inverted:     not triggered / TRIGGERED — [value seen]
BLOCK-09 confidence missing:   not triggered / TRIGGERED — [module]
BLOCK-10 tx-pb regression:     not triggered / TRIGGERED — [zone seen]
BLOCK-11 sk-sc regression:     not triggered / TRIGGERED — [zone seen]

## Advisory Audit
[For each advisory rule, state: triggered / not triggered]
ADV-01 bio age drift:          not triggered / TRIGGERED — [value]
ADV-02 dark mode readable:     not triggered / TRIGGERED
ADV-03 unexpected warnings:    not triggered / TRIGGERED — [count]
ADV-04 action plan gaps:       not triggered / TRIGGERED — [module]
ADV-05 food-first missing:     not triggered / TRIGGERED — [module]
ADV-06 test ranking:           not triggered / TRIGGERED
ADV-07 score direction label:  not triggered / TRIGGERED — [module]
ADV-08 renal/cardiac split:    not triggered / TRIGGERED

advisory_count: N

## Known-Correct Overrides Applied
[List any Tester FAILs that reviewer confirmed as correct values and overrode]

## Regressions vs Baseline
none / [list]

## Reason for Verdict
[2–4 sentences explaining the decision]

## Required Actions Before Next Approve (if REJECT)
1. [Specific fix required]
2. [...]

## Deferred Items (if CONDITIONAL APPROVE)
[Items noted but not blocking this release]
```

---

## REFERENCE: ZONE SYSTEM CONTRACT

The Reviewer is the final authority that this contract is upheld in the dashboard:

```
ZONE      SCORE   CSS CLASS   TOKEN COLOUR   DISPLAY BADGE (id/en)
normal  → 9       zone-normal  --ok           Normal / Normal
ringan  → 6       zone-ringan  --blue         Ringan / Mild
sedang  → 3       zone-sedang  --gold         Sedang / Moderate
berat   → 1       zone-berat   --err          Berat  / Severe
unknown → 0       zone-unknown --txtM         — / Unknown
```

Any deviation from this table in any rendered chip is a BLOCK-03 / BLOCK-04 violation.

---

## REFERENCE: VALIDATED BASELINE (2026-05-26)

```
PATIENT     GENDER  FIELDS  ZONES   BIO AGE  SKIN         CONSOLE
Ridwan      Male    62/64   62/62   42y +2y  ~66% orange  Clean
Kamiyanti   Female  60/64   60/60   43y +2y  ~63% orange  Clean
```

Any current run that deviates from Ridwan's validated result should be
investigated before approving.

---

## PERMANENT GAPS (never a FAIL — override Tester if needed)

```
cj      — Kolagen Sendi not in PDF
sk-jc   — same source as cj
mt-bmi  — Kegemukan is section heading in PDF
mt-wc   — Lingkar Pinggang not in PDF table rows
```

---

## HANDOFF

On APPROVE: update `current_run.yaml → baseline_fixture` if this run produces
a new authoritative fixture (new patient or corrected parser version).

On REJECT: return tester_report path and reviewer_report path to the Operator
with the specific BLOCK rule triggered. Operator fixes and re-runs from STEP 2.
