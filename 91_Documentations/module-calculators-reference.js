// ============================================================================
// module-calculators-reference.js
// Extracted from: qrma-dashboard-v2.html (lines 567–576)
// Purpose: Reference copy of all module scoring functions for building v3
// DO NOT EDIT — read-only reference
// ============================================================================

// All functions read form values via g(id) = parseFloat(document.getElementById(id).value) || 0
// All scores return 0–100 unless noted
//
// Score conventions (v2 numeric system):
//   cBioAge  → { ba, age, p1, p2, p3 }   ba = biological age in years
//   cOx      → { s, ax, px, ... }          s  = oxidative risk 0–100 (higher = more concern)
//   cTx      → { s, hm, lb, ... }          s  = toxic burden 0–100   (higher = more concern)
//   cMt      → { s, gc, lp, ... }          s  = metabolic risk 0–100 (higher = more concern)
//   cCr      → { s, cai, ri, ... }         s  = cardio-renal strain 0–100
//   cNt      → { s, def, opt, items }      s  = nutrient sufficiency 0–100 (higher = better)
//   cSk      → { s, cl, bf, ... }          s  = skin resilience 0–100      (higher = better)
//
// v3 REPLACEMENT PLAN:
//   Replace s with zone-based score: avg of scoreFromZone(zone_label) per module field
//   ZONE_SCORES = { normal: 9, ringan: 6, sedang: 3, berat: 1, unknown: 0 }
//   Keep these functions as numeric fallback when no zone data is loaded
// ============================================================================

// ---------- MODULE 1: BIOLOGICAL AGE ----------
// Inputs: bv, cp, art, ins, bs (Pillar 1 — Metabolic/Vascular)
//         fr, hyp, ph, pb, hg  (Pillar 2 — Oxidative/Toxic)
//         ce, cs, cj, coq, gsh, vc, ve, ost (Pillar 3 — Regenerative)
// Output: ba = chronological_age + weighted_pillar_sum
//         Pillar weights: p1=35%, p2=35%, p3=30%
function cBioAge(){
  const age=g('age');
  let p1=0,p2=0,p3=0;
  // Pillar 1 — higher values = more wear
  p1+=Math.max(0,(g('bv')-45)/45)*10;
  p1+=Math.max(0,(g('cp')-50)/50)*8;
  p1+=Math.max(0,(g('art')-.5)/.5)*6;
  p1+=Math.max(0,(3-g('ins'))/3)*5;      // lower insulin = more wear
  p1+=Math.max(0,(g('bs')-6.1))*4;
  // Pillar 2 — oxidative burden
  const hyp=g('hyp');
  p2+=Math.max(0,(g('fr')-3)/3)*7;
  p2+=(hyp>150?Math.min((hyp-150)/50,1)*5:0)+(hyp<100?Math.min((100-hyp)/50,1)*3:0);
  p2+=Math.max(0,(3.3-g('ph'))/1)*5;     // lower pH = more acidic = more stress
  p2+=Math.max(0,(g('pb')-1.2)/1.2)*5;
  p2+=Math.max(0,(g('hg')-.5)/.5)*4;
  // Pillar 3 — regenerative deficits
  p3+=Math.max(0,(.7-g('ce'))/.7)*7;     // lower collagen = more deficit
  p3+=Math.max(0,(4-g('cs'))/4)*4;
  p3+=Math.max(0,(5-g('cj'))/5)*3;
  p3+=Math.max(0,(1-g('coq'))/1)*5;
  p3+=Math.max(0,(1-g('gsh'))/1)*5;
  p3+=Math.max(0,(4.5-g('vc'))/4.5)*3;
  p3+=Math.max(0,(5-g('ve'))/5)*3;
  p3+=Math.max(0,(g('ost')-160)/160)*4;  // higher osteoclast = more bone loss
  return{ba:Math.round(age+p1*.35+p2*.35+p3*.30),age,p1:+p1.toFixed(1),p2:+p2.toFixed(1),p3:+p3.toFixed(1)};
}

