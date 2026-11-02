import { THREE, smooth, lerp, crawlerCrane, pumpTruck, mixerTruck } from './lib.js';
const SX = 2, SZ = -1;
export default {
  build(k) {
    const crane = crawlerCrane(k, [SX + 7.5, 0, SZ - 4.5], 2.4, { boom: 10, angle: 1.05, luff: true });
    const bundle = k.group([0, 0, 0]); for (let i = 0; i < 5; i++) k.cyl(0.04, 2.6, [0, 0, -0.2 + i * 0.1], 0x8a5a3a, { parent: bundle, axis: 'x' });
    const pump = pumpTruck(k, [SX + 4, 0, SZ - 5], Math.PI), mix = mixerTruck(k, [SX + 7.5, 0, SZ - 5], Math.PI);
    const tg = new THREE.Vector3();
    k.onUpdate((s, p, t) => {
      // 第4步：钢筋吊运到位 → 检查 → 浇筑成实体
      crane.g.visible = s === 3 && p < 0.45; const cOn = s === 3 && p < 0.36; bundle.visible = cOn;
      if (cOn) { const u = smooth(p, 0.0, 0.3); tg.set(lerp(-7, SX, u), lerp(1.2, 3.2, Math.sin(u * Math.PI)) + 0.3, lerp(2.5, SZ, u)); crane.aim(tg, true); bundle.position.set(crane.hook.position.x, crane.hook.position.y - 0.5, crane.hook.position.z); }
      else crane.aim(tg.set(SX, 3, SZ), false);
      const pOn = s === 3 && p > 0.68; pump.g.visible = mix.visible = s === 3 && p > 0.6; pump.aim(tg.set(SX + lerp(-2, 2, 0.5 + 0.5 * Math.sin(t * 0.5)), 2.9, SZ), pOn, t); mix.userData.drum.rotation.x = t * 2;
    });
  },
};
