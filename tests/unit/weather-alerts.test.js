/**
 * Unit tests for Weather Warnings feature (US NWS alerts)
 * Tests the weather alert data processing and display logic
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock weather data structure matching NWS API response
const createMockWeatherAlert = (overrides = {}) => ({
  properties: {
    severity: 'Severe',
    event: 'Tornado Warning',
    headline: 'Tornado Warning in effect',
    description: 'A tornado warning has been issued for the area.',
    areaDesc: 'Jefferson County, AL',
    senderName: 'NWS Birmingham AL',
    ...overrides
  }
});

// Weather severity colors as defined in index.html:669-674
const weatherColors = {
  'Extreme': '#ff0000',
  'Severe': '#ff6600',
  'Moderate': '#ffaa00',
  'Minor': '#ffcc00'
};

// US state centroids as defined in index.html:677-691
const stateCentroids = {
  'AL': [32.7, -86.7], 'AK': [64.0, -153.0], 'AZ': [34.2, -111.6], 'AR': [34.8, -92.4],
  'CA': [37.2, -119.4], 'CO': [39.0, -105.5], 'CT': [41.6, -72.7], 'DE': [39.0, -75.5],
  'FL': [28.6, -82.4], 'GA': [32.6, -83.4], 'HI': [20.8, -156.3], 'ID': [44.4, -114.6],
  'IL': [40.0, -89.2], 'IN': [39.9, -86.3], 'IA': [42.0, -93.5], 'KS': [38.5, -98.4],
  'KY': [37.5, -85.3], 'LA': [31.0, -92.0], 'ME': [45.4, -69.2], 'MD': [39.0, -76.8],
  'MA': [42.2, -71.5], 'MI': [44.3, -85.4], 'MN': [46.3, -94.3], 'MS': [32.7, -89.7],
  'MO': [38.3, -92.4], 'MT': [47.0, -109.6], 'NE': [41.5, -99.8], 'NV': [39.3, -116.6],
  'NH': [43.7, -71.6], 'NJ': [40.1, -74.7], 'NM': [34.4, -106.1], 'NY': [42.9, -75.5],
  'NC': [35.5, -79.4], 'ND': [47.4, -100.3], 'OH': [40.4, -82.8], 'OK': [35.6, -97.5],
  'OR': [43.9, -120.6], 'PA': [40.9, -77.8], 'RI': [41.7, -71.5], 'SC': [33.9, -80.9],
  'SD': [44.4, -100.2], 'TN': [35.9, -86.4], 'TX': [31.5, -99.4], 'UT': [39.3, -111.7],
  'VT': [44.0, -72.7], 'VA': [37.5, -78.8], 'WA': [47.4, -120.5], 'WV': [38.9, -80.5],
  'WI': [44.6, -89.7], 'WY': [43.0, -107.5], 'DC': [38.9, -77.0], 'PR': [18.2, -66.4]
};

/**
 * Parse state code from alert - mirrors logic in index.html:697-699
 */
function parseStateFromAlert(alert) {
  const props = alert.properties;
  const state = props.areaDesc?.match(/,\s*([A-Z]{2})(?:\s|$|;)/)?.[1] ||
                props.senderName?.match(/([A-Z]{2})$/)?.[1];
  return state;
}

/**
 * Group alerts by state - mirrors logic in index.html:694-714
 */
function groupAlertsByState(features) {
  const alertsByState = {};
  features?.forEach(alert => {
    const props = alert.properties;
    const state = parseStateFromAlert(alert);
    if (state && stateCentroids[state]) {
      if (!alertsByState[state] ||
          (props.severity === 'Extreme' && alertsByState[state].severity !== 'Extreme')) {
        alertsByState[state] = {
          state,
          severity: props.severity,
          event: props.event,
          headline: props.headline,
          description: props.description?.substring(0, 200) + '...',
          count: (alertsByState[state]?.count || 0) + 1
        };
      } else {
        alertsByState[state].count++;
      }
    }
  });
  return alertsByState;
}

