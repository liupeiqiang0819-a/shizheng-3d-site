// V15 3D construction-animation engine (Three.js, offline). Shared by all upgraded lessons.
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { SSAOPass } from 'three/examples/jsm/postprocessing/SSAOPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';

export { THREE };
const clamp01 = v => Math.max(0, Math.min(1, v));
export const smooth = (p, a = 0, b = 1) => { const t = clamp01((p - a) / ((b - a) || 1e-6)); return t * t * (3 - 2 * t); };
export const lerp = (a, b, t) => a + (b - a) * t;

export const COLORS = {
  soil1: 0xc9a77c, soil2: 0xb48d62, soil3: 0x9d7a55, soil4: 0x8a6a4a, sand: 0xd9c08f, clay: 0xa98361,
  fill: 0xbf9f74, concrete: 0xb9bdb7, concreteNew: 0xd8dcd3, concreteDark: 0x8e958f, steel: 0x3d5a6c, steelLight: 0x7f98a6,
  rebar: 0x7a4b32, water: 0x4aa3c8, slurry: 0x7d6a55, membrane: 0x2f3b45, asphalt: 0x3a3d40, road: 0x6b6f70,
  machine: 0xf2c230, machineDark: 0x2c3136, yellow: 0xf2c94c, red: 0xd9534f, green: 0x4f8f5f, glass: 0x9fc6d8,
  grass: 0x9dbb7d, wood: 0xa0774f, grout: 0x9aa7b8, segment: 0xc7cbc4, white: 0xf3f3ee, blue: 0x2f6fb0,
};

function detectTier(mobile) {
  try { const f = new URLSearchParams(location.search).get('v15tier') || localStorage.getItem('v15-tier'); if (f === 'high' || f === 'mid' || f === 'low') { detectTier.forced = true; return f; } } catch {}
  const cores = navigator.hardwareConcurrency || 4, mem = navigator.deviceMemory || 4;
  if (mobile) return cores <= 4 || mem <= 3 ? 'low' : 'mid';
  return cores <= 2 || mem <= 2 ? 'mid' : 'high';
}
// 精致 finishing pass: soil gets a soft top-to-bottom gradient + grain texture, everything gets env lighting
const _grains = {};
export function grainTex(kind = 'soil') {
  if (_grains[kind]) return _grains[kind]; const soft = kind === 'concrete';
  const N = 256, c = document.createElement('canvas'); c.width = c.height = N; const g = c.getContext('2d');
  g.fillStyle = soft ? '#f0f0f0' : '#dedede'; g.fillRect(0, 0, N, N); let seed = 7; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  for (let i = 0; i < 4200; i++) { const v = (soft ? 232 : 200) + rnd() * (soft ? 18 : 55) | 0; g.fillStyle = `rgb(${v},${v},${v})`; const r = 0.6 + rnd() * 2.2; g.beginPath(); g.arc(rnd() * N, rnd() * N, r, 0, 7); g.fill(); }
  for (let i = 0; i < (soft ? 30 : 90); i++) { const v = 120 + rnd() * 50 | 0; g.fillStyle = `rgba(${v},${v - 6},${v - 14},0.85)`; g.beginPath(); g.ellipse(rnd() * N, rnd() * N, 1.5 + rnd() * 3, 1 + rnd() * 2, rnd() * 3, 0, 7); g.fill(); }
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(0.45, 0.45); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
  return (_grains[kind] = t);
}
export function hqFinish(kit) {
  const tex = grainTex(), tmp = new THREE.Color();
  for (const p of kit.parts) if (p.soil) p.obj.traverse(n => {
    if (!n.isMesh || n.userData.noGrade) return; const g = n.geometry; g.computeBoundingBox(); const bb = g.boundingBox; const y0 = bb.min.y, y1 = bb.max.y;
    const pos = g.attributes.position, col = new Float32Array(pos.count * 3); const base = n.material.color.clone();
    for (let i = 0; i < pos.count; i++) { const k = (pos.getY(i) - y0) / ((y1 - y0) || 1); tmp.copy(base).multiplyScalar(0.66 + 0.46 * Math.pow(k, 0.8)); col[i * 3] = tmp.r; col[i * 3 + 1] = tmp.g; col[i * 3 + 2] = tmp.b; }
    // world-scaled planar UVs so the grain keeps one size on boxes and extrusions alike
    if (!g.attributes.normal) g.computeVertexNormals(); const nr = g.attributes.normal, uv = new Float32Array(pos.count * 2);
    for (let i = 0; i < pos.count; i++) { const ax = Math.abs(nr.getX(i)), ay = Math.abs(nr.getY(i)), az = Math.abs(nr.getZ(i)); const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i);
      if (ay >= ax && ay >= az) { uv[i * 2] = x; uv[i * 2 + 1] = z; } else if (ax >= az) { uv[i * 2] = z; uv[i * 2 + 1] = y; } else { uv[i * 2] = x; uv[i * 2 + 1] = y; } }
    g.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
    g.setAttribute('color', new THREE.BufferAttribute(col, 3)); n.material.vertexColors = true; n.material.color.setHex(0xffffff); n.material.map = tex; n.material.roughness = 0.96; n.material.flatShading = false; n.material.envMapIntensity = 0.22; n.material.needsUpdate = true;
  });
}

const isMobile = () => matchMedia('(max-width: 760px)').matches || /Mobi|Android|iPhone/.test(navigator.userAgent);

