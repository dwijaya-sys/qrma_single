// =============================================================================
// hrv-engine.js
// Version: 1.0.2
// Date: 2026-06-01
// Purpose: HRV Autonomic Load Layer for the QRMA Usaka dashboard.
//          Computes ALI, classifies autonomic state, selects micro-protocols,
//          and renders the HRV sidebar module and per-module strips.
//          HRV never alters QRMA module scores. No DOM reads inside pure
//          computation functions. Load after zone-scoring.js.
// =============================================================================

// =============================================================================
// SECTION 1 — HRV_CONFIG
// =============================================================================

const HRV_CONFIG = {

  // RMSSD band thresholds (ms) — lower boundary is inclusive
  rmssdBands: {
    veryLow:  20,   // rmssd < 20        → very_low
    low:      40,   // 20 ≤ rmssd < 40   → low
    adaptive: 70    // 40 ≤ rmssd < 70   → adaptive; ≥ 70 → high
  },

  // ALI 0–100 band thresholds (higher score = more autonomic load)
  aliBands: {
    high:     25,   // ALI < 25          → high (strong parasympathetic tone)
    adaptive: 50,   // 25 ≤ ALI < 50     → adaptive
    low:      75    // 50 ≤ ALI < 75     → low; ≥ 75 → very_low
  },

  // ALI computation weights — rmssd + meanHr used in Phase 1
  // sleep (0.15) and stress (0.15) reserved for Phase 3 manual integration
  aliWeights: {
    rmssd:  0.5,
    meanHr: 0.2,
    sleep:  0.15,
    stress: 0.15
  },

  // Quality gate thresholds
  quality: {
    minDurationSec:     240,
    artifactCautionPct:   3,
    artifactRejectPct:    5
  },

  // Micro-protocol definitions (V1–V5), bilingual
  protocols: {
    V1: {
      id: 'V1',
      name_en:      'Pre-Meal Vagal Warm-Up',
      name_id:      'Pernapasan Sebelum Makan',
      timing_en:    '3–5 minutes before any main meal',
      timing_id:    '3–5 menit sebelum makan utama',
      technique_en: 'Sit quietly. Nasal breathing only. Inhale 4 seconds, exhale 6–8 seconds. 12–15 breath cycles. Eyes closed or soft gaze.',
      technique_id: 'Duduk tenang. Bernapas hanya lewat hidung. Tarik napas 4 detik, buang napas 6–8 detik. Ulangi 12–15 kali. Mata terpejam atau pandangan lembut.',
      duration_en:  '3 minutes',
      duration_id:  '3 menit'
    },
    V2: {
      id: 'V2',
      name_en:      'Post-Meal Digestive Walk',
      name_id:      'Jalan Kaki Setelah Makan',
      timing_en:    'Within 30 minutes after lunch (1–3 PM)',
      timing_id:    'Dalam 30 menit setelah makan siang (pukul 13.00–15.00)',
      technique_en: 'Slow, relaxed walking at conversational pace (50–60% max HR). Nasal breathing encouraged. No phone use.',
      technique_id: 'Berjalan pelan dan santai dengan kecepatan percakapan (50–60% detak jantung maksimal). Utamakan bernapas lewat hidung. Hindari penggunaan ponsel.',
      duration_en:  '10–15 minutes',
      duration_id:  '10–15 menit'
    },
    V3: {
      id: 'V3',
      name_en:      'Sleep Wind-Down Breathing',
      name_id:      'Pernapasan Relaksasi Tidur',
      timing_en:    'In bed, 15–20 minutes before intended sleep time',
      timing_id:    'Di tempat tidur, 15–20 menit sebelum waktu tidur yang direncanakan',
      technique_en: 'Supine position. Inhale 4 seconds (nasal), exhale 6–8 seconds. Optional: one hand on abdomen to confirm diaphragmatic breathing.',
      technique_id: 'Posisi berbaring. Tarik napas 4 detik (lewat hidung), buang napas 6–8 detik. Opsional: satu tangan di perut untuk memastikan pernapasan diafragma.',
      duration_en:  '5–10 minutes',
      duration_id:  '5–10 menit'
    },
    V4: {
      id: 'V4',
      name_en:      'In-the-Moment ANS Reset',
      name_id:      'Reset Sistem Saraf Otonom',
      timing_en:    'Any time a stress trigger is identified — pre-meeting, emotional activation, or pre-eating under stress',
      timing_id:    'Kapan saja ketika pemicu stres dikenali — sebelum rapat, saat emosi meningkat, atau sebelum makan dalam kondisi tertekan',
      technique_en: '6 slow breath cycles at ~6 breaths/min. Inhale 4–5 seconds, exhale 5–7 seconds. Can be done standing, sitting, or walking.',
      technique_id: '6 siklus napas lambat (~6 napas per menit). Tarik napas 4–5 detik, buang napas 5–7 detik. Dapat dilakukan sambil berdiri, duduk, atau berjalan.',
      duration_en:  '60–90 seconds',
      duration_id:  '60–90 detik'
    },
    V5: {
      id: 'V5',
      name_en:      'Full HRV Biofeedback Session',
      name_id:      'Sesi Biofeedback HRV Penuh',
      timing_en:    'Morning (preferred) or evening — not within 1 hour of vigorous exercise or sleep',
      timing_id:    'Pagi hari (lebih disarankan) atau sore hari — tidak dalam 1 jam setelah olahraga berat atau sebelum tidur',
      technique_en: 'App-guided resonance breathing at personal resonant frequency (4.5–6.5 bpm). Inhale:exhale 4:6 ratio. Diaphragmatic breathing. 20 minutes continuous.',
      technique_id: 'Pernapasan resonansi dipandu aplikasi pada frekuensi resonansi pribadi (4,5–6,5 napas per menit). Rasio tarik:buang 4:6. Pernapasan diafragma. 20 menit terus-menerus.',
      duration_en:  '20 minutes',
      duration_id:  '20 menit'
    }
  },

  // Protocol IDs shown per ALI band — deferred protocols never shown
  protocolsByBand: {
    very_low: ['V1', 'V3', 'V4'],
    low:      ['V1', 'V2', 'V3', 'V4'],
    adaptive: ['V1', 'V2', 'V3', 'V4', 'V5'],
    high:     ['V2', 'V4', 'V5']
  }
};

