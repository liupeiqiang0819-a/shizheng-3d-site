import { THREE, smooth, lerp, worker } from './lib.js';
const PX = 4.5, PZ = 3.2, BASE = -6;
export default {
  build(k) {
    // 第2步：立镜人员持棱镜杆到各轴线桩位
    const pole = k.group([0, 0, 0]); k.cyl(0.025, 1.8, [0, 0, 0], 0xf2c230, { parent: pole, anchor: 'bottom' }); k.mesh(new THREE.SphereGeometry(0.08, 12, 8), 0xd9dde0, [0, 1.85, 0], { parent: pole, metal: 0.6, rough: 0.2 });
    const pw = worker(k, [0, 0, 0], 0xf2c230, 0xf08a2a, 0);
    const stakes = k.parts.filter(p => p.name === '轴线桩').map(p => p.obj.position.clone());
    // 第4步：坑内分层开挖
    const ex = k.excavator([1.5, 0, -0.8], Math.PI, 0.8); const mw = worker(k, [0, 0, 0], 0xf2c230, 0x3e6d8c, 0);
    const mps = k.parts.filter(p => p.name === '监测点').map(p => p.obj.position.clone());
    k.onUpdate((s, p, t) => {
      const on1 = s === 1 && stakes.length; pole.visible = pw.visible = !!on1;
      if (on1) { const i = Math.min(stakes.length - 1, Math.floor(smooth(p, 0.05, 0.75) * stakes.length)); const q = stakes[i]; pole.position.set(q.x + 0.2, 0, q.z + 0.2); pw.position.set(q.x + 0.55, 0, q.z + 0.35); }
      ex.visible = s === 3; if (ex.visible) { ex.position.y = lerp(-0.6, BASE, smooth(p, 0.1, 0.9)); k.animateExcavator(ex, t, 1); }
      mw.visible = (s === 3 || s === 4) && mps.length > 0; if (mw.visible) { const i = Math.floor((t * 0.15) % mps.length); const q = mps[i]; mw.position.set(q.x + 0.5, Math.max(0, q.y - 0.3), q.z + 0.5); mw.userData.arm.rotation.z = Math.sin(t * 3) * 0.5; }
      void PX; void PZ;
    });
  },
};
