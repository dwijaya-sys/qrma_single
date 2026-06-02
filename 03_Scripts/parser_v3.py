# parser_v3.py
# =============================================================================
# QRMA PDF Parser — Version 3.2
# Last updated: 2026-06-01
# =============================================================================
#
# Changelog from v2:
#   NEW  parse_float_range()       : parses zone boundary strings like
#                                    "0.253-0.659" or ">1.213" into (lo, hi)
#   NEW  detect_direction()        : infers higher-worse vs lower-worse from
#                                    the relative positions of Normal and Ringan zones
#   NEW  derive_zone()             : maps a raw value to a zone label using
#                                    extracted zone boundaries
#   NEW  zone_to_score()           : converts zone label to 1-10 display score
#                                    (normal=9, ringan=6, sedang=3, berat=1)
#   NEW  parse_referensi_standar() : extracts the 4-zone boundary table from
#                                    the Referensi Standar PDF section
#   UPD  parse_qrma_pdf()          : now also extracts ref_standards alongside
#                                    items; handles multi-page Referensi Standar
#                                    spill; skips (Elemen Manusia) sections
#   UPD  apply_mappings()          : now attaches zone_result to every mapped param
#   UPD  DASHBOARD_FIELDS          : extended with _zone columns (backward compatible)
#   UPD  export_dashboard_csv()    : writes zone columns alongside raw values
#   UPD  ingest_to_db()            : lazy database import (unchanged behaviour)
#   UNC  load_mappings()           : unchanged
#   UNC  clean_text()              : unchanged
#   UNC  parse_float()             : unchanged
#   UNC  _normalize_gender()       : unchanged
#
# Patch v3.1 — 2026-05-27:
#   FIX  _flush_ref_buffer()       : changed from dict.update() (last-wins) to
#                                    most-complete-wins merge. Prevents wrong-scale
#                                    zone overwrite when a param appears in multiple
#                                    PDF sections (e.g. Kekentalan Darah / bv).
#   FIX  export_dashboard_csv()    : CSV write mode changed from append ("a") to
#                                    overwrite ("w"). One run = one patient = one row.
#   FIX  apply_mappings()          : Direction extension added to Tier 1 ref_standards
#                                    path. When derive_zone() returns "unknown" and
#                                    direction is known, apply safe-floor rule:
#                                    higher-worse + value < normal floor  → "normal"
#                                    lower-worse  + value > normal ceiling → "normal"
#                                    Previously only existed in Tier 2 fallback.
#
# =============================================================================

import pdfplumber
import re
import os
import json
import csv
import sys
from datetime import datetime


# =============================================================================
# SECTION 1 — CONSTANTS
# =============================================================================

# Raw value fields — one column per dashboard input.
# Order is canonical: demographics → modules → warnings.
# This list is BACKWARD COMPATIBLE with v2 CSV imports.
DASHBOARD_RAW_FIELDS = [
    # Demographics (extracted from PDF page 1 header)
    "name", "age", "gender", "test_date",

    # Biological Age module (unprefixed IDs used by bio-age scoring functions)
    "bv",   # Blood Viscosity
    "cp",   # Cholesterol Plaque Signal
    "art",  # Vascular Resistance (Arteriosclerosis)
    "ins",  # Insulin Secretion Coefficient
    "bs",   # Blood Sugar Coefficient
    "fr",   # Skin Free Radicals (bio-age pillar 2 copy)
    "hyp",  # Hypoxia Index
    "ph",   # Body pH (bio-age copy)
    "pb",   # Lead (bio-age pillar 2 copy)
    "hg",   # Mercury (bio-age pillar 2 copy)
    "ce",   # Eye Collagen (bio-age pillar 3 copy)
    "cs",   # Skin Collagen (bio-age pillar 3 copy)
    "cj",   # Joint Collagen (bio-age pillar 3 copy)
    "coq",  # CoQ10 (bio-age pillar 3 copy)
    "gsh",  # Glutathione (bio-age pillar 3 copy)
    "vc",   # Vitamin C (bio-age pillar 3 copy)
    "ve",   # Vitamin E (bio-age pillar 3 copy)
    "ost",  # Osteoclast Level

    # Oxidative Stress module
    "ox-gsh", "ox-coq", "ox-vc", "ox-ve", "ox-sel",
    "ox-fr",  "ox-hyp", "ox-ph",

    # Toxic Exposure module
    "tx-pb", "tx-hg", "tx-cd", "tx-as",
    "tx-st", "tx-tb", "tx-ps",

    # Metabolic Risk module
    "mt-tg", "mt-ug", "mt-ins", "mt-fm", "mt-bmi", "mt-wc",

    # Cardio-Renal module
    "cr-ch", "cr-vf", "cr-lv", "cr-ua", "cr-pt", "cr-k", "cr-mg",

    # Nutrient Sufficiency module
    "nt-zn", "nt-mg", "nt-k",  "nt-io", "nt-si",
    "nt-b6", "nt-vc", "nt-d3", "nt-ve", "nt-fo",

    # Skin and Collagen module
    "sk-sc", "sk-el", "sk-tw", "sk-sb",
    "sk-ml", "sk-sn", "sk-ec", "sk-jc",

    # Digestive Function module (v5.0)
    "dg-lp",  # Gastric Peristalsis
    "dg-la",  # Gastric Absorption
    "dg-sp",  # Small Intestine Peristalsis
    "dg-sa",  # Small Intestine Absorption
    "dg-lc",  # Large Intestine Motility
    "dg-ca",  # Colonic Absorption
    "dg-bi",  # Intestinal Bacteria Balance
    "dg-ip",  # Intraluminal Pressure  <- higher-worse (direction auto-detected from PDF)
    "dg-ds",  # Digestive System Overall (secondary, half-weight in cDg Sub-index C)

    # Meta
    "warnings",
]

