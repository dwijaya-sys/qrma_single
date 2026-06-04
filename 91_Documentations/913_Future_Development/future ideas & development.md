# Future Ideas & Development

## Purpose of This Handover

This document is a handover for the next AI system that will continue the development of the QRMA-GDV health intelligence platform. It explains the current logic foundation, the design reasoning behind the recommended future architecture, and the technical steps needed to implement the next phase in a structured and scalable way.

This handover is written as a product, data, and implementation bridge. It is meant to help the next AI or engineering team understand not only **what** should be built, but also **why** these decisions are the most coherent extension of the current specification.

This document treats the platform as a wellness education and functional pattern observation system, not a medical diagnosis engine. That distinction should remain preserved in all future product, technical, and narrative layers.

## Current System Foundation

The attached QRMA-GDV specification already defines a fairly mature logic engine. At a high level, the current system performs the following sequence:

1. Raw data ingestion.
2. Flagging against thresholds and normal ranges.
3. QRMA-GDV correlation matching.
4. Cluster scoring for A, B, and C.
5. TCM pattern assignment.
6. AI narrative generation.

The current logic is already multi-layered. It does not behave like a single-label system. Instead, it uses:

- multiple QRMA parameters,
- multiple GDV parameters,
- weighted cluster trigger rules,
- severity bands,
- primary cluster logic,
- threshold-based TCM pattern assignment,
- lifestyle domains,
- and cross-confirmation between structural and energetic findings.

That existing design choice is important. It means the next AI system should **not** simplify the model into one flat output such as a single constitution label, one diagnosis label, or one wearable score. The current engine is already organized around interactions, overlap, and tiered interpretation.

## Core Design Reasoning

### 1. Do not collapse the system into one value

The strongest architectural lesson from the current QRMA document is that human state is not treated as a single-variable phenomenon. The specification uses:

- multiple patterns,
- cluster interactions,
- primary versus secondary findings,
- mixed deficiency and excess states,
- and multi-source confirmation logic.

Because of that, future modules should follow the same design principle. Any new data source, including body constitution, anthropometric measurements, sleep signals, HRV, or neurofeedback data, should be introduced as **multi-dimensional structured inputs**, not as one final score too early in the pipeline.

### 2. Separate stable baseline from dynamic active state

One of the most important future improvements is to clearly separate three layers:

- **Baseline constitution**: the person's relatively stable body tendency or 体质 (tizhi).
- **Active imbalance state**: the current, more dynamic pattern expression influenced by stress, sleep, diet, activity, and recent burden.
- **Modifiers**: anthropometric status, wearable trends, lifestyle behaviors, and context variables.

This is the best match for the existing QRMA logic because the current engine already differentiates between foundational tendencies and currently active cluster burdens. The next AI system should preserve that logic explicitly instead of mixing all inputs into one opaque score.

### 3. Preserve explainability

The current specification is explainable because it shows how a result arises from threshold logic, trigger rules, pattern minimums, and cluster severity. That explainability is a major strength and should not be lost when future AI layers are added.

Future development should therefore prefer:

- interpretable rules over black-box classification for the first production phase,
- explicit score components,
- visible thresholds,
- reason strings for each output,
- and confidence grading.

This will help both practitioners and engineers validate whether an output makes sense.

## Strategic Direction for the Next AI System

The next AI system should evolve from a scan interpretation engine into a **layered longitudinal wellness intelligence system**.

That means the system should eventually be able to answer four different questions:

1. What is the person’s likely baseline constitution tendency?
2. What active imbalance is strongest right now?
3. What signals are driving the change?
4. What practical wellness guidance follows from that pattern?

The present QRMA document already answers most of question 2 and part of question 4. Future development should expand question 1 and question 3.

## Recommended Future Data Model

## A. Baseline Constitution Layer

This layer should model constitutional tendency using a **multi-score profile**, not a single fixed label.

### Recommended structure

Store all major constitution categories as scores, for example:

