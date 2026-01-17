# Situation Monitor – Roadmap

## Data Layers

- [x] Add weather warnings to the map (US NWS alerts)
  - Implemented in `index.html:664-749` - fetches from `api.weather.gov/alerts/active`, groups by state, displays severity-colored triangles with tooltips
- [x] Add flight radar for likely military/transport aircraft (OpenSky heuristics)
  - Implemented in `index.html:836-839, 1141-1291` - queries OpenSky `states/all` with callsign filtering, refreshes every ~3 minutes
- [x] Add naval hubs / "ship" layer (OSM infrastructure via Overpass; not live AIS)
  - Implemented in `index.html:1026-1029` - queries `harbour=naval_base` from Overpass when zoomed in
- [x] Ensure Pentagon pizza tracker works (BestTime + curated venues fallback; requires running local proxy)
  - Implemented in `js/panels/pentagon.js` with full BestTime API integration
  - Curated fallback venues in `data/pentagon-curated-venues.json` (8 venues)
- [x] Add regional powers military bases (OSM military=base/naval_base/airfield via Overpass)
  - Implemented in `index.html:1013-1024` - queries `military~^(base|naval_base|airfield|barracks)$` and `landuse=military`
- [x] Add nuclear power plants (OSM nuclear plants/generators via Overpass)
  - Implemented in `index.html:1005-1011` - queries `plant:source=nuclear` and `generator:source=nuclear`

## UI / UX

- [x] When zooming in, make icons smaller so the countries remain visible
  - Implemented in `js/map/zoom.js:68-73` - uses `--sm-marker-scale` CSS variable with `1 / Math.pow(z, 2.0)` formula

## Follow-up Items (Identified in Audit)

- [ ] Add `*.log` to `.gitignore` to prevent API key leakage in proxy logs
- [ ] Refactor large inline script from `index.html` into separate module(s)
- [ ] Add rate-limit handling for OpenSky API (currently no backoff)
- [ ] Add authentication to proxy server endpoint (currently open)
- [ ] Consider consolidating `styles.css` (4828 lines) and `index.css` (4369 lines)

## Constraints / Notes

- Live ship tracking (AIS) generally requires an API key/provider; this repo currently uses free/open sources only.
- Overpass layers only load when zoom level >= 2.0 to avoid clutter and API load.
- BestTime API requires a private key stored in localStorage (unencrypted).
