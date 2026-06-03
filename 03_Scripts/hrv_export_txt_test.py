"""
HRV Export — TXT format verification
Reuses the same session setup, switches format to txt before export.
"""

import sys, json, re
from pathlib import Path
from playwright.sync_api import sync_playwright

BASE      = Path("F:/TeleTCM_Project/qrma_single")
HTML_URL  = "file:///F:/TeleTCM_Project/qrma_single/qrma-dashboard-v5.html"
JSON_FILE = BASE / "01_Data/json/ridwan_2025-11-10.json"
OUT_MD    = BASE / "01_Data/hrv_test_export.md"
OUT_TXT   = BASE / "01_Data/hrv_test_export.txt"

def step(n, title):
    print(f"\n{'='*60}\nSTEP {n} — {title}\n{'='*60}")

def check(label, passed, found=""):
    tag = "[PASS]" if passed else "[FAIL]"
    print(f"  {tag} {label}")
    if found:
        print(f"         Found: {found[:140]}")
    return passed

def setup_session(page):
    """Import JSON + confirm + wait for calcAll."""
    page.goto(HTML_URL, wait_until="networkidle")
    page.locator("#csv-file-input").set_input_files(str(JSON_FILE))
    page.wait_for_selector("#import-overlay", state="visible", timeout=8000)
    page.click("button[onclick='confirmImport()']")
    page.wait_for_selector("#import-overlay", state="hidden", timeout=5000)
    page.wait_for_timeout(2000)
    k_dg = page.locator("#k-dg").text_content().strip()
    print(f"  k-dg: {k_dg}")
    assert k_dg and k_dg != "--", "calcAll did not fire"

def inject_hrv(page):
    """Fill HRV form and call ingestHrv()."""
    page.evaluate("nav('hrv')")
    page.wait_for_timeout(500)
    for fid, val in [("hrv-rmssd","28"),("hrv-hr","74"),
                     ("hrv-sdnn","42"),("hrv-duration","300"),("hrv-artifact","2.1")]:
        page.locator(f"#{fid}").fill(val)
    page.click("button[onclick='ingestHrv()']")
    page.wait_for_timeout(800)
    ok = page.evaluate("window.hrvState != null")
    snap = json.loads(page.evaluate(
        "JSON.stringify({rmssd:window.hrvState.rmssd,meanHr:window.hrvState.meanHr,"
        "rmssdBand:window.hrvState.rmssdBand,ali:window.hrvState.autonomicLoadIndex,"
        "quality:window.hrvState.qualityFlag,recovery:window.hrvState.recoveryState})"
    )) if ok else {}
    print(f"  window.hrvState set: {ok} — {snap}")
    assert ok, "window.hrvState is null after ingestHrv()"
    return snap

def do_export(page, fmt):
    """Switch format, navigate to dashboard, download."""
    page.evaluate(f"setExportFmt('{fmt}')")
    page.wait_for_timeout(200)
    page.evaluate("nav('dashboard')")
    page.wait_for_timeout(500)
    with page.expect_download(timeout=12000) as dl:
        page.click("button.exp-main")
    return dl.value

