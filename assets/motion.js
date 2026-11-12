/* Multigate landing page: map, scroll motion, counters, pinned slider.
   Everything here is progressive: without JS or with reduced motion the page reads in full. */
(function () {
  'use strict';
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var clamp = function (v, a, b) { return Math.max(a, Math.min(b, v)); };
  var ease = function (t) { return 1 - Math.pow(1 - t, 3); };
  var NS = 'http://www.w3.org/2000/svg';

  /* ---------- Africa map ---------- */
  var XOF = ['BEN', 'BFA', 'CIV', 'GNB', 'MLI', 'NER', 'SEN', 'TGO'];
  var CUR = {
    NGN: { n: 'Nigerian naira', cs: ['NGA'], d: 'Collect, convert and pay out in naira.' },
    GHS: { n: 'Ghanaian cedi', cs: ['GHA'], d: 'Collect, convert and pay out in cedi.' },
    XOF: { n: 'West African CFA franc', cs: XOF, d: 'One currency across eight West African countries.' }
  };
  var ALL = ['NGA', 'GHA'].concat(XOF);
  CUR.USD = { n: 'US dollar', cs: ALL, d: 'Convert African currencies to and from US dollars, settled into the account you choose.' };
  var OF = {};
  ['NGN', 'GHS', 'XOF'].forEach(function (k) { CUR[k].cs.forEach(function (id) { OF[id] = k; }); });

  function buildMap(host, onPick) {
    var D = window.MG_AFRICA; if (!D || !host) return null;
    var svg = document.createElementNS(NS, 'svg');
    svg.setAttribute('viewBox', '0 0 ' + D.w + ' ' + D.h);
    svg.setAttribute('class', 'map');
    var gBase = document.createElementNS(NS, 'g'), gLive = document.createElementNS(NS, 'g'), gLbl = document.createElementNS(NS, 'g');
    svg.appendChild(gBase); svg.appendChild(gLive); svg.appendChild(gLbl);
    var els = {}, lbls = {}, names = {};
    D.c.forEach(function (c) {
      var live = ALL.indexOf(c.id) > -1, p = document.createElementNS(NS, 'path');
      p.setAttribute('d', c.d); p.setAttribute('class', 'c' + (live ? ' live' : ''));
      names[c.id] = c.n;
      if (live) {
        p.setAttribute('tabindex', '0'); p.setAttribute('role', 'button'); p.setAttribute('aria-label', c.n + ', ' + OF[c.id]);
        p.dataset.id = c.id; els[c.id] = p; gLive.appendChild(p);
        var t = document.createElementNS(NS, 'text'); t.textContent = c.n; t.setAttribute('class', 'lbl');
        t.setAttribute('x', (c.b[0] + c.b[2]) / 2); t.setAttribute('y', (c.b[1] + c.b[3]) / 2); lbls[c.id] = t; gLbl.appendChild(t);
      } else gBase.appendChild(p);
    });
    host.appendChild(svg);
    var box = { x: 0, y: 0, w: D.w, h: D.h }, raf = 0, bbox = {};
    D.c.forEach(function (c) { bbox[c.id] = c.b; });
    function apply() {
      svg.setAttribute('viewBox', box.x + ' ' + box.y + ' ' + box.w + ' ' + box.h);
      var fs = box.w / (box.w < D.w * 0.6 ? 26 : 42);
      for (var k in lbls) lbls[k].setAttribute('font-size', fs);
    }
    function view(t, ms) {
      cancelAnimationFrame(raf);
      if (reduce || !ms) { box = t; apply(); return; }
      var f = { x: box.x, y: box.y, w: box.w, h: box.h }, s = performance.now();
      (function step(now) {
        var k = ease(clamp((now - s) / ms, 0, 1));
        box = { x: f.x + (t.x - f.x) * k, y: f.y + (t.y - f.y) * k, w: f.w + (t.w - f.w) * k, h: f.h + (t.h - f.h) * k };
        apply(); if (k < 1) raf = requestAnimationFrame(step);
      })(s);
    }
    var api = {
      els: els, names: names,
      hl: function (ids) { for (var k in els) els[k].classList.toggle('hl', ids.indexOf(k) > -1); svg.classList.toggle('has-hl', ids.length > 0 && ids.length < ALL.length + 1); for (var l in lbls) lbls[l].classList.toggle('on', ids.indexOf(l) > -1 && ids.length < 3); },
      sel: function (id) { for (var k in els) els[k].classList.toggle('sel', k === id); },
      zoom: function (id) {
        var b = bbox[id], w = b[2] - b[0], h = b[3] - b[1], pad = Math.max(w, h) * 0.55 + 20;
        var ar = D.w / D.h, bw = w + pad * 2, bh = h + pad * 2;
        if (bw / bh < ar) bw = bh * ar; else bh = bw / ar;
        var cx = (b[0] + b[2]) / 2, cy = (b[1] + b[3]) / 2;
        view({ x: cx - bw / 2, y: cy - bh / 2, w: bw, h: bh }, 800);
        for (var l in lbls) lbls[l].classList.toggle('on', l === id);
        svg.classList.add('zoomed');
      },
      reset: function () { view({ x: 0, y: 0, w: D.w, h: D.h }, 700); svg.classList.remove('zoomed'); for (var l in lbls) lbls[l].classList.remove('on'); }
    };
    apply();
    gLive.addEventListener('click', function (e) { var id = e.target.dataset && e.target.dataset.id; if (id && onPick) onPick(id); });
    gLive.addEventListener('keydown', function (e) { if ((e.key === 'Enter' || e.key === ' ') && e.target.dataset && e.target.dataset.id) { e.preventDefault(); onPick && onPick(e.target.dataset.id); } });
    return api;
  }

  /* Hero map */
  var amap = $('#amap');
  if (amap) {
    var cur = null, picked = null;
    var tEl = $('#amTitle'), dEl = $('#amDesc'), back = $('#amBack'), chips = $$('.amap__chips button', amap);
    var DEF_T = tEl.textContent, DEF_D = dEl.textContent;
    var map = buildMap($('#amapSvg'), function (id) { pick(id); });
    var paint = function () {
      chips.forEach(function (b) { b.setAttribute('aria-pressed', String(b.dataset.cur === cur)); });
      map.hl(cur ? CUR[cur].cs : ALL);
      map.sel(picked);
    };
    var pick = function (id) {
      picked = id; map.zoom(id); paint();
      if (!cur || CUR[cur].cs.indexOf(id) < 0) { cur = OF[id]; paint(); }
      tEl.textContent = map.names[id];
      dEl.textContent = 'Local currency: ' + OF[id] + ' (' + CUR[OF[id]].n + '). Live for collection and payout.';
      back.hidden = false;
    };
    chips.forEach(function (b) {
      b.addEventListener('click', function () {
        var k = b.dataset.cur; cur = cur === k ? null : k;
        if (picked) { picked = null; map.reset(); back.hidden = true; }
        paint();
        tEl.textContent = cur ? CUR[cur].n + ' (' + cur + ')' : DEF_T;
        dEl.textContent = cur ? CUR[cur].d + (cur === 'USD' ? '' : ' Select a country to zoom in.') : DEF_D;
      });
    });
    back.addEventListener('click', function () {
      picked = null; map.reset(); back.hidden = true; paint();
      tEl.textContent = cur ? CUR[cur].n + ' (' + cur + ')' : DEF_T;
      dEl.textContent = cur ? CUR[cur].d : DEF_D;
    });
    paint();
    if (!cur) map.hl(ALL);
  }

  /* Coverage: tabs + mini map */
  var cm = $('#covMap');
  if (cm) {
    var cc = 'NGN', tab = 'banks';
    var cmap = buildMap(cm, function (id) { cc = OF[id]; setTab('cur'); });
    var info = $('#covCur'), cchips = $$('#covChips button');
    var NAME = { NGN: 'Nigeria: Nigerian naira, live for collection and payout.', GHS: 'Ghana: Ghanaian cedi, live for collection and payout.', XOF: 'Benin, Burkina Faso, Côte d’Ivoire, Guinea-Bissau, Mali, Niger, Senegal and Togo: West African CFA franc, live for collection and payout.' };
    var paintCov = function () {
      cchips.forEach(function (b) { b.classList.toggle('on', b.dataset.cur === cc); });
      info.textContent = NAME[cc];
      cmap.hl(tab === 'cur' ? CUR[cc].cs : tab === 'jur' ? ['NGA'] : ALL);
      $$('.cp').forEach(function (p) { p.classList.toggle('on', p.dataset.p === tab); });
      $$('#acc li').forEach(function (l) { l.classList.toggle('open', l.dataset.tab === tab); });
    };
    var setTab = function (t) { tab = t; paintCov(); };
    $$('#acc li').forEach(function (l) { $('button', l).addEventListener('click', function () { setTab(l.dataset.tab); }); });
    cchips.forEach(function (b) { b.addEventListener('click', function () { cc = b.dataset.cur; paintCov(); }); });
    paintCov();
  }

  /* ---------- Scroll-driven motion ---------- */
  var vh = window.innerHeight;
  var prog = $('#prog');
  var fls = $$('.fl'), pars = [], tre = $('#treasury'), flow = $('#flow');

  /* Counters */
  function count(el) {
    var end = parseFloat(el.dataset.count), dec = +el.dataset.dec || 0, pre = el.dataset.pre || '', suf = el.dataset.suf || '';
    var fmt = function (v) { return pre + v.toLocaleString('en-GB', { minimumFractionDigits: dec, maximumFractionDigits: dec }) + suf; };
    if (reduce) { el.textContent = fmt(end); return; }
    var s = performance.now(), d = 1600;
    (function step(now) { var k = ease(clamp((now - s) / d, 0, 1)); el.textContent = fmt(end * k); if (k < 1) requestAnimationFrame(step); })(s);
  }
  if (tre && 'IntersectionObserver' in window && !reduce) {
    $$('[data-count]', tre).forEach(function (e) { e.textContent = (e.dataset.pre || '') + '0' + (e.dataset.suf || ''); });
    var tio = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { tre.classList.add('in'); $$('[data-count]', tre).forEach(count); tio.disconnect(); } });
    }, { threshold: 0.3 });
    tio.observe(tre);
  } else if (tre) { tre.classList.add('in'); }

  /* Parallax: elements with data-par drift slower than the page */
  $$('[data-par]').forEach(function (e) { pars.push({ e: e, k: parseFloat(e.dataset.par), c: 0 }); });
  function measure() {
    vh = window.innerHeight;
    pars.forEach(function (p) { p.e.style.transform = ''; var r = p.e.getBoundingClientRect(); p.c = r.top + window.scrollY + r.height / 2; });
    sol.top = solTrack ? solTrack.getBoundingClientRect().top + window.scrollY : 0;
    sol.h = solTrack ? solTrack.offsetHeight : 0;
  }

  /* Pinned solutions slider */
  var solTrack = $('#solTrack'), sol = { top: 0, h: 0, i: 0 };
  var navLis = $$('#solNav li'), panels = $$('.sol__p'), sdots = $$('#solDots i');
  function pinned() { return solTrack && !reduce && window.innerWidth > 960; }
  function setSol(i) {
    if (i === sol.i) return; sol.i = i;
    navLis.forEach(function (l, k) { l.classList.toggle('on', k === i); });
    panels.forEach(function (p, k) { p.classList.toggle('on', k === i); p.classList.toggle('past', k < i); });
    sdots.forEach(function (d, k) { d.classList.toggle('on', k === i); });
  }
  navLis.forEach(function (l, k) {
    $('button', l).addEventListener('click', function () {
      if (!pinned()) { setSol(k); return; }
      var span = sol.h - vh; window.scrollTo({ top: sol.top + span * (k + 0.5) / navLis.length, behavior: reduce ? 'auto' : 'smooth' });
    });
  });

  /* One scroll handler, rAF-throttled */
  var ticking = false;
  function frame() {
    ticking = false;
    var y = window.scrollY, doc = document.documentElement;
    if (prog) prog.style.transform = 'scaleX(' + clamp(y / (doc.scrollHeight - vh), 0, 1) + ')';
    if (!reduce) pars.forEach(function (p) { p.e.style.transform = 'translate3d(0,' + ((y + vh / 2 - p.c) * -p.k).toFixed(1) + 'px,0)'; });
    if (pinned()) { var t = clamp((y - sol.top) / Math.max(1, sol.h - vh), 0, 0.9999); setSol(Math.floor(t * navLis.length)); }
    fls.forEach(function (c) {
      var items = $$('.fo', c), line = vh * 0.66, r = c.getBoundingClientRect(), on = 0;
      items.forEach(function (it) { var a = reduce || it.getBoundingClientRect().top < line; it.classList.toggle('is-on', a); if (a) on++; });
      c.style.setProperty('--fp', clamp((line - r.top) / Math.max(1, r.height), 0, 1).toFixed(3));
    });
    if (flow) {
      var fr = flow.getBoundingClientRect(), p = clamp((vh * 0.75 - fr.top) / Math.max(1, fr.height * 0.85), 0, 1);
      flow.style.setProperty('--p', p.toFixed(3));
      $$('.mvz', flow).forEach(function (m, i) { m.classList.toggle('is-on', reduce || p > i / 3 + 0.04); });
    }
  }
  function req() { if (!ticking) { ticking = true; requestAnimationFrame(frame); } }
  window.addEventListener('scroll', req, { passive: true });
  window.addEventListener('resize', function () { measure(); req(); });
  window.addEventListener('load', function () { measure(); frame(); });
  measure(); frame();

  /* Card tilt on pointer devices */
  if (!reduce && window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
    $$('.tilt').forEach(function (c) {
      c.addEventListener('pointermove', function (e) {
        var r = c.getBoundingClientRect(), x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
        c.style.setProperty('--rx', (-y * 5).toFixed(2) + 'deg'); c.style.setProperty('--ry', (x * 6).toFixed(2) + 'deg');
      });
      c.addEventListener('pointerleave', function () { c.style.setProperty('--rx', '0deg'); c.style.setProperty('--ry', '0deg'); });
    });
  }
})();
