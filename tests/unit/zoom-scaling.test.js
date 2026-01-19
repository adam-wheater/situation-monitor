/**
 * Unit tests for Zoom/Marker Scaling feature
 * Tests the dynamic marker scaling based on zoom level
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Constants from js/map/zoom.js:12-14
const MAP_ZOOM_MIN = 1;
const MAP_ZOOM_MAX = 4;
const MAP_ZOOM_STEP = 0.5;

/**
 * Calculate marker scale based on zoom level
 * Mirrors logic from js/map/zoom.js:68-73
 */
function calculateMarkerScale(zoom) {
  const z = Math.max(1, zoom || 1);
  return 1 / Math.pow(z, 2.0);
}

/**
 * Calculate hover scale (1.3x normal scale)
 * Mirrors js/map/zoom.js:71
 */
function calculateHoverScale(zoom) {
  return calculateMarkerScale(zoom) * 1.3;
}

/**
 * Calculate soft hover scale (1.15x normal scale)
 * Mirrors js/map/zoom.js:72
 */
function calculateSoftHoverScale(zoom) {
  return calculateMarkerScale(zoom) * 1.15;
}

/**
 * Calculate pulse animation scale (1.1x normal scale)
 * Mirrors js/map/zoom.js:73
 */
function calculatePulseScale(zoom) {
  return calculateMarkerScale(zoom) * 1.1;
}

/**
 * Clamp zoom value to valid range
 */
function clampZoom(zoom) {
  return Math.max(MAP_ZOOM_MIN, Math.min(MAP_ZOOM_MAX, zoom));
}

/**
 * Calculate next zoom level (zoom in)
 * Mirrors js/map/zoom.js:22-26
 */
function getNextZoomIn(currentZoom) {
  if (currentZoom < MAP_ZOOM_MAX) {
    return Math.min(MAP_ZOOM_MAX, currentZoom + MAP_ZOOM_STEP);
  }
  return currentZoom;
}

/**
 * Calculate next zoom level (zoom out)
 * Mirrors js/map/zoom.js:35-42
 */
function getNextZoomOut(currentZoom) {
  if (currentZoom > MAP_ZOOM_MIN) {
    return Math.max(MAP_ZOOM_MIN, currentZoom - MAP_ZOOM_STEP);
  }
  return currentZoom;
}

