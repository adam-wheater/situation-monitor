# Situation Monitor – Task Index

> **Note:** This roadmap has been split into separate files for clarity.
> See [AUDIT.md](./AUDIT.md) for the full codebase audit report.

## Task Files

| File | Contents |
|------|----------|
| [TODO_A.md](./TODO_A.md) | Completed features (7 items) |
| [TODO_B.md](./TODO_B.md) | Pending tasks (16 items) |
| [AUDIT.md](./AUDIT.md) | Security & code quality audit |

## Quick Summary

### Completed (7)
- Weather warnings (US NWS)
- Flight radar (OpenSky)
- Naval hubs (Overpass)
- Pentagon tracker (BestTime)
- Military bases (Overpass)
- Nuclear plants (Overpass)
- Zoom-based icon scaling

### Pending by Priority
- **High (Security):** 3 items
- **Medium (Tech Debt):** 5 items
- **Low (Features/Bugs):** 8 items

## Constraints / Notes

- Live ship tracking (AIS) requires paid API; repo uses free/open sources only
- Overpass layers load only at zoom >= 2.0
- BestTime API key stored in localStorage (unencrypted)
