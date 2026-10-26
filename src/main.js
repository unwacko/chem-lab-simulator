import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { buildLab, BENCH_Y } from './lab.js';
import * as P from './parts.js';
import { EXPERIMENTS, EXTRA_APPARATUS, EXTRA_CHEMICALS } from './experiments.js';
import { drawChart } from './chart.js';

const $ = (s) => document.querySelector(s);
const V3 = THREE.Vector3;
const ease = (t) => t * t * (3 - 2 * t);

// ---------------------------------------------------------------- audio
let actx = null;
function beep(f = 600, d = 0.08, type = 'sine', vol = 0.05, f2) {
  try {
    actx = actx || new (window.AudioContext || window.webkitAudioContext)();
    const o = actx.createOscillator(), g = actx.createGain(); o.type = type; o.frequency.value = f;
    if (f2) o.frequency.linearRampToValueAtTime(f2, actx.currentTime + d);
    g.gain.setValueAtTime(vol, actx.currentTime); g.gain.exponentialRampToValueAtTime(0.0001, actx.currentTime + d);
    o.connect(g); g.connect(actx.destination); o.start(); o.stop(actx.currentTime + d);
  } catch (e) { /* audio unavailable */ }
}
const SFX = {
  click: () => beep(520, 0.06, 'triangle', 0.05), pick: () => beep(420, 0.1, 'sine', 0.06, 640), place: () => beep(300, 0.12, 'sine', 0.06, 200),
  ok: () => { beep(660, 0.12, 'sine', 0.05); setTimeout(() => beep(880, 0.2, 'sine', 0.05), 110); }, err: () => beep(160, 0.18, 'sawtooth', 0.04),
  pour: () => beep(260, 0.5, 'sine', 0.025, 330), tick: () => beep(900, 0.03, 'square', 0.015),
};

// ---------------------------------------------------------------- renderer / scene
const canvas = $('#c');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
const LOW = /[?&]q=low/.test(location.search);
renderer.setPixelRatio(LOW ? 0.6 : Math.min(devicePixelRatio, 2));
renderer.shadowMap.enabled = !LOW; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.05;
const scene = new THREE.Scene(); scene.background = new THREE.Color(0x0b1a20);
scene.environment = new THREE.PMREMGenerator(renderer).fromScene(new RoomEnvironment(), 0.04).texture; scene.environmentIntensity = 0.55;
const camera = new THREE.PerspectiveCamera(60, 1, 0.03, 40); scene.add(camera);
buildLab(scene);
const stage = new THREE.Group(); scene.add(stage);
function resize() { renderer.setSize(innerWidth, innerHeight); camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix(); }
addEventListener('resize', resize); resize();

// ---------------------------------------------------------------- state
const G = {
  mode: 'title', exp: null, expIdx: -1, steps: [], si: 0, items: new Map(), zones: new Map(), hits: [], held: null, busy: false,
  prog: { done: new Set(), n: 0, hold: 0 }, used: new Set(), hover: null, speed: 1, locked: false, down: false, keyE: false, stream: null, bubbles: [], emitters: [],
};
const player = { pos: new V3(0, 1.5, 0.74), yaw: 0, pitch: -0.55, tyaw: 0, tpitch: -0.55 };
const keys = {};
const anims = [];
function run(ms, fn) { return new Promise((res) => anims.push({ t: 0, ms: Math.max(1, ms), fn, res })); }
const wait = (ms) => run(ms, () => {});

