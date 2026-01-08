// map.js - D3 map rendering, zoom/pan, projections

import {
    INTEL_HOTSPOTS, NEWS_REGIONS, CONFLICT_ZONES, MILITARY_BASES, NUCLEAR_FACILITIES,
    UNDERSEA_CABLES, SANCTIONED_COUNTRIES, SHIPPING_CHOKEPOINTS, CYBER_REGIONS,
    US_CITIES, US_HOTSPOTS, MIDEAST_HOTSPOTS, UKRAINE_HOTSPOTS, TAIWAN_HOTSPOTS,
    MAP_ZOOM_MIN, MAP_ZOOM_MAX, MAP_ZOOM_STEP
} from './constants.js';
import { escapeHtml, getTimeAgo } from './utils.js';
import {
    hideHotspotPopup, hideChokepointPopup, hideQuakePopup, hideCyberPopup,
    hideCustomHotspotPopup, hideConflictPopup, hideUSCityPopup, hideUSHotspotPopup,
    hideAircraftPopup, showHotspotPopup, showConflictPopup, showUSCityPopup,
    showUSHotspotPopup, showChokepointPopup, showQuakePopup, showCyberPopup,
    showCustomHotspotPopup, showAircraftPopup
} from './popups.js';

// Map state
let mapZoom = 1;
let mapPan = { x: 0, y: 0 };
let isPanning = false;
let panStart = { x: 0, y: 0 };
let mapViewMode = 'global';

// World map data cache
let worldMapData = null;
let usStatesData = null;

// Export state getters/setters
export function getMapViewMode() { return mapViewMode; }
export function getMapZoom() { return mapZoom; }
export function getMapPan() { return mapPan; }

// Load world map TopoJSON data
export async function loadWorldMap() {
    if (worldMapData) return worldMapData;
    try {
        const response = await fetch('https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json');
        worldMapData = await response.json();
        return worldMapData;
    } catch (e) {
        console.error('Failed to load world map:', e);
        return null;
    }
}

// Load US states TopoJSON data
export async function loadUSStates() {
    if (usStatesData) return usStatesData;
    try {
        const response = await fetch('https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json');
        usStatesData = await response.json();
        return usStatesData;
    } catch (e) {
        console.error('Failed to load US states:', e);
        return null;
    }
}

// Map zoom functions
export function mapZoomIn() {
    if (mapZoom < MAP_ZOOM_MAX) {
        mapZoom = Math.min(MAP_ZOOM_MAX, mapZoom + MAP_ZOOM_STEP);
        applyMapTransform();
    }
}

export function mapZoomOut() {
    if (mapZoom > MAP_ZOOM_MIN) {
        mapZoom = Math.max(MAP_ZOOM_MIN, mapZoom - MAP_ZOOM_STEP);
        if (mapZoom === 1) {
            mapPan = { x: 0, y: 0 };
        }
        applyMapTransform();
    }
}

export function mapZoomReset() {
    mapZoom = 1;
    mapPan = { x: 0, y: 0 };
    applyMapTransform();
}

// Switch between map views
export function setMapView(mode, refreshCallback) {
    if (mapViewMode === mode) return;
    mapViewMode = mode;
    mapZoom = 1;
    mapPan = { x: 0, y: 0 };
    // Always call refresh callback to re-render the map with new projection
    if (refreshCallback) {
        refreshCallback();
    }
}

// Apply zoom/pan transform to map
export function applyMapTransform() {
    const wrapper = document.getElementById('mapZoomWrapper');
    const levelDisplay = document.getElementById('mapZoomLevel');
    const panHint = document.getElementById('mapPanHint');

    if (wrapper) {
        wrapper.style.transform = `scale(${mapZoom}) translate(${mapPan.x}px, ${mapPan.y}px)`;
    }
    if (levelDisplay) {
        levelDisplay.textContent = `${mapZoom.toFixed(1)}x`;
    }
    if (panHint) {
        panHint.classList.toggle('show', mapZoom > 1);
    }
}

// Initialize map panning
export function initMapPan() {
    const container = document.getElementById('worldMapContainer');
    if (!container) return;

    container.addEventListener('mousedown', (e) => {
        if (mapZoom <= 1) return;
        if (e.target.closest('.map-zoom-controls')) return;

        isPanning = true;
        panStart = { x: e.clientX - mapPan.x * mapZoom, y: e.clientY - mapPan.y * mapZoom };
        container.style.cursor = 'grabbing';
    });

    document.addEventListener('mousemove', (e) => {
        if (!isPanning) return;

        const maxPan = (mapZoom - 1) * 200;
        mapPan.x = Math.max(-maxPan, Math.min(maxPan, (e.clientX - panStart.x) / mapZoom));
        mapPan.y = Math.max(-maxPan, Math.min(maxPan, (e.clientY - panStart.y) / mapZoom));
        applyMapTransform();
    });

    document.addEventListener('mouseup', () => {
        if (isPanning) {
            isPanning = false;
            const container = document.getElementById('worldMapContainer');
            if (container) container.style.cursor = '';
        }
    });

    // Mouse wheel zoom
    container.addEventListener('wheel', (e) => {
        e.preventDefault();
        if (e.deltaY < 0) {
            mapZoomIn();
        } else {
            mapZoomOut();
        }
    }, { passive: false });
}

