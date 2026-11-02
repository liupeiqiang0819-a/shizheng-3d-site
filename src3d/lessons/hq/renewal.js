import { THREE, smooth, lerp, worker, flow, truck, beam, reskin, partsNamed, DARK, CHROME, RUBBER } from './lib.js';
const CY = -4, RI = 0.85, PX = 7, MX = 9;
export default {
  // 精致档：第3步机位拉远到可见井口与清洗车（其余机位同原课件）
  cams: [
    { pos: [3, 2.5, 11], target: [0, -4, -0.3] }, { pos: [4, 6, 18], target: [0, -2, 0] }, { pos: [7, 3.5, 15], target: [3, -2.4, -0.6] },
    { pos: [3, 2, 11], target: [0, -4, -0.3] }, { pos: [3, 2, 11], target: [0, -4, -0.3] }, { pos: [4, 3, 13], target: [0, -3.6, 0] },
  ],
  build(k) {
    // CCTV 爬行器：车体、四轮、云台摄像头、灯
    const camP = partsNamed(k, '摄像设备')[0]; const cr = k.group([0, CY - RI + 0.02, 0]);
    k.box([0.62, 0.18, 0.34], [0, 0.1, 0], 0xf2c230, { parent: cr, anchor: 'bottom', round: 0.05 });
    for (const x of [-0.2, 0.2]) for (const z of [-0.22, 0.22]) k.cyl(0.1, 0.08, [x, 0.1, z], RUBBER, { parent: cr, axis: 'z', seg: 16 });
    const headC = k.group([0.22, 0.38, 0], cr); k.cyl(0.03, 0.12, [0, -0.06, 0], DARK, { parent: headC }); k.cyl(0.08, 0.2, [0.04, 0.04, 0], DARK, { parent: headC, axis: 'x', seg: 16 }); k.cyl(0.06, 0.02, [0.15, 0.04, 0], 0xfff6c0, { parent: headC, axis: 'x', emissive: 0xfff2a0, ei: 1.2 });
    reskin(camP.obj, cr);
    const cable = beam(k, 0x222222, 0.02);
    const van = truck(k, [-11, 0, -3], 0, 0xeef0ec); van.userData.bed.visible = false; k.box([1.8, 0.95, 1.0], [-0.4, 0.5, 0], 0xeef0ec, { parent: van, anchor: 'bottom', round: 0.08 });
    // 第3步：高压清洗车 + 喷嘴水雾
    const jt = truck(k, [10.8, 0, -2.2], Math.PI, 0x3e6d8c); jt.userData.bed.visible = false; k.cyl(0.55, 1.6, [-0.4, 1.05, 0], 0x3e6d8c, { parent: jt, axis: 'x', seg: 24 }); k.cyl(0.35, 0.6, [-1.2, 1.0, 0], CHROME, { parent: jt, axis: 'z', seg: 20 });
    const hose = beam(k, RUBBER, 0.04);
    const jetP = partsNamed(k, '清洗')[0].obj; const mist = Array.from({ length: 16 }, () => k.mesh(new THREE.SphereGeometry(0.05, 6, 4), 0xcfe8f5, [0, -9, 0], { shadow: false, opacity: 0.8 }));
    // 第5步：热水循环（锅炉车）
    const boil = truck(k, [11, 0, 2.6], Math.PI, 0xd9534f); boil.userData.bed.visible = false; k.box([1.7, 1.0, 1.0], [-0.4, 0.5, 0], 0xb9433f, { parent: boil, anchor: 'bottom', round: 0.08 }); k.cyl(0.08, 0.6, [-0.9, 1.5, 0.3], DARK, { parent: boil, anchor: 'bottom' });
    // 热水从标高较低的下游端口通入，经内衬管流向上游端口，再回到锅炉车循环
    const hot = flow(k, [[10.2, 0.9, 2.2], [MX - 0.2, 0.3, 1.2], [MX - 0.2, CY + 0.3, 0.5], [PX - 0.2, CY + 0.25, 0.3], [-PX + 0.2, CY + 0.25, 0.3], [-MX + 0.2, CY + 0.3, 0.5], [-MX + 0.2, 0.3, 1.4], [0, 0.35, 2.3], [10.2, 0.6, 2.4]], 40, 0xe9762b, 0.07, 0.06);
    const suck = beam(k, RUBBER, 0.07); const sludge = Array.from({ length: 18 }, () => k.mesh(new THREE.SphereGeometry(0.07, 6, 4), 0x6e5a3e, [0, -9, 0], { shadow: false }));
    const P3 = (pts, u, out) => { let L = 0; const seg = []; for (let i = 1; i < pts.length; i++) { const d = pts[i].distanceTo(pts[i - 1]); seg.push(d); L += d; } let r = u * L; for (let i = 0; i < seg.length; i++) { if (r <= seg[i]) return out.copy(pts[i]).lerp(pts[i + 1], r / seg[i]); r -= seg[i]; } return out.copy(pts[pts.length - 1]); };
    const sp = [new THREE.Vector3(), new THREE.Vector3(MX - 0.3, CY - RI + 0.15, -0.3), new THREE.Vector3(MX - 0.5, 0.8, -1.2)], tmp = new THREE.Vector3();
    const ws = [0, 1].map(i => worker(k, [0, 0, 0], 0xf2c230, 0xf08a2a, i * Math.PI));
    const a = new THREE.Vector3(), b = new THREE.Vector3();
    k.onUpdate((s, p, t) => {
      van.visible = s === 0; cable.visible = s === 0; if (s === 0) { headC.rotation.y = 0.5 * Math.sin(t * 0.8); cable.set(a.set(-MX + 0.4, 0.3, -0.6), b.set(camP.obj.position.x - 0.3, CY - RI + 0.3, 0)); }
      jt.visible = s === 2; hose.visible = s === 2 && p < 0.65; if (hose.visible) hose.set(a.set(MX - 0.3, 0.6, -0.6), b.set(jetP.position.x + 0.3, CY - 0.3, 0));
      // 喷嘴朝上游推进，水流向后（下游）喷射；污泥随水回到下游检查井，由吸污管抽走
      mist.forEach((m, i) => { m.visible = hose.visible; if (!m.visible) return; const u = (t * 1.2 + i / 16) % 1; const ang = i * 2.4; m.position.set(jetP.position.x + 0.25 + u * 0.9, CY - 0.3 + Math.sin(ang) * u * 0.6, Math.cos(ang) * u * 0.6); });
      suck.visible = s === 2; if (s === 2) suck.set(a.set(MX - 0.5, 0.8, -1.2), b.set(MX - 0.3, CY - RI + 0.15, -0.3));
      sp[0].set(jetP.position.x + 1.0, CY - RI + 0.12, -0.25);
      sludge.forEach((m, i) => { m.visible = s === 2 && p < 0.7; if (!m.visible) return; P3(sp, (t * 0.12 + i / sludge.length) % 1, tmp); m.position.copy(tmp); });
      boil.visible = s === 4; hot(t, s === 4 && p < 0.55);
      ws.forEach((w, i) => { w.visible = s === 1 && p > 0.5; w.position.set(i ? MX + 0.8 : -MX - 0.8, 0, i ? 1.6 : 1.2); w.userData.arm.rotation.z = Math.sin(t * 3 + i) * 0.6; });
    });
  },
};
