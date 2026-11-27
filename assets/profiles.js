/* Coach profiles: name, belt / grade, qualifications and a short bio. Each coach edits their own card (admins can edit anyone's).
 * Saved on the device straight away and synced to the club's shared database when online. */
(function () {
  'use strict';
  var K = 'fkbc_profiles', $ = function (id) { return document.getElementById(id); };
  var get = function () { try { return JSON.parse(localStorage.getItem(K)) || {}; } catch (e) { return {}; } };
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
  var me = function () { return window.FKHooks && FKHooks.me && FKHooks.me(); };
  var canEdit = function (id) { var m = me(); return !!m && (m.id === id || (FKHooks.isAdmin && FKHooks.isAdmin())); };
  var BELT_OPTS = ['', 'White', 'Red', 'Yellow', 'Orange', 'Green', 'Purple', 'Blue', 'Brown', 'Black', 'Black – 1st Dan', 'Black – 2nd Dan', 'Black – 3rd Dan', 'Black – 4th Dan', 'Black – 5th Dan'];
  function beltDot(name) { var b = (name || '').split(/[\s–-]/)[0]; var f = (typeof BELTS !== "undefined" ? BELTS : []).filter(function (x) { return x[0] === b; })[0]; return f ? '<i class="pfDot" style="background:' + f[1] + '"></i>' : ''; }
  function render() {
    var grid = $('profileGrid'); if (!grid || typeof COACHES === "undefined") return; var all = get();
    grid.innerHTML = COACHES.map(function (c) {
      var p = all[c.id] || {};
      return '<article class="profile pf"><img src="' + esc(c.portrait) + '" alt="' + esc(c.name) + '"><strong>' + esc(c.name) + '</strong>' +
        '<div class="pfRow pfBelt">' + (p.belt ? beltDot(p.belt) + '<span>' + esc(p.belt) + '</span>' : '<span class="pfEmpty">Belt / grade not added</span>') + '</div>' +
        '<div class="pfRow pfQual">' + (p.quals ? esc(p.quals) : '<span class="pfEmpty">Qualifications not added</span>') + '</div>' +
        (p.bio ? '<p class="pfBio">' + esc(p.bio) + '</p>' : '') +
        (canEdit(c.id) ? '<button type="button" class="btn small pfEdit" data-pf="' + esc(c.id) + '">' + (p.belt || p.quals || p.bio ? 'Edit details' : 'Add my details') + '</button>' : '') + '</article>';
    }).join('');
    grid.querySelectorAll('[data-pf]').forEach(function (b) { b.onclick = function () { openEdit(b.getAttribute('data-pf')); }; });
  }
  function ensureModal() {
    if ($('pfModal')) return;
    document.body.insertAdjacentHTML('beforeend', '<div id="pfModal" class="modal"><div class="modalBox"><div class="modalHead"><h3 id="pfTitle">My details</h3><button class="btn small" data-close="pfModal">Close</button></div>' +
      '<div class="modalBody pfForm"><label>Belt / grade<select id="pfBelt"></select></label><label>Qualifications<input id="pfQuals" maxlength="200" placeholder="e.g. First aid, DBS, Level 2 coach"></label>' +
      '<label>Short bio <small id="pfCount"></small><textarea id="pfBio" rows="3" maxlength="160" placeholder="A line or two about you (optional)"></textarea></label></div>' +
      '<div class="modalFoot"><button class="btn red" id="pfSave" style="flex:1">Save</button></div></div></div>');
    $('pfModal').addEventListener('click', function (e) { if (e.target === $('pfModal')) closeModal('pfModal'); });
    $('pfBelt').innerHTML = BELT_OPTS.map(function (o) { return '<option value="' + esc(o) + '">' + (o || 'Choose…') + '</option>'; }).join('');
    $('pfBio').addEventListener('input', function () { $('pfCount').textContent = $('pfBio').value.length + '/160'; });
  }
  var editing = null;
  function openEdit(id) {
    ensureModal(); editing = id; var p = get()[id] || {}, c = COACHES.filter(function (x) { return x.id === id; })[0];
    $('pfTitle').textContent = (c ? c.name : 'My') + ' — details';
    var sel = $('pfBelt'); if (p.belt && BELT_OPTS.indexOf(p.belt) < 0) sel.insertAdjacentHTML('beforeend', '<option value="' + esc(p.belt) + '">' + esc(p.belt) + '</option>');
    sel.value = p.belt || ''; $('pfQuals').value = p.quals || ''; $('pfBio').value = p.bio || ''; $('pfCount').textContent = ($('pfBio').value.length) + '/160';
    $('pfSave').onclick = async function () {
      var v = { belt: $('pfBelt').value, quals: $('pfQuals').value.trim().slice(0, 200), bio: $('pfBio').value.trim().slice(0, 160) };
      closeModal('pfModal');
      if (window.Live && Live.saveProfile) await Live.saveProfile(editing, v); else { var m = get(); m[editing] = v; localStorage.setItem(K, JSON.stringify(m)); render(); }
    };
    openModal('pfModal');
  }
  window.FKProfiles = { refresh: render, open: openEdit };
  window.renderProfiles = render;
  var iv = setInterval(function () { if ($("profileGrid") && typeof COACHES !== "undefined") { render(); clearInterval(iv); } }, 200);
  var sv = window.showView; if (typeof sv === 'function') window.showView = function (n) { var r = sv.apply(this, arguments); if (n === 'coaches') try { render(); } catch (e) {} return r; };
})();
