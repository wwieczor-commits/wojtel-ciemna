/* WOJTEL – animowany tomograf (wariant ciemny) */
(function () {
  'use strict';
  var d = document, NS = 'http://www.w3.org/2000/svg';
  var grid = d.getElementById('tomoGrid'), ring = d.getElementById('tomoRing');
  if (!grid || !ring) return;
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  function el(n, a) { var e = d.createElementNS(NS, n); for (var k in a) e.setAttribute(k, a[k]); return e; }
  for (var i = 0; i < 16; i++) {
    var a = i / 16 * Math.PI * 2, x = 200 + 138 * Math.cos(a), y = 200 + 138 * Math.sin(a);
    ring.appendChild(el('rect', { x: (x - 6).toFixed(1), y: (y - 6).toFixed(1), width: 12, height: 12, rx: 2, transform: 'rotate(' + (a * 180 / Math.PI).toFixed(1) + ' ' + x.toFixed(1) + ' ' + y.toFixed(1) + ')' }));
  }
  var cells = [], N = 10, S = 20, X0 = 100, Y0 = 100;
  for (var r = 0; r < N; r++) for (var c = 0; c < N; c++) {
    var cx = X0 + c * S + S / 2, cy = Y0 + r * S + S / 2;
    if ((cx - 200) * (cx - 200) + (cy - 200) * (cy - 200) > 100 * 100) continue;
    var rc = el('rect', { x: X0 + c * S, y: Y0 + r * S, width: S - 1, height: S - 1, fill: '#22304A' });
    grid.appendChild(rc); cells.push({ e: rc, x: cx, y: cy });
  }
  var A = d.getElementById('tomoA'), T = d.getElementById('tomoT'), ang = d.getElementById('tomoAng'), conf = d.getElementById('tomoConf');
  function mix(a, b, t) { return Math.round(a + (b - a) * t); }
  function frame(t) {
    var ax = 200 + 42 * Math.sin(t * 0.42), ay = 200 + 34 * Math.sin(t * 0.67 + 1);
    cells.forEach(function (k) {
      var dd = ((k.x - ax) * (k.x - ax) + (k.y - ay) * (k.y - ay)) / 900;
      var v = Math.exp(-dd), base = 0.25 + 0.2 * Math.sin(k.x * 0.05 + k.y * 0.04 + t * 0.6);
      var col = v > 0.35 ? 'rgb(' + mix(52, 224, v) + ',' + mix(71, 69, v) + ',' + mix(106, 43, v) + ')' : 'rgb(' + mix(34, 74, base) + ',' + mix(48, 98, base) + ',' + mix(74, 144, base) + ')';
      k.e.setAttribute('fill', col);
    });
    A.setAttribute('cx', ax.toFixed(1)); A.setAttribute('cy', ay.toFixed(1));
    A.setAttribute('r', (26 + 6 * Math.sin(t * 3)).toFixed(1)); A.setAttribute('stroke-opacity', (0.55 + 0.45 * Math.sin(t * 3)).toFixed(2));
    T.setAttribute('x', (ax + 28).toFixed(1)); T.setAttribute('y', (ay - 26).toFixed(1));
    if (ang) ang.textContent = Math.round((t / 7 * 360) % 360) + '°';
    if (conf) conf.textContent = (0.9 + 0.08 * Math.sin(t * 1.3)).toFixed(2).replace('.', ',');
  }
  /* ilustracja statyczna – bez wirującej wiązki i pętli animacji */
  frame(1.2);
})();
