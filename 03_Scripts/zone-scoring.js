// =============================================================================
// zone-scoring.js
// Version: 1.1
// Date: 2026-05-26
// Purpose: Standalone zone-to-score mapping module for the QRMA dashboard.
//          Converts QRMA PDF zone labels (normal/ringan/sedang/berat) into
//          numeric scores, display badges, and CSS colour classes.
//          No HTML dependency. No imports. Safe to load in browser or Node.
// =============================================================================

let currentLang = 'en';

const ZONE_SCORES = {
  normal:  9,
  ringan:  6,
  sedang:  3,
  berat:   1,
  unknown: 0
};

const ZONE_BADGES = {
  normal:  { en: 'Normal',        id: 'Normal'           },
  ringan:  { en: 'Mild',           id: 'Perlu Perhatian'  },
  sedang:  { en: 'Moderate',      id: 'Perlu Tindakan'   },
  berat:   { en: 'Top Priority',   id: 'Prioritas Utama'  },
  unknown: { en: '—',              id: '—'                }
};

const ZONE_COLORS = {
  normal:  'zone-normal',
  ringan:  'zone-ringan',
  sedang:  'zone-sedang',
  berat:   'zone-berat',
  unknown: 'zone-unknown'
};

function scoreFromZone(zoneLabel) {
  return ZONE_SCORES[zoneLabel] ?? 0;
}

function getBadge(zoneLabel) {
  return ZONE_BADGES[zoneLabel]?.[currentLang] ?? '—';
}

function getColor(zoneLabel) {
  return ZONE_COLORS[zoneLabel] ?? 'zone-unknown';
}

function setLang(lang) {
  if (lang === 'en' || lang === 'id') {
    currentLang = lang;
  }
}
