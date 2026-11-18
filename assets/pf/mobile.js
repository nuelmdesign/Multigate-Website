/* Multigate: phone layout (under 768px). Builds the nav, hero, mission and footer for small screens.
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
      m.secs.map(function (s) { return '<div class="pm-sl">' + s.l + '</div>' + s.i.map(function (it) { return '<a class="pm-link" href="#"><b>' + it[0] + '</b><i>' + it[1] + '</i></a>'; }).join(''); }).join('') + '</div></div></div></div>';
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
  $$('.pm-link', sheet).forEach(function (a) { a.addEventListener('click', function (e) { e.preventDefault(); setSheet(false); }); });
  nav.querySelector('.pm-bookbtn').addEventListener('click', book);
  sheet.querySelector('.pm-bookbtn2').addEventListener('click', function () { setSheet(false); book(); });
  var lastY = 0;
  addEventListener('scroll', function () {
    var y = scrollY, d = y - lastY; lastY = y;
    if (sheet.classList.contains('open')) return;
    if (y > 120 && d > 6) nav.classList.add('hide'); else if (d < -6 || y <= 120) nav.classList.remove('hide');
  }, { passive: true });

  /* ---------- hero + mission ---------- */
  var arrow = '<span class="pm-dot"></span>';
  var top = el('div', 'pm');
  top.innerHTML =
    '<section id="pm-hero"><img class="pm-hg" src="' + GLOBE + '" alt=""><div class="pm-hfade"></div>' +
    '<div class="pm-ht"><h1>One interface for treasury. One network for trade.</h1><p>Multigate offers a unified platform to manage cash across banks, facilitate payments, transfer funds between African currencies, and pay suppliers early.</p><button class="pm-pill" type="button">Book a Treasury Review' + arrow + '</button></div>' +
    '<img class="pm-curve" src="' + CURVE + '" alt=""></section>' +
    '<section id="pm-mission"><div class="pm-eyebrow pm-rv"><i></i>Our mission</div><h2 class="pm-rv" style="--d:80ms">We connect African businesses and financial institutions on one network, helping businesses manage cash, move money and finance their trade.</h2><button class="pm-pill pm-rv" style="--d:160ms" type="button">Learn More' + arrow + '</button><canvas width="390" height="250"></canvas></section>';
  var hdr = document.getElementById('header'); hdr.parentNode.insertBefore(top, hdr);
  top.querySelector('#pm-hero .pm-pill').addEventListener('click', book);
  top.querySelector('#pm-mission .pm-pill').addEventListener('click', function () {
    var t = document.getElementById('content'); if (t) scrollTo({ top: t.getBoundingClientRect().top + scrollY + 60, behavior: 'smooth' });
  });

  /* ---------- the Mission globe: a light 2D dotted globe that turns slowly, drawn only while on screen ---------- */
  (function () {
    var L = window.MG_LAND, cv = top.querySelector('#pm-mission canvas'); if (!L || !cv) return;
    var ctx = cv.getContext('2d'), D = Math.PI / 180, bin = atob(L.d), bytes = new Uint8Array(bin.length);
    for (var i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    var N = 26000, GA = Math.PI * (3 - Math.sqrt(5)), land = [], sea = [];
    for (var q = 0; q < N; q++) {
      var lat = Math.asin(1 - 2 * (q + .5) / N), lon = ((q * GA) % (2 * Math.PI)) - Math.PI;
      var r = Math.round((L.lat0 - lat / D) / L.step), c = Math.round((lon / D - L.lon0) / L.step);
      if (r < 0 || r >= L.h || c < 0 || c >= L.w) continue;
      var k = r * L.w + c, v = (bytes[k >> 2] >> ((k & 3) * 2)) & 3, p = [lon, Math.sin(lat), Math.cos(lat)];
      (v ? land : sea).push(p);
    }
    var vis = false, t0 = performance.now(), W = 0, H = 0, px = 1;
    new IntersectionObserver(function (es) { vis = es[0].isIntersecting; }, { threshold: 0 }).observe(cv);
    function size() { px = Math.min(devicePixelRatio || 1, 2); W = cv.clientWidth; H = cv.clientHeight; cv.width = Math.round(W * px); cv.height = Math.round(H * px); }
    size(); addEventListener('resize', size);
    function draw(now) {
      requestAnimationFrame(draw); if (!vis || document.hidden) return;
      var t = (now - t0) / 1000, l0 = (14 + (reduce ? 0 : t * 3.2)) * D, a0 = -.9 * 1, ca = Math.cos(a0 * D * 0 + -.016), sa = Math.sin(-.016);
      var R = W * 1.08, cx = W / 2, cy = H - 128 + R;
      ctx.setTransform(px, 0, 0, px, 0, 0); ctx.clearRect(0, 0, W, H);
      function pass(arr, col, base, gain) {
        ctx.fillStyle = col;
        for (var i = 0; i < arr.length; i++) {
          var o = arr[i], dl = o[0] - l0, cl = o[2], sl = o[1], cd = Math.cos(dl);
          var z = sa * sl + ca * cl * cd; if (z < .04) continue;
          var x = cl * Math.sin(dl), y = ca * sl - sa * cl * cd, s = base + gain * z;
          ctx.fillRect(cx + x * R - s / 2, cy - y * R - s / 2, s, s);
        }
      }
      pass(sea, 'rgba(32,62,160,.55)', .8, 1.1);
      pass(land, 'rgba(70,214,255,.95)', 1.2, 2.2);
    }
    requestAnimationFrame(draw);
  })();

  /* ---------- footer: closing call to action, collapsible link groups, socials, legal ---------- */
  var GROUPS = [['Platform', ['Multigate system', 'Payables Financing', 'For banks']], ['Network', ['Coverage', 'Financiers', 'For payment companies and platforms', 'Developers']], ['Trust', ['Licences', 'Certifications', 'Swift']], ['Company', ['About', 'Leadership', 'Insights', 'Careers']]];
  var li = '<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M20.45 20.45h-3.56v-5.57c0-1.33-.03-3.04-1.85-3.04-1.86 0-2.14 1.45-2.14 2.94v5.67H9.35V9h3.41v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28zM5.34 7.43a2.06 2.06 0 1 1 0-4.13 2.06 2.06 0 0 1 0 4.13zM7.12 20.45H3.56V9h3.56v11.45zM22.22 0H1.77C.79 0 0 .77 0 1.73v20.54C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.73V1.73C24 .77 23.2 0 22.22 0z"/></svg>';
  var xi = '<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M18.9 1.15h3.68l-8.04 9.19L24 22.85h-7.4l-5.8-7.58-6.63 7.58H.49l8.6-9.83L0 1.15h7.59l5.24 6.93 6.07-6.93zm-1.29 19.5h2.04L6.48 3.24H4.3l13.31 17.41z"/></svg>';
  var foot = el('footer', 'pm'); foot.id = 'pm-footer';
  foot.innerHTML =
    '<div class="pm-fcta"><h2 class="pm-rv">Start by seeing your money.</h2><p class="pm-rv" style="--d:80ms">Learn how Multigate can help your company see its cash clearly and get suppliers paid early.</p><button class="pm-pill pm-rv" style="--d:160ms" type="button">Book a Review' + arrow + '</button></div>' +
    '<div class="pm-flogo"><img src="' + LOGO + '" alt=""><span>Multigate</span></div><p class="pm-ftag">The trusted network powering African treasury and trade.</p>' +
    GROUPS.map(function (g) { return '<div class="pm-fa"><button type="button" aria-expanded="false"><span>' + g[0] + '</span>' + PLUS + '</button><div class="pm-pan"><div><div class="pm-pan-in">' + g[1].map(function (l) { return '<a href="#">' + l + '</a>'; }).join('') + '</div></div></div></div>'; }).join('') +
    '<div class="pm-fbot"><span>© 2026 Multigate Holdings Ltd</span><div class="pm-fsoc"><a href="#" aria-label="LinkedIn">' + li + '</a><a href="#" aria-label="X">' + xi + '</a></div></div>' +
    '<p class="pm-flegal">Multigate is the trading name of the group headed by Multigate Holdings Ltd (Abu Dhabi Global Market). Regulated group companies: Multigate Network Pay Inc — licensed by the Central Bank of Nigeria as an International Money Transfer Operator, and registered with FINTRAC as a Money Services Business and with the Bank of Canada as a payment service provider; Multigate Network (MU) Ltd — licensed by the Financial Services Commission, Mauritius, for payment intermediary services. Financing is provided by participating Financiers; Multigate does not lend.</p>';
  var ftr = document.getElementById('footer'); ftr.parentNode.insertBefore(foot, ftr.nextSibling);
  foot.querySelector('.pm-fcta .pm-pill').addEventListener('click', book);
  $$('.pm-fa > button', foot).forEach(function (b) { b.addEventListener('click', function () { var o = b.parentNode.classList.toggle('open'); b.setAttribute('aria-expanded', String(o)); }); });
  $$('a', foot).forEach(function (a) { a.addEventListener('click', function (e) { e.preventDefault(); }); });

  /* ---------- middle sections: licence strip, problem cards, solutions, one network ---------- */
  (function () {
    var content = document.getElementById('content'); if (!content) return;
    var W = Math.min(innerWidth, 767), sq = '<i></i>';
    var strip = ['Licensed in Nigeria, Canada, Mauritius and Uganda', 'Swift BUSINESS CONNECT PROVIDER', 'ISO/IEC 27001 · ISO 22301 · ISO/IEC 20000 · PCI DSS'];
    var stripHtml = ''; for (var r = 0; r < 3; r++) strip.forEach(function (t, k) { stripHtml += '<span' + (k === 2 ? ' class="m"' : '') + '>' + t + '</span>' + sq; });
    var mid = el('div', 'pm'); mid.id = 'pm-mid';
    mid.innerHTML =
      '<div class="pm-strip"><div class="pm-strip-v"><div class="pm-strip-t">' + stripHtml + '</div></div></div>' +
      '<section id="pm-prob"><div class="pm-eyebrow pm-rv"><i></i>The problem we solve</div><h2 class="pm-h pm-rv" style="--d:80ms">Running finance across Africa shouldn\'t take ten bank portals and a spreadsheet.</h2><p class="pm-sub pm-rv" style="--d:140ms">Here are four challenges businesses face every day.</p><div class="pm-car" id="pm-pcar"></div><div class="pm-dots" id="pm-pdots"></div></section>' +
      '<div id="pm-sn"><section id="pm-sol"><div class="pm-eyebrow pm-rv"><i></i>Our solutions</div><h2 class="pm-h pm-rv" style="--d:80ms">Treasury, payments and financing. One platform, whichever banks you use.</h2><p class="pm-sub pm-rv" style="--d:140ms">See your cash, move money across African markets and get your suppliers paid early, all from one place.</p><div id="pm-scards"></div></section>' +
      '<section id="pm-net"><h2 class="pm-h left pm-rv">One network connecting businesses to the financial institutions that power them.</h2><p class="pm-sub left pm-rv" style="--d:80ms">We give businesses one place to manage banking, payments and financing, and lets banks, payment providers and financiers serve them.</p><div class="pm-car" id="pm-ncar"></div><div class="pm-arrows"><button type="button" aria-label="Previous">' + '<svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 4l-6 6 6 6"/></svg></button><button type="button" aria-label="Next"><svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M8 4l6 6-6 6"/></svg></button></div></section></div>';
    content.parentNode.insertBefore(mid, content);

    /* problem cards: the real cards (with their motion) move into a swipe carousel */
    var pcar = mid.querySelector('#pm-pcar'), pcards = $$('#content .pf-pc'), pz = Math.min(1, (W - 40) / 389);
    pcards.forEach(function (c) { c.style.opacity = ''; c.style.zoom = pz; var w = el('div', 'pm-item'); w.appendChild(c); pcar.appendChild(w); });
    function dots(car, host, n) {
      host.innerHTML = new Array(n + 1).join('<i></i>'); var d = $$('i', host);
      function upd() { var it = car.firstElementChild; if (!it) return; var st = it.offsetWidth + 12, k = Math.round(car.scrollLeft / st); d.forEach(function (x, i) { x.classList.toggle('on', i === Math.min(n - 1, k)); }); }
      car.addEventListener('scroll', upd, { passive: true }); upd();
      d.forEach(function (x, i) { x.addEventListener('click', function () { var it = car.firstElementChild; car.scrollTo({ left: i * (it.offsetWidth + 12), behavior: 'smooth' }); }); });
    }
    dots(pcar, mid.querySelector('#pm-pdots'), pcards.length);

    /* solutions: three stacked cards, text first, then the real illustration scaled to fit */
    var host = mid.querySelector('#pm-scards'), avail = W - 80;
    function fit(panel, w, h) {
      var st = panel.style; st.position = 'relative'; st.left = '0'; st.top = '0'; st.right = 'auto'; st.bottom = 'auto'; st.transform = 'none'; st.margin = '0'; st.width = w + 'px'; st.height = h + 'px'; st.zoom = Math.min(1, avail / w);
    }
    function scard(label, title, body, panel, w, h, delay) {
      var c = el('article', 'pm-sc pm-rv', '<div class="pm-sl2">' + label + '</div><h3>' + title + '</h3><p>' + body + '</p><button class="pm-pill sm" type="button">Learn More' + arrow + '</button><div class="pm-vis"></div>');
      c.style.setProperty('--d', delay + 'ms');
      if (panel) { fit(panel, w, h); c.querySelector('.pm-vis').appendChild(panel); }
      host.appendChild(c); return c;
    }
    var p1 = document.querySelector('#content [class*="bg-[#f7f7f7]"]'), p2 = document.querySelector('#content [class*="h-[484.202px]"]'), p3 = document.querySelector('#content [class*="h-[557.059px]"]');
    scard('Payables Financing', 'Get your suppliers paid early. Keep your terms.', 'Give eligible suppliers early payment from participating banks and lenders on invoices you’ve already approved, so their businesses keep moving while your payment terms stay unchanged.', p1, 464, 447, 0);
    scard('Payments & FX', 'Move and settle money across markets.', 'Collect locally, convert currencies and pay beneficiaries across African markets through one connection, with visibility and control for corporates and payment platforms.', p2, 502.168, 484.202, 0);
    scard('Treasury Management System', 'See and control your money across your banks', 'Connect your banks, entities and currencies into one live cash position. Then run treasury from the same screen: approve and send payments, manage liquidity and govern bank relationships whichever banks you use.', p3, 577.729, 557.059, 0);
    $$('.pm-sc .pm-pill', host).forEach(function (b) { b.addEventListener('click', function () { }); });
    // treasury dashboard: draw the chart and count the balances up when it scrolls into view
    if (p3) (function () {
      var chart = p3.querySelector('[class*="h-[164.857px]"]'), vals = $$('p', p3).filter(function (q) { return /^\$0\.00$/.test(q.textContent.trim()); }), fin = [1245600, 845200], done = false;
      if (!vals.length || reduce) { if (chart) chart.style.clipPath = 'none'; return; }
      if (chart) chart.style.clipPath = 'inset(0 100% 0 0)';
      new IntersectionObserver(function (es) {
        if (done || !es[0].isIntersecting) return; done = true;
        if (chart) chart.animate([{ clipPath: 'inset(0 100% 0 0)' }, { clipPath: 'inset(0 0% 0 0)' }], { duration: 2200, delay: 250, easing: 'cubic-bezier(.65,0,.35,1)', fill: 'forwards' });
        var t0 = performance.now() + 250;
        (function step(now) { var k = Math.min(1, Math.max(0, (now - t0) / 1800)), e = 1 - Math.pow(1 - k, 4); vals.forEach(function (q, i) { q.textContent = '$' + (fin[i] * e).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }); if (k < 1) requestAnimationFrame(step); })(performance.now());
      }, { threshold: .35 }).observe(p3);
    })();

    /* one network: the five cards in a swipe carousel with arrows */
    var ncar = mid.querySelector('#pm-ncar'), ncards = $$('#pf-track > *'), nz = Math.min(.8, (W - 40) / 389 * .9);
    ncards.forEach(function (c) { c.style.opacity = ''; c.style.zoom = nz; var w = el('div', 'pm-item'); w.appendChild(c); ncar.appendChild(w); });
    var ab = $$('.pm-arrows button', mid);
    ab[0].addEventListener('click', function () { ncar.scrollBy({ left: -(389 * nz + 12), behavior: 'smooth' }); });
    ab[1].addEventListener('click', function () { ncar.scrollBy({ left: 389 * nz + 12, behavior: 'smooth' }); });
  })();

  /* ---------- reveal on scroll ---------- */
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }); }, { rootMargin: '0px 0px -8% 0px' });
    $$('.pm-rv').forEach(function (n) { io.observe(n); });
  } else $$('.pm-rv').forEach(function (n) { n.classList.add('in'); });
})();
