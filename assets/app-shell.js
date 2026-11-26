/* FKBC Coaches Console — app shell: no zoom, full-screen button (web browser only). */
(function () {
  'use strict';
  /* ---- no zoom: iOS Safari/WebView ignore user-scalable=no, so block pinch + double-tap zoom explicitly ---- */
  ['gesturestart', 'gesturechange', 'gestureend'].forEach(function (t) { document.addEventListener(t, function (e) { e.preventDefault(); }, { passive: false }); });
  document.addEventListener('touchmove', function (e) { if (e.touches && e.touches.length > 1 && e.cancelable) e.preventDefault(); }, { passive: false });
  var last = 0;
  document.addEventListener('touchend', function (e) { var n = Date.now(); if (n - last < 320 && e.cancelable && !(e.target.closest && e.target.closest('input,textarea,select,[contenteditable]'))) e.preventDefault(); last = n; }, { passive: false });
  document.addEventListener('wheel', function (e) { if (e.ctrlKey) e.preventDefault(); }, { passive: false });     // trackpad pinch / ctrl+scroll
  document.addEventListener('keydown', function (e) { if ((e.ctrlKey || e.metaKey) && ['+', '=', '-', '_', '0'].indexOf(e.key) > -1) e.preventDefault(); });

  /* ---- full screen (browser only: hidden in the installed app, the store apps, and where the browser can't do it) ---- */
  var root = document.documentElement;
  var canFS = !!(document.fullscreenEnabled || document.webkitFullscreenEnabled);
  var standalone = (window.matchMedia && matchMedia('(display-mode: standalone)').matches) || window.navigator.standalone === true || !!(window.Capacitor && Capacitor.isNativePlatform && Capacitor.isNativePlatform());
  var isFS = function () { return !!(document.fullscreenElement || document.webkitFullscreenElement); };
  function toggle() {
    try {
      if (isFS()) (document.exitFullscreen || document.webkitExitFullscreen).call(document);
      else (root.requestFullscreen || root.webkitRequestFullscreen).call(root);
    } catch (e) {}
  }
  function icon() { var b = document.getElementById('fsBtn'); if (!b) return; var on = isFS();
    b.innerHTML = '<svg class="ic" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + (on ? '<path d="M9 4v5H4M15 4v5h5M9 20v-5H4M15 20v-5h5"/>' : '<path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/>') + '</svg>';
    b.setAttribute('aria-label', on ? 'Exit full screen' : 'Full screen'); b.title = on ? 'Exit full screen' : 'Full screen'; }
  function mount() {
    if (!canFS || standalone) return true;
    var bar = document.getElementById('fkbcConsoleBar'); if (!bar) return false;
    if (!document.getElementById('fsBtn')) {
      var b = document.createElement('button'); b.id = 'fsBtn'; b.type = 'button'; b.className = 'btn small fsBtn'; b.onclick = toggle;
      var who = bar.querySelector('.consoleWho'); if (who) bar.insertBefore(b, who); else bar.appendChild(b); icon();
    }
    return true;
  }
  ['fullscreenchange', 'webkitfullscreenchange'].forEach(function (t) { document.addEventListener(t, icon); });
  var n = 0, iv = setInterval(function () { if (mount() || ++n > 40) clearInterval(iv); }, 150);
})();
