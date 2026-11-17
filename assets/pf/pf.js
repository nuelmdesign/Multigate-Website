/* Fit the 1440px design to the viewport (scale down below 1440, centre above) and wire the two carousels. */
(function () {
  var W = 1440;
  function fit() {
    var s = Math.min(1, document.documentElement.clientWidth / W);
    document.querySelectorAll('.pf-sec').forEach(function (sec) {
      var h = parseFloat(sec.style.getPropertyValue('--h'));
      var inner = sec.firstElementChild;
      inner.style.zoom = s < 1 ? s : '';
      sec.style.height = h * s + 'px';
      inner.style.marginLeft = s < 1 ? '0' : '';
    });
  }
  fit();
  window.addEventListener('resize', fit);

  function carousel(track, step, max, prev, next) {
    if (!track) return;
    var i = 0, n = Math.ceil(max / step);
    function go(k) {
      i = Math.max(0, Math.min(n, k));
      track.style.transition = 'transform .5s cubic-bezier(.2,.7,.2,1)';
      track.style.transform = 'translateX(' + (-Math.min(i * step, max)) + 'px)';
      if (prev) prev.style.opacity = i === 0 ? '.45' : '1';
      if (next) next.style.opacity = i === n ? '.45' : '1';
    }
    if (prev) prev.addEventListener('click', function () { go(i - 1); });
    if (next) next.addEventListener('click', function () { go(i + 1); });
    go(0);
    return go;
  }
  // "One network" cards: five 389px cards, 16px gap, visible width = 1440 - 570
  var t = document.getElementById('pf-track');
  if (t) carousel(t, 405, 5 * 389 + 4 * 16 - 772, document.getElementById('pf-prev'), document.getElementById('pf-next'));
})();
