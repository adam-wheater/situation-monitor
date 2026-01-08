// popups.js - All popup show/hide functions

import { escapeHtml, getTimeAgo } from './utils.js';

// Helper function to position popup within map bounds
function positionPopup(popup, targetEl, popupWidth, popupHeight) {
    const mapContainer = document.getElementById('worldMapContainer');
    if (!mapContainer) return;

    const mapRect = mapContainer.getBoundingClientRect();
    const targetRect = targetEl.getBoundingClientRect();

    let left = targetRect.left - mapRect.left + 20;
    let top = targetRect.top - mapRect.top - 10;

    if (left + popupWidth > mapRect.width) {
        left = targetRect.left - mapRect.left - popupWidth - 20;
    }
    if (top + popupHeight > mapRect.height) {
        top = mapRect.height - popupHeight - 10;
    }
    if (top < 10) top = 10;
    if (left < 10) left = 10;

    popup.style.left = left + 'px';
    popup.style.top = top + 'px';
}

// Hide hotspot popup
export function hideHotspotPopup() {
    const popup = document.getElementById('hotspotPopup');
    if (popup) popup.classList.remove('visible');
}

// Hide conflict popup
export function hideConflictPopup() {
    const popup = document.getElementById('conflictPopup');
    if (popup) popup.classList.remove('visible');
}

// Hide US city popup
export function hideUSCityPopup() {
    const popup = document.getElementById('usCityPopup');
    if (popup) popup.classList.remove('visible');
}

// Hide US hotspot popup
export function hideUSHotspotPopup() {
    const popup = document.getElementById('usHotspotPopup');
    if (popup) popup.classList.remove('visible');
}

// Hide chokepoint popup
export function hideChokepointPopup() {
    const popup = document.getElementById('chokepointPopup');
    if (popup) popup.classList.remove('visible');
}

// Hide earthquake popup
export function hideQuakePopup() {
    const popup = document.getElementById('quakePopup');
    if (popup) popup.classList.remove('visible');
}

// Hide cyber popup
export function hideCyberPopup() {
    const popup = document.getElementById('cyberPopup');
    if (popup) popup.classList.remove('visible');
}

// Hide custom hotspot popup
export function hideCustomHotspotPopup() {
    const popup = document.getElementById('customHotspotPopup');
    if (popup) popup.classList.remove('visible');
}

// Hide aircraft popup
export function hideAircraftPopup() {
    const popup = document.getElementById('aircraftPopup');
    if (popup) popup.classList.remove('visible');
}

// Hide all popups
export function hideAllPopups() {
    hideHotspotPopup();
    hideChokepointPopup();
    hideQuakePopup();
    hideCyberPopup();
    hideCustomHotspotPopup();
    hideConflictPopup();
    hideUSCityPopup();
    hideUSHotspotPopup();
    hideAircraftPopup();
}

