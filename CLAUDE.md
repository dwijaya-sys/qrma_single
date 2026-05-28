# QRMA Health Screening Dashboard — Project Context for Claude Code

## Project Identity

**Active file:** `qrma-dashboard-v3.html`  
**Root:** `F:\TeleTCM_Project\qrma_single\`  
**Format:** Single HTML file + two companion scripts loaded via `<script>` tags  
**Brand:** Swasthya Usadha | Program: Usaka Wellness  
**Purpose:** QRMA PDF values → structured health screening dashboard. Screening only — not diagnostic.

---

## Active File Inventory

```
FILE                          VER      ROLE
qrma-dashboard-v3.html        v3       ACTIVE dashboard
03_Scripts\zone-scoring.js    v1.0     Zone-to-score module (loaded by HTML)
03_Scripts\importer.js        v1.5.1   JSON importer adapter (IIFE: QRMAImporter)
03_Scripts\csv_exporter_v2.py v2       PDF → CSV (imports from parser_v3)
03_Scripts\parser_v3.py       v3       PDF → raw values + zones + SQLite
03_Scripts\mappings.json      current  Indonesian PDF name → dashboard field ID
database.py                   stable   SQLAlchemy models — shared, do not rename
```

**Do not deploy:** `qrma-dashboard-v2.html` (superseded)

---

## Non-Negotiable Product Rules

1. **Never produce diagnostic output.** No "you have X", no % probability of a medical event.
2. **Every abnormal flag answers three questions:** What? What could it suggest? What test confirms it?
3. **Food-first** before any supplement or clinical recommendation.
4. **Confidence labels** visible on every module and dashboard summary: `Well-supported` / `Exploratory` / `Needs lab confirmation`.
5. **Approved alert language only.** See Alert Language section.
6. **Default values load immediately** — no blank-state on first open.
7. **Single HTML file.** No npm, no bundlers, no frameworks.

---

## Tech Stack

| Layer | Choice |
|---|---|
| Styling | Embedded CSS, CSS custom properties |
| Logic | Vanilla JS, no framework |
| Zone scoring | `zone-scoring.js` — must load before inline `<script>` |
| JSON import | `importer.js` — IIFE, access as `QRMAImporter.importFromPayload()` |
| Charts | Chart.js 4.4.0 |
| Icons | Lucide (unpkg CDN) |
| Fonts | Cabinet Grotesk (headings), Satoshi (body) — Fontshare |
| Theme | `data-theme="dark"` on `<html>` |

**Script load order in `<head>` (must be preserved):**
```html
<script src="03_Scripts/zone-scoring.js"></script>
<script src="03_Scripts/importer.js"></script>
```

---

## Zone System

```
ZONE      SCORE   CSS CLASS     COLOUR TOKEN   PDF LABEL
normal  → 9       zone-normal   --ok           Normal(-)
ringan  → 6       zone-ringan   --blue         Abnormal Ringan(+)
sedang  → 3       zone-sedang   --gold         Abnormal Sedang(++)
berat   → 1       zone-berat    --err          Abnormal Berat(+++)
unknown → 0       zone-unknown  --txtM         —
```

**Module card colour** (worst zone wins):
```
any berat  → cbad  (red)
any sedang → cwarn (orange)
else       → cok   (green)
```

**`zone-scoring.js` public API:**
```javascript
scoreFromZone(zone)  → number
getBadge(zone)       → string (currentLang: 'id' default)
getColor(zone)       → CSS class string
setLang('en'|'id')   → void
```

**`window.zoneData`** — populated from JSON payload before `importFromPayload()` is called.  
All scoring functions read zone labels from `window.zoneData[fieldId + '_zone']`.

---

## Scoring Architecture

All 7 scoring functions are zone-driven (replaced in v3). No raw numeric thresholds.

```
cBioAge()   zone burden → weighted 3-pillar bio age offset
cOx()       ax (antioxidant reserve) + px (pro-oxidant load)
cTx()       hm (heavy metals) + lb (lifestyle burden)
cMt()       gc (glycemic) + lp (lipid) + bmi/wc
cCr()       cai (cardiac) + ri (renal)
cNt()       resilience — avg zone score × 10 nutrients
cSk()       resilience — cl (collagen) + bf (barrier) + sn
calcAll()   master orchestrator
```

**Risk modules** (higher = more concern): Oxidative, Toxic, Metabolic, Cardio-Renal  
**Resilience modules** (higher = better): Nutrient, Skin

**Display bands:** Low Concern (8–10) · Monitor (4–7) · Needs Lab Confirmation (1–3)

**Confirmed correct — do not re-open:**
```
sk-sc = 2.69 → "sedang"  (berat threshold is < 1.453)
ox-sel       → "normal"  (v2 threshold was wrong; v3 zone-based is correct)
tx-pb        → "sedang"  for Ridwan (not berat)
```

---

## The 8 Modules

```
#   ID          SCORE TYPE    CONFIDENCE              KEY FIELD IDs
1   basic       Bio age est.  Well-supported          bv,cp,art,ins,bs,fr,hyp,ph,pb,hg,ce,cs,cj,coq,gsh,vc,ve,ost
2   oxidative   Risk↑worse    Exploratory             ox-gsh,ox-coq,ox-vc,ox-ve,ox-sel,ox-fr,ox-hyp,ox-ph
3   toxic       Risk↑worse    Needs lab confirm       tx-pb,tx-hg,tx-cd,tx-as,tx-st,tx-tb,tx-ps
4   metabolic   Risk↑worse    Well-supported          mt-tg,mt-ug,mt-ins,mt-fm,mt-bmi,mt-wc
5   cardio      Risk↑worse    Needs lab confirm       cr-ch,cr-vf,cr-lv,cr-ua,cr-pt,cr-k,cr-mg
6   nutrient    Resilience↑   Exploratory             nt-zn,nt-mg,nt-k,nt-io,nt-si,nt-b6,nt-vc,nt-d3,nt-ve,nt-fo
7   skin        Resilience↑   Exploratory             sk-sc,sk-el,sk-tw,sk-sb,sk-ml,sk-sn,sk-ec,sk-jc
8   action      Aggregated    Inherits from modules   output layer only
```

**Permanent gaps** (not fixable from parser — not failures):
```
cj, sk-jc   Kolagen Sendi not a table row in PDF
mt-bmi      Kegemukan is a section heading in PDF
mt-wc       Lingkar Pinggang not a table row in PDF
```

---

## Alert Language

**Approved:** "Pattern suggests…" · "Screening flag…" · "Consider confirming with…" · "Monitor trend…" · "Below / Higher-than reference range pattern…" · "Low concern"

**Forbidden:** "You have…" · "This means disease…" · "X% risk of…" · "Poisoning" · "Detox" · "Confirmed body burden" · "Toxic syndrome" · "Heart attack chance" · "Kidney failure risk"

---

## Design Tokens (preserve all names)

```
Colors:    --pri --priH --priHi  |  --ok --okHi  |  --warn --warnHi  |  --err --errHi
           --gold --goldHi  |  --blue --blueHi  |  --purp --purpHi
