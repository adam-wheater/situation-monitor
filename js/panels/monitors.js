// Custom monitors panel

const MONITORS_STORAGE_KEY = 'situationMonitors';

function loadMonitors() {
    try {
        const saved = localStorage.getItem(MONITORS_STORAGE_KEY);
        return saved ? JSON.parse(saved) : [];
    } catch (e) {
        return [];
    }
}

function saveMonitors(monitors) {
    try {
        localStorage.setItem(MONITORS_STORAGE_KEY, JSON.stringify(monitors));
    } catch (e) { }
}

function renderMonitorsList() {
    const container = document.getElementById('monitorsList');
    if (!container) return;

    const monitors = loadMonitors();

    if (monitors.length === 0) {
        container.innerHTML = '<div class="monitors-list-empty">No monitors configured</div>';
        return;
    }

    container.innerHTML = monitors.map(m => `
        <div class="monitor-list-item">
            <div class="monitor-dot" style="background: ${m.color};"></div>
            <div class="monitor-details">
                <div class="monitor-name">${escapeHtml(m.name)}</div>
                <div class="monitor-keywords">${m.keywords.map(k => escapeHtml(k)).join(', ')}</div>
            </div>
            <div class="monitor-actions">
                <button onclick="editMonitor('${m.id}')" class="monitor-btn">Edit</button>
                <button onclick="deleteMonitor('${m.id}')" class="monitor-btn delete">Delete</button>
            </div>
        </div>
    `).join('');
}

// Color palette for monitors (duplicated from constants.js for module independence)
const MONITOR_COLOR_PALETTE = [
    '#00ff88', '#ff6600', '#00aaff', '#ff00ff', '#ffcc00',
    '#ff3366', '#33ccff', '#99ff33', '#ff6699', '#00ffcc'
];

let selectedMonitorColor = MONITOR_COLOR_PALETTE[0];

function initMonitorColorPicker() {
    const container = document.getElementById('monitorColors');
    if (!container) return;

    container.innerHTML = MONITOR_COLOR_PALETTE.map(color => `
        <div class="monitor-color-option ${color === selectedMonitorColor ? 'selected' : ''}"
             data-color="${color}"
             style="background: ${color};"
             onclick="selectMonitorColor('${color}')"></div>
    `).join('');
}

function selectMonitorColor(color) {
    selectedMonitorColor = color;
    const container = document.getElementById('monitorColors');
    if (!container) return;

    container.querySelectorAll('.monitor-color-option').forEach(swatch => {
        swatch.classList.toggle('selected', swatch.dataset.color === color);
    });
}

function openMonitorForm(editId = null) {
    const overlay = document.getElementById('monitorFormOverlay');
    const title = document.getElementById('monitorFormTitle');

    if (!overlay) return;

    // Reset form fields
    const nameInput = document.getElementById('monitorName');
    const keywordsInput = document.getElementById('monitorKeywords');
    const latInput = document.getElementById('monitorLat');
    const lonInput = document.getElementById('monitorLon');
    const editIdInput = document.getElementById('monitorEditId');

    if (nameInput) nameInput.value = '';
    if (keywordsInput) keywordsInput.value = '';
    if (latInput) latInput.value = '';
    if (lonInput) lonInput.value = '';
    if (editIdInput) editIdInput.value = '';

    // Initialize color picker
    initMonitorColorPicker();

    if (editId) {
        const monitors = loadMonitors();
        const monitor = monitors.find(m => m.id === editId);
        if (monitor) {
            if (title) title.textContent = 'Edit Monitor';
            if (editIdInput) editIdInput.value = editId;
            if (nameInput) nameInput.value = monitor.name;
            if (keywordsInput) keywordsInput.value = monitor.keywords.join(', ');
            if (latInput) latInput.value = monitor.lat || '';
            if (lonInput) lonInput.value = monitor.lon || '';
            selectMonitorColor(monitor.color || MONITOR_COLOR_PALETTE[0]);
        }
    } else {
        if (title) title.textContent = 'Add Monitor';
        const usedColors = loadMonitors().map(m => m.color);
        const nextColor = MONITOR_COLOR_PALETTE.find(c => !usedColors.includes(c)) || MONITOR_COLOR_PALETTE[0];
        selectMonitorColor(nextColor);
    }

    overlay.classList.add('open');
}

function closeMonitorForm() {
    const modal = document.getElementById('monitorFormOverlay');
    if (modal) modal.classList.remove('open');
}

function saveMonitor() {
    const name = document.getElementById('monitorName').value.trim();
    const keywordsStr = document.getElementById('monitorKeywords').value.trim();
    const lat = parseFloat(document.getElementById('monitorLat').value) || null;
    const lon = parseFloat(document.getElementById('monitorLon').value) || null;
    const color = selectedMonitorColor;
    const editId = document.getElementById('monitorEditId').value;

    if (!name || !keywordsStr) {
        alert('Please enter a name and at least one keyword');
        return;
    }

    const keywords = keywordsStr.split(',').map(k => k.trim().toLowerCase()).filter(k => k);

    const monitor = {
        id: editId || 'monitor_' + Date.now(),
        name,
        keywords,
        lat,
        lon,
        color,
        createdAt: new Date().toISOString()
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

    if (typeof refreshAll === 'function') {
        refreshAll();
    }
}

function editMonitor(id) {
    openMonitorForm(id);
}

function deleteMonitor(id) {
    if (!confirm('Delete this monitor?')) return;
    const monitors = loadMonitors().filter(m => m.id !== id);
    saveMonitors(monitors);
    renderMonitorsList();

    if (typeof refreshAll === 'function') {
        refreshAll();
    }
}

function scanMonitorsForMatches(allNews) {
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

function renderMonitorsPanel(allNews) {
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
        if (countEl) countEl.textContent = '-';
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
        if (countEl) countEl.textContent = '0';
        return;
    }

    if (countEl) countEl.textContent = allMatches.length;

    panel.innerHTML = allMatches.slice(0, 20).map(match => `
        <div class="monitor-match">
            <div class="monitor-match-header">
                <div class="monitor-match-dot" style="background: ${match.monitorColor};"></div>
                <span class="monitor-match-name">${escapeHtml(match.monitorName)}</span>
            </div>
            <a href="${match.link}" target="_blank" class="monitor-match-title">${escapeHtml(match.title)}</a>
            <div class="monitor-match-source">${escapeHtml(match.source || 'News')}</div>
        </div>
    `).join('');
}

function getMonitorHotspots(allNews) {
    const monitors = loadMonitors().filter(m => m.lat && m.lon);
    const results = scanMonitorsForMatches(allNews);

    return monitors.map(m => ({
        ...m,
        matchCount: results[m.id]?.count || 0,
        matches: results[m.id]?.matches || []
    }));
}

// Export functions to window for HTML onclick handlers
if (typeof window !== 'undefined') {
  window.openMonitorForm = openMonitorForm;
  window.closeMonitorForm = closeMonitorForm;
  window.saveMonitor = saveMonitor;
  window.selectMonitorColor = selectMonitorColor;
  window.renderMonitorsList = renderMonitorsList;
}
