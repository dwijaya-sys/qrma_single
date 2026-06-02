# Module 9 — Gut / Digestive Function
# QRMA Dashboard v5.0 Specification

**Status:** Design locked — ready to build  
**Date:** 2026-06-02  
**Version target:** qrma-dashboard-v5.html  
**Depends on:** Build 3b complete (body comp panel + cMt() rewrite)  
**Does NOT modify:** Any existing module (1–8), HRV engine, body comp pipeline

---

## 1. VERSION RATIONALE — WHY v5.0

v4.x is the HRV + Flask era (8 modules + HRV sidebar).  
v5.0 is the first build where QRMA covers a genuinely new clinical domain — digestive function — that was previously unscored despite the data existing in the PDF.

Version bump justification:
- New module (module count goes from 8 to 9)
- New field IDs (`dg-*` namespace — 9 new fields)
- `mappings.json` updated with module assignments for previously unmapped fields
- `calcAll()` gains a new scoring function `cDg()`
- Radar chart gains a 9th axis
- `buildAction()` gains a new digestive section
- Action plan gains food-first + red flag logic for gut domain

All other modules, HRV, body comp panel unchanged. Upgrade is additive only.

---

## 2. THE CRITICAL INSIGHT — DATA ALREADY EXISTS

**These parameters are already in the QRMA PDF and already parsed by `parser_v3.py`.**  
They are in `mappings.json` with `"dashboard_id": ""` — meaning the parser extracts them but nothing uses them.

This is not a new module that needs new data. It is **activating fields that have been sitting idle since the parser was built.**

| dashboard_id | mappings.json key (Indonesian) | Normal range | Ridwan actual | Zone |
|---|---|---|---|---|
| `dg-lp` | Gerakan Peristaltik Lambung | 58.425–61.213 | 55.724 | ringan |
| `dg-la` | Fungsi Penyerapan Lambung | 34.367–35.642 | 34.531 | normal |
| `dg-sp` | Gerakan Peristaltik Usus Halus | 133.437–140.476 | 132.189 | ringan |
| `dg-sa` | Fungsi Penyerapan Usus Halus | 3.572–6.483 | 3.154 | berat |
| `dg-lc` | Kofisien Fungsi Peristaltik Usus Besar | 4.572–6.483 | 3.771 | ringan |
| `dg-ca` | Koefisien Penyerapan Kolon | 2.946–3.815 | 1.942 | berat |
| `dg-bi` | Koefisien Bakteri Usus | 1.734–2.621 | (variable) | (TBD) |
| `dg-ip` | Koefisien Tekanan Intraluminal | 1.173–2.297 | 3.206 | berat |
| `dg-ds` | Sistem Pencernaan (overall) | 3.492–4.723 | (variable) | (TBD) |

**Ridwan's data reveals a genuinely significant gut picture already hidden in the parsed output:**  
- `dg-sa` (Small Intestine Absorption) → berat  
- `dg-ca` (Colonic Absorption) → berat  
- `dg-ip` (Intraluminal Pressure) → berat  
- `dg-lp`, `dg-sp`, `dg-lc` → all ringan

This is Cluster B (Digestive-Gut-Liver) in the Logic Layer spec. The data was always there.

---

## 3. FIELD DEFINITIONS

### 3.1 Field table

