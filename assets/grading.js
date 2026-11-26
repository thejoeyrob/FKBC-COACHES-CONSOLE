/* FKBC Coaches Console — Grading night: a grading session (no timer).
 * Flow: choose belts → pick techniques from the whole syllabus → running order (+ warm-ups / notes anywhere, reorderable)
 * → optional student mat plan → brief → run (Back / Next through the content) → results (tick passes on the plan) → close.
 * Nothing is kept once the session is closed. */
(function () {
  'use strict';
  var $ = function (id) { return document.getElementById(id); };
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (m) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]; }); };
  var NOTE_C = '#8f9aa8', SLOTS = 13, ROWS = [[9, 10, 11, 12], [4, 5, 6, 7, 8], [0, 1, 2, 3]];   // back → front; front row is nearest the coach table
  var PRESETS = ['Warm up', 'Water break', 'Stretch', 'Bow in', 'Bow out', 'Line up'];
  var SHOW = [['next', 'Next technique'], ['list', 'Side list'], ['progress', 'Progression line'], ['belt', 'Belt band'], ['hints', 'Coach hints']];

  var belt = function (n) { var b = (BELTS.find(function (x) { return x[0] === n; }) || BELTS[0]); return { n: b[0], c: b[1], ink: b[2] }; };
  var col = function (it) { return it.kind === 'note' ? NOTE_C : belt(it.belt).c; };
  var uid2 = function () { return Math.random().toString(36).slice(2, 9); };
  var G = function () { return state.gs; };
  function show() { var d = { next: 1, list: 1, progress: 1, belt: 1, hints: 0 }, s = state.settings.gsShow || {}; Object.keys(d).forEach(function (k) { if (s[k] != null) d[k] = +!!s[k]; }); return d; }
  var save = function () { try { persist(); } catch (e) { } };

  /* ---------- small dialogs ---------- */
  function overlay(id, html, z) {
    var o = $(id); if (o) o.remove();
    document.body.insertAdjacentHTML('beforeend', '<div id="' + id + '" class="gsDlgBack" style="z-index:' + (z || 1400) + '"><div class="gsDlg">' + html + '</div></div>');
    return $(id);
  }
  function dlg(title, text, btns) {
    return new Promise(function (res) {
      var o = overlay('gsDlg', '<h3>' + esc(title) + '</h3><p>' + esc(text) + '</p><div class="gsDlgBtns">' + btns.map(function (b, i) { return '<button class="btn ' + (b.cls || '') + '" data-i="' + i + '">' + esc(b.label) + '</button>'; }).join('') + '</div>');
      o.addEventListener('click', function (e) { var b = e.target.closest('[data-i]'); if (b) { o.remove(); res(btns[+b.dataset.i].val); } else if (e.target === o) { o.remove(); res(null); } });
    });
  }
  function askText(title, value, opts) {
    opts = opts || {};
    return new Promise(function (res) {
      var o = overlay('gsAsk', '<h3>' + esc(title) + '</h3>' + (opts.presets ? '<div class="gsChips">' + opts.presets.map(function (p) { return '<button type="button" class="gsChip" data-p="' + esc(p) + '">' + esc(p) + '</button>'; }).join('') + '</div>' : '')
        + '<input id="gsAskIn" class="libInput" maxlength="' + (opts.max || 60) + '" value="' + esc(value || '') + '" placeholder="' + esc(opts.ph || '') + '" autocomplete="off"><div class="gsDlgBtns"><button class="btn" data-a="cancel">Cancel</button>' + (opts.clear ? '<button class="btn" data-a="clear">Clear</button>' : '') + '<button class="btn red" data-a="ok">' + esc(opts.ok || 'Save') + '</button></div>');
      var inp = $('gsAskIn'); setTimeout(function () { inp.focus(); inp.select(); }, 60);
      var done = function (v) { o.remove(); res(v); };
      inp.addEventListener('keydown', function (e) { if (e.key === 'Enter') done(inp.value.trim()); if (e.key === 'Escape') done(null); });
      o.addEventListener('click', function (e) {
        var p = e.target.closest('[data-p]'); if (p) return done(p.dataset.p);
        var b = e.target.closest('[data-a]'); if (b) return done(b.dataset.a === 'ok' ? inp.value.trim() : b.dataset.a === 'clear' ? '' : null);
        if (e.target === o) done(null);
      });
    });
  }

  /* ---------- mat plan ---------- */
  function mat(mode, small) {
    var g = G();
    var slot = function (i) {
      var nm = (g.names[i] || '').trim(), pass = !!g.passed[i];
      return '<button type="button" class="gsSlot' + (nm ? ' on' : '') + (pass ? ' pass' : '') + '" data-s="' + i + '" aria-label="Space ' + (i + 1) + (nm ? ': ' + esc(nm) : ' empty') + '"><b>' + (i + 1) + '</b><span>' + esc(nm) + '</span>' + (pass ? '<i class="gsTick">' + ico('check', small ? 12 : 16) + '</i>' : '') + '</button>';
    };
    return '<div class="gsMat ' + (small ? 'small ' : '') + 'm-' + mode + '"><div class="gsRows">' + ROWS.map(function (r) { return '<div class="gsRow r' + r.length + '">' + r.map(slot).join('') + '</div>'; }).join('') + '</div><div class="gsTable">Coach table</div></div>';
  }
  async function slotTap(i, mode) {
    var g = G();
    if (mode === 'pass') {
      if (!(g.names[i] || '').trim()) return;
      g.passed[i] = !g.passed[i]; if (!g.passed[i]) delete g.passed[i]; save(); return render();
    }
    if (mode === 'edit') {
      var v = await askText('Space ' + (i + 1) + ' — student name', g.names[i] || '', { ph: 'Name', max: 18, clear: true });
      if (v === null) return; g.names[i] = v; if (!v) delete g.passed[i]; save(); render();
    }
  }
  var namedCount = function () { return G().names.filter(function (n) { return (n || '').trim(); }).length; };

  /* ---------- data ---------- */
  function groupsFor(b) { return libGroups(libKey('syll', b)); }
  var keyOf = function (b, t) { return b + '|' + t; };
  function hasItem(b, t) { return G().items.some(function (x) { return x.kind === 'tech' && x.belt === b && x.t === t; }); }
  function toggleItem(b, g, x, on) {
    var G_ = G();
    if (on && !hasItem(b, x.t)) G_.items.push({ id: uid2(), kind: 'tech', belt: b, g: g, t: x.t, l: x.l || '', tip: x.tip || '' });
    else if (!on) G_.items = G_.items.filter(function (it) { return !(it.kind === 'tech' && it.belt === b && it.t === x.t); });
  }
  var beltUsed = function () { var s = {}; G().items.forEach(function (i) { if (i.kind === 'tech') s[i.belt] = 1; }); return Object.keys(s); };

  /* ---------- screens ---------- */
  var STEPS = ['belts', 'pick', 'order', 'mat', 'brief'], STEP_NAME = { belts: 'Belts', pick: 'Content', order: 'Order', mat: 'Students', brief: 'Brief' };
  function head(title, right) {
    var g = G(), si = STEPS.indexOf(g.step);
    return '<header class="gsHead"><button class="btn dark small" data-a="home" aria-label="Home">' + ico('home', 20) + '</button><div class="gsTitle"><small>Grading night' + (si > -1 ? ' · step ' + (si + 1) + ' of ' + STEPS.length : '') + '</small><b>' + esc(title) + '</b></div><div class="gsHeadR">' + (right || '') + '</div></header>';
  }
  function foot(back, next, nextLabel, nextOff, extra) {
    return '<footer class="gsFoot">' + (back ? '<button class="btn" data-a="back">' + ico('back', 16) + ' Back</button>' : '<span></span>') + (extra || '') + '<button class="btn red" data-a="next" ' + (nextOff ? 'disabled' : '') + '>' + esc(nextLabel || 'Next') + ' ' + ico('next', 16) + '</button></footer>';
  }

  function sBelts() {
    var g = G();
    return head('Which belts are grading?') + '<div class="gsBody"><p class="gsLead">Choose the belts being graded tonight. In the next step you can pick techniques from the whole syllabus, not only these belts.</p><div class="gsBelts">' + BELTS.map(function (b) {
      var on = g.belts.indexOf(b[0]) > -1;
      return '<button type="button" class="gsBelt' + (on ? ' on' : '') + '" data-b="' + b[0] + '" style="--c:' + b[1] + '">' + beltHtml(b[0]) + '<span>' + b[0] + '</span>' + (on ? '<i class="gsTick">' + ico('check', 14) + '</i>' : '') + '</button>';
    }).join('') + '</div></div>' + foot(false, true, 'Choose content', !g.belts.length);
  }
  function sPick() {
    var g = G(), tab = g.tab || g.belts[0] || 'White', groups = groupsFor(tab), c = belt(tab).c;
    var tabs = BELTS.map(function (b) { var n = g.items.filter(function (i) { return i.kind === 'tech' && i.belt === b[0]; }).length; return '<button type="button" class="gsTab' + (tab === b[0] ? ' on' : '') + (g.belts.indexOf(b[0]) > -1 ? ' pick' : '') + '" data-t="' + b[0] + '" style="--c:' + b[1] + '"><i></i>' + b[0] + (n ? ' <em>' + n + '</em>' : '') + '</button>'; }).join('');
    var list = groups.map(function (gr) {
      var items = gr[1], allOn = items.every(function (x) { return hasItem(tab, x.t); });
      return '<div class="gsGroupBox"><div class="gsGroupHead"><b>' + esc(gr[0]) + '</b><button type="button" class="gsSmall" data-all="' + esc(gr[0]) + '">' + (allOn ? 'Clear all' : 'Select all') + '</button></div>' + items.map(function (x) {
        return '<label class="gsRowSel' + (hasItem(tab, x.t) ? ' on' : '') + '" style="--c:' + c + '"><input type="checkbox" data-x="' + esc(x.t) + '" data-g="' + esc(gr[0]) + '" ' + (hasItem(tab, x.t) ? 'checked' : '') + '><span>' + (x.l && x.l !== 'All' ? '<b class="lvl ' + x.l[0] + '">' + x.l + '</b>' : '') + esc(x.t) + '</span></label>';
      }).join('') + '</div>';
    }).join('');
    return head('Choose the content', '<span class="gsCount">' + g.items.filter(function (i) { return i.kind === 'tech'; }).length + ' chosen</span>') + '<div class="gsBody"><div class="gsTabs">' + tabs + '</div>' + (list || '<p class="gsLead">Nothing in this belt yet.</p>') + '</div>' + foot(true, true, 'Running order', !g.items.length);
  }
  function sOrder() {
    var g = G(), rows = g.items.map(function (it, i) {
      var note = it.kind === 'note';
      return '<div class="gsOrd" data-i="' + i + '" style="--c:' + col(it) + '"><i class="gsBar"></i><span class="gsNum">' + (i + 1) + '</span><div class="gsOrdTxt"><b>' + esc(it.t) + '</b><small>' + (note ? 'Note / warm-up' : esc(it.belt + ' belt · ' + (it.g || ''))) + '</small></div>'
        + '<div class="gsOrdBtns"><button class="btn small" data-m="up" aria-label="Move up">' + ico('up', 16) + '</button><button class="btn small" data-m="down" aria-label="Move down">' + ico('down', 16) + '</button><button class="btn small" data-m="add" aria-label="Add a note after">' + ico('plus', 16) + '</button><button class="btn small" data-m="del" aria-label="Remove">' + ico('x', 16) + '</button></div></div>';
    }).join('');
    return head('Running order') + '<div class="gsBody"><p class="gsLead">Reorder with the arrows. Use <b>＋</b> on any line to add a warm-up, break or note after it.</p><button class="gsAddTop" data-m="addtop">' + ico('plus', 16) + ' Add warm-up / note at the start</button>' + rows + '</div>' + foot(true, true, 'Student plan');
  }
  function sMat() {
    return head('Student plan (optional)') + '<div class="gsBody"><p class="gsLead">Tap a space to put a student there. The coach table is at the bottom. You can skip this and run the grading without names.</p>' + mat('edit', false) + '</div>' + foot(true, true, 'Brief', false, '<button class="btn" data-a="skip">Skip</button>');
  }
  function listHtml(withNums) {
    return G().items.map(function (it, i) { return '<div class="gsBrief" style="--c:' + col(it) + '"><i class="gsBar"></i><span class="gsNum">' + (i + 1) + '</span><div><b>' + esc(it.t) + '</b><small>' + (it.kind === 'note' ? 'Note' : esc(it.belt + ' belt · ' + (it.g || ''))) + '</small></div></div>'; }).join('');
  }
  function sBrief() {
    var g = G(), n = namedCount(), used = beltUsed();
    return head('Brief') + '<div class="gsBody">' + (n ? '<div class="gsBriefMat">' + mat('view', true) + '</div>' : '<p class="gsLead">No student plan — running without names.</p>')
      + '<div class="gsBeltRow">' + used.map(function (b) { return '<span class="gsBeltChip" style="--c:' + belt(b).c + '">' + beltHtml(b) + b + '</span>'; }).join('') + '<span class="gsBeltChip plain">' + g.items.length + ' items</span></div><div class="gsBriefList">' + listHtml() + '</div></div>'
      + foot(true, true, 'Start grading');
  }

  /* ---------- run ---------- */
  function sRun() {
    var g = G(), it = g.items[g.i], nx = g.items[g.i + 1], S = show(), last = g.i >= g.items.length - 1, b = it.kind === 'tech' ? belt(it.belt) : null, c = col(it);
    var prevBelt = g._lb; var swap = prevBelt !== undefined && prevBelt !== (b ? b.n : '') && !!b; g._lb = b ? b.n : prevBelt;
    var prog = S.progress ? '<div class="gsProg" role="progressbar" aria-valuenow="' + (g.i + 1) + '" aria-valuemax="' + g.items.length + '">' + g.items.map(function (x, i) { return '<button type="button" data-j="' + i + '" class="' + (i < g.i ? 'd' : (i === g.i ? 'c' : '')) + '" style="--c:' + col(x) + '" aria-label="Go to item ' + (i + 1) + '"></button>'; }).join('') + '</div>' : '';
    var band = S.belt ? '<div class="gsBand' + (swap ? ' swap' : '') + '" style="--c:' + c + '">' + (b ? beltHtml(b.n) : '<span class="gsNoteIc">' + ico('clock', 22) + '</span>') + '<b>' + (b ? esc(b.n) + ' belt' : 'Between techniques') + '</b><em>' + (g.i + 1) + ' / ' + g.items.length + '</em></div>' : '';
    var nxt = S.next ? '<section class="gsNext" style="--c:' + (nx ? col(nx) : '#555') + '"><small>Next</small>' + (nx ? '<b>' + esc(nx.t) + '</b><span>' + (nx.kind === 'note' ? 'Note' : esc(nx.belt + ' belt' + (nx.belt !== (b && b.n) ? ' — new belt' : ''))) + '</span>' : '<b class="end">End of grading</b>') + '</section>' : '';
    var list = S.list ? '<aside class="gsList"><small>Running order</small>' + g.items.map(function (x, i) { return '<button type="button" class="gsLi' + (i === g.i ? ' on' : (i < g.i ? ' done' : '')) + '" data-j="' + i + '" style="--c:' + col(x) + '"><i></i><span>' + (i + 1) + '</span>' + esc(x.t) + '</button>'; }).join('') + '</aside>' : '';
    return '<div class="gsRun' + (S.list ? ' hasList' : '') + (g.listOpen ? ' listOpen' : '') + '" style="--c:' + c + ';--ink:' + (b ? b.ink : '#fff') + '">'
      + '<header class="gsHead run"><button class="btn dark small" data-a="home" aria-label="Home">' + ico('home', 20) + '</button><div class="gsTitle"><small>Grading night</small></div><div class="gsHeadR">'
      + '<button class="btn dark small" data-a="plan" aria-label="Student plan">' + ico('users', 18) + '<span>Plan</span></button>' + (S.list ? '<button class="btn dark small gsListBtn" data-a="list" aria-label="Running order">' + ico('doc', 18) + '</button>' : '')
      + '<button class="btn dark small" data-a="opts" aria-label="Display options">' + ico('sliders', 18) + '</button></div></header>'
      + band + '<main class="gsMain"><section class="gsNow' + (it.kind === 'note' ? ' note' : '') + '"><small>' + (it.kind === 'note' ? 'Now' : 'Now · ' + esc(it.g || '')) + '</small><h2>' + esc(it.t) + '</h2>' + (it.l && it.l !== 'All' ? '<span class="gsLvl">' + esc(it.l) + '</span>' : '') + (S.hints && it.tip ? '<div class="gsHint"><small>Coach hint</small>' + esc(it.tip) + '</div>' : '') + '</section>' + nxt + '</main>' + list + prog
      + '<footer class="gsDock"><button class="btn dark gsPrev" data-a="prev" ' + (g.i === 0 ? 'disabled' : '') + ' aria-label="Previous">' + ico('prev', 24) + '<span>Back</span></button><button class="btn red gsNextBtn" data-a="' + (last ? 'finish' : 'nextitem') + '">' + (last ? ico('check', 24) + '<span>Finish</span>' : '<span>Next</span>' + ico('skip', 24)) + '</button></footer></div>';
  }

  function sResults() {
    var g = G(), n = Object.keys(g.passed).length, named = namedCount();
    return head('Results') + '<div class="gsBody"><p class="gsLead">Grading complete. Tap a student to mark a <b>pass</b>. Passes show on the plan, ready to call out awards.</p>' + (named ? '<div class="gsCount big">' + n + ' of ' + named + ' passed</div>' + mat('pass', false)
      : '<p class="gsLead">No student plan was set up, so there is nothing to tick. You can add names now:</p><button class="btn" data-a="addnames">' + ico('users', 16) + ' Add the student plan</button>') + '</div>'
      + '<footer class="gsFoot"><button class="btn" data-a="backrun">' + ico('back', 16) + ' Back to the session</button><button class="btn red" data-a="done">Done</button></footer>';
  }

  /* ---------- render + events ---------- */
  function root() { var r = $('gsRoot'); if (!r) { document.body.insertAdjacentHTML('beforeend', '<div id="gsRoot" hidden></div>'); r = $('gsRoot'); r.addEventListener('click', onClick); r.addEventListener('change', onChange); } return r; }
  function render() {
    var g = G(); if (!g) return; var r = root(); r.hidden = false; document.body.classList.add('gsOn'); document.body.style.overflow = 'hidden';
    var html = ({ belts: sBelts, pick: sPick, order: sOrder, mat: sMat, brief: sBrief, run: sRun, results: sResults }[g.step] || sBelts)();
    var keep = r.querySelector('.gsBody'), top = keep ? keep.scrollTop : 0;
    r.className = 'gs step-' + g.step; r.innerHTML = html;
    var nb = r.querySelector('.gsBody'); if (nb && g._step === g.step) nb.scrollTop = top; g._step = g.step;
  }
  function closeAll() { var r = $('gsRoot'); if (r) { r.hidden = true; r.innerHTML = ''; } document.body.classList.remove('gsOn'); document.body.style.overflow = ''; }
  function go(step) { G().step = step; save(); render(); }
  var nextStep = { belts: 'pick', pick: 'order', order: 'mat', mat: 'brief', brief: 'run' }, prevStep = { pick: 'belts', order: 'pick', mat: 'order', brief: 'mat' };

  async function leave() {
    var g = G(); var v = await dlg('Leave grading night?', g.step === 'run' || g.step === 'results' ? 'The session plan and ticks are not saved. Pause and return later, or end the session.' : 'Your plan so far is kept until you end the session.', [{ label: 'Stay', val: 'stay' }, { label: 'Pause & go home', val: 'pause' }, { label: 'End session', val: 'end', cls: 'red' }]);
    if (v === 'pause') { closeAll(); showView('home'); } else if (v === 'end') end();
  }
  function end() { state.gs = null; save(); closeAll(); showView('home'); }

  async function onClick(e) {
    var g = G(); if (!g) return;
    var a = e.target.closest('[data-a]'); var t;
    if ((t = e.target.closest('[data-b]'))) { var b = t.dataset.b, i = g.belts.indexOf(b); if (i > -1) g.belts.splice(i, 1); else g.belts.push(b); g.belts.sort(function (x, y) { return BELTS.findIndex(function (q) { return q[0] === x; }) - BELTS.findIndex(function (q) { return q[0] === y; }); }); save(); return render(); }
    if ((t = e.target.closest('[data-t]'))) { g.tab = t.dataset.t; save(); return render(); }
    if ((t = e.target.closest('[data-all]'))) { var grp = groupsFor(g.tab || g.belts[0]).filter(function (q) { return q[0] === t.dataset.all; })[0]; if (grp) { var allOn = grp[1].every(function (x) { return hasItem(g.tab, x.t); }); grp[1].forEach(function (x) { toggleItem(g.tab, grp[0], x, !allOn); }); save(); render(); } return; }
    if ((t = e.target.closest('[data-s]'))) { var mode = t.closest('.gsMat').classList.contains('m-pass') ? 'pass' : (t.closest('.gsMat').classList.contains('m-edit') ? 'edit' : null); if (mode) slotTap(+t.dataset.s, mode); return; }
    if ((t = e.target.closest('[data-m]'))) {
      var row = t.closest('.gsOrd'), idx = row ? +row.dataset.i : -1, m = t.dataset.m, its = g.items;
      if (m === 'up' && idx > 0) { var x = its.splice(idx, 1)[0]; its.splice(idx - 1, 0, x); }
      else if (m === 'down' && idx < its.length - 1) { var y = its.splice(idx, 1)[0]; its.splice(idx + 1, 0, y); }
      else if (m === 'del') its.splice(idx, 1);
      else if (m === 'add' || m === 'addtop') { var txt = await askText('Add a warm-up or note', '', { presets: PRESETS, ph: 'e.g. Warm up', ok: 'Add' }); if (!txt) return; its.splice(m === 'addtop' ? 0 : idx + 1, 0, { id: uid2(), kind: 'note', t: txt }); }
      save(); return render();
    }
    if ((t = e.target.closest('[data-j]'))) { g.i = +t.dataset.j; g.listOpen = false; save(); return render(); }
    if (!a) return; var act = a.dataset.a;
    if (act === 'home') return leave();
    if (act === 'next') { if (g.step === 'belts') g.tab = g.belts[0]; if (g.step === 'brief') { g.step = 'run'; g.i = 0; g._lb = undefined; save(); return render(); } return go(nextStep[g.step]); }
    if (act === 'back') return go(prevStep[g.step]);
    if (act === 'skip') { var v = await dlg('Skip the student plan?', 'You can still run the grading without names. You can add them later from the Plan button.', [{ label: 'Go back', val: 0 }, { label: 'Skip it', val: 1, cls: 'red' }]); if (v) go('brief'); return; }
    if (act === 'prev') { if (g.i > 0) { g.i--; save(); render(); } return; }
    if (act === 'nextitem') { if (g.i < g.items.length - 1) { g.i++; save(); render(); } return; }
    if (act === 'finish') { g.step = 'results'; save(); return render(); }
    if (act === 'list') { g.listOpen = !g.listOpen; return render(); }
    if (act === 'plan') return planView();
    if (act === 'opts') return optsView();
    if (act === 'backrun') { g.step = 'run'; save(); return render(); }
    if (act === 'addnames') { g.step = 'mat'; g._returnToResults = true; save(); return render(); }
    if (act === 'done') { var d = await dlg('Close the grading session?', 'Nothing is saved — the plan, names and passes are cleared.', [{ label: 'Keep it open', val: 0 }, { label: 'Close it', val: 1, cls: 'red' }]); if (d) end(); }
  }
  function onChange(e) {
    var g = G(); var x = e.target.closest('[data-x]'); if (!x) return;
    var gname = x.dataset.g, grp = groupsFor(g.tab || g.belts[0]).filter(function (q) { return q[0] === gname; })[0]; var it = grp && grp[1].filter(function (q) { return q.t === x.dataset.x; })[0];
    if (it) { toggleItem(g.tab || g.belts[0], gname, it, x.checked); save(); render(); }
  }

  function planView() {
    var o = overlay('gsPlanBack', '<div class="gsPlanHead"><b>Student plan</b><button class="btn small" data-a="x">Close</button></div><p class="gsLead">Tap a space to change a name.</p><div id="gsPlanMat">' + mat('edit', false) + '</div>', 1300); o.classList.add('big');
    o.addEventListener('click', async function (e) { if (e.target.closest('[data-a=x]') || e.target === o) { o.remove(); render(); return; } var s = e.target.closest('[data-s]'); if (s) { await slotTap(+s.dataset.s, 'edit'); var pm = $('gsPlanMat'); if (pm) pm.innerHTML = mat('edit', false); } });
  }
  function optsView() {
    var S = show();
    var o = overlay('gsOptBack', '<h3>Display</h3><div class="gsChecks">' + SHOW.map(function (s) { return '<label class="gsChk"><input type="checkbox" data-k="' + s[0] + '" ' + (S[s[0]] ? 'checked' : '') + '><span>' + s[1] + '</span></label>'; }).join('') + '</div><div class="gsDlgBtns"><button class="btn red" data-a="x">Done</button></div>', 1400);
    o.addEventListener('change', function (e) { var k = e.target.dataset.k; if (!k) return; state.settings.gsShow = Object.assign({}, show()); state.settings.gsShow[k] = e.target.checked ? 1 : 0; save(); });
    o.addEventListener('click', function (e) { if (e.target.closest('[data-a=x]') || e.target === o) { o.remove(); render(); } });
  }

  document.addEventListener('keydown', function (e) {
    var g = G(); if (!g || g.step !== 'run' || $('gsRoot').hidden || document.querySelector('.gsDlgBack')) return;
    if (e.key === 'ArrowRight' || e.key === ' ') { e.preventDefault(); if (g.i < g.items.length - 1) { g.i++; save(); render(); } else { g.step = 'results'; save(); render(); } }
    else if (e.key === 'ArrowLeft') { e.preventDefault(); if (g.i > 0) { g.i--; save(); render(); } }
  });

  /* ---------- entry ---------- */
  async function open() {
    if (G() && G().items && G().items.length) {
      var v = await dlg('Grading night', 'A grading session is already set up.', [{ label: 'Start a new one', val: 'new' }, { label: 'Resume it', val: 'resume', cls: 'red' }]);
      if (v === 'resume') { if (!G().step) G().step = 'order'; return render(); } if (v !== 'new') return;
    }
    state.gs = { step: 'belts', belts: [], tab: 'White', items: [], names: new Array(SLOTS).fill(''), passed: {}, i: 0 }; save(); render();
  }
  window.GradingNight = { open: open, close: closeAll };
  var oldStart = window.startNew;
  window.startNew = function (kind) { if (kind === 'grading') { try { closeModal('newModal'); } catch (e) { } return open(); } return oldStart.apply(this, arguments); };
  if (G() && G().step && G().items && G().items.length && G().step !== 'belts') { /* a session in progress is kept: it resumes from Grading night */ }
})();
