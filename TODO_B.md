# Situation Monitor – Pending Tasks (TODO_B)

**Last Updated:** 2026-01-19

---

## High Priority (Security)

### User Responsibility

- [ ] **Rotate BestTime API key**
  - Key may be visible in git history
  - Key is stored client-side in localStorage (unencrypted)
  - Rotation is user responsibility, not a code change
  - Location: `js/panels/pentagon.js:14-18`

---

## Medium Priority (Technical Debt)

- [x] **Add build/bundle step for production** (DONE)
  - ~~Currently serving raw JS/CSS files~~
  - Implemented with Vite:
    - Minification via esbuild
    - Tree-shaking
    - Bundle optimization
  - Files added:
    - `vite.config.js` - Vite build configuration
    - `js/main.js` - ES module entry point
  - Scripts added to `package.json`:
    - `npm run dev` - Development server
    - `npm run build` - Production build to `dist/`
    - `npm run preview` - Preview production build
  - Build output: ~101KB JS (30KB gzipped), ~65KB CSS (11KB gzipped)

---

## Low Priority (Features)

- [x] **Add 3D globe visualization toggle** (DONE)
  - ~~Current: 2D D3.js/TopoJSON map only~~
  - Implemented 2D/3D toggle button in map panel header
  - Files added:
    - `js/map/view-toggle.js` - Toggle logic and globe initialization
  - Features:
    - Click toggle button to switch between 2D (D3) and 3D (Globe.gl)
    - Preference saved to localStorage
    - Globe shows countries, conflict zones, and hotspots
  - Note: Does not require Next.js migration

---

## Priority Matrix

| Priority | Category | Count | Notes |
|----------|----------|-------|-------|
| HIGH | Security | 1 | User action required |
| MEDIUM | Technical Debt | 0 | Build step completed |
| LOW | Features | 0 | Globe toggle completed |

**Total Pending:** 1 item (user responsibility)

---

## Completed This Session

The following items were addressed:

| Item | Status |
|------|--------|
| Add `*.log` to `.gitignore` | Already present |
| Add authentication to proxy server | Bearer token implemented |
| Refactor inline script to module | `js/map/inline-map.js` |
| Add rate-limit handling for OpenSky | Exponential backoff |
| Consolidate CSS files | Removed duplicate `styles.css` |
| Popups should be clickable | Click-to-pin implemented |
| Improved click targets when zoomed | Hit radius scaling |
| Toggle for in-air flight display | Already implemented |
| Red squares investigation | Confirmed as conflict zones |
| Submarine cables display | Fixed in inline-map.js |
| Global weather events | `loadGlobalWeatherEvents()` |
| Global military bases | Overpass worldwide queries |
| Yahoo Finance duplicate | Documented as intentional |
| **Add build/bundle step** | Vite + esbuild |
| **3D globe visualization** | Toggle between 2D/3D |
| Fix app.js syntax error | Closed unclosed `initApp()` function |

**Completed This Session:** 16 items

---

## Tests Added

- `tests/unit/view-toggle.test.js` - 19 tests for 2D/3D toggle
- `tests/unit/build-config.test.js` - 44 tests for build configuration

**Total Tests:** 341 passing (was 278)

---

## Constraints & Notes

- Live ship tracking (AIS) requires paid API – repo uses free/open sources only
- Overpass layers load only when zoom ≥ 2.0 to reduce API load
- BestTime API key stored in localStorage (unencrypted)
- Proxy server requires `PROXY_AUTH_TOKEN` env var for production security
- Build output goes to `dist/` directory (gitignored)