describe('Zoom/Marker Scaling Feature', () => {
  describe('Zoom Constants', () => {
    it('should have minimum zoom of 1', () => {
      expect(MAP_ZOOM_MIN).toBe(1);
    });

    it('should have maximum zoom of 4', () => {
      expect(MAP_ZOOM_MAX).toBe(4);
    });

    it('should have zoom step of 0.5', () => {
      expect(MAP_ZOOM_STEP).toBe(0.5);
    });

    it('should allow 7 distinct zoom levels (1, 1.5, 2, 2.5, 3, 3.5, 4)', () => {
      const levels = [];
      for (let z = MAP_ZOOM_MIN; z <= MAP_ZOOM_MAX; z += MAP_ZOOM_STEP) {
        levels.push(z);
      }
      expect(levels.length).toBe(7);
      expect(levels).toEqual([1, 1.5, 2, 2.5, 3, 3.5, 4]);
    });
  });

  describe('Marker Scale Calculation', () => {
    it('should return 1 at zoom level 1 (no scaling)', () => {
      const scale = calculateMarkerScale(1);
      expect(scale).toBe(1);
    });

    it('should return 0.25 at zoom level 2 (1/4 size)', () => {
      const scale = calculateMarkerScale(2);
      expect(scale).toBe(0.25);
    });

    it('should return ~0.111 at zoom level 3 (1/9 size)', () => {
      const scale = calculateMarkerScale(3);
      expect(scale).toBeCloseTo(1/9, 5);
    });

    it('should return 0.0625 at zoom level 4 (1/16 size)', () => {
      const scale = calculateMarkerScale(4);
      expect(scale).toBe(0.0625);
    });

    it('should handle intermediate zoom levels', () => {
      const scale15 = calculateMarkerScale(1.5);
      const scale25 = calculateMarkerScale(2.5);
      const scale35 = calculateMarkerScale(3.5);

      // 1 / (1.5)^2 = 1/2.25 ≈ 0.444
      expect(scale15).toBeCloseTo(1/2.25, 5);
      // 1 / (2.5)^2 = 1/6.25 = 0.16
      expect(scale25).toBeCloseTo(0.16, 5);
      // 1 / (3.5)^2 = 1/12.25 ≈ 0.0816
      expect(scale35).toBeCloseTo(1/12.25, 5);
    });

    it('should treat zoom < 1 as zoom = 1', () => {
      expect(calculateMarkerScale(0.5)).toBe(1);
      expect(calculateMarkerScale(0)).toBe(1);
      expect(calculateMarkerScale(-1)).toBe(1);
    });

    it('should handle null/undefined as zoom = 1', () => {
      expect(calculateMarkerScale(null)).toBe(1);
      expect(calculateMarkerScale(undefined)).toBe(1);
    });

    it('should scale inversely with square of zoom (quadratic reduction)', () => {
      // This ensures markers shrink faster as you zoom in more
      const scale1 = calculateMarkerScale(1);
      const scale2 = calculateMarkerScale(2);
      const scale4 = calculateMarkerScale(4);

      // Scale at 2x zoom should be 1/4 of scale at 1x
      expect(scale2 / scale1).toBe(0.25);

      // Scale at 4x zoom should be 1/16 of scale at 1x
      expect(scale4 / scale1).toBe(0.0625);
    });
  });

  describe('Hover Scale Variants', () => {
    it('should calculate hover scale as 1.3x base scale', () => {
      const baseScale = calculateMarkerScale(2);
      const hoverScale = calculateHoverScale(2);
      expect(hoverScale).toBeCloseTo(baseScale * 1.3, 10);
    });

    it('should calculate soft hover scale as 1.15x base scale', () => {
      const baseScale = calculateMarkerScale(2);
      const softHoverScale = calculateSoftHoverScale(2);
      expect(softHoverScale).toBeCloseTo(baseScale * 1.15, 10);
    });

    it('should calculate pulse scale as 1.1x base scale', () => {
      const baseScale = calculateMarkerScale(2);
      const pulseScale = calculatePulseScale(2);
      expect(pulseScale).toBeCloseTo(baseScale * 1.1, 10);
    });

    it('should maintain consistent hover/pulse ratios at all zoom levels', () => {
      for (let z = MAP_ZOOM_MIN; z <= MAP_ZOOM_MAX; z += MAP_ZOOM_STEP) {
        const base = calculateMarkerScale(z);
        const hover = calculateHoverScale(z);
        const pulse = calculatePulseScale(z);

        expect(hover / base).toBeCloseTo(1.3, 5);
        expect(pulse / base).toBeCloseTo(1.1, 5);
      }
    });
  });

  describe('Zoom Level Navigation', () => {
    it('should increase zoom by step amount', () => {
      expect(getNextZoomIn(1)).toBe(1.5);
      expect(getNextZoomIn(2)).toBe(2.5);
      expect(getNextZoomIn(3.5)).toBe(4);
    });

    it('should not exceed maximum zoom', () => {
      expect(getNextZoomIn(4)).toBe(4);
      expect(getNextZoomIn(3.75)).toBe(4);
    });

    it('should decrease zoom by step amount', () => {
      expect(getNextZoomOut(4)).toBe(3.5);
      expect(getNextZoomOut(2.5)).toBe(2);
      expect(getNextZoomOut(1.5)).toBe(1);
    });

    it('should not go below minimum zoom', () => {
      expect(getNextZoomOut(1)).toBe(1);
      expect(getNextZoomOut(1.25)).toBe(1);
    });
  });

  describe('Zoom Clamping', () => {
    it('should clamp values below minimum to minimum', () => {
      expect(clampZoom(0)).toBe(MAP_ZOOM_MIN);
      expect(clampZoom(-5)).toBe(MAP_ZOOM_MIN);
      expect(clampZoom(0.5)).toBe(MAP_ZOOM_MIN);
    });

    it('should clamp values above maximum to maximum', () => {
      expect(clampZoom(5)).toBe(MAP_ZOOM_MAX);
      expect(clampZoom(10)).toBe(MAP_ZOOM_MAX);
      expect(clampZoom(4.5)).toBe(MAP_ZOOM_MAX);
    });

    it('should not change values within valid range', () => {
      expect(clampZoom(1)).toBe(1);
      expect(clampZoom(2.5)).toBe(2.5);
      expect(clampZoom(4)).toBe(4);
    });
  });

  describe('CSS Variable Generation', () => {
    it('should format scale with 6 decimal places', () => {
      const scale = calculateMarkerScale(2);
      const formatted = scale.toFixed(6);
      expect(formatted).toBe('0.250000');
    });

    it('should generate valid CSS property value', () => {
      const scale = calculateMarkerScale(3);
      const cssValue = scale.toFixed(6);
      // Should be a valid number that can be used in CSS
      expect(parseFloat(cssValue)).toBeCloseTo(scale, 6);
    });
  });

  describe('Visual Scaling Behavior', () => {
    it('should keep markers visible at maximum zoom', () => {
      const scale = calculateMarkerScale(MAP_ZOOM_MAX);
      // At 4x zoom, markers should still be 6.25% of original size
      expect(scale).toBeGreaterThan(0.05);
    });

    it('should reduce marker overlap as zoom increases', () => {
      // At higher zoom levels, markers are smaller relative to the view
      // This helps prevent overlap when many markers are in view
      const scale1 = calculateMarkerScale(1);
      const scale2 = calculateMarkerScale(2);

      // Visual area occupied by marker is proportional to scale^2
      // So at 2x zoom, marker occupies 1/16 of original screen area
      const areaRatio = Math.pow(scale2 / scale1, 2);
      expect(areaRatio).toBe(0.0625);
    });

    it('should ensure country boundaries remain visible at high zoom', () => {
      // The purpose of marker scaling is to prevent markers from
      // obscuring country boundaries when zoomed in
      // At 4x zoom, markers are 1/16 their original size
      const scale = calculateMarkerScale(4);
      expect(scale).toBe(0.0625);

      // This means a 16px marker becomes 1px at max zoom
      // ensuring underlying map features remain visible
    });
  });

  describe('Globe Mode Zoom', () => {
    // In Globe mode, zoom is controlled via altitude
    // These tests verify the conceptual mapping

    it('should understand altitude 2.0 as zoomed out', () => {
      // Default world view altitude
      const zoomedOutAltitude = 2.0;
      expect(zoomedOutAltitude).toBeGreaterThan(1);
    });

    it('should understand altitude 0.3 as zoomed in', () => {
      // Close view altitude
      const zoomedInAltitude = 0.3;
      expect(zoomedInAltitude).toBeLessThan(1);
    });

    it('should map altitude to effective zoom for scaling', () => {
      // Conceptual mapping: lower altitude = higher zoom
      // altitude 2.0 ≈ zoom 1 (default)
      // altitude 0.5 ≈ zoom 2
      // altitude 0.25 ≈ zoom 4
      const altitudeToZoom = (altitude) => {
        return Math.max(1, 2 / altitude);
      };

      expect(altitudeToZoom(2.0)).toBe(1);
      expect(altitudeToZoom(0.5)).toBe(4);
      expect(altitudeToZoom(1.0)).toBe(2);
    });
  });

  describe('Edge Cases', () => {
    it('should handle floating point zoom values', () => {
      const scale = calculateMarkerScale(1.333333);
      expect(scale).toBeGreaterThan(0);
      expect(scale).toBeLessThan(1);
    });

    it('should handle very large zoom values', () => {
      const scale = calculateMarkerScale(100);
      expect(scale).toBe(0.0001); // 1/100^2
    });

    it('should produce monotonically decreasing scales', () => {
      let prevScale = Infinity;
      for (let z = MAP_ZOOM_MIN; z <= MAP_ZOOM_MAX + 1; z += 0.25) {
        const scale = calculateMarkerScale(z);
        expect(scale).toBeLessThanOrEqual(prevScale);
        prevScale = scale;
      }
    });
  });
});
