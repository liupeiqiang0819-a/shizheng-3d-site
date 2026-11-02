const { chromium } = require('playwright');
// 逐单元把 下一步 点到第6步再点一次 上一步，确认步号和控制台。用法：node stepwalk.js http://localhost:8000/
const B = process.argv[2] || 'http://localhost:8000/';
const IDS='cut-cover shield bridge-cantilever top-down natm bridge-pile bridge-precast pipe-trenchless pipe-open water-tank road utility-tunnel landfill sponge renewal heat-gas water-process survey-monitor management'.split(' ');
(async()=>{const b=await chromium.launch({ args: ['--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'] });
const p=await b.newPage({viewport:{width:1280,height:900}}); const errs=[]; p.on('pageerror',e=>errs.push(e.message)); p.on('console',m=>{if(m.type()==='error')errs.push(m.text())});
await p.goto(B+'#cut-cover/0',{waitUntil:'load'});await p.waitForTimeout(2000);
const res=[];
for(const id of IDS){ await p.goto(B+'#'+id+'/0',{waitUntil:'load'}); await p.waitForTimeout(800);
  let ok=true; for(let s=1;s<=5;s++){ await p.click('#next'); const g=await p.waitForFunction(h=>location.hash===h,'#'+id+'/'+s,{timeout:8000}).then(()=>1).catch(()=>0); if(!g){ok=false;break;} await p.waitForTimeout(150);} 
  await p.click('#prev'); const back=await p.waitForFunction(h=>location.hash===h,'#'+id+'/4',{timeout:8000}).then(()=>1).catch(()=>0);
  res.push(id+':'+(ok?'next1-5 ok':'FAIL '+await p.evaluate(()=>location.hash))+(back?' prev ok':' prev FAIL')); }
console.log(res.join('\n')); console.log('ERRORS',errs.length,errs.slice(0,3).join(' | ')); await b.close();})();
