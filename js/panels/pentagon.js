// Pentagon tracker panel

const PENTAGON_STORAGE_KEY = 'pentagonTrackerSettings';

function getPentagonTrackerSettings() {
    try {
        const saved = localStorage.getItem(PENTAGON_STORAGE_KEY);
        return saved ? JSON.parse(saved) : { apiKey: '', locations: [] };
    } catch (e) {
        return { apiKey: '', locations: [] };
    }
}

function savePentagonTrackerSettings(settings) {
    try {
        localStorage.setItem(PENTAGON_STORAGE_KEY, JSON.stringify(settings));
    } catch (e) { }
}

function initPentagonTrackerUI() {
    const settings = getPentagonTrackerSettings();

    // Set API key input
    const keyInput = document.getElementById('besttimeApiKey');
    if (keyInput) {
        keyInput.value = settings.apiKey || '';
    }

    // Render locations list
    renderPentagonLocations();
}

function saveBestTimePrivateKey() {
    const keyInput = document.getElementById('besttimeApiKey');
    if (!keyInput) return;

    const settings = getPentagonTrackerSettings();
    settings.apiKey = keyInput.value.trim();
    savePentagonTrackerSettings(settings);

    alert('API key saved');
}

function addPentagonLocationFromInputs() {
    const nameInput = document.getElementById('pentagonLocName');
    const venueIdInput = document.getElementById('pentagonLocVenueId');

    if (!nameInput || !venueIdInput) return;

    const name = nameInput.value.trim();
    const venueId = venueIdInput.value.trim();

    if (!name || !venueId) {
        alert('Please enter both a name and venue ID');
        return;
    }

    const settings = getPentagonTrackerSettings();
    settings.locations = settings.locations || [];

    settings.locations.push({
        id: 'loc_' + Date.now(),
        name,
        venueId
    });

    savePentagonTrackerSettings(settings);

    nameInput.value = '';
    venueIdInput.value = '';

    renderPentagonLocations();

    if (typeof refreshAll === 'function') {
        refreshAll();
    }
}

function removePentagonLocation(locId) {
    const settings = getPentagonTrackerSettings();
    settings.locations = (settings.locations || []).filter(l => l.id !== locId);
    savePentagonTrackerSettings(settings);
    renderPentagonLocations();

    if (typeof refreshAll === 'function') {
        refreshAll();
    }
}

function renderPentagonLocations() {
    const container = document.getElementById('pentagonLocationsList');
    if (!container) return;

    const settings = getPentagonTrackerSettings();
    const locations = settings.locations || [];

    if (locations.length === 0) {
        container.innerHTML = '<div class="pentagon-empty">No locations configured</div>';
        return;
    }

    container.innerHTML = locations.map(loc => `
        <div class="pentagon-location-item">
            <div class="pentagon-location-info">
                <span class="pentagon-location-name">${escapeHtml(loc.name)}</span>
                <span class="pentagon-location-id">${escapeHtml(loc.venueId)}</span>
            </div>
            <button onclick="removePentagonLocation('${loc.id}')" class="pentagon-remove-btn">Remove</button>
        </div>
    `).join('');
}

async function fetchPentagonTracker() {
    const settings = getPentagonTrackerSettings();
    const apiKey = settings.apiKey;
    const locations = settings.locations || [];

    if (!apiKey || locations.length === 0) {
        return { locations: [], error: !apiKey ? 'No API key configured' : 'No locations configured' };
    }

    const results = await Promise.all(locations.map(async loc => {
        try {
            const url = `https://besttime.app/api/v1/forecasts/live?api_key_private=${apiKey}&venue_id=${loc.venueId}`;
            const response = await fetch(url);
            const data = await response.json();

            if (data.status === 'OK' && data.analysis) {
                return {
                    ...loc,
                    busyness: data.analysis.venue_live_busyness || 0,
                    busynessText: getBestTimeVenueBusyText(data.analysis.venue_live_busyness),
                    isOpen: data.analysis.venue_live_closed === false,
                    lastUpdated: new Date().toISOString()
                };
            }

            return { ...loc, error: 'Unable to fetch data' };
        } catch (e) {
            return { ...loc, error: e.message };
        }
    }));

    return { locations: results };
}

function getBestTimeVenueBusyText(busyness) {
    if (busyness === null || busyness === undefined) return 'Unknown';
    if (busyness <= 20) return 'Very Quiet';
    if (busyness <= 40) return 'Quiet';
    if (busyness <= 60) return 'Moderate';
    if (busyness <= 80) return 'Busy';
    return 'Very Busy';
}

function renderPentagonTracker(data) {
    const panel = document.getElementById('pentagonPanel');
    const count = document.getElementById('pentagonCount');

    if (!panel) return;

    if (data.error) {
        panel.innerHTML = `<div class="error-msg">${escapeHtml(data.error)}</div>`;
        if (count) count.textContent = '-';
        return;
    }

    const locations = data.locations || [];

    if (locations.length === 0) {
        panel.innerHTML = '<div class="loading-msg">No locations configured. Go to Settings to add locations.</div>';
        if (count) count.textContent = '-';
        return;
    }

    if (count) count.textContent = locations.length;

    panel.innerHTML = locations.map(loc => {
        if (loc.error) {
            return `
                <div class="pentagon-item error">
                    <div class="pentagon-name">${escapeHtml(loc.name)}</div>
                    <div class="pentagon-error">${escapeHtml(loc.error)}</div>
                </div>
            `;
        }

        const busynessClass = loc.busyness > 60 ? 'high' : loc.busyness > 30 ? 'medium' : 'low';

        return `
            <div class="pentagon-item">
                <div class="pentagon-header">
                    <span class="pentagon-name">${escapeHtml(loc.name)}</span>
                    <span class="pentagon-status ${loc.isOpen ? 'open' : 'closed'}">${loc.isOpen ? 'OPEN' : 'CLOSED'}</span>
                </div>
                <div class="pentagon-busyness ${busynessClass}">
                    <div class="pentagon-bar">
                        <div class="pentagon-fill" style="width: ${loc.busyness}%"></div>
                    </div>
                    <span class="pentagon-text">${loc.busynessText} (${loc.busyness}%)</span>
                </div>
            </div>
        `;
    }).join('');
}
