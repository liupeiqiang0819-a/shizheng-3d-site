// 现浇水池怎样建成并验水 — cast-in-place tank + water-filling test (3D)
import { COLORS as C, smooth, lerp } from '../engine.js';
import { pitGround, pitWalls } from './common.js';

const PX = 7, PZ = 5.2, BASE = -6.5, TX = 5, TZ = 3.4, WT = 0.5, FT = 0.5, BED = 0.15;
const FY = BASE + BED + 0.05, IY = FY + FT, TOP = IY + 5, WMAX = TOP - 0.6;

export default {
  cams: [
    { pos: [9, 8, 20], target: [0, -4, 0] }, { pos: [8, 6, 16], target: [0, -5.5, 0] }, { pos: [9, 6, 17], target: [0, -3.5, 0] },
    { pos: [9, 6, 17], target: [0, -3.5, 0] }, { pos: [6, 7, 15], target: [0, -3.5, 0] }, { pos: [10, 8, 20], target: [0, -3.5, 0] },
  ],
  phases: ['看开挖后的基底、周边排水和外侧地下水。', [[0, '基底 → 垫层 → 底部防水'], [0.45, '墙脚、止水及预埋件先检查']], '模板稳定，分层连续浇筑', '持续保湿；满足条件才拆模',
    [[0, '第1次注水 → 1/3 设计水深'], [0.2, '停留观测 · 相邻注水间隔另计'], [0.34, '第2次注水 → 2/3 设计水深'], [0.54, '再次停留观测 · 核外观与沉降'], [0.68, '第3次注水 → 设计水深'], [0.88, '保持满水 · 到规定时点同步读数']],
    [[0, '合格后按相应构造接续施工'], [0.5, '排水、回填与停降水均另核条件']]],
  build(k) {
    pitGround(k, { px: PX, pz: PZ, base: BASE, X: 12, Z: 9, yb: -12, hs: [1.6, 2.4, 2.6, 2.4, 3] });
    pitWalls(k, { px: PX, pz: PZ, bottom: -10, name: '基坑围护' });
    k.part(k.box([2 * PX, 0.04, 2 * PZ], [0, BASE + 0.02, 0], 0xb59a6a), { name: '基底', hl: [0] });
    for (const [x, z] of [[-PX + 0.6, -PZ + 0.6], [PX - 0.6, -PZ + 0.6], [-PX + 0.6, PZ - 0.6], [PX - 0.6, PZ - 0.6]]) k.part(k.cyl(0.22, 3, [x, BASE, z], C.blue, { anchor: 'top' }), { name: '降排水', hl: [0], front: z > 0, off: 5, exit: 'fade', outWin: [0.55, 0.8] });
    k.split((a, b) => k.zbox(24, 0.06, a, b, 0, BASE - 1.2, C.water, { opacity: 0.8, shadow: false, emissive: C.water, ei: 0.4 }), { soil: true }, -9, 9);
    // step 1: bedding, membrane, floor with starter bars and waterstop
    k.part(k.box([2 * TX + 0.6, BED, 2 * TZ + 0.6], [0, BASE, 0], 0xc9c3b4, { anchor: 'bottom' }), { name: '垫层', on: 1, enter: 'grow', axis: 'x', win: [0.02, 0.2] });
    k.part(k.box([2 * TX + 0.5, 0.05, 2 * TZ + 0.5], [0, BASE + BED, 0], C.membrane, { anchor: 'bottom' }), { name: '底部防水', on: 1, enter: 'grow', axis: 'x', win: [0.22, 0.4] });
    const bars = k.group([0, 0, 0]);
    for (let x = -TX + 0.25; x <= TX; x += 0.7) k.box([0.05, 0.05, 2 * TZ - 0.2], [x, FY + 0.15, 0], C.rebar, { parent: bars });
    for (let z = -TZ + 0.25; z <= TZ; z += 0.7) k.box([2 * TX - 0.2, 0.05, 0.05], [0, FY + 0.15, z], C.rebar, { parent: bars });
    const ring = []; for (let x = -TX + 0.25; x <= TX - 0.2; x += 0.6) ring.push([x, -TZ + WT / 2], [x, TZ - WT / 2]); for (let z = -TZ + 0.85; z <= TZ - 0.8; z += 0.6) ring.push([-TX + WT / 2, z], [TX - WT / 2, z]);
    for (const [x, z] of ring) k.box([0.05, 1.6, 0.05], [x, FY + 0.1, z], C.rebar, { parent: bars, anchor: 'bottom' });
    k.part(bars, { name: '插筋', on: 1, enter: 'fade', win: [0.42, 0.55] });
    const ws = k.group([0, 0, 0]);
    for (const z of [-TZ + WT / 2, TZ - WT / 2]) k.box([2 * TX - 0.4, 0.3, 0.04], [0, IY + 0.05, z], 0xe07b39, { parent: ws, anchor: 'bottom', emissive: 0xe07b39, ei: 0.2 });
    for (const x of [-TX + WT / 2, TX - WT / 2]) k.box([0.04, 0.3, 2 * TZ - 0.4], [x, IY + 0.05, 0], 0xe07b39, { parent: ws, anchor: 'bottom', emissive: 0xe07b39, ei: 0.2 });
    k.part(ws, { name: '止水构造', on: 1, enter: 'fade', win: [0.55, 0.65] });
    k.part(k.box([2 * TX, FT, 2 * TZ], [0, FY, 0], C.concreteNew, { anchor: 'bottom' }), { name: '底板', on: 1, enter: 'grow', win: [0.7, 0.95], hlSoft: 0.6 });
    // walls: 4 sides; front wall translucent so the inside stays readable
    const walls = [[2 * TX, TZ * 2 - WT, 0, -TZ + WT / 2, false], [2 * TX, WT, 0, TZ - WT / 2, true], [WT, 2 * TZ - 2 * WT, -TX + WT / 2, 0, false], [WT, 2 * TZ - 2 * WT, TX - WT / 2, 0, false]];
    const W = (sx, sz, x, z, front, op) => k.box([sx, TOP - IY, sz], [x, IY, z], C.concreteNew, { anchor: 'bottom', opacity: op });
    walls.forEach(([sx, sz, x, z, f]) => { const zsz = sx === 2 * TX ? WT : sz; k.part(W(sx, zsz, x, z, f, f ? 0.3 : 1), { name: '池壁', on: 2, enter: 'grow', win: [0.35, 0.95], hlSoft: 0.6 }); });
    // forms + braces (outer side) and sleeve
    const forms = k.group([0, 0, 0]);
    for (const z of [-TZ - 0.08, -TZ + WT + 0.08]) k.box([2 * TX + 0.2, TOP - IY + 0.2, 0.1], [0, IY, z], C.wood, { parent: forms, anchor: 'bottom' });
    for (const x of [-TX - 0.08, TX + 0.08]) k.box([0.1, TOP - IY + 0.2, 2 * TZ], [x, IY, 0], C.wood, { parent: forms, anchor: 'bottom' });
    for (let x = -TX + 1; x < TX; x += 2) k.rod([x, TOP - 1, -TZ - 0.1], [x, BASE + 0.2, -TZ - 2.2], 0.07, C.steel, { parent: forms });
    for (const x of [-TX - 0.1, TX + 0.1]) for (let z = -2; z <= 2; z += 2) k.rod([x, TOP - 1, z], [x + Math.sign(x) * 1.6, BASE + 0.2, z], 0.07, C.steel, { parent: forms });
    k.part(forms, { name: '模板支撑', on: 2, enter: 'fade', win: [0.02, 0.25], off: 3, exit: 'lift', outWin: [0.55, 0.8] });
    k.part(k.cyl(0.35, WT + 0.3, [TX - WT / 2, IY + 1.2, 0.8], C.steel, { axis: 'x' }), { name: '套管', on: 2, enter: 'pop', win: [0.25, 0.35] });
    const cover = k.group([0, 0, 0]);
    k.box([2 * TX + 0.3, 0.06, 2 * TZ + 0.3], [0, TOP, 0], 0xdfe9ef, { parent: cover, opacity: 0.85 });
    k.box([2 * TX + 0.3, TOP - IY, 0.04], [0, IY, -TZ - 0.05], 0xdfe9ef, { parent: cover, anchor: 'bottom', opacity: 0.5 });
    k.part(cover, { name: '养护覆盖', on: 3, enter: 'fade', win: [0.05, 0.3], off: 4, exit: 'fade', outWin: [0, 0.15] });
    // water test
    const water = k.box([2 * TX - 2 * WT - 0.02, 1, 2 * TZ - 2 * WT - 0.02], [0, IY, 0], C.water, { anchor: 'bottom', opacity: 0.55, shadow: false });
    for (const f of [1, 2, 3]) k.part(k.box([0.04, 0.04, 0.6], [-TX + WT + 0.02, IY + (WMAX - IY) * f / 3, -TZ + WT + 0.4], C.red, { emissive: C.red, ei: 0.4 }), { name: '三级水位', on: 4, enter: 'fade', win: [0, 0.1], off: 5 });
    k.part(k.cyl(0.04, WMAX - IY + 0.8, [-TX + WT + 0.25, IY, -TZ + WT + 0.25], C.steel, { anchor: 'bottom' }), { name: '水位测针', on: 4, enter: 'fade', win: [0, 0.1], off: 5 });
    const evap = k.box([0.8, 0.5, 0.8], [2.2, IY, -1], 0xf0f0ea, { anchor: 'bottom' }); k.part(evap, { name: '蒸发水箱', on: 4, enter: 'pop', win: [0.02, 0.12], off: 5 });
    // step 5: outer protection + backfill
    k.part(k.box([2 * TX + 0.12, TOP - IY, 0.06], [0, IY, -TZ - 0.03], C.membrane, { anchor: 'bottom' }), { name: '外侧保护层', on: 5, enter: 'grow', win: [0.05, 0.35] });
    for (const x of [-TX - 0.03, TX + 0.03]) k.part(k.box([0.06, TOP - IY, 2 * TZ], [x, IY, 0], C.membrane, { anchor: 'bottom' }), { name: '外侧保护层', on: 5, enter: 'grow', win: [0.05, 0.35] });
    const bf = [[-PX, -TX - 0.06, -PZ, PZ], [TX + 0.06, PX, -PZ, PZ], [-TX, TX, -PZ, -TZ - 0.06], [-TX, TX, TZ, PZ]];
    for (const [x0, x1, z0, z1] of bf) k.part(k.box([x1 - x0, -1 - BASE, z1 - z0], [(x0 + x1) / 2, BASE, (z0 + z1) / 2], 0xa98b5f, { anchor: 'bottom', flat: true }), { name: '回填', on: 5, enter: 'grow', win: [0.5, 0.9], front: z0 >= TZ, hlSoft: 0.35 });
    k.label('池水位测针', [-TX + WT + 0.25, WMAX + 1.1, -TZ + WT + 0.25], { steps: [4] });
    k.label('蒸发水箱：同步读数', [0, 1.1, 0], { steps: [4], follow: evap });
    k.label('三级目标：1/3 → 2/3 → 3/3 设计水深', [-TX, TOP + 1.2, -TZ], { steps: [4] });
    k.label('分次注水、间隔观测；无盖池扣蒸发', [0, TOP + 2.2, 0], { steps: [4], win: [0.9, 1] });
    k.onUpdate((s, p) => {
      let f = 0; if (s === 4) f = (smooth(p, 0.02, 0.18) + smooth(p, 0.36, 0.52) + smooth(p, 0.7, 0.86)) / 3; else if (s > 4) f = 1;
      water.visible = f > 0.01 && s === 4; water.scale.y = Math.max(0.01, (WMAX - IY) * f);
      evap.position.y = IY + (WMAX - IY) * f - 0.25 * (f > 0.01);
    });
  },
};
