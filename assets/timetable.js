/* FKBC Coaches Console — timetable v2: day plan (add / delete / move lessons), one-off dates, cancelled / postponed,
 * "this session or every session" edits, and the coach check-in widget ("Who's down tonight").
 * Loads after the main app and live.js. Data lives in the same timetable rows (synced by live.js); check-ins sync via the
 * `checkins` table. Everything keeps working offline. */
(function () {
  'use strict';
  var H = function () { return window.FKHooks || {}; };
  var $ = function (id) { return document.getElementById(id); };
  var DN = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (m) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]; }); };
  var iso = function (d) { var z = new Date(d.getTime() - d.getTimezoneOffset() * 6e4); return z.toISOString().slice(0, 10); };
  var parse = function (s) { var p = s.split('-').map(Number); return new Date(p[0], p[1] - 1, p[2]); };
  var addDays = function (s, n) { var d = parse(s); d.setDate(d.getDate() + n); return iso(d); };
  var today = function () { return iso(new Date()); };
  var fmt = function (s) { return parse(s).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' }); };
  var fmtLong = function (s) { return parse(s).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' }); };
  var clone = function (x) { return JSON.parse(JSON.stringify(x)); };
  var uid = function () { return Math.random().toString(36).slice(2, 8) + Date.now().toString(36).slice(-4); };
  var coach = function (id) { return H().coachById && H().coachById(id); };
  var me = function () { return H().me && H().me(); };
  var loadTT = function () { return H().ttLoad(); };
  var saveTT = function (a, rem) { H().ttSave(a, rem); };
  var say = function (m) { try { toast(m); } catch (e) { alert(m); } };
  var nowHM = function () { var d = new Date(); return ('0' + d.getHours()).slice(-2) + ':' + ('0' + d.getMinutes()).slice(-2); };
  var weekday = function (s) { return DN[parse(s).getDay()]; };
  var mondayOf = function (s) { var d = parse(s), k = d.getDay() || 7; d.setDate(d.getDate() - (k - 1)); return iso(d); };
  var dead = function (s) { return s.status === 'cancelled' || s.status === 'postponed'; };

  /* ---------- the timetable, resolved for a date ---------- */
  function res(r, ex, d) {
    ex = ex || {};
    return { rid: r.id, date: d, name: ex.name || r.name, start: ex.start || r.start, end: ex.end || r.end, room: ex.room || r.room,
      coaches: Array.isArray(ex.coaches) ? ex.coaches : (r.coaches || []), status: ex.status || '', note: ex.note || '', oneOff: !!r.date, lesson: r.lesson || null };
  }
  function sessionsOn(d) {
    var dn = weekday(d), out = [];
    loadTT().forEach(function (r) {
      var ex = (r.ex || {})[d];
      if (r.date) { if (r.date !== d) return; }
      else if (r.day !== dn) return;
      if (ex && ex.status === 'removed') return;
      out.push(res(r, ex, d));
    });
    return out.sort(function (a, b) { return a.start.localeCompare(b.start) || a.room - b.room; });
  }
  function nextClass() {
    var t0 = today(), nh = nowHM();
    for (var i = 0; i < 60; i++) {
      var d = addDays(t0, i), l = sessionsOn(d).filter(function (s) { return !dead(s) && (i > 0 || s.start > nh); });
      if (l.length) { var s = l[0]; return { day: weekday(d), session: { name: s.name, start: s.start, end: s.end }, date: new Date(d + 'T' + s.start) }; }
    }
    return null;
  }
  window.findNextClass = nextClass;

  /* ---------- check-ins ---------- */
  var KCK = 'fkbc_checkins';
  var ckRows = function () { try { return JSON.parse(localStorage.getItem(KCK)) || []; } catch (e) { return []; } };
  var who = function (d, sid) { var seen = {}, out = []; ckRows().forEach(function (x) { if (x.day === d && x.sid === sid && !seen[x.coach]) { seen[x.coach] = 1; out.push(x.coach); } }); return out; };
  var canCheck = function (s) { return s.date === today() && !dead(s) && nowHM() < s.start; };
  function setIn(s, on) {
    var m = me(); if (!m) return;
    var rows = ckRows().filter(function (x) { return !(x.day === s.date && x.sid === s.rid && x.coach === m.id); });
    if (on) rows.push({ day: s.date, sid: s.rid, coach: m.id });
    try { localStorage.setItem(KCK, JSON.stringify(rows)); } catch (e) {}
    if (window.Live && Live.enabled && Live.setCheckin) Live.setCheckin(s.date, s.rid, s.start, on);
    refresh();
  }
  var av = function (id, cls) { var c = coach(id); return c ? '<img class="av ' + (cls || '') + '" src="' + esc(c.portrait) + '" alt="' + esc(c.name) + '" title="' + esc(c.name) + '">' : ''; };
  var avs = function (ids, cls) { return ids.map(function (i) { return av(i, cls); }).join(''); };
  var names = function (ids) { return ids.map(function (i) { return (coach(i) || {}).name; }).filter(Boolean).join(', '); };

  /* ---------- modal helpers ---------- */
  function modal(id, title, z) {
    var m = $(id);
    if (!m) {
      document.body.insertAdjacentHTML('beforeend', '<div id="' + id + '" class="modal ttM"><div class="modalBox"><div class="modalHead"><h3 id="' + id + 'T"></h3><button class="btn small" data-close="' + id + '">Close</button></div><div class="modalBody" id="' + id + 'B"></div><div class="modalFoot" id="' + id + 'F"></div></div></div>');
      m = $(id);
    }
    if (z) m.style.zIndex = z;
    $(id + 'T').textContent = title; return m;
  }
  var showing = function (id) { var m = $(id); return !!(m && m.classList.contains('show')); };
  function choice(title, text, opts) {
    return new Promise(function (res_) {
      modal('ttChoice', title, 1600);
      $('ttChoiceB').innerHTML = '<p style="margin:0 0 12px;color:var(--muted)">' + esc(text) + '</p>' + opts.map(function (o, i) { return '<button class="btn ' + (o.cls || '') + ' ttWide" data-i="' + i + '">' + esc(o.label) + '</button>'; }).join('');
      $('ttChoiceF').innerHTML = '';
      var done = function (v) { closeModal('ttChoice'); res_(v); };
      $('ttChoiceB').querySelectorAll('[data-i]').forEach(function (b) { b.onclick = function () { done(opts[+b.dataset.i].val); }; });
      $('ttChoice').querySelector('[data-close]').onclick = function () { done(null); };
      openModal('ttChoice');
    });
  }
  function needAdmin(why) {
    if (H().isAdmin && H().isAdmin()) return true;
    if (!confirm((why || 'Changing the timetable') + ' needs the admin code. Enter it now?')) return false;
    return !!(H().requestAdmin && H().requestAdmin());
  }

  /* ---------- week grid ---------- */
  var weekOff = 0;
  function sessMini(s) {
    var inn = who(s.date, s.rid), col = s.room === 1 ? '#f01936' : '#3492ff';
    return '<div class="classCard ttMini ' + (dead(s) ? 'dead' : '') + '" style="--clr:' + col + '"><strong>' + esc(s.name) + '</strong><span>' + esc(s.start) + ' – ' + esc(s.end) + '</span>'
      + '<span class="roomPill">Room ' + s.room + '</span>' + (s.oneOff ? '<span class="ttTag one">One-off</span>' : '') + (s.status ? '<span class="ttTag ' + s.status + '">' + (s.status === 'cancelled' ? 'Cancelled' : 'Postponed') + '</span>' : '')
      + '<div class="classCoaches">' + avs(s.coaches, 'classCoachAvatar') + '<span class="classCoachNames">' + (names(s.coaches) || 'Coaches not allocated') + '</span></div>'
      + (inn.length ? '<div class="ttIn"><span>In:</span>' + avs(inn, 'sm') + '</div>' : '') + '</div>';
  }
  function renderTT() {
    var view = $('timetableView'); if (!view) return;
    view.querySelectorAll('.scheduleToolbar').forEach(function (x) { x.remove(); });
    var mon = addDays(mondayOf(today()), weekOff * 7), t = today();
    var days = []; for (var i = 0; i < 7; i++) days.push(addDays(mon, i));
    if (!view.querySelector('.ttToolbar')) {
      var tb = document.createElement('div'); tb.className = 'ttToolbar';
      tb.innerHTML = '<div class="ttWeekNav"><button class="btn small" id="ttPrev" aria-label="Previous week">' + ico('back', 16) + '</button><b id="ttWeekLbl"></b><button class="btn small" id="ttNext" aria-label="Next week">' + ico('next', 16) + '</button><button class="btn small" id="ttThis">This week</button></div>'
        + '<div class="ttActs"><button class="btn small red" id="ttAddBtn">＋ Add lesson</button><button class="btn small" id="ttAdmin">Admin edit</button><button class="btn small" id="ttMyPlan">My next lesson</button></div>';
      var anchor = view.querySelector('.pageTitle'); if (anchor) anchor.after(tb); else view.prepend(tb);
      $('ttPrev').onclick = function () { weekOff--; renderTT(); }; $('ttNext').onclick = function () { weekOff++; renderTT(); }; $('ttThis').onclick = function () { weekOff = 0; renderTT(); };
      $('ttAddBtn').onclick = function () { openAdd(today()); };
      $('ttAdmin').onclick = function () { if (H().requestAdmin && H().requestAdmin()) say('Admin editing on for 30 minutes'); };
      $('ttMyPlan').onclick = function () { var m = me(); if (!m) return; for (var k = 0; k < 60; k++) { var d = addDays(today(), k); if (sessionsOn(d).some(function (s) { return !dead(s) && s.coaches.indexOf(m.id) > -1 && (k > 0 || s.start > nowHM()); })) { openDay(d); return; } } say('You are not allocated to an upcoming session.'); };
    }
    $('ttWeekLbl').textContent = weekOff === 0 ? 'This week' : fmt(days[0]) + ' – ' + fmt(days[6]);
    $('scheduleGrid').innerHTML = days.map(function (d) {
      var l = sessionsOn(d);
      return '<section class="dayCard ttDay ' + (d === t ? 'today' : '') + (d < t ? ' past' : '') + '" data-d="' + d + '"><h3>' + esc(fmt(d)) + (d === t ? ' · Today' : '') + '</h3>'
        + (l.map(sessMini).join('') || '<div class="ttNone">No session</div>') + '<div class="ttOpen">Open day plan ›</div></section>';
    }).join('');
    $('scheduleGrid').querySelectorAll('[data-d]').forEach(function (x) { x.onclick = function () { openDay(x.dataset.d); }; });
    renderUpcoming(view);
  }
  function renderUpcoming(view) {
    var box = $('ttUpcoming'); if (!box) { box = document.createElement('section'); box.id = 'ttUpcoming'; box.className = 'panel ttUp'; $('scheduleGrid').after(box); }
    var items = [], t0 = today();
    for (var i = 0; i < 70; i++) { var d = addDays(t0, i); sessionsOn(d).forEach(function (s) { if (s.oneOff || s.status) items.push(s); }); }
    box.innerHTML = '<div class="panelBody"><div class="eyebrow">Coming up · one-offs and changes</div>' + (items.length ? items.map(function (s) {
      return '<button class="ttUpRow" data-d="' + s.date + '"><b>' + esc(fmt(s.date)) + '</b><span>' + esc(s.start) + ' ' + esc(s.name) + ' · Room ' + s.room + '</span>' + (s.oneOff ? '<span class="ttTag one">One-off</span>' : '') + (s.status ? '<span class="ttTag ' + s.status + '">' + (s.status === 'cancelled' ? 'Cancelled' : 'Postponed') + '</span>' : '') + (s.note ? '<em>' + esc(s.note) + '</em>' : '') + '</button>';
    }).join('') : '<p style="color:var(--muted);margin:6px 0 0">Nothing special scheduled. Add a one-off lesson with ＋ Add lesson, or open a day to cancel or move a session.</p>') + '</div>';
    box.querySelectorAll('[data-d]').forEach(function (b) { b.onclick = function () { openDay(b.dataset.d); }; });
  }
  window.renderTimetable = renderTT;

  /* ---------- day plan ---------- */
  var dayCur = null;
  function openDay(d) {
    dayCur = d; modal('ttDayModal', fmtLong(d));
    var l = sessionsOn(d), t = today();
    $('ttDayModalB').innerHTML = l.length ? l.map(function (s) {
      var inn = who(d, s.rid), mine = me() && inn.indexOf(me().id) > -1, can = canCheck(s);
      return '<article class="ttSess ' + (dead(s) ? 'dead' : '') + '" data-r="' + esc(s.rid) + '"><div class="ttSessHead"><div><strong>' + esc(s.name) + '</strong><small>' + esc(s.start) + ' – ' + esc(s.end) + ' · Room ' + s.room + '</small></div><div>'
        + (s.oneOff ? '<span class="ttTag one">One-off</span>' : '') + (s.status ? '<span class="ttTag ' + s.status + '">' + (s.status === 'cancelled' ? 'Cancelled' : 'Postponed') + '</span>' : '') + '</div></div>'
        + '<div class="ttWho"><span class="ttLbl">Teaching</span>' + avs(s.coaches, 'sm') + '<small>' + esc(names(s.coaches) || 'not allocated') + '</small></div>'
        + (inn.length ? '<div class="ttWho"><span class="ttLbl">In</span>' + avs(inn, 'sm') + '</div>' : '')
        + (s.note ? '<div class="ttNote">' + esc(s.note) + '</div>' : '')
        + '<div class="ttBtns">' + (d === t && !dead(s) ? '<button class="btn small ' + (can && !mine ? 'red' : mine ? 'on' : '') + '" data-act="in" ' + (can ? '' : 'disabled') + '>' + (mine ? ico('check', 14) + ' I\'m in' : can ? 'Check in' : 'Check-in closed') + '</button>' : '')
        + '<button class="btn small" data-act="edit">Edit</button><button class="btn small" data-act="move">Move</button><button class="btn small" data-act="cancel">' + (s.status === 'cancelled' ? 'Restore' : 'Cancel') + '</button><button class="btn small danger" data-act="del">Delete</button></div></article>';
    }).join('') : '<p style="color:var(--muted)">No lessons on this day yet.</p>';
    $('ttDayModalF').innerHTML = '<button class="btn" id="ttDayPrev">' + ico('back', 16) + ' Day</button><button class="btn" id="ttDayNext">Day ' + ico('next', 16) + '</button><button class="btn red" id="ttDayAdd">＋ Add lesson</button>';
    $('ttDayPrev').onclick = function () { openDay(addDays(d, -1)); }; $('ttDayNext').onclick = function () { openDay(addDays(d, 1)); }; $('ttDayAdd').onclick = function () { openAdd(d); };
    $('ttDayModalB').querySelectorAll('[data-act]').forEach(function (b) {
      b.onclick = function () {
        var rid = b.closest('[data-r]').dataset.r, a = b.dataset.act, s = sessionsOn(d).find(function (x) { return x.rid === rid; }); if (!s) return;
        if (a === 'edit') openEdit(rid, d); else if (a === 'move') openMove(rid, d); else if (a === 'del') doDelete(rid, d);
        else if (a === 'cancel') doCancel(rid, d, s); else if (a === 'in') { var m = me(); var mine = m && who(d, rid).indexOf(m.id) > -1; if (canCheck(s)) setIn(s, !mine); }
      };
    });
    openModal('ttDayModal');
  }
  function afterChange() { renderTT(); try { renderHome(); } catch (e) {} renderWidget(); if (dayCur && showing('ttDayModal')) openDay(dayCur); }

  function doCancel(rid, d, s) {
    if (!needAdmin('Cancelling a session')) return;
    var data = loadTT(), r = data.find(function (x) { return x.id === rid; }); if (!r) return;
    r.ex = r.ex || {}; var e = r.ex[d] = r.ex[d] || {};
    if (s.status === 'cancelled') { delete e.status; delete e.note; } else { e.status = 'cancelled'; e.note = prompt('Reason (optional, shown to coaches)', '') || ''; }
    if (!Object.keys(e).length) delete r.ex[d];
    saveTT(data); afterChange();
  }
  async function doDelete(rid, d) {
    if (!needAdmin('Deleting a lesson')) return;
    var data = loadTT(), r = data.find(function (x) { return x.id === rid; }); if (!r) return;
    if (r.date) { var ok = await choice('Delete this lesson?', r.name + ' on ' + fmt(r.date) + ' is a one-off lesson and will be removed.', [{ label: 'Delete lesson', cls: 'red', val: 1 }]); if (!ok) return; saveTT(data.filter(function (x) { return x.id !== rid; }), [rid]); }
    else {
      var v = await choice('Delete which?', r.name + ' runs every ' + r.day + ' at ' + r.start + '.', [{ label: 'Just ' + fmt(d), val: 'one' }, { label: 'Every ' + r.day + ' (whole series)', cls: 'red', val: 'all' }]);
      if (!v) return;
      if (v === 'all') saveTT(data.filter(function (x) { return x.id !== rid; }), [rid]);
      else { r.ex = r.ex || {}; r.ex[d] = Object.assign(r.ex[d] || {}, { status: 'removed' }); saveTT(data); }
    }
    afterChange();
  }

  /* ---------- add a lesson ---------- */
  function coachGrid(sel, locked) {
    return '<div class="ttCoachGrid">' + COACHES.map(function (c) { return '<button type="button" class="ttCoachBtn ' + (sel.indexOf(c.id) > -1 ? 'selected' : '') + '" data-id="' + c.id + '" ' + (locked ? 'disabled' : '') + '><img src="' + esc(c.portrait) + '" alt=""><strong>' + esc(c.name) + '</strong></button>'; }).join('') + '</div>';
  }
  function wireGrid(root, locked) {
    root.querySelectorAll('.ttCoachBtn').forEach(function (b) {
      b.onclick = function () { if (locked) return; var n = root.querySelectorAll('.ttCoachBtn.selected').length; if (!b.classList.contains('selected') && n >= 2) { say('Two coaches per class — deselect one first'); return; } b.classList.toggle('selected'); };
    });
  }
  var picked = function (root) { return [].map.call(root.querySelectorAll('.ttCoachBtn.selected'), function (b) { return b.dataset.id; }); };
  function openAdd(d) {
    modal('ttAddModal', 'Add a lesson');
    $('ttAddModalB').innerHTML = '<div class="ttFormGrid"><div class="ttField"><label>Lesson name</label><input id="aName" value="Kickboxing"></div><div class="ttField"><label>Date</label><input id="aDate" type="date" value="' + d + '"></div>'
      + '<div class="ttField"><label>Start</label><input id="aStart" type="time" value="18:00"></div><div class="ttField"><label>End</label><input id="aEnd" type="time" value="19:00"></div><div class="ttField"><label>Room</label><select id="aRoom"><option>1</option><option>2</option></select></div>'
      + '<div class="ttField"><label>Repeats</label><select id="aRep"><option value="one">Just this date (one-off)</option><option value="weekly">Every week on this day</option></select></div></div><div class="eyebrow" style="margin:14px 0 7px">Coaches (2)</div>' + coachGrid([], false);
    wireGrid($('ttAddModalB'), false);
    $('ttAddModalF').innerHTML = '<button class="btn red" id="aSave">Add lesson</button>';
    $('aSave').onclick = function () {
      if (!needAdmin('Adding a lesson')) return;
      var cs = picked($('ttAddModalB')), date = $('aDate').value, st = $('aStart').value, en = $('aEnd').value;
      if (!date || !st || !en) { say('Choose a date and times'); return; } if (en <= st) { say('End must be after the start'); return; }
      var row = { id: ($('aRep').value === 'one' ? 'x' : 'r') + uid(), day: weekday(date), name: $('aName').value.trim() || 'Kickboxing', start: st, end: en, room: +$('aRoom').value, coaches: cs, lesson: null };
      if ($('aRep').value === 'one') row.date = date;
      var data = loadTT(); data.push(row); saveTT(data); closeModal('ttAddModal');
      say($('aRep').value === 'one' ? 'One-off lesson added for ' + fmt(date) : 'Weekly lesson added'); dayCur = date; afterChange(); openDay(date);
    };
    openModal('ttAddModal');
  }

  /* ---------- edit (this session / every session) ---------- */
  var SCOPEK = 'fkbc_tt_scope';
  var getPref = function () { try { return localStorage.getItem(SCOPEK) === 'ask' ? 'ask' : 'all'; } catch (e) { return 'all'; } };
  async function openEdit(rid, d) {
    var data0 = loadTT(), r0 = data0.find(function (x) { return x.id === rid; }); if (!r0) return;
    var m = me(), admin = !!(H().isAdmin && H().isAdmin());
    if (!admin && !(m && ((r0.coaches || []).indexOf(m.id) > -1))) {
      if (!confirm('This session is protected — allocated coaches can edit the lesson plan. Enter the admin code to edit everything?')) return;
      if (!(H().requestAdmin && H().requestAdmin())) return; admin = true;
    }
    var recurring = !r0.date, scope = 'all';
    if (recurring && getPref() === 'ask') {
      scope = await choice('Edit which sessions?', 'Edit every ' + r0.day + ' ' + r0.start + ' session, or just ' + fmt(d) + '?', [{ label: 'Every session (' + r0.day + 's)', cls: 'red', val: 'all' }, { label: 'Just ' + fmt(d), val: 'this' }]);
      if (!scope) return;
    }
    var f = null, lessonDraft = clone(r0.lesson || null), lessonChanged = false;
    function base() { var r = loadTT().find(function (x) { return x.id === rid; }) || r0, ex = (r.ex || {})[d] || {}; return { r: r, ex: ex, s: res(r, ex, d) }; }
    function draw() {
      var b = base(), s = scope === 'this' ? b.s : res(b.r, null, d);
      if (!f) f = { name: s.name, start: s.start, end: s.end, room: s.room, coaches: s.coaches.slice(), status: b.ex.status === 'removed' ? '' : (b.ex.status || ''), note: b.ex.note || '' };
      var lock = !admin;
      modal('ttEditModal', fmt(d) + ' · ' + f.start + ' · Room ' + f.room);
      $('ttEditModalB').innerHTML = (recurring ? '<div class="ttScope"><span class="ttLbl">Apply to</span><div class="ttSeg"><button type="button" data-sc="all" class="' + (scope === 'all' ? 'on' : '') + '">Every ' + esc(b.r.day) + '</button><button type="button" data-sc="this" class="' + (scope === 'this' ? 'on' : '') + '">Just ' + esc(fmt(d)) + '</button></div>'
        + '<label class="ttAsk"><input type="checkbox" id="eAsk" ' + (getPref() === 'ask' ? 'checked' : '') + '> Ask me each time I open a session</label></div>' : '<div class="ttNote">One-off lesson — changes apply to this date.</div>')
        + '<div class="ttFormGrid"><div class="ttField"><label>Session</label><input id="eName" value="' + esc(f.name) + '" ' + (lock ? 'disabled' : '') + '></div>'
        + '<div class="ttField"><label>Room</label><select id="eRoom" ' + (lock ? 'disabled' : '') + '><option ' + (f.room === 1 ? 'selected' : '') + '>1</option><option ' + (f.room === 2 ? 'selected' : '') + '>2</option></select></div>'
        + '<div class="ttField"><label>Start</label><input id="eStart" type="time" value="' + esc(f.start) + '" ' + (lock ? 'disabled' : '') + '></div><div class="ttField"><label>End</label><input id="eEnd" type="time" value="' + esc(f.end) + '" ' + (lock ? 'disabled' : '') + '></div></div>'
        + '<div class="eyebrow" style="margin:14px 0 7px">Coaches (2) — ' + (recurring ? (scope === 'all' ? 'every ' + esc(b.r.day) : 'only ' + esc(fmt(d))) : 'this lesson') + '</div>' + coachGrid(f.coaches, lock)
        + '<div class="ttStatus"><span class="ttLbl">Status for ' + esc(fmt(d)) + '</span><select id="eStatus" ' + (lock ? 'disabled' : '') + '><option value="">Running as normal</option><option value="cancelled" ' + (f.status === 'cancelled' ? 'selected' : '') + '>Cancelled</option><option value="postponed" ' + (f.status === 'postponed' ? 'selected' : '') + '>Postponed</option></select><input id="eNote" placeholder="Note for coaches (e.g. moved to Thursday)" value="' + esc(f.note) + '" ' + (lock ? 'disabled' : '') + '></div>'
        + '<div class="ttLessonBox"><div class="eyebrow">Lesson plan</div><strong>' + esc((lessonDraft && lessonDraft.name) || 'No lesson saved for this session yet') + '</strong><div style="color:var(--muted);font-size:.78rem;margin:4px 0 9px">Allocated coaches can prepare or update this without the admin code.</div><div class="ttBtns"><button class="btn small" id="eUse">Use current planner lesson</button><button class="btn small" id="eOpen">Open in planner</button><button class="btn small" id="eCopy">Copy to another session</button></div></div>';
      var body = $('ttEditModalB'); wireGrid(body, lock);
      body.querySelectorAll('[data-sc]').forEach(function (x) { x.onclick = function () { grab(); scope = x.dataset.sc; f = null; draw(); }; });
      if ($('eAsk')) $('eAsk').onchange = function () { try { localStorage.setItem(SCOPEK, this.checked ? 'ask' : 'all'); } catch (e) {} };
      $('eUse').onclick = function () { lessonDraft = clone(state.lesson); lessonChanged = true; $('eUse').textContent = 'Current lesson attached ✓'; };
      $('eOpen').onclick = function () { if (lessonDraft) { state.lesson = clone(lessonDraft); persist(); renderPlanner(); } closeModal('ttEditModal'); closeModal('ttDayModal'); showView('planner'); };
      $('eCopy').onclick = function () { copyTo(rid, lessonDraft || b.r.lesson); };
      $('ttEditModalF').innerHTML = '<button class="btn red" id="eSave">Save</button>';
      $('eSave').onclick = save;
      openModal('ttEditModal');
    }
    function grab() { if (!$('eName')) return; f.name = $('eName').value; f.room = +$('eRoom').value; f.start = $('eStart').value; f.end = $('eEnd').value; f.coaches = picked($('ttEditModalB')); f.status = $('eStatus').value; f.note = $('eNote').value.trim(); }
    function save() {
      grab(); var data = loadTT(), r = data.find(function (x) { return x.id === rid; }); if (!r) return;
      if (admin) {
        if (f.coaches.length !== 2) { say('Pick exactly two coaches'); return; } if (!f.start || !f.end || f.end <= f.start) { say('Check the start and end times'); return; }
        var nm = f.name.trim() || 'Kickboxing';
        r.ex = r.ex || {}; var e = r.ex[d] = r.ex[d] || {};
        if (r.date || scope === 'all') {
          r.name = nm; r.start = f.start; r.end = f.end; r.room = f.room; r.coaches = f.coaches;
          ['name', 'start', 'end', 'room', 'coaches'].forEach(function (k) { delete e[k]; });
        } else {
          var set = function (k, v, bv) { if (JSON.stringify(v) === JSON.stringify(bv)) delete e[k]; else e[k] = v; };
          set('name', nm, r.name); set('start', f.start, r.start); set('end', f.end, r.end); set('room', f.room, r.room); set('coaches', f.coaches, r.coaches);
        }
        if (f.status) { e.status = f.status; if (f.note) e.note = f.note; else delete e.note; } else if (e.status !== 'removed') { delete e.status; delete e.note; }
        if (!Object.keys(e).length) delete r.ex[d];
      }
      if (lessonChanged) r.lesson = clone(lessonDraft);
      saveTT(data); closeModal('ttEditModal'); say('Saved ✓'); afterChange();
    }
    draw();
  }
  function copyTo(rid, lesson) {
    if (!lesson) { say('Attach or prepare a lesson for this session first.'); return; }
    var data = loadTT(), others = data.filter(function (x) { return x.id !== rid; }); if (!others.length) return;
    var n = parseInt(prompt('Copy this lesson to which session?\n\n' + others.map(function (x, i) { return (i + 1) + '. ' + (x.date ? fmt(x.date) : x.day) + ' ' + x.start + ' · Room ' + x.room + ' · ' + x.name; }).join('\n')), 10) - 1;
    if (!others[n]) return; others[n].lesson = clone(lesson); saveTT(data); say('Lesson copied ✓');
  }

  /* ---------- move / postpone ---------- */
  function openMove(rid, d) {
    var data = loadTT(), r = data.find(function (x) { return x.id === rid; }); if (!r) return; var s = res(r, (r.ex || {})[d], d);
    modal('ttMoveModal', 'Move ' + s.name);
    $('ttMoveModalB').innerHTML = '<p style="margin:0 0 10px;color:var(--muted)">Now: ' + esc(fmt(d)) + ' · ' + esc(s.start) + ' – ' + esc(s.end) + '</p><div class="ttFormGrid"><div class="ttField"><label>New date</label><input id="mDate" type="date" value="' + d + '"></div><div class="ttField"><label>Start</label><input id="mStart" type="time" value="' + esc(s.start) + '"></div><div class="ttField"><label>End</label><input id="mEnd" type="time" value="' + esc(s.end) + '"></div>'
      + (r.date ? '' : '<div class="ttField"><label>Apply to</label><select id="mScope"><option value="this">Just ' + esc(fmt(d)) + ' (marks it postponed)</option><option value="all">Every ' + esc(r.day) + ' from now on</option></select></div>') + '</div>';
    $('ttMoveModalF').innerHTML = '<button class="btn red" id="mSave">Move</button>';
    $('mSave').onclick = function () {
      if (!needAdmin('Moving a lesson')) return;
      var nd = $('mDate').value, st = $('mStart').value, en = $('mEnd').value; if (!nd || !st || !en || en <= st) { say('Check the date and times'); return; }
      var data2 = loadTT(), rr = data2.find(function (x) { return x.id === rid; }); if (!rr) return;
      var sc = $('mScope') ? $('mScope').value : 'one';
      if (rr.date) { rr.date = nd; rr.day = weekday(nd); rr.start = st; rr.end = en; if (rr.ex) { delete rr.ex[d]; } }
      else if (sc === 'all') { rr.day = weekday(nd); rr.start = st; rr.end = en; rr.ex = {}; }
      else {
        rr.ex = rr.ex || {}; rr.ex[d] = Object.assign(rr.ex[d] || {}, { status: 'postponed', note: 'Moved to ' + fmt(nd) + ' ' + st });
        data2.push({ id: 'x' + uid(), date: nd, day: weekday(nd), name: s.name, start: st, end: en, room: s.room, coaches: s.coaches.slice(), lesson: rr.lesson ? clone(rr.lesson) : null });
      }
      saveTT(data2); closeModal('ttMoveModal'); say('Moved to ' + fmt(nd)); afterChange();
    };
    openModal('ttMoveModal');
  }

  /* ---------- Who's down tonight ---------- */
  function renderWidget() {
    var host = $('whoWidget'), m = me();
    if (!host) { var nx = document.querySelector('.nextCardHome'); if (!nx) return; host = document.createElement('button'); host.type = 'button'; host.id = 'whoWidget'; host.className = 'whoWidget'; nx.after(host); host.onclick = openCk; }
    if (!m) { host.style.display = 'none'; return; } host.style.display = '';
    var list = sessionsOn(today()), ids = [];
    list.forEach(function (s) { if (!dead(s)) who(s.date, s.rid).forEach(function (c) { if (ids.indexOf(c) < 0) ids.push(c); }); });
    var sub = !list.length ? 'No session today' : ids.length ? ids.length + ' checked in' : 'Nobody yet — tap to check in';
    host.innerHTML = '<div class="whoTxt"><div class="eyebrow">Who\'s down tonight</div><small>' + esc(sub) + '</small></div><div class="whoAvs">' + ids.slice(0, 7).map(function (i) { return av(i, 'sm'); }).join('') + (ids.length > 7 ? '<span class="whoMore">+' + (ids.length - 7) + '</span>' : '') + '</div><span class="whoGo">›</span>';
  }
  function openCk() {
    var d = today(), list = sessionsOn(d); modal('ckModal', 'Who\'s down tonight · ' + fmt(d));
    $('ckModalB').innerHTML = list.length ? list.map(function (s) {
      var inn = who(d, s.rid), mine = me() && inn.indexOf(me().id) > -1;
      return '<button class="ckBlock ' + (dead(s) ? 'dead' : '') + (mine ? ' mine' : '') + '" data-r="' + esc(s.rid) + '"><div class="ttSessHead"><div><strong>' + esc(s.name) + '</strong><small>' + esc(s.start) + ' – ' + esc(s.end) + ' · Room ' + s.room + '</small></div><span class="ttTag ' + (dead(s) ? s.status : canCheck(s) ? 'open' : 'closed') + '">' + (dead(s) ? (s.status === 'cancelled' ? 'Cancelled' : 'Postponed') : canCheck(s) ? 'Check-in open' : 'Closed') + '</span></div>'
        + '<div class="ttWho"><span class="ttLbl">Teaching</span>' + avs(s.coaches, 'sm') + '</div><div class="ttWho"><span class="ttLbl">In</span>' + (inn.length ? avs(inn, 'sm') : '<small>Nobody yet</small>') + '</div></button>';
    }).join('') : '<p style="color:var(--muted)">No sessions are scheduled for today.</p>';
    $('ckModalF').innerHTML = '';
    $('ckModalB').querySelectorAll('[data-r]').forEach(function (b) { b.onclick = function () { openCkSess(b.dataset.r); }; });
    openModal('ckModal');
  }
  function openCkSess(rid) {
    var d = today(), s = sessionsOn(d).find(function (x) { return x.rid === rid; }); if (!s) return;
    var inn = who(d, rid), m = me(), mine = m && inn.indexOf(m.id) > -1, can = canCheck(s);
    modal('ckSess', s.name + ' · ' + s.start, 1500);
    $('ckSessB').innerHTML = '<div class="ttSessHead"><div><strong>' + esc(s.name) + '</strong><small>' + esc(s.start) + ' – ' + esc(s.end) + ' · Room ' + s.room + '</small></div></div>'
      + '<label class="ckToggle ' + (can || mine ? '' : 'off') + '"><span><b>Attending</b><small>' + (dead(s) ? 'This session is ' + s.status : can ? 'Closes at ' + esc(s.start) + ' today' : 'Check-in closed (it\'s past ' + esc(s.start) + ')') + '</small></span><input type="checkbox" id="ckIn" ' + (mine ? 'checked' : '') + ' ' + (can ? '' : 'disabled') + '><i class="sw"></i></label>'
      + '<div class="eyebrow" style="margin:14px 0 8px">Attending (' + inn.length + ')</div>' + (inn.length ? '<div class="ckList">' + inn.map(function (i) { return '<div class="ckPerson">' + av(i, 'md') + '<b>' + esc((coach(i) || {}).name) + '</b>' + (s.coaches.indexOf(i) > -1 ? '<small>teaching</small>' : '') + '</div>'; }).join('') + '</div>' : '<p style="color:var(--muted);margin:0">Nobody yet.</p>')
      + '<div class="eyebrow" style="margin:14px 0 8px">Teaching</div><div class="ckList">' + s.coaches.map(function (i) { return '<div class="ckPerson">' + av(i, 'md') + '<b>' + esc((coach(i) || {}).name) + '</b></div>'; }).join('') + '</div>';
    $('ckSessF').innerHTML = '';
    var cb = $('ckIn'); if (cb) cb.onchange = function () { setIn(s, cb.checked); };
    openModal('ckSess');
  }
  var rendering = false;
  function refresh() {
    renderWidget();
    if (rendering) return; rendering = true;
    try {
      var cs = $('ckSess'); if (cs && cs.classList.contains('show') && $('ckSessT')) { var rid = (sessionsOn(today()).find(function (x) { return $('ckSessT').textContent.indexOf(x.name) === 0; }) || {}).rid; if (rid) openCkSess(rid); }
      if (showing('ckModal')) openCk();
      if (showing('ttDayModal') && dayCur) openDay(dayCur);
      if (typeof currentView !== 'undefined' && currentView === 'timetable') renderTT();
    } finally { rendering = false; }
  }
  window.FKCheck = { refresh: refresh, open: openCk };

  /* ---------- styles ---------- */
  var css = '.ttToolbar{display:flex;gap:8px;flex-wrap:wrap;justify-content:space-between;align-items:center;margin:0 0 12px}.ttWeekNav,.ttActs{display:flex;gap:6px;align-items:center;flex-wrap:wrap}.ttWeekNav b{min-width:96px;text-align:center;font-size:.85rem}'
    + '.ttDay{cursor:pointer;position:relative}.ttDay.today{outline:2px solid var(--red3);outline-offset:-2px}.ttDay.past{opacity:.55}.ttNone{color:var(--muted);font-size:.72rem;padding:6px 0}.ttOpen{margin-top:6px;font-size:.7rem;color:var(--muted);letter-spacing:.04em}'
    + '.ttMini.dead{opacity:.6}.ttMini.dead strong{text-decoration:line-through}.ttTag{display:inline-block;margin-left:5px;padding:2px 7px;border-radius:99px;font:800 .62rem system-ui;letter-spacing:.06em;text-transform:uppercase;background:#243044;color:#cfe}.ttTag.one{background:#5b3ba8;color:#fff}.ttTag.cancelled{background:#b3162d;color:#fff}.ttTag.postponed{background:#b86a00;color:#fff}.ttTag.open{background:#12803d;color:#fff}.ttTag.closed{background:#39445a;color:#aab}'
    + '.av{width:30px;height:30px;border-radius:50%;object-fit:cover;object-position:center 8%;background:#0d131b;border:2px solid #1b2433;flex:none}.av.sm{width:26px;height:26px;margin-left:-6px;border-width:2px}.av.sm:first-child{margin-left:0}.av.md{width:44px;height:44px}.av.classCoachAvatar{border-radius:8px}'
    + '.ttIn{display:flex;align-items:center;gap:6px;margin-top:6px;font-size:.68rem;color:#6fe39a}.ttIn span{font-weight:800}'
    + '.ttSess{border:1px solid var(--line);border-left:5px solid var(--red3);border-radius:14px;padding:11px 12px;margin:0 0 10px;background:rgba(255,255,255,.03)}.ttSess.dead{opacity:.7}.ttSessHead{display:flex;justify-content:space-between;gap:10px;align-items:flex-start}.ttSessHead strong{display:block}.ttSessHead small{color:var(--muted)}'
    + '.ttWho{display:flex;align-items:center;gap:6px;margin-top:8px;flex-wrap:wrap}.ttLbl{font:800 .62rem system-ui;letter-spacing:.12em;text-transform:uppercase;color:var(--muted);min-width:56px}.ttNote{margin-top:8px;font-size:.8rem;color:#ffc069}.ttBtns{display:flex;gap:6px;flex-wrap:wrap;margin-top:10px}.btn.danger{color:#ff7a8a}'
    + '.ttUp{margin-top:14px}.ttUpRow{display:flex;gap:8px;align-items:center;flex-wrap:wrap;width:100%;text-align:left;border:1px solid var(--line);background:rgba(255,255,255,.03);color:inherit;border-radius:12px;padding:9px 11px;margin-top:7px;font:inherit}.ttUpRow em{color:var(--muted);font-size:.78rem;flex-basis:100%}'
    + '.ttScope{display:flex;flex-direction:column;gap:8px;margin-bottom:12px}.ttSeg{display:flex;border:1px solid var(--line);border-radius:12px;overflow:hidden}.ttSeg button{flex:1;padding:10px 6px;background:transparent;border:0;color:inherit;font:800 .8rem system-ui}.ttSeg button.on{background:var(--red3);color:#fff}.ttAsk{font-size:.8rem;color:var(--muted);display:flex;gap:7px;align-items:center}'
    + '.ttStatus{display:grid;gap:7px;margin-top:14px}.ttStatus select,.ttStatus input,.ttField input,.ttField select{width:100%;box-sizing:border-box}.ttLessonBox{margin-top:14px;border:1px solid var(--line);border-radius:16px;padding:12px;background:var(--panel2)}.ttWide{width:100%;margin-top:8px}'
    + '.ttM .modalFoot{display:flex;gap:8px;flex-wrap:wrap}.ttM .modalFoot .btn{flex:1}.ttM{z-index:1300}'
    + '.whoWidget{display:flex;align-items:center;gap:12px;width:100%;margin-top:10px;padding:12px 14px;border-radius:20px;border:1px solid var(--rim,rgba(255,255,255,.1));background:linear-gradient(180deg,rgba(24,31,43,.74),rgba(11,15,22,.78));color:inherit;font:inherit;text-align:left;cursor:pointer}.whoTxt{flex:1;min-width:0}.whoTxt small{color:var(--muted)}.whoAvs{display:flex;align-items:center;padding-left:6px}.whoMore{margin-left:4px;font:800 .72rem system-ui;color:var(--muted)}.whoGo{color:var(--muted);font-size:1.4rem}'
    + '.ckBlock{display:block;width:100%;text-align:left;border:1px solid var(--line);border-radius:16px;padding:12px;margin:0 0 10px;background:rgba(255,255,255,.04);color:inherit;font:inherit;cursor:pointer}.ckBlock.mine{border-color:#12803d;box-shadow:inset 0 0 0 1px #12803d}.ckBlock.dead{opacity:.6}'
    + '.ckToggle{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-top:14px;padding:14px;border-radius:16px;border:1px solid var(--line);background:rgba(255,255,255,.04);cursor:pointer}.ckToggle.off{opacity:.55;cursor:not-allowed}.ckToggle small{display:block;color:var(--muted)}.ckToggle input{position:absolute;opacity:0}.ckToggle .sw{width:54px;height:30px;border-radius:99px;background:#39445a;position:relative;flex:none;transition:.2s}.ckToggle .sw:after{content:"";position:absolute;top:3px;left:3px;width:24px;height:24px;border-radius:50%;background:#fff;transition:.2s}.ckToggle input:checked~.sw{background:#12a150}.ckToggle input:checked~.sw:after{left:27px}'
    + '.ckList{display:flex;gap:10px;flex-wrap:wrap}.ckPerson{display:flex;align-items:center;gap:8px;padding:6px 10px 6px 6px;border-radius:99px;background:rgba(255,255,255,.05)}.ckPerson small{color:var(--muted)}'
    + '@media(max-width:560px){.ttToolbar{flex-direction:column;align-items:stretch}.ttCoachBtn img{height:72px}}';
  var st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);

  /* ---------- wire up ---------- */
  var oldHome = window.renderHome;
  if (typeof oldHome === 'function') window.renderHome = function () { oldHome.apply(this, arguments); renderWidget(); };
  document.addEventListener('visibilitychange', function () { if (document.visibilityState === 'visible') refresh(); });
  setInterval(function () { renderWidget(); }, 30000);
  setTimeout(function () { try { renderHome(); } catch (e) {} renderWidget(); if (typeof currentView !== 'undefined' && currentView === 'timetable') renderTT(); }, 50);
  window.addEventListener('storage', function (e) { if (e.key === KCK) refresh(); });
})();
