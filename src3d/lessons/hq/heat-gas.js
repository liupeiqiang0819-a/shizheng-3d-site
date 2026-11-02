import { THREE, C, smooth, lerp, worker, flow, DARK } from './lib.js';
const HY = -1.9, ZS = -3.1, ZR = -2.1, GY = -1.4, GZ = -0.5, BX = 5;
// 层界（自上而下）：0..-1 soil1，-1..-2.5 soil2，-2.5..-4 soil3
function block(k, yb, yt, z0, z1) {
  const B = [[0, -1, C.soil1], [-1, -2.5, C.soil2], [-2.5, -4, C.soil3]]; const cols = [], hs = [];
  for (const [a, b, c] of B) { const h = Math.min(a, yt) - Math.max(b, yb); if (h > 1e-3) { cols.push(c); hs.push(h); } }
  return k.strata(-12, 12, yb, yt, z0, z1, { colors: cols, heights: hs });
}
export default {
  view: { section: true, xray: false },
  build(k) {
    // 实体土 + 竖直剖切面（z=WZ）；管位区上方局部透明窗口（细线标出窗口范围），观察侧覆土剖切时隐藏
    for (const p of k.parts.filter(p => p.soil)) p.obj.parent.remove(p.obj);
    k.parts = k.parts.filter(p => !p.soil);
    const WZ = 0.1, WB = -3.6, WY = -2.6;
    k.part(block(k, -4, 0, -5, WB), { soil: true });
    k.part(block(k, -4, WY, WB, WZ), { soil: true });
    const win = block(k, WY, 0, WB, WZ); win.traverse(n => { if (n.isMesh) { n.material = n.material.clone(); n.material.transparent = true; n.material.opacity = 0.16; n.material.depthWrite = false; n.castShadow = false; } });
    k.part(win, { soil: true });
    k.part(block(k, -4, 0, WZ, 5), { soil: true, front: true });
    for (const [y, z] of [[WY, WZ], [WY, WB], [0.01, WB], [0.01, WZ]]) k.box([24, 0.035, 0.035], [0, y, z], 0x4a3b2c, { sharp: true });
    // 第3步：试压泵 + 充水管
    const pump = k.group([-9.2, 0, -4.3]); k.box([1.0, 0.6, 0.6], [0, 0, 0], 0x3e6d8c, { parent: pump, anchor: 'bottom', round: 0.08 }); k.cyl(0.18, 0.5, [0.55, 0.3, 0], DARK, { parent: pump, axis: 'x' });
    const hose = k.tube([[-8.7, 0.3, -4.3], [-8.4, 0.1, -3.6], [-8.2, HY + 0.3, ZS]], 0.05, 0x24282c);
    const wat = flow(k, [[-8.2, HY, ZS], [8.2, HY, ZS]], 20, 0x3d9ad6, 0.09, 0.15);
    // 第4步：检测人员随检测环行进，随后补口加热
    const insp = worker(k, [0, GY - 0.22, GZ + 0.9], 0xf2c230, 0xf08a2a, Math.PI / 2);
    const gun = k.group([0, 0, 0]); k.cyl(0.05, 0.5, [0, 0, 0], DARK, { parent: gun, axis: 'z' }); const flame = k.mesh(new THREE.ConeGeometry(0.1, 0.35, 10), 0xffa040, [0, 0, -0.4], { parent: gun, emissive: 0xff7a1a, ei: 1 }); flame.rotation.x = -Math.PI / 2;
    // 第5步：空压机吹扫
    const comp = k.group([-10.2, 0, 0.6]); k.box([1.4, 0.8, 0.8], [0, 0, 0], 0xe0b43a, { parent: comp, anchor: 'bottom', round: 0.1 }); for (const z of [-0.42, 0.42]) k.cyl(0.22, 0.12, [0.3, 0.2, z], 0x24282c, { parent: comp, axis: 'z' });
    const air = flow(k, [[-9.5, GY, GZ], [9.6, GY, GZ]], 16, 0xdde3e6, 0.07, 0.35);
    const gx = [-8, -4, 0, 4, 8];
    k.onUpdate((s, p, t) => {
      pump.visible = hose.visible = s === 2; wat(t, s === 2 && p > 0.3 && p < 0.7, smooth(p, 0.35, 0.65));
      insp.visible = s === 3; gun.visible = s === 3 && p > 0.62;
      if (s === 3) { if (p < 0.62) insp.position.x = lerp(-8.5, 8.5, smooth(p, 0.05, 0.6)) - 0.6; else { const i = Math.min(4, Math.floor(smooth(p, 0.65, 0.9) * 5)); insp.position.x = gx[i] - 0.6; gun.position.set(gx[i], GY + 0.25, GZ + 0.45); } insp.userData.arm.rotation.z = Math.sin(t * 3) * 0.5; }
      comp.visible = s === 4; air(t, s === 4 && p < 0.4);
      void BX; void ZR;
    });
  },
};
