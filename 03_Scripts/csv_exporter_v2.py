# csv_exporter_v2.py
# =============================================================================
# QRMA CSV Exporter — Version 2
# =============================================================================
#
# Lives in: 03_Scripts/
# Outputs to: 01_Data/csv/{patient}_{date}.csv
#
# Changelog from v1 (csv_exporter.py):
#   UPD  Import source changed from parser_v2 to parser_v3.
#   UPD  export_dashboard_csv() now returns 4 values:
#            (mapped, zones, warnings, unmapped_params)
#        v1 returned 3 — the new 'zones' dict is handled here.
#   UPD  Summary block now reports zone coverage alongside field population.
#   UPD  Output path now writes to 01_Data/csv/ (project folder structure v2).
#   UNC  resolve_pdf()      — unchanged
#   UNC  build_parser()     — unchanged
#   UNC  All argparse arguments (--pdf, --mappings, --out) — unchanged
#
# Usage:
#   python 03_Scripts/csv_exporter_v2.py
#   python 03_Scripts/csv_exporter_v2.py --pdf "QRMA_Ridwan_November_21.pdf"
#   python 03_Scripts/csv_exporter_v2.py --pdf "file.pdf" --mappings "03_Scripts/mappings.json"
#   python 03_Scripts/csv_exporter_v2.py --pdf "file.pdf" --out "01_Data/csv/custom.csv"
#
# =============================================================================

import argparse
import glob
import os
import re
import sys
from datetime import datetime

# =============================================================================
# DEFAULTS
# =============================================================================

# Script lives in 03_Scripts/ — project root is one level up.
# Defined here (before the import block) so sys.path can be patched first.
SCRIPT_DIR       = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT     = os.path.dirname(SCRIPT_DIR)
DEFAULT_MAPPINGS = os.path.join(SCRIPT_DIR, "mappings.json")

# ---------------------------------------------------------------------------
# Import core logic from parser_v3.
# sys.path is patched so the import works whether the script is invoked from
# the project root (python 03_Scripts\csv_exporter_v2.py) or from inside
# 03_Scripts directly (python csv_exporter_v2.py).
# ---------------------------------------------------------------------------
if SCRIPT_DIR not in sys.path:
    sys.path.insert(0, SCRIPT_DIR)

try:
    from parser_v3 import parse_qrma_pdf, load_mappings, export_dashboard_csv
except ModuleNotFoundError:
    print("[!] Error: parser_v3.py not found.")
    print(f"    Expected: {SCRIPT_DIR}\\parser_v3.py")
    sys.exit(1)


# =============================================================================
# OUTPUT PATH BUILDER
# =============================================================================

def build_output_path(demo):
    """
    Builds the output CSV filename from patient demographics.

    Format : 01_Data/csv/{patient_name}_{YYYY-MM-DD}.csv
    Example: 01_Data/csv/kamiyanti_2025-05-29.csv

    Rules:
      - Name is lowercased; spaces and special chars become underscores.
      - Date is parsed from the PDF test_date string (DD/MM/YYYY HH:MM).
      - Falls back to today's date if date parsing fails.
    """
    raw_name  = demo.get("name", "unknown")
    safe_name = re.sub(r"[^\w\s-]", "", raw_name.lower().strip())
    safe_name = re.sub(r"[\s_]+", "_", safe_name).strip("_") or "unknown"

    raw_date = demo.get("test_date", "")
    try:
        parsed_date = datetime.strptime(raw_date, "%d/%m/%Y %H:%M")
        date_str    = parsed_date.strftime("%Y-%m-%d")
    except (ValueError, TypeError):
        date_str = datetime.now().strftime("%Y-%m-%d")

    filename = f"{safe_name}_{date_str}.csv"
    return os.path.join(PROJECT_ROOT, "01_Data", "csv", filename)


# =============================================================================
# PDF AUTO-DETECT
# =============================================================================

def resolve_pdf(pdf_arg):
    """
    Resolves the PDF file path.

    If --pdf is provided : validates the file exists and returns its absolute path.
    If --pdf is omitted  : scans the script directory for *.pdf files.
        Exactly 1 found  → uses it automatically.
        0 found          → exits with an error.
        2+ found         → exits with an error listing all found files and an
                           example --pdf command so the user knows how to proceed.
    """
    if pdf_arg:
        path = os.path.abspath(pdf_arg)
        if not os.path.exists(path):
            print(f"[!] PDF not found: {path}")
            sys.exit(1)
        return path

    found = glob.glob(os.path.join(SCRIPT_DIR, "*.pdf"))

    if len(found) == 0:
        print("[!] No PDF file found in the script directory.")
        print(f"    Directory searched: {SCRIPT_DIR}")
        print("    Place a QRMA PDF here or use --pdf to specify its path.")
        sys.exit(1)

    if len(found) > 1:
        print("[!] Multiple PDF files found. Please specify one with --pdf.")
        print(f"    Directory searched: {SCRIPT_DIR}")
        print("    Found:")
        for f in sorted(found):
            print(f"      - {os.path.basename(f)}")
        print("\n    Example:")
        print(f'      python csv_exporter_v2.py --pdf "{os.path.basename(found[0])}"')
        sys.exit(1)

    return os.path.abspath(found[0])


