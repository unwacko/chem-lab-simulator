import * as P from '../parts.js';
import { baseItems, ppeStep, notebookStep, f, rng, lsq, table, eq, SIM } from './common.js';

export default {
  title: 'Iron concentration using a colorimeter', tag: 'Analytical chemistry · Beer–Lambert', hue: 8,
  blurb: 'Develop the red iron–thiocyanate complex, blank the colorimeter, read standards and find an unknown from the calibration curve.',
  build(c) {
    const Y = c.Y; baseItems(c); const T = c.T;
    const col = c.add('col', P.colorimeter(), 0.0, Y, -0.32, { label: 'Colorimeter' });
    const scr = col.userData.screen.userData;
    const slot = new T.Vector3(0, Y + 0.112, -0.35);
    c.deco(P.rack(6, 0.05), -0.5, Y, -0.12);
    const names = ['blank', 's1', 's2', 's3', 's4', 'unk'], lab = ['Blank', 'Std 1 (2 ppm)', 'Std 2 (4 ppm)', 'Std 3 (6 ppm)', 'Std 4 (8 ppm)', 'Unknown'];
    const ppm = { s1: 2, s2: 4, s3: 6, s4: 8, unk: 5.3 }, N = rng(5);
    const A = (x) => 0.062 * x + 0.003 + N() * 0.006;
    const Aval = {}; ['s1', 's2', 's3', 's4', 'unk'].forEach((k) => (Aval[k] = A(ppm[k])));
    const tubes = {};
    names.forEach((id, i) => { tubes[id] = c.add(id, P.cuvette(0.08, 0.0095), -0.5 + (i - 2.5) * 0.05 - 0.0, Y + 0.008, -0.12, { label: lab[i] + ' (cuvette)' }); });
    c.add('fe', P.bottle({ h: 0.16, r: 0.03, liquid: 0xf2e4a0, text: ['Fe³⁺', 'standard'], fill: 0.8 }), -0.95, Y, -0.1, { label: 'Iron standard solution' });
    c.add('unkb', P.bottle({ h: 0.16, r: 0.03, liquid: 0xf2e9b8, text: ['Fe sample', 'UNKNOWN'], fill: 0.8, accent: '#d97706' }), -0.8, Y, -0.3, { label: 'Unknown iron sample' });
    c.add('acid', P.bottle({ h: 0.18, r: 0.03, glass: 'amber', liquid: 0xe8f2f5, text: ['HNO₃', 'dilute acid'], fill: 0.8, accent: '#dc2626' }), -0.95, Y, -0.3, { label: 'Strong acid (as specified)' });
    c.add('kscn', P.bottle({ h: 0.16, r: 0.03, liquid: 0xe8f4f8, text: ['KSCN', 'reagent'], fill: 0.8 }), 0.45, Y, -0.12, { label: 'Thiocyanate reagent' });
    c.add('dw', P.bottle({ h: 0.2, r: 0.034, liquid: 0xcfeaff, text: ['Distilled', 'water'], fill: 0.8 }), 0.6, Y, -0.12, { label: 'Distilled water (blank)' });
    c.add('pip', P.pipette(), 0.78, Y, -0.1, { label: 'Pipette' });
    c.deco(P.box(0.12, 0.012, 0.1, P.mat(0xf2f2f0, 1), 0, 0, 0), 0.82, Y, -0.3);
    const tint = (k) => new T.Color(0xf2e4a0).lerp(new T.Color(0xc2191f), Math.min(1, ppm[k] / 7.5)).getHex();
    const ids5 = ['s1', 's2', 's3', 's4', 'unk'];
    const readTube = async (cc, id) => { scr.set('...'); await cc.visit(id, slot, 650, 900); scr.set(f(Aval[id]), 'ABS  480 nm'); await cc.wait(900); };

    const steps = [
      ppeStep('Use only the manual\'s stated reagent concentrations and quantities. Strong acids are corrosive — eye protection and gloves.'),
      { t: 'Switch on the colorimeter', i: 'Click the <b>colorimeter</b> to power it up.', kind: 'click', target: 'col', hint: 'switch on the colorimeter',
        tt: 'Colorimeter', th: '<p>A colorimeter passes filtered light through a sample and measures how much is absorbed (absorbance) or transmitted.</p>', fx: async (cc) => { scr.set('WARM UP'); await cc.wait(900); scr.set('0.000', 'ABS'); } },
      { t: 'Add the iron standards', i: 'Pick up the <b>iron standard</b> and add it to cuvettes <b>Std 1 → Std 4</b> (2, 4, 6, 8 ppm).', kind: 'use', item: 'fe', on: ['s1', 's2', 's3', 's4'], hint: 'add iron standard to each standard cuvette',
        tt: 'Calibration standards', th: '<p>Standards of known concentration establish the calibration relationship used later for the unknown.</p>', fx: (cc, i, id) => cc.fill(tubes[id], 0.45, 0xf4ecb4, 700, 0.5) },
      { t: 'Add the unknown', i: 'Pick up the <b>unknown iron sample</b> and add it to the <b>Unknown</b> cuvette.', kind: 'use', item: 'unkb', on: 'unk', hint: 'add the unknown sample to its cuvette',
        tt: 'Same treatment', th: '<p>The unknown must be treated <b>exactly</b> like the standards so the colour is comparable.</p>', fx: (cc) => cc.fill(tubes.unk, 0.45, 0xf4ecb4, 700, 0.5) },
      { t: 'Add the acid', i: 'Pick up the <b>acid</b> and add the prescribed amount to all five cuvettes.', kind: 'use', item: 'acid', on: ids5, hint: 'add acid to every sample cuvette',
        tt: 'Why acid?', th: '<p>Acid keeps iron(III) from hydrolysing to hydroxides, so only Fe³⁺ is available to complex with SCN⁻.</p>', fx: (cc, i, id) => cc.fill(tubes[id], 0.6, 0xf2eab8, 600, 0.5) },
      { t: 'Develop the coloured complex', i: 'Pick up the <b>thiocyanate reagent</b> and add it to all five cuvettes. Watch the colour develop.', kind: 'use', item: 'kscn', on: ids5, hint: 'add thiocyanate to every sample cuvette',
        tt: 'Iron–thiocyanate complex', th: `<p>Iron(III) and thiocyanate form red complexes:</p>${eq('Fe³⁺ + SCN⁻ ⇌ [Fe(SCN)]²⁺  (blood-red)')}<p>Colour intensity increases with the concentration of the absorbing complex.</p>`,
        fx: async (cc, i, id) => { await cc.fill(tubes[id], 0.78, tint(id), 900, 0.8); await cc.wiggle(id, 400, 0.006, 'x', 3); } },
      { t: 'Prepare the blank', i: 'Pick up the <b>distilled water</b> and fill the <b>Blank</b> cuvette.', kind: 'use', item: 'dw', on: 'blank', hint: 'fill the blank cuvette with distilled water',
        tt: 'Blank', th: '<p>The blank (solvent/reagents without analyte) sets the zero so that only the analyte\'s absorbance is measured. Wipe the clear faces and avoid bubbles and fingerprints.</p>', fx: (cc) => cc.fill(tubes.blank, 0.78, 0xdcefff, 900, 0.35) },
      { t: 'Select the filter', i: 'Click the <b>colorimeter</b> to select the specified filter (≈ 480 nm, blue-green for a red complex).', kind: 'click', target: 'col', hint: 'select the filter',
        tt: 'Choosing a wavelength', th: '<p>A red solution absorbs blue-green light, so a filter near its absorption maximum gives the greatest sensitivity.</p>', fx: async (cc) => { scr.set('480 nm', 'FILTER'); await cc.wait(900); scr.set('0.000', 'ABS'); } },
      { t: 'Zero with the blank', i: 'Click the <b>Blank</b> cuvette: it is placed in the slot and the instrument is set to zero.', kind: 'click', target: 'blank', hint: 'insert the blank',
        tt: 'Blanking', th: '<p>Place the cuvette in the same orientation each time, then set zero/blank: this compensates for absorption by solvent and reagents.</p>', fx: async (cc) => { scr.set('...'); await cc.visit('blank', slot, 650, 700); scr.set('0.000', 'ZEROED'); await cc.wait(600); } },
      { t: 'Read the standards', i: 'Click each standard cuvette (<b>Std 1 → Std 4</b>) to measure its absorbance.', kind: 'click', targets: ['s1', 's2', 's3', 's4'], hint: 'read each standard',
        tt: 'Beer–Lambert law', th: `<p>For a suitable concentration range and fixed path length, absorbance is proportional to concentration:</p>${eq('A = ε · c · l')}`, fx: (cc, i, id) => readTube(cc, id) },
      { t: 'Read the unknown', i: 'Click the <b>Unknown</b> cuvette to measure it the same way.', kind: 'click', target: 'unk', hint: 'read the unknown',
        tt: 'Unknown sample', th: '<p>Read the unknown under identical conditions, then use the calibration line to find its concentration (apply any dilution factor).</p>', fx: (cc) => readTube(cc, 'unk') },
      notebookStep({ t: 'Plot the calibration curve', tt: 'Calibration', th: `<p>Plot absorbance against standard concentration and read the unknown from the line.</p>${eq('c(unknown) = (A − intercept) / slope')}`,
        nb: () => {
          const pts = ['s1', 's2', 's3', 's4'].map((k) => [ppm[k], Aval[k]]), l = lsq(pts), cu = (Aval.unk - l.c) / l.m; c.result = { cu, m: l.m };
          return { title: 'Calibration results', html: table(['Cuvette', 'c (ppm Fe)', 'Absorbance'], [...pts.map((p, i) => [`Std ${i + 1}`, p[0], f(p[1])]), ['Unknown', '?', f(Aval.unk)]]) + `<p>Slope = ${f(l.m, 4)} per ppm</p><p>Unknown iron concentration ≈ <b class="big">${cu.toFixed(2)} ppm (mg/L)</b></p>` + SIM,
            chart: { xs: [0, 9], ys: [0, 0.6], series: [{ pts, color: '#f87171', line: false, label: 'Standards' }, { pts: [[cu, Aval.unk]], color: '#22d3ee', line: false, label: 'Unknown' }],
              lines: [{ x1: 0, y1: l.c, x2: 9, y2: l.c + l.m * 9, color: '#f59e0b' }, { x1: cu, y1: 0, x2: cu, y2: Aval.unk, color: '#22d3ee', dash: 1 }, { x1: 0, y1: Aval.unk, x2: cu, y2: Aval.unk, color: '#22d3ee', dash: 1 }], xlabel: 'Fe concentration (ppm)', ylabel: 'Absorbance' } };
        } }),
    ];
    return {
      steps,
      apparatus: [{ n: 'Colorimeter', d: 'Filter selector + display', ids: ['col'], c: '#e2e8f0' }, { n: 'Matched cuvettes ×6', d: 'Blank, 4 standards, unknown', ids: names, c: '#bae6fd' }, { n: 'Pipette', d: 'Accurate transfers', ids: ['pip'], c: '#60a5fa' },
        { n: 'Lint-free wipes', d: 'Clean optical faces', c: '#f1f5f9', ids: [] }, { n: 'Safety goggles', d: 'PPE', ids: ['goggles'], c: '#3b82f6' }, { n: 'Lab notebook', d: 'Calibration plot', ids: ['notebook'], c: '#fbbf24' }],
      chemicals: [{ n: 'Iron standard', d: '2, 4, 6, 8 ppm', ids: ['fe'], c: '#f2e4a0' }, { n: 'Unknown iron sample', d: 'To be determined', ids: ['unkb'], c: '#f2e9b8' }, { n: 'Thiocyanate reagent', d: 'SCN⁻ source', ids: ['kscn'], c: '#e8f4f8' },
        { n: 'Strong acid', d: 'Per manual', ids: ['acid'], c: '#e8f2f5' }, { n: 'Distilled water', d: 'Blank / diluent', ids: ['dw'], c: '#bfe4ff' }],
      summary: () => `<p>You built a calibration curve from four iron(III)–thiocyanate standards and read the unknown from it.</p><p class="big">Unknown ≈ ${(c.result?.cu ?? 0).toFixed(2)} ppm Fe</p><p class="note">Simulated readings. Always calculate from your own absorbance data.</p>`,
    };
  },
};
