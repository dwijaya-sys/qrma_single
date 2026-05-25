# json_exporter.py
# =============================================================================
# QRMA JSON Exporter — Version 1.0
# =============================================================================
#
# Converts the CSV output from csv_exporter_v2.py into a JSON payload
# in the format expected by importer.js (browser-side dashboard importer).
#
# Position in the pipeline:
#   PDF → parser_v3.py → csv_exporter_v2.py → [this script] → importer.js
#
# JSON payload format produced:
#   {
#     "patient":  { name, age, gender, testdate },
#     "values":   { field_id: raw_value, field_id_zone: "normal|ringan|sedang|berat|unknown" },
#     "meta":     { source, version, run_id, generated_at, csv_source },
#     "warnings": [ "...", ... ]
#   }
#
# Usage:
#   python json_exporter.py --csv "data/ridwan_2025-11-10.csv"
#   python json_exporter.py --csv "data/ridwan_2025-11-10.csv" --out "data/ridwan_2025-11-10.json"
#   python json_exporter.py --csv "data/ridwan_2025-11-10.csv" --run-id "run_ridwan_20260525"
#
# =============================================================================

import argparse
import csv
import json
import os
import re
import sys
from datetime import datetime

SCRIPT_DIR   = os.path.dirname(os.path.abspath(__file__))   # 03_Scripts\
PROJECT_ROOT = os.path.dirname(SCRIPT_DIR)                    # qrma_single\

# Columns that go into the patient block, not the values block
PATIENT_FIELDS = {"name", "age", "gender", "test_date"}

# Columns excluded from values entirely
EXCLUDE_FIELDS = PATIENT_FIELDS | {"warnings"}

# Valid zone labels — used for validation
VALID_ZONE_LABELS = {"normal", "ringan", "sedang", "berat", "unknown"}


# =============================================================================
# CORE CONVERSION
# =============================================================================