// ---------------------------------------------------------------- context handed to experiments
const ctx = {
  T: THREE, P, V3, Y: BENCH_Y, stage, run, wait, sfx: (n) => SFX[n]?.(),
  add(id, obj, x, y, z, o = {}) {
    obj.position.set(x, y, z); if (o.ry) obj.rotation.y = o.ry; stage.add(obj);
    obj.traverse((m) => { if (m.isMesh) { m.castShadow = true; m.receiveShadow = true; } });
    obj.updateMatrixWorld(true);
    const bb = new THREE.Box3().setFromObject(obj), sz = bb.getSize(new V3()), c = bb.getCenter(new V3());
    if (o.hitScale) sz.multiply(new V3(...o.hitScale));
    const pad = 0.012, hs = new V3(Math.max(sz.x + pad, 0.05), Math.max(sz.y + pad, 0.05), Math.max(sz.z + pad, 0.05));
    const hit = new THREE.Mesh(new THREE.BoxGeometry(hs.x, hs.y, hs.z), new THREE.MeshBasicMaterial({ visible: false }));
    hit.position.copy(obj.worldToLocal(c.clone())); hit.userData.hitId = id; obj.add(hit);
    const it = { id, obj, hit, hs, label: o.label || id, home: { pos: obj.position.clone(), quat: obj.quaternion.clone() }, hl: null, zone: false };
    G.items.set(id, it); G.hits.push(hit); obj.userData.id = id; if (!obj.userData.h) obj.userData.h = sz.y;
    if (o.hold) obj.userData.holdPos = o.hold;
    return obj;
  },
  deco(obj, x, y, z, ry = 0) { obj.position.set(x, y, z); obj.rotation.y = ry; stage.add(obj); obj.traverse((m) => { if (m.isMesh) { m.castShadow = true; m.receiveShadow = true; } }); return obj; },
  zone(id, x, y, z, w = 0.09, h = 0.05, d = 0.09, label = 'Place here') {
    const g = new THREE.Group(); g.position.set(x, y, z); stage.add(g);
    const hit = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), new THREE.MeshBasicMaterial({ visible: false })); hit.position.y = h / 2; hit.userData.hitId = id; g.add(hit);
    const it = { id, obj: g, hit, hs: new V3(w, h, d), label, home: null, hl: null, zone: true };
    G.items.set(id, it); G.hits.push(hit); return g;
  },
  get: (id) => G.items.get(id)?.obj,
  topOf(id) { const b = new THREE.Box3().setFromObject(G.items.get(id).hit); return new V3((b.min.x + b.max.x) / 2, b.max.y, (b.min.z + b.max.z) / 2); },
  centerOf(id) { return new THREE.Box3().setFromObject(G.items.get(id).hit).getCenter(new V3()); },
  fill(v, to, color, ms = 800, op) {
    const u = v.userData, from = u.f || 0, col = color ?? u.fc ?? 0xcfe8f5; u.fc = col;
    return run(ms, (t) => { u.f = from + (to - from) * t; u.setFill(u.f, col, op); });
  },
  setFill(v, f, color, op) { v.userData.f = f; v.userData.fc = color ?? v.userData.fc ?? 0xcfe8f5; v.userData.setFill(f, v.userData.fc, op); },
  async moveTo(id, pos, ms = 450, ry = 0, rz = 0) {
    const it = G.items.get(id), o = it.obj; stage.attach(o); const p0 = o.position.clone(), q0 = o.quaternion.clone(), q1 = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, ry, rz));
    await run(ms, (t) => { o.position.lerpVectors(p0, pos, t); o.position.y += Math.sin(Math.PI * t) * 0.07; o.quaternion.slerpQuaternions(q0, q1, t); });
    it.home = { pos: pos.clone(), quat: q1.clone() };
  },
  async visit(id, pos, ms = 700, dwell = 800, ry = 0) {
    const it = G.items.get(id), o = it.obj, p0 = o.position.clone(), q0 = o.quaternion.clone(), q1 = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, ry, 0));
    await run(ms, (t) => { o.position.lerpVectors(p0, pos, t); o.position.y += Math.sin(Math.PI * t) * 0.08; o.quaternion.slerpQuaternions(q0, q1, t); });
    await wait(dwell);
    await run(ms, (t) => { o.position.lerpVectors(pos, p0, t); o.position.y += Math.sin(Math.PI * t) * 0.08; o.quaternion.slerpQuaternions(q1, q0, t); });
  },
  wiggle(id, ms = 1000, amp = 0.025, axis = 'x', cycles = 5) {
    const o = G.items.get(id).obj, p = o.position.clone();
    return run(ms, (t) => { o.position[axis] = p[axis] + Math.sin(t * Math.PI * 2 * cycles) * amp * (1 - t * 0.2); }).then(() => o.position.copy(p));
  },
  stir(id, ms = 1500, r = 0.008) {
    const o = G.items.get(id).obj, p = o.position.clone();
    return run(ms, (t) => { o.position.x = p.x + Math.cos(t * 30) * r; o.position.z = p.z + Math.sin(t * 30) * r; }).then(() => o.position.copy(p));
  },
  drip(from, to, color = 0x9ed8ff, n = 3, gap = 150) {
    return (async () => { for (let i = 0; i < n; i++) { const d = new THREE.Mesh(new THREE.SphereGeometry(0.0035, 10, 8), P.liquidMat(color, 0.9)); stage.add(d); await run(260, (t) => d.position.lerpVectors(from, to, t * t)); stage.remove(d); await wait(gap); } })();
  },
  bubbles(vessel, rate = 10, o = {}) { const e = { vessel, rate, acc: 0, ...o }; G.emitters.push(e); return { stop: () => { G.emitters = G.emitters.filter((x) => x !== e); }, set: (r) => { e.rate = r; } }; },
  toast: (m, bad) => toast(m, bad),
  ppe() { document.body.classList.add('ppe'); SFX.ok(); },
  setHud: (t) => { $('#hudnote').textContent = t || ''; },
  notebook(o) { return openNotebook(o); },
  tween: run,
};

