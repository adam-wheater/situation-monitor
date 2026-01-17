// Map popup functions

function hideAllPopups() {
    hideHotspotPopup();
    hideChokepointPopup();
    hideQuakePopup();
    hideCyberPopup();
    hideCustomHotspotPopup();
    hideConflictPopup();
    hideUSCityPopup();
    hideUSHotspotPopup();
    hideCablePopup();
    hideWeatherPopup();
    hideNavalPopup();
    hideFlightPopup();
}

function positionPopupAtEvent(popup, event) {
    const mapContainer = document.getElementById('worldMapContainer');
    if (!mapContainer) return;

    const mapRect = mapContainer.getBoundingClientRect();
    const popupWidth = 320;
    const popupHeight = 300;

    let left = (event.clientX - mapRect.left) + 15;
    let top = (event.clientY - mapRect.top) + 15;

    if (left + popupWidth > mapRect.width) left = mapRect.width - popupWidth - 10;
    if (top + popupHeight > mapRect.height) top = mapRect.height - popupHeight - 10;
    if (left < 10) left = 10;
    if (top < 10) top = 10;

    popup.style.left = `${left}px`;
    popup.style.top = `${top}px`;
}

// Hotspot popup
function showHotspotPopupDirect(event, activityData) {
    if (event?.stopPropagation) event.stopPropagation();
    hideAllPopups();

    const popup = document.getElementById('hotspotPopup');
    if (!popup) return;

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
            <span class="hotspot-popup-level ${activityData.level}">${(activityData.level || 'low').toUpperCase()}</span>
        </div>
        <div class="hotspot-popup-subtext">${escapeHtml(activityData.subtext || '')}</div>
        ${activityData.description ? `<div class="hotspot-popup-desc">${escapeHtml(activityData.description)}</div>` : ''}
        ${agenciesHTML}
        ${headlinesHTML.includes('hotspot-popup-headline') ? '<div class="hotspot-popup-headlines-title">Related Headlines</div>' : ''}
        <div class="hotspot-popup-headlines">${headlinesHTML}</div>
    `;

    popup.className = `hotspot-popup visible ${activityData.level || 'low'}`;
    positionPopupAtEvent(popup, event);
}

function hideHotspotPopup() {
    const popup = document.getElementById('hotspotPopup');
    if (popup) popup.classList.remove('visible');
}

// Chokepoint popup
function showChokepointPopupDirect(event, cpData) {
    if (event?.stopPropagation) event.stopPropagation();
    hideAllPopups();

    const popup = document.getElementById('chokepointPopup');
    if (!popup) return;

    let headlinesHTML = '<div class="chokepoint-popup-empty">No related news</div>';
    if (cpData.headlines && cpData.headlines.length > 0) {
        headlinesHTML = cpData.headlines.map(h => `
            <div class="chokepoint-popup-headline">
                <a href="${h.link || '#'}" target="_blank">${escapeHtml(h.title)}</a>
                <span class="chokepoint-popup-source">${escapeHtml(h.source || '')}</span>
            </div>
        `).join('');
    }

    popup.innerHTML = `
        <button class="chokepoint-popup-close" onclick="hideChokepointPopup()">&times;</button>
        <div class="chokepoint-popup-header">
            <span class="chokepoint-popup-title">${escapeHtml(cpData.name)}</span>
            <span class="chokepoint-popup-status ${cpData.isAlert ? 'alert' : 'normal'}">${cpData.isAlert ? 'ALERT' : 'NORMAL'}</span>
        </div>
        <div class="chokepoint-popup-desc">${escapeHtml(cpData.desc || '')}</div>
        <div class="chokepoint-popup-info">
            <div class="chokepoint-popup-stat">
                <span class="chokepoint-popup-stat-label">Traffic</span>
                <span class="chokepoint-popup-stat-value">${cpData.traffic || 'N/A'}</span>
            </div>
            <div class="chokepoint-popup-stat">
                <span class="chokepoint-popup-stat-label">Region</span>
                <span class="chokepoint-popup-stat-value">${cpData.region || 'N/A'}</span>
            </div>
        </div>
        <div class="chokepoint-popup-headlines">${headlinesHTML}</div>
    `;

    popup.className = `chokepoint-popup visible ${cpData.isAlert ? 'alert' : ''}`;
    positionPopupAtEvent(popup, event);
}

function hideChokepointPopup() {
    const popup = document.getElementById('chokepointPopup');
    if (popup) popup.classList.remove('visible');
}

// Conflict popup
function showConflictPopupDirect(event, conflictData) {
    if (event?.stopPropagation) event.stopPropagation();
    hideAllPopups();

    const popup = document.getElementById('conflictPopup');
    if (!popup) return;

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
            <span class="conflict-popup-intensity ${conflictData.intensity}">${(conflictData.intensity || '').toUpperCase()}</span>
        </div>
        <div class="conflict-popup-desc">${escapeHtml(conflictData.description || '')}</div>
        <div class="conflict-popup-stats">
            <div class="conflict-popup-stat"><strong>Started:</strong> ${conflictData.startDate || 'N/A'}</div>
            <div class="conflict-popup-stat"><strong>Parties:</strong> ${(conflictData.parties || []).join(', ')}</div>
            <div class="conflict-popup-stat"><strong>Casualties:</strong> ${conflictData.casualties || 'N/A'}</div>
        </div>
        ${headlinesHTML}
    `;

    popup.className = `conflict-popup visible ${conflictData.intensity}`;
    positionPopupAtEvent(popup, event);
}

