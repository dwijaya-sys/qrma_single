// ============================================================================
// dashboard-v2-js-reference.js
// Extracted from: qrma-dashboard-v2.html (lines 557–693)
// Purpose: Reference copy of all JavaScript for use when building v3
// DO NOT EDIT — read-only reference
// ============================================================================

// ---------- THEME TOGGLE ----------
(function(){const t=document.querySelector('[data-tt]'),r=document.documentElement;let d=matchMedia('(prefers-color-scheme:dark)').matches?'dark':'light';r.setAttribute('data-theme',d);t&&t.addEventListener('click',()=>{d=d==='dark'?'light':'dark';r.setAttribute('data-theme',d);t.innerHTML=d==='dark'?'<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>':'<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>';});})();

// ---------- NAVIGATION ----------
function nav(id){document.querySelectorAll('.pg').forEach(s=>s.classList.remove('active'));document.querySelectorAll('[data-nav],[data-mn]').forEach(s=>s.classList.remove('active'));document.getElementById('pg-'+id).classList.add('active');document.querySelectorAll('[data-nav="'+id+'"],[data-mn="'+id+'"]').forEach(e=>e.classList.add('active'));window.scrollTo({top:0,behavior:'smooth'});}

// ---------- HELPERS ----------
const g=id=>parseFloat(document.getElementById(id)?.value)||0;
function se(id,val,cls){const e=document.getElementById(id);if(!e)return;e.textContent=val;if(cls){e.className=e.className.replace(/\bc(ok|warn|bad|info)\b/g,'').trim()+' '+cls;}}
function clrc(v,lo,hi){return v<=lo?'cok':v<=hi?'cwarn':'cbad';}
function lbl(v,lo,hi){return v<=lo?'Low Concern':v<=hi?'Monitor':'Needs Lab Confirmation';}
function bar(label,val,max,ccls){const pct=Math.min(100,(val/max)*100);const fc=ccls.replace('c','f');return '<div class="sbw"><div class="sbh"><span>'+label+'</span><span class="'+ccls+'" style="font-weight:700">'+val.toFixed(1)+'</span></div><div class="sbt"><div class="sbf '+fc+'" style="width:'+pct+'%"></div></div><div class="sbl"><span>0</span><span>'+max+'</span></div></div>';}
function bmr(name,val,st){const m={normal:'cok2',borderline:'cbl',deficient:'cdef',abnormal:'cab'};const lm={normal:'Normal',borderline:'Borderline',deficient:'Deficient',abnormal:'Abnormal'};return '<div class="bmr"><span class="bmn">'+name+'</span><span class="bmv">'+(typeof val==='number'?val.toFixed(3):val)+'</span><span class="chip '+(m[st]||'cbl')+'">'+(lm[st]||st)+'</span></div>';}
function aal(type,title,desc){const m={err:'aerr',warn:'awarn',info:'ainfo',ok:'aok'};const ic={err:'alert-circle',warn:'alert-triangle',info:'info',ok:'check-circle'};return '<div class="aal '+(m[type])+'"><i data-lucide="'+ic[type]+'" width="16" height="16" class="aalic"></i><div class="aalb"><div class="aalt">'+title+'</div><div class="aald">'+desc+'</div></div></div>';}
function ftrow(label,foods){return '<div style="margin-bottom:var(--sp3)"><div style="font-size:var(--text-sm);font-weight:600;margin-bottom:var(--sp2)">'+label+'</div><div class="ftags">'+foods.map(f=>'<span class="ftag">&#127807; '+f+'</span>').join('')+'</div></div>';}

