# HRV Integration Handover for the Next AI System

## Objective

Build the next input architecture layer for the Swasthya Usadha / Usaka Wellness dashboard so the system can ingest QRMA, HRV from Polar H10, other HRV devices, labs, and manual clinical inputs through one canonical session payload. [file:2][file:29]

The immediate goal is not to redesign the whole dashboard UI or refactor all module calculators yet; the goal is to create the data contract and adapter path that lets future sources plug in cleanly while preserving current dashboard behavior where needed. The current handover explicitly says the safest upgrade path is to change the input pipeline first and keep calculators stable until the later v3 normalization phase. [file:2][file:29]

## Assumptions

- The app remains a single-file HTML/local-first system for now. [file:4][cite:34]
- The current dashboard structure with 8 visible modules remains the active UI model. The handover defines Module 8 as an aggregated output layer with no direct inputs. [file:29]
- HRV is a new supporting source domain, not yet a standalone first-class scoring module in v2. [cite:44][file:29]
- `thresholds.json` is the baseline for the future modular rules engine, but the current v2 calculator code must not be destabilized early. [file:3][file:29]
- The user prefers a modular, machine-readable, rules-based architecture with visible incomplete-data flags. [cite:45][cite:46]

## Requirements

### Functional requirements

- Accept a unified session payload with multiple source blocks: `qrma`, `hrv`, `labs`, and `manual_clinical`. The existing importer handover already establishes JSON as the preferred long-term input contract. [file:2]
- Normalize each source into:
  - `normalized_inputs.dashboard_fields` for current dashboard compatibility.
  - `normalized_inputs.shared_metrics` for future rules and correlations. [file:2][file:29]
- Support HRV from Polar H10 first, but use a device-agnostic internal HRV schema so other devices can be added later without changing the scoring architecture. [cite:44]
- Preserve client card update flow, demographics handling, and the `calcAll()` trigger path when current v2 compatibility mode is used. The current dashboard depends on DOM field IDs and `calcAll()` orchestration. [file:2][file:4]

### Non-functional requirements

- Stay local-first and avoid requiring a separate server. [cite:34]
- Keep imports auditable: source type, device model, timestamp, parser version, and quality flags must be retained in the payload. The zone-based v3 plan explicitly values auditable scoring and traceable inputs. [file:29]
- Avoid hardcoding new device logic into v2 module functions like `cBioAge`, `cOx`, `cMt`, `cCr`, and others unless no alternative exists. The current handover says input adaptation should come first, not calculator rewrites. [file:2]

## Users and roles

- **Operator / practitioner:** imports QRMA, HRV, and manual data into a patient session, reviews diagnostics, and calculates screening outputs. [file:4][file:29]
- **Rules author / analyst:** maintains mappings, thresholds, and future interpretation logic in machine-readable config files. [file:3]
- **Patient / client:** receives screening-oriented results only, never diagnostic claims. The handover requires non-diagnostic language and confirmatory test positioning. [file:29]

## Current state

The current dashboard reads values from DOM input fields, then runs `calcAll()`, which calls `cBioAge`, `cOx`, `cTx`, `cMt`, `cCr`, `cNt`, and `cSk`, then updates charts and Action Plan output. [file:4][file:2]

The current import path is CSV-first: file picker -> `parseCSV()` -> preview modal -> `confirmImport()` -> DOM writes -> `calcAll()`. This path is intentionally transitional and is brittle for richer source data. [file:2][file:4]

The zones handover also says the next major refactor is a normalization layer that reads zone columns and replaces old hardcoded 0-100 style logic with traceable, config-driven scoring. [file:29]

## Target architecture

Use a 5-part architecture:

1. Source adapters
2. Canonical session payload
3. Normalization layer
4. Legacy DOM compatibility writer
5. Future rules-engine builder [file:2][file:29][file:3]

The core rule: do not let device-specific logic leak directly into the UI calculators unless absolutely necessary. The JSON importer handover frames the importer as an adapter layer, and the zone handover frames v3 as normalization-driven rather than hardcoded. [file:2][file:29]

## Proposed solution

### 1. Canonical session payload

Implement a canonical payload named something like `session_payload_v1`. It should support multiple source blocks and keep both current-UI compatibility and future rules-engine needs. [file:2][cite:44]

Recommended structure:

```json
{
  "schema_version": "0.2.0",
  "session_id": "sess-2026-05-25-001",
  "patient": {
    "patient_id": "PT-0001",
    "name": "Frans",
    "age_years": 21,
    "sex": "male",
    "dob": null,
    "ethnicity_context": "indonesian",
    "height_cm": null,
    "weight_kg": null,
    "waist_cm": null
  },
  "encounter": {
    "test_datetime": "2026-05-25T09:45:00+07:00",
    "timezone": "Asia/Jakarta",
    "location": "Jakarta Utara",
    "operator": null,
    "notes": []
  },
  "sources": {
    "qrma": {
      "present": true,
      "source_type": "qrma_pdf_parser",
      "device_vendor": "QRMA",
      "device_model": null,
      "source_file": "example.pdf",
      "parser_version": "v3",
      "warnings": [],
      "values": {},
      "zones": {}
    },
    "hrv": {
      "present": true,
      "source_type": "wearable_export",
      "device_vendor": "Polar",
      "device_model": "H10",
      "recording_context": "supine_rest",
      "measurement_window_sec": 300,
      "start_datetime": "2026-05-25T07:10:00+07:00",
      "end_datetime": "2026-05-25T07:15:00+07:00",
      "quality": {
        "artifact_percent": 2.1,
        "signal_quality": "good",
        "quality_score_0_100": 92,
        "usable_for_scoring": true
      },
      "metrics": {
        "resting_hr_bpm": 58,
        "rmssd_ms": 42.5,
        "sdnn_ms": 51.2,
        "pnn50_percent": 18.0,
        "lf_ms2": null,
        "hf_ms2": null,
        "lf_hf_ratio": null
      },
      "derived": {
        "ln_rmssd": 3.75,
        "recovery_state": null,
        "hrv_age_proxy": null
      },
      "warnings": []
    },
    "labs": {
      "present": false,
      "panels": []
    },
    "manual_clinical": {
      "present": true,
      "inputs": {
        "bmi": 22.5,
        "waist_cm": 82,
        "blood_pressure_sys": null,
        "blood_pressure_dia": null,
        "sleep_hours": null,
        "stress_score_0_10": null
      }
    }
  },
  "normalized_inputs": {
    "dashboard_fields": {},
    "shared_metrics": {}
  },
  "rule_inputs": {
    "completeness_flags": {},
    "confidence_flags": {}
  },
  "warnings": [],
  "audit": {
    "imported_at": "2026-05-25T10:20:00+07:00",
    "import_path": "json_importer",
    "mapping_version": "mappings.json",
    "threshold_version": "thresholds.json"
  }
}
```

This keeps backward compatibility with the current importer logic while extending the data contract for future sources that do not map directly to existing DOM field IDs. [file:2][file:4]

### 2. Source adapters

Implement adapters as separate logical functions, even if they initially live in one script file:

- `adaptQrmaSource(qrmaSource, mappings)`
- `adaptPolarH10Source(hrvSource)`
- `adaptGenericHrvSource(hrvSource)`
- `adaptManualClinicalSource(manualSource)`
- `adaptLabSource(labSource)` [file:2][cite:44]

Each adapter must return a normalized object like:

```js
{
  dashboard_fields: {},
  shared_metrics: {},
  warnings: [],
  diagnostics: []
}
```

This allows QRMA values to continue feeding existing DOM fields while HRV can feed shared metrics first without breaking current module logic. The importer handover already defines diagnostics as a first-class output, not an afterthought. [file:2]

### 3. Normalization layer

Add a normalization function that merges adapter outputs into a single object:

```js
function normalizeSessionPayload(sessionPayload, mappings) {
  return {
    patient: normalizedPatient,
    dashboard_fields: {...},
    shared_metrics: {...},
    rule_inputs: {...},
    warnings: [...],
    diagnostics: {...}
  };
}
```

This layer should:
- Normalize sex/gender values the same way current import logic already does. [file:2][file:4]
- Normalize numeric fields and reject invalid values with diagnostics. The current importer handover explicitly requires invalid-value reporting and missing-target reporting. [file:2]
- Normalize HRV metrics into a device-agnostic schema.

Suggested shared HRV keys:
- `autonomic.resting_hr_bpm`
- `autonomic.rmssd_ms`
- `autonomic.ln_rmssd`
- `autonomic.sdnn_ms`
- `autonomic.pnn50_percent`
- `autonomic.artifact_percent`
- `autonomic.quality_score_0_100`
- `autonomic.measurement_context`
- `autonomic.usable_for_scoring` [cite:44]

### 4. Legacy DOM compatibility writer

Implement a compatibility writer that only writes values needed by the current dashboard:

```js
function writeDashboardFieldsToDom(dashboardFields, options = {}) {}
```

