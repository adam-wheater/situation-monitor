# Situation Monitor - Completed Features (TODO_A)

**Last Updated:** 2026-01-19

## Data Layers (Completed)

- [x] **Weather warnings (US NWS alerts)**
  - Location: `index.html:664-749`
  - Fetches from `api.weather.gov/alerts/active`
  - Groups by state, displays severity-colored triangles with tooltips

- [x] **Flight radar (OpenSky heuristics)**
  - Location: `index.html:836-839, 1141-1291`
  - Queries OpenSky `states/all` with callsign filtering
  - Refreshes every ~3 minutes

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

## UI/UX (Completed)

- [x] **Zoom-based icon scaling**
  - Location: `js/map/zoom.js:68-73`
  - Uses `--sm-marker-scale` CSS variable
  - Formula: `1 / Math.pow(z, 2.0)`

## Constraints & Notes

- Live ship tracking (AIS) requires paid API; repo uses free/open sources only
- Overpass layers load only when zoom >= 2.0 to reduce API load
- BestTime API key stored in localStorage (unencrypted)
