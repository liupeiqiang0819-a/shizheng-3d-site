// 盾构怎样掘进并留下隧道 — 3D model (earth pressure balance shield, longitudinal cut)
import { THREE, COLORS as C, smooth, lerp, table, boredStrata } from '../engine.js';
import { buildHQ } from './shield-hq.js';

const CY = -8, RB = 2.15, RS = 2.1, RSI = 1.97, RO = 1.94, RI = 1.66, TL = 4.6, RW = 1.2, GRID0 = -18.2;
const XF = [[-11.7, -11.7], [-11.7, -7.0], [-7.0, -1.6], [-1.6, -1.6], [-1.6, 3.2], [3.2, 18.7]];
const MOVE = [[0, 1], [0.05, 0.95], [0.03, 0.97], [0, 1], [0.05, 0.95], [0.02, 0.72]];
const BACK = [-Math.PI / 2, Math.PI / 2], FRONT = [Math.PI / 2, Math.PI * 1.5];

export default {
  hq: { build: buildHQ },
  cams: [
    { pos: [-6, 1, 20], target: [-13.5, -7.5, 0] },
    { pos: [-3, -1, 15], target: [-10, -7.5, 0] },
    { pos: [4, 0, 18], target: [-4, -7.5, 0] },
    { pos: [-1.5, -4, 12], target: [-5, -8, 0] },
    { pos: [3, -3, 13], target: [-2.5, -8, 0] },
    { pos: [19, 1, 21], target: [10, -7, 0] },
  ],
  phases: [
    '始发条件共同到位，才能开洞门',
    '穿越洞门，建立土压平衡并试掘进',
    '一个掘进行程；压力平衡与土量平衡共同控制',
    [[0, '底部 → 左右交替 → 邻接块 → 封顶块'], [0.85, '分组回收与复位千斤顶，禁止同时全部回收']],
    [[0, '单环行程：盾体前移，既成管片固定，尾隙同步填充'], [0.55, '同步充填在空隙形成时；二次注浆随后按需实施']],
    [[0, '接收前调姿态与参数，进井后完成洞门密封'], [0.75, '管片环与洞门间隙及时密封']],
  ],
  build(k) {
    table(k, -20, 20, -6, 6, -14);
    const bore = { cy: CY, r: RB };
    const cols = [C.soil1, C.soil2, C.clay, C.soil3], hs = [2.5, 3, 3.5, 5];
    const imp = [0xb7ab95, 0xa89c86, 0xa19480, 0x968a77];
    for (const side of [-1, 1]) {
      const opt = side > 0 ? { soil: true, front: true } : { soil: true };
      for (const [x0, x1, c, nm, hl] of [[-11, -8, imp, '端头加固', [0]], [-8, 8, cols], [8, 11, imp, '端头加固', [5]]]) {
        const g = k.group(); boredStrata(k, x0, x1, side, 6, -14, 0, bore, c, hs, g);
        k.part(g, { ...opt, name: nm || '', hl: hl || [] });
      }
    }
    // shafts (launch / receiving): floor, end wall, side walls, portal wall with opening
    const shaft = (x0, x1, portalX, nm) => {
      const conc = C.concrete;
      k.split((a, b) => k.zbox(x1 - x0, 1, a, b, (x0 + x1) / 2, -12, conc, { anchor: 'bottom' }), {}, -4.1, 4.1);
      const endX = portalX < 0 ? x0 : x1 - 0.6;
      k.split((a, b) => k.zbox(0.6, 12.4, a, b, endX + 0.3, -12, conc, { anchor: 'bottom' }), {}, -4.1, 4.1);
      k.part(k.zbox(x1 - x0, 12.4, -4.1, -3.5, (x0 + x1) / 2, -12, conc, { anchor: 'bottom' }), {});
      k.part(k.zbox(x1 - x0, 12.4, 3.5, 4.1, (x0 + x1) / 2, -12, conc, { anchor: 'bottom' }), { front: true });
      for (const side of [-1, 1]) { const g = k.group(); boredStrata(k, portalX - 0.3, portalX + 0.3, side, 4.1, -12, 0.4, { cy: CY, r: 2.45 }, [conc], null, g); k.part(g, { front: side > 0 }); }
      // portal seal ring
      for (const [a0, a1, front] of [[...BACK, false], [...FRONT, true]]) k.part(k.ring(2.1, 2.45, 0.25, [portalX + (portalX < 0 ? -0.42 : 0.42), CY, 0], C.machineDark, { axis: 'x', a0, a1 }), { name: '洞门密封', hl: nm === 'launch' ? [0] : [5], front });
      // cradle
      k.part(k.box([5.2, 0.9, 2.2], [portalX < 0 ? x0 + 3.9 : x1 - 3.9, -11, 0], C.steel, { anchor: 'bottom' }), { name: nm === 'launch' ? '始发基座' : '接收基座', hl: nm === 'launch' ? [0] : [5] });
    };
    shaft(-19.6, -11, -11.3, 'launch'); shaft(11, 19.6, 11.3, 'receive');
    // reaction frame
    const rf = k.group([-18.4, CY, 0]);
    for (const z of [-2.4, 2.4]) k.box([0.4, 5.6, 0.4], [0, 0, z], C.steel, { parent: rf });
    for (const y of [-2.6, 2.6]) k.box([0.4, 0.4, 5.2], [0, y, 0], C.steel, { parent: rf });
    k.rod([-0.2, -2.6, -2.4], [-1, -3, -2.4], 0.12, C.steel, { parent: rf }); k.rod([-0.2, 2.6, -2.4], [-1, 3.6, -2.4], 0.12, C.steel, { parent: rf });
    k.part(rf, { name: '反力架', hl: [0] });
    // surface: road, buildings, settlement monitoring points
    k.box([4, 0.08, 12], [2, 0.04, 0], C.asphalt); for (let z = -5.5; z < 6; z += 2) k.box([0.12, 0.02, 1], [2, 0.09, z], C.white);
    k.building([-5.5, 0, -3.8], [3.2, 5, 3]); k.building([7, 0, -3.8], [3, 7, 3]);
    k.tree([-2, 0, -4.5]); k.part(k.tree([-7, 0, 4], 1.1), { front: true }); k.part(k.truck([2.5, 0.08, 2.2], Math.PI / 2), { front: true });
    for (let x = -9; x <= 9; x += 3) { const g = k.group([x, 0, -0.6]); k.cyl(0.06, 0.5, [0, 0, 0], C.white, { parent: g, anchor: 'bottom', seg: 8 }); k.cyl(0.15, 0.12, [0, 0.5, 0], C.red, { parent: g, seg: 10, emissive: C.red, ei: 0.3 }); k.part(g, { name: '监测点', hl: [2] }); }

    // ---------------- TBM
    const T = k.group([0, CY, 0]);
    for (const [a0, a1, front] of [[...BACK, false], [...FRONT, true]]) {
      k.part(k.ring(RSI, RS, TL, [-TL / 2, 0, 0], 0x5f7f86, { axis: 'x', a0, a1, parent: T, metal: 0.45, rough: 0.45 }), { name: '盾构', hl: [0], front });
      k.part(k.ring(0.01, RSI, 0.9, [-0.75, 0, 0], C.slurry, { axis: 'x', a0, a1, parent: T }), { name: '土仓', hl: [1, 2], front });
      k.part(k.ring(0.01, RSI, 0.14, [-1.27, 0, 0], C.machineDark, { axis: 'x', a0, a1, parent: T }), { front });
    }
    const head = k.group([-0.15, 0, 0], T);
    k.cyl(2.05, 0.28, [0, 0, 0], C.machineDark, { parent: head, axis: 'x', seg: 32 });
    for (let i = 0; i < 6; i++) { const sp = k.box([0.2, 3.9, 0.35], [0.18, 0, 0], C.machine, { parent: head }); sp.rotation.x = i * Math.PI / 6; }
    for (let i = 0; i < 18; i++) { const a = i / 18 * Math.PI * 2, r = 0.5 + (i % 3) * 0.5; k.box([0.2, 0.12, 0.12], [0.36, Math.cos(a) * r, Math.sin(a) * r], C.steelLight, { parent: head }); }
    k.cyl(0.3, 0.3, [0.35, 0, 0], C.machine, { parent: head, axis: 'x' });
    k.part(head, { name: '刀盘', hl: [2] });
    // screw conveyor
    const scr = k.rod([-1.2, -1.45, -0.55], [-4.6, 0.2, -0.55], 0.32, C.steelLight, { parent: T, seg: 14 });
    k.part(scr, { name: '螺旋机', hl: [2] });
    // jacks
    const jacks = [];
    for (let i = 0; i < 12; i++) {
      const a = (i + 0.5) / 12 * Math.PI * 2; const y = Math.cos(a) * 1.78, z = Math.sin(a) * 1.78;
      const g = k.group([-1.35, y, z], T);
      k.cyl(0.11, 1, [0, 0, 0], C.steelLight, { parent: g, axis: 'x', seg: 10 }).geometry.translate(-0.5, 0, 0);
      const pad = k.box([0.12, 0.3, 0.3], [-1, 0, 0], C.machineDark, { parent: g });
      g.userData = { pad, rod: g.children[0], ang: Math.atan2(z, y) };
      k.part(g, { name: '千斤顶', hl: [3], front: z > 0.05 }); jacks.push(g);
    }
    // pressure arrows (front soil vs chamber)
    k.part(k.arrow([2.3, 0.5, 0], [-1, 0, 0], 1.6, C.blue, { parent: T, r: 0.08 }), { on: 2, off: 3, enter: 'pop', win: [0.05, 0.2], exit: 'none', outWin: [0, 0.01] });
    k.part(k.arrow([-0.6, -0.5, 0], [1, 0, 0], 1.6, C.red, { parent: T, r: 0.08 }), { on: 2, off: 3, enter: 'pop', win: [0.05, 0.2], exit: 'none', outWin: [0, 0.01] });
    // trailing gantry + muck cars
    const train = k.group([-TL - 1.6, 0, 0], T);
    for (const z of [-0.45, 0.45]) k.box([12, 0.06, 0.08], [-6, -1.42, z], C.steel, { parent: train });
    for (let i = 0; i < 3; i++) { const x = -1.2 - i * 2.4; k.box([2.0, 0.5, 0.8], [x, -1.35, -0.35], C.steelLight, { parent: train, anchor: 'bottom' }); k.box([0.6, 0.45, 0.6], [x + 0.5, -0.85, -0.45], C.machineDark, { parent: train, anchor: 'bottom' }); }
    for (let i = 0; i < 2; i++) { const x = -8.6 - i * 1.9; k.box([1.6, 0.55, 0.8], [x, -1.35, 0], C.machineDark, { parent: train, anchor: 'bottom' }); k.box([1.4, 0.18, 0.7], [x, -0.8, 0], C.slurry, { parent: train, anchor: 'bottom' }); }
    k.part(train, { on: 2, enter: 'fade', win: [0, 0.1] });
    // muck particles from the chamber through the screw
    const muck = []; const mm = k.mat(C.slurry);
    for (let i = 0; i < 14; i++) { const m = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.18, 0.18), mm); T.add(m); muck.push(m); }
    // ---------------- segment rings
    const rings = []; const segMat = [k.mat(C.segment), k.mat(0xb9beb6)];
    const arcs = [[-90, -30, 0], [210, 270, 0], [-30, 30, 1], [150, 210, 1], [30, 90, 2], [90, 150, 2]];
    for (let i = 0; i < 28; i++) {
      const x = GRID0 + i * RW; if (x > 15) break;
      const segs = arcs.map(([a, b, grp], j) => {
        const m = k.ring(RI, RO, RW - 0.04, [x + RW / 2, CY, 0], 0, { axis: 'x', a0: a * Math.PI / 180, a1: b * Math.PI / 180, material: segMat[(i + j) % 2].clone(), seg: 10 });
        m.userData = { grp, front: (a >= 90 && b <= 270) }; return m;
      });
      rings.push({ x, segs, neg: x < -11.6 });
    }
    // grout (synchronous) behind the tail, and secondary grouting holes
    const grout = [BACK, FRONT].map((ab, j) => { const m = k.ring(RO, RB - 0.01, 1, [0, CY, 0], 0x8e9db0, { axis: 'x', a0: ab[0], a1: ab[1], opacity: 0.9 }); m.geometry.translate(0.5, 0, 0); m.position.x = -11; m.userData.front = j === 1; return m; });
    const sec = [];
    for (const x of [-9.4, -6.9]) { const g = k.group([x, CY, 0]); k.rod([0, 1.4, -0.6], [0, 2.3, -0.9], 0.07, C.machine, { parent: g }); k.box([0.25, 0.25, 0.25], [0, 1.25, -0.55], C.machine, { parent: g }); k.part(g, { name: '二次注浆孔', on: 4, enter: 'pop', win: [0.55, 0.75] }); sec.push(g); }
    k.label('始发洞门与端头加固', [-10, -4.5, 0], { steps: [0] });
    k.label('负环管片与后方反力体系', [-17, -4.2, 0], { steps: [1] });
    k.label('前方地层', [6, -6, 0], { steps: [1, 2] });
    k.label('土仓与螺旋出土', [0, -5.2, 0], { steps: [2], follow: T });
    k.label('新一环在盾尾内；其余千斤顶维持支承', [-4, -2.6, 0], { steps: [3], follow: T });
    k.label('接收井：主机已进入并落在接收基座', [15, -4.5, 0], { steps: [5], win: [0.7, 1] });

    const tmp = new THREE.Color(), hlc = new THREE.Color(0xff8a1c);
    k.onUpdate((s, p, t, st) => {
      const [a, b] = XF[s] || XF[0]; const [w0, w1] = MOVE[s] || [0, 1];
      const xf = lerp(a, b, smooth(p, w0, w1)); T.position.x = xf;
      const tail = xf - TL; const moving = a !== b && p > w0 && p < w1;
      if (s >= 1 && s !== 3) head.rotation.x = t * (moving ? 1.2 : 0.25);
      // rings
      let frontFace = tail;
      rings.forEach(r => {
        let vis = r.x + RW / 2 < tail; let assemble = s === 3 && Math.abs(r.x - tail) < 0.05;
        r.segs.forEach(m => {
          let v = vis; let hl = false;
          if (assemble) { const g = m.userData.grp; const tA = 0.08 + g * 0.24; v = p > tA; hl = p > tA && p < 0.98; }
          if (s === 4 && Math.abs(r.x - (XF[3][0] - TL)) < 0.05) hl = false;
          if (s < 1 && r.neg) v = false;
          m.visible = v && !(st.section && m.userData.front);
          if (hl) { m.material.emissive.copy(hlc); m.material.emissiveIntensity = 0.35 + 0.25 * Math.sin(t * 4.2); } else m.material.emissiveIntensity = 0;
          if (v) frontFace = Math.max(frontFace, r.x + RW);
        });
      });
      // jacks reach the newest ring face; in step 3 grouped retract/extend
      jacks.forEach(g => {
        let reach = Math.min(TL - 1.35, Math.max(0.6, xf - 1.35 - frontFace));
        if (s === 3) { const ang = Math.abs(((g.userData.ang * 180 / Math.PI) + 360) % 360 - 180); const grp = ang > 120 ? 0 : ang > 60 ? 1 : 2; const tA = 0.08 + grp * 0.24; const r0 = TL - 1.35 - 0.02; reach = p < tA - 0.06 ? r0 : p < tA + 0.06 ? r0 - RW * 0.9 : r0 - RW; }
        g.children[0].scale.x = Math.max(0.05, reach); g.userData.pad.position.x = -reach;
      });
      // grout fills the tail void from step 1 on
      const gl = Math.max(0.001, tail - (-11.3));
      grout.forEach(m => { m.scale.x = gl; m.visible = s >= 1 && tail > -11.3 && !(st.section && m.userData.front); const h = s === 4; m.material.emissive.copy(h ? hlc : tmp.set(0)); m.material.emissiveIntensity = h ? 0.3 + 0.2 * Math.sin(t * 4.2) : 0; });
      // muck flow
      const flow = s === 1 || s === 2 || s === 4 || s === 5;
      muck.forEach((m, i) => { const u = ((t * 0.35 + i / muck.length) % 1); m.visible = flow && st.active; m.position.set(lerp(-1.0, -4.6, u), lerp(-1.4, 0.25, u) + 0.18, -0.55 + 0.12 * Math.sin(u * 30)); m.rotation.set(u * 9, u * 7, 0); });
    });
  },
};
