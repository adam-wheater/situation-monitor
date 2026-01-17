// Overpass API service for fetching OSM data (military bases, nuclear plants)

const OVERPASS_API_URL = 'https://overpass-api.de/api/interpreter';
const OVERPASS_CACHE_KEY = 'overpassCache';
const OVERPASS_CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

// Rate limiting: 1 request per second
let lastOverpassRequest = 0;
const OVERPASS_MIN_INTERVAL_MS = 1000;

/**
 * Get cached Overpass data
 */
function getOverpassCache() {
    try {
        const raw = localStorage.getItem(OVERPASS_CACHE_KEY);
        return raw ? JSON.parse(raw) : {};
    } catch {
        return {};
    }
}

/**
 * Save to Overpass cache
 */
function saveOverpassCache(cache) {
    try {
        localStorage.setItem(OVERPASS_CACHE_KEY, JSON.stringify(cache));
    } catch {
        // Storage full or unavailable - silently ignore
    }
}

/**
 * Check if cached data is still valid
 */
function isCacheValid(cacheEntry) {
    if (!cacheEntry || !cacheEntry.timestamp) return false;
    return Date.now() - cacheEntry.timestamp < OVERPASS_CACHE_TTL_MS;
}

/**
 * Rate-limited delay before making Overpass request
 */
async function waitForRateLimit() {
    const now = Date.now();
    const elapsed = now - lastOverpassRequest;
    if (elapsed < OVERPASS_MIN_INTERVAL_MS) {
        await new Promise(resolve => setTimeout(resolve, OVERPASS_MIN_INTERVAL_MS - elapsed));
    }
    lastOverpassRequest = Date.now();
}

/**
 * Execute an Overpass query via the proxy
 */
async function queryOverpass(query) {
    await waitForRateLimit();

    const url = `${OVERPASS_API_URL}?data=${encodeURIComponent(query)}`;

    // Use fetchWithProxy if available, otherwise direct fetch
    if (typeof fetchWithProxy === 'function') {
        const data = await fetchWithProxy(url, {
            accept: 'application/json',
            responseType: 'json'
        });
        return data;
    }

    // Fallback to direct fetch (may fail due to CORS)
    const response = await fetch(url, {
        headers: { 'Accept': 'application/json' }
    });
    if (!response.ok) {
        throw new Error(`Overpass API error: ${response.status}`);
    }
    return await response.json();
}

/**
 * Build Overpass query for military bases in a bounding box
 */
function buildMilitaryBasesQuery(south, west, north, east) {
    return `
[out:json][timeout:25];
(
  node["military"="base"](${south},${west},${north},${east});
  way["military"="base"](${south},${west},${north},${east});
  relation["military"="base"](${south},${west},${north},${east});
  node["military"="naval_base"](${south},${west},${north},${east});
  way["military"="naval_base"](${south},${west},${north},${east});
  relation["military"="naval_base"](${south},${west},${north},${east});
  node["military"="airfield"](${south},${west},${north},${east});
  way["military"="airfield"](${south},${west},${north},${east});
  relation["military"="airfield"](${south},${west},${north},${east});
);
out center;
`.trim();
}

/**
 * Build Overpass query for nuclear facilities in a bounding box
 */
function buildNuclearFacilitiesQuery(south, west, north, east) {
    return `
[out:json][timeout:25];
(
  node["power"="plant"]["plant:source"="nuclear"](${south},${west},${north},${east});
  way["power"="plant"]["plant:source"="nuclear"](${south},${west},${north},${east});
  relation["power"="plant"]["plant:source"="nuclear"](${south},${west},${north},${east});
  node["power"="generator"]["generator:source"="nuclear"](${south},${west},${north},${east});
  way["power"="generator"]["generator:source"="nuclear"](${south},${west},${north},${east});
  relation["power"="generator"]["generator:source"="nuclear"](${south},${west},${north},${east});
);
out center;
`.trim();
}

/**
 * Parse Overpass response into standardized format
 */
function parseOverpassElements(elements, type) {
    const results = [];
    const seen = new Set();

    for (const el of elements) {
        // Get coordinates (center for ways/relations, direct for nodes)
        let lat, lon;
        if (el.type === 'node') {
            lat = el.lat;
            lon = el.lon;
        } else if (el.center) {
            lat = el.center.lat;
            lon = el.center.lon;
        } else {
            continue; // Skip elements without coordinates
        }

        // Skip duplicates by proximity (within ~100m)
        const key = `${Math.round(lat * 100)},${Math.round(lon * 100)}`;
        if (seen.has(key)) continue;
        seen.add(key);

        const tags = el.tags || {};
        const name = tags.name || tags['name:en'] || tags.operator || 'Unknown';

        let subtype = 'unknown';
        if (type === 'military') {
            subtype = tags.military || 'base';
        } else if (type === 'nuclear') {
            subtype = tags['plant:source'] === 'nuclear' ? 'plant' :
                     (tags['generator:source'] === 'nuclear' ? 'generator' : 'facility');
        }

        results.push({
            id: `osm_${el.type}_${el.id}`,
            name,
            lat,
            lon,
            type: subtype,
            source: 'overpass',
            tags
        });
    }

    return results;
}

/**
 * Fetch military bases for a bounding box (with caching)
 */
