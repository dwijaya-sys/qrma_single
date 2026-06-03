"""Verification: Gut KPI tile layout and wiring."""
import asyncio
from pathlib import Path
from playwright.async_api import async_playwright

HTML  = Path(r"F:\TeleTCM_Project\qrma_single\qrma-dashboard-v5.html")
JFILE = Path(r"F:\TeleTCM_Project\qrma_single\01_Data\json\ridwan_2025-11-10.json")
SS    = Path(r"F:\TeleTCM_Project\qrma_single\01_Data")

js_errors = []

async def main():
    async with async_playwright() as pw:
        browser = await pw.chromium.launch(headless=True)
        page    = await (await browser.new_context()).new_page()
        page.on("console",   lambda m: js_errors.append(m.text) if m.type=="error" else None)
        page.on("pageerror", lambda e: js_errors.append(f"PAGE ERR: {e}"))

        await page.goto(HTML.as_uri(), wait_until="domcontentloaded")
        await page.wait_for_function("typeof lucide !== 'undefined'", timeout=10000)

        # Import JSON
        await page.locator("#csv-file-input").set_input_files(str(JFILE))
        await page.wait_for_selector("#import-overlay", state="visible", timeout=5000)
        await page.click("button:has-text('Load Report')")
        await page.wait_for_function(
            "document.getElementById('pg-dashboard')?.classList.contains('active')",
            timeout=8000
        )

        # ── Tile presence & values ───────────────────────────────────────────
        dg_tile_exists = await page.locator("#k-dg").count() > 0
        dgl_exists     = await page.locator("#k-dgl").count() > 0
        k_dg_val  = await page.inner_text("#k-dg")  if dg_tile_exists else "MISSING"
        k_dgl_val = await page.inner_text("#k-dgl") if dgl_exists     else "MISSING"

        # ── All 9 tiles present ──────────────────────────────────────────────
        tile_ids = ["k-ba","k-ox","k-tx","k-mt","k-cr","k-nt","k-sk","k-al","k-dg"]
        tile_values = {}
        for tid in tile_ids:
            try:    tile_values[tid] = await page.inner_text(f"#{tid}")
            except: tile_values[tid] = "MISSING"

        # ── Grid layout: read bounding rects to check row placement ─────────
        rects = {}
        for tid in tile_ids:
            r = await page.evaluate(f"""
                () => {{
                    const e = document.getElementById('{tid}')?.closest('.kpi');
                    if(!e) return null;
                    const r = e.getBoundingClientRect();
                    return {{top: Math.round(r.top), left: Math.round(r.left),
                             width: Math.round(r.width), height: Math.round(r.height)}};
                }}
            """)
            rects[tid] = r

        # Infer rows by grouping tiles with same top value (±5px tolerance)
        def same_row(a, b):
            if not a or not b: return False
            return abs(a['top'] - b['top']) < 10

        rows = []
        used = set()
        ordered_ids = ["k-ba","k-ox","k-tx","k-mt","k-cr","k-nt","k-sk","k-al","k-dg"]
        for tid in ordered_ids:
            if tid in used: continue
            row = [tid]
            used.add(tid)
            for other in ordered_ids:
                if other not in used and same_row(rects.get(tid), rects.get(other)):
                    row.append(other)
                    used.add(other)
            rows.append(row)

        # ── Utensils icon ────────────────────────────────────────────────────
        utensils_present = await page.evaluate("""
            () => {
                const tile = document.getElementById('k-dg')?.closest('.kpi');
                if(!tile) return false;
                return tile.querySelector('[data-lucide="utensils"]') !== null;
            }
        """)

        # ── Gut tile width vs other tiles (should match) ─────────────────────
        gut_rect   = rects.get("k-dg")
        first_rect = rects.get("k-ba")
        width_match = (gut_rect and first_rect and
                       abs(gut_rect['width'] - first_rect['width']) < 5)

        # ── Screenshot ───────────────────────────────────────────────────────
        await page.screenshot(path=str(SS / "qa_kpi_tile.png"), full_page=False)

        await browser.close()

        # ── Report ───────────────────────────────────────────────────────────
        print("="*60)
        print("KPI TILE VERIFICATION")
        print("="*60)
        print(f"\nk-dg element present:   {dg_tile_exists}")
        print(f"k-dgl element present:  {dgl_exists}")
        print(f"k-dg value:             {k_dg_val}")
        print(f"k-dgl value:            {k_dgl_val}")
        print(f"Utensils icon:          {utensils_present}")
        print(f"Gut tile width matches: {width_match}")
        if gut_rect:
            print(f"Gut tile rect:          {gut_rect}")
        print("\nAll 9 tile values:")
        labels = {"k-ba":"Bio Age","k-ox":"Oxidative","k-tx":"Toxic",
                  "k-mt":"Metabolic","k-cr":"Cardio-Renal","k-nt":"Nutrient",
                  "k-sk":"Skin","k-al":"Allostatic","k-dg":"Gut/Digestive"}
        for tid in tile_ids:
            print(f"  {labels[tid]:<16}: {tile_values[tid]}")
        print(f"\nGrid rows detected: {len(rows)}")
        for i, row in enumerate(rows, 1):
            print(f"  Row {i}: {[labels[t] for t in row]}")
        print(f"\nJS errors: {len(js_errors)}")
        for e in js_errors:
            print(f"  {e}")
        print("="*60)

asyncio.run(main())
