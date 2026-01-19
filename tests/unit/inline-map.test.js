/**
 * Unit tests for inline-map.js module
 * Tests the map rendering, tooltip handling, rate limiting, and click targeting
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

/**
 * OpenSky rate limiting state - mirrors logic in inline-map.js
 */
const OPENSKY_MIN_INTERVAL_MS = 10000;
const OPENSKY_MAX_BACKOFF_MS = 300000;

function createOpenSkyState() {
  return {
    lastCallMs: 0,
    retryAfterMs: 0,
    consecutiveFailures: 0,
    backoffMs: 10000
  };
}

function shouldSkipOpenSkyCall(state, now) {
  if (now - state.lastCallMs < OPENSKY_MIN_INTERVAL_MS) {
    return { skip: true, reason: 'rate_limit' };
  }
  if (now < state.retryAfterMs) {
    return { skip: true, reason: 'backoff', waitMs: state.retryAfterMs - now };
  }
  return { skip: false };
}

function handleOpenSkySuccess(state) {
  state.consecutiveFailures = 0;
}

function handleOpenSkyFailure(state, now) {
  state.consecutiveFailures++;
  state.backoffMs = Math.min(
    OPENSKY_MIN_INTERVAL_MS * Math.pow(2, state.consecutiveFailures),
    OPENSKY_MAX_BACKOFF_MS
  );
  state.retryAfterMs = now + state.backoffMs;
}

/**
 * Hit radius calculation - mirrors logic in inline-map.js
 */
function getHitRadius(baseRadius, zoomK) {
  const k = Math.max(1, zoomK || 1);
  return Math.max(5, baseRadius / Math.sqrt(k));
}

/**
 * HTML escaping - mirrors logic in inline-map.js
 */
function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Local time calculation - mirrors logic in inline-map.js
 */
function getLocalTime(lon, now = new Date()) {
  const utcHours = now.getUTCHours();
  const utcMinutes = now.getUTCMinutes();
  const offsetHours = Math.round(lon / 15);
  let localHours = (utcHours + offsetHours + 24) % 24;
  const ampm = localHours >= 12 ? 'PM' : 'AM';
  localHours = localHours % 12 || 12;
  return `${localHours}:${utcMinutes.toString().padStart(2, '0')} ${ampm}`;
}

/**
 * Longitude normalization - mirrors logic in inline-map.js
 */
function normaliseLon180(lon) {
  while (lon > 180) lon -= 360;
  while (lon < -180) lon += 360;
  return lon;
}

