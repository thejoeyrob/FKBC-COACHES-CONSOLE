/* FKBC Coaches Console — adaptive timer screen + pre-start review.
 * The timer is rebuilt from the same lesson/phase data as before, but arranged by screen size and by the assets the coach
 * chooses to show. Layout and assets are set on the pre-start screen (or the Display button on the timer) and remembered.
 * Existing timer logic (ticks, bell, phases) is untouched: this only draws the screen and calls the same actions. */
(function () {
  'use strict';
  var $ = function (id) { return document.getElementById(id); };
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (m) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]; }); };

  /* ---------- settings ---------- */
  var DEF = { style: 'auto', coach: true, coachImg: 'hs',
    show: { tech: true, hints: false, next: true, stats: true, timeline: true, dots: true, list: true } };
  var STYLES = [['auto', 'Auto — best for this screen'], ['ring', 'Ring (classic)'], ['big', 'Big clock'], ['wash', 'Phase colour'], ['card', 'Coach card'], ['cockpit', 'Cockpit (large screens)']];
  var ASSETS = [['tech', 'Now / technique detail'], ['hints', 'Coach hints'], ['next', 'Up next & then'], ['stats', 'Elapsed, left & finish time'],
    ['timeline', 'Lesson timeline'], ['dots', 'Round dots'], ['list', 'Technique list (large screens)']];
  function cfg() {
    var s = (state.settings.tv = state.settings.tv || {});
    var c = { style: s.style || DEF.style, coach: s.coach == null ? (state.settings.coachArt !== false) : !!s.coach, coachImg: s.coachImg || DEF.coachImg, show: {} };
    Object.keys(DEF.show).forEach(function (k) { c.show[k] = s.show && s.show[k] != null ? !!s.show[k] : DEF.show[k]; });
    return c;
  }
  function save(patch, showPatch) {
    var s = (state.settings.tv = state.settings.tv || {}); Object.assign(s, patch || {});
    if (showPatch) s.show = Object.assign({}, cfg().show, showPatch);
    persist(); if (showing()) { render(true); } updatePreviewNote();
    var pb = document.querySelector('#preStartModal.show .psBrief'); if (pb) pb.innerHTML = briefHTML();
  }
  var showing = function () { return $('timerView') && $('timerView').classList.contains('show'); };

  function resolveStyle(c) {
    if (c.style !== 'auto') return c.style;
    var w = window.innerWidth, h = window.innerHeight;
    if (h < 520 && w > h) return 'land';
    if (w >= 900 && w > h) return 'cockpit';
    if (w >= 700) return 'card';
    if (w > h) return 'card';
    return 'big';
  }
  function autoName() { return (STYLES.filter(function (x) { return x[0] === resolveStyle(Object.assign(cfg(), { style: 'auto' })); })[0] || [0, ''])[1].split(' (')[0]; }

  /* ---------- helpers ---------- */
  var PHC = { work: '#e11d3f', demo: '#d2a21f', rest: '#3a86c8', break: '#2fa66a' };
  var phWord = function (p) { return { work: 'Work', demo: 'Demo', rest: 'Swap', break: 'Break' }[p.type] || 'Work'; };
  function coachOf(p) { return p && p.coach ? coach(p.coach) : null; }
  function leftSec() { var after = phases.slice(state.run.phaseIndex + 1).reduce(function (a, x) { return a + x.duration; }, 0); return after + state.run.remaining; }
  function endsAt() { var d = new Date(Date.now() + leftSec() * 1000); return ('0' + d.getHours()).slice(-2) + ':' + ('0' + d.getMinutes()).slice(-2); }
  function hintFor(p) { var s = state.lesson.sections[p.sectionIndex]; var m = s && s.meta && s.meta[p.title]; return m && m.tip ? m.tip : ''; }

  /* ---------- grid recipe for the multi-column layouts ---------- */
  function grid(style, f) {
    var rows = [], cols, hasCoach = f.coach;
    if (style === 'cockpit') {
      var right = f.list || f.timeline || f.next;
      cols = (hasCoach ? 'minmax(0,.85fr) ' : '') + 'minmax(0,1.15fr)' + (right ? ' minmax(0,1fr)' : '');
      var c = function (l, m, r) { return (hasCoach ? l + ' ' : '') + m + (right ? ' ' + r : ''); };
      rows.push(c('head', 'head', 'head'));
      rows.push(c('coach', 'title', f.list ? 'list' : (f.timeline ? 'tl' : 'next')));
      rows.push(c('coach', 'clock', f.list ? 'list' : (f.next ? 'next' : (f.timeline ? 'tl' : '.'))));
      if (f.tech || f.timeline || f.next || f.stats) {
        var r = []; if (f.tech) r.push(['tech', f.list && f.timeline ? 'tl' : (f.list && f.next ? 'next' : '.')]);
        if (f.stats) r.push(['stats', '.']);
        // right column fillers: timeline, then next
        var rc = []; if (f.list && f.timeline) rc.push('tl'); if (f.next && (f.list || f.timeline)) rc.push('next');
        var centre = []; if (f.tech) centre.push('tech'); if (f.stats) centre.push('stats'); centre.push('dock');
        var n = Math.max(centre.length, rc.length || 0);
        for (var i = 0; i < n; i++) rows.push(c('coach', centre[i] || centre[centre.length - 1], right ? (rc[i] || rc[rc.length - 1] || '.') : ''));
      } else rows.push(c('coach', 'dock', right ? '.' : ''));
      // ensure dock appears
      if (rows.join(' ').indexOf('dock') < 0) rows.push(c('coach', 'dock', '.'));
      return { cols: cols, areas: rows.map(function (x) { return '"' + x.trim() + '"'; }).join(' '), nrows: rows.length };
    }
    if (style === 'land') {
      cols = 'minmax(0,1fr) minmax(0,1fr)';
      rows.push('head head'); if (f.timeline) rows.push('tl tl');
      var rr = ['title']; if (f.tech) rr.push('tech'); if (f.stats) rr.push('stats'); if (f.next) rr.push('next');
      rr.push('dock'); rr.forEach(function (n) { rows.push('clock ' + n); });
      return { cols: cols, areas: rows.map(function (x) { return '"' + x + '"'; }).join(' '), nrows: rows.length };
    }
    // card
    cols = hasCoach ? 'minmax(0,1.15fr) minmax(0,.85fr)' : 'minmax(0,1fr)';
    var two = function (a, b) { return hasCoach ? a + ' ' + b : a; };
    rows.push(two('head', 'head'));
    rows.push(two('title', 'coach')); rows.push(two('clock', 'coach'));
    if (f.stats) rows.push(two('stats', 'coach'));
    if (f.timeline) rows.push(two('tl', 'tl'));
    if (f.tech) rows.push(two('tech', 'tech'));
    if (f.next) rows.push(two('next', 'next'));
    if (f.list && window.innerWidth >= 700) rows.push(two('list', 'list'));
    rows.push(two('dock', 'dock'));
    return { cols: cols, areas: rows.map(function (x) { return '"' + x + '"'; }).join(' '), nrows: rows.length };
  }

  /* ---------- build ---------- */
  function coachHTML(c, p, st) {
    if (!c.coach || !p.coach || p.type === 'break') return '';
    var co = coachOf(p); if (!co) return '';
    var img = c.coachImg;
    if (img === 'full') return '<div class="tvCoach full"><img src="' + esc(co.full) + '" alt=""><div class="tvCoachName">' + esc(co.name) + '</div></div>';
    if (img === 'hs') return '<div class="tvCoach hs"><img src="' + esc(co.portrait) + '" alt=""><div class="tvCoachName"><small>Coach</small>' + esc(co.name) + '</div></div>';
    return '<div class="tvCoach txt"><div class="tvCoachName"><small>Coach</small>' + esc(co.name) + '</div></div>';
  }
  function nextCard(lab, q, c) {
    if (!q) return '<div class="nx"><small>' + lab + '</small><div class="nxl"><b style="color:#9ba5b2">End of lesson</b></div></div>';
    var co = c.coach && c.coachImg !== 'none' && q.coach ? coach(q.coach) : null;
    return '<div class="nx"><small>' + lab + '</small><div class="nxl">' + (co ? '<img src="' + esc(co.portrait) + '" alt="">' : '') + '<div><b>' + esc(q.title) + '</b><span>' + esc(q.category) + ' • ' + formatSec(q.duration) + '</span></div></div></div>';
  }
  function build(root, style, c, p) {
    var f = { coach: c.coach && p.coach && p.type !== 'break' && c.coachImg !== 'none' ? true : false, tl: c.show.timeline, timeline: c.show.timeline, tech: c.show.tech, hints: c.show.hints, next: c.show.next, stats: c.show.stats, list: c.show.list };
    var wideList = f.list && (style === 'cockpit' || (style === 'card' && window.innerWidth >= 700 && window.innerHeight >= 520));
    var techs = []; var sec = state.lesson.sections[p.sectionIndex]; if (sec && sec.kind !== 'break') techs = techList(sec);
    f.list = wideList && techs.length > 0;
    var hint = c.show.hints ? hintFor(p) : '';
    var coachBlock = coachHTML(c, p);
    var coachInGrid = (style === 'card' || style === 'cockpit') && f.coach;
    if (style === 'land' && c.coachImg === 'full') c = Object.assign({}, c, { coachImg: 'hs' });
    var html = '';
    html += '<header class="tvHead"><div class="tvLesson"><div class="tvEye">Current lesson</div><strong>' + esc(state.lesson.name) + '</strong></div><div class="tvBtns">'
      + '<button class="btn dark small" data-a="edit" aria-label="Edit">' + ico('edit', 18) + '</button><button class="btn dark small" data-a="sound" aria-label="Sound">' + ico(state.settings.sound ? 'vol' : 'mute', 20) + '</button>'
      + '<button class="btn dark small" data-a="disp" aria-label="Display options">' + ico('sliders', 18) + '</button><button class="btn dark small" data-a="exit" aria-label="Back to planner">' + ico('back', 18) + '</button></div></header>';
    html += '<section class="tvTitle"><div class="tvCat">' + esc(p.category) + ' • ' + (state.run.phaseIndex + 1) + ' / ' + phases.length + '</div><h2>' + esc(p.title) + '</h2><div class="tvRound">' + esc(p.roundLabel) + '</div>'
      + (!coachInGrid && coachBlock && c.coachImg === 'hs' ? coachBlock : '')
      + (!coachInGrid && coachBlock && (c.coachImg === 'full' || style === 'land') ? '<div class="tvCoachChip"><small>Coach</small>' + esc(coachOf(p).name) + '</div>' : '') + '</section>';
    if (c.show.timeline) {
      html += '<div class="tvTL" aria-hidden="true">' + state.lesson.sections.map(function (s, i) {
        var d = phases.filter(function (x) { return x.sectionIndex === i; }).reduce(function (a, x) { return a + x.duration; }, 0);
        var cls = i < p.sectionIndex ? 'd' : (i === p.sectionIndex ? 'c' : '');
        return '<i class="' + cls + '" style="flex:' + Math.max(1, d) + ';background:' + categoryColor(s) + ';color:' + categoryColor(s) + '"></i>';
      }).join('') + '<span class="pl"></span></div>';
    }
    var dots = '';
    if (c.show.dots && p.dots) { var n = p.dots[1], k = p.dots[0]; for (var i = 0; i < n; i++) dots += '<i class="' + (i < k ? 'f' : (i === k ? 'c' : '')) + '"></i>'; }
    html += '<section class="tvClock"><div class="tvCircle"><svg class="tvSvg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="44" stroke="rgba(255,255,255,.1)" stroke-width="5" fill="none"/><circle id="tvRing" cx="50" cy="50" r="44" stroke="var(--acc)" stroke-width="5" fill="none" stroke-linecap="round" stroke-dasharray="276.46" stroke-dashoffset="0" transform="rotate(-90 50 50)"/></svg>'
      + '<div class="tvCore"><div class="tvPhaseWord">' + esc(phWord(p)) + '</div><div class="tvTime" id="tvTime">0:00</div><div class="tvDots">' + dots + '</div></div></div>'
      + '<div class="tvBarWrap"><div class="tvBar"><b id="tvBar"></b></div></div><button class="tvChip" data-a="last10" id="tvLast10">' + ico('clock', 15) + ' Skip to last 10s</button></section>';
    if (c.show.tech) html += '<section class="tvTech"><small>Now</small><div class="det">' + esc(p.detail || '') + '</div>' + (hint ? '<div class="hint"><small>Coach hint</small>' + esc(hint) + '</div>' : '') + '</section>';
    else if (hint) html += '<section class="tvTech"><small>Coach hint</small><div class="det">' + esc(hint) + '</div></section>';
    if (f.list) html += '<section class="tvList"><small>Techniques</small>' + techs.map(function (t, i) { var cur = p.dots ? i === p.dots[0] : t === p.title; return '<div class="li' + (cur ? ' on' : (p.dots && i < p.dots[0] ? ' done' : '')) + '"><span>' + (i + 1) + '</span>' + esc(t) + '</div>'; }).join('') + '</section>';
    if (c.show.stats) html += '<section class="tvStats"><div><small>Elapsed</small><b id="tvEl">0:00</b></div><div><small>Lesson left</small><b id="tvLeft">0:00</b></div><div><small>Ends</small><b id="tvEnds">--:--</b></div></section>';
    if (c.show.next) html += '<section class="tvNext">' + nextCard('Up next', phases[state.run.phaseIndex + 1], c) + nextCard('Then', phases[state.run.phaseIndex + 2], c) + '</section>';
    if (coachBlock && (coachInGrid || c.coachImg === 'full' || c.coachImg === 'txt' || c.coachImg === 'none') && !(!coachInGrid && c.coachImg === 'hs')) html += coachBlock;
    html += '<footer class="tvDock"><button class="btn dark tvRound1" data-a="prev" aria-label="Previous">' + ico('prev', 20) + '</button><button class="btn red tvBig" data-a="pause" id="tvPause"></button><button class="btn dark tvRound1" data-a="next" aria-label="Next">' + ico('skip', 20) + '</button><button class="btn dark tvRound1" data-a="more" aria-label="More controls">' + ico('more', 20) + '</button></footer>';
    html += '<div class="tvTray" id="tvTray" hidden><button class="btn dark small" data-a="m30">−30s</button><button class="btn dark small" data-a="restart">' + ico('restart', 15) + ' Restart</button><button class="btn dark small" data-a="p30">+30s</button><button class="btn dark small" data-a="end">End lesson</button></div>';
    root.innerHTML = html;
    root.className = 'tv tv-' + style + (f.coach && coachInGrid ? ' hasCoach' : '') + ' coach-' + (c.coach ? c.coachImg : 'off');
    if (style === 'card' || style === 'cockpit' || style === 'land') {
      var g = grid(style, { coach: coachInGrid, timeline: c.show.timeline, tech: c.show.tech || !!hint, next: c.show.next, stats: c.show.stats, list: f.list });
      root.style.gridTemplateColumns = g.cols; root.style.gridTemplateAreas = g.areas;
      var rowsA = g.areas.split('" "'), lastClock = -1; rowsA.forEach(function (r, i) { if (/clock/.test(r)) lastClock = i; });
      root.style.gridTemplateRows = rowsA.map(function (r, i) { return i === lastClock ? 'minmax(0,1fr)' : 'auto'; }).join(' ');
    } else { root.style.gridTemplateColumns = root.style.gridTemplateAreas = root.style.gridTemplateRows = ''; }
  }

  /* ---------- update (every tick) ---------- */
  function update(root, p) {
    var t = $('tvTime'); if (t) t.textContent = formatSec(state.run.remaining);
    var ring = $('tvRing'); var pct = 1 - (state.run.remaining / Math.max(1, state.run.total));
    if (ring) ring.style.strokeDashoffset = String(276.46 * pct);
    var bar = $('tvBar'); if (bar) bar.style.width = Math.min(100, pct * 100) + '%';
    var el = $('tvEl'); if (el) el.textContent = formatSec(state.run.elapsed);
    var lf = $('tvLeft'); if (lf) lf.textContent = formatSec(leftSec());
    var en = $('tvEnds'); if (en) en.textContent = endsAt();
    var pause = $('tvPause'); if (pause) pause.innerHTML = state.run.playing ? ico('pause', 22) + '<span> Pause</span>' : ico('play', 22) + '<span> Resume</span>';
    var l10 = $('tvLast10'); if (l10) l10.style.visibility = state.run.remaining > 10 && state.run.active ? 'visible' : 'hidden';
    var pl = root.querySelector('.tvTL .pl');
    if (pl) { var tot = phases.reduce(function (a, x) { return a + x.duration; }, 0) || 1; var done = phases.slice(0, state.run.phaseIndex).reduce(function (a, x) { return a + x.duration; }, 0) + (state.run.total - state.run.remaining); pl.style.left = 'calc(' + Math.min(100, done / tot * 100) + '% - 1px)'; }
    root.classList.toggle('urgent', state.run.playing && state.run.remaining <= 10 && state.run.total > 12);
  }

  var lastSig = '';
  function render(force) {
    if (!showing()) return; var p = phase(); if (!p) return;
    var st = $('timerStage'); st.classList.add('tv');
    var root = $('tvRoot'); if (!root) { root = document.createElement('div'); root.id = 'tvRoot'; st.insertBefore(root, st.children[1] || null); root.addEventListener('click', onClick); }
    var c = cfg(), style = resolveStyle(c);
    var sig = [style, c.coach, c.coachImg, JSON.stringify(c.show), state.run.phaseIndex, window.innerWidth > window.innerHeight ? 'L' : 'P', window.innerWidth >= 700 ? 'W' : 'N', state.settings.sound, state.lesson.name].join('|');
    if (force || sig !== lastSig) { var tray = $('tvTray') && !$('tvTray').hidden; build(root, style, c, p); if (tray) $('tvTray').hidden = false; lastSig = sig; }
    root.dataset.ph = p.type || 'work';
    update(root, p);
  }

  /* ---------- actions ---------- */
  var MAP = { prev: 'prevPhase', pause: 'pauseTimer', next: 'nextPhaseBtn', m30: 'minus30', p30: 'plus30', restart: 'restartPhase', end: 'endLesson', edit: 'timerEdit', sound: 'timerSound', exit: 'timerExit' };
  function last10() {
    if (!state.run.active || state.run.remaining <= 10) return;
    state.run.remaining = 10; if (state.run.playing) state.run.endAt = Date.now() + 10000; state.run.warned = false;
    renderTimer(false); persist();
  }
  function onClick(e) {
    var b = e.target.closest('[data-a]'); if (!b) return; e.stopPropagation(); var a = b.dataset.a;
    if (a === 'last10') return last10();
    if (a === 'more') { var t = $('tvTray'); t.hidden = !t.hidden; return; }
    if (a === 'disp') return openOpts();
    var id = MAP[a]; if (id && $(id)) $(id).click();
  }
  window.timerLast10 = last10;

  /* ---------- options UI (shared by pre-start + in-timer) ---------- */
  function optsHTML(pre) {
    pre = pre || 'o'; var c = cfg();
    return '<div class="tvOpts">'
      + '<div class="tvOptRow"><label>Layout</label><select id="' + pre + 'tvoStyle" class="libInput">' + STYLES.map(function (s) { return '<option value="' + s[0] + '"' + (c.style === s[0] ? ' selected' : '') + '>' + s[1] + '</option>'; }).join('') + '</select></div>'
      + '<div class="tvAutoNote tvoNote" id="' + pre + 'tvoNote"></div>'
      + '<label class="tvChk big"><input type="checkbox" id="' + pre + 'tvoCoach"' + (c.coach ? ' checked' : '') + '><span>Show coach <small>name and picture on the timer and Up next</small></span></label>'
      + '<div class="tvOptRow" id="' + pre + 'tvoImgRow"><label>Coach picture</label><select id="' + pre + 'tvoImg" class="libInput"><option value="hs"' + (c.coachImg === 'hs' ? ' selected' : '') + '>Head &amp; shoulders close-up</option><option value="full"' + (c.coachImg === 'full' ? ' selected' : '') + '>Full body</option><option value="none"' + (c.coachImg === 'none' ? ' selected' : '') + '>Off — name as text only</option></select></div>'
      + '<div class="tvOptHead">Show on the timer</div><div class="tvChecks">' + ASSETS.map(function (a) { return '<label class="tvChk"><input type="checkbox" data-asset="' + a[0] + '"' + (c.show[a[0]] ? ' checked' : '') + '><span>' + a[1] + '</span></label>'; }).join('') + '</div>'
      + '<p class="tvOptFoot">The circle or progress bar is always shown so everyone can see the time. The layout rearranges to use the space left by anything you switch off.</p></div>';
  }
  function wireOpts(root, pre) {
    pre = pre || 'o'; var q = function (s) { return root.querySelector(s.replace('#', '#' + pre)); };
    q('#tvoStyle').onchange = function () { save({ style: this.value }); };
    q('#tvoCoach').onchange = function () { save({ coach: this.checked }); state.settings.coachArt = this.checked; q('#tvoImgRow').style.opacity = this.checked ? 1 : .4; };
    q('#tvoImg').onchange = function () { save({ coachImg: this.value }); };
    root.querySelectorAll('[data-asset]').forEach(function (i) { i.onchange = function () { var o = {}; o[i.dataset.asset] = i.checked; save(null, o); }; });
    q('#tvoImgRow').style.opacity = cfg().coach ? 1 : .4; updatePreviewNote();
  }
  function updatePreviewNote() { var n = document.querySelectorAll('.tvoNote'); n.forEach(function (e) { e.textContent = cfg().style === 'auto' ? 'On this screen Auto uses: ' + autoName() : ''; }); }

  function modal(id, title) {
    var m = $(id);
    if (!m) { document.body.insertAdjacentHTML('beforeend', '<div id="' + id + '" class="modal tvM"><div class="modalBox"><div class="modalHead"><h3>' + title + '</h3><button class="btn small" data-close="' + id + '">Close</button></div><div class="modalBody" id="' + id + 'B"></div><div class="modalFoot" id="' + id + 'F"></div></div></div>'); m = $(id); }
    return m;
  }
  function openOpts() {
    modal('tvOptModal', 'Timer display'); $('tvOptModalB').innerHTML = optsHTML('o'); wireOpts($('tvOptModalB'), 'o');
    $('tvOptModalF').innerHTML = '<button class="btn red" data-close="tvOptModal">Done</button>'; openModal('tvOptModal'); $('tvOptModal').style.zIndex = 1400;
  }

  /* ---------- pre-start review ---------- */
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
    var total = phases.reduce(function (a, x) { return a + x.duration; }, 0), ends = new Date(Date.now() + total * 1000);
    modal('preStartModal', 'Ready to start');
    $('preStartModalB').innerHTML = '<div class="psTop"><div><div class="tvEye">Lesson</div><strong>' + esc(state.lesson.name) + '</strong></div><div class="psChips"><span>' + formatSec(total) + '</span><span>' + state.lesson.sections.length + (state.lesson.sections.length === 1 ? ' section' : ' sections') + '</span><span>Ends ' + ('0' + ends.getHours()).slice(-2) + ':' + ('0' + ends.getMinutes()).slice(-2) + '</span></div></div>'
      + '<div class="psH">Brief</div><div class="psBrief">' + briefHTML() + '</div>'
      + '<div class="psH">Timer display</div>' + optsHTML('p');
    wireOpts($('preStartModalB'), 'p');
    $('preStartModalF').innerHTML = '<button class="btn" data-close="preStartModal">Back to plan</button><button class="btn red" id="psGo">' + ico('play', 16) + ' Start lesson</button>';
    $('psGo').onclick = function () { closeModal('preStartModal'); Sfx.unlock && Sfx.unlock(); window.startLessonNow(); };
    openModal('preStartModal');
  }

  /* ---------- wiring ---------- */
  window.startLessonNow = window.startLesson;
  window.startLesson = openPreStart;
  var sb = $('startLessonBtn'); if (sb) sb.onclick = openPreStart;
  var base = window.renderTimer; window.renderTimer = function (a) { base(a); try { render(false); } catch (e) { console.error(e); } };
  var baseShow = window.showTimer; window.showTimer = function () { lastSig = ''; baseShow(); try { render(true); } catch (e) { console.error(e); } };
  var rz; window.addEventListener('resize', function () { clearTimeout(rz); rz = setTimeout(function () { if (showing()) render(true); updatePreviewNote(); }, 120); });
  var cat = $('coachArtToggle'); if (cat) cat.addEventListener('change', function () { var s = (state.settings.tv = state.settings.tv || {}); s.coach = cat.checked; persist(); if (showing()) render(true); });
})();
