/* Multigate About page: phone layout (under 768px). Nav sheet and footer are shared with the landing page.
   On wider screens this script does nothing. Crossing the breakpoint reloads the page. */
(function () {
  'use strict';
  var mq = matchMedia('(max-width: 767px)'), was = mq.matches;
  if (mq.addEventListener) mq.addEventListener('change', function () { if (mq.matches !== was) location.reload(); });
  if (!was) return;
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var LOGO = 'assets/pf/header-77157.svg', GLOBE = 'assets/pf/header-ac54a.svg', CURVE = 'assets/pf/header-5d2ec.svg';
  var CHEV = '<svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M5 8l5 5 5-5"/></svg>';
  var PLUS = '<svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"><path d="M10 4v12M4 10h12"/></svg>';
  var $$ = function (s, r) { return [].slice.call((r || document).querySelectorAll(s)); };
  var book = function () { if (window.__pfBook) window.__pfBook(); };
  var el = function (tag, cls, html) { var e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; };

  /* ---------- nav + menu sheet ---------- */
  var nav = el('header', 'pm', '<a class="pm-logo" href="#"><img src="' + LOGO + '" alt=""><span>Multigate</span></a><div class="pm-right"><button class="pm-bookbtn" type="button">Book a Review</button><button class="pm-burger" type="button" aria-label="Menu" aria-expanded="false" aria-controls="pm-sheet"><i></i><i></i></button></div>');
  nav.id = 'pm-nav';
  var sheet = el('div', 'pm'); sheet.id = 'pm-sheet';
  var menus = window.PF_MENUS || [];
  sheet.innerHTML = menus.map(function (m) {
    return '<div class="pm-acc"><button type="button" aria-expanded="false"><span>' + m.name + '</span>' + CHEV + '</button><div class="pm-pan"><div><div class="pm-pan-in">' +
      m.secs.map(function (s) { return '<div class="pm-sl">' + s.l + '</div>' + s.i.map(function (it) { return '<a class="pm-link" href="' + (it[3] || '#') + '"><b>' + it[0] + '</b><i>' + it[1] + '</i></a>'; }).join(''); }).join('') + '</div></div></div></div>';
  }).join('') + '<div class="pm-cta"><button class="a" type="button">Sign In</button><button class="b pm-bookbtn2" type="button">Book a Review</button></div>';
  document.body.appendChild(nav); document.body.appendChild(sheet);
  var burger = nav.querySelector('.pm-burger');
  function setSheet(open) {
    burger.setAttribute('aria-expanded', String(open)); sheet.classList.toggle('open', open);
    document.documentElement.style.overflow = open ? 'hidden' : '';
    if (open) nav.classList.remove('hide');
  }
  burger.addEventListener('click', function () { setSheet(!sheet.classList.contains('open')); });
  $$('.pm-acc > button', sheet).forEach(function (b) {
    b.addEventListener('click', function () {
      var acc = b.parentNode, willOpen = !acc.classList.contains('open');
      $$('.pm-acc', sheet).forEach(function (a) { a.classList.remove('open'); a.firstChild.setAttribute('aria-expanded', 'false'); });
      if (willOpen) { acc.classList.add('open'); b.setAttribute('aria-expanded', 'true'); }
    });
  });
  $$('.pm-link', sheet).forEach(function (a) { a.addEventListener('click', function (e) { if (a.getAttribute('href') === '#') e.preventDefault(); setSheet(false); }); });
  nav.querySelector('.pm-bookbtn').addEventListener('click', book);
  sheet.querySelector('.pm-bookbtn2').addEventListener('click', function () { setSheet(false); book(); });
  var lastY = 0;
  addEventListener('scroll', function () {
    var y = scrollY, d = y - lastY; lastY = y;
    if (sheet.classList.contains('open')) return;
    if (y > 120 && d > 6) nav.classList.add('hide'); else if (d < -6 || y <= 120) nav.classList.remove('hide');
  }, { passive: true });


  var arrow = '<span class="pm-dot"></span>';
  var txt = function (n) { return n ? n.textContent.replace(/\s+/g, ' ').trim() : ''; };
  var ps = function (root) { return $$('p', root).map(txt); };
  var IMG = { glow: 'assets/pf/about/glow-net.svg', curve: 'assets/pf/about/curve.svg' };

  /* ---------- content comes from the desktop markup so there is one source of copy ---------- */
  var vals = $$('.pf-vc').map(function (c) { var p = ps(c); return { t: p[0], d: p[1], img: c.querySelector('img').src }; });
  var leads = $$('.pf-leads > div').map(function (d) { var p = ps(d); return { n: p[0], r: p[1], box: d.firstElementChild }; });
  var board = $$('.pf-board > div').map(function (d) { var p = ps(d); return { n: p[0], r: p[1], box: d.firstElementChild }; });
  var perks = $$('.pf-perk').map(function (c) { var p = ps(c); return { t: p[0], d: p[1], img: c.querySelector('img').src }; });
  var story = $$('#story p').filter(function (p) { return /leading-\[30px\]/.test(p.className) && txt(p).replace(/​/g, ''); }).map(txt);
  var QUOTE = txt($$('#story p').filter(function (p) { return txt(p).indexOf('“Every') === 0; })[0]);
  var MISSION = txt($$('#story p').filter(function (p) { return txt(p).indexOf('We connect') === 0; })[0]);
  var VISION = txt($$('#story p').filter(function (p) { return txt(p).indexOf('To be the') === 0; })[0]);
  var HSUB = txt($$('#header p').filter(function (p) { return txt(p).indexOf('Since 2017') === 0; })[0]);
  var eb = function (t, cls) { return '<div class="ab-eb ' + (cls || '') + ' pm-rv"><i></i>' + t + '</div>'; };

  /* ---------- sections ---------- */
  var top = el('div', 'pm');
  top.innerHTML =
    '<section id="ab-hero"><img class="ab-glow" src="' + IMG.glow + '" alt=""><div class="ab-ht">' +
    '<div class="ab-eb lt"><i></i>Company</div><h1>Building Trust, Unlocking Potential &amp; Driving Prosperity</h1><p>' + HSUB + '</p>' +
    '<a class="pm-pill" href="#">See open roles' + arrow + '</a></div><img class="ab-curve" src="' + IMG.curve + '" alt=""></section>' +

    '<section id="ab-story">' + eb('Our story', 'dk') + '<h2 class="ab-h pm-rv" style="--d:70ms">A Note from Our Founder</h2>' +
    '<div class="ab-copy">' + story.map(function (t, i) { return '<p class="pm-rv" style="--d:' + (i * 60) + 'ms">' + t + '</p>'; }).join('') + '</div>' +
    '<div class="ab-sig pm-rv"><span>Eghosa</span><b>Eghosa Nehikhare</b></div>' +
    '<blockquote class="ab-q pm-rv">' + QUOTE + '</blockquote>' +
    '<div class="ab-mv">' + eb('Our vision', 'dk') + '<p class="ab-mvt pm-rv" style="--d:70ms">' + VISION + '</p></div>' +
    '<div class="ab-mv">' + eb('Our mission', 'dk') + '<p class="ab-mvt pm-rv" style="--d:70ms">' + MISSION + '</p></div></section>' +

    '<section id="ab-values">' + eb('Our core values', 'lt') + '<h2 class="ab-h lt pm-rv" style="--d:70ms">Five values that guide how we work and serve.</h2>' +
    '<p class="ab-vp pm-rv" style="--d:140ms">Treasury and trade run on trust. These five values guide how we build, how we make decisions and how we treat the businesses and institutions we work with.</p>' +
    '<div class="ab-vs" id="ab-vs">' + vals.map(function (v) { return '<div class="ab-vc"><div class="ab-vi"><img src="' + v.img + '" alt=""></div><h3>' + v.t + '</h3><p>' + v.d + '</p></div>'; }).join('') + '</div>' +
    '<div class="ab-dots" id="ab-dots">' + vals.map(function (v, i) { return '<button type="button" aria-label="Value ' + (i + 1) + '"></button>'; }).join('') + '</div>' +
    '<p class="ab-vn pm-rv">They apply to our whole team, from engineering to customer support.</p></section>' +

        '<section id="ab-team">' +
    '<h3 class="ab-gh pm-rv">Our Executive Team</h3><p class="ab-gp pm-rv">The people who lead Multigate day to day, across operations, risk, compliance and legal.</p>' + '<div class="ab-leads">' + leads.map(function (l, i) { return '<div class="ab-ld pm-rv" style="--d:' + ((i % 2) * 90) + 'ms"><div class="ab-ph"><div class="ab-phz"></div></div><h3>' + l.n + '</h3><p>' + l.r + '</p></div>'; }).join('') + '</div>' +
    '<div class="ab-hr"></div>' + '<h3 class="ab-gh ab-gh2 pm-rv">Our Board of Directors</h3><p class="ab-gp pm-rv">The directors who guide our strategy and hold the business to account.</p>' + '<div class="ab-leads">' + board.map(function (l, i) { return '<div class="ab-ld pm-rv" style="--d:' + ((i % 2) * 90) + 'ms"><div class="ab-ph"><div class="ab-phz"></div></div><h3>' + l.n + '</h3><p>' + l.r + '</p></div>'; }).join('') + '</div>' +
    '<div class="ab-hr ab-hr2"></div></section>' +

    '<section id="ab-perks"><h2 class="ab-h pm-rv">A few reasons you’ll enjoy working at Multigate.</h2>' +
    '<a class="pm-pill pm-rv" style="--d:80ms" href="#">View All Roles' + arrow + '</a>' +
    '<div class="ab-pk">' + perks.map(function (p, i) { return '<div class="ab-pc pm-rv" style="--d:' + ((i % 2) * 70) + 'ms"><div class="ab-pi"><img src="' + p.img + '" alt=""></div><div><h3>' + p.t + '</h3><p>' + p.d + '</p></div></div>'; }).join('') + '</div></section>';
  var hdr = document.getElementById('header'); hdr.parentNode.insertBefore(top, hdr);
  $$('.pm-pill', top).forEach(function (b) { b.addEventListener('click', function (e) { e.preventDefault(); }); });

  /* real photo boxes (cut-out portrait over its glow), scaled to the card width */
  var phz = $$('.ab-phz', top);
  leads.concat(board).forEach(function (l, i) { phz[i].appendChild(l.box.cloneNode(true)); });
  function fitPhotos() {
    $$('.ab-ph', top).forEach(function (ph) { var k = ph.clientWidth / 293.491; ph.firstElementChild.style.transform = 'scale(' + k + ')'; });
  }
  fitPhotos(); addEventListener('resize', fitPhotos); addEventListener('load', fitPhotos);

  /* nav: transparent over the navy hero, solid white elsewhere and while the menu sheet is open */
  var heroEl = document.getElementById('ab-hero');
  function navTone() { nav.classList.toggle('onhero', scrollY < heroEl.offsetHeight - 70 && !sheet.classList.contains('open')); }
  addEventListener('scroll', navTone, { passive: true }); addEventListener('resize', navTone);
  burger.addEventListener('click', function () { setTimeout(navTone, 0); });
  navTone();

  /* the five objects turn slowly, drawn live */
  var VKEYS = ['customer-obsession', 'excellence', 'agility-innovation', 'trust-accountability', 'empowerment-ownership'];
  $$('.ab-vi', top).forEach(function (box, i) {
    if (!window.PF_V3D) return;
    var im = box.firstElementChild, sz = Math.min(250, Math.round(Math.min(innerWidth * .8, 340) - 52));
    if (window.PF_V3D.mount(box, VKEYS[i], sz)) im.style.display = 'none';
  });

  /* core values: snap carousel with synced dots */
  var vs = document.getElementById('ab-vs'), dots = $$('#ab-dots button');
  function vIdx() { var c = vs.children[0]; return Math.max(0, Math.min(vals.length - 1, Math.round(vs.scrollLeft / (c.offsetWidth + 14)))); }
  function vPaint() { var a = vIdx(); dots.forEach(function (d, i) { d.classList.toggle('on', i === a); }); }
  vs.addEventListener('scroll', function () { requestAnimationFrame(vPaint); }, { passive: true });
  dots.forEach(function (d, i) { d.addEventListener('click', function () { vs.scrollTo({ left: i * (vs.children[0].offsetWidth + 14), behavior: reduce ? 'auto' : 'smooth' }); }); });
  vPaint();

  /* ---------- footer: closing call to action, collapsible link groups, socials, legal ---------- */
  var GROUPS = [['Platform', ['Multigate system', 'Payables Financing', 'For banks']], ['Network', ['Coverage', 'Financiers', 'For payment companies and platforms', 'Developers']], ['Trust', ['Licences', 'Certifications', 'Swift']], ['Company', ['About', 'Leadership', 'Insights', 'Careers']]];
  var li = '<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M20.45 20.45h-3.56v-5.57c0-1.33-.03-3.04-1.85-3.04-1.86 0-2.14 1.45-2.14 2.94v5.67H9.35V9h3.41v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28zM5.34 7.43a2.06 2.06 0 1 1 0-4.13 2.06 2.06 0 0 1 0 4.13zM7.12 20.45H3.56V9h3.56v11.45zM22.22 0H1.77C.79 0 0 .77 0 1.73v20.54C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.73V1.73C24 .77 23.2 0 22.22 0z"/></svg>';
  var xi = '<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M18.9 1.15h3.68l-8.04 9.19L24 22.85h-7.4l-5.8-7.58-6.63 7.58H.49l8.6-9.83L0 1.15h7.59l5.24 6.93 6.07-6.93zm-1.29 19.5h2.04L6.48 3.24H4.3l13.31 17.41z"/></svg>';
  var foot = el('footer', 'pm'); foot.id = 'pm-footer';
  foot.innerHTML =
    '<div class="pm-fcta"><h2 class="pm-rv">Start by seeing your money.</h2><p class="pm-rv" style="--d:80ms">Learn how Multigate can help your company see its cash clearly and get suppliers paid early.</p><button class="pm-pill pm-rv" style="--d:160ms" type="button">Book a Review' + arrow + '</button></div>' +
    '<div class="pm-flogo"><img src="' + LOGO + '" alt=""><span>Multigate</span></div><p class="pm-ftag">The trusted network powering African treasury and trade.</p>' +
    GROUPS.map(function (g) { return '<div class="pm-fa"><button type="button" aria-expanded="false"><span>' + g[0] + '</span>' + PLUS + '</button><div class="pm-pan"><div><div class="pm-pan-in">' + g[1].map(function (l) { return '<a href="' + (l === 'About' ? 'about.html' : l === 'Licences' ? 'licences.html' : '#') + '">' + l + '</a>'; }).join('') + '</div></div></div></div>'; }).join('') +
    '<div class="pm-fbot"><span>© 2026 Multigate Holdings Ltd</span><div class="pm-fsoc"><a href="#" aria-label="LinkedIn">' + li + '</a></div></div>' +
    '<p class="pm-flegal">Multigate is the trading name of the group headed by Multigate Holdings Ltd (Abu Dhabi Global Market). Regulated group companies: Multigate Network Pay Inc — licensed by the Central Bank of Nigeria as an International Money Transfer Operator, and registered with FINTRAC as a Money Services Business and with the Bank of Canada as a payment service provider; Multigate Network (MU) Ltd — licensed by the Financial Services Commission, Mauritius, for payment intermediary services. Financing is provided by participating Financiers; Multigate does not lend.</p>';
  var ftr = document.getElementById('footer'); ftr.parentNode.insertBefore(foot, ftr.nextSibling);
  foot.querySelector('.pm-fcta .pm-pill').addEventListener('click', book);
  $$('.pm-fa > button', foot).forEach(function (b) { b.addEventListener('click', function () { var o = b.parentNode.classList.toggle('open'); b.setAttribute('aria-expanded', String(o)); }); });
  $$('a', foot).forEach(function (a) { a.addEventListener('click', function (e) { if (a.getAttribute('href') === '#') e.preventDefault(); }); });

  /* ---------- reveal on scroll ---------- */
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }); }, { rootMargin: '0px 0px -8% 0px' });
    $$('.pm-rv').forEach(function (n) { io.observe(n); });
  } else $$('.pm-rv').forEach(function (n) { n.classList.add('in'); });
})();
