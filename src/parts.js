// Procedural, real-scale (1 unit = 1 m) lab apparatus builders.
import * as THREE from 'three';

export const mat = (color, rough = 0.5, metal = 0, extra = {}) =>
  new THREE.MeshStandardMaterial({ color, roughness: rough, metalness: metal, ...extra });

export const M = {
  steel: mat(0xaab2ba, 0.32, 0.95),
  darkSteel: mat(0x4a5058, 0.4, 0.85),
  black: mat(0x15181c, 0.6, 0.1),
  plastic: mat(0xf2f5f7, 0.45),
  white: mat(0xf4f4f0, 0.6),
  porcelain: mat(0xf7f5ee, 0.25),
  rubber: mat(0xb3261e, 0.8),
  teal: mat(0x0f9aa8, 0.5),
  copper: mat(0xc2693a, 0.32, 1),
  coal: mat(0x1b1b1d, 0.55, 0.15),
  wood: mat(0xc99a5b, 0.7),
};

export function glassMat(tint = 0xe6f4ff, op = 0.2) {
  return new THREE.MeshPhysicalMaterial({
    color: tint, transparent: true, opacity: op, roughness: 0.04, metalness: 0,
    clearcoat: 1, clearcoatRoughness: 0.03, envMapIntensity: 1.8, side: THREE.DoubleSide, depthWrite: false,
  });
}
export function liquidMat(color, op = 0.72) {
  return new THREE.MeshPhysicalMaterial({
    color, transparent: true, opacity: Math.max(op, 0.6), roughness: 0.06, metalness: 0, clearcoat: 0.6,
    side: THREE.DoubleSide, depthWrite: false, envMapIntensity: 1.2,
  });
}

export function box(w, h, d, m, x = 0, y = 0, z = 0) {
  const o = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m);
  o.position.set(x, y + h / 2, z); return o;
}
export function cyl(rt, rb, h, m, x = 0, y = 0, z = 0, seg = 32) {
  const o = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg), m);
  o.position.set(x, y + h / 2, z); return o;
}
export function sph(r, m, x = 0, y = 0, z = 0, sy = 1) {
  const o = new THREE.Mesh(new THREE.SphereGeometry(r, 32, 20), m);
  o.position.set(x, y, z); o.scale.y = sy; return o;
}
export function lathe(pts, m, seg = 48) {
  return new THREE.Mesh(new THREE.LatheGeometry(pts.map((p) => new THREE.Vector2(p[0], p[1])), seg), m);
}
export function torus(R, r, m, x = 0, y = 0, z = 0, rotX = Math.PI / 2) {
  const o = new THREE.Mesh(new THREE.TorusGeometry(R, r, 8, 40), m);
  o.position.set(x, y, z); o.rotation.x = rotX; return o;
}
export function tube(points, r, m, seg = 40) {
  const c = new THREE.CatmullRomCurve3(points.map((p) => new THREE.Vector3(...p)));
  return new THREE.Mesh(new THREE.TubeGeometry(c, seg, r, 10, false), m);
}

const texCache = {};
export function canvasTex(key, w, h, draw) {
  if (key && texCache[key]) return texCache[key];
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
  if (key) texCache[key] = t;
  return t;
}

// curved sticker label wrapped on a cylinder
export function labelWrap(r, h, lines, { bg = '#ffffff', fg = '#10222b', arc = 1.9, y = 0, accent = '#0f9aa8' } = {}) {
  const t = canvasTex(null, 256, 160, (g, w, hh) => {
    g.fillStyle = bg; g.fillRect(0, 0, w, hh);
    g.fillStyle = accent; g.fillRect(0, 0, w, 14);
    g.fillStyle = fg; g.textAlign = 'center';
    lines.forEach((l, i) => {
      g.font = `${i === 0 ? 'bold 46' : '32'}px Arial`;
      g.fillText(l, w / 2, 70 + i * 40);
    });
  });
  const o = new THREE.Mesh(
    new THREE.CylinderGeometry(r + 0.0007, r + 0.0007, h, 28, 1, true, -arc / 2, arc),
    new THREE.MeshStandardMaterial({ map: t, roughness: 0.6, side: THREE.DoubleSide }));
  o.position.y = y; return o;
}

function graduations(r, y0, y1, step, opts = {}) {
  const n = Math.round((y1 - y0) / step);
  const t = canvasTex(`grad${n}${opts.big}`, 128, 512, (g, w, h) => {
    g.clearRect(0, 0, w, h); g.strokeStyle = '#fff'; g.fillStyle = '#fff'; g.lineWidth = 3; g.font = '26px Arial';
    for (let i = 0; i <= n; i++) {
      const y = h - 10 - (i / n) * (h - 20); const major = i % 5 === 0;
      g.beginPath(); g.moveTo(10, y); g.lineTo(major ? 70 : 42, y); g.stroke();
      if (major && opts.big !== false) g.fillText(String(i * (opts.unit || 10)), 74, y + 8);
    }
  });
  const o = new THREE.Mesh(
    new THREE.CylinderGeometry(r + 0.0004, r + 0.0004, y1 - y0, 24, 1, true, -0.35, 0.7),
    new THREE.MeshBasicMaterial({ map: t, transparent: true, depthWrite: false, opacity: 0.85 }));
  o.position.y = (y0 + y1) / 2; o.renderOrder = 3; return o;
}

// ---------- generic glass vessel with layered liquids ----------
function radiusAt(p, y) {
  for (let i = 1; i < p.length; i++) {
    if (y <= p[i][1] + 1e-9) {
      const [r0, y0] = p[i - 1], [r1, y1] = p[i];
      return y1 === y0 ? r1 : r0 + ((r1 - r0) * (y - y0)) / (y1 - y0);
    }
  }
  return p[p.length - 1][0];
}

