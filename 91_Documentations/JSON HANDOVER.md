# QRMA Pipeline — Session Handover Document
# Generated: 2026-05-24
# Format: Machine-readable Markdown — structured for AI agent consumption
# Project: F:\TeleTCM_Project\qrma_single
# Brand: Swasthya Usadha | Program: Usaka Wellness

---

## 1. CONTEXT

### 1.1 What This Project Is
A single-file HTML health screening dashboard that:
- Ingests raw QRMA (Quantum Resonance Magnetic Analysis) device report PDFs (95 pages, Bahasa Indonesia)
- Normalises and maps parameter values to 8 clinical domain modules
- Displays screening results with alerts, food-first recommendations, and confirmatory lab suggestions
- Is NOT a diagnostic tool — all outputs are screening indicators only

### 1.2 Brand & Legal Context
- Brand: Swasthya Usadha
- Program: Usaka Wellness
- All outputs must use non-diagnostic language ("pattern suggests", "screening flag", "consider confirming with")
- Disclaimer must be non-dismissable in UI: "For Reference Only · Not a Diagnosis"

### 1.3 Reference Patient
- Name: Ridwan | Age: 40 | Gender: Male
- PDF: QRMA_Ridwan_November_21.pdf (95 pages, 13MB)
- Used as primary test vector throughout this session

---

## 2. FILE INVENTORY

### 2.1 Active Files (deploy these)

```
FILE                    VERSION   ROLE
parser_v3.py            v3        PDF → raw values + zone derivation + SQLite ingest
csv_exporter_v2.py      v2        CLI wrapper: PDF → named CSV (imports from parser_v3)
mappings.json           current   Bilingual mapping: Indonesian PDF name → dashboard field ID
qrma-dashboard-v2.html  current   Single-file HTML app with CSV import modal
database.py             stable    SQLAlchemy models — used by another dev, do not version-rename
CLAUDE.md               current   Full project context for Claude Code auto-load
```

### 2.2 Superseded Files (keep but do not use)

```
FILE                    REASON SUPERSEDED
parser.py               Original — no mapping layer, no zone support
csv_exporter.py         v1 — imports from parser_v2, no zone columns
```

### 2.3 Reference Documents (keep in project root)

```
FILE                                    CONTENTS
qrma-dashboard-v2-handover.md           Original architecture & module spec (24K)
QRMA_Ridwan_November_21.md              Full 95-page report as markdown (184K) — parameter reference
module-spec-evidence-reference.md       Module specification with evidence citations, alert language,
                                        Asian waist thresholds, lab test lookup table
                                        [NOTE: rename from 817ab326.md — was uploaded mid-session]
```

---

## 3. PIPELINE ARCHITECTURE

### 3.1 Data Flow

```
QRMA PDF (95 pages, Bahasa Indonesia)
    │
    ▼
parse_qrma_pdf()                         ← parser_v3.py §5
    ├── Extract demographics (page 1)    name, age, gender (normalised to en), test_date, figure
    ├── Extract Hasil Pengujian Aktual   all parameter tables (header: "Barang pengujian")
    └── Extract Referensi Standar        4-zone boundaries per parameter (text block, not table)
            │
            ▼
    parsed_data = {
        demographics: {...},
        items: [{category, parameter_name, normal_range, actual_value}, ...],
        ref_standards: {param_name: {normal, ringan, sedang, berat, direction}, ...}
    }
            │
    ┌───────┴───────────────────────────────────┐
    ▼                                           ▼
ingest_to_db()                          apply_mappings()          ← parser_v3.py §6
(SQLite — other dev)                        │
                                        uses: mappings.json
                                        uses: ref_standards (tier 1)
                                        uses: zone_boundaries in mappings (tier 2 fallback)
                                            │
                                            ▼
                                    mapped    = {field_id: raw_value}
                                    zones     = {field_id_zone: zone_label}
                                    warnings  = [...]
                                    unmapped  = [pdf_param_names_with_no_mapping]
                                            │
                                            ▼
                                    export_dashboard_csv()        ← parser_v3.py §8
                                            │
                                            ▼
                            {patient_name}_{YYYY-MM-DD}.csv
```

### 3.2 CSV Column Structure

