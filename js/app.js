// Main application entry point
// All modules are loaded via script tags in index.html
// Panel configuration with display names
// Load panel visibility from localStorage
function getPanelSettings() {
    try {
        const saved = localStorage.getItem('situationMonitorPanels');
        return saved ? JSON.parse(saved) : {};
    } catch (e) {
        return {};
    }
}

// Save panel visibility to localStorage
function savePanelSettings(settings) {
    try {
        localStorage.setItem('situationMonitorPanels', JSON.stringify(settings));
    } catch (e) { }
}

// Check if panel is enabled
function isPanelEnabled(panelId) {
    const settings = getPanelSettings();
    return settings[panelId] !== false; // Default to enabled
}

// Toggle panel visibility
function togglePanel(panelId) {
    const settings = getPanelSettings();
    settings[panelId] = !isPanelEnabled(panelId);
    savePanelSettings(settings);
    applyPanelSettings();
    updateSettingsUI();
}

// Apply panel settings to DOM
function applyPanelSettings() {
    document.querySelectorAll('[data-panel]').forEach(panel => {
        const panelId = panel.dataset.panel;
        if (isPanelEnabled(panelId)) {
            panel.classList.remove('hidden');
        } else {
            panel.classList.add('hidden');
        }
    });
}

// Toggle settings modal
function toggleSettings() {
    const modal = document.getElementById('settingsModal');
    modal.classList.toggle('open');
    if (modal.classList.contains('open')) {
        updateSettingsUI();
        renderMonitorsList();
        // Load saved livestream URL
        const savedUrl = localStorage.getItem('livestreamUrl') || 'https://www.youtube.com/watch?v=jWEZa9WEnIo';
        document.getElementById('livestreamUrl').value = savedUrl;
    }
}

// Update settings UI
function updateSettingsUI() {
    const container = document.getElementById('panelToggles');
    container.innerHTML = Object.entries(PANELS).map(([id, config]) => {
        const enabled = isPanelEnabled(id);
        return `
                    <div class="panel-toggle-item">
                        <label onclick="togglePanel('${id}')">${config.name}</label>
                        <div class="toggle-switch ${enabled ? 'on' : ''}" onclick="togglePanel('${id}')"></div>
                    </div>
                `;
    }).join('');
}

// Extract YouTube video ID from various URL formats
function extractYouTubeId(url) {
    if (!url) return null;
    // Handle various YouTube URL formats
    const patterns = [
        /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/live\/)([^&\?\/]+)/,
        /^([a-zA-Z0-9_-]{11})$/ // Direct video ID
    ];
    for (const pattern of patterns) {
        const match = url.match(pattern);
        if (match) return match[1];
    }
    return null;
}

// Save livestream URL
function saveLivestreamUrl() {
    const input = document.getElementById('livestreamUrl');
    const url = input.value.trim();
    localStorage.setItem('livestreamUrl', url);
    updateLivestreamEmbed();
}

// Update the livestream embed
function updateLivestreamEmbed() {
    const url = localStorage.getItem('livestreamUrl') || 'https://www.youtube.com/watch?v=jWEZa9WEnIo';
    const videoId = extractYouTubeId(url);
    const panel = document.getElementById('tbpnPanel');
    if (panel && videoId) {
        panel.innerHTML = `
                    <iframe
                        src="https://www.youtube.com/embed/${videoId}?autoplay=0&mute=1"
                        frameborder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowfullscreen>
                    </iframe>
                `;
    } else if (panel) {
        panel.innerHTML = '<div class="loading-msg">Invalid YouTube URL</div>';
    }
}

// Drag and Drop Panel Reordering
let draggedPanel = null;
const NON_DRAGGABLE_PANELS = ['map', 'tbpn']; // Map stays at top, livestream has iframe

function initDragAndDrop() {
    const dashboard = document.querySelector('.dashboard');
    const panels = dashboard.querySelectorAll('.panel');

    panels.forEach(panel => {
        const panelId = panel.dataset.panel;
        const isDraggable = !NON_DRAGGABLE_PANELS.includes(panelId);

        // Make panels draggable (except map and livestream)
        panel.setAttribute('draggable', isDraggable ? 'true' : 'false');

        if (!isDraggable) {
            panel.style.cursor = 'default';
            panel.querySelector('.panel-header').style.cursor = 'default';
            return; // Skip drag event listeners for non-draggable panels
        }

        panel.addEventListener('dragstart', (e) => {
            // Don't start a panel drag from interactive controls (inputs/buttons/config dropdowns).
            // This keeps focus + paste working inside header config UIs.
            if (e.target && e.target.closest && e.target.closest('input, textarea, select, button, a, details, summary, .panel-config, .panel-config-body')) {
                e.preventDefault();
                return;
            }
            draggedPanel = panel;
            panel.classList.add('dragging');
            e.dataTransfer.effectAllowed = 'move';
            e.dataTransfer.setData('text/plain', panel.dataset.panel);
        });

        panel.addEventListener('dragend', () => {
            panel.classList.remove('dragging');
            document.querySelectorAll('.panel.drag-over').forEach(p => p.classList.remove('drag-over'));
            draggedPanel = null;
            savePanelOrder();
        });

        panel.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'move';
            if (draggedPanel && draggedPanel !== panel) {
                panel.classList.add('drag-over');
            }
        });

        panel.addEventListener('dragleave', () => {
            panel.classList.remove('drag-over');
        });

        panel.addEventListener('drop', (e) => {
            e.preventDefault();
            panel.classList.remove('drag-over');

            if (draggedPanel && draggedPanel !== panel) {
                const dashboard = document.querySelector('.dashboard');
                const panels = [...dashboard.querySelectorAll('.panel')];
                const draggedIdx = panels.indexOf(draggedPanel);
                const targetIdx = panels.indexOf(panel);

                if (draggedIdx < targetIdx) {
                    panel.parentNode.insertBefore(draggedPanel, panel.nextSibling);
                } else {
                    panel.parentNode.insertBefore(draggedPanel, panel);
                }
            }
        });
    });
}

// Save panel order to localStorage
function savePanelOrder() {
    const dashboard = document.querySelector('.dashboard');
    const panels = dashboard.querySelectorAll('.panel');
    const order = [...panels].map(p => p.dataset.panel);
    localStorage.setItem('panelOrder', JSON.stringify(order));
}

// Restore panel order from localStorage
function restorePanelOrder() {
    const savedOrder = localStorage.getItem('panelOrder');
    if (!savedOrder) return;

    try {
        const order = JSON.parse(savedOrder);
        const dashboard = document.querySelector('.dashboard');
        const panels = [...dashboard.querySelectorAll('.panel')];

        // Only restore order for draggable panels
        order.forEach(panelId => {
            if (NON_DRAGGABLE_PANELS.includes(panelId)) return;
            const panel = panels.find(p => p.dataset.panel === panelId);
            if (panel) {
                dashboard.appendChild(panel);
            }
        });
    } catch (e) {
        console.error('Error restoring panel order:', e);
    }
}

// Reset panel order
function resetPanelOrder() {
    localStorage.removeItem('panelOrder');
    location.reload();
}

// ========== MAP ZOOM FUNCTIONALITY ==========
let mapZoom = 1;
let mapPan = { x: 0, y: 0 };
let isPanning = false;
let panStart = { x: 0, y: 0 };
let panPointerId = null;
let panMoved = false;
let panStartClient = { x: 0, y: 0 };
const PAN_DRAG_THRESHOLD_PX = 4;
let mapTransformRaf = 0;
const MAP_ZOOM_MIN = 1;
const MAP_ZOOM_MAX = 4;
const MAP_ZOOM_STEP = 0.5;

// Cached land/ocean routing grid for cable pathfinding (global view)
let cachedWorldTopoForRouting = null;
let cachedLandFeatureForRouting = null;
let cachedOceanGridByStepDeg = new Map();
let cachedCableRoutesByKey = new Map();

function normaliseLon180(lon) {
    // Normalize to [-180, 180)
    return ((((lon + 180) % 360) + 360) % 360) - 180;
}

function getLandFeatureForRouting(worldTopo) {
    if (!worldTopo) return null;
    if (cachedWorldTopoForRouting === worldTopo && cachedLandFeatureForRouting) return cachedLandFeatureForRouting;

    cachedWorldTopoForRouting = worldTopo;
    cachedOceanGridByStepDeg = new Map();
    cachedCableRoutesByKey = new Map();
    cachedLandFeatureForRouting = null;

    try {
        // Merge all countries into a single land geometry for fast geoContains.
        const landGeom = topojson.merge(worldTopo, worldTopo.objects.countries.geometries);
        cachedLandFeatureForRouting = { type: 'Feature', properties: {}, geometry: landGeom };
    } catch (e) {
        try {
            const countries = topojson.feature(worldTopo, worldTopo.objects.countries);
            cachedLandFeatureForRouting = { type: 'FeatureCollection', features: countries.features };
        } catch {
            cachedLandFeatureForRouting = null;
        }
    }

    return cachedLandFeatureForRouting;
}

function getOceanGridForRouting(worldTopo, stepDeg = 2, latMin = -80, latMax = 80, samplesPerCell = 3) {
    const key = `${stepDeg}:${latMin}:${latMax}:${samplesPerCell}`;
    if (cachedWorldTopoForRouting === worldTopo && cachedOceanGridByStepDeg.has(key)) {
        return cachedOceanGridByStepDeg.get(key);
    }

    const landFeature = getLandFeatureForRouting(worldTopo);
    if (!landFeature || !window.d3 || typeof d3.geoContains !== 'function') return null;

    const nx = Math.round(360 / stepDeg);
    const ny = Math.round((latMax - latMin) / stepDeg);
    const ocean = new Uint8Array(nx * ny);

    const eps = stepDeg * 1e-3;
    const clampLon = (lon) => {
        // keep within [-180, 180)
        return normaliseLon180(lon);
    };
    const clampLat = (lat) => Math.max(latMin, Math.min(latMax - 1e-6, lat));

    const cellHasLand = (x, y) => {
        const lon0 = -180 + x * stepDeg;
        const lat0 = latMin + y * stepDeg;

        const n = Math.max(1, samplesPerCell);
        for (let sy = 0; sy < n; sy++) {
            for (let sx = 0; sx < n; sx++) {
                const fx = (sx + 0.5) / n;
                const fy = (sy + 0.5) / n;
                const lon = clampLon(lon0 + fx * stepDeg);
                const lat = clampLat(lat0 + fy * stepDeg);
                if (d3.geoContains(landFeature, [lon, lat])) return true;
            }
        }

        // also sample corners (helps thin islands/coastlines)
        const corners = [
            [lon0 + eps, lat0 + eps],
            [lon0 + stepDeg - eps, lat0 + eps],
            [lon0 + eps, lat0 + stepDeg - eps],
            [lon0 + stepDeg - eps, lat0 + stepDeg - eps]
        ];
        for (const [lon, lat] of corners) {
            if (d3.geoContains(landFeature, [clampLon(lon), clampLat(lat)])) return true;
        }

        return false;
    };

    for (let y = 0; y < ny; y++) {
        for (let x = 0; x < nx; x++) {
            // ocean = 1 if the *cell* is fully ocean-like; be conservative near coastlines.
            ocean[y * nx + x] = cellHasLand(x, y) ? 0 : 1;
        }
    }

    const grid = { stepDeg, latMin, latMax, nx, ny, ocean };
    cachedOceanGridByStepDeg.set(key, grid);
    return grid;
}

class MinHeap {
    constructor() {
        this._a = [];
    }
    push(item) {
        const a = this._a;
        a.push(item);
        let i = a.length - 1;
        while (i > 0) {
            const p = (i - 1) >> 1;
            if (a[p].f <= a[i].f) break;
            [a[p], a[i]] = [a[i], a[p]];
            i = p;
        }
    }
    pop() {
        const a = this._a;
        if (!a.length) return null;
        const top = a[0];
        const last = a.pop();
        if (a.length) {
            a[0] = last;
            let i = 0;
            while (true) {
                const l = i * 2 + 1;
                const r = l + 1;
                let m = i;
                if (l < a.length && a[l].f < a[m].f) m = l;
                if (r < a.length && a[r].f < a[m].f) m = r;
                if (m === i) break;
                [a[m], a[i]] = [a[i], a[m]];
                i = m;
            }
        }
        return top;
    }
    get size() {
        return this._a.length;
    }
}

function routeOceanPathAStar(startLonLat, endLonLat, grid) {
    if (!grid) return null;
    const { nx, ny, stepDeg, latMin, latMax, ocean } = grid;

    const toIdx = ([lonIn, latIn]) => {
        const lon = normaliseLon180(lonIn);
        const lat = Math.max(latMin, Math.min(latMax - 1e-6, latIn));
        let x = Math.floor((lon + 180) / stepDeg);
        let y = Math.floor((lat - latMin) / stepDeg);
        x = ((x % nx) + nx) % nx;
        y = Math.max(0, Math.min(ny - 1, y));
        return { x, y, id: y * nx + x };
    };

    const toLonLatCenter = (x, y) => {
        const lon = -180 + (x + 0.5) * stepDeg;
        const lat = latMin + (y + 0.5) * stepDeg;
        return [lon, lat];
    };

    const nearestOcean = (node) => {
        if (ocean[node.id]) return node;
        const maxR = 12;
        for (let r = 1; r <= maxR; r++) {
            for (let dy = -r; dy <= r; dy++) {
                for (let dx = -r; dx <= r; dx++) {
                    if (Math.abs(dx) !== r && Math.abs(dy) !== r) continue;
                    const x = ((node.x + dx) % nx + nx) % nx;
                    const y = Math.max(0, Math.min(ny - 1, node.y + dy));
                    const id = y * nx + x;
                    if (ocean[id]) return { x, y, id };
                }
            }
        }
        return node;
    };

    let start = nearestOcean(toIdx(startLonLat));
    let goal = nearestOcean(toIdx(endLonLat));
    if (!ocean[start.id] || !ocean[goal.id]) return null;

    const cameFrom = new Int32Array(nx * ny);
    cameFrom.fill(-1);
    const gScore = new Float32Array(nx * ny);
    gScore.fill(Number.POSITIVE_INFINITY);
    const closed = new Uint8Array(nx * ny);

    const heuristic = (x, y) => {
        const dxRaw = Math.abs(x - goal.x);
        const dx = Math.min(dxRaw, nx - dxRaw);
        const dy = Math.abs(y - goal.y);
        return Math.hypot(dx, dy);
    };

    const open = new MinHeap();
    gScore[start.id] = 0;
    open.push({ id: start.id, x: start.x, y: start.y, f: heuristic(start.x, start.y) });

    const neighbors = [
        [-1, 0, 1], [1, 0, 1], [0, -1, 1], [0, 1, 1],
        [-1, -1, Math.SQRT2], [1, -1, Math.SQRT2], [-1, 1, Math.SQRT2], [1, 1, Math.SQRT2]
    ];

    let iterations = 0;
    const maxIterations = nx * ny * 4;

    while (open.size && iterations++ < maxIterations) {
        const cur = open.pop();
        if (!cur) break;
        if (closed[cur.id]) continue;
        closed[cur.id] = 1;

        if (cur.id === goal.id) {
            // reconstruct
            const path = [];
            let id = goal.id;
            while (id !== -1) {
                const y = Math.floor(id / nx);
                const x = id - y * nx;
                path.push([x, y]);
                id = cameFrom[id];
            }
            path.reverse();

            const coords = path.map(([x, y]) => toLonLatCenter(x, y));
            // Preserve exact endpoints.
            coords[0] = [normaliseLon180(startLonLat[0]), startLonLat[1]];
            coords[coords.length - 1] = [normaliseLon180(endLonLat[0]), endLonLat[1]];
            return coords;
        }

        for (const [dx, dy, stepCost] of neighbors) {
            const nxp = ((cur.x + dx) % nx + nx) % nx;
            const nyp = Math.max(0, Math.min(ny - 1, cur.y + dy));
            const nid = nyp * nx + nxp;
            if (closed[nid]) continue;
            if (!ocean[nid]) continue;

            const tentative = gScore[cur.id] + stepCost;
            if (tentative < gScore[nid]) {
                cameFrom[nid] = cur.id;
                gScore[nid] = tentative;
                open.push({ id: nid, x: nxp, y: nyp, f: tentative + heuristic(nxp, nyp) });
            }
        }
    }

    return null;
}

function scheduleApplyMapTransform() {
    if (mapTransformRaf) return;
    mapTransformRaf = requestAnimationFrame(() => {
        mapTransformRaf = 0;
        applyMapTransform();
    });
}

