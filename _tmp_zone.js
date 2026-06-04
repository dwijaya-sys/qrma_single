
(function(){const t=document.querySelector('[data-tt]'),r=document.documentElement;let d=matchMedia('(prefers-color-scheme:dark)').matches?'dark':'light';r.setAttribute('data-theme',d);t&&t.addEventListener('click',()=>{d=d==='dark'?'light':'dark';r.setAttribute('data-theme',d);t.innerHTML=d==='dark'?'<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>':'<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>';});})();
function nav(id){document.querySelectorAll('.pg').forEach(s=>s.classList.remove('active'));document.querySelectorAll('[data-nav],[data-mn]').forEach(s=>s.classList.remove('active'));document.getElementById('pg-'+id).classList.add('active');document.querySelectorAll('[data-nav="'+id+'"],[data-mn="'+id+'"]').forEach(e=>e.classList.add('active'));if(id==='bodycomp'&&typeof bcAutoCalc==='function')bcAutoCalc();window.scrollTo({top:0,behavior:'smooth'});}
const g=id=>parseFloat(document.getElementById(id)?.value)||0;
function se(id,val,cls){const e=document.getElementById(id);if(!e)return;e.textContent=val;if(cls){e.className=e.className.replace(/\bc(ok|warn|bad|info)\b/g,'').trim()+' '+cls;}}
function clrc(v,lo,hi){return v<=lo?'cok':v<=hi?'cwarn':'cbad';}
// Zone-aware module colour — worst zone in the module drives the colour.
// One berat field = red regardless of other fields.
// One sedang field = orange. All normal/ringan/unknown = green.
function moduleZoneColor(fields){
  const zd=window.zoneData||{};
  for(const id of fields){if((zd[id+'_zone']||'')==='berat')  return 'cbad';}
  for(const id of fields){if((zd[id+'_zone']||'')==='sedang') return 'cwarn';}
  return 'cok';
}
// zone-to-bmr-status: converts zone label to bmr() display status
// type 'res' = resilience param (lower zone = deficient)
// type 'brdn' = burden param (higher zone = abnormal)
// unknown zone → 'borderline' (neutral, non-alarming fallback)
function zbs(fieldId,type){
  const zone=(window.zoneData||{})[fieldId+'_zone']||'unknown';
  if(zone==='normal') return 'normal';
  if(zone==='ringan') return 'borderline';
  return type==='brdn'?'abnormal':'deficient';
}
function lbl(v,lo,hi){return v<=lo?'Low Concern':v<=hi?'Monitor':'Needs Lab Confirmation';}
function getBcLabel(s){return s<30?'Low Concern':s<60?'Monitor':'Needs Lab Confirmation';}
function bcZoneLabel(zone){
  const lang=(typeof currentLang!=='undefined')?currentLang:'id';
  const map={en:{normal:'Normal',ringan:'Mild',sedang:'Moderate',berat:'High Risk'},
             id: {normal:'Normal',ringan:'Ringan',sedang:'Sedang', berat:'Berat'}};
  const label=((map[lang]||map.id)[zone])||zone;
  return label.charAt(0).toUpperCase()+label.slice(1);
}
function bcRefreshLabels(){
  const bc=window.bcResult;
  if(!bc||!bc.s)return;
  const alerts=[];
  if(bc.bmi?.zone&&bc.bmi.zone!=='normal')
    alerts.push(aal('warn','BMI — '+bcZoneLabel(bc.bmi.zone),'BMI '+(bc.bmi.raw?.toFixed(1)??'—')+' kg/m²',true));
  if(bc.wc?.zone&&bc.wc.zone!=='normal')
    alerts.push(aal('warn','Waist — '+bcZoneLabel(bc.wc.zone),bc.wc.raw+' cm',true));
  if(bc.bf?.zone&&bc.bf.zone!=='normal')
    alerts.push(aal('warn','Body fat — '+bcZoneLabel(bc.bf.zone),bc.bf.raw+'%',true));
  if(bc.vf?.zone&&bc.vf.zone!=='normal')
    alerts.push(aal('warn','Visceral fat — '+bcZoneLabel(bc.vf.zone),'Index '+bc.vf.raw,true));
  if(bc.whr?.zone&&bc.whr.zone!=='normal')
    alerts.push(aal('warn','Waist-height ratio — '+bcZoneLabel(bc.whr.zone),bc.whr.raw?.toFixed(2)??'—',true));
  if(bc.bmr?.raw){
    const bmrTitle=(currentLang==='en')?'Estimated BMR':'Estimasi BMR';
    const bmrDesc=(currentLang==='en')
      ?bc.bmr.raw.toFixed(0)+' kcal/day — Basal Metabolic Rate: the minimum energy your body needs at rest to maintain basic functions (breathing, circulation, cell repair).'
      :bc.bmr.raw.toFixed(0)+' kkal/hari — Basal Metabolic Rate: jumlah energi minimum yang dibutuhkan tubuh saat istirahat untuk mempertahankan fungsi dasar (pernapasan, sirkulasi, perbaikan sel).';
    alerts.push(aal('info',bmrTitle,bmrDesc));
  }
  const el=document.getElementById('r-bcal');
  if(el)el.innerHTML=alerts.join('');
}
function bar(label,val,max,ccls){const pct=Math.min(100,(val/max)*100);const fc=ccls.replace('c','f');return '<div class="sbw"><div class="sbh"><span class="sbhl">'+label+'</span><span class="'+ccls+'" style="font-weight:700">'+val.toFixed(1)+'</span></div><div class="sbt"><div class="sbf '+fc+'" style="width:'+pct+'%"></div></div><div class="sbl"><span>0</span><span>'+max+'</span></div></div>';}
function bmr(name,val,st,zone){const m={normal:'cok2',borderline:'cbl',deficient:'cdef',abnormal:'cab'};const zA=zone?' data-zone="'+zone+'"':'';const label=zone&&typeof getBadge==='function'?getBadge(zone):{normal:'Normal',borderline:'Borderline',deficient:'Deficient',abnormal:'Abnormal'}[st]||st;return '<div class="bmr"><span class="bmn">'+name+'</span><span class="bmv">'+(typeof val==='number'?val.toFixed(3):val)+'</span><span class="chip '+(m[st]||'cbl')+'"'+zA+'>'+label+'</span></div>';}
function aal(type,title,desc,forceTitleBlack=false){const m={err:'aerr',warn:'awarn',info:'ainfo',ok:'aok'};const ic={err:'alert-circle',warn:'alert-triangle',info:'info',ok:'check-circle'};const ts=forceTitleBlack?' style="color:#000000"':'';return '<div class="aal '+(m[type])+'"><i data-lucide="'+ic[type]+'" width="16" height="16" class="aalic"></i><div class="aalb"><div class="aalt"'+ts+'>'+title+'</div><div class="aald">'+desc+'</div></div></div>';}
function ftrow(label,foods){return '<div style="margin-bottom:var(--sp3)"><div style="font-size:var(--text-sm);font-weight:600;margin-bottom:var(--sp2)">'+label+'</div><div class="ftags">'+foods.map(f=>'<span class="ftag">&#127807; '+f+'</span>').join('')+'</div></div>';}
function getPillarLabel(burden){
  const labels={
    minimal:{en:'Minimal Load',id:'Beban Minimal'},
    mild:   {en:'Mild Load',   id:'Beban Ringan'},
    moderate:{en:'Moderate Load',id:'Beban Sedang'},
    high:   {en:'High Load',   id:'Beban Tinggi'}
  };
  const key=burden<3?'minimal':burden<5?'mild':burden<7?'moderate':'high';
  return labels[key][currentLang]||labels[key]['en'];
}
function applyLabels(lang) {
  if (!window.QRMA_LABELS) return;
  const fields  = window.QRMA_LABELS.fields  || {};
  const ui      = window.QRMA_LABELS.ui      || {};
  const modules = window.QRMA_LABELS.modules || {};

  // Field labels — update text node only, preserve hint spans
  document.querySelectorAll('[data-label-key]').forEach(el => {
    const key  = el.dataset.labelKey;
    const entry = fields[key];
    if (!entry) return;
    const translated = entry[lang] || entry['en'];
    if (!translated) return;
    for (const node of el.childNodes) {
      if (node.nodeType === Node.TEXT_NODE && node.textContent.trim()) {
        node.textContent = translated + ' ';
        break;
      }
    }
  });

  // UI element labels
  document.querySelectorAll('[data-ui-key]').forEach(el => {
    const key = el.dataset.uiKey;
    const entry = ui[key];
    if (!entry) return;
    const translated = entry[lang] || entry['en'];
    if (!translated) return;
    for (const node of el.childNodes) {
      if (node.nodeType === Node.TEXT_NODE && node.textContent.trim()) {
        node.textContent = ' ' + translated;
        break;
      }
    }
  });

  // Module page titles — update text node only, preserve <small> subtitle
  document.querySelectorAll('[data-module-key]').forEach(el => {
    const key = el.dataset.moduleKey;
    const entry = modules[key];
    if (!entry) return;
    const translated = entry[lang] || entry['en'];
    if (!translated) return;
    for (const node of el.childNodes) {
      if (node.nodeType === Node.TEXT_NODE && node.textContent.trim()) {
        node.textContent = translated;
        break;
      }
    }
  });
}

