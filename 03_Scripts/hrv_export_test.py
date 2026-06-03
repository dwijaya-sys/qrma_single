"""
HRV Export Verification — Playwright (Python) automation
Steps: open dashboard → import JSON → calculate → inject HRV → export → verify file
"""

import sys
import json
import re
import os
from pathlib import Path
from playwright.sync_api import sync_playwright, expect

BASE      = Path("F:/TeleTCM_Project/qrma_single")
HTML_URL  = "file:///F:/TeleTCM_Project/qrma_single/qrma-dashboard-v5.html"
JSON_FILE = BASE / "01_Data/json/ridwan_2025-11-10.json"
OUT_FILE  = BASE / "01_Data/hrv_test_export.md"
DL_DIR    = BASE / "01_Data"

def step(n, title):
    print(f"\n{'='*60}")
    print(f"STEP {n} — {title}")
    print('='*60)

def check(label, passed, found=""):
    tag = "[PASS]" if passed else "[FAIL]"
    print(f"  {tag} {label}")
    if found:
        print(f"         Found: {found[:120]}")
    return passed

def main():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(accept_downloads=True)
        page    = context.new_page()

        # ─────────────────────────────────────────────────────────
        # STEP 1 — Open dashboard and load full session
        # ─────────────────────────────────────────────────────────
        step(1, "Open dashboard and load full session")

        page.goto(HTML_URL, wait_until="networkidle")
        title = page.title()
        print(f"Page title: {title}")

        # Trigger file input → provide JSON file
        print(f"Loading JSON: {JSON_FILE}")
        file_input = page.locator("#csv-file-input")
        file_input.set_input_files(str(JSON_FILE))

        # Wait for import modal
        page.wait_for_selector("#import-overlay", state="visible", timeout=8000)
        im_name  = page.locator("#im-name").text_content()
        im_age   = page.locator("#im-age").text_content()
        im_sex   = page.locator("#im-sex").text_content()
        im_date  = page.locator("#im-date").text_content()
        im_count = page.locator("#im-count").text_content()
        print(f"Import modal: {im_name} | Age {im_age} | {im_sex} | {im_date}")
        print(f"Fields matched: {im_count}")

        # Confirm import
        page.click("button[onclick='confirmImport()']")
        page.wait_for_selector("#import-overlay", state="hidden", timeout=5000)
        page.wait_for_timeout(2000)   # allow calcAll + renders to settle

        # Check k-dg
        k_dg = page.locator("#k-dg").text_content().strip()
        print(f"k-dg (Digestive KPI): '{k_dg}'")
        if not k_dg or k_dg == "--":
            print("STEP 1 FAILED: k-dg has no value — calcAll may not have fired")
            browser.close(); sys.exit(1)
        print(f"STEP 1 PASS — Digestive score visible: {k_dg}")

        # ─────────────────────────────────────────────────────────
        # STEP 2 — Navigate to HRV and inject data
        # ─────────────────────────────────────────────────────────
        step(2, "Inject HRV data via ingestHrv()")

        page.evaluate("nav('hrv')")
        page.wait_for_timeout(600)

        hrv_visible = page.locator("#hrv").is_visible()
        print(f"HRV section visible: {hrv_visible}")

        # Capture console errors to diagnose script load failures
        console_errors = []
        page.on("console", lambda msg: console_errors.append(f"[{msg.type}] {msg.text}") if msg.type in ("error","warning") else None)

        # Check whether hrv-engine.js loaded (ingestHrv function available)
        hrv_engine_loaded = page.evaluate("typeof ingestHrv === 'function'")
        hrv_state_initial = page.evaluate("typeof window.hrvState")
        print(f"hrv-engine.js loaded (ingestHrv available): {hrv_engine_loaded}")
        print(f"window.hrvState typeof before ingest: {hrv_state_initial}")

        # Fill fields (works even if section is hidden)
        hrv_fields = [
            ("hrv-rmssd",    "28"),
            ("hrv-hr",       "74"),
            ("hrv-sdnn",     "42"),
            ("hrv-duration", "300"),
            ("hrv-artifact", "2.1"),
        ]
        for fid, val in hrv_fields:
            el = page.locator(f"#{fid}")
            el.fill(val)
            actual = el.input_value()
            print(f"  {fid}: set={actual}")

        hrv_state_set = False

        if hrv_engine_loaded:
            # Click Load HRV button (calls ingestHrv())
            page.click("button[onclick='ingestHrv()']")
            page.wait_for_timeout(1000)
            # Use != (not !==) to catch both null and undefined
            hrv_state_set = page.evaluate("window.hrvState != null")
            print(f"hrvState set after ingestHrv(): {hrv_state_set}")
        else:
            print("STEP 2 NOTE: ingestHrv not available — hrv-engine.js not loaded")

        if not hrv_state_set:
            print("STEP 2 FAILED: window.hrvState still null/undefined after ingestHrv()")
            field_ids = page.evaluate("""
                Array.from(document.querySelectorAll('input[id^="hrv-"]'))
                  .map(el => ({ id: el.id, value: el.value }))
            """)
            print("HRV input fields on page:", json.dumps(field_ids, indent=2))
            browser.close(); sys.exit(1)

        hrv_snap_raw = page.evaluate("""JSON.stringify({
            rmssd:              window.hrvState.rmssd,
            meanHr:             window.hrvState.meanHr,
            rmssdBand:          window.hrvState.rmssdBand,
            autonomicLoadIndex: window.hrvState.autonomicLoadIndex,
            qualityFlag:        window.hrvState.qualityFlag,
            recoveryState:      window.hrvState.recoveryState
        })""")
        hrv_snap = json.loads(hrv_snap_raw)
        print(f"window.hrvState snapshot: {json.dumps(hrv_snap, indent=2)}")

        if hrv_snap.get("rmssdBand") != "low":
            print(f"WARNING: Expected rmssdBand='low' for RMSSD=28, got '{hrv_snap.get('rmssdBand')}'")
        print(f"STEP 2 PASS — hrvState set | band={hrv_snap.get('rmssdBand')} | ALI={hrv_snap.get('autonomicLoadIndex')}")

        # ─────────────────────────────────────────────────────────
        # STEP 3 — Export report and capture download
        # ─────────────────────────────────────────────────────────
        step(3, "Export report with HRV loaded")

        # Navigate back to dashboard (export reads dashboard DOM)
        page.evaluate("nav('dashboard')")
        page.wait_for_timeout(600)

        # Check patient name guard
        cc_name = page.evaluate("document.getElementById('cc-name')?.textContent.trim() || ''")
        print(f"cc-name (patient guard): '{cc_name}'")

        # Set up download listener and click export
        with page.expect_download(timeout=12000) as dl_info:
            page.click("button.exp-main")

        download = dl_info.value
        suggested = download.suggested_filename
        print(f"Download triggered — filename: {suggested}")

        download.save_as(str(OUT_FILE))
        print(f"Saved to: {OUT_FILE}")
        print(f"STEP 3 PASS — Export saved as {suggested}")

        browser.close()

    # ─────────────────────────────────────────────────────────────
    # STEP 4 — Verify content of exported file
    # ─────────────────────────────────────────────────────────────
    step(4, "Verify HRV block in exported file")

    if not OUT_FILE.exists():
        print(f"STEP 4 FAILED: File not found at {OUT_FILE}")
        sys.exit(1)

    content = OUT_FILE.read_text(encoding="utf-8")
    print(f"File size: {len(content)} chars")

    # Extract snippets for reporting
    def find(pattern, text=content, flags=re.DOTALL):
        m = re.search(pattern, text, flags)
        return m.group(0) if m else "(not found)"

    checks = [
        ("HRV section header present",
         "## HRV — Autonomic Status" in content,
         find(r"##\s+HRV[^\n]*")),

        ("ALI Band = low (RMSSD=28 → low band)",
         "**ALI Band:** low" in content,
         find(r"\*\*ALI Band:\*\*[^\n]*")),

        ("RMSSD: 28 ms shown",
         bool(re.search(r"RMSSD.*28", content)),
         find(r"RMSSD[^\n]*28[^\n]*")),

        ("HR: 74 bpm shown",
         bool(re.search(r"HR.*74", content)),
         find(r"\| \*\*HR:\*\* \d+ bpm[^\n]*") or find(r"HR.*74[^\n]*")),

        ("Recovery State shown",
         "**Recovery State:**" in content,
         find(r"\*\*Recovery State:\*\*[^\n]*")),

        ("Recommended Practices listed",
         "**Recommended Practices:**" in content,
         find(r"\*\*Recommended Practices:\*\*[^\n]*")),

        ('JSON block: "hrv": { "present": true }',
         '"present": true' in content,
         find(r'"hrv":\s*\{[^}]+\}', flags=re.DOTALL)[:120]),

        ("TXT block: HRV Present: Yes",
         "Present : Yes" in content,
         find(r"Present\s*:\s*(Yes|No)")),
    ]

    print("\nCheck results:")
    all_pass = True
    for label, passed, found in checks:
        ok = check(label, passed, found)
        if not ok:
            all_pass = False

    # Print HRV section excerpt from file
    hrv_section_match = re.search(
        r"## HRV — Autonomic Status[\s\S]+?(?=\n---|\n##|$)", content)
    if hrv_section_match:
        print("\n--- HRV section in exported file ---")
        print(hrv_section_match.group(0)[:600])

    # Print hrv JSON block
    hrv_json_m = re.search(r'"hrv":\s*\{[^}]+\}', content, re.DOTALL)
    if hrv_json_m:
        print("\n--- hrv JSON block ---")
        print(hrv_json_m.group(0))

    # Print HRV TXT block
    hrv_txt_m = re.search(r"HRV\n([\s\S]{0,300})", content)
    if hrv_txt_m:
        print("\n--- HRV TXT block ---")
        print("HRV\n" + hrv_txt_m.group(1).split("\n═")[0])

    print("\n" + ("=== ALL CHECKS PASSED ===" if all_pass else "=== SOME CHECKS FAILED ==="))
    sys.exit(0 if all_pass else 1)


if __name__ == "__main__":
    main()