// ---------------------------------------------------------------- Kit: builds the lesson model
export class Kit {
  constructor(stage) { this.stage = stage; this.root = new THREE.Group(); this.parts = []; this.labels = []; this.matCache = new Map(); this.updaters = []; }
  mat(color, o = {}) {
    if (this.hq) return this.hqMat(color, o);
    const m = new THREE.MeshStandardMaterial({ color, roughness: o.rough ?? 0.82, metalness: o.metal ?? (color === COLORS.steel || color === COLORS.steelLight ? 0.35 : 0.04), transparent: !!o.opacity && o.opacity < 1, opacity: o.opacity ?? 1, side: o.side ?? THREE.FrontSide, depthWrite: o.opacity ? o.opacity >= 1 : true, emissive: o.emissive ?? 0x000000, emissiveIntensity: o.ei ?? 1, flatShading: !!o.flat });
    return m;
  }
  // 精致画质 material: PBR tuned for the room environment (metal reads as metal, paint as satin, earth/concrete as matte)
  hqMat(color, o = {}) {
    const steel = color === COLORS.steel || color === COLORS.steelLight;
    const P = { color, roughness: o.rough ?? (steel ? 0.4 : 0.66), metalness: o.metal ?? (steel ? 0.55 : 0.02), transparent: !!o.opacity && o.opacity < 1, opacity: o.opacity ?? 1, side: o.side ?? THREE.FrontSide, depthWrite: o.opacity ? o.opacity >= 1 : true, emissive: o.emissive ?? 0x000000, emissiveIntensity: o.ei ?? 1, flatShading: !!o.flatHQ, envMapIntensity: o.env ?? (steel ? 0.55 : 0.5) };
    if (o.map) P.map = o.map; if (o.roughMap) P.roughnessMap = o.roughMap; if (o.bump) { P.bumpMap = o.bump; P.bumpScale = o.bumpScale ?? 1; }
    if (o.vc) P.vertexColors = true;
    if (o.clearcoat) { P.clearcoat = o.clearcoat; P.clearcoatRoughness = o.ccRough ?? 0.25; return new THREE.MeshPhysicalMaterial(P); }
    return new THREE.MeshStandardMaterial(P);
  }
  _geoAnchor(geo, size, anchor) {
    if (!anchor) return geo;
    const [w, h, d] = size; const t = [0, 0, 0];
    if (anchor.includes('bottom')) t[1] = h / 2; if (anchor.includes('top')) t[1] = -h / 2;
    if (anchor.includes('left')) t[0] = w / 2; if (anchor.includes('right')) t[0] = -w / 2;
    if (anchor.includes('back')) t[2] = d / 2; if (anchor.includes('front')) t[2] = -d / 2;
    geo.translate(...t); return geo;
  }
  mesh(geo, color, pos = [0, 0, 0], o = {}) {
    const m = new THREE.Mesh(geo, o.material || this.mat(color, o));
    m.position.set(...pos); if (o.rot) m.rotation.set(...o.rot);
    m.castShadow = o.shadow !== false && !(o.opacity < 1); m.receiveShadow = true;
    (o.parent || this.root).add(m); return m;
  }
  box(size, pos, color, o = {}) {
    let g; const mn = Math.min(...size);
    if (this.hq && !o.sharp && mn > 0.03) g = new RoundedBoxGeometry(size[0], size[1], size[2], o.rseg ?? 2, Math.min(o.round ?? 0.08, mn * 0.3));
    else g = new THREE.BoxGeometry(...size);
    return this.mesh(this._geoAnchor(g, size, o.anchor), color, pos, o);
  }
  cyl(r, h, pos, color, o = {}) {
    const g = new THREE.CylinderGeometry(o.r2 ?? r, r, h, o.seg ?? (this.hq ? 40 : 24), 1, !!o.open);
    if (o.anchor === 'bottom') g.translate(0, h / 2, 0); if (o.anchor === 'top') g.translate(0, -h / 2, 0);
    if (o.axis === 'x') g.rotateZ(-Math.PI / 2); if (o.axis === 'z') g.rotateX(Math.PI / 2);
    return this.mesh(g, color, pos, o);
  }
  // annulus tube along z (for tunnels/pipes): inner radius ri, outer ro, length len, centered at pos, optional arc
  ring(ri, ro, len, pos, color, o = {}) {
    const s = new THREE.Shape(); const a0 = o.a0 ?? 0, a1 = o.a1 ?? Math.PI * 2;
    s.absarc(0, 0, ro, a0, a1, false);
    if (a1 - a0 >= Math.PI * 2 - 1e-3) { const h = new THREE.Path(); h.absarc(0, 0, ri, 0, Math.PI * 2, true); s.holes.push(h); }
    else { s.absarc(0, 0, ri, a1, a0, true); }
    const g = new THREE.ExtrudeGeometry(s, o.bevel && this.hq ? { depth: len - 2 * o.bevel, bevelEnabled: true, bevelThickness: o.bevel, bevelSize: o.bevel, bevelOffset: -o.bevel, bevelSegments: 2, curveSegments: o.seg ?? 48 } : { depth: len, bevelEnabled: false, curveSegments: o.seg ?? (this.hq ? 56 : 36) });
    g.translate(0, 0, -len / 2 + (o.bevel && this.hq ? o.bevel : 0)); if (o.axis === 'x') g.rotateY(Math.PI / 2);
    return this.mesh(g, color, pos, o);
  }
  rod(a, b, r, color, o = {}) {
    const va = new THREE.Vector3(...a), vb = new THREE.Vector3(...b); const len = va.distanceTo(vb);
    const g = new THREE.CylinderGeometry(r, r, len, o.seg ?? (this.hq ? 16 : 10)); const m = this.mesh(g, color, va.clone().add(vb).multiplyScalar(0.5).toArray(), o);
    m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), vb.sub(va).normalize()); return m;
  }
  tube(points, r, color, o = {}) {
    const c = new THREE.CatmullRomCurve3(points.map(p => new THREE.Vector3(...p)), false, 'catmullrom', o.tension ?? 0.3);
    return this.mesh(new THREE.TubeGeometry(c, o.segs ?? 64, r, o.rseg ?? 10, false), color, [0, 0, 0], o);
  }
  arrow(from, dir, len, color = 0xe9762b, o = {}) {
    const g = new THREE.Group(); const d = new THREE.Vector3(...dir).normalize();
    const shaft = new THREE.Mesh(new THREE.CylinderGeometry(o.r ?? 0.06, o.r ?? 0.06, len * 0.72, 10), this.mat(color, { emissive: color, ei: 0.35 }));
    shaft.position.y = len * 0.36; const head = new THREE.Mesh(new THREE.ConeGeometry((o.r ?? 0.06) * 2.6, len * 0.28, 14), shaft.material); head.position.y = len * 0.86;
    g.add(shaft, head); g.position.set(...from); g.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d); (o.parent || this.root).add(g); return g;
  }
  group(pos = [0, 0, 0], parent) { const g = new THREE.Group(); g.position.set(...pos); (parent || this.root).add(g); return g; }
  // register a part with step-driven visibility/animation
  part(obj, o = {}) {
    const p = { obj, name: o.name || '', on: o.on ?? 0, off: o.off ?? Infinity, enter: o.enter || (o.on > 0 ? 'fade' : 'none'), exit: o.exit || 'fade', win: o.win || [0.05, 0.75], outWin: o.outWin || [0.1, 0.7], hl: o.hl, front: !!o.front, soil: !!o.soil, hlSoft: o.hlSoft, axis: o.axis || 'y', from: o.from, ghost: o.ghost,
      base: { pos: obj.position.clone(), scale: obj.scale.clone() }, mats: [] };
    obj.traverse(n => { if (n.isMesh) { n.material = n.material.clone(); p.mats.push({ m: n.material, opacity: n.material.opacity, transparent: n.material.transparent, depthWrite: n.material.depthWrite, emissive: n.material.emissive.clone(), ei: n.material.emissiveIntensity }); } });
    this.parts.push(p); return obj;
  }
  // extruded x-profile: top/bottom functions of x, between z0..z1
  profile(x0, x1, top, bot, z0, z1, color, o = {}) {
    const n = o.n ?? 8, pts = [];
    for (let i = 0; i <= n; i++) { const x = x0 + (x1 - x0) * i / n; pts.push(new THREE.Vector2(x, top(x))); }
    for (let i = n; i >= 0; i--) { const x = x0 + (x1 - x0) * i / n; pts.push(new THREE.Vector2(x, bot(x))); }
    const g = new THREE.ExtrudeGeometry(new THREE.Shape(pts), { depth: z1 - z0, bevelEnabled: false }); g.translate(0, 0, z0);
    return this.mesh(g, color, [0, 0, 0], { side: THREE.DoubleSide, ...o });
  }
  // build an object twice: back half (z<=0) and front half (z>=0, hidden in section view)
  split(make, opts = {}, z0 = -1, z1 = 1) { const a = make(z0, 0), b = make(0, z1); this.part(a, opts); this.part(b, { ...opts, front: true }); return [a, b]; }
  zbox(sx, sy, z0, z1, x, y, color, o = {}) { return this.box([sx, sy, z1 - z0], [x, y, (z0 + z1) / 2], color, o); }
  label(text, at, o = {}) { this.labels.push({ text, at: new THREE.Vector3(...at), steps: o.steps, win: o.win || [0, 1], kind: o.kind || '', follow: o.follow }); }
  onUpdate(fn) { this.updaters.push(fn); }

  // ------- reusable props
  excavator(pos, rotY = 0, scale = 1) {
    if (this.hq && Kit.hqProps) return Kit.hqProps.excavator(this, pos, rotY, scale);
    const g = this.group(pos); g.rotation.y = rotY; g.scale.setScalar(scale);
    this.box([1.9, 0.38, 1.5], [0, 0, 0], COLORS.machineDark, { parent: g, anchor: 'bottom' });
    const upper = new THREE.Group(); upper.position.y = 0.4; g.add(upper);
    this.box([1.5, 0.6, 1.2], [-0.15, 0, 0], COLORS.machine, { parent: upper, anchor: 'bottom' });
    this.box([0.6, 0.55, 0.6], [0.35, 0.6, 0.28], COLORS.machine, { parent: upper, anchor: 'bottom' });
    this.box([0.5, 0.42, 0.04], [0.37, 0.66, 0.59], COLORS.glass, { parent: upper, anchor: 'bottom', metal: 0.3, rough: 0.2 });
    const boom = new THREE.Group(); boom.position.set(0.6, 0.5, -0.2); upper.add(boom);
    this.box([1.5, 0.18, 0.18], [0, 0, 0], COLORS.machine, { parent: boom, anchor: 'left' }); boom.rotation.z = 0.45;
    const stick = new THREE.Group(); stick.position.set(1.5, 0, 0); boom.add(stick);
    this.box([1.1, 0.14, 0.14], [0, 0, 0], COLORS.machine, { parent: stick, anchor: 'left' }); stick.rotation.z = -1.5;
    const bucket = this.box([0.35, 0.3, 0.42], [1.15, 0, 0], COLORS.machineDark, { parent: stick }); 
    g.userData = { upper, boom, stick, bucket };
    return g;
  }
  animateExcavator(ex, t, amp = 1) {
    const { upper, boom, stick } = ex.userData; const s = Math.sin(t * 1.6);
    boom.rotation.z = 0.35 + 0.18 * s * amp; stick.rotation.z = -1.35 - 0.35 * Math.sin(t * 1.6 + 0.8) * amp; upper.rotation.y = 0.25 * Math.sin(t * 0.55) * amp;
  }
  truck(pos, rotY = 0, color = COLORS.machine) {
    if (this.hq && Kit.hqProps) return Kit.hqProps.truck(this, pos, rotY, color);
    const g = this.group(pos); g.rotation.y = rotY;
    this.box([2.6, 0.12, 1.0], [0, 0.32, 0], COLORS.machineDark, { parent: g, anchor: 'bottom' });
    this.box([0.8, 0.75, 1.0], [1.0, 0.44, 0], color, { parent: g, anchor: 'bottom' });
    this.box([1.7, 0.6, 1.0], [-0.35, 0.44, 0], COLORS.steelLight, { parent: g, anchor: 'bottom' });
    for (const x of [-1, 0.2, 1.0]) for (const z of [-0.45, 0.45]) this.cyl(0.22, 0.18, [x, 0.22, z], 0x222222, { parent: g, axis: 'z', seg: 14 });
    return g;
  }
  crane(pos, rotY = 0, h = 6, jib = 6) {
    if (this.hq && Kit.hqProps) return Kit.hqProps.towerCrane(this, pos, rotY, h, jib);
    const g = this.group(pos); g.rotation.y = rotY;
    this.box([1.6, 0.5, 1.4], [0, 0, 0], COLORS.machineDark, { parent: g, anchor: 'bottom' });
    this.box([0.35, h, 0.35], [0, 0.5, 0], COLORS.yellow, { parent: g, anchor: 'bottom' });
    const top = new THREE.Group(); top.position.y = h + 0.5; g.add(top);
    this.box([jib, 0.25, 0.3], [-1, 0, 0], COLORS.yellow, { parent: top, anchor: 'left' });
    this.box([1.2, 0.5, 0.6], [-1.6, 0, 0], COLORS.concreteDark, { parent: top });
    g.userData.top = top; return g;
  }
  tree(pos, s = 1) { const g = this.group(pos); g.scale.setScalar(s); this.cyl(0.08, 0.6, [0, 0, 0], COLORS.wood, { parent: g, anchor: 'bottom', seg: 6 }); const c = new THREE.Mesh(new THREE.IcosahedronGeometry(0.45, this.hq ? 1 : 0), this.mat(0x6f9e5c, { flat: true, flatHQ: true, rough: 0.85 })); c.position.y = 0.9; c.castShadow = true; g.add(c); return g; }
  building(pos, size, color = 0xd9d4c7) {
    const b = this.box(size, pos, color, { anchor: 'bottom' });
    const win = this.mat(0x8fb3c4, { metal: 0.2, rough: 0.3 });
    for (let y = 0.6; y < size[1] - 0.3; y += 0.9) { const w = new THREE.Mesh(new THREE.BoxGeometry(size[0] * 0.86, 0.32, 0.02), win); w.position.set(pos[0], pos[1] + y, pos[2] + size[2] / 2 + 0.011); this.root.add(w); }
    return b;
  }
  // a block of soil made of horizontal strata; returns group. y from yb (bottom) to yt (top)
  strata(x0, x1, yb, yt, z0, z1, o = {}) {
    const g = this.group([0, 0, 0]); const cols = o.colors || [COLORS.soil1, COLORS.soil2, COLORS.soil3, COLORS.soil4];
    const n = o.layers ?? cols.length; const hs = o.heights;
    let y = yt;
    for (let i = 0; i < n; i++) {
      const h = hs ? hs[i] : (yt - yb) / n; const yy = Math.max(yb, y - h);
      if (y - yy > 1e-3) this.box([x1 - x0, y - yy, z1 - z0], [(x0 + x1) / 2, (y + yy) / 2, (z0 + z1) / 2], cols[i % cols.length], { parent: g, flat: true, rough: 0.95 });
      y = yy;
    }
    return g;
  }
}

