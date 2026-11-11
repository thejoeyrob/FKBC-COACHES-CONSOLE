/* FKBC Coaches Console — sound engine
 *
 * WHY THIS EXISTS
 * The old build played the bell with `new Audio(...)` (an HTMLMediaElement). On iPad / iPhone Safari
 * a media element claims the "playback" audio session, which PAUSES Spotify and everything else.
 *
 * This engine never creates an <audio> / <video> element. All sounds are decoded once into
 * Web Audio buffers and played through an AudioContext, and the page asks the browser for the
 * "ambient" audio session (navigator.audioSession) so the bell is MIXED OVER the music instead of
 * replacing it.
 *
 * Optional "Bell priority" mode switches the session to "transient" just for the length of the bell
 * (music dips / pauses for a moment, then the other app resumes) for devices where mixing is too quiet.
 */
(function () {
  'use strict';
  var FILES = {
    bell: 'assets/sounds/bell.wav',
    bleep: 'assets/sounds/bleep.wav',
    klaxon: 'assets/sounds/klaxon.wav'
  };
  var ctx = null, master = null, limiter = null;
  var buffers = {}, loading = {}, unlocked = false, playing = 0;

  function settings() { try { return state.settings || {}; } catch (e) { return {}; } }
  function mixMode() { return settings().mixMode === 'priority' ? 'priority' : 'mix'; }
  function volume() { var v = Number(settings().volume); return isFinite(v) ? Math.max(0, Math.min(100, v)) / 100 : 1; }

  /* Audio-session type: 'ambient' = mix with other apps (Spotify keeps playing). */
  function session(type) {
    try { if (navigator.audioSession && navigator.audioSession.type !== type) navigator.audioSession.type = type; } catch (e) {}
  }
  session('ambient');

  function ensure() {
    if (ctx) return ctx;
    var AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    try { ctx = new AC({ latencyHint: 'interactive' }); } catch (e) { try { ctx = new AC(); } catch (e2) { return null; } }
    master = ctx.createGain();
    master.gain.value = volume();
    try {
      limiter = ctx.createDynamicsCompressor();
      limiter.threshold.value = -4; limiter.knee.value = 6; limiter.ratio.value = 12;
      limiter.attack.value = 0.002; limiter.release.value = 0.12;
      master.connect(limiter); limiter.connect(ctx.destination);
    } catch (e) { master.connect(ctx.destination); }
    ctx.onstatechange = function () { /* iOS may move to "interrupted"; we resume on the next sound / tap */ };
    return ctx;
  }

  function resume() {
    var c = ensure();
    if (!c) return Promise.resolve(false);
    if (c.state === 'running') return Promise.resolve(true);
    var p;
    try { p = c.resume(); } catch (e) { return Promise.resolve(false); }
    // never wait forever (iOS can leave resume() pending outside a gesture)
    return Promise.race([
      Promise.resolve(p).then(function () { return c.state === 'running'; }, function () { return false; }),
      new Promise(function (r) { setTimeout(function () { r(c.state === 'running'); }, 450); })
    ]);
  }

  function decode(arr) {
    return new Promise(function (ok, bad) {
      try {
        var r = ctx.decodeAudioData(arr, ok, bad);
        if (r && r.then) r.then(ok, bad);
      } catch (e) { bad(e); }
    });
  }

  function load(name) {
    if (buffers[name]) return Promise.resolve(buffers[name]);
    if (loading[name]) return loading[name];
    if (!ensure()) return Promise.resolve(null);
    loading[name] = fetch(FILES[name], { cache: 'force-cache' })
      .then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.arrayBuffer(); })
      .then(decode)
      .then(function (b) { buffers[name] = b; return b; })
      .catch(function () { loading[name] = null; return null; });
    return loading[name];
  }

  /* Emergency fallback if a file cannot be loaded: a synthesised bell / klaxon. */
  function synth(name, t0) {
    var c = ctx, out = master, i, k;
    function tone(freq, type, start, dur, gain) {
      var o = c.createOscillator(), g = c.createGain();
      o.type = type; o.frequency.value = freq;
      g.gain.setValueAtTime(0.0001, start);
      g.gain.exponentialRampToValueAtTime(gain, start + 0.006);
      g.gain.exponentialRampToValueAtTime(0.0001, start + dur);
      o.connect(g); g.connect(out); o.start(start); o.stop(start + dur + 0.05);
    }
    if (name === 'klaxon') {
      for (i = 0; i < 2; i++) { tone(360, 'sawtooth', t0 + i * 0.85, 0.7, 0.5); tone(362, 'square', t0 + i * 0.85, 0.7, 0.25); }
      return 1.8;
    }
    if (name === 'bleep') { tone(900, 'sine', t0, 0.2, 0.7); return 0.3; }
    var partials = [[1, 0.9], [2.76, 0.6], [5.4, 0.4], [8.93, 0.25]];
    for (i = 0; i < 3; i++) for (k = 0; k < partials.length; k++) tone(520 * partials[k][0], 'sine', t0 + i * 0.6, 1.1 / (1 + k * 0.5), 0.45 * partials[k][1]);
    return 2.4;
  }

  /* Play a named sound. Safe to call at any time; never throws. */
  function play(name) {
    try {
      if (!settings().sound) return Promise.resolve(false);
      var c = ensure();
      if (!c) return Promise.resolve(false);
      master.gain.value = volume();
      session('ambient');
      var go = function () {
        var buf = buffers[name];
        var t0 = c.currentTime + 0.03;
        if (mixMode() === 'priority') session('transient');
        playing++;
        var dur;
        if (buf) {
          var src = c.createBufferSource();
          src.buffer = buf; src.connect(master); src.start(t0);
          dur = buf.duration;
        } else {
          dur = synth(name, t0);
        }
        setTimeout(function () { playing = Math.max(0, playing - 1); if (!playing) session('ambient'); }, Math.ceil((dur + 0.25) * 1000));
        return true;
      };
      // start resume() synchronously so it counts as part of the user's tap
      var r = resume();
      if (buffers[name]) return r.then(go, go);
      return Promise.all([r, load(name)]).then(go, go);
    } catch (e) { return Promise.resolve(false); }
  }

  /* Call from any user gesture. Unlocks audio on iOS and pre-loads the sounds. */
  function unlock() {
    var c = ensure();
    if (!c) return;
    resume().then(function () {
      if (!unlocked && c.state === 'running') {
        try { var s = c.createBufferSource(); s.buffer = c.createBuffer(1, 1, 22050); s.connect(c.destination); s.start(0); } catch (e) {}
        unlocked = true;
      }
    });
    load('bell'); load('klaxon'); load('bleep');
  }

  ['pointerdown', 'touchend', 'click', 'keydown'].forEach(function (ev) {
    document.addEventListener(ev, function () { unlock(); }, { capture: true, passive: true });
  });
  document.addEventListener('visibilitychange', function () {
    if (document.visibilityState === 'visible') { session('ambient'); if (ctx) resume(); }
  });
  window.addEventListener('pageshow', function () { if (ctx) resume(); });

  window.Sfx = {
    play: play, unlock: unlock, resume: resume,
    bell: function () { return play(settings().soundType === 'bleep' ? 'bleep' : 'bell'); },
    klaxon: function () { return play('klaxon'); },
    setVolume: function () { if (master) master.gain.value = volume(); },
    status: function () { return { state: ctx ? ctx.state : 'none', loaded: Object.keys(buffers), session: (navigator.audioSession || {}).type || 'unsupported' }; }
  };
})();