function hideConflictPopup() {
    const popup = document.getElementById('conflictPopup');
    if (popup) popup.classList.remove('visible');
}

// Cyber popup
function showCyberPopupDirect(event, cyberData) {
    if (event?.stopPropagation) event.stopPropagation();
    hideAllPopups();

    const popup = document.getElementById('cyberPopup');
    if (!popup) return;

    const title = cyberData.group || cyberData.name || 'Cyber';
    const statusClass = cyberData.isActive ? 'active' : 'dormant';
    const statusLabel = cyberData.isActive ? 'Active' : 'Dormant';
    const targets = Array.isArray(cyberData.targets) ? cyberData.targets : [];
    const targetsHTML = targets.map(t => `<span class="cyber-popup-target-tag">${escapeHtml(t)}</span>`).join('');

    popup.innerHTML = `
        <button class="cyber-popup-close" onclick="hideCyberPopup()">&times;</button>
        <div class="cyber-popup-header">
            <span class="cyber-popup-title">${escapeHtml(title)}</span>
            <span class="cyber-popup-status ${statusClass}">${statusLabel}</span>
        </div>
        ${cyberData.aka ? `<div class="cyber-popup-apt">${escapeHtml(cyberData.aka)}</div>` : ''}
        <div class="cyber-popup-desc">${escapeHtml(cyberData.desc || '')}</div>
        <div class="cyber-popup-info">
            <div class="cyber-popup-stat">
                <span class="cyber-popup-stat-label">Sponsor</span>
                <span class="cyber-popup-stat-value">${escapeHtml(cyberData.sponsor || 'Unknown')}</span>
            </div>
        </div>
        ${targetsHTML ? `<div class="cyber-popup-targets"><div class="cyber-popup-targets-label">Targets</div><div class="cyber-popup-target-tags">${targetsHTML}</div></div>` : ''}
    `;

    popup.className = `cyber-popup visible ${cyberData.isActive ? 'active' : ''}`;
    positionPopupAtEvent(popup, event);
}

function hideCyberPopup() {
    const popup = document.getElementById('cyberPopup');
    if (popup) popup.classList.remove('visible');
}

// Custom hotspot popup
function showCustomHotspotPopupDirect(event, monitorData) {
    if (event?.stopPropagation) event.stopPropagation();
    hideAllPopups();

    const popup = document.getElementById('customHotspotPopup');
    if (!popup) return;

    let matchesHTML = '<div class="custom-hotspot-popup-empty">No matches found</div>';
    if (monitorData.matches && monitorData.matches.length > 0) {
        matchesHTML = monitorData.matches.map(m => `
            <div class="custom-hotspot-popup-match">
                <a href="${m.link || '#'}" target="_blank">${escapeHtml(m.title)}</a>
            </div>
        `).join('');
    }

    popup.innerHTML = `
        <button class="custom-hotspot-popup-close" onclick="hideCustomHotspotPopup()">&times;</button>
        <div class="custom-hotspot-popup-header">
            <div class="custom-hotspot-popup-dot" style="background: ${monitorData.color};"></div>
            <div class="custom-hotspot-popup-name" style="color: ${monitorData.color};">${escapeHtml(monitorData.name)}</div>
            <div class="custom-hotspot-popup-count">${monitorData.matchCount || 0} matches</div>
        </div>
        <div class="custom-hotspot-popup-keywords">Keywords: ${(monitorData.keywords || []).map(k => escapeHtml(k)).join(', ')}</div>
        <div class="custom-hotspot-popup-matches">${matchesHTML}</div>
    `;

    popup.className = 'custom-hotspot-popup visible';
    positionPopupAtEvent(popup, event);
}