// Analyze news for hotspot activity
export function analyzeHotspotActivity(allNews) {
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

// Calculate news density for each region
export function calculateNewsDensity(allNews) {
    const scores = {};
    NEWS_REGIONS.forEach(region => {
        let score = 0;
        allNews.forEach(item => {
            const title = (item.title || '').toLowerCase();
            region.keywords.forEach(kw => {
                if (title.includes(kw)) score++;
            });
            if (item.isAlert) score += 2;
        });
        scores[region.id] = score;
    });
    return scores;
}

// Update flashback time display
export function updateFlashback(hoursAgo) {
    const flashbackTime = document.getElementById('flashbackTime');
    const flashbackIndicator = document.getElementById('flashbackIndicator');

    if (parseInt(hoursAgo) === 0) {
        flashbackTime.textContent = 'LIVE';
        if (flashbackIndicator) flashbackIndicator.classList.remove('active');
    } else {
        const now = new Date();
        now.setHours(now.getHours() - parseInt(hoursAgo));
        flashbackTime.textContent = `-${hoursAgo}h`;
        if (flashbackIndicator) flashbackIndicator.classList.add('active');
    }
}

// Render the global map
export async function renderGlobalMap(activityData, earthquakes = [], allNews = [], mapLayers, getMonitorHotspots, fetchFlightData, classifyAircraft, getAircraftArrow) {
    console.log('renderGlobalMap called', { activityData, earthquakesCount: earthquakes.length, allNewsCount: allNews.length, mapLayers });

    // Cache allNews for popup access
    window.cachedAllNews = allNews;

    const panel = document.getElementById('mapPanel');
    console.log('mapPanel element:', panel);
    const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19) + ' UTC';

    const isUSView = mapViewMode === 'us';
    const isMidEastView = mapViewMode === 'mideast';
    const isUkraineView = mapViewMode === 'ukraine';
    const isTaiwanView = mapViewMode === 'taiwan';
    const isRegionalView = isUSView || isMidEastView || isUkraineView || isTaiwanView;

    let mapTitle, mapLegend;
    if (isUSView) {
        mapTitle = 'US DOMESTIC MONITOR';
        mapLegend = '★ CAPITAL | ● MAJOR | ○ REGIONAL';
    } else if (isMidEastView) {
        mapTitle = 'MIDDLE EAST MONITOR';
        mapLegend = '💥 CONFLICT | ☢ NUCLEAR | ⚠ CRISIS';
    } else if (isUkraineView) {
        mapTitle = 'UKRAINE-RUSSIA THEATER';
        mapLegend = '⚔ FRONT | 🛡 DEFENSE | 🎯 STRIKE';
    } else if (isTaiwanView) {
        mapTitle = 'CHINA-TAIWAN THEATER';
        mapLegend = '⚡ FLASHPOINT | 🏝 DISPUTED | 🛡 DEFENSE';
    } else {
        mapTitle = 'GLOBAL ACTIVITY MONITOR';
        mapLegend = '⚓ SHIP | ☢ NUKES | ▪ BASES | ═ CABLES';
    }

    panel.innerHTML = `
        <div class="world-map" id="worldMapContainer">
            <div class="map-zoom-wrapper" id="mapZoomWrapper">
                <canvas id="satelliteCanvas" class="satellite-canvas"></canvas>
                <div class="satellite-loading" id="satelliteLoading">Loading satellite imagery...</div>
                <div class="satellite-attribution" id="satelliteAttribution">Imagery: ESRI World Imagery</div>
                <svg id="worldMapSVG"></svg>
                <div class="map-overlays" id="mapOverlays"></div>
            </div>
            <div class="map-view-toggle">
                <button class="map-view-btn ${mapViewMode === 'global' ? 'active' : ''}" onclick="setMapView('global')">GLOBAL</button>
                <button class="map-view-btn ${isUSView ? 'active' : ''}" onclick="setMapView('us')">US</button>
                <button class="map-view-btn ${isMidEastView ? 'active' : ''}" onclick="setMapView('mideast')">MIDEAST</button>
                <button class="map-view-btn ${isUkraineView ? 'active' : ''}" onclick="setMapView('ukraine')">UKRAINE</button>
                <button class="map-view-btn ${isTaiwanView ? 'active' : ''}" onclick="setMapView('taiwan')">TAIWAN</button>
            </div>
            <div class="map-zoom-controls">
                <button class="map-zoom-btn" onclick="mapZoomIn()" title="Zoom In">+</button>
                <div class="map-zoom-level" id="mapZoomLevel">1.0x</div>
                <button class="map-zoom-btn" onclick="mapZoomOut()" title="Zoom Out">−</button>
                <button class="map-zoom-btn map-zoom-reset" onclick="mapZoomReset()" title="Reset">RST</button>
            </div>
            <div class="map-pan-hint" id="mapPanHint">DRAG TO PAN</div>
            <div class="conflict-popup" id="conflictPopup"></div>
            <div class="us-city-popup" id="usCityPopup"></div>
            <div class="map-corner-label tl">${mapTitle}</div>
            <div class="map-corner-label tr">CLASSIFICATION: OPEN SOURCE</div>
            <div class="map-corner-label bl">${mapLegend}</div>
            <div class="map-corner-label br">${timestamp}</div>
        </div>
    `;

    const container = document.getElementById('worldMapContainer');
    const svg = d3.select('#worldMapSVG');
    const width = container.offsetWidth || 800;
    const height = container.offsetHeight || 550;

    svg.attr('width', '100%')
       .attr('height', '100%')
       .attr('viewBox', `0 0 ${width} ${height}`)
       .attr('preserveAspectRatio', 'none');

    // Create projection based on view mode
    let projection;
    if (isUSView) {
        projection = d3.geoAlbersUsa()
            .scale(width * 1.3)
            .translate([width / 2, height / 2]);
    } else if (isMidEastView) {
        projection = d3.geoMercator()
            .center([42, 28])
            .scale(width * 1.5)
            .translate([width / 2, height / 2]);
    } else if (isUkraineView) {
        projection = d3.geoMercator()
            .center([35, 50])
            .scale(width * 2.2)
            .translate([width / 2, height / 2]);
    } else if (isTaiwanView) {
        projection = d3.geoMercator()
            .center([118, 23])
            .scale(width * 1.8)
            .translate([width / 2, height / 2]);
    } else {
        projection = d3.geoEquirectangular()
            .scale(width / (2 * Math.PI))
            .center([0, 0])
            .translate([width / 2, height / 2]);
    }

    // Test projection
    const testCoord = projection([-77, 38.9]); // DC coordinates
    console.log('Projection test (DC):', { input: [-77, 38.9], output: testCoord, width, height });

    const path = d3.geoPath().projection(projection);

    // Add background
    svg.append('rect')
        .attr('width', width)
        .attr('height', height)
        .attr('fill', '#020a08');

    // Add grid pattern
    const defs = svg.append('defs');

    const smallGrid = defs.append('pattern')
        .attr('id', 'smallGridD3')
        .attr('width', 20)
        .attr('height', 20)
        .attr('patternUnits', 'userSpaceOnUse');
    smallGrid.append('path')
        .attr('d', 'M 20 0 L 0 0 0 20')
        .attr('fill', 'none')
        .attr('stroke', '#0a2a20')
        .attr('stroke-width', 0.5);

    const grid = defs.append('pattern')
        .attr('id', 'gridD3')
        .attr('width', 60)
        .attr('height', 60)
        .attr('patternUnits', 'userSpaceOnUse');
    grid.append('rect')
        .attr('width', 60)
        .attr('height', 60)
        .attr('fill', 'url(#smallGridD3)');
    grid.append('path')
        .attr('d', 'M 60 0 L 0 0 0 60')
        .attr('fill', 'none')
        .attr('stroke', '#0d3a2d')
        .attr('stroke-width', 0.8);

    svg.append('rect')
        .attr('width', width)
        .attr('height', height)
        .attr('fill', 'url(#gridD3)');

    // Add graticule
    const graticule = d3.geoGraticule().step([30, 30]);
    svg.append('path')
        .datum(graticule)
        .attr('d', path)
        .attr('fill', 'none')
        .attr('stroke', '#0f4035')
        .attr('stroke-width', 0.5)
        .attr('stroke-opacity', 0.5);

    // Load and render countries
    const world = await loadWorldMap();
    if (world) {
        const countries = topojson.feature(world, world.objects.countries);

        svg.append('g')
            .attr('class', 'countries-layer')
            .selectAll('path')
            .data(countries.features)
            .enter()
            .append('path')
            .attr('d', path)
            .attr('fill', d => {
                if (mapLayers.sanctions) {
                    const countryId = d.id;
                    const sanctionLevel = SANCTIONED_COUNTRIES[countryId];
                    if (sanctionLevel === 'severe') return '#660000';
                    if (sanctionLevel === 'high') return '#442200';
                    if (sanctionLevel === 'moderate') return '#333300';
                    if (sanctionLevel === 'low') return '#223322';
                }
                return '#0a2018';
            })
            .attr('stroke', '#0f5040')
            .attr('stroke-width', 0.5);

        // Add US state boundaries (US view only)
        if (isUSView) {
            const usStates = await loadUSStates();
            if (usStates) {
                const states = topojson.feature(usStates, usStates.objects.states);
                const stateBorders = topojson.mesh(usStates, usStates.objects.states, (a, b) => a !== b);

                svg.append('g')
                    .attr('class', 'states-layer')
                    .selectAll('path')
                    .data(states.features)
                    .enter()
                    .append('path')
                    .attr('d', path)
                    .attr('fill', '#0a2018')
                    .attr('stroke', 'none');

                svg.append('path')
                    .datum(stateBorders)
                    .attr('class', 'state-borders')
                    .attr('d', path)
                    .attr('fill', 'none')
                    .attr('stroke', '#1a6050')
                    .attr('stroke-width', 0.75)
                    .attr('stroke-linejoin', 'round');

                const nationBorder = topojson.mesh(usStates, usStates.objects.nation);
                svg.append('path')
                    .datum(nationBorder)
                    .attr('class', 'nation-border')
                    .attr('d', path)
                    .attr('fill', 'none')
                    .attr('stroke', '#2a8070')
                    .attr('stroke-width', 1.5);
            }
        }

        // Regional view country highlighting
        if (isMidEastView) {
            const MIDEAST_COUNTRIES = ['SAU', 'ARE', 'QAT', 'KWT', 'BHR', 'OMN', 'IRN', 'IRQ', 'SYR', 'LBN', 'JOR', 'ISR', 'PSE', 'YEM', 'EGY', 'TUR', 'CYP', 'AFG', 'PAK'];
            svg.append('g')
                .attr('class', 'mideast-layer')
                .selectAll('path')
                .data(countries.features)
                .enter()
                .append('path')
                .attr('d', path)
                .attr('fill', d => {
                    const isoCode = d.properties.iso_a3 || d.id;
                    return MIDEAST_COUNTRIES.includes(isoCode) ? '#0f3028' : '#050f0c';
                })
                .attr('stroke', d => {
                    const isoCode = d.properties.iso_a3 || d.id;
                    return MIDEAST_COUNTRIES.includes(isoCode) ? '#2a8070' : '#0a2018';
                })
                .attr('stroke-width', d => {
                    const isoCode = d.properties.iso_a3 || d.id;
                    return MIDEAST_COUNTRIES.includes(isoCode) ? 1.0 : 0.3;
                });
        }

        if (isUkraineView) {
            const UKRAINE_THEATER = ['UKR', 'RUS', 'BLR', 'POL', 'ROU', 'MDA', 'HUN', 'SVK', 'LTU', 'LVA', 'EST', 'FIN'];
            const PRIMARY_COUNTRIES = ['UKR', 'RUS', 'BLR'];
            svg.append('g')
                .attr('class', 'ukraine-layer')
                .selectAll('path')
                .data(countries.features)
                .enter()
                .append('path')
                .attr('d', path)
                .attr('fill', d => {
                    const isoCode = d.properties.iso_a3 || d.id;
                    if (isoCode === 'UKR') return '#1a4030';
                    if (isoCode === 'RUS') return '#301818';
                    if (isoCode === 'BLR') return '#282818';
                    if (UKRAINE_THEATER.includes(isoCode)) return '#0f2820';
                    return '#050f0c';
                })
                .attr('stroke', d => {
                    const isoCode = d.properties.iso_a3 || d.id;
                    if (isoCode === 'UKR') return '#3a9070';
                    if (isoCode === 'RUS') return '#803030';
                    if (PRIMARY_COUNTRIES.includes(isoCode)) return '#806040';
                    if (UKRAINE_THEATER.includes(isoCode)) return '#2a6050';
                    return '#0a2018';
                })
                .attr('stroke-width', d => {
                    const isoCode = d.properties.iso_a3 || d.id;
                    if (PRIMARY_COUNTRIES.includes(isoCode)) return 1.5;
                    if (UKRAINE_THEATER.includes(isoCode)) return 1.0;
                    return 0.3;
                });
        }

        if (isTaiwanView) {
            const TAIWAN_THEATER = ['CHN', 'TWN', 'PHL', 'JPN', 'VNM', 'MYS', 'KOR', 'IDN', 'BRN'];
            const PRIMARY_COUNTRIES = ['CHN', 'TWN', 'PHL'];
            svg.append('g')
                .attr('class', 'taiwan-layer')
                .selectAll('path')
                .data(countries.features)
                .enter()
                .append('path')
                .attr('d', path)
                .attr('fill', d => {
                    const isoCode = d.properties.iso_a3 || d.id;
                    if (isoCode === 'CHN') return '#301818';
                    if (isoCode === 'TWN') return '#1a3040';
                    if (isoCode === 'PHL') return '#1a4030';
                    if (isoCode === 'JPN') return '#202840';
                    if (TAIWAN_THEATER.includes(isoCode)) return '#0f2820';
                    return '#050f0c';
                })
                .attr('stroke', d => {
                    const isoCode = d.properties.iso_a3 || d.id;
                    if (isoCode === 'CHN') return '#803030';
                    if (isoCode === 'TWN') return '#3080a0';
                    if (isoCode === 'PHL') return '#3a9070';
                    if (PRIMARY_COUNTRIES.includes(isoCode)) return '#806040';
                    if (TAIWAN_THEATER.includes(isoCode)) return '#2a6050';
                    return '#0a2018';
                })
                .attr('stroke-width', d => {
                    const isoCode = d.properties.iso_a3 || d.id;
                    if (PRIMARY_COUNTRIES.includes(isoCode)) return 1.5;
                    if (TAIWAN_THEATER.includes(isoCode)) return 1.0;
                    return 0.3;
                });
        }

        // Add undersea cables (global view only)
        if (mapLayers.cables && !isRegionalView) {
            const cableGroup = svg.append('g').attr('class', 'cables-layer');
            UNDERSEA_CABLES.forEach(cable => {
                const lineGenerator = d3.line()
                    .x(d => { const p = projection(d); return p ? p[0] : 0; })
                    .y(d => { const p = projection(d); return p ? p[1] : 0; })
                    .curve(d3.curveBasis);

                const points = cable.points.map(p => [p[0], p[1]]);
                cableGroup.append('path')
                    .attr('d', lineGenerator(points))
                    .attr('class', `cable-path ${cable.major ? 'major' : ''}`)
                    .append('title')
                    .text(cable.name);
            });
        }

        // Add conflict zone boundaries (global view only)
        if (mapLayers.conflicts && !isRegionalView) {
            const conflictGroup = svg.append('g').attr('class', 'conflicts-layer');
            CONFLICT_ZONES.forEach(zone => {
                const points = zone.coords.map(c => projection([c[0], c[1]]));
                if (points.some(p => !p)) return;
                if (points.length > 0) {
                    const pathData = 'M' + points.map(p => p.join(',')).join('L') + 'Z';
                    const isHigh = zone.intensity === 'high';

                    conflictGroup.append('path')
                        .attr('d', pathData)
                        .attr('class', 'conflict-zone-glow');

                    conflictGroup.append('path')
                        .attr('d', pathData)
                        .attr('class', `conflict-zone-fill ${isHigh ? 'high-intensity' : ''}`);

                    conflictGroup.append('path')
                        .attr('d', pathData)
                        .attr('class', `conflict-zone-path ${isHigh ? 'high-intensity' : ''}`);
                }
            });
        }
    }

    // Helper to convert lon/lat to percentage
    const toPercent = (lon, lat) => {
        const projected = projection([lon, lat]);
        if (!projected) return null;
        return {
            x: (projected[0] / width) * 100,
            y: (projected[1] / height) * 100
        };
    };

    // Build overlay HTML
    let overlaysHTML = '';

    // Coordinate labels (global view only)
    if (!isRegionalView) {
        [-60, -30, 0, 30, 60].forEach(lat => {
            const pos = toPercent(-175, lat);
            if (!pos) return;
            const label = lat === 0 ? '0°' : (lat > 0 ? `${lat}°N` : `${Math.abs(lat)}°S`);
            overlaysHTML += `<div class="coord-label lat" style="top: ${pos.y}%; left: 0.5%;">${label}</div>`;
        });
        [-120, -60, 0, 60, 120].forEach(lon => {
            const pos = toPercent(lon, -85);
            if (!pos) return;
            const label = lon === 0 ? '0°' : (lon > 0 ? `${lon}°E` : `${Math.abs(lon)}°W`);
            overlaysHTML += `<div class="coord-label lon" style="left: ${pos.x}%; bottom: 1%;">${label}</div>`;
        });
    }

    // News density heatmap blobs (global view only)
    if (mapLayers.density && !isRegionalView) {
        const densityScores = calculateNewsDensity(allNews);
        NEWS_REGIONS.forEach(region => {
            const score = densityScores[region.id] || 0;
            if (score > 0) {
                const pos = toPercent(region.lon, region.lat);
                if (!pos) return;
                let level = 'low';
                let size = region.radius;
                if (score >= 10) { level = 'high'; size = region.radius * 1.5; }
                else if (score >= 5) { level = 'medium'; size = region.radius * 1.2; }
                overlaysHTML += `<div class="density-blob ${level}" style="left: ${pos.x}%; top: ${pos.y}%; width: ${size}px; height: ${size}px; transform: translate(-50%, -50%);"></div>`;
            }
        });
    }

    // Conflict zone labels (global view only)
    if (mapLayers.conflicts && !isRegionalView) {
        CONFLICT_ZONES.forEach(zone => {
            const pos = toPercent(zone.labelPos.lon, zone.labelPos.lat);
            if (!pos) return;
            const intensityClass = zone.intensity === 'high' ? 'high-intensity' : '';
            const zoneData = encodeURIComponent(JSON.stringify(zone));
            overlaysHTML += `<div class="conflict-zone-label ${intensityClass}" style="left: ${pos.x}%; top: ${pos.y}%;" data-conflict-id="${zone.id}" data-conflict-info="${zoneData}" onclick="showConflictPopup(event, '${zone.id}')">${zone.name}</div>`;
        });
    }

    // Military base markers (global view only)
    if (mapLayers.bases && !isRegionalView) {
        MILITARY_BASES.forEach(base => {
            const pos = toPercent(base.lon, base.lat);
            if (!pos) return;
            overlaysHTML += `<div class="military-base ${base.type}" style="left: ${pos.x}%; top: ${pos.y}%;" title="${base.name}"><div class="base-icon ${base.type}"></div><div class="base-label ${base.type}">${base.name}</div></div>`;
        });
    }

    // Nuclear facility markers (global view only)
    if (mapLayers.nuclear && !isRegionalView) {
        NUCLEAR_FACILITIES.forEach(facility => {
            const pos = toPercent(facility.lon, facility.lat);
            if (!pos) return;
            const isWeapons = facility.type === 'weapons' || facility.type === 'enrichment';
            overlaysHTML += `<div class="nuclear-facility" style="left: ${pos.x}%; top: ${pos.y}%;" title="${facility.name} (${facility.type})"><div class="nuclear-icon ${isWeapons ? 'weapons' : ''}"></div><div class="nuclear-label">${facility.name}</div></div>`;
        });
    }

    // Cyber threat zones (global view only)
    if (!isRegionalView) {
        CYBER_REGIONS.forEach(cz => {
            const pos = toPercent(cz.lon, cz.lat);
            if (!pos) return;
            const isActive = Math.random() > 0.6;
            const czData = encodeURIComponent(JSON.stringify({ ...cz, isActive }));
            overlaysHTML += `<div class="cyber-zone ${isActive ? 'active' : ''}" style="left: ${pos.x}%; top: ${pos.y}%;" data-cyber-id="${cz.id}" data-cyber-info="${czData}" onclick="showCyberPopup(event, '${cz.id}')"><div class="cyber-icon"></div><div class="cyber-label">${cz.group}</div></div>`;
        });
    }

    // Shipping chokepoints (global view only)
    if (!isRegionalView) {
        SHIPPING_CHOKEPOINTS.forEach(cp => {
            const pos = toPercent(cp.lon, cp.lat);
            if (!pos) return;
            const matchedHeadlines = allNews.filter(item => {
                const title = (item.title || '').toLowerCase();
                return cp.keywords.some(kw => title.includes(kw));
            }).slice(0, 5).map(item => ({ title: item.title, link: item.link, source: item.source }));
            const isAlert = matchedHeadlines.length > 0;
            const cpData = encodeURIComponent(JSON.stringify({ ...cp, isAlert, headlines: matchedHeadlines }));
            overlaysHTML += `<div class="chokepoint ${isAlert ? 'alert' : ''}" style="left: ${pos.x}%; top: ${pos.y}%;" data-chokepoint-id="${cp.id}" data-chokepoint-info="${cpData}" onclick="showChokepointPopup(event, '${cp.id}')"><div class="chokepoint-icon"></div><div class="chokepoint-label">${cp.name}</div></div>`;
        });
    }

    // Earthquake markers
    earthquakes.slice(0, 10).forEach((eq, index) => {
        if (!eq || eq.mag === undefined || eq.mag === null) return;
        const pos = toPercent(eq.lon, eq.lat);
        if (!pos) return;
        const isMajor = eq.mag >= 6.0;
        const mag = typeof eq.mag === 'number' ? eq.mag : parseFloat(eq.mag) || 0;
        const eqData = encodeURIComponent(JSON.stringify({ mag: mag, place: eq.place, time: eq.time, lat: eq.lat, lon: eq.lon, depth: eq.depth, id: eq.id || `eq_${index}` }));
        overlaysHTML += `<div class="quake ${isMajor ? 'major' : ''}" style="left: ${pos.x}%; top: ${pos.y}%;" data-quake-id="eq_${index}" data-quake-info="${eqData}" onclick="showQuakePopup(event, 'eq_${index}')"><div class="quake-icon"></div><div class="quake-label">M${mag.toFixed(1)}</div></div>`;
    });

    // Intel hotspots (global view only)
    if (!isRegionalView) {
        INTEL_HOTSPOTS.forEach(spot => {
            const activity = activityData[spot.id] || { level: 'low', score: 0, headlines: [] };
            const pos = toPercent(spot.lon, spot.lat);
            if (!pos) return;
            const activityJson = encodeURIComponent(JSON.stringify({
                ...activity, name: spot.name, subtext: spot.subtext, lat: spot.lat, lon: spot.lon,
                description: spot.description || '', agencies: spot.agencies || [], status: spot.status || ''
            }));

            if (activity.level === 'high' && activity.headlines.length > 0) {
                overlaysHTML += `<div class="news-pulse" style="left: ${pos.x}%; top: ${pos.y}%;"><div class="news-pulse-ring"></div><div class="news-pulse-ring"></div><div class="news-pulse-ring"></div><div class="news-pulse-label">Breaking</div></div>`;
            }

            overlaysHTML += `<div class="hotspot ${activity.level}" style="left: ${pos.x}%; top: ${pos.y}%;" data-hotspot-id="${spot.id}" data-hotspot-activity="${activityJson}" onclick="showHotspotPopup(event, '${spot.id}')"><div class="hotspot-dot"></div><div class="hotspot-label">${spot.name}<div class="hotspot-info">${spot.subtext}</div></div></div>`;
        });
    }

    // Custom monitor hotspots
    if (getMonitorHotspots) {
        const customHotspots = getMonitorHotspots(allNews);
        customHotspots.forEach(monitor => {
            const pos = toPercent(monitor.lon, monitor.lat);
            if (!pos) return;
            const matchData = encodeURIComponent(JSON.stringify({
                id: monitor.id, name: monitor.name, color: monitor.color, keywords: monitor.keywords,
                lat: monitor.lat, lon: monitor.lon, matchCount: monitor.matchCount, matches: monitor.matches.slice(0, 5)
            }));
            overlaysHTML += `<div class="custom-hotspot" style="left: ${pos.x}%; top: ${pos.y}%; color: ${monitor.color};" data-monitor-id="${monitor.id}" data-monitor-info="${matchData}" onclick="showCustomHotspotPopup(event, '${monitor.id}')"><div class="custom-hotspot-dot" style="background: ${monitor.color}; border-color: ${monitor.color};"></div><div class="custom-hotspot-label" style="color: ${monitor.color};">${monitor.name}<span class="custom-hotspot-count">${monitor.matchCount > 0 ? ` (${monitor.matchCount})` : ''}</span></div></div>`;
        });
    }

    // Add popup containers
    overlaysHTML += `<div class="hotspot-popup" id="hotspotPopup"></div>`;
    overlaysHTML += `<div class="chokepoint-popup" id="chokepointPopup"></div>`;
    overlaysHTML += `<div class="quake-popup" id="quakePopup"></div>`;
    overlaysHTML += `<div class="cyber-popup" id="cyberPopup"></div>`;
    overlaysHTML += `<div class="custom-hotspot-popup" id="customHotspotPopup"></div>`;

    // Regional view specific overlays
    if (isUSView) {
        overlaysHTML += renderUSViewOverlays(projection, width, height, allNews);
        overlaysHTML += `<div class="us-hotspot-popup" id="usHotspotPopup"></div>`;
    }

    if (isMidEastView) {
        overlaysHTML += renderMidEastViewOverlays(projection, width, height, allNews);
        overlaysHTML += `<div class="us-hotspot-popup" id="usHotspotPopup"></div>`;
    }

    if (isUkraineView) {
        overlaysHTML += renderUkraineViewOverlays(projection, width, height, allNews);
        overlaysHTML += `<div class="us-hotspot-popup" id="usHotspotPopup"></div>`;
    }

    if (isTaiwanView) {
        overlaysHTML += renderTaiwanViewOverlays(projection, width, height, allNews);
        overlaysHTML += `<div class="us-hotspot-popup" id="usHotspotPopup"></div>`;
    }

    // Layer toggle buttons (global view only)
    if (!isRegionalView) {
        overlaysHTML += `
            <div class="map-layer-toggle">
                <button class="layer-btn ${mapLayers.conflicts ? 'active' : ''}" onclick="toggleLayer('conflicts')">Conflicts</button>
                <button class="layer-btn ${mapLayers.bases ? 'active' : ''}" onclick="toggleLayer('bases')">Bases</button>
                <button class="layer-btn ${mapLayers.nuclear ? 'active' : ''}" onclick="toggleLayer('nuclear')">Nuclear</button>
                <button class="layer-btn ${mapLayers.cables ? 'active' : ''}" onclick="toggleLayer('cables')">Cables</button>
                <button class="layer-btn ${mapLayers.sanctions ? 'active' : ''}" onclick="toggleLayer('sanctions')">Sanctions</button>
                <button class="layer-btn ${mapLayers.density ? 'active' : ''}" onclick="toggleLayer('density')">Density</button>
                <button class="layer-btn ${mapLayers.flights ? 'active' : ''}" onclick="toggleLayer('flights')">Flights</button>
                <button class="layer-btn satellite-btn ${mapLayers.satellite ? 'active' : ''}" onclick="toggleSatelliteLayer()">Satellite</button>
            </div>
        `;
    }

    // Flight radar overlay
    if (mapLayers.flights && fetchFlightData) {
        try {
            const flights = await fetchFlightData();
            const flightCount = flights.length;

            flights.slice(0, 200).forEach(flight => {
                const projected = projection([flight.lon, flight.lat]);
                if (!projected) return;
                const posX = (projected[0] / width) * 100;
                const posY = (projected[1] / height) * 100;
                if (posX < 0 || posX > 100 || posY < 0 || posY > 100) return;

                const aircraftType = classifyAircraft(flight.callsign, flight.country);
                const arrow = getAircraftArrow(flight.heading);
                const flightData = encodeURIComponent(JSON.stringify(flight));

                overlaysHTML += `<div class="aircraft-marker ${aircraftType}" style="left: ${posX}%; top: ${posY}%; transform: translate(-50%, -50%) rotate(${flight.heading || 0}deg);" onclick="showAircraftPopup(event, '${flightData}')" title="${flight.callsign || flight.icao24}"><div class="aircraft-icon" style="transform: rotate(-${flight.heading || 0}deg);">${arrow}</div></div>`;
            });

            overlaysHTML += `<div class="flight-count-badge" style="position: absolute; bottom: 30px; right: 10px;">✈ ${flightCount} flights</div>`;
        } catch (e) {
            console.error('Flight rendering failed:', e);
        }
    }

    // Aircraft popup container
    overlaysHTML += `<div class="aircraft-popup" id="aircraftPopup"></div>`;

    // Flashback slider
    overlaysHTML += `
        <div class="flashback-mode-indicator" id="flashbackIndicator">Viewing Historical Data</div>
        <div class="flashback-control">
            <span class="flashback-label">Time</span>
            <input type="range" class="flashback-slider" id="flashbackSlider" min="0" max="24" value="0" step="1" onchange="updateFlashback(this.value)">
            <span class="flashback-time" id="flashbackTime">LIVE</span>
        </div>
    `;

    // Debug logging
    console.log('Map render debug:', {
        isRegionalView,
        mapViewMode,
        width,
        height,
        hotspotCount: INTEL_HOTSPOTS.length,
        conflictCount: CONFLICT_ZONES.length,
        chokepointCount: SHIPPING_CHOKEPOINTS.length,
        overlaysHTMLLength: overlaysHTML.length,
        mapOverlaysElement: document.getElementById('mapOverlays')
    });

    const mapOverlaysEl = document.getElementById('mapOverlays');
    if (mapOverlaysEl) {
        mapOverlaysEl.innerHTML = overlaysHTML;
        console.log('Overlays inserted, child count:', mapOverlaysEl.children.length);
    } else {
        console.error('mapOverlays element not found!');
    }

    // Initialize map pan functionality
    initMapPan();

    // Close popups when clicking outside
    document.getElementById('worldMapContainer').addEventListener('click', (e) => {
        if (!e.target.closest('.hotspot') && !e.target.closest('.hotspot-popup')) hideHotspotPopup();
        if (!e.target.closest('.chokepoint') && !e.target.closest('.chokepoint-popup')) hideChokepointPopup();
        if (!e.target.closest('.quake') && !e.target.closest('.quake-popup')) hideQuakePopup();
        if (!e.target.closest('.cyber-zone') && !e.target.closest('.cyber-popup')) hideCyberPopup();
        if (!e.target.closest('.custom-hotspot') && !e.target.closest('.custom-hotspot-popup')) hideCustomHotspotPopup();
        if (!e.target.closest('.conflict-zone-label') && !e.target.closest('.conflict-popup')) hideConflictPopup();
        if (!e.target.closest('.us-city') && !e.target.closest('.us-city-popup')) hideUSCityPopup();
        if (!e.target.closest('.us-hotspot') && !e.target.closest('.us-hotspot-popup')) hideUSHotspotPopup();
        if (!e.target.closest('.aircraft-marker') && !e.target.closest('.aircraft-popup')) hideAircraftPopup();
    });
}

