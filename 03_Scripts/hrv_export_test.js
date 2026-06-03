// HRV Export Verification — Playwright automation
// Steps: load session → import JSON → inject HRV → export → save file

const { chromium } = require('playwright');
const path = require('path');
const fs   = require('fs');

const HTML_PATH  = 'file:///F:/TeleTCM_Project/qrma_single/qrma-dashboard-v5.html';
const JSON_PATH  = path.resolve('F:/TeleTCM_Project/qrma_single/01_Data/json/ridwan_2025-11-10.json');
const OUT_PATH   = path.resolve('F:/TeleTCM_Project/qrma_single/01_Data/hrv_test_export.md');
const DOWNLOAD_DIR = path.resolve('F:/TeleTCM_Project/qrma_single/01_Data');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    acceptDownloads: true
  });
  const page = await context.newPage();

  // ─────────────────────────────────────────────────────────────
  // STEP 1 — Open dashboard
  // ─────────────────────────────────────────────────────────────
  console.log('\n=== STEP 1: Open dashboard ===');
  await page.goto(HTML_PATH, { waitUntil: 'networkidle' });
  console.log('Page loaded:', await page.title());

  // ─────────────────────────────────────────────────────────────
  // Import JSON via csv-file-input (detects .json by extension)
  // ─────────────────────────────────────────────────────────────
  console.log('Setting JSON file on csv-file-input...');
  const fileInput = page.locator('#csv-file-input');
  await fileInput.setInputFiles(JSON_PATH);

  // Wait for import modal to appear
  await page.waitForSelector('#import-overlay', { state: 'visible', timeout: 5000 });
  console.log('Import modal visible — patient fields:');
  const imName = await page.locator('#im-name').textContent();
  const imAge  = await page.locator('#im-age').textContent();
  const imSex  = await page.locator('#im-sex').textContent();
  const imDate = await page.locator('#im-date').textContent();
  const imCount= await page.locator('#im-count').textContent();
  console.log(`  Name: ${imName} | Age: ${imAge} | Sex: ${imSex} | Date: ${imDate}`);
  console.log(`  Fields matched: ${imCount}`);

  // Click Confirm Import (calls confirmImport())
  console.log('Clicking Confirm Import...');
  await page.click('button[onclick="confirmImport()"]');

  // Wait for modal to close and calcAll to run
  await page.waitForSelector('#import-overlay', { state: 'hidden', timeout: 5000 });
  await page.waitForTimeout(1500); // allow calcAll + renders to settle

  // Verify k-dg has a value
  const kDg = await page.locator('#k-dg').textContent();
  console.log(`k-dg (Digestive score): "${kDg}"`);
  if (!kDg || kDg === '--') {
    console.error('STEP 1 FAILED: k-dg has no value — calcAll may not have fired');
    await browser.close(); process.exit(1);
  }
  console.log('STEP 1 PASS — Dashboard loaded with Digestive score:', kDg);

  // ─────────────────────────────────────────────────────────────
  // STEP 2 — Navigate to HRV and inject data
  // ─────────────────────────────────────────────────────────────
  console.log('\n=== STEP 2: Inject HRV data ===');

  // Navigate to HRV module via JS nav()
  await page.evaluate(() => nav('hrv'));
  await page.waitForTimeout(500);

  // Verify HRV section is visible
  const hrvSectionVisible = await page.locator('#hrv').isVisible();
  console.log('HRV section visible:', hrvSectionVisible);

  // Fill HRV fields
  const fields = [
    { id: 'hrv-rmssd',    value: '28'    },
    { id: 'hrv-hr',       value: '74'    },
    { id: 'hrv-sdnn',     value: '42'    },
    { id: 'hrv-duration', value: '300'   },
    { id: 'hrv-artifact', value: '2.1'   }
  ];

  for (const f of fields) {
    const el = page.locator(`#${f.id}`);
    await el.fill(f.value);
    const actual = await el.inputValue();
    console.log(`  ${f.id}: set to ${actual}`);
  }

  // Click "Load HRV" button
  console.log('Clicking Load HRV...');
  await page.click('button[onclick="ingestHrv()"]');
  await page.waitForTimeout(800);

  // Verify hrvState
  const hrvStateSet = await page.evaluate(() => window.hrvState !== null);
  if (!hrvStateSet) {
    // Diagnostic: report all HRV field IDs present
    const fieldIds = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('input[id^="hrv-"]'))
        .map(el => ({ id: el.id, value: el.value }));
    });
    console.error('STEP 2 FAILED: window.hrvState is null after ingestHrv()');
    console.error('HRV fields on page:', JSON.stringify(fieldIds, null, 2));
    await browser.close(); process.exit(1);
  }

  // Read hrvState fields
  const hrvSnapshot = await page.evaluate(() => JSON.stringify({
    rmssd:              window.hrvState.rmssd,
    meanHr:             window.hrvState.meanHr,
    rmssdBand:          window.hrvState.rmssdBand,
    autonomicLoadIndex: window.hrvState.autonomicLoadIndex,
    qualityFlag:        window.hrvState.qualityFlag,
    recoveryState:      window.hrvState.recoveryState
  }));
  console.log('window.hrvState snapshot:', hrvSnapshot);

  const hrv = JSON.parse(hrvSnapshot);
  if (hrv.rmssdBand !== 'low') {
    console.warn(`WARNING: Expected rmssdBand='low' for RMSSD=28, got '${hrv.rmssdBand}'`);
  }
  console.log('STEP 2 PASS — hrvState set, band:', hrv.rmssdBand, '| ALI:', hrv.autonomicLoadIndex);

  // ─────────────────────────────────────────────────────────────
  // STEP 3 — Export report and intercept download
  // ─────────────────────────────────────────────────────────────
  console.log('\n=== STEP 3: Export report ===');

  // Navigate to dashboard first (export reads DOM elements from dashboard page)
  await page.evaluate(() => nav('dashboard'));
  await page.waitForTimeout(500);

  // Set up download listener before clicking
  const downloadPromise = page.waitForEvent('download', { timeout: 10000 });

  // Click the main export button (exportSessionReport())
  await page.click('button.exp-main');

  let download;
  try {
    download = await downloadPromise;
    console.log('Download triggered — suggested filename:', download.suggestedFilename());
  } catch(e) {
    console.error('STEP 3 FAILED: Download event not fired:', e.message);

    // Fallback: try calling exportSessionReport directly and intercept via content
    console.log('Trying JS direct call...');
    // Check if alert fired (patient guard)
    const alertText = await page.evaluate(() => {
      const el = document.getElementById('cc-name');
      return el ? el.textContent.trim() : 'ELEMENT_MISSING';
    });
    console.error('cc-name value:', alertText);
    await browser.close(); process.exit(1);
  }

  // Save to the target path
  await download.saveAs(OUT_PATH);
  console.log('Saved to:', OUT_PATH);
  console.log('STEP 3 PASS — Export downloaded as:', download.suggestedFilename());

  await browser.close();

  // ─────────────────────────────────────────────────────────────
  // STEP 4 — Verify content of exported file
  // ─────────────────────────────────────────────────────────────
  console.log('\n=== STEP 4: Verify exported file ===');
  if (!fs.existsSync(OUT_PATH)) {
    console.error('STEP 4 FAILED: File not found at', OUT_PATH);
    process.exit(1);
  }

  const content = fs.readFileSync(OUT_PATH, 'utf-8');
  console.log('File size:', content.length, 'chars');

  const checks = [
    {
      id: 'HRV section header',
      pass: content.includes('## HRV — Autonomic Status'),
      found: content.match(/##\s+HRV[^\n]*/)?.[0] || '(not found)'
    },
    {
      id: 'ALI band "low" (RMSSD=28)',
      pass: content.includes('**ALI Band:** low'),
      found: content.match(/\*\*ALI Band:\*\*[^\n]*/)?.[0] || '(not found)'
    },
    {
      id: 'RMSSD 28 ms shown',
      pass: /RMSSD.*28/.test(content),
      found: content.match(/RMSSD[^\n]*/)?.[0] || '(not found)'
    },
    {
      id: 'HR 74 bpm shown',
      pass: /HR.*74/.test(content),
      found: content.match(/HR.*74[^\n]*/)?.[0] || '(not found)'
    },
    {
      id: 'Recovery State shown',
      pass: content.includes('**Recovery State:**'),
      found: content.match(/\*\*Recovery State:\*\*[^\n]*/)?.[0] || '(not found)'
    },
    {
      id: 'Recommended Practices listed',
      pass: content.includes('**Recommended Practices:**'),
      found: content.match(/\*\*Recommended Practices:\*\*[^\n]*/)?.[0] || '(not found)'
    },
    {
      id: 'JSON block: hrv present:true',
      pass: content.includes('"present": true'),
      found: (() => {
        const m = content.match(/"hrv":\s*\{[^}]+\}/s);
        return m ? m[0].replace(/\s+/g,' ').slice(0,120) : '(not found)';
      })()
    },
    {
      id: 'TXT block: HRV Present: Yes',
      pass: content.includes('Present : Yes'),
      found: content.match(/Present\s*:\s*(Yes|No)/)?.[0] || '(not found)'
    }
  ];

  let allPass = true;
  console.log('\nCheck results:');
  for (const c of checks) {
    const tag = c.pass ? '[PASS]' : '[FAIL]';
    console.log(`  ${tag} ${c.id}`);
    if (!c.pass) {
      console.log(`         Found: ${c.found}`);
      allPass = false;
    } else {
      console.log(`         Found: ${c.found}`);
    }
  }

  console.log('\n' + (allPass ? '=== ALL CHECKS PASSED ===' : '=== SOME CHECKS FAILED ==='));

  // Print the HRV section from the file for review
  const hrvMatch = content.match(/## HRV — Autonomic Status[\s\S]+?(?=\n---|\n##|$)/);
  if (hrvMatch) {
    console.log('\n--- HRV section in exported file ---');
    console.log(hrvMatch[0]);
  }

  // Print the HRV JSON block
  const jsonStart = content.indexOf('"hrv":');
  if (jsonStart !== -1) {
    const snippet = content.slice(jsonStart, jsonStart + 200).split('\n').slice(0,8).join('\n');
    console.log('\n--- hrv JSON block ---');
    console.log(snippet);
  }

  // Print HRV block from TXT section
  const txtHrv = content.match(/HRV\n[\s\S]{0,200}/);
  if (txtHrv) {
    console.log('\n--- HRV TXT block ---');
    console.log(txtHrv[0].split('\n').slice(0,6).join('\n'));
  }

  process.exit(allPass ? 0 : 1);
})();
