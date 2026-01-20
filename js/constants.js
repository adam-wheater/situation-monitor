// Split from index.html inline script
// Contains large constant datasets/config objects

const PANELS = {
            map: { name: 'Global Map', priority: 1 },
            pentagon: { name: 'Pentagon Tracker', priority: 2 },
            politics: { name: 'World / Geopolitical', priority: 1 },
            tech: { name: 'Technology / AI', priority: 1 },
            finance: { name: 'Financial', priority: 1 },
            gov: { name: 'Government / Policy', priority: 2 },
            heatmap: { name: 'Sector Heatmap', priority: 1 },
            markets: { name: 'Markets', priority: 1 },
            monitors: { name: 'My Monitors', priority: 1 },
            commodities: { name: 'Commodities / VIX', priority: 2 },
            polymarket: { name: 'Polymarket', priority: 2 },
            congress: { name: 'Congress Trades', priority: 3 },
            whales: { name: 'Whale Watch', priority: 3 },
            mainchar: { name: 'Main Character', priority: 2 },
            printer: { name: 'Money Printer', priority: 2 },
            contracts: { name: 'Gov Contracts', priority: 3 },
            ai: { name: 'AI Arms Race', priority: 3 },
            layoffs: { name: 'Layoffs Tracker', priority: 3 },
            venezuela: { name: 'Venezuela Situation', priority: 2 },
            greenland: { name: 'Greenland Situation', priority: 2 },
            tbpn: { name: 'TBPN Live', priority: 1 },
            intel: { name: 'Intel Feed', priority: 2 }
        };

const CORS_PROXIES = [
            'https://corsproxy.io/?',
            'https://api.allorigins.win/raw?url='
        ];

const ALERT_KEYWORDS = [
            'war', 'invasion', 'military', 'nuclear', 'sanctions', 'missile',
            'attack', 'troops', 'conflict', 'strike', 'bomb', 'casualties',
            'ceasefire', 'treaty', 'nato', 'coup', 'martial law', 'emergency',
            'assassination', 'terrorist', 'hostage', 'evacuation'
        ];

const FEEDS = {
            politics: [
                { name: 'BBC World', url: 'https://feeds.bbci.co.uk/news/world/rss.xml' },
                { name: 'NPR News', url: 'https://feeds.npr.org/1001/rss.xml' },
                { name: 'Guardian World', url: 'https://www.theguardian.com/world/rss' },
                { name: 'Reuters World', url: 'https://www.reutersagency.com/feed/?taxonomy=best-sectors&post_type=best' }
            ],
            tech: [
                { name: 'Hacker News', url: 'https://hnrss.org/frontpage' },
                { name: 'Ars Technica', url: 'https://feeds.arstechnica.com/arstechnica/technology-lab' },
                { name: 'The Verge', url: 'https://www.theverge.com/rss/index.xml' },
                { name: 'MIT Tech Review', url: 'https://www.technologyreview.com/feed/' },
                { name: 'ArXiv AI', url: 'https://rss.arxiv.org/rss/cs.AI' },
                { name: 'OpenAI Blog', url: 'https://openai.com/blog/rss.xml' }
            ],
            finance: [
                { name: 'CNBC', url: 'https://www.cnbc.com/id/100003114/device/rss/rss.html' },
                { name: 'MarketWatch', url: 'https://feeds.marketwatch.com/marketwatch/topstories' },
                { name: 'Yahoo Finance', url: 'https://finance.yahoo.com/news/rssindex' },
                { name: 'Reuters Business', url: 'https://www.reutersagency.com/feed/?best-topics=business-finance&post_type=best' },
                { name: 'FT', url: 'https://www.ft.com/rss/home' }
            ],
            gov: [
                { name: 'White House', url: 'https://www.whitehouse.gov/feed/' },
                { name: 'Federal Reserve', url: 'https://www.federalreserve.gov/feeds/press_all.xml' },
                { name: 'SEC Announcements', url: 'https://www.sec.gov/news/pressreleases.rss' },
                { name: 'Treasury', url: 'https://home.treasury.gov/system/files/136/treasury-rss.xml' },
                { name: 'State Dept', url: 'https://www.state.gov/rss-feed/press-releases/feed/' }
            ]
        };

const INTEL_SOURCES = [
            // Think Tanks
            { name: 'CSIS', url: 'https://www.csis.org/analysis/feed', type: 'think-tank', topics: ['defense', 'geopolitics'] },
            { name: 'Brookings', url: 'https://www.brookings.edu/feed/', type: 'think-tank', topics: ['policy', 'geopolitics'] },
            { name: 'CFR', url: 'https://www.cfr.org/rss.xml', type: 'think-tank', topics: ['foreign-policy'] },
            // Defense/Security News
            { name: 'Defense One', url: 'https://www.defenseone.com/rss/all/', type: 'defense', topics: ['military', 'defense'] },
            { name: 'War on Rocks', url: 'https://warontherocks.com/feed/', type: 'defense', topics: ['military', 'strategy'] },
            { name: 'Breaking Defense', url: 'https://breakingdefense.com/feed/', type: 'defense', topics: ['military', 'defense'] },
            { name: 'The Drive War Zone', url: 'https://www.thedrive.com/the-war-zone/feed', type: 'defense', topics: ['military'] },
            // Regional Specialists
            { name: 'The Diplomat', url: 'https://thediplomat.com/feed/', type: 'regional', topics: ['asia-pacific'], region: 'APAC' },
            { name: 'Al-Monitor', url: 'https://www.al-monitor.com/rss', type: 'regional', topics: ['middle-east'], region: 'MENA' },
            // OSINT & Investigations
            { name: 'Bellingcat', url: 'https://www.bellingcat.com/feed/', type: 'osint', topics: ['investigation', 'osint'] },
            // Government/Official
            { name: 'DoD News', url: 'https://www.defense.gov/DesktopModules/ArticleCS/RSS.ashx?max=10&ContentType=1&Site=945', type: 'govt', topics: ['military', 'official'] },
            { name: 'State Dept', url: 'https://www.state.gov/rss-feed/press-releases/feed/', type: 'govt', topics: ['diplomacy', 'official'] },
            // Cyber/Security
            { name: 'CISA Alerts', url: 'https://www.cisa.gov/uscert/ncas/alerts.xml', type: 'cyber', topics: ['cyber', 'security'] },
            { name: 'Krebs Security', url: 'https://krebsonsecurity.com/feed/', type: 'cyber', topics: ['cyber', 'security'] }
        ];

