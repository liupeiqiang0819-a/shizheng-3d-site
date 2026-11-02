import { THREE, roller, paver, truck, worker, flow, reskin, DARK as DARKF } from './lib.js';
const ZS = -2.2; // 剖切时机械走在保留的后半幅中线上
export default {
  build(k) {
    // 原压路机、摊铺机外形换成精细模型（位置与动作仍由原课件驱动，仅在剖切时把横向位置移到保留半幅）
    const R = k.root.children.find(o => o.isGroup && o.userData.screed === undefined && o.children.length === 5 && o.children[0].geometry?.parameters?.radiusTop === 0.55);
    const r = roller(k, [0, 0, 0], 0); r.scale.set(1.15, 1.15, 1.55); if (R) reskin(R, r);
    const P = k.root.children.find(o => o.isGroup && o.userData.screed);
    const pv = paver(k, [0, 0, 0], 0); const baseSc = P?.userData.screed; if (P) reskin(P, pv);
    // 熨平板：贴在铺层上，横跨摊铺宽度
    const sc = k.box([0.55, 0.3, 1], [-1.6, 0, 0], 0x5b6168, { parent: pv, anchor: 'bottom', round: 0.04 });
    const T = k.root.children.filter(o => o.isGroup && o !== P && o !== R && o.userData.bed).pop();
    // 第4步透层油洒布车：去掉自卸车厢，换成保温沥青罐 + 尾部洒布管
    if (T) { T.userData.bed.visible = false; const tank = k.group([-0.4, 0.5, 0], T);
      k.cyl(0.42, 1.75, [0, 0.44, 0], 0x2f3337, { parent: tank, axis: 'x', seg: 22, rough: 0.35, metal: 0.3 });
      for (const x of [-0.85, 0.85]) k.cyl(0.43, 0.06, [x, 0.44, 0], 0x6f7f8a, { parent: tank, axis: 'x', seg: 22, metal: 0.5 });
      k.cyl(0.1, 0.12, [0.2, 0.9, 0], 0x6f7f8a, { parent: tank, seg: 12 }); k.box([1.7, 0.08, 0.7], [0, 0, 0], DARKF, { parent: tank, anchor: 'bottom' }); }
    // 第5步：自卸车倒车贴近摊铺机料斗，车厢后铰点翻起卸料
    const dt = truck(k, [0, 0, 0], 0, 0x6b7378); const bed = dt.userData.bed;
    const mixF = flow(k, [[-0.7, 1.2, 0], [-1.35, 0.85, 0], [-1.75, 0.75, 0]], 14, 0x26282a, 0.09, 0.5, dt);
    const bar = k.box([0.1, 0.1, 1], [0, 0, 0], 0x5a3b22, { sharp: true });
    const spr = Array.from({ length: 24 }, () => k.mesh(new THREE.SphereGeometry(0.04, 6, 4), 0x5a3b22, [0, -5, 0], { shadow: false }));
    const sv = worker(k, [-6, 0, 6.2], 0xf2c230, 0xf08a2a, Math.PI / 2); const tri = k.group([-5.2, 0, 6.2]); for (let i = 0; i < 3; i++) { const a = i * 2.1; k.rod([0, 1.1, 0], [Math.cos(a) * 0.35, 0, Math.sin(a) * 0.35], 0.02, 0x8a6a3a, { parent: tri }); } k.box([0.18, 0.2, 0.18], [0, 1.2, 0], 0xf2c230, { parent: tri, round: 0.03 });
    k.onUpdate((s, p, t, st) => {
      const sec = !!st?.section;
      if (R) { if (sec) R.position.z = Math.min(R.position.z, -1.25); r.userData.drum.rotation.z = -t * 3 * (R.rotation.y ? -1 : 1); }
      if (P) { if (sec) P.position.z = ZS; const w = sec ? 4.3 : 8.7; sc.scale.z = w; sc.position.z = 0;
        if (baseSc) { sc.material.emissive.copy(baseSc.material.emissive); sc.material.emissiveIntensity = baseSc.material.emissiveIntensity; } }
      sv.visible = tri.visible = s === 0 && p > 0.6;
      const tOn = s === 4 && P && P.visible; dt.visible = !!tOn;
      if (tOn) { const a = 0.5; dt.position.set(P.position.x + 3.05, P.position.y, P.position.z); bed.rotation.z = a; bed.position.set(-1.275 + 0.875 * Math.cos(a), 0.5 + 0.875 * Math.sin(a), 0); mixF(t, true); } else mixF(t, false);
      bar.visible = s === 3 && !!T && T.visible;
      if (bar.visible) { if (sec) T.position.z = Math.min(T.position.z, -1.4); bar.scale.z = sec ? 2.6 : 3.6; bar.position.set(T.position.x - 1.5, T.position.y + 0.45, T.position.z); }
      spr.forEach((m, i) => { m.visible = bar.visible; if (!m.visible) return; const u = (t * 1.5 + i / 24) % 1; m.position.set(bar.position.x - 0.1, bar.position.y - u * 0.45, bar.position.z + (i % 12 / 11 - 0.5) * bar.scale.z); });
    });
  },
};
