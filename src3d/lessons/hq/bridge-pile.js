import { THREE, smooth, lerp, rotaryRig, crawlerCrane, mixerTruck, worker, flow, partsNamed, reskin, beam } from './lib.js';
const BOT = -13;
export default {
  build(k) {
    const rigP = partsNamed(k, '钻机')[0]; const r = rotaryRig(k, [0, 0, 0], 0, 9); r.kelly.visible = false; reskin(rigP.obj, r.g); r.g.position.set(0.7, 0, 0);
    const mud = flow(k, [[0.3, 1.0, -0.5], [2, 1.2, -1.5], [4, 1.1, -2.5], [4.6, 1.0, -3], [5.5, 1.0, -3]], 18, 0x8a7356, 0.08, 0.3);
    // 正循环：泥浆池 → 泥浆泵 → 胶管至钻杆顶 → 钻杆内下行 → 钻头处携渣 → 孔壁与钻杆间上返 → 孔口回流泥浆池（上段沿原回流管）
    const rodP = partsNamed(k, '钻具')[0].obj; const rodMeshes = []; rodP.traverse(n => { if (n.isMesh) rodMeshes.push(n); });
    const mp = k.group([4.2, 0.12, -4.4]); k.box([0.9, 0.55, 0.6], [0, 0, 0], 0x3e6d8c, { parent: mp, anchor: 'bottom', round: 0.06 }); k.cyl(0.16, 0.4, [0.5, 0.28, 0], 0x30363c, { parent: mp, axis: 'x' });
    const feed = k.tube([[5.2, 0.9, -3.6], [4.6, 0.6, -4.2], [4.2, 0.7, -4.4]], 0.05, 0x24282c);
    const hoseUp = beam(k, 0x24282c, 0.06); const downP = Array.from({ length: 34 }, () => k.mesh(new THREE.IcosahedronGeometry(0.11, 0), 0x5a3b1e, [0, -30, 0], { shadow: false }));
    const P3 = (pts, u, out) => { let L = 0; const seg = []; for (let i = 1; i < pts.length; i++) { const d = pts[i].distanceTo(pts[i - 1]); seg.push(d); L += d; } let r = u * L; for (let i = 0; i < seg.length; i++) { if (r <= seg[i]) return out.copy(pts[i]).lerp(pts[i + 1], r / seg[i]); r -= seg[i]; } return out.copy(pts[pts.length - 1]); };
    const V = () => new THREE.Vector3(); const path = [V(), V(), V(), V(), V(), V(), V()], q = V();
    const cage = partsNamed(k, '钢筋笼')[0].obj, trem = partsNamed(k, '导管')[0].obj;
    const crane = crawlerCrane(k, [-6.5, 0.12, -3.6], 0.3, { boom: 15, angle: 1.2, luff: true });
    const mix = mixerTruck(k, [-4.2, 0.12, 3.4], Math.PI * 0.85);
    const conc = flow(k, [[-3.2, 1.4, 2.9], [-1.5, 3.2, 1.2], [0, 3.1, 0]], 14, 0x9da5a8, 0.09, 0.4);
    const ws = [[1.6, 0.8], [-1.4, 1.2]].map(([x, z], i) => worker(k, [x, 0.12, z], 0xf2c230, 0xf08a2a, i * 2));
    const tg = new THREE.Vector3();
    k.onUpdate((s, p, t) => {
      mud(t, s === 1 || (s === 2 && p > 0.5));
      const circ = s === 1; mp.visible = feed.visible = s <= 2; hoseUp.visible = circ;
      rodMeshes.forEach(m => { if (circ) { m.material.transparent = true; m.material.opacity = 0.45; m.material.depthWrite = false; } });
      if (circ) { const top = rodP.position.y, bit = rodP.position.y + rodP.children[1].position.y - 0.4;
        path[0].set(5.2, 0.9, -3.6); path[1].set(4.6, 0.65, -4.4); path[2].set(0.35, top + 0.3, -0.2); path[3].set(0, top, 0); path[4].set(0, bit, 0); path[5].set(0.6, bit - 0.1, -0.3); path[6].set(0.6, 0.6, -0.3);
        hoseUp.set(path[1], path[2]); }
      downP.forEach((m, i) => { m.visible = circ; if (circ) { P3(path, (t * 0.05 + i / downP.length) % 1, q); m.position.copy(q); } });
      crane.g.visible = s === 3 || s === 4;
      if (s === 3) { const toCage = p < 0.55; const o = toCage ? cage : trem; tg.set(0, toCage ? o.position.y + 13.6 + 0.4 : o.position.y + 3.0, 0); crane.aim(tg, true); }
      else if (s === 4) crane.aim(tg.set(0, trem.position.y + 3.0, 0), true); else crane.aim(tg.set(0, 0, 0), false);
      mix.visible = s === 4; if (s === 4) { mix.userData.drum.rotation.x = t * 2; }
      // 混凝土经料斗进入导管：漏斗顶随导管提升
      conc(t, s === 4 && p > 0.03 && trem.position.y < 1.5);
      ws.forEach((w, i) => { w.visible = (s === 0 && p > 0.2 && p < 0.6) || (s === 3 && p > 0.4); w.userData.arm.rotation.z = Math.sin(t * 3 + i) * 0.6; });
    });
  },
};