# Zone fields — one per raw field (demographics and meta excluded).
# Each zone column stores: "normal" | "ringan" | "sedang" | "berat" | "unknown"
# Appended AFTER all raw fields so v2 CSV importers are unaffected.
_ZONE_ELIGIBLE = [
    fid for fid in DASHBOARD_RAW_FIELDS
    if fid not in ("name", "age", "gender", "test_date", "warnings")
]
DASHBOARD_ZONE_FIELDS = [f"{fid}_zone" for fid in _ZONE_ELIGIBLE]

# Full canonical column list
DASHBOARD_FIELDS = DASHBOARD_RAW_FIELDS + DASHBOARD_ZONE_FIELDS

# Zone label to 1-10 display score (midpoint of each display band)
ZONE_SCORES = {
    "normal":  9,   # band 8-10, green
    "ringan":  6,   # band 5-7,  blue/amber
    "sedang":  3,   # band 3-4,  yellow
    "berat":   1,   # band 1-2,  red
    "unknown": 0,   # no data
}


# =============================================================================
# SECTION 2 — GENERAL HELPERS
# =============================================================================

def clean_text(text):
    """Removes newlines and extra whitespace from extracted PDF text."""
    if not text:
        return ""
    return " ".join(text.replace("\n", " ").split()).strip()


def parse_float(value_str):
    """
    Extracts a float from messy PDF strings.
    Handles Indonesian decimal commas ('61,274' → 61.274),
    comparison prefixes ('< 0.2' → 0.2), and plain floats.
    Returns 0.0 on any parse failure.
    """
    if not value_str:
        return 0.0
    try:
        normalized = str(value_str).replace(",", ".")
        cleaned = re.sub(r"[^\d.\-]", "", normalized)
        return float(cleaned) if cleaned else 0.0
    except Exception:
        return 0.0


# =============================================================================
# SECTION 3 — REFERENSI STANDAR PARSER (NEW IN V3)
# =============================================================================

def parse_float_range(raw_str):
    """
    Parses a zone boundary string from Referensi Standar into a (lo, hi) tuple.

    Supported formats:
        "0.253-0.659"  -> (0.253, 0.659)    standard range
        ">1.213"       -> (1.213, inf)       open-ended upper (higher = berat)
        "<55.347"      -> (-inf, 55.347)     open-ended lower (lower = berat)
        "0.253"        -> (0.253, 0.253)     single value edge case

    Indonesian decimal commas are normalised to dots before parsing.
    """
    if not raw_str:
        return (0.0, 0.0)

    s = raw_str.strip().replace(",", ".")

    if s.startswith(">"):
        return (parse_float(s[1:]), float("inf"))

    if s.startswith("<"):
        return (float("-inf"), parse_float(s[1:]))

    # Split on dash that lies between digit characters (avoid negative numbers)
    parts = re.split(r"(?<=[\d.])-(?=[\d.])", s)
    if len(parts) == 2:
        return (parse_float(parts[0]), parse_float(parts[1]))

    val = parse_float(s)
    return (val, val)


def detect_direction(normal_range, ringan_range):
    """
    Infers the direction of concern by comparing zone midpoints.

    If the Ringan(+) zone sits ABOVE the Normal(-) zone:
        higher raw values are worse  ->  "higher-worse"
    If the Ringan(+) zone sits BELOW the Normal(-) zone:
        lower raw values are worse   ->  "lower-worse"

    Returns: "higher-worse" | "lower-worse"
    """
    def _mid(rng):
        lo, hi = rng
        lo = lo if lo != float("-inf") else 0.0
        hi = hi if hi != float("inf")  else lo * 2
        return (lo + hi) / 2.0

    return "higher-worse" if _mid(ringan_range) > _mid(normal_range) else "lower-worse"


def derive_zone(raw_value, zones):
    """
    Maps a raw value to a zone label using extracted zone boundaries.

    Checks in priority order: normal -> ringan -> sedang -> berat.
    A value is inside a zone if lo <= value <= hi.

    Returns: "normal" | "ringan" | "sedang" | "berat" | "unknown"
    """
    def _in(val, rng):
        lo, hi = rng
        return lo <= val <= hi

    for label in ("normal", "ringan", "sedang", "berat"):
        rng = zones.get(label)
        if rng and _in(raw_value, rng):
            return label

    return "unknown"


def zone_to_score(zone_label):
    """Converts a zone label to a 1-10 display score."""
    return ZONE_SCORES.get(zone_label, 0)


# Zone suffix string -> zone label name
_ZONE_SUFFIX_MAP = {"-": "normal", "+": "ringan", "++": "sedang", "+++": "berat"}

