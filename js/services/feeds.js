// RSS/Atom feed fetching and parsing

async function fetchFeed(source) {
    try {
        const text = await fetchWithProxy(source.url);
        const parser = new DOMParser();
        const xml = parser.parseFromString(text, 'text/xml');

        const parseError = xml.querySelector('parsererror');
        if (parseError) {
            console.error(`Parse error for ${source.name}`);
            return [];
        }

        let items = xml.querySelectorAll('item');
        if (items.length === 0) {
            items = xml.querySelectorAll('entry');
        }

        return Array.from(items).slice(0, 5).map(item => {
            let link = '';
            const linkEl = item.querySelector('link');
            if (linkEl) {
                link = linkEl.getAttribute('href') || linkEl.textContent || '';
            }
            link = link.trim();

            const title = (item.querySelector('title')?.textContent || 'No title').trim();
            const pubDate = item.querySelector('pubDate')?.textContent ||
                item.querySelector('published')?.textContent ||
                item.querySelector('updated')?.textContent || '';

            return {
                source: source.name,
                title,
                link,
                pubDate,
                isAlert: hasAlertKeyword(title, ALERT_KEYWORDS)
            };
        });
    } catch (error) {
        console.error(`Error fetching ${source.name}:`, error);
        return [];
    }
}

async function fetchCategory(feeds) {
    const results = await Promise.all(feeds.map(fetchFeed));
    const items = results.flat();

    items.sort((a, b) => {
        // Alerts first, then by date
        if (a.isAlert && !b.isAlert) return -1;
        if (!a.isAlert && b.isAlert) return 1;
        const dateA = new Date(a.pubDate);
        const dateB = new Date(b.pubDate);
        return dateB - dateA;
    });

    return items.slice(0, 20);
}

async function fetchIntelFeed() {
    const results = await Promise.all(INTEL_SOURCES.map(async source => {
        try {
            const items = await fetchFeed(source);
            return items.map(item => ({
                ...item,
                sourceType: source.type,
                topics: source.topics,
                region: source.region
            }));
        } catch (e) {
            console.error(`Error fetching ${source.name}:`, e);
            return [];
        }
    }));

    const items = results.flat();

    // Tag items with regions and topics
    items.forEach(item => {
        const title = (item.title || '').toLowerCase();

        // Region tagging
        for (const [region, keywords] of Object.entries(REGION_KEYWORDS)) {
            if (keywords.some(kw => title.includes(kw))) {
                item.region = item.region || region;
                break;
            }
        }

        // Topic tagging
        item.taggedTopics = [];
        for (const [topic, keywords] of Object.entries(TOPIC_KEYWORDS)) {
            if (keywords.some(kw => title.includes(kw))) {
                item.taggedTopics.push(topic);
            }
        }
    });

    items.sort((a, b) => {
        if (a.isAlert && !b.isAlert) return -1;
        if (!a.isAlert && b.isAlert) return 1;
        const dateA = new Date(a.pubDate);
        const dateB = new Date(b.pubDate);
        return dateB - dateA;
    });

    return items.slice(0, 30);
}

async function fetchAINews() {
    const results = await Promise.all(AI_FEEDS.map(async source => {
        try {
            return await fetchFeed(source);
        } catch (e) {
            console.error(`Error fetching AI feed ${source.name}:`, e);
            return [];
        }
    }));

    const items = results.flat();
    items.sort((a, b) => {
        const dateA = new Date(a.pubDate);
        const dateB = new Date(b.pubDate);
        return dateB - dateA;
    });

    return items.slice(0, 15);
}

async function fetchSituationNews(keywords, situationName) {
    // Search news feeds for situation-specific keywords
    const allFeeds = [...FEEDS.politics, ...FEEDS.gov];
    const results = await Promise.all(allFeeds.map(fetchFeed));
    const allItems = results.flat();

    const matched = allItems.filter(item => {
        const title = (item.title || '').toLowerCase();
        return keywords.some(kw => title.includes(kw.toLowerCase()));
    });

    matched.sort((a, b) => {
        if (a.isAlert && !b.isAlert) return -1;
        if (!a.isAlert && b.isAlert) return 1;
        const dateA = new Date(a.pubDate);
        const dateB = new Date(b.pubDate);
        return dateB - dateA;
    });

    return matched.slice(0, 10);
}
