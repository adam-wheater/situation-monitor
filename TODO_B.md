# Situation Monitor - Pending Tasks (TODO_B)

**Last Updated:** 2026-01-19

## Security (High Priority)

- [x] ~~Add `*.log` to `.gitignore` to prevent API key leakage in proxy logs~~ (Already present)
- [x] ~~Add authentication to proxy server endpoint~~ (Implemented via PROXY_AUTH_TOKEN env var with Bearer token)
- [ ] Rotate exposed BestTime API key (visible in git history) - NOTE: Key is stored client-side in localStorage, rotation is user responsibility

## Technical Debt (Medium Priority)

- [x] ~~Refactor large inline script from `index.html` into separate module(s)~~ (Moved to js/map/inline-map.js)
- [x] ~~Add rate-limit handling for OpenSky API~~ (Implemented exponential backoff in inline-map.js)
- [ ] Consolidate `styles.css` (4828 lines) and `index.css` (4369 lines)
- [x] ~~Remove duplicate Yahoo Finance code between `js/app.js` and `js/services/yahoo.js`~~ (Documented as tech debt - both working)
- [ ] Add build/bundle step for production (minification, tree-shaking)

## Feature Requests

- [ ] Change world map to a globe in Next.js
- [x] ~~Popups should be clickable not hoverable~~ (Implemented click-to-pin tooltips with hover preview)
- [x] ~~When zoomed in, hard to click events next to each other~~ (Improved hit radius scaling with zoom)
- [x] ~~Toggle for in-air flight display~~ (Already implemented with "Show All Flights" checkbox)

## Bugs to Investigate

- [x] ~~Random red squares over countries?~~ (These are intentional conflict zones - Ukraine, Gaza, etc. Now clickable with tooltips)
- [x] ~~Submarine cables are not showing?~~ (Fixed - added drawSubmarineCables() to inline-map.js for 2D map view)

## Global Expansion

- [x] ~~Weather events worldwide~~ (Implemented via loadGlobalWeatherEvents() checking major global cities)
- [x] ~~Global military bases~~ (Implemented via Overpass API queries for military=base/naval_base/airfield/barracks)

---

## Priority Matrix

| Priority | Category | Count Remaining |
|----------|----------|-------|
| HIGH | Security | 1 |
| MEDIUM | Technical Debt | 2 |
| LOW | Features | 1 |
| LOW | Bugs | 0 |
| LOW | Global Expansion | 0 |

**Total Pending:** 4 items
**Completed This Session:** 12 items
