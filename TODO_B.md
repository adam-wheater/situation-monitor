# Situation Monitor – Pending Tasks (TODO_B)

**Last Updated:** 2026-01-20

---

## High Priority (Security)

### User Responsibility

- [ ] **Rotate BestTime API key**
  - Key may be visible in git history
  - Key is stored client-side in localStorage (unencrypted)
  - Rotation is user responsibility, not a code change
  - Location: `js/panels/pentagon.js:14-18`
  - Risk: XSS vulnerability would expose stored API key

---

## Priority Matrix

| Priority | Category | Count | Notes |
|----------|----------|-------|-------|
| HIGH | Security | 1 | User action required |

**Total Pending:** 1 item (user responsibility)

---

## Constraints & Notes

- Live ship tracking (AIS) requires paid API – repo uses free/open sources only
- Overpass layers load only when zoom ≥ 2.0 to reduce API load
- BestTime API key stored in localStorage (unencrypted)
- Proxy server requires `PROXY_AUTH_TOKEN` env var for production security
- Build output goes to `dist/` directory (gitignored)

---

## Recently Completed

The following items have been moved to TODO_A.md:

| Item | Status | Notes |
|------|--------|-------|
| Build/bundle step (Vite + esbuild) | ✓ Done | `npm run build` |
| 3D globe visualization toggle | ✓ Done | `js/map/view-toggle.js` |
| App.js syntax error | ✓ Done | Closed unclosed function |

See [TODO_A.md](./TODO_A.md) for the complete list of 23 completed features.
