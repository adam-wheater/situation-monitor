# Situation Monitor - Pending Tasks (TODO_B)

**Last Updated:** 2026-01-19

## Security (High Priority)

- [ ] Add `*.log` to `.gitignore` to prevent API key leakage in proxy logs
- [ ] Add authentication to proxy server endpoint (currently open to any origin)
- [ ] Rotate exposed BestTime API key (visible in git history)

## Technical Debt (Medium Priority)

- [ ] Refactor large inline script from `index.html` into separate module(s)
- [ ] Add rate-limit handling for OpenSky API (currently no backoff)
- [ ] Consolidate `styles.css` (4828 lines) and `index.css` (4369 lines)
- [ ] Remove duplicate Yahoo Finance code between `js/app.js` and `js/services/yahoo.js`
- [ ] Add build/bundle step for production (minification, tree-shaking)

## Feature Requests

- [ ] Change world map to a globe in Next.js
- [ ] Popups should be clickable not hoverable
- [ ] When zoomed in, hard to click events next to each other (improve click targets)
- [ ] Toggle for in-air flight display (not just nearby aircraft)

## Bugs to Investigate

- [ ] Random red squares over countries?
- [ ] Submarine cables are not showing?

## Global Expansion

- [ ] Weather events worldwide (currently US NWS only)
- [ ] Global military bases (currently regional via Overpass)

---

## Priority Matrix

| Priority | Category | Count |
|----------|----------|-------|
| HIGH | Security | 3 |
| MEDIUM | Technical Debt | 5 |
| LOW | Features | 4 |
| LOW | Bugs | 2 |
| LOW | Global Expansion | 2 |

**Total Pending:** 16 items
