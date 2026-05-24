<img src="https://r2cdn.perplexity.ai/pplx-full-logo-primary-dark%402x.png" style="height:64px;margin-right:32px"/>

# i want a a full parameter table + scoring logic for this new gut module in the same format as the 8-module spec

Below is a **developer-ready parameter table and scoring logic** for a new **Gut Motility / Digestive Comfort** module, written in the same style as the 8-module spec. The module should stay **Exploratory** and use QRMA values only as proxy signals, with standard GI tests reserved for confirmation.[^1][^2]

## Module purpose

This module should screen for **functional digestive patterns** such as slower transit, fermentation/bloating, upper-GI digestion strain, and bowel sensitivity, without claiming disease. The best confirmatory pathway is symptom history plus standard GI workup only when red flags are present, especially fecal calprotectin for inflammatory-vs-functional differentiation, and specialist referral if alarm features exist.[^3][^4][^5][^6][^7]

## Table A — Parameter Reference

| \# | Parameter | Role in Module | How It Is Scored | Direction of Concern | Why This Parameter Matters | Scientific Evidence / Clinical Rationale | Suggested Confirmatory Tests | Food-First Actions | Confidence Label |
| :-- | :-- | :-- | :-- | :-- | :-- | :-- | :-- | :-- | :-- |
| 9.1 | Koefisien Tekanan Intraluminal | Primary motility signal | QRMA 1–10 proxy score. Use raw QRMA number as-is if already on a 1–10 scale; otherwise normalize by module-specific bins. Score ≤4 = flagged. | Higher or lower can be concerning depending on report pattern; usually abnormal deviation from mid-range is the signal. | Intraluminal pressure is a real GI physiology concept and directly relates to colonic motor activity, spasm, and transit patterns.[^8][^9] | In GI motility research, intraluminal pressure is measured directly by manometry and pressure sensors; QRMA can only provide a proxy pattern, not a true pressure reading.[^8][^9][^5] | GI motility evaluation if symptomatic; transit study, anorectal manometry, or specialist review depending on symptom pattern.[^2][^5] | Smaller meals, regular meal timing, hydration, walking after meals, ginger or peppermint if tolerated | Exploratory |
| 9.2 | Large Intestine Function | Lower-GI transit / retention proxy | QRMA 1–10 score. Score ≤4 = flagged. | Lower is worse | Useful for constipation tendency, incomplete evacuation, bloating with stool retention, and colon transit patterns.[^10][^2] | Colonic motor function is assessed in motility medicine using transit studies and symptom patterns rather than one biomarker.[^11][^5] | Bristol stool scale, bowel diary, transit study if persistent symptoms | Increase fibre gradually, water, kiwi, prunes, psyllium, physical activity | Exploratory |
| 9.3 | Small Intestine Function | Mid-gut transit / fermentation proxy | QRMA 1–10 score. Score ≤4 = flagged. | Lower is worse | Helpful for bloating after meals, fermentation-related discomfort, and post-prandial fullness patterns.[^3][^12] | Small bowel symptoms are often functional; evaluation depends on symptom clustering and exclusion of red flags rather than a single lab marker.[^3][^13] | Clinical history; breath testing only if clinician suspects SIBO / carbohydrate malabsorption | Low-FODMAP trial, smaller meals, reduce carbonated drinks, slow eating | Exploratory |
| 9.4 | Gastric Function | Upper-GI digestion proxy | QRMA 1–10 score. Score ≤4 = flagged. | Lower is worse | Supports screening for early fullness, poor digestion, reflux-like comfort complaints, and delayed gastric emptying patterns.[^14][^13] | Gastric motility disorders are evaluated with symptom patterns and, when indicated, gastric emptying tests or specialist assessment.[^5][^13] | If persistent: clinician review, H. pylori test when indicated, gastric emptying study only if symptoms fit | Smaller meals, avoid late-night eating, reduce high-fat meals if they worsen symptoms | Exploratory |
| 9.5 | Gastric Acid / Acidity Pattern | Digestive environment proxy | QRMA 1–10 score. Score ≤4 = flagged if low-acid pattern; score ≥8 can be flagged if high-acidity pattern is explicitly reported. | Depends on pattern | Gastric pH / acidity is a real physiological variable involved in digestion, but QRMA cannot directly measure it. It can only suggest a pattern.[^15][^16] | GI pH and acid-sensing are established physiological concepts; clinical assessment uses symptoms and targeted testing, not QRMA alone.[^15][^17][^16] | If reflux/red flags: clinician review, H. pylori testing, endoscopy if indicated | Avoid trigger foods, eat slower, reduce late meals, keep a food/symptom log | Exploratory |
| 9.6 | Intestinal pH | Micro-environment / fermentation proxy | QRMA 1–10 score. Score ≤4 = flagged if low-pH fermentation pattern; score ≥8 if unusually high pH pattern is reported. | Depends on pattern | pH influences digestion, microbial ecology, and fermentation. Abnormal pH patterns can coexist with bloating or stool changes.[^17][^18] | Human intestinal and fecal pH are studied in microbiome and functional GI research, but not used as routine clinical screening markers.[^17][^18] | Stool history; breath testing or stool studies only if clinically warranted | Fibre titration, fermented foods if tolerated, reduce excess sugar alcohols | Exploratory |
| 9.7 | Bloating / Gas Signal | Symptom burden proxy | QRMA 1–10 score. Score ≤4 = mild; ≥7 = pronounced bloating burden. | Higher is worse | Bloating is one of the commonest functional GI symptoms and often clusters with constipation, IBS-type patterns, or food intolerance.[^19][^3] | Bloating is usually functional; differential diagnosis depends on whether the symptom is gastric, small bowel, or constipation-associated.[^3][^20] | Red flags: CBC, CRP, fecal calprotectin, celiac testing when clinically indicated.[^4][^6] | Low-FODMAP approach, slower eating, reduce carbonated drinks, identify trigger foods | Exploratory |
| 9.8 | Visceral Sensitivity / Abdominal Sensitivity | Symptom amplification proxy | QRMA 1–10 score. Score ≤4 = lower sensitivity; ≥7 = elevated sensitivity. | Higher is worse | Sensitivity helps distinguish true motility burden from discomfort amplification / brain-gut interaction patterns.[^21][^22] | Functional bloating and motility disorders often include visceral hypersensitivity; assessment is symptom-based and clinical.[^20][^22] | Clinical review if pain is frequent or severe; consider GI referral if alarm symptoms exist | Stress reduction, regular sleep, paced breathing, avoid over-restricting food without evidence | Exploratory |
| 9.9 | Stool Regularity / Transit Pattern | Outcome proxy | QRMA 1–10 score if present. If not present, derive from patient-entered bowel habit frequency. Score ≤4 = concern for constipation-like pattern. | Lower is worse | Frequency and regularity are practical signals of transit; they help interpret the other QRMA proxies. | Transit time studies and stool frequency are standard ways to interpret motility issues.[^2][^5] | Bristol stool scale, bowel diary, transit study if needed | Fibre + water + movement + routine toilet timing | Well-supported |
| 9.10 | Red Flag Override | Safety gate | Not a score; boolean flag based on user symptom inputs. | N/A | Prevents the module from misclassifying inflammatory or structural disease as functional comfort issues.[^4][^6][^7] | Fecal calprotectin is used to distinguish functional from inflammatory disease; red flag symptoms bypass routine functional scoring.[^4][^6] | Immediate clinician review; fecal calprotectin, CBC, CRP, stool blood testing, GI referral depending on symptom set | N/A | Well-supported |

