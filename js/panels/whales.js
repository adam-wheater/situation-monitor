// Whale watch panel (crypto large transactions)

function renderWhaleWatch(whales) {
    const panel = document.getElementById('whalePanel');
    const count = document.getElementById('whaleCount');

    if (!panel) return;

    if (!whales || whales.length === 0) {
        panel.innerHTML = '<div class="error-msg">No whale transactions detected</div>';
        if (count) count.textContent = '0';
        return;
    }

    if (count) count.textContent = whales.length;

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
}
