/* FKBC Coaches Console — adaptive timer screen, pre-start review, mini "now running" bar.
 * The timer is drawn from the same lesson/phase data as before, arranged by screen size and by the assets the coach chooses.
 * Existing timer logic (ticks, bell, phases) is untouched: this only draws the screen and calls the same actions. */
(function () {
  'use strict';
  var $ = function (id) { return document.getElementById(id); };
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (m) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]; }); };
  var clone = function (x) { return JSON.parse(JSON.stringify(x)); };

  /* ================= settings ================= */
  var KEYS = ['tech', 'hints', 'next', 'stats', 'timeline', 'dots', 'list'];
  var PRESETS = {
    minimal: { tech: 0, hints: 0, next: 0, stats: 0, timeline: 0, dots: 0, list: 0 },
    more:    { tech: 1, hints: 0, next: 1, stats: 1, timeline: 1, dots: 1, list: 0 },
    all:     { tech: 1, hints: 1, next: 1, stats: 1, timeline: 1, dots: 1, list: 1 }
  };
  var PRESET_NAMES = { minimal: 'Minimal content', more: 'More content', all: 'All content', custom: 'Custom' };
  var STYLES = [['auto', 'Timer wheel — arranged for this screen'], ['ring', 'Timer wheel — simple stack'], ['big', 'Big clock'], ['wash', 'Phase colour'], ['card', 'Coach card'], ['cockpit', 'Cockpit (large screens)']];
  var ASSETS = [['tech', 'Now / technique detail'], ['hints', 'Coach hints'], ['next', 'Up next & then'], ['stats', 'Elapsed, left & finish time'],
    ['timeline', 'Lesson timeline'], ['dots', 'Round dots'], ['list', 'Technique list (large screens)']];
  var boolShow = function (o) { var r = {}; KEYS.forEach(function (k) { r[k] = !!o[k]; }); return r; };

  function raw() { return (state.settings.tv = state.settings.tv || {}); }
  function layoutOf(s) {   // the 5 fields that make up a "layout"
    var show = boolShow(Object.assign({}, PRESETS.more, s.show || {}));
    return { style: s.style || 'auto', coach: s.coach == null ? (state.settings.coachArt !== false) : !!s.coach, coachImg: (s.coachImg === 'hs' && s.coachZoom === 'whole') ? 'hsw' : (s.coachImg || 'hs'), coachSide: s.coachSide || 'left', show: show };
  }
  function cfg() { var s = raw(); var c = layoutOf(s); c.mode = s.mode || 'more'; c.saved = s.saved || [null, null, null]; c.lessonOnly = !!s.lessonOnly; return c; }
  function put(layout, mode, extra) {
    var s = raw(); Object.assign(s, layout, { mode: mode }, extra || {}); s.show = clone(layout.show); persist();
    if (showing()) render(true); refreshOpts(); updatePreview();
  }
  // any manual change -> Custom, starting from whatever is on screen (template or saved layout)
  function edit(patch, showPatch) {
    var c = cfg(), l = layoutOf(c); Object.assign(l, patch || {}); if (showPatch) Object.assign(l.show, showPatch);
    put(l, 'custom', { lessonOnly: false, custom: clone(l) });
  }
  function selectMode(m) {
    var s = raw(), c = cfg(), l = layoutOf(c);
    if (PRESETS[m]) { l.show = boolShow(PRESETS[m]); return put(l, m, { lessonOnly: false }); }
    if (m === 'custom') { return put(s.custom ? layoutOf(s.custom) : l, 'custom', { lessonOnly: false }); }
    var i = +m.replace('my', '') - 1, slot = (s.saved || [])[i];
    if (!slot) { toast('My Layout ' + (i + 1) + ' is empty — set up a layout and save it'); return refreshOpts(); }
    put(layoutOf(slot), m, { lessonOnly: false });
  }
  function saveSlot(i) {
    var s = raw(), l = layoutOf(cfg()); s.saved = s.saved || [null, null, null]; s.saved[i] = clone(l);
    put(l, 'my' + (i + 1), { saved: s.saved, lessonOnly: false }); toast('Saved as My Layout ' + (i + 1) + ' ✓');
  }
  function useLessonOnly() { var s = raw(); s.lessonOnly = true; persist(); refreshOpts(); toast('Using this layout for this lesson — it stays until you pick another'); }

  var showing = function () { return $('timerView') && $('timerView').classList.contains('show'); };

  function resolveStyle(c) {
    if (c.style !== 'auto') return c.style;
    var w = window.innerWidth, h = window.innerHeight;
    if (h < 520 && w > h) return 'land';
    if (w >= 900 && w > h) return 'cockpit';
    if (w >= 700) return 'card';
    return 'ring';   // the timer wheel is the default everywhere; the screen size only changes how it is arranged
  }
  function autoName() { var st = resolveStyle({ style: 'auto' }); return { land: 'Timer wheel — sideways phone', cockpit: 'Timer wheel — cockpit', card: 'Timer wheel — coach card', ring: 'Timer wheel — phone' }[st] || st; }

  // where the figure sits inside each head & shoulders picture [left, top, right, bottom] as fractions — lets us size by the figure, not by the transparent margins
  var HSBOX = {"joe":[0.137,0,0.863,0.97],"jack":[0.117,0,0.882,0.97],"paul":[0.21,0,0.788,0.97],"bigjohn":[0.147,0,0.852,0.97],"justin":[0.218,0.138,0.79,0.805],"gracie":[0.255,0,0.743,0.97],"john":[0.213,0.09,0.787,0.85],"eden":[0.238,0.087,0.738,0.855]};

  /* ================= helpers ================= */
  var PHC = { work: '#e11d3f', demo: '#d2a21f', rest: '#3a86c8', break: '#2fa66a' };
  var phWord = function (p) { return { work: 'Work', demo: 'Demo', rest: 'Swap', break: 'Break' }[p.type] || 'Work'; };
  var coachOf = function (p) { return p && p.coach ? coach(p.coach) : null; };
  function leftSec() { var after = phases.slice(state.run.phaseIndex + 1).reduce(function (a, x) { return a + x.duration; }, 0); return after + state.run.remaining; }
  function endsAt() { var d = new Date(Date.now() + leftSec() * 1000); return ('0' + d.getHours()).slice(-2) + ':' + ('0' + d.getMinutes()).slice(-2); }
  function hintFor(p) { var s = state.lesson.sections[p.sectionIndex]; var m = s && s.meta && s.meta[p.title]; return m && m.tip ? m.tip : ''; }
  function sideFor(c, p) { return c.coachSide === 'alt' ? (p.sectionIndex % 2 ? 'right' : 'left') : (c.coachSide === 'right' ? 'right' : 'left'); }

  /* ================= grid recipes ================= */
  function gridFor(style, f) {
    var rows, cols;
    if (style === 'land') {
      cols = 'minmax(0,1fr) minmax(0,1fr)'; rows = ['head head']; if (f.timeline) rows.push('tl tl');
      var r = ['title']; if (f.tech) r.push('tech'); if (f.stats) r.push('stats'); if (f.next) r.push('next'); r.push('dock');
      r.forEach(function (n) { rows.push('clock ' + n); });
    } else if (style === 'cockpit') {
      var left = ['title', 'clock']; if (f.tech) left.push('tech'); if (f.stats) left.push('stats'); left.push('dock');
      var right = []; if (f.list) right.push('list', 'list'); if (f.timeline) right.push('tl'); if (f.next) right.push('next', 'next');
      if (!right.length) { cols = 'minmax(0,1fr)'; rows = ['head'].concat(left); }
      else {
        cols = 'minmax(0,1.15fr) minmax(0,1fr)';
        while (right.length > left.length) left.splice(left.indexOf('clock'), 0, 'clock');
        while (left.length > right.length) right.push(right[right.length - 1]);
        rows = ['head head'].concat(left.map(function (l, i) { return l + ' ' + right[i]; }));
      }
    } else { // card: single column on portrait tablets
      cols = 'minmax(0,1fr)'; rows = ['head', 'title', 'clock']; if (f.stats) rows.push('stats'); if (f.timeline) rows.push('tl'); if (f.tech) rows.push('tech'); if (f.next) rows.push('next'); if (f.list) rows.push('list'); rows.push('dock');
    }
    var lastClock = -1; rows.forEach(function (x, i) { if (/clock/.test(x)) lastClock = i; });
    return { cols: cols, areas: rows.map(function (x) { return '"' + x + '"'; }).join(' '), trows: rows.map(function (x, i) { return i === lastClock ? 'minmax(' + (window.innerHeight >= 521 ? Math.round(Math.min(300, window.innerHeight * 0.4)) : 0) + 'px,1fr)' : 'auto'; }).join(' ') };
  }

  /* ================= build ================= */
  function nextCard(lab, q, c, showImg) {
    if (!q) return '<div class="nx"><small>' + lab + '</small><div class="nxl"><b style="color:#9ba5b2">End of lesson</b></div></div>';
    var co = showImg && q.coach ? coach(q.coach) : null;
    return '<div class="nx"><small>' + lab + '</small><div class="nxl">' + (co ? '<img src="' + esc(co.portrait) + '" alt="">' : '') + '<div><b>' + esc(q.title) + '</b><span>' + esc(q.category) + ' • ' + formatSec(q.duration) + '</span></div></div></div>';
  }
  var lastPhase = -1, lastType = 'work', lastSig = '';

  function build(root, style, c, p, opts) {
    var W = window.innerWidth, H = window.innerHeight, land = W > H, M = Math.round(Math.max(10, H * 0.03));
    var co = coachOf(p), haveCoach = c.coach && co && p.type !== 'break';
    var kind = c.coachImg === 'hsw' ? 'hs' : c.coachImg;   // 'hs' = head & shoulders close-up, 'hsw' = same picture, whole figure
    var layer = haveCoach && c.coachImg !== 'none';
    var side = sideFor(c, p), dir = side === 'left' ? -1 : 1;
    var cw = 0, bw = 0, shift = 0, hsS = 0, hsT = 0, hsL = 0;
    if (layer) {
      if (land) { cw = c.coachImg === 'full' ? Math.min(W / 3, (H - 2 * M) * 0.5) : W / 3; bw = cw; }   // landscape: at most a third of the screen, clock on the other side
      else { cw = W; bw = W; shift = 0; }   // portrait: centred, whole figure in view, behind the content
      if (kind === 'hs') {
        var hb = HSBOX[co.id] || [0.15, 0, 0.85, 0.97], fw = hb[2] - hb[0], fh = hb[3] - hb[1];
        var zoom = c.coachImg === 'hsw' ? 1 : (land ? 1.22 : 1.3);   // close-up by default: the face stays fully in view, the outer shoulders may run off the sides
        var tw = (land ? Math.max(120, cw - 12) : W * 0.98) * zoom;
        var size = Math.min(tw / fw, (H - M - 12) / fh), figW = size * fw;
        hsS = size; hsT = M - hb[1] * size;
        hsL = (land ? (cw - figW) / 2 : (W - figW) / 2) - hb[0] * size;   // figure centred in its space
      }
    }
    var techs = [], sec = state.lesson.sections[p.sectionIndex]; if (sec && sec.kind !== 'break') techs = techList(sec);
    var f = { tech: c.show.tech, hints: c.show.hints, next: c.show.next, stats: c.show.stats, timeline: c.show.timeline, list: c.show.list && techs.length > 0 && (style === 'cockpit' || (style === 'card' && W >= 700 && H >= 520)) };
    var hint = c.show.hints ? hintFor(p) : '';
    var h = '';
    h += '<header class="tvHead"><div class="tvLesson"><div class="tvEye">Current lesson</div><strong>' + esc(state.lesson.name) + '</strong></div><div class="tvBtns">'
      + '<button class="btn dark small" data-a="edit" aria-label="Edit lesson">' + ico('edit', 18) + '</button><button class="btn dark small" data-a="sound" aria-label="Sound">' + ico(state.settings.sound ? 'vol' : 'mute', 20) + '</button>'
      + '<button class="btn dark small" data-a="disp" aria-label="Display options">' + ico('sliders', 18) + '</button><button class="btn dark small" data-a="home" aria-label="Home">' + ico('home', 20) + '</button></div></header>';
    h += '<section class="tvTitle"><div class="tvCat">' + esc(p.category) + ' • ' + (state.run.phaseIndex + 1) + ' / ' + phases.length + '</div><h2>' + esc(p.title) + '</h2><div class="tvRound">' + esc(p.roundLabel) + '</div>'
      + (haveCoach ? '<div class="tvCoachChip"><small>Coach</small>' + esc(co.name) + '</div>' : '') + '</section>';
    if (f.timeline) {
      h += '<div class="tvTL" aria-hidden="true">' + state.lesson.sections.map(function (s, i) {
        var d = phases.filter(function (x) { return x.sectionIndex === i; }).reduce(function (a, x) { return a + x.duration; }, 0);
        var cls = i < p.sectionIndex ? 'd' : (i === p.sectionIndex ? 'c' : '');
        return '<i class="' + cls + '" style="flex:' + Math.max(1, d) + ';background:' + categoryColor(s) + ';color:' + categoryColor(s) + '"></i>';
      }).join('') + '<span class="pl"></span></div>';
    }
    var dots = '';
    if (c.show.dots && p.dots) { var n = p.dots[1], k = p.dots[0]; for (var i = 0; i < n; i++) dots += '<i class="' + (i < k ? 'f' : (i === k ? 'c' : '')) + '"></i>'; }
    var spawn = opts.spawn, old = PHC[lastType] || '#e11d3f';
    h += '<section class="tvClock"><div class="tvCircle"><svg class="tvSvg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="44" stroke="rgba(255,255,255,.1)" stroke-width="5" fill="none"/>'
      + (spawn ? '<circle id="tvRingOld" cx="50" cy="50" r="44" stroke="' + old + '" stroke-width="5" fill="none" stroke-linecap="round" stroke-dasharray="276.46" stroke-dashoffset="0" transform="rotate(-90 50 50)"/>' : '')
      + '<circle id="tvRing" class="' + (spawn ? 'sweep' : '') + '" cx="50" cy="50" r="44" stroke="var(--acc)" stroke-width="5" fill="none" stroke-linecap="round" stroke-dasharray="276.46" stroke-dashoffset="0" transform="rotate(-90 50 50)"/></svg>'
      + '<div class="tvCore"><div class="tvPhaseWord">' + esc(phWord(p)) + '</div><div class="tvTime" id="tvTime">0:00</div><div class="tvDots">' + dots + '</div></div></div>'
      + '<div class="tvBarWrap"><div class="tvBar">' + (spawn ? '<i class="old" style="background:' + old + '"></i>' : '') + '<b id="tvBar" class="' + (spawn ? 'swipe' : '') + '"></b></div></div>'
      + '<button class="tvChip" data-a="last10" id="tvLast10">' + ico('clock', 15) + ' Skip to last 10s</button></section>';
    if (f.tech) h += '<section class="tvTech"><small>Now</small><div class="det">' + esc(p.detail || '') + '</div>' + (hint ? '<div class="hint"><small>Coach hint</small>' + esc(hint) + '</div>' : '') + '</section>';
    else if (hint) h += '<section class="tvTech"><small>Coach hint</small><div class="det">' + esc(hint) + '</div></section>';
    if (f.list) h += '<section class="tvList"><small>Techniques</small>' + techs.map(function (t, i) { var cur = p.dots ? i === p.dots[0] : t === p.title; return '<div class="li' + (cur ? ' on' : (p.dots && i < p.dots[0] ? ' done' : '')) + '"><span>' + (i + 1) + '</span>' + esc(t) + '</div>'; }).join('') + '</section>';
    if (f.stats) h += '<section class="tvStats"><div><small>Elapsed</small><b id="tvEl">0:00</b></div><div><small>Lesson left</small><b id="tvLeft">0:00</b></div><div><small>Ends</small><b id="tvEnds">--:--</b></div></section>';
    if (f.next) h += '<section class="tvNext">' + nextCard('Up next', phases[state.run.phaseIndex + 1], c, c.coach && c.coachImg !== 'none') + nextCard('Then', phases[state.run.phaseIndex + 2], c, c.coach && c.coachImg !== 'none') + '</section>';
    h += '<footer class="tvDock"><button class="btn dark tvRound1" data-a="prev" aria-label="Previous">' + ico('prev', 20) + '</button><button class="btn red tvBig" data-a="pause" id="tvPause"></button><button class="btn dark tvRound1" data-a="next" aria-label="Next">' + ico('skip', 20) + '</button><button class="btn dark tvRound1" data-a="more" aria-label="More controls">' + ico('more', 20) + '</button></footer>';
    h += '<div class="tvTray" id="tvTray" hidden><button class="btn dark small" data-a="m30">−30s</button><button class="btn dark small" data-a="restart">' + ico('restart', 15) + ' Restart</button><button class="btn dark small" data-a="p30">+30s</button><button class="btn dark small" data-a="end">End lesson</button></div>';
    // coach image layer: always behind the content, at the side, full height
    if (layer) {
      var src = c.coachImg === 'full' ? co.full : co.portrait;
      h += '<div class="tvCoach ' + kind + ' side-' + side + (opts.still ? ' still' : '') + '"><img class="tvCoachImg" src="' + esc(src) + '" alt=""></div>';
    }
    root.innerHTML = h;
    root.className = 'tv tv-' + style + (land ? ' land' : ' port') + (layer ? ' hasCoach side-' + side : '') + ' coach-' + (c.coach ? c.coachImg : 'off') + (spawn ? ' spawning' : '');
    root.style.setProperty('--M', M + 'px'); root.style.setProperty('--cw', Math.round(cw) + 'px'); root.style.setProperty('--bw', Math.round(bw) + 'px'); root.style.setProperty('--dir', dir); root.style.setProperty('--shift', shift + '%');
    var hbx = HSBOX[co && co.id] || [0.15, 0, 0.85, 0.97]; root.style.setProperty('--b0', (hbx[0] * 100).toFixed(1)); root.style.setProperty('--b2', (hbx[2] * 100).toFixed(1));
    root.style.setProperty('--hsS', Math.round(hsS) + 'px'); root.style.setProperty('--hsT', Math.round(hsT) + 'px'); root.style.setProperty('--hsL', Math.round(hsL) + 'px');
    if (style === 'card' || style === 'cockpit' || style === 'land') {
      var g = gridFor(style, f); root.style.gridTemplateColumns = g.cols; root.style.gridTemplateAreas = g.areas; root.style.gridTemplateRows = g.trows;
    } else { root.style.gridTemplateColumns = root.style.gridTemplateAreas = root.style.gridTemplateRows = ''; }
    if (spawn) {
      var ring = $('tvRing'); if (ring) ring.addEventListener('animationend', function () { ring.classList.remove('sweep'); var o = $('tvRingOld'); if (o) o.remove(); });
      var bar = $('tvBar'); if (bar) bar.addEventListener('animationend', function () { bar.classList.remove('swipe'); var o = root.querySelector('.tvBar .old'); if (o) o.remove(); });
      setTimeout(function () { root.classList.remove('spawning'); var r2 = $('tvRing'); if (r2) r2.classList.remove('sweep'); var o1 = $('tvRingOld'); if (o1) o1.remove(); var b2 = $('tvBar'); if (b2) b2.classList.remove('swipe'); var o2 = root.querySelector('.tvBar .old'); if (o2) o2.remove(); }, 1300);
    }
  }

  /* ================= per-tick update ================= */
  function update(root, p) {
    var t = $('tvTime'); if (t) t.textContent = formatSec(state.run.remaining);
    var pct = 1 - (state.run.remaining / Math.max(1, state.run.total));
    var ring = $('tvRing'); if (ring) ring.style.strokeDashoffset = String(276.46 * pct);
    var bar = $('tvBar'); if (bar) bar.style.width = Math.max(0, (1 - pct) * 100) + '%';
    var el = $('tvEl'); if (el) el.textContent = formatSec(state.run.elapsed);
    var lf = $('tvLeft'); if (lf) lf.textContent = formatSec(leftSec());
    var en = $('tvEnds'); if (en) en.textContent = endsAt();
    var pause = $('tvPause'); if (pause) pause.innerHTML = state.run.playing ? ico('pause', 22) + '<span> Pause</span>' : ico('play', 22) + '<span> Resume</span>';
    var l10 = $('tvLast10'); if (l10) l10.style.visibility = state.run.remaining > 10 && state.run.active ? 'visible' : 'hidden';
    var pl = root.querySelector('.tvTL .pl');
    if (pl) { var tot = phases.reduce(function (a, x) { return a + x.duration; }, 0) || 1; var done = phases.slice(0, state.run.phaseIndex).reduce(function (a, x) { return a + x.duration; }, 0) + (state.run.total - state.run.remaining); pl.style.left = 'calc(' + Math.min(100, done / tot * 100) + '% - 1px)'; }
    root.classList.toggle('urgent', state.run.playing && state.run.remaining <= 10 && state.run.total > 12);
    var cl = root.querySelector('.tvCoach'); if (cl) cl.classList.toggle('out', state.run.playing && state.run.remaining <= 1 && state.run.total >= 4);
  }

  function render(force) {
    if (!showing()) return; var p = phase(); if (!p) return;
    var st = $('timerStage'); st.classList.add('tv');
    var root = $('tvRoot'); if (!root) { root = document.createElement('div'); root.id = 'tvRoot'; st.insertBefore(root, st.children[1] || null); root.addEventListener('click', onClick); root.addEventListener('scroll', function () { var cl = root.querySelector('.tvCoach'); if (cl) cl.style.transform = 'translateY(' + root.scrollTop + 'px)'; }, { passive: true }); }
    var c = cfg(), style = resolveStyle(c);
    var phaseChanged = state.run.phaseIndex !== lastPhase;
    var sig = [style, c.coach, c.coachImg, c.coachSide, JSON.stringify(c.show), state.run.phaseIndex, window.innerWidth > window.innerHeight ? 'L' : 'P', window.innerWidth >= 700 ? 'W' : 'N', state.settings.sound, state.lesson.name].join('|');
    if (force || sig !== lastSig) {
      var tray = $('tvTray') && !$('tvTray').hidden;
      build(root, style, c, p, { spawn: phaseChanged && lastPhase >= 0, still: !phaseChanged });
      if (tray) $('tvTray').hidden = false; lastSig = sig;
      if (phaseChanged) { lastType = p.type || 'work'; lastPhase = state.run.phaseIndex; }
    }
    root.dataset.ph = p.type || 'work';
    update(root, p);
  }

  /* ================= actions ================= */
  var MAP = { prev: 'prevPhase', pause: 'pauseTimer', next: 'nextPhaseBtn', m30: 'minus30', p30: 'plus30', restart: 'restartPhase', end: 'endLesson', sound: 'timerSound' };
  function last10() {
    if (!state.run.active || state.run.remaining <= 10) return;
    state.run.remaining = 10; if (state.run.playing) state.run.endAt = Date.now() + 10000; state.run.warned = false;
    renderTimer(false); persist();
  }
  window.timerLast10 = last10;
  function leaveTimer(dest) {
    window.__tvDest = dest;
    var m = $('runEditModal');
    if (m) { var h3 = m.querySelector('h3'), pp = m.querySelector('.modalBody p'); if (h3) h3.textContent = dest === 'home' ? 'Leave the timer' : 'Edit lesson while running'; if (pp) pp.textContent = dest === 'home' ? 'Go back to Home. Pause the class timer, or keep it running — a bar at the top will let you pause or return to it.' : 'Open the planner without losing the active section.'; }
    $('timerEdit').click();
  }
  function onClick(e) {
    var b = e.target.closest('[data-a]'); if (!b) return; e.stopPropagation(); var a = b.dataset.a;
    if (a === 'last10') return last10();
    if (a === 'more') { var t = $('tvTray'); t.hidden = !t.hidden; return; }
    if (a === 'disp') return openOpts();
    if (a === 'home') return leaveTimer('home');
    if (a === 'edit') return leaveTimer('planner');
    var id = MAP[a]; if (id && $(id)) $(id).click();
  }
  // after the existing "pause / keep running" choice, continue to Home when that is where the coach was heading
  ['editPause', 'editRun'].forEach(function (id) {
    var el = $(id); if (!el) return; var orig = el.onclick;
    el.onclick = function (ev) { var d = window.__tvDest; window.__tvDest = null; var r = orig && orig.call(this, ev); if (d === 'home') showView('home'); return r; };
  });
  var remBtn = document.querySelector('#runEditModal [data-close]'); if (remBtn) remBtn.addEventListener('click', function () { window.__tvDest = null; });

  /* ================= options UI ================= */
  var panels = [];   // [{host, pre}]
  function optsHTML(pre) {
    var c = cfg(), modeOpts = ['minimal', 'more', 'all', 'custom', 'my1', 'my2', 'my3'];
    var label = function (m) { if (/^my/.test(m)) { var i = +m.slice(2) - 1; return 'My Layout ' + (i + 1) + (c.saved[i] ? '' : ' (empty)'); } return PRESET_NAMES[m]; };
    var cur = c.mode, savedIdx = /^my/.test(cur) ? +cur.slice(2) - 1 : -1;
    var save = [0, 1, 2].map(function (i) {
      var st = savedIdx === i ? 'on' : (c.saved[i] ? 'over' : '');
      var txt = savedIdx === i ? '✓ My Layout ' + (i + 1) : (c.saved[i] ? 'Overwrite My Layout ' + (i + 1) : 'Save as My Layout ' + (i + 1));
      return '<button type="button" class="tvSave ' + st + '" data-save="' + i + '">' + txt + '</button>';
    }).join('');
    var useTxt = cur === 'custom' && c.lessonOnly ? '✓ Using for this lesson only' : (cur === 'custom' ? 'Use for this lesson only' : '✓ Using ' + label(cur));
    return '<div class="tvOpts">'
      + '<div class="tvOptRow"><label>Quick arrangement</label><select data-o="mode" class="libInput">' + modeOpts.map(function (m) { return '<option value="' + m + '"' + (cur === m ? ' selected' : '') + '>' + label(m) + '</option>'; }).join('') + '</select></div>'
      + '<div class="tvOptRow"><label>Layout style</label><select data-o="style" class="libInput">' + STYLES.map(function (s) { return '<option value="' + s[0] + '"' + (c.style === s[0] ? ' selected' : '') + '>' + s[1] + '</option>'; }).join('') + '</select></div>'
      + '<div class="tvAutoNote tvoNote"></div>'
      + '<label class="tvChk big"><input type="checkbox" data-o="coach"' + (c.coach ? ' checked' : '') + '><span>Show coach <small>name and picture on the timer and Up next</small></span></label>'
      + '<div class="tvOptGrid' + (c.coach ? '' : ' dim') + '"><div class="tvOptRow"><label>Coach picture</label><select data-o="coachImg" class="libInput"><option value="hs"' + (c.coachImg === 'hs' ? ' selected' : '') + '>Head &amp; shoulders close-up</option><option value="hsw"' + (c.coachImg === 'hsw' ? ' selected' : '') + '>Head &amp; shoulders wide</option><option value="full"' + (c.coachImg === 'full' ? ' selected' : '') + '>Full body</option><option value="none"' + (c.coachImg === 'none' ? ' selected' : '') + '>Off — name only</option></select></div>'
      + '<div class="tvOptRow"><label>Coach side</label><select data-o="coachSide" class="libInput"><option value="left"' + (c.coachSide === 'left' ? ' selected' : '') + '>Left (timer right)</option><option value="right"' + (c.coachSide === 'right' ? ' selected' : '') + '>Right (timer left)</option><option value="alt"' + (c.coachSide === 'alt' ? ' selected' : '') + '>Alternate each section</option></select></div></div>'
      + '<div class="tvOptHead">Show on the timer</div><div class="tvChecks">' + ASSETS.map(function (a) { return '<label class="tvChk"><input type="checkbox" data-asset="' + a[0] + '"' + (c.show[a[0]] ? ' checked' : '') + '><span>' + a[1] + '</span></label>'; }).join('') + '</div>'
      + '<div class="tvOptHead">Keep this arrangement</div><div class="tvSaveRow">' + save + '</div>'
      + '<button type="button" class="tvUse ' + (cur !== 'custom' || c.lessonOnly ? 'on' : '') + '" data-use="1">' + useTxt + '</button>'
      + '<p class="tvOptFoot">The circle or bar is always shown. The layout rearranges to use the space left by anything you switch off. Changing anything switches to Custom; pick a saved layout or a preset any time to go back.</p></div>';
  }
  function wire(host) {
    host.querySelectorAll('[data-o]').forEach(function (el) {
      el.onchange = function () {
        var o = el.dataset.o;
        if (o === 'mode') return selectMode(el.value);
        if (o === 'coach') { state.settings.coachArt = el.checked; return edit({ coach: el.checked }); }
        var patch = {}; patch[o] = el.value; edit(patch);
      };
    });
    host.querySelectorAll('[data-asset]').forEach(function (i) { i.onchange = function () { var o = {}; o[i.dataset.asset] = i.checked; edit(null, o); }; });
    host.querySelectorAll('[data-save]').forEach(function (b) { b.onclick = function () { saveSlot(+b.dataset.save); }; });
    host.querySelectorAll('[data-use]').forEach(function (b) { b.onclick = useLessonOnly; });
  }
  function mountOpts(host, pre) { host.innerHTML = optsHTML(pre); wire(host); panels = panels.filter(function (x) { return document.body.contains(x.host) && x.host !== host; }); panels.push({ host: host, pre: pre }); updatePreview(); }
  function refreshOpts() { panels = panels.filter(function (x) { return document.body.contains(x.host); }); panels.forEach(function (x) { var par = x.host.closest('.modalBody'); var ps = par ? par.scrollTop : 0; x.host.innerHTML = optsHTML(x.pre); wire(x.host); if (par) par.scrollTop = ps; }); updatePreview(); }
  function updatePreview() {
    document.querySelectorAll('.tvoNote').forEach(function (e) { e.textContent = cfg().style === 'auto' ? 'On this screen Auto uses: ' + autoName() : ''; });
    var pb = document.querySelector('#preStartModal.show .psBrief'); if (pb) pb.innerHTML = briefHTML();
  }

  function modal(id, title) {
    var m = $(id);
    if (!m) { document.body.insertAdjacentHTML('beforeend', '<div id="' + id + '" class="modal tvM"><div class="modalBox"><div class="modalHead"><h3>' + title + '</h3><button class="btn small" data-close="' + id + '">Close</button></div><div class="modalBody" id="' + id + 'B"></div><div class="modalFoot" id="' + id + 'F"></div></div></div>'); m = $(id); }
    return m;
  }
  function openOpts() {
    modal('tvOptModal', 'Timer display'); $('tvOptModalB').innerHTML = '<div id="tvOptHost"></div>'; mountOpts($('tvOptHost'), 'o');
    $('tvOptModalF').innerHTML = '<button class="btn red" data-close="tvOptModal">Done</button>'; openModal('tvOptModal'); $('tvOptModal').style.zIndex = 1400;
  }

  /* ================= pre-start review ================= */
  function briefHTML() {
    var at = 0, S = state.lesson.sections, f = function (x) { return String(Math.floor(x / 60)).padStart(2, '0') + ':' + String(x % 60).padStart(2, '0'); };
    var showCoach = cfg().coach;
    var cards = S.map(function (s) {
      normSec(s); var d = secDuration(s), start = at; at += d;
      var col = categoryColor(s), sum = secSummary(s).replace(/<[^>]+>/g, ''), tl = s.kind === 'break' ? [] : techList(s);
      var who = s.kind === 'break' || !showCoach ? '' : ' · ' + esc(coach(s.coach).name);
      return '<article class="bfCard" style="--c:' + col + '"><div class="bfHead"><b>' + esc(s.type + (s.title ? ' — ' + s.title : '')) + '</b><span>' + f(start) + ' · ' + formatSec(d) + who + '</span></div>'
        + (sum ? '<div class="bfSum">' + esc(sum) + '</div>' : '')
        + (tl.length ? '<ul>' + tl.map(function (x) { var m = (s.meta || {})[x]; return '<li>' + (m && m.g ? '<em>' + esc(m.g) + ':</em> ' : '') + esc(x) + (m && m.l && m.l !== 'All' ? ' <i>(' + esc(m.l) + ')</i>' : '') + (m && m.tip ? '<small>' + esc(m.tip) + '</small>' : '') + '</li>'; }).join('') + '</ul>' : '') + '</article>';
    }).join('');
    return cards + (state.lesson.notes ? '<article class="bfCard notes"><div class="bfHead"><b>Notes</b></div><div class="bfSum">' + esc(state.lesson.notes) + '</div></article>' : '');
  }
  function openPreStart() {
    phases = buildPhases(); if (!phases.length) { toast('Add a section first'); return; }
    var total = phases.reduce(function (a, x) { return a + x.duration; }, 0), ends = new Date(Date.now() + total * 1000), n = state.lesson.sections.length;
    modal('preStartModal', 'Ready to start');
    $('preStartModalB').innerHTML = '<div class="psTop"><div><div class="tvEye">Lesson</div><strong>' + esc(state.lesson.name) + '</strong></div><div class="psChips"><span>' + formatSec(total) + '</span><span>' + n + (n === 1 ? ' section' : ' sections') + '</span><span>Ends ' + ('0' + ends.getHours()).slice(-2) + ':' + ('0' + ends.getMinutes()).slice(-2) + '</span></div></div>'
      + '<div class="psH">Brief</div><div class="psBrief">' + briefHTML() + '</div><div class="psH">Timer display</div><div id="psOptHost"></div>';
    mountOpts($('psOptHost'), 'p');
    $('preStartModalF').innerHTML = '<button class="btn" data-close="preStartModal">Back to plan</button><button class="btn red" id="psGo">' + ico('play', 16) + ' Start lesson</button>';
    $('psGo').onclick = function () { closeModal('preStartModal'); if (window.Sfx && Sfx.unlock) Sfx.unlock(); lastPhase = -1; window.startLessonNow(); };
    openModal('preStartModal');
  }

  /* ================= mini "now running" bar ================= */
  function ensureMini() {
    if ($('tvMini')) return;
    document.body.insertAdjacentHTML('beforeend', '<div id="tvMini" hidden><div class="tvMiniTrack"><i id="tvMiniFill"></i></div><button type="button" class="tvMiniMain" data-m="open" aria-label="Return to the lesson timer"><span class="tvMiniTxt"><small id="tvMiniCat"></small><b id="tvMiniTitle"></b></span><span class="tvMiniTime" id="tvMiniTime"></span></button><button type="button" class="btn red small tvMiniPP" data-m="pp" id="tvMiniPP" aria-label="Pause or resume"></button></div>');
    $('tvMini').addEventListener('click', function (e) { var b = e.target.closest('[data-m]'); if (!b) return; if (b.dataset.m === 'pp') { pauseResume(); renderMini(); } else { showTimer(); } });
  }
  function renderMini() {
    ensureMini(); var on = !!(state.run && state.run.active) && !showing();
    var m = $('tvMini'); m.hidden = !on; document.body.classList.toggle('tvMiniOn', on);
    var bt = $('bottomTimer'); if (bt) bt.classList.toggle('tvLive', !!(state.run && state.run.active) && !showing());
    if (!on) return; phases = buildPhases(); var p = phase(); if (!p) return;
    $('tvMiniCat').textContent = p.category + ' · ' + (state.run.playing ? phWord(p) : 'Paused');
    $('tvMiniTitle').textContent = p.title; $('tvMiniTime').textContent = formatSec(state.run.remaining);
    var pct = Math.max(0, state.run.remaining / Math.max(1, state.run.total));
    var f = $('tvMiniFill'); f.style.width = (pct * 100) + '%'; f.style.background = PHC[p.type] || '#e11d3f';
    $('tvMiniPP').innerHTML = state.run.playing ? ico('pause', 18) : ico('play', 18);
    m.dataset.ph = p.type || 'work';
  }

  /* ================= wiring ================= */
  window.startLessonNow = window.startLesson;
  window.startLesson = openPreStart;
  var sb = $('startLessonBtn'); if (sb) sb.onclick = openPreStart;
  var base = window.renderTimer; window.renderTimer = function (a) { base(a); try { render(false); renderMini(); } catch (e) { console.error(e); } };
  var baseShow = window.showTimer; window.showTimer = function () { lastSig = ''; baseShow(); try { render(true); renderMini(); } catch (e) { console.error(e); } };
  var baseHide = window.hideTimer; window.hideTimer = function () { baseHide(); try { renderMini(); } catch (e) { } };
  var rz; window.addEventListener('resize', function () { clearTimeout(rz); rz = setTimeout(function () { if (showing()) render(true); updatePreview(); }, 120); });
  var cat = $('coachArtToggle'); if (cat) cat.addEventListener('change', function () { var s = raw(); s.coach = cat.checked; persist(); if (showing()) render(true); refreshOpts(); });
  setInterval(renderMini, 1000); ensureMini(); renderMini();
})();
