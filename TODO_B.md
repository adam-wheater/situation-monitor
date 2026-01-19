# Situation Monitor - Pending Tasks (TODO_B)

**Last Updated:** 2026-01-19

## Security (High Priority)

### User Responsibility
- [ ] **Rotate BestTime API key** - Key visible in git history
  - NOTE: Key is stored client-side in localStorage
  - Rotation is user responsibility, not a code change

## Technical Debt (Medium Priority)

- [x] ~~**Consolidate CSS files**~~ (DONE)
  - Removed unused `styles.css` (duplicate of `index.css`)
  - `index.css` (4,369 lines) is now the single source

- [ ] **Add build/bundle step for production**
  - Minification
  - Tree-shaking
  - Bundle optimization

## Feature Requests (Low Priority)

- [ ] **Change world map to a globe in Next.js**
  - Current: 2D Leaflet map
  - Desired: 3D globe visualization

---

## Priority Matrix

| Priority | Category | Count |
|----------|----------|-------|
| HIGH | Security (User Responsibility) | 1 |
| MEDIUM | Technical Debt | 1 |
| LOW | Features | 1 |

**Total Pending:** 3 items

---

## Completed This Session

The following items were completed and moved to TODO_A.md:

- [x] Add `*.log` to `.gitignore` (already present)
- [x] Add authentication to proxy server (Bearer token)
- [x] Refactor large inline script to `js/map/inline-map.js`
- [x] Add rate-limit handling for OpenSky API (exponential backoff)
- [x] Remove duplicate Yahoo Finance code (documented)
- [x] Popups should be clickable not hoverable (click-to-pin)
- [x] Improved click targets when zoomed in (hit radius scaling)
- [x] Toggle for in-air flight display (already implemented)
- [x] Red squares investigation (intentional conflict zones)
- [x] Submarine cables display (fixed in inline-map.js)
- [x] Global weather events (loadGlobalWeatherEvents)
- [x] Global military bases (Overpass API)

- [x] Consolidate CSS files (removed duplicate styles.css)

**Completed This Session:** 13 items
