// 供热与燃气为何要分开学 — two independent systems (3D, translucent ground)
import { THREE, COLORS as C, smooth, lerp, table } from '../engine.js';

const X0 = -10, X1 = 10, HY = -1.9, ZS = -3.1, ZR = -2.1, GY = -1.4, GZ = -0.5, FX = -6, BX = 5;
const SUP = 0xd9534f, RET = 0x3f7fc4, GAS = 0xe0b43a;

export default {
  view: { section: true, xray: true }, fitExp: 1.15,
  cams: [
    { pos: [3, 7, 17], target: [0, -1.6, -1.8] }, { pos: [1, 7, 8], target: [0, -1.9, -2.6] }, { pos: [3, 5, 13], target: [0, -1.9, -2.6] },
    { pos: [2, 3, 8], target: [0, -1.4, -0.5] }, { pos: [4, 4, 12], target: [2, -1.4, -0.5] }, { pos: [3, 7, 17], target: [0, -1.6, -1.8] },
  ],
  phases: ['供热循环与燃气输配是两套独立系统', [[0, '固定点不动；导向处允许轴向位移'], [0.45, '热伸长放大演示；选一条供热管段'], [0.75, '波纹段吸收变形，内部无刚管贯通']], [[0, '试验段隔离；压力表连接在管道上'], [0.35, '清洁水；充水排气，两个试验分别组织'], [0.7, '强度与严密性的压力、稳压判据见本步卡片']],
    [[0, '钢管焊口与外防腐层分别检查'], [0.55, '补口按检验工序完成']], [[0, '先清扫，再分开组织强度与严密性试验'], [0.4, '钢管 P≤0.8MPa 的气体强度试验'], [0.75, '严密性稳压须温压稳定与修正；不靠原始压差']], '供热具备条件后连续试运行；燃气按程序通气'],
  build(k) {
    table(k, -12, 12, -5, 5, -4);
    k.split((a, b) => k.strata(-12, 12, -4, 0, a, b, { colors: [C.soil1, C.soil2, C.soil3], heights: [1, 1.5, 1.5] }), { soil: true }, -5, 5);
    // end points: heat source / user, gas source / regulator cabinet
    k.box([1.6, 2.4, 2.4], [-11, 0, ZR - 0.5], 0xb35a4a, { anchor: 'bottom' }); k.building([11, 0, ZR - 0.5], [1.8, 3.2, 2.2]);
    k.box([0.9, 1.3, 0.9], [-11, 0, GZ + 1.2], 0x6b7378, { anchor: 'bottom' }); k.box([0.8, 1.1, 0.6], [11, 0, GZ + 1.2], GAS, { anchor: 'bottom' });
    for (const [x, z] of [[-10.6, ZS], [-10.6, ZR], [10.6, ZS], [10.6, ZR]]) k.cyl(0.2, -HY, [x, HY, z], C.steelLight, { anchor: 'bottom' });
    for (const x of [-10.6, 10.6]) k.cyl(0.14, -GY, [x, GY, GZ], C.steelLight, { anchor: 'bottom' });
    // heating pair (supply / return): pipe that expands in step 1 is the supply segment FX..BX
    const seg = k.cyl(0.26, BX - FX - 0.5, [FX, HY, ZS], SUP, { axis: 'x' }); seg.geometry.translate((BX - FX - 0.5) / 2, 0, 0); k.part(seg, { name: '供热供水', hl: [0] });
    k.part(k.cyl(0.26, FX - X0, [(X0 + FX) / 2, HY, ZS], SUP, { axis: 'x' }), { name: '供热供水', hl: [0] });
    k.part(k.cyl(0.26, X1 - BX - 0.5, [(BX + 0.5 + X1) / 2, HY, ZS], SUP, { axis: 'x' }), { name: '供热供水', hl: [0] });
    k.part(k.cyl(0.26, X1 - X0, [0, HY, ZR], RET, { axis: 'x' }), { name: '供热回水', hl: [0] });
    const bel = k.group([BX, HY, ZS]); for (let i = 0; i < 7; i++) k.cyl(0.36, 0.06, [-0.42 + i * 0.07 * 2, 0, 0], C.steelLight, { parent: bel, axis: 'x' }); k.cyl(0.3, 0.9, [0, 0, 0], C.steel, { parent: bel, axis: 'x', opacity: 0.5 });
    k.part(bel, { name: '补偿装置', hl: [1] });
    const fixed = k.box([0.8, 1.6, 2.2], [FX, HY - 0.9, (ZS + ZR) / 2], C.concreteDark, { anchor: 'bottom' }); k.part(fixed, { name: '固定支架', hl: [1] });
    for (const x of [-3, 0, 2.6]) k.part(k.box([0.3, 0.5, 1.8], [x, HY - 0.75, (ZS + ZR) / 2], C.steel, { anchor: 'bottom' }), { name: '导向支架', hl: [1] });
    const bands = [-3, 0, 2.6].map(x => k.cyl(0.29, 0.1, [x + 0.35, HY, ZS], C.white, { axis: 'x', emissive: 0xffffff, ei: 0.2 }));
    const dx = k.arrow([BX + 0.7, HY + 0.7, ZS], [-1, 0, 0], 1.1, 0xe9762b, { r: 0.05 });
    // heating test: blind plates, gauge, water
    for (const x of [-8.5, 8.5]) for (const z of [ZS, ZR]) k.part(k.cyl(0.34, 0.08, [x, HY, z], C.red, { axis: 'x', emissive: C.red, ei: 0.3 }), { name: '试验段隔离', on: 2, enter: 'pop', win: [0.05, 0.2], off: 3, exit: 'fade', outWin: [0, 0.15] });
    const gauge = k.group([-7.8, HY + 0.26, ZS]); k.cyl(0.04, 0.6, [0, 0, 0], C.steel, { parent: gauge, anchor: 'bottom' }); k.cyl(0.22, 0.08, [0, 0.75, 0], C.white, { parent: gauge, axis: 'z' }); const needle = k.box([0.02, 0.16, 0.02], [0, 0.75, 0.05], C.red, { parent: gauge, anchor: 'bottom' });
    k.part(gauge, { name: '压力表', on: 2, enter: 'pop', win: [0.2, 0.3], off: 3, exit: 'fade', outWin: [0, 0.15] });
    const fill = k.cyl(0.2, 17, [0, HY, ZS + 0.001], C.water, { axis: 'x', opacity: 0.8 }); k.part(fill, { name: '清洁水', on: 2, enter: 'grow', axis: 'x', win: [0.35, 0.65], off: 3, exit: 'fade', outWin: [0, 0.15] });
    // gas line: coated steel with bare weld zones, inspection then repair
    const gx = [-8, -4, 0, 4, 8];
    for (let i = 0; i < gx.length - 1; i++) k.part(k.cyl(0.22, gx[i + 1] - gx[i] - 0.5, [(gx[i] + gx[i + 1]) / 2, GY, GZ], GAS, { axis: 'x', rough: 0.5 }), { name: '独立的燃气系统', hl: [0] });
    k.part(k.cyl(0.22, 1.75, [-9.13, GY, GZ], GAS, { axis: 'x' }), { name: '独立的燃气系统', hl: [0] }); k.part(k.cyl(0.22, 1.75, [9.13, GY, GZ], GAS, { axis: 'x' }), { name: '独立的燃气系统', hl: [0] });
    const welds = gx.map(x => k.cyl(0.2, 0.5, [x, GY, GZ], 0x8d9399, { axis: 'x', metal: 0.5 }));
    welds.forEach(w => k.part(w, { name: '焊口', hl: [3] }));
    gx.forEach(x => k.part(k.cyl(0.23, 0.52, [x, GY, GZ], 0x2f3538, { axis: 'x' }), { name: '补口', on: 3, enter: 'fade', win: [0.65, 0.9] }));
    const det = k.group(); k.cyl(0.32, 0.18, [0, 0, 0], C.blue, { parent: det, axis: 'x', opacity: 0.8 }); k.part(det, { name: '外防腐层', on: 3, enter: 'none', win: [0, 0.01], off: 3, exit: 'none', outWin: [0.6, 0.61] });
    // gas purge + test
    const vent = k.group([9.6, GY, GZ]); k.cyl(0.08, -GY + 1.2, [0, 0, 0], C.steelLight, { parent: vent, anchor: 'bottom' }); k.part(vent, { name: '清扫', on: 4, enter: 'fade', win: [0, 0.1], off: 5 });
    const puffs = []; for (let i = 0; i < 6; i++) puffs.push(k.mesh(new THREE.SphereGeometry(0.18, 10, 8), 0xdde3e6, [0, 0, 0], { opacity: 0.7, shadow: false }));
    const ggauge = k.group([-8.8, GY + 0.22, GZ]); k.cyl(0.04, 0.6, [0, 0, 0], C.steel, { parent: ggauge, anchor: 'bottom' }); k.cyl(0.22, 0.08, [0, 0.75, 0], C.white, { parent: ggauge, axis: 'z' });
    k.part(ggauge, { name: '压力检验', on: 4, enter: 'pop', win: [0.38, 0.48], off: 5 });
    // flow arrows (step 0 & 5)
    const flowA = [];
    for (let i = 0; i < 6; i++) flowA.push({ a: k.arrow([0, 0, 0], [1, 0, 0], 0.8, SUP, { r: 0.07 }), z: ZS, y: HY + 0.55, dir: 1 });
    for (let i = 0; i < 6; i++) flowA.push({ a: k.arrow([0, 0, 0], [-1, 0, 0], 0.8, RET, { r: 0.07 }), z: ZR, y: HY + 0.55, dir: -1 });
    for (let i = 0; i < 6; i++) flowA.push({ a: k.arrow([0, 0, 0], [1, 0, 0], 0.7, GAS, { r: 0.06 }), z: GZ, y: GY + 0.45, dir: 1, gas: true });
    k.label('供热供水', [-8, HY + 1.1, ZS], { steps: [0] }); k.label('供热回水', [-4.5, HY - 0.9, ZR], { steps: [0] }); k.label('独立的燃气系统', [5.5, GY + 0.9, GZ], { steps: [0, 3, 4] });
    k.label('固定点不动；导向处允许轴向位移', [FX, HY + 1.4, ZS], { steps: [1] });
    k.label('波纹段吸收变形，内部无刚管贯通', [BX, HY + 1.4, ZS], { steps: [1], win: [0.6, 1] });
    k.label('试验段隔离；压力表连接在管道上', [-7.8, HY + 1.6, ZS], { steps: [2] });
    k.label('供热具备条件后连续试运行；燃气按程序通气', [0, 1.2, -1.5], { steps: [5] });
    const gasParts = k.parts.filter(q => ['独立的燃气系统', '焊口', '补口'].includes(q.name));
    k.onUpdate((s, p, t) => {
      if (s === 1 || s === 2) for (const q of gasParts) for (const mm of q.mats) { mm.m.transparent = true; mm.m.opacity = Math.min(mm.m.opacity, 0.18); mm.m.depthWrite = false; }
      // thermal expansion (exaggerated)
      const e = s === 1 ? smooth(p, 0.45, 0.8) * (1 - smooth(p, 0.92, 1) * 0) : 0; const d = 0.35 * e;
      seg.scale.x = 1 + d / (BX - FX - 0.5); bel.scale.x = 1 - 0.38 * e; bel.position.x = BX + d / 2;
      bands.forEach((b, i) => { b.visible = s === 1; b.position.x = [-3, 0, 2.6][i] + 0.35 + d * ([-3, 0, 2.6][i] - FX) / (BX - FX); });
      dx.visible = s === 1 && p > 0.45;
      needle.rotation.z = s === 2 ? -2.2 * smooth(p, 0.65, 0.85) : 0;
      det.position.set(lerp(-8.5, 8.5, smooth(p, 0.05, 0.6)), GY, GZ);
      puffs.forEach((m, i) => { const u = (t * 0.6 + i / puffs.length) % 1; m.visible = s === 4 && p < 0.4; m.position.set(9.6 + u * 0.6, 0.2 + u * 1.6, GZ); m.scale.setScalar(0.6 + u); });
      flowA.forEach((f, i) => { const on = s === 0 || (s === 5 && (!f.gas || p > 0.4)); f.a.visible = on; if (!on) return; const u = ((t * 0.12 + (i % 6) / 6) % 1); f.a.position.set(f.dir > 0 ? lerp(X0, X1, u) : lerp(X1, X0, u), f.y, f.z); });
    });
  },
};
