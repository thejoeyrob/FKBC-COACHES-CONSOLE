FKBC COACHES CONSOLE v39

Access code and admin code: ask the club owner (they are no longer written in this repository).

FILES - upload/keep ALL of these together (GitHub Pages root):
  index.html, sw.js, manifest.webmanifest, assets/ (sfx.js, sounds/, coaches/, img/)
Open the hosted https address once online, then "Add to Home Screen". Do not open index.html from the Files app.

WHAT CHANGED IN v32
- Bell/klaxon rebuilt on Web Audio (assets/sfx.js). The old build used <audio>-style playback,
  which makes iPad/iPhone Safari pause Spotify. The new engine never creates an audio element and asks
  the browser for the "ambient" audio session so the bell mixes OVER your music.
- Settings > Timer & Class: Music mode (Mix / Bell priority), Bell volume, Test Bell / Test Klaxon buttons.
  If the bell is too quiet over loud music: raise Bell volume, or pick "Bell priority" (music dips/pauses
  for a moment then resumes - behaviour depends on Spotify).
- One bell per round change (previously two overlapped), klaxon at 10 seconds left on phases longer than 12s.
- Coach artwork was corrupt inside the old 12 MB index.html; replaced with clean files in assets/coaches.
  App is now ~100 KB + assets, loads fast and works offline.
- Coach PNG slides on at the start of each block and slides off at the end. Phone timer buttons fixed,
  chat Send button no longer hidden behind the nav bar on phones.

BEFORE TEACHING: start Spotify, switch back to FKBC, Settings > tap Test Bell. Keep FKBC on screen
(the screen is kept awake during a lesson). Spotify mixing could not be tested on a physical iPad here.

v35 PLANNER (simplified sections)
- One row per section: Type + description + coach, then Time / Rounds / Pad swap.
- Time: a single block. Rounds: rounds, round length, rest. Pad swap (Technique, Pad Work, Partner Work):
  rounds each, demo (default 1:00), work (2:00), swap over (0:30) and "Swap after every round".
  Ticked: demo > A works > swap > B works per technique (1:00+2:00+0:30+2:00 = 5:30).
  Unticked: A does every round (new technique each), swap, then B does them all.
- Sparring / Fitness default to rounds + rest; Warm Up / Cool Down default to a single block.
- Optional technique list (one per line) shows on the timer each round. Brief = timed running order to copy/share.
- Timer: amber demo, red work, blue swap/rest, green break; coach slides in and out; klaxon at 10s on work only.

v36 LIBRARY + STYLES
- Lesson style (Kickboxing / Boxing / Muay Thai / Fitness) chosen when you start a new lesson or from the chips in the planner.
- Library tab: built-in drills and combinations per style and section type, plus a belt-by-belt kickboxing grading syllabus
  (a general traditional progression - edit it to match your club's requirements). Add your own items (one per line),
  remove or hide any item, Reset a list, Export / Import the library.
- Grading is a section type: pick the belt, tap Library, tick syllabus techniques; rounds are set to match and each
  technique appears on the timer (demo, work, swap).
- Every section has a Library button. Saving the same lesson again updates it; Copy makes a duplicate.
- Quick words now sit under the field you are typing in (never over the keyboard). Turn off in Settings.
- Settings > Backup & storage: export / restore everything.
- App is dark-only (light mode removed). Logo shows on every screen. Library, Saved Lessons and Settings are reachable on phones.

v37 LOOK + WORKFLOW
- Painted backgrounds from your FKBC art (gym interior, night-street panorama, arena) behind glass panels; line icons replace emoji.
- Timer: painted backdrop per phase; the Edit panel now opens above the timer (it was hidden behind it), with Pause & edit,
  Keep running, Jump to any round, End lesson. Section-coloured progress line along the bottom.
- New lesson is blank (style chosen first) and the previous lesson is saved automatically to Saved Lessons.
- Rounds follow the technique list (typing or picking techniques sets the rounds; untick to set rounds by hand).
- Proper belt icons; colour-coded sections and a lesson overview bar; belt icon shows on grading sections and on the timer.
- John and Eden artwork given the same bold outline as the other coaches. For a perfect match, regenerate those two in the same style as Joe/Jack/Paul.

v38 GRADING SHEETS
- White, Red and Yellow grading library now follow the club grading sheets: Stance, Arm techniques, Kicks, Defence,
  Combinations, Padwork, Sparring, each item tagged Junior / Senior / All, with the coach tips.
- Timer shows only the level and technique (left two columns of the sheet). Coach tips appear in the Library, the
  lesson plan and the team Brief, and are never shown on the timer.
- Picker: filter Everything / Junior / Senior and "Select all shown"; rounds follow the number selected.
- Left out because they are crossed out on the sheets: White "Slip", Red "Knee / Shin Block". White Junior sparring is "None".

v39 LIVE (Supabase)
- Chat, saved lessons, the timetable and library additions are now shared live between coaches (see supabase/README.md).
- Join once with the club access code (a green dot in the top bar shows you are live). Works offline and syncs when back online.
- The access/admin codes are checked on the server; the app no longer relies on a code stored in the page.

v40 - Library: choose which section (Technical / Fitness / Punches …) a new entry goes under, via a Section dropdown
(or "＋ New section…") in the library and in the lesson picker. Press and hold an item, then drag it up/down or into
another section. Order and moves sync live with the club library and are included in exports/backups.

v41 - Timetable: tap a day for the day plan (add / delete / move lessons, cancel or postpone, one-off dates for the future);
edits can apply to every session or just one (optionally ask each time); "Who's down tonight" coach check-in on the home
page (same day, up to the start time, shared live). Fixed the Close button on the lesson editor.

v42 - Preview: "Red & Black Bushido" theme built from the supplied art pack (assets/bushido/*, assets/bushido.css, assets/bushido.js).
Off by default. Turn on with  ?theme=bushido  (remembered) or Settings > Appearance; ?theme=classic switches back.

v43 - Bushido preview refinements: original heading font restored, calmer text sizes, darker content plates, textured home tiles.
All emoji / system glyph icons (previous, next, restart, pause, bell, gloves…) replaced with the app's own line icons, in both themes.

v44 - Home line-up shows all 8 coaches on phones (no sideways scroll); crisp high-res logo (from versions/consult-arcade) in both themes.
Bushido: single bottom navigation (top bar keeps live status + coach), red brush texture behind the timer.

v46 - Bushido home tiles: the supplied rim art (bronze edge + inner glow) overlays the red/black texture, which is clipped inside the rim.

v47 - Bushido: Kanit Italic (SIL OFL, bundled in assets/bushido/fonts) for headings, timer clock and button labels; sizes tuned to stay inside frames.

v48 - Bushido: stronger button frame (thicker bronze rim, bright edge, dark inner line) over the red/black texture.

v49 - New app icon: the supplied art as a clean square with the bronze rim (mobile/store/app-icon-source.png). Applied to PWA, iOS and Android assets via mobile/scripts/make-icons.py. Native splash screens now use the high-res logo.
