import * as P from '../parts.js';
import { baseItems, ppeStep, notebookStep, f, table, eq, SIM } from './common.js';

export default {
  title: 'Moisture, volatile matter and ash in coal', tag: 'Fuel analysis · Proximate analysis', hue: 18,
  blurb: 'Weigh a coal sample, then heat it in the oven and furnaces to find percentage moisture, volatile matter and ash.',
  build(c) {
    const Y = c.Y, T = c.T; baseItems(c);
    const bal = c.deco(P.balance(), -0.78, Y, -0.1); const scr = bal.userData.screen.userData;
    c.zone('z_pan', -0.78, Y + 0.066, -0.12, 0.08, 0.06, 0.08, 'Place on pan');
    const des = c.deco(P.desiccator(), -0.38, Y, -0.3); c.zone('z_des', -0.38, Y + 0.085, -0.3, 0.08, 0.06, 0.08, 'Desiccator');
    const ovn = c.add('oven', P.oven(), 0.08, Y, -0.34, { label: 'Electric oven' });
    const muf = c.add('muf', P.muffle(), 0.64, Y, -0.34, { label: 'Muffle furnace' });
    c.zone('z_oven', 0.08, Y + 0.148, -0.34 + 0.17, 0.08, 0.06, 0.07, 'Oven shelf');
    c.zone('z_muf', 0.64, Y + 0.083, -0.34 + 0.17, 0.08, 0.06, 0.07, 'Furnace ledge');
    const cru = c.add('cru', P.crucible(false), -0.5, Y, 0.0, { label: 'Crucible' });
    c.add('coal', P.solidJar({ r: 0.04, h: 0.09, text: ['Coal', 'crushed'], color: 0x1c1c1e }), -0.28, Y, 0.0, { label: 'Coal sample' });
    c.deco(P.beaker(0.035, 0.09, '100 mL'), 0.3, Y, 0.05); c.add('tongs', P.tongs(), 0.3, Y + 0.005, 0.05, { label: 'Crucible tongs' });
    const ud = cru.userData; let mass = 18.42; const m0 = 18.42;
    const show = (g) => scr.set(g.toFixed(3) + ' g');
    const door = (o, open) => c.run(900, (t) => o.userData.open(open ? t : 1 - t));
    const stage = (key, o) => [
      { t: `Open the ${o.name}`, i: `Click the <b>${o.name}</b> to open its door.`, kind: 'click', target: o.id, hint: `open the ${o.name}`, tt: o.tt, th: o.th, fx: (cc) => door(o.obj, true) },
      { t: `Load the crucible`, i: `Pick up the <b>crucible</b> and place it on the <b>${o.name}</b> shelf. The door closes automatically.`, kind: 'move', item: 'cru', to: o.zone, hint: `put the crucible in the ${o.name}`, tt: o.tt, th: o.th,
        fx: async (cc) => { await door(o.obj, false); o.obj.userData.screen.userData.set(`${o.temp}°C`); } },
      { t: `Heat: ${o.heat}`, i: `<b>Hold LMB</b> on the <b>${o.name}</b> to heat for the specified time (time-lapse).`, kind: 'hold', target: o.id, secs: 3.5, hint: `hold on the ${o.name}`, tt: o.tt2, th: o.th2,
        tick: (cc, p) => { const sc = o.obj.userData.screen.userData, t = Math.round(25 + (o.temp - 25) * Math.min(1, p * 1.5)); sc.set(`${t}°C`, `${Math.round(p * o.mins)} min`); if (o.id === 'muf') { const gl = o.obj.userData.glow.material; gl.color.set(new T.Color(0x120805).lerp(new T.Color(0xff5a14), Math.min(1, p * 1.4))); } },
        fx: async (cc) => { o.obj.userData.screen.userData.set(`${o.temp}°C`, 'DONE'); await cc.wait(400); await door(o.obj, true); if (o.id === 'muf') o.obj.userData.glow.material.color.set(0x7a2a0a); } },
      { t: 'Transfer to the desiccator', i: 'Pick up the <b>tongs</b> and move the <b>hot crucible</b> to the desiccator to cool.', kind: 'use', item: 'tongs', on: 'cru', hint: 'lift the hot crucible with the tongs', tt: 'Cooling in a desiccator', th: '<p>Crucibles and furnace contents stay dangerously hot — handle only with tongs.</p><p>The desiccator contains anhydrous calcium chloride, which keeps the sample from re-absorbing moisture while it cools, so the weighing is accurate.</p>',
        fx: async (cc) => { await cc.moveTo('cru', new T.Vector3(-0.38, Y + 0.085, -0.3), 700); if (o.id === 'muf') o.obj.userData.glow.material.color.set(0x120805); o.obj.userData.screen.userData.set('25°C'); scr.set('cooling…'); await door(o.obj, false); await cc.wait(900); } },
      { t: 'Weigh the cooled crucible', i: 'Pick up the cooled <b>crucible</b> and place it on the <b>balance pan</b>.', kind: 'move', item: 'cru', to: 'z_pan', hint: 'weigh the crucible', tt: o.tt3, th: o.th3,
        fx: async (cc) => { await cc.wait(250); mass = o.after; show(mass); await cc.wait(500); } },
    ];
    const OV = { id: 'oven', name: 'oven', obj: ovn, zone: 'z_oven', temp: 105, mins: 60, heat: '105 °C, 1 hour',
      tt: 'Moisture determination', th: '<p>Heat the sample in the electric oven at the temperature and duration stated in the manual. Moisture evaporates; the mass loss gives % moisture.</p>',
      tt2: 'Moisture driven off', th2: '<p>At ~105 °C (just above water\'s boiling point) free moisture leaves the coal.</p>' + eq('% Moisture = (loss in mass / mass of coal taken) × 100'),
      tt3: 'Weighing', th3: '<p>Weigh a dry, cooled crucible each time. The loss in mass is moisture.</p>', after: 19.388 };
    const VM = { id: 'muf', name: 'muffle furnace', obj: muf, zone: 'z_muf', temp: 925, mins: 7, heat: '925 °C, 7 min (lid on)',
      tt: 'Volatile matter', th: '<p>With the lid on — restricted air — the dried coal is heated at the manual\'s specified temperature, driving off volatile combustible matter.</p>',
      tt2: 'Devolatilisation', th2: '<p>Heating in restricted air expels volatile matter (hydrocarbons, CO, H₂, …) without burning the fixed carbon.</p>' + eq('% VM = (loss in mass on heating / mass of coal taken) × 100') + '<p class="warn">Use exactly the manual\'s temperature and time.</p>',
      tt3: 'Weighing', th3: '<p>The additional mass loss (after the moisture correction) is the volatile matter.</p>', after: 19.142 };
    const AS = { id: 'muf', name: 'muffle furnace', obj: muf, zone: 'z_muf', temp: 700, mins: 60, heat: '700 °C, until constant mass (lid off)',
      tt: 'Ash', th: '<p>Heat the residue with the lid removed and free air supply until all combustible material has burnt away.</p>',
      tt2: 'Burning off carbon', th2: '<p>Carbonaceous matter burns to CO₂, leaving inorganic mineral ash:</p>' + eq('C + O₂ → CO₂   (ash = mineral residue)') + eq('% Ash = (mass of residue / mass of coal taken) × 100'),
      tt3: 'Weighing', th3: '<p>The grey / pale / reddish residue is the ash. Record the actual colour observed.</p>', after: 18.504 };

    const steps = [
      ppeStep('Do not improvise heating temperatures or times. Crucibles and furnace contents remain dangerously hot — cool in a desiccator and handle only with tongs.'),
      { t: 'Weigh the empty crucible', i: 'Pick up the clean, dry <b>crucible</b> and place it on the <b>balance pan</b>.', kind: 'move', item: 'cru', to: 'z_pan', hint: 'weigh the empty crucible', tt: 'Initial mass', th: '<p>An accurate initial mass is needed to calculate percentages.</p>',
        fx: async (cc) => { await cc.wait(300); show(m0); await cc.wait(500); } },
      { t: 'Add the coal sample', i: 'Pick up the <b>coal jar</b> and tip about <b>1 g</b> of coal into the crucible.', kind: 'use', item: 'coal', on: 'cru', hint: 'add coal to the crucible', tt: 'Coal sample', th: '<p>Coal is a black to dark-brown, brittle solid, crushed to the size specified by the manual. Record the combined mass.</p>',
        fx: async (cc) => { ud.coal.visible = true; await cc.run(1200, (t) => scr.set((m0 + t).toFixed(3) + ' g')); show(m0 + 1); } },
      ...stage('m', OV),
      { t: 'Cover the crucible', i: 'Click the <b>crucible</b> to put its lid on for the volatile-matter test.', kind: 'click', target: 'cru', hint: 'put the lid on', tt: 'Why a lid?', th: '<p>The lid restricts air so the volatile matter is driven off but the carbon does not burn.</p>', fx: async () => { ud.lid.visible = true; await c.wait(400); } },
      ...stage('v', VM),
      { t: 'Remove the lid', i: 'Click the <b>crucible</b> to take the lid off for the ash test.', kind: 'click', target: 'cru', hint: 'take the lid off', tt: 'Free air', th: '<p>For ash the carbon must burn completely, so the lid is removed and air can enter freely.</p>', fx: async () => { ud.lid.visible = false; await c.wait(400); } },
      ...stage('a', AS),
      notebookStep({ t: 'Calculate the percentages', tt: 'Calculations', th: '<p>Keep each reading distinct and use the manual\'s mass definitions.</p>' + eq('% moisture = (W₁ − W₂)/W × 100') + eq('% VM = (W₂ − W₃)/W × 100') + eq('% ash = (W₄ − W₀)/W × 100'),
        nb: () => { const mo = (19.42 - 19.388) / 1 * 100, vm = (19.388 - 19.142) / 1 * 100, ash = (18.504 - m0) / 1 * 100; c.result = { mo, vm, ash };
          return { title: 'Proximate analysis', html: table(['Reading', 'Mass (g)'], [['Empty crucible W₀', '18.420'], ['Crucible + coal', '19.420'], ['After oven (moisture)', '19.388'], ['After VM heating', '19.142'], ['After ashing W₄', '18.504']]) +
            `<p>Moisture = <b>${mo.toFixed(1)} %</b></p><p>Volatile matter = <b>${vm.toFixed(1)} %</b></p><p>Ash = <b>${ash.toFixed(1)} %</b> (grey-white residue)</p><p>Fixed carbon (by difference) = ${(100 - mo - vm - ash).toFixed(1)} %</p>` + SIM }; } }),
    ];
    return {
      steps,
      apparatus: [{ n: 'Crucible with lid', d: 'Porcelain / silica', ids: ['cru'], c: '#f1f5f9' }, { n: 'Analytical balance', d: 'Weigh to 0.001 g', ids: ['z_pan'], c: '#e2e8f0' }, { n: 'Electric oven', d: 'Moisture test', ids: ['oven', 'z_oven'], c: '#cbd5e1' },
        { n: 'Muffle furnace', d: 'VM and ash tests', ids: ['muf', 'z_muf'], c: '#64748b' }, { n: 'Desiccator', d: 'Cools without moisture pick-up', ids: ['z_des'], c: '#a5f3fc' }, { n: 'Tongs', d: 'Handle hot crucible', ids: ['tongs'], c: '#94a3b8' },
        { n: 'Safety goggles', d: 'PPE', ids: ['goggles'], c: '#3b82f6' }, { n: 'Lab notebook', d: 'Calculations', ids: ['notebook'], c: '#fbbf24' }],
      chemicals: [{ n: 'Coal sample', d: 'Crushed, dark solid', ids: ['coal'], c: '#2a2a2e' }, { n: 'Anhydrous CaCl₂', d: 'Desiccant', ids: [], c: '#f8fafc' }],
      summary: () => `<p>You determined the three proximate-analysis quantities of the coal sample.</p><p class="big">Moisture ${(c.result?.mo ?? 0).toFixed(1)} % · Volatile matter ${(c.result?.vm ?? 0).toFixed(1)} % · Ash ${(c.result?.ash ?? 0).toFixed(1)} %</p><p class="note">Simulated sample — use your own weighings and the manual's heating conditions.</p>`,
    };
  },
};
