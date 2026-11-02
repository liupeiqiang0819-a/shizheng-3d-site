import { THREE, smooth, lerp, crawlerCrane, pumpTruck, mixerTruck, roller, worker, truck, partsNamed } from './lib.js';
const PZ = 4.2, BASE = -8, OZ = 3.4, FY = BASE + 0.15, IY = FY + 0.5, RB = IY + 3.6, RT = RB + 0.45, S1 = -1.2, S2 = -4.6;
export default {
  build(k) {
    const ex = k.excavator([2.5, 0, -0.6], Math.PI, 0.9); const tr = truck(k, [-4, 0, -6.4], 0);
    const crane = crawlerCrane(k, [-11, 0, -6.2], 0.5, { boom: 11, angle: 1.0, luff: true });
    const pump = pumpTruck(k, [4, 0.02, -6.4], Math.PI), mix = mixerTruck(k, [7.4, 0.02, -6.4], Math.PI);
    const tamp = roller(k, [0, 0, -3.8], 0); tamp.scale.setScalar(0.45);
    const ws = [0, 1, 2].map(i => worker(k, [0, 0, 0], 0xf2c230, 0xf08a2a, i ? Math.PI / 2 : -Math.PI / 2));
    const struts = partsNamed(k, '支撑'); const tg = new THREE.Vector3();
    const cab = [-2.5, -0.1, 2.35];
    k.onUpdate((s, p, t) => {
      // 第2步：分层开挖（挖掘机随开挖面下降）、支撑吊装
      ex.visible = s === 1; if (ex.visible) { ex.position.y = p < 0.38 ? lerp(0, -2.2, smooth(p, 0.22, 0.38)) : p < 0.68 ? lerp(-2.2, -5, smooth(p, 0.5, 0.68)) : lerp(-5, BASE, smooth(p, 0.8, 0.96)); k.animateExcavator(ex, t, 1); }
      tr.visible = s === 1;
      crane.g.visible = s === 1; let hk = null; struts.forEach((sp, i) => { if (s === 1 && p >= sp.win[0] - 0.1 && p <= sp.win[1] + 0.02) hk = i ? S2 : S1; });
      if (s === 1) crane.aim(tg.set(-2, hk ?? 1.5, -2), true);
      // 浇筑：底板（第3步）、墙与顶板（第4步）
      let on = false, y = IY; if (s === 2 && p > 0.6) { on = true; y = IY; } else if (s === 3 && p > 0.35) { on = true; y = p < 0.7 ? RB : RT; }
      pump.g.visible = mix.visible = s === 2 || s === 3; pump.aim(tg.set(lerp(-6, 3, 0.5 + 0.5 * Math.sin(t * 0.4)), y, p < 0.7 && s === 3 ? -OZ + 0.2 : -1), on, t); mix.userData.drum.rotation.x = t * 2;
      // 第5步：两侧分层回填夯实
      const fills = [[BASE, -6.2, 0.45, 0.58], [-6.2, -4.4, 0.6, 0.72], [-4.4, RT, 0.74, 0.84], [RT, 0, 0.86, 0.97]]; let f = null; fills.forEach(a => { if (s === 4 && p >= a[2] && p <= a[3] + 0.02) f = a; });
      tamp.visible = !!f; if (f) { tamp.position.set(lerp(-7, 3, 0.5 + 0.5 * Math.sin(t * 0.4)), f[0] + (f[1] - f[0]) * smooth(p, f[2], f[3]), f[1] >= RT ? -2 : -3.8); tamp.userData.drum.rotation.z = -t * 3; }
      // 工人：第3步铺防水/绑预埋；第6步舱内安装
      ws.forEach((w, i) => {
        const a = s === 2 && p > 0.22 && p < 0.58, b = s === 5; w.visible = a || b;
        if (a) w.position.set(lerp(-7, 3, smooth(p, 0.22, 0.58)) + i * 0.8, BASE + 0.15, -2 + i * 1.5);
        if (b) w.position.set(lerp(-7, 3, smooth(p, 0.05 + i * 0.25, 0.3 + i * 0.25)), IY, cab[i] + (i === 1 ? 0.6 : 0));
        w.userData.arm.rotation.z = Math.sin(t * 3 + i) * 0.7;
      });
      void PZ;
    });
  },
};
