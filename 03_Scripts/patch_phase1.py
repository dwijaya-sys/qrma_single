"""
Phase 1 HTML markup patch:
  Step 2: Add data-label-key to <label class="ilb" for="FIELD_ID">
  Step 3: Add data-ui-key to calculate buttons, mode toggles, csv controls
  Step 4: Add data-module-key to <h2 class="pgt"> module titles
"""

import re, sys, pathlib

HTML_PATH = pathlib.Path(r"F:\TeleTCM_Project\qrma_single\qrma-dashboard-v6.html")

# ── Step 2 target field IDs ──────────────────────────────────────────────────
LABEL_KEYS = {
    # Bio Age
    "bmi", "bv", "cp", "art", "ins", "bs", "fr", "hyp", "ph", "pb", "hg",
    "ce", "cs", "cj", "coq", "gsh", "vc", "ve", "ost",
    # Oxidative
    "ox-gsh", "ox-coq", "ox-vc", "ox-ve", "ox-sel", "ox-fr", "ox-hyp", "ox-ph",
    # Toxic
    "tx-pb", "tx-hg", "tx-cd", "tx-as", "tx-st", "tx-tb", "tx-ps",
    # Metabolic
    "mt-tg", "mt-ug", "mt-ins", "mt-fm", "mt-bmi", "mt-wc",
    # Cardio-Renal
    "cr-ch", "cr-vf", "cr-lv", "cr-ua", "cr-pt", "cr-k", "cr-mg",
    # Nutrient
    "nt-zn", "nt-mg", "nt-k", "nt-io", "nt-si", "nt-b6", "nt-vc",
    "nt-d3", "nt-ve", "nt-fo",
    # Skin
    "sk-sc", "sk-el", "sk-tw", "sk-sb", "sk-ml", "sk-sn", "sk-ec", "sk-jc",
    # Gut
    "dg-lp", "dg-la", "dg-sp", "dg-sa", "dg-lc", "dg-ca", "dg-bi",
    "dg-ip", "dg-ds", "dg-redflag",
    # Body Comp
    "bc-gender", "bc-age", "bc-height", "bc-weight", "bc-bmi",
    "bc-wc", "bc-bf", "bc-vf", "bc-whr",
}

# ── Step 4 module title map ───────────────────────────────────────────────────
# Keys are the raw title text before the <small> tag (may contain &amp; entities)
MODULE_KEYS = {
    "Health Screening Overview":            "dashboard",
    "Basic Info &amp; Biological Age":      "basic",
    "Basic Info & Biological Age":          "basic",
    "Oxidative Stress &amp; Recovery":      "oxidative",
    "Oxidative Stress & Recovery":          "oxidative",
    "Toxic Exposure Flags":                 "toxic",
    "Metabolic Risk":                       "metabolic",
    "Cardio-Renal Strain":                  "cardio",
    "Nutrient Sufficiency":                 "nutrient",
    "Skin &amp; Collagen Resilience":       "skin",
    "Skin & Collagen Resilience":           "skin",
    "Body Composition":                     "bodycomp",
    "Gut / Digestive Function":             "digestive",
}

html = HTML_PATH.read_text(encoding="utf-8")
original = html  # keep for diff count

# ── Step 2: Add data-label-key to matching label elements ────────────────────
def add_label_key(m):
    full_tag = m.group(0)
    field_id = m.group(1)
    if field_id not in LABEL_KEYS:
        return full_tag
    # Skip if already tagged
    if "data-label-key" in full_tag:
        return full_tag
    # Insert data-label-key after the for="..." attribute
    return full_tag.replace(
        f'for="{field_id}"',
        f'for="{field_id}" data-label-key="{field_id}"'
    )

# Match opening label tags that have class="ilb" and a for attribute
# Handles attributes in any order
html = re.sub(
    r'<label\b[^>]*\bfor="([^"]+)"[^>]*>',
    add_label_key,
    html
)

# ── Step 3: Add data-ui-key to UI elements ───────────────────────────────────