// Helper functions for regional views
function renderUSViewOverlays(projection, width, height, allNews) {
    let html = '';

    US_CITIES.forEach(city => {
        const projected = projection([city.lon, city.lat]);
        if (!projected) return;
        const posX = (projected[0] / width) * 100;
        const posY = (projected[1] / height) * 100;

        let matchCount = 0;
        if (allNews && allNews.length > 0) {
            const matches = allNews.filter(item => {
                const title = (item.title || '').toLowerCase();
                return city.keywords.some(kw => title.includes(kw.toLowerCase()));
            });
            matchCount = matches.length;
        }

        const cityData = encodeURIComponent(JSON.stringify({
            ...city, matchCount,
            headlines: allNews ? allNews.filter(item => {
                const title = (item.title || '').toLowerCase();
                return city.keywords.some(kw => title.includes(kw.toLowerCase()));
            }).slice(0, 8) : []
        }));

        const typeClass = city.type === 'capital' ? 'capital' : city.type === 'major' ? 'major' : '';
        const activityLevel = matchCount >= 5 ? 'high-activity' : '';

        html += `<div class="us-city ${typeClass} ${activityLevel}" style="left: ${posX}%; top: ${posY}%; color: ${city.type === 'capital' ? '#ffcc00' : city.type === 'major' ? '#00ff88' : '#00aaff'};" data-city-id="${city.id}" data-city-info="${cityData}" onclick="showUSCityPopup(event, '${city.id}')"><div class="us-city-dot"></div><div class="us-city-label">${city.name}${matchCount > 0 ? `<span class="us-city-count">(${matchCount})</span>` : ''}</div></div>`;
    });

    US_HOTSPOTS.forEach(hotspot => {
        const projected = projection([hotspot.lon, hotspot.lat]);
        if (!projected) return;
        const posX = (projected[0] / width) * 100;
        const posY = (projected[1] / height) * 100;

        let matchCount = 0;
        let matchedHeadlines = [];
        if (allNews && allNews.length > 0) {
            matchedHeadlines = allNews.filter(item => {
                const title = (item.title || '').toLowerCase();
                return hotspot.keywords.some(kw => title.includes(kw.toLowerCase()));
            });
            matchCount = matchedHeadlines.length;
        }

        const hotspotData = encodeURIComponent(JSON.stringify({ ...hotspot, matchCount, headlines: matchedHeadlines.slice(0, 8) }));

        html += `<div class="us-hotspot ${hotspot.level}" style="left: ${posX}%; top: ${posY}%;" data-us-hotspot-id="${hotspot.id}" data-us-hotspot-info="${hotspotData}" onclick="showUSHotspotPopup(event, '${hotspot.id}')"><div class="us-hotspot-glow"></div><div class="us-hotspot-ring"></div><div class="us-hotspot-marker">${hotspot.icon}</div><div class="us-hotspot-label">${hotspot.name}<div class="us-hotspot-category">${hotspot.category}</div></div></div>`;
    });

    return html;
}

