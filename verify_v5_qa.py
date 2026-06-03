"""
v5.0 Browser QA — Playwright verification script
Drives qrma-dashboard-v5.html, imports Ridwan JSON, calculates, reports.
"""
import asyncio, json, os, sys
from pathlib import Path
from playwright.async_api import async_playwright, ConsoleMessage

HTML  = Path(r"F:\TeleTCM_Project\qrma_single\qrma-dashboard-v5.html")
JFILE = Path(r"F:\TeleTCM_Project\qrma_single\01_Data\json\ridwan_2025-11-10.json")
SS    = Path(r"F:\TeleTCM_Project\qrma_single\01_Data")   # screenshots land here

URL = HTML.as_uri()
js_errors = []
js_logs   = []

async def main():
    async with async_playwright() as pw:
        browser = await pw.chromium.launch(headless=True)
        ctx     = await browser.new_context()
        page    = await ctx.new_page()

        # Capture console
        def on_console(msg: ConsoleMessage):
            if msg.type == "error":
                js_errors.append(msg.text)
            js_logs.append(f"[{msg.type}] {msg.text}")
        page.on("console", on_console)
        page.on("pageerror", lambda e: js_errors.append(f"PAGE ERROR: {e}"))

        # ── 1. Open dashboard ────────────────────────────────────────────────
        print("Step 1: Opening dashboard …")
        await page.goto(URL, wait_until="domcontentloaded")
        # Wait for Lucide icons + Chart.js to init
        await page.wait_for_function("typeof lucide !== 'undefined'", timeout=10000)
        await page.screenshot(path=str(SS / "qa_01_initial.png"))
        print("       Dashboard loaded.")

        # ── 2. Set the JSON file on the hidden file input ────────────────────
        print("Step 2: Injecting JSON into file input …")
        file_input = page.locator("#csv-file-input")
        # Playwright can set files on hidden inputs directly
        await file_input.set_input_files(str(JFILE))

        # Wait for import modal to appear
        await page.wait_for_selector("#import-overlay", state="visible", timeout=5000)
        await page.screenshot(path=str(SS / "qa_02_import_modal.png"))

        # Read patient info from modal
        im_name = await page.inner_text("#im-name")
        im_date = await page.inner_text("#im-date")
        im_age  = await page.inner_text("#im-age")
        im_sex  = await page.inner_text("#im-sex")
        im_cnt  = await page.inner_text("#im-count")
        print(f"       Modal: {im_name} | {im_date} | age {im_age} | {im_sex} | fields {im_cnt}")

        # ── 3. Confirm import ────────────────────────────────────────────────
        print("Step 3: Clicking 'Load Report' …")
        await page.click("button:has-text('Load Report')")
        # calcAll fires automatically after import — wait for dashboard to be active
        await page.wait_for_function(
            "document.getElementById('pg-dashboard')?.classList.contains('active')",
            timeout=8000
        )
        await page.screenshot(path=str(SS / "qa_03_dashboard_after_import.png"))
        print("       Import complete, dashboard active.")

        # ── 4. Digestive module ──────────────────────────────────────────────
        print("Step 4: Navigating to Gut / Digestive module …")
        await page.click("button[data-nav='digestive']")
        await page.wait_for_selector("#r-dg", state="visible", timeout=5000)
        await page.screenshot(path=str(SS / "qa_04_digestive.png"))

        dgs  = await page.inner_text("#r-dgs")
        dgl  = await page.inner_text("#r-dgl")
        dgmt = await page.inner_text("#r-dgmt")
        dgab = await page.inner_text("#r-dgab")
        dgpi = await page.inner_text("#r-dgpi")

        # Pattern alerts
        dgpat_html = await page.inner_html("#r-dgpat")
        bloating    = "Bloating with Reduced Transit Pattern"    in dgpat_html
        upper_gi    = "Upper GI Digestion Strain Pattern"        in dgpat_html
        absorption  = "Absorption Deficit Pattern"               in dgpat_html

        # Digestive Pattern Flagged info alert
        dgal_html   = await page.inner_html("#r-dgal")
        flagged_alert = "Digestive Pattern Flagged"              in dgal_html

        # Red-flag referral state
        redflag_vis = await page.is_visible("#r-dg-redflag")
        scores_vis  = await page.is_visible("#r-dg-scores")

        print(f"       Gut Score: {dgs} ({dgl})")
        print(f"       Motility/Transit: {dgmt}  |  Absorption/Env: {dgab}  |  Pressure/Integrity: {dgpi}")
        print(f"       Patterns — Bloating: {bloating}  |  UpperGI: {upper_gi}  |  Absorption: {absorption}")
        print(f"       Pattern Flagged alert: {flagged_alert}")
        print(f"       Redflag panel visible: {redflag_vis}  |  Scores panel visible: {scores_vis}")

        # ── 5. Action Plan ───────────────────────────────────────────────────
        print("Step 5: Navigating to Action Plan …")
        await page.click("button[data-nav='action']")
        await page.wait_for_selector("#r-acttbl", timeout=5000)
        await page.screenshot(path=str(SS / "qa_05_action_plan.png"))

        acttbl_html = await page.inner_html("#r-acttbl")
        actfood_html = await page.inner_html("#r-actfood")

        gut_rows     = acttbl_html.count("Gut:")
        digest_food  = "Digestive Support" in actfood_html

        print(f"       Gut: rows in confirmatory table: {gut_rows}")
        print(f"       Digestive Support in food section: {digest_food}")

        # ── 6. Radar chart (back to dashboard) ───────────────────────────────
        print("Step 6: Checking radar chart …")
        await page.click("button[data-nav='dashboard']")
        await page.wait_for_selector("#radarChart", timeout=5000)
        await page.screenshot(path=str(SS / "qa_06_radar.png"))

        # Read radar chart labels via Chart.js registry (RC is a let, not window.RC)
        radar_labels = await page.evaluate("""
            () => {
                const canvas = document.getElementById('radarChart');
                if (!canvas) return null;
                const chart = Chart.getChart(canvas);
                return chart ? chart.data.labels : null;
            }
        """)
        gut_in_radar = "Gut" in (radar_labels or [])
        label_count  = len(radar_labels) if radar_labels else 0
        print(f"       Radar labels ({label_count}): {radar_labels}")
        print(f"       'Gut' present: {gut_in_radar}")

        # ── 7. Regression — read KPI cards for all 8 existing modules ────────
        print("Step 7: Regression — reading all module KPI cards …")
        kpis = {}
        for kid in ["k-ba","k-ox","k-tx","k-mt","k-cr","k-nt","k-sk","k-al"]:
            try:
                kpis[kid] = await page.inner_text(f"#{kid}")
            except Exception:
                kpis[kid] = "MISSING"

        # Also check Gut KPI if it exists
        try:
            kpis["k-dg"] = await page.inner_text("#k-dg")
        except Exception:
            kpis["k-dg"] = "(no KPI card — expected, Phase B only added module section)"

        for k, v in kpis.items():
            print(f"       {k}: {v}")

        # ── 8. Check existing modules still score ────────────────────────────
        # Panels live inside module pages (hidden when not active).
        # Instead, verify KPI card values are non-trivially populated.
        print("Step 8: Verifying all 8 existing modules scored (KPI card values) …")
        kpi_map = {
            "k-ba": "Bio Age",    "k-ox": "Oxidative", "k-tx": "Toxic",
            "k-mt": "Metabolic",  "k-cr": "Cardio-Renal",
            "k-nt": "Nutrient",   "k-sk": "Skin",       "k-al": "Allostatic"
        }
        panel_status = {}
        for kid, label in kpi_map.items():
            val = kpis.get(kid, "MISSING")
            ok  = val not in ("", "MISSING", "--", "0%", "0y")
            panel_status[label] = ok
            print(f"       {label:<18}: {val}  ({'OK' if ok else 'FAIL'})")

        await page.screenshot(path=str(SS / "qa_07_regression.png"))

        # ── 9. JS console errors ─────────────────────────────────────────────
        await browser.close()

        # ── REPORT ──────────────────────────────────────────────────────────
        print("\n" + "="*60)
        print("QA REPORT — qrma-dashboard-v5.html + Ridwan JSON")
        print("="*60)
        print(f"\nIMPORT:  {im_name} | {im_date} | age {im_age} | {im_sex} | fields {im_cnt}")
        print("\n─── DIGESTIVE MODULE ───────────────────────────────────────")
        print(f"1. Gut Score (r-dgs):              {dgs}")
        print(f"   Label (r-dgl):                  {dgl}")
        print(f"2. Motility / Transit (r-dgmt):    {dgmt}")
        print(f"3. Absorption / Env (r-dgab):      {dgab}")
        print(f"4. Pressure / Integrity (r-dgpi):  {dgpi}")
        print(f"5. Pattern alerts:")
        print(f"   Bloating with Reduced Transit:  {'YES' if bloating else 'NO'}")
        print(f"   Upper GI Digestion Strain:      {'YES' if upper_gi else 'NO'}")
        print(f"   Absorption Deficit:             {'YES' if absorption else 'NO'}")
        print(f"6. 'Digestive Pattern Flagged':    {'YES' if flagged_alert else 'NO'}")
        print(f"   Scores panel visible:           {scores_vis}")
        print(f"   Redflag panel visible:          {redflag_vis}")
        print("\n─── ACTION PLAN ────────────────────────────────────────────")
        print(f"7. Gut: rows in tests table:       {gut_rows}")
        print(f"8. Digestive Support in food:      {'YES' if digest_food else 'NO'}")
        print("\n─── RADAR CHART ────────────────────────────────────────────")
        print(f"9. Axis count:                     {label_count} (expected 9)")
        print(f"   Labels:                         {radar_labels}")
        print(f"10. 'Gut' label present:            {'YES' if gut_in_radar else 'NO'}")
        print("\n─── REGRESSION ─────────────────────────────────────────────")
        for label, ok in panel_status.items():
            print(f"    {label:<18}: {'OK' if ok else 'FAIL'}")
        print("\n─── JS CONSOLE ERRORS ──────────────────────────────────────")
        if js_errors:
            print(f"12. ERRORS ({len(js_errors)}):")
            for e in js_errors:
                print(f"    {e}")
        else:
            print(f"12. No JS errors.")
        print("\nScreenshots saved to: " + str(SS))
        print("="*60)

asyncio.run(main())
