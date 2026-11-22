/**
 * FKBC Fight Game Sideload Manager
 * Lazy-loads and manages the FKBC Fight Arcade game module
 * Runs independently without impacting main console performance
 */

class FKBCGameSideloader {
  constructor() {
    this.gameLoaded = false;
    this.gameRunning = false;
    this.gameContainer = null;
    this.gameWindow = null;
  }

  /**
   * Check if game resources are available locally (cached)
   */
  async isGameCached() {
    try {
      const cache = await caches.open('fkbc-game-v1');
      const response = await cache.match('/fight-game/dist/index.html');
      return !!response;
    } catch (e) {
      return false;
    }
  }

  /**
   * Preload game resources asynchronously (don't block console)
   * Call during idle time or when user opens welcome screen
   */
  async preloadGameAssets() {
    if (this.gameLoaded) return;
    
    try {
      // Check if game exists locally
      const isCached = await this.isGameCached();
      if (!isCached && navigator.onLine) {
        // Queue game download in background
        console.log('[FKBC Game] Preloading fight arcade assets...');
        // Use requestIdleCallback to load when CPU is idle
        if ('requestIdleCallback' in window) {
          requestIdleCallback(() => this.loadGameBundle());
        } else {
          setTimeout(() => this.loadGameBundle(), 2000);
        }
      }
    } catch (e) {
      console.warn('[FKBC Game] Preload skipped:', e.message);
    }
  }

