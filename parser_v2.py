# core/parser.py
#
# Pipeline: QRMA PDF → SQLite (existing) + Dashboard CSV (new)
#
# New in this version:
#   - load_mappings()       : loads mappings.json, builds lookup table
#   - apply_mappings()      : translates parsed PDF items → dashboard input IDs
#   - export_dashboard_csv(): writes a CSV the dashboard can auto-import
#   - parse_and_export()    : convenience wrapper — runs full pipeline in one call
#
# Existing behaviour (SQLite ingest) is unchanged.

import pdfplumber
import re
import os
import json
import csv
from datetime import datetime




# ---------------------------------------------------------------------------
# CONSTANTS
# ---------------------------------------------------------------------------

# All dashboard input IDs in their canonical order.
# The exported CSV will always have these columns in this order.
DASHBOARD_FIELDS = [
    # Demographics (from PDF header)
    "name", "age", "gender", "test_date",

    # Bio Age module (simple/unprefixed IDs)
    "bv", "cp", "art", "ins", "bs", "fr", "hyp", "ph", "pb", "hg",
    "ce", "cs", "cj", "coq", "gsh", "vc", "ve", "ost",

    # Oxidative Stress module
    "ox-gsh", "ox-coq", "ox-vc", "ox-ve", "ox-sel", "ox-fr", "ox-hyp", "ox-ph",

    # Toxic Exposure module
    "tx-pb", "tx-hg", "tx-cd", "tx-as", "tx-st", "tx-tb", "tx-ps",

    # Metabolic Risk module
    "mt-tg", "mt-ug", "mt-ins", "mt-fm", "mt-bmi", "mt-wc",

    # Cardio-Renal module
    "cr-ch", "cr-vf", "cr-lv", "cr-ua", "cr-pt", "cr-k", "cr-mg",

    # Nutrient Sufficiency module
    "nt-zn", "nt-mg", "nt-k", "nt-io", "nt-si", "nt-b6",
    "nt-vc", "nt-d3", "nt-ve", "nt-fo",

    # Skin & Collagen module
    "sk-sc", "sk-el", "sk-tw", "sk-sb", "sk-ml", "sk-sn", "sk-ec", "sk-jc",

    # Meta column — populated warnings get written here
    "warnings",
]


# ---------------------------------------------------------------------------
# HELPERS (unchanged from original)
# ---------------------------------------------------------------------------

def clean_text(text):
    """Removes newlines and extra spaces from extracted PDF text."""
    if not text:
        return ""
    return " ".join(text.replace("\n", " ").split()).strip()


def parse_float(value_str):
    """Extracts a valid float from strings like '< 0.2', '12.345', or '61,274'."""
    if not value_str:
        return 0.0
    try:
        # 1. Convert Indonesian decimal comma → Python decimal point
        normalized_str = str(value_str).replace(',', '.')
        # 2. Strip everything except digits, dot, minus
        cleaned = re.sub(r'[^\d\.-]', '', normalized_str)
        return float(cleaned) if cleaned else 0.0
    except Exception:
        return 0.0


# ---------------------------------------------------------------------------
# MAPPING LAYER (new)
# ---------------------------------------------------------------------------

def load_mappings(mappings_path):
    """
    Loads mappings.json and returns two lookup structures:

    primary_lookup  : { indonesian_name -> mapping_entry }
    dashboard_set   : set of all dashboard_ids (primary + also_maps_to)

    The mapping_entry dict contains:
        dashboard_id      : str   (primary target field)
        also_maps_to      : list  (additional target fields)
        needs_verification: bool  (flag uncertain mappings)
        note              : str   (human-readable explanation)
    """
    if not os.path.exists(mappings_path):
        raise FileNotFoundError(
            f"[!] mappings.json not found at: {mappings_path}\n"
            f"    Place it in the same directory as parser.py or pass the full path."
        )

    with open(mappings_path, "r", encoding="utf-8") as f:
        raw = json.load(f)

    primary_lookup = {}
    for entry in raw:
        indonesian_name = entry.get("id", "").strip()
        if not indonesian_name:
            continue
        primary_lookup[indonesian_name] = {
            "dashboard_id":       entry.get("dashboard_id", ""),
            "also_maps_to":       entry.get("also_maps_to", []),
            "needs_verification": entry.get("needs_verification", False),
            "note":               entry.get("note", ""),
            "en":                 entry.get("en", ""),
        }

    return primary_lookup


