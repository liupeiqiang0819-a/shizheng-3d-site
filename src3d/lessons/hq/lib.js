// 精致版通用部件库 (detailed props shared by the HQ lesson augments). No text is created here.
import { THREE, COLORS as C, smooth, lerp } from '../../engine.js';
export { THREE, C, smooth, lerp };
export const PAINT = 0xf0b92a, DARK = 0x30363c, CHROME = 0xd7dde0, RUBBER = 0x24282c, GLASS = 0x8fb8cc, BLUEP = 0x3e6d8c, ORANGE = 0xe08a3c, WHITE = 0xeef0ec;

const wheel = (k, parent, x, y, z, r = 0.22, w = 0.16) => { k.cyl(r, w, [x, y, z], RUBBER, { parent, axis: 'z', seg: 20, rough: 0.8 }); k.cyl(r * 0.55, w + 0.02, [x, y, z], 0xb8bec2, { parent, axis: 'z', seg: 16, metal: 0.6, rough: 0.35 }); };
export function tracks(k, parent, len = 2.0, gauge = 1.3, h = 0.42, w = 0.36) {
  for (const z of [-gauge / 2, gauge / 2]) {
    k.box([len, h, w], [0, h / 2, z], RUBBER, { parent, round: h * 0.45, rough: 0.85 });
    for (const x of [-len / 2 + h / 2, len / 2 - h / 2]) k.cyl(h * 0.42, w + 0.04, [x, h / 2, z], 0x555a5f, { parent, axis: 'z', seg: 16, metal: 0.5 });
    for (let x = -len / 2 + 0.1; x < len / 2; x += 0.16) k.box([0.06, 0.04, w + 0.02], [x, h + 0.01, z], 0x3a3f44, { parent, sharp: true });
  }
}
// detailed hydraulic excavator; same userData contract as Kit.excavator ({upper, boom, stick, bucket})
export function excavator(k, pos, rotY = 0, scale = 1, color = PAINT) {
  const g = k.group(pos); g.rotation.y = rotY; g.scale.setScalar(scale);
  tracks(k, g, 2.0, 1.3, 0.4, 0.36);
  const upper = new THREE.Group(); upper.position.y = 0.48; g.add(upper);
  k.cyl(0.42, 0.1, [0, -0.04, 0], DARK, { parent: upper, seg: 24 });
  k.box([1.55, 0.55, 1.25], [-0.2, 0, 0], color, { parent: upper, anchor: 'bottom', round: 0.1, rough: 0.42 });
  k.box([0.55, 0.62, 1.2], [-1.05, 0.02, 0], DARK, { parent: upper, anchor: 'bottom', round: 0.18 }); // counterweight
  const cab = k.group([0.38, 0.55, 0.32], upper);
  k.box([0.62, 0.62, 0.56], [0, 0, 0], color, { parent: cab, anchor: 'bottom', round: 0.08, rough: 0.42 });
  k.box([0.5, 0.44, 0.58], [0.06, 0.12, 0], GLASS, { parent: cab, anchor: 'bottom', round: 0.05, metal: 0.4, rough: 0.12 });
  k.box([0.64, 0.44, 0.48], [0.02, 0.12, 0], GLASS, { parent: cab, anchor: 'bottom', round: 0.05, metal: 0.4, rough: 0.12 });
  k.cyl(0.04, 0.35, [-0.55, 0.55, -0.35], DARK, { parent: upper, anchor: 'bottom', seg: 10 });
  const boom = new THREE.Group(); boom.position.set(0.55, 0.5, -0.18); upper.add(boom);
  k.box([1.6, 0.22, 0.2], [0, 0, 0], color, { parent: boom, anchor: 'left', round: 0.06, rough: 0.42 }); boom.rotation.z = 0.45;
  k.rod([0.25, -0.18, 0], [0.95, 0.02, 0], 0.045, CHROME, { parent: boom, metal: 0.9, rough: 0.2 });
  const stick = new THREE.Group(); stick.position.set(1.6, 0, 0); boom.add(stick);
  k.box([1.15, 0.16, 0.16], [0, 0, 0], color, { parent: stick, anchor: 'left', round: 0.05, rough: 0.42 }); stick.rotation.z = -1.5;
  k.rod([-0.1, 0.12, 0], [0.6, 0.12, 0], 0.035, CHROME, { parent: stick, metal: 0.9, rough: 0.2 });
  const bucket = k.group([1.2, 0, 0], stick);
  k.box([0.38, 0.32, 0.44], [0, 0, 0], DARK, { parent: bucket, round: 0.06 });
  for (let z = -0.16; z <= 0.17; z += 0.11) k.box([0.1, 0.06, 0.05], [0.17, -0.18, z], 0x8a9097, { parent: bucket, round: 0.015, metal: 0.6 });
  g.userData = { upper, boom, stick, bucket };
  return g;
}
// detailed dump truck (Kit.truck contract)
export function truck(k, pos, rotY = 0, color = PAINT) {
  const g = k.group(pos); g.rotation.y = rotY;
  k.box([2.7, 0.14, 0.9], [-0.05, 0.32, 0], DARK, { parent: g, anchor: 'bottom', round: 0.04 });
  const cab = k.group([1.0, 0.42, 0], g);
  k.box([0.75, 0.78, 1.0], [0, 0, 0], color, { parent: cab, anchor: 'bottom', round: 0.12, rough: 0.4 });
  k.box([0.3, 0.32, 0.92], [0.24, 0.38, 0], GLASS, { parent: cab, anchor: 'bottom', round: 0.04, metal: 0.4, rough: 0.12 });
  k.box([0.05, 0.12, 0.8], [0.39, 0.12, 0], 0xcfd4d8, { parent: cab, round: 0.02, metal: 0.6 });
  const bed = k.group([-0.4, 0.5, 0], g); bed.userData.pivot = true;
  k.box([1.75, 0.08, 1.0], [0, 0, 0], 0x6f7f8a, { parent: bed, anchor: 'bottom', round: 0.03, metal: 0.4 });
  for (const z of [-0.47, 0.47]) k.box([1.75, 0.5, 0.06], [0, 0.04, z], 0x6f7f8a, { parent: bed, anchor: 'bottom', round: 0.03, metal: 0.4 });
  k.box([0.06, 0.55, 1.0], [0.86, 0.04, 0], 0x6f7f8a, { parent: bed, anchor: 'bottom', round: 0.03, metal: 0.4 });
  for (const x of [-1.0, -0.45, 1.0]) for (const z of [-0.45, 0.45]) wheel(k, g, x, 0.24, z, 0.24, 0.18);
  g.userData.bed = bed; return g;
}
// crawler crane with lattice boom and hook; call ctl.aim(worldVec, t) every frame
export function crawlerCrane(k, pos, rotY = 0, o = {}) {
  const L = o.boom ?? 9, ang = o.angle ?? 1.05, col = o.color ?? PAINT;
  const g = k.group(pos); g.rotation.y = rotY;
  tracks(k, g, 3.0, 2.0, 0.55, 0.55);
  const top = k.group([0, 0.62, 0], g);
  k.box([2.2, 0.8, 1.6], [-0.3, 0, 0], col, { parent: top, anchor: 'bottom', round: 0.12, rough: 0.42 });
  k.box([0.9, 1.0, 1.5], [-1.6, 0, 0], DARK, { parent: top, anchor: 'bottom', round: 0.15 });
  k.box([0.7, 0.75, 0.6], [0.65, 0.8, 0.55], col, { parent: top, anchor: 'bottom', round: 0.1, rough: 0.42 });
  k.box([0.45, 0.5, 0.62], [0.82, 0.92, 0.55], GLASS, { parent: top, anchor: 'bottom', round: 0.05, metal: 0.4, rough: 0.12 });
  const boom = k.group([0.6, 0.6, 0], top); boom.rotation.z = ang;
  for (const y of [-0.22, 0.22]) for (const z of [-0.3, 0.3]) k.rod([0, y, z], [L, y * 0.4, z * 0.4], 0.05, col, { parent: boom });
  for (let x = 0.5; x < L - 0.3; x += 0.6) { const f = 1 - 0.6 * x / L; k.rod([x, -0.22 * f, -0.3 * f], [x + 0.6, 0.22 * f, 0.3 * f], 0.022, col, { parent: boom }); k.rod([x, 0.22 * f, -0.3 * f], [x + 0.6, -0.22 * f, 0.3 * f], 0.022, col, { parent: boom }); }
  k.cyl(0.14, 0.3, [L, 0, 0], DARK, { parent: boom, axis: 'z' });
  const cable = k.cyl(0.018, 1, [0, 0, 0], 0x222222, { parent: k.root, seg: 6 }); cable.geometry.translate(0, -0.5, 0);
  const hook = k.group([0, 0, 0]); k.box([0.3, 0.35, 0.22], [0, 0, 0], PAINT, { parent: hook, round: 0.06 }); k.cyl(0.06, 0.25, [0, -0.3, 0], DARK, { parent: hook });
  const tip = new THREE.Vector3(), tmp = new THREE.Vector3(), base = new THREE.Vector3();
  const ctl = {
    g, top, hook, cable,
    aim(target, show = true) { // target: world point under the hook
      g.updateMatrixWorld(true); base.set(0, 0, 0); g.localToWorld(base);
      const yaw = Math.atan2(-(target.z - base.z), target.x - base.x) - g.rotation.y; top.rotation.y = yaw;
      if (o.luff) { const d = Math.hypot(target.x - base.x, target.z - base.z) / g.scale.x; boom.rotation.z = Math.min(1.4, Math.max(0.45, Math.acos(Math.min(1, Math.max(0, (d - 0.6) / L))))); }
      top.updateMatrixWorld(true); boom.updateMatrixWorld(true); tip.set(L, 0, 0); boom.localToWorld(tip);
      const ty = Math.min(tip.y - 0.4, target.y + 0.45); hook.position.set(tip.x, ty, tip.z);
      cable.position.copy(tip); cable.scale.y = Math.max(0.05, tip.y - ty); hook.visible = cable.visible = show;
    },
  };
  return ctl;
}
// truck-mounted concrete pump with 3-section boom; ctl.aim(worldPoint)
export function pumpTruck(k, pos, rotY = 0, o = {}) {
  const f = o.reach ?? 1, L1 = 3.2 * f, L2 = 3.0 * f, clear = o.clear; // clear: {r, h} 臂架在水平半径 r 处须高于 h（相对转台）
  const g = truck(k, pos, rotY, 0xd9dde0); g.userData.bed.visible = false;
  for (const [x, z] of [[-1.3, -0.75], [-1.3, 0.75], [0.4, -0.75], [0.4, 0.75]]) k.rod([x, 0.4, z * 0.6], [x, 0.05, z], 0.05, DARK, { parent: g });
  const tur = k.group([-0.5, 0.75, 0], g); k.cyl(0.3, 0.35, [0, 0, 0], 0xd9534f, { parent: tur, anchor: 'bottom' });
  const s1 = k.group([0, 0.35, 0], tur), s2 = k.group([L1, 0, 0], s1), s3 = k.group([L2, 0, 0], s2);
  for (const [s, l] of [[s1, L1], [s2, L2], [s3, 2.6]]) { k.box([l, 0.2, 0.18], [0, 0, 0], 0xd9534f, { parent: s, anchor: 'left', round: 0.05, rough: 0.4 }); k.rod([0.1, 0.16, 0], [l - 0.1, 0.16, 0], 0.05, 0x9aa1a6, { parent: s }); }
  const hose = k.cyl(0.07, 1, [0, 0, 0], RUBBER, { parent: k.root, seg: 10 }); hose.geometry.translate(0, -0.5, 0);
  const tip = new THREE.Vector3(), base = new THREE.Vector3();
  return {
    g, hose,
    aim(target, show = true, t = 0) {
      g.updateMatrixWorld(true); base.set(-0.5, 1.1, 0); g.localToWorld(base);
      tur.rotation.y = Math.atan2(-(target.z - base.z), target.x - base.x) - g.rotation.y;
      const d = Math.hypot(target.x - base.x, target.z - base.z); const sc = g.scale.x, reach = Math.max(1, Math.min(L1 + L2 + 2, d / sc));
      // fold search: s3 hangs near-vertical above the target; pick s1/s2 so the tip lands ~1.5 above it
      let best = 1e9, A = 0.95, Bb = 0; const dy = (target.y + 1.5 - base.y) / sc, s3c = 2.6 * Math.cos(1.45), s3s = 2.6 * Math.sin(1.45);
      for (let a = 0.3; a <= 1.45; a += 0.05) for (let b = -1.2; b <= 1.2; b += 0.05) { const x1 = L1 * Math.cos(a), y1 = L1 * Math.sin(a), x2 = x1 + L2 * Math.cos(b), y2 = y1 + L2 * Math.sin(b); let e = Math.abs(x2 + s3c - reach) + Math.abs(y2 - s3s - dy);
        if (clear) { const r = clear.r / sc, h = clear.h / sc; const hAt = (xa, ya, xb, yb) => (r >= Math.min(xa, xb) && r <= Math.max(xa, xb) && Math.abs(xb - xa) > 1e-3) ? ya + (yb - ya) * (r - xa) / (xb - xa) : 1e9; const hh = Math.min(hAt(0, 0, x1, y1), hAt(x1, y1, x2, y2)); if (hh < h) e += 3 * (h - hh); }
        if (e < best) { best = e; A = a; Bb = b; } }
      s1.rotation.z = A; s2.rotation.z = Bb - A; s3.rotation.z = -1.45 - Bb + 0.03 * Math.sin(t * 2);
      g.updateMatrixWorld(true); tip.set(2.6, 0, 0); s3.localToWorld(tip);
      hose.position.copy(tip); hose.scale.y = Math.max(0.1, tip.y - target.y - 0.2); hose.visible = show;
    },
  };
}
export function mixerTruck(k, pos, rotY = 0) {
  const g = truck(k, pos, rotY, 0xd9dde0); g.userData.bed.visible = false;
  const drum = k.group([-0.45, 1.05, 0], g); drum.rotation.z = 0.25;
  k.cyl(0.5, 1.5, [0, 0, 0], ORANGE, { parent: drum, axis: 'x', r2: 0.32, seg: 28, rough: 0.4 });
  for (let i = 0; i < 4; i++) { const b = k.box([1.3, 0.05, 0.06], [0, 0, 0], 0xb76a2a, { parent: drum }); b.rotation.x = i * Math.PI / 4; b.position.set(0, Math.cos(i) * 0.02, 0); }
  g.userData.drum = drum; return g;
}
export function roller(k, pos, rotY = 0) {
  const g = k.group(pos); g.rotation.y = rotY;
  const drum = k.cyl(0.5, 1.4, [0.9, 0.5, 0], 0x8a9097, { parent: g, axis: 'z', seg: 32, metal: 0.6, rough: 0.35 });
  k.box([0.4, 0.5, 1.5], [0.9, 0.85, 0], PAINT, { parent: g, round: 0.08 });
  k.box([1.4, 0.7, 1.2], [-0.4, 0.35, 0], PAINT, { parent: g, anchor: 'bottom', round: 0.12, rough: 0.42 });
  k.box([0.7, 0.7, 0.9], [-0.5, 1.05, 0], GLASS, { parent: g, anchor: 'bottom', round: 0.06, metal: 0.4, rough: 0.12 });
  for (const z of [-0.55, 0.55]) wheel(k, g, -0.65, 0.42, z, 0.42, 0.3);
  g.userData.drum = drum; return g;
}
// rotary drilling rig: crawler + vertical mast + kelly bar + drill bucket; ctl.set(depthY, spin)
export function rotaryRig(k, pos, rotY = 0, mastH = 9) {
  const g = k.group(pos); g.rotation.y = rotY;
  tracks(k, g, 3.0, 2.0, 0.55, 0.55);
  const top = k.group([0, 0.62, 0], g);
  k.box([2.4, 0.9, 1.6], [-0.6, 0, 0], PAINT, { parent: top, anchor: 'bottom', round: 0.12, rough: 0.42 });
  k.box([0.7, 0.8, 0.65], [0.5, 0.0, 0.5], PAINT, { parent: top, anchor: 'bottom', round: 0.1 }); k.box([0.5, 0.5, 0.66], [0.62, 0.25, 0.5], GLASS, { parent: top, anchor: 'bottom', round: 0.05, metal: 0.4, rough: 0.12 });
  k.box([0.35, mastH, 0.35], [1.5, -0.3, 0], PAINT, { parent: top, anchor: 'bottom', round: 0.05, rough: 0.42 });
  k.rod([0.3, 0.9, 0], [1.4, 4.0, 0], 0.08, CHROME, { parent: top });
  k.box([0.5, 0.5, 0.5], [1.75, 2.0, 0], DARK, { parent: top, round: 0.06 });
  const kelly = k.group([1.9, 0, 0], top); k.cyl(0.11, mastH, [0, 0, 0], 0x8a9097, { parent: kelly, anchor: 'top', seg: 12, metal: 0.7, rough: 0.3 }); kelly.position.y = mastH - 0.6;
  const bit = k.group([0, -mastH, 0], kelly); k.cyl(0.42, 0.9, [0, 0, 0], DARK, { parent: bit, anchor: 'top', seg: 24, metal: 0.4 }); for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2; k.box([0.08, 0.14, 0.08], [Math.cos(a) * 0.36, -0.95, Math.sin(a) * 0.36], 0x8a9097, { parent: bit, round: 0.02, metal: 0.6 }); }
  const base = new THREE.Vector3();
  return { g, top, kelly, bit, set(bitWorldY, spin) { g.updateMatrixWorld(true); base.set(0, 0, 0); top.localToWorld(base); kelly.position.y = Math.min(mastH - 0.6, bitWorldY - base.y + mastH + 0.9); bit.rotation.y = spin; } };
}
// diaphragm-wall hydraulic grab on a crawler base; ctl.set(grabWorldY, open)
export function grabRig(k, pos, rotY = 0) {
  const c = crawlerCrane(k, pos, rotY, { boom: 7, angle: 1.25, color: 0xd9a21e });
  const grab = k.group([0, 0, 0]); k.box([0.35, 1.6, 1.2], [0, 0, 0], DARK, { parent: grab, anchor: 'bottom', round: 0.06 });
  const jaws = [-1, 1].map(s => { const j = k.group([0, 0, s * 0.3], grab); k.box([0.38, 0.5, 0.12], [0, -0.25, 0], 0x8a9097, { parent: j, round: 0.03, metal: 0.5 }); return j; });
  c.hook.visible = false;
  return { ...c, grab, set(target, open, show = true) { c.aim(target, show); c.hook.visible = false; grab.position.set(c.hook.position.x, Math.min(c.hook.position.y - 0.4, target.y), c.hook.position.z); jaws.forEach((j, i) => { j.rotation.x = (i ? -1 : 1) * open * 0.6; }); grab.visible = show; } };
}
// worker figure with simple arm swing
export function worker(k, pos, helmet = PAINT, body = 0xf08a2a, rotY = 0) {
  const g = k.group(pos); g.rotation.y = rotY;
  for (const z of [-0.09, 0.09]) k.cyl(0.07, 0.5, [0, 0, z], 0x37474f, { parent: g, anchor: 'bottom', seg: 10 });
  k.box([0.28, 0.42, 0.38], [0, 0.5, 0], body, { parent: g, anchor: 'bottom', round: 0.1 });
  const arm = k.group([0, 0.86, 0.23], g); k.cyl(0.05, 0.4, [0, -0.2, 0], body, { parent: arm, seg: 8 });
  k.mesh(new THREE.SphereGeometry(0.12, 16, 12), 0xe8c4a0, [0, 1.04, 0], { parent: g });
  k.mesh(new THREE.SphereGeometry(0.14, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2), helmet, [0, 1.07, 0], { parent: g, rough: 0.35 });
  g.userData.arm = arm; return g;
}
// particles flowing along a polyline (mud, grout, water, muck); returns update(t, on)
export function flow(k, pts, n = 16, color = 0x7d6a55, size = 0.08, speed = 0.25, parent) {
  const curve = new THREE.CatmullRomCurve3(pts.map(p => new THREE.Vector3(...p)), false, 'catmullrom', 0.2);
  const mat = k.mat(color, { rough: 0.45 }); const geo = new THREE.IcosahedronGeometry(size, 0); const ms = [];
  for (let i = 0; i < n; i++) { const m = new THREE.Mesh(geo, mat); (parent || k.root).add(m); ms.push(m); }
  const v = new THREE.Vector3();
  return (t, on, frac = 1) => ms.forEach((m, i) => { const u = (t * speed + i / n) % 1; m.visible = on && u <= frac; if (!m.visible) return; curve.getPointAt(Math.min(1, u), v); m.position.copy(v); m.rotation.set(u * 9, u * 7, 0); });
}
// thin hazard/guard rail along a polyline (purely visual)
export function rail(k, a, b, h = 0.9, color = 0xe8e4d8, parent) {
  const g = k.group([0, 0, 0], parent); const A = new THREE.Vector3(...a), B = new THREE.Vector3(...b); const n = Math.max(1, Math.round(A.distanceTo(B) / 1.2));
  for (let i = 0; i <= n; i++) { const p = A.clone().lerp(B, i / n); k.cyl(0.03, h, [p.x, p.y, p.z], color, { parent: g, anchor: 'bottom', seg: 8 }); }
  k.rod([a[0], a[1] + h, a[2]], [b[0], b[1] + h, b[2]], 0.03, 0xd9534f, { parent: g }); k.rod([a[0], a[1] + h * 0.5, a[2]], [b[0], b[1] + h * 0.5, b[2]], 0.025, color, { parent: g });
  return g;
}
// find a registered part by name (first match), or all
export const partsNamed = (k, name) => k.parts.filter(p => p.name === name);
// visibility helper: object shown only on steps in list (and optional p window)
export const onSteps = (s, p, steps, win = [0, 1]) => steps.includes(s) && p >= win[0] && p <= win[1];
// a stretchable beam between two points (boom arms, hoses); call set(a, b)
export function beam(k, color, r = 0.08, parent, o = {}) {
  const m = k.cyl(r, 1, [0, 0, 0], color, { parent, seg: 12, ...o }); m.geometry.translate(0, 0.5, 0);
  const A = new THREE.Vector3(), B = new THREE.Vector3(), up = new THREE.Vector3(0, 1, 0);
  m.set = (a, b) => { A.copy(a); B.copy(b); m.position.copy(A); const d = B.sub(A); const L = d.length() || 1e-3; m.scale.set(1, L, 1); m.quaternion.setFromUnitVectors(up, d.divideScalar(L)); };
  return m;
}
// tower crane: lattice mast + jib + counter-jib + cab + trolley (same contract as Kit.crane: userData.top)
export function towerCrane(k, pos, rotY = 0, h = 6, jib = 6) {
  const g = k.group(pos); g.rotation.y = rotY; const col = 0xf2c230, w = 0.36;
  k.box([1.8, 0.45, 1.8], [0, 0, 0], 0x9aa1a6, { parent: g, anchor: 'bottom', round: 0.06 });
  const m = k.group([0, 0.45, 0], g);
  for (const [x, z] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) k.rod([x * w / 2, 0, z * w / 2], [x * w / 2, h, z * w / 2], 0.035, col, { parent: m });
  for (let y = 0; y < h - 0.2; y += 0.7) for (const [a, b] of [[[-1, -1], [1, -1]], [[1, -1], [1, 1]], [[1, 1], [-1, 1]], [[-1, 1], [-1, -1]]]) k.rod([a[0] * w / 2, y, a[1] * w / 2], [b[0] * w / 2, y + 0.7, b[1] * w / 2], 0.015, col, { parent: m });
  const top = new THREE.Group(); top.position.y = h + 0.5; g.add(top);
  k.box([0.6, 0.55, 0.55], [0.1, -0.3, 0.45], col, { parent: top, round: 0.06 }); k.box([0.4, 0.35, 0.56], [0.2, -0.25, 0.46], GLASS, { parent: top, round: 0.04, metal: 0.4, rough: 0.12 });
  const L = jib - 1;
  for (const z of [-0.18, 0.18]) k.rod([-0.2, 0, z], [L, 0, z * 0.6], 0.03, col, { parent: top });
  k.rod([-0.2, 0.42, 0], [L, 0.05, 0], 0.03, col, { parent: top });
  for (let x = 0; x < L - 0.3; x += 0.5) k.rod([x, 0, 0.18], [x + 0.5, 0.4 * (1 - (x + 0.5) / L), 0], 0.012, col, { parent: top });
  k.rod([0, 0, 0], [-2.0, 0, 0], 0.05, col, { parent: top }); k.box([0.7, 0.55, 0.55], [-1.8, -0.2, 0], 0x7c8389, { parent: top, round: 0.05 });
  k.cyl(0.04, 1.2, [0, 0.6, 0], col, { parent: top }); k.rod([0, 1.2, 0], [L * 0.7, 0.1, 0], 0.012, 0x444444, { parent: top }); k.rod([0, 1.2, 0], [-1.9, 0.1, 0], 0.012, 0x444444, { parent: top });
  k.box([0.3, 0.15, 0.3], [L * 0.8, -0.1, 0], DARK, { parent: top, round: 0.03 });
  g.userData.top = top; return g;
}
// hide a built group's existing children (keep the group so its part animation still applies), then adopt new ones
export function reskin(obj, ...kids) { for (const c of [...obj.children]) c.visible = false; kids.forEach(c => obj.add(c)); return obj; }
// hydraulic jack (prestress) aligned on x
export function jack(k, pos, dir = 1) { const g = k.group(pos); k.cyl(0.22, 0.7, [dir * 0.35, 0, 0], 0x3e6d8c, { parent: g, axis: 'x', seg: 18, metal: 0.4 }); k.cyl(0.08, 0.5, [dir * 0.85, 0, 0], CHROME, { parent: g, axis: 'x', metal: 0.8, rough: 0.2 }); return g; }
// asphalt paver body (front hopper at +x, screed area at -x); screed supplied by caller
export function paver(k, pos = [0, 0, 0], rotY = 0) {
  const g = k.group(pos); g.rotation.y = rotY;
  tracks(k, g, 2.4, 2.2, 0.5, 0.45);
  k.box([2.4, 0.7, 2.6], [-0.1, 0.5, 0], PAINT, { parent: g, anchor: 'bottom', round: 0.12, rough: 0.42 });
  const hop = k.group([1.25, 0.6, 0], g); k.box([0.9, 0.12, 2.8], [0, 0, 0], DARK, { parent: hop, anchor: 'bottom' });
  for (const s of [-1, 1]) { const w = k.box([0.9, 0.7, 0.08], [0, 0.4, s * 1.4], PAINT, { parent: hop, round: 0.03 }); w.rotation.x = s * 0.45; }
  k.box([0.6, 0.12, 0.6], [-0.5, 1.2, 0.7], DARK, { parent: g, anchor: 'bottom' }); for (const [x, z] of [[-0.75, 0.45], [-0.25, 0.45], [-0.75, 0.95], [-0.25, 0.95]]) k.cyl(0.03, 1.0, [x, 1.2, z], DARK, { parent: g, anchor: 'bottom' });
  k.box([1.0, 0.06, 1.6], [-0.5, 2.2, 0.5], 0xd9dde0, { parent: g, anchor: 'bottom', round: 0.03 });
  k.cyl(0.12, 3.6, [-1.35, 0.35, 0], 0x8a9097, { parent: g, axis: 'z', seg: 14, metal: 0.6 });
  k.cyl(0.07, 0.9, [-0.9, 1.2, -0.7], DARK, { parent: g, anchor: 'bottom' });
  return g;
}
// total station on a wooden tripod (Kit tripod contract)
export function totalStation(k, pos) {
  const g = k.group(pos);
  for (let i = 0; i < 3; i++) { const a = i * 2.1; k.rod([0, 1.25, 0], [Math.cos(a) * 0.45, 0, Math.sin(a) * 0.45], 0.028, 0xb98a4a, { parent: g }); k.rod([Math.cos(a) * 0.4, 0.1, Math.sin(a) * 0.4], [Math.cos(a) * 0.46, 0, Math.sin(a) * 0.46], 0.02, CHROME, { parent: g }); }
  k.cyl(0.14, 0.06, [0, 1.25, 0], 0xf2c230, { parent: g, anchor: 'bottom', seg: 3 }); k.cyl(0.1, 0.08, [0, 1.31, 0], DARK, { parent: g, anchor: 'bottom', seg: 16 });
  const head = k.group([0, 1.39, 0], g);
  for (const z of [-0.1, 0.1]) k.box([0.16, 0.28, 0.05], [0, 0, z], 0xf2c230, { parent: head, anchor: 'bottom', round: 0.02 });
  k.box([0.14, 0.12, 0.17], [-0.06, 0.02, 0], 0x2f3538, { parent: head, anchor: 'bottom', round: 0.02 });
  k.cyl(0.065, 0.26, [0.02, 0.2, 0], DARK, { parent: head, axis: 'x', seg: 16 }); k.cyl(0.05, 0.02, [0.155, 0.2, 0], GLASS, { parent: head, axis: 'x', seg: 16, metal: 0.4, rough: 0.1 });
  g.userData.head = head; return g;
}
