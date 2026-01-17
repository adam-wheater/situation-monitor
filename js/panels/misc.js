// Miscellaneous panel renderers (main char, contracts, AI, printer, intel, layoffs, situations)

function renderMainCharacter(rankings) {
    const panel = document.getElementById('mainCharPanel');

    if (!panel) return;

    if (!rankings || rankings.length === 0) {
        panel.innerHTML = '<div class="error-msg">No main character detected</div>';
        return;
    }

    const [topName, topCount] = rankings[0];

    panel.innerHTML = `
        <div class="main-char-display">
            <div class="main-char-label">Today's Main Character</div>
            <div class="main-char-name">${escapeHtml(topName)}</div>
            <div class="main-char-count">${topCount} mentions in headlines</div>
            <div class="main-char-list">
                ${rankings.slice(1, 8).map((r, i) => `
                    <div class="char-row">
                        <span class="rank">${i + 2}.</span>
                        <span class="name">${escapeHtml(r[0])}</span>
                        <span class="mentions">${r[1]}</span>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
}

function renderGovContracts(contracts) {
    const panel = document.getElementById('contractsPanel');
    const count = document.getElementById('contractsCount');

    if (!panel) return;

    if (!contracts || contracts.length === 0) {
        const detail = (window.lastGovContractsError && String(window.lastGovContractsError).trim())
            ? `<div class="loading-msg" style="padding: 0.3rem 0; opacity: 0.9;">${escapeHtml(String(window.lastGovContractsError))}</div>`
            : '';
        const hint = `<div class="loading-msg" style="padding: 0.3rem 0; opacity: 0.9;">Tip: contracts require the local proxy for POST</div>`;
        panel.innerHTML = `<div class="error-msg">Unable to load contracts</div>${detail}${hint}`;
        if (count) count.textContent = '0';
        return;
    }

    if (count) count.textContent = contracts.length;

    const formatValue = (v) => {
        if (v >= 1000000000) return '$' + (v / 1000000000).toFixed(1) + 'B';
        if (v >= 1000000) return '$' + (v / 1000000).toFixed(1) + 'M';
        if (v >= 1000) return '$' + (v / 1000).toFixed(0) + 'K';
        return '$' + v.toFixed(0);
    };

    panel.innerHTML = contracts.map(c => `
        <div class="contract-item">
            <div class="contract-agency">${escapeHtml(c.agency)}</div>
            <div class="contract-desc">${escapeHtml((c.description || '').substring(0, 100))}${(c.description || '').length > 100 ? '...' : ''}</div>
            <div class="contract-meta">
                <span class="contract-vendor">${escapeHtml(c.vendor)}</span>
                <span class="contract-value">${formatValue(c.amount)}</span>
            </div>
        </div>
    `).join('');
}

function renderAINews(items) {
    const panel = document.getElementById('aiPanel');
    const count = document.getElementById('aiCount');

    if (!panel) return;

    if (!items || items.length === 0) {
        panel.innerHTML = '<div class="error-msg">Unable to load AI news</div>';
        if (count) count.textContent = '0';
        return;
    }

    if (count) count.textContent = items.length;

    panel.innerHTML = items.map(item => `
        <div class="ai-item">
            <div class="ai-source">${escapeHtml(item.source)}</div>
            <a class="ai-title item-title" href="${item.link}" target="_blank">${escapeHtml(item.title)}</a>
            <div class="ai-date">${formatTimeAgo(item.date)}</div>
        </div>
    `).join('');
}