async function fetchMilitaryBasesOverpass(south, west, north, east) {
    const cacheKey = `military_${Math.round(south)}_${Math.round(west)}_${Math.round(north)}_${Math.round(east)}`;
    const cache = getOverpassCache();

    if (cache[cacheKey] && isCacheValid(cache[cacheKey])) {
        return cache[cacheKey].data;
    }

    try {
        const query = buildMilitaryBasesQuery(south, west, north, east);
        const response = await queryOverpass(query);
        const elements = response?.elements || [];
        const parsed = parseOverpassElements(elements, 'military');

        // Cache the result
        cache[cacheKey] = {
            timestamp: Date.now(),
            data: parsed
        };
        saveOverpassCache(cache);

        return parsed;
    } catch (e) {
        console.error('Overpass military bases fetch failed:', e);
        return [];
    }
}

/**
 * Fetch nuclear facilities for a bounding box (with caching)
 */
async function fetchNuclearFacilitiesOverpass(south, west, north, east) {
    const cacheKey = `nuclear_${Math.round(south)}_${Math.round(west)}_${Math.round(north)}_${Math.round(east)}`;
    const cache = getOverpassCache();

    if (cache[cacheKey] && isCacheValid(cache[cacheKey])) {
        return cache[cacheKey].data;
    }

    try {
        const query = buildNuclearFacilitiesQuery(south, west, north, east);
        const response = await queryOverpass(query);
        const elements = response?.elements || [];
        const parsed = parseOverpassElements(elements, 'nuclear');

        // Cache the result
        cache[cacheKey] = {
            timestamp: Date.now(),
            data: parsed
        };
        saveOverpassCache(cache);

        return parsed;
    } catch (e) {
        console.error('Overpass nuclear facilities fetch failed:', e);
        return [];
    }
}

/**
 * Get bounding box from Globe.gl point of view
 * Returns { south, west, north, east } or null if too zoomed out
 */
function getBoundingBoxFromPOV(pov, minAltitude = 0.5) {
    if (!pov || pov.altitude > minAltitude) {
        return null; // Too zoomed out, don't query
    }

    // Approximate visible area based on altitude
    // At altitude 0.5, roughly 30 degrees visible
    // At altitude 0.2, roughly 10 degrees visible
    const degreeSpan = pov.altitude * 60;

    const lat = pov.lat || 0;
    const lng = pov.lng || 0;

    return {
        south: Math.max(-90, lat - degreeSpan / 2),
        north: Math.min(90, lat + degreeSpan / 2),
        west: lng - degreeSpan / 2,
        east: lng + degreeSpan / 2
    };
}

/**
 * Merge Overpass results with existing hardcoded data
 * Deduplicates by proximity
 */
function mergeWithExisting(overpassData, existingData, proximityThresholdKm = 5) {
    const merged = [...existingData];
    const existingCoords = new Set(
        existingData.map(d => `${Math.round(d.lat * 10)},${Math.round((d.lon || d.lng) * 10)}`)
    );

    for (const item of overpassData) {
        const key = `${Math.round(item.lat * 10)},${Math.round(item.lon * 10)}`;
        if (!existingCoords.has(key)) {
            merged.push(item);
        }
    }

    return merged;
}

// State for tracking Overpass data
let overpassMilitaryBases = [];
let overpassNuclearFacilities = [];
let lastOverpassFetchPOV = null;

/**
 * Fetch Overpass data if zoomed in enough and POV changed significantly
 */
async function updateOverpassDataForPOV(pov) {
    const bbox = getBoundingBoxFromPOV(pov, 0.5);
    if (!bbox) {
        // Zoomed out - clear Overpass data, use only constants
        overpassMilitaryBases = [];
        overpassNuclearFacilities = [];
        return { militaryBases: [], nuclearFacilities: [] };
    }

    // Check if POV changed significantly (>5 degrees or altitude changed)
    if (lastOverpassFetchPOV) {
        const latDiff = Math.abs(pov.lat - lastOverpassFetchPOV.lat);
        const lngDiff = Math.abs(pov.lng - lastOverpassFetchPOV.lng);
        const altDiff = Math.abs(pov.altitude - lastOverpassFetchPOV.altitude);
        if (latDiff < 5 && lngDiff < 5 && altDiff < 0.1) {
            return { militaryBases: overpassMilitaryBases, nuclearFacilities: overpassNuclearFacilities };
        }
    }

    lastOverpassFetchPOV = { ...pov };

    // Fetch both in parallel
    const [bases, nuclear] = await Promise.all([
        fetchMilitaryBasesOverpass(bbox.south, bbox.west, bbox.north, bbox.east),
        fetchNuclearFacilitiesOverpass(bbox.south, bbox.west, bbox.north, bbox.east)
    ]);

    overpassMilitaryBases = bases;
    overpassNuclearFacilities = nuclear;

    return { militaryBases: bases, nuclearFacilities: nuclear };
}

/**
 * Get all military bases (constants + Overpass)
 */
function getAllMilitaryBases() {
    if (typeof MILITARY_BASES !== 'undefined') {
        return mergeWithExisting(overpassMilitaryBases, MILITARY_BASES);
    }
    return overpassMilitaryBases;
}

/**
 * Get all nuclear facilities (constants + Overpass)
 */
function getAllNuclearFacilities() {
    if (typeof NUCLEAR_FACILITIES !== 'undefined') {
        return mergeWithExisting(overpassNuclearFacilities, NUCLEAR_FACILITIES);
    }
    return overpassNuclearFacilities;
}

/**
 * Clear Overpass cache
 */
function clearOverpassCache() {
    try {
        localStorage.removeItem(OVERPASS_CACHE_KEY);
    } catch { }
    overpassMilitaryBases = [];
    overpassNuclearFacilities = [];
    lastOverpassFetchPOV = null;
}
