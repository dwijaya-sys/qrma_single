import asyncio
from pathlib import Path
from playwright.async_api import async_playwright

HTML  = Path(r"F:\TeleTCM_Project\qrma_single\qrma-dashboard-v5.html")
JFILE = Path(r"F:\TeleTCM_Project\qrma_single\01_Data\json\ridwan_2025-11-10.json")
SS    = Path(r"F:\TeleTCM_Project\qrma_single\01_Data")

async def test(browser, theme):
    page = await (await browser.new_context(viewport={"width": 1280, "height": 900})).new_page()
    errors = []
    page.on("console", lambda m: errors.append(m.text) if m.type == "error" else None)

    await page.goto(HTML.as_uri(), wait_until="domcontentloaded")
    await page.wait_for_function("typeof lucide !== 'undefined'", timeout=10000)

    if theme == "dark":
        await page.evaluate("() => document.documentElement.setAttribute('data-theme','dark')")

    await page.locator("#csv-file-input").set_input_files(str(JFILE))
    await page.wait_for_selector("#import-overlay", state="visible", timeout=5000)
    await page.click("button:has-text('Load Report')")
    await page.wait_for_function(
        "() => document.getElementById('pg-dashboard')?.classList.contains('active')",
        timeout=8000)

    await page.evaluate("() => window.scrollTo(0, 600)")
    await page.screenshot(path=str(SS / f"qa_final_{theme}.png"))

    defaults_color = await page.evaluate("() => Chart.defaults.color")

    pl_color = await page.evaluate(
        "() => { const c = Chart.getChart(document.getElementById('radarChart')); "
        "return c ? c.options.scales.r.pointLabels.color : 'N/A'; }"
    )
    yt_color = await page.evaluate(
        "() => { const c = Chart.getChart(document.getElementById('barChart')); "
        "return c ? c.options.scales.y.ticks.color : 'N/A'; }"
    )
    xt_color = await page.evaluate(
        "() => { const c = Chart.getChart(document.getElementById('barChart')); "
        "return c ? c.options.scales.x.ticks.color : 'N/A'; }"
    )
    ctit = await page.evaluate(
        "() => getComputedStyle(document.querySelector('.ctit')).color"
    )

    scores = {}
    for kid in ["k-ba","k-ox","k-tx","k-mt","k-cr","k-nt","k-sk","k-al","k-dg"]:
        scores[kid] = await page.inner_text(f"#{kid}")

    await page.close()
    return dict(theme=theme, defaults=defaults_color, pl=pl_color,
                xt=xt_color, yt=yt_color, ctit=ctit, scores=scores, errors=errors)


async def run():
    async with async_playwright() as pw:
        browser = await pw.chromium.launch(headless=True)
        for theme in ["light", "dark"]:
            r = await test(browser, theme)
            print(f"\n[{r['theme']}]")
            print(f"  Chart.defaults.color  : {r['defaults']}")
            print(f"  radar pointLabels.color: {r['pl']}")
            print(f"  bar x-ticks.color      : {r['xt']}")
            print(f"  bar y-ticks.color      : {r['yt']}")
            print(f"  .ctit computed         : {r['ctit']}")
            print(f"  scores                 : {r['scores']}")
            print(f"  JS errors              : {r['errors']}")
        await browser.close()

asyncio.run(run())
