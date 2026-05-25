// ============================================================================
// calcAll-reference.js
// Extracted from: qrma-dashboard-v2.html (lines 577–586)
// Purpose: Reference copy of calcAll() for building the v3 zone-aware version
// DO NOT EDIT — read-only reference
// ============================================================================

// Depends on: cBioAge, cOx, cTx, cMt, cCr, cNt, cSk, drawCharts, buildAction
// Depends on: se(), clrc(), lbl(), bar(), bmr(), aal(), ftrow() helpers
// Calls: lucide.createIcons(), nav('dashboard')
//
// Score convention (v2):
//   risk modules  (ox, tx, mt, cr): s = 0–100, higher = more concern
//   resilience    (nt, sk):         s = 0–100, higher = better reserve
//   bio age:      ba = age estimate in years; delta = ba - chronological age
//
// Chart input convention:
//   drawCharts({ ox, tx, mt, cr, nt, sk })
//   Radar uses:  [100-ox, 100-tx, 100-mt, 100-cr, nt, sk]  (all higher = better)
//   Bar uses:    [ox, tx, mt, cr, 100-nt, 100-sk]           (all = risk level)

function calcAll(){
  const ba=cBioAge(),ox=cOx(),tx=cTx(),mt=cMt(),cr=cCr(),nt=cNt(),sk=cSk();
  const GS={ox:ox.s,tx:tx.s,mt:mt.s,cr:cr.s,nt:nt.s,sk:sk.s};

  // --- Bio Age ---
  const delta=ba.ba-ba.age;
  const baCls=delta>10?'cbad':delta>3?'cwarn':'cok';
  se('r-bav',ba.ba+'y',baCls);
  se('r-cav',ba.age+'y','cinfo');
  se('r-del',(delta>=0?'+':'')+delta+'y',delta>0?'cbad':'cok');
  document.getElementById('r-ba').style.display='block';
  document.getElementById('r-babars').innerHTML=
    bar('Pillar 1: Metabolic/Vascular',ba.p1,30,'cwarn')+
    bar('Pillar 2: Oxidative/Toxic',ba.p2,30,'cbad')+
    bar('Pillar 3: Regenerative Deficits',ba.p3,30,'cwarn');
  se('k-ba',ba.ba+'y',baCls);
  document.getElementById('k-bad').textContent=(delta>=0?'+':'')+delta+'y';

  // --- Oxidative Stress ---
  const oxC=clrc(ox.s,30,60);
  document.getElementById('r-ox').style.display='block';
  se('r-oxs',ox.s+'%',oxC);
  se('r-oxl',lbl(ox.s,30,60),'');
  se('r-ax',ox.ax+'%',ox.ax>=60?'cok':'cbad');
  se('r-px',ox.px+'%',ox.px<=40?'cok':'cbad');
  document.getElementById('r-oxbm').innerHTML='<div class="bml">'+
    bmr('Glutathione',ox.gsh,ox.gsh>=1?'normal':ox.gsh>=.8?'borderline':'deficient')+
    bmr('CoQ10',ox.coq,ox.coq>=1?'normal':ox.coq>=.8?'borderline':'deficient')+
    bmr('Vitamin C',ox.vc,ox.vc>=4.5?'normal':ox.vc>=3.5?'borderline':'deficient')+
    bmr('Vitamin E',ox.ve,ox.ve>=5?'normal':ox.ve>=4?'borderline':'deficient')+
    bmr('Selenium',ox.sel,ox.sel>=5?'normal':ox.sel>=4?'borderline':'deficient')+
    bmr('Skin Free Radicals',ox.fr,ox.fr<3?'normal':ox.fr<4?'borderline':'abnormal')+
  '</div>';
  document.getElementById('r-oxf').innerHTML=ftrow('Antioxidant Foods',['Spinach','Broccoli','Berries','Green Tea','Citrus (Vit C)','Almonds','Sunflower Seeds (Vit E)','Brazil Nuts (Selenium)']);
  se('k-ox',ox.s+'%',oxC);
  document.getElementById('k-oxl').textContent=lbl(ox.s,30,60);

  // --- Toxic Burden ---
  const txC=clrc(tx.s,25,50);
  document.getElementById('r-tx').style.display='block';
  se('r-txs',tx.s+'%',txC);
  se('r-txl',lbl(tx.s,25,50),'');
  se('r-hm',tx.hm+'',tx.hm<=10?'cok':tx.hm<=30?'cwarn':'cbad');
  se('r-lbi',tx.lb+'',tx.lb<=15?'cok':tx.lb<=30?'cwarn':'cbad');
  const txA=[];
  if(tx.pb>1.2)txA.push(aal('err','Elevated Lead Signal','Confirm: Whole blood lead level (BLL). Do not conclude without lab.'));
  if(tx.hg>.5)txA.push(aal('err','Elevated Mercury Signal','Confirm: Blood mercury, urine mercury speciation.'));
  if(tx.cd>.5)txA.push(aal('warn','Cadmium Borderline','Confirm: Urine cadmium (first-morning void).'));
  if(tx.as_>.4)txA.push(aal('warn','Arsenic Borderline','Confirm: Urine arsenic, speciated inorganic.'));
  if(!txA.length)txA.push(aal('ok','No Critical Heavy Metal Flags','Signals within normal reference ranges.'));
  document.getElementById('r-txal').innerHTML=txA.join('');
  se('k-tx',tx.s+'%',txC);
  document.getElementById('k-txl').textContent=lbl(tx.s,25,50);

  // --- Metabolic Risk ---
  const mtC=clrc(mt.s,30,60);
  document.getElementById('r-mt').style.display='block';
  se('r-mts',mt.s+'%',mtC);
  se('r-mtl',lbl(mt.s,30,60),'');
  se('r-gc',mt.gc+'%',mt.gc<=20?'cok':mt.gc<=40?'cwarn':'cbad');
  se('r-lp',mt.lp+'%',mt.lp<=20?'cok':mt.lp<=40?'cwarn':'cbad');
  const mtA=[];
  if(mt.ug>6.1)mtA.push(aal('warn','Elevated Glucose Signal','Confirm: FPG, HbA1c.'));
  if(mt.ins<3)mtA.push(aal('warn','Low Insulin Secretion Signal','Confirm: Fasting insulin, C-peptide, HOMA-IR.'));
  if(mt.tg>5)mtA.push(aal('warn','Elevated Triglyceride Pattern','Confirm: Full fasting lipid panel.'));
  if(mt.bmi>25)mtA.push(aal('info','Elevated BMI','Consider waist-to-height ratio and body composition.'));
  if(!mtA.length)mtA.push(aal('ok','Metabolic Profile Within Range','No significant flags at this time.'));
  document.getElementById('r-mtal').innerHTML=mtA.join('');
  se('k-mt',mt.s+'%',mtC);
  document.getElementById('k-mtl').textContent=lbl(mt.s,30,60);

  // --- Cardio-Renal ---
  const crC=clrc(cr.s,30,60);
  document.getElementById('r-cr').style.display='block';
  se('r-crs',cr.s+'%',crC);
  se('r-crl',lbl(cr.s,30,60),'');
  se('r-cai',cr.cai+'%',cr.cai<=20?'cok':cr.cai<=40?'cwarn':'cbad');
  se('r-ri',cr.ri+'%',cr.ri<=20?'cok':cr.ri<=40?'cwarn':'cbad');
  const crA=[];
  if(cr.ch>50)crA.push(aal('warn','Elevated Cholesterol Signal','Confirm: Fasting lipid panel, ApoB.'));
  if(cr.vf<6)crA.push(aal('warn','Reduced Vascular Flexibility','Confirm: BP monitoring (ABPM), ABI.'));
  if(cr.pt>3)crA.push(aal('err','Proteinuria Signal Elevated','Confirm: Urinalysis, uACR, serum creatinine, eGFR.'));
  if(cr.ua>7.2)crA.push(aal('warn','Elevated Uric Acid Pattern','Confirm: Serum uric acid.'));
  if(!crA.length)crA.push(aal('ok','Cardio-Renal Signals Within Range','No critical strain flags detected.'));
  document.getElementById('r-cral').innerHTML=crA.join('');
  se('k-cr',cr.s+'%',crC);
  document.getElementById('k-crl').textContent=lbl(cr.s,30,60);

  // --- Nutrient Sufficiency ---
  const ntC=nt.s>=70?'cok':nt.s>=50?'cwarn':'cbad';
  const ntL=nt.s>=70?'Sufficient':nt.s>=50?'Borderline':'Deficient';
  document.getElementById('r-nt').style.display='block';
  se('r-nts',nt.s+'%',ntC);
  se('r-ntl',ntL,'');
  se('r-ntdef',nt.def+'','cbad');
  se('r-ntopt',nt.opt+'','cok');
  document.getElementById('r-ntbm').innerHTML='<div class="bml">'+
    nt.items.map(i=>{const p=i.v/i.min*100;return bmr(i.n,i.v,p>=100?'normal':p>=75?'borderline':'deficient');}).join('')+
  '</div>';
  document.getElementById('r-ntf').innerHTML=ftrow('Nutrient-Rich Foods',['Pumpkin Seeds (Zinc)','Dark Greens (Mg, Folate)','Bananas (K)','Seaweed (Iodine)','Salmon (D3, B6)','Chickpeas (Folate)','Sunflower Seeds (E)','Citrus (C)']);
  se('k-nt',nt.s+'%',ntC);
  document.getElementById('k-ntl').textContent=ntL;

  // --- Skin & Collagen ---
  const skC=sk.s>=70?'cok':sk.s>=50?'cwarn':'cbad';
  const skL=sk.s>=70?'Resilient':sk.s>=50?'Moderate Concern':'Low Resilience';
  document.getElementById('r-sk').style.display='block';
  se('r-sks',sk.s+'%',skC);
  se('r-skl',skL,'');
  se('r-cli',sk.cl+'%',sk.cl>=70?'cok':sk.cl>=50?'cwarn':'cbad');
  se('r-bfi',sk.bf+'%',sk.bf>=70?'cok':sk.bf>=50?'cwarn':'cbad');
  document.getElementById('r-skbm').innerHTML='<div class="bml">'+
    bmr('Skin Collagen',sk.sc,sk.sc>=4?'normal':sk.sc>=3?'borderline':'deficient')+
    bmr('Skin Elasticity',sk.el,sk.el>=5.5?'normal':sk.el>=4?'borderline':'abnormal')+
    bmr('TEWL (Water Loss)',sk.tw,sk.tw<5?'normal':sk.tw<6.5?'borderline':'abnormal')+
    bmr('Eye Collagen',sk.ec,sk.ec>=.7?'normal':sk.ec>=.5?'borderline':'deficient')+
    bmr('Joint Collagen',sk.jc,sk.jc>=5?'normal':sk.jc>=4?'borderline':'deficient')+
  '</div>';
  document.getElementById('r-skf').innerHTML=ftrow('Skin-Supporting Foods',['Bone Broth (Collagen)','Fish + Chicken Skin','Egg Whites','Vitamin C Cofactors','Berries (Resveratrol)','Garlic (Sulfur)']);
  se('k-sk',sk.s+'%',skC);
  document.getElementById('k-skl').textContent=skL;

  // --- Allostatic Load ---
  const alv=Math.round([ox.s,tx.s,mt.s,cr.s,100-nt.s,100-sk.s].reduce((a,b)=>a+b,0)/6);
  const alC=alv<=30?'cok':alv<=60?'cwarn':'cbad';
  se('k-al',alv+'%',alC);
  document.getElementById('k-all').textContent=alv<=30?'Low Stress':alv<=60?'Moderate Burden':'High Multisystem Stress';

  drawCharts(GS);
  buildAction({ba,ox,tx,mt,cr,nt,sk,al:alv});
  lucide.createIcons();
  nav('dashboard');
}
