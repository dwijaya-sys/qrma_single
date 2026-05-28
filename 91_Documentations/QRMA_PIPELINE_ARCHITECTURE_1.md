# QRMA Pipeline Architecture
# Full map: PDF → Dashboard
# Project: F:\TeleTCM_Project\qrma_single\
# Brand: Swasthya Usadha | Program: Usaka Wellness
# Last updated: 2026-05-27
# Format: machine-readable Markdown for AI agent consumption

---

## 1. OVERVIEW

```
QRMA PDF (95 pages, Bahasa Indonesia)
        │
        ▼
   parser_v3.py          ← extracts raw values + ref standards + zones
        │
        ▼
 csv_exporter_v2.py      ← maps Indonesian param names → dashboard IDs
        │
        ▼
  json_exporter.py       ← converts CSV to structured JSON payload
        │
        ▼
  [JSON file on disk]    ← 01_Data\json\{patient}_{date}.json
        │
        ▼  (user uploads in browser)
   importer.js           ← writes DOM fields + sets data-zone attributes
        │
        ▼
  window.zoneData        ← in-memory zone label store (populated before calcAll)
        │
        ▼
   calcAll()             ← runs all 7 module calculators
        │
        ▼
  qrma-dashboard-v3.html ← renders results, colour-coded by zone
```

---

## 2. STEP 1 — PDF PARSING (parser_v3.py)

### 2.1 Input
```
File:    QRMA PDF (95 pages, Bahasa Indonesia)
Format:  Multi-section report with tables + text blocks
Tested:  QRMA_Ridwan_November_21.pdf (male, 40)
         kamiyanti QRMA November.pdf (female, 41)
```

### 2.2 What Is Extracted

**Demographics (page 1 header):**
```
Nama:          → patient.name     (lowercased)
Jenis Kelamin: → patient.gender   (pria→male, wanita→female via _normalize_gender)
Umur:          → patient.age      (integer)
Figur:         → patient.figure   (height/weight string, e.g. "170cm, 71kg")
Tanggal Ujian: → patient.test_date (DD/MM/YYYY HH:MM)
```

**Parameter values (all pages — Hasil Pengujian Aktual tables):**
```
Table header identifier: "Barang pengujian"
Columns extracted:       parameter_name, normal_range, actual_value
Total extracted:         253 parameters (male) | 262 parameters (female)
Stored as:               parsed_data["items"] = [{category, parameter_name, normal_range, actual_value}]
```

**Zone boundaries (all pages — Referensi Standar text blocks):**
```
Section marker:  "Referensi Standar:"
Stop marker:     "Parameter Deskripsi"
Format:          param_name: lo-hi(-) lo-hi(+) lo-hi(++) >val(+++)
Total extracted: 214 entries (male) | 222 entries (female)
Stored as:       parsed_data["ref_standards"] = {param_name: {normal, ringan, sedang, berat, direction}}
```

### 2.3 Zone Boundary Extraction Rules

**Standard 4-zone format (majority of sections):**
```
(-) = normal   (+) = ringan   (++) = sedang   (+++) = berat
Direction auto-detected: compare midpoint(ringan) vs midpoint(normal)
  ringan_mid > normal_mid → higher-worse
  ringan_mid < normal_mid → lower-worse
```

**_flush_ref_buffer merge strategy: most-complete-wins**
```
Same parameter appears in multiple sections → keep whichever has more zone keys
Rationale: prevents wrong-scale overwrite (e.g. Kekentalan Darah / bv)
```

**Non-standard sections (fallback to mappings.json zone_boundaries):**
```
(Gula Dalam Darah)     → "Kisaran Yang Sehat" format — no 4-zone breakdown
(Kualitas Fisik Dasar) → 3-zone custom format for PH
(Elemen Manusia)       → NO Referensi Standar — all zones remain unknown
```