// ---------- MODULE CALCULATORS ----------
function cBioAge(){const age=g('age');let p1=0,p2=0,p3=0;p1+=Math.max(0,(g('bv')-45)/45)*10;p1+=Math.max(0,(g('cp')-50)/50)*8;p1+=Math.max(0,(g('art')-.5)/.5)*6;p1+=Math.max(0,(3-g('ins'))/3)*5;p1+=Math.max(0,(g('bs')-6.1))*4;const hyp=g('hyp');p2+=Math.max(0,(g('fr')-3)/3)*7;p2+=(hyp>150?Math.min((hyp-150)/50,1)*5:0)+(hyp<100?Math.min((100-hyp)/50,1)*3:0);p2+=Math.max(0,(3.3-g('ph'))/1)*5;p2+=Math.max(0,(g('pb')-1.2)/1.2)*5;p2+=Math.max(0,(g('hg')-.5)/.5)*4;p3+=Math.max(0,(.7-g('ce'))/.7)*7;p3+=Math.max(0,(4-g('cs'))/4)*4;p3+=Math.max(0,(5-g('cj'))/5)*3;p3+=Math.max(0,(1-g('coq'))/1)*5;p3+=Math.max(0,(1-g('gsh'))/1)*5;p3+=Math.max(0,(4.5-g('vc'))/4.5)*3;p3+=Math.max(0,(5-g('ve'))/5)*3;p3+=Math.max(0,(g('ost')-160)/160)*4;return{ba:Math.round(age+p1*.35+p2*.35+p3*.30),age,p1:+p1.toFixed(1),p2:+p2.toFixed(1),p3:+p3.toFixed(1)};}
function cOx(){const gsh=g('ox-gsh'),coq=g('ox-coq'),vc=g('ox-vc'),ve=g('ox-ve'),sel=g('ox-sel'),fr=g('ox-fr'),hyp=g('ox-hyp'),ph=g('ox-ph');const ax=((gsh/2)+(coq/2)+(vc/6.5)+(ve/7)+(sel/7))/5*100;const px=(Math.min(fr/6,1)+Math.min(Math.abs(hyp-125)/50,1)+Math.min(Math.max(3.5-ph,0)/1,1))/3*100;return{s:Math.round((100-ax)*.55+px*.45),ax:Math.round(ax),px:Math.round(px),gsh,coq,vc,ve,sel,fr,hyp,ph};}
function cTx(){const pb=g('tx-pb'),hg=g('tx-hg'),cd=g('tx-cd'),as_=g('tx-as'),st=g('tx-st'),tb=g('tx-tb'),ps=g('tx-ps');const hm=Math.max(0,((pb/1.2-1)*50+(hg/.5-1)*50+(cd/.5-1)*30+(as_/.4-1)*30));const lb=Math.max(0,(st/1.5+tb/1+ps/1)/3*50);return{s:Math.min(100,Math.max(0,Math.round(hm*.6+lb*.4))),hm:Math.round(hm),lb:Math.round(lb),pb,hg,cd,as_,st,tb,ps};}
function cMt(){const tg=g('mt-tg'),ug=g('mt-ug'),ins=g('mt-ins'),fm=g('mt-fm'),bmi=g('mt-bmi'),wc=g('mt-wc'),gend=document.getElementById('gender')?.value||'male';const gc=Math.max(0,(ug-6.1)/1*40+Math.max(0,(3-ins)/3)*35);const lp=Math.max(0,(tg-5)/5*40+(fm-5)/5*35);const bmiP=bmi>25?Math.min((bmi-25)/10,1)*15:0;const wcP=gend==='male'?(wc>90?Math.min((wc-90)/30,1)*10:0):(wc>80?Math.min((wc-80)/30,1)*10:0);return{s:Math.min(100,Math.round(gc*.40+lp*.35+bmiP+wcP)),gc:Math.round(gc),lp:Math.round(lp),tg,ug,ins,fm,bmi,wc};}
function cCr(){const ch=g('cr-ch'),vf=g('cr-vf'),lv=g('cr-lv'),ua=g('cr-ua'),pt=g('cr-pt'),k=g('cr-k'),mg=g('cr-mg');const cai=Math.max(0,(ch-50)/50*40+Math.max(0,(6-vf)/6)*30+Math.max(0,(lv-5)/5)*20);const ri=Math.max(0,(pt-3)/3*40+Math.max(0,(ua-7.2)/3)*20+Math.max(0,(4.5-mg)/4.5)*10);return{s:Math.min(100,Math.round(cai*.55+ri*.45)),cai:Math.round(cai),ri:Math.round(ri),ch,vf,lv,ua,pt,k,mg};}
function cNt(){const items=[{n:'Zinc',v:g('nt-zn'),min:5},{n:'Magnesium',v:g('nt-mg'),min:5},{n:'Potassium',v:g('nt-k'),min:4.5},{n:'Iodine',v:g('nt-io'),min:5},{n:'Silicon',v:g('nt-si'),min:5},{n:'Vitamin B6',v:g('nt-b6'),min:5},{n:'Vitamin C',v:g('nt-vc'),min:4.5},{n:'Vitamin D3',v:g('nt-d3'),min:5},{n:'Vitamin E',v:g('nt-ve'),min:5},{n:'Folate',v:g('nt-fo'),min:5}];let def=0,opt=0,tot=0;items.forEach(i=>{const p=i.v/i.min*100;tot+=Math.min(p,100);if(p>=100)opt++;else if(p<75)def++;});return{s:Math.round(tot/items.length),def,opt,items};}
function cSk(){const sc=g('sk-sc'),el=g('sk-el'),tw=g('sk-tw'),sb=g('sk-sb'),ml=g('sk-ml'),sn=g('sk-sn'),ec=g('sk-ec'),jc=g('sk-jc');const cl=Math.round(((sc/6)+(Math.min(ec/1,1))+(jc/7))/3*100);const bf=Math.round(((el/8)+(1-Math.min(tw/8,1)))/2*100);return{s:Math.min(100,Math.round(cl*.5+bf*.3+(1-Math.min(sn/10,1))*100*.2)),cl:Math.min(100,cl),bf:Math.min(100,bf),sc,el,tw,sb,ml,sn,ec,jc};}