export function glassVessel(profile, { tint = 0xe6f4ff, op = 0.2, fillTop, bottom = 0.002, rim = true, grad, label } = {}) {
  const g = new THREE.Group();
  const top = profile[profile.length - 1];
  g.add(Object.assign(lathe(profile, glassMat(tint, op)), { renderOrder: 4 }));
  if (rim) { const t = torus(top[0], 0.0012, glassMat(tint, Math.min(1, op + 0.25)), 0, top[1]); t.renderOrder = 4; g.add(t); }
  if (grad) g.add(graduations(top[0] > 0.02 ? radiusAt(profile, grad.y0) : top[0], grad.y0, grad.y1, grad.step, grad));
  if (label) g.add(label);
  const liq = new THREE.Group(); g.add(liq);
  const y0 = profile[0][1] + bottom, ft = fillTop ?? top[1] * 0.96;
  const st = { layers: [], liq };
  g.userData.vessel = st; g.userData.topY = top[1]; g.userData.mouthR = top[0];
  g.userData.setLayers = (layers) => {
    st.layers = layers;
    liq.children.slice().forEach((c) => { c.geometry.dispose(); c.material.dispose(); liq.remove(c); });
    let ya = y0;
    layers.forEach(([to, color, opacity = 0.72]) => {
      const yb = y0 + (ft - y0) * to; if (yb - ya < 0.0005) return;
      const n = Math.max(2, Math.ceil((yb - ya) / 0.012)), pts = [[0, ya]];
      for (let i = 0; i <= n; i++) { const y = ya + ((yb - ya) * i) / n; pts.push([Math.max(0.0005, radiusAt(profile, y) - 0.0015), y]); }
      pts.push([0, yb]);
      const m = lathe(pts, liquidMat(color, opacity), 40); m.renderOrder = 2; liq.add(m); ya = yb;
    });
  };
  g.userData.setFill = (f, color, opacity) => g.userData.setLayers(f > 0 ? [[f, color, opacity]] : []);
  g.userData.setColor = (c) => liq.children.forEach((m) => m.material.color.set(c));
  g.userData.fillY = (f) => y0 + (ft - y0) * f;
  return g;
}

export function beaker(r = 0.035, h = 0.09, vol = '100 mL', text = null) {
  const p = [[0, 0], [r - 0.004, 0], [r, 0.004], [r, h]];
  const g = glassVessel(p, { fillTop: h * 0.92, grad: { y0: 0.012, y1: h * 0.9, step: h * 0.9 / 10, unit: Math.round(parseFloat(vol) / 10) * 1 } });
  if (text) g.add(labelWrap(r, 0.03, text, { y: h * 0.45, arc: 1.2 }));
  g.userData.h = h; return g;
}
export function conical(R = 0.052, H = 0.14, text = null, tint) {
  const nr = 0.016, hc = H * 0.72;
  const p = [[0, 0], [R - 0.006, 0], [R, 0.006], [R * 0.96, 0.02], [nr, hc], [nr, H - 0.008], [nr + 0.003, H]];
  const g = glassVessel(p, { fillTop: hc * 0.85, tint });
  if (text) g.add(labelWrap(R * 0.8, 0.026, text, { y: 0.045, arc: 0.9 }));
  g.userData.h = H; return g;
}
export function volFlask(txt = '50 mL') {
  const R = 0.04, pts = [[0, 0]];
  for (let i = 0; i <= 12; i++) { const a = (i / 12) * Math.PI * 0.5; pts.push([Math.sin(a) * R * 0.98 + (i === 0 ? 0.01 : 0), R - Math.cos(a) * R]); }
  pts.push([R, R * 1.0]);
  for (let i = 1; i <= 8; i++) { const a = (i / 8) * Math.PI * 0.5; pts.push([R * (Math.cos(a) * 0.62 + 0.38) * (a < 1.2 ? 1 : 1), R + Math.sin(a) * R * 0.95]); }
  pts.push([0.0105, R * 2.4], [0.0105, R * 2.4 + 0.07], [0.0125, R * 2.4 + 0.075]);
  pts.sort((a, b) => a[1] - b[1]);
  const g = glassVessel(pts, { fillTop: R * 2.4 + 0.045, bottom: 0.003 });
  const mark = torus(0.0108, 0.0004, new THREE.MeshBasicMaterial({ color: 0xffffff }), 0, R * 2.4 + 0.045); g.add(mark);
  g.add(labelWrap(R * 0.95, 0.03, [txt, 'Vol. flask'], { y: R * 1.2, arc: 1.1 }));
  g.userData.h = R * 2.4 + 0.075; return g;
}
export function cylinderGrad(vol = '50 mL', h = 0.2) {
  const r = 0.014, p = [[0, 0], [0.032, 0], [0.032, 0.006], [0.01, 0.014], [r, 0.02], [r, h]];
  const g = glassVessel(p, { fillTop: h * 0.95, grad: { y0: 0.03, y1: h * 0.93, step: (h * 0.9) / 10, unit: 5 } });
  g.userData.h = h; return g;
}
export function testTube(h = 0.1, r = 0.0105, tint) {
  const pts = [[0, 0]];
  for (let i = 1; i <= 8; i++) { const a = (i / 8) * Math.PI / 2; pts.push([Math.sin(a) * r, r - Math.cos(a) * r]); }
  pts.push([r, h]);
  const g = glassVessel(pts, { fillTop: h * 0.92, tint }); g.userData.h = h; return g;
}
export function cuvette(h = 0.075, r = 0.0085) {
  const g = testTube(h, r); g.userData.h = h; return g;
}

