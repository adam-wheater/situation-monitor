# Situation Monitor – Completed Features (TODO_A)

**Last Updated:** 2026-01-21

---

## Data Layers (7 items)

- [x] **Weather warnings (US NWS alerts)**
  - Location: `index.html:664-749`
  - Fetches from `api.weather.gov/alerts/active`
  - Groups by state, displays severity-colored triangles with tooltips

- [x] **Flight radar (OpenSky heuristics)**
  - Location: `js/map/inline-map.js:836-839, 1141-1291`
  - Queries OpenSky `states/all` with callsign filtering
  - Refreshes every ~3 minutes
  - Includes exponential backoff rate limiting

- [x] **Naval hubs / ship layer (Overpass)**
  - Location: `js/services/overpass.js`
  - Queries `harbour=naval_base` from Overpass when zoomed in
  - Note: Static OSM infrastructure, not live AIS

- [x] **Pentagon pizza tracker (BestTime API)**
  - Location: `js/panels/pentagon.js`
  - Full BestTime API integration with live and forecast data
  - Curated fallback venues in `data/pentagon-curated-venues.json` (8 venues)
  - Requires local proxy server running

- [x] **Regional military bases (Overpass)**
  - Location: `js/services/overpass.js`
  - Queries `military~^(base|naval_base|airfield|barracks)$` and `landuse=military`

- [x] **Nuclear power plants (Overpass)**
  - Location: `js/services/overpass.js`
  - Queries `plant:source=nuclear` and `generator:source=nuclear`

- [x] **Submarine cables display**
  - Location: `js/map/inline-map.js`
  - `drawSubmarineCables()` function for 2D map view
  - Data from `data/cables-geo.json`

---

## UI/UX (5 items)

- [x] **Zoom-based icon scaling**
  - Location: `js/map/zoom.js:68-73`
  - Uses `--sm-marker-scale` CSS variable
  - Formula: `1 / Math.pow(z, 2.0)`

- [x] **Clickable popups (click-to-pin)**
  - Location: `js/map/popups.js`
  - Click-to-pin tooltips with hover preview
  - Improved hit radius scaling with zoom

- [x] **Conflict zone tooltips**
  - Red squares over active conflict zones (Ukraine, Gaza, etc.)
  - Now clickable with informational tooltips

- [x] **Flight toggle display**
  - "Show All Flights" checkbox implemented
  - Filters military-only vs all flights

- [x] **Improved click targets**
  - Hit radius scaling with zoom level for better selection
  - Location: `js/map/zoom.js`

---

## Security (2 items)

- [x] **Proxy authentication (Bearer token)**
  - Location: `proxy_server.py:164-179`
  - Set `PROXY_AUTH_TOKEN` env var to enable
  - Validates `Authorization: Bearer <token>` header

- [x] **Log files excluded from git**
  - `*.log` in `.gitignore` prevents API key leakage
  - Protects proxy server logs containing URLs

---

## Technical Debt Resolved (6 items)

- [x] **Inline script refactored**
  - Moved from `index.html` to `js/map/inline-map.js` (1,508 lines)
  - Proper module structure

- [x] **OpenSky rate limiting**
  - Exponential backoff implemented in `js/map/inline-map.js`
  - Handles 429 responses gracefully

- [x] **CSS files consolidated**
  - Removed duplicate `styles.css`
  - `index.css` (4,369 lines) is now the single source

- [x] **Yahoo Finance duplicate documented**
  - Both `js/app.js` and `js/services/yahoo.js` in use
  - Documented as intentional (different use cases)

- [x] **Build/bundle step (Vite + esbuild)**
  - Production build with minification and tree-shaking
  - `npm run dev` / `npm run build` / `npm run preview`
  - Build output: ~134KB JS (42KB gzipped), ~65KB CSS (11KB gzipped)
  - Files: `vite.config.js`, `js/main.js`

- [x] **App.js syntax error fixed**
  - Closed unclosed `initApp()` function

---

## Global Expansion (2 items)

- [x] **Global weather events**
  - `loadGlobalWeatherEvents()` checks major global cities
  - Weather API integration for worldwide coverage

- [x] **Global military bases**
  - Overpass API queries for worldwide military installations
  - Works at any zoom level ≥ 2.0

---

## Feature Additions (1 item)

- [x] **3D globe visualization toggle**
  - 2D/3D toggle button in map panel header
  - File: `js/map/view-toggle.js`
  - Globe.gl integration for 3D view
  - Preference saved to localStorage
  - Shows countries, conflict zones, and hotspots

---

## Summary

| Category | Count |
|----------|-------|
| Data Layers | 7 |
| UI/UX | 5 |
| Security | 2 |
| Technical Debt | 6 |
| Global Expansion | 2 |
| Feature Additions | 1 |
| **Total** | **23** |

---

## Test Coverage

### Unit Tests (341 tests)

| Test File | Tests | Status |
|-----------|-------|--------|
| zoom-scaling.test.js | 34 | Pass |
| inline-map.test.js | 52 | Pass |
| data-loaders.test.js | 26 | Pass |
| pentagon-tracker.test.js | 31 | Pass |
| curated-venues.test.js | 19 | Pass |
| weather-alerts.test.js | 19 | Pass |
| overpass-layers.test.js | 41 | Pass |
| flight-radar.test.js | 36 | Pass |
| proxy-auth.test.js | 20 | Pass |
| view-toggle.test.js | 19 | Pass |
| build-config.test.js | 44 | Pass |
| **Unit Total** | **341** | **All passing** |

### E2E Tests (150 tests)

| Test File | Tests | Status |
|-----------|-------|--------|
| app.spec.js | ~50 | Pass |
| map.spec.js | ~20 | Pass |
| panels.spec.js | ~35 | Pass |
| responsive.spec.js | ~20 | Pass |
| view-toggle.spec.js | ~25 | Pass |
| **E2E Total** | **150** | **All passing** |

**Grand Total:** 491 tests passing

**Verified:** 2026-01-21
