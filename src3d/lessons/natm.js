// 浅埋暗挖怎样边挖边支护 — upper-bench ring excavation with core soil (3D, longitudinal cut)
import { COLORS as C, smooth, table, boredStrata } from '../engine.js';

const CY = -7, R = 3, X0 = -12, F0 = -4, F1 = 0, XE = 8;
const BK = [[0, Math.PI / 2], [Math.PI / 2, Math.PI]], LO = [[-Math.PI / 2, 0], [Math.PI, Math.PI * 1.5]];

export default {
  cams: [
    { pos: [8, 0, 12], target: [-1.5, -5.5, 0] }, { pos: [8, -2, 11], target: [-2, -6.5, 0] }, { pos: [7, -2, 11], target: [-2.5, -6.5, 0] },
    { pos: [8, -3, 11], target: [-2.5, -7, 0] }, { pos: [6, -3, 15], target: [-5, -7, 0] }, { pos: [6, -2, 15], target: [-5, -7, 0] },
  ],
  phases: ['从已成钢架向前打设小导管，先注浆加固', '只开环形小分部，核心土和下台阶继续保留', '拱部钢架、网与喷层跟上，拱脚可靠支承', '先核心土，再下台阶；下部初支紧跟闭环', '初支趋稳后，依次处理基面与连续防水', '二衬先下部、后拱部，两侧对称连续浇筑'],
  build(k) {
    table(k, X0, XE, -6, 6, -14);
    const cols = [C.soil1, C.soil2, C.clay, C.soil3], hs = [2, 2.5, 4, 5.5];
    for (const side of [-1, 1]) {
      const o = { soil: true, front: side > 0 };
      for (const [a, b, r] of [[X0, F0, R], [F0, F1, R + 0.7], [F1, XE, 0]]) { const g = k.group(); boredStrata(k, a, b, side, 6, -14, 0, r ? { cy: CY, r } : null, cols, hs, g); k.part(g, o); }
    }
    // surface: road + buildings
    k.box([20, 0.08, 3], [-2, 0.04, -3.5], C.asphalt); k.building([3, 0, -5], [3, 5, 1.8]); k.tree([-9, 0, -5]); k.part(k.tree([-6, 0, 4], 1.1), { front: true });
    const ringP = (ri, ro, x0, x1, ang, color, opts, o2 = {}) => ang.map(([a0, a1], j) => k.part(k.ring(ri, ro, x1 - x0, [(x0 + x1) / 2, CY, 0], color, { axis: 'x', a0, a1, ...o2 }), { ...opts, front: j === 1 }));
    // existing supported tunnel behind the face
    ringP(R - 0.35, R, X0, F0, [[-Math.PI / 2, Math.PI / 2], [Math.PI / 2, Math.PI * 1.5]], C.concrete, { name: '初支' , hl: [] });
    const arch = (x, ang, opts) => ang.forEach(([a0, a1], j) => k.part(k.ring(R - 0.3, R - 0.05, 0.14, [x, CY, 0], C.steel, { axis: 'x', a0, a1, metal: 0.5 }), { ...opts, front: j === 1 }));
    for (let x = X0 + 0.5; x < F0; x += 0.75) arch(x, [[-Math.PI / 2, Math.PI / 2], [Math.PI / 2, Math.PI * 1.5]], {});
    // step 0: advance pipes + grouted ring
    ringP(R, R + 0.7, F0, F1, BK, C.soil2, { soil: true, off: 0, exit: 'fade', outWin: [0.5, 0.8] });
    ringP(R, R + 0.7, F0, F1, BK, 0x9aa3a8, { name: '注浆加固', on: 0, enter: 'fade', win: [0.5, 0.8] }, { opacity: 0.55 });
    ringP(R, R + 0.7, F0, F1, LO, C.soil3, { soil: true });
    for (let i = 0; i < 9; i++) {
      const a = (10 + i * 20) * Math.PI / 180; const y = Math.sin(a), z = -Math.cos(a);
      k.part(k.rod([F0 - 0.4, CY + y * (R + 0.05), z * (R + 0.05)], [F1 + 1.4, CY + y * (R + 0.75), z * (R + 0.75)], 0.06, C.machine), { name: '小导管', on: 0, enter: 'grow', axis: 'y', win: [0.05, 0.45], front: z > 0.01 });
    }
    // cycle soil: upper ring, core, lower bench
    ringP(1.7, R, F0, F1, BK, C.soil2, { soil: true, off: 1, exit: 'grow', outWin: [0.1, 0.8] }).forEach(m => { m.userData.ax = 'x'; });
    const core = ringP(0.01, 1.7, F0, F1, BK, C.clay, { soil: true, name: '核心土', hl: [1], off: 3, exit: 'fade', outWin: [0.05, 0.3] });
    const lower = ringP(0.01, R, F0, F1, LO, C.soil3, { soil: true, off: 3, exit: 'fade', outWin: [0.35, 0.62] });
    void core; void lower;
    // step 2: arches + mesh + shotcrete (upper), step 3: lower closes the ring
    for (let x = F0 + 0.4; x < F1; x += 0.75) { arch(x, BK, { name: '钢架', on: 2, enter: 'drop', from: 1.2, win: [0.17, 0.36] }); arch(x, LO, { name: '钢架', on: 3, enter: 'rise', from: 1.2, win: [0.65, 0.8] }); }
    ringP(R - 0.33, R - 0.3, F0, F1, BK, 0x6b5a4b, { name: '钢筋网', on: 2, enter: 'fade', win: [0.37, 0.5] }, { opacity: 0.6 });
    // 喷射混凝土：开挖后初喷薄层 → 钢架挂网 → 复喷：先填钢格栅与围岩之间，再喷格栅之间；每层由拱脚向拱顶分片自下而上
    ringP(R - 0.06, R, F0, F1, BK, 0xb7bbb3, { name: '喷射混凝土', on: 2, enter: 'fade', win: [0.02, 0.14] });
    const NS = 4, sl = (i, side) => side ? [Math.PI - (i + 1) * Math.PI / 2 / NS, Math.PI - i * Math.PI / 2 / NS] : [i * Math.PI / 2 / NS, (i + 1) * Math.PI / 2 / NS];
    for (const [ri, ro, w0, w1] of [[R - 0.18, R - 0.06, 0.53, 0.71], [R - 0.35, R - 0.18, 0.72, 0.9]]) for (let i = 0; i < NS; i++) {
      const a = w0 + (w1 - w0) * i / NS, b = w0 + (w1 - w0) * (i + 1) / NS;
      ringP(ri, ro, F0, F1, [sl(i, 0), sl(i, 1)], C.concreteNew, { name: '喷射混凝土', on: 2, enter: 'fade', win: [a, b] });
    }
    ringP(R - 0.35, R, F0, F1, LO, C.concreteNew, { name: '初支', on: 3, enter: 'fade', win: [0.8, 0.97] });
    // step 4: waterproofing sweeps along; step 5 secondary lining
    const wp = ringP(R - 0.45, R - 0.35, X0, F1, [[-Math.PI / 2, Math.PI / 2], [Math.PI / 2, Math.PI * 1.5]], C.membrane, { name: '防水板', on: 4, enter: 'grow', win: [0.1, 0.85] });
    const lin = ringP(R - 1.05, R - 0.45, X0, F1, [[-Math.PI / 2, Math.PI / 2], [Math.PI / 2, Math.PI * 1.5]], 0xcfd3cc, { name: '二衬', on: 5, enter: 'grow', win: [0.1, 0.9] });
    [...wp, ...lin].forEach(m => { m.geometry.translate((F1 - X0) / 2, 0, 0); m.position.x = X0; });
    for (const x of [-9, -6, -3]) k.part(k.ring(R - 0.47, R - 0.33, 0.12, [x, CY, 0], C.machine, { axis: 'x', a0: -Math.PI / 2, a1: Math.PI / 2 }), { name: '搭接', on: 4, enter: 'pop', win: [0.8, 0.95] });
    // lining trolley
    const tr = k.group([X0 + 2, CY, 0]);
    k.box([3, 0.25, 2.6], [0, -1.6, 0], C.steel, { parent: tr }); for (const z of [-1.1, 1.1]) k.box([3, 2.5, 0.2], [0, -0.3, z], C.machine, { parent: tr });
    k.part(tr, { name: '台车', on: 5, enter: 'fade', win: [0, 0.08] });
    k.onUpdate((s, p) => { tr.position.x = s === 5 ? X0 + 1.5 + (F1 - X0 - 3) * smooth(p, 0.1, 0.9) : X0 + 2; });
    // parts' parts restored after part() captured base: fix base for translated meshes
    [...wp, ...lin].forEach(m => { const part = k.parts.find(p => p.obj === m); part.base.pos.copy(m.position); });
    k.label('前方未开挖地层', [5, -7, 0], { steps: [0, 1, 2] });
    k.label('核心土留坡，不得反坡', [-1.5, -5.6, 0], { steps: [1, 2] });
    k.label('下台阶土体尚未开挖', [-2, -9, 0], { steps: [1, 2] });
    k.label('养护、拆模及背后注浆另按条件衔接', [-6, -2.6, 0], { steps: [5], win: [0.6, 1] });
  },
};
