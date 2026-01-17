// Polymarket prediction markets panel

function renderPolymarket(markets) {
    const panel = document.getElementById('polymarketPanel');
    const count = document.getElementById('polymarketCount');

    if (!panel) return;

    if (!markets || markets.length === 0) {
        panel.innerHTML = '<div class="loading-msg">Loading prediction markets...</div>';
        if (count) count.textContent = '-';
        return;
    }

    if (count) count.textContent = markets.length;

    panel.innerHTML = markets.map(m => {
        const yesPct = m.yes || 0;
        const noPct = 100 - yesPct;
        const volumeFormatted = m.volume >= 1000000
            ? '$' + (m.volume / 1000000).toFixed(1) + 'M'
            : '$' + (m.volume / 1000).toFixed(0) + 'K';

        return `
            <div class="prediction-item">
                <div class="prediction-question">${escapeHtml(m.question)}</div>
                <div class="prediction-bar">
                    <div class="prediction-yes" style="width: ${yesPct}%">
                        <span>YES ${yesPct}%</span>
                    </div>
                    <div class="prediction-no" style="width: ${noPct}%">
                        <span>NO ${noPct}%</span>
                    </div>
                </div>
                <div class="prediction-volume">Vol: ${volumeFormatted}</div>
            </div>
        `;
    }).join('');
}