# Regex: matches a single zone entry like "0.253-0.659(-)" or ">1.213(+++)"
_ZONE_ENTRY_RE = re.compile(
    r"([<>]?\s*[\d,. ]+(?:\s*[-\u2013]\s*[\d,. ]+)?)"  # value or range
    r"\s*\((-|\+{1,3})\)",                               # zone label in parens
    re.UNICODE,
)

# Regex: matches a parameter name at the start of a line (word(s) + colon)
_PARAM_NAME_RE = re.compile(
    r"^([\w\s/()\u03B1-\u03C9\u00C0-\u00FF.,'\-]+?):\s*",
    re.MULTILINE | re.UNICODE,
)

# Structural noise lines that must never be treated as orphan name fragments.
# Covers: section headers, legend word fragments ("Abnormal Sedang..."),
# and bare parenthetical zone-suffix lines ("(++) (+++)" legend code lines
# that appear when pdfplumber splits the Referensi Standar header across pages).
_RS_NOISE_RE = re.compile(
    r"^(Parameter|Deskripsi|Abnormal|Normal)\b"  # legend words and section headers
    r"|\([-+]{1,3}\)\s*$",                        # line ends with a bare zone suffix like (+++)
    re.IGNORECASE,
)


def parse_referensi_standar(text_block):
    """
    Parses a Referensi Standar text block into a structured zone dictionary.

    The block format (two-column layout in PDF, merged by pdfplumber):

        Lysine:     0.253-0.659(-)   0.659-0.962(+)
                    0.962-1.213(++)  >1.213(+++)

    For each parameter found, extracts all four zone boundaries and infers
    the direction of concern (higher-worse vs lower-worse).

    Returns:
        dict of {
            param_name: {
                "normal":    (lo, hi) tuple or None,
                "ringan":    (lo, hi) tuple or None,
                "sedang":    (lo, hi) tuple or None,
                "berat":     (lo, hi) tuple or None,
                "direction": "higher-worse" | "lower-worse" | "unknown",
            }
        }
    """
    results = {}

    # Strip the legend line so its labels aren't parsed as zone values
    text_block = re.sub(
        r"Normal\(-\).*?Abnormal Berat\(\+\+\+\)",
        "",
        text_block,
        flags=re.DOTALL | re.IGNORECASE,
    )
    # Strip section markers
    text_block = re.sub(r"Referensi Standar\s*:", "", text_block, flags=re.IGNORECASE)
    text_block = re.sub(r"Laporan ujian",          "", text_block, flags=re.IGNORECASE)

    # ── Orphan-name pre-pass ─────────────────────────────────────────────────
    # pdfplumber sometimes splits a long parameter name + its zone data across
    # multiple lines.  The exact pattern seen in the PDF for dg-lc:
    #
    #   [L1] 'Kofisien Fungsi Peristaltik Usus'   ← orphan: no colon, no zones
    #   [L2] '4.572-6.483(-) 3.249-4.572(+)'      ← zone data (normal + ringan)
    #   [L3] 'Besar:'                               ← name tail + colon, no zones
    #   [L4] '2.031-3.249(++) <2.031(+++)'         ← zone data (sedang + berat)
    #
    # Without the fix the main loop captures only "Besar" with 2 zones.
    # Fix: detect [L1, L2, L3] → rewrite as [L1+L3, L2] so the main loop sees:
    #   'Kofisien Fungsi Peristaltik Usus Besar:'  ← full name + colon
    #   '4.572-6.483(-) 3.249-4.572(+)'            ← continuation (all 4 zones follow)
    #   '2.031-3.249(++) <2.031(+++)'
    #
    # Also handles the simpler 2-line case:
    #   [L1] 'Name Fragment'                        ← no colon, no zones
    #   [L2] 'Fragment2: zone_data'                 ← colon + zones on same line
    # → merged into 'Name Fragment Fragment2: zone_data'

    def _next_nonempty(lines, from_idx):
        """Return (absolute_idx, stripped_text) of first non-empty line after from_idx."""
        j = from_idx + 1
        while j < len(lines):
            s = lines[j].strip()
            if s:
                return j, s
            j += 1
        return None, None

    raw_lines = text_block.splitlines()
    preproc   = []
    k = 0
    while k < len(raw_lines):
        ln = raw_lines[k].strip()
        if not ln:
            preproc.append(ln)
            k += 1
            continue

        has_zone = bool(_ZONE_ENTRY_RE.search(ln))
        is_name  = bool(_PARAM_NAME_RE.match(ln))
        is_noise = bool(_RS_NOISE_RE.match(ln))

        has_digit = bool(re.search(r'\d', ln))
        if not has_zone and not is_name and not is_noise and not has_digit:
            # Candidate orphan name fragment — look ahead
            j1, l1 = _next_nonempty(raw_lines, k)
            if l1 is not None:
                l1_has_zone = bool(_ZONE_ENTRY_RE.search(l1))
                l1_is_name  = bool(_PARAM_NAME_RE.match(l1))

                # Simple case: orphan → next line has colon AND zones
                if l1_is_name and l1_has_zone:
                    preproc.append(ln + " " + l1)
                    k = j1 + 1
                    continue

                # Complex case: orphan → zone_data_line → colon_only_line
                # Zone data between the two name fragments belongs to this param.
                if l1_has_zone and not l1_is_name:
                    j2, l2 = _next_nonempty(raw_lines, j1)
                    if (l2 is not None
                            and _PARAM_NAME_RE.match(l2)
                            and not _ZONE_ENTRY_RE.search(l2)):
                        # Emit merged name first, then the interleaved zone data.
                        preproc.append(ln + " " + l2)   # full name + colon
                        preproc.append(l1)               # zone data (continuation)
                        k = j2 + 1                       # resume after colon line
                        continue

        preproc.append(ln)
        k += 1

    current_param = None

    for line in preproc:
        line = line.strip()
        if not line:
            continue

        # Detect a new parameter name ("ParameterName: ...")
        param_match = _PARAM_NAME_RE.match(line)
        if param_match:
            current_param = param_match.group(1).strip()
            if current_param not in results:
                results[current_param] = {}
            remainder = line[param_match.end():]
        else:
            remainder = line  # continuation line for current parameter

        if current_param is None:
            continue

        # Extract all zone entries from this line segment
        for m in _ZONE_ENTRY_RE.finditer(remainder):
            raw_range_str = m.group(1).strip()
            zone_suffix   = m.group(2).strip()
            zone_label    = _ZONE_SUFFIX_MAP.get(zone_suffix)
            if zone_label:
                results[current_param][zone_label] = parse_float_range(raw_range_str)

    # Infer direction of concern for each parameter
    for param_name, zones in results.items():
        if "normal" in zones and "ringan" in zones:
            results[param_name]["direction"] = detect_direction(
                zones["normal"], zones["ringan"]
            )
        else:
            results[param_name]["direction"] = "unknown"

    return results