// Display label lookup tables — bilingual
const HRV_BAND_LABELS = {
  very_low: { en: 'Very Low',  id: 'Sangat Rendah' },
  low:      { en: 'Low',       id: 'Rendah'         },
  adaptive: { en: 'Adaptive',  id: 'Adaptif'        },
  high:     { en: 'High',      id: 'Tinggi'         }
};

const HRV_QUALITY_LABELS = {
  pass:    { en: 'Pass',    id: 'Baik'      },
  caution: { en: 'Caution', id: 'Perhatian' },
  reject:  { en: 'Reject',  id: 'Ditolak'  }
};

const HRV_RECOVERY_LABELS = {
  strained: { en: 'Strained', id: 'Tertekan'  },
  guarded:  { en: 'Guarded',  id: 'Terbatas'  },
  adaptive: { en: 'Adaptive', id: 'Adaptif'   }
};

// =============================================================================
// SECTION 2 — Pure computation functions (no DOM dependency)
// =============================================================================

// Internal helpers — not exported
function _rmssdToLoad(rmssd) {
  // Piecewise linear: RMSSD band boundaries (20, 40, 70 ms) map to
  // ALI band thresholds (75, 50, 25) so that rmssdBand and aliBand align
  // when HR is at neutral resting level.
  if (rmssd <= 0)   return 100;
  if (rmssd < 20)   return 100 - (rmssd / 20) * 25;           // 100 → 75
  if (rmssd < 40)   return 75  - ((rmssd - 20) / 20) * 25;   // 75  → 50
  if (rmssd < 70)   return 50  - ((rmssd - 40) / 30) * 25;   // 50  → 25
  if (rmssd < 120)  return 25  - ((rmssd - 70) / 50) * 25;   // 25  → 0
  return 0;
}

function _hrToLoad(hr) {
  // Linear: 40 bpm → 0 load; 110 bpm → 100 load
  const c = Math.max(40, Math.min(110, hr));
  return ((c - 40) / 70) * 100;
}

// computeRmssdBand — classifies raw RMSSD into ALI vocabulary band
function computeRmssdBand(rmssd) {
  if (rmssd < HRV_CONFIG.rmssdBands.veryLow)  return 'very_low';
  if (rmssd < HRV_CONFIG.rmssdBands.low)      return 'low';
  if (rmssd < HRV_CONFIG.rmssdBands.adaptive) return 'adaptive';
  return 'high';
}

