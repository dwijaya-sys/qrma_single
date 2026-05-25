# JSON Importer Handover Document

## Objective

Refactor the current QRMA dashboard import path so that JSON / JavaScript payloads become the primary input format, while preserving the current dashboard behavior, client-card update flow, and `calcAll()` scoring pipeline. [file:53][file:58]

## Scope

This handover covers only the **JSON importer step**. It does not redesign module calculators, charts, or action-plan logic yet. The immediate goal is to replace the fragile CSV-first import path with a mapping-driven JSON importer that writes into the existing form fields and then runs the current calculations unchanged. [file:53]

## Why this step comes first

The current app already works once values are present in the input fields, because the module calculators (`cBioAge`, `cOx`, `cTx`, `cMt`, `cCr`, `cNt`, `cSk`) all read values from existing DOM inputs and `calcAll()` orchestrates the rest of the dashboard update. [file:53]
The safest upgrade is therefore to change the **input pipeline first**, not the calculators. [file:53]

## Current import behavior

The existing app has a CSV upload entry point using the hidden input `csv-file-input`, then `initImportCSV()`, `parseCSV()`, `showImportModal()`, and `confirmImport()`. [file:53]
`parseCSV()` is a minimal parser that splits the file into lines, uses the first line as headers, the second line as values, and separates both by commas. This makes it convenient for simple files but brittle for quoted values, alternate row layouts, and richer source exports. [file:53]

The import preview modal already exists and displays patient name, test date, age, gender, matched field count, missing fields, and a confirmation button. [file:53]
`confirmImport()` then writes imported values directly into the current DOM inputs, updates the client card, closes the modal, and runs `calcAll()`. [file:53]

## Why JSON should be primary

The mapping file already expresses one-to-many relationships that fit structured payloads better than flat CSV columns. Examples include plaque feeding both `cp` and `cr-ch`, glutathione feeding both `ox-gsh` and `gsh`, vitamin C feeding `nt-vc`, `ox-vc`, and `vc`, and magnesium feeding both `cr-mg` and `nt-mg`. [file:58]
This means the real source of truth is no longer “column name equals field ID,” but “source concept maps to one or more dashboard fields,” which is a JSON-mapping problem rather than a CSV problem. [file:58]

## Target outcome

Build a new import flow where:

1. An upstream parser or manual script provides a JSON payload. [file:53][file:58]
2. A mapping-driven importer resolves source values into dashboard field IDs using `mappings.json`. [file:58]
3. The importer populates the existing DOM inputs without changing calculator behavior. [file:53]
4. The current client-card display is updated. [file:53]
5. The app runs `calcAll()` exactly as it does now. [file:53]

## Required constraints

- Preserve current UI behavior after import, including the import preview / confirmation concept. [file:53]
- Preserve current calculator behavior by continuing to write into the existing input IDs first. [file:53]
- Do not change scoring formulas in this step. [file:53]
- Use `mappings.json` as the field-routing authority, especially for `dashboardid`, `alsomapsto`, and `needsverification`. [file:58]
- Continue to support manual review of unmapped or verification-needed items. [file:53][file:58]

## Recommended payload format

Use a payload with four top-level keys:

```json
{
  "patient": {
    "name": "Frans",
    "age": 21,
    "gender": "male",
    "testdate": "2026-05-24"
  },
  "values": {
    "Kekentalan Darah": 61.274,
    "Kristal Atau Plak Kolesterol": 67.24,
    "Glutathione": 0.647,
    "Vitamin C": 3.67
  },
  "meta": {
    "source": "qrma-parser",
    "version": "1.0"
  },
  "warnings": []
}
```

This structure mirrors the current app’s separation between patient display fields and measurement fields, while allowing metadata and warnings that CSV cannot express cleanly. [file:53]

## Importer architecture

### Components

- **Payload source**: external parser, manual JSON file, or generated JS object. [file:58]
- **Mapping authority**: `mappings.json`. [file:58]
- **Importer**: `importFromPayload(payload, mappings)`. [file:53][file:58]
- **Field writer**: helper that writes to existing DOM input IDs. [file:53]
- **Preview / diagnostics**: reuse the current import modal pattern to show matched, missing, unmapped, and verification-needed items. [file:53]
- **Computation trigger**: current `calcAll()`. [file:53]

