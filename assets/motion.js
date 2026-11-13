/* Multigate landing page: wireframe drawings, live map, scroll-driven sections.
   Progressive: without JS or with reduced motion the page still reads in full. */
(function () {
  'use strict';
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var clamp = function (v, a, b) { return Math.max(a, Math.min(b, v)); };
  var ease = function (t) { return 1 - Math.pow(1 - t, 3); };
  var NS = 'http://www.w3.org/2000/svg', TAU = Math.PI * 2;
  var vh = window.innerHeight;

  /* ================= Wireframe models (procedural, drawn as 3D line segments) ================= */
  function M() { this.s = []; }
  M.prototype.line = function (a, b, w) { this.s.push([a[0], a[1], a[2], b[0], b[1], b[2], w || 0]); return this; };
  M.prototype.poly = function (pts, close, w) { for (var i = 0; i < pts.length - 1; i++) this.line(pts[i], pts[i + 1], w); if (close) this.line(pts[pts.length - 1], pts[0], w); return this; };
  M.prototype.ring = function (cx, y, cz, r, n, w) { var p = []; for (var i = 0; i < n; i++) { var a = i / n * TAU; p.push([cx + Math.cos(a) * r, y, cz + Math.sin(a) * r]); } return this.poly(p, true, w); };
  M.prototype.box = function (x0, y0, z0, x1, y1, z1) {
    var c = [[x0, y0, z0], [x1, y0, z0], [x1, y0, z1], [x0, y0, z1], [x0, y1, z0], [x1, y1, z0], [x1, y1, z1], [x0, y1, z1]];
    this.poly(c.slice(0, 4), true); this.poly(c.slice(4), true); for (var i = 0; i < 4; i++) this.line(c[i], c[i + 4]); return this;
  };
  M.prototype.column = function (cx, cz, y0, y1, r, n) {
    this.ring(cx, y0, cz, r, 14); this.ring(cx, y1, cz, r * 0.86, 14); this.ring(cx, y0 + 0.04, cz, r * 1.25, 14); this.ring(cx, y1 - 0.03, cz, r * 1.2, 14);
    for (var i = 0; i < n; i++) { var a = i / n * TAU; this.line([cx + Math.cos(a) * r, y0, cz + Math.sin(a) * r], [cx + Math.cos(a) * r * 0.86, y1, cz + Math.sin(a) * r * 0.86]); } return this;
  };
  M.prototype.arch = function (x0, x1, y0, z, n) { var r = (x1 - x0) / 2, cx = (x0 + x1) / 2, p = []; for (var i = 0; i <= n; i++) { var a = Math.PI - i / n * Math.PI; p.push([cx + Math.cos(a) * r, y0 + Math.sin(a) * r, z]); } return this.poly(p); };

  var MODELS = {
    /* A globe with Africa drawn on it. Back-facing lines are hidden, so it reads as solid. */
    globe: function () {
      var m = new M(), sp = function (lon, lat, r) { var a = lon * Math.PI / 180, b = lat * Math.PI / 180; return [Math.cos(b) * Math.sin(a) * r, Math.sin(b) * r, Math.cos(b) * Math.cos(a) * r]; };
      var lat, lon, p;
      for (lat = -75; lat <= 75; lat += 7.5) { p = []; for (lon = 0; lon < 360; lon += 4) p.push(sp(lon, lat, 1)); m.poly(p, true); }
      for (lon = 0; lon < 360; lon += 7.5) { p = []; for (lat = -82; lat <= 82; lat += 4) p.push(sp(lon, lat, 1)); m.poly(p); }
      for (lat = -75; lat <= 75; lat += 7.5) for (lon = 0; lon < 360; lon += 7.5) if ((Math.round(lat / 7.5) + Math.round(lon / 7.5)) % 2 === 0) for (var k = 1; k < 4; k++) m.line(sp(lon + k * 1.9, lat, 1), sp(lon + k * 1.9, lat + 7.5, 1));
      var D = window.MG_AFRICA, LIVE = { NGA: 1, GHA: 1, BEN: 1, BFA: 1, CIV: 1, GNB: 1, MLI: 1, NER: 1, SEN: 1, TGO: 1 };
      if (D) { var sx = D.w / 71; D.c.forEach(function (c) { c.d.split('M').forEach(function (part) { if (!part) return; var pts = part.replace('Z', '').split('L').map(function (q) { var xy = q.trim().split(' '); return sp(+xy[0] / sx - 19, 38 - +xy[1] / sx, 1.012); }); m.poly(pts, true, LIVE[c.id] ? 2 : 1); }); }); }
      m.cull = true; m.view = [-0.3, 0.12, 1]; return m;
    },
    /* A colonnaded gate: Multi-gate. Steps, columns, arches, entablature and a pediment. */
    gate: function () {
      var m = new M(), n = 5, w = 0.62, x0 = -n * w / 2, i, z;
      for (i = 0; i < 3; i++) m.box(x0 - 0.5 + i * 0.1, -1 - (3 - i) * 0.07, -0.95 + i * 0.1, -x0 + 0.5 - i * 0.1, -1 - (2 - i) * 0.07, 0.95 - i * 0.1);
      [-0.55, 0.55].forEach(function (zz) {
        for (i = 0; i <= n; i++) m.column(x0 + i * w, zz, -1, 0.1, 0.085, 10);
        for (i = 0; i < n; i++) { m.arch(x0 + i * w + 0.1, x0 + (i + 1) * w - 0.1, 0.1, zz - 0.09, 12); m.arch(x0 + i * w + 0.1, x0 + (i + 1) * w - 0.1, 0.1, zz + 0.09, 12); }
      });
      m.box(x0 - 0.16, 0.44, -0.72, -x0 + 0.16, 0.56, 0.72); m.box(x0 - 0.22, 0.56, -0.78, -x0 + 0.22, 0.64, 0.78);
      for (i = 0; i < 44; i++) { var xx = x0 - 0.16 + i * ((-2 * x0 + 0.32) / 43); m.line([xx, 0.44, 0.72], [xx, 0.56, 0.72]); m.line([xx, 0.44, -0.72], [xx, 0.56, -0.72]); }
      [0.78, -0.78].forEach(function (zz) { m.poly([[x0 - 0.22, 0.64, zz], [0, 1.12, zz], [-x0 + 0.22, 0.64, zz]]); m.poly([[x0 + 0.05, 0.68, zz], [0, 1.02, zz], [-x0 - 0.05, 0.68, zz]], true); });
      m.line([0, 1.12, 0.78], [0, 1.12, -0.78]); m.line([x0 - 0.22, 0.64, 0.78], [x0 - 0.22, 0.64, -0.78]); m.line([-x0 + 0.22, 0.64, 0.78], [-x0 + 0.22, 0.64, -0.78]);
      for (z = -0.7; z <= 0.71; z += 0.14) { m.line([x0 - 0.22, 0.64, z], [0, 1.12, z]); m.line([-x0 + 0.22, 0.64, z], [0, 1.12, z]); }
      m.view = [0.5, 0.32, 1.25]; return m;
    },
    /* A round vault: a ring of columns under a ribbed dome. */
    rotunda: function () {
      var m = new M(), i, a, n = 8;
      m.ring(0, -1.02, 0, 1.12, 48); m.ring(0, -0.9, 0, 1.12, 48); m.ring(0, -0.9, 0, 1.02, 48); m.ring(0, -0.84, 0, 1.02, 48);
      for (i = 0; i < 24; i++) { a = i / 24 * TAU; m.line([Math.cos(a) * 1.12, -1.02, Math.sin(a) * 1.12], [Math.cos(a) * 1.12, -0.9, Math.sin(a) * 1.12]); }
      for (i = 0; i < n; i++) { a = i / n * TAU + 0.2; m.column(Math.cos(a) * 0.86, Math.sin(a) * 0.86, -0.84, 0.3, 0.075, 12); }
      m.ring(0, -0.84, 0, 0.3, 24); m.ring(0, -0.6, 0, 0.22, 24); m.column(0, 0, -0.6, -0.34, 0.05, 8); m.ring(0, -0.3, 0, 0.14, 20);
      [0.3, 0.36, 0.42, 0.5].forEach(function (y, k) { m.ring(0, y, 0, 1.0 + (k === 3 ? 0.04 : 0), 56); });
      for (i = 0; i < 56; i++) { a = i / 56 * TAU; m.line([Math.cos(a), 0.42, Math.sin(a)], [Math.cos(a) * 1.04, 0.5, Math.sin(a) * 1.04]); }
      var prof = [[1.04, 0.5], [0.94, 0.62], [0.76, 0.78], [0.72, 0.8], [0.72, 0.86], [0.5, 0.97], [0.24, 1.02], [0.24, 1.07], [0.16, 1.07]];
      prof.forEach(function (q) { m.ring(0, q[1], 0, q[0], 56); });
      for (i = 0; i < 56; i++) { a = i / 56 * TAU; m.line([Math.cos(a) * 1.04, 0.5, Math.sin(a) * 1.04], [Math.cos(a) * 0.76, 0.78, Math.sin(a) * 0.76]); }
      m.view = [0.4, 0.5, 1.15]; return m;
    },
    coin: function () { var m = new M(); coin(m, 0, 0, 0, 0.9, 0.16, true); m.tilt = 1.15; m.view = [0.5, 0.2, 0.95]; return m; },
    coins: function () { var m = new M(); coin(m, -0.62, 0, 0.1, 0.6, 0.12, true); coin(m, 0.62, 0, -0.1, 0.6, 0.12, true); m.poly([[-0.2, 0.5, 0], [0.2, 0.5, 0], [0.1, 0.6, 0]]); m.poly([[0.2, -0.5, 0], [-0.2, -0.5, 0], [-0.1, -0.6, 0]]); m.tilt = 1.15; m.view = [0.3, 0.2, 0.95]; return m; },
    stack: function () { var m = new M(), i; for (i = 0; i < 6; i++) coin(m, 0, -0.75 + i * 0.24, 0, 0.7, 0.2, i === 5); m.view = [0.5, 0.42, 0.95]; return m; }
  };
  function coin(m, cx, cy, cz, r, h, face) {
    var i, a; m.ring(cx, cy, cz, r, 44); m.ring(cx, cy + h, cz, r, 44);
    for (i = 0; i < 44; i++) { a = i / 44 * TAU; m.line([cx + Math.cos(a) * r, cy, cz + Math.sin(a) * r], [cx + Math.cos(a) * r, cy + h, cz + Math.sin(a) * r]); }
    if (face) { m.ring(cx, cy + h, cz, r * 0.82, 40); m.ring(cx, cy + h, cz, r * 0.3, 24); for (i = 0; i < 20; i++) { a = i / 20 * TAU; m.line([cx + Math.cos(a) * r * 0.82, cy + h, cz + Math.sin(a) * r * 0.82], [cx + Math.cos(a) * r, cy + h, cz + Math.sin(a) * r]); } }
  }

  /* ================= Renderer ================= */
  var wires = [];
  function Wire(cv) {
    var mk = MODELS[cv.dataset.model]; if (!mk) return;
    this.cv = cv; this.ctx = cv.getContext('2d'); this.m = mk(); this.color = cv.dataset.color || '#1362f5';
    var v = (cv.dataset.view || '').split(',').map(Number); this.cur = v.length === 3 ? v : this.m.view.slice(); this.to = this.cur.slice();
    this.base = this.cur.slice(); this.spin = cv.dataset.spin ? 1 : 0; this.vis = false; this.t = 0; this.clock = Math.random() * 6; this.resize();
  }
  Wire.prototype.resize = function () { var r = this.cv.getBoundingClientRect(), d = Math.min(window.devicePixelRatio || 1, 2); this.w = r.width; this.h = r.height; this.cv.width = Math.round(r.width * d); this.cv.height = Math.round(r.height * d); this.d = d; this.dirty = true; };
  Wire.prototype.draw = function () {
    var c = this.ctx, m = this.m, s = m.s, w = this.w, h = this.h, d = this.d; if (!w || !h) return;
    var ry = this.cur[0] + this.t, rx = this.cur[1], zoom = this.cur[2];
    var cy = Math.cos(ry), sy = Math.sin(ry), cx = Math.cos(rx), sx = Math.sin(rx), tz = m.tilt || 0, ct = Math.cos(tz), st = Math.sin(tz);
    var f = Math.min(w, h) * 0.42 * zoom, ox = w / 2, oy = h / 2, cam = 4.2;
    if (this.cv.classList.contains('hero__wire')) { f = h * 0.74 * zoom; ox = w * 0.7; oy = h * 0.56; }
    if (this.cv.classList.contains('cta__wire')) { ox = w * 0.58; oy = h * 0.6; f = h * 0.4 * zoom; }
    c.setTransform(d, 0, 0, d, 0, 0); c.clearRect(0, 0, w, h); c.strokeStyle = this.color; c.lineCap = 'round';
    var pass, i, q, ax, ay, az, bx, by, bz, t, pa, pb;
    for (pass = 0; pass < 3; pass++) {
      c.beginPath(); var any = false, far = [];
      for (i = 0; i < s.length; i++) {
        q = s[i]; if (q[6] !== pass) continue;
        ax = q[0]; ay = q[1]; az = q[2]; bx = q[3]; by = q[4]; bz = q[5];
        if (tz) { t = ay * ct - az * st; az = ay * st + az * ct; ay = t; t = by * ct - bz * st; bz = by * st + bz * ct; by = t; }
        t = ax * cy + az * sy; az = -ax * sy + az * cy; ax = t; t = bx * cy + bz * sy; bz = -bx * sy + bz * cy; bx = t;
        t = ay * cx - az * sx; az = ay * sx + az * cx; ay = t; t = by * cx - bz * sx; bz = by * sx + bz * cx; by = t;
        if (m.cull && (az < 0.04 || bz < 0.04)) continue;
        pa = cam / (cam - az); pb = cam / (cam - bz);
        if (!m.cull && az + bz < -0.1) { far.push(ox + ax * f * pa, oy - ay * f * pa, ox + bx * f * pb, oy - by * f * pb); continue; }
        c.moveTo(ox + ax * f * pa, oy - ay * f * pa); c.lineTo(ox + bx * f * pb, oy - by * f * pb); any = true;
      }
      c.globalAlpha = pass === 0 ? (m.cull ? 0.38 : 1) : 1; c.lineWidth = pass === 2 ? 2 : pass === 1 ? 1.1 : (m.cull ? 0.7 : 1.1); if (any) c.stroke();
      if (far.length) { c.beginPath(); for (var j = 0; j < far.length; j += 4) { c.moveTo(far[j], far[j + 1]); c.lineTo(far[j + 2], far[j + 3]); } c.globalAlpha = 0.22; c.lineWidth = 0.8; c.stroke(); }
    }
    c.globalAlpha = 1;
  };
  $$('canvas.wire').forEach(function (cv) { var w = new Wire(cv); if (w.cv) { cv._wire = w; wires.push(w); } });
  if ('IntersectionObserver' in window) {
    var wio = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.target._wire) { e.target._wire.vis = e.isIntersecting; e.target._wire.dirty = true; } }); kick(); }, { rootMargin: '120px' });
    wires.forEach(function (w) { wio.observe(w.cv); });
  } else wires.forEach(function (w) { w.vis = true; });
  var looping = false, last = 0;
  function loop(now) {
    var dt = Math.min(50, now - last) / 1000; last = now; var live = false;
    wires.forEach(function (w) {
      if (!w.vis) return; live = true;
      var k = 1 - Math.pow(0.002, dt), moved = false;
      for (var i = 0; i < 3; i++) { var dlt = w.to[i] - w.cur[i]; if (Math.abs(dlt) > 0.0005) { w.cur[i] += dlt * k; moved = true; } }
      if (!reduce) { w.clock += dt; w.t = w.spin ? w.clock * 0.5 : 0.09 * Math.sin(w.clock * 0.35); moved = true; }
      if (moved || w.dirty) { w.draw(); w.dirty = false; }
    });
    if (live && !reduce) requestAnimationFrame(loop); else { looping = false; }
  }
  function kick() { if (reduce) { wires.forEach(function (w) { w.cur = w.to.slice(); if (w.vis) w.draw(); }); return; } if (!looping) { looping = true; last = performance.now(); requestAnimationFrame(loop); } }

  /* ================= Africa map ================= */
  var XOF = ['BEN', 'BFA', 'CIV', 'GNB', 'MLI', 'NER', 'SEN', 'TGO'];
  var CUR = {
    NGN: { n: 'Nigerian naira', cs: ['NGA'], d: 'Collect, convert and pay out in naira.' },
    GHS: { n: 'Ghanaian cedi', cs: ['GHA'], d: 'Collect, convert and pay out in cedi.' },
    XOF: { n: 'West African CFA franc', cs: XOF, d: 'One currency across eight West African countries.' }
  };
  var ALL = ['NGA', 'GHA'].concat(XOF);
  CUR.USD = { n: 'US dollar', cs: ALL, d: 'Convert African currencies to and from US dollars, settled into the account you choose.' };
  var OF = {}; ['NGN', 'GHS', 'XOF'].forEach(function (k) { CUR[k].cs.forEach(function (id) { OF[id] = k; }); });

  function buildMap(host, onPick) {
    var D = window.MG_AFRICA; if (!D || !host) return null;
    var svg = document.createElementNS(NS, 'svg'); svg.setAttribute('viewBox', '0 0 ' + D.w + ' ' + D.h); svg.setAttribute('class', 'map');
    var gBase = document.createElementNS(NS, 'g'), gLive = document.createElementNS(NS, 'g'), gLbl = document.createElementNS(NS, 'g');
    svg.appendChild(gBase); svg.appendChild(gLive); svg.appendChild(gLbl);
    var els = {}, lbls = {}, names = {}, bbox = {};
    D.c.forEach(function (c) {
      var live = ALL.indexOf(c.id) > -1, p = document.createElementNS(NS, 'path'); p.setAttribute('d', c.d); p.setAttribute('class', 'c' + (live ? ' live' : '')); names[c.id] = c.n; bbox[c.id] = c.b;
      if (live) {
        p.setAttribute('tabindex', '0'); p.setAttribute('role', 'button'); p.setAttribute('aria-label', c.n + ', ' + OF[c.id]); p.dataset.id = c.id; els[c.id] = p; gLive.appendChild(p);
        var t = document.createElementNS(NS, 'text'); t.textContent = c.n; t.setAttribute('class', 'lbl'); t.setAttribute('x', (c.b[0] + c.b[2]) / 2); t.setAttribute('y', (c.b[1] + c.b[3]) / 2); lbls[c.id] = t; gLbl.appendChild(t);
      } else gBase.appendChild(p);
    });
    host.appendChild(svg);
    var box = { x: 0, y: 0, w: D.w, h: D.h }, raf = 0;
    function apply() { svg.setAttribute('viewBox', box.x + ' ' + box.y + ' ' + box.w + ' ' + box.h); var fs = box.w / (box.w < D.w * 0.6 ? 30 : 46); for (var k in lbls) lbls[k].setAttribute('font-size', fs); }
    function view(t, ms) {
      cancelAnimationFrame(raf); if (reduce || !ms) { box = t; apply(); return; }
      var f = { x: box.x, y: box.y, w: box.w, h: box.h }, s = performance.now();
      (function step(now) { var k = ease(clamp((now - s) / ms, 0, 1)); box = { x: f.x + (t.x - f.x) * k, y: f.y + (t.y - f.y) * k, w: f.w + (t.w - f.w) * k, h: f.h + (t.h - f.h) * k }; apply(); if (k < 1) raf = requestAnimationFrame(step); })(s);
    }
    apply();
    gLive.addEventListener('click', function (e) { var id = e.target.dataset && e.target.dataset.id; if (id && onPick) onPick(id); });
    gLive.addEventListener('keydown', function (e) { if ((e.key === 'Enter' || e.key === ' ') && e.target.dataset && e.target.dataset.id) { e.preventDefault(); onPick(e.target.dataset.id); } });
    return {
      names: names,
      hl: function (ids) { for (var k in els) els[k].classList.toggle('hl', ids.indexOf(k) > -1); for (var l in lbls) lbls[l].classList.toggle('on', ids.indexOf(l) > -1 && ids.length < 3); },
      sel: function (id) { for (var k in els) els[k].classList.toggle('sel', k === id); },
      zoom: function (id) {
        var b = bbox[id], w = b[2] - b[0], h = b[3] - b[1], pad = Math.max(w, h) * 0.55 + 20, ar = D.w / D.h, bw = w + pad * 2, bh = h + pad * 2;
        if (bw / bh < ar) bw = bh * ar; else bh = bw / ar;
        view({ x: (b[0] + b[2]) / 2 - bw / 2, y: (b[1] + b[3]) / 2 - bh / 2, w: bw, h: bh }, 800); for (var l in lbls) lbls[l].classList.toggle('on', l === id);
      },
      reset: function () { view({ x: 0, y: 0, w: D.w, h: D.h }, 700); for (var l in lbls) lbls[l].classList.remove('on'); }
    };
  }
  var amap = $('#amap');
  if (amap) {
    var cur = null, picked = null, tEl = $('#amTitle'), dEl = $('#amDesc'), back = $('#amBack'), chips = $$('.amap__chips button', amap);
    var DEF_T = tEl.textContent, DEF_D = dEl.textContent;
    var map = buildMap($('#amapSvg'), function (id) { pick(id); });
    var paint = function () { chips.forEach(function (b) { b.setAttribute('aria-pressed', String(b.dataset.cur === cur)); }); map.hl(cur ? CUR[cur].cs : []); map.sel(picked); };
    var text = function () { tEl.textContent = cur ? CUR[cur].n + ' (' + cur + ')' : DEF_T; dEl.textContent = cur ? CUR[cur].d + (cur === 'USD' ? '' : ' Select a country to zoom in.') : DEF_D; };
    var pick = function (id) {
      picked = id; if (!cur || CUR[cur].cs.indexOf(id) < 0) cur = OF[id]; map.zoom(id); paint();
      tEl.textContent = map.names[id]; dEl.textContent = 'Local currency: ' + OF[id] + ' (' + CUR[OF[id]].n + '). Live for collection and payout.'; back.hidden = false;
      $$('#acc > li').forEach(function (l, i) { l.classList.toggle('open', i === 0); });
    };
    chips.forEach(function (b) { b.addEventListener('click', function () { var k = b.dataset.cur; cur = cur === k ? null : k; if (picked) { picked = null; map.reset(); back.hidden = true; } paint(); text(); }); });
    back.addEventListener('click', function () { picked = null; map.reset(); back.hidden = true; paint(); text(); });
    paint();
  }

  /* ================= Counters ================= */
  var tre = $('#treasury');
  function count(el) {
    var end = parseFloat(el.dataset.count), dec = +el.dataset.dec || 0, pre = el.dataset.pre || '', suf = el.dataset.suf || '';
    var fmt = function (v) { return pre + v.toLocaleString('en-GB', { minimumFractionDigits: dec, maximumFractionDigits: dec }) + suf; };
    var s = performance.now(); (function step(now) { var k = ease(clamp((now - s) / 1700, 0, 1)); el.textContent = fmt(end * k); if (k < 1) requestAnimationFrame(step); })(s);
  }
  if (tre && 'IntersectionObserver' in window && !reduce) {
    $$('[data-count]', tre).forEach(function (e) { e.textContent = (e.dataset.pre || '') + '0' + (e.dataset.suf || ''); });
    var tio = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { tre.classList.add('in'); $$('[data-count]', tre).forEach(count); tio.disconnect(); } }); }, { threshold: 0.25 });
    tio.observe($('.tre__stats', tre));
  } else if (tre) tre.classList.add('in');

  /* ================= Testimonials ================= */
  var tm = $('#tm');
  if (tm) {
    var lis = $$('#tmList li'), ti = 0, timer = 0, MS = 6000;
    var show = function (i, user) {
      ti = (i + lis.length) % lis.length; var name = $('button', lis[ti]).textContent;
      lis.forEach(function (l, k) { l.classList.toggle('on', false); void l.offsetWidth; l.classList.toggle('on', k === ti); });
      tm.classList.add('sw');
      setTimeout(function () { $('#tmQuote .ph').textContent = '[Quote from ' + name + ' goes here. One or two sentences in the customer’s own words.]'; $('#tmCo').textContent = name; $('#tmN').textContent = ('0' + (ti + 1)).slice(-2); tm.classList.remove('sw'); }, reduce ? 0 : 320);
      clearInterval(timer); if (!reduce && !user) timer = setInterval(function () { show(ti + 1); }, MS); else if (!reduce) timer = setInterval(function () { show(ti + 1); }, MS * 2);
    };
    lis.forEach(function (l, k) { $('button', l).addEventListener('click', function () { show(k, true); }); });
    if (!reduce) timer = setInterval(function () { show(ti + 1); }, MS);
  }

  /* ================= Accordion (network today) ================= */
  $$('#acc > li > button').forEach(function (b) { b.addEventListener('click', function () { $$('#acc > li').forEach(function (l) { l.classList.toggle('open', l === b.parentNode); }); }); });

  /* ================= Clock ================= */
  var clock = $('#clock');
  if (clock) { var tick = function () { try { clock.textContent = new Date().toLocaleTimeString('en-GB', { hour: 'numeric', minute: '2-digit', hour12: true, timeZone: 'Africa/Lagos' }).replace(' ', '').toUpperCase(); } catch (e) { clock.textContent = ''; } }; tick(); setInterval(tick, 20000); }

  /* ================= Scroll-driven state ================= */
  var prog = $('#prog'), fls = $$('.fl'), sls = $$('.sl'), tabs = $('#tabs');
  var hero = $('.hero__wire'), ctaW = $('.cta__wire');
  sls.forEach(function (sl) { sl._views = (sl.dataset.views || '').split('|').map(function (v) { return v.split(',').map(Number); }); sl._items = $$('.sli', sl); sl._wire = ($('canvas.wire', sl) || {})._wire; });
  var ticking = false;
  function frame() {
    ticking = false; var y = window.scrollY, doc = document.documentElement;
    if (prog) prog.style.transform = 'scaleX(' + clamp(y / Math.max(1, doc.scrollHeight - vh), 0, 1) + ')';
    /* hero globe turns and sinks a little as you leave it */
    if (hero && hero._wire) { var hp = clamp(y / vh, 0, 1.2); hero._wire.to = [hero._wire.base[0] + hp * 0.5, hero._wire.base[1] + hp * 0.18, hero._wire.base[2]]; if (!reduce) hero.style.transform = 'translate3d(0,' + (y * 0.18).toFixed(1) + 'px,0)'; }
    if (ctaW && ctaW._wire) { var cr = ctaW.getBoundingClientRect(), cp = clamp(1 - cr.top / vh, 0, 1.6); ctaW._wire.to = [ctaW._wire.base[0] + cp * 0.35, ctaW._wire.base[1], ctaW._wire.base[2]]; }
    /* sticky lists: the item nearest the middle is active, and the drawing turns to its view */
    sls.forEach(function (sl) {
      var best = 0, bd = 1e9; sl._items.forEach(function (it, i) { var r = it.getBoundingClientRect(), d = Math.abs(r.top + Math.min(r.height, 220) / 2 - vh * 0.5); if (d < bd) { bd = d; best = i; } });
      sl._items.forEach(function (it, i) { it.classList.toggle('is-on', reduce || i === best); });
      if (sl._wire && sl._views[best] && sl._views[best].length === 3) sl._wire.to = sl._views[best].slice();
    });
    /* reveal lists: lit once reached */
    fls.forEach(function (c) { $$('.fo', c).forEach(function (it) { it.classList.toggle('is-on', reduce || it.getBoundingClientRect().top < vh * 0.62); }); });
    /* platform tabs: left text follows the panel in view */
    if (tabs) {
      var ps = $$('.tp', tabs), ts = $$('.tabs__t', tabs), ds = $$('#tabDash i'), bi = 0, bdist = 1e9;
      ps.forEach(function (p, i) { var r = p.getBoundingClientRect(), d = Math.abs(r.top + r.height / 2 - vh * 0.55); if (d < bdist) { bdist = d; bi = i; } var iso = p.firstElementChild; if (iso && !reduce) iso.style.setProperty('--py', (clamp((r.top - vh * 0.2) * 0.14, -60, 120)).toFixed(1)); });
      ts.forEach(function (t, i) { t.classList.toggle('on', i === bi); }); ds.forEach(function (d, i) { d.classList.toggle('on', i === bi); });
    }
    kick();
  }
  function req() { if (!ticking) { ticking = true; requestAnimationFrame(frame); } }
  window.addEventListener('scroll', req, { passive: true });
  window.addEventListener('resize', function () { vh = window.innerHeight; wires.forEach(function (w) { w.resize(); }); req(); });
  window.addEventListener('load', function () { wires.forEach(function (w) { w.resize(); }); frame(); });
  frame();
})();