| Field ID | Label (EN) | Label (ID) | Normal Range | Unit | Zone direction | Confidence |
|---|---|---|---|---|---|---|
| `dg-lp` | Gastric Peristalsis | Gerakan Peristaltik Lambung | 58.425–61.213 | index | Lower worse | Exploratory |
| `dg-la` | Gastric Absorption | Fungsi Penyerapan Lambung | 34.367–35.642 | index | Lower worse | Exploratory |
| `dg-sp` | Small Intestine Peristalsis | Gerakan Peristaltik Usus Halus | 133.437–140.476 | index | Lower worse | Exploratory |
| `dg-sa` | Small Intestine Absorption | Fungsi Penyerapan Usus Halus | 3.572–6.483 | index | Lower worse | Exploratory |
| `dg-lc` | Large Intestine Motility | Kofisien Fungsi Peristaltik Usus Besar | 4.572–6.483 | index | Lower worse | Exploratory |
| `dg-ca` | Colonic Absorption | Koefisien Penyerapan Kolon | 2.946–3.815 | coeff | Lower worse | Exploratory |
| `dg-bi` | Intestinal Bacteria Balance | Koefisien Bakteri Usus | 1.734–2.621 | coeff | Lower worse | Exploratory |
| `dg-ip` | Intraluminal Pressure | Koefisien Tekanan Intraluminal | 1.173–2.297 | coeff | Higher worse | Exploratory |
| `dg-ds` | Digestive System Overall | Sistem Pencernaan | 3.492–4.723 | index | Lower worse | Exploratory |

**Direction note for `dg-ip`:** Intraluminal pressure — higher is worse (spasm, pressure build-up). This is the only field in the module where the zone direction is inverted relative to the others. `bd()` (burden score) handles this correctly because it works from zone labels, not raw values. Zone classification at parse time must correctly derive berat for values > upper range, not below it.

**`dg-ds` note:** "Sistem Pencernaan" is a composite index from the QRMA device. Treat as a secondary corroborating signal, not a primary input to scoring. Weight is lower (see Section 4).

### 3.2 mappings.json updates required

For each of the 9 fields above, update `mappings.json`:

```json
{
  "id": "Gerakan Peristaltik Lambung",
  "en": "Gastric Peristalsis",
  "dashboard_id": "dg-lp",
  "module": "digestive",
  "normal_range": "58.425-61.213",
  "actual_value": 0.0,
  "needs_verification": false,
  "note": "Gastric peristalsis index. Lower = reduced gastric motility."
}
```

Repeat for all 9. Assign `"module": "digestive"` to each.

---

## 4. SCORING FUNCTION — cDg()

### 4.1 Sub-index structure

```
Module 9: Gut / Digestive Function
│
├── Sub-index A: Motility / Transit     (weight 40%)
│   dg-lp (Gastric Peristalsis)
│   dg-sp (Small Intestine Peristalsis)
│   dg-lc (Large Intestine Motility)
│
├── Sub-index B: Absorption / Environment   (weight 35%)
│   dg-la (Gastric Absorption)
│   dg-sa (Small Intestine Absorption)
│   dg-ca (Colonic Absorption)
│   dg-bi (Intestinal Bacteria Balance)
│
└── Sub-index C: Pressure / Integrity    (weight 25%)
    dg-ip (Intraluminal Pressure)
    dg-ds (Digestive System Overall — secondary corroboration)
```

**Red Flag Override:** Not a sub-index score — a boolean gate. If triggered, scoring is bypassed entirely and a referral message replaces the score display. See Section 4.3.

### 4.2 cDg() implementation

