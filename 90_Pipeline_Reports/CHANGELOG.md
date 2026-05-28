# QRMA Dashboard — Changelog

---

## 2026-05-28 — Dashboard v3 QA Session

### Features Completed
- Language toggle UI button added to header
- Zone badge labels corrected: Mild Concern→Mild, Action Needed→Moderate
- bmr() updated: uses getBadge(zone) when zone present, falls back to static map
- Skin chips migrated to zone labels (Deficient/Borderline retired)
- Joint Collagen (sk-jc) remapped: Kolagen Sendi→Sistem Pergerakan (Kolagen form p.72)
  sk-jc now populates: value 5.271, zone ringan for Ridwan
- Sebum bidirectional alert added to buildAction()
- getBadge('unknown') fallback: returns '—' instead of blank

### CSS Fixes
- Pillar bar label font size increased, colour set to --txt
- Confirmatory test column font size increased
- Hint text and reference range text set to --txt (full black light mode)
- Alert description .aald set to --txt

### Baseline Corrections
- tx-pb corrected to normal (0.144 within PDF range 0.052-0.643)
  Previous baseline claiming sedang was incorrect
- Validated field count updated: 62/64 (sk-jc now maps correctly)

### QA Sign-off
- Run ID: run_ridwan_20260528
- Workflow: Operator → Tester → Reviewer
- Verdict: APPROVE
- Blocking rules triggered: 0 / 11
- Advisory triggered: 1 (buildAction zone gates — deferred)
- Patients validated: Ridwan, Kamiyanti, Frans

### Deferred to Backlog
- buildAction() zone gates (Pending Change #2)
- sk-tw direction ambiguity
- Debug log removal before production release
- Parameter name translation (ID/EN display labels)
- Manual input form for mt-bmi and mt-wc
- Flask microserver for PDF import (Option B)