const REGION_KEYWORDS = {
            'EUROPE': ['nato', 'eu', 'european', 'ukraine', 'russia', 'germany', 'france', 'uk', 'britain', 'poland'],
            'MENA': ['iran', 'israel', 'saudi', 'syria', 'iraq', 'gaza', 'lebanon', 'yemen', 'houthi', 'middle east'],
            'APAC': ['china', 'taiwan', 'japan', 'korea', 'indo-pacific', 'south china sea', 'asean', 'philippines'],
            'AMERICAS': ['us', 'america', 'canada', 'mexico', 'brazil', 'venezuela', 'latin'],
            'AFRICA': ['africa', 'sahel', 'niger', 'sudan', 'ethiopia', 'somalia']
        };

const TOPIC_KEYWORDS = {
            'CYBER': ['cyber', 'hack', 'ransomware', 'malware', 'breach', 'apt', 'vulnerability'],
            'NUCLEAR': ['nuclear', 'icbm', 'warhead', 'nonproliferation', 'uranium', 'plutonium'],
            'CONFLICT': ['war', 'military', 'troops', 'invasion', 'strike', 'missile', 'combat', 'offensive'],
            'INTEL': ['intelligence', 'espionage', 'spy', 'cia', 'mossad', 'fsb', 'covert'],
            'DEFENSE': ['pentagon', 'dod', 'defense', 'military', 'army', 'navy', 'air force'],
            'DIPLO': ['diplomat', 'embassy', 'treaty', 'sanctions', 'talks', 'summit', 'bilateral']
        };

const SECTORS = [
            { symbol: 'XLK', name: 'Tech' },
            { symbol: 'XLF', name: 'Finance' },
            { symbol: 'XLE', name: 'Energy' },
            { symbol: 'XLV', name: 'Health' },
            { symbol: 'XLY', name: 'Consumer' },
            { symbol: 'XLI', name: 'Industrial' },
            { symbol: 'XLP', name: 'Staples' },
            { symbol: 'XLU', name: 'Utilities' },
            { symbol: 'XLB', name: 'Materials' },
            { symbol: 'XLRE', name: 'Real Est' },
            { symbol: 'XLC', name: 'Comms' },
            { symbol: 'SMH', name: 'Semis' }
        ];

const COMMODITIES = [
            { symbol: '^VIX', name: 'VIX', display: 'VIX' },
            { symbol: 'GC=F', name: 'Gold', display: 'GOLD' },
            { symbol: 'CL=F', name: 'Crude Oil', display: 'OIL' },
            { symbol: 'NG=F', name: 'Natural Gas', display: 'NATGAS' },
            { symbol: 'SI=F', name: 'Silver', display: 'SILVER' },
            { symbol: 'HG=F', name: 'Copper', display: 'COPPER' }
        ];