```
COLUMNS (in order)
  demographics:     name, age, gender, test_date
  raw values:       bv, cp, art, ins, bs, fr, hyp, ph, pb, hg,
                    ce, cs, cj, coq, gsh, vc, ve, ost,
                    ox-gsh, ox-coq, ox-vc, ox-ve, ox-sel, ox-fr, ox-hyp, ox-ph,
                    tx-pb, tx-hg, tx-cd, tx-as, tx-st, tx-tb, tx-ps,
                    mt-tg, mt-ug, mt-ins, mt-fm, mt-bmi, mt-wc,
                    cr-ch, cr-vf, cr-lv, cr-ua, cr-pt, cr-k, cr-mg,
                    nt-zn, nt-mg, nt-k, nt-io, nt-si, nt-b6, nt-vc, nt-d3, nt-ve, nt-fo,
                    sk-sc, sk-el, sk-tw, sk-sb, sk-ml, sk-sn, sk-ec, sk-jc,
                    warnings
  zone labels:      bv_zone, cp_zone, art_zone, ... (one per raw field above)
                    values: "normal" | "ringan" | "sedang" | "berat" | "unknown"

TOTAL COLUMNS: 64 raw + 60 zone + 1 warnings = 125
```

### 3.3 Running the Pipeline

```bash
# Auto-detect single PDF in folder
python csv_exporter_v2.py

# Specify PDF
python csv_exporter_v2.py --pdf "QRMA_Ridwan_November_21.pdf"

# Full control
python csv_exporter_v2.py --pdf "file.pdf" --mappings "mappings.json" --out "data\output.csv"
```

### 3.4 Expected Output (Ridwan baseline)

```
Parameters extracted       : 253
Ref Standard entries found : 214
Mapping entries loaded     : 99
Dashboard fields populated : 60 / 64
Fields with zone data      : 60 / 60
Warnings                   : 2 (informational only — see §4.3)
```

---

## 4. MAPPINGS.JSON SCHEMA

### 4.1 Entry Structure

```json
{
  "id":                "Kadar Asam Urat",         // Indonesian PDF param name — EXACT match required
  "en":                "Uric Acid Level",           // English translation
  "dashboard_id":      "cr-ua",                    // primary dashboard field ID
  "also_maps_to":      [],                          // additional field IDs (same value written to all)
  "module":            "cardio",                    // module name
  "normal_range":      "1.435-1.987",              // INFORMATIONAL ONLY — see zone_boundaries
  "actual_value":      0.0,                         // placeholder from original Gemini extraction
  "needs_verification": false,                      // all entries now verified
  "direction":         "higher-worse",             // "higher-worse" | "lower-worse" | "bidirectional"
  "zone_boundaries": {                              // fallback zones (used when PDF ref unavailable)
    "normal": [1.435, 1.987],
    "ringan": [1.987, 2.544],
    "sedang": [2.544, 3.281],
    "berat":  [3.281, null]                         // null = float('inf')
  },
  "note":              "..."                        // human-readable explanation
}
```

### 4.2 Multi-Target Fields
Some PDF parameters feed multiple dashboard fields (same value written to all):

```
"Koefisien Sekresi Insulin" → dashboard_id: "ins",  also_maps_to: ["mt-ins"]
"Vitamin C"                 → dashboard_id: "nt-vc", also_maps_to: ["ox-vc", "vc"]
"Tingkat Radikal Bebas..."  → dashboard_id: "ox-fr", also_maps_to: ["fr"]
"Kalium"                    → dashboard_id: "cr-k",  also_maps_to: ["nt-k"]
"Magnesium"                 → dashboard_id: "cr-mg", also_maps_to: ["nt-mg"]
"Kristal Atau Plak..."      → dashboard_id: "cp",    also_maps_to: ["cr-ch"]
"Timbal"                    → dashboard_id: "tx-pb", also_maps_to: ["pb"]
"Merkuri"                   → dashboard_id: "tx-hg", also_maps_to: ["hg"]
```

### 4.3 Known Permanent Gaps (4 fields — not fixable from parser)

```
FIELD    REASON
cj       "Kolagen Sendi" not extracted as a table row in PDF
sk-jc    Same source as cj
mt-bmi   "Kegemukan" is a section heading in PDF, not a data row
mt-wc    "Lingkar Pinggang" not present as a table row in PDF
```
These must be entered manually in the dashboard or derived from demographics (height/weight in PDF figure field).

---

## 5. ZONE SYSTEM

