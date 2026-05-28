# Dashboard Operator Report
run_id:       run_ridwan_20260528
date:         2026-05-28
operator:     Claude (Operator role — static code analysis, no live browser)
dashboard:    qrma-dashboard-v3.html
patient:      ridwan
json_source:  01_Data\json\fixtures\ridwan_2025-11-10.json

> NOTE: current_run.yaml is set to Kamiyanti. This run uses the Ridwan fixture
> per explicit user instruction. Browser-dependent checks (console, dark mode,
> render fidelity) are flagged as MANUAL VERIFY — scores and logic are fully
> computed from fixture data + source code analysis.

---

## Import Result

fields_populated:    62 / 64
zones_populated:     62 (non-unknown)
permanent_gaps:      mt-bmi, mt-wc (as expected — unknown zones, no PDF source)
fixture_warnings:    "DASHBOARD FIELDS NOT POPULATED (2): mt-bmi | mt-wc"

NOTE: CLAUDE.md baseline states 60/64. The fixture (generated 2026-05-27) now
populates cj (5.271) and sk-jc (5.271) from the new "Sistem Pergerakan" mapping.
The 60/64 baseline is outdated. Current correct count is 62/64.

unexpected_warnings: none — only the expected 2 permanent gaps.

---

## Bio Age

displayed:   42y (+2y)
baCls:       cok (delta=2, not >3 threshold)

Pillar breakdown:
  p1 (Metabolic/Vascular):    1.6   [bv:1, cp:1, art:4, ins:1, bs:1]
  p2 (Oxidative/Toxic):       1.0   [fr:1, hyp:1, ph:1, pb:1, hg:1]
  p3 (Regenerative Deficits): 2.9   [ce:4, cs:7, cj:4, coq:1, gsh:1, vc:1, ve:1, ost:4]
  offset: (1.6×0.35 + 1.0×0.35 + 2.875×0.30) × 1.2 = 2.13y

Matches CLAUDE.md validated baseline: 42y (+2y) ✓

---

## Module Scores (computed from fixture zones)

| Module      | Score | Sub-scores                    | lbl()                  |
|-------------|-------|-------------------------------|------------------------|
| basic       | —     | p1=1.6, p2=1.0, p3=2.9        | —                      |
| oxidative   | 5%    | ax=100%, px=11%               | Low Concern (≤30)      |
| toxic       | 11%   | hm=11%, lb=11%                | Low Concern (≤25)      |
| metabolic   | 20%   | gc=11%, lp=44%                | Low Concern (≤30)      |
| cardio      | 15%   | cai=11%, ri=19%               | Low Concern (≤30)      |
| nutrient    | 97%   | def=0, opt=9/10               | Sufficient (≥70)       |
| skin        | 68%   | cl=56%, bf=67%, sn=100%       | Moderate Concern (≥50) |
| overall_alv | 14%   | —                             | Low Stress (≤30)       |

---

## Module Card Colours (moduleZoneColor — worst zone wins)

| Module    | Colour class | Reason                                    |
|-----------|--------------|-------------------------------------------|
| basic     | cwarn        | cs_zone = sedang (Skin Collagen basic)    |
| oxidative | cok          | all ox-* zones normal                     |
| toxic     | cok          | all tx-* zones normal                     |
| metabolic | cok          | mt-tg/fm = ringan, none sedang/berat      |
| cardio    | cok          | cr-k = ringan, none sedang/berat          |
| nutrient  | cok          | nt-k = ringan, none sedang/berat          |
| skin      | cwarn        | sk-sc_zone = sedang                       |

