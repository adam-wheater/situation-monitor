# situation-monitor

This is a static HTML/JS dashboard that pulls in a bunch of external feeds. Most of those endpoints do **not** allow browser CORS, so you should run it via the included local proxy server.

## Run (recommended)

```bash
python3 proxy_server.py 8001
```

If port `8001` is already in use, pick another (the frontend also probes `8010`):

```bash
python3 proxy_server.py 8010
```

Open:

- http://localhost:8001/

- http://localhost:8001/
- http://localhost:8010/

## Proxy endpoints

- `GET /proxy/ping` → `ok`
- `/proxy?url=https://example.com/...` → forwards requests server-side (allowlist enforced)

If a feed is blocked upstream (403/401/etc), the proxy will return the real HTTP status code so the UI can show a meaningful error.