function renderMidEastViewOverlays(projection, width, height, allNews) {
    let html = '';
    const MIDEAST_CITIES = [
        { id: 'riyadh', name: 'Riyadh', lat: 24.7136, lon: 46.6753, type: 'capital', keywords: ['riyadh', 'saudi'] },
        { id: 'tehran', name: 'Tehran', lat: 35.6892, lon: 51.3890, type: 'capital', keywords: ['tehran', 'iran'] },
        { id: 'cairo', name: 'Cairo', lat: 30.0444, lon: 31.2357, type: 'capital', keywords: ['cairo', 'egypt'] },
        { id: 'ankara', name: 'Ankara', lat: 39.9334, lon: 32.8597, type: 'capital', keywords: ['ankara', 'turkey'] },
        { id: 'baghdad', name: 'Baghdad', lat: 33.3152, lon: 44.3661, type: 'capital', keywords: ['baghdad', 'iraq'] },
        { id: 'damascus', name: 'Damascus', lat: 33.5138, lon: 36.2765, type: 'capital', keywords: ['damascus', 'syria'] },
        { id: 'jerusalem', name: 'Jerusalem', lat: 31.7683, lon: 35.2137, type: 'capital', keywords: ['jerusalem'] },
        { id: 'tel-aviv', name: 'Tel Aviv', lat: 32.0853, lon: 34.7818, type: 'major', keywords: ['tel aviv', 'israel'] },
        { id: 'dubai', name: 'Dubai', lat: 25.2048, lon: 55.2708, type: 'major', keywords: ['dubai', 'uae'] },
        { id: 'doha', name: 'Doha', lat: 25.2854, lon: 51.5310, type: 'capital', keywords: ['doha', 'qatar'] },
        { id: 'sanaa', name: "Sana'a", lat: 15.3694, lon: 44.1910, type: 'capital', keywords: ['sanaa', 'yemen'] }
    ];

    MIDEAST_CITIES.forEach(city => {
        const projected = projection([city.lon, city.lat]);
        if (!projected) return;
        const posX = (projected[0] / width) * 100;
        const posY = (projected[1] / height) * 100;

        let matchCount = 0;
        if (allNews && allNews.length > 0) {
            matchCount = allNews.filter(item => {
                const title = (item.title || '').toLowerCase();
                return city.keywords.some(kw => title.includes(kw.toLowerCase()));
            }).length;
        }

        const typeClass = city.type === 'capital' ? 'capital' : city.type === 'major' ? 'major' : '';
        const activityLevel = matchCount >= 5 ? 'high-activity' : '';

        html += `<div class="us-city ${typeClass} ${activityLevel}" style="left: ${posX}%; top: ${posY}%; color: ${city.type === 'capital' ? '#ffcc00' : '#00ff88'};"><div class="us-city-dot"></div><div class="us-city-label">${city.name}${matchCount > 0 ? `<span class="us-city-count">(${matchCount})</span>` : ''}</div></div>`;
    });

    MIDEAST_HOTSPOTS.forEach(hotspot => {
        const projected = projection([hotspot.lon, hotspot.lat]);
        if (!projected) return;
        const posX = (projected[0] / width) * 100;
        const posY = (projected[1] / height) * 100;

        let matchCount = 0;
        let matchedHeadlines = [];
        if (allNews && allNews.length > 0) {
            matchedHeadlines = allNews.filter(item => {
                const title = (item.title || '').toLowerCase();
                return hotspot.keywords.some(kw => title.includes(kw.toLowerCase()));
            });
            matchCount = matchedHeadlines.length;
        }

        const hotspotData = encodeURIComponent(JSON.stringify({ ...hotspot, matchCount, headlines: matchedHeadlines.slice(0, 8) }));

        html += `<div class="us-hotspot ${hotspot.level}" style="left: ${posX}%; top: ${posY}%;" data-us-hotspot-id="${hotspot.id}" data-us-hotspot-info="${hotspotData}" onclick="showUSHotspotPopup(event, '${hotspot.id}')"><div class="us-hotspot-glow"></div><div class="us-hotspot-ring"></div><div class="us-hotspot-marker">${hotspot.icon}</div><div class="us-hotspot-label">${hotspot.name}<div class="us-hotspot-category">${hotspot.category}</div></div></div>`;
    });

    return html;
}