### 5.1 What Zones Are
The QRMA PDF contains two data layers per parameter section:
1. **Hasil Pengujian Aktual** — the table with raw measured values (already extracted in v1/v2)
2. **Referensi Standar** — a 4-zone classification table (new in v3)

The Referensi Standar assigns every measured value to one of four zones:

```
ZONE      LABEL (Indonesian)   DISPLAY SCORE   COLOUR
normal    Normal (-)           9               Green
ringan    Abnormal Ringan (+)  6               Blue
sedang    Abnormal Sedang (++) 3               Yellow
berat     Abnormal Berat (+++) 1               Red
unknown   Not available        0               Grey
```

### 5.2 Zone Derivation — Two-Tier Priority

```
TIER 1: ref_standards (live extraction from PDF Referensi Standar section)
  - Covers ~214 of 253 parameters
  - Standard 4-zone format: value(-)  value(+)  value(++)  >value(+++)
  - Auto-detects direction from relative zone positions

TIER 2: zone_boundaries in mappings.json (fallback)
  - Covers parameters from non-standard PDF sections:
    • "Kisaran Yang Sehat" format (Gula Dalam Darah, Kualitas Fisik Dasar sections)
    • PH (3-zone custom format)
  - Applied ONLY when tier 1 returns None OR when tier 1 returns "unknown"
    (tier 1 can return "unknown" if it extracted only partial zone data)

DIRECTION EXTENSION RULE:
  For higher-worse parameters: values BELOW normal_min → return "normal"
  (e.g. uric acid below floor = healthier than normal, not a zone-miss)
  For lower-worse parameters: values ABOVE normal_max → return "normal"
```

### 5.3 Non-Standard PDF Sections (use tier 2 fallback)

```
SECTION (PDF)           FORMAT           PARAMS AFFECTED
Gula Dalam Darah        Kisaran format   bs (Koefisien Gula Darah)
                                         mt-ug (Koefisien Gula Dalam Urin)
                                         ins/mt-ins (Koefisien Sekresi Insulin)
Kualitas Fisik Dasar    3-zone custom    ph/ox-ph (PH)
Fungsi Ginjal           Standard 4-zone  cr-ua — BUT partial extraction from PDF
                                         (fallback zone_boundaries used for full coverage)
Skin section            Standard 4-zone  sk-tw — partial extraction (fallback used)
Elemen Manusia          NO ref section   All params → "unknown" (by design, skip flag set)
```

### 5.4 Why Zones Are Critical for Next Phase

The zone labels are the **foundation of the planned 1–10 normalization layer** in the dashboard.

**Current dashboard state:** Uses 0–100 risk index with hardcoded thresholds buried in minified JS. No connection to PDF's own reference system.

**Planned dashboard v3 state:** Replace 0–100 scoring with zones-driven 1–10 scores sourced directly from the PDF's Referensi Standar — the same classification the QRMA device itself uses.

```
ZONE   → SCORE   DISPLAY BAND   COLOUR
normal → 9       8–10           Green  (matches PDF Normal(-))
ringan → 6       5–7            Blue   (matches PDF Abnormal Ringan(+))
sedang → 3       3–4            Yellow (matches PDF Abnormal Sedang(++))
berat  → 1       1–2            Red    (matches PDF Abnormal Berat(+++))
```

**Benefits of zone-based scoring over current 0–100 system:**
1. Scoring thresholds come FROM the PDF — not guessed or hardcoded
2. Direction of concern is explicit per parameter (stored in mappings.json)
3. Matches exactly what clients see on their original QRMA printout
4. Eliminates need for 8 separate scoring functions with magic numbers
5. Single universal normalize(raw, zone_boundaries, direction) function replaces all
6. Auditable — every score can be traced back to its PDF zone boundary

**Architectural contract for next AI:**

```javascript
// Each parameter drives its display score from CSV zone column
// Example for bv (Blood Viscosity):
//   CSV: bv = 61.274,  bv_zone = "normal"
//   Display score = ZONE_SCORES["normal"] = 9
//   Color = green

const ZONE_SCORES = { normal: 9, ringan: 6, sedang: 3, berat: 1, unknown: 0 };

function scoreFromZone(zone_label) {
  return ZONE_SCORES[zone_label] ?? 0;
}
```

The zone columns in the CSV are already populated and ready. The dashboard just needs to read them.

