// CORS proxy and network utilities

let resolvedProxyOrigin = undefined;
let proxyOriginPromise = null;

function normalizeProxyOrigin(origin) {
    if (!origin) return '';
    return String(origin).trim().replace(/\/$/, '');
}

async function probeProxyOrigin(origin, timeoutMs = 800) {
    const normalized = normalizeProxyOrigin(origin);
    const pingUrl = normalized ? `${normalized}/proxy/ping` : '/proxy/ping';
    const controller = new AbortController();
    const t = setTimeout(() => controller.abort(), timeoutMs);
    try {
        const resp = await fetch(pingUrl, { cache: 'no-store', signal: controller.signal });
        if (!resp.ok) return false;
        const text = await resp.text();
        return String(text || '').trim().toLowerCase().startsWith('ok');
    } catch {
        return false;
    } finally {
        clearTimeout(t);
    }
}

async function resolveWorkingProxyOrigin() {
    if (resolvedProxyOrigin !== undefined) return resolvedProxyOrigin;
    if (proxyOriginPromise) return proxyOriginPromise;

    proxyOriginPromise = (async () => {
        const candidates = [];

        // 1) Previously working proxy origin (if any)
        try {
            const stored = normalizeProxyOrigin(getProxyOrigin());
            if (stored) candidates.push(stored);
        } catch { }

        // 2) Common dev ports
        candidates.push('http://localhost:8001', 'http://127.0.0.1:8001');
        candidates.push('http://localhost:8010', 'http://127.0.0.1:8010');

        // 3) Same-origin proxy (only probe if we're likely served by proxy_server.py)
        try {
            const p = String(window.location?.port || '');
            if (p === '8001' || p === '8010') candidates.push('');
        } catch { }

        const seen = new Set();
        for (const cand of candidates) {
            const normalized = normalizeProxyOrigin(cand);
            const key = normalized || '(same-origin)';
            if (seen.has(key)) continue;
            seen.add(key);

            const ok = await probeProxyOrigin(normalized);
            if (ok) {
                resolvedProxyOrigin = normalized;
                saveProxyOrigin(normalized);
                return resolvedProxyOrigin;
            }
        }

        resolvedProxyOrigin = null;
        return null;
    })();

    const out = await proxyOriginPromise;
    proxyOriginPromise = null;
    return out;
}

async function fetchWithProxy(url, options = {}) {
    const accept = options.accept || 'application/rss+xml, application/xml, text/xml, */*';
    const responseType = options.responseType || 'text';
    const tryDirect = options.tryDirect === true;
    const allowProxyFallbackOnNonOk = options.allowProxyFallbackOnNonOk === true;
    const fetchInit = options.fetchInit || {};
    const method = String(fetchInit.method || 'GET').toUpperCase();

    const mergedHeaders = new Headers(fetchInit.headers || {});
    if (accept && !mergedHeaders.has('Accept')) mergedHeaders.set('Accept', accept);

    // 1) Try a working local proxy
    const proxyOrigin = await resolveWorkingProxyOrigin();
    if (proxyOrigin !== null) {
        const proxyUrl = proxyOrigin
            ? `${proxyOrigin}/proxy?url=${encodeURIComponent(url)}`
            : `/proxy?url=${encodeURIComponent(url)}`;
        let gotResponseFromProxy = false;
        try {
            const resp = await fetch(proxyUrl, { ...fetchInit, headers: mergedHeaders });
            gotResponseFromProxy = true;
            if (resp.ok) {
                return responseType === 'json' ? await resp.json() : await resp.text();
            }
            if (!allowProxyFallbackOnNonOk) {
                let detail = '';
                try {
                    const text = await resp.text();
                    detail = String(text || '').trim();
                    if (detail.length > 240) detail = detail.slice(0, 240) + '...';
                } catch { }
                const suffix = detail ? `: ${detail}` : '';
                throw new Error(`Proxy request failed (${resp.status} ${resp.statusText})${suffix}`);
            }
        } catch (e) {
            if (gotResponseFromProxy && !allowProxyFallbackOnNonOk) throw e;
        }
    }

    // 2) Optional direct fetch
    if (tryDirect) {
        try {
            const direct = await fetch(url, { ...fetchInit, headers: mergedHeaders });
            if (direct.ok) {
                return responseType === 'json' ? await direct.json() : await direct.text();
            }
        } catch { }
    }

    // Public proxies only make sense for simple GETs
    if (method !== 'GET') {
        throw new Error('No working local proxy available for non-GET request');
    }

    // 3) Fall back to public proxies
    let lastNonOk = null;
    for (let i = 0; i < CORS_PROXIES.length; i++) {
        try {
            const proxy = CORS_PROXIES[i];
            const response = await fetch(proxy + encodeURIComponent(url), { headers: mergedHeaders });
            if (response.ok) {
                return responseType === 'json' ? await response.json() : await response.text();
            }
            lastNonOk = { status: response.status, statusText: response.statusText, proxy };
        } catch {
            console.log(`Proxy ${i} failed, trying next...`);
        }
    }
    const suffix = lastNonOk ? ` (last: ${lastNonOk.status} ${lastNonOk.statusText} via ${lastNonOk.proxy})` : '';
    throw new Error('All proxies failed' + suffix);
}
