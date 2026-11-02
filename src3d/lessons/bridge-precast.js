// 做好的桥梁怎样吊上去 — crane erection, simple-then-continuous (3D)
import { THREE, COLORS as C, smooth, lerp } from '../engine.js';

const CAP = 7, BH = 1.0, ZB = [-1.3, 1.3], TRUCK_Z = -5.5;
const beamY = CAP + 0.25 + BH / 2;

export default {
  cams: [
    { pos: [6, 13, 24], target: [-2, 5, -1] }, { pos: [4, 9, 20], target: [-6, 3, -3] }, { pos: [6, 12, 20], target: [-6, 6, -3] },
    { pos: [8, 14, 26], target: [0, 6, 0] }, { pos: [5, 11, 13], target: [0, 7.5, 0] }, { pos: [6, 11, 15], target: [0, 7, 0] },
  ],
  phases: [[[0, '先核支承位置与吊装条件'], [0.5, '中墩先设临时支承']], '梁、垫块与运输底座一同移动', [[0, '平稳起吊，先离开运输车'], [0.35, '移至梁位上方'], [0.65, '缓慢落到预定支承']], [[0, '支撑固定后，才解除吊具'], [0.4, '每片梁先固定，整联安装条件需满足']], '永久支座先安装，再施工湿接头', '临时支座退出，永久支座保留'],
  build(k) {
    k.box([40, 0.6, 22], [0, -0.6, 0], C.grass, { anchor: 'bottom', rough: 1 });
    k.box([41, 0.5, 23], [0, -1.1, 0], 0x9fb3a8, { anchor: 'bottom' });
    k.box([40, 0.06, 3.4], [0, 0, TRUCK_Z], C.asphalt, { anchor: 'bottom' });
    for (const [x, z] of [[-17, 7], [15, 8], [17, -8], [-16, -9]]) k.tree([x, 0, z], 1.2);
    // abutments + mid pier with cap beam
    for (const x of [-12, 12]) k.box([1.6, CAP, 6], [x + (x < 0 ? -0.4 : 0.4), 0, 0], C.concreteDark, { anchor: 'bottom' });
    for (const z of [-1.6, 1.6]) k.box([1.4, CAP - 1, 1.4], [0, 0, z], C.concrete, { anchor: 'bottom' });
    k.box([2.0, 1.0, 6], [0, CAP - 1, 0], C.concrete, { anchor: 'bottom' });
    // bearings: abutment permanent, mid pier temporary (orange) + permanent (added in step 4)
    for (const z of ZB) {
      for (const x of [-11.6, 11.6]) k.part(k.box([0.5, 0.25, 0.6], [x, CAP, z], C.steel, { anchor: 'bottom' }), { name: '支座', hl: [0], front: z > 0 });
      for (const x of [-0.6, 0.6]) k.part(k.box([0.4, 0.25, 0.6], [x, CAP, z], C.machine, { anchor: 'bottom' }), { name: '临时支座', hl: [0], off: 5, exit: 'fade', outWin: [0.3, 0.6], front: z > 0 });
      k.part(k.box([0.45, 0.25, 0.6], [0, CAP, z], C.steel, { anchor: 'bottom' }), { name: '永久支座', on: 4, enter: 'pop', win: [0.02, 0.2], hl: [4, 5], front: z > 0 });
    }
    // crane
    const cr = k.group([-6, 0, -9.5]);
    k.box([3.2, 0.9, 2.2], [0, 0, 0], C.machineDark, { parent: cr, anchor: 'bottom' }); k.box([2.4, 1.2, 2.0], [-0.3, 0.9, 0], C.machine, { parent: cr, anchor: 'bottom' });
    for (const [x, z] of [[-1.8, -1.6], [1.8, -1.6], [-1.8, 1.6], [1.8, 1.6]]) k.box([0.25, 0.3, 0.25], [x, 0, z], C.steel, { parent: cr, anchor: 'bottom' });
    k.part(cr, { name: '起重机', on: 0, enter: 'slide', from: [-12, 0, 0], win: [0.55, 0.9], hl: [0, 2] });
    const boom = k.cyl(0.18, 1, [0, 0, 0], C.machine, { seg: 10 }); boom.geometry.translate(0, 0.5, 0);
    const cable = k.cyl(0.03, 1, [0, 0, 0], 0x333333, { seg: 6 }); cable.geometry.translate(0, -0.5, 0);
    const hook = k.box([0.4, 0.4, 0.4], [0, 0, 0], C.machineDark);
    const slings = [0, 1].map(() => { const m = k.cyl(0.025, 1, [0, 0, 0], 0x333333, { seg: 6 }); m.geometry.translate(0, 0.5, 0); return m; });
    const craneBits = [boom, cable, hook, ...slings];
    // beams: B0 is the one we lift; others appear in step 3
    const beam = (x, z) => { const g = k.group([x, beamY, z]); k.box([11.4, BH, 1.4], [0, 0, 0], C.concreteNew, { parent: g }); k.box([11.4, 0.18, 2.4], [0, BH / 2, 0], C.concreteNew, { parent: g, anchor: 'bottom' }); return g; };
    const B0 = beam(-6, ZB[0]); k.part(B0, { name: '预制梁', on: 1, enter: 'none', win: [0, 0.01], hl: [1, 2] });
    for (const [x, z, i] of [[-6, ZB[1], 0], [6, ZB[0], 1], [6, ZB[1], 2]]) k.part(beam(x, z), { name: '预制梁', on: 3, enter: 'drop', from: 5, win: [0.08 + i * 0.12, 0.2 + i * 0.12], front: z > 0 });
    // truck with supports
    const tr = k.group([-6, 0, TRUCK_Z]);
    k.box([12, 0.35, 2.0], [0, 0.45, 0], C.machineDark, { parent: tr, anchor: 'bottom' }); k.box([1.6, 1.4, 2.1], [6.6, 0.45, 0], C.machine, { parent: tr, anchor: 'bottom' });
    for (const x of [-5, -3.5, 3.5, 5.2, 6.6]) for (const z of [-0.9, 0.9]) k.cyl(0.4, 0.3, [x, 0.4, z], 0x222222, { parent: tr, axis: 'z', seg: 12 });
    for (const x of [-4.6, 4.6]) k.box([0.6, 0.35, 1.6], [x, 0.8, 0], C.wood, { parent: tr, anchor: 'bottom' });
    k.part(tr, { name: '运梁车', on: 1, enter: 'none', win: [0, 0.01], hl: [1], off: 3, exit: 'fade', outWin: [0, 0.2] });
    // transverse bracing (step 3), wet joint over mid pier (step 4)
    for (const x of [-9, -3, 3, 9]) k.part(k.box([0.3, 0.6, ZB[1] - ZB[0]], [x, beamY - 0.2, 0], C.steel), { name: '横向联系', on: 3, enter: 'fade', win: [0.65, 0.85] });
    const rebar = k.group([0, beamY + 0.2, 0]);
    for (let z = -1.2; z <= 1.2; z += 0.3) k.box([0.6, 0.05, 0.05], [0, 0.3, z], C.rebar, { parent: rebar });
    for (const z of ZB) k.box([0.6, 0.12, 0.12], [0, -0.1, z], C.red, { parent: rebar, emissive: C.red, ei: 0.4 });
    k.part(rebar, { name: '湿接头', on: 4, enter: 'fade', win: [0.22, 0.4], off: 5, exit: 'none', outWin: [0, 0.01] });
    k.split((a, b) => k.zbox(0.6, BH + 0.18, a, b, 0, beamY - BH / 2, 0xc9cfc6, { anchor: 'bottom' }), { name: '湿接头', on: 4, enter: 'grow', win: [0.45, 0.75] }, -1.2, 1.2);
    k.part(k.tube([[-11, beamY - 0.3, 0.75], [-6, beamY - 0.4, 0.75], [-1, beamY + 0.35, 0.75], [1, beamY + 0.35, 0.75], [6, beamY - 0.4, 0.75], [11, beamY - 0.3, 0.75]], 0.07, C.red, { emissive: C.red, ei: 0.5 }), { name: '预应力', on: 4, enter: 'fade', win: [0.8, 0.95] });
    k.label('吊点、站位与设备由方案确定', [-6, 12, -7], { steps: [2], win: [0, 0.3] });
    k.label('吊具退出 · 梁体保持稳定', [-6, 10.5, -1.3], { steps: [3], win: [0, 0.3] });
    const v = new THREE.Vector3(), up = new THREE.Vector3(0, 1, 0);
    const span = (m, a, b) => { const d = v.subVectors(b, a); m.position.copy(a); m.scale.set(1, d.length(), 1); m.quaternion.setFromUnitVectors(up, d.clone().normalize()); };
    k.onUpdate((s, p) => {
      // truck drive in, beam lift path
      tr.position.x = s === 1 ? lerp(-26, -6, smooth(p, 0.05, 0.8)) : -6;
      let bp;
      if (s <= 1) bp = new THREE.Vector3(tr.position.x, 1.15 + 0.8 + BH / 2, TRUCK_Z);
      else if (s === 2) { const a = smooth(p, 0.03, 0.33), b = smooth(p, 0.36, 0.62), c = smooth(p, 0.66, 0.95); bp = new THREE.Vector3(-6, lerp(lerp(2.45, beamY + 2, a), beamY, c), lerp(TRUCK_Z, ZB[0], b)); }
      else bp = new THREE.Vector3(-6, beamY, ZB[0]);
      B0.position.copy(bp);
      const hooked = s === 2 || (s === 1 && p > 0.85) || (s === 3 && p < 0.3);
      craneBits.forEach(m => { m.visible = hooked && (s > 0); });
      const pivot = new THREE.Vector3(-6, 2.2, -9.5);
      const hookP = bp.clone().add(new THREE.Vector3(0, 2.6 + (s === 3 ? 2.5 * smooth(p, 0.1, 0.3) : 0), 0));
      const tip = new THREE.Vector3(hookP.x, Math.max(15, hookP.y + 3), hookP.z);
      span(boom, pivot, tip); span(cable, tip, tip); cable.position.copy(tip); cable.scale.set(1, tip.y - hookP.y, 1); cable.quaternion.identity();
      hook.position.copy(hookP);
      [-4.5, 4.5].forEach((dx, i) => span(slings[i], bp.clone().add(new THREE.Vector3(dx, BH / 2 + 0.2, 0)), hookP));
    });
  },
};
