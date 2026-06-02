# v5 Orientation — Module 9 Build Reference
**Source files:** `qrma-dashboard-v4.html` (1835 lines) · `03_Scripts/hrv-engine.js` (673 lines)
**Purpose:** Pre-build read-only reference for Step 3. Do not edit source files until confirmed.

---

## 1. cSk() tail + calcAll() head

### Last 12 lines of cSk() (v4.html lines 953–965)

```javascript
  // Combined resilience score — weights match v2 spec (cl.5 + bf.3 + sn.2)
  // Note: sk-sb bidirectional alert (≤3=dry, ≥8=oily) handled in buildAction()
  const s = Math.min(100,Math.round(cl*.5+bf*.3+sn*.2));

  return{
    s,
    cl:Math.min(100,cl), bf:Math.min(100,bf),
    sc:g('sk-sc'), el:g('sk-el'), tw:g('sk-tw'), sb:g('sk-sb'),
    ml:g('sk-ml'), sn:g('sk-sn'), ec:g('sk-ec'), jc:g('sk-jc')
  };
}
let RC=null,BC=null;
// drawCharts follows immediately (line 967)
```

### First 19 lines of calcAll() (v4.html lines 980–998)

```javascript
function calcAll(){
  const ba=cBioAge(), ox=cOx(), tx=cTx(), mt=cMt(),
        cr=cCr(),    nt=cNt(), sk=cSk();

  const GS={ox:ox.s, tx:tx.s, mt:mt.s, cr:cr.s, nt:nt.s, sk:sk.s};

  // ... per-module DOM renders (lines 981–997, one dense line each) ...

  const alv = Math.round(
    [ox.s,tx.s,mt.s,cr.s,100-nt.s,100-sk.s].reduce((a,b)=>a+b,0)/6
  );
  const alC = alv<=30?'cok':alv<=60?'cwarn':'cbad';
  se('k-al',alv+'%',alC);
  document.getElementById('k-all').textContent =
    alv<=30?'Low Stress':alv<=60?'Moderate Burden':'High Multisystem Stress';

  drawCharts(GS);
  buildAction({ba, ox, tx, mt, cr, nt, sk, al:alv});
  if(typeof renderHrvPanel==='function') renderHrvPanel();
  lucide.createIcons();
  nav('dashboard');
}
```

**Module result storage pattern:** `const sk = cSk()` — each module function called inline in the destructuring line at the top of `calcAll()`. All 7 results captured in one statement: `const ba=cBioAge(), ox=cOx(), tx=cTx(), mt=cMt(), cr=cCr(), nt=cNt(), sk=cSk();`

**buildAction() call signature (v4.html line 998):**
```javascript
buildAction({ba, ox, tx, mt, cr, nt, sk, al:alv});
```
Single object argument, shorthand properties for each module result object. `al` is the computed allostatic load average (not a module result object).

**Allostatic load formula:** average of `[ox.s, tx.s, mt.s, cr.s, 100-nt.s, 100-sk.s]` — risk modules direct, resilience modules inverted. To include Module 9: add `dg.s` (risk direction, no inversion) and increase divisor from 6 to 7.

---

## 2. Radar chart arrays

**Location:** `drawCharts(sc)` function, v4.html line 967 (single dense line).

```javascript
// labels array (6 items)
const lb = [
  'Oxidative', 'Toxic', 'Metabolic', 'Cardio-Renal', 'Nutrients', 'Skin'
];

// data array — risk modules inverted (100-score) so inward = better
const rd = [
  100 - Math.min(sc.ox,  100),   // Oxidative  (risk → invert)
  100 - Math.min(sc.tx,  100),   // Toxic       (risk → invert)
  100 - Math.min(sc.mt,  100),   // Metabolic   (risk → invert)
  100 - Math.min(sc.cr,  100),   // Cardio-Renal (risk → invert)
  Math.min(sc.nt, 100),          // Nutrients   (resilience → direct)
  Math.min(sc.sk, 100)           // Skin        (resilience → direct)
];
```

