# HRV Integration Design Document: TeleTCM / Usaka Autonomic Bridge

**Version:** 1.0
**Classification:** Knowledge Architecture + Protocol Design Specification
**Audience:** Systems Architect · Content / Protocol Designer · Usaka Facilitator
**Date:** May 2026

> **Compliance Notice:** All outputs from this framework are framed as **wellness education and functional pattern observation**. Nothing in this document constitutes medical diagnosis, clinical prescription, or treatment advice. HRV data is used as a tracking and educational orientation tool, not a diagnostic instrument.[^1]

***

## Section 1: Overview — Role of HRV in the TeleTCM / Usaka Ecosystem

Heart rate variability (HRV) is the beat-to-beat fluctuation in the time interval between successive heartbeats. It is a fully non-invasive, accessible measure of cardiovascular and autonomic function, obtainable via ECG or PPG-based wearable devices. In technical terms, HRV captures the dynamic interplay between the sympathetic ("fight-or-flight") and parasympathetic ("rest-and-digest") branches of the autonomic nervous system (ANS). Higher resting HRV, particularly the high-frequency (HF) component (0.15–0.40 Hz), is a well-established index of parasympathetic / vagal modulation.[^2][^3][^1]

In the TeleTCM / Usaka ecosystem, QRMA and GDV already function as the primary scanning and energetic observation instruments, with TCM pattern logic mapping bioelectrical and functional findings to 13 patterns, 3 clusters, and a suite of wellness protocols. HRV is not a competing instrument — it is a **dynamic, continuously trackable autonomic readout** that:[^4]

1. **Validates and temporally enriches** static scan findings (QRMA / GDV scans are point-in-time; HRV can be measured daily).
2. **Bridges the stress–digestion–sleep triad** in a language that clients can observe themselves through consumer wearables.
3. **Quantifies protocol response** — as breathing, diet, movement, and sleep improve, HRV trends upward in a way that is legible, motivating, and educationally meaningful.
4. **Adds a real-time autonomic dimension** to Cluster B (Digestive–Gut–Liver Axis), which already maps to vagal withdrawal in the Clinical Correlation Matrix (CR-002: Spleen Qi Deficiency → "Vagal withdrawal leading to impaired gastric motility").[^5]

The core conceptual framing: **HRV is the autonomic / vagal tone bridge** that runs horizontally across all 8 modules of the Usaka journey and vertically across all three QRMA-GDV clusters. It does not replace QRMA or GDV — it sits **on top of** them as a meta-signal, giving the AI engine and human facilitator a real-time window into how much autonomic load a client is currently carrying, which in turn modulates how aggressively or gently any protocol cluster should be implemented.

***

## Section 2: Conceptual Integration — HRV Across Core Concepts, Clusters, and TCM Patterns

### 2.1 HRV as a Global Autonomic Meta-Signal

The existing Logic Layer already recognizes autonomic dysregulation at multiple points: CR-016 links elevated cortisol and adrenal asymmetry to HPA axis dysregulation; CR-001/CR-002 link reduced cardiac output and sympathetic overactivation to Heart Qi Xu and Blood Stasis; CR-002 in the Clinical Correlation Matrix explicitly names vagal withdrawal as the mechanism behind Spleen Qi Deficiency. What is missing is a **single quantitative number** that aggregates all of these autonomic stress signals into one trackable dimension.[^5][^4]

HRV fills that gap. Because vagal efferent outflow simultaneously innervates the sinoatrial node of the heart AND the entire gastrointestinal tract via the vagus nerve, a single HRV metric captures both cardiac and digestive autonomic tone simultaneously. An optimal level of HRV is associated with health and self-regulatory capacity, while reduced HRV indicates physiological stress, disease states, or compromised autonomic function.[^6][^7][^2][^1]

**Proposed meta-signal name: Autonomic Load Index (ALI).**
This is not an additional hardware measurement — it is a computed interpretive layer derived from client-reported or device-reported HRV that is mapped into the existing cluster and pattern logic (schema extension described in Section 4).

### 2.2 HRV Mapping to the 11 Core Functional Concepts (CPTs)

The table below maps each CPT to its HRV signature, direction, and the mechanism linking TCM pattern to autonomic physiology:

| CPT Code | TCM Pattern | HRV Signature | Primary Autonomic Mechanism | Logic Layer Link |
|---|---|---|---|---|
| CPT-LQS | Liver Qi Stagnation (肝气郁结) | **Reduced HRV; elevated LF/HF ratio; elevated sympathetic tone** | SNS overdrive, HPA axis dysregulation (hypercortisolemia), portal venous vasoconstriction impairs bile flow | CR-016: Cortisol elevated + Adrenal asymmetry → Liver Qi Stagnation[^4] |
| CPT-HQD | Heart Qi Deficiency / Shen Disturbance (心气虚) | **Very low HRV; reduced HF band; palpitation pattern** | Reduced vagal tone, poor baroreflex sensitivity, low cardiac output → disturbed Shen | CR-001: Reduced cardiac output, Heart sector < 3.8 J[^4]; Clinical Matrix CR-003: "low HRV" explicitly linked to Heart Blood Deficiency[^5] |
| CPT-SQD | Spleen Qi Deficiency / Dampness (脾气虚湿蕴) | **Reduced HRV; parasympathetic withdrawal** | Vagal withdrawal → impaired gastric motility, reduced digestive secretions, dysbiosis | CR-002 in Clinical Matrix: "Vagal withdrawal leading to impaired gastric motility"[^5]; Universal Bridge Row 1: "Vagus nerve modulation of ENS"[^8] |
| CPT-KQD | Kidney Qi / Jing Deficiency (肾气虚/肾精不足) | **Chronically low HRV; blunted circadian HRV rhythm** | HPA exhaustion → Kidney Yin depletion → loss of circadian cortisol rhythm; depleted Jing → reduced autonomic reserve | CR-016; Clinical Matrix CR-004: "late-stage adrenal exhaustion, loss of circadian cortisol rhythm"[^5] |
| CPT-YDF | Yin Deficiency with Empty Heat (阴虚内热) | **Low overall HRV; elevated resting HR; loss of HRV nocturnal rise** | Adrenal exhaustion, HPA dysregulation; sympathetic dominance persists into night; nocturnal HRV fails to recover | Pattern 05 Liver-Kidney Yin Deficiency: FT4 elevated, cortisol elevated, sleep domain < 80[^4] |
| CPT-PD | Phlegm-Damp Obstructing Middle (痰湿困脾) | **Low to moderate HRV; metabolic suppression of vagal tone** | Insulin resistance, elevated triglycerides, and visceral adiposity all independently reduce HRV | Pattern 07: metabolic syndrome parameters, Pancreas sector > 5.06 J[^4] |
| CPT-LS | Liver-Spleen Disharmony | **Episodically low HRV with stress-triggered dips** | Stress-mediated Wood-over-Earth: Liver Qi stagnation drives sympathetic surges that directly suppress gastric motility via splanchnic vasoconstriction | Cluster B root pattern: "Spleen Qi Deficiency with Damp + Liver-Spleen Disharmony"[^4] |
| CPT-HSD | Heart-Spleen Dual Deficiency (心脾两虚) | **Very low HRV with poor sleep domain scores** | Blood and Qi deficiency → reduced baroreflex sensitivity; Heart Blood fails to anchor Shen → chronic sympathetic alertness | Pattern 11: Heart sector < 3.7 J + Spleen meridian < 4.41 J + Sleep domain < 80[^4] |
| CPT-HKD | Heart-Kidney Disharmony (心肾不交) | **Low nocturnal HRV; inverted HRV rhythm (low at night)** | "Wired and tired" → autonomic neuropathy; disrupted HPA-HPG axis feedback; Water failing to rise / Fire failing to descend | Clinical Matrix CR-018: "Disrupted autonomic feedback loop, severe circadian rhythm dysfunction"[^5] |
| CPT-LSBS | Blood Stasis with Qi Stagnation (气滞血瘀) | **Very low HRV; elevated vascular stiffness markers** | Persistent Liver Qi stagnation drives blood hyperviscosity and cardiovascular autonomic imbalance | Pattern 09: Stress index > 3.0 GDV; blood viscosity elevated ++[^4] |
| CPT-LKD | Lung-Kidney Qi Deficiency (肺肾气虚) | **Low HRV; reduced respiratory sinus arrhythmia (RSA)** | Metal-Water deficiency → shallow breathing reduces RSA amplitude; Kidney fails to anchor Lung Qi → chronic respiratory autonomic under-stimulation | Pattern 08: VC/TLC reduced, Respiratory sector < 4.8 J[^4] |

### 2.3 HRV Across the Three Clusters

**Cluster A (Metabolic–Lipid Axis):** Low HRV is a downstream consequence of metabolic syndrome components. Elevated triglycerides, insulin resistance, and visceral adiposity all independently reduce HF-HRV by increasing sympathetic tone and impairing vagal modulation. HRV here is an effect indicator — as metabolic cluster severity increases, expect HRV to fall proportionally.[^2]

**Cluster B (Digestive–Gut–Liver Axis):** HRV is simultaneously a **driver** and an **indicator** in this cluster. Low HRV (vagal withdrawal) impairs gastric motility, reduces digestive enzyme secretion, increases intestinal permeability, and alters microbiota composition — mechanisms already present in CR-004 (Stomach/Spleen), CR-006 (dysbiosis), and CR-008 (detoxification). This is the highest-priority cluster for HRV integration, consistent with the existing B > A > C priority rule. IBS patients demonstrate higher LF/HF ratio and lower HF-HRV, confirming the autonomic contribution to gut-functional patterns.[^9][^10][^4][^6][^5]

**Cluster C (Structural–Connective Tissue Axis):** HRV is a background modulator. Chronic sympathetic dominance accelerates inflammatory processes relevant to connective tissue and bone (cortisol → bone resorption; catecholamines → pro-inflammatory cytokines → collagen degradation). HRV in this cluster is tracked to confirm whether structural rehabilitation protocols are supported by an adequate autonomic foundation.

### 2.4 HRV as a Stress–Digestion–Sleep Bridge

