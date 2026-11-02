// 旧管道怎样在里面形成新内衬 — CIPP lining by water inversion (3D)
import { THREE, COLORS as C, smooth, lerp, table, boredStrata } from '../engine.js';

const CY = -4, RO = 1.0, RI = 0.85, LR = 0.78, PX = 7, MX = 9, Z = 5, YB = -8;
const cols = [C.soil1, C.soil2, C.clay, C.soil3], hs = [1.5, 2, 2.5, 2];
const SOFT = new THREE.Color(0xe9dcae), HARD = new THREE.Color(0x4f5a3c);

export default {
  cams: [
    { pos: [3, 2.5, 11], target: [0, -4, -0.3] }, { pos: [4, 6, 18], target: [0, -2, 0] }, { pos: [3, 1, 9], target: [-1, -4.3, -0.3] },
    { pos: [3, 2, 11], target: [0, -4, -0.3] }, { pos: [3, 2, 11], target: [0, -4, -0.3] }, { pos: [4, 3, 13], target: [0, -3.6, 0] },
  ],
  phases: ['检测缺陷，区分结构损伤和功能障碍', [[0, '按方案停排、隔离并导流'], [0.5, '先选适用工法，再落实导流和有限空间防护']], '清除障碍和尖物；处理积水及渗水',
    [[0, '闭口前缘推进；已翻转段贴紧旧管'], [0.85, '软管到位仍须保压，接续固化']], [[0, '保持贴合压力，监测固化；温度均匀升高'], [0.55, '固化完成后缓慢冷却；热水工艺宜至38℃'], [0.8, '38℃是冷却要求，非加热固化温度']],
    [[0, '冷却至周围土体温度，再检验严密性等项目'], [0.5, '检查验收合格后恢复；全段内衬紧贴原管']]],
  build(k) {
    table(k, -12, 12, -Z, Z, YB);
    for (const side of [-1, 1]) {
      const g = k.group(); boredStrata(k, -PX, PX, side, Z, YB, 0, { cy: CY, r: RO }, cols, hs, g); k.part(g, { soil: true, front: side > 0 });
      for (const sx of [-1, 1]) {
        k.part(k.strata(sx < 0 ? -12 : MX, sx < 0 ? -MX : 12, YB, 0, side < 0 ? -Z : 0, side < 0 ? 0 : Z, { colors: cols, heights: hs }), { soil: true, front: side > 0 });
        const xa = sx < 0 ? -MX : PX, xb = sx < 0 ? -PX : MX;
        k.part(k.strata(xa, xb, YB, 0, side < 0 ? -Z : 1.1, side < 0 ? -1.1 : Z, { colors: cols, heights: hs }), { soil: true, front: side > 0 });
        k.part(k.box([xb - xa, CY - RO - 0.3 - YB, 1.1], [(xa + xb) / 2, YB, side * 0.55], C.soil3, { anchor: 'bottom', flat: true }), { soil: true, front: side > 0 });
      }
    }
    // manholes (open shafts with concrete walls)
    for (const sx of [-1, 1]) {
      const xa = sx < 0 ? -MX : PX, xb = sx < 0 ? -PX : MX, xo = sx < 0 ? xa : xb; const g = k.group();
      k.box([xb - xa, -CY + RO + 0.3, 0.15], [(xa + xb) / 2, CY - RO - 0.3, -1.1], C.concrete, { parent: g, anchor: 'bottom' });
      k.box([0.15, -CY + RO + 0.3, 2.2], [xo, CY - RO - 0.3, 0], C.concrete, { parent: g, anchor: 'bottom' });
      k.box([xb - xa, 0.2, 2.2], [(xa + xb) / 2, CY - RO - 0.3, 0], C.concreteDark, { parent: g, anchor: 'bottom' });
      k.part(g, { name: '检查井' });
    }
    // old pipe (half rings) + defects
    { const m = k.ring(RI, RO, 2 * PX, [0, CY, 0], 0x8c8a80, { axis: 'x', a0: -Math.PI / 2, a1: Math.PI / 2 }); m.receiveShadow = false; k.part(m, { name: '旧管' }); }
    k.part(k.ring(RI, RO, 2 * PX, [0, CY, 0], 0x8c8a80, { axis: 'x', a0: Math.PI / 2, a1: Math.PI * 1.5 }), { name: '旧管', front: true });
    const cracks = k.group(); for (const [x, a] of [[-3.5, 0.5], [1.5, -0.3], [4.5, 0.9]]) { const m = k.box([0.06, 0.9, 0.05], [x, CY + Math.sin(a) * 0.84, -Math.cos(a) * 0.84], 0x2b2b2b, { parent: cracks, emissive: C.red, ei: 0.25 }); m.rotation.x = a; m.rotation.z = 0.3; }
    k.part(cracks, { name: '缺陷', on: 0, enter: 'fade', win: [0.15, 0.6], hl: [0], off: 3, exit: 'none', outWin: [0.3, 0.31] });
    const sed = k.group(); for (const [x, w] of [[-1, 1.6], [3, 1.0]]) k.box([w, 0.22, 0.9], [x, CY - RI, 0], 0x6e5a3e, { parent: sed, anchor: 'bottom', flat: true });
    k.part(sed, { name: '沉积', hl: [0, 2], off: 2, exit: 'grow', outWin: [0.15, 0.6] });
    const puddle = k.box([2.2, 0.05, 0.7], [-4.5, CY - RI + 0.03, 0], C.water, { opacity: 0.7 }); k.part(puddle, { name: '积水', hl: [2], off: 2, exit: 'fade', outWin: [0.55, 0.8] });
    // CCTV crawler + cable
    const cam = k.group(); k.box([0.6, 0.3, 0.4], [0, CY - RI + 0.1, 0], C.machine, { parent: cam, anchor: 'bottom' }); k.cyl(0.1, 0.12, [0.32, CY - RI + 0.3, 0], 0xfff6c0, { parent: cam, axis: 'x', emissive: 0xfff2a0, ei: 1 });
    k.part(cam, { name: '摄像设备', off: 0, exit: 'fade', outWin: [0.95, 1] });
    // plugs, bypass, ventilation
    for (const x of [-PX - 0.3, PX + 0.3]) k.part(k.cyl(RI - 0.02, 0.4, [x, CY, 0], C.red, { axis: 'x', emissive: C.red, ei: 0.2 }), { name: '隔离端', on: 1, enter: 'pop', win: [0.05, 0.25], off: 5, exit: 'fade', outWin: [0.3, 0.5] });
    const by = k.group(); k.box([0.9, 0.7, 0.7], [-10.5, 0, -2.5], C.blue, { parent: by, anchor: 'bottom' }); k.tube([[-10.5, 0.7, -2.5], [-8, 0.3, -2.5], [0, 0.25, -2.6], [8, 0.3, -2.5], [10.5, 0.4, -2.5]], 0.14, 0x2f6fb0, { parent: by }); k.rod([-10.5, 0.4, -2.2], [-8.5, CY - 0.3, -0.5], 0.12, 0x2f6fb0, { parent: by });
    k.part(by, { name: '导流', on: 1, enter: 'fade', win: [0.25, 0.5], off: 5, exit: 'fade', outWin: [0.3, 0.6] });
    const vent = k.group(); k.box([0.8, 0.6, 0.6], [9.8, 0, 1.6], 0x6c7a80, { parent: vent, anchor: 'bottom' }); k.rod([9.6, 0.4, 1.4], [8.2, CY + 0.5, 0.4], 0.12, 0xb9c0c4, { parent: vent });
    k.part(vent, { name: '有限空间防护', on: 1, enter: 'fade', win: [0.55, 0.75], off: 5, exit: 'fade', outWin: [0.6, 0.8] });
    const jet = k.group(); k.mesh(new THREE.ConeGeometry(0.16, 0.45, 10).rotateZ(Math.PI / 2), C.steelLight, [0, CY - 0.3, 0], { parent: jet }); k.part(jet, { name: '清洗', on: 2, enter: 'none', win: [0, 0.01], off: 2, exit: 'none', outWin: [0.95, 0.96] });
    // liner: grows from upstream end by inversion
    const mkLiner = (a0, a1) => { const m = k.ring(LR, RI, 2 * PX, [-PX, CY, 0], SOFT.getHex(), { axis: 'x', a0, a1 }); m.geometry.translate(PX, 0, 0); m.receiveShadow = false; return m; };
    const liners = [mkLiner(-Math.PI / 2, Math.PI / 2), mkLiner(Math.PI / 2, Math.PI * 1.5)];
    liners.forEach((m, i) => k.part(m, { name: '内衬软管', on: 3, enter: 'grow', axis: 'x', win: [0.05, 0.85], front: i === 1 }));
    const tip = k.mesh(new THREE.SphereGeometry(LR + 0.02, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2).rotateZ(-Math.PI / 2), SOFT.getHex(), [0, CY, 0], { side: THREE.DoubleSide });
    const thin = k.cyl(0.22, 1, [0, CY, 0], 0xd8c98f, { axis: 'x' }); thin.geometry.translate(0.5, 0, 0);
    const tower = k.group(); k.cyl(0.35, 3.2, [-8, 0, -0.4], C.steelLight, { parent: tower, anchor: 'bottom' }); k.cyl(0.3, 2.6, [-8, 0.2, -0.4], C.water, { parent: tower, anchor: 'bottom', opacity: 0.8 });
    k.part(tower, { name: '水压翻转', on: 3, enter: 'rise', from: 2, win: [0, 0.08], off: 5, exit: 'fade', outWin: [0.2, 0.45] });
    const flow = k.box([2 * PX + 1.6, 0.1, 0.9], [0, CY - LR + 0.06, 0], C.water, { opacity: 0.6, shadow: false }); k.part(flow, { name: '恢复过流', on: 5, enter: 'grow', axis: 'x', win: [0.55, 0.9] });
    k.label('38℃是冷却要求，非加热固化温度', [2, CY + 1.6, 0], { steps: [4], win: [0.8, 1] });
    // 管道顺坡：上游（-x，翻转端）高、下游（+x）低
    k.root.rotation.z = -0.045;
    k.onUpdate((s, p, t) => {
      cam.position.x = s === 0 ? lerp(-6.5, 6, smooth(p, 0.05, 0.9)) : -6.5;
      jet.position.x = s === 2 ? lerp(PX - 0.5, -PX + 0.5, smooth(p, 0.05, 0.6)) : 0;
      const u = s < 3 ? 0 : s === 3 ? smooth(p, 0.05, 0.85) : 1; const xf = -PX + 2 * PX * u;
      tip.visible = s === 3 && u < 0.999; tip.position.x = xf;
      thin.visible = s === 3 && u > 0.02 && u < 0.99; thin.position.x = -PX - 1; thin.scale.x = Math.max(0.01, xf + PX + 0.6);
      // cure colour + heat glow
      let c = 0, heat = 0; if (s === 4) { c = smooth(p, 0.1, 0.55); heat = smooth(p, 0.05, 0.4) * (1 - smooth(p, 0.55, 0.95)); } else if (s > 4) c = 1;
      for (const m of liners) { m.material.color.copy(SOFT).lerp(HARD, c); if (heat > 0.01) { m.material.emissive.setHex(0xd9534f); m.material.emissiveIntensity = heat * (0.45 + 0.15 * Math.sin(t * 3)); } }
      tip.material.color.copy(SOFT);
    });
  },
};
