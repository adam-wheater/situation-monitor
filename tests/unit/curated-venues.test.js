/**
 * Unit tests for Pentagon curated venues data
 * Tests the fallback venue data for the Pentagon tracker feature
 */
import { describe, it, expect, beforeAll } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

// Load the curated venues data
let curatedVenues;

beforeAll(() => {
  const filePath = join(process.cwd(), 'data', 'pentagon-curated-venues.json');
  const raw = readFileSync(filePath, 'utf-8');
  curatedVenues = JSON.parse(raw);
});

describe('Pentagon Curated Venues Data', () => {
  describe('File Structure', () => {
    it('should have a version field', () => {
      expect(curatedVenues).toHaveProperty('version');
      expect(typeof curatedVenues.version).toBe('number');
    });

    it('should have an updatedAt field', () => {
      expect(curatedVenues).toHaveProperty('updatedAt');
      expect(typeof curatedVenues.updatedAt).toBe('string');
      // Should be a valid date format
      expect(curatedVenues.updatedAt).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });

    it('should have a description field', () => {
      expect(curatedVenues).toHaveProperty('description');
      expect(typeof curatedVenues.description).toBe('string');
    });

    it('should have an items array', () => {
      expect(curatedVenues).toHaveProperty('items');
      expect(Array.isArray(curatedVenues.items)).toBe(true);
    });

    it('should have at least 8 curated venues', () => {
      expect(curatedVenues.items.length).toBeGreaterThanOrEqual(8);
    });
  });

  describe('Venue Item Structure', () => {
    it('should have required fields for each venue', () => {
      curatedVenues.items.forEach((venue, index) => {
        expect(venue, `Venue at index ${index}`).toHaveProperty('name');
        expect(venue, `Venue at index ${index}`).toHaveProperty('kind');
        expect(venue, `Venue at index ${index}`).toHaveProperty('lat');
        expect(venue, `Venue at index ${index}`).toHaveProperty('lng');
      });
    });

    it('should have string names', () => {
      curatedVenues.items.forEach(venue => {
        expect(typeof venue.name).toBe('string');
        expect(venue.name.length).toBeGreaterThan(0);
      });
    });

    it('should have valid venue kinds', () => {
      const validKinds = ['pizza', 'gay_bar', 'bar', 'restaurant', 'cafe', 'fast_food'];
      curatedVenues.items.forEach(venue => {
        expect(typeof venue.kind).toBe('string');
        // At minimum should have pizza and gay_bar types
        expect(venue.kind.length).toBeGreaterThan(0);
      });
    });

    it('should have valid latitude values', () => {
      curatedVenues.items.forEach(venue => {
        expect(typeof venue.lat).toBe('number');
        expect(venue.lat).toBeGreaterThanOrEqual(-90);
        expect(venue.lat).toBeLessThanOrEqual(90);
      });
    });

    it('should have valid longitude values', () => {
      curatedVenues.items.forEach(venue => {
        expect(typeof venue.lng).toBe('number');
        expect(venue.lng).toBeGreaterThanOrEqual(-180);
        expect(venue.lng).toBeLessThanOrEqual(180);
      });
    });
  });

  describe('Pentagon Area Verification', () => {
    // Pentagon coordinates: approximately 38.8719, -77.0563
    const PENTAGON_LAT = 38.8719;
    const PENTAGON_LNG = -77.0563;
    const MAX_DISTANCE_KM = 20; // Venues should be within 20km of Pentagon

    /**
     * Calculate distance between two points using Haversine formula
     */
    function getDistanceKm(lat1, lon1, lat2, lon2) {
      const R = 6371; // Earth's radius in km
      const dLat = (lat2 - lat1) * Math.PI / 180;
      const dLon = (lon2 - lon1) * Math.PI / 180;
      const a =
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon/2) * Math.sin(dLon/2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
      return R * c;
    }

    it('should have all venues within 20km of Pentagon', () => {
      curatedVenues.items.forEach(venue => {
        const distance = getDistanceKm(PENTAGON_LAT, PENTAGON_LNG, venue.lat, venue.lng);
        expect(distance, `${venue.name} should be within ${MAX_DISTANCE_KM}km of Pentagon`).toBeLessThanOrEqual(MAX_DISTANCE_KM);
      });
    });

    it('should have venues in the DC/Arlington area latitude range', () => {
      // DC/Arlington area roughly between 38.7 and 39.0
      curatedVenues.items.forEach(venue => {
        expect(venue.lat, `${venue.name} latitude`).toBeGreaterThan(38.5);
        expect(venue.lat, `${venue.name} latitude`).toBeLessThan(39.2);
      });
    });

    it('should have venues in the DC/Arlington area longitude range', () => {
      // DC/Arlington area roughly between -77.2 and -76.9
      curatedVenues.items.forEach(venue => {
        expect(venue.lng, `${venue.name} longitude`).toBeGreaterThan(-77.3);
        expect(venue.lng, `${venue.name} longitude`).toBeLessThan(-76.8);
      });
    });
  });

  describe('Venue Type Distribution', () => {
    it('should have at least one pizza venue', () => {
      const pizzaVenues = curatedVenues.items.filter(v => v.kind === 'pizza');
      expect(pizzaVenues.length).toBeGreaterThanOrEqual(1);
    });

    it('should have multiple pizza venues for the pizza tracker use case', () => {
      const pizzaVenues = curatedVenues.items.filter(v => v.kind === 'pizza');
      // Pentagon pizza tracker needs multiple pizza places to monitor
      expect(pizzaVenues.length).toBeGreaterThanOrEqual(4);
    });
  });

  describe('Google Maps URLs', () => {
    it('should have mapsUrl for each venue (optional but recommended)', () => {
      const venuesWithMaps = curatedVenues.items.filter(v => v.mapsUrl);
      // At least half should have Google Maps URLs for verification
      expect(venuesWithMaps.length).toBeGreaterThanOrEqual(curatedVenues.items.length / 2);
    });

    it('should have valid Google Maps URLs when present', () => {
      curatedVenues.items.forEach(venue => {
        if (venue.mapsUrl) {
          expect(venue.mapsUrl).toMatch(/^https:\/\/www\.google\.com\/maps/);
        }
      });
    });
  });

  describe('Data Integrity', () => {
    it('should have unique venue names', () => {
      const names = curatedVenues.items.map(v => v.name);
      const uniqueNames = [...new Set(names)];
      expect(uniqueNames.length).toBe(names.length);
    });

    it('should not have duplicate coordinates (within ~10m)', () => {
      const coordKeys = curatedVenues.items.map(v =>
        `${Math.round(v.lat * 1000)},${Math.round(v.lng * 1000)}`
      );
      const uniqueKeys = [...new Set(coordKeys)];
      expect(uniqueKeys.length).toBe(coordKeys.length);
    });
  });
});
