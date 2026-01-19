# Situation Monitor – Task Index

> **Note:** This roadmap has been split into separate files for clarity.
> See [AUDIT.md](./AUDIT.md) for the full codebase audit report.

## Task Files

| File | Contents |
|------|----------|
| [TODO_A.md](./TODO_A.md) | Completed features (7 items) |
| [TODO_B.md](./TODO_B.md) | Pending tasks (4 items remaining) |
| [AUDIT.md](./AUDIT.md) | Security & code quality audit |

## Quick Summary

### Completed (19)
- Weather warnings (US NWS)
- Flight radar (OpenSky)
- Naval hubs (Overpass)
- Pentagon tracker (BestTime)
- Military bases (Overpass)
- Nuclear plants (Overpass)
- Zoom-based icon scaling
- Proxy authentication (Bearer token)
- OpenSky rate limiting
- Clickable popups (pin on click)
- Submarine cables display
- Conflict zone tooltips
- Global weather events
- Global military bases

### Pending by Priority
- **High (Security):** 1 item (BestTime key rotation - user responsibility)
- **Medium (Tech Debt):** 2 items (CSS consolidation, build step)
- **Low (Features):** 1 item (Next.js globe)

## Constraints / Notes

- Live ship tracking (AIS) requires paid API; repo uses free/open sources only
- Overpass layers load only at zoom >= 2.0
- BestTime API key stored in localStorage (unencrypted)

## Test Status

All 278 tests passing (9 test files).
