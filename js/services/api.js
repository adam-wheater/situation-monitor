// External API services (Congress trades, Whales, Polymarket, etc.)

async function fetchCongressTrades() {
    try {
        const url = 'https://house-stock-watcher-data.s3-us-west-2.amazonaws.com/data/all_transactions.json';
        const data = await fetchWithProxy(url, { responseType: 'json', accept: 'application/json, */*' });

        if (!Array.isArray(data)) return [];

        const sorted = data
            .filter(t => t && t.disclosure_date)
            .sort((a, b) => new Date(b.disclosure_date) - new Date(a.disclosure_date))
            .slice(0, 15);

        return sorted.map(t => ({
            rep: t.representative || 'Unknown',
            party: t.party || '',
            ticker: t.ticker || '-',
            type: t.type || 'Unknown',
            amount: t.amount || '-',
            date: t.disclosure_date || '',
            description: t.asset_description || ''
        }));
    } catch (error) {
        console.error('Error fetching Congress trades:', error);
        return [];
    }
}

async function fetchWhaleTransactions() {
    try {
        // Use whale-alert or similar API - for now using placeholder
        const url = 'https://api.whale-alert.io/v1/transactions?api_key=demo&min_value=1000000&limit=10';
        const data = await fetchWithProxy(url, { responseType: 'json', tryDirect: true, accept: 'application/json, */*' });

        if (!data?.transactions) return [];

        return data.transactions.map(tx => ({
            blockchain: tx.blockchain || 'Unknown',
            symbol: tx.symbol || 'Unknown',
            amount: tx.amount || 0,
            amountUsd: tx.amount_usd || 0,
            from: tx.from?.owner_type || 'unknown',
            to: tx.to?.owner_type || 'unknown',
            timestamp: tx.timestamp ? new Date(tx.timestamp * 1000).toISOString() : ''
        }));
    } catch (error) {
        console.error('Error fetching whale transactions:', error);
        return [];
    }
}

async function fetchGovContracts() {
    try {
        const today = new Date();
        const startDate = new Date(today);
        startDate.setDate(startDate.getDate() - 7);

        const url = `https://api.usaspending.gov/api/v2/search/spending_by_award/?limit=15`;
        const data = await fetchWithProxy(url, {
            responseType: 'json',
            accept: 'application/json, */*',
            fetchInit: {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    filters: {
                        time_period: [{
                            start_date: startDate.toISOString().split('T')[0],
                            end_date: today.toISOString().split('T')[0]
                        }],
                        award_type_codes: ['A', 'B', 'C', 'D']
                    },
                    fields: ['Award ID', 'Recipient Name', 'Award Amount', 'Awarding Agency', 'Description'],
                    sort: 'Award Amount',
                    order: 'desc'
                })
            }
        });

        if (!data?.results) return [];

        return data.results.map(c => ({
            id: c['Award ID'] || '',
            recipient: c['Recipient Name'] || 'Unknown',
            amount: c['Award Amount'] || 0,
            agency: c['Awarding Agency'] || '',
            description: c['Description'] || ''
        }));
    } catch (error) {
        console.error('Error fetching gov contracts:', error);
        return [];
    }
}

async function fetchPolymarket() {
    try {
        const url = 'https://gamma-api.polymarket.com/markets?limit=15&active=true&closed=false';
        const data = await fetchWithProxy(url, { responseType: 'json', tryDirect: true, accept: 'application/json, */*' });

        if (!Array.isArray(data)) return [];

        return data.slice(0, 15).map(m => ({
            question: m.question || 'Unknown',
            outcomePrices: m.outcomePrices || [],
            outcomes: m.outcomes || [],
            volume: m.volume || 0,
            liquidity: m.liquidity || 0,
            endDate: m.endDate || ''
        }));
    } catch (error) {
        console.error('Error fetching Polymarket:', error);
        return [];
    }
}

async function fetchFedBalance() {
    try {
        const url = 'https://api.fiscaldata.treasury.gov/services/api/fiscal_service/v2/accounting/od/avg_interest_rates?sort=-record_date&page[size]=1';
        const data = await fetchWithProxy(url, { responseType: 'json', accept: 'application/json, */*' });

        // Return placeholder data structure for now
        return {
            totalAssets: null,
            treasurySecurities: null,
            mbs: null,
            lastUpdated: data?.data?.[0]?.record_date || ''
        };
    } catch (error) {
        console.error('Error fetching Fed balance:', error);
        return null;
    }
}

async function fetchEarthquakes() {
    try {
        const url = 'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/4.5_week.geojson';
        const data = await fetchWithProxy(url, { responseType: 'json', tryDirect: true, accept: 'application/json, */*' });

        if (!data?.features) return [];

        return data.features.slice(0, 20).map(f => ({
            id: f.id,
            mag: f.properties?.mag || 0,
            place: f.properties?.place || 'Unknown',
            time: f.properties?.time ? new Date(f.properties.time).toISOString() : '',
            lat: f.geometry?.coordinates?.[1] || 0,
            lon: f.geometry?.coordinates?.[0] || 0,
            depth: f.geometry?.coordinates?.[2] || 0,
            url: f.properties?.url || ''
        }));
    } catch (error) {
        console.error('Error fetching earthquakes:', error);
        return [];
    }
}

async function fetchLayoffs() {
    // Layoffs data would typically come from layoffs.fyi or similar
    // For now returning empty array as placeholder
    return [];
}