// ---------- CHARTS ----------
let RC=null,BC=null;
function drawCharts(sc){const dk=document.documentElement.getAttribute('data-theme')==='dark';const tc=dk?'#cdccca':'#28251d',gc=dk?'#393836':'#dcd9d5';const lb=['Oxidative','Toxic','Metabolic','Cardio-Renal','Nutrients','Skin'];const rd=[100-Math.min(sc.ox,100),100-Math.min(sc.tx,100),100-Math.min(sc.mt,100),100-Math.min(sc.cr,100),Math.min(sc.nt,100),Math.min(sc.sk,100)];const cc=v=>v<=30?'#437a22':v<=60?'#d19900':'#a13544';const bc=[cc(sc.ox),cc(sc.tx),cc(sc.mt),cc(sc.cr),cc(100-sc.nt),cc(100-sc.sk)];if(RC)RC.destroy();if(BC)BC.destroy();RC=new Chart(document.getElementById('radarChart'),{type:'radar',data:{labels:lb,datasets:[{data:rd,backgroundColor:'rgba(1,105,111,.15)',borderColor:'#01696f',pointBackgroundColor:'#01696f',pointRadius:4,borderWidth:2}]},options:{responsive:true,scales:{r:{min:0,max:100,ticks:{display:false},grid:{color:gc},angleLines:{color:gc},pointLabels:{color:tc,font:{family:'Satoshi',size:11}}}},plugins:{legend:{display:false}}}});BC=new Chart(document.getElementById('barChart'),{type:'bar',data:{labels:lb,datasets:[{data:[sc.ox,sc.tx,sc.mt,sc.cr,100-sc.nt,100-sc.sk],backgroundColor:bc,borderRadius:6,borderSkipped:false}]},options:{responsive:true,indexAxis:'y',scales:{x:{min:0,max:100,grid:{color:gc},ticks:{color:tc,font:{size:11}},border:{color:gc}},y:{grid:{display:false},ticks:{color:tc,font:{size:11}},border:{color:gc}}},plugins:{legend:{display:false},tooltip:{callbacks:{label:ctx=>' Risk: '+ctx.raw+'%'}}}}}); }

