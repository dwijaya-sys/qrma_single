# HRV Logic Layer and Single-HTML Web App Handover

## Purpose
This document is a technical handover for the next AI system that will extend the current QRMA-centered logic layer with HRV and manual intake inputs inside one single-page HTML web application. The target architecture should preserve the existing screening and wellness framing, keep QRMA as the primary domain engine, and add HRV as an autonomic regulation layer plus manual input as a context layer rather than creating three disconnected apps.[file:4][file:6]

The existing repository already separates raw parameters, pattern logic, cluster scoring, and final aggregation. In the current design, `clientscans` is the integration point for raw scans, flagged data, scores, matched patterns, and report outputs, while Module 8 acts as an aggregator that consumes outputs from prior modules rather than functioning as a separate input module.[file:4][file:6]

## Design goal
The technical goal is to let a facilitator run a simple operational flow: QRMA scan first, Polar H10 HRV reading second, optional manual form third, then upload all data into a single HTML web application that renders one merged dashboard. The application should not ask the engine to decide between three competing systems; instead, it should combine three input lanes into one reasoning pipeline.[file:4][file:6]

The intended reasoning contract is:

- QRMA determines the main functional domain and pattern candidates.[file:4]
- HRV determines autonomic load and recovery state as a cross-cutting modifier.[file:4]
- Manual input confirms context, symptoms, and hard anthropometric values already expected by parts of the current specification, such as height, weight, waist circumference, sleep quality, bowel pattern, and perceived stress.[file:6]
- The final dashboard shows one unified interpretation, one prioritized action queue, and one safety disclaimer block.[file:6]

## Non-medical framing
All outputs must preserve the current repo framing: wellness education, functional pattern observation, and screening-hypothesis generation only. The existing documents explicitly state that QRMA-derived outputs are proxy signals, that flagged findings should be confirmed with standard testing, and that Module 8 must always display a non-dismissible disclaimer; the HRV extension should inherit the same language standard.[file:4][file:6]

Recommended output language:

- “Pattern suggests”
- “Autonomic load appears elevated”
- “HRV reading may indicate reduced adaptability today”
- “Digestive pattern appears stress-amplified”
- “Confirm with standard clinical assessment where relevant”

Avoid:

- Disease naming
- Diagnostic labels
- Certainty language such as “has,” “proves,” or “confirms”

## Existing logic layer constraints to preserve
The current QRMA-GDV logic layer is already organized around three main concepts that should not be broken during integration.[file:4]

### 1. Pattern logic
The engine maps QRMA and GDV-style signals into 13 TCM-informed pattern definitions with explicit threshold logic, for example Pattern 01 Liver Qi Stagnation, Pattern 03 Spleen Qi Deficiency with Damp Accumulation, Pattern 06 Heart Qi Deficiency with Blood Stasis, and Pattern 11 Heart-Spleen Dual Deficiency.[file:4]

### 2. Cluster logic
The engine classifies results into Cluster A, B, and C with a priority rule that chooses the maximum severity score and breaks ties in the order B then A then C. Cluster B is defined as the Digestive-Gut-Liver Axis and is activated by trigger logic centered on peristalsis, absorption, gut bacteria, detoxification, and digestive/spleen GDV correlates.[file:4]

### 3. Aggregation logic
The separate module specification defines Module 8 as an aggregator that reads alerts from the prior modules, sorts them by evidence strength, deduplicates confirmatory tests, limits food-first suggestions, and always renders a safety disclaimer before the action plan. This pattern is the correct insertion point for HRV and manual-context outputs.[file:6]

## Core integration model
The integration should be implemented as a three-lane intake model feeding one shared inference engine.

### Lane 1: QRMA input
This lane imports QRMA parameters and runs the existing module logic, cluster triggers, and pattern mapping. QRMA remains the primary engine because the current specification already defines explicit parameter metadata, abnormality direction, cluster association, pattern rules, and severity thresholds for it.[file:4][file:6]

