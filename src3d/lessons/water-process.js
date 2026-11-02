// 给水与污水分别怎样处理 — two independent treatment lines (3D)
import { THREE, COLORS as C, smooth, lerp } from '../engine.js';

const ZW = -4, ZS = 2.2, H = 1.6, WL = 1.25;
const WCOL = 0x6fb7d6, SCOL = 0x8a8a5a;

export default {
  cams: [
    { pos: [2, 14, 17], target: [0, 0, -0.8] }, { pos: [-4, 7, 6], target: [-6, 0.6, ZW] }, { pos: [3, 7, 6], target: [2, 0.6, ZW] },
    { pos: [-6, 7, 12], target: [-8, 0.6, ZS] }, { pos: [2, 8, 13], target: [1.5, 0.6, ZS] }, { pos: [8, 10, 15], target: [6, 0, 1.5] },
  ],
  phases: ['两条独立水线，不串联', [[0, '混凝'], [0.35, '沉淀'], [0.6, '先混凝聚集，再静置沉降分离']], [[0, '过滤'], [0.4, '紫外消毒：灯管浸没'], [0.7, '过滤截留杂质，消毒控制微生物']],
    [[0, '格栅'], [0.3, '沉砂'], [0.55, '初沉'], [0.75, '依次截杂物、分砂粒、沉降悬浮物']], [[0, '厌氧'], [0.15, '缺氧'], [0.3, '好氧'], [0.45, '二沉'], [0.6, '内回流：好氧 → 缺氧'], [0.78, '污泥回流：二沉 → 厌氧']], [[0, '按目标出水'], [0.5, '水线与泥线分开；回流见上一步']]],
  build(k) {
    k.box([30, 0.4, 16], [0, -0.2, -0.5], 0xe8ece6); k.box([30.4, 0.25, 16.4], [0, -0.52, -0.5], 0x9fb3a8);
    const tank = (x, z, w, d, nm, col = WCOL, on) => {
      const g = k.group([x, 0, z]); const t = 0.15;
      k.box([w, 0.15, d], [0, 0, 0], C.concreteDark, { parent: g, anchor: 'bottom' });
      k.box([w, H, t], [0, 0, -d / 2 + t / 2], C.concrete, { parent: g, anchor: 'bottom' });
      for (const sx of [-1, 1]) k.box([t, H, d], [sx * (w / 2 - t / 2), 0, 0], C.concrete, { parent: g, anchor: 'bottom' });
      const wat = k.box([w - 2 * t, WL, d - 2 * t], [0, 0.15, 0], col, { parent: g, anchor: 'bottom', opacity: 0.45, shadow: false });
      k.part(g, { name: nm, hl: on, hlSoft: 0.3 }); k.label(nm, [x, H + 0.5, z], { steps: on });
      k.part(k.box([w, H, t], [x, 0, z + d / 2 - t / 2], C.concrete, { anchor: 'bottom' }), { front: true });
      g.userData.water = wat; return g;
    };
    const pipe = (pts, col, nm, o = {}) => k.part(k.tube(pts, 0.12, col, { segs: 40, tension: 0 }), { name: nm, ...o });
    // drinking-water line (back row)
    const mix = tank(-9, ZW, 2.2, 2.2, '混凝', WCOL, [1]); const sed = tank(-5, ZW, 4.4, 2.4, '沉淀', WCOL, [1]);
    const filt = tank(0, ZW, 2.6, 2.4, '过滤', WCOL, [2]); const dis = tank(4, ZW, 2.4, 2.2, '消毒／清水', 0x8fd0ea, [2]);
    for (const [y, c] of [[0.15, 0x8b8f92], [0.45, 0xd9c79a], [0.85, 0xe8dcb5]]) k.box([2.3, 0.35, 2.1], [0, y, 0], c, { parent: filt, anchor: 'bottom' });
    const lamps = []; for (const dz of [-0.6, 0, 0.6]) lamps.push(k.cyl(0.07, 1.8, [0, 0.7, dz], 0xbfa8ff, { parent: dis, axis: 'x', emissive: 0x9b7bff, ei: 0.2 }));
    const stir = k.group([0, 0, 0], mix); k.cyl(0.04, 1.6, [0, 0.5, 0], C.steel, { parent: stir, anchor: 'bottom' }); k.box([1.2, 0.08, 0.2], [0, 0.6, 0], C.steel, { parent: stir });
    pipe([[-13, 0.9, ZW], [-10.1, 0.9, ZW]], WCOL, '原水', { hl: [0] });
    pipe([[-7.9, 0.9, ZW], [-7.2, 0.9, ZW]], WCOL, ''); pipe([[-2.8, 0.9, ZW], [-1.3, 0.9, ZW]], WCOL, ''); pipe([[1.3, 0.5, ZW], [2.8, 0.5, ZW]], WCOL, '');
    pipe([[5.2, 0.9, ZW], [12.5, 0.9, ZW]], 0x8fd0ea, '消毒供水', { hl: [0, 2] });
    // wastewater line (front row)
    const scr = tank(-11, ZS, 1.4, 1.6, '格栅', SCOL, [3]); const grit = tank(-8.6, ZS, 2.2, 1.8, '沉砂', SCOL, [3]); const prim = tank(-5.6, ZS, 2.8, 2.4, '初沉', SCOL, [3]);
    for (let i = -4; i <= 4; i++) k.box([0.05, H - 0.1, 0.05], [0.4, 0.15, i * 0.17], C.steel, { parent: scr, anchor: 'bottom' });
    const ana = tank(-2.4, ZS, 2.0, 2.6, '厌氧', 0x7f7a52, [4]); const ano = tank(-0.3, ZS, 2.0, 2.6, '缺氧', 0x7b8a5a, [4]); const aer = tank(2.6, ZS, 3.6, 2.6, '好氧', 0x8aa070, [4]);
    const sec = tank(6.8, ZS, 2.8, 2.6, '二沉', 0x93b8c4, [4]);
    pipe([[-14, 0.9, ZS], [-11.7, 0.9, ZS]], SCOL, '污水', { hl: [0] });
    for (const [a, b] of [[-10.3, -9.7], [-7.5, -7], [-4.2, -3.4], [8.2, 9.2]]) pipe([[a, 0.9, ZS], [b, 0.9, ZS]], SCOL, '');
    // outlets (step 5)
    const deep = k.box([1.8, 1.2, 1.6], [10.6, 0, 0.6], 0x7fa8b8, { anchor: 'bottom' }); k.part(deep, { name: '按目标深度处理', on: 5, enter: 'pop', win: [0.05, 0.25] });
    pipe([[9.2, 0.9, ZS], [10.6, 0.9, ZS], [10.6, 0.9, 1.4]], 0x93b8c4, '按目标深度处理', { on: 5, enter: 'fade', win: [0.05, 0.2] });
    pipe([[10.6, 0.9, 2.6], [13, 0.9, 2.6]], 0x93b8c4, '符合排放要求', { on: 5, enter: 'fade', win: [0.2, 0.35] });
    pipe([[11.5, 0.6, 0.6], [13.5, 0.6, 0.6]], 0x8fd0ea, '符合回用要求', { on: 5, enter: 'fade', win: [0.3, 0.45] });
    const sl = k.box([2, 1, 1.6], [6.8, 0, 5.6], 0x6e5a3e, { anchor: 'bottom' }); k.part(sl, { name: '剩余污泥处理', on: 5, enter: 'pop', win: [0.45, 0.6] });
    pipe([[6.8, 0.25, ZS + 1.3], [6.8, 0.25, 4.8]], 0x6e5a3e, '剩余污泥处理', { on: 5, enter: 'fade', win: [0.45, 0.6] });
    // returns (step 4)
    pipe([[3.5, 1.9, ZS - 0.9], [1.5, 2.4, ZS - 0.9], [-0.3, 1.9, ZS - 0.9]], 0xe9762b, '内回流', { on: 4, enter: 'fade', win: [0.6, 0.7], off: 5, exit: 'fade', outWin: [0, 0.1] });
    pipe([[6.8, 1.9, ZS + 0.9], [6.8, 2.9, ZS + 0.9], [-2.4, 2.9, ZS + 0.9], [-2.4, 1.9, ZS + 0.9]], 0x6e5a3e, '污泥回流', { on: 4, enter: 'fade', win: [0.78, 0.88], off: 5, exit: 'fade', outWin: [0, 0.1] });
    const retA = k.arrow([0.4, 2.15, ZS - 0.9], [-1, -0.25, 0], 0.7, 0xe9762b, { r: 0.07 }); const retB = k.arrow([-1.4, 2.9, ZS + 0.9], [-1, 0, 0], 0.7, 0x6e5a3e, { r: 0.07 });
    // particles
    const P = (n, col, r) => Array.from({ length: n }, () => k.mesh(new THREE.SphereGeometry(r, 8, 6), col, [0, -5, 0], { shadow: false }));
    const flocs = P(18, 0x9b8a6a, 0.07), sand = P(10, 0xc9b27a, 0.06), debris = P(6, 0x5a4a3a, 0.12), bubbles = P(14, 0xffffff, 0.06);
    const sludgeW = k.box([4.0, 0.06, 2.0], [-5, 0.17, ZW], 0x7d6a55); const sludgeP = k.box([2.4, 0.06, 2.0], [-5.6, 0.17, ZS], 0x6e5a3e);
    const flowArrows = [[-12.5, 0.9 + 0.45, ZW, 0], [-13.5, 1.35, ZS, 0]].map(([x, y, z]) => k.arrow([x, y, z], [1, 0, 0], 0.9, 0x2f6fb0, { r: 0.06 }));
    k.label('原水', [-12.5, 1.6, ZW], { steps: [0] }); k.label('污水', [-13.5, 1.6, ZS], { steps: [0] });
    k.label('给水处理', [-2, 2.4, ZW], { steps: [0], kind: '' }); k.label('污水处理', [-1, 2.4, ZS], { steps: [0] });
    k.label('后续生物处理', [-1.5, 2.2, ZS], { steps: [3] }); k.label('曝气只在好氧区', [2.6, 2.3, ZS], { steps: [4] });
    k.label('符合排放要求', [13, 1.5, 2.6], { steps: [5] }); k.label('符合回用要求', [13.5, 1.2, 0.6], { steps: [5] }); k.label('剩余污泥处理', [6.8, 1.6, 5.6], { steps: [5] });
    const rnd = i => (Math.sin(i * 12.9898) * 43758.5453) % 1;
    k.onUpdate((s, p, t) => {
      stir.rotation.y = s === 1 ? t * 4 : 0;
      lamps.forEach(l => { l.material.emissiveIntensity = s === 2 && p > 0.35 ? 0.9 + 0.2 * Math.sin(t * 8) : 0.15; });
      flowArrows.forEach(a => { a.visible = s === 0; a.position.x = (a.position.x < -11 ? a.position.x : -13.5) + 0; });
      flocs.forEach((m, i) => { m.visible = s === 1; if (!m.visible) return; const u = (t * 0.15 + i / flocs.length) % 1; const a = Math.abs(rnd(i));
        if (u < 0.35) { m.position.set(-9 + (a - 0.5) * 1.6, 0.4 + a * 0.9, ZW + (Math.abs(rnd(i + 7)) - 0.5) * 1.6); m.scale.setScalar(0.6 + u * 3); }
        else { const v = (u - 0.35) / 0.65; m.position.set(-6.8 + v * 3.2 + a * 0.4, lerp(1.2, 0.24, Math.min(1, v * 1.4)), ZW + (Math.abs(rnd(i + 7)) - 0.5) * 1.8); m.scale.setScalar(1.8); } });
      sludgeW.visible = s >= 1; sludgeW.scale.y = s === 1 ? 0.2 + 2 * smooth(p, 0.4, 0.9) : 2.2;
      debris.forEach((m, i) => { m.visible = s === 3; const u = smooth(p, 0.02, 0.3); m.position.set(lerp(-11.6, -11.0 + 0.32, u), 0.4 + (i % 3) * 0.35, ZS - 0.5 + (i % 2) * 0.9 + i * 0.05); });
      sand.forEach((m, i) => { m.visible = s === 3 && p > 0.25; const u = ((t * 0.3 + i / sand.length) % 1); m.position.set(-9.4 + (i % 5) * 0.35, lerp(1.2, 0.22, u), ZS - 0.4 + (i % 3) * 0.4); });
      sludgeP.visible = s >= 3; sludgeP.scale.y = s === 3 ? 0.2 + 2 * smooth(p, 0.5, 0.9) : 2.2;
      bubbles.forEach((m, i) => { m.visible = s === 4 && p > 0.3; const u = ((t * 0.5 + i / bubbles.length) % 1); m.position.set(1.2 + (i % 7) * 0.45, lerp(0.25, 1.35, u), ZS - 0.8 + (i % 4) * 0.5); });
      retA.visible = s === 4 && p > 0.65; retB.visible = s === 4 && p > 0.82;
    });
  },
};