# =============================================================================
# SECTION 4 — DEMOGRAPHICS HELPERS
# =============================================================================

_GENDER_MAP = {
    "pria":      "male",
    "laki-laki": "male",
    "laki laki": "male",
    "l":         "male",
    "wanita":    "female",
    "perempuan": "female",
    "p":         "female",
}


def _normalize_gender(raw):
    """Converts Indonesian gender labels to 'male' or 'female'."""
    return _GENDER_MAP.get(raw.lower().strip(), raw.lower().strip() or "unknown")


# =============================================================================
# SECTION 5 — PDF PARSER
# =============================================================================

# Sections that have no Referensi Standar block — skip ref extraction for these
_SKIP_REF_STANDAR_SECTIONS = {"elemen manusia"}


def parse_qrma_pdf(file_path):
    """
    Extracts all data from a QRMA PDF report file.

    Returns a dict with three keys:
        demographics : { name, gender, age, figure, test_date, test_date_obj }
        items        : list of { category, parameter_name, normal_range, actual_value }
        ref_standards: dict of { param_name -> zone boundaries + direction }

    New in v3: ref_standards populated from Referensi Standar sections.
    Handles Referensi Standar blocks that spill across page boundaries.
    Skips ref extraction for (Elemen Manusia) sections (no ref block in PDF).
    """
    data = {
        "demographics":  {},
        "items":         [],
        "ref_standards": {},
    }

    # State vars for cross-page Referensi Standar accumulation
    in_ref_standar     = False
    ref_standar_buffer = ""
    skip_ref_standar   = False   # set True for sections without a ref block

    with pdfplumber.open(file_path) as pdf:

        # --- 1. Extract Demographics from Page 1 ---
        first_page_text = pdf.pages[0].extract_text() or ""

        name_match   = re.search(r"Nama:\s*(.*?)\s+Jenis Kelamin:", first_page_text)
        gender_match = re.search(r"Jenis Kelamin:\s*(.*?)\s+Umur:",  first_page_text)
        age_match    = re.search(r"Umur:\s*(\d+)",                   first_page_text)
        figure_match = re.search(r"Figur:\s*(.*?)\s+Tanggal Ujian:", first_page_text)
        date_match   = re.search(r"Tanggal Ujian:\s*([\d/:\s]+)",    first_page_text)

        data["demographics"] = {
            "name":      name_match.group(1).strip()   if name_match   else "Unknown",
            "gender":    _normalize_gender(
                             gender_match.group(1).strip() if gender_match else ""
                         ),
            "age":       int(age_match.group(1).strip()) if age_match  else 0,
            "figure":    figure_match.group(1).strip()  if figure_match else "",
            "test_date": date_match.group(1).strip()    if date_match   else "",
        }

        try:
            test_date_obj = datetime.strptime(
                data["demographics"]["test_date"], "%d/%m/%Y %H:%M"
            )
        except ValueError:
            test_date_obj = datetime.now()
        data["demographics"]["test_date_obj"] = test_date_obj

        # --- 2. Scan all pages for tables and Referensi Standar blocks ---
        current_category = "General"

        for page in pdf.pages:
            text = page.extract_text() or ""

            # Detect section header e.g. "(Asam Amino) Form Hasil Analisa"
            section_match = re.search(
                r"\((.+?)\)\s+Form Hasil Analisa", text, re.IGNORECASE
            )
            if section_match:
                # Flush any open ref buffer before switching to the new section
                if in_ref_standar and ref_standar_buffer.strip():
                    _flush_ref_buffer(ref_standar_buffer, data["ref_standards"])
                    ref_standar_buffer = ""
                    in_ref_standar = False

                section_name     = section_match.group(1).strip()
                current_category = section_name
                skip_ref_standar = section_name.lower() in _SKIP_REF_STANDAR_SECTIONS

            # --- 2a. Extract Hasil Pengujian Aktual table ---
            for table in page.extract_tables():
                if not table or not table[0]:
                    continue

                header = [clean_text(str(c)) for c in table[0]]
                if "Barang pengujian" not in header:
                    continue

                for row in table[1:]:
                    if len(row) < 3:
                        continue
                    param_name     = clean_text(row[0])
                    normal_range   = clean_text(row[1])
                    actual_val_str = clean_text(row[2])
                    if param_name and actual_val_str:
                        data["items"].append({
                            "category":       current_category,
                            "parameter_name": param_name,
                            "normal_range":   normal_range,
                            "actual_value":   parse_float(actual_val_str),
                        })

            # --- 2b. Extract Referensi Standar block ---
            if skip_ref_standar:
                # This section has no Referensi Standar (Elemen Manusia)
                continue

            if "Referensi Standar:" in text:
                # New ref block starts on this page
                start_idx = text.index("Referensi Standar:")
                end_idx   = text.find("Parameter Deskripsi", start_idx)

                if end_idx != -1:
                    # Entire block is on this page — parse immediately
                    _flush_ref_buffer(text[start_idx:end_idx], data["ref_standards"])
                    in_ref_standar     = False
                    ref_standar_buffer = ""
                else:
                    # Block spills to the next page — start accumulating
                    ref_standar_buffer = text[start_idx:]
                    in_ref_standar     = True

            elif in_ref_standar:
                # Continuation page for an open block
                end_idx = text.find("Parameter Deskripsi")
                if end_idx != -1:
                    # Block ends here — flush and close
                    ref_standar_buffer += "\n" + text[:end_idx]
                    _flush_ref_buffer(ref_standar_buffer, data["ref_standards"])
                    ref_standar_buffer = ""
                    in_ref_standar     = False
                else:
                    # Still continuing
                    ref_standar_buffer += "\n" + text

        # Flush any remaining buffer at end of document
        if in_ref_standar and ref_standar_buffer.strip():
            _flush_ref_buffer(ref_standar_buffer, data["ref_standards"])

    return data