// ---------- MODULE 2: OXIDATIVE STRESS ----------
// Inputs: ox-gsh, ox-coq, ox-vc, ox-ve, ox-sel (antioxidant reserve)
//         ox-fr, ox-hyp, ox-ph               (pro-oxidant load)
// Sub-scores:
//   ax = antioxidant reserve 0–100 (higher = better reserve)
//   px = pro-oxidant load 0–100    (higher = more load)
// s = composite risk: (100-ax)*0.55 + px*0.45
function cOx(){
  const gsh=g('ox-gsh'),coq=g('ox-coq'),vc=g('ox-vc'),ve=g('ox-ve'),sel=g('ox-sel');
  const fr=g('ox-fr'),hyp=g('ox-hyp'),ph=g('ox-ph');
  const ax=((gsh/2)+(coq/2)+(vc/6.5)+(ve/7)+(sel/7))/5*100;
  const px=(Math.min(fr/6,1)+Math.min(Math.abs(hyp-125)/50,1)+Math.min(Math.max(3.5-ph,0)/1,1))/3*100;
  return{s:Math.round((100-ax)*.55+px*.45),ax:Math.round(ax),px:Math.round(px),gsh,coq,vc,ve,sel,fr,hyp,ph};
}

// ---------- MODULE 3: TOXIC BURDEN ----------
// Inputs: tx-pb (Lead), tx-hg (Mercury), tx-cd (Cadmium), tx-as (Arsenic)
//         tx-st (Stimulant), tx-tb (Tobacco), tx-ps (Pesticide)
// Sub-scores:
//   hm = heavy metal index (excess above normal floor, weighted)
//   lb = lifestyle burden 0–50
// s = hm*0.6 + lb*0.4, clamped 0–100
function cTx(){
  const pb=g('tx-pb'),hg=g('tx-hg'),cd=g('tx-cd'),as_=g('tx-as');
  const st=g('tx-st'),tb=g('tx-tb'),ps=g('tx-ps');
  const hm=Math.max(0,((pb/1.2-1)*50+(hg/.5-1)*50+(cd/.5-1)*30+(as_/.4-1)*30));
  const lb=Math.max(0,(st/1.5+tb/1+ps/1)/3*50);
  return{s:Math.min(100,Math.max(0,Math.round(hm*.6+lb*.4))),hm:Math.round(hm),lb:Math.round(lb),pb,hg,cd,as_,st,tb,ps};
}

// ---------- MODULE 4: METABOLIC RISK ----------
// Inputs: mt-tg, mt-ug, mt-ins, mt-fm, mt-bmi, mt-wc
// Sub-scores:
//   gc = glycemic burden (glucose + insulin)
//   lp = lipid burden (triglycerides + fat metabolism)
// Asian waist thresholds: Male >90cm, Female >80cm (already correct in this code)
// s = gc*0.40 + lp*0.35 + bmiP + wcP, clamped 0–100
function cMt(){
  const tg=g('mt-tg'),ug=g('mt-ug'),ins=g('mt-ins'),fm=g('mt-fm');
  const bmi=g('mt-bmi'),wc=g('mt-wc');
  const gend=document.getElementById('gender')?.value||'male';
  const gc=Math.max(0,(ug-6.1)/1*40+Math.max(0,(3-ins)/3)*35);
  const lp=Math.max(0,(tg-5)/5*40+(fm-5)/5*35);
  const bmiP=bmi>25?Math.min((bmi-25)/10,1)*15:0;
  const wcP=gend==='male'?(wc>90?Math.min((wc-90)/30,1)*10:0):(wc>80?Math.min((wc-80)/30,1)*10:0);
  return{s:Math.min(100,Math.round(gc*.40+lp*.35+bmiP+wcP)),gc:Math.round(gc),lp:Math.round(lp),tg,ug,ins,fm,bmi,wc};
}

// ---------- MODULE 5: CARDIO-RENAL ----------
// Inputs: cr-ch (cholesterol plaque), cr-vf (vascular flexibility), cr-lv (LV resistance)
//         cr-ua (uric acid), cr-pt (proteinuria), cr-k (potassium), cr-mg (magnesium)
// Sub-scores:
//   cai = cardiac index   (cholesterol + vascular + LV)
//   ri  = renal index     (proteinuria + uric acid + low Mg penalty)
// s = cai*0.55 + ri*0.45, clamped 0–100
function cCr(){
  const ch=g('cr-ch'),vf=g('cr-vf'),lv=g('cr-lv');
  const ua=g('cr-ua'),pt=g('cr-pt'),k=g('cr-k'),mg=g('cr-mg');
  const cai=Math.max(0,(ch-50)/50*40+Math.max(0,(6-vf)/6)*30+Math.max(0,(lv-5)/5)*20);
  const ri=Math.max(0,(pt-3)/3*40+Math.max(0,(ua-7.2)/3)*20+Math.max(0,(4.5-mg)/4.5)*10);
  return{s:Math.min(100,Math.round(cai*.55+ri*.45)),cai:Math.round(cai),ri:Math.round(ri),ch,vf,lv,ua,pt,k,mg};
}