const US_CITIES = [
            // Capital
            {
                id: 'dc', name: 'Washington D.C.', state: 'DC', lat: 38.9072, lon: -77.0369,
                type: 'capital', population: '700K',
                keywords: ['washington', 'capitol', 'congress', 'white house', 'pentagon', 'dc', 'biden', 'trump'],
                description: 'Federal government center. White House, Capitol Hill, Pentagon, and major federal agencies.',
                sectors: ['Government', 'Defense', 'Policy']
            },
            // Major metros
            {
                id: 'nyc', name: 'New York City', state: 'NY', lat: 40.7128, lon: -74.0060,
                type: 'major', population: '8.3M',
                keywords: ['new york', 'nyc', 'manhattan', 'wall street', 'broadway', 'brooklyn'],
                description: 'Financial capital. Wall Street, major media headquarters, UN headquarters.',
                sectors: ['Finance', 'Media', 'Tech']
            },
            {
                id: 'la', name: 'Los Angeles', state: 'CA', lat: 34.0522, lon: -118.2437,
                type: 'major', population: '3.9M',
                keywords: ['los angeles', 'la', 'hollywood', 'california', 'socal'],
                description: 'Entertainment industry hub. Major port, aerospace, and tech presence.',
                sectors: ['Entertainment', 'Tech', 'Aerospace']
            },
            {
                id: 'chicago', name: 'Chicago', state: 'IL', lat: 41.8781, lon: -87.6298,
                type: 'major', population: '2.7M',
                keywords: ['chicago', 'illinois', 'midwest'],
                description: 'Midwest economic hub. Commodities trading, transportation logistics.',
                sectors: ['Finance', 'Logistics', 'Manufacturing']
            },
            {
                id: 'houston', name: 'Houston', state: 'TX', lat: 29.7604, lon: -95.3698,
                type: 'major', population: '2.3M',
                keywords: ['houston', 'texas', 'energy', 'oil', 'nasa'],
                description: 'Energy capital. Oil & gas headquarters, NASA Johnson Space Center.',
                sectors: ['Energy', 'Aerospace', 'Healthcare']
            },
            {
                id: 'sf', name: 'San Francisco', state: 'CA', lat: 37.7749, lon: -122.4194,
                type: 'major', population: '870K',
                keywords: ['san francisco', 'sf', 'bay area', 'silicon valley', 'tech'],
                description: 'Tech industry epicenter. Venture capital, startups, major tech HQs.',
                sectors: ['Tech', 'Finance', 'Biotech']
            },
            {
                id: 'seattle', name: 'Seattle', state: 'WA', lat: 47.6062, lon: -122.3321,
                type: 'major', population: '750K',
                keywords: ['seattle', 'washington', 'amazon', 'microsoft', 'boeing'],
                description: 'Pacific Northwest tech hub. Amazon, Microsoft, Boeing headquarters.',
                sectors: ['Tech', 'Aerospace', 'E-commerce']
            },
            {
                id: 'miami', name: 'Miami', state: 'FL', lat: 25.7617, lon: -80.1918,
                type: 'major', population: '450K',
                keywords: ['miami', 'florida', 'latin america', 'caribbean'],
                description: 'Gateway to Latin America. Finance, real estate, tourism hub.',
                sectors: ['Finance', 'Real Estate', 'Tourism']
            },
            {
                id: 'atlanta', name: 'Atlanta', state: 'GA', lat: 33.7490, lon: -84.3880,
                type: 'major', population: '500K',
                keywords: ['atlanta', 'georgia', 'cdc', 'delta'],
                description: 'Southeast economic center. CDC headquarters, major logistics hub.',
                sectors: ['Logistics', 'Healthcare', 'Media']
            },
            {
                id: 'boston', name: 'Boston', state: 'MA', lat: 42.3601, lon: -71.0589,
                type: 'major', population: '680K',
                keywords: ['boston', 'massachusetts', 'harvard', 'mit', 'biotech'],
                description: 'Education and biotech hub. Harvard, MIT, major hospitals.',
                sectors: ['Education', 'Biotech', 'Finance']
            },
            {
                id: 'denver', name: 'Denver', state: 'CO', lat: 39.7392, lon: -104.9903,
                type: 'regional', population: '720K',
                keywords: ['denver', 'colorado', 'aerospace'],
                description: 'Mountain West hub. Aerospace, tech growth, federal facilities.',
                sectors: ['Aerospace', 'Tech', 'Energy']
            },
            {
                id: 'phoenix', name: 'Phoenix', state: 'AZ', lat: 33.4484, lon: -112.0740,
                type: 'regional', population: '1.6M',
                keywords: ['phoenix', 'arizona', 'semiconductor', 'tsmc'],
                description: 'Fast-growing Sun Belt metro. Semiconductor manufacturing expansion.',
                sectors: ['Manufacturing', 'Tech', 'Real Estate']
            },
            {
                id: 'austin', name: 'Austin', state: 'TX', lat: 30.2672, lon: -97.7431,
                type: 'regional', population: '1M',
                keywords: ['austin', 'texas', 'tesla', 'tech'],
                description: 'Texas tech hub. Tesla, Samsung, major tech company expansions.',
                sectors: ['Tech', 'Manufacturing', 'Entertainment']
            },
            {
                id: 'detroit', name: 'Detroit', state: 'MI', lat: 42.3314, lon: -83.0458,
                type: 'regional', population: '640K',
                keywords: ['detroit', 'michigan', 'auto', 'ev', 'ford', 'gm'],
                description: 'Auto industry center. EV transition, manufacturing renaissance.',
                sectors: ['Auto', 'Manufacturing', 'Tech']
            },
            {
                id: 'vegas', name: 'Las Vegas', state: 'NV', lat: 36.1699, lon: -115.1398,
                type: 'regional', population: '650K',
                keywords: ['las vegas', 'vegas', 'nevada', 'gaming'],
                description: 'Entertainment and convention hub. Growing tech presence.',
                sectors: ['Tourism', 'Entertainment', 'Tech']
            },
            // Strategic locations
            {
                id: 'norfolk', name: 'Norfolk', state: 'VA', lat: 36.8508, lon: -76.2859,
                type: 'military', population: '245K',
                keywords: ['norfolk', 'navy', 'naval', 'fleet'],
                description: 'Largest naval base in world. Atlantic Fleet headquarters.',
                sectors: ['Military', 'Defense', 'Shipbuilding']
            },
            {
                id: 'sandiego', name: 'San Diego', state: 'CA', lat: 32.7157, lon: -117.1611,
                type: 'military', population: '1.4M',
                keywords: ['san diego', 'navy', 'pacific fleet', 'border'],
                description: 'Major military hub. Pacific Fleet, border region.',
                sectors: ['Military', 'Biotech', 'Tourism']
            }
        ];

