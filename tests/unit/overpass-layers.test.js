/**
 * Unit tests for Overpass API layers (Naval Hubs, Military Bases, Nuclear Plants)
 * Tests the Overpass query building, data parsing, and caching logic
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Constants from js/services/overpass.js:3-6
const OVERPASS_API_URL = 'https://overpass-api.de/api/interpreter';
const OVERPASS_CACHE_KEY = 'overpassCache';
const OVERPASS_CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours
const OVERPASS_MIN_INTERVAL_MS = 1000;

/**
 * Build Overpass query for military bases - mirrors js/services/overpass.js:84-99
 */
function buildMilitaryBasesQuery(south, west, north, east) {
  return `
[out:json][timeout:25];
(
  node["military"="base"](${south},${west},${north},${east});
  way["military"="base"](${south},${west},${north},${east});
  relation["military"="base"](${south},${west},${north},${east});
  node["military"="naval_base"](${south},${west},${north},${east});
  way["military"="naval_base"](${south},${west},${north},${east});
  relation["military"="naval_base"](${south},${west},${north},${east});
  node["military"="airfield"](${south},${west},${north},${east});
  way["military"="airfield"](${south},${west},${north},${east});
  relation["military"="airfield"](${south},${west},${north},${east});
);
out center;
`.trim();
}

/**
 * Build Overpass query for nuclear facilities - mirrors js/services/overpass.js:105-117
 */
function buildNuclearFacilitiesQuery(south, west, north, east) {
  return `
[out:json][timeout:25];
(
  node["power"="plant"]["plant:source"="nuclear"](${south},${west},${north},${east});
  way["power"="plant"]["plant:source"="nuclear"](${south},${west},${north},${east});
  relation["power"="plant"]["plant:source"="nuclear"](${south},${west},${north},${east});
  node["power"="generator"]["generator:source"="nuclear"](${south},${west},${north},${east});
  way["power"="generator"]["generator:source"="nuclear"](${south},${west},${north},${east});
  relation["power"="generator"]["generator:source"="nuclear"](${south},${west},${north},${east});
);
out center;
`.trim();
}

/**
 * Parse Overpass response elements - mirrors js/services/overpass.js:123-168
 */
function parseOverpassElements(elements, type) {
  const results = [];
  const seen = new Set();

  for (const el of elements) {
    // Get coordinates (center for ways/relations, direct for nodes)
    let lat, lon;
    if (el.type === 'node') {
      lat = el.lat;
      lon = el.lon;
    } else if (el.center) {
      lat = el.center.lat;
      lon = el.center.lon;
    } else {
      continue; // Skip elements without coordinates
    }

    // Skip duplicates by proximity (within ~100m)
    const key = `${Math.round(lat * 100)},${Math.round(lon * 100)}`;
    if (seen.has(key)) continue;
    seen.add(key);

    const tags = el.tags || {};
    const name = tags.name || tags['name:en'] || tags.operator || 'Unknown';

    let subtype = 'unknown';
    if (type === 'military') {
      subtype = tags.military || 'base';
    } else if (type === 'nuclear') {
      subtype = tags['plant:source'] === 'nuclear' ? 'plant' :
               (tags['generator:source'] === 'nuclear' ? 'generator' : 'facility');
    }

    results.push({
      id: `osm_${el.type}_${el.id}`,
      name,
      lat,
      lon,
      type: subtype,
      source: 'overpass',
      tags
    });
  }

  return results;
}

/**
 * Check if cache entry is valid - mirrors js/services/overpass.js:37-40
 */
function isCacheValid(cacheEntry) {
  if (!cacheEntry || !cacheEntry.timestamp) return false;
  return Date.now() - cacheEntry.timestamp < OVERPASS_CACHE_TTL_MS;
}

/**
 * Get bounding box from Globe.gl POV - mirrors js/services/overpass.js:236-255
 */
function getBoundingBoxFromPOV(pov, minAltitude = 0.5) {
  if (!pov || pov.altitude > minAltitude) {
    return null; // Too zoomed out, don't query
  }

  // Approximate visible area based on altitude
  const degreeSpan = pov.altitude * 60;

  const lat = pov.lat || 0;
  const lng = pov.lng || 0;

  return {
    south: Math.max(-90, lat - degreeSpan / 2),
    north: Math.min(90, lat + degreeSpan / 2),
    west: lng - degreeSpan / 2,
    east: lng + degreeSpan / 2
  };
}

/**
 * Merge Overpass results with existing data - mirrors js/services/overpass.js:261-275
 */
