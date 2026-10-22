(function () {
  'use strict';
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var D = Math.PI / 180;
  var easeOut = function (t) { return 1 - Math.pow(1 - t, 4); };
  var norm = function (a) { return ((a + 180) % 360 + 360) % 360 - 180; };

  /* ---------- Reveal on scroll ---------- */
  var revealEls = $$('.rv, .chart, .lines li, .fan');
  if ('IntersectionObserver' in window && !reduce) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    revealEls.forEach(function (el) { io.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add('in'); });
  }

  /* ---------- Nav ---------- */
  var tog = $('#navToggle'), panel = $('#navPanel');
  tog.addEventListener('click', function () {
    var open = tog.getAttribute('aria-expanded') !== 'true';
    tog.setAttribute('aria-expanded', open); panel.classList.toggle('open', open);
  });
  $$('a', panel).forEach(function (a) { a.addEventListener('click', function () { tog.setAttribute('aria-expanded', 'false'); panel.classList.remove('open'); }); });

  /* ---------- Map data: 1.5 degree dot grid ---------- */
  var M = window.MG_MAP, pts = [];
  if (M) {
    for (var r = 0; r < M.rows.length; r++) {
      var row = M.rows[r], lat = M.lat0 - r * M.step;
      for (var c = 0; c < row.length; c++) {
        var ch = row.charCodeAt(c) - 48; // 1 land, 2 live market, 3 other Africa
        if (ch < 1 || ch > 3) continue;
        pts.push({ lat: lat, lon: M.lon0 + c * M.step, k: ch });
      }
    }
  }
  pts.forEach(function (p) { p.sl = Math.sin(p.lat * D); p.cl = Math.cos(p.lat * D); p.lr = p.lon * D; });

  var offices = [
    { n: 'London', lon: -0.12, lat: 51.5 },
    { n: 'Toronto', lon: -79.4, lat: 43.65 },
    { n: 'Abu Dhabi', lon: 54.4, lat: 24.5 },
    { n: 'Port Louis', lon: 57.5, lat: -20.2 }
  ];

  /* ---------- Hero globe ---------- */
  function project(lonR, sl, cl, l0, s0, c0, R, cx, cy) {
    var dl = lonR - l0, cdl = Math.cos(dl);
    return { v: s0 * sl + c0 * cl * cdl, x: cx + R * cl * Math.sin(dl), y: cy - R * (c0 * sl - s0 * cl * cdl) };
  }
  var targets = [
    { n: 'Nigeria', lon: 8, lat: 9.5, t: 'Live' },
    { n: 'Ghana', lon: -1.2, lat: 7.9, t: 'Live' },
    { n: 'XOF markets', lon: -4, lat: 12, t: 'Live' },
    { n: 'London', lon: -0.12, lat: 51.5, t: 'Multigate office', office: true },
    { n: 'Abu Dhabi', lon: 54.4, lat: 24.5, t: 'Multigate office', office: true },
    { n: 'Port Louis', lon: 57.5, lat: -20.2, t: 'Multigate office', office: true },
    { n: 'Toronto', lon: -79.4, lat: 43.65, t: 'Multigate office', office: true }
  ];
  var gEl = $('#globe'), gc = $('#globeCanvas'), gx = gc.getContext('2d'), chip = $('#globeChip'), pager = $('#pager');
  var camFor = function (t) { return { lon: t.lon, lat: Math.max(-40, Math.min(50, t.lat * 0.55)) }; };
  var cam = camFor(targets[0]), from = null, to = null, tweenStart = 0, idx = 0, auto = !reduce, lastSwitch = 0, pauseUntil = 0, visible = true, gW = 0, dpr = 1, drag = null;
  var ease = function (t) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; };
  targets.forEach(function (t, i) {
    var b = document.createElement('button'); b.type = 'button'; b.setAttribute('aria-label', t.n + ', ' + t.t);
    b.addEventListener('click', function () { go(i); pauseUntil = performance.now() + 9000; });
    pager.appendChild(b);
  });
  function setChip() {
    var t = targets[idx];
    chip.className = 'chip' + (t.office ? ' office' : '');
    chip.innerHTML = '<b>' + t.n + '</b> · ' + t.t;
    $$('button', pager).forEach(function (b, i) { b.setAttribute('aria-current', i === idx ? 'true' : 'false'); });
  }
  function go(i) {
    idx = i; setChip();
    from = { lon: cam.lon, lat: cam.lat }; to = camFor(targets[i]);
    to.lon = from.lon + norm(to.lon - from.lon); tweenStart = performance.now();
    if (reduce) { cam.lon = to.lon; cam.lat = to.lat; from = to = null; }
  }
  setChip();
  function sizeGlobe() {
    var r = gEl.getBoundingClientRect(); dpr = Math.min(window.devicePixelRatio || 1, 2);
    if (!r.width) return; gW = r.width; gc.width = Math.round(gW * dpr); gc.height = Math.round(gW * dpr);
  }
  function drawGlobe(now) {
    var W = gc.width, R = W * 0.5 * 0.985, cx = W / 2, cy = W / 2, l0 = cam.lon * D, ph0 = cam.lat * D, s0 = Math.sin(ph0), c0 = Math.cos(ph0), p, a, b, started, i, q, rad;
    gx.clearRect(0, 0, W, W);
    gx.beginPath(); gx.arc(cx, cy, R, 0, 6.2832); gx.fillStyle = 'rgba(255,255,255,0.07)'; gx.fill();
    gx.lineWidth = 1.3 * dpr; gx.strokeStyle = 'rgba(255,255,255,0.55)'; gx.stroke();
    gx.lineWidth = 1 * dpr; gx.strokeStyle = 'rgba(255,255,255,0.16)';
    for (a = -75; a <= 75; a += 15) {
      gx.beginPath(); started = false;
      for (b = -180; b <= 180; b += 3) { p = project(b * D, Math.sin(a * D), Math.cos(a * D), l0, s0, c0, R, cx, cy); if (p.v > 0) { if (!started) { gx.moveTo(p.x, p.y); started = true; } else gx.lineTo(p.x, p.y); } else started = false; }
      gx.stroke();
    }
    for (b = -180; b < 180; b += 15) {
      gx.beginPath(); started = false;
      for (a = -90; a <= 90; a += 3) { p = project(b * D, Math.sin(a * D), Math.cos(a * D), l0, s0, c0, R, cx, cy); if (p.v > 0) { if (!started) { gx.moveTo(p.x, p.y); started = true; } else gx.lineTo(p.x, p.y); } else started = false; }
      gx.stroke();
    }
    var base = Math.max(R / 150, 1.1 * dpr);
    for (i = 0; i < pts.length; i++) {
      q = pts[i]; p = project(q.lr, q.sl, q.cl, l0, s0, c0, R, cx, cy);
      if (p.v <= 0.06) continue;
      gx.globalAlpha = Math.min(1, p.v * 2.4);
      rad = base * Math.sqrt(0.35 + 0.65 * p.v);
      if (q.k === 2) { gx.fillStyle = '#4cf6b9'; rad *= 1.6; }
      else if (q.k === 3) { gx.fillStyle = 'rgba(238,241,247,0.92)'; rad *= 1.15; }
      else { gx.fillStyle = 'rgba(255,255,255,0.4)'; }
      gx.beginPath(); gx.arc(p.x, p.y, rad, 0, 6.2832); gx.fill();
    }
    gx.globalAlpha = 1;
    gx.font = '500 ' + Math.round(11 * dpr) + 'px "JetBrains Mono", monospace'; gx.textBaseline = 'middle';
    targets.forEach(function (o) {
      if (!o.office) return;
      p = project(o.lon * D, Math.sin(o.lat * D), Math.cos(o.lat * D), l0, s0, c0, R, cx, cy);
      if (p.v < 0.12) return;
      var rr = 5 * dpr;
      gx.fillStyle = '#fff'; gx.fillRect(p.x - rr, p.y - rr, rr * 2, rr * 2);
      gx.lineWidth = 2.2 * dpr; gx.strokeStyle = '#041431'; gx.strokeRect(p.x - rr, p.y - rr, rr * 2, rr * 2);
      gx.fillStyle = '#fff';
      if (p.x > cx + R * 0.3) { gx.textAlign = 'right'; gx.fillText(o.n.toUpperCase(), p.x - rr - 8 * dpr, p.y); gx.textAlign = 'left'; }
      else gx.fillText(o.n.toUpperCase(), p.x + rr + 8 * dpr, p.y);
    });
    var t = targets[idx];
    p = project(t.lon * D, Math.sin(t.lat * D), Math.cos(t.lat * D), l0, s0, c0, R, cx, cy);
    if (p.v > 0.1 && !t.office) {
      var ph = reduce ? 0.5 : ((now / 1600) % 1);
      gx.beginPath(); gx.arc(p.x, p.y, (8 + ph * 22) * dpr, 0, 6.2832);
      gx.lineWidth = 1.6 * dpr; gx.strokeStyle = 'rgba(76,246,185,' + (0.9 * (1 - ph)) + ')'; gx.stroke();
    }
  }
  function frame(now) {
    requestAnimationFrame(frame);
    if (!visible || !gW) return;
    if (auto && !drag && !to && now > pauseUntil && now - lastSwitch > 5200) { lastSwitch = now; go((idx + 1) % targets.length); }
    if (to) {
      var k = Math.min(1, (now - tweenStart) / 2400), e = ease(k);
      cam.lon = from.lon + (to.lon - from.lon) * e; cam.lat = from.lat + (to.lat - from.lat) * e;
      if (k >= 1) { cam.lon = norm(to.lon); cam.lat = to.lat; to = from = null; lastSwitch = now; }
    }
    drawGlobe(now);
  }
  if (M) {
    sizeGlobe(); window.addEventListener('resize', sizeGlobe);
    requestAnimationFrame(function (t) { lastSwitch = t; gEl.classList.add('ready'); frame(t); });
    if ('IntersectionObserver' in window) new IntersectionObserver(function (e) { visible = e[0].isIntersecting; }, { threshold: 0 }).observe($('#hero'));
    gEl.addEventListener('pointerdown', function (e) { drag = { x: e.clientX, y: e.clientY, lon: cam.lon, lat: cam.lat }; to = from = null; gEl.setPointerCapture(e.pointerId); });
    gEl.addEventListener('pointermove', function (e) { if (!drag) return; cam.lon = drag.lon - (e.clientX - drag.x) * 0.22; cam.lat = Math.max(-60, Math.min(70, drag.lat + (e.clientY - drag.y) * 0.22)); });
    var endDrag = function () { if (drag) { drag = null; pauseUntil = performance.now() + 9000; } };
    gEl.addEventListener('pointerup', endDrag); gEl.addEventListener('pointercancel', endDrag);
  }

  /* ---------- World dot map (coverage) ---------- */
  var wEl = $('#world'), wc = $('#worldCanvas'), wx = wc.getContext('2d');
  var LON0 = -100, LON1 = 78, LAT1 = 62, LAT0 = -38, wProg = reduce ? 1 : 0, wPlayed = false, wStart = 0;
  function drawWorld() {
    var r = wEl.getBoundingClientRect(); if (!r.width) return;
    var d = Math.min(window.devicePixelRatio || 1, 2), W = Math.round(r.width * d), H = Math.round(r.height * d);
    if (wc.width !== W || wc.height !== H) { wc.width = W; wc.height = H; }
    wx.clearRect(0, 0, W, H);
    var sx = W / (LON1 - LON0), sy = H / (LAT1 - LAT0), cell = M.step * sx, sz = cell * 0.92, edge = wProg * (W + cell * 6), i, q, x, y, a;
    for (i = 0; i < pts.length; i++) {
      q = pts[i];
      if (q.lon < LON0 || q.lon > LON1 || q.lat > LAT1 || q.lat < LAT0) continue;
      x = (q.lon - LON0) * sx; y = (LAT1 - q.lat) * sy;
      if (x > edge) continue;
      a = Math.min(1, (edge - x) / (cell * 5));
      if (q.k === 2) wx.fillStyle = 'rgba(76,246,185,' + a + ')';
      else if (q.k === 3) wx.fillStyle = 'rgba(238,241,247,' + 0.92 * a + ')';
      else wx.fillStyle = 'rgba(238,241,247,' + 0.55 * a + ')';
      wx.fillRect(x - sz / 2, y - sz / 2, sz, sz);
    }
    if (wProg > 0.75) {
      var al = Math.min(1, (wProg - 0.75) / 0.25), fs = Math.round(11 * d);
      wx.font = '500 ' + fs + 'px "JetBrains Mono", monospace'; wx.textBaseline = 'middle'; wx.textAlign = 'left';
      offices.forEach(function (o) {
        var px = (o.lon - LON0) * sx, py = (LAT1 - o.lat) * sy, s = cell * 1.9;
        wx.fillStyle = 'rgba(255,255,255,' + al + ')'; wx.fillRect(px - s / 2, py - s / 2, s, s);
        wx.lineWidth = 1.5 * d; wx.strokeStyle = 'rgba(4,20,49,' + al + ')'; wx.strokeRect(px - s / 2, py - s / 2, s, s);
        var lw = wx.measureText(o.n.toUpperCase()).width; wx.fillStyle = 'rgba(4,20,49,' + 0.88 * al + ')'; wx.fillRect(px + s / 2 + 4 * d, py - 9 * d, lw + 12 * d, 18 * d); wx.fillStyle = 'rgba(255,255,255,' + al + ')'; wx.fillText(o.n.toUpperCase(), px + s / 2 + 10 * d, py);
      });
      [['NGN', 8.5, -3.6], ['GHS', -1.8, -3.6], ['XOF', -17, 20]].forEach(function (l) {
        var tx = (l[1] - LON0) * sx, ty = (LAT1 - (l[2] < 0 ? 3 : l[2])) * sy + (l[2] < 0 ? 14 * d : 0), w = wx.measureText(l[0]).width + 14 * d;
        wx.fillStyle = 'rgba(4,20,49,' + 0.9 * al + ')'; wx.fillRect(tx - w / 2, ty - 10 * d, w, 20 * d);
        wx.strokeStyle = 'rgba(76,246,185,' + al + ')'; wx.lineWidth = d; wx.strokeRect(tx - w / 2, ty - 10 * d, w, 20 * d);
        wx.fillStyle = 'rgba(76,246,185,' + al + ')'; wx.textAlign = 'center'; wx.fillText(l[0], tx, ty + 0.5 * d); wx.textAlign = 'left';
      });
    }
  }
  function playWorld(now) {
    if (!wStart) wStart = now;
    var p = Math.min(1, (now - wStart) / 1600); wProg = easeOut(p); drawWorld(); if (p < 1) requestAnimationFrame(playWorld); else wProg = 1;
  }
  if (M) {
    if ('IntersectionObserver' in window && !reduce) {
      new IntersectionObserver(function (e, o) { if (e[0].isIntersecting && !wPlayed) { wPlayed = true; requestAnimationFrame(playWorld); o.disconnect(); } }, { threshold: 0.25 }).observe(wEl);
    } else { wProg = 1; drawWorld(); }
    window.addEventListener('resize', function () { if (wProg >= 1) drawWorld(); });
  }

  /* ---------- Halftone illustrations (who we serve) ---------- */
  function lg(c, x0, y0, x1, y1, stops) { var g = c.createLinearGradient(x0, y0, x1, y1); stops.forEach(function (s) { g.addColorStop(s[0], s[1]); }); return g; }
  var gr = function (v) { v = Math.max(0, Math.min(255, v | 0)); return 'rgb(' + v + ',' + v + ',' + v + ')'; };
  var art = {
    bank: function (c, w, h) {
      var i;
      for (i = 0; i < 3; i++) { c.fillStyle = gr(110 + i * 28); c.fillRect(w * (0.14 - i * 0.03), h * (0.78 + i * 0.045), w * (0.72 + i * 0.06), h * 0.04); }
      for (i = 0; i < 5; i++) { var x = w * (0.2 + i * 0.15); c.fillStyle = lg(c, x, 0, x + w * 0.09, 0, [[0, gr(60)], [0.45, gr(250)], [1, gr(90)]]); c.fillRect(x, h * 0.37, w * 0.09, h * 0.41); }
      c.fillStyle = lg(c, 0, h * 0.31, 0, h * 0.37, [[0, gr(230)], [1, gr(120)]]); c.fillRect(w * 0.14, h * 0.31, w * 0.72, h * 0.06);
      c.fillStyle = lg(c, w * 0.12, 0, w * 0.88, 0, [[0, gr(110)], [0.5, gr(250)], [1, gr(110)]]);
      c.beginPath(); c.moveTo(w * 0.12, h * 0.31); c.lineTo(w * 0.5, h * 0.08); c.lineTo(w * 0.88, h * 0.31); c.closePath(); c.fill();
      c.fillStyle = '#000'; c.beginPath(); c.moveTo(w * 0.22, h * 0.285); c.lineTo(w * 0.5, h * 0.145); c.lineTo(w * 0.78, h * 0.285); c.closePath(); c.fill();
      c.fillStyle = gr(235); c.beginPath(); c.arc(w * 0.5, h * 0.23, h * 0.032, 0, 6.2832); c.fill();
    },
    corp: function (c, w, h) {
      var T = [{ x: 0.08, w: 0.2, h: 0.5 }, { x: 0.3, w: 0.22, h: 0.78 }, { x: 0.54, w: 0.17, h: 0.4 }, { x: 0.73, w: 0.2, h: 0.62 }], base = h * 0.9;
      T.forEach(function (t) {
        var x = w * t.x, tw = w * t.w, th = h * t.h;
        c.fillStyle = lg(c, x, 0, x + tw, 0, [[0, gr(70)], [0.55, gr(240)], [1, gr(110)]]); c.fillRect(x, base - th, tw, th);
        c.fillStyle = '#000';
        for (var yy = base - th + h * 0.04; yy < base - h * 0.04; yy += h * 0.055) for (var xx = x + tw * 0.12; xx < x + tw * 0.88; xx += tw * 0.2) c.fillRect(xx, yy, tw * 0.1, h * 0.028);
      });
      c.fillStyle = gr(240); c.fillRect(w * 0.405, h * 0.06, w * 0.01, h * 0.1);
      c.fillStyle = gr(150); c.fillRect(w * 0.04, base, w * 0.92, h * 0.015);
    },
    hub: function (c, w, h) {
      var cx = w * 0.5, cy = h * 0.5, R = h * 0.19, S = h * 0.35, i, a;
      c.strokeStyle = gr(120); c.lineWidth = h * 0.01; c.beginPath(); c.ellipse(cx, cy, w * 0.4, h * 0.34, -0.2, 0, 6.2832); c.stroke();
      c.strokeStyle = gr(150); c.lineWidth = h * 0.012;
      for (i = 0; i < 6; i++) { a = i * 1.0472 + 0.4; c.beginPath(); c.moveTo(cx, cy); c.lineTo(cx + Math.cos(a) * S * 1.18, cy + Math.sin(a) * S); c.stroke(); }
      function sph(x, y, r) { var g = c.createRadialGradient(x - r * 0.35, y - r * 0.35, r * 0.1, x, y, r); g.addColorStop(0, gr(255)); g.addColorStop(0.6, gr(150)); g.addColorStop(1, gr(25)); c.fillStyle = g; c.beginPath(); c.arc(x, y, r, 0, 6.2832); c.fill(); }
      for (i = 0; i < 6; i++) { a = i * 1.0472 + 0.4; sph(cx + Math.cos(a) * S * 1.18, cy + Math.sin(a) * S, h * 0.07); }
      sph(cx, cy, R);
    },
    coins: function (c, w, h) {
      var stacks = [{ x: 0.24, n: 3 }, { x: 0.5, n: 6 }, { x: 0.76, n: 4 }], rx = w * 0.1, ry = h * 0.038, ch = h * 0.05;
      stacks.forEach(function (s) {
        var cx = w * s.x, y = h * 0.86;
        for (var i = 0; i < s.n; i++) {
          var top = y - ch;
          c.fillStyle = lg(c, cx - rx, 0, cx + rx, 0, [[0, gr(60)], [0.5, gr(210)], [1, gr(80)]]); c.fillRect(cx - rx, top, rx * 2, ch);
          c.beginPath(); c.ellipse(cx, y, rx, ry, 0, 0, Math.PI); c.fill();
          c.fillStyle = gr(250); c.beginPath(); c.ellipse(cx, top, rx, ry, 0, 0, 6.2832); c.fill();
          c.fillStyle = gr(130); c.beginPath(); c.ellipse(cx, top, rx * 0.62, ry * 0.58, 0, 0, 6.2832); c.fill();
          y = top;
        }
      });
    }
  };
  function halftone(cv) {
    var fn = art[cv.getAttribute('data-art')]; if (!fn) return;
    var r = cv.getBoundingClientRect(), w = Math.round(r.width), h = Math.round(r.height); if (!w) return;
    var d = Math.min(window.devicePixelRatio || 1, 2), off = document.createElement('canvas'); off.width = w; off.height = h;
    var oc = off.getContext('2d'); oc.fillStyle = '#000'; oc.fillRect(0, 0, w, h); fn(oc, w, h);
    var data = oc.getImageData(0, 0, w, h).data;
    cv.width = w * d; cv.height = h * d;
    var cx = cv.getContext('2d'); cx.scale(d, d); cx.clearRect(0, 0, w, h); cx.fillStyle = cv.getAttribute('data-dot');
    var step = Math.max(6, Math.round(w / 62)), x, y, l;
    for (y = step / 2; y < h; y += step) for (x = step / 2; x < w; x += step) {
      l = data[((Math.floor(y) * w) + Math.floor(x)) * 4] / 255;
      if (l < 0.06) continue;
      cx.beginPath(); cx.arc(x, y, step * 0.52 * Math.pow(l, 0.75), 0, 6.2832); cx.fill();
    }
  }
  var arts = $$('canvas[data-art]');
  var drawArts = function () { arts.forEach(halftone); };
  drawArts(); window.addEventListener('resize', drawArts);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(drawArts);

  /* ---------- Booking modal ---------- */
  var dlg = $('#book'), form = $('#bookForm');
  function openBook(e) { if (e) e.preventDefault(); dlg.classList.remove('is-done'); if (dlg.showModal) dlg.showModal(); else dlg.setAttribute('open', ''); }
  $$('.js-book').forEach(function (a) { a.addEventListener('click', openBook); });
  $$('[data-close]', dlg).forEach(function (b) { b.addEventListener('click', function () { dlg.close(); }); });
  dlg.addEventListener('click', function (e) { if (e.target === dlg) dlg.close(); });
  if (location.hash === '#book') setTimeout(openBook, 50);
  var REQ = 'Please fill this in so we can prepare for your review.', BAD = "That email doesn't look right. Check it and try again.";
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var ok = true;
    $$('.field', form).forEach(function (f) {
      var inp = $('input[required], select[required]', f); if (!inp) return;
      var v = inp.value.trim(), msg = $('.msg', f), bad = !v;
      if (msg) msg.textContent = REQ;
      if (!bad && inp.type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) { bad = true; if (msg) msg.textContent = BAD; }
      f.classList.toggle('err', bad); if (bad) ok = false;
    });
    if (!ok) { var first = $('.field.err input, .field.err select', form); if (first) first.focus(); return; }
    $('#doneTitle').textContent = 'Thank you, ' + $('#f-name').value.trim().split(/\s+/)[0] + '.';
    dlg.classList.add('is-done');
    // Prototype: nothing is sent. Wire to the CRM or form endpoint at build.
  });
  $$('input, select', form).forEach(function (el) { el.addEventListener('input', function () { var f = el.closest('.field'); if (f) f.classList.remove('err'); }); });

  /* ---------- Cookie banner ---------- */
  var ck = $('#cookie'), seen = false;
  try { seen = localStorage.getItem('mg-cookie'); } catch (e) {}
  if (!seen) { ck.hidden = false; setTimeout(function () { ck.classList.add('show'); }, 1400); }
  $$('[data-cookie]', ck).forEach(function (b) {
    b.addEventListener('click', function () {
      try { if (b.dataset.cookie === 'all') localStorage.setItem('mg-cookie', 'all'); } catch (e) {}
      ck.classList.remove('show'); setTimeout(function () { ck.hidden = true; }, 300);
    });
  });

  /* ---------- Review mode ---------- */
  $$('[data-confirm]').forEach(function (el) { el.textContent = 'Confirm · ' + el.getAttribute('data-confirm'); });
  var rb = $('#rbtn');
  rb.addEventListener('click', function () {
    var on = rb.getAttribute('aria-pressed') !== 'true';
    rb.setAttribute('aria-pressed', on); document.body.classList.toggle('review', on);
  });
  if (/[?&]review\b/.test(location.search)) { rb.click(); }
})();
