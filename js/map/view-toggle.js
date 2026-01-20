// Map View Toggle - Switch between 2D (D3) and 3D (Globe.gl) views

let currentMapViewMode = '2D'; // '2D' or '3D'
let globeInstance3D = null;
let globeInitialized = false;

// Get saved preference
function getSavedMapViewMode() {
    try {
        return localStorage.getItem('mapViewMode') || '2D';
    } catch (e) {
        return '2D';
    }
}

// Save preference
function saveMapViewMode(mode) {
    try {
        localStorage.setItem('mapViewMode', mode);
    } catch (e) {}
}

// Toggle between 2D and 3D views
function toggleMapViewMode() {
    currentMapViewMode = currentMapViewMode === '2D' ? '3D' : '2D';
    saveMapViewMode(currentMapViewMode);
    applyMapViewMode();
}

// Apply the current view mode
function applyMapViewMode() {
    const svgEl = document.getElementById('mapSvg');
    const globeEl = document.getElementById('globeContainer');
    const toggleBtn = document.getElementById('mapViewToggle');

    if (!svgEl || !globeEl) return;

    if (currentMapViewMode === '3D') {
        // Switch to 3D Globe
        svgEl.style.display = 'none';
        globeEl.style.display = 'block';
        if (toggleBtn) toggleBtn.textContent = '3D';

        // Initialize globe if not already done
        if (!globeInitialized) {
            initGlobe3D();
        } else if (globeInstance3D) {
            // Resize globe to container
            const container = document.getElementById('mapPanel');
            if (container) {
                globeInstance3D.width(container.offsetWidth);
                globeInstance3D.height(container.offsetHeight);
            }
        }
    } else {
        // Switch to 2D SVG
        svgEl.style.display = 'block';
        globeEl.style.display = 'none';
        if (toggleBtn) toggleBtn.textContent = '2D';
    }
}

// Initialize the 3D globe using globe.gl
function initGlobe3D() {
    const globeEl = document.getElementById('globeContainer');
    const container = document.getElementById('mapPanel');

    if (!globeEl || !container || typeof Globe === 'undefined') {
        console.warn('Globe.gl not available or container not found');
        return;
    }

    const width = container.offsetWidth || 800;
    const height = container.offsetHeight || 550;

    // Create globe instance
    globeInstance3D = Globe()
        .width(width)
        .height(height)
        .backgroundColor('#020a08')
        .showAtmosphere(true)
        .atmosphereColor('#0a4030')
        .atmosphereAltitude(0.12)
        .showGraticules(true)
        .globeImageUrl('//unpkg.com/three-globe/example/img/earth-blue-marble.jpg')
        .bumpImageUrl('//unpkg.com/three-globe/example/img/earth-topology.png');

    // Mount to container
    globeInstance3D(globeEl);

    // Load countries data for polygons
    fetch('https://unpkg.com/world-atlas@2/countries-110m.json')
        .then(res => res.json())
        .then(data => {
            const countries = topojson.feature(data, data.objects.countries).features;
            globeInstance3D
                .polygonsData(countries)
                .polygonCapColor(() => 'rgba(10, 40, 30, 0.8)')
                .polygonSideColor(() => 'rgba(0, 80, 60, 0.3)')
                .polygonStrokeColor(() => '#00ff88')
                .polygonAltitude(0.006);
        })
        .catch(err => console.warn('Failed to load country data:', err));

    // Add conflict zones as points
    if (typeof CONFLICT_ZONES !== 'undefined') {
        const conflictPoints = CONFLICT_ZONES.map(zone => ({
            lat: zone.lat,
            lng: zone.lon,
            size: 0.3,
            color: zone.intensity === 'high' ? '#ff4444' :
                   zone.intensity === 'medium' ? '#ffcc00' : '#ff8800',
            name: zone.name
        }));

        globeInstance3D
            .pointsData(conflictPoints)
            .pointLat('lat')
            .pointLng('lng')
            .pointColor('color')
            .pointRadius('size')
            .pointAltitude(0.01);
    }

    // Add hotspots as labels
    if (typeof INTEL_HOTSPOTS !== 'undefined') {
        const labels = INTEL_HOTSPOTS.map(spot => ({
            lat: spot.lat,
            lng: spot.lon,
            text: spot.name,
            color: '#00ff88',
            size: 0.8
        }));

        globeInstance3D
            .labelsData(labels)
            .labelLat('lat')
            .labelLng('lng')
            .labelText('text')
            .labelColor('color')
            .labelSize('size')
            .labelDotRadius(0.3)
            .labelAltitude(0.01);
    }

    // Set initial view
    globeInstance3D.pointOfView({ lat: 20, lng: 0, altitude: 2.0 }, 0);

    // Add controls info
    globeInstance3D.controls().autoRotate = false;
    globeInstance3D.controls().enableZoom = true;

    globeInitialized = true;
    console.log('[Globe] 3D view initialized');
}

// Initialize on load - apply saved preference
function initMapViewToggle() {
    currentMapViewMode = getSavedMapViewMode();
    const toggleBtn = document.getElementById('mapViewToggle');
    if (toggleBtn) {
        toggleBtn.textContent = currentMapViewMode;
    }

    // If saved preference is 3D, apply it after a short delay to ensure DOM is ready
    if (currentMapViewMode === '3D') {
        setTimeout(applyMapViewMode, 500);
    }
}

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initMapViewToggle);
} else {
    // Small delay to ensure other modules are loaded
    setTimeout(initMapViewToggle, 100);
}

// Export functions to window for HTML onclick handlers
if (typeof window !== 'undefined') {
    window.toggleMapViewMode = toggleMapViewMode;
}