This must:
- Continue to populate current DOM IDs such as `age`, `gender`, `bv`, `cp`, `mt-wc`, `nt-vc`, `ox-gsh`, etc., because the current calculators depend on them. [file:2][file:4]
- Reuse the existing client card update pattern, because the importer handover requires preserving current UI behavior. [file:2]
- Not attempt to force HRV metrics into unrelated existing IDs just to make them “fit.”

### 5. Future rules-engine builder

Implement a non-disruptive builder that prepares v3 rule inputs without activating v3 scoring yet:

```js
function buildRuleInputs(normalizedSession, thresholdsConfig) {}
```

This should create:
- completeness flags
- confidence flags
- quality flags
- shared input registry
- source provenance [file:3]

This step aligns with `thresholds.json`, which already structures inputs by shared rules, module parameters, evidence level, and derived conditions. [file:3]

## Module placement plan

### Main principle

HRV should be treated as a shared autonomic recovery domain, not stuffed into a single existing module immediately. That is the safest and most extensible approach for later correlation-rule analysis. [cite:34][cite:44]

### Recommended placement

- **Primary home:** new hidden/shared domain `autonomic_recovery`
- **First visible use:** Module 8 Action Plan, where HRV can influence recovery/stress recommendations and retest timing
- **Later influence:** cross-module modifier for Bio Age, Oxidative, Metabolic, and Cardio-Renal
- **Not recommended yet:** creating a visible ninth module before the rules layer is ready [file:29][file:3]

### Why

Module 8 is already defined as an output layer with no direct raw inputs, making it the safest first place to expose HRV-derived guidance without distorting current score semantics. [file:29]

The thresholds draft is also already built around shared inputs and derived logic, which is a good fit for HRV as a modifier rather than a direct legacy field. [file:3]

## File responsibilities

Recommended file split for the next step:

| File | Responsibility |
|---|---|
| `qrma-dashboard-v2.html` | Keep current UI, existing module forms, current `calcAll()` path, import modal hooks. [file:4] |
| `mappings.json` | Continue to act as QRMA source-to-field routing authority. [file:2][file:29] |
| `thresholds.json` | Baseline rules/config file for future module scoring and alert logic. [file:3] |
| `session-schema.md` or inline schema doc | Canonical payload contract for all sources. [file:2] |
| `importer.js` | Session ingestion orchestration, adapter execution, normalization, diagnostics, DOM compatibility writing. [file:2] |
| `hrv-adapters.js` or equivalent section in `importer.js` | Polar H10 and generic HRV normalization logic. [cite:44] |

## Workflow

1. Receive unified session payload.
2. Validate `patient` and `encounter`.
3. Run source adapters.
4. Merge into normalized session object.
5. Write only legacy-compatible `dashboard_fields` into current DOM if compatibility mode is enabled.
6. Update client card.
7. Optionally show diagnostics in the import modal.
8. Run `calcAll()` only after DOM write completes.
9. Store shared metrics and rule inputs for future v3 use. [file:2][file:4][file:29]

## Developer rules

- Do **not** refactor `cBioAge`, `cOx`, `cTx`, `cMt`, `cCr`, `cNt`, `cSk`, or `buildAction()` in this step unless strictly necessary for compatibility. The importer handover explicitly forbids changing formulas during the input-layer step. [file:2]
- Do **not** replace current charts or page navigation in this step. [file:2][file:4]
- Do **not** use HRV values as fake substitutes for unrelated current QRMA fields. HRV should enter through `shared_metrics`, not through misleading field reuse. [cite:44]
- Do **not** remove non-diagnostic disclaimer language. The legal/clinical language rules require it to remain non-dismissable and screening-oriented. [file:29]
- Do **not** overwrite previous versioned files. The handover explicitly requires new version suffixes for major changes such as `qrma-dashboard-v3.html`. [file:29]

## Suggested implementation sequence

### Phase 1: Schema and adapters

- Create canonical session payload contract.
- Implement `adaptPolarH10Source()` and `adaptGenericHrvSource()`.
- Add `normalizeSessionPayload()`.
- Add diagnostics object structure. [file:2][cite:44]

### Phase 2: Compatibility mode

- Implement `writeDashboardFieldsToDom()`.
- Ensure current `age`, `gender`, client card, and mapped QRMA/manual values still populate correctly.
- Ensure `calcAll()` still runs exactly once after import. [file:2][file:4]

### Phase 3: HRV-aware diagnostics

- Extend import modal to show source presence, HRV quality, incomplete fields, and scoring eligibility.
- Show HRV as “available / quality good / not yet included in module scoring” if v3 rules are not active yet. This aligns with visible incomplete-data and quality-aware behavior. [cite:45]