function hideCustomHotspotPopup() {
    const popup = document.getElementById('customHotspotPopup');
    if (popup) popup.classList.remove('visible');
}

// Earthquake popup
function showQuakePopupDirect(event, quakeData) {
    if (event?.stopPropagation) event.stopPropagation();
    hideAllPopups();

    const popup = document.getElementById('quakePopup');
    if (!popup) return;

    const timeStr = quakeData.time ? new Date(quakeData.time).toLocaleString() : 'Unknown';
    const mag = quakeData.mag || 0;
    const isMajor = mag >= 6.0;
    const isModerate = mag >= 5.0;
    const severity = isMajor ? 'major' : (isModerate ? 'moderate' : 'minor');
    const severityLabel = isMajor ? 'Major' : (isModerate ? 'Moderate' : 'Minor');

    popup.innerHTML = `
        <button class="quake-popup-close" onclick="hideQuakePopup()">&times;</button>
        <div class="quake-popup-header">
            <span class="quake-popup-mag">M${mag.toFixed(1)}</span>
            <span class="quake-popup-severity ${severity}">${severityLabel}</span>
        </div>
        <div class="quake-popup-location">${escapeHtml(quakeData.place || 'Unknown location')}</div>
        <div class="quake-popup-info">
            <div class="quake-popup-stat">
                <span class="quake-popup-stat-label">Time</span>
                <span class="quake-popup-stat-value">${timeStr}</span>
            </div>
            <div class="quake-popup-stat">
                <span class="quake-popup-stat-label">Depth</span>
                <span class="quake-popup-stat-value">${quakeData.depth ? quakeData.depth.toFixed(1) + ' km' : 'N/A'}</span>
            </div>
            <div class="quake-popup-stat">
                <span class="quake-popup-stat-label">Coordinates</span>
                <span class="quake-popup-stat-value">${quakeData.lat?.toFixed(2) || 0}°, ${quakeData.lon?.toFixed(2) || 0}°</span>
            </div>
        </div>
    `;

    popup.className = `quake-popup visible ${isMajor ? 'major' : ''}`;
    positionPopupAtEvent(popup, event);
}

function hideQuakePopup() {
    const popup = document.getElementById('quakePopup');
    if (popup) popup.classList.remove('visible');
}

// Base popup
function showBasePopupDirect(event, baseData) {
    if (event?.stopPropagation) event.stopPropagation();
    hideAllPopups();

    const popup = document.getElementById('conflictPopup');
    if (!popup) return;

    const typeLabel = baseData.type === 'us-nato' ? 'US/NATO' :
                      baseData.type === 'china' ? 'China' : 'Russia';
    const typeColor = baseData.type === 'us-nato' ? '#ff00ff' :
                      baseData.type === 'china' ? '#ff6600' : '#ff3333';

    popup.innerHTML = `
        <button class="conflict-popup-close" onclick="hideConflictPopup()">&times;</button>
        <div class="conflict-popup-header">
            <span class="conflict-popup-title">${escapeHtml(baseData.name)}</span>
            <span class="conflict-popup-intensity" style="background: ${typeColor}">${typeLabel}</span>
        </div>
        <div class="conflict-popup-desc">Military installation</div>
        <div class="conflict-popup-stats">
            <div class="conflict-popup-stat"><strong>Type:</strong> ${typeLabel} Base</div>
            <div class="conflict-popup-stat"><strong>Location:</strong> ${baseData.lat?.toFixed(2) || 0}°, ${baseData.lon?.toFixed(2) || 0}°</div>
        </div>
    `;

    popup.className = 'conflict-popup visible';
    positionPopupAtEvent(popup, event);
}

