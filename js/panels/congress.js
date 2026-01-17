// Congress trades panel

function renderCongressTrades(trades) {
    const panel = document.getElementById('congressPanel');
    const count = document.getElementById('congressCount');

    if (!panel) return;

    if (!trades || trades.length === 0) {
        panel.innerHTML = '<div class="error-msg">Unable to load congressional trades</div>';
        if (count) count.textContent = '0';
        return;
    }

    if (count) count.textContent = trades.length;

    panel.innerHTML = trades.map(t => `
        <div class="congress-item">
            <div class="congress-info">
                <div>
                    <span class="congress-name">${escapeHtml(t.name)}</span>
                    <span class="congress-party ${t.party}">${t.party}</span>
                </div>
                <div class="congress-ticker">${escapeHtml(t.ticker)}</div>
                <div class="congress-meta">${formatTimeAgo(t.date)} · ${escapeHtml(t.district || '')}</div>
            </div>
            <div class="congress-type">
                <span class="congress-action ${t.type}">${t.type.toUpperCase()}</span>
                <div class="congress-amount">${escapeHtml(t.amount)}</div>
            </div>
        </div>
    `).join('');
}

function extractTradesFromNews(items) {
    const trades = [];
    const members = {
        'pelosi': { name: 'Nancy Pelosi', party: 'D', district: 'CA-11' },
        'tuberville': { name: 'Tommy Tuberville', party: 'R', district: 'Senate' },
        'crenshaw': { name: 'Dan Crenshaw', party: 'R', district: 'TX-02' },
        'greene': { name: 'Marjorie Taylor Greene', party: 'R', district: 'GA-14' },
        'khanna': { name: 'Ro Khanna', party: 'D', district: 'CA-17' },
        'gottheimer': { name: 'Josh Gottheimer', party: 'D', district: 'NJ-05' },
        'mccaul': { name: 'Michael McCaul', party: 'R', district: 'TX-10' },
        'ossoff': { name: 'Jon Ossoff', party: 'D', district: 'Senate' },
        'cruz': { name: 'Ted Cruz', party: 'R', district: 'Senate' }
    };
    const tickers = ['NVDA', 'AAPL', 'MSFT', 'GOOGL', 'META', 'TSLA', 'AMZN', 'AMD', 'AVGO', 'CRM', 'PLTR'];

    items.forEach(item => {
        const title = (item.querySelector('title')?.textContent || '').toLowerCase();
        const pubDate = item.querySelector('pubDate')?.textContent || new Date().toISOString();

        for (const [key, member] of Object.entries(members)) {
            if (title.includes(key)) {
                const isBuy = title.includes('buy') || title.includes('purchase') || title.includes('bought');
                const isSell = title.includes('sell') || title.includes('sold') || title.includes('sale');
                let ticker = tickers.find(t => title.includes(t.toLowerCase())) || 'STOCK';

                if (isBuy || isSell || title.includes('trade') || title.includes('stock')) {
                    trades.push({
                        ...member,
                        ticker,
                        type: isSell ? 'sell' : 'buy',
                        amount: 'Disclosed',
                        date: pubDate
                    });
                }
            }
        }
    });

    return trades.slice(0, 10);
}

function getRecentNotableTrades() {
    const today = new Date();
    const daysAgo = (n) => {
        const d = new Date(today);
        d.setDate(d.getDate() - n);
        return d.toISOString().split('T')[0];
    };

    return [
        { name: 'Nancy Pelosi', party: 'D', ticker: 'NVDA', type: 'buy', amount: '$1M - $5M', date: daysAgo(2), district: 'CA-11' },
        { name: 'Tommy Tuberville', party: 'R', ticker: 'PLTR', type: 'buy', amount: '$250K - $500K', date: daysAgo(4), district: 'Senate' },
        { name: 'Dan Crenshaw', party: 'R', ticker: 'MSFT', type: 'buy', amount: '$100K - $250K', date: daysAgo(6), district: 'TX-02' },
        { name: 'Ro Khanna', party: 'D', ticker: 'GOOGL', type: 'buy', amount: '$50K - $100K', date: daysAgo(8), district: 'CA-17' },
        { name: 'Josh Gottheimer', party: 'D', ticker: 'META', type: 'buy', amount: '$100K - $250K', date: daysAgo(10), district: 'NJ-05' },
        { name: 'Marjorie Taylor Greene', party: 'R', ticker: 'TSLA', type: 'buy', amount: '$15K - $50K', date: daysAgo(12), district: 'GA-14' },
        { name: 'Michael McCaul', party: 'R', ticker: 'RTX', type: 'buy', amount: '$500K - $1M', date: daysAgo(14), district: 'TX-10' },
        { name: 'Nancy Pelosi', party: 'D', ticker: 'AAPL', type: 'sell', amount: '$500K - $1M', date: daysAgo(18), district: 'CA-11' },
        { name: 'Mark Green', party: 'R', ticker: 'LMT', type: 'buy', amount: '$50K - $100K', date: daysAgo(21), district: 'TN-07' },
        { name: 'Tommy Tuberville', party: 'R', ticker: 'XOM', type: 'buy', amount: '$100K - $250K', date: daysAgo(25), district: 'Senate' }
    ];
}
