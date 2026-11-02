const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ args: ['--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'] });
  const pg = await b.newPage({ viewport: { width: 1280, height: 900 } }); const errs = [];
  pg.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') errs.push(m.text()); }); pg.on('pageerror', e => errs.push('pageerror ' + e.message));
  await pg.goto(process.argv[2] + '#shield/0', { waitUntil: 'networkidle' }); await pg.waitForTimeout(1500);
  const st = () => pg.evaluate(() => { const s = window.__v15stage, b = document.querySelector('.v15-tools [data-act=quality]'); return { hash: location.hash, step: s.step, hq: s.hqOn, tier: s.tier, btn: b.hidden ? 'hidden' : b.textContent, post: !!s.composer, parts: s.model.kit.parts.length, hl: document.querySelector('.v15-hl').textContent }; });
  const out = [await st()];
  await pg.click('#next'); await pg.waitForTimeout(500); await pg.click('#next'); await pg.waitForTimeout(500); out.push(await st());
  await pg.click('.v15-tools [data-act=quality]'); await pg.waitForTimeout(800); out.push(await st());
  await pg.click('.v15-tools [data-act=quality]'); await pg.waitForTimeout(800); out.push(await st());
  for (const id of ['cut-cover', 'bridge-cantilever', 'natm', 'shield']) { await pg.goto(process.argv[2] + '#' + id + '/1', { waitUntil: 'load' }); await pg.waitForTimeout(1500); out.push(await st()); }
  console.log(JSON.stringify(out, null, 0).replace(/},{/g, '},\n{')); console.log('ERRORS', errs.length, JSON.stringify(errs.slice(0, 8))); await b.close();
})();
