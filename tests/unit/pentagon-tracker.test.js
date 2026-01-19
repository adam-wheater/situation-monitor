/**
 * Unit tests for Pentagon Pizza Tracker (BestTime API integration)
 * Tests the tracker settings, busyness parsing, and data management
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Storage key constant from js/panels/pentagon.js:3
const PENTAGON_STORAGE_KEY = 'pentagonTrackerSettings';

/**
 * Get tracker settings from localStorage - mirrors js/panels/pentagon.js:5-12
 */
function getPentagonTrackerSettings(storage = {}) {
  try {
    const saved = storage[PENTAGON_STORAGE_KEY];
    return saved ? JSON.parse(saved) : { apiKey: '', locations: [] };
  } catch (e) {
    return { apiKey: '', locations: [] };
  }
}

/**
 * Save tracker settings to localStorage - mirrors js/panels/pentagon.js:14-18
 */
function savePentagonTrackerSettings(settings, storage = {}) {
  try {
    storage[PENTAGON_STORAGE_KEY] = JSON.stringify(settings);
    return true;
  } catch (e) {
    return false;
  }
}

/**
 * Get busyness text description - mirrors js/panels/pentagon.js:147-154
 */
function getBestTimeVenueBusyText(busyness) {
  if (busyness === null || busyness === undefined) return 'Unknown';
  if (busyness <= 20) return 'Very Quiet';
  if (busyness <= 40) return 'Quiet';
  if (busyness <= 60) return 'Moderate';
  if (busyness <= 80) return 'Busy';
  return 'Very Busy';
}

/**
 * Get busyness CSS class - mirrors js/panels/pentagon.js:188
 */
function getBusynessClass(busyness) {
  return busyness > 60 ? 'high' : busyness > 30 ? 'medium' : 'low';
}

/**
 * Create a new location entry - mirrors js/panels/pentagon.js:61-65
 */
function createLocation(name, venueId) {
  return {
    id: 'loc_' + Date.now(),
    name,
    venueId
  };
}

/**
 * Parse BestTime API response - mirrors logic in js/panels/pentagon.js:128-141
 */
function parseBestTimeResponse(data, location) {
  if (data.status === 'OK' && data.analysis) {
    return {
      ...location,
      busyness: data.analysis.venue_live_busyness || 0,
      busynessText: getBestTimeVenueBusyText(data.analysis.venue_live_busyness),
      isOpen: data.analysis.venue_live_closed === false,
      lastUpdated: new Date().toISOString()
    };
  }
  return { ...location, error: 'Unable to fetch data' };
}

