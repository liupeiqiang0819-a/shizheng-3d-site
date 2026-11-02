import { THREE, smooth, lerp, worker, totalStation, flow, truck } from './lib.js';
const XA = -4.5, XB = 7.5, BOT = -2.2, GT = -1.62, MT = -0.8;
export default {
  build(k) {
    const ex = k.excavator([9.3, 0, -2.2], Math.PI, 0.9); const tr = truck(k, [10.5, 0, 2.6], Math.PI / 2);
    const ts = totalStation(k, [-9.5, 0.3, -3.2]); const sv = worker(k, [-10.2, 0.3, -3.0], 0xf2c230, 0xf08a2a, -0.3);
    const rod = k.group([0, 0, 0]); k.box([0.06, 2.2, 0.06], [0, 0, 0], 0xf2f2e8, { parent: rod, anchor: 'bottom' }); for (let y = 0.2; y < 2.2; y += 0.4) k.box([0.065, 0.2, 0.065], [0, y, 0], 0xd9534f, { parent: rod, anchor: 'bottom' });
    const rw = worker(k, [0, 0, 0], 0xf2c230, 0xf08a2a, Math.PI);
    const mini = k.excavator([0, 0, 0], Math.PI, 0.6);
    const gravel = flow(k, [[0, 1.4, 0], [0.6, 0.8, 0], [1.0, 0, 0]], 12, 0xa3a7a6, 0.09, 0.6);
    const ws = [0, 1, 2].map(i => worker(k, [0, 0, 0], 0xf2c230, i ? 0x3e8d5a : 0xf08a2a, i));
    const pts = [[-7, 0.3], [-5.1, 0.15], [1, BOT], [5.5, -0.25], [10, -2.6]];
    k.onUpdate((s, p, t) => {
      // 第1步：测量核高程（立尺依次到各高程点）；场地开挖
      ts.visible = sv.visible = s === 0; rod.visible = rw.visible = s === 0 && p > 0.45;
      if (rod.visible) { const i = Math.min(4, Math.floor(smooth(p, 0.45, 0.95) * 5)); const [x, y] = pts[i]; rod.position.set(x, y, -2.8); rw.position.set(x + 0.35, Math.max(y, i === 4 ? -2.6 : y), -2.6); }
      ex.visible = tr.visible = s === 0 && p < 0.5; if (ex.visible) k.animateExcavator(ex, t, 1);
      // 第3步：小型挖机摊铺砾石
      mini.visible = s === 2 && p < 0.4; if (mini.visible) { mini.position.set(lerp(XA + 0.5, XB - 1, smooth(p, 0.05, 0.35)), lerp(BOT, GT, smooth(p, 0.05, 0.35)), -2.6); k.animateExcavator(mini, t, 0.8); }
      gravel(t, false);
      // 第4步：铺介质、栽植
      ws.forEach((w, i) => { w.visible = s === 3 && p < 0.72; w.position.set(lerp(XA + 0.6, XB - 0.8, (i + 1) / 4) + Math.sin(t * 0.6 + i) * 0.3, p < 0.4 ? lerp(GT, MT, smooth(p, 0.05, 0.4)) : MT, -1.6 + i * 1.1); w.userData.arm.rotation.z = Math.sin(t * 3 + i) * 0.7; });
    });
  },
};
