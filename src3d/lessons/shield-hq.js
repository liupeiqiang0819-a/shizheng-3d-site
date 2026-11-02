// 盾构 — 精致画质 model (same steps / names / labels / highlights as shield.js; only geometry, materials and motion are richer)
import { THREE, COLORS as C, smooth, lerp, table, boredStrata, grainTex } from '../engine.js';

const CY = -8, RB = 2.15, RS = 2.1, RSI = 1.97, RO = 1.94, RI = 1.66, TL = 4.6, RW = 1.2, GRID0 = -18.2;
const XF = [[-11.7, -11.7], [-11.7, -7.0], [-7.0, -1.6], [-1.6, -1.6], [-1.6, 3.2], [3.2, 18.7]];
const MOVE = [[0, 1], [0.05, 0.95], [0.03, 0.97], [0, 1], [0.05, 0.95], [0.02, 0.72]];
const BACK = [-Math.PI / 2, Math.PI / 2], FRONT = [Math.PI / 2, Math.PI * 1.5];
const SHELL = 0x587884, PAINT = 0xf0b92a, DARK = 0x30363c, CHROME = 0xd7dde0, RUBBER = 0x24282c, BLUEP = 0x3e6d8c;
// erection order inside one ring: bottom pair → side pairs → top pair (same grouping as the basic model)
const ARCS = [[-90, -30, 0], [210, 270, 0], [-30, 30, 1], [150, 210, 1], [30, 90, 2], [90, 150, 2]];
const SEQ = [0, 1, 2, 3, 4, 5]; const T0 = 0.1, DT = 0.12, WIN = 0.11;   // segment j lands at T0 + j*DT
const segT = j => T0 + (SEQ.indexOf(j) + 1) * DT;

