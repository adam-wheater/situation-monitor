#!/usr/bin/env python3
"""Static file server + local proxy for development.

Run:
  python3 proxy_server.py 8001
Then open:
  http://localhost:8001/

Endpoints:
  - /proxy/ping
      Returns 200 "ok". Used by the frontend to discover a working proxy.
  - /proxy?url=https://example.com/...
      Proxies the request server-side and returns the upstream response body.
      Only allows hosts in ALLOWED_HOSTS.

Notes:
  - Intended for local development only.
  - Adds Access-Control-Allow-Origin: * on proxy responses.
"""

from __future__ import annotations

import http.server
import socketserver
import os
import sys
import urllib.parse
import urllib.request
import urllib.error


ALLOWED_HOSTS = {
    # CDNs (world-atlas / us-atlas TopoJSON fallbacks)
    "cdn.jsdelivr.net",
    # BestTime
    "besttime.app",
    "www.besttime.app",
    # RSS/news sources (representative; you can extend)
    "feeds.bbci.co.uk",
    "feeds.npr.org",
    "www.theguardian.com",
    "www.reutersagency.com",
    "reutersagency.com",
    "hnrss.org",
    "feeds.arstechnica.com",
    "www.theverge.com",
    "www.technologyreview.com",
    "rss.arxiv.org",
    "openai.com",
    "www.ft.com",
    "feeds.marketwatch.com",
    "feeds.content.dowjones.io",
    "news.google.com",
    "www.whitehouse.gov",
    "www.federalreserve.gov",
    "www.sec.gov",
    "home.treasury.gov",
    "www.state.gov",
    "gamma-api.polymarket.com",
    "api.stlouisfed.org",
    "earthquake.usgs.gov",
    "query1.finance.yahoo.com",
    "api.coingecko.com",
    "api.usaspending.gov",
    # Inline global map sources
    "api.open-meteo.com",
    "api.gdeltproject.org",
    "opensky-network.org",
    "api.weather.gov",
    # OpenStreetMap Overpass (for bases / nuclear plants layers)
    "overpass-api.de",
    "www.csis.org",
    "www.brookings.edu",
    "www.cfr.org",
    "cdn.cfr.org",
    "www.defenseone.com",
    "warontherocks.com",
    "breakingdefense.com",
    "www.thedrive.com",
    "www.twz.com",
    "www.al-monitor.com",
    "www.bellingcat.com",
    "thediplomat.com",
    "krebsonsecurity.com",
    "www.cisa.gov",
    "huggingface.co",
    "deepmind.google",
    "ai.meta.com",
    "www.anthropic.com",
}


# Serve static files from the repo root (this file lives in the repo root).
BASE_DIR = os.path.abspath(os.path.dirname(os.path.abspath(__file__)))


class ReusableTCPServer(socketserver.ThreadingTCPServer):
    allow_reuse_address = True


class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        # Always serve static files relative to the repo directory, not the process CWD.
        super().__init__(*args, directory=BASE_DIR, **kwargs)

    def _send_cors_headers(self):
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "*")

    def do_OPTIONS(self):
        self.send_response(204)
        self._send_cors_headers()
        self.end_headers()

    def do_GET(self):
        return self._route()

    def do_HEAD(self):
        return self._route()

    def do_POST(self):
        return self._route()

    def do_PUT(self):
        return self._route()

    def do_PATCH(self):
        return self._route()

    def do_DELETE(self):
        return self._route()

    def _route(self):
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path.rstrip("/")

        if path == "/proxy/ping":
            return self._send_text(200, "ok")

        if path == "/proxy":
            if parsed.query == "ping":
                return self._send_text(200, "ok")
            return self._handle_proxy(parsed)

        # Static files
        if self.command == "GET":
            return super().do_GET()
        if self.command == "HEAD":
            return super().do_HEAD()
        return self._send_text(405, "Method not allowed")

    def _handle_proxy(self, parsed: urllib.parse.ParseResult):
        qs = urllib.parse.parse_qs(parsed.query)
        raw_url = (qs.get("url") or [""])[0]
        if not raw_url:
            return self._send_text(400, "Missing url parameter")

        try:
            target = urllib.parse.urlparse(raw_url)
        except Exception:
            return self._send_text(400, "Invalid url")

        if target.scheme not in ("http", "https"):
            return self._send_text(400, "Only http/https allowed")

        host = (target.hostname or "").lower()
        if host not in ALLOWED_HOSTS:
            return self._send_text(403, f"Host not allowed: {host}")

        accept = self.headers.get("Accept") or "*/*"
        content_type = self.headers.get("Content-Type")
        accept_language = self.headers.get("Accept-Language") or "en-US,en;q=0.9"
        client_ua = self.headers.get("User-Agent")

        body = None
        if self.command in ("POST", "PUT", "PATCH", "DELETE"):
            try:
                length = int(self.headers.get("Content-Length") or "0")
            except Exception:
                length = 0
            if length > 0:
                body = self.rfile.read(length)

        upstream_headers = {
            "Accept": accept,
            "Accept-Language": accept_language,
            # Ask for encodings browsers can transparently decode.
            "Accept-Encoding": "gzip, deflate",
            # Many upstreams block unknown/empty UAs.
            "User-Agent": client_ua or "Mozilla/5.0 (Macintosh; Intel Mac OS X) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36",
        }
        if content_type:
            upstream_headers["Content-Type"] = content_type

        req = urllib.request.Request(
            raw_url,
            data=body,
            headers=upstream_headers,
            method=self.command,
        )

        def send_upstream_response(status: int, headers, body: bytes | None):
            resp_ct = headers.get("Content-Type") if headers else None
            resp_ce = headers.get("Content-Encoding") if headers else None

            self.send_response(status)
            if resp_ct:
                self.send_header("Content-Type", resp_ct)
            if resp_ce:
                self.send_header("Content-Encoding", resp_ce)
            self.send_header("Cache-Control", "no-store")
            self._send_cors_headers()
            self.end_headers()
            if self.command != "HEAD" and body is not None:
                self.wfile.write(body)

        try:
            with urllib.request.urlopen(req, timeout=20) as resp:
                send_upstream_response(getattr(resp, "status", 200), resp.headers, resp.read())
        except urllib.error.HTTPError as e:
            # Preserve upstream status/body (e.g. 401/403/404) instead of masking everything as 502.
            try:
                body = e.read()
            except Exception:
                body = None
            send_upstream_response(getattr(e, "code", 502), getattr(e, "headers", None), body)
        except Exception as e:
            return self._send_text(502, f"Proxy fetch failed: {e}")

    def _send_text(self, status: int, text: str):
        data = (text + "\n").encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "text/plain; charset=utf-8")
        self.send_header("Cache-Control", "no-store")
        self._send_cors_headers()
        self.end_headers()
        if self.command != "HEAD":
            self.wfile.write(data)


def main():
    port = 8001
    if len(sys.argv) > 1:
        port = int(sys.argv[1])

    try:
        with ReusableTCPServer(("", port), Handler) as httpd:
            print(f"Serving on http://localhost:{port}/ (with /proxy)")
            httpd.serve_forever()
    except OSError as e:
        # macOS commonly raises Errno 48 when the port is in use.
        if getattr(e, "errno", None) in (48, 98):
            print(f"Port {port} is already in use.")
            print(f"Try:  python3 proxy_server.py 8010")
            print(f"Or:   lsof -i :{port}  # find the process using the port")
            raise SystemExit(1)
        raise


if __name__ == "__main__":
    main()