function mapZoomIn() {
    if (globeInstance) {
        const pov = globeInstance.pointOfView();
        const newAlt = Math.max(0.3, pov.altitude * 0.7);
        globeInstance.pointOfView({ ...pov, altitude: newAlt }, 300);
    } else {
        if (mapZoom < MAP_ZOOM_MAX) {
            mapZoom = Math.min(MAP_ZOOM_MAX, mapZoom + MAP_ZOOM_STEP);
            applyMapTransform();
        }
    }
}

function mapZoomOut() {
    if (globeInstance) {
        const pov = globeInstance.pointOfView();
        const newAlt = Math.min(3.0, pov.altitude * 1.4);
        globeInstance.pointOfView({ ...pov, altitude: newAlt }, 300);
    } else {
        if (mapZoom > MAP_ZOOM_MIN) {
            mapZoom = Math.max(MAP_ZOOM_MIN, mapZoom - MAP_ZOOM_STEP);
            if (mapZoom === 1) {
                mapPan = { x: 0, y: 0 };
            }
            applyMapTransform();
        }
    }
}

function mapZoomReset() {
    if (globeInstance) {
        const isUSView = mapViewMode === 'us';
        if (isUSView) {
            globeInstance.pointOfView({ lat: 39.0, lng: -98.0, altitude: 0.8 }, 500);
        } else {
            globeInstance.pointOfView({ lat: 20, lng: 0, altitude: 2.0 }, 500);
        }
    } else {
        mapZoom = 1;
        mapPan = { x: 0, y: 0 };
        applyMapTransform();
    }
}

// Switch between global and US map views
function setMapView(mode) {
    if (mapViewMode === mode) return;
    mapViewMode = mode;
    mapZoom = 1;
    mapPan = { x: 0, y: 0 };

    // For Globe.gl, just change the view without full re-render
    if (globeInstance) {
        if (mode === 'us') {
            globeInstance.pointOfView({ lat: 39.0, lng: -98.0, altitude: 0.8 }, 1000);
        } else {
            globeInstance.pointOfView({ lat: 20, lng: 0, altitude: 2.0 }, 1000);
        }
        // Update button states
        document.querySelectorAll('.map-view-btn').forEach(btn => {
            btn.classList.toggle('active', btn.textContent.trim().toLowerCase() === mode);
        });
        // Update title
        const titleEl = document.querySelector('.map-corner-label.tl');
        if (titleEl) {
            titleEl.textContent = mode === 'us' ? 'US DOMESTIC MONITOR' : 'GLOBAL ACTIVITY MONITOR';
        }
    } else {
        // Legacy SVG mode - re-render
        if (window.cachedAllNews) {
            renderGlobalMap({}, [], window.cachedAllNews);
        }
    }
}

function applyMapTransform() {
    const wrapper = document.getElementById('mapZoomWrapper');
    const levelDisplay = document.getElementById('mapZoomLevel');
    const panHint = document.getElementById('mapPanHint');

    if (wrapper) {
        wrapper.style.transform = `translate(${mapPan.x}px, ${mapPan.y}px) scale(${mapZoom})`;

        // Counter-scale markers inside the zoomed wrapper so they get SMALLER as you zoom in.
        // (Wrapper scales everything up by mapZoom; marker scale exponent > 1 makes net size shrink.)
        const z = Math.max(1, mapZoom || 1);
        const markerScale = 1 / Math.pow(z, 2.0); // net ~ 1/z
        wrapper.style.setProperty('--sm-marker-scale', markerScale.toFixed(6));
        wrapper.style.setProperty('--sm-marker-scale-hover', (markerScale * 1.3).toFixed(6));
        wrapper.style.setProperty('--sm-marker-scale-hover-soft', (markerScale * 1.15).toFixed(6));
        wrapper.style.setProperty('--sm-marker-scale-pulse', (markerScale * 1.1).toFixed(6));
    }
    if (levelDisplay) {
        levelDisplay.textContent = `${mapZoom.toFixed(1)}x`;
    }
    if (panHint) {
        // Global view supports panning even at 1x due to wrap.
        panHint.classList.toggle('show', mapViewMode !== 'us' || mapZoom > 1);
    }
}

function normaliseWrappedPanX(containerWidth) {
    if (!containerWidth) return;
    // Keep pan.x in a stable range so dragging never hits a hard edge.
    // Use modulo to handle large deltas (fast trackpad/mouse swipes).
    const half = containerWidth / 2;
    const wrapped = ((((mapPan.x + half) % containerWidth) + containerWidth) % containerWidth) - half;
    const delta = wrapped - mapPan.x;
    if (delta !== 0) {
        mapPan.x = wrapped;
        // Preserve relationship: mapPan.x === e.clientX - panStart.x
        panStart.x -= delta;
    }
}

