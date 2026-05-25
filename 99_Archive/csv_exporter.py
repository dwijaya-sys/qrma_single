# csv_exporter.py
#
# Standalone CLI tool: QRMA PDF → dashboard_import.csv
# No database dependency. Uses parser_v2.py for core logic.
#
# Usage:
#   python csv_exporter.py
#   python csv_exporter.py --pdf "QRMA_Ridwan_November_21.pdf"
#   python csv_exporter.py --pdf "QRMA_Ridwan.pdf" --mappings "mappings.json" --out "data\dashboard_import.csv"

import argparse
import glob
import os
import re
import sys
from datetime import datetime

# Import core logic from parser_v2 (must be in the same folder)
try:
    from parser_v2 import parse_qrma_pdf, load_mappings, export_dashboard_csv
except ModuleNotFoundError:
    print("[!] Error: parser_v2.py not found.")
    print("    Place csv_exporter.py in the same folder as parser_v2.py.")
    sys.exit(1)


# ---------------------------------------------------------------------------
# DEFAULTS
# ---------------------------------------------------------------------------

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))

DEFAULT_MAPPINGS = os.path.join(SCRIPT_DIR, "mappings.json")


# ---------------------------------------------------------------------------
# OUTPUT PATH BUILDER
# ---------------------------------------------------------------------------

def build_output_path(demo):
    """
    Builds the output CSV filename from patient demographics.

    Format: data/{patient_name}_{YYYY-MM-DD}.csv
    Example: data/kamiyanti_2025-05-29.csv

    - Name is lowercased, spaces/special chars replaced with underscores.
    - Date is parsed from the PDF test_date string (DD/MM/YYYY HH:MM).
    - Falls back to today's date if parsing fails.
    """
    # Sanitise patient name
    raw_name = demo.get("name", "unknown")
    safe_name = re.sub(r"[^\w\s-]", "", raw_name.lower().strip())
    safe_name = re.sub(r"[\s_]+", "_", safe_name).strip("_") or "unknown"

    # Parse test date → YYYY-MM-DD
    raw_date = demo.get("test_date", "")
    try:
        parsed_date = datetime.strptime(raw_date, "%d/%m/%Y %H:%M")
        date_str = parsed_date.strftime("%Y-%m-%d")
    except (ValueError, TypeError):
        date_str = datetime.now().strftime("%Y-%m-%d")

    filename = f"{safe_name}_{date_str}.csv"
    return os.path.join(SCRIPT_DIR, "data", filename)


# ---------------------------------------------------------------------------
# PDF AUTO-DETECT
# ---------------------------------------------------------------------------

def resolve_pdf(pdf_arg):
    """
    Resolves the PDF path.

    - If --pdf was provided: validate the file exists and return it.
    - If --pdf was omitted: scan the script directory for *.pdf files.
        - Exactly 1 found → use it automatically.
        - 0 found          → error.
        - 2+ found         → error, list them, ask user to specify with --pdf.
    """
    if pdf_arg:
        path = os.path.abspath(pdf_arg)
        if not os.path.exists(path):
            print(f"[!] PDF not found: {path}")
            sys.exit(1)
        return path

    # Auto-detect
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
        print(f'      python csv_exporter.py --pdf "{os.path.basename(found[0])}"')
        sys.exit(1)

    # Exactly one PDF found
    return os.path.abspath(found[0])


# ---------------------------------------------------------------------------
# ARGUMENT PARSER
# ---------------------------------------------------------------------------

def build_parser():
    p = argparse.ArgumentParser(
        prog="csv_exporter.py",
        description="Export a QRMA PDF report to a dashboard-ready CSV file.",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
examples:
  python csv_exporter.py
  python csv_exporter.py --pdf "QRMA_Ridwan_November_21.pdf"
  python csv_exporter.py --pdf "QRMA_Ridwan_November_21.pdf" --out "data\\output.csv"
  python csv_exporter.py --pdf "QRMA_Ahmad_Dec_2024.pdf" --mappings "mappings.json" --out "data\\Ahmad.csv"
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
            "Default: data/{patient_name}_{YYYY-MM-DD}.csv (auto-built from PDF contents). "
            "Appends a new row if file already exists."
        ),
    )
    return p


# ---------------------------------------------------------------------------
# MAIN
# ---------------------------------------------------------------------------

def main():
    parser = build_parser()
    args   = parser.parse_args()

    # Resolve paths
    pdf_path      = resolve_pdf(args.pdf)
    mappings_path = os.path.abspath(args.mappings)

    print(f"\n{'='*60}")
    print(f"  QRMA CSV Exporter")
    print(f"{'='*60}")
    print(f"  PDF      : {pdf_path}")
    print(f"  Mappings : {mappings_path}")
    print(f"{'='*60}\n")

    # Validate mappings file
    if not os.path.exists(mappings_path):
        print(f"[!] mappings.json not found: {mappings_path}")
        print("    Use --mappings to specify its location.")
        sys.exit(1)

    # Step 1: Parse PDF
    print("[1/3] Parsing PDF...")
    parsed = parse_qrma_pdf(pdf_path)
    demo   = parsed["demographics"]
    print(
        f"      Patient   : {demo['name']}\n"
        f"      Age       : {demo['age']}  |  Gender: {demo['gender']}\n"
        f"      Test date : {demo['test_date']}\n"
        f"      Parameters extracted: {len(parsed['items'])}"
    )

    # Resolve output path — use --out if given, otherwise build from patient name + date
    out_path = os.path.abspath(args.out) if args.out else build_output_path(demo)
    print(f"\n  Output   : {out_path}")

    # Step 2: Load mappings
    print("\n[2/3] Loading mappings...")
    primary_lookup = load_mappings(mappings_path)
    print(f"      Mapping entries loaded: {len(primary_lookup)}")

    # Step 3: Export CSV
    print("\n[3/3] Applying mappings and writing CSV...")
    mapped, warnings, unmapped = export_dashboard_csv(parsed, primary_lookup, out_path)

    # Summary
    populated = len([v for k, v in mapped.items()
                     if k not in ("name","age","gender","test_date","warnings")
                     and v != "" and v != 0.0])

    print(f"\n{'='*60}")
    print(f"  Done.")
    print(f"  Dashboard fields populated : {populated}")
    print(f"  Unmapped PDF parameters    : {len(unmapped)}")
    print(f"  Warnings                   : {len(warnings)}")
    print(f"  Output written to          : {out_path}")
    print(f"{'='*60}\n")

    if warnings:
        print("Warnings:")
        for w in warnings:
            print(f"  → {w}")
        print()

    if unmapped:
        print(f"PDF parameters with no mapping entry ({len(unmapped)}):")
        for u in unmapped:
            print(f"  - {u}")
        print()


if __name__ == "__main__":
    main()
