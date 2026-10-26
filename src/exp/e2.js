import * as P from '../parts.js';
import { baseItems, ppeStep, notebookStep, eq, SIM } from './common.js';

export default {
  title: 'Nylon 6,10 by interfacial polymerization', tag: 'Polymer chemistry · Condensation', hue: 265,
  blurb: 'Layer a diamine solution over an acid chloride in CCl₄ and pull a continuous nylon thread from the interface.',
  build(c) {
    const Y = c.Y; baseItems(c);
    const hood = P.fumeHood(); c.deco(hood, 0, Y, -0.275);
    const CC = 0xe6f1f4, AQ = 0xcfe9ff;
    const bal = c.deco(P.balance(), -0.55, Y, -0.12); c.zone('z_pan', -0.55, Y + 0.066, -0.14, 0.09, 0.03, 0.09, 'Place on pan');
    const boat = c.add('boat', P.weighBoat(), -0.3, Y, -0.04, { label: 'Weighing boat' });
    const powder = c.T && new c.T.Mesh(new c.T.SphereGeometry(0.02, 16, 8), P.mat(0xffffff, 0.9)); powder.scale.y = 0.35; powder.position.y = 0.005; powder.visible = false; boat.add(powder);
    c.add('amine', P.solidJar({ r: 0.036, h: 0.1, text: ['Hexamethylene', 'diamine'], color: 0xf7f7f2 }), -0.62, Y, -0.34, { label: 'Hexamethylene diamine (solid)' });
    const bA = c.add('bA', P.beaker(0.046, 0.11, '250 mL', ['A', 'CCl₄ phase']), -0.02, Y, -0.1, { label: 'Beaker A (250 mL)' });
    const bB = c.add('bB', P.beaker(0.046, 0.11, '250 mL', ['B', 'Aqueous']), 0.2, Y, -0.1, { label: 'Beaker B (250 mL)' });
    c.add('ccl4', P.bottle({ h: 0.19, r: 0.036, glass: 'amber', liquid: CC, text: ['CCl₄', 'distilled'], fill: 0.85, accent: '#dc2626' }), -0.08, Y, -0.42, { label: 'Carbon tetrachloride (hazard!)' });
    c.add('seb', P.bottle({ h: 0.12, r: 0.026, glass: 'amber', liquid: 0xf3efe0, text: ['Sebacoyl', 'chloride'], fill: 0.6, accent: '#dc2626' }), 0.1, Y, -0.42, { label: 'Sebacoyl chloride' });
    c.add('water', P.bottle({ h: 0.2, r: 0.036, glass: 'clear', liquid: AQ, text: ['Distilled', 'water'], fill: 0.85 }), 0.28, Y, -0.42, { label: 'Distilled water' });
    c.deco(P.beaker(0.032, 0.075, '100 mL'), 0.48, Y, -0.12);
    const rodcup = c.deco(P.beaker(0.032, 0.075, '100 mL'), 0.5, Y, -0.35);
    c.add('rod', P.glassRod(), 0.5, Y + 0.005, -0.35, { label: 'Glass rod' });
    c.add('tw', P.tweezers(), 0.55, Y + 0.005, -0.38, { label: 'Tweezers / forceps' });
    c.deco(P.beaker(0.04, 0.05, '50 mL', ['Waste']), 0.62, Y, -0.1);
    c.deco(new c.T.Mesh(new c.T.CylinderGeometry(0.06, 0.06, 0.004, 32), P.glassMat(0xe6f4ff, 0.4)), 0.62, Y + 0.002, -0.44);
    c.zone('z_dry', 0.62, Y + 0.004, -0.44, 0.1, 0.18, 0.1, 'Dry here');
    const tw = c.get('tw');
    const thread = P.polymerThread(); thread.rotation.z = Math.PI; thread.visible = false; tw.add(thread);
    const film = new c.T.Mesh(new c.T.CircleGeometry(0.044, 32), new c.T.MeshPhysicalMaterial({ color: 0xffffff, transparent: true, opacity: 0.8, roughness: 0.3, side: 2, depthWrite: false }));
    film.rotation.x = -Math.PI / 2; film.visible = false; c.stage.add(film);
    const layers = (a, b) => bA.userData.setLayers([[a, CC, 0.5], [b, AQ, 0.42]].filter((l, i) => i === 0 || b > a));
    const lyr = (t) => bA.userData.setLayers([[0.52, CC, 0.5], [0.52 + 0.4 * t, AQ, 0.42]]);
    let ifaceY = 0, twBase = 0;

    const steps = [
      ppeStep('CRITICAL HAZARD: carbon tetrachloride and sebacoyl chloride are hazardous. In reality this must be done only by trained staff in a fume hood with the specified PPE.'),
      { t: 'Prepare the acid-chloride layer (1/2)', i: 'Pick up the <b>CCl₄ bottle</b> and pour <b>50 mL of distilled CCl₄</b> into <b>beaker A</b>.', kind: 'use', item: 'ccl4', on: 'bA', hint: 'pour CCl₄ into beaker A',
        tt: 'Organic phase', th: '<p>Sebacoyl chloride dissolves in the organic solvent, forming one monomer-containing phase.</p><p>CCl₄ is a dense, clear, colourless liquid (ρ ≈ 1.59 g/mL) — it will be the <b>bottom</b> layer.</p>',
        fx: (cc) => cc.fill(bA, 0.52, CC, 1200, 0.5) },
      { t: 'Prepare the acid-chloride layer (2/2)', i: 'Pour <b>1 mL sebacoyl chloride</b> into beaker A.', kind: 'use', item: 'seb', on: 'bA', hint: 'add sebacoyl chloride to beaker A',
        tt: 'Sebacoyl chloride', th: `<p>The acid chloride monomer:</p>${eq('ClOC–(CH₂)₈–COCl')}<p>It reacts violently with water, so it is kept in the organic layer.</p>`,
        fx: async (cc) => { await cc.wait(700); } },
      { t: 'Weigh the diamine (1/2)', i: 'Pick up the <b>weighing boat</b> and put it on the <b>balance pan</b>.', kind: 'move', item: 'boat', to: 'z_pan', hint: 'place the boat on the balance',
        tt: 'Weighing solids', th: '<p>Place the empty boat on the pan and tare the balance, then add the solid until the reading is correct.</p>',
        fx: (cc) => { bal.userData.screen.userData.set('0.000 g'); return cc.wait(300); } },
      { t: 'Weigh the diamine (2/2)', i: 'Pick up the <b>hexamethylene diamine jar</b> and tip <b>2.2 g</b> into the boat.', kind: 'use', item: 'amine', on: 'boat', hint: 'add diamine to the boat',
        tt: 'Hexamethylene diamine', th: `<p>White crystalline solid — the second monomer:</p>${eq('H₂N–(CH₂)₆–NH₂')}`,
        fx: async (cc) => { powder.visible = true; await cc.run(1200, (t) => { bal.userData.screen.userData.set((2.2 * t).toFixed(3) + ' g'); powder.scale.set(t, 0.35 * t, t); }); bal.userData.screen.userData.set('2.200 g'); } },
      { t: 'Prepare the aqueous layer (1/3)', i: 'Pour <b>50 mL distilled water</b> into <b>beaker B</b>.', kind: 'use', item: 'water', on: 'bB', hint: 'pour water into beaker B',
        tt: 'Aqueous phase', th: '<p>The diamine will dissolve in water to form the aqueous monomer phase.</p>', fx: (cc) => cc.fill(bB, 0.52, AQ, 1200, 0.42) },
      { t: 'Prepare the aqueous layer (2/3)', i: 'Pick up the <b>boat</b> and add the <b>diamine</b> to beaker B.', kind: 'use', item: 'boat', on: 'bB', hint: 'add the diamine to beaker B',
        tt: 'Dissolving', th: '<p>Hexamethylene diamine is very soluble in water and forms an alkaline solution.</p>',
        fx: async (cc) => { await cc.run(900, (t) => powder.scale.setScalar(Math.max(0.001, 1 - t))); powder.visible = false; bal.userData.screen.userData.set('0.000 g'); } },
      { t: 'Prepare the aqueous layer (3/3)', i: 'Pick up the <b>glass rod</b> and stir beaker B until the solution is clear.', kind: 'use', item: 'rod', on: 'bB', hint: 'stir beaker B with the rod',
        tt: 'Clear solution', th: '<p>Stir until no solid remains. Both monomer solutions are now ready.</p>', fx: (cc) => cc.stir('rod', 1800, 0.012) },
      { t: 'Form two layers', i: 'Pick up <b>beaker B</b> and <b>pour it slowly down the inside wall</b> of beaker A. Do not mix vigorously.', kind: 'use', item: 'bB', on: 'bA', hint: 'pour B gently into A',
        tt: 'Immiscible liquids', th: '<p>The aqueous layer is less dense than CCl₄ and the liquids are immiscible, so the aqueous layer floats on top and the two monomers meet <b>only at the interface</b>.</p>',
        fx: async (cc) => { const t0 = 0; await cc.run(2200, (t) => { lyr(t); bB.userData.setFill(0.52 * (1 - t), AQ, 0.42); }); ifaceY = c.topOf('bA').y; ifaceY = bA.position.y + bA.userData.fillY(0.52); } },
      { t: 'Observe the interface', i: 'Look closely: <b>click beaker A</b> to see what forms where the two layers touch.', kind: 'click', target: 'bA', hint: 'click beaker A',
        tt: 'Interfacial condensation', th: `<p>A thin film of polyamide forms at the boundary as the diamine and sebacoyl chloride react, releasing HCl:</p>${eq('H₂N–(CH₂)₆–NH₂ + ClOC–(CH₂)₈–COCl → –[NH–(CH₂)₆–NH–CO–(CH₂)₈–CO]ₙ– + 2n HCl')}`,
        fx: async (cc) => { film.position.set(bA.position.x, ifaceY, bA.position.z); film.visible = true; await cc.run(1200, (t) => film.scale.setScalar(Math.max(0.01, t))); } },
      { t: 'Grasp the film', i: 'Pick up the <b>tweezers</b> and grasp the polymer film at the interface in beaker A.', kind: 'use', item: 'tw', on: 'bA', stay: true, hint: 'grab the film with the tweezers',
        tt: 'Nylon 6,10', th: '<p>The film is a polyamide (nylon 6,10): "6" from the six-carbon diamine and "10" from the ten-carbon diacid chloride. It is the same amide link found in proteins (peptide bond).</p>',
        fx: async (cc) => { twBase = tw.position.y; thread.visible = true; thread.userData.setLen(0.02); film.visible = false; await cc.wait(500); } },
      { t: 'Draw out the thread', i: '<b>Hold LMB</b> on beaker A to slowly lift the tweezers and pull a continuous nylon thread.', kind: 'hold', target: 'bA', secs: 4, hint: 'hold on beaker A to draw the thread',
        tick: (cc, p) => { tw.position.y = twBase + p * 0.2; thread.userData.setLen(Math.max(0.02, tw.position.y - ifaceY)); },
        tt: 'Continuous polymer', th: '<p>As the film is pulled out, fresh monomers meet at the exposed interface and new polymer keeps forming — a continuous thread, until one reactant is used up.</p>' },
      { t: 'Wash the thread', i: 'Pick up the <b>water bottle</b> and rinse the thread held in the tweezers.', kind: 'use', item: 'water', on: 'tw', hint: 'rinse the thread with water',
        tt: 'Washing', th: '<p>Washing removes HCl and traces of monomer and solvent from the polymer.</p>', fx: (cc) => cc.wait(1200) },
      { t: 'Dry the thread', i: 'Pick up the <b>tweezers</b> with the thread and lay it on the <b>labelled watch glass</b> to dry.', kind: 'move', item: 'tw', to: 'z_dry', hint: 'put the thread on the watch glass',
        tt: 'Inspect the product', th: '<p>Observe the white-to-translucent appearance, flexible thread form and continuity.</p>', fx: (cc) => { thread.userData.setLen(0.07); tw.rotation.z = 0; } },
      notebookStep({ t: 'Record your observations', tt: 'Result', th: `<p>The product is <b>nylon 6,10</b>, formed by condensation polymerization with HCl as by-product.</p>`,
        nb: () => ({ title: 'Observations — nylon 6,10', html: `<p>• A <b>white, translucent film</b> formed at the liquid–liquid interface.</p><p>• A <b>continuous, flexible thread</b> was drawn out with tweezers.</p>${eq('n H₂N(CH₂)₆NH₂ + n ClOC(CH₂)₈COCl → [–NH(CH₂)₆NHCO(CH₂)₈CO–]ₙ + 2n HCl')}<p class="note">Wash and dry the thread as directed by your instructor; dispose of CCl₄ waste only as instructed.</p>` }) }),
    ];
    return {
      steps,
      apparatus: [{ n: 'Beakers A & B (250 mL)', d: 'Two immiscible solutions', ids: ['bA', 'bB'], c: '#93c5fd' }, { n: 'Balance + weighing boat', d: '2.2 g solid', ids: ['boat', 'z_pan'], c: '#e2e8f0' },
        { n: 'Glass rod', d: 'Stirring', ids: ['rod'], c: '#bae6fd' }, { n: 'Tweezers', d: 'Lift the film', ids: ['tw'], c: '#cbd5e1' }, { n: 'Watch glass', d: 'Drying surface', ids: ['z_dry'], c: '#a5f3fc' },
        { n: 'Fume hood', d: 'Mandatory for CCl₄', c: '#64748b', ids: [] }, { n: 'Safety goggles', d: 'PPE', ids: ['goggles'], c: '#3b82f6' }, { n: 'Lab notebook', d: 'Observations', ids: ['notebook'], c: '#fbbf24' }],
      chemicals: [{ n: 'Carbon tetrachloride', d: '50 mL — hazardous', ids: ['ccl4'], c: '#e6f1f4' }, { n: 'Sebacoyl chloride', d: '1 mL', ids: ['seb'], c: '#f3efe0' },
        { n: 'Hexamethylene diamine', d: '2.2 g, white solid', ids: ['amine'], c: '#f7f7f2' }, { n: 'Distilled water', d: '50 mL + washing', ids: ['water'], c: '#bfe4ff' }],
      summary: () => `<p>You formed nylon 6,10 at a liquid–liquid interface and drew it out as a continuous thread.</p>${eq('diamine + diacid chloride → polyamide + HCl')}<p class="note">A thread/filament of nylon 6,10 is produced at the interface; HCl is the by-product.</p>`,
    };
  },
};
