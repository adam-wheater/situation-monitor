// Map data loaders (TopoJSON, cables, etc.)

let worldMapData = null;
let usStatesData = null;
let cableGeoData = null;
let warnedCableGeoFileProtocol = false;

async function loadWorldMap() {
    if (worldMapData) return worldMapData;

    if (location && location.protocol === 'file:') {
        console.warn('Cannot load local files via file:// protocol. Run a local server.');
        return null;
    }

    try {
        const local = await fetch('data/countries-110m.json', { cache: 'no-store' });
        if (local.ok) {
            worldMapData = await local.json();
            return worldMapData;
        }
    } catch (e) {
        console.warn('Local world map failed, trying CDN:', e);
    }

    try {
        const text = await fetchWithProxy(
            'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json',
            { accept: 'application/json, text/plain, */*' }
        );
        worldMapData = JSON.parse(text);
        return worldMapData;
    } catch (e) {
        console.error('Failed to load world map:', e);
        return null;
    }
}

async function loadUSStates() {
    if (usStatesData) return usStatesData;
    try {
        const local = await fetch('data/states-10m.json', { cache: 'no-store' });
        if (local.ok) {
            usStatesData = await local.json();
            return usStatesData;
        }

        const text = await fetchWithProxy(
            'https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json',
            { accept: 'application/json, text/plain, */*' }
        );
        usStatesData = JSON.parse(text);
        return usStatesData;
    } catch (e) {
        console.error('Failed to load US states:', e);
        return null;
    }
}

async function loadCableGeoData() {
    if (cableGeoData) return cableGeoData;
    try {
        if (location && location.protocol === 'file:') {
            if (!warnedCableGeoFileProtocol) {
                warnedCableGeoFileProtocol = true;
                console.warn('Cannot load data/cables-geo.json when opened via file://');
            }
            cableGeoData = null;
            return null;
        }

        const response = await fetch('data/cables-geo.json', { cache: 'no-store' });
        if (!response.ok) {
            cableGeoData = null;
            return null;
        }
        cableGeoData = await response.json();
        return cableGeoData;
    } catch {
        cableGeoData = null;
        return null;
    }
}

// Analyze news for hotspot activity
function analyzeHotspotActivity(allNews) {
    const results = {};

    INTEL_HOTSPOTS.forEach(spot => {
        let score = 0;
        let matchedHeadlines = [];

        allNews.forEach(item => {
            const title = item.title.toLowerCase();
            const matchedKeywords = spot.keywords.filter(kw => title.includes(kw));
            if (matchedKeywords.length > 0) {
                score += matchedKeywords.length;
                if (item.isAlert) score += 3;
                matchedHeadlines.push({
                    title: item.title,
                    link: item.link,
                    source: item.source,
                    isAlert: item.isAlert
                });
            }
        });

        let level = 'low';
        if (score >= 8) level = 'high';
        else if (score >= 3) level = 'elevated';

        results[spot.id] = { level, score, headlines: matchedHeadlines.slice(0, 5) };
    });

    return results;
}

// Calculate news density by region
function calculateNewsDensity(allNews) {
    const scores = {};

    if (!allNews || !NEWS_REGIONS) return scores;

    NEWS_REGIONS.forEach(region => {
        let count = 0;
        allNews.forEach(item => {
            const title = (item.title || '').toLowerCase();
            if (region.keywords.some(kw => title.includes(kw.toLowerCase()))) {
                count++;
            }
        });
        scores[region.id] = count;
    });

    return scores;
}