**Direction-aware safe-floor extension:**
```
higher-worse: value < normal_min → return "normal" (below floor = safer)
lower-worse:  value > normal_max → return "normal" (above ceiling = safer)
```

### 2.4 Known Permanent Gaps (not fixable from parser)
```
cj      — Kolagen Sendi not present as a PDF table row
sk-jc   — same source as cj
mt-bmi  — Kegemukan is a section heading, not a data row
mt-wc   — Lingkar Pinggang not present as a PDF table row
```
These 4 fields are always empty in the CSV/JSON. Known and expected.

### 2.5 Sections Skipped
```
(Elemen Manusia) — no Referensi Standar; zone extraction skipped
                   raw values still extracted from its tables
```

---

## 3. STEP 2 — CSV EXPORT (csv_exporter_v2.py)

### 3.1 What It Does
```
1. Calls parse_qrma_pdf() → gets demographics + items + ref_standards
2. Calls ingest_to_db()   → writes raw parameters to SQLite (parallel, optional)
3. Calls load_mappings()  → loads mappings.json (99 entries)
4. Calls apply_mappings() → translates PDF param names → dashboard field IDs + zones
5. Calls export_dashboard_csv() → writes CSV file
```

### 3.2 mappings.json Role
```
Purpose:    Translates Indonesian PDF parameter names → dashboard HTML input IDs
Entries:    99
Key fields: id (Indonesian name), dashboard_id, also_maps_to, direction, zone_boundaries

Multi-target: some parameters feed multiple dashboard fields
  "Vitamin C"    → nt-vc + [ox-vc, vc]
  "Glutathione"  → ox-gsh + [gsh]
  "Insulin"      → ins + [mt-ins]
  "Magnesium"    → cr-mg + [nt-mg]
  "Potassium"    → cr-k + [nt-k]
  etc.

zone_boundaries: fallback zones for non-standard PDF sections
  Stored as {normal:[lo,hi], ringan:[lo,hi], sedang:[lo,hi], berat:[lo,null]}
  null = float('inf')
```

### 3.3 Zone Derivation — Two-Tier Priority
```
TIER 1: ref_standards (live extraction from PDF)
  param_zones = ref_standards.get(param_name)
  has_zone_data = param_zones and any zone key (normal/ringan/sedang/berat) present
  If has_zone_data: zone = derive_zone(raw_value, param_zones)
  If derive_zone returns "unknown" and mappings.json has zone_boundaries: try fallback

TIER 2: mappings.json zone_boundaries (fallback)
  Used when: param not in ref_standards, OR ref extracted only partial zones
  Handles: Koefisien Gula Darah (bidirectional), PH (bidirectional),
           Koefisien Sekresi Insulin (bidirectional),
           Koefisien Gula Dalam Urin (higher-worse),
           Kadar Asam Urat (4-zone confirmed), Tingkat Kelembaban Kulit (4-zone)
```

### 3.4 CSV Output Format
```
Location:    01_Data\csv\{patient_name}_{YYYY-MM-DD}.csv
Write mode:  OVERWRITE (not append) — one row per run, no accumulation
Encoding:    utf-8

COLUMN GROUPS (125 total):
  Demographics (4):   name, age, gender, test_date
  Raw values  (60):   bv, cp, art, ins, bs, fr, hyp, ph, pb, hg, ce, cs, cj,
                      coq, gsh, vc, ve, ost, ox-gsh, ox-coq, ox-vc, ox-ve,
                      ox-sel, ox-fr, ox-hyp, ox-ph, tx-pb, tx-hg, tx-cd, tx-as,
                      tx-st, tx-tb, tx-ps, mt-tg, mt-ug, mt-ins, mt-fm, mt-bmi,
                      mt-wc, cr-ch, cr-vf, cr-lv, cr-ua, cr-pt, cr-k, cr-mg,
                      nt-zn, nt-mg, nt-k, nt-io, nt-si, nt-b6, nt-vc, nt-d3,
                      nt-ve, nt-fo, sk-sc, sk-el, sk-tw, sk-sb, sk-ml, sk-sn,
                      sk-ec, sk-jc
  Zone labels (60):   {field_id}_zone for each raw field above
                      values: normal | ringan | sedang | berat | unknown
  Meta (1):           warnings (";;" separated list of structural issues)

EXPECTED COUNTS (Ridwan baseline):
  Fields populated:  60 / 64  (4 permanent gaps always empty)
  Zones resolved:    60 / 60  (all populated fields have zones)
  Warnings:          2        (unmapped 161 params + 4 permanent gaps)
```

