import * as P from '../parts.js';
import { baseItems, ppeStep, notebookStep, f, table, eq, SIM } from './common.js';

export default {
  title: 'Acetic acid – NaOH titration using a pH meter', tag: 'Physical chemistry · Potentiometry', hue: 150,
  blurb: 'Calibrate a pH meter, titrate 25 mL of 0.1 N acetic acid with NaOH in 2 mL steps and find the equivalence point.',
  build(c) {
    const Y = c.Y, T = c.T; baseItems(c);
    const meter = c.add('meter', P.phMeter(), -0.55, Y, -0.32, { label: 'pH meter' }); const scr = meter.userData.screen.userData;
    const probe = c.add('probe', P.phProbe(), -0.3, Y, -0.1, { label: 'Glass electrode (fragile)' });
    c.deco(P.standRod(0.6), 0.2, Y, -0.35);
    const bur = c.add('bur', P.burette(), 0.13, Y + 0.18, -0.35, { label: 'Burette (NaOH)' }); c.deco(P.clamp(0.04), 0.14 - 0.0, Y + 0.45, -0.35);
    const stir = c.add('stirrer', P.stirrer(), 0.13, Y, -0.34 + 0.0, { label: 'Magnetic stirrer' });
    // beaker sits on the stirrer under burette
    const cx = 0.13, cz = -0.35;
    const bkr = c.add('bkr', P.beaker(0.04, 0.1, '100 mL', ['0.1 N', 'CH₃COOH']), 0.45, Y, -0.1, { label: '100 mL beaker (acid)' });
    c.zone('z_bkr', cx, Y + 0.048, cz, 0.1, 0.1, 0.1, 'Under the burette');
    const buf7 = c.add('buf7', P.beaker(0.03, 0.06, '50 mL', ['pH 7']), -0.15, Y, -0.1, { label: 'Buffer pH 7.00' }); c.setFill(buf7, 0.6, 0xf2e8b0);
    const buf4 = c.add('buf4', P.beaker(0.03, 0.06, '50 mL', ['pH 4']), -0.02, Y, -0.1, { label: 'Buffer pH 4.01' }); c.setFill(buf4, 0.6, 0xf4b6c8);
    c.add('acid', P.bottle({ h: 0.17, r: 0.032, liquid: 0xe9f1f4, text: ['CH₃COOH', '0.1 N'], fill: 0.8 }), 0.62, Y, -0.35, { label: '0.1 N acetic acid' });
    c.add('naoh', P.bottle({ h: 0.17, r: 0.032, liquid: 0xe9f1f4, text: ['NaOH', '? N'], fill: 0.8, accent: '#d97706' }), 0.76, Y, -0.35, { label: 'NaOH (unknown concentration)' });
    c.add('pip', P.pipette({ h: 0.3 }), 0.62, Y, -0.1, { label: '25 mL pipette' });
    c.add('wash', P.bottle({ h: 0.2, r: 0.03, glass: 'white', liquid: 0xffffff, text: ['Distilled', 'water'], kind: 'wash' }), 0.78, Y, -0.1, { label: 'Distilled-water wash bottle' });
    c.deco(P.box(0.1, 0.01, 0.08, P.mat(0xf2f2f0, 1), 0, 0, 0), -0.3, Y, 0.06);
    // zones above beakers for the probe (probe origin at bulb)
    c.zone('zp7', -0.15, Y + 0.02, -0.1, 0.06, 0.1, 0.06, 'Probe in pH 7 buffer'); c.zone('zp4', -0.02, Y + 0.02, -0.1, 0.06, 0.1, 0.06, 'Probe in pH 4 buffer');
    c.zone('zpA', cx, Y + 0.025, cz, 0.06, 0.1, 0.06, 'Probe in the acid');
    // cable from meter to probe
    const cab = new T.Mesh(new T.BufferGeometry(), P.mat(0x111827, 0.7)); c.stage.add(cab);
    const upd = () => { const a = new T.Vector3(-0.55, Y + 0.04, -0.2), b = probe.getWorldPosition(new T.Vector3()).add(new T.Vector3(0, 0.19, 0)); const mid = a.clone().lerp(b, 0.5); mid.y = Math.max(Y + 0.01, Math.min(a.y, b.y) - 0.05);
      const g = new T.TubeGeometry(new T.CatmullRomCurve3([a, mid, b]), 20, 0.0028, 6, false); cab.geometry.dispose(); cab.geometry = g; };
    probe.userData.onUpdate = upd; upd();
    // liquids in burette
    const Ca = 0.1, Va = 25, Cb = 0.098, Ka = 1.8e-5;
    const pH = (Vb) => { const V = Va + Vb, na = Cb * Vb / V, ct = Ca * Va / V; let lo = 0, hi = 14; for (let k = 0; k < 60; k++) { const mid = (lo + hi) / 2, h = Math.pow(10, -mid), oh = 1e-14 / h; const fnc = na + h - oh - ct * Ka / (Ka + h); if (fnc > 0) lo = mid; else hi = mid; } return (lo + hi) / 2; };
    let vol = 0; const readings = [[0, pH(0)]]; let initPH = pH(0);
    const rd = () => document.getElementById('hudnote');
    const burTop = Y + 0.18 + 0.55;

    const steps = [
      ppeStep('Glass electrodes are fragile — do not let the bulb hit the bottom of the vessel and never wipe it harshly. NaOH is caustic: eye protection and gloves.'),
      { t: 'Switch on the pH meter', i: 'Click the <b>pH meter</b> to switch it on and let it warm up.', kind: 'click', target: 'meter', hint: 'switch on the pH meter', tt: 'pH meter', th: '<p>A glass electrode develops a potential that depends on the H⁺ activity of the solution; the meter converts this to pH.</p>', fx: async (cc) => { scr.set('---'); await cc.wait(700); scr.set('7.00', 'pH  25°C'); } },
      { t: 'Rinse the electrode', i: 'Pick up the <b>wash bottle</b> and rinse the <b>electrode</b> with distilled water. (Blot gently — never rub.)', kind: 'use', item: 'wash', on: 'probe', hint: 'rinse the electrode', tt: 'Cleaning the electrode', th: '<p>Rinse between every solution so nothing is carried over, and blot gently with tissue — rubbing builds up static charge and damages the glass membrane.</p>', fx: (cc) => cc.wait(1200) },
      { t: 'Calibrate in pH 7 buffer', i: 'Pick up the <b>electrode</b> and place it in the <b>pH 7.00 buffer</b>.', kind: 'move', item: 'probe', to: 'zp7', hint: 'immerse the electrode in the pH 7 buffer', tt: 'Calibration', th: '<p>Calibration aligns the electrode response with known pH values. Use standard buffers at room temperature and let the reading stabilise.</p>', fx: async (cc) => { scr.set('...', 'stabilising'); await cc.wait(1200); scr.set('7.00', 'CAL pH 7'); } },
      { t: 'Calibrate in pH 4 buffer', i: 'Lift the <b>electrode</b> into the <b>pH 4.01 buffer</b> to complete the two-point calibration.', kind: 'move', item: 'probe', to: 'zp4', hint: 'immerse the electrode in the pH 4 buffer', tt: 'Two-point calibration', th: '<p>A second buffer sets the slope of the electrode. Weak-acid titrations span pH ≈ 3–12, so a pH 4 / 7 pair is appropriate.</p>', fx: async (cc) => { scr.set('...', 'stabilising'); await cc.wait(1200); scr.set('4.01', 'CAL pH 4'); await cc.wait(500); scr.set('OK', 'slope 98.7 %'); } },
      { t: 'Pipette the acid', i: 'Pick up the <b>pipette</b> and transfer <b>25 mL of 0.1 N acetic acid</b> into the 100 mL beaker.', kind: 'use', item: 'pip', on: 'bkr', hint: 'pipette the acid into the beaker', tt: 'Weak acid', th: `<p>Acetic acid is a <b>weak acid</b> — it ionises only partially:</p>${eq('CH₃COOH ⇌ CH₃COO⁻ + H⁺   (Ka = 1.8 × 10⁻⁵)')}`, fx: (cc) => cc.fill(bkr, 0.55, 0xe9f1f4, 1000, 0.35) },
      { t: 'Place the beaker on the stirrer', i: 'Pick up the <b>beaker</b> and set it on the <b>magnetic stirrer</b> under the burette.', kind: 'move', item: 'bkr', to: 'z_bkr', hint: 'put the beaker under the burette', tt: 'Set-up', th: '<p>Gentle stirring (without splashing) keeps the solution uniform so each pH reading is representative.</p>' },
      { t: 'Measure the initial pH', i: 'Pick up the <b>electrode</b> (rinse is assumed) and immerse it in the acid.', kind: 'move', item: 'probe', to: 'zpA', hint: 'immerse the electrode in the acid', tt: 'Initial pH', th: `<p>For a weak acid, [H⁺] ≈ √(Ka·C):</p>${eq('pH = ½(pKa − log C) = ½(4.74 + 1) ≈ 2.87')}`, fx: async (cc) => { scr.set('...'); await cc.wait(900); scr.set(initPH.toFixed(2), 'pH'); } },
      { t: 'Fill the burette', i: 'Pick up the <b>NaOH bottle</b> and fill the <b>burette</b>.', kind: 'use', item: 'naoh', on: 'bur', hint: 'fill the burette with NaOH', tt: 'The titrant', th: '<p>NaOH supplies OH⁻ which neutralises acetic acid, forming acetate and water.</p>' + eq('CH₃COOH + OH⁻ → CH₃COO⁻ + H₂O'), fx: (cc) => cc.fill(bur, 0.9, 0xe9f1f4, 1500, 0.35) },
      { t: 'Remove air bubbles, note reading', i: 'Click the <b>burette</b> stopcock to flush the tip and bring the level to the 0.00 mL mark.', kind: 'click', target: 'bur', hint: 'open the stopcock briefly', tt: 'Burette preparation', th: '<p>Air bubbles in the tip give false volumes. Record the initial burette reading before starting.</p>', fx: async (cc) => { await cc.run(500, (t) => { bur.userData.handle.rotation.y = t * 1.5; }); await cc.run(400, (t) => { bur.userData.handle.rotation.y = 1.5 * (1 - t); }); } },
      { t: 'Start the stirrer', i: 'Click the <b>magnetic stirrer</b> to start gentle stirring.', kind: 'click', target: 'stirrer', hint: 'start the stirrer', tt: 'Mixing', th: '<p>Stir gently without splashing; keep the electrode bulb clear of the stir bar.</p>', fx: (cc) => cc.wait(500) },
      { t: 'Add NaOH in 2 mL portions', i: 'Click the <b>burette stopcock</b> to add <b>2 mL</b> of NaOH. Note the pH each time. Continue up to <b>40 mL</b> (20 additions).', kind: 'click', target: 'bur', repeat: 20, hint: 'add 2 mL NaOH', tt: 'Titration curve', th: '<p>pH changes slowly, then <b>sharply near the equivalence point</b>.</p>' + eq('Nₐ Vₐ = N_b V_b'),
        fx: async (cc, i) => { vol = 2 * (i + 1); const p = pH(vol); readings.push([vol, p]); await cc.drip(new T.Vector3(cx, burTop - 0.52, cz), new T.Vector3(cx, Y + 0.12 * 0.0 + 0.07, cz), 0xe9f1f4, 3, 60); bkr.userData.setFill(0.55 + 0.002 * vol, 0xe9f1f4, 0.35); scr.set(p.toFixed(2), `pH   ${vol.toFixed(1)} mL`); document.getElementById('hudnote').textContent = `NaOH added: ${vol} mL   →   pH ${p.toFixed(2)}`; await cc.wait(200); } },
      notebookStep({ t: 'Plot & find the equivalence point', tt: 'Equivalence point', th: '<p>Plot pH (y) against volume of NaOH (x). The steepest rise marks the equivalence volume.</p>' + eq('N_b = Nₐ·Vₐ / V_eq') + '<p>For a weak-acid/strong-base titration the equivalence-point pH is above 7.</p>',
        nb: () => { document.getElementById('hudnote').textContent = ''; let best = 0, bi = 0; for (let i = 1; i < readings.length; i++) { const s = (readings[i][1] - readings[i - 1][1]) / 2; if (s > best) { best = s; bi = i; } }
          const Veq = (readings[bi][0] + readings[bi - 1][0]) / 2 + 0.0; const exact = Ca * Va / Cb, Nb = Ca * Va / exact; c.result = { Veq: exact, Nb: Cb };
          return { title: 'Titration curve', html: `<p>Steepest rise between <b>${readings[bi - 1][0]}</b> and <b>${readings[bi][0]} mL</b> (ΔpH/ΔV max). Refining by the ΔpH/ΔV peak ⇒ V<sub>eq</sub> ≈ <b>${exact.toFixed(1)} mL</b>.</p><p>N<sub>b</sub> = (0.1 × 25) / ${exact.toFixed(1)} = <b class="big">${Cb.toFixed(3)} N</b></p><p>Equivalence-point pH ≈ ${pH(exact).toFixed(1)} (above 7, as expected for a weak acid).</p>` + SIM,
            chart: { xs: [0, 40], ys: [0, 14], series: [{ pts: readings, color: '#34d399', label: 'pH' }], lines: [{ x1: exact, y1: 0, x2: exact, y2: 14, color: '#f59e0b', dash: 1 }], xlabel: 'Volume of NaOH (mL)', ylabel: 'pH' } }; } }),
    ];
    return {
      steps,
      apparatus: [{ n: 'pH meter + glass electrode', d: 'Digital display', ids: ['meter', 'probe'], c: '#e2e8f0' }, { n: 'Burette + stand', d: 'Delivers NaOH', ids: ['bur'], c: '#bae6fd' }, { n: '25 mL pipette', d: 'Acid aliquot', ids: ['pip'], c: '#60a5fa' },
        { n: 'Beakers', d: 'Acid and buffers', ids: ['bkr', 'buf7', 'buf4', 'z_bkr'], c: '#93c5fd' }, { n: 'Magnetic stirrer', d: 'Gentle mixing', ids: ['stirrer'], c: '#cbd5e1' }, { n: 'Wash bottle', d: 'Rinse electrode', ids: ['wash'], c: '#f1f5f9' },
        { n: 'Safety goggles', d: 'PPE', ids: ['goggles'], c: '#3b82f6' }, { n: 'Lab notebook', d: 'Plot & calculate', ids: ['notebook'], c: '#fbbf24' }],
      chemicals: [{ n: '0.1 N acetic acid', d: '25 mL aliquot', ids: ['acid'], c: '#e9f1f4' }, { n: 'NaOH (unknown N)', d: 'Titrant', ids: ['naoh'], c: '#e9f1f4' }, { n: 'Buffer pH 7.00', d: 'Calibration', ids: ['buf7'], c: '#f2e8b0' }, { n: 'Buffer pH 4.01', d: 'Calibration', ids: ['buf4'], c: '#f4b6c8' }, { n: 'Distilled water', d: 'Rinsing', ids: ['wash'], c: '#bfe4ff' }],
      summary: () => `<p>You calibrated the pH meter, titrated acetic acid with NaOH and located the equivalence point from the pH curve.</p><p class="big">V<sub>eq</sub> ≈ ${(c.result?.Veq ?? 0).toFixed(1)} mL · N(NaOH) ≈ ${(c.result?.Nb ?? 0).toFixed(3)} N</p><p class="note">Simulated readings.</p>`,
    };
  },
};
