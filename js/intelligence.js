// intelligence.js - Correlation engine, narrative tracker, analysis functions

import { CORRELATION_TOPICS, NARRATIVE_PATTERNS, SOURCE_TYPES, ALERT_KEYWORDS, REGION_KEYWORDS, TOPIC_KEYWORDS } from './constants.js';
import { isPanelEnabled } from './panels.js';

// Track historical topic counts for momentum analysis
let topicHistory = {};
let lastCorrelationUpdate = 0;

// Track narratives history for crossover detection
let narrativeHistory = {};

// Analyze correlations across all news
export function analyzeCorrelations(allNews) {
    if (!allNews || allNews.length === 0) return null;

    const now = Date.now();
    const results = {
        emergingPatterns: [],
        momentumSignals: [],
        crossSourceCorrelations: [],
        predictiveSignals: []
    };

    const topicCounts = {};
    const topicSources = {};
    const topicHeadlines = {};

    allNews.forEach(item => {
        const title = item.title || '';
        const source = item.source || 'Unknown';

        CORRELATION_TOPICS.forEach(topic => {
            const matches = topic.patterns.some(p => p.test(title));
            if (matches) {
                if (!topicCounts[topic.id]) {
                    topicCounts[topic.id] = 0;
                    topicSources[topic.id] = new Set();
                    topicHeadlines[topic.id] = [];
                }
                topicCounts[topic.id]++;
                topicSources[topic.id].add(source);
                if (topicHeadlines[topic.id].length < 5) {
                    topicHeadlines[topic.id].push({ title, link: item.link, source });
                }
            }
        });
    });

    // Calculate momentum by comparing to history
    const currentTime = Math.floor(now / 60000);
    if (!topicHistory[currentTime]) {
        topicHistory[currentTime] = { ...topicCounts };
        Object.keys(topicHistory).forEach(t => {
            if (currentTime - parseInt(t) > 30) delete topicHistory[t];
        });
    }

    // Emerging Patterns
    CORRELATION_TOPICS.forEach(topic => {
        const count = topicCounts[topic.id] || 0;
        if (count >= 3) {
            const sources = topicSources[topic.id] ? Array.from(topicSources[topic.id]) : [];
            const level = count >= 8 ? 'high' : count >= 5 ? 'elevated' : 'emerging';
            results.emergingPatterns.push({
                id: topic.id,
                name: topic.id.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
                category: topic.category,
                count,
                level,
                sources,
                headlines: topicHeadlines[topic.id] || []
            });
        }
    });

    results.emergingPatterns.sort((a, b) => b.count - a.count);

    // Momentum Signals
    const oldTime = currentTime - 10;
    const oldCounts = topicHistory[oldTime] || {};

    CORRELATION_TOPICS.forEach(topic => {
        const current = topicCounts[topic.id] || 0;
        const old = oldCounts[topic.id] || 0;
        const delta = current - old;

        if (delta >= 2 || (current >= 3 && delta >= 1)) {
            const momentum = delta >= 4 ? 'surging' : delta >= 2 ? 'rising' : 'stable';
            results.momentumSignals.push({
                id: topic.id,
                name: topic.id.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
                category: topic.category,
                current,
                delta,
                momentum,
                headlines: topicHeadlines[topic.id] || []
            });
        }
    });

    results.momentumSignals.sort((a, b) => b.delta - a.delta);

    // Cross-Source Correlations
    CORRELATION_TOPICS.forEach(topic => {
        const sources = topicSources[topic.id] ? Array.from(topicSources[topic.id]) : [];
        if (sources.length >= 3) {
            results.crossSourceCorrelations.push({
                id: topic.id,
                name: topic.id.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
                category: topic.category,
                sourceCount: sources.length,
                sources,
                level: sources.length >= 5 ? 'high' : sources.length >= 4 ? 'elevated' : 'emerging',
                headlines: topicHeadlines[topic.id] || []
            });
        }
    });

    results.crossSourceCorrelations.sort((a, b) => b.sourceCount - a.sourceCount);

    // Predictive Signals
    CORRELATION_TOPICS.forEach(topic => {
        const count = topicCounts[topic.id] || 0;
        const sources = topicSources[topic.id] ? topicSources[topic.id].size : 0;
        const delta = (topicCounts[topic.id] || 0) - (oldCounts[topic.id] || 0);
        const score = (count * 2) + (sources * 3) + (delta * 5);

        if (score >= 15) {
            const confidence = Math.min(95, Math.round(score * 1.5));
            let prediction = '';

            if (topic.id === 'tariffs' && count >= 4) {
                prediction = 'Market volatility likely in next 24-48h';
            } else if (topic.id === 'fed-rates') {
                prediction = 'Expect increased financial sector coverage';
            } else if (topic.id.includes('china') || topic.id.includes('russia')) {
                prediction = 'Geopolitical escalation narrative forming';
            } else if (topic.id === 'layoffs') {
                prediction = 'Employment concerns may dominate news cycle';
            } else if (topic.category === 'Conflict') {
                prediction = 'Breaking developments likely within hours';
            } else {
                prediction = 'Topic gaining mainstream traction';
            }

            results.predictiveSignals.push({
                id: topic.id,
                name: topic.id.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
                category: topic.category,
                score,
                confidence,
                prediction,
                level: confidence >= 70 ? 'high' : confidence >= 50 ? 'medium' : 'low',
                headlines: topicHeadlines[topic.id] || []
            });
        }
    });

    results.predictiveSignals.sort((a, b) => b.score - a.score);

    return results;
}