Surface:   --bg --surf --surf2 --sOff --sOff2 --div --brd
Text:      --txt --txtM --txtF
Radius:    --rsm --rmd --rlg --rxl --rfull
Spacing:   --sp1 → --sp16
Type:      --text-xs/sm/base/lg/xl  |  --fD (Cabinet Grotesk)  --fB (Satoshi)
Shadow:    --shsm --shmd --shlg  |  Transition: --tr
```

---

## Pending Changes (implement in this order)

```
1  Language toggle UI button
   setLang() is ready in zone-scoring.js — add button to HTML header
   calls setLang('en'|'id') + re-renders zone badges

2  buildAction() zone gates
   Currently uses raw numeric thresholds — replace with zone label checks
   if (zd['tx-pb_zone'] === 'berat') not if (tx.pb > 1.2)

3  Sebum bidirectional alert in buildAction()
   sk-sb ≤ 3 → dry skin pattern alert
   sk-sb ≥ 8 → oily skin pattern alert
```

---

## Validated Baseline

```
PATIENT     GENDER  FIELDS  ZONES   BIO AGE  CONSOLE
Ridwan      Male    62/64   62/62   42y +2y  Clean
Kamiyanti   Female  60/64   60/60   43y +2y  Clean
```

Fixture: `01_Data\json\fixtures\ridwan_2025-11-10.json`

---

## QA

Run the three dashboard skill files before any release:
```
.claude\skills\operator\QRMA_SKILL_dashboard_operator.md
.claude\skills\tester\QRMA_SKILL_dashboard_tester.md
.claude\skills\reviewer\QRMA_SKILL_dashboard_reviewer.md
```

---

## Working Rules for Claude Code

- Use `str_replace` for targeted edits. Never rewrite the full HTML.
- Versioning: next versions are `qrma-dashboard-v4.html`, `csv_exporter_v3.py`, `parser_v4.py`.
- `database.py` has no version suffix — shared with another dev, do not rename.
- Full architecture history: `HANDOVER.md`