- Balanced / 平和质 (Ping He Zhi)
- Qi deficiency / 气虚质 (Qi Xu Zhi)
- Yang deficiency / 阳虚质 (Yang Xu Zhi)
- Yin deficiency / 阴虚质 (Yin Xu Zhi)
- Phlegm-damp / 痰湿质 (Tan Shi Zhi)
- Damp-heat / 湿热质 (Shi Re Zhi)
- Blood stasis / 血瘀质 (Xue Yu Zhi)
- Qi stagnation / 气郁质 (Qi Yu Zhi)
- Special diathesis / 特禀质 (Te Bing Zhi)

### Why this is better than a single value

A single constitution label is too rigid for a system that already supports mixed and overlapping states. A multi-score constitution layer allows the platform to:

- identify a dominant constitution,
- identify a secondary constitution,
- avoid false certainty,
- support trend comparison over time,
- and align better with mixed-pattern logic already present in the QRMA engine.

### Recommended fields

```json
{
  "constitution_scores": {
    "pinghe": 24,
    "qixu": 74,
    "yangxu": 61,
    "yinxu": 32,
    "tanshi": 68,
    "shire": 29,
    "xueyu": 38,
    "qiyu": 54,
    "tebing": 12
  },
  "primary_constitution": "qixu",
  "secondary_constitution": "tanshi",
  "constitution_confidence": 0.82,
  "constitution_profile_type": "mixed-dominant"
}
```

### Interpretation rule

The system should avoid forcing a primary constitution if the top scores are too close or too low. In those cases, it should return one of the following states:

- balanced-dominant,
- mixed-dominant,
- indeterminate-low-confidence.

## B. Active Pattern Layer

This layer should remain aligned with the QRMA-GDV system because it is already the strongest part of the current design.

The current engine uses:

- cluster A: metabolic-lipid axis,
- cluster B: digestive-gut-liver axis,
- cluster C: structural-connective tissue axis,
- then maps those into threshold-based TCM patterns.

That structure should stay.

### Recommended enhancement

Add a second dimension called **activation source weighting**, so that the next system can explain whether the active state is being driven mostly by:

- scan data,
- wearable recovery signals,
- anthropometric burden,
- questionnaire symptoms,
- or combined confirmation.

### Example output

```json
{
  "active_patterns": [
    {
      "pattern_id": "PATTERN_03",
      "name": "Spleen Qi Deficiency with Damp Accumulation",
      "strength": 0.78,
      "source_breakdown": {
        "qrma": 0.42,
        "gdv": 0.21,
        "wearables": 0.10,
        "questionnaire": 0.05
      }
    }
  ]
}
```

This makes handoffs, audits, and future tuning much easier.

## C. Anthropometric Layer

Anthropometric data should absolutely be added, but not as a replacement for constitution or active pattern logic.

### Why anthropometric data matters

Anthropometric signals are highly useful for identifying structural and metabolic tendencies that support pattern interpretation. In the current QRMA logic, BMI and body fat already appear in cluster A and in pattern logic related to Phlegm-Damp and metabolic burden.

This means anthropometric data is already conceptually compatible with the existing engine.

### Recommended raw fields

- height_cm
- weight_kg
- waist_cm
- hip_cm
- neck_cm
- body_fat_percent
- visceral_fat_score
- skeletal_muscle_mass_kg
- basal_metabolic_rate

### Recommended derived fields

- bmi
- waist_to_hip_ratio
- waist_to_height_ratio
- body_fat_category
- central_obesity_flag
- sarcopenia_risk_flag
- underweight_flag

### Why anthropometric data should be a modifier

Anthropometric data helps indicate burden, tendency, or support for a pattern. It does not independently define the whole constitutional or pattern picture. For example:

- high body fat and central adiposity can support Phlegm-Damp / 痰湿 (Tan Shi),
- low muscle mass with cold and fatigue can support Yang deficiency / 阳虚 (Yang Xu),
- very lean dry presentation with heat signs can support Yin deficiency / 阴虚 (Yin Xu).

But none of these should become a one-to-one diagnosis rule on their own.

### Recommended design role

Treat anthropometric data as:

- trigger support,
- severity modifier,
- confidence enhancer,
- and longitudinal risk trend input.

## D. Wearable Layer

This is the most important future extension after anthropometrics.

### Best recommendation: Oura first