// ---------- MODULE 6: NUTRIENT SUFFICIENCY ----------
// Inputs: nt-zn, nt-mg, nt-k, nt-io, nt-si, nt-b6, nt-vc, nt-d3, nt-ve, nt-fo
// Each nutrient scored as % of reference minimum; capped at 100%
// s = average of individual nutrient % scores (0–100, higher = better)
// def = count below 75% of minimum; opt = count at or above minimum
function cNt(){
  const items=[
    {n:'Zinc',v:g('nt-zn'),min:5},
    {n:'Magnesium',v:g('nt-mg'),min:5},
    {n:'Potassium',v:g('nt-k'),min:4.5},
    {n:'Iodine',v:g('nt-io'),min:5},
    {n:'Silicon',v:g('nt-si'),min:5},
    {n:'Vitamin B6',v:g('nt-b6'),min:5},
    {n:'Vitamin C',v:g('nt-vc'),min:4.5},
    {n:'Vitamin D3',v:g('nt-d3'),min:5},
    {n:'Vitamin E',v:g('nt-ve'),min:5},
    {n:'Folate',v:g('nt-fo'),min:5}
  ];
  let def=0,opt=0,tot=0;
  items.forEach(i=>{
    const p=i.v/i.min*100;
    tot+=Math.min(p,100);
    if(p>=100)opt++;
    else if(p<75)def++;
  });
  return{s:Math.round(tot/items.length),def,opt,items};
}

// ---------- MODULE 7: SKIN & COLLAGEN ----------
// Inputs: sk-sc (skin collagen), sk-el (elasticity), sk-tw (TEWL), sk-sb (sebum)
//         sk-ml (melanin), sk-sn (sensitivity), sk-ec (eye collagen), sk-jc (joint collagen)
// Sub-scores:
//   cl = collagen index   (sc + ec + jc) — higher = better
//   bf = barrier function (elasticity + inverse TEWL) — higher = better
// s = cl*0.5 + bf*0.3 + (1-sensitivity)*0.2, 0–100 (higher = more resilient)
//
// NOTE for v3: sk-sb needs bidirectional alert:
//   sk-sb <= 3 → dry skin pattern
//   sk-sb >= 8 → oily skin pattern
//   Normal range: 3–8
function cSk(){
  const sc=g('sk-sc'),el=g('sk-el'),tw=g('sk-tw'),sb=g('sk-sb');
  const ml=g('sk-ml'),sn=g('sk-sn'),ec=g('sk-ec'),jc=g('sk-jc');
  const cl=Math.round(((sc/6)+(Math.min(ec/1,1))+(jc/7))/3*100);
  const bf=Math.round(((el/8)+(1-Math.min(tw/8,1)))/2*100);
  return{s:Math.min(100,Math.round(cl*.5+bf*.3+(1-Math.min(sn/10,1))*100*.2)),cl:Math.min(100,cl),bf:Math.min(100,bf),sc,el,tw,sb,ml,sn,ec,jc};
}