// Render the Correlation Engine panel
export function renderCorrelationEngine(correlations) {
    if (!isPanelEnabled('correlation')) return;

    const statusEl = document.getElementById('correlationStatus');

    if (!correlations) {
        statusEl.textContent = 'NO DATA';
        return;
    }

    const totalSignals = correlations.emergingPatterns.length +
                        correlations.momentumSignals.length +
                        correlations.predictiveSignals.length;

    statusEl.textContent = totalSignals > 0 ? `${totalSignals} SIGNALS` : 'MONITORING';

    // Render Emerging Patterns
    const emergingEl = document.getElementById('emergingPatterns');
    if (correlations.emergingPatterns.length > 0) {
        emergingEl.innerHTML = correlations.emergingPatterns.slice(0, 4).map(p => `
            <div class="correlation-item ${p.level}">
                <div class="correlation-item-header">
                    <span class="correlation-topic">${p.name}</span>
                    <span class="correlation-score ${p.level}">${p.count} mentions</span>
                </div>
                <div class="correlation-meta">${p.category} • ${p.sources.length} sources</div>
                <div class="correlation-sources">
                    ${p.sources.slice(0, 4).map(s => `<span class="correlation-source-tag">${s}</span>`).join('')}
                </div>
            </div>
        `).join('');
    } else {
        emergingEl.innerHTML = '<div class="no-correlations">No emerging patterns detected</div>';
    }

    // Render Momentum Signals
    const momentumEl = document.getElementById('momentumSignals');
    if (correlations.momentumSignals.length > 0) {
        momentumEl.innerHTML = correlations.momentumSignals.slice(0, 4).map(m => `
            <div class="correlation-item ${m.momentum === 'surging' ? 'high' : m.momentum === 'rising' ? 'elevated' : ''}">
                <div class="correlation-item-header">
                    <span class="correlation-topic">${m.name}</span>
                    <span class="momentum-indicator ${m.momentum}">
                        ${m.momentum === 'surging' ? '🚀' : m.momentum === 'rising' ? '📈' : '➡️'}
                        ${m.momentum.toUpperCase()}
                    </span>
                </div>
                <div class="correlation-meta">${m.category} • ${m.current} now (+${m.delta} in 10m)</div>
                ${m.headlines.length > 0 ? `
                    <div class="correlation-headlines">
                        ${m.headlines.slice(0, 2).map(h => `
                            <div class="correlation-headline">
                                <a href="${h.link}" target="_blank">${h.title.substring(0, 60)}...</a>
                            </div>
                        `).join('')}
                    </div>
                ` : ''}
            </div>
        `).join('');
    } else {
        momentumEl.innerHTML = '<div class="no-correlations">No momentum signals detected</div>';
    }

    // Render Cross-Source Correlations
    const crossEl = document.getElementById('crossSourceCorrelations');
    if (correlations.crossSourceCorrelations.length > 0) {
        crossEl.innerHTML = correlations.crossSourceCorrelations.slice(0, 4).map(c => `
            <div class="correlation-item ${c.level}">
                <div class="correlation-item-header">
                    <span class="correlation-topic">${c.name}</span>
                    <span class="correlation-score ${c.level}">${c.sourceCount} sources</span>
                </div>
                <div class="correlation-meta">${c.category} • Multi-outlet coverage</div>
                <div class="correlation-sources">
                    ${c.sources.slice(0, 5).map(s => `<span class="correlation-source-tag">${s}</span>`).join('')}
                </div>
            </div>
        `).join('');
    } else {
        crossEl.innerHTML = '<div class="no-correlations">No cross-source correlations</div>';
    }

    // Render Predictive Signals
    const predictEl = document.getElementById('predictiveSignals');
    if (correlations.predictiveSignals.length > 0) {
        predictEl.innerHTML = correlations.predictiveSignals.slice(0, 4).map(p => `
            <div class="correlation-item ${p.level}">
                <div class="correlation-item-header">
                    <span class="correlation-topic">${p.name}</span>
                    <span class="correlation-score ${p.level}">${p.confidence}%</span>
                </div>
                <div class="correlation-meta">${p.prediction}</div>
                <div class="prediction-confidence">
                    <div class="confidence-bar">
                        <div class="confidence-fill ${p.level}" style="width: ${p.confidence}%"></div>
                    </div>
                    <span class="confidence-label">confidence</span>
                </div>
            </div>
        `).join('');
    } else {
        predictEl.innerHTML = '<div class="no-correlations">Gathering data for predictions...</div>';
    }
}

