import * as THREE from 'three';
// shared builders for pit-type lessons
import { COLORS as C, table, Kit } from '../engine.js';

// Ground block with a rectangular pit [-px,px]x[-pz,pz] (walls of thickness wt outside it). Returns helpers.
export function pitGround(k, o) {
  const { px, pz, wt = 0.6, yb = -14, X = 12, Z = 8, cols = [C.soil1, C.soil2, C.clay, C.soil3, C.soil4], hs = [2.2, 2.8, 3, 3, 3], base = -9 } = o;
  table(k, -X, X, -Z, Z, yb);
  const ox = px + wt, oz = pz + wt;
  const strata = (x0, x1, za, zb, yt = 0) => k.strata(x0, x1, yb, yt, za, zb, { colors: cols, heights: hs });
  k.split((a, b) => strata(-X, -ox, a, b), { soil: true }, -Z, Z);
  k.split((a, b) => strata(ox, X, a, b), { soil: true }, -Z, Z);
  k.part(strata(-ox, ox, -Z, -oz), { soil: true });
  k.part(strata(-ox, ox, oz, Z), { soil: true, front: true });
  if (base > yb) k.split((a, b) => k.zbox(2 * px, base - yb, a, b, 0, yb, cols[cols.length - 1], { anchor: 'bottom', flat: true }), { soil: true }, -pz, pz);
  return { ox, oz };
}
// retaining walls around the pit, grown downward in step `on`
export function pitWalls(k, o) {
  const { px, pz, wt = 0.6, bottom = -12.5, on = 0, win = [0.02, 0.35], name = '围护结构', color = C.concrete } = o;
  const oz = pz + wt; const W = { name, on, enter: 'grow', win };
  for (const x of [-1, 1]) k.split((a, b) => k.zbox(wt, -bottom + 0.3, a, b, x * (px + wt / 2), 0.3, color, { anchor: 'top' }), W, -oz, oz);
  k.part(k.zbox(2 * px, -bottom + 0.3, -oz, -pz, 0, 0.3, color, { anchor: 'top' }), W);
  k.part(k.zbox(2 * px, -bottom + 0.3, pz, oz, 0, 0.3, color, { anchor: 'top' }), { ...W, front: true });
}
// soil lift inside pit split in halves; returns meshes
export function lift(k, px, pz, yt, yb, step, win, color, extra = {}) {
  return k.split((a, b) => k.zbox(2 * px, yt - yb, a, b, 0, yb, color, { anchor: 'bottom', flat: true }), { soil: true, off: step, exit: 'grow', outWin: win, ...extra }, -pz, pz);
}
// a slab in the pit (split)
export function slab(k, px, pz, y, h, color, opts, inset = 0) {
  return k.split((a, b) => k.zbox(2 * (px - inset), h, a, b, 0, y, color, { anchor: 'bottom' }), opts, -pz, pz);
}
export function marker(k, pos, opts = {}) {
  const g = k.group(pos); k.cyl(0.07, 0.6, [0, 0, 0], C.white, { parent: g, anchor: 'bottom', seg: 8 }); k.cyl(0.17, 0.14, [0, 0.6, 0], C.red, { parent: g, seg: 12, emissive: C.red, ei: 0.3 });
  return k.part(g, { name: '监测点', enter: 'pop', ...opts });
}
export function car(k, pos, color = 0x4d7fb8, rotY = 0) {
  const g = k.group(pos); g.rotation.y = rotY;
  k.box([1.6, 0.4, 0.8], [0, 0.15, 0], color, { parent: g, anchor: 'bottom' }); k.box([0.9, 0.35, 0.72], [-0.1, 0.55, 0], 0xdfe8ee, { parent: g, anchor: 'bottom', rough: 0.3 });
  for (const x of [-0.5, 0.5]) for (const z of [-0.4, 0.4]) k.cyl(0.16, 0.12, [x, 0.16, z], 0x222222, { parent: g, axis: 'z', seg: 10 });
  return g;
}
// a simple worker figure; helmet colour distinguishes roles
export function person(k, pos, helmet = 0xf2c230, body = 0x2f6fb0) {
  if (k.hq && Kit.hqProps) return Kit.hqProps.worker(k, pos, helmet, body);
  const g = k.group(pos); k.cyl(0.22, 0.9, [0, 0, 0], body, { parent: g, anchor: 'bottom', seg: 10 }); k.cyl(0.2, 0.1, [0, 0.9, 0], 0xe8c4a0, { parent: g, seg: 10 });
  k.mesh(new THREE.SphereGeometry(0.2, 12, 8), 0xe8c4a0, [0, 1.12, 0], { parent: g }); k.mesh(new THREE.SphereGeometry(0.23, 12, 6, 0, Math.PI * 2, 0, Math.PI / 2), helmet, [0, 1.16, 0], { parent: g });
  return g;
}
export function tripod(k, pos) {
  if (k.hq && Kit.hqProps) return Kit.hqProps.totalStation(k, pos);
  const g = k.group(pos); for (let i = 0; i < 3; i++) { const a = i * 2.1; k.rod([0, 1.3, 0], [Math.cos(a) * 0.45, 0, Math.sin(a) * 0.45], 0.03, 0x444444, { parent: g }); }
  k.box([0.3, 0.32, 0.25], [0, 1.3, 0], C.machine, { parent: g, anchor: 'bottom' }); k.cyl(0.07, 0.3, [0.05, 1.5, 0], 0x333333, { parent: g, axis: 'x' }); return g;
}