// ---------------------------------------------------------------- Stage: renderer + UI overlay
export class Stage {
  constructor(host) {
    this.host = host; this.mobile = isMobile(); window.__v15stage = this; this.tier = detectTier(this.mobile); this.tierForced = !!detectTier.forced;
    try { this.hqPref = localStorage.getItem('v15-quality') !== 'basic'; } catch { this.hqPref = true; }
    const wrap = document.createElement('div'); wrap.className = 'v15-stage'; host.appendChild(wrap); this.wrap = wrap;
    const r = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'default', preserveDrawingBuffer: false });
    r.setPixelRatio(Math.min(devicePixelRatio || 1, this.mobile ? 1.6 : 2));
    r.shadowMap.enabled = true; r.shadowMap.type = THREE.PCFShadowMap;
    r.outputColorSpace = THREE.SRGBColorSpace; r.toneMapping = THREE.ACESFilmicToneMapping; r.toneMappingExposure = 1.05;
    wrap.appendChild(r.domElement); this.renderer = r;
    r.domElement.setAttribute('aria-label', '可旋转的三维施工模型：拖动旋转，双指或滚轮缩放');
    const scene = new THREE.Scene(); this.scene = scene;
    scene.background = new THREE.Color(0xdfe9ec); scene.fog = new THREE.Fog(0xdfe9ec, 60, 140);
    const hemi = new THREE.HemisphereLight(0xf4f8ff, 0x8a7a5e, 1.25); scene.add(hemi);
    const sun = new THREE.DirectionalLight(0xfff3df, 2.2); sun.position.set(-14, 26, 18); sun.castShadow = true;
    const sm = this.mobile ? 1024 : 2048; sun.shadow.mapSize.set(sm, sm);
    Object.assign(sun.shadow.camera, { left: -28, right: 28, top: 28, bottom: -28, near: 1, far: 90 }); sun.shadow.bias = -0.0006; sun.shadow.normalBias = 0.06;
    scene.add(sun); this.sun = sun; this.hemi = hemi;
    const fill = new THREE.DirectionalLight(0xcfe0ff, 0.6); fill.position.set(16, 8, -12); scene.add(fill); this.fill = fill;
    this.basicBg = scene.background; this.hqOn = false;
    const cam = new THREE.PerspectiveCamera(this.mobile ? 42 : 36, 1, 0.1, 400); this.camera = cam;
    const ctl = new OrbitControls(cam, r.domElement); ctl.enableDamping = true; ctl.dampingFactor = 0.09; ctl.screenSpacePanning = true;
    ctl.minDistance = 4; ctl.maxDistance = 90; ctl.maxPolarAngle = Math.PI * 0.62; ctl.rotateSpeed = this.mobile ? 0.7 : 0.9; ctl.zoomSpeed = 0.9;
    ctl.touches = { ONE: THREE.TOUCH.ROTATE, TWO: THREE.TOUCH.DOLLY_PAN };
    ctl.addEventListener('start', () => { this.tween = null; this.userMoved = true; });
    this.controls = ctl;
    // overlay UI
    const ui = document.createElement('div'); ui.className = 'v15-ui'; wrap.appendChild(ui); this.ui = ui;
    ui.innerHTML = `<div class="v15-cap"><div class="v15-cap-head"><span class="v15-stepno"></span><b class="v15-title"></b></div><div class="v15-phase"></div></div>
      <div class="v15-labels"></div>
      <div class="v15-tools"><button data-act="section" aria-pressed="true" title="剖切：去掉前方土体看内部">剖切</button><button data-act="xray" aria-pressed="false" title="透明：土体半透明">透明</button><button data-act="labels" aria-pressed="true" title="构件标签">标签</button><button data-act="cam" title="回到本步视角">复位</button><button data-act="quality" hidden title="画质切换：精致（柔和光影与材质）/ 简洁（旧版画面，更省电）">画质：精致</button></div>
      <div class="v15-foot"><div class="v15-hl"></div><div class="v15-key" hidden></div><button class="v15-keybtn" aria-expanded="false">控制要点</button></div>`;
    this.el = sel => ui.querySelector(sel);
    this.section = true; this.xray = false; this.showLabels = true;
    ui.querySelector('.v15-tools').addEventListener('click', e => {
      const b = e.target.closest('button'); if (!b) return; const a = b.dataset.act;
      if (a === 'section') { this.section = !this.section; b.setAttribute('aria-pressed', this.section); this.applyView(); }
      if (a === 'xray') { this.xray = !this.xray; b.setAttribute('aria-pressed', this.xray); this.applyView(); }
      if (a === 'labels') { this.showLabels = !this.showLabels; b.setAttribute('aria-pressed', this.showLabels); }
      if (a === 'cam') this.flyToStep(true);
      if (a === 'quality') this.toggleQuality();
      this.dirty = true;
    });
    const kb = ui.querySelector('.v15-keybtn');
    kb.addEventListener('click', () => { const k = this.el('.v15-key'); k.hidden = !k.hidden; kb.setAttribute('aria-expanded', String(!k.hidden)); kb.textContent = k.hidden ? '控制要点' : '收起要点'; });
    this.ground = null; this.active = false; this.step = 0; this.p = 0; this.clock = new THREE.Clock(); this.lastFrame = 0;
    new ResizeObserver(() => this.resize()).observe(host);
    r.domElement.addEventListener('webglcontextlost', e => { e.preventDefault(); host.dispatchEvent(new CustomEvent('spatial-error')); });
    document.addEventListener('visibilitychange', () => { if (!document.hidden && this.active) this.loop(); });
  }
  resize() {
    const w = this.host.clientWidth, h = this.host.clientHeight; if (!w || !h) return;
    this.renderer.setSize(w, h, false); this.camera.aspect = w / h; this.camera.updateProjectionMatrix(); this.dirty = true;
    if (this.composer) { this.composer.setPixelRatio(this.renderer.getPixelRatio()); this.composer.setSize(w, h); }
  }
  // ---------------- quality (精致 / 简洁). Only lessons whose def has an `hq` model use 精致.
  envTex() {
    if (!this._env) { const pm = new THREE.PMREMGenerator(this.renderer); const room = new RoomEnvironment(); this._env = pm.fromScene(room, 0.04).texture; room.traverse(n => { n.geometry?.dispose(); n.material?.dispose?.(); }); pm.dispose(); }
    return this._env;
  }
  bgTex() {
    if (!this._bg) {
      const c = document.createElement('canvas'); c.width = 4; c.height = 256; const g = c.getContext('2d'); const gr = g.createLinearGradient(0, 0, 0, 256);
      gr.addColorStop(0, '#eef3f5'); gr.addColorStop(0.55, '#dbe5e9'); gr.addColorStop(1, '#c4d2d8'); g.fillStyle = gr; g.fillRect(0, 0, 4, 256);
      this._bg = new THREE.CanvasTexture(c); this._bg.colorSpace = THREE.SRGBColorSpace;
    }
    return this._bg;
  }
  applyQuality(on) {
    const r = this.renderer, sun = this.sun, T = this.tier; this.hqOn = on;
    const pr = on ? (T === 'high' ? 2 : T === 'mid' ? 1.5 : 1.25) : (this.mobile ? 1.6 : 2);
    // high tier: post-processing has no MSAA, so render at ≥1.5× and let the browser downsample
    r.setPixelRatio(on && T === 'high' ? Math.min(2, Math.max(1.5, devicePixelRatio || 1)) : Math.min(devicePixelRatio || 1, pr));
    const type = on && T !== 'low' ? THREE.PCFSoftShadowMap : THREE.PCFShadowMap;
    const sm = on ? (T === 'high' ? 4096 : 2048) : (this.mobile ? 1024 : 2048);
    if (r.shadowMap.type !== type || sun.shadow.mapSize.x !== sm) { r.shadowMap.type = type; sun.shadow.mapSize.set(sm, sm); sun.shadow.map?.dispose(); sun.shadow.map = null; r.shadowMap.needsUpdate = true; }
    this.scene.environment = on ? this.envTex() : null;
    this.scene.background = on ? this.bgTex() : this.basicBg;
    this.scene.fog.color.setHex(on ? 0xdde6ea : 0xdfe9ec);
    this.hemi.intensity = on ? 0.22 : 1.25; sun.intensity = on ? 3.6 : 2.2; this.fill.intensity = on ? 0.3 : 0.6;
    sun.color.setHex(on ? 0xfff0dc : 0xfff3df); sun.position.set(...(on ? [-16, 26, 15] : [-14, 26, 18])); sun.shadow.bias = on ? -0.0004 : -0.0006; sun.shadow.normalBias = on ? 0.035 : 0.06;
    r.toneMappingExposure = on ? 0.8 : 1.05;
    if (on && T === 'high') this.buildComposer(); else this.dropComposer();
    const b = this.ui.querySelector('[data-act=quality]'); b.textContent = '画质：' + (on ? '精致' : '简洁'); b.setAttribute('aria-pressed', on);
    this.frameTimes = []; this.resize();
  }
  buildComposer() {
    if (this.composer) return;
    const w = Math.max(1, this.host.clientWidth), h = Math.max(1, this.host.clientHeight);
    const rt = new THREE.WebGLRenderTarget(w, h, { type: THREE.HalfFloatType, samples: 0 });
    const c = new EffectComposer(this.renderer, rt); c.addPass(new RenderPass(this.scene, this.camera));
    const ao = new SSAOPass(this.scene, this.camera, w, h, 16); ao.kernelRadius = 0.5; ao.minDistance = 0.00002; ao.maxDistance = 0.0015;
    c.addPass(ao); c.addPass(new OutputPass());
    this.composer = c; this.aoPass = ao;
  }
  dropComposer() { if (!this.composer) return; this.composer.dispose?.(); this.aoPass?.dispose?.(); this.composer = null; this.aoPass = null; }
  // frame-time governor: a device that cannot keep ~24 fps in 精致 steps down a tier (post-processing first)
  govern(dt) {
    if (!this.hqOn || this.tierForced || this.tier === 'low' || !dt || dt > 500) return;
    const ft = this.frameTimes || (this.frameTimes = []); ft.push(dt); if (ft.length < 90) return;
    const avg = ft.reduce((a, b) => a + b, 0) / ft.length; this.frameTimes = [];
    if (avg > 42) { this.tier = this.tier === 'high' ? 'mid' : 'low'; this.applyQuality(true); }
  }
  toggleQuality() {
    const m = this.model; if (!m?.origDef?.hq) return;
    this.hqPref = !this.hqPref; try { localStorage.setItem('v15-quality', this.hqPref ? 'hq' : 'basic'); } catch {}
    const s = this.step, p = this.p, cp = this.camera.position.clone(), ct = this.controls.target.clone();
    this.load(m.origDef, m.lesson); this.setStep(Math.max(0, s)); this.tween = null; this.camera.position.copy(cp); this.controls.target.copy(ct); this.controls.update(); this.seek(p);
  }
  watchVisibility() {
    if (this._vis) return; this._vis = true;
    document.addEventListener('visibilitychange', () => { if (!document.hidden) this.loop(); });
    if ('IntersectionObserver' in window) new IntersectionObserver(es => { for (const e of es) { this.offscreen = !e.isIntersecting; if (e.isIntersecting) this.loop(); } }).observe(this.wrap);
  }
  setActive(on) { this.watchVisibility(); this.active = on; this.wrap.style.display = on ? '' : 'none'; if (on) { this.resize(); this.loop(); } }
  loop() {
    if (this.raf) return;
    const tick = now => {
      this.raf = 0; if (!this.active || document.hidden || this.offscreen) return;
      const minDt = this.mobile ? 30 : 15;
      if (now - this.lastFrame >= minDt) { this.lastFrame = now; this.frame(now / 1000); }
      if (window.__v15freeze) return;
      this.raf = requestAnimationFrame(tick);
    };
    this.raf = requestAnimationFrame(tick);
  }
  load(def, lesson) {
    if (this.model) { this.scene.remove(this.model.kit.root); this.model.kit.root.traverse(n => { n.geometry?.dispose(); n.material?.dispose?.(); }); }
    const origDef = def; const hq = !!def.hq && this.hqPref; if (hq) def = { ...def, ...def.hq };
    const kit = new Kit(this); kit.hq = hq; def.build(kit, lesson); this.scene.add(kit.root);
    if (hq) hqFinish(kit);
    this.applyQuality(hq); const qb = this.ui.querySelector('[data-act=quality]'); qb.hidden = !origDef.hq;
    kit.root.traverse(n => { if (n.isMesh && n.geometry && !n.geometry.boundingSphere) n.geometry.computeBoundingSphere(); });
    this.model = { def, kit, lesson, origDef }; this.step = -1; this.userMoved = false;
    const v = def.view || {}; this.section = v.section ?? true; this.xray = v.xray ?? false;
    this.ui.querySelector('[data-act=section]').setAttribute('aria-pressed', this.section); this.ui.querySelector('[data-act=xray]').setAttribute('aria-pressed', this.xray);
    this.el('.v15-labels').replaceChildren(); kit.labels.forEach(l => { const s = document.createElement('span'); s.className = 'v15-label ' + l.kind; s.textContent = l.text; this.el('.v15-labels').appendChild(s); l.el = s; });
    this.applyView();
  }
  setStep(s) {
    const m = this.model; if (!m) return; const st = m.lesson.steps[s] || {};
    this.step = s; this.p = 0;
    this.el('.v15-stepno').textContent = String(s + 1).padStart(2, '0') + '/' + String(m.lesson.steps.length).padStart(2, '0');
    this.el('.v15-title').textContent = st.title || '';
    this.el('.v15-key').textContent = (st.exam?.keypoint ? '要点：' + st.exam.keypoint : '') + (st.check ? '　检查：' + st.check : '');
    const names = [...new Set(m.kit.parts.filter(p => this.isHL(p, s) && p.name).map(p => p.name))];
    this.el('.v15-hl').innerHTML = names.length ? '<i></i>本步构件：' + names.join('、') : '';
    this.userMoved = false; this.flyToStep(false); this.applyState();
  }
  isHL(p, s) { return p.hl ? p.hl.includes(s) : !!p.name && p.on === s && p.on > 0; }
  stepCam(s) {
    const c = (this.model.def.cams || [])[s] || this.model.def.cam || { pos: [14, 10, 18], target: [0, 0, 0] };
    const target = new THREE.Vector3(...c.target); const pos = new THREE.Vector3(...c.pos);
    const asp = this.camera.aspect || 1.6; const k = Math.pow(Math.max(1, 1.5 / asp), this.model.def.fitExp ?? 0.95);
    return { target, pos: target.clone().add(pos.sub(target).multiplyScalar(k)) };
  }
  flyToStep(force) {
    if (!this.model) return; const { target, pos } = this.stepCam(Math.max(0, this.step));
    if (!this.everPlaced) { this.camera.position.copy(pos); this.controls.target.copy(target); this.everPlaced = true; this.controls.update(); return; }
    this.tween = { t0: performance.now(), dur: 1100, fromP: this.camera.position.clone(), fromT: this.controls.target.clone(), toP: pos, toT: target };
  }
  applyView() {
    if (!this.model) return;
    for (const p of this.model.kit.parts) {
      if (p.front) p.viewHidden = this.section;
      if (p.soil) for (const mm of p.mats) { const x = this.xray; mm.m.transparent = x || mm.transparent; mm.m.opacity = x ? 0.16 : mm.opacity; mm.m.depthWrite = x ? false : mm.depthWrite; mm.m.needsUpdate = true; }
    }
    this.applyState();
  }
  seek(p) { this.p = p; this.applyState(); }
  applyState() {
    const m = this.model; if (!m || this.step < 0) return; const s = this.step, P = this.p;
    for (const part of m.kit.parts) {
      let vis = 1, k = 1, mode = null;
      if (s < part.on) vis = 0;
      else if (s === part.on && part.on > 0) { k = smooth(P, part.win[0], part.win[1]); mode = part.enter; if (mode === 'none') k = P >= part.win[0] ? 1 : 0; }
      if (s > part.off) vis = 0;
      else if (s === part.off) { let kk = 1 - smooth(P, part.outWin[0], part.outWin[1]); if (part.exit === 'none') kk = P < part.outWin[0] ? 1 : 0; if (kk < 1 || !mode) { mode = part.exit; k = Math.min(k, kk); } }
      const o = part.obj, b = part.base;
      o.position.copy(b.pos); o.scale.copy(b.scale);
      let fade = 1;
      if (vis && mode && k < 1) {
        if (mode === 'grow') { o.scale[part.axis] = Math.max(1e-3, b.scale[part.axis] * k); }
        else if (mode === 'drop') { o.position.y = b.pos.y + (1 - k) * (part.from ?? 4); fade = Math.min(1, k * 3); }
        else if (mode === 'rise') { o.position.y = b.pos.y - (1 - k) * (part.from ?? 2); }
        else if (mode === 'slide') { const f = part.from || [0, 0, 3]; o.position.set(b.pos.x + f[0] * (1 - k), b.pos.y + f[1] * (1 - k), b.pos.z + f[2] * (1 - k)); fade = Math.min(1, k * 3); }
        else if (mode === 'lift') { o.position.y = b.pos.y + (1 - k) * 3; fade = k; }
        else if (mode === 'fade') fade = k;
        else if (mode === 'pop') { o.scale.copy(b.scale).multiplyScalar(Math.max(1e-3, k)); }
        if (k <= 1e-3) vis = 0;
      }
      if (part.viewHidden) vis = 0;
      o.visible = !!vis;
      const hl = this.isHL(part, s);
      for (const mm of part.mats) {
        const baseOp = part.soil && this.xray ? 0.16 : mm.opacity;
        const op = baseOp * fade; const tr = op < 0.999 || (part.soil && this.xray) || mm.transparent;
        if (mm.m.transparent !== tr) { mm.m.transparent = tr; mm.m.needsUpdate = true; }
        mm.m.opacity = op; mm.m.depthWrite = op >= 0.999 && !(part.soil && this.xray) ? mm.depthWrite : false;
        part.hlOn = hl;
      }
    }
    for (const fn of m.kit.updaters) fn(s, P, this.t || 0, this);
    // phase text from lesson def (original wording)
    const ph = (m.def.phases || [])[s]; let txt = '';
    if (Array.isArray(ph)) { for (const [at, t] of ph) if (P >= at) txt = t; } else if (ph) txt = ph;
    this.phaseText = txt; const pe = this.el('.v15-phase'); if (pe.textContent !== txt) pe.textContent = txt;
    this.dirty = true;
  }
  getPhase() { return this.phaseText || ''; }
  frame(t) {
    this.t = t; const m = this.model; if (!m) return;
    if (this.tween) { const tw = this.tween; const k = smooth((performance.now() - tw.t0) / tw.dur); this.camera.position.lerpVectors(tw.fromP, tw.toP, k); this.controls.target.lerpVectors(tw.fromT, tw.toT, k); if (k >= 1) this.tween = null; }
    this.controls.update();
    for (const fn of m.kit.updaters) fn(this.step, this.p, t, this);
    // highlight pulse
    const pulse = 0.35 + 0.25 * Math.sin(t * 4.2);
    for (const part of m.kit.parts) for (const mm of part.mats) {
      if (part.hlOn) { mm.m.emissive.setHex(0xff6a00); mm.m.emissiveIntensity = pulse * (part.hlSoft ?? 1); }
      else { mm.m.emissive.copy(mm.emissive); mm.m.emissiveIntensity = mm.ei; }
    }
    if (this.composer) this.composer.render(); else this.renderer.render(this.scene, this.camera);
    if (this._lt) this.govern((t - this._lt) * 1000); this._lt = t;
    this.placeLabels();
  }
  placeLabels() {
    const m = this.model; const w = this.host.clientWidth, h = this.host.clientHeight; const boxes = [];
    const v = new THREE.Vector3();
    for (const l of m.kit.labels) {
      let show = this.showLabels && (!l.steps || l.steps.includes(this.step)) && this.p >= l.win[0] && this.p <= l.win[1];
      if (show) { v.copy(l.follow ? l.follow.getWorldPosition(new THREE.Vector3()).add(l.at) : l.at).project(this.camera); if (v.z > 1) show = false; }
      if (!show) { if (!l.el.hidden) l.el.hidden = true; continue; }
      if (l.el.hidden) l.el.hidden = false;
      const ew = l.el.offsetWidth, eh = l.el.offsetHeight;
      let x = (v.x * 0.5 + 0.5) * w, y = (-v.y * 0.5 + 0.5) * h;
      x = Math.max(ew / 2 + 4, Math.min(w - ew / 2 - 4, x)); y = Math.max(eh / 2 + 52, Math.min(h - eh / 2 - 40, y));
      for (let i = 0; i < 8; i++) { const hit = boxes.some(b => Math.abs(b.x - x) < (b.w + ew) / 2 + 3 && Math.abs(b.y - y) < (b.h + eh) / 2 + 2); if (!hit) break; y += (i % 2 ? -1 : 1) * (i + 1) * (eh + 3); }
      boxes.push({ x, y, w: ew, h: eh });
      l.el.style.transform = `translate(${(x - ew / 2) | 0}px,${(y - eh / 2) | 0}px)`;
    }
  }
}