function renderUkraineViewOverlays(projection, width, height, allNews) {
    let html = '';
    const UKRAINE_CITIES = [
        { id: 'kyiv', name: 'Kyiv', lat: 50.4501, lon: 30.5234, type: 'capital', keywords: ['kyiv', 'kiev'] },
        { id: 'kharkiv', name: 'Kharkiv', lat: 49.9935, lon: 36.2304, type: 'major', keywords: ['kharkiv', 'kharkov'] },
        { id: 'odesa', name: 'Odesa', lat: 46.4825, lon: 30.7233, type: 'major', keywords: ['odesa', 'odessa'] },
        { id: 'donetsk', name: 'Donetsk', lat: 48.0159, lon: 37.8029, type: 'major', keywords: ['donetsk', 'donbas'] },
        { id: 'moscow', name: 'Moscow', lat: 55.7558, lon: 37.6173, type: 'capital', keywords: ['moscow', 'kremlin', 'putin'] },
        { id: 'minsk', name: 'Minsk', lat: 53.9045, lon: 27.5615, type: 'capital', keywords: ['minsk', 'belarus'] },
        { id: 'sevastopol', name: 'Sevastopol', lat: 44.6167, lon: 33.5254, type: 'major', keywords: ['sevastopol', 'crimea'] }
    ];

    UKRAINE_CITIES.forEach(city => {
        const projected = projection([city.lon, city.lat]);
        if (!projected) return;
        const posX = (projected[0] / width) * 100;
        const posY = (projected[1] / height) * 100;

        let matchCount = 0;
        if (allNews && allNews.length > 0) {
            matchCount = allNews.filter(item => {
                const title = (item.title || '').toLowerCase();
                return city.keywords.some(kw => title.includes(kw.toLowerCase()));
            }).length;
        }

        const typeClass = city.type === 'capital' ? 'capital' : 'major';
        const activityLevel = matchCount >= 5 ? 'high-activity' : '';
        let cityColor = '#00ff88';
        if (['moscow'].includes(city.id)) cityColor = '#ff6666';
        else if (['minsk'].includes(city.id)) cityColor = '#ffaa44';
        else if (['kyiv', 'kharkiv', 'odesa', 'donetsk', 'sevastopol'].includes(city.id)) cityColor = '#44aaff';

        html += `<div class="us-city ${typeClass} ${activityLevel}" style="left: ${posX}%; top: ${posY}%; color: ${city.type === 'capital' ? '#ffcc00' : cityColor};"><div class="us-city-dot"></div><div class="us-city-label">${city.name}${matchCount > 0 ? `<span class="us-city-count">(${matchCount})</span>` : ''}</div></div>`;
    });

    UKRAINE_HOTSPOTS.forEach(hotspot => {
        const projected = projection([hotspot.lon, hotspot.lat]);
        if (!projected) return;
        const posX = (projected[0] / width) * 100;
        const posY = (projected[1] / height) * 100;

        let matchCount = 0;
        let matchedHeadlines = [];
        if (allNews && allNews.length > 0) {
            matchedHeadlines = allNews.filter(item => {
                const title = (item.title || '').toLowerCase();
                return hotspot.keywords.some(kw => title.includes(kw.toLowerCase()));
            });
            matchCount = matchedHeadlines.length;
        }

        const hotspotData = encodeURIComponent(JSON.stringify({ ...hotspot, matchCount, headlines: matchedHeadlines.slice(0, 8) }));

        html += `<div class="us-hotspot ${hotspot.level}" style="left: ${posX}%; top: ${posY}%;" data-us-hotspot-id="${hotspot.id}" data-us-hotspot-info="${hotspotData}" onclick="showUSHotspotPopup(event, '${hotspot.id}')"><div class="us-hotspot-glow"></div><div class="us-hotspot-ring"></div><div class="us-hotspot-marker">${hotspot.icon}</div><div class="us-hotspot-label">${hotspot.name}<div class="us-hotspot-category">${hotspot.category}</div></div></div>`;
    });

    return html;
}

