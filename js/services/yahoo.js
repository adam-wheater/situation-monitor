// Yahoo Finance API service

const YAHOO_QUOTE_CACHE_TTL_MS = 2 * 60 * 1000;
const yahooQuoteCache = new Map();
let yahooQuoteInflight = null;
let yahooBlockUntilMs = 0;

async function fetchYahooQuotes(symbols) {
    const now = Date.now();
    const uniq = Array.from(new Set((symbols || []).map(s => String(s || '').trim()).filter(Boolean)));
    if (!uniq.length) return new Map();

    // Only request symbols that are missing or stale
    const needed = [];
    for (const sym of uniq) {
        const cached = yahooQuoteCache.get(sym);
        if (!cached || (now - cached.ts) > YAHOO_QUOTE_CACHE_TTL_MS) needed.push(sym);
    }

    if (needed.length) {
        // If Yahoo is rate-limiting us, back off for a while
        if (now < yahooBlockUntilMs) {
            const out = new Map();
            for (const sym of uniq) {
                const cached = yahooQuoteCache.get(sym);
                out.set(sym, cached?.quote || null);
            }
            return out;
        }

        if (!yahooQuoteInflight) {
            yahooQuoteInflight = (async () => {
                // Batch fetch to reduce 429s
                const url = new URL('https://query1.finance.yahoo.com/v7/finance/quote');
                url.searchParams.set('symbols', needed.join(','));
                const data = await fetchWithProxy(url.toString(), {
                    responseType: 'json',
                    accept: 'application/json, text/plain, */*',
                });

                const results = Array.isArray(data?.quoteResponse?.result) ? data.quoteResponse.result : [];
                for (const r of results) {
                    const sym = String(r?.symbol || '').trim();
                    if (!sym) continue;
                    yahooQuoteCache.set(sym, { ts: Date.now(), quote: r });
                }
            })()
                .catch((e) => {
                    const msg = String(e?.message || e || '');
                    if (msg.includes('429')) {
                        yahooBlockUntilMs = Date.now() + (15 * 60 * 1000);
                    }
                    console.warn('Yahoo quote fetch failed:', msg || e);
                })
                .finally(() => {
                    yahooQuoteInflight = null;
                });
        }

        await yahooQuoteInflight;
    }

    const out = new Map();
    for (const sym of uniq) {
        const cached = yahooQuoteCache.get(sym);
        out.set(sym, cached?.quote || null);
    }
    return out;
}

function computeYahooChangePercent(quote) {
    const price = quote?.regularMarketPrice;
    const prev = quote?.regularMarketPreviousClose;
    if (Number.isFinite(price) && Number.isFinite(prev) && prev !== 0) {
        return ((price - prev) / prev) * 100;
    }
    const pct = quote?.regularMarketChangePercent;
    if (Number.isFinite(pct)) return pct;
    return null;
}

async function fetchQuote(symbol) {
    try {
        const map = await fetchYahooQuotes([symbol]);
        const q = map.get(symbol) || null;
        if (!q) return null;

        const price = q?.regularMarketPrice;
        const change = computeYahooChangePercent(q);
        if (!Number.isFinite(price) || !Number.isFinite(change)) return null;
        return { price, change };
    } catch (error) {
        console.warn(`Error fetching ${symbol}:`, error?.message || error);
    }
    return null;
}

