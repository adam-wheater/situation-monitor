// renderers.js - All panel render functions

import { timeAgo, getRelativeTime, escapeHtml } from './utils.js';
import { isPanelEnabled } from './panels.js';

// Render news items
export function renderNews(items, panelId, countId) {
    const panel = document.getElementById(panelId);
    const count = document.getElementById(countId);

    if (items.length === 0) {
        panel.innerHTML = '<div class="error-msg">Failed to load</div>';
        count.textContent = '0';
        return;
    }

    panel.innerHTML = items.map(item => `
        <div class="item ${item.isAlert ? 'alert' : ''}">
            <div class="item-source">${item.source}${item.isAlert ? '<span class="alert-tag">ALERT</span>' : ''}</div>
            <a class="item-title" href="${item.link}" target="_blank">${item.title}</a>
            <div class="item-time">${timeAgo(item.pubDate)}</div>
        </div>
    `).join('');

    count.textContent = items.length;
}

// Render markets
export function renderMarkets(markets) {
    const panel = document.getElementById('marketsPanel');
    const count = document.getElementById('marketsCount');

    if (markets.length === 0) {
        panel.innerHTML = '<div class="error-msg">Failed to load</div>';
        count.textContent = '0';
        return;
    }

    panel.innerHTML = markets.map(m => {
        const changeClass = m.change > 0 ? 'up' : m.change < 0 ? 'down' : '';
        const changeText = m.change !== null ? `${m.change > 0 ? '+' : ''}${m.change.toFixed(2)}%` : '-';
        const priceDisplay = typeof m.price === 'number' && m.price > 100
            ? m.price.toLocaleString('en-US', { maximumFractionDigits: 0 })
            : m.price?.toFixed(2);

        return `
            <div class="market-item">
                <div>
                    <div class="market-name">${m.name}</div>
                    <div class="market-symbol">${m.symbol}</div>
                </div>
                <div class="market-data">
                    <div class="market-price">$${priceDisplay}</div>
                    <div class="market-change ${changeClass}">${changeText}</div>
                </div>
            </div>
        `;
    }).join('');

    count.textContent = markets.length;
}

// Render sector heatmap
export function renderHeatmap(sectors) {
    const panel = document.getElementById('heatmapPanel');

    if (sectors.length === 0) {
        panel.innerHTML = '<div class="error-msg">Failed to load</div>';
        return;
    }

    panel.innerHTML = '<div class="heatmap">' + sectors.map(s => {
        let colorClass = 'up-0';
        const c = s.change;
        if (c >= 2) colorClass = 'up-3';
        else if (c >= 1) colorClass = 'up-2';
        else if (c >= 0.5) colorClass = 'up-1';
        else if (c >= 0) colorClass = 'up-0';
        else if (c >= -0.5) colorClass = 'down-0';
        else if (c >= -1) colorClass = 'down-1';
        else if (c >= -2) colorClass = 'down-2';
        else colorClass = 'down-3';

        return `
            <div class="heatmap-cell ${colorClass}">
                <div class="sector-name">${s.name}</div>
                <div class="sector-change">${s.change >= 0 ? '+' : ''}${s.change.toFixed(2)}%</div>
            </div>
        `;
    }).join('') + '</div>';
}

// Render commodities
export function renderCommodities(commodities) {
    const panel = document.getElementById('commoditiesPanel');

    if (commodities.length === 0) {
        panel.innerHTML = '<div class="error-msg">Failed to load</div>';
        return;
    }

    panel.innerHTML = commodities.map(m => {
        const changeClass = m.change > 0 ? 'up' : m.change < 0 ? 'down' : '';
        const changeText = `${m.change > 0 ? '+' : ''}${m.change.toFixed(2)}%`;
        const priceDisplay = m.price?.toFixed(2);

        return `
            <div class="market-item">
                <div>
                    <div class="market-name">${m.name}</div>
                    <div class="market-symbol">${m.symbol}</div>
                </div>
                <div class="market-data">
                    <div class="market-price">${m.symbol === 'VIX' ? '' : '$'}${priceDisplay}</div>
                    <div class="market-change ${changeClass}">${changeText}</div>
                </div>
            </div>
        `;
    }).join('');
}

