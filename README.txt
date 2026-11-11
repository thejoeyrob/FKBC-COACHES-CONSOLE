FKBC COACHES CONSOLE v32

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