The gut–brain axis involves bidirectional communication between the brain and gut through hormonal and neural pathways, including top-down control of gastrointestinal motility and secretions via the sympathetic and parasympathetic divisions of the ANS. HRV sits precisely at the intersection of this axis — it is measurable at the heart, but reflects vagal output that simultaneously governs:[^11]

- **Digestive function:** motility, secretion, mucosal immunity
- **Sleep:** nocturnal HRV rise is the primary marker of sleep-phase parasympathetic recovery
- **Stress resilience:** HRV as "readout of how quickly the system returns to baseline after a stressor"

This three-way bridge is conceptually elegant for the Usaka educational journey because it allows facilitators to use one trackable number (daily morning RMSSD from a consumer wearable) to communicate the integrated status of all three domains to clients.

***

## Section 3: HRV in the 8-Module Journey

### 3.1 Module Architecture Overview

The 8-module journey divides as follows:
- **Weeks 1–4 (Modules 1–4):** Shared foundations — autonomic literacy, digestive basics, sleep, movement
- **Weeks 5–8 (Modules 5–8):** Controlled personalization along stress-regulation and digestive axes

For each module, three elements are specified: (a) HRV learning objective, (b) one or two HRV-linked practices, and (c) TCM pattern / cluster connection.

***

### Module 1 — Autonomic Literacy & HRV Introduction
*(Week 1 — Foundation: Stress & Nervous System)*

**HRV Learning Objective:** Clients understand that HRV is a non-invasive daily signal of autonomic balance — that it goes down under chronic stress, poor sleep, and digestive dysfunction, and that they can raise it through specific practices. The concept of "parasympathetic as healer" is introduced in both biomedical and TCM language (vagal tone = Qi flow / Wei Qi foundation).

**HRV Practices:**
- **Morning HRV baseline reading** (3–5 min supine, device-measured or app-guided): establishes personal baseline before intervention begins.
- **"Physiological sigh"** (double inhale through nose + extended exhale through mouth, 3–5 cycles): fastest evidence-grounded autonomic downregulation technique for introducing the concept.

**TCM Connection:** CPT-LQS (Liver Qi Stagnation) — introduced as "sympathetic overdrive pattern." GDV Psychology domain < 74 + elevated Stress Index > 4.5 → explain as energetic signature of low HRV state. Pattern 01 Liver Qi Stagnation: HPA axis dysregulation + SNS overdrive = Wood element in chronic tension.[^4][^5]

***

### Module 2 — Breathing as Autonomic Medicine
*(Week 2 — Foundation: Vagal Activation)*

**HRV Learning Objective:** Clients understand that breathing at approximately 6 breaths per minute (resonance frequency) maximally stimulates the baroreflex and produces the largest amplitude of RSA oscillations, acutely raising HRV. They learn the 4:6 inhale-to-exhale ratio as the most effective simple protocol.[^12][^13]

**HRV Practices:**
- **Resonance Breathing (6 bpm, 4:6 ratio, 20 min/day):** Four weeks of 20-minute daily resonance breathing significantly improves SDNN, pNN50, increases parasympathetic activity, and decreases sympathetic activity. App-guided (e.g., HRV4Biofeedback protocol): inhale 4 seconds, exhale 6 seconds, repeat 20 minutes daily.[^14]
- **Pre-meal vagal warm-up (HRV Micro-Protocol V1):** 3 minutes of nasal-only, slow-exhale breathing before each main meal. Mechanism: activates cephalic phase digestion, stimulates gastric acid and enzyme secretion via vagal efferents before food arrives.

**TCM Connection:** Box breathing and lateral costal breathing are already prescribed for Pattern 01 (Liver Qi Stagnation) in Section 6.1 of the Logic Layer. This module gives that prescription the physiological mechanism: LR-3 & PC-6 acupoint stimulation induces "sympathovagal shift" (Universal Bridge Row 5) — exactly what resonance breathing achieves through respiratory mechanics. Cluster B: vagal activation = Spleen Qi restoration (CR-002 in Clinical Matrix).[^8][^5][^4]

***

### Module 3 — Digestive Foundations & the Gut–Vagus Connection
*(Week 3 — Foundation: Digestive Basics)*

**HRV Learning Objective:** Clients understand that the vagus nerve is the physical anatomy of what TCM calls the Stomach and Spleen's "upward-bearing and downward-descending" function. Low HRV = vagal withdrawal = impaired gut motility, reduced digestive enzymes, increased intestinal permeability, and dysbiosis. Higher HRV = rest-and-digest = Spleen Qi transformation and transportation restored.[^15][^7][^6]

**HRV Practices:**
- **HRV Micro-Protocol V1** (Pre-meal vagal warm-up — see Module 2): reinforced and made habitual in this module.
- **Post-meal HRV walk (HRV Micro-Protocol V2):** 10–15 minute slow (60–70% max HR) walk within 30 minutes of lunch. Mechanism: light movement stimulates gastric motility via mechanoreceptors while maintaining parasympathetic dominance; avoids the sympathetic suppression of digestion caused by intense post-meal exercise.

**TCM Connection:** Cluster B core pattern — Spleen Qi Deficiency with Damp (Pattern 03) and Liver-Spleen Disharmony. CR-004 (Stomach peristalsis) and CR-006 (Gut bacteria index) are both addressable through vagal enhancement. Logic Layer digestive sub-track activation: when B-P1 (stomach peristalsis reduced) and B-P7 (Spleen meridian < 4.41 J) are both true, HRV micro-protocol V1 and V2 become first-line lifestyle interventions before supplements are layered.[^4]

***

### Module 4 — Sleep as Autonomic Recovery
*(Week 4 — Foundation: Sleep & Circadian Restoration)*

**HRV Learning Objective:** Sleep quality is the single strongest predictor of nocturnal HRV. Fragmented sleep elevates sympathetic tone and suppresses the parasympathetic dominance needed for overnight recovery. Clients learn that their morning HRV score is primarily a readout of last night's sleep quality — not a static trait but a daily response variable.[^16]

**HRV Practices:**
- **Evening sleep wind-down breathing (HRV Micro-Protocol V3):** 5–10 minutes of slow breathing (5–6 bpm, extended exhale) performed in bed before sleep. Mechanism: reduces cortisol, lowers HR, shifts to parasympathetic dominance, primes the parasympathetic nocturnal rise that characterizes healthy sleep architecture.
- **Sleep-timing anchor protocol:** Sleep before 11 PM consistently — maps to the TCM Gallbladder hour (11 PM–1 AM) and Liver hour (1–3 AM) in the organ clock, precisely when vagal dominance and HRV should be highest for deep recovery.[^4]

**TCM Connection:** Pattern 11 (Heart-Spleen Dual Deficiency): Sleep domain < 80 + Heart sector < 3.7 J. Clinical Matrix CR-018 (Heart & Kidney Non-Intersection): "disrupted autonomic feedback loop, severe circadian rhythm dysfunction." Kidney Yin Deficiency (Pattern 05): sleep domain failure = loss of nocturnal parasympathetic recovery, confirmed by "HPA axis exhaustion, loss of circadian cortisol rhythm."[^5][^4]

***

### Module 5 — Personalized Stress Regulation: HRV Biofeedback
*(Week 5 — Personalization: Autonomic Regulation)*

**HRV Learning Objective:** Clients now have 4 weeks of baseline HRV data. In this module, they perform a personal resonant frequency assessment (breathing from 6.5 to 4.5 bpm in 0.5-bpm steps) to identify their individual optimal breathing rate — which for adults typically falls between 4.5–6.5 bpm. They learn that the goal is maximizing RSA (respiratory sinus arrhythmia) amplitude, not hitting a fixed number.[^12]

**HRV Practices:**
- **Individualized HRV biofeedback (full protocol):** 2 × 20-minute sessions daily at personal resonant frequency, 4:6 ratio. Four weeks of this protocol yields SDNN improvement, reduced perceived stress, and improved cognitive performance.[^13][^14]
- **In-the-moment reset (HRV Micro-Protocol V4):** Any time stress spikes (pre-meeting, pre-meal, emotional activation) — 6 breath cycles at resonant frequency. Functions as a rapid ANS reset tool. Primary effect: down-regulate.

**TCM Connection:** For CPT-LQS clients (Pattern 01, high cortisol, adrenal asymmetry): this module delivers the "vagal tone withdrawal recovery" named in Universal Bridge Row 5 (LR-3 & PC-6). For CPT-HQD clients (Pattern 06, Heart Qi Deficiency): this protocol supports "Cholinergic anti-inflammatory pathway activation; Vagus nerve tone restoration" (Universal Bridge Row 15).[^8]

***

### Module 6 — Movement as HRV Medicine
*(Week 6 — Personalization: Movement & Physical Regulation)*

**HRV Learning Objective:** HIIT (high-intensity interval training) ranks as one of the strongest interventions for improving SDNN, RMSSD, and LF/HF ratio. However, the type and timing of exercise must match the client's current HRV level: if morning HRV is very low (autonomic overload), only gentle movement is appropriate that day; if HRV is in the adaptive range, moderate-to-vigorous exercise will produce HRV gains. This module introduces HRV-guided movement as a practical daily skill.[^16]

**HRV Practices:**
- **HRV-guided exercise selection:** very low HRV day → HRV Micro-Protocol V1 (pre-meal breathing) + gentle walk only; low-adaptive HRV day → moderate aerobic (Tai Chi, Ba Duan Jin, brisk walk); adaptive-to-high HRV → full training session.
- **Post-meal walk (HRV Micro-Protocol V2):** reinforced as daily non-negotiable for Cluster B.

**TCM Connection:** Ba Duan Jin Qigong and aerobic movement are already in Pattern 01 (Liver Qi Stagnation) protocol and Pattern 07 (Phlegm-Damp). Movement type and intensity guidance can now be HRV-gated: a client in Pattern 07 (Phlegm-Damp) with very low HRV should not be pushed into vigorous damp-resolving exercise immediately — the autonomic foundation must be partially restored first (estimated 2–3 weeks of resonance breathing before adding vigorous exercise).[^4]

***

### Module 7 — Emotional Regulation & Shen Restoration
*(Week 7 — Personalization: Emotional & Psychological Regulation)*

