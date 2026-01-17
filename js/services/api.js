// External API services (Congress trades, Whales, Polymarket, etc.)

async function fetchCongressTrades() {
    try {
        const url = 'https://house-stock-watcher-data.s3-us-west-2.amazonaws.com/data/all_transactions.json';
        const data = await fetchWithProxy(url, { responseType: 'json', accept: 'application/json, */*' });

        if (!Array.isArray(data)) return [];

        const sorted = data
            .filter(t => t && t.disclosure_date)
            .sort((a, b) => new Date(b.disclosure_date) - new Date(a.disclosure_date))
            .slice(0, 15);

        return sorted.map(t => ({
            rep: t.representative || 'Unknown',
            party: t.party || '',
            ticker: t.ticker || '-',
            type: t.type || 'Unknown',
            amount: t.amount || '-',
            date: t.disclosure_date || '',
            description: t.asset_description || ''
        }));
    } catch (error) {
        console.error('Error fetching Congress trades:', error);
        return [];
    }
}

async function fetchWhaleTransactions() {
    try {
        // Use whale-alert or similar API - for now using placeholder
        const url = 'https://api.whale-alert.io/v1/transactions?api_key=demo&min_value=1000000&limit=10';
        const data = await fetchWithProxy(url, { responseType: 'json', tryDirect: true, accept: 'application/json, */*' });

        if (!data?.transactions) return [];

        return data.transactions.map(tx => ({
            blockchain: tx.blockchain || 'Unknown',
            symbol: tx.symbol || 'Unknown',
            amount: tx.amount || 0,
            amountUsd: tx.amount_usd || 0,
            from: tx.from?.owner_type || 'unknown',
            to: tx.to?.owner_type || 'unknown',
            timestamp: tx.timestamp ? new Date(tx.timestamp * 1000).toISOString() : ''
        }));
    } catch (error) {
        console.error('Error fetching whale transactions:', error);
        return [];
    }
}

async function fetchGovContracts() {
    try {
        const today = new Date();
        const startDate = new Date(today);
        startDate.setDate(startDate.getDate() - 7);

        const url = `https://api.usaspending.gov/api/v2/search/spending_by_award/?limit=15`;
        const data = await fetchWithProxy(url, {
            responseType: 'json',
            accept: 'application/json, */*',
            fetchInit: {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    filters: {
                        time_period: [{
                            start_date: startDate.toISOString().split('T')[0],
                            end_date: today.toISOString().split('T')[0]
                        }],
                        award_type_codes: ['A', 'B', 'C', 'D']
                    },
                    fields: ['Award ID', 'Recipient Name', 'Award Amount', 'Awarding Agency', 'Description'],
                    sort: 'Award Amount',
                    order: 'desc'
                })
            }
        });

        if (!data?.results) return [];

        return data.results.map(c => ({
            id: c['Award ID'] || '',
            recipient: c['Recipient Name'] || 'Unknown',
            amount: c['Award Amount'] || 0,
            agency: c['Awarding Agency'] || '',
            description: c['Description'] || ''
        }));
    } catch (error) {
        console.error('Error fetching gov contracts:', error);
        return [];
    }
}

async function fetchPolymarket() {
    try {
        const url = 'https://gamma-api.polymarket.com/markets?limit=15&active=true&closed=false';
        const data = await fetchWithProxy(url, { responseType: 'json', tryDirect: true, accept: 'application/json, */*' });

        if (!Array.isArray(data)) return [];

        return data.slice(0, 15).map(m => ({
            question: m.question || 'Unknown',
            outcomePrices: m.outcomePrices || [],
            outcomes: m.outcomes || [],
            volume: m.volume || 0,
            liquidity: m.liquidity || 0,
            endDate: m.endDate || ''
        }));
    } catch (error) {
        console.error('Error fetching Polymarket:', error);
        return [];
    }
}

async function fetchFedBalance() {
    try {
        const url = 'https://api.fiscaldata.treasury.gov/services/api/fiscal_service/v2/accounting/od/avg_interest_rates?sort=-record_date&page[size]=1';
        const data = await fetchWithProxy(url, { responseType: 'json', accept: 'application/json, */*' });

        // Return placeholder data structure for now
        return {
            totalAssets: null,
            treasurySecurities: null,
            mbs: null,
            lastUpdated: data?.data?.[0]?.record_date || ''
        };
    } catch (error) {
        console.error('Error fetching Fed balance:', error);
        return null;
    }
}