---

## 6. DASHBOARD STATE

### 6.1 Active HTML Files

```
qrma-dashboard-v2.html   — previous version (pre-refactor, 0–100 scoring)
qrma-dashboard-v3.html   — ACTIVE version (zone-based scoring, JSON import)
```

### 6.2 What Was Built in Dashboard v3 (2026-05-26)

**New files added:**
```
03_Scripts\zone-scoring.js    — standalone zone-to-score module (v1.0)
03_Scripts\importer.js        — JSON importer adapter (v1.5.1, pre-existing)
```

**Zone scoring module (zone-scoring.js):**
```javascript
currentLang = 'id'                  // default Indonesian, toggle-ready
ZONE_SCORES  = {normal:9, ringan:6, sedang:3, berat:1, unknown:0}
ZONE_BADGES  = bilingual per zone (Option B — both langs per key)
ZONE_COLORS  = CSS class names per zone
scoreFromZone(zone)   → numeric score
getBadge(zone)        → display text in currentLang
getColor(zone)        → CSS class string
setLang(lang)         → 'en' | 'id' only
```

**HTML changes (all via str_replace — no full rewrites):**
```
<head>          zone-scoring.js + importer.js script tags added
confirmImport() JSON path added — detects .json vs .csv file
                window.zoneData populated before importFromPayload()
                CSV path unchanged
cBioAge()       REPLACED — zone burden → weighted 3-pillar bio age offset
cOx()           REPLACED — ax (antioxidant reserve) + px (pro-oxidant load)
cTx()           REPLACED — hm (heavy metals) + lb (lifestyle burden)
cMt()           REPLACED — gc (glycemic) + lp (lipid) + bmi/wc preserved
cCr()           REPLACED — cai (cardiac) + ri (renal)
cNt()           REPLACED — resilience — avg zone score × 10 nutrients
cSk()           REPLACED — resilience — cl (collagen) + bf (barrier) + sn
calcAll()       PATCHED  — nutrient bmr chips use i.zone (not i.min)
                PATCHED  — oxC/txC/mtC/crC use moduleZoneColor() not clrc()
buildAction()   UNCHANGED — raw field values still in all return objects
```

**New CSS classes (15 total):**
```css
.zone-badge                    — pill shape (shared)
.zone-normal/ringan/sedang/berat/unknown  — chip: background + text
.zt-normal/ringan/sedang/berat/unknown   — text-only variants
```

**Colour mapping (uses existing design tokens):**
```
normal  → --ok   + --okHi    (green)
ringan  → --blue + --blueHi  (blue)
sedang  → --gold + --goldHi  (amber)
berat   → --err  + --errHi   (red)
unknown → --txtM + --surf2   (muted)
```

**moduleZoneColor() logic:**
```
worst-zone drives module colour card:
  any berat  → cbad (red)
  any sedang → cwarn (orange)
  else       → cok (green)
```

### 6.3 Import Flow (v3)

```
User clicks Import
  → File picker opens (accepts .json and .csv)
  → FileReader reads file
  → If .json:
      JSON.parse → _jsonToRow() flattens for modal preview
      _showImportModal() shows patient + field count
      User confirms → window.zoneData populated from payload values
      QRMAImporter.importFromPayload() writes DOM fields + calls calcAll()
      closeImportModal()
  → If .csv:
      _parseCSV() reads first row (unchanged)
      _showImportModal() shows patient + field count
      User confirms → existing confirmImport() CSV path
      calcAll()
```

### 6.4 Validated Results (2026-05-26)

```
PATIENT     GENDER  FIELDS  ZONES   BIO AGE  SKIN        CONSOLE
Ridwan      Male    60/64   60/60   42y +2y  66% orange  Clean
Kamiyanti   Female  60/64   60/60   43y +2y  63% orange  Clean
```

**Module chip validation (Kamiyanti):**
```
Oxidative chips  — Selenium: Deficient→Normal (v2 threshold was wrong)
                   Vitamin E: Deficient confirmed by zone
                   All others consistent with zone data ✓
Skin chips       — 4 Borderline collagen, TEWL Normal (barrier healthy)
                   Joint Collagen: Deficient (sedang/berat zone confirmed)
Nutrient chips   — 5 Normal, 4 Borderline, 1 Deficient (Vit E)
                   Consistent with 80% module score ✓
```

