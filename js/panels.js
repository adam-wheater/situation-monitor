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
    return settings[panelId] !== false; // Default to enabled
}

// Toggle panel visibility
export function togglePanel(panelId, refreshCallback) {
    const settings = getPanelSettings();
    settings[panelId] = !isPanelEnabled(panelId);
    savePanelSettings(settings);
    applyPanelSettings();
    updateSettingsUI();
    if (refreshCallback) {
        refreshCallback();
    }
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
    modal.classList.toggle('open');
    if (modal.classList.contains('open')) {
        updateSettingsUI();
        if (renderMonitorsList) {
            renderMonitorsList();
        }
        // Load saved livestream URL
        const savedUrl = localStorage.getItem('livestreamUrl') || 'https://www.youtube.com/watch?v=jWEZa9WEnIo';
        const urlInput = document.getElementById('livestreamUrl');
        if (urlInput) {
            urlInput.value = savedUrl;
        }
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

// Extract YouTube video ID from various URL formats
export function extractYouTubeId(url) {
    if (!url) return null;
    const patterns = [
        /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/live\/)([^&\?\/]+)/,
        /^([a-zA-Z0-9_-]{11})$/
    ];
    for (const pattern of patterns) {
        const match = url.match(pattern);
        if (match) return match[1];
    }
    return null;
}

// Save livestream URL
export function saveLivestreamUrl() {
    const input = document.getElementById('livestreamUrl');
    const url = input.value.trim();
    localStorage.setItem('livestreamUrl', url);
    updateLivestreamEmbed();
}

// Update the livestream embed
export function updateLivestreamEmbed() {
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

// Get current livestream embed URL
export function getLivestreamEmbedUrl() {
    const url = localStorage.getItem('livestreamUrl') || 'https://www.youtube.com/watch?v=jWEZa9WEnIo';
    const videoId = extractYouTubeId(url);
    return videoId ? `https://www.youtube.com/embed/${videoId}?autoplay=0&mute=1` : '';
}

// Initialize drag and drop
export function initDragAndDrop() {
    const dashboard = document.querySelector('.dashboard');
    if (!dashboard) return;

    const panels = dashboard.querySelectorAll('.panel');

    panels.forEach(panel => {
        const panelId = panel.dataset.panel;
        const isDraggable = !NON_DRAGGABLE_PANELS.includes(panelId);

        panel.setAttribute('draggable', isDraggable ? 'true' : 'false');

        if (!isDraggable) {
            panel.style.cursor = 'default';
            const header = panel.querySelector('.panel-header');
            if (header) header.style.cursor = 'default';
            return;
        }

        panel.addEventListener('dragstart', (e) => {
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
export function savePanelOrder() {
    const dashboard = document.querySelector('.dashboard');
    if (!dashboard) return;

    const panels = dashboard.querySelectorAll('.panel');
    const order = [...panels].map(p => p.dataset.panel);
    localStorage.setItem('panelOrder', JSON.stringify(order));
}

// Restore panel order from localStorage
export function restorePanelOrder() {
    const savedOrder = localStorage.getItem('panelOrder');
    if (!savedOrder) return;

    try {
        const order = JSON.parse(savedOrder);
        const dashboard = document.querySelector('.dashboard');
        if (!dashboard) return;

        const panels = [...dashboard.querySelectorAll('.panel')];

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
export function resetPanelOrder() {
    localStorage.removeItem('panelOrder');
    location.reload();
}

// Initialize panel resize
export function initPanelResize() {
    document.querySelectorAll('.panel').forEach(panel => {
        if (panel.querySelector('.panel-resize-handle')) return;

        // Corner handle
        const cornerHandle = document.createElement('div');
        cornerHandle.className = 'panel-resize-handle corner';
        cornerHandle.addEventListener('mousedown', (e) => startResize(e, panel, 'corner'));
        panel.appendChild(cornerHandle);

        // Bottom edge handle
        const bottomHandle = document.createElement('div');
        bottomHandle.className = 'panel-resize-handle bottom';
        bottomHandle.addEventListener('mousedown', (e) => startResize(e, panel, 'bottom'));
        panel.appendChild(bottomHandle);

        // Right edge handle
        const rightHandle = document.createElement('div');
        rightHandle.className = 'panel-resize-handle right';
        rightHandle.addEventListener('mousedown', (e) => startResize(e, panel, 'right'));
        panel.appendChild(rightHandle);
    });

    // Global mouse events for resize
    document.addEventListener('mousemove', handleResizeMove);
    document.addEventListener('mouseup', handleResizeEnd);
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

function handleResizeMove(e) {
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
}

function handleResizeEnd() {
    if (resizingPanel) {
        resizingPanel.classList.remove('resizing');
        savePanelSizes();
        resizingPanel = null;
        resizeDirection = null;
        document.body.style.cursor = '';
    }
}

// Save panel sizes to localStorage
export function savePanelSizes() {
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

// Restore panel sizes from localStorage
export function restorePanelSizes() {
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

// Initialize all panel functionality
export function initPanels(renderMonitorsList) {
    applyPanelSettings();
    restorePanelOrder();
    restorePanelSizes();
    updateLivestreamEmbed();
    initDragAndDrop();
    initPanelResize();
}