## Table B — Module Reference

| Module | Module Goal | Inputs Used | Derived Sub-Scores | Final Score Logic | Alert Threshold Logic | Recommended Chart Type | Recommended UI Label | Evidence Strength | Developer Notes |
| :-- | :-- | :-- | :-- | :-- | :-- | :-- | :-- | :-- | :-- |
| 9. Gut Motility / Digestive Comfort | Screen for functional digestive patterns such as slower transit, bloating/fermentation, upper-GI digestion strain, and sensitivity patterns | Koefisien Tekanan Intraluminal, Large Intestine Function, Small Intestine Function, Gastric Function, Gastric Acid, Intestinal pH, Bloating, Visceral Sensitivity, Stool Regularity, Red Flag Override | 1) Motility / Transit Index, 2) Digestive Environment Index, 3) Symptom Burden Index, 4) Safety Override | Motility Index = average of intraluminal pressure + large intestine + small intestine + stool regularity. Digestive Environment Index = average of gastric function + gastric acid + intestinal pH. Symptom Burden = average of bloating + sensitivity. Overall Gut Comfort Index = weighted blend: Motility 40%, Environment 30%, Symptoms 30%. If Red Flag Override = true, bypass scoring and show referral message. | Flag if Gut Comfort Index <4 OR any sub-index <4 OR red flag override = true. If bloating ≥7 and stool regularity ≤4, label as “bloating with constipation pattern.” If gastric function ≤4 and gastric acid pattern is abnormal, label as “upper-GI digestion strain pattern.” | 3-ring donut or nested horizontal bars: Motility, Environment, Symptoms | “Gut Motility / Digestive Comfort” | Exploratory | Keep this module clearly separated from disease diagnosis. It should be a comfort/function screen only. Show confirmatory tests only when red flags, persistent symptoms, or user-entered alarm features are present. Use neutral wording like “pattern suggests slower transit” rather than “constipation.” |

## Suggested scoring logic

Use the same 1–10 visual convention as the other modules, but treat all QRMA gut values as **proxy scores** rather than validated measurements. If the PDF gives a raw reading that is not already 1–10, convert it using parameter-specific bins, not a universal scale.[^5][^11]