**Zone display is now fully honest — every chip label traces to PDF Referensi Standar.**

### 6.5 Pending — Dashboard

```
1. Language toggle UI button (setLang() built, no UI trigger yet)
2. buildAction() zone-based gates (currently uses raw numeric values)
3. Sebum bidirectional alert in buildAction() (sk-sb ≤3=dry, ≥8=oily)
4. Dashboard QA skill files (Operator/Tester/Reviewer for HTML)
```

---

## 7. 8 MODULE REFERENCE

```
MODULE   ID          SCORE TYPE    CONFIDENCE              KEY INPUTS
1        basic       Bio age est.  Well-supported (heuristic) bv,cp,art,ins,bs,fr,hyp,ph,pb,hg,ce,cs,cj,coq,gsh,vc,ve,ost
2        oxidative   Risk↑worse    Exploratory               ox-gsh,ox-coq,ox-vc,ox-ve,ox-sel,ox-fr,ox-hyp,ox-ph
3        toxic       Risk↑worse    Needs lab confirm         tx-pb,tx-hg,tx-cd,tx-as,tx-st,tx-tb,tx-ps
4        metabolic   Risk↑worse    Well-supported            mt-tg,mt-ug,mt-ins,mt-fm,mt-bmi,mt-wc
5        cardio      Risk↑worse    Needs lab confirm         cr-ch,cr-vf,cr-lv,cr-ua,cr-pt,cr-k,cr-mg
6        nutrient    Resilience↑   Exploratory               nt-zn,nt-mg,nt-k,nt-io,nt-si,nt-b6,nt-vc,nt-d3,nt-ve,nt-fo
7        skin        Resilience↑   Exploratory               sk-sc,sk-el,sk-tw,sk-sb,sk-ml,sk-sn,sk-ec,sk-jc
8        action      Aggregated    Inherits from modules     output layer — no direct inputs
```

---

## 8. LANGUAGE & CLINICAL RULES

### 8.1 Approved Alert Language
```
APPROVED                              FORBIDDEN
"Pattern suggests..."                 "You have..."
"Screening flag..."                   "This means disease..."
"Consider confirming with..."         "42% risk of..."
"Monitor trend..."                    "Poisoning"
"Below reference range pattern..."    "Detox"
"Higher-than-reference pattern..."    "Confirmed body burden"
"Low concern"                         "Heart attack chance"
"Biologically older than expected"    "Kidney failure risk"
```

### 8.2 Alert Priority Tiers
```
TIER    LABEL                    THRESHOLD   ACTION
1       Needs Lab Confirmation   score 1–4   Confirmatory lab test required
2       Monitor                  score 5–6   Food-first action + reassess
3       Low Concern              score 7–9   Routine monitoring
```

### 8.3 Action Plan Rules
- Food-first before supplements or clinical referral
- Deduplicate: multiple metabolic flags → one combined recommendation
- Renal flags: always appear at top of priority list
- No major flags: show calm "routine monitoring" message
- Module 8 must be gated: only renders after calcAll() completes

---

## 9. DEPENDENCIES

```
Python packages:
  pdfplumber      PDF text and table extraction
  sqlalchemy      SQLite ORM (for ingest_to_db only — not needed for CSV-only use)

pip install pdfplumber sqlalchemy

CDN (HTML — already in <head>):
  chart.js 4.4.0           Radar + bar charts
  lucide (unpkg latest)    Icons
  Fontshare                Cabinet Grotesk (headings) + Satoshi (body)
```

---

## 10. VERSIONING CONVENTION

```
RULE: Never overwrite previous versions. Always create new version suffix.

CURRENT ACTIVE VERSIONS:
  parser_v3.py          ← active parser
  csv_exporter_v2.py    ← active exporter
  database.py           ← no version suffix (stable, shared with other dev)

NEXT VERSION NAMES (when modifying):
  parser_v4.py
  csv_exporter_v3.py
  qrma-dashboard-v3.html   (for next major dashboard refactor)
```

---

## 11. KNOWN ISSUES & DECISIONS LOG

