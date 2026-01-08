// monitors.js - Custom monitor CRUD and keyword scanning

import { MONITOR_COLORS } from './constants.js';

// Load monitors from localStorage
export function loadMonitors() {
    try {
        const data = localStorage.getItem('customMonitors');
        return data ? JSON.parse(data) : [];
    } catch (e) {
        console.error('Failed to load monitors:', e);
        return [];
    }
}

// Save monitors to localStorage
export function saveMonitors(monitors) {
    try {
        localStorage.setItem('customMonitors', JSON.stringify(monitors));
    } catch (e) {
        console.error('Failed to save monitors:', e);
    }
}

// Render monitors list in settings
export function renderMonitorsList() {
    const monitors = loadMonitors();
    const container = document.getElementById('monitorsList');
    if (!container) return;

    if (monitors.length === 0) {
        container.innerHTML = '<div style="font-size: 0.6rem; color: var(--text-dim); padding: 0.5rem 0;">No monitors yet</div>';
        return;
    }

    container.innerHTML = monitors.map(m => `
        <div class="monitor-item">
            <div class="monitor-item-info">
                <div class="monitor-item-name">
                    <div class="monitor-item-color" style="background: ${m.color};"></div>
                    ${m.name}
                </div>
                <div class="monitor-item-keywords">${m.keywords.join(', ')}</div>
                ${m.lat && m.lon ? `<div class="monitor-item-location">📍 ${m.lat.toFixed(2)}, ${m.lon.toFixed(2)}</div>` : ''}
            </div>
            <div class="monitor-item-actions">
                <button class="monitor-item-btn" onclick="editMonitor('${m.id}')" title="Edit">✎</button>
                <button class="monitor-item-btn delete" onclick="deleteMonitor('${m.id}')" title="Delete">✕</button>
            </div>
        </div>
    `).join('');
}

// Open monitor form (for add or edit)
export function openMonitorForm(monitorId = null) {
    const overlay = document.getElementById('monitorFormOverlay');
    const titleEl = document.getElementById('monitorFormTitle');
    const editIdEl = document.getElementById('monitorEditId');
    const nameEl = document.getElementById('monitorName');
    const keywordsEl = document.getElementById('monitorKeywords');
    const latEl = document.getElementById('monitorLat');
    const lonEl = document.getElementById('monitorLon');
    const colorsContainer = document.getElementById('monitorColors');

    // Render color options
    colorsContainer.innerHTML = MONITOR_COLORS.map((c, i) =>
        `<div class="monitor-color-option" style="background: ${c};" data-color="${c}" onclick="selectMonitorColor('${c}')"></div>`
    ).join('');

    if (monitorId) {
        // Edit mode
        const monitors = loadMonitors();
        const monitor = monitors.find(m => m.id === monitorId);
        if (monitor) {
            titleEl.textContent = 'Edit Monitor';
            editIdEl.value = monitorId;
            nameEl.value = monitor.name;
            keywordsEl.value = monitor.keywords.join(', ');
            latEl.value = monitor.lat || '';
            lonEl.value = monitor.lon || '';
            selectMonitorColor(monitor.color);
        }
    } else {
        // Add mode
        titleEl.textContent = 'Add Monitor';
        editIdEl.value = '';
        nameEl.value = '';
        keywordsEl.value = '';
        latEl.value = '';
        lonEl.value = '';
        selectMonitorColor(MONITOR_COLORS[0]);
    }

    overlay.classList.add('open');
}

// Close monitor form
export function closeMonitorForm() {
    document.getElementById('monitorFormOverlay').classList.remove('open');
}

// Select a monitor color
export function selectMonitorColor(color) {
    document.querySelectorAll('.monitor-color-option').forEach(el => {
        el.classList.toggle('selected', el.dataset.color === color);
    });
}

// Get currently selected color
export function getSelectedMonitorColor() {
    const selected = document.querySelector('.monitor-color-option.selected');
    return selected ? selected.dataset.color : MONITOR_COLORS[0];
}