def apply_mappings(parsed_items, primary_lookup):
    """
    Translates a list of parsed PDF items into a flat dict of
    { dashboard_id -> value } using the mapping lookup.

    Also returns two diagnostic lists:
        warnings        : unverified mappings that fired
        unmapped_params : parameter names found in PDF but not in mappings.json
    """
    mapped   = {}   # dashboard_id -> numeric value
    warnings = []   # human-readable warning strings
    unmapped_params = []

    for item in parsed_items:
        param_name = item["parameter_name"]
        value      = item["actual_value"]

        entry = primary_lookup.get(param_name)

        if entry is None:
            # Parameter exists in PDF but has no mapping entry
            unmapped_params.append(param_name)
            continue

        # Collect all target IDs: primary + also_maps_to
        targets = []
        if entry["dashboard_id"]:
            targets.append(entry["dashboard_id"])
        targets.extend(entry["also_maps_to"])

        if not targets:
            # Entry exists in mappings but has no dashboard destination
            continue

        for target_id in targets:
            # If a field is written more than once, keep the first value found
            # (earlier pages take precedence — matches QRMA report page order)
            if target_id not in mapped:
                mapped[target_id] = value

        # Flag needs_verification entries that actually produced a value
        if entry["needs_verification"] and value != 0.0:
            warnings.append(
                f"UNVERIFIED MAPPING: '{param_name}' → {targets} "
                f"(value={value}) | {entry['note']}"
            )

    return mapped, warnings, unmapped_params


# ---------------------------------------------------------------------------
# PDF PARSER (unchanged from original)
# ---------------------------------------------------------------------------

def parse_qrma_pdf(file_path):
    """Extracts demographics and test parameters from the QRMA PDF."""
    data = {
        "demographics": {},
        "items": []
    }

    with pdfplumber.open(file_path) as pdf:
        # --- 1. Extract Demographics from Page 1 ---
        first_page_text = pdf.pages[0].extract_text()

        name_match   = re.search(r'Nama:\s*(.*?)\s+Jenis Kelamin:', first_page_text)
        gender_match = re.search(r'Jenis Kelamin:\s*(.*?)\s+Umur:', first_page_text)
        age_match    = re.search(r'Umur:\s*(\d+)', first_page_text)
        figure_match = re.search(r'Figur:\s*(.*?)\s+Tanggal Ujian:', first_page_text)
        date_match   = re.search(r'Tanggal Ujian:\s*([\d/:\s]+)', first_page_text)

        data["demographics"] = {
            "name":      name_match.group(1).strip()   if name_match   else "Unknown",
            "gender":    gender_match.group(1).strip() if gender_match else "Unknown",
            "age":       int(age_match.group(1).strip()) if age_match  else 0,
            "figure":    figure_match.group(1).strip() if figure_match else "",
            "test_date": date_match.group(1).strip()   if date_match   else "",
        }

        # Convert test_date string to Python datetime
        try:
            test_date_obj = datetime.strptime(
                data["demographics"]["test_date"], "%d/%m/%Y %H:%M"
            )
        except ValueError:
            test_date_obj = datetime.now()

        data["demographics"]["test_date_obj"] = test_date_obj

        # --- 2. Extract Tables across all pages ---
        current_category = "General"

        for page in pdf.pages:
            text = page.extract_text() or ""

            # Category wrapped in parentheses at top of each section page
            cat_match = re.search(r'^\((.*?)\)', text, re.MULTILINE)
            if cat_match:
                current_category = cat_match.group(1).strip()

            tables = page.extract_tables()
            for table in tables:
                if not table or not table[0]:
                    continue

                header = [clean_text(str(c)) for c in table[0]]
                if "Barang pengujian" not in header:
                    continue

                for row in table[1:]:
                    if len(row) >= 3:
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

    return data


