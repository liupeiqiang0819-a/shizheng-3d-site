// 道路怎样一层层建起来 — road layers (3D)
import { THREE, COLORS as C, smooth, lerp, table } from '../engine.js';

const X0 = -12, X1 = 12, L = X1 - X0;
// prism along x from a (z,y) polygon (z>=0 half or z<=0 half), origin at x=X0 so 'grow' on x spreads from the start
function prism(k, pts, color, o = {}) {
  const s = new THREE.Shape(pts.map(([z, y]) => new THREE.Vector2(-z, y)));
  const g = new THREE.ExtrudeGeometry(s, { depth: L, bevelEnabled: false }); g.rotateY(Math.PI / 2);
  return k.mesh(g, color, [X0, 0, 0], { flat: true, rough: 0.95, ...o });
}
// symmetric layer: half-width bottom wb, top wt, y0..y1; returns [back, front]
function layer(k, wb, wt, y0, y1, color, opts, o = {}) {
  const back = prism(k, [[-wb, y0], [0, y0], [0, y1], [-wt, y1]], color, o);
  const front = prism(k, [[0, y0], [wb, y0], [wt, y1], [0, y1]], color, o);
  k.part(back, opts); k.part(front, { ...opts, front: true }); return [back, front];
}
function roller(k) { const g = k.group([0, 0, 0]); k.cyl(0.55, 2.2, [0.9, 0.55, 0], C.steel, { parent: g, axis: 'z' }); k.box([1.8, 0.8, 1.6], [-0.4, 0.5, 0], C.machine, { parent: g, anchor: 'bottom' }); k.box([0.8, 0.7, 1.2], [-0.6, 1.3, 0], C.glass, { parent: g, anchor: 'bottom', opacity: 0.7 }); for (const z of [-0.7, 0.7]) k.cyl(0.45, 0.4, [-1.0, 0.45, z], 0x222222, { parent: g, axis: 'z' }); return g; }
function paver(k) { const g = k.group([0, 0, 0]); k.box([2.4, 1.0, 3.0], [0, 0.3, 0], C.machine, { parent: g, anchor: 'bottom' }); k.box([1.2, 0.6, 3.2], [1.2, 1.0, 0], C.machineDark, { parent: g, anchor: 'bottom' }); k.box([0.9, 0.9, 1.4], [-0.5, 1.3, 0], C.glass, { parent: g, anchor: 'bottom', opacity: 0.7 }); const sc = k.box([0.5, 0.35, 8.6], [-1.5, 0.05, 0], C.steel, { parent: g, anchor: 'bottom' }); g.userData.screed = sc; return g; }