// Show hotspot popup
export function showHotspotPopup(event, hotspotId) {
    event.stopPropagation();

    const hotspotEl = document.querySelector(`[data-hotspot-id="${hotspotId}"]`);
    if (!hotspotEl) return;

    hideChokepointPopup();
    hideQuakePopup();
    hideCyberPopup();
    hideCustomHotspotPopup();
    hideUSCityPopup();
    hideUSHotspotPopup();

    const activityData = JSON.parse(decodeURIComponent(hotspotEl.dataset.hotspotActivity));
    const popup = document.getElementById('hotspotPopup');

    let headlinesHTML = '';
    if (activityData.headlines && activityData.headlines.length > 0) {
        headlinesHTML = activityData.headlines.map(h => `
            <div class="hotspot-popup-headline">
                <div class="hotspot-popup-source">${escapeHtml(h.source || 'News')}</div>
                <a href="${h.link || '#'}" target="_blank">${escapeHtml(h.title)}</a>
            </div>
        `).join('');
    } else {
        headlinesHTML = '<div class="hotspot-popup-empty">No recent headlines for this location</div>';
    }

    let agenciesHTML = '';
    if (activityData.agencies && activityData.agencies.length > 0) {
        agenciesHTML = `
            <div class="hotspot-popup-agencies">
                <div class="hotspot-popup-agencies-title">Key Entities</div>
                ${activityData.agencies.map(a => `<span class="hotspot-popup-agency">${escapeHtml(a)}</span>`).join('')}
            </div>
        `;
    }

    popup.innerHTML = `
        <button class="hotspot-popup-close" onclick="hideHotspotPopup()">&times;</button>
        <div class="hotspot-popup-header">
            <span class="hotspot-popup-title">${escapeHtml(activityData.name)}</span>
            <span class="hotspot-popup-level ${activityData.level}">${activityData.level.toUpperCase()}</span>
        </div>
        <div class="hotspot-popup-subtext">${escapeHtml(activityData.subtext)}</div>
        ${activityData.description ? `<div class="hotspot-popup-desc">${escapeHtml(activityData.description)}</div>` : ''}
        <div class="hotspot-popup-meta">
            <div class="hotspot-popup-meta-item">
                <span class="hotspot-popup-meta-label">Coordinates</span>
                <span class="hotspot-popup-meta-value">${activityData.lat.toFixed(2)}°${activityData.lat >= 0 ? 'N' : 'S'}, ${Math.abs(activityData.lon).toFixed(2)}°${activityData.lon >= 0 ? 'E' : 'W'}</span>
            </div>
            ${activityData.status ? `
            <div class="hotspot-popup-meta-item">
                <span class="hotspot-popup-meta-label">Status</span>
                <span class="hotspot-popup-meta-value">${escapeHtml(activityData.status)}</span>
            </div>
            ` : ''}
        </div>
        ${agenciesHTML}
        ${headlinesHTML.includes('hotspot-popup-headline') ? '<div class="hotspot-popup-headlines-title">Related Headlines</div>' : ''}
        <div class="hotspot-popup-headlines">
            ${headlinesHTML}
        </div>
    `;

    popup.className = `hotspot-popup visible ${activityData.level}`;
    positionPopup(popup, hotspotEl, 320, 400);
}

// Show conflict popup
export function showConflictPopup(event, conflictId) {
    event.stopPropagation();

    const conflictEl = document.querySelector(`[data-conflict-id="${conflictId}"]`);
    if (!conflictEl) return;

    hideAllPopups();

    const conflictData = JSON.parse(decodeURIComponent(conflictEl.dataset.conflictInfo));
    const popup = document.getElementById('conflictPopup');

    let matchedHeadlines = [];
    if (window.cachedAllNews && conflictData.keywords) {
        matchedHeadlines = window.cachedAllNews.filter(item => {
            const title = (item.title || '').toLowerCase();
            return conflictData.keywords.some(kw => title.includes(kw.toLowerCase()));
        }).slice(0, 5);
    }

    let headlinesHTML = '';
    if (matchedHeadlines.length > 0) {
        headlinesHTML = `
            <div class="conflict-popup-headlines-title">Related Headlines</div>
            <div class="conflict-popup-headlines">
                ${matchedHeadlines.map(h => `
                    <div class="conflict-popup-headline">
                        <div class="conflict-popup-headline-source">${escapeHtml(h.source || 'News')}</div>
                        <a href="${h.link || '#'}" target="_blank">${escapeHtml(h.title)}</a>
                    </div>
                `).join('')}
            </div>
        `;
    }

    popup.innerHTML = `
        <button class="conflict-popup-close" onclick="hideConflictPopup()">&times;</button>
        <div class="conflict-popup-header">
            <span class="conflict-popup-title">${escapeHtml(conflictData.name)}</span>
            <span class="conflict-popup-intensity ${conflictData.intensity}">${conflictData.intensity.toUpperCase()}</span>
        </div>
        <div class="conflict-popup-meta">
            <div class="conflict-popup-meta-item">
                <span class="conflict-popup-meta-label">Start Date</span>
                <span class="conflict-popup-meta-value">${escapeHtml(conflictData.startDate)}</span>
            </div>
            <div class="conflict-popup-meta-item">
                <span class="conflict-popup-meta-label">Casualties</span>
                <span class="conflict-popup-meta-value">${escapeHtml(conflictData.casualties)}</span>
            </div>
            <div class="conflict-popup-meta-item">
                <span class="conflict-popup-meta-label">Displaced</span>
                <span class="conflict-popup-meta-value">${escapeHtml(conflictData.displaced)}</span>
            </div>
        </div>
        <div class="conflict-popup-desc">${escapeHtml(conflictData.description)}</div>
        <div class="conflict-popup-parties">
            <div class="conflict-popup-parties-title">Belligerents</div>
            ${conflictData.parties.map(p => `<span class="conflict-popup-party">${escapeHtml(p)}</span>`).join('')}
        </div>
        <div class="conflict-popup-events">
            <div class="conflict-popup-events-title">Key Developments</div>
            ${conflictData.keyEvents.map(e => `<div class="conflict-popup-event">${escapeHtml(e)}</div>`).join('')}
        </div>
        ${headlinesHTML}
    `;

    popup.classList.add('visible');
    positionPopup(popup, conflictEl, 380, 450);
}

