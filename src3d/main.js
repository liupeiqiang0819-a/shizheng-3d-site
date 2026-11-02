import { Stage, Kit } from './engine.js';
import cutCover from './lessons/cut-cover.js';
import shield from './lessons/shield.js';
import HQAUG, * as HQ from './lessons/hq/index.js';
import bridgeCantilever from './lessons/bridge-cantilever.js';
import topDown from './lessons/top-down.js';
import natm from './lessons/natm.js';
import bridgePile from './lessons/bridge-pile.js';
import bridgePrecast from './lessons/bridge-precast.js';
import pipeTrenchless from './lessons/pipe-trenchless.js';
import pipeOpen from './lessons/pipe-open.js';
import waterTank from './lessons/water-tank.js';
import road from './lessons/road.js';
import utilityTunnel from './lessons/utility-tunnel.js';
import landfill from './lessons/landfill.js';
import sponge from './lessons/sponge.js';
import renewal from './lessons/renewal.js';
import heatGas from './lessons/heat-gas.js';
import waterProcess from './lessons/water-process.js';
import surveyMonitor from './lessons/survey-monitor.js';
import management from './lessons/management.js';
import extra from './lessons/index-extra.js';

const DEFS = Object.fromEntries(Object.entries({ 'cut-cover': cutCover, shield, 'bridge-cantilever': bridgeCantilever, 'top-down': topDown, natm, 'bridge-pile': bridgePile, 'bridge-precast': bridgePrecast, 'pipe-trenchless': pipeTrenchless, 'pipe-open': pipeOpen, 'water-tank': waterTank, road, 'utility-tunnel': utilityTunnel, landfill, sponge, renewal, 'heat-gas': heatGas, 'water-process': waterProcess, 'survey-monitor': surveyMonitor, management, ...extra }).filter(([, v]) => v));
// 精致画质 for every lesson: lessons without a dedicated hq model reuse their own build with HQ materials/lighting
Kit.hqProps = HQ.lib;
for (const [id, d] of Object.entries(DEFS)) if (!d.hq) { const a = HQAUG[id]; d.hq = a ? { ...a, build: (k, l) => { d.build(k, l); a.build(k, l); } } : { build: d.build }; }
try { delete window.__THREE__; } catch {}
let webgl = true;
try { const c = document.createElement('canvas'); webgl = !!(c.getContext('webgl2') || c.getContext('webgl')); } catch { webgl = false; }

window.V15Has = id => webgl && !!DEFS[id];
// Wrap the original spatial controller: V15 lessons use the new stage, others fall back to the original one.
window.V15Spatial = function (orig, host, lessons) {
  if (!webgl) return orig;
  let stage = null, useNew = false, active = false, curId = null;
  const ensure = () => (stage ||= new Stage(host));
  const origCanvas = () => [...host.children].filter(n => !n.classList.contains('v15-stage'));
  const showOrig = on => origCanvas().forEach(n => { n.style.display = on ? '' : 'none'; });
  const api = {
    load(id, step) {
      const def = DEFS[id];
      if (!def) { useNew = false; stage?.setActive(false); showOrig(true); host.classList.remove('v15-host'); if (active) orig.setActive(true); return orig.load(id, step); }
      useNew = true; orig.setActive(false); host.hidden = !active; showOrig(false); host.classList.add('v15-host');
      const s = ensure();
      try {
        if (curId !== id) { s.load(def, lessons.get(id)); curId = id; }
        s.setStep(Math.max(0, Math.min(lessons.get(id).steps.length - 1, step | 0))); s.setActive(active);
      } catch (e) { console.error(e); return false; }
      return true;
    },
    setActive(on) { active = on; if (useNew) { host.hidden = !on; stage?.setActive(on); } else orig.setActive(on); },
    seek(p) { return useNew ? stage.seek(p) : orig.seek(p); },
    labels(on) { if (useNew) { stage.showLabels = on; stage.ui.querySelector('[data-act=labels]').setAttribute('aria-pressed', on); } else orig.labels(on); },
    guides(on) { if (!useNew) orig.guides(on); },
    getPhase() { return useNew ? '' : orig.getPhase(); },
    hasGuides() { return useNew ? false : orig.hasGuides(); },
    reset() { useNew ? stage.flyToStep(true) : orig.reset(); },
    zoom(d) { if (!useNew) return orig.zoom(d); const c = stage.camera, t = stage.controls.target; c.position.sub(t).multiplyScalar(d > 0 ? 0.85 : 1.18).add(t); stage.tween = null; },
    front() { if (!useNew) return orig.front(); const { target, pos } = stage.stepCam(stage.step); const d = pos.distanceTo(target); stage.tween = { t0: performance.now(), dur: 800, fromP: stage.camera.position.clone(), fromT: stage.controls.target.clone(), toP: target.clone().add({ x: 0, y: d * 0.08, z: d }), toT: target }; },
    top() { if (!useNew) return orig.top(); const { target, pos } = stage.stepCam(stage.step); const d = pos.distanceTo(target); stage.tween = { t0: performance.now(), dur: 800, fromP: stage.camera.position.clone(), fromT: stage.controls.target.clone(), toP: target.clone().add({ x: 0, y: d, z: 0.01 }), toT: target }; },
    getInfo() { return useNew ? { supported: true, active, renderer: 'WebGL V15', objects: stage.model?.kit.parts.length || 0, drawCalls: stage.renderer.info.render.calls, triangles: stage.renderer.info.render.triangles } : orig.getInfo(); },
  };
  return api;
};