// ---------------------------------------------------------------- highlight visuals
function ensureHl(it) {
  if (it.hl) return it.hl;
  const g = new THREE.Group(), s = it.hs, col = it.zone ? 0x34d399 : 0x22d3ee;
  const m = new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: 0.16, depthTest: false, depthWrite: false });
  const fill = new THREE.Mesh(new THREE.BoxGeometry(s.x, s.y, s.z), m); fill.renderOrder = 998;
  const em = new THREE.LineBasicMaterial({ color: col, transparent: true, depthTest: false });
  const edges = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(s.x, s.y, s.z)), em); edges.renderOrder = 999;
  const am = new THREE.MeshBasicMaterial({ color: col, depthTest: false, depthWrite: false });
  const k = Math.max(0.6, Math.min(2, Math.max(s.x, s.z) / 0.06));
  const arrow = new THREE.Mesh(new THREE.ConeGeometry(0.014 * k, 0.034 * k, 14), am); arrow.rotation.x = Math.PI; arrow.renderOrder = 999;
  arrow.position.y = s.y / 2 + 0.04 * k; g.add(fill, edges, arrow);
  g.userData = { m, em, arrow, base: arrow.position.y, k };
  g.position.copy(it.hit.position); (it.zone ? it.obj : it.obj).add(g); it.hl = g; g.visible = false; return g;
}
function setHighlights(ids) {
  G.items.forEach((it) => { if (it.hl) it.hl.visible = false; });
  ids.forEach((id) => { const it = G.items.get(id); if (it && id !== G.held) ensureHl(it).visible = true; });
}

// ---------------------------------------------------------------- step logic
const stepIds = (s) => [s.item, s.to, s.target, ...(s.targets || []), ...(Array.isArray(s.on) ? s.on : [s.on])].filter(Boolean);
function remaining(list) { return list.filter((id) => !G.prog.done.has(id)); }
function needs() {
  const s = G.steps[G.si]; if (!s) return [];
  switch (s.kind) {
    case 'click': return s.targets ? remaining(s.targets) : [s.target];
    case 'hold': return [s.target];
    case 'move': return G.held ? [s.to] : [s.item];
    case 'use': { const on = Array.isArray(s.on) ? s.on : [s.on]; return G.held ? remaining(on) : [s.item]; }
  }
  return [];
}
function stepTotal(s) { return s.targets ? s.targets.length : s.kind === 'use' && Array.isArray(s.on) ? s.on.length : s.repeat || 1; }
function actionChip(s) {
  const n = stepTotal(s), k = G.prog.n;
  const c = { click: 'CLICK', hold: `HOLD ${s.secs || 2}s`, move: G.held ? 'PLACE' : 'PICK UP', use: G.held ? 'USE ON' : 'PICK UP' }[s.kind];
  return `${c}${n > 1 ? `  ·  ${k}/${n}` : ''}`;
}
function refresh() {
  const s = G.steps[G.si]; if (!s) return;
  setHighlights(needs());
  $('#chip').textContent = actionChip(s);
  const act = new Set(stepIds(s));
  document.querySelectorAll('#left li, #right li').forEach((li) => {
    const ids = li.dataset.ids ? li.dataset.ids.split(',') : [];
    li.classList.toggle('active', ids.some((i) => act.has(i)));
    li.classList.toggle('used', ids.length > 0 && ids.every((i) => G.used.has(i)) && !ids.some((i) => act.has(i)));
  });
}
function loadStep(i) {
  G.si = i; G.prog = { done: new Set(), n: 0, hold: 0 }; G.busy = false;
  const s = G.steps[i];
  $('#stepno').textContent = `STEP ${i + 1} / ${G.steps.length}`;
  $('#steptitle').textContent = s.t; $('#steptext').innerHTML = s.i;
  $('#theory').innerHTML = s.th; $('#theorytitle').textContent = s.tt || 'Chemical theory';
  $('#bar').style.width = `${(i / G.steps.length) * 100}%`;
  $('#stepbox').classList.remove('flash'); void $('#stepbox').offsetWidth; $('#stepbox').classList.add('flash');
  refresh();
}
async function completeStep() {
  const s = G.steps[G.si]; stepIds(s).forEach((id) => G.used.add(id));
  G.busy = true; setHighlights([]); SFX.ok(); await wait(450);
  if (G.si + 1 < G.steps.length) loadStep(G.si + 1); else finishExperiment();
}
function toast(m, bad) { const t = $('#toast'); t.textContent = m; t.className = `show ${bad ? 'bad' : ''}`; clearTimeout(toast.h); toast.h = setTimeout(() => (t.className = ''), 2200); }

