// 开槽埋管怎样从地面做到地下 — open-trench pipe laying (3D)
import { THREE, COLORS as C, smooth, lerp, table } from '../engine.js';

const HW = 1.6, D = -5, FB = -4.6, R = 0.65, PY = FB + R, X0 = -12, X1 = 12, Z = 7, YB = -10;
const BND = [0, -1.2, -3.2, -5.4, YB], COLS = [C.soil1, C.soil2, C.clay, C.soil3];
const S1 = -1.0, S2 = -2.8, PIPES = [-10.5, -7.5, -4.5, -1.5, 1.5, 4.5, 7.5, 10.5], ACT = -4.5, STRUTS = [-7.5, -1.5, 4.5, 10.5];

// a block of layered soil whose origin sits at its bottom (so 'grow' exit lowers the top surface)
function layered(k, x0, x1, yt, yb, z0, z1) {
  const g = k.group([0, yb, 0]);
  for (let i = 0; i < COLS.length; i++) {
    const a = Math.min(yt, BND[i]), b = Math.max(yb, BND[i + 1]);
    if (a - b > 1e-3) k.box([x1 - x0, a - b, z1 - z0], [(x0 + x1) / 2, (a + b) / 2 - yb, (z0 + z1) / 2], COLS[i], { parent: g, flat: true, rough: 0.95 });
  }
  return g;
}

