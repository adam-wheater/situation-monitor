// Globe.gl 3D globe rendering

let globeInstance = null;
let globeCountriesData = null;
let globeCablesData = null;
let mapViewMode = 'global';

// Map layer visibility state
let mapLayers = {
    conflicts: true,
    bases: true,
    nuclear: true,
    cables: true,
    sanctions: true,
    density: true
};

function toggleLayer(layerName) {
    mapLayers[layerName] = !mapLayers[layerName];

    // Update button state
    const btn = document.querySelector(`.layer-btn[onclick="toggleLayer('${layerName}')"]`);
    if (btn) btn.classList.toggle('active', mapLayers[layerName]);

    // Re-render map with updated layers
    if (window.cachedAllNews) {
        renderGlobalMap({}, [], window.cachedAllNews);
    }
}

async function renderGlobalMap(activityData, earthquakes = [], allNews = []) {
    window.cachedAllNews = allNews;

    const panel = document.getElementById('mapPanel');
    const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19) + ' UTC';

    const isUSView = mapViewMode === 'us';
    const mapTitle = isUSView ? 'US DOMESTIC MONITOR' : 'GLOBAL ACTIVITY MONITOR';
    const mapLegend = isUSView ? '★ CAPITAL | ● MAJOR | ○ REGIONAL' : '⚓ SHIP | ☢ NUKES | ▪ BASES | ═ CABLES';

    panel.innerHTML = `
        <div class="world-map" id="worldMapContainer">
            <div id="globeContainer"></div>
            <div class="map-layer-toggle" id="mapLayerToggle"></div>
            <div class="map-view-toggle">
                <button class="map-view-btn ${!isUSView ? 'active' : ''}" onclick="setMapView('global')">GLOBAL</button>
                <button class="map-view-btn ${isUSView ? 'active' : ''}" onclick="setMapView('us')">US</button>
            </div>
            <div class="map-zoom-controls">
                <button class="map-zoom-btn" onclick="mapZoomIn()" title="Zoom In">+</button>
                <div class="map-zoom-level" id="mapZoomLevel">2.0x</div>
                <button class="map-zoom-btn" onclick="mapZoomOut()" title="Zoom Out">−</button>
                <button class="map-zoom-btn map-zoom-reset" onclick="mapZoomReset()" title="Reset">RST</button>
            </div>
            <div class="conflict-popup" id="conflictPopup"></div>
            <div class="us-city-popup" id="usCityPopup"></div>
            <div class="hotspot-popup" id="hotspotPopup"></div>
            <div class="chokepoint-popup" id="chokepointPopup"></div>
            <div class="quake-popup" id="quakePopup"></div>
            <div class="cyber-popup" id="cyberPopup"></div>
            <div class="custom-hotspot-popup" id="customHotspotPopup"></div>
            <div class="us-hotspot-popup" id="usHotspotPopup"></div>
            <div class="chokepoint-popup" id="cablePopup"></div>
            <div class="map-corner-label tl">${mapTitle}</div>
            <div class="map-corner-label tr">CLASSIFICATION: OPEN SOURCE</div>
            <div class="map-corner-label bl">${mapLegend}</div>
            <div class="map-corner-label br">${timestamp}</div>
        </div>
    `;

    const container = document.getElementById('worldMapContainer');
    const globeContainer = document.getElementById('globeContainer');
    const baseWidth = container.offsetWidth || 800;
    const height = container.offsetHeight || 550;

    // Initialize Globe.gl
    if (!globeInstance) {
        globeInstance = Globe()
            .width(baseWidth)
            .height(height)
            .backgroundColor('#020a08')
            .showAtmosphere(true)
            .atmosphereColor('#0a4030')
            .atmosphereAltitude(0.12)
            .showGraticules(true);
    }

    globeInstance(globeContainer);
    globeInstance.width(baseWidth).height(height);

    // Load world map data
    if (!globeCountriesData) {
        const world = await loadWorldMap();
        if (world) {
            globeCountriesData = topojson.feature(world, world.objects.countries).features;
        }
    }

    // Load cable data
    if (!globeCablesData) {
        const cableGeo = await loadCableGeoData();
        if (cableGeo && cableGeo.type === 'FeatureCollection') {
            globeCablesData = cableGeo.features;
        }
    }

    // Configure countries layer
    if (globeCountriesData) {
        globeInstance
            .globeImageUrl(null)
            .polygonsData(globeCountriesData)
            .polygonCapColor(d => {
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
            .polygonSideColor(() => '#0a2018')
            .polygonStrokeColor(() => '#0f5040')
            .polygonAltitude(0.006)
            .polygonsTransitionDuration(300);
    } else {
        globeInstance
            .globeImageUrl('//unpkg.com/three-globe/example/img/earth-dark.jpg')
            .polygonsData([]);
    }

    // Configure cables layer
    if (mapLayers.cables && globeCablesData) {
        const cablePaths = [];
        globeCablesData.forEach(feature => {
            if (!feature || !feature.geometry) return;
            const props = feature.properties;

            const lineArrays = feature.geometry.type === 'LineString'
                ? [feature.geometry.coordinates]
                : (feature.geometry.type === 'MultiLineString'
                    ? feature.geometry.coordinates
                    : []);

            lineArrays.forEach(lineCoords => {
                if (!Array.isArray(lineCoords) || lineCoords.length < 2) return;
                const coords = lineCoords.map(p => [
                    parseFloat(p[0]),
                    parseFloat(p[1])
                ]).filter(p => !isNaN(p[0]) && !isNaN(p[1]));

                if (coords.length >= 2) {
                    cablePaths.push({
                        coords: coords,
                        properties: props
                    });
                }
            });
        });

        globeInstance
            .pathsData(mapLayers.cables ? cablePaths : [])
            .pathPoints(d => d.coords)
            .pathPointLat(p => p[1])
            .pathPointLng(p => p[0])
            .pathColor(() => '#9966ff')
            .pathStroke(3)
            .pathDashLength(0.01)
            .pathDashGap(0.004)
            .pathDashAnimateTime(100000)
            .pathTransitionDuration(300)
            .onPathClick((path, event) => {
                showCablePopup(event, {
                    key: `id:${path.properties?.id || ''}`,
                    name: path.properties?.name || 'Undersea Cable',
                    id: path.properties?.id || ''
                });
            });
    } else {
        globeInstance.pathsData([]);
    }

    // Build marker data
    const pointMarkers = buildPointMarkers(earthquakes);
    const htmlMarkers = buildHtmlMarkers(activityData, allNews);

    // Configure points layer
    globeInstance
        .pointsData(pointMarkers)
        .pointLat(d => d.lat)
        .pointLng(d => d.lng)
        .pointColor(d => d.color)
        .pointAltitude(0.01)
        .pointRadius(d => d.size)
        .pointsMerge(false)
        .onPointClick((point, event) => {
            if (point.type === 'earthquake') {
                showQuakePopupDirect(event, point.data);
            } else if (point.type === 'base') {
                showBasePopupDirect(event, point.data);
            } else if (point.type === 'nuclear') {
                showNuclearPopupDirect(event, point.data);
            }
        });

    // Configure HTML elements layer
    globeInstance
        .htmlElementsData(htmlMarkers)
        .htmlLat(d => d.lat)
        .htmlLng(d => d.lng)
        .htmlAltitude(0.02)
        .htmlElement(d => createHtmlMarkerElement(d));

    // Set initial view
    if (isUSView) {
        globeInstance.pointOfView({ lat: 39.0, lng: -98.0, altitude: 0.8 }, 1000);
    } else {
        globeInstance.pointOfView({ lat: 20, lng: 0, altitude: 2.0 }, 1000);
    }

    // Update zoom display
    const zoomLevelEl = document.getElementById('mapZoomLevel');
    if (zoomLevelEl) {
        const updateZoomDisplay = () => {
            const pov = globeInstance.pointOfView();
            const zoomLevel = (2.5 / pov.altitude).toFixed(1);
            zoomLevelEl.textContent = `${zoomLevel}x`;
        };
        updateZoomDisplay();
        globeInstance.onZoom(updateZoomDisplay);
    }

    // Configure layer toggle
    const layerToggleEl = document.getElementById('mapLayerToggle');
    if (layerToggleEl) {
        layerToggleEl.innerHTML = `
            <button class="layer-btn ${mapLayers.conflicts ? 'active' : ''}" onclick="toggleLayer('conflicts')">Conflicts</button>
            <button class="layer-btn ${mapLayers.bases ? 'active' : ''}" onclick="toggleLayer('bases')">Bases</button>
            <button class="layer-btn ${mapLayers.nuclear ? 'active' : ''}" onclick="toggleLayer('nuclear')">Nuclear</button>
            <button class="layer-btn ${mapLayers.cables ? 'active' : ''}" onclick="toggleLayer('cables')">Cables</button>
            <button class="layer-btn ${mapLayers.sanctions ? 'active' : ''}" onclick="toggleLayer('sanctions')">Sanctions</button>
            <button class="layer-btn ${mapLayers.density ? 'active' : ''}" onclick="toggleLayer('density')">Density</button>
        `;
    }

    // Close popups on globe background click
    globeInstance.onGlobeClick(() => {
        hideAllPopups();
    });
}

function buildPointMarkers(earthquakes) {
    const pointMarkers = [];

    // Military bases
    if (mapLayers.bases) {
        MILITARY_BASES.forEach(base => {
            pointMarkers.push({
                lat: base.lat,
                lng: base.lon,
                size: 0.3,
                color: base.type === 'us-nato' ? '#ff00ff' :
                       base.type === 'china' ? '#ff6600' : '#ff3333',
                type: 'base',
                data: base
            });
        });
    }

    // Nuclear facilities
    if (mapLayers.nuclear) {
        NUCLEAR_FACILITIES.forEach(facility => {
            const isWeapons = facility.type === 'weapons' || facility.type === 'enrichment';
            pointMarkers.push({
                lat: facility.lat,
                lng: facility.lon,
                size: 0.4,
                color: isWeapons ? '#ffaa00' : '#ffff00',
                type: 'nuclear',
                data: facility
            });
        });
    }

    // Earthquakes
    earthquakes.slice(0, 15).forEach((eq, index) => {
        const isMajor = eq.mag >= 6.0;
        pointMarkers.push({
            lat: eq.lat,
            lng: eq.lon,
            size: 0.2 + eq.mag / 15,
            color: isMajor ? '#ff4444' : '#ff8800',
            type: 'earthquake',
            data: { ...eq, id: eq.id || `eq_${index}` }
        });
    });

    return pointMarkers;
}

function buildHtmlMarkers(activityData, allNews) {
    const htmlMarkers = [];

    // Intel hotspots
    INTEL_HOTSPOTS.forEach(spot => {
        const activity = activityData[spot.id] || { level: 'low', score: 0, headlines: [] };
        htmlMarkers.push({
            lat: spot.lat,
            lng: spot.lon,
            type: 'hotspot',
            data: { ...spot, activity }
        });
    });

    // Shipping chokepoints
    SHIPPING_CHOKEPOINTS.forEach(cp => {
        const matchedHeadlines = allNews.filter(item => {
            const title = (item.title || '').toLowerCase();
            return cp.keywords.some(kw => title.includes(kw));
        }).slice(0, 5);
        htmlMarkers.push({
            lat: cp.lat,
            lng: cp.lon,
            type: 'chokepoint',
            data: { ...cp, isAlert: matchedHeadlines.length > 0, headlines: matchedHeadlines }
        });
    });

    // Conflict zones
    if (mapLayers.conflicts) {
        CONFLICT_ZONES.forEach(zone => {
            htmlMarkers.push({
                lat: zone.labelPos.lat,
                lng: zone.labelPos.lon,
                type: 'conflict',
                data: zone
            });
        });
    }

    // Cyber regions
    CYBER_REGIONS.forEach(cz => {
        const isActive = Math.random() > 0.6;
        htmlMarkers.push({
            lat: cz.lat,
            lng: cz.lon,
            type: 'cyber',
            data: { ...cz, isActive }
        });
    });

    // Custom monitor hotspots
    const customHotspots = getMonitorHotspots(allNews);
    customHotspots.forEach(monitor => {
        htmlMarkers.push({
            lat: monitor.lat,
            lng: monitor.lon,
            type: 'custom',
            data: monitor
        });
    });

    return htmlMarkers;
}

function createHtmlMarkerElement(d) {
    const el = document.createElement('div');
    el.className = 'globe-marker';

    if (d.type === 'hotspot') {
        const activity = d.data.activity;
        const popupData = {
            ...activity,
            name: d.data.name,
            subtext: d.data.subtext,
            lat: d.data.lat,
            lon: d.data.lon,
            description: d.data.description || '',
            agencies: d.data.agencies || [],
            status: d.data.status || ''
        };
        el.innerHTML = `
            <div class="hotspot ${activity.level}">
                <div class="hotspot-dot"></div>
                <div class="hotspot-label">
                    ${d.data.name}
                    <div class="hotspot-info">${d.data.subtext}</div>
                </div>
            </div>
        `;
        el.querySelector('.hotspot').onclick = (e) => {
            e.stopPropagation();
            showHotspotPopupDirect(e, popupData);
        };
    } else if (d.type === 'chokepoint') {
        el.innerHTML = `
            <div class="chokepoint ${d.data.isAlert ? 'alert' : ''}">
                <div class="chokepoint-icon"></div>
                <div class="chokepoint-label">${d.data.name}</div>
            </div>
        `;
        el.querySelector('.chokepoint').onclick = (e) => {
            e.stopPropagation();
            showChokepointPopupDirect(e, d.data);
        };
    } else if (d.type === 'conflict') {
        const intensityClass = d.data.intensity === 'high' ? 'high-intensity' : '';
        el.innerHTML = `
            <div class="conflict-zone-label ${intensityClass}">
                ${d.data.name}
            </div>
        `;
        el.querySelector('.conflict-zone-label').onclick = (e) => {
            e.stopPropagation();
            showConflictPopupDirect(e, d.data);
        };
    } else if (d.type === 'cyber') {
        el.innerHTML = `
            <div class="cyber-zone ${d.data.isActive ? 'active' : ''}">
                <div class="cyber-icon"></div>
                <div class="cyber-label">${d.data.group}</div>
            </div>
        `;
        el.querySelector('.cyber-zone').onclick = (e) => {
            e.stopPropagation();
            showCyberPopupDirect(e, d.data);
        };
    } else if (d.type === 'custom') {
        const popupData = {
            id: d.data.id,
            name: d.data.name,
            color: d.data.color,
            keywords: d.data.keywords,
            lat: d.data.lat,
            lon: d.data.lon,
            matchCount: d.data.matchCount,
            matches: d.data.matches.slice(0, 5)
        };
        el.innerHTML = `
            <div class="custom-hotspot" style="color: ${d.data.color};">
                <div class="custom-hotspot-dot" style="background: ${d.data.color}; border-color: ${d.data.color};"></div>
                <div class="custom-hotspot-label" style="color: ${d.data.color};">
                    ${d.data.name}
                    <span class="custom-hotspot-count">${d.data.matchCount > 0 ? ` (${d.data.matchCount})` : ''}</span>
                </div>
            </div>
        `;
        el.querySelector('.custom-hotspot').onclick = (e) => {
            e.stopPropagation();
            showCustomHotspotPopupDirect(e, popupData);
        };
    }

    return el;
}

function setMapView(mode) {
    if (mapViewMode === mode) return;
    mapViewMode = mode;

    if (globeInstance) {
        if (mode === 'us') {
            globeInstance.pointOfView({ lat: 39.0, lng: -98.0, altitude: 0.8 }, 1000);
        } else {
            globeInstance.pointOfView({ lat: 20, lng: 0, altitude: 2.0 }, 1000);
        }

        document.querySelectorAll('.map-view-btn').forEach(btn => {
            btn.classList.toggle('active', btn.textContent.trim().toLowerCase() === mode);
        });

        const titleEl = document.querySelector('.map-corner-label.tl');
        if (titleEl) {
            titleEl.textContent = mode === 'us' ? 'US DOMESTIC MONITOR' : 'GLOBAL ACTIVITY MONITOR';
        }
    }
}