```javascript
function cDg() {
  const zd   = window.zoneData || {};
  const rfEl = document.getElementById('dg-redflag');
  const rf   = rfEl ? rfEl.checked : false;

  // ── Red Flag Override ─────────────────────────────────────────────────
  // If operator has flagged alarm symptoms, bypass all scoring.
  // Return special state that buildAction() and the render layer detect.
  if (rf) {
    return {
      s:        null,
      redFlag:  true,
      mt: null, ab: null, pi: null
    };
  }

  // ── Burden score helper ───────────────────────────────────────────────
  // normal(9)→1  ringan(6)→4  sedang(3)→7  berat(1)→9  unknown→5
  function bd(id) {
    const s = scoreFromZone(zd[id + '_zone'] || 'unknown');
    return s === 0 ? 5 : 10 - s;
  }

  // Raw value helper
  function g(id) {
    return parseFloat(document.getElementById(id)?.value) || null;
  }

  // ── Sub-index A: Motility / Transit (40%) ────────────────────────────
  // All three are "lower is worse" → burden score used directly
  const mt = ((bd('dg-lp') + bd('dg-sp') + bd('dg-lc')) / 3) * (100 / 9);

  // ── Sub-index B: Absorption / Environment (35%) ──────────────────────
  // All four are "lower is worse" → burden score used directly
  // dg-bi may be unknown if not present in PDF — bd() returns 5 (neutral)
  const ab = ((bd('dg-la') + bd('dg-sa') + bd('dg-ca') + bd('dg-bi')) / 4) * (100 / 9);

  // ── Sub-index C: Pressure / Integrity (25%) ──────────────────────────
  // dg-ip: higher is worse — burden score is correct for this direction
  // dg-ds: secondary corroboration, half weight
  const pi = ((bd('dg-ip') * 1.5 + bd('dg-ds') * 0.5) / 2) * (100 / 9);

  // ── Combined score ────────────────────────────────────────────────────
  const s = Math.min(100, Math.max(0, Math.round(
    mt * 0.40 + ab * 0.35 + pi * 0.25
  )));

  // ── Pattern detection (for buildAction context labels) ────────────────
  // Used by buildAction() to generate specific alert copy, not for scoring
  const bloatingConstipation =
    (zd['dg-ip_zone'] === 'berat' || zd['dg-ip_zone'] === 'sedang') &&
    (zd['dg-lc_zone'] === 'berat' || zd['dg-lc_zone'] === 'sedang');

  const upperGiStrain =
    (zd['dg-lp_zone'] === 'berat' || zd['dg-lp_zone'] === 'sedang') &&
    (zd['dg-sa_zone'] === 'berat' || zd['dg-sa_zone'] === 'sedang');

  const absorptionDeficit =
    (zd['dg-sa_zone'] === 'berat') || (zd['dg-ca_zone'] === 'berat');

  return {
    s,
    redFlag:            false,
    mt:                 Math.round(mt),
    ab:                 Math.round(ab),
    pi:                 Math.round(pi),
    // Individual field values for display
    lp: g('dg-lp'), la: g('dg-la'),
    sp: g('dg-sp'), sa: g('dg-sa'),
    lc: g('dg-lc'), ca: g('dg-ca'),
    bi: g('dg-bi'), ip: g('dg-ip'), ds: g('dg-ds'),
    // Pattern flags for action plan
    bloatingConstipation,
    upperGiStrain,
    absorptionDeficit
  };
}
```

### 4.3 Red Flag Override — operator checkbox

A single checkbox on the module input panel:

```
☐  Alarm symptoms present (blood in stool / significant weight loss /
   nocturnal diarrhoea / persistent vomiting / fever with GI symptoms)
```

When checked:
- `cDg()` returns `{ s: null, redFlag: true }`
- Module card shows: `"Refer for clinical review"` instead of a score
- Score ring is replaced with a warning icon
- No food-first or confirmatory test suggestions — only: `"Please consult a healthcare professional promptly. This pattern requires clinical evaluation."`
- `buildAction()` checks for `redFlag` before generating gut action plan items

This is consistent with the Modul 9 spec's safety gate (9.10 Red Flag Override) and the Logic Layer's use of calprotectin as the functional-vs-inflammatory differentiator.

### 4.4 Score direction and display bands

Module 9 is a **risk module** (higher score = more concern) — same direction as Oxidative, Toxic, Metabolic, Cardio-Renal.

| Score | Display band | Card colour |
|---|---|---|
| 1–3 | Low Concern | green |
| 4–7 | Monitor | orange |
| 8–10 | Needs Lab Confirmation | red |

**Wait — risk module score convention check:**  
In `cMt()`, `cOx()`, etc., the score output 0–100 maps to "higher = more burden". The display bands in the module card then invert for display (1–3 → Low Concern because score 0–30 = low burden). `cDg()` follows the same pattern — output is a 0–100 burden score, display bands are consistent.

---

## 5. DISPLAY / UI SPEC

### 5.1 Module page structure

Follows the same pattern as all other modules:

```
[Header]   Gut / Digestive Function
           Functional digestive pattern assessment
           [Exploratory badge]

[Input panel]
  Sub-section: Gastric (Upper GI)
    dg-lp   Gastric Peristalsis        [input]  Normal: 58.4–61.2
    dg-la   Gastric Absorption         [input]  Normal: 34.4–35.6

  Sub-section: Small Intestine (Mid-GI)
    dg-sp   SI Peristalsis             [input]  Normal: 133.4–140.5
    dg-sa   SI Absorption              [input]  Normal: 3.6–6.5

  Sub-section: Large Intestine / Colon (Lower GI)
    dg-lc   Large Intestine Motility   [input]  Normal: 4.6–6.5
    dg-ca   Colonic Absorption         [input]  Normal: 2.9–3.8

  Sub-section: Microbiome & Pressure
    dg-bi   Intestinal Bacteria        [input]  Normal: 1.7–2.6
    dg-ip   Intraluminal Pressure      [input]  Normal: 1.2–2.3
    dg-ds   Digestive System Overall   [input]  Normal: 3.5–4.7

  ⚠ Red Flag Override:
    ☐ Alarm symptoms present (blood in stool, significant weight loss,
      nocturnal diarrhoea, persistent vomiting, fever with GI symptoms)

[Calculate button]

[Result panel — shown after calcAll()]
  Gut Function Score     [score ring]
  Motility / Transit     [sub-bar]   40%
  Absorption / Env.      [sub-bar]   35%
  Pressure / Integrity   [sub-bar]   25%

[HRV strip — 2 lines]
  Vagal tone data  |  "Metabolic stress and autonomic load have a
                      bidirectional relationship — each amplifies the other."
                      (reuses Metabolic HRV context sentence — appropriate for gut)
```

### 5.2 Pattern labels (conditional, shown in result panel)

When pattern flags fire from `cDg()`, show a labelled sub-card:

```
Pattern: "Bloating with Constipation-like pattern"
  Elevated intraluminal pressure + reduced large intestine motility

Pattern: "Upper GI Digestion Strain pattern"
  Reduced gastric motility + reduced small intestine absorption

Pattern: "Absorption Deficit pattern"
  Reduced small intestine or colonic absorption — 
  consider nutrient status review
```

These are **descriptive labels only** — not diagnoses. Consistent with approved alert language (Section 8 of PROJECT_MAP).

### 5.3 Radar chart

Add `dg` as the 9th axis. Label: `"Gut"`. Direction: inward = better (same as risk modules).

---

## 6. MAPPINGS.JSON UPDATES

### Fields to update (set dashboard_id and module)

```json
{ "id": "Gerakan Peristaltik Lambung",          "dashboard_id": "dg-lp", "module": "digestive" },
{ "id": "Fungsi Penyerapan Lambung",             "dashboard_id": "dg-la", "module": "digestive" },
{ "id": "Gerakan Peristaltik Usus Halus",        "dashboard_id": "dg-sp", "module": "digestive" },
{ "id": "Fungsi Penyerapan Usus Halus",          "dashboard_id": "dg-sa", "module": "digestive" },
{ "id": "Kofisien Fungsi Peristaltik Usus Besar","dashboard_id": "dg-lc", "module": "digestive" },
{ "id": "Koefisien Penyerapan Kolon",            "dashboard_id": "dg-ca", "module": "digestive" },
{ "id": "Koefisien Bakteri Usus",                "dashboard_id": "dg-bi", "module": "digestive" },
{ "id": "Koefisien Tekanan Intraluminal",        "dashboard_id": "dg-ip", "module": "digestive" },
{ "id": "Sistem Pencernaan",                     "dashboard_id": "dg-ds", "module": "digestive" }
```

### Zone derivation rules for parser_v3.py

All fields use standard zone derivation from normal ranges **except `dg-ip`**:

```
Standard (lower = worse):
  value < lower_bound → berat if < lower × 0.7, else sedang
  value within range  → normal
  value > upper_bound → ringan (mild excess, context-dependent)

EXCEPTION — dg-ip (Intraluminal Pressure, higher = worse):
  value < lower_bound → normal (low pressure = no concern)
  value within range  → normal
  value > upper_bound → ringan if < upper × 1.25, sedang if < upper × 1.6, berat if ≥ upper × 1.6
```

