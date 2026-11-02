import { THREE, C, smooth, lerp, excavator, worker, flow, beam, tracks, PAINT, DARK, CHROME } from './lib.js';
const CY = -7, R = 3, X0 = -12, F0 = -4, F1 = 0, FL = -9.55;
export default {
  build(k) {
    // 台车式钻机：从已成钢架向前打小导管（第1步）
    // 按隧道断面放大：车长约 3.2、宽约 1.5，带司机室防护顶棚、液压油箱和两条钻臂
    const jumbo = k.group([-8.0, FL, -0.8]); tracks(k, jumbo, 3.0, 1.2, 0.42, 0.34);
    k.box([3.0, 0.75, 1.45], [0, 0.42, 0], PAINT, { parent: jumbo, anchor: 'bottom', round: 0.12, rough: 0.42 });
    k.box([0.9, 0.55, 1.2], [-1.0, 1.17, 0], DARK, { parent: jumbo, anchor: 'bottom', round: 0.1 });
    for (const [x, z] of [[0.15, -0.6], [0.95, -0.6], [0.15, 0.6], [0.95, 0.6]]) k.box([0.07, 1.0, 0.07], [x, 1.17, z], DARK, { parent: jumbo, anchor: 'bottom' });
    k.box([1.0, 0.07, 1.35], [0.55, 2.17, 0], PAINT, { parent: jumbo, anchor: 'bottom', round: 0.03 });
    k.box([0.32, 0.5, 0.36], [0.55, 1.17, 0.25], 0x30363c, { parent: jumbo, anchor: 'bottom', round: 0.05 });
    k.box([0.3, 0.45, 1.0], [1.55, 0.8, 0], DARK, { parent: jumbo, anchor: 'bottom', round: 0.05 });
    const jb = beam(k, PAINT, 0.12); const jd = beam(k, CHROME, 0.04, undefined, { metal: 0.9, rough: 0.2 });
    const jb2 = beam(k, PAINT, 0.12); const jd2 = beam(k, CHROME, 0.04, undefined, { metal: 0.9, rough: 0.2 }); const a2 = new THREE.Vector3(), b2 = new THREE.Vector3();
    // 注浆泵与浆液
    const gp = k.box([0.9, 0.6, 0.6], [-9.5, FL, -0.9], 0x5e7f73, { anchor: 'bottom', round: 0.08 });
    const grout = flow(k, [[-9.5, FL + 0.6, -0.9], [-6, FL + 0.6, -1.2], [-4.6, CY + 2.2, -1.2], [-3.6, CY + 2.8, -1.0]], 16, 0x9aa3a8, 0.07, 0.3);
    // 小挖机：环形开挖、核心土与下台阶
    const ex = excavator(k, [-6.3, FL, -0.7], 0, 0.55);
    // 湿喷机械手 + 喷射料流
    const sp = k.group([-7.6, FL, -1.1]); tracks(k, sp, 1.6, 0.9, 0.3, 0.26); k.box([1.4, 0.55, 0.8], [0, 0.32, 0], 0x3e6d8c, { parent: sp, anchor: 'bottom', round: 0.1 });
    const sb = beam(k, 0x3e6d8c, 0.08); const spray = flow(k, [[0, 0, 0], [1, 0, 0]], 20, 0xc9ccc4, 0.06, 1.2);
    const sprayPts = []; let sprayCurve = null;
    // 工人：架设钢架、铺挂防水板
    const ws = [[-2.6, CY, -0.9], [-1.4, CY, -1.6]].map(p => worker(k, p, 0xf2c230, 0xf08a2a, Math.PI));
    const plat = k.group([0, FL, 0]); for (const z of [-1.4, 1.4]) for (const x of [-0.6, 0.6]) k.box([0.1, 2.6, 0.1], [x, 0, z], PAINT, { parent: plat, anchor: 'bottom', round: 0.03 });
    k.box([1.4, 0.1, 3.0], [0, 2.6, 0], 0x8a6a4a, { parent: plat, round: 0.03 }); const pw = worker(k, [0, 2.65, -0.8], 0xf2c230, 0xf08a2a, Math.PI / 2); plat.add(pw); pw.position.set(0, 2.65, -0.8);
    // 二衬台车（门架 + 拱形模板 + 轨行轮）与泵送混凝土
    const tc = k.group([0, CY, 0]);
    k.ring(R - 1.12, R - 1.05, 3.0, [0, 0, 0], 0x7d8f99, { parent: tc, axis: 'x', a0: 0, a1: Math.PI, metal: 0.6, rough: 0.35 });
    for (const x of [-1.2, 0, 1.2]) for (const z of [-1.3, 1.3]) k.box([0.14, 2.3, 0.14], [x, -2.55, z], PAINT, { parent: tc, anchor: 'bottom', round: 0.03 });
    for (const x of [-1.2, 0, 1.2]) k.box([0.16, 0.16, 2.8], [x, -0.25, 0], PAINT, { parent: tc, round: 0.03 });
    for (const x of [-1.3, 1.3]) for (const z of [-1.3, 1.3]) k.cyl(0.14, 0.12, [x, -2.48, z], DARK, { parent: tc, axis: 'z' });
    const conc = flow(k, [[X0 + 0.5, FL + 0.5, -1.6], [X0 + 2, CY + 1.8, -1.2], [0, CY + 1.9, -1.0]], 18, 0xcfd3cc, 0.08, 0.35);
    const a = new THREE.Vector3(), b = new THREE.Vector3(), v = new THREE.Vector3();
    k.onUpdate((s, p, t) => {
      const drill = s === 0 && p > 0.03 && p < 0.5; jumbo.visible = jb.visible = jd.visible = jb2.visible = jd2.visible = drill;
      if (drill) { const n = Math.floor((p - 0.03) / 0.47 * 9); const ang = (10 + 20 * n) * Math.PI / 180, ang2 = (20 + 20 * n) * Math.PI / 180;
        a.set(-6.5, FL + 1.3, -0.6); b.set(-4.7, CY + Math.sin(ang) * 2.3, -Math.cos(ang) * 1.1 - 0.35); jb.set(a, b); jd.set(b, v.copy(b).add({ x: 1.3 + 0.2 * Math.sin(t * 8), y: 0.25, z: 0 }));
        a2.set(-6.5, FL + 1.0, -1.4); b2.set(-4.9, CY + Math.sin(ang2) * 2.0, -Math.cos(ang2) * 1.3 - 0.6); jb2.set(a2, b2); jd2.set(b2, v.copy(b2).add({ x: 1.2 + 0.2 * Math.sin(t * 8 + 1), y: 0.2, z: 0 })); }
      gp.visible = s === 0; grout(t, s === 0 && p > 0.5 && p < 0.82);
      const dig = (s === 1 && p > 0.08 && p < 0.82) || (s === 3 && p > 0.04 && p < 0.64); ex.visible = dig || s === 2;
      ex.position.x = s === 3 && p > 0.3 ? -5.2 : -6.3; k.animateExcavator(ex, dig ? t : 0, dig ? 1 : 0);
      // 初喷（第3步开头）与复喷（两层，各自由拱脚向拱顶）；第4步下部初支
      const sh1 = s === 2 && p > 0.02 && p < 0.14, sh2 = s === 2 && p > 0.53 && p < 0.9, shoot = sh1 || sh2 || (s === 3 && p > 0.8 && p < 0.98); sp.visible = sb.visible = shoot;
      if (shoot) { let th; if (sh1) th = 0.15 + 1.3 * (0.5 + 0.5 * Math.sin(t * 1.2)); else if (sh2) { const f = p < 0.71 ? (p - 0.53) / 0.18 : (p - 0.72) / 0.18; th = Math.max(0.1, Math.min(1.5, f * Math.PI / 2)); } else th = -0.7;
        const ny = s === 3 ? CY - 1.6 : CY + 0.3 + Math.sin(th) * 0.9; a.set(-7.4, FL + 0.9, -1.1); b.set(-3.4, ny, -0.9); sb.set(a, b); sprayPts.length = 0;
        const tgt = new THREE.Vector3(lerp(-3.6, -0.6, 0.5 + 0.5 * Math.sin(t * 1.5)), CY + Math.sin(th) * (R - 0.3), -Math.cos(th) * (R - 0.3));
        sprayCurve = new THREE.LineCurve3(b.clone(), tgt); }
      spray(t, false); if (shoot && sprayCurve) { /* simple jet */ }
      jet.forEach((m, i) => { m.visible = shoot; if (shoot) { const u = (t * 1.6 + i / jet.length) % 1; sprayCurve.getPoint(u, v); m.position.copy(v).add({ x: 0, y: 0.15 * Math.sin(i * 7), z: 0.15 * Math.cos(i * 5) }); } });
      ws.forEach((w, i) => { w.visible = s === 2 && p > 0.15 && p < 0.5; w.userData.arm.rotation.z = Math.sin(t * 3 + i) * 0.7; });
      plat.visible = s === 4; plat.position.x = X0 + 1 + (F1 - X0 - 2) * smooth(p, 0.1, 0.85); pw.userData.arm.rotation.z = -1.4 + 0.4 * Math.sin(t * 3);
      tc.visible = s === 5; tc.position.x = X0 + 1.5 + (F1 - X0 - 3) * smooth(p, 0.1, 0.9); conc(t, s === 5 && p > 0.1 && p < 0.92);
    });
    const jet = []; const jm = k.mat(0xc9ccc4, { rough: 0.6 }); for (let i = 0; i < 18; i++) { const m = new THREE.Mesh(new THREE.IcosahedronGeometry(0.06, 0), jm); k.root.add(m); jet.push(m); }
  },
};
