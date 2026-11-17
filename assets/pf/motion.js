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
    if (o.now) return go;
    onView(o.trigger || el, go);
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
  var dots = document.createElement('div'); dots.id = 'pf-dots';
  var labels = { header: 'Overview', mission: 'Mission', content: 'Platform', scrollh: 'Who it’s for', scrollv: 'Proof', footer: 'Start' };
  var dotEls = ids.map(function (id) {
    var b = document.createElement('button'); b.setAttribute('aria-label', labels[id]); b.innerHTML = '<span>' + labels[id] + '</span>';
    b.onclick = function () { var t = sec[id].parentNode.classList.contains('pf-pin') ? sec[id].parentNode : sec[id]; var y = t.getBoundingClientRect().top + scrollY; scrollTo({ top: id === 'header' ? 0 : id === 'mission' ? y : y, behavior: 'smooth' }); };
    dots.appendChild(b); return b;
  });
  document.body.appendChild(dots);

  /* ---------- section stacking (sticky curtain) ---------- */
  var z = { header: 1, mission: 2, content: 3, scrollv: 5, footer: 6 };
  Object.keys(z).forEach(function (k) { sec[k].style.zIndex = z[k]; sec[k].style.position = k === 'header' || k === 'mission' ? 'sticky' : 'relative'; });
  var veil = {};
  ['header', 'mission'].forEach(function (k) { var v = document.createElement('div'); v.className = 'pf-veil'; sec[k].appendChild(v); veil[k] = v; });
  var pin = document.createElement('div'); pin.className = 'pf-pin'; pin.style.cssText = 'position:relative;z-index:4;background:#041431';
  sec.scrollh.parentNode.insertBefore(pin, sec.scrollh); pin.appendChild(sec.scrollh);
  sec.scrollh.style.position = 'sticky';
  function layout() {
    fit(); layoutNav();
    ['header', 'mission'].forEach(function (k) { sec[k].style.top = Math.min(0, vh - H(k) * S) + 'px'; });
    var hs = H('scrollh') * S, travel = 1500 * S;
    sec.scrollh.style.top = Math.max(0, (vh - hs) / 2) + 'px';
    pin.style.height = (hs + travel) + 'px';
    pin._travel = travel; pin._hs = hs;
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
    $$('p.absolute', ftRoot).forEach(function (p, i) { rise(p, { y: 16, delay: (i % 5) * 50, dur: 800 }); });
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

  /* ================= scroll-linked ================= */
  var lastY = 0, navHidden = false;
  var statDone = false;
  function update() {
    sy = scrollY; vh = innerHeight;
    var docH = document.documentElement.scrollHeight;
    bar.style.transform = 'scaleX(' + clamp(sy / (docH - vh), 0, 1) + ')';

    // nav: hide on scroll down, return on scroll up; dark when over navy sections
    var dy = sy - lastY; lastY = sy;
    nav.classList.toggle('stuck', sy > 24);
    if (sy > 160 && dy > 4) { nav.classList.add('hide'); } else if (dy < -4 || sy <= 160) { nav.classList.remove('hide'); }
    var under = null;
    ids.forEach(function (id) { var r = sec[id].getBoundingClientRect(); if (r.top <= 40 && r.bottom > 40) under = id; });
    var darkIds = { mission: 1, scrollh: 1, footer: 1 };
    var isDark = !!darkIds[under] && !(under === 'mission' && false);
    // sticky mission stays under later sections: use whichever topmost section covers the nav
    var covering = null, best = -1;
    ids.forEach(function (id) { var r = sec[id].getBoundingClientRect(); if (r.top <= 40 && r.bottom > 40 && (z[id] || 4) > best) { best = z[id] || 4; covering = id; } });
    isDark = !!darkIds[covering];
    nav.classList.toggle('dark', isDark); dots.classList.toggle('dark', isDark);
    dotEls.forEach(function (d, i) { d.classList.toggle('on', ids[i] === (sy < 10 ? 'header' : covering)); });

    // hero
    var heroImgY = sy * .2;
    globeImg.style.translate = '0 ' + heroImgY + 'px';
    heroText.style.translate = '0 ' + (sy * .12) + 'px';
    var mTop = sec.mission.getBoundingClientRect().top, pm = clamp(1 - mTop / vh, 0, 1);
    sec.header.firstElementChild.style.scale = String(1 - .05 * pm);
    veil.header.style.opacity = (pm * .6).toFixed(3);
    var r1 = 44 * (1 - pm); sec.mission.style.borderRadius = r1 + 'px ' + r1 + 'px 0 0';

    // mission under content
    var cTop = sec.content.getBoundingClientRect().top, pc = clamp(1 - cTop / vh, 0, 1);
    sec.mission.firstElementChild.style.scale = String(1 - .04 * pc);
    veil.mission.style.opacity = (pc * .55).toFixed(3);
    var r2 = 44 * (1 - pc); sec.content.style.borderRadius = r2 + 'px ' + r2 + 'px 0 0';
    mText.style.translate = '0 ' + (-pc * 40) + 'px';
    mission.pc = pc; mission.vis = mTop < vh && mTop + H('mission') * S > -vh;

    // problem cards drift left
    var rr = cardsRow.getBoundingClientRect(), cy = rr.top + rr.height / 2;
    var pr = clamp((vh * .95 - cy) / (vh * .75), 0, 1);
    cardsRow.style.translate = (-306 * lerp(0, 1, pr * pr * (3 - 2 * pr))) + 'px 0';
    // connector line fills
    var lr = cLine.getBoundingClientRect(), pl = clamp((vh * .9 - lr.top) / (vh * .55), 0, 1);
    cLine.style.clipPath = 'inset(-4px ' + (100 - 100 * pl) + '% -4px 0)';
    // stacked solution cards fan open
    var sr = cStack.getBoundingClientRect(), ps = clamp((vh * .95 - sr.top) / (vh * .85), 0, 1), e = 1 - Math.pow(1 - ps, 3);
    stackCards[0].style.translate = '0 ' + ((1 - e) * 259) + 'px'; stackCards[0].style.scale = String(.9 + .1 * e);
    stackCards[1].style.translate = '0 ' + ((1 - e) * 173) + 'px'; stackCards[1].style.scale = String(.95 + .05 * e);
    stackCards[0].style.opacity = String(clamp(e * 2.2, .001, 1)); stackCards[1].style.opacity = String(clamp(e * 1.8, .001, 1));

    // pinned horizontal scroll
    var pr2 = pin.getBoundingClientRect(), off = parseFloat(sec.scrollh.style.top) || 0, pp = clamp((off - pr2.top) / Math.max(1, pin._travel || 1), 0, 1);
    var shift = pp * (2154 - 801 + 100);
    shRow.style.translate = (-shift) + 'px 0';
    var idx = Math.min(3, Math.floor(pp * 3.999));
    shDots.forEach(function (d, i) { d.style.transition = 'width .5s ' + EASE + ', background-color .4s'; d.style.width = i === idx ? '48px' : '10px'; d.style.backgroundColor = i === idx ? '#1362f5' : '#d0e0fd'; });
    shCards.forEach(function (c, i) {
      var cx = 639 + i * 546 - shift + 258, d = (cx - 1000) / 900; // -1..1ish
      c.style.scale = String(1 - clamp(Math.abs(d), 0, 1) * .045);
      var vis = c.children[1]; if (vis) vis.style.translate = (-d * 28) + 'px 0';
    });

    // testimonial parallax
    var tr = testi.getBoundingClientRect(), tp = (tr.top + tr.height / 2 - vh / 2) / vh;
    var timg = testi.firstElementChild; if (timg) timg.style.translate = '0 ' + (tp * -50) + 'px';

    // footer rise
    var fTop = sec.footer.getBoundingClientRect().top, pf = clamp(1 - fTop / vh, 0, 1);
    ftRoot.style.translate = '0 ' + ((1 - pf) * 70) + 'px';
    var r3 = 44 * (1 - pf); sec.footer.style.borderRadius = r3 + 'px ' + r3 + 'px 0 0';
    gl2.vis = fTop < vh; gl1.pf = pf;
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
    cv.style.cssText = 'left:0;top:0;width:1440px;height:719px;';
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
        var cw = Math.round(1440 * px), ch = Math.round(719 * px);
        if (cv.width !== cw) { cv.width = cw; cv.height = ch; g.viewport(0, 0, cw, ch); }
        g.clearColor(0, 0, 0, 0); g.clear(g.COLOR_BUFFER_BIT);
        var t = (now - t0) / 1000;
        var rot = lon0 + t * 2.2 * D + sy * .0011 + mx * .15;
        g.uniform2f(uV, rot, -.9 + mission.pc * .1);
        g.uniform3f(uG, 720, 1471 + mission.pc * 60, 994);
        g.uniform2f(uR, 1440, 719); g.uniform1f(uT, t); g.uniform1f(uPx, px);
        g.drawArrays(g.POINTS, 0, n);
      })(performance.now());
    } catch (err) { console.warn('globe webgl off', err); if (cv.parentNode) cv.remove(); mGlobe.style.display = ''; }
  }

  function aurora(host, before, box, o) {
    if (reduce) return null;
    var cv = document.createElement('canvas'); cv.className = 'pf-gl';
    cv.style.cssText = 'left:' + box[0] + 'px;top:' + box[1] + 'px;width:' + box[2] + 'px;height:' + box[3] + 'px;' + (o.blend ? 'mix-blend-mode:' + o.blend + ';' : '') + 'opacity:' + o.opacity + ';';
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
  function pointerParallax() {
    if (reduce) return; var tx = 0, ty = 0, cx = 0, cy = 0;
    addEventListener('pointermove', function (e) { tx = (e.clientX / innerWidth - .5); ty = (e.clientY / innerHeight - .5); });
    (function f() { requestAnimationFrame(f); cx += (tx - cx) * .06; cy += (ty - cy) * .06; if (sy < vh) { globeWrap.style.translate = (cx * -26) + 'px ' + (cy * -16) + 'px'; } })();
  }

  /* ================= boot ================= */
  layout(); setup(); buttons(); countUps(); cashVideo(); pointerParallax();
  dotGlobe();
  aurora(ftRoot, ftRoot.children[1], [0, 880, 1440, 401], { blend: 'screen', opacity: .6, c1: [.05, .25, 1], c2: [.1, .85, 1] });
  aurora(linear, linear.children[0], [0, 0, 1440, 503], { opacity: .28, c1: [.45, .65, 1], c2: [.35, .85, 1] });
  var tick = false;
  function req() { if (!tick) { tick = true; requestAnimationFrame(function () { tick = false; update(); }); } }
  addEventListener('scroll', req, { passive: true });
  addEventListener('resize', function () { vh = innerHeight; setTimeout(function () { layout(); update(); }, 30); });
  setTimeout(function () { layout(); update(); }, 80); update();
  /* hash-friendly: let the review links jump */
  window.__pfmotion = { update: update, layout: layout };
})();