### Import flow

```text
payload
-> normalize patient block
-> normalize values block
-> lookup each source item in mappings.json
-> write dashboardid
-> write all alsomapsto targets
-> collect diagnostics
-> show preview / confirmation
-> commit values to DOM
-> update client card
-> run calcAll()
```

## Mapping rules

Each source item should be matched against a mapping row. The primary target is `dashboardid`; any extra destinations in `alsomapsto` must also be populated. [file:58]
Rows with no dashboard destination must not break the import; they should be reported as unmapped. [file:58]
Rows marked `needsverification: true` should still be visible in diagnostics even if they are imported, so a human can review them. [file:58]

### Examples from current mapping file

| Source item | Primary target | Additional targets | Meaning |
|---|---|---|---|
| Kristal Atau Plak Kolesterol | `cp` [file:58] | `cr-ch` [file:58] | Same plaque signal feeds both bio-age and cardio-renal inputs. [file:58] |
| Glutathione | `ox-gsh` [file:58] | `gsh` [file:58] | Same value feeds oxidative and bio-age pillar 3. [file:58] |
| Vitamin C | `nt-vc` [file:58] | `ox-vc`, `vc` [file:58] | Same value feeds nutrient, oxidative, and bio-age inputs. [file:58] |
| Magnesium | `cr-mg` [file:58] | `nt-mg` [file:58] | Same value feeds cardio-renal and nutrient panels. [file:58] |
| Insulin Secretion Coefficient | `ins` [file:58] | `mt-ins` [file:58] | Same value feeds bio-age and metabolic panels. [file:58] |

## Proposed file responsibilities

For the next step, the code can still live in the current HTML if needed, but the logical separation should be:

- `mappings.json`: source-to-dashboard routing rules. [file:58]
- `payload-schema.md` or equivalent inline documentation: payload format contract. [file:53][file:58]
- `importer.js`: normalization, mapping, diagnostics, DOM write, and commit flow. [file:53][file:58]
- existing dashboard file: retain current calculator and rendering behavior. [file:53]

## Implementation plan

### Phase 1: Add JSON import without breaking CSV

1. Add a new function `importFromPayload(payload, mappings)`. [file:53][file:58]
2. Keep current CSV import intact temporarily. [file:53]
3. Make the new importer write into the same DOM IDs that `confirmImport()` already populates. [file:53]
4. Reuse the client-card update logic and `calcAll()` trigger. [file:53]

### Phase 2: Convert CSV into a wrapper

1. Keep `csv-file-input` and modal UI for now. [file:53]
2. Replace direct CSV-to-DOM population with `csv -> payload -> importFromPayload`. [file:53]
3. Keep `parseCSV()` only as a temporary converter until upstream JSON becomes the main path. [file:53]

### Phase 3: Make JSON the default path

1. Accept direct JSON file upload or injected JS object. [file:53][file:58]
2. Use one importer code path for all sources. [file:53]
3. Leave CSV as a compatibility mode only. [file:53]

## Importer contract

### Input

```js
importFromPayload(payload, mappings, options?)
```

### Output

Return a diagnostics object instead of silently mutating state only:

```js
{
  patientApplied: true,
  mappedCount: 0,
  writtenFieldIds: [],
  unmappedItems: [],
  verificationNeeded: [],
  invalidValues: [],
  duplicateTargets: [],
  warnings: []
}
```

This is important because the current UI already has a review modal pattern, and the next AI should extend that idea instead of hiding import quality issues. [file:53]

## Pseudocode

```js
function importFromPayload(payload, mappings) {
  const diagnostics = {
    patientApplied: false,
    mappedCount: 0,
    writtenFieldIds: [],
    unmappedItems: [],
    verificationNeeded: [],
    invalidValues: [],
    duplicateTargets: [],
    warnings: []
  };

  applyPatient(payload.patient, diagnostics);

  Object.entries(payload.values || {}).forEach(([sourceKey, rawValue]) => {
    const mapping = findMapping(sourceKey, mappings);
    if (!mapping) {
      diagnostics.unmappedItems.push(sourceKey);
      return;
    }

    const numericValue = normalizeNumber(rawValue);
    if (numericValue === null) {
      diagnostics.invalidValues.push({ sourceKey, rawValue });
      return;
    }

    const targets = [mapping.dashboardid, ...splitAlsoMapsTo(mapping.alsomapsto)]
      .filter(Boolean);

    if (mapping.needsverification) {
      diagnostics.verificationNeeded.push(sourceKey);
    }

    targets.forEach((id) => {
      const written = setFieldValue(id, numericValue);
      if (written) {
        diagnostics.writtenFieldIds.push(id);
      } else {
        diagnostics.warnings.push(`Missing DOM field: ${id}`);
      }
    });

    diagnostics.mappedCount += 1;
  });

  updateClientCard(payload.patient);
  calcAll();
  return diagnostics;
}
```