def main():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)

        # ── MD export (confirm existing fix still works) ─────────
        step(1, "MD format export (regression check)")
        ctx  = browser.new_context(accept_downloads=True)
        page = ctx.new_page()
        setup_session(page)
        snap = inject_hrv(page)
        dl   = do_export(page, 'md')
        dl.save_as(str(OUT_MD))
        print(f"  Saved: {dl.suggested_filename} → {OUT_MD}")
        ctx.close()

        # ── TXT export ───────────────────────────────────────────
        step(2, "TXT format export")
        ctx  = browser.new_context(accept_downloads=True)
        page = ctx.new_page()
        setup_session(page)
        snap = inject_hrv(page)
        dl   = do_export(page, 'txt')
        dl.save_as(str(OUT_TXT))
        print(f"  Saved: {dl.suggested_filename} → {OUT_TXT}")
        ctx.close()

        browser.close()

    # ── Verify MD ────────────────────────────────────────────────
    step(3, "Verify MD file")
    md = OUT_MD.read_text(encoding="utf-8")
    print(f"  File size: {len(md)} chars")
    md_checks = [
        ("HRV section header",          "## HRV — Autonomic Status" in md),
        ("ALI Band: low",               "**ALI Band:** low" in md),
        ("RMSSD 28 ms",                 bool(re.search(r"RMSSD.*28", md))),
        ("HR 74 bpm",                   bool(re.search(r"HR.*74", md))),
        ("Recovery State shown",        "**Recovery State:**" in md),
        ("Recommended Practices",       "**Recommended Practices:**" in md),
        ('JSON "present": true',        '"present": true' in md),
        ('JSON "ali_band": "low"',      '"ali_band": "low"' in md),
        ('JSON "rmssd": 28',            '"rmssd": 28' in md),
        ('JSON "mean_hr": 74',          '"mean_hr": 74' in md),
    ]
    md_pass = all(check(l, p, re.search(r"[^\n]*" + re.escape(l.split('"')[-1].split(':')[-1].strip()) + r"[^\n]*", md, re.IGNORECASE).group(0) if re.search(r"[^\n]*" + re.escape(l.split('"')[-1].split(':')[-1].strip()) + r"[^\n]*", md, re.IGNORECASE) else "(not found)") for l, p in md_checks)

    # ── Verify TXT ───────────────────────────────────────────────
    step(4, "Verify TXT file")
    txt = OUT_TXT.read_text(encoding="utf-8")
    print(f"  File size: {len(txt)} chars")

    def find(pattern, content=txt):
        m = re.search(pattern, content)
        return m.group(0) if m else "(not found)"

    txt_checks = [
        ("HRV section header present",
         "## HRV — Autonomic Status" in txt,
         find(r"##\s+HRV[^\n]*")),

        ("ALI Band: low",
         bool(re.search(r"ALI Band.*low", txt)),
         find(r"ALI Band[^\n]*")),

        ("RMSSD 28 ms shown",
         bool(re.search(r"RMSSD.*28", txt)),
         find(r"RMSSD[^\n]*28[^\n]*")),

        ("HR 74 bpm shown",
         bool(re.search(r"HR.*74", txt)),
         find(r"HR[^\n]*74[^\n]*")),

        ("Recovery State shown",
         bool(re.search(r"Recovery State", txt)),
         find(r"Recovery State[^\n]*")),

        ("Recommended Practices listed",
         bool(re.search(r"Recommended Practices", txt)),
         find(r"Recommended Practices[^\n]*")),

        ("MODULE SCORES section present",
         "MODULE SCORES" in txt,
         find(r"MODULE SCORES[^\n]*")),

        ("HRV Present: Yes  (TXT block)",
         "Present : Yes" in txt,
         find(r"Present\s*:\s*(Yes|No)")),

        ("TXT ALI Band line",
         bool(re.search(r"ALI Band\s*:\s*low", txt)),
         find(r"ALI Band\s*:[^\n]*")),

        ("TXT RMSSD line",
         bool(re.search(r"RMSSD\s*:\s*28", txt)),
         find(r"RMSSD\s*:[^\n]*")),

        ("TXT HR line",
         bool(re.search(r"\bHR\s*:\s*74", txt)),
         find(r"\bHR\s*:[^\n]*")),

        ("TXT Quality line",
         bool(re.search(r"Quality\s*:\s*pass", txt)),
         find(r"Quality\s*:[^\n]*")),
    ]

    print("\nCheck results:")
    txt_pass = True
    for label, passed, found in txt_checks:
        ok = check(label, passed, found)
        if not ok:
            txt_pass = False

    # Print HRV TXT sections
    hrv_narrative = re.search(r"## HRV — Autonomic Status[\s\S]+?(?=\n---|$)", txt)
    if hrv_narrative:
        print("\n--- HRV narrative section (TXT) ---")
        print(hrv_narrative.group(0)[:500])

    hrv_block = re.search(r"HRV\n(  [^\n]+\n)+", txt)
    if hrv_block:
        print("\n--- HRV data block (TXT summary) ---")
        print("HRV\n" + hrv_block.group(0))

    all_pass = md_pass and txt_pass
    print("\n" + ("=== ALL CHECKS PASSED ===" if all_pass else "=== SOME CHECKS FAILED ==="))
    sys.exit(0 if all_pass else 1)

if __name__ == "__main__":
    main()
