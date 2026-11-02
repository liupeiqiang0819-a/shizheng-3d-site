import { THREE, C, smooth, lerp, worker, flow, tracks, beam, PAINT, DARK, ORANGE } from './lib.js';
const JZ = -2.4, JY = -5, HZ = 3.2, PL = 2.0, HEAD = 2.0, XS = -9, XR = 9;
const ARC = [[-13, 0.3], [-9.5, -3.2], [-5, -5.6], [0, -6.3], [5, -5.6], [9.5, -3.2], [13, 0.3]].map(([x, y]) => new THREE.Vector3(x, y, HZ));
export default {
  view: { section: true, xray: false },
  build(k) {
    // 实体土：后块（顶管剖面）、中块（定向钻剖面，第4/5步实体，其余半透明）、前块（剖切隐藏）
    for (const p of k.parts.filter(p => p.soil)) p.obj.parent.remove(p.obj);
    k.parts = k.parts.filter(p => !p.soil);
    k.root.traverse(n => { if (n.isMesh && n.parent === k.root && Math.abs(n.position.x) < 0.2 && n.position.y < 0.2 && n.position.y > -0.1 && (n.material.color.getHex() === C.asphalt || n.material.color.getHex() === C.white)) n.visible = false; });
    const col = [C.soil1, C.soil2, C.clay, C.soil3], hs = [2, 2.5, 3, 2.5];
    k.part(k.strata(-15, 15, -10, 0, -7, JZ, { colors: col, heights: hs }), { soil: true });
    const mid = k.part(k.strata(-15, 15, -10, 0, JZ, HZ, { colors: col, heights: hs }), { soil: true });
    k.part(k.strata(-15, 15, -10, 0, HZ, 7, { colors: col, heights: hs }), { soil: true, front: true });
    k.box([6, 0.1, HZ + 7], [0, 0, (HZ - 7) / 2], C.asphalt, { anchor: 'bottom', rough: 0.9 }); for (let z = -6; z < HZ - 0.5; z += 2.2) k.box([0.15, 0.02, 1.1], [0, 0.1, z], C.white, { sharp: true });
    const midMats = []; mid.traverse(n => { if (n.isMesh) midMats.push(n.material); });
    // 工作井门式吊：吊放下一节管
    const gan = k.group([-10.1, 0, JZ]);
    for (const x of [-2.4, 2.4]) for (const z of [-2.3, 2.3]) k.box([0.22, 4.2, 0.22], [x, 0, z], PAINT, { parent: gan, anchor: 'bottom', round: 0.05 });
    for (const x of [-2.4, 2.4]) k.box([0.3, 0.3, 4.9], [x, 4.2, 0], PAINT, { parent: gan, round: 0.06 });
    k.box([5.1, 0.35, 0.35], [0, 4.4, 0], PAINT, { parent: gan, round: 0.06 });
    const trolley = k.box([0.6, 0.35, 0.6], [0, 4.1, 0], DARK, { parent: gan, round: 0.06 });
    const cable = beam(k, 0x222222, 0.02); const newPipe = k.cyl(0.75, PL - 0.06, [0, 0, 0], C.concreteNew, { axis: 'x' });
    // 顶铁 + 管节接口
    const ring = k.ring(0.4, 0.8, 0.25, [0, JY, JZ], 0x5d6c74, { axis: 'x', metal: 0.6, rough: 0.35 });
    const collars = Array.from({ length: 9 }, () => k.ring(0.75, 0.8, 0.1, [0, JY, JZ], 0x5d6c74, { axis: 'x', metal: 0.6, rough: 0.35 }));
    const mudPump = k.box([1.2, 0.8, 0.9], [-13.5, 0, JZ - 1.6], 0x5e7f73, { anchor: 'bottom', round: 0.1 });
    const slurryIn = flow(k, [[-13.5, 0.8, JZ - 1.6], [-12.2, 0.8, JZ - 0.6], [-11.3, JY + 0.95, JZ - 0.6], [XR, JY + 0.95, JZ - 0.6]], 18, C.green, 0.07, 0.22);
    // 定向钻：履带底盘、钻杆架、泥浆罐与泥浆流、接收侧工人+导向仪
    const base = k.group([-14.2, 0, HZ]); tracks(k, base, 2.8, 1.3, 0.35, 0.3); k.part(base, { on: 3, enter: 'slide', from: [-6, 0, 0], win: [0, 0.15] });
    const rack = k.group([-12.6, 0, HZ - 1.6]); for (let i = 0; i < 5; i++) k.cyl(0.08, 2.4, [0, 0.25 + i * 0.17, (i % 2) * 0.17], 0x8a9097, { parent: rack, axis: 'x', metal: 0.6 }); k.part(rack, { on: 3, enter: 'fade', win: [0, 0.15] });
    const tank = k.cyl(0.6, 1.2, [-11.0, 0, HZ - 1.7], 0x5e7f73, { anchor: 'bottom', rough: 0.4 }); k.part(tank, { on: 3, enter: 'fade', win: [0, 0.15] });
    const curve = new THREE.CatmullRomCurve3(ARC, false, 'catmullrom', 0.3);
    const mud = flow(k, curve.getSpacedPoints(30).map(v => v.toArray()), 26, 0x8a6f52, 0.1, 0.12);
    const loc = worker(k, [0, 0.1, HZ - 1.0], 0xf2c230, 0xf08a2a, Math.PI / 2);
    const tp = new THREE.Vector3(), a = new THREE.Vector3(), b = new THREE.Vector3();
    k.onUpdate((s, p, t, st) => {
      // soil block in the middle: solid when the HDD steps are shown
      const solid = s === 3 || s === 4; const op = st.xray ? 0.16 : solid ? 1 : 0.22;
      midMats.forEach(m => { const tr = op < 1; if (m.transparent !== tr) { m.transparent = tr; m.needsUpdate = true; } m.opacity = op; m.depthWrite = !tr; });
      // cars stay on the remaining road; original locator replaced by the worker
      k.root.children.forEach(c => { if (c.isGroup && Math.abs(c.position.y - 0.1) < 1e-6 && Math.abs(Math.abs(c.rotation.y) - Math.PI / 2) < 1e-6) c.visible = c.position.z < HZ - 0.6; if (c.isGroup && Math.abs(c.position.z - (HZ + 1.2)) < 1e-6) c.visible = false; });
      // jacking train mirror (same formula as the base model)
      const xh = s < 2 ? XS : s === 2 ? lerp(XS, XR + 0.8, smooth(p, 0.05, 0.95)) : XR + 0.8; let last = xh - HEAD;
      collars.forEach((m, i) => { const xr = xh - HEAD - i * PL, xl = xr - PL; const vis = s >= 2 && xl >= -10.8; m.visible = vis; m.position.x = xr - 0.03; if (vis) last = Math.min(last, xl); });
      ring.visible = s === 2; ring.position.x = last - 0.15;
      gan.visible = s >= 1 && s <= 2; mudPump.visible = s >= 2 && s <= 2;
      const lower = s === 2 && p > 0.6; const ly = lower ? lerp(3.2, JY + 0.1, smooth(p, 0.62, 0.95)) : 3.2;
      newPipe.visible = lower; newPipe.position.set(-10.6, ly, JZ); trolley.position.x = lower ? -0.5 : 0;
      cable.visible = gan.visible; cable.set(a.set(-10.6, 4.0, JZ), b.set(-10.6, (lower ? ly : 3.2) + 0.78, JZ));
      slurryIn(t, s === 2 && p > 0.1, Math.min(1, (xh - XS) / (XR - XS + 2) + 0.15));
      // HDD
      const pilot = s < 3 ? 0 : s === 3 ? smooth(p, 0.05, 0.95) : 1; mud(t, s === 3 || s === 4, s === 3 ? pilot : 1);
      loc.visible = s === 3; curve.getPointAt(Math.max(0.001, pilot), tp); loc.position.x = tp.x; loc.userData.arm.rotation.z = -1.2;
    });
  },
};