// reagent bottles
export function bottle({ h = 0.17, r = 0.032, glass = 'clear', liquid = 0xcfe8f5, cap = 0x1f2933, text = ['Reagent'], fill = 0.7, kind = 'reagent', accent } = {}) {
  const tint = glass === 'amber' ? 0x8a4b12 : glass === 'white' ? 0xffffff : 0xe3f2ff;
  const op = glass === 'amber' ? 0.55 : glass === 'white' ? 0.95 : 0.22;
  const nr = kind === 'wash' ? 0.012 : 0.014, bh = h * 0.68;
  const p = [[0, 0], [r - 0.006, 0], [r, 0.006], [r, bh], [r * 0.7, bh + h * 0.1], [nr, bh + h * 0.17], [nr, h - 0.018], [nr + 0.002, h - 0.016]];
  const g = glassVessel(p, { tint, op, fillTop: bh + h * 0.04, rim: false });
  g.userData.setFill(fill, liquid, 0.85);
  g.add(cyl(nr + 0.004, nr + 0.004, 0.026, mat(cap, 0.5), 0, h - 0.016, 0, 20));
  if (kind === 'wash') {
    const nz = tube([[0, h, 0], [0, h + 0.03, 0.006], [0, h + 0.04, 0.02], [0, h + 0.03, 0.045]], 0.004, mat(cap, 0.5)); g.add(nz);
  }
  if (kind === 'dropper') {
    g.add(cyl(0.004, 0.0015, 0.018, mat(cap), 0, h + 0.01, 0, 12), sph(0.011, M.rubber, 0, h + 0.044, 0, 1.4));
  }
  g.add(labelWrap(r, bh * 0.5, text, { y: bh * 0.45, arc: 2.2, accent: accent || '#0f9aa8' }));
  g.userData.h = h + (kind === 'dropper' ? 0.06 : kind === 'wash' ? 0.04 : 0); g.userData.liquidColor = liquid;
  return g;
}
export function solidJar({ r = 0.04, h = 0.1, color = 0xf4f4f0, text = ['Solid'], lid = 0x1f2933, glass = 'clear' } = {}) {
  const g = new THREE.Group();
  const p = [[0, 0], [r - 0.005, 0], [r, 0.005], [r, h]];
  g.add(glassVessel(p, { rim: false, tint: glass === 'amber' ? 0x8a4b12 : 0xe3f2ff, op: glass === 'amber' ? 0.5 : 0.22, fillTop: 0.01 }));
  const heap = lathe([[0, 0.004], [r * 0.9, 0.004], [r * 0.9, h * 0.55], [r * 0.5, h * 0.62], [0, h * 0.66]], mat(color, 0.9)); g.add(heap);
  g.add(cyl(r + 0.002, r + 0.002, 0.022, mat(lid, 0.5), 0, h, 0, 28));
  g.add(labelWrap(r, h * 0.45, text, { y: h * 0.4, arc: 2.2 }));
  g.userData.h = h + 0.022; return g;
}

// ---------- screens ----------
export function screen(w, h, { bg = '#07201f', fg = '#59ffd2', font = 'bold 54px monospace' } = {}) {
  const c = document.createElement('canvas'); c.width = 256; c.height = Math.round(256 * h / w);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: t, toneMapped: false }));
  m.userData.set = (txt, sub) => {
    const g = c.getContext('2d'); g.fillStyle = bg; g.fillRect(0, 0, c.width, c.height);
    g.fillStyle = fg; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.font = font.replace(/\d+px/, `${sub ? Math.round(c.height * 0.46) : Math.round(c.height * 0.56)}px`);
    g.fillText(txt, c.width / 2, sub ? c.height * 0.38 : c.height / 2);
    if (sub) { g.font = `${Math.round(c.height * 0.2)}px monospace`; g.fillText(sub, c.width / 2, c.height * 0.8); }
    t.needsUpdate = true;
  };
  m.userData.set('---');
  return m;
}

export function balance() {
  const g = new THREE.Group();
  g.add(box(0.2, 0.05, 0.28, M.white, 0, 0, 0), box(0.2, 0.012, 0.28, mat(0xd9dee3, 0.4), 0, 0.05, 0));
  g.add(cyl(0.075, 0.075, 0.004, M.steel, 0, 0.062, -0.02, 40));
  const s = screen(0.1, 0.028); s.position.set(0, 0.03, 0.141); g.add(s);
  g.add(box(0.2, 0.002, 0.002, M.black, 0, 0.049, 0.14));
  g.userData.screen = s; g.userData.pan = new THREE.Vector3(0, 0.066, -0.02); s.userData.set('0.000 g'); g.userData.h = 0.07;
  return g;
}

export function stopwatch() {
  const g = new THREE.Group();
  g.add(cyl(0.032, 0.032, 0.016, mat(0x2b3138, 0.4, 0.6), 0, 0, 0, 40), cyl(0.007, 0.007, 0.014, M.steel, 0, 0.016, 0));
  const s = screen(0.046, 0.022, { bg: '#d8e4d0', fg: '#18211b' }); s.rotation.x = -Math.PI / 2; s.position.set(0, 0.0165, 0.004); g.add(s);
  g.userData.screen = s; s.userData.set('00:00.0'); g.userData.h = 0.03; return g;
}

export function notebook() {
  const g = new THREE.Group();
  g.add(box(0.2, 0.012, 0.28, mat(0x16343d, 0.6), 0, 0, 0));
  const t = canvasTex('nb', 256, 360, (c, w, h) => {
    c.fillStyle = '#f8f6ee'; c.fillRect(0, 0, w, h);
    c.strokeStyle = '#9fc6d6'; for (let y = 60; y < h; y += 26) { c.beginPath(); c.moveTo(14, y); c.lineTo(w - 14, y); c.stroke(); }
    c.fillStyle = '#0b3a46'; c.font = 'bold 30px Arial'; c.fillText('Lab Notebook', 28, 40);
    c.fillStyle = '#d33'; c.beginPath(); c.arc(w - 36, 30, 8, 0, 7); c.fill();
  });
  const p = new THREE.Mesh(new THREE.PlaneGeometry(0.18, 0.26), new THREE.MeshStandardMaterial({ map: t })); p.rotation.x = -Math.PI / 2; p.position.y = 0.0125; g.add(p);
  g.userData.h = 0.015; return g;
}

