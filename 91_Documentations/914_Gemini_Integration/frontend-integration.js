function buildAiPayload(calcResult, practitionerNote = "", language = "en") {
  return {
    client_profile: {
      client_id: calcResult.clientId || null,
      name: calcResult.clientName || null,
      age: calcResult.age || null,
      gender: calcResult.gender || null,
      scan_date: calcResult.scanDate || new Date().toISOString(),
      language
    },
    instrument: "both",
    flagged_qrma_params: calcResult.flaggedQrmaParams || [],
    flagged_gdv_params: calcResult.flaggedGdvParams || [],
    confirmed_correlations: calcResult.confirmedCorrelations || [],
    cluster_a: {
      score: calcResult.clusterAScore || 0,
      severity: calcResult.clusterASeverity || "none"
    },
    cluster_b: {
      score: calcResult.clusterBScore || 0,
      severity: calcResult.clusterBSeverity || "none"
    },
    cluster_c: {
      score: calcResult.clusterCScore || 0,
      severity: calcResult.clusterCSeverity || "none"
    },
    primary_cluster: calcResult.primaryCluster || "none",
    active_clusters: calcResult.activeClusters || [],
    matched_patterns: calcResult.matchedPatterns || [],
    primary_tcm_pattern: calcResult.primaryTcmPattern || null,
    stress_index: calcResult.stressIndex ?? null,
    energy_total: calcResult.energyTotal ?? null,
    energy_reserve: calcResult.energyReserve ?? null,
    lifestyle_scores: calcResult.lifestyleScores || {},
    chakra_alignment: calcResult.chakraAlignment || {},
    red_flags: calcResult.redFlags || [],
    practitioner_note: practitionerNote || ""
  };
}

async function generateAiSynthesis(calcResult) {
  const practitionerNote = document.querySelector("#practitionerNote")?.value || "";
  const payload = buildAiPayload(calcResult, practitionerNote, "en");
  const res = await fetch("/api/ai/synthesis", {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify(payload)
  });
  const json = await res.json();
  if (!json.ok) throw new Error(json.error?.message || "AI synthesis failed");
  return json.data;
}

async function generatePatientSummary(calcResult, language = "en") {
  const payload = buildAiPayload(calcResult, "", language);
  const res = await fetch("/api/ai/patient-summary", {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify(payload)
  });
  const json = await res.json();
  if (!json.ok) throw new Error(json.error?.message || "Patient summary failed");
  return json.data;
}
