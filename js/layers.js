// layers.js - Map layer controls, satellite imagery, flight data

import { SATELLITE_CONFIG, FLIGHT_CACHE_DURATION } from './constants.js';
import { getMapViewMode } from './map.js';

// Map layer visibility state
export const mapLayers = {
    hotspots: true,
    chokepoints: true,
    earthquakes: false,
    cyber: false,
    conflicts: true,
    intel: false,
    bases: false,
    nuclear: false,
    cables: false,
    sanctions: false,
    flights: false,
    satellite: false,
    density: false
};

// Flight data cache
let flightDataCache = null;
let flightDataTimestamp = 0;

// Toggle map layer visibility
export function toggleLayer(layerName, refreshCallback) {
    mapLayers[layerName] = !mapLayers[layerName];
    if (refreshCallback) {
        refreshCallback();
    }
}

// Toggle satellite layer with special handling
export function toggleSatelliteLayer(refreshCallback) {
    mapLayers.satellite = !mapLayers.satellite;

    const canvas = document.getElementById('satelliteCanvas');
    const attribution = document.getElementById('satelliteAttribution');
    const svg = document.getElementById('worldMapSVG');

    if (mapLayers.satellite) {
        // Show loading indicator
        const loading = document.getElementById('satelliteLoading');
        if (loading) loading.classList.add('visible');

        // Render satellite tiles
        renderSatelliteTiles().then(() => {
            if (loading) loading.classList.remove('visible');
            if (canvas) canvas.classList.add('visible');
            if (attribution) attribution.classList.add('visible');
            if (svg) svg.style.opacity = '0.7';
        });
    } else {
        if (canvas) canvas.classList.remove('visible');
        if (attribution) attribution.classList.remove('visible');
        if (svg) svg.style.opacity = '1';
    }

    if (refreshCallback) {
        refreshCallback();
    }
}

// Render satellite tiles to canvas
export async function renderSatelliteTiles() {
    const canvas = document.getElementById('satelliteCanvas');
    if (!canvas) return;

    const container = document.getElementById('worldMapContainer');
    const width = container.offsetWidth || 800;
    const height = container.offsetHeight || 550;

    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext('2d');

    // Determine tile parameters based on view
    const mapViewMode = getMapViewMode();
    const isUSView = mapViewMode === 'us';
    const isMidEastView = mapViewMode === 'mideast';
    const isUkraineView = mapViewMode === 'ukraine';
    const isTaiwanView = mapViewMode === 'taiwan';

    let bounds, zoom;

    if (isUSView) {
        bounds = { north: 50, south: 24, east: -66, west: -125 };
        zoom = 4;
    } else if (isMidEastView) {
        bounds = { north: 42, south: 12, east: 63, west: 25 };
        zoom = 4;
    } else if (isUkraineView) {
        bounds = { north: 58, south: 42, east: 45, west: 22 };
        zoom = 4;
    } else if (isTaiwanView) {
        bounds = { north: 42, south: 5, east: 145, west: 100 };
        zoom = 4;
    } else {
        bounds = { north: 85, south: -85, east: 180, west: -180 };
        zoom = 2;
    }

    // Calculate tile range
    const tileCount = Math.pow(2, zoom);

    // Convert bounds to tile coordinates
    const minTileX = Math.floor((bounds.west + 180) / 360 * tileCount);
    const maxTileX = Math.floor((bounds.east + 180) / 360 * tileCount);
    const minTileY = Math.floor((1 - Math.log(Math.tan(bounds.north * Math.PI / 180) + 1 / Math.cos(bounds.north * Math.PI / 180)) / Math.PI) / 2 * tileCount);
    const maxTileY = Math.floor((1 - Math.log(Math.tan(bounds.south * Math.PI / 180) + 1 / Math.cos(bounds.south * Math.PI / 180)) / Math.PI) / 2 * tileCount);

    // Load and draw tiles
    const tilePromises = [];

    for (let x = minTileX; x <= maxTileX; x++) {
        for (let y = minTileY; y <= maxTileY; y++) {
            const tileX = ((x % tileCount) + tileCount) % tileCount;
            const tileY = Math.max(0, Math.min(tileCount - 1, y));

            const url = SATELLITE_CONFIG.esri.url
                .replace('{z}', zoom)
                .replace('{x}', tileX)
                .replace('{y}', tileY);

            const promise = loadTileImage(url).then(img => {
                if (!img) return;

                // Calculate tile position on canvas
                const tileLonWidth = 360 / tileCount;
                const tileLon = x * tileLonWidth - 180;

                // Mercator Y calculation
                const n = Math.PI - 2 * Math.PI * tileY / tileCount;
                const tileLat = 180 / Math.PI * Math.atan(0.5 * (Math.exp(n) - Math.exp(-n)));

                const n2 = Math.PI - 2 * Math.PI * (tileY + 1) / tileCount;
                const tileLat2 = 180 / Math.PI * Math.atan(0.5 * (Math.exp(n2) - Math.exp(-n2)));

                // Convert to canvas coordinates
                const canvasX = ((tileLon - bounds.west) / (bounds.east - bounds.west)) * width;
                const canvasX2 = ((tileLon + tileLonWidth - bounds.west) / (bounds.east - bounds.west)) * width;
                const canvasY = ((bounds.north - tileLat) / (bounds.north - bounds.south)) * height;
                const canvasY2 = ((bounds.north - tileLat2) / (bounds.north - bounds.south)) * height;

                const tileWidth = canvasX2 - canvasX;
                const tileHeight = canvasY2 - canvasY;

                ctx.drawImage(img, canvasX, canvasY, tileWidth, tileHeight);
            }).catch(e => {
                console.warn('Tile load failed:', e);
            });

            tilePromises.push(promise);
        }
    }

    await Promise.all(tilePromises);
}

