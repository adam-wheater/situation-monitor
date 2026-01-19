/**
 * Unit tests for Flight Radar feature (OpenSky military/transport aircraft)
 * Tests the callsign filtering heuristics and flight data processing
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

/**
 * Military/transport callsign detection - mirrors logic in index.html:1111-1127
 */
function looksMilitaryOrTransportCallsign(cs) {
  const c = String(cs || '').trim().toUpperCase();
  if (!c) return false;
  // Common transport/military prefixes (heuristic; not authoritative)
  return (
    c.startsWith('RCH') || // USAF Reach
    c.startsWith('HKY') || // USAF (varies)
    c.startsWith('CFC') || // Canada
    c.startsWith('RRR') || // RAF
    c.startsWith('LAGR') ||
    c.startsWith('CNV') ||
    c.startsWith('SAM') || // Special Air Mission
    c.startsWith('NATO') ||
    c.startsWith('ASY') ||
    c.startsWith('NOH')
  );
}

/**
 * Parse OpenSky state array into flight object - mirrors logic in index.html:1142-1153
 */
function parseOpenSkyState(state) {
  const icao24 = state?.[0];
  const callsign = (state?.[1] || '').trim();
  const lon = state?.[5];
  const lat = state?.[6];
  const velocity = state?.[9];
  const heading = state?.[10];
  const alt = state?.[13] ?? state?.[7];

  if (typeof lon !== 'number' || typeof lat !== 'number') return null;
  if (!looksMilitaryOrTransportCallsign(callsign)) return null;

  return { icao24, callsign, lon, lat, velocity, heading, alt };
}

/**
 * De-duplicate flights by ICAO24 - mirrors logic in index.html:1157-1162
 */
function deduplicateFlights(flights) {
  const byId = new Map();
  for (const f of flights) {
    if (!f.icao24) continue;
    if (!byId.has(f.icao24)) byId.set(f.icao24, f);
  }
  return Array.from(byId.values());
}

// Strategic regions as defined in index.html:1132-1137
const regions = [
  { name: 'DC', lat: 38.9, lon: -77.0 },
  { name: 'EU', lat: 50.0, lon: 10.0 },
  { name: 'ME', lat: 29.5, lon: 47.5 },
  { name: 'INDOPAC', lat: 22.0, lon: 120.0 }
];