function renderMoneyPrinter(data) {
    const panel = document.getElementById('printerPanel');

    if (!panel || !data) return;

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

function renderIntelFeed(items) {
    const panel = document.getElementById('intelPanel');
    const count = document.getElementById('intelCount');

    if (!panel) return;

    if (!items || items.length === 0) {
        panel.innerHTML = '<div class="loading-msg">No intel available</div>';
        if (count) count.textContent = '-';
        return;
    }

    if (count) count.textContent = items.length;

    panel.innerHTML = items.map(item => {
        let tagsHTML = '';

        if (item.sourceType === 'osint') {
            tagsHTML += '<span class="intel-tag osint">OSINT</span>';
        } else if (item.sourceType === 'govt') {
            tagsHTML += '<span class="intel-tag govt">GOVT</span>';
        }

        (item.regions || []).slice(0, 2).forEach(r => {
            tagsHTML += `<span class="intel-tag region">${escapeHtml(r)}</span>`;
        });

        (item.topics || item.taggedTopics || []).slice(0, 2).forEach(t => {
            tagsHTML += `<span class="intel-tag topic">${escapeHtml(t)}</span>`;
        });

        return `
            <div class="intel-item ${item.isPriority ? 'priority' : ''}">
                <div class="intel-header">
                    <span class="intel-source">${escapeHtml(item.source)}</span>
                    <div class="intel-tags">${tagsHTML}</div>
                </div>
                <a href="${item.link}" target="_blank" class="intel-title">${escapeHtml(item.title)}</a>
                <div class="intel-meta">
                    <span>${formatTimeAgo(item.pubDate)}</span>
                </div>
            </div>
        `;
    }).join('');
}

function renderLayoffs(layoffs) {
    const panel = document.getElementById('layoffsPanel');
    const count = document.getElementById('layoffsCount');

    if (!panel) return;

    if (!layoffs || layoffs.length === 0) {
        panel.innerHTML = '<div class="loading-msg">No recent layoffs data</div>';
        if (count) count.textContent = '-';
        return;
    }

    if (count) count.textContent = layoffs.length;

    panel.innerHTML = layoffs.map(l => `
        <div class="layoff-item">
            <div class="layoff-company">${escapeHtml(l.company)}</div>
            ${l.count ? `<div class="layoff-count">${parseInt(l.count).toLocaleString()} jobs</div>` : ''}
            <div class="layoff-meta">
                <span class="headline">${escapeHtml(l.title)}</span>
                <span class="time">${formatTimeAgo(l.date)}</span>
            </div>
        </div>
    `).join('');
}

function renderSituation(panelId, statusId, news, config) {
    const panel = document.getElementById(panelId);
    const status = document.getElementById(statusId);

    if (!panel) return;

    let threatLevel = 'monitoring';
    let threatText = 'MONITORING';

    if (news && news.length > 0) {
        const recentNews = news.filter(n => {
            const date = new Date(n.pubDate);
            const hoursSince = (Date.now() - date.getTime()) / (1000 * 60 * 60);
            return hoursSince < 24;
        });

        const criticalKeywords = config.criticalKeywords || [];
        const hasCritical = news.some(n =>
            criticalKeywords.some(k => (n.title || '').toLowerCase().includes(k))
        );

        if (hasCritical || recentNews.length >= 3) {
            threatLevel = 'critical';
            threatText = 'CRITICAL';
        } else if (recentNews.length >= 1) {
            threatLevel = 'elevated';
            threatText = 'ELEVATED';
        }
    }

    if (status) {
        status.innerHTML = `<span class="situation-status ${threatLevel}">${threatText}</span>`;
    }

    const newsHTML = news && news.length > 0 ? news.map(n => `
        <div class="situation-item">
            <a href="${n.link}" target="_blank" class="headline">${escapeHtml(n.title)}</a>
            <div class="meta">${escapeHtml(n.source)} · ${formatTimeAgo(n.pubDate)}</div>
        </div>
    `).join('') : '<div class="loading-msg">No recent news</div>';

    panel.innerHTML = `
        <div class="situation-header">
            <div class="situation-title">${escapeHtml(config.title)}</div>
            <div class="situation-subtitle">${escapeHtml(config.subtitle)}</div>
        </div>
        ${newsHTML}
    `;
}

function calculateMainCharacter(allNews) {
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
        const text = (item.title || '').toLowerCase();
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
