(function () {
  'use strict';
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  /* Reveal on scroll */
  var els = $$('.rv');
  if ('IntersectionObserver' in window && !reduce) {
    var io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }); }, { rootMargin: '0px 0px -8% 0px', threshold: 0.06 });
    els.forEach(function (e) { io.observe(e); });
  } else { els.forEach(function (e) { e.classList.add('in'); }); }

  /* Nav */
  var tog = $('#navToggle'), panel = $('#navPanel');
  tog.addEventListener('click', function () { var o = tog.getAttribute('aria-expanded') !== 'true'; tog.setAttribute('aria-expanded', o); panel.classList.toggle('open', o); });
  $$('a', panel).forEach(function (a) { a.addEventListener('click', function () { tog.setAttribute('aria-expanded', 'false'); panel.classList.remove('open'); }); });

  /* Move money track: dots follow the scroll position */
  var track = $('#track'), dots = $$('#dots i');
  if (track) {
    var upd = function () {
      var cards = $$('.mv', track), best = 0, bd = 1e9;
      cards.forEach(function (c, i) { var d = Math.abs(c.offsetLeft - track.scrollLeft - cards[0].offsetLeft); if (d < bd) { bd = d; best = i; } });
      dots.forEach(function (d, i) { d.classList.toggle('on', i === best); });
    };
    track.addEventListener('scroll', function () { window.requestAnimationFrame(upd); }, { passive: true });
  }

  /* Network today accordion */
  $$('#acc button').forEach(function (b) {
    b.addEventListener('click', function () { $$('#acc li').forEach(function (l) { l.classList.remove('open'); }); b.parentNode.classList.add('open'); });
  });

  /* Booking modal */
  var dlg = $('#book'), form = $('#bookForm');
  function openBook(e) { if (e) e.preventDefault(); dlg.classList.remove('is-done'); if (dlg.showModal) dlg.showModal(); else dlg.setAttribute('open', ''); }
  $$('.js-book').forEach(function (a) { a.addEventListener('click', openBook); });
  $$('[data-close]', dlg).forEach(function (b) { b.addEventListener('click', function () { dlg.close(); }); });
  dlg.addEventListener('click', function (e) { if (e.target === dlg) dlg.close(); });
  if (location.hash === '#book') setTimeout(openBook, 50);
  var REQ = 'Please fill this in so we can prepare for your review.', BAD = "That email doesn't look right. Check it and try again.";
  form.addEventListener('submit', function (e) {
    e.preventDefault(); var ok = true;
    $$('.field', form).forEach(function (f) {
      var inp = $('input[required], select[required]', f); if (!inp) return;
      var v = inp.value.trim(), msg = $('.msg', f), bad = !v; if (msg) msg.textContent = REQ;
      if (!bad && inp.type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) { bad = true; if (msg) msg.textContent = BAD; }
      f.classList.toggle('err', bad); if (bad) ok = false;
    });
    if (!ok) { var first = $('.field.err input, .field.err select', form); if (first) first.focus(); return; }
    $('#doneTitle').textContent = 'Thank you, ' + $('#f-name').value.trim().split(/\s+/)[0] + '.';
    dlg.classList.add('is-done');
  });
  $$('input, select', form).forEach(function (el) { el.addEventListener('input', function () { var f = el.closest('.field'); if (f) f.classList.remove('err'); }); });

  /* Cookie banner */
  var ck = $('#cookie'), seen = false;
  try { seen = localStorage.getItem('mg-cookie'); } catch (e) {}
  if (!seen) { ck.hidden = false; setTimeout(function () { ck.classList.add('show'); }, 1400); }
  $$('[data-cookie]', ck).forEach(function (b) {
    b.addEventListener('click', function () { try { if (b.dataset.cookie === 'all') localStorage.setItem('mg-cookie', 'all'); } catch (e) {} ck.classList.remove('show'); setTimeout(function () { ck.hidden = true; }, 300); });
  });

  /* Review mode */
  $$('[data-confirm]').forEach(function (el) { el.textContent = 'Confirm · ' + el.getAttribute('data-confirm'); });
  var rb = $('#rbtn');
  rb.addEventListener('click', function () { var on = rb.getAttribute('aria-pressed') !== 'true'; rb.setAttribute('aria-pressed', on); document.body.classList.toggle('review', on); });
  if (/[?&]review\b/.test(location.search)) rb.click();
})();