**HRV Learning Objective:** Emotional dysregulation acutely suppresses HRV. The TCM Heart governs the Shen (神) — emotional clarity, mental coherence — and the Heart Blood / Yin Deficiency pattern explicitly includes "melatonin/serotonin dysregulation; autonomic neuropathy" and calls for "Vagus nerve tone restoration." Clients learn that positive emotional states, gratitude practices, and social bonding all demonstrably improve HRV.[^8]

**HRV Practices:**
- **Gratitude HRV practice:** 5-minute evening HRV-coherence session (slow breathing + intentional positive emotional focus). Gratitude journaling exercises have been shown to increase HRV.[^17]
- **HRV Micro-Protocol V4 (in-the-moment reset):** Reinforced here as the primary tool for emotional trigger management — specifically for CPT-LQS (Liver Qi Stagnation) clients where "Liver stores blood and emotion."[^18]

**TCM Connection:** Pattern 11 (Heart-Spleen Dual Deficiency), Pattern 06 (Heart Qi Deficiency with Blood Stasis), CPT-HQD (Heart Qi Deficiency / Shen Disturbance). Universal Bridge Row 15 (Heart Blood/Yin Deficiency): "Cholinergic anti-inflammatory pathway activation; Vagus nerve tone restoration." Clinical Matrix CR-018 (Heart-Kidney Non-Intersection): grounding + cooling practices + autonomic feedback loop restoration.[^8][^5][^4]

***

### Module 8 — Integration, Tracking, and Longitudinal HRV Trajectory
*(Week 8 — Integration)*

**HRV Learning Objective:** Clients understand their HRV trend over the 8-week journey as evidence of pattern change. A rising HRV trend correlates with cluster severity reduction — particularly in Cluster B. They can now read their daily HRV as a proxy for: "How ready is my digestion today? How much autonomic load am I carrying? Which micro-protocol does my body need right now?"

**HRV Practices:**
- **Personal HRV journal review:** compare Week 1 baseline RMSSD vs. Week 8 RMSSD; correlate with subjective digestive symptom scores and GDV re-scan data.
- **Protocol maintenance plan:** which of the 5 micro-protocols (see Section 5) become permanent daily tools vs. situational tools.

**TCM Connection:** All clusters and patterns. The 8-week HRV trajectory serves as a functional biomarker of Usaka protocol effectiveness — a pre/post "autonomic age" comparison that is educationally compelling for clients and provides pattern-change data to the AI engine.

***

### 3.2 Digestive Sub-Track HRV Mapping (Cluster B Protocols)

For clients whose primary cluster is B (Digestive-Gut-Liver Axis), the following HRV overlays are applied on top of the standard module journey:

| Module | Digestive Sub-Track HRV Addition |
|---|---|
| Module 1 | Introduce concept: "Your gut is stressed when your HRV is low" — link vagal score to gut symptom tracking |
| Module 2 | Pre-meal breathing V1 becomes the highest-priority practice for the entire sub-track |
| Module 3 | HRV-guided meal environment: eat only when HRV is in adaptive range; if morning HRV is very low, eat warm, easy-to-digest foods only (congee/porridge protocol) |
| Module 4 | Sleep-before-11pm becomes non-negotiable as the primary tool for cluster B severity reduction |
| Module 5 | Introduce the concept: stress identification = gut attack identification; HRV dip = symptom prediction tool |
| Module 6 | Post-meal walk V2 every meal; HRV-gated exercise intensity |
| Module 7 | Emotional trigger → HRV dip → gut symptom chain: "You can now see the stress-digestion connection in real-time" |
| Module 8 | Gut symptom score vs. HRV trend correlation; Cluster B re-assessment framing |

***

## Section 4: Logic Layer Extension — Schema, Thresholds, and Decision Logic

### 4.1 Schema Integration: Where HRV Sits

HRV should be added to the existing schema as follows:

**4.1.1 New column in `client_scans`:**
```sql
hrv_rmssd FLOAT,              -- Morning RMSSD in milliseconds (primary HRV metric)
hrv_sdnn FLOAT,               -- SDNN in milliseconds (secondary)
hrv_lf_hf_ratio FLOAT,        -- LF/HF ratio (sympathovagal balance)
hrv_measurement_date DATE,    -- Date of HRV measurement
hrv_device_source VARCHAR(50), -- e.g., 'Garmin', 'Polar', 'Apple Watch', 'manual_app'
hrv_measurement_context ENUM('morning_supine','morning_standing','evening','other'),
autonomic_load_index ENUM('very_low','low','adaptive','high') -- Derived; see threshold table
```

**4.1.2 New table: `hrv_parameters`**
```sql
CREATE TABLE hrv_parameters (
  hrv_entry_id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  client_id VARCHAR(36) NOT NULL,
  measurement_date DATE NOT NULL,
  rmssd FLOAT,
  sdnn FLOAT,
  lf_hf_ratio FLOAT,
  device_source VARCHAR(50),
  measurement_context ENUM('morning_supine','evening','other'),
  autonomic_load_index ENUM('very_low','low','adaptive','high'),
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**4.1.3 New parameter in `qrma_parameters` (conceptual):**
If HRV can be integrated as a scored input to the engine (e.g., from wearable API or self-reported morning measurement), add:

```
parameter_id: BIOM-HRV-001
module_name: Autonomic / Cardiac
parameter_name: HRV RMSSD Morning
cluster_association: AB  (primary Cluster B driver; secondary Cluster A)
abnormality_direction: reduced  (low RMSSD = concern)
clinical_weight: 4
tcm_organ_affinity: Heart, Spleen, Liver
```

### 4.2 Autonomic Load Index (ALI) — Threshold Bands

The ALI converts raw HRV (RMSSD) into a four-band interpretive index that maps directly to TCM pattern likelihood and protocol emphasis. Note: HRV norms are highly individual, device-dependent, and age/sex-stratified — these bands should be calibrated to client baseline after at least 2 weeks of tracking, not applied as absolute population norms.[^19][^1]

| ALI Band | RMSSD Range (Illustrative) | TCM Pattern Cluster | Protocol Emphasis | Autonomic Interpretation |
|---|---|---|---|---|
| **Very Low** | < 20 ms (or < personal 10th percentile) | CPT-HQD (Heart Qi Deficiency / Shen), CPT-LQS (Liver Qi Stagnation) severe, CPT-KQD (Kidney Yin/Yang Deficiency) | **Autonomic regulation FIRST** — before all else. Apply HRV Micro-Protocols V1, V3, V4 immediately. Reduce all stimulants, cold, and raw foods. | Severe vagal withdrawal; high sympathetic dominance; risk of visceral hypersensitivity; digestive function significantly compromised[^20][^1] |
| **Low** | 20–40 ms (or personal 10th–30th percentile) | CPT-LQS, CPT-SQD, CPT-LS (Liver-Spleen Disharmony), Cluster B moderate | **Digestive + stress regulation co-priority.** Add V2 (post-meal walk). Consider Cluster B protocol with warming foods. HRV biofeedback 2× daily. | Suboptimal vagal tone; digestive motility and microbiome under pressure; early IBS-like symptoms predictable[^9] |
| **Adaptive** | 40–70 ms (or personal 30th–70th percentile) | Any pattern, manageable severity | **Pattern-specific protocols.** Standard cluster A/B/C protocol as per Logic Layer. HRV biofeedback as maintenance (1× daily). | Reasonable autonomic flexibility; system can begin pattern-specific rehabilitation | 
| **High** | > 70 ms (or personal > 70th percentile) | Any pattern, improving; may reflect favorable response to protocol | **Consolidation and depth work.** Add HIIT, Qigong, progressive challenge. Structural axis work (Cluster C) becomes feasible. | Strong parasympathetic tone; good digestive-autonomic foundation; pattern resolution more responsive[^16][^17] |

> **Implementation note:** These bands are for educational orientation only. HRV is sensitive to artifacts, ectopic beats, and signal quality issues that can substantially distort results. Device variation and low sampling frequencies (< 1000 Hz) further compromise accuracy. All ALI classifications should use 7-day rolling averages, not single-day readings, and be reviewed by a facilitator, not used as standalone diagnostic triggers.[^21][^1]

### 4.3 HRV-Mediated Cluster Prioritization Logic

The existing Logic Layer states: priority sequence B > A > C when clusters co-activate. HRV adds a **modulating override** to this rule:[^4]

```
FUNCTION determine_protocol_priority(cluster_scores, ali_band):
  IF ali_band == 'very_low':
    OVERRIDE_PRIORITY = "AUTONOMIC_FIRST"
    -- Regardless of cluster scores, begin with:
    -- 1. HRV Micro-Protocols V1 (pre-meal breathing), V3 (sleep wind-down), V4 (reset)
    -- 2. Warm diet, cooked foods, no cold/raw
    -- 3. Sleep regularization before 11 PM
    -- 4. NO vigorous exercise until ALI reaches 'low'
    -- Delay supplement loading until ALI >= 'low'
  ELIF ali_band == 'low':
    MAINTAIN B > A > C priority
    ADD HRV practices to Cluster B protocol
    REDUCE intensity of Cluster A metabolic interventions (no aggressive detox)
  ELIF ali_band == 'adaptive' OR 'high':
    STANDARD cluster priority B > A > C applies
    FULL protocol stack is appropriate
    ADD HRV biofeedback as enhancement layer
