/* Multigate Licences page: motion layer and licence map.
   Navigation, mega menu, booking dialog, sound and footer are lifted from motion.js so both pages behave the same;
   the page-specific motion (reveals, pinned sideways core values) is at the bottom. */
(function () {
  'use strict';
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var W = 1440, EASE = 'cubic-bezier(.2,.7,.2,1)', EASE_IO = 'cubic-bezier(.65,0,.35,1)';
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return [].slice.call((r || document).querySelectorAll(s)); };
  var clamp = function (v, a, b) { return Math.max(a, Math.min(b, v)); };
  var P = function (txt, root) { return $$('p', root).filter(function (p) { return p.textContent.trim().indexOf(txt) === 0; })[0]; };
  var ids = ['header', 'lmhero', 'lm', 'footer'];
  var sec = {}; ids.forEach(function (i) { sec[i] = document.getElementById(i); });
  if (!sec.header) return;
  var inn = function (id) { return sec[id].firstElementChild; };
  var S = 1, vh = innerHeight, sy = 0;
  var fit = function () { S = Math.min(1, document.documentElement.clientWidth / W); };
  var H = function (id) { return parseFloat(sec[id].style.getPropertyValue('--h')); };
  var cells = [];
  var menuOpen = false, menuY = 0, menuIdx = -1;

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
  var ftRoot = inn('footer').firstElementChild;

  /* ---------- fixed navigation ---------- */
  var navEl = document.getElementById('ab-nav');
  var nav = document.createElement('div'); nav.id = 'pf-nav';
  var navIn = document.createElement('div'); navIn.className = 'pf-navin';
  nav.appendChild(navIn); document.body.appendChild(nav); navIn.appendChild(navEl);
  Object.assign(navEl.style, { paddingLeft: '80px', paddingRight: '80px', position: 'relative', left: '0', top: '0', transform: 'none', background: 'transparent', borderBottom: '0', transformOrigin: '0 0' });
  var navH = function () { return 80 * S; };
  function layoutNav() {
    navIn.style.height = navH() + 'px';
    navEl.style.transform = S < 1 ? 'scale(' + S + ')' : 'none';
    navEl.style.margin = S < 1 ? '0' : '0 auto';
  }
  $$('[class*="rounded-[200px]"]', nav).forEach(function (b) { b.style.overflow = 'hidden'; });
  var bar = document.createElement('div'); bar.id = 'pf-bar'; document.body.appendChild(bar);

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
    if (glow) { glow.style.top = '1263px'; glow.style.left = '-1500px'; glow.style.width = '4440px'; glow.style.opacity = '.42'; }
  }


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
    var paint = function () { b.setAttribute('role', 'switch'); b.setAttribute('aria-checked', String(sfx.on)); b.setAttribute('aria-label', 'Sound'); b.classList.toggle('on', sfx.on); if (!b.firstChild) b.innerHTML = '<span class="pfs-l">Sound</span><span class="pfs-t"><span class="pfs-k"><i></i><i></i><i></i></span></span>'; };
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
    var box = document.createElement('div'); box.className = 'pf-fl';
    box.style.cssText = 'position:absolute;left:80px;top:548px;width:1280px;';
    var li = '<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M20.45 20.45h-3.56v-5.57c0-1.33-.03-3.04-1.85-3.04-1.86 0-2.14 1.45-2.14 2.94v5.67H9.35V9h3.41v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28zM5.34 7.43a2.06 2.06 0 1 1 0-4.13 2.06 2.06 0 0 1 0 4.13zM7.12 20.45H3.56V9h3.56v11.45zM22.22 0H1.77C.79 0 0 .77 0 1.73v20.54C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.73V1.73C24 .77 23.2 0 22.22 0z"/></svg>';
    var xi = '<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M18.9 1.15h3.68l-8.04 9.19L24 22.85h-7.4l-5.8-7.58-6.63 7.58H.49l8.6-9.83L0 1.15h7.59l5.24 6.93 6.07-6.93zm-1.29 19.5h2.04L6.48 3.24H4.3l13.31 17.41z"/></svg>';
    var grp = function (h, links) { return '<div class="pf2-g"><h5>' + h + '</h5>' + links.map(function (l) { return '<a href="' + (l === 'About' ? 'about.html' : l === 'Licences' ? 'licences.html' : '#') + '">' + l + '</a>'; }).join('') + '</div>'; };
    box.className += ' pf2';
    box.innerHTML =
      '<div class="pf2-top">' +
        '<div class="pf2-logo"><img src="assets/pf/header-77157.svg" alt=""><span>Multigate</span></div>' +
        '<p class="pf2-tag">The trusted network powering African treasury and trade.</p>' +
        '<div class="pf-fc pf2-c" style="left:640px">' + grp('Platform', ['Multigate system', 'Payables Financing', 'For banks']) + grp('Trust', ['Licences', 'Certifications', 'Swift']) + '</div>' +
        '<div class="pf-fc pf2-c" style="left:865px">' + grp('Network', ['Coverage', 'Financiers', 'For payment companies and platforms', 'Developers']) + grp('Company', ['About', 'Leadership', 'Insights', 'Careers']) + '</div>' +
        '<div class="pf-fc pf2-c" style="left:1090px">' + grp('Get started', ['Book a Review', 'Sign In']) + '</div>' +
      '</div>' +
      '<div class="pf-frule"></div>' +
      '<div class="pf2-bot"><span>© 2026 Multigate Holdings Ltd</span><div class="pf-fsoc"><a href="#" aria-label="LinkedIn">' + li + '</a></div></div>' +
      '<p class="pf2-legal">Multigate is the trading name of the group headed by Multigate Holdings Ltd (Abu Dhabi Global Market). Regulated group companies: Multigate Network Pay Inc — licensed by the Central Bank of Nigeria as an International Money Transfer Operator, and registered with FINTRAC as a Money Services Business and with the Bank of Canada as a payment service provider; Multigate Network (MU) Ltd — licensed by the Financial Services Commission, Mauritius, for payment intermediary services. Financing is provided by participating Financiers; Multigate does not lend.</p>';
    ftRoot.appendChild(box);
    box.querySelectorAll('a').forEach(function (a) { a.addEventListener('click', function (e) { if (a.getAttribute('href') === '#') e.preventDefault(); }); });
    var f = box.querySelector('.pf-news-f'); if (f) f.addEventListener('submit', function (e) { e.preventDefault(); var v = f.querySelector('input').value.trim(); if (!/^\S+@\S+\.\S+$/.test(v)) { f.classList.add('bad'); return; } f.classList.remove('bad'); f.hidden = true; box.querySelector('.pf-news-ok').hidden = false; });
    if (!reduce) {
      rise(box.querySelector('.pf2-logo'), { y: 20, trigger: box }); rise(box.querySelector('.pf2-tag'), { y: 20, delay: 90, trigger: box });
      $$('.pf-fc', box).forEach(function (c, i) { rise(c, { y: 24, delay: 120 + i * 90, trigger: box }); });
      rise(box.querySelector('.pf2-bot'), { y: 12, delay: 400, trigger: box });
      rise(box.querySelector('.pf2-legal'), { y: 12, delay: 480, trigger: box });
    }
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


  /* ---------- mega menu: Product, Solutions, Who we serve, Company open a full-width panel ---------- */
  var menuOpen = false, menuY = 0, menuIdx = -1;
  var IC = {
    acct: '<rect x="3" y="5" width="14" height="10" rx="2"/><path d="M3 9h14"/>',
    eye: '<path d="M1.5 10S5 4 10 4s8.5 6 8.5 6-3.5 6-8.5 6-8.5-6-8.5-6z"/><circle cx="10" cy="10" r="2.5"/>',
    swap: '<path d="M4 7h11l-3-3M16 13H5l3 3"/>',
    coin: '<circle cx="10" cy="10" r="7"/><path d="M7.5 10h5M10 7.5v5"/>',
    chart: '<path d="M3 16V4M3 16h14M6.5 12l3-3 2.5 2 4-5"/>',
    bank: '<path d="M2.5 8 10 3.5 17.5 8M4.5 8v7M8 8v7M12 8v7M15.5 8v7M2.5 16.5h15"/>',
    users: '<circle cx="7.5" cy="7" r="2.8"/><path d="M2.5 16c0-3 2.2-5 5-5s5 2 5 5M13 4.5a2.6 2.6 0 0 1 0 5M14.5 11c2 .5 3 2.3 3 5"/>',
    doc: '<path d="M5 2.5h7l3.5 3.5v11.5H5z"/><path d="M12 2.5V6h3.5M7.5 10h5M7.5 13h5"/>',
    shield: '<path d="M10 2.5 16 5v5c0 3.6-2.5 6-6 7.5C6.5 16 4 13.6 4 10V5z"/>',
    brief: '<rect x="3" y="6" width="14" height="10" rx="1.5"/><path d="M7.5 6V4.5h5V6M3 10.5h14"/>'
  };
  var MENUS = [
    { name: 'Product', feat: { img: 'assets/pf/scrollh-fb47a.svg', t: 'See your money', c: 'A live view of cash across every bank you use.' }, secs: [
      { l: 'Accounts', i: [['Named virtual accounts', 'Give each customer their own account details', 'acct'], ['Cash visibility', 'One live view of cash across your banks', 'eye']] },
      { l: 'Payments', i: [['Payments and FX', 'Collect, convert and pay across African markets', 'swap']] },
      { l: 'Financing', i: [['Payables Financing', 'Get suppliers paid early while you keep your terms', 'coin']] },
      { l: 'Treasury', i: [['Treasury management system', 'See and control your money across your banks', 'chart']] }] },
    { name: 'Solutions', feat: { img: 'assets/pf/scrollh-8918e.svg', t: 'Pay suppliers early', c: 'Early payment on invoices you have already approved, with your payment terms unchanged.' }, secs: [
      { l: 'Visibility', i: [['See your cash', 'Balances across banks and currencies in one place', 'eye'], ['Reconcile faster', 'Match incoming payments to invoices automatically', 'doc']] },
      { l: 'Move money', i: [['Pay and collect in Africa', 'Local collections, currency conversion and payouts', 'swap'], ['Pay suppliers early', 'Early payment on approved invoices', 'coin']] },
      { l: 'Control', i: [['Approvals and controls', 'Approve and send payments from one screen', 'shield']] }] },
    { name: 'Who we serve', feat: { img: 'assets/pf/scrollh-ff863.svg', t: 'One network', c: 'Corporates, financiers, banks and financial institutions on one network.' }, secs: [
      { l: 'Businesses', i: [['Corporates', 'One interface to all your banks, payments and financing', 'brief']] },
      { l: 'Institutions', i: [['Financiers', 'Fund supplier invoices that large buyers have already approved', 'coin'], ['Banks', 'Give corporate clients ERP connectivity and ISO 20022 messaging, ready-made', 'bank'], ['Financial Institutions', 'Collect, pay out and convert in African currencies through one API', 'users']] }] },
    { name: 'Company', feat: { img: 'assets/pf/scrollh-800c1.svg', t: 'Building the network', c: 'Reflections from our team on Africa’s treasury and trade network.' }, secs: [
      { l: 'Company', i: [['About us', 'Who we are and why we built Multigate', 'users', 'about.html'], ['Leadership', 'The people building the network', 'users'], ['Careers', 'Join the team', 'brief']] },
      { l: 'Resources', i: [['Insights', 'News, analysis and expert views', 'doc'], ['Trust Centre', 'Licences, certifications and security', 'shield', 'licences.html']] }] }
  ];
  window.PF_MENUS = MENUS;
  function megaMenu() {
    var items = $$('[class*="rounded-[8px]"]', nav);
    if (items.length < 4) return;
    var chev = items[0].querySelector('[class*="w-[10px]"]');
    if (items[4]) items[4].style.display = 'none';                       // Resources now lives inside Company
    [2, 3].forEach(function (k) { var it = items[k]; it.style.display = 'flex'; it.style.alignItems = 'center'; it.style.gap = '4px'; if (chev) it.appendChild(chev.cloneNode(true)); });
    var ind = document.createElement('div'); ind.id = 'pf-ind'; document.body.appendChild(ind);
    var bd = document.createElement('div'); bd.id = 'pf-mbd'; document.body.appendChild(bd);
    var panel = document.createElement('div'); panel.id = 'pf-mega'; panel.setAttribute('role', 'region'); document.body.appendChild(panel);
    var inner = document.createElement('div'); inner.className = 'pfm-in'; panel.appendChild(inner);
    var arrow = '<svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M4 10h12M11 5l5 5-5 5"/></svg>';
    function html(m) {
      var cols = m.secs.map(function (sec, i) {
        return '<div class="pfm-col"><div class="pfm-cl">' + sec.l + '</div><div class="pfm-cs">' + sec.i.map(function (it) { return '<a href="' + (it[3] || '#') + '" class="pfm-lk">' + it[0] + '</a>'; }).join('') + '</div><div class="pfm-cn">0' + (i + 1) + '</div></div>';
      });
      while (cols.length < 5) cols.push('<div class="pfm-col pfm-empty"></div>');
      return cols.join('');
    }
    function place() {
      var r = nav.getBoundingClientRect();
      panel.style.top = r.bottom + 'px'; bd.style.top = r.bottom + 'px';
      inner.style.zoom = S < 1 ? S : '';
    }
    function mark(i) {
      items.slice(0, 4).forEach(function (it, k) {
        var on = k === i, ch = it.querySelector('[class*="w-[10px]"]');
        it.setAttribute('aria-expanded', String(on)); if (ch) { ch.style.transition = 'transform .35s cubic-bezier(.2,.7,.2,1)'; ch.style.transform = on ? 'rotate(180deg)' : ''; }
      });
      if (i >= 0) { var r = items[i].getBoundingClientRect(); ind.style.left = (r.left + r.width / 2 - 14) + 'px'; ind.style.opacity = '1'; } else ind.style.opacity = '0';
    }
    function open(i) {
      place();
      var fresh = !menuOpen;
      if (menuIdx !== i) {
        inner.style.opacity = '0'; inner.style.transform = 'translateY(-6px)';
        setTimeout(function () {
          inner.innerHTML = html(MENUS[i]);
          $$('a', inner).forEach(function (a) { a.addEventListener('click', function (e) { if (a.getAttribute('href') === '#') e.preventDefault(); close(); }); });
          $$('.pfm-lk', inner).forEach(function (a) { a.addEventListener('pointerenter', tick); });
          void inner.offsetWidth; inner.style.opacity = '1'; inner.style.transform = 'none';
          $$('.pfm-col > *', inner).forEach(function (el, k) { el.style.animation = 'pfmin .55s cubic-bezier(.2,.7,.2,1) ' + (k * 22) + 'ms both'; });
        }, fresh ? 0 : 140);
      }
      menuIdx = i; menuOpen = true; menuY = scrollY;
      panel.classList.add('open'); bd.classList.add('open'); nav.classList.remove('hide', 'dark'); nav.classList.add('stuck', 'menu'); mark(i);
    }
    function close() {
      if (!menuOpen) return;
      menuOpen = false; menuIdx = -1; panel.classList.remove('open'); bd.classList.remove('open'); nav.classList.remove('menu'); mark(-1);
    }
    window.__pfCloseMenu = close;
    items.slice(0, 4).forEach(function (it, k) {
      it.setAttribute('role', 'button'); it.setAttribute('tabindex', '0'); it.setAttribute('aria-expanded', 'false'); it.style.cursor = 'pointer';
      it.addEventListener('click', function (e) { e.preventDefault(); menuIdx === k && menuOpen ? close() : open(k); });
      it.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); menuIdx === k && menuOpen ? close() : open(k); } });
    });
    bd.addEventListener('click', close);
    addEventListener('keydown', function (e) { if (e.key === 'Escape') close(); });
    document.addEventListener('pointerdown', function (e) { if (menuOpen && !panel.contains(e.target) && !nav.contains(e.target)) close(); });
    addEventListener('resize', function () { if (menuOpen) { place(); mark(menuIdx); } });
  }

  window.__pfBook = openBooking;
  /* ================= Licences page: an interactive dotted globe ================= */
  var ORDER = ['CAN', 'GHA', 'NGA', 'UGA', 'KEN', 'MOZ', 'MUS'];          // west to east: the order of the previous / next buttons
  var LIST_ORDER = ['NGA', 'CAN', 'KEN', 'MOZ', 'UGA', 'GHA', 'MUS'];     // the order of the compliance team's table
  var FLAG = {
    CAN: 'assets/pf/lic/ca.svg', NGA: 'assets/pf/lic/ng.svg', GHA: 'assets/pf/lic/gh.svg', KEN: 'assets/pf/lic/ke.svg',
    UGA: 'assets/pf/lic/ug.svg', MOZ: 'assets/pf/lic/mz.svg', MUS: 'assets/pf/lic/mu.svg'
  };
  var NP = 'Multigate Network Pay Inc.';
  var REC = {
    NGA: { name: 'Nigeria', items: [
      { t: 'l', title: 'Payment Solution Service Provider (PSSP) licence', reg: 'Central Bank of Nigeria', ent: 'Multigate Payment Limited, Nigeria' },
      { t: 'l', title: 'International Money Transfer Operator (IMTO) licence', reg: 'Central Bank of Nigeria', ent: NP }] },
    CAN: { name: 'Canada', items: [
      { t: 'l', title: 'Money Services Business licence', reg: 'Financial Transactions and Reports Analysis Centre of Canada', ent: NP }] },
    KEN: { name: 'Kenya', items: [
      { t: 'a', title: 'To provide FX and B2B services', reg: 'Central Bank of Kenya', ent: NP }] },
    MOZ: { name: 'Mozambique', items: [
      { t: 'a', title: 'To open a local account for revenue collection', reg: 'Bank of Mozambique', ent: NP }] },
    UGA: { name: 'Uganda', items: [
      { t: 'l', title: 'Money Remittance Business licence', reg: 'Bank of Uganda', ent: 'Multigate Payment Limited, Uganda' },
      { t: 'l', title: 'Forex Bureau licence', reg: 'Bank of Uganda', ent: 'Multigate Payment Limited, Uganda, and ' + NP }] },
    GHA: { name: 'Ghana', items: [
      { t: 'a', title: 'To terminate remittances to bank accounts, mobile wallets and OTC cash pick-ups', reg: 'Bank of Ghana', ent: NP }] },
    MUS: { name: 'Mauritius', items: [
      { t: 'l', title: 'Global Business licence', reg: 'FSC Mauritius', ent: 'Multigate Network Payment (MU) Ltd' },
      { t: 'l', title: 'Payment Intermediary Services licence', reg: 'FSC Mauritius', ent: 'Multigate Network Payment (MU) Ltd' }] }
  };
  function label(r) { var n = r.items.length, ap = r.items.every(function (x) { return x.t === 'a'; }); return n + ' ' + (ap ? 'approval' : 'licence') + (n > 1 ? 's' : ''); }
  var slug = function (iso) { return REC[iso].name.toLowerCase(); };

  var lmhero = document.getElementById('lmhero'), lm = document.getElementById('lm');
  var gStage = $('.lg-stage', lmhero), cv = $('#lg-canvas', lmhero), labelsEl = $('.lg-labels', lmhero), panel = $('#lm-panel'), copyEl = $('.lg-copy', lmhero), LG = window.LG;
  var TAU = Math.PI * 2, D2R = Math.PI / 180;
  var G = { ctx: null, dpr: 1, w: 0, h: 0, R: 480, cx: 0, cy: 0, vis: true, run: false };
  var HOME = { lon: -22, lat: 13 };
  var cam = { lon: HOME.lon + 46, lat: HOME.lat - 4, zoom: .86, ox: 0 }, tw = null;
  var drift = { amp: 0 }, par = { x: 0, y: 0 };
  var cur = null, hov = null, mouse = { x: -1e4, y: -1e4, on: false, lens: 0 };
  var drag = null, vel = { x: 0, y: 0 }, lastIn = performance.now(), born = 0, dotsReady = false;
  var BASE, LIC = {}, STARS = [], GRAT = [], CHIPS = {}, PINS = {};

  function prep(flat) {
    var n = flat.length / 2, o = { n: n, cl: new Float32Array(n), sl: new Float32Array(n), cp: new Float32Array(n), sp: new Float32Array(n), x: new Float32Array(n), y: new Float32Array(n), c: new Float32Array(n) };
    for (var i = 0; i < n; i++) { var lo = flat[i * 2] / 100 * D2R, la = flat[i * 2 + 1] / 100 * D2R; o.cl[i] = Math.cos(lo); o.sl[i] = Math.sin(lo); o.cp[i] = Math.cos(la); o.sp[i] = Math.sin(la); }
    return o;
  }

  /* ---------- panel (same content as before, dressed for the dark section) ---------- */
  var pad2 = function (n) { return (n < 10 ? '0' : '') + n; };
  var ARR_L = '<svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="square"><path d="M16 10H4M9 5l-5 5 5 5"/></svg>';
  var ARR_R = '<svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="square"><path d="M4 10h12M11 5l5 5-5 5"/></svg>';
  function panelHTML(i) {
    var r = REC[i], k = ORDER.indexOf(i), pv = REC[ORDER[(k + ORDER.length - 1) % ORDER.length]], nx = REC[ORDER[(k + 1) % ORDER.length]];
    var items = r.items.map(function (x, n) {
      var ap = x.t === 'a';
      return '<article class="lp-it"><span class="lp-n">' + pad2(n + 1) + '</span><div><p class="lp-ty"><i class="' + (ap ? 'ap' : '') + '"></i>' + (ap ? 'No-objection approval' : 'Licence') + '</p><h4>' + x.title + '</h4>' +
        '<dl><div><dt>Regulator</dt><dd>' + x.reg + '</dd></div><div><dt>Held by</dt><dd>' + x.ent + '</dd></div></dl></div></article>';
    }).join('');
    return '<div class="lp-top"><span class="lp-idx">' + pad2(k + 1) + '<i> / ' + pad2(ORDER.length) + '</i></span><button class="lp-x" type="button" aria-label="Close"><span>Close</span><svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="square"><path d="M3 3l10 10M13 3L3 13"/></svg></button></div>' +
      '<div class="lp-sil"><canvas aria-hidden="true"></canvas><div class="lp-fl"><img src="' + FLAG[i] + '" alt=""></div><span class="lp-iso">' + i + '</span><b class="lp-c tl"></b><b class="lp-c tr"></b><b class="lp-c bl"></b><b class="lp-c br"></b></div>' +
      '<div class="lp-body"><div class="lp-stg"><h3 class="lp-t">' + r.name + '</h3><p class="lp-eb"><i></i>' + label(r) + '</p><div class="lp-list">' + items + '</div></div></div>' +
      '<div class="lp-nv"><button type="button" class="lp-b" data-d="-1" aria-label="Previous: ' + pv.name + '">' + ARR_L + '<i>' + pv.name + '</i></button>' +
      '<button type="button" class="lp-b" data-d="1" aria-label="Next: ' + nx.name + '"><i>' + nx.name + '</i>' + ARR_R + '</button></div>';
  }

  /* a dot silhouette of the country, built from the same dots as the globe, scattering in */
  function silhouette(i) {
    var cvs = $('.lp-sil canvas', panel); if (!cvs) return;
    var box = cvs.parentNode, w = box.clientWidth, h = box.clientHeight, dpr = Math.min(2, window.devicePixelRatio || 1);
    if (!w || !h) return;
    cvs.width = Math.round(w * dpr); cvs.height = Math.round(h * dpr); cvs.style.width = w + 'px'; cvs.style.height = h + 'px';
    var c = cvs.getContext('2d'), m = LG.lic[i], d = m.d, n = d.length / 2, k = Math.cos(m.c[1] * D2R), pts = [], minX = 1e9, maxX = -1e9, minY = 1e9, maxY = -1e9, q;
    for (q = 0; q < n; q++) { var x = d[q * 2] / 100 * k, y = -d[q * 2 + 1] / 100; pts.push([x, y]); if (x < minX) minX = x; if (x > maxX) maxX = x; if (y < minY) minY = y; if (y > maxY) maxY = y; }
    if (i === 'CAN') { /* the far north would shrink the mainland: crop to the southern band */ }
    var bw = Math.max(.2, maxX - minX), bh = Math.max(.2, maxY - minY), padX = 64, padT = 20, padB = 26;
    var sc = Math.min((w - padX * 2) / bw, (h - padT - padB) / bh), ox = (w - bw * sc) / 2 - minX * sc, oy = padT + ((h - padT - padB) - bh * sc) / 2 - minY * sc;
    var sp = Math.sqrt(bw * bh * sc * sc * .55 / n), rad = clamp(sp * .36, .7, 2.5);
    var pin = [m.p[0] * k, -m.p[1]], px = pin[0] * sc + ox, py = pin[1] * sc + oy;
    var t0 = performance.now(), D = reduce ? 1 : 1200;
    (function f(now) {
      var tt = clamp((now - t0) / D, 0, 1);
      c.setTransform(dpr, 0, 0, dpr, 0, 0); c.clearRect(0, 0, w, h);
      // ruler ticks along the foot
      c.strokeStyle = 'rgba(35,36,38,.3)'; c.lineWidth = 1; c.beginPath();
      for (var tx = 14; tx < w - 13; tx += 8) { var long = ((tx - 14) / 8) % 5 === 0; c.moveTo(tx + .5, h - 1); c.lineTo(tx + .5, h - (long ? 9 : 5)); }
      c.stroke();
      // dots scatter in from left to right
      c.fillStyle = '#041431';
      for (var z = 0; z < n; z++) {
        var o = (pts[z][0] - minX) / bw, a = clamp(tt * 1.7 - o * .7, 0, 1); if (a <= 0) continue;
        c.globalAlpha = .9 * a; c.beginPath(); c.arc(pts[z][0] * sc + ox, pts[z][1] * sc + oy, rad * (.5 + .5 * a), 0, TAU); c.fill();
      }
      c.globalAlpha = 1;
      // crosshair on the pin
      var ca = clamp((tt - .45) / .55, 0, 1);
      c.strokeStyle = 'rgba(19,98,245,' + (.55 * ca).toFixed(3) + ')'; c.lineWidth = 1; c.setLineDash([3, 3]);
      c.beginPath(); c.moveTo(px + .5, 12); c.lineTo(px + .5, h - 12); c.moveTo(14, py + .5); c.lineTo(w - 14, py + .5); c.stroke(); c.setLineDash([]);
      c.fillStyle = '#fff'; c.beginPath(); c.arc(px, py, 5.2 * ca, 0, TAU); c.fill();
      c.fillStyle = '#1362f5'; c.beginPath(); c.arc(px, py, 3.2 * ca, 0, TAU); c.fill();
      if (tt < 1) requestAnimationFrame(f);
    })(t0);
  }

  /* ---------- camera ---------- */
  function wrap(a) { while (a > 180) a -= 360; while (a < -180) a += 360; return a; }
  function fly(to, dur) {
    var a = { lon: cam.lon, lat: cam.lat, zoom: cam.zoom, ox: cam.ox }, d = wrap(to.lon - a.lon), t0 = performance.now();
    if (reduce || !dur) { cam.lon = wrap(a.lon + d); cam.lat = to.lat; cam.zoom = to.zoom; cam.ox = to.ox; tw = null; return; }
    tw = { a: a, d: d, to: to, t0: t0, dur: dur };
  }
  function stepTween(now) {
    if (!tw) return;
    var t = Math.min(1, (now - tw.t0) / tw.dur), e = t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    cam.lon = wrap(tw.a.lon + tw.d * e); cam.lat = tw.a.lat + (tw.to.lat - tw.a.lat) * e;
    cam.zoom = tw.a.zoom * Math.pow(tw.to.zoom / tw.a.zoom, e); cam.ox = tw.a.ox + (tw.to.ox - tw.a.ox) * e;
    if (t >= 1) tw = null;
  }
  function panelShift() { return innerWidth >= 900 ? -G.w * (innerWidth < 1200 ? .24 : .2) : innerWidth >= 768 ? -(Math.min(panel.offsetWidth || 410, 420) / 2 + 8) : 0; }
  function select(i, o) {
    o = o || {};
    cur = i; hov = null; lmhero.classList.add('used', 'has');
    panel.innerHTML = panelHTML(i); panel.classList.add('open'); setTimeout(function () { silhouette(i); }, 380);
    $('.lp-x', panel).addEventListener('click', closeP);
    $$('.lp-nv button', panel).forEach(function (b) { b.addEventListener('click', function () { step(+b.getAttribute('data-d')); }); b.addEventListener('pointerenter', tick); });
    var pb = $('.lp-body', panel);
    function more() { pb.classList.toggle('more', pb.scrollHeight - pb.scrollTop - pb.clientHeight > 6 && innerWidth >= 768); }
    pb.addEventListener('scroll', more, { passive: true }); setTimeout(more, 80); setTimeout(more, 900);
    var m = LG.lic[i], ph = innerWidth < 768;
    fly({ lon: m.c[0], lat: m.c[1] * .9, zoom: m.z * (ph ? .82 : 1), ox: panelShift() }, o.instant ? 0 : 1500);
    paintSel();
    try { history.replaceState(null, '', '#' + slug(i)); } catch (e) {}
    if (ph && !o.quiet) setTimeout(function () { var r = panel.getBoundingClientRect(); if (r.top > innerHeight - 140 || r.top < 70) scrollTo({ top: scrollY + r.top - 90, behavior: 'smooth' }); }, 320);
  }
  function closeP() {
    cur = null; panel.classList.remove('open'); lmhero.classList.remove('has'); paintSel();
    fly({ lon: HOME.lon, lat: HOME.lat, zoom: 1, ox: 0 }, 1300);
    try { history.replaceState(null, '', location.pathname + location.search); } catch (e) {}
  }
  function step(d) { var k = ORDER.indexOf(cur); select(ORDER[(k + d + ORDER.length) % ORDER.length], { quiet: true }); }
  function paintSel() {
    $$('.lg-chip', lmhero).forEach(function (c) { c.classList.toggle('sel', c.getAttribute('data-i') === cur); });
    $$('.lm-chips button', lmhero).forEach(function (c) { c.classList.toggle('sel', c.getAttribute('data-i') === cur); });
  }

  /* ---------- sizing ---------- */
  function size() {
    var ph = innerWidth < 768, wide = innerWidth >= 900;
    var w = gStage.clientWidth;
    lmhero.classList.toggle('wide', wide);
    if (wide) {
      var hh = clamp(innerHeight, 760, 1100), tab = w < 1200;
      lmhero.style.height = hh + 'px';
      G.R = Math.min(w * (tab ? .29 : .3), hh * .5); G.cy = hh * .545;
      var copyR = copyEl.getBoundingClientRect().right - lmhero.getBoundingClientRect().left;
      G.cx = clamp(Math.max(w * (tab ? .645 : .625), copyR - 70 + G.R), 0, w - G.R * 1.03);
    } else if (!ph) {
      var cb = copyEl.getBoundingClientRect().bottom - lmhero.getBoundingClientRect().top;
      G.R = clamp(w * .4, 300, 520); G.cx = w / 2; G.cy = cb + G.R * .92;
      lmhero.style.height = Math.max(Math.round(G.cy + G.R * .6), 760) + 'px';
    } else { G.R = w * .5; G.cx = w / 2; G.cy = 440 * .52; lmhero.style.height = ''; }
    var h = gStage.clientHeight;
    G.dpr = Math.min(2, window.devicePixelRatio || 1); G.w = w; G.h = h;
    cv.width = Math.round(w * G.dpr); cv.height = Math.round(h * G.dpr);
    G.ctx = cv.getContext('2d');
    Object.keys(CHIPS).forEach(function (k) { CHIPS[k].w = CHIPS[k].el.offsetWidth; CHIPS[k].h = CHIPS[k].el.offsetHeight; });
    if (cur && !tw) cam.ox = panelShift();
  }

  /* ---------- the picture ---------- */
  var BUCKETS = 6;
  function project(o, c0l, s0l, c0p, s0p, cxx, cyy, Rr) {
    for (var i = 0; i < o.n; i++) {
      var cd = o.cl[i] * c0l + o.sl[i] * s0l, sd = o.sl[i] * c0l - o.cl[i] * s0l;
      var cc = s0p * o.sp[i] + c0p * o.cp[i] * cd;
      o.c[i] = cc;
      if (cc > .02) { o.x[i] = cxx + o.cp[i] * sd * Rr; o.y[i] = cyy - (c0p * o.sp[i] - s0p * o.cp[i] * cd) * Rr; }
    }
  }
  function drawDots(ctx, o, rgb, baseA, minA, rBase, now, lensOn, cls) {
    var LR = 96, i, k, x, y, cc, d, f, r, a;
    // bucket the dots by depth so each bucket is one path
    for (k = 0; k < BUCKETS; k++) {
      ctx.beginPath(); var any = false;
      for (i = 0; i < o.n; i++) {
        cc = o.c[i]; if (cc <= .02) continue;
        var b = Math.min(BUCKETS - 1, (cc * BUCKETS) | 0); if (b !== k) continue;
        x = o.x[i]; y = o.y[i]; r = rBase * (.45 + .55 * cc);
        if (lensOn) { var dx = x - mouse.x, dy = y - mouse.y, d2 = dx * dx + dy * dy; if (d2 < LR * LR) { d = Math.sqrt(d2); f = 1 - d / LR; f *= f; r *= 1 + 1.5 * f * mouse.lens; var push = 10 * f * mouse.lens / (d + 1); x += dx * push; y += dy * push; } }
        ctx.moveTo(x + r, y); ctx.arc(x, y, r, 0, TAU); any = true;
      }
      if (!any) continue;
      var kc = (k + .5) / BUCKETS;
      a = (minA + (baseA - minA) * Math.pow(kc, 1.15)) * cls.alpha;
      ctx.fillStyle = 'rgba(' + rgb + ',' + a.toFixed(3) + ')'; ctx.fill();
    }
  }

  function render(now) {
    var ctx = G.ctx; if (!ctx) return;
    var dpr = G.dpr, w = G.w, h = G.h, t = now * .001;
    var age = Math.min(1, (now - born) / 2400), intro = 1 - Math.pow(1 - age, 3);
    stepTween(now);
    // drift: a slow breathing sway while nobody is touching it
    var idle = !drag && !cur && !tw && now - lastIn > 2400 && !reduce;
    drift.amp += ((idle ? 1 : 0) - drift.amp) * .02;
    var dl = Math.sin(t * .27) * 17 * drift.amp, dp = Math.sin(t * .41) * 3.2 * drift.amp;
    if (!drag) { cam.lon = wrap(cam.lon + vel.x); cam.lat = clamp(cam.lat + vel.y, -42, 68); vel.x *= .94; vel.y *= .94; if (Math.abs(vel.x) < .002) vel.x = 0; if (Math.abs(vel.y) < .002) vel.y = 0; }
    par.x += (mouse.px - par.x) * .06; par.y += (mouse.py - par.y) * .06;
    mouse.lens += ((mouse.on && !drag ? 1 : 0) - mouse.lens) * .12;

    var lon0 = (cam.lon + dl + par.x * 2.2) * D2R, lat0 = (cam.lat + dp - par.y * 1.4) * D2R;
    var c0l = Math.cos(lon0), s0l = Math.sin(lon0), c0p = Math.cos(lat0), s0p = Math.sin(lat0);
    var Rr = G.R * cam.zoom * (.9 + .1 * intro), cxx = G.cx + cam.ox + par.x * 9, cyy = G.cy + par.y * 5;
    if (cam.zoom > 1.2) { /* keep the zoomed country in the middle of the free area, not the globe centre */ cyy = G.cy + (G.h * .5 - G.cy) * clamp((cam.zoom - 1) * .9, 0, 1) + par.y * 5; }

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, w, h);

    // a pale neutral sphere: no blue wash, only fine lines
    var g = ctx.createRadialGradient(cxx - Rr * .34, cyy - Rr * .42, Rr * .04, cxx, cyy, Rr);
    g.addColorStop(0, 'rgba(255,255,255,' + intro.toFixed(3) + ')'); g.addColorStop(.6, 'rgba(249,250,252,' + intro.toFixed(3) + ')'); g.addColorStop(1, 'rgba(238,240,245,' + intro.toFixed(3) + ')');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(cxx, cyy, Rr, 0, TAU); ctx.fill();
    g = ctx.createRadialGradient(cxx, cyy, Rr * .86, cxx, cyy, Rr); g.addColorStop(0, 'rgba(35,36,38,0)'); g.addColorStop(1, 'rgba(35,36,38,' + (.06 * intro).toFixed(3) + ')');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(cxx, cyy, Rr, 0, TAU); ctx.fill();
    ctx.strokeStyle = 'rgba(35,36,38,' + (.26 * intro).toFixed(3) + ')'; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(cxx, cyy, Rr, 0, TAU); ctx.stroke();

    // graticule
    ctx.lineWidth = .8; ctx.lineCap = 'round';
    for (var q = 0; q < GRAT.length; q++) {
      var L = GRAT[q], px0 = 0, py0 = 0, pc0 = -1;
      for (var m = 0; m < L.n; m++) {
        var cd = L.cl[m] * c0l + L.sl[m] * s0l, sd = L.sl[m] * c0l - L.cl[m] * s0l, cc = s0p * L.sp[m] + c0p * L.cp[m] * cd;
        var gx = cxx + L.cp[m] * sd * Rr, gy = cyy - (c0p * L.sp[m] - s0p * L.cp[m] * cd) * Rr;
        if (m > 0 && cc > .02 && pc0 > .02) { ctx.strokeStyle = 'rgba(35,36,38,' + ((.045 + .085 * Math.min(cc, pc0)) * intro).toFixed(3) + ')'; ctx.beginPath(); ctx.moveTo(px0, py0); ctx.lineTo(gx, gy); ctx.stroke(); }
        px0 = gx; py0 = gy; pc0 = cc;
      }
    }

    // land
    var lensOn = mouse.lens > .01;
    project(BASE, c0l, s0l, c0p, s0p, cxx, cyy, Rr);
    drawDots(ctx, BASE, '74,82,98', .62 * intro, .13 * intro, Rr * .0036, now, lensOn, { alpha: cur ? .7 : 1 });
    // licensed countries: each country is its own layer so it can light up on its own
    var nearD = 1e9, nearI = null, hit = 17;
    for (var k = 0; k < ORDER.length; k++) {
      var iso = ORDER[k], o = LIC[iso].o;
      project(o, c0l, s0l, c0p, s0p, cxx, cyy, Rr);
      var on = iso === cur, hv = iso === hov, dim = cur && !on;
      var rgb = on ? '4,20,49' : hv ? '19,98,245' : '19,98,245';
      var shimmer = .86 + .14 * Math.sin(t * 1.7 + k * 1.3);
      drawDots(ctx, o, rgb, (on ? 1 : hv ? .98 : .86) * intro * shimmer * (dim ? .5 : 1), (on ? .6 : .34) * intro * (dim ? .5 : 1), Rr * LG.lic[iso].rf * (on ? 1.05 : hv ? 1.12 : 1), now, lensOn, { alpha: 1 });
      // glow under the country
      var pin = LIC[iso].pin; var pcd = pin.cl * c0l + pin.sl * s0l, pcc = s0p * pin.sp + c0p * pin.cp * pcd;
      var psx = cxx + pin.cp * (pin.sl * c0l - pin.cl * s0l) * Rr, psy = cyy - (c0p * pin.sp - s0p * pin.cp * pcd) * Rr;
      LIC[iso].sx = psx; LIC[iso].sy = psy; LIC[iso].cc = pcc;
      if (pcc > .05 && mouse.on && !drag) {
        for (var i2 = 0; i2 < o.n; i2 += 2) { if (o.c[i2] <= .05) continue; var ddx = o.x[i2] - mouse.x, ddy = o.y[i2] - mouse.y, dd = ddx * ddx + ddy * ddy; if (dd < nearD) { nearD = dd; nearI = iso; } }
      }
      if (pcc > .05) {
        ctx.save();
        var gr = Rr * (iso === 'CAN' ? .34 : .13) * (on ? 1.4 : 1), gg = ctx.createRadialGradient(psx, psy, 0, psx, psy, gr);
        gg.addColorStop(0, 'rgba(19,98,245,' + ((on ? .10 : hv ? .09 : .04) * pcc * intro).toFixed(3) + ')'); gg.addColorStop(1, 'rgba(19,98,245,0)');
        ctx.fillStyle = gg; ctx.beginPath(); ctx.arc(psx, psy, gr, 0, TAU); ctx.fill(); ctx.restore();
      }
    }
    var nh = nearI && nearD < hit * hit ? nearI : null;
    if (nh !== hov) { hov = nh; gStage.classList.toggle('hov', !!hov); if (hov) tick(); }

    // cursor light
    if (mouse.lens > .02) { ctx.save(); var lg = ctx.createRadialGradient(mouse.x, mouse.y, 0, mouse.x, mouse.y, 150); lg.addColorStop(0, 'rgba(19,98,245,' + (.05 * mouse.lens).toFixed(3) + ')'); lg.addColorStop(1, 'rgba(19,98,245,0)'); ctx.fillStyle = lg; ctx.beginPath(); ctx.arc(mouse.x, mouse.y, 150, 0, TAU); ctx.fill(); ctx.restore(); }

    // pins, pulses, leader lines, labels
    var showChips = intro > .55;
    for (var n = 0; n < ORDER.length; n++) {
      var is = ORDER[n], P = LIC[is], vis = clamp((P.cc - .1) / .22, 0, 1), ch = CHIPS[is], sel = is === cur;
      var chipA = showChips ? vis * (cur && !sel ? .4 : 1) : 0;
      if (vis > 0) {
        var pa = vis * intro;
        for (var rg = 0; rg < 2; rg++) { var ph = ((t * .42 + rg * .5 + n * .13) % 1), rr = 5 + ph * (sel ? 34 : 24); ctx.strokeStyle = 'rgba(19,98,245,' + ((1 - ph) * .6 * pa).toFixed(3) + ')'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.arc(P.sx, P.sy, rr, 0, TAU); ctx.stroke(); }
        ctx.fillStyle = 'rgba(4,20,49,' + (.10 * pa).toFixed(3) + ')'; ctx.beginPath(); ctx.arc(P.sx, P.sy, 10, 0, TAU); ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,' + pa.toFixed(3) + ')'; ctx.beginPath(); ctx.arc(P.sx, P.sy, sel ? 6.8 : 5.6, 0, TAU); ctx.fill();
        ctx.fillStyle = 'rgba(4,20,49,' + pa.toFixed(3) + ')'; ctx.beginPath(); ctx.arc(P.sx, P.sy, sel ? 4.4 : 3.6, 0, TAU); ctx.fill();
        // leader: from the pin to the nearest edge of its label
        var lx = P.sx + P.s[0], ly = P.sy + P.s[1], tx = clamp(P.sx, lx, lx + ch.w), ty = clamp(P.sy, ly, ly + ch.h);
        if (innerWidth >= 768) { ctx.strokeStyle = 'rgba(4,20,49,' + (.34 * chipA).toFixed(3) + ')'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(P.sx, P.sy); ctx.lineTo(tx, ty); ctx.stroke(); }
      }
      var lx2 = innerWidth >= 768 ? P.sx + P.s[0] : P.sx - ch.w / 2, ly2 = innerWidth >= 768 ? P.sy + P.s[1] : P.sy - ch.h - 14;
      lx2 = clamp(lx2, 12, G.w - ch.w - 12);
      ch.el.style.transform = 'translate3d(' + lx2.toFixed(1) + 'px,' + ly2.toFixed(1) + 'px,0)';
      ch.el.style.opacity = chipA.toFixed(3); ch.el.style.pointerEvents = chipA > .6 ? 'auto' : 'none';
      ch.el.classList.toggle('hov', is === hov);
    }
  }

  function loop(now) {
    if (!G.vis) { G.run = false; return; }
    render(now); requestAnimationFrame(loop);
  }
  function kick() { if (!G.run && G.vis) { G.run = true; requestAnimationFrame(loop); } }

  function globeInit() {
    if (!LG || !cv) return;
    BASE = prep(LG.base);
    ORDER.forEach(function (i) { var m = LG.lic[i]; var pl = m.p[0] * D2R, pp = m.p[1] * D2R; LIC[i] = { o: prep(m.d), s: m.s, pin: { cl: Math.cos(pl), sl: Math.sin(pl), cp: Math.cos(pp), sp: Math.sin(pp) }, sx: 0, sy: 0, cc: -1 }; });
    for (var i = 0; i < 150; i++) STARS.push({ x: Math.random(), y: Math.random(), s: Math.random() < .12 ? 2 : 1, a: .2 + Math.random() * .55, sp: .6 + Math.random() * 1.8, ph: Math.random() * 6, d: Math.random() });
    // graticule: meridians and parallels every 15 degrees
    function line(pts) { var o = prep(pts); GRAT.push(o); }
    for (var lo = -180; lo < 180; lo += 15) { var a = []; for (var la = -75; la <= 75; la += 5) a.push(lo * 100, la * 100); line(a); }
    for (var la2 = -75; la2 <= 75; la2 += 15) { var b = []; for (var lo2 = -180; lo2 <= 180; lo2 += 5) b.push(lo2 * 100, la2 * 100); line(b); }

    labelsEl.innerHTML = ORDER.map(function (i) {
      return '<button type="button" class="lg-chip" data-i="' + i + '" aria-label="' + REC[i].name + ', ' + label(REC[i]) + '"><span class="lg-cb"><img src="' + FLAG[i] + '" alt=""></span><span class="lg-cn"><b>' + REC[i].name + '</b><small>' + label(REC[i]) + '</small></span></button>';
    }).join('');
    $$('.lg-chip', labelsEl).forEach(function (el) {
      var i = el.getAttribute('data-i'); CHIPS[i] = { el: el, w: 160, h: 46 };
      el.addEventListener('click', function (e) { e.stopPropagation(); cur === i ? closeP() : select(i); });
      el.addEventListener('pointerenter', function () { hov = i; tick(); });
      el.addEventListener('pointerleave', function () { if (hov === i) hov = null; });
    });
    var chipsEl = $('.lm-chips', lmhero);
    chipsEl.innerHTML = ORDER.map(function (i) { return '<button type="button" data-i="' + i + '"><img src="' + FLAG[i] + '" alt="">' + REC[i].name + '</button>'; }).join('');
    $$('button', chipsEl).forEach(function (b) { b.addEventListener('click', function () { var i = b.getAttribute('data-i'); cur === i ? closeP() : select(i); }); });

    size();
    mouse.px = 0; mouse.py = 0;
    var rectOf = function () { return gStage.getBoundingClientRect(); };
    gStage.addEventListener('pointermove', function (e) {
      var r = rectOf(); mouse.x = e.clientX - r.left; mouse.y = e.clientY - r.top; mouse.on = true;
      mouse.px = clamp((mouse.x / r.width - .5) * 2, -1, 1); mouse.py = clamp((mouse.y / r.height - .5) * 2, -1, 1);
      if (drag) {
        var dx = e.clientX - drag.x, dy = e.clientY - drag.y; drag.x = e.clientX; drag.y = e.clientY; drag.moved += Math.abs(dx) + Math.abs(dy);
        if (drag.moved > 6) { gStage.classList.add('drag'); tw = null; }
        var Rr = G.R * cam.zoom, k = 57.3 / Rr;
        var dlon = -dx * k / Math.max(.45, Math.cos(cam.lat * D2R)), dlat = dy * k;
        cam.lon = wrap(cam.lon + dlon); cam.lat = clamp(cam.lat + dlat, -42, 68); vel.x = dlon * .6; vel.y = dlat * .6;
      }
      lastIn = performance.now(); kick();
    });
    gStage.addEventListener('pointerleave', function () { mouse.on = false; mouse.px = 0; mouse.py = 0; });
    gStage.addEventListener('pointerdown', function (e) {
      if (e.target.closest('.lg-chip')) return;
      drag = { x: e.clientX, y: e.clientY, moved: 0 }; vel.x = vel.y = 0; lastIn = performance.now();
      var r = rectOf(); mouse.x = e.clientX - r.left; mouse.y = e.clientY - r.top; mouse.on = true;
      try { gStage.setPointerCapture(e.pointerId); } catch (x) {}
      lmhero.classList.add('used');
    });
    function up(e) {
      if (!drag) return;
      var was = drag; drag = null; gStage.classList.remove('drag'); lastIn = performance.now();
      if (was.moved <= 6) { if (hov) { select(hov); } else if (cur) closeP(); }
    }
    gStage.addEventListener('pointerup', up); gStage.addEventListener('pointercancel', function () { drag = null; gStage.classList.remove('drag'); });
    addEventListener('keydown', function (e) {
      if (menuOpen) return;
      if (e.key === 'Escape' && cur) closeP();
      else if (cur && (e.key === 'ArrowRight' || e.key === 'ArrowLeft') && !/INPUT|TEXTAREA/.test((document.activeElement || {}).tagName || '')) { e.preventDefault(); step(e.key === 'ArrowRight' ? 1 : -1); }
    });

    new IntersectionObserver(function (es) { G.vis = es[0].isIntersecting; if (G.vis) kick(); }).observe(lmhero);
    addEventListener('resize', function () { size(); });
    born = performance.now(); mouse.px = 0; mouse.py = 0;
    if (reduce) { cam.lon = HOME.lon; cam.lat = HOME.lat; cam.zoom = 1; } else fly({ lon: HOME.lon, lat: HOME.lat, zoom: 1, ox: 0 }, 2800);
    var hs = (location.hash || '').slice(1).toLowerCase(), hi = ORDER.filter(function (i) { return slug(i) === hs; })[0];
    if (hi) setTimeout(function () { select(hi, { instant: true, quiet: true }); }, 50);
    kick();
  }

  /* ---------- the list underneath (the compliance team's table) ---------- */
  function listInit() {
    var rows = [];
    LIST_ORDER.forEach(function (i) {
      REC[i].items.forEach(function (x, k) {
        rows.push('<tr class="' + (k ? 'cont' : 'first') + '"><td class="c" data-l="Country"><div><img src="' + FLAG[i] + '" alt=""><span>' + REC[i].name + '</span></div></td>' +
          '<td data-l="Licence / approval"><b>' + x.title + '</b><small class="' + (x.t === 'a' ? 'ap' : '') + '">' + (x.t === 'a' ? 'No-objection approval' : 'Licence') + '</small></td>' +
          '<td data-l="Regulator">' + x.reg + '</td><td data-l="Multigate entity">' + x.ent + '</td></tr>');
      });
    });
    $('.lm-list', lm).innerHTML = '<table class="lm-tb"><thead><tr><th>Country</th><th>Licence / approval</th><th>Regulator</th><th>Multigate entity</th></tr></thead><tbody>' + rows.join('') + '</tbody></table>';
  }

  /* reveals */
  function reveals() {
    if (reduce) return;
    rise($('.lg-eb', lmhero), { y: 16, delay: 100, trigger: false });
    words(P('Licensed and Approved', lmhero), { each: 70, delay: 220, trigger: false });
    rise($('.lg-sub', lmhero), { y: 20, delay: 800, trigger: false });
    rise($('.lg-hint', lmhero), { y: 14, delay: 2200, trigger: false });
    rise(navEl, { y: -14, delay: 0, trigger: false });
    words($('.lm-h', lm), { each: 55 });
    rise($('.lm-sub', lm), { y: 18, delay: 150 });
    rise($('.lm-tb', lm), { y: 36, delay: 120, dur: 1000 });
  }

  function layout() { fit(); layoutNav(); if (G.ctx) size(); }

  var lastY = 0, rafPending = false;
  function update() {
    sy = scrollY; vh = innerHeight;
    var docH = document.documentElement.scrollHeight;
    bar.style.transform = 'scaleX(' + clamp(sy / (docH - vh), 0, 1) + ')';
    var dy = sy - lastY; lastY = sy;
    nav.classList.toggle('stuck', sy > 24);
    if (menuOpen) { nav.classList.remove('hide'); if (Math.abs(sy - menuY) > 40 && window.__pfCloseMenu) window.__pfCloseMenu(); } else if (sy > 160 && dy > 4) nav.classList.add('hide'); else if (dy < -4 || sy <= 160) nav.classList.remove('hide');
    var covering = null;
    [['footer', sec.footer]].forEach(function (x) { var r = x[1].getBoundingClientRect(); if (r.top <= 40 && r.bottom > 40) covering = x[0]; });
    nav.classList.toggle('dark', !menuOpen && covering != null);
  }

  /* ================= boot ================= */
  buttons(); footerBleed(); footerRebuild(); soundToggle(); hoverFx(); megaMenu(); reveals(); listInit(); globeInit(); layout();
  addEventListener('scroll', function () { if (!rafPending) { rafPending = true; requestAnimationFrame(function () { rafPending = false; update(); }); } }, { passive: true });
  addEventListener('resize', function () { vh = innerHeight; setTimeout(function () { layout(); update(); }, 30); });
  setTimeout(function () { layout(); update(); }, 80); update();
})();
