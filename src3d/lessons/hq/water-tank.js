import { THREE, smooth, lerp, crawlerCrane, pumpTruck, mixerTruck, roller, worker, flow } from './lib.js';
const PX = 7, BASE = -6.5, TX = 5, TZ = 3.4, WT = 0.5, FY = BASE + 0.2, IY = FY + 0.5, TOP = IY + 5, WMAX = TOP - 0.6;
export default {
  build(k) {
    const pump = pumpTruck(k, [3, 0.02, -7.6], Math.PI), mix = mixerTruck(k, [6.6, 0.02, -7.6], Math.PI); pump.g.scale.setScalar(1.3);
    const crane = crawlerCrane(k, [-9.5, 0, -7], 0.4, { boom: 12, angle: 1.05, luff: true });
    const panel = k.box([1.6, 1.2, 0.08], [0, 0, 0], 0x8a6a3a, { round: 0.02 });
    const tamp = roller(k, [0, 0, 0], 0); tamp.scale.setScalar(0.5);
    const ws = [0, 1, 2].map(i => worker(k, [0, 0, 0], 0xf2c230, 0xf08a2a, i));
    const curing = flow(k, [[-3, TOP + 0.8, -TZ - 0.2], [-1, TOP + 0.3, -TZ + 0.3], [1, IY + 2, -TZ + 0.3]], 18, 0x7cc0e8, 0.05, 0.6);
    const fill = flow(k, [[-PX - 1.5, 0.6, -1], [-TX - 0.4, TOP + 0.3, -1], [-TX + 0.8, TOP - 0.2, -1], [-TX + 1.0, IY + 0.5, -1]], 20, 0x3d9ad6, 0.08, 0.35);
    const wpump = k.group([-PX - 1.6, 0, -1.5]); k.box([0.9, 0.6, 0.6], [0, 0, 0], 0x3e6d8c, { parent: wpump, anchor: 'bottom', round: 0.08 });
    const tg = new THREE.Vector3();
    k.onUpdate((s, p, t) => {
      // 浇筑：底板（第2步）、池壁分层连续浇筑（第3步）
      let on = false, y = FY; if (s === 1 && p > 0.7) { on = true; y = FY + 0.5; } else if (s === 2 && p > 0.35) { on = true; y = lerp(IY + 0.5, TOP, smooth(p, 0.35, 0.95)); }
      pump.g.visible = mix.visible = s === 1 || s === 2; pump.aim(tg.set(s === 1 ? lerp(-3, 3, 0.5 + 0.5 * Math.sin(t * 0.4)) : lerp(-TX, TX, 0.5 + 0.5 * Math.sin(t * 0.5)), y, s === 1 ? -1 : -TZ + WT / 2), on, t); mix.userData.drum.rotation.x = t * 2;
      // 模板吊装（第3步前段）
      const cOn = s === 2 && p < 0.32; crane.g.visible = s === 2; panel.visible = cOn;
      if (cOn) { const u = smooth(p, 0.02, 0.28); tg.set(lerp(-PX - 1, -2, u), lerp(TOP + 2, IY + 1, u), -TZ - 0.3); crane.aim(tg, true); panel.position.set(tg.x, crane.hook.position.y - 0.9, tg.z); } else if (s === 2) crane.aim(tg.set(-3, TOP + 3, -2), false);
      // 养护洒水（第4步）
      curing(t, s === 3 && p > 0.05 && p < 0.7);
      // 分次注水（第5步）
      const fOn = s === 4 && ((p > 0.02 && p < 0.18) || (p > 0.36 && p < 0.52) || (p > 0.7 && p < 0.86)); fill(t, fOn); wpump.visible = s === 4;
      // 回填夯实（第6步）
      tamp.visible = s === 5 && p > 0.5 && p < 0.92; if (tamp.visible) { tamp.position.set(lerp(-4, 4, 0.5 + 0.5 * Math.sin(t * 0.4)), lerp(BASE, -1, smooth(p, 0.5, 0.9)), -TZ - 0.9); tamp.userData.drum.rotation.z = -t * 3; }
      // 工人：防水/插筋/止水（第2步），养护（第4步），读数（第5步停留段）
      ws.forEach((w, i) => {
        const a = s === 1 && p > 0.2 && p < 0.68, b = s === 3 && p < 0.7 && i === 0, c = s === 4 && i < 2 && !fOn; w.visible = a || b || c;
        if (a) w.position.set(lerp(-4, 4, smooth(p, 0.2, 0.68)) - i * 1.5, BASE + 0.25, -1 + i);
        if (b) w.position.set(-3, TOP, -TZ - 0.25);
        if (c) w.position.set(i ? -0.5 : -TX + 0.8, i ? TOP : TOP, i ? -TZ + 0.05 : -TZ + 0.05);
        w.userData.arm.rotation.z = Math.sin(t * 3 + i) * 0.6;
      });
      void WMAX;
    });
  },
};