Ridwan's `dg-ip = 3.206` with normal range `1.173–2.297`:
- `3.206 / 2.297 = 1.40` → between 1.25 and 1.60 → **sedang** (not berat as initially estimated above)

This must be verified against the parser's zone derivation logic. The QRMA PDF shows the zone bar visually for each parameter — use that as ground truth for the first QA run.

---

## 7. ACTION PLAN — buildAction() additions

### Confirmatory tests (show when score ≥ 4 or any sub-index ≥ 4)

```
Motility flag:
  "Consider keeping a bowel diary and Bristol stool scale assessment
   to establish a baseline transit pattern."

Absorption flag:
  "A pattern suggesting reduced intestinal absorption may be worth
   reviewing alongside your nutrient status — Vitamin B12, iron,
   and fat-soluble vitamins are common areas to check."
   Confirmatory: "Serum B12, ferritin, 25-OH Vitamin D, full blood count"

Bacteria flag:
  "An intestinal bacteria imbalance pattern may respond to dietary
   changes before any clinical intervention."
   Confirmatory: "Discuss with clinician only if persistent symptoms suggest
   SIBO or inflammatory bowel disease — breath testing, fecal calprotectin"

Pressure / bloating flag:
  "Elevated intraluminal pressure pattern is often functional.
   Reducing fermentable carbohydrates and eating pace may help."

Red flag override:
  "⚠ Alarm symptoms were recorded for this session.
   This module's findings should not be interpreted without clinical evaluation.
   Please consult a healthcare professional promptly."
   → Suppress all other action plan items for this module
```

### Food-first (always show when module is flagged)

```
• Eat smaller, more frequent meals — reduce gastric volume load
• Slow eating — 20+ minutes per meal, chew thoroughly
• Warm water or herbal tea with meals (ginger, peppermint if tolerated)
• Walking 10–15 minutes after lunch (Small Intestine peak: 1–3pm)
• Increase dietary fibre gradually — sudden high fibre worsens bloating
• Low-FODMAP trial for 2–4 weeks if bloating-predominant pattern
• Reduce carbonated drinks and sugar alcohols (sorbitol, xylitol)
• Prebiotic-rich foods: leek, garlic, onion (if tolerated), oats, banana
• Fermented foods in small amounts if tolerated: tempeh, kimchi, kefir
• Avoid eating under stress — activate rest-and-digest before meals
```

---

## 8. HRV INTEGRATION — MODULE 9

### HRV strip context sentence

```
"The vagus nerve directly governs gut motility and digestive enzyme secretion.
 Low autonomic load index is associated with reduced peristalsis and impaired
 digestive transformation."
```

This replaces the generic metabolic sentence for the gut module. The mechanistic link (vagal tone → gastric motility) is well-established and consistent with the HRV Integration Design Document's Cluster B deep dive.

### HRV protocol alignment

When `dg` module score ≥ 4 AND HRV ALI band is `very_low` or `low`:

Show additional note in the HRV strip:
```
"HRV Micro-Protocol V1 (Pre-Meal Vagal Warm-Up) is recommended before each
 main meal to support digestive function."
```

This directly implements the Logic Layer's Cluster B → MP-V1 recommendation. It is a **display-only suggestion** — it does not change ALI, does not change any scores.

---

## 9. LOGIC LAYER SPEC — APPLICABILITY ASSESSMENT

The uploaded `Logic_Layer_Specification_Document__QRMA-GDV_Health_Intelligence_Engine.docx` is a **separate, more advanced system** than the current QRMA dashboard. Here is a precise statement of what applies now vs. what requires future work.

### APPLICABLE NOW (v5.0 or current builds)

