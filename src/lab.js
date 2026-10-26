// The permanent lab room: floor, walls, benches, sinks, shelves, decorative glassware & chemicals.
import * as THREE from 'three';
import * as P from './parts.js';

export const BENCH_Y = 0.9;

function tex(key, w, h, draw, rep) {
  const t = P.canvasTex(key, w, h, draw);
  if (rep) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(...rep); }
  return t;
}

export function buildLab(scene) {
  const lab = new THREE.Group(); scene.add(lab);
  const add = (o) => { lab.add(o); return o; };

  // floor
  const ft = tex('floor', 256, 256, (c, w, h) => {
    c.fillStyle = '#c9d3d8'; c.fillRect(0, 0, w, h);
    for (let i = 0; i < 4000; i++) { c.fillStyle = `rgba(${90 + Math.random() * 60},${110 + Math.random() * 60},${120 + Math.random() * 60},.08)`; c.fillRect(Math.random() * w, Math.random() * h, 3, 3); }
    c.strokeStyle = '#8fa0a8'; c.lineWidth = 3; c.strokeRect(0, 0, w, h);
  }, [10, 8]);
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(10, 8), new THREE.MeshStandardMaterial({ map: ft, roughness: 0.28, metalness: 0.05 }));
  floor.rotation.x = -Math.PI / 2; floor.position.set(0, 0, 0.8); floor.receiveShadow = true; add(floor);

  // walls (x: -4..4, z: -2..3.6, h 3)
  const wallM = new THREE.MeshStandardMaterial({ color: 0xe4eef0, roughness: 0.9 });
  const accentM = new THREE.MeshStandardMaterial({ color: 0x0e3b46, roughness: 0.8 });
  const wall = (w, h, x, y, z, ry, m = wallM) => { const o = new THREE.Mesh(new THREE.PlaneGeometry(w, h), m); o.position.set(x, y, z); o.rotation.y = ry; o.receiveShadow = true; add(o); return o; };
  wall(8, 3, 0, 1.5, -2, 0); wall(8, 3, 0, 1.5, 3.6, Math.PI); wall(5.6, 3, -4, 1.5, 0.8, Math.PI / 2); wall(5.6, 3, 4, 1.5, 0.8, -Math.PI / 2);
  const ceil = new THREE.Mesh(new THREE.PlaneGeometry(8, 5.6), new THREE.MeshStandardMaterial({ color: 0xf2f6f7, roughness: 1 })); ceil.rotation.x = Math.PI / 2; ceil.position.set(0, 3, 0.8); add(ceil);
  // teal dado band on walls
  add(P.box(8, 0.5, 0.02, accentM, 0, 0.9, -1.99)); add(P.box(0.02, 0.5, 5.6, accentM, -3.99, 0.9, 0.8)); add(P.box(0.02, 0.5, 5.6, accentM, 3.99, 0.9, 0.8));

  // ceiling light panels
  const lightM = new THREE.MeshBasicMaterial({ color: 0xffffff });
  [-2, 0, 2].forEach((x) => [-0.6, 1.4].forEach((z) => add(P.box(1.0, 0.03, 0.4, lightM, x, 2.97, z))));

  // bench material
  const topM = new THREE.MeshStandardMaterial({ color: 0x2c3a40, roughness: 0.32, metalness: 0.1 });
  const cabM = new THREE.MeshStandardMaterial({ color: 0xf1f5f6, roughness: 0.55 });
  const doorM = new THREE.MeshStandardMaterial({ color: 0x14606d, roughness: 0.5 });

  function bench(w, d, x, z) {
    const g = new THREE.Group();
    g.add(P.box(w, 0.04, d, topM, 0, BENCH_Y - 0.04, 0));
    g.add(P.box(w - 0.06, BENCH_Y - 0.04, d - 0.06, cabM, 0, 0, 0));
    const n = Math.round(w / 0.6);
    for (let i = 0; i < n; i++) {
      const dx = -w / 2 + (i + 0.5) * (w / n);
      g.add(P.box(w / n - 0.03, 0.7, 0.012, doorM, dx, 0.1, d / 2 - 0.03 + 0.0), P.box(0.012, 0.12, 0.02, P.M.steel, dx + w / n / 2 - 0.07, 0.5, d / 2 - 0.02));
    }
    g.position.set(x, 0, z); g.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } }); add(g); return g;
  }
  bench(3.4, 0.85, 0, -0.275); // main island (top y=0.9, z -0.7..0.15)
  const back = bench(7.6, 0.6, 0, -1.68);
  bench(0.6, 4.2, -3.68, 0.5).rotation.y = 0; bench(0.6, 4.2, 3.68, 0.5);

  // sinks + taps
  function sink(x, z, ry) {
    const g = new THREE.Group();
    g.add(P.box(0.5, 0.2, 0.4, P.M.steel, 0, BENCH_Y - 0.22, 0));
    const basin = P.box(0.46, 0.0, 0.36, new THREE.MeshStandardMaterial({ color: 0x0b1316, roughness: 0.4, metalness: 0.4 }), 0, BENCH_Y + 0.0005, 0); g.add(basin);
    g.add(P.box(0.5, 0.012, 0.04, P.M.steel, 0, BENCH_Y, -0.2), P.box(0.5, 0.012, 0.04, P.M.steel, 0, BENCH_Y, 0.2), P.box(0.04, 0.012, 0.4, P.M.steel, -0.25, BENCH_Y, 0), P.box(0.04, 0.012, 0.4, P.M.steel, 0.25, BENCH_Y, 0));
    const tap = new THREE.Group();
    tap.add(P.cyl(0.014, 0.014, 0.22, P.M.steel, 0, BENCH_Y, -0.16, 16), P.tube([[0, BENCH_Y + 0.22, -0.16], [0, BENCH_Y + 0.28, -0.14], [0, BENCH_Y + 0.27, -0.04], [0, BENCH_Y + 0.22, 0.0]], 0.011, P.M.steel, 20));
    tap.add(P.box(0.1, 0.012, 0.012, P.M.steel, 0, BENCH_Y + 0.24, -0.17), P.cyl(0.012, 0.012, 0.02, P.mat(0x2563eb), -0.05, BENCH_Y + 0.24, -0.17, 12), P.cyl(0.012, 0.012, 0.02, P.mat(0xdc2626), 0.05, BENCH_Y + 0.24, -0.17, 12));
    g.add(tap); g.position.set(x, 0, z); g.rotation.y = ry; g.traverse((o) => { if (o.isMesh) o.castShadow = true; }); add(g);
  }
  sink(-2.3, -1.68, 0); sink(2.3, -1.68, 0); sink(-3.68, 1.4, Math.PI / 2); sink(3.68, 1.4, -Math.PI / 2);

  // reagent shelves on back wall
  const shelfM = P.mat(0xdfe6ea, 0.5);
  const shelves = [];
  [1.45, 1.95, 2.45].forEach((y) => { [-2.4, 0, 2.4].forEach((x) => { const s = P.box(2.2, 0.03, 0.28, shelfM, x, y, -1.84); s.castShadow = true; add(s); shelves.push([x, y]); }); });
  const cols = [0xcfe8f5, 0xf5e6a8, 0xb7e4c7, 0xf2c0c0, 0xd9c8f0, 0xffffff, 0xa6d4f2, 0xf4d6a0];
  const names = [['HCl', '1 N'], ['H₂SO₄', '4 N'], ['NaOH', '0.5 N'], ['Ethanol', '95%'], ['Acetone', 'AR'], ['NaCl', 'AR'], ['KMnO₄', '0.02 M'], ['CuSO₄', '15%'], ['Methanol', 'AR'], ['Toluene', 'AR'], ['AgNO₃', '0.1 N'], ['Na₂CO₃', 'AR'], ['KCl', 'AR'], ['Glycerol', 'AR']];
  let k = 0; const rng = (() => { let s = 7; return () => (s = (s * 16807) % 2147483647) / 2147483647; })();
  shelves.forEach(([x, y]) => {
    for (let i = 0; i < 7; i++) {
      const nm = names[(k++) % names.length], isSolid = rng() > 0.7;
      const b = isSolid ? P.solidJar({ r: 0.035, h: 0.09, text: nm, color: cols[k % 8], glass: rng() > 0.5 ? 'amber' : 'clear' }) : P.bottle({ h: 0.17 + rng() * 0.06, r: 0.03 + rng() * 0.008, glass: rng() > 0.45 ? 'amber' : 'clear', liquid: cols[k % 8], text: nm, fill: 0.5 + rng() * 0.4 });
      b.position.set(x - 0.9 + i * 0.3 + (rng() - 0.5) * 0.02, y + 0.015, -1.84); b.rotation.y = (rng() - 0.5) * 0.3; add(b);
    }
  });

  // decorative glassware / equipment on back counter
  const dec = (o, x, z) => { o.position.set(x, BENCH_Y, z); o.traverse((m) => { if (m.isMesh) m.castShadow = true; }); add(o); };
  for (let i = 0; i < 4; i++) dec(P.beaker(0.03 + i * 0.006, 0.07 + i * 0.015, `${50 + i * 100} mL`), -3.5 + i * 0.13, -1.62);
  for (let i = 0; i < 3; i++) dec(P.conical(0.045 + i * 0.006, 0.12 + i * 0.01), -2.9 + i * 0.14, -1.62);
  dec(P.cylinderGrad('50 mL', 0.22), -2.35, -1.55); dec(P.cylinderGrad('100 mL', 0.3), -2.2, -1.55);
  const rk = P.rack(8); dec(rk, -1.5, -1.6); for (let i = 0; i < 6; i++) { const t = P.testTube(0.1); t.position.set(-1.5 - 0.1 + i * 0.032 * 0.9, 0.006, 0); rk.add(t); }
  dec(P.standRod(0.7), 1.2, -1.62); dec(P.burette(), 1.13, -1.62); 
  const sp = P.box(0.15, 0.1, 0.12, P.mat(0x1f6f78), 0, 0, 0); dec(sp, 1.7, -1.6);
  dec(P.bottle({ kind: 'wash', h: 0.2, glass: 'white', liquid: 0xffffff, text: ['H₂O'] }), 0.5, -1.6);
  dec(P.bottle({ kind: 'wash', h: 0.2, glass: 'white', liquid: 0xffffff, text: ['EtOH'] }), 0.62, -1.6);
  // Bunsen-like burner decoy
  const bn = new THREE.Group(); bn.add(P.cyl(0.05, 0.055, 0.015, P.M.darkSteel, 0, 0, 0), P.cyl(0.012, 0.012, 0.13, P.M.steel, 0, 0.015, 0, 14), P.cyl(0.016, 0.016, 0.03, P.M.darkSteel, 0, 0.06, 0, 14)); dec(bn, 3.0, -1.62);
  // fume hood (back, center)
  const fh = P.fumeHood(); fh.scale.set(0.9, 1, 1); fh.position.set(0, BENCH_Y + 0.0, -1.55); fh.scale.set(0.9, 0.75, 0.8); /* ambience only */ fh.visible = false;
  // wall decor: safety poster & whiteboard
  const poster = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 0.6), new THREE.MeshBasicMaterial({
    map: P.canvasTex('poster', 512, 340, (c, w, h) => {
      c.fillStyle = '#0e3b46'; c.fillRect(0, 0, w, h); c.fillStyle = '#22d3ee'; c.font = 'bold 54px Arial'; c.fillText('LAB SAFETY', 36, 90);
      c.fillStyle = '#fff'; c.font = '30px Arial'; ['• Wear goggles & gloves', '• Never pipette by mouth', '• Acid into water, never reverse', '• Know your eyewash station'].forEach((t, i) => c.fillText(t, 36, 150 + i * 46));
    }) }));
  poster.position.set(-3.99, 1.9, 0.6); poster.rotation.y = Math.PI / 2; add(poster);
  const poster2 = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 0.8), new THREE.MeshBasicMaterial({
    map: P.canvasTex('ptable', 512, 340, (c, w, h) => {
      c.fillStyle = '#f8fafc'; c.fillRect(0, 0, w, h); const cl = ['#fca5a5', '#fcd34d', '#86efac', '#93c5fd', '#c4b5fd', '#fdba74'];
      for (let r = 0; r < 7; r++) for (let q = 0; q < 18; q++) { if ((r === 0 && q > 0 && q < 17) || (r < 3 && q > 1 && q < 12 && r > 0)) continue; c.fillStyle = cl[(q + r) % 6]; c.fillRect(14 + q * 27, 30 + r * 38, 24, 34); }
      c.fillStyle = '#0e3b46'; c.font = 'bold 22px Arial'; c.fillText('PERIODIC TABLE OF THE ELEMENTS', 20, 22);
    }) }));
  poster2.position.set(3.99, 1.9, 0.6); poster2.rotation.y = -Math.PI / 2; add(poster2);
  // eyewash + extinguisher
  const ext = new THREE.Group(); ext.add(P.cyl(0.07, 0.07, 0.4, P.mat(0xcc1f1f, 0.35, 0.4), 0, 0, 0, 20), P.cyl(0.025, 0.04, 0.06, P.M.black, 0, 0.4, 0, 12), P.sph(0.03, P.M.black, 0.03, 0.46, 0)); ext.position.set(3.7, 0, 2.8); add(ext);
  // window glow
  const win = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 1.0), new THREE.MeshBasicMaterial({ color: 0xbfe6ff })); win.position.set(-2.4, 1.9, -1.985); add(win);
  add(P.box(2.3, 0.05, 0.03, P.M.white, -2.4, 1.37, -1.97), P.box(2.3, 0.05, 0.03, P.M.white, -2.4, 2.38, -1.97), P.box(0.04, 1.05, 0.03, P.M.white, -2.4, 1.38, -1.97));

  // lights
  scene.add(new THREE.HemisphereLight(0xffffff, 0x8aa0aa, 0.55));
  const sun = new THREE.DirectionalLight(0xffffff, 1.6); sun.position.set(1.5, 3.2, 2.5); sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048); Object.assign(sun.shadow.camera, { left: -2.2, right: 2.2, top: 1.8, bottom: -1.8, near: 0.5, far: 9 }); sun.shadow.bias = -0.0004; sun.shadow.normalBias = 0.02;
  scene.add(sun); scene.add(sun.target); sun.target.position.set(0, 0.8, -0.3);
  [[-2, 0.8], [2, 0.8], [0, -1.2]].forEach(([x, z]) => { const p = new THREE.PointLight(0xdff2ff, 8, 7, 1.6); p.position.set(x, 2.8, z); scene.add(p); });
  return lab;
}