// ---------- MODULE 8: ACTION PLAN ----------
// Aggregates flags from all modules; thresholds are numeric (v2 system)
// Produces three output blocks: confirmatory tests table, food interventions, high-priority alerts
// v3 replacement: gate flags on zone labels (berat/sedang/ringan) instead of numeric thresholds
function buildAction(d){
  const rows=[];
  // Bio Age flag
  if(d.ba.ba>d.ba.age+5)rows.push({p:'High',dom:'Biological Age',f:'Bio age '+d.ba.ba+'y vs chrono '+d.ba.age+'y (+'+(d.ba.ba-d.ba.age)+'y)',t:'hsCRP, CBC, Fasting Lipids, HbA1c, TSH/FT4'});
  // Oxidative flags
  if(d.ox.gsh<.9||d.ox.coq<.9)rows.push({p:'Medium',dom:'Oxidative Stress',f:'Deficient glutathione and/or CoQ10 signal',t:'Plasma glutathione (ELISA), CoQ10 (HPLC), 8-OHdG urine'});
  // Toxic flags
  if(d.tx.pb>1.2)rows.push({p:'High',dom:'Lead Exposure',f:'Lead signal elevated ('+d.tx.pb.toFixed(3)+')',t:'Whole blood lead level (BLL) - gold standard'});
  if(d.tx.hg>.5)rows.push({p:'High',dom:'Mercury Exposure',f:'Mercury signal elevated ('+d.tx.hg.toFixed(3)+')',t:'Blood total mercury; urine mercury speciation'});
  if(d.tx.cd>.5)rows.push({p:'Medium',dom:'Cadmium Exposure',f:'Cadmium signal borderline',t:'Urine cadmium (first-morning void)'});
  // Metabolic flags
  if(d.mt.ug>6.1||d.mt.ins<3)rows.push({p:'High',dom:'Glycemic Pattern',f:'Elevated glucose / low insulin signal',t:'FPG, HbA1c, Fasting Insulin, HOMA-IR'});
  if(d.mt.tg>5)rows.push({p:'Medium',dom:'Lipid Pattern',f:'Elevated triglyceride pattern',t:'Full fasting lipid panel: TG, LDL, HDL, Total Cholesterol'});
  // Cardio-Renal flags
  if(d.cr.ch>50)rows.push({p:'High',dom:'Cholesterol Signal',f:'Plaque signal '+d.cr.ch.toFixed(1),t:'Fasting lipid panel, ApoB, Lp(a), hsCRP'});
  if(d.cr.pt>3)rows.push({p:'High',dom:'Renal: Proteinuria',f:'Proteinuria index elevated',t:'Urinalysis, uACR, serum creatinine, eGFR'});
  if(d.cr.vf<6)rows.push({p:'Medium',dom:'Vascular Flexibility',f:'Low vascular signal ('+d.cr.vf.toFixed(1)+')',t:'BP monitoring (ABPM), ankle-brachial index'});
  // Nutrient flags
  if(d.nt.def>4)rows.push({p:'Medium',dom:'Nutrient Deficiency',f:d.nt.def+' nutrients below range',t:'Serum zinc, RBC magnesium, 25(OH)D, serum folate, plasma B6'});
  // Skin flag
  if(d.sk.cl<50)rows.push({p:'Low',dom:'Collagen',f:'Low collagen signal across multiple sites',t:'Clinical skin assessment; consider P1NP (procollagen marker)'});

  rows.sort((a,b)=>({High:0,Medium:1,Low:2}[a.p]-{High:0,Medium:1,Low:2}[b.p]));

  // Render tests table
  if(!rows.length){
    document.getElementById('r-acttbl').innerHTML=aal('ok','No Critical Flags','All screening signals within normal reference ranges. Routine monitoring recommended.');
  }else{
    let h='<table class="atbl"><thead><tr><th>Priority</th><th>Domain</th><th>Screening Finding</th><th>Suggested Confirmatory Tests</th></tr></thead><tbody>';
    rows.forEach(r=>{
      const pc=r.p==='High'?'phi':r.p==='Medium'?'pmd':'plo';
      h+='<tr><td class="'+pc+'">'+r.p+'</td><td>'+r.dom+'</td><td>'+r.f+'</td><td style="font-size:var(--text-xs);color:var(--txtM)">'+r.t+'</td></tr>';
    });
    h+='</tbody></table>';
    document.getElementById('r-acttbl').innerHTML=h;
  }

  // Render food interventions
  const fp=[];
  if(d.ox.s>40)fp.push(ftrow('Antioxidant Priority',['Berries','Spinach','Green Tea','Brazil Nuts (Se)','Citrus (Vit C)','Sunflower Seeds (Vit E)','Dark Chocolate']));
  if(d.mt.s>30)fp.push(ftrow('Metabolic Support',['Oats + Legumes (Fiber)','Fatty Fish (Omega-3)','Bitter Melon','Cinnamon','Reduce Refined Carbs']));
  if(d.cr.s>30)fp.push(ftrow('Cardio-Renal',['Bananas + Avocado (K)','Pumpkin Seeds (Mg)','Quercetin Foods (Onion)','Reduce Sodium']));
  if(d.nt.def>3)fp.push(ftrow('Micronutrient Diversity',['Dark Leafy Greens (Mg, Folate)','Pumpkin Seeds (Zinc)','Seaweed (Iodine)','Fatty Fish (D3, B6)','Chickpeas (Folate)']));
  if(d.sk.s<60)fp.push(ftrow('Skin + Collagen',['Bone Broth','Fish / Chicken Skin','Egg Whites','Vitamin C Cofactors','Garlic (Sulfur)','Berries (Resveratrol)']));
  document.getElementById('r-actfood').innerHTML=fp.length?fp.join(''):'<p style="color:var(--txtM);font-size:var(--text-sm)">Continue balanced whole-foods diet. No critical nutritional gaps identified.</p>';

  // Render high-priority alerts
  const hi=rows.filter(r=>r.p==='High');
  document.getElementById('r-actal').innerHTML=hi.length
    ?hi.map(r=>aal('err',r.dom+' - High Priority',r.f+'. Confirm: '+r.t)).join('')
    :aal('ok','No High-Priority Alerts','All flags at medium or low priority. See confirmatory tests table.');
}