def _flush_ref_buffer(text_block, ref_standards_dict):
    """
    Parses a Referensi Standar text block and merges results into ref_standards_dict.

    Merge strategy: most-complete-wins.
    When the same parameter name appears in multiple PDF sections, keep whichever
    extraction produced more zone keys (normal / ringan / sedang / berat).

    This handles two known cases:
    1. "Kekentalan Darah" (bv) — appears in two sections with DIFFERENT scales.
       Both have 4 zones, so the FIRST (correct 48–73 scale) is kept. ✓
    2. Parameters where the first PDF section has an incomplete Referensi Standar
       block (0–2 zones extracted) and a later section has the full 4-zone table.
       The later, more complete extraction wins. ✓
    """
    def _zone_count(zones):
        return sum(1 for k in ("normal", "ringan", "sedang", "berat") if k in zones)

    parsed = parse_referensi_standar(text_block)
    for param_name, zones in parsed.items():
        if param_name not in ref_standards_dict:
            ref_standards_dict[param_name] = zones
        else:
            # Replace only if the new extraction is strictly more complete
            if _zone_count(zones) > _zone_count(ref_standards_dict[param_name]):
                ref_standards_dict[param_name] = zones


# =============================================================================
# SECTION 6 — MAPPING LAYER
# =============================================================================

def load_mappings(mappings_path):
    """
    Loads mappings.json and returns a lookup dict keyed by Indonesian param name.

    Each entry contains:
        dashboard_id      : primary dashboard field ID
        also_maps_to      : list of additional field IDs this param feeds
        needs_verification: True if the mapping is uncertain
        note              : human-readable explanation
        en                : English translation
        zone_boundaries   : dict of zone ranges (fallback when PDF ref not found)
        direction         : "higher-worse" | "lower-worse" | "bidirectional" | ""
    """
    if not os.path.exists(mappings_path):
        raise FileNotFoundError(
            f"[!] mappings.json not found: {mappings_path}\n"
            f"    Place it alongside parser_v3.py or use --mappings."
        )

    with open(mappings_path, "r", encoding="utf-8") as f:
        raw = json.load(f)

    lookup = {}
    for entry in raw:
        name = entry.get("id", "").strip()
        if not name:
            continue

        # Parse zone_boundaries — convert [lo, hi] arrays to (lo, hi) tuples,
        # replacing JSON null with Python float('inf') or float('-inf')
        raw_zb    = entry.get("zone_boundaries") or {}
        zone_boundaries = {}
        for zone_key, bounds in raw_zb.items():
            if bounds and len(bounds) == 2:
                lo = bounds[0] if bounds[0] is not None else float("-inf")
                hi = bounds[1] if bounds[1] is not None else float("inf")
                zone_boundaries[zone_key] = (lo, hi)

        lookup[name] = {
            "dashboard_id":       entry.get("dashboard_id", ""),
            "also_maps_to":       entry.get("also_maps_to", []),
            "needs_verification": entry.get("needs_verification", False),
            "note":               entry.get("note", ""),
            "en":                 entry.get("en", ""),
            "zone_boundaries":    zone_boundaries,       # NEW in v3 update
            "direction":          entry.get("direction", ""),  # NEW in v3 update
        }

    return lookup