### 3.5 Run Command
```bash
# From project root:
python 03_Scripts\csv_exporter_v2.py --pdf "QRMA_Ridwan_November_21.pdf"

# Options:
--pdf       PATH   Input PDF (auto-detects if single PDF in folder)
--mappings  PATH   Default: 03_Scripts\mappings.json
--out       PATH   Default: 01_Data\csv\{patient}_{date}.csv
```

---

## 4. STEP 3 — JSON EXPORT (json_exporter.py)

### 4.1 What It Does
```
Reads the CSV produced by csv_exporter_v2.py
Splits columns into patient block, values block, meta block
Writes a JSON payload file ready for importer.js
```

### 4.2 JSON Payload Structure
```json
{
  "patient": {
    "name":     "ridwan",
    "age":      40,
    "gender":   "male",
    "testdate": "10/11/2025 17:01"
  },
  "values": {
    "bv":         61.274,
    "bv_zone":    "normal",
    "cp":         67.24,
    "cp_zone":    "normal",
    "art":        0.96,
    "art_zone":   "ringan",
    ...
    (60 raw float values + 60 zone string values = 120 keys)
  },
  "meta": {
    "source":       "qrma-parser-v3",
    "version":      "3.0",
    "generated_at": "2026-05-25T...",
    "csv_source":   "ridwan_2025-11-10.csv",
    "run_id":       "run_ridwan_20260525_1700",
    "row_count":    1
  },
  "warnings": [
    "PDF PARAMETERS WITH NO MAPPING (161): ...",
    "DASHBOARD FIELDS NOT POPULATED (4): cj | mt-bmi | mt-wc | sk-jc"
  ]
}
```

### 4.3 Rules
```
Zero values are EXCLUDED from the values block (treated as unpopulated)
Unknown zone values are EXCLUDED from the values block
JSON is valid per RFC 8259 (no NaN, no Infinity)
```

### 4.4 Output Location
```
01_Data\json\{patient_name}_{YYYY-MM-DD}.json

Approved fixtures (after three-role QA APPROVE):
01_Data\json\fixtures\ridwan_2025-11-10.json     ← male baseline
01_Data\json\fixtures\kamiyanti_2025-11-11.json  ← female baseline
```

### 4.5 Run Command
```bash
python 03_Scripts\json_exporter.py --csv "01_Data\csv\ridwan_2025-11-10.csv"

# Options:
--csv      PATH   Input CSV (required)
--out      PATH   Default: 01_Data\json\{patient}_{date}.json
--run-id   ID     Optional run identifier for meta block
```

---

## 5. STEP 4 — THREE-ROLE QA (Claude Code)

Every patient run is validated by three roles before the JSON is promoted to fixtures.

### 5.1 current_run.yaml
```
Location: 03_Scripts\current_run.yaml
Purpose:  Single source of truth — all roles read this first

Key fields:
  run_id, patient_name, pdf_file
  output_csv, output_json
  operator_report, tester_report, reviewer_report
  logs_dir
  baseline_fixture          ← path to approved reference fixture
  expected_fields_populated: 60
  expected_zone_coverage:    60
  max_allowed_warnings:       2
  permanent_gaps: [cj, sk-jc, mt-bmi, mt-wc]
```