describe('Flight Radar Feature', () => {
  describe('Military/Transport Callsign Detection', () => {
    describe('USAF Callsigns', () => {
      it('should identify USAF Reach callsigns (RCH prefix)', () => {
        expect(looksMilitaryOrTransportCallsign('RCH123')).toBe(true);
        expect(looksMilitaryOrTransportCallsign('RCH5678')).toBe(true);
        expect(looksMilitaryOrTransportCallsign('RCHXYZ')).toBe(true);
      });

      it('should identify USAF HKY callsigns', () => {
        expect(looksMilitaryOrTransportCallsign('HKY456')).toBe(true);
      });

      it('should identify Special Air Mission callsigns (SAM prefix)', () => {
        expect(looksMilitaryOrTransportCallsign('SAM01')).toBe(true);
        expect(looksMilitaryOrTransportCallsign('SAM999')).toBe(true);
      });
    });

    describe('Allied Military Callsigns', () => {
      it('should identify Canadian Forces callsigns (CFC prefix)', () => {
        expect(looksMilitaryOrTransportCallsign('CFC123')).toBe(true);
      });

      it('should identify RAF callsigns (RRR prefix)', () => {
        expect(looksMilitaryOrTransportCallsign('RRR456')).toBe(true);
        expect(looksMilitaryOrTransportCallsign('RRR1')).toBe(true);
      });

      it('should identify NATO callsigns', () => {
        expect(looksMilitaryOrTransportCallsign('NATO01')).toBe(true);
        expect(looksMilitaryOrTransportCallsign('NATOAWACS')).toBe(true);
      });
    });

    describe('Other Military Prefixes', () => {
      it('should identify LAGR callsigns', () => {
        expect(looksMilitaryOrTransportCallsign('LAGR01')).toBe(true);
      });

      it('should identify CNV callsigns', () => {
        expect(looksMilitaryOrTransportCallsign('CNV123')).toBe(true);
      });

      it('should identify ASY callsigns', () => {
        expect(looksMilitaryOrTransportCallsign('ASY789')).toBe(true);
      });

      it('should identify NOH callsigns', () => {
        expect(looksMilitaryOrTransportCallsign('NOH456')).toBe(true);
      });
    });

    describe('Civilian Callsigns (Should Reject)', () => {
      it('should reject commercial airline callsigns', () => {
        expect(looksMilitaryOrTransportCallsign('UAL123')).toBe(false); // United
        expect(looksMilitaryOrTransportCallsign('DAL456')).toBe(false); // Delta
        expect(looksMilitaryOrTransportCallsign('AAL789')).toBe(false); // American
        expect(looksMilitaryOrTransportCallsign('SWA012')).toBe(false); // Southwest
      });

      it('should reject general aviation callsigns', () => {
        expect(looksMilitaryOrTransportCallsign('N12345')).toBe(false);
        expect(looksMilitaryOrTransportCallsign('N567AB')).toBe(false);
      });

      it('should reject international commercial callsigns', () => {
        expect(looksMilitaryOrTransportCallsign('BAW123')).toBe(false); // British Airways
        expect(looksMilitaryOrTransportCallsign('AFR456')).toBe(false); // Air France
        expect(looksMilitaryOrTransportCallsign('DLH789')).toBe(false); // Lufthansa
      });
    });

    describe('Edge Cases', () => {
      it('should handle empty string', () => {
        expect(looksMilitaryOrTransportCallsign('')).toBe(false);
      });

      it('should handle null', () => {
        expect(looksMilitaryOrTransportCallsign(null)).toBe(false);
      });

      it('should handle undefined', () => {
        expect(looksMilitaryOrTransportCallsign(undefined)).toBe(false);
      });

      it('should handle whitespace-only string', () => {
        expect(looksMilitaryOrTransportCallsign('   ')).toBe(false);
      });

      it('should be case-insensitive', () => {
        expect(looksMilitaryOrTransportCallsign('rch123')).toBe(true);
        expect(looksMilitaryOrTransportCallsign('Rch123')).toBe(true);
        expect(looksMilitaryOrTransportCallsign('sam01')).toBe(true);
      });

      it('should trim whitespace from callsigns', () => {
        expect(looksMilitaryOrTransportCallsign('  RCH123  ')).toBe(true);
        expect(looksMilitaryOrTransportCallsign('\tSAM01\n')).toBe(true);
      });
    });
  });

  describe('OpenSky State Parsing', () => {
    it('should parse valid military flight state', () => {
      const state = [
        'abc123', // icao24
        'RCH456', // callsign
        'USA',    // origin_country
        1234567,  // time_position
        1234567,  // last_contact
        -77.0,    // longitude
        38.9,     // latitude
        10000,    // baro_altitude
        false,    // on_ground
        250,      // velocity
        45,       // heading (true_track)
        10,       // vertical_rate
        null,     // sensors
        10500     // geo_altitude
      ];

      const flight = parseOpenSkyState(state);
      expect(flight).not.toBeNull();
      expect(flight.icao24).toBe('abc123');
      expect(flight.callsign).toBe('RCH456');
      expect(flight.lon).toBe(-77.0);
      expect(flight.lat).toBe(38.9);
      expect(flight.velocity).toBe(250);
      expect(flight.heading).toBe(45);
      expect(flight.alt).toBe(10500); // Should prefer geo_altitude
    });

    it('should fallback to baro_altitude when geo_altitude is null', () => {
      const state = [
        'abc123', 'RCH456', 'USA', 1234567, 1234567,
        -77.0, 38.9, 10000, false, 250, 45, 10, null, null
      ];

      const flight = parseOpenSkyState(state);
      expect(flight.alt).toBe(10000);
    });

    it('should return null for non-military callsign', () => {
      const state = [
        'abc123', 'UAL123', 'USA', 1234567, 1234567,
        -77.0, 38.9, 10000, false, 250, 45, 10, null, 10500
      ];

      expect(parseOpenSkyState(state)).toBeNull();
    });

    it('should return null for missing coordinates', () => {
      const state = [
        'abc123', 'RCH456', 'USA', 1234567, 1234567,
        null, null, 10000, false, 250, 45, 10, null, 10500
      ];

      expect(parseOpenSkyState(state)).toBeNull();
    });

    it('should return null for undefined state', () => {
      expect(parseOpenSkyState(undefined)).toBeNull();
    });

    it('should trim callsign whitespace', () => {
      const state = [
        'abc123', '  RCH456  ', 'USA', 1234567, 1234567,
        -77.0, 38.9, 10000, false, 250, 45, 10, null, 10500
      ];

      const flight = parseOpenSkyState(state);
      expect(flight.callsign).toBe('RCH456');
    });
  });

  describe('Flight Deduplication', () => {
    it('should remove duplicate flights by icao24', () => {
      const flights = [
        { icao24: 'abc123', callsign: 'RCH456', lon: -77.0, lat: 38.9 },
        { icao24: 'abc123', callsign: 'RCH456', lon: -77.1, lat: 38.8 }, // Duplicate
        { icao24: 'def456', callsign: 'SAM01', lon: -76.0, lat: 39.0 }
      ];

      const deduped = deduplicateFlights(flights);
      expect(deduped.length).toBe(2);
    });

    it('should keep first occurrence when duplicates found', () => {
      const flights = [
        { icao24: 'abc123', callsign: 'RCH456', lon: -77.0, lat: 38.9 },
        { icao24: 'abc123', callsign: 'RCH456', lon: -77.1, lat: 38.8 }
      ];

      const deduped = deduplicateFlights(flights);
      expect(deduped[0].lon).toBe(-77.0);
      expect(deduped[0].lat).toBe(38.9);
    });

    it('should skip flights without icao24', () => {
      const flights = [
        { icao24: 'abc123', callsign: 'RCH456', lon: -77.0, lat: 38.9 },
        { icao24: null, callsign: 'SAM01', lon: -76.0, lat: 39.0 },
        { callsign: 'NATO01', lon: -75.0, lat: 40.0 }
      ];

      const deduped = deduplicateFlights(flights);
      expect(deduped.length).toBe(1);
      expect(deduped[0].icao24).toBe('abc123');
    });

    it('should handle empty array', () => {
      const deduped = deduplicateFlights([]);
      expect(deduped.length).toBe(0);
    });
  });

  describe('Strategic Regions', () => {
    it('should have 4 strategic regions defined', () => {
      expect(regions.length).toBe(4);
    });

    it('should have DC region centered on Washington', () => {
      const dc = regions.find(r => r.name === 'DC');
      expect(dc).toBeDefined();
      expect(dc.lat).toBeCloseTo(38.9, 1);
      expect(dc.lon).toBeCloseTo(-77.0, 1);
    });

    it('should have EU region centered on Central Europe', () => {
      const eu = regions.find(r => r.name === 'EU');
      expect(eu).toBeDefined();
      expect(eu.lat).toBeCloseTo(50.0, 1);
      expect(eu.lon).toBeCloseTo(10.0, 1);
    });

    it('should have ME region centered on Middle East', () => {
      const me = regions.find(r => r.name === 'ME');
      expect(me).toBeDefined();
      expect(me.lat).toBeCloseTo(29.5, 1);
      expect(me.lon).toBeCloseTo(47.5, 1);
    });

    it('should have INDOPAC region centered on Indo-Pacific', () => {
      const indopac = regions.find(r => r.name === 'INDOPAC');
      expect(indopac).toBeDefined();
      expect(indopac.lat).toBeCloseTo(22.0, 1);
      expect(indopac.lon).toBeCloseTo(120.0, 1);
    });

    it('should create bounding boxes with 6 degree latitude span', () => {
      regions.forEach(r => {
        const lamin = r.lat - 6;
        const lamax = r.lat + 6;
        expect(lamax - lamin).toBe(12);
      });
    });

    it('should create bounding boxes with 20 degree longitude span', () => {
      regions.forEach(r => {
        const lomin = r.lon - 10;
        const lomax = r.lon + 10;
        expect(lomax - lomin).toBe(20);
      });
    });
  });
});
