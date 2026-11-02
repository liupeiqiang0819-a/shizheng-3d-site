import { THREE, smooth, lerp, rotaryRig, pumpTruck, mixerTruck, roller, worker, beam } from './lib.js';
const BASE = -9, HX = 2.3, HZ = -2.6;
export default {
  build(k) {
    const rig = rotaryRig(k, [-1.9, 0, -2.25], 0, 9);
    const pump = pumpTruck(k, [5.5, 0.08, -6.4], Math.PI), mix = mixerTruck(k, [2.0, 0.08, -6.4], Math.PI);
    const rol = roller(k, [0, -0.05, -0.6], 0); rol.scale.setScalar(0.75);
    const ws = [[-2, -3.2], [-0.6, -0.9], [1.2, 0.6]].map(([x, z], i) => worker(k, [x, 0, z], 0xf2c230, 0xf08a2a, i));
    const cr = k.parts.filter(p => p.on === 3 && p.off === 5 && p.enter === 'none');
    const crane = cr[1]?.obj, bucket = cr[2]?.obj; const cable = beam(k, 0x333333, 0.02);
    const tip = new THREE.Vector3(), b = new THREE.Vector3();
    k.onUpdate((s, p, t) => {
      // 第1步：中间柱成孔
      const rOn = s === 0 && p > 0.2 && p < 0.8; rig.g.visible = rOn; rig.set(lerp(0.3, -12.5, smooth(p, 0.3, 0.7)), t * 3);
      // 浇筑：顶板 / 侧墙 / 中板 / 底板 / 封口
      let on = false, y = -1.0;
      if (s === 1 && p > 0.35 && p < 0.72) { on = true; y = -1.0; }
      else if (s === 3 && p > 0.5) { on = true; y = p < 0.7 ? -3 : -4.6; }
      else if (s === 4 && p > 0.6) { on = true; y = p < 0.76 ? BASE + 1 : -6.5; }
      else if (s === 5 && p > 0.1 && p < 0.4) { on = true; y = -1.0; }
      pump.g.visible = mix.visible = on; if (on) { pump.aim(b.set(s === 1 ? lerp(-2.5, 2.5, 0.5 + 0.5 * Math.sin(t * 0.5)) : HX, y, s === 1 ? -3 : HZ), true, t); mix.userData.drum.rotation.x = t * 2; } else pump.hose.visible = false;
      // 第3步：回填碾压 → 路面
      rol.visible = s === 2 && p > 0.05 && p < 0.62; if (rol.visible) { rol.position.x = -2.4 + 2.2 * Math.sin(t * 0.6); rol.userData.drum.rotation.z = -t * 3; }
      ws.forEach((w, i) => { w.visible = (s === 1 && p > 0.35 && p < 0.72) || (s === 5 && p > 0.45); if (s === 5) w.position.set(i % 2 ? 3 : -3, i === 2 ? BASE + 1.3 : i ? -5.2 + 0.5 : -1.0, -1.5 - i * 0.6); else w.position.set([-2, -0.6, 1.2][i], -1.0, [-3.2, -0.9, 0.6][i]); w.userData.arm.rotation.z = Math.sin(t * 3 + i) * 0.6; });
      // 出土：塔吊转向出土口，钢丝绳挂料斗
      const cOn = crane && bucket && (s === 3 || s === 4); cable.visible = !!cOn;
      if (cOn) { const top = crane.userData.top; crane.updateMatrixWorld(true); b.copy(bucket.position); const base = crane.position; const yaw = Math.atan2(-(b.z - base.z), b.x - base.x) - crane.rotation.y; top.rotation.y = yaw; top.updateMatrixWorld(true); tip.set(Math.min(3.5, Math.hypot(b.x - base.x, b.z - base.z)) * 0.8, -0.1, 0); top.localToWorld(tip); b.y += 0.35; cable.set(tip, b); }
    });
  },
};