async function fetchEarthquakes() {
    try {
        const url = 'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/4.5_week.geojson';
        const data = await fetchWithProxy(url, { responseType: 'json', tryDirect: true, accept: 'application/json, */*' });

        if (!data?.features) return [];

        return data.features.slice(0, 20).map(f => ({
            id: f.id,
            mag: f.properties?.mag || 0,
            place: f.properties?.place || 'Unknown',
            time: f.properties?.time ? new Date(f.properties.time).toISOString() : '',
            lat: f.geometry?.coordinates?.[1] || 0,
            lon: f.geometry?.coordinates?.[0] || 0,
            depth: f.geometry?.coordinates?.[2] || 0,
            url: f.properties?.url || ''
        }));
    } catch (error) {
        console.error('Error fetching earthquakes:', error);
        return [];
    }
}

async function fetchLayoffs() {
    // Layoffs data would typically come from layoffs.fyi or similar
    // For now returning empty array as placeholder
    return [];
}

async function fetchWeatherWarnings() {
    try {
        // NWS alerts API - free, no key required
        const url = 'https://api.weather.gov/alerts/active?status=actual&message_type=alert';
        const data = await fetchWithProxy(url, {
            responseType: 'json',
            tryDirect: true,
            accept: 'application/geo+json, application/json, */*'
        });

        if (!data?.features) return [];

        // Filter for significant weather warnings (exclude minor advisories)
        const significantTypes = [
            'Tornado Warning', 'Tornado Watch',
            'Severe Thunderstorm Warning', 'Severe Thunderstorm Watch',
            'Hurricane Warning', 'Hurricane Watch',
            'Tropical Storm Warning', 'Tropical Storm Watch',
            'Flash Flood Warning', 'Flood Warning',
            'Winter Storm Warning', 'Blizzard Warning',
            'Ice Storm Warning', 'Extreme Cold Warning',
            'Excessive Heat Warning', 'Fire Weather Watch',
            'Red Flag Warning', 'Tsunami Warning'
        ];

        return data.features
            .filter(f => {
                const event = f.properties?.event || '';
                return significantTypes.some(t => event.includes(t.split(' ')[0]));
            })
            .slice(0, 50)
            .map(f => {
                const props = f.properties || {};
                const geo = f.geometry;

                // Get centroid of the alert area
                let lat = 39.0, lon = -98.0; // Default to US center
                if (geo?.type === 'Polygon' && geo.coordinates?.[0]) {
                    const coords = geo.coordinates[0];
                    lat = coords.reduce((sum, c) => sum + c[1], 0) / coords.length;
                    lon = coords.reduce((sum, c) => sum + c[0], 0) / coords.length;
                } else if (geo?.type === 'Point') {
                    lon = geo.coordinates[0];
                    lat = geo.coordinates[1];
                }

                // Determine severity level
                const event = props.event || '';
                let level = 'elevated';
                if (event.includes('Tornado') || event.includes('Hurricane') || event.includes('Tsunami')) {
                    level = 'high';
                } else if (event.includes('Watch') || event.includes('Advisory')) {
                    level = 'low';
                }

                return {
                    id: f.id || `nws_${Date.now()}_${Math.random()}`,
                    name: props.event || 'Weather Alert',
                    headline: props.headline || '',
                    description: props.description || '',
                    severity: props.severity || 'Unknown',
                    certainty: props.certainty || 'Unknown',
                    urgency: props.urgency || 'Unknown',
                    areaDesc: props.areaDesc || '',
                    onset: props.onset || props.effective || '',
                    expires: props.expires || '',
                    senderName: props.senderName || 'NWS',
                    lat: lat,
                    lon: lon,
                    level: level
                };
            });
    } catch (error) {
        console.error('Error fetching weather warnings:', error);
        return [];
    }
}