const US_HOTSPOTS = [
            {
                id: 'mn-daycare-fraud',
                name: 'Minnesota Daycare Fraud',
                location: 'Minneapolis, MN',
                lat: 44.9778,
                lon: -93.2650,
                level: 'high',
                category: 'Federal Investigation',
                description: 'Massive $250M+ fraud scheme involving Feeding Our Future nonprofit. Largest pandemic-era fraud case. Multiple convictions and ongoing trials.',
                keywords: ['minnesota', 'daycare', 'fraud', 'feeding our future', 'minneapolis', 'pandemic fraud', 'child nutrition', 'somali'],
                startDate: '2022',
                status: 'Active Investigation',
                icon: '⚠'
            },
            {
                id: 'la-wildfires',
                name: 'California Wildfires',
                location: 'Los Angeles, CA',
                lat: 34.0522,
                lon: -118.2437,
                level: 'high',
                category: 'Natural Disaster',
                description: 'Ongoing wildfire emergency in Los Angeles area. Multiple fires, evacuations, and widespread destruction.',
                keywords: ['california', 'wildfire', 'los angeles', 'fire', 'evacuation', 'palisades', 'eaton', 'altadena'],
                startDate: '2025',
                status: 'Active Emergency',
                icon: '🔥'
            },
            {
                id: 'border-crisis',
                name: 'Border Enforcement',
                location: 'El Paso, TX',
                lat: 31.7619,
                lon: -106.4850,
                level: 'elevated',
                category: 'Immigration',
                description: 'Ongoing migration and border enforcement actions. Policy changes, deportations, and humanitarian concerns.',
                keywords: ['border', 'immigration', 'migrant', 'el paso', 'texas', 'cbp', 'deportation', 'ice'],
                startDate: '2024',
                status: 'Ongoing',
                icon: '🚨'
            },
            {
                id: 'ai-regulation',
                name: 'AI & Tech Policy',
                location: 'San Francisco, CA',
                lat: 37.7749,
                lon: -122.4194,
                level: 'medium',
                category: 'Technology',
                description: 'Major tech companies facing regulatory scrutiny. AI safety debates, antitrust actions, and policy formation.',
                keywords: ['openai', 'anthropic', 'google ai', 'ai regulation', 'artificial intelligence', 'tech regulation', 'deepseek'],
                startDate: '2024',
                status: 'Developing',
                icon: '🤖'
            }
        ];

const INTEL_HOTSPOTS = [
            {
                id: 'dc', name: 'DC', subtext: 'Pentagon Pizza Index', lat: 38.9, lon: -77.0,
                keywords: ['pentagon', 'white house', 'washington', 'us military', 'cia', 'nsa', 'biden', 'trump'],
                description: 'US national security hub. Pentagon, CIA, NSA, State Dept. Monitor for late-night activity spikes.',
                agencies: ['Pentagon', 'CIA', 'NSA', 'State Dept'],
                status: 'Active monitoring'
            },
            {
                id: 'moscow', name: 'Moscow', subtext: 'Kremlin Activity', lat: 55.75, lon: 37.6,
                keywords: ['russia', 'putin', 'kremlin', 'moscow', 'russian'],
                description: 'Russian political and military command center. FSB, GRU, Presidential Administration.',
                agencies: ['FSB', 'GRU', 'SVR', 'Kremlin'],
                status: 'High activity'
            },
            {
                id: 'beijing', name: 'Beijing', subtext: 'PLA/MSS Activity', lat: 39.9, lon: 116.4,
                keywords: ['china', 'beijing', 'chinese', 'xi jinping', 'taiwan strait', 'pla'],
                description: 'Chinese Communist Party headquarters. PLA command, MSS intelligence operations.',
                agencies: ['PLA', 'MSS', 'CCP Politburo'],
                status: 'Elevated posture'
            },
            {
                id: 'kyiv', name: 'Kyiv', subtext: 'Conflict Zone', lat: 50.45, lon: 30.5,
                keywords: ['ukraine', 'kyiv', 'zelensky', 'ukrainian', 'donbas', 'crimea'],
                description: 'Ukrainian capital under wartime conditions. Government, military coordination center.',
                agencies: ['SBU', 'GUR', 'Armed Forces'],
                status: 'Active conflict'
            },
            {
                id: 'taipei', name: 'Taipei', subtext: 'Strait Watch', lat: 25.03, lon: 121.5,
                keywords: ['taiwan', 'taipei', 'taiwanese', 'strait'],
                description: 'Taiwan government and military HQ. ADIZ violations and PLA exercises tracked.',
                agencies: ['NSB', 'MND', 'AIT'],
                status: 'Heightened alert'
            },
            {
                id: 'tehran', name: 'Tehran', subtext: 'IRGC Activity', lat: 35.7, lon: 51.4,
                keywords: ['iran', 'tehran', 'iranian', 'irgc', 'hezbollah', 'nuclear'],
                description: 'Iranian regime center. IRGC Quds Force, nuclear program oversight, proxy coordination.',
                agencies: ['IRGC', 'MOIS', 'AEOI'],
                status: 'Proxy operations active'
            },
            {
                id: 'jerusalem', name: 'Tel Aviv', subtext: 'Mossad/IDF', lat: 32.07, lon: 34.78,
                keywords: ['israel', 'israeli', 'gaza', 'hamas', 'idf', 'netanyahu', 'mossad'],
                description: 'Israeli security apparatus. IDF operations, Mossad intel, Shin Bet domestic security.',
                agencies: ['Mossad', 'IDF', 'Shin Bet', 'Aman'],
                status: 'Active operations'
            },
            {
                id: 'pyongyang', name: 'Pyongyang', subtext: 'DPRK Watch', lat: 39.03, lon: 125.75,
                keywords: ['north korea', 'kim jong', 'pyongyang', 'dprk', 'korean missile'],
                description: 'North Korean leadership compound. Nuclear/missile program, regime stability indicators.',
                agencies: ['RGB', 'KPA', 'SSD'],
                status: 'Missile tests ongoing'
            },
            {
                id: 'london', name: 'London', subtext: 'GCHQ/MI6', lat: 51.5, lon: -0.12,
                keywords: ['uk', 'britain', 'british', 'mi6', 'gchq', 'london'],
                description: 'UK intelligence community hub. Five Eyes partner, SIGINT, foreign intelligence.',
                agencies: ['MI6', 'GCHQ', 'MI5'],
                status: 'Normal operations'
            },
            {
                id: 'brussels', name: 'Brussels', subtext: 'NATO HQ', lat: 50.85, lon: 4.35,
                keywords: ['nato', 'eu', 'european union', 'brussels'],
                description: 'NATO headquarters and EU institutions. Alliance coordination, Article 5 readiness.',
                agencies: ['NATO', 'EU Commission', 'EEAS'],
                status: 'Enhanced readiness'
            },
            {
                id: 'caracas', name: 'Caracas', subtext: 'Venezuela Crisis', lat: 10.5, lon: -66.9,
                keywords: ['venezuela', 'maduro', 'caracas', 'guaido', 'venezuelan', 'pdvsa'],
                description: 'Venezuelan political crisis center. Maduro regime, opposition movements, oil politics.',
                agencies: ['SEBIN', 'DGCIM', 'GNB'],
                status: 'Political instability'
            },
            {
                id: 'greenland', name: 'Nuuk', subtext: 'Arctic Dispute', lat: 64.18, lon: -51.7,
                keywords: ['greenland', 'denmark', 'arctic', 'nuuk', 'thule', 'rare earth'],
                description: 'Arctic strategic territory. US military presence, rare earth minerals, sovereignty questions.',
                agencies: ['Danish Defence', 'US Space Force', 'Arctic Council'],
                status: 'Diplomatic tensions'
            }
        ];

