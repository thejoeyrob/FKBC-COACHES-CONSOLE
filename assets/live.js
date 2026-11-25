/* FKBC Coaches Console — live sync (Supabase)
 * Chat, saved lessons, the timetable and library additions are shared between every coach's device in real time.
 * The app still works fully offline: everything is cached on the device and syncs when a connection is back.
 *
 * Security: each device signs in anonymously, then proves the club code to the SERVER (claim_membership).
 * Only members can read/write anything (row-level security); see supabase/schema.sql. */
(function () {
  'use strict';
  var CFG = window.FKLIVE || {};
  var L = { enabled: false, status: 'off', member: false, coach: null, uid: null };
  window.Live = L;
  var noop = function () { return Promise.resolve({ ok: false }); };
  if (!CFG.url || !CFG.key || !window.supabase || !window.supabase.createClient) { L.start = L.join = L.claimAdmin = L.sendMessage = L.pushTimetable = L.syncNow = noop; return; }
  L.enabled = true;

  var KTT = 'fkbc_v31_timetable';
  var K = { synced: 'fkbc_live_synced', hidden: 'fkbc_live_hidden', lessonStamp: 'fkbc_live_lessonstamp', libStamp: 'fkbc_live_libstamp', lastLib: 'fkbc_live_lastlib', ttRows: 'fkbc_live_ttrows' };
  var jget = function (k, f) { try { var v = JSON.parse(localStorage.getItem(k)); return v === null || v === undefined ? f : v; } catch (e) { return f; } };
  var jset = function (k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} };
  var H = function () { return window.FKHooks || {}; };
  var chatOpen = function () { return typeof currentView !== 'undefined' && currentView === 'chat'; };
  var say = function (m) { try { if (typeof toast === 'function') toast(m); } catch (e) {} };

  var sb = window.supabase.createClient(CFG.url, CFG.key, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: false, storageKey: 'fkbc-live-auth' },
    realtime: { params: { eventsPerSecond: 8 } }
  });

  /* ---------- status pill ---------- */
  var pill = null;
  function buildPill() {
    var bar = document.getElementById('fkbcConsoleBar'); if (!bar || pill) return;
    pill = document.createElement('button'); pill.id = 'fkbcLivePill'; pill.type = 'button'; pill.className = 'livePill';
    var who = bar.querySelector('.consoleWho'); if (who) who.parentNode.insertBefore(pill, who); else bar.appendChild(pill);
    pill.onclick = function () {
      if (L.status === 'needcode') {
        var me = H().me && H().me(); if (!me) return;
        var code = prompt('Enter the club access code to go live (shared chat, lessons and timetable).');
        if (code) L.join(code, me.id).then(function (r) { say(r.ok ? 'You are live ✓' : r.error === 'too_many_attempts' ? 'Too many tries — wait a few minutes' : 'That code was not recognised'); });
      } else if (L.status === 'offline') { say('Reconnecting…'); L.start(true); }
      else if (L.status === 'live') say('Live — connected as ' + ((H().coachById && H().coachById(L.coach)) || {}).name);
    };
    setStatus(L.status);
  }
  function setStatus(s) {
    L.status = s; buildPill(); if (!pill) return;
    var txt = { live: 'Live', connecting: 'Connecting', offline: 'Offline', needcode: 'Go live', off: '' }[s] || s;
    pill.textContent = txt; pill.className = 'livePill ' + s; pill.style.display = txt ? '' : 'none';
    var st = document.getElementById('liveSettingsState'); if (st) st.textContent = { live: 'Live — connected', connecting: 'Connecting…', offline: 'Offline — will sync when back online', needcode: 'Not joined yet — tap "Go live" at the top', off: 'Off' }[s] || s;
  }

  /* ---------- session / membership ---------- */
  async function ensureSession() {
    var g = await sb.auth.getSession(); if (g.data && g.data.session) return g.data.session;
    var r = await sb.auth.signInAnonymously(); if (r.error) throw r.error; return r.data.session;
  }
  async function loadMember(uid) {
    var r = await sb.from('members').select('coach_id,admin_until').eq('user_id', uid).maybeSingle();
    if (r.error) throw r.error; return r.data;
  }
  L.start = async function (force) {
    if (L.starting) return; if (L.ready && !force) return; L.starting = true; setStatus('connecting');
    try {
      var s = await ensureSession(); L.uid = s.user.id;
      var m = await loadMember(L.uid);
      if (m) { L.member = true; L.coach = m.coach_id; await afterJoin(); } else setStatus('needcode');
    } catch (e) { setStatus('offline'); }
    finally { L.starting = false; }
  };
  L.join = async function (code, coach) {
    try {
      var s = await ensureSession(); L.uid = s.user.id;
      var r = await sb.rpc('claim_membership', { p_code: code, p_coach: coach });
      if (r.error) throw r.error;
      if (r.data && r.data.ok) { L.member = true; L.coach = coach; await afterJoin(); return { ok: true }; }
      setStatus('needcode'); return { ok: false, error: r.data && r.data.error };
    } catch (e) { setStatus('offline'); return { ok: false, error: 'network' }; }
  };
  L.claimAdmin = async function (code) {
    try { if (!L.member) return { ok: false }; var r = await sb.rpc('claim_admin', { p_code: code }); return r.data || { ok: false }; } catch (e) { return { ok: false }; }
  };

  /* ---------- chat ---------- */
  function roomObj(d, room) {
    if (!d.rooms[room]) {
      var parts = room.split(':'), mem = room === 'all' ? (window.COACHES || COACHES).map(function (c) { return c.id; }) : [parts[1], parts[2]];
      var me = H().me && H().me(), other = mem.find(function (x) { return !me || x !== me.id; });
      var oc = H().coachById && H().coachById(other);
      d.rooms[room] = { name: room === 'all' ? 'All Coaches' : (oc ? oc.name : room), members: mem, msgs: [] };
    }
    return d.rooms[room];
  }
  function mergeMsgs(rows) {
    var h = H(); if (!h.chatLoad) return false; var d = h.chatLoad(), changed = false;
    rows.forEach(function (row) {
      var r = roomObj(d, row.room), m = null;
      if (row.client_id) m = r.msgs.find(function (x) { return x.id === row.client_id; });
      if (!m) m = r.msgs.find(function (x) { return x.srv === row.id; });
      if (m) { if (!m.srv || m.pending) { m.srv = row.id; m.pending = false; m.ts = Date.parse(row.created_at); changed = true; } return; }
      r.msgs.push({ id: 'srv' + row.id, srv: row.id, from: row.coach_id, text: row.body, ts: Date.parse(row.created_at) }); changed = true;
    });
    if (changed) { Object.keys(d.rooms).forEach(function (k) { d.rooms[k].msgs.sort(function (a, b) { return a.ts - b.ts; }); }); h.chatSave(d); }
    return changed;
  }
  async function pullMessages() {
    var r = await sb.from('messages').select('id,room,coach_id,body,created_at,client_id').order('created_at', { ascending: false }).limit(500);
    if (r.error) throw r.error;
    if (mergeMsgs(r.data.slice().reverse()) && chatOpen()) H().renderChat();
  }
  L.sendMessage = async function (room, text, mid) {
    try {
      if (!L.member) return;
      var r = await sb.from('messages').insert({ room: room, body: text, client_id: mid }).select('id,created_at');
      if (r.error && r.error.code !== '23505') throw r.error;
      var d = H().chatLoad(), rr = d.rooms[room], m = rr && rr.msgs.find(function (x) { return x.id === mid; });
      if (m) { m.pending = false; if (r.data && r.data[0]) m.srv = r.data[0].id; H().chatSave(d); if (chatOpen()) H().renderChat(); }
    } catch (e) { setStatus('offline'); }
  };
  async function flushPending() {
    var h = H(); if (!h.chatLoad || !L.member) return; var d = h.chatLoad(), todo = [];
    Object.keys(d.rooms).forEach(function (k) { d.rooms[k].msgs.forEach(function (m) { if (m.pending && !m.srv) todo.push([k, m.text, m.id]); }); });
    for (var i = 0; i < todo.length; i++) await L.sendMessage(todo[i][0], todo[i][1], todo[i][2]);
  }
  var unread = 0;
  function markUnread() { unread++; var b = document.querySelector('#fkbcConsoleBar [data-mode="chat"]'); if (b) b.classList.add('hasNew'); }
  function clearUnread() { unread = 0; var b = document.querySelector('#fkbcConsoleBar [data-mode="chat"]'); if (b) b.classList.remove('hasNew'); }

  /* ---------- lessons ---------- */
  var synced = function () { return jget(K.synced, {}); }, hiddenIds = function () { return jget(K.hidden, []); };
  var rawPersist = window.persist;
  async function pullLessons(full) {
    var since = full ? null : jget(K.lessonStamp, null);
    var q = sb.from('lessons').select('id,owner_coach,name,style,duration,data,deleted,updated_at').order('updated_at', { ascending: true }).limit(1000);
    if (since) q = q.gt('updated_at', since);
    var r = await q; if (r.error) throw r.error; if (!r.data.length) return;
    var sy = synced(), hid = new Set(hiddenIds()), changed = false;
    r.data.forEach(function (row) {
      var idx = state.saved.findIndex(function (x) { return x.id === row.id; }), t = Date.parse(row.updated_at);
      if (row.deleted) { if (idx >= 0) { state.saved.splice(idx, 1); changed = true; } sy[row.id] = t; return; }
      if (hid.has(row.id)) return;
      var rec = idx >= 0 ? state.saved[idx] : null;
      if (rec && sy[row.id] !== undefined && rec.savedAt !== sy[row.id]) return;   // unsynced local edit wins until it is pushed
      if (rec && sy[row.id] === t) return;
      var data = row.data || {};
      var nr = { id: row.id, name: row.name, style: row.style || data.style, duration: row.duration || data.duration, lesson: data.lesson, savedAt: t, owner: row.owner_coach };
      if (idx >= 0) state.saved[idx] = nr; else state.saved.push(nr);
      sy[row.id] = t; changed = true;
    });
    state.saved.sort(function (a, b) { return (b.savedAt || 0) - (a.savedAt || 0); });
    jset(K.synced, sy); jset(K.lessonStamp, r.data[r.data.length - 1].updated_at);
    if (changed) { rawPersist(); var m = document.getElementById('savedModal'); if (m && m.classList.contains('show') && typeof renderSaved === 'function') renderSaved(); }
  }
  var pushing = false;
  async function pushRec(rec, sy) {
    var row = { name: rec.name || 'Lesson', style: rec.style || (rec.lesson && rec.lesson.style) || null, duration: Math.round(rec.duration || 0), data: { lesson: rec.lesson, name: rec.name, duration: rec.duration, style: rec.style } };
    async function insertNew() {
      var r = await sb.from('lessons').insert(Object.assign({ id: rec.id }, row)).select('updated_at');
      if (r.error || !r.data || !r.data.length) return false;
      var t = Date.parse(r.data[0].updated_at); rec.savedAt = t; sy[rec.id] = t; rawPersist(); return true;
    }
    if (sy[rec.id] !== undefined) {
      var u = await sb.from('lessons').update(Object.assign({ deleted: false }, row)).eq('id', rec.id).select('updated_at');
      if (u.error) return;
      if (u.data && u.data.length) { var t = Date.parse(u.data[0].updated_at); rec.savedAt = t; sy[rec.id] = t; rawPersist(); return; }
      // someone else's lesson: save my edit as my own copy
      var nid = (typeof uid === 'function' ? uid() : Math.random().toString(36).slice(2, 10));
      if (state.lesson && state.lesson.id === rec.id) state.lesson.id = nid;
      rec.id = nid; if (rec.lesson) rec.lesson.id = nid;
    }
    await insertNew();
  }
  async function syncLessons() {
    if (!L.member || pushing) return; pushing = true;
    try {
      var sy = synced();
      for (var i = 0; i < state.saved.length; i++) {
        var rec = state.saved[i]; if (!rec.id) continue;
        if (sy[rec.id] !== undefined && rec.savedAt === sy[rec.id]) continue;
        await pushRec(rec, sy);
      }
      var have = new Set(state.saved.map(function (x) { return x.id; })), ids = Object.keys(sy);
      for (var j = 0; j < ids.length; j++) {
        var id = ids[j]; if (have.has(id)) continue;
        var r = await sb.from('lessons').update({ deleted: true }).eq('id', id).select('id');
        if (r.error) continue;
        if (!r.data || !r.data.length) { var h = hiddenIds(); h.push(id); jset(K.hidden, h); }
        delete sy[id];
      }
      jset(K.synced, sy);
    } catch (e) { /* retried on the next change */ } finally { pushing = false; }
  }

  /* ---------- library additions ---------- */
  var libJSON = function () { return JSON.stringify({ libUser: state.libUser || {}, libHide: state.libHide || {} }); };
  var hasLocalLib = function () { return Object.keys(state.libUser || {}).length || Object.keys(state.libHide || {}).length; };
  function unionInto(a, b) { Object.keys(b || {}).forEach(function (k) { a[k] = Array.from(new Set((a[k] || []).concat(b[k]))); }); return a; }
  async function pullLibrary() {
    var r = await sb.from('club_library').select('data,updated_at').eq('id', 'main').maybeSingle();
    if (r.error) throw r.error; if (!r.data) return;
    var t = Date.parse(r.data.updated_at), stamp = jget(K.libStamp, 0), d = r.data.data || {};
    if (!d.libUser && !d.libHide) { if (hasLocalLib()) await pushLibrary(true); return; }
    if (!stamp) { state.libUser = unionInto(state.libUser || {}, d.libUser); state.libHide = unionInto(state.libHide || {}, d.libHide); rawPersist(); jset(K.libStamp, t); await pushLibrary(true); }
    else if (t > stamp) { state.libUser = d.libUser || {}; state.libHide = d.libHide || {}; rawPersist(); jset(K.libStamp, t); jset(K.lastLib, libJSON()); }
    else return;
    if (typeof currentView !== 'undefined' && currentView === 'library' && typeof renderLibrary === 'function') renderLibrary();
  }
  async function pushLibrary(force) {
    if (!L.member) return; var now = libJSON(); if (!force && now === jget(K.lastLib, '')) return;
    try {
      var r = await sb.from('club_library').upsert({ id: 'main', data: { libUser: state.libUser || {}, libHide: state.libHide || {} } }).select('updated_at');
      if (r.error || !r.data || !r.data.length) return; jset(K.libStamp, Date.parse(r.data[0].updated_at)); jset(K.lastLib, now);
    } catch (e) {}
  }

  /* ---------- timetable ---------- */
  async function pullTimetable() {
    var r = await sb.from('timetable').select('id,data,updated_at'); if (r.error) throw r.error; if (!r.data.length) return;
    var rows = r.data.map(function (x) { return x.data; }), last = {};
    rows.forEach(function (row) { last[row.id] = JSON.stringify(row); });
    try { localStorage.setItem(KTT, JSON.stringify(rows)); } catch (e) {}
    jset(K.ttRows, last);
    if (typeof currentView !== 'undefined' && currentView === 'timetable' && H().renderTimetable) H().renderTimetable();
  }
  L.pushTimetable = async function (arr) {
    if (!L.member) return;
    try {
      var last = jget(K.ttRows, {});
      for (var i = 0; i < arr.length; i++) {
        var row = arr[i], js = JSON.stringify(row); if (last[row.id] === js) continue;
        var r = await sb.from('timetable').update({ data: row }).eq('id', row.id).select('id');
        if (!r.error && (!r.data || !r.data.length)) r = await sb.from('timetable').insert({ id: row.id, data: row }).select('id');
        if (!r.error && r.data && r.data.length) last[row.id] = js;
      }
      jset(K.ttRows, last);
    } catch (e) {}
  };

  /* ---------- realtime ---------- */
  function subscribe() {
    try { if (L.channel) sb.removeChannel(L.channel); } catch (e) {}
    L.channel = sb.channel('fkbc-live')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, function (p) {
        var row = p.new; if (mergeMsgs([row])) { if (chatOpen()) H().renderChat(); else if (row.coach_id !== L.coach) markUnread(); }
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'lessons' }, function () { pullLessons().catch(function () {}); })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'timetable' }, function () { pullTimetable().catch(function () {}); })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'club_library' }, function () { pullLibrary().catch(function () {}); })
      .subscribe(function (st) {
        // instant push is a bonus: if it is blocked (some Wi-Fi blocks it) we keep working by checking every few seconds
        if (st === 'SUBSCRIBED') { L.rt = true; catchUp(); }   // anything sent before the live connection was up (or while it was down) is fetched now
        else if (st === 'CHANNEL_ERROR' || st === 'TIMED_OUT' || st === 'CLOSED') { L.rt = false; }
      });
  }
  async function catchUp() {
    var jobs = [pullMessages, pullLessons, pullTimetable, pullLibrary];
    for (var i = 0; i < jobs.length; i++) { try { await jobs[i](); } catch (e) {} }
    flushPending();
  }
  async function afterJoin() {
    setStatus('live');
    var jobs = [pullMessages, function () { return pullLessons(true); }, pullTimetable, pullLibrary];
    for (var i = 0; i < jobs.length; i++) { try { await jobs[i](); } catch (e) { /* one table failing must not stop the rest */ } }
    subscribe(); L.ready = true;
    flushPending(); syncLessons(); pushLibrary();
  }
  L.syncNow = async function () {
    if (!L.member) return L.start(true);
    try { await pullMessages(); await pullLessons(true); await pullTimetable(); await pullLibrary(); await flushPending(); await syncLessons(); await pushLibrary(); setStatus('live'); say('Synced ✓'); } catch (e) { setStatus('offline'); }
  };

  /* ---------- hooks into the app ---------- */
  var timer = null;
  function schedule() { clearTimeout(timer); timer = setTimeout(function () { syncLessons(); pushLibrary(); }, 1500); }
  window.persist = function () { rawPersist(); if (L.member) schedule(); };
  var oldShow = window.showView;
  window.showView = function (n) { oldShow(n); if (n === 'chat') clearUnread(); };
  window.addEventListener('online', function () { L.start(true); });
  document.addEventListener('visibilitychange', function () { if (document.visibilityState === 'visible' && L.member && L.ready) { pullMessages().catch(function () {}); pullLessons().catch(function () {}); } });
  var tick = 0;
  setInterval(function () {
    if (!(L.member && L.ready && document.visibilityState === 'visible')) return; tick++;
    var fast = chatOpen() && (!L.rt || tick % 3 === 0);   // chat open: every 5s without instant push, every 15s as a safety net with it
    if (fast || tick % 12 === 0) pullMessages().then(function () { if (L.status === 'offline') setStatus('live'); }).catch(function () { setStatus('offline'); });
    if (!L.rt && tick % 12 === 0) { pullLessons().catch(function () {}); pullTimetable().catch(function () {}); pullLibrary().catch(function () {}); }
  }, 5000);

  // Settings: live status + manual sync
  var grid = document.querySelector('#settingsView .settingsGrid');
  if (grid) {
    grid.insertAdjacentHTML('beforeend', '<div class="settingGroup" style="grid-column:1/-1"><h3>Live sync</h3><p style="color:var(--muted);margin-top:0">Chat, saved lessons, the timetable and library additions are shared live between coaches. Everything still works offline and syncs when you are back online.</p><div class="settingRow"><span>Status</span><b id="liveSettingsState">—</b></div><div class="planFooter"><button class="btn" id="liveSyncNow">Sync now</button></div></div>');
    document.getElementById('liveSyncNow').onclick = function () { L.syncNow(); };
  }
  buildPill(); setStatus('off');
  if (localStorage.getItem('fkbc_v31_access') === '1') setTimeout(function () { L.start(); }, 300);
})();