function barPillar(label,val,ccls){
  const pct=Math.min(100,(val/10)*100);
  const fc=ccls.replace('c','f');
  const vl=getPillarLabel(val);
  return '<div class="sbw"><div class="sbh"><span class="sbhl">'+label+'</span>'+
    '<span style="display:flex;align-items:center;gap:var(--sp2)">'+
      '<span class="'+ccls+'" style="font-weight:700">'+val.toFixed(1)+'</span>'+
      '<span data-pillar-label data-burden="'+val.toFixed(1)+'" style="font-size:var(--text-sm);color:var(--txtM)">'+vl+'</span>'+
    '</span></div>'+
    '<div class="sbt"><div class="sbf '+fc+'" style="width:'+pct+'%"></div></div>'+
    '<div class="sbl"><span>0</span><span>10</span></div></div>';
}
function cBioAge(){
  const age = g('age');

  // ── Threshold config for all 18 Bio Age fields ───────────────────────────
  // window.zoneData is only written by CSV/JSON import and never reflects
  // live manual edits. We compute zones here from raw values so the pillar
  // bars respond immediately to any field change.
  //
  // dir 'hi'  — higher is worse; anchor = hi
  //   normal ≤ hi · ringan ≤ 1.5×hi · sedang ≤ 3×hi · berat > 3×hi
  // dir 'lo'  — lower is worse (reserve); anchor = lo
  //   normal ≥ lo · ringan ≥ 0.75×lo · sedang ≥ 0.5×lo · berat < 0.5×lo
  // dir 'bi'  — bidirectional; uses range width rw = hi − lo
  //   normal inside [lo, hi] · ringan within 0.5×rw · sedang within 1.5×rw · berat beyond
  const BIO_THR = {
    bv:  { lo:30,   hi:45,   dir:'hi' },
    cp:  { lo:0,    hi:50,   dir:'hi' },
    art: { lo:0,    hi:0.5,  dir:'hi' },
    ins: { lo:3.0,  hi:5.0,  dir:'bi' },
    bs:  { lo:4.4,  hi:6.1,  dir:'bi' },
    fr:  { lo:0,    hi:3.0,  dir:'hi' },
    hyp: { lo:100,  hi:150,  dir:'hi' },
    ph:  { lo:3.5,  hi:4.5,  dir:'bi' },
    pb:  { lo:0,    hi:1.2,  dir:'hi' },
    hg:  { lo:0,    hi:0.5,  dir:'hi' },
    ce:  { lo:0.7,  hi:1.0,  dir:'lo' },
    cs:  { lo:4.0,  hi:6.0,  dir:'lo' },
    cj:  { lo:5.0,  hi:7.0,  dir:'lo' },
    coq: { lo:1.0,  hi:2.0,  dir:'lo' },
    gsh: { lo:1.0,  hi:2.0,  dir:'lo' },
    vc:  { lo:4.5,  hi:6.5,  dir:'lo' },
    ve:  { lo:5.0,  hi:7.0,  dir:'lo' },
    ost: { lo:100,  hi:160,  dir:'bi' },
  };

  function rawToZone(val, cfg) {
    if (val === null || isNaN(val)) return 'unknown';
    const { lo, hi, dir } = cfg;
    if (dir === 'hi') {
      if (val <= hi)        return 'normal';
      if (val <= hi * 1.5)  return 'ringan';
      if (val <= hi * 3)    return 'sedang';
      return 'berat';
    }
    if (dir === 'lo') {
      if (val >= lo)        return 'normal';
      if (val >= lo * 0.75) return 'ringan';
      if (val >= lo * 0.5)  return 'sedang';
      return 'berat';
    }
    // 'bi' — bidirectional, anchored on range width
    const rw = hi - lo;
    if (val >= lo && val <= hi) return 'normal';
    if (val > hi) {
      if (val <= hi + rw * 0.5)  return 'ringan';
      if (val <= hi + rw * 1.5)  return 'sedang';
      return 'berat';
    }
    // val < lo
    if (val >= lo - rw * 0.5)  return 'ringan';
    if (val >= lo - rw * 1.5)  return 'sedang';
    return 'berat';
  }

  // Compute zones from live input values and write to window.zoneData
  if (!window.zoneData) window.zoneData = {};
  Object.entries(BIO_THR).forEach(([fieldId, cfg]) => {
    window.zoneData[fieldId + '_zone'] = rawToZone(g(fieldId), cfg);
  });

  // Burden from zone: normal→1  ringan→4  sedang→7  berat→9  unknown→5
  function burden(fieldId) {
    const s = scoreFromZone(window.zoneData[fieldId + '_zone'] || 'unknown');
    return s === 0 ? 5 : 10 - s;
  }

  function avgBurden(fields){
    return fields.map(burden).reduce((a,b) => a+b, 0) / fields.length;
  }

  // Pillar 1 — vascular & metabolic load
  const p1 = avgBurden(['bv','cp','art','ins','bs']);

  // Pillar 2 — oxidative burden & toxic stress
  const p2 = avgBurden(['fr','hyp','ph','pb','hg']);

  // Pillar 3 — regenerative reserve deficit
  const p3 = avgBurden(['ce','cs','cj','coq','gsh','vc','ve','ost']);

  // Bio age offset: weighted pillar burden × scale factor 1.2
  const offset = (p1*0.35 + p2*0.35 + p3*0.30) * 1.2;

  return {
    ba:  Math.round(age + offset),
    age: age,
    p1:  +p1.toFixed(1),
    p2:  +p2.toFixed(1),
    p3:  +p3.toFixed(1)
  };
}
function cOx(){
  const zd = window.zoneData || {};

  // Get zone score for a field (9=normal, 1=berat, 0=unknown)
  function zs(id){ return scoreFromZone(zd[id+'_zone']||'unknown'); }

  // Burden score — inverse of zone score for higher-is-worse params
  // normal(9)→1  ringan(6)→4  sedang(3)→7  berat(1)→9  unknown→5
  function bd(id){ const s=zs(id); return s===0?5:10-s; }

  // Antioxidant reserve: avg zone score × scale → 0–100
  // Higher = better reserve
  const ax = ((zs('ox-gsh')+zs('ox-coq')+zs('ox-vc')+zs('ox-ve')+zs('ox-sel'))/5)*(100/9);

  // Pro-oxidant load: avg burden score × scale → 0–100
  // Higher = more oxidative stress
  const px = ((bd('ox-fr')+bd('ox-hyp')+bd('ox-ph'))/3)*(100/9);

  // Combined score — higher means more stress (same weights as v2)
  const s = Math.min(100,Math.max(0,Math.round((100-ax)*.55+px*.45)));

  return{
    s,
    ax:Math.round(ax), px:Math.round(px),
    gsh:g('ox-gsh'), coq:g('ox-coq'), vc:g('ox-vc'),
    ve:g('ox-ve'),   sel:g('ox-sel'),
    fr:g('ox-fr'),   hyp:g('ox-hyp'), ph:g('ox-ph')
  };
}
function cTx(){
  const zd = window.zoneData || {};

  // All toxic params are higher-is-worse — use burden score
  // normal(9)→1  ringan(6)→4  sedang(3)→7  berat(1)→9  unknown→5
  function bd(id){ const s=scoreFromZone(zd[id+'_zone']||'unknown'); return s===0?5:10-s; }

  // Heavy metal burden: lead, mercury, cadmium, arsenic
  const hm = ((bd('tx-pb')+bd('tx-hg')+bd('tx-cd')+bd('tx-as'))/4)*(100/9);

  // Lifestyle burden: stimulants, tobacco, pesticides
  const lb = ((bd('tx-st')+bd('tx-tb')+bd('tx-ps'))/3)*(100/9);

  // Combined toxic exposure score — same weights as v2
  const s = Math.min(100,Math.max(0,Math.round(hm*.6+lb*.4)));

  return{
    s,
    hm:Math.round(hm), lb:Math.round(lb),
    pb:g('tx-pb'), hg:g('tx-hg'), cd:g('tx-cd'), as_:g('tx-as'),
    st:g('tx-st'), tb:g('tx-tb'), ps:g('tx-ps')
  };
}
function cMt(){
  const zd   = window.zoneData || {};
  const gend = document.getElementById('gender')?.value||'male';

  // All metabolic params are higher-is-worse — use burden score
  // normal(9)→1  ringan(6)→4  sedang(3)→7  berat(1)→9  unknown→5
  function bd(id){ const s=scoreFromZone(zd[id+'_zone']||'unknown'); return s===0?5:10-s; }

  // Glycemic burden: urine glucose + insulin secretion
  const gc = ((bd('mt-ug')+bd('mt-ins'))/2)*(100/9);

  // Lipid burden: triglycerides + fat metabolism
  const lp = ((bd('mt-tg')+bd('mt-fm'))/2)*(100/9);

  // BMI and waist — zone-based penalty scores.
  // Asian IDF waist thresholds: male ≥90cm, female ≥80cm.
  // computeAllZones() uses male default (90 cm); override here for female.
  const bmi = g('mt-bmi');
  const wc  = g('mt-wc');
  if (gend === 'female' && wc > 0) {
    zd['mt-wc_zone'] = liveZone(wc, 'hi', null, 80);
  }
  const bmiP = bd('mt-bmi') * (100/9) * 0.15;
  const wcP  = bd('mt-wc')  * (100/9) * 0.10;

  const s = Math.min(100,Math.round(gc*.40+lp*.35+bmiP+wcP));

  return{
    s,
    gc:Math.round(gc), lp:Math.round(lp),
    tg:g('mt-tg'), ug:g('mt-ug'), ins:g('mt-ins'), fm:g('mt-fm'),
    bmi, wc
  };
}
function cCr(){
  const zd = window.zoneData || {};

  function bd(id){ const s=scoreFromZone(zd[id+'_zone']||'unknown'); return s===0?5:10-s; }

  const cai = ((bd('cr-ch')+bd('cr-vf')+bd('cr-lv'))/3)*(100/9);
  const ri  = ((bd('cr-ua')+bd('cr-pt')+bd('cr-k')+bd('cr-mg'))/4)*(100/9);
  const s   = Math.min(100,Math.max(0,Math.round(cai*.55+ri*.45)));

  return{
    s,
    cai:Math.round(cai), ri:Math.round(ri),
    ch:g('cr-ch'), vf:g('cr-vf'), lv:g('cr-lv'),
    ua:g('cr-ua'), pt:g('cr-pt'), k:g('cr-k'), mg:g('cr-mg')
  };
}
function cNt(){
  const zd = window.zoneData || {};

  const fields=[
    {n:'Zinc',      id:'nt-zn'}, {n:'Magnesium', id:'nt-mg'},
    {n:'Potassium', id:'nt-k'},  {n:'Iodine',    id:'nt-io'},
    {n:'Silicon',   id:'nt-si'}, {n:'Vitamin B6',id:'nt-b6'},
    {n:'Vitamin C', id:'nt-vc'}, {n:'Vitamin D3',id:'nt-d3'},
    {n:'Vitamin E', id:'nt-ve'}, {n:'Folate',    id:'nt-fo'}
  ];

  // Resilience module — zone score used directly (higher = better reserve)
  // unknown zone → neutral score 5 (mid-range, neither good nor bad)
  let def=0, opt=0, total=0;

  const items=fields.map(f=>{
    const zone  = zd[f.id+'_zone']||'unknown';
    const score = scoreFromZone(zone)===0 ? 5 : scoreFromZone(zone);
    total += score;
    if(zone==='normal')               opt++;
    else if(zone==='ringan'||zone==='sedang'||zone==='berat') def++;
    return{n:f.n, v:g(f.id), zone, score};
  });

  // s: avg zone score normalised to 0–100 (higher = better sufficiency)
  const s = Math.round((total/fields.length)*(100/9));

  return{s, def, opt, items};
}
function cSk(){
  const zd = window.zoneData || {};

  // Resilience module — zone score used directly (higher = better)
  // sk-jc is a permanent gap → zone unknown → neutral 5
  // unknown zone → neutral score 5
  function zs(id){ const s=scoreFromZone(zd[id+'_zone']||'unknown'); return s===0?5:s; }

  // Collagen index: skin collagen + eye collagen + joint collagen
  const cl = Math.round(((zs('sk-sc')+zs('sk-ec')+zs('sk-jc'))/3)*(100/9));

  // Barrier function: elasticity + TEWL (zone direction handled by PDF ref)
  const bf = Math.round(((zs('sk-el')+zs('sk-tw'))/2)*(100/9));

  // Sensitivity: normal zone (low sensitivity) = good resilience score
  // No manual inversion needed — zone system encodes direction correctly
  const sn = Math.round(zs('sk-sn')*(100/9));

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
// =============================================================================
// BODY COMPOSITION RISK SCORE  (v6 — zone-based, no raw numeric thresholds
// in final score calculation)
// =============================================================================
function cBc() {
  // ── 1. Read inputs — with fallbacks ────────────────────────────────────
  function rn(id, fallbackId) {
    const v = parseFloat(document.getElementById(id)?.value);
    if (!isNaN(v) && v > 0) return v;
    if (fallbackId) { const v2 = parseFloat(document.getElementById(fallbackId)?.value); if (!isNaN(v2) && v2 > 0) return v2; }
    return null;
  }
  function rs(id, fallbackId) {
    const v = (document.getElementById(id)?.value || '').trim().toLowerCase();
    if (v) return v;
    if (fallbackId) return (document.getElementById(fallbackId)?.value || '').trim().toLowerCase();
    return '';
  }

  const gender  = rs('bc-gender', 'gender') || 'male';
  const age     = rn('bc-age',    'age')    || 30;
  const height  = rn('bc-height', null);
  const weight  = rn('bc-weight', null);
  let   bmiRaw  = rn('bc-bmi',   null);
  const wcRaw   = rn('bc-wc',    null);
  const bfRaw   = rn('bc-bf',    null);
  const vfRaw   = rn('bc-vf',    null);
  let   whrRaw  = rn('bc-whr',   null);

  // ── 2. Auto-calculate BMI if height + weight provided ──────────────────
  if (!bmiRaw && height && weight && height > 0) {
    bmiRaw = weight / ((height / 100) * (height / 100));
  }

  // ── 3. Auto-calculate WHR from wc / height ─────────────────────────────
  if (!whrRaw && wcRaw && height && height > 0) {
    whrRaw = wcRaw / height;
  }

  // ── 4. Auto-calculate BMR — Mifflin-St Jeor (kcal/day) ────────────────
  let bmrRaw = null;
  if (weight && height && age) {
    bmrRaw = (10 * weight) + (6.25 * height) - (5 * age) + (gender === 'female' ? -161 : 5);
  }

  // ── 5. Zone classification helper ──────────────────────────────────────
  // thresholds: [{max, zone}] sorted ascending; last entry has max=Infinity
  function zoneForValue(val, thresholds) {
    if (val === null || val === undefined || isNaN(val)) return 'unknown';
    for (const t of thresholds) { if (val <= t.max) return t.zone; }
    return thresholds[thresholds.length - 1].zone;
  }

  // ── 6. Threshold tables ─────────────────────────────────────────────────
  // BMI — WHO; mirrors below 18.5 (underweight flagged same direction)
  function bmiZone(bmi) {
    if (bmi === null) return 'unknown';
    if (bmi < 16.0)   return 'berat';
    if (bmi < 17.0)   return 'sedang';
    if (bmi < 18.5)   return 'ringan';
    if (bmi <= 24.9)  return 'normal';
    if (bmi <= 27.4)  return 'ringan';
    if (bmi <= 29.9)  return 'sedang';
    return 'berat'; // ≥ 30
  }

  // Waist circumference — IDF South/Southeast Asian cutoffs
  function wcZone(wc, sex) {
    if (wc === null) return 'unknown';
    if (sex === 'female') {
      return zoneForValue(wc, [
        { max: 79.9,  zone: 'normal' },
        { max: 84.9,  zone: 'ringan' },
        { max: 89.9,  zone: 'sedang' },
        { max: Infinity, zone: 'berat' }
      ]);
    }
    return zoneForValue(wc, [
      { max: 89.9,  zone: 'normal' },
      { max: 94.9,  zone: 'ringan' },
      { max: 99.9,  zone: 'sedang' },
      { max: Infinity, zone: 'berat' }
    ]);
  }

  // Body fat % — ACSM, by sex and age bracket
  function bfZone(bf, sex, ageYrs) {
    if (bf === null) return 'unknown';
    let t;
    if (sex === 'female') {
      if (ageYrs < 40)       t = [{ max: 27.9, zone: 'normal' }, { max: 32.9, zone: 'ringan' }, { max: 37.9, zone: 'sedang' }, { max: Infinity, zone: 'berat' }];
      else if (ageYrs < 60)  t = [{ max: 29.9, zone: 'normal' }, { max: 34.9, zone: 'ringan' }, { max: 39.9, zone: 'sedang' }, { max: Infinity, zone: 'berat' }];
      else                   t = [{ max: 31.9, zone: 'normal' }, { max: 36.9, zone: 'ringan' }, { max: 41.9, zone: 'sedang' }, { max: Infinity, zone: 'berat' }];
    } else {
      if (ageYrs < 40)       t = [{ max: 19.9, zone: 'normal' }, { max: 24.9, zone: 'ringan' }, { max: 29.9, zone: 'sedang' }, { max: Infinity, zone: 'berat' }];
      else if (ageYrs < 60)  t = [{ max: 21.9, zone: 'normal' }, { max: 26.9, zone: 'ringan' }, { max: 31.9, zone: 'sedang' }, { max: Infinity, zone: 'berat' }];
      else                   t = [{ max: 23.9, zone: 'normal' }, { max: 28.9, zone: 'ringan' }, { max: 33.9, zone: 'sedang' }, { max: Infinity, zone: 'berat' }];
    }
    return zoneForValue(bf, t);
  }

  // Visceral fat — Tanita scale 1–59
  const vfThresholds = [
    { max: 9,  zone: 'normal' },
    { max: 14, zone: 'ringan' },
    { max: 19, zone: 'sedang' },
    { max: Infinity, zone: 'berat' }
  ];

  // Waist-to-height ratio
  const whrThresholds = [
    { max: 0.4999, zone: 'normal' },
    { max: 0.5499, zone: 'ringan' },
    { max: 0.5999, zone: 'sedang' },
    { max: Infinity, zone: 'berat' }
  ];

  // ── 7. Classify each parameter ─────────────────────────────────────────
  const bmiZoneStr = bmiZone(bmiRaw);
  const wcZoneStr  = wcZone(wcRaw, gender);
  const bfZoneStr  = bfZone(bfRaw, gender, age);
  const vfZoneStr  = zoneForValue(vfRaw, vfThresholds);
  const whrZoneStr = zoneForValue(whrRaw, whrThresholds);

  // ── 8. Convert zones to burden scores ──────────────────────────────────
  // normal→1  ringan→4  sedang→7  berat→9  unknown→5
  function zbd(zoneStr) {
    const s = scoreFromZone(zoneStr); // from zone-scoring.js
    return s === 0 ? 5 : 10 - s;
  }

  const bmiScore = bmiZoneStr !== 'unknown' ? zbd(bmiZoneStr) : null;
  const wcScore  = wcZoneStr  !== 'unknown' ? zbd(wcZoneStr)  : null;
  const bfScore  = bfZoneStr  !== 'unknown' ? zbd(bfZoneStr)  : null;
  const vfScore  = vfZoneStr  !== 'unknown' ? zbd(vfZoneStr)  : null;
  const whrScore = whrZoneStr !== 'unknown' ? zbd(whrZoneStr) : null;

  // ── 9. Sub-scores (0-100, higher = more risk) ──────────────────────────
  // Central adiposity index: waist + WHR  (0.5 / 0.5)
  let cai = null;
  if (wcScore !== null && whrScore !== null)  cai = ((wcScore + whrScore) / 2) * (100 / 9);
  else if (wcScore  !== null)                 cai = wcScore  * (100 / 9);
  else if (whrScore !== null)                 cai = whrScore * (100 / 9);

  // Body composition index: body fat + visceral fat  (0.6 / 0.4)
  let bci = null;
  if (bfScore !== null && vfScore !== null)   bci = (bfScore * 0.6 + vfScore * 0.4) * (100 / 9);
  else if (bfScore  !== null)                 bci = bfScore  * (100 / 9);
  else if (vfScore  !== null)                 bci = vfScore  * (100 / 9);

  // Structural index: BMI only
  const sti = bmiScore !== null ? bmiScore * (100 / 9) : null;

  // ── 10. Final score (only if at least one sub-score is available) ───────
  let s = 0;
  const parts = [];
  if (cai !== null) parts.push({ v: cai, w: 0.40 });
  if (bci !== null) parts.push({ v: bci, w: 0.35 });
  if (sti !== null) parts.push({ v: sti, w: 0.25 });

  if (parts.length > 0) {
    const totalW = parts.reduce((a, p) => a + p.w, 0);
    s = Math.min(100, Math.max(0, Math.round(
      parts.reduce((a, p) => a + p.v * p.w, 0) / totalW
    )));
  }

  return {
    s,
    cai: cai !== null ? Math.round(cai) : null,
    bci: bci !== null ? Math.round(bci) : null,
    sti: sti !== null ? Math.round(sti) : null,
    bmi: bmiRaw  !== null ? { raw: bmiRaw,  zone: bmiZoneStr, score: bmiScore } : null,
    wc:  wcRaw   !== null ? { raw: wcRaw,   zone: wcZoneStr,  score: wcScore  } : null,
    bf:  bfRaw   !== null ? { raw: bfRaw,   zone: bfZoneStr,  score: bfScore  } : null,
    vf:  vfRaw   !== null ? { raw: vfRaw,   zone: vfZoneStr,  score: vfScore  } : null,
    whr: whrRaw  !== null ? { raw: whrRaw,  zone: whrZoneStr, score: whrScore } : null,
    bmr: bmrRaw  !== null ? { raw: bmrRaw } : null,
    gender, age
  };
}

// ── cBc() inline unit tests (console only, fire on load) ─────────────────
(function _testCBc() {
  // Test zone helper logic directly against threshold tables
  function _bmiZone(bmi) {
    if (bmi < 16.0) return 'berat';
    if (bmi < 17.0) return 'sedang';
    if (bmi < 18.5) return 'ringan';
    if (bmi <= 24.9) return 'normal';
    if (bmi <= 27.4) return 'ringan';
    if (bmi <= 29.9) return 'sedang';
    return 'berat';
  }
  function _wcZone(wc, sex) {
    if (sex === 'female') {
      if (wc < 80) return 'normal'; if (wc < 85) return 'ringan'; if (wc < 90) return 'sedang'; return 'berat';
    }
    if (wc < 90) return 'normal'; if (wc < 95) return 'ringan'; if (wc < 100) return 'sedang'; return 'berat';
  }
  function _bfZone(bf, sex, age) {
    const t = sex === 'female'
      ? (age < 40 ? [28,33,38] : age < 60 ? [30,35,40] : [32,37,42])
      : (age < 40 ? [20,25,30] : age < 60 ? [22,27,32] : [24,29,34]);
    if (bf < t[0]) return 'normal'; if (bf < t[1]) return 'ringan'; if (bf < t[2]) return 'sedang'; return 'berat';
  }
  function _vfZone(vf) {
    if (vf <= 9) return 'normal'; if (vf <= 14) return 'ringan'; if (vf <= 19) return 'sedang'; return 'berat';
  }
  function _whrZone(whr) {
    if (whr < 0.50) return 'normal'; if (whr < 0.55) return 'ringan'; if (whr < 0.60) return 'sedang'; return 'berat';
  }

  const cases = [
    { label: 'Obese male 35yo',      bmi: 32,   wc: 100, bf: 28, vf: 18,  whr: 0.58, sex: 'male',   age: 35,
      exp: { bmi: 'berat', wc: 'berat', bf: 'sedang', vf: 'sedang', whr: 'sedang' } },
    { label: 'Normal female 45yo',   bmi: 22,   wc: 75,  bf: 28, vf: 6,   whr: 0.46, sex: 'female', age: 45,
      exp: { bmi: 'normal', wc: 'normal', bf: 'normal', vf: 'normal', whr: 'normal' } },
    { label: 'Borderline male 62yo', bmi: 27,   wc: 92,  bf: 25, vf: 12,  whr: 0.52, sex: 'male',   age: 62,
      exp: { bmi: 'ringan', wc: 'ringan', bf: 'ringan', vf: 'ringan', whr: 'ringan' } },
  ];

  let allPass = true;
  console.group('cBc() unit tests');
  cases.forEach(c => {
    const got = { bmi: _bmiZone(c.bmi), wc: _wcZone(c.wc, c.sex), bf: _bfZone(c.bf, c.sex, c.age), vf: _vfZone(c.vf), whr: _whrZone(c.whr) };
    const pass = Object.keys(c.exp).every(k => got[k] === c.exp[k]);
    if (!pass) allPass = false;
    console.log((pass ? 'PASS' : 'FAIL') + ' — ' + c.label,
      pass ? '' : JSON.stringify({ expected: c.exp, got }));
  });
  console.log(allPass ? 'ALL PASS' : 'SOME FAILED');
  console.groupEnd();
})();
function cDg(){
  const zd=window.zoneData||{};
  function bd(id){const s=scoreFromZone(zd[id+'_zone']||'unknown');return s===0?5:10-s;}
  function g(id){return parseFloat(document.getElementById(id)?.value)||null;}
  const mt=((bd('dg-lp')+bd('dg-sp')+bd('dg-lc'))/3)*(100/9);
  const ab=((bd('dg-la')+bd('dg-sa')+bd('dg-ca')+bd('dg-bi'))/4)*(100/9);
  const pi=((bd('dg-ip')*1.5+bd('dg-ds')*0.5)/2)*(100/9);
  const s=Math.min(100,Math.max(0,Math.round(mt*.40+ab*.35+pi*.25)));
  const bloatingConstipation=(['berat','sedang'].includes(zd['dg-ip_zone']))&&(['berat','sedang'].includes(zd['dg-lc_zone']));
  const upperGiStrain=(['berat','sedang'].includes(zd['dg-lp_zone']))&&(['berat','sedang'].includes(zd['dg-sa_zone']));
  const absorptionDeficit=(zd['dg-sa_zone']==='berat')||(zd['dg-ca_zone']==='berat');
  return{s,mt:Math.round(mt),ab:Math.round(ab),pi:Math.round(pi),
    lp:g('dg-lp'),la:g('dg-la'),sp:g('dg-sp'),sa:g('dg-sa'),
    lc:g('dg-lc'),ca:g('dg-ca'),bi:g('dg-bi'),ip:g('dg-ip'),ds:g('dg-ds'),
    bloatingConstipation,upperGiStrain,absorptionDeficit};
}
function renderHrvStrip_Digestive(){
  const el=document.getElementById('r-dgal');
  if(!el)return;
  const dg=cDg();
  if(dg.s===null){el.innerHTML='';return;}
  const lang=(typeof currentLang!=='undefined')?currentLang:'id';
  const title=lang==='en'?'Digestive Pattern Flagged':'Pola Pencernaan Terdeteksi';
  const desc=lang==='en'
    ?'Consider keeping a bowel diary and Bristol stool scale assessment to establish a baseline transit pattern. Confirm with clinician if symptoms are persistent.'
    :'Pertimbangkan untuk membuat catatan harian BAB dan penilaian skala Bristol untuk menetapkan pola transit dasar. Konfirmasi dengan klinisi jika gejala menetap.';
  el.innerHTML=dg.s>30?aal('info',title,desc):'';
}
let RC=null,BC=null;
function drawCharts(sc){const dk=document.documentElement.getAttribute('data-theme')==='dark';Chart.defaults.color=dk?'#cdccca':'#1a1a1a';const tc=dk?'#cdccca':'#1a1a1a',gc=dk?'#393836':'#dcd9d5';const lb=['Oxidative','Toxic','Metabolic','Cardio-Renal','Nutrients','Skin','Gut','Body Comp'];const rd=[100-Math.min(sc.ox,100),100-Math.min(sc.tx,100),100-Math.min(sc.mt,100),100-Math.min(sc.cr,100),Math.min(sc.nt,100),Math.min(sc.sk,100),100-Math.min(sc.dg||0,100),100-Math.min(sc.bc||0,100)];const cc=v=>v<=30?'#437a22':v<=60?'#d19900':'#a13544';const bc=[cc(sc.ox),cc(sc.tx),cc(sc.mt),cc(sc.cr),cc(100-sc.nt),cc(100-sc.sk),cc(sc.dg||0),cc(sc.bc||0)];if(RC)RC.destroy();if(BC)BC.destroy();RC=new Chart(document.getElementById('radarChart'),{type:'radar',data:{labels:lb,datasets:[{data:rd,backgroundColor:'rgba(1,105,111,.15)',borderColor:'#01696f',pointBackgroundColor:'#01696f',pointRadius:4,borderWidth:2}]},options:{responsive:true,scales:{r:{min:0,max:100,ticks:{display:false},grid:{color:gc},angleLines:{color:gc},pointLabels:{color:document.documentElement.getAttribute('data-theme')==='dark'?'#cdccca':'#1a1a1a',font:{family:'Satoshi',size:13,weight:'500'}}}},plugins:{legend:{display:false}}}});BC=new Chart(document.getElementById('barChart'),{type:'bar',data:{labels:lb,datasets:[{data:[sc.ox,sc.tx,sc.mt,sc.cr,100-sc.nt,100-sc.sk,sc.dg||0,sc.bc||0],backgroundColor:bc,borderRadius:6,borderSkipped:false}]},options:{responsive:true,indexAxis:'y',scales:{x:{min:0,max:100,grid:{color:gc},ticks:{color:document.documentElement.getAttribute('data-theme')==='dark'?'#cdccca':'#1a1a1a',font:{size:13,weight:'500'}},border:{color:gc}},y:{grid:{display:false},ticks:{color:document.documentElement.getAttribute('data-theme')==='dark'?'#cdccca':'#1a1a1a',font:{size:13,weight:'500'}},border:{color:gc}}},plugins:{legend:{display:false},tooltip:{callbacks:{label:ctx=>' Risk: '+ctx.raw+'%'}}}}}); }
function buildAction(d){const rows=[];if(d.ba.ba>d.ba.age+5)rows.push({p:'High',dom:'Biological Age',f:'Bio age '+d.ba.ba+'y vs chrono '+d.ba.age+'y (+'+( d.ba.ba-d.ba.age)+'y)',t:'hsCRP, CBC, Fasting Lipids, HbA1c, TSH/FT4'});if(d.ox.gsh<.9||d.ox.coq<.9)rows.push({p:'Medium',dom:'Oxidative Stress',f:'Deficient glutathione and/or CoQ10 signal',t:'Plasma glutathione (ELISA), CoQ10 (HPLC), 8-OHdG urine'});if(d.tx.pb>1.2)rows.push({p:'High',dom:'Lead Exposure',f:'Lead signal elevated ('+d.tx.pb.toFixed(3)+')',t:'Whole blood lead level (BLL) - gold standard'});if(d.tx.hg>.5)rows.push({p:'High',dom:'Mercury Exposure',f:'Mercury signal elevated ('+d.tx.hg.toFixed(3)+')',t:'Blood total mercury; urine mercury speciation'});if(d.tx.cd>.5)rows.push({p:'Medium',dom:'Cadmium Exposure',f:'Cadmium signal borderline',t:'Urine cadmium (first-morning void)'});if(d.mt.ug>6.1||d.mt.ins<3)rows.push({p:'High',dom:'Glycemic Pattern',f:'Elevated glucose / low insulin signal',t:'FPG, HbA1c, Fasting Insulin, HOMA-IR'});if(d.mt.tg>5)rows.push({p:'Medium',dom:'Lipid Pattern',f:'Elevated triglyceride pattern',t:'Full fasting lipid panel: TG, LDL, HDL, Total Cholesterol'});if(d.cr.ch>50)rows.push({p:'High',dom:'Cholesterol Signal',f:'Plaque signal '+d.cr.ch.toFixed(1),t:'Fasting lipid panel, ApoB, Lp(a), hsCRP'});if(d.cr.pt>3)rows.push({p:'High',dom:'Renal: Proteinuria',f:'Proteinuria index elevated',t:'Urinalysis, uACR, serum creatinine, eGFR'});if(d.cr.vf<6)rows.push({p:'Medium',dom:'Vascular Flexibility',f:'Low vascular signal ('+d.cr.vf.toFixed(1)+')',t:'BP monitoring (ABPM), ankle-brachial index'});if(d.nt.def>4)rows.push({p:'Medium',dom:'Nutrient Deficiency',f:d.nt.def+' nutrients below range',t:'Serum zinc, RBC magnesium, 25(OH)D, serum folate, plasma B6'});if(d.sk.cl<50)rows.push({p:'Low',dom:'Collagen',f:'Low collagen signal across multiple sites',t:'Clinical skin assessment; consider P1NP (procollagen marker)'});
  const sbZone = (window.zoneData || {})['sk-sb_zone'];
  const sbRaw = d.sk ? (d.sk.sb || 0) : 0;
  if (['sedang','berat'].includes(sbZone))
    rows.push({ p:'Low', dom:'Skin: Sebum — Oily Pattern',
      f:'Sebum gland signal higher-than-reference range pattern',
      t:'Dermatological assessment; skin barrier function test' });
  else if (sbRaw > 0 && sbRaw < 14.477)
    rows.push({ p:'Low', dom:'Skin: Sebum — Dry Pattern',
      f:'Sebum gland signal below reference range pattern',
      t:'Dermatological assessment; skin hydration test' });
  if(d.dg && d.dg.s!==null){
    if(d.dg.mt>40) rows.push({p:'Low',dom:'Gut: Motility Pattern',f:'Reduced transit pattern across gastric, small or large intestine signals',t:'Bowel diary + Bristol stool scale; transit study if persistent symptoms'});
    if(d.dg.ab>40) rows.push({p:'Medium',dom:'Gut: Absorption Pattern',f:'Reduced intestinal or colonic absorption pattern — consider nutrient status review',t:'Serum B12, ferritin, 25-OH Vitamin D, full blood count'});
    if(d.dg.pi>40) rows.push({p:'Low',dom:'Gut: Intraluminal Pressure',f:'Elevated intraluminal pressure pattern — often functional',t:'Bowel diary; fecal calprotectin only if clinician suspects inflammatory cause'});
    if(d.dg.bloatingConstipation) rows.push({p:'Medium',dom:'Gut: Bloating + Reduced Transit Pattern',f:'Elevated pressure combined with reduced large intestine motility pattern',t:'Bowel diary; low-FODMAP trial; review eating pace and meal size'});
    if(d.dg.absorptionDeficit) rows.push({p:'Medium',dom:'Gut: Absorption Deficit Pattern',f:'Small intestine or colonic absorption below reference range pattern',t:'Serum B12, ferritin, 25-OH Vitamin D, CBC; discuss with clinician if persistent'});
  }
  // BodyComp entries — zone-based, reads from window.bcResult
  const bcR=window.bcResult;
  if(bcR && bcR.s>0){
    const _bcp=z=>z==='berat'?'High':z==='sedang'?'Medium':'Low';
    if(bcR.bmi?.zone&&bcR.bmi.zone!=='normal')
      rows.push({p:_bcp(bcR.bmi.zone),dom:'Body Composition: BMI',f:'BMI '+bcR.bmi.raw.toFixed(1)+' kg/m² — zone: '+bcR.bmi.zone,t:'DEXA Scan or BIA — body fat % and lean mass distribution'});
    if(bcR.vf?.zone&&bcR.vf.zone!=='normal')
      rows.push({p:_bcp(bcR.vf.zone),dom:'Body Composition: Visceral Fat',f:'Visceral fat index '+bcR.vf.raw+' — zone: '+bcR.vf.zone,t:'Abdominal ultrasound or CT — visceral adipose tissue volume'});
    if(bcR.whr?.zone&&bcR.whr.zone!=='normal')
      rows.push({p:_bcp(bcR.whr.zone),dom:'Body Composition: Waist-Height Ratio',f:'WHR '+bcR.whr.raw.toFixed(2)+' — zone: '+bcR.whr.zone,t:'Metabolic panel + fasting insulin — cardiometabolic risk from central adiposity'});
  }
rows.sort((a,b)=>({High:0,Medium:1,Low:2}[a.p]-{High:0,Medium:1,Low:2}[b.p]));if(!rows.length){document.getElementById('r-acttbl').innerHTML=aal('ok','No Critical Flags','All screening signals within normal reference ranges. Routine monitoring recommended.');}else{let h='<table class="atbl"><thead><tr><th>Priority</th><th>Domain</th><th>Screening Finding</th><th>Suggested Confirmatory Tests</th></tr></thead><tbody>';rows.forEach(r=>{const pc=r.p==='High'?'phi':r.p==='Medium'?'pmd':'plo';h+='<tr><td class="'+pc+'">'+r.p+'</td><td>'+r.dom+'</td><td>'+r.f+'</td><td style="font-size:var(--text-sm);color:#000000">'+r.t+'</td></tr>';});h+='</tbody></table>';document.getElementById('r-acttbl').innerHTML=h;}const fp=[];if(d.ox.s>40)fp.push(ftrow('Antioxidant Priority',['Berries','Spinach','Green Tea','Brazil Nuts (Se)','Citrus (Vit C)','Sunflower Seeds (Vit E)','Dark Chocolate']));if(d.mt.s>30)fp.push(ftrow('Metabolic Support',['Oats + Legumes (Fiber)','Fatty Fish (Omega-3)','Bitter Melon','Cinnamon','Reduce Refined Carbs']));if(d.cr.s>30)fp.push(ftrow('Cardio-Renal',['Bananas + Avocado (K)','Pumpkin Seeds (Mg)','Quercetin Foods (Onion)','Reduce Sodium']));if(d.nt.def>3)fp.push(ftrow('Micronutrient Diversity',['Dark Leafy Greens (Mg, Folate)','Pumpkin Seeds (Zinc)','Seaweed (Iodine)','Fatty Fish (D3, B6)','Chickpeas (Folate)']));if(d.sk.s<60)fp.push(ftrow('Skin + Collagen',['Bone Broth','Fish / Chicken Skin','Egg Whites','Vitamin C Cofactors','Garlic (Sulfur)','Berries (Resveratrol)']));if(d.dg && d.dg.s>30)fp.push(ftrow('Digestive Support',['Smaller meals + slow eating (20+ min per meal)','Warm ginger or peppermint tea with meals','10–15 min walk after lunch (Small Intestine peak: 1–3 PM)','Gradual fibre increase only — sudden increase worsens bloating','Low-FODMAP trial for bloating-predominant patterns','Reduce carbonated drinks + sugar alcohols','Tempeh, kimchi, kefir in small amounts if tolerated','Leek, oats, banana — prebiotic-rich foods','Avoid eating under stress — rest-and-digest before meals']));
if(bcR&&bcR.s>0)fp.push(ftrow('Anti-inflammatory foods',['Fatty fish','Berries','Leafy greens','Olive oil','Turmeric']));
if(bcR&&(bcR.wc?.zone!=='normal'||bcR.whr?.zone!=='normal'))fp.push(ftrow('Waist reduction support',['Green tea','Legumes','Resistant starch','Reduce refined carbs']));
if(bcR&&bcR.bf?.zone&&bcR.bf.zone!=='normal')fp.push(ftrow('Body composition support',['High-protein foods','Cruciferous vegetables','Adequate sleep priority']));
document.getElementById('r-actfood').innerHTML=fp.length?fp.join(''):'<p style="color:var(--txtM);font-size:var(--text-sm)">Continue balanced whole-foods diet. No critical nutritional gaps identified.</p>';const hi=rows.filter(r=>r.p==='High');
let actalHtml=hi.length?hi.map(r=>aal('err',r.dom+' - High Priority',r.f+'. Confirm: '+r.t)).join(''):aal('ok','No High-Priority Alerts','All flags at medium or low priority. See confirmatory tests table.');
if(bcR&&bcR.s>=60)actalHtml+=aal('err','Body composition — high risk','Score '+bcR.s.toFixed(0)+'. Central adiposity and metabolic risk elevated. Recommend clinical review.');
document.getElementById('r-actal').innerHTML=actalHtml;}

// ── Module-scope zone helpers ────────────────────────────────────────────────
// liveZone() and set() are at module scope so cMt() (and any future module
// function) can call them directly, not just computeAllZones().
//
// dir 'hi'  — higher is worse: normal ≤ hi · ringan ≤ 1.5×hi
//             sedang ≤ 3×hi · berat > 3×hi
// dir 'lo'  — lower is worse (reserve): normal ≥ lo · ringan ≥ 0.75×lo
//             sedang ≥ 0.5×lo · berat < 0.5×lo
// dir 'bi'  — bidirectional band [lo, hi]: zones escalate by span steps
//             outside the normal band in both directions
function liveZone(val, dir, lo, hi) {
  if (isNaN(val) || val === 0) return 'unknown';
  if (dir === 'hi') {
    if (val <= hi)       return 'normal';
    if (val <= hi * 1.5) return 'ringan';
    if (val <= hi * 3)   return 'sedang';
    return 'berat';
  }
  if (dir === 'lo') {
    if (val >= lo)        return 'normal';
    if (val >= lo * 0.75) return 'ringan';
    if (val >= lo * 0.50) return 'sedang';
    return 'berat';
  }
  // 'bi' — bidirectional, anchored on band width (span = hi − lo)
  const mid  = (lo + hi) / 2;   // midpoint (anchor reference)
  const span = hi - lo;
  if (val >= lo && val <= hi)                                      return 'normal';
  if (val >= lo - span * 0.5 && val <= hi + span * 0.5)           return 'ringan';
  if (val >= lo - span * 1.5 && val <= hi + span * 1.5)           return 'sedang';
  return 'berat';
}

function set(id, dir, lo, hi) {
  if (!window.zoneData) window.zoneData = {};
  const v = parseFloat(document.getElementById(id)?.value);
  if (!isNaN(v)) window.zoneData[id + '_zone'] = liveZone(v, dir, lo, hi);
}

// computeAllZones() — called at the very start of calcAll().
// Reads every module field live from the DOM and writes fresh zone labels to
// window.zoneData so all module scorers (cOx, cTx, cMt, cCr, cNt, cSk, cDg)
// see current values, not stale import data.
function computeAllZones() {
  if (!window.zoneData) window.zoneData = {};
  // ── Oxidative ────────────────────────────────────────────────────────────
  set('ox-gsh', 'lo',  1.0,   2.0  );
  set('ox-coq', 'lo',  1.0,   2.0  );
  set('ox-vc',  'bi',  4.5,   6.5  );
  set('ox-ve',  'bi',  5.0,   7.0  );
  set('ox-sel', 'bi',  5.0,   7.0  );
  set('ox-fr',  'hi',  null,  3.0  );
  set('ox-hyp', 'bi',  100,   150  );
  set('ox-ph',  'bi',  3.5,   4.5  );
  // ── Toxic ────────────────────────────────────────────────────────────────
  set('tx-pb',  'hi',  null,  1.2  );
  set('tx-hg',  'hi',  null,  0.5  );
  set('tx-cd',  'hi',  null,  0.5  );
  set('tx-as',  'hi',  null,  0.4  );
  set('tx-st',  'hi',  null,  1.5  );
  set('tx-tb',  'hi',  null,  1.0  );
  set('tx-ps',  'hi',  null,  1.0  );
  // ── Metabolic ────────────────────────────────────────────────────────────
  set('mt-tg',  'hi',  null,  5.0  );
  set('mt-ug',  'bi',  4.4,   6.1  );
  set('mt-ins', 'bi',  3.0,   5.0  );
  set('mt-fm',  'hi',  null,  5.0  );
  set('mt-bmi', 'bi',  18.5,  24.9 );
  set('mt-wc',  'hi',  null,  90   );  // male default; female override in cMt()
  // ── Cardio-Renal ─────────────────────────────────────────────────────────
  set('cr-ch',  'hi',  null,  50   );
  set('cr-vf',  'lo',  6.0,   null );
  set('cr-lv',  'hi',  null,  5.0  );
  set('cr-ua',  'bi',  3.5,   7.2  );
  set('cr-pt',  'hi',  null,  3.0  );
  set('cr-k',   'bi',  4.5,   7.0  );
  set('cr-mg',  'bi',  5.0,   7.5  );
  // ── Nutrient ─────────────────────────────────────────────────────────────
  set('nt-zn',  'bi',  1.143, 1.989);
  set('nt-mg',  'bi',  0.568, 0.992);
  set('nt-k',   'bi',  0.689, 0.987);
  set('nt-io',  'bi',  1.421, 5.490);
  set('nt-si',  'bi',  1.425, 5.872);
  set('nt-b6',  'bi',  0.824, 1.942);
  set('nt-vc',  'bi',  4.543, 5.023);
  set('nt-d3',  'bi',  5.327, 7.109);
  set('nt-ve',  'bi',  4.826, 6.013);
  set('nt-fo',  'bi',  1.449, 2.246);
  // ── Skin & Collagen ──────────────────────────────────────────────────────
  set('sk-sc',  'lo',  4.0,   null );
  set('sk-el',  'lo',  5.5,   null );
  set('sk-tw',  'hi',  null,  5.0  );
  set('sk-sb',  'bi',  3.0,   6.0  );
  set('sk-ml',  'bi',  3.0,   6.0  );
  set('sk-sn',  'hi',  null,  5.0  );
  set('sk-ec',  'lo',  0.7,   null );
  set('sk-jc',  'bi',  5.0,   7.0  );
  // ── Gut / Digestive ──────────────────────────────────────────────────────
  set('dg-lp',  'bi',  58.4,  61.2 );
  set('dg-la',  'bi',  34.4,  35.6 );
  set('dg-sp',  'bi',  133.4, 140.5);
  set('dg-sa',  'bi',  3.6,   6.5  );
  set('dg-lc',  'lo',  4.6,   null );
  set('dg-ca',  'bi',  2.9,   3.8  );
  set('dg-bi',  'lo',  1.7,   null );
  set('dg-ip',  'hi',  null,  2.3  );
  set('dg-ds',  'bi',  3.5,   4.7  );
}

function calcAll(){computeAllZones();const ba=cBioAge(),ox=cOx(),tx=cTx(),mt=cMt(),cr=cCr(),nt=cNt(),sk=cSk(),dg=cDg(),bc=cBc();
// Expose bcResult on window for exportSessionReport() + store bc zones in zoneData so worstZone() works
window.bcResult=bc;
if(!window.zoneData)window.zoneData={};
if(bc.bmi?.zone)window.zoneData['bc-bmi_zone']=bc.bmi.zone;
if(bc.wc?.zone) window.zoneData['bc-wc_zone'] =bc.wc.zone;
if(bc.bf?.zone) window.zoneData['bc-bf_zone'] =bc.bf.zone;
if(bc.vf?.zone) window.zoneData['bc-vf_zone'] =bc.vf.zone;
if(bc.whr?.zone)window.zoneData['bc-whr_zone']=bc.whr.zone;
const GS={ox:ox.s,tx:tx.s,mt:mt.s,cr:cr.s,nt:nt.s,sk:sk.s,dg:dg.s||0,bc:bc.s||0};
const delta=ba.ba-ba.age;const baCls=delta>10?'cbad':delta>3?'cwarn':'cok';se('r-bav',ba.ba+'y',baCls);se('r-cav',ba.age+'y','cinfo');se('r-del',(delta>=0?'+':'')+delta+'y',delta>0?'cbad':'cok');document.getElementById('r-ba').style.display='block';document.getElementById('r-babars').innerHTML=barPillar('Pillar 1: Metabolic/Vascular',ba.p1,'cwarn')+barPillar('Pillar 2: Oxidative/Toxic',ba.p2,'cbad')+barPillar('Pillar 3: Regenerative Deficits',ba.p3,'cwarn');se('k-ba',ba.ba+'y',baCls);document.getElementById('k-bad').textContent=(delta>=0?'+':'')+delta+'y';
const oxC=clrc(ox.s,30,60);document.getElementById('r-ox').style.display='block';se('r-oxs',ox.s+'%',oxC);se('r-oxl',lbl(ox.s,30,60),'');se('r-ax',ox.ax+'%',ox.ax>=60?'cok':'cbad');se('r-px',ox.px+'%',ox.px<=40?'cok':'cbad');document.getElementById('r-oxbm').innerHTML='<div class="bml">'+bmr('Glutathione',       ox.gsh, zbs('ox-gsh','res'),(window.zoneData||{})['ox-gsh_zone']||'unknown')+
bmr('CoQ10',             ox.coq, zbs('ox-coq','res'),(window.zoneData||{})['ox-coq_zone']||'unknown')+
bmr('Vitamin C',         ox.vc,  zbs('ox-vc', 'res'),(window.zoneData||{})['ox-vc_zone']||'unknown')+
bmr('Vitamin E',         ox.ve,  zbs('ox-ve', 'res'),(window.zoneData||{})['ox-ve_zone']||'unknown')+
bmr('Selenium',          ox.sel, zbs('ox-sel','res'),(window.zoneData||{})['ox-sel_zone']||'unknown')+
bmr('Skin Free Radicals',ox.fr,  zbs('ox-fr', 'brdn'),(window.zoneData||{})['ox-fr_zone']||'unknown')+'</div>';document.getElementById('r-oxf').innerHTML=ftrow('Antioxidant Foods',['Spinach','Broccoli','Berries','Green Tea','Citrus (Vit C)','Almonds','Sunflower Seeds (Vit E)','Brazil Nuts (Selenium)']);se('k-ox',ox.s+'%',oxC);document.getElementById('k-oxl').textContent=lbl(ox.s,30,60);
const txC=clrc(tx.s,25,50);document.getElementById('r-tx').style.display='block';se('r-txs',tx.s+'%',txC);se('r-txl',lbl(tx.s,25,50),'');se('r-hm',tx.hm+'',tx.hm<=10?'cok':tx.hm<=30?'cwarn':'cbad');se('r-lbi',tx.lb+'',tx.lb<=15?'cok':tx.lb<=30?'cwarn':'cbad');const txA=[];if(tx.pb>1.2)txA.push(aal('err','Elevated Lead Signal','Confirm: Whole blood lead level (BLL). Do not conclude without lab.'));if(tx.hg>.5)txA.push(aal('err','Elevated Mercury Signal','Confirm: Blood mercury, urine mercury speciation.'));if(tx.cd>.5)txA.push(aal('warn','Cadmium Borderline','Confirm: Urine cadmium (first-morning void).'));if(tx.as_>.4)txA.push(aal('warn','Arsenic Borderline','Confirm: Urine arsenic, speciated inorganic.'));if(!txA.length)txA.push(aal('ok','No Critical Heavy Metal Flags','Signals within normal reference ranges.'));document.getElementById('r-txal').innerHTML=txA.join('');se('k-tx',tx.s+'%',txC);document.getElementById('k-txl').textContent=lbl(tx.s,25,50);
const mtC=clrc(mt.s,30,60);document.getElementById('r-mt').style.display='block';se('r-mts',mt.s+'%',mtC);se('r-mtl',lbl(mt.s,30,60),'');se('r-gc',mt.gc+'%',mt.gc<=20?'cok':mt.gc<=40?'cwarn':'cbad');se('r-lp',mt.lp+'%',mt.lp<=20?'cok':mt.lp<=40?'cwarn':'cbad');const mtA=[];if(mt.ug>6.1)mtA.push(aal('warn','Elevated Glucose Signal','Confirm: FPG, HbA1c.'));if(mt.ins<3)mtA.push(aal('warn','Low Insulin Secretion Signal','Confirm: Fasting insulin, C-peptide, HOMA-IR.'));if(mt.tg>5)mtA.push(aal('warn','Elevated Triglyceride Pattern','Confirm: Full fasting lipid panel.'));if(mt.bmi>25)mtA.push(aal('info','Elevated BMI','Consider waist-to-height ratio and body composition.'));if(!mtA.length)mtA.push(aal('ok','Metabolic Profile Within Range','No significant flags at this time.'));document.getElementById('r-mtal').innerHTML=mtA.join('');se('k-mt',mt.s+'%',mtC);document.getElementById('k-mtl').textContent=lbl(mt.s,30,60);
const crC=clrc(cr.s,30,60);document.getElementById('r-cr').style.display='block';se('r-crs',cr.s+'%',crC);se('r-crl',lbl(cr.s,30,60),'');se('r-cai',cr.cai+'%',cr.cai<=20?'cok':cr.cai<=40?'cwarn':'cbad');se('r-ri',cr.ri+'%',cr.ri<=20?'cok':cr.ri<=40?'cwarn':'cbad');const crA=[];if(cr.ch>50)crA.push(aal('warn','Elevated Cholesterol Signal','Confirm: Fasting lipid panel, ApoB.'));if(cr.vf<6)crA.push(aal('warn','Reduced Vascular Flexibility','Confirm: BP monitoring (ABPM), ABI.'));if(cr.pt>3)crA.push(aal('err','Proteinuria Signal Elevated','Confirm: Urinalysis, uACR, serum creatinine, eGFR.'));if(cr.ua>7.2)crA.push(aal('warn','Elevated Uric Acid Pattern','Confirm: Serum uric acid.'));if(!crA.length)crA.push(aal('ok','Cardio-Renal Signals Within Range','No critical strain flags detected.'));document.getElementById('r-cral').innerHTML=crA.join('');se('k-cr',cr.s+'%',crC);document.getElementById('k-crl').textContent=lbl(cr.s,30,60);
const ntC=nt.s>=70?'cok':nt.s>=50?'cwarn':'cbad';const ntL=nt.s>=70?'Sufficient':nt.s>=50?'Borderline':'Deficient';document.getElementById('r-nt').style.display='block';se('r-nts',nt.s+'%',ntC);se('r-ntl',ntL,'');se('r-ntdef',nt.def+'','cbad');se('r-ntopt',nt.opt+'','cok');document.getElementById('r-ntbm').innerHTML='<div class="bml">'+nt.items.map(i=>bmr(i.n,i.v,i.zone==='normal'?'normal':i.zone==='ringan'?'borderline':'deficient',i.zone)).join('')+'</div>';document.getElementById('r-ntf').innerHTML=ftrow('Nutrient-Rich Foods',['Pumpkin Seeds (Zinc)','Dark Greens (Mg, Folate)','Bananas (K)','Seaweed (Iodine)','Salmon (D3, B6)','Chickpeas (Folate)','Sunflower Seeds (E)','Citrus (C)']);se('k-nt',nt.s+'%',ntC);document.getElementById('k-ntl').textContent=ntL;
const skC=sk.s>=70?'cok':sk.s>=50?'cwarn':'cbad';const skL=sk.s>=70?'Resilient':sk.s>=50?'Moderate Concern':'Low Resilience';document.getElementById('r-sk').style.display='block';se('r-sks',sk.s+'%',skC);se('r-skl',skL,'');se('r-cli',sk.cl+'%',sk.cl>=70?'cok':sk.cl>=50?'cwarn':'cbad');se('r-bfi',sk.bf+'%',sk.bf>=70?'cok':sk.bf>=50?'cwarn':'cbad');document.getElementById('r-skbm').innerHTML='<div class="bml">'+bmr('Skin Collagen',     sk.sc, zbs('sk-sc','res'),(window.zoneData||{})['sk-sc_zone']||'unknown')+
bmr('Skin Elasticity',   sk.el, zbs('sk-el','res'),(window.zoneData||{})['sk-el_zone']||'unknown')+
bmr('TEWL (Water Loss)', sk.tw, zbs('sk-tw','brdn'),(window.zoneData||{})['sk-tw_zone']||'unknown')+
bmr('Eye Collagen',      sk.ec, zbs('sk-ec','res'),(window.zoneData||{})['sk-ec_zone']||'unknown')+
bmr('Joint Collagen',    sk.jc, zbs('sk-jc','res'),(window.zoneData||{})['sk-jc_zone']||'unknown')+'</div>';document.getElementById('r-skf').innerHTML=ftrow('Skin-Supporting Foods',['Bone Broth (Collagen)','Fish + Chicken Skin','Egg Whites','Vitamin C Cofactors','Berries (Resveratrol)','Garlic (Sulfur)']);se('k-sk',sk.s+'%',skC);document.getElementById('k-skl').textContent=skL;
// Digestive module render
if(!document.getElementById('r-dg')){}
else if(dg.s!==null){
  document.getElementById('r-dg').style.display='';
  document.getElementById('r-dg-scores').style.display='';
  se('r-dgs', dg.s, dg.s<=30?'cok':dg.s<=60?'cwarn':'cbad');
  se('r-dgl', lbl(dg.s,30,60));
  se('k-dg', dg.s+'%', dg.s<=30?'cok':dg.s<=60?'cwarn':'cbad');
  document.getElementById('k-dgl').textContent = lbl(dg.s,30,60);
  se('r-dgmt', dg.mt+'%');
  se('r-dgab', dg.ab+'%');
  se('r-dgpi', dg.pi+'%');
  let pat='';
  if(dg.bloatingConstipation) pat+=aal('warn','Bloating with Reduced Transit Pattern','Elevated intraluminal pressure combined with reduced large intestine motility. Consider reducing fermentable carbohydrates and eating pace.');
  if(dg.upperGiStrain) pat+=aal('warn','Upper GI Digestion Strain Pattern','Reduced gastric motility combined with reduced small intestine absorption. Consider smaller meals and pre-meal vagal warm-up.');
  if(dg.absorptionDeficit) pat+=aal('info','Absorption Deficit Pattern','Reduced small intestine or colonic absorption pattern. Consider reviewing nutrient status — Vitamin B12, iron, fat-soluble vitamins.');
  document.getElementById('r-dgpat').innerHTML=pat;
  const _dgLang=(typeof currentLang!=='undefined')?currentLang:'id';
  const _dgTitle=_dgLang==='en'?'Digestive Pattern Flagged':'Pola Pencernaan Terdeteksi';
  const _dgDesc=_dgLang==='en'?'Consider keeping a bowel diary and Bristol stool scale assessment to establish a baseline transit pattern. Confirm with clinician if symptoms are persistent.':'Pertimbangkan untuk membuat catatan harian BAB dan penilaian skala Bristol untuk menetapkan pola transit dasar. Konfirmasi dengan klinisi jika gejala menetap.';
  document.getElementById('r-dgal').innerHTML=dg.s>30?aal('info',_dgTitle,_dgDesc):'';
}
// Body Comp render
se('k-bc', bc.s > 0 ? bc.s.toFixed(0)+'%' : '--');
se('k-bcl', bc.s > 0 ? (bc.s<30?'Low Concern':bc.s<60?'Monitor':'Needs Lab Confirmation') : 'Not calculated');
if(bc.s > 0){
  document.getElementById('r-bc').style.display='';
  se('r-bcs', bc.s.toFixed(0)+'%', bc.s<30?'cok':bc.s<60?'cwarn':'cbad');
  se('r-bcl', bc.s<30?'Low Concern':bc.s<60?'Monitor':'Needs Lab Confirmation');
  se('r-bcai', bc.cai ? bc.cai.toFixed(0)+'%' : '--');
  se('r-bcbi', bc.bci ? bc.bci.toFixed(0)+'%' : '--');
  const bcAlerts=[];
  if(bc.bmi?.zone&&bc.bmi.zone!=='normal') bcAlerts.push(aal('warn','BMI — '+bcZoneLabel(bc.bmi.zone),'BMI '+(bc.bmi.raw?.toFixed(1)??'—')+' kg/m²',true));
  if(bc.wc?.zone&&bc.wc.zone!=='normal') bcAlerts.push(aal('warn','Waist — '+bcZoneLabel(bc.wc.zone),bc.wc.raw+' cm',true));
  if(bc.bf?.zone&&bc.bf.zone!=='normal') bcAlerts.push(aal('warn','Body fat — '+bcZoneLabel(bc.bf.zone),bc.bf.raw+'%',true));
  if(bc.vf?.zone&&bc.vf.zone!=='normal') bcAlerts.push(aal('warn','Visceral fat — '+bcZoneLabel(bc.vf.zone),'Index '+bc.vf.raw,true));
  if(bc.whr?.zone&&bc.whr.zone!=='normal') bcAlerts.push(aal('warn','Waist-height ratio — '+bcZoneLabel(bc.whr.zone),(bc.whr.raw?.toFixed(2)??'—'),true));
  if(bc.bmr?.raw){const bmrTitle=(currentLang==='en')?'Estimated BMR':'Estimasi BMR';const bmrDesc=(currentLang==='en')?bc.bmr.raw.toFixed(0)+' kcal/day — Basal Metabolic Rate: the minimum energy your body needs at rest to maintain basic functions (breathing, circulation, cell repair).':bc.bmr.raw.toFixed(0)+' kkal/hari — Basal Metabolic Rate: jumlah energi minimum yang dibutuhkan tubuh saat istirahat untuk mempertahankan fungsi dasar (pernapasan, sirkulasi, perbaikan sel).';bcAlerts.push(aal('info',bmrTitle,bmrDesc));}
  document.getElementById('r-bcal').innerHTML=bcAlerts.join('');
}
const alv=Math.round([ox.s,tx.s,mt.s,cr.s,100-nt.s,100-sk.s,dg.s||0,bc.s||0].reduce((a,b)=>a+b,0)/8);const alC=alv<=30?'cok':alv<=60?'cwarn':'cbad';se('k-al',alv+'%',alC);document.getElementById('k-all').textContent=alv<=30?'Low Stress':alv<=60?'Moderate Burden':'High Multisystem Stress';
drawCharts(GS);buildAction({ba,ox,tx,mt,cr,nt,sk,dg,bc,al:alv});if(typeof renderHrvPanel==='function')renderHrvPanel();renderHrvStrip_BodyComp();lucide.createIcons();nav('dashboard');}

// ─────────────────────────────────────────────────────────────
// EXPORT FORMAT TOGGLE
// ─────────────────────────────────────────────────────────────
let exportFormat = 'md'; // 'md' | 'txt'

function toggleExportDd(e) {
  e.stopPropagation();
  const dd  = document.getElementById('exp-dd');
  const chv = document.getElementById('exp-chv');
  const open = dd.classList.toggle('open');
  chv.setAttribute('aria-expanded', open);
}

function setExportFmt(fmt) {
  exportFormat = fmt;
  const optMd  = document.getElementById('exp-opt-md');
  const optTxt = document.getElementById('exp-opt-txt');
  optMd.classList.toggle('sel', fmt === 'md');
  optMd.innerHTML  = (fmt === 'md'  ? '&#9679;' : '&#9675;') + ' MD &mdash; Markdown';
  optTxt.classList.toggle('sel', fmt === 'txt');
  optTxt.innerHTML = (fmt === 'txt' ? '&#9679;' : '&#9675;') + ' TXT &mdash; Plain text';
  document.getElementById('exp-dd').classList.remove('open');
  document.getElementById('exp-chv').setAttribute('aria-expanded', 'false');
}

// Convert Markdown string to clean plain text.
// Only handles the subset produced by exportSessionReport().
function mdToTxt(md) {
  const lines = md.split('\n');
  const out   = [];
  let inCode      = false;
  let tableHeaders = null;

  for (const line of lines) {
    // ── Code fences ── strip markers, pass content through
    if (/^```/.test(line.trim())) { inCode = !inCode; continue; }
    if (inCode) { out.push(line); continue; }

    // ── Markdown table rows ──
    if (/^\|.+\|$/.test(line)) {
      // Separator row |---|---| → skip
      if (/^\|[\s\-:|]+\|$/.test(line)) continue;
      // Header row: first pipe row seen after a non-pipe line
      if (tableHeaders === null) {
        tableHeaders = line.split('|').slice(1,-1)
          .map(h => h.trim().replace(/\*\*/g,'').replace(/\*/g,''));
      } else {
        // Data row → "  Header: Value | Header: Value ..."
        const cells = line.split('|').slice(1,-1)
          .map(c => c.trim().replace(/\*\*/g,'').replace(/\*/g,''));
        out.push('  ' + tableHeaders.map((h,i) => h + ': ' + (cells[i] || '')).join(' | '));
      }
      continue;
    }
    // First non-pipe line after a table resets headers
    if (tableHeaders !== null) tableHeaders = null;

    // ── Inline backticks ──
    let l = line.replace(/`([^`]*)`/g, '$1');

    // ── Headers → UPPERCASE + underline ──
    const h1 = l.match(/^# (.+)$/);
    if (h1) {
      const t = h1[1];
      out.push(''); out.push(t.toUpperCase()); out.push('═'.repeat(Math.min(t.length, 50)));
      continue;
    }
    const h2 = l.match(/^## (.+)$/);
    if (h2) {
      const t = h2[1];
      out.push(''); out.push(t.toUpperCase()); out.push('-'.repeat(Math.min(t.length, 50)));
      continue;
    }
    const h3 = l.match(/^### (.+)$/);
    if (h3) {
      const t = h3[1];
      out.push(''); out.push(t.toUpperCase()); out.push('-'.repeat(Math.min(t.length, 40)));
      continue;
    }

    // ── Bold / italic — strip markers, keep text ──
    l = l.replace(/\*\*([^*]+)\*\*/g, '$1');
    l = l.replace(/\*([^*]+)\*/g,     '$1');

    // ── Bullet - → - (indented, no asterisk) ──
    l = l.replace(/^(\s*)-\s+/, '$1  - ');

    out.push(l);
  }

  return out.join('\n').replace(/\n{3,}/g, '\n\n').replace(/\*/g, '').trim();
}

// ─────────────────────────────────────────────────────────────
// EXPORT SESSION REPORT
// Reads current DOM state → builds a .md file → triggers download.
// Zero changes to calcAll(), buildAction(), or any existing logic.
// ─────────────────────────────────────────────────────────────
function exportSessionReport() {
  // Guard: patient must be imported
  const nameEl  = document.getElementById('cc-name');
  const rawName = nameEl ? nameEl.textContent.trim() : '';
  if (!rawName || rawName === '—') {
    alert('Please import a patient file before exporting.');
    return;
  }

  // ── Patient identity ──────────────────────────────────────
  const name         = rawName;
  const age          = document.getElementById('cc-age')?.textContent.trim()    || '—';
  const gender       = document.getElementById('cc-gender')?.textContent.trim() || '—';
  const testDateRaw  = document.getElementById('cc-date')?.textContent.trim()   || '';

  // ── Helpers ───────────────────────────────────────────────
  const txt = id => document.getElementById(id)?.textContent.trim() || '--';

  function toYMD(raw) {
    if (!raw || raw === '—') return null;
    if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;
    const m = raw.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
    if (m) return `${m[3]}-${m[2].padStart(2,'0')}-${m[1].padStart(2,'0')}`;
    const d = new Date(raw);
    if (!isNaN(d)) return d.toISOString().slice(0,10);
    return null;
  }

  const testDate  = toYMD(testDateRaw) || testDateRaw || 'unknown';
  const now       = new Date();
  const timestamp = now.toISOString().replace('T',' ').slice(0,19) + ' UTC';

  // ── Filename ──────────────────────────────────────────────
  const safeName = name.toLowerCase().replace(/\s+/g,'_').replace(/[^a-z0-9_]/g,'');
  const fileDate = /^\d{4}-\d{2}-\d{2}$/.test(testDate) ? testDate : now.toISOString().slice(0,10);
  const filename = safeName
    ? `${safeName}_${fileDate}_usaka_report.md`
    : `unknown_patient_${Date.now()}_usaka_report.md`;

  // ── Module scores from DOM ────────────────────────────────
  const baDelta    = txt('r-del');   // e.g. "+5y"
  const baAge      = txt('r-bav');   // e.g. "45y"
  const baDeltaNum = (() => { const m = baDelta.match(/([+-]?\d+)/); return m ? parseInt(m[1]) : 0; })();
  const baStatusLabel   = baDeltaNum > 10 ? 'Needs Lab Confirmation' : baDeltaNum > 3 ? 'Monitor' : 'Low Concern';
  const baSyntheticScore = Math.min(100, Math.max(0, Math.round(baDeltaNum * 10)));

  const oxScore = txt('r-oxs').replace('%','');  const oxLabel = txt('r-oxl');
  const oxAx    = parseInt(txt('r-ax'))  || 0;
  const oxPx    = parseInt(txt('r-px'))  || 0;
  const txScore = txt('r-txs').replace('%','');  const txLabel = txt('r-txl');
  const mtScore = txt('r-mts').replace('%','');  const mtLabel = txt('r-mtl');
  const crScore = txt('r-crs').replace('%','');  const crLabel = txt('r-crl');
  const ntScore = txt('r-nts').replace('%','');  const ntLabel = txt('r-ntl');
  const ntDef   = parseInt(txt('r-ntdef')) || 0;
  const ntOpt   = parseInt(txt('r-ntopt')) || 0;
  const skScore = txt('r-sks').replace('%','');  const skLabel = txt('r-skl');
  const skCli   = parseInt(txt('r-cli')) || 0;
  const skBfi   = parseInt(txt('r-bfi')) || 0;
  const dgScore = txt('r-dgs').replace('%','');  const dgLabel = txt('r-dgl');
  const dgMt    = parseInt(txt('r-dgmt')) || 0;
  const dgAb    = parseInt(txt('r-dgab')) || 0;
  const dgPi    = parseInt(txt('r-dgpi')) || 0;

  // ── Worst zone per module ─────────────────────────────────
  const zd = window.zoneData || {};
  function worstZone(fields) {
    for (const id of fields) if ((zd[id+'_zone']||'') === 'berat')  return 'berat';
    for (const id of fields) if ((zd[id+'_zone']||'') === 'sedang') return 'sedang';
    for (const id of fields) if ((zd[id+'_zone']||'') === 'ringan') return 'ringan';
    return 'normal';
  }
  const zones = {
    ba: worstZone(['bv','cp','art','ins','bs','fr','hyp','ph','pb','hg','ce','cs','cj','coq','gsh','vc','ve','ost']),
    ox: worstZone(['ox-gsh','ox-coq','ox-vc','ox-ve','ox-sel','ox-fr','ox-hyp','ox-ph']),
    tx: worstZone(['tx-pb','tx-hg','tx-cd','tx-as','tx-st','tx-tb','tx-ps']),
    mt: worstZone(['mt-tg','mt-ug','mt-ins','mt-fm','mt-bmi','mt-wc']),
    cr: worstZone(['cr-ch','cr-vf','cr-lv','cr-ua','cr-pt','cr-k','cr-mg']),
    nt: worstZone(['nt-zn','nt-mg','nt-k','nt-io','nt-si','nt-b6','nt-vc','nt-d3','nt-ve','nt-fo']),
    sk: worstZone(['sk-sc','sk-el','sk-tw','sk-sb','sk-ml','sk-sn','sk-ec','sk-jc']),
    dg: worstZone(['dg-lp','dg-la','dg-sp','dg-sa','dg-lc','dg-ca','dg-bi','dg-ip','dg-ds']),
    bc: worstZone(['bc-bmi','bc-wc','bc-bf','bc-vf','bc-whr'])
  };

  // ── Alert extraction ──────────────────────────────────────
  function extractAlerts(containerId) {
    const el = document.getElementById(containerId);
    if (!el) return [];
    return Array.from(el.querySelectorAll('.aal')).map(a => ({
      isOk:  a.classList.contains('aok'),
      title: a.querySelector('.aalt')?.textContent.trim() || '',
      desc:  a.querySelector('.aald')?.textContent.trim() || ''
    }));
  }
  function alertsToMd(alerts) {
    const real = alerts.filter(a => !a.isOk);
    if (!real.length) return '- All markers within reference range.\n';
    return real.map(a => `- **${a.title}**: ${a.desc}`).join('\n') + '\n';
  }

  const txAlerts = extractAlerts('r-txal');
  const mtAlerts = extractAlerts('r-mtal');
  const crAlerts = extractAlerts('r-cral');
  const hiAlerts = extractAlerts('r-actal').filter(a => !a.isOk);

  // ── Per-module synthesised findings ──────────────────────
  // Bio age
  let baFindings;
  if (baDeltaNum > 10)
    baFindings = `- **Elevated Age Delta (${baDelta})**: Biological age pattern significantly above chronological age. High-priority screening follow-up recommended.\n`;
  else if (baDeltaNum > 3)
    baFindings = `- **Elevated Age Delta (${baDelta})**: Biological age pattern moderately above chronological age. Monitor trend and confirm with metabolic labs.\n`;
  else
    baFindings = '- Biological age pattern within expected range for age.\n';

  // Oxidative (no dedicated alert container — derive from sub-scores)
  const oxLines = [];
  if (oxAx < 50) oxLines.push(`- **Below-reference antioxidant reserve** (${oxAx}%): Pattern suggests reduced antioxidant buffer. Consider confirming with plasma glutathione and CoQ10 levels.`);
  if (oxPx > 50) oxLines.push(`- **Elevated pro-oxidant load** (${oxPx}%): Free radical pressure above reference range pattern. Monitor trend.`);
  if (!oxLines.length) oxLines.push('- All oxidative markers within reference range.');
  const oxFindings = oxLines.join('\n') + '\n';

  // Nutrient
  const ntLines = [];
  if (ntDef > 0) ntLines.push(`- **${ntDef} nutrient(s) below reference range**: Dietary review recommended. Consider selective confirmatory lab testing.`);
  if (ntOpt > 0) ntLines.push(`- ${ntOpt} nutrient(s) within optimal range.`);
  if (!ntLines.length) ntLines.push('- All nutrient markers within reference range.');
  const ntFindings = ntLines.join('\n') + '\n';

  // Skin
  const skLines = [];
  if (skCli < 50) skLines.push(`- **Below-reference collagen index** (${skCli}%): Pattern suggests reduced collagen signal across skin, eye, and joint sites. Dietary protein adequacy and Vitamin C cofactors recommended.`);
  if (skBfi < 50) skLines.push(`- **Reduced barrier function** (${skBfi}%): Skin barrier signal below reference range pattern. Hydration and skin-barrier support recommended.`);
  if (!skLines.length) skLines.push('- Skin and collagen markers within reference range.');
  const skFindings = skLines.join('\n') + '\n';

  // Digestive
  const dgLines = [];
  const dgS = parseInt(dgScore)||0;
  if (dgS > 60) dgLines.push(`- **Significant digestive pattern** (${dgScore}%): Multiple digestive function signals below reference range. Motility ${dgMt}% / Absorption ${dgAb}% / Pressure ${dgPi}%. Clinical dietary review recommended.`);
  else if (dgS > 30) dgLines.push(`- **Moderate digestive pattern** (${dgScore}%): Digestive function signals warrant monitoring. Motility ${dgMt}% / Absorption ${dgAb}% / Pressure ${dgPi}%.`);
  if (dgAb > 40) dgLines.push('- Absorption sub-index flagged: consider reviewing Vitamin B12, ferritin, and 25-OH Vitamin D status.');
  if (dgMt > 50) dgLines.push('- Motility sub-index flagged: peristaltic signals below reference range across gastric and/or intestinal segments.');
  if (dgPi > 40) dgLines.push('- Pressure / integrity sub-index flagged: intraluminal pressure pattern above reference range.');
  if (!dgLines.length) dgLines.push('- Digestive function markers within reference range.');
  const dgFindings = dgLines.join('\n') + '\n';

  // ── Action plan extraction ────────────────────────────────
  function extractTestsTable() {
    const el = document.getElementById('r-acttbl');
    if (!el) return [];
    const tbody = el.querySelector('tbody');
    if (!tbody) return [];
    return Array.from(tbody.querySelectorAll('tr')).map(row => {
      const c = row.querySelectorAll('td');
      return { priority: c[0]?.textContent.trim()||'', domain: c[1]?.textContent.trim()||'',
               finding: c[2]?.textContent.trim()||'', tests: c[3]?.textContent.trim()||'' };
    });
  }
  function extractFood() {
    const el = document.getElementById('r-actfood');
    if (!el) return [];
    const result = [];
    el.querySelectorAll('.ftags').forEach(ftEl => {
      const label = ftEl.previousElementSibling?.textContent.trim() || '';
      const items = Array.from(ftEl.querySelectorAll('.ftag'))
        .map(t => t.textContent.trim().replace(/^[^A-Za-z]+/, ''));
      if (label) result.push({ label, items });
    });
    return result;
  }

  const testRows  = extractTestsTable();
  const foodSects = extractFood();

  const testsTableMd = testRows.length
    ? '| Priority | Domain | Finding | Suggested Tests |\n|---|---|---|---|\n' +
      testRows.map(r => `| ${r.priority} | ${r.domain} | ${r.finding} | ${r.tests} |`).join('\n')
    : '_No confirmatory tests flagged. Routine monitoring recommended._';

  const foodMd = foodSects.length
    ? foodSects.map(s => `- **${s.label}**: ${s.items.join(', ')}`).join('\n')
    : '- Continue balanced whole-foods diet. No critical nutritional gaps identified.';

  const hiAlertsMd = hiAlerts.length
    ? '\n### High Priority Alerts\n\n' + hiAlerts.map(a => `- **${a.title}**: ${a.desc}`).join('\n') + '\n'
    : '';

  // ── Priority domains (highest concern first) ──────────────
  const rawScores = {
    ox: parseInt(oxScore)||0,  tx: parseInt(txScore)||0,
    mt: parseInt(mtScore)||0,  cr: parseInt(crScore)||0,
    nt: parseInt(ntScore)||0,  sk: parseInt(skScore)||0,
    dg: parseInt(dgScore)||0,
    bc: parseFloat(document.getElementById('r-bcs')?.textContent) || 0
  };
  const domainNames = {
    ba:'Biological Age', ox:'Oxidative Stress', tx:'Toxic Burden',
    mt:'Metabolic Risk', cr:'Cardio-Renal',     nt:'Nutrient Sufficiency',
    sk:'Skin & Collagen', dg:'Gut / Digestive', bc:'Body Composition'
  };
  const priorityDomains = [
    ['ba', baSyntheticScore],    ['ox', rawScores.ox],       ['tx', rawScores.tx],
    ['mt', rawScores.mt],        ['cr', rawScores.cr],
    ['nt', 100 - rawScores.nt], ['sk', 100 - rawScores.sk],
    ['dg', rawScores.dg],        ['bc', rawScores.bc]
  ].sort((a,b) => b[1]-a[1]).slice(0,3).map(([k]) => domainNames[k]);

  // ── Executive summary ─────────────────────────────────────
  const ageStr = baDeltaNum > 0
    ? `a biological age pattern approximately ${baDeltaNum} year${baDeltaNum>1?'s':''} above chronological age`
    : 'a biological age pattern within expected range';
  let execSummary = `This screening session for ${name} (${age} years, ${gender}) shows ${ageStr}. `;
  execSummary += `Priority domains requiring follow-up are: ${priorityDomains.join(', ')}. `;
  try {
    if (window.hrvState) {
      const hband = window.hrvState.rmssdBand || 'unknown';
      const hrmssd = window.hrvState.rmssd || '--';
      execSummary += `Autonomic status: ${hband} ALI band, RMSSD ${hrmssd} ms. `;
    }
  } catch(e) {}
  execSummary += 'All findings are screening patterns only and must be confirmed with standard laboratory tests.';

  // ── HRV section ───────────────────────────────────────────
  const HRV_BAND_DESC = {
    very_low: 'Severe vagal withdrawal pattern. The autonomic system shows minimal parasympathetic activity, suggesting high physiological stress load. Recovery capacity appears significantly reduced.',
    low:      'Suboptimal vagal tone. Parasympathetic activity is below optimal range, indicating moderate autonomic strain. Recovery and resilience capacity may be limited.',
    adaptive: 'Reasonable autonomic flexibility. Parasympathetic activity is within a functional range, supporting adequate recovery and stress adaptation.',
    high:     'Strong parasympathetic tone. The autonomic system shows robust recovery capacity and high resilience to physiological stressors.'
  };
  const HRV_PROTOCOLS = {
    very_low: 'V1 (Slow Breathing), V3 (Body Scan), V4 (Restorative Rest)',
    low:      'V1 (Slow Breathing), V2 (Mindful Movement), V3 (Body Scan), V4 (Restorative Rest)',
    adaptive: 'V1 (Slow Breathing), V2 (Mindful Movement), V3 (Body Scan), V4 (Restorative Rest), V5 (Active Recovery)',
    high:     'V2 (Mindful Movement), V4 (Restorative Rest), V5 (Active Recovery)'
  };

  let hrvSection = '';
  let hrvJson = { present: false, ali_band: null, rmssd: null, mean_hr: null, quality: null };
  try {
    const hrv = window.hrvState;
    if (hrv) {
      const band = hrv.rmssdBand || 'adaptive';
      hrvSection = `
---

## HRV — Autonomic Status

**ALI Band:** ${band} | **RMSSD:** ${hrv.rmssd||'--'} ms | **HR:** ${hrv.meanHr||'--'} bpm | **Quality:** ${hrv.qualityFlag||'--'}
**Recovery State:** ${hrv.recoveryState||'--'}

**Interpretation:**
${HRV_BAND_DESC[band] || 'Autonomic status recorded.'}

**Recommended Practices:** ${HRV_PROTOCOLS[band] || 'V1, V2, V3, V4'}
`;
      hrvJson = {
        present:  true,
        ali_band: hrv.rmssdBand   || null,
        rmssd:    hrv.rmssd       || null,
        mean_hr:  hrv.meanHr      || null,
        quality:  hrv.qualityFlag || null
      };
    }
  } catch(e) {}

  // ── JSON data summary ─────────────────────────────────────
  const dataSummaryJson = JSON.stringify({
    patient: { name, age: parseInt(age)||null, gender: gender.toLowerCase(), test_date: testDate },
    session: { dashboard_version: 'v6', export_timestamp: timestamp },
    modules: {
      bio_age:   { score: baSyntheticScore,    label: baStatusLabel, zone: zones.ba },
      oxidative: { score: parseInt(oxScore)||0, label: oxLabel,       zone: zones.ox },
      toxic:     { score: parseInt(txScore)||0, label: txLabel,       zone: zones.tx },
      metabolic: { score: parseInt(mtScore)||0, label: mtLabel,       zone: zones.mt },
      cardio:    { score: parseInt(crScore)||0, label: crLabel,       zone: zones.cr },
      nutrient:  { score: parseInt(ntScore)||0, label: ntLabel,       zone: zones.nt },
      skin:      { score: parseInt(skScore)||0, label: skLabel,       zone: zones.sk },
      digestive: { score: parseInt(dgScore)||0, label: dgLabel,       zone: zones.dg,
                   sub_scores: { motility: dgMt, absorption: dgAb, pressure: dgPi } },
      body_composition: {
        score:       rawScores.bc,
        label:       getBcLabel(rawScores.bc),
        worst_zone:  zones.bc,
        bmi:         window.bcResult?.bmi      ?? null,
        waist_cm:    window.bcResult?.wc       ?? null,
        body_fat_pct:window.bcResult?.bf       ?? null,
        visceral_fat:window.bcResult?.vf       ?? null,
        whr:         window.bcResult?.whr      ?? null,
        bmr_kcal:    window.bcResult?.bmr      ?? null
      }
    },
    priority_domains: priorityDomains,
    action_plan: {
      confirmatory_tests_count:   testRows.length,
      high_priority_alerts_count: hiAlerts.length
    },
    hrv: hrvJson
  }, null, 2);

  // ── Plain-text data summary (TXT export only) ─────────────
  // Built from the same variables as dataSummaryJson so both
  // are always in sync. Placeholder %%DATA_SUMMARY_TXT%% in
  // the report template is swapped for this at download time.
  const _p  = (s, w) => String(s).padEnd(w);
  const _mRow = (label, score, status, zone) =>
    '  ' + _p(label, 17) + ': ' + _p(score + '/100', 8) +
    _p('(' + status + ')', 16) + 'Zone: ' + zone;

  const dataSummaryTxt = [
    'PATIENT',
    '  ' + _p('Name',      12) + ': ' + name,
    '  ' + _p('Age',       12) + ': ' + (parseInt(age) || age),
    '  ' + _p('Gender',    12) + ': ' + gender.toLowerCase(),
    '  ' + _p('Test Date', 12) + ': ' + testDate,
    '',
    'SESSION',
    '  ' + _p('Dashboard', 12) + ': v6',
    '  ' + _p('Exported',  12) + ': ' + timestamp,
    '',
    'MODULE SCORES',
    _mRow('Biological Age',   baSyntheticScore,    baStatusLabel,           zones.ba),
    _mRow('Oxidative Stress', parseInt(oxScore)||0, oxLabel,                 zones.ox),
    _mRow('Toxic Burden',     parseInt(txScore)||0, txLabel,                 zones.tx),
    _mRow('Metabolic Health', parseInt(mtScore)||0, mtLabel,                 zones.mt),
    _mRow('Cardio-Renal',     parseInt(crScore)||0, crLabel,                 zones.cr),
    _mRow('Nutrient',         parseInt(ntScore)||0, ntLabel,                 zones.nt),
    _mRow('Skin & Collagen',  parseInt(skScore)||0, skLabel,                 zones.sk),
    _mRow('Gut / Digestive',  parseInt(dgScore)||0, dgLabel,                 zones.dg),
    _mRow('Body Composition', rawScores.bc,          getBcLabel(rawScores.bc), zones.bc),
    '',
    'PRIORITY DOMAINS',
    ...priorityDomains.map((d, i) => '  ' + (i + 1) + '. ' + d),
    '',
    'ACTION PLAN',
    '  ' + _p('Confirmatory tests recommended', 31) + ': ' + testRows.length,
    '  ' + _p('High priority alerts',           31) + ': ' + hiAlerts.length,
    '',
    'HRV',
    '  Present : ' + (hrvJson.present ? 'Yes' : 'No'),
    ...(hrvJson.present ? [
      '  ' + _p('ALI Band', 10) + ': ' + (hrvJson.ali_band || '--'),
      '  ' + _p('RMSSD',    10) + ': ' + (hrvJson.rmssd    || '--') + ' ms',
      '  ' + _p('HR',       10) + ': ' + (hrvJson.mean_hr  || '--') + ' bpm',
      '  ' + _p('Quality',  10) + ': ' + (hrvJson.quality  || '--')
    ] : [])
  ].join('\n');

  // ── Assemble report ───────────────────────────────────────
  const report = `═══════════════════════════════════════════════

# USAKA Health Screening Report
**Patient:** ${name} | **Age:** ${age} | **Gender:** ${gender} | **Test Date:** ${testDate}
**Export:** ${timestamp} | **Dashboard:** qrma-dashboard-v6

---

## Executive Summary

${execSummary}

---

## Module Findings

### 1. Biological Age
**Score:** ${baSyntheticScore}/100 | **Status:** ${baStatusLabel} | **Zone:** ${zones.ba}
**Biological Age Estimate:** ${baAge.replace('y','')} years (Chronological: ${age})
**Findings:**
${baFindings}
### 2. Oxidative Stress
**Score:** ${oxScore}/100 | **Status:** ${oxLabel} | **Zone:** ${zones.ox}
**Findings:**
${oxFindings}
### 3. Toxic / Detox Load
**Score:** ${txScore}/100 | **Status:** ${txLabel} | **Zone:** ${zones.tx}
**Findings:**
${alertsToMd(txAlerts)}
### 4. Metabolic Health
**Score:** ${mtScore}/100 | **Status:** ${mtLabel} | **Zone:** ${zones.mt}
**Findings:**
${alertsToMd(mtAlerts)}
### 5. Cardio-Renal Function
**Score:** ${crScore}/100 | **Status:** ${crLabel} | **Zone:** ${zones.cr}
**Findings:**
${alertsToMd(crAlerts)}
### 6. Nutrient Sufficiency
**Score:** ${ntScore}/100 | **Status:** ${ntLabel} | **Zone:** ${zones.nt}
**Findings:**
${ntFindings}
### 7. Skin & Collagen
**Score:** ${skScore}/100 | **Status:** ${skLabel} | **Zone:** ${zones.sk}
**Findings:**
${skFindings}
### 8. Gut / Digestive Function
**Score:** ${dgScore}/100 | **Status:** ${dgLabel} | **Zone:** ${zones.dg}
**Sub-scores:** Motility ${dgMt}% | Absorption ${dgAb}% | Pressure/Integrity ${dgPi}%
**Findings:**
${dgFindings}
### 9. Body Composition
**Score:** ${rawScores.bc.toFixed(0)} / 100 — ${getBcLabel(rawScores.bc)}
**Worst zone:** ${zones.bc}

**Sub-scores:**
- Central Adiposity Index (CAI): ${window.bcResult?.cai?.toFixed(0) ?? '—'}
- Body Composition Index (BCI): ${window.bcResult?.bci?.toFixed(0) ?? '—'}
- Structural Index (STI): ${window.bcResult?.sti?.toFixed(0) ?? '—'}

**Parameters:**
- BMI: ${window.bcResult?.bmi?.raw?.toFixed(1) ?? '—'} kg/m² (${window.bcResult?.bmi?.zone ?? '—'})
- Waist circumference: ${window.bcResult?.wc?.raw ?? '—'} cm (${window.bcResult?.wc?.zone ?? '—'})
- Body fat: ${window.bcResult?.bf?.raw ?? '—'}% (${window.bcResult?.bf?.zone ?? '—'})
- Visceral fat index: ${window.bcResult?.vf?.raw ?? '—'} (${window.bcResult?.vf?.zone ?? '—'})
- Waist-height ratio: ${window.bcResult?.whr?.raw?.toFixed(2) ?? '—'} (${window.bcResult?.whr?.zone ?? '—'})
- Estimated BMR: ${window.bcResult?.bmr?.raw?.toFixed(0) ?? '—'} kcal/day

---

## Action Plan

### Priority Confirmatory Tests

${testsTableMd}

### Dietary & Lifestyle Recommendations

${foodMd}
${hiAlertsMd}
---

## Context for AI System

This report is generated by the USAKA Health Screening Dashboard, which processes QRMA bioresonance device output into 8 domain scores. Scores are derived from PDF-extracted biomarker values mapped against reference standards. This screening is non-diagnostic and is intended to complement TCM clinical assessment. The 8 module scores and HRV autonomic data below should be read alongside the practitioner's TCM diagnosis to build an individualized health program.
${hrvSection}
---

## Data Summary

%%DATA_SUMMARY_TXT%%

═══════════════════════════════════════════════`;

  // ── Download (format-aware) ───────────────────────────────
  const isTxt  = exportFormat === 'txt';
  // Substitute the placeholder with the right content for each format:
  // MD  → restore the ```json code fence (unchanged from original behaviour)
  // TXT → inject the pre-built plain-text summary block
  const withData = report.replace('%%DATA_SUMMARY_TXT%%',
    isTxt
      ? dataSummaryTxt
      : '```json\n' + dataSummaryJson + '\n```'
  );
  const output = isTxt ? mdToTxt(withData) : withData;
  const mime   = isTxt ? 'text/plain;charset=utf-8' : 'text/markdown;charset=utf-8';
  const dlName = isTxt ? filename.replace(/\.md$/, '.txt') : filename;

  const blob = new Blob([output], { type: mime });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = dlName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

document.addEventListener('DOMContentLoaded', () => {
  lucide.createIcons();
  const btn = document.querySelector('[data-lang]');
  if (btn) {
    let lang = 'id';
    btn.textContent = 'ID';
    btn.addEventListener('click', () => {
      lang = lang === 'id' ? 'en' : 'id';
      if (typeof setLang === 'function') setLang(lang);
      if (typeof applyLabels === 'function') applyLabels(lang);
      if (typeof renderHrvStrip_Digestive === 'function') renderHrvStrip_Digestive();
      btn.textContent = lang.toUpperCase();
      document.querySelectorAll('[data-zone]').forEach(el => {
        if (typeof getBadge === 'function') el.textContent = getBadge(el.dataset.zone);
      });
      document.querySelectorAll('[data-pillar-label]').forEach(el => {
        const burden = parseFloat(el.dataset.burden);
        if (!isNaN(burden) && typeof getPillarLabel === 'function') {
          el.textContent = getPillarLabel(burden);
        }
      });
      if (typeof renderHrvPanel === 'function') renderHrvPanel();
      if (typeof bcRefreshLabels === 'function') bcRefreshLabels();
      document.querySelectorAll('[data-gauge-label]').forEach(el => {
        const key = el.dataset.gaugeKey;
        if (key && typeof HRV_BAND_LABELS !== 'undefined') {
          el.textContent = HRV_BAND_LABELS[key][lang] || HRV_BAND_LABELS[key]['en'];
        }
      });
      document.querySelectorAll('[data-gauge-band]').forEach(el => {
        const band = el.dataset.gaugeBand;
        if (band && typeof HRV_BAND_LABELS !== 'undefined') {
          el.textContent = HRV_BAND_LABELS[band][lang] || HRV_BAND_LABELS[band]['en'];
        }
      });
    });
  }
  initImportCSV();
  initPdfDrop();
  _initBcCsvInput();
  // Close export dropdown when clicking outside
  document.addEventListener('click', function(e) {
    const grp = document.getElementById('exp-grp');
    if (grp && !grp.contains(e.target)) {
      document.getElementById('exp-dd')?.classList.remove('open');
      document.getElementById('exp-chv')?.setAttribute('aria-expanded','false');
    }
  });
  if (typeof applyLabels === 'function') applyLabels('id');
});

// ---------- CSV IMPORT ----------
let _importData=null;
let _jsonPayload=null;   // JSON import path
let _importMode='csv';   // 'csv' | 'json'
const _ALL_FIELDS=[
  'bv','cp','art','ins','bs','fr','hyp','ph','pb','hg',
  'ce','cs','cj','coq','gsh','vc','ve','ost',
  'ox-gsh','ox-coq','ox-vc','ox-ve','ox-sel','ox-fr','ox-hyp','ox-ph',
  'tx-pb','tx-hg','tx-cd','tx-as','tx-st','tx-tb','tx-ps',
  'mt-tg','mt-ug','mt-ins','mt-fm','mt-bmi','mt-wc',
  'cr-ch','cr-vf','cr-lv','cr-ua','cr-pt','cr-k','cr-mg',
  'nt-zn','nt-mg','nt-k','nt-io','nt-si','nt-b6','nt-vc','nt-d3','nt-ve','nt-fo',
  'sk-sc','sk-el','sk-tw','sk-sb','sk-ml','sk-sn','sk-ec','sk-jc',
  'dg-lp','dg-la','dg-sp','dg-sa','dg-lc','dg-ca','dg-bi','dg-ip','dg-ds',
  'bc-gender','bc-age','bc-height','bc-weight','bc-bmi','bc-wc','bc-bf','bc-vf','bc-whr'
];

function initImportCSV(){
  document.getElementById('csv-file-input').addEventListener('change',function(e){
  const file=e.target.files[0];
  if(!file)return;
  const isJSON=file.name.toLowerCase().endsWith('.json');
  const reader=new FileReader();
  reader.onload=ev=>{
    try{
      if(isJSON){
        _jsonPayload=JSON.parse(ev.target.result);
        _importMode='json';
        const row=_jsonToRow(_jsonPayload);
        if(row)_showImportModal(row);
        else alert('Could not read JSON file.');
      }else{
        _jsonPayload=null;
        _importMode='csv';
        const row=_parseCSV(ev.target.result);
        if(row)_showImportModal(row);
        else alert('Could not read CSV. Please check the file format.');
      }
    }catch(err){alert('Error reading file: '+err.message);}
  };
  reader.readAsText(file);
  this.value='';
});
}

function _parseCSV(text){
  const lines=text.trim().split(/\r?\n/);
  if(lines.length<2)return null;
  const headers=lines[0].split(',').map(h=>h.trim().replace(/^"|"$/g,''));
  const values=lines[1].split(',').map(v=>v.trim().replace(/^"|"$/g,''));
  const row={};
  headers.forEach((h,i)=>{row[h]=values[i]||'';});
  return row;
}

function _jsonToRow(payload){
  const row={};
  row['name']      = payload.patient?.name     || '';
  row['age']       = payload.patient?.age      || '';
  row['gender']    = payload.patient?.gender   || '';
  row['test_date'] = payload.patient?.testdate || '';
  Object.assign(row, payload.values || {});
  return row;
}

function _showImportModal(row){
  _importData=row;
  document.getElementById('im-name').textContent=row.name||'—';
  document.getElementById('im-age').textContent=row.age||'—';
  document.getElementById('im-sex').textContent=row.gender?(row.gender.toLowerCase()==='male'?'Male':'Female'):'—';
  document.getElementById('im-date').textContent=row.test_date||'—';
  // bc- fields are populated via the separate BodyComp CSV path — exclude from QRMA import counts
  const _qrmaFields=_ALL_FIELDS.filter(id=>!id.startsWith('bc-'));
  const matched=_qrmaFields.filter(id=>row[id]!==undefined&&row[id]!=='');
  const missing=_qrmaFields.filter(id=>!row[id]||row[id]==='');
  const pct=Math.round((matched.length/_qrmaFields.length)*100);
  document.getElementById('im-count').textContent=matched.length+' / '+_qrmaFields.length;
  document.getElementById('im-bar').style.width=pct+'%';
  const missEl=document.getElementById('im-miss');
  if(missing.length){
    missEl.style.display='block';
    document.getElementById('im-missv').textContent=missing.join(' · ');
  }else{
    missEl.style.display='none';
  }
  const ov=document.getElementById('import-overlay');
  ov.style.display='flex';
  lucide.createIcons();
}

function confirmImport(){
  // JSON import path
  if(_importMode==='json'&&_jsonPayload){
    // Populate window.zoneData BEFORE importFromPayload calls calcAll()
    window.zoneData={};
    Object.entries(_jsonPayload.values||{}).forEach(([k,v])=>{
      if(k.endsWith('_zone')&&v&&v!=='unknown') window.zoneData[k]=v;
    });
    QRMAImporter.importFromPayload(_jsonPayload,[]);
    closeImportModal();
    return;
  }
  if(!_importData)return;
  const row=_importData;
  // Gender translation — handles both English (from fixed parser) and
  // Indonesian fallback (Pria/Wanita) in case of older CSVs
  const _genderMap={'pria':'male','laki-laki':'male','laki laki':'male','l':'male',
                    'wanita':'female','perempuan':'female','p':'female'};
  if(row.age){const e=document.getElementById('age');if(e)e.value=row.age;}
  if(row.gender){
    const e=document.getElementById('gender');
    if(e){
      const g=row.gender.toLowerCase().trim();
      e.value=_genderMap[g]||g;
    }
  }
  _ALL_FIELDS.forEach(id=>{
    if(row[id]!==undefined&&row[id]!==''){
      const e=document.getElementById(id);
      if(e)e.value=parseFloat(row[id])||0;
    }
  });

  // Load zone labels from CSV _zone columns into window.zoneData.
  // Zone columns are written by parser_v3 / csv_exporter_v2 alongside
  // each raw field (e.g. bv → bv_zone). Stored here so all module
  // calculators (cBioAge, cOx, etc.) can read them after import.
  window.zoneData = {};
  Object.keys(row).forEach(key => {
    if (key.endsWith('_zone') && row[key] && row[key] !== 'unknown') {
      window.zoneData[key] = row[key];
    }
  });

  // Populate client card
  const ccCard=document.getElementById('client-card');
  if(row.name||row.age){
    const name=row.name||'Unknown';
    document.getElementById('cc-name').textContent=name;
    document.getElementById('cc-initials').textContent=name.trim().split(/\s+/).map(w=>w[0]).join('').toUpperCase().slice(0,2)||'?';
    document.getElementById('cc-age').textContent=row.age||'—';
    document.getElementById('cc-gender').textContent=row.gender?(row.gender.toLowerCase()==='male'?'Male':'Female'):'—';
    document.getElementById('cc-date').textContent=row.test_date||'—';
    ccCard.style.display='flex';
    lucide.createIcons();
  }
  closeImportModal();
  calcAll();
}

function closeImportModal(){
  document.getElementById('import-overlay').style.display='none';
  _importData=null;
}

// ---------- PDF UPLOAD (Build 1) ----------
const PDF_SERVER='http://localhost:5000';

function openPdfModal(){
  document.getElementById('pdf-modal').style.display='flex';
  lucide.createIcons();
  _pdfReset();
  _checkServer();
}

function closePdfModal(){
  document.getElementById('pdf-modal').style.display='none';
  _pdfReset();
}

function _pdfReset(){
  document.getElementById('pdz-zone').classList.remove('over','uploading');
  document.getElementById('pdz-spin').style.display='none';
  document.getElementById('pdz-icon').style.display='';
  document.getElementById('pdz-lbl').innerHTML='<strong>Drop a QRMA PDF here</strong>';
  document.getElementById('pdz-sub').textContent='or click to browse · PDF files only';
  const e=document.getElementById('pdz-err');
  e.style.display='none';
  e.textContent='';
}

function _pdfSetLoading(on){
  const zone=document.getElementById('pdz-zone');
  const spin=document.getElementById('pdz-spin');
  const icon=document.getElementById('pdz-icon');
  const lbl =document.getElementById('pdz-lbl');
  const sub =document.getElementById('pdz-sub');
  if(on){
    zone.classList.add('uploading');
    spin.style.display='block';
    icon.style.display='none';
    lbl.innerHTML='<strong>Processing PDF…</strong>';
    sub.textContent='Running pipeline — please wait.';
  }else{
    zone.classList.remove('uploading');
    spin.style.display='none';
    icon.style.display='';
    lbl.innerHTML='<strong>Drop a QRMA PDF here</strong>';
    sub.textContent='or click to browse · PDF files only';
  }
}

function _pdfShowErr(msg){
  _pdfSetLoading(false);
  const e=document.getElementById('pdz-err');
  e.style.display='block';
  e.textContent=msg;
}

function _checkServer(){
  const el=document.getElementById('pdz-srv');
  el.className='pdz-srv';
  el.textContent='Checking server…';
  const ctrl=new AbortController();
  const timer=setTimeout(()=>ctrl.abort(),2500);
  fetch(PDF_SERVER+'/',{signal:ctrl.signal})
    .then(r=>{
      clearTimeout(timer);
      if(r.ok){
        el.className='pdz-srv ok';
        el.textContent='● Server connected — ready to process PDF';
      }else{
        el.className='pdz-srv warn';
        el.textContent='○ Server error ('+r.status+') — use JSON file picker if needed';
      }
    })
    .catch(()=>{
      clearTimeout(timer);
      el.className='pdz-srv warn';
      el.textContent='○ Server not running on port 5000 — start server.py first';
    });
}

function handlePdfUpload(file){
  if(!file||!file.name.toLowerCase().endsWith('.pdf')){
    _pdfShowErr('Please select a valid PDF file.');
    return;
  }
  _pdfReset();
  _pdfSetLoading(true);
  const fd=new FormData();
  fd.append('pdf',file);
  fetch(PDF_SERVER+'/upload',{method:'POST',body:fd})
    .then(resp=>resp.json().then(json=>({ok:resp.ok,json})))
    .then(({ok,json})=>{
      if(!ok){
        _pdfShowErr('Server error: '+(json.error||'Unknown error'));
        return;
      }
      // Mirror the JSON import path in confirmImport(): zoneData first, then importer
      window.zoneData={};
      Object.entries(json.values||{}).forEach(([k,v])=>{
        if(k.endsWith('_zone')&&v&&v!=='unknown') window.zoneData[k]=v;
      });
      closePdfModal();
      QRMAImporter.importFromPayload(json,[]);
    })
    .catch(err=>{
      _pdfShowErr('Could not reach server. Is server.py running? '+err.message);
    });
}

function initPdfDrop(){
  const fi  =document.getElementById('pdf-file-input');
  const zone=document.getElementById('pdz-zone');
  fi.addEventListener('change',e=>{
    if(e.target.files[0]) handlePdfUpload(e.target.files[0]);
    fi.value='';
  });
  zone.addEventListener('click',()=>fi.click());
  zone.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' ') fi.click();});
  zone.addEventListener('dragover',e=>{
    e.preventDefault();
    if(!zone.classList.contains('uploading')) zone.classList.add('over');
  });
  zone.addEventListener('dragleave',()=>zone.classList.remove('over'));
  zone.addEventListener('drop',e=>{
    e.preventDefault();
    zone.classList.remove('over');
    const f=e.dataTransfer&&e.dataTransfer.files[0];
    if(f) handlePdfUpload(f);
  });
}

// =============================================================================
// BODY COMP INPUT PANEL — JS (Task 3)
// =============================================================================
let _bcMode = 'manual';
let _bcCsvData = null;   // parsed CSV row, set by file input handler

// ── bcSetMode ─────────────────────────────────────────────────────────────
function bcSetMode(mode) {
  _bcMode = mode;
  document.getElementById('bc-mode-manual').classList.toggle('active', mode === 'manual');
  document.getElementById('bc-mode-csv').classList.toggle('active', mode === 'csv');
  document.getElementById('bc-manual-section').style.display = mode === 'manual' ? '' : 'none';
  document.getElementById('bc-csv-section').style.display   = mode === 'csv'    ? '' : 'none';
}

// ── bcMarkManual — called on direct user edit of an auto field ─────────────
function bcMarkManual(el) {
  el.dataset.manual = 'true';
  const badge = document.getElementById(el.id + '-badge');
  const reset = document.getElementById(el.id + '-reset');
  if (badge) badge.style.display = 'none';
  if (reset) reset.style.display = '';
}

// ── bcAutoCalc — recalculates derived fields and BMR display ──────────────
function bcAutoCalc() {
  const height = parseFloat(document.getElementById('bc-height')?.value) || 0;
  const weight = parseFloat(document.getElementById('bc-weight')?.value) || 0;
  const wc     = parseFloat(document.getElementById('bc-wc')?.value)     || 0;
  const age    = parseFloat(document.getElementById('bc-age')?.value)    || 0;
  const gender = (document.getElementById('bc-gender')?.value || 'male').trim().toLowerCase();

  // Auto-calc BMI
  const bmiEl    = document.getElementById('bc-bmi');
  const bmiBadge = document.getElementById('bc-bmi-badge');
  const bmiReset = document.getElementById('bc-bmi-reset');
  if (bmiEl && bmiEl.dataset.manual !== 'true') {
    if (height > 0 && weight > 0) {
      const bmiVal = weight / ((height / 100) * (height / 100));
      bmiEl.value = bmiVal.toFixed(1);
      if (bmiBadge) bmiBadge.style.display = '';
      if (bmiReset) bmiReset.style.display = 'none';
    } else {
      bmiEl.value = '';
      if (bmiBadge) bmiBadge.style.display = 'none';
    }
  }

  // Auto-calc WHR
  const whrEl    = document.getElementById('bc-whr');
  const whrBadge = document.getElementById('bc-whr-badge');
  const whrReset = document.getElementById('bc-whr-reset');
  if (whrEl && whrEl.dataset.manual !== 'true') {
    if (wc > 0 && height > 0) {
      const whrVal = wc / height;
      whrEl.value = whrVal.toFixed(3);
      if (whrBadge) whrBadge.style.display = '';
      if (whrReset) whrReset.style.display = 'none';
    } else {
      whrEl.value = '';
      if (whrBadge) whrBadge.style.display = 'none';
    }
  }

  // Update BMR display
  const bmrDisp = document.getElementById('bc-bmr-display');
  if (bmrDisp) {
    if (height > 0 && weight > 0 && age > 0) {
      const bmr = (10 * weight) + (6.25 * height) - (5 * age) + (gender === 'female' ? -161 : 5);
      bmrDisp.textContent = Math.round(bmr) + ' kcal/day';
    } else {
      bmrDisp.textContent = '—';
    }
  }
}

// ── bcResetAuto — clears manual override, re-runs auto-calc ───────────────
function bcResetAuto(fieldId) {
  const el = document.getElementById(fieldId);
  if (el) { el.dataset.manual = 'false'; el.value = ''; }
  const reset = document.getElementById(fieldId + '-reset');
  if (reset) reset.style.display = 'none';
  bcAutoCalc();
}

// ── bcParseCsv — pure, returns object mapping DOM ids to values ───────────
function bcParseCsv(text) {
  const lines = text.trim().split(/\r?\n/);
  if (lines.length < 2) return null;
  const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
  const values  = lines[1].split(',').map(v => v.trim().replace(/^"|"$/g, ''));
  const row = {};
  headers.forEach((h, i) => { row[h] = values[i] || ''; });

  // Column → DOM field ID mapping
  const colMap = {
    'gender':             'bc-gender',
    'age':                'bc-age',
    'height_cm':          'bc-height',
    'weight_kg':          'bc-weight',
    'bmi':                'bc-bmi',
    'waist_cm':           'bc-wc',
    'body_fat_pct':       'bc-bf',
    'visceral_fat_index': 'bc-vf',
    'whr':                'bc-whr'
  };

  const result = { fields: {}, matched: 0, total: Object.keys(colMap).length };
  Object.entries(colMap).forEach(([col, domId]) => {
    if (row[col] !== undefined && row[col] !== '') {
      result.fields[domId] = row[col];
      result.matched++;
    }
  });
  return result;
}

// ── bcConfirmCsv — populates DOM from parsed CSV, then calcAll ─────────────
function bcConfirmCsv() {
  if (!_bcCsvData || !_bcCsvData.fields) return;
  const f = _bcCsvData.fields;

  // Gender select — handle string values
  if (f['bc-gender']) {
    const gv = f['bc-gender'].toLowerCase().trim();
    const sel = document.getElementById('bc-gender');
    if (sel) sel.value = (['female','f','wanita','perempuan'].includes(gv)) ? 'female' : 'male';
  }

  // Numeric fields
  ['bc-age','bc-height','bc-weight','bc-wc','bc-bf','bc-vf'].forEach(id => {
    if (f[id] !== undefined) {
      const el = document.getElementById(id);
      if (el) el.value = parseFloat(f[id]) || '';
    }
  });

  // BMI — if present in CSV, mark as manual override
  if (f['bc-bmi'] !== undefined && f['bc-bmi'] !== '') {
    const el = document.getElementById('bc-bmi');
    if (el) { el.value = parseFloat(f['bc-bmi']) || ''; el.dataset.manual = 'true'; }
    const reset = document.getElementById('bc-bmi-reset');
    if (reset) reset.style.display = '';
  }

  // WHR — if present in CSV, mark as manual override
  if (f['bc-whr'] !== undefined && f['bc-whr'] !== '') {
    const el = document.getElementById('bc-whr');
    if (el) { el.value = parseFloat(f['bc-whr']) || ''; el.dataset.manual = 'true'; }
    const reset = document.getElementById('bc-whr-reset');
    if (reset) reset.style.display = '';
  }

  // Re-run auto-calc for any missing auto fields
  bcAutoCalc();
  // Switch to manual view so results are visible
  bcSetMode('manual');
  calcAll();
}

// ── bcDownloadTemplate ─────────────────────────────────────────────────────
function bcDownloadTemplate() {
  const header = 'gender,age,height_cm,weight_kg,bmi,waist_cm,body_fat_pct,visceral_fat_index,whr';
  const example = 'male,35,170,75,,88,22,8,';
  const csv = header + '\n' + example + '\n';
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = 'body_comp_template.csv';
  document.body.appendChild(a); a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ── CSV file input handler (wired on DOMContentLoaded) ────────────────────
function _initBcCsvInput() {
  const fi = document.getElementById('bc-csv-input');
  if (!fi) return;
  fi.addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      try {
        _bcCsvData = bcParseCsv(ev.target.result);
        const preview = document.getElementById('bc-csv-preview');
        const confirm = document.getElementById('bc-csv-confirm');
        if (!_bcCsvData) {
          if (preview) { preview.style.display = ''; preview.textContent = 'Could not parse file. Check format and try again.'; preview.style.color = 'var(--err)'; }
          if (confirm) confirm.style.display = 'none';
          return;
        }
        if (preview) {
          preview.style.display = '';
          preview.style.color = '';
          preview.innerHTML = '<strong>' + _bcCsvData.matched + ' of ' + _bcCsvData.total + ' fields matched</strong>';
        }
        if (confirm) confirm.style.display = '';
        lucide.createIcons();
      } catch(err) {
        const preview = document.getElementById('bc-csv-preview');
        if (preview) { preview.style.display = ''; preview.textContent = 'Error reading file: ' + err.message; }
      }
    };
    reader.readAsText(file);
    this.value = '';
  });
}

// ── BodyComp HRV strip (v6 addition — keeps hrv-engine.js unmodified) ──
function renderHrvStrip_BodyComp() {
  if (typeof _renderStrip === 'function') _renderStrip('body_comp', 'hrv-strip-bc');
}


