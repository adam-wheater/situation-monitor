// @ts-check
import { test, expect } from '@playwright/test';

/**
 * E2E tests for Global Activity Monitor map panel
 * Tests TODO_A completed features: zoom scaling, map rendering, data layers
 */

// Helper function for robust navigation with exponential backoff
async function navigateWithRetry(page) {
  let retries = 4;
  let delay = 500;
  while (retries > 0) {
    try {
      await page.goto('/', { waitUntil: 'domcontentloaded', timeout: 30000 });
      break;
    } catch (e) {
      retries--;
      if (retries === 0) throw e;
      await page.waitForTimeout(delay);
      delay *= 2; // Exponential backoff: 500, 1000, 2000, 4000ms
    }
  }
}

test.describe('Map Panel', () => {
  test.beforeEach(async ({ page }) => {
    await navigateWithRetry(page);
    // Wait for the map SVG to be present
    await page.waitForSelector('#mapSvg', { timeout: 10000 });
    await page.waitForSelector('#mapViewToggle', { timeout: 5000 });
  });

  test('should display map panel with correct title', async ({ page }) => {
    const panelTitle = page.locator('.panel[data-panel="map"] .panel-title');
    await expect(panelTitle).toHaveText('Global Activity Monitor');
  });

  test('should have map SVG element', async ({ page }) => {
    const mapSvg = page.locator('#mapSvg');
    await expect(mapSvg).toBeVisible();
  });

  test('should have globe container element (hidden by default)', async ({ page }) => {
    const globeContainer = page.locator('#globeContainer');
    await expect(globeContainer).toBeHidden();
  });

  test('should have map tooltip element', async ({ page }) => {
    const tooltip = page.locator('#mapTooltip');
    await expect(tooltip).toBeAttached();
  });

  test('should display map legend with all layer indicators', async ({ page }) => {
    const legend = page.locator('#mapLegend');
    await expect(legend).toBeVisible();

    // Check legend contains expected layer indicators
    const legendText = await legend.textContent();
    expect(legendText).toContain('Low');
    expect(legendText).toContain('Elevated');
    expect(legendText).toContain('High');
    expect(legendText).toContain('Wx'); // Weather
    expect(legendText).toContain('Quake');
    expect(legendText).toContain('Naval');
    expect(legendText).toContain('Cable');
    expect(legendText).toContain('Nuke');
    expect(legendText).toContain('Base');
  });

  test('should have Show All Flights toggle', async ({ page }) => {
    const flightsToggle = page.locator('#showAllFlightsToggle');
    await expect(flightsToggle).toBeVisible();
    // Default should be unchecked (military-only)
    await expect(flightsToggle).not.toBeChecked();
  });

  test('should toggle Show All Flights checkbox', async ({ page }) => {
    const flightsToggle = page.locator('#showAllFlightsToggle');
    await flightsToggle.check();
    await expect(flightsToggle).toBeChecked();
    await flightsToggle.uncheck();
    await expect(flightsToggle).not.toBeChecked();
  });
});

test.describe('Map View Toggle (2D/3D)', () => {
  // Run these tests serially to avoid race conditions with globe initialization
  test.describe.configure({ mode: 'serial' });

  test.beforeEach(async ({ page }) => {
    await navigateWithRetry(page);
    await page.waitForSelector('#mapViewToggle', { timeout: 10000 });
  });

  test('should display 2D/3D view toggle button', async ({ page }) => {
    const toggleBtn = page.locator('#mapViewToggle');
    await expect(toggleBtn).toBeVisible();
  });

  test('should start in 2D mode by default', async ({ page }) => {
    const toggleBtn = page.locator('#mapViewToggle');
    await expect(toggleBtn).toHaveText('2D');

    // SVG should be visible, globe hidden
    const mapSvg = page.locator('#mapSvg');
    const globeContainer = page.locator('#globeContainer');
    await expect(mapSvg).toBeVisible();
    await expect(globeContainer).toBeHidden();
  });

  test('should toggle to 3D mode when clicked', async ({ page }) => {
    const toggleBtn = page.locator('#mapViewToggle');
    await toggleBtn.click();
    await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});

    // Button text should change to 3D
    await expect(toggleBtn).toHaveText('3D');

    // Globe container should be visible, SVG hidden
    const mapSvg = page.locator('#mapSvg');
    const globeContainer = page.locator('#globeContainer');
    // Note: display style change
    await expect(globeContainer).toHaveCSS('display', 'block');
  });

  test('should toggle back to 2D mode', async ({ page }) => {
    const toggleBtn = page.locator('#mapViewToggle');
    const mapSvg = page.locator('#mapSvg');
    const globeContainer = page.locator('#globeContainer');

    // Toggle to 3D and wait for globe to be visible
    await toggleBtn.click();
    await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});
    await expect(toggleBtn).toHaveText('3D');
    await expect(globeContainer).toHaveCSS('display', 'block');

    // Toggle back to 2D and wait for SVG to be visible
    await toggleBtn.click();
    await page.waitForLoadState('networkidle', { timeout: 5000 }).catch(() => {});
    await expect(toggleBtn).toHaveText('2D');
    await expect(mapSvg).toBeVisible();
    await expect(globeContainer).toHaveCSS('display', 'none');
  });
});

test.describe('Map Controls', () => {
  test.beforeEach(async ({ page }) => {
    await navigateWithRetry(page);
    await page.waitForSelector('#mapControls', { timeout: 10000 });
  });

  test('should have map controls container', async ({ page }) => {
    const controls = page.locator('#mapControls');
    await expect(controls).toBeVisible();
  });

  test('controls should be positioned at bottom-right', async ({ page }) => {
    const controls = page.locator('#mapControls');
    await expect(controls).toHaveCSS('position', 'absolute');
    await expect(controls).toHaveCSS('bottom', '10px');
    await expect(controls).toHaveCSS('right', '10px');
  });
});
