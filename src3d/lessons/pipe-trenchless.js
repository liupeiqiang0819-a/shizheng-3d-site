// 不开长沟，管道怎样穿过道路 — pipe jacking vs HDD (3D, translucent ground)
import { THREE, COLORS as C, smooth, lerp, table } from '../engine.js';

const JZ = -2.4, JY = -5, HZ = 3.2, PL = 2.0, HEAD = 2.0, XS = -9, XR = 9;
const ARC = [[-13, 0.3], [-9.5, -3.2], [-5, -5.6], [0, -6.3], [5, -5.6], [9.5, -3.2], [13, 0.3]].map(([x, y]) => new THREE.Vector3(x, y, HZ));

export default {
  view: { section: false, xray: true }, fitExp: 1.2,
  cams: [
    { pos: [4, 10, 24], target: [0, -3.5, 0] }, { pos: [-2, 5, 13], target: [-9, -4, -2.4] }, { pos: [3, 4, 17], target: [-1, -4.5, -2.4] },
    { pos: [3, 5, 22], target: [-2, -3.5, 2] }, { pos: [5, 5, 22], target: [2, -3.5, 2] }, { pos: [4, 10, 24], target: [0, -3.5, 0] },
  ],
  phases: ['两种独立路线：顶管与定向钻不能串成一道工序', [[0, '后背承受反力；导轨控制轴线'], [0.6, '洞口止水与土体稳定先具备条件']], [[0, '整列管节一起推进：接口间距不变'], [0.5, '橙色：顶推；绿色：管外减阻泥浆']], [[0, '钻头前进到哪里，钻杆才跟到哪里'], [0.6, '导向孔阶段：地下还没有成品管']], [[0, '扩孔、清孔合格后，及时连续回拖'], [0.3, '钻杆 → 扩孔器 → 回拖接头 → 成品管']], '两条成管路线分别检验；贯通不等于可投运'],
  build(k) {
    table(k, -15, 15, -7, 7, -10);
    k.split((a, b) => k.strata(-15, 15, -10, 0, a, b, { colors: [C.soil1, C.soil2, C.clay, C.soil3], heights: [2, 2.5, 3, 2.5] }), { soil: true }, -7, 7);
    k.box([6, 0.1, 14], [0, 0, 0], C.asphalt, { anchor: 'bottom' }); for (let z = -6; z < 7; z += 2.2) k.box([0.15, 0.02, 1.1], [0, 0.1, z], C.white);
    const cars = [[-1.4, 0x4d7fb8, 1], [1.4, 0xc9504a, -1]].map(([x, col, d]) => { const g = k.group([x, 0.1, 0]); g.rotation.y = Math.PI / 2 * d; k.box([1.6, 0.45, 0.8], [0, 0.15, 0], col, { parent: g, anchor: 'bottom' }); k.box([0.9, 0.35, 0.72], [-0.1, 0.6, 0], 0xdfe8ee, { parent: g, anchor: 'bottom' }); g.userData.d = d; return g; });
    // route ghosts (step 0)
    k.part(k.cyl(0.75, XR - XS, [0, JY, JZ], C.machine, { axis: 'x', opacity: 0.25, shadow: false }), { name: '顶管路线', on: 0, enter: 'fade', win: [0.05, 0.4], off: 1, exit: 'fade', outWin: [0, 0.2], hl: [0] });
    k.part(k.tube(ARC.map(v => v.toArray()), 0.25, C.green, { opacity: 0.3, shadow: false }), { name: '定向钻路线', on: 0, enter: 'fade', win: [0.4, 0.75], off: 1, exit: 'fade', outWin: [0, 0.2], hl: [0] });
    // shafts
    for (const [x0, x1, nm] of [[-12, -8.2, '工作井'], [8.6, 11.2, '接收井']]) {
      const g = k.group(); const w = 0.35, h = 7.5, zc = JZ, d = 3.4;
      k.box([x1 - x0, h, w], [(x0 + x1) / 2, -h + 0.4, zc - d / 2], C.concrete, { parent: g, anchor: 'bottom' });
      k.box([x1 - x0, h, w], [(x0 + x1) / 2, -h + 0.4, zc + d / 2], C.concrete, { parent: g, anchor: 'bottom', opacity: 0.35 });
      for (const x of [x0, x1]) k.box([w, h, d], [x, -h + 0.4, zc], C.concrete, { parent: g, anchor: 'bottom', opacity: x === (nm === '工作井' ? x1 : x0) ? 0.35 : 1 });
      k.box([x1 - x0, 0.4, d], [(x0 + x1) / 2, -h + 0.4, zc], C.concreteDark, { parent: g, anchor: 'bottom' });
      k.part(g, { name: nm, on: 1, enter: 'rise', from: 3, win: [0.05, 0.4], hl: [1] });
    }
    const back = k.box([0.5, 3, 3], [-11.6, JY, JZ], C.steel); k.part(back, { name: '后背', on: 1, enter: 'pop', win: [0.4, 0.55] });
    for (const z of [-0.6, 0.6]) k.part(k.box([3.6, 0.15, 0.15], [-10, JY - 0.85, JZ + z], C.steelLight), { name: '导轨', on: 1, enter: 'fade', win: [0.55, 0.7] });
    const jacks = [-0.45, 0.45].map(z => { const m = k.cyl(0.14, 1, [-11.35, JY, JZ + z], C.machine, { axis: 'x' }); m.geometry.translate(0.5, 0, 0); return m; });
    jacks.forEach(m => k.part(m, { name: '千斤顶', on: 1, enter: 'fade', win: [0.7, 0.85], hl: [2] }));
    // jacking train
    const head = k.group([XS, JY, JZ]); k.cyl(0.8, HEAD, [-HEAD / 2, 0, 0], C.machine, { parent: head, axis: 'x' }); k.cyl(0.82, 0.25, [0, 0, 0], C.machineDark, { parent: head, axis: 'x' });
    k.part(head, { name: '机头', on: 2, enter: 'none', win: [0, 0.01], hl: [2] });
    const pipes = []; for (let i = 0; i < 9; i++) { const m = k.cyl(0.75, PL - 0.06, [0, JY, JZ], i % 2 ? C.concrete : C.concreteNew, { axis: 'x' }); pipes.push(m); }
    const slurry = k.cyl(0.92, 1, [0, JY, JZ], C.green, { axis: 'x', opacity: 0.3, shadow: false }); slurry.geometry.translate(0.5, 0, 0);
    const thrust = k.arrow([-11, JY + 1.3, JZ], [1, 0, 0], 2.2, C.machine, { r: 0.08 });
    // HDD
    const curve = new THREE.CatmullRomCurve3(ARC, false, 'catmullrom', 0.3);
    const rodTube = k.mesh(new THREE.TubeGeometry(curve, 120, 0.09, 8, false), C.steelLight, [0, 0, 0]);
    const prodTube = k.mesh(new THREE.TubeGeometry(curve, 120, 0.45, 14, false), 0x2d2f33, [0, 0, 0]);
    const tip = k.group(); k.mesh(new THREE.ConeGeometry(0.22, 0.6, 10).rotateZ(-Math.PI / 2), C.machineDark, [0, 0, 0], { parent: tip });
    const reamer = k.group(); k.mesh(new THREE.ConeGeometry(0.55, 1.1, 14).rotateZ(Math.PI / 2), C.machine, [0, 0, 0], { parent: reamer });
    const rig = k.group([-14.2, 0, HZ]); k.box([2.6, 0.6, 1.6], [0, 0, 0], C.machineDark, { parent: rig, anchor: 'bottom' }); const mast = k.box([3.6, 0.3, 0.5], [0.8, 0.8, 0], C.machine, { parent: rig }); mast.rotation.z = -0.25; k.box([1.0, 1.0, 1.4], [-0.9, 0.6, 0], C.machine, { parent: rig, anchor: 'bottom' });
    k.part(rig, { name: '钻机', on: 3, enter: 'slide', from: [-6, 0, 0], win: [0, 0.15] });
    const locator = k.group(); k.box([0.3, 1.2, 0.3], [0, 0, 0], C.blue, { parent: locator, anchor: 'bottom' });
    const onSurf = k.cyl(0.45, 10, [18, 0.45, HZ], 0x2d2f33, { axis: 'x' });
    k.label('后背承受反力；导轨控制轴线', [-10.5, -1.5, JZ], { steps: [1] });
    k.label('展示一个顶进冲程；随后退缸、续接管节', [-6, 1.4, JZ], { steps: [2], win: [0.6, 1] });
    k.label('预制管向画外延续', [16, 1.8, HZ], { steps: [4] });
    k.label('顶管：端部处理、线形与功能检验', [0, -3.4, JZ], { steps: [5] });
    k.label('定向钻：回拖后成管检查、对应试验', [0, -7.6, HZ], { steps: [5] });
    k.onUpdate((s, p, t, st) => {
      cars.forEach((c, i) => { c.position.z = (((t * 2.2 * c.userData.d + i * 5) % 14) + 14) % 14 - 7; });
      // jacking: head front position
      const xh = s < 2 ? XS : s === 2 ? lerp(XS, XR + 0.8, smooth(p, 0.05, 0.95)) : XR + 0.8;
      head.position.x = xh; head.visible = s >= 2;
      let last = xh - HEAD;
      pipes.forEach((m, i) => { const xr = xh - HEAD - i * PL, xl = xr - PL; const vis = s >= 2 && xl >= -10.8; m.visible = vis; m.position.x = (xl + xr) / 2; if (vis) last = Math.min(last, xl); });
      slurry.visible = s >= 2; slurry.position.x = -8.2; slurry.scale.x = Math.max(0.01, xh - HEAD - (-8.2));
      jacks.forEach(m => { m.scale.x = s >= 2 ? Math.max(0.2, last - (-11.35)) : 0.5; });
      thrust.visible = s === 2;
      // HDD pilot / pullback
      const pilot = s < 3 ? 0 : s === 3 ? smooth(p, 0.05, 0.95) : 1;
      rodTube.visible = s >= 3; rodTube.geometry.setDrawRange(0, Math.floor(pilot * 120) * 48);
      tip.visible = s === 3; const tp = curve.getPointAt(Math.max(0.001, pilot)); tip.position.copy(tp); tip.lookAt(curve.getPointAt(Math.min(1, pilot + 0.01))); tip.rotateY(-Math.PI / 2);
      locator.visible = s === 3; locator.position.set(tp.x, 0.1, HZ + 1.2);
      const pull = s < 4 ? 0 : s === 4 ? smooth(p, 0.05, 0.95) : 1; // fraction from the exit side
      prodTube.visible = s >= 4; prodTube.geometry.setDrawRange((120 - Math.floor(pull * 120)) * 84, 120 * 84); // 成品管 14 边形截面：每段 14×6 个索引，与扩孔器位置对齐
      reamer.visible = s === 4; const ru = Math.min(0.999, Math.max(0.011, 1 - pull)), rp = curve.getPointAt(ru); reamer.position.copy(rp); reamer.lookAt(curve.getPointAt(ru - 0.01)); reamer.rotateY(Math.PI / 2);
      onSurf.visible = s === 4; onSurf.position.x = 18 - 10 * pull;
      void st;
    });
  },
};