**Bar chart** (same `lb` labels, same 6 entries):
```javascript
// bar chart shows raw risk level (not inverted): resilience modules show 100-score
data: [sc.ox, sc.tx, sc.mt, sc.cr, 100-sc.nt, 100-sc.sk]
```

**Module 9 addition:** append `'Gut'` to `lb`; append `100 - Math.min(sc.dg, 100)` to `rd` (risk module → invert for radar); append `sc.dg` to bar chart data array.

**Chart config summary:** `type:'radar'`, labels from `lb`, single dataset `rd`, `min:0 max:100`, no legend. Both `RC` and `BC` are module-level variables destroyed/recreated on each `drawCharts()` call.

---

## 3. Nav sidebar — one module link (complete HTML)

```html
<button class="sni" onclick="nav('skin')" data-nav="skin">
  <i data-lucide="sparkles" width="16" height="16"></i>
  Skin &amp; Collagen
</button>
```

**Element anatomy:**
- Element type: `<button>`
- Class: `sni` (sidebar nav item)
- `onclick`: calls `nav('<page-id>')` with the section identifier (matches `pg-<id>` section `id` minus the `pg-` prefix)
- `data-nav`: mirrors the nav argument (used for active-state highlight)
- Icon: Lucide icon via `<i data-lucide="<icon-name>" width="16" height="16">` child
- Label text: plain text after the icon element

**Placement for Module 9:** insert after the Skin button (line 341), before the "Results" `<div class="snl">` separator.

**Active state:** `nav()` function sets `class="sni active"` on the matching `data-nav` button. No additional work needed — the pattern handles itself.

---

## 4. Module section pattern — pg-skin (first 27 lines)

```html
<!-- SKIN & COLLAGEN (v4.html lines 592–619) -->
<section class="pg" id="pg-skin">
  <div id="hrv-strip-sk"></div>
  <div><h2 class="pgt">Skin &amp; Collagen Resilience
    <small>Visible aging and tissue resilience scoring</small>
  </h2></div>
  <div class="panel">
    <div class="phd">
      <div>
        <div class="ptit">
          <i data-lucide="sparkles" width="18" height="18"></i>
          Skin &amp; Collagen Inputs
        </div>
        <div class="psub">Relates to dryness, elasticity, eye strain, perceived aging</div>
      </div>
      <span class="badge bex">Exploratory</span>
    </div>
    <div class="ig">
      <div class="igrp">
        <label class="ilb" for="sk-sc">Skin Collagen <span class="hint">(0-10)</span></label>
        <input class="ifd" type="number" id="sk-sc" value="3.668" step="0.001" min="0" max="10">
        <div class="irg">Normal: 4.0-6.0</div>
      </div>
      <!-- ... more igrp entries ... -->
    </div>
    <div class="bgrp">
      <button class="btn btnp" onclick="calcAll()">
        <i data-lucide="calculator" width="16" height="16"></i> Calculate
      </button>
    </div>
  </div>
  <!-- result panel (hidden until calcAll fires) -->
  <div class="panel" id="r-sk" style="display:none">
    ...
  </div>
</section>
```

**Confidence badge classes:**
- `bws` = Well-supported
- `bex` = Exploratory
- `bnl` = Needs lab confirmation

Multiple badges can appear side-by-side (see pg-metabolic which shows both `bws` and `bnl`).

**HRV strip div:** `<div id="hrv-strip-<module-short-id>"></div>` is always the **first child** of the section, before the heading.

**Input group structure:**
```html
<div class="igrp">
  <label class="ilb" for="<field-id>">Label text <span class="hint">(unit)</span></label>
  <input class="ifd" type="number" id="<field-id>" value="<default>" step="<step>">
  <div class="irg">Normal: <range> | Confirm: <test hint></div>
</div>
```

