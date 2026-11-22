# FKBC ELITE BUILD - INTEGRATION & DEPLOYMENT GUIDE

## ✅ Pre-Deployment Checklist

- [ ] All files from current console (v35) + v20 Pro grading in root
- [ ] Coach PNGs optimized (60-100KB each)
- [ ] Sound files tested (bell.wav, klaxon.wav, bleep.wav)
- [ ] Service worker cache strategy verified
- [ ] Game sideloader tested in development
- [ ] README and docs updated
- [ ] Mobile responsive layout confirmed
- [ ] Offline functionality verified
- [ ] Grading mode toggle works
- [ ] Fight arcade launcher accessible

## 📦 Recommended Repository Structure

### For GitHub Pages Hosting (Static Build)

```
FKBC-COACHES-CONSOLE-ELITE/
├── index.html                    (Main app + console UI)
├── sw.js                         (Service worker)
├── manifest.webmanifest          (PWA config)
├── ELITE_BUILD_MANIFEST.md       (This file + features)
├── INTEGRATION_GUIDE.md          (Setup instructions)
│
├── assets/
│   ├── sfx.js                    (Web Audio API + sideloader)
│   ├── elite-welcome.js          (Welcome screen enhancements)
│   ├── game-sideloader.js        (Game loader & bridge)
│   ├── coaches/
│   │   ├── joe-portrait.png
│   │   ├── joe-full.png
│   │   ├── jack-portrait.png
│   │   ├── jack-full.png
│   │   ├── paul-portrait.png
│   │   ├── paul-full.png
│   │   ├── big-john-portrait.png
│   │   ├── big-john-full.png
│   │   ├── justin-portrait.png
│   │   ├── justin-full.png
│   │   ├── gracie-portrait.png
│   │   ├── gracie-full.png
│   │   ├── john-portrait.png
│   │   ├── john-full.png
│   │   ├── eden-portrait.png
│   │   └── eden-full.png
│   │
│   ├── sounds/
│   │   ├── bell.wav
│   │   ├── klaxon.wav
│   │   ├── bleep.wav
│   │   └── silence.wav
│   │
│   └── icons/
│       ├── icon-192.png
│       ├── icon-512.png
│       └── apple-touch-icon.png
│
├── fight-game/                   (Sideload module - OPTIONAL)
│   ├── dist/                     (Compiled Phaser game)
│   │   ├── index.html
│   │   ├── style.css
│   │   ├── bundle.js
│   │   └── assets/               (Game graphics, sounds)
│   │
│   └── README.md                 (Game setup notes)
│
├── versions/                     (Archive of previous builds)
│   ├── v35-console/
│   ├── v20-pro-grading/
│   └── edition-8-music-fix/
│
└── docs/
    ├── API.md                    (Sideloader API docs)
    ├── CUSTOMIZATION.md          (How to customize)
    ├── TROUBLESHOOTING.md        (Common issues)
    └── CHANGELOG.md              (Release notes)
```

## 🔧 Integration Steps

### Step 1: Prepare Console Base

```bash
# Start from current v35 console
cp -r FKBC-COACHES-CONSOLE FKBC-COACHES-CONSOLE-ELITE

# Copy in the pro grading assets
cp -r versions/v20-pro-grading/assets/* assets/
```

### Step 2: Add Elite Enhancements to index.html

**Before closing `</head>` tag:**
```html
<!-- Game sideloader (lazy-loaded) -->
<script src="assets/game-sideloader.js" defer></script>

<!-- Elite welcome enhancements -->
<script src="assets/elite-welcome.js" defer></script>
```

**Before closing `</body>` tag:**
```html
<!-- Initialize game preloader when console is idle -->
<script>
  document.addEventListener('DOMContentLoaded', () => {
    // Preload game resources asynchronously
    if (navigator.onLine && 'requestIdleCallback' in window) {
      requestIdleCallback(() => {
        window.fkbcGameLoader?.preloadGameAssets();
      });
    } else {
      setTimeout(() => {
        window.fkbcGameLoader?.preloadGameAssets();
      }, 3000);
    }
  });
</script>
```

### Step 3: Update Service Worker (sw.js)

Add fight game to cache strategy:

```javascript
// In sw.js, add to cache list:
const CACHE_VERSION = 'fkbc-elite-v1.0';
const CACHE_URLS = [
  './',
  './index.html',
  './sw.js',
  './manifest.webmanifest',
  './assets/sfx.js',
  './assets/elite-welcome.js',
  './assets/game-sideloader.js',
  './assets/coaches/joe-portrait.png',
  './assets/coaches/jack-portrait.png',
  './assets/coaches/paul-portrait.png',
  './assets/coaches/big-john-portrait.png',
  './assets/coaches/justin-portrait.png',
  './assets/coaches/gracie-portrait.png',
  './assets/coaches/john-portrait.png',
  './assets/coaches/eden-portrait.png',
  './assets/sounds/bell.wav',
  './assets/sounds/klaxon.wav',
  './assets/sounds/bleep.wav',
  './assets/icons/icon-192.png',
  './assets/icons/icon-512.png',
  
  // Game module (optional, only cached on demand)
  './fight-game/dist/index.html'
];
```

### Step 4: Customize Welcome Screen

Add to your existing welcome/home section:

```html
<!-- Fight Arcade Launcher -->
<div style="display: flex; justify-content: center; margin: 20px 0;">
  <button id="launch-fight-arcade" class="fight-arcade-launcher" 
          onclick="window.fkbcGameLoader.launch()">
    🎮 LAUNCH FIGHT ARCADE
  </button>
</div>

<!-- Grading Mode Indicator -->
<div id="grading-mode-toggle" style="margin: 10px 0;">
  <!-- Automatically populated by elite-welcome.js -->
</div>
```

