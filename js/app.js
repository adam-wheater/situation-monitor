// Main application entry point
// All modules are loaded via script tags in index.html

// Update status display
function setStatus(text, loading = false) {
    const status = document.getElementById('status');
    if (status) {
        status.textContent = text;
        status.className = loading ? 'status loading' : 'status';
    }
}

// Staged refresh - loads critical data first for faster perceived startup
async function refreshAll() {
    const btn = document.getElementById('refreshBtn');
    if (btn) btn.disabled = true;
    setStatus('Loading critical...', true);

    let allNews = [];

    try {
        // STAGE 1: Critical data (news + markets) - loads first
        const stage1Promise = Promise.all([
            isPanelEnabled('politics') ? fetchCategory(FEEDS.politics) : Promise.resolve([]),
            isPanelEnabled('tech') ? fetchCategory(FEEDS.tech) : Promise.resolve([]),
            isPanelEnabled('finance') ? fetchCategory(FEEDS.finance) : Promise.resolve([]),
            isPanelEnabled('markets') ? fetchMarkets() : Promise.resolve([]),
            isPanelEnabled('heatmap') ? fetchSectors() : Promise.resolve([])
        ]);

        const [politics, tech, finance, markets, sectors] = await stage1Promise;

        // Render Stage 1 immediately
        if (isPanelEnabled('politics')) renderNews('politicsPanel', 'politicsCount', politics);
        if (isPanelEnabled('tech')) renderNews('techPanel', 'techCount', tech);
        if (isPanelEnabled('finance')) renderNews('financePanel', 'financeCount', finance);
        if (isPanelEnabled('markets')) renderMarkets(markets);
        if (isPanelEnabled('heatmap')) renderHeatmap(sectors);

        allNews = [...politics, ...tech, ...finance];
        setStatus('Loading more...', true);

        // STAGE 2: Secondary data (gov, commodities, polymarket, printer, earthquakes)
        const stage2Promise = Promise.all([
            isPanelEnabled('gov') ? fetchCategory(FEEDS.gov) : Promise.resolve([]),
            isPanelEnabled('commodities') ? fetchCommodities() : Promise.resolve([]),
            isPanelEnabled('polymarket') ? fetchPolymarket() : Promise.resolve([]),
            isPanelEnabled('printer') ? fetchFedBalance() : Promise.resolve({ value: 0, change: 0, changePercent: 0, percentOfMax: 0 }),
            isPanelEnabled('map') ? fetchEarthquakes() : Promise.resolve([])
        ]);

        const [gov, commodities, polymarket, fedBalance, earthquakes] = await stage2Promise;

        if (isPanelEnabled('gov')) {
            renderNews('govPanel', 'govCount', gov);
            allNews = [...allNews, ...gov];
        }
        if (isPanelEnabled('commodities')) renderCommodities(commodities);
        if (isPanelEnabled('polymarket')) renderPolymarket(polymarket);
        if (isPanelEnabled('printer')) renderMoneyPrinter(fedBalance);

        // Render map with earthquakes and shipping alert data
        if (isPanelEnabled('map')) {
            const activityData = analyzeHotspotActivity(allNews);
            await renderGlobalMap(activityData, earthquakes, allNews);
        }

        if (isPanelEnabled('mainchar')) {
            const mainCharRankings = calculateMainCharacter(allNews);
            renderMainCharacter(mainCharRankings);
        }

        setStatus('Loading extras...', true);

        // STAGE 3: Extra data - lowest priority
        const stage3Promise = Promise.all([
            isPanelEnabled('congress') ? fetchCongressTrades() : Promise.resolve([]),
            isPanelEnabled('whales') ? fetchWhaleTransactions() : Promise.resolve([]),
            isPanelEnabled('contracts') ? fetchGovContracts() : Promise.resolve([]),
            isPanelEnabled('ai') ? fetchAINews() : Promise.resolve([]),
            isPanelEnabled('layoffs') ? fetchLayoffs() : Promise.resolve([]),
            isPanelEnabled('pentagon') ? fetchPentagonTracker() : Promise.resolve({ locations: [], error: null }),
            isPanelEnabled('venezuela') ? fetchSituationNews('venezuela maduro caracas crisis') : Promise.resolve([]),
            isPanelEnabled('greenland') ? fetchSituationNews('greenland denmark trump arctic') : Promise.resolve([]),
            isPanelEnabled('intel') ? fetchIntelFeed() : Promise.resolve([])
        ]);

        const [congressTrades, whales, contracts, aiNews, layoffs, pentagonData, venezuelaNews, greenlandNews, intelFeed] = await stage3Promise;

        if (isPanelEnabled('congress')) renderCongressTrades(congressTrades);
        if (isPanelEnabled('whales')) renderWhaleWatch(whales);
        if (isPanelEnabled('contracts')) renderGovContracts(contracts);
        if (isPanelEnabled('ai')) renderAINews(aiNews);
        if (isPanelEnabled('layoffs')) renderLayoffs(layoffs);
        if (isPanelEnabled('pentagon')) renderPentagonTracker(pentagonData);
        if (isPanelEnabled('intel')) renderIntelFeed(intelFeed);

        if (isPanelEnabled('venezuela')) {
            renderSituation('venezuelaPanel', 'venezuelaStatus', venezuelaNews, {
                title: 'Venezuela Crisis',
                subtitle: 'Political instability & humanitarian situation',
                criticalKeywords: ['invasion', 'military', 'coup', 'violence', 'sanctions', 'arrested']
            });
        }

        if (isPanelEnabled('greenland')) {
            renderSituation('greenlandPanel', 'greenlandStatus', greenlandNews, {
                title: 'Greenland Dispute',
                subtitle: 'US-Denmark tensions over Arctic territory',
                criticalKeywords: ['purchase', 'trump', 'military', 'takeover', 'independence', 'referendum']
            });
        }

        // Render My Monitors panel with all news
        if (isPanelEnabled('monitors')) {
            renderMonitorsPanel(allNews);
        }

        const now = new Date();
        setStatus(`Updated ${now.toLocaleTimeString()}`);
    } catch (error) {
        console.error('Refresh error:', error);
        setStatus('Error updating');
    }

    if (btn) btn.disabled = false;
}

