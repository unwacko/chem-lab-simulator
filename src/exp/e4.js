import * as P from '../parts.js';
import { baseItems, ppeStep, notebookStep, f, table, eq, SIM } from './common.js';

export default {
  title: 'Effect of environmental conditions on metal corrosion', tag: 'Electrochemistry · Corrosion', hue: 28,
  blurb: 'Expose cleaned metal plates to 1 N, 2 N and 4 N sulphuric acid and compare surface change and mass loss.',
  build(c) {
    const Y = c.Y, T = c.T; baseItems(c);
    const bal = c.deco(P.balance(), -0.8, Y, -0.1); const pan = new T.Vector3(-0.8, Y + 0.068, -0.12);
    const N = [1, 2, 4], bx = [-0.12, 0.1, 0.32];
    const scr = bal.userData.screen.userData;
    const beak = N.map((n, i) => c.add('b' + n, P.beaker(0.032, 0.08, '50 mL', [`${n} N`, 'H₂SO₄']), bx[i], Y, -0.1, { label: `50 mL beaker — ${n} N` }));
    N.forEach((n, i) => c.zone('z' + n, bx[i], Y + 0.012, -0.1, 0.04, 0.07, 0.04, 'Lower plate here'));
    const dull = 0x7e858c;
    const plates = N.map((n, i) => { const p = P.metalPlate(dull, 0.0205, 0.06, 0.0015); p.userData.metal.roughness = 0.8; return c.add('p' + n, p, -0.5 + i * 0.1, Y, 0.0, { label: `Zinc plate (${n} N)` }); });
    const mass0 = { 1: 8.762, 2: 8.791, 4: 8.775 }, loss = { 1: 0.085, 2: 0.192, 4: 0.413 };
    c.add('sand', P.sandpaper(), -0.62, Y, -0.35, { label: 'Sandpaper' });
    c.deco(P.beaker(0.035, 0.09, '100 mL'), 0.55, Y, -0.35); const tg = c.add('tongs', P.tongs(), 0.55, Y + 0.005, -0.35, { label: 'Tongs' });
    N.forEach((n, i) => c.add('a' + n, P.bottle({ h: 0.17, r: 0.03, glass: 'amber', liquid: 0xe9f1f4, text: ['H₂SO₄', `${n} N`], fill: 0.8, accent: '#dc2626' }), -0.2 + i * 0.17, Y, -0.4, { label: `Sulphuric acid ${n} N` }));
    c.add('dw', P.bottle({ h: 0.2, r: 0.03, glass: 'white', liquid: 0xffffff, text: ['Distilled', 'water'], kind: 'wash' }), 0.78, Y, -0.1, { label: 'Distilled water (wash bottle)' });
    c.add('timer', P.stopwatch(), 0.45, Y, 0.02, { label: 'Timer' });
    c.deco(P.cylinderGrad('50 mL', 0.2), 0.85, Y, -0.35);
    c.deco(P.box(0.3, 0.012, 0.16, P.mat(0xf5f5f0, 1), 0, 0, 0), 0.82, Y, 0.0);
    c.zone('z_tray', 0.82, Y + 0.012, 0.0, 0.2, 0.08, 0.12, 'Tray');
    const tr = [new T.Vector3(0.72, Y + 0.02, 0.0), new T.Vector3(0.82, Y + 0.02, 0.0), new T.Vector3(0.92, Y + 0.02, 0.0)];
    const tsc = c.get('timer').userData.screen.userData; const emit = {};
    const lossF = (n, p) => loss[n] * p;

    const steps = [
      ppeStep('Sulphuric acid is corrosive. Use tongs, goggles and gloves; always add acid to water when diluting; dispose of waste as instructed.'),
      { t: 'Clean the plates', i: 'Pick up the <b>sandpaper</b> and rub each of the three <b>plates</b> to remove oxide and corrosion.', kind: 'use', item: 'sand', on: ['p1', 'p2', 'p4'], hint: 'sand every plate',
        tt: 'Surface preparation', th: '<p>Cleaning gives each plate a comparable, bare metal surface. Handle plates by the edges so fingerprints do not alter the surface.</p>',
        fx: async (cc, i, id) => { await cc.wiggle('sand', 900, 0.012, 'x', 6); const m = plates[i].userData.metal; m.color.set(0xdde2e6); m.roughness = 0.22; } },
      { t: 'Weigh each plate', i: 'Click each <b>plate</b> in turn to weigh it on the balance and note its initial mass.', kind: 'click', targets: ['p1', 'p2', 'p4'], hint: 'weigh every plate',
        tt: 'Initial mass', th: '<p>The initial mass W₁ lets mass change (loss) be calculated after exposure.</p>' + eq('Δm = W₁ − W₂'),
        fx: async (cc, i, id) => { scr.set('...'); await cc.visit(id, pan, 600, 800); scr.set(mass0[N[i]].toFixed(3) + ' g'); await cc.wait(900); } },
      ...N.map((n, i) => ({ t: `Fill the ${n} N beaker`, i: `Pick up the <b>${n} N H₂SO₄</b> and pour <b>30 mL</b> into the beaker labelled <b>${n} N</b>.`, kind: 'use', item: 'a' + n, on: 'b' + n, hint: `pour ${n} N acid into the ${n} N beaker`,
        tt: 'Acid concentration', th: i === 0 ? '<p>Changing the acid concentration tests how the environment affects the corrosion rate.</p><p class="warn">When diluting, always add acid to water — never the reverse.</p>' : `<p>${n} N H₂SO₄ contains ${n} gram-equivalents of H⁺ per litre — a higher H⁺ concentration drives the corrosion reaction faster.</p>`,
        fx: (cc) => cc.fill(beak[i], 0.62, 0xd2ebf5, 1200, 0.6) })),
      ...N.map((n, i) => ({ t: `Expose plate — ${n} N`, i: `Pick up the <b>plate</b> (${n} N) and lower it into its beaker.`, kind: 'move', item: 'p' + n, to: 'z' + n, hint: `lower plate ${n} N into its ${n} N beaker`,
        tt: 'Exposure', th: '<p>Acid removes the protective oxide layer and attacks the metal. For zinc:</p>' + eq('Zn + H₂SO₄ → ZnSO₄ + H₂↑') + '<p>Keep all conditions identical except the acid concentration.</p>',
        fx: (cc) => { emit[n] = cc.bubbles(beak[i], 0, { r: 0.012, y0: 0.015, top: 0.05 }); emit[n].set(2 + n * 2); } })),
      { t: 'Time the exposure', i: '<b>Hold LMB</b> on the <b>timer</b> to fast-forward the 30-minute exposure (time-lapse). Watch the bubbles.', kind: 'hold', target: 'timer', secs: 5, hint: 'hold on the timer',
        tick: (cc, p) => { const s = p * 1800; tsc.set(`${String(Math.floor(s / 60)).padStart(2, '0')}:${String(Math.floor(s % 60)).padStart(2, '0')}`, 'EXPOSURE'); N.forEach((n, i) => { const m = plates[i].userData.metal; m.color.set(new T.Color(0xdde2e6).lerp(new T.Color(0x5b6168), Math.min(1, p * (0.4 + 0.2 * n)))); m.roughness = 0.22 + 0.5 * p; plates[i].scale.set(1, 1 - 0.02 * n * p, 1 - 0.1 * p); emit[n]?.set(p > 0.02 ? 2 + n * 4 : 0); }); },
        tt: 'Rate of corrosion', th: '<p>Corrosion rate depends on metal type, acid concentration, time and surface condition. Do <b>not</b> assume the strongest acid always gives a particular result — compare what you actually observe.</p>' },
      { t: 'Remove the plates', i: 'Pick up the <b>tongs</b> and lift each plate out of its beaker.', kind: 'use', item: 'tongs', on: ['p1', 'p2', 'p4'], hint: 'lift every plate out with tongs',
        tt: 'Safe handling', th: '<p>Use tongs — never fingers — to remove plates from acid. Place them on a clean tray for rinsing.</p>',
        fx: async (cc, i, id) => { emit[N[i]]?.stop(); await cc.moveTo(id, tr[i], 500); } },
      { t: 'Rinse with water', i: 'Pick up the <b>distilled-water wash bottle</b> and rinse each plate thoroughly.', kind: 'use', item: 'dw', on: ['p1', 'p2', 'p4'], hint: 'rinse every plate',
        tt: 'Stopping the reaction', th: '<p>Rinsing removes residual acid so corrosion stops, and washes away loose deposits before drying and weighing.</p>', fx: (cc) => cc.wait(900) },
      { t: 'Dry and reweigh', i: 'Click each <b>plate</b> to dry it and reweigh it on the balance.', kind: 'click', targets: ['p1', 'p2', 'p4'], hint: 'reweigh every plate',
        tt: 'Mass change', th: '<p>Dry completely, then reweigh. The loss of mass shows how much metal dissolved.</p>' + eq('Δm = W₁ − W₂'),
        fx: async (cc, i, id) => { const n = N[i]; scr.set('...'); await cc.visit(id, pan, 600, 700); scr.set((mass0[n] - loss[n]).toFixed(3) + ' g'); await cc.wait(900); } },
      notebookStep({ t: 'Compare the results', tt: 'Observation table', th: '<p>Record visual appearance (dulling, roughness, deposits) and any mass change for each concentration, then compare the three conditions.</p>',
        nb: () => ({ title: 'Corrosion observations (zinc plates, 30 min)', html: table(['Acid', 'W₁ (g)', 'W₂ (g)', 'Δm (mg)', 'Appearance'], N.map((n) => [`${n} N`, mass0[n].toFixed(3), (mass0[n] - loss[n]).toFixed(3), (loss[n] * 1000).toFixed(0), ['dull, light etching', 'pitted, grey', 'rough, heavily pitted'][N.indexOf(n)]])) +
          `<p>For this simulated zinc exposure, mass loss rises with acid concentration. For mild steel, or for different exposure times, the trend can differ — always compare your own measurements.</p>` + SIM,
          chart: { xs: [0, 5], ys: [0, 500], series: [{ pts: N.map((n) => [n, loss[n] * 1000]), color: '#fb923c', label: 'Mass loss' }], xlabel: 'Acid concentration (N)', ylabel: 'Mass loss (mg)' } }) }),
    ];
    return {
      steps,
      apparatus: [{ n: 'Beakers 50 mL ×3', d: '1 N, 2 N, 4 N', ids: ['b1', 'b2', 'b4'], c: '#93c5fd' }, { n: 'Metal plates ×3', d: '≈ 6 × 2.05 cm', ids: ['p1', 'p2', 'p4'], c: '#cbd5e1' }, { n: 'Sandpaper', d: 'Remove oxide', ids: ['sand'], c: '#d6a45a' },
        { n: 'Analytical balance', d: 'Mass before/after', ids: ['z1'], c: '#e2e8f0' }, { n: 'Tongs', d: 'Handle plates', ids: ['tongs'], c: '#94a3b8' }, { n: 'Timer', d: 'Exposure time', ids: ['timer'], c: '#f1f5f9' },
        { n: 'Measuring cylinder', d: '30 mL volumes', ids: [], c: '#bae6fd' }, { n: 'Safety goggles', d: 'PPE', ids: ['goggles'], c: '#3b82f6' }, { n: 'Lab notebook', d: 'Observation table', ids: ['notebook'], c: '#fbbf24' }],
      chemicals: [{ n: 'H₂SO₄ 1 N', d: 'Corrosive', ids: ['a1'], c: '#e9f1f4' }, { n: 'H₂SO₄ 2 N', d: 'Corrosive', ids: ['a2'], c: '#e9f1f4' }, { n: 'H₂SO₄ 4 N', d: 'Corrosive', ids: ['a4'], c: '#e9f1f4' }, { n: 'Distilled water', d: 'Rinsing', ids: ['dw'], c: '#bfe4ff' }],
      summary: () => `<p>You exposed three cleaned plates to 1 N, 2 N and 4 N sulphuric acid for the same time and compared appearance and mass change.</p>${eq('Zn + H₂SO₄ → ZnSO₄ + H₂↑')}<p class="note">Corrosion is shown by surface change and/or loss of mass. Simulated numbers.</p>`,
    };
  },
};