// Analyze narratives
export function analyzeNarratives(allNews) {
    if (!allNews || allNews.length === 0) return null;

    const now = Date.now();
    const results = {
        emergingFringe: [],
        fringeToMainstream: [],
        narrativeWatch: [],
        disinfoSignals: []
    };

    NARRATIVE_PATTERNS.forEach(narrative => {
        const matches = [];
        const sourceMatches = { fringe: [], alternative: [], mainstream: [] };

        allNews.forEach(item => {
            const title = (item.title || '').toLowerCase();
            const source = (item.source || '').toLowerCase();

            const hasMatch = narrative.keywords.some(kw => title.includes(kw.toLowerCase()));
            if (hasMatch) {
                matches.push(item);

                for (const [type, sources] of Object.entries(SOURCE_TYPES)) {
                    if (sources.some(s => source.includes(s))) {
                        sourceMatches[type].push(item);
                        break;
                    }
                }
            }
        });

        if (matches.length === 0) return;

        if (!narrativeHistory[narrative.id]) {
            narrativeHistory[narrative.id] = { firstSeen: now, sources: new Set() };
        }
        matches.forEach(m => narrativeHistory[narrative.id].sources.add(m.source));

        const narrativeData = {
            id: narrative.id,
            name: narrative.id.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
            category: narrative.category,
            severity: narrative.severity,
            count: matches.length,
            fringeCount: sourceMatches.fringe.length,
            mainstreamCount: sourceMatches.mainstream.length,
            sources: [...new Set(matches.map(m => m.source))].slice(0, 5),
            headlines: matches.slice(0, 3),
            keywords: narrative.keywords
        };

        if (sourceMatches.mainstream.length > 0 && sourceMatches.fringe.length > 0) {
            results.fringeToMainstream.push({
                ...narrativeData,
                status: 'crossing',
                crossoverLevel: sourceMatches.mainstream.length / matches.length
            });
        } else if (narrative.severity === 'disinfo') {
            results.disinfoSignals.push(narrativeData);
        } else if (sourceMatches.fringe.length > 0 || sourceMatches.alternative.length > 0) {
            results.emergingFringe.push(narrativeData);
        } else {
            results.narrativeWatch.push(narrativeData);
        }
    });

    results.emergingFringe.sort((a, b) => b.count - a.count);
    results.fringeToMainstream.sort((a, b) => b.crossoverLevel - a.crossoverLevel);
    results.narrativeWatch.sort((a, b) => b.count - a.count);
    results.disinfoSignals.sort((a, b) => b.count - a.count);

    return results;
}

