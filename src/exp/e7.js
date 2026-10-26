import * as P from '../parts.js';
import { baseItems, ppeStep, notebookStep, f, table, eq, SIM } from './common.js';

export default {
  title: 'Separation of organic compounds by TLC', tag: 'Organic chemistry · Chromatography', hue: 215,
  blurb: 'Coat a silica TLC plate, spot a mixture, develop the chromatogram, visualise with iodine and calculate Rf values.',
  build(c) {
    const Y = c.Y, T = c.T; baseItems(c);
    c.deco(P.fumeHood(), 0, Y, -0.275);
    const chm = c.add('chm', P.chamber(), 0.3, Y, -0.3, { label: 'Developing chamber' }); const cu = chm.userData; const H = 0.3;
    cu.lidGroup.position.set(0, 0.004, 0.17);
    c.zone('z_chm', 0.3, Y + 0.006, -0.3, 0.06, 0.21, 0.04, 'Stand plate in chamber');
    const vap = new T.Mesh(new T.CylinderGeometry(0.07, 0.07, 0.26, 24, 1, true), new T.MeshBasicMaterial({ color: 0xaad4ff, transparent: true, opacity: 0, depthWrite: false })); vap.position.y = 0.14; chm.add(vap);
    c.add('elu', P.bottle({ h: 0.17, r: 0.032, liquid: 0xeef2f4, text: ['Eluent', 'solvent'], fill: 0.8, accent: '#dc2626' }), 0.05, Y, -0.42, { label: 'Eluent (mobile phase)' });
    c.add('vsol', P.bottle({ h: 0.14, r: 0.028, glass: 'amber', liquid: 0xf1f3f3, text: ['Volatile', 'solvent'], fill: 0.8, accent: '#dc2626' }), -0.1, Y, -0.42, { label: 'Volatile solvent (for the sample)' });
    const slur = c.add('slur', P.beaker(0.05, 0.1, '250 mL', ['Silica gel', 'CHCl₃ slurry']), -0.3, Y, -0.3, { label: 'Silica-gel slurry in chloroform' }); c.setFill(slur, 0.6, 0xf1efe6, 0.9);
    const plate = c.add('plate', P.tlcPlate(), -0.62, Y + 0.01, -0.12, { label: 'TLC plate (20 × 4 cm)' }); c.deco(P.box(0.07, 0.01, 0.04, P.mat(0x1f6f78, 0.6), 0, 0, 0), -0.62, Y, -0.12);
    c.zone('z_dry', -0.45, Y + 0.01, -0.12, 0.06, 0.21, 0.04, 'Drying stand'); c.deco(P.box(0.07, 0.01, 0.04, P.mat(0x1f6f78, 0.6), 0, 0, 0), -0.45, Y, -0.12);
    const pu = plate.userData;
    c.deco(P.beaker(0.03, 0.08, '50 mL'), 0.62, Y, 0.05); c.deco(P.beaker(0.03, 0.08, '50 mL'), -0.1, Y, 0.06);
    c.add('pen', P.pencil(), 0.62, Y + 0.005, 0.05, { label: 'Pencil' }); c.add('cap', P.capillary(), -0.1, Y + 0.005, 0.06, { label: 'Capillary spotting tube' });
    const smp = c.add('smp', P.testTube(0.12, 0.014), 0.1, Y, 0.0, { label: 'Mixture of organic compounds' }); c.setFill(smp, 0.18, 0xd9b36a, 0.85);
    c.deco(P.rack(1, 0.04), 0.1, Y, 0.0);
    const iod = c.add('iod', P.iodineJar(), 0.7, Y, -0.34, { label: 'Iodine chamber' }); c.zone('z_iod', 0.7, Y + 0.008, -0.34, 0.06, 0.21, 0.04, 'Into iodine chamber');
    c.deco(P.beaker(0.03, 0.08, '50 mL'), 0.82, Y, 0.05); c.add('tw', P.tweezers(), 0.82, Y + 0.005, 0.05, { label: 'Forceps' });
    c.deco(P.ruler(), 0.25, Y, 0.07);
    const wet = new T.Mesh(new T.BoxGeometry(0.038, 1, 0.0004), new T.MeshBasicMaterial({ color: 0x6f7f90, transparent: true, opacity: 0.35, depthWrite: false })); wet.position.set(0, 0.002, 0.0021); wet.scale.y = 0.0001; plate.add(wet);
    const Rf = [0.22, 0.48, 0.74], base = 0.025, front = 0.11;
    const spotY = (i) => base + Rf[i] * front;
    pu.spots.forEach((s, i) => { s.position.y = spotY(i); s.material.opacity = 0; });
    const lidTo = (open) => c.run(800, (t) => { const a = open ? 1 - t : t; cu.lidGroup.position.set(0, 0.004 + (H - 0.004) * a, 0.17 * (1 - a) * 0 + 0.17 * (1 - a)); });

    const steps = [
      ppeStep('Chloroform, benzene (if used) and iodine vapour are hazardous. Work in a fume hood, keep the chamber covered, avoid inhalation and skin contact; dispose of solvent waste as directed.'),
      { t: 'Add the eluent', i: 'Pick up the <b>eluent bottle</b> and pour <b>about 8 mL</b> into the developing chamber.', kind: 'use', item: 'elu', on: 'chm', hint: 'pour eluent into the chamber', tt: 'Mobile phase', th: '<p>The eluent (mobile phase) is the solvent that will travel up the plate by capillary action, carrying the sample components with it. The depth must stay <b>below the baseline</b> later.</p>', fx: (cc) => cc.fill(chm.userData.vesselObj, 0.07, 0xe9eef0, 1000, 0.5) },
      { t: 'Cover the chamber', i: 'Click the <b>chamber</b> to place the lid on.', kind: 'click', target: 'chm', hint: 'close the chamber', tt: 'Why cover?', th: '<p>A lid keeps solvent vapour in and stops evaporation from the plate surface.</p>', fx: () => lidTo(false) },
      { t: 'Saturate the chamber (15 min)', i: '<b>Hold LMB</b> on the chamber to wait <b>15 minutes</b> (time-lapse) — leave it undisturbed.', kind: 'hold', target: 'chm', secs: 3, hint: 'hold on the chamber', tick: (cc, p) => { vap.material.opacity = 0.12 * p; },
        tt: 'Vapour saturation', th: '<p>Solvent vapour saturates the chamber atmosphere so the solvent front rises evenly and results are reproducible.</p>' },
      { t: 'Coat the plate', i: 'Pick up the <b>TLC plate</b> and dip it into the <b>silica-gel slurry</b> for a uniform thin coating.', kind: 'use', item: 'plate', on: 'slur', hint: 'dip the plate in the slurry', pose: { dip: 0.075 }, tt: 'Stationary phase', th: '<p>Silica gel (SiO₂·xH₂O) is the <b>polar stationary phase</b>. A uniform thin layer gives reliable separation; wipe excess from the edges and back.</p>', fx: async (cc) => { pu.coat.visible = true; pu.coat.material.color.set(0xb8b6ad); await cc.wait(900); } },
      { t: 'Let the coating dry', i: '<b>Hold LMB</b> on the <b>plate</b> while the silica layer dries.', kind: 'hold', target: 'plate', secs: 2, hint: 'hold on the plate', tick: (cc, p) => pu.coat.material.color.set(new T.Color(0xb8b6ad).lerp(new T.Color(0xf3f1ea), p)), tt: 'Drying', th: '<p>The chloroform evaporates, leaving a dry, even white layer of silica on the glass.</p>' },
      { t: 'Draw the baseline', i: 'Pick up the <b>pencil</b> and draw a light <b>baseline about 2–3 cm</b> from the bottom of the plate.', kind: 'use', item: 'pen', on: 'plate', pose: { fromBottom: 0.025, face: true, dip: 0 }, hint: 'draw the baseline with the pencil', tt: 'Pencil, not ink', th: '<p>Pencil graphite is inert and does not dissolve in the eluent; ink dyes would run and separate themselves.</p>', fx: async (cc) => { pu.line.visible = true; await cc.wiggle('pen', 500, 0.015, 'x', 2); } },
      { t: 'Dissolve the mixture', i: 'Pick up the <b>volatile solvent</b> and add it to the <b>sample tube</b> to dissolve the mixture.', kind: 'use', item: 'vsol', on: 'smp', hint: 'dissolve the sample in the solvent', tt: 'Sample solution', th: '<p>Dissolve the supplied mixture in a suitable <b>volatile</b> solvent so the spot dries quickly.</p>', fx: (cc) => cc.fill(smp, 0.5, 0xd9b36a, 900, 0.8) },
      { t: 'Load the capillary', i: 'Pick up the <b>capillary tube</b> and touch it to the sample solution.', kind: 'use', item: 'cap', on: 'smp', hint: 'draw up sample with the capillary', pose: { dip: 0.07 }, tt: 'Capillary action', th: '<p>The fine capillary draws up a tiny volume by capillary action.</p>', fx: (cc) => cc.wait(700) },
      { t: 'Spot the plate', i: 'Touch the capillary to the <b>baseline</b> to place a small, concentrated spot, then let it dry.', kind: 'use', item: 'cap', on: 'plate', pose: { fromBottom: 0.025, face: true, dip: 0 }, hint: 'spot the baseline', tt: 'Small spot = good separation', th: '<p>A small, concentrated spot gives sharper, better-separated bands. Keep the spot above the solvent level later.</p>', fx: async (cc) => { pu.spot0.visible = true; await cc.wait(700); } },
      { t: 'Open the chamber', i: 'Click the <b>chamber</b> to lift the lid.', kind: 'click', target: 'chm', hint: 'lift the lid', tt: 'Development', th: '<p>Now the plate will stand in the saturated chamber with the baseline <b>above</b> the solvent surface.</p>', fx: () => lidTo(true) },
      { t: 'Stand the plate in the chamber', i: 'Pick up the <b>plate</b> and stand it upright in the chamber.', kind: 'move', item: 'plate', to: 'z_chm', hint: 'place the plate in the chamber', tt: 'Baseline above solvent', th: '<p>If the spot were under the solvent it would simply wash into the eluent instead of travelling up the plate.</p>' },
      { t: 'Close the chamber', i: 'Click the <b>chamber</b> to put the lid back on.', kind: 'click', target: 'chm', hint: 'close the chamber', fx: () => lidTo(false), tt: 'Undisturbed', th: '<p>Cover it and leave it undisturbed while the solvent climbs.</p>' },
      { t: 'Develop the chromatogram', i: '<b>Hold LMB</b> on the chamber until the solvent front has travelled <b>10–12 cm</b>.', kind: 'hold', target: 'chm', secs: 5, hint: 'hold on the chamber',
        tick: (cc, p) => { const lvl = base - 0.02 + (front + 0.02) * p; wet.scale.y = Math.max(0.0001, lvl); wet.position.y = 0.002 + lvl / 2; pu.spot0.visible = p < 0.02; },
        tt: 'Differential migration', th: '<p>The mobile phase rises by capillary action. Components travel different distances because their affinities for the polar silica and for the solvent differ — polar compounds stick, less polar ones move further.</p>' },
      { t: 'Remove the plate', i: 'Pick up the <b>forceps</b> and lift the plate out of the chamber.', kind: 'use', item: 'tw', on: 'plate', hint: 'lift the plate out with the forceps', tt: 'Handle with care', th: '<p>Remove the plate and <b>immediately</b> mark the solvent front before it evaporates.</p>', fx: async (cc) => { await cc.moveTo('plate', new T.Vector3(-0.45, Y + 0.01, -0.12), 700); } },
      { t: 'Mark the solvent front', i: 'Pick up the <b>pencil</b> and mark the position of the <b>solvent front</b>.', kind: 'use', item: 'pen', on: 'plate', pose: { fromBottom: base + front, face: true, dip: 0 }, hint: 'mark the solvent front', tt: 'Solvent front', th: '<p>The solvent front line is needed to calculate Rf — it evaporates quickly, so mark it at once.</p>', fx: async (cc) => { pu.front.visible = true; await cc.wiggle('pen', 400, 0.015, 'x', 2); } },
      { t: 'Visualise with iodine', i: 'Pick up the <b>plate</b> and place it in the <b>iodine chamber</b>.', kind: 'move', item: 'plate', to: 'z_iod', hint: 'put the plate in the iodine chamber', tt: 'Iodine vapour', th: '<p>Most organic compounds are colourless. Iodine vapour adsorbs onto them, making <b>brown spots</b> appear.</p><p class="warn">Iodine vapour is hazardous — keep the chamber closed, in the fume hood.</p>',
        fx: async (cc) => { iod.userData.vapor.material.opacity = 0.18; await cc.run(1800, (t) => { wet.material.opacity = 0.35 * (1 - t); pu.spots.forEach((s) => { s.visible = true; s.material.opacity = t * 0.9; }); }); iod.userData.vapor.material.opacity = 0; } },
      { t: 'Measure the distances', i: 'Click the <b>plate</b> to measure from the baseline to each spot centre and to the solvent front with the ruler.', kind: 'click', target: 'plate', hint: 'measure the plate', tt: 'Measuring', th: '<p>Measure from the <b>baseline</b> to the <b>centre</b> of each spot and to the solvent front.</p>',
        fx: async (cc) => { await cc.moveTo('plate', new T.Vector3(0.0, Y + 0.01, 0.02), 700); document.getElementById('hudnote').textContent = 'Front = 11.0 cm   Spots: 2.4 · 5.3 · 8.1 cm'; await cc.wait(1500); document.getElementById('hudnote').textContent = ''; } },
      notebookStep({ t: 'Calculate Rf values', tt: 'Retention factor', th: '<p>' + 'For each component:' + '</p>' + eq('Rf = distance moved by compound / distance moved by solvent front') + '<p>Rf values compare compounds under identical conditions but are not universal constants.</p>',
        nb: () => { const d = [2.4, 5.3, 8.1]; return { title: 'TLC results', html: table(['Spot', 'Distance (cm)', 'Front (cm)', 'Rf', 'Appearance'], d.map((x, i) => [`${i + 1}`, x.toFixed(1), '11.0', (x / 11).toFixed(2), 'brown (I₂)'])) + '<p>Three spots ⇒ the mixture contains <b>at least three separable components</b>.</p>' + SIM }; } }),
    ];
    return {
      steps,
      apparatus: [{ n: 'Developing chamber + lid', d: '≈ 30 cm × 15 cm glass', ids: ['chm', 'z_chm'], c: '#bae6fd' }, { n: 'TLC plate 20 × 4 cm', d: 'Silica-coated glass', ids: ['plate', 'z_dry'], c: '#e2e8f0' }, { n: 'Capillary tube', d: 'Spotting', ids: ['cap'], c: '#cbd5e1' }, { n: 'Pencil & ruler', d: 'Baseline / front / measure', ids: ['pen'], c: '#fbbf24' },
        { n: 'Slurry beaker', d: 'Silica gel in CHCl₃', ids: ['slur'], c: '#f1efe6' }, { n: 'Sample test tube', d: 'Organic mixture', ids: ['smp'], c: '#d9b36a' }, { n: 'Forceps', d: 'Handle plate', ids: ['tw'], c: '#94a3b8' }, { n: 'Iodine chamber', d: 'Visualisation', ids: ['iod', 'z_iod'], c: '#7c3aed' },
        { n: 'Fume hood', d: 'Volatile / toxic solvents', ids: [], c: '#64748b' }, { n: 'Safety goggles', d: 'PPE', ids: ['goggles'], c: '#3b82f6' }, { n: 'Lab notebook', d: 'Rf values', ids: ['notebook'], c: '#fbbf24' }],
      chemicals: [{ n: 'Eluent', d: 'As specified (7–10 mL)', ids: ['elu'], c: '#eef2f4' }, { n: 'Silica gel + chloroform', d: 'Slurry', ids: ['slur'], c: '#f1efe6' }, { n: 'Volatile solvent', d: 'Dissolve sample', ids: ['vsol'], c: '#f1f3f3' }, { n: 'Organic mixture', d: 'Sample', ids: ['smp'], c: '#d9b36a' }, { n: 'Iodine crystals', d: 'Visualising agent', ids: ['iod'], c: '#4c1d95' }],
      summary: () => `<p>You prepared and developed a TLC plate, visualised the components with iodine and calculated their Rf values.</p><p class="big">Rf = 0.22 · 0.48 · 0.74</p><p class="note">More than one spot indicates multiple separable components. Simulated measurements.</p>`,
    };
  },
};
