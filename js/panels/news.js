// News rendering for politics, tech, finance, gov panels

function renderNews(panelId, countId, items) {
    const panel = document.getElementById(panelId);
    const count = document.getElementById(countId);

    if (!panel) return;

    if (items.length === 0) {
        panel.innerHTML = '<div class="loading-msg">No news available</div>';
        if (count) count.textContent = '-';
        return;
    }

    if (count) count.textContent = items.length;

    panel.innerHTML = items.map(item => `
        <div class="news-item ${item.isAlert ? 'alert' : ''}">
            <div class="news-source">${escapeHtml(item.source || '')}</div>
            <a class="news-title item-title" href="${item.link || '#'}" target="_blank">${escapeHtml(item.title)}</a>
            <div class="news-time">${formatTimeAgo(item.pubDate)}</div>
        </div>
    `).join('');
}