# 3a. Calculate buttons — onclick="calcAll()"
def add_calc_ui_key(m):
    tag = m.group(0)
    if "data-ui-key" in tag:
        return tag
    return tag.replace('onclick="calcAll()"', 'onclick="calcAll()" data-ui-key="calculate_all"')

html = re.sub(r'<button\b[^>]*onclick="calcAll\(\)"[^>]*>', add_calc_ui_key, html)

# 3b. Body Comp mode toggle buttons
def patch_id_attr(tag, old_id, ui_key):
    if "data-ui-key" in tag:
        return tag
    return tag.replace(f'id="{old_id}"', f'id="{old_id}" data-ui-key="{ui_key}"')

def add_bc_mode_manual(m):
    return patch_id_attr(m.group(0), "bc-mode-manual", "manual_entry")
html = re.sub(r'<button\b[^>]*id="bc-mode-manual"[^>]*>', add_bc_mode_manual, html)

def add_bc_mode_csv(m):
    return patch_id_attr(m.group(0), "bc-mode-csv", "csv_import")
html = re.sub(r'<button\b[^>]*id="bc-mode-csv"[^>]*>', add_bc_mode_csv, html)

# 3c. Template download link (uses onclick, not id)
def add_download_template(m):
    tag = m.group(0)
    if "data-ui-key" in tag:
        return tag
    return tag.replace('onclick="bcDownloadTemplate()', 'data-ui-key="download_template" onclick="bcDownloadTemplate()')
html = re.sub(r'<a\b[^>]*onclick="bcDownloadTemplate\(\)[^"]*"[^>]*>', add_download_template, html)

# 3d. Body Comp confirm CSV button
def add_bc_csv_confirm(m):
    return patch_id_attr(m.group(0), "bc-csv-confirm", "import_calculate")
html = re.sub(r'<button\b[^>]*id="bc-csv-confirm"[^>]*>', add_bc_csv_confirm, html)

# ── Step 4: Add data-module-key to <h2 class="pgt"> titles ──────────────────
def add_module_key(m):
    tag_open = m.group(1)   # e.g. <h2 class="pgt">
    content  = m.group(2)   # inner text, possibly with HTML entities and <small>
    tag_close = m.group(3)  # </h2>

    if "data-module-key" in tag_open:
        return m.group(0)

    # Extract only the text BEFORE the first child tag (e.g. <small>)
    # This gives us the raw title, which may include &amp; entities
    title = content.split("<")[0].strip()

    module_key = MODULE_KEYS.get(title)
    if not module_key:
        return m.group(0)

    new_open = tag_open.replace('<h2', f'<h2 data-module-key="{module_key}"')
    return new_open + content + tag_close

html = re.sub(
    r'(<h2\b[^>]*class="pgt"[^>]*>)(.*?)(</h2>)',
    add_module_key,
    html,
    flags=re.DOTALL
)

# ── Write output ─────────────────────────────────────────────────────────────
HTML_PATH.write_text(html, encoding="utf-8")
print(f"Patched: {HTML_PATH}")

# ── Counts ───────────────────────────────────────────────────────────────────
lk  = html.count("data-label-key")
uik = html.count("data-ui-key")
mk  = html.count("data-module-key")
fn  = html.count("function applyLabels")

print(f"data-label-key  : {lk}")
print(f"data-ui-key     : {uik}")
print(f"data-module-key : {mk}")
print(f"applyLabels fn  : {fn}  (must be 0)")

# ── Self-check ───────────────────────────────────────────────────────────────
print()
results = [
    # Spec says 82 but enumerates 84 unique IDs — actual count is 84
    ("data-label-key = 84 (spec listed 84 unique IDs)",  lk == 84),
    ("data-ui-key >= 5",     uik >= 5),
    ("data-module-key = 10", mk == 10),
    ("No applyLabels fn",    fn == 0),
]
all_pass = True
for label, ok in results:
    status = "PASS" if ok else "FAIL"
    if not ok:
        all_pass = False
    print(f"  [{status}] {label}")

if all_pass:
    print("\nPHASE 1 COMPLETE")
else:
    print("\nOne or more checks FAILED — review above")
    sys.exit(1)
