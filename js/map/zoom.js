// Map zoom and pan functionality

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

function mapZoomIn() {
    if (typeof globeInstance !== 'undefined' && globeInstance) {
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
    if (typeof globeInstance !== 'undefined' && globeInstance) {
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
    if (typeof globeInstance !== 'undefined' && globeInstance) {
        const isUSView = typeof mapViewMode !== 'undefined' && mapViewMode === 'us';
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

function applyMapTransform() {
    const wrapper = document.getElementById('mapZoomWrapper');
    const levelDisplay = document.getElementById('mapZoomLevel');
    const panHint = document.getElementById('mapPanHint');

    if (wrapper) {
        wrapper.style.transform = `translate(${mapPan.x}px, ${mapPan.y}px) scale(${mapZoom})`;

        const z = Math.max(1, mapZoom || 1);
        const markerScale = 1 / Math.pow(z, 2.0);
        wrapper.style.setProperty('--sm-marker-scale', markerScale.toFixed(6));
        wrapper.style.setProperty('--sm-marker-scale-hover', (markerScale * 1.3).toFixed(6));
        wrapper.style.setProperty('--sm-marker-scale-hover-soft', (markerScale * 1.15).toFixed(6));
        wrapper.style.setProperty('--sm-marker-scale-pulse', (markerScale * 1.1).toFixed(6));
    }
    if (levelDisplay) {
        levelDisplay.textContent = `${mapZoom.toFixed(1)}x`;
    }
    if (panHint) {
        const isUSView = typeof mapViewMode !== 'undefined' && mapViewMode === 'us';
        panHint.classList.toggle('show', !isUSView || mapZoom > 1);
    }
}

function scheduleApplyMapTransform() {
    if (mapTransformRaf) return;
    mapTransformRaf = requestAnimationFrame(() => {
        mapTransformRaf = 0;
        applyMapTransform();
    });
}

function normaliseWrappedPanX(containerWidth) {
    if (!containerWidth) return;
    const half = containerWidth / 2;
    const wrapped = ((((mapPan.x + half) % containerWidth) + containerWidth) % containerWidth) - half;
    const delta = wrapped - mapPan.x;
    if (delta !== 0) {
        mapPan.x = wrapped;
        panStart.x -= delta;
    }
}

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

        const isUSView = typeof mapViewMode !== 'undefined' && mapViewMode === 'us';
        if (isUSView && mapZoom <= 1) return;

        isPanning = true;
        panPointerId = e.pointerId;
        panMoved = false;
        panStartClient = { x: e.clientX, y: e.clientY };
        panStart = { x: e.clientX - mapPan.x, y: e.clientY - mapPan.y };

        try { container.setPointerCapture(panPointerId); } catch { }
        container.style.cursor = 'grabbing';
        if (wrapper) {
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

        const rawPanX = e.clientX - panStart.x;
        const rawPanY = e.clientY - panStart.y;
        mapPan.x = rawPanX;
        mapPan.y = rawPanY;

        const maxPanY = Math.max(0, (mapZoom - 1) * 200);
        if (mapZoom <= 1) {
            if (mapPan.y !== 0) {
                panStart.y -= (0 - mapPan.y);
                mapPan.y = 0;
            }
        } else {
            const clampedY = Math.max(-maxPanY, Math.min(maxPanY, mapPan.y));
            if (clampedY !== mapPan.y) {
                panStart.y -= (clampedY - mapPan.y);
                mapPan.y = clampedY;
            }
        }

        const isUSView = typeof mapViewMode !== 'undefined' && mapViewMode === 'us';
        if (!isUSView) {
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
            wrapper.style.transition = '';
            wrapper.style.willChange = '';
        }
        applyMapTransform();
    };

    container.addEventListener('pointerup', endPan);
    container.addEventListener('pointercancel', endPan);

    container.addEventListener('wheel', (e) => {
        e.preventDefault();
        if (e.deltaY < 0) {
            mapZoomIn();
        } else {
            mapZoomOut();
        }
    }, { passive: false });
}