// Nuclear popup
function showNuclearPopupDirect(event, nuclearData) {
    if (event?.stopPropagation) event.stopPropagation();
    hideAllPopups();

    const popup = document.getElementById('conflictPopup');
    if (!popup) return;

    const isWeapons = nuclearData.type === 'weapons' || nuclearData.type === 'enrichment';
    const typeLabel = nuclearData.type === 'weapons' ? 'Weapons Facility' :
                      nuclearData.type === 'enrichment' ? 'Enrichment Facility' :
                      nuclearData.type === 'reprocessing' ? 'Reprocessing Facility' : 'Power Plant';

    popup.innerHTML = `
        <button class="conflict-popup-close" onclick="hideConflictPopup()">&times;</button>
        <div class="conflict-popup-header">
            <span class="conflict-popup-title">☢ ${escapeHtml(nuclearData.name)}</span>
            <span class="conflict-popup-intensity ${isWeapons ? 'high' : ''}">${isWeapons ? 'SENSITIVE' : 'CIVILIAN'}</span>
        </div>
        <div class="conflict-popup-desc">${typeLabel}</div>
        <div class="conflict-popup-stats">
            <div class="conflict-popup-stat"><strong>Type:</strong> ${typeLabel}</div>
            <div class="conflict-popup-stat"><strong>Status:</strong> ${nuclearData.status || 'Unknown'}</div>
            <div class="conflict-popup-stat"><strong>Location:</strong> ${nuclearData.lat?.toFixed(2) || 0}°, ${nuclearData.lon?.toFixed(2) || 0}°</div>
        </div>
    `;

    popup.className = 'conflict-popup visible';
    positionPopupAtEvent(popup, event);
}

// Cable popup
function showCablePopup(event, cableRef) {
    const popup = document.getElementById('cablePopup');
    if (!popup) return;

    hideAllPopups();

    const name = escapeHtml(cableRef?.name || 'Undersea Cable');
    const id = escapeHtml(cableRef?.id || '');

    popup.innerHTML = `
        <button class="chokepoint-popup-close" onclick="hideCablePopup()">&times;</button>
        <div class="chokepoint-popup-header">
            <span class="chokepoint-popup-title">${name}</span>
            <span class="chokepoint-popup-status normal">CABLE</span>
        </div>
        <div class="chokepoint-popup-info">
            ${id ? `<div class="chokepoint-popup-stat"><span class="chokepoint-popup-stat-label">ID</span><span class="chokepoint-popup-stat-value">${id}</span></div>` : ''}
        </div>
    `;

    popup.className = 'chokepoint-popup visible';
    positionPopupAtEvent(popup, event);
}

function hideCablePopup() {
    const popup = document.getElementById('cablePopup');
    if (popup) popup.classList.remove('visible');
}

// US City popup
function hideUSCityPopup() {
    const popup = document.getElementById('usCityPopup');
    if (popup) popup.classList.remove('visible');
}

// US Hotspot popup
function hideUSHotspotPopup() {
    const popup = document.getElementById('usHotspotPopup');
    if (popup) popup.classList.remove('visible');
}

// Weather popup
function showWeatherPopupDirect(event, weatherData) {
    if (event?.stopPropagation) event.stopPropagation();
    hideAllPopups();

    const popup = document.getElementById('weatherPopup');
    if (!popup) return;

    const onsetTime = weatherData.onset ? new Date(weatherData.onset).toLocaleString() : 'N/A';
    const expiresTime = weatherData.expires ? new Date(weatherData.expires).toLocaleString() : 'N/A';
    const levelClass = weatherData.level || 'elevated';

    popup.innerHTML = `
        <button class="weather-popup-close" onclick="hideWeatherPopup()">&times;</button>
        <div class="weather-popup-header">
            <span class="weather-popup-title">${escapeHtml(weatherData.name)}</span>
            <span class="weather-popup-level ${levelClass}">${(weatherData.severity || 'Unknown').toUpperCase()}</span>
        </div>
        <div class="weather-popup-headline">${escapeHtml(weatherData.headline || '')}</div>
        <div class="weather-popup-area">${escapeHtml(weatherData.areaDesc || '')}</div>
        <div class="weather-popup-info">
            <div class="weather-popup-stat">
                <span class="weather-popup-stat-label">Onset</span>
                <span class="weather-popup-stat-value">${onsetTime}</span>
            </div>
            <div class="weather-popup-stat">
                <span class="weather-popup-stat-label">Expires</span>
                <span class="weather-popup-stat-value">${expiresTime}</span>
            </div>
            <div class="weather-popup-stat">
                <span class="weather-popup-stat-label">Certainty</span>
                <span class="weather-popup-stat-value">${escapeHtml(weatherData.certainty || 'Unknown')}</span>
            </div>
            <div class="weather-popup-stat">
                <span class="weather-popup-stat-label">Urgency</span>
                <span class="weather-popup-stat-value">${escapeHtml(weatherData.urgency || 'Unknown')}</span>
            </div>
        </div>
        <div class="weather-popup-sender">Source: ${escapeHtml(weatherData.senderName || 'NWS')}</div>
    `;

    popup.className = `weather-popup visible ${levelClass}`;
    positionPopupAtEvent(popup, event);
}