### Lane 2: HRV input
This lane imports a Polar H10 reading and converts it into normalized autonomic markers. The HRV lane should not initially create a standalone disease or module taxonomy; it should create autonomic modifiers that sit above the cluster and pattern layers.[file:4]

### Lane 3: Manual input
This lane captures symptom and context fields that QRMA does not represent reliably and that the current dashboard spec already uses for certain modules, such as BMI and waist circumference. Manual fields also provide a way to split subtypes, for example digestive-only versus digestive-plus-stress versus digestive-plus-sleep disruption.[file:6]

The output contract is one merged session object:

```json
{
  "sessionId": "uuid",
  "qrma": {},
  "hrv": {},
  "manual": {},
  "derivedFlags": {},
  "clusterScores": {},
  "patternMatches": [],
  "autonomicState": {},
  "actionPlan": {}
}
```

## HRV logic layer role
The simplest and most robust way to add HRV is to treat it as an **Autonomic Load Layer** rather than as a co-equal diagnostic engine. This means HRV does three things:

1. Adds a global state label to the session.
2. Modifies severity or subtype inside existing QRMA patterns and clusters.
3. Adjusts action priority when a stress-first sequence is more appropriate than a domain-first sequence.

This approach fits the current architecture because the repo already has a distinction between raw inputs, threshold logic, pattern assignment, cluster prioritization, and final action aggregation.[file:4][file:6]

## Recommended HRV data contract
The application should accept one summarized HRV payload per reading rather than raw RR intervals in version 1. That keeps the single-page app simple and avoids heavy in-browser HRV signal processing.

Recommended stored fields:

| Field | Type | Purpose |
|---|---|---|
| `readingTimestamp` | datetime | Session ordering |
| `device` | string | Provenance, e.g. Polar H10 |
| `protocol` | string | Morning supine, seated 5-min, etc. |
| `durationSec` | integer | Quality and comparability |
| `meanHr` | number | General load context |
| `rmssd` | number | Primary vagal/recovery proxy |
| `sdnn` | number | General variability marker |
| `lnRmssd` | number | Optional normalized stability field |
| `lfHfRatio` | number/null | Optional secondary balance marker |
| `readinessBand` | string | Simplified UI band |
| `artifactPct` | number | Quality control |
| `qualityFlag` | string | pass / caution / reject |

Version 1 should treat `rmssd` or `lnRmssd` as the primary reasoning field and use the rest as supporting context. The engine should reject or down-rank a reading with high artifact burden, short duration, or mismatched protocol conditions.[file:6]

## HRV normalization strategy
Absolute HRV values vary strongly by age, training status, time of day, posture, and collection protocol. For that reason, the app should not interpret a single HRV number in isolation. Instead, the logic layer should use a mixed model with two views:

- **Absolute banding:** a coarse same-day screen for “very low,” “low,” “adaptive,” and “high.”
- **Personal baseline delta:** a rolling comparison against the user’s own recent readings once enough data exist.

Version 1 may start with absolute banding only, but the schema should already support baseline-aware reasoning later.

Recommended internal fields:

```json
{
  "rmssdBand": "very_low | low | adaptive | high",
  "baselineStatus": "unknown | below_baseline | near_baseline | above_baseline",
  "autonomicLoadIndex": 0,
  "recoveryState": "strained | guarded | adaptive"
}
```

## Autonomic Load Index
The most practical abstraction is a derived score called `AutonomicLoadIndex` or `ALI`. This should be a small composite derived from HRV quality, RMSSD band, resting HR context, and optionally manual stress/sleep context.

Suggested first-pass formula:

```text
ALI = weighted_score(
  rmssd_band,
  mean_hr_band,
  quality_flag,
  sleep_disruption_flag,
  perceived_stress_flag
)
```

Suggested bands:

| ALI band | Meaning | Engine behavior |
|---|---|---|
| 0–24 | Adaptive | No override |
| 25–49 | Mild load | Add caution tag |
| 50–74 | Moderate load | Add autonomic modifier to patterns |
| 75–100 | High load | Trigger stress-first action ordering |

