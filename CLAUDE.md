# QRMA Health Screening Dashboard — Project Context for Claude Code

## Project Identity

**Name:** QRMA Health Screening Dashboard  
**Version target:** v4 (successor to qrma-dashboard-v3.html)  
**Root folder:** `F:\TeleTCM_Project\qrma_single\`  
**Output format:** Single self-contained HTML file with embedded CSS and JavaScript  
**Purpose:** Convert QRMA/bioresonance device report values into a structured, domain-level health screening dashboard for clinician-assisted review.

---

## Non-Negotiable Product Rules

These rules must be preserved in every change, refactor, or new feature:

1. **Never produce diagnostic output.** No sentence may say "you have X", "this means disease Y", or assign a percentage probability to a medical event.
2. **Every abnormal flag must answer three questions:** What is flagged? What could this pattern suggest? What standard lab test could confirm or refute it?
3. **Food-first advice** must accompany every domain that shows a flag before any supplement or clinical recommendation.
4. **Confidence labels** must remain visible on every module screen and on the dashboard summary. Labels are: `Well-supported`, `Exploratory`, or `Needs lab confirmation`.
5. **Approved alert language only.** See the Alert Language section below.
6. **The app must run with default values immediately** — no blank-state confusion on first load.
7. **Single HTML file for the dashboard.** No build step, no framework, no external dependencies beyond CDN links already declared in `<head>`. The optional Flask microserver (`03_Scripts/server.py`) handles PDF pipeline automation only — it is a separate process, never embedded in the HTML. The dashboard must remain fully functional without the server running.

---

## Tech Stack

| Layer | Choice |
|---|---|
| Structure | HTML5, semantic sectioning |
| Styling | Embedded CSS with CSS custom properties (design tokens) |
| Logic | Vanilla JavaScript, no framework |
| Charts | Chart.js 4.4.0 (radar + bar charts) |
| Icons | Lucide (unpkg CDN) |
| Fonts | Fontshare — Cabinet Grotesk (headings), Satoshi (body) |
| Theme | Light/dark via `data-theme` attribute on `<html>` |

Do not introduce npm, bundlers, React, Vue, or any framework unless explicitly instructed.

---

## Architecture Pattern

The app is a **single-page application** inside one HTML file. Navigation is JS-driven: sections are hidden/shown via a `nav(id)` function. No routing library is used.

### Preferred internal code organization (even inside one file)

```
CONFIG / CONSTANTS
  - thresholds object
  - pillar weights
  - module metadata array

SCORE ENGINE
  - cBioAge()
  - cOx()
  - cTx()
  - cMt()
  - cCr()
  - cNt()
  - cSk()
  - calcAll()   ← master orchestrator

RENDER HELPERS
  - se(id, val, cls)
  - aal(type, title, body)
  - bar(label, val, max, cls)
  - bmr(name, val, status)
  - ftrow(title, items)
  - lbl(score, lo, hi)
  - clrc(score, lo, hi)

UI / DOM
  - nav(page)
  - drawCharts(scores)
  - buildAction(domainData)

EVENT LISTENERS
  - DOMContentLoaded
  - theme toggle
