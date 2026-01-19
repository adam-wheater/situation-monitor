# Situation Monitor - Completed Features (TODO_A)

**Last Updated:** 2026-01-19

## Data Layers (7 items)

- [x] **Weather warnings (US NWS alerts)**
  - Location: `index.html:664-749`
  - Fetches from `api.weather.gov/alerts/active`
  - Groups by state, displays severity-colored triangles with tooltips

- [x] **Flight radar (OpenSky heuristics)**
  - Location: `index.html:836-839, 1141-1291`
  - Queries OpenSky `states/all` with callsign filtering
  - Refreshes every ~3 minutes
  - Includes exponential backoff rate limiting

- [x] **Naval hubs / ship layer (Overpass)**
  - Location: `index.html:1026-1029`
  - Queries `harbour=naval_base` from Overpass when zoomed in
  - Note: Static OSM infrastructure, not live AIS

- [x] **Pentagon pizza tracker (BestTime API)**
  - Location: `js/panels/pentagon.js`
  - Full BestTime API integration
  - Curated fallback venues in `data/pentagon-curated-venues.json` (8 venues)
  - Requires local proxy server running

- [x] **Regional military bases (Overpass)**
  - Location: `index.html:1013-1024`
  - Queries `military~^(base|naval_base|airfield|barracks)$` and `landuse=military`

- [x] **Nuclear power plants (Overpass)**
  - Location: `index.html:1005-1011`
  - Queries `plant:source=nuclear` and `generator:source=nuclear`

- [x] **Submarine cables display**
  - Location: `js/map/inline-map.js`
  - `drawSubmarineCables()` function for 2D map view

## UI/UX (5 items)

- [x] **Zoom-based icon scaling**
  - Location: `js/map/zoom.js:68-73`
  - Uses `--sm-marker-scale` CSS variable
  - Formula: `1 / Math.pow(z, 2.0)`

- [x] **Clickable popups (pin on click)**
  - Click-to-pin tooltips with hover preview
  - Improved hit radius scaling with zoom

- [x] **Conflict zone tooltips**
  - Red squares over active conflict zones (Ukraine, Gaza, etc.)
  - Now clickable with informational tooltips

- [x] **Flight toggle display**
  - "Show All Flights" checkbox already implemented

- [x] **Improved click targets**
  - Hit radius scaling with zoom level for better selection

## Security (2 items)

- [x] **Proxy authentication (Bearer token)**
  - Implemented via `PROXY_AUTH_TOKEN` env var
  - Location: `proxy_server.py`

- [x] **Log files excluded from git**
  - `*.log` in `.gitignore` prevents API key leakage

## Technical Debt Resolved (4 items)

- [x] **Inline script refactored**
  - Moved from `index.html` to `js/map/inline-map.js`

- [x] **OpenSky rate limiting**
  - Exponential backoff implemented in `inline-map.js`

- [x] **Yahoo Finance duplicate code documented**
  - Both `js/app.js` and `js/services/yahoo.js` working
  - Documented as tech debt (both in use)

- [x] **Red squares bug resolved**
  - Confirmed as intentional conflict zones with tooltips

## Global Expansion (2 items)

- [x] **Global weather events**
  - `loadGlobalWeatherEvents()` checks major global cities

- [x] **Global military bases**
  - Overpass API queries for worldwide military installations

---

## Summary

| Category | Completed |
|----------|-----------|
| Data Layers | 7 |
| UI/UX | 5 |
| Security | 2 |
| Technical Debt | 4 |
| Global Expansion | 2 |
| **Total** | **20** |

---

## Constraints & Notes

- Live ship tracking (AIS) requires paid API; repo uses free/open sources only
- Overpass layers load only when zoom >= 2.0 to reduce API load
- BestTime API key stored in localStorage (unencrypted)