DISCREPANCY vs CLAUDE.md skill expectation:
  Skill expected: Oxidative=orange, Toxic=orange/red, Metabolic=orange, Cardio=orange, Nutrient=orange
  Actual computed: all green except basic and skin (both orange)
  Explanation: All risk module zones are normal/ringan in this fixture. Raw numeric
  values in buildAction() fire independently of zone colours (Pending Change #2).

---

## Zone Chips — Notable Values

Sedang (orange chips):
  cs       2.690   sedang   (Basic module — Skin Collagen proxy)
  sk-sc    2.690   sedang   (Skin module — same value)

Ringan (blue chips) — full list:
  art      140.716  ringan
  ce       3.484    ringan
  cj       5.271    ringan
  ost      183.072  ringan
  mt-tg    3.237    ringan
  mt-fm    5.795    ringan
  cr-k     0.637    ringan
  nt-k     0.637    ringan
  sk-el    2.569    ringan
  sk-tw    1.475    ringan
  sk-sb    26.711   ringan   ← SEE FLAG BELOW
  sk-ec    3.484    ringan
  sk-jc    5.271    ringan

FLAG — sk-sb (Sebum): raw value 26.711, zone=ringan.
  Form reference range is Normal: 3.0–6.0. Value 26.711 is ×4.5 above upper normal.
  Zone says ringan (not sedang/berat) so the oily-pattern sebum gate does NOT fire.
  Dry gate (sbRaw < 14.477) also does not fire (26.711 > 14.477).
  RESULT: No sebum alert rendered. The zone may be mis-classified for this value.
  Tester to verify whether sk-sb_zone=ringan is correct for a value of 26.711.

---

## Action Plan — Flags Generated

| Priority | Domain               | Finding                          | Threshold used        |
|----------|----------------------|----------------------------------|-----------------------|
| High     | Cholesterol Signal   | Plaque signal 67.2               | cr.ch > 50 (raw)      |
| High     | Renal: Proteinuria   | Proteinuria index elevated       | cr.pt > 3 (raw)       |
| Medium   | Cadmium Exposure     | Cadmium signal borderline        | tx.cd > 0.5 (raw)     |
| Medium   | Vascular Flexibility | Low vascular signal (2.0)        | cr.vf < 6 (raw)       |

NOTE (Pending Change #2): All 4 flags fired on RAW numeric thresholds while the
zone system reports the corresponding fields as "normal" (cr-ch, cr-pt, cr-k,
cr-vf, tx-cd all = normal zone). This is the known zone-gate migration backlog.
Tester should flag this as a logic inconsistency to track.

Food section: No food rows rendered (all module scores below food thresholds).
Fallback text displayed: "Continue balanced whole-foods diet."

High-priority alert panel: Cholesterol Signal + Renal: Proteinuria rendered as .aerr alerts.

---

## Language Check

Scanned buildAction() output for forbidden terms:
  ❌ "You have…"            — NOT present ✓
  ❌ "This means disease…"  — NOT present ✓
  ❌ "Detox" / "Poisoning"  — NOT present ✓
  ❌ "Confirmed body burden" — NOT present ✓
  ❌ "Heart attack chance"  — NOT present ✓
  ❌ "Kidney failure risk"  — NOT present ✓

Approved language confirmed:
  "Plaque signal…"           ✓
  "Proteinuria index elevated" ✓
  "Cadmium signal borderline" ✓
  "Low vascular signal"       ✓
  "Confirm: …" on all rows    ✓

violations: none

---

## Console

MANUAL VERIFY — no live browser run.
Expected: 0 errors. Debug logs present:
  console.log('mode:', _importMode)   — will print on every confirmImport() call
  console.log('payload:', ...)        — will print on every confirmImport() call
  (These debug lines added for troubleshooting — recommend removing before release)

---

## Dark Mode

MANUAL VERIFY — no live browser run.
Code review: all zone chip colours use CSS custom properties (--ok, --gold, --err, --blue).
All surface/text tokens have dark-mode overrides at [data-theme="dark"].
No hardcoded hex colours on zone chips.
Expectation: dark_mode_ok = true.

---

## Pending Changes Status (from CLAUDE.md)

| # | Change                              | Status           |
|---|-------------------------------------|------------------|
| 1 | Language toggle button              | DONE ✓           |
| 2 | buildAction() zone gates            | NOT YET — active |
| 3 | Sebum bidirectional alert           | DONE ✓ (partial) |

Pending Change #2 is the primary source of the logic inconsistency noted above.
Pending Change #3 (sebum) is implemented but the sk-sb zone classification for
value 26.711 warrants tester review.

---

## Handoff Note

Ready for Tester: yes
Blockers: none

Items for Tester attention:
  1. sk-sb zone=ringan for raw value 26.711 — verify correct zone classification
  2. buildAction() fires 4 flags on raw thresholds while zones say normal — known
     Pending Change #2, document as open issue not a failure
  3. Two debug console.log lines in confirmImport() — flag for removal pre-release
  4. Field count is now 62/64, not 60/64 — CLAUDE.md baseline needs updating
     after Tester/Reviewer confirm the new Sistem Pergerakan mapping is correct
