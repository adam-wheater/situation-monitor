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

function openMonitorForm(editId = null) {
    const modal = document.getElementById('monitorFormModal');
    const form = document.getElementById('monitorForm');
    const title = document.getElementById('monitorFormTitle');

    if (!modal || !form) return;

    form.reset();
    document.getElementById('monitorEditId').value = '';

    if (editId) {
        const monitors = loadMonitors();
        const monitor = monitors.find(m => m.id === editId);
        if (monitor) {
            title.textContent = 'Edit Monitor';
            document.getElementById('monitorEditId').value = editId;
            document.getElementById('monitorName').value = monitor.name;
            document.getElementById('monitorKeywords').value = monitor.keywords.join(', ');
            document.getElementById('monitorLat').value = monitor.lat || '';
            document.getElementById('monitorLon').value = monitor.lon || '';
            document.getElementById('monitorColor').value = monitor.color || MONITOR_COLORS[0];
        }
    } else {
        title.textContent = 'Add Monitor';
        const usedColors = loadMonitors().map(m => m.color);
        const nextColor = MONITOR_COLORS.find(c => !usedColors.includes(c)) || MONITOR_COLORS[0];
        document.getElementById('monitorColor').value = nextColor;
    }

    modal.classList.add('visible');
}

function closeMonitorForm() {
    const modal = document.getElementById('monitorFormModal');
    if (modal) modal.classList.remove('visible');
}

function saveMonitor() {
    const name = document.getElementById('monitorName').value.trim();
    const keywordsStr = document.getElementById('monitorKeywords').value.trim();
    const lat = parseFloat(document.getElementById('monitorLat').value) || null;
    const lon = parseFloat(document.getElementById('monitorLon').value) || null;
    const color = document.getElementById('monitorColor').value;
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