// pick up / hold
const HOLD = new V3(0.2, -0.3, -0.52);
async function pick(id) {
  const it = G.items.get(id), o = it.obj; G.held = id; G.busy = true; SFX.pick();
  camera.attach(o); const p0 = o.position.clone(), q0 = o.quaternion.clone(), hp = o.userData.holdPos ? new V3(...o.userData.holdPos) : HOLD, q1 = new THREE.Quaternion().setFromEuler(new THREE.Euler(0.05, -0.25, 0));
  await run(320, (t) => { o.position.lerpVectors(p0, hp, t); o.quaternion.slerpQuaternions(q0, q1, t); });
  G.busy = false; refresh();
}
async function returnHome(id, ms = 380) {
  const it = G.items.get(id), o = it.obj; stage.attach(o); const p0 = o.position.clone(), q0 = o.quaternion.clone();
  await run(ms, (t) => { o.position.lerpVectors(p0, it.home.pos, t); o.position.y += Math.sin(Math.PI * t) * 0.06; o.quaternion.slerpQuaternions(q0, it.home.quat, t); });
}
async function placeAt(id, zoneId) {
  const it = G.items.get(id), z = G.items.get(zoneId); stage.attach(it.obj);
  const p0 = it.obj.position.clone(), q0 = it.obj.quaternion.clone(), p1 = z.obj.position.clone(), q1 = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, z.obj.rotation.y, 0));
  SFX.place();
  await run(380, (t) => { it.obj.position.lerpVectors(p0, p1, t); it.obj.position.y += Math.sin(Math.PI * t) * 0.08; it.obj.quaternion.slerpQuaternions(q0, q1, t); });
  it.home = { pos: p1.clone(), quat: q1.clone() };
}
async function useOn(id, targetId, over) {
  const it = G.items.get(id), o = it.obj, pose = { ...(o.userData.usePose || { type: 'pour', theta: 1.25, gap: 0.04 }), ...(over || {}) };
  const bb = new THREE.Box3().setFromObject(G.items.get(targetId).hit);
  const top = ctx.topOf(targetId), h = o.userData.h || 0.15; stage.attach(o);
  const p0 = o.position.clone(), q0 = o.quaternion.clone();
  let p1, th = 0;
  if (pose.type === 'pour') { th = pose.theta ?? 1.25; p1 = new V3(top.x + h * Math.sin(th), top.y + (pose.gap ?? 0.04) - h * Math.cos(th), top.z); }
  else if (pose.type === 'dip') p1 = new V3(top.x + (pose.dx ?? 0), pose.fromBottom !== undefined ? bb.min.y + pose.fromBottom : top.y - (pose.dip ?? 0.04), pose.face ? bb.max.z + 0.002 : top.z);
  else p1 = new V3(top.x, top.y + (pose.gap ?? 0.01), top.z);
  const q1 = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 0, th));
  await run(520, (t) => { o.position.lerpVectors(p0, p1, t); o.position.y += Math.sin(Math.PI * t) * 0.06; o.quaternion.slerpQuaternions(q0, q1, t); });
  if (pose.type === 'pour') { G.stream = { item: o, h, color: o.userData.liquidColor ?? 0xcfe8f5, y: top.y - 0.045 }; SFX.pour(); }
  return { p1, q1, p0, q0 };
}
async function pressTarget(id) {
  const s = G.steps[G.si];
  if (G.busy || !id || G.mode !== 'play') return;
  if (!needs().includes(id)) { SFX.err(); toast(`Not now — ${s.hint || 'follow the highlighted item for this step'}`, true); return; }
  if (s.kind === 'hold') return;
  if ((s.kind === 'move' || s.kind === 'use') && !G.held) return pick(id);
  G.busy = true;
  if (s.kind === 'click') {
    SFX.click(); const o = G.items.get(id).obj; run(160, (t) => o.scale.setScalar(1 - Math.sin(Math.PI * t) * 0.06));
    if (s.targets) G.prog.done.add(id);
    const idx = G.prog.n; G.prog.n++;
    await s.fx?.(ctx, idx, id);
    if (G.prog.n >= stepTotal(s)) return completeStep();
  } else if (s.kind === 'move') {
    const item = G.held; await placeAt(item, id); G.held = null; await s.fx?.(ctx, 0, id); return completeStep();
  } else if (s.kind === 'use') {
    const item = G.held, on = Array.isArray(s.on) ? s.on : [s.on];
    const info = await useOn(item, id, s.pose); const idx = G.prog.n;
    G.prog.done.add(id); G.prog.n++;
    await s.fx?.(ctx, idx, id); G.stream = null;
    const last = G.prog.n >= on.length, it = G.items.get(item), o = it.obj;
    if (last && s.stay) it.home = { pos: info.p1.clone(), quat: info.q1.clone() };
    else if (last) await returnHome(item);
    else { // keep holding the item for the next target
      camera.attach(o); const pp = o.position.clone(), qq = o.quaternion.clone(), hp = o.userData.holdPos ? new V3(...o.userData.holdPos) : HOLD, qh = new THREE.Quaternion().setFromEuler(new THREE.Euler(0.05, -0.25, 0));
      await run(350, (t) => { o.position.lerpVectors(pp, hp, t); o.quaternion.slerpQuaternions(qq, qh, t); });
    }
    if (last) { G.held = null; return completeStep(); }
  }
  G.busy = false; refresh();
}
async function holdComplete() {
  const s = G.steps[G.si]; G.busy = true; G.prog.hold = 0; const idx = G.prog.n; G.prog.n++;
  await s.fx?.(ctx, idx); G.busy = false;
  if (G.prog.n >= (s.repeat || 1)) return completeStep();
  G.prog.hold = 0; refresh();
}