# ---------------------------------------------------------------------------
# SQLite INGEST (unchanged from original)
# ---------------------------------------------------------------------------

def ingest_to_db(file_path, db_session):
    # Import database models (unchanged)
    #have to be put here, otherwise when the CLI wrapper call this script, it will look for the db hence throws error.
    from database import init_db, Patient, Report, ReportItem
    
    """Orchestrates parsing and inserting data into SQLite."""
    print(f"[*] Parsing {file_path}...")
    parsed_data = parse_qrma_pdf(file_path)
    demo = parsed_data["demographics"]

    print(f"[*] Patient: {demo['name']} | Age: {demo['age']} | Date: {demo['test_date']}")

    # 1. Upsert Patient
    patient = db_session.query(Patient).filter_by(
        name=demo["name"],
        gender=demo["gender"],
        age=demo["age"]
    ).first()

    if not patient:
        patient = Patient(
            name=demo["name"],
            gender=demo["gender"],
            age=demo["age"],
            figure=demo["figure"]
        )
        db_session.add(patient)
        db_session.flush()

    # 2. Guard against duplicate Reports
    existing_report = db_session.query(Report).filter_by(
        patient_id=patient.id,
        test_date=demo["test_date_obj"]
    ).first()

    if existing_report:
        print("[!] Report already exists in database. Skipping duplicate insert.")
        return

    # 3. Create Report
    report = Report(
        patient_id=patient.id,
        test_date=demo["test_date_obj"],
        file_name=os.path.basename(file_path)
    )
    db_session.add(report)
    db_session.flush()

    # 4. Bulk insert ReportItems
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
    print(f"[+] SQLite: saved {len(report_items)} parameters.")


# ---------------------------------------------------------------------------
# CSV EXPORT (new)
# ---------------------------------------------------------------------------

