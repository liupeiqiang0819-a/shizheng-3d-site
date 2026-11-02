// 盖挖逆作为什么先做顶板 — top-down construction (3D)
import { COLORS as C } from '../engine.js';
import { pitGround, pitWalls, lift, slab, car } from './common.js';

const PX = 3.7, PZ = 4.7, BASE = -9, HOLE = [1.4, 3.2, -3.6, -1.6]; // x0,x1,z0,z1 of muck opening

export default {
  cams: [
    { pos: [9, 8, 25], target: [0, -5, -1] }, { pos: [8, 9, 21], target: [0, -2, -1] }, { pos: [10, 10, 22], target: [0, -1, -1] },
    { pos: [7, -1, 19], target: [0, -4.5, -1] }, { pos: [7, -2, 19], target: [0, -6.5, -1] }, { pos: [9, 6, 23], target: [0, -4.5, -1] },
  ],
  phases: ['土体保留，围护与中间柱先提供支承', '浅挖后形成永久顶板，预留出土口', '达到强度和防水验收条件，才恢复路面', '顶板下取土，随层完成侧墙与中板', '中板达到条件后，继续下层开挖和成型', '闭合预留口，核查逆作接缝与连续防水'],
  build(k) {
    pitGround(k, { px: PX, pz: PZ, base: BASE });
    k.box([24, 0.08, 2.6], [0, 0.04, -6.4], C.asphalt); k.part(k.box([24, 0.08, 2.6], [0, 0.04, 6.4], C.asphalt), { front: true });
    k.building([8.8, 0, -3.2], [4.6, 6.5, 4.2]); k.tree([-10.5, 0, -4.6], 1.2); k.tree([-9.5, 0, -1.8]);
    pitWalls(k, { px: PX, pz: PZ });
    for (const z of [-2.25, 2.25]) {
      const g = k.group([0, 0, z]); k.box([0.5, 13, 0.5], [0, -0.3, 0], C.steel, { parent: g, anchor: 'top', metal: 0.5 }); k.cyl(0.6, 2.5, [0, -12.8, 0], C.concreteDark, { parent: g, anchor: 'bottom' });
      k.part(g, { name: '中间柱', on: 0, enter: 'grow', win: [0.35, 0.7], front: z > 0 });
    }
    // muck opening outline helper: slab pieces avoiding the hole (back half only has the hole)
    const holedSlab = (y, h, color, opts) => {
      const [hx0, hx1, hz0, hz1] = HOLE; const pcs = [];
      pcs.push(k.zbox(2 * PX, h, -PZ, hz0, 0, y, color, { anchor: 'bottom' }), k.zbox(2 * PX, h, hz1, 0, 0, y, color, { anchor: 'bottom' }));
      pcs.push(k.zbox(hx0 + PX, h, hz0, hz1, (-PX + hx0) / 2, y, color, { anchor: 'bottom' }), k.zbox(PX - hx1, h, hz0, hz1, (hx1 + PX) / 2, y, color, { anchor: 'bottom' }));
      const g = k.group(); pcs.forEach(m => { k.root.remove(m); g.add(m); }); k.part(g, opts);
      k.part(k.zbox(2 * PX, h, 0, PZ, 0, y, color, { anchor: 'bottom' }), { ...opts, front: true });
    };
    const L1 = lift(k, PX, PZ, 0, -1.6, 1, [0.02, 0.3], C.soil1);
    lift(k, PX, PZ, -1.6, -5.2, 3, [0.02, 0.45], C.soil2);
    lift(k, PX, PZ, -5.2, BASE, 4, [0.02, 0.45], C.clay);
    void L1;
    holedSlab(-1.6, 0.6, C.concreteNew, { name: '顶板', on: 1, enter: 'drop', from: 1.5, win: [0.35, 0.72] });
    k.part(k.zbox(HOLE[1] - HOLE[0], 0.08, HOLE[2], HOLE[3], (HOLE[0] + HOLE[1]) / 2, -1.0, C.membrane), { off: 0 });
    // step 2: backfill + road, fenced opening, cars
    const fill = k.group(); const [hx0, hx1, hz0, hz1] = HOLE;
    for (const [sx, sz, x, z] of [[2 * PX, -hz0 - PZ, 0, (-PZ + hz0) / 2], [2 * PX, -hz1, 0, hz1 / 2], [hx0 + PX, hz1 - hz0, (-PX + hx0) / 2, (hz0 + hz1) / 2], [PX - hx1, hz1 - hz0, (hx1 + PX) / 2, (hz0 + hz1) / 2]]) k.box([sx, 0.95, sz], [x, -1.0, z], C.fill, { parent: fill, anchor: 'bottom', flat: true });
    k.part(fill, { name: '回填', on: 2, enter: 'grow', win: [0.05, 0.4] });
    k.part(k.zbox(2 * PX, 0.95, 0, PZ, 0, -1.0, C.fill, { anchor: 'bottom', flat: true }), { name: '回填', on: 2, enter: 'grow', win: [0.05, 0.4], front: true });
    holedSlab(-0.05, 0.1, C.asphalt, { name: '路面', on: 2, enter: 'fade', win: [0.42, 0.58] });
    const fence = k.group([(hx0 + hx1) / 2, 0, (hz0 + hz1) / 2]);
    for (const [a, b] of [[[-0.95, -1.05], [0.95, -1.05]], [[0.95, -1.05], [0.95, 1.05]], [[0.95, 1.05], [-0.95, 1.05]], [[-0.95, 1.05], [-0.95, -1.05]]]) { k.rod([a[0], 0.9, a[1]], [b[0], 0.9, b[1]], 0.05, C.red, { parent: fence }); k.rod([a[0], 0, a[1]], [a[0], 0.9, a[1]], 0.05, C.white, { parent: fence }); }
    k.part(fence, { name: '出土口', on: 1, enter: 'pop', win: [0.75, 0.9], hl: [1, 2], off: 5, exit: 'fade', outWin: [0.05, 0.2] });
    const cars = [car(k, [-9, 0.05, -5.8], 0x4d7fb8), car(k, [6, 0.05, -7], 0xc9504a, Math.PI), car(k, [-4, 0.05, 0.6], 0xe1e4e6)];
    cars.forEach((c, i) => k.part(c, i === 2 ? { on: 2, enter: 'fade', win: [0.6, 0.75] } : {}));
    // step 3/4: structure under the slab
    const lining = (yb, yt, on, win) => { for (const x of [-1, 1]) k.split((a, b) => k.zbox(0.5, yt - yb, a, b, x * (PX - 0.25), yb, C.concreteNew, { anchor: 'top' }), { name: '侧墙', on, enter: 'grow', win }, -PZ, PZ); };
    for (const x of [-1, 1]) k.split((a, b) => k.zbox(0.5, -1.6 + 5.2 - 0.5, a, b, x * (PX - 0.25), -1.6, C.concreteNew, { anchor: 'top' }), { name: '侧墙', on: 3, enter: 'grow', win: [0.5, 0.7] }, -PZ, PZ);
    holedSlab(-5.2, 0.5, C.concreteNew, { name: '中板', on: 3, enter: 'fade', win: [0.72, 0.92] });
    void lining;
    for (const x of [-1, 1]) k.split((a, b) => k.zbox(0.5, -5.2 - BASE - 0.3, a, b, x * (PX - 0.25), -5.2, C.concreteNew, { anchor: 'top' }), { name: '侧墙', on: 4, enter: 'grow', win: [0.76, 0.95] }, -PZ, PZ);
    slab(k, PX, PZ, BASE, 0.15, C.concreteDark, { name: '垫层', on: 4, enter: 'fade', win: [0.48, 0.55] });
    slab(k, PX, PZ, BASE + 0.15, 0.06, C.membrane, { name: '防水', on: 4, enter: 'fade', win: [0.55, 0.6] });
    slab(k, PX, PZ, BASE + 0.21, 0.8, C.concreteNew, { name: '底板', on: 4, enter: 'grow', win: [0.6, 0.75] });
    // excavator under the slab, crane lifting muck through the opening
    const ex = k.excavator([-1.2, -5.2, -2.6], Math.PI * 0.1, 0.8); k.part(ex, { on: 3, off: 5, enter: 'none', exit: 'none', win: [0, 0.01], outWin: [0, 0.01] });
    const cr = k.crane([(hx0 + hx1) / 2 + 3.5, 0.0, -5.6], Math.PI * 0.75, 4.5, 4.5); k.part(cr, { on: 3, off: 5, enter: 'none', exit: 'none', win: [0, 0.01], outWin: [0, 0.01] });
    const bucket = k.box([0.9, 0.7, 0.9], [(hx0 + hx1) / 2, -3, (hz0 + hz1) / 2], C.slurry); k.part(bucket, { on: 3, off: 5, enter: 'none', exit: 'none', win: [0, 0.01], outWin: [0, 0.01] });
    k.onUpdate((s, p, t) => {
      k.animateExcavator(ex, t, 1);
      ex.position.y = s === 3 ? -1.6 - 3.6 * Math.min(1, p / 0.45) : BASE + (s === 4 ? (1 - Math.min(1, p / 0.45)) * 3.8 : 0) - (s === 3 ? 0 : 0) + (s === 4 ? 0 : 0);
      if (s === 3) ex.position.y = -1.6 - 3.6 * Math.min(1, p / 0.45);
      if (s === 4) ex.position.y = -5.2 - 3.8 * Math.min(1, p / 0.45);
      bucket.position.y = -6 + 7 * (0.5 + 0.5 * Math.sin(t * 0.8));
      cars[0].position.x = -11 + ((t * 2) % 22); cars[1].position.x = 11 - ((t * 1.6 + 7) % 22);
      cars[2].position.x = s >= 2 ? -10 + ((t * 1.8 + 3) % 20) : -4;
    });
    // closing the openings, joint inspection
    for (const y of [-1.6, -5.2]) k.part(k.zbox(hx1 - hx0, y === -1.6 ? 0.6 : 0.5, hz0, hz1, (hx0 + hx1) / 2, y, C.concreteNew, { anchor: 'bottom' }), { name: '预留口', on: 5, enter: 'drop', from: 1, win: [0.1, 0.4] });
    for (const y of [-1.6, -5.2, BASE + 1.0]) for (const x of [-1, 1]) k.part(k.zbox(0.1, 0.1, -PZ, 0, x * (PX - 0.52), y, C.red, { emissive: C.red, ei: 0.6 }), { name: '接缝', on: 5, enter: 'fade', win: [0.45, 0.6] });
    k.label('上下对应的有限出土口', [(hx0 + hx1) / 2, 1.4, (hz0 + hz1) / 2], { steps: [1, 2, 3, 4] });
    k.label('下层土体仍保留；本层墙板逐步形成', [0, -6.8, 0.3], { steps: [3] });
    k.label('侧墙已随层完成；本步检查接缝与闭合部位', [0, -10.5, 0.3], { steps: [5] });
  },
};