// ---------------------------------------------------------------- notebook overlay
function openNotebook({ title, html, chart }) {
  return new Promise((res) => {
    const el = $('#notebook'); $('#nbtitle').textContent = title; $('#nbbody').innerHTML = html;
    const cv = $('#nbchart'); cv.style.display = chart ? 'block' : 'none'; if (chart) drawChart(cv, chart);
    el.classList.add('show'); document.exitPointerLock?.();
    const close = () => { el.classList.remove('show'); removeEventListener('keydown', kd); $('#nbclose').onclick = null; res(); setTimeout(lockPointer, 50); };
    const kd = (e) => { if (e.code === 'Enter' || e.code === 'Space' || e.code === 'KeyE') { e.preventDefault(); close(); } };
    addEventListener('keydown', kd); $('#nbclose').onclick = close;
  });
}

// ---------------------------------------------------------------- experiments lifecycle
function clearStage() {
  while (stage.children.length) { const c = stage.children[0]; stage.remove(c); c.traverse((o) => { o.geometry?.dispose?.(); }); }
  G.items.clear(); G.hits.length = 0; G.held = null; G.stream = null; G.emitters = []; G.bubbles.forEach((b) => b.parent?.remove(b)); G.bubbles = [];
  camera.children.slice().forEach((c) => camera.remove(c));
  document.body.classList.remove('ppe'); $('#hudnote').textContent = ''; anims.length = 0;
}
function renderPanels(def) {
  const li = (a, extra) => `<li class="${extra ? 'extra' : ''}" data-ids="${(a.ids || []).join(',')}"><i style="background:${a.c || '#7dd3fc'}"></i><div><b>${a.n}</b><small>${a.d || ''}</small></div><em>${extra ? 'not needed' : 'needed'}</em></li>`;
  $('#left ul').innerHTML = def.apparatus.map((a) => li(a)).join('') + EXTRA_APPARATUS.filter((x) => !def.apparatus.some((a) => a.n === x.n)).map((a) => li(a, true)).join('');
  $('#right ul').innerHTML = def.chemicals.map((a) => li(a)).join('') + EXTRA_CHEMICALS.filter((x) => !def.chemicals.some((a) => a.n === x.n)).map((a) => li(a, true)).join('');
}
function startExperiment(idx) {
  clearStage(); G.expIdx = idx; G.exp = EXPERIMENTS[idx]; G.used = new Set(); G.mode = 'play';
  const def = G.exp.build(ctx); G.steps = def.steps; G.def = def;
  $('#expname').textContent = `${idx + 1}. ${G.exp.title}`;
  renderPanels(def); loadStep(0);
  ['menu', 'title', 'finish', 'pause'].forEach((n) => $('#' + n).classList.remove('show'));
  document.body.classList.add('playing'); player.pos.set(0, 1.5, 0.74); player.yaw = player.tyaw = 0; player.pitch = player.tpitch = -0.55;
  lockPointer();
}
function finishExperiment() {
  G.mode = 'done'; setHighlights([]); $('#bar').style.width = '100%'; document.exitPointerLock?.();
  $('#fintitle').textContent = `${G.exp.title} — complete`; $('#finbody').innerHTML = G.def.summary ? G.def.summary(ctx) : '';
  $('#finish').classList.add('show');
}

