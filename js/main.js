/**
 * Main entry point for Vite build
 * This file imports all modules in the correct order to maintain
 * the same loading sequence as the script tags in index.html
 *
 * Since the codebase uses global functions called from HTML onclick handlers,
 * we need to explicitly expose them on the window object after bundling.
 */

// Core utilities (must be loaded first)
import './core/storage.js';
import './core/utils.js';
import './core/proxy.js';

// Constants and configuration
import './constants.js';

// Services
import './services/overpass.js';
import './services/feeds.js';
import './services/yahoo.js';
import './services/api.js';

// Map modules
import './map/data-loaders.js';
import './map/popups.js';
import './map/zoom.js';
import './map/globe.js';
import './map/inline-map.js';
import './map/view-toggle.js';

// Panel modules
import './panels/panel-manager.js';
import './panels/news.js';
import './panels/markets.js';
import './panels/monitors.js';
import './panels/polymarket.js';
import './panels/congress.js';
import './panels/whales.js';
import './panels/misc.js';
import './panels/livestream.js';
import './panels/pentagon.js';

// Main application
import './app.js';

// Expose globals for HTML onclick handlers
// These functions are defined in the imported modules above
if (typeof window !== 'undefined') {
  // From monitors.js
  window.openMonitorForm = typeof openMonitorForm !== 'undefined' ? openMonitorForm : undefined;
  window.closeMonitorForm = typeof closeMonitorForm !== 'undefined' ? closeMonitorForm : undefined;
  window.saveMonitor = typeof saveMonitor !== 'undefined' ? saveMonitor : undefined;

  // From app.js
  window.toggleSettings = typeof toggleSettings !== 'undefined' ? toggleSettings : undefined;
  window.refreshAll = typeof refreshAll !== 'undefined' ? refreshAll : undefined;
  window.resetPanelOrder = typeof resetPanelOrder !== 'undefined' ? resetPanelOrder : undefined;

  // From pentagon.js
  window.saveBestTimePrivateKey = typeof saveBestTimePrivateKey !== 'undefined' ? saveBestTimePrivateKey : undefined;
  window.addPentagonLocationFromInputs = typeof addPentagonLocationFromInputs !== 'undefined' ? addPentagonLocationFromInputs : undefined;

  // From inline-map.js
  window.MapModule = typeof MapModule !== 'undefined' ? MapModule : undefined;

  // From view-toggle.js
  window.toggleMapViewMode = typeof toggleMapViewMode !== 'undefined' ? toggleMapViewMode : undefined;
}

console.log('[Build] Situation Monitor loaded');
