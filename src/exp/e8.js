import * as P from '../parts.js';
import { baseItems, ppeStep, notebookStep, f, rng, lsq, table, eq, SIM } from './common.js';

export default {
  title: 'Kinetics of acid-catalysed hydrolysis of ethyl acetate', tag: 'Physical chemistry · Kinetics', hue: 330,
  blurb: 'Follow the hydrolysis of ethyl acetate in HCl at 25 °C by titrating timed samples and find the rate constant.',
  build(c) {
    const Y = c.Y, T = c.T; baseItems(c);
    const bath = c.add('bath', P.bath(), -0.2, Y, -0.35, { label: 'Thermostat bath (25 °C)' }); const bs = bath.userData.screen.userData;
    c.zone('z_hcl', -0.3, Y + 0.03, -0.35, 0.08, 0.14, 0.08, 'In the thermostat'); c.zone('z_ea', -0.08, Y + 0.03, -0.35, 0.06, 0.12, 0.06, 'In the thermostat');
    const hbath = c.add('hot', P.bath(), 0.8, Y, -0.4, { label: 'Hot-water bath' }); hbath.scale.setScalar(0.75); hbath.userData.screen.userData.set('25°C');
    c.zone('z_hot', 0.8, Y + 0.03, -0.4, 0.08, 0.14, 0.08, 'Into the hot bath');
    const hcl = c.add('hcl', P.bottle({ h: 0.13, r: 0.034, liquid: 0xe9f1f4, text: ['0.4 N HCl', '100 mL'], fill: 0.75 }), -0.58, Y, -0.05, { label: '0.4 N HCl in stoppered bottle' });
    c.deco(P.rack(1, 0.04), -0.4, Y, 0.0);
    const eat = c.add('eat', P.testTube(0.12, 0.014), -0.4, Y + 0.008, 0.0, { label: 'Ethyl acetate (corked tube)' }); c.setFill(eat, 0.5, 0xf4f8fa, 0.6);
    const ib = c.add('ice', P.beaker(0.04, 0.07, '100 mL', ['Ice']), -0.22, Y, 0.04, { label: 'Ice pieces' }); const ig = P.ice(8); ig.position.y = 0.01; ib.add(ig);
    c.add('ph', P.bottle({ h: 0.09, r: 0.02, liquid: 0xf8d3e2, text: ['Phenol-', 'phthalein'], kind: 'dropper', fill: 0.7, accent: '#d946ef' }), -0.08, Y, 0.04, { label: 'Phenolphthalein indicator' });
    c.add('pip', P.pipette({ h: 0.3 }), 0.06, Y, 0.0, { label: '10 mL pipette' });
    const sw = c.add('sw', P.stopwatch(), 0.2, Y, 0.06, { label: 'Stopwatch' }); const ss = sw.userData.screen.userData;
    c.add('naoh', P.bottle({ h: 0.17, r: 0.032, liquid: 0xe9f1f4, text: ['0.2 N', 'NaOH'], fill: 0.8, accent: '#d97706' }), 0.55, Y, -0.05, { label: '0.2 N NaOH' });
    // burette + titration flask on stand base
    const cx = 0.47, cz = -0.36; c.deco(P.standRod(0.78), cx, Y, cz); c.deco(P.clamp(0.1), cx - 0.07, Y + 0.45, cz);
    const bur = c.add('bur', P.burette(), cx + 0.03, Y + 0.2, cz, { label: 'Burette (NaOH)' });
    const flask = c.add('flask', P.conical(0.05, 0.13, ['Titration']), cx + 0.03, Y + 0.018, cz, { label: 'Titration flask' });
    const flIce = P.ice(5); flIce.position.y = 0.012; flIce.visible = false; flask.add(flIce);
    const fl2 = c.add('fl2', P.conical(0.05, 0.13, ['Dry flask']), 0.66, Y, 0.0, { label: 'Dry flask (50 mL sample)' });
    // data
    const N = rng(21), V0 = 24.0, Vinf = 48.0, k = 0.0093, times = [10, 20, 30, 40, 50];
    const Vt = times.map((t) => +(Vinf - (Vinf - V0) * Math.exp(-k * t) + N() * 0.08).toFixed(2));
    let stage = 0; const note = (t) => (document.getElementById('hudnote').textContent = t || '');
    const titrate = async (cc, V, ms = 1600) => {
      const m0 = bur.userData.f ?? 0.9; flask.userData.setFill(0.4, 0xf4f6f8, 0.3);
      await cc.run(ms, (t) => { bur.userData.setFill(m0 - (V / 60) * t, 0xe9f1f4, 0.35); if (t > 0.95) flask.userData.setFill(0.4, 0xf29cc3, 0.55); });
      bur.userData.f = m0 - V / 60; bur.userData.setFill(bur.userData.f, 0xe9f1f4, 0.35);
    };
    const refill = (cc) => cc.fill(bur, 0.9, 0xe9f1f4, 500, 0.35);
    const showT = (min) => ss.set(`${String(Math.floor(min)).padStart(2, '0')}:${String(Math.floor((min % 1) * 60)).padStart(2, '0')}.0`);

    const steps = [
      ppeStep('Acid and NaOH are corrosive; ethyl acetate is volatile and flammable. Keep away from flames, use PPE, and handle the thermostat and hot-water bath carefully.'),
      { t: 'Thermostat the acid', i: 'Pick up the <b>HCl bottle</b> (100 mL of 0.4 N) and suspend it in the <b>25 °C thermostat</b>.', kind: 'move', item: 'hcl', to: 'z_hcl', hint: 'put the HCl bottle in the thermostat', tt: 'Constant temperature', th: '<p>Reaction rate depends strongly on temperature, so kinetic measurements are made in a <b>thermostat at 25 °C</b> to be comparable.</p>' },
      { t: 'Thermostat the ester', i: 'Place the <b>ethyl acetate tube</b> in the same thermostat.', kind: 'move', item: 'eat', to: 'z_ea', hint: 'put the ethyl acetate in the thermostat', tt: 'Pure ester', th: '<p>About 10 mL of pure ethyl acetate is brought to the same temperature before mixing.</p>' },
      { t: 'Let them equilibrate', i: '<b>Hold LMB</b> on the <b>thermostat</b> to wait until both reach 25 °C (time-lapse).', kind: 'hold', target: 'bath', secs: 2.5, hint: 'hold on the thermostat', tick: (cc, p) => bs.set(`${(22 + 3 * p).toFixed(1)}°C`), tt: 'Equilibration', th: '<p>Both liquids must be at exactly 25.0 °C before the reaction starts.</p>' },
      { t: 'Fill the burette', i: 'Pick up the <b>NaOH bottle</b> and fill the burette with <b>0.2 N NaOH</b>.', kind: 'use', item: 'naoh', on: 'bur', hint: 'fill the burette', tt: 'Titrant', th: '<p>NaOH neutralises the acids in each sample (HCl and CH₃COOH) so we can follow how much acetic acid has formed.</p>', fx: (cc) => cc.fill(bur, 0.9, 0xe9f1f4, 1400, 0.35) },
      { t: 'Ice in the titration flask', i: 'Pick up the <b>ice beaker</b> and add a few pieces of ice to the <b>titration flask</b>.', kind: 'use', item: 'ice', on: 'flask', hint: 'add ice to the titration flask', tt: 'Why ice?', th: '<p>Ice quenches the reaction: cooling the 10 mL sample makes the hydrolysis so slow that the titration result reflects the time the sample was taken.</p>', fx: async (cc) => { flIce.visible = true; await cc.wait(500); } },
      { t: 'Add the indicator', i: 'Pick up the <b>phenolphthalein</b> and add a few drops to the flask.', kind: 'use', item: 'ph', on: 'flask', pose: { type: 'pour', theta: 2.9, gap: 0.05 }, hint: 'add drops of indicator', tt: 'Phenolphthalein', th: '<p>Colourless in acid, <b>pink</b> in base — the faint persistent pink marks the end-point.</p>', fx: (cc) => cc.drip(new T.Vector3(cx + 0.03, Y + 0.2, cz), new T.Vector3(cx + 0.03, Y + 0.05, cz), 0xf5b3d0, 3, 120) },
      { t: 'Start the reaction', i: 'Pick up the <b>ethyl-acetate tube</b> and add it to the <b>acid bottle</b>. Time zero — the stopwatch starts.', kind: 'use', item: 'eat', on: 'hcl', hint: 'add the ester to the acid', tt: 'Acid-catalysed hydrolysis', th: '<p>HCl catalyses the hydrolysis of the ester:</p>' + eq('CH₃COOC₂H₅ + H₂O ⇌ CH₃COOH + C₂H₅OH') + '<p>Note the time as zero and start the stopwatch.</p>', fx: async (cc) => { await cc.fill(eat, 0, 0xf4f8fa, 900); showT(0); } },
      { t: 'Withdraw 10 mL (t = 0)', i: 'Pick up the <b>10 mL pipette</b> and withdraw <b>10 mL</b> of the reaction mixture from the bottle.', kind: 'use', item: 'pip', on: 'hcl', hint: 'draw 10 mL from the bottle', tt: 'Sampling', th: '<p>Immediately withdraw 10 mL of the mixture — this is the zero-time sample.</p>', fx: (cc) => cc.wait(800) },
      { t: 'Transfer into the ice flask', i: 'Release the sample into the <b>ice-containing flask</b>.', kind: 'use', item: 'pip', on: 'flask', hint: 'empty the pipette into the flask', tt: 'Quench', th: '<p>Cold quench stops the reaction progressing during the titration.</p>', fx: (cc) => cc.fill(flask, 0.4, 0xf4f6f8, 800, 0.3) },
      { t: 'Titrate the zero-time sample', i: '<b>Hold LMB</b> on the <b>burette</b> to run in NaOH until a faint persistent pink appears.', kind: 'hold', target: 'bur', secs: 2.5, hint: 'hold on the burette', tt: 'Initial reading V₀', th: '<p>NaOH neutralises the HCl present in the aliquot (plus any trace acid).</p>' + eq('V₀ = 24.0 mL'), fx: async (cc) => { note('V₀ = 24.0 mL'); await titrate(cc, 24, 300); await cc.wait(900); note(''); await refill(cc); flask.userData.setFill(0, 0xffffff); } },
      { t: 'Timed samples: 10 → 50 min', i: '<b>Hold LMB</b> on the <b>stopwatch</b> to jump to each sampling time (10, 20, 30, 40, 50 min). Each 10 mL aliquot is quenched on ice and titrated for you. Repeat <b>5 times</b>.', kind: 'hold', target: 'sw', secs: 1.5, repeat: 5, hint: 'hold on the stopwatch',
        tick: (cc, p, n) => showT((n ?? 0) * 10 + p * 10), tt: 'Following the reaction', th: '<p>As hydrolysis proceeds acetic acid is produced, so each titration needs <b>more NaOH</b> (Vt rises).</p>' + eq('Vt increases from V₀ → V∞'),
        fx: async (cc, i) => { showT((i + 1) * 10); flask.userData.setFill(0.4, 0xf4f6f8, 0.3); await titrate(cc, Vt[i] - 20, 500); note(`t = ${times[i]} min    Vt = ${Vt[i].toFixed(2)} mL`); await cc.wait(700); note(''); await refill(cc); flask.userData.setFill(0, 0xffffff); } },
      { t: 'Prepare the V∞ sample', i: 'Pick up the <b>acid bottle</b> and pour <b>50 mL</b> of the reaction mixture into the <b>dry flask</b>.', kind: 'use', item: 'hcl', on: 'fl2', hint: 'pour 50 mL into the dry flask', tt: 'Infinite-time reading', th: '<p>V∞ is the titre when the reaction has gone to completion; it is obtained by heating a portion of the mixture.</p>', fx: (cc) => cc.fill(fl2, 0.45, 0xe9f1f4, 900, 0.35) },
      { t: 'Heat in the water bath', i: 'Put the <b>flask</b> in the <b>hot-water bath</b>.', kind: 'move', item: 'fl2', to: 'z_hot', hint: 'put the flask in the hot bath', tt: 'Completion', th: '<p>Heating speeds the reaction so it reaches the manual\'s completion state.</p><p class="warn">Handle the hot-water bath carefully.</p>' },
      { t: 'Heat for three hours', i: '<b>Hold LMB</b> on the <b>hot bath</b> for the 3 hours (time-lapse).', kind: 'hold', target: 'hot', secs: 3, hint: 'hold on the hot bath', tick: (cc, p) => hbath.userData.screen.userData.set(`${Math.round(25 + 60 * Math.min(1, p * 2))}°C`, `${(p * 3).toFixed(1)} h`), tt: 'Why 3 hours?', th: '<p>This treatment is specified by the manual so that the reaction is complete and the reading represents V∞.</p>' },
      { t: 'Titrate for V∞', i: '<b>Hold LMB</b> on the <b>burette</b> to titrate a 10 mL portion of the heated mixture to the pink end-point.', kind: 'hold', target: 'bur', secs: 2.5, hint: 'hold on the burette', tt: 'V∞', th: '<p>' + 'This reading represents the reaction mixture after the completion treatment.' + '</p>' + eq('V∞ = 48.0 mL'), fx: async (cc) => { note('V∞ = 48.0 mL'); await titrate(cc, 28, 300); await cc.wait(1000); note(''); } },
      notebookStep({ t: 'Calculate the rate constant', tt: 'Pseudo-first-order', th: '<p>Water is in large excess, so its concentration is effectively constant.</p>' + eq('k = (2.303/t) · log[(V∞ − V₀)/(V∞ − Vt)]') + eq('slope of log(V∞ − Vt) vs t = −k/2.303'),
        nb: () => { const ks = times.map((t, i) => (2.303 / t) * Math.log10((Vinf - V0) / (Vinf - Vt[i]))), kav = ks.reduce((a, b) => a + b) / ks.length; const pts = [[0, Math.log10(Vinf - V0)], ...times.map((t, i) => [t, Math.log10(Vinf - Vt[i])])]; const l = lsq(pts), kg = -2.303 * l.m; c.result = { kav, kg };
          return { title: 'Rate constant', html: `<p>V₀ = ${V0.toFixed(1)} mL, V∞ = ${Vinf.toFixed(1)} mL</p>` + table(['t (min)', 'Vt (mL)', 'V∞ − Vt', 'k (min⁻¹)'], times.map((t, i) => [t, Vt[i].toFixed(2), (Vinf - Vt[i]).toFixed(2), ks[i].toFixed(5)])) + `<p>Average k = <b>${kav.toFixed(5)} min⁻¹</b></p><p>Graphical: slope = ${l.m.toFixed(5)} ⇒ k = −2.303 × slope = <b class="big">${kg.toFixed(5)} min⁻¹</b></p>` + SIM,
            chart: { xs: [0, 55], series: [{ pts, color: '#f472b6', label: 'log(V∞ − Vt)' }], lines: [{ x1: 0, y1: l.c, x2: 55, y2: l.c + l.m * 55, color: '#f59e0b', dash: 1 }], xlabel: 'Time (min)', ylabel: 'log(V∞ − Vt)' } }; } }),
    ];
    return {
      steps,
      apparatus: [{ n: 'Thermostat bath 25 °C', d: 'Constant temperature', ids: ['bath', 'z_hcl', 'z_ea'], c: '#7dd3fc' }, { n: 'Stoppered bottle', d: '100 mL 0.4 N HCl', ids: ['hcl'], c: '#e9f1f4' }, { n: 'Burette + stand', d: '0.2 N NaOH', ids: ['bur'], c: '#bae6fd' }, { n: '10 mL pipette', d: 'Aliquots', ids: ['pip'], c: '#60a5fa' },
        { n: 'Titration flasks', d: 'Ice + indicator', ids: ['flask', 'fl2'], c: '#93c5fd' }, { n: 'Stopwatch', d: 'Reaction time', ids: ['sw'], c: '#f1f5f9' }, { n: 'Ice', d: 'Quench', ids: ['ice'], c: '#dff3ff' }, { n: 'Hot-water bath', d: 'For V∞', ids: ['hot', 'z_hot'], c: '#fda4af' },
        { n: 'Safety goggles', d: 'PPE', ids: ['goggles'], c: '#3b82f6' }, { n: 'Lab notebook', d: 'k calculation', ids: ['notebook'], c: '#fbbf24' }],
      chemicals: [{ n: '0.4 N HCl', d: '100 mL, catalyst', ids: ['hcl'], c: '#e9f1f4' }, { n: 'Ethyl acetate', d: '≈ 10 mL, flammable', ids: ['eat'], c: '#f4f8fa' }, { n: '0.2 N NaOH', d: 'Titrant', ids: ['naoh'], c: '#e9f1f4' }, { n: 'Phenolphthalein', d: 'Indicator', ids: ['ph'], c: '#f8d3e2' }],
      summary: () => `<p>You followed the acid-catalysed hydrolysis of ethyl acetate by titration and found its rate constant.</p><p class="big">k ≈ ${(c.result?.kav ?? 0).toFixed(5)} min⁻¹ (average) · ${(c.result?.kg ?? 0).toFixed(5)} min⁻¹ (graph)</p><p class="note">Pseudo-first-order because water is in large excess. Simulated readings.</p>`,
    };
  },
};
