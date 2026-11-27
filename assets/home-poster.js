/* FKBC Coaches Console — poster home: the selected coach stands at the front, the others fan out behind them,
 * staggered front-to-back from the centre out to the left and right. Tap a coach to bring them forward. */
(function () {
  'use strict';
  var K = 'fkbc_home_coach', $ = function (id) { return document.getElementById(id); };
  var me = function () { return window.FKHooks && FKHooks.me && FKHooks.me(); };
  function selectedId() {
    var v = null; try { v = localStorage.getItem(K); } catch (e) {}
    if (v && COACHES.some(function (c) { return c.id === v; })) return v;
    var m = me(); return m ? m.id : COACHES[0].id;
  }
  // ring of coaches in club order; `pos` is the (fractional) index of the coach at the front
  var pos = 0, anim = 0, drag = null, moved = false;
  function idxOf(id) { for (var i = 0; i < COACHES.length; i++) if (COACHES[i].id === id) return i; return 0; }
  var SC = [1, .83, .72, .62, .52, .45];
  function lerpT(t, a) { var i = Math.min(t.length - 2, Math.floor(a)), f = Math.min(1, a - i); return t[i] + (t[i + 1] - t[i]) * f; }
  function layout() {
    var stage = document.querySelector('.posterStage'); if (!stage) return;
    var n = COACHES.length, W = stage.clientWidth || 360, H = stage.clientHeight || 340, lo = -(n - 1) / 2;
    var maxA = n / 2, half = function (a) { return H * .235 * lerpT(SC, a); };
    var edge = W / 2 - half(maxA) * .55 - 4, k = .55;
    COACHES.forEach(function (c, i) {
      var b = stage.querySelector('[data-id="' + c.id + '"]'); if (!b) return;
      var f = ((i - pos - lo) % n + n) % n + lo;                       // offset from the front, wrapped into [lo, lo+n)
      var a = Math.abs(f), sg = f < 0 ? -1 : 1;
      var x = sg * edge * (1 - Math.exp(-a * k)) / (1 - Math.exp(-maxA * k));
      var sc = lerpT(SC, Math.min(a, SC.length - 1));
      var edgeDist = Math.min(f - lo, lo + n - f), op = Math.max(0, Math.min(1, edgeDist / .5));   // fade where a coach wraps round the end
      b.style.zIndex = Math.round(40 - a * 4 - (f < 0 ? .5 : 0));
      b.style.setProperty('--x', x.toFixed(1) + 'px'); b.style.setProperty('--y', (a ? -a * 3 : 0) + 'px'); b.style.setProperty('--sc', sc.toFixed(3));
      b.style.setProperty('--br', Math.max(.45, 1 - a * .15).toFixed(2)); b.style.setProperty('--bl', (a * .35).toFixed(2) + 'px'); b.style.opacity = op.toFixed(2);
      b.classList.toggle('front', a < .5);
    });
    var front = COACHES[((Math.round(pos) % n) + n) % n], nm = document.querySelector('#homeCoachLine .posterName');
    if (nm && nm.dataset.id !== front.id) { nm.dataset.id = front.id; nm.innerHTML = '<span>' + front.name + '</span>'; }
  }
  function settle(target) {      // glide to a whole position along the shortest way round
    cancelAnimationFrame(anim); var n = COACHES.length, from = pos, d = target - from; d = ((d + n / 2) % n + n) % n - n / 2; var to = from + d, t0 = performance.now(), dur = 260 + Math.min(300, Math.abs(d) * 90);
    var step = function (t) {
      var u = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - u, 3); pos = from + (to - from) * e; layout();
      if (u < 1) anim = requestAnimationFrame(step); else { pos = ((to % n) + n) % n; layout(); try { localStorage.setItem(K, COACHES[Math.round(pos) % n].id); } catch (e2) {} }
    };
    anim = requestAnimationFrame(step);
  }
  function render() {
    var line = $('homeCoachLine'); if (!line) return;
    var st = line.querySelector('.posterStage');
    if (!st) {
      line.innerHTML = '<div class="posterStage"></div><div class="posterName"></div><div class="posterHint">Swipe to move through the coaches</div>';
      line.classList.add('poster'); st = line.querySelector('.posterStage');
      COACHES.forEach(function (c) {
        var b = document.createElement('button'); b.type = 'button'; b.className = 'pc'; b.dataset.id = c.id; b.setAttribute('aria-label', c.name);
        b.innerHTML = '<img src="' + c.full + '" alt="" draggable="false">';
        b.onclick = function () { if (moved) return; var i = idxOf(c.id); if (i === (Math.round(pos) % COACHES.length + COACHES.length) % COACHES.length) { if (typeof showView === 'function') showView('coaches'); } else settle(i); };
        st.appendChild(b);
      });
      st.style.touchAction = 'pan-y';
      st.addEventListener('pointerdown', function (e) { if (e.pointerType === 'mouse' && e.button !== 0) return; cancelAnimationFrame(anim); drag = { x: e.clientX, p: pos, t: performance.now(), lx: e.clientX, lt: performance.now(), v: 0 }; moved = false; });
      st.addEventListener('pointermove', function (e) {
        if (!drag) return; var dx = e.clientX - drag.x;
        if (!moved && Math.abs(dx) > 8) { moved = true; try { st.setPointerCapture(e.pointerId); } catch (x) {} }
        if (!moved) return;
        var now = performance.now(); drag.v = (e.clientX - drag.lx) / Math.max(1, now - drag.lt); drag.lx = e.clientX; drag.lt = now;
        var per = Math.max(46, Math.min(90, st.clientWidth / 6)); pos = drag.p - dx / per; layout();
      });
      var end = function () {
        if (!drag) return; var wasMoved = moved, v = drag.v; drag = null;
        if (wasMoved) { var proj = pos - v * 220 / Math.max(46, Math.min(90, st.clientWidth / 6)) * 0.35; settle(Math.round(proj)); setTimeout(function () { moved = false; }, 60); }
      };
      st.addEventListener('pointerup', end); st.addEventListener('pointercancel', end);
    }
    if (!drag) { var want = idxOf(selectedId()); if (!anim || Math.round(pos) !== want) { pos = want; } }
    layout();
    var hello = $('posterHello'); if (hello) { var m = me(); hello.textContent = m ? 'Welcome back, ' + m.name : ''; }
  }
  var rzT; window.addEventListener('resize', function () { clearTimeout(rzT); rzT = setTimeout(layout, 100); });
  function ensureHello() {
    if ($('posterHello')) return; var inner = document.querySelector('.homeHeroInner'), line = $('homeCoachLine'); if (!inner || !line) return;
    var h = document.createElement('div'); h.id = 'posterHello'; h.className = 'posterHello'; line.after(h);
  }
  var base = window.renderHome;
  window.renderHome = function () { if (base) base.apply(this, arguments); try { ensureHello(); render(); } catch (e) { console.error(e); } };
  window.addEventListener('storage', function (e) { if (e.key === K) { pos = idxOf(selectedId()); render(); } });
  setTimeout(function () { try { ensureHello(); render(); } catch (e) {} }, 60);
  // re-render when the coach identity changes (sign-in) or the window is resized
  setInterval(function () { var h = $('posterHello'); if (h && me() && h.textContent.indexOf(me().name) < 0) render(); }, 1500);
})();

/* ---- a Home button on every page except Home, at every screen size (top bar, always reachable) ---- */
(function () {
  var $ = function (id) { return document.getElementById(id); };
  function ensure() {
    var bar = $('fkbcConsoleBar'); if (!bar) return false;
    if (!$('topHomeBtn')) {
      var b = document.createElement('button'); b.id = 'topHomeBtn'; b.type = 'button'; b.className = 'btn small topHome'; b.setAttribute('aria-label', 'Home');
      b.innerHTML = (typeof ico === 'function' ? ico('home', 18) : '') + '<span>Home</span>';
      b.onclick = function () { if (typeof showView === 'function') showView('home'); };
      bar.insertBefore(b, bar.firstChild);
    }
    sync(); return true;
  }
  function sync() { var b = $('topHomeBtn'); if (b) b.style.display = (typeof currentView !== 'undefined' && currentView === 'home') ? 'none' : ''; }
  var prev = window.showView; window.showView = function (n) { var r = prev.apply(this, arguments); try { ensure(); sync(); } catch (e) {} return r; };
  var n = 0, iv = setInterval(function () { if (ensure() || ++n > 40) clearInterval(iv); }, 150);
})();