// computeALI — composite autonomic load index 0–100 (higher = more load)
// Uses RMSSD (weight 0.5) and mean HR (weight 0.2) in Phase 1.
// Sleep and stress weights (0.15 each) reserved for Phase 3.
function computeALI(rmssd, meanHr) {
  const w     = HRV_CONFIG.aliWeights;
  const used  = w.rmssd + w.meanHr;  // 0.70
  const raw   = (w.rmssd * _rmssdToLoad(rmssd) + w.meanHr * _hrToLoad(meanHr)) / used;
  return Math.round(Math.max(0, Math.min(100, raw)));
}

// aliBand — converts 0–100 ALI score to HRV vocabulary band
function aliBand(ali) {
  if (ali < HRV_CONFIG.aliBands.high)     return 'high';
  if (ali < HRV_CONFIG.aliBands.adaptive) return 'adaptive';
  if (ali < HRV_CONFIG.aliBands.low)      return 'low';
  return 'very_low';
}

// computeQualityFlag — pass | caution | reject
function computeQualityFlag(durationSec, artifactPct) {
  if (artifactPct  > HRV_CONFIG.quality.artifactRejectPct)  return 'reject';
  if (durationSec  < HRV_CONFIG.quality.minDurationSec)     return 'caution';
  if (artifactPct  > HRV_CONFIG.quality.artifactCautionPct) return 'caution';
  return 'pass';
}

// computeRecoveryState — strained | guarded | adaptive
function computeRecoveryState(ali) {
  if (ali >= HRV_CONFIG.aliBands.low)      return 'strained';
  if (ali >= HRV_CONFIG.aliBands.adaptive) return 'guarded';
  return 'adaptive';
}

// getProtocolsForBand — returns array of protocol objects for the given band
function getProtocolsForBand(band) {
  const ids = HRV_CONFIG.protocolsByBand[band] ?? [];
  return ids.map(id => HRV_CONFIG.protocols[id]).filter(Boolean);
}

// getAliInterpretation — paragraph string for the HRV sidebar status card
function getAliInterpretation(band, lang) {
  const L = lang === 'id' ? 'id' : 'en';
  const texts = {
    very_low: {
      en: 'Your HRV pattern this session suggests your nervous system has been under significant load. Autonomic regulation practices are the priority right now — before other protocol layers are added. Pattern suggests: apply micro-protocols V1, V3, and V4 before meals, at bedtime, and at any identified stress trigger.',
      id: 'Pola HRV sesi ini menunjukkan sistem saraf Anda menanggung beban yang signifikan. Praktik regulasi otonom menjadi prioritas utama saat ini — sebelum lapisan protokol lainnya ditambahkan. Pola menunjukkan: terapkan mikro-protokol V1, V3, dan V4 sebelum makan, menjelang tidur, dan saat pemicu stres teridentifikasi.'
    },
    low: {
      en: 'Your HRV pattern indicates suboptimal vagal tone. Digestive and stress regulation are co-priorities at this level. Pattern suggests: add V2 post-meal walk alongside V1 and V3, and consider HRV biofeedback twice daily to rebuild autonomic reserve.',
      id: 'Pola HRV menunjukkan tonus vagal yang belum optimal. Regulasi pencernaan dan stres menjadi prioritas bersama pada level ini. Pola menunjukkan: tambahkan V2 jalan kaki setelah makan bersama V1 dan V3, dan pertimbangkan biofeedback HRV dua kali sehari untuk membangun cadangan otonom.'
    },
    adaptive: {
      en: 'Your HRV reading is in the adaptive range, suggesting reasonable autonomic flexibility. Pattern-specific protocols are appropriate at this level. All five micro-protocols are accessible — prioritise those that align with your current health focus.',
      id: 'Pembacaan HRV Anda berada dalam rentang adaptif, menunjukkan fleksibilitas otonom yang baik. Protokol spesifik untuk pola Anda sudah sesuai pada level ini. Semua lima mikro-protokol dapat diterapkan — utamakan yang selaras dengan fokus kesehatan Anda saat ini.'
    },
    high: {
      en: 'Your HRV reading shows strong parasympathetic tone. This supports a good digestive-autonomic foundation and more intensive protocol work. Consolidation and depth work is appropriate — consider structured exercise and progressive challenge.',
      id: 'Pembacaan HRV Anda menunjukkan tonus parasimpatis yang kuat. Ini mendukung fondasi otonom-pencernaan yang baik dan kerja protokol yang lebih intensif. Konsolidasi dan pendalaman sudah sesuai — pertimbangkan olahraga terstruktur dan tantangan progresif.'
    }
  };
  return texts[band]?.[L] ?? '';
}

