import * as P from '../parts.js';

export const fmtT = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${(s % 60).toFixed(1).padStart(4, '0')}`;
export const f = (x, n = 3) => Number(x).toFixed(n);
export function rng(seed = 3) { let s = seed; return () => ((s = (s * 16807) % 2147483647) / 2147483647) - 0.5; }
export function lsq(pts) {
  const n = pts.length, sx = pts.reduce((a, p) => a + p[0], 0), sy = pts.reduce((a, p) => a + p[1], 0);
  const sxx = pts.reduce((a, p) => a + p[0] * p[0], 0), sxy = pts.reduce((a, p) => a + p[0] * p[1], 0);
  const m = (n * sxy - sx * sy) / (n * sxx - sx * sx); return { m, c: (sy - m * sx) / n };
}
export const table = (head, rows) => `<table><tr>${head.map((h) => `<th>${h}</th>`).join('')}</tr>${rows.map((r) => `<tr>${r.map((c) => `<td>${c}</td>`).join('')}</tr>`).join('')}</table>`;
export const eq = (t) => `<span class="eq">${t}</span>`;
export const SIM = '<p class="note">Values shown are simulated by this game from typical data — your own measured readings must be used in the real lab.</p>';

// shared items: goggles + notebook on every bench; returns the PPE step
export function baseItems(ctx) {
  ctx.add('goggles', P.goggles(), -1.0, ctx.Y, 0.05, { label: 'Safety goggles' });
  ctx.add('notebook', P.notebook(), 1.0, ctx.Y, 0.0, { label: 'Lab notebook' });
}
export const ppeStep = (note) => ({
  t: 'Put on your safety gear', i: 'Click the <b>safety goggles</b> lying on the bench.', kind: 'click', target: 'goggles', hint: 'put on the goggles first',
  tt: 'Safety first', th: `<p>Always wear a lab coat, splash goggles and gloves, tie back long hair and wear closed shoes.</p><p class="warn">${note}</p>`,
  fx: async (c) => { c.get('goggles').visible = false; c.ppe(); await c.wait(300); },
});
export const notebookStep = (o) => ({
  t: o.t || 'Record & calculate', i: o.i || 'Click the <b>lab notebook</b> to record your readings and work out the result.', kind: 'click', target: 'notebook', hint: 'open the lab notebook',
  tt: o.tt, th: o.th, fx: async (c) => { await c.notebook(o.nb(c)); },
});