async function fetchMarkets() {
    const markets = [];

    const symbols = [
        { symbol: '^GSPC', name: 'S&P 500', display: 'SPX' },
        { symbol: '^DJI', name: 'Dow Jones', display: 'DJI' },
        { symbol: '^IXIC', name: 'NASDAQ', display: 'NDX' },
        { symbol: 'AAPL', name: 'Apple', display: 'AAPL' },
        { symbol: 'MSFT', name: 'Microsoft', display: 'MSFT' },
        { symbol: 'NVDA', name: 'NVIDIA', display: 'NVDA' },
        { symbol: 'GOOGL', name: 'Alphabet', display: 'GOOGL' },
        { symbol: 'AMZN', name: 'Amazon', display: 'AMZN' },
        { symbol: 'META', name: 'Meta', display: 'META' },
        { symbol: 'BRK-B', name: 'Berkshire', display: 'BRK.B' },
        { symbol: 'TSM', name: 'TSMC', display: 'TSM' },
        { symbol: 'LLY', name: 'Eli Lilly', display: 'LLY' },
        { symbol: 'TSLA', name: 'Tesla', display: 'TSLA' },
        { symbol: 'AVGO', name: 'Broadcom', display: 'AVGO' },
        { symbol: 'WMT', name: 'Walmart', display: 'WMT' },
        { symbol: 'JPM', name: 'JPMorgan', display: 'JPM' },
        { symbol: 'V', name: 'Visa', display: 'V' },
        { symbol: 'UNH', name: 'UnitedHealth', display: 'UNH' },
        { symbol: 'NVO', name: 'Novo Nordisk', display: 'NVO' },
        { symbol: 'XOM', name: 'Exxon', display: 'XOM' },
        { symbol: 'MA', name: 'Mastercard', display: 'MA' },
        { symbol: 'ORCL', name: 'Oracle', display: 'ORCL' },
        { symbol: 'PG', name: 'P&G', display: 'PG' },
        { symbol: 'COST', name: 'Costco', display: 'COST' },
        { symbol: 'JNJ', name: 'J&J', display: 'JNJ' },
        { symbol: 'HD', name: 'Home Depot', display: 'HD' },
        { symbol: 'NFLX', name: 'Netflix', display: 'NFLX' },
        { symbol: 'BAC', name: 'BofA', display: 'BAC' }
    ];

    const quoteMap = await fetchYahooQuotes(symbols.map(s => s.symbol));
    for (const s of symbols) {
        const q = quoteMap.get(s.symbol);
        if (!q) continue;
        const price = q?.regularMarketPrice;
        const change = computeYahooChangePercent(q);
        if (!Number.isFinite(price) || !Number.isFinite(change)) continue;
        markets.push({ name: s.name, symbol: s.display, price, change });
    }

    // Crypto
    try {
        const crypto = await fetchWithProxy(
            'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,solana&vs_currencies=usd&include_24hr_change=true',
            { responseType: 'json', tryDirect: true, accept: 'application/json, text/plain, */*' }
        );

        if (crypto.bitcoin) markets.push({ name: 'Bitcoin', symbol: 'BTC', price: crypto.bitcoin.usd, change: crypto.bitcoin.usd_24h_change });
        if (crypto.ethereum) markets.push({ name: 'Ethereum', symbol: 'ETH', price: crypto.ethereum.usd, change: crypto.ethereum.usd_24h_change });
        if (crypto.solana) markets.push({ name: 'Solana', symbol: 'SOL', price: crypto.solana.usd, change: crypto.solana.usd_24h_change });
    } catch (error) {
        console.error('Error fetching crypto:', error);
    }

    return markets;
}

async function fetchSectors() {
    const quoteMap = await fetchYahooQuotes(SECTORS.map(s => s.symbol));
    return SECTORS.map((s) => {
        const q = quoteMap.get(s.symbol);
        const change = q ? computeYahooChangePercent(q) : null;
        return { name: s.name, symbol: s.symbol, change: Number.isFinite(change) ? change : null };
    });
}

async function fetchCommodities() {
    const results = [];
    const quoteMap = await fetchYahooQuotes(COMMODITIES.map(c => c.symbol));
    for (const c of COMMODITIES) {
        const q = quoteMap.get(c.symbol);
        if (!q) continue;
        const price = q?.regularMarketPrice;
        const change = computeYahooChangePercent(q);
        if (!Number.isFinite(price) || !Number.isFinite(change)) continue;
        results.push({ name: c.name, symbol: c.display, price, change });
    }
    return results;
}