function renderTaiwanViewOverlays(projection, width, height, allNews) {
    let html = '';
    const TAIWAN_CITIES = [
        { id: 'taipei', name: 'Taipei', lat: 25.0330, lon: 121.5654, type: 'capital', keywords: ['taipei', 'taiwan'] },
        { id: 'beijing', name: 'Beijing', lat: 39.9042, lon: 116.4074, type: 'capital', keywords: ['beijing', 'china', 'xi jinping'] },
        { id: 'shanghai', name: 'Shanghai', lat: 31.2304, lon: 121.4737, type: 'major', keywords: ['shanghai'] },
        { id: 'manila', name: 'Manila', lat: 14.5995, lon: 120.9842, type: 'capital', keywords: ['manila', 'philippines'] },
        { id: 'tokyo', name: 'Tokyo', lat: 35.6762, lon: 139.6503, type: 'capital', keywords: ['tokyo', 'japan'] },
        { id: 'okinawa', name: 'Okinawa', lat: 26.5013, lon: 127.9454, type: 'major', keywords: ['okinawa', 'kadena'] }
    ];

    TAIWAN_CITIES.forEach(city => {
        const projected = projection([city.lon, city.lat]);
        if (!projected) return;
        const posX = (projected[0] / width) * 100;
        const posY = (projected[1] / height) * 100;
        if (posX < 0 || posX > 100 || posY < 0 || posY > 100) return;

        let matchCount = 0;
        if (allNews && allNews.length > 0) {
            matchCount = allNews.filter(item => {
                const title = (item.title || '').toLowerCase();
                return city.keywords.some(kw => title.includes(kw.toLowerCase()));
            }).length;
        }

        const typeClass = city.type === 'capital' ? 'capital' : 'major';
        const activityLevel = matchCount >= 5 ? 'high-activity' : '';
        let cityColor = '#00ff88';
        if (['beijing', 'shanghai'].includes(city.id)) cityColor = '#ff6666';
        else if (['taipei'].includes(city.id)) cityColor = '#44aaff';
        else if (['tokyo', 'okinawa'].includes(city.id)) cityColor = '#6688ff';

        html += `<div class="us-city ${typeClass} ${activityLevel}" style="left: ${posX}%; top: ${posY}%; color: ${city.type === 'capital' ? '#ffcc00' : cityColor};"><div class="us-city-dot"></div><div class="us-city-label">${city.name}${matchCount > 0 ? `<span class="us-city-count">(${matchCount})</span>` : ''}</div></div>`;
    });

    TAIWAN_HOTSPOTS.forEach(hotspot => {
        const projected = projection([hotspot.lon, hotspot.lat]);
        if (!projected) return;
        const posX = (projected[0] / width) * 100;
        const posY = (projected[1] / height) * 100;
        if (posX < 0 || posX > 100 || posY < 0 || posY > 100) return;

        let matchCount = 0;
        let matchedHeadlines = [];
        if (allNews && allNews.length > 0) {
            matchedHeadlines = allNews.filter(item => {
                const title = (item.title || '').toLowerCase();
                return hotspot.keywords.some(kw => title.includes(kw.toLowerCase()));
            });
            matchCount = matchedHeadlines.length;
        }

        const hotspotData = encodeURIComponent(JSON.stringify({ ...hotspot, matchCount, headlines: matchedHeadlines.slice(0, 8) }));

        html += `<div class="us-hotspot ${hotspot.level}" style="left: ${posX}%; top: ${posY}%;" data-us-hotspot-id="${hotspot.id}" data-us-hotspot-info="${hotspotData}" onclick="showUSHotspotPopup(event, '${hotspot.id}')"><div class="us-hotspot-glow"></div><div class="us-hotspot-ring"></div><div class="us-hotspot-marker">${hotspot.icon}</div><div class="us-hotspot-label">${hotspot.name}<div class="us-hotspot-category">${hotspot.category}</div></div></div>`;
    });

    return html;
}
