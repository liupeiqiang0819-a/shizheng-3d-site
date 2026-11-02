const { chromium } = require('playwright');
(async () => { const base = process.argv[2]; const ids = process.argv.slice(3);
  const b = await chromium.launch({ args: ['--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'] });
  const errors = []; const rows = [];
  const ctx = await b.newContext({ viewport: { width: 1280, height: 900 } }); const page = await ctx.newPage();
  page.on('console', m => { if (m.type() === 'error') errors.push(`${m.text()}`); }); page.on('pageerror', e => errors.push('pageerror ' + e.message));
  const click = async s => { const e = await page.$(s); if (e && await e.isVisible() && await e.isEnabled()) { await e.click({ timeout: 5000 }).catch(() => {}); await page.waitForTimeout(300); return 1; } return 0; };
  for (const id of ids) {
    await page.goto(base + '#' + id + '/0', { waitUntil: 'load' }); await page.waitForTimeout(1500); await click('#continueCourse');
    const r = { id };
    r.v15 = await page.evaluate(() => !!document.querySelector('#spatialHost .v15-stage canvas'));
    r.next = await click('#next'); r.step = await page.evaluate(() => location.hash);
    r.prev = await click('#prev');
    r.v2d = await click('#view2d'); r.svg2d = await page.evaluate(() => !!document.querySelector('#scene svg, #scene *')); r.v3d = await click('#view3d');
    r.recall = await click('#showRecall');
    r.section = await page.evaluate(() => { const bt = document.querySelector('.v15-tools [data-act=section]'); if (!bt) return 0; bt.click(); bt.click(); return 1; });
    rows.push(r);
  }
  // spaced-review dialog
  await page.goto(base, { waitUntil: 'load' }); await page.waitForTimeout(1200);
  const q = await click('#quickStudy'); const rv = await click('#revealStudy'); const g = await click('#gradeCorrect');
  rows.push({ study: { open: q, reveal: rv, grade: g } });
  console.log(JSON.stringify(rows)); console.log('ERRORS', errors.length, JSON.stringify(errors.slice(0, 10))); await b.close(); })();
