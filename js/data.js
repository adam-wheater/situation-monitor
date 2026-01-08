// data.js - All data fetching functions

import { CORS_PROXIES, ALERT_KEYWORDS, SECTORS, COMMODITIES, INTEL_SOURCES, AI_FEEDS } from './constants.js';

// Fetch with proxy fallback
export async function fetchWithProxy(url) {
    for (let i = 0; i < CORS_PROXIES.length; i++) {
        try {
            const proxy = CORS_PROXIES[i];
            const response = await fetch(proxy + encodeURIComponent(url), {
                headers: { 'Accept': 'application/rss+xml, application/xml, text/xml, */*' }
            });
            if (response.ok) {
                const text = await response.text();
                // Check if response is valid (not an error page)
                if (text && !text.includes('<!DOCTYPE html>') && !text.includes('error code:')) {
                    return text;
                }
            }
        } catch (e) {
            console.log(`Proxy ${i} failed, trying next...`);
        }
    }
    throw new Error('All proxies failed');
}

// Fetch RSS feed using rss2json API as primary method
export async function fetchFeedViaJson(source) {
    try {
        const apiUrl = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(source.url)}`;
        const response = await fetch(apiUrl);
        if (!response.ok) throw new Error('rss2json API failed');

        const data = await response.json();
        if (data.status !== 'ok' || !data.items) return [];

        return data.items.slice(0, 5).map(item => ({
            source: source.name,
            title: (item.title || 'No title').trim(),
            link: item.link || '',
            pubDate: item.pubDate || '',
            isAlert: hasAlertKeyword(item.title || '')
        }));
    } catch (e) {
        console.log(`rss2json failed for ${source.name}, trying XML proxy...`);
        return null; // Signal to try XML fallback
    }
}

// Check for alert keywords
export function hasAlertKeyword(title) {
    const lower = title.toLowerCase();
    return ALERT_KEYWORDS.some(kw => lower.includes(kw));
}

// Parse RSS feed - tries rss2json API first, then falls back to XML proxy
export async function fetchFeed(source) {
    // Try rss2json API first (more reliable)
    const jsonResult = await fetchFeedViaJson(source);
    if (jsonResult !== null && jsonResult.length > 0) {
        return jsonResult;
    }

    // Fallback to XML proxy
    try {
        const text = await fetchWithProxy(source.url);
        const parser = new DOMParser();
        const xml = parser.parseFromString(text, 'text/xml');

        const parseError = xml.querySelector('parsererror');
        if (parseError) {
            console.error(`Parse error for ${source.name}`);
            return [];
        }

        let items = xml.querySelectorAll('item');
        if (items.length === 0) {
            items = xml.querySelectorAll('entry');
        }

        return Array.from(items).slice(0, 5).map(item => {
            let link = '';
            const linkEl = item.querySelector('link');
            if (linkEl) {
                link = linkEl.getAttribute('href') || linkEl.textContent || '';
            }
            link = link.trim();

            const title = (item.querySelector('title')?.textContent || 'No title').trim();
            const pubDate = item.querySelector('pubDate')?.textContent ||
                           item.querySelector('published')?.textContent ||
                           item.querySelector('updated')?.textContent || '';

            return {
                source: source.name,
                title,
                link,
                pubDate,
                isAlert: hasAlertKeyword(title)
            };
        });
    } catch (error) {
        console.error(`Error fetching ${source.name}:`, error);
        return [];
    }
}

// Fetch all feeds for a category
export async function fetchCategory(feeds) {
    const results = await Promise.all(feeds.map(fetchFeed));
    const items = results.flat();

    items.sort((a, b) => {
        // Alerts first, then by date
        if (a.isAlert && !b.isAlert) return -1;
        if (!a.isAlert && b.isAlert) return 1;
        const dateA = new Date(a.pubDate);
        const dateB = new Date(b.pubDate);
        return dateB - dateA;
    });

    return items.slice(0, 20);
}

// Fetch stock quote from Twelve Data API (free, no API key required for demo)
export async function fetchQuote(symbol) {
    try {
        // Clean up symbol for Twelve Data (remove ^ prefix for indices)
        let cleanSymbol = symbol.replace('^', '');
        // Map common index symbols
        const symbolMap = {
            'GSPC': 'SPX',
            'DJI': 'DJI',
            'IXIC': 'IXIC'
        };
        cleanSymbol = symbolMap[cleanSymbol] || cleanSymbol;

        const response = await fetch(`https://api.twelvedata.com/quote?symbol=${cleanSymbol}&apikey=demo`);
        const data = await response.json();

        if (data && data.close && !data.code) {
            const price = parseFloat(data.close);
            const change = parseFloat(data.percent_change) || 0;
            return { price, change };
        }
    } catch (error) {
        console.error(`Error fetching ${symbol}:`, error);
    }
    return null;
}

