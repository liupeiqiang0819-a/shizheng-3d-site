// 明挖车站怎样逐层挖撑 — 3D model. Texts: lesson data + original 3D label strings only.
import { COLORS as C, smooth, table } from '../engine.js';

const PX = 3.7, PZ = 4.7, WT = 0.6, BASE = -9, WALL_BOTTOM = -12.5, YB = -14;
const X0 = -12, X1 = 12, Z0 = -8, Z1 = 8;

export default {
  cams: [
    { pos: [9, 8, 25], target: [0, -5, -1] },
    { pos: [8, 9, 21], target: [0, -2.5, -1] },
    { pos: [8, 6, 21], target: [0, -5, -1] },
    { pos: [6, 2, 18], target: [0, -7.5, -1] },
    { pos: [7, 3, 20], target: [0, -5.5, -1] },
    { pos: [9, 8, 24], target: [0, -3.5, -1] },
  ],
  phases: [
    '围护、控水、监测先行',
    [[0, '挖到本层作业面后，及时形成支撑'], [0.5, '本层支撑达到要求，再继续向下挖土']],
    [[0, '分层下挖 · 上道支撑保留'], [0.4, '到达本层支撑位置，停挖'], [0.46, '安装支撑并核对受力条件'], [0.58, '条件满足后再向下挖 · 保护既有支撑']],
    '验基底，依次做垫层、防水与底板',
    [[0, '主体由下向上；换撑先有可靠受力交接'], [0.6, '中板达到换撑承载力后，下道撑才退出']],
    [[0, '顶板、防水验收后，对称分层回填'], [0.5, '结构与换撑条件满足后，再转入防水和回填']],
  ],
  build(k) {
    table(k, X0, X1, Z0, Z1, YB);
    const cols = [C.soil1, C.soil2, C.clay, C.soil3, C.soil4], hs = [2.2, 2.8, 3, 3, 3];
    const ox = PX + WT, oz = PZ + WT;
    const strata = (x0, x1, za, zb) => k.strata(x0, x1, YB, 0, za, zb, { colors: cols, heights: hs });
    // surrounding ground, split at z=0 so the section view shows a clean cut through the pit
    k.split((a, b) => strata(X0, -ox, a, b), { soil: true }, Z0, Z1);
    k.split((a, b) => strata(ox, X1, a, b), { soil: true }, Z0, Z1);
    k.part(strata(-ox, ox, Z0, -oz), { soil: true });
    k.part(strata(-ox, ox, oz, Z1), { soil: true, front: true });
    k.split((a, b) => k.zbox(2 * PX, BASE - YB, a, b, 0, YB, C.soil4, { anchor: 'bottom', flat: true }), { soil: true }, -PZ, PZ);
    // existing pipelines under the road, seen on the cut face
    for (const [x, y, r, c] of [[-8, -1.6, 0.38, C.steelLight], [-6.4, -1.2, 0.24, C.blue], [7.6, -1.5, 0.3, C.steelLight]])
      k.split((a, b) => k.cyl(r, b - a, [x, y, (a + b) / 2], c, { axis: 'z' }), { name: '既有管线', hl: [0] }, Z0 - 0.02, Z1 + 0.02);
    // roads + context
    k.box([X1 - X0, 0.08, 2.6], [0, 0.04, -6.4], C.asphalt, { rough: 0.9 });
    for (let x = X0 + 1; x < X1; x += 2.2) k.box([1.1, 0.02, 0.12], [x, 0.09, -6.4], C.white);
    k.part(k.box([X1 - X0, 0.08, 2.6], [0, 0.04, 6.4], C.asphalt, { rough: 0.9 }), { front: true });
    k.part(k.building([8.8, 0, -3.2], [4.6, 7.5, 4.2]), { name: '周边建筑', hl: [0] });
    k.tree([-10.5, 0, -4.6], 1.2); k.tree([-9.5, 0, -1.8], 1); k.part(k.tree([10.8, 0, 3.2], 1.1), { front: true });
    // ---- step 0: retaining walls grow down, crown beam, wells, monitoring
    const W = { name: '围护结构', on: 0, enter: 'grow', win: [0.02, 0.35] };
    for (const x of [-1, 1]) k.split((a, b) => k.zbox(WT, -WALL_BOTTOM + 0.3, a, b, x * (PX + WT / 2), 0.3, C.concrete, { anchor: 'top' }), W, -oz, oz);
    k.part(k.zbox(2 * PX, -WALL_BOTTOM + 0.3, -oz, -PZ, 0, 0.3, C.concrete, { anchor: 'top' }), W);
    k.part(k.zbox(2 * PX, -WALL_BOTTOM + 0.3, PZ, oz, 0, 0.3, C.concrete, { anchor: 'top' }), { ...W, front: true });
    const CB = { name: '围护结构', on: 0, enter: 'drop', win: [0.3, 0.42], from: 2 };
    for (const x of [-1, 1]) k.split((a, b) => k.zbox(1.0, 0.6, a, b, x * (PX + WT / 2), 0, C.concreteNew, { anchor: 'bottom' }), CB, -oz - 0.2, oz + 0.2);
    k.part(k.zbox(2 * ox, 0.6, -oz - 0.2, -PZ + 0.2, 0, 0, C.concreteNew, { anchor: 'bottom' }), CB);
    k.part(k.zbox(2 * ox, 0.6, PZ - 0.2, oz + 0.2, 0, 0, C.concreteNew, { anchor: 'bottom' }), { ...CB, front: true });
    for (const [x, z] of [[-2.7, -3.9], [2.7, -3.9], [-2.7, 2.4], [2.7, 2.4]]) {
      const w = k.group([x, 0, z]);
      k.cyl(0.14, 11.5, [0, 0.6, 0], C.steelLight, { parent: w, anchor: 'top', seg: 10 });
      k.box([0.5, 0.4, 0.5], [0, 0.6, 0], C.blue, { parent: w, anchor: 'bottom' });
      k.part(w, { name: '降水井', on: 0, enter: 'drop', win: [0.38, 0.55], from: 3, front: z > 0 });
    }
    // water table on the cut face: inside the pit it is lowered, outside it stays
    const wIn = k.box([2 * PX - 0.02, 1, 0.04], [0, YB, 0.035], C.water, { anchor: 'bottom', opacity: 0.3, shadow: false, emissive: C.water, ei: 0.3 });
    k.part(wIn, { off: 5 });
    const wLine = k.box([2 * PX - 0.02, 0.08, 0.06], [0, 0, 0.05], 0x2b8fd6, { emissive: 0x2b8fd6, ei: 0.8, shadow: false }); k.part(wLine, { name: '坑内水位', hl: [0], off: 5 });
    for (const x of [-1, 1]) k.part(k.box([X1 - ox - 0.02, -1.6 - YB, 0.04], [x * (ox + (X1 - ox) / 2), YB, 0.035], C.water, { anchor: 'bottom', opacity: 0.16, shadow: false, emissive: C.water, ei: 0.3 }), {});
    for (const x of [-1, 1]) k.box([X1 - ox - 0.02, 0.08, 0.06], [x * (ox + (X1 - ox) / 2), -1.6, 0.05], 0x2b8fd6, { emissive: 0x2b8fd6, ei: 0.8, shadow: false });
    for (const [x, y, z] of [[-5.4, 0, -2], [-5.4, 0, -4.6], [5.4, 0, -1.2], [6.45, 3, -1.0], [6.45, 6, -1.0], [-2, 0, -6.2], [2, 0, -6.2]]) {
      const g = k.group([x, y, z]); k.cyl(0.07, 0.6, [0, 0, 0], C.white, { parent: g, anchor: 'bottom', seg: 8 }); k.cyl(0.17, 0.14, [0, 0.6, 0], C.red, { parent: g, seg: 12, emissive: C.red, ei: 0.3 });
      k.part(g, { name: '监测点', on: 0, enter: 'pop', win: [0.6, 0.8] });
    }
    // ---- soil lifts inside the pit
    const L = [];
    const lift = (yt, yb, step, win) => { const col = yb > -2.3 ? C.soil1 : yb > -5 ? C.soil2 : yb > -8 ? C.clay : C.soil3; L.push(...k.split((a, b) => k.zbox(2 * PX, yt - yb, a, b, 0, yb, col, { anchor: 'bottom', flat: true }), { soil: true, off: step, exit: 'grow', outWin: win }, -PZ, PZ)); };
    lift(0, -1.5, 1, [0.03, 0.48]); lift(-1.5, -4.2, 2, [0.0, 0.38]); lift(-4.2, -6.9, 2, [0.6, 0.8]); lift(-6.9, -8.7, 2, [0.86, 0.99]); lift(-8.7, BASE, 3, [0.0, 0.16]);
    // ---- struts + walers
    const strutLevel = (y, on, win, off, outWin) => {
      for (const [zs, front] of [[[-0.9, -3.6], false], [[2.4], true]]) {
        const g = k.group([0, y, 0]);
        for (const z of zs) { k.cyl(0.24, 2 * PX - 0.5, [0, 0, z], C.steel, { parent: g, axis: 'x', metal: 0.5, rough: 0.45 }); k.cyl(0.3, 0.2, [-PX + 0.45, 0, z], C.machine, { parent: g, axis: 'x' }); }
        for (const x of [-1, 1]) k.zbox(0.36, 0.55, front ? 0 : -PZ, front ? PZ : 0, x * (PX - 0.2), 0, C.steelLight, { parent: g, metal: 0.4 });
        k.part(g, { name: '支撑', on, enter: 'drop', win, from: Math.abs(y) + 3, off, exit: 'lift', outWin, front });
      }
    };
    strutLevel(-0.9, 1, [0.52, 0.8], 5, [0.36, 0.48]);
    strutLevel(-3.6, 2, [0.42, 0.56], 4, [0.72, 0.88]);
    strutLevel(-6.4, 2, [0.8, 0.88], 4, [0.18, 0.3]);
    const ex = k.excavator([0.4, 0, -2.25], Math.PI * 0.95, 0.85); k.part(ex, { on: 1, off: 3, enter: 'none', exit: 'none', win: [0, 0.01], outWin: [0.17, 0.18] });
    const tr = k.truck([-7.5, 0.02, -6.3], 0); k.part(tr, { on: 1, off: 3, enter: 'none', exit: 'none', win: [0, 0.01], outWin: [0, 0.01] });
    k.onUpdate((s, p, t) => {
      let top = BASE; for (const l of L) if (l.visible) top = Math.max(top, l.position.y + l.geometry.parameters.height * l.scale.y);
      ex.position.y = top; k.animateExcavator(ex, t, 1); tr.position.x = -7.5 + 1.2 * Math.sin(t * 0.4);
      const lvl = s === 0 ? -1.6 + (BASE - 0.8 + 1.6) * smooth(p, 0.45, 0.9) : BASE - 0.8;
      wIn.scale.y = Math.max(0.01, lvl - YB); wLine.position.y = lvl;
    });
    // ---- base slab sequence
    const S = (o) => (a, b) => k.zbox(2 * PX, o.h, a, b, 0, o.y, o.c, { anchor: 'bottom' });
    k.split(S({ h: 0.15, y: BASE, c: C.concreteDark }), { name: '垫层', on: 3, enter: 'rise', from: 0.5, win: [0.18, 0.32] }, -PZ, PZ);
    k.split(S({ h: 0.06, y: BASE + 0.15, c: C.membrane }), { name: '防水', on: 3, enter: 'fade', win: [0.34, 0.46] }, -PZ, PZ);
    for (const [a, b, front] of [[-PZ, 0, false], [0, PZ, true]]) {
      const rebar = k.group([0, BASE + 0.45, 0]);
      for (let x = -PX + 0.3; x <= PX - 0.3; x += 0.6) k.zbox(0.05, 0.05, a + 0.15, b - 0.15, x, 0, C.rebar, { parent: rebar });
      for (let z = a + 0.3; z <= b - 0.2; z += 0.6) k.box([2 * PX - 0.3, 0.05, 0.05], [0, 0.06, z], C.rebar, { parent: rebar });
      k.part(rebar, { name: '底板', on: 3, enter: 'fade', win: [0.48, 0.58], off: 4, exit: 'none', outWin: [0, 0.01], front });
    }
    k.split(S({ h: 0.8, y: BASE + 0.21, c: C.concreteNew }), { name: '底板', on: 3, enter: 'grow', win: [0.6, 0.95] }, -PZ, PZ);
    // ---- structure from bottom up, strut replacement
    const lining = (yb, yt, on, win) => { for (const x of [-1, 1]) k.split((a, b) => k.zbox(0.5, yt - yb, a, b, x * (PX - 0.25), yb, C.concreteNew, { anchor: 'bottom' }), { name: '侧墙', on, enter: 'grow', win }, -PZ, PZ); };
    lining(BASE + 1.01, -6.7, 4, [0.0, 0.16]); lining(-6.7, -4.9, 4, [0.32, 0.46]); lining(-4.4, -1.4, 5, [0.0, 0.18]);
    for (const z of [-2.25, 2.25]) {
      k.part(k.box([0.6, 4.0, 0.6], [0, BASE + 1.01, z], C.concreteNew, { anchor: 'bottom' }), { name: '柱', on: 4, enter: 'grow', win: [0.32, 0.5], front: z > 0 });
      k.part(k.box([0.6, 3.0, 0.6], [0, -4.4, z], C.concreteNew, { anchor: 'bottom' }), { name: '柱', on: 5, enter: 'grow', win: [0.0, 0.18], front: z > 0 });
    }
    k.split((a, b) => k.zbox(2 * PX - 1, 0.5, a, b, 0, -4.9, C.concreteNew, { anchor: 'bottom' }), { name: '中板', on: 4, enter: 'drop', from: 1.2, win: [0.5, 0.64] }, -PZ, PZ);
    k.split(S({ h: 0.6, y: -2.0, c: C.concreteNew }), { name: '顶板', on: 5, enter: 'drop', from: 1.2, win: [0.18, 0.34] }, -PZ, PZ);
    k.split(S({ h: 0.06, y: -1.4, c: C.membrane }), { name: '防水', on: 5, enter: 'fade', win: [0.48, 0.56] }, -PZ, PZ);
    [[-1.34, -0.9], [-0.9, -0.45], [-0.45, 0]].forEach(([yb, yt], i) => k.split(S({ h: yt - yb, y: yb, c: i % 2 ? C.fill : C.sand }), { name: '回填', on: 5, enter: 'grow', win: [0.58 + i * 0.1, 0.66 + i * 0.1] }, -PZ, PZ));
    k.split((a, b) => k.zbox(2 * ox + 1, 0.1, a, b, 0, 0, C.asphalt, { anchor: 'bottom' }), { name: '路面', on: 5, enter: 'fade', win: [0.9, 0.99] }, -PZ - 1, PZ + 1);
    // labels (original wording)
    k.label('控水贯穿地下施工', [2.7, 1.4, -3.9], { steps: [0, 1, 2, 3, 4] });
    k.label('围护与永久主体分别保留', [0, -12.6, 0.2], { steps: [0, 3, 4, 5] });
    k.label('替代构件达到要求后，才拆对应支撑', [0, 0.9, -4], { steps: [4], win: [0.4, 1] });
  },
};