---

## 5. buildAction() structure

**Location:** v4.html line 968 (single dense line, formatted below for readability).

```javascript
function buildAction(d) {
  // d is the object passed from calcAll():
  //   d.ba  — result of cBioAge()  {ba, age, p1, p2, p3, ...}
  //   d.ox  — result of cOx()      {s, ax, px, gsh, coq, vc, ve, sel, fr, ...}
  //   d.tx  — result of cTx()      {s, hm, lb, pb, hg, cd, as_, st, tb, ps}
  //   d.mt  — result of cMt()      {s, gc, lp, tg, ug, ins, fm, bmi, wc, ...}
  //   d.cr  — result of cCr()      {s, cai, ri, ch, vf, lv, ua, pt, k, mg}
  //   d.nt  — result of cNt()      {s, def, opt, items[]}
  //   d.sk  — result of cSk()      {s, cl, bf, sc, el, tw, sb, ml, sn, ec, jc}
  //   d.al  — allostatic load number (0-100)

  const rows = [];

  // --- Confirmatory test rows ---
  // Each row: { p: 'High'|'Medium'|'Low', dom: 'Domain name', f: 'finding text', t: 'test text' }

  if (d.ba.ba > d.ba.age + 5)
    rows.push({ p:'High', dom:'Biological Age',
      f:'Bio age '+d.ba.ba+'y vs chrono '+d.ba.age+'y (+'+( d.ba.ba-d.ba.age)+'y)',
      t:'hsCRP, CBC, Fasting Lipids, HbA1c, TSH/FT4' });

  if (d.ox.gsh < .9 || d.ox.coq < .9)
    rows.push({ p:'Medium', dom:'Oxidative Stress',
      f:'Deficient glutathione and/or CoQ10 signal',
      t:'Plasma glutathione (ELISA), CoQ10 (HPLC), 8-OHdG urine' });

  // ... more rows (tx, mt, cr, nt, sk) ...

  // Sebum bidirectional special case (uses zoneData directly):
  const sbZone = (window.zoneData || {})['sk-sb_zone'];
  const sbRaw  = d.sk ? (d.sk.sb || 0) : 0;
  if (['sedang','berat'].includes(sbZone))
    rows.push({ p:'Low', dom:'Skin: Sebum — Oily Pattern',
      f:'Sebum gland signal higher-than-reference range pattern',
      t:'Dermatological assessment; skin barrier function test' });
  else if (sbRaw > 0 && sbRaw < 14.477)
    rows.push({ p:'Low', dom:'Skin: Sebum — Dry Pattern',
      f:'Sebum gland signal below reference range pattern',
      t:'Dermatological assessment; skin hydration test' });

  rows.sort((a,b) => ({High:0, Medium:1, Low:2}[a.p] - {High:0, Medium:1, Low:2}[b.p]));

  // --- Render confirmatory tests table ---
  if (!rows.length) {
    document.getElementById('r-acttbl').innerHTML =
      aal('ok', 'No Critical Flags', 'All screening signals within normal reference ranges...');
  } else {
    let h = '<table class="atbl"><thead>...</thead><tbody>';
    rows.forEach(r => {
      const pc = r.p==='High'?'phi': r.p==='Medium'?'pmd':'plo';
      h += '<tr><td class="'+pc+'">'+r.p+'</td><td>'+r.dom+'</td>'
         + '<td>'+r.f+'</td><td style="...">'+r.t+'</td></tr>';
    });
    h += '</tbody></table>';
    document.getElementById('r-acttbl').innerHTML = h;
  }

  // --- Food-first blocks ---
  const fp = [];
  if (d.ox.s > 40) fp.push(ftrow('Antioxidant Priority', ['Berries','Spinach',...]));
  if (d.mt.s > 30) fp.push(ftrow('Metabolic Support',    ['Oats + Legumes',...] ));
  if (d.cr.s > 30) fp.push(ftrow('Cardio-Renal',         ['Bananas + Avocado',...] ));
  if (d.nt.def > 3) fp.push(ftrow('Micronutrient Diversity', [...]));
  if (d.sk.s < 60)  fp.push(ftrow('Skin + Collagen',     [...]));
  document.getElementById('r-actfood').innerHTML = fp.length ? fp.join('') : '<p>...<p>';

  // --- High-priority active alerts ---
  const hi = rows.filter(r => r.p === 'High');
  document.getElementById('r-actal').innerHTML = hi.length
    ? hi.map(r => aal('err', r.dom+' - High Priority', r.f+'. Confirm: '+r.t)).join('')
    : aal('ok', 'No High-Priority Alerts', '...');
}
```

