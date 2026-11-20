/* Multigate About page: motion layer.
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
  var ids = ['header', 'story', 'values', 'crew', 'footer'];
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
    var grp = function (h, links) { return '<div class="pf2-g"><h5>' + h + '</h5>' + links.map(function (l) { return '<a href="' + (l === 'About' ? 'about.html' : '#') + '">' + l + '</a>'; }).join('') + '</div>'; };
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
      { l: 'Resources', i: [['Insights', 'News, analysis and expert views', 'doc'], ['Trust Centre', 'Licences, certifications and security', 'shield']] }] }
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
  /* ================= About page ================= */
  /* core values: the section pins and the cards travel sideways as the page scrolls */
  var vIn = inn('values');
  var vpin = document.createElement('div'); vpin.className = 'pf-pin'; vpin.style.cssText = 'position:relative;z-index:4;background:#041431';
  sec.values.parentNode.insertBefore(vpin, sec.values); vpin.appendChild(sec.values);
  sec.values.style.position = 'sticky';
  var vt = $('.pf-vt', sec.values), vcards = $$('.pf-vc', sec.values), vdots = $$('.pf-vd > div', sec.values);
  var VKEYS = ['customer-obsession', 'excellence', 'agility-innovation', 'trust-accountability', 'empowerment-ownership'];
  vcards.forEach(function (c, i) {
    var old = c.children[1]; c._art = old;
    if (!window.PF_V3D) return;
    var w = document.createElement('div'); w.style.cssText = 'position:absolute;left:88px;top:76px;width:340px;height:340px';
    if (window.PF_V3D.mount(w, VKEYS[i], 340)) { old.style.display = 'none'; c.appendChild(w); c._art = w; }
  });
  var travel = 1899, vCur = 0, vTar = 0, vBusy = false, vActive = -1;
  function paintDots(a) {
    if (a === vActive) return; vActive = a;
    vdots.forEach(function (d, i) {
      d.style.transition = 'width .45s ' + EASE + ', background-color .35s';
      d.style.width = i === a ? '48px' : '10px';
      d.style.backgroundColor = i === a ? '#1362f5' : '#d0e0fd';
    });
  }
  vdots.forEach(function (d, i) {
    d.style.cursor = 'pointer'; d.setAttribute('role', 'button'); d.setAttribute('aria-label', 'Value ' + (i + 1));
    d.addEventListener('click', function () {
      var top = vpin.getBoundingClientRect().top + scrollY - Math.max(0, (vh - H('values') * S) / 2) * 0;
      var to = top + (i / 4) * travel * S;
      scrollTo({ top: to, behavior: reduce ? 'auto' : 'smooth' });
    });
  });
  paintDots(0);
  function vRender() {
    vCur += (vTar - vCur) * .14;
    if (Math.abs(vTar - vCur) < .0004) vCur = vTar;
    vt.style.transform = 'translate3d(' + (-vCur * travel) + 'px,0,0)';
    var a = clamp(Math.round(vCur * 4), 0, 4); paintDots(a);
    /* each illustration drifts a little against its card for depth */
    var cw = document.documentElement.clientWidth;
    vcards.forEach(function (c) {
      var r = c.getBoundingClientRect(), mid = (r.left + r.width / 2) / cw - .5;
      var art = c._art; if (art) art.style.transform = 'translate3d(' + (mid * -34) + 'px,0,0)';
    });
    vBusy = vCur !== vTar; if (vBusy) requestAnimationFrame(vRender);
  }

  /* team: segmented control swaps Executive Committee / Board; the section height follows the active group */
  var seg = $('.pf-seg', sec.crew), segTabs = $$('button', seg), panels = $$('.pf-panel', sec.crew), pw = $('.pf-panels', sec.crew), flow = $('.pf-crewflow', sec.crew), curTab = 0;
  function crewFit() {
    var tot = 150 + flow.getBoundingClientRect().height / S + 157;
    sec.crew.style.setProperty('--h', tot + 'px'); sec.crew.style.height = tot * S + 'px'; inn('crew').style.height = tot + 'px';
  }
  function crewSettle() { var t0 = performance.now(); (function f() { crewFit(); if (performance.now() - t0 < 900) requestAnimationFrame(f); })(); }
  function pick(i, focus) {
    if (i === curTab) return; curTab = i; seg.setAttribute('data-on', String(i));
    segTabs.forEach(function (b, k) { b.setAttribute('aria-selected', String(k === i)); b.tabIndex = k === i ? 0 : -1; });
    panels.forEach(function (p, k) { p.classList.toggle('on', k === i); });
    pw.style.height = panels[i].getBoundingClientRect().height / S + 'px';
    if (!reduce) $$('.pf-leads > div, .pf-board > div', panels[i]).forEach(function (d, k) {
      d.animate([{ opacity: 0, translate: '0 26px' }, { opacity: 1, translate: '0 0' }], { duration: 800, delay: 120 + k * 70, easing: EASE, fill: 'backwards' });
    });
    crewSettle(); if (focus) segTabs[i].focus();
  }
  segTabs.forEach(function (b, i) {
    b.tabIndex = i === 0 ? 0 : -1;
    b.addEventListener('click', function () { pick(i); });
    b.addEventListener('keydown', function (e) { if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') { e.preventDefault(); pick(e.key === 'ArrowRight' ? 1 : 0, true); } });
    b.addEventListener('pointerenter', tick);
  });

  function layout() {
    fit(); layoutNav();
    var cw = document.documentElement.clientWidth;
    var right = S < 1 ? 1440 : (cw + 1440) / 2;                     // right edge of the viewport, in design pixels
    travel = Math.max(0, 2700 - (right - 639) + 80);
    var hs = H('values') * S;
    sec.values.style.top = Math.max(0, (vh - hs) / 2) + 'px';
    vpin.style.height = (hs + travel * S) + 'px';
    pw.style.height = panels[curTab].getBoundingClientRect().height / S + 'px'; crewFit();
  }

  /* reveals */
  function reveals() {
    if (reduce) return;
    var hero = inn('header'), story = inn('story'), crew = inn('crew');
    var eb = function (el) { return el && el.parentNode; };
    rise(eb(P('Company', sec.header.querySelector('[class*="px-[10px]"]') ? sec.header.querySelector('[class*="px-[10px]"]') : sec.header)), { y: 16, delay: 100, trigger: false });
    words(P('Building Trust', hero), { each: 70, delay: 220, now: false, trigger: false });
    rise(P('Since 2017', hero), { y: 20, delay: 800, trigger: false });
    var cta = $$('a', hero).filter(function (a) { return /open roles/.test(a.textContent); })[0]; rise(cta, { y: 20, delay: 980, trigger: false });
    rise(navEl, { y: -14, delay: 0, trigger: false });

    rise(eb(P('Our Story', story)), { y: 16 });
    words(P('A Note from', story), { each: 70 });
    $$('p', story).filter(function (p) { return /leading-\[30px\]/.test(p.className) && p.textContent.replace(/​/g, '').trim(); }).forEach(function (p, i) { rise(p, { y: 26, delay: 120 + i * 110 }); });
    var sig = P('Eghosa', story);
    if (sig) { sig.style.clipPath = 'inset(0 100% 0 0)'; var sg = function () { sig.animate([{ clipPath: 'inset(0 100% 0 0)' }, { clipPath: 'inset(0 0% 0 0)' }], { duration: 1500, delay: 300, easing: EASE_IO, fill: 'both' }).onfinish = function () { sig.style.clipPath = 'none'; }; }; onView(sig, sg); }
    rise(sig && sig.nextElementSibling, { y: 14, delay: 700, trigger: sig });
    words(P('“Every network', story), { each: 55, dur: 1100 });
    ['OUR MISSION', 'OUR VISION'].forEach(function (t) { rise(eb(P(t, story)), { y: 14 }); });
    words(P('We connect', story), { each: 40 });
    words(P('To be the', story), { each: 55 });

    var vl = $('.pf-vl', sec.values);
    if (vl) { rise(eb(P('Our core values', vl)), { y: 16, trigger: vl }); words(P('Five values', vl), { each: 60, trigger: vl }); rise(P('Treasury and trade', vl), { y: 20, delay: 300, trigger: vl }); }

    rise(eb(P('The team', crew)), { y: 16 });
    words(P('Our Team.', crew), { each: 60 });
    $$('.pf-leads > div', crew).forEach(function (d, i) { rise(d, { y: 46, delay: i * 120, trigger: $('.pf-leads', crew), dur: 1100 }); });
    rise(seg, { y: 18, delay: 100 });
    var ppl = $$('.pf-people > div', crew);
    ppl.forEach(function (d, i) { var row = Math.floor(i / 4), col = i % 4; rise(d, { y: 22, delay: row * 90 + col * 70, trigger: $('.pf-people', crew) }); });
    words(P('A few reasons', crew), { each: 55 });
    var viewAll = $$('a', crew).filter(function (a) { return /View All/.test(a.textContent); })[0]; rise(viewAll, { y: 18, delay: 200 });
    $$('.pf-perk', crew).forEach(function (d, i) { rise(d, { y: 44, delay: (i % 3) * 110, trigger: d, dur: 1000 }); });
  }

  /* ---------- scroll-linked ---------- */
  var lastY = 0, rafPending = false;
  function update() {
    sy = scrollY; vh = innerHeight;
    var docH = document.documentElement.scrollHeight;
    bar.style.transform = 'scaleX(' + clamp(sy / (docH - vh), 0, 1) + ')';
    var dy = sy - lastY; lastY = sy;
    nav.classList.toggle('stuck', sy > 24);
    if (menuOpen) { nav.classList.remove('hide'); if (Math.abs(sy - menuY) > 40 && window.__pfCloseMenu) window.__pfCloseMenu(); } else if (sy > 160 && dy > 4) nav.classList.add('hide'); else if (dy < -4 || sy <= 160) nav.classList.remove('hide');
    var covering = null;
    [['header', sec.header], ['values', vpin], ['footer', sec.footer]].forEach(function (x) { var r = x[1].getBoundingClientRect(); if (r.top <= 40 && r.bottom > 40) covering = x[0]; });
    nav.classList.toggle('dark', !menuOpen && covering != null);
    var r = vpin.getBoundingClientRect();
    vTar = clamp(-r.top / Math.max(1, travel * S), 0, 1);
    if (!vBusy) { vBusy = true; requestAnimationFrame(vRender); }
    var hh = $('[class*="left-[380px]"]', inn('header')); if (hh) hh.style.translate = '0 ' + clamp(sy * .12, 0, 120) + 'px';
  }

  /* ================= boot ================= */
  buttons(); footerBleed(); footerRebuild(); soundToggle(); hoverFx(); megaMenu(); reveals(); layout();
  /* mark the current page in the menu */
  var cur = null;
  addEventListener('scroll', function () { if (!rafPending) { rafPending = true; requestAnimationFrame(function () { rafPending = false; update(); }); } }, { passive: true });
  addEventListener('resize', function () { vh = innerHeight; setTimeout(function () { layout(); update(); }, 30); });
  setTimeout(function () { layout(); update(); }, 80); update();
})();