```

Keep thresholds and weights as named constants near the top of the script block, not buried inside functions.

---

## The 8 Modules

### Module 1 — Biological Age & Multisystem Stress Index
**Confidence:** Well-supported (as a heuristic screening feature, not a validated medical age calculator)  
**Score direction:** Output is an age estimate + delta, not a 0–100 risk score  

**3-Pillar model (must be preserved):**
- Pillar 1: Metabolic / Vascular Wear — blood viscosity, cholesterol plaque, arteriosclerosis, insulin secretion, blood sugar
- Pillar 2: Oxidative / Toxic Burden — free radicals, hypoxia, pH, heavy metals
- Pillar 3: Regenerative Deficits — collagen signals, antioxidant reserves, nutrient status

**Key outputs:** Biological Age, Chronological Age, Age Delta, per-pillar bars  
**Alert triggers:**
- Delta > 3 years → monitor
- Delta > 10 years → high-priority screening follow-up
- Metabolic pillar dominates → prioritize HbA1c, fasting glucose, fasting insulin, lipid panel
- Oxidative pillar dominates → optional inflammation markers only if clinician deems relevant
- Regenerative pillar dominates → nutrient review, protein quality, sleep/recovery workup

---

### Module 2 — Oxidative Stress & Recovery
**Confidence:** Exploratory / Needs lab confirmation  
**Score direction:** Risk (higher = more concern)  

**Inputs:** Glutathione, CoQ10, Vitamin C, Vitamin E, Selenium, Skin Free Radicals  
**Optional:** Hypoxia signal, pH stress signal  

**Two sub-scores:**
- Antioxidant Reserve (glutathione, CoQ10, Vit C, Vit E, Se)
- Pro-oxidant Load (skin free radicals, hypoxia deviation, pH imbalance)

**Food-first:** Citrus, berries, leafy greens, nuts/seeds, Brazil nuts (cautious), polyphenol-rich foods  
**Confirmatory tests:** hsCRP, standard nutrition review, optional oxidative-stress markers  

**Developer note:** Keep visually distinct from Module 3. Low antioxidants must NOT auto-trigger a toxin alert.

---

### Module 3 — Toxic Exposure Flags
**Confidence:** Needs lab confirmation  
**Score direction:** Risk (higher = more concern)  

**Inputs:** Lead, Mercury, Cadmium, Arsenic, Stimulant exposure, Tobacco/Nicotine, Pesticide residue  

**Two sub-scores:**
- Heavy Metal Index
- Lifestyle / Exposure Burden Index

**Alert triggers and confirmatory tests:**
- Elevated lead → Whole blood lead level (BLL)
- Elevated mercury → Blood total mercury + urine mercury speciation
- Elevated cadmium → Urine cadmium (first-morning void)
- Elevated arsenic → Speciated urine arsenic
- Tobacco signal → Cotinine if clinically useful, otherwise history-taking

**Food-first (exposure reduction framing):** Filtered water, reduce high-risk seafood, wash produce, improve protein/fiber/micronutrient sufficiency  
**Forbidden language:** "detox", "poisoning", "toxicity syndrome", "confirmed body burden"

---

### Module 4 — Metabolic Risk
**Confidence:** Well-supported / Needs lab confirmation  
**Score direction:** Risk (higher = more concern)  

**Inputs:** Triglyceride imbalance, Urine glucose coefficient, Insulin secretion coefficient, Fat-metabolism imbalance, BMI, Waist circumference  

**Three sub-scores:**
- Glycemic Burden
- Lipid Burden
- Anthropometric Burden

**Alert triggers:**
- Elevated urine glucose / blood sugar → FPG, HbA1c
- Low insulin secretion / suspected IR → Fasting insulin, HOMA-IR
- Elevated triglycerides → Fasting lipid panel
- Elevated BMI + waist → lifestyle review, body composition context

**Food-first:** Reduce refined carbs, increase legumes/oats/fiber, add fish/olive oil/nuts, emphasize sleep and meal timing  

**Developer note:** Architect this module so QRMA inputs can later coexist with real lab values. Real lab values should always take precedence over QRMA estimates when present.

---

### Module 5 — Cardio-Renal Strain
**Confidence:** Needs lab confirmation  
**Score direction:** Risk (higher = more concern)  

**Inputs:** Cholesterol plaque/crystal signal, Vascular flexibility, Left ventricular ejection resistance, Uric acid, Proteinuria index, Potassium, Magnesium  

**Two sub-scores:**
- Cardiac / Vascular Strain Index
- Renal Strain Index

**Alert triggers:**
- Cholesterol plaque elevated → Fasting lipid panel, ApoB, optional Lp(a)
- Low vascular flexibility → BP monitoring (ABPM), ABI, clinical cardiovascular evaluation
- Proteinuria elevated → Urinalysis, uACR, serum creatinine, eGFR
- High uric acid → Serum uric acid
- Low K or Mg → Serum electrolytes, medication/diet review

**Food-first:** Reduce sodium, improve Mg/K-rich foods (where safe), hydration, reduce ultra-processed foods  

**Developer note:** Always separate renal prompts from cardiac prompts in the action plan even when the combined score is shown together.

---

### Module 6 — Nutrient Sufficiency
**Confidence:** Exploratory  
**Score direction:** Resilience (higher = better reserve)  

**Inputs (10 nutrients):** Zinc, Magnesium, Potassium, Iodine, Silicon, Vitamin B6, Vitamin C, Vitamin D3, Vitamin E, Folate  

**Key outputs:**
- Overall Nutrient Sufficiency Score
- Deficient count (below 75% of reference minimum)
- Optimal count (at or above reference minimum)
- Per-nutrient status chips: normal / borderline / deficient

**Alert triggers:**
- Low Vitamin D3 → 25-OH Vitamin D
- Low Folate or B6 → Standard nutritional labs if clinically needed
- Low Zinc or Magnesium → Dietary review first, then lab confirmation

**Food-first per nutrient:**
- Zinc: pumpkin seeds, shellfish, beef, legumes
- Magnesium: leafy greens, cocoa, nuts, seeds
- Potassium: fruit, potatoes, beans
- Iodine: seafood, dairy, eggs, iodized salt
- Folate: legumes, leafy greens, citrus
- Vitamin D3: fatty fish, eggs, fortified foods + sun exposure

**Developer note:** Do not overstate precision of QRMA-derived nutrient values. This module is for prioritizing dietary discussion and selective confirmatory testing only.

---

### Module 7 — Skin & Collagen Resilience
**Confidence:** Exploratory  
**Score direction:** Resilience (higher = better)  

**Inputs:** Skin Collagen, Skin Elasticity, Transepidermal Water Loss (TEWL), Sebum, Melanin, Sensitivity, Eye Collagen, Joint/Systemic Collagen  

**Two sub-scores:**
- Collagen Index
- Barrier / Skin-Function Index

**Alert triggers:**
- Low collagen pattern → Dietary protein adequacy, Vitamin C cofactors
- High TEWL → Hydration review, skin-barrier support
- Low elasticity → Recovery, sleep, protein, micronutrient review

**Food-first:** Adequate protein, Vitamin C-rich foods, bone broth / gelatin (where culturally appropriate), sulfur-rich foods (garlic, eggs), Omega-3 for skin barrier  

**Developer note:** This module should feel visually lighter and less clinical than cardio-renal or metabolic sections. It is an engagement feature and must not dominate the medical seriousness of the dashboard.

---

### Module 8 — Action Plan
**Confidence:** Aggregated — inherits confidence levels from contributing modules  

**Three output blocks (always in this order):**
1. Recommended confirmatory tests table (ranked High / Medium / Low)
2. Priority food-first actions (per domain)
3. High-priority active alerts

**Deduplication rules:**
- If multiple modules point to metabolic strain, collapse into one combined recommendation
- If a toxin flag is present, prioritize confirmatory testing before lifestyle speculation
- If a renal flag is present, kidney safety labs appear prominently at the top
- If no major flags, show a calm "routine monitoring" message

**Confirmatory test library (reference for scoring engine):**

| Pattern | Suggested tests |
|---|---|
| Glycemic risk | FPG, HbA1c, Fasting insulin |
| Lipid risk | Fasting lipid panel, ApoB, optional Lp(a) |
| Kidney strain | Urinalysis, uACR, serum creatinine, eGFR |
| Electrolyte concerns | Serum electrolytes, magnesium |
| Lead flag | Whole blood lead level |
| Mercury flag | Blood mercury, urine mercury speciation |
| Cadmium flag | Urine cadmium |
| Arsenic flag | Urine arsenic, speciated |
| Vitamin D pattern | 25-OH Vitamin D |
| General nutrient review | Selective micronutrient labs per strongest deficits |

---

## Scoring Conventions

| Convention | Rule |
|---|---|
| Scale | 0–100 normalized for all modules |
| Risk modules | Higher score = higher burden (Oxidative, Toxic, Metabolic, Cardio-Renal) |
| Resilience modules | Higher score = better reserve (Nutrient, Skin) |
| Threshold language | 0–30 = Low Concern · 31–60 = Monitor · 61–100 = Needs Lab Confirmation |
| Chart labels | Must explicitly state whether higher is better or worse |
| Clinical validity | Never imply scores are clinically validated — they are screening heuristics |

---

## Alert Language Standards

### Approved phrases
- "Pattern suggests…"
- "Screening flag…"
- "Consider confirming with…"
- "Monitor trend…"
- "Below reference range pattern…"
- "Higher-than-reference pattern…"
- "Low concern"
- "Biologically older than expected for age"

### Forbidden phrases
- "You have…"
- "This means disease…"
- "42% risk of…"
- "Poisoning"
- "Heart attack chance"
- "Kidney failure risk" (unless from a validated external calculator, clearly separated from QRMA)
- "Detox"
- "Confirmed body burden"
- "Toxic syndrome"

---

## UI / UX Rules

1. App must feel **credible and calm**, not alarming or dramatic.
2. **Sticky top bar** with disclaimer: "For Reference Only · Not a Diagnosis"
3. **Left sidebar navigation** for desktop; bottom navigation for mobile.
4. **Input-first workflow** — user enters values in each module, then clicks Calculate.
5. Every module page shows: total score + label, sub-scores, per-input status chips, food suggestions, confirmatory tests.
6. **Dashboard overview** shows KPI cards for all 8 domains + radar chart + bar chart.
7. Confidence badges must be visible on every module page AND on the dashboard summary.
8. Do not place exploratory modules visually above well-supported modules.
9. Charts must distinguish risk scores from resilience scores in their labels.
10. Every input field must show: current value, unit/scale, and a reference range hint.
11. Support decimal values on all numeric inputs.
12. Default values must produce a meaningful, non-trivial demo result on first run.

---

## Design Tokens (CSS Custom Properties)

The following token names are already established and must be preserved:

```
Colors:     --pri, --priH, --priHi
            --ok, --okHi
            --warn, --warnHi
            --err, --errHi
            --gold, --goldHi
            --blue, --blueHi
            --purp, --purpHi

