// 桥墩怎样站稳在地下 — bored pile with slurry, cap and pier (3D, vertical cut)
import { THREE, COLORS as C, smooth, lerp, table, vBoredStrata, halfCyl } from '../engine.js';

const R = 0.9, TOP = 0, BOT = -13, YB = -16, XA = -9, XB = 9, ZF = 6;
const OTHER = [-3, 3], CAP_B = -1.4, CAP_T = 0.2;

export default {
  cams: [
    { pos: [7, 6, 16], target: [0, -2, 0] }, { pos: [9, 2, 19], target: [0, -6, 0] }, { pos: [8, -2, 17], target: [0, -8, 0] },
    { pos: [9, 2, 19], target: [0, -5, 0] }, { pos: [8, -1, 18], target: [0, -7, 0] }, { pos: [10, 7, 21], target: [0, -2, 0] },
  ],
  phases: ['钻机对中、平台稳固', '钻具旋转下钻 · 泥浆护壁', [[0, '钻具提出后检孔、清孔'], [0.6, '成孔后转入检查与清孔']], [[0, '钢筋笼平稳下放'], [0.5, '再安放灌注导管'], [0.85, '灌注前复查条件']], '底口始终埋在混凝土内', [[0, '凿除超灌桩头，核查桩位与桩身质量'], [0.25, '承台把桩群连成整体'], [0.82, '墩台 → 承台 → 桩群']]],
  build(k) {
    table(k, XA, XB, -ZF, ZF, YB);
    const cols = [C.soil2, C.clay, C.sand, C.soil3, C.soil4], hs = [2.5, 3, 2.5, 3.5, 3];
    const holeW = [{ x: 0, r: R }];
    for (const side of [-1, 1]) {
      const g = k.group(); vBoredStrata(k, XA, XB, side, ZF, YB, -1.5, holeW.map(h => ({ ...h, bot: BOT })), cols, hs, g);
      k.part(g, { soil: true, front: side > 0 });
      const c = k.group(); vBoredStrata(k, -4.5, 4.5, side, 2.4, -1.5, TOP, holeW, [C.soil1], null, c);
      k.part(c, { soil: true, front: side > 0, off: 5, exit: 'grow', outWin: [0.02, 0.25] });
    }
    for (const x of [-1, 1]) k.split((a, b) => k.zbox(4.5, 1.5, a, b, x * 6.75, -1.5, C.soil1, { anchor: 'bottom', flat: true }), { soil: true }, -ZF, ZF);
    k.part(k.zbox(9, 1.5, -ZF, -2.4, 0, -1.5, C.soil1, { anchor: 'bottom', flat: true }), { soil: true });
    k.part(k.zbox(9, 1.5, 2.4, ZF, 0, -1.5, C.soil1, { anchor: 'bottom', flat: true }), { soil: true, front: true });
    const sides = [-1, 1];
    sides.forEach(sd => k.part(halfCyl(k, R, TOP - BOT, [0, BOT, 0], C.soil2, sd, { anchor: 'bottom' }), { soil: true, off: 1, exit: 'grow', outWin: [0.05, 0.9], front: sd > 0 }));
    // finished neighbouring piles: shown on the cut face in step 5
    for (const x of OTHER) k.part(k.box([2 * R, TOP - BOT - 1.4, 0.03], [x, BOT, 0.02], C.concrete, { anchor: 'bottom' }), { name: '桩群', on: 5, enter: 'fade', win: [0.05, 0.25], hl: [5] });
    // work platform, casing, mud pit + settling tank
    for (const sd of sides) k.part(k.ring(R, R + 0.12, 1.8, [0, 0.4, 0], C.steel, { a0: sd < 0 ? 0 : Math.PI, a1: sd < 0 ? Math.PI : Math.PI * 2, seg: 24, rot: [Math.PI / 2, 0, 0] }), { name: '护筒', on: 0, enter: 'drop', from: 3, win: [0.25, 0.5], hl: [0], off: 5, exit: 'fade', outWin: [0, 0.15], front: sd > 0 });
    const pit = k.group([5.5, 0.12, -3]);
    k.box([3, 0.9, 2.4], [0, 0, 0], C.concreteDark, { parent: pit, anchor: 'bottom' }); k.box([2.7, 0.05, 2.1], [0, 0.75, 0], C.slurry, { parent: pit, anchor: 'bottom' });
    k.box([0.15, 0.9, 2.4], [0, 0, 0], C.concrete, { parent: pit, anchor: 'bottom' });
    k.part(pit, { name: '泥浆循环设施', on: 0, enter: 'rise', from: 1, win: [0.55, 0.8], off: 5, exit: 'fade', outWin: [0, 0.2] });
    const pipe = k.part(k.tube([[0.3, 1.0, -0.5], [2, 1.2, -1.5], [4, 1.1, -2.5], [4.6, 1.0, -3]], 0.1, C.steelLight), { on: 1, enter: 'fade', win: [0, 0.1], off: 3, exit: 'fade', outWin: [0, 0.1] });
    void pipe;
    // slurry column: grows down with drilling, displaced upward by concrete in step 4
    const mud = sides.map(sd => k.part(halfCyl(k, R - 0.02, 1, [0, 0.6, 0], C.slurry, sd, { anchor: 'top', opacity: 0.5, shadow: false }), { name: '泥浆', on: 1, enter: 'fade', win: [0.0, 0.05], front: sd > 0, hl: [1], off: 5, exit: 'none', outWin: [0, 0.01] }));
    const sed = sides.map(sd => k.part(halfCyl(k, R - 0.03, 0.35, [0, BOT, 0], 0x4b3d30, sd, { anchor: 'bottom' }), { name: '沉渣', on: 2, enter: 'none', win: [0, 0.01], off: 2, exit: 'grow', outWin: [0.45, 0.8], front: sd > 0, hl: [2] }));
    void sed;
    // drilling rig (mast over the hole)
    const rig = k.group([-2.6, 0.12, 0]);
    k.box([2.4, 0.5, 2], [0, 0, 0], C.machineDark, { parent: rig, anchor: 'bottom' }); k.box([1.8, 1.0, 1.6], [-0.2, 0.5, 0], C.machine, { parent: rig, anchor: 'bottom' });
    k.box([0.35, 9, 0.35], [1.3, 0.5, 0], C.machine, { parent: rig, anchor: 'bottom' }); k.rod([1.3, 9.4, 0], [2.6, 9.4, 0], 0.1, C.machine, { parent: rig });
    k.part(rig, { name: '钻机', on: 0, enter: 'slide', from: [-5, 0, 0], win: [0.5, 0.85], hl: [0], off: 3, exit: 'slide', outWin: [0, 0.15] });
    const rod = k.group([0, 9.5, 0]); k.cyl(0.12, 1, [0, 0, 0], C.steelLight, { parent: rod, anchor: 'top', seg: 10 });
    const bit = k.group([0, 0, 0], rod); k.cyl(R - 0.08, 0.7, [0, 0, 0], C.machineDark, { parent: bit, anchor: 'top', seg: 16 }); for (let i = 0; i < 4; i++) { const t = k.box([1.5, 0.12, 0.12], [0, -0.7, 0], C.steel, { parent: bit }); t.rotation.y = i * Math.PI / 4; }
    k.part(rod, { name: '钻具', on: 0, enter: 'fade', win: [0.85, 0.95], off: 3, exit: 'fade', outWin: [0, 0.1] });
    // hole inspection gauge (step 2)
    // 笼式检孔器：外径接近设计孔径，吊绳下放到孔底再提出（不透明，便于在泥浆中看清）
    const gauge = k.group([0, 0, 0]);
    for (const y of [-1.1, -0.37, 0.37, 1.1]) k.ring(R - 0.16, R - 0.1, 0.06, [0, y, 0], C.steel, { parent: gauge, rot: [Math.PI / 2, 0, 0], seg: 20, metal: 0.5 });
    for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2; k.box([0.05, 2.2, 0.05], [Math.cos(a) * (R - 0.13), 0, Math.sin(a) * (R - 0.13)], C.steel, { parent: gauge, metal: 0.5 }); }
    const gWire = k.cyl(0.02, 1, [0, 0, 0], 0x222222, { seg: 6 }); gWire.geometry.translate(0, 0.5, 0);
    k.part(gauge, { name: '检孔', on: 2, enter: 'none', win: [0, 0.01], off: 3, exit: 'none', outWin: [0, 0.01] });
    // rebar cage + tremie
    const cage = k.group([0, BOT + 0.4, 0]);
    for (let i = 0; i < 14; i++) { const a = i / 14 * Math.PI * 2; k.box([0.05, TOP - BOT + 0.6, 0.05], [Math.cos(a) * (R - 0.15), 0, Math.sin(a) * (R - 0.15)], C.rebar, { parent: cage, anchor: 'bottom' }); }
    for (let y = 0.3; y < TOP - BOT + 0.4; y += 0.7) k.ring(R - 0.18, R - 0.12, 0.05, [0, y, 0], C.rebar, { parent: cage, rot: [Math.PI / 2, 0, 0], seg: 18 });
    k.part(cage, { name: '钢筋笼', on: 3, enter: 'drop', from: 14, win: [0.05, 0.5] });
    const tremie = k.group([0, 0, 0]); k.cyl(0.16, 15, [0, 2.2, 0], C.steelLight, { parent: tremie, anchor: 'top', seg: 12 }); k.cyl(0.6, 0.8, [0, 2.2, 0], C.steel, { parent: tremie, anchor: 'bottom', r2: 0.9, seg: 14 });
    k.part(tremie, { name: '导管', on: 3, enter: 'drop', from: 6, win: [0.55, 0.85], off: 5, exit: 'lift', outWin: [0, 0.15] });
    // concrete rising
    const conc = sides.map(sd => k.part(halfCyl(k, R - 0.02, TOP - BOT - 0.4, [0, BOT, 0], 0x9da5a8, sd, { anchor: 'bottom', opacity: 0.8 }), { name: '混凝土', on: 4, enter: 'grow', win: [0.05, 0.95], front: sd > 0 }));
    // cap + pier
    const cap = k.split((a, b) => k.zbox(9, CAP_T - CAP_B, a, b, 0, CAP_B, C.concreteNew, { anchor: 'bottom' }), { name: '承台', on: 5, enter: 'grow', win: [0.25, 0.55] }, -2.4, 2.4);
    void cap;
    k.split((a, b) => k.zbox(2, 7, a, b, 0, 0.2, C.concreteNew, { anchor: 'bottom' }), { name: '墩台', on: 5, enter: 'grow', win: [0.55, 0.8] }, -1.2, 1.2);
    for (const x of [0, ...OTHER]) k.part(k.arrow([x, -1.6, 0.1], [0, -1, 0], 2.2, C.red, { r: 0.08 }), { on: 5, enter: 'pop', win: [0.82, 0.95] });
    k.part(k.arrow([0, 9.6, 0.1], [0, -1, 0], 2.2, C.red, { r: 0.1 }), { on: 5, enter: 'pop', win: [0.82, 0.95] });
    k.label('护筒保护孔口', [1.6, 1.5, 0.5], { steps: [0, 1] });
    k.label('孔内泥浆', [1.8, -4, 0.3], { steps: [1, 2, 3] });
    k.label('钢筋笼先定位、固定', [1.8, -9, 0.3], { steps: [3], win: [0.45, 1] });
    k.label('承台连接桩群', [5, -1.8, 0.3], { steps: [5], win: [0.4, 1] });
    k.onUpdate((s, p, t) => {
      // drill depth
      let depth = s === 0 ? 0 : s === 1 ? smooth(p, 0.05, 0.9) : 1; // 0..1 of hole depth
      const holeBot = TOP - (TOP - BOT) * depth;
      if (s <= 2) { rod.position.y = 9.5; rod.children[0].scale.y = Math.max(0.3, 9.5 - holeBot - 0.7); bit.position.y = -(9.5 - holeBot - 0.7); bit.rotation.y = s === 1 ? t * 3 : 0; }
      if (s === 2) { rod.position.y = 9.5 + 14 * smooth(p, 0, 0.3); }
      // mud column
      const concTop = s === 4 ? BOT + (TOP - BOT - 0.4) * smooth(p, 0.05, 0.95) : s > 4 ? TOP - 0.4 : BOT;
      const mudBot = s <= 1 ? Math.min(-0.5, holeBot) : Math.max(BOT, concTop);
      mud.forEach(m => { m.scale.y = Math.max(0.01, 0.6 - mudBot); });
      // gauge lowering in step 2
      gauge.position.y = s === 2 ? lerp(2, BOT + 1, smooth(p, 0.05, 0.4)) + (2 - (BOT + 1)) * smooth(p, 0.5, 0.75) : 30;
      gWire.visible = s === 2 && gauge.position.y < 2.5; gWire.position.y = gauge.position.y + 1.1; gWire.scale.y = Math.max(0.05, 3.2 - gWire.position.y);
      if (s === 4) tremie.position.y = Math.max(BOT + 0.2, concTop - 1.5) + 12.8;
      // 第6步：先凿除超灌桩头至设计桩顶（嵌入承台约0.1m），露出的主筋锚入承台、不伸出承台顶面
      if (s >= 5) {
        const cut = s === 5 ? smooth(p, 0.08, 0.24) : 1, H = TOP - BOT - 0.4;
        conc.forEach(c => { c.scale.y = 1 - cut * (1 - (CAP_B + 0.1 - BOT) / H); c.traverse(n => { if (n.isMesh) { n.material.opacity = 1; n.material.depthWrite = true; } }); });
        cage.scale.y = (CAP_T - 0.12 - (BOT + 0.4)) / (TOP - BOT + 0.6);
      }
    });
  },
};
