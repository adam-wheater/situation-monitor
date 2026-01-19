// Map initialization and rendering module
// Extracted from index.html inline script

const MapModule = (function() {
    'use strict';

    // State
    let svg, tooltip, mapPanel, projection, path, g;
    const dataCache = {};
    const width = 800, height = 500;

    // Threat level colors
    const threatColors = {
        high: '#ff4444',
        elevated: '#ffcc00',
        low: '#00ff88'
    };

    // Weather severity colors
    const weatherColors = {
        'Extreme': '#ff0000',
        'Severe': '#ff6600',
        'Moderate': '#ffaa00',
        'Minor': '#ffcc00'
    };

    // Proxy state
    const __proxyState = { checked: false, available: false };

    // US state centroids for weather alerts
    const stateCentroids = {
        'AL': [32.7, -86.7], 'AK': [64.0, -153.0], 'AZ': [34.2, -111.6], 'AR': [34.8, -92.4],
        'CA': [37.2, -119.4], 'CO': [39.0, -105.5], 'CT': [41.6, -72.7], 'DE': [39.0, -75.5],
        'FL': [28.6, -82.4], 'GA': [32.6, -83.4], 'HI': [20.8, -156.3], 'ID': [44.4, -114.6],
        'IL': [40.0, -89.2], 'IN': [39.9, -86.3], 'IA': [42.0, -93.5], 'KS': [38.5, -98.4],
        'KY': [37.5, -85.3], 'LA': [31.0, -92.0], 'ME': [45.4, -69.2], 'MD': [39.0, -76.8],
        'MA': [42.2, -71.5], 'MI': [44.3, -85.4], 'MN': [46.3, -94.3], 'MS': [32.7, -89.7],
        'MO': [38.3, -92.4], 'MT': [47.0, -109.6], 'NE': [41.5, -99.8], 'NV': [39.3, -116.6],
        'NH': [43.7, -71.6], 'NJ': [40.1, -74.7], 'NM': [34.4, -106.1], 'NY': [42.9, -75.5],
        'NC': [35.5, -79.4], 'ND': [47.4, -100.3], 'OH': [40.4, -82.8], 'OK': [35.6, -97.5],
        'OR': [43.9, -120.6], 'PA': [40.9, -77.8], 'RI': [41.7, -71.5], 'SC': [33.9, -80.9],
        'SD': [44.4, -100.2], 'TN': [35.9, -86.4], 'TX': [31.5, -99.4], 'UT': [39.3, -111.7],
        'VT': [44.0, -72.7], 'VA': [37.5, -78.8], 'WA': [47.4, -120.5], 'WV': [38.9, -80.5],
        'WI': [44.6, -89.7], 'WY': [43.0, -107.5], 'DC': [38.9, -77.0], 'PR': [18.2, -66.4]
    };

    // Hotspots data
    const hotspots = [
        { name: 'DC', lat: 38.9, lon: -77.0, level: 'low', desc: 'Washington DC — US political center, White House, Pentagon, Capitol' },
        { name: 'Moscow', lat: 55.75, lon: 37.6, level: 'elevated', desc: 'Moscow — Kremlin, Russian military command, sanctions hub' },
        { name: 'Beijing', lat: 39.9, lon: 116.4, level: 'elevated', desc: 'Beijing — CCP headquarters, US-China tensions, tech rivalry' },
        { name: 'Kyiv', lat: 50.45, lon: 30.5, level: 'high', desc: 'Kyiv — Active conflict zone, Russian invasion ongoing' },
        { name: 'Taipei', lat: 25.03, lon: 121.5, level: 'elevated', desc: 'Taipei — Taiwan Strait tensions, TSMC, China threat' },
        { name: 'Tehran', lat: 35.7, lon: 51.4, level: 'high', desc: 'Tehran — Iran nuclear program, proxy conflicts, regional escalation' },
        { name: 'Tel Aviv', lat: 32.07, lon: 34.78, level: 'high', desc: 'Tel Aviv — Israel-Gaza conflict, active military operations' },
        { name: 'London', lat: 51.5, lon: -0.12, level: 'low', desc: 'London — Financial center, Five Eyes, NATO ally' },
        { name: 'Brussels', lat: 50.85, lon: 4.35, level: 'low', desc: 'Brussels — EU/NATO headquarters, European policy' },
        { name: 'Pyongyang', lat: 39.03, lon: 125.75, level: 'elevated', desc: 'Pyongyang — North Korea nuclear threat, missile tests' },
        { name: 'Riyadh', lat: 24.7, lon: 46.7, level: 'elevated', desc: 'Riyadh — Saudi oil, OPEC+, Yemen conflict, regional power' },
        { name: 'Delhi', lat: 28.6, lon: 77.2, level: 'low', desc: 'Delhi — India rising power, China border tensions' },
        { name: 'Singapore', lat: 1.35, lon: 103.82, level: 'low', desc: 'Singapore — Shipping chokepoint, Asian finance hub' },
        { name: 'Tokyo', lat: 35.68, lon: 139.76, level: 'low', desc: 'Tokyo — US ally, regional security, economic power' },
        { name: 'Caracas', lat: 10.5, lon: -66.9, level: 'high', desc: 'Caracas — Venezuela crisis, Maduro regime, US sanctions, humanitarian emergency' },
        { name: 'Nuuk', lat: 64.18, lon: -51.72, level: 'elevated', desc: 'Nuuk — Greenland, US acquisition interest, Arctic strategy, Denmark tensions' }
    ];

    // Conflict zones
    const conflictZones = [
        { name: 'Ukraine', coords: [[30,52],[40,52],[40,45],[30,45],[30,52]], color: '#ff4444' },
        { name: 'Gaza', coords: [[34,32],[35,32],[35,31],[34,31],[34,32]], color: '#ff4444' },
        { name: 'Taiwan Strait', coords: [[117,28],[122,28],[122,22],[117,22],[117,28]], color: '#ffaa00' },
        { name: 'Yemen', coords: [[42,19],[54,19],[54,12],[42,12],[42,19]], color: '#ff6644' },
        { name: 'Sudan', coords: [[22,23],[38,23],[38,8],[22,8],[22,23]], color: '#ff6644' },
        { name: 'Myanmar', coords: [[92,28],[101,28],[101,10],[92,10],[92,28]], color: '#ff8844' }
    ];

    // Shipping chokepoints
    const chokepoints = [
        { name: 'Suez', lat: 30.0, lon: 32.5, desc: 'Suez Canal — 12% of global trade, Europe-Asia route' },
        { name: 'Panama', lat: 9.1, lon: -79.7, desc: 'Panama Canal — Americas transit, Pacific-Atlantic link' },
        { name: 'Hormuz', lat: 26.5, lon: 56.5, desc: 'Strait of Hormuz — 21% of global oil, Persian Gulf exit' },
        { name: 'Malacca', lat: 2.5, lon: 101.0, desc: 'Strait of Malacca — 25% of global trade, China supply line' },
        { name: 'Bab el-M', lat: 12.5, lon: 43.3, desc: 'Bab el-Mandeb — Red Sea gateway, Houthi threat zone' },
        { name: 'Gibraltar', lat: 36.0, lon: -5.5, desc: 'Strait of Gibraltar — Mediterranean access' },
        { name: 'Bosporus', lat: 41.1, lon: 29.0, desc: 'Bosporus Strait — Black Sea access, Russia exports' }
    ];

    // Undersea cable landing points
    const cableLandings = [
        { name: 'NYC', lat: 40.7, lon: -74.0, desc: 'New York — Transatlantic hub, 10+ cables' },
        { name: 'Cornwall', lat: 50.1, lon: -5.5, desc: 'Cornwall UK — Europe-Americas gateway' },
        { name: 'Marseille', lat: 43.3, lon: 5.4, desc: 'Marseille — Mediterranean hub, SEA-ME-WE' },
        { name: 'Mumbai', lat: 19.1, lon: 72.9, desc: 'Mumbai — India gateway, 10+ cables' },
        { name: 'Singapore', lat: 1.3, lon: 103.8, desc: 'Singapore — Asia-Pacific nexus' },
        { name: 'Hong Kong', lat: 22.3, lon: 114.2, desc: 'Hong Kong — China connectivity hub' },
        { name: 'Tokyo', lat: 35.5, lon: 139.8, desc: 'Tokyo — Trans-Pacific terminus' },
        { name: 'Sydney', lat: -33.9, lon: 151.2, desc: 'Sydney — Australia/Pacific hub' },
        { name: 'LA', lat: 33.7, lon: -118.2, desc: 'Los Angeles — Pacific gateway' },
        { name: 'Miami', lat: 25.8, lon: -80.2, desc: 'Miami — Americas/Caribbean hub' }
    ];

    // Nuclear facilities
    const nuclearSites = [
        { name: 'Natanz', lat: 33.7, lon: 51.7, desc: 'Natanz — Iran uranium enrichment' },
        { name: 'Yongbyon', lat: 39.8, lon: 125.8, desc: 'Yongbyon — North Korea nuclear complex' },
        { name: 'Dimona', lat: 31.0, lon: 35.1, desc: 'Dimona — Israel nuclear facility' },
        { name: 'Bushehr', lat: 28.8, lon: 50.9, desc: 'Bushehr — Iran nuclear power plant' },
        { name: 'Zaporizhzhia', lat: 47.5, lon: 34.6, desc: 'Zaporizhzhia — Europe largest NPP, conflict zone' },
        { name: 'Chernobyl', lat: 51.4, lon: 30.1, desc: 'Chernobyl — Exclusion zone, occupied 2022' },
        { name: 'Fukushima', lat: 37.4, lon: 141.0, desc: 'Fukushima — Decommissioning site' },
        { name: 'Palo Verde', lat: 33.4, lon: -112.9, desc: 'Palo Verde — US nuclear generating station (AZ)' },
        { name: 'Vogtle', lat: 33.1, lon: -81.8, desc: 'Vogtle — US nuclear plant (GA)' },
        { name: 'Diablo Canyon', lat: 35.2, lon: -120.9, desc: 'Diablo Canyon — US nuclear plant (CA)' },
        { name: 'Gravelines', lat: 51.0, lon: 2.1, desc: 'Gravelines — France nuclear power plant' },
        { name: 'Cattenom', lat: 49.4, lon: 6.2, desc: 'Cattenom — France nuclear power plant' },
        { name: 'Flamanville', lat: 49.5, lon: -1.9, desc: 'Flamanville — France nuclear plant (EPR site)' },
        { name: 'Hinkley Point', lat: 51.2, lon: -3.1, desc: 'Hinkley Point — UK nuclear plant complex' },
        { name: 'Sizewell', lat: 52.2, lon: 1.6, desc: 'Sizewell — UK nuclear plant complex' },
        { name: 'Olkiluoto', lat: 61.2, lon: 21.4, desc: 'Olkiluoto — Finland nuclear plant' },
        { name: 'Barakah', lat: 23.7, lon: 53.9, desc: 'Barakah — UAE nuclear power plant' },
        { name: 'Taishan', lat: 21.9, lon: 112.99, desc: 'Taishan — China nuclear power plant' },
        { name: 'Daya Bay', lat: 22.6, lon: 114.55, desc: 'Daya Bay — China nuclear power plant' },
        { name: 'Tianwan', lat: 34.7, lon: 119.45, desc: 'Tianwan — China nuclear power plant' },
        { name: 'Kudankulam', lat: 8.17, lon: 77.71, desc: 'Kudankulam — India nuclear power plant' },
        { name: 'Tarapur', lat: 19.82, lon: 72.65, desc: 'Tarapur — India nuclear power plant' },
        { name: 'Akkuyu', lat: 36.14, lon: 33.54, desc: 'Akkuyu — Turkey nuclear plant site' }
    ];

    // Military bases
    const militaryBases = [
        { name: 'Ramstein', lat: 49.4, lon: 7.6, desc: 'Ramstein — US Air Force, NATO hub Germany' },
        { name: 'Diego Garcia', lat: -7.3, lon: 72.4, desc: 'Diego Garcia — US/UK Indian Ocean base' },
        { name: 'Okinawa', lat: 26.5, lon: 127.9, desc: 'Okinawa — US Forces Japan, Pacific presence' },
        { name: 'Guam', lat: 13.5, lon: 144.8, desc: 'Guam — US Pacific Command, bomber base' },
        { name: 'Djibouti', lat: 11.5, lon: 43.1, desc: 'Djibouti — US/China/France bases, Horn of Africa' },
        { name: 'Qatar', lat: 25.1, lon: 51.3, desc: 'Al Udeid — US CENTCOM forward HQ' },
        { name: 'Kaliningrad', lat: 54.7, lon: 20.5, desc: 'Kaliningrad — Russian Baltic exclave, missiles' },
        { name: 'Sevastopol', lat: 44.6, lon: 33.5, desc: 'Sevastopol — Russian Black Sea Fleet' },
        { name: 'Hainan', lat: 18.2, lon: 109.5, desc: 'Hainan — Chinese submarine base, South China Sea' },
        { name: 'Incirlik', lat: 37.0, lon: 35.4, desc: 'Incirlik — Turkey air base (NATO)' },
        { name: 'Al Dhafra', lat: 24.25, lon: 54.55, desc: 'Al Dhafra — UAE air base (US/coalition)' },
        { name: 'Bandar Abbas', lat: 27.18, lon: 56.26, desc: 'Bandar Abbas — Iran naval hub (Hormuz)' },
        { name: 'Visakhapatnam', lat: 17.7, lon: 83.3, desc: 'Visakhapatnam — India Eastern Naval Command' },
        { name: 'Port Blair', lat: 11.67, lon: 92.74, desc: 'Port Blair — India Andaman & Nicobar Command' },
        { name: 'Pine Gap', lat: -23.8, lon: 133.74, desc: 'Pine Gap — Australia/US signals intelligence' },
        { name: 'Croughton', lat: 51.99, lon: -1.19, desc: 'Croughton — UK/US communications hub' },
        { name: 'Khamis Mushait', lat: 18.3, lon: 42.8, desc: 'Khamis Mushait — Saudi air base region' }
    ];

    // Sanctioned countries (ISO numeric codes)
    const sanctionedIds = [364, 408, 760, 862, 112, 643, 728, 729]; // Iran, NK, Syria, Venezuela, Belarus, Russia, South Sudan, Sudan

    // Flight tracking
    let flightLayer, flightMarkers = [];
    let showAllFlights = false;

    // Overpass layers
    let osmLayer, osmNuclearLayer, osmBaseLayer, osmNavalLayer;
    const overpassCache = new Map();
    const overpassState = { inFlight: false, lastFetchMs: 0, lastKey: '' };
    const OVERPASS_ENDPOINT = 'https://overpass-api.de/api/interpreter';

    // OpenSky rate limiting
    const openSkyState = {
        lastCallMs: 0,
        retryAfterMs: 0,
        consecutiveFailures: 0,
        backoffMs: 10000
    };
    const OPENSKY_MIN_INTERVAL_MS = 10000; // Minimum 10s between calls
    const OPENSKY_MAX_BACKOFF_MS = 300000; // Max 5 min backoff

    // Utility functions
    function escapeHtml(str) {
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    function getLocalTime(lon) {
        const now = new Date();
        const utcHours = now.getUTCHours();
        const utcMinutes = now.getUTCMinutes();
        const offsetHours = Math.round(lon / 15);
        let localHours = (utcHours + offsetHours + 24) % 24;
        const ampm = localHours >= 12 ? 'PM' : 'AM';
        localHours = localHours % 12 || 12;
        return `${localHours}:${utcMinutes.toString().padStart(2, '0')} ${ampm}`;
    }

    function normaliseLon180(lon) {
        while (lon > 180) lon -= 360;
        while (lon < -180) lon += 360;
        return lon;
    }

    // Proxy functions
    async function __probeLocalProxy() {
        if (__proxyState.checked) return __proxyState.available;
        __proxyState.checked = true;
        try {
            const controller = new AbortController();
            const t = setTimeout(() => controller.abort(), 800);
            const resp = await fetch('/proxy/ping', { cache: 'no-store', signal: controller.signal });
            clearTimeout(t);
            if (!resp.ok) return false;
            const text = await resp.text();
            __proxyState.available = String(text || '').trim().toLowerCase().startsWith('ok');
            return __proxyState.available;
        } catch {
            return false;
        }
    }

    async function __fetchJson(url) {
        const useProxy = await __probeLocalProxy();
        const finalUrl = useProxy ? `/proxy?url=${encodeURIComponent(url)}` : url;
        const resp = await fetch(finalUrl, { cache: 'no-store' });
        if (!resp.ok) throw new Error(`Fetch failed (${resp.status})`);
        return await resp.json();
    }

    async function __fetchJsonPost(url, body, contentType = 'application/x-www-form-urlencoded; charset=utf-8') {
        const useProxy = await __probeLocalProxy();
        const finalUrl = useProxy ? `/proxy?url=${encodeURIComponent(url)}` : url;
        const resp = await fetch(finalUrl, {
            method: 'POST',
            headers: { 'Content-Type': contentType },
            body,
            cache: 'no-store'
        });
        if (!resp.ok) throw new Error(`Fetch failed (${resp.status})`);
        return await resp.json();
    }

    // Data fetching functions
    async function getWeather(lat, lon) {
        const key = `weather_${lat}_${lon}`;
        if (dataCache[key]) return dataCache[key];
        try {
            const data = await __fetchJson(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code,wind_speed_10m,wind_gusts_10m,precipitation`);
            const temp = data.current?.temperature_2m;
            const tempF = temp ? Math.round(temp * 9/5 + 32) : null;
            const wind = data.current?.wind_speed_10m;
            const gust = data.current?.wind_gusts_10m;
            const precip = data.current?.precipitation;
            const code = data.current?.weather_code;
            const conditions = {
                0: '☀️ Clear', 1: '🌤️ Mostly clear', 2: '⛅ Partly cloudy', 3: '☁️ Overcast',
                45: '🌫️ Fog', 48: '🌫️ Fog', 51: '🌧️ Drizzle', 53: '🌧️ Drizzle', 55: '🌧️ Drizzle',
                61: '🌧️ Rain', 63: '🌧️ Rain', 65: '🌧️ Heavy rain', 71: '🌨️ Snow', 73: '🌨️ Snow',
                75: '🌨️ Heavy snow', 77: '🌨️ Snow', 80: '🌧️ Showers', 81: '🌧️ Showers', 82: '⛈️ Heavy showers',
                85: '🌨️ Snow', 86: '🌨️ Snow', 95: '⛈️ Thunderstorm', 96: '⛈️ Thunderstorm', 99: '⛈️ Thunderstorm'
            };

            let warning = null;
            const windMph = wind ? Math.round(wind) : null;
            const gustMph = gust ? Math.round(gust) : null;
            const precipMm = (typeof precip === 'number') ? precip : null;

            if ([95, 96, 99].includes(code)) warning = '⚠ Thunderstorm';
            else if (gustMph !== null && gustMph >= 45) warning = '⚠ Damaging winds';
            else if (windMph !== null && windMph >= 30) warning = '⚠ High winds';
            else if (code === 65 || code === 82) warning = '⚠ Heavy precip';
            else if (precipMm !== null && precipMm >= 10) warning = '⚠ Heavy precip';

            const result = {
                temp: tempF,
                wind: windMph,
                gust: gustMph,
                condition: conditions[code] || '—',
                warning
            };
            dataCache[key] = result;
            return result;
        } catch (e) { return null; }
    }

    async function getNews(query, lat, lon) {
        const key = `news_${query}`;
        if (dataCache[key]) return dataCache[key];
        try {
            const searchTerm = encodeURIComponent(query);
            const data = await __fetchJson(`https://api.gdeltproject.org/api/v2/doc/doc?query=${searchTerm}&mode=artlist&maxrecords=3&format=json`);
            const articles = data.articles?.slice(0, 2).map(a => a.title?.substring(0, 60) + '...') || [];
            dataCache[key] = articles;
            return articles;
        } catch (e) { return []; }
    }

    async function getFlightCount(lat, lon) {
        const key = `flights_${Math.round(lat)}_${Math.round(lon)}`;
        if (dataCache[key] !== undefined) return dataCache[key];

        // Check rate limiting
        const now = Date.now();
        if (now < openSkyState.retryAfterMs) {
            return dataCache[key] || null;
        }

        try {
            const data = await __fetchJson(`https://opensky-network.org/api/states/all?lamin=${lat-2}&lomin=${lon-2}&lamax=${lat+2}&lomax=${lon+2}`);
            const count = data.states?.length || 0;
            dataCache[key] = count;
            openSkyState.consecutiveFailures = 0;
            return count;
        } catch (e) {
            openSkyState.consecutiveFailures++;
            openSkyState.backoffMs = Math.min(
                OPENSKY_MIN_INTERVAL_MS * Math.pow(2, openSkyState.consecutiveFailures),
                OPENSKY_MAX_BACKOFF_MS
            );
            openSkyState.retryAfterMs = now + openSkyState.backoffMs;
            console.log(`OpenSky rate limited, backing off for ${openSkyState.backoffMs}ms`);
            dataCache[key] = null;
            return null;
        }
    }

    // Build tooltip content
    async function buildTooltip(name, lat, lon, baseContent, color) {
        const localTime = getLocalTime(lon);
        let html = `<strong style="color:${color}">${baseContent}</strong>`;
        html += `<br><span style="opacity:0.7">🕐 Local: ${localTime}</span>`;

        tooltip.innerHTML = html + '<br><span style="opacity:0.5">Loading data...</span>';

        const [weather, flights, news] = await Promise.all([
            getWeather(lat, lon),
            getFlightCount(lat, lon),
            getNews(name, lat, lon)
        ]);

        if (weather) {
            const windText = weather.wind !== null ? `${weather.wind}mph` : '—';
            const gustText = weather.gust !== null ? ` (gust ${weather.gust}mph)` : '';
            html += `<br><span style="opacity:0.7">${weather.condition} ${weather.temp}°F, wind ${windText}${gustText}</span>`;
            if (weather.warning) {
                html += `<br><span style="color:#ff6600;font-size:10px">${weather.warning}</span>`;
            }
        }
        if (flights !== null) {
            html += `<br><span style="opacity:0.7">✈️ ${flights} aircraft nearby</span>`;
        }
        if (news && news.length > 0) {
            html += `<br><span style="color:#888;font-size:9px">📰 ${news[0]}</span>`;
        }

        return html;
    }

    // Drawing functions
    function drawCountries(countries) {
        g.selectAll('path.country')
            .data(countries.features)
            .enter()
            .append('path')
            .attr('class', 'country')
            .attr('d', path)
            .attr('fill', d => sanctionedIds.includes(+d.id) ? '#2a1a1a' : '#0f3028')
            .attr('stroke', d => sanctionedIds.includes(+d.id) ? '#4a2020' : '#1a5040')
            .attr('stroke-width', 0.5);
    }

    function drawGraticule() {
        const graticule = d3.geoGraticule().step([30, 30]);
        g.append('path')
            .datum(graticule)
            .attr('d', path)
            .attr('fill', 'none')
            .attr('stroke', '#1a3830')
            .attr('stroke-width', 0.3)
            .attr('stroke-dasharray', '2,2');
    }

    function drawOceanLabels() {
        const oceans = [
            { name: 'ATLANTIC', lat: 25, lon: -40 },
            { name: 'PACIFIC', lat: 0, lon: -150 },
            { name: 'INDIAN', lat: -20, lon: 75 },
            { name: 'ARCTIC', lat: 75, lon: 0 },
            { name: 'SOUTHERN', lat: -60, lon: 0 }
        ];
        oceans.forEach(o => {
            const [x, y] = projection([o.lon, o.lat]);
            if (x && y) {
                g.append('text')
                    .attr('x', x).attr('y', y)
                    .attr('fill', '#1a4a40')
                    .attr('font-size', '10px')
                    .attr('font-family', 'monospace')
                    .attr('text-anchor', 'middle')
                    .attr('opacity', 0.6)
                    .text(o.name);
            }
        });
    }

    function drawTerminator() {
        const now = new Date();
        const dayOfYear = Math.floor((now - new Date(now.getFullYear(), 0, 0)) / 86400000);
        const declination = -23.45 * Math.cos((360/365) * (dayOfYear + 10) * Math.PI/180);
        const hourAngle = (now.getUTCHours() + now.getUTCMinutes()/60) * 15 - 180;

        const terminatorPoints = [];
        for (let lat = -90; lat <= 90; lat += 2) {
            const tanDec = Math.tan(declination * Math.PI/180);
            const tanLat = Math.tan(lat * Math.PI/180);
            let lon = -hourAngle + Math.acos(-tanDec * tanLat) * 180/Math.PI;
            if (isNaN(lon)) lon = (lat * declination > 0) ? -hourAngle + 180 : -hourAngle;
            terminatorPoints.push([lon, lat]);
        }
        for (let lat = 90; lat >= -90; lat -= 2) {
            const tanDec = Math.tan(declination * Math.PI/180);
            const tanLat = Math.tan(lat * Math.PI/180);
            let lon = -hourAngle - Math.acos(-tanDec * tanLat) * 180/Math.PI;
            if (isNaN(lon)) lon = (lat * declination > 0) ? -hourAngle - 180 : -hourAngle;
            terminatorPoints.push([lon, lat]);
        }

        g.append('path')
            .datum({type: 'Polygon', coordinates: [terminatorPoints]})
            .attr('d', path)
            .attr('fill', 'rgba(0,0,0,0.3)')
            .attr('stroke', 'none');
    }

    function drawConflictZones() {
        conflictZones.forEach(zone => {
            // Draw the conflict zone polygon
            g.append('path')
                .datum({type: 'Polygon', coordinates: [zone.coords]})
                .attr('d', path)
                .attr('fill', zone.color)
                .attr('fill-opacity', 0.15)
                .attr('stroke', zone.color)
                .attr('stroke-width', 0.5)
                .attr('stroke-opacity', 0.4)
                .attr('class', 'conflict-zone')
                .style('cursor', 'pointer')
                .on('click', function(event) {
                    event.stopPropagation();
                    showClickableTooltip(event, `<strong style="color:${zone.color}">⚠ ${escapeHtml(zone.name)} Conflict Zone</strong>`);
                })
                .on('mouseenter', function(event) {
                    d3.select(this).attr('fill-opacity', 0.25);
                    showHoverTooltip(event, `<strong style="color:${zone.color}">⚠ ${escapeHtml(zone.name)} Conflict Zone</strong>`);
                })
                .on('mousemove', moveTooltip)
                .on('mouseleave', function() {
                    d3.select(this).attr('fill-opacity', 0.15);
                    hideTooltip();
                });
        });
    }

    function drawChokepoints() {
        chokepoints.forEach(cp => {
            const [x, y] = projection([cp.lon, cp.lat]);
            if (x && y) {
                g.append('text')
                    .attr('x', x).attr('y', y + 3)
                    .attr('fill', '#00aaff')
                    .attr('font-size', '10')
                    .attr('font-family', 'monospace')
                    .attr('text-anchor', 'middle')
                    .text('◆');
                g.append('text')
                    .attr('x', x + 8).attr('y', y + 3)
                    .attr('fill', '#00aaff')
                    .attr('font-size', '7')
                    .attr('font-family', 'monospace')
                    .text(cp.name);
                g.append('circle')
                    .attr('cx', x).attr('cy', y).attr('r', 10)
                    .attr('fill', 'transparent')
                    .attr('class', 'hotspot-hit')
                    .on('click', function(event) {
                        showClickableTooltip(event, `<strong style="color:#00aaff">⬥ ${cp.desc}</strong>`);
                    })
                    .on('mouseenter', function(event) {
                        showHoverTooltip(event, `<strong style="color:#00aaff">⬥ ${cp.desc}</strong>`);
                    })
                    .on('mousemove', moveTooltip)
                    .on('mouseleave', hideTooltip);
            }
        });
    }

    function drawCableLandings() {
        cableLandings.forEach(cl => {
            const [x, y] = projection([cl.lon, cl.lat]);
            if (x && y) {
                // Inner filled circle for visibility
                g.append('circle')
                    .attr('cx', x).attr('cy', y).attr('r', 2)
                    .attr('fill', '#aa44ff')
                    .attr('opacity', 0.8);
                // Outer ring
                g.append('circle')
                    .attr('cx', x).attr('cy', y).attr('r', 4)
                    .attr('fill', 'none')
                    .attr('stroke', '#aa44ff')
                    .attr('stroke-width', 1.5)
                    .attr('class', 'cable-landing');
                // Label
                g.append('text')
                    .attr('x', x + 6).attr('y', y + 2)
                    .attr('fill', '#aa44ff')
                    .attr('font-size', '6')
                    .attr('font-family', 'monospace')
                    .attr('opacity', 0.7)
                    .text('◎');
                g.append('circle')
                    .attr('cx', x).attr('cy', y).attr('r', 10)
                    .attr('fill', 'transparent')
                    .attr('class', 'hotspot-hit')
                    .on('click', function(event) {
                        showClickableTooltip(event, `<strong style="color:#aa44ff">◎ ${cl.desc}</strong>`);
                    })
                    .on('mouseenter', function(event) {
                        showHoverTooltip(event, `<strong style="color:#aa44ff">◎ ${cl.desc}</strong>`);
                    })
                    .on('mousemove', moveTooltip)
                    .on('mouseleave', hideTooltip);
            }
        });
    }

    // Submarine cable lines layer
    let cableLayer = null;

    async function drawSubmarineCables() {
        try {
            // Check if running from file:// protocol
            if (location && location.protocol === 'file:') {
                console.warn('Cannot load cables-geo.json when opened via file://');
                return;
            }

            const response = await fetch('data/cables-geo.json', { cache: 'no-store' });
            if (!response.ok) {
                console.warn('Failed to load cables-geo.json');
                return;
            }
            const cableData = await response.json();

            if (!cableData || cableData.type !== 'FeatureCollection' || !cableData.features) {
                return;
            }

            // Create cable layer if not exists
            if (!cableLayer) {
                cableLayer = g.insert('g', ':first-child').attr('class', 'cable-layer');
            }
            cableLayer.selectAll('*').remove();

            // Draw each cable
            cableData.features.forEach(feature => {
                if (!feature || !feature.geometry) return;
                const geom = feature.geometry;
                const props = feature.properties || {};
                const cableName = props.name || 'Undersea Cable';
                const cableColor = props.color ? `#${props.color}` : '#9966ff';

                // Handle LineString and MultiLineString
                const lineArrays = geom.type === 'LineString'
                    ? [geom.coordinates]
                    : (geom.type === 'MultiLineString' ? geom.coordinates : []);

                lineArrays.forEach(coords => {
                    if (!Array.isArray(coords) || coords.length < 2) return;

                    // Parse coordinates (they may be strings)
                    const parsedCoords = coords.map(p => [
                        parseFloat(p[0]),
                        parseFloat(p[1])
                    ]).filter(p => !isNaN(p[0]) && !isNaN(p[1]));

                    if (parsedCoords.length < 2) return;

                    // Create GeoJSON LineString
                    const lineGeoJson = {
                        type: 'LineString',
                        coordinates: parsedCoords
                    };

                    // Draw the cable path
                    cableLayer.append('path')
                        .datum(lineGeoJson)
                        .attr('d', path)
                        .attr('fill', 'none')
                        .attr('stroke', cableColor)
                        .attr('stroke-width', 0.8)
                        .attr('stroke-opacity', 0.5)
                        .attr('class', 'cable-path')
                        .on('click', function(event) {
                            event.stopPropagation();
                            showClickableTooltip(event, `<strong style="color:${cableColor}">◎ ${escapeHtml(cableName)}</strong>`);
                        })
                        .on('mouseenter', function(event) {
                            d3.select(this).attr('stroke-opacity', 0.9).attr('stroke-width', 1.5);
                            showHoverTooltip(event, `<strong style="color:${cableColor}">◎ ${escapeHtml(cableName)}</strong>`);
                        })
                        .on('mousemove', moveTooltip)
                        .on('mouseleave', function() {
                            d3.select(this).attr('stroke-opacity', 0.5).attr('stroke-width', 0.8);
                            hideTooltip();
                        });
                });
            });

            console.log(`Loaded ${cableData.features.length} submarine cable segments`);
        } catch (e) {
            console.warn('Failed to load submarine cables:', e.message);
        }
    }

    function drawNuclearSites() {
        nuclearSites.forEach(ns => {
            const [x, y] = projection([ns.lon, ns.lat]);
            if (x && y) {
                g.append('circle')
                    .attr('cx', x).attr('cy', y).attr('r', 2)
                    .attr('fill', '#ffff00');
                g.append('circle')
                    .attr('cx', x).attr('cy', y).attr('r', 5)
                    .attr('fill', 'none')
                    .attr('stroke', '#ffff00')
                    .attr('stroke-width', 1)
                    .attr('stroke-dasharray', '3,3');
                g.append('circle')
                    .attr('cx', x).attr('cy', y).attr('r', 10)
                    .attr('fill', 'transparent')
                    .attr('class', 'hotspot-hit')
                    .on('click', function(event) {
                        showClickableTooltip(event, `<strong style="color:#ffff00">☢ ${ns.desc}</strong>`);
                    })
                    .on('mouseenter', function(event) {
                        showHoverTooltip(event, `<strong style="color:#ffff00">☢ ${ns.desc}</strong>`);
                    })
                    .on('mousemove', moveTooltip)
                    .on('mouseleave', hideTooltip);
            }
        });
    }

    function drawMilitaryBases() {
        militaryBases.forEach(mb => {
            const [x, y] = projection([mb.lon, mb.lat]);
            if (x && y) {
                g.append('text')
                    .attr('x', x).attr('y', y + 3)
                    .attr('fill', '#ff00ff')
                    .attr('font-size', '10')
                    .attr('font-family', 'monospace')
                    .attr('text-anchor', 'middle')
                    .attr('opacity', 0.9)
                    .text('★');
                g.append('circle')
                    .attr('cx', x).attr('cy', y).attr('r', 10)
                    .attr('fill', 'transparent')
                    .attr('class', 'hotspot-hit')
                    .on('click', function(event) {
                        showClickableTooltip(event, `<strong style="color:#ff00ff">★ ${mb.desc}</strong>`);
                    })
                    .on('mouseenter', function(event) {
                        showHoverTooltip(event, `<strong style="color:#ff00ff">★ ${mb.desc}</strong>`);
                    })
                    .on('mousemove', moveTooltip)
                    .on('mouseleave', hideTooltip);
            }
        });
    }

    function drawHotspots() {
        hotspots.forEach(h => {
            const [x, y] = projection([h.lon, h.lat]);
            const color = threatColors[h.level] || threatColors.low;
            if (x && y) {
                g.append('circle')
                    .attr('cx', x).attr('cy', y).attr('r', 6)
                    .attr('fill', 'none').attr('stroke', color)
                    .attr('stroke-width', 1.5).attr('opacity', 0.6)
                    .attr('class', 'hotspot-pulse');
                g.append('circle')
                    .attr('cx', x).attr('cy', y).attr('r', 3)
                    .attr('fill', color).attr('opacity', 0.9);
                g.append('text')
                    .attr('x', x + 8).attr('y', y + 3)
                    .attr('fill', color).attr('font-size', '8')
                    .attr('font-family', 'monospace')
                    .text(h.name);
                g.append('circle')
                    .attr('cx', x).attr('cy', y).attr('r', 12)
                    .attr('fill', 'transparent')
                    .attr('class', 'hotspot-hit')
                    .on('click', async function(event) {
                        const levelLabel = h.level.charAt(0).toUpperCase() + h.level.slice(1);
                        const html = await buildTooltip(h.name, h.lat, h.lon, `[${levelLabel}] ${h.desc}`, color);
                        showClickableTooltip(event, html);
                    })
                    .on('mouseenter', async function(event) {
                        const levelLabel = h.level.charAt(0).toUpperCase() + h.level.slice(1);
                        positionTooltip(event);
                        tooltip.style.display = 'block';
                        const html = await buildTooltip(h.name, h.lat, h.lon, `[${levelLabel}] ${h.desc}`, color);
                        tooltip.innerHTML = html;
                    })
                    .on('mousemove', moveTooltip)
                    .on('mouseleave', hideTooltip);
            }
        });
    }

    // Tooltip functions - now supports both click and hover
    let tooltipPinned = false;

    function positionTooltip(event) {
        const rect = mapPanel.getBoundingClientRect();
        tooltip.style.left = (event.clientX - rect.left + 15) + 'px';
        tooltip.style.top = (event.clientY - rect.top - 10) + 'px';
    }

    function showHoverTooltip(event, html) {
        if (tooltipPinned) return;
        tooltip.innerHTML = html;
        tooltip.style.display = 'block';
        positionTooltip(event);
    }

    function showClickableTooltip(event, html) {
        event.stopPropagation();
        tooltipPinned = true;
        tooltip.innerHTML = html + '<br><span style="opacity:0.5;font-size:9px">Click elsewhere to close</span>';
        tooltip.style.display = 'block';
        tooltip.style.pointerEvents = 'auto';
        positionTooltip(event);
    }

    function moveTooltip(event) {
        if (tooltipPinned) return;
        positionTooltip(event);
    }

    function hideTooltip() {
        if (tooltipPinned) return;
        tooltip.style.display = 'none';
    }

    function closeTooltip() {
        tooltipPinned = false;
        tooltip.style.display = 'none';
        tooltip.style.pointerEvents = 'none';
    }

    // Weather alerts (US NWS)
    async function loadWeatherAlerts() {
        try {
            const weatherData = await __fetchJson('https://api.weather.gov/alerts/active?status=actual&severity=Extreme,Severe,Moderate');

            const alertsByState = {};
            weatherData.features?.forEach(alert => {
                const props = alert.properties;
                const state = props.areaDesc?.match(/,\s*([A-Z]{2})(?:\s|$|;)/)?.[1] ||
                              props.senderName?.match(/([A-Z]{2})$/)?.[1];
                if (state && stateCentroids[state]) {
                    if (!alertsByState[state] ||
                        (props.severity === 'Extreme' && alertsByState[state].severity !== 'Extreme')) {
                        alertsByState[state] = {
                            state,
                            severity: props.severity,
                            event: props.event,
                            headline: props.headline,
                            description: props.description?.substring(0, 200) + '...',
                            count: (alertsByState[state]?.count || 0) + 1
                        };
                    } else {
                        alertsByState[state].count++;
                    }
                }
            });

            Object.values(alertsByState).forEach(alert => {
                const coords = stateCentroids[alert.state];
                if (!coords) return;
                const [x, y] = projection([coords[1], coords[0]]);
                const color = weatherColors[alert.severity] || '#ffaa00';

                if (x && y) {
                    g.append('text')
                        .attr('x', x)
                        .attr('y', y + 3)
                        .attr('fill', color)
                        .attr('font-size', '10')
                        .attr('font-family', 'monospace')
                        .attr('text-anchor', 'middle')
                        .attr('class', 'weather-alert')
                        .text('▲');

                    g.append('circle')
                        .attr('cx', x).attr('cy', y).attr('r', 10)
                        .attr('fill', 'transparent')
                        .attr('class', 'hotspot-hit')
                        .on('click', function(event) {
                            const countText = alert.count > 1 ? ` (+${alert.count - 1} more)` : '';
                            showClickableTooltip(event, `<strong style="color:${color}">⚠ ${alert.event}</strong>${countText}<br>${alert.headline || alert.state}`);
                        })
                        .on('mouseenter', function(event) {
                            const countText = alert.count > 1 ? ` (+${alert.count - 1} more)` : '';
                            showHoverTooltip(event, `<strong style="color:${color}">⚠ ${alert.event}</strong>${countText}<br>${alert.headline || alert.state}`);
                        })
                        .on('mousemove', moveTooltip)
                        .on('mouseleave', hideTooltip);
                }
            });

            console.log(`Loaded ${Object.keys(alertsByState).length} weather alert regions`);
        } catch(weatherErr) {
            console.log('Weather alerts unavailable:', weatherErr.message);
        }
    }

    // Global weather events (Open-Meteo severe weather)
    async function loadGlobalWeatherEvents() {
        // Major cities worldwide to check for severe weather
        const globalCities = [
            { name: 'Tokyo', lat: 35.68, lon: 139.76 },
            { name: 'London', lat: 51.5, lon: -0.12 },
            { name: 'Paris', lat: 48.85, lon: 2.35 },
            { name: 'Berlin', lat: 52.52, lon: 13.4 },
            { name: 'Moscow', lat: 55.75, lon: 37.6 },
            { name: 'Beijing', lat: 39.9, lon: 116.4 },
            { name: 'Sydney', lat: -33.87, lon: 151.2 },
            { name: 'Mumbai', lat: 19.1, lon: 72.9 },
            { name: 'Dubai', lat: 25.2, lon: 55.3 },
            { name: 'São Paulo', lat: -23.55, lon: -46.63 },
            { name: 'Mexico City', lat: 19.43, lon: -99.13 },
            { name: 'Lagos', lat: 6.45, lon: 3.4 },
            { name: 'Cairo', lat: 30.04, lon: 31.23 },
            { name: 'Jakarta', lat: -6.2, lon: 106.85 },
            { name: 'Manila', lat: 14.6, lon: 120.98 },
            { name: 'Seoul', lat: 37.57, lon: 126.98 },
            { name: 'Bangkok', lat: 13.75, lon: 100.5 },
            { name: 'Nairobi', lat: -1.29, lon: 36.82 },
            { name: 'Johannesburg', lat: -26.2, lon: 28.04 },
            { name: 'Buenos Aires', lat: -34.6, lon: -58.38 }
        ];

        for (const city of globalCities) {
            try {
                const weather = await getWeather(city.lat, city.lon);
                if (weather && weather.warning) {
                    const [x, y] = projection([city.lon, city.lat]);
                    if (x && y) {
                        g.append('text')
                            .attr('x', x)
                            .attr('y', y + 3)
                            .attr('fill', '#ff6600')
                            .attr('font-size', '10')
                            .attr('font-family', 'monospace')
                            .attr('text-anchor', 'middle')
                            .attr('class', 'weather-alert global-weather')
                            .text('▲');

                        g.append('circle')
                            .attr('cx', x).attr('cy', y).attr('r', 10)
                            .attr('fill', 'transparent')
                            .attr('class', 'hotspot-hit')
                            .on('click', function(event) {
                                showClickableTooltip(event, `<strong style="color:#ff6600">${weather.warning}</strong><br>${city.name}: ${weather.condition} ${weather.temp}°F`);
                            })
                            .on('mouseenter', function(event) {
                                showHoverTooltip(event, `<strong style="color:#ff6600">${weather.warning}</strong><br>${city.name}: ${weather.condition} ${weather.temp}°F`);
                            })
                            .on('mousemove', moveTooltip)
                            .on('mouseleave', hideTooltip);
                    }
                }
            } catch (e) {
                // Skip city on error
            }
        }
    }

    // Earthquakes
    async function loadEarthquakes() {
        try {
            const quakeData = await __fetchJson('https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/4.5_week.geojson');

            const getQuakeColor = (mag) => {
                if (mag >= 7) return '#ff0000';
                if (mag >= 6) return '#ff4400';
                if (mag >= 5) return '#ff8800';
                return '#ffaa00';
            };

            quakeData.features?.slice(0, 30).forEach(quake => {
                const coords = quake.geometry.coordinates;
                const props = quake.properties;
                const [x, y] = projection([coords[0], coords[1]]);
                const mag = props.mag;
                const color = getQuakeColor(mag);
                const radius = Math.max(3, mag - 2);

                if (x && y) {
                    g.append('circle')
                        .attr('cx', x).attr('cy', y)
                        .attr('r', radius + 3)
                        .attr('fill', 'none')
                        .attr('stroke', color)
                        .attr('stroke-width', 1)
                        .attr('opacity', 0.4);

                    g.append('circle')
                        .attr('cx', x).attr('cy', y)
                        .attr('r', radius)
                        .attr('fill', color)
                        .attr('opacity', 0.7);

                    g.append('circle')
                        .attr('cx', x).attr('cy', y)
                        .attr('r', 10)
                        .attr('fill', 'transparent')
                        .attr('class', 'hotspot-hit')
                        .on('click', function(event) {
                            const time = new Date(props.time).toLocaleString();
                            const depth = coords[2].toFixed(1);
                            showClickableTooltip(event, `<strong style="color:${color}">M${mag.toFixed(1)} Earthquake</strong><br>${props.place}<br><span style="opacity:0.7">Depth: ${depth}km • ${time}</span>`);
                        })
                        .on('mouseenter', function(event) {
                            const time = new Date(props.time).toLocaleString();
                            const depth = coords[2].toFixed(1);
                            showHoverTooltip(event, `<strong style="color:${color}">M${mag.toFixed(1)} Earthquake</strong><br>${props.place}<br><span style="opacity:0.7">Depth: ${depth}km • ${time}</span>`);
                        })
                        .on('mousemove', moveTooltip)
                        .on('mouseleave', hideTooltip);
                }
            });

            console.log(`Loaded ${Math.min(quakeData.features?.length || 0, 30)} earthquakes`);
        } catch(quakeErr) {
            console.log('Earthquake data unavailable:', quakeErr.message);
        }
    }

    // Flight radar functions
    function looksMilitaryOrTransportCallsign(cs) {
        const c = String(cs || '').trim().toUpperCase();
        if (!c) return false;
        return (
            c.startsWith('RCH') ||
            c.startsWith('HKY') ||
            c.startsWith('CFC') ||
            c.startsWith('RRR') ||
            c.startsWith('LAGR') ||
            c.startsWith('CNV') ||
            c.startsWith('SAM') ||
            c.startsWith('NATO') ||
            c.startsWith('ASY') ||
            c.startsWith('NOH')
        );
    }

    async function refreshFlightRadar() {
        // Check rate limiting
        const now = Date.now();
        if (now - openSkyState.lastCallMs < OPENSKY_MIN_INTERVAL_MS) {
            console.log('OpenSky: Skipping call due to rate limit');
            return;
        }
        if (now < openSkyState.retryAfterMs) {
            console.log(`OpenSky: In backoff period, retry after ${Math.ceil((openSkyState.retryAfterMs - now) / 1000)}s`);
            return;
        }

        openSkyState.lastCallMs = now;

        try {
            const regions = [
                { name: 'DC', lat: 38.9, lon: -77.0 },
                { name: 'EU', lat: 50.0, lon: 10.0 },
                { name: 'ME', lat: 29.5, lon: 47.5 },
                { name: 'INDOPAC', lat: 22.0, lon: 120.0 }
            ];

            const all = [];
            for (const r of regions) {
                try {
                    const data = await __fetchJson(`https://opensky-network.org/api/states/all?lamin=${r.lat - 6}&lomin=${r.lon - 10}&lamax=${r.lat + 6}&lomax=${r.lon + 10}`);
                    const states = Array.isArray(data?.states) ? data.states : [];
                    for (const s of states) {
                        const icao24 = s?.[0];
                        const callsign = (s?.[1] || '').trim();
                        const lon = s?.[5];
                        const lat = s?.[6];
                        const velocity = s?.[9];
                        const heading = s?.[10];
                        const alt = s?.[13] ?? s?.[7];
                        if (typeof lon !== 'number' || typeof lat !== 'number') continue;
                        // If showAllFlights is true, show all; otherwise only military/transport
                        if (!showAllFlights && !looksMilitaryOrTransportCallsign(callsign)) continue;
                        all.push({ icao24, callsign, lon, lat, velocity, heading, alt });
                    }
                    openSkyState.consecutiveFailures = 0;
                } catch (e) {
                    openSkyState.consecutiveFailures++;
                    if (e.message?.includes('429') || e.message?.includes('rate')) {
                        openSkyState.backoffMs = Math.min(
                            OPENSKY_MIN_INTERVAL_MS * Math.pow(2, openSkyState.consecutiveFailures),
                            OPENSKY_MAX_BACKOFF_MS
                        );
                        openSkyState.retryAfterMs = now + openSkyState.backoffMs;
                        console.log(`OpenSky rate limited for region ${r.name}, backing off for ${openSkyState.backoffMs}ms`);
                    }
                }
            }

            const byId = new Map();
            for (const f of all) {
                if (!f.icao24) continue;
                if (!byId.has(f.icao24)) byId.set(f.icao24, f);
            }
            flightMarkers = Array.from(byId.values()).slice(0, 120);

            flightLayer.selectAll('*').remove();
            for (const f of flightMarkers) {
                const [x, y] = projection([f.lon, f.lat]);
                if (!x || !y) continue;
                const gF = flightLayer.append('g').attr('transform', `translate(${x},${y})`);

                const planeGlyph = gF.append('text')
                    .attr('x', 0)
                    .attr('y', 3)
                    .attr('fill', '#00aaff')
                    .attr('font-size', '12')
                    .attr('font-family', 'monospace')
                    .attr('text-anchor', 'middle')
                    .attr('opacity', 0.95)
                    .text('✈');
                tagScaleKind(planeGlyph, 'icon');
                planeGlyph.attr('data-base-font', '12');

                gF.append('circle')
                    .attr('r', 3.2)
                    .attr('fill', '#00aaff')
                    .attr('opacity', 0.45)
                    .attr('data-base-r', '3.2');
                gF.append('circle')
                    .attr('r', 9)
                    .attr('fill', 'transparent')
                    .attr('class', 'hotspot-hit')
                    .on('click', function(event) {
                        const kts = (typeof f.velocity === 'number') ? Math.round(f.velocity * 1.94384) : null;
                        const altFt = (typeof f.alt === 'number') ? Math.round(f.alt * 3.28084) : null;
                        const meta = [kts !== null ? `${kts} kt` : null, altFt !== null ? `${altFt.toLocaleString()} ft` : null].filter(Boolean).join(' • ');
                        showClickableTooltip(event, `<strong style="color:#00aaff">✈ ${escapeHtml(f.callsign || 'Aircraft')}</strong><br><span style="opacity:0.7">${escapeHtml(meta || '')}</span>`);
                    })
                    .on('mouseenter', function(event) {
                        const kts = (typeof f.velocity === 'number') ? Math.round(f.velocity * 1.94384) : null;
                        const altFt = (typeof f.alt === 'number') ? Math.round(f.alt * 3.28084) : null;
                        const meta = [kts !== null ? `${kts} kt` : null, altFt !== null ? `${altFt.toLocaleString()} ft` : null].filter(Boolean).join(' • ');
                        showHoverTooltip(event, `<strong style="color:#00aaff">✈ ${escapeHtml(f.callsign || 'MIL/TRANS')}</strong><br><span style="opacity:0.7">${escapeHtml(meta || '')}</span>`);
                    })
                    .on('mousemove', moveTooltip)
                    .on('mouseleave', hideTooltip);
            }

            const currentTransform = d3.zoomTransform(svg.node());
            if (currentTransform) updateMarkerScale(currentTransform.k);
        } catch (e) {
            console.log('Flight radar unavailable:', e?.message || e);
        }
    }

    // Toggle all flights visibility
    function toggleAllFlights(show) {
        showAllFlights = show;
        refreshFlightRadar();
    }

    // Overpass layer functions
    function getViewportBbox() {
        const t = d3.zoomTransform(svg.node());
        const p0 = t.invert([0, 0]);
        const p1 = t.invert([width, height]);
        const ll0 = projection.invert(p0);
        const ll1 = projection.invert(p1);
        if (!ll0 || !ll1) return null;

        const lonA = ll0[0], latA = ll0[1];
        const lonB = ll1[0], latB = ll1[1];
        const south = Math.max(-90, Math.min(latA, latB));
        const north = Math.min(90, Math.max(latA, latB));
        let west = normaliseLon180(Math.min(lonA, lonB));
        let east = normaliseLon180(Math.max(lonA, lonB));

        if (Math.abs(east - west) > 240) {
            west = -180;
            east = 180;
        }

        return { south, west, north, east };
    }

    function overpassKeyFor(bbox, zoomK) {
        const z = Math.round((zoomK || 1) * 2) / 2;
        const r = (n) => Math.round(n * 10) / 10;
        return `${z}:${r(bbox.south)},${r(bbox.west)},${r(bbox.north)},${r(bbox.east)}`;
    }

    function extractCenter(el) {
        if (!el) return null;
        if (el.type === 'node' && typeof el.lat === 'number' && typeof el.lon === 'number') return { lat: el.lat, lon: el.lon };
        const c = el.center;
        if (c && typeof c.lat === 'number' && typeof c.lon === 'number') return { lat: c.lat, lon: c.lon };
        return null;
    }

    function tagScaleKind(selection, kind) {
        selection.attr('data-scale-kind', kind);
        return selection;
    }

    function safeNameFromTags(tags, fallback) {
        const t = tags || {};
        const name = String(t.name || t['name:en'] || '').trim();
        return name || fallback;
    }

    function formatTagsSummary(tags, fields) {
        const out = [];
        for (const f of fields) {
            const v = tags?.[f];
            if (v) out.push(`${f}: ${String(v)}`);
        }
        return out.join(' • ');
    }

    function drawOsmPoint(layer, lon, lat, glyph, color, tooltipHtml, baseFont = 10) {
        const pt = projection([lon, lat]);
        if (!pt) return;
        const [x, y] = pt;
        if (!x || !y) return;

        const txt = layer.append('text')
            .attr('x', x)
            .attr('y', y + 3)
            .attr('fill', color)
            .attr('font-size', String(baseFont))
            .attr('font-family', 'monospace')
            .attr('text-anchor', 'middle')
            .attr('opacity', 0.95)
            .text(glyph);
        tagScaleKind(txt, 'icon');
        txt.attr('data-base-font', String(baseFont));

        layer.append('circle')
            .attr('cx', x).attr('cy', y)
            .attr('r', 10)
            .attr('fill', 'transparent')
            .attr('class', 'hotspot-hit')
            .on('click', function(event) {
                showClickableTooltip(event, tooltipHtml);
            })
            .on('mouseenter', function(event) {
                showHoverTooltip(event, tooltipHtml);
            })
            .on('mousemove', moveTooltip)
            .on('mouseleave', hideTooltip);
    }

    async function refreshOverpassLayers(force = false) {
        const t = d3.zoomTransform(svg.node());
        const k = t?.k || 1;

        if (k < 2.0) {
            osmNuclearLayer.selectAll('*').remove();
            osmBaseLayer.selectAll('*').remove();
            osmNavalLayer.selectAll('*').remove();
            return;
        }

        const bbox = getViewportBbox();
        if (!bbox) return;

        const key = overpassKeyFor(bbox, k);
        const nowMs = Date.now();
        if (!force) {
            if (overpassState.inFlight) return;
            if (key === overpassState.lastKey && (nowMs - overpassState.lastFetchMs) < 20000) return;
        }

        if (overpassCache.has(key)) {
            renderOverpassResult(overpassCache.get(key));
            overpassState.lastKey = key;
            overpassState.lastFetchMs = nowMs;
            updateMarkerScale(k);
            return;
        }

        overpassState.inFlight = true;
        overpassState.lastKey = key;
        overpassState.lastFetchMs = nowMs;

        try {
            const bb = `${bbox.south},${bbox.west},${bbox.north},${bbox.east}`;
            // Query for global military bases (not just regional)
            const q = `
[out:json][timeout:25];
(
  // Nuclear power plants
  node["power"="plant"]["plant:source"="nuclear"](${bb});
  way["power"="plant"]["plant:source"="nuclear"](${bb});
  relation["power"="plant"]["plant:source"="nuclear"](${bb});
  node["power"="generator"]["generator:source"="nuclear"](${bb});
  way["power"="generator"]["generator:source"="nuclear"](${bb});
  relation["power"="generator"]["generator:source"="nuclear"](${bb});

  // Military bases / facilities (global)
  node["military"~"^(base|naval_base|airfield|barracks)$"](${bb});
  way["military"~"^(base|naval_base|airfield|barracks)$"](${bb});
  relation["military"~"^(base|naval_base|airfield|barracks)$"](${bb});
  node["landuse"="military"](${bb});
  way["landuse"="military"](${bb});
  relation["landuse"="military"](${bb});
  node["aeroway"="aerodrome"]["military"~"^(yes|airfield)$"](${bb});
  way["aeroway"="aerodrome"]["military"~"^(yes|airfield)$"](${bb});
  relation["aeroway"="aerodrome"]["military"~"^(yes|airfield)$"](${bb});

  // Naval hubs
  node["harbour"="naval_base"](${bb});
  way["harbour"="naval_base"](${bb});
  relation["harbour"="naval_base"](${bb});
);
out center;
`;

            const data = await __fetchJsonPost(OVERPASS_ENDPOINT, `data=${encodeURIComponent(q)}`);
            overpassCache.set(key, data);
            renderOverpassResult(data);
            updateMarkerScale(k);
        } catch (e) {
            console.log('Overpass unavailable:', e?.message || e);
        } finally {
            overpassState.inFlight = false;
        }
    }

    function renderOverpassResult(data) {
        osmNuclearLayer.selectAll('*').remove();
        osmBaseLayer.selectAll('*').remove();
        osmNavalLayer.selectAll('*').remove();

        const els = Array.isArray(data?.elements) ? data.elements : [];
        const seen = new Set();

        for (const el of els) {
            const id = `${el.type}:${el.id}`;
            if (seen.has(id)) continue;
            seen.add(id);

            const center = extractCenter(el);
            if (!center) continue;

            const tags = el.tags || {};
            const lon = center.lon;
            const lat = center.lat;

            const isNuclear = (tags.power === 'plant' && tags['plant:source'] === 'nuclear') || (tags.power === 'generator' && tags['generator:source'] === 'nuclear');
            if (isNuclear) {
                const name = safeNameFromTags(tags, 'Nuclear');
                const meta = formatTagsSummary(tags, ['operator', 'plant:output:electricity', 'generator:output:electricity', 'wikidata']);
                const html = `<strong style="color:#ffff00">☢ ${escapeHtml(name)}</strong>${meta ? `<br><span style="opacity:0.7">${escapeHtml(meta)}</span>` : ''}`;
                drawOsmPoint(osmNuclearLayer, lon, lat, '☢', '#ffff00', html, 10);
                continue;
            }

            const mil = String(tags.military || '').trim();
            const landuse = String(tags.landuse || '').trim();
            const aeroway = String(tags.aeroway || '').trim();
            const isMil = (
                mil === 'base' || mil === 'naval_base' || mil === 'airfield' || mil === 'barracks' ||
                landuse === 'military' ||
                (aeroway === 'aerodrome' && (mil === 'yes' || mil === 'airfield'))
            );

            if (isMil) {
                const fallbackName = (mil === 'airfield' || (aeroway === 'aerodrome' && (mil === 'yes' || mil === 'airfield')))
                    ? 'Military airfield'
                    : (mil === 'naval_base' ? 'Naval base' : (mil === 'barracks' ? 'Barracks' : 'Military site'));
                const name = safeNameFromTags(tags, fallbackName);
                const kind = mil === 'naval_base' ? 'Naval base'
                    : (mil === 'airfield' ? 'Airfield'
                        : (mil === 'barracks' ? 'Barracks'
                            : (landuse === 'military' ? 'Military area' : 'Military site')));
                const meta = formatTagsSummary(tags, ['operator', 'owner', 'access', 'wikidata']);
                const html = `<strong style="color:#ff00ff">★ ${escapeHtml(name)}</strong><br><span style="opacity:0.7">${escapeHtml(kind)}${meta ? ` • ${escapeHtml(meta)}` : ''}</span>`;
                drawOsmPoint(osmBaseLayer, lon, lat, '★', '#ff00ff', html, 10);
                continue;
            }

            if (String(tags.harbour || '') === 'naval_base') {
                const name = safeNameFromTags(tags, 'Naval hub');
                const meta = formatTagsSummary(tags, ['operator', 'access', 'wikidata']);
                const html = `<strong style="color:#00aaff">⚓ ${escapeHtml(name)}</strong><br><span style="opacity:0.7">Naval hub (OSM)${meta ? ` • ${escapeHtml(meta)}` : ''}</span>`;
                drawOsmPoint(osmNavalLayer, lon, lat, '⚓', '#00aaff', html, 11);
                continue;
            }
        }
    }

    // Zoom and scaling
    function updateMarkerScale(k) {
        const kk = Math.max(1, k || 1);

        const ICON_POWER = 1.35;
        const TEXT_POWER = 1.25;
        const MIN_ICON_SCREEN_PX = 2.2;
        const MIN_TEXT_SCREEN_PX = 7.0;

        g.selectAll('circle[data-base-r]:not(.hotspot-hit)')
            .attr('r', function() {
                const base = parseFloat(this.getAttribute('data-base-r') || '0');
                const kind = this.getAttribute('data-scale-kind') || 'icon';
                const power = (kind === 'text') ? TEXT_POWER : ICON_POWER;
                const desired = base / Math.pow(kk, power);
                const minMapR = MIN_ICON_SCREEN_PX / kk;
                return Math.max(desired, minMapR);
            });

        g.selectAll('text[data-base-font]')
            .attr('font-size', function() {
                const base = parseFloat(this.getAttribute('data-base-font') || '0');
                const kind = this.getAttribute('data-scale-kind') || 'text';
                const power = kind === 'icon' ? ICON_POWER : TEXT_POWER;
                const desired = base / Math.pow(kk, power);
                const minScreen = kind === 'icon' ? MIN_ICON_SCREEN_PX : MIN_TEXT_SCREEN_PX;
                const minMap = minScreen / kk;
                return Math.max(desired, minMap).toFixed(3);
            });

        // Scale hit areas inversely with zoom to improve click targeting when zoomed in
        g.selectAll('circle.hotspot-hit')
            .attr('r', function() {
                const baseR = parseFloat(this.getAttribute('data-base-hit-r') || '10');
                // Reduce hit radius when zoomed in
                return Math.max(5, baseR / Math.sqrt(kk));
            });
    }

    function setupZoom() {
        g.selectAll('text').each(function() {
            const fs = this.getAttribute('font-size');
            if (fs) this.setAttribute('data-base-font', fs);
            if (!this.getAttribute('data-scale-kind')) this.setAttribute('data-scale-kind', 'text');
        });
        g.selectAll('circle').each(function() {
            const r = this.getAttribute('r');
            if (this.classList && this.classList.contains('hotspot-hit')) {
                // Store base hit radius for dynamic scaling
                if (r) this.setAttribute('data-base-hit-r', r);
                return;
            }
            if (r) this.setAttribute('data-base-r', r);
            if (!this.getAttribute('data-scale-kind')) this.setAttribute('data-scale-kind', 'icon');
        });

        const zoom = d3.zoom()
            .scaleExtent([1, 8])
            .on('zoom', (event) => {
                g.attr('transform', event.transform);
                updateMarkerScale(event.transform.k);
            });
        svg.call(zoom);

        let osmRefreshT = 0;
        function scheduleOsmRefresh() {
            clearTimeout(osmRefreshT);
            osmRefreshT = setTimeout(() => refreshOverpassLayers(false), 350);
        }
        zoom.on('end.osm', () => scheduleOsmRefresh());

        return zoom;
    }

    function addPulseStyles() {
        const style = document.createElement('style');
        style.textContent = `
            @keyframes pulse {
                0% { r: 3; opacity: 0.9; }
                50% { r: 6; opacity: 0.4; }
                100% { r: 3; opacity: 0.9; }
            }
            @keyframes weatherPulse {
                0% { opacity: 0.9; }
                50% { opacity: 0.5; }
                100% { opacity: 0.9; }
            }
            .hotspot-pulse { animation: pulse 2s ease-in-out infinite; }
            .hotspot-hit {
                cursor: pointer;
                pointer-events: all;
            }
            .hotspot-hit:hover {
                fill: rgba(255,255,255,0.1) !important;
            }
            .weather-alert { animation: weatherPulse 1.5s ease-in-out infinite; }
        `;
        document.head.appendChild(style);
    }

    // Function to calculate appropriate hit radius based on zoom level
    function getHitRadius(baseRadius, zoomK) {
        // Reduce hit radius when zoomed in to make it easier to click nearby items
        const k = Math.max(1, zoomK || 1);
        return Math.max(6, baseRadius / Math.sqrt(k));
    }

    // Main initialization
    async function init() {
        svg = d3.select('#mapSvg');
        tooltip = document.getElementById('mapTooltip');
        mapPanel = document.getElementById('mapPanel');

        if (!svg.node() || !tooltip || !mapPanel) {
            console.error('Map elements not found');
            return;
        }

        svg.attr('viewBox', `0 0 ${width} ${height}`);

        projection = d3.geoEquirectangular()
            .scale(130)
            .center([0, 20])
            .translate([width/2, height/2]);

        path = d3.geoPath().projection(projection);
        g = svg.append('g').attr('class', 'map-root');

        // Close tooltip when clicking on map background
        svg.on('click', function(event) {
            if (event.target === svg.node() || event.target.classList.contains('country')) {
                closeTooltip();
            }
        });

        // Create layers for flight radar and OSM data
        flightLayer = g.append('g').attr('class', 'flight-layer');
        osmLayer = g.append('g').attr('class', 'osm-layer');
        osmNuclearLayer = osmLayer.append('g').attr('class', 'osm-nuclear-layer');
        osmBaseLayer = osmLayer.append('g').attr('class', 'osm-base-layer');
        osmNavalLayer = osmLayer.append('g').attr('class', 'osm-naval-layer');

        addPulseStyles();

        try {
            const world = await __fetchJson('https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json');
            const countries = topojson.feature(world, world.objects.countries);

            drawCountries(countries);
            drawGraticule();
            drawOceanLabels();
            drawTerminator();
            drawConflictZones();
            drawChokepoints();
            drawCableLandings();
            drawNuclearSites();
            drawMilitaryBases();
            drawHotspots();

            // Load submarine cable lines (async, non-blocking)
            drawSubmarineCables();

            await loadWeatherAlerts();
            await loadGlobalWeatherEvents();
            await loadEarthquakes();

            setupZoom();
            refreshOverpassLayers(true);

            // Start flight radar refresh loop
            refreshFlightRadar();
            setInterval(refreshFlightRadar, 180000);

        } catch(e) {
            console.error('Map error:', e);
        }
    }

    // Public API
    return {
        init,
        toggleAllFlights,
        refreshFlightRadar,
        refreshOverpassLayers
    };
})();

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', MapModule.init);
} else {
    MapModule.init();
}