### Step 5: Setup Fight Game (Optional)

If including the fight arcade:

```bash
# Clone fight arcade source
git clone https://github.com/thejoeyrob/FKBC-App-Store-Repo.git fight-arcade-source

# Build the game
cd fight-arcade-source
npm install
npm run build

# Copy dist to fight-game directory
mkdir -p ../fight-game/dist
cp -r dist/* ../fight-game/dist/
cp -r src/assets/* ../fight-game/dist/assets/ 2>/dev/null || true
```

**game-sideloader.js will look for game at:** `/fight-game/dist/index.html`

### Step 6: Deploy to GitHub Pages

```bash
# Ensure you're in the repo root
git add .
git commit -m "ELITE Build v1.0: Integrated v35 console + v20 Pro grading + Fight Arcade sideload"
git push origin main

# Your GitHub Pages site will update automatically
# Access at: https://username.github.io/FKBC-COACHES-CONSOLE-ELITE/
```

## 🎮 Game Sideloader API

### For Console Developers

**Launch game:**
```javascript
window.fkbcGameLoader.launch();
```

**Check if game is running:**
```javascript
if (window.fkbcGameLoader.gameRunning) {
  console.log('Game is active');
}
```

**Preload game assets:**
```javascript
window.fkbcGameLoader.preloadGameAssets();
```

**Send data to game:**
```javascript
// Game must listen for 'message' events
window.fkbcGameLoader.gameWindow?.contentWindow.postMessage({
  type: 'CUSTOM_MESSAGE',
  data: { theme: 'dark', volume: 70 }
}, '*');
```

### For Game Developers (inside fight-game/dist/index.html)

**Receive data from console:**
```javascript
window.addEventListener('message', (event) => {
  if (event.data.type === 'GAME_CONFIG') {
    console.log('Theme:', event.data.theme);
    console.log('Volume:', event.data.volume);
  }
});
```

**Signal ready:**
```javascript
// Tell console we're ready
window.parent.postMessage({ type: 'GAME_READY' }, '*');
```

**Close game and return to console:**
```javascript
// When player exits, close the game
window.parent.postMessage({ type: 'GAME_CLOSE' }, '*');
```

## 📊 Grading Mode Features

The grading toggle enables:
- Real-time student scoring (1-5 scale per skill)
- Skill categories tracking
- Session grades export (CSV, JSON)
- Progress analytics dashboard
- Student performance reports
- Class attendance tracking

**Grading data stored in:** `IndexedDB` (device local only, not synced to cloud)

**Export grading data:**
1. Settings → App & Data → Export all data
2. File includes grades, student rosters, and progress history

**Import grading data:**
1. Settings → App & Data → Import from backup
2. Restores all grades and student information

## 🔊 Audio System Details

The sideloader includes enhanced Spotify integration:

**Web Audio API** (no HTML5 `<audio>` elements)
- Prevents Spotify interruption on iOS
- Mixes bell OVER music (ambient audio session)
- Settings for mix mode vs bell priority
- Volume control (0-100%)

**Test bells before class:**
- Settings → Timer & Class → Test Bell button
- Settings → Timer & Class → Test Klaxon button

## 📱 Responsive Breakpoints

- **Desktop (1200px+):** Multi-column layout, sidebar nav
- **Tablet (800px-1200px):** Flexible columns, touch-optimized buttons
- **Phone (< 800px):** Stacked layout, full-width modals
- **Landscape phone:** Optimized timer view

## ⚡ Performance Optimization

### Bundle Size
- index.html: ~120 KB
- assets/sfx.js: ~8 KB
- elite-welcome.js: ~15 KB
- game-sideloader.js: ~10 KB
- **Total console bundle: ~150 KB** (gzipped)

### Game Sideload Size
- fight-game/dist: ~2 MB uncompressed
- Gzipped: ~600 KB
- Only loaded on-demand (doesn't impact console startup)

### Cache Strategy
1. **On first load:** Download console (150KB), display welcome screen
2. **User can start teaching immediately** (game preloads in background)
3. **Coach photos lazy-load** when selected
4. **Game loads only when "Launch Fight Arcade" is tapped**

## 🐛 Troubleshooting

### Game won't load

1. Check browser console for errors (F12 → Console tab)
2. Verify `/fight-game/dist/index.html` exists
3. Check CORS headers on hosting (should be automatic on GitHub Pages)
4. Try reloading the page

### Bell sounds not mixing with Spotify

1. iOS Safari: Bell volume in Settings → Timer & Class
2. Try "Bell priority" mode (music dips slightly)
3. Keep FKBC visible on screen
4. Verify volume is not muted at OS level

### Game closes unexpectedly

1. Check if device has low memory
2. Try on a different device/browser
3. Clear app cache (Settings → App & Data → Clear cache)

### Grading mode not showing

1. Click the grading toggle in the header (📊 button)
2. Reload page and check localStorage: `fkbc_grading_enabled = true`
3. Check browser console for errors

## 📞 Support & Contributions

- **Report issues:** GitHub Issues on repository
- **Request features:** GitHub Discussions
- **Contribute fixes:** Pull Requests welcome

## 📜 License & Attribution

- **Base Console:** FKBC Coaches Console (original creator)
- **Grading Module:** v20 Pro version
- **Fight Arcade:** Phaser 3 + TypeScript implementation
- **Sideloader:** Custom integration layer

---

**Last Updated:** November 2026  
**Maintained by:** FKBC Development Team  
**Status:** Production Ready ✅