```
ISSUE                               DECISION                        STATUS
Gender "Pria"/"Wanita" in CSV       Normalise at parser level +     FIXED v3
                                    HTML fallback map in confirmImport()

Referensi Standar name mismatch     Two-tier fallback system         FIXED v3
(table name ≠ ref section name)     (ref_standards → zone_boundaries)

Non-standard "Kisaran Yang Sehat"   zone_boundaries in mappings.json FIXED v3
sections (no 4-zone format)         as permanent fallback

Partial zone extraction from PDF    Secondary fallback: if derive_zone FIXED v3
(only normal zone extracted)        returns "unknown" with ref data,
                                    try zone_boundaries fallback too

Values below normal floor for       Direction-aware extension: return  FIXED v3
higher-worse params → "unknown"     "normal" for values below floor

Script tag missing in HTML          Single str_replace restoration      FIXED
(JS rendered as page text)

SQLite import blocking CSV export   Lazy import of database module      FIXED v3
(ModuleNotFoundError)               inside ingest_to_db() function body

4 permanently unpopulated fields    Structural — not fixable from      ACCEPTED
(cj, sk-jc, mt-bmi, mt-wc)        parser; manual entry or height/
                                    weight calculation required

0–100 scoring vs 1–10 zones        Zone-based 1–10 planned for        PENDING
                                    dashboard v3 (next phase)

SCRIPT_DIR used before definition   SCRIPT_DIR must be defined BEFORE  FIXED
in csv_exporter_v2.py               sys.path.insert() and before any   2026-05-25
(NameError on import)               project imports. Order must be:
                                    SCRIPT_DIR → sys.path.insert →
                                    from parser_v3 import

CSV append mode caused stale rows   Changed export_dashboard_csv()     FIXED
across re-runs of same patient      from "a" (append) to "w" (write)  2026-05-25
                                    — always overwrites, one row per run

bv_zone = "berat" for value 61.274  Root cause: "Kekentalan Darah"    FIXED
which sits in normal range 48–65    appears in two PDF sections with   2026-05-25
                                    different scales (48–73 and 4–7).
                                    _flush_ref_buffer used dict.update()
                                    (last-wins) so wrong zones from
                                    second section overwrote correct ones.
                                    Fix: most-complete-wins merge —
                                    keep whichever extraction has more
                                    zone keys. Tied counts keep first.

mt-tg_zone = "unknown" after        Caused by first-occurrence-wins    FIXED
first-occurrence-wins fix           fix above — mt-tg source param's   2026-05-25
                                    first occurrence had 0 zones;
                                    correct zones were in later section.
                                    most-complete-wins resolves both
                                    bugs simultaneously.

sk-sc zone expectation wrong        sk-sc = 2.69 is correctly "sedang" CONFIRMED
in skill docs (expected "berat")    per PDF Referensi Standar.        2026-05-25
                                    berat zone only applies below 1.453.
                                    2.69 falls in sedang (1.453–2.879).
                                    Tester + Reviewer skill docs updated.
```

---

## 12. PIPELINE DECISIONS — 2026-05-25

```
DECISION-001: Three-role QA workflow validated on Ridwan baseline
  Operator → Tester → Reviewer ran successfully.
  Reviewer correctly REJECTed run due to bv zone bug.
  After fix: full APPROVE cycle completed.
  Fixture: 01_Data\json\fixtures\ridwan_2025-11-10.json is authoritative baseline.

DECISION-002: _flush_ref_buffer merge strategy = most-complete-wins
  Rationale: some parameters appear in multiple PDF sections.
  - Duplicate with same scale → first wins (correct for bv)
  - Duplicate where first has incomplete zones → later wins (correct for mt-tg)
  Rule: replace only when new extraction has STRICTLY MORE zone keys.

DECISION-003: CSV write mode = overwrite (not append)
  One run = one patient = one row.
  Re-running the same patient should produce a clean single-row file.
  Append mode is not needed — no multi-patient batch use case in this pipeline.

DECISION-004: sk-sc "sedang" is correct, not "berat"
  The PDF's own Referensi Standar for Tingkat Kolagen Kulit defines:
    berat:  < 1.453
    sedang: 1.453–2.879
    ringan: 2.879–4.471
    normal: 4.471–6.079
  Ridwan 2.69 → sedang is correct. Tester and Reviewer skill docs updated.

DECISION-005: PYTHONIOENCODING=utf-8 required on Windows
  Greek α character in unmapped param list (α-Asam linolenat) causes
  UnicodeEncodeError in Windows console. Does not affect file output.
  Fix: set as system environment variable (permanent).

DECISION-006: Zone spot-check reference values (confirmed from approved fixture)
  bv    → normal  (61.274 inside 48.264–65.371)
  cp    → normal  (67.24  inside 56.749–67.522)
  art   → ringan  (0.96   above normal 0.327–0.937)
  sk-sc → sedang  (2.69   inside 1.453–2.879)
  ph    → normal  (inside 3.156–3.694)
```

