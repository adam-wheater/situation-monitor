# Situation Monitor – Task Index

> **Note:** This roadmap is split into separate files for clarity.
> See [AUDIT.md](./AUDIT.md) for the full codebase audit report.

## Task Files

| File | Contents |
|------|----------|
| [TODO_A.md](./TODO_A.md) | Completed features (20 items) |
| [TODO_B.md](./TODO_B.md) | Pending tasks (1 item) |
| [AUDIT.md](./AUDIT.md) | Security & code quality audit |

## Quick Summary

### Completed (22)
- Weather warnings (US NWS alerts)
- Flight radar (OpenSky heuristics)
- Naval hubs (Overpass)
- Pentagon tracker (BestTime API)
- Military bases (Overpass)
- Nuclear plants (Overpass)
- Zoom-based icon scaling
- Proxy authentication (Bearer token)
- OpenSky rate limiting (exponential backoff)
- Clickable popups (click-to-pin)
- Submarine cables display
- Conflict zone tooltips
- Global weather events
- Global military bases
- Log files excluded from git
- Inline script refactored to module
- CSS files consolidated
- Yahoo Finance duplicate documented
- Red squares bug resolved (conflict zones)
- Improved click targets (hit radius scaling)
- **Build/bundle step (Vite + esbuild)**
- **3D globe toggle (2D/3D view switching)**

### Pending (1)

| Priority | Item | Notes |
|----------|------|-------|
| HIGH | BestTime API key rotation | User responsibility |

## Build Commands

```bash
# Development server with hot reload
npm run dev

# Production build to dist/
npm run build

# Preview production build
npm run preview

# Run tests
npm run test
```

## Constraints & Notes

- Live ship tracking (AIS) requires paid API; repo uses free/open sources only
- Overpass layers load only at zoom ≥ 2.0 to reduce API load
- BestTime API key stored in localStorage (unencrypted)
- Production build outputs to `dist/` directory

## Test Status

**All 341 tests passing** (11 test files)

| Test File | Tests |
|-----------|-------|
| zoom-scaling.test.js | 34 |
| inline-map.test.js | 52 |
| data-loaders.test.js | 26 |
| pentagon-tracker.test.js | 31 |
| curated-venues.test.js | 19 |
| weather-alerts.test.js | 19 |
| overpass-layers.test.js | 41 |
| flight-radar.test.js | 36 |
| proxy-auth.test.js | 20 |
| view-toggle.test.js | 19 |
| build-config.test.js | 44 |