The ALI is not a medical metric. It is an internal orchestration score used to adjust logic flow and UI emphasis while keeping the repo’s hypothesis-generating framing.[file:6]

## HRV reasoning rules
The HRV layer should initially use rules, not machine learning. Deterministic rules are easier to audit, easier to hand over, and much more aligned with the current repository style, which is already rule-based and threshold-driven.[file:4][file:6]

### Rule family A: reading validity
These rules decide whether HRV is trusted enough to influence the engine.

- If `qualityFlag = reject`, store the reading but do not use it in reasoning.
- If `artifactPct` exceeds the allowed threshold, downgrade confidence.
- If protocol is unknown, allow display but reduce interpretive weight.
- If duration is below minimum threshold, use banner-only display, not action-priority logic.

### Rule family B: global autonomic state
These rules assign a session-level state.

- Low RMSSD plus elevated mean HR -> `autonomic_load_high`
- Low RMSSD with normal HR -> `autonomic_load_moderate`
- Adaptive RMSSD with acceptable HR -> `autonomic_state_adaptive`
- High RMSSD but poor quality -> `autonomic_state_uncertain`

### Rule family C: pattern modifiers
These rules refine QRMA-derived patterns without replacing them.

Examples:

- Pattern 01 Liver Qi Stagnation + high ALI -> subtype `stress_amplified_lqs`
- Pattern 03 Spleen Qi Deficiency with Damp + high ALI -> subtype `stress_amplified_cluster_b`
- Pattern 06 Heart Qi Deficiency with Blood Stasis + low RMSSD -> subtype `low_recovery_fire_axis`
- Pattern 11 Heart-Spleen Dual Deficiency + poor HRV + poor sleep manual input -> subtype `depletion_with_shen_sleep_burden`

### Rule family D: action priority overrides
These rules adjust the order in which the UI recommends educational actions.

- If Cluster B is active and ALI is high, show “regulation first, digestion second.”
- If Cluster A and B are both active and ALI is high, still prioritize autonomic settling before advanced food or supplement intensity.
- If Cluster C is active but ALI is high, surface low-load movement and recovery guidance before structural progression.

This override model respects the existing cluster architecture while giving HRV a real operational role.[file:4]

## Manual input reasoning role
Manual input should not compete with QRMA or HRV. Its role is to provide human-context refinements.

Recommended version 1 manual fields:

| Group | Field | Role |
|---|---|---|
| Demographics | age, sex | Interpretation context |
| Anthropometrics | height, weight, waist | Existing module support |
| Sleep | bedtime regularity, sleep duration, sleep quality | HRV and recovery context |
| Stress | perceived stress score, current overload yes/no | HRV context |
| Digestion | bloating, stool frequency, stool form, reflux, post-meal heaviness | Cluster B subtype split |
| Habits | caffeine, alcohol, meal timing, exercise frequency | Pattern refinement |
| Symptoms | palpitations, fatigue, tension, cold/heat tendency | Narrative output support |

Reasoning rule examples:

- Cluster B active + bloating + post-meal heaviness + low HRV -> `digestive_stress_subtype`
- Pattern 01 active + high stress self-report + short sleep + low HRV -> `hpa_axis_loaded_subtype`
- Pattern 06 active + palpitations + poor sleep + low HRV -> escalate educational warning tone, not diagnosis

## Proposed database additions
The existing schema references `qrmaparameters`, `gdvparameters`, `correlationrules`, `tcmpatterns`, `clustertriggerrules`, and `clientscans`.[file:4] The cleanest extension is to add HRV and manual-input tables while leaving QRMA tables intact.

### New tables