Surface:    --bg, --surf, --surf2, --sOff, --sOff2
            --div, --brd

Text:       --txt, --txtM, --txtF

Radius:     --rsm, --rmd, --rlg, --rxl, --rfull

Spacing:    --sp1 through --sp16

Typography: --text-xs, --text-sm, --text-base, --text-lg, --text-xl
            --fD (Cabinet Grotesk), --fB (Satoshi)

Shadow:     --shsm, --shmd, --shlg
Transition: --tr
```

Both light and dark themes are defined. Theme toggle is via `data-theme="dark"` on `<html>`.

---

## Source Data Context

The primary reference patient is **Ridwan, 40-year-old male**. The source QRMA report is 95 pages and covers: blood sugar, minerals, vitamins, coenzymes, toxins, heavy metals, skin, collagen, kidney function, blood lipids, and body composition.

The report itself states all values are for reference only and not for diagnosis. This disclaimer must be reflected in all app language.

---

## Engineering Priorities

Work in this order when making changes:

1. **Stabilize scoring architecture** — move all thresholds and weights into one config object; separate input definitions, scoring rules, and rendering logic.
2. **Formalize module metadata** — single source of truth per module for title, confidence, inputs, thresholds, score direction, food actions, confirmatory tests.
3. **Prepare for report ingestion** — design a parser/mapping layer so future versions can auto-populate fields from a parsed QRMA PDF or CSV.
4. **Dual-view output** — future toggle between Consumer view (simplified) and Clinician view (expanded sub-scores, raw values, reference ranges).

---

## QA Checklist (run before every release)

- [ ] All 8 modules calculate independently without errors
- [ ] Dashboard summary updates when any module score changes
- [ ] Confidence badges display correctly on all module pages
- [ ] No output contains diagnostic claims
- [ ] Every flagged result has at least one food-first suggestion or confirmatory test prompt
- [ ] Charts do not invert score direction (risk vs resilience labels are correct)
- [ ] Mobile navigation exposes all 8 modules
- [ ] Default values produce a meaningful, non-trivial first-run demo state
- [ ] Light and dark themes both render without broken colors
- [ ] No external dependencies beyond CDN links already declared in `<head>`

---

## Future Refactor Path

If the project outgrows a single file, split in this order:

```
/modules
  biological-age.js
  oxidative.js
  toxic.js
  metabolic.js
  cardio-renal.js
  nutrient.js
  skin.js
  action-plan.js

