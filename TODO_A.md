# Situation Monitor – Completed Features (TODO_A)

**Last Updated:** 2026-01-19

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

## Technical Debt Resolved (4 items)

- [x] **Inline script refactored**
  - Moved from `index.html` to `js/map/inline-map.js` (1,508 lines)
  - Proper module structure

- [x] **OpenSky rate limiting**
  - Exponential backoff implemented in `js/map/inline-map.js`
  - Handles 429 responses gracefully

- [x] **CSS files consolidated**
  - Removed duplicate `styles.css`
  - `index.css` (4,369 lines) is now the single source

- [x] **Yahoo Finance duplicate code documented**
  - Both `js/app.js` and `js/services/yahoo.js` in use
  - Documented as intentional (different use cases)

---

## Global Expansion (2 items)

- [x] **Global weather events**
  - `loadGlobalWeatherEvents()` checks major global cities
  - Weather API integration for worldwide coverage

- [x] **Global military bases**
  - Overpass API queries for worldwide military installations
  - Works at any zoom level ≥ 2.0

---

## Summary

| Category | Count |
|----------|-------|
| Data Layers | 7 |
| UI/UX | 5 |
| Security | 2 |
| Technical Debt | 4 |
| Global Expansion | 2 |
| **Total** | **20** |

---

## Session Changelog

Items completed and verified this session:

1. Proxy authentication (Bearer token) - `proxy_server.py`
2. Inline script refactoring - `js/map/inline-map.js`
3. OpenSky rate limiting - exponential backoff
4. CSS consolidation - removed `styles.css`
5. Clickable popups - click-to-pin behavior
6. Improved click targets - hit radius scaling
7. Submarine cables display - `drawSubmarineCables()`
8. Global weather events - `loadGlobalWeatherEvents()`
9. Global military bases - Overpass worldwide queries
10. Conflict zone tooltips - informational popups
11. Red squares investigation - confirmed as conflict zones
12. Yahoo Finance duplicate - documented as intentional
13. Log files in .gitignore - already present