// Fetch congress trades via news search
async function fetchCongressTrades() {
    try {
        const searchTerms = encodeURIComponent('congress stock trading pelosi tuberville');
        const rssUrl = `https://news.google.com/rss/search?q=${searchTerms}&hl=en-US&gl=US&ceid=US:en`;

        const text = await fetchWithProxy(rssUrl);
        const parser = new DOMParser();
        const xml = parser.parseFromString(text, 'text/xml');
        const items = xml.querySelectorAll('item');

        if (items.length > 0) {
            const trades = extractTradesFromNews(Array.from(items).slice(0, 15));
            if (trades.length >= 3) {
                return trades;
            }
        }
    } catch (e) {
        console.log('News fetch failed:', e.message);
    }

    return getRecentNotableTrades();
}

// Fetch whale transactions
async function fetchWhaleTransactions() {
    try {
        const text = await fetchWithProxy('https://blockchain.info/unconfirmed-transactions?format=json');
        const data = JSON.parse(text);

        const btcPrice = 100000;
        const whales = data.txs
            .map(tx => {
                const totalOut = tx.out.reduce((sum, o) => sum + o.value, 0) / 100000000;
                return {
                    coin: 'BTC',
                    amount: totalOut,
                    usd: totalOut * btcPrice,
                    hash: tx.hash.substring(0, 8) + '...',
                    time: new Date(tx.time * 1000)
                };
            })
            .filter(tx => tx.amount >= 10)
            .sort((a, b) => b.amount - a.amount)
            .slice(0, 15);

        return whales;
    } catch (error) {
        console.error('Error fetching whale transactions:', error);
        return [];
    }
}

