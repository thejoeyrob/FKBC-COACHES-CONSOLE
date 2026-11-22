/**
 * FKBC ELITE Enhanced Welcome Screen
 * Features:
 * - Quick launch buttons for all major modes
 * - Grading mode toggle
 * - Fight Arcade sideload launcher
 * - Recent sessions carousel
 * - Quick stats dashboard
 * - Settings quick access
 */

const FKBCEliteWelcome = {
  // Initialize welcome screen enhancements
  init() {
    this.addGradingModeToggle();
    this.addFightArcadeButton();
    this.addQuickStatsWidget();
    this.addEnhancedNavigation();
    this.preloadGameAssets();
  },

  /**
   * Add Grading Mode Toggle (prominent in header or welcome section)
   */
  addGradingModeToggle() {
    const headerSelector = '#fkbcConsoleBar, .header, [role="banner"]';
    let header = document.querySelector(headerSelector);
    
    if (!header) {
      console.warn('[ELITE] Header not found, skipping grading toggle');
      return;
    }

    const toggle = document.createElement('div');
    toggle.id = 'grading-mode-toggle';
    toggle.className = 'grading-mode-widget';
    toggle.innerHTML = `
      <style>
        .grading-mode-widget {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 6px 12px;
          background: rgba(255, 53, 81, 0.1);
          border: 1px solid rgba(255, 53, 81, 0.3);
          border-radius: 10px;
          margin-left: auto;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .grading-mode-widget:hover {
          background: rgba(255, 53, 81, 0.2);
          border-color: rgba(255, 53, 81, 0.6);
        }

        .grading-mode-widget.active {
          background: #ff3551;
          border-color: #c71431;
          color: #fff;
        }

        .grading-mode-label {
          font-weight: 600;
          font-size: 0.85rem;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          white-space: nowrap;
        }

        .grading-mode-icon {
          font-size: 1.2rem;
          display: inline-block;
          transition: transform 0.2s;
        }

        .grading-mode-widget.active .grading-mode-icon {
          transform: scale(1.1);
        }

        .grading-tooltip {
          position: absolute;
          bottom: -40px;
          right: 0;
          background: rgba(0, 0, 0, 0.9);
          color: #fff;
          padding: 8px 12px;
          border-radius: 6px;
          font-size: 0.75rem;
          white-space: nowrap;
          z-index: 1000;
          pointer-events: none;
          opacity: 0;
          transition: opacity 0.2s;
        }

        .grading-mode-widget:hover .grading-tooltip {
          opacity: 1;
        }
      </style>

      <span class="grading-mode-icon">📊</span>
      <span class="grading-mode-label" id="grading-label">Grading OFF</span>
      <div class="grading-tooltip">Enable student grading &amp; progress tracking</div>
    `;

    // Add to header
    header.appendChild(toggle);

    // Load saved state
    const gradingEnabled = localStorage.getItem('fkbc_grading_enabled') === 'true';
    if (gradingEnabled) {
      toggle.classList.add('active');
      document.getElementById('grading-label').textContent = 'Grading ON';
    }

    // Toggle handler
    toggle.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.toggleGradingMode(toggle);
    });
  },

  /**
   * Toggle Grading Mode
   */
  toggleGradingMode(toggle) {
    const isActive = toggle.classList.toggle('active');
    const label = document.getElementById('grading-label');
    
    if (isActive) {
      label.textContent = 'Grading ON';
      localStorage.setItem('fkbc_grading_enabled', 'true');
      console.log('[ELITE] Grading mode enabled');
      
      // Show grading UI elements
      document.querySelectorAll('[data-grading-only]').forEach(el => {
        el.style.display = '';
      });
      
      // Trigger grading dashboard if available
      if (window.FKBCGradingModule?.show) {
        window.FKBCGradingModule.show();
      }
    } else {
      label.textContent = 'Grading OFF';
      localStorage.setItem('fkbc_grading_enabled', 'false');
      console.log('[ELITE] Grading mode disabled');
      
      // Hide grading UI elements
      document.querySelectorAll('[data-grading-only]').forEach(el => {
        el.style.display = 'none';
      });
    }
  },

  /**
   * Add Fight Arcade Launcher Button
   */
  addFightArcadeButton() {
    // Create launcher button (place in welcome screen or hero section)
    const launcherBtn = document.createElement('button');
    launcherBtn.id = 'launch-fight-arcade';
    launcherBtn.className = 'fight-arcade-launcher';
    launcherBtn.innerHTML = `
      <style>
        .fight-arcade-launcher {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          padding: 16px 24px;
          background: linear-gradient(135deg, #ff3551 0%, #c71431 100%);
          color: #fff;
          border: none;
          border-radius: 14px;
          font-weight: 700;
          font-size: 1rem;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
          box-shadow: 0 8px 20px rgba(255, 53, 81, 0.3);
          text-transform: uppercase;
          letter-spacing: 0.8px;
          min-width: 240px;
        }

        .fight-arcade-launcher:hover {
          transform: translateY(-3px) scale(1.02);
          box-shadow: 0 12px 30px rgba(255, 53, 81, 0.5);
        }

        .fight-arcade-launcher:active {
          transform: translateY(-1px) scale(0.99);
        }

        .fight-arcade-launcher::before {
          content: '🎮';
          font-size: 1.3em;
          display: inline-block;
          animation: pulse 2s ease-in-out infinite;
        }

        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.1); }
        }

        .fight-arcade-launcher:disabled {
          opacity: 0.5;
          cursor: not-allowed;
          animation: none;
        }

        .fight-arcade-launcher .loading-spinner {
          display: inline-block;
          width: 16px;
          height: 16px;
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-top-color: #fff;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      </style>

      🎮 LAUNCH FIGHT ARCADE
    `;

    // Insert into welcome section (after main CTA buttons)
    const welcomeSection = document.querySelector('.homeActions, .welcome-buttons, [role="main"]');
    if (welcomeSection) {
      const container = document.createElement('div');
      container.style.cssText = 'display: flex; justify-content: center; margin: 20px 0;';
      container.appendChild(launcherBtn);
      
      // Insert after action buttons
      if (welcomeSection.nextElementSibling) {
        welcomeSection.parentNode.insertBefore(container, welcomeSection.nextElementSibling);
      } else {
        welcomeSection.parentNode.appendChild(container);
      }
    }

    // Click handler
    launcherBtn.addEventListener('click', async (e) => {
      e.preventDefault();
      e.stopPropagation();
      
      launcherBtn.disabled = true;
      launcherBtn.innerHTML = '<div class="loading-spinner"></div> Loading...';
      
      try {
        await window.fkbcGameLoader.launch();
      } catch (error) {
        console.error('[ELITE] Game launch failed:', error);
        launcherBtn.disabled = false;
        launcherBtn.innerHTML = '🎮 LAUNCH FIGHT ARCADE';
      }
    });
  },

  /**
   * Add Quick Stats Dashboard Widget
   */
  addQuickStatsWidget() {
    const statsWidget = document.createElement('div');
    statsWidget.id = 'fkbc-quick-stats';
    statsWidget.className = 'quick-stats-widget';
    statsWidget.innerHTML = `
      <style>
        .quick-stats-widget {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
          gap: 12px;
          margin: 20px 0;
          padding: 16px;
          background: linear-gradient(180deg, rgba(255, 53, 81, 0.05), rgba(52, 146, 255, 0.05));
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 16px;
        }

        .stat-card {
          padding: 12px;
          background: rgba(255, 255, 255, 0.05);
          border-radius: 10px;
          text-align: center;
          transition: all 0.2s;
        }

        .stat-card:hover {
          background: rgba(255, 255, 255, 0.1);
          transform: translateY(-2px);
        }

        .stat-value {
          font-size: 1.8rem;
          font-weight: 700;
          color: #ff3551;
        }

        .stat-label {
          font-size: 0.75rem;
          color: #8fa3b7;
          text-transform: uppercase;
          margin-top: 4px;
          letter-spacing: 0.5px;
        }
      </style>

      <div class="stat-card">
        <div class="stat-value" id="stat-sessions">0</div>
        <div class="stat-label">Sessions</div>
      </div>
      <div class="stat-card">
        <div class="stat-value" id="stat-hours">0</div>
        <div class="stat-label">Total Hours</div>
      </div>
      <div class="stat-card">
        <div class="stat-value" id="stat-students">0</div>
        <div class="stat-label">Students</div>
      </div>
      <div class="stat-card">
        <div class="stat-value" id="stat-avg-grade">—</div>
        <div class="stat-label">Avg Grade</div>
      </div>
    `;

    // Insert before or after welcome section
    const welcomeSection = document.querySelector('.homeActions, [role="main"]');
    if (welcomeSection) {
      welcomeSection.parentNode.insertBefore(statsWidget, welcomeSection);
    }

    // Populate stats
    this.updateQuickStats();
  },

  /**
   * Update Quick Stats from LocalStorage/IndexedDB
   */
  updateQuickStats() {
    try {
      // Get stats from application state
      const stats = {
        sessions: localStorage.getItem('fkbc_session_count') || '0',
        hours: (parseInt(localStorage.getItem('fkbc_total_minutes') || '0') / 60).toFixed(1),
        students: localStorage.getItem('fkbc_student_count') || '0',
        avgGrade: localStorage.getItem('fkbc_avg_grade') || '—',
      };

      document.getElementById('stat-sessions').textContent = stats.sessions;
      document.getElementById('stat-hours').textContent = stats.hours;
      document.getElementById('stat-students').textContent = stats.students;
      document.getElementById('stat-avg-grade').textContent = stats.avgGrade;
    } catch (e) {
      console.warn('[ELITE] Could not update stats:', e.message);
    }
  },

  /**
   * Enhance Navigation with Quick Access Menu
   */
  addEnhancedNavigation() {
    // Add quick action menu to sidebar or nav
    const navContainer = document.querySelector('.navbar, [role="navigation"], nav');
    if (!navContainer) return;

    const quickMenu = document.createElement('div');
    quickMenu.className = 'quick-nav-menu';
    quickMenu.innerHTML = `
      <style>
        .quick-nav-menu {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 8px;
          padding: 12px;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 12px;
          margin: 12px 0;
        }

        .quick-nav-btn {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 6px;
          padding: 10px;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 8px;
          color: inherit;
          cursor: pointer;
          text-decoration: none;
          font-size: 0.75rem;
          text-align: center;
          transition: all 0.2s;
        }

        .quick-nav-btn:hover {
          background: rgba(255, 53, 81, 0.15);
          border-color: rgba(255, 53, 81, 0.3);
        }

        .quick-nav-icon {
          font-size: 1.5rem;
        }
      </style>

      <button class="quick-nav-btn" onclick="window.location.hash='#plan'">
        <span class="quick-nav-icon">📋</span>
        <span>Planner</span>
      </button>
      <button class="quick-nav-btn" onclick="window.location.hash='#timer'">
        <span class="quick-nav-icon">⏱️</span>
        <span>Timer</span>
      </button>
      <button class="quick-nav-btn" onclick="window.location.hash='#grades'">
        <span class="quick-nav-icon">📊</span>
        <span>Grades</span>
      </button>
      <button class="quick-nav-btn" onclick="window.location.hash='#settings'">
        <span class="quick-nav-icon">⚙️</span>
        <span>Settings</span>
      </button>
    `;

    navContainer.appendChild(quickMenu);
  },

  /**
   * Preload game assets during idle time
   */
  preloadGameAssets() {
    if (!window.fkbcGameLoader) {
      console.warn('[ELITE] Game loader not initialized');
      return;
    }

    // Start preload after page settles
    if (document.readyState === 'complete') {
      window.fkbcGameLoader.preloadGameAssets();
    } else {
      document.addEventListener('load', () => {
        window.fkbcGameLoader.preloadGameAssets();
      });
    }
  }
};

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  FKBCEliteWelcome.init();
  console.log('[ELITE] Welcome screen enhanced');
});