// Fetch market data (stocks + crypto)
export async function fetchMarkets() {
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

    const fetchStock = async (s) => {
        const quote = await fetchQuote(s.symbol);
        if (quote) {
            return { name: s.name, symbol: s.display, price: quote.price, change: quote.change };
        }
        return null;
    };

    const stockResults = await Promise.all(symbols.map(fetchStock));
    stockResults.forEach(r => { if (r) markets.push(r); });

    // Crypto
    try {
        const cryptoResponse = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,solana&vs_currencies=usd&include_24hr_change=true');
        const crypto = await cryptoResponse.json();

        if (crypto.bitcoin) markets.push({ name: 'Bitcoin', symbol: 'BTC', price: crypto.bitcoin.usd, change: crypto.bitcoin.usd_24h_change });
        if (crypto.ethereum) markets.push({ name: 'Ethereum', symbol: 'ETH', price: crypto.ethereum.usd, change: crypto.ethereum.usd_24h_change });
        if (crypto.solana) markets.push({ name: 'Solana', symbol: 'SOL', price: crypto.solana.usd, change: crypto.solana.usd_24h_change });
    } catch (error) {
        console.error('Error fetching crypto:', error);
    }

    return markets;
}

// Fetch sector heatmap data
export async function fetchSectors() {
    const results = await Promise.all(SECTORS.map(async (s) => {
        const quote = await fetchQuote(s.symbol);
        if (quote) {
            return { name: s.name, symbol: s.symbol, change: quote.change };
        }
        return { name: s.name, symbol: s.symbol, change: 0 };
    }));
    return results;
}

// Fetch commodities and VIX
export async function fetchCommodities() {
    const results = [];
    for (const c of COMMODITIES) {
        const quote = await fetchQuote(c.symbol);
        if (quote) {
            results.push({ name: c.name, symbol: c.display, price: quote.price, change: quote.change });
        }
    }
    return results;
}

// Fetch congressional trades news (original data source no longer available)
export async function fetchCongressTrades() {
    // Note: The House Stock Watcher S3 bucket is no longer publicly accessible.
    // This now fetches congressional trading-related news instead.
    try {
        const apiUrl = 'https://api.rss2json.com/v1/api.json?rss_url=' +
            encodeURIComponent('https://news.google.com/rss/search?q=congress+stock+trading+disclosure&hl=en-US&gl=US&ceid=US:en');
        const response = await fetch(apiUrl);
        const data = await response.json();

        if (data.status === 'ok' && data.items) {
            return data.items.slice(0, 10).map(item => ({
                name: item.title.substring(0, 50) + (item.title.length > 50 ? '...' : ''),
                party: '-',
                ticker: 'NEWS',
                action: 'INFO',
                amount: '',
                date: item.pubDate?.split(' ')[0] || '',
                link: item.link,
                isNews: true
            }));
        }
    } catch (error) {
        console.error('Error fetching congress trades news:', error);
    }
    return [];
}

// Fetch whale transactions (crypto)
export async function fetchWhaleTransactions() {
    try {
        // This would normally use a whale alert API
        // For now return mock data structure
        return [];
    } catch (error) {
        console.error('Error fetching whale transactions:', error);
        return [];
    }
}

// Fetch government contracts
export async function fetchGovContracts() {
    try {
        // Would use USASpending.gov API
        return [];
    } catch (error) {
        console.error('Error fetching gov contracts:', error);
        return [];
    }
}