// ---------------------------------------------------------------- UI wiring
const cards = $('#cards');
EXPERIMENTS.forEach((e, i) => {
  const b = document.createElement('button'); b.className = 'card'; b.style.setProperty('--h', e.hue);
  b.innerHTML = `<span class="num">${String(i + 1).padStart(2, '0')}</span><h3>${e.title}</h3><p>${e.blurb}</p><span class="tag">${e.tag}</span>`;
  b.onclick = () => startExperiment(i); cards.appendChild(b);
});
function showMenu() { G.mode = 'menu'; document.exitPointerLock?.(); document.body.classList.remove('playing'); ['title', 'pause', 'finish'].forEach((n) => $('#' + n).classList.remove('show')); $('#menu').classList.add('show'); }
$('#start').onclick = () => { $('#title').classList.remove('show'); showMenu(); };
$('#finmenu').onclick = showMenu; $('#pausemenu').onclick = showMenu;
$('#finretry').onclick = () => startExperiment(G.expIdx);
$('#resume').onclick = () => { $('#pause').classList.remove('show'); lockPointer(); };
function lockPointer() { if (G.mode === 'play') { try { const p = canvas.requestPointerLock?.(); p?.catch?.(() => {}); } catch (e) { /* ignore */ } } }
document.addEventListener('pointerlockchange', () => {
  G.locked = document.pointerLockElement === canvas;
  if (!G.locked && G.mode === 'play' && !$('#notebook').classList.contains('show')) $('#pause').classList.add('show'); else $('#pause').classList.remove('show');
});
canvas.addEventListener('mousedown', (e) => {
  if (e.button !== 0) return; if (G.mode === 'play' && !G.locked) lockPointer();
  G.down = true; G.downAt = performance.now(); G.dragPick = G.mode === 'play' && !G.held && !G.busy && needs().includes(G.hover);
  if (G.mode === 'play') pressTarget(G.hover);
});
addEventListener('mouseup', () => {
  // drag & drop: pressed on an item, dragged, and released over its target
  if (G.mode === 'play' && G.dragPick && G.held && performance.now() - G.downAt > 320 && needs().includes(G.hover)) pressTarget(G.hover);
  G.down = false; G.dragPick = false;
});
addEventListener('mousemove', (e) => { if (!G.locked || Math.abs(e.movementX) > 250 || Math.abs(e.movementY) > 250) return; const s = keys.KeyZ ? 0.0011 : 0.0022; player.tyaw -= e.movementX * s; player.tpitch = Math.max(-1.4, Math.min(1.2, player.tpitch - e.movementY * s)); player.yaw = player.tyaw; player.pitch = player.tpitch; });
addEventListener('keydown', (e) => {
  if (e.repeat) return; keys[e.code] = true;
  if (G.mode !== 'play') return;
  if (e.code === 'KeyE') { G.keyE = true; pressTarget(G.hover); }
  if (e.code === 'KeyR' && G.held && !G.busy) { const id = G.held; G.held = null; G.busy = true; returnHome(id).then(() => { G.busy = false; refresh(); }); }
  if (e.code === 'Tab') { e.preventDefault(); document.body.classList.toggle('hidepanels'); }
  if (e.code === 'KeyM') showMenu();
});
addEventListener('keyup', (e) => { keys[e.code] = false; if (e.code === 'KeyE') G.keyE = false; });