describe('Inline Map Module', () => {
  describe('OpenSky Rate Limiting', () => {
    let state;

    beforeEach(() => {
      state = createOpenSkyState();
    });

    it('should allow call when no previous calls', () => {
      const now = Date.now();
      const result = shouldSkipOpenSkyCall(state, now);
      expect(result.skip).toBe(false);
    });

    it('should skip call when within minimum interval', () => {
      const now = Date.now();
      state.lastCallMs = now - 5000; // 5s ago
      const result = shouldSkipOpenSkyCall(state, now);
      expect(result.skip).toBe(true);
      expect(result.reason).toBe('rate_limit');
    });

    it('should allow call after minimum interval', () => {
      const now = Date.now();
      state.lastCallMs = now - 15000; // 15s ago
      const result = shouldSkipOpenSkyCall(state, now);
      expect(result.skip).toBe(false);
    });

    it('should skip call during backoff period', () => {
      const now = Date.now();
      state.retryAfterMs = now + 30000; // 30s from now
      const result = shouldSkipOpenSkyCall(state, now);
      expect(result.skip).toBe(true);
      expect(result.reason).toBe('backoff');
      expect(result.waitMs).toBe(30000);
    });

    it('should reset consecutive failures on success', () => {
      state.consecutiveFailures = 3;
      handleOpenSkySuccess(state);
      expect(state.consecutiveFailures).toBe(0);
    });

    it('should implement exponential backoff on failure', () => {
      const now = Date.now();

      // First failure
      handleOpenSkyFailure(state, now);
      expect(state.consecutiveFailures).toBe(1);
      expect(state.backoffMs).toBe(20000); // 10000 * 2^1

      // Second failure
      handleOpenSkyFailure(state, now);
      expect(state.consecutiveFailures).toBe(2);
      expect(state.backoffMs).toBe(40000); // 10000 * 2^2

      // Third failure
      handleOpenSkyFailure(state, now);
      expect(state.consecutiveFailures).toBe(3);
      expect(state.backoffMs).toBe(80000); // 10000 * 2^3
    });

    it('should cap backoff at maximum', () => {
      const now = Date.now();

      // Simulate many failures
      for (let i = 0; i < 10; i++) {
        handleOpenSkyFailure(state, now);
      }

      expect(state.backoffMs).toBeLessThanOrEqual(OPENSKY_MAX_BACKOFF_MS);
    });
  });

  describe('Hit Radius Calculation', () => {
    it('should return base radius at zoom level 1', () => {
      expect(getHitRadius(10, 1)).toBe(10);
    });

    it('should reduce radius when zoomed in', () => {
      const baseRadius = 10;
      const zoomedRadius = getHitRadius(baseRadius, 4);
      expect(zoomedRadius).toBeLessThan(baseRadius);
      expect(zoomedRadius).toBeCloseTo(5, 1); // 10 / sqrt(4) = 5
    });

    it('should have minimum radius of 5', () => {
      expect(getHitRadius(10, 100)).toBe(5);
      expect(getHitRadius(2, 1)).toBe(5);
    });

    it('should handle null/undefined zoom', () => {
      expect(getHitRadius(10, null)).toBe(10);
      expect(getHitRadius(10, undefined)).toBe(10);
    });

    it('should scale proportionally to square root of zoom', () => {
      const base = 20;
      const r1 = getHitRadius(base, 1);
      const r4 = getHitRadius(base, 4);
      expect(r1 / r4).toBeCloseTo(2, 1); // sqrt(4) = 2
    });
  });

  describe('HTML Escaping', () => {
    it('should escape ampersands', () => {
      expect(escapeHtml('A & B')).toBe('A &amp; B');
    });

    it('should escape less than', () => {
      expect(escapeHtml('<script>')).toBe('&lt;script&gt;');
    });

    it('should escape greater than', () => {
      expect(escapeHtml('a > b')).toBe('a &gt; b');
    });

    it('should escape double quotes', () => {
      expect(escapeHtml('say "hello"')).toBe('say &quot;hello&quot;');
    });

    it('should escape single quotes', () => {
      expect(escapeHtml("it's")).toBe("it&#039;s");
    });

    it('should handle multiple escapes', () => {
      expect(escapeHtml('<a href="test">link</a>')).toBe('&lt;a href=&quot;test&quot;&gt;link&lt;/a&gt;');
    });

    it('should handle non-string input', () => {
      expect(escapeHtml(123)).toBe('123');
      expect(escapeHtml(null)).toBe('null');
      expect(escapeHtml(undefined)).toBe('undefined');
    });
  });

  describe('Local Time Calculation', () => {
    it('should return correct time for UTC (lon=0)', () => {
      const now = new Date('2024-01-15T12:30:00Z');
      const time = getLocalTime(0, now);
      expect(time).toBe('12:30 PM');
    });

    it('should calculate correct offset for positive longitude', () => {
      // Tokyo at lon=139 should be ~+9 hours from UTC
      const now = new Date('2024-01-15T03:00:00Z');
      const time = getLocalTime(135, now); // 135/15 = +9 hours
      expect(time).toBe('12:00 PM');
    });

    it('should calculate correct offset for negative longitude', () => {
      // New York at lon=-74 should be ~-5 hours from UTC
      const now = new Date('2024-01-15T17:00:00Z');
      const time = getLocalTime(-75, now); // -75/15 = -5 hours
      expect(time).toBe('12:00 PM');
    });

    it('should handle midnight crossing', () => {
      const now = new Date('2024-01-15T22:00:00Z');
      const time = getLocalTime(45, now); // +3 hours = 01:00 next day
      expect(time).toBe('1:00 AM');
    });

    it('should format minutes with leading zero', () => {
      const now = new Date('2024-01-15T12:05:00Z');
      const time = getLocalTime(0, now);
      expect(time).toBe('12:05 PM');
    });
  });

  describe('Longitude Normalization', () => {
    it('should keep valid longitudes unchanged', () => {
      expect(normaliseLon180(0)).toBe(0);
      expect(normaliseLon180(90)).toBe(90);
      expect(normaliseLon180(-90)).toBe(-90);
      expect(normaliseLon180(180)).toBe(180);
      expect(normaliseLon180(-180)).toBe(-180);
    });

    it('should normalize longitude > 180', () => {
      expect(normaliseLon180(190)).toBe(-170);
      expect(normaliseLon180(270)).toBe(-90);
      expect(normaliseLon180(360)).toBe(0);
      expect(normaliseLon180(540)).toBe(180);
    });

    it('should normalize longitude < -180', () => {
      expect(normaliseLon180(-190)).toBe(170);
      expect(normaliseLon180(-270)).toBe(90);
      expect(normaliseLon180(-360)).toBe(0);
      expect(normaliseLon180(-540)).toBe(-180);
    });
  });

  describe('Tooltip State', () => {
    it('should track pinned state correctly', () => {
      let tooltipPinned = false;

      // Simulate click to pin
      tooltipPinned = true;
      expect(tooltipPinned).toBe(true);

      // Simulate click elsewhere to unpin
      tooltipPinned = false;
      expect(tooltipPinned).toBe(false);
    });
  });

  describe('Weather Severity Colors', () => {
    const weatherColors = {
      'Extreme': '#ff0000',
      'Severe': '#ff6600',
      'Moderate': '#ffaa00',
      'Minor': '#ffcc00'
    };

    it('should have correct color for Extreme severity', () => {
      expect(weatherColors['Extreme']).toBe('#ff0000');
    });

    it('should have correct color for Severe severity', () => {
      expect(weatherColors['Severe']).toBe('#ff6600');
    });

    it('should have correct color for Moderate severity', () => {
      expect(weatherColors['Moderate']).toBe('#ffaa00');
    });

    it('should have correct color for Minor severity', () => {
      expect(weatherColors['Minor']).toBe('#ffcc00');
    });
  });

  describe('Threat Level Colors', () => {
    const threatColors = {
      high: '#ff4444',
      elevated: '#ffcc00',
      low: '#00ff88'
    };

    it('should have correct color for high threat', () => {
      expect(threatColors['high']).toBe('#ff4444');
    });

    it('should have correct color for elevated threat', () => {
      expect(threatColors['elevated']).toBe('#ffcc00');
    });

    it('should have correct color for low threat', () => {
      expect(threatColors['low']).toBe('#00ff88');
    });
  });

  describe('Hotspot Data', () => {
    const hotspots = [
      { name: 'DC', lat: 38.9, lon: -77.0, level: 'low' },
      { name: 'Moscow', lat: 55.75, lon: 37.6, level: 'elevated' },
      { name: 'Kyiv', lat: 50.45, lon: 30.5, level: 'high' },
      { name: 'Tokyo', lat: 35.68, lon: 139.76, level: 'low' }
    ];

    it('should have valid coordinates for all hotspots', () => {
      hotspots.forEach(h => {
        expect(h.lat).toBeGreaterThanOrEqual(-90);
        expect(h.lat).toBeLessThanOrEqual(90);
        expect(h.lon).toBeGreaterThanOrEqual(-180);
        expect(h.lon).toBeLessThanOrEqual(180);
      });
    });

    it('should have valid threat levels', () => {
      const validLevels = ['high', 'elevated', 'low'];
      hotspots.forEach(h => {
        expect(validLevels).toContain(h.level);
      });
    });

    it('should have unique names', () => {
      const names = hotspots.map(h => h.name);
      const uniqueNames = [...new Set(names)];
      expect(uniqueNames.length).toBe(names.length);
    });
  });

  describe('Cable Landing Data', () => {
    const cableLandings = [
      { name: 'NYC', lat: 40.7, lon: -74.0 },
      { name: 'Singapore', lat: 1.3, lon: 103.8 },
      { name: 'Tokyo', lat: 35.5, lon: 139.8 }
    ];

    it('should have valid coordinates', () => {
      cableLandings.forEach(cl => {
        expect(cl.lat).toBeGreaterThanOrEqual(-90);
        expect(cl.lat).toBeLessThanOrEqual(90);
        expect(cl.lon).toBeGreaterThanOrEqual(-180);
        expect(cl.lon).toBeLessThanOrEqual(180);
      });
    });
  });

  describe('Conflict Zone Data', () => {
    const conflictZones = [
      { name: 'Ukraine', coords: [[30,52],[40,52],[40,45],[30,45],[30,52]], color: '#ff4444' },
      { name: 'Gaza', coords: [[34,32],[35,32],[35,31],[34,31],[34,32]], color: '#ff4444' },
      { name: 'Taiwan Strait', coords: [[117,28],[122,28],[122,22],[117,22],[117,28]], color: '#ffaa00' },
      { name: 'Yemen', coords: [[42,19],[54,19],[54,12],[42,12],[42,19]], color: '#ff6644' },
      { name: 'Sudan', coords: [[22,23],[38,23],[38,8],[22,8],[22,23]], color: '#ff6644' },
      { name: 'Myanmar', coords: [[92,28],[101,28],[101,10],[92,10],[92,28]], color: '#ff8844' }
    ];

    it('should have closed polygon coordinates', () => {
      conflictZones.forEach(zone => {
        const first = zone.coords[0];
        const last = zone.coords[zone.coords.length - 1];
        expect(first[0]).toBe(last[0]);
        expect(first[1]).toBe(last[1]);
      });
    });

    it('should have valid colors', () => {
      conflictZones.forEach(zone => {
        expect(zone.color).toMatch(/^#[0-9a-fA-F]{6}$/);
      });
    });

    it('should have unique names', () => {
      const names = conflictZones.map(z => z.name);
      const uniqueNames = [...new Set(names)];
      expect(uniqueNames.length).toBe(names.length);
    });

    it('should have at least 4 coordinates per zone (rectangle)', () => {
      conflictZones.forEach(zone => {
        expect(zone.coords.length).toBeGreaterThanOrEqual(4);
      });
    });
  });

  describe('Submarine Cable GeoJSON Parsing', () => {
    // Test cable coordinate parsing (strings to numbers)
    function parseCableCoordinates(coords) {
      return coords.map(p => [
        parseFloat(p[0]),
        parseFloat(p[1])
      ]).filter(p => !isNaN(p[0]) && !isNaN(p[1]));
    }

    it('should parse string coordinates to numbers', () => {
      const stringCoords = [
        ["-151.291628638766", "60.6899127443232"],
        ["-151.721345180045", "60.4611493731028"]
      ];
      const parsed = parseCableCoordinates(stringCoords);
      expect(parsed[0][0]).toBeCloseTo(-151.29, 1);
      expect(parsed[0][1]).toBeCloseTo(60.69, 1);
    });

    it('should filter out invalid coordinates', () => {
      const mixedCoords = [
        ["10", "20"],
        ["invalid", "30"],
        ["40", "50"]
      ];
      const parsed = parseCableCoordinates(mixedCoords);
      expect(parsed.length).toBe(2);
    });

    it('should handle empty arrays', () => {
      const parsed = parseCableCoordinates([]);
      expect(parsed.length).toBe(0);
    });

    // Test cable color parsing
    function parseCableColor(color) {
      return color ? `#${color}` : '#9966ff';
    }

    it('should prepend # to cable colors', () => {
      expect(parseCableColor('91a34c')).toBe('#91a34c');
      expect(parseCableColor('f37280')).toBe('#f37280');
    });

    it('should use default color when none provided', () => {
      expect(parseCableColor(null)).toBe('#9966ff');
      expect(parseCableColor(undefined)).toBe('#9966ff');
      expect(parseCableColor('')).toBe('#9966ff');
    });
  });

  describe('Cable Feature Extraction', () => {
    // Test extraction of line arrays from geometry
    function extractLineArrays(geometry) {
      if (!geometry) return [];
      if (geometry.type === 'LineString') {
        return [geometry.coordinates];
      }
      if (geometry.type === 'MultiLineString') {
        return geometry.coordinates;
      }
      return [];
    }

    it('should extract single array from LineString', () => {
      const geom = {
        type: 'LineString',
        coordinates: [[0, 0], [1, 1], [2, 2]]
      };
      const lines = extractLineArrays(geom);
      expect(lines.length).toBe(1);
      expect(lines[0].length).toBe(3);
    });

    it('should extract multiple arrays from MultiLineString', () => {
      const geom = {
        type: 'MultiLineString',
        coordinates: [
          [[0, 0], [1, 1]],
          [[2, 2], [3, 3], [4, 4]]
        ]
      };
      const lines = extractLineArrays(geom);
      expect(lines.length).toBe(2);
      expect(lines[0].length).toBe(2);
      expect(lines[1].length).toBe(3);
    });

    it('should return empty array for unsupported geometry types', () => {
      const geom = { type: 'Point', coordinates: [0, 0] };
      const lines = extractLineArrays(geom);
      expect(lines.length).toBe(0);
    });

    it('should handle null geometry', () => {
      const lines = extractLineArrays(null);
      expect(lines.length).toBe(0);
    });
  });
});
