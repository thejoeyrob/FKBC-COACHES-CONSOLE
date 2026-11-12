FKBC COACHES CONSOLE v35

Access PIN: FKBC1      Admin timetable code: 2403 (not shown in the app)

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
