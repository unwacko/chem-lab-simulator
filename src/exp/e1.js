import * as P from '../parts.js';
import { baseItems, ppeStep, notebookStep, fmtT, f, rng, lsq, table, eq, SIM } from './common.js';

export default {
  title: "Molecular weight of a polymer — Ostwald's viscometer", tag: 'Physical chemistry · Polymers', hue: 188,
  blurb: 'Prepare a dilution series, time the flow through a capillary viscometer and estimate intrinsic viscosity and molecular weight.',
  build(c) {
    const Y = c.Y, z = -0.05; baseItems(c);
    const conc = [0.5, 0.4, 0.3, 0.2, 0.1], ids = conc.map((_, i) => 'f' + (i + 1));
    // stand + clamp
    c.deco(P.standRod(0.75), -0.45, Y, -0.28); c.deco(P.clamp(0.07), -0.52, Y + 0.33, -0.28);
    c.zone('z_clamp', -0.48, Y + 0.17, -0.28, 0.12, 0.23, 0.05, 'Clamp here');
    const visc = c.add('visc', P.viscometer(), -0.85, Y, z, { label: "Ostwald viscometer" });
    c.add('rubber', P.rubberBulb(), -0.68, Y, z + 0.04, { label: 'Rubber tube & bulb' });
    c.zone('z_arm', -0.51, Y + 0.38, -0.28, 0.05, 0.05, 0.05, 'Attach to narrow arm');
    const sw = c.add('sw', P.stopwatch(), -0.2, Y, 0.0, { label: 'Stopwatch' });
    const fl = ids.map((id, i) => c.add(id, P.volFlask(`${conc[i]} %`), 0.0 + i * 0.115, Y, -0.12, { label: `50 mL flask — ${conc[i]} %` }));
    const stock = c.add('stock', P.bottle({ h: 0.17, r: 0.034, glass: 'clear', liquid: 0xe9dfa4, text: ['Polymer', '1 % stock'], fill: 0.8 }), 0.64, Y, -0.06, { label: '1 % polymer stock' });
    const solv = c.add('solvent', P.bottle({ h: 0.2, r: 0.034, glass: 'clear', liquid: 0xcfeaff, text: ['Distilled', 'water'], fill: 0.8, kind: 'reagent' }), 0.76, Y, -0.06, { label: 'Pure solvent (distilled water)' });
    const pip = c.add('pip', P.pipette(), 0.87, Y, 0.0, { label: 'Pipette + filler' });
    c.add('waste', P.beaker(0.045, 0.1, '250 mL', ['Waste']), 0.95, Y, -0.35, { label: 'Waste beaker' });
    c.setFill(c.get('waste'), 0.0, 0xcfeaff);
    const diluted = (C) => { const k = C / 1.0; return new c.T.Color(0xcfeaff).lerp(new c.T.Color(0xe9dfa4), Math.min(1, k * 1.3 + 0.08)).getHex(); };
    // simulated data
    const N = rng(11), t0s = [98.4, 98.9, 98.1], t0 = t0s.reduce((a, b) => a + b) / 3;
    const tm = conc.map((C) => { const base = t0 * (1 + C * (1.5 + 0.7875 * C)); return [0, 1, 2].map((k) => base + N() * 1.2 + (k - 1) * 0.1); });
    const mean = tm.map((a) => a.reduce((x, y) => x + y) / 3);
    const showT = (s) => sw.userData.screen.userData.set(fmtT(s));
    const flowTick = (T) => (cc, p) => { visc.userData.setLevels(0.8 * p, 1 - p); showT(p * T); };
    const flow = (T, n, after) => ({
      kind: 'hold', target: 'visc', secs: 2.2, repeat: n, tick: flowTick(T), hint: 'hold on the viscometer',
      fx: async (cc, i) => { showT(T); await cc.wait(500); if (i < n - 1) { visc.userData.setLevels(0, 1); showT(0); await cc.wait(300); } after?.(i); },
    });

    const steps = [
      ppeStep('Keep the viscometer vertical and at constant temperature. Never pipette by mouth — use a pipette filler.'),
      { t: 'Clamp the viscometer', i: 'Pick up the <b>Ostwald viscometer</b> and place it on the highlighted spot of the <b>iron stand clamp</b>.', kind: 'move', item: 'visc', to: 'z_clamp', hint: 'clamp the viscometer on the stand',
        tt: 'Why vertical?', th: '<p>The viscometer is a U-shaped glass tube with a bulb and a fine capillary. It must be <b>clean, dry and perfectly vertical</b>.</p><p>A tilted or dirty capillary changes the driving head and wall friction, causing errors in flow time.</p>',
        fx: (cc) => cc.wait(200) },
      { t: 'Attach the rubber tube', i: 'Pick up the <b>rubber tube & bulb</b> and fit it on the narrow arm of the viscometer.', kind: 'move', item: 'rubber', to: 'z_arm', hint: 'fit the rubber tube to the narrow arm',
        tt: 'Suction', th: '<p>The rubber bulb lets you draw liquid up past the upper timing mark without any mouth suction.</p>' },
      { t: 'Prepare the dilution series — polymer', i: 'Pick up the <b>1 % polymer stock</b> and pour into each flask in turn: <b>25, 20, 15, 10 and 5 mL</b> (flasks 0.5 % → 0.1 %).', kind: 'use', item: 'stock', on: ids, hint: 'pour stock solution into each flask',
        tt: 'Dilution: C₁V₁ = C₂V₂', th: `<p>A concentration series lets viscosity be compared against concentration.</p>${eq('V(stock) = C × 50 mL / 1 %')}<p>e.g. 0.5 % in 50 mL needs 25 mL of stock.</p>`,
        fx: async (cc, i, id) => { await cc.fill(c.get(id), [0.5, 0.42, 0.33, 0.24, 0.14][i], 0xe9dfa4, 900); } },
      { t: 'Make up to the mark', i: 'Pick up the <b>pure solvent</b> and top each flask up to its <b>50 mL mark</b>.', kind: 'use', item: 'solvent', on: ids, hint: 'top up every flask with solvent',
        tt: 'Pure solvent', th: '<p>The solvent is the reference liquid: its flow time t₀ is the baseline for relative viscosity.</p>',
        fx: async (cc, i, id) => { await cc.fill(c.get(id), 1, diluted(conc[i]), 900); } },
      { t: 'Mix until uniform', i: 'Click each flask to swirl and mix it.', kind: 'click', targets: ids, hint: 'mix every flask',
        tt: 'Homogeneous solution', th: '<p>Mix each flask until visually uniform — concentration must be the same throughout before any flow-time measurement.</p>',
        fx: async (cc, i, id) => { await cc.wiggle(id, 700, 0.012, 'x', 4); } },
      { t: 'Load the solvent', i: 'Pick up the <b>pipette</b> and put the specified volume of <b>pure solvent</b> into the viscometer.', kind: 'use', item: 'pip', on: 'visc', hint: 'pipette solvent into the viscometer',
        tt: 'Measuring volume', th: '<p>The same volume must be used each time so the hydrostatic head is constant.</p><p class="warn">Use the pipette filler — never mouth pipetting.</p>',
        fx: async (cc) => { await cc.run(900, (t) => visc.userData.setLevels(0.8 * t, 0, 0xcfeaff)); } },
      { t: 'Draw liquid above the upper mark', i: '<b>Hold LMB</b> on the <b>rubber bulb</b> to squeeze and draw the liquid above the upper timing mark.', kind: 'hold', target: 'rubber', secs: 1.8, hint: 'hold on the rubber bulb',
        tick: (cc, p) => visc.userData.setLevels(0.8 * (1 - p), p),
        tt: 'Capillary flow', th: '<p>Flow time through a capillary under gravity is proportional to viscosity and inversely to density (Poiseuille):</p>' + eq('η₁/η₂ = (ρ₁t₁)/(ρ₂t₂)') },
      { t: 'Time the pure solvent (×3)', i: '<b>Hold LMB</b> on the <b>viscometer</b> to let the liquid flow freely. The stopwatch runs from the upper to the lower mark. Repeat <b>3 times</b>.', kind: 'hold', ...flow(t0, 3, null),
        tt: 'Flow time t₀', th: `<p>Start the stopwatch as the meniscus crosses the upper mark; stop at the lower mark. Repeat three times and average to get t₀.</p>${eq('t₀ = mean of 3 runs')}` },
      { t: 'Record t₀', i: 'Click the <b>stopwatch</b> to store the mean solvent flow time.', kind: 'click', target: 'sw', hint: 'record the stopwatch value',
        tt: 'Mean t₀', th: `<p>Your three runs were ${t0s.map((x) => x.toFixed(1)).join(', ')} s.</p>${eq('t₀ = ' + t0.toFixed(1) + ' s')}`, fx: async () => { showT(t0); await c.wait(500); } },
      { t: 'Load the 0.5 % solution', i: 'Rinse is done — pour <b>25 mL of the 0.5 % solution</b> (flask 1) into the viscometer.', kind: 'use', item: 'f1', on: 'visc', hint: 'pour flask 1 into the viscometer',
        tt: 'Solution flow time', th: '<p>Polymer chains hinder flow, so solution flow time <b>t</b> is longer than t₀ and generally rises with concentration.</p>',
        fx: async (cc) => { visc.userData.setLevels(0, 0, diluted(0.5)); await cc.run(900, (t) => visc.userData.setLevels(0.8 * t, 0, diluted(0.5))); await cc.run(900, (t) => visc.userData.setLevels(0.8 * (1 - t), t)); } },
      { t: 'Time the 0.5 % solution (×3)', i: '<b>Hold LMB</b> on the viscometer — repeat <b>3 times</b>.', kind: 'hold', ...flow(mean[0], 3, null), tt: 'Flow time t', th: '<p>Same procedure as the solvent. Use clean apparatus and a mean of three readings.</p>' },
      { t: 'Remaining concentrations', i: 'Click flasks <b>0.4, 0.3, 0.2, 0.1 %</b>: each is loaded and timed automatically (3 runs each).', kind: 'click', targets: ids.slice(1), hint: 'click the remaining flasks',
        tt: 'Concentration series', th: '<p>Rinse the viscometer with a little of the next solution before loading. Work from the dilute to the concentrated end if possible.</p>',
        fx: async (cc, i, id) => { const T = mean[i + 1]; await cc.wiggle(id, 400, 0.01); await cc.run(1500, (t) => { showT(t * T); visc.userData.setLevels(0.8 * t, 1 - t, diluted(conc[i + 1])); }); await cc.wait(250); visc.userData.setLevels(0, 0); } },
      notebookStep({ t: 'Calculate viscosities', tt: 'Viscosity relations', th: `<p>Relative and specific viscosity, then reduced and inherent viscosity:</p>${eq('ηᵣ = t/t₀   ηsp = ηᵣ − 1')}${eq('ηred = ηsp/C   ηinh = ln ηᵣ / C')}<p>Extrapolating both to C → 0 gives the intrinsic viscosity [η]. Then use Mark–Houwink: ${'<b>[η] = K·Mᵃ</b>'}.</p>`,
        nb: () => {
          const rows = conc.map((C, i) => { const hr = mean[i] / t0, sp = hr - 1; return { C, t: mean[i], hr, sp, red: sp / C, inh: Math.log(hr) / C }; });
          const l1 = lsq(rows.map((r) => [r.C, r.red])), l2 = lsq(rows.map((r) => [r.C, r.inh])), eta = (l1.c + l2.c) / 2, K = 0.042, a = 0.64, M = Math.pow(eta * 100 / K, 1 / a) ;
          c.result = { eta, M };
          return { title: 'Viscosity results', html: `<p>t₀ = <b>${t0.toFixed(1)} s</b></p>` + table(['C (g/dL)', 't (s)', 'ηᵣ', 'ηsp', 'ηred', 'ηinh'], rows.map((r) => [r.C, r.t.toFixed(1), f(r.hr), f(r.sp), f(r.red), f(r.inh)])) +
            `<p>Intercept at C = 0: ηred → <b>${f(l1.c)}</b>, ηinh → <b>${f(l2.c)}</b> dL/g ⇒ [η] ≈ <b class="big">${f(eta, 2)} dL/g</b></p><p>Mark–Houwink with example constants K = 0.042 mL/g, a = 0.64: <b class="big">M ≈ ${(M / 1e5).toFixed(2)} × 10⁵ g/mol</b></p>` + SIM,
            chart: { xs: [0, 0.55], series: [{ pts: rows.map((r) => [r.C, r.red]), color: '#22d3ee', label: 'ηred' }, { pts: rows.map((r) => [r.C, r.inh]), color: '#a78bfa', label: 'ηinh' }],
              lines: [{ x1: 0, y1: l1.c, x2: 0.55, y2: l1.c + l1.m * 0.55, color: '#22d3ee', dash: 1 }, { x1: 0, y1: l2.c, x2: 0.55, y2: l2.c + l2.m * 0.55, color: '#a78bfa', dash: 1 }], xlabel: 'Concentration C (g/dL)', ylabel: 'ηred, ηinh (dL/g)' } };
        } }),
    ];
    return {
      steps,
      apparatus: [
        { n: "Ostwald viscometer", d: 'Glass U-tube, bulbs & capillary', ids: ['visc'], c: '#7dd3fc' }, { n: 'Iron stand & clamp', d: 'Holds viscometer vertical', ids: ['z_clamp'], c: '#94a3b8' },
        { n: 'Rubber tube & bulb', d: 'Draws liquid up', ids: ['rubber'], c: '#f87171' }, { n: 'Stopwatch', d: 'Flow time (s)', ids: ['sw'], c: '#e2e8f0' },
        { n: '50 mL volumetric flasks ×5', d: '0.5 – 0.1 % solutions', ids, c: '#93c5fd' }, { n: 'Pipette + filler', d: 'Measured volumes', ids: ['pip'], c: '#60a5fa' },
        { n: 'Waste beaker', d: 'Labelled container', ids: ['waste'], c: '#cbd5e1' }, { n: 'Safety goggles', d: 'PPE', ids: ['goggles'], c: '#3b82f6' }, { n: 'Lab notebook', d: 'Record & calculate', ids: ['notebook'], c: '#fbbf24' }],
      chemicals: [{ n: '1 % polymer stock', d: 'Macromolecule solution', ids: ['stock'], c: '#e9dfa4' }, { n: 'Pure solvent', d: 'Distilled water', ids: ['solvent'], c: '#bfe4ff' }],
      summary: () => `<p>You prepared a five-point dilution series, timed the flow of solvent and solutions through the Ostwald viscometer and extrapolated ηred and ηinh to zero concentration.</p><p class="big">[η] ≈ ${f(c.result?.eta ?? 0, 2)} dL/g &nbsp;·&nbsp; M ≈ ${((c.result?.M ?? 0) / 1e5).toFixed(2)} × 10⁵ g/mol</p><p class="note">Simulated example data. In the lab, report your own measured flow times and the K and a constants supplied for your polymer/solvent/temperature.</p>`,
    };
  },
};