describe('Weather Alerts Feature', () => {
  describe('State Code Parsing', () => {
    it('should parse state code from areaDesc with comma format', () => {
      const alert = createMockWeatherAlert({
        areaDesc: 'Jefferson County, AL'
      });
      expect(parseStateFromAlert(alert)).toBe('AL');
    });

    it('should parse state code from areaDesc with semicolon format', () => {
      const alert = createMockWeatherAlert({
        areaDesc: 'Los Angeles County, CA; Orange County, CA'
      });
      expect(parseStateFromAlert(alert)).toBe('CA');
    });

    it('should fallback to senderName when areaDesc has no state', () => {
      const alert = createMockWeatherAlert({
        areaDesc: 'Some Area Without State',
        senderName: 'NWS Birmingham AL'
      });
      expect(parseStateFromAlert(alert)).toBe('AL');
    });

    it('should return undefined for alerts without valid state code', () => {
      const alert = createMockWeatherAlert({
        areaDesc: 'Unknown Area',
        senderName: 'NWS Unknown'
      });
      expect(parseStateFromAlert(alert)).toBeUndefined();
    });
  });

  describe('Weather Severity Colors', () => {
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

  describe('State Centroids', () => {
    it('should have coordinates for all 50 states plus DC and PR', () => {
      // 50 states + DC + PR = 52
      expect(Object.keys(stateCentroids).length).toBe(52);
    });

    it('should have valid latitude/longitude pairs', () => {
      Object.entries(stateCentroids).forEach(([state, coords]) => {
        expect(coords).toHaveLength(2);
        // Latitude should be between -90 and 90
        expect(coords[0]).toBeGreaterThanOrEqual(-90);
        expect(coords[0]).toBeLessThanOrEqual(90);
        // Longitude should be between -180 and 180
        expect(coords[1]).toBeGreaterThanOrEqual(-180);
        expect(coords[1]).toBeLessThanOrEqual(180);
      });
    });

    it('should have Alaska centroid in correct region', () => {
      const [lat, lon] = stateCentroids['AK'];
      expect(lat).toBeGreaterThan(55); // Alaska is far north
      expect(lon).toBeLessThan(-130); // Alaska is far west
    });

    it('should have Hawaii centroid in correct region', () => {
      const [lat, lon] = stateCentroids['HI'];
      expect(lat).toBeLessThan(25); // Hawaii is tropical
      expect(lon).toBeLessThan(-150); // Hawaii is in Pacific
    });
  });

  describe('Alert Grouping by State', () => {
    it('should group multiple alerts from same state', () => {
      const features = [
        createMockWeatherAlert({ areaDesc: 'Jefferson County, AL', severity: 'Severe' }),
        createMockWeatherAlert({ areaDesc: 'Mobile County, AL', severity: 'Moderate' })
      ];
      const grouped = groupAlertsByState(features);
      expect(grouped['AL']).toBeDefined();
      expect(grouped['AL'].count).toBe(2);
    });

    it('should prioritize Extreme severity over other severities', () => {
      const features = [
        createMockWeatherAlert({ areaDesc: 'Dallas County, TX', severity: 'Moderate', event: 'Wind Advisory' }),
        createMockWeatherAlert({ areaDesc: 'Harris County, TX', severity: 'Extreme', event: 'Tornado Emergency' })
      ];
      const grouped = groupAlertsByState(features);
      expect(grouped['TX'].severity).toBe('Extreme');
      expect(grouped['TX'].event).toBe('Tornado Emergency');
    });

    it('should keep first alert info when no Extreme alert arrives', () => {
      const features = [
        createMockWeatherAlert({ areaDesc: 'Dallas County, TX', severity: 'Severe', event: 'Tornado Warning' }),
        createMockWeatherAlert({ areaDesc: 'Harris County, TX', severity: 'Moderate', event: 'Wind Advisory' })
      ];
      const grouped = groupAlertsByState(features);
      expect(grouped['TX'].severity).toBe('Severe');
      expect(grouped['TX'].event).toBe('Tornado Warning');
    });

    it('should skip alerts for states not in centroids', () => {
      const features = [
        createMockWeatherAlert({ areaDesc: 'Unknown Territory, XX', senderName: 'NWS Unknown XX' })
      ];
      const grouped = groupAlertsByState(features);
      expect(grouped['XX']).toBeUndefined();
    });

    it('should truncate description to 200 characters', () => {
      const longDescription = 'A'.repeat(300);
      const features = [
        createMockWeatherAlert({ areaDesc: 'Jefferson County, AL', description: longDescription })
      ];
      const grouped = groupAlertsByState(features);
      expect(grouped['AL'].description.length).toBe(203); // 200 + '...'
    });

    it('should handle empty features array', () => {
      const grouped = groupAlertsByState([]);
      expect(Object.keys(grouped).length).toBe(0);
    });

    it('should handle undefined features', () => {
      const grouped = groupAlertsByState(undefined);
      expect(Object.keys(grouped).length).toBe(0);
    });
  });
});