### 5.2 Operator (.claude\skills\operator\QRMA_SKILL_operator.md)
```
Runs: csv_exporter_v2.py → json_exporter.py
Verifies: CSV field count, zone coverage, JSON validity, meta.run_id match
Writes: 90_Pipeline_Reports\operator\{run_id}_operator.md
Updates: CHANGELOG.md (append only)
```

### 5.3 Tester (.claude\skills\tester\QRMA_SKILL_tester.md)
```
Read-only. Validates CSV + JSON structure and zone integrity.
Zone spot-checks (Ridwan only):
  bv (~61.274) → normal   |  cp (~67.24) → normal
  art (~0.96)  → ringan   |  sk-sc (~2.69) → sedang
  ph           → normal
Baseline comparison: if fixture exists, compare zone distribution
Writes: 90_Pipeline_Reports\tester\{run_id}_tester.md
PASS/FAIL + BLOCKER/WARNING/OBSERVATION
```

### 5.4 Reviewer (.claude\skills\reviewer\QRMA_SKILL_reviewer.md)
```
Read-only. Clinical safety + provenance + schema integrity.
Checks: no forbidden clinical language, meta provenance, zone directions
Baseline comparison: demographics + stable zones (bv, cp, cr-vf, cr-lv)
Writes: 90_Pipeline_Reports\reviewer\{run_id}_reviewer.md
APPROVE/REJECT
Updates: CHANGELOG.md (append only)
```

### 5.5 After Reviewer APPROVE
```
Promote JSON to fixtures:
  copy 01_Data\json\{patient}.json 01_Data\json\fixtures\{patient}.json

Update current_run.yaml:
  baseline_fixture: "01_Data\\json\\fixtures\\{patient}.json"
```

---

## 6. STEP 5 — DASHBOARD IMPORT (browser)

### 6.1 Script Loading Order (HTML head)
```html
<script src="03_Scripts/zone-scoring.js"></script>   ← ZONE_SCORES, getBadge, getColor, setLang
<script src="03_Scripts/importer.js"></script>        ← QRMAImporter.importFromPayload()
[inline script]                                       ← all dashboard logic
```

### 6.2 File Detection and Import Flow
```
User clicks Import button
  → FileReader reads file
  → filename.endsWith('.json') ?

IF JSON:
  JSON.parse(content) → _jsonPayload
  _importMode = 'json'
  _jsonToRow(_jsonPayload) → flat row for modal preview
  _showImportModal(row) → patient name, age, gender, field count

  User clicks Load Report:
    window.zoneData = {}
    Object.entries(_jsonPayload.values).forEach:
      if key.endsWith('_zone') && value !== 'unknown':
        window.zoneData[key] = value
    QRMAImporter.importFromPayload(_jsonPayload, [])
      → applyPatient() → writes age, gender to DOM inputs, updates client card
      → writes all raw field values to DOM inputs
      → sets data-zone attributes on each input element
      → calls calcAll()
    closeImportModal()

IF CSV:
  _parseCSV(content) → flat row object
  _importMode = 'csv'
  _showImportModal(row) → same modal
  User clicks Load Report:
    confirmImport() CSV path → manual field writes → window.zoneData populated
    calcAll()
```

### 6.3 window.zoneData
```
Purpose: In-memory zone label store used by all 7 module calculators
Format:  { "bv_zone": "normal", "cp_zone": "normal", "art_zone": "ringan", ... }
Scope:   Window-level, reset on each import
Populated before calcAll() is called — critical ordering requirement
```

---

## 7. STEP 6 — MODULE CALCULATORS (calcAll)

### 7.1 Execution Order
```javascript
calcAll()
  → ba = cBioAge()    // Biological Age
  → ox = cOx()        // Oxidative Stress
  → tx = cTx()        // Toxic Burden
  → mt = cMt()        // Metabolic Risk
  → cr = cCr()        // Cardio-Renal
  → nt = cNt()        // Nutrient Sufficiency
  → sk = cSk()        // Skin & Collagen
  → drawCharts(GS)
  → buildAction({ba,ox,tx,mt,cr,nt,sk,al})
  → lucide.createIcons()
  → nav('dashboard')
```