def export_dashboard_csv(parsed_data, primary_lookup, output_csv_path):
    """
    Applies the mapping layer to parsed PDF data and writes a dashboard CSV.

    The CSV has one row per report with columns matching DASHBOARD_FIELDS.
    A 'warnings' column captures any unverified mappings or anomalies.

    Returns:
        mapped          : dict of { dashboard_id -> value }
        warnings        : list of warning strings
        unmapped_params : list of PDF param names with no mapping entry
    """
    demo = parsed_data["demographics"]

    # Apply mappings
    mapped, warnings, unmapped_params = apply_mappings(
        parsed_data["items"], primary_lookup
    )

    # Inject demographics into mapped dict
    mapped["name"]      = demo.get("name", "")
    mapped["age"]       = demo.get("age", "")
    mapped["gender"]    = demo.get("gender", "")
    mapped["test_date"] = demo.get("test_date", "")

    # Report unmapped parameters as informational warnings
    if unmapped_params:
        warnings.append(
            f"PDF PARAMETERS WITH NO MAPPING ({len(unmapped_params)}): "
            + " | ".join(unmapped_params)
        )

    # Check for dashboard fields that received no value
    missing_fields = [
        fid for fid in DASHBOARD_FIELDS
        if fid not in ("name", "age", "gender", "test_date", "warnings")
        and fid not in mapped
    ]
    if missing_fields:
        warnings.append(
            f"DASHBOARD FIELDS NOT POPULATED ({len(missing_fields)}): "
            + " | ".join(missing_fields)
        )

    mapped["warnings"] = " ;; ".join(warnings) if warnings else ""

    # Ensure output directory exists
    os.makedirs(os.path.dirname(os.path.abspath(output_csv_path)), exist_ok=True)

    # Write CSV — always writes all DASHBOARD_FIELDS columns
    file_exists = os.path.exists(output_csv_path)

    with open(output_csv_path, "a", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(
            f,
            fieldnames=DASHBOARD_FIELDS,
            extrasaction="ignore",   # silently drop unmapped keys
        )
        if not file_exists:
            writer.writeheader()
        writer.writerow({fid: mapped.get(fid, "") for fid in DASHBOARD_FIELDS})

    print(f"[+] CSV:    row written → {output_csv_path}")

    if warnings:
        print(f"[!] {len(warnings)} warning(s) — see 'warnings' column in CSV.")
        for w in warnings:
            print(f"    → {w}")

    return mapped, warnings, unmapped_params


# ---------------------------------------------------------------------------
# FULL PIPELINE (new convenience wrapper)
# ---------------------------------------------------------------------------

def parse_and_export(file_path, db_session, mappings_path, output_csv_path):
    """
    Full pipeline in one call:
        1. Parse the QRMA PDF
        2. Ingest raw parameters into SQLite (existing behaviour)
        3. Apply mapping layer
        4. Export dashboard-ready CSV

    Args:
        file_path        : path to the QRMA PDF file
        db_session       : SQLAlchemy session (from init_db)
        mappings_path    : path to mappings.json
        output_csv_path  : where to write the dashboard CSV
                           (appends a new row if file already exists)

    Returns:
        mapped           : dict of { dashboard_id -> value }
        warnings         : list of warning strings
        unmapped_params  : list of PDF param names with no mapping entry
    """
    print(f"\n{'='*60}")
    print(f"  QRMA Parser — Full Pipeline")
    print(f"  PDF     : {os.path.basename(file_path)}")
    print(f"  DB      : SQLite (existing)")
    print(f"  CSV out : {output_csv_path}")
    print(f"{'='*60}\n")

    # Step 1: Parse PDF
    print("[1/3] Parsing PDF...")
    parsed_data = parse_qrma_pdf(file_path)
    demo = parsed_data["demographics"]
    print(
        f"      Patient : {demo['name']} | "
        f"Age: {demo['age']} | "
        f"Gender: {demo['gender']} | "
        f"Date: {demo['test_date']}"
    )
    print(f"      Parameters extracted: {len(parsed_data['items'])}")

    # Step 2: SQLite ingest
    print("[2/3] Writing to SQLite...")
    ingest_to_db(file_path, db_session)

    # Step 3: Load mappings + export CSV
    print("[3/3] Applying mappings and exporting CSV...")
    primary_lookup = load_mappings(mappings_path)
    mapped, warnings, unmapped_params = export_dashboard_csv(
        parsed_data, primary_lookup, output_csv_path
    )

    print(f"\n[✓] Pipeline complete.")
    print(f"    Dashboard fields populated : {len([v for v in mapped.values() if v != ''])}")
    print(f"    Warnings                   : {len(warnings)}")
    print(f"    Unmapped PDF parameters    : {len(unmapped_params)}")
    print(f"{'='*60}\n")

    return mapped, warnings, unmapped_params


# ---------------------------------------------------------------------------
# ENTRY POINT
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    # --- Configure paths here ---
    PROJECT_ROOT   = r"F:\TeleTCM_Project\qrma_single"
    PDF_FILE       = os.path.join(PROJECT_ROOT, "QRMA_Ridwan_November_21.pdf")
    DB_PATH        = os.path.join(PROJECT_ROOT, "data", "qrma.db")
    MAPPINGS_FILE  = os.path.join(PROJECT_ROOT, "mappings.json")
    OUTPUT_CSV     = os.path.join(PROJECT_ROOT, "data", "dashboard_import.csv")

    # --- Run ---
    if not os.path.exists(PDF_FILE):
        print(f"[!] PDF not found: {PDF_FILE}")
    elif not os.path.exists(MAPPINGS_FILE):
        print(f"[!] mappings.json not found: {MAPPINGS_FILE}")
    else:
        db = init_db(f"sqlite:///{DB_PATH}")
        parse_and_export(
            file_path       = PDF_FILE,
            db_session      = db,
            mappings_path   = MAPPINGS_FILE,
            output_csv_path = OUTPUT_CSV,
        )