## Field-writing strategy

For this step, continue to use existing DOM IDs as the write target because current calculators depend on them. Examples include `age`, `gender`, `bv`, `cp`, `gsh`, `ox-gsh`, `mt-ug`, `cr-mg`, `nt-mg`, `sk-sc`, and others. [file:53][file:58]
This is intentionally transitional. Later refactors can replace direct DOM writes with central state, but not in this step. [file:53]

## Patient block handling

The payload `patient` block should populate the existing client-facing fields used by the client card and demographics inputs, specifically `age`, `gender`, plus card display values for name, age, gender, and test date. [file:53]
Gender normalization must preserve the existing logic that already translates both English and Indonesian forms such as `male`, `female`, `pria`, `wanita`, and related variants. [file:53]

## Validation rules

At minimum, validate:

- `patient.age` is numeric before writing to `age`. [file:53]
- `patient.gender` resolves to supported gender values used by current calculations. [file:53]
- Measurement values can be converted to numbers. [file:53]
- Every target ID exists in the DOM before assignment. [file:53]
- One-to-many mappings from `alsomapsto` are expanded correctly. [file:58]
- Unmapped items are logged, not silently discarded. [file:58]

## Edge cases the next AI must handle

- Source items with no dashboard target, which are explicitly common in `mappings.json`. [file:58]
- One source mapping to multiple targets, such as vitamin C, magnesium, glutathione, plaque signal, and insulin secretion coefficient. [file:58]
- Source label spelling differences across PDF extraction or bilingual labels. `mappings.json` contains both Indonesian `id` names and English `en` names, so the matcher should support either. [file:58]
- Duplicate semantic sources that point to the same dashboard field, where import precedence must be deterministic. [file:58]
- Missing DOM field IDs if the HTML changes before importer refactor is completed. [file:53]

## Acceptance criteria

The step is complete when all of the following are true:

- A JSON payload can populate the current dashboard without manual field entry. [file:53][file:58]
- The importer uses `mappings.json` rather than hardcoded field routing. [file:58]
- `dashboardid` and `alsomapsto` are both honored. [file:58]
- The current client card is updated after import. [file:53]
- The current `calcAll()` runs after import and the dashboard renders results as before. [file:53]
- Unmapped, invalid, and verification-needed items are surfaced in diagnostics. [file:53][file:58]
- No calculator formula is changed in this step. [file:53]

## Explicit non-goals for this step

- Do not refactor `cBioAge`, `cOx`, `cTx`, `cMt`, `cCr`, `cNt`, `cSk`, or `buildAction()`. [file:53]
- Do not replace current charts or navigation. [file:53]
- Do not migrate to framework state management yet. [file:53]
- Do not use CSV field names as the long-term system contract. [file:53][file:58]

## Recommended first coding tasks

1. Create a `findMapping(sourceKey, mappings)` helper that can match both Indonesian `id` and English `en`. [file:58]
2. Create `splitAlsoMapsTo()` to expand `alsomapsto` values into an array of target field IDs. [file:58]
3. Create `setFieldValue(id, value)` that safely writes only when the DOM field exists. [file:53]
4. Create `applyPatient(patient)` that updates demographics inputs and the client card. [file:53]
5. Create `importFromPayload(payload, mappings)` and return diagnostics. [file:53][file:58]
6. Make the current CSV path call the same importer after converting CSV to payload. [file:53]

## Final guidance to the next AI

Treat this as an **adapter layer**, not a rewrite. The mission is to make input ingestion stable while leaving current scoring behavior intact. [file:53]
If a design choice risks changing calculated results, defer it. The importer’s first job is only to get the right values into the right existing fields, with traceable diagnostics and mapping-driven routing. [file:53][file:58]
