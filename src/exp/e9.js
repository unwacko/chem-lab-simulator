import * as P from '../parts.js';
import { baseItems, ppeStep, notebookStep, f, table, eq, SIM } from './common.js';

export default {
  title: 'Electrochemical equivalent (ECE) of copper', tag: 'Electrochemistry · Faraday\'s laws', hue: 38,
  blurb: 'Electrolyse acidified copper sulphate with copper electrodes, weigh the deposit and calculate z = W / (I × t).',
  build(c) {
    const Y = c.Y, T = c.T; baseItems(c);
    const cx = 0.0, cz = -0.2;
    const cell = c.add('cell', P.beaker(0.052, 0.12, '250 mL', ['Cu voltameter', 'CuSO₄ + H₂SO₄']), cx, Y, cz, { label: 'Copper voltameter (cell)' });
    c.zone('z_ano', cx - 0.027, Y + 0.012, cz, 0.04, 0.09, 0.03, 'Anode here'); c.zone('z_cath', cx + 0.027, Y + 0.012, cz, 0.04, 0.09, 0.03, 'Cathode here');
    const ano = c.add('ano', P.metalPlate(0xc2693a, 0.04, 0.09, 0.0015), -0.2, Y, 0.02, { label: 'Copper anode (+)' }); const cat = c.add('cath', P.metalPlate(0xa8744a, 0.04, 0.09, 0.0015), -0.1, Y, 0.02, { label: 'Copper cathode (−)' });
    cat.userData.metal.roughness = 0.7; ano.userData.metal.roughness = 0.35;
    const psu = c.add('psu', P.psu(), -0.62, Y, -0.34, { label: 'DC power supply' }); const ps = psu.userData.screen.userData;
    const amm = c.add('amm', P.ammeter(), -0.36, Y, -0.34, { label: 'Ammeter' }); const as = amm.userData.screen.userData;
    const rh = c.add('rheo', P.rheostat(), 0.4, Y, -0.34, { label: 'Rheostat' });
    const bal = c.deco(P.balance(), 0.72, Y, -0.08); const bs = bal.userData.screen.userData; c.zone('z_pan', 0.72, Y + 0.066, -0.1, 0.06, 0.09, 0.04, 'Place on pan');
    c.add('cuso4', P.bottle({ h: 0.19, r: 0.036, liquid: 0x3b8fd9, text: ['CuSO₄ 15 %', '+ 5 % H₂SO₄'], fill: 0.8, accent: '#d97706' }), 0.2, Y, -0.45, { label: '15 % CuSO₄ + 5 % H₂SO₄' });
    c.add('sand', P.sandpaper(), -0.35, Y, 0.0, { label: 'Sandpaper' });
    c.add('dw', P.bottle({ h: 0.2, r: 0.03, glass: 'white', liquid: 0xffffff, text: ['Distilled', 'water'], kind: 'wash' }), 0.5, Y, 0.05, { label: 'Distilled water (wash bottle)' });
    const sw = c.add('sw', P.stopwatch(), 0.1, Y, 0.06, { label: 'Stopwatch' }); const ss = sw.userData.screen.userData;
    c.deco(P.box(0.12, 0.012, 0.1, P.mat(0xf2f2f0, 1), 0, 0, 0), 0.28, Y, 0.05); c.zone('z_tray', 0.28, Y + 0.012, 0.05, 0.08, 0.1, 0.05, 'Tissue / drying');
    c.deco(P.beaker(0.05, 0.09, '250 mL', ['Cu waste']), 0.95, Y, -0.4);
    const I = 0.5, tsec = 2700, W1 = 14.215, W = 0.441, W2 = +(W1 + W).toFixed(3), z = W / (I * tsec);
    const pt = (x, y, zz) => new T.Vector3(x, y, zz);
    const wires = { ano: [pt(cx - 0.027, Y + 0.095, cz), pt(-0.3, Y + 0.28, cz - 0.1), pt(-0.545, Y + 0.035, -0.225)], cath: [pt(cx + 0.027, Y + 0.095, cz), pt(-0.15, Y + 0.25, cz - 0.1), pt(-0.36, Y + 0.05, -0.285)],
      amm: [pt(-0.31, Y + 0.05, -0.285), pt(0.0, Y + 0.3, -0.42), pt(0.34, Y + 0.07, -0.34)], rheo: [pt(0.46, Y + 0.07, -0.34), pt(0.0, Y + 0.22, -0.5), pt(-0.515, Y + 0.035, -0.225)] };
    const wcol = { ano: 0xdc2626, cath: 0x111111, amm: 0x2563eb, rheo: 0x111111 };
    let on = false;
    const setI = (v) => as.set(v.toFixed(2) + ' A');

    const steps = [
      ppeStep('Acidified copper sulphate is hazardous to skin and the environment. Avoid contact; collect copper-containing waste as instructed and never pour it into a sink.'),
      { t: 'Clean the cathode', i: 'Pick up the <b>sandpaper</b> and clean the copper <b>cathode</b> plate.', kind: 'use', item: 'sand', on: 'cath', hint: 'sand the cathode', tt: 'Clean surface', th: '<p>A clean cathode gives an adherent, even deposit. Hold the plate by its upper edge so fingerprints do not contaminate the deposition surface.</p>', fx: async (cc) => { await cc.wiggle('sand', 900, 0.012, 'x', 6); cat.userData.metal.color.set(0xd8794a); cat.userData.metal.roughness = 0.3; } },
      { t: 'Weigh the cathode (W₁)', i: 'Pick up the cathode and place it on the <b>balance pan</b> to record its initial mass <b>W₁</b>.', kind: 'move', item: 'cath', to: 'z_pan', hint: 'weigh the cathode', tt: 'Initial mass', th: '<p>The initial mass W₁ is needed to find the mass of copper deposited:</p>' + eq('W = W₂ − W₁'), fx: async (cc) => { await cc.wait(300); bs.set(W1.toFixed(3) + ' g'); await cc.wait(800); } },
      { t: 'Pour the electrolyte', i: 'Pick up the <b>copper sulphate bottle</b> and fill the <b>voltameter</b> with 15 % CuSO₄ + 5 % H₂SO₄.', kind: 'use', item: 'cuso4', on: 'cell', hint: 'fill the voltameter', tt: 'Electrolyte', th: '<p>The electrolyte conducts by ions. Sulphuric acid improves conductivity and prevents hydrolysis, giving a smooth deposit.</p>', fx: (cc) => cc.fill(cell, 0.62, 0x3b8fd9, 1400, 0.6) },
      { t: 'Insert the anode', i: 'Pick up the <b>anode</b> plate and lower it into the cell (left side).', kind: 'move', item: 'ano', to: 'z_ano', hint: 'put the anode in the cell', tt: 'Anode (+)', th: '<p>At the anode copper dissolves:</p>' + eq('Cu → Cu²⁺ + 2e⁻') },
      { t: 'Insert the cathode', i: 'Pick up the <b>cathode</b> from the balance and lower it into the cell (right side). The plates must not touch.', kind: 'move', item: 'cath', to: 'z_cath', hint: 'put the cathode in the cell', tt: 'Cathode (−)', th: '<p>At the cathode copper deposits:</p>' + eq('Cu²⁺ + 2e⁻ → Cu(s)') + '<p>Deposited copper is reddish-brown.</p>' },
      { t: 'Connect the circuit', i: 'Click each component to connect the leads: <b>anode</b>, <b>cathode</b>, <b>ammeter</b>, <b>rheostat</b>.', kind: 'click', targets: ['ano', 'cath', 'amm', 'rheo'], hint: 'connect every component', tt: 'Series circuit', th: '<p>Power supply (+) → anode → electrolyte → cathode → ammeter → rheostat → supply (−). The <b>cathode is the negative electrode</b>.</p>',
        fx: async (cc, i, id) => { const w = P.wire(wires[id], wcol[id]); w.scale.setScalar(0.001); c.stage.add(w); w.castShadow = true; await cc.run(500, (t) => w.scale.setScalar(Math.max(0.001, t))); } },
      { t: 'Switch on and start timing', i: 'Click the <b>power supply</b> to start the current and the stopwatch together.', kind: 'click', target: 'psu', hint: 'switch on the power supply', tt: 'Start', th: '<p>Start the current and the stopwatch <b>simultaneously</b>.</p>', fx: async (cc) => { on = true; ps.set('6.0 V', 'ON'); setI(0.3); ss.set('00:00.0'); await cc.wait(600); } },
      { t: 'Set the current', i: '<b>Hold LMB</b> on the <b>rheostat</b> to slide the contact until the ammeter reads <b>0.50 A</b>.', kind: 'hold', target: 'rheo', secs: 2, hint: 'hold on the rheostat', tick: (cc, p) => { setI(0.3 + 0.2 * p); rh.userData.knob.position.x = -0.06 + 0.1 * p; }, tt: 'Steady current', th: '<p>Adjust the rheostat so the current stays <b>steady</b>; record the ammeter reading I.</p>' + eq('I = 0.50 A') },
      { t: 'Pass the current (45 min)', i: '<b>Hold LMB</b> on the <b>stopwatch</b> to let the current flow for about 45 minutes (time-lapse). Watch the cathode.', kind: 'hold', target: 'sw', secs: 5, hint: 'hold on the stopwatch',
        tick: (cc, p) => { const s = p * tsec; ss.set(`${String(Math.floor(s / 60)).padStart(2, '0')}:${String(Math.floor(s % 60)).padStart(2, '0')}.0`); cat.userData.metal.color.set(new T.Color(0xd8794a).lerp(new T.Color(0x9a4a22), p)); cat.userData.metal.roughness = 0.3 + 0.45 * p; cat.scale.set(1 + 0.02 * p, 1, 1 + 0.9 * p); ano.userData.metal.color.set(new T.Color(0xc2693a).lerp(new T.Color(0x7d4a2e), p * 0.6)); cell.userData.setFill(0.62, 0x3b8fd9, 0.6); },
        tt: 'Faraday\'s first law', th: '<p>Mass deposited is proportional to the quantity of charge passed:</p>' + eq('W = z · I · t') + '<p>z is the <b>electrochemical equivalent</b> (g per coulomb).</p>' },
      { t: 'Switch off', i: 'Click the <b>power supply</b> to stop the current. Note the elapsed time <b>t = 2700 s</b>.', kind: 'click', target: 'psu', hint: 'switch off the supply', tt: 'Stop', th: '<p>Switch off, record the elapsed time t in seconds.</p>', fx: async (cc) => { on = false; ps.set('OFF'); setI(0); ss.set('45:00.0', '= 2700 s'); await cc.wait(500); } },
      { t: 'Remove the cathode', i: 'Lift the <b>cathode</b> out and place it on the tissue.', kind: 'move', item: 'cath', to: 'z_tray', hint: 'take the cathode out', tt: 'Handle carefully', th: '<p>Remove the cathode gently — the deposit is fragile until washed and dried.</p>' },
      { t: 'Wash with distilled water', i: 'Pick up the <b>wash bottle</b> and rinse the cathode immediately.', kind: 'use', item: 'dw', on: 'cath', hint: 'rinse the cathode', tt: 'Washing', th: '<p>Wash immediately with distilled water to remove electrolyte, then dry completely.</p>', fx: (cc) => cc.wait(1200) },
      { t: 'Dry the cathode', i: 'Click the <b>cathode</b> to pat it dry on the tissue.', kind: 'click', target: 'cath', hint: 'dry the cathode', tt: 'Dry completely', th: '<p>Moisture would add to the mass. Dry fully before weighing.</p>', fx: (cc) => cc.wiggle('cath', 800, 0.012, 'x', 4) },
      { t: 'Weigh again (W₂)', i: 'Place the dry cathode on the <b>balance pan</b> to get <b>W₂</b>.', kind: 'move', item: 'cath', to: 'z_pan', hint: 'reweigh the cathode', tt: 'Final mass', th: '<p>The increase in mass W = W₂ − W₁ is the copper deposited.</p>', fx: async (cc) => { await cc.wait(300); bs.set(W2.toFixed(3) + ' g'); await cc.wait(800); } },
      notebookStep({ t: 'Calculate z', tt: 'Electrochemical equivalent', th: '<p>' + 'Calculate z in g/C and compare with the reference value (≈ 0.0003281 g/C for copper).' + '</p>' + eq('z = W / (I × t)'),
        nb: () => { c.result = { z, W }; return { title: 'ECE of copper', html: table(['Quantity', 'Value'], [['W₁ (initial mass)', W1.toFixed(3) + ' g'], ['W₂ (final mass)', W2.toFixed(3) + ' g'], ['W = W₂ − W₁', W.toFixed(3) + ' g'], ['Current I', I.toFixed(2) + ' A'], ['Time t', tsec + ' s']]) +
          `<p>z = ${W.toFixed(3)} / (${I.toFixed(2)} × ${tsec}) = <b class="big">${z.toExponential(4)} g/C</b></p><p>Reference value ≈ 3.281 × 10⁻⁴ g/C — deviation ${(Math.abs(z - 0.0003281) / 0.0003281 * 100).toFixed(1)} %.</p>` + SIM }; } }),
    ];
    return {
      steps,
      apparatus: [{ n: 'Copper voltameter', d: 'Cell with electrolyte', ids: ['cell'], c: '#93c5fd' }, { n: 'Copper plates ×2', d: 'Anode & cathode', ids: ['ano', 'cath', 'z_ano', 'z_cath'], c: '#c2693a' }, { n: 'DC power supply', d: 'Current source', ids: ['psu'], c: '#475569' }, { n: 'Ammeter', d: 'Reads I', ids: ['amm'], c: '#e2e8f0' },
        { n: 'Rheostat', d: 'Keeps current steady', ids: ['rheo'], c: '#c4a27a' }, { n: 'Stopwatch', d: 'Time t', ids: ['sw'], c: '#f1f5f9' }, { n: 'Balance', d: 'W₁ and W₂', ids: ['z_pan'], c: '#e2e8f0' }, { n: 'Safety goggles', d: 'PPE', ids: ['goggles'], c: '#3b82f6' }, { n: 'Lab notebook', d: 'z calculation', ids: ['notebook'], c: '#fbbf24' }],
      chemicals: [{ n: 'CuSO₄ 15 % + H₂SO₄ 5 %', d: 'Electrolyte', ids: ['cuso4'], c: '#3b8fd9' }, { n: 'Distilled water', d: 'Washing', ids: ['dw'], c: '#bfe4ff' }],
      summary: () => `<p>You deposited copper on a weighed cathode and calculated its electrochemical equivalent.</p><p class="big">z ≈ ${(c.result?.z ?? 0).toExponential(3)} g/C</p><p class="note">Reference ≈ 3.281 × 10⁻⁴ g/C. Simulated measurements.</p>`,
    };
  },
};