  /**
   * Load game bundle (called only when user activates game)
   */
  async loadGameBundle() {
    if (this.gameLoaded) return;
    
    try {
      console.log('[FKBC Game] Loading fight arcade...');
      
      // Create container
      this.gameContainer = document.createElement('div');
      this.gameContainer.id = 'fkbc-game-container';
      this.gameContainer.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        z-index: 9999;
        background: #000;
        display: flex;
        align-items: center;
        justify-content: center;
        font-family: system-ui, sans-serif;
        color: #fff;
      `;

      // Loading indicator
      const loader = document.createElement('div');
      loader.style.cssText = `
        text-align: center;
        font-size: 18px;
        letter-spacing: 2px;
      `;
      loader.innerHTML = `
        <div style="margin-bottom: 20px;">LAUNCHING FIGHT ARCADE</div>
        <div style="display: inline-block; border: 3px solid rgba(255,255,255,0.3); border-top-color: #ff3551; border-radius: 50%; width: 50px; height: 50px; animation: spin 1s linear infinite;"></div>
        <style>
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        </style>
      `;
      
      this.gameContainer.appendChild(loader);
      document.body.appendChild(this.gameContainer);

      // Load game iframe/module
      await this.createGameWindow();
      
      this.gameLoaded = true;
      console.log('[FKBC Game] Fight arcade loaded successfully');
    } catch (error) {
      console.error('[FKBC Game] Failed to load:', error);
      this.showGameError(error.message);
    }
  }

  /**
   * Create isolated game environment (iframe or modal)
   */
  async createGameWindow() {
    return new Promise((resolve, reject) => {
      // Option 1: Iframe isolation (safest, most isolated)
      const iframe = document.createElement('iframe');
      iframe.id = 'fkbc-game-frame';
      iframe.src = '/fight-game/dist/index.html';
      iframe.style.cssText = `
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        border: none;
        background: #000;
      `;

      iframe.onload = () => {
        console.log('[FKBC Game] Iframe loaded, initializing...');
        this.gameWindow = iframe;
        this.setupGameBridge();
        
        // Hide loader, show game
        const loader = this.gameContainer.querySelector('[style*="text-align"]');
        if (loader) loader.style.display = 'none';
        
        resolve();
      };

      iframe.onerror = () => {
        reject(new Error('Failed to load game iframe'));
      };

      this.gameContainer.appendChild(iframe);

      // Timeout failsafe
      setTimeout(() => {
        if (!this.gameWindow) {
          reject(new Error('Game load timeout'));
        }
      }, 10000);
    });
  }

  /**
   * Setup communication bridge between console and game
   */
  setupGameBridge() {
    // Listen for game close message
    window.addEventListener('message', (event) => {
      if (event.source !== this.gameWindow?.contentWindow) return;

      if (event.data.type === 'GAME_CLOSE') {
        console.log('[FKBC Game] Closing game, returning to console');
        this.closeGame();
      } else if (event.data.type === 'GAME_READY') {
        console.log('[FKBC Game] Ready for input');
        // Send config to game if needed
        this.gameWindow.contentWindow.postMessage({
          type: 'GAME_CONFIG',
          theme: localStorage.getItem('fkbc_theme') || 'dark',
          volume: localStorage.getItem('fkbc_volume') || 70,
        }, '*');
      }
    });

    // Hide browser UI when game is active
    if (document.documentElement.requestFullscreen) {
      document.documentElement.requestFullscreen().catch(e => {
        console.log('[FKBC Game] Fullscreen not available:', e.message);
      });
    }

    // Hide console UI
    const consoleUI = document.getElementById('fkbcConsoleBar');
    if (consoleUI) consoleUI.style.display = 'none';

    // Add close button
    this.addGameCloseButton();
  }

  /**
   * Add overlay close button (top-left or top-right)
   */
  addGameCloseButton() {
    const closeBtn = document.createElement('button');
    closeBtn.innerHTML = '✕';
    closeBtn.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 10000;
      width: 50px;
      height: 50px;
      border: 2px solid #ff3551;
      background: rgba(0,0,0,0.7);
      color: #ff3551;
      border-radius: 50%;
      font-size: 24px;
      font-weight: bold;
      cursor: pointer;
      transition: all 0.2s;
      font-family: system-ui;
    `;

    closeBtn.onmouseover = () => {
      closeBtn.style.background = 'rgba(255,53,81,0.2)';
      closeBtn.style.transform = 'scale(1.1)';
    };

    closeBtn.onmouseout = () => {
      closeBtn.style.background = 'rgba(0,0,0,0.7)';
      closeBtn.style.transform = 'scale(1)';
    };

    closeBtn.onclick = () => this.closeGame();
    closeBtn.onkeydown = (e) => {
      if (e.key === 'Escape') this.closeGame();
    };

    this.gameContainer.appendChild(closeBtn);

    // ESC key to close
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.gameRunning) {
        e.preventDefault();
        this.closeGame();
      }
    });
  }

  /**
   * Close game and return to console
   */
  closeGame() {
    console.log('[FKBC Game] Closing...');
    this.gameRunning = false;

    if (this.gameContainer) {
      this.gameContainer.style.animation = 'fadeOut 0.3s ease-out';
      setTimeout(() => {
        this.gameContainer.remove();
        this.gameContainer = null;
        this.gameWindow = null;
      }, 300);
    }

    // Restore console UI
    const consoleUI = document.getElementById('fkbcConsoleBar');
    if (consoleUI) consoleUI.style.display = '';

    // Exit fullscreen if active
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(e => console.log('Exit fullscreen:', e.message));
    }

    // Add fade animation
    if (!document.querySelector('style[data-game-animations]')) {
      const style = document.createElement('style');
      style.setAttribute('data-game-animations', 'true');
      style.textContent = `
        @keyframes fadeOut {
          from { opacity: 1; }
          to { opacity: 0; }
        }
      `;
      document.head.appendChild(style);
    }
  }

  /**
   * Launch game immediately (called by button click)
   */
  async launch() {
    if (this.gameRunning) return;
    
    this.gameRunning = true;
    
    // Show loading if not already loaded
    if (!this.gameLoaded) {
      await this.loadGameBundle();
    } else {
      // Game already loaded, just show container
      this.gameContainer.style.display = 'flex';
    }

    console.log('[FKBC Game] Game launched');
  }

  /**
   * Show game loading/error message
   */
  showGameError(message) {
    if (!this.gameContainer) return;
    
    const loader = this.gameContainer.querySelector('[style*="text-align"]');
    if (loader) {
      loader.innerHTML = `
        <div style="color: #ff3551; margin-bottom: 20px;">GAME LOAD ERROR</div>
        <div style="font-size: 14px; color: #aaa; line-height: 1.6;">
          <div>${message}</div>
          <div style="margin-top: 20px; color: #666;">Check your connection and try again.</div>
        </div>
        <button style="margin-top: 30px; padding: 12px 24px; background: #ff3551; color: #fff; border: none; border-radius: 8px; cursor: pointer; font-weight: bold;">
          Close
        </button>
      `;
      
      loader.querySelector('button').onclick = () => this.closeGame();
    }
  }
}

// Global instance
window.fkbcGameLoader = new FKBCGameSideloader();

/**
 * Integration with main console
 * Add this to index.html:
 * 
 * 1. In welcome screen, add button:
 *    <button onclick="window.fkbcGameLoader.launch()">🎮 LAUNCH FIGHT ARCADE</button>
 * 
 * 2. On page load:
 *    <script>
 *      document.addEventListener('DOMContentLoaded', () => {
 *        // Preload game assets when console is idle
 *        if (navigator.onLine) {
 *          window.fkbcGameLoader.preloadGameAssets();
 *        }
 *      });
 *    </script>
 * 
 * 3. Add ESC key handler in game to send message back:
 *    window.parent.postMessage({ type: 'GAME_CLOSE' }, '*');
 */
