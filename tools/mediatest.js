const { chromium } = require('playwright');
(async () => { const b = await chromium.launch({ args: ['--autoplay-policy=no-user-gesture-required'] }); const p = await b.newPage();
  await p.goto('https://shizheng2027v15-core.deed.page/#cut-cover/0', { waitUntil: 'load' });
  const r = await p.evaluate(async () => { const test = (el, src) => new Promise(res => { el.src = src; el.muted = true; el.oncanplay = () => res('ok ' + (el.duration||0).toFixed(1)); el.onerror = () => res('err ' + (el.error && el.error.code)); setTimeout(() => res('timeout'), 15000); el.load(); });
    const blob = await fetch('https://shizheng2027v15-voice-a.deed.page/assets/voice-trial/bridge-cantilever-0.mp3').then(r => r.blob());
    return { audio: await test(new Audio(), 'https://shizheng2027v15-voice-a.deed.page/assets/voice-trial/bridge-cantilever-0.mp3'), blobAudio: await test(new Audio(), URL.createObjectURL(blob)), video: await test(document.createElement('video'), 'https://shizheng2027v15-video-b.deed.page/assets/videos/cut-cover.mp4') }; });
  console.log(JSON.stringify(r)); await b.close(); })();