export default {
  cams: [
    { pos: [8, 9, 20], target: [0, -2.5, 0] }, { pos: [7, 5, 17], target: [0, -2.8, 0] }, { pos: [6, 3, 14], target: [0, -4, 0] },
    { pos: [5, 6, 15], target: [-3, -2.5, 0] }, { pos: [9, 4, 18], target: [0, -3.5, 0] }, { pos: [8, 5, 17], target: [0, -3, 0] },
  ],
  phases: ['既有管线：调查、探测、保护', [[0, '挖至支撑工位先支撑，再向下开挖'], [0.85, '槽内控水，保护槽底']], '验槽后形成基础，管底连续受托',
    [[0, '短管节从撑间吊入；吊具始终相连'], [0.2, '从支撑间平稳下管'], [0.6, '临近基础减速，管底落稳'], [0.82, '落稳停留 · 核连接、中心与高程']],
    '此图为闭水准备：两端封堵，沟槽未回填', [[0, '对称分层：填实管腋，再完成管顶覆盖'], [0.6, '前端保留剖面；拆撑随回填按方案衔接']]],
  build(k) {
    table(k, X0, X1, -Z, Z, YB);
    k.part(layered(k, X0, X1, 0, YB, -Z, -HW), { soil: true });
    k.part(layered(k, X0, X1, 0, YB, HW, Z), { soil: true, front: true });
    k.part(layered(k, X0, X1, D, YB, -HW, HW), { soil: true });
    // existing crossing pipeline
    k.split((a, b) => k.cyl(0.3, b - a, [6, -1.6, (a + b) / 2], C.steelLight, { axis: 'z' }), { name: '既有管线', hl: [0] }, -Z - 0.02, Z + 0.02);
    k.split((a, b) => k.zbox(0.9, 0.05, a, b, 6, 0.02, C.machine, { emissive: C.machine, ei: 0.3 }), { name: '既有管线', on: 0, enter: 'fade', win: [0.1, 0.4], off: 1, exit: 'fade', outWin: [0, 0.2] }, -Z, Z);
    // stakes on centerline + trench edge lines
    for (let x = -10; x <= 10; x += 4) k.part(k.cyl(0.07, 0.8, [x, 0, 0], C.red, { anchor: 'bottom', seg: 8, emissive: C.red, ei: 0.3 }), { name: '中线桩', on: 0, enter: 'pop', win: [0.4 + (x + 10) * 0.012, 0.5 + (x + 10) * 0.012], off: 1, exit: 'fade', outWin: [0, 0.15] });
    for (const z of [-HW, HW]) k.part(k.box([X1 - X0, 0.04, 0.12], [0, 0.02, z], C.white), { name: '沟槽边线', on: 0, enter: 'fade', win: [0.65, 0.85], off: 1, exit: 'fade', outWin: [0, 0.2], front: z > 0 });
    // excavation lifts inside the trench
    const lifts = [[0, -2, [0.02, 0.22]], [-2, -3.4, [0.36, 0.54]], [-3.4, D, [0.68, 0.86]]];
    lifts.forEach(([a, b, w]) => k.part(layered(k, X0, X1, a, b, -HW, HW), { soil: true, off: 1, exit: 'grow', outWin: w }));
    // sheeting boards, wales and struts
    const boards = [[0, -2, [0.05, 0.22]], [-2, -3.4, [0.38, 0.54]], [-3.4, D, [0.7, 0.86]]];
    for (const z of [-HW + 0.06, HW - 0.06]) boards.forEach(([a, b, w]) => k.part(k.box([X1 - X0, a - b, 0.12], [0, a, z], C.wood, { anchor: 'top' }), { name: '支撑', hl: [], on: 1, enter: 'grow', win: w, front: z > 0 }));
    const strutRow = (y, w, outW) => {
      const g = k.group([0, 0, 0]);
      for (const z of [-HW + 0.2, HW - 0.2]) k.box([X1 - X0, 0.22, 0.16], [0, y, z], C.steel, { parent: g });
      for (const x of STRUTS) k.cyl(0.11, 2 * HW - 0.4, [x, y, 0], C.machine, { parent: g, axis: 'z' });
      return k.part(g, { name: '支撑', on: 1, enter: 'fade', win: w, off: 5, exit: 'fade', outWin: outW });
    };
    strutRow(S1, [0.24, 0.34], [0.7, 0.8]); strutRow(S2, [0.56, 0.66], [0.42, 0.5]);
    k.part(k.box([X1 - X0, 0.06, 2 * HW - 0.3], [0, D + 0.03, 0], C.water, { opacity: 0.55 }), { name: '控水', on: 1, enter: 'fade', win: [0.86, 0.95], off: 2, exit: 'fade', outWin: [0, 0.2] });
    k.part(k.cyl(0.4, 0.6, [10.8, D - 0.6, 0], C.water, { anchor: 'bottom', opacity: 0.7 }), { name: '控水', on: 1, enter: 'fade', win: [0.86, 0.95], off: 4 });
    k.part(k.box([0.6, 0.5, 0.6], [10.8, 0, -2.4], C.blue, { anchor: 'bottom' }), { name: '控水', on: 1, enter: 'pop', win: [0.86, 0.95], off: 4 });
    const ex = k.excavator([5, 0, -3.4], -Math.PI / 2, 1.3); k.part(ex, { name: '挖掘机', on: 1, enter: 'fade', win: [0, 0.05], off: 2, exit: 'fade', outWin: [0, 0.2] });
    const tr = k.truck([-4, 0, -4.8]); k.part(tr, { on: 1, enter: 'fade', win: [0, 0.05], off: 2, exit: 'fade', outWin: [0, 0.2] });
    // foundation
    k.part(k.box([X1 - X0, FB - D, 2 * HW - 0.3], [0, D, 0], 0xd9c79a, { anchor: 'bottom', rough: 1 }), { name: '管道基础', on: 2, enter: 'grow', axis: 'x', win: [0.1, 0.8] });
    // pipes
    const pipes = PIPES.map(x => { const g = k.group([x, PY, 0]); k.cyl(R, 2.9, [0, 0, 0], C.concreteNew, { parent: g, axis: 'x', seg: 28 }); k.cyl(R + 0.06, 0.3, [1.3, 0, 0], C.concrete, { parent: g, axis: 'x', seg: 28 }); return g; });
    pipes.forEach((g, i) => { const x = PIPES[i];
      if (x < ACT) k.part(g, { name: '管节', on: 3, enter: 'drop', from: 4, win: [0.0, 0.12] });
      else if (x === ACT) k.part(g, { name: '管节', on: 3, enter: 'none', win: [0, 0.01] });
      else k.part(g, { name: '管节', on: 4, enter: 'drop', from: 4, win: [0.02 + (i - 3) * 0.04, 0.12 + (i - 3) * 0.04], hl: [] }); });
    const act = pipes[PIPES.indexOf(ACT)];
    const cr = k.crane([ACT, 0, -5.4], -Math.PI / 2, 7, 6); k.part(cr, { name: '吊装', on: 3, enter: 'fade', win: [0, 0.08], off: 4, exit: 'fade', outWin: [0, 0.2] });
    const cable = k.cyl(0.03, 1, [0, 0, 0], 0x333333, { seg: 6 }); cable.geometry.translate(0, -0.5, 0);
    const slings = [-1, 1].map(() => { const m = k.cyl(0.025, 1, [0, 0, 0], 0x333333, { seg: 6 }); m.geometry.translate(0, 0.5, 0); return m; });
    // closed-water test prep
    for (const x of [X0 + 0.05, X1 - 0.05]) k.part(k.cyl(R + 0.05, 0.18, [x, PY, 0], C.red, { axis: 'x', emissive: C.red, ei: 0.3 }), { name: '两端封堵', on: 4, enter: 'pop', win: [0.45, 0.6], off: 5, exit: 'fade', outWin: [0, 0.15] });
    k.part(k.cyl(0.12, -PY + 1.2, [X0 + 0.6, PY, 0], C.steelLight, { anchor: 'bottom', opacity: 0.6 }), { name: '水头', on: 4, enter: 'fade', win: [0.6, 0.7], off: 5, exit: 'fade', outWin: [0, 0.15] });
    k.part(k.cyl(0.09, -PY + 0.8, [X0 + 0.6, PY, 0], C.water, { anchor: 'bottom' }), { name: '水头', on: 4, enter: 'grow', win: [0.7, 0.9], off: 5, exit: 'fade', outWin: [0, 0.15] });
    // backfill in layers
    const fills = [[FB, PY, [0.05, 0.25]], [PY, -2.6, [0.28, 0.45]], [-2.6, -1.2, [0.52, 0.68]], [-1.2, 0, [0.75, 0.95]]];
    fills.forEach(([b, t, w], i) => k.split((za, zb) => k.zbox(X1 - X0, t - b, za, zb, 0, b, i < 2 ? 0xc6ae7f : 0xa98b5f, { anchor: 'bottom', flat: true }), { name: '回填', on: 5, enter: 'grow', win: w, hlSoft: 0.35 }, -HW + 0.12, HW - 0.12));
    k.label('落稳、连接、复测后再解除吊具', [ACT, 1.6, 0], { steps: [3], win: [0.82, 1] });
    k.label('既有管线：调查、探测、保护', [6, 0.9, 1.5], { steps: [0] });
    const up = new THREE.Vector3(0, 1, 0), v = new THREE.Vector3();
    const span = (m, a, b) => { const d = v.subVectors(b, a); m.position.copy(a); m.scale.set(1, Math.max(0.01, d.length()), 1); m.quaternion.setFromUnitVectors(up, d.clone().normalize()); };
    k.onUpdate((s, p, t) => {
      if (s === 1) k.animateExcavator(ex, t, 1);
      // active pipe lowering: fast through the struts, slowing near the foundation
      let y = PY; if (s < 3) y = PY; else if (s === 3) { const a = smooth(p, 0.05, 0.55), b = smooth(p, 0.6, 0.82); y = lerp(lerp(3.2, PY + 1.1, a), PY, b); }
      if (s === 3) act.position.y = y;
      const on = s === 3; cable.visible = on; slings.forEach(m => m.visible = on);
      if (on) { const top = new THREE.Vector3(ACT, 7.5, 0), hook = new THREE.Vector3(ACT, y + 1.6, 0);
        cable.position.copy(top); cable.scale.set(1, top.y - hook.y, 1); cable.quaternion.identity();
        [-1, 1].forEach((d, i) => span(slings[i], new THREE.Vector3(ACT + d * 1.0, y + R, 0), hook)); }
    });
  },
};