export function goggles() {
  const g = new THREE.Group(); const fr = mat(0x1d4ed8, 0.4), lens = glassMat(0x9fd8ff, 0.4);
  [-0.032, 0.032].forEach((x) => {
    const l = new THREE.Mesh(new THREE.SphereGeometry(0.03, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2), lens); l.rotation.x = Math.PI / 2; l.scale.set(1, 0.5, 0.9); l.position.set(x, 0.03, 0); g.add(l);
    g.add(torus(0.03, 0.004, fr, x, 0.03, 0.012, 0));
  });
  g.add(box(0.02, 0.01, 0.01, fr, 0, 0.04, 0.012), tube([[-0.06, 0.03, 0.0], [-0.07, 0.03, -0.05], [0, 0.03, -0.09], [0.07, 0.03, -0.05], [0.06, 0.03, 0.0]], 0.004, mat(0x111827, 0.8)));
  g.userData.h = 0.07; return g;
}

// ---------- hand tools ----------
export function pipette({ h = 0.3, color = 0xdbeafe, ring = 0x2563eb } = {}) {
  const g = new THREE.Group(); const gm = glassMat(0xeaf6ff, 0.28);
  g.add(Object.assign(cyl(0.0045, 0.0045, h * 0.92, gm, 0, 0.01, 0, 12), { renderOrder: 4 }));
  g.add(cyl(0.0008, 0.003, 0.014, gm, 0, 0, 0, 10), cyl(0.0053, 0.0053, 0.006, mat(ring), 0, h * 0.7, 0, 12));
  g.add(sph(0.016, M.rubber, 0, h + 0.012, 0, 1.4), cyl(0.006, 0.006, 0.02, M.rubber, 0, h * 0.92 + 0.01, 0, 12));
  const li = cyl(0.0032, 0.0032, h * 0.35, liquidMat(color, 0.8), 0, 0.02, 0, 10); li.name = 'pip-liq'; g.add(li);
  g.userData.h = h + 0.04; g.userData.usePose = { type: 'dip', dip: 0.03 }; return g;
}
export function dropperTool() { return pipette({ h: 0.12, ring: 0x111111 }); }
export function capillary() {
  const g = new THREE.Group(); g.add(cyl(0.0012, 0.0012, 0.09, glassMat(0xffffff, 0.45), 0, 0, 0, 8), cyl(0.0006, 0.0006, 0.02, mat(0x6b7280), 0, 0.0, 0, 6));
  g.userData.h = 0.09; g.userData.usePose = { type: 'dip', dip: 0.012 }; return g;
}
export function pencil() {
  const g = new THREE.Group(); g.add(cyl(0.004, 0.004, 0.16, mat(0xf4c20d, 0.5), 0, 0.01, 0, 6), cyl(0.0003, 0.004, 0.012, mat(0xe9c8a0), 0, 0, 0, 6), cyl(0.004, 0.004, 0.008, mat(0xe85d75), 0, 0.17, 0, 12));
  g.userData.h = 0.18; g.userData.usePose = { type: 'dip', dip: -0.002 }; return g;
}
export function ruler() {
  const g = new THREE.Group(); const t = canvasTex('ruler', 1024, 64, (c, w, h) => {
    c.fillStyle = '#e2e8f0'; c.fillRect(0, 0, w, h); c.fillStyle = '#111'; c.font = '22px Arial';
    for (let i = 0; i <= 30; i++) { const x = 10 + i * 33; c.fillRect(x, 0, 2, i % 5 ? 16 : 28); if (i % 5 === 0) c.fillText(i, x + 4, 52); }
  });
  const m = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.002, 0.03), new THREE.MeshStandardMaterial({ map: t, roughness: 0.4 })); m.position.y = 0.001; g.add(m);
  g.userData.h = 0.004; g.userData.usePose = { type: 'above', gap: 0.01 }; return g;
}
export function tweezers() {
  const g = new THREE.Group(); const m = M.steel;
  [-1, 1].forEach((s) => { const a = box(0.004, 0.14, 0.002, m, s * 0.003, 0, 0); a.rotation.z = s * -0.03; g.add(a); });
  g.add(box(0.012, 0.01, 0.003, m, 0, 0.135, 0)); g.userData.h = 0.15; g.userData.usePose = { type: 'dip', dip: 0.025 }; return g;
}
export function tongs() {
  const g = new THREE.Group(); const m = M.darkSteel;
  [-1, 1].forEach((s) => { const a = box(0.008, 0.22, 0.004, m, s * 0.004, 0, 0); a.rotation.z = s * -0.05; g.add(a); });
  g.add(box(0.03, 0.012, 0.01, m, 0, 0.215, 0)); g.userData.h = 0.23; g.userData.usePose = { type: 'dip', dip: 0.06 }; return g;
}
export function glassRod() {
  const g = new THREE.Group(); g.add(Object.assign(cyl(0.0032, 0.0032, 0.2, glassMat(0xffffff, 0.4), 0, 0, 0, 10), { renderOrder: 4 }));
  g.userData.h = 0.2; g.userData.usePose = { type: 'dip', dip: 0.05 }; return g;
}
export function spatula() {
  const g = new THREE.Group(); g.add(box(0.012, 0.05, 0.001, M.steel, 0, 0, 0), box(0.004, 0.12, 0.002, M.steel, 0, 0.05, 0));
  g.userData.h = 0.17; g.userData.usePose = { type: 'dip', dip: 0.03 }; return g;
}
export function sandpaper() {
  const g = new THREE.Group(); const t = canvasTex('sand', 128, 128, (c, w, h) => {
    c.fillStyle = '#b88a4a'; c.fillRect(0, 0, w, h);
    for (let i = 0; i < 1800; i++) { c.fillStyle = Math.random() > 0.5 ? '#6b4a1f' : '#e0b878'; c.fillRect(Math.random() * w, Math.random() * h, 2, 2); }
  });
  const sp = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.003, 0.14), new THREE.MeshStandardMaterial({ map: t, roughness: 1 })); sp.position.y = 0.0015; g.add(sp);
  g.userData.h = 0.003; g.userData.usePose = { type: 'above', gap: 0.004 }; return g;
}
export function weighBoat() {
  const g = new THREE.Group(); g.add(lathe([[0, 0], [0.025, 0], [0.032, 0.012], [0.03, 0.013]], mat(0xf8fafc, 0.4, 0, { side: THREE.DoubleSide }), 24));
  g.userData.h = 0.014; return g;
}
export function wire(points, color = 0xcc2222) { return tube(points, 0.0028, mat(color, 0.5), 36); }
export function ice(n = 4) {
  const g = new THREE.Group(); const m = new THREE.MeshPhysicalMaterial({ color: 0xdff3ff, transparent: true, opacity: 0.7, roughness: 0.1, transmission: 0 });
  for (let i = 0; i < n; i++) { const c = box(0.016, 0.014, 0.016, m, (Math.random() - 0.5) * 0.03, 0.01 + Math.random() * 0.03, (Math.random() - 0.5) * 0.03); c.rotation.set(Math.random(), Math.random(), Math.random()); g.add(c); }
  return g;
}
export function metalPlate(color = 0xc9ced4, w = 0.06, h = 0.02, d = 0.0015, name = 'Plate') {
  const g = new THREE.Group(); const m = mat(color, 0.35, 1); m.name = 'metal';
  const b = box(w, h, d, m, 0, 0, 0); g.add(b); g.userData.metal = m; g.userData.h = h; return g;
}