// half soil block with vertical cylindrical holes (list of {x, r}) cut at z=0; side -1 back / +1 front
export function vBoredStrata(k, x0, x1, side, zf, yb, yt, holes, cols, heights, parent) {
  let y = yt; const out = [];
  for (let i = 0; i < cols.length; i++) {
    const h = heights ? heights[i] : (yt - yb) / cols.length; const y0 = Math.max(yb, y - h);
    const pts = [new THREE.Vector2(x1, Math.abs(zf)), new THREE.Vector2(x0, Math.abs(zf))];
    const N = 160;
    for (let j = 0; j <= N; j++) { const x = x0 + (x1 - x0) * j / N; let u = 0; for (const hl of holes) if (Math.abs(x - hl.x) < hl.r && y0 < (hl.top ?? 99) && y > (hl.bot ?? -99)) u = Math.max(u, Math.sqrt(hl.r * hl.r - (x - hl.x) ** 2)); pts.push(new THREE.Vector2(x, u)); }
    const g = new THREE.ExtrudeGeometry(new THREE.Shape(pts), { depth: y - y0, bevelEnabled: false });
    g.rotateX(-Math.PI / 2); // (x,u,e) -> (x, e, -u)
    if (side > 0) g.scale(1, 1, -1);
    g.translate(0, y0, 0);
    out.push(k.mesh(g, cols[i], [0, 0, 0], { flat: true, rough: 0.95, parent, side: THREE.DoubleSide })); y = y0;
  }
  return out;
}
// half cylinder (vertical axis) for cut views: side -1 => z<=0
export function halfCyl(k, r, h, pos, color, side, o = {}) {
  const g = new THREE.CylinderGeometry(r, r, h, o.seg ?? 28, 1, false, side < 0 ? Math.PI / 2 : -Math.PI / 2, Math.PI);
  if (o.anchor === 'bottom') g.translate(0, h / 2, 0); if (o.anchor === 'top') g.translate(0, -h / 2, 0);
  const grp = k.group(pos, o.parent);
  k.mesh(g, color, [0, 0, 0], { side: THREE.DoubleSide, ...o, parent: grp });
  const cap = new THREE.PlaneGeometry(2 * r, h); if (o.anchor === 'bottom') cap.translate(0, h / 2, 0); if (o.anchor === 'top') cap.translate(0, -h / 2, 0);
  k.mesh(cap, color, [0, 0, side * 0.001], { side: THREE.DoubleSide, ...o, parent: grp });
  return grp;
}
// diorama base: a display table under the cut-away soil block
export function table(k, x0, x1, z0, z1, y) {
  k.box([x1 - x0 + 6, 0.4, z1 - z0 + 6], [(x0 + x1) / 2, y - 0.2, (z0 + z1) / 2], k.hq ? 0xd9dfda : 0xe8ece6, { rough: 0.9, round: 0.18 });
  k.box([x1 - x0 + 6.4, 0.25, z1 - z0 + 6.4], [(x0 + x1) / 2, y - 0.52, (z0 + z1) / 2], 0x9fb3a8, { rough: 0.9 });
}
// half soil block (one side of z=0) with an optional horizontal bore (axis along x) of radius r centred at (y=cy, z=0)
// side = -1 => z in [zf,0] (back); side = +1 => z in [0,zf] (front)
export function boredStrata(k, x0, x1, side, zf, yb, yt, bore, cols, heights, parent) {
  const out = []; let y = yt;
  for (let i = 0; i < cols.length; i++) {
    const h = heights ? heights[i] : (yt - yb) / cols.length; const y0 = Math.max(yb, y - h), y1 = y;
    const pts = [];
    const uf = Math.abs(zf);
    pts.push(new THREE.Vector2(uf, y0)); pts.push(new THREE.Vector2(uf, y1));
    const N = 28;
    for (let j = 0; j <= N; j++) { const v = y1 - (y1 - y0) * j / N; let u = 0; if (bore) { const dv = v - bore.cy; if (Math.abs(dv) < bore.r) u = Math.sqrt(bore.r * bore.r - dv * dv); } pts.push(new THREE.Vector2(u, v)); }
    const shape = new THREE.Shape(pts);
    const g = new THREE.ExtrudeGeometry(shape, { depth: x1 - x0, bevelEnabled: false, curveSegments: 4 });
    // shape (u,v) extruded along +z  -> world: x = x0 + ext, y = v, z = side*u
    g.rotateY(Math.PI / 2); // (u,v,e) -> (e, v, -u)
    if (side > 0) g.scale(1, 1, -1);
    g.translate(x0, 0, 0);
    const m = k.mesh(g, cols[i], [0, 0, 0], { flat: true, rough: 0.95, parent, side: THREE.DoubleSide });
    out.push(m); y = y0;
  }
  return out;
}