// Fetch government contracts
async function fetchGovContracts() {
    try {
        window.lastGovContractsError = '';

        const today = new Date();
        const weekAgo = new Date(today);
        weekAgo.setDate(weekAgo.getDate() - 7);

        const payload = {
            filters: {
                time_period: [{
                    start_date: weekAgo.toISOString().split('T')[0],
                    end_date: today.toISOString().split('T')[0]
                }],
                award_type_codes: ['A', 'B', 'C', 'D']
            },
            fields: ['Award ID', 'Recipient Name', 'Award Amount', 'Awarding Agency', 'Description', 'Start Date'],
            limit: 15,
            order: 'desc',
            sort: 'Award Amount'
        };

        const data = await fetchWithProxy(
            'https://api.usaspending.gov/api/v2/search/spending_by_award/',
            {
                accept: 'application/json, text/plain, */*',
                responseType: 'json',
                fetchInit: {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                }
            }
        );

        return (data.results || []).map(c => ({
            agency: c['Awarding Agency'] || 'Unknown Agency',
            vendor: c['Recipient Name'] || 'Unknown',
            amount: c['Award Amount'] || 0,
            description: c['Description'] || 'Contract Award',
            date: c['Start Date']
        }));
    } catch (error) {
        console.error('Error fetching contracts:', error);
        window.lastGovContractsError = error?.message || 'Request failed';
        return [];
    }
}

