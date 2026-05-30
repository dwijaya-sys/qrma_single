"""
server.py — QRMA Flask Microserver
====================================
Port  : 5000
Start : python 03_Scripts/server.py   (from project root)
        — or —
        python server.py              (from inside 03_Scripts/)

Routes
------
GET  /        → {"status": "ok"}
POST /upload  → multipart/form-data, field name "pdf"
               runs csv_exporter_v2 → json_exporter pipeline
               returns the final JSON payload to the browser

The dashboard (qrma-dashboard-v*.html) works standalone without this
server; the server only automates the PDF → CSV → JSON pipeline so the
operator never needs to open a terminal mid-session.

CSV is always written to 01_Data/csv/ as a permanent audit trail.
The server never bypasses or skips it.
"""

import json
import os
import sys
import tempfile

from flask import Flask, jsonify, request
from flask_cors import CORS

# ── Path setup (same pattern as csv_exporter_v2.py) ──────────────────────────
SCRIPT_DIR   = os.path.dirname(os.path.abspath(__file__))  # 03_Scripts/
PROJECT_ROOT = os.path.dirname(SCRIPT_DIR)                  # qrma_single/

if SCRIPT_DIR not in sys.path:
    sys.path.insert(0, SCRIPT_DIR)

# ── Pipeline imports ──────────────────────────────────────────────────────────
try:
    from parser_v3 import parse_qrma_pdf, load_mappings, export_dashboard_csv
except ModuleNotFoundError:
    print(f"[!] parser_v3.py not found in {SCRIPT_DIR}")
    sys.exit(1)

try:
    from csv_exporter_v2 import build_output_path as csv_build_output_path
except ModuleNotFoundError:
    print(f"[!] csv_exporter_v2.py not found in {SCRIPT_DIR}")
    sys.exit(1)

try:
    from json_exporter import (
        csv_to_json_payload,
        build_output_path as json_build_output_path,
    )
except ModuleNotFoundError:
    print(f"[!] json_exporter.py not found in {SCRIPT_DIR}")
    sys.exit(1)

# ── Flask app ─────────────────────────────────────────────────────────────────
app = Flask(__name__)
CORS(app)  # allow all origins — this server is localhost-only

app.config["MAX_CONTENT_LENGTH"] = 50 * 1024 * 1024  # 50 MB upload limit

DEFAULT_MAPPINGS = os.path.join(SCRIPT_DIR, "mappings.json")


# ── Routes ────────────────────────────────────────────────────────────────────

@app.route("/", methods=["GET"])
def health():
    return jsonify({"status": "ok"})


@app.route("/upload", methods=["POST"])
def upload():
    if "pdf" not in request.files:
        return jsonify({"error": "Missing file field 'pdf'"}), 400

    pdf_file = request.files["pdf"]
    if not pdf_file.filename:
        return jsonify({"error": "Empty filename"}), 400

    if not os.path.exists(DEFAULT_MAPPINGS):
        return jsonify({"error": f"mappings.json not found: {DEFAULT_MAPPINGS}"}), 500

    tmp_path = None
    try:
        # ── Save upload to a temp file ────────────────────────────────────────
        with tempfile.NamedTemporaryFile(suffix=".pdf", delete=False) as tmp:
            pdf_file.save(tmp)
            tmp_path = tmp.name

        # ── Step 1 — csv_exporter_v2 pipeline ────────────────────────────────
        # parse_qrma_pdf + load_mappings + export_dashboard_csv
        # mirrors exactly what csv_exporter_v2.main() does
        parsed         = parse_qrma_pdf(tmp_path)
        demo           = parsed["demographics"]
        primary_lookup = load_mappings(DEFAULT_MAPPINGS)

        csv_path = csv_build_output_path(demo)
        os.makedirs(os.path.dirname(csv_path), exist_ok=True)
        export_dashboard_csv(parsed, primary_lookup, csv_path)

        # ── Step 2 — json_exporter pipeline ──────────────────────────────────
        # csv_to_json_payload reads the CSV written above; audit trail intact
        payload   = csv_to_json_payload(csv_path)
        json_path = json_build_output_path(payload, None)
        os.makedirs(os.path.dirname(json_path), exist_ok=True)

        with open(json_path, "w", encoding="utf-8") as f:
            json.dump(payload, f, indent=2, ensure_ascii=False)

        print(
            f"[upload] {demo.get('name', '?')} | "
            f"csv → {os.path.relpath(csv_path, PROJECT_ROOT)} | "
            f"json → {os.path.relpath(json_path, PROJECT_ROOT)}"
        )

        return jsonify(payload)

    except Exception as exc:
        return jsonify({"error": str(exc)}), 500

    finally:
        if tmp_path and os.path.exists(tmp_path):
            os.remove(tmp_path)


# ── Entry point ───────────────────────────────────────────────────────────────

if __name__ == "__main__":
    print(f"[QRMA Server] http://localhost:5000")
    print(f"[QRMA Server] Project root : {PROJECT_ROOT}")
    print(f"[QRMA Server] Mappings     : {DEFAULT_MAPPINGS}")
    app.run(host="0.0.0.0", port=5000, debug=False)