| Component | Status | Notes |
|---|---|---|
| CR-004: Gastric peristalsis → Stomach meridian | **Applicable** | `dg-lp` now mapped. GDV not needed for QRMA-side of rule. |
| CR-005: Large intestine motility → LI meridian | **Applicable** | `dg-lc` now mapped. |
| CR-006: Gut bacteria → Spleen/Immune | **Applicable** | `dg-bi` now mapped. |
| Cluster B definition (Digestive-Gut-Liver axis) | **Applicable** | `cDg()` sub-indices mirror Cluster B: Motility + Absorption + Pressure |
| Pattern 03 (Spleen Qi Deficiency) QRMA criteria | **Partially applicable** | Small intestine absorption (`dg-sa`) and gut bacteria (`dg-bi`) are now mapped. Blood glucose + B12 criteria already in existing modules. |
| HRV Micro-Protocol V1 (Pre-Meal Vagal Warm-Up) | **Applicable** | Already in hrv-engine.js protocol stack. Module 9 HRV strip surfaces it when gut + low HRV co-occur. |
| Food-first protocols (Pattern 03 + 07) | **Applicable** | Food-first table in Logic Layer §6.2 and §6.4 directly informs Module 9 action plan. Already incorporated above. |
| TCM organ clock (digestive relevance) | **Applicable** | 7–9am Stomach peak, 9–11am Spleen peak, 1–3pm Small Intestine peak — referenced in food-first and HRV protocol timing above. |
| Wellness protocol for Cluster B + A combined | **Applicable** | Diet integration sequence (§6.5) informs action plan priority ordering. |

### NOT APPLICABLE NOW (requires GDV instrument)

| Component | Reason |
|---|---|
| All GDV threshold values (Joules, sector energy) | GDV/Bio-Well camera not integrated. No GDV data in session JSON. |
| Bidirectional correlation rules (full CR-001 to CR-024) | Require BOTH QRMA + GDV readings to fire. QRMA-only half of rules is informative but not activatable without GDV. |
| TCM pattern activation (Patterns 01–07) | All patterns require `min_gdv_criteria` ≥ 1–2 to activate. Cannot activate from QRMA alone per spec design. |
| Cluster scoring (A, B, C) | Formally defined with GDV criteria. QRMA-only version would be a subset approximation. |
| AI narrative generation (Section 5 prompt) | Requires full dual-instrument data payload. Not suitable for QRMA-only session. |
| Chakra alignment, lifestyle domain scores | Bio-Well exclusive outputs. |

### DESIGN DECISION — GDV integration path

The Logic Layer is a **future architecture layer** that sits on top of the current QRMA engine. The current dashboard is the QRMA foundation. When GDV is added:

```
Current (v4/v5):    QRMA PDF → parser → session JSON → dashboard → 8/9 modules
Future (v6+):       QRMA PDF + GDV PDF → dual parser → enriched session JSON
                    → dashboard (existing) + correlation rules engine
                    → TCM pattern matching → AI narrative (Claude API call)
```

The Logic Layer's AI narrative prompt template (Section 5 of the spec) is designed exactly for this — it accepts a structured payload and calls an LLM to generate a bilingual wellness education report. This is consistent with the Anthropic API capability in the project's artifact system.

**Recommended backlog item:** `B16 — GDV integration layer (v6.0)`: dual-instrument session JSON schema, GDV parser, correlation rules engine, TCM pattern activation, AI narrative generation using Claude API.

---

## 10. ALERT LANGUAGE — MODULE 9

All output must follow Section 8 of PROJECT_MAP.md alert language rules.  
Additional gut-specific rules:

| Forbidden | Use instead |
|---|---|
| "You have IBS" | "Pattern suggests functional gut sensitivity" |
| "Leaky gut" | "Intestinal barrier pattern" |
| "Dysbiosis confirmed" | "Intestinal bacteria balance pattern" |
| "Candida overgrowth" | Do not mention — not a QRMA output |
| "Detox your gut" | "Support digestive function through..." |
| "Gut rot" / "toxic bowel" | Never |
| "You are constipated" | "Reduced transit pattern" |
| Any mention of inflammatory bowel disease | Only under red flag: "requires clinical evaluation" |

---

## 11. BUILD CHECKLIST — v5.0