async function fetchNavalHubs() {
    try {
        // Overpass API query for naval bases and major ports
        const query = `
[out:json][timeout:30];
(
  node["military"="naval_base"];
  way["military"="naval_base"];
  node["harbour:type"="military"];
  way["harbour:type"="military"];
  node["landuse"="military"]["military"="base"]["name"~"Naval|Navy|Fleet",i];
  way["landuse"="military"]["military"="base"]["name"~"Naval|Navy|Fleet",i];
);
out center body;
`;
        const url = 'https://overpass-api.de/api/interpreter';
        const data = await fetchWithProxy(url, {
            responseType: 'json',
            accept: 'application/json, */*',
            fetchInit: {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: `data=${encodeURIComponent(query)}`
            }
        });

        if (!data?.elements) return [];

        return data.elements
            .filter(el => {
                const lat = el.lat || el.center?.lat;
                const lon = el.lon || el.center?.lon;
                return lat && lon;
            })
            .slice(0, 100)
            .map(el => {
                const lat = el.lat || el.center?.lat;
                const lon = el.lon || el.center?.lon;
                const tags = el.tags || {};

                return {
                    id: `naval_${el.id}`,
                    name: tags.name || tags['name:en'] || 'Naval Facility',
                    type: tags.military || 'naval_base',
                    operator: tags.operator || '',
                    country: tags['addr:country'] || '',
                    lat: lat,
                    lon: lon
                };
            });
    } catch (error) {
        console.error('Error fetching naval hubs:', error);
        return [];
    }
}

async function fetchMilitaryFlights() {
    try {
        // OpenSky Network API - free, rate-limited
        const url = 'https://opensky-network.org/api/states/all';
        const data = await fetchWithProxy(url, {
            responseType: 'json',
            tryDirect: true,
            accept: 'application/json, */*'
        });

        if (!data?.states) return [];

        // Military/transport callsign patterns
        const militaryPatterns = [
            /^RCH/i,      // USAF Reach (C-17, C-5)
            /^REACH/i,   // USAF Reach
            /^EVAC/i,    // Medical evacuation
            /^NAVY/i,    // US Navy
            /^TOPCAT/i,  // USAF special ops
            /^COBRA/i,   // Army helicopters
            /^DUKE/i,    // USAF C-130
            /^KING/i,    // USAF rescue
            /^PEDRO/i,   // USAF rescue
            /^JOLLY/i,   // USAF rescue
            /^KNIFE/i,   // USAF special ops
            /^RULER/i,   // AWACS
            /^SENTRY/i,  // AWACS
            /^DRAGN/i,   // USAF various
            /^PACK/i,    // Tanker
            /^SHELL/i,   // Tanker
            /^TEXAS/i,   // Tanker
            /^ETHYL/i,   // Tanker
            /^GAF/i,     // German Air Force
            /^RRR/i,     // Royal Air Force
            /^IAM/i,     // Italian Air Force
            /^FAF/i,     // French Air Force
            /^BAF/i,     // Belgian Air Force
            /^HAF/i,     // Hellenic Air Force
            /^PLF/i,     // Polish Air Force
            /^NATO/i,    // NATO flights
            /^MMF/i,     // RAF transport
            /^ASCOT/i,   // RAF transport
            /^RAFR/i,    // RAF
            /^CFC/i,     // Canadian Forces
        ];

        return data.states
            .filter(state => {
                const callsign = (state[1] || '').trim();
                if (!callsign) return false;
                return militaryPatterns.some(pattern => pattern.test(callsign));
            })
            .slice(0, 100)
            .map(state => ({
                id: `flight_${state[0] || Date.now()}`,
                icao24: state[0] || '',
                callsign: (state[1] || '').trim(),
                originCountry: state[2] || 'Unknown',
                lon: state[5] || 0,
                lat: state[6] || 0,
                altitude: state[7] || state[13] || 0, // baro or geo altitude
                velocity: state[9] || 0,
                heading: state[10] || 0,
                verticalRate: state[11] || 0,
                onGround: state[8] || false,
                lastUpdate: state[4] || Date.now() / 1000
            }))
            .filter(f => f.lat && f.lon && !f.onGround);
    } catch (error) {
        console.error('Error fetching military flights:', error);
        return [];
    }
}