### Phase 4: v3 handoff prep

- Build `buildRuleInputs()` output compatible with `thresholds.json`.
- Define how `autonomic_recovery` will modify Action Plan first, then later Bio Age / Oxidative / Metabolic / Cardio-Renal. [file:3][file:29]

## Data contract details

### Required patient fields

- `name`
- `age_years`
- `sex`

These are needed because the current dashboard depends on age and gender for calculations and display. [file:4][file:2]

### Minimum HRV fields for scoring eligibility

- `resting_hr_bpm`
- `rmssd_ms`
- `measurement_window_sec`
- `artifact_percent`
- `usable_for_scoring`

These should be the minimum acceptable set for any HRV source to influence future rules. The visible incomplete-data flag preference supports this quality gate. [cite:45]

### Recommended HRV fields

- `sdnn_ms`
- `pnn50_percent`
- `ln_rmssd`
- `recording_context`
- `quality_score_0_100`

### Optional HRV fields

- `lf_ms2`
- `hf_ms2`
- `lf_hf_ratio`
- `respiration_rate`
- `orthostatic_delta`

## Suggested diagnostics object

```js
{
  patientApplied: false,
  mappedCount: 0,
  writtenFieldIds: [],
  sourceSummaries: [],
  unmappedItems: [],
  verificationNeeded: [],
  invalidValues: [],
  duplicateTargets: [],
  qualityWarnings: [],
  warnings: [],
  incompleteDataFlags: [],
  sharedMetricsAvailable: []
}
```

The structure should extend the current importer diagnostics style rather than replacing it. The existing importer handover already treats diagnostics as a core output. [file:2]

## HRV-specific logic rules

For the next AI system, apply these rules:

- HRV must be accepted as a source even if it does not populate any current DOM field IDs.
- HRV with poor artifact quality or missing recording context must be marked as supportive only or excluded from scoring.
- HRV should first influence Action Plan / recovery guidance, not core module score math.
- HRV should not override stronger findings from QRMA, labs, or manual clinical values until the rules engine explicitly defines that relationship. This is consistent with the project’s staged move toward evidence-prioritized thresholds and derived logic. [file:3][file:29]

## Risks and gaps

- HRV interpretation quality varies by device, export type, body position, and session duration. That is why the adapter and quality gate must exist before scoring. [cite:44]
- The current v2 dashboard does not yet have a clean state layer separate from the DOM, so a full normalization engine must coexist with legacy DOM writes for a while. [file:2][file:4]
- The current module scores are still heuristic and partially hardcoded. The zone handover makes clear that a later v3 normalization layer is the real place for durable multi-source interpretation. [file:29]
- Some fields such as `mt-bmi` and `mt-wc` may come from manual or derived clinical inputs rather than QRMA parser output, and this should be explicitly supported in the canonical payload. The handover already identifies some permanent parser gaps. [file:29]

## Acceptance criteria

This step is complete when all of the following are true:

- A canonical session payload can carry QRMA, HRV, manual, and future lab data in one object. [file:2][cite:44]
- QRMA values still populate existing dashboard fields through mappings and compatibility writing. [file:2][file:4]
- HRV values are normalized into shared metrics without breaking current v2 calculations. [file:4][cite:44]
- The system returns diagnostics for missing, invalid, quality-limited, and not-yet-scored source data. [file:2][cite:45]
- The current client card and `calcAll()` flow still work when compatibility mode is used. [file:2][file:4]
- No non-diagnostic wording rules are violated. [file:29]
- No calculator formula is silently changed during this adapter-layer step. [file:2]

## Copy-paste task brief

Use this exact brief for the next AI system:

- Build a canonical `session_payload` contract supporting `qrma`, `hrv`, `labs`, and `manual_clinical`. [file:2][cite:44]
- Implement source adapters with a device-agnostic HRV schema for Polar H10 first. [cite:44]
- Add a normalization layer that outputs both `dashboard_fields` and `shared_metrics`. [file:2][file:29]
- Preserve current DOM-based compatibility mode for `qrma-dashboard-v2.html` and keep `calcAll()` unchanged unless absolutely necessary. [file:2][file:4]
- Treat HRV as a shared `autonomic_recovery` domain, not a forced current-module field set. [cite:44][file:29]
- Surface HRV quality and completeness in diagnostics and optionally in the import modal.
- Prepare `rule_inputs` compatible with future `thresholds.json`-style scoring logic. [file:3]
- Do not rewrite the existing calculators yet. [file:2]
