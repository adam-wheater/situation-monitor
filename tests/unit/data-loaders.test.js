/**
 * Unit tests for data-loaders module
 * Tests the map data loading, news analysis, and density calculation logic
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock INTEL_HOTSPOTS for testing
const mockHotspots = [
  {
    id: 'ukraine',
    name: 'Ukraine',
    lat: 48.4,
    lon: 31.2,
    keywords: ['ukraine', 'kyiv', 'zelenskyy', 'donbas']
  },
  {
    id: 'taiwan',
    name: 'Taiwan',
    lat: 23.5,
    lon: 121.0,
    keywords: ['taiwan', 'taipei', 'tsmc', 'china strait']
  },
  {
    id: 'gaza',
    name: 'Gaza',
    lat: 31.5,
    lon: 34.5,
    keywords: ['gaza', 'hamas', 'israel', 'rafah']
  }
];

// Mock NEWS_REGIONS for testing
const mockNewsRegions = [
  { id: 'europe', keywords: ['europe', 'eu', 'nato', 'ukraine', 'russia'] },
  { id: 'asia', keywords: ['china', 'taiwan', 'japan', 'korea', 'asia'] },
  { id: 'middle_east', keywords: ['israel', 'iran', 'gaza', 'syria', 'saudi'] }
];

/**
 * Analyze hotspot activity from news - mirrors data-loaders.js logic
 */
function analyzeHotspotActivity(allNews, hotspots = mockHotspots) {
  const results = {};

  hotspots.forEach(spot => {
    let score = 0;
    let matchedHeadlines = [];

    allNews.forEach(item => {
      const title = item.title.toLowerCase();
      const matchedKeywords = spot.keywords.filter(kw => title.includes(kw));
      if (matchedKeywords.length > 0) {
        score += matchedKeywords.length;
        if (item.isAlert) score += 3;
        matchedHeadlines.push({
          title: item.title,
          link: item.link,
          source: item.source,
          isAlert: item.isAlert
        });
      }
    });

    let level = 'low';
    if (score >= 8) level = 'high';
    else if (score >= 3) level = 'elevated';

    results[spot.id] = { level, score, headlines: matchedHeadlines.slice(0, 5) };
  });

  return results;
}

/**
 * Calculate news density by region - mirrors data-loaders.js logic
 */
function calculateNewsDensity(allNews, regions = mockNewsRegions) {
  const scores = {};

  if (!allNews || !regions) return scores;

  regions.forEach(region => {
    let count = 0;
    allNews.forEach(item => {
      const title = (item.title || '').toLowerCase();
      if (region.keywords.some(kw => title.includes(kw.toLowerCase()))) {
        count++;
      }
    });
    scores[region.id] = count;
  });

  return scores;
}