// getModuleContextSentence — one-line autonomic context for each module strip
function getModuleContextSentence(moduleId, lang) {
  const L = lang === 'id' ? 'id' : 'en';
  const sentences = {
    bio_age: {
      en: 'Elevated sustained autonomic load is associated with accelerated cellular aging patterns.',
      id: 'Beban otonom yang berkelanjutan dikaitkan dengan pola penuaan sel yang lebih cepat.'
    },
    oxidative: {
      en: 'Reduced vagal tone is associated with increased oxidative stress exposure.',
      id: 'Tonus vagal yang rendah dikaitkan dengan peningkatan paparan stres oksidatif.'
    },
    toxic: {
      en: 'Vagal tone supports hepatic bile secretion and detoxification capacity.',
      id: 'Tonus vagal mendukung sekresi empedu hati dan kapasitas detoksifikasi tubuh.'
    },
    metabolic: {
      en: 'Metabolic stress and autonomic load have a bidirectional relationship — each amplifies the other.',
      id: 'Stres metabolik dan beban otonom memiliki hubungan dua arah — keduanya saling memperkuat.'
    },
    cardio: {
      en: 'RMSSD reflects current cardiac autonomic balance. Reduced HRV is an independent cardiovascular risk marker.',
      id: 'RMSSD mencerminkan keseimbangan otonom jantung saat ini. HRV yang rendah merupakan penanda risiko kardiovaskular yang independen.'
    },
    nutrient: {
      en: 'Adequate vagal tone is required for optimal digestive enzyme output and nutrient absorption.',
      id: 'Tonus vagal yang memadai diperlukan untuk output enzim pencernaan dan penyerapan nutrisi yang optimal.'
    },
    skin: {
      en: 'Sustained sympathetic dominance elevates cortisol, which is associated with accelerated collagen turnover.',
      id: 'Dominasi simpatis yang berkelanjutan meningkatkan kortisol, yang dikaitkan dengan percepatan pergantian kolagen.'
    }
  };
  return sentences[moduleId]?.[L] ?? '';
}

// =============================================================================
// SECTION 3 — State
// =============================================================================

let hrvState = null;

// =============================================================================
// SECTION 4 — ingestHrv()
// =============================================================================

function ingestHrv() {
  const rmssd    = parseFloat(document.getElementById('hrv-rmssd')?.value)    || 0;
  const meanHr   = parseFloat(document.getElementById('hrv-hr')?.value)       || 0;
  const sdnn     = parseFloat(document.getElementById('hrv-sdnn')?.value)     || null;
  const durSec   = parseInt  (document.getElementById('hrv-duration')?.value) || 300;
  const artPct   = parseFloat(document.getElementById('hrv-artifact')?.value) || 0;
  const device   = (document.getElementById('hrv-device')?.value   || 'Polar H10').trim();
  const protocol = (document.getElementById('hrv-protocol')?.value || 'supine_rest_5min').trim();

  if (!rmssd || !meanHr) return;

  const qualityFlag   = computeQualityFlag(durSec, artPct);
  const rmssdBand     = computeRmssdBand(rmssd);
  const ali           = computeALI(rmssd, meanHr);
  const recoveryState = computeRecoveryState(ali);

  hrvState = {
    // Provenance
    readingTimestamp: new Date().toISOString(),
    device,
    protocol,
    // Quality gate
    durationSec:  durSec,
    artifactPct:  artPct,
    qualityFlag,
    // Raw metrics
    meanHr,
    rmssd,
    sdnn:      sdnn || null,
    lnRmssd:   rmssd > 0 ? parseFloat(Math.log(rmssd).toFixed(3)) : null,
    lfHfRatio: parseFloat(document.getElementById('hrv-lfratio')?.value) || null,
    // Derived — computed here, never entered manually
    rmssdBand,
    baselineStatus:     'unknown',       // Phase 3: baseline-aware comparison
    autonomicLoadIndex: ali,
    recoveryState,
    readinessBand:      aliBand(ali)
  };

  if (typeof renderHrvPanel === 'function') renderHrvPanel();
}