If the next AI system adds one wearable ecosystem first, the best first priority is **Oura Ring**, followed by **Polar H10** as a precision add-on, while **Muse 2** should be treated as a specialty module rather than the primary wearable foundation.

### Reasoning

The current QRMA system already includes lifestyle domains such as sleep, physical activity, psychology, energy reserve, and stress-related logic. Oura data fits those domains naturally because it provides repeatable longitudinal signals for:

- sleep timing and duration,
- sleep quality,
- overnight heart rate,
- HRV trend,
- temperature deviation,
- respiratory rate,
- readiness and recovery style measures,
- and activity behavior.

That makes Oura a strong bridge between the static scan model and a longitudinal daily-state model.

### Why not Muse 2 first

Muse 2 is interesting, especially for attention, meditation, and EEG-oriented mental training. However, for the QRMA system’s current architecture, Muse is less aligned with the platform’s strongest existing needs because it is more session-based and intervention-oriented. It is better positioned as a premium module for Shen / 神 (Shen), sleep training, focus training, or meditation adherence, not as the first universal wearable layer.

### Why Polar H10 is still important

Polar H10 is valuable because it can improve precision in HRV collection, especially during structured morning measurements. It is not the best all-day consumer experience, but it is useful for:

- calibration,
- high-confidence autonomic assessment,
- practitioner mode,
- and validation against PPG-based wearables.

### Recommended wearable strategy

1. Add Oura as the first broad integration.
2. Add Polar H10 as an optional high-precision assessment mode.
3. Add Muse only for advanced neurofeedback or focus-oriented modules.

## Proposed Unified Data Architecture

The next AI system should use a layered warehouse-like model.

### 1. Raw source storage

Store raw payloads from each source separately:

- qrma_raw
- gdv_raw
- constitution_questionnaire_raw
- anthropometric_raw
- wearable_raw
- symptom_interview_raw

### 2. Normalization layer

Normalize data into internal schemas with units and timestamps.

### 3. Feature engineering layer

Generate derived features such as:

- bmi,
- hrv_baseline_gap,
- sleep_debt_7d,
- resting_hr_shift,
- temperature_variability,
- activity_consistency,
- constitution_score_vector,
- and symptom burden indexes.

### 4. Rule engine layer

Apply:

- threshold rules,
- trigger rules,
- cluster scoring,
- constitution scoring,
- confidence logic,
- wearable overlay logic.

### 5. Narrative layer

Generate practitioner-facing and user-facing outputs separately.

## Suggested Database Design

### Main scan table extension

```sql
ALTER TABLE clientscans
ADD COLUMN constitutionscores JSON,
ADD COLUMN primaryconstitution VARCHAR(50),
ADD COLUMN secondaryconstitution VARCHAR(50),
ADD COLUMN constitutionconfidence FLOAT,
ADD COLUMN anthropometricraw JSON,
ADD COLUMN anthropometricderived JSON,
ADD COLUMN wearablesummary JSON,
ADD COLUMN trendsummary JSON,
ADD COLUMN activeoverlays JSON;
```

### New longitudinal table

