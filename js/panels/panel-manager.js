// Panel management - visibility, drag & drop, resize

// Non-draggable panels
const NON_DRAGGABLE = ['map', 'tbpn'];

// Panel visibility
function isPanelEnabled(panelId) {
    const settings = getPanelSettings();
    return settings[panelId] !== false;
}

function togglePanel(panelId) {
    const settings = getPanelSettings();
    settings[panelId] = !isPanelEnabled(panelId);
    savePanelSettings(settings);
    applyPanelSettings();
    updateSettingsUI();
}

function applyPanelSettings() {
    document.querySelectorAll('.panel[data-panel]').forEach(panel => {
        const id = panel.dataset.panel;
        panel.style.display = isPanelEnabled(id) ? '' : 'none';
    });
}

function updateSettingsUI() {
    // Generate panel toggles if they don't exist
    const container = document.getElementById('panelToggles');
    if (container && container.children.length === 0) {
        const panelConfigs = Object.entries(PANELS);
        container.innerHTML = panelConfigs.map(([id, config]) => `
            <div class="panel-toggle ${isPanelEnabled(id) ? 'active' : ''}" data-panel="${id}" onclick="togglePanel('${id}')">
                <span class="toggle-indicator"></span>
                <span class="toggle-name">${config.name}</span>
            </div>
        `).join('');
    }

    // Update toggle states
    document.querySelectorAll('.panel-toggle').forEach(toggle => {
        const panelId = toggle.dataset.panel;
        toggle.classList.toggle('active', isPanelEnabled(panelId));
    });
}

// Drag and drop
let draggedPanel = null;

function initDragAndDrop() {
    const dashboard = document.querySelector('.dashboard');
    if (!dashboard) return;

    document.querySelectorAll('.panel[data-panel]').forEach(panel => {
        const panelId = panel.dataset.panel;

        if (NON_DRAGGABLE.includes(panelId)) {
            panel.draggable = false;
            return;
        }

        panel.draggable = true;

        panel.addEventListener('dragstart', (e) => {
            draggedPanel = panel;
            panel.classList.add('dragging');
            e.dataTransfer.effectAllowed = 'move';
            e.dataTransfer.setData('text/plain', panelId);
        });

        panel.addEventListener('dragend', () => {
            panel.classList.remove('dragging');
            draggedPanel = null;
            document.querySelectorAll('.panel.drag-over').forEach(p => p.classList.remove('drag-over'));
            savePanelOrder();
        });

        panel.addEventListener('dragover', (e) => {
            e.preventDefault();
            if (!draggedPanel || draggedPanel === panel) return;
            if (NON_DRAGGABLE.includes(panel.dataset.panel)) return;
            panel.classList.add('drag-over');
        });

        panel.addEventListener('dragleave', () => {
            panel.classList.remove('drag-over');
        });

        panel.addEventListener('drop', (e) => {
            e.preventDefault();
            panel.classList.remove('drag-over');

            if (!draggedPanel || draggedPanel === panel) return;
            if (NON_DRAGGABLE.includes(panel.dataset.panel)) return;

            const allPanels = [...dashboard.querySelectorAll('.panel:not([data-panel="map"]):not([data-panel="tbpn"])')];
            const draggedIndex = allPanels.indexOf(draggedPanel);
            const targetIndex = allPanels.indexOf(panel);

            if (draggedIndex < targetIndex) {
                panel.parentNode.insertBefore(draggedPanel, panel.nextSibling);
            } else {
                panel.parentNode.insertBefore(draggedPanel, panel);
            }
        });
    });
}

function savePanelOrder() {
    const dashboard = document.querySelector('.dashboard');
    if (!dashboard) return;

    const order = [...dashboard.querySelectorAll('.panel[data-panel]')]
        .map(p => p.dataset.panel);

    try {
        localStorage.setItem('panelOrder', JSON.stringify(order));
    } catch (e) { }
}

function restorePanelOrder() {
    try {
        const order = JSON.parse(localStorage.getItem('panelOrder'));
        if (!order || !Array.isArray(order)) return;

        const dashboard = document.querySelector('.dashboard');
        if (!dashboard) return;

        const panels = {};
        dashboard.querySelectorAll('.panel[data-panel]').forEach(p => {
            panels[p.dataset.panel] = p;
        });

        order.forEach(panelId => {
            if (panels[panelId]) {
                dashboard.appendChild(panels[panelId]);
            }
        });
    } catch (e) { }
}

function resetPanelOrder() {
    localStorage.removeItem('panelOrder');
    location.reload();
}

// Panel resize
let resizingPanel = null;
let resizeStartX = 0;
let resizeStartWidth = 0;

function initPanelResize() {
    document.querySelectorAll('.panel[data-panel]').forEach(panel => {
        const resizeHandle = document.createElement('div');
        resizeHandle.className = 'panel-resize-handle';
        panel.appendChild(resizeHandle);

        resizeHandle.addEventListener('mousedown', (e) => {
            e.preventDefault();
            resizingPanel = panel;
            resizeStartX = e.clientX;
            resizeStartWidth = panel.offsetWidth;
            document.body.style.cursor = 'ew-resize';
            document.body.style.userSelect = 'none';
        });
    });

    document.addEventListener('mousemove', (e) => {
        if (!resizingPanel) return;

        const deltaX = e.clientX - resizeStartX;
        const newWidth = Math.max(280, Math.min(800, resizeStartWidth + deltaX));
        resizingPanel.style.width = newWidth + 'px';
    });

    document.addEventListener('mouseup', () => {
        if (resizingPanel) {
            savePanelSizes();
            resizingPanel = null;
            document.body.style.cursor = '';
            document.body.style.userSelect = '';
        }
    });
}

function savePanelSizes() {
    const sizes = {};
    document.querySelectorAll('.panel[data-panel]').forEach(panel => {
        const width = panel.offsetWidth;
        if (width) {
            sizes[panel.dataset.panel] = width;
        }
    });

    try {
        localStorage.setItem('panelSizes', JSON.stringify(sizes));
    } catch (e) { }
}

function restorePanelSizes() {
    const sizes = getPanelSizes();
    if (!sizes) return;

    Object.entries(sizes).forEach(([panelId, width]) => {
        const panel = document.querySelector(`.panel[data-panel="${panelId}"]`);
        if (panel && width) {
            panel.style.width = width + 'px';
        }
    });
}
