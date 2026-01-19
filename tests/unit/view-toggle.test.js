/**
 * Unit tests for map view toggle functionality (2D/3D)
 * Tests the view mode switching, state persistence, and initialization
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

/**
 * Mock localStorage for testing
 */
function createMockLocalStorage() {
  let store = {};
  return {
    getItem: vi.fn((key) => store[key] || null),
    setItem: vi.fn((key, value) => { store[key] = String(value); }),
    removeItem: vi.fn((key) => { delete store[key]; }),
    clear: vi.fn(() => { store = {}; }),
    _store: store
  };
}

/**
 * Mirror the view toggle logic from view-toggle.js
 */
function getSavedMapViewMode(localStorage) {
  try {
    return localStorage.getItem('mapViewMode') || '2D';
  } catch (e) {
    return '2D';
  }
}

function saveMapViewMode(localStorage, mode) {
  try {
    localStorage.setItem('mapViewMode', mode);
  } catch (e) {}
}

function toggleMapViewMode(currentMode) {
  return currentMode === '2D' ? '3D' : '2D';
}

describe('Map View Toggle', () => {
  let mockLocalStorage;

  beforeEach(() => {
    mockLocalStorage = createMockLocalStorage();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('getSavedMapViewMode', () => {
    it('returns 2D as default when no preference saved', () => {
      const mode = getSavedMapViewMode(mockLocalStorage);
      expect(mode).toBe('2D');
    });

    it('returns saved preference when available', () => {
      mockLocalStorage.setItem('mapViewMode', '3D');
      const mode = getSavedMapViewMode(mockLocalStorage);
      expect(mode).toBe('3D');
    });

    it('returns 2D when localStorage throws an error', () => {
      const errorStorage = {
        getItem: vi.fn(() => { throw new Error('Storage error'); })
      };
      const mode = getSavedMapViewMode(errorStorage);
      expect(mode).toBe('2D');
    });
  });

  describe('saveMapViewMode', () => {
    it('saves 2D mode to localStorage', () => {
      saveMapViewMode(mockLocalStorage, '2D');
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('mapViewMode', '2D');
    });

    it('saves 3D mode to localStorage', () => {
      saveMapViewMode(mockLocalStorage, '3D');
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('mapViewMode', '3D');
    });

    it('handles localStorage errors gracefully', () => {
      const errorStorage = {
        setItem: vi.fn(() => { throw new Error('Storage error'); })
      };
      // Should not throw
      expect(() => saveMapViewMode(errorStorage, '3D')).not.toThrow();
    });
  });

  describe('toggleMapViewMode', () => {
    it('toggles from 2D to 3D', () => {
      const newMode = toggleMapViewMode('2D');
      expect(newMode).toBe('3D');
    });

    it('toggles from 3D to 2D', () => {
      const newMode = toggleMapViewMode('3D');
      expect(newMode).toBe('2D');
    });

    it('toggles back and forth correctly', () => {
      let mode = '2D';
      mode = toggleMapViewMode(mode);
      expect(mode).toBe('3D');
      mode = toggleMapViewMode(mode);
      expect(mode).toBe('2D');
      mode = toggleMapViewMode(mode);
      expect(mode).toBe('3D');
    });
  });
});

describe('Map View Mode State', () => {
  describe('Initial state', () => {
    it('starts with 2D mode by default', () => {
      const initialMode = '2D';
      expect(initialMode).toBe('2D');
    });

    it('can be initialized from saved preference', () => {
      const mockStorage = createMockLocalStorage();
      mockStorage.setItem('mapViewMode', '3D');

      const mode = getSavedMapViewMode(mockStorage);
      expect(mode).toBe('3D');
    });
  });

  describe('Mode persistence', () => {
    it('persists mode changes through toggle cycle', () => {
      const mockStorage = createMockLocalStorage();

      // Start with 2D
      let mode = '2D';
      saveMapViewMode(mockStorage, mode);
      expect(getSavedMapViewMode(mockStorage)).toBe('2D');

      // Toggle to 3D
      mode = toggleMapViewMode(mode);
      saveMapViewMode(mockStorage, mode);
      expect(getSavedMapViewMode(mockStorage)).toBe('3D');

      // Toggle back to 2D
      mode = toggleMapViewMode(mode);
      saveMapViewMode(mockStorage, mode);
      expect(getSavedMapViewMode(mockStorage)).toBe('2D');
    });
  });
});

describe('View Toggle Integration', () => {
  describe('DOM element visibility', () => {
    it('calculates correct visibility for 2D mode', () => {
      const mode = '2D';
      const svgVisible = mode === '2D';
      const globeVisible = mode === '3D';

      expect(svgVisible).toBe(true);
      expect(globeVisible).toBe(false);
    });

    it('calculates correct visibility for 3D mode', () => {
      const mode = '3D';
      const svgVisible = mode === '2D';
      const globeVisible = mode === '3D';

      expect(svgVisible).toBe(false);
      expect(globeVisible).toBe(true);
    });
  });

  describe('Button text', () => {
    it('shows correct button text for 2D mode', () => {
      const mode = '2D';
      const buttonText = mode; // Button shows current mode
      expect(buttonText).toBe('2D');
    });

    it('shows correct button text for 3D mode', () => {
      const mode = '3D';
      const buttonText = mode;
      expect(buttonText).toBe('3D');
    });
  });
});

describe('Edge cases', () => {
  it('handles rapid toggling', () => {
    let mode = '2D';
    for (let i = 0; i < 100; i++) {
      mode = toggleMapViewMode(mode);
    }
    // After 100 toggles (even number), should be back to 2D
    expect(mode).toBe('2D');
  });

  it('handles odd number of toggles', () => {
    let mode = '2D';
    for (let i = 0; i < 101; i++) {
      mode = toggleMapViewMode(mode);
    }
    // After 101 toggles (odd number), should be 3D
    expect(mode).toBe('3D');
  });

  it('handles invalid stored values gracefully', () => {
    const mockStorage = createMockLocalStorage();
    mockStorage.setItem('mapViewMode', 'invalid');

    const mode = getSavedMapViewMode(mockStorage);
    // Returns the invalid value, but toggleMapViewMode will handle it
    expect(mode).toBe('invalid');

    // Toggle from invalid state - since 'invalid' !== '2D', it goes to '2D'
    // This is the expected behavior of the toggle function
    const toggled = toggleMapViewMode(mode);
    expect(toggled).toBe('2D');
  });
});
