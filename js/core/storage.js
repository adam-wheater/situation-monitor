// Storage utilities for localStorage operations

const STORAGE_KEYS = {
    PANELS: 'situationMonitorPanels',
    PANEL_ORDER: 'panelOrder',
    PANEL_SIZES: 'panelSizes',
    LIVESTREAM_URL: 'livestreamUrl',
    PENTAGON_TRACKER: 'pentagonTrackerSettings',
    BESTTIME_KEY: 'besttimeApiKeyPrivate',
    PROXY_ORIGIN: 'smProxyOrigin'
};

// Panel settings
function getPanelSettings() {
    try {
        const saved = localStorage.getItem(STORAGE_KEYS.PANELS);
        return saved ? JSON.parse(saved) : {};
    } catch (e) {
        return {};
    }
}

function savePanelSettings(settings) {
    try {
        localStorage.setItem(STORAGE_KEYS.PANELS, JSON.stringify(settings));
    } catch (e) { }
}

// Panel order
function getPanelOrder() {
    try {
        const saved = localStorage.getItem(STORAGE_KEYS.PANEL_ORDER);
        return saved ? JSON.parse(saved) : null;
    } catch (e) {
        return null;
    }
}

function savePanelOrder(order) {
    try {
        localStorage.setItem(STORAGE_KEYS.PANEL_ORDER, JSON.stringify(order));
    } catch (e) { }
}

function clearPanelOrder() {
    localStorage.removeItem(STORAGE_KEYS.PANEL_ORDER);
}

// Panel sizes
function getPanelSizes() {
    try {
        const saved = localStorage.getItem(STORAGE_KEYS.PANEL_SIZES);
        return saved ? JSON.parse(saved) : null;
    } catch (e) {
        return null;
    }
}

function savePanelSizes(sizes) {
    try {
        localStorage.setItem(STORAGE_KEYS.PANEL_SIZES, JSON.stringify(sizes));
    } catch (e) { }
}

// Livestream URL
function getLivestreamUrl() {
    return localStorage.getItem(STORAGE_KEYS.LIVESTREAM_URL) || 'https://www.youtube.com/watch?v=jWEZa9WEnIo';
}

function saveLivestreamUrl(url) {
    localStorage.setItem(STORAGE_KEYS.LIVESTREAM_URL, url);
}

// Proxy origin
function getProxyOrigin() {
    try {
        return localStorage.getItem(STORAGE_KEYS.PROXY_ORIGIN) || '';
    } catch (e) {
        return '';
    }
}

function saveProxyOrigin(origin) {
    try {
        if (origin) {
            localStorage.setItem(STORAGE_KEYS.PROXY_ORIGIN, origin);
        }
    } catch (e) { }
}

// Generic storage helpers
function getItem(key) {
    try {
        return localStorage.getItem(key);
    } catch (e) {
        return null;
    }
}

function setItem(key, value) {
    try {
        localStorage.setItem(key, value);
    } catch (e) { }
}

function removeItem(key) {
    try {
        localStorage.removeItem(key);
    } catch (e) { }
}