### 7.2 Zone Scoring System (zone-scoring.js)
```javascript
ZONE_SCORES = { normal:9, ringan:6, sedang:3, berat:1, unknown:0 }

ZONE_BADGES = {
  normal:  { en:'Normal',       id:'Normal'          },
  ringan:  { en:'Mild Concern', id:'Perlu Perhatian' },
  sedang:  { en:'Action Needed',id:'Perlu Tindakan'  },
  berat:   { en:'Top Priority', id:'Prioritas Utama' },
  unknown: { en:'—',            id:'—'               }
}

ZONE_COLORS = {
  normal:'zone-normal', ringan:'zone-ringan',
  sedang:'zone-sedang', berat:'zone-berat', unknown:'zone-unknown'
}

// CSS colour mapping (uses existing design tokens):
// zone-normal  → --okHi bg   + --ok text   (green)
// zone-ringan  → --blueHi bg + --blue text (blue)
// zone-sedang  → --goldHi bg + --gold text (amber)
// zone-berat   → --errHi bg  + --err text  (red)
// zone-unknown → --surf2 bg  + --txtM text (muted)
```

### 7.3 Burden Score Pattern (risk modules)
```javascript
// Inverts zone score so that worse zones produce higher burden
// normal(9)→1  ringan(6)→4  sedang(3)→7  berat(1)→9  unknown→5(neutral)
function burden(fieldId) {
  const zone = window.zoneData[fieldId + '_zone'];
  if (!zone) return 5;
  const s = scoreFromZone(zone);
  return s === 0 ? 5 : 10 - s;
}

function avgBurden(fields) {
  return fields.map(burden).reduce((a,b) => a+b, 0) / fields.length;
}
```

### 7.4 Module Calculator Summary
```
MODULE    FUNCTION    TYPE         SCORE MEANING          KEY INPUTS
M1        cBioAge()   Risk+AgeEst  bio age offset years   bv,cp,art,ins,bs (P1)
                                                           fr,hyp,ph,pb,hg  (P2)
                                                           ce,cs,cj,coq,gsh,vc,ve,ost (P3)
          Formula:    offset = (p1*0.35 + p2*0.35 + p3*0.30) * 1.2
          Return:     {ba, age, p1, p2, p3}

M2        cOx()       Risk         higher=more stress     ox-gsh,ox-coq,ox-vc,ox-ve,ox-sel (ax)
                                                           ox-fr,ox-hyp,ox-ph (px)
          Formula:    ax=avg_zone_score*100/9, px=avg_burden*100/9
                      s = (100-ax)*0.55 + px*0.45
          Return:     {s, ax, px, gsh,coq,vc,ve,sel,fr,hyp,ph}

M3        cTx()       Risk         higher=more burden     tx-pb,tx-hg,tx-cd,tx-as (hm)
                                                           tx-st,tx-tb,tx-ps (lb)
          Formula:    hm=avg_burden*100/9, lb=avg_burden*100/9
                      s = hm*0.6 + lb*0.4
          Return:     {s, hm, lb, pb,hg,cd,as_,st,tb,ps}

M4        cMt()       Risk         higher=more risk       mt-ug,mt-ins (gc), mt-tg,mt-fm (lp)
                                                           mt-bmi,mt-wc (permanent gaps→0)
          Formula:    gc=avg_burden*100/9, lp=avg_burden*100/9
                      s = gc*0.40 + lp*0.35 + bmiP + wcP
          Asian IDF:  male ≥90cm, female ≥80cm
          Return:     {s, gc, lp, tg,ug,ins,fm,bmi,wc}

M5        cCr()       Risk         higher=more strain     cr-ch,cr-vf,cr-lv (cai)
                                                           cr-pt,cr-ua,cr-mg (ri)
          Formula:    cai=avg_burden*100/9, ri=avg_burden*100/9
                      s = cai*0.55 + ri*0.45
          Return:     {s, cai, ri, ch,vf,lv,ua,pt,k,mg}

M6        cNt()       Resilience   higher=better reserve  nt-zn,nt-mg,nt-k,nt-io,nt-si,
                                                           nt-b6,nt-vc,nt-d3,nt-ve,nt-fo
          Formula:    score=scoreFromZone(zone) (direct, unknown→5)
                      s = avg(scores) * 100/9
          Return:     {s, def, opt, items[{n,v,zone,score}]}

M7        cSk()       Resilience   higher=better          sk-sc,sk-ec,sk-jc (cl)
                                                           sk-el,sk-tw (bf)
                                                           sk-sn (sensitivity)
          Formula:    cl=avg_zs(collagen)*100/9
                      bf=avg_zs(barrier)*100/9
                      sn=zs('sk-sn')*100/9
                      s = cl*0.5 + bf*0.3 + sn*0.2
          Return:     {s, cl, bf, sc,el,tw,sb,ml,sn,ec,jc}

M8        buildAction() Aggregated  output layer          all modules
          UNCHANGED from v2 — uses raw field values from return objects
          Pending: replace numeric gates with zone label checks
```

