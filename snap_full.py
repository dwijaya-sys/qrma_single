import asyncio
from pathlib import Path
from playwright.async_api import async_playwright

HTML  = Path(r"F:\TeleTCM_Project\qrma_single\qrma-dashboard-v5.html")
JFILE = Path(r"F:\TeleTCM_Project\qrma_single\01_Data\json\ridwan_2025-11-10.json")
SS    = Path(r"F:\TeleTCM_Project\qrma_single\01_Data")

async def snap(theme):
    async with async_playwright() as pw:
        browser = await pw.chromium.launch(headless=True)
        page = await (await browser.new_context(viewport={"width": 1280, "height": 900})).new_page()
        await page.goto(HTML.as_uri(), wait_until="domcontentloaded")
        await page.wait_for_function("() => typeof lucide !== 'undefined'", timeout=10000)
        if theme == "dark":
            await page.evaluate("() => document.documentElement.setAttribute('data-theme','dark')")
        await page.locator("#csv-file-input").set_input_files(str(JFILE))
        await page.wait_for_selector("#import-overlay", state="visible", timeout=5000)
        await page.click("button:has-text('Load Report')")
        await page.wait_for_function(
            "() => document.getElementById('pg-dashboard')?.classList.contains('active')",
            timeout=8000)
        # Full-page screenshot captures everything
        await page.screenshot(path=str(SS / f"qa_full_{theme}.png"), full_page=True)
        await browser.close()
        print(f"{theme} done")

async def run():
    await snap("light")
    await snap("dark")

asyncio.run(run())