```

**Key clinical rationale:** When Clusters B and A are both active but HRV is very low, pushing aggressive dietary interventions (high-fibre, fermented foods, bitter liver support) can overwhelm an already compromised enteric nervous system. The physiological logic: without adequate vagal tone, intestinal motility cannot respond to even well-designed dietary interventions — the nervous system infrastructure must be partially restored first.[^22][^23]

### 4.4 HRV-Mediated Pattern Differentiation

HRV resolves a key diagnostic ambiguity in the Logic Layer: **distinguishing a pure digestive Spleen Qi Deficiency from a stress-dominant digestive picture**.

| Scenario | QRMA/GDV Findings | HRV Profile | Differentiated Pattern | Protocol Implication |
|---|---|---|---|---|
| Pure digestive Spleen Qi Deficiency | Stomach peristalsis ↓, gut bacteria imbalanced, Spleen meridian < 4.41 J | ALI = **Adaptive or Low** (not very low) | Pattern 03: Primary digestive origin — constitutional, dietary, or post-illness | Lead with warming foods, Spleen tonification; HRV practices as support |
| Stress-dominant digestive picture | Same QRMA/GDV findings PLUS | ALI = **Very Low or Low** | Pattern 03 + CPT-LQS overlay: Liver overacting on Spleen under chronic stress | Lead with HRV / autonomic regulation; add digestive support only after ALI improves |
| Heart-Spleen Dual Deficiency with anxiety | Heart sector < 3.7 J + Spleen < 4.41 J + Sleep domain < 80 | ALI = **Very Low** | Pattern 11: Heart governs Shen; Shen disturbance → chronic sympathetic arousal → Spleen suppressed | Shen-settling (HRV + sleep) first; digestive protocol second |

**Additional differentiation: Yin Deficiency vs. Yang Deficiency digestive subtypes:**
- **Yin-deficient digestive subtype** (Pattern 05 + Cluster B): Night sweats, dry mouth at night, restless at 1–3 AM → HRV shows very low nocturnal rise, early AM suppression. Protocol: cooling Yin-nourishing foods + sleep anchor + HRV Micro-Protocol V3.
- **Yang-deficient digestive subtype** (Pattern 04 + Cluster B): Cold limbs, loose stools at dawn, low energy → HRV overall low but relatively stable; no nocturnal inversion. Protocol: warming Yang foods + Mingmen fire practices + gentle morning movement.

***

## Section 5: HRV-Aligned Protocol Micro-Library

Five reusable HRV micro-protocols, named and tagged for implementation across modules and patterns:

***

### MP-V1 — Pre-Meal Vagal Warm-Up
| Attribute | Specification |
|---|---|
| **Name** | Pre-Meal Vagal Warm-Up (MP-V1) |
| **Duration** | 3 minutes |
| **Timing** | 3–5 minutes before any main meal |
| **Primary Effect** | Down-regulate sympathetic → activate parasympathetic (cephalic phase digestion) |
| **Technique** | Sit quietly, nasal breathing only. Inhale 4 seconds, exhale 6–8 seconds (longer exhale activates vagal brake). 12–15 breath cycles. Eyes closed or soft gaze. |
| **Physiological Mechanism** | Extended exhale stimulates vagal efferents to the sinoatrial node (increases HRV) and simultaneously activates vagal efferents to the stomach, triggering cephalic phase gastric acid and enzyme release before food arrives.[^6][^7] |
| **Digestive Outcome** | Improved gastric motility, optimal enzyme secretion timing, reduced post-meal bloating |
| **Suitable Clusters/Patterns** | **Cluster B (primary):** All digestive patterns — Pattern 03 (Spleen Qi Deficiency), Pattern 07 (Phlegm-Damp), Liver-Spleen Disharmony. Also suitable for any ALI = very low or low client before each meal. |
| **TCM Frame** | Activating Stomach's "receiving" function (胃受纳 Wèi shòu nà) before food arrives; restoring Spleen-Stomach Qi descent |

***

### MP-V2 — Post-Meal Digestive Walk
| Attribute | Specification |
|---|---|
| **Name** | Post-Meal Digestive Walk (MP-V2) |
| **Duration** | 10–15 minutes |
| **Timing** | Within 30 minutes after lunch (1–3 PM, Small Intestine hour) |
| **Primary Effect** | Maintain parasympathetic digestive dominance + stimulate peristalsis |
| **Technique** | Slow, relaxed walking at 50–60% max HR (conversational pace). Nasal breathing encouraged. No phone use. |
| **Physiological Mechanism** | Gentle movement promotes gastric emptying and small intestinal transit via mechanical stimulation; low-intensity exercise avoids splanchnic vasoconstriction that would suppress digestion.[^15] |
| **Digestive Outcome** | Improved post-meal motility, enhanced nutrient absorption window (Small Intestine peak 1–3 PM), reduced post-meal blood glucose spike |
| **Suitable Clusters/Patterns** | **Cluster B (primary):** Spleen Qi Deficiency with Damp (Pattern 03), Phlegm-Damp (Pattern 07), Liver-Spleen Disharmony. **Cluster A (secondary):** metabolic support for Pattern 07 insulin resistance. |
| **TCM Frame** | Supporting Small Intestine separation of clear and turbid (泌别清浊); leveraging 1–3 PM absorption peak from organ clock.[^4] |

***

### MP-V3 — Sleep Wind-Down Breathing
| Attribute | Specification |
|---|---|
| **Name** | Sleep Wind-Down Breathing (MP-V3) |
| **Duration** | 5–10 minutes |
| **Timing** | In bed, 15–20 minutes before intended sleep time |
| **Primary Effect** | Sleep-prime; initiate nocturnal HRV rise |
| **Technique** | Supine position. Inhale 4 seconds (nasal), exhale 6–8 seconds (nasal or pursed lips). No audio distractions. Optional: hand on abdomen to confirm diaphragmatic breathing. |
| **Physiological Mechanism** | Slow breathing reduces cortisol, lowers resting HR, primes the parasympathetic shift required for sleep onset and deep slow-wave sleep, which is when nocturnal HRV rises to its daily maximum.[^16][^17] |
| **Digestive Outcome** | Improved overnight gut repair and microbiota activity; reduced cortisol-driven intestinal permeability during sleep |
| **Suitable Clusters/Patterns** | **All clusters** when Sleep domain < 80. Priority for Pattern 05 (Yin Deficiency with Empty Heat — nocturnal symptoms), Pattern 11 (Heart-Spleen — insomnia/anxiety), Clinical Matrix CR-018 (Heart-Kidney Non-Intersection).[^5][^4] |
| **TCM Frame** | Allowing Liver blood storage (1–3 AM Liver hour); entering Gallbladder hour (11 PM–1 AM) in deep parasympathetic state; nourishing Shen during sleep.[^4] |

***

### MP-V4 — In-the-Moment ANS Reset
| Attribute | Specification |
|---|---|
| **Name** | In-the-Moment ANS Reset (MP-V4) |
| **Duration** | 60–90 seconds (6 breath cycles) |
| **Timing** | Any time a stress trigger is identified: pre-meeting, emotional activation, pre-eating-under-stress, before a difficult conversation |
| **Primary Effect** | Acute down-regulate + reset |
| **Technique** | Wherever the client is (standing, sitting, walking). 6 slow breath cycles at personal resonant frequency (~6 bpm; inhale 4–5 seconds, exhale 5–7 seconds). Can be combined with LR-3 acupressure (press between 1st and 2nd toe) for CPT-LQS clients. |
| **Physiological Mechanism** | 6 breath cycles at resonance frequency is sufficient to acutely elevate HRV and reduce cortisol response; baroreflex stimulation activates vagal outflow within seconds.[^14][^12] |
| **Digestive Outcome** | Prevents stress-induced gut motility disruption; interrupts the "liver-overacting-on-spleen" cascade in real-time |
| **Suitable Clusters/Patterns** | **CPT-LQS (primary):** Liver Qi Stagnation — emotional trigger management. **ALI = very low / low:** Emergency parasympathetic activation. **Cluster B:** Any stress-dominant digestive presentation. |
| **TCM Frame** | LR-3 & PC-6 "sympathovagal shift" mechanism; restoring Liver's coursing and discharging function (疏泄 shū xiè) in real time.[^8][^4] |

***

### MP-V5 — Full HRV Biofeedback Session
| Attribute | Specification |
|---|---|
| **Name** | Full HRV Biofeedback Session (MP-V5) |
| **Duration** | 20 minutes |
| **Timing** | Morning (preferred) or evening — not within 1 hour of vigorous exercise or within 1 hour of sleep |
| **Primary Effect** | Structural HRV improvement; baroreflex sensitization; long-term parasympathetic upregulation |
| **Technique** | App-guided resonance breathing at individual resonant frequency (4.5–6.5 bpm, determined in Module 5). Inhale:exhale 4:6 ratio. Diaphragmatic breathing. 20 minutes continuous. Aim for 5–7 sessions/week for structural benefit.[^13] |
| **Physiological Mechanism** | Sustained slow-paced breathing at resonance frequency maximizes RSA amplitude, increases baroreflex gain over time, and produces durable improvements in SDNN and RMSSD across weeks.[^14][^12][^13] Omega-3 supplementation (EPA/DHA) enhances HRV improvement by increasing HF power and providing anti-inflammatory support to vagal signaling.[^24] |
| **Digestive Outcome** | Via sustained vagal upregulation: improved motility, enhanced mucosal immunity, reduced visceral hypersensitivity, microbiome diversity support |
| **Suitable Clusters/Patterns** | **All clusters** — especially as the foundational practice once ALI reaches "low" or above. CPT-HQD (Heart Qi Deficiency): primary long-term intervention. CPT-LQS (Liver Qi Stagnation): replaces cortisol-elevating exercise on high-stress days. |
| **TCM Frame** | "Vagal tone withdrawal recovery" (Universal Bridge Row 5, LQS); "Vagus nerve tone restoration" (Universal Bridge Row 15, HQD).[^8] Tonifies Wei Qi through breath; strengthens the Spleen–Heart communication axis. |

***

### 5.1 HRV Micro-Protocol Quick Reference

| Protocol | Code | Time of Day | Duration | Primary Effect | Patterns | ALI Threshold |
|---|---|---|---|---|---|---|
| Pre-Meal Vagal Warm-Up | MP-V1 | Pre-meal | 3 min | Pre-digest, down-regulate | Cluster B all | All — especially very low |
| Post-Meal Digestive Walk | MP-V2 | Post-lunch | 10–15 min | Peristalsis, maintain PNS | Cluster B, A (P07) | Low–adaptive |
| Sleep Wind-Down Breathing | MP-V3 | Evening / bed | 5–10 min | Sleep-prime | All — esp. P05, P11, CR-018 | All |
| In-the-Moment ANS Reset | MP-V4 | Any time | 60–90 sec | Reset, acute down-regulate | CPT-LQS, Cluster B | Any trigger |
| Full HRV Biofeedback | MP-V5 | Morning / evening | 20 min | Structural HRV gain | All — esp. HQD, LQS | Low or above |

***

## Section 6: Digestive Axis Deep Dive — Cluster B + HRV

### 6.1 Mechanistic Pathway: Low HRV → Cluster B Severity

**Spleen Qi Deficiency with Damp (Pattern 03) — Autonomic Mechanism:**

Sympathetic dominance (low HRV) suppresses gastric motility via two pathways: (1) direct sympathetic vasoconstriction of splanchnic blood flow, reducing gastric wall oxygenation; and (2) inhibition of the enteric nervous system's myenteric plexus, reducing the amplitude and frequency of peristaltic contractions. The result is exactly the QRMA findings that trigger Pattern 03 activation: reduced stomach peristalsis (B-P1), reduced small intestine absorption (B-P2), and gut bacteria imbalance (B-P4) — because a motility-slowed gut provides the substrate for bacterial overgrowth.[^20][^11][^6][^4]

Reduced vagal tone also decreases pancreatic enzyme secretion and gallbladder contraction, directly impairs the "Spleen's transformation and transportation" (运化 yùn huà) function at a physiological level. Blood glucose dysregulation follows because lower enzyme activity means impaired carbohydrate digestion, while insulin sensitivity declines with chronic sympathetic overactivation — consistent with Pattern 03's blood glucose criterion.[^25][^4]

**Liver-Spleen Disharmony — The Stress-Digestion Loop:**

The Cluster B root pattern explicitly names "Liver-Spleen Disharmony" as its TCM root alongside Spleen Qi Deficiency. The mechanism: under chronic stress, the Liver (Wood element) overacts on the Spleen (Earth element). Physiologically, this is the HPA axis → elevated cortisol → increased intestinal permeability ("leaky gut") → dysbiosis → systemic low-grade inflammation → further HPA activation (a reinforcing loop). Low HRV is both a marker of this loop being active AND a target for breaking it.[^15][^22][^4]

Bile flow impairment adds a further dimension: vagal efferents control gallbladder contraction; reduced vagal tone means sluggish bile release, impaired fat emulsification, and elevated DBIL (directly triggering CR-003 in the Logic Layer: "Liver Qi Stagnation generating damp-heat without lipid elevation yet"). This connects Cluster B directly to NAFLD risk, as named in the Cluster B downstream risk statement.[^4]

**IBS-pattern Visceral Hypersensitivity:**
Increased sympathetic nervous system activity and decreased parasympathetic activity are the most frequently noted autonomic signs in IBS, leading to visceral hypersensitivity — a lowered threshold for pain in the internal organs associated with functional GI disorders. Higher HRV demonstrates moderate impact on IBS symptoms in systematic review. Slow deep breathing intervention improves symptoms and alters rectal sensitivity in patients with constipation-predominant IBS-like patterns.[^26][^27][^10][^28][^20]

### 6.2 Seven-to-Fourteen-Day Digestive HRV Bridge (Weeks 1–4, Cluster B Sub-Track)

This protocol sits inside Weeks 1–4 of the Usaka foundation phase, specifically for clients with active Cluster B (moderate or severe) and ALI = very low or low.

| Day | Daily Theme | HRV Practice | Digestive Action | Tracking Suggestion |
|---|---|---|---|---|
| **Day 1** | Baseline + education | Morning HRV measurement (supine, 3 min) | Warm congee breakfast only; avoid all cold/raw foods | Log: gut symptom score (bloating, bowel timing), morning RMSSD |
| **Day 2** | Pre-meal activation | MP-V1 (3 min before each meal) | Warm cooked lunch and dinner; no eating after 7 PM | Log: post-meal comfort score (0–10) |
| **Day 3** | Sleep anchor | MP-V3 (in-bed, 7 min) | Same diet + sleep before 10:30 PM | Log: sleep quality, morning RMSSD compared to Day 1 |
| **Day 4** | Post-meal movement | Add MP-V2 after lunch | Introduce 1 tsp apple cider vinegar (diluted) pre-meal for bitter/sour digestive activation (Pattern 01 / 03 food protocol)[^4] | Log: afternoon energy, post-lunch bloating |
| **Day 5** | Emotional awareness | MP-V4 when any stress arises | Add fermented foods (small amount — tempeh or yogurt) only if motility is improving | Log: stress episodes, gut-reaction timing |
| **Day 6** | Breathing rhythm | Introduce 10-min resonance breathing session (MP-V5 abbreviated) | Continue warm food protocol; add ginger tea (ginger is prescribed in Pattern 03 / 07 protocols)[^4] | Log: morning RMSSD vs. Day 1 |
| **Day 7** | First assessment | Compare RMSSD trend Days 1–7; review gut symptom scores | If RMSSD is trending up (even +2–5 ms): reinforce all practices | Client reflection: "When my HRV goes up, what else changes?" |
| **Days 8–10** | Deepen breathing | MP-V5 (full 20 min morning) begins | Add probiotic/prebiotic foods; continue warm food protocol | Log: RMSSD daily; start weekly average |
| **Days 11–12** | Movement integration | MP-V2 morning and post-lunch; add gentle Tai Chi or Ba Duan Jin | If bloating has reduced > 30%: introduce slightly more dietary variety (cooked vegetables, lightly fermented) | Log: exercise type, post-exercise HRV comparison |
| **Days 13–14** | Integration + next phase planning | All 5 micro-protocols established; review which feel most impactful | Gut symptom score 14-day comparison; document trigger patterns | RMSSD 14-day average vs. baseline; connect to GDV re-scan scheduling |

**Expected HRV-to-Digestive Improvement Trajectory:**
- Days 1–3: ALI may remain very low; digestive improvement from food changes alone; HRV stabilizes.
- Days 4–7: First measurable HRV increase expected from MP-V1 + MP-V3 combination; gut motility begins to normalize as vagal tone partially restores.
- Days 8–14: If resonance breathing practice is consistent, RMSSD typically rises 5–15% from baseline in 2 weeks; this correlates with measurable reduction in post-meal bloating, improved bowel regularity, and reduced visceral sensitivity — consistent with the literature on slow breathing in IBS-like presentations.[^29][^14][^26]

The gut–brain axis literature supports this trajectory: interventions that restore vagal activity — including lifestyle changes, dietary modifications, and probiotics — directly modulate HPA axis activity, immune function, and neurotransmitter balance. In the TCM frame, this sequence maps as: restore Wei Qi (vagal foundation) → transform Damp (dysbiosis resolution) → strengthen Spleen Qi (motility normalization) → resolve Liver-Spleen disharmony (cortisol loop interrupted).[^22]

***

## Section 7: Constraints, Caveats, and Recommended Next Steps

### 7.1 HRV Measurement Limitations

The following must be clearly communicated to facilitators and built into the AI engine's disclaimer logic:

1. **Artifact sensitivity:** HRV measurement is extremely sensitive to artifacts, ectopic beats, and signal quality issues that can substantially distort results. A single high-artifact reading can make HRV appear falsely low or high. Always use 7-day rolling averages, never single-day readings, for protocol decisions.[^1]
2. **Device variation:** Consumer wearables (optical PPG sensors in watches and fitness bands) provide plausible RMSSD estimates but are less accurate than ECG-based measurement, particularly during exercise or with darker skin tones. Devices sampling at frequencies below 1000 Hz compromise accuracy. The ALI bands in Section 4.2 should be calibrated to the specific device being used, not cross-compared between devices.[^21]
3. **Inter-individual variability:** Physical fitness, body composition, age, sex, and genetic factors contribute substantial inter-individual variability, making universal normal ranges clinically unreliable. An RMSSD of 30 ms may be excellent for a 65-year-old and concerning for a 25-year-old.[^19][^1]
4. **Medication effects:** Beta-blockers and anticholinergics dramatically alter HRV independent of disease status or lifestyle. Always collect medication history before HRV interpretation.[^1]
5. **Non-specificity:** The non-specific nature of reduced HRV means it signals that something may be wrong without indicating what specifically is problematic. HRV in this framework is used as a **triage and tracking signal**, not as a standalone diagnostic.[^1]
6. **HRV is not static:** HRV fluctuates naturally with hydration, alcohol consumption, menstrual cycle phase, and emotional state. Identifying meaningful changes versus normal variation requires repeated measurements and careful interpretation.[^19][^1]

### 7.2 Non-Medical Positioning — Consistency with Existing Framework

Consistent with the existing Logic Layer compliance notice — "All outputs generated by this engine are framed as wellness education and functional pattern observation, not medical diagnosis or clinical prescription" — the following language conventions must be applied to all HRV-related outputs:[^4]

| Instead of | Use |
|---|---|
| "Your HRV is low — you have autonomic dysfunction" | "Your morning HRV pattern this week suggests your nervous system has been under significant load" |
| "Low HRV indicates disease" | "Low HRV is a functional signal that the body's stress-recovery balance may benefit from support" |
| "HRV confirms IBS" | "Your HRV pattern is consistent with the stress-digestion connection we are tracking in your Cluster B profile" |
| "Your ALI is 'very low' — you need treatment" | "Based on your current HRV trend, we recommend beginning with the autonomic foundation micro-protocols before introducing more intensive interventions" |

All HRV-linked report sections must carry the same disclaimer logic as QRMA and GDV outputs — language such as "pattern suggests," "screening flag," and "confirm with" applies equally to HRV data.[^30]

### 7.3 Recommended Next Steps

**For the Systems Architect:**
1. Add the `hrv_parameters` table and `autonomic_load_index` column to the `client_scans` schema (Section 4.1).
2. Implement a 7-day rolling RMSSD average function and the ALI band classification logic.
3. Extend the AI prompt template (Section 5 of the Logic Layer) to include an HRV block after the Lifestyle Domains block — positioned between the GDV stress index and the protocol recommendation section.
4. Build ALI-gated protocol logic into the cluster scoring pipeline (Section 4.3 of this document).
5. Connect to consumer wearable APIs (Garmin Health, Apple HealthKit, Google Fit, Polar API) for automated RMSSD ingestion.

**For the Content / Protocol Designer and Usaka Facilitators:**
1. Build a 1-page HRV literacy handout for Module 1 — "What Your HRV Number Means for Your Digestion, Sleep, and Stress."
2. Script the pre-meal breathing practice (MP-V1) as a guided audio track (3 min, 4:6 ratio, with a gentle chime every 10 seconds).
3. Script the sleep wind-down breathing track (MP-V3) with delta-wave background audio, 7 minutes.
4. Train facilitators to frame HRV not as a fitness metric but as a "nervous system weather report" — accessible, non-clinical language that connects to the client's lived digestive and emotional experience.
5. Build a simple daily tracking form: RMSSD → gut symptom score → energy level → sleep quality. Correlating these four numbers over 8 weeks produces powerful client self-awareness data.
6. Add omega-3 supplementation (EPA/DHA) to the nutrition protocols for CPT-LQS, CPT-HQD, and Cluster B+A combined — omega-3 PUFA supplementation consistently improves HF power (parasympathetic component) and HRV across multiple meta-analyses.[^24][^31]

**For the AI Engine:**
1. When ALI = very low AND Cluster B is active AND TCM pattern includes LQS or HQD: automatically prioritize HRV micro-protocols V1, V3, V4 as the top three recommendations in the report narrative, above dietary and supplement recommendations.
2. When HRV trend shows +10% improvement over 4 weeks AND Cluster B severity is moderate: generate a positive reinforcement message connecting HRV improvement to digestive symptom changes, framed as "Your autonomic foundation is strengthening — this supports your Spleen's transformation function."
3. When HRV trend is flat or declining despite protocol adherence: flag for human facilitator review, not an automated escalation — this is a non-specific signal requiring contextual interpretation.[^1]

***

*This document is intended as a living specification. Version 2.0 should incorporate outcome data from the first cohort of Usaka clients who use consumer wearable HRV tracking alongside QRMA-GDV scanning, to calibrate ALI thresholds and validate protocol-to-HRV-improvement correlations within the TeleTCM population.*

---

## References

1. [Understanding the shortcomings of heart rate variability as a tool for ...](https://www.frontiersin.org/journals/physiology/articles/10.3389/fphys.2026.1760160/full) - Interpreting HRV results presents significant challenges because multiple physiological and non-phys...

2. [An Overview of Heart Rate Variability Metrics and Norms - PMC](https://pmc.ncbi.nlm.nih.gov/articles/PMC5624990/) - Heart rate variability (HRV) consists of changes in the time intervals between consecutive heartbeat...

3. [Physiological Basis of Heart Rate Variability (HRV) - VitalScan](https://www.vitalscan.com/dt_hrv1.html) - The HF component is generally defined as a marker of vagal modulation. This component is respiration...

4. [Logic-Layer-QRMA-expanded.md](https://ppl-ai-file-upload.s3.amazonaws.com/web/direct-files/attachments/52065293/211f42cf-f923-4cbe-8df8-146d45145bcc/Logic-Layer-QRMA-expanded.md?AWSAccessKeyId=ASIA2F3EMEYER2ZTWY5D&Signature=3l1%2B48NQcJ4SK%2BefteC82glsQug%3D&x-amz-security-token=IQoJb3JpZ2luX2VjEMb%2F%2F%2F%2F%2F%2F%2F%2F%2F%2FwEaCXVzLWVhc3QtMSJHMEUCIQDEpVjmegintPxOGYN8SBIkTjVRtPHAg4o1GEJyoOWwIQIgbrfG5XRy8etFlhfNVJ3IxxfcD%2FacvCzbdVt%2Fakw1Hwcq%2FAQIj%2F%2F%2F%2F%2F%2F%2F%2F%2F%2F%2FARABGgw2OTk3NTMzMDk3MDUiDPzzhPaoKM0afu2tjirQBPrtl%2Fun766%2FeDieAn79XehoLpUhItFhglxJuKOqUF7pGd9%2B1H7G6ED2iyXhCNtAXM0A2a8%2FD33LtlRBwTjKxnBYkjNyaBIedwaQBqQkfB8TzPTib1lTeFIPxa12gZUsGX4v9WQssEtQSSRtXfSOT89nhy7EPHMGLyVaEnwQJkzKT3BQ59FGMLkVfqPFF7G5Emr2pU3ckpaHNKPvMBNDAXfP6mPjuHhtbjdxibsEtH3WB36sLkgw5YARnlafs8bOxXqUZD97tbDKezePYwWG0olgaajSCA3CZvYmiBLptvBD%2BE13YXPDG5jYDeYdFYCGPHYDqrq%2BfH2a1RNCNx7KnubUImDYGDiui71Bsq1vowxZBrcfmBcfDGRIDPZAGL%2FUvloUhfiaxzo0EBPfudxRBaQWRwdJh6eNDyNTSr%2FvBy%2B1Haw7LPtkXC2Ew%2BkMMO0zcPHXju0rE5YMyjftFdntJhz2MbVY7z8zsJhtYURb3d%2BJQrtHnwzeAqXjWnyS6w44azfYsMdLKnKT8YltunnN7Yf3B7wFg%2FDXrHhZhfpAx5CMQiy5lQkzA7vO7hBTWLcI7l3W6Y58blqZFNXDxtr%2FMHFmvY3oTo%2Fit7eKxE40%2FKZU9I9VR6L5dkPN%2FGiuNSwX8g%2FmQznGa%2By119Vqd9qKdzSyI9wJ265eOfbNb3vXY%2BfQnOZioT%2F44Zhoe2xjPYJnNbgCGIUPmDmJcRf5Mkb09U2zGihe1%2FjWuG%2FzlBdwy9ylM5OBCLMsZagCpCg91KrrUTFg8iQLh5itsp0aTGx6GNww0YPa0AY6mAEJ2NqX614DK9tmtNsWxt1gWt4jKsAitKi8fR8D2XVPZQY5YA8sG1UaOuJloWDygZANNeEpMTWjAQoKRJZ7tCxHiSmexqpbrRvb7REcStI6pEyvXkRn%2FIAjag1LNVykJeKJLyJW6AOu1T2rH5j%2B3AY0vZTGPd394cyYepBRV3Djekj%2FnwiIhMVGz7TPUXtnRjMhzfwi2WfOXg%3D%3D&Expires=1779863460) - # Logic Layer Specification Document: QRMA-GDV Health Intelligence Engine

**Version:** 1.0  
**Clas...

5. [TeleTCM_Clinical_Correlation_Matrix_Nutrition.xlsx](https://ppl-ai-file-upload.s3.amazonaws.com/web/direct-files/attachments/52065293/0d11fde9-41d6-4b39-8f33-1aae37e46f8a/TeleTCM_Clinical_Correlation_Matrix_Nutrition.xlsx?AWSAccessKeyId=ASIA2F3EMEYER2ZTWY5D&Signature=vZanoqgXwTl7loWTI5v%2BXr1fwdY%3D&x-amz-security-token=IQoJb3JpZ2luX2VjEMb%2F%2F%2F%2F%2F%2F%2F%2F%2F%2FwEaCXVzLWVhc3QtMSJHMEUCIQDEpVjmegintPxOGYN8SBIkTjVRtPHAg4o1GEJyoOWwIQIgbrfG5XRy8etFlhfNVJ3IxxfcD%2FacvCzbdVt%2Fakw1Hwcq%2FAQIj%2F%2F%2F%2F%2F%2F%2F%2F%2F%2F%2FARABGgw2OTk3NTMzMDk3MDUiDPzzhPaoKM0afu2tjirQBPrtl%2Fun766%2FeDieAn79XehoLpUhItFhglxJuKOqUF7pGd9%2B1H7G6ED2iyXhCNtAXM0A2a8%2FD33LtlRBwTjKxnBYkjNyaBIedwaQBqQkfB8TzPTib1lTeFIPxa12gZUsGX4v9WQssEtQSSRtXfSOT89nhy7EPHMGLyVaEnwQJkzKT3BQ59FGMLkVfqPFF7G5Emr2pU3ckpaHNKPvMBNDAXfP6mPjuHhtbjdxibsEtH3WB36sLkgw5YARnlafs8bOxXqUZD97tbDKezePYwWG0olgaajSCA3CZvYmiBLptvBD%2BE13YXPDG5jYDeYdFYCGPHYDqrq%2BfH2a1RNCNx7KnubUImDYGDiui71Bsq1vowxZBrcfmBcfDGRIDPZAGL%2FUvloUhfiaxzo0EBPfudxRBaQWRwdJh6eNDyNTSr%2FvBy%2B1Haw7LPtkXC2Ew%2BkMMO0zcPHXju0rE5YMyjftFdntJhz2MbVY7z8zsJhtYURb3d%2BJQrtHnwzeAqXjWnyS6w44azfYsMdLKnKT8YltunnN7Yf3B7wFg%2FDXrHhZhfpAx5CMQiy5lQkzA7vO7hBTWLcI7l3W6Y58blqZFNXDxtr%2FMHFmvY3oTo%2Fit7eKxE40%2FKZU9I9VR6L5dkPN%2FGiuNSwX8g%2FmQznGa%2By119Vqd9qKdzSyI9wJ265eOfbNb3vXY%2BfQnOZioT%2F44Zhoe2xjPYJnNbgCGIUPmDmJcRf5Mkb09U2zGihe1%2FjWuG%2FzlBdwy9ylM5OBCLMsZagCpCg91KrrUTFg8iQLh5itsp0aTGx6GNww0YPa0AY6mAEJ2NqX614DK9tmtNsWxt1gWt4jKsAitKi8fR8D2XVPZQY5YA8sG1UaOuJloWDygZANNeEpMTWjAQoKRJZ7tCxHiSmexqpbrRvb7REcStI6pEyvXkRn%2FIAjag1LNVykJeKJLyJW6AOu1T2rH5j%2B3AY0vZTGPd394cyYepBRV3Djekj%2FnwiIhMVGz7TPUXtnRjMhzfwi2WfOXg%3D%3D&Expires=1779863460) - # TeleTCM Matrix Integrated



| Rule ID & Pattern | Biomedical Mechanism | Clinical Translation | E...

6. [Gut Brain Axis (GBA) - Physiopedia](https://www.physio-pedia.com/Gut_Brain_Axis_(GBA)) - The gastrointestinal tract is connected to the brain through the Vagus nerve. · Bacterial products s...

7. [The Vagus Nerve and the Gut - Sutherland House](https://sutherlandhouse.life/lifestyle/the-vagus-nerve-and-the-gut-a-complex-and-fascinating-relationship/) - Studies have shown that the vagus nerve can influence the gut microbiome by regulating the productio...

8. [Universal_integrative_bridge.md](https://ppl-ai-file-upload.s3.amazonaws.com/web/direct-files/attachments/52065293/79f1cca1-cc5c-43f5-a267-a7c111579161/Universal_integrative_bridge.md?AWSAccessKeyId=ASIA2F3EMEYER2ZTWY5D&Signature=qGSWUOPBEC6VR4EW%2BUxiiZNLtO4%3D&x-amz-security-token=IQoJb3JpZ2luX2VjEMb%2F%2F%2F%2F%2F%2F%2F%2F%2F%2FwEaCXVzLWVhc3QtMSJHMEUCIQDEpVjmegintPxOGYN8SBIkTjVRtPHAg4o1GEJyoOWwIQIgbrfG5XRy8etFlhfNVJ3IxxfcD%2FacvCzbdVt%2Fakw1Hwcq%2FAQIj%2F%2F%2F%2F%2F%2F%2F%2F%2F%2F%2FARABGgw2OTk3NTMzMDk3MDUiDPzzhPaoKM0afu2tjirQBPrtl%2Fun766%2FeDieAn79XehoLpUhItFhglxJuKOqUF7pGd9%2B1H7G6ED2iyXhCNtAXM0A2a8%2FD33LtlRBwTjKxnBYkjNyaBIedwaQBqQkfB8TzPTib1lTeFIPxa12gZUsGX4v9WQssEtQSSRtXfSOT89nhy7EPHMGLyVaEnwQJkzKT3BQ59FGMLkVfqPFF7G5Emr2pU3ckpaHNKPvMBNDAXfP6mPjuHhtbjdxibsEtH3WB36sLkgw5YARnlafs8bOxXqUZD97tbDKezePYwWG0olgaajSCA3CZvYmiBLptvBD%2BE13YXPDG5jYDeYdFYCGPHYDqrq%2BfH2a1RNCNx7KnubUImDYGDiui71Bsq1vowxZBrcfmBcfDGRIDPZAGL%2FUvloUhfiaxzo0EBPfudxRBaQWRwdJh6eNDyNTSr%2FvBy%2B1Haw7LPtkXC2Ew%2BkMMO0zcPHXju0rE5YMyjftFdntJhz2MbVY7z8zsJhtYURb3d%2BJQrtHnwzeAqXjWnyS6w44azfYsMdLKnKT8YltunnN7Yf3B7wFg%2FDXrHhZhfpAx5CMQiy5lQkzA7vO7hBTWLcI7l3W6Y58blqZFNXDxtr%2FMHFmvY3oTo%2Fit7eKxE40%2FKZU9I9VR6L5dkPN%2FGiuNSwX8g%2FmQznGa%2By119Vqd9qKdzSyI9wJ265eOfbNb3vXY%2BfQnOZioT%2F44Zhoe2xjPYJnNbgCGIUPmDmJcRf5Mkb09U2zGihe1%2FjWuG%2FzlBdwy9ylM5OBCLMsZagCpCg91KrrUTFg8iQLh5itsp0aTGx6GNww0YPa0AY6mAEJ2NqX614DK9tmtNsWxt1gWt4jKsAitKi8fR8D2XVPZQY5YA8sG1UaOuJloWDygZANNeEpMTWjAQoKRJZ7tCxHiSmexqpbrRvb7REcStI6pEyvXkRn%2FIAjag1LNVykJeKJLyJW6AOu1T2rH5j%2B3AY0vZTGPd394cyYepBRV3Djekj%2FnwiIhMVGz7TPUXtnRjMhzfwi2WfOXg%3D%3D&Expires=1779863460) - | Row | A | B | C | D | E | F | G | H |
|---|---|---|---|---|---|---|---|---|
| 1 |  |  |  |  |  |  ...

9. [Heart rate variability in the irritable bowel syndrome: a review of the ...](https://onlinelibrary.wiley.com/doi/10.1111/j.1365-2982.2011.01866.x) - The authors found IBS patients to demonstrate higher LFnu and LF/HF ratio and lower HFnu (with the l...

10. [Alterations in heart rate variability associated with IBS or IBD](https://www.ars.usda.gov/research/publications/publication/?seqNo115=378430) - Our systematic review revealed that higher HRV does demonstrate moderate impact on IBS symptoms. Tec...

11. [Cross-talk between microbiota–gut–brain axis and blood pressure ...](https://pdfs.semanticscholar.org/4ac1/13a6dc8a918bb323607c40de550e0ab5cfc8.pdf) - Vagus nerve afferents in the intestines do not cross the gut epithelial barrier, meaning there is no...

12. [A Practical Guide to Resonance Frequency Assessment for ...](https://www.frontiersin.org/journals/neuroscience/articles/10.3389/fnins.2020.570400/full) - Slow paced breathing is a central component of HRV biofeedback because respiratory sinus arrhythmia ...

13. [Heart Rate Variability (HRV) Biofeedback and Athletic ...](https://marcoaltini.substack.com/p/heart-rate-variability-hrv-biofeedback) - Resonant frequency breathing with a 4:6 inhale-exhale ratio seems the ideal protocol to increase acu...

14. [Effect of Resonance Breathing on Heart Rate Variability and ...](https://pmc.ncbi.nlm.nih.gov/articles/PMC8924557/) - It has been postulated that breathing at a rate of close to six breaths/minute yields the highest am...

15. [The Gut-Brain Axis: How Stress Shapes Gut Health And Mood](https://floranaturopathics.com/learning-center/digestive-wellness/the-gut-brain-axis-how-the-nervous-system-shapes-gut-health/) - Learn how the gut-brain axis connects stress, digestion, and the microbiome, and why nervous system ...

16. [How to Improve HRV: 44 Factors Ranked by Evidence (2026)](https://www.kygo.app/post/how-to-improve-hrv-factors-ranked-by-evidence) - Omega-3 (EPA/DHA) is the most studied dietary factor for HRV, consistently improving HF power across...

17. [How to Improve HRV: 12 Ways to Boost Heart Rate Variability](https://sleep.me/post/how-to-increase-hrv) - A balanced diet most associated with higher HRV includes the Mediterranean diet, omega-3 fatty acids...

18. [Logic-Layer-Specification-Document-QRMA-GDV-Health-Intelligence-Engine.docx](https://ppl-ai-file-upload.s3.amazonaws.com/web/direct-files/attachments/52065293/d88a26cc-57eb-4ceb-999b-f8acd61366b5/Logic-Layer-Specification-Document-QRMA-GDV-Health-Intelligence-Engine.docx?AWSAccessKeyId=ASIA2F3EMEYER2ZTWY5D&Signature=Wnf8B1LM7MVUkDbtKesven3emPM%3D&x-amz-security-token=IQoJb3JpZ2luX2VjEMb%2F%2F%2F%2F%2F%2F%2F%2F%2F%2FwEaCXVzLWVhc3QtMSJHMEUCIQDEpVjmegintPxOGYN8SBIkTjVRtPHAg4o1GEJyoOWwIQIgbrfG5XRy8etFlhfNVJ3IxxfcD%2FacvCzbdVt%2Fakw1Hwcq%2FAQIj%2F%2F%2F%2F%2F%2F%2F%2F%2F%2F%2FARABGgw2OTk3NTMzMDk3MDUiDPzzhPaoKM0afu2tjirQBPrtl%2Fun766%2FeDieAn79XehoLpUhItFhglxJuKOqUF7pGd9%2B1H7G6ED2iyXhCNtAXM0A2a8%2FD33LtlRBwTjKxnBYkjNyaBIedwaQBqQkfB8TzPTib1lTeFIPxa12gZUsGX4v9WQssEtQSSRtXfSOT89nhy7EPHMGLyVaEnwQJkzKT3BQ59FGMLkVfqPFF7G5Emr2pU3ckpaHNKPvMBNDAXfP6mPjuHhtbjdxibsEtH3WB36sLkgw5YARnlafs8bOxXqUZD97tbDKezePYwWG0olgaajSCA3CZvYmiBLptvBD%2BE13YXPDG5jYDeYdFYCGPHYDqrq%2BfH2a1RNCNx7KnubUImDYGDiui71Bsq1vowxZBrcfmBcfDGRIDPZAGL%2FUvloUhfiaxzo0EBPfudxRBaQWRwdJh6eNDyNTSr%2FvBy%2B1Haw7LPtkXC2Ew%2BkMMO0zcPHXju0rE5YMyjftFdntJhz2MbVY7z8zsJhtYURb3d%2BJQrtHnwzeAqXjWnyS6w44azfYsMdLKnKT8YltunnN7Yf3B7wFg%2FDXrHhZhfpAx5CMQiy5lQkzA7vO7hBTWLcI7l3W6Y58blqZFNXDxtr%2FMHFmvY3oTo%2Fit7eKxE40%2FKZU9I9VR6L5dkPN%2FGiuNSwX8g%2FmQznGa%2By119Vqd9qKdzSyI9wJ265eOfbNb3vXY%2BfQnOZioT%2F44Zhoe2xjPYJnNbgCGIUPmDmJcRf5Mkb09U2zGihe1%2FjWuG%2FzlBdwy9ylM5OBCLMsZagCpCg91KrrUTFg8iQLh5itsp0aTGx6GNww0YPa0AY6mAEJ2NqX614DK9tmtNsWxt1gWt4jKsAitKi8fR8D2XVPZQY5YA8sG1UaOuJloWDygZANNeEpMTWjAQoKRJZ7tCxHiSmexqpbrRvb7REcStI6pEyvXkRn%2FIAjag1LNVykJeKJLyJW6AOu1T2rH5j%2B3AY0vZTGPd394cyYepBRV3Djekj%2FnwiIhMVGz7TPUXtnRjMhzfwi2WfOXg%3D%3D&Expires=1779863460) - Logic Layer Specification Document QRMA-GDV Health Intelligence Engine Version 1.0 Classification Te...

19. [Heart rate variability measurement and influencing factors - PMC - NIH](https://pmc.ncbi.nlm.nih.gov/articles/PMC11439429/) - Abstract. Heart rate variability (HRV) is widely recognized as an effective and valuable tool for ev...

20. [[PDF] From the viewpoint of dysfunction of autonomic nervous system activity](https://pdfs.semanticscholar.org/fbe2/011e7c1180bbb283b266f377e18711d0a8d4.pdf) - In this report, we will first review autonomic dysfunction in patients with IBS, and then we will in...

21. [The 5 Most Common Mistakes When Measuring HRV](https://www.movisens.com/en/the-5-most-common-mistakes-when-measuring-hrv/) - Additionally, devices that sample at low frequencies (under 1000Hz) compromise the accuracy and prec...

22. [[PDF] Integrative Neuroimmune Role of the ... - Semantic Scholar](https://pdfs.semanticscholar.org/de4e/9d677fa30b61f1944725705f1e483c836248.pdf) - Interventions that restore vagal activity, such as lifestyle changes, dietary modifications, probiot...

23. [[PDF] Neuromodulation and the Gut–Brain Axis - Semantic Scholar](https://pdfs.semanticscholar.org/1753/a1d92c80b7fdcd3d685b1a483ca3b8af1843.pdf) - IBS includes changes in visceral hypersensitivity and GI motor abnormalities, which can cause variou...

24. [Omega-3 Polyunsaturated Fatty Acids and Heart Rate ...](https://www.frontiersin.org/journals/physiology/articles/10.3389/fphys.2011.00084/full) - Romieu et al. reported that omega-3 PUFA supplementation (2 g daily for 6 months) prevented HRV decl...

25. [Pathophysiology The Biologic Basis for Disease in Adults and Children.txt](https://ppl-ai-file-upload.s3.amazonaws.com/web/direct-files/collection_459fd5c2-52d1-4b82-9981-319b49a6aedf/420652dd-0489-4ff2-9eb8-1377cfab1419/Pathophysiology-The-Biologic-Basis-for-Disease-in-Adults-and-Children.txt?AWSAccessKeyId=ASIA2F3EMEYER2ZTWY5D&Signature=O8E%2BKSagRuvaAFCFmeXNlgPHhRI%3D&x-amz-security-token=IQoJb3JpZ2luX2VjEMb%2F%2F%2F%2F%2F%2F%2F%2F%2F%2FwEaCXVzLWVhc3QtMSJHMEUCIQDEpVjmegintPxOGYN8SBIkTjVRtPHAg4o1GEJyoOWwIQIgbrfG5XRy8etFlhfNVJ3IxxfcD%2FacvCzbdVt%2Fakw1Hwcq%2FAQIj%2F%2F%2F%2F%2F%2F%2F%2F%2F%2F%2FARABGgw2OTk3NTMzMDk3MDUiDPzzhPaoKM0afu2tjirQBPrtl%2Fun766%2FeDieAn79XehoLpUhItFhglxJuKOqUF7pGd9%2B1H7G6ED2iyXhCNtAXM0A2a8%2FD33LtlRBwTjKxnBYkjNyaBIedwaQBqQkfB8TzPTib1lTeFIPxa12gZUsGX4v9WQssEtQSSRtXfSOT89nhy7EPHMGLyVaEnwQJkzKT3BQ59FGMLkVfqPFF7G5Emr2pU3ckpaHNKPvMBNDAXfP6mPjuHhtbjdxibsEtH3WB36sLkgw5YARnlafs8bOxXqUZD97tbDKezePYwWG0olgaajSCA3CZvYmiBLptvBD%2BE13YXPDG5jYDeYdFYCGPHYDqrq%2BfH2a1RNCNx7KnubUImDYGDiui71Bsq1vowxZBrcfmBcfDGRIDPZAGL%2FUvloUhfiaxzo0EBPfudxRBaQWRwdJh6eNDyNTSr%2FvBy%2B1Haw7LPtkXC2Ew%2BkMMO0zcPHXju0rE5YMyjftFdntJhz2MbVY7z8zsJhtYURb3d%2BJQrtHnwzeAqXjWnyS6w44azfYsMdLKnKT8YltunnN7Yf3B7wFg%2FDXrHhZhfpAx5CMQiy5lQkzA7vO7hBTWLcI7l3W6Y58blqZFNXDxtr%2FMHFmvY3oTo%2Fit7eKxE40%2FKZU9I9VR6L5dkPN%2FGiuNSwX8g%2FmQznGa%2By119Vqd9qKdzSyI9wJ265eOfbNb3vXY%2BfQnOZioT%2F44Zhoe2xjPYJnNbgCGIUPmDmJcRf5Mkb09U2zGihe1%2FjWuG%2FzlBdwy9ylM5OBCLMsZagCpCg91KrrUTFg8iQLh5itsp0aTGx6GNww0YPa0AY6mAEJ2NqX614DK9tmtNsWxt1gWt4jKsAitKi8fR8D2XVPZQY5YA8sG1UaOuJloWDygZANNeEpMTWjAQoKRJZ7tCxHiSmexqpbrRvb7REcStI6pEyvXkRn%2FIAjag1LNVykJeKJLyJW6AOu1T2rH5j%2B3AY0vZTGPd394cyYepBRV3Djekj%2FnwiIhMVGz7TPUXtnRjMhzfwi2WfOXg%3D%3D&Expires=1779863460)

26. [The effects of slow deep breathing on microvascular and autonomic ...](https://www.semanticscholar.org/paper/The-effects-of-slow-deep-breathing-on-microvascular-Jurek-Seavey/7d84930196bdda79f0f83826cd8dd8f0ed15a332) - Slow, deep breathing intervention improved symptoms and altered rectal sensitivity in patients with ...

27. [Current insights in to the pathophysiology of Irritable Bowel Syndrome](https://pmc.ncbi.nlm.nih.gov/articles/PMC2876056/) - Recent studies indicate that the most important mechanisms include visceral sensitivity, abnormal gu...

28. [Visceral Hypersensitivity: Symptoms, Treatment, Causes & What it Is](https://my.clevelandclinic.org/health/diseases/22997-visceral-hypersensitivity) - Visceral hypersensitivity means that your threshold for pain in the internal organs is lower. It's c...

29. [[PDF] Effects of Cognitive Behavior Therapy on Heart Rate Variability in ...](https://pdfs.semanticscholar.org/93b3/72333831bd3cb0de11f79589bb277492bc39.pdf) - IBS has been attributed to GI sensory-motor dysfunction, such as intestinal dysmotility, visceral hy...

30. [qrma-module-specification.md](https://ppl-ai-file-upload.s3.amazonaws.com/web/direct-files/attachments/52065293/472bb417-da62-468a-8707-e69d844e7415/qrma-module-specification.md?AWSAccessKeyId=ASIA2F3EMEYER2ZTWY5D&Signature=tOdORChKqmxwdcWGKMD7mEtuKL4%3D&x-amz-security-token=IQoJb3JpZ2luX2VjEMb%2F%2F%2F%2F%2F%2F%2F%2F%2F%2FwEaCXVzLWVhc3QtMSJHMEUCIQDEpVjmegintPxOGYN8SBIkTjVRtPHAg4o1GEJyoOWwIQIgbrfG5XRy8etFlhfNVJ3IxxfcD%2FacvCzbdVt%2Fakw1Hwcq%2FAQIj%2F%2F%2F%2F%2F%2F%2F%2F%2F%2F%2FARABGgw2OTk3NTMzMDk3MDUiDPzzhPaoKM0afu2tjirQBPrtl%2Fun766%2FeDieAn79XehoLpUhItFhglxJuKOqUF7pGd9%2B1H7G6ED2iyXhCNtAXM0A2a8%2FD33LtlRBwTjKxnBYkjNyaBIedwaQBqQkfB8TzPTib1lTeFIPxa12gZUsGX4v9WQssEtQSSRtXfSOT89nhy7EPHMGLyVaEnwQJkzKT3BQ59FGMLkVfqPFF7G5Emr2pU3ckpaHNKPvMBNDAXfP6mPjuHhtbjdxibsEtH3WB36sLkgw5YARnlafs8bOxXqUZD97tbDKezePYwWG0olgaajSCA3CZvYmiBLptvBD%2BE13YXPDG5jYDeYdFYCGPHYDqrq%2BfH2a1RNCNx7KnubUImDYGDiui71Bsq1vowxZBrcfmBcfDGRIDPZAGL%2FUvloUhfiaxzo0EBPfudxRBaQWRwdJh6eNDyNTSr%2FvBy%2B1Haw7LPtkXC2Ew%2BkMMO0zcPHXju0rE5YMyjftFdntJhz2MbVY7z8zsJhtYURb3d%2BJQrtHnwzeAqXjWnyS6w44azfYsMdLKnKT8YltunnN7Yf3B7wFg%2FDXrHhZhfpAx5CMQiy5lQkzA7vO7hBTWLcI7l3W6Y58blqZFNXDxtr%2FMHFmvY3oTo%2Fit7eKxE40%2FKZU9I9VR6L5dkPN%2FGiuNSwX8g%2FmQznGa%2By119Vqd9qKdzSyI9wJ265eOfbNb3vXY%2BfQnOZioT%2F44Zhoe2xjPYJnNbgCGIUPmDmJcRf5Mkb09U2zGihe1%2FjWuG%2FzlBdwy9ylM5OBCLMsZagCpCg91KrrUTFg8iQLh5itsp0aTGx6GNww0YPa0AY6mAEJ2NqX614DK9tmtNsWxt1gWt4jKsAitKi8fR8D2XVPZQY5YA8sG1UaOuJloWDygZANNeEpMTWjAQoKRJZ7tCxHiSmexqpbrRvb7REcStI6pEyvXkRn%2FIAjag1LNVykJeKJLyJW6AOu1T2rH5j%2B3AY0vZTGPd394cyYepBRV3Djekj%2FnwiIhMVGz7TPUXtnRjMhzfwi2WfOXg%3D%3D&Expires=1779863460) - Document type Developer AI handover specification Scope 8 functional modules parameter tables, scori...

31. [Heart rate variability and its modulation by nutrients - PMC](https://pmc.ncbi.nlm.nih.gov/articles/PMC12719305/) - Nonetheless, the overall evidence suggested that omega-3 supplementation may enhance HRV and partial...