```
mappings.json:
  [ ] 9 fields updated with dashboard_id and module: "digestive"
  [ ] dg-ip zone direction noted in parser comment

parser_v3.py:
  [ ] Verify dg-ip zone derivation uses inverted direction
  [ ] Smoke test: Ridwan's dg-sa = berat, dg-ca = berat, dg-ip ≈ sedang

qrma-dashboard-v5.html:
  [ ] New section pg-digestive added (same structure as other modules)
  [ ] 9 input fields: dg-lp, dg-la, dg-sp, dg-sa, dg-lc, dg-ca, dg-bi, dg-ip, dg-ds
  [ ] Red flag checkbox: id="dg-redflag"
  [ ] cDg() function added to score engine block
  [ ] calcAll() calls cDg(), stores result as dg
  [ ] Result panel: score ring + 3 sub-bars (mt, ab, pi)
  [ ] Pattern labels rendered conditionally
  [ ] Red flag state renders referral message, suppresses score
  [ ] HRV strip: renderHrvStrip_Dg() added to hrv-engine.js
  [ ] HRV strip context sentence (gut-specific, not metabolic reuse)
  [ ] Radar chart: 9th axis "Gut" added
  [ ] buildAction() gains gut section with food-first + confirmatory tests
  [ ] buildAction() checks redFlag before rendering gut section
  [ ] Sidebar nav: "Gut" link added
  [ ] Module count updated from 8 to 9 in any count-dependent UI
  [ ] Language toggle: EN/ID labels for all 9 new field IDs
  [ ] Default values: use Ridwan's actual values for demo state

  Confidence badge: [Exploratory] — same as nutrient and skin modules
  Score direction: Risk (higher = more concern) — same as oxidative, toxic, metabolic, cardio

hrv-engine.js:
  [ ] renderHrvStrip_Dg() added
  [ ] MP-V1 note shown when dg score ≥ 4 AND ALI = very_low or low

QA:
  [ ] Ridwan: dg-sa = berat, dg-ca = berat → high absorption burden → ab sub-index high
  [ ] Ridwan: dg-ip score correct direction
  [ ] Red flag: check score is null, referral message shows, action plan suppressed
  [ ] Red flag cleared: normal scoring resumes
  [ ] calcAll() regression: modules 1–8 unchanged after adding cDg()
  [ ] Radar chart: 9th axis renders without breaking radar proportions
```

---

## 12. FILES CHANGED SUMMARY

| File | Action | Notes |
|---|---|---|
| `mappings.json` | **UPDATE** — 9 entries | Add dashboard_id + module field |
| `03_Scripts/parser_v3.py` | **UPDATE** — minimal | Verify dg-ip zone inversion |
| `qrma-dashboard-v5.html` | **CREATE** from v4 | New module section, cDg(), radar update |
| `03_Scripts/hrv-engine.js` | **UPDATE** — additive | renderHrvStrip_Dg() + V1 note |
| `PROJECT_MAP.md` | **UPDATE** | Add Module 9 to module table, backlog, version snapshot |
| `BUILD_3A_SPEC.md` | No change | |

---

## 13. HANDOVER NOTE FOR NEXT AI SESSION

Read in this order before building v5.0:
1. `PROJECT_MAP.md` — current state, §5.1 module table
2. `MODULE_9_DIGESTIVE_SPEC.md` — this file
3. `CLAUDE_final.md` — HTML editing rules
4. `hrv-flask-session-handover.md` — before touching hrv-engine.js

Key constraints:
- Use `str_replace` only. Never rewrite the full HTML.
- `cDg()` goes in the SCORE ENGINE block, before `calcAll()`
- `calcAll()` change is one line: add `const dg = cDg();` and pass `dg` to `buildAction()`
- `renderHrvStrip_Dg()` is additive to hrv-engine.js — does not modify existing strip renderers
- Red flag checkbox uses `id="dg-redflag"` — checked state is read by `cDg()` directly
- All 9 field IDs use `dg-` prefix consistently
- Radar chart 9th axis: add to the labels array and data array in `drawCharts()` — test that the polygon still renders correctly at 9 vertices
- Default values for the demo state: use Ridwan's actual values where available (see Section 2 table)
