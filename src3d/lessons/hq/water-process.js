import { THREE, smooth, lerp, flow, DARK, CHROME, PAINT } from './lib.js';
const ZW = -4, ZS = 2.2, H = 1.6;
// 刮泥桥：横跨池宽的桁架 + 刮板，沿池长往复
function bridge(k, x, z, w, d) {
  const g = k.group([x, H + 0.05, z]);
  k.box([0.25, 0.12, d + 0.3], [0, 0, 0], PAINT, { parent: g, round: 0.03 }); for (const s of [-1, 1]) k.box([0.25, 0.4, 0.06], [0, 0.2, s * (d / 2 + 0.1)], PAINT, { parent: g, round: 0.02 });
  k.rod([0, 0.4, -d / 2], [0, 0.4, d / 2], 0.025, 0xd9dde0, { parent: g });
  k.box([0.05, H - 0.35, 0.05], [0, -H + 0.35, 0], DARK, { parent: g, anchor: 'bottom' }); k.box([0.06, 0.25, d - 0.4], [0, -H + 0.3, 0], DARK, { parent: g, anchor: 'bottom' });
  g.userData.x0 = x - w / 2 + 0.35; g.userData.x1 = x + w / 2 - 0.35; return g;
}
function mixer(k, pos) { const g = k.group(pos); k.cyl(0.03, 0.6, [0, 0, 0], CHROME, { parent: g, axis: 'x' }); const pr = k.group([0.32, 0, 0], g); for (let i = 0; i < 3; i++) { const b = k.box([0.04, 0.3, 0.08], [0, 0.12, 0], 0x7c8389, { parent: pr }); b.geometry.translate(0, 0, 0); b.parent.rotation.x = 0; b.rotation.x = i * 2.09; b.position.set(0, Math.cos(i * 2.09) * 0.12, Math.sin(i * 2.09) * 0.12); } g.userData.prop = pr; return g; }
export default {
  build(k) {
    // 加药：药剂罐 + 计量泵 → 混凝池
    const dose = k.group([-10.9, 0, ZW - 1.6]); k.cyl(0.4, 1.2, [0, 0, 0], 0xe8ece6, { parent: dose, anchor: 'bottom', seg: 24 }); k.box([0.4, 0.3, 0.3], [0.6, 0, 0.2], 0x3e6d8c, { parent: dose, anchor: 'bottom', round: 0.05 });
    k.tube([[-10.3, 0.3, ZW - 1.4], [-9.6, 1.9, ZW - 1.2], [-9.2, 1.7, ZW - 0.6]], 0.03, 0x3e6d8c);
    const chem = flow(k, [[-10.3, 0.3, ZW - 1.4], [-9.6, 1.9, ZW - 1.2], [-9.2, 1.6, ZW - 0.6], [-9.2, 0.9, ZW - 0.4]], 10, 0xe9d36a, 0.05, 0.5);
    const sedB = bridge(k, -5, ZW, 4.4, 2.4), primB = bridge(k, -5.6, ZS, 2.8, 2.4), secB = bridge(k, 6.8, ZS, 2.8, 2.6);
    // 格栅：机械耙齿上下清污
    const rake = k.group([-10.6, 0.3, ZS]); k.box([0.08, 0.1, 1.3], [0, 0, 0], DARK, { parent: rake }); for (let i = -3; i <= 3; i++) k.box([0.12, 0.04, 0.04], [0.1, -0.05, i * 0.18], 0x8a9097, { parent: rake });
    const rails = k.group([-10.62, 0, ZS]); for (const s of [-1, 1]) k.box([0.06, H + 0.9, 0.06], [0, 0.1, s * 0.72], 0x8a9097, { parent: rails, anchor: 'bottom' }); k.box([0.4, 0.3, 1.6], [0, H + 1.0, 0], PAINT, { parent: rails, anchor: 'bottom', round: 0.05 });
    // 过滤：自上而下渗流
    const drip = flow(k, [[0, 1.5, ZW], [0, 0.2, ZW]], 14, 0x6fb7d6, 0.05, 0.6);
    // 厌氧/缺氧：潜水搅拌器；好氧：池底微孔曝气盘 + 鼓风机
    const mixers = [mixer(k, [-2.9, 0.6, ZS - 0.6]), mixer(k, [-0.8, 0.6, ZS + 0.6])];
    for (let i = 0; i < 6; i++) for (let j = 0; j < 3; j++) k.cyl(0.13, 0.05, [1.2 + i * 0.55, 0.2, ZS - 0.7 + j * 0.7], 0x3e4a52, { seg: 16 });
    k.cyl(0.05, 3.4, [2.6, 0.24, ZS - 0.7], 0x8a9097, { axis: 'x' });
    const blower = k.group([2.6, 0, ZS - 2.4]); k.box([1.2, 0.7, 0.7], [0, 0, 0], 0x3e6d8c, { parent: blower, anchor: 'bottom', round: 0.08 }); k.cyl(0.08, 1.8, [0.4, 0.7, 0], 0x8a9097, { parent: blower, anchor: 'bottom' });
    // 回流泵
    const rp = [[3.6, ZS - 0.9], [7.6, ZS + 0.9]].map(([x, z]) => { const g = k.group([x, H, z]); k.cyl(0.18, 0.35, [0, 0, 0], 0x3e6d8c, { parent: g, anchor: 'bottom', seg: 16 }); k.box([0.3, 0.2, 0.3], [0, 0.35, 0], DARK, { parent: g, anchor: 'bottom' }); return g; });
    const run = (b, on, t, sp = 0.15) => { if (!on) return; const u = 0.5 + 0.5 * Math.sin(t * sp); b.position.x = lerp(b.userData.x0, b.userData.x1, u); };
    k.onUpdate((s, p, t) => {
      chem(t, s === 1 && p < 0.4);
      run(sedB, s === 1 && p > 0.35, t); run(primB, s === 3 && p > 0.55, t); run(secB, s === 4 && p > 0.45, t);
      rake.position.y = s === 3 && p < 0.35 ? 0.3 + (H + 0.5) * (0.5 + 0.5 * Math.sin(t * 1.2)) : 0.3;
      drip(t, s === 2 && p < 0.45);
      mixers.forEach((m, i) => { m.userData.prop.rotation.x = s === 4 && p > (i ? 0.15 : 0) ? t * 8 : 0; });
      void smooth; void rp; void blower;
    });
  },
};