def _derive_zone_from_boundaries(raw_value, zone_boundaries, direction):
    """
    Fallback zone derivation using zone_boundaries from mappings.json.
    Used when the PDF's Referensi Standar section doesn't contain this parameter
    (e.g. non-standard 'Kisaran Yang Sehat' format sections in the PDF),
    or as a secondary attempt when ref_standards data returned "unknown".

    Supports three boundary structures:

    1. Full 4-zone (normal + ringan + sedang + berat):
       Checks each zone in order; returns the first match.

    2. 2-zone / normal-only (only 'normal' key present):
       Inside normal range  → "normal"
       Outside either side  → "berat"  (covers bidirectional and simple cases)

    3. 2-zone higher-worse (normal + berat keys):
       Inside normal range  → "normal"
       Above normal range   → "berat"

    Direction-aware safe-floor extension:
      QRMA zones only define ranges from the normal floor upward (for higher-worse)
      or downward (for lower-worse). Values in the opposite (safe) direction have
      no defined zone and would otherwise return "unknown". Instead:
        higher-worse: value < normal_min  → "normal" (lower = safer)
        lower-worse:  value > normal_max  → "normal" (higher = safer)

    Returns: "normal" | "ringan" | "sedang" | "berat" | "unknown"
    """
    if not zone_boundaries:
        return "unknown"

    def _in(val, rng):
        lo, hi = rng
        return lo <= val <= hi

    normal_range = zone_boundaries.get("normal")

    # Direction-aware extension: handle values that fall outside all defined
    # zones in the safe (non-concern) direction
    if normal_range and direction:
        lo, hi = normal_range
        if direction == "higher-worse" and raw_value < lo:
            # Below normal floor for a higher-worse param = healthier than normal
            return "normal"
        if direction == "lower-worse" and raw_value > hi:
            # Above normal ceiling for a lower-worse param = healthier than normal
            return "normal"

    # Check normal zone
    if normal_range and _in(raw_value, normal_range):
        return "normal"

    # If detailed zones are available (ringan/sedang/berat), check them in order
    has_detail = any(k in zone_boundaries for k in ("ringan", "sedang", "berat"))
    if has_detail:
        for label in ("ringan", "sedang", "berat"):
            rng = zone_boundaries.get(label)
            if rng and _in(raw_value, rng):
                return label
        # Value exists but fell outside all defined zones
        return "unknown"

    # No detailed zones — outside normal = berat (handles bidirectional and 2-zone cases)
    if normal_range:
        return "berat"

    return "unknown"


def apply_mappings(parsed_items, primary_lookup, ref_standards):
    """
    Translates parsed PDF items into dashboard field values + zone labels.

    Zone derivation priority (new in v3 update):
      1. PDF Referensi Standar (ref_standards dict) — auto-extracted, preferred
      2. mappings.json zone_boundaries (fallback) — for parameters whose PDF
         section uses non-standard 'Kisaran Yang Sehat' format instead of the
         standard (-)/(+)/(++)/+++) zone table

    For each item:
      1. Looks up the Indonesian name in primary_lookup.
      2. Writes raw value to all target field IDs (primary + also_maps_to).
      3. Tries zone lookup from ref_standards first.
      4. Falls back to zone_boundaries from mappings.json if ref_standards miss.
      5. Writes zone label to corresponding _zone field IDs.

    Returns:
        mapped          : { field_id -> raw value }
        zones           : { field_id_zone -> zone label }
        warnings        : list of warning strings
        unmapped_params : list of PDF param names with no mapping entry
    """
    mapped          = {}
    zones           = {}
    warnings        = []
    unmapped_params = []

    for item in parsed_items:
        param_name = item["parameter_name"]
        raw_value  = item["actual_value"]

        # Mapping lookup
        entry = primary_lookup.get(param_name)
        if entry is None:
            unmapped_params.append(param_name)
            continue

        # Collect all target field IDs
        targets = []
        if entry["dashboard_id"]:
            targets.append(entry["dashboard_id"])
        targets.extend(entry["also_maps_to"])

        if not targets:
            continue

        # Write raw value (first occurrence per field wins — preserves page order)
        for target_id in targets:
            if target_id not in mapped:
                mapped[target_id] = raw_value

        # ── Zone derivation — two-tier priority ──────────────────────────────
        # Tier 1: PDF Referensi Standar (auto-extracted, covers standard sections)
        # Only use ref_standards if it contains actual zone boundary data —
        # a dict with only a "direction" key (no zone ranges) must fall through
        # to Tier 2, otherwise the fallback never fires for non-standard sections.
        param_zones   = ref_standards.get(param_name)
        has_zone_data = param_zones and any(
            k in param_zones for k in ("normal", "ringan", "sedang", "berat")
        )

        if has_zone_data:
            zone_label = derive_zone(raw_value, param_zones)

            # Direction extension (Tier 1 — ref_standards path):
            # If value falls outside all extracted zone ranges, apply safe-floor rule.
            # higher-worse: value < normal floor  → below floor = safer → "normal"
            # lower-worse:  value > normal ceiling → above ceiling = safer → "normal"
            if zone_label == "unknown":
                _dir = param_zones.get("direction", "")
                _nrm = param_zones.get("normal")
                if _nrm:
                    _lo, _hi = _nrm
                    if _dir == "higher-worse" and raw_value < _lo:
                        zone_label = "normal"
                    elif _dir == "lower-worse" and raw_value > _hi:
                        zone_label = "normal"

            # If ref_standards had zone data but the value fell outside all
            # defined ranges (returns "unknown"), try the mappings.json fallback.
            # This handles cases where the PDF only extracted a partial zone set
            # (e.g. only the normal zone was parsed, ringan/sedang/berat missed).
            if zone_label == "unknown":
                fallback_boundaries = entry.get("zone_boundaries", {})
                direction           = entry.get("direction", "")
                if fallback_boundaries:
                    zone_label = _derive_zone_from_boundaries(
                        raw_value, fallback_boundaries, direction
                    )
        else:
            # Tier 2: mappings.json zone_boundaries fallback (covers non-standard
            # sections like 'Kisaran Yang Sehat' format in Gula Dalam Darah,
            # Kualitas Fisik Dasar, etc.)
            fallback_boundaries = entry.get("zone_boundaries", {})
            direction           = entry.get("direction", "")
            zone_label = _derive_zone_from_boundaries(
                raw_value, fallback_boundaries, direction
            )

        # Write zone label to each target's zone column (first occurrence wins)
        for target_id in targets:
            zone_col = f"{target_id}_zone"
            if zone_col not in zones:
                zones[zone_col] = zone_label

        # Flag unverified mappings that produced a non-zero value
        if entry["needs_verification"] and raw_value != 0.0:
            warnings.append(
                f"UNVERIFIED MAPPING: '{param_name}' -> {targets} "
                f"(value={raw_value}) | {entry['note']}"
            )

    return mapped, zones, warnings, unmapped_params