// Show US city popup
export function showUSCityPopup(event, cityId) {
    event.stopPropagation();

    const cityEl = document.querySelector(`[data-city-id="${cityId}"]`);
    if (!cityEl) return;

    hideAllPopups();

    const cityData = JSON.parse(decodeURIComponent(cityEl.dataset.cityInfo));
    const popup = document.getElementById('usCityPopup');

    let headlinesHTML = '';
    if (cityData.headlines && cityData.headlines.length > 0) {
        headlinesHTML = cityData.headlines.map(h => `
            <div class="us-city-popup-headline">
                <div class="us-city-popup-headline-source">${escapeHtml(h.source || 'News')}</div>
                <a href="${h.link || '#'}" target="_blank">${escapeHtml(h.title)}</a>
            </div>
        `).join('');
    } else {
        headlinesHTML = '<div style="padding: 1rem; color: #336688; font-size: 0.6rem; text-align: center;">No recent headlines for this city</div>';
    }

    const sectorsHTML = cityData.sectors ? cityData.sectors.map(s =>
        `<span style="display: inline-block; font-size: 0.5rem; padding: 0.1rem 0.3rem; margin: 0.1rem; background: rgba(0, 170, 255, 0.1); border: 1px solid rgba(0, 170, 255, 0.2); color: #66aacc;">${escapeHtml(s)}</span>`
    ).join('') : '';

    popup.innerHTML = `
        <button class="us-city-popup-close" onclick="hideUSCityPopup()">&times;</button>
        <div class="us-city-popup-header">
            <span class="us-city-popup-title">${escapeHtml(cityData.name)}</span>
            <span class="us-city-popup-state">${escapeHtml(cityData.state)}</span>
        </div>
        <div class="us-city-popup-meta">
            <div>
                <span class="us-city-popup-meta-label">Population</span>
                <span class="us-city-popup-meta-value">${escapeHtml(cityData.population)}</span>
            </div>
            <div>
                <span class="us-city-popup-meta-label">News Matches</span>
                <span class="us-city-popup-meta-value">${cityData.matchCount || 0}</span>
            </div>
        </div>
        <div class="us-city-popup-desc">${escapeHtml(cityData.description)}</div>
        ${sectorsHTML ? `<div style="padding: 0.5rem 1rem; border-bottom: 1px solid rgba(0, 100, 170, 0.2);"><div style="font-size: 0.45rem; color: #336688; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 0.3rem;">Key Sectors</div>${sectorsHTML}</div>` : ''}
        <div class="us-city-popup-headlines-title">Related Headlines</div>
        <div class="us-city-popup-headlines">
            ${headlinesHTML}
        </div>
    `;

    popup.classList.add('visible');
    positionPopup(popup, cityEl, 360, 420);
}