// =============================================================================
// SECTION 5 — DOM helpers (render-layer only — not pure)
// =============================================================================

function _hset(id, html) {
  const el = document.getElementById(id);
  if (el) el.innerHTML = html;
}

function _bandCss(band) {
  return 'hrv-band-' + band.replace(/_/g, '-');
}

function _qualityCss(flag) {
  return 'hrv-quality-' + flag;
}

function _t(enStr, idStr) {
  return (typeof currentLang !== 'undefined' && currentLang === 'id') ? idStr : enStr;
}

// =============================================================================
// SECTION 6 — renderHrvModule()
// =============================================================================

function renderHrvModule() {
  if (!hrvState) return;

  const s      = hrvState;
  const L      = (typeof currentLang !== 'undefined') ? currentLang : 'en';
  const b      = aliBand(s.autonomicLoadIndex);
  const bLabel = HRV_BAND_LABELS[b][L];
  const qLabel = HRV_QUALITY_LABELS[s.qualityFlag][L];
  const rLabel = HRV_RECOVERY_LABELS[s.recoveryState][L];
  const interp = getAliInterpretation(b, L);
  const protos = getProtocolsForBand(b);

  const aliExplain = _t(
    'The ALI Band shows how much load your nervous system is currently carrying. It is calculated from your heart rate variability (RMSSD) and resting heart rate — two signals that reflect how well your body is recovering and adapting. A lower band (Adaptive or High) means your nervous system is relaxed and flexible. A higher band (Low or Very Low) means your body is working harder than usual to maintain balance, and recovery practices become the priority.',
    'Band ALI menunjukkan seberapa besar beban yang sedang ditanggung sistem saraf Anda saat ini. Nilai ini dihitung dari variabilitas detak jantung (RMSSD) dan detak jantung istirahat — dua sinyal yang mencerminkan seberapa baik tubuh Anda memulihkan diri dan beradaptasi. Band yang lebih rendah (Adaptif atau Tinggi) berarti sistem saraf Anda rileks dan fleksibel. Band yang lebih tinggi (Rendah atau Sangat Rendah) berarti tubuh Anda bekerja lebih keras dari biasanya untuk menjaga keseimbangan, dan praktik pemulihan menjadi prioritas utama.'
  );

  // Section 1 — Autonomic Status Card
  const statusCard = `
    <div class="hrv-status-card">
      <h3 class="hrv-card-title">${_t('Autonomic Status', 'Status Otonom')}</h3>
      <div class="hrv-metric-grid">
        <div class="hrv-metric">
          <span class="hrv-metric-lbl">RMSSD</span>
          <span class="hrv-metric-val">${s.rmssd} ms</span>
        </div>
        <div class="hrv-metric">
          <span class="hrv-metric-lbl">${_t('ALI Band', 'Band ALI')}</span>
          <span class="hrv-band-chip ${_bandCss(b)}">${bLabel}</span>
        </div>
        <div class="hrv-metric">
          <span class="hrv-metric-lbl">${_t('Resting HR', 'Detak Jantung Istirahat')}</span>
          <span class="hrv-metric-val">${s.meanHr} bpm</span>
        </div>
        <div class="hrv-metric">
          <span class="hrv-metric-lbl">${_t('Reading Quality', 'Kualitas Rekaman')}</span>
          <span class="hrv-qual-chip ${_qualityCss(s.qualityFlag)}">${qLabel}</span>
        </div>
      </div>
      <div class="hrv-ali-explain">
        ${aliExplain}
      </div>
      <div class="hrv-recovery-row">
        <span class="hrv-recovery-lbl">${_t('Recovery State', 'Status Pemulihan')}:</span>
        <span class="hrv-recovery-val hrv-recovery-${s.recoveryState}">${rLabel}</span>
      </div>
      <p class="hrv-interpretation">${interp}</p>
    </div>`;

  // Section 2 — ALI-gated protocol stack
  const protoCards = protos.map(p => `
    <div class="hrv-protocol-card">
      <div class="hrv-proto-badge">${p.id}</div>
      <div class="hrv-proto-body">
        <div class="hrv-proto-name">${p['name_'   + L]}</div>
        <div class="hrv-proto-timing">${_t('Timing', 'Waktu')}: ${p['timing_' + L]}</div>
        <div class="hrv-proto-technique">${p['technique_' + L]}</div>
        <div class="hrv-proto-duration">${_t('Duration', 'Durasi')}: ${p['duration_' + L]}</div>
      </div>
    </div>`).join('');

  const protocolSection = `
    <div class="hrv-protocols-section">
      <h3 class="hrv-card-title">${_t('Recommended Micro-Protocols', 'Mikro-Protokol Rekomendasi')}</h3>
      <p class="hrv-band-note">
        ${_t('Showing protocols for ALI band:', 'Menampilkan protokol untuk band ALI:')}
        <span class="hrv-band-chip ${_bandCss(b)}">${bLabel}</span>
      </p>
      <div class="hrv-proto-cards">${protoCards}</div>
    </div>`;

  // Section 3 — Reading Provenance + compliance disclaimer
  const disclaimer = _t(
    'HRV output is for wellness education only. ALI classification is a functional pattern observation, not a medical index. Confirm with standard clinical assessment where clinically relevant.',
    'Output HRV hanya untuk edukasi kesehatan. Klasifikasi ALI adalah observasi pola fungsional, bukan indeks medis. Konfirmasi dengan penilaian klinis standar jika diperlukan.'
  );

  const provenanceSection = `
    <div class="hrv-provenance-section">
      <h3 class="hrv-card-title">${_t('Reading Provenance', 'Asal Data Rekaman')}</h3>
      <dl class="hrv-prov-grid">
        <dt>${_t('Device', 'Perangkat')}</dt>        <dd>${s.device}</dd>
        <dt>${_t('Protocol', 'Protokol')}</dt>       <dd>${s.protocol}</dd>
        <dt>${_t('Duration', 'Durasi')}</dt>         <dd>${s.durationSec}s</dd>
        <dt>${_t('Artifact', 'Artefak')}</dt>        <dd>${s.artifactPct}%</dd>
        <dt>${_t('Timestamp', 'Waktu Rekaman')}</dt> <dd>${s.readingTimestamp}</dd>
      </dl>
      <p class="hrv-disclaimer">${disclaimer}</p>
    </div>`;

  _hset('hrv-mod-body', statusCard + protocolSection + provenanceSection);
}