# =============================================================================
# SECTION 7 — SQLITE INGEST
# =============================================================================

def ingest_to_db(file_path, db_session):
    """
    Parses the QRMA PDF and upserts all records into SQLite.

    Database import is lazy (inside this function body) so that csv_exporter_v2.py
    can import parser_v3 without requiring database.py to be present.
    """
    # Lazy import: only triggered when this function is actually called
    from database import Patient, Report, ReportItem

    print(f"    Parsing for SQLite: {os.path.basename(file_path)}")
    parsed_data = parse_qrma_pdf(file_path)
    demo = parsed_data["demographics"]

    # Upsert Patient (keyed by name + gender + age)
    patient = db_session.query(Patient).filter_by(
        name=demo["name"], gender=demo["gender"], age=demo["age"]
    ).first()

    if not patient:
        patient = Patient(
            name=demo["name"],
            gender=demo["gender"],
            age=demo["age"],
            figure=demo["figure"],
        )
        db_session.add(patient)
        db_session.flush()

    # Guard against duplicate reports
    existing = db_session.query(Report).filter_by(
        patient_id=patient.id,
        test_date=demo["test_date_obj"],
    ).first()

    if existing:
        print("    [!] Report already in SQLite — skipping duplicate.")
        return

    report = Report(
        patient_id=patient.id,
        test_date=demo["test_date_obj"],
        file_name=os.path.basename(file_path),
    )
    db_session.add(report)
    db_session.flush()

    report_items = [
        ReportItem(
            report_id=report.id,
            category=item["category"],
            parameter_name=item["parameter_name"],
            normal_range=item["normal_range"],
            actual_value=item["actual_value"],
        )
        for item in parsed_data["items"]
    ]

    db_session.bulk_save_objects(report_items)
    db_session.commit()
    print(f"    [+] SQLite: {len(report_items)} parameters saved.")


# =============================================================================
# SECTION 8 — CSV EXPORT
# =============================================================================