### 7.5 Module Colour Logic
```javascript
// moduleZoneColor(): worst-zone drives module card colour
function moduleZoneColor(fields) {
  const zd = window.zoneData || {};
  for (const id of fields) {
    if ((zd[id+'_zone']||'') === 'berat')  return 'cbad';   // red
  }
  for (const id of fields) {
    if ((zd[id+'_zone']||'') === 'sedang') return 'cwarn';  // orange
  }
  return 'cok';  // green (all normal/ringan/unknown)
}

// Applied to risk modules only:
const oxC = moduleZoneColor(['ox-gsh','ox-coq','ox-vc','ox-ve','ox-sel','ox-fr','ox-hyp','ox-ph']);
const txC = moduleZoneColor(['tx-pb','tx-hg','tx-cd','tx-as','tx-st','tx-tb','tx-ps']);
const mtC = moduleZoneColor(['mt-ug','mt-ins','mt-tg','mt-fm']);
const crC = moduleZoneColor(['cr-ch','cr-vf','cr-lv','cr-ua','cr-pt','cr-k','cr-mg']);
// Resilience modules (nt, sk) use inline ternary on score value
```

### 7.6 Parameter Chip Labels (zbs)
```javascript
// zbs(): zone-to-bmr-status — replaces hardcoded thresholds in bmr() calls
function zbs(fieldId, type) {
  const zone = (window.zoneData||{})[fieldId+'_zone'] || 'unknown';
  if (zone === 'normal') return 'normal';
  if (zone === 'ringan') return 'borderline';
  return type === 'brdn' ? 'abnormal' : 'deficient';
}

// type 'res' (resilience): sedang/berat → 'deficient'
// type 'brdn' (burden):    sedang/berat → 'abnormal'
// unknown → 'borderline' (neutral, non-alarming)

// Applied to: Oxidative (6 chips) and Skin (5 chips)
// Nutrient chips use i.zone directly (from cNt items array)
```

---

## 8. FILE INVENTORY

