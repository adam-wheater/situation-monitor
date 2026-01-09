# situation-monitor

This is a static HTML/JS dashboard that pulls in a bunch of external feeds. Most of those endpoints do **not** allow browser CORS, so you should run it via the included local proxy server.

## Run (recommended)

```bash
python3 proxy_server.py 8001
```

This starts a static file server for the repo root, plus the `/proxy` endpoint for CORS-blocked feeds.

If port `8001` is already in use, pick another (the frontend also probes `8010`):

```bash
python3 proxy_server.py 8010
```

Open:

- http://localhost:8001/
- http://localhost:8010/

## Proxy endpoints

- `GET /proxy/ping` → `ok`
- `/proxy?url=https://example.com/...` → forwards requests server-side (allowlist enforced)

If a feed is blocked upstream (403/401/etc), the proxy will return the real HTTP status code so the UI can show a meaningful error.

## Map layers (notes)

- **Weather warnings**: Uses US NWS alerts (`api.weather.gov`).
- **Flight radar**: Uses OpenSky `states/all` and a simple callsign heuristic to keep it sparse.
- **Nuclear plants + military bases + naval hubs**: Uses OpenStreetMap Overpass (`overpass-api.de`) and only fetches when zoomed in.
	- The **naval “ship” layer** is **infrastructure locations** (naval bases/harbours), not live AIS tracking.