```sql
CREATE TABLE wearable_daily_metrics (
  id VARCHAR(36) PRIMARY KEY,
  clientid VARCHAR(36) NOT NULL,
  sourcedevice VARCHAR(50) NOT NULL,
  recorddate DATE NOT NULL,
  sleepdurationminutes INT,
  sleepefficiency FLOAT,
  restinghr FLOAT,
  overnighthrv_rmssd FLOAT,
  respiratoryrate FLOAT,
  temperaturedeviation FLOAT,
  activityscore FLOAT,
  readinessscore FLOAT,
  stressproxy FLOAT,
  rawpayload JSON,
  createdat TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Constitution table

```sql
CREATE TABLE constitution_profiles (
  id VARCHAR(36) PRIMARY KEY,
  clientid VARCHAR(36) NOT NULL,
  assessedat DATETIME NOT NULL,
  source VARCHAR(50) NOT NULL,
  pinghe FLOAT,
  qixu FLOAT,
  yangxu FLOAT,
  yinxu FLOAT,
  tanshi FLOAT,
  shire FLOAT,
  xueyu FLOAT,
  qiyu FLOAT,
  tebing FLOAT,
  primaryconstitution VARCHAR(50),
  secondaryconstitution VARCHAR(50),
  confidence FLOAT,
  profiletype VARCHAR(50),
  createdat TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## Scoring Logic Recommendation

## A. Constitution scoring

A good first production model is rule-based weighted scoring.

### Inputs

- constitution questionnaire answers,
- long-term symptom history,
- anthropometric features,
- stable wearable trends over 30 to 90 days,
- practitioner overrides if applicable.

### Example scoring flow

```python
def score_constitution(input):
    scores = init_constitution_scores()

    scores['qixu'] += weight_symptom_fatigue(input)
    scores['yangxu'] += weight_cold_intolerance(input)
    scores['tanshi'] += weight_body_fat_and_heaviness(input)
    scores['qiyu'] += weight_emotional_constraint(input)

    scores = apply_anthropometric_modifiers(scores, input)
    scores = apply_longitudinal_wearable_modifiers(scores, input)
    scores = normalize_scores(scores)

    return assign_primary_secondary(scores)
```

### Reasoning

A rule-based first phase is preferable because it is explainable, tunable, and compatible with the existing QRMA architecture. A machine learning layer can be added later once enough labeled historical data exists.

## B. Active pattern overlay scoring

### Inputs

- QRMA abnormalities,
- GDV thresholds and imbalances,
- symptom questionnaire,
- recent wearable trends,
- anthropometric severity modifiers.

### Principle

Use the current QRMA logic as the base score, then add overlay adjustments.

```python
def score_active_pattern(base_qrma_gdv_score, wearable, anthropometric, symptoms):
    score = base_qrma_gdv_score
    score += wearable_overlay(wearable)
    score += symptom_overlay(symptoms)
    score += anthropometric_modifier(anthropometric)
    return clamp(score, 0, 1)
```

### Important safeguard

Wearables should not override scan logic completely in the first version. They should strengthen, weaken, or contextualize the interpretation, but not replace the core scan-derived logic until enough validation data exists.

## Confidence Model Recommendation

Every future AI output should have a confidence layer.

### Confidence inputs

- number of confirming sources,
- source agreement,
- signal recency,
- data completeness,
- trend stability,
- contradiction penalties.

### Example

A result supported by QRMA, GDV, anthropometrics, symptoms, and 30-day wearable trends should have a higher confidence than a result coming from a single scan snapshot and sparse self-report.

### Output example

```json
{
  "primary_pattern": "Spleen Qi Deficiency with Damp Accumulation",
  "confidence": 0.86,
  "confidence_reason": [
    "Supported by QRMA digestive abnormalities",
    "Supported by GDV spleen and stomach findings",
    "Supported by anthropometric metabolic burden",
    "Supported by poor recovery and low activity trends"
  ]
}
```

## AI Narrative Design

The next AI system should generate **two versions** of output:

### 1. Practitioner version

Should include:

- score details,
- thresholds triggered,
- source breakdown,
- constitution profile,
- active patterns,
- contradictions,
- and confidence notes.

### 2. Client version

Should include:

- simple language,
- educational framing,
- no overstated certainty,
- practical lifestyle interpretation,
- next-step recommendations,
- and safety notes.

### Reasoning

This separation is necessary because the current logic contains technical and semi-clinical structures that may be useful for internal review but too dense or too deterministic for user-facing narratives.

## API and Ingestion Design

### Recommended ingestion pattern

Use a source-agnostic event ingestion pipeline.

### Example API endpoints

```http
POST /v1/intake/qrma
POST /v1/intake/gdv
POST /v1/intake/anthropometrics
POST /v1/intake/wearables/oura
POST /v1/intake/wearables/polar
POST /v1/intake/questionnaire/constitution
POST /v1/intake/questionnaire/symptoms
```

### Processing pipeline

1. Validate schema.
2. Normalize units.
3. Store raw payload.
4. Compute derived metrics.
5. Recalculate profile and active state.
6. Save versioned interpretation.
7. Trigger narrative generation.

### Important implementation detail

All interpretations should be versioned. If scoring logic changes later, old reports should still be traceable to the rule version used at the time.

## Versioning Strategy

Introduce explicit version fields for:

- rule engine version,
- constitution scoring version,
- narrative prompt version,
- wearable normalization version.

### Example

```json
{
  "engine_version": "2.1.0",
  "constitution_model_version": "1.0.0",
  "wearable_mapping_version": "0.3.0",
  "narrative_template_version": "5.2.1"
}
```

This will save major debugging effort in future handovers.

## Quality and Safety Controls

The next AI system should not be allowed to produce high-certainty health conclusions when data is sparse, contradictory, or stale.

### Minimum safety rules

- Never frame output as a medical diagnosis.
- Always keep a wellness education disclaimer.
- Downgrade confidence when only one source is present.
- Flag contradictions instead of hiding them.
- Request more data when the pattern is underdetermined.
- Use red-flag routing for severe symptoms or urgent clinical signs.

### Contradiction examples

- low body fat with strong Phlegm-Damp signal,
- good recovery wearable data with severe fatigue report,
- strong heat symptoms with cold-dominant anthropometric pattern.

In such cases, the system should say the pattern is mixed, evolving, or needs more information.

## Suggested Product Roadmap

## Phase 1: Foundation extension

- Add constitution questionnaire.
- Add anthropometric inputs.
- Extend database schema.
- Add constitution scoring service.
- Keep QRMA-GDV active pattern logic as the base engine.

## Phase 2: Longitudinal wearable integration

- Integrate Oura first.
- Build daily wearable ingestion.
- Add seven-day and thirty-day trend features.
- Add wearable overlay logic to pattern confidence.

## Phase 3: Precision and practitioner tools

- Add Polar H10 assessment mode.
- Add calibration views.
- Add contradiction dashboards.
- Add practitioner explanation cards.

## Phase 4: Specialty neuro module

- Add Muse integration if the product moves into sleep training, meditation adherence, focus recovery, or Shen-oriented coaching.
- Keep it optional, not core, unless product strategy changes.

## Phase 5: Learning system

- Collect labeled outcomes.
- Compare recommendation response over time.
- Build validation studies.
- Consider machine learning only after robust rule-based telemetry exists.

## What the Next AI Should Assume

The next AI taking over this system should assume the following:

1. The current QRMA logic is strong and should remain the backbone.
2. Future work should extend the system, not flatten it.
3. Constitution should be multi-score, not one-value.
4. Anthropometrics should be modifiers and confidence enhancers.
5. Oura is the best first wearable integration.
6. Polar H10 is the best precision add-on.
7. Muse is a specialty module, not the first universal wearable choice.
8. All outputs should remain explainable and versioned.
9. The system must remain educational, conservative, and safety-aware.

## Technical Starter Checklist

For the next engineering or AI system, the practical first implementation steps should be:

- Create new tables for constitution profiles and daily wearable metrics.
- Extend client scan records with anthropometric and constitution summaries.
- Build a normalization library for wearable payloads.
- Build a rule-based constitution scoring service.
- Build overlay scoring for wearables and anthropometrics.
- Add confidence generation logic.
- Split practitioner and client narrative templates.
- Add engine versioning to every result object.
- Add contradiction logging.
- Add a data completeness score.

## Final Recommendation

The best future direction is not to replace the current QRMA-GDV logic, but to **wrap it inside a broader longitudinal intelligence framework**.

The recommended sequence is:

1. keep QRMA-GDV pattern logic as core,
2. add constitution as a stable baseline layer,
3. add anthropometrics as modifiers,
4. add Oura as the first scalable wearable integration,
5. add Polar H10 as a precision layer,
6. reserve Muse for specialty neuro or meditation modules.

This approach is the most coherent continuation of the current system because it preserves explainability, supports mixed-pattern reasoning, improves trend awareness, and creates a more robust bridge between scan-based interpretation and daily real-world physiology.

## Sources

1. Logic-Layer-QRMA-expanded.md — author not clearly stated in the file; document title: Logic Layer Specification Document QRMA-GDV Health Intelligence Engine.