// Show US hotspot popup
export function showUSHotspotPopup(event, hotspotId) {
    event.stopPropagation();

    const hotspotEl = document.querySelector(`[data-us-hotspot-id="${hotspotId}"]`);
    if (!hotspotEl) return;

    hideAllPopups();

    const hotspotData = JSON.parse(decodeURIComponent(hotspotEl.dataset.usHotspotInfo));
    const popup = document.getElementById('usHotspotPopup');

    let headlinesHTML = '';
    if (hotspotData.headlines && hotspotData.headlines.length > 0) {
        headlinesHTML = hotspotData.headlines.map(h => `
            <div class="us-hotspot-popup-headline">
                <div class="us-hotspot-popup-headline-source">${escapeHtml(h.source || 'News')}</div>
                <a href="${h.link || '#'}" target="_blank">${escapeHtml(h.title)}</a>
            </div>
        `).join('');
    } else {
        headlinesHTML = '<div class="us-hotspot-popup-headline" style="color: #666;">No matching headlines found</div>';
    }

    popup.className = `us-hotspot-popup ${hotspotData.level}`;
    popup.innerHTML = `
        <button class="us-hotspot-popup-close" onclick="hideUSHotspotPopup()">&times;</button>
        <div class="us-hotspot-popup-header">
            <span class="us-hotspot-popup-title">${hotspotData.icon} ${escapeHtml(hotspotData.name)}</span>
            <span class="us-hotspot-popup-level ${hotspotData.level}">${hotspotData.level.toUpperCase()}</span>
        </div>
        <div class="us-hotspot-popup-meta">
            <div>
                <span class="us-hotspot-popup-meta-label">Location</span>
                <span class="us-hotspot-popup-meta-value">${escapeHtml(hotspotData.location)}</span>
            </div>
            <div>
                <span class="us-hotspot-popup-meta-label">Category</span>
                <span class="us-hotspot-popup-meta-value">${escapeHtml(hotspotData.category)}</span>
            </div>
            <div>
                <span class="us-hotspot-popup-meta-label">Since</span>
                <span class="us-hotspot-popup-meta-value">${escapeHtml(hotspotData.startDate)}</span>
            </div>
            <div>
                <span class="us-hotspot-popup-meta-label">Status</span>
                <span class="us-hotspot-popup-meta-value">${escapeHtml(hotspotData.status)}</span>
            </div>
        </div>
        <div class="us-hotspot-popup-desc">${escapeHtml(hotspotData.description)}</div>
        <div class="us-hotspot-popup-headlines-title">Related Headlines (${hotspotData.matchCount || 0})</div>
        <div class="us-hotspot-popup-headlines">
            ${headlinesHTML}
        </div>
    `;

    popup.classList.add('visible');
    positionPopup(popup, hotspotEl, 320, 400);
}

// Show chokepoint popup
export function showChokepointPopup(event, chokepointId) {
    event.stopPropagation();

    const cpEl = document.querySelector(`[data-chokepoint-id="${chokepointId}"]`);
    if (!cpEl) return;

    hideAllPopups();

    const cpData = JSON.parse(decodeURIComponent(cpEl.dataset.chokepointInfo));
    const popup = document.getElementById('chokepointPopup');

    let headlinesHTML = '';
    if (cpData.headlines && cpData.headlines.length > 0) {
        headlinesHTML = cpData.headlines.map(h => `
            <div class="chokepoint-popup-headline">
                <a href="${h.link || '#'}" target="_blank">${escapeHtml(h.title)}</a>
            </div>
        `).join('');
    } else {
        headlinesHTML = '<div class="chokepoint-popup-empty">No recent headlines for this chokepoint</div>';
    }

    popup.innerHTML = `
        <button class="chokepoint-popup-close" onclick="hideChokepointPopup()">&times;</button>
        <div class="chokepoint-popup-header">
            <span class="chokepoint-popup-title">${escapeHtml(cpData.name)}</span>
            <span class="chokepoint-popup-status ${cpData.isAlert ? 'alert' : 'normal'}">${cpData.isAlert ? 'ALERT' : 'NORMAL'}</span>
        </div>
        <div class="chokepoint-popup-info">
            <div class="chokepoint-popup-stat">
                <span class="chokepoint-popup-stat-label">Region</span>
                <span class="chokepoint-popup-stat-value">${escapeHtml(cpData.region)}</span>
            </div>
            <div class="chokepoint-popup-stat">
                <span class="chokepoint-popup-stat-label">Traffic</span>
                <span class="chokepoint-popup-stat-value">${escapeHtml(cpData.traffic)}</span>
            </div>
        </div>
        <div class="chokepoint-popup-desc">${escapeHtml(cpData.desc)}</div>
        <div class="chokepoint-popup-headlines">
            ${headlinesHTML}
        </div>
    `;

    popup.className = `chokepoint-popup visible ${cpData.isAlert ? 'alert' : ''}`;
    positionPopup(popup, cpEl, 280, 300);
}