### Recommended normalization rule

- **If the QRMA field already looks like a 1–10 score**, preserve it.
- **If it is a raw coefficient**, bin it into 1–10 using a simple mapping decided from the report’s historical range.
- **If higher raw means worse**, invert it before the score is displayed.


### Suggested sub-index formulas

- **Motility / Transit Index**
`= average(intraluminal_pressure, large_intestine, small_intestine, stool_regular)`
- **Digestive Environment Index**
`= average(gastric_function, gastric_acid, intestinal_pH)`
- **Symptom Burden Index**
`= average(bloating, visceral_sensitivity)`


### Suggested outputs

- **Green:** 8–10
- **Amber:** 5–7
- **Red:** 1–4


## Confirmatory tests to include in the action plan

When the module is flagged, the action plan should suggest standard checks only when appropriate:[^4][^6][^7]

- **Bristol stool scale and bowel diary** for baseline pattern tracking.
- **CBC and CRP** if symptoms are persistent or systemic.
- **Fecal calprotectin** if inflammatory-vs-functional distinction is needed.
- **Celiac screening** when symptoms and history fit.
- **GI referral** for alarm features such as blood in stool, weight loss, nocturnal diarrhea, anemia, fever, or repeated vomiting.[^6][^3]


## Food-first actions to map into the UI

For this module, the first-line recommendations should stay conservative and symptom-based:[^23][^1][^3]

- Smaller meals.
- Slow eating / less swallowed air.
- Hydration.
- Walking after meals.
- Fibre titration rather than sudden high fibre.
- Low-FODMAP trial for bloating-predominant patterns.
- Reduce carbonated drinks and sugar alcohols.
- Use peppermint or ginger only if tolerated.

If you want, I can now turn this into the **same handover-document format** as the 8-module spec, including a new **Module 9 section** and updated **Module 8 action-plan mappings**.
<span style="display:none">[^24][^25][^26][^27]</span>

<div align="center">⁂</div>

[^1]: https://pmc.ncbi.nlm.nih.gov/articles/PMC11986658/

[^2]: https://iffgd.org/gi-disorders/motility-disorders/

[^3]: https://www.aafp.org/afp/2019/0301/p301

[^4]: https://www.bluecrossnc.com/providers/policies-guidelines-codes/commercial/laboratory/notifications/fecal-calprotectin-testing-01-01-19

[^5]: https://pmc.ncbi.nlm.nih.gov/articles/PMC6646879/

[^6]: https://www.ruh.nhs.uk/pathology/documents/clinical_guidelines/PATH-013_Faecal_Calprotectin_Pathway_for_Primary_Care.pdf

[^7]: https://www.worldgastroenterology.org/publications/e-wgn/e-wgn-expert-point-of-view-articles-collection/appropriate-use-of-fecal-calprotectin

[^8]: https://pmc.ncbi.nlm.nih.gov/articles/PMC5316981/

[^9]: https://pmc.ncbi.nlm.nih.gov/articles/PMC5307310/

[^10]: https://emedicine.medscape.com/article/179937-overview

[^11]: https://pmc.ncbi.nlm.nih.gov/articles/PMC5026190/

[^12]: https://www.frontiersin.org/journals/nutrition/articles/10.3389/fnut.2025.1694831/full

[^13]: https://www.nature.com/articles/nrgastro.2018.7

[^14]: https://scholar.ui.ac.id/en/publications/second-asian-consensus-report-on-functional-dyspepsia-2025-update/

[^15]: http://www.annalsgastro.gr/index.php/annalsgastro/article/view/1198/943

[^16]: https://pmc.ncbi.nlm.nih.gov/articles/PMC4370835/

[^17]: https://www.frontiersin.org/journals/microbiomes/articles/10.3389/frmbi.2023.1192316/full

[^18]: https://jjgastro.com/articles/JJGR-v3-1171.html

[^19]: https://www.jnmjournal.org/journal/view.html?doi=10.5056%2Fjnm15167

[^20]: https://onlinelibrary.wiley.com/doi/full/10.1002/ueg2.70098

[^21]: https://ueg.eu/a/158

[^22]: https://www.cambridge.org/core/journals/british-journal-of-nutrition/article/gastrointestinal-wellbeing-in-subjects-reporting-mild-gastrointestinal-discomfort-characteristics-and-properties-of-a-global-assessment-measure/802100E1E6AB412718773BE4B2393594

[^23]: https://www.worldgastroenterology.org/UserFiles/file/guidelines/constipation-english-2025.pdf

[^24]: https://gut.bmj.com/content/71/9/1697

[^25]: https://doctordemaria.com/en/abdominal-bloating-2025-guide/

[^26]: https://www.mendeley.com/catalogue/8f3e7d97-cbea-3ee8-97e0-c6d50697cf77/

[^27]: https://my.clevelandclinic.org/health/diseases/dysmotility

