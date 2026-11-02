import { THREE, smooth, lerp, roller, truck, worker, DARK, PAINT } from './lib.js';
const Z = 7, XB = 5, XC = 9, DEP = -5;
const surf = x => { const a = Math.abs(x); if (a >= XC) return 0; if (a >= XB) return DEP * (XC - a) / (XC - XB); return DEP - 0.18 * (1 - a / XB); };
const ext = y => XC + (XC - XB) * y / -DEP;
const capTop = x => 1.6 - 1.6 * (Math.abs(x) / (XC - 0.4)) ** 2;
export default {
  build(k) {
    const rol = roller(k, [0, 0, 0], 0); rol.scale.setScalar(0.85);
    // 垃圾压实机：钢轮带齿
    const comp = roller(k, [0, 0, 0], 0); comp.scale.setScalar(0.85); for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2; for (const z of [-0.45, 0, 0.45]) k.box([0.12, 0.16, 0.12], [0.9 + Math.cos(a) * 0.55, 0.5 + Math.sin(a) * 0.55, z], 0x5a6066, { parent: comp }); }
    comp.userData.teeth = comp.children.slice(-36); 
    const dump = truck(k, [0, 0, 0], Math.PI / 2, 0x6b7378);
    // 坡顶伸缩臂叉车吊挂膜卷：膜由坡顶向坡脚展开，工人顺坡下拉，铺好的膜边压沙袋
    const NZ = 8, ZW = 2 * Z / NZ, SEG0 = 9.4, SEG1 = 4.6;
    const tele = [-1, 1].map(sd => {
      const g = k.group([sd * 11.0, 0, 0]); g.rotation.y = sd < 0 ? 0 : Math.PI;
      k.box([2.0, 0.45, 1.2], [-0.2, 0.35, 0], PAINT, { parent: g, anchor: 'bottom', round: 0.08 });
      for (const x of [-0.85, 0.55]) for (const z of [-0.6, 0.6]) k.cyl(0.3, 0.25, [x, 0.3, z], 0x24282c, { parent: g, axis: 'z', seg: 16 });
      k.box([0.7, 0.75, 0.45], [-0.5, 0.8, 0.35], PAINT, { parent: g, anchor: 'bottom', round: 0.06 }); k.box([0.5, 0.5, 0.46], [-0.42, 0.95, 0.35], 0x8fb8cc, { parent: g, anchor: 'bottom', round: 0.04 });
      const boom = k.group([-0.8, 1.0, -0.15], g); boom.rotation.z = 0.22; k.box([2.0, 0.26, 0.3], [0, 0, 0], PAINT, { parent: boom, anchor: 'left', round: 0.05 }); k.box([1.0, 0.18, 0.22], [1.9, 0, 0], PAINT, { parent: boom, anchor: 'left', round: 0.04 });
      const roll = k.group([1.9, 0.4, 0], g); k.box([0.1, 0.1, 2.0], [0, 0.55, 0], 0x30363c, { parent: roll }); for (const z of [-0.8, 0.8]) k.rod([0, 0.55, z], [0, 0.32, z], 0.02, 0x30363c, { parent: roll });
      k.cyl(0.3, 1.8, [0, 0.02, 0], 0x2b2d2f, { parent: roll, axis: 'z', seg: 24, rough: 0.5 });
      return { g, roll };
    });
    const ws = Array.from({ length: 6 }, (_, i) => worker(k, [0, 0, 0], 0xf2c230, i % 2 ? 0xd9e04a : 0xf08a2a, 0));
    const bagM = []; for (let j = 0; j < NZ; j++) for (const sd of [-1, 1]) for (const x of [9.8, 8.4, 7.0, 5.6]) { const zc = -Z + j * ZW + 0.2; const m = k.box([0.32, 0.14, 0.22], [sd * x, surf(sd * x) + 0.2, zc], 0xe8e4d8, { round: 0.05 }); m.rotation.z = (x < XC && x > XB) ? sd * 0.9 : 0; bagM.push({ m, j, z: zc }); }
    k.onUpdate((s, p, t, st) => {
      // 第1步：场底压实
      rol.visible = (s === 0 && p < 0.5) || (s === 5 && p > 0.35 && p < 0.7);
      if (s === 0) { const x = lerp(-4, 4, 0.5 + 0.5 * Math.sin(t * 0.5)); rol.position.set(x, surf(x), -3); rol.rotation.z = 0; }
      if (s === 5) { const x = lerp(-5, 5, 0.5 + 0.5 * Math.sin(t * 0.4)); rol.position.set(x, capTop(x) + 0.6, -3); rol.rotation.z = -Math.atan(-3.2 * x / (XC - 0.4) ** 2 * 1.0); }
      rol.userData.drum.rotation.z = -t * 3;
      // 第2步：边坡膜幅逐幅由坡顶向坡脚展开（两侧同步），随后场底
      const slopeOn = s === 1 && p >= 0.05 && p < 0.33, j = Math.min(NZ - 1, Math.floor((p - 0.05) / 0.034)), f = Math.min(1, ((p - 0.05) - j * 0.034) / 0.034);
      const zc = -Z + (j + 0.5) * ZW, lead = lerp(SEG0, SEG1, f), front = st?.section && zc > 0;
      tele.forEach(T => { T.g.visible = s === 1 && p < 0.33; T.g.position.z = slopeOn ? zc : -Z + ZW / 2; T.roll.visible = slopeOn && !front; });
      ws.forEach((w, i) => { const sd = i < 3 ? -1 : 1, k3 = i % 3; w.visible = s === 1 && p < 0.56;
        if (slopeOn) { const x = sd * (lead + 0.3 + (k3 === 1 ? 0.5 : 0)); w.position.set(x, surf(x), zc + (k3 - 1) * 0.75); w.rotation.y = sd < 0 ? 0 : Math.PI; }
        else if (s === 1 && p >= 0.33) { const jj = Math.min(NZ - 1, Math.floor((p - 0.33) / 0.026)); const x = sd * (1.2 + k3 * 1.1); w.position.set(x, surf(x) + 0.12, -Z + (jj + 0.5) * ZW); }
        if (front && slopeOn) w.visible = false; w.userData.arm.rotation.z = -1.2 + 0.3 * Math.sin(t * 3 + i); });
      bagM.forEach(b => { const done = p > 0.05 + (b.j + 1) * 0.034; b.m.visible = s === 1 && done && !(st?.section && b.z > 0); });
      // 第4步：分层卸料 + 压实
      const tops = [-3.5, -2.1, -0.7], wins = [[0.05, 0.3], [0.35, 0.6], [0.65, 0.9]]; let li = -1; wins.forEach((w, i) => { if (s === 3 && p >= w[0] && p <= w[1]) li = i; });
      comp.visible = dump.visible = li >= 0;
      if (li >= 0) { const top = tops[li], xe = ext(top) - 1.4; const y = lerp(li ? tops[li - 1] : surf(0) + 0.7, top, smooth(p, wins[li][0], wins[li][1] - 0.08));
        const x = lerp(-xe + 1, xe - 1, 0.5 + 0.5 * Math.sin(t * 0.45)); comp.position.set(x, y, -2.2); comp.userData.drum.rotation.z = -t * 3; comp.userData.teeth.forEach(m => { m.visible = true; });
        dump.position.set(lerp(-xe + 1.2, 0, smooth(p, wins[li][0], wins[li][0] + 0.1)), y, -4.8); { const a = p > wins[li][0] + 0.1 ? 0.5 : 0, bd = dump.userData.bed; bd.rotation.z = a; bd.position.set(-1.275 + 0.875 * Math.cos(a), 0.5 + 0.875 * Math.sin(a), 0); } }
      void THREE; void DARK;
    });
  },
};
