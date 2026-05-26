/**
 * QRMA JSON Importer Adapter
 * Version: 1.5.1
 * Date: 2026-05-24
 * Description: Maps structured JSON payloads to existing QRMA DOM inputs.
 * Phase 1.5 adds support for `warnings` and `{field}_zone` payload keys.
 * Zone values are stored as `data-zone` attributes on the target input element(s)
 * so the current calcAll() remains unchanged while Phase 2 can read them later.
 */
const QRMAImporter = (function() {
  function normalizeNumber(value) {
    if (value === null || value === undefined || value === '') return null;
    const num = Number(value);
    return isNaN(num) ? null : num;
  }

  function findMapping(sourceKey, mappings) {
    if (!sourceKey || !mappings) return null;
    const lowerKey = String(sourceKey).toLowerCase().trim();
    return mappings.find(m =>
      (m.id && String(m.id).toLowerCase().trim() === lowerKey) ||
      (m.en && String(m.en).toLowerCase().trim() === lowerKey) ||
      (m.dashboard_id && String(m.dashboard_id).toLowerCase().trim() === lowerKey)
    ) || null;
  }

  function splitAlsoMapsTo(alsoMapsTo) {
    if (!alsoMapsTo) return [];
    if (Array.isArray(alsoMapsTo)) return alsoMapsTo.filter(Boolean);
    if (typeof alsoMapsTo === 'string') return alsoMapsTo.split(',').map(s => s.trim()).filter(Boolean);
    return [];
  }

  function setFieldValue(id, value) {
    if (!id) return false;
    const el = document.getElementById(id);
    if (!el) return false;
    el.value = value;
    return true;
  }

  function setFieldZone(id, zone) {
    if (!id) return false;
    const el = document.getElementById(id);
    if (!el) return false;
    el.setAttribute('data-zone', String(zone));
    return true;
  }

  function applyPatient(patient, diagnostics) {
    if (!patient) return;

    if (patient.age !== undefined && patient.age !== '') {
      if (setFieldValue('age', patient.age)) diagnostics.writtenFieldIds.push('age');
      const ccAge = document.getElementById('cc-age');
      if (ccAge) ccAge.textContent = patient.age;
    }

    if (patient.gender) {
      let normalizedGender = String(patient.gender).toLowerCase().trim();
      if (['pria','laki-laki','laki laki','male','m','l'].includes(normalizedGender)) normalizedGender = 'male';
      if (['wanita','perempuan','female','f','p'].includes(normalizedGender)) normalizedGender = 'female';
      if (setFieldValue('gender', normalizedGender)) diagnostics.writtenFieldIds.push('gender');
      const ccGender = document.getElementById('cc-gender');
      if (ccGender) ccGender.textContent = normalizedGender === 'male' ? 'Male' : (normalizedGender === 'female' ? 'Female' : patient.gender);
    }

    if (patient.name) {
      const ccName = document.getElementById('cc-name');
      if (ccName) ccName.textContent = patient.name;
      const ccInitials = document.getElementById('cc-initials');
      if (ccInitials) ccInitials.textContent = String(patient.name).trim().split(/\s+/).map(w => w[0]).join('').toUpperCase().slice(0,2) || '?';
      const ccCard = document.getElementById('client-card');
      if (ccCard) ccCard.style.display = 'flex';
    }

    if (patient.testdate) {
      const ccDate = document.getElementById('cc-date');
      if (ccDate) ccDate.textContent = patient.testdate;
    }

    diagnostics.patientApplied = true;
  }

  function importFromPayload(payload, mappings) {
    const diagnostics = {
      patientApplied: false,
      mappedCount: 0,
      writtenFieldIds: [],
      unmappedItems: [],
      verificationNeeded: [],
      invalidValues: [],
      duplicateTargets: [],
      warnings: []
    };

    applyPatient(payload.patient || {}, diagnostics);
    const writtenTargets = new Set();

    Object.entries(payload.values || {}).forEach(([sourceKey, rawValue]) => {
      const key = String(sourceKey);

      if (key.toLowerCase() === 'warnings') {
        diagnostics.mappedCount += 1;
        return;
      }

      if (key.endsWith('_zone')) {
        const baseKey = key.replace(/_zone$/, '');
        const mapping = findMapping(baseKey, mappings);
        const targets = mapping
          ? [mapping.dashboard_id, ...splitAlsoMapsTo(mapping.also_maps_to)].filter(Boolean)
          : [baseKey];
        let zoneApplied = false;
        targets.forEach(id => { if (setFieldZone(id, rawValue)) zoneApplied = true; });
        if (zoneApplied) diagnostics.mappedCount += 1;
        else diagnostics.unmappedItems.push(key);
        return;
      }

      const mapping = findMapping(key, mappings);
      const numericValue = normalizeNumber(rawValue);
      if (numericValue === null) {
        diagnostics.invalidValues.push({ sourceKey: key, rawValue });
        return;
      }

      if (!mapping) {
        if (setFieldValue(key, numericValue)) {
          diagnostics.mappedCount += 1;
          diagnostics.writtenFieldIds.push(key);
          return;
        }
        diagnostics.unmappedItems.push(key);
        return;
      }

      if (mapping.needs_verification) diagnostics.verificationNeeded.push(key);
      const targets = [mapping.dashboard_id, ...splitAlsoMapsTo(mapping.also_maps_to)].filter(Boolean);
      targets.forEach(id => {
        if (writtenTargets.has(id)) {
          diagnostics.duplicateTargets.push({ id, sourceKey: key });
          diagnostics.warnings.push(`Duplicate write to field: ${id} from ${key}`);
        }
        if (setFieldValue(id, numericValue)) {
          diagnostics.writtenFieldIds.push(id);
          writtenTargets.add(id);
        } else {
          diagnostics.warnings.push(`Missing DOM field: ${id}`);
        }
      });
      if (targets.length) diagnostics.mappedCount += 1;
    });

    if (typeof window.calcAll === 'function') {
      try { window.calcAll(); }
      catch (e) { diagnostics.warnings.push(`Error executing calcAll(): ${e.message}`); }
    }

    return diagnostics;
  }

  return { importFromPayload, _test: { findMapping, splitAlsoMapsTo, normalizeNumber } };
})();