// Render Polymarket predictions
export function renderPolymarket(markets) {
    const panel = document.getElementById('polymarketPanel');
    const count = document.getElementById('polymarketCount');

    if (markets.length === 0) {
        panel.innerHTML = '<div class="error-msg">Failed to load predictions</div>';
        count.textContent = '0';
        return;
    }

    const formatVolume = (v) => {
        if (v >= 1000000) return '$' + (v / 1000000).toFixed(1) + 'M';
        if (v >= 1000) return '$' + (v / 1000).toFixed(0) + 'K';
        return '$' + v.toFixed(0);
    };

    panel.innerHTML = markets.map(m => `
        <div class="prediction-item">
            <div>
                <div class="prediction-question">${m.question}</div>
                <div class="prediction-volume">Vol: ${formatVolume(m.volume)}</div>
            </div>
            <div class="prediction-odds">
                <span class="prediction-yes">${m.yes}%</span>
            </div>
        </div>
    `).join('');

    count.textContent = markets.length;
}

// Render congressional trades
export function renderCongressTrades(trades) {
    const panel = document.getElementById('congressPanel');
    const count = document.getElementById('congressCount');

    if (trades.length === 0) {
        panel.innerHTML = '<div class="error-msg">Unable to load congressional trade news</div>';
        count.textContent = '0';
        return;
    }

    // Check if these are news items (new format) or trades (old format)
    const isNews = trades[0]?.isNews;

    if (isNews) {
        panel.innerHTML = trades.map(t => `
            <div class="congress-item">
                <div class="congress-info" style="width: 100%;">
                    <a href="${t.link}" target="_blank" class="congress-name" style="font-size: 0.65rem; line-height: 1.3; display: block;">
                        ${escapeHtml(t.name)}
                    </a>
                    <div class="congress-meta">${t.date ? timeAgo(t.date) : ''}</div>
                </div>
            </div>
        `).join('');
    } else {
        panel.innerHTML = trades.map(t => `
            <div class="congress-item">
                <div class="congress-info">
                    <div>
                        <span class="congress-name">${escapeHtml(t.name)}</span>
                        <span class="congress-party ${t.party}">${t.party}</span>
                    </div>
                    <div class="congress-ticker">${t.ticker}</div>
                    <div class="congress-meta">${timeAgo(t.date)}${t.district ? ' · ' + t.district : ''}</div>
                </div>
                <div class="congress-type">
                    <span class="congress-action ${t.action}">${t.action}</span>
                    <div class="congress-amount">${t.amount}</div>
                </div>
            </div>
        `).join('');
    }

    count.textContent = trades.length;
}

// Render whale watch
export function renderWhaleWatch(whales) {
    const panel = document.getElementById('whalePanel');
    const count = document.getElementById('whaleCount');

    if (whales.length === 0) {
        panel.innerHTML = '<div class="error-msg">No whale transactions detected</div>';
        count.textContent = '0';
        return;
    }

    const formatAmount = (amt) => amt >= 1000 ? (amt / 1000).toFixed(1) + 'K' : amt.toFixed(2);
    const formatUSD = (usd) => {
        if (usd >= 1000000000) return '$' + (usd / 1000000000).toFixed(1) + 'B';
        if (usd >= 1000000) return '$' + (usd / 1000000).toFixed(1) + 'M';
        return '$' + (usd / 1000).toFixed(0) + 'K';
    };

    panel.innerHTML = whales.map(w => `
        <div class="whale-item">
            <div class="whale-header">
                <span class="whale-coin">${w.coin}</span>
                <span class="whale-amount">${formatAmount(w.amount)} ${w.coin}</span>
            </div>
            <div class="whale-flow">
                <span class="whale-usd">${formatUSD(w.usd)}</span>
                <span class="arrow">→</span>
                <span>${w.hash}</span>
            </div>
        </div>
    `).join('');

    count.textContent = whales.length;
}

