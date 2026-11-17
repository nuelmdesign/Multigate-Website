/* Payments & FX scene: a dotted globe facing Africa, currency tags and arcs that follow the scroll steps.
   Needs landmask.js. Without it, or with reduced motion, the scene shows a still frame. */
(function () {
  'use strict';
  var root = document.getElementById('gs');
  var L = window.MG_LAND;
  if (!root || !L) return;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var cv = root.querySelector('.gs__cv'), ctx = cv.getContext('2d');
  var tags = [].slice.call(root.querySelectorAll('.gt'));
  var steps = [].slice.call(root.querySelectorAll('.gb'));
  var bytes = (function (s) { var b = atob(s), a = new Uint8Array(b.length); for (var i = 0; i < b.length; i++) a[i] = b.charCodeAt(i); return a; })(L.d);
  var D2R = Math.PI / 180;

  /* Land cells as lon/lat in radians, with the unit vector precomputed */
  var pts = [];
  for (var r = 0; r < L.h; r++) for (var c = 0; c < L.w; c++) {
    var i = r * L.w + c, v = (bytes[i >> 2] >> ((i & 3) * 2)) & 3; if (!v) continue;
    var lat = (L.lat0 - r * L.step) * D2R, lon = (L.lon0 + c * L.step) * D2R;
    pts.push([lon, lat, v]);
  }

  /* View per step: where the globe is turned (centre lon, lat). Africa stays in view. */
  var VIEWS = [[6, -28], [12, -30], [0, -26]];
  var ARCS = { 1: [['ngn', 'usd'], ['ghs', 'usd']], 2: [['ngn', 'xof'], ['ngn', 'ghs']] };
  var SHOW = { ngn: [0, 1, 2], ghs: [0, 1, 2], xof: [0, 2], usd: [1] };
  var cur = { lon: VIEWS[0][0], lat: VIEWS[0][1] }, step = 0, w = 0, h = 0, dpr = 1, W = 0, vis = false, raf = 0, t0 = performance.now(), arcT = 0, lastStep = -1, built = {};

  tags.forEach(function (t) { built[t.dataset.id] = { el: t, ll: t.dataset.ll ? t.dataset.ll.split(',').map(Number) : null, fx: t.dataset.fx ? t.dataset.fx.split(',').map(Number) : null, dx: +t.dataset.dx || 0, dy: +t.dataset.dy || 0, x: 0, y: 0, ok: false }; });

  function size() {
    var r = root.getBoundingClientRect(); w = r.width; h = r.height; dpr = Math.min(window.devicePixelRatio || 1, 2);
    cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr);
    W = Math.max(w * 1.2, h * 0.9);
  }
  function stepNow() { for (var i = 0; i < steps.length; i++) if (steps[i].classList.contains('on')) return i; return 0; }
  /* Orthographic projection about (lon0, lat0); the globe's centre sits below the card so only the top cap shows */
  function proj(lon, lat, lon0, lat0) {
    var cl = Math.cos(lat), x = cl * Math.sin(lon - lon0), y = Math.cos(lat0) * Math.sin(lat) - Math.sin(lat0) * cl * Math.cos(lon - lon0), z = Math.sin(lat0) * Math.sin(lat) + Math.cos(lat0) * cl * Math.cos(lon - lon0);
    return [x, y, z];
  }
  function sx(p) { return w / 2 + p[0] * W * 0.5; }
  function sy(p) { return h + W * 0.12 - p[1] * W * 0.5 - W * 0.03; }

  function draw(now) {
    var s = stepNow();
    if (s !== step) { step = s; arcT = 0; }
    var tgt = VIEWS[step], k = reduce ? 1 : 0.06;
    cur.lon += (tgt[0] - cur.lon) * k; cur.lat += (tgt[1] - cur.lat) * k;
    var sway = reduce ? 0 : Math.sin((now - t0) / 4200) * 1.6, lon0 = (cur.lon + sway) * D2R, lat0 = cur.lat * D2R;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, w, h);
    var R = W * 0.5, cx = w / 2, cy = h - R * 0.1;
    /* soft disc */
    var g = ctx.createRadialGradient(cx - R * 0.2, cy - R * 0.55, R * 0.1, cx, cy, R);
    g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.75, 'rgba(238,243,253,0.92)'); g.addColorStop(1, 'rgba(214,226,248,0.9)');
    ctx.beginPath(); ctx.arc(cx, cy, R, 0, 6.2832); ctx.fillStyle = g; ctx.fill();
    ctx.lineWidth = 1; ctx.strokeStyle = 'rgba(19,98,245,0.16)'; ctx.stroke();
    /* land dots */
    var rad = Math.max(0.9, W * 0.0021);
    for (var n = 0; n < pts.length; n++) {
      var q = pts[n], p = proj(q[0], q[1], lon0, lat0); if (p[2] < 0.04) continue;
      var px = cx + p[0] * R, py = cy - p[1] * R; if (py < -4 || py > h + 4) continue;
      var edge = Math.min(1, p[2] * 2.2);
      ctx.globalAlpha = (q[2] === 2 ? 1 : 0.8) * edge;
      ctx.fillStyle = q[2] === 2 ? '#1362f5' : '#aeb9cf';
      ctx.fillRect(px - rad * (q[2] === 2 ? 1.15 : 1) * edge, py - rad * (q[2] === 2 ? 1.15 : 1) * edge, rad * 2 * (q[2] === 2 ? 1.15 : 1) * edge, rad * 2 * (q[2] === 2 ? 1.15 : 1) * edge);
    }
    ctx.globalAlpha = 1;
    /* tag positions */
    for (var id in built) {
      var b = built[id], on = SHOW[id].indexOf(step) > -1, x, y, ok = true;
      if (b.fx) { x = b.fx[0] * w; y = b.fx[1] * h; }
      else { var pp = proj(b.ll[0] * D2R, b.ll[1] * D2R, lon0, lat0); x = cx + pp[0] * R; y = cy - pp[1] * R; ok = pp[2] > 0.1 && y > 20 && y < h - 10; }
      b.x = x; b.y = y; b.ok = ok;
      b.el.style.transform = 'translate(' + (x + b.dx).toFixed(1) + 'px,' + (y + b.dy).toFixed(1) + 'px) translate(-50%,-100%)';
      b.el.classList.toggle('show', on && ok);
      b.el.classList.toggle('past', !on && ok && (id !== 'usd'));
      if (b.ll) { var m = b.el.nextElementSibling; if (m && m.classList.contains('gm')) { m.style.transform = 'translate(' + x.toFixed(1) + 'px,' + y.toFixed(1) + 'px) translate(-50%,-50%)'; m.classList.toggle('show', ok && (on || true)); } }
    }
    /* arcs */
    var list = ARCS[step] || [];
    arcT = reduce ? 1 : Math.min(1, arcT + 0.018);
    list.forEach(function (pair, idx) {
      var a = built[pair[0]], z = built[pair[1]]; if (!a.ok || !z.ok) return;
      var ax = a.x, ay = a.y, bx = z.x, by = z.y + 4, mx = (ax + bx) / 2, my = Math.min(ay, by) - Math.abs(bx - ax) * 0.35 - 30;
      var e = Math.max(0, Math.min(1, (arcT * 1.25) - idx * 0.2)); e = 1 - Math.pow(1 - e, 3); if (e <= 0) return;
      ctx.beginPath(); var N = 36, last;
      for (var i = 0; i <= N * e; i++) { var u = i / N, v = 1 - u, X = v * v * ax + 2 * v * u * mx + u * u * bx, Y = v * v * ay + 2 * v * u * my + u * u * by; if (i === 0) ctx.moveTo(X, Y); else ctx.lineTo(X, Y); last = [X, Y]; }
      ctx.strokeStyle = '#0b1a38'; ctx.lineWidth = 1.6; ctx.lineCap = 'round'; ctx.stroke();
      if (last) { ctx.beginPath(); ctx.arc(last[0], last[1], 3, 0, 6.2832); ctx.fillStyle = '#1362f5'; ctx.fill(); }
    });
  }
  function loop(now) { draw(now); raf = 0; if (vis && !reduce) raf = requestAnimationFrame(loop); }
  function kick() { if (!raf) raf = requestAnimationFrame(loop); }

  size();
  if ('IntersectionObserver' in window) new IntersectionObserver(function (es) { vis = es[0].isIntersecting; if (vis) kick(); }, { rootMargin: '120px' }).observe(root); else { vis = true; kick(); }
  window.addEventListener('resize', function () { size(); kick(); });
  var mo = new MutationObserver(function () { arcT = 0; kick(); });
  steps.forEach(function (el) { mo.observe(el, { attributes: true, attributeFilter: ['class'] }); });
  draw(performance.now());
})();