// Load a single tile image
export function loadTileImage(url) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => resolve(img);
        img.onerror = () => resolve(null);
        img.src = url;

        // Timeout after 10 seconds
        setTimeout(() => resolve(null), 10000);
    });
}

// Fetch flight data from OpenSky Network API
export async function fetchFlightData(bounds = null) {
    const now = Date.now();

    // Return cached data if still valid
    if (flightDataCache && (now - flightDataTimestamp) < FLIGHT_CACHE_DURATION) {
        return flightDataCache;
    }

    try {
        let url = 'https://opensky-network.org/api/states/all';

        if (bounds) {
            url += `?lamin=${bounds.south}&lomin=${bounds.west}&lamax=${bounds.north}&lomax=${bounds.east}`;
        }

        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        const data = await response.json();

        // Parse OpenSky response format
        const flights = (data.states || []).slice(0, 500).map(s => ({
            icao24: s[0],
            callsign: (s[1] || '').trim(),
            country: s[2],
            lon: s[5],
            lat: s[6],
            altitude: s[7] || s[13],
            onGround: s[8],
            velocity: s[9],
            heading: s[10],
            verticalRate: s[11],
            squawk: s[14]
        })).filter(f => f.lat && f.lon && !f.onGround);

        flightDataCache = flights;
        flightDataTimestamp = now;

        return flights;
    } catch (error) {
        console.error('Failed to fetch flight data:', error);
        return flightDataCache || [];
    }
}

// Classify aircraft type based on callsign patterns
export function classifyAircraft(callsign, country) {
    const cs = (callsign || '').toUpperCase();

    // Military patterns
    if (/^(RCH|JAKE|DUKE|EVAC|AIR|RRR|NAVY|ARMY|USAF|RAF|IAF)/i.test(cs) ||
        ['United States', 'Russia', 'China'].includes(country) && /^\d{5,}$/.test(cs)) {
        return 'military';
    }

    // Cargo/freight patterns
    if (/^(FDX|UPS|DHL|GTI|ABX|ATN|CLX)/i.test(cs)) {
        return 'cargo';
    }

    // Helicopter patterns
    if (cs.length <= 4 && /^[A-Z]{1,2}\d{2,3}$/.test(cs)) {
        return 'helicopter';
    }

    return 'commercial';
}

// Get aircraft direction arrow based on heading
export function getAircraftArrow(heading) {
    if (heading === null || heading === undefined) return '✈';
    const normalized = ((heading % 360) + 360) % 360;
    if (normalized >= 337.5 || normalized < 22.5) return '↑';
    if (normalized >= 22.5 && normalized < 67.5) return '↗';
    if (normalized >= 67.5 && normalized < 112.5) return '→';
    if (normalized >= 112.5 && normalized < 157.5) return '↘';
    if (normalized >= 157.5 && normalized < 202.5) return '↓';
    if (normalized >= 202.5 && normalized < 247.5) return '↙';
    if (normalized >= 247.5 && normalized < 292.5) return '←';
    if (normalized >= 292.5 && normalized < 337.5) return '↖';
    return '✈';
}