// =============================================================================
// SECTION 7 — Per-module strip renderers
// =============================================================================

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
  const ctx    = getModuleContextSentence(moduleId, L);

  const vitals = L === 'id'
    ? `RMSSD: ${s.rmssd} ms · ALI: ${bLabel} · HR: ${s.meanHr} bpm · Kualitas: ${qLabel}`
    : `RMSSD: ${s.rmssd} ms · ALI: ${bLabel} · HR: ${s.meanHr} bpm · Quality: ${qLabel}`;

  _hset(containerId, `
    <div class="hrv-strip hrv-strip-data ${_bandCss(b)}">
      <div class="hrv-strip-vitals">${vitals}</div>
      <div class="hrv-strip-ctx">${ctx}</div>
    </div>`);
}

function renderHrvStrip_BioAge()    { _renderStrip('bio_age',   'hrv-strip-ba'); }
function renderHrvStrip_Oxidative() { _renderStrip('oxidative', 'hrv-strip-ox'); }
function renderHrvStrip_Toxic()     { _renderStrip('toxic',     'hrv-strip-tx'); }
function renderHrvStrip_Metabolic() { _renderStrip('metabolic', 'hrv-strip-mt'); }
function renderHrvStrip_Cardio()    { _renderStrip('cardio',    'hrv-strip-cr'); }
function renderHrvStrip_Nutrient()  { _renderStrip('nutrient',  'hrv-strip-nt'); }
function renderHrvStrip_Skin()      { _renderStrip('skin',      'hrv-strip-sk'); }

// =============================================================================
// SECTION 8 — renderHrvPanel() orchestrator
// =============================================================================

function renderHrvPanel() {
  renderHrvStrip_BioAge();
  renderHrvStrip_Oxidative();
  renderHrvStrip_Toxic();
  renderHrvStrip_Metabolic();
  renderHrvStrip_Cardio();
  renderHrvStrip_Nutrient();
  renderHrvStrip_Skin();
  if (!hrvState) return;
  renderHrvModule();
}