# =============================================================================
# ARGUMENT PARSER
# =============================================================================

def build_parser():
    p = argparse.ArgumentParser(
        prog="csv_exporter_v2.py",
        description=(
            "Export a QRMA PDF report to a dashboard-ready CSV file.\n"
            "Uses parser_v3 — includes Referensi Standar zone data."
        ),
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
examples:
  python csv_exporter_v2.py
  python csv_exporter_v2.py --pdf "QRMA_Ridwan_November_21.pdf"
  python csv_exporter_v2.py --pdf "QRMA_Ridwan_November_21.pdf" --out "data\\output.csv"
  python csv_exporter_v2.py --pdf "QRMA_Ahmad_Dec_2024.pdf" --mappings "mappings.json" --out "data\\Ahmad.csv"
        """,
    )
    p.add_argument(
        "--pdf",
        metavar="PATH",
        default=None,
        help=(
            "Path to the QRMA PDF file. "
            "If omitted, the script looks for a single .pdf in its own directory. "
            "Errors if multiple PDFs are found."
        ),
    )
    p.add_argument(
        "--mappings",
        metavar="PATH",
        default=DEFAULT_MAPPINGS,
        help=f"Path to mappings.json. Default: {DEFAULT_MAPPINGS}",
    )
    p.add_argument(
        "--out",
        metavar="PATH",
        default=None,
        help=(
            "Path for the output CSV. "
            "Default: data/{patient_name}_{YYYY-MM-DD}.csv "
            "(auto-built from PDF contents). "
            "Appends a new row if the file already exists."
        ),
    )
    return p


# =============================================================================
# MAIN
# =============================================================================

def main():
    parser = build_parser()
    args   = parser.parse_args()

    # --- Resolve paths -------------------------------------------------------
    pdf_path      = resolve_pdf(args.pdf)
    mappings_path = os.path.abspath(args.mappings)

    print(f"\n{'='*60}")
    print(f"  QRMA CSV Exporter v2  (parser_v3)")
    print(f"{'='*60}")
    print(f"  PDF      : {pdf_path}")
    print(f"  Mappings : {mappings_path}")
    print(f"{'='*60}\n")

    # Validate mappings file exists before doing any heavy work
    if not os.path.exists(mappings_path):
        print(f"[!] mappings.json not found: {mappings_path}")
        print("    Use --mappings to specify its location.")
        sys.exit(1)

    # --- Step 1: Parse PDF ---------------------------------------------------
    # parse_qrma_pdf() now returns demographics, items, AND ref_standards
    print("[1/3] Parsing PDF (parameters + Referensi Standar)...")
    parsed = parse_qrma_pdf(pdf_path)
    demo   = parsed["demographics"]

    print(
        f"      Patient    : {demo['name']}\n"
        f"      Age        : {demo['age']}  |  Gender: {demo['gender']}\n"
        f"      Test date  : {demo['test_date']}\n"
        f"      Parameters extracted       : {len(parsed['items'])}\n"
        f"      Ref Standard entries found : {len(parsed.get('ref_standards', {}))}"
    )

    # Resolve output path after parsing (needs patient name + date from PDF)
    out_path = os.path.abspath(args.out) if args.out else build_output_path(demo)
    print(f"\n  Output   : {out_path}")

    # --- Step 2: Load mappings -----------------------------------------------
    print("\n[2/3] Loading mappings...")
    primary_lookup = load_mappings(mappings_path)
    print(f"      Mapping entries loaded: {len(primary_lookup)}")

    # --- Step 3: Apply mappings + zone derivation + export CSV ---------------
    # export_dashboard_csv() returns 4 values in v3 (was 3 in v2):
    #   mapped   — { field_id -> raw value }
    #   zones    — { field_id_zone -> zone label }  (NEW)
    #   warnings — list of warning strings
    #   unmapped — list of unmapped PDF parameter names
    print("\n[3/3] Applying mappings + zone derivation, writing CSV...")
    mapped, zones, warnings, unmapped = export_dashboard_csv(
        parsed, primary_lookup, out_path
    )

    # --- Summary -------------------------------------------------------------
    populated = sum(
        1 for k, v in mapped.items()
        if k not in ("name", "age", "gender", "test_date", "warnings")
        and v not in ("", 0.0)
    )
    zoned = sum(1 for v in zones.values() if v != "unknown")

    print(f"\n{'='*60}")
    print(f"  Done.")
    print(f"  Dashboard fields populated  : {populated}")
    print(f"  Fields with zone data       : {zoned} / {len(zones)}")
    print(f"  Unmapped PDF parameters     : {len(unmapped)}")
    print(f"  Warnings                    : {len(warnings)}")
    print(f"  Output written to           : {out_path}")
    print(f"{'='*60}\n")

    # Print full warning list
    if warnings:
        print("Warnings:")
        for w in warnings:
            print(f"  -> {w}")
        print()

    # Print unmapped parameters (informational, not errors)
    if unmapped:
        print(f"PDF parameters with no mapping entry ({len(unmapped)}):")
        for u in unmapped:
            print(f"  - {u}")
        print()


if __name__ == "__main__":
    main()