// ---------- ACTION PLAN ----------
function buildAction(d){const rows=[];if(d.ba.ba>d.ba.age+5)rows.push({p:'High',dom:'Biological Age',f:'Bio age '+d.ba.ba+'y vs chrono '+d.ba.age+'y (+'+( d.ba.ba-d.ba.age)+'y)',t:'hsCRP, CBC, Fasting Lipids, HbA1c, TSH/FT4'});if(d.ox.gsh<.9||d.ox.coq<.9)rows.push({p:'Medium',dom:'Oxidative Stress',f:'Deficient glutathione and/or CoQ10 signal',t:'Plasma glutathione (ELISA), CoQ10 (HPLC), 8-OHdG urine'});if(d.tx.pb>1.2)rows.push({p:'High',dom:'Lead Exposure',f:'Lead signal elevated ('+d.tx.pb.toFixed(3)+')',t:'Whole blood lead level (BLL) - gold standard'});if(d.tx.hg>.5)rows.push({p:'High',dom:'Mercury Exposure',f:'Mercury signal elevated ('+d.tx.hg.toFixed(3)+')',t:'Blood total mercury; urine mercury speciation'});if(d.tx.cd>.5)rows.push({p:'Medium',dom:'Cadmium Exposure',f:'Cadmium signal borderline',t:'Urine cadmium (first-morning void)'});if(d.mt.ug>6.1||d.mt.ins<3)rows.push({p:'High',dom:'Glycemic Pattern',f:'Elevated glucose / low insulin signal',t:'FPG, HbA1c, Fasting Insulin, HOMA-IR'});if(d.mt.tg>5)rows.push({p:'Medium',dom:'Lipid Pattern',f:'Elevated triglyceride pattern',t:'Full fasting lipid panel: TG, LDL, HDL, Total Cholesterol'});if(d.cr.ch>50)rows.push({p:'High',dom:'Cholesterol Signal',f:'Plaque signal '+d.cr.ch.toFixed(1),t:'Fasting lipid panel, ApoB, Lp(a), hsCRP'});if(d.cr.pt>3)rows.push({p:'High',dom:'Renal: Proteinuria',f:'Proteinuria index elevated',t:'Urinalysis, uACR, serum creatinine, eGFR'});if(d.cr.vf<6)rows.push({p:'Medium',dom:'Vascular Flexibility',f:'Low vascular signal ('+d.cr.vf.toFixed(1)+')',t:'BP monitoring (ABPM), ankle-brachial index'});if(d.nt.def>4)rows.push({p:'Medium',dom:'Nutrient Deficiency',f:d.nt.def+' nutrients below range',t:'Serum zinc, RBC magnesium, 25(OH)D, serum folate, plasma B6'});if(d.sk.cl<50)rows.push({p:'Low',dom:'Collagen',f:'Low collagen signal across multiple sites',t:'Clinical skin assessment; consider P1NP (procollagen marker)'});rows.sort((a,b)=>({High:0,Medium:1,Low:2}[a.p]-{High:0,Medium:1,Low:2}[b.p]));if(!rows.length){document.getElementById('r-acttbl').innerHTML=aal('ok','No Critical Flags','All screening signals within normal reference ranges. Routine monitoring recommended.');}else{let h='<table class="atbl"><thead><tr><th>Priority</th><th>Domain</th><th>Screening Finding</th><th>Suggested Confirmatory Tests</th></tr></thead><tbody>';rows.forEach(r=>{const pc=r.p==='High'?'phi':r.p==='Medium'?'pmd':'plo';h+='<tr><td class="'+pc+'">'+r.p+'</td><td>'+r.dom+'</td><td>'+r.f+'</td><td style="font-size:var(--text-xs);color:var(--txtM)">'+r.t+'</td></tr>';});h+='</tbody></table>';document.getElementById('r-acttbl').innerHTML=h;}const fp=[];if(d.ox.s>40)fp.push(ftrow('Antioxidant Priority',['Berries','Spinach','Green Tea','Brazil Nuts (Se)','Citrus (Vit C)','Sunflower Seeds (Vit E)','Dark Chocolate']));if(d.mt.s>30)fp.push(ftrow('Metabolic Support',['Oats + Legumes (Fiber)','Fatty Fish (Omega-3)','Bitter Melon','Cinnamon','Reduce Refined Carbs']));if(d.cr.s>30)fp.push(ftrow('Cardio-Renal',['Bananas + Avocado (K)','Pumpkin Seeds (Mg)','Quercetin Foods (Onion)','Reduce Sodium']));if(d.nt.def>3)fp.push(ftrow('Micronutrient Diversity',['Dark Leafy Greens (Mg, Folate)','Pumpkin Seeds (Zinc)','Seaweed (Iodine)','Fatty Fish (D3, B6)','Chickpeas (Folate)']));if(d.sk.s<60)fp.push(ftrow('Skin + Collagen',['Bone Broth','Fish / Chicken Skin','Egg Whites','Vitamin C Cofactors','Garlic (Sulfur)','Berries (Resveratrol)']));document.getElementById('r-actfood').innerHTML=fp.length?fp.join(''):'<p style="color:var(--txtM);font-size:var(--text-sm)">Continue balanced whole-foods diet. No critical nutritional gaps identified.</p>';const hi=rows.filter(r=>r.p==='High');document.getElementById('r-actal').innerHTML=hi.length?hi.map(r=>aal('err',r.dom+' - High Priority',r.f+'. Confirm: '+r.t)).join(''):aal('ok','No High-Priority Alerts','All flags at medium or low priority. See confirmatory tests table.');}

