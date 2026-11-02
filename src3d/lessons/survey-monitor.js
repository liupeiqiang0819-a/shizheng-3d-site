// 怎样把图纸落到现场，并发现施工中的变化 — survey control, setting-out and monitoring (3D)
import { THREE, COLORS as C, smooth, lerp } from '../engine.js';
import { pitGround, pitWalls, lift, person, tripod } from './common.js';

const PX = 4.5, PZ = 3.2, BASE = -6, TS = [-7.5, 0, 5.5];
const W = ['看场外控制桩与仪器的连线，先确认参照体系。', '看测站照准的位置怎样落成轴线桩与高程标记。', '分清参照用基准点与随被测对象布置的监测点。', '看支护和建筑监测点，不把单次读数当最终结论。', '看位移箭头与趋势线。', '看建成实体与实测轮廓，和设计放样起点作对照。'];

export default {
  cams: [
    { pos: [4, 13, 21], target: [0, -1, 0] }, { pos: [3, 11, 17], target: [0, -1, 0] }, { pos: [6, 10, 18], target: [1, -1, -1] },
    { pos: [7, 6, 17], target: [0, -3, 0] }, { pos: [7, 7, 16], target: [1, -2, -1] }, { pos: [6, 9, 18], target: [0, -1.5, 0] },
  ],
  phases: W,
  build(k) {
    pitGround(k, { px: PX, pz: PZ, base: BASE, X: 12, Z: 8, yb: -9, hs: [1.5, 2, 2.5, 2, 1] });
    lift(k, PX, PZ, 0, -2, 3, [0.05, 0.3], C.soil1); lift(k, PX, PZ, -2, -4, 3, [0.4, 0.62], C.soil2); lift(k, PX, PZ, -4, BASE, 3, [0.7, 0.9], C.clay);
    k.building([7.5, 0, -5.5], [3.2, 4.2, 3]);
    // control pillars outside the site + total station
    const pillars = [[-11, 7], [11, 7], [-11, -7]];
    pillars.forEach(([x, z]) => { const g = k.group([x, 0, z]); k.box([0.5, 1.1, 0.5], [0, 0, 0], C.concrete, { parent: g, anchor: 'bottom' }); k.cyl(0.08, 0.12, [0, 1.1, 0], C.red, { parent: g, anchor: 'bottom', emissive: C.red, ei: 0.4 }); k.part(g, { name: '控制桩', hl: [0] }); });
    const ts = tripod(k, TS); k.part(ts, { name: '仪器', hl: [0, 1] }); const op = person(k, [TS[0] - 0.7, 0, TS[2] + 0.3]); void op;
    const eye = new THREE.Vector3(TS[0], 1.5, TS[2]);
    const line = (to, col = C.red) => { const m = k.cyl(0.03, 1, [0, 0, 0], col, { emissive: col, ei: 0.8, shadow: false, seg: 6 }); m.geometry.translate(0, 0.5, 0); const d = new THREE.Vector3(...to).sub(eye); m.position.copy(eye); m.scale.y = d.length(); m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize()); return m; };
    pillars.forEach(([x, z]) => k.part(line([x, 1.2, z]), { name: '', on: 0, enter: 'grow', win: [0.3, 0.6], off: 1, exit: 'fade', outWin: [0, 0.2] }));
    // setting out: axis stakes, axis lines and level marks
    const stakes = [[-PX - 1.2, 0], [PX + 1.2, 0], [0, -PZ - 1.2], [0, PZ + 1.2]];
    stakes.forEach(([x, z], i) => { const g = k.group([x, 0, z]); k.box([0.12, 0.6, 0.12], [0, 0, 0], C.wood, { parent: g, anchor: 'bottom' }); k.box([0.16, 0.06, 0.16], [0, 0.6, 0], C.red, { parent: g, emissive: C.red, ei: 0.4 }); k.part(g, { name: '轴线桩', on: 1, enter: 'pop', win: [0.1 + i * 0.1, 0.2 + i * 0.1], hl: [1, 5] }); });
    k.part(k.box([2 * PX + 2.4, 0.03, 0.06], [0, 0.02, 0], C.white, { emissive: 0xffffff, ei: 0.4 }), { name: '轴线', on: 1, enter: 'grow', axis: 'x', win: [0.5, 0.7] });
    k.part(k.box([0.06, 0.03, 2 * PZ + 2.4], [0, 0.02, 0], C.white, { emissive: 0xffffff, ei: 0.4 }), { name: '轴线', on: 1, enter: 'grow', axis: 'z', win: [0.6, 0.8] });
    stakes.forEach(([x, z], i) => k.part(line([x, 0.6, z], 0xe9762b), { on: 1, enter: 'grow', win: [0.05 + i * 0.1, 0.15 + i * 0.1], off: 2, exit: 'fade', outWin: [0, 0.2] }));
    const lvl = k.group([-PX - 1.2, 0.35, 0.12]); k.mesh(new THREE.ConeGeometry(0.12, 0.2, 3).rotateX(Math.PI), 0xe9762b, [0, 0, 0], { parent: lvl }); k.part(lvl, { name: '高程标记', on: 1, enter: 'pop', win: [0.8, 0.9] });
    // supports + monitoring points; benchmarks are away from the pit
    pitWalls(k, { px: PX, pz: PZ, bottom: -8.5, on: 2, win: [0.02, 0.3], name: '支护' });
    const bms = [[-10, -3], [10, 3]].map(([x, z]) => { const g = k.group([x, 0, z]); k.cyl(0.2, 0.25, [0, 0, 0], C.blue, { parent: g, anchor: 'bottom', emissive: C.blue, ei: 0.3 }); return k.part(g, { name: '基准点', on: 2, enter: 'pop', win: [0.35, 0.5] }); });
    const mps = [[-PX - 0.3, -PZ - 0.3], [0, -PZ - 0.3], [PX + 0.3, -PZ - 0.3], [-PX - 0.3, 0], [PX + 0.3, 0], [0, PZ + 0.3]];
    const mpObjs = mps.map(([x, z], i) => { const g = k.group([x, 0.3, z]); k.cyl(0.06, 0.4, [0, 0, 0], C.white, { parent: g, anchor: 'bottom', seg: 8 }); k.mesh(new THREE.SphereGeometry(0.14, 10, 8), C.red, [0, 0.45, 0], { parent: g, emissive: C.red, ei: 0.4 }); k.part(g, { name: '监测点', on: 2, enter: 'pop', win: [0.55 + i * 0.05, 0.62 + i * 0.05], front: z > PZ, hl: [2, 3] }); return g; });
    for (const [x, y, z] of [[7.5 - 1.6, 3.2, -4.2], [7.5 - 1.6, 1.6, -4.2]]) { const m = k.mesh(new THREE.SphereGeometry(0.14, 10, 8), C.red, [x, y, z], { emissive: C.red, ei: 0.4 }); k.part(m, { name: '监测点', on: 2, enter: 'pop', win: [0.85, 0.95], hl: [2, 3] }); }
    // struts (step 3)
    for (const [y, w] of [[-1.2, [0.32, 0.38]], [-3.6, [0.64, 0.7]]]) { const g = k.group(); for (const x of [-2.5, 0, 2.5]) k.cyl(0.14, 2 * PZ, [x, y, 0], C.machine, { parent: g, axis: 'z' }); k.part(g, { name: '支撑', on: 3, enter: 'fade', win: w, off: 5, exit: 'fade', outWin: [0, 0.2] }); }
    const obs = mps.map(([x, z]) => line([x, 0.75, z], 0xe9762b));
    // displacement arrows + trend board
    const disp = mps.slice(0, 3).map(([x, z]) => k.arrow([x, 1.1, z], [0, 0, 1], 0.9, 0xe9762b, { r: 0.06 }));
    const board = k.group([-6.5, 0, -6.6]); k.box([3.2, 2.0, 0.1], [0, 0.6, 0], 0xf5f5f0, { parent: board, anchor: 'bottom' }); k.box([0.05, 1.6, 0.05], [-1.4, 0.8, 0.08], 0x444444, { parent: board, anchor: 'bottom' }); k.box([2.8, 0.05, 0.05], [0, 0.8, 0.08], 0x444444, { parent: board });
    const pts = []; for (let i = 0; i <= 12; i++) { const u = i / 12; pts.push(new THREE.Vector3(-1.4 + 2.8 * u, 0.8 + 1.3 * (u * u * 0.7 + u * 0.2), 0.09)); }
    const trend = k.mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 48, 0.035, 6), 0xd9534f, [0, 0, 0], { parent: board, emissive: 0xd9534f, ei: 0.4 });
    k.part(board, { name: '趋势线', on: 4, enter: 'pop', win: [0.0, 0.15], off: 5, exit: 'fade', outWin: [0, 0.2] });
    // as-built structure + measured outline
    k.part(k.box([2 * PX - 0.6, -BASE - 0.2, 2 * PZ - 0.6], [0, BASE, 0], C.concreteNew, { anchor: 'bottom' }), { name: '建成实体', on: 5, enter: 'grow', win: [0.05, 0.45], hlSoft: 0.4 });
    const outline = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(2 * PX - 0.5, -BASE - 0.1, 2 * PZ - 0.5)), new THREE.LineBasicMaterial({ color: 0xe9762b }));
    outline.position.set(0.06, BASE / 2 - 0.05, 0.05); k.root.add(outline);
    k.label('控制桩', [-11, 1.8, 7], { steps: [0] }); k.label('基准点', [-10, 0.9, -3], { steps: [2] }); k.label('监测点', [0, 1.3, -PZ - 0.3], { steps: [2, 3] });
    k.label('趋势线', [-6.5, 2.9, -6.6], { steps: [4] }); k.label('实测轮廓', [PX, 0.8, PZ], { steps: [5], win: [0.5, 1] });
    k.onUpdate((s, p, t) => {
      obs.forEach((m, i) => { m.visible = s === 3 && Math.sin(t * 3 + i) > 0.2; });
      disp.forEach(a => { a.visible = s === 4; a.scale.setScalar(0.4 + 0.8 * smooth(p, 0.1, 0.8)); });
      trend.geometry.setDrawRange(0, s === 4 ? Math.floor(48 * smooth(p, 0.15, 0.9)) * 36 : 48 * 36);
      outline.visible = s === 5 && p > 0.5;
      mpObjs.forEach(g => { g.visible = g.visible && !(s === 5 && p > 0.6); });
    });
  },
};