// Render main character
export function renderMainCharacter(rankings) {
    const panel = document.getElementById('mainCharPanel');

    if (rankings.length === 0) {
        panel.innerHTML = '<div class="error-msg">No main character detected</div>';
        return;
    }

    const [topName, topCount] = rankings[0];

    panel.innerHTML = `
        <div class="main-char-display">
            <div class="main-char-label">Today's Main Character</div>
            <div class="main-char-name">${topName}</div>
            <div class="main-char-count">${topCount} mentions in headlines</div>

            <div class="main-char-list">
                ${rankings.slice(1, 8).map((r, i) => `
                    <div class="char-row">
                        <span class="rank">${i + 2}.</span>
                        <span class="name">${r[0]}</span>
                        <span class="mentions">${r[1]}</span>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
}

// Render government contracts
export function renderGovContracts(contracts) {
    const panel = document.getElementById('contractsPanel');
    const count = document.getElementById('contractsCount');

    if (contracts.length === 0) {
        panel.innerHTML = '<div class="error-msg">Unable to load contracts</div>';
        count.textContent = '0';
        return;
    }

    const formatValue = (v) => {
        if (v >= 1000000000) return '$' + (v / 1000000000).toFixed(1) + 'B';
        if (v >= 1000000) return '$' + (v / 1000000).toFixed(1) + 'M';
        if (v >= 1000) return '$' + (v / 1000).toFixed(0) + 'K';
        return '$' + v.toFixed(0);
    };

    panel.innerHTML = contracts.map(c => `
        <div class="contract-item">
            <div class="contract-agency">${c.agency}</div>
            <div class="contract-desc">${c.description.substring(0, 100)}${c.description.length > 100 ? '...' : ''}</div>
            <div class="contract-meta">
                <span class="contract-vendor">${c.vendor}</span>
                <span class="contract-value">${formatValue(c.amount)}</span>
            </div>
        </div>
    `).join('');

    count.textContent = contracts.length;
}

// Render AI news
export function renderAINews(items) {
    const panel = document.getElementById('aiPanel');
    const count = document.getElementById('aiCount');

    if (items.length === 0) {
        panel.innerHTML = '<div class="error-msg">Unable to load AI news</div>';
        count.textContent = '0';
        return;
    }

    panel.innerHTML = items.map(item => `
        <div class="ai-item">
            <div class="ai-source">${item.source}</div>
            <a class="ai-title item-title" href="${item.link}" target="_blank">${item.title}</a>
            <div class="ai-date">${timeAgo(item.date)}</div>
        </div>
    `).join('');

    count.textContent = items.length;
}

// Render money printer (Fed balance)
export function renderMoneyPrinter(data) {
    const panel = document.getElementById('printerPanel');

    const isExpanding = data.change > 0;
    const status = isExpanding ? 'PRINTER ON' : 'PRINTER OFF';

    panel.innerHTML = `
        <div class="printer-gauge">
            <div class="printer-label">Federal Reserve Balance Sheet</div>
            <div class="printer-value">
                ${data.value.toFixed(2)}<span class="printer-unit">T USD</span>
            </div>
            <div class="printer-change ${isExpanding ? 'up' : 'down'}">
                ${data.change >= 0 ? '+' : ''}${(data.change * 1000).toFixed(0)}B (${data.changePercent >= 0 ? '+' : ''}${data.changePercent.toFixed(2)}%) WoW
            </div>
            <div class="printer-bar">
                <div class="printer-fill" style="width: ${Math.min(data.percentOfMax, 100)}%"></div>
            </div>
            <div class="printer-status">
                <span class="printer-indicator ${isExpanding ? 'on' : 'off'}"></span>
                ${status}
            </div>
        </div>
    `;
}