const SHIPPING_CHOKEPOINTS = [
            {
                id: 'suez',
                name: 'Suez Canal',
                lat: 30.0,
                lon: 32.5,
                keywords: ['suez', 'red sea', 'houthi', 'canal'],
                desc: 'Critical waterway connecting Mediterranean to Red Sea. ~12% of global trade. Currently threatened by Houthi attacks.',
                traffic: '~50 ships/day',
                region: 'Egypt'
            },
            {
                id: 'panama',
                name: 'Panama Canal',
                lat: 9.1,
                lon: -79.7,
                keywords: ['panama canal', 'panama'],
                desc: 'Links Atlantic and Pacific oceans. ~5% of global trade. Facing drought-related capacity restrictions.',
                traffic: '~40 ships/day',
                region: 'Panama'
            },
            {
                id: 'hormuz',
                name: 'Strait of Hormuz',
                lat: 26.5,
                lon: 56.3,
                keywords: ['hormuz', 'strait of hormuz', 'persian gulf'],
                desc: 'Only sea route from Persian Gulf to open ocean. ~21% of global oil passes through daily.',
                traffic: '~20 tankers/day',
                region: 'Iran/Oman'
            },
            {
                id: 'malacca',
                name: 'Malacca Strait',
                lat: 2.5,
                lon: 101.5,
                keywords: ['malacca', 'singapore strait'],
                desc: 'Main shipping route between Indian and Pacific oceans. ~25% of global trade including ~25% of oil.',
                traffic: '~80 ships/day',
                region: 'Malaysia/Singapore'
            },
            {
                id: 'bosphorus',
                name: 'Bosphorus Strait',
                lat: 41.1,
                lon: 29.0,
                keywords: ['bosphorus', 'black sea', 'turkish strait'],
                desc: 'Only route between Black Sea and Mediterranean. Critical for Russian/Ukrainian grain exports.',
                traffic: '~45 ships/day',
                region: 'Turkey'
            }
        ];

const CYBER_REGIONS = [
            {
                id: 'cyber_russia',
                name: 'RU',
                fullName: 'Russia',
                lat: 55.75,
                lon: 45.0,
                group: 'APT28/29',
                aka: 'Fancy Bear / Cozy Bear',
                sponsor: 'GRU / FSB',
                desc: 'State-sponsored groups linked to Russian intelligence. Known for election interference, government espionage, and critical infrastructure attacks.',
                targets: ['Government', 'Defense', 'Energy', 'Elections', 'Media']
            },
            {
                id: 'cyber_china',
                name: 'CN',
                fullName: 'China',
                lat: 35.0,
                lon: 105.0,
                group: 'APT41',
                aka: 'Double Dragon / Winnti',
                sponsor: 'MSS',
                desc: 'Hybrid espionage and financially motivated group. Conducts state-sponsored intelligence and supply chain attacks.',
                targets: ['Tech', 'Telecom', 'Healthcare', 'Gaming', 'Supply Chain']
            },
            {
                id: 'cyber_nk',
                name: 'NK',
                fullName: 'North Korea',
                lat: 39.0,
                lon: 127.0,
                group: 'Lazarus',
                aka: 'Hidden Cobra / APT38',
                sponsor: 'RGB',
                desc: 'Financially motivated attacks to fund regime. Known for cryptocurrency theft, SWIFT banking attacks, and ransomware.',
                targets: ['Crypto', 'Banks', 'Defense', 'Media', 'Critical Infra']
            },
            {
                id: 'cyber_iran',
                name: 'IR',
                fullName: 'Iran',
                lat: 32.0,
                lon: 53.0,
                group: 'APT33/35',
                aka: 'Charming Kitten / Elfin',
                sponsor: 'IRGC',
                desc: 'Focus on regional adversaries and dissidents. Known for destructive wiper malware and spear-phishing campaigns.',
                targets: ['Energy', 'Aviation', 'Government', 'Dissidents', 'Israel']
            }
        ];