def csv_to_json_payload(csv_path, run_id=None):
    """
    Reads the first data row from a QRMA CSV file and produces a JSON payload.

    The CSV is produced by csv_exporter_v2.py and has this structure:
        - demographics columns: name, age, gender, test_date
        - raw value columns:    bv, cp, art, ... (float)
        - zone columns:         bv_zone, cp_zone, ... (string label)
        - meta column:          warnings (semicolon-separated strings)

    Returns:
        payload dict ready for json.dump()

    Raises:
        ValueError  if CSV is empty or unreadable
        KeyError    if mandatory demographic columns are missing
    """
    with open(csv_path, newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        rows = list(reader)

    if not rows:
        raise ValueError(f"[!] CSV is empty: {csv_path}")

    row = rows[0]   # One patient per run

    # ── Patient block ─────────────────────────────────────────────────────────
    raw_age = row.get("age", "0")
    try:
        age = int(float(raw_age)) if raw_age else 0
    except (ValueError, TypeError):
        age = 0

    patient = {
        "name":     row.get("name",      "unknown").strip(),
        "age":      age,
        "gender":   row.get("gender",    "unknown").strip(),
        "testdate": row.get("test_date", "").strip(),
    }

    # ── Values block (raw floats + zone strings) ──────────────────────────────
    values = {}
    skipped_zero_count = 0
    invalid_zone_count = 0

    for col, val in row.items():
        if col in EXCLUDE_FIELDS:
            continue
        if val is None or val == "":
            continue

        if col.endswith("_zone"):
            # Zone column — keep as string, validate label
            zone_label = val.strip().lower()
            if zone_label not in VALID_ZONE_LABELS:
                invalid_zone_count += 1
                zone_label = "unknown"   # normalise unrecognised labels
            values[col] = zone_label

        else:
            # Raw numeric column — skip zeros (unfilled fields)
            try:
                num = float(val)
                if num != 0.0:
                    values[col] = num
                else:
                    skipped_zero_count += 1
            except (ValueError, TypeError):
                pass   # non-numeric non-zone column — silently skip

    # ── Warnings ──────────────────────────────────────────────────────────────
    warnings_raw = row.get("warnings", "")
    if warnings_raw:
        warnings = [w.strip() for w in warnings_raw.split(";;") if w.strip()]
    else:
        warnings = []

    if skipped_zero_count:
        warnings.append(
            f"ZERO_VALUE_FIELDS_SKIPPED ({skipped_zero_count}): "
            "Fields with value 0.0 were excluded from the values block (treated as unpopulated)."
        )
    if invalid_zone_count:
        warnings.append(
            f"INVALID_ZONE_LABELS ({invalid_zone_count}): "
            "Unrecognised zone labels were normalised to 'unknown'."
        )

    # ── Meta block ────────────────────────────────────────────────────────────
    effective_run_id = run_id or _make_run_id(patient)

    payload = {
        "patient":  patient,
        "values":   values,
        "meta": {
            "source":       "qrma-parser-v3",
            "version":      "3.0",
            "generated_at": datetime.now().isoformat(),
            "csv_source":   os.path.basename(csv_path),
            "run_id":       effective_run_id,
            "row_count":    len(rows),
        },
        "warnings": warnings,
    }

    return payload


# =============================================================================
# HELPERS
# =============================================================================

def _make_run_id(patient):
    """Generates a run ID from patient name + current timestamp."""
    name = re.sub(r"[^\w]", "_", patient.get("name", "unknown").lower()).strip("_")
    ts   = datetime.now().strftime("%Y%m%d_%H%M")
    return f"run_{name}_{ts}"


def build_output_path(payload, out_arg):
    """Returns the output JSON file path."""
    if out_arg:
        return os.path.abspath(out_arg)

    name = re.sub(r"[^\w]", "_", payload["patient"]["name"].lower()).strip("_") or "unknown"

    raw_date = payload["patient"].get("testdate", "")
    try:
        d = datetime.strptime(raw_date, "%d/%m/%Y %H:%M")
        date_str = d.strftime("%Y-%m-%d")
    except (ValueError, TypeError):
        date_str = datetime.now().strftime("%Y-%m-%d")

    return os.path.join(PROJECT_ROOT, "01_Data", "json", f"{name}_{date_str}.json")


def print_summary(payload, out_path):
    """Prints a human-readable run summary to stdout."""
    p    = payload["patient"]
    vals = payload["values"]

    raw_count  = sum(1 for k in vals if not k.endswith("_zone"))
    zone_count = sum(1 for k, v in vals.items() if k.endswith("_zone") and v != "unknown")
    zone_total = sum(1 for k in vals if k.endswith("_zone"))

    zone_dist = {}
    for k, v in vals.items():
        if k.endswith("_zone"):
            zone_dist[v] = zone_dist.get(v, 0) + 1

    print(f"\n{'='*60}")
    print(f"  QRMA JSON Exporter v1.0")
    print(f"{'='*60}")
    print(f"  Patient   : {p['name']}  |  Age: {p['age']}  |  Gender: {p['gender']}")
    print(f"  Test date : {p['testdate']}")
    print(f"  Run ID    : {payload['meta']['run_id']}")
    print(f"{'='*60}")
    print(f"  Raw fields exported  : {raw_count}")
    print(f"  Zone fields resolved : {zone_count} / {zone_total}")
    print(f"  Zone distribution    : {zone_dist}")
    print(f"  Warnings             : {len(payload['warnings'])}")
    print(f"  Output               : {out_path}")
    print(f"{'='*60}\n")

    if payload["warnings"]:
        print("Warnings:")
        for w in payload["warnings"]:
            print(f"  -> {w}")
        print()


# =============================================================================
# ARGUMENT PARSER
# =============================================================================

def build_parser():
    p = argparse.ArgumentParser(
        prog="json_exporter.py",
        description=(
            "Convert QRMA CSV pipeline output to a JSON payload.\n"
            "JSON is consumed by importer.js inside the dashboard."
        ),
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
examples:
  python json_exporter.py --csv "data/ridwan_2025-11-10.csv"
  python json_exporter.py --csv "data/ridwan_2025-11-10.csv" --out "data/ridwan_2025-11-10.json"
  python json_exporter.py --csv "data/kamiyanti_2025-05-29.csv" --run-id "run_kamiyanti_001"
        """,
    )
    p.add_argument(
        "--csv",
        metavar="PATH",
        required=True,
        help="Path to QRMA CSV file (output from csv_exporter_v2.py).",
    )
    p.add_argument(
        "--out",
        metavar="PATH",
        default=None,
        help=(
            "Output JSON path. "
            "Default: data/{patient_name}_{YYYY-MM-DD}.json "
            "(auto-built from CSV patient demographics)."
        ),
    )
    p.add_argument(
        "--run-id",
        metavar="ID",
        default=None,
        help="Optional run identifier written into the meta block.",
    )
    return p


# =============================================================================
# MAIN
# =============================================================================

def main():
    parser  = build_parser()
    args    = parser.parse_args()
    csv_path = os.path.abspath(args.csv)

    if not os.path.exists(csv_path):
        print(f"[!] CSV not found: {csv_path}")
        sys.exit(1)

    # Convert
    try:
        payload = csv_to_json_payload(csv_path, run_id=args.run_id)
    except Exception as e:
        print(f"[!] Failed to parse CSV: {e}")
        sys.exit(1)

    # Resolve output path
    out_path = build_output_path(payload, args.out)
    os.makedirs(os.path.dirname(os.path.abspath(out_path)), exist_ok=True)

    # Write JSON
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(payload, f, indent=2, ensure_ascii=False)

    # Print summary
    print_summary(payload, out_path)

    return payload, out_path


if __name__ == "__main__":
    main()