**Helper functions used in buildAction():**

| Helper | Signature | Returns |
|--------|-----------|---------|
| `aal(type, title, desc)` | `type`: `'err'`/`'warn'`/`'info'`/`'ok'` | Alert div HTML string |
| `ftrow(label, foods[])` | `label`: string, `foods`: string array | Food-tag row HTML string |
| `lbl(v, lo, hi)` | thresholds for band labels | `'Low Concern'`/`'Monitor'`/`'Needs Lab Confirmation'` |
| `se(id, val, cls)` | sets element text + class | void |

`aal()` uses CSS classes `aerr`/`awarn`/`ainfo`/`aok` and Lucide icons `alert-circle`/`alert-triangle`/`info`/`check-circle`.

`ftrow()` wraps each food in `<span class="ftag">🌿 food</span>` inside a `.ftags` container.

**Module 9 additions to buildAction():** Add a `dg` parameter field in the function call from `calcAll()`, add `if(d.dg && ...)` blocks for motility/absorption/pressure flags following the same `rows.push(...)` pattern, add a `ftrow('Digestive Support', [...])` block in the food section.

---

## 6. renderHrvStrip_Sk() — complete function

From `hrv-engine.js` lines 657 and 622–649:

```javascript
// Public wrapper — one line (line 657)
function renderHrvStrip_Skin() { _renderStrip('skin', 'hrv-strip-sk'); }

// Shared implementation _renderStrip (lines 622–649):
function _renderStrip(moduleId, containerId) {
  const emptyMsg = _t(
    'No HRV data available for this session.',
    'Tidak ada data HRV untuk sesi ini.'
  );

  if (!hrvState) {
    _hset(containerId, `<div class="hrv-strip hrv-strip-empty">${emptyMsg}</div>`);
    return;
  }

  const s      = hrvState;
  const L      = (typeof currentLang !== 'undefined') ? currentLang : 'en';
  const b      = aliBand(s.autonomicLoadIndex);
  const bLabel = HRV_BAND_LABELS[b][L];
  const qLabel = HRV_QUALITY_LABELS[s.qualityFlag][L];
  const ctx    = getModuleContextSentence(moduleId, L);   // ← 'skin' key

  const vitals = L === 'id'
    ? `RMSSD: ${s.rmssd} ms · ALI: ${bLabel} · HR: ${s.meanHr} bpm · Kualitas: ${qLabel}`
    : `RMSSD: ${s.rmssd} ms · ALI: ${bLabel} · HR: ${s.meanHr} bpm · Quality: ${qLabel}`;

  _hset(containerId, `
    <div class="hrv-strip hrv-strip-data ${_bandCss(b)}">
      <div class="hrv-strip-vitals">${vitals}</div>
      <div class="hrv-strip-ctx">${ctx}</div>
    </div>`);
}
```

**Context sentence for `skin` module** (from `getModuleContextSentence()`, lines 307–310):
```javascript
skin: {
  en: 'Sustained sympathetic dominance elevates cortisol, which is associated with accelerated collagen turnover.',
  id: 'Dominasi simpatis yang berkelanjutan meningkatkan kortisol, yang dikaitkan dengan percepatan pergantian kolagen.'
}
```