export default {
  cams: [
    { pos: [6, 9, 17], target: [0, 0, -1] }, { pos: [5, 7, 12], target: [-1, 0.8, 0] }, { pos: [5, 7, 12], target: [0, 1.8, 0] },
    { pos: [5, 7, 12], target: [0, 2.2, 0] }, { pos: [4, 6, 11], target: [0, 2.3, 0] }, { pos: [5, 7, 12], target: [0, 2.4, 0] },
  ],
  phases: [[[0, '先探明既有设施，再按方案清障'], [0.7, '测量控制桩']], '每层铺筑 → 压实检验 → 再填上层', '摊铺机铺料，压路机随后压实',
    [[0, '表面稍干、尚未硬化时宜及时喷透层'], [0.8, '基层养护与透层油养护分别满足条件']], [[0, '先预热熨平板；≥100℃指板温'], [0.25, '普通热拌沥青连续摊铺；勿套改性温度']],
    [[0, '初压 → 复压 → 终压；机具组合按方案'], [0.75, '自然降温至表面＜50℃，并满足验收条件']]],
  build(k) {
    table(k, X0, X1, -9, 9, -5);
    k.split((a, b) => k.strata(X0, X1, -5, 0, a, b, { colors: [C.soil1, C.soil2, C.soil3], heights: [1.2, 1.8, 2] }), { soil: true }, -9, 9);
    for (const z of [-8.5, 8.5]) k.part(k.box([L, 0.06, 1], [0, 0, z], C.grass, { anchor: 'bottom' }), { front: z > 0 });
    for (const z of [-7.2, 7.2]) k.part(k.box([L, 0.12, 0.6], [0, -0.12, z], C.water, { anchor: 'bottom', opacity: 0.7 }), { name: '排水', hl: [0], front: z > 0 });
    k.split((a, b) => k.cyl(0.3, b - a, [5, -1.5, (a + b) / 2], C.steelLight, { axis: 'z' }), { name: '既有设施', hl: [0] }, -9, 9);
    // obstacles cleared
    const obs = k.group([0, 0, 0]); for (const [x, z] of [[-7, -2], [-2, -4], [3, -3.5], [8, -1.5], [-9, -5]]) obs.add(k.tree([x, 0, z], 1.1)); k.box([1.2, 0.6, 0.9], [0, 0, -1], 0x8a8f8c, { parent: obs, anchor: 'bottom' });
    k.part(obs, { off: 0, exit: 'fade', outWin: [0.35, 0.65] });
    for (const x of [-10, -4, 2, 8]) for (const z of [-6.8, 6.8]) k.part(k.cyl(0.07, 0.9, [x, 0, z], C.red, { anchor: 'bottom', seg: 8, emissive: C.red, ei: 0.3 }), { name: '测量控制桩', on: 0, enter: 'pop', win: [0.65, 0.85], off: 1, exit: 'fade', outWin: [0, 0.2], front: z > 0 });
    // subgrade lifts
    const lifts = [[6.6, 6.0, 0, 0.6, [0.02, 0.18]], [6.0, 5.4, 0.6, 1.2, [0.36, 0.52]], [5.4, 4.8, 1.2, 1.8, [0.68, 0.84]]];
    lifts.forEach(([wb, wt, y0, y1, w], i) => layer(k, wb, wt, y0, y1, [0xb9925f, 0xc29d6a, 0xcaa775][i], { name: '路基', on: 1, enter: 'grow', axis: 'x', win: w, hlSoft: 0.3 }));
    layer(k, 4.8, 4.5, 1.8, 2.3, 0x9c9fa1, { name: '基层', on: 2, enter: 'grow', axis: 'x', win: [0.05, 0.75], hlSoft: 0.28 });
    layer(k, 4.5, 4.5, 2.3, 2.34, 0x5a3b22, { name: '透层', on: 3, enter: 'grow', axis: 'x', win: [0.08, 0.78] });
    layer(k, 4.4, 4.2, 2.34, 2.7, 0x2b2d2f, { name: '沥青层', on: 4, enter: 'grow', axis: 'x', win: [0.25, 0.92], hlSoft: 0.28 }, { rough: 0.7 });
    const R = roller(k), P = paver(k), T = k.truck([0, 0, 0], 0, C.machine);
    const cones = k.group([0, 0, 0]); for (const x of [-11.5, 11.5]) for (const z of [-3, -1, 1, 3]) k.mesh(new THREE.ConeGeometry(0.22, 0.6, 10), 0xe86a2c, [x, 2.64, z], { parent: cones });
    k.part(cones, { name: '封闭交通', on: 3, enter: 'pop', win: [0.0, 0.1], off: 4, exit: 'fade', outWin: [0, 0.15] });
    const car = k.group([0, 2.7, -2]); k.box([1.6, 0.45, 0.8], [0, 0.15, 0], 0x4d7fb8, { parent: car, anchor: 'bottom' }); k.box([0.9, 0.35, 0.72], [-0.1, 0.6, 0], 0xdfe8ee, { parent: car, anchor: 'bottom' });
    k.label('薄透层', [-6, 2.7, 4.6], { steps: [3], win: [0.4, 1] });
    k.onUpdate((s, p, t) => {
      const sweep = (a, b, dir = 1) => { const u = smooth(p, a, b); return dir > 0 ? lerp(X0 + 1, X1 - 1, u) : lerp(X1 - 1, X0 + 1, u); };
      R.visible = P.visible = T.visible = false; car.visible = false; P.userData.screed.material.emissive.setHex(0); 
      if (s === 1) { R.visible = true; const w = [[0.2, 0.32], [0.52, 0.64], [0.84, 0.96]]; const top = [0.6, 1.2, 1.8];
        let idx = w.findIndex(([a, b]) => p < b + 0.03); if (idx < 0) idx = 2; R.position.set(sweep(w[idx][0], w[idx][1], idx % 2 ? -1 : 1), top[idx], -1.5); R.rotation.y = idx % 2 ? Math.PI : 0; }
      if (s === 2) { P.visible = R.visible = true; const xf = lerp(X0, X1, smooth(p, 0.05, 0.75)); P.position.set(xf + 1.6, 1.8, 0); R.position.set(Math.max(X0 + 1, xf - 3.5 - 4 * smooth(p, 0.75, 1)), 2.3, -1.6); }
      if (s === 3) { T.visible = true; T.position.set(lerp(X0, X1, smooth(p, 0.08, 0.78)) + 1.3, 2.34, -1); }
      if (s === 4) { P.visible = true; const xf = lerp(X0, X1, smooth(p, 0.25, 0.92)); P.position.set(xf + 1.6, 2.34, 0); if (p < 0.3) { P.userData.screed.material.emissive.setHex(0xd9534f); P.userData.screed.material.emissiveIntensity = 0.4 + 0.3 * Math.sin(t * 5); } }
      if (s === 5) { R.visible = p < 0.75; const w = [[0.02, 0.24], [0.26, 0.48], [0.5, 0.72]]; let idx = w.findIndex(([a, b]) => p < b + 0.01); if (idx < 0) idx = 2;
        R.position.set(sweep(w[idx][0], w[idx][1], idx % 2 ? -1 : 1), 2.7, [-1.6, 0.4, -0.6][idx]); R.rotation.y = idx % 2 ? Math.PI : 0;
        car.visible = p > 0.9; car.position.x = lerp(X0 + 1, X1 - 2, smooth(p, 0.9, 1)); }
    });
  },
};