### 8.1 Active Files
```
LOCATION                                  FILE                     VERSION  ROLE
03_Scripts\                               parser_v3.py             v3       PDF extraction + zone derivation
03_Scripts\                               csv_exporter_v2.py       v2       CLI: PDF → CSV
03_Scripts\                               json_exporter.py         v1       CSV → JSON payload
03_Scripts\                               mappings.json            current  ID→field routing + zone fallbacks
03_Scripts\                               database.py              stable   SQLAlchemy models (shared)
03_Scripts\                               current_run.yaml         current  QA run config
03_Scripts\                               zone-scoring.js          v1.0     Zone scores + badges + colours
03_Scripts\                               importer.js              v1.5.1   JSON→DOM importer adapter
qrma_single\                              qrma-dashboard-v3.html   v3       Active dashboard
qrma_single\                              CLAUDE.md                current  Claude Code auto-load context
91_Documentations\                        HANDOVER.md              current  Full session history + decisions
01_Data\csv\                              {patient}_{date}.csv     —        Pipeline output (overwritten per run)
01_Data\json\                             {patient}_{date}.json    —        Pipeline output
01_Data\json\fixtures\                    ridwan_2025-11-10.json   —        Approved male baseline
01_Data\json\fixtures\                    kamiyanti_2025-11-11.json —       Approved female baseline
.claude\skills\operator\                  QRMA_SKILL_operator.md   —        Pipeline Operator role
.claude\skills\tester\                    QRMA_SKILL_tester.md     —        Pipeline Tester role
.claude\skills\reviewer\                  QRMA_SKILL_reviewer.md   —        Pipeline Reviewer role
```

### 8.2 Reference Files (do not modify)
```
91_Documentations\dashboard-v2-js-reference.js      — all v2 JS before refactor
91_Documentations\calcAll-reference.js               — original calcAll() function
91_Documentations\module-calculators-reference.js    — original 7 calculators (de-minified)
91_Documentations\qrma-dashboard-v2-handover.md      — original architecture doc
91_Documentations\module-spec-evidence-reference.md  — 8-module specs + evidence citations
```

---

## 9. VALIDATED BASELINES

```
PATIENT     GENDER  AGE  PDF PARAMS  FIELDS  ZONES   BIO AGE  SKIN MODULE   STATUS
Ridwan      male    40   253         60/64   60/60   42y +2y  66% (orange)  APPROVED
Kamiyanti   female  41   262         60/64   60/60   43y +2y  63% (orange)  APPROVED

Zone distribution (Ridwan):
  normal=46  ringan=11  sedang=2  berat=1  unknown=4

Zone distribution (Kamiyanti):
  normal=39  ringan=16  sedang=5  berat=0  unknown=4

Known spot-checks (Ridwan):
  bv    61.274 → normal  (range 48.264–65.371)
  cp    67.24  → normal  (range 56.749–67.522)
  art   0.96   → ringan  (above normal 0.327–0.937)
  sk-sc 2.69   → sedang  (range 1.453–2.879, lower-worse)
  ph    3.4    → normal  (range 3.156–3.694)
  tx-pb 0.144  → normal  (higher-worse, below floor = safe)
```

---

## 10. PENDING ITEMS

```
PRIORITY  ITEM                                      NOTES
1         Dashboard QA skill files                  Write operator/tester/reviewer for HTML
          .claude\skills\*\QRMA_SKILL_dashboard_*

2         Language toggle UI                        setLang() ready in zone-scoring.js
                                                    Need toggle button → re-renders badges

3         buildAction() zone gates                  Replace numeric threshold flags:
                                                    if(zd['tx-pb_zone']==='berat') not if(tx.pb>1.2)

4         Sebum bidirectional alert                 sk-sb ≤3 = dry skin
                                                    sk-sb ≥8 = oily skin
                                                    Lives in buildAction()

5         CLAUDE.md update                          Add dashboard v3 architecture section
```

---

## 11. CLINICAL LANGUAGE RULES

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

CONFIDENCE BADGES: always visible per module
DISCLAIMER: "For Reference Only · Not a Diagnosis" — non-dismissable
FOOD-FIRST: all recommendations prioritise food before supplements
```

---

*End of pipeline architecture map.*
*Maintained by: AI session handoff*
*Deploy to: 91_Documentations\QRMA_PIPELINE_ARCHITECTURE.md*