// Show earthquake popup
export function showQuakePopup(event, quakeId) {
    event.stopPropagation();

    const quakeEl = document.querySelector(`[data-quake-id="${quakeId}"]`);
    if (!quakeEl) return;

    hideAllPopups();

    const eqData = JSON.parse(decodeURIComponent(quakeEl.dataset.quakeInfo));
    const popup = document.getElementById('quakePopup');

    const isMajor = eqData.mag >= 6.0;
    const isModerate = eqData.mag >= 5.0;

    let severity = 'minor';
    let severityLabel = 'Minor';
    if (isMajor) {
        severity = 'major';
        severityLabel = 'Major';
    } else if (isModerate) {
        severity = 'moderate';
        severityLabel = 'Moderate';
    }

    const time = new Date(eqData.time);
    const timeAgoStr = getTimeAgo(time);
    const usgsLink = `https://earthquake.usgs.gov/earthquakes/eventpage/${eqData.id || ''}`;

    popup.innerHTML = `
        <button class="quake-popup-close" onclick="hideQuakePopup()">&times;</button>
        <div class="quake-popup-header">
            <span class="quake-popup-mag">M${eqData.mag.toFixed(1)}</span>
            <span class="quake-popup-severity ${severity}">${severityLabel}</span>
        </div>
        <div class="quake-popup-location">${escapeHtml(eqData.place)}</div>
        <div class="quake-popup-info">
            <div class="quake-popup-stat">
                <span class="quake-popup-stat-label">Depth</span>
                <span class="quake-popup-stat-value">${eqData.depth.toFixed(1)} km</span>
            </div>
            <div class="quake-popup-stat">
                <span class="quake-popup-stat-label">Coordinates</span>
                <span class="quake-popup-stat-value">${eqData.lat.toFixed(2)}°, ${eqData.lon.toFixed(2)}°</span>
            </div>
            <div class="quake-popup-stat">
                <span class="quake-popup-stat-label">Time</span>
                <span class="quake-popup-stat-value">${timeAgoStr}</span>
            </div>
        </div>
        <a href="${usgsLink}" target="_blank" class="quake-popup-link">View on USGS →</a>
    `;

    popup.className = `quake-popup visible ${isMajor ? 'major' : ''}`;
    positionPopup(popup, quakeEl, 260, 220);
}

// Show cyber threat popup
export function showCyberPopup(event, cyberId) {
    event.stopPropagation();

    const cyberEl = document.querySelector(`[data-cyber-id="${cyberId}"]`);
    if (!cyberEl) return;

    hideAllPopups();

    const czData = JSON.parse(decodeURIComponent(cyberEl.dataset.cyberInfo));
    const popup = document.getElementById('cyberPopup');

    const targetsHTML = czData.targets.map(t =>
        `<span class="cyber-popup-target-tag">${escapeHtml(t)}</span>`
    ).join('');

    popup.innerHTML = `
        <button class="cyber-popup-close" onclick="hideCyberPopup()">&times;</button>
        <div class="cyber-popup-header">
            <span class="cyber-popup-title">${escapeHtml(czData.fullName)}</span>
            <span class="cyber-popup-status ${czData.isActive ? 'active' : 'dormant'}">${czData.isActive ? 'Active' : 'Dormant'}</span>
        </div>
        <div class="cyber-popup-apt">${escapeHtml(czData.group)} — ${escapeHtml(czData.aka)}</div>
        <div class="cyber-popup-desc">${escapeHtml(czData.desc)}</div>
        <div class="cyber-popup-info">
            <div class="cyber-popup-stat">
                <span class="cyber-popup-stat-label">State Sponsor</span>
                <span class="cyber-popup-stat-value">${escapeHtml(czData.sponsor)}</span>
            </div>
            <div class="cyber-popup-stat">
                <span class="cyber-popup-stat-label">Coordinates</span>
                <span class="cyber-popup-stat-value">${czData.lat.toFixed(1)}°, ${czData.lon.toFixed(1)}°</span>
            </div>
        </div>
        <div class="cyber-popup-targets">
            <div class="cyber-popup-targets-label">Primary Targets</div>
            <div class="cyber-popup-target-tags">${targetsHTML}</div>
        </div>
    `;

    popup.className = `cyber-popup visible ${czData.isActive ? 'active' : ''}`;
    positionPopup(popup, cyberEl, 280, 300);
}

