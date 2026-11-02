import { THREE, C, smooth, crawlerCrane, worker, flow, partsNamed, ORANGE } from './lib.js';
const YT = 10.2;
export default {
  build(k) {
    // 两台履带吊分别服务左右两个T构（吊运混凝土料斗）
    const cr = [[-16.5, -5.5, 0.35], [16.5, -5.5, Math.PI - 0.35]].map(([x, z, ry]) => crawlerCrane(k, [x, 0, z], ry, { boom: 15, angle: 1.0 }));
    const hoppers = cr.map(() => { const g = k.group(); k.cyl(0.45, 0.8, [0, 0, 0], ORANGE, { parent: g, r2: 0.45, anchor: 'top', seg: 20, rough: 0.4 }); k.cyl(0.12, 0.35, [0, -0.95, 0], 0x555a5f, { parent: g, r2: 0.45 }); return g; });
    const trav = partsNamed(k, '挂篮').map(p => p.obj); // order: pier -9 dir -1, -9 +1, 9 -1, 9 +1
    // 挂篮平台工人
    const ws = trav.map(g => worker(k, [0, 0, 0], 0xf2c230, 0xf08a2a));
    // 张拉千斤顶（预应力工序）
    const jacks = [-9, 9].map(x => { const g = k.group([x, YT - 0.15, 1.2]); k.cyl(0.18, 0.6, [0, 0, 0], 0x3e6d8c, { parent: g, axis: 'x' }); k.cyl(0.08, 0.4, [0.45, 0, 0], 0xd7dde0, { parent: g, axis: 'x', metal: 0.9 }); return g; });
    const tgt = new THREE.Vector3(), pour = (s, p) => s === 0 ? (p > 0.22 && p < 0.55) : s === 2 ? [0, 1, 2].some(j => p > 0.02 + 0.3 * j && p < 0.14 + 0.3 * j) : s === 3 ? (p > 0.38 && p < 0.6) : s === 4 ? (p > 0.12 && p < 0.35) || (p > 0.58 && p < 0.85) : false;
    k.onUpdate((s, p, t) => {
      const on = pour(s, p);
      cr.forEach((c, i) => {
        const xp = i ? 9 : -9; let x = xp;
        if (s === 2 || s === 1) { const tv = trav[i * 2 + (Math.sin(t * 0.4) > 0 ? 1 : 0)]; x = tv.position.x + (tv.scale.x) * 1.2; }
        if (s === 3) x = i ? 19.3 : -19.3; if (s === 4) x = p < 0.5 ? (i ? 17.5 : -17.5) : 0;
        c.aim(tgt.set(x, on ? YT + 0.9 : YT + 3.5, 0));
        hoppers[i].position.copy(c.hook.position).add(tgt.set(0, -0.35, 0)); hoppers[i].visible = s <= 4;
      });
      trav.forEach((g, i) => { const w = ws[i]; w.visible = g.visible && s >= 1 && s <= 2; w.position.set(g.position.x + g.scale.x * 1.0, YT, (i % 2 ? 1 : -1) * 1.0); w.userData.arm.rotation.z = Math.sin(t * 3 + i) * 0.5; });
      jacks.forEach((j, i) => { j.visible = (s === 0 && p > 0.56 && p < 0.72) || (s === 2 && [0, 1, 2].some(n => p > 0.14 + 0.3 * n && p < 0.21 + 0.3 * n)); j.children[1].position.x = 0.45 + 0.15 * Math.sin(t * 3); void i; });
    });
  },
};