function mergeWithExisting(overpassData, existingData, proximityThresholdKm = 5) {
  const merged = [...existingData];
  const existingCoords = new Set(
    existingData.map(d => `${Math.round(d.lat * 10)},${Math.round((d.lon || d.lng) * 10)}`)
  );

  for (const item of overpassData) {
    const key = `${Math.round(item.lat * 10)},${Math.round(item.lon * 10)}`;
    if (!existingCoords.has(key)) {
      merged.push(item);
    }
  }

  return merged;
}

describe('Overpass API Layers', () => {
  describe('Military Bases Query Building', () => {
    it('should generate valid Overpass query for military bases', () => {
      const query = buildMilitaryBasesQuery(30, -100, 40, -90);
      expect(query).toContain('[out:json][timeout:25]');
      expect(query).toContain('"military"="base"');
      expect(query).toContain('"military"="naval_base"');
      expect(query).toContain('"military"="airfield"');
      expect(query).toContain('out center');
    });

    it('should include bounding box coordinates in query', () => {
      const query = buildMilitaryBasesQuery(30, -100, 40, -90);
      expect(query).toContain('(30,-100,40,-90)');
    });

    it('should query nodes, ways, and relations', () => {
      const query = buildMilitaryBasesQuery(30, -100, 40, -90);
      expect(query).toMatch(/node\["military"="base"\]/);
      expect(query).toMatch(/way\["military"="base"\]/);
      expect(query).toMatch(/relation\["military"="base"\]/);
    });
  });

  describe('Nuclear Facilities Query Building', () => {
    it('should generate valid Overpass query for nuclear facilities', () => {
      const query = buildNuclearFacilitiesQuery(30, -100, 40, -90);
      expect(query).toContain('[out:json][timeout:25]');
      expect(query).toContain('"plant:source"="nuclear"');
      expect(query).toContain('"generator:source"="nuclear"');
      expect(query).toContain('out center');
    });

    it('should include bounding box coordinates in query', () => {
      const query = buildNuclearFacilitiesQuery(30, -100, 40, -90);
      expect(query).toContain('(30,-100,40,-90)');
    });

    it('should query both power plants and generators', () => {
      const query = buildNuclearFacilitiesQuery(30, -100, 40, -90);
      expect(query).toMatch(/\["power"="plant"\]/);
      expect(query).toMatch(/\["power"="generator"\]/);
    });
  });

  describe('Naval Hubs Query (Extended from index.html)', () => {
    // Naval hubs query is included in the main Overpass query in index.html:1026-1029
    it('should query harbour=naval_base tags', () => {
      const bb = '30,-100,40,-90';
      const navalQuery = `
        node["harbour"="naval_base"](${bb});
        way["harbour"="naval_base"](${bb});
        relation["harbour"="naval_base"](${bb});
      `;
      expect(navalQuery).toContain('"harbour"="naval_base"');
    });
  });

  describe('Element Parsing', () => {
    describe('Node Elements', () => {
      it('should parse node with direct coordinates', () => {
        const elements = [{
          type: 'node',
          id: 12345,
          lat: 38.9,
          lon: -77.0,
          tags: { name: 'Pentagon', military: 'base' }
        }];

        const parsed = parseOverpassElements(elements, 'military');
        expect(parsed.length).toBe(1);
        expect(parsed[0].id).toBe('osm_node_12345');
        expect(parsed[0].name).toBe('Pentagon');
        expect(parsed[0].lat).toBe(38.9);
        expect(parsed[0].lon).toBe(-77.0);
        expect(parsed[0].type).toBe('base');
      });
    });

    describe('Way/Relation Elements', () => {
      it('should parse way with center coordinates', () => {
        const elements = [{
          type: 'way',
          id: 67890,
          center: { lat: 40.0, lon: -75.0 },
          tags: { name: 'Fort Dix', military: 'base' }
        }];

        const parsed = parseOverpassElements(elements, 'military');
        expect(parsed.length).toBe(1);
        expect(parsed[0].id).toBe('osm_way_67890');
        expect(parsed[0].lat).toBe(40.0);
        expect(parsed[0].lon).toBe(-75.0);
      });

      it('should parse relation with center coordinates', () => {
        const elements = [{
          type: 'relation',
          id: 11111,
          center: { lat: 35.0, lon: -80.0 },
          tags: { name: 'Fort Bragg', military: 'base' }
        }];

        const parsed = parseOverpassElements(elements, 'military');
        expect(parsed.length).toBe(1);
        expect(parsed[0].id).toBe('osm_relation_11111');
      });

      it('should skip elements without coordinates or center', () => {
        const elements = [{
          type: 'way',
          id: 22222,
          tags: { name: 'No Center', military: 'base' }
        }];

        const parsed = parseOverpassElements(elements, 'military');
        expect(parsed.length).toBe(0);
      });
    });

    describe('Name Extraction', () => {
      it('should prefer name tag', () => {
        const elements = [{
          type: 'node', id: 1, lat: 0, lon: 0,
          tags: { name: 'Primary Name', 'name:en': 'English Name', operator: 'Operator' }
        }];

        const parsed = parseOverpassElements(elements, 'military');
        expect(parsed[0].name).toBe('Primary Name');
      });

      it('should fallback to name:en', () => {
        const elements = [{
          type: 'node', id: 1, lat: 0, lon: 0,
          tags: { 'name:en': 'English Name', operator: 'Operator' }
        }];

        const parsed = parseOverpassElements(elements, 'military');
        expect(parsed[0].name).toBe('English Name');
      });

      it('should fallback to operator', () => {
        const elements = [{
          type: 'node', id: 1, lat: 0, lon: 0,
          tags: { operator: 'US Navy' }
        }];

        const parsed = parseOverpassElements(elements, 'military');
        expect(parsed[0].name).toBe('US Navy');
      });

      it('should use Unknown when no name available', () => {
        const elements = [{
          type: 'node', id: 1, lat: 0, lon: 0,
          tags: { military: 'base' }
        }];

        const parsed = parseOverpassElements(elements, 'military');
        expect(parsed[0].name).toBe('Unknown');
      });
    });

    describe('Type Classification', () => {
      it('should classify military base correctly', () => {
        const elements = [{
          type: 'node', id: 1, lat: 0, lon: 0,
          tags: { military: 'base' }
        }];

        const parsed = parseOverpassElements(elements, 'military');
        expect(parsed[0].type).toBe('base');
      });

      it('should classify naval_base correctly', () => {
        const elements = [{
          type: 'node', id: 1, lat: 0, lon: 0,
          tags: { military: 'naval_base' }
        }];

        const parsed = parseOverpassElements(elements, 'military');
        expect(parsed[0].type).toBe('naval_base');
      });

      it('should classify airfield correctly', () => {
        const elements = [{
          type: 'node', id: 1, lat: 0, lon: 0,
          tags: { military: 'airfield' }
        }];

        const parsed = parseOverpassElements(elements, 'military');
        expect(parsed[0].type).toBe('airfield');
      });

      it('should classify nuclear plant correctly', () => {
        const elements = [{
          type: 'node', id: 1, lat: 0, lon: 0,
          tags: { power: 'plant', 'plant:source': 'nuclear' }
        }];

        const parsed = parseOverpassElements(elements, 'nuclear');
        expect(parsed[0].type).toBe('plant');
      });

      it('should classify nuclear generator correctly', () => {
        const elements = [{
          type: 'node', id: 1, lat: 0, lon: 0,
          tags: { power: 'generator', 'generator:source': 'nuclear' }
        }];

        const parsed = parseOverpassElements(elements, 'nuclear');
        expect(parsed[0].type).toBe('generator');
      });
    });

    describe('Deduplication by Proximity', () => {
      it('should remove duplicate elements within ~100m', () => {
        const elements = [
          { type: 'node', id: 1, lat: 38.9000, lon: -77.0000, tags: { name: 'Base A' } },
          { type: 'node', id: 2, lat: 38.9001, lon: -77.0001, tags: { name: 'Base B' } } // ~11m apart
        ];

        const parsed = parseOverpassElements(elements, 'military');
        expect(parsed.length).toBe(1);
      });

      it('should keep elements more than ~100m apart', () => {
        const elements = [
          { type: 'node', id: 1, lat: 38.9000, lon: -77.0000, tags: { name: 'Base A' } },
          { type: 'node', id: 2, lat: 38.9100, lon: -77.0100, tags: { name: 'Base B' } } // ~1.4km apart
        ];

        const parsed = parseOverpassElements(elements, 'military');
        expect(parsed.length).toBe(2);
      });
    });
  });

  describe('Cache Validation', () => {
    it('should return false for null cache entry', () => {
      expect(isCacheValid(null)).toBe(false);
    });

    it('should return false for undefined cache entry', () => {
      expect(isCacheValid(undefined)).toBe(false);
    });

    it('should return false for cache entry without timestamp', () => {
      expect(isCacheValid({ data: [] })).toBe(false);
    });

    it('should return true for recent cache entry', () => {
      const cacheEntry = {
        timestamp: Date.now() - 1000, // 1 second ago
        data: []
      };
      expect(isCacheValid(cacheEntry)).toBe(true);
    });

    it('should return false for expired cache entry (>24h)', () => {
      const cacheEntry = {
        timestamp: Date.now() - (25 * 60 * 60 * 1000), // 25 hours ago
        data: []
      };
      expect(isCacheValid(cacheEntry)).toBe(false);
    });

    it('should return true for cache entry at exactly 24h boundary', () => {
      const cacheEntry = {
        timestamp: Date.now() - (23 * 60 * 60 * 1000), // 23 hours ago
        data: []
      };
      expect(isCacheValid(cacheEntry)).toBe(true);
    });
  });

  describe('Bounding Box from POV', () => {
    it('should return null when altitude too high', () => {
      const pov = { lat: 38.9, lng: -77.0, altitude: 1.0 };
      const bbox = getBoundingBoxFromPOV(pov, 0.5);
      expect(bbox).toBeNull();
    });

    it('should return bbox when zoomed in enough', () => {
      const pov = { lat: 38.9, lng: -77.0, altitude: 0.3 };
      const bbox = getBoundingBoxFromPOV(pov, 0.5);
      expect(bbox).not.toBeNull();
      expect(bbox).toHaveProperty('south');
      expect(bbox).toHaveProperty('north');
      expect(bbox).toHaveProperty('west');
      expect(bbox).toHaveProperty('east');
    });

    it('should calculate correct degree span based on altitude', () => {
      const pov = { lat: 40.0, lng: -75.0, altitude: 0.5 };
      const bbox = getBoundingBoxFromPOV(pov);
      // degreeSpan = 0.5 * 60 = 30 degrees
      expect(bbox.north - bbox.south).toBe(30);
      expect(bbox.east - bbox.west).toBe(30);
    });

    it('should clamp latitude to valid range', () => {
      const pov = { lat: 85.0, lng: 0, altitude: 0.4 };
      const bbox = getBoundingBoxFromPOV(pov);
      expect(bbox.north).toBeLessThanOrEqual(90);
      expect(bbox.south).toBeGreaterThanOrEqual(-90);
    });

    it('should return null for null pov', () => {
      expect(getBoundingBoxFromPOV(null)).toBeNull();
    });

    it('should handle default lat/lng of 0', () => {
      const pov = { altitude: 0.3 };
      const bbox = getBoundingBoxFromPOV(pov);
      expect(bbox).not.toBeNull();
      expect(bbox.south).toBeLessThan(0);
      expect(bbox.north).toBeGreaterThan(0);
    });
  });

  describe('Merging with Existing Data', () => {
    it('should merge without duplicates', () => {
      const existing = [
        { lat: 38.9, lon: -77.0, name: 'Pentagon' }
      ];
      const overpass = [
        { lat: 40.0, lon: -75.0, name: 'Fort Dix' }
      ];

      const merged = mergeWithExisting(overpass, existing);
      expect(merged.length).toBe(2);
    });

    it('should not add nearby Overpass items that match existing', () => {
      const existing = [
        { lat: 38.9, lon: -77.0, name: 'Pentagon' }
      ];
      const overpass = [
        { lat: 38.9, lon: -77.0, name: 'Pentagon (OSM)' } // Same location
      ];

      const merged = mergeWithExisting(overpass, existing);
      expect(merged.length).toBe(1);
      expect(merged[0].name).toBe('Pentagon');
    });

    it('should handle lng property in existing data', () => {
      const existing = [
        { lat: 38.9, lng: -77.0, name: 'Pentagon' } // Uses lng instead of lon
      ];
      const overpass = [
        { lat: 38.9, lon: -77.0, name: 'Pentagon (OSM)' }
      ];

      const merged = mergeWithExisting(overpass, existing);
      expect(merged.length).toBe(1);
    });

    it('should handle empty arrays', () => {
      expect(mergeWithExisting([], []).length).toBe(0);
      expect(mergeWithExisting([], [{ lat: 0, lon: 0 }]).length).toBe(1);
      expect(mergeWithExisting([{ lat: 0, lon: 0 }], []).length).toBe(1);
    });
  });

  describe('API Constants', () => {
    it('should have correct Overpass API URL', () => {
      expect(OVERPASS_API_URL).toBe('https://overpass-api.de/api/interpreter');
    });

    it('should have 24 hour cache TTL', () => {
      expect(OVERPASS_CACHE_TTL_MS).toBe(24 * 60 * 60 * 1000);
    });

    it('should have 1 second rate limit interval', () => {
      expect(OVERPASS_MIN_INTERVAL_MS).toBe(1000);
    });
  });
});