// ---------- CALCULATE ALL ----------
function calcAll(){const ba=cBioAge(),ox=cOx(),tx=cTx(),mt=cMt(),cr=cCr(),nt=cNt(),sk=cSk();const GS={ox:ox.s,tx:tx.s,mt:mt.s,cr:cr.s,nt:nt.s,sk:sk.s};
const delta=ba.ba-ba.age;const baCls=delta>10?'cbad':delta>3?'cwarn':'cok';se('r-bav',ba.ba+'y',baCls);se('r-cav',ba.age+'y','cinfo');se('r-del',(delta>=0?'+':'')+delta+'y',delta>0?'cbad':'cok');document.getElementById('r-ba').style.display='block';document.getElementById('r-babars').innerHTML=bar('Pillar 1: Metabolic/Vascular',ba.p1,30,'cwarn')+bar('Pillar 2: Oxidative/Toxic',ba.p2,30,'cbad')+bar('Pillar 3: Regenerative Deficits',ba.p3,30,'cwarn');se('k-ba',ba.ba+'y',baCls);document.getElementById('k-bad').textContent=(delta>=0?'+':'')+delta+'y';
const oxC=clrc(ox.s,30,60);document.getElementById('r-ox').style.display='block';se('r-oxs',ox.s+'%',oxC);se('r-oxl',lbl(ox.s,30,60),'');se('r-ax',ox.ax+'%',ox.ax>=60?'cok':'cbad');se('r-px',ox.px+'%',ox.px<=40?'cok':'cbad');document.getElementById('r-oxbm').innerHTML='<div class="bml">'+bmr('Glutathione',ox.gsh,ox.gsh>=1?'normal':ox.gsh>=.8?'borderline':'deficient')+bmr('CoQ10',ox.coq,ox.coq>=1?'normal':ox.coq>=.8?'borderline':'deficient')+bmr('Vitamin C',ox.vc,ox.vc>=4.5?'normal':ox.vc>=3.5?'borderline':'deficient')+bmr('Vitamin E',ox.ve,ox.ve>=5?'normal':ox.ve>=4?'borderline':'deficient')+bmr('Selenium',ox.sel,ox.sel>=5?'normal':ox.sel>=4?'borderline':'deficient')+bmr('Skin Free Radicals',ox.fr,ox.fr<3?'normal':ox.fr<4?'borderline':'abnormal')+'</div>';document.getElementById('r-oxf').innerHTML=ftrow('Antioxidant Foods',['Spinach','Broccoli','Berries','Green Tea','Citrus (Vit C)','Almonds','Sunflower Seeds (Vit E)','Brazil Nuts (Selenium)']);se('k-ox',ox.s+'%',oxC);document.getElementById('k-oxl').textContent=lbl(ox.s,30,60);
const txC=clrc(tx.s,25,50);document.getElementById('r-tx').style.display='block';se('r-txs',tx.s+'%',txC);se('r-txl',lbl(tx.s,25,50),'');se('r-hm',tx.hm+'',tx.hm<=10?'cok':tx.hm<=30?'cwarn':'cbad');se('r-lbi',tx.lb+'',tx.lb<=15?'cok':tx.lb<=30?'cwarn':'cbad');const txA=[];if(tx.pb>1.2)txA.push(aal('err','Elevated Lead Signal','Confirm: Whole blood lead level (BLL). Do not conclude without lab.'));if(tx.hg>.5)txA.push(aal('err','Elevated Mercury Signal','Confirm: Blood mercury, urine mercury speciation.'));if(tx.cd>.5)txA.push(aal('warn','Cadmium Borderline','Confirm: Urine cadmium (first-morning void).'));if(tx.as_>.4)txA.push(aal('warn','Arsenic Borderline','Confirm: Urine arsenic, speciated inorganic.'));if(!txA.length)txA.push(aal('ok','No Critical Heavy Metal Flags','Signals within normal reference ranges.'));document.getElementById('r-txal').innerHTML=txA.join('');se('k-tx',tx.s+'%',txC);document.getElementById('k-txl').textContent=lbl(tx.s,25,50);
const mtC=clrc(mt.s,30,60);document.getElementById('r-mt').style.display='block';se('r-mts',mt.s+'%',mtC);se('r-mtl',lbl(mt.s,30,60),'');se('r-gc',mt.gc+'%',mt.gc<=20?'cok':mt.gc<=40?'cwarn':'cbad');se('r-lp',mt.lp+'%',mt.lp<=20?'cok':mt.lp<=40?'cwarn':'cbad');const mtA=[];if(mt.ug>6.1)mtA.push(aal('warn','Elevated Glucose Signal','Confirm: FPG, HbA1c.'));if(mt.ins<3)mtA.push(aal('warn','Low Insulin Secretion Signal','Confirm: Fasting insulin, C-peptide, HOMA-IR.'));if(mt.tg>5)mtA.push(aal('warn','Elevated Triglyceride Pattern','Confirm: Full fasting lipid panel.'));if(mt.bmi>25)mtA.push(aal('info','Elevated BMI','Consider waist-to-height ratio and body composition.'));if(!mtA.length)mtA.push(aal('ok','Metabolic Profile Within Range','No significant flags at this time.'));document.getElementById('r-mtal').innerHTML=mtA.join('');se('k-mt',mt.s+'%',mtC);document.getElementById('k-mtl').textContent=lbl(mt.s,30,60);
const crC=clrc(cr.s,30,60);document.getElementById('r-cr').style.display='block';se('r-crs',cr.s+'%',crC);se('r-crl',lbl(cr.s,30,60),'');se('r-cai',cr.cai+'%',cr.cai<=20?'cok':cr.cai<=40?'cwarn':'cbad');se('r-ri',cr.ri+'%',cr.ri<=20?'cok':cr.ri<=40?'cwarn':'cbad');const crA=[];if(cr.ch>50)crA.push(aal('warn','Elevated Cholesterol Signal','Confirm: Fasting lipid panel, ApoB.'));if(cr.vf<6)crA.push(aal('warn','Reduced Vascular Flexibility','Confirm: BP monitoring (ABPM), ABI.'));if(cr.pt>3)crA.push(aal('err','Proteinuria Signal Elevated','Confirm: Urinalysis, uACR, serum creatinine, eGFR.'));if(cr.ua>7.2)crA.push(aal('warn','Elevated Uric Acid Pattern','Confirm: Serum uric acid.'));if(!crA.length)crA.push(aal('ok','Cardio-Renal Signals Within Range','No critical strain flags detected.'));document.getElementById('r-cral').innerHTML=crA.join('');se('k-cr',cr.s+'%',crC);document.getElementById('k-crl').textContent=lbl(cr.s,30,60);
const ntC=nt.s>=70?'cok':nt.s>=50?'cwarn':'cbad';const ntL=nt.s>=70?'Sufficient':nt.s>=50?'Borderline':'Deficient';document.getElementById('r-nt').style.display='block';se('r-nts',nt.s+'%',ntC);se('r-ntl',ntL,'');se('r-ntdef',nt.def+'','cbad');se('r-ntopt',nt.opt+'','cok');document.getElementById('r-ntbm').innerHTML='<div class="bml">'+nt.items.map(i=>{const p=i.v/i.min*100;return bmr(i.n,i.v,p>=100?'normal':p>=75?'borderline':'deficient');}).join('')+'</div>';document.getElementById('r-ntf').innerHTML=ftrow('Nutrient-Rich Foods',['Pumpkin Seeds (Zinc)','Dark Greens (Mg, Folate)','Bananas (K)','Seaweed (Iodine)','Salmon (D3, B6)','Chickpeas (Folate)','Sunflower Seeds (E)','Citrus (C)']);se('k-nt',nt.s+'%',ntC);document.getElementById('k-ntl').textContent=ntL;
const skC=sk.s>=70?'cok':sk.s>=50?'cwarn':'cbad';const skL=sk.s>=70?'Resilient':sk.s>=50?'Moderate Concern':'Low Resilience';document.getElementById('r-sk').style.display='block';se('r-sks',sk.s+'%',skC);se('r-skl',skL,'');se('r-cli',sk.cl+'%',sk.cl>=70?'cok':sk.cl>=50?'cwarn':'cbad');se('r-bfi',sk.bf+'%',sk.bf>=70?'cok':sk.bf>=50?'cwarn':'cbad');document.getElementById('r-skbm').innerHTML='<div class="bml">'+bmr('Skin Collagen',sk.sc,sk.sc>=4?'normal':sk.sc>=3?'borderline':'deficient')+bmr('Skin Elasticity',sk.el,sk.el>=5.5?'normal':sk.el>=4?'borderline':'abnormal')+bmr('TEWL (Water Loss)',sk.tw,sk.tw<5?'normal':sk.tw<6.5?'borderline':'abnormal')+bmr('Eye Collagen',sk.ec,sk.ec>=.7?'normal':sk.ec>=.5?'borderline':'deficient')+bmr('Joint Collagen',sk.jc,sk.jc>=5?'normal':sk.jc>=4?'borderline':'deficient')+'</div>';document.getElementById('r-skf').innerHTML=ftrow('Skin-Supporting Foods',['Bone Broth (Collagen)','Fish + Chicken Skin','Egg Whites','Vitamin C Cofactors','Berries (Resveratrol)','Garlic (Sulfur)']);se('k-sk',sk.s+'%',skC);document.getElementById('k-skl').textContent=skL;
const alv=Math.round([ox.s,tx.s,mt.s,cr.s,100-nt.s,100-sk.s].reduce((a,b)=>a+b,0)/6);const alC=alv<=30?'cok':alv<=60?'cwarn':'cbad';se('k-al',alv+'%',alC);document.getElementById('k-all').textContent=alv<=30?'Low Stress':alv<=60?'Moderate Burden':'High Multisystem Stress';
drawCharts(GS);buildAction({ba,ox,tx,mt,cr,nt,sk,al:alv});lucide.createIcons();nav('dashboard');}