function hideWeatherPopup() {
    const popup = document.getElementById('weatherPopup');
    if (popup) popup.classList.remove('visible');
}

// Naval popup
function showNavalPopupDirect(event, navalData) {
    if (event?.stopPropagation) event.stopPropagation();
    hideAllPopups();

    const popup = document.getElementById('navalPopup');
    if (!popup) return;

    popup.innerHTML = `
        <button class="naval-popup-close" onclick="hideNavalPopup()">&times;</button>
        <div class="naval-popup-header">
            <span class="naval-popup-icon">⚓</span>
            <span class="naval-popup-title">${escapeHtml(navalData.name)}</span>
        </div>
        <div class="naval-popup-info">
            <div class="naval-popup-stat">
                <span class="naval-popup-stat-label">Type</span>
                <span class="naval-popup-stat-value">${escapeHtml(navalData.type || 'Naval Facility')}</span>
            </div>
            ${navalData.operator ? `
            <div class="naval-popup-stat">
                <span class="naval-popup-stat-label">Operator</span>
                <span class="naval-popup-stat-value">${escapeHtml(navalData.operator)}</span>
            </div>
            ` : ''}
            <div class="naval-popup-stat">
                <span class="naval-popup-stat-label">Coordinates</span>
                <span class="naval-popup-stat-value">${navalData.lat?.toFixed(3) || 0}°, ${navalData.lon?.toFixed(3) || 0}°</span>
            </div>
        </div>
        <div class="naval-popup-source">Source: OpenStreetMap</div>
    `;

    popup.className = 'naval-popup visible';
    positionPopupAtEvent(popup, event);
}

function hideNavalPopup() {
    const popup = document.getElementById('navalPopup');
    if (popup) popup.classList.remove('visible');
}

// Flight popup
function showFlightPopupDirect(event, flightData) {
    if (event?.stopPropagation) event.stopPropagation();
    hideAllPopups();

    const popup = document.getElementById('flightPopup');
    if (!popup) return;

    const altitudeFt = flightData.altitude ? Math.round(flightData.altitude * 3.281) : 0;
    const velocityKnots = flightData.velocity ? Math.round(flightData.velocity * 1.944) : 0;
    const verticalFpm = flightData.verticalRate ? Math.round(flightData.verticalRate * 196.85) : 0;
    const lastUpdate = flightData.lastUpdate ? new Date(flightData.lastUpdate * 1000).toLocaleTimeString() : 'N/A';

    popup.innerHTML = `
        <button class="flight-popup-close" onclick="hideFlightPopup()">&times;</button>
        <div class="flight-popup-header">
            <span class="flight-popup-icon">✈</span>
            <span class="flight-popup-callsign">${escapeHtml(flightData.callsign)}</span>
            <span class="flight-popup-country">${escapeHtml(flightData.originCountry)}</span>
        </div>
        <div class="flight-popup-info">
            <div class="flight-popup-stat">
                <span class="flight-popup-stat-label">Altitude</span>
                <span class="flight-popup-stat-value">${altitudeFt.toLocaleString()} ft</span>
            </div>
            <div class="flight-popup-stat">
                <span class="flight-popup-stat-label">Speed</span>
                <span class="flight-popup-stat-value">${velocityKnots} kts</span>
            </div>
            <div class="flight-popup-stat">
                <span class="flight-popup-stat-label">Heading</span>
                <span class="flight-popup-stat-value">${Math.round(flightData.heading || 0)}°</span>
            </div>
            <div class="flight-popup-stat">
                <span class="flight-popup-stat-label">Vertical</span>
                <span class="flight-popup-stat-value">${verticalFpm > 0 ? '+' : ''}${verticalFpm} fpm</span>
            </div>
            <div class="flight-popup-stat">
                <span class="flight-popup-stat-label">ICAO24</span>
                <span class="flight-popup-stat-value">${escapeHtml(flightData.icao24 || 'N/A')}</span>
            </div>
            <div class="flight-popup-stat">
                <span class="flight-popup-stat-label">Last Update</span>
                <span class="flight-popup-stat-value">${lastUpdate}</span>
            </div>
        </div>
        <div class="flight-popup-source">Source: OpenSky Network</div>
    `;

    popup.className = 'flight-popup visible';
    positionPopupAtEvent(popup, event);
}

function hideFlightPopup() {
    const popup = document.getElementById('flightPopup');
    if (popup) popup.classList.remove('visible');
}