**Helper internals (lines 371–386):**
```javascript
function _hset(id, html) {
  const el = document.getElementById(id);
  if (el) el.innerHTML = html;
}
function _bandCss(band) {
  return 'hrv-band-' + band.replace(/_/g, '-');  // e.g. 'hrv-band-very-low'
}
function _t(enStr, idStr) {
  return (typeof currentLang !== 'undefined' && currentLang === 'id') ? idStr : enStr;
}
```

**Module 9 additions needed in hrv-engine.js:**
1. Add `'digestive'` entry to `getModuleContextSentence()` sentences object:
   ```javascript
   digestive: {
     en: 'The vagus nerve directly governs gut motility and digestive enzyme secretion. Low autonomic load index is associated with reduced peristalsis and impaired digestive transformation.',
     id: 'Saraf vagus secara langsung mengatur motilitas usus dan sekresi enzim pencernaan. ...'
   }
   ```
2. Add public wrapper: `function renderHrvStrip_Digestive() { _renderStrip('digestive', 'hrv-strip-dg'); }`
3. Add `renderHrvStrip_Digestive();` call inside `renderHrvPanel()` (after `renderHrvStrip_Skin()`).

---

## 7. Language toggle

### Architecture summary

Field input labels (`<label class="ilb">`) are **hardcoded in English**. There is no bilingual map for field names in v4. Backlog item B3 (parameter name translation ID/EN) is deferred — v4 does not implement it.

The language toggle (`data-lang` button, line 324) calls `setLang(lang)` from `zone-scoring.js` and then re-renders three specific element types via DOM traversal:

### What IS bilingual in v4

**1. Zone badges** — via `zone-scoring.js` `ZONE_BADGES` map:
```javascript
// zone-scoring.js lines 21–27
const ZONE_BADGES = {
  normal:  { en: 'Normal',       id: 'Normal'           },
  ringan:  { en: 'Mild',          id: 'Perlu Perhatian'  },
  sedang:  { en: 'Moderate',     id: 'Perlu Tindakan'   },
  berat:   { en: 'Top Priority',  id: 'Prioritas Utama'  },
  unknown: { en: '—',             id: '—'                }
};
```
`getBadge(zoneLabel)` returns the current-lang string. Toggle re-fires via:
```javascript
document.querySelectorAll('[data-zone]').forEach(el => {
  if (typeof getBadge === 'function') el.textContent = getBadge(el.dataset.zone);
});
```

**2. Pillar burden labels** — inline bilingual map in `getPillarLabel()` (v4.html lines 744–752):
```javascript
const labels = {
  minimal:  { en: 'Minimal Load',   id: 'Beban Minimal' },
  mild:     { en: 'Mild Load',      id: 'Beban Ringan'  },
  moderate: { en: 'Moderate Load',  id: 'Beban Sedang'  },
  high:     { en: 'High Load',      id: 'Beban Tinggi'  }
};
return labels[key][currentLang] || labels[key]['en'];
```
Toggle re-fires via `[data-pillar-label]` elements that carry `data-burden` attribute.

**3. HRV labels** — `HRV_BAND_LABELS` and `HRV_QUALITY_LABELS` in `hrv-engine.js`, toggled by re-calling `renderHrvPanel()` and walking `[data-gauge-label]` / `[data-gauge-band]` elements.

### What is NOT bilingual in v4 (English-only)

- All `<label class="ilb">` field names (e.g. "Skin Collagen", "Triglyceride Imbalance")
- `<div class="irg">` reference range hints
- `<div class="psub">` panel subtitles
- Section headings (`pgt`)
- Action plan table content, food tags, alert text

**Implication for Module 9:** follow the same pattern — English-only field labels in the HTML, but ensure all bmr() chip renders pass the zone label so `[data-zone]` elements get correctly updated by the toggle.