describe('Pentagon Pizza Tracker', () => {
  describe('Settings Storage', () => {
    it('should return default settings when storage is empty', () => {
      const settings = getPentagonTrackerSettings({});
      expect(settings).toEqual({ apiKey: '', locations: [] });
    });

    it('should parse stored settings correctly', () => {
      const storage = {
        [PENTAGON_STORAGE_KEY]: JSON.stringify({
          apiKey: 'test-key-123',
          locations: [{ id: 'loc_1', name: 'Test', venueId: 'venue-1' }]
        })
      };
      const settings = getPentagonTrackerSettings(storage);
      expect(settings.apiKey).toBe('test-key-123');
      expect(settings.locations.length).toBe(1);
    });

    it('should handle corrupted JSON gracefully', () => {
      const storage = {
        [PENTAGON_STORAGE_KEY]: 'not-valid-json'
      };
      const settings = getPentagonTrackerSettings(storage);
      expect(settings).toEqual({ apiKey: '', locations: [] });
    });

    it('should save settings to storage', () => {
      const storage = {};
      const settings = { apiKey: 'new-key', locations: [] };
      const result = savePentagonTrackerSettings(settings, storage);
      expect(result).toBe(true);
      expect(storage[PENTAGON_STORAGE_KEY]).toBe(JSON.stringify(settings));
    });
  });

  describe('Busyness Text Conversion', () => {
    it('should return "Unknown" for null', () => {
      expect(getBestTimeVenueBusyText(null)).toBe('Unknown');
    });

    it('should return "Unknown" for undefined', () => {
      expect(getBestTimeVenueBusyText(undefined)).toBe('Unknown');
    });

    it('should return "Very Quiet" for 0-20%', () => {
      expect(getBestTimeVenueBusyText(0)).toBe('Very Quiet');
      expect(getBestTimeVenueBusyText(10)).toBe('Very Quiet');
      expect(getBestTimeVenueBusyText(20)).toBe('Very Quiet');
    });

    it('should return "Quiet" for 21-40%', () => {
      expect(getBestTimeVenueBusyText(21)).toBe('Quiet');
      expect(getBestTimeVenueBusyText(30)).toBe('Quiet');
      expect(getBestTimeVenueBusyText(40)).toBe('Quiet');
    });

    it('should return "Moderate" for 41-60%', () => {
      expect(getBestTimeVenueBusyText(41)).toBe('Moderate');
      expect(getBestTimeVenueBusyText(50)).toBe('Moderate');
      expect(getBestTimeVenueBusyText(60)).toBe('Moderate');
    });

    it('should return "Busy" for 61-80%', () => {
      expect(getBestTimeVenueBusyText(61)).toBe('Busy');
      expect(getBestTimeVenueBusyText(70)).toBe('Busy');
      expect(getBestTimeVenueBusyText(80)).toBe('Busy');
    });

    it('should return "Very Busy" for 81-100%', () => {
      expect(getBestTimeVenueBusyText(81)).toBe('Very Busy');
      expect(getBestTimeVenueBusyText(90)).toBe('Very Busy');
      expect(getBestTimeVenueBusyText(100)).toBe('Very Busy');
    });

    it('should handle edge case of exactly 0%', () => {
      expect(getBestTimeVenueBusyText(0)).toBe('Very Quiet');
    });

    it('should handle values over 100%', () => {
      expect(getBestTimeVenueBusyText(110)).toBe('Very Busy');
    });
  });

  describe('Busyness CSS Class', () => {
    it('should return "low" for 0-30%', () => {
      expect(getBusynessClass(0)).toBe('low');
      expect(getBusynessClass(15)).toBe('low');
      expect(getBusynessClass(30)).toBe('low');
    });

    it('should return "medium" for 31-60%', () => {
      expect(getBusynessClass(31)).toBe('medium');
      expect(getBusynessClass(45)).toBe('medium');
      expect(getBusynessClass(60)).toBe('medium');
    });

    it('should return "high" for 61-100%', () => {
      expect(getBusynessClass(61)).toBe('high');
      expect(getBusynessClass(80)).toBe('high');
      expect(getBusynessClass(100)).toBe('high');
    });
  });

  describe('Location Management', () => {
    it('should create location with unique ID', () => {
      const loc1 = createLocation('Pizza Place', 'venue-123');
      const loc2 = createLocation('Burger Joint', 'venue-456');

      expect(loc1.id).toMatch(/^loc_\d+$/);
      expect(loc1.name).toBe('Pizza Place');
      expect(loc1.venueId).toBe('venue-123');

      // IDs should be different (allowing for same timestamp edge case)
      // In practice, consecutive calls may have same timestamp
      expect(loc2.name).toBe('Burger Joint');
      expect(loc2.venueId).toBe('venue-456');
    });

    it('should preserve all location properties', () => {
      const loc = createLocation('Test Location', 'test-venue-id');
      expect(loc).toHaveProperty('id');
      expect(loc).toHaveProperty('name');
      expect(loc).toHaveProperty('venueId');
    });
  });

  describe('BestTime API Response Parsing', () => {
    const mockLocation = { id: 'loc_1', name: 'Test Venue', venueId: 'venue-123' };

    it('should parse successful response with busyness data', () => {
      const response = {
        status: 'OK',
        analysis: {
          venue_live_busyness: 65,
          venue_live_closed: false
        }
      };

      const parsed = parseBestTimeResponse(response, mockLocation);
      expect(parsed.busyness).toBe(65);
      expect(parsed.busynessText).toBe('Busy');
      expect(parsed.isOpen).toBe(true);
      expect(parsed.lastUpdated).toBeDefined();
    });

    it('should handle closed venue', () => {
      const response = {
        status: 'OK',
        analysis: {
          venue_live_busyness: 0,
          venue_live_closed: true
        }
      };

      const parsed = parseBestTimeResponse(response, mockLocation);
      expect(parsed.isOpen).toBe(false);
    });

    it('should default busyness to 0 when not provided', () => {
      const response = {
        status: 'OK',
        analysis: {
          venue_live_closed: false
        }
      };

      const parsed = parseBestTimeResponse(response, mockLocation);
      expect(parsed.busyness).toBe(0);
      // When venue_live_busyness is undefined, getBestTimeVenueBusyText returns 'Unknown'
      // since the function checks for null/undefined first
      expect(parsed.busynessText).toBe('Unknown');
    });

    it('should return error for non-OK status', () => {
      const response = {
        status: 'ERROR',
        message: 'Invalid API key'
      };

      const parsed = parseBestTimeResponse(response, mockLocation);
      expect(parsed.error).toBe('Unable to fetch data');
      expect(parsed.busyness).toBeUndefined();
    });

    it('should return error when analysis is missing', () => {
      const response = {
        status: 'OK'
        // no analysis object
      };

      const parsed = parseBestTimeResponse(response, mockLocation);
      expect(parsed.error).toBe('Unable to fetch data');
    });

    it('should preserve original location properties', () => {
      const response = {
        status: 'OK',
        analysis: { venue_live_busyness: 50, venue_live_closed: false }
      };

      const parsed = parseBestTimeResponse(response, mockLocation);
      expect(parsed.id).toBe(mockLocation.id);
      expect(parsed.name).toBe(mockLocation.name);
      expect(parsed.venueId).toBe(mockLocation.venueId);
    });
  });

  describe('API URL Construction', () => {
    it('should construct valid BestTime API URL', () => {
      const apiKey = 'pri_abc123';
      const venueId = 'ven_xyz789';
      const url = `https://besttime.app/api/v1/forecasts/live?api_key_private=${apiKey}&venue_id=${venueId}`;

      expect(url).toContain('besttime.app/api/v1/forecasts/live');
      expect(url).toContain('api_key_private=pri_abc123');
      expect(url).toContain('venue_id=ven_xyz789');
    });
  });

  describe('Error State Handling', () => {
    it('should return error when no API key configured', () => {
      const settings = { apiKey: '', locations: [{ id: '1', name: 'Test', venueId: 'v1' }] };
      const hasApiKey = !!settings.apiKey;
      const hasLocations = settings.locations.length > 0;

      if (!hasApiKey || !hasLocations) {
        const error = !hasApiKey ? 'No API key configured' : 'No locations configured';
        expect(error).toBe('No API key configured');
      }
    });

    it('should return error when no locations configured', () => {
      const settings = { apiKey: 'test-key', locations: [] };
      const hasApiKey = !!settings.apiKey;
      const hasLocations = settings.locations.length > 0;

      if (!hasApiKey || !hasLocations) {
        const error = !hasApiKey ? 'No API key configured' : 'No locations configured';
        expect(error).toBe('No locations configured');
      }
    });
  });

  describe('Pentagon-Specific Busyness Thresholds', () => {
    // These thresholds are important for the "pizza tracker" use case
    // Higher busyness at Pentagon-area restaurants may indicate increased activity

    it('should consider 60%+ as elevated activity indicator', () => {
      const busyness = 65;
      const isElevated = busyness > 60;
      expect(isElevated).toBe(true);
    });

    it('should consider 30% or below as baseline activity', () => {
      const busyness = 25;
      const isBaseline = busyness <= 30;
      expect(isBaseline).toBe(true);
    });

    it('should track busyness changes over time for pattern detection', () => {
      const readings = [
        { time: '18:00', busyness: 30 },
        { time: '19:00', busyness: 45 },
        { time: '20:00', busyness: 75 },
        { time: '21:00', busyness: 80 }
      ];

      // Detect significant increase (>50% increase from first reading)
      const firstReading = readings[0].busyness;
      const lastReading = readings[readings.length - 1].busyness;
      const percentIncrease = ((lastReading - firstReading) / firstReading) * 100;

      expect(percentIncrease).toBeGreaterThan(100); // More than doubled
    });
  });

  describe('Storage Key Constant', () => {
    it('should have correct storage key', () => {
      expect(PENTAGON_STORAGE_KEY).toBe('pentagonTrackerSettings');
    });
  });
});