// Render narrative tracker
export function renderNarrativeTracker(narratives) {
    if (!isPanelEnabled('narrative')) return;

    const statusEl = document.getElementById('narrativeStatus');
    if (!narratives) {
        if (statusEl) statusEl.textContent = 'NO DATA';
        return;
    }

    const total = narratives.emergingFringe.length + narratives.fringeToMainstream.length +
                 narratives.narrativeWatch.length + narratives.disinfoSignals.length;
    if (statusEl) statusEl.textContent = `${total} ACTIVE`;

    // Render Emerging Fringe
    const fringeEl = document.getElementById('emergingFringe');
    if (fringeEl) {
        if (narratives.emergingFringe.length > 0) {
            fringeEl.innerHTML = narratives.emergingFringe.slice(0, 4).map(n => `
                <div class="narrative-item ${n.count >= 5 ? 'viral' : n.count >= 3 ? 'spreading' : 'emerging'}">
                    <div class="narrative-header">
                        <span class="narrative-title">${n.name}</span>
                        <span class="narrative-badge ${n.count >= 5 ? 'viral' : n.count >= 3 ? 'spreading' : 'emerging'}">
                            ${n.count >= 5 ? 'VIRAL' : n.count >= 3 ? 'SPREADING' : 'EMERGING'}
                        </span>
                    </div>
                    <div class="narrative-description">${n.category} • ${n.count} mentions</div>
                    <div class="narrative-sources">
                        ${n.sources.map(s => `<span class="narrative-source-tag">${s}</span>`).join('')}
                    </div>
                </div>
            `).join('');
        } else {
            fringeEl.innerHTML = '<div class="no-narratives">No fringe narratives detected</div>';
        }
    }

    // Render Fringe to Mainstream
    const crossEl = document.getElementById('fringeToMainstream');
    if (crossEl) {
        if (narratives.fringeToMainstream.length > 0) {
            crossEl.innerHTML = narratives.fringeToMainstream.slice(0, 4).map(n => `
                <div class="narrative-item spreading">
                    <div class="narrative-header">
                        <span class="narrative-title">${n.name}</span>
                        <span class="narrative-badge spreading">CROSSING</span>
                    </div>
                    <div class="narrative-description">${n.category} • ${Math.round(n.crossoverLevel * 100)}% mainstream coverage</div>
                    <div class="narrative-crossover">
                        <span class="crossover-source fringe">Fringe (${n.fringeCount})</span>
                        <span class="crossover-arrow">→</span>
                        <span class="crossover-source mainstream">Mainstream (${n.mainstreamCount})</span>
                    </div>
                </div>
            `).join('');
        } else {
            crossEl.innerHTML = '<div class="no-narratives">No crossover narratives detected</div>';
        }
    }

    // Render Narrative Watch
    const watchEl = document.getElementById('narrativeWatch');
    if (watchEl) {
        if (narratives.narrativeWatch.length > 0) {
            watchEl.innerHTML = narratives.narrativeWatch.slice(0, 4).map(n => `
                <div class="narrative-item watch">
                    <div class="narrative-header">
                        <span class="narrative-title">${n.name}</span>
                        <span class="narrative-badge emerging">${n.count}</span>
                    </div>
                    <div class="narrative-description">${n.category}</div>
                    <div class="narrative-metrics">
                        <span class="narrative-metric">Sources: <span class="narrative-metric-value">${n.sources.length}</span></span>
                    </div>
                </div>
            `).join('');
        } else {
            watchEl.innerHTML = '<div class="no-narratives">No narratives on watch</div>';
        }
    }

    // Render Disinfo Signals
    const disinfoEl = document.getElementById('disinfoSignals');
    if (disinfoEl) {
        if (narratives.disinfoSignals.length > 0) {
            disinfoEl.innerHTML = narratives.disinfoSignals.slice(0, 4).map(n => `
                <div class="narrative-item disinfo">
                    <div class="narrative-header">
                        <span class="narrative-title">${n.name}</span>
                        <span class="narrative-badge disinfo">⚠ DISINFO</span>
                    </div>
                    <div class="narrative-description">${n.category} • Known disinformation pattern</div>
                    <div class="narrative-metrics">
                        <span class="narrative-metric">Mentions: <span class="narrative-metric-value">${n.count}</span></span>
                    </div>
                </div>
            `).join('');
        } else {
            disinfoEl.innerHTML = '<div class="no-narratives">No disinfo signals detected</div>';
        }
    }
}