// Render Intel Feed panel
export function renderIntelFeed(items) {
    const panel = document.getElementById('intelPanel');
    const count = document.getElementById('intelCount');

    if (!items || items.length === 0) {
        panel.innerHTML = '<div class="loading-msg">No intel available</div>';
        count.textContent = '-';
        return;
    }

    count.textContent = items.length;

    panel.innerHTML = items.map(item => {
        let tagsHTML = '';

        if (item.sourceType === 'osint') {
            tagsHTML += '<span class="intel-tag osint">OSINT</span>';
        } else if (item.sourceType === 'govt') {
            tagsHTML += '<span class="intel-tag govt">GOVT</span>';
        }

        item.regions.slice(0, 2).forEach(r => {
            tagsHTML += `<span class="intel-tag region">${r}</span>`;
        });

        item.topics.slice(0, 2).forEach(t => {
            tagsHTML += `<span class="intel-tag topic">${t}</span>`;
        });

        const timeAgoStr = item.pubDate ? getRelativeTime(new Date(item.pubDate)) : '';

        return `
            <div class="intel-item ${item.isPriority ? 'priority' : ''}">
                <div class="intel-header">
                    <span class="intel-source">${item.source}</span>
                    <div class="intel-tags">${tagsHTML}</div>
                </div>
                <a href="${item.link}" target="_blank" class="intel-title">${item.title}</a>
                <div class="intel-meta">
                    <span>${timeAgoStr}</span>
                </div>
            </div>
        `;
    }).join('');
}

// Render Layoffs panel
export function renderLayoffs(layoffs) {
    const panel = document.getElementById('layoffsPanel');
    const count = document.getElementById('layoffsCount');

    if (!layoffs || layoffs.length === 0) {
        panel.innerHTML = '<div class="loading-msg">No recent layoffs data</div>';
        count.textContent = '-';
        return;
    }

    count.textContent = layoffs.length;

    panel.innerHTML = layoffs.map(l => `
        <div class="layoff-item">
            <div class="layoff-company">${l.company}</div>
            ${l.count ? `<div class="layoff-count">${parseInt(l.count).toLocaleString()} jobs</div>` : ''}
            <div class="layoff-meta">
                <span class="headline">${l.title}</span>
                <span class="time">${timeAgo(l.date)}</span>
            </div>
        </div>
    `).join('');
}

// Render Situation panel (Venezuela or Greenland)
export function renderSituation(panelId, statusId, news, config) {
    const panel = document.getElementById(panelId);
    const status = document.getElementById(statusId);

    if (!panel) return;

    let threatLevel = 'monitoring';
    let threatText = 'MONITORING';

    if (news.length > 0) {
        const recentNews = news.filter(n => {
            const date = new Date(n.pubDate);
            const hoursSince = (Date.now() - date.getTime()) / (1000 * 60 * 60);
            return hoursSince < 24;
        });

        const criticalKeywords = config.criticalKeywords || [];
        const hasCritical = news.some(n =>
            criticalKeywords.some(k => n.title.toLowerCase().includes(k))
        );

        if (hasCritical || recentNews.length >= 3) {
            threatLevel = 'critical';
            threatText = 'CRITICAL';
        } else if (recentNews.length >= 1) {
            threatLevel = 'elevated';
            threatText = 'ELEVATED';
        }
    }

    status.innerHTML = `<span class="situation-status ${threatLevel}">${threatText}</span>`;

    const newsHTML = news.length > 0 ? news.map(n => `
        <div class="situation-item">
            <a href="${n.link}" target="_blank" class="headline">${n.title}</a>
            <div class="meta">${n.source} · ${timeAgo(n.pubDate)}</div>
        </div>
    `).join('') : '<div class="loading-msg">No recent news</div>';

    panel.innerHTML = `
        <div class="situation-header">
            <div class="situation-title">${config.title}</div>
            <div class="situation-subtitle">${config.subtitle}</div>
        </div>
        ${newsHTML}
    `;
}
