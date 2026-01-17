// Markets, heatmap, and commodities panel rendering

function renderMarkets(markets) {
    const panel = document.getElementById('marketsPanel');
    const count = document.getElementById('marketsCount');

    if (!panel) return;

    if (markets.length === 0) {
        panel.innerHTML = '<div class="loading-msg">Loading market data...</div>';
        if (count) count.textContent = '-';
        return;
    }

    if (count) count.textContent = markets.length;

    panel.innerHTML = markets.map(m => {
        const changeClass = m.change >= 0 ? 'up' : 'down';
        const changeSign = m.change >= 0 ? '+' : '';
        return `
            <div class="market-item">
                <div class="market-info">
                    <span class="market-symbol">${m.symbol}</span>
                    <span class="market-name">${m.name}</span>
                </div>
                <div class="market-data">
                    <span class="market-price">${formatPrice(m.price)}</span>
                    <span class="market-change ${changeClass}">${changeSign}${m.change?.toFixed(2) || 0}%</span>
                </div>
            </div>
        `;
    }).join('');
}

function renderHeatmap(sectors) {
    const panel = document.getElementById('heatmapPanel');

    if (!panel) return;

    if (!sectors || sectors.length === 0) {
        panel.innerHTML = '<div class="loading-msg">Loading sector data...</div>';
        return;
    }

    panel.innerHTML = `
        <div class="heatmap">
            ${sectors.map(s => {
                const change = s.change || 0;
                const hue = change >= 0 ? 120 : 0;
                const sat = Math.min(100, Math.abs(change) * 20);
                const light = 20 + Math.min(30, Math.abs(change) * 5);
                const color = `hsl(${hue}, ${sat}%, ${light}%)`;
                const textColor = change >= 0 ? '#00ff88' : '#ff4444';
                const sign = change >= 0 ? '+' : '';

                return `
                    <div class="heatmap-cell" style="background: ${color};">
                        <div class="heatmap-symbol">${s.name}</div>
                        <div class="heatmap-change" style="color: ${textColor};">${sign}${change?.toFixed(2) || 0}%</div>
                    </div>
                `;
            }).join('')}
        </div>
    `;
}

function renderCommodities(commodities) {
    const panel = document.getElementById('commoditiesPanel');
    const count = document.getElementById('commoditiesCount');

    if (!panel) return;

    if (!commodities || commodities.length === 0) {
        panel.innerHTML = '<div class="loading-msg">Loading commodities...</div>';
        if (count) count.textContent = '-';
        return;
    }

    if (count) count.textContent = commodities.length;

    panel.innerHTML = commodities.map(c => {
        const changeClass = c.change >= 0 ? 'up' : 'down';
        const changeSign = c.change >= 0 ? '+' : '';
        return `
            <div class="commodity-item">
                <div class="commodity-info">
                    <span class="commodity-symbol">${c.symbol}</span>
                    <span class="commodity-name">${c.name}</span>
                </div>
                <div class="commodity-data">
                    <span class="commodity-price">${formatPrice(c.price)}</span>
                    <span class="commodity-change ${changeClass}">${changeSign}${c.change?.toFixed(2) || 0}%</span>
                </div>
            </div>
        `;
    }).join('');
}