// Calculate "Main Character" from news headlines
export function calculateMainCharacter(allNews) {
    const namePatterns = [
        { pattern: /\btrump\b/gi, name: 'Trump' },
        { pattern: /\bbiden\b/gi, name: 'Biden' },
        { pattern: /\belon\b|\bmusk\b/gi, name: 'Elon Musk' },
        { pattern: /\bputin\b/gi, name: 'Putin' },
        { pattern: /\bzelensky\b/gi, name: 'Zelensky' },
        { pattern: /\bxi\s*jinping\b|\bxi\b/gi, name: 'Xi Jinping' },
        { pattern: /\bnetanyahu\b/gi, name: 'Netanyahu' },
        { pattern: /\bsam\s*altman\b/gi, name: 'Sam Altman' },
        { pattern: /\bmark\s*zuckerberg\b|\bzuckerberg\b/gi, name: 'Zuckerberg' },
        { pattern: /\bjeff\s*bezos\b|\bbezos\b/gi, name: 'Bezos' },
        { pattern: /\btim\s*cook\b/gi, name: 'Tim Cook' },
        { pattern: /\bsatya\s*nadella\b|\bnadella\b/gi, name: 'Satya Nadella' },
        { pattern: /\bsundar\s*pichai\b|\bpichai\b/gi, name: 'Sundar Pichai' },
        { pattern: /\bwarren\s*buffett\b|\bbuffett\b/gi, name: 'Warren Buffett' },
        { pattern: /\bjanet\s*yellen\b|\byellen\b/gi, name: 'Janet Yellen' },
        { pattern: /\bjerome\s*powell\b|\bpowell\b/gi, name: 'Jerome Powell' },
        { pattern: /\bkamala\s*harris\b|\bharris\b/gi, name: 'Kamala Harris' },
        { pattern: /\bnancy\s*pelosi\b|\bpelosi\b/gi, name: 'Nancy Pelosi' },
        { pattern: /\bjensen\s*huang\b|\bhuang\b/gi, name: 'Jensen Huang' },
        { pattern: /\bdario\s*amodei\b|\bamodei\b/gi, name: 'Dario Amodei' }
    ];

    const counts = {};

    allNews.forEach(item => {
        const text = item.title.toLowerCase();
        namePatterns.forEach(({ pattern, name }) => {
            const matches = text.match(pattern);
            if (matches) {
                counts[name] = (counts[name] || 0) + matches.length;
            }
        });
    });

    const sorted = Object.entries(counts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10);

    return sorted;
}

// Detect regions from text
export function detectRegions(text) {
    const lower = text.toLowerCase();
    const regions = [];
    for (const [region, keywords] of Object.entries(REGION_KEYWORDS)) {
        if (keywords.some(kw => lower.includes(kw))) {
            regions.push(region);
        }
    }
    return regions;
}

// Detect topics from text
export function detectTopics(text) {
    const lower = text.toLowerCase();
    const topics = [];
    for (const [topic, keywords] of Object.entries(TOPIC_KEYWORDS)) {
        if (keywords.some(kw => lower.includes(kw))) {
            topics.push(topic);
        }
    }
    return topics;
}