/core
  thresholds.js
  severity.js
  score-utils.js
  mappings.js

/ui
  cards.js
  charts.js
  forms.js
  alerts.js
```

Even while the app remains a single HTML file, internal code organization should mirror this structure.

---

## HRV Integration Rules

These rules govern all HRV-related work across all future builds. They are non-negotiable and must be preserved alongside the product rules above.

### Architectural Rules

1. **HRV is its own domain.** It has its own vocabulary, rules, and systemization. Never collapse HRV into QRMA zone language (`normal/ringan/sedang/berat`).
2. **HRV never alters QRMA scores.** The 7 module calculators (`cBioAge`, `cOx`, `cTx`, `cMt`, `cCr`, `cNt`, `cSk`) must never read from `hrvState`. HRV is additive only.
3. **HRV renders independently.** It does not gate on QRMA alerts. It displays its own findings based purely on its own data and its own rules.
4. **Missing HRV must never break anything.** If `hrvState` is null, the dashboard behaves exactly as it does without HRV. Option A empty state: neutral strip reading *"No HRV data for this session."*
5. **HRV logic lives in `hrv-engine.js`.** All ALI computation, band classification, protocol selection, and corroboration rules are in this separate module file. Never inline HRV logic into the main HTML script block.

### ALI Vocabulary (do not translate to QRMA zone words)

| Band | RMSSD Range | Meaning |
|---|---|---|
| Very Low | < 20 ms | Severe vagal withdrawal |
| Low | 20–40 ms | Suboptimal vagal tone |
| Adaptive | 40–70 ms | Reasonable autonomic flexibility |
| High | > 70 ms | Strong parasympathetic tone |

### Display Rules

1. **HRV Sidebar Module** — dedicated section with: Autonomic Status Card (RMSSD / ALI / HR / Quality), ALI-gated micro-protocol stack (show only current ALI protocols, never show deferred ones), Reading Provenance block, and compliance disclaimer.
2. **Per-module top panel** — a 2-line strip at the top of each of the 7 module pages: Line 1 = vitals (RMSSD · ALI band · HR · Quality). Line 2 = one module-specific context sentence. No micro-protocols here — those live in the HRV sidebar module only.
3. **Micro-protocol display is ALI-gated:** Very Low → V1, V3, V4 only. Low → V1, V2, V3, V4. Adaptive → V1, V2, V3, V4, V5. High → V2, V4, V5. Never show deferred protocols or "coming soon" language.
4. **HRV uses its own CSS color classes** — separate from `zone-normal/ringan/sedang/berat`. Color translation happens only at render time.

### Data Contract

`hrvState` is a session-only in-memory object (no database, no localStorage for Phase 1). Fields:

```javascript
{
  // Provenance
  readingTimestamp, device, protocol,
  // Quality gate (3 fields — not one boolean)
  durationSec, artifactPct, qualityFlag,  // qualityFlag: pass|caution|reject
  // Raw metrics
  meanHr, rmssd, sdnn, lnRmssd, lfHfRatio,
  // Derived (computed by hrv-engine.js)
  rmssdBand, baselineStatus, autonomicLoadIndex, recoveryState, readinessBand
}
```

### Compliance

All HRV output uses screening/wellness language only. Approved phrases mirror the QRMA alert language standards. Forbidden: any diagnostic claim, any statement that HRV confirms a disease, any implication that ALI is a validated clinical index.

---

## Final Instruction

Do not start by redesigning colors or charts. Start by preserving the product philosophy, then verify all eight modules follow the same contract:

1. Clear inputs with reference ranges
2. Transparent score intent and direction
3. Confidence label visible
4. Non-diagnostic wording throughout
5. Food-first advice
6. Confirmatory test recommendations
7. Dashboard summary output

The next best contribution is always **cleaner module architecture, better source-to-input mapping, and safer clinical wording** — not more features.
