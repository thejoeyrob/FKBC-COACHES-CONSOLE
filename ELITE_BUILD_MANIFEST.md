# FKBC COACHES CONSOLE - ELITE BUILD v1.0

**Status:** Production Ready  
**Release Date:** November 2026  
**Base Version:** v35 Console + v20 Pro Grading + Fight Arcade (Sideloaded)

## 🎯 Overview

The ELITE build combines the best features from all FKBC projects into one optimized, feature-rich coaches application:

- **Core Console:** Lesson planning, timing, coach assignment, team briefing
- **Grading Module:** Student skill scoring, progress tracking, performance analytics  
- **Advanced Planning:** Technique library, smart timing, complex round structures
- **Fight Game:** Sideloadable arcade fighter (optional, doesn't impact main app performance)
- **Performance:** Optimized bundle size (~150KB base + lazy-loaded assets), 60Hz timer, Spotify-friendly audio

## 📦 What's Included

### Primary Features (Always Loaded)
```
index.html (v35 + v20 Pro grading mode)
├── Lesson Planner (Smart timing, rounds, pad swaps)
├── Live Timer (Phases: Demo→Work→Swap→Break)
├── Coach Selection (8 coaches with portraits)
├── Grading Dashboard (Student scoring, skill tracking)
├── Team Briefing (Printable lesson summary)
├── History & Analytics (Session records, progress)
├── Settings (Audio mixing, visual themes, export/import)
└── Chat/Notes (Team communication)

assets/
├── sfx.js (Web Audio API - Spotify-safe bells)
├── sounds/ (bell.wav, klaxon.wav, bleep.wav)
├── coaches/ (8 portrait + full-body PNGs)
└── img/ (icons, backgrounds)

offline support/
├── sw.js (Service Worker - full offline capability)
└── manifest.webmanifest (PWA installation)
```

### Sideload Feature (Lazy-Loaded Module)
```
fight-game/ (optional, only loads when activated)
├── FKBC Fight Arcade (Phaser 3 + TypeScript build)
├── Modes:
│   ├── Arcade Fight (Joe vs AI, 3-round match)
│   ├── Training (Unlimited sparring with debugger)
│   └── Streets (Scrolling combat scenario)
├── Controls (Keyboard, Gamepad, Touch)
└── Responsive 1280×720 canvas (FIT scaling)
```

## 🚀 Launch Features

### Welcome Screen (New)
- Quick access to Planner, Timer, Grading, Settings
- "LAUNCH FIGHT ARCADE" button (sideload module)
- Recent sessions carousel
- Quick stats dashboard

### Grading Mode (from v20 Pro)
- Student roster management
- Skill categories (Stance, Footwork, Jab, Cross, Hooks, Kicks, Defense, Takedowns, etc.)
- Real-time scoring during session
- Performance tracking across multiple sessions
- Export grades as CSV/JSON
- Progress visualization (radar charts, trend lines)

### Advanced Planning (from Planner-1)
- Technique library (searchable, categorized)
- Flexible round timing (auto-calculates total duration)
- Pad swap configurations:
  - Demo + Work + Swap timing
  - Per-round or bulk swaps
  - Customizable transition times
- Warm-up/Cool-down templates
- Smart timing adjustments (fit-to-time)
- Reusable templates saved to device

### Timer Enhancements
- Phase colors: Amber (demo) → Red (work) → Blue (swap) → Green (break)
- Coach animations (slide in/out with phase)
- Klaxon warnings (10s before work phase ends on 12s+ phases)
- Spotify integration (ambient audio session for mixing)
- Bell volume control + test buttons
- Full-screen and phone-optimized layouts

### Fight Arcade Sideload
- Loads only when "LAUNCH FIGHT ARCADE" is tapped
- Runs in full-screen or modal
- Returns to console on completion
- Independent WebGL canvas (1280×720)
- 60 Hz fixed simulation loop
- Keyboard, Gamepad, Touch controls
- Training mode with frame-data display

## ⚙️ Technical Architecture

### Bundle Structure
```
index.html (~120KB)
├── Embedded CSS (~35KB)
├── Embedded HTML (~20KB)
├── Embedded JavaScript (~65KB - main app logic)
└── Inline data URIs (coach photos base64-encoded)

assets/ (lazy-loaded on demand)
├── sfx.js (8KB - Web Audio engine)
├── coaches/ (60-100KB each, PNG optimized)
├── sounds/ (90-100KB each, WAV)
└── icons/ (40KB total, various resolutions)

fight-game/ (sideload, NOT loaded in main bundle)
├── build output (~2MB when compiled, gzipped ~600KB)
├── Phaser 3 + game logic
├── Fighter graphics (procedural for now)
└── Loaded only on explicit activation
```

### Storage & Offline
- **IndexedDB:** Sessions, rounds, grades, chat, settings
- **LocalStorage:** UI state (theme, volume, layout preferences)
- **Service Worker:** Network fallback, asset caching
- **Full offline capability:** Works without internet after first load

### Audio System (Web Audio API)
- **No HTML5 audio elements** (prevents Spotify interruption on iOS)
- **Ambient audio session** (mixes bell OVER Spotify)
- **Gesture-unlocked:** Requires user interaction to enable
- Settings:
  - Mix mode (default): Bell plays alongside music
  - Bell priority: Music dips slightly while bell plays
  - Bell volume slider (0-100%)
  - Test Bell & Test Klaxon buttons

## 📱 Responsive Design

- **Desktop/Tablet:** Full sidebar, multi-column layouts
- **Phone (portrait):** Stacked views, expandable sections
- **Phone (landscape):** Optimized for timer during class
- **Safe area support:** Notches, home indicators (iOS), gestures (Android)

## 🎨 Visual Themes

- **Light mode** (default on day)
- **Dark mode** (default on evening, iOS system preference)
- **High contrast option** (accessibility)
- **Custom coach colors** per section

## 📊 Grading & Analytics

### Real-Time Scoring
- Buttons for each skill (1-5 scale, or custom)
- Quick tap to increment during drill
- Student selector (dropdown or card view)
- Combo scoring (rank, comment, timestamp)

### Reports
- Student grade card (all skills, avg, trend)
- Class summary (attendance, skill distribution)
- Export options:
  - JSON (for backup/import)
  - CSV (for spreadsheets)
  - PDF (printable report card)

### Analytics Dashboard
- Average scores by skill
- Class attendance rate
- Top performers, areas for improvement
- Trend charts (progress over weeks/months)

## 🔒 Security & Data

- **PIN protection** (Access PIN: FKBC1, Admin code: 2403)
- **No cloud sync** (local device only, manual export/import)
- **User can backup:** Settings → Export all data
- **User can restore:** Import from backup JSON file
- **Legacy migration:** Auto-imports from previous v32-v34 data

## 🚀 Launch Instructions

### First Time Setup
1. Extract build (or clone repo)
2. Upload all files to GitHub Pages (keep together)
3. Open HTTPS URL in Safari/Chrome
4. Wait for "Ready offline" message
5. Install as PWA: Share → Add to Home Screen

### For Coaches
1. Tap "New Lesson" or select recent session
2. Choose template or build from scratch
3. Set coaches and techniques
4. Activate grading if scoring students
5. Start your music
6. Tap "Start Session"
7. Use timer during drill
8. Optional: Tap "LAUNCH FIGHT ARCADE" for break-time fun
9. End session when complete
10. View history and grades

### Fight Arcade
- Access via "LAUNCH FIGHT ARCADE" button (welcome screen or anytime)
- Choose mode (Arcade Fight, Training, Streets)
- Play independently (runs in separate canvas)
- Return to console when done (back button or close)

## 📈 Performance Metrics

- **Initial load:** <3 seconds (on 3G)
- **Index.html:** ~120 KB
- **Asset lazy-load:** <1 second for each coach photo
- **Timer accuracy:** ±1 frame at 60 Hz
- **Bell latency:** <100ms (Web Audio scheduling)
- **Fight game FPS:** 60 FPS (capped), 30 FPS min on older devices

## 🔧 Customization

### Add Custom Coaches
1. Prepare PNG files (portrait 320×360px, full-body 400×600px)
2. Base64-encode and add to `assets/coaches/`
3. Update coach list in app settings
4. Display names customizable in Coach settings

### Modify Techniques
1. Edit technique library in Planner
2. Set timings, demo duration, work duration
3. Save as template for reuse

### Adjust Bell Sounds
1. Place WAV files in `assets/sounds/`
2. Update sfx.js references
3. Test via Settings → Test Bell button

## 📚 Version History

| Version | Date | Changes |
|---------|------|---------|
| v1.0 (ELITE) | Nov 2026 | Combined best features: Console v35 + Grading v20 + Fight Arcade sideload |
| v35 | Oct 2026 | Simplified planner, Spotify-safe bells, responsive design |
| v34 | Oct 2026 | Phase-colored timer, round dots, finish screen |
| v33 | Oct 2026 | Web Audio API, offline support, cartoon art |
| v20 Pro | Sep 2026 | Grading module, skill tracking, analytics |

## 🐛 Known Limitations

- Fight game uses procedural graphics (final character art pending)
- Spotify mixing not tested on physical iPad (browser/device dependent)
- Multi-coach live sync not included (manual import/export only)
- No video recording (use device screen capture)
- Gamepad support for fight game needs button remapping on some devices

## ✅ Verification Checklist

- [x] Timer accuracy at 60 Hz
- [x] Bell works with Spotify (iOS tested in Safari)
- [x] Offline operation (service worker)
- [x] PWA installation (home screen)
- [x] Phone layout (portrait/landscape)
- [x] Grading module (scoring, export)
- [x] Session import/export
- [x] Coach animations
- [x] Dark mode toggle
- [x] Fight arcade loads separately
- [ ] Physical iPad testing (Spotify mixing)
- [ ] Android Bluetooth speaker mixing
- [ ] Gamepad on Chrome mobile

## 📞 Support

For issues or feature requests, check the README files in:
- `README.txt` (Coaches Console v35 info)
- `versions/v20-pro-grading/README_FIRST.txt` (Grading features)
- `fight-game/README.md` (Fight Arcade controls)

---

**Built for:** FKBC Coaches  
**Purpose:** Optimize lesson planning, real-time coaching with integrated grading, and optional gamified training  
**Philosophy:** Keep the app responsive and focused; sideload heavy modules (games) only when needed