// ---------------------------------------------------------------- main loop
const ray = new THREE.Raycaster(); ray.far = 3.2;
function updateHover() {
  ray.setFromCamera(new THREE.Vector2(0, 0), camera);
  const hits = ray.intersectObjects(G.hits.filter((h) => h.userData.hitId !== G.held), false);
  const valid = new Set(needs()); let id = null;
  for (const h of hits) if (valid.has(h.object.userData.hitId)) { id = h.object.userData.hitId; break; }
  if (!id && hits.length) { const first = G.items.get(hits[0].object.userData.hitId); if (first && !first.zone) id = first.id; }
  G.hover = id;
  const ch = $('#cross'); ch.classList.toggle('ok', !!id && valid.has(id)); ch.classList.toggle('on', !!id);
  $('#hoverlabel').textContent = id && !G.items.get(id).zone ? G.items.get(id).label : (id && valid.has(id) ? G.items.get(id).label : '');
}
const BUB = { geo: new THREE.SphereGeometry(0.0022, 8, 6), mat: new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.7 }) };
function updatePointer() {
  const el = $('#pointer'); const ids = G.mode === 'play' ? needs().filter((id) => id !== G.held && G.items.has(id)) : [];
  if (!ids.length || G.busy) { el.style.display = 'none'; return; }
  let best = null, bd = 1e9;
  ids.forEach((id) => { const p = ctx.centerOf(id).project(camera); const behind = p.z > 1; const x = behind ? -p.x : p.x, y = behind ? -p.y : p.y, d = Math.hypot(x, y); if (d < bd) { bd = d; best = { x, y, behind, label: G.items.get(id).label }; } });
  if (!best.behind && Math.abs(best.x) < 0.7 && Math.abs(best.y) < 0.88) { el.style.display = 'none'; return; }
  const a = Math.atan2(best.y, best.x), k = Math.max(Math.abs(Math.cos(a)) / 0.5, Math.abs(Math.sin(a)) / 0.8);
  el.style.display = 'flex'; el.style.left = `${50 + (Math.cos(a) / k) * 50}%`; el.style.top = `${50 - (Math.sin(a) / k) * 50}%`;
  el.firstElementChild.style.transform = `rotate(${-a}rad)`; el.lastElementChild.textContent = best.label;
}
const clock = new THREE.Clock(); const tmp = new V3();
function frame() {
  requestAnimationFrame(frame);
  const dt = Math.min(clock.getDelta(), 0.1), sdt = dt * G.speed, now = performance.now() / 1000;
  // anims
  for (let i = anims.length - 1; i >= 0; i--) {
    const a = anims[i]; a.t += sdt * 1000; const p = Math.min(1, a.t / a.ms); a.fn(ease(p), p);
    if (p >= 1) { anims.splice(i, 1); a.res(); }
  }
  if (G.mode === 'play' || G.mode === 'done') {
    const sp = 1.6 * dt, f = (keys.KeyW ? 1 : 0) - (keys.KeyS ? 1 : 0), r = (keys.KeyD ? 1 : 0) - (keys.KeyA ? 1 : 0);
    if (!G.locked) { player.tyaw += ((keys.ArrowLeft ? 1 : 0) - (keys.ArrowRight ? 1 : 0)) * dt * 1.6; player.tpitch += ((keys.ArrowUp ? 1 : 0) - (keys.ArrowDown ? 1 : 0)) * dt * 1.2; player.yaw = player.tyaw; player.pitch = Math.max(-1.4, Math.min(1.2, player.tpitch)); }
    player.pos.x += (-Math.sin(player.yaw) * f + Math.cos(player.yaw) * r) * sp; player.pos.z += (-Math.cos(player.yaw) * f - Math.sin(player.yaw) * r) * sp;
    player.pos.x = Math.max(-3.2, Math.min(3.2, player.pos.x)); player.pos.z = Math.max(0.45, Math.min(2.6, player.pos.z));
  } else { player.yaw = Math.sin(now * 0.12) * 0.35; player.pitch = -0.32; player.pos.set(Math.sin(now * 0.1) * 0.5, 1.62, 1.6); }
  camera.position.copy(player.pos); camera.rotation.set(player.pitch, player.yaw, 0, 'YXZ');
  const tf = keys.KeyZ && G.mode === 'play' ? 28 : 60; camera.fov += (tf - camera.fov) * Math.min(1, dt * 10); camera.updateProjectionMatrix();

  if (G.mode === 'play') {
    updateHover(); updatePointer();
    const s = G.steps[G.si];
    if (s?.kind === 'hold' && !G.busy) {
      if ((G.down || G.keyE) && G.hover === s.target) {
        G.prog.hold = Math.min(1, G.prog.hold + sdt / (s.secs || 2)); s.tick?.(ctx, G.prog.hold, G.prog.n);
        if (G.prog.hold >= 1) holdComplete();
      } else if (G.prog.hold > 0) { G.prog.hold = Math.max(0, G.prog.hold - dt * 1.5); s.tick?.(ctx, G.prog.hold, G.prog.n); }
      $('#ring').style.strokeDashoffset = String(100 - G.prog.hold * 100); $('#ring').style.opacity = G.prog.hold > 0.01 ? 1 : 0;
    } else $('#ring').style.opacity = 0;
  }
  // highlight pulse
  const pulse = 0.5 + 0.5 * Math.sin(now * 5);
  G.items.forEach((it) => { if (it.hl?.visible) { const u = it.hl.userData; u.m.opacity = 0.08 + 0.14 * pulse; u.arrow.position.y = u.base + Math.sin(now * 5) * 0.008 * u.k; } });
  // pour stream
  if (G.stream) {
    if (!G.streamMesh) { G.streamMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.0022, 0.0022, 1, 8), P.liquidMat(0xffffff, 0.8)); stage.add(G.streamMesh); }
    const st = G.stream; st.item.updateMatrixWorld(true); const tip = st.item.localToWorld(new V3(0, st.h, 0)); const len = Math.max(0.01, tip.y - st.y);
    G.streamMesh.visible = true; G.streamMesh.material.color.set(st.color); G.streamMesh.scale.set(1, len, 1); G.streamMesh.position.set(tip.x, st.y + len / 2, tip.z);
  } else if (G.streamMesh) G.streamMesh.visible = false;
  // bubbles
  G.emitters.forEach((e) => {
    e.acc += dt * e.rate; const v = e.vessel; const wp = v.getWorldPosition(tmp.set(0, 0, 0)).clone();
    while (e.acc > 1 && G.bubbles.length < 120) {
      e.acc -= 1; const b = new THREE.Mesh(BUB.geo, BUB.mat);
      const r = (e.r ?? 0.02) * Math.sqrt(Math.random()), a = Math.random() * 6.28; b.position.set(wp.x + (e.cx ?? 0) + Math.cos(a) * r, wp.y + (e.y0 ?? 0.01), wp.z + (e.cz ?? 0) + Math.sin(a) * r);
      b.userData = { vy: 0.05 + Math.random() * 0.05, top: wp.y + (e.top ?? 0.07) }; stage.add(b); G.bubbles.push(b);
    }
  });
  for (let i = G.bubbles.length - 1; i >= 0; i--) { const b = G.bubbles[i]; b.position.y += b.userData.vy * dt; if (b.position.y > b.userData.top) { stage.remove(b); G.bubbles.splice(i, 1); } }
  // item per-frame hooks (cables etc.)
  G.items.forEach((it) => it.obj.userData.onUpdate?.());
  if (!G.norender) renderer.render(scene, camera); else scene.updateMatrixWorld();
}
frame();

window.__game = { G, ctx, player, pressTarget, needs, loadStep, startExperiment, camera, scene, renderer, holdComplete, completeStep, showMenu, run, anims };
$('#title').classList.add('show');
