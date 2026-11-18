/* Multigate landing page: motion layer.
   Additive on top of the pixel-exact layout. No dependencies.
   Systems: intro sequence, sticky section stacking, scroll-linked morphs, pinned horizontal scroll,
   word/line reveals, count-ups, button text-roll, WebGL dotted globe + WebGL aurora, side navigation. */
(function () {
  'use strict';
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var W = 1440, EASE = 'cubic-bezier(.2,.7,.2,1)', EASE_IO = 'cubic-bezier(.65,0,.35,1)';
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return [].slice.call((r || document).querySelectorAll(s)); };
  var clamp = function (v, a, b) { return Math.max(a, Math.min(b, v)); };
  var P = function (txt, root) { return $$('p', root).filter(function (p) { return p.textContent.trim().indexOf(txt) === 0; })[0]; };
  var ids = ['header', 'mission', 'content', 'scrollh', 'scrollv', 'footer'];
  var sec = {}; ids.forEach(function (i) { sec[i] = document.getElementById(i); });
  if (!sec.header) return;
  var inn = function (id) { return sec[id].firstElementChild; };
  var S = 1, vh = innerHeight, sy = 0;
  var fit = function () { S = Math.min(1, document.documentElement.clientWidth / W); };
  var H = function (id) { return parseFloat(sec[id].style.getPropertyValue('--h')); };

  /* ---------- helpers ---------- */
  var io = new IntersectionObserver(function (es) {
    es.forEach(function (e) { if (e.isIntersecting) { io.unobserve(e.target); if (e.target._go) e.target._go(); } });
  }, { rootMargin: '0px 0px -10% 0px' });
  function onView(el, fn) { (el._gos = el._gos || []).push(fn); el._go = function () { el._gos.forEach(function (f) { f(); }); }; io.observe(el); }
  function anim(el, frames, o) {
    var a = el.animate(frames, Object.assign({ duration: 900, easing: EASE, fill: 'both' }, o || {}));
    a.onfinish = function () { try { a.commitStyles && 0; a.cancel(); } catch (e) {} el.style.opacity = ''; };
    return a;
  }
  /* fade/translate reveal; hides now, plays when scrolled into view (or right away if trigger === false) */
  function rise(el, o) {
    if (!el || reduce) return;
    o = o || {};
    var y = o.y == null ? 32 : o.y, x = o.x || 0;
    el.style.opacity = '0';
    var go = function () {
      var f = [{ opacity: 0, translate: x + 'px ' + y + 'px', scale: o.scale || 1 }, { opacity: 1, translate: '0px 0px', scale: 1 }];
      if (o.blur) { f[0].filter = 'blur(' + o.blur + 'px)'; f[1].filter = 'blur(0px)'; }
      anim(el, f, { delay: o.delay || 0, duration: o.dur || 900 });
      setTimeout(function () { el.style.opacity = ''; }, (o.delay || 0) + (o.dur || 900) + 1500);
    };
    if (o.now) return go;
    onView(o.trigger || el, go);
  }
  function stagger(list, o) { list.forEach(function (el, i) { rise(el, Object.assign({}, o, { delay: (o.delay || 0) + i * (o.each || 90), trigger: (o.group || el) })); }); }
  /* headline split into masked words that slide up */
  function words(el, o) {
    if (!el || reduce) return;
    o = o || {};
    var targets = el.tagName === 'P' ? [el] : $$('p', el); if (!targets.length) targets = [el];
    var wi = [];
    targets.forEach(function (p) {
      var parts = p.textContent.replace(/\s+/g, ' ').trim().split(' ');
      p.innerHTML = '';
      parts.forEach(function (w, i) {
        var a = document.createElement('span'), b = document.createElement('span');
        a.className = 'pf-w'; b.className = 'pf-wi'; b.textContent = w; b.style.translate = '0 118%'; a.appendChild(b);
        p.appendChild(a); if (i < parts.length - 1) p.appendChild(document.createTextNode(' '));
        wi.push(b);
      });
    });
    var go = function () {
      wi.forEach(function (b, i) {
        var a = b.animate([{ translate: '0 118%', rotate: '4deg' }, { translate: '0 0', rotate: '0deg' }], { duration: o.dur || 1000, delay: (o.delay || 0) + i * (o.each || 55), easing: EASE, fill: 'both' });
        a.onfinish = function () { a.cancel(); b.style.translate = '0 0'; b.style.rotate = ''; };
      });
    };
    var go2 = function () { go(); setTimeout(function () { wi.forEach(function (b) { b.style.translate = '0 0'; b.style.rotate = ''; }); }, (o.delay || 0) + wi.length * (o.each || 55) + (o.dur || 1000) + 1500); };
    if (o.now) return go2;
    onView(o.trigger || el, go2);
  }
  function lerp(a, b, t) { return a + (b - a) * t; }

  fit();

  /* ---------- fixed navigation ---------- */
  var heroRoot = inn('header').firstElementChild;
  var navEl = heroRoot.lastElementChild;
  var nav = document.createElement('div'); nav.id = 'pf-nav';
  var navIn = document.createElement('div'); navIn.className = 'pf-navin';
  nav.appendChild(navIn); document.body.appendChild(nav); navIn.appendChild(navEl);
  Object.assign(navEl.style, { position: 'relative', left: '0', top: '0', transform: 'none', background: 'transparent', borderBottom: '0', transformOrigin: '0 0' });
  var navH = function () { return 80 * S; };
  function layoutNav() {
    navIn.style.height = navH() + 'px';
    navEl.style.transform = S < 1 ? 'scale(' + S + ')' : 'none';
    navEl.style.margin = S < 1 ? '0' : '0 auto';
  }
  $$('[class*="rounded-[200px]"]', nav).forEach(function (b) { b.style.overflow = 'hidden'; });

  /* ---------- progress bar and side dots ---------- */
  var bar = document.createElement('div'); bar.id = 'pf-bar'; document.body.appendChild(bar);
  var dots = { classList: { toggle: function () {} } }, dotEls = [];

    /* ---------- sections stay in normal flow; only scrollh and the solution stack pin ---------- */
  var z = {};
  var pin = document.createElement('div'); pin.className = 'pf-pin'; pin.style.cssText = 'position:relative;z-index:4;background:#041431';
  sec.scrollh.parentNode.insertBefore(pin, sec.scrollh); pin.appendChild(sec.scrollh);
  sec.scrollh.style.position = 'sticky';
  var D = 1500;
  var veil = {};
  function layout() {
    fit(); layoutNav();
    var hs = H('scrollh') * S, travel = 0;
    sec.scrollh.style.top = Math.max(0, (vh - hs) / 2) + 'px';
    pin.style.height = (hs + travel) + 'px';
    pin._travel = travel; pin._hs = hs;
    if (typeof cStack !== 'undefined') {
      var sroot = cStack.firstElementChild;
      cStack.style.height = (865 + D) + 'px';
      sroot.style.position = 'sticky'; sroot.style.height = '865px'; sroot.style.top = Math.max(70, (vh / S - 865) / 2) + 'px';
    }
  }

  /* ---------- hero parts ---------- */
  var globeWrap = heroRoot.children[0], globeImg = globeWrap.firstElementChild;
  var linear = heroRoot.children[2];
  var heroText = linear.children[2], curve = linear.children[3];
  var hHead = heroText.children[0].firstElementChild || heroText.children[0], hSub = heroText.children[1], hBtn = heroText.children[2];
  var glows = [linear.children[0], linear.children[1]];

  /* ---------- mission parts ---------- */
  var mRoot = inn('mission').firstElementChild, mGlobe = mRoot.children[0], mText = mRoot.children[1];
  var mLabel = mText.children[0].children[0], mHead = mText.children[0].children[1], mBtn = mText.children[1];

  /* ---------- content parts ---------- */
  var cp = inn('content').children;
  var cLic = cp[1], cProb = cp[2], cCards = cp[3], cSolHead = cp[4], cLine = cp[5], cStack = cp[6], cNet = cp[7];
  var cardsRow = cCards.firstElementChild;
  var probCards = [].slice.call(cardsRow.children);
  var stackCards = [].slice.call(cStack.firstElementChild.children);
  var netTrack = $('#pf-track');

  /* ---------- scroll-horizontal parts ---------- */
  var shRow = inn('scrollh').firstElementChild.firstElementChild.children[1];
  var shLeft = inn('scrollh').firstElementChild.firstElementChild.children[0];
  var shDots = [].slice.call(shLeft.children[1].children);
  var shCards = [].slice.call(shRow.children);

  /* ---------- proof / news / footer ---------- */
  var svRoot = inn('scrollv').firstElementChild;
  var statsRow = svRoot.children[0].querySelector('.justify-center');
  var proof = svRoot.children[1], news = svRoot.children[2];
  var grid = proof.children[1], cells = [].slice.call(grid.children).filter(function (c) { return /border-b/.test(c.className); }), testi = grid.lastElementChild;
  var ftRoot = inn('footer').firstElementChild;

  /* ================= intro + reveals ================= */
  function setup() {
    if (reduce) return;
    // intro: hide, then play once fonts are in
    [nav, globeWrap, hHead, hSub, hBtn, curve].concat(glows).forEach(function (e) { e.style.opacity = '0'; });
    var introGo = function () {
      var t = function (el, f, o) { anim(el, f, o); };
      t(globeWrap, [{ opacity: 0, scale: 1.12 }, { opacity: 1, scale: 1 }], { duration: 2200, easing: 'cubic-bezier(.16,1,.3,1)' });
      glows.forEach(function (g, i) { t(g, [{ opacity: 0 }, { opacity: 1 }], { duration: 2000, delay: 400 + i * 200 }); });
      t(nav, [{ opacity: 0, translate: '0 -24px' }, { opacity: 1, translate: '0 0' }], { duration: 1000, delay: 300 });
      var wg = words(hHead, { now: true, delay: 350, each: 70, dur: 1200 }); hHead.style.opacity = '1'; wg();
      t(hSub, [{ opacity: 0, translate: '0 22px', filter: 'blur(6px)' }, { opacity: 1, translate: '0 0', filter: 'blur(0)' }], { duration: 1100, delay: 900 });
      t(hBtn, [{ opacity: 0, translate: '0 18px', scale: .92 }, { opacity: 1, translate: '0 0', scale: 1 }], { duration: 900, delay: 1150 });
      t(curve, [{ opacity: 0, translate: '120px 40px' }, { opacity: 1, translate: '0 0' }], { duration: 1400, delay: 700 });
      globeImg.animate([{ transform: 'translateY(0) scale(1)' }, { transform: 'translateY(-10px) scale(1.012)' }], { duration: 9000, direction: 'alternate', iterations: Infinity, easing: 'ease-in-out' });
    };
    (document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve()).then(function () { setTimeout(introGo, 60); });

    // mission
    rise(mLabel, { y: 14 }); words(mHead, { each: 45 }); rise(mBtn, { y: 20, delay: 350, scale: .92 });
    // content
    rise(cLic, { y: -14, dur: 700 });
    rise(cProb.firstElementChild.children[0], { y: 14 });
    words(cProb.firstElementChild.children[1], { each: 45 }); rise(cProb.firstElementChild.children[2], { delay: 350, y: 18 });
    stagger(probCards, { y: 90, each: 130, dur: 1100, group: cardsRow });
    rise(cSolHead.firstElementChild.children[0], { y: 14 });
    words(cSolHead.firstElementChild.children[1], { each: 45 }); rise(cSolHead.firstElementChild.children[2], { delay: 350, y: 18 });
    var nL = cNet.firstElementChild.firstElementChild, nTrack = cNet.firstElementChild.children[1];
    words(nL.children[0].children[0].firstElementChild || nL.children[0].children[0], { each: 45, trigger: cNet });
    rise(nL.children[0].children[1], { delay: 300, y: 18, trigger: cNet });
    stagger([].slice.call(nL.children[1].children), { y: 0, scale: .6, each: 100, delay: 500, group: cNet });
    stagger([].slice.call(nTrack.children), { y: 0, x: 120, each: 110, dur: 1200, delay: 200, group: cNet });
    // scroll-horizontal left column
    shLeft.style.position = 'relative'; shLeft.style.zIndex = '3'; shLeft.style.background = '#041431'; shLeft.style.boxShadow = '80px 0 0 0 #041431';
    var tb = shLeft.children[0].children[0];
    rise(tb.children[0], { y: 14, trigger: shLeft });
    words(tb.children[1].firstElementChild, { each: 45, trigger: shLeft });
    rise(tb.children[2], { delay: 350, y: 18, trigger: shLeft });
    rise(shLeft.children[0].children[1], { delay: 500, y: 18, trigger: shLeft });
    // proof
    stagger([].slice.call(statsRow.children).filter(function (c) { return c.children.length > 1 && !/w-0/.test(c.className); }), { y: 40, each: 140, group: statsRow });
    rise(proof.children[0].children[0], { y: 14 }); words(proof.children[0].children[1].firstElementChild, { each: 45, trigger: proof });
    cells.forEach(function (c, i) { var col = i % 4, row = i / 4 | 0; rise(c, { y: 24, scale: .94, each: 0, delay: (col + row) * 90, trigger: grid }); });
    testi.style.clipPath = 'inset(0 0 0 100%)';
    onView(grid, function () { testi.animate([{ clipPath: 'inset(0 0 0 100%)' }, { clipPath: 'inset(0 0 0 0)' }], { duration: 1300, delay: 450, easing: EASE_IO, fill: 'both' }).onfinish = function () { testi.style.clipPath = ''; }; });
    words(news.children[0].firstElementChild.children[0].firstElementChild, { each: 45 });
    rise(news.children[0].firstElementChild.children[1], { delay: 300, y: 18 });
    var arts = [].slice.call(news.children[1].children);
    arts.forEach(function (a, i) {
      a.classList.add('pf-news'); a.children[0].classList.add('pf-img');
      a.children[1].querySelector('p').classList.add('pf-t');
      rise(a, { y: 70, delay: i * 140, dur: 1100, trigger: news.children[1] });
    });
    // footer
    words(ftRoot.querySelector('[class*="text-[84px]"] p'), { each: 60, dur: 1200 });
    var fcol = ftRoot.querySelector('[class*="text-[84px]"]').parentNode;
    rise(fcol.children[1], { delay: 400, y: 20 }); rise(fcol.parentNode.children[1], { delay: 650, y: 20, scale: .94, trigger: fcol });
    $$('p.absolute', ftRoot).forEach(function (p, i) { rise(p, { y: 16, delay: (i % 5) * 50, dur: 800, trigger: sec.footer }); });
    // grid-rule lines draw in
  }

  /* ================= buttons ================= */
  function buttons() {
    var sel = '[class*="rounded-[200px]"],[class*="rounded-[206.701px]"],[class*="rounded-[160.167px]"],[class*="rounded-[179.667px]"]';
    $$(sel).forEach(function (b) {
      var lab = $$('p', b).filter(function (p) { return p.textContent.trim(); })[0] || $$('div', b).filter(function (d) { return !d.children.length && d.textContent.trim(); })[0] || $$('p,div', b).filter(function (d) { return d.children.length === 1 && d.firstElementChild.tagName === 'P' && d.textContent.trim(); })[0];
      if (!lab) { if (b.id === 'pf-prev' || b.id === 'pf-next') b.classList.add('pf-circ'); return; }
      var tn = lab.tagName === 'P' ? lab : lab.querySelector('p') || lab;
      var t = tn.textContent.trim();
      if (/^Book a/.test(t)) b.addEventListener('click', function () { openBooking(); });
      tn.innerHTML = '<span class="rl"><span class="rl-a">' + t + '</span><span class="rl-b" aria-hidden="true">' + t + '</span></span>';
      b.classList.add('pf-btn');
      var bg = getComputedStyle(b).backgroundColor;
      var blue = /18, 97, 242|19, 98, 245/.test(bg);
      b.style.setProperty('--hf', blue ? '#041431' : (/4, 20, 49/.test(bg) ? '#1262f3' : '#041431'));
      var enter = function (e) {
        var r = b.getBoundingClientRect(), k = S < 1 ? S : 1;
        b.style.setProperty('--x', (e.clientX - r.left) / k + 'px'); b.style.setProperty('--y', (e.clientY - r.top) / k + 'px');
        b.style.setProperty('--d', Math.hypot(r.width, r.height) / k * 2.3 + 'px'); b.classList.add('hov');
      };
      b.addEventListener('pointerenter', enter);
      b.addEventListener('pointerleave', function (e) {
        var r = b.getBoundingClientRect(), k = S < 1 ? S : 1;
        b.style.setProperty('--x', (e.clientX - r.left) / k + 'px'); b.style.setProperty('--y', (e.clientY - r.top) / k + 'px'); b.classList.remove('hov'); b.style.transform = '';
      });
      if (b.closest('#pf-nav') == null) b.addEventListener('pointermove', function (e) {
        var r = b.getBoundingClientRect(); b.style.transform = 'translate(' + ((e.clientX - r.left - r.width / 2) * .12) + 'px,' + ((e.clientY - r.top - r.height / 2) * .22) + 'px)';
      });
    });
    cells.forEach(function (c) { c.classList.add('pf-cell'); var lg = c.querySelector('[class*="opacity-55"]'); if (lg) lg.classList.add('pf-logo'); });
  }


  /* focus morph for the three solution cards */
  var REST = [0, 85.77, 259.37], WIDTH = [961, 1078, 1240.205], SLOT_W = 1240.205;
  var CARD_COL = [{ bg: [250, 251, 251], h: [118, 121, 127], l: [118, 121, 127] }, { bg: [245, 245, 245], h: [118, 121, 127], l: [118, 121, 127] }, null];
  var FOCUS_COL = { bg: [255, 255, 255], h: [35, 36, 38], l: [4, 20, 49] };
  var cardParts = [];
  function mixc(a, b, k) { return 'rgb(' + [0, 1, 2].map(function (i) { return Math.round(a[i] + (b[i] - a[i]) * k); }).join(',') + ')'; }
  function stackInit() {
    stackCards.forEach(function (c, i) {
      c.style.boxShadow = '0 22px 56px -14px rgba(4,20,49,.20), 0 3px 12px rgba(4,20,49,.07)'; c.style.transform = 'none'; c.style.left = ((1240.205 - WIDTH[i]) / 2) + 'px'; c.style.transformOrigin = '50% 0';
      cardParts[i] = { head: c.querySelector('p[class*="text-[3"]'), label: c.querySelector('[class*="capitalize"]') };
    });
  }
  function stackFocus(f) {
    // Each new card slides up from below over the previous one, already at full (Treasury) size.
    // As it covers the card behind, that card settles back into its place in the final stack.
    var e2 = ease3(clamp(f, 0, 1)), e3 = ease3(clamp(f - 1, 0, 1));
    var enter = [1, e2, e3];
    var bigs = [1 - e2, f < 1 ? 1 : 1 - e3, 1];
    var slot = lerp(40, 259.37, e3);
    var off = vh / S + 320;
    stackCards.forEach(function (c, i) {
      var big = bigs[i], k = SLOT_W / WIDTH[i];
      c.style.scale = String(1 + (k - 1) * big);
      c.style.top = (REST[i] + (slot - REST[i]) * big) + 'px';
      c.style.translate = '0 ' + ((1 - enter[i]) * off) + 'px';
      c.style.opacity = '1';
      c.style.zIndex = String(10 + i);
      var col = CARD_COL[i];
      if (col) {
        c.style.backgroundColor = mixc(col.bg, FOCUS_COL.bg, big);
        var cp2 = cardParts[i];
        if (cp2.head) cp2.head.style.color = mixc(col.h, FOCUS_COL.h, big);
        if (cp2.label) cp2.label.style.color = mixc(col.l, FOCUS_COL.l, big);
      }
    });
  }

  /* ================= scroll-linked ================= */
  var lastY = 0;
  var shPP = [0, 546 / 1453, 1092 / 1453, 1];
  function ease3(t) { return 1 - Math.pow(1 - t, 3); }
  function update() {
    sy = scrollY; vh = innerHeight;
    var docH = document.documentElement.scrollHeight;
    bar.style.transform = 'scaleX(' + clamp(sy / (docH - vh), 0, 1) + ')';

    // nav: hide on scroll down, return on scroll up; dark over navy sections
    var dy = sy - lastY; lastY = sy;
    nav.classList.toggle('stuck', sy > 24);
    if (sy > 160 && dy > 4) nav.classList.add('hide'); else if (dy < -4 || sy <= 160) nav.classList.remove('hide');
    var covering = null;
    ids.forEach(function (id) { var r = sec[id].getBoundingClientRect(); if (r.top <= 40 && r.bottom > 40) covering = id; });
    nav.classList.toggle('dark', covering === 'mission' || covering === 'scrollh' || covering === 'footer');

    // hero text drifts slightly slower than the page
    heroText.style.translate = '0 ' + (sy * .1) + 'px';

    // problem cards drift left; the blue line fills the whole grey line as they go
    var rr = cardsRow.getBoundingClientRect(), cy = rr.top + rr.height / 2;
    var pr = clamp((vh * .95 - cy) / (vh * .75), 0, 1), prs = pr * pr * (3 - 2 * pr);
    cardsRow.style.translate = (-306 * prs) + 'px 0';
    if (lineBlue) lineBlue.style.transform = 'scaleX(' + prs + ')';

    // solutions: the stack is pinned. The card in focus is the size and colour of the Treasury card;
    // scrolling hands focus to the next card, which grows while the previous one shrinks back.
    var pr0 = cStack.getBoundingClientRect(), ir = stackRoot.getBoundingClientRect();
    var ps = clamp((ir.top - pr0.top) / (D * S), 0, 1);
    stackFocus(clamp((ps - .08) / .84, 0, 1) * 2);
    // lines behind the solutions section move as you scroll
    var k = (vh / 2 - (pr0.top + pr0.height / 2)) / vh;
    if (bgV1) { bgV1.style.translate = (k * 70) + 'px ' + (ps * 430 - k * 50) + 'px'; bgV1.style.rotate = (k * -1.4) + 'deg'; }
    if (bgV2) { bgV2.style.translate = (k * -110) + 'px ' + (ps * 250 - k * 90) + 'px'; bgV2.style.rotate = (k * 1.8) + 'deg'; }

    // testimonial parallax
    var tr = testi.getBoundingClientRect(), tp = (tr.top + tr.height / 2 - vh / 2) / vh;
    var timg = testi.firstElementChild; if (timg) timg.style.translate = '0 ' + (tp * -50) + 'px';

    // footer rise
    var fTop = sec.footer.getBoundingClientRect().top, pf = clamp(1 - fTop / vh, 0, 1);
    ftRoot.style.translate = '0 ' + ((1 - pf) * 70) + 'px';
  }

  /* ================= count-ups ================= */
  function countUps() {
    if (reduce) return;
    function cu(p, dur, delay, trig) {
      if (!p) return; var t = p.textContent, m = t.match(/[\d.]+/); if (!m) return;
      var num = parseFloat(m[0]), dec = (m[0].split('.')[1] || '').length, pre = t.slice(0, m.index), suf = t.slice(m.index + m[0].length);
      p.textContent = pre + (0).toFixed(dec) + suf;
      onView(trig || p, function () {
        var t0 = performance.now() + (delay || 0);
        (function step(now) {
          var k = clamp((now - t0) / dur, 0, 1), v = num * (1 - Math.pow(2, -10 * k));
          if (k >= 1) v = num; p.textContent = pre + v.toFixed(dec) + suf;
          if (k < 1) requestAnimationFrame(step);
        })(performance.now());
      });
    }
    $$('p', statsRow).filter(function (p) { return /^(\$1\.5B|3\+|99\.9)$/.test(p.textContent.trim()); }).forEach(function (p, i) { cu(p, 1700, i * 140, statsRow); });
    cu(P('10x', testi), 1500, 700, grid);
  }

  /* ================= WebGL ================= */
  function gl(canvas, opts) {
    var g = canvas.getContext('webgl', { alpha: true, premultipliedAlpha: true, antialias: false });
    if (!g) return null;
    function prog(vs, fs) {
      var p = g.createProgram();
      [[g.VERTEX_SHADER, vs], [g.FRAGMENT_SHADER, fs]].forEach(function (s) { var sh = g.createShader(s[0]); g.shaderSource(sh, s[1]); g.compileShader(sh); if (!g.getShaderParameter(sh, g.COMPILE_STATUS)) throw new Error(g.getShaderInfoLog(sh)); g.attachShader(p, sh); });
      g.linkProgram(p); return p;
    }
    return { g: g, prog: prog };
  }

  var mission = { pc: 0, vis: true };
  var gl1 = { pf: 0 }, gl2 = { vis: false };

  function dotGlobe() {
    var L = window.MG_LAND; if (!L || reduce) return;
    var cv = document.createElement('canvas'); cv.className = 'pf-gl';
    cv.style.cssText = 'left:-720px;top:0;width:2880px;height:719px;';
    var ctx; try { ctx = gl(cv); if (!ctx) return;
      var g = ctx.g;
      var bin = atob(L.d), bytes = new Uint8Array(bin.length); for (var i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
      var pts = [], D = Math.PI / 180, N = 70000, GA = Math.PI * (3 - Math.sqrt(5));
      for (var q = 0; q < N; q++) {
        var latr = Math.asin(1 - 2 * (q + .5) / N), lonr = ((q * GA) % (2 * Math.PI)) - Math.PI;
        var lat = latr / D, lon = lonr / D;
        var r = Math.round((L.lat0 - lat) / L.step), c = Math.round((lon - L.lon0) / L.step);
        if (r < 0 || r >= L.h || c < 0 || c >= L.w) continue;
        var k = r * L.w + c, v = (bytes[k >> 2] >> ((k & 3) * 2)) & 3; if (!v) continue;
        pts.push(lonr, latr, Math.random());
      }
      var vs = 'attribute vec3 a;uniform vec2 uV;uniform vec3 uG;uniform vec2 uR;uniform float uT,uPx;varying vec3 vC;varying float vA;' +
        'void main(){float dl=a.x-uV.x;float cl=cos(a.y);float x=cl*sin(dl);float y=cos(uV.y)*sin(a.y)-sin(uV.y)*cl*cos(dl);float z=sin(uV.y)*sin(a.y)+cos(uV.y)*cl*cos(dl);' +
        'vec2 p=vec2(uG.x+x*uG.z,uG.y-y*uG.z);gl_Position=vec4(p.x/uR.x*2.-1.,1.-p.y/uR.y*2.,0.,1.);' +
        'float vis=step(.03,z);float tw=.72+.28*sin(uT*1.7+a.z*60.);gl_PointSize=(2.6+6.4*z)*tw*uPx*vis;' +
        'float m=1.-smoothstep(0.,1.,abs(p.x-uR.x*.5)/(uR.x*.5));float up=1.-smoothstep(0.,1.,(p.y-uG.y+uG.z)/ (uG.z*.62));vC=mix(vec3(.16,.27,1.),vec3(.22,.85,1.),clamp(m*.85+up*.25,0.,1.));vA=smoothstep(.03,.4,z)*(.55+.45*m);}';
      var fs = 'precision mediump float;varying vec3 vC;varying float vA;void main(){float d=length(gl_PointCoord-.5);float a=smoothstep(.5,.34,d)*vA;gl_FragColor=vec4(vC*a,a);}';
      var p = ctx.prog(vs, fs); g.useProgram(p);
      var buf = g.createBuffer(); g.bindBuffer(g.ARRAY_BUFFER, buf); g.bufferData(g.ARRAY_BUFFER, new Float32Array(pts), g.STATIC_DRAW);
      var loc = g.getAttribLocation(p, 'a'); g.enableVertexAttribArray(loc); g.vertexAttribPointer(loc, 3, g.FLOAT, false, 0, 0);
      g.enable(g.BLEND); g.blendFunc(g.ONE, g.ONE_MINUS_SRC_ALPHA);
      var U = function (n) { return g.getUniformLocation(p, n); }, uV = U('uV'), uG = U('uG'), uR = U('uR'), uT = U('uT'), uPx = U('uPx');
      var n = pts.length / 3, pxr = 0;
      mGlobe.style.display = 'none'; mRoot.insertBefore(cv, mText);
      var lon0 = 14 * D, t0 = performance.now(), mx = 0;
      addEventListener('pointermove', function (e) { mx = (e.clientX / innerWidth - .5); });
      (function frame(now) {
        requestAnimationFrame(frame);
        if (!mission.vis) return;
        var px = Math.min(devicePixelRatio || 1, 2) * Math.max(.5, S);
        var cw = Math.round(2880 * px), ch = Math.round(719 * px);
        if (cv.width !== cw) { cv.width = cw; cv.height = ch; g.viewport(0, 0, cw, ch); }
        g.clearColor(0, 0, 0, 0); g.clear(g.COLOR_BUFFER_BIT);
        var t = (now - t0) / 1000;
        var rot = lon0 + t * 2.2 * D + sy * .0011 + mx * .15;
        g.uniform2f(uV, rot, -.9 + mission.pc * .1);
        g.uniform3f(uG, 1440, 1471 + mission.pc * 60, 994);
        g.uniform2f(uR, 2880, 719); g.uniform1f(uT, t); g.uniform1f(uPx, px);
        g.drawArrays(g.POINTS, 0, n);
      })(performance.now());
    } catch (err) { console.warn('globe webgl off', err); if (cv.parentNode) cv.remove(); mGlobe.style.display = ''; }
  }

  function aurora(host, before, box, o) {
    if (reduce) return null;
    var cv = document.createElement('canvas'); cv.className = 'pf-gl';
    cv.style.cssText = 'left:' + box[0] + 'px;top:' + box[1] + 'px;width:' + box[2] + 'px;height:' + box[3] + 'px;' + (o.blend ? 'mix-blend-mode:' + o.blend + ';' : '') + (o.mask ? '-webkit-mask-image:' + o.mask + ';mask-image:' + o.mask + ';' : '') + 'opacity:' + o.opacity + ';';
    try {
      var ctx = gl(cv); if (!ctx) return null; var g = ctx.g;
      var vs = 'attribute vec2 a;void main(){gl_Position=vec4(a,0.,1.);}';
      var fs = 'precision mediump float;uniform vec2 uR,uM;uniform float uT;uniform vec3 c1,c2;' +
        'float h(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}' +
        'float n(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(h(i),h(i+vec2(1,0)),f.x),mix(h(i+vec2(0,1)),h(i+vec2(1,1)),f.x),f.y);}' +
        'float fbm(vec2 p){float v=0.,a=.5;for(int i=0;i<4;i++){v+=a*n(p);p*=2.03;a*=.5;}return v;}' +
        'void main(){vec2 uv=gl_FragCoord.xy/uR;vec2 p=vec2(uv.x*uR.x/uR.y,uv.y);float t=uT*.09;' +
        'float w=fbm(p*vec2(1.1,2.4)+vec2(t,-t*.7)+1.6*fbm(p*2.1-vec2(t*.8,t)));' +
        'float arch=exp(-pow((uv.x-.5)*1.55,2.)*2.6)*pow(1.-uv.y,1.35);' +
        'float mo=exp(-dot(uv-uM,uv-uM)*9.)*.6;float I=clamp(arch*(.35+1.25*w)+mo*arch*1.2,0.,1.);' +
        'vec3 col=mix(c1,c2,smoothstep(.2,.9,w+uv.x*.25));gl_FragColor=vec4(col*I,I);}';
      var p = ctx.prog(vs, fs); g.useProgram(p);
      var b = g.createBuffer(); g.bindBuffer(g.ARRAY_BUFFER, b); g.bufferData(g.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), g.STATIC_DRAW);
      var l = g.getAttribLocation(p, 'a'); g.enableVertexAttribArray(l); g.vertexAttribPointer(l, 2, g.FLOAT, false, 0, 0);
      g.enable(g.BLEND); g.blendFunc(g.ONE, g.ONE_MINUS_SRC_ALPHA);
      var U = function (n) { return g.getUniformLocation(p, n); };
      g.uniform3f(U('c1'), o.c1[0], o.c1[1], o.c1[2]); g.uniform3f(U('c2'), o.c2[0], o.c2[1], o.c2[2]);
      host.insertBefore(cv, before);
      var st = { vis: true, mx: .5, my: .2 }, t0 = performance.now();
      var mm = { x: .5, y: .2 };
      addEventListener('pointermove', function (e) { var r = cv.getBoundingClientRect(); mm.x = clamp((e.clientX - r.left) / r.width, 0, 1); mm.y = clamp(1 - (e.clientY - r.top) / r.height, 0, 1); });
      new IntersectionObserver(function (es) { st.vis = es[0].isIntersecting; }).observe(cv);
      (function frame(now) {
        requestAnimationFrame(frame); if (!st.vis) return;
        var px = Math.min(devicePixelRatio || 1, 1.5) * Math.max(.5, S) * .6;
        var cw = Math.round(box[2] * px), ch = Math.round(box[3] * px);
        if (cv.width !== cw) { cv.width = cw; cv.height = ch; g.viewport(0, 0, cw, ch); }
        st.mx += (mm.x - st.mx) * .05; st.my += (mm.y - st.my) * .05;
        g.clearColor(0, 0, 0, 0); g.clear(g.COLOR_BUFFER_BIT);
        g.uniform2f(U('uR'), cw, ch); g.uniform2f(U('uM'), st.mx, st.my); g.uniform1f(U('uT'), (now - t0) / 1000);
        g.drawArrays(g.TRIANGLE_STRIP, 0, 4);
      })(performance.now());
      return st;
    } catch (err) { console.warn('aurora off', err); return null; }
  }

  /* ================= video + pointer ================= */
  function cashVideo() {
    var panel = $('[class*="h-[557.059px]"]', cStack); if (!panel || reduce) return;
    var v = document.createElement('video'); v.className = 'pf-vid'; v.muted = true; v.loop = true; v.playsInline = true; v.preload = 'auto';
    v.style.cssText = 'left:0;top:0;width:100%;height:100%;opacity:0;transition:opacity .6s';
    v.src = window.PF_CASH || 'assets/pf/cash.mp4'; panel.appendChild(v);
    var st = { vis: false };
    new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting && e.intersectionRatio > .5) { v.currentTime = 0; v.play().then(function () { v.style.opacity = 1; }).catch(function () {}); } else { v.pause(); } }); }, { threshold: [0, .5] }).observe(panel);
  }

  function fxVideo() {
    if (reduce) return;
    var box = stackCards[1] && stackCards[1].querySelector('[class*="h-[510.253px]"]'); if (!box) return;
    var v = document.createElement('video'); v.className = 'pf-vid'; v.muted = true; v.loop = true; v.playsInline = true; v.preload = 'auto';
    v.style.cssText = 'left:0;top:0;width:100%;height:100%;opacity:0;transition:opacity .6s;-webkit-mask-image:radial-gradient(ellipse 72% 74% at 50% 50%,#000 68%,transparent 100%);mask-image:radial-gradient(ellipse 72% 74% at 50% 50%,#000 68%,transparent 100%)';
    v.src = window.PF_FX || 'assets/pf/fxmap.mp4'; box.appendChild(v);
    new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { v.play().then(function () { v.style.opacity = 1; }).catch(function () {}); } else v.pause(); }); }, { threshold: .25 }).observe(box);
  }
  function pointerParallax() {
    if (reduce) return; var tx = 0, ty = 0, cx = 0, cy = 0;
    addEventListener('pointermove', function (e) { tx = (e.clientX / innerWidth - .5); ty = (e.clientY / innerHeight - .5); });
    (function f() { requestAnimationFrame(f); cx += (tx - cx) * .06; cy += (ty - cy) * .06; if (sy < vh) { globeWrap.style.translate = (cx * -26) + 'px ' + (cy * -16) + 'px'; } })();
  }


  /* ================= structure tweaks + new pieces ================= */
  var stackRoot = cStack.firstElementChild, lineBlue = null, bgV1 = cp[0].children[0], bgV2 = cp[0].children[1], shVis = shCards.map(function (c) { return c.children[1]; });

  function marquee() {
    var root = cLic.firstElementChild; if (!root) return;
    var items = [].slice.call(root.children);
    var track = document.createElement('div'); track.className = 'pf-mq';
    var set = function () { return items.map(function (n) { return n.cloneNode(true); }); };
    var sep = items[1].cloneNode(true);
    [0, 1, 2].forEach(function () { set().forEach(function (n) { track.appendChild(n); }); track.appendChild(sep.cloneNode(true)); });
    root.innerHTML = ''; root.style.justifyContent = 'flex-start'; root.style.overflow = 'hidden'; root.style.padding = '0';
    root.style.alignItems = 'center'; root.style.height = '58px';
    root.style.webkitMaskImage = root.style.maskImage = 'linear-gradient(90deg, transparent 0, #000 9%, #000 91%, transparent 100%)';
    root.appendChild(track);
    if (reduce) track.style.animation = 'none';
  }

  function blueLine() {
    var r = cLine.firstElementChild; if (!r) return;
    r.innerHTML = '<div style="position:absolute;left:0;top:-1px;width:500px;height:2px;background:#E5E6E9"></div><div class="pf-lb" style="position:absolute;left:0;top:-1px;width:500px;height:2px;background:#3375FB;transform-origin:0 50%;transform:scaleX(0)"></div>';
    cLine.style.clipPath = 'none'; lineBlue = r.querySelector('.pf-lb');
  }

  function padClips() {
    cCards.style.width = '1240px'; cCards.style.overflow = 'hidden';
    shRow.parentNode.style.clipPath = 'inset(0 100px 0 0)';
  }
  function netClip() {
    var root = cNet.firstElementChild, track = $('#pf-track'); if (!track) return;
    var clip = document.createElement('div');
    clip.style.cssText = 'position:absolute;left:568px;top:0;width:672px;height:403px;overflow:hidden';
    root.appendChild(clip); clip.appendChild(track);
    track.style.position = 'absolute'; track.style.left = '0'; track.style.top = '0';
  }

  function logoHover() { /* handled in CSS: overlay fades out so the true brand colours show */ }

  function dotClicks() {
    shDots.forEach(function (d, i) {
      d.classList.add('pf-sdot');
      d.addEventListener('click', function () { shAuto.mode = 'goto'; shAuto.target = shPP[i] * 1453; shAuto.pause = 0; });
    });
  }

  var useCase = [];
  function lottieCards() {
    var specs = [['collect', 0, 440, 258, 241], ['convert', 1, 560, 258, 233], ['pay', 3, 520, 258, 229]];
    if (window.lottie && window.PF_LOTTIE && window.DecompressionStream) specs.forEach(function (sp) {
      var card = shCards[sp[1]], old = card.children[1];
      var bin = atob(window.PF_LOTTIE[sp[0]]), u = new Uint8Array(bin.length); for (var i = 0; i < u.length; i++) u[i] = bin.charCodeAt(i);
      new Response(new Blob([u]).stream().pipeThrough(new DecompressionStream('gzip'))).json().then(function (data) {
        var box = document.createElement('div');
        box.style.cssText = 'position:absolute;pointer-events:none;width:' + sp[2] + 'px;height:' + sp[2] + 'px;left:' + (sp[3] - sp[2] / 2) + 'px;top:' + (sp[4] - sp[2] / 2) + 'px';
        card.appendChild(box); old.style.display = 'none'; shVis[sp[1]] = box;
        var a = lottie.loadAnimation({ container: box, renderer: 'svg', loop: false, autoplay: false, animationData: data });
        a.goToAndStop(0, true);
        useCase.push({ a: a, card: card, vis: false });
        new IntersectionObserver(function (es) { useCase.forEach(function (u) { if (u.card === card) u.vis = es[0].isIntersecting; }); }).observe(card);
      });
    });
    // the bank card has no earlier motion asset: give it a slow float so every card is alive
    var bank = shCards[2].children[1];
    useCase.push({ dome: bank, card: shCards[2], vis: false });
    new IntersectionObserver(function (es) { useCase.forEach(function (u) { if (u.dome) u.vis = es[0].isIntersecting; }); }).observe(shCards[2]);
    /* one shared clock: every use-case illustration (coin, coins, dome, stack) completes a loop in the same time */
    var PERIOD = 16000, lastF = 0;
    (function tick(now) {
      requestAnimationFrame(tick);
      if (now - lastF < 33) return; lastF = now;
      var ph = (now % PERIOD) / PERIOD;
      useCase.forEach(function (u) {
        if (!u.vis) return;
        if (u.a) u.a.goToAndStop(ph * 47.9, true);
        else if (u.dome) u.dome.style.transform = 'translateY(' + (Math.sin(ph * 6.2832) * -16) + 'px) rotate(' + (Math.sin(ph * 6.2832) * 1.6) + 'deg) scale(' + (1 + Math.sin(ph * 6.2832) * .015) + ')';
      });
    })(performance.now());
  }

  /* hero globe: drawn live so it can turn. It sways on its own and follows the pointer / drag left and right. */
  function heroGlobe() {
    var G = window.MG_GEO; if (!G || reduce) return;
    var cv = document.createElement('canvas'); cv.className = 'pf-gl'; cv.style.cssText = 'left:-815px;top:0;width:2728px;height:1528px;';
    var ctx = cv.getContext('2d'); if (!ctx) return;
    globeWrap.appendChild(cv);
    var CX = 1656, CY = 886, R = 813, D2 = Math.PI / 180;
    var base = 24.6, cur = 0, target = 0, tilt = 0, tiltT = 0, vel = 0, drag = false, lastX = 0, t0 = performance.now(), vis = true, px0 = 0;
    var hero = sec.header;
    addEventListener('pointermove', function (e) {
      var r = hero.getBoundingClientRect(); if (r.bottom < 0 || r.top > innerHeight) return;
      var nx = e.clientX / innerWidth - .5, ny = e.clientY / innerHeight - .5;
      if (drag) { var dx = e.clientX - lastX; lastX = e.clientX; base -= dx * .16; vel = -dx * .16; }
      else { target = -nx * 80; }
      tiltT = ny * -10;
    });
    hero.addEventListener('pointerdown', function (e) { if (e.target.closest('.pf-btn')) return; drag = true; lastX = e.clientX; hero.style.cursor = 'grabbing'; });
    addEventListener('pointerup', function () { drag = false; hero.style.cursor = ''; });
    new IntersectionObserver(function (es) { vis = es[0].isIntersecting; }).observe(hero);
    var started = false;
    function draw(now) {
      requestAnimationFrame(draw); if (!vis) return;
      var t = (now - t0) / 1000, px = Math.min(devicePixelRatio || 1, 2) * Math.max(.5, S);
      var cw = Math.round(2728 * px); if (cv.width !== cw) { cv.width = cw; cv.height = Math.round(1528 * px); }
      if (!drag) { base += vel; vel *= .94; }
      cur += (target - cur) * .06; tilt += (tiltT - tilt) * .06;
      var l0 = (base + cur + Math.sin(t * .5) * 12) * D2, a0 = (-2.8 + tilt + Math.sin(t * .3) * 1.5) * D2;
      var sa = Math.sin(a0), ca = Math.cos(a0), sy_ = 0;
      ctx.setTransform(px, 0, 0, px, 0, 0); ctx.clearRect(0, 0, 2728, 1528);
      ctx.lineJoin = 'round'; ctx.lineCap = 'round';
      function P(lon, lat) {
        var dl = lon * D2 - l0, cl = Math.cos(lat * D2), sl = Math.sin(lat * D2), cd = Math.cos(dl);
        return [CX + cl * Math.sin(dl) * R, CY - (ca * sl - sa * cl * cd) * R, sa * sl + ca * cl * cd];
      }
      function path(pts, col, w) {
        ctx.beginPath(); var pen = false;
        for (var i = 0; i < pts.length; i += 2) {
          var q = P(pts[i], pts[i + 1]);
          if (q[2] < .01) { pen = false; continue; }
          if (!pen) { ctx.moveTo(q[0], q[1]); pen = true; } else ctx.lineTo(q[0], q[1]);
        }
        ctx.strokeStyle = col; ctx.lineWidth = w; ctx.stroke();
      }
      // graticule
      var i, j, pts;
      for (var lat = -75; lat <= 75; lat += 15) { pts = []; for (j = -180; j <= 180; j += 3) pts.push(j, lat); path(pts, 'rgba(19,98,245,.22)', 1); }
      for (var lon = -180; lon < 180; lon += 4) { pts = []; for (j = -84; j <= 84; j += 6) pts.push(lon, j); path(pts, lon % 20 ? 'rgba(19,98,245,.16)' : 'rgba(19,98,245,.26)', 1); }
      G.oth.forEach(function (r) { path(r, 'rgba(60,120,250,.42)', 1); });
      G.afr.forEach(function (r) { path(r, 'rgba(19,98,245,.78)', 1.7); });
      G.live.forEach(function (r) { path(r, '#1362f5', 2.8); });
      ctx.beginPath(); ctx.arc(CX, CY, R, 0, 6.2832); ctx.strokeStyle = 'rgba(19,98,245,.14)'; ctx.lineWidth = 1; ctx.stroke();
      if (!started) { started = true; globeImg.style.opacity = '0'; }
    }
    requestAnimationFrame(draw);
  }


  /* ---------- booking dialog (prototype: no data leaves the page) ---------- */
  var bookDlg = null;
  function openBooking() {
    if (!bookDlg) {
      bookDlg = document.createElement('dialog'); bookDlg.className = 'pf-book';
      bookDlg.innerHTML =
        '<form method="dialog" class="pf-bk-x"><button aria-label="Close">×</button></form>' +
        '<div class="pf-bk-in"><div class="pf-bk-form">' +
        '<p class="pf-bk-eyebrow"><i></i>Book a review</p>' +
        '<h2>See your money in one place.</h2>' +
        '<p class="pf-bk-lead">Tell us a little about your company. We will set up a short treasury review.</p>' +
        '<form class="pf-bk-f" novalidate>' +
        '<label>Full name<input name="n" autocomplete="name" required></label>' +
        '<label>Work email<input name="e" type="email" autocomplete="email" required></label>' +
        '<label>Company<input name="c" autocomplete="organization" required></label>' +
        '<fieldset><legend>What would you like to see?</legend><div class="pf-chips">' +
        ['Cash across banks', 'Payments and FX', 'Payables Financing', 'Treasury system'].map(function (x) { return '<label><input type="checkbox" name="i" value="' + x + '"><span>' + x + '</span></label>'; }).join('') +
        '</div></fieldset>' +
        '<button class="pf-bk-go" type="submit">Request a review</button>' +
        '<p class="pf-bk-err" hidden>Please complete your name, a valid work email and your company.</p>' +
        '</form></div>' +
        '<div class="pf-bk-done" hidden><div class="pf-bk-tick">✓</div><h2>Thank you.</h2><p>We will be in touch within one working day to set up your review.</p><button class="pf-bk-close" type="button">Close</button></div></div>';
      document.body.appendChild(bookDlg);
      var f = bookDlg.querySelector('.pf-bk-f');
      f.addEventListener('submit', function (e) {
        e.preventDefault();
        var ok = f.n.value.trim() && /^\S+@\S+\.\S+$/.test(f.e.value.trim()) && f.c.value.trim();
        bookDlg.querySelector('.pf-bk-err').hidden = !!ok; if (!ok) return;
        bookDlg.querySelector('.pf-bk-form').hidden = true; bookDlg.querySelector('.pf-bk-done').hidden = false;
      });
      bookDlg.querySelector('.pf-bk-close').addEventListener('click', function () { bookDlg.close(); });
      bookDlg.addEventListener('click', function (e) { if (e.target === bookDlg) bookDlg.close(); });
      bookDlg.addEventListener('close', function () { bookDlg.querySelector('.pf-bk-form').hidden = false; bookDlg.querySelector('.pf-bk-done').hidden = true; f.reset(); });
    }
    if (!bookDlg.open) bookDlg.showModal();
  }


  /* hero background continues past the 1440 design width so it never stops short on wide screens */
  function bleedHero() {
    /* Continue the hero past the 1440 design width. The strips live inside the hero, above the globe and
       beside (never under) the design's own gradient block, so nothing doubles up and no edge shows. */
    heroRoot.style.background = 'transparent';
    linear.style.overflow = 'visible';
    var grad = 'linear-gradient(to bottom, rgba(255,255,255,0) 22.222%, #f0f5ff 60.36%)';
    var after = globeWrap.nextSibling;
    var mk = function (css) { var d = document.createElement('div'); d.className = 'pf-bleed'; d.style.cssText = 'position:absolute;pointer-events:none;' + css; heroRoot.insertBefore(d, after); return d; };
    mk('left:-3000px;width:3000px;bottom:0;height:503px;background:' + grad);
    mk('left:1440px;width:3000px;bottom:0;height:503px;background:' + grad);
    var navy = mk('left:1440px;width:3000px;top:841px;height:105px;background:#091832'); heroRoot.appendChild(navy);
  }


  /* use-case cards: drift slowly to the left on their own; the dots jump to a card. Page scroll does not move them. */
  var shAuto = { x: 0, mode: 'auto', target: 0, pause: 1500, vis: false, hover: false, last: 0 };
  function applyShift() {
    var shift = shAuto.x, idx = 0, best = 1e9;
    shPP.forEach(function (v, i) { var d = Math.abs(shift - v * 1453); if (d < best) { best = d; idx = i; } });
    shRow.style.translate = (-shift) + 'px 0';
    shDots.forEach(function (d, i) { d.style.width = i === idx ? '48px' : '10px'; d.style.backgroundColor = i === idx ? '#1362f5' : '#d0e0fd'; });
    shCards.forEach(function (c, i) {
      var cx = 639 + i * 546 - shift + 258, d = (cx - 1000) / 900;
      c.style.scale = String(1 - clamp(Math.abs(d), 0, 1) * .03);
      var vis = shVis[i]; if (vis) vis.style.translate = (-d * 18) + 'px 0';
    });
  }
  function shiftTick(now) {
    requestAnimationFrame(shiftTick);
    var dt = Math.min(64, now - (shAuto.last || now)); shAuto.last = now;
    if (!shAuto.vis) return;
    if (shAuto.pause > 0) { shAuto.pause -= dt; }
    else if (shAuto.hover && shAuto.mode === 'auto') { /* hold while the pointer is over the cards */ }
    else if (shAuto.mode === 'auto') {
      shAuto.x += 24 * dt / 1000;
      if (shAuto.x >= 1453) { shAuto.x = 1453; shAuto.mode = 'rewind'; shAuto.pause = 2600; }
    } else if (shAuto.mode === 'rewind') {
      shAuto.x += (0 - shAuto.x) * (1 - Math.exp(-dt / 420));
      if (shAuto.x < 1.5) { shAuto.x = 0; shAuto.mode = 'auto'; shAuto.pause = 1800; }
    } else if (shAuto.mode === 'goto') {
      shAuto.x += (shAuto.target - shAuto.x) * (1 - Math.exp(-dt / 260));
      if (Math.abs(shAuto.target - shAuto.x) < 1) { shAuto.x = shAuto.target; shAuto.mode = 'auto'; shAuto.pause = 7000; }
    }
    applyShift();
  }
  function shiftInit() {
    new IntersectionObserver(function (es) { shAuto.vis = es[0].isIntersecting; }).observe(sec.scrollh);
    shRow.addEventListener('pointerenter', function () { shAuto.hover = true; });
    shRow.addEventListener('pointerleave', function () { shAuto.hover = false; });
    applyShift(); requestAnimationFrame(shiftTick);
  }


  /* footer: no grid lines (text sits straight on the background) and the glow bleeds across the full width */
  function footerBleed() {
    var kids = [].slice.call(ftRoot.children);
    kids.forEach(function (k, i) {
      if (i === 0) return;                                           // base background
      if (k.tagName === 'DIV' && k.children.length === 1 && k.firstElementChild.tagName === 'IMG' && /inset-\[/.test(k.className)) {
        if (/50\.37%_94\.71%/.test(k.className)) return;             // the small blue mark beside the tagline
        k.style.display = 'none';
      }
    });
    var base = ftRoot.children[0]; if (base) { base.style.left = '-3000px'; base.style.right = '-3000px'; base.style.display = 'none'; }
    var glow = kids.filter(function (k) { return /h-\[520px\]/.test(k.className); })[0];
    if (glow) { glow.style.left = '-1500px'; glow.style.width = '4440px'; glow.style.opacity = '.42'; }
  }


  /* ---------- footer: real link columns that light up as a group, newsletter, legal; plus a soft hover tick ---------- */
  var sfx = { on: true, ctx: null, last: 0 };
  try { if (localStorage.getItem('pf-sound') === 'off') sfx.on = false; } catch (e) {}
  function unlockAudio() {
    if (!sfx.ctx) { try { sfx.ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) {} }
    if (sfx.ctx && sfx.ctx.state === 'suspended') sfx.ctx.resume();
  }
  ['pointerdown', 'keydown', 'touchstart'].forEach(function (ev) { addEventListener(ev, unlockAudio, { passive: true }); });
  /* a soft haptic "tap": a short low thump with a tiny felt click on top, like a phone's scroll-picker tick */
  var tapNoise = null;
  function tick() {
    if (!sfx.on || !sfx.ctx || sfx.ctx.state !== 'running') return;
    var now = performance.now(); if (now - sfx.last < 40) return; sfx.last = now;
    var c = sfx.ctx, t0 = c.currentTime, out = c.createGain(); out.gain.value = .3;
    var lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 2200; out.connect(lp); lp.connect(c.destination);
    // body: low sine that drops fast
    var o = c.createOscillator(), g = c.createGain();
    o.type = 'sine'; o.frequency.setValueAtTime(240, t0); o.frequency.exponentialRampToValueAtTime(95, t0 + .045);
    g.gain.setValueAtTime(0, t0); g.gain.linearRampToValueAtTime(.34, t0 + .003); g.gain.exponentialRampToValueAtTime(.0001, t0 + .07);
    o.connect(g); g.connect(out); o.start(t0); o.stop(t0 + .08);
    // click: a few milliseconds of filtered noise
    if (!tapNoise) { tapNoise = c.createBuffer(1, Math.floor(c.sampleRate * .02), c.sampleRate); var d = tapNoise.getChannelData(0); for (var i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; }
    var n = c.createBufferSource(), bp = c.createBiquadFilter(), ng = c.createGain();
    n.buffer = tapNoise; bp.type = 'bandpass'; bp.frequency.value = 1500; bp.Q.value = .8;
    ng.gain.setValueAtTime(.16, t0); ng.gain.exponentialRampToValueAtTime(.0001, t0 + .012);
    n.connect(bp); bp.connect(ng); ng.connect(out); n.start(t0); n.stop(t0 + .02);
  }
  function soundToggle() {
    var b = document.createElement('button'); b.id = 'pf-sound'; b.type = 'button';
    var paint = function () { b.setAttribute('aria-pressed', String(sfx.on)); b.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 5 6 9H2v6h4l5 4V5z"/>' + (sfx.on ? '<path d="M15.5 8.5a5 5 0 0 1 0 7M19 5a10 10 0 0 1 0 14"/>' : '<path d="m22 9-6 6M16 9l6 6"/>') + '</svg><span>Sound ' + (sfx.on ? 'on' : 'off') + '</span>'; };
    paint();
    b.addEventListener('click', function () { sfx.on = !sfx.on; try { localStorage.setItem('pf-sound', sfx.on ? 'on' : 'off'); } catch (e) {} paint(); unlockAudio(); if (sfx.on) setTimeout(tick, 30); });
    document.body.appendChild(b);
  }
  function hoverFx() {
    $$('[class*="rounded-[8px]"]', nav).forEach(function (m) { m.classList.add('pf-mi'); m.parentNode.classList.add('pf-menu'); m.addEventListener('pointerenter', tick); });
    $$('.pf-fl a, .pf-fl button.pf-fsub').forEach(function (a) { a.addEventListener('pointerenter', tick); });
  }
  function footerRebuild() {
    $$('p.absolute', ftRoot).forEach(function (p) { p.style.display = 'none'; });
    $$('div', ftRoot).forEach(function (d) { if (d.parentNode === ftRoot && /50\.37%_94\.71%/.test(d.className)) d.style.display = 'none'; });
    var col = function (h, links) { return '<div class="pf-fc"><h5>' + h + '</h5>' + links.map(function (l) { return '<a href="#">' + l + '</a>'; }).join('') + '</div>'; };
    var box = document.createElement('div'); box.className = 'pf-fl';
    box.style.cssText = 'position:absolute;left:100px;top:548px;width:1240px;';
    box.innerHTML =
      '<div class="pf-ftop">' +
        '<div class="pf-fbrand"><div class="pf-flogo"><img src="assets/pf/header-77157.svg" alt=""><span>Multigate</span></div>' +
        '<p>The trusted network powering African treasury and trade.</p>' +
        '<form class="pf-news-f" novalidate><input type="email" placeholder="Get monthly updates" aria-label="Email address"><button class="pf-fsub" type="submit" aria-label="Subscribe">→</button></form>' +
        '<p class="pf-news-ok" hidden>Thank you. You are on the list.</p></div>' +
        '<div class="pf-fcols">' +
          col('Platform', ['Multigate system', 'Payables Financing', 'For banks']) +
          col('Network', ['Coverage', 'Financiers', 'For payment companies and platforms', 'Developers']) +
          col('Trust', ['Licences', 'Certifications', 'Swift']) +
          col('Company', ['About', 'Leadership', 'Insights', 'Careers']) +
        '</div></div>' +
      '<div class="pf-fbadges" data-confirm="certifications"><span>ISO/IEC 27001</span><span>ISO 22301</span><span>ISO/IEC 20000</span><span>PCI DSS</span></div>' +
      '<p class="pf-flegal">Multigate is the trading name of the group headed by Multigate Holdings Ltd (Abu Dhabi Global Market). Regulated group companies: Multigate Network Pay Inc — licensed by the Central Bank of Nigeria as an International Money Transfer Operator, and registered with FINTRAC as a Money Services Business and with the Bank of Canada as a payment service provider; Multigate Network (MU) Ltd — licensed by the Financial Services Commission, Mauritius, for payment intermediary services. Financing is provided by participating Financiers; Multigate does not lend.</p>' +
      '<div class="pf-fbot"><span>Copyright © 2026 Multigate Holdings Ltd</span><div class="pf-fl2"><a href="#">Privacy</a><a href="#">Terms</a><a href="#">Cookies</a></div><div class="pf-fl2"><a href="#">LinkedIn</a><a href="#">X</a></div></div>';
    ftRoot.appendChild(box);
    box.querySelectorAll('a').forEach(function (a) { a.addEventListener('click', function (e) { e.preventDefault(); }); });
    var f = box.querySelector('.pf-news-f');
    f.addEventListener('submit', function (e) { e.preventDefault(); var v = f.querySelector('input').value.trim(); if (!/^\S+@\S+\.\S+$/.test(v)) { f.classList.add('bad'); return; } f.classList.remove('bad'); f.hidden = true; box.querySelector('.pf-news-ok').hidden = false; });
    if (!reduce) {
      rise(box.querySelector('.pf-fbrand'), { y: 24, trigger: box });
      $$('.pf-fc', box).forEach(function (c, i) { rise(c, { y: 24, delay: 120 + i * 90, trigger: box }); });
      rise(box.querySelector('.pf-fbadges'), { y: 16, delay: 300, trigger: box });
      rise(box.querySelector('.pf-flegal'), { y: 16, delay: 400, trigger: box });
      rise(box.querySelector('.pf-fbot'), { y: 12, delay: 500, trigger: box });
    }
  }


  /* every use-case card shows the arrow only while hovered, signalling that it can be opened */
  function cardArrows() {
    var src = shCards[0].querySelector('[class*="w-[24px]"]'); if (!src) return;
    src.style.display = 'none';
    shCards.forEach(function (c) {
      var box = c.children[0]; if (!box) return;
      var a = document.createElement('div'); a.className = 'pf-arr'; a.appendChild(src.cloneNode(true)); a.firstElementChild.style.display = '';
      box.style.position = 'absolute'; box.appendChild(a);
      c.classList.add('pf-uc'); c.setAttribute('tabindex', '0'); c.setAttribute('role', 'link');
      c.addEventListener('pointerenter', tick);
    });
  }

  /* ================= boot ================= */
  bleedHero(); footerBleed(); marquee(); blueLine(); netClip(); padClips(); stackInit(); layout(); setup(); buttons(); countUps(); cashVideo(); fxVideo(); dotClicks(); shiftInit(); footerRebuild(); soundToggle(); hoverFx(); cardArrows(); lottieCards(); heroGlobe();
  dotGlobe();
  aurora(ftRoot, ftRoot.children[1], [-1300, 880, 4040, 401], { blend: 'screen', opacity: .1, c1: [.05, .25, 1], c2: [.1, .85, 1] });
  aurora(linear, linear.children[0], [0, 0, 1440, 503], { opacity: .12, c1: [.45, .65, 1], c2: [.35, .85, 1] });
  var tick = false;
  function req() { if (!tick) { tick = true; requestAnimationFrame(function () { tick = false; update(); }); } }
  addEventListener('scroll', req, { passive: true });
  addEventListener('resize', function () { vh = innerHeight; setTimeout(function () { layout(); update(); }, 30); });
  setTimeout(function () { layout(); update(); }, 80); update();
  new IntersectionObserver(function (es) { mission.vis = es[0].isIntersecting; }).observe(mRoot);
  /* hash-friendly: let the review links jump */
  window.__pfmotion = { update: update, layout: layout };
})();