// Fetch Fed balance
async function fetchFedBalance() {
    try {
        const text = await fetchWithProxy('https://api.stlouisfed.org/fred/series/observations?series_id=WALCL&sort_order=desc&limit=10&file_type=json&api_key=DEMO');
        const data = JSON.parse(text);

        if (data.observations && data.observations.length >= 2) {
            const latest = parseFloat(data.observations[0].value);
            const previous = parseFloat(data.observations[1].value);
            const change = latest - previous;
            const changePercent = (change / previous) * 100;

            return {
                value: latest / 1000000,
                change: change / 1000000,
                changePercent,
                date: data.observations[0].date,
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

// Fetch Polymarket
async function fetchPolymarket() {
    try {
        const text = await fetchWithProxy('https://gamma-api.polymarket.com/markets?closed=false&order=volume&ascending=false&limit=25');
        const data = JSON.parse(text);

        if (!Array.isArray(data)) return [];

        return data
            .filter(m => {
                const vol = parseFloat(m.volume || m.volumeNum || 0);
                return m.question && vol > 1000;
            })
            .slice(0, 15)
            .map(m => {
                let yesPrice = 0;
                if (m.outcomePrices && Array.isArray(m.outcomePrices)) {
                    yesPrice = parseFloat(m.outcomePrices[0]) || 0;
                } else if (m.bestBid !== undefined) {
                    yesPrice = parseFloat(m.bestBid) || 0;
                } else if (m.lastTradePrice !== undefined) {
                    yesPrice = parseFloat(m.lastTradePrice) || 0;
                }

                if (yesPrice > 1) yesPrice = yesPrice / 100;
                const yesPct = Math.round(yesPrice * 100);

                return {
                    question: m.question,
                    yes: yesPct,
                    volume: parseFloat(m.volume || m.volumeNum || 0),
                    slug: m.slug || m.id
                };
            });
    } catch (error) {
        console.error('Error fetching Polymarket:', error);
        return [];
    }
}

// Fetch earthquakes
async function fetchEarthquakes() {
    try {
        const url = 'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/2.5_week.geojson';
        const text = await fetchWithProxy(url);
        const data = JSON.parse(text);

        if (!data.features) return [];

        return data.features
            .filter(f => f.properties.mag >= 4.0)
            .slice(0, 15)
            .map(f => ({
                mag: f.properties.mag,
                place: f.properties.place,
                time: f.properties.time,
                lat: f.geometry.coordinates[1],
                lon: f.geometry.coordinates[0],
                depth: f.geometry.coordinates[2],
                id: f.id
            }));
    } catch (error) {
        console.error('Error fetching earthquakes:', error);
        return [];
    }
}

// Fetch layoffs news
async function fetchLayoffs() {
    try {
        const searchTerms = encodeURIComponent('tech layoffs 2025 job cuts');
        const rssUrl = `https://news.google.com/rss/search?q=${searchTerms}&hl=en-US&gl=US&ceid=US:en`;
        const text = await fetchWithProxy(rssUrl);
        const parser = new DOMParser();
        const xml = parser.parseFromString(text, 'text/xml');
        const items = xml.querySelectorAll('item');

        const layoffs = [];
        const companies = ['google', 'meta', 'amazon', 'microsoft', 'apple', 'tesla', 'nvidia',
            'salesforce', 'stripe', 'spotify', 'intel', 'cisco', 'ibm', 'dell', 'hp', 'oracle',
            'adobe', 'paypal', 'uber', 'lyft', 'airbnb', 'doordash', 'snap', 'twitter', 'x corp'];

        items.forEach(item => {
            const title = item.querySelector('title')?.textContent || '';
            const pubDate = item.querySelector('pubDate')?.textContent;
            const link = item.querySelector('link')?.textContent || '';

            const titleLower = title.toLowerCase();
            const company = companies.find(c => titleLower.includes(c));

            const countMatch = title.match(/(\d{1,3}(?:,\d{3})*|\d+)\s*(?:employees?|workers?|jobs?|staff|people|positions?)/i) ||
                title.match(/(?:cuts?|lays?\s*off|eliminat\w*|slash\w*)\s*(\d{1,3}(?:,\d{3})*|\d+)/i);

            if (company || titleLower.includes('layoff') || titleLower.includes('job cut')) {
                layoffs.push({
                    company: company ? company.charAt(0).toUpperCase() + company.slice(1) : 'Tech',
                    title: title.substring(0, 100),
                    count: countMatch ? countMatch[1].replace(/,/g, '') : null,
                    date: pubDate,
                    link
                });
            }
        });

        return layoffs.slice(0, 8);
    } catch (error) {
        console.error('Error fetching layoffs:', error);
        return [
            { company: 'Meta', title: 'Meta cuts workforce in Reality Labs division', count: '700', date: new Date().toISOString() },
            { company: 'Google', title: 'Google restructures cloud division, reduces staff', count: '200', date: new Date().toISOString() }
        ];
    }
}

// Fetch situation news
async function fetchSituationNews(keywords, limit = 5) {
    try {
        const searchTerms = encodeURIComponent(keywords);
        const rssUrl = `https://news.google.com/rss/search?q=${searchTerms}&hl=en-US&gl=US&ceid=US:en`;
        const text = await fetchWithProxy(rssUrl);
        const parser = new DOMParser();
        const xml = parser.parseFromString(text, 'text/xml');
        const items = xml.querySelectorAll('item');

        return Array.from(items).slice(0, limit).map(item => ({
            title: item.querySelector('title')?.textContent || '',
            link: item.querySelector('link')?.textContent || '',
            pubDate: item.querySelector('pubDate')?.textContent,
            source: item.querySelector('source')?.textContent || 'News'
        }));
    } catch (error) {
        console.error('Error fetching situation news:', error);
        return [];
    }
}

// Initialize application
function initApp() {
    // Apply panel settings
    applyPanelSettings();
    updateSettingsUI();

    // Restore panel order and sizes
    restorePanelOrder();
    restorePanelSizes();

    // Initialize drag and drop
    initDragAndDrop();

    // Initialize panel resize
    initPanelResize();

    // Initialize monitors list in settings
    renderMonitorsList();

    // Initialize pentagon tracker UI
    initPentagonTrackerUI();

    // Initialize livestream
    updateLivestreamEmbed();

    // Initial data load
    refreshAll();

    // Auto-refresh every 5 minutes
    setInterval(refreshAll, 5 * 60 * 1000);
}

// Settings modal
function openSettings() {
    const modal = document.getElementById('settingsModal');
    if (modal) modal.classList.add('visible');
}

function closeSettings() {
    const modal = document.getElementById('settingsModal');
    if (modal) modal.classList.remove('visible');
}

function toggleSettings() {
    const modal = document.getElementById('settingsModal');
    if (modal) {
        modal.classList.toggle('visible');
    }
}

// Start app when DOM is ready
document.addEventListener('DOMContentLoaded', initApp);