```sql
CREATE TABLE hrvreadings (
  hrvreadingid VARCHAR(36) PRIMARY KEY,
  clientscanid VARCHAR(36) NOT NULL,
  device VARCHAR(50) NOT NULL,
  protocol VARCHAR(50),
  readingtimestamp DATETIME NOT NULL,
  durationsec INT,
  meanhr FLOAT,
  rmssd FLOAT,
  sdnn FLOAT,
  lnrmssd FLOAT,
  lfhfratio FLOAT,
  artifactpct FLOAT,
  qualityflag ENUM('pass','caution','reject') DEFAULT 'caution',
  notes TEXT
);

CREATE TABLE manualinputs (
  manualinputid VARCHAR(36) PRIMARY KEY,
  clientscanid VARCHAR(36) NOT NULL,
  age INT,
  sex VARCHAR(20),
  heightcm FLOAT,
  weightkg FLOAT,
  waistcm FLOAT,
  sleepdurationhrs FLOAT,
  sleepqualityscore TINYINT,
  perceivedstressscore TINYINT,
  bloating BOOLEAN,
  reflux BOOLEAN,
  stoolfrequencyperday FLOAT,
  stoolformtype TINYINT,
  postmealheaviness BOOLEAN,
  caffeineintakelevel VARCHAR(20),
  exercisefrequency VARCHAR(20),
  notes TEXT
);

CREATE TABLE autonomicderived (
  autonomicderivedid VARCHAR(36) PRIMARY KEY,
  clientscanid VARCHAR(36) NOT NULL,
  rmssdband VARCHAR(20),
  baselinestatus VARCHAR(20),
  autonomicloadindex TINYINT,
  recoverystate VARCHAR(20),
  confidencelevel VARCHAR(20),
  autonomicflags JSON,
  createdat DATETIME NOT NULL
);
```

### Minimal alteration to existing aggregate table

```sql
ALTER TABLE clientscans
ADD COLUMN hasqrma BOOLEAN DEFAULT FALSE,
ADD COLUMN hashrv BOOLEAN DEFAULT FALSE,
ADD COLUMN hasmanual BOOLEAN DEFAULT FALSE,
ADD COLUMN autonomicloadindex TINYINT NULL,
ADD COLUMN autonomicstate VARCHAR(30) NULL,
ADD COLUMN integrationmode VARCHAR(30) NULL;
```

Recommended `integrationmode` values:

- `qrma_only`
- `qrma_hrv`
- `qrma_manual`
- `qrma_hrv_manual`
- `hrv_only`
- `manual_only`

## Branching logic plan
The branching logic should stay simple, explicit, and debuggable.

### Stage 1: input detection

```text
hasQrma   = qrma payload present and valid
hasHrv    = hrv payload present and qualityFlag != reject
hasManual = manual payload present
```

### Stage 2: baseline route selection

```text
if hasQrma:
  route = "qrma_primary"
else if hasHrv:
  route = "hrv_only"
else if hasManual:
  route = "manual_only"
else:
  route = "empty"
```

### Stage 3: QRMA engine
If `hasQrma`, run:

1. Parameter normalization.[file:6]
2. Module scoring.[file:6]
3. Cluster scoring A/B/C.[file:4]
4. Pattern matching 01–13.[file:4]
5. Existing alert generation and evidence ordering.[file:6]

### Stage 4: HRV engine
If `hasHrv`, run:

1. HRV quality gate.
2. HRV normalization and banding.
3. ALI computation.
4. Session-level autonomic flag creation.
5. Pattern modifiers.
6. Action priority overrides.

### Stage 5: manual refinement engine
If `hasManual`, run:

1. Anthropometric derivations such as BMI if needed.[file:6]
2. Context flag extraction.
3. Cluster subtype refinement.
4. Narrative summary enrichment.

### Stage 6: unified aggregator
Always end with one aggregator object, conceptually similar to current Module 8, containing:

- input availability summary
- QRMA cluster and pattern outputs
- autonomic state
- manual-context tags
- ordered actions
- deduplicated confirmatory prompts
- safety disclaimer

## Pseudocode for the reasoning engine

```javascript
function runSessionEngine(session) {
  const result = initResult(session);

  if (session.qrma?.valid) {
    result.qrma = runQrmaEngine(session.qrma);
  }

  if (session.hrv?.valid) {
    result.hrv = runHrvEngine(session.hrv, session.manual);
  }

  if (session.manual?.valid) {
    result.manual = runManualContextEngine(session.manual);
  }

  result.integrated = integrateOutputs({
    qrma: result.qrma,
    hrv: result.hrv,
    manual: result.manual
  });

  result.actionPlan = buildUnifiedActionPlan(result.integrated);
  result.disclaimer = buildDisclaimer();

  return result;
}
```

