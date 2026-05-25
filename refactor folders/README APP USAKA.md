# QRMA Refactor Starter Pack

This starter pack is the first config layer for refactoring the current single-file QRMA dashboard into a maintainable multi-file static application.

## Included files

- `module-definitions.json` — module contracts, IDs, goals, inputs, outputs, alert intent, and developer notes.
- `thresholds.json` — threshold baseline, shared-input rules, special cases, and Module 8 aggregation constraints.
- `app-state-schema.json` — canonical state skeleton for shared inputs, module inputs, results, alerts, action plan, and future semantic enrichment.

## Intended use order

1. Create a central store using `app-state-schema.json`.
2. Extract current calculator functions into separate files without changing behavior.
3. Make each calculator read from `appState.sharedInputs` and `appState.moduleInputs`.
4. Compare current outputs against the legacy single HTML app.
5. Only after behavior is stable, align calculator thresholds and alert mapping to `thresholds.json`.
6. Use `module-definitions.json` as the source of truth for module metadata, labels, and contracts.

## Important implementation notes

- Preserve current prototype behavior first; do not “clean up” formulas and thresholds in the same pass as file extraction.
- Magnesium and potassium must be single shared inputs reused by Modules 5 and 6.
- Vitamin C and Vitamin E should also be treated as shared signals reused across oxidative and nutrient contexts.
- Module 8 is an aggregator only; it should not own raw user inputs.
- The screening disclaimer in Module 8 must always render and must not be dismissable.
- Silicon should carry a visible weak-evidence warning in the UI.
- Waist circumference must use Asian-specific thresholds for Indonesian users.

## Recommended next files

The next config pack should add:

- `confirmatory-tests.json`
- `food-actions.json`
- `csv-field-map.json`
- `shared-inputs.json`
- `ui-text.json`
- `evidence-labels.json`

## Suggested folder layout

```text
refactor-file-pack/
  README.md
  module-definitions.json
  thresholds.json
  app-state-schema.json
```