// Save monitor (add or update)
export function saveMonitor(refreshCallback) {
    const editId = document.getElementById('monitorEditId').value;
    const name = document.getElementById('monitorName').value.trim();
    const keywordsRaw = document.getElementById('monitorKeywords').value.trim();
    const lat = parseFloat(document.getElementById('monitorLat').value);
    const lon = parseFloat(document.getElementById('monitorLon').value);
    const color = getSelectedMonitorColor();

    if (!name) {
        alert('Please enter a name');
        return;
    }
    if (!keywordsRaw) {
        alert('Please enter at least one keyword');
        return;
    }

    const keywords = keywordsRaw.split(',').map(k => k.trim().toLowerCase()).filter(k => k);

    const monitor = {
        id: editId || `monitor_${Date.now()}`,
        name,
        keywords,
        color,
        lat: isNaN(lat) ? null : lat,
        lon: isNaN(lon) ? null : lon,
        createdAt: editId ? undefined : new Date().toISOString()
    };

    const monitors = loadMonitors();
    if (editId) {
        const idx = monitors.findIndex(m => m.id === editId);
        if (idx !== -1) {
            monitor.createdAt = monitors[idx].createdAt;
            monitors[idx] = monitor;
        }
    } else {
        monitors.push(monitor);
    }

    saveMonitors(monitors);
    closeMonitorForm();
    renderMonitorsList();
    if (refreshCallback) {
        refreshCallback();
    }
}

// Edit a monitor
export function editMonitor(id) {
    openMonitorForm(id);
}

// Delete a monitor
export function deleteMonitor(id, refreshCallback) {
    if (!confirm('Delete this monitor?')) return;
    const monitors = loadMonitors().filter(m => m.id !== id);
    saveMonitors(monitors);
    renderMonitorsList();
    if (refreshCallback) {
        refreshCallback();
    }
}

// Scan news for monitor matches
export function scanMonitorsForMatches(allNews) {
    const monitors = loadMonitors();
    const results = {};

    monitors.forEach(monitor => {
        const matches = [];
        allNews.forEach(item => {
            const title = (item.title || '').toLowerCase();
            const matched = monitor.keywords.some(kw => title.includes(kw));
            if (matched) {
                matches.push({
                    title: item.title,
                    link: item.link,
                    source: item.source,
                    monitorId: monitor.id,
                    monitorName: monitor.name,
                    monitorColor: monitor.color
                });
            }
        });
        results[monitor.id] = {
            monitor,
            matches: matches.slice(0, 10),
            count: matches.length
        };
    });

    return results;
}

// Render the My Monitors panel
export function renderMonitorsPanel(allNews) {
    const panel = document.getElementById('monitorsPanel');
    const countEl = document.getElementById('monitorsCount');
    if (!panel) return;

    const monitors = loadMonitors();
    if (monitors.length === 0) {
        panel.innerHTML = `
            <div class="monitors-empty">
                No monitors configured
                <div class="monitors-empty-hint">Click Settings → Add Monitor to get started</div>
            </div>
        `;
        countEl.textContent = '-';
        return;
    }

    const results = scanMonitorsForMatches(allNews);
    let allMatches = [];

    Object.values(results).forEach(r => {
        allMatches = allMatches.concat(r.matches);
    });

    if (allMatches.length === 0) {
        panel.innerHTML = `
            <div class="monitors-empty">
                No matches found
                <div class="monitors-empty-hint">Your ${monitors.length} monitor(s) found no matching headlines</div>
            </div>
        `;
        countEl.textContent = '0';
        return;
    }

    countEl.textContent = allMatches.length;
    panel.innerHTML = allMatches.slice(0, 20).map(match => `
        <div class="monitor-match">
            <div class="monitor-match-header">
                <div class="monitor-match-dot" style="background: ${match.monitorColor};"></div>
                <span class="monitor-match-name">${match.monitorName}</span>
            </div>
            <a href="${match.link}" target="_blank" class="monitor-match-title">${match.title}</a>
            <div class="monitor-match-source">${match.source || 'News'}</div>
        </div>
    `).join('');
}

// Get monitor data for map hotspots
export function getMonitorHotspots(allNews) {
    const monitors = loadMonitors().filter(m => m.lat && m.lon);
    const results = scanMonitorsForMatches(allNews);

    return monitors.map(m => ({
        ...m,
        matchCount: results[m.id]?.count || 0,
        matches: results[m.id]?.matches || []
    }));
}