// Map panning with click-and-drag (pointer events)
function initMapPan() {
    const container = document.getElementById('worldMapContainer');
    if (!container) return;

    const wrapper = document.getElementById('mapZoomWrapper');

    const interactiveSelector = [
        '.map-zoom-controls',
        '.map-view-toggle',
        '.map-layer-toggle',
        '.flashback-control',
        '.hotspot',
        '.us-hotspot',
        '.custom-hotspot',
        '.conflict-zone',
        '.conflict-popup',
        '.hotspot-popup',
        '.chokepoint-popup',
        '.quake-popup',
        '.cyber-popup',
        '.custom-hotspot-popup',
        '.us-hotspot-popup',
        '.us-city-popup',
        '.chokepoint',
        '.quake',
        '.cyber-zone',
        '.cable-path'
    ].join(',');

    container.addEventListener('pointerdown', (e) => {
        if (e.button !== 0) return;
        if (e.target.closest(interactiveSelector)) return;

        // In US view, only allow panning when zoomed.
        if (mapViewMode === 'us' && mapZoom <= 1) return;

        isPanning = true;
        panPointerId = e.pointerId;
        panMoved = false;
        panStartClient = { x: e.clientX, y: e.clientY };
        panStart = { x: e.clientX - mapPan.x, y: e.clientY - mapPan.y };

        try { container.setPointerCapture(panPointerId); } catch { }
        container.style.cursor = 'grabbing';
        if (wrapper) {
            // Avoid expensive transitions during drag.
            wrapper.style.transition = 'none';
            wrapper.style.willChange = 'transform';
        }
        e.preventDefault();
    });

    container.addEventListener('pointermove', (e) => {
        if (!isPanning) return;
        if (panPointerId !== null && e.pointerId !== panPointerId) return;

        const dx = e.clientX - panStartClient.x;
        const dy = e.clientY - panStartClient.y;
        if (!panMoved && (Math.abs(dx) > PAN_DRAG_THRESHOLD_PX || Math.abs(dy) > PAN_DRAG_THRESHOLD_PX)) {
            panMoved = true;
        }

        const containerWidth = container.clientWidth || 800;

        // Update raw pan in screen pixels.
        const rawPanX = e.clientX - panStart.x;
        const rawPanY = e.clientY - panStart.y;
        mapPan.x = rawPanX;
        mapPan.y = rawPanY;

        // Vertical panning is bounded to avoid losing the map.
        const maxPanY = Math.max(0, (mapZoom - 1) * 200);
        if (mapZoom <= 1) {
            if (mapPan.y !== 0) {
                // Keep the drag anchor stable when snapping back.
                panStart.y -= (0 - mapPan.y);
                mapPan.y = 0;
            }
        } else {
            const clampedY = Math.max(-maxPanY, Math.min(maxPanY, mapPan.y));
            if (clampedY !== mapPan.y) {
                // If we clamp, adjust anchor so releasing/returning doesn't "jump".
                panStart.y -= (clampedY - mapPan.y);
                mapPan.y = clampedY;
            }
        }

        // Global view wraps horizontally; wrap period increases with zoom.
        // (At higher zoom, one world-width spans more screen pixels.)
        if (mapViewMode !== 'us') {
            normaliseWrappedPanX(containerWidth * mapZoom);
        } else {
            const maxPanX = Math.max(0, (mapZoom - 1) * 200);
            const clampedX = Math.max(-maxPanX, Math.min(maxPanX, mapPan.x));
            if (clampedX !== mapPan.x) {
                panStart.x -= (clampedX - mapPan.x);
                mapPan.x = clampedX;
            }
        }

        scheduleApplyMapTransform();
        e.preventDefault();
    });

    const endPan = () => {
        if (!isPanning) return;
        isPanning = false;
        panPointerId = null;
        const c = document.getElementById('worldMapContainer');
        if (c) c.style.cursor = '';
        if (wrapper) {
            // Restore zoom transitions after drag.
            wrapper.style.transition = '';
            wrapper.style.willChange = '';
        }
        // Ensure final position is applied.
        applyMapTransform();
    };

    container.addEventListener('pointerup', endPan);
    container.addEventListener('pointercancel', endPan);

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

// ========== PANEL RESIZE FUNCTIONALITY ==========
let resizingPanel = null;
let resizeStart = { x: 0, y: 0, width: 0, height: 0 };
let resizeDirection = null;

function initPanelResize() {
    // Add resize handles to all panels
    document.querySelectorAll('.panel').forEach(panel => {
        // Skip if already has handles
        if (panel.querySelector('.panel-resize-handle')) return;

        // Corner handle (for both width and height)
        const cornerHandle = document.createElement('div');
        cornerHandle.className = 'panel-resize-handle corner';
        cornerHandle.addEventListener('mousedown', (e) => startResize(e, panel, 'corner'));
        panel.appendChild(cornerHandle);

        // Bottom edge handle (height only)
        const bottomHandle = document.createElement('div');
        bottomHandle.className = 'panel-resize-handle bottom';
        bottomHandle.addEventListener('mousedown', (e) => startResize(e, panel, 'bottom'));
        panel.appendChild(bottomHandle);

        // Right edge handle (width only)
        const rightHandle = document.createElement('div');
        rightHandle.className = 'panel-resize-handle right';
        rightHandle.addEventListener('mousedown', (e) => startResize(e, panel, 'right'));
        panel.appendChild(rightHandle);
    });
}

function startResize(e, panel, direction) {
    e.preventDefault();
    e.stopPropagation();

    resizingPanel = panel;
    resizeDirection = direction;
    resizeStart = {
        x: e.clientX,
        y: e.clientY,
        width: panel.offsetWidth,
        height: panel.offsetHeight
    };

    panel.classList.add('resizing');
    document.body.style.cursor = direction === 'corner' ? 'nwse-resize' :
        direction === 'bottom' ? 'ns-resize' : 'ew-resize';
}

document.addEventListener('mousemove', (e) => {
    if (!resizingPanel) return;

    const deltaX = e.clientX - resizeStart.x;
    const deltaY = e.clientY - resizeStart.y;

    if (resizeDirection === 'corner' || resizeDirection === 'right') {
        const newWidth = Math.max(200, resizeStart.width + deltaX);
        resizingPanel.style.width = newWidth + 'px';
        resizingPanel.style.minWidth = newWidth + 'px';
        resizingPanel.style.maxWidth = newWidth + 'px';
    }

    if (resizeDirection === 'corner' || resizeDirection === 'bottom') {
        const newHeight = Math.max(150, resizeStart.height + deltaY);
        resizingPanel.style.minHeight = newHeight + 'px';
        resizingPanel.style.maxHeight = newHeight + 'px';
    }
});

document.addEventListener('mouseup', () => {
    if (resizingPanel) {
        resizingPanel.classList.remove('resizing');
        // Save panel sizes to localStorage
        savePanelSizes();
        resizingPanel = null;
        resizeDirection = null;
        document.body.style.cursor = '';
    }
});

function savePanelSizes() {
    const sizes = {};
    document.querySelectorAll('.panel').forEach(panel => {
        const panelName = panel.getAttribute('data-panel');
        if (panelName && (panel.style.minHeight || panel.style.width)) {
            sizes[panelName] = {
                height: panel.style.minHeight,
                width: panel.style.width
            };
        }
    });
    localStorage.setItem('panelSizes', JSON.stringify(sizes));
}

function restorePanelSizes() {
    const saved = localStorage.getItem('panelSizes');
    if (!saved) return;

    try {
        const sizes = JSON.parse(saved);
        Object.entries(sizes).forEach(([panelName, dims]) => {
            const panel = document.querySelector(`.panel[data-panel="${panelName}"]`);
            if (panel) {
                if (dims.height) {
                    panel.style.minHeight = dims.height;
                    panel.style.maxHeight = dims.height;
                }
                if (dims.width) {
                    panel.style.width = dims.width;
                    panel.style.minWidth = dims.width;
                    panel.style.maxWidth = dims.width;
                }
            }
        });
    } catch (e) {
        console.error('Failed to restore panel sizes:', e);
    }
}

// Initialize panel settings and livestream on load
document.addEventListener('DOMContentLoaded', () => {
    applyPanelSettings();
    restorePanelOrder();
    restorePanelSizes();
    updateLivestreamEmbed();
    initDragAndDrop();
    initPanelResize();
    initPentagonTrackerUI();
});




// ========== PENTAGON TRACKER (BESTTIME) ==========
const PENTAGON_TRACKER_STORAGE_KEY = 'pentagonTrackerSettings';
const BESTTIME_PRIVATE_KEY_STORAGE_KEY = 'besttimeApiKeyPrivate';
const DEFAULT_PENTAGON_LOCATIONS = [
    { id: 'pentagon', name: 'Pentagon', lat: 38.8719, lng: -77.0563, radiusM: 30000 }
];

function getPentagonTrackerSettings() {
    try {
        const raw = localStorage.getItem(PENTAGON_TRACKER_STORAGE_KEY);
        const parsed = raw ? JSON.parse(raw) : null;
        const locations = Array.isArray(parsed?.locations) && parsed.locations.length > 0
            ? parsed.locations
            : DEFAULT_PENTAGON_LOCATIONS;

        let apiKeyPrivate = typeof parsed?.apiKeyPrivate === 'string' ? parsed.apiKeyPrivate : '';
        apiKeyPrivate = (apiKeyPrivate || '').trim();

        // Fallback: a dedicated storage key makes this resilient if the settings blob is missing/corrupt.
        if (!apiKeyPrivate) {
            try {
                const fallback = (localStorage.getItem(BESTTIME_PRIVATE_KEY_STORAGE_KEY) || '').trim();
                if (fallback) apiKeyPrivate = fallback;
            } catch { }
        }

        // If an old bad value was stored (e.g. a URL), treat it as missing (and self-heal storage).
        const lowered = apiKeyPrivate.toLowerCase();
        const looksLikeUrl = lowered.includes('://') || lowered.startsWith('http') || lowered.includes('localhost') || lowered.includes('127.0.0.1');
        if (looksLikeUrl) {
            apiKeyPrivate = '';
            try {
                savePentagonTrackerSettings({ apiKeyPrivate: '', locations });
            } catch { }
        }
        return {
            apiKeyPrivate,
            locations
        };
    } catch {
        // If the settings blob is corrupt, clear it so future saves work normally.
        try { localStorage.removeItem(PENTAGON_TRACKER_STORAGE_KEY); } catch { }
        return { apiKeyPrivate: '', locations: DEFAULT_PENTAGON_LOCATIONS };
    }
}

function savePentagonTrackerSettings(next) {
    try {
        localStorage.setItem(PENTAGON_TRACKER_STORAGE_KEY, JSON.stringify(next));
    } catch { }
}

function initPentagonTrackerUI() {
    const settings = getPentagonTrackerSettings();
    const keyInput = document.getElementById('besttimeApiKeyPrivateInput');
    if (keyInput && !keyInput.value) {
        keyInput.value = settings.apiKeyPrivate || '';
    }
    renderPentagonLocationsList();
}

function saveBestTimePrivateKey() {
    const keyInput = document.getElementById('besttimeApiKeyPrivateInput');
    if (!keyInput) return;
    const apiKeyPrivate = (keyInput.value || '').trim();

    // Basic sanity: avoid accidentally saving a URL or empty value.
    if (!apiKeyPrivate) {
        setStatus('Pentagon Tracker: missing BestTime key');
        return;
    }
    const lowered = apiKeyPrivate.toLowerCase();
    const looksLikeUrl = lowered.includes('://') || lowered.startsWith('http') || lowered.includes('localhost') || lowered.includes('127.0.0.1');
    if (looksLikeUrl) {
        setStatus('Pentagon Tracker: that does not look like an API key');
        return;
    }

    const settings = getPentagonTrackerSettings();
    savePentagonTrackerSettings({ ...settings, apiKeyPrivate });
    try { localStorage.setItem(BESTTIME_PRIVATE_KEY_STORAGE_KEY, apiKeyPrivate); } catch { }
    try { setStatus('Pentagon Tracker: key saved'); } catch { }
    renderPentagonLocationsList();
    refreshAll();
}

function addPentagonLocationFromInputs() {
    const nameEl = document.getElementById('pentagonLocName');
    const latEl = document.getElementById('pentagonLocLat');
    const lngEl = document.getElementById('pentagonLocLng');
    const radiusEl = document.getElementById('pentagonLocRadius');
    if (!nameEl || !latEl || !lngEl || !radiusEl) return;

    const name = (nameEl.value || '').trim();
    const lat = Number(latEl.value);
    const lng = Number(lngEl.value);
    const radiusM = Number(radiusEl.value);

    if (!name || !Number.isFinite(lat) || !Number.isFinite(lng) || !Number.isFinite(radiusM) || radiusM <= 0) {
        setStatus('Pentagon Tracker: invalid location input');
        return;
    }

    const settings = getPentagonTrackerSettings();
    const id = `${name.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`;
    const nextLocations = [...settings.locations, { id, name, lat, lng, radiusM }];
    savePentagonTrackerSettings({ ...settings, locations: nextLocations });

    nameEl.value = '';
    latEl.value = '';
    lngEl.value = '';
    radiusEl.value = '';

    renderPentagonLocationsList();
    refreshAll();
}

function removePentagonLocation(id) {
    const settings = getPentagonTrackerSettings();
    const nextLocations = (settings.locations || []).filter(l => l?.id !== id);
    savePentagonTrackerSettings({ ...settings, locations: nextLocations.length ? nextLocations : DEFAULT_PENTAGON_LOCATIONS });
    renderPentagonLocationsList();
    refreshAll();
}

function renderPentagonLocationsList() {
    const list = document.getElementById('pentagonLocationsList');
    if (!list) return;

    const settings = getPentagonTrackerSettings();
    const locations = settings.locations || [];

    list.innerHTML = locations.map(loc => {
        const meta = `${loc.lat.toFixed(4)}, ${loc.lng.toFixed(4)} · ${Math.round(loc.radiusM)}m`;
        return `
            <div class="panel-config-item">
                <div style="min-width: 0;">
                    <div class="panel-config-item-name">${escapeHtml(loc.name)}</div>
                    <div class="panel-config-item-meta">${escapeHtml(meta)}</div>
                </div>
                <button class="panel-config-remove" onclick="removePentagonLocation('${escapeHtmlAttr(loc.id)}')">Remove</button>
            </div>
        `;
    }).join('');
}

function escapeHtml(str) {
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

function escapeHtmlAttr(str) {
    // For embedding inside single quotes in onclick.
    return String(str).replace(/'/g, "\\'");
}

async function fetchBestTimeVenuesForLocation({ apiKeyPrivate, lat, lng, radiusM }) {
    const url = new URL('https://besttime.app/api/v1/venues/filter');
    url.searchParams.set('api_key_private', apiKeyPrivate);
    url.searchParams.set('lat', String(lat));
    url.searchParams.set('lng', String(lng));
    url.searchParams.set('radius', String(Math.round(radiusM)));

    // Keep it broad and do client-side classification.
    // (Some accounts/regions use different type labels; filtering here can easily yield 0 venues.)
    url.searchParams.set('now', 'true');
    url.searchParams.set('live', 'true');

    const data = await fetchWithProxy(url.toString(), {
        accept: 'application/json, text/plain, */*',
        responseType: 'json'
    });
    return Array.isArray(data?.venues) ? data.venues : [];
}

function getBestTimeVenueKey(v) {
    const id = v?.venue_id ?? v?.id;
    if (id !== undefined && id !== null && String(id).trim()) return `id:${String(id).trim()}`;
    const name = String(v?.venue_name ?? v?.name ?? '').trim().toLowerCase();
    const addr = String(v?.venue_address ?? v?.address ?? '').trim().toLowerCase();
    const lat = v?.venue_lat ?? v?.lat;
    const lng = v?.venue_lng ?? v?.lng;
    const coords = (Number.isFinite(lat) && Number.isFinite(lng)) ? `${lat.toFixed?.(5) ?? lat},${lng.toFixed?.(5) ?? lng}` : '';
    return `na:${name}|${addr}|${coords}`;
}

async function fetchBestTimeVenuesForLocationAll({ apiKeyPrivate, lat, lng, radiusM }) {
    const start = Math.max(500, Math.round(Number(radiusM) || 0));
    // BestTime may cap venues per call; expand radius to try to pull in anything that was cut off.
    // Keep the cap sane to avoid huge response sizes.
    const maxRadius = Math.max(start, 50000);
    const radii = [];
    for (let r = start; r <= maxRadius; r = Math.min(maxRadius, Math.round(r * 1.8))) {
        radii.push(r);
        if (r === maxRadius) break;
    }

    const byKey = new Map();
    let lastTotal = 0;
    let stallCount = 0;
    let requestCount = 0;
    const requestCap = 18;

    const metersToLatDeg = (m) => m / 111320;
    const metersToLngDeg = (m, atLatDeg) => {
        const cos = Math.cos((atLatDeg * Math.PI) / 180);
        return m / (111320 * Math.max(0.2, cos));
    };

    const addVenues = (venues) => {
        for (const v of venues || []) {
            const key = getBestTimeVenueKey(v);
            if (!byKey.has(key)) byKey.set(key, v);
        }
    };

    const sweepCenters = (baseLat, baseLng, r) => {
        // If the API caps results (often ~20), query a few nearby centers to pull in other venues.
        // Offsets are ~60% of radius in N/S/E/W directions.
        const offM = Math.max(800, r * 0.6);
        const dLat = metersToLatDeg(offM);
        const dLng = metersToLngDeg(offM, baseLat);
        return [
            { lat: baseLat + dLat, lng: baseLng, radiusM: r },
            { lat: baseLat - dLat, lng: baseLng, radiusM: r },
            { lat: baseLat, lng: baseLng + dLng, radiusM: r },
            { lat: baseLat, lng: baseLng - dLng, radiusM: r }
        ];
    };

    for (const r of radii) {
        if (requestCount >= requestCap) break;

        const venues = await fetchBestTimeVenuesForLocation({ apiKeyPrivate, lat, lng, radiusM: r });
        requestCount += 1;
        addVenues(venues);

        // If this call looks capped, do a small sweep at same radius.
        const looksCapped = Array.isArray(venues) && venues.length >= 20;
        if (looksCapped) {
            for (const c of sweepCenters(lat, lng, r)) {
                if (requestCount >= requestCap) break;
                const swept = await fetchBestTimeVenuesForLocation({ apiKeyPrivate, ...c });
                requestCount += 1;
                addVenues(swept);
            }
        }

        const total = byKey.size;
        if (total === lastTotal) {
            stallCount += 1;
        } else {
            stallCount = 0;
        }
        lastTotal = total;

        // If two consecutive rounds add nothing new, stop.
        if (stallCount >= 2) break;
    }

    return Array.from(byKey.values());
}

function classifyBestTimeVenues(venues) {
    const pizzaKeywords = ['pizza', 'pizzeria', 'domino', 'papa john', 'pizza hut', 'slice'];
    const gayKeywords = ['gay', 'lgbt', 'lgbtq', 'lgbtq+', 'queer', 'pride', 'rainbow'];

    const pizza = [];
    const gayBars = [];

    for (const v of venues || []) {
        const name = String(v?.venue_name ?? v?.name ?? '').toLowerCase();
        const type = String(v?.venue_type ?? v?.type ?? '').toLowerCase();
        const categories = Array.isArray(v?.categories) ? v.categories : (Array.isArray(v?.venue_categories) ? v.venue_categories : []);
        const catText = categories.map(c => String(c || '').toLowerCase()).join(' ');

        const isPizza = pizzaKeywords.some(k => name.includes(k) || type.includes(k) || catText.includes(k)) || type.includes('pizza') || catText.includes('pizza');
        const isGay = gayKeywords.some(k => name.includes(k) || type.includes(k) || catText.includes(k));
        const isBar = type.includes('bar') || type.includes('night') || catText.includes('bar') || name.includes('bar') || name.includes('club');
        const isGayBar = isGay && isBar;

        if (isPizza) pizza.push(v);
        if (isGayBar) gayBars.push(v);
    }

    return { pizza, gayBars };
}

function getBestTimeVenueBusyText(v) {
    // BestTime responses vary by plan and endpoint flags.
    const toFinite = (val) => {
        if (val === null || val === undefined) return null;
        const n = (typeof val === 'string') ? Number(val) : val;
        return Number.isFinite(n) ? n : null;
    };

    const live = v?.venue_live;
    if (live && typeof live === 'object') {
        const numericCandidates = [
            live?.busy,
            live?.busyness,
            live?.venue_live_busyness,
            live?.venue_live_forecasted_busyness,
            live?.current_busyness,
            live?.current_density
        ];
        for (const cand of numericCandidates) {
            const n = toFinite(cand);
            if (n !== null) return `${Math.round(n)}% busy`;
        }

        const statusCandidates = [
            live?.venue_live_busyness_status,
            live?.busyness_status,
            live?.status
        ];
        for (const s of statusCandidates) {
            if (typeof s === 'string' && s.trim()) return s.trim();
        }
    }

    const rootNumericCandidates = [
        v?.busy,
        v?.busyness,
        v?.venue_live_busyness,
        v?.venue_live_forecasted_busyness,
        v?.current_busyness,
        v?.current_density
    ];
    for (const cand of rootNumericCandidates) {
        const n = toFinite(cand);
        if (n !== null) return `${Math.round(n)}% busy`;
    }

    const rootStatusCandidates = [v?.busyness_status, v?.venue_live_busyness_status, v?.status];
    for (const s of rootStatusCandidates) {
        if (typeof s === 'string' && s.trim()) return s.trim();
    }

    return '';
}

function getBestTimeVenueCurrentBusyPercent(v) {
    const toFinite = (val) => {
        if (val === null || val === undefined) return null;
        const n = (typeof val === 'string') ? Number(val) : val;
        return Number.isFinite(n) ? n : null;
    };

    const live = v?.venue_live;
    if (live && typeof live === 'object') {
        const candidates = [
            live?.busy,
            live?.busyness,
            live?.venue_live_busyness,
            live?.venue_live_forecasted_busyness,
            live?.current_busyness,
            live?.current_density
        ];
        for (const cand of candidates) {
            const n = toFinite(cand);
            if (n !== null) return n;
        }
    }

    const rootCandidates = [
        v?.busy,
        v?.busyness,
        v?.venue_live_busyness,
        v?.venue_live_forecasted_busyness,
        v?.current_busyness,
        v?.current_density
    ];
    for (const cand of rootCandidates) {
        const n = toFinite(cand);
        if (n !== null) return n;
    }

    return null;
}

// Curated seed venues for Pentagon Tracker
let pentagonCuratedCache = null;
let warnedCuratedFileProtocol = false;

function warnCuratedFileProtocolOnce() {
    if (warnedCuratedFileProtocol) return;
    warnedCuratedFileProtocol = true;
    try {
        if (typeof setStatus === 'function') setStatus('Pentagon curated venues require http:// (run a local server)', false);
    } catch { }
}

async function loadPentagonCuratedVenues() {
    if (pentagonCuratedCache) return pentagonCuratedCache;
    try {
        if (location && location.protocol === 'file:') {
            warnCuratedFileProtocolOnce();
            pentagonCuratedCache = [];
            return pentagonCuratedCache;
        }
        const resp = await fetch('data/pentagon-curated-venues.json', { cache: 'no-store' });
        if (!resp.ok) {
            pentagonCuratedCache = [];
            return pentagonCuratedCache;
        }
        const data = await resp.json();
        const items = Array.isArray(data?.items) ? data.items : [];
        pentagonCuratedCache = items;
        return items;
    } catch {
        pentagonCuratedCache = [];
        return [];
    }
}

function haversineMeters(aLat, aLng, bLat, bLng) {
    const R = 6371000;
    const toRad = (d) => (d * Math.PI) / 180;
    const dLat = toRad(bLat - aLat);
    const dLng = toRad(bLng - aLng);
    const lat1 = toRad(aLat);
    const lat2 = toRad(bLat);
    const s1 = Math.sin(dLat / 2);
    const s2 = Math.sin(dLng / 2);
    const h = s1 * s1 + Math.cos(lat1) * Math.cos(lat2) * s2 * s2;
    return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
}

function getBestTimeVenueHourlyAveragePercent(v, date = new Date()) {
    // Try a few known-ish shapes; keep it resilient across API plan differences.
    const hour = date.getHours();

    const candidates = [
        v?.analysis?.day_raw,
        v?.venue_analysis?.day_raw,
        v?.venue_forecast?.day_raw,
        v?.forecast?.day_raw,
        v?.day_raw,
        v?.venue_live?.day_raw
    ];

    for (const arr of candidates) {
        if (!Array.isArray(arr)) continue;
        if (arr.length < 24) continue;
        const val = arr[hour];
        if (Number.isFinite(val)) return val;
    }

    return null;
}

function getBestTimeVenueAboveHourlyAvgText(v, date = new Date()) {
    const current = getBestTimeVenueCurrentBusyPercent(v);
    const avg = getBestTimeVenueHourlyAveragePercent(v, date);
    if (!Number.isFinite(current) || !Number.isFinite(avg) || avg <= 0) return '';
    if (current <= avg) return '';
    const pct = Math.round(((current - avg) / avg) * 100);
    return `+${pct}% vs hourly avg (${Math.round(avg)}%)`;
}

function renderPentagonTracker(data) {
    const panel = document.getElementById('pentagonPanel');
    const count = document.getElementById('pentagonCount');
    if (!panel || !count) return;

    if (!data) {
        panel.innerHTML = '<div class="loading-msg">Open Config to set BestTime key and locations</div>';
        count.textContent = '-';
        return;
    }

    // Handle both old format (array) and new format ({ locations, noApiKey })
    const resultByLocation = Array.isArray(data) ? data : (data.locations || []);
    const noApiKey = !Array.isArray(data) && data.noApiKey;

    const blocks = [];
    let totalMatches = 0;

    // Show notice if using curated venues only
    if (noApiKey) {
        blocks.push('<div class="loading-msg" style="padding: 0.6rem 1rem; background: #1a1a2e;">Showing curated venues only. Add BestTime API key in Settings for live busyness data.</div>');
    }

    for (const loc of resultByLocation) {
        const pizza = loc?.pizza || [];
        const gayBars = loc?.gayBars || [];
        totalMatches += pizza.length + gayBars.length;

        const renderVenue = (v) => {
            const name = escapeHtml(v?.venue_name ?? v?.name ?? 'Unknown');
            const addr = escapeHtml(v?.venue_address ?? v?.address ?? '');
            const busy = escapeHtml(getBestTimeVenueBusyText(v));
            const aboveAvg = escapeHtml(getBestTimeVenueAboveHourlyAvgText(v));
            const meta = [addr, busy, aboveAvg].filter(Boolean).join(' · ');
            const source = v?.__curated ? 'CURATED' : 'BESTTIME';
            const mapsUrl = v?.mapsUrl;
            return `
                <div class="item" style="cursor: default;">
                    <div class="item-source">${escapeHtml(source)}</div>
                    <div class="item-title">${name}</div>
                    ${meta ? `<div class="item-time">${meta}</div>` : ''}
                    ${mapsUrl ? `<div class="item-time"><a href="${escapeHtml(mapsUrl)}" target="_blank">Map →</a></div>` : ''}
                </div>
            `;
        };

        blocks.push(`
            <div class="item" style="cursor: default;">
                <div class="item-source">LOCATION</div>
                <div class="item-title">${escapeHtml(loc.name)}</div>
                <div class="item-time">${escapeHtml(loc.meta || '')}</div>
            </div>
        `);

        if (loc?.error) {
            blocks.push(`<div class="error-msg" style="padding: 0.6rem 1rem;">BestTime error: ${escapeHtml(loc.error)}</div>`);
        } else if (loc?.noApiKey) {
            const curatedNote = (typeof loc?.curatedCount === 'number' && loc.curatedCount > 0)
                ? `Curated venues: ${loc.curatedCount}`
                : 'No curated venues for this location';
            blocks.push(`<div class="loading-msg" style="padding: 0.6rem 1rem;">${curatedNote}</div>`);
        } else if (typeof loc?.venuesCount === 'number') {
            const vCount = loc.venuesCount;
            const curatedNote = (typeof loc?.curatedCount === 'number' && loc.curatedCount > 0)
                ? ` · curated: ${loc.curatedCount}`
                : '';
            blocks.push(`<div class="loading-msg" style="padding: 0.6rem 1rem;">BestTime venues returned: ${vCount}${curatedNote}</div>`);
            if (vCount === 0) {
                blocks.push('<div class="loading-msg" style="padding: 0.6rem 1rem;">If this stays at 0: double-check the key, or BestTime may have limited coverage for this radius.</div>');
            }
        }

        blocks.push(`
            <div class="item" style="cursor: default;">
                <div class="item-source">PIZZA</div>
                <div class="item-title">${pizza.length} matches</div>
            </div>
        `);
        blocks.push(pizza.length ? pizza.map(renderVenue).join('') : '<div class="loading-msg" style="padding: 0.6rem 1rem;">No pizza matches</div>');

        blocks.push(`
            <div class="item" style="cursor: default;">
                <div class="item-source">GAY BARS</div>
                <div class="item-title">${gayBars.length} matches</div>
            </div>
        `);
        blocks.push(gayBars.length ? gayBars.map(renderVenue).join('') : '<div class="loading-msg" style="padding: 0.6rem 1rem;">No gay bar matches</div>');
    }

    panel.innerHTML = blocks.join('');
    count.textContent = String(totalMatches);
}

async function fetchPentagonTracker() {
    const settings = getPentagonTrackerSettings();
    let apiKeyPrivate = (settings.apiKeyPrivate || '').trim();

    // UX: if the user has a key in the input (e.g. autofill) but hasn't clicked "Save key" yet,
    // use it automatically and persist it.
    if (!apiKeyPrivate) {
        const keyInput = document.getElementById('besttimeApiKeyPrivateInput');
        const fromInput = (keyInput?.value || '').trim();
        const lowered = fromInput.toLowerCase();
        const looksLikeUrl = lowered.includes('://') || lowered.startsWith('http') || lowered.includes('localhost') || lowered.includes('127.0.0.1');
        if (fromInput && !looksLikeUrl) {
            apiKeyPrivate = fromInput;
            try {
                savePentagonTrackerSettings({ ...settings, apiKeyPrivate });
            } catch { }
            try { localStorage.setItem(BESTTIME_PRIVATE_KEY_STORAGE_KEY, apiKeyPrivate); } catch { }
        }
    }

    const locations = settings.locations || [];
    const out = [];
    const hasApiKey = !!apiKeyPrivate;

    const curated = await loadPentagonCuratedVenues();

    for (const loc of locations) {
        try {
            // Fetch BestTime venues only if API key is available
            let venues = [];
            if (hasApiKey) {
                venues = await fetchBestTimeVenuesForLocationAll({
                    apiKeyPrivate,
                    lat: loc.lat,
                    lng: loc.lng,
                    radiusM: loc.radiusM
                });
            }

            // Merge curated venues (minimum baseline), filtered by radius when coordinates exist.
            const curatedForLoc = (curated || []).filter((it) => {
                const lat = Number(it?.lat);
                const lng = Number(it?.lng);
                if (Number.isFinite(lat) && Number.isFinite(lng) && Number.isFinite(loc.lat) && Number.isFinite(loc.lng)) {
                    return haversineMeters(loc.lat, loc.lng, lat, lng) <= Math.max(500, Number(loc.radiusM) || 0);
                }
                const locName = String(loc?.name || '').toLowerCase();
                return locName.includes('pentagon');
            }).map((it) => {
                const kind = String(it?.kind || '').toLowerCase();
                return {
                    venue_name: String(it?.name || 'Curated Venue'),
                    venue_address: '',
                    venue_lat: Number(it?.lat),
                    venue_lng: Number(it?.lng),
                    venue_type: kind,
                    mapsUrl: it?.mapsUrl,
                    __curated: true
                };
            });

            const merged = Array.isArray(venues) ? [...venues, ...curatedForLoc] : [...curatedForLoc];

            const { pizza, gayBars } = classifyBestTimeVenues(merged);
            out.push({
                id: loc.id,
                name: loc.name,
                meta: `${loc.lat.toFixed(4)}, ${loc.lng.toFixed(4)} · ${Math.round(loc.radiusM)}m`,
                venuesCount: Array.isArray(venues) ? venues.length : 0,
                curatedCount: curatedForLoc.length,
                pizza,
                gayBars,
                noApiKey: !hasApiKey
            });
        } catch (e) {
            // On error, still show curated venues as fallback
            const curatedForLoc = (curated || []).filter((it) => {
                const lat = Number(it?.lat);
                const lng = Number(it?.lng);
                if (Number.isFinite(lat) && Number.isFinite(lng) && Number.isFinite(loc.lat) && Number.isFinite(loc.lng)) {
                    return haversineMeters(loc.lat, loc.lng, lat, lng) <= Math.max(500, Number(loc.radiusM) || 0);
                }
                const locName = String(loc?.name || '').toLowerCase();
                return locName.includes('pentagon');
            }).map((it) => {
                const kind = String(it?.kind || '').toLowerCase();
                return {
                    venue_name: String(it?.name || 'Curated Venue'),
                    venue_address: '',
                    venue_lat: Number(it?.lat),
                    venue_lng: Number(it?.lng),
                    venue_type: kind,
                    mapsUrl: it?.mapsUrl,
                    __curated: true
                };
            });

            const { pizza, gayBars } = classifyBestTimeVenues(curatedForLoc);
            out.push({
                id: loc.id,
                name: loc.name,
                meta: `${loc.lat.toFixed(4)}, ${loc.lng.toFixed(4)} · ${Math.round(loc.radiusM)}m`,
                venuesCount: 0,
                curatedCount: curatedForLoc.length,
                pizza,
                gayBars,
                error: e?.message ? String(e.message) : 'Request failed'
            });
        }
    }

    return { locations: out, noApiKey: !hasApiKey };
}

// Current map view mode
let mapViewMode = 'global'; // 'global' or 'us'

// Fetch helper for CORS-hostile endpoints.
// Order: local /proxy (if present) → optional direct fetch → public CORS proxies.

const PROXY_ORIGIN_STORAGE_KEY = 'smProxyOrigin';
let resolvedProxyOrigin = undefined; // undefined=unknown, null=unavailable, ''=same-origin, or 'http://localhost:8001'
let proxyOriginPromise = null;

function normalizeProxyOrigin(origin) {
    if (!origin) return '';
    return String(origin).trim().replace(/\/$/, '');
}

async function probeProxyOrigin(origin, timeoutMs = 800) {
    const normalized = normalizeProxyOrigin(origin);
    const pingUrl = normalized ? `${normalized}/proxy/ping` : '/proxy/ping';
    const controller = new AbortController();
    const t = setTimeout(() => controller.abort(), timeoutMs);
    try {
        const resp = await fetch(pingUrl, { cache: 'no-store', signal: controller.signal });
        if (!resp.ok) return false;
        const text = await resp.text();
        return String(text || '').trim().toLowerCase().startsWith('ok');
    } catch {
        return false;
    } finally {
        clearTimeout(t);
    }
}

async function resolveWorkingProxyOrigin() {
    if (resolvedProxyOrigin !== undefined) return resolvedProxyOrigin;
    if (proxyOriginPromise) return proxyOriginPromise;

    proxyOriginPromise = (async () => {
        const candidates = [];

        // 1) Previously working proxy origin (if any)
        try {
            const stored = normalizeProxyOrigin(localStorage.getItem(PROXY_ORIGIN_STORAGE_KEY) || '');
            if (stored) candidates.push(stored);
        } catch { }

        // 2) Common dev ports
        candidates.push('http://localhost:8001', 'http://127.0.0.1:8001');
        candidates.push('http://localhost:8010', 'http://127.0.0.1:8010');

        // 3) Same-origin proxy (only probe if we're likely served by proxy_server.py)
        try {
            const p = String(window.location?.port || '');
            if (p === '8001' || p === '8010') candidates.push('');
        } catch { }

        const seen = new Set();
        for (const cand of candidates) {
            const normalized = normalizeProxyOrigin(cand);
            const key = normalized || '(same-origin)';
            if (seen.has(key)) continue;
            seen.add(key);

            const ok = await probeProxyOrigin(normalized);
            if (ok) {
                resolvedProxyOrigin = normalized;
                try {
                    if (normalized) localStorage.setItem(PROXY_ORIGIN_STORAGE_KEY, normalized);
                } catch { }
                return resolvedProxyOrigin;
            }
        }

        resolvedProxyOrigin = null;
        return null;
    })();

    const out = await proxyOriginPromise;
    proxyOriginPromise = null;
    return out;
}

async function fetchWithProxy(url, options = {}) {
    const accept = options.accept || 'application/rss+xml, application/xml, text/xml, */*';
    const responseType = options.responseType || 'text'; // 'text' | 'json'
    const tryDirect = options.tryDirect === true;
    const allowProxyFallbackOnNonOk = options.allowProxyFallbackOnNonOk === true;
    const fetchInit = options.fetchInit || {};
    const method = String(fetchInit.method || 'GET').toUpperCase();

    const mergedHeaders = new Headers(fetchInit.headers || {});
    if (accept && !mergedHeaders.has('Accept')) mergedHeaders.set('Accept', accept);

    // 1) Try a working local proxy (recommended for dev)
    const proxyOrigin = await resolveWorkingProxyOrigin();
    if (proxyOrigin !== null) {
        const proxyUrl = proxyOrigin
            ? `${proxyOrigin}/proxy?url=${encodeURIComponent(url)}`
            : `/proxy?url=${encodeURIComponent(url)}`;
        let gotResponseFromProxy = false;
        try {
            const resp = await fetch(proxyUrl, { ...fetchInit, headers: mergedHeaders });
            gotResponseFromProxy = true;
            if (resp.ok) {
                return responseType === 'json' ? await resp.json() : await resp.text();
            }
            // If we reached the local proxy but got a real upstream error (401/403/404/etc),
            // bubble it up instead of trying public proxies (which are usually blocked anyway).
            if (!allowProxyFallbackOnNonOk) {
                let detail = '';
                try {
                    const text = await resp.text();
                    detail = String(text || '').trim();
                    if (detail.length > 240) detail = detail.slice(0, 240) + '…';
                } catch { }
                const suffix = detail ? `: ${detail}` : '';
                throw new Error(`Proxy request failed (${resp.status} ${resp.statusText})${suffix}`);
            }
        } catch (e) {
            if (gotResponseFromProxy && !allowProxyFallbackOnNonOk) throw e;
        }
    }

    // 2) Optional direct fetch (disabled by default to avoid console CORS noise)
    if (tryDirect) {
        try {
            const direct = await fetch(url, { ...fetchInit, headers: mergedHeaders });
            if (direct.ok) {
                return responseType === 'json' ? await direct.json() : await direct.text();
            }
        } catch { }
    }

    // Public proxies only make sense for simple GETs.
    if (method !== 'GET') {
        throw new Error('No working local proxy available for non-GET request');
    }

    // 3) Fall back to public proxies
    let lastNonOk = null;
    for (let i = 0; i < CORS_PROXIES.length; i++) {
        try {
            const proxy = CORS_PROXIES[i];
            const response = await fetch(proxy + encodeURIComponent(url), { headers: mergedHeaders });
            if (response.ok) {
                return responseType === 'json' ? await response.json() : await response.text();
            }
            lastNonOk = { status: response.status, statusText: response.statusText, proxy };
        } catch {
            // Proxy failed, try next
        }
    }
    const suffix = lastNonOk ? ` (last: ${lastNonOk.status} ${lastNonOk.statusText} via ${lastNonOk.proxy})` : '';
    throw new Error('All proxies failed' + suffix);
}

// Check for alert keywords
function hasAlertKeyword(title) {
    const lower = title.toLowerCase();
    return ALERT_KEYWORDS.some(kw => lower.includes(kw));
}

// Parse RSS feed
async function fetchFeed(source) {
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
async function fetchCategory(feeds) {
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

// Fetch stock quote
const YAHOO_QUOTE_CACHE_TTL_MS = 2 * 60 * 1000;
const yahooQuoteCache = new Map();
let yahooQuoteInflight = null;
let yahooBlockUntilMs = 0;

async function fetchYahooQuotes(symbols) {
    const now = Date.now();
    const uniq = Array.from(new Set((symbols || []).map(s => String(s || '').trim()).filter(Boolean)));
    if (!uniq.length) return new Map();

    // Only request symbols that are missing or stale.
    const needed = [];
    for (const sym of uniq) {
        const cached = yahooQuoteCache.get(sym);
        if (!cached || (now - cached.ts) > YAHOO_QUOTE_CACHE_TTL_MS) needed.push(sym);
    }

    if (needed.length) {
        // If Yahoo is rate-limiting us, back off for a while.
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
                // Batch fetch to reduce 429s.
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
                    // Keep this quiet; upstream rate limits are common.
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

        // Await the current inflight fetch (even if it doesn't include every symbol you asked for,
        // it will still populate the cache for those that were requested).
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
        // Avoid spamming the console with many per-symbol errors.
        console.warn(`Error fetching ${symbol}:`, error?.message || error);
    }
    return null;
}

// Fetch market data
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

// Fetch sector heatmap data
async function fetchSectors() {
    const quoteMap = await fetchYahooQuotes(SECTORS.map(s => s.symbol));
    return SECTORS.map((s) => {
        const q = quoteMap.get(s.symbol);
        const change = q ? computeYahooChangePercent(q) : null;
        return { name: s.name, symbol: s.symbol, change: Number.isFinite(change) ? change : null };
    });
}

// Fetch commodities and VIX
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

// Map layer visibility state
let mapLayers = {
    conflicts: true,
    bases: true,
    nuclear: true,
    cables: true,
    sanctions: true,
    density: true
};

// Globe.gl instance for 3D globe view
let globeInstance = null;
let globeCountriesData = null;
let globeCablesData = null;

// Convert lat/lon to map position (simple equirectangular projection)
function latLonToXY(lat, lon, width, height) {
    const x = ((lon + 180) / 360) * width;
    const y = ((90 - lat) / 180) * height;
    return { x, y };
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
                if (item.isAlert) score += 3; // Boost for alert keywords
                // Store full headline object with link and source
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

// World map data cache
let worldMapData = null;
let usStatesData = null;

// Undersea cable geometry dataset cache (local)
let cableGeoData = null;

let warnedCableGeoFileProtocol = false;

function warnCableGeoFileProtocolOnce() {
    if (warnedCableGeoFileProtocol) return;
    warnedCableGeoFileProtocol = true;

    try {
        if (typeof setStatus === 'function') {
            setStatus('Cables data requires http:// (run a local server)', false);
        }
    } catch { }

    console.warn(
        'Cannot load data/cables-geo.json when opened via file:// due to browser security. ' +
        'Run a local server from the project folder (e.g. `python3 -m http.server 8000`) and open http://localhost:8000/ instead.'
    );
}

async function loadCableGeoData() {
    if (cableGeoData) return cableGeoData;
    try {
        // Browsers block fetch() of local files when the app is opened via file://.
        if (location && location.protocol === 'file:') {
            warnCableGeoFileProtocolOnce();
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

// Load world map TopoJSON data
async function loadWorldMap() {
    if (worldMapData) return worldMapData;

    // Check for file:// protocol which blocks fetch
    if (location && location.protocol === 'file:') {
        console.warn('Cannot load local files via file:// protocol. Run a local server.');
        return null;
    }

    try {
        // Prefer local vendored asset to avoid CORS/CDN issues.
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

// Load US states TopoJSON data
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

// Render the global map - 3D Globe with Globe.gl
async function renderGlobalMap(activityData, earthquakes = [], allNews = []) {
    // Cache allNews for popup access
    window.cachedAllNews = allNews;

    const panel = document.getElementById('mapPanel');
    const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19) + ' UTC';

    // Set up the container
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

    // Mount globe to container
    globeInstance(globeContainer);

    // Update globe size
    globeInstance.width(baseWidth).height(height);

    // Load world map data if not cached
    if (!globeCountriesData) {
        const world = await loadWorldMap();
        if (world) {
            globeCountriesData = topojson.feature(world, world.objects.countries).features;
        }
    }

    // Load cable data if not cached
    if (!globeCablesData) {
        const cableGeo = await loadCableGeoData();
        if (cableGeo && cableGeo.type === 'FeatureCollection') {
            globeCablesData = cableGeo.features;
        }
    }

    // Configure countries layer with sanction coloring
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
        // Fallback: use a simple earth texture when TopoJSON fails to load
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

            // Handle both LineString and MultiLineString
            const lineArrays = feature.geometry.type === 'LineString'
                ? [feature.geometry.coordinates]
                : (feature.geometry.type === 'MultiLineString'
                    ? feature.geometry.coordinates
                    : []);

            // Each line segment becomes a separate path
            lineArrays.forEach(lineCoords => {
                if (!Array.isArray(lineCoords) || lineCoords.length < 2) return;
                // Convert string coordinates to numbers
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

    // Build marker data arrays
    const pointMarkers = [];
    const htmlMarkers = [];

    // Military bases as points
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

    // Nuclear facilities as points
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

    // Earthquakes as points
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

    // HTML markers for intel hotspots, chokepoints, conflict zones, etc.

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

    // Conflict zones (labels only)
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

    // Configure HTML elements layer
    globeInstance
        .htmlElementsData(htmlMarkers)
        .htmlLat(d => d.lat)
        .htmlLng(d => d.lng)
        .htmlAltitude(0.02)
        .htmlElement(d => {
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
                const popupData = d.data;
                el.innerHTML = `
                    <div class="chokepoint ${d.data.isAlert ? 'alert' : ''}">
                        <div class="chokepoint-icon"></div>
                        <div class="chokepoint-label">${d.data.name}</div>
                    </div>
                `;
                el.querySelector('.chokepoint').onclick = (e) => {
                    e.stopPropagation();
                    showChokepointPopupDirect(e, popupData);
                };
            } else if (d.type === 'conflict') {
                const popupData = d.data;
                const intensityClass = d.data.intensity === 'high' ? 'high-intensity' : '';
                el.innerHTML = `
                    <div class="conflict-zone-label ${intensityClass}">
                        ${d.data.name}
                    </div>
                `;
                el.querySelector('.conflict-zone-label').onclick = (e) => {
                    e.stopPropagation();
                    showConflictPopupDirect(e, popupData);
                };
            } else if (d.type === 'cyber') {
                const popupData = d.data;
                el.innerHTML = `
                    <div class="cyber-zone ${d.data.isActive ? 'active' : ''}">
                        <div class="cyber-icon"></div>
                        <div class="cyber-label">${d.data.group}</div>
                    </div>
                `;
                el.querySelector('.cyber-zone').onclick = (e) => {
                    e.stopPropagation();
                    showCyberPopupDirect(e, popupData);
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
        });

    // Set initial view based on mode
    if (isUSView) {
        globeInstance.pointOfView({ lat: 39.0, lng: -98.0, altitude: 0.8 }, 1000);
    } else {
        globeInstance.pointOfView({ lat: 20, lng: 0, altitude: 2.0 }, 1000);
    }

    // Update zoom level display
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

    // Configure layer toggle buttons
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

    // Close popups when clicking on globe background
    globeInstance.onGlobeClick(() => {
        hideHotspotPopup();
        hideChokepointPopup();
        hideQuakePopup();
        hideCyberPopup();
        hideCustomHotspotPopup();
        hideConflictPopup();
        hideUSCityPopup();
        hideUSHotspotPopup();
        hideCablePopup();
    });
}

function getCountryLabelForLonLat(lon, lat) {
    try {
        const features = window.__smCountriesFeatures;
        if (!Array.isArray(features) || !Number.isFinite(lon) || !Number.isFinite(lat)) return '';
        for (const f of features) {
            try {
                if (d3.geoContains(f, [lon, lat])) {
                    const name = f?.properties?.name;
                    if (name) return String(name);
                    if (f?.id !== undefined && f?.id !== null) return `ID ${String(f.id)}`;
                    return 'Unknown';
                }
            } catch { }
        }
    } catch { }
    return '';
}

function showCablePopup(event, cableRef) {
    const popup = document.getElementById('cablePopup');
    if (!popup) return;

    // Hide other popups
    hideHotspotPopup();
    hideChokepointPopup();
    hideQuakePopup();
    hideCyberPopup();
    hideCustomHotspotPopup();
    hideUSCityPopup();
    hideUSHotspotPopup();
    hideConflictPopup();

    const byKey = window.__smCableInfoByKey;
    const info = (byKey && cableRef?.key && typeof byKey.get === 'function') ? byKey.get(cableRef.key) : null;
    const name = escapeHtml(cableRef?.name || info?.name || 'Undersea Cable');
    const id = escapeHtml(cableRef?.id || info?.id || '');

    const a = info?.endpoints?.a;
    const b = info?.endpoints?.b;

    const aCountry = (a && Number.isFinite(a.lon) && Number.isFinite(a.lat)) ? getCountryLabelForLonLat(a.lon, a.lat) : '';
    const bCountry = (b && Number.isFinite(b.lon) && Number.isFinite(b.lat)) ? getCountryLabelForLonLat(b.lon, b.lat) : '';

    const endpointsText = (aCountry && bCountry)
        ? `${escapeHtml(aCountry)} ↔ ${escapeHtml(bCountry)}`
        : (a && b)
            ? `${a.lat.toFixed(2)}°, ${a.lon.toFixed(2)}° ↔ ${b.lat.toFixed(2)}°, ${b.lon.toFixed(2)}°`
            : '';

    popup.innerHTML = `
        <button class="chokepoint-popup-close" onclick="hideCablePopup()">&times;</button>
        <div class="chokepoint-popup-header">
            <span class="chokepoint-popup-title">${name}</span>
            <span class="chokepoint-popup-status normal">CABLE</span>
        </div>
        <div class="chokepoint-popup-info">
            ${id ? `
            <div class="chokepoint-popup-stat">
                <span class="chokepoint-popup-stat-label">ID</span>
                <span class="chokepoint-popup-stat-value">${id}</span>
            </div>
            ` : ''}
            ${endpointsText ? `
            <div class="chokepoint-popup-stat">
                <span class="chokepoint-popup-stat-label">Endpoints</span>
                <span class="chokepoint-popup-stat-value cable-endpoints-value">${endpointsText}</span>
            </div>
            ` : ''}
        </div>
    `;

    popup.className = 'chokepoint-popup visible';

    // Position near cursor
    const mapContainer = document.getElementById('worldMapContainer');
    if (!mapContainer) return;
    const mapRect = mapContainer.getBoundingClientRect();
    const popupWidth = 320;
    const popupHeight = 240;

    let left = (event.clientX - mapRect.left) + 16;
    let top = (event.clientY - mapRect.top) + 16;

    if (left + popupWidth > mapRect.width) left = mapRect.width - popupWidth - 10;
    if (top + popupHeight > mapRect.height) top = mapRect.height - popupHeight - 10;
    if (left < 10) left = 10;
    if (top < 10) top = 10;

    popup.style.left = `${left}px`;
    popup.style.top = `${top}px`;
}

function hideCablePopup() {
    const popup = document.getElementById('cablePopup');
    if (popup) popup.classList.remove('visible');
}

// Show hotspot popup
function showHotspotPopup(event, hotspotId) {
    if (event?.stopPropagation) event.stopPropagation();

    const hotspotEl = (event?.currentTarget && event.currentTarget instanceof Element)
        ? event.currentTarget
        : (event?.target?.closest?.(`[data-hotspot-id="${hotspotId}"]`) || document.querySelector(`[data-hotspot-id="${hotspotId}"]`));
    if (!hotspotEl) return;

    // Hide other popups
    hideChokepointPopup();
    hideQuakePopup();
    hideCyberPopup();
    hideCustomHotspotPopup();
    hideUSCityPopup();
    hideUSHotspotPopup();

    const activityData = JSON.parse(decodeURIComponent(hotspotEl.dataset.hotspotActivity));
    const popup = document.getElementById('hotspotPopup');

    // Build headlines HTML
    let headlinesHTML = '';
    if (activityData.headlines && activityData.headlines.length > 0) {
        headlinesHTML = activityData.headlines.map(h => `
                    <div class="hotspot-popup-headline">
                        <div class="hotspot-popup-source">${escapeHtml(h.source || 'News')}</div>
                        <a href="${h.link || '#'}" target="_blank">${escapeHtml(h.title)}</a>
                    </div>
                `).join('');
    } else {
        headlinesHTML = '<div class="hotspot-popup-empty">No recent headlines for this location</div>';
    }

    // Build agencies HTML if available
    let agenciesHTML = '';
    if (activityData.agencies && activityData.agencies.length > 0) {
        agenciesHTML = `
                    <div class="hotspot-popup-agencies">
                        <div class="hotspot-popup-agencies-title">Key Entities</div>
                        ${activityData.agencies.map(a => `<span class="hotspot-popup-agency">${escapeHtml(a)}</span>`).join('')}
                    </div>
                `;
    }

    // Build popup content
    popup.innerHTML = `
                <button class="hotspot-popup-close" onclick="hideHotspotPopup()">&times;</button>
                <div class="hotspot-popup-header">
                    <span class="hotspot-popup-title">${escapeHtml(activityData.name)}</span>
                    <span class="hotspot-popup-level ${activityData.level}">${activityData.level.toUpperCase()}</span>
                </div>
                <div class="hotspot-popup-subtext">${escapeHtml(activityData.subtext)}</div>
                ${activityData.description ? `<div class="hotspot-popup-desc">${escapeHtml(activityData.description)}</div>` : ''}
                <div class="hotspot-popup-meta">
                    <div class="hotspot-popup-meta-item">
                        <span class="hotspot-popup-meta-label">Coordinates</span>
                        <span class="hotspot-popup-meta-value">${activityData.lat.toFixed(2)}°${activityData.lat >= 0 ? 'N' : 'S'}, ${Math.abs(activityData.lon).toFixed(2)}°${activityData.lon >= 0 ? 'E' : 'W'}</span>
                    </div>
                    ${activityData.status ? `
                    <div class="hotspot-popup-meta-item">
                        <span class="hotspot-popup-meta-label">Status</span>
                        <span class="hotspot-popup-meta-value">${escapeHtml(activityData.status)}</span>
                    </div>
                    ` : ''}
                </div>
                ${agenciesHTML}
                ${headlinesHTML.includes('hotspot-popup-headline') ? '<div class="hotspot-popup-headlines-title">Related Headlines</div>' : ''}
                <div class="hotspot-popup-headlines">
                    ${headlinesHTML}
                </div>
            `;

    // Set popup class for styling based on threat level
    popup.className = `hotspot-popup visible ${activityData.level}`;

    // Position popup near the hotspot
    const hotspotRect = hotspotEl.getBoundingClientRect();
    const mapContainer = document.getElementById('worldMapContainer');
    const mapRect = mapContainer.getBoundingClientRect();

    // Calculate position relative to map container
    let left = hotspotRect.left - mapRect.left + 20;
    let top = hotspotRect.top - mapRect.top - 10;

    // Ensure popup stays within map bounds
    const popupWidth = 320;
    const popupHeight = 400;

    if (left + popupWidth > mapRect.width) {
        left = hotspotRect.left - mapRect.left - popupWidth - 20;
    }
    if (top + popupHeight > mapRect.height) {
        top = mapRect.height - popupHeight - 10;
    }
    if (top < 10) top = 10;
    if (left < 10) left = 10;

    popup.style.left = left + 'px';
    popup.style.top = top + 'px';
}

// Hide hotspot popup
function hideHotspotPopup() {
    const popup = document.getElementById('hotspotPopup');
    if (popup) {
        popup.classList.remove('visible');
    }
}

// Direct popup functions for Globe.gl (data passed directly, not from DOM)
function showHotspotPopupDirect(event, activityData) {
    if (event?.stopPropagation) event.stopPropagation();

    hideChokepointPopup();
    hideQuakePopup();
    hideCyberPopup();
    hideCustomHotspotPopup();
    hideConflictPopup();

    const popup = document.getElementById('hotspotPopup');
    if (!popup) return;

    let headlinesHTML = '';
    if (activityData.headlines && activityData.headlines.length > 0) {
        headlinesHTML = activityData.headlines.map(h => `
            <div class="hotspot-popup-headline">
                <div class="hotspot-popup-source">${escapeHtml(h.source || 'News')}</div>
                <a href="${h.link || '#'}" target="_blank">${escapeHtml(h.title)}</a>
            </div>
        `).join('');
    } else {
        headlinesHTML = '<div class="hotspot-popup-empty">No recent headlines for this location</div>';
    }

    let agenciesHTML = '';
    if (activityData.agencies && activityData.agencies.length > 0) {
        agenciesHTML = `
            <div class="hotspot-popup-agencies">
                <div class="hotspot-popup-agencies-title">Key Entities</div>
                ${activityData.agencies.map(a => `<span class="hotspot-popup-agency">${escapeHtml(a)}</span>`).join('')}
            </div>
        `;
    }

    popup.innerHTML = `
        <button class="hotspot-popup-close" onclick="hideHotspotPopup()">&times;</button>
        <div class="hotspot-popup-header">
            <span class="hotspot-popup-title">${escapeHtml(activityData.name)}</span>
            <span class="hotspot-popup-level ${activityData.level}">${(activityData.level || 'low').toUpperCase()}</span>
        </div>
        <div class="hotspot-popup-subtext">${escapeHtml(activityData.subtext || '')}</div>
        ${activityData.description ? `<div class="hotspot-popup-desc">${escapeHtml(activityData.description)}</div>` : ''}
        ${agenciesHTML}
        ${headlinesHTML.includes('hotspot-popup-headline') ? '<div class="hotspot-popup-headlines-title">Related Headlines</div>' : ''}
        <div class="hotspot-popup-headlines">${headlinesHTML}</div>
    `;

    popup.className = `hotspot-popup visible ${activityData.level || 'low'}`;
    positionPopupAtEvent(popup, event);
}

function showChokepointPopupDirect(event, cpData) {
    if (event?.stopPropagation) event.stopPropagation();

    hideHotspotPopup();
    hideQuakePopup();
    hideCyberPopup();
    hideCustomHotspotPopup();
    hideConflictPopup();

    const popup = document.getElementById('chokepointPopup');
    if (!popup) return;

    let headlinesHTML = '<div class="chokepoint-popup-empty">No related news</div>';
    if (cpData.headlines && cpData.headlines.length > 0) {
        headlinesHTML = cpData.headlines.map(h => `
            <div class="chokepoint-popup-headline">
                <a href="${h.link || '#'}" target="_blank">${escapeHtml(h.title)}</a>
                <span class="chokepoint-popup-source">${escapeHtml(h.source || '')}</span>
            </div>
        `).join('');
    }

    popup.innerHTML = `
        <button class="chokepoint-popup-close" onclick="hideChokepointPopup()">&times;</button>
        <div class="chokepoint-popup-header">
            <span class="chokepoint-popup-title">${escapeHtml(cpData.name)}</span>
            <span class="chokepoint-popup-status ${cpData.isAlert ? 'alert' : 'normal'}">${cpData.isAlert ? 'ALERT' : 'NORMAL'}</span>
        </div>
        <div class="chokepoint-popup-desc">${escapeHtml(cpData.desc || '')}</div>
        <div class="chokepoint-popup-info">
            <div class="chokepoint-popup-stat">
                <span class="chokepoint-popup-stat-label">Traffic</span>
                <span class="chokepoint-popup-stat-value">${cpData.traffic || 'N/A'}</span>
            </div>
            <div class="chokepoint-popup-stat">
                <span class="chokepoint-popup-stat-label">Region</span>
                <span class="chokepoint-popup-stat-value">${cpData.region || 'N/A'}</span>
            </div>
        </div>
        <div class="chokepoint-popup-headlines">${headlinesHTML}</div>
    `;

    popup.className = `chokepoint-popup visible ${cpData.isAlert ? 'alert' : ''}`;
    positionPopupAtEvent(popup, event);
}

function showConflictPopupDirect(event, conflictData) {
    if (event?.stopPropagation) event.stopPropagation();

    hideHotspotPopup();
    hideChokepointPopup();
    hideQuakePopup();
    hideCyberPopup();
    hideCustomHotspotPopup();

    const popup = document.getElementById('conflictPopup');
    if (!popup) return;

    let matchedHeadlines = [];
    if (window.cachedAllNews && conflictData.keywords) {
        matchedHeadlines = window.cachedAllNews.filter(item => {
            const title = (item.title || '').toLowerCase();
            return conflictData.keywords.some(kw => title.includes(kw.toLowerCase()));
        }).slice(0, 5);
    }

    let headlinesHTML = '';
    if (matchedHeadlines.length > 0) {
        headlinesHTML = `
            <div class="conflict-popup-headlines-title">Related Headlines</div>
            <div class="conflict-popup-headlines">
                ${matchedHeadlines.map(h => `
                    <div class="conflict-popup-headline">
                        <a href="${h.link || '#'}" target="_blank">${escapeHtml(h.title)}</a>
                    </div>
                `).join('')}
            </div>
        `;
    }

    popup.innerHTML = `
        <button class="conflict-popup-close" onclick="hideConflictPopup()">&times;</button>
        <div class="conflict-popup-header">
            <span class="conflict-popup-title">${escapeHtml(conflictData.name)}</span>
            <span class="conflict-popup-intensity ${conflictData.intensity}">${(conflictData.intensity || '').toUpperCase()}</span>
        </div>
        <div class="conflict-popup-desc">${escapeHtml(conflictData.description || '')}</div>
        <div class="conflict-popup-stats">
            <div class="conflict-popup-stat"><strong>Started:</strong> ${conflictData.startDate || 'N/A'}</div>
            <div class="conflict-popup-stat"><strong>Parties:</strong> ${(conflictData.parties || []).join(', ')}</div>
            <div class="conflict-popup-stat"><strong>Casualties:</strong> ${conflictData.casualties || 'N/A'}</div>
        </div>
        ${headlinesHTML}
    `;

    popup.className = `conflict-popup visible ${conflictData.intensity}`;
    positionPopupAtEvent(popup, event);
}

function showCyberPopupDirect(event, cyberData) {
    if (event?.stopPropagation) event.stopPropagation();

    hideHotspotPopup();
    hideChokepointPopup();
    hideQuakePopup();
    hideCustomHotspotPopup();
    hideConflictPopup();

    const popup = document.getElementById('cyberPopup');
    if (!popup) return;

    const title = cyberData.group || cyberData.name || 'Cyber';
    const statusClass = cyberData.isActive ? 'active' : 'dormant';
    const statusLabel = cyberData.isActive ? 'Active' : 'Dormant';
    const aptText = [cyberData.group || cyberData.name, cyberData.aka].filter(Boolean).join(' — ');
    const targets = Array.isArray(cyberData.targets) ? cyberData.targets : [];
    const targetsHTML = targets.map(t => `<span class="cyber-popup-target-tag">${escapeHtml(t)}</span>`).join('');
    const aptSection = aptText ? `<div class="cyber-popup-apt">${escapeHtml(aptText)}</div>` : '';
    const targetsSection = targetsHTML ? `
        <div class="cyber-popup-targets">
            <div class="cyber-popup-targets-label">Targets</div>
            <div class="cyber-popup-target-tags">${targetsHTML}</div>
        </div>
    ` : '';

    popup.innerHTML = `
        <button class="cyber-popup-close" onclick="hideCyberPopup()">&times;</button>
        <div class="cyber-popup-header">
            <span class="cyber-popup-title">${escapeHtml(title)}</span>
            <span class="cyber-popup-status ${statusClass}">${statusLabel}</span>
        </div>
        ${aptSection}
        <div class="cyber-popup-desc">${escapeHtml(cyberData.desc || '')}</div>
        <div class="cyber-popup-info">
            <div class="cyber-popup-stat">
                <span class="cyber-popup-stat-label">Sponsor</span>
                <span class="cyber-popup-stat-value">${escapeHtml(cyberData.sponsor || 'Unknown')}</span>
            </div>
        </div>
        ${targetsSection}
    `;

    popup.className = `cyber-popup visible ${cyberData.isActive ? 'active' : ''}`;
    positionPopupAtEvent(popup, event);
}

function showCustomHotspotPopupDirect(event, monitorData) {
    if (event?.stopPropagation) event.stopPropagation();

    hideHotspotPopup();
    hideChokepointPopup();
    hideQuakePopup();
    hideCyberPopup();
    hideConflictPopup();

    const popup = document.getElementById('customHotspotPopup');
    if (!popup) return;

    let matchesHTML = '<div class="custom-hotspot-popup-empty">No matches found</div>';
    if (monitorData.matches && monitorData.matches.length > 0) {
        matchesHTML = monitorData.matches.map(m => `
            <div class="custom-hotspot-popup-match">
                <a href="${m.link || '#'}" target="_blank">${escapeHtml(m.title)}</a>
            </div>
        `).join('');
    }

    popup.innerHTML = `
        <button class="custom-hotspot-popup-close" onclick="hideCustomHotspotPopup()">&times;</button>
        <div class="custom-hotspot-popup-header">
            <div class="custom-hotspot-popup-dot" style="background: ${monitorData.color};"></div>
            <div class="custom-hotspot-popup-name" style="color: ${monitorData.color};">${escapeHtml(monitorData.name)}</div>
            <div class="custom-hotspot-popup-count">${monitorData.matchCount || 0} matches</div>
        </div>
        <div class="custom-hotspot-popup-keywords">Keywords: ${(monitorData.keywords || []).map(k => escapeHtml(k)).join(', ')}</div>
        <div class="custom-hotspot-popup-matches">${matchesHTML}</div>
    `;

    popup.className = 'custom-hotspot-popup visible';
    positionPopupAtEvent(popup, event);
}

// Helper function to position popups at click event location
function positionPopupAtEvent(popup, event) {
    const mapContainer = document.getElementById('worldMapContainer');
    if (!mapContainer) return;

    const mapRect = mapContainer.getBoundingClientRect();
    const popupWidth = 320;
    const popupHeight = 300;

    let left = (event.clientX - mapRect.left) + 15;
    let top = (event.clientY - mapRect.top) + 15;

    if (left + popupWidth > mapRect.width) left = mapRect.width - popupWidth - 10;
    if (top + popupHeight > mapRect.height) top = mapRect.height - popupHeight - 10;
    if (left < 10) left = 10;
    if (top < 10) top = 10;

    popup.style.left = `${left}px`;
    popup.style.top = `${top}px`;
}

function showQuakePopupDirect(event, quakeData) {
    if (event?.stopPropagation) event.stopPropagation();

    hideHotspotPopup();
    hideChokepointPopup();
    hideCyberPopup();
    hideCustomHotspotPopup();
    hideConflictPopup();

    const popup = document.getElementById('quakePopup');
    if (!popup) return;

    const timeStr = quakeData.time ? new Date(quakeData.time).toLocaleString() : 'Unknown';
    const mag = quakeData.mag || 0;
    const isMajor = mag >= 6.0;
    const isModerate = mag >= 5.0;
    const severity = isMajor ? 'major' : (isModerate ? 'moderate' : 'minor');
    const severityLabel = isMajor ? 'Major' : (isModerate ? 'Moderate' : 'Minor');

    popup.innerHTML = `
        <button class="quake-popup-close" onclick="hideQuakePopup()">&times;</button>
        <div class="quake-popup-header">
            <span class="quake-popup-mag">M${mag.toFixed(1)}</span>
            <span class="quake-popup-severity ${severity}">${severityLabel}</span>
        </div>
        <div class="quake-popup-location">${escapeHtml(quakeData.place || 'Unknown location')}</div>
        <div class="quake-popup-info">
            <div class="quake-popup-stat">
                <span class="quake-popup-stat-label">Time</span>
                <span class="quake-popup-stat-value">${timeStr}</span>
            </div>
            <div class="quake-popup-stat">
                <span class="quake-popup-stat-label">Depth</span>
                <span class="quake-popup-stat-value">${quakeData.depth ? quakeData.depth.toFixed(1) + ' km' : 'N/A'}</span>
            </div>
            <div class="quake-popup-stat">
                <span class="quake-popup-stat-label">Coordinates</span>
                <span class="quake-popup-stat-value">${quakeData.lat?.toFixed(2) || 0}°, ${quakeData.lon?.toFixed(2) || 0}°</span>
            </div>
        </div>
    `;

    popup.className = `quake-popup visible ${isMajor ? 'major' : ''}`;
    positionPopupAtEvent(popup, event);
}

function showBasePopupDirect(event, baseData) {
    if (event?.stopPropagation) event.stopPropagation();

    hideHotspotPopup();
    hideChokepointPopup();
    hideQuakePopup();
    hideCyberPopup();
    hideCustomHotspotPopup();
    hideConflictPopup();

    const popup = document.getElementById('conflictPopup'); // Reuse conflict popup
    if (!popup) return;

    const typeLabel = baseData.type === 'us-nato' ? 'US/NATO' :
                      baseData.type === 'china' ? 'China' : 'Russia';
    const typeColor = baseData.type === 'us-nato' ? '#ff00ff' :
                      baseData.type === 'china' ? '#ff6600' : '#ff3333';

    popup.innerHTML = `
        <button class="conflict-popup-close" onclick="hideConflictPopup()">&times;</button>
        <div class="conflict-popup-header">
            <span class="conflict-popup-title">${escapeHtml(baseData.name)}</span>
            <span class="conflict-popup-intensity" style="background: ${typeColor}">${typeLabel}</span>
        </div>
        <div class="conflict-popup-desc">Military installation</div>
        <div class="conflict-popup-stats">
            <div class="conflict-popup-stat"><strong>Type:</strong> ${typeLabel} Base</div>
            <div class="conflict-popup-stat"><strong>Location:</strong> ${baseData.lat?.toFixed(2) || 0}°, ${baseData.lon?.toFixed(2) || 0}°</div>
        </div>
    `;

    popup.className = 'conflict-popup visible';
    positionPopupAtEvent(popup, event);
}

function showNuclearPopupDirect(event, nuclearData) {
    if (event?.stopPropagation) event.stopPropagation();

    hideHotspotPopup();
    hideChokepointPopup();
    hideQuakePopup();
    hideCyberPopup();
    hideCustomHotspotPopup();
    hideConflictPopup();

    const popup = document.getElementById('conflictPopup'); // Reuse conflict popup
    if (!popup) return;

    const isWeapons = nuclearData.type === 'weapons' || nuclearData.type === 'enrichment';
    const typeLabel = nuclearData.type === 'weapons' ? 'Weapons Facility' :
                      nuclearData.type === 'enrichment' ? 'Enrichment Facility' :
                      nuclearData.type === 'reprocessing' ? 'Reprocessing Facility' : 'Power Plant';

    popup.innerHTML = `
        <button class="conflict-popup-close" onclick="hideConflictPopup()">&times;</button>
        <div class="conflict-popup-header">
            <span class="conflict-popup-title">☢ ${escapeHtml(nuclearData.name)}</span>
            <span class="conflict-popup-intensity ${isWeapons ? 'high' : ''}">${isWeapons ? 'SENSITIVE' : 'CIVILIAN'}</span>
        </div>
        <div class="conflict-popup-desc">${typeLabel}</div>
        <div class="conflict-popup-stats">
            <div class="conflict-popup-stat"><strong>Type:</strong> ${typeLabel}</div>
            <div class="conflict-popup-stat"><strong>Status:</strong> ${nuclearData.status || 'Unknown'}</div>
            <div class="conflict-popup-stat"><strong>Location:</strong> ${nuclearData.lat?.toFixed(2) || 0}°, ${nuclearData.lon?.toFixed(2) || 0}°</div>
        </div>
    `;

    popup.className = 'conflict-popup visible';
    positionPopupAtEvent(popup, event);
}

// Show conflict zone popup
function showConflictPopup(event, conflictId) {
    if (event?.stopPropagation) event.stopPropagation();

    const conflictEl = (event?.currentTarget && event.currentTarget instanceof Element)
        ? event.currentTarget
        : (event?.target?.closest?.(`[data-conflict-id="${conflictId}"]`) || document.querySelector(`[data-conflict-id="${conflictId}"]`));
    if (!conflictEl) return;

    // Hide other popups
    hideHotspotPopup();
    hideChokepointPopup();
    hideQuakePopup();
    hideCyberPopup();
    hideCustomHotspotPopup();
    hideUSCityPopup();
    hideUSHotspotPopup();

    const conflictData = JSON.parse(decodeURIComponent(conflictEl.dataset.conflictInfo));
    const popup = document.getElementById('conflictPopup');

    // Find matching headlines from cachedNews
    let matchedHeadlines = [];
    if (window.cachedAllNews && conflictData.keywords) {
        matchedHeadlines = window.cachedAllNews.filter(item => {
            const title = (item.title || '').toLowerCase();
            return conflictData.keywords.some(kw => title.includes(kw.toLowerCase()));
        }).slice(0, 5);
    }

    // Build headlines HTML
    let headlinesHTML = '';
    if (matchedHeadlines.length > 0) {
        headlinesHTML = `
                    <div class="conflict-popup-headlines-title">Related Headlines</div>
                    <div class="conflict-popup-headlines">
                        ${matchedHeadlines.map(h => `
                            <div class="conflict-popup-headline">
                                <div class="conflict-popup-headline-source">${escapeHtml(h.source || 'News')}</div>
                                <a href="${h.link || '#'}" target="_blank">${escapeHtml(h.title)}</a>
                            </div>
                        `).join('')}
                    </div>
                `;
    }

    // Build popup content
    popup.innerHTML = `
                <button class="conflict-popup-close" onclick="hideConflictPopup()">&times;</button>
                <div class="conflict-popup-header">
                    <span class="conflict-popup-title">${escapeHtml(conflictData.name)}</span>
                    <span class="conflict-popup-intensity ${conflictData.intensity}">${conflictData.intensity.toUpperCase()}</span>
                </div>
                <div class="conflict-popup-meta">
                    <div class="conflict-popup-meta-item">
                        <span class="conflict-popup-meta-label">Start Date</span>
                        <span class="conflict-popup-meta-value">${escapeHtml(conflictData.startDate)}</span>
                    </div>
                    <div class="conflict-popup-meta-item">
                        <span class="conflict-popup-meta-label">Casualties</span>
                        <span class="conflict-popup-meta-value">${escapeHtml(conflictData.casualties)}</span>
                    </div>
                    <div class="conflict-popup-meta-item">
                        <span class="conflict-popup-meta-label">Displaced</span>
                        <span class="conflict-popup-meta-value">${escapeHtml(conflictData.displaced)}</span>
                    </div>
                    <div class="conflict-popup-meta-item">
                        <span class="conflict-popup-meta-label">Location</span>
                        <span class="conflict-popup-meta-value">${conflictData.labelPos.lat.toFixed(1)}°N, ${conflictData.labelPos.lon.toFixed(1)}°E</span>
                    </div>
                </div>
                <div class="conflict-popup-desc">${escapeHtml(conflictData.description)}</div>
                <div class="conflict-popup-parties">
                    <div class="conflict-popup-parties-title">Belligerents</div>
                    ${conflictData.parties.map(p => `<span class="conflict-popup-party">${escapeHtml(p)}</span>`).join('')}
                </div>
                <div class="conflict-popup-events">
                    <div class="conflict-popup-events-title">Key Developments</div>
                    ${conflictData.keyEvents.map(e => `<div class="conflict-popup-event">${escapeHtml(e)}</div>`).join('')}
                </div>
                ${headlinesHTML}
            `;

    // Position popup
    popup.classList.add('visible');

    const conflictRect = conflictEl.getBoundingClientRect();
    const mapContainer = document.getElementById('worldMapContainer');
    const mapRect = mapContainer.getBoundingClientRect();

    let left = conflictRect.left - mapRect.left + 20;
    let top = conflictRect.top - mapRect.top - 10;

    const popupWidth = 380;
    const popupHeight = 450;

    if (left + popupWidth > mapRect.width) {
        left = conflictRect.left - mapRect.left - popupWidth - 20;
    }
    if (top + popupHeight > mapRect.height) {
        top = mapRect.height - popupHeight - 10;
    }
    if (top < 10) top = 10;
    if (left < 10) left = 10;

    popup.style.left = left + 'px';
    popup.style.top = top + 'px';
}

// Hide conflict popup
function hideConflictPopup() {
    const popup = document.getElementById('conflictPopup');
    if (popup) {
        popup.classList.remove('visible');
    }
}

// Show US city popup
function showUSCityPopup(event, cityId) {
    if (event?.stopPropagation) event.stopPropagation();

    const cityEl = (event?.currentTarget && event.currentTarget instanceof Element)
        ? event.currentTarget
        : (event?.target?.closest?.(`[data-city-id="${cityId}"]`) || document.querySelector(`[data-city-id="${cityId}"]`));
    if (!cityEl) return;

    // Hide other popups
    hideHotspotPopup();
    hideConflictPopup();
    hideChokepointPopup();
    hideQuakePopup();
    hideCyberPopup();
    hideCustomHotspotPopup();
    hideUSHotspotPopup();

    const cityData = JSON.parse(decodeURIComponent(cityEl.dataset.cityInfo));
    const popup = document.getElementById('usCityPopup');

    // Build headlines HTML
    let headlinesHTML = '';
    if (cityData.headlines && cityData.headlines.length > 0) {
        headlinesHTML = cityData.headlines.map(h => `
                    <div class="us-city-popup-headline">
                        <div class="us-city-popup-headline-source">${escapeHtml(h.source || 'News')}</div>
                        <a href="${h.link || '#'}" target="_blank">${escapeHtml(h.title)}</a>
                    </div>
                `).join('');
    } else {
        headlinesHTML = '<div style="padding: 1rem; color: #336688; font-size: 0.6rem; text-align: center;">No recent headlines for this city</div>';
    }

    // Build sectors HTML
    const sectorsHTML = cityData.sectors ? cityData.sectors.map(s =>
        `<span style="display: inline-block; font-size: 0.5rem; padding: 0.1rem 0.3rem; margin: 0.1rem; background: rgba(0, 170, 255, 0.1); border: 1px solid rgba(0, 170, 255, 0.2); color: #66aacc;">${escapeHtml(s)}</span>`
    ).join('') : '';

    popup.innerHTML = `
                <button class="us-city-popup-close" onclick="hideUSCityPopup()">&times;</button>
                <div class="us-city-popup-header">
                    <span class="us-city-popup-title">${escapeHtml(cityData.name)}</span>
                    <span class="us-city-popup-state">${escapeHtml(cityData.state)}</span>
                </div>
                <div class="us-city-popup-meta">
                    <div>
                        <span class="us-city-popup-meta-label">Population</span>
                        <span class="us-city-popup-meta-value">${escapeHtml(cityData.population)}</span>
                    </div>
                    <div>
                        <span class="us-city-popup-meta-label">News Matches</span>
                        <span class="us-city-popup-meta-value">${cityData.matchCount || 0}</span>
                    </div>
                    <div>
                        <span class="us-city-popup-meta-label">Coordinates</span>
                        <span class="us-city-popup-meta-value">${cityData.lat.toFixed(2)}°N, ${Math.abs(cityData.lon).toFixed(2)}°W</span>
                    </div>
                    <div>
                        <span class="us-city-popup-meta-label">Type</span>
                        <span class="us-city-popup-meta-value">${cityData.type === 'capital' ? 'Capital' : cityData.type === 'major' ? 'Major Metro' : cityData.type === 'military' ? 'Military' : 'Regional'}</span>
                    </div>
                </div>
                <div class="us-city-popup-desc">${escapeHtml(cityData.description)}</div>
                ${sectorsHTML ? `<div style="padding: 0.5rem 1rem; border-bottom: 1px solid rgba(0, 100, 170, 0.2);"><div style="font-size: 0.45rem; color: #336688; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 0.3rem;">Key Sectors</div>${sectorsHTML}</div>` : ''}
                <div class="us-city-popup-headlines-title">Related Headlines</div>
                <div class="us-city-popup-headlines">
                    ${headlinesHTML}
                </div>
            `;

    popup.classList.add('visible');

    // Position popup
    const cityRect = cityEl.getBoundingClientRect();
    const mapContainer = document.getElementById('worldMapContainer');
    const mapRect = mapContainer.getBoundingClientRect();

    let left = cityRect.left - mapRect.left + 20;
    let top = cityRect.top - mapRect.top - 10;

    const popupWidth = 360;
    const popupHeight = 420;

    if (left + popupWidth > mapRect.width) {
        left = cityRect.left - mapRect.left - popupWidth - 20;
    }
    if (top + popupHeight > mapRect.height) {
        top = mapRect.height - popupHeight - 10;
    }
    if (top < 10) top = 10;
    if (left < 10) left = 10;

    popup.style.left = left + 'px';
    popup.style.top = top + 'px';
}

// Hide US city popup
function hideUSCityPopup() {
    const popup = document.getElementById('usCityPopup');
    if (popup) {
        popup.classList.remove('visible');
    }
}

// Show US hotspot popup
function showUSHotspotPopup(event, hotspotId) {
    if (event?.stopPropagation) event.stopPropagation();

    const hotspotEl = (event?.currentTarget && event.currentTarget instanceof Element)
        ? event.currentTarget
        : (event?.target?.closest?.(`[data-us-hotspot-id="${hotspotId}"]`) || document.querySelector(`[data-us-hotspot-id="${hotspotId}"]`));
    if (!hotspotEl) return;

    // Hide other popups
    hideHotspotPopup();
    hideConflictPopup();
    hideChokepointPopup();
    hideQuakePopup();
    hideCyberPopup();
    hideCustomHotspotPopup();
    hideUSCityPopup();

    const hotspotData = JSON.parse(decodeURIComponent(hotspotEl.dataset.usHotspotInfo));
    const popup = document.getElementById('usHotspotPopup');

    // Build headlines HTML
    let headlinesHTML = '';
    if (hotspotData.headlines && hotspotData.headlines.length > 0) {
        headlinesHTML = hotspotData.headlines.map(h => `
                    <div class="us-hotspot-popup-headline">
                        <div class="us-hotspot-popup-headline-source">${escapeHtml(h.source || 'News')}</div>
                        <a href="${h.link || '#'}" target="_blank">${escapeHtml(h.title)}</a>
                    </div>
                `).join('');
    } else {
        headlinesHTML = '<div class="us-hotspot-popup-headline" style="color: #666;">No matching headlines found</div>';
    }

    popup.className = `us-hotspot-popup ${hotspotData.level}`;
    popup.innerHTML = `
                <button class="us-hotspot-popup-close" onclick="hideUSHotspotPopup()">&times;</button>
                <div class="us-hotspot-popup-header">
                    <span class="us-hotspot-popup-title">${hotspotData.icon} ${escapeHtml(hotspotData.name)}</span>
                    <span class="us-hotspot-popup-level ${hotspotData.level}">${hotspotData.level.toUpperCase()}</span>
                </div>
                <div class="us-hotspot-popup-meta">
                    <div>
                        <span class="us-hotspot-popup-meta-label">Location</span>
                        <span class="us-hotspot-popup-meta-value">${escapeHtml(hotspotData.location)}</span>
                    </div>
                    <div>
                        <span class="us-hotspot-popup-meta-label">Category</span>
                        <span class="us-hotspot-popup-meta-value">${escapeHtml(hotspotData.category)}</span>
                    </div>
                    <div>
                        <span class="us-hotspot-popup-meta-label">Since</span>
                        <span class="us-hotspot-popup-meta-value">${escapeHtml(hotspotData.startDate)}</span>
                    </div>
                    <div>
                        <span class="us-hotspot-popup-meta-label">Status</span>
                        <span class="us-hotspot-popup-meta-value">${escapeHtml(hotspotData.status)}</span>
                    </div>
                </div>
                <div class="us-hotspot-popup-desc">${escapeHtml(hotspotData.description)}</div>
                <div class="us-hotspot-popup-headlines-title">Related Headlines (${hotspotData.matchCount || 0})</div>
                <div class="us-hotspot-popup-headlines">
                    ${headlinesHTML}
                </div>
            `;

    popup.classList.add('visible');

    // Position popup near the hotspot
    const mapRect = document.getElementById('worldMapContainer').getBoundingClientRect();
    const hotspotRect = hotspotEl.getBoundingClientRect();
    const popupWidth = 320;
    const popupHeight = 400;

    let left = hotspotRect.left - mapRect.left + 30;
    let top = hotspotRect.top - mapRect.top - 50;

    // Adjust if popup would go off screen
    if (left + popupWidth > mapRect.width) {
        left = hotspotRect.left - mapRect.left - popupWidth - 30;
    }
    if (top + popupHeight > mapRect.height) {
        top = mapRect.height - popupHeight - 10;
    }
    if (top < 10) top = 10;
    if (left < 10) left = 10;

    popup.style.left = left + 'px';
    popup.style.top = top + 'px';
}

// Hide US hotspot popup
function hideUSHotspotPopup() {
    const popup = document.getElementById('usHotspotPopup');
    if (popup) {
        popup.classList.remove('visible');
    }
}

// Show chokepoint popup
function showChokepointPopup(event, chokepointId) {
    if (event?.stopPropagation) event.stopPropagation();

    const cpEl = (event?.currentTarget && event.currentTarget instanceof Element)
        ? event.currentTarget
        : (event?.target?.closest?.(`[data-chokepoint-id="${chokepointId}"]`) || document.querySelector(`[data-chokepoint-id="${chokepointId}"]`));
    if (!cpEl) return;

    // Hide other popups
    hideHotspotPopup();
    hideQuakePopup();
    hideCyberPopup();
    hideCustomHotspotPopup();
    hideUSCityPopup();
    hideUSHotspotPopup();
    hideConflictPopup();

    const cpData = JSON.parse(decodeURIComponent(cpEl.dataset.chokepointInfo));
    const popup = document.getElementById('chokepointPopup');

    // Build headlines HTML
    let headlinesHTML = '';
    if (cpData.headlines && cpData.headlines.length > 0) {
        headlinesHTML = cpData.headlines.map(h => `
                    <div class="chokepoint-popup-headline">
                        <a href="${h.link || '#'}" target="_blank">${escapeHtml(h.title)}</a>
                    </div>
                `).join('');
    } else {
        headlinesHTML = '<div class="chokepoint-popup-empty">No recent headlines for this chokepoint</div>';
    }

    // Build popup content
    popup.innerHTML = `
                <button class="chokepoint-popup-close" onclick="hideChokepointPopup()">&times;</button>
                <div class="chokepoint-popup-header">
                    <span class="chokepoint-popup-title">${escapeHtml(cpData.name)}</span>
                    <span class="chokepoint-popup-status ${cpData.isAlert ? 'alert' : 'normal'}">${cpData.isAlert ? 'ALERT' : 'NORMAL'}</span>
                </div>
                <div class="chokepoint-popup-info">
                    <div class="chokepoint-popup-stat">
                        <span class="chokepoint-popup-stat-label">Region</span>
                        <span class="chokepoint-popup-stat-value">${escapeHtml(cpData.region)}</span>
                    </div>
                    <div class="chokepoint-popup-stat">
                        <span class="chokepoint-popup-stat-label">Traffic</span>
                        <span class="chokepoint-popup-stat-value">${escapeHtml(cpData.traffic)}</span>
                    </div>
                </div>
                <div class="chokepoint-popup-desc">${escapeHtml(cpData.desc)}</div>
                <div class="chokepoint-popup-headlines">
                    ${headlinesHTML}
                </div>
            `;

    // Set popup class for styling
    popup.className = `chokepoint-popup visible ${cpData.isAlert ? 'alert' : ''}`;

    // Position popup near the chokepoint
    const cpRect = cpEl.getBoundingClientRect();
    const mapContainer = document.getElementById('worldMapContainer');
    const mapRect = mapContainer.getBoundingClientRect();

    // Calculate position relative to map container
    let left = cpRect.left - mapRect.left + 20;
    let top = cpRect.top - mapRect.top - 10;

    // Ensure popup stays within map bounds
    const popupWidth = 280;
    const popupHeight = 300;

    if (left + popupWidth > mapRect.width) {
        left = cpRect.left - mapRect.left - popupWidth - 20;
    }
    if (top + popupHeight > mapRect.height) {
        top = mapRect.height - popupHeight - 10;
    }
    if (top < 10) top = 10;
    if (left < 10) left = 10;

    popup.style.left = left + 'px';
    popup.style.top = top + 'px';
}

// Hide chokepoint popup
function hideChokepointPopup() {
    const popup = document.getElementById('chokepointPopup');
    if (popup) {
        popup.classList.remove('visible');
    }
}

// Show earthquake popup
function showQuakePopup(event, quakeId) {
    if (event?.stopPropagation) event.stopPropagation();

    const quakeEl = (event?.currentTarget && event.currentTarget instanceof Element)
        ? event.currentTarget
        : (event?.target?.closest?.(`[data-quake-id="${quakeId}"]`) || document.querySelector(`[data-quake-id="${quakeId}"]`));
    if (!quakeEl) return;

    // Hide other popups
    hideHotspotPopup();
    hideChokepointPopup();
    hideCyberPopup();
    hideCustomHotspotPopup();
    hideUSCityPopup();
    hideUSHotspotPopup();
    hideConflictPopup();

    const eqData = JSON.parse(decodeURIComponent(quakeEl.dataset.quakeInfo));
    const popup = document.getElementById('quakePopup');

    const isMajor = eqData.mag >= 6.0;
    const isModerate = eqData.mag >= 5.0;

    // Determine severity label
    let severity = 'minor';
    let severityLabel = 'Minor';
    if (isMajor) {
        severity = 'major';
        severityLabel = 'Major';
    } else if (isModerate) {
        severity = 'moderate';
        severityLabel = 'Moderate';
    }

    // Format time
    const time = new Date(eqData.time);
    const timeStr = time.toLocaleString();
    const timeAgo = getTimeAgo(time);

    // USGS link
    const usgsLink = `https://earthquake.usgs.gov/earthquakes/eventpage/${eqData.id || ''}`;

    popup.innerHTML = `
                <button class="quake-popup-close" onclick="hideQuakePopup()">&times;</button>
                <div class="quake-popup-header">
                    <span class="quake-popup-mag">M${eqData.mag.toFixed(1)}</span>
                    <span class="quake-popup-severity ${severity}">${severityLabel}</span>
                </div>
                <div class="quake-popup-location">${escapeHtml(eqData.place)}</div>
                <div class="quake-popup-info">
                    <div class="quake-popup-stat">
                        <span class="quake-popup-stat-label">Depth</span>
                        <span class="quake-popup-stat-value">${eqData.depth.toFixed(1)} km</span>
                    </div>
                    <div class="quake-popup-stat">
                        <span class="quake-popup-stat-label">Coordinates</span>
                        <span class="quake-popup-stat-value">${eqData.lat.toFixed(2)}°, ${eqData.lon.toFixed(2)}°</span>
                    </div>
                    <div class="quake-popup-stat">
                        <span class="quake-popup-stat-label">Time</span>
                        <span class="quake-popup-stat-value">${timeAgo}</span>
                    </div>
                </div>
                <a href="${usgsLink}" target="_blank" class="quake-popup-link">View on USGS →</a>
            `;

    // Set popup class
    popup.className = `quake-popup visible ${isMajor ? 'major' : ''}`;

    // Position popup
    const quakeRect = quakeEl.getBoundingClientRect();
    const mapContainer = document.getElementById('worldMapContainer');
    const mapRect = mapContainer.getBoundingClientRect();

    let left = quakeRect.left - mapRect.left + 20;
    let top = quakeRect.top - mapRect.top - 10;

    const popupWidth = 260;
    const popupHeight = 220;

    if (left + popupWidth > mapRect.width) {
        left = quakeRect.left - mapRect.left - popupWidth - 20;
    }
    if (top + popupHeight > mapRect.height) {
        top = mapRect.height - popupHeight - 10;
    }
    if (top < 10) top = 10;
    if (left < 10) left = 10;

    popup.style.left = left + 'px';
    popup.style.top = top + 'px';
}

// Hide earthquake popup
function hideQuakePopup() {
    const popup = document.getElementById('quakePopup');
    if (popup) {
        popup.classList.remove('visible');
    }
}

// Get time ago string
function getTimeAgo(date) {
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
}

// Show cyber threat popup
function showCyberPopup(event, cyberId) {
    if (event?.stopPropagation) event.stopPropagation();

    const cyberEl = (event?.currentTarget && event.currentTarget instanceof Element)
        ? event.currentTarget
        : (event?.target?.closest?.(`[data-cyber-id="${cyberId}"]`) || document.querySelector(`[data-cyber-id="${cyberId}"]`));
    if (!cyberEl) return;

    // Hide other popups
    hideHotspotPopup();
    hideChokepointPopup();
    hideQuakePopup();
    hideCustomHotspotPopup();
    hideUSCityPopup();
    hideUSHotspotPopup();
    hideConflictPopup();

    const czData = JSON.parse(decodeURIComponent(cyberEl.dataset.cyberInfo));
    const popup = document.getElementById('cyberPopup');

    // Build targets HTML
    const targetsHTML = czData.targets.map(t =>
        `<span class="cyber-popup-target-tag">${escapeHtml(t)}</span>`
    ).join('');

    popup.innerHTML = `
                <button class="cyber-popup-close" onclick="hideCyberPopup()">&times;</button>
                <div class="cyber-popup-header">
                    <span class="cyber-popup-title">${escapeHtml(czData.fullName)}</span>
                    <span class="cyber-popup-status ${czData.isActive ? 'active' : 'dormant'}">${czData.isActive ? 'Active' : 'Dormant'}</span>
                </div>
                <div class="cyber-popup-apt">${escapeHtml(czData.group)} — ${escapeHtml(czData.aka)}</div>
                <div class="cyber-popup-desc">${escapeHtml(czData.desc)}</div>
                <div class="cyber-popup-info">
                    <div class="cyber-popup-stat">
                        <span class="cyber-popup-stat-label">State Sponsor</span>
                        <span class="cyber-popup-stat-value">${escapeHtml(czData.sponsor)}</span>
                    </div>
                    <div class="cyber-popup-stat">
                        <span class="cyber-popup-stat-label">Coordinates</span>
                        <span class="cyber-popup-stat-value">${czData.lat.toFixed(1)}°, ${czData.lon.toFixed(1)}°</span>
                    </div>
                </div>
                <div class="cyber-popup-targets">
                    <div class="cyber-popup-targets-label">Primary Targets</div>
                    <div class="cyber-popup-target-tags">${targetsHTML}</div>
                </div>
            `;

    // Set popup class
    popup.className = `cyber-popup visible ${czData.isActive ? 'active' : ''}`;

    // Position popup
    const cyberRect = cyberEl.getBoundingClientRect();
    const mapContainer = document.getElementById('worldMapContainer');
    const mapRect = mapContainer.getBoundingClientRect();

    let left = cyberRect.left - mapRect.left + 25;
    let top = cyberRect.top - mapRect.top - 10;

    const popupWidth = 280;
    const popupHeight = 300;

    if (left + popupWidth > mapRect.width) {
        left = cyberRect.left - mapRect.left - popupWidth - 25;
    }
    if (top + popupHeight > mapRect.height) {
        top = mapRect.height - popupHeight - 10;
    }
    if (top < 10) top = 10;
    if (left < 10) left = 10;

    popup.style.left = left + 'px';
    popup.style.top = top + 'px';
}

// Hide cyber threat popup
function hideCyberPopup() {
    const popup = document.getElementById('cyberPopup');
    if (popup) {
        popup.classList.remove('visible');
    }
}

// Show custom hotspot popup
function showCustomHotspotPopup(event, monitorId) {
    if (event?.stopPropagation) event.stopPropagation();

    const hotspotEl = (event?.currentTarget && event.currentTarget instanceof Element)
        ? event.currentTarget
        : (event?.target?.closest?.(`[data-monitor-id="${monitorId}"]`) || document.querySelector(`[data-monitor-id="${monitorId}"]`));
    if (!hotspotEl) return;

    // Hide other popups
    hideHotspotPopup();
    hideChokepointPopup();
    hideQuakePopup();
    hideCyberPopup();
    hideUSCityPopup();
    hideUSHotspotPopup();
    hideConflictPopup();

    const monitorData = JSON.parse(decodeURIComponent(hotspotEl.dataset.monitorInfo));
    const popup = document.getElementById('customHotspotPopup');
    if (!popup) return;

    let matchesHTML = '';
    if (monitorData.matches && monitorData.matches.length > 0) {
        matchesHTML = monitorData.matches.map(m => `
                    <div class="custom-hotspot-popup-match">
                        <a href="${m.link}" target="_blank">${m.title}</a>
                        <div class="custom-hotspot-popup-match-source">${m.source || 'News'}</div>
                    </div>
                `).join('');
    } else {
        matchesHTML = '<div class="custom-hotspot-popup-empty">No matching headlines</div>';
    }

    popup.innerHTML = `
                <button class="custom-hotspot-popup-close" onclick="hideCustomHotspotPopup()">×</button>
                <div class="custom-hotspot-popup-header">
                    <div class="custom-hotspot-popup-dot" style="background: ${monitorData.color};"></div>
                    <div class="custom-hotspot-popup-name" style="color: ${monitorData.color};">${monitorData.name}</div>
                    <div class="custom-hotspot-popup-count">${monitorData.matchCount} matches</div>
                </div>
                <div class="custom-hotspot-popup-keywords">
                    <strong>Keywords:</strong> ${monitorData.keywords.join(', ')}
                </div>
                <div class="custom-hotspot-popup-coords">
                    📍 ${monitorData.lat.toFixed(4)}, ${monitorData.lon.toFixed(4)}
                </div>
                <div class="custom-hotspot-popup-matches">
                    ${matchesHTML}
                </div>
            `;

    // Position the popup
    const container = document.getElementById('worldMapContainer');
    const containerRect = container.getBoundingClientRect();
    const hotspotRect = hotspotEl.getBoundingClientRect();

    let left = hotspotRect.left - containerRect.left + 20;
    let top = hotspotRect.top - containerRect.top;

    // Keep within bounds
    if (left + 300 > containerRect.width) {
        left = hotspotRect.left - containerRect.left - 310;
    }
    if (top + 250 > containerRect.height) {
        top = containerRect.height - 260;
    }
    if (top < 10) top = 10;

    popup.style.left = left + 'px';
    popup.style.top = top + 'px';
    popup.classList.add('visible');
}

// Hide custom hotspot popup
function hideCustomHotspotPopup() {
    const popup = document.getElementById('customHotspotPopup');
    if (popup) {
        popup.classList.remove('visible');
    }
}

// Calculate news density for each region
function calculateNewsDensity(allNews) {
    const scores = {};
    NEWS_REGIONS.forEach(region => {
        let score = 0;
        allNews.forEach(item => {
            const title = (item.title || '').toLowerCase();
            region.keywords.forEach(kw => {
                if (title.includes(kw)) score++;
            });
            if (item.isAlert) score += 2; // Boost for alerts
        });
        scores[region.id] = score;
    });
    return scores;
}

// Toggle map layer visibility
function toggleLayer(layerName) {
    mapLayers[layerName] = !mapLayers[layerName];
    // Re-render the map to apply changes
    refreshAll();
}

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

        // STAGE 2: Secondary data (gov, commodities, polymarket, printer, earthquakes, map layers)
        const stage2Promise = Promise.all([
            isPanelEnabled('gov') ? fetchCategory(FEEDS.gov) : Promise.resolve([]),
            isPanelEnabled('commodities') ? fetchCommodities() : Promise.resolve([]),
            isPanelEnabled('polymarket') ? fetchPolymarket() : Promise.resolve([]),
            isPanelEnabled('printer') ? fetchFedBalance() : Promise.resolve({ value: 0, change: 0, changePercent: 0, percentOfMax: 0 }),
            isPanelEnabled('map') ? fetchEarthquakes() : Promise.resolve([]),
            isPanelEnabled('map') && mapLayers.weather ? fetchWeatherWarnings() : Promise.resolve([]),
            isPanelEnabled('map') && mapLayers.naval ? fetchNavalHubs() : Promise.resolve([]),
            isPanelEnabled('map') && mapLayers.flights ? fetchMilitaryFlights() : Promise.resolve([])
        ]);

        const [gov, commodities, polymarket, fedBalance, earthquakes, weatherWarnings, navalHubs, militaryFlights] = await stage2Promise;

        // Update cached layer data for the globe
        cachedWeatherWarnings = weatherWarnings || [];
        cachedNavalHubs = navalHubs || [];
        cachedMilitaryFlights = militaryFlights || [];

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
        // Fallback on failure
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
        try {
            window.lastGovContractsError = error?.message ? String(error.message) : 'Request failed';
        } catch { }
        return [];
    }
}

function getDateDaysAgo(days) {
    const d = new Date();
    d.setDate(d.getDate() - days);
    return d.toISOString().split('T')[0];
}

function getToday() {
    return new Date().toISOString().split('T')[0];
}

// AI RSS feeds for arms race tracking
async function fetchAINews() {
    const results = await Promise.all(AI_FEEDS.map(async (source) => {
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
            return [];
        }
    }));

    return results.flat().sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 15);
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

// Detect regions from text
function detectRegions(text) {
    const lower = text.toLowerCase();
    const regions = [];
    for (const [region, keywords] of Object.entries(REGION_KEYWORDS)) {
        if (keywords.some(kw => lower.includes(kw))) {
            regions.push(region);
        }
    }
    return regions;
}

// Detect topics from text
function detectTopics(text) {
    const lower = text.toLowerCase();
    const topics = [];
    for (const [topic, keywords] of Object.entries(TOPIC_KEYWORDS)) {
        if (keywords.some(kw => lower.includes(kw))) {
            topics.push(topic);
        }
    }
    return topics;
}

// Fetch Intel Feed from multiple sources
async function fetchIntelFeed() {
    const results = await Promise.all(INTEL_SOURCES.map(async (source) => {
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

                const title = item.querySelector('title')?.textContent?.trim() || 'No title';
                const pubDate = item.querySelector('pubDate')?.textContent ||
                    item.querySelector('published')?.textContent || '';

                // Detect regions and topics from title
                const detectedRegions = source.region ? [source.region] : detectRegions(title);
                const detectedTopics = detectTopics(title);

                // Priority flag for critical items
                const isPriority = ALERT_KEYWORDS.some(kw => title.toLowerCase().includes(kw));

                return {
                    source: source.name,
                    sourceType: source.type,
                    title,
                    link: link.trim(),
                    pubDate,
                    regions: detectedRegions,
                    topics: detectedTopics,
                    isPriority
                };
            });
        } catch (e) {
            return [];
        }
    }));

    // Flatten and sort by date, priority items first
    const allItems = results.flat();
    allItems.sort((a, b) => {
        if (a.isPriority && !b.isPriority) return -1;
        if (!a.isPriority && b.isPriority) return 1;
        return new Date(b.pubDate) - new Date(a.pubDate);
    });

    return allItems.slice(0, 25);
}

// Render Intel Feed panel
function renderIntelFeed(items) {
    const panel = document.getElementById('intelPanel');
    const count = document.getElementById('intelCount');

    if (!items || items.length === 0) {
        panel.innerHTML = '<div class="loading-msg">No intel available</div>';
        count.textContent = '-';
        return;
    }

    count.textContent = items.length;

    panel.innerHTML = items.map(item => {
        // Build tags HTML
        let tagsHTML = '';

        // Source type tag
        if (item.sourceType === 'osint') {
            tagsHTML += '<span class="intel-tag osint">OSINT</span>';
        } else if (item.sourceType === 'govt') {
            tagsHTML += '<span class="intel-tag govt">GOVT</span>';
        }

        // Region tags (max 2)
        item.regions.slice(0, 2).forEach(r => {
            tagsHTML += `<span class="intel-tag region">${r}</span>`;
        });

        // Topic tags (max 2)
        item.topics.slice(0, 2).forEach(t => {
            tagsHTML += `<span class="intel-tag topic">${t}</span>`;
        });

        const timeAgo = item.pubDate ? getRelativeTime(new Date(item.pubDate)) : '';

        return `
                    <div class="intel-item ${item.isPriority ? 'priority' : ''}">
                        <div class="intel-header">
                            <span class="intel-source">${item.source}</span>
                            <div class="intel-tags">${tagsHTML}</div>
                        </div>
                        <a href="${item.link}" target="_blank" class="intel-title">${item.title}</a>
                        <div class="intel-meta">
                            <span>${timeAgo}</span>
                        </div>
                    </div>
                `;
    }).join('');
}

// Get relative time string
function getRelativeTime(date) {
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
}

// Render Layoffs panel
function renderLayoffs(layoffs) {
    const panel = document.getElementById('layoffsPanel');
    const count = document.getElementById('layoffsCount');

    if (!layoffs || layoffs.length === 0) {
        panel.innerHTML = '<div class="loading-msg">No recent layoffs data</div>';
        count.textContent = '-';
        return;
    }

    count.textContent = layoffs.length;

    panel.innerHTML = layoffs.map(l => `
                <div class="layoff-item">
                    <div class="layoff-company">${l.company}</div>
                    ${l.count ? `<div class="layoff-count">${parseInt(l.count).toLocaleString()} jobs</div>` : ''}
                    <div class="layoff-meta">
                        <span class="headline">${l.title}</span>
                        <span class="time">${timeAgo(l.date)}</span>
                    </div>
                </div>
            `).join('');
}

// Render Situation panel (Venezuela or Greenland)
function renderSituation(panelId, statusId, news, config) {
    const panel = document.getElementById(panelId);
    const status = document.getElementById(statusId);

    if (!panel) return;

    // Determine threat level based on recent news volume and keywords
    let threatLevel = 'monitoring';
    let threatText = 'MONITORING';

    if (news.length > 0) {
        const recentNews = news.filter(n => {
            const date = new Date(n.pubDate);
            const hoursSince = (Date.now() - date.getTime()) / (1000 * 60 * 60);
            return hoursSince < 24;
        });

        const criticalKeywords = config.criticalKeywords || [];
        const hasCritical = news.some(n =>
            criticalKeywords.some(k => n.title.toLowerCase().includes(k))
        );

        if (hasCritical || recentNews.length >= 3) {
            threatLevel = 'critical';
            threatText = 'CRITICAL';
        } else if (recentNews.length >= 1) {
            threatLevel = 'elevated';
            threatText = 'ELEVATED';
        }
    }

    status.innerHTML = `<span class="situation-status ${threatLevel}">${threatText}</span>`;

    const newsHTML = news.length > 0 ? news.map(n => `
                <div class="situation-item">
                    <a href="${n.link}" target="_blank" class="headline">${n.title}</a>
                    <div class="meta">${n.source} · ${timeAgo(n.pubDate)}</div>
                </div>
            `).join('') : '<div class="loading-msg">No recent news</div>';

    panel.innerHTML = `
                <div class="situation-header">
                    <div class="situation-title">${config.title}</div>
                    <div class="situation-subtitle">${config.subtitle}</div>
                </div>
                ${newsHTML}
            `;
}

// Format relative time
function timeAgo(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now - date) / 1000);

    if (seconds < 60) return 'just now';
    if (seconds < 3600) return Math.floor(seconds / 60) + 'm ago';
    if (seconds < 86400) return Math.floor(seconds / 3600) + 'h ago';
    return Math.floor(seconds / 86400) + 'd ago';
}

// Render news items
function renderNews(items, panelId, countId) {
    const panel = document.getElementById(panelId);
    const count = document.getElementById(countId);

    if (items.length === 0) {
        panel.innerHTML = '<div class="error-msg">Failed to load</div>';
        count.textContent = '0';
        return;
    }

    panel.innerHTML = items.map(item => `
                <div class="item ${item.isAlert ? 'alert' : ''}">
                    <div class="item-source">${item.source}${item.isAlert ? '<span class="alert-tag">ALERT</span>' : ''}</div>
                    <a class="item-title" href="${item.link}" target="_blank">${item.title}</a>
                    <div class="item-time">${timeAgo(item.pubDate)}</div>
                </div>
            `).join('');

    count.textContent = items.length;
}

// Render markets
function renderMarkets(markets) {
    const panel = document.getElementById('marketsPanel');
    const count = document.getElementById('marketsCount');

    if (markets.length === 0) {
        panel.innerHTML = '<div class="error-msg">Failed to load</div>';
        count.textContent = '0';
        return;
    }

    panel.innerHTML = markets.map(m => {
        const changeClass = m.change > 0 ? 'up' : m.change < 0 ? 'down' : '';
        const changeText = m.change !== null ? `${m.change > 0 ? '+' : ''}${m.change.toFixed(2)}%` : '-';
        const priceDisplay = typeof m.price === 'number' && m.price > 100
            ? m.price.toLocaleString('en-US', { maximumFractionDigits: 0 })
            : m.price?.toFixed(2);

        return `
                    <div class="market-item">
                        <div>
                            <div class="market-name">${m.name}</div>
                            <div class="market-symbol">${m.symbol}</div>
                        </div>
                        <div class="market-data">
                            <div class="market-price">$${priceDisplay}</div>
                            <div class="market-change ${changeClass}">${changeText}</div>
                        </div>
                    </div>
                `;
    }).join('');

    count.textContent = markets.length;
}

// Start app when DOM is ready
document.addEventListener('DOMContentLoaded', initApp);

// Export functions to window for HTML onclick handlers
// This is necessary when bundled with Vite/esbuild as ES modules
if (typeof window !== 'undefined') {
  window.toggleSettings = toggleSettings;
  window.refreshAll = refreshAll;
  window.resetPanelOrder = resetPanelOrder;
  window.togglePanel = togglePanel;
}