// ---------- DOM READY ----------
document.addEventListener('DOMContentLoaded',()=>{lucide.createIcons();initImportCSV();});

// ---------- CSV IMPORT ----------
let _importData=null;
const _ALL_FIELDS=[
  'bv','cp','art','ins','bs','fr','hyp','ph','pb','hg',
  'ce','cs','cj','coq','gsh','vc','ve','ost',
  'ox-gsh','ox-coq','ox-vc','ox-ve','ox-sel','ox-fr','ox-hyp','ox-ph',
  'tx-pb','tx-hg','tx-cd','tx-as','tx-st','tx-tb','tx-ps',
  'mt-tg','mt-ug','mt-ins','mt-fm','mt-bmi','mt-wc',
  'cr-ch','cr-vf','cr-lv','cr-ua','cr-pt','cr-k','cr-mg',
  'nt-zn','nt-mg','nt-k','nt-io','nt-si','nt-b6','nt-vc','nt-d3','nt-ve','nt-fo',
  'sk-sc','sk-el','sk-tw','sk-sb','sk-ml','sk-sn','sk-ec','sk-jc'
];

function initImportCSV(){
  document.getElementById('csv-file-input').addEventListener('change',function(e){
    const file=e.target.files[0];
    if(!file)return;
    const reader=new FileReader();
    reader.onload=ev=>{
      try{
        const row=_parseCSV(ev.target.result);
        if(row)_showImportModal(row);
        else alert('Could not read CSV. Please check the file format.');
      }catch(err){alert('Error reading CSV: '+err.message);}
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

function _showImportModal(row){
  _importData=row;
  document.getElementById('im-name').textContent=row.name||'—';
  document.getElementById('im-age').textContent=row.age||'—';
  document.getElementById('im-sex').textContent=row.gender?(row.gender.toLowerCase()==='male'?'Male':'Female'):'—';
  document.getElementById('im-date').textContent=row.test_date||'—';
  const matched=_ALL_FIELDS.filter(id=>row[id]!==undefined&&row[id]!=='');
  const missing=_ALL_FIELDS.filter(id=>!row[id]||row[id]==='');
  const pct=Math.round((matched.length/_ALL_FIELDS.length)*100);
  document.getElementById('im-count').textContent=matched.length+' / '+_ALL_FIELDS.length;
  document.getElementById('im-bar').style.width=pct+'%';
  const missEl=document.getElementById('im-miss');
  if(missing.length){
    missEl.style.display='block';
    document.getElementById('im-missv').textContent=missing.join(' · ');
  }else{
    missEl.style.display='none';
  }
  document.getElementById('import-overlay').style.display='flex';
  lucide.createIcons();
}

function confirmImport(){
  if(!_importData)return;
  const row=_importData;
  const _genderMap={'pria':'male','laki-laki':'male','laki laki':'male','l':'male',
                    'wanita':'female','perempuan':'female','p':'female'};
  if(row.age){const e=document.getElementById('age');if(e)e.value=row.age;}
  if(row.gender){
    const e=document.getElementById('gender');
    if(e){const g=row.gender.toLowerCase().trim();e.value=_genderMap[g]||g;}
  }
  _ALL_FIELDS.forEach(id=>{
    if(row[id]!==undefined&&row[id]!==''){
      const e=document.getElementById(id);
      if(e)e.value=parseFloat(row[id])||0;
    }
  });
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
