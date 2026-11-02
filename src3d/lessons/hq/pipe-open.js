import { THREE, smooth, lerp, roller, worker, flow, partsNamed } from './lib.js';
const D = -5, FB = -4.6, R = 0.65, PY = FB + R, ACT = -4.5, HW = 1.6;
export default {
  build(k) {
    const water = flow(k, [[10.8, D - 0.3, 0], [10.8, 0.3, -2.4], [11.6, 0.3, -4.5], [12, 0.05, -6]], 14, 0x3d9ad6, 0.06, 0.25);
    k.part(k.cyl(0.06, 5.6, [10.8, D - 0.3, -0.2], 0x5d7f99, { anchor: 'bottom', seg: 10 }), { name: '', on: 1, enter: 'fade', win: [0.86, 0.95], off: 4 });
    const tamp = roller(k, [0, 0, 0], Math.PI / 2); tamp.scale.setScalar(0.55);
    const ws = [0, 1, 2].map(i => worker(k, [0, 0, 0], 0xf2c230, 0xf08a2a, i ? Math.PI : 0));
    const fills = [FB, PY, -2.6, -1.2, 0]; const fwin = [[0.05, 0.25], [0.28, 0.45], [0.52, 0.68], [0.75, 0.95]];
    const act = partsNamed(k, '管节').find(p => p.on === 3 && p.enter === 'none')?.obj;
    k.onUpdate((s, p, t) => {
      water(t, (s === 1 && p > 0.86) || s === 2 || s === 3);
      // 第6步：分层夯实，压实机随回填层面上升
      let li = -1; fwin.forEach((w, i) => { if (s === 5 && p >= w[0] && p <= w[1] + 0.02) li = i; });
      tamp.visible = li >= 1; if (tamp.visible) { tamp.position.set(lerp(-9, 9, 0.5 + 0.5 * Math.sin(t * 0.35)), fills[li] + (fills[li + 1] - fills[li]) * smooth(p, fwin[li][0], fwin[li][1]), 0); tamp.userData.drum.rotation.z = -t * 3; }
      ws.forEach((w, i) => {
        const a = s === 2 && i < 2, b = s === 3 && p > 0.5, c = s === 5 && li === 0 && i < 2; w.visible = a || b || c;
        if (a) w.position.set(lerp(-9, 9, smooth(p, 0.1, 0.8)) + i * 1.2, FB, (i ? 0.6 : -0.6));
        if (b) w.position.set(ACT + (i - 1) * 1.6, i === 1 ? PY - R + 0.05 : FB, i === 1 ? -0.9 : 0.9);
        if (c) w.position.set(-6 + i * 8 + Math.sin(t) * 0.5, FB + 0.3, i ? 0.95 : -0.95);
        w.userData.arm.rotation.z = Math.sin(t * 3 + i) * 0.7;
      });
      void act; void HW;
    });
  },
};