export function buildHQ(k) {
  const grain = grainTex(), cgrain = grainTex('concrete');
  table(k, -20, 20, -6, 6, -14);
  const bore = { cy: CY, r: RB };
  const cols = [0xd9a160, 0xc0824a, 0xa86a40, 0x8a5d3c], hs = [2.5, 3, 3.5, 5];
  const imp = [0xc2b49a, 0xb1a186, 0xa69479, 0x968670];
  for (const side of [-1, 1]) {
    const opt = side > 0 ? { soil: true, front: true } : { soil: true };
    for (const [x0, x1, c, nm, hl] of [[-11, -8, imp, '端头加固', [0]], [-8, 8, cols], [8, 11, imp, '端头加固', [5]]]) {
      const g = k.group(); boredStrata(k, x0, x1, side, 6, -14, 0, bore, c, hs, g);
      k.part(g, { ...opt, name: nm || '', hl: hl || [] });
    }
    // thin paved/grass skin on the ground surface
    const sk = k.group(); k.zbox(22, 0.07, side < 0 ? -6 : 0, side < 0 ? 0 : 6, 0, 0, 0xa9b08a, { parent: sk, anchor: 'bottom', sharp: true, rough: 0.95 }); k.part(sk, { ...opt });
  }
  const conc = 0xb4b9b3, cOpt = { map: cgrain, rough: 0.9, env: 0.4 };
  const shaft = (x0, x1, portalX, nm) => {
    k.split((a, b) => k.zbox(x1 - x0, 1, a, b, (x0 + x1) / 2, -12, conc, { anchor: 'bottom', ...cOpt }), {}, -4.1, 4.1);
    const endX = portalX < 0 ? x0 : x1 - 0.6;
    k.split((a, b) => k.zbox(0.6, 12.4, a, b, endX + 0.3, -12, conc, { anchor: 'bottom', ...cOpt }), {}, -4.1, 4.1);
    k.part(k.zbox(x1 - x0, 12.4, -4.1, -3.5, (x0 + x1) / 2, -12, conc, { anchor: 'bottom', ...cOpt }), {});
    k.part(k.zbox(x1 - x0, 12.4, 3.5, 4.1, (x0 + x1) / 2, -12, conc, { anchor: 'bottom', ...cOpt }), { front: true });
    for (const side of [-1, 1]) { const g = k.group(); boredStrata(k, portalX - 0.3, portalX + 0.3, side, 4.1, -12, 0.4, { cy: CY, r: 2.45 }, [conc], null, g); g.traverse(n => { if (n.isMesh) { n.material.map = cgrain; n.material.roughness = 0.88; } }); k.part(g, { front: side > 0 }); }
    for (const [a0, a1, front] of [[...BACK, false], [...FRONT, true]]) k.part(k.ring(2.1, 2.45, 0.25, [portalX + (portalX < 0 ? -0.42 : 0.42), CY, 0], RUBBER, { axis: 'x', a0, a1, rough: 0.55, bevel: 0.04 }), { name: '洞门密封', hl: nm === 'launch' ? [0] : [5], front });
    // cradle: two steel girders + guide rails
    const cr = k.group([portalX < 0 ? x0 + 3.9 : x1 - 3.9, -11, 0]);
    for (const z of [-0.85, 0.85]) { k.box([5.2, 0.7, 0.42], [0, 0, z], C.steel, { parent: cr, anchor: 'bottom' }); k.box([5.2, 0.12, 0.16], [0, 0.7, z * 0.92], CHROME, { parent: cr, anchor: 'bottom', metal: 0.9, rough: 0.25 }); }
    for (let x = -2.2; x <= 2.21; x += 1.1) k.box([0.22, 0.5, 1.5], [x, 0, 0], C.steel, { parent: cr, anchor: 'bottom' });
    k.part(cr, { name: nm === 'launch' ? '始发基座' : '接收基座', hl: nm === 'launch' ? [0] : [5] });
  };
  shaft(-19.6, -11, -11.3, 'launch'); shaft(11, 19.6, 11.3, 'receive');
  // reaction frame (box-section steel, braced)
  const rf = k.group([-18.4, CY, 0]);
  for (const z of [-2.4, 2.4]) k.box([0.45, 5.6, 0.45], [0, 0, z], C.steel, { parent: rf });
  for (const y of [-2.6, 2.6]) k.box([0.45, 0.45, 5.2], [0, y, 0], C.steel, { parent: rf });
  for (const [y, z] of [[-2.2, -2], [2.2, 2]]) k.rod([0, y, z], [0, -y * 0.25, -z * 0.25], 0.09, C.steelLight, { parent: rf });
  k.rod([-0.2, -2.6, -2.4], [-1, -3, -2.4], 0.12, C.steel, { parent: rf }); k.rod([-0.2, 2.6, -2.4], [-1, 3.6, -2.4], 0.12, C.steel, { parent: rf });
  k.part(rf, { name: '反力架', hl: [0] });
  // surface
  k.box([4, 0.08, 12], [2, 0.08, 0], C.asphalt, { sharp: true, rough: 0.9, map: grain }); for (let z = -5.5; z < 6; z += 2) k.box([0.12, 0.02, 1], [2, 0.13, z], C.white, { sharp: true });
  k.building([-5.5, 0.07, -3.8], [3.2, 5, 3]); k.building([7, 0.07, -3.8], [3, 7, 3], 0xd2d8dc);
  k.tree([-2, 0.07, -4.5]); k.tree([-1, 0.07, -5.2], 0.8); k.part(k.tree([-7, 0.07, 4], 1.1), { front: true }); k.part(k.truck([2.5, 0.12, 2.2], Math.PI / 2), { front: true });
  for (let x = -9; x <= 9; x += 3) { const g = k.group([x, 0.07, -0.6]); k.cyl(0.06, 0.5, [0, 0, 0], C.white, { parent: g, anchor: 'bottom', seg: 12 }); const b = k.mesh(new THREE.SphereGeometry(0.15, 20, 14), C.red, [0, 0.55, 0], { parent: g, emissive: C.red, ei: 0.35, rough: 0.3 }); b.castShadow = true; k.part(g, { name: '监测点', hl: [2] }); }

  // ================= TBM
  const T = k.group([0, CY, 0]);
  for (const [a0, a1, front] of [[...BACK, false], [...FRONT, true]]) {
    const sg = k.group([0, 0, 0], T);
    k.ring(RSI, RS, TL, [-TL / 2, 0, 0], SHELL, { axis: 'x', a0, a1, parent: sg, metal: 0.5, rough: 0.38, clearcoat: 0.35, bevel: 0.03, env: 0.6, side: THREE.DoubleSide });
    for (const x of [-1.55, -3.15]) k.ring(RS - 0.02, RS + 0.025, 0.1, [x, 0, 0], 0x5d6c74, { axis: 'x', a0, a1, parent: sg, metal: 0.8, rough: 0.35 });
    k.ring(RO + 0.005, RSI, 0.22, [-TL + 0.14, 0, 0], RUBBER, { axis: 'x', a0, a1, parent: sg, rough: 0.6 }); // tail brush seal
    k.part(sg, { name: '盾构', hl: [0], front, hlSoft: 0.7 });
    k.part(k.ring(0.01, RSI, 0.9, [-0.75, 0, 0], C.slurry, { axis: 'x', a0, a1, parent: T, rough: 0.45, map: grain }), { name: '土仓', hl: [1, 2], front });
    k.part(k.ring(0.01, RSI, 0.14, [-1.27, 0, 0], DARK, { axis: 'x', a0, a1, parent: T, metal: 0.5, rough: 0.45 }), { front });
  }
  // cutterhead: rim, 6 spokes with disc cutters & scrapers, face plates with muck openings, centre fish-tail
  const head = k.group([-0.15, 0, 0], T);
  k.ring(1.8, 2.05, 0.42, [0.05, 0, 0], PAINT, { axis: 'x', parent: head, bevel: 0.035, rough: 0.42, seg: 72 });
  k.cyl(1.95, 0.1, [-0.14, 0, 0], DARK, { parent: head, axis: 'x', seg: 48, metal: 0.4, rough: 0.5 });
  k.cyl(0.42, 0.42, [0.18, 0, 0], PAINT, { parent: head, axis: 'x', rough: 0.42 });
  k.cyl(0.32, 0.5, [0.62, 0, 0], C.steelLight, { parent: head, axis: 'x', r2: 0.03, seg: 28 });
  for (let i = 0; i < 6; i++) {
    const arm = new THREE.Group(); arm.rotation.x = i * Math.PI / 3; head.add(arm);
    k.box([0.36, 1.5, 0.46], [0.16, 1.1, 0], PAINT, { parent: arm, round: 0.06, rough: 0.42 });
    for (const [j, r] of [0.62, 0.98, 1.34, 1.72].entries()) {
      const z = j % 2 ? 0.1 : -0.1;
      k.cyl(0.13, 0.07, [0.4, r, z], CHROME, { parent: arm, axis: 'z', seg: 24, metal: 0.95, rough: 0.22 });
      k.cyl(0.05, 0.16, [0.4, r, z], DARK, { parent: arm, axis: 'z', seg: 10 });
    }
    for (let r = 0.55; r < 1.85; r += 0.26) for (const z of [-0.27, 0.27]) k.box([0.13, 0.16, 0.09], [0.36, r, z], 0x4b5258, { parent: arm, round: 0.025, metal: 0.6, rough: 0.35 });
    const a = i * Math.PI / 3 + Math.PI / 6;
    k.ring(0.5, 1.72, 0.1, [0.2, 0, 0], PAINT, { axis: 'x', parent: head, a0: a - 0.26, a1: a + 0.26, seg: 16, rough: 0.45 });
  }
  k.part(head, { name: '刀盘', hl: [2], hlSoft: 0.8 });
  // screw conveyor: half casing (cut open towards the viewer), rotating helical flight, drive and outlet
  const SA = new THREE.Vector3(-1.2, -1.45, -0.55), SB = new THREE.Vector3(-4.6, 0.2, -0.55), SL = SA.distanceTo(SB);
  const scr = k.group(SA.toArray(), T); scr.quaternion.setFromUnitVectors(new THREE.Vector3(1, 0, 0), SB.clone().sub(SA).normalize());
  const cg = new THREE.CylinderGeometry(0.34, 0.34, SL, 36, 1, true, Math.PI / 2, Math.PI); cg.rotateZ(-Math.PI / 2); cg.translate(SL / 2, 0, 0);
  k.mesh(cg, C.steelLight, [0, 0, 0], { parent: scr, side: THREE.DoubleSide, metal: 0.7, rough: 0.35 });
  for (const x of [0.05, SL - 0.05]) k.ring(0.33, 0.4, 0.1, [x, 0, 0], C.steel, { axis: 'x', parent: scr });
  const flight = new THREE.Group(); scr.add(flight);
  const hp = []; const turns = SL / 0.3; for (let i = 0; i <= 200; i++) { const u = i / 200, a = u * turns * Math.PI * 2; hp.push([0.08 + u * (SL - 0.16), Math.cos(a) * 0.24, Math.sin(a) * 0.24]); }
  k.tube(hp, 0.045, CHROME, { parent: flight, segs: 400, rseg: 8, tension: 0, metal: 0.9, rough: 0.25 });
  k.cyl(0.07, SL - 0.1, [SL / 2, 0, 0], C.steel, { parent: flight, axis: 'x' });
  k.box([0.5, 0.42, 0.42], [SL + 0.2, 0, 0], BLUEP, { parent: scr, round: 0.06, rough: 0.4 });
  k.part(scr, { name: '螺旋机', hl: [2] });
  // thrust jacks: painted barrel + chrome rod + rubber shoe
  const jacks = [];
  for (let i = 0; i < 12; i++) {
    const a = (i + 0.5) / 12 * Math.PI * 2; const y = Math.cos(a) * 1.78, z = Math.sin(a) * 1.78;
    const g = k.group([-1.35, y, z], T);
    k.cyl(0.13, 0.85, [-0.425, 0, 0], BLUEP, { parent: g, axis: 'x', seg: 18, rough: 0.38 });
    const rod = k.cyl(0.07, 1, [0, 0, 0], CHROME, { parent: g, axis: 'x', seg: 14, metal: 0.95, rough: 0.15 }); rod.geometry.translate(-0.5, 0, 0);
    const pad = k.box([0.14, 0.32, 0.32], [-1, 0, 0], RUBBER, { parent: g, round: 0.04 });
    g.userData = { pad, rod, ang: Math.atan2(z, y) };
    k.part(g, { name: '千斤顶', hl: [3], front: z > 0.05 }); jacks.push(g);
  }
  // segment erector: slewing ring + telescopic arm with gripper (no new label — motion only)
  const er = k.group([-2.35, 0, 0], T);
  k.ring(0.72, 0.95, 0.3, [0, 0, 0], PAINT, { axis: 'x', parent: er, bevel: 0.03, rough: 0.42 });
  k.box([1.3, 0.3, 0.3], [0.7, 0, 0], DARK, { parent: er, round: 0.05 });
  const arm = k.group([0, 0, 0], er); arm.name = 'erArm';
  k.box([0.3, 0.75, 0.26], [0, -1.15, 0], PAINT, { parent: arm, round: 0.05, rough: 0.42 });
  const tele = k.group([0, -1.45, 0], arm);
  k.box([1.55, 0.14, 0.2], [-0.75, 0, 0], CHROME, { parent: tele, round: 0.04, metal: 0.9, rough: 0.2 });
  k.box([0.25, 0.1, 0.5], [-1.5, -0.08, 0], DARK, { parent: tele, round: 0.03 });
  k.part(er, {});
  // pressure arrows
  k.part(k.arrow([2.3, 0.5, 0], [-1, 0, 0], 1.6, C.blue, { parent: T, r: 0.08 }), { on: 2, off: 3, enter: 'pop', win: [0.05, 0.2], exit: 'none', outWin: [0, 0.01] });
  k.part(k.arrow([-0.6, -0.5, 0], [1, 0, 0], 1.6, C.red, { parent: T, r: 0.08 }), { on: 2, off: 3, enter: 'pop', win: [0.05, 0.2], exit: 'none', outWin: [0, 0.01] });
  // backup gantry: rails, three portal-frame trailers with equipment, belt conveyor, grout tank & lines, muck cars, loco
  const train = k.group([-TL - 1.6, 0, 0], T);
  for (const z of [-0.45, 0.45]) k.box([13.5, 0.07, 0.09], [-5.6, -1.42, z], C.steelLight, { parent: train, sharp: true, metal: 0.8, rough: 0.3 });
  for (let x = 0.8; x > -12.4; x -= 0.6) k.box([0.14, 0.05, 1.2], [x, -1.48, 0], 0x6b5a48, { parent: train, sharp: true });
  const wheel = (x, y, z) => k.cyl(0.13, 0.08, [x, y, z], DARK, { parent: train, axis: 'z', seg: 18, metal: 0.6, rough: 0.4 });
  for (let i = 0; i < 3; i++) {
    const x = -1.2 - i * 2.4;
    for (const dx of [-0.85, 0.85]) for (const z of [-0.62, 0.62]) k.box([0.1, 1.5, 0.1], [x + dx, -1.3, z], PAINT, { parent: train, anchor: 'bottom', round: 0.03, rough: 0.45 });
    for (const z of [-0.62, 0.62]) k.box([1.9, 0.12, 0.12], [x, 0.2, z], PAINT, { parent: train, round: 0.03, rough: 0.45 });
    k.box([2.0, 0.08, 1.15], [x, -1.0, 0], C.steel, { parent: train, round: 0.02 });
    for (const dx of [-0.6, 0.6]) for (const z of [-0.45, 0.45]) wheel(x + dx, -1.27, z);
  }
  k.box([1.2, 0.5, 0.75], [-1.2, -0.96, 0.05], BLUEP, { parent: train, anchor: 'bottom', round: 0.06, rough: 0.4 });          // hydraulic pack
  k.box([0.4, 0.75, 0.5], [-0.4, -0.96, 0.25], 0xdfe3e6, { parent: train, anchor: 'bottom', round: 0.05, rough: 0.35 });      // cabinet
  const tank = k.cyl(0.36, 0.75, [-3.6, -0.96, 0.18], 0xe08a3c, { parent: train, anchor: 'bottom', rough: 0.4, clearcoat: 0.3 }); // grout tank
  k.cyl(0.38, 0.06, [-3.6, -0.18, 0.18], DARK, { parent: train });
  k.box([1.1, 0.6, 0.7], [-6.0, -0.96, 0.05], 0x5e7f73, { parent: train, anchor: 'bottom', round: 0.06, rough: 0.45 });       // transformer
  k.cyl(0.3, 0.3, [-6.0, -0.06, 0.05], DARK, { parent: train, axis: 'z' });
  // belt conveyor on top of the portals
  k.box([10.2, 0.06, 0.42], [-3.6, 0.32, -0.3], RUBBER, { parent: train, round: 0.02, rough: 0.7 });
  for (let x = 1.3; x > -8.6; x -= 0.7) k.cyl(0.05, 0.46, [x, 0.27, -0.3], C.steelLight, { parent: train, axis: 'z', seg: 10 });
  for (let i = 0; i < 2; i++) {
    const x = -9.2 - i * 1.9;
    k.box([1.6, 0.55, 0.85], [x, -1.32, 0], C.steel, { parent: train, anchor: 'bottom', round: 0.06, metal: 0.5, rough: 0.45 });
    const heap = k.mesh(new THREE.IcosahedronGeometry(0.62, 2), C.slurry, [x, -0.78, 0], { parent: train, rough: 0.55, map: grain }); heap.scale.set(1.15, 0.32, 0.6);
    for (const dx of [-0.5, 0.5]) for (const z of [-0.45, 0.45]) wheel(x + dx, -1.27, z);
  }
  k.box([1.4, 0.9, 0.85], [-12.6, -1.32, 0], PAINT, { parent: train, anchor: 'bottom', round: 0.1, rough: 0.42 });
  k.box([0.5, 0.35, 0.86], [-12.3, -0.55, 0], 0x9fc6d8, { parent: train, round: 0.06, metal: 0.3, rough: 0.15 });
  for (const dx of [-0.4, 0.4]) for (const z of [-0.45, 0.45]) wheel(-12.6 + dx, -1.27, z);
  // synchronous grouting lines: tank → crown of the shield tail
  const gPts = [[-3.6, -0.15, 0.18], [-3.2, 0.7, 0.5], [-1.2, 1.25, 0.65], [0.6, 1.4, 0.7], [1.45, 1.8, 0.62]];
  const gPts2 = gPts.map(([x, y, z]) => [x, y, -z]);
  const gCurve = []; for (const P of [gPts, gPts2]) { k.tube(P, 0.05, 0xe08a3c, { parent: train, segs: 60, rseg: 10, tension: 0.4, rough: 0.35 }); gCurve.push(new THREE.CatmullRomCurve3(P.map(p => new THREE.Vector3(...p)), false, 'catmullrom', 0.4)); }
  const blobs = []; const bm = k.mat(0xb8b3a6, { rough: 0.3, emissive: 0xffa040, ei: 0.25 });
  for (let i = 0; i < 16; i++) { const m = new THREE.Mesh(new THREE.SphereGeometry(0.055, 10, 8), bm); train.add(m); blobs.push(m); }
  k.part(train, { on: 2, enter: 'fade', win: [0, 0.1] });
  // muck: chamber → screw → belt → muck car
  const toT = (x, y, z) => new THREE.Vector3(x - TL - 1.6, y, z);
  const mPath = new THREE.CurvePath(); const L = (a, b) => mPath.add(new THREE.LineCurve3(a, b));
  const M0 = new THREE.Vector3(-1.0, -1.25, -0.55), M1 = new THREE.Vector3(-4.55, 0.25, -0.55), M2 = toT(1.2, 0.42, -0.3), M3 = toT(-8.4, 0.42, -0.3), M4 = toT(-9.2, -0.7, 0);
  L(M0, M1); L(M1, M2); L(M2, M3); L(M3, M4);
  const muck = []; const mm = k.mat(C.slurry, { rough: 0.5 }); const screwFrac = M0.distanceTo(M1) / mPath.getLength();
  for (let i = 0; i < 30; i++) { const m = new THREE.Mesh(new THREE.IcosahedronGeometry(0.1 + (i % 3) * 0.02, 0), mm); m.castShadow = true; T.add(m); muck.push(m); }
  // ================= segment rings: precast concrete, chamfered edges, alternating tone
  const rings = []; const segMat = [k.mat(0xbfc2ba, { map: cgrain, rough: 0.8, env: 0.4 }), k.mat(0xb0b5ad, { map: cgrain, rough: 0.82, env: 0.4 })];
  for (let i = 0; i < 28; i++) {
    const x = GRID0 + i * RW; if (x > 15) break;
    const segs = ARCS.map(([a, b, grp], j) => {
      const m = k.ring(RI, RO, RW - 0.03, [x + RW / 2, CY, 0], 0, { axis: 'x', a0: a * Math.PI / 180 + 0.006, a1: b * Math.PI / 180 - 0.006, material: segMat[(i + j) % 2].clone(), seg: 10, bevel: 0.025 });
      m.receiveShadow = false; m.userData = { grp, j, a, b, front: (a >= 90 && b <= 270) }; return m;
    });
    rings.push({ x, segs, neg: x < -11.6 });
  }
  // carried segment (erector) — a clone of the real segment geometry, swung from the invert to its slot
  const carry = new THREE.Group(); k.root.add(carry); const carryMesh = new THREE.Mesh(rings[0].segs[0].geometry, rings[0].segs[0].material.clone()); carryMesh.castShadow = true; carry.add(carryMesh); carry.visible = false;
  const angOf = (a, b) => { const c = (a + b) / 2 * Math.PI / 180; return Math.atan2(-Math.cos(c), Math.sin(c)); }; // world angle atan2(z, y) of a segment centre
  // grout
  const grout = [BACK, FRONT].map((ab, j) => { const m = k.ring(RO, RB - 0.01, 1, [0, CY, 0], 0x98a3b0, { axis: 'x', a0: ab[0], a1: ab[1], opacity: 0.9, rough: 0.3, seg: 48 }); m.geometry.translate(0.5, 0, 0); m.position.x = -11; m.userData.front = j === 1; return m; });
  for (const x of [-9.4, -6.9]) { const g = k.group([x, CY, 0]); k.rod([0, 1.4, -0.6], [0, 2.3, -0.9], 0.07, 0xe08a3c, { parent: g }); k.box([0.25, 0.25, 0.25], [0, 1.25, -0.55], C.steel, { parent: g, round: 0.05 }); k.part(g, { name: '二次注浆孔', on: 4, enter: 'pop', win: [0.55, 0.75] }); }
  k.label('始发洞门与端头加固', [-10, -4.5, 0], { steps: [0] });
  k.label('负环管片与后方反力体系', [-17, -4.2, 0], { steps: [1] });
  k.label('前方地层', [6, -6, 0], { steps: [1, 2] });
  k.label('土仓与螺旋出土', [0, -5.2, 0], { steps: [2], follow: T });
  k.label('新一环在盾尾内；其余千斤顶维持支承', [-4, -2.6, 0], { steps: [3], follow: T });
  k.label('接收井：主机已进入并落在接收基座', [15, -4.5, 0], { steps: [5], win: [0.7, 1] });

  const hlc = new THREE.Color(0xff8a1c), black = new THREE.Color(0), v = new THREE.Vector3();
  k.onUpdate((s, p, t, st) => {
    const [a, b] = XF[s] || XF[0]; const [w0, w1] = MOVE[s] || [0, 1];
    const xf = lerp(a, b, smooth(p, w0, w1)); T.position.x = xf;
    const tail = xf - TL; const moving = a !== b && p > w0 && p < w1;
    if (s >= 1 && s !== 3) head.rotation.x = t * (moving ? 1.4 : 0.3);
    const flow = s === 1 || s === 2 || s === 4 || s === 5;
    flight.rotation.x = flow ? t * 5 : 0;
    // rings + erector
    let frontFace = tail, cur = null, curRing = null;
    rings.forEach(r => {
      const assemble = s === 3 && Math.abs(r.x - tail) < 0.05; if (assemble) curRing = r;
      r.segs.forEach(m => {
        let vis = r.x + RW / 2 < tail, hl = false;
        if (assemble) { const tA = segT(m.userData.j); vis = p >= tA; hl = vis && p < 0.98; if (p >= tA - WIN && p < tA) cur = { m, u: (p - (tA - WIN)) / WIN }; }
        if (s < 1 && r.neg) vis = false;
        m.visible = vis && !(st.section && m.userData.front);
        if (hl) { m.material.emissive.copy(hlc); m.material.emissiveIntensity = 0.35 + 0.25 * Math.sin(t * 4.2); } else m.material.emissiveIntensity = 0;
        if (vis) frontFace = Math.max(frontFace, r.x + RW);
      });
    });
    let armAng = 0, ext = 0;
    if (cur) {
      const { a: sa, b: sb } = cur.m.userData; const target = angOf(sa, sb); let th0 = Math.PI - target; th0 = Math.atan2(Math.sin(th0), Math.cos(th0));
      const u = cur.u, swing = smooth(u, 0.12, 0.72), seat = smooth(u, 0.72, 1);
      const th = th0 * (1 - swing); const d = 0.45 * (1 - seat) + 0.25 * (1 - smooth(u, 0, 0.12));
      carry.visible = st.active !== false; carry.position.set(curRing.x + RW / 2, CY, 0); carry.rotation.x = th;
      carryMesh.position.set(0, -Math.sin(((sa + sb) / 2) * Math.PI / 180) * d, Math.cos(((sa + sb) / 2) * Math.PI / 180) * d);
      carryMesh.material.emissive.copy(hlc); carryMesh.material.emissiveIntensity = 0.3;
      carry.visible = !(st.section && cur.m.userData.front && seat > 0.99);
      armAng = target + th - Math.PI; ext = 0.32 - d * 0.6;
    } else carry.visible = false;
    arm.rotation.x = armAng; tele.position.y = -1.45 - ext; tele.position.x = s === 3 ? -0.3 : 0;
    // jacks
    jacks.forEach(g => {
      let reach = Math.min(TL - 1.35, Math.max(0.6, xf - 1.35 - frontFace));
      if (s === 3) {
        const ang = Math.abs(((g.userData.ang * 180 / Math.PI) + 360) % 360 - 180); const grp = ang > 120 ? 0 : ang > 60 ? 1 : 2;
        const tS = segT(grp * 2) - WIN, tE = segT(grp * 2 + 1), r0 = TL - 1.35 - 0.02;
        const out = smooth(p, tS - 0.05, tS), back = smooth(p, tE, tE + 0.06);
        reach = r0 - (RW + 0.25) * out + 0.25 * back;
      }
      g.userData.rod.scale.x = Math.max(0.05, reach); g.userData.pad.position.x = -reach;
    });
    // grout ring + flowing grout in the lines
    const gl = Math.max(0.001, tail - (-11.3));
    grout.forEach(m => { m.scale.x = gl; m.visible = s >= 1 && tail > -11.3 && !(st.section && m.userData.front); const h = s === 4; m.material.emissive.copy(h ? hlc : black); m.material.emissiveIntensity = h ? 0.3 + 0.2 * Math.sin(t * 4.2) : 0; });
    const grouting = (moving && s !== 5) || s === 4;
    blobs.forEach((m, i) => { const c = gCurve[i % 2]; const u = (t * 0.5 + Math.floor(i / 2) / 8) % 1; m.visible = grouting && s >= 2; c.getPointAt(u, v); m.position.copy(v); });
    // muck flow along chamber → screw → belt → car
    const trainOn = s >= 2;
    muck.forEach((m, i) => { const u = (t * 0.09 + i / muck.length) % 1; const ok = flow && st.active && (trainOn || u < screwFrac); m.visible = ok; if (!ok) return; mPath.getPointAt(u, v); m.position.copy(v); if (u < screwFrac) { m.position.y += 0.12 * Math.sin(u * 60 + i); m.position.z += 0.12 * Math.cos(u * 60 + i); } else m.position.y += 0.06; m.rotation.set(u * 19, u * 13, 0); });
  });
}
