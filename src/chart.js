// Minimal canvas line/scatter chart for the lab notebook.
export function drawChart(cv, { xs, ys, series, xlabel = '', ylabel = '', lines = [], title = '' }) {
  const dpr = 2, W = 560, H = 300; cv.width = W * dpr; cv.height = H * dpr; cv.style.width = '100%'; cv.style.maxWidth = W + 'px';
  const g = cv.getContext('2d'); g.scale(dpr, dpr);
  g.fillStyle = '#0b1b22'; g.fillRect(0, 0, W, H);
  const all = series.flatMap((s) => s.pts), pad = { l: 56, r: 16, t: 28, b: 42 };
  let [x0, x1] = xs || [Math.min(...all.map((p) => p[0])), Math.max(...all.map((p) => p[0]))];
  let [y0, y1] = ys || [Math.min(...all.map((p) => p[1])), Math.max(...all.map((p) => p[1]))];
  if (y0 === y1) { y0 -= 1; y1 += 1; }
  const X = (x) => pad.l + ((x - x0) / (x1 - x0)) * (W - pad.l - pad.r), Y = (y) => H - pad.b - ((y - y0) / (y1 - y0)) * (H - pad.t - pad.b);
  g.strokeStyle = '#1f3a46'; g.fillStyle = '#8fb3c2'; g.font = '11px sans-serif'; g.lineWidth = 1;
  for (let i = 0; i <= 5; i++) {
    const xv = x0 + ((x1 - x0) * i) / 5, yv = y0 + ((y1 - y0) * i) / 5;
    g.beginPath(); g.moveTo(X(xv), pad.t); g.lineTo(X(xv), H - pad.b); g.moveTo(pad.l, Y(yv)); g.lineTo(W - pad.r, Y(yv)); g.stroke();
    g.textAlign = 'center'; g.fillText(+xv.toPrecision(3), X(xv), H - pad.b + 14); g.textAlign = 'right'; g.fillText(+yv.toPrecision(3), pad.l - 6, Y(yv) + 4);
  }
  g.fillStyle = '#cfe9f2'; g.font = '12px sans-serif'; g.textAlign = 'center'; g.fillText(xlabel, (W + pad.l) / 2, H - 6);
  g.save(); g.translate(14, H / 2); g.rotate(-Math.PI / 2); g.fillText(ylabel, 0, 0); g.restore();
  if (title) { g.textAlign = 'left'; g.fillText(title, pad.l, 16); }
  lines.forEach((l) => { g.strokeStyle = l.color || '#f59e0b'; g.setLineDash(l.dash ? [5, 4] : []); g.lineWidth = 1.5; g.beginPath(); g.moveTo(X(l.x1), Y(l.y1)); g.lineTo(X(l.x2), Y(l.y2)); g.stroke(); g.setLineDash([]); });
  series.forEach((s) => {
    g.strokeStyle = s.color || '#22d3ee'; g.fillStyle = s.color || '#22d3ee'; g.lineWidth = 2;
    if (s.line !== false) { g.beginPath(); s.pts.forEach((p, i) => (i ? g.lineTo(X(p[0]), Y(p[1])) : g.moveTo(X(p[0]), Y(p[1])))); g.stroke(); }
    if (s.dots !== false) s.pts.forEach((p) => { g.beginPath(); g.arc(X(p[0]), Y(p[1]), 3.2, 0, 7); g.fill(); });
  });
  let ly = pad.t + 4; series.forEach((s) => { if (!s.label) return; g.fillStyle = s.color || '#22d3ee'; g.fillRect(W - pad.r - 130, ly, 10, 3); g.fillStyle = '#cfe9f2'; g.textAlign = 'left'; g.fillText(s.label, W - pad.r - 115, ly + 5); ly += 15; });
}