// Fetch AI news from major AI companies
export async function fetchAINews() {
    const results = await Promise.all(AI_FEEDS.map(async (source) => {
        // Try rss2json API first
        try {
            const apiUrl = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(source.url)}`;
            const response = await fetch(apiUrl);
            if (response.ok) {
                const data = await response.json();
                if (data.status === 'ok' && data.items) {
                    return data.items.slice(0, 3).map(item => ({
                        source: source.name,
                        title: (item.title || 'No title').trim(),
                        link: item.link || '',
                        date: item.pubDate || ''
                    }));
                }
            }
        } catch (e) {
            // Fall through to XML proxy
        }

        // Fallback to XML proxy
        try {
            const text = await fetchWithProxy(source.url);
            const parser = new DOMParser();
            const xml = parser.parseFromString(text, 'text/xml');

            let items = xml.querySelectorAll('item');
            if (items.length === 0) items = xml.querySelectorAll('entry');

            return Array.from(items).slice(0, 3).map(item => {
                let link = '';
                const linkEl = item.querySelector('link');
                if (linkEl) link = linkEl.getAttribute('href') || linkEl.textContent || '';

                return {
                    source: source.name,
                    title: item.querySelector('title')?.textContent?.trim() || 'No title',
                    link: link.trim(),
                    date: item.querySelector('pubDate')?.textContent ||
                          item.querySelector('published')?.textContent || ''
                };
            });
        } catch (e) {
            console.log(`Failed to fetch ${source.name}`);
            return [];
        }
    }));

    return results.flat().sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 15);
}

// Fetch Fed balance sheet from FRED
export async function fetchFedBalance() {
    try {
        // Use FRED CSV endpoint (no API key required)
        const response = await fetch('https://fred.stlouisfed.org/graph/fredgraph.csv?id=WALCL&cosd=2024-01-01');
        const text = await response.text();

        // Parse CSV (format: observation_date,WALCL)
        const lines = text.trim().split('\n').slice(1); // Skip header
        if (lines.length >= 2) {
            const latestLine = lines[lines.length - 1].split(',');
            const previousLine = lines[lines.length - 2].split(',');

            const latest = parseFloat(latestLine[1]);
            const previous = parseFloat(previousLine[1]);
            const change = latest - previous;
            const changePercent = (change / previous) * 100;

            return {
                value: latest / 1000000,
                change: change / 1000000,
                changePercent,
                date: latestLine[0],
                percentOfMax: (latest / 9000000) * 100
            };
        }
    } catch (error) {
        console.error('Error fetching Fed balance:', error);
    }

    return {
        value: 6.8,
        change: 0,
        changePercent: 0,
        date: new Date().toISOString().split('T')[0],
        percentOfMax: 75
    };
}

// Fetch Polymarket data
export async function fetchPolymarket() {
    try {
        // Would use Polymarket API
        return [];
    } catch (error) {
        console.error('Error fetching Polymarket:', error);
        return [];
    }
}

// Fetch earthquake data from USGS
export async function fetchEarthquakes() {
    try {
        const response = await fetch('https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/4.5_day.geojson');
        const data = await response.json();

        return data.features.map(f => ({
            id: f.id,
            magnitude: f.properties.mag,
            place: f.properties.place,
            time: new Date(f.properties.time),
            lat: f.geometry.coordinates[1],
            lon: f.geometry.coordinates[0],
            depth: f.geometry.coordinates[2]
        }));
    } catch (error) {
        console.error('Error fetching earthquakes:', error);
        return [];
    }
}

// Fetch layoffs data
export async function fetchLayoffs() {
    try {
        // Would use layoffs.fyi API or similar
        return [];
    } catch (error) {
        console.error('Error fetching layoffs:', error);
        return [];
    }
}

// Fetch situation-specific news
export async function fetchSituationNews(keywords, limit = 5) {
    // Filter from existing news based on keywords
    return [];
}

// Fetch Intel feed (combines multiple intel sources)
export async function fetchIntelFeed() {
    const results = await Promise.all(INTEL_SOURCES.map(fetchFeed));
    const items = results.flat();

    items.sort((a, b) => {
        if (a.isAlert && !b.isAlert) return -1;
        if (!a.isAlert && b.isAlert) return 1;
        return new Date(b.pubDate) - new Date(a.pubDate);
    });

    return items.slice(0, 30);
}
