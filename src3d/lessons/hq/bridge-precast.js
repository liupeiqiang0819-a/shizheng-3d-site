import { THREE, smooth, crawlerCrane, pumpTruck, mixerTruck, worker, jack, partsNamed, reskin } from './lib.js';
const CAP = 7, BH = 1.0, beamY = CAP + 0.25 + BH / 2;
export default {
  build(k) {
    const crP = partsNamed(k, '起重机')[0]; const cc = crawlerCrane(k, [0, 0, 0], 0, { boom: 16, angle: 1.15, luff: true }); reskin(crP.obj, cc.g); cc.g.scale.setScalar(1.25);
    // 原示意吊臂与钢丝绳由精细履带吊替代（保留吊梁、吊索与吊点位置）
    const old = k.root.children.filter(m => m.isMesh && m.geometry?.parameters && ((m.geometry.parameters.radiusTop === 0.18 && m.geometry.parameters.height === 1) || (m.geometry.parameters.radiusTop === 0.03 && m.geometry.parameters.height === 1)));
    const B0 = partsNamed(k, '预制梁')[0].obj;
    const pump = pumpTruck(k, [3, 0.06, -7.2], Math.PI, { reach: 2.5, clear: { r: 5.0, h: 8.2 } }), mix = mixerTruck(k, [7, 0.06, -7.2], Math.PI);
    const ws = [[-3, -1.3], [2, 1.3], [-0.6, 0.4]].map(([x, z], i) => worker(k, [x, beamY + BH / 2 + 0.18, z], 0xf2c230, 0xf08a2a, i));
    const jacks = [jack(k, [11.2, beamY - 0.3, 0.75], 1), jack(k, [-11.2, beamY - 0.3, 0.75], -1)];
    const tg = new THREE.Vector3();
    k.onUpdate((s, p, t) => {
      old.forEach(m => { m.visible = false; });
      const hooked = s === 2 || (s === 1 && p > 0.85) || (s === 3 && p < 0.3);
      if (hooked) { tg.copy(B0.position); tg.y += 2.6 + (s === 3 ? 2.5 * smooth(p, 0.1, 0.3) : 0) - 0.45; cc.aim(tg, true); cc.hook.visible = false; cc.cable.visible = true; }
      else { cc.aim(tg.set(-6, 3, -5.5), false); }
      const pOn = s === 4 && p > 0.45 && p < 0.75; pump.g.visible = mix.visible = s === 4; pump.aim(tg.set(0, beamY + 0.7, 0), pOn, t); mix.userData.drum.rotation.x = t * 2;
      ws.forEach((w, i) => { w.visible = (s === 3 && p < 0.35 && i < 2) || (s === 4 && p > 0.2 && p < 0.75); w.userData.arm.rotation.z = Math.sin(t * 3 + i) * 0.7; });
      jacks.forEach((j, i) => { j.visible = s === 4 && p > 0.78; j.children[1].position.x = (i ? -1 : 1) * (0.85 + 0.15 * smooth(p, 0.8, 0.95)); });
      void B0;
    });
  },
};