def export_dashboard_csv(parsed_data, primary_lookup, output_csv_path):
    """
    Applies the mapping + zone layer and writes a dashboard-ready CSV row.

    CSV layout:
        Raw value columns (DASHBOARD_RAW_FIELDS) — v2 backward compatible
        Zone columns      (DASHBOARD_ZONE_FIELDS) — new in v3

    Appends one row per call. Safe for batch processing of multiple PDFs.

    Returns:
        mapped, zones, warnings, unmapped_params
    """
    demo          = parsed_data["demographics"]
    ref_standards = parsed_data.get("ref_standards", {})

    mapped, zones, warnings, unmapped_params = apply_mappings(
        parsed_data["items"], primary_lookup, ref_standards
    )

    # Inject demographics
    mapped["name"]      = demo.get("name", "")
    mapped["age"]       = demo.get("age",  "")
    mapped["gender"]    = demo.get("gender", "")
    mapped["test_date"] = demo.get("test_date", "")

    # Warning: unmapped PDF parameters
    if unmapped_params:
        warnings.append(
            f"PDF PARAMETERS WITH NO MAPPING ({len(unmapped_params)}): "
            + " | ".join(unmapped_params)
        )

    # Warning: dashboard fields with no raw value
    missing_raw = [
        fid for fid in DASHBOARD_RAW_FIELDS
        if fid not in ("name", "age", "gender", "test_date", "warnings")
        and fid not in mapped
    ]
    if missing_raw:
        warnings.append(
            f"DASHBOARD FIELDS NOT POPULATED ({len(missing_raw)}): "
            + " | ".join(missing_raw)
        )

    # Warning: fields that have raw values but no zone data
    unknown_zones = [
        col for col in DASHBOARD_ZONE_FIELDS
        if zones.get(col, "unknown") == "unknown"
        and col.replace("_zone", "") in mapped
    ]
    if unknown_zones:
        warnings.append(
            f"ZONE DATA MISSING ({len(unknown_zones)} fields): "
            + " | ".join(unknown_zones)
        )

    mapped["warnings"] = " ;; ".join(warnings) if warnings else ""

    # Build the full output row
    row = {fid: mapped.get(fid, "") for fid in DASHBOARD_RAW_FIELDS}
    row.update({col: zones.get(col, "unknown") for col in DASHBOARD_ZONE_FIELDS})

    # Write CSV — always overwrite, one row per run
    os.makedirs(os.path.dirname(os.path.abspath(output_csv_path)), exist_ok=True)

    with open(output_csv_path, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=DASHBOARD_FIELDS, extrasaction="ignore")
        writer.writeheader()
        writer.writerow(row)

    print(f"[+] CSV row written -> {output_csv_path}")

    if warnings:
        print(f"[!] {len(warnings)} warning(s) — see 'warnings' column in CSV.")
        for w in warnings:
            print(f"    -> {w}".encode(
                sys.stdout.encoding or 'utf-8',
                errors='replace'
            ).decode(sys.stdout.encoding or 'utf-8'))

    return mapped, zones, warnings, unmapped_params


# =============================================================================
# SECTION 9 — FULL PIPELINE WRAPPER
# =============================================================================

def parse_and_export(file_path, db_session, mappings_path, output_csv_path):
    """
    Runs the complete v3 QRMA pipeline in one call:
        1. Parse PDF  (items + demographics + ref_standards)
        2. Ingest raw parameters into SQLite
        3. Load mappings.json
        4. Apply mappings + zone derivation
        5. Export dashboard-ready CSV (raw + zone columns)
    """
    print(f"\n{'='*60}")
    print(f"  QRMA Parser v3 — Full Pipeline")
    print(f"  PDF     : {os.path.basename(file_path)}")
    print(f"  DB      : SQLite")
    print(f"  CSV out : {output_csv_path}")
    print(f"{'='*60}\n")

    print("[1/4] Parsing PDF (parameters + Referensi Standar)...")
    parsed_data = parse_qrma_pdf(file_path)
    demo = parsed_data["demographics"]
    print(
        f"      Patient   : {demo['name']}\n"
        f"      Age       : {demo['age']}  |  Gender: {demo['gender']}\n"
        f"      Test date : {demo['test_date']}\n"
        f"      Parameters extracted       : {len(parsed_data['items'])}\n"
        f"      Ref Standard entries found : {len(parsed_data['ref_standards'])}"
    )

    print("\n[2/4] Writing to SQLite...")
    ingest_to_db(file_path, db_session)

    print("\n[3/4] Loading mappings...")
    primary_lookup = load_mappings(mappings_path)
    print(f"      Mapping entries: {len(primary_lookup)}")

    print("\n[4/4] Applying mappings + zone derivation, exporting CSV...")
    mapped, zones, warnings, unmapped = export_dashboard_csv(
        parsed_data, primary_lookup, output_csv_path
    )

    populated = sum(
        1 for k, v in mapped.items()
        if k not in ("name", "age", "gender", "test_date", "warnings")
        and v not in ("", 0.0)
    )
    zoned = sum(1 for v in zones.values() if v != "unknown")

    print(f"\n{'='*60}")
    print(f"  Done.")
    print(f"  Dashboard fields populated  : {populated}")
    print(f"  Fields with zone data       : {zoned} / {len(DASHBOARD_ZONE_FIELDS)}")
    print(f"  Warnings                    : {len(warnings)}")
    print(f"  Unmapped PDF parameters     : {len(unmapped)}")
    print(f"{'='*60}\n")

    return mapped, zones, warnings, unmapped


# =============================================================================
# SECTION 10 — ENTRY POINT
# =============================================================================

if __name__ == "__main__":
    PROJECT_ROOT  = r"F:\TeleTCM_Project\qrma_single"
    PDF_FILE      = os.path.join(PROJECT_ROOT, "QRMA_Ridwan_November_21.pdf")
    DB_PATH       = os.path.join(PROJECT_ROOT, "data", "qrma.db")
    MAPPINGS_FILE = os.path.join(PROJECT_ROOT, "mappings.json")
    OUTPUT_CSV    = os.path.join(PROJECT_ROOT, "data", "dashboard_import.csv")

    if not os.path.exists(PDF_FILE):
        print(f"[!] PDF not found: {PDF_FILE}")
    elif not os.path.exists(MAPPINGS_FILE):
        print(f"[!] mappings.json not found: {MAPPINGS_FILE}")
    else:
        from database import init_db
        db = init_db(f"sqlite:///{DB_PATH}")
        parse_and_export(
            file_path       = PDF_FILE,
            db_session      = db,
            mappings_path   = MAPPINGS_FILE,
            output_csv_path = OUTPUT_CSV,
        )