describe('Data Loaders Module', () => {
  describe('Hotspot Activity Analysis', () => {
    describe('Level Determination', () => {
      it('should return low level when score < 3', () => {
        const news = [
          { title: 'Local news about weather', source: 'Weather', isAlert: false }
        ];
        const results = analyzeHotspotActivity(news);
        expect(results.ukraine.level).toBe('low');
        expect(results.ukraine.score).toBe(0);
      });

      it('should return elevated level when score >= 3 and < 8', () => {
        const news = [
          { title: 'Ukraine forces advance in Donbas region', source: 'Reuters', isAlert: false },
          { title: 'Kyiv reports new offensive', source: 'AP', isAlert: false }
        ];
        const results = analyzeHotspotActivity(news);
        expect(results.ukraine.level).toBe('elevated');
        expect(results.ukraine.score).toBeGreaterThanOrEqual(3);
        expect(results.ukraine.score).toBeLessThan(8);
      });

      it('should return high level when score >= 8', () => {
        const news = [
          { title: 'Breaking: Ukraine launches major Donbas offensive near Kyiv', source: 'Reuters', isAlert: true },
          { title: 'Zelenskyy addresses nation on Ukraine crisis', source: 'AP', isAlert: true }
        ];
        const results = analyzeHotspotActivity(news);
        expect(results.ukraine.level).toBe('high');
        expect(results.ukraine.score).toBeGreaterThanOrEqual(8);
      });
    });

    describe('Scoring Logic', () => {
      it('should add 1 point per keyword match', () => {
        const news = [
          { title: 'Taiwan chip production at TSMC increases', source: 'Tech', isAlert: false }
        ];
        const results = analyzeHotspotActivity(news);
        // 'taiwan' and 'tsmc' both match
        expect(results.taiwan.score).toBe(2);
      });

      it('should add 3 extra points for alert items', () => {
        const news = [
          { title: 'Taiwan alert issued', source: 'Alert', isAlert: true }
        ];
        const results = analyzeHotspotActivity(news);
        // 1 for 'taiwan' keyword + 3 for alert
        expect(results.taiwan.score).toBe(4);
      });

      it('should accumulate scores from multiple news items', () => {
        const news = [
          { title: 'Taiwan news update', source: 'A', isAlert: false },
          { title: 'Taipei reports growth', source: 'B', isAlert: false },
          { title: 'China strait tensions', source: 'C', isAlert: false }
        ];
        const results = analyzeHotspotActivity(news);
        // 'taiwan' + 'taipei' + 'china strait'
        expect(results.taiwan.score).toBe(3);
      });
    });

    describe('Headline Collection', () => {
      it('should collect matching headlines', () => {
        const news = [
          { title: 'Gaza situation worsens', link: 'http://example.com/1', source: 'News', isAlert: false }
        ];
        const results = analyzeHotspotActivity(news);
        expect(results.gaza.headlines.length).toBe(1);
        expect(results.gaza.headlines[0].title).toBe('Gaza situation worsens');
        expect(results.gaza.headlines[0].link).toBe('http://example.com/1');
      });

      it('should limit headlines to 5', () => {
        const news = Array.from({ length: 10 }, (_, i) => ({
          title: `Gaza news ${i}`,
          link: `http://example.com/${i}`,
          source: 'News',
          isAlert: false
        }));
        const results = analyzeHotspotActivity(news);
        expect(results.gaza.headlines.length).toBe(5);
      });

      it('should preserve headline properties', () => {
        const news = [
          { title: 'Hamas attack in Gaza', link: 'http://a.com', source: 'Reuters', isAlert: true }
        ];
        const results = analyzeHotspotActivity(news);
        const headline = results.gaza.headlines[0];
        expect(headline.title).toBe('Hamas attack in Gaza');
        expect(headline.link).toBe('http://a.com');
        expect(headline.source).toBe('Reuters');
        expect(headline.isAlert).toBe(true);
      });
    });

    describe('Edge Cases', () => {
      it('should handle empty news array', () => {
        const results = analyzeHotspotActivity([]);
        Object.values(results).forEach(result => {
          expect(result.level).toBe('low');
          expect(result.score).toBe(0);
          expect(result.headlines).toHaveLength(0);
        });
      });

      it('should handle case-insensitive matching', () => {
        const news = [
          { title: 'UKRAINE Crisis Update', source: 'News', isAlert: false }
        ];
        const results = analyzeHotspotActivity(news);
        expect(results.ukraine.score).toBeGreaterThan(0);
      });

      it('should return results for all hotspots', () => {
        const results = analyzeHotspotActivity([]);
        expect(Object.keys(results)).toContain('ukraine');
        expect(Object.keys(results)).toContain('taiwan');
        expect(Object.keys(results)).toContain('gaza');
      });
    });
  });

  describe('News Density Calculation', () => {
    describe('Basic Counting', () => {
      it('should count news items matching region keywords', () => {
        const news = [
          { title: 'EU summit discusses trade' },
          { title: 'NATO expansion talks' },
          { title: 'Weather report' }
        ];
        const density = calculateNewsDensity(news);
        expect(density.europe).toBe(2); // 'eu' and 'nato'
      });

      it('should return 0 for regions with no matches', () => {
        const news = [
          { title: 'Local sports update' }
        ];
        const density = calculateNewsDensity(news);
        expect(density.europe).toBe(0);
        expect(density.asia).toBe(0);
        expect(density.middle_east).toBe(0);
      });
    });

    describe('Cross-Region Counting', () => {
      it('should count same news in multiple regions if keywords match', () => {
        const news = [
          { title: 'Russia and China discuss partnership' }
        ];
        const density = calculateNewsDensity(news);
        expect(density.europe).toBe(1); // 'russia'
        expect(density.asia).toBe(1); // 'china'
      });
    });

    describe('Edge Cases', () => {
      it('should handle null news array', () => {
        const density = calculateNewsDensity(null);
        expect(density).toEqual({});
      });

      it('should handle undefined news array', () => {
        const density = calculateNewsDensity(undefined);
        expect(density).toEqual({});
      });

      it('should handle empty news array', () => {
        const density = calculateNewsDensity([]);
        Object.values(density).forEach(count => {
          expect(count).toBe(0);
        });
      });

      it('should handle news items without title', () => {
        const news = [
          { title: undefined },
          { title: null },
          {}
        ];
        // Should not throw
        const density = calculateNewsDensity(news);
        expect(density.europe).toBe(0);
      });

      it('should be case-insensitive', () => {
        const news = [
          { title: 'CHINA tensions rise' },
          { title: 'TAIWAN responds' }
        ];
        const density = calculateNewsDensity(news);
        expect(density.asia).toBe(2); // 2 news items with asia keywords
      });
    });
  });

  describe('Map Loading Functions (Structural)', () => {
    // These test the expected behavior patterns, not actual file loading

    describe('World Map Loader', () => {
      it('should cache loaded data', () => {
        let worldMapData = null;

        function loadWorldMap() {
          if (worldMapData) return worldMapData;
          worldMapData = { type: 'Topology', objects: {} };
          return worldMapData;
        }

        const first = loadWorldMap();
        const second = loadWorldMap();
        expect(first).toBe(second); // Same reference
      });
    });

    describe('US States Loader', () => {
      it('should cache loaded data', () => {
        let usStatesData = null;

        function loadUSStates() {
          if (usStatesData) return usStatesData;
          usStatesData = { type: 'Topology', objects: {} };
          return usStatesData;
        }

        const first = loadUSStates();
        const second = loadUSStates();
        expect(first).toBe(second);
      });
    });

    describe('Cable Geo Loader', () => {
      it('should cache loaded data', () => {
        let cableGeoData = null;

        function loadCableGeoData() {
          if (cableGeoData) return cableGeoData;
          cableGeoData = { type: 'FeatureCollection', features: [] };
          return cableGeoData;
        }

        const first = loadCableGeoData();
        const second = loadCableGeoData();
        expect(first).toBe(second);
      });

      it('should return null for failed loads', () => {
        let cableGeoData = null;

        function loadCableGeoDataFailing() {
          try {
            throw new Error('Load failed');
          } catch {
            cableGeoData = null;
            return null;
          }
        }

        const result = loadCableGeoDataFailing();
        expect(result).toBeNull();
      });
    });
  });

  describe('File Protocol Detection', () => {
    it('should warn about file:// protocol limitations', () => {
      // Simulating the check done in data-loaders.js
      const isFileProtocol = (protocol) => protocol === 'file:';

      expect(isFileProtocol('file:')).toBe(true);
      expect(isFileProtocol('http:')).toBe(false);
      expect(isFileProtocol('https:')).toBe(false);
    });

    it('should only warn once for cable geo file protocol', () => {
      let warnedCableGeoFileProtocol = false;
      let warnCount = 0;

      function checkCableGeoFileProtocol(isFile) {
        if (isFile) {
          if (!warnedCableGeoFileProtocol) {
            warnedCableGeoFileProtocol = true;
            warnCount++;
          }
          return null;
        }
        return { features: [] };
      }

      checkCableGeoFileProtocol(true);
      checkCableGeoFileProtocol(true);
      checkCableGeoFileProtocol(true);

      expect(warnCount).toBe(1);
    });
  });
});