// Show custom hotspot popup
export function showCustomHotspotPopup(event, monitorId) {
    event.stopPropagation();

    const hotspotEl = document.querySelector(`[data-monitor-id="${monitorId}"]`);
    if (!hotspotEl) return;

    hideAllPopups();

    const monitorData = JSON.parse(decodeURIComponent(hotspotEl.dataset.monitorInfo));
    const popup = document.getElementById('customHotspotPopup');

    let headlinesHTML = '';
    if (monitorData.matches && monitorData.matches.length > 0) {
        headlinesHTML = monitorData.matches.map(h => `
            <div class="custom-hotspot-popup-headline">
                <div class="custom-hotspot-popup-headline-source">${escapeHtml(h.source || 'News')}</div>
                <a href="${h.link || '#'}" target="_blank">${escapeHtml(h.title)}</a>
            </div>
        `).join('');
    } else {
        headlinesHTML = '<div style="padding: 1rem; color: #888; font-size: 0.6rem; text-align: center;">No matching headlines</div>';
    }

    popup.style.borderColor = monitorData.color || '#00ff88';
    popup.innerHTML = `
        <button class="custom-hotspot-popup-close" onclick="hideCustomHotspotPopup()">&times;</button>
        <div class="custom-hotspot-popup-header" style="border-bottom-color: ${monitorData.color || '#00ff88'};">
            <span class="custom-hotspot-popup-title" style="color: ${monitorData.color || '#00ff88'};">${escapeHtml(monitorData.name)}</span>
            <span class="custom-hotspot-popup-count">${monitorData.matchCount || 0} matches</span>
        </div>
        <div class="custom-hotspot-popup-keywords">
            ${monitorData.keywords.map(k => `<span class="custom-hotspot-popup-keyword">${escapeHtml(k)}</span>`).join('')}
        </div>
        <div class="custom-hotspot-popup-headlines">
            ${headlinesHTML}
        </div>
    `;

    popup.classList.add('visible');
    positionPopup(popup, hotspotEl, 300, 350);
}

// Show aircraft popup
export function showAircraftPopup(event, flightData) {
    event.stopPropagation();

    hideAllPopups();

    const popup = document.getElementById('aircraftPopup');
    if (!popup) return;

    popup.innerHTML = `
        <button class="aircraft-popup-close" onclick="hideAircraftPopup()">&times;</button>
        <div class="aircraft-popup-header">
            <span class="aircraft-popup-callsign">${escapeHtml(flightData.callsign || 'Unknown')}</span>
            <span class="aircraft-popup-country">${escapeHtml(flightData.country || '')}</span>
        </div>
        <div class="aircraft-popup-info">
            <div class="aircraft-popup-stat">
                <span class="aircraft-popup-stat-label">Altitude</span>
                <span class="aircraft-popup-stat-value">${flightData.altitude ? Math.round(flightData.altitude * 3.281) + ' ft' : 'N/A'}</span>
            </div>
            <div class="aircraft-popup-stat">
                <span class="aircraft-popup-stat-label">Speed</span>
                <span class="aircraft-popup-stat-value">${flightData.velocity ? Math.round(flightData.velocity * 1.944) + ' kts' : 'N/A'}</span>
            </div>
            <div class="aircraft-popup-stat">
                <span class="aircraft-popup-stat-label">Heading</span>
                <span class="aircraft-popup-stat-value">${flightData.heading ? Math.round(flightData.heading) + '°' : 'N/A'}</span>
            </div>
            <div class="aircraft-popup-stat">
                <span class="aircraft-popup-stat-label">ICAO</span>
                <span class="aircraft-popup-stat-value">${escapeHtml(flightData.icao24 || 'Unknown')}</span>
            </div>
        </div>
    `;

    popup.classList.add('visible');

    // Position at cursor
    const mapContainer = document.getElementById('worldMapContainer');
    if (mapContainer) {
        const mapRect = mapContainer.getBoundingClientRect();
        popup.style.left = (event.clientX - mapRect.left + 10) + 'px';
        popup.style.top = (event.clientY - mapRect.top + 10) + 'px';
    }
}
