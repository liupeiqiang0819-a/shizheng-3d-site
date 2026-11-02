// 雨水怎样进入一处雨水花园 — bioretention cell (3D)
import { THREE, COLORS as C, smooth, lerp, table } from '../engine.js';

const Z = 4.5, XA = -4.5, XB = 7.5, BOT = -2.2, GT = -1.62, MT = -0.8, OVF = -0.25, SEW = 10;
const cav = x => (x <= XA - 0.5 || x >= XB + 0.5) ? 0 : (x < XA ? BOT * (XA - 0.5 - x) / -0.5 : x > XB ? BOT * (x - XB - 0.5) / -0.5 : BOT);
const clampTop = (y) => x => Math.max(cav(x), y);

export default {
  cams: [
    { pos: [4, 6, 15], target: [1, -1, 0] }, { pos: [-2, 4, 11], target: [-4, -0.5, 0] }, { pos: [4, 3, 12], target: [1.5, -1.8, 0] },
    { pos: [5, 4, 13], target: [2, -1, 0] }, { pos: [4, 4, 13], target: [1, -1.2, 0] }, { pos: [6, 3, 12], target: [4, -1.2, 0] },
  ],
  phases: ['先核汇水面、入口、底部与出口高程', '入口先缓冲、拦颗粒，保护介质', [[0, '排水、过滤隔离与原土下渗各有作用'], [0.7, '接设计雨水系统']], '介质和植物到位，保留表面蓄水空间',
    [[0, '常规来水蓄渗净化，水位低于溢流口'], [0.45, '水位未到溢流口：仍在蓄渗'], [0.7, '底排：水先通过介质与砾石']], [[0, '水位达到入口：超量溢流，下渗继续'], [0.5, '溢流：独立实壁支管接雨水系统']]],
  build(k) {
    table(k, -12, 12, -Z, Z, -5);
    k.split((a, b) => k.profile(-12, 12, x => cav(x), () => -5, a, b, C.soil2, { n: 96, flat: true }), { soil: true }, -Z, Z);
    k.split((a, b) => k.profile(XA - 0.5, XB + 0.5, () => 0, x => cav(x), a, b, C.soil1, { n: 24, flat: true }), { soil: true, off: 0, exit: 'grow', outWin: [0.05, 0.4] }, -Z, Z);
    // road and curb (higher catchment)
    k.split((a, b) => k.zbox(7, 0.3, a, b, -8.5, 0, C.asphalt, { anchor: 'bottom' }), { name: '路面', hl: [0] }, -Z, Z);
    k.split((a, b) => k.zbox(0.3, 0.45, a, b, -5.1, 0, C.concrete, { anchor: 'bottom' }), {}, -Z, -0.8);
    k.part(k.zbox(0.3, 0.45, 0.8, Z, -5.1, 0, C.concrete, { anchor: 'bottom' }), { front: true });
    k.split((a, b) => k.zbox(4, 0.06, a, b, 10, 0, C.grass, { anchor: 'bottom' }), {}, -Z, Z);
    // elevation check markers
    for (const [x, y] of [[-7, 0.3], [-5.1, 0.15], [1, BOT], [5.5, OVF], [SEW, -2.6]]) k.part(k.cyl(0.06, 1.2, [x, y, -3.6], C.red, { anchor: 'bottom', seg: 8, emissive: C.red, ei: 0.3 }), { name: '高程', on: 0, enter: 'pop', win: [0.45, 0.8], off: 1, exit: 'fade', outWin: [0, 0.2] });
    // inlet buffer stones
    const stones = k.group(); for (let i = 0; i < 26; i++) { const x = -4.6 + (i % 6) * 0.35 + Math.sin(i) * 0.05, z = -1.2 + Math.floor(i / 6) * 0.55; k.mesh(new THREE.DodecahedronGeometry(0.2 + 0.06 * (i % 3), 0), 0x9a9a92, [x, MT + 0.12, z], { parent: stones, flat: true }); }
    k.part(stones, { name: '入口缓冲', on: 1, enter: 'drop', from: 1.5, win: [0.1, 0.5] });
    // gravel + perforated underdrain + separation fabric
    k.split((a, b) => k.profile(XA - 0.2, XB + 0.2, clampTop(GT), x => cav(x), a, b, 0xa3a7a6, { n: 24, flat: true }), { name: '砾石排水层', on: 2, enter: 'grow', axis: 'x', win: [0.05, 0.35], hlSoft: 0.5 }, -Z, Z);
    const ud = k.group(); k.cyl(0.15, XB - XA + 2.8, [(XA + SEW) / 2 + 0.6, BOT + 0.25, 0.02], 0x2e6b46, { axis: 'x', parent: ud }); for (let x = XA + 0.3; x < XB; x += 0.5) k.cyl(0.16, 0.05, [x, BOT + 0.25, 0.02], 0x1c3f2a, { axis: 'x', parent: ud });
    k.part(ud, { name: '穿孔排水管', on: 2, enter: 'grow', axis: 'x', win: [0.35, 0.6] });
    k.split((a, b) => k.profile(XA - 0.25, XB + 0.25, clampTop(GT + 0.04), clampTop(GT), a, b, 0xe8e1cf, { n: 24 }), { name: '过滤隔离', on: 2, enter: 'grow', axis: 'x', win: [0.6, 0.72] }, -Z, Z);
    k.part(k.cyl(0.5, Z, [SEW, -2.6, -Z / 2], C.concreteDark, { axis: 'z' }), { name: '雨水系统', on: 2, enter: 'fade', win: [0.7, 0.85] });
    // media, mulch, plants, overflow riser
    k.split((a, b) => k.profile(XA - 0.35, XB + 0.35, clampTop(MT), clampTop(GT + 0.04), a, b, 0x6b4a32, { n: 24, flat: true }), { name: '种植介质', on: 3, enter: 'grow', win: [0.05, 0.4], hlSoft: 0.4 }, -Z, Z);
    const plants = k.group(); for (let i = 0; i < 18; i++) { const x = -2.5 + (i % 6) * 1.5, z = -3.5 + Math.floor(i / 6) * 1.4 + (i % 2) * 0.3; const m = k.mesh(new THREE.IcosahedronGeometry(0.35 + 0.1 * (i % 3), 0), [0x5f9e58, 0x78a85a, 0x4f8a4d][i % 3], [x, MT + 0.3, z], { parent: plants, flat: true }); m.scale.y = 1.3; }
    k.part(plants, { name: '植物', on: 3, enter: 'pop', win: [0.45, 0.7] });
    const riser = k.group(); k.cyl(0.22, OVF - (GT + 0.3), [5.5, GT + 0.3, 0.02], C.steelLight, { parent: riser, anchor: 'bottom' }); k.cyl(0.3, 0.06, [5.5, OVF, 0.02], C.machineDark, { parent: riser });
    k.cyl(0.13, SEW - 5.5, [(5.5 + SEW) / 2, GT + 0.3, 0.02], C.steelLight, { axis: 'x', parent: riser });
    k.part(riser, { name: '溢流设施', on: 3, enter: 'fade', win: [0.7, 0.9] });
    // water: ponding surface, arrows
    const pond = k.profile(XA - 0.1, XB + 0.1, () => 0, () => MT + 0.02, -Z + 0.05, Z - 0.05, C.water, { opacity: 0.45, n: 4, shadow: false });
    const arrows = []; const A = (from, dir, len, c = C.water) => { const a = k.arrow(from, dir, len, c, { r: 0.05 }); arrows.push(a); return a; };
    const runoff = [A([-8.5, 0.6, -1], [1, 0, 0], 1.4), A([-7, 0.6, 1], [1, 0, 0], 1.4)];
    const down = [A([-1.5, MT - 0.05, 0.25], [0, -1, 0], 0.7), A([1.5, MT - 0.05, 0.25], [0, -1, 0], 0.7), A([4, MT - 0.05, 0.25], [0, -1, 0], 0.7)];
    const soak = [A([0, BOT - 0.05, 0.25], [0, -1, 0], 0.8, 0x6aa9c8), A([3, BOT - 0.05, 0.25], [0, -1, 0], 0.8, 0x6aa9c8)];
    const drain = [A([7.8, BOT + 0.25, 0.25], [1, 0, 0], 1.2)];
    const over = [A([5.5, OVF + 0.6, 0.25], [0, -1, 0], 0.6), A([7.6, GT + 0.3, 0.25], [1, 0, 0], 1.2)];
    k.label('入口缓冲、预处理、防冲刷', [-4.3, 0.8, -1], { steps: [1] });
    k.label('接设计雨水系统', [SEW, -1.6, 2], { steps: [2, 5] });
    k.onUpdate((s, p, t) => {
      let lvl = null; if (s === 4) lvl = lerp(MT + 0.03, -0.55, smooth(p, 0.1, 0.45)); if (s === 5) lvl = lerp(-0.55, OVF, smooth(p, 0.02, 0.3));
      pond.visible = lvl !== null; if (lvl !== null) { pond.scale.y = 1; pond.position.y = 0; pond.geometry.dispose?.(); }
      if (lvl !== null) { const h = lvl - MT; pond.scale.set(1, Math.max(0.02, h / (0 - MT)), 1); pond.position.y = MT - MT * pond.scale.y; }
      const pulse = 0.85 + 0.15 * Math.sin(t * 6);
      arrows.forEach(a => { a.visible = false; a.scale.setScalar(pulse); });
      if (s >= 4) { runoff.forEach(a => a.visible = true); if (p > 0.45 || s === 5) down.forEach(a => a.visible = true); if (p > 0.6 || s === 5) { soak.forEach(a => a.visible = true); drain.forEach(a => a.visible = true); } }
      if (s === 5 && p > 0.3) over.forEach(a => a.visible = true);
    });
  },
};
