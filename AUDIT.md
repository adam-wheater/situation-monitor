# Situation Monitor – Audit Report

**Date:** 2026-01-17
**Branch:** `ai-loop`
**Auditor:** Claude Code (Opus 4.5)

---

## Executive Summary

All original TODO items have been **completed**. The application is a real-time geopolitical intelligence dashboard with 24 panels, 90+ external API integrations, and a 3D globe map. The codebase is functional but has several security and maintainability concerns that should be addressed.

---

## 1. Feature Completion Status

| Feature | Status | Location |
|---------|--------|----------|
| Weather warnings (NWS) | **DONE** | `index.html:664-749` |
| Flight radar (OpenSky) | **DONE** | `index.html:836-1291` |
| Naval hubs (Overpass) | **DONE** | `index.html:1026-1029` |
| Pentagon tracker (BestTime) | **DONE** | `js/panels/pentagon.js` |
| Military bases (Overpass) | **DONE** | `index.html:1013-1024` |
| Nuclear plants (Overpass) | **DONE** | `index.html:1005-1011` |
| Zoom icon scaling | **DONE** | `js/map/zoom.js:68-73` |

---

## 2. Security Findings

### 2.1 CRITICAL: API Key Exposed in Logs

**Finding:** BestTime API private key appears in `.proxy_server_8001.log` in plaintext URL parameters.

**Evidence:**
```
GET /proxy?url=https://besttime.app/api/v1/venues/filter?api_key_private=pri_bbaecd7bd4c646bda48f56400bc9daa5...
```

**Risk:** If log files are committed or shared, API keys will be exposed.

**Recommendation:**
1. Add `*.log` to `.gitignore` immediately
2. Rotate the exposed BestTime API key
3. Consider redacting query parameters in proxy logs

### 2.2 HIGH: Proxy Server Has No Authentication

**Finding:** `proxy_server.py` accepts requests from any origin without authentication.

**Location:** `proxy_server.py:1-262`

**Risk:** Open proxy could be abused for SSRF attacks or to bypass rate limits on allowlisted APIs.

**Recommendation:** Add localhost-only binding or implement token-based authentication.

### 2.3 MEDIUM: API Keys Stored in localStorage Unencrypted

**Finding:** BestTime API key is stored in `localStorage` as plaintext JSON.

**Location:** `js/panels/pentagon.js:14-18`

**Risk:** Any XSS vulnerability would expose stored API keys.

**Recommendation:** Consider using httpOnly cookies or encrypted storage for sensitive keys.

### 2.4 LOW: Broad Proxy Allowlist

**Finding:** 90+ domains in proxy allowlist, some of which may have overly broad access.

**Location:** `proxy_server.py:35-90`

**Risk:** Wide attack surface if any allowlisted domain is compromised.

---

## 3. Code Quality Findings

### 3.1 Large Inline Script Block

**Finding:** `index.html` contains a ~1000+ line inline `<script>` block with all map rendering logic.

**Impact:**
- Hard to maintain and test
- No code reuse possible
- All map logic tightly coupled

**Recommendation:** Extract into `js/map/renderer.js` module.

### 3.2 Duplicate Code

**Finding:** `js/app.js` duplicates code from `js/services/yahoo.js` (yahooQuoteInflight pattern).

**Locations:**
- `js/app.js:1736-1794`
- `js/services/yahoo.js:5-60`

**Recommendation:** Remove duplicate and import from single source.

### 3.3 Large CSS Files

**Finding:** Combined 9,197 lines of CSS across two files.

| File | Lines |
|------|-------|
| `styles.css` | 4,828 |
| `index.css` | 4,369 |

**Recommendation:** Audit for dead CSS, consolidate, and consider CSS modules or utility classes.

### 3.4 No Minification or Bundling

**Finding:** No build step visible. All assets served unminified.

**Impact:** Larger payload, slower load times, no tree-shaking.

**Recommendation:** Add build step (esbuild, Vite, or similar) for production.

---

## 4. API Integration Analysis

### 4.1 Rate Limiting Concerns

| API | Rate Limit Handling | Status |
|-----|---------------------|--------|
| Yahoo Finance | 15-min backoff on 429 | OK |
| OpenSky | No backoff | **MISSING** |
| Overpass | 20s cache, inFlight guard | OK |
| NWS | No explicit handling | OK (generous limits) |

**Recommendation:** Add exponential backoff for OpenSky API.

### 4.2 Caching Strategy

| Layer | Cache Duration |
|-------|----------------|
| Yahoo quotes | 2 min TTL |
| Overpass | Session memory |
| OpenSky flights | Session memory |
| Congress trades | No cache |

**Note:** Congress trades fetches 15MB+ S3 data on each load. Consider caching.

---

## 5. Architecture Overview

```
Frontend (Vanilla JS)
├── index.html (entry + inline map script)
├── js/
│   ├── app.js (4,598 lines) - panel orchestration
│   ├── constants.js - configuration data
│   ├── core/ - proxy, utils, storage
│   ├── map/ - globe, zoom, popups, loaders
│   ├── services/ - feeds, yahoo, api
│   └── panels/ - 11 panel modules
├── styles.css + index.css
└── data/ - static GeoJSON, curated venues

Backend (Python)
└── proxy_server.py - CORS proxy + static server
```

---

## 6. Recommendations Summary

### Immediate (Security)
1. **Add `*.log` to `.gitignore`** - prevents API key leakage
2. **Rotate exposed BestTime API key** - current key is in git history

### Short-term (Stability)
3. Add rate-limit handling for OpenSky
4. Add localhost binding to proxy server
5. Cache Congress trades data

### Medium-term (Maintainability)
6. Extract inline map script to module
7. Remove duplicate Yahoo code
8. Add build/bundle step
9. Consolidate CSS files

---

## 7. Files Reviewed

- `index.html` (1,567 lines)
- `js/app.js` (4,598 lines)
- `js/panels/pentagon.js` (206 lines)
- `js/map/zoom.js` (226 lines)
- `js/constants.js`
- `proxy_server.py` (262 lines)
- `data/pentagon-curated-venues.json`
- `styles.css` (4,828 lines)
- `index.css` (4,369 lines)
- `.gitignore`
- `README.md`
- `TODO.md`

---

## 8. Conclusion

The Situation Monitor is a comprehensive geopolitical intelligence dashboard with all planned features implemented. The primary concerns are:

1. **Security:** API key exposure in logs and unprotected proxy endpoint
2. **Maintainability:** Large inline scripts and duplicated code
3. **Performance:** No build optimization or asset minification

The application is functional for development/demo purposes. Before production deployment, address the security findings and implement proper build tooling.

---

*End of Audit Report*
