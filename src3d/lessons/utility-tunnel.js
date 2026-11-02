// 综合管廊怎样先建空间再容纳管线 — cut-and-cover utility tunnel with cabins (3D)
import { COLORS as C, smooth } from '../engine.js';
import { pitGround, pitWalls, lift } from './common.js';

const PX = 9, PZ = 4.2, BASE = -8, OZ = 3.4, WT = 0.45;
const FY = BASE + 0.15, FT = 0.5, IY = FY + FT, RB = IY + 3.6, RT = RB + 0.45;
const PARTS = [[-1.55, -1.25], [1.05, 1.35]], CAB = { gas: [-OZ + WT, -1.55], heat: [-1.25, 1.05], power: [1.35, OZ - WT] };
const S1 = -1.2, S2 = -4.6, TX0 = -9, TX1 = 5, TL = TX1 - TX0, CX = (TX0 + TX1) / 2;

export default {
  cams: [
    { pos: [7, 2, 17], target: [-1, -5.2, 0] }, { pos: [10, 7, 20], target: [0, -4, 0] }, { pos: [8, 4, 16], target: [0, -6.5, 0] },
    { pos: [9, 4, 16], target: [0, -5.5, 0] }, { pos: [10, 6, 19], target: [0, -4, 0] }, { pos: [12, -1.5, 9], target: [3, -5.6, -0.3] },
  ],
  phases: ['先读分舱与管线相容条件', [[0, '先形成支撑，再向下继续开挖'], [0.6, '围护形式和支撑层数按专项方案']], '底部防水、止水和预埋件先验再覆盖',
    [[0, '底板＞5MPa后搭架；墙顶连续浇筑'], [0.5, '模板、立杆、水平杆与斜撑共同支承']], [[0, '结构与防水验收合格；回填与拆撑按方案衔接'], [0.45, '两侧先均衡回填']], '支架承托；管线与附属系统分别验收'],
  build(k) {
    pitGround(k, { px: PX, pz: PZ, base: BASE, X: 12, Z: 8, yb: -12, hs: [2.2, 2.8, 3, 2, 2] });
    pitWalls(k, { px: PX, pz: PZ, bottom: -11, on: 1, win: [0.02, 0.2] });
    // step 0 ghost of the finished cross-section
    const ghost = k.group([0, 0, 0]);
    for (const [z0, z1, c] of [[...CAB.gas, C.yellow], [...CAB.heat, C.red], [...CAB.power, C.blue]]) k.zbox(TL - 0.2, RB - IY, z0, z1, CX, IY, c, { parent: ghost, anchor: 'bottom', opacity: 0.35, shadow: false });
    k.part(ghost, { name: '舱室划分', on: 0, enter: 'fade', win: [0.05, 0.4], off: 1, exit: 'fade', outWin: [0, 0.2], hl: [0], hlSoft: 0.12 });
    // excavation lifts + struts
    lift(k, PX, PZ, 0, -2.2, 1, [0.22, 0.38], C.soil1); lift(k, PX, PZ, -2.2, -5, 1, [0.5, 0.68], C.soil2); lift(k, PX, PZ, -5, BASE, 1, [0.8, 0.96], C.clay);
    const strut = (y, w, off, ow) => { const g = k.group([0, 0, 0]); for (const x of [-6, -2, 2, 6]) k.cyl(0.2, 2 * PZ, [x, y, 0], C.machine, { parent: g, axis: 'z' }); for (const z of [-PZ + 0.25, PZ - 0.25]) k.box([2 * PX, 0.45, 0.4], [0, y, z], C.steel, { parent: g }); return k.part(g, { name: '支撑', on: 1, enter: 'fade', win: w, off, exit: 'fade', outWin: ow }); };
    strut(S1, [0.4, 0.48], 4, [0.0, 0.2]); strut(S2, [0.7, 0.78], 3, [0.0, 0.15]);
    // step 2: bedding, membrane, floor
    k.part(k.zbox(TL, 0.1, -OZ - 0.3, OZ + 0.3, CX, BASE, 0xc9c3b4, { anchor: 'bottom' }), { name: '垫层', on: 2, enter: 'grow', axis: 'x', win: [0.02, 0.2] });
    k.split((a, b) => k.zbox(TL, 0.05, a, b, CX, BASE + 0.1, C.membrane, { anchor: 'bottom' }), { name: '底部防水', on: 2, enter: 'grow', axis: 'x', win: [0.22, 0.4] }, -OZ - 0.25, OZ + 0.25);
    const bars = k.group([0, 0, 0]); for (let x = TX0 + 0.3; x < TX1; x += 0.9) for (const z of [-OZ + WT / 2, PARTS[0][0] + 0.15, PARTS[1][0] + 0.15, OZ - WT / 2]) k.box([0.05, 1.3, 0.05], [x, FY + 0.1, z], C.rebar, { parent: bars, anchor: 'bottom' });
    k.part(bars, { name: '预埋件', on: 2, enter: 'fade', win: [0.42, 0.55], off: 3, exit: 'none', outWin: [0.55, 0.56] });
    k.split((a, b) => k.zbox(TL, FT, a, b, CX, FY, C.concreteNew, { anchor: 'bottom' }), { name: '底板', on: 2, enter: 'grow', win: [0.6, 0.95], hlSoft: 0.5 }, -OZ, OZ);
    // step 3: falsework, walls, roof
    const fw = k.group([0, 0, 0]);
    for (const [z0, z1] of Object.values(CAB)) { const zc = (z0 + z1) / 2; for (let x = TX0 + 0.8; x < TX1; x += 1.6) for (const dz of [-0.35, 0.35]) k.cyl(0.04, RB - IY, [x, IY, zc + dz], C.steelLight, { parent: fw, anchor: 'bottom', seg: 6 }); for (const y of [IY + 1.2, IY + 2.4]) k.box([TL - 1, 0.05, 0.05], [CX, y, zc], C.steelLight, { parent: fw }); k.box([TL - 0.4, 0.08, z1 - z0], [CX, RB - 0.08, zc], C.wood, { parent: fw }); }
    k.part(fw, { name: '满堂支架', on: 3, enter: 'grow', win: [0.02, 0.3], off: 4, exit: 'fade', outWin: [0.0, 0.2] });
    const wall = (z0, z1, front, nm) => k.part(k.zbox(TL, RB - IY, z0, z1, CX, IY, C.concreteNew, { anchor: 'bottom' }), { name: nm, on: 3, enter: 'grow', win: [0.35, 0.7], front, hlSoft: 0.5 });
    wall(-OZ, -OZ + WT, false, '侧墙'); wall(OZ - WT, OZ, true, '侧墙'); for (const [a, b] of PARTS) wall(a, b, false, '隔墙');
    k.part(k.zbox(TL, RT - RB, -OZ, 0, CX, RB, C.concreteNew, { anchor: 'bottom' }), { name: '顶板', on: 3, enter: 'grow', axis: 'x', win: [0.7, 0.95], hlSoft: 0.5 });
    k.part(k.zbox(TL, RT - RB, 0, OZ, CX, RB, C.concreteNew, { anchor: 'bottom', opacity: 0.28 }), { name: '顶板', on: 3, enter: 'grow', axis: 'x', win: [0.7, 0.95], hlSoft: 0.5 });
    // step 4: outer waterproofing + backfill
    k.part(k.zbox(TL, RT - FY, -OZ - 0.06, -OZ, CX, FY, C.membrane, { anchor: 'bottom' }), { name: '外防水', on: 4, enter: 'grow', win: [0.05, 0.3] });
    k.part(k.zbox(TL, 0.06, -OZ, 0, CX, RT, C.membrane, { anchor: 'bottom' }), { name: '外防水', on: 4, enter: 'grow', axis: 'x', win: [0.05, 0.3] });
    const layers = [[BASE, -6.2, [0.45, 0.58]], [-6.2, -4.4, [0.6, 0.72]], [-4.4, RT, [0.74, 0.84]]];
    for (const [b, t, w] of layers) { k.part(k.zbox(TL, t - b, -PZ, -OZ - 0.06, CX, b, 0xa98b5f, { anchor: 'bottom', flat: true }), { name: '回填', on: 4, enter: 'grow', win: w, hlSoft: 0.35 }); k.part(k.zbox(TL, t - b, OZ, PZ, CX, b, 0xa98b5f, { anchor: 'bottom', flat: true }), { name: '回填', on: 4, enter: 'grow', win: w, front: true }); }
    k.part(k.zbox(TL, -RT, -PZ, 0, CX, RT + 0.06, 0xa98b5f, { anchor: 'bottom', flat: true }), { name: '回填', on: 4, enter: 'grow', win: [0.86, 0.97], hlSoft: 0.35 });
    k.part(k.zbox(TL, -RT, 0, PZ, CX, RT + 0.06, 0xa98b5f, { anchor: 'bottom', flat: true }), { on: 4, enter: 'grow', win: [0.86, 0.97], front: true });
    // step 5: pipelines per cabin
    const L = TL - 0.4, gz = (CAB.gas[0] + CAB.gas[1]) / 2;
    k.part(k.cyl(0.32, L, [CX, IY + 1.6, gz], C.yellow, { axis: 'x' }), { name: '天然气管道', on: 5, enter: 'grow', axis: 'x', win: [0.05, 0.3], hlSoft: 0.4 });
    for (const x of [-7, -3, 1, 4.4]) k.part(k.box([0.15, 1.3, 0.6], [x, IY, gz], C.steel, { anchor: 'bottom' }), { name: '支架', on: 5, enter: 'pop', win: [0.0, 0.08] });
    const hz0 = CAB.heat[0] + 0.55;
    for (const [y, c] of [[IY + 2.5, C.red], [IY + 1.1, 0x5b88c0]]) { k.part(k.cyl(0.45, L, [CX, y, hz0], 0x8f979c, { axis: 'x' }), { name: '热力保温管', on: 5, enter: 'grow', axis: 'x', win: [0.3, 0.55], hlSoft: 0.4 }); k.part(k.cyl(0.47, 0.25, [TX1 - 0.25, y, hz0], c, { axis: 'x', emissive: c, ei: 0.3 }), { on: 5, enter: 'fade', win: [0.3, 0.55] }); }
    for (const x of [-7, -3, 1, 4.4]) k.part(k.box([0.15, RB - IY, 0.15], [x, IY, hz0 - 0.55], C.steel, { anchor: 'bottom' }), { name: '支架', on: 5, enter: 'pop', win: [0.0, 0.08] });
    const pz0 = CAB.power[0] + 0.12, pz1 = CAB.power[1] - 0.12;
    for (const [zz, c, nm] of [[pz0, 0x2c2c2c, '电力电缆'], [pz1, C.blue, '通信电缆']]) for (let i = 0; i < 3; i++) { const y = IY + 0.9 + i * 0.9; k.part(k.box([L, 0.05, 0.45], [CX, y, zz + (zz < 0.2 + CAB.power[0] ? 0.2 : -0.2)], C.steelLight), { name: '支架', hl: [], on: 5, enter: 'grow', axis: 'x', win: [0.55, 0.7] }); for (const d of [-0.1, 0.1]) k.part(k.cyl(0.06, L, [CX, y + 0.1, zz + (zz < 0.2 + CAB.power[0] ? 0.2 : -0.2) + d], c, { axis: 'x' }), { name: nm, on: 5, enter: 'grow', axis: 'x', win: [0.7, 0.9], hlSoft: 0.4 }); }
    k.label('天然气独立舱', [TX1 + 0.2, RB - 0.5, gz], { steps: [0, 5] });
    k.label('热力保温管；通道保留', [TX1 + 0.2, RB - 0.5, -0.1], { steps: [0, 5] });
    k.label('电力与通信分侧', [TX1 + 0.2, RB - 0.5, (CAB.power[0] + CAB.power[1]) / 2], { steps: [0, 5] });
    void smooth;
  },
};
