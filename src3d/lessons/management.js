// 让各道工序有准备、有检查、有交接 — site organisation and inspection flow (3D)
import { THREE, COLORS as C, smooth, lerp } from '../engine.js';
import { person } from './common.js';

const W = ['看场内作业面、材料区与运输通道怎样安排。', '看管理人员拿方案讲解，再把要求传到作业面。', '看待验区与可用材料区分开，未验材料不直接入模。', '看浇筑前钢筋和预埋件仍可见，检查伴随实体施工。', '看实体检查点与整改复查，验收范围随工程层次变化。', '看建成构筑物、验收人员和与实体对应的竣工资料。'];
const SX = 2, SZ = -1; // structure centre

export default {
  cams: [
    { pos: [3, 15, 17], target: [0, 0, -1] }, { pos: [-1, 6, 11], target: [-2.5, 0.8, 1] }, { pos: [-6, 7, 11], target: [-7, 0.5, 2] },
    { pos: [6, 6, 9], target: [SX, 1, SZ] }, { pos: [7, 7, 11], target: [SX, 1.5, SZ] }, { pos: [6, 8, 14], target: [SX, 1.5, SZ] },
  ],
  phases: W,
  build(k) {
    k.box([28, 0.4, 18], [0, -0.2, 0], 0xcfc6b0, { rough: 1 }); k.box([28.4, 0.25, 18.4], [0, -0.52, 0], 0x9fb3a8);
    const zone = (x, z, w, d, col, nm, steps) => k.part(k.box([w, 0.04, d], [x, 0.02, z], col, { opacity: 0.85 }), { name: nm, hl: steps });
    zone(SX, SZ, 8, 6, 0xb7a27a, '作业面', [0]); zone(-8, 2, 6, 6, 0xd8d2c0, '材料区', [0]); zone(0, 6.2, 26, 2.2, C.asphalt, '运输通道', [0]);
    const tr = k.truck([-10, 0, 6.2]);
    // material: pending vs accepted zones (fenced)
    const fence = (x, z, w, d, col) => { const g = k.group([x, 0, z]); for (const [fx, fz, fw, fd] of [[0, -d / 2, w, 0.06], [0, d / 2, w, 0.06], [-w / 2, 0, 0.06, d], [w / 2, 0, 0.06, d]]) k.box([fw, 0.7, fd], [fx, 0, fz], col, { parent: g, anchor: 'bottom', opacity: 0.8 }); return g; };
    k.part(fence(-9.5, 2, 2.6, 5, 0xf2c230), { name: '待验区', on: 2, enter: 'rise', from: 1, win: [0.02, 0.15], hl: [2] });
    k.part(fence(-6.3, 2, 2.6, 5, C.green), { name: '可用材料区', on: 2, enter: 'rise', from: 1, win: [0.02, 0.15], hl: [2] });
    const stacks = [0, 1, 2].map(i => { const g = k.group([-9.5, 0, 0.4 + i * 1.6]); for (let j = 0; j < 4; j++) k.cyl(0.08, 2, [0, 0.1 + j * 0.17, (j % 2) * 0.17], C.rebar, { parent: g, axis: 'x' }); return g; });
    const checks = stacks.map(g => { const m = k.mesh(new THREE.TorusGeometry(0.22, 0.05, 6, 16), C.green, [0, 1.3, 0], { parent: g, emissive: C.green, ei: 0.6 }); return m; });
    // people: manager explains plan, then to workers
    const mgr = person(k, [-3.5, 0, -1], 0xffffff, 0x3a4a5a); const plan = k.box([0.6, 0.45, 0.04], [-3.1, 1.0, -0.8], 0xf5f5f0, { emissive: 0xffffff, ei: 0.2 });
    k.part(mgr, { name: '管理人员', hl: [1] }); k.part(plan, { name: '方案', on: 1, enter: 'pop', win: [0.02, 0.15], hl: [1] });
    const workers = [[-1.8, 2.2], [-1.2, 2.9], [-0.3, 2.5], [-2.5, 1.5]].map(([x, z]) => person(k, [x, 0, z]));
    workers.forEach(w => k.part(w, { name: '作业人员', hl: [1] }));
    const brief = [k.arrow([-3, 1.2, -0.8], [0.5, 0, 1], 1.6, 0xe9762b, { r: 0.05 }), k.arrow([-3, 1.2, -0.8], [1, 0, 1.2], 1.8, 0xe9762b, { r: 0.05 })];
    // structure: base, rebar + embedded parts visible before pouring, then concrete
    k.part(k.box([6, 0.3, 4], [SX, 0, SZ], C.concreteDark, { anchor: 'bottom' }), { name: '垫层' });
    const cage = k.group([SX, 0.3, SZ]); for (let x = -2.7; x <= 2.7; x += 0.45) for (const z of [-1.7, 1.7]) k.box([0.04, 2.4, 0.04], [x, 0, z], C.rebar, { parent: cage, anchor: 'bottom' });
    for (let y = 0.2; y < 2.4; y += 0.4) for (const z of [-1.7, 1.7]) k.box([5.5, 0.04, 0.04], [0, y, z], C.rebar, { parent: cage });
    for (const x of [-1.5, 1.2]) k.box([0.3, 0.3, 0.3], [x, 1.2, -1.7], 0x8a6fb0, { parent: cage, emissive: 0x8a6fb0, ei: 0.3 });
    k.part(cage, { name: '钢筋和预埋件', on: 3, enter: 'grow', win: [0.02, 0.35], hl: [3] });
    const insp = person(k, [SX + 3.6, 0, SZ + 1.4], 0xd9534f, 0x6b6f70); k.part(insp, { name: '检查', on: 3, enter: 'fade', win: [0.3, 0.45], off: 4 });
    k.part(k.box([5.8, 2.5, 3.8], [SX, 0.3, SZ], C.concreteNew, { anchor: 'bottom' }), { name: '实体', on: 3, enter: 'grow', win: [0.7, 0.98], hlSoft: 0.4 });
    // inspection points with rectify-then-recheck
    const flags = [[-2, 2.8, -1.9], [0.5, 2.8, -1.9], [2.6, 2.8, 0], [-2.9, 1.5, 1.9]].map(([x, y, z], i) => { const g = k.group([SX + x, y, SZ + z]); k.cyl(0.03, 0.7, [0, 0, 0], 0x444444, { parent: g, anchor: 'bottom' }); const f = k.box([0.4, 0.25, 0.02], [0.2, 0.55, 0], i === 2 ? C.red : C.green, { parent: g, emissive: i === 2 ? C.red : C.green, ei: 0.4 }); k.part(g, { name: '检查点', on: 4, enter: 'pop', win: [0.05 + i * 0.07, 0.12 + i * 0.07], off: 5, exit: 'fade', outWin: [0.0, 0.2] }); return f; });
    const fix = k.box([0.9, 0.5, 0.06], [SX + 2.6, 1.4, SZ + 1.93], 0xb9b4a8); k.part(fix, { name: '整改复查', on: 4, enter: 'fade', win: [0.45, 0.6], off: 5 });
    // completion: acceptance people + documents
    const docs = k.group([SX + 4.5, 0, SZ + 2.5]); for (let i = 0; i < 6; i++) k.box([0.8, 0.12, 0.6], [0, i * 0.13, 0], [0xf5f5f0, 0xe8e0c8, 0xdfe8ee][i % 3], { parent: docs, anchor: 'bottom' });
    k.part(docs, { name: '竣工资料', on: 5, enter: 'drop', from: 1.5, win: [0.4, 0.6] });
    [[SX - 4.2, SZ + 2.8], [SX - 3.4, SZ + 3.2], [SX - 2.6, SZ + 3.0]].forEach(([x, z], i) => k.part(person(k, [x, 0, z], [0xffffff, 0x2f6fb0, 0xd9534f][i], 0x3a4a5a), { name: '验收人员', on: 5, enter: 'fade', win: [0.1 + i * 0.08, 0.25 + i * 0.08] }));
    k.label('作业面', [SX, 0.6, SZ - 2.6], { steps: [0] }); k.label('材料区', [-8, 0.6, 2], { steps: [0] }); k.label('运输通道', [6, 0.5, 6.2], { steps: [0] });
    k.label('待验区', [-9.5, 1.6, -0.5], { steps: [2] }); k.label('可用材料区', [-6.3, 1.6, -0.5], { steps: [2] });
    k.label('整改复查', [SX + 2.6, 2.2, SZ + 2], { steps: [4], win: [0.45, 1] }); k.label('竣工资料', [SX + 4.5, 1.3, SZ + 2.5], { steps: [5], win: [0.5, 1] });
    k.onUpdate((s, p, t) => {
      tr.position.x = s === 0 ? lerp(-12, 10, (t * 0.06) % 1) : -10;
      brief.forEach((a, i) => { a.visible = s === 1 && p > 0.3 + i * 0.15; });
      stacks.forEach((g, i) => { const a = 0.15 + i * 0.25; const moved = s > 2 || (s === 2 && p > a + 0.12); const u = s === 2 ? smooth(p, a + 0.12, a + 0.22) : (s > 2 ? 1 : 0); g.position.x = lerp(-9.5, -6.3, u); checks[i].visible = s > 2 || (s === 2 && p > a); checks[i].rotation.y = t; g.visible = s < 3 || true; void moved; });
      flags[2].material.color.setHex(s === 4 && p > 0.7 ? C.green : C.red); flags[2].material.emissive.setHex(s === 4 && p > 0.7 ? C.green : C.red);
    });
  },
};
