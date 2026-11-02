const { chromium } = require('playwright');
(async () => {
  const [,, base, outDir, ...targets] = process.argv;
  const browser = await chromium.launch({ args: ['--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'] });
  const fs=require('fs'); fs.mkdirSync(outDir,{recursive:true});
  const errors=[];
  for (const t of targets) {
    const [name, hash, w, prog, extra] = t.split('|');
    const width=+w, mobile = width<500;
    const ctx = await browser.newContext({ viewport:{width, height: mobile?844:900}, deviceScaleFactor: mobile?2:1, isMobile:mobile, hasTouch:mobile });
    const page = await ctx.newPage();
    page.on('console', m => { if (m.type()==='error'||m.type()==='warning') errors.push(`[${name}] ${m.type()}: ${m.text()}`); });
    page.on('pageerror', e => errors.push(`[${name}] pageerror: ${e.message}`));
    await page.addInitScript(() => { try{localStorage.setItem('shizheng-recall-v1', JSON.stringify({}));}catch(e){} });
    if (process.env.INIT) await page.addInitScript(process.env.INIT);
    await page.goto(base + '#' + hash, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1200);
    // dismiss review gate if present
    const cont = await page.$('#continueCourse'); if (cont && await cont.isVisible()) await cont.click();
    if (prog) { await page.evaluate(p => { const r=document.getElementById('motionProgress'); r.value=String(p); r.dispatchEvent(new Event('input',{bubbles:true})); }, +prog); }
    if (extra) await page.evaluate(extra);
    await page.waitForTimeout(1500);
    const el = await page.$(process.env.SEL || '.player');
    if (el) { await page.evaluate(s => document.querySelector(s).scrollIntoView({block:'center'}), process.env.SEL || '.player'); await page.evaluate(() => { window.__v15freeze = true; }); await page.waitForTimeout(800); const bb = await el.boundingBox(); if (bb && bb.width) await page.screenshot({ path: `${outDir}/${name}.png`, clip: bb, timeout: 120000 }); }
    await page.screenshot({ path: `${outDir}/${name}-page.png`, timeout: 120000 });
    await page.evaluate(() => { window.__v15freeze = false; });
    const info = await page.evaluate(() => ({ calls: (()=>{try{return document.querySelector('.v15-stage')?'v15':'orig'}catch(e){return ''}})(), view3d: document.getElementById('view3d')?.getAttribute('aria-pressed'), canvas: !!document.querySelector('#spatialHost canvas'), svg3d: !!document.querySelector('#spatialHost svg') }));
    const perf = await page.evaluate(() => new Promise(r => { let n = 0; const t0 = performance.now(); const f = () => { if (++n < 20) requestAnimationFrame(f); else r(((performance.now() - t0) / 20).toFixed(1)); }; requestAnimationFrame(f); }));
    console.log(name, JSON.stringify(info), 'ms/frame', perf);
    await ctx.close();
  }
  console.log('ERRORS:', errors.length); errors.forEach(e=>console.log(e));
  await browser.close();
})();