const CONFLICT_ZONES = [
            {
                id: 'ukraine',
                name: 'Ukraine Conflict',
                intensity: 'high',
                coords: [
                    [37.5, 47.0], [38.5, 47.5], [39.0, 48.5], [38.0, 49.5],
                    [37.0, 49.0], [36.0, 48.5], [35.5, 47.5], [36.5, 47.0]
                ],
                labelPos: { lat: 48.0, lon: 37.5 },
                startDate: 'Feb 24, 2022',
                parties: ['Russia', 'Ukraine', 'NATO (support)'],
                casualties: '500,000+ (est.)',
                displaced: '6.5M+ refugees',
                description: 'Full-scale Russian invasion of Ukraine. Active frontlines in Donetsk, Luhansk, Zaporizhzhia, and Kherson oblasts. Heavy artillery, drone warfare, and trench combat.',
                keyEvents: [
                    'Battle of Bakhmut',
                    'Kursk incursion',
                    'Black Sea drone strikes',
                    'Infrastructure attacks'
                ],
                keywords: ['ukraine', 'russia', 'zelensky', 'putin', 'donbas', 'crimea', 'bakhmut', 'kursk']
            },
            {
                id: 'gaza',
                name: 'Gaza Conflict',
                intensity: 'high',
                coords: [
                    [34.2, 31.6], [34.6, 31.6], [34.6, 31.2], [34.2, 31.2]
                ],
                labelPos: { lat: 31.4, lon: 34.4 },
                startDate: 'Oct 7, 2023',
                parties: ['Israel (IDF)', 'Hamas', 'Palestinian Islamic Jihad'],
                casualties: '45,000+ (Gaza), 1,200+ (Israel)',
                displaced: '2M+ internally displaced',
                description: 'Israeli military operation in Gaza following Oct 7 Hamas attacks. Urban warfare, humanitarian crisis, regional escalation with Hezbollah and Houthis.',
                keyEvents: [
                    'Oct 7 attacks',
                    'Ground invasion',
                    'Rafah operation',
                    'Hostage negotiations'
                ],
                keywords: ['gaza', 'israel', 'hamas', 'idf', 'netanyahu', 'hostage', 'rafah', 'hezbollah']
            },
            {
                id: 'sudan',
                name: 'Sudan Civil War',
                intensity: 'medium',
                coords: [
                    [32.0, 16.0], [34.0, 16.5], [35.0, 15.0], [33.5, 13.5],
                    [31.5, 14.0], [31.0, 15.5]
                ],
                labelPos: { lat: 15.0, lon: 32.5 },
                startDate: 'Apr 15, 2023',
                parties: ['Sudanese Armed Forces (SAF)', 'Rapid Support Forces (RSF)'],
                casualties: '15,000+ killed',
                displaced: '10M+ displaced',
                description: 'Power struggle between SAF and RSF paramilitary. Fighting centered around Khartoum, Darfur. Major humanitarian catastrophe with famine conditions.',
                keyEvents: [
                    'Khartoum battle',
                    'Darfur massacres',
                    'El Fasher siege',
                    'Famine declared'
                ],
                keywords: ['sudan', 'khartoum', 'rsf', 'darfur', 'burhan', 'hemedti']
            },
            {
                id: 'myanmar',
                name: 'Myanmar Civil War',
                intensity: 'medium',
                coords: [
                    [96.0, 22.0], [98.0, 23.0], [98.5, 21.0], [97.0, 19.5], [95.5, 20.5]
                ],
                labelPos: { lat: 21.0, lon: 96.5 },
                startDate: 'Feb 1, 2021',
                parties: ['Military Junta (SAC)', 'Ethnic Armed Organizations', 'People\'s Defense Forces'],
                casualties: '50,000+ (est.)',
                displaced: '3M+ internally displaced',
                description: 'Armed resistance following 2021 military coup. Multiple ethnic armies and pro-democracy forces fighting junta. Recent rebel advances in border regions.',
                keyEvents: [
                    'Operation 1027',
                    'Lashio capture',
                    'Myawaddy offensive',
                    'Junta conscription'
                ],
                keywords: ['myanmar', 'burma', 'junta', 'arakan', 'karen', 'kachin']
            },
            {
                id: 'taiwan_strait',
                name: 'Taiwan Strait',
                intensity: 'watch',
                coords: [
                    [119.0, 26.0], [121.5, 26.0], [121.5, 22.5], [119.0, 22.5]
                ],
                labelPos: { lat: 24.5, lon: 120.0 },
                startDate: 'Ongoing tensions',
                parties: ['China (PLA)', 'Taiwan (ROC)', 'United States (deterrence)'],
                casualties: 'N/A - no active combat',
                displaced: 'N/A',
                description: 'Heightened tensions over Taiwan sovereignty. Regular PLA exercises, airspace incursions, naval activity. Risk of flashpoint escalation.',
                keyEvents: [
                    'PLA exercises',
                    'ADIZ incursions',
                    'US arms sales',
                    'Diplomatic tensions'
                ],
                keywords: ['taiwan', 'china', 'strait', 'pla', 'tsai', 'invasion']
            }
        ];

