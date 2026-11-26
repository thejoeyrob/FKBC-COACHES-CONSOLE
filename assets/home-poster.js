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
  function order(sel) {
    // front = selected; others alternate right, left, right… in their club order, so depth grows outward from the centre
    var others = COACHES.filter(function (c) { return c.id !== sel; }), out = [{ c: COACHES.find(function (c) { return c.id === sel; }), d: 0, side: 0 }];
    others.forEach(function (c, i) { var d = Math.floor(i / 2) + 1, side = i % 2 === 0 ? 1 : -1; out.push({ c: c, d: d, side: side }); });
    return out;
  }
  function render() {
    var line = $('homeCoachLine'); if (!line) return;
    var sel = selectedId(), items = order(sel);
    var existing = line.querySelector('.posterStage');
    if (!existing) {
      line.innerHTML = '<div class="posterStage"></div><div class="posterName"></div><div class="posterHint">Tap a coach to bring them to the front</div>';
      line.classList.add('poster'); existing = line.querySelector('.posterStage');
      COACHES.forEach(function (c) {
        var b = document.createElement('button'); b.type = 'button'; b.className = 'pc'; b.dataset.id = c.id; b.setAttribute('aria-label', c.name);
        b.innerHTML = '<img src="' + c.full + '" alt="" draggable="false">'; b.onclick = function () { pick(c.id); }; existing.appendChild(b);
      });
    }
    place(existing, items);
    var nm = line.querySelector('.posterName'); var front = items[0].c;
    nm.innerHTML = '<span>' + front.name + '</span>';
    var hello = $('posterHello'); if (hello) { var m = me(); hello.textContent = m ? 'Welcome back, ' + m.name : ''; }
  }
  // spread everyone across the stage so ALL coaches stay on screen: the further from the centre, the smaller, higher and hazier
  function place(stage, items) {
    var W = stage.clientWidth || 360, H = stage.clientHeight || 340, maxD = 0;
    items.forEach(function (it) { if (it.d > maxD) maxD = it.d; });
    var sc = function (d) { return d === 0 ? 1.1 : Math.max(.42, 1 - d * .13); };
    var half = function (d) { return H * .235 * sc(d); };           // approx. half the width of a figure
    var edge = W / 2 - 4, lead = Math.min(W * .11, 62);
    var step = maxD ? Math.max(18, (edge - half(maxD) - lead) / maxD) : 0;
    items.forEach(function (it) {
      var b = stage.querySelector('[data-id="' + it.c.id + '"]'); if (!b) return;
      var d = it.d, x = it.side * (d ? lead + d * step : 0), z = 20 - d * 2 - (it.side < 0 ? 1 : 0);
      b.style.zIndex = z; b.style.setProperty('--x', x.toFixed(1) + 'px'); b.style.setProperty('--y', (-d * 9) + 'px');
      b.style.setProperty('--sc', sc(d).toFixed(3)); b.style.setProperty('--br', (1 - d * .17).toFixed(2)); b.style.setProperty('--bl', (d * .45).toFixed(2) + 'px');
      b.classList.toggle('front', d === 0);
    });
  }
  var rzT; window.addEventListener('resize', function () { clearTimeout(rzT); rzT = setTimeout(function () { var st = document.querySelector('.posterStage'); if (st) place(st, order(selectedId())); }, 100); });
  function pick(id) {
    if (id === selectedId()) { if (typeof showView === 'function') showView('coaches'); return; }
    try { localStorage.setItem(K, id); } catch (e) {} render();
  }
  function ensureHello() {
    if ($('posterHello')) return; var inner = document.querySelector('.homeHeroInner'), line = $('homeCoachLine'); if (!inner || !line) return;
    var h = document.createElement('div'); h.id = 'posterHello'; h.className = 'posterHello'; line.after(h);
  }
  var base = window.renderHome;
  window.renderHome = function () { if (base) base.apply(this, arguments); try { ensureHello(); render(); } catch (e) { console.error(e); } };
  window.addEventListener('storage', function (e) { if (e.key === K) render(); });
  setTimeout(function () { try { ensureHello(); render(); } catch (e) {} }, 60);
  // re-render when the coach identity changes (sign-in) or the window is resized
  setInterval(function () { var h = $('posterHello'); if (h && me() && h.textContent.indexOf(me().name) < 0) render(); }, 1500);
})();