### QRMA engine contract

```javascript
function runQrmaEngine(qrma) {
  const modules = scoreQrmaModules(qrma);
  const clusters = scoreClusters(modules, qrma);
  const patterns = matchTcmPatterns(qrma, clusters);
  const alerts = deriveAlerts(modules, clusters, patterns);
  return { modules, clusters, patterns, alerts };
}
```

### HRV engine contract

```javascript
function runHrvEngine(hrv, manual) {
  const quality = assessHrvQuality(hrv);
  if (quality.usable === false) {
    return { usable: false, banner: "HRV reading stored but not used for logic" };
  }

  const bands = bandHrvMetrics(hrv);
  const context = deriveRecoveryContext(hrv, manual);
  const autonomicLoadIndex = computeAli(bands, context);
  const modifiers = derivePatternModifiers(autonomicLoadIndex, manual);

  return {
    usable: true,
    quality,
    bands,
    context,
    autonomicLoadIndex,
    modifiers
  };
}
```

### Integration contract

```javascript
function integrateOutputs({ qrma, hrv, manual }) {
  const integrated = {
    activeClusters: qrma?.clusters || [],
    activePatterns: qrma?.patterns || [],
    autonomicState: hrv?.context || null,
    manualFlags: manual?.flags || [],
    subtypeTags: [],
    prioritySequence: []
  };

  if (qrma && hrv?.usable) {
    integrated.subtypeTags.push(...applyHrvPatternModifiers(qrma, hrv));
    integrated.prioritySequence = applyAutonomicOverrides(qrma, hrv);
  } else if (qrma) {
    integrated.prioritySequence = defaultPrioritySequence(qrma);
  }

  if (manual) {
    integrated.subtypeTags.push(...applyManualRefinements(qrma, hrv, manual));
  }

  return integrated;
}
```

## Single HTML application integration plan
The final app can remain a single HTML file if the code is organized as a modular front-end script with pure functions and structured state. Single HTML does not require simplistic logic; it only requires disciplined separation of concerns.

### Recommended in-file architecture

```text
app.html
├─ <style> design tokens and component styles
├─ <script type="module">
│  ├─ state store
│  ├─ import parsers
│  ├─ QRMA engine
│  ├─ HRV engine
│  ├─ manual engine
│  ├─ aggregator
│  ├─ render functions
│  └─ event bindings
```

### Recommended state tree

```javascript
const appState = {
  sessionMeta: {
    sessionId: null,
    createdAt: null,
    integrationMode: null
  },
  inputs: {
    qrma: null,
    hrv: null,
    manual: null
  },
  derived: {
    qrma: null,
    hrv: null,
    manual: null,
    integrated: null,
    actionPlan: null
  },
  ui: {
    activeTab: 'overview',
    notifications: [],
    importStatus: {}
  }
};
```

### UI workflow

1. Upload QRMA file.
2. Upload HRV file or paste summarized HRV values.
3. Fill manual form.
4. Click “Run Session Logic.”
5. Render merged dashboard tabs.

Recommended tabs:

- Overview
- QRMA Domains
- HRV / Autonomic State
- Manual Context
- Integrated Patterns
- Actions
- Debug / Rule Trace

The **Debug / Rule Trace** tab is important for handover quality. Since the engine is rule-based, the next AI system should be able to inspect which rules fired and why.

## File parsing plan
The single-page app should not attempt complex vendor-specific file parsing until the HRV data contract is fixed. A safer version 1 approach is:

### QRMA parsing
- Support CSV or pasted structured fields.
- Normalize parameter names to internal keys expected by the current QRMA engine.[file:4][file:6]
- Map aliases to canonical names.

### HRV parsing
Accept either:

- summarized JSON,
- summarized CSV row,
- or manual metric entry.

Example accepted HRV JSON:

```json
{
  "device": "Polar H10",
  "protocol": "seated_5min",
  "readingTimestamp": "2026-05-27T08:00:00+07:00",
  "durationSec": 300,
  "meanHr": 72,
  "rmssd": 22,
  "sdnn": 38,
  "lnRmssd": 3.09,
  "lfHfRatio": 2.3,
  "artifactPct": 1.2,
  "qualityFlag": "pass"
}
```

### Manual parsing
- Direct form fields inside the app.
- Optional JSON import for batch use.

## Rendering plan for the dashboard
The dashboard should show data lineage clearly.

### Overview panel
Show:

- session date
- available inputs
- primary cluster
- primary pattern suggestions
- autonomic status
- top three action priorities
- persistent disclaimer

### QRMA panel
Show:

- module cards
- cluster scores A/B/C
- matched pattern cards
- fired QRMA triggers

### HRV panel
Show:

- raw HRV summary fields
- quality status
- RMSSD band
- ALI score
- recovery interpretation
- whether HRV changed prioritization

### Manual panel
Show:

- key symptoms
- sleep and stress flags
- anthropometric summary
- contextual tags

### Integrated panel
Show:

- merged subtype label, e.g. `Cluster B + high autonomic load`
- explanation bullets
- action ordering
- confidence notes

### Actions panel
Reuse the current Module 8 philosophy:

- evidence-ordered items where applicable.[file:6]
- deduplicated suggestions.[file:6]
- confirmatory prompts where the underlying QRMA system already expects them.[file:6]
- hard-coded safety block at the top.[file:6]

## Rule trace logging
Every reasoning pass should emit a structured trace object. This is essential for handover, debugging, and future AI maintenance.

Recommended trace format:

```json
[
  {
    "stage": "qrma_cluster_scoring",
    "ruleId": "B-P1",
    "fired": true,
    "reason": "stomach peristalsis below threshold",
    "source": "qrma"
  },
  {
    "stage": "hrv_modifier",
    "ruleId": "HRV-MOD-CLUSTER-B-01",
    "fired": true,
    "reason": "ALI >= 75 and Cluster B active",
    "source": "hrv"
  },
  {
    "stage": "manual_refinement",
    "ruleId": "MAN-DIG-02",
    "fired": true,
    "reason": "bloating plus post-meal heaviness true",
    "source": "manual"
  }
]
```

The UI should expose this trace in a collapsible debug tab.

## Proposed HRV rule catalog
The next AI system should implement HRV rules in a dedicated rule namespace parallel to existing QRMA trigger naming.

Recommended namespaces:

- `HRV-VAL-*` for validation
- `HRV-BAND-*` for banding
- `HRV-ALI-*` for autonomic load score
- `HRV-MOD-*` for pattern modifiers
- `HRV-PRIORITY-*` for action-order overrides

Example catalog:

| Rule ID | Purpose | Example condition |
|---|---|---|
| `HRV-VAL-01` | Reject poor data | `qualityFlag = reject` |
| `HRV-BAND-01` | RMSSD very low | `rmssd < threshold_1` |
| `HRV-BAND-02` | RMSSD low | `threshold_1 <= rmssd < threshold_2` |
| `HRV-ALI-01` | High autonomic load | `rmssd low + meanHr high` |
| `HRV-MOD-01` | Stress-amplified Cluster B | `clusterB active + ALI >= 75` |
| `HRV-MOD-02` | Heart-recovery burden | `pattern06 active + rmssd low` |
| `HRV-PRIORITY-01` | Regulation first | `ALI >= 75` |

## Conflict resolution rules
Because multiple lanes may disagree, explicit conflict handling is required.

### Scenario 1: QRMA digestive burden, HRV normal
Interpret as a domain-led digestive picture without clear autonomic amplification. Show digestive priority first and avoid overstating stress influence.

### Scenario 2: QRMA mild findings, HRV very low
Interpret as a high-load day or reduced adaptability state with weak structural QRMA evidence. Show “autonomic strain observed today” without inflating QRMA pattern severity.

