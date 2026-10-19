// Auto-update: at :03 and :33 on the real clock, reload if the server has a newer build.
// Each build names its script with a content hash, so a different script src means a new
// deploy. If the server can't be reached, keep showing the current build.
(function () {
  'use strict';
  var CHECK_MINUTES = [3, 33];
  var lastKey = -1;

  function currentScript() {
    var s = document.querySelector('script[type="module"][src]');
    return s ? s.getAttribute('src') : null;
  }

  function check() {
    var mine = currentScript();
    if (!mine) return;
    fetch(location.pathname + '?update=' + Date.now(), { cache: 'no-store' })
      .then(function (r) { return r.ok ? r.text() : null; })
      .then(function (html) {
        // Only reload for a real dashboard page that names a different script.
        var m = html && html.match(/<script type="module"[^>]*\ssrc="([^"]+)"/);
        if (m && m[1] !== mine) location.reload();
      })
      .catch(function () {});
  }

  setInterval(function () {
    var d = new Date(), m = d.getMinutes(), key = d.getHours() * 60 + m;
    if (CHECK_MINUTES.indexOf(m) !== -1 && key !== lastKey) { lastKey = key; check(); }
  }, 20000);
})();
