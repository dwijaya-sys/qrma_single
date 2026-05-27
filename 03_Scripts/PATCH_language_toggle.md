# PATCH — Language Toggle UI
# Target file: qrma-dashboard-v3.html
# Date: 2026-05-27
# Status: Ready to apply — 4 changes, all str_replace safe

---

## What this does

Adds an ID/EN toggle button to the topbar that:
1. Calls `setLang()` from `zone-scoring.js` (already built)
2. Updates `btn.textContent` to reflect current language
3. Re-renders every visible zone badge label via `getBadge()` + `data-zone` attribute

No new dependencies. No new files. No architecture change.

---

## CHANGE 1 — Add button to header

### WHERE
In `.topbar-r`, immediately before the existing `data-tt` theme button.

### FIND (existing theme button — anchor for str_replace)
```html
    <button class="btic" data-tt aria-label="Switch theme">
```

### REPLACE WITH
```html
    <button class="btic lang-btn" data-lang aria-label="Switch language">ID</button>
    <button class="btic" data-tt aria-label="Switch theme">
```

### WHY
The `data-lang` attribute is the selector used by the JS IIFE (Change 4).
`lang-btn` class adds the text-specific sizing (Change 2).
Button label starts as `ID` (current default language).

---

## CHANGE 2 — Add CSS for lang button

### WHERE
In the `<style>` block. Add immediately after the `.btic:hover` rule.

### FIND
```css
.btic:hover{background:var(--sOff);color:var(--txt);}
```

### REPLACE WITH
```css
.btic:hover{background:var(--sOff);color:var(--txt);}
.lang-btn{font-size:var(--text-xs);font-weight:700;letter-spacing:.05em;min-width:36px;}
```

### WHY
`.btic` was designed for 18×18 icon SVGs. A text label ("ID" / "EN") needs
`font-size` and `font-weight` set explicitly; without it the label renders at
body size and looks too large relative to the theme icon beside it.

---

## CHANGE 3 — Add `data-zone` attribute to zone badge renders

### WHERE
Every place in the `<script>` block that builds a zone badge chip string.
The pattern to find is any template literal containing `zone-badge` and `getBadge`.

### FIND (typical chip render pattern)
```javascript
`<span class="zone-badge ${getColor(z)}">${getBadge(z)}</span>`
```

### REPLACE WITH
```javascript
`<span class="zone-badge ${getColor(z)}" data-zone="${z}">${getBadge(z)}</span>`
```

### Apply to ALL occurrences — there may be 2–4 in bmr(), nutrient chip rows, etc.
Use a global find on `zone-badge` to locate every instance.

### WHY
The toggle IIFE (Change 4) queries `[data-zone]` to know which elements to
re-render and what zone label to apply. Without `data-zone`, it cannot
identify chips or look up the correct translated label.

---

## CHANGE 4 — Add language toggle IIFE

### WHERE
In the `<script>` block at the bottom of `<body>`.
Add immediately after the existing theme toggle IIFE.

### FIND (end of theme toggle IIFE — use the closing characters as anchor)
```javascript
t&&t.addEventListener('click',()=>{d=d==='dark'?'light':'dark';r.setAttribute('data-theme',d);t.innerHTML=
```

> Note: The full theme IIFE is minified on one line. Use the last `});})();` 
> of the theme IIFE as the str_replace anchor if the above is too long to match.
> Alternatively, find `// --- LANGUAGE TOGGLE` if you add a comment as a marker.

### REPLACE WITH (append after the theme IIFE closing `})();`)
```javascript
});})();
(function(){
  const btn=document.querySelector('[data-lang]');
  if(!btn)return;
  let lang='id';
  btn.textContent='ID';
  btn.addEventListener('click',()=>{
    lang=lang==='id'?'en':'id';
    if(typeof setLang==='function')setLang(lang);
    btn.textContent=lang.toUpperCase();
    document.querySelectorAll('[data-zone]').forEach(el=>{
      if(typeof getBadge==='function')el.textContent=getBadge(el.dataset.zone);
    });
  });
})();
```

### WHY — line by line
```
let lang='id'          — tracks toggle state internally; does not read window.currentLang
                         because currentLang is scoped inside zone-scoring.js
btn.textContent='ID'   — initialises label to match the default language
setLang(lang)          — delegates to zone-scoring.js; updates currentLang there
                         and controls what getBadge() returns
btn.textContent=lang   — keeps button label in sync after each click
querySelectorAll       — finds every rendered chip (requires Change 3 to work)
getBadge(el.dataset.zone) — returns 'Normal'/'Ringan'/... or 'Normal'/'Mild'/...
                            depending on current lang
```

---

## QA CHECKS after applying

1. On page load: button shows **ID**, all chips show Indonesian labels (Normal, Ringan, Sedang, Berat)
2. Click once: button shows **EN**, all visible chips update to English (Normal, Mild, Moderate, Severe)
3. Click again: button shows **ID**, chips revert to Indonesian
4. Import a JSON patient → calculate → toggle → chips on all module pages update
5. Dark mode: button remains readable in both themes (inherits `.btic` dark-mode tokens)
6. Console: zero JS errors after toggle in both directions

---

## EDGE CASES

| Scenario | Behaviour |
|---|---|
| Chips rendered after toggle (user navigates to a module) | New chips call `getBadge()` which already has the updated `currentLang` — renders correctly |
| User toggles before calcAll() | No chips exist yet → `querySelectorAll` returns empty NodeList → safe |
| `zone-scoring.js` fails to load | `typeof setLang === 'function'` guard returns false → toggle still flips `lang` and button label, but chips don't update — graceful degradation |
| Unknown zone value in data-zone | `getBadge()` returns `''` or `'Unknown'` — safe, existing zone-unknown CSS class handles display |