### Scenario 3: Manual symptoms high, QRMA low, HRV low
Show a context-heavy result with symptom acknowledgement and autonomic education, but do not force a strong QRMA pattern assignment.

### Scenario 4: Missing HRV
Run QRMA normally and mark HRV as unavailable. Missing HRV must not break cluster scoring or action plan generation.[file:4][file:6]

## Recommended build phases

### Phase 1: logic-first prototype
- Build pure JavaScript rule engine.
- Support QRMA JSON import, HRV JSON import, manual form.
- Render debug trace and merged output.
- No authentication, no backend required.

### Phase 2: facilitator-ready single HTML app
- Improve UI.
- Add CSV import helpers.
- Add saved session export as JSON.
- Add print-friendly report view.

### Phase 3: baseline-aware HRV
- Store multiple HRV sessions per client.
- Add rolling baseline and trend comparisons.
- Introduce better intra-person interpretation.

### Phase 4: future backend migration
- Lift pure functions into shared logic files.
- Move session persistence to database.
- Keep UI and reasoning engine separated.

## Implementation notes for the next AI system

### Keep pure logic separate from rendering
All scoring and branching functions should be pure functions that accept input objects and return derived objects. DOM rendering should only consume the result.

### Avoid hidden side effects
Do not let UI handlers directly mutate scoring internals. Use one orchestrator function such as `runSessionEngine()`.

### Make rule thresholds configurable
HRV band thresholds and ALI weights should be stored in one config object, not hard-coded across multiple functions.

Example:

```javascript
const HRV_CONFIG = {
  artifactRejectPct: 5,
  artifactCautionPct: 3,
  minDurationSec: 240,
  rmssdBands: {
    veryLow: 15,
    low: 25,
    adaptive: 50
  },
  aliWeights: {
    rmssd: 0.5,
    meanHr: 0.2,
    sleep: 0.15,
    stress: 0.15
  }
};
```

### Keep the first release conservative
The repo already contains explicit evidence-strength differentiation and safety phrasing. The HRV layer should follow the same principle: use a conservative banner when data are weak, and use stronger routing effects only when data quality is acceptable.[file:6]

## Suggested folderless module layout inside one HTML file
For a single HTML deliverable, divide JavaScript into clearly labeled sections.

```javascript
// 1. Constants and config
// 2. State store
// 3. Utility helpers
// 4. Import parsers
// 5. QRMA engine
// 6. HRV engine
// 7. Manual engine
// 8. Integrator
// 9. Renderer
// 10. Event bindings
// 11. Debug trace helpers
```

This is still one HTML file, but the next AI system will be able to navigate it like a modular codebase.

## Acceptance criteria
The integration should be considered successful when all of the following are true:

- The app accepts QRMA, HRV, and manual inputs in one session.
- QRMA-only sessions still work exactly as expected.[file:4][file:6]
- HRV can modify interpretation without replacing QRMA pattern logic.[file:4]
- Manual data can refine subtypes without creating contradictory outputs.[file:6]
- The UI shows one merged dashboard, not three disconnected result pages.
- A debug trace makes every major rule decision inspectable.
- The safety disclaimer always renders in the final action area.[file:6]
- Missing HRV or missing manual input does not break the engine.[file:4][file:6]

## Recommended next actions for the next AI system

1. Implement the session schema and sample JSON fixtures.
2. Build the pure `runHrvEngine()` function first.
3. Add the `AutonomicLoadIndex` derivation and rule trace.
4. Integrate HRV modifiers into the existing QRMA cluster/pattern output object.
5. Build the unified aggregator output that mirrors Module 8 behavior.[file:6]
6. Add the single-page dashboard tabs and debug panel.
7. Test five scenarios: QRMA only, QRMA+HRV, QRMA+manual, QRMA+HRV+manual, HRV only.

## Sources
1. `Logic-Layer-QRMA-expanded.md`
2. `qrma-module-specification.md`
3. `Logic-Layer-Specification-Document-QRMA-GDV-Health-Intelligence-Engine.docx`
