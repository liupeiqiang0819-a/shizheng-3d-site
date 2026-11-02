import { THREE, C, smooth, lerp, crawlerCrane, grabRig, pumpTruck, mixerTruck, roller, worker, flow, partsNamed } from './lib.js';
const PX = 3.7, BASE = -9;
export default {
  build(k) {
    // 成槽机：围护墙随墙体生长下挖（第1步）
    const grab = grabRig(k, [-8.4, 0, -3.6], 0);
    // 履带吊：支撑吊装（第2、3步）
    const crane = crawlerCrane(k, [-8.0, 0, -3.4], 0, { boom: 9.5, angle: 1.0 });
    const strut = partsNamed(k, '支撑').filter(p => !p.front);
    // 泵车 + 罐车：底板、侧墙、中板、顶板浇筑
    const pump = pumpTruck(k, [4.2, 0.08, -6.4], Math.PI); const mix = mixerTruck(k, [1.0, 0.08, -6.4], Math.PI);
    const rol = roller(k, [0, 0, -2], Math.PI / 2); rol.scale.setScalar(0.8);
    const ws = [[-1.6, -2.6], [1.4, -1.4]].map(([x, z]) => worker(k, [x, BASE + 0.27, z], 0xf2c230, 0xf08a2a, x));
    // 降水：井内抽水 → 地面排水管
    k.cyl(0.07, 9.6, [-2.7 + 4.8, 0.75, -3.9], 0x5d7f99, { axis: 'x', seg: 10 });
    k.cyl(0.07, 9.0, [-7.2, 0.75, -3.9], 0x5d7f99, { axis: 'x', seg: 10 });
    const water = flow(k, [[2.7, -8, -3.9], [2.7, 0.75, -3.9], [-2.7, 0.75, -3.9], [-11.5, 0.75, -3.9]], 22, 0x3d9ad6, 0.07, 0.18);
    const v = new THREE.Vector3(), tgt = new THREE.Vector3();
    k.onUpdate((s, p, t, st) => {
      // grab
      const g0 = s === 0 && p < 0.4; grab.g.visible = g0;
      if (g0) { const d = smooth(p, 0.02, 0.35); grab.set(tgt.set(-4.0, -0.2 - 11.5 * d * (0.6 + 0.4 * Math.abs(Math.sin(t * 0.8))), -2.4 + 1.2 * Math.sin(t * 0.3)), 0.5 + 0.5 * Math.sin(t * 2.5)); } else grab.set(tgt.set(-4, 0, -2), 0, false);
      // crane hooks the strut being lowered
      crane.g.visible = s >= 1 && s <= 4 && !g0;
      let hk = null; for (const sp of strut) { if (sp.on === s && p >= sp.win[0] - 0.08 && p <= sp.win[1] + 0.03 && sp.obj.visible) { hk = sp; break; } }
      if (crane.g.visible) { if (hk) crane.aim(tgt.set(0, hk.obj.position.y + 0.3, -2.2)); else crane.aim(tgt.set(-2.0, 2.2, -2.2)); } else crane.aim(tgt.set(0, 0, 0), false);
      // pumping windows (bottom slab, walls/columns, mid slab, top slab)
      const pumpOn = (s === 3 && p > 0.58) || (s === 4 && (p < 0.2 || (p > 0.3 && p < 0.66))) || (s === 5 && p < 0.36);
      const py = s === 3 ? BASE + 0.3 + 0.7 * smooth(p, 0.6, 0.95) : s === 4 ? (p < 0.3 ? -7.5 : -4.6) : -1.4;
      pump.g.visible = mix.visible = s >= 3 && s <= 5; pump.aim(tgt.set(lerp(-2, 2, 0.5 + 0.5 * Math.sin(t * 0.5)), py, -2.2), pumpOn && pump.g.visible, t);
      mix.userData.drum.rotation.x = t * 2;
      // backfill rolling
      const rOn = s === 5 && p > 0.6 && p < 0.95; rol.visible = rOn; if (rOn) { rol.position.set(2.2 * Math.sin(t * 0.7), -0.9 + 0.9 * smooth(p, 0.6, 0.9), -2.4); rol.userData.drum.rotation.z = -t * 3; }
      ws.forEach((w, i) => { w.visible = s === 3 && p > 0.46 && p < 0.62; w.userData.arm.rotation.z = Math.sin(t * 4 + i) * 0.6; });
      water(t, (s === 0 && p > 0.55) || (s >= 1 && s <= 4));
      void st; void v;
    });
  },
};
