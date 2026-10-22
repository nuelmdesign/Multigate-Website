(function () {
  'use strict';
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var ease = function (t) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; };
  var easeOut = function (t) { return 1 - Math.pow(1 - t, 4); };

  /* ---------- Reveal on scroll ---------- */
  var revealEls = $$('.rv, .chart, .steps, .lines li');
  if ('IntersectionObserver' in window && !reduce) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    revealEls.forEach(function (el) { io.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add('in'); });
  }

  /* ---------- Nav ---------- */
  var nav = $('#nav');
  var onScroll = function () { nav.classList.toggle('is-scrolled', window.scrollY > 24); };
  onScroll(); window.addEventListener('scroll', onScroll, { passive: true });
  var tog = $('#navToggle'), panel = $('#navPanel');
  tog.addEventListener('click', function () {
    var open = tog.getAttribute('aria-expanded') !== 'true';
    tog.setAttribute('aria-expanded', open); panel.classList.toggle('open', open);
  });
  $$('a', panel).forEach(function (a) { a.addEventListener('click', function () { tog.setAttribute('aria-expanded', 'false'); panel.classList.remove('open'); }); });

  /* ---------- Map data ---------- */
  var M = window.MG_MAP, pts = [];
  if (M) {
    for (var r = 0; r < M.rows.length; r++) {
      var row = M.rows[r], lat = M.lat0 - r * M.step;
      for (var c = 0; c < row.length; c++) {
        var ch = row.charCodeAt(c) - 48; // '.'=-2 none, 1 land, 2 live, 3 africa
        if (ch < 1 || ch > 3) continue;
        var lon = M.lon0 + c * M.step;
        pts.push({ lat: lat, lon: lon, k: ch });
      }
    }
  }
  var D = Math.PI / 180;
  pts.forEach(function (p) { p.sl = Math.sin(p.lat * D); p.cl = Math.cos(p.lat * D); p.lr = p.lon * D; });

  /* ---------- Globe ---------- */
  var targets = [
    { n: 'Nigeria', lon: 8, lat: 9.5, t: 'Live' },
    { n: 'Ghana', lon: -1.2, lat: 7.9, t: 'Live' },
    { n: 'XOF markets', lon: -4, lat: 12, t: 'Live' },
    { n: 'London', lon: -0.12, lat: 51.5, t: 'Multigate office', office: true },
    { n: 'Abu Dhabi', lon: 54.4, lat: 24.5, t: 'Multigate office', office: true },
    { n: 'Port Louis', lon: 57.5, lat: -20.2, t: 'Multigate office', office: true },
    { n: 'Toronto', lon: -79.4, lat: 43.65, t: 'Multigate office', office: true }
  ];
  var offices = targets.filter(function (t) { return t.office; });
  var gEl = $('#globe'), gc = $('#globeCanvas'), gx = gc.getContext('2d');
  var chip = $('#globeChip'), pager = $('#pager');
  var cam = { lon: targets[0].lon, lat: targets[0].lat - 38 };
  var from = null, to = null, tweenStart = 0, idx = 0, auto = !reduce, lastSwitch = 0, pauseUntil = 0, visible = true, gW = 0, dpr = 1, drag = null;
  var norm = function (a) { a = ((a + 180) % 360 + 360) % 360 - 180; return a; };
  var camFor = function (t) { return { lon: t.lon, lat: Math.max(-55, Math.min(60, t.lat - 38)) }; };

  targets.forEach(function (t, i) {
    var b = document.createElement('button'); b.type = 'button'; b.setAttribute('aria-label', t.n + ', ' + t.t);
    b.addEventListener('click', function () { go(i); pauseUntil = performance.now() + 9000; });
    pager.appendChild(b);
  });
  function setChip() {
    var t = targets[idx];
    chip.innerHTML = '<i class="' + (t.office ? 'office' : '') + '"></i><b>' + t.n + '</b> · ' + t.t;
    $$('button', pager).forEach(function (b, i) { b.setAttribute('aria-current', i === idx ? 'true' : 'false'); });
  }
  function go(i) {
    idx = i; setChip();
    from = { lon: cam.lon, lat: cam.lat }; to = camFor(targets[i]);
    var d = norm(to.lon - from.lon); to.lon = from.lon + d;
    tweenStart = performance.now();
    if (reduce) { cam.lon = to.lon; cam.lat = to.lat; from = to = null; }
  }
  setChip();

  function sizeGlobe() {
    var r = gEl.getBoundingClientRect();
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    gW = r.width;
    gc.width = Math.round(gW * dpr); gc.height = Math.round(gW * dpr);
  }

  function project(lonR, latSin, latCos, l0, s0, c0, R, cx, cy) {
    var dl = lonR - l0, cdl = Math.cos(dl);
    var cosc = s0 * latSin + c0 * latCos * cdl;
    return { v: cosc, x: cx + R * latCos * Math.sin(dl), y: cy - R * (c0 * latSin - s0 * latCos * cdl) };
  }

  function drawGlobe(now) {
    var W = gc.width, R = W * 0.5 * 0.965, cx = W / 2, cy = W / 2;
    var l0 = cam.lon * D, ph0 = cam.lat * D, s0 = Math.sin(ph0), c0 = Math.cos(ph0);
    gx.clearRect(0, 0, W, W);
    // sphere
    gx.beginPath(); gx.arc(cx, cy, R, 0, 6.2832); gx.fillStyle = '#faf9f6'; gx.fill();
    gx.lineWidth = 1.2 * dpr; gx.strokeStyle = 'rgba(28,28,26,0.28)'; gx.stroke();
    // graticule
    gx.lineWidth = 1 * dpr; gx.strokeStyle = 'rgba(28,28,26,0.075)';
    var a, b, p, started;
    for (a = -75; a <= 75; a += 15) {
      gx.beginPath(); started = false;
      for (b = -180; b <= 180; b += 3) {
        p = project(b * D, Math.sin(a * D), Math.cos(a * D), l0, s0, c0, R, cx, cy);
        if (p.v > 0) { if (!started) { gx.moveTo(p.x, p.y); started = true; } else gx.lineTo(p.x, p.y); } else started = false;
      }
      gx.stroke();
    }
    for (b = -180; b < 180; b += 15) {
      gx.beginPath(); started = false;
      for (a = -90; a <= 90; a += 3) {
        p = project(b * D, Math.sin(a * D), Math.cos(a * D), l0, s0, c0, R, cx, cy);
        if (p.v > 0) { if (!started) { gx.moveTo(p.x, p.y); started = true; } else gx.lineTo(p.x, p.y); } else started = false;
      }
      gx.stroke();
    }
    // land dots
    var base = R / 330, i, q, rad;
    for (i = 0; i < pts.length; i++) {
      q = pts[i];
      p = project(q.lr, q.sl, q.cl, l0, s0, c0, R, cx, cy);
      if (p.v <= 0.02) continue;
      rad = base * Math.sqrt(0.35 + 0.65 * p.v);
      if (q.k === 2) { gx.fillStyle = '#1362f5'; rad *= 1.5; }
      else if (q.k === 3) { gx.fillStyle = 'rgba(28,28,26,0.5)'; rad *= 1.15; }
      else { gx.fillStyle = 'rgba(28,28,26,0.2)'; }
      gx.beginPath(); gx.arc(p.x, p.y, rad, 0, 6.2832); gx.fill();
    }
    // offices
    gx.font = '500 ' + Math.round(11 * dpr * (R / 640)) + 'px "JetBrains Mono", monospace';
    gx.textBaseline = 'middle';
    offices.forEach(function (o) {
      p = project(o.lon * D, Math.sin(o.lat * D), Math.cos(o.lat * D), l0, s0, c0, R, cx, cy);
      if (p.v < 0.12) return;
      var rr = 7 * dpr * (R / 640);
      gx.beginPath(); gx.arc(p.x, p.y, rr, 0, 6.2832); gx.fillStyle = '#fff'; gx.fill();
      gx.lineWidth = 2.2 * dpr; gx.strokeStyle = '#1c1c1a'; gx.stroke();
      gx.fillStyle = '#1c1c1a'; gx.fillText(o.n.toUpperCase(), p.x + rr + 8 * dpr, p.y);
    });
    // focus ring
    var t = targets[idx];
    p = project(t.lon * D, Math.sin(t.lat * D), Math.cos(t.lat * D), l0, s0, c0, R, cx, cy);
    if (p.v > 0.1 && !t.office) {
      var ph = reduce ? 0.5 : ((now / 1600) % 1);
      gx.beginPath(); gx.arc(p.x, p.y, (10 + ph * 26) * dpr * (R / 640), 0, 6.2832);
      gx.lineWidth = 1.6 * dpr; gx.strokeStyle = 'rgba(19,98,245,' + (0.7 * (1 - ph)) + ')'; gx.stroke();
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
    sizeGlobe();
    window.addEventListener('resize', sizeGlobe);
    requestAnimationFrame(function (t) { lastSwitch = t; gEl.classList.add('ready'); frame(t); });
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (e) { visible = e[0].isIntersecting; }, { threshold: 0 }).observe($('#hero'));
    }
    gEl.addEventListener('pointerdown', function (e) { drag = { x: e.clientX, y: e.clientY, lon: cam.lon, lat: cam.lat }; to = from = null; gEl.setPointerCapture(e.pointerId); });
    gEl.addEventListener('pointermove', function (e) {
      if (!drag) return;
      cam.lon = drag.lon - (e.clientX - drag.x) * 0.22;
      cam.lat = Math.max(-60, Math.min(70, drag.lat + (e.clientY - drag.y) * 0.22));
    });
    var endDrag = function () { if (drag) { drag = null; pauseUntil = performance.now() + 9000; } };
    gEl.addEventListener('pointerup', endDrag); gEl.addEventListener('pointercancel', endDrag);
  }

  /* ---------- Africa flat map ---------- */
  var aEl = $('#africa'), ac = $('#africaCanvas'), ax = ac.getContext('2d');
  var LON0 = -20, LON1 = 62, LAT1 = 38, LAT0 = -37, aProg = reduce ? 1 : 0, aStart = 0, aPlay = false;
  aEl.style.aspectRatio = (LON1 - LON0) + ' / ' + (LAT1 - LAT0);
  function drawAfrica() {
    var r = aEl.getBoundingClientRect(); if (!r.width) return;
    var d = Math.min(window.devicePixelRatio || 1, 2), W = Math.round(r.width * d), H = Math.round(r.height * d);
    if (ac.width !== W || ac.height !== H) { ac.width = W; ac.height = H; }
    ax.clearRect(0, 0, W, H);
    var sx = W / (LON1 - LON0), sy = H / (LAT1 - LAT0), cell = M ? M.step * sx : 10, rad = cell * 0.2;
    var edge = aProg * (W + cell * 4), i, q, x, y, a, labels = [];
    for (i = 0; i < pts.length; i++) {
      q = pts[i];
      if (q.lon < LON0 || q.lon > LON1 || q.lat > LAT1 || q.lat < LAT0) continue;
      x = (q.lon - LON0) * sx; y = (LAT1 - q.lat) * sy;
      if (x > edge) continue;
      a = Math.min(1, (edge - x) / (cell * 3));
      if (q.k === 2) { ax.fillStyle = 'rgba(98,150,248,' + a + ')'; ax.beginPath(); ax.arc(x, y, rad * 1.5, 0, 6.2832); }
      else if (q.k === 3) { ax.fillStyle = 'rgba(255,255,255,' + 0.36 * a + ')'; ax.beginPath(); ax.arc(x, y, rad * 1.1, 0, 6.2832); }
      else { ax.fillStyle = 'rgba(255,255,255,' + 0.12 * a + ')'; ax.beginPath(); ax.arc(x, y, rad * 0.9, 0, 6.2832); }
      ax.fill();
    }
    if (aProg > 0.7) {
      var al = Math.min(1, (aProg - 0.7) / 0.3);
      var fs = Math.round(11.5 * d);
      ax.font = '500 ' + fs + 'px "JetBrains Mono", monospace'; ax.textBaseline = 'middle';
      var lab = [['NGN', 8.5, 3.2], ['GHS', -1.6, 3.2], ['XOF', -13.5, 11]];
      lab.forEach(function (l) {
        var tx = (l[1] - LON0) * sx, ty = (LAT1 - l[2]) * sy, w = ax.measureText(l[0]).width + 16 * d;
        ax.fillStyle = 'rgba(11,14,20,' + 0.9 * al + ')'; ax.fillRect(tx - w / 2, ty - 11 * d, w, 22 * d);
        ax.strokeStyle = 'rgba(98,150,248,' + al + ')'; ax.lineWidth = d; ax.strokeRect(tx - w / 2, ty - 11 * d, w, 22 * d);
        ax.fillStyle = 'rgba(160,190,252,' + al + ')'; ax.textAlign = 'center'; ax.fillText(l[0], tx, ty + d * 0.5);
      });
      var px = (57.5 - LON0) * sx, py = (LAT1 + 20.2) * sy, rr = 6 * d;
      ax.beginPath(); ax.arc(px, py, rr, 0, 6.2832); ax.fillStyle = 'rgba(255,255,255,' + al + ')'; ax.fill();
      ax.lineWidth = 2 * d; ax.strokeStyle = 'rgba(11,14,20,' + al + ')'; ax.stroke();
      ax.textAlign = 'right'; ax.fillStyle = 'rgba(236,238,242,' + 0.85 * al + ')';
      ax.fillText('PORT LOUIS', px - rr - 8 * d, py);
    }
  }
  function playAfrica(now) {
    if (!aStart) aStart = now;
    aProg = Math.min(1, (now - aStart) / 1400);
    var prog = aProg; aProg = easeOut(prog); drawAfrica(); aProg = prog;
    if (prog < 1) requestAnimationFrame(playAfrica);
  }
  if (M) {
    if (reduce) { aProg = 1; drawAfrica(); }
    if ('IntersectionObserver' in window && !reduce) {
      new IntersectionObserver(function (e, o) {
        if (e[0].isIntersecting && !aPlay) { aPlay = true; requestAnimationFrame(playAfrica); o.disconnect(); }
      }, { threshold: 0.25 }).observe(aEl);
    } else { aProg = 1; drawAfrica(); }
    window.addEventListener('resize', function () { if (aProg >= 1 || reduce) drawAfrica(); });
  }

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
    var name = $('#f-name').value.trim().split(/\s+/)[0];
    $('#doneTitle').textContent = 'Thank you, ' + name + '.';
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
