// 填埋场怎样把污染物留住 — landfill liner, drainage, cells, gas, closure (3D)
import { THREE, COLORS as C, smooth, lerp, table } from '../engine.js';

const Z = 7, XB = 5, XC = 9, DEP = -5;
const surf = x => { const a = Math.abs(x); if (a >= XC) return 0; if (a >= XB) return DEP * (XC - a) / (XC - XB); return DEP - 0.18 * (1 - a / XB); };
const ext = y => XC + (XC - XB) * y / -DEP; // half-width of the basin at level y (y<=0)
const WASTE = 0x7b7468, COVER = 0xb69a6c;

export default {
  cams: [
    { pos: [6, 9, 21], target: [0, -2.5, 0] }, { pos: [8, 7, 18], target: [-1, -3, 0] }, { pos: [5, 4, 15], target: [0, -4, 0] },
    { pos: [7, 8, 20], target: [0, -2, 0] }, { pos: [7, 7, 19], target: [0, -1.5, 0] }, { pos: [8, 9, 21], target: [0, -1, 0] },
  ],
  phases: [[[0, '稳定地基；场底排水坡度不应小于2%']], [[0, '库底与边坡的防渗衬层连续'], [0.55, '试焊、焊接、检验与保护分别落实']], [[0, '导排管在膜上；接剖面外集液处理设施'], [0.55, '导排层保护防渗膜，污水不进入地下水系统']],
    '系统检测合格才运营；分层作业与覆盖', [[0, '液体、气体分别收集；同步监测堆体与环境'], [0.5, '填埋气：运营期即收集处理']], [[0, '封场覆盖与导气立管交接处密封'], [0.6, '封场后，导液、导气与监测维护持续']]],
  build(k) {
    table(k, -12, 12, -Z, Z, -9);
    const soilCols = [C.soil1, C.soil2, C.soil3];
    k.split((a, b) => { const g = k.group(); k.profile(-12, 12, x => surf(x), () => -9, a, b, C.soil2, { n: 48, parent: g, flat: true }); k.profile(-12, 12, () => -6.5, () => -9, a, b, C.soil3, { parent: g }); return g; }, { soil: true }, -Z, Z);
    void soilCols;
    // the basin is first dug out
    k.split((a, b) => k.profile(-XC, XC, () => 0, x => surf(x) + 0.01, a, b, C.soil1, { n: 36, flat: true }), { soil: true, off: 0, exit: 'grow', outWin: [0.05, 0.45] }, -Z, Z);
    for (const s of [-1, 1]) { k.part(k.zbox(0.8, 0.3, -Z, Z, s * 10.8, -0.3, C.water, { anchor: 'bottom', opacity: 0.8 }), { name: '截排水', on: 0, enter: 'fade', win: [0.5, 0.7], hl: [0] }); }
    k.part(k.cyl(0.18, Z, [0, DEP - 0.7, -Z / 2], C.blue, { axis: 'z' }), { name: '地下水导排', on: 0, enter: 'fade', win: [0.6, 0.8] });
    // liner grows across the basin, then weld seams
    // 防渗膜：先边坡、后场底。边坡膜幅顺坡布置，由坡顶向坡脚展开（分段显现），相邻膜幅顺坡搭接；场底随后铺设并与边坡膜衔接
    const NZ = 8, ZW = 2 * Z / NZ, SEG = [-11, -9.4, -8.2, -7.0, -5.8, -4.6];
    for (let j = 0; j < NZ; j++) {
      const z0 = -Z + j * ZW - (j ? 0.12 : 0), z1 = -Z + (j + 1) * ZW, lift = (j % 2) * 0.012, w0 = 0.05 + j * 0.034;
      for (const sd of [-1, 1]) for (let i = 0; i < SEG.length - 1; i++) {
        const xa = sd * SEG[i], xb = sd * SEG[i + 1], x0 = Math.min(xa, xb), x1 = Math.max(xa, xb), u0 = w0 + 0.034 * i / (SEG.length - 1), u1 = w0 + 0.034 * (i + 1) / (SEG.length - 1);
        k.part(k.profile(x0, x1, x => surf(x) + 0.12 + lift, x => surf(x) + 0.01, z0, z1, C.membrane, { n: 6, rough: 0.5 }), { name: '防渗衬层', on: 1, enter: 'fade', win: [u0, u1 + 0.004], front: z0 >= -0.12 && j >= NZ / 2 });
      }
    }
    for (let j = 0; j < NZ; j++) {
      const z0 = -Z + j * ZW - (j ? 0.12 : 0), z1 = -Z + (j + 1) * ZW, w0 = 0.33 + j * 0.026;
      k.part(k.profile(-4.75, 4.75, x => surf(x) + 0.125 + (j % 2) * 0.012, x => surf(x) + 0.01, z0, z1, C.membrane, { n: 12, rough: 0.5 }), { name: '防渗衬层', on: 1, enter: 'fade', win: [w0, w0 + 0.03], front: j >= NZ / 2 });
    }
    // 焊缝顺坡（坡上无横向缝），沿各膜幅搭接边
    for (const [zc, i] of [[-Z + ZW, 0], [-Z + 2 * ZW, 1], [-Z + 3 * ZW, 2]]) k.part(k.profile(-10.8, 10.8, x => surf(x) + 0.16, x => surf(x) + 0.12, zc - 0.05, zc + 0.05, 0xf2f2e8, { n: 60, emissive: 0xffffff, ei: 0.3 }), { name: '焊缝检验', on: 1, enter: 'grow', axis: 'x', win: [0.6 + i * 0.07, 0.68 + i * 0.07] });
    for (const s of [-1, 1]) k.part(k.zbox(0.6, 0.6, -Z, Z, s * 10.2, -0.6, C.membrane, { anchor: 'bottom' }), { name: '锚固', on: 1, enter: 'fade', win: [0.45, 0.6] });
    const welder = k.group([0, 0, 0]); k.box([0.6, 0.35, 0.45], [0, 0, 0], C.machine, { parent: welder, anchor: 'bottom' });
    k.part(welder, { on: 1, enter: 'fade', win: [0.55, 0.6], off: 2, exit: 'fade', outWin: [0, 0.1] });
    // drainage gravel + perforated collection pipe
    k.split((a, b) => k.profile(-6.2, 6.2, x => surf(x) + 0.7, x => surf(x) + 0.12, a, b, 0x9aa0a3, { n: 30, flat: true }), { name: '导排层', on: 2, enter: 'grow', axis: 'x', win: [0.05, 0.5], hlSoft: 0.5 }, -Z, Z);
    const pipe = k.cyl(0.22, 2 * Z + 3, [0, surf(0) + 0.38, 1.5], 0x2e6b46, { axis: 'z' });
    k.part(pipe, { name: '收集花管', on: 2, enter: 'grow', axis: 'z', win: [0.5, 0.8] });
    k.part(k.box([1.6, 1.2, 1.4], [0, surf(0) - 0.2, Z + 2.6], 0x6c7a80, { anchor: 'bottom' }), { name: '集液处理', on: 2, enter: 'pop', win: [0.8, 0.9] });
    // waste cells with daily cover; gas wells rise with the fill
    const tops = [-3.5, -2.1, -0.7], wins = [[0.05, 0.3], [0.35, 0.6], [0.65, 0.9]];
    let prev = null;
    tops.forEach((t, i) => {
      const xe = ext(t), pb = prev;
      k.split((a, b) => k.profile(-xe, xe, () => t - 0.18, x => Math.max(pb ?? -99, Math.abs(x) < 6.2 ? surf(x) + 0.7 : surf(x) + 0.12), a, b, WASTE, { n: 40, flat: true }), { name: '分层垃圾', on: 3, enter: 'grow', axis: 'x', win: [wins[i][0], wins[i][1] - 0.08], hlSoft: 0.35 }, -Z, Z);
      k.split((a, b) => k.profile(-xe, xe, () => t, () => t - 0.18, a, b, COVER, { n: 4 }), { name: '覆盖', on: 3, enter: 'grow', axis: 'x', win: [wins[i][1] - 0.08, wins[i][1]], hlSoft: 0.5 }, -Z, Z);
      prev = t;
    });
    k.split((a, b) => k.profile(-XC + 0.4, XC - 0.4, x => 1.6 - 1.6 * (Math.abs(x) / (XC - 0.4)) ** 2, () => -0.7, a, b, WASTE, { n: 30, flat: true }), { name: '分层垃圾', on: 3, enter: 'grow', win: [0.9, 0.98], hlSoft: 0.35 }, -Z, Z);
    const wells = [-3, 3].map(x => { const g = k.group([x, surf(x) + 0.7, 0.05]); k.cyl(0.24, 1, [0, 0, 0], 0x5b6b72, { parent: g, anchor: 'bottom' }); return g; });
    wells.forEach(w => k.part(w, { name: '导气井', on: 3, enter: 'none', win: [0, 0.01] }));
    // gas header + flare, leachate path
    const hdr = k.group([0, 0, 0]); k.box([7, 0.16, 0.16], [0, 3.2, -2.5], 0x5b6b72, { parent: hdr }); k.box([0.9, 2.4, 0.9], [-5.2, 0, -5.4], 0x8a8f8c, { parent: hdr, anchor: 'bottom' }); k.rod([-3.5, 3.2, 0.05], [-5.2, 2.4, -5.4], 0.08, 0x5b6b72, { parent: hdr });
    k.part(hdr, { name: '填埋气收集', on: 4, enter: 'fade', win: [0.4, 0.6] });
    const drops = []; for (let i = 0; i < 10; i++) drops.push(k.mesh(new THREE.SphereGeometry(0.2, 10, 8), C.water, [0, 0, 0], { emissive: C.water, ei: 0.5 }));
    const bubbles = []; for (let i = 0; i < 8; i++) bubbles.push(k.mesh(new THREE.SphereGeometry(0.18, 10, 8), 0xe6c84a, [0, 0, 0], { emissive: 0xe6c84a, ei: 0.6 }));
    for (const x of [-11.2, 11.2]) k.part(k.cyl(0.12, 4, [x, -3.5, -4], C.blue, { anchor: 'bottom' }), { name: '监测', on: 4, enter: 'pop', win: [0.7, 0.85] });
    // closure cap
    const capTop = x => 1.6 - 1.6 * (Math.abs(x) / (XC - 0.4)) ** 2;
    k.split((a, b) => k.profile(-XC, XC, x => Math.max(0, capTop(x)) + 0.12, x => Math.max(0, capTop(x)), a, b, C.membrane, { n: 30 }), { name: '封场覆盖', on: 5, enter: 'grow', axis: 'x', win: [0.05, 0.35] }, -Z, Z);
    k.split((a, b) => k.profile(-XC, XC, x => Math.max(0, capTop(x)) + 0.6, x => Math.max(0, capTop(x)) + 0.12, a, b, C.grass, { n: 30, flat: true }), { name: '植被', on: 5, enter: 'grow', axis: 'x', win: [0.35, 0.65] }, -Z, Z);
    for (const x of [-3, 3]) k.part(k.cyl(0.38, 0.3, [x, capTop(x) + 0.55, 0.05], C.machine), { name: '密封', on: 5, enter: 'pop', win: [0.62, 0.75] });
    k.label('导排管在膜上；接剖面外集液处理设施', [0, surf(0) + 1.4, 5], { steps: [2], win: [0.6, 1] });
    const surfPath = u => { const x = lerp(-4.5, 0, u); return new THREE.Vector3(x, surf(x) + 0.5, 0.2); };
    k.onUpdate((s, p, t) => {
      // gas wells extend with the waste lifts in step 3
      const h = s < 3 ? 0 : s === 3 ? 0.4 + (3.6 - surf(3) - 0.7) * smooth(p, 0.05, 0.95) : 3.6 - surf(3) - 0.7 + (s >= 5 ? 0 : 0);
      wells.forEach(w => { w.scale.y = Math.max(0.01, h); w.visible = s >= 3; });
      { const u = smooth(p, 0.6, 0.81), i = Math.min(2, Math.floor(u * 3)), f = u * 3 - i, x = lerp(-10.6, 10.6, f); welder.position.set(x, surf(x) + 0.14, -Z + (i + 1) * 2 * Z / 8 + 0.3); }
      drops.forEach((d, i) => { d.visible = s === 4; const u = ((t * 0.25 + i / drops.length) % 1); if (u < 0.5) { const q = surfPath(u * 2); d.position.set(q.x + (i % 3) * 1.5, lerp(-0.9, q.y, u * 2), q.z); } else { d.position.set(0, surf(0) + 0.38, lerp(-1, Z + 2.5, (u - 0.5) * 2)); } });
      bubbles.forEach((b, i) => { b.visible = s === 4; const u = ((t * 0.3 + i / bubbles.length) % 1); const x = i % 2 ? 3 : -3; b.position.set(x + (u > 0.8 ? -Math.sign(x) * (u - 0.8) * 10 : 0), lerp(-3.6, 3.2, Math.min(1, u / 0.8)), 0.32); });
    });
  },
};