const MILITARY_BASES = [
            // US/NATO Major Bases
            { id: 'ramstein', name: 'Ramstein AB', lat: 49.44, lon: 7.6, type: 'us-nato' },
            { id: 'diego_garcia', name: 'Diego Garcia', lat: -7.32, lon: 72.42, type: 'us-nato' },
            { id: 'guam', name: 'Andersen AFB', lat: 13.58, lon: 144.92, type: 'us-nato' },
            { id: 'okinawa', name: 'Kadena AB', lat: 26.35, lon: 127.77, type: 'us-nato' },
            { id: 'yokosuka', name: 'Yokosuka', lat: 35.28, lon: 139.67, type: 'us-nato' },
            { id: 'bahrain', name: 'NSA Bahrain', lat: 26.23, lon: 50.65, type: 'us-nato' },
            { id: 'qatar', name: 'Al Udeid', lat: 25.12, lon: 51.31, type: 'us-nato' },
            { id: 'djibouti', name: 'Camp Lemonnier', lat: 11.55, lon: 43.15, type: 'us-nato' },
            { id: 'incirlik', name: 'Incirlik AB', lat: 37.0, lon: 35.43, type: 'us-nato' },
            { id: 'rota', name: 'NS Rota', lat: 36.62, lon: -6.35, type: 'us-nato' },
            // Chinese Bases
            { id: 'djibouti_cn', name: 'PLA Djibouti', lat: 11.59, lon: 43.05, type: 'china' },
            { id: 'woody_island', name: 'Woody Island', lat: 16.83, lon: 112.33, type: 'china' },
            { id: 'fiery_cross', name: 'Fiery Cross', lat: 9.55, lon: 112.89, type: 'china' },
            { id: 'mischief_reef', name: 'Mischief Reef', lat: 9.90, lon: 115.53, type: 'china' },
            { id: 'ream', name: 'Ream (Cambodia)', lat: 10.52, lon: 103.63, type: 'china' },
            // Russian Bases
            { id: 'kaliningrad', name: 'Kaliningrad', lat: 54.71, lon: 20.51, type: 'russia' },
            { id: 'sevastopol', name: 'Sevastopol', lat: 44.62, lon: 33.53, type: 'russia' },
            { id: 'tartus', name: 'Tartus (Syria)', lat: 34.89, lon: 35.87, type: 'russia' },
            { id: 'hmeimim', name: 'Hmeimim AB', lat: 35.41, lon: 35.95, type: 'russia' },
            { id: 'cam_ranh', name: 'Cam Ranh', lat: 11.99, lon: 109.22, type: 'russia' }
        ];

const NUCLEAR_FACILITIES = [
            // Major Power Plants
            { id: 'zaporizhzhia', name: 'Zaporizhzhia NPP', lat: 47.51, lon: 34.58, type: 'plant', status: 'contested' },
            { id: 'fukushima', name: 'Fukushima', lat: 37.42, lon: 141.03, type: 'plant', status: 'decommissioning' },
            { id: 'flamanville', name: 'Flamanville', lat: 49.54, lon: -1.88, type: 'plant', status: 'active' },
            { id: 'bruce', name: 'Bruce Power', lat: 44.33, lon: -81.60, type: 'plant', status: 'active' },
            // Enrichment/Weapons Facilities
            { id: 'natanz', name: 'Natanz', lat: 33.72, lon: 51.73, type: 'enrichment', status: 'active' },
            { id: 'fordow', name: 'Fordow', lat: 34.88, lon: 51.0, type: 'enrichment', status: 'active' },
            { id: 'yongbyon', name: 'Yongbyon', lat: 39.80, lon: 125.75, type: 'weapons', status: 'active' },
            { id: 'dimona', name: 'Dimona', lat: 31.0, lon: 35.15, type: 'weapons', status: 'active' },
            { id: 'los_alamos', name: 'Los Alamos', lat: 35.88, lon: -106.30, type: 'weapons', status: 'active' },
            { id: 'sellafield', name: 'Sellafield', lat: 54.42, lon: -3.50, type: 'reprocessing', status: 'active' },
            { id: 'la_hague', name: 'La Hague', lat: 49.68, lon: -1.88, type: 'reprocessing', status: 'active' }
        ];