---

## 12b. DASHBOARD DECISIONS — 2026-05-26

```
DECISION-007: Token limit strategy for large HTML files
  Never rewrite entire HTML. Always use str_replace on one function at a time.
  Extract reference JS to 91_Documentations\ before modifying.
  If task will exceed 200 lines output, split and continue.

DECISION-008: Module calculator approach = zone burden (not raw thresholds)
  All 7 calculators replaced with zone-based versions.
  Risk modules (cOx, cTx, cMt, cCr, cBioAge): use burden score (10 - zone_score)
    normal(9)→1  ringan(6)→4  sedang(3)→7  berat(1)→9  unknown→5
  Resilience modules (cNt, cSk): use zone score directly
    normal=9 (best)  berat=1 (worst)  unknown=5 (neutral)
  Return shapes preserved exactly — calcAll() and buildAction() unchanged.

DECISION-009: moduleZoneColor() = worst-zone-drives-module-colour
  One berat field in a module → module card turns red (cbad)
  One sedang field → orange (cwarn)
  All ringan/normal/unknown → green (cok)
  Replaces clrc() for the 4 risk module score cards.
  clrc() retained for backward compatibility.

DECISION-010: zbs() for parameter chips = zone-to-bmr-status
  Replaces hardcoded numeric thresholds in 11 bmr() calls.
  type 'res' (resilience): sedang/berat → 'deficient'
  type 'brdn' (burden):    sedang/berat → 'abnormal'
  ringan → 'borderline'  |  normal → 'normal'  |  unknown → 'borderline'
  Key correction: Selenium was "Deficient" in v2 (threshold >=5).
  Now "Normal" — PDF zone confirms value is in normal range.

DECISION-011: Bilingual zone badges — Option B structure
  ZONE_BADGES[zone][lang] — both languages per zone key (not per language)
  currentLang = 'id' default. setLang('en'|'id') ready for UI toggle.
  Language toggle button NOT built yet — deferred to next session.

DECISION-012: importer.js IIFE pattern
  QRMAImporter.importFromPayload() — not a global function.
  Call as QRMAImporter.importFromPayload(payload, []) from confirmImport().
  importer.js must be in 03_Scripts\ and loaded via <script> tag in HTML.
```



---

## 13. NEXT IMMEDIATE ACTIONS

```
PRIORITY   ACTION                                                       STATUS
1          Dashboard QA skill files                                     PENDING
           .claude\skills\operator\QRMA_SKILL_dashboard_operator.md
           .claude\skills\tester\QRMA_SKILL_dashboard_tester.md
           .claude\skills\reviewer\QRMA_SKILL_dashboard_reviewer.md
           Validate zone scoring, colour logic, import flow, no console errors

2          Language toggle UI                                            PENDING
           setLang() in zone-scoring.js is ready
           Need: toggle button in HTML header → calls setLang() + re-renders badges

3          buildAction() zone gates                                      PENDING
           Replace numeric threshold flags with zone label checks
           e.g. if(zd['tx-pb_zone']==='berat') instead of if(tx.pb>1.2)

4          Sebum bidirectional alert in buildAction()                    PENDING
           sk-sb ≤3 = dry skin pattern alert
           sk-sb ≥8 = oily skin pattern alert

5          Update CLAUDE.md with dashboard v3 architecture              PENDING
```

---

*End of handover document.*
*Session 1 date: 2026-05-24  — Pipeline foundation (parser v3, mappings, zone system)*
*Session 2 date: 2026-05-25  — Three-role QA workflow, pipeline validation, bug fixes*
*Session 3 date: 2026-05-26  — Dashboard v3 (zone scoring, JSON import, chip display)*
*Prepared for: Claude Code + Engineering Plugin handoff*



---

*End of handover document.*
*Session 1 date: 2026-05-24*
*Session 2 date: 2026-05-25*
*Prepared for: Claude Code + Engineering Plugin handoff*

