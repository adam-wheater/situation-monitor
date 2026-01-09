// panels.js - Panel management, settings, drag/drop, resize

import { PANELS, NON_DRAGGABLE_PANELS } from './constants.js';

// Drag state
let draggedPanel = null;

// Resize state
let resizingPanel = null;
let resizeStart = { x: 0, y: 0, width: 0, height: 0 };
let resizeDirection = null;

// Load panel visibility from localStorage
export function getPanelSettings() {
    try {
        const saved = localStorage.getItem('situationMonitorPanels');
        return saved ? JSON.parse(saved) : {};
    } catch (e) {
        return {};
    }
}

// Save panel visibility to localStorage
export function savePanelSettings(settings) {
    try {
        localStorage.setItem('situationMonitorPanels', JSON.stringify(settings));
    } catch (e) {}
}

// Check if panel is enabled
export function isPanelEnabled(panelId) {
    const settings = getPanelSettings();
    return settings[panelId] !== false;
}

// Toggle panel visibility
export function togglePanel(panelId, refreshCallback) {
    const settings = getPanelSettings();
    settings[panelId] = !isPanelEnabled(panelId);
    savePanelSettings(settings);
    applyPanelSettings();
    updateSettingsUI();
    if (refreshCallback) refreshCallback();
}

// Apply panel settings to DOM
export function applyPanelSettings() {
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
export function toggleSettings(renderMonitorsList) {
    const modal = document.getElementById('settingsModal');
    if (!modal) return;
    modal.classList.toggle('open');
    if (modal.classList.contains('open')) {
        updateSettingsUI();
        if (renderMonitorsList) renderMonitorsList();
    }
}

// Update settings UI
export function updateSettingsUI() {
    const container = document.getElementById('panelToggles');
    if (!container) return;

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

// Initialize drag and drop
function initDragAndDrop() {
    const dashboard = document.querySelector('.dashboard');
    if (!dashboard) return;

    dashboard.querySelectorAll('.panel').forEach(panel => {
        const panelId = panel.dataset.panel;
        const isDraggable = !NON_DRAGGABLE_PANELS.includes(panelId);
        panel.setAttribute('draggable', isDraggable ? 'true' : 'false');

        if (!isDraggable) return;

        panel.addEventListener('dragstart', (e) => {
            draggedPanel = panel;
            panel.classList.add('dragging');
            e.dataTransfer.effectAllowed = 'move';
        });

        panel.addEventListener('dragend', () => {
            panel.classList.remove('dragging');
            document.querySelectorAll('.drag-over').forEach(p => p.classList.remove('drag-over'));
            draggedPanel = null;
            savePanelOrder();
        });

        panel.addEventListener('dragover', (e) => {
            e.preventDefault();
            if (draggedPanel && draggedPanel !== panel) panel.classList.add('drag-over');
        });

        panel.addEventListener('dragleave', () => panel.classList.remove('drag-over'));

        panel.addEventListener('drop', (e) => {
            e.preventDefault();
            panel.classList.remove('drag-over');
            if (draggedPanel && draggedPanel !== panel) {
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

// Save/restore panel order
function savePanelOrder() {
    const dashboard = document.querySelector('.dashboard');
    if (!dashboard) return;
    const order = [...dashboard.querySelectorAll('.panel')].map(p => p.dataset.panel);
    localStorage.setItem('panelOrder', JSON.stringify(order));
}

function restorePanelOrder() {
    const saved = localStorage.getItem('panelOrder');
    if (!saved) return;
    try {
        const order = JSON.parse(saved);
        const dashboard = document.querySelector('.dashboard');
        if (!dashboard) return;
        const panels = [...dashboard.querySelectorAll('.panel')];
        order.forEach(panelId => {
            if (NON_DRAGGABLE_PANELS.includes(panelId)) return;
            const panel = panels.find(p => p.dataset.panel === panelId);
            if (panel) dashboard.appendChild(panel);
        });
    } catch (e) {}
}

export function resetPanelOrder() {
    localStorage.removeItem('panelOrder');
    location.reload();
}

// Panel resize
function initPanelResize() {
    document.querySelectorAll('.panel').forEach(panel => {
        if (panel.querySelector('.panel-resize-handle')) return;

        const handle = document.createElement('div');
        handle.className = 'panel-resize-handle corner';
        handle.addEventListener('mousedown', (e) => {
            e.preventDefault();
            resizingPanel = panel;
            resizeStart = { x: e.clientX, y: e.clientY, width: panel.offsetWidth, height: panel.offsetHeight };
            panel.classList.add('resizing');
        });
        panel.appendChild(handle);
    });

    document.addEventListener('mousemove', (e) => {
        if (!resizingPanel) return;
        const newWidth = Math.max(200, resizeStart.width + (e.clientX - resizeStart.x));
        const newHeight = Math.max(150, resizeStart.height + (e.clientY - resizeStart.y));
        resizingPanel.style.width = newWidth + 'px';
        resizingPanel.style.minHeight = newHeight + 'px';
    });

    document.addEventListener('mouseup', () => {
        if (resizingPanel) {
            resizingPanel.classList.remove('resizing');
            savePanelSizes();
            resizingPanel = null;
        }
    });
}

function savePanelSizes() {
    const sizes = {};
    document.querySelectorAll('.panel').forEach(panel => {
        const name = panel.dataset.panel;
        if (name && (panel.style.minHeight || panel.style.width)) {
            sizes[name] = { height: panel.style.minHeight, width: panel.style.width };
        }
    });
    localStorage.setItem('panelSizes', JSON.stringify(sizes));
}

function restorePanelSizes() {
    const saved = localStorage.getItem('panelSizes');
    if (!saved) return;
    try {
        const sizes = JSON.parse(saved);
        Object.entries(sizes).forEach(([name, dims]) => {
            const panel = document.querySelector(`.panel[data-panel="${name}"]`);
            if (panel) {
                if (dims.height) panel.style.minHeight = dims.height;
                if (dims.width) panel.style.width = dims.width;
            }
        });
    } catch (e) {}
}

// Initialize all panel functionality
export function initPanels() {
    applyPanelSettings();
    restorePanelOrder();
    restorePanelSizes();
    initDragAndDrop();
    initPanelResize();
}