const UNDERSEA_CABLES = [
            {
                id: 'transatlantic_1',
                name: 'Transatlantic (TAT-14)',
                major: true,
                points: [[-74.0, 40.7], [-30.0, 45.0], [-9.0, 52.0]]
            },
            {
                id: 'transpacific_1',
                name: 'Transpacific (Unity)',
                major: true,
                points: [[-122.4, 37.8], [-155.0, 25.0], [139.7, 35.7]]
            },
            {
                id: 'sea_me_we_5',
                name: 'SEA-ME-WE 5',
                major: true,
                points: [[103.8, 1.3], [80.0, 10.0], [55.0, 25.0], [35.0, 30.0], [12.0, 37.0], [-5.0, 36.0]]
            },
            {
                id: 'aae1',
                name: 'Asia-Africa-Europe 1',
                major: true,
                points: [[121.0, 25.0], [103.8, 1.3], [73.0, 15.0], [44.0, 12.0], [35.0, 30.0], [28.0, 41.0]]
            },
            {
                id: 'curie',
                name: 'Curie (Google)',
                major: false,
                points: [[-122.4, 37.8], [-80.0, 0.0], [-70.0, -33.0]]
            },
            {
                id: 'marea',
                name: 'MAREA (Microsoft)',
                major: true,
                points: [[-73.8, 39.4], [-9.0, 37.0]]
            }
        ];

const SANCTIONED_COUNTRIES = {
            // Severe sanctions (comprehensive)
            408: 'severe',  // North Korea
            728: 'severe',  // South Sudan
            729: 'severe',  // Sudan
            760: 'severe',  // Syria
            // High sanctions
            364: 'high',    // Iran
            643: 'high',    // Russia
            112: 'high',    // Belarus
            // Moderate sanctions
            862: 'moderate', // Venezuela
            104: 'moderate', // Myanmar
            178: 'moderate', // Congo
            // Low/targeted sanctions
            152: 'low',     // Cuba (being modified)
            716: 'low',     // Zimbabwe
        };

const NEWS_REGIONS = [
            { id: 'us', name: 'United States', lat: 39.0, lon: -98.0, radius: 60, keywords: ['us', 'america', 'washington', 'trump', 'biden', 'congress'] },
            { id: 'europe', name: 'Europe', lat: 50.0, lon: 10.0, radius: 55, keywords: ['europe', 'eu', 'european', 'nato', 'brussels'] },
            { id: 'russia', name: 'Russia', lat: 60.0, lon: 90.0, radius: 50, keywords: ['russia', 'russian', 'putin', 'moscow', 'kremlin'] },
            { id: 'china', name: 'China', lat: 35.0, lon: 105.0, radius: 55, keywords: ['china', 'chinese', 'beijing', 'xi'] },
            { id: 'middle_east', name: 'Middle East', lat: 30.0, lon: 45.0, radius: 50, keywords: ['israel', 'iran', 'saudi', 'gaza', 'syria', 'iraq', 'yemen'] },
            { id: 'east_asia', name: 'East Asia', lat: 35.0, lon: 130.0, radius: 45, keywords: ['japan', 'korea', 'taiwan', 'kim jong'] },
            { id: 'south_asia', name: 'South Asia', lat: 22.0, lon: 78.0, radius: 45, keywords: ['india', 'pakistan', 'modi'] },
            { id: 'africa', name: 'Africa', lat: 5.0, lon: 20.0, radius: 55, keywords: ['africa', 'african', 'sudan', 'nigeria', 'ethiopia'] },
            { id: 'latam', name: 'Latin America', lat: -15.0, lon: -60.0, radius: 50, keywords: ['brazil', 'mexico', 'venezuela', 'argentina'] }
        ];

const MONITOR_COLORS = [
            '#00ff88', '#ff6600', '#00aaff', '#ff00ff', '#ffcc00',
            '#ff3366', '#33ccff', '#99ff33', '#ff6699', '#00ffcc'
        ];

const AI_FEEDS = [
            { name: 'OpenAI', url: 'https://openai.com/blog/rss.xml' },
            { name: 'Anthropic', url: 'https://www.anthropic.com/rss.xml' },
            { name: 'Google AI', url: 'https://blog.google/technology/ai/rss/' },
            { name: 'DeepMind', url: 'https://deepmind.google/blog/rss.xml' },
            { name: 'Meta AI', url: 'https://ai.meta.com/blog/rss/' },
            { name: 'Hugging Face', url: 'https://huggingface.co/blog/feed.xml' }
        ];

// Export constants to window for HTML and cross-module access
if (typeof window !== 'undefined') {
    window.PANELS = PANELS;
    window.CORS_PROXIES = CORS_PROXIES;
    window.ALERT_KEYWORDS = ALERT_KEYWORDS;
    window.FEEDS = FEEDS;
    window.INTEL_SOURCES = INTEL_SOURCES;
    window.REGION_KEYWORDS = REGION_KEYWORDS;
    window.TOPIC_KEYWORDS = TOPIC_KEYWORDS;
    window.SECTORS = SECTORS;
    window.COMMODITIES = COMMODITIES;
    window.US_CITIES = US_CITIES;
    window.US_HOTSPOTS = US_HOTSPOTS;
    window.INTEL_HOTSPOTS = INTEL_HOTSPOTS;
    window.SHIPPING_CHOKEPOINTS = SHIPPING_CHOKEPOINTS;
    window.CYBER_REGIONS = CYBER_REGIONS;
    window.CONFLICT_ZONES = CONFLICT_ZONES;
    window.MILITARY_BASES = MILITARY_BASES;
    window.NUCLEAR_FACILITIES = NUCLEAR_FACILITIES;
    window.UNDERSEA_CABLES = UNDERSEA_CABLES;
    window.SANCTIONED_COUNTRIES = SANCTIONED_COUNTRIES;
    window.NEWS_REGIONS = NEWS_REGIONS;
    window.MONITOR_COLORS = MONITOR_COLORS;
    window.AI_FEEDS = AI_FEEDS;
}
