// 桥梁怎样从桥墩两边长出来 — balanced cantilever casting, continuous girder (3D)
import { THREE, COLORS as C, smooth, lerp } from '../engine.js';

const PIERS = [-9, 9], YT = 10.2, DP = 2.0, DM = 1.0, HW = 3.0, SEG = 2;
const depth = x => { const d = Math.min(...PIERS.map(p => Math.abs(x - p))); const u = Math.max(0, 1 - d / 9); return DM + (DP - DM) * u * u; };
const bot = x => YT - depth(x);

export default {
  cams: [
    { pos: [-2, 13, 19], target: [-9, 7, 0] },
    { pos: [-1, 14, 18], target: [-9, 9, 0] },
    { pos: [8, 16, 34], target: [0, 8, 0] },
    { pos: [-6, 12, 20], target: [-15, 7, 0] },
    { pos: [8, 15, 32], target: [0, 8.5, 0] },
    { pos: [10, 13, 34], target: [0, 7.5, 0] },
  ],
  phases: [
    '零号块成形、规定预应力后，建立临时固结',
    '后锚连接已成梁，底模托住下一段位置',
    [[0, '本轮：挂篮固定，两侧均衡浇筑'], [0.15, '本段达到要求，并完成规定预应力等工序'], [0.21, '满足前移条件后，挂篮再向前移动'], [0.3, '本轮：挂篮固定，两侧均衡浇筑'], [0.62, '继续循环至合龙前段；末段完成后按条件撤篮']],
    '留出合龙口，边跨相应梁段在支架上成形',
    '先边跨、后中跨；临时约束分阶段调整',
    [[0, '先核合龙段及全部纵向连续预应力、压浆条件'], [0.4, '剩余临时固结按设计退出，永久支承保留']],
  ],
  build(k) {
    // ground, river, banks
    k.box([52, 0.6, 18], [0, -0.6, 0], C.grass, { anchor: 'bottom', rough: 1 });
    k.box([12, 0.05, 18.02], [0, -0.02, 0], C.water, { anchor: 'bottom', opacity: 0.85, rough: 0.2, metal: 0.1, shadow: false });
    k.box([53, 0.5, 19], [0, -1.1, 0], 0x9fb3a8, { anchor: 'bottom' });
    for (const [x, z, s] of [[-23, -6, 1.2], [-21, 6, 1], [23, 5, 1.3], [22, -6.5, 1], [-14, -7, 0.9], [15, 7, 1]]) k.tree([x, 0, z], s);
    // girder pieces: box section (top slab, web, bottom slab); back half + front half
    const segment = (x0, x1, color, opts, anchor) => [-1, 1].map(side => {
      const g = k.group(); const zA = side < 0 ? -HW : 0, zB = side < 0 ? 0 : HW, ws = side < 0 ? [-1.9, -1.5] : [1.5, 1.9], bs = side < 0 ? [-1.9, 0] : [0, 1.9];
      k.profile(x0, x1, () => YT, () => YT - 0.3, zA, zB, color, { parent: g });
      k.profile(x0, x1, () => YT - 0.3, x => bot(x) + 0.28, ws[0], ws[1], color, { parent: g });
      k.profile(x0, x1, x => bot(x) + 0.28, bot, bs[0], bs[1], color, { parent: g });
      if (anchor) { const t = [-(anchor.x || 0), -(anchor.y || 0), 0]; g.children.forEach(m => m.geometry.translate(...t)); g.position.set(anchor.x || 0, anchor.y || 0, 0); }
      return k.part(g, { ...opts, front: side > 0 });
    });
    // piers + pile caps + bearings + brackets + temporary consolidation
    for (const xp of PIERS) {
      k.box([4.5, 1.2, 6], [xp, -1.3, 0], C.concreteDark, { anchor: 'bottom' });
      k.box([1.8, 8.0, 3.4], [xp, -0.1, 0], C.concrete, { anchor: 'bottom' });
      for (const z of [-1.1, 1.1]) k.part(k.box([0.6, 0.2, 0.6], [xp, 7.9, z], C.steel, { anchor: 'bottom' }), { name: '永久支座', hl: [5] });
      for (const s of [-1, 1]) {
        const br = k.group([xp + s * 0.9, 6.0, 0]);
        for (const z of [-1.2, 1.2]) { k.rod([0, 0, z], [s * 2.2, 2.0, z], 0.1, C.steel, { parent: br }); k.rod([0, 2.0, z], [s * 2.2, 2.0, z], 0.1, C.steel, { parent: br }); }
        k.box([2.2, 0.15, 3.2], [s * 1.1, 2.05, 0], C.wood, { parent: br });
        k.part(br, { name: '托架', on: 0, enter: 'rise', win: [0.02, 0.2], from: 2, off: 2, exit: 'fade', outWin: [0, 0.1] });
      }
      for (const dx of [-0.65, 0.65]) for (const z of [-0.4, 0.4]) k.part(k.box([0.35, 0.3, 0.35], [xp + dx, 7.9, z], C.machine, { anchor: 'bottom' }), { name: '临时固结', on: 0, enter: 'pop', win: [0.72, 0.88], off: 5, exit: 'lift', outWin: [0.42, 0.58] });
      segment(xp - 2, xp + 2, C.concreteNew, { name: '零号块', on: 0, enter: 'grow', axis: 'y', win: [0.22, 0.55] }, { y: bot(xp) });
      k.part(k.box([4, 0.08, 0.08], [xp, YT - 0.15, 0.04], C.red, { emissive: C.red, ei: 0.4 }), { name: '预应力束', on: 0, enter: 'grow', axis: 'x', win: [0.58, 0.7] });
    }
    // cantilever segments, travellers
    const trav = [];
    for (const xp of PIERS) for (const dir of [-1, 1]) {
      for (let j = 0; j < 3; j++) {
        const xa = xp + dir * (2 + SEG * j), xb = xa + dir * SEG;
        segment(Math.min(xa, xb), Math.max(xa, xb), j % 2 ? C.concrete : C.concreteNew, { name: '梁段', on: 2, enter: 'grow', axis: 'x', win: [0.02 + 0.3 * j, 0.14 + 0.3 * j] }, { x: xa });
        k.part(k.box([SEG, 0.08, 0.08], [xa + dir * SEG / 2, YT - 0.15, 0.04], C.red, { emissive: C.red, ei: 0.4 }), { name: '预应力束', on: 2, enter: 'fade', win: [0.15 + 0.3 * j, 0.2 + 0.3 * j] });
      }
      // traveller (挂篮): mirrored by dir
      const g = k.group([xp + dir * 2, YT, 0]); g.scale.x = dir;
      for (const z of [-1.7, 1.7]) {
        k.rod([-2.3, 0.1, z], [0.2, 2.6, z], 0.09, C.red, { parent: g }); k.rod([0.2, 2.6, z], [2.3, 2.3, z], 0.09, C.red, { parent: g });
        k.rod([-2.3, 0.1, z], [2.3, 0.15, z], 0.09, C.red, { parent: g }); k.rod([0.2, 0.1, z], [0.2, 2.6, z], 0.09, C.red, { parent: g });
        k.rod([2.2, 2.3, z], [2.2, -2.3, z], 0.04, C.steel, { parent: g }); k.rod([-2.2, 0.1, z], [-2.2, -0.4, z], 0.05, C.steel, { parent: g });
      }
      k.box([0.25, 0.25, 3.8], [2.25, 2.3, 0], C.red, { parent: g });
      const plat = k.box([2.3, 0.15, 4.2], [1.15, -2.35, 0], C.wood, { parent: g });
      k.part(g, { name: '挂篮', on: 1, enter: 'drop', win: [0.05, 0.4], from: 6, off: 3, exit: 'lift', outWin: [0.0, 0.2] });
      // load test blocks (step 1)
      k.part(k.box([1.4, 0.6, 2.6], [xp + dir * 3.2, YT - 2.2, 0], C.steelLight, { anchor: 'bottom' }), { on: 1, off: 1, enter: 'drop', win: [0.5, 0.65], exit: 'lift', outWin: [0.85, 0.97] });
      trav.push({ g, xp, dir, plat });
    }
    k.onUpdate((s, p) => {
      trav.forEach(t => {
        let n = 0; if (s === 2) { for (let j = 0; j < 3; j++) n += smooth(p, 0.21 + 0.3 * j, 0.29 + 0.3 * j); n = Math.min(n, 3); } else if (s > 2) n = 3;
        if (s === 2 && p > 0.8) n = 3; const xe = t.xp + t.dir * (2 + SEG * Math.min(n, 3));
        t.g.position.x = xe; t.plat.position.y = bot(xe + t.dir * 1.0) - YT - 0.2;
      });
    });
    // abutments + side span on falsework
    for (const s of [-1, 1]) {
      k.box([1.6, 8.6, 6.5], [s * 21.3, -0.6, 0], C.concreteDark, { anchor: 'bottom' });
      for (const z of [-1.1, 1.1]) k.part(k.box([0.6, 0.2, 0.6], [s * 20.9, 8.0, z], C.steel, { anchor: 'bottom' }), { name: '永久支座', hl: [5] });
      const fw = k.group();
      for (let x = 18.3; x <= 20.6; x += 0.75) for (const z of [-1.6, -0.5, 0.5, 1.6]) k.box([0.1, bot(s * x) - 0.05, 0.1], [s * x, 0, z], C.steelLight, { parent: fw, anchor: 'bottom' });
      for (let y = 2; y < 8; y += 2) for (const z of [-1.6, 1.6]) k.box([2.5, 0.08, 0.08], [s * 19.4, y, z], C.steelLight, { parent: fw });
      k.part(fw, { name: '支架', on: 3, enter: 'rise', from: 3, win: [0.1, 0.35], off: 5, exit: 'fade', outWin: [0.65, 0.85] });
      segment(Math.min(s * 18, s * 20.6), Math.max(s * 18, s * 20.6), C.concreteNew, { name: '边跨梁段', on: 3, enter: 'fade', win: [0.38, 0.6] });
      // side closure
      k.part(k.box([1.2, 0.2, 0.3], [s * 17.5, YT - 0.1, -1.2], C.steel), { name: '临时连接', on: 4, enter: 'drop', from: 2, win: [0.0, 0.1] });
      segment(Math.min(s * 17, s * 18), Math.max(s * 17, s * 18), C.concreteNew, { name: '合龙段', on: 4, enter: 'fade', win: [0.12, 0.35] });
      // monitoring points on cantilever tips
      for (const x of [s * 17.2, s * 1.2]) k.part(k.cyl(0.12, 0.4, [x, YT, -2.4], C.red, { anchor: 'bottom', emissive: C.red, ei: 0.4 }), { name: '监测点', on: 3, enter: 'pop', win: [0.65, 0.8] });
    }
    // mid closure: temporary connection, ballast, closure segment
    k.part(k.box([2.4, 0.2, 0.3], [0, YT - 0.1, -1.2], C.steel), { name: '临时连接', on: 4, enter: 'drop', from: 2, win: [0.4, 0.5] });
    for (const x of [-2, 2]) k.part(k.box([1.2, 0.6, 1.8], [x, YT, 1.2], C.blue, { anchor: 'bottom', opacity: 0.85 }), { name: '压重', on: 4, off: 4, enter: 'drop', win: [0.45, 0.55], exit: 'fade', outWin: [0.86, 0.96] });
    segment(-1, 1, C.concreteNew, { name: '合龙段', on: 4, enter: 'fade', win: [0.58, 0.85] });
    // continuous bottom tendons (step 5)
    for (const [x0, x1] of [[-20, -11], [-7, 7], [11, 20]]) {
      const pts = []; for (let i = 0; i <= 12; i++) { const x = x0 + (x1 - x0) * i / 12; pts.push([x, bot(x) + 0.14, 0.05]); }
      k.part(k.tube(pts, 0.06, C.red, { emissive: C.red, ei: 0.5, segs: 40 }), { name: '预应力束', on: 5, enter: 'fade', win: [0.02, 0.35] });
    }
    k.label('零号块成形、规定预应力后，建立临时固结', [-9, 12.6, 0], { steps: [0], win: [0.6, 1] });
    k.label('后锚连接已成梁，底模托住下一段位置', [-6, 13.2, 0], { steps: [1] });
    k.label('留出合龙口，边跨相应梁段在支架上成形', [-17.5, 12.5, 0], { steps: [3], win: [0.4, 1] });
    k.label('剩余临时固结按设计退出，永久支承保留', [-9, 6.5, 2], { steps: [5], win: [0.45, 1] });
    k.label('端部永久支承', [20.9, 7.4, 2], { steps: [5] });
  },
};
