/* FKBC "Red & Black Bushido" theme — opt-in preview.
 * The classic look stays the default. Turn the preview on with  ?theme=bushido  (remembered on this device)
 * or Settings → Appearance; back to classic with  ?theme=classic  or the same switch. */
(function () {
  'use strict';
  var K = 'fkbc_theme', R = document.documentElement;
  var q = (location.search.match(/[?&]theme=([a-z]+)/) || [])[1];
  try { if (q) localStorage.setItem(K, q === 'bushido' ? 'bushido' : 'classic'); } catch (e) {}
  var on = false; try { on = localStorage.getItem(K) === 'bushido'; } catch (e) {}
  if (on) {
    R.classList.add('bushido');
    document.write('<link rel="stylesheet" id="bushidoCss" href="assets/bushido.css">');
    var tc = document.querySelector('meta[name="theme-color"]'); if (tc) tc.setAttribute('content', '#0b0807');
    var ic = document.querySelector('link[rel="icon"]'); if (ic) ic.setAttribute('href', 'assets/bushido/icon-192.png');
  }
  window.addEventListener('DOMContentLoaded', function () {
    if (on) document.body.classList.remove('light');
    var grid = document.querySelector('#settingsView .settingsGrid'); if (!grid) return;
    grid.insertAdjacentHTML('beforeend', '<div class="settingGroup" style="grid-column:1/-1"><h3>Appearance</h3><p style="color:var(--muted);margin-top:0">Red &amp; Black Bushido — charcoal canvas, crimson brush work and bronze framing. This is a preview; your lessons and data are untouched.</p><button class="btn" id="bushidoToggle" type="button">' + (on ? 'Switch back to the classic look' : 'Try the Bushido look') + '</button></div>');
    document.getElementById('bushidoToggle').onclick = function () { try { localStorage.setItem(K, on ? 'classic' : 'bushido'); } catch (e) {} location.href = location.pathname + (on ? '?theme=classic' : '?theme=bushido'); };
  });
})();