// ---------- equipment ----------
export function standRod(rodH = 0.7) {
  const g = new THREE.Group();
  g.add(box(0.2, 0.018, 0.13, M.darkSteel, 0, 0, 0), cyl(0.006, 0.006, rodH, M.steel, -0.07, 0.018, 0, 12));
  return g;
}
export function clamp(len = 0.07) {
  const g = new THREE.Group(); g.add(box(0.025, 0.02, 0.025, M.darkSteel, 0, -0.01, 0), cyl(0.004, 0.004, len, M.darkSteel, len / 2, 0, 0, 8).rotateZ(Math.PI / 2));
  g.children[1].position.set(len / 2, 0, 0); g.add(torus(0.012, 0.003, M.darkSteel, len, 0, 0, 0)); return g;
}
export function burette() {
  const H = 0.55, r = 0.0085;
  const p = [[0, 0], [0.0022, 0], [0.0035, 0.03], [r, 0.07], [r, H], [r + 0.001, H + 0.004]];
  const g = glassVessel(p, { fillTop: H - 0.01, bottom: 0.07, grad: { y0: 0.09, y1: H - 0.02, step: (H - 0.11) / 50, big: true, unit: 2 }, rim: false });
  const tap = new THREE.Group(); tap.position.y = 0.045;
  tap.add(cyl(0.006, 0.006, 0.02, mat(0xf2f2f2, 0.3), 0, -0.01, 0, 12).rotateZ(Math.PI / 2));
  const hd = box(0.04, 0.007, 0.006, mat(0x0f9aa8, 0.4), 0, -0.0035, 0.012); tap.add(hd); g.add(tap);
  g.userData.handle = hd; g.userData.h = H; g.userData.tipY = 0; return g;
}
export function phMeter() {
  const g = new THREE.Group();
  g.add(box(0.22, 0.05, 0.18, mat(0xe8ecef, 0.45), 0, 0, 0));
  const face = box(0.22, 0.08, 0.02, mat(0xe8ecef, 0.45), 0, 0.05, -0.06); face.rotation.x = -0.4; g.add(face);
  const s = screen(0.11, 0.05); s.position.set(-0.03, 0.095, -0.036); s.rotation.x = -0.4; g.add(s);
  [0.05, 0.08].forEach((x, i) => { const b = cyl(0.008, 0.008, 0.005, [mat(0x0f9aa8), mat(0xd97706)][i], x, 0.05, 0.03, 16); g.add(b); });
  g.userData.screen = s; s.userData.set('OFF'); g.userData.h = 0.12; return g;
}
export function phProbe() {
  const g = new THREE.Group(); g.add(Object.assign(cyl(0.006, 0.006, 0.15, glassMat(0xffffff, 0.45), 0, 0.012, 0, 12), { renderOrder: 4 }));
  g.add(sph(0.0075, glassMat(0xbfe6ff, 0.6), 0, 0.01, 0), cyl(0.009, 0.009, 0.05, mat(0x0f172a, 0.5), 0, 0.16, 0, 14));
  g.userData.h = 0.21; g.userData.usePose = { type: 'dip', dip: 0.045 }; return g;
}
export function colorimeter() {
  const g = new THREE.Group();
  g.add(box(0.3, 0.1, 0.24, mat(0xeef1f4, 0.45), 0, 0, 0), box(0.3, 0.1, 0.0, mat(0x0f172a), 0, 0, 0));
  g.add(box(0.3, 0.012, 0.24, mat(0xcfd6dc, 0.4), 0, 0.1, 0));
  g.add(cyl(0.013, 0.013, 0.004, M.black, 0.0, 0.112, -0.03, 20));
  const s = screen(0.1, 0.045); s.position.set(-0.07, 0.05, 0.1205); g.add(s);
  [0.05, 0.1].forEach((x, i) => g.add(cyl(0.012, 0.012, 0.012, mat([0x0f9aa8, 0xd97706][i], 0.4), x, 0.05, 0.12, 20).rotateX(Math.PI / 2)));
  g.children[g.children.length - 1].position.set(0.1, 0.05, 0.125); g.children[g.children.length - 2].position.set(0.05, 0.05, 0.125);
  const pw = box(0.022, 0.01, 0.01, mat(0xdc2626, 0.4), 0.125, 0.075, 0.121); g.add(pw);
  g.userData.screen = s; s.userData.set('OFF'); g.userData.slot = new THREE.Vector3(0, 0.1, -0.03); g.userData.h = 0.11; return g;
}
export function rack(n = 6, gap = 0.032) {
  const g = new THREE.Group(); const m = mat(0x1f6f78, 0.6);
  g.add(box(n * gap + 0.02, 0.008, 0.045, m, 0, 0.035, 0), box(n * gap + 0.02, 0.008, 0.045, m, 0, 0, 0));
  g.add(box(0.01, 0.043, 0.045, m, -(n * gap + 0.02) / 2, 0, 0), box(0.01, 0.043, 0.045, m, (n * gap + 0.02) / 2, 0, 0)); return g;
}
export function oven() {
  const g = new THREE.Group(); const m = mat(0xdfe5ea, 0.4, 0.3), dk = mat(0x1d2126, 0.8);
  g.add(box(0.5, 0.42, 0.34, m, 0, 0, -0.04), box(0.5, 0.08, 0.08, m, 0, 0.34, 0.17), box(0.5, 0.06, 0.08, m, 0, 0, 0.17), box(0.06, 0.42, 0.08, m, -0.22, 0, 0.17), box(0.06, 0.42, 0.08, m, 0.22, 0, 0.17));
  g.add(box(0.38, 0.28, 0.002, dk, 0, 0.06, 0.131), box(0.38, 0.004, 0.08, M.steel, 0, 0.14, 0.17));
  const s = screen(0.1, 0.035); s.position.set(-0.1, 0.375, 0.2115); g.add(s); g.userData.screen = s; s.userData.set('25°C');
  const hinge = new THREE.Group(); hinge.position.set(-0.2, 0.055, 0.226); g.add(hinge);
  hinge.add(box(0.4, 0.29, 0.016, mat(0x9aa4ad, 0.3, 0.8), 0.2, 0, 0), box(0.28, 0.18, 0.004, glassMat(0x222a30, 0.5), 0.2, 0.055, 0.01), box(0.02, 0.1, 0.02, M.black, 0.36, 0.09, 0.02));
  g.userData.door = hinge; g.userData.open = (t) => (hinge.rotation.y = -1.75 * t); g.userData.ledge = new THREE.Vector3(0, 0.144, 0.17); g.userData.h = 0.42; return g;
}
export function muffle() {
  const g = new THREE.Group(); const m = mat(0x3a4048, 0.55, 0.3);
  g.add(box(0.46, 0.38, 0.32, m, 0, 0, -0.04), box(0.46, 0.1, 0.08, m, 0, 0.28, 0.16), box(0.46, 0.07, 0.08, m, 0, 0, 0.16), box(0.05, 0.38, 0.08, m, -0.205, 0, 0.16), box(0.05, 0.38, 0.08, m, 0.205, 0, 0.16));
  const glow = box(0.36, 0.21, 0.002, new THREE.MeshBasicMaterial({ color: 0x120805 }), 0, 0.07, 0.121); g.add(glow);
  g.add(box(0.34, 0.004, 0.08, mat(0xb9ab98, 0.9), 0, 0.075, 0.17));
  const s = screen(0.1, 0.04, { bg: '#210a05', fg: '#ff9a3c' }); s.position.set(-0.1, 0.33, 0.2015); g.add(s); g.userData.screen = s; s.userData.set('25°C');
  const hinge = new THREE.Group(); hinge.position.set(0, 0.07, 0.235); g.add(hinge);
  hinge.add(box(0.36, 0.21, 0.03, mat(0xb9ab98, 0.9), 0, 0, -0.015), box(0.12, 0.014, 0.02, M.black, 0, 0.19, 0.0));
  g.userData.glow = glow; g.userData.door = hinge; g.userData.open = (t) => (hinge.rotation.x = 1.5 * t); g.userData.ledge = new THREE.Vector3(0, 0.079, 0.17); g.userData.h = 0.38; return g;
}
export function desiccator() {
  const g = new THREE.Group();
  g.add(glassVessel([[0, 0], [0.095, 0], [0.1, 0.01], [0.1, 0.16], [0.095, 0.22], [0.06, 0.255], [0.05, 0.27]], { op: 0.14, rim: true }));
  g.add(cyl(0.075, 0.075, 0.006, mat(0xdde3e8, 0.4), 0, 0.075, 0, 36));
  for (let i = 0; i < 70; i++) { const a = Math.random() * 6.28, d = Math.sqrt(Math.random()) * 0.085; g.add(sph(0.005, mat(0xffffff, 0.8), Math.cos(a) * d, 0.012 + Math.random() * 0.04, Math.sin(a) * d)); }
  g.add(sph(0.012, mat(0x222a30), 0, 0.285, 0), cyl(0.006, 0.006, 0.02, mat(0x222a30), 0, 0.27, 0));
  g.userData.h = 0.3; return g;
}
export function crucible(withLid = false) {
  const g = new THREE.Group();
  g.add(lathe([[0, 0], [0.012, 0], [0.019, 0.004], [0.025, 0.04], [0.027, 0.045]], mat(0xf7f5ee, 0.25, 0, { side: THREE.DoubleSide }), 32));
  const coal = lathe([[0, 0.006], [0.015, 0.006], [0.0225, 0.02], [0, 0.026]], M.coal, 24); coal.name = 'coal'; coal.visible = false; g.add(coal);
  const lid = lathe([[0, 0.012], [0.028, 0.004], [0.03, 0], [0.029, 0.001]], mat(0xf7f5ee, 0.25, 0, { side: THREE.DoubleSide }), 32); lid.position.y = 0.046; lid.name = 'lid'; lid.visible = withLid; g.add(lid);
  g.userData.h = 0.05; g.userData.coal = coal; g.userData.lid = lid; g.userData.usePose = { type: 'dip', dip: 0 }; return g;
}
export function chamber() {
  const g = new THREE.Group(); const R = 0.075, H = 0.3;
  const v = glassVessel([[0, 0], [R - 0.004, 0], [R, 0.005], [R, H]], { op: 0.16, fillTop: H * 0.5 });
  g.add(v); g.userData.vesselObj = v;
  const lid = new THREE.Group(); lid.add(cyl(R + 0.004, R + 0.004, 0.008, glassMat(0xe6f4ff, 0.3), 0, 0, 0, 40), sph(0.012, mat(0x222a30), 0, 0.012, 0)); lid.position.y = H; g.add(lid);
  g.userData.lidGroup = lid; g.userData.setLayers = v.userData.setLayers; g.userData.fillY = v.userData.fillY; g.userData.topY = H; g.userData.h = H + 0.02; return g;
}
export function tlcPlate() {
  const g = new THREE.Group();
  g.add(Object.assign(box(0.04, 0.2, 0.0025, glassMat(0xe6f4ff, 0.35), 0, 0, 0), { renderOrder: 4 }));
  const coat = box(0.038, 0.196, 0.0006, mat(0xf3f1ea, 0.9), 0, 0.002, 0.0016); coat.visible = false; coat.name = 'coat'; g.add(coat);
  const line = box(0.038, 0.0012, 0.0004, mat(0x555555), 0, 0.025, 0.0021); line.visible = false; g.add(line);
  const front = box(0.038, 0.0012, 0.0004, mat(0x555555), 0, 0.14, 0.0021); front.visible = false; g.add(front);
  const spot0 = sph(0.0035, mat(0x333333), 0, 0.025, 0.0022, 0.4); spot0.visible = false; g.add(spot0);
  const spots = [0xa65a18, 0x7a3b0e, 0x946020].map(() => { const s = sph(0.0045, mat(0x8a4a10, 0.8), 0, 0.025, 0.0022, 0.45); s.visible = false; s.material.transparent = true; g.add(s); return s; });
  Object.assign(g.userData, { coat, line, front, spot0, spots, h: 0.2, usePose: { type: 'dip', dip: 0.07 } });
  return g;
}
export function iodineJar() {
  const g = new THREE.Group();
  g.add(glassVessel([[0, 0], [0.09, 0], [0.09, 0.2]], { op: 0.18, rim: true, fillTop: 0.001 }));
  g.add(cyl(0.092, 0.092, 0.008, M.black, 0, 0.2, 0, 36));
  for (let i = 0; i < 25; i++) g.add(box(0.008, 0.006, 0.008, mat(0x2b1a2e, 0.3, 0.7), (Math.random() - 0.5) * 0.12, 0.002, (Math.random() - 0.5) * 0.12));
  const v = new THREE.Mesh(new THREE.CylinderGeometry(0.086, 0.086, 0.1, 24, 1, true), new THREE.MeshBasicMaterial({ color: 0x8a4fff, transparent: true, opacity: 0.0, depthWrite: false })); v.position.y = 0.06; g.add(v); g.userData.vapor = v;
  g.userData.h = 0.2; return g;
}
export function psu() {
  const g = new THREE.Group();
  g.add(box(0.26, 0.09, 0.2, mat(0x2b3138, 0.5, 0.3), 0, 0, 0));
  const s = screen(0.09, 0.035); s.position.set(-0.05, 0.055, 0.1005); g.add(s); g.userData.screen = s; s.userData.set('OFF');
  g.add(cyl(0.01, 0.01, 0.012, mat(0xcc2222, 0.4), 0.06, 0.06, 0.1, 16).rotateX(Math.PI / 2));
  g.children[g.children.length - 1].position.set(0.075, 0.025, 0.105);
  g.add(cyl(0.01, 0.01, 0.012, M.black, 0.1, 0.06, 0.1, 16).rotateX(Math.PI / 2)); g.children[g.children.length - 1].position.set(0.105, 0.025, 0.105);
  g.add(box(0.025, 0.012, 0.01, mat(0xdc2626), -0.1, 0.07, 0.1)); g.userData.h = 0.09; return g;
}
export function ammeter() {
  const g = new THREE.Group(); g.add(box(0.12, 0.08, 0.1, mat(0xe8ecef, 0.45), 0, 0, 0));
  const s = screen(0.08, 0.035); s.position.set(0, 0.045, 0.0505); g.add(s); g.userData.screen = s; s.userData.set('0.00 A'); g.userData.h = 0.08; return g;
}
export function rheostat() {
  const g = new THREE.Group();
  g.add(box(0.22, 0.012, 0.07, M.darkSteel, 0, 0, 0), cyl(0.022, 0.022, 0.16, mat(0xc4a27a, 0.8), 0, 0.012, 0).rotateZ(Math.PI / 2));
  g.children[1].position.set(0, 0.034, 0); const knob = box(0.02, 0.03, 0.03, M.black, -0.06, 0.058, 0); g.add(knob);
  g.add(cyl(0.003, 0.003, 0.18, M.steel, 0, 0.065, 0, 8).rotateZ(Math.PI / 2)); g.children[g.children.length - 1].position.set(0, 0.075, 0);
  g.userData.knob = knob; g.userData.h = 0.1; return g;
}
export function bath() {
  const g = new THREE.Group();
  g.add(box(0.45, 0.22, 0.3, mat(0xc5ccd3, 0.35, 0.8), 0, 0, 0));
  g.add(box(0.41, 0.0, 0.26, mat(0x0a0a0a), 0, 0.22, 0));
  const w = box(0.42, 0.17, 0.27, liquidMat(0x6cc4ee, 0.5), 0, 0.03, 0); w.renderOrder = 1; g.add(w); g.userData.water = w;
  const s = screen(0.1, 0.04); s.position.set(-0.1, 0.11, 0.1505); g.add(s); g.userData.screen = s; s.userData.set('25.0°C');
  g.add(box(0.46, 0.015, 0.31, mat(0x9aa4ad, 0.3, 0.85), 0, 0.215, 0));
  g.userData.h = 0.23; return g;
}
export function stirrer() {
  const g = new THREE.Group(); g.add(box(0.16, 0.04, 0.16, mat(0xe8ecef, 0.4), 0, 0, 0), cyl(0.07, 0.07, 0.004, M.steel, 0, 0.04, 0, 36), box(0.03, 0.014, 0.014, mat(0x15181c, 0.5), 0.0, 0.0, 0.082));
  g.userData.h = 0.045; return g;
}
export function stirBar() { const b = cyl(0.003, 0.003, 0.025, mat(0xf8fafc, 0.3), 0, 0, 0, 10); b.rotation.z = Math.PI / 2; const g = new THREE.Group(); g.add(b); b.position.y = 0.003; return g; }
export function viscometer() {
  const g = new THREE.Group(); const gm = glassMat(0xeaf6ff, 0.26);
  const t = (pts) => Object.assign(tube(pts, 0.0035, gm, 50), { renderOrder: 4 });
  g.add(t([[0.03, 0.12, 0], [0.03, 0.2, 0]]), t([[-0.03, 0.2, 0], [-0.03, 0.04, 0], [-0.02, 0.012, 0], [0, 0.005, 0], [0.02, 0.012, 0], [0.03, 0.04, 0]]));
  g.add(Object.assign(sph(0.022, gm, 0.03, 0.065, 0), { renderOrder: 4 }), Object.assign(sph(0.015, gm, -0.03, 0.14, 0, 1.25), { renderOrder: 4 }), Object.assign(sph(0.0095, gm, -0.03, 0.2, 0), { renderOrder: 4 }));
  [0.185, 0.115].forEach((y) => g.add(torus(0.0042, 0.0006, new THREE.MeshBasicMaterial({ color: 0x111111 }), -0.03, y)));
  const lower = sph(0.0205, liquidMat(0xbfe4ff, 0.8), 0.03, 0.065, 0); lower.scale.y = 0.0; lower.visible = false;
  const upper = sph(0.0138, liquidMat(0xbfe4ff, 0.8), -0.03, 0.14, 0, 1.25); upper.visible = false; upper.scale.y = 0.0;
  g.add(lower, upper); g.userData.lower = lower; g.userData.upper = upper;
  g.userData.setLevels = (a, b, color) => {
    lower.visible = a > 0.01; lower.scale.set(1, Math.max(0.01, a), 1); upper.visible = b > 0.01; upper.scale.set(1, Math.max(0.01, b) * 1.25, 1);
    if (color) { lower.material.color.set(color); upper.material.color.set(color); }
  };
  g.userData.h = 0.22; g.userData.hook = { x: -0.03, y: 0.2 }; return g;
}
export function rubberBulb() {
  const g = new THREE.Group(); const m = M.rubber;
  g.add(cyl(0.005, 0.005, 0.06, m, 0, 0, 0, 12), tube([[0, 0.06, 0], [0.01, 0.1, 0.02], [0.06, 0.12, 0.05]], 0.005, m, 20), sph(0.022, m, 0.075, 0.125, 0.06, 1.5));
  g.userData.h = 0.15; return g;
}
export function polymerThread() {
  const g = new THREE.Group(); const m = mat(0xf5f6f7, 0.35); m.transparent = true; m.opacity = 0.92;
  const c = cyl(0.0012, 0.0012, 1, m, 0, 0, 0, 6); g.add(c); g.userData.cyl = c; g.userData.setLen = (l) => { c.scale.y = Math.max(0.001, l); c.position.y = l / 2; };
  g.userData.setLen(0.001); return g;
}

export function fumeHood() {
  const g = new THREE.Group(); const w = 1.5, d = 0.8, h = 1.0;
  const m = mat(0xdfe7ea, 0.5), back = mat(0x24444c, 0.7);
  g.add(box(0.05, h, d, m, -w / 2, 0, 0), box(0.05, h, d, m, w / 2, 0, 0), box(w + 0.1, 0.04, d, m, 0, h, 0), box(w, h, 0.03, back, 0, 0, -d / 2));
  g.add(box(w, 0.12, 0.05, mat(0x0f9aa8, 0.5), 0, h - 0.12, d / 2), cyl(0.12, 0.12, 0.6, M.steel, 0, h + 0.04, -0.2, 24));
  const sash = box(w - 0.02, 0.18, 0.012, glassMat(0xd7f0ff, 0.15), 0, h - 0.3, d / 2); sash.renderOrder = 6; g.add(sash);
  g.add(box(w - 0.02, 0.015, 0.02, M.steel, 0, h - 0.31, d / 2 + 0.01));
  g.add(box(w - 0.2, 0.02, 0.1, new THREE.MeshBasicMaterial({ color: 0xeafcff }), 0, h - 0.14, 0));
  return g;
}
