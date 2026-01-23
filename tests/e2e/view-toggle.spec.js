import { test, expect } from '@playwright/test';

// Helper to click toggle using JavaScript to avoid stability timeouts during globe asset loading
async function clickToggle(page) {
  await page.evaluate(() => {
    const btn = document.getElementById('mapViewToggle');
    if (btn) btn.click();
  });
}

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

// Helper function for robust page reload with exponential backoff
async function reloadWithRetry(page) {
  let retries = 4;
  let delay = 500;
  while (retries > 0) {
    try {
      await page.reload({ waitUntil: 'domcontentloaded', timeout: 30000 });
      break;
    } catch (e) {
      retries--;
      if (retries === 0) throw e;
      await page.waitForTimeout(delay);
      delay *= 2;
    }
  }
}

test.describe('2D/3D Map View Toggle', () => {
  test.beforeEach(async ({ page }) => {
    await navigateWithRetry(page);
    // Wait for app to initialize
    await page.waitForSelector('#mapViewToggle', { timeout: 10000 });
  });

  test.describe('Initial State', () => {
    test('should start in 2D mode by default', async ({ page }) => {
      const toggle = page.locator('#mapViewToggle');
      await expect(toggle).toHaveText('2D');
    });

    test('should display SVG map in 2D mode', async ({ page }) => {
      const svg = page.locator('#mapSvg');
      await expect(svg).toBeVisible();
    });

    test('should hide globe container in 2D mode', async ({ page }) => {
      const globe = page.locator('#globeContainer');
      await expect(globe).toHaveCSS('display', 'none');
    });
  });

  test.describe('Toggle Button', () => {
    test('should have correct styling', async ({ page }) => {
      const toggle = page.locator('#mapViewToggle');
      await expect(toggle).toHaveCSS('cursor', 'pointer');
    });

    test('should be clickable', async ({ page }) => {
      const toggle = page.locator('#mapViewToggle');
      await expect(toggle).toBeEnabled();
    });

    test('should be positioned in map legend', async ({ page }) => {
      const legend = page.locator('#mapLegend');

      // Toggle should be inside legend
      await expect(legend.locator('#mapViewToggle')).toBeVisible();
    });
  });

  test.describe('View Switching', () => {
    test('toggle button should change text when clicked', async ({ page }) => {
      const toggle = page.locator('#mapViewToggle');

      // Initially 2D
      await expect(toggle).toHaveText('2D');

      // Click to switch to 3D using JS to avoid click stability timeout
      await clickToggle(page);
      await expect(toggle).toHaveText('3D', { timeout: 10000 });

      // Click to switch back to 2D
      await clickToggle(page);
      await expect(toggle).toHaveText('2D', { timeout: 5000 });
    });

    test('clicking toggle should hide SVG and show globe in 3D mode', async ({ page }) => {
      const toggle = page.locator('#mapViewToggle');
      const svg = page.locator('#mapSvg');
      const globe = page.locator('#globeContainer');

      // Initially SVG visible, globe hidden
      await expect(svg).toBeVisible();
      await expect(globe).toHaveCSS('display', 'none');

      // Switch to 3D using JS click to avoid stability timeout during globe asset loading
      await clickToggle(page);

      // Wait for view mode to change
      await expect(globe).toHaveCSS('display', 'block', { timeout: 10000 });
      await expect(svg).toHaveCSS('display', 'none');
    });

    test('clicking toggle twice should return to 2D mode', async ({ page }) => {
      const toggle = page.locator('#mapViewToggle');
      const svg = page.locator('#mapSvg');
      const globe = page.locator('#globeContainer');

      // Switch to 3D using JS click
      await clickToggle(page);
      await expect(globe).toHaveCSS('display', 'block', { timeout: 10000 });
      await expect(svg).toHaveCSS('display', 'none');

      // Switch back to 2D
      await clickToggle(page);
      await expect(svg).toBeVisible({ timeout: 5000 });
      await expect(globe).toHaveCSS('display', 'none');
    });
  });

  test.describe('LocalStorage Persistence', () => {
    test('should save preference to localStorage when switching to 3D', async ({ page }) => {
      const toggle = page.locator('#mapViewToggle');

      // Switch to 3D using JS click to avoid stability timeout
      await clickToggle(page);

      // Wait for toggle text to change
      await expect(toggle).toHaveText('3D', { timeout: 10000 });

      // Check localStorage
      const pref = await page.evaluate(() => localStorage.getItem('mapViewMode'));
      expect(pref).toBe('3D');
    });

    test('should save preference to localStorage when switching to 2D', async ({ page }) => {
      const toggle = page.locator('#mapViewToggle');

      // Switch to 3D first using JS click
      await clickToggle(page);
      await expect(toggle).toHaveText('3D', { timeout: 10000 });

      // Switch back to 2D
      await clickToggle(page);
      await expect(toggle).toHaveText('2D', { timeout: 5000 });

      // Check localStorage
      const pref = await page.evaluate(() => localStorage.getItem('mapViewMode'));
      expect(pref).toBe('2D');
    });

    test('should restore 3D preference on page reload', async ({ page }) => {
      // Set 3D preference in localStorage
      await page.evaluate(() => localStorage.setItem('mapViewMode', '3D'));

      // Reload page with retry
      await reloadWithRetry(page);
      await page.waitForSelector('#mapViewToggle', { timeout: 10000 });

      // Should be in 3D mode
      const toggle = page.locator('#mapViewToggle');
      await expect(toggle).toHaveText('3D');
    });

    test('should restore 2D preference on page reload', async ({ page }) => {
      // Set 2D preference in localStorage
      await page.evaluate(() => localStorage.setItem('mapViewMode', '2D'));

      // Reload page with retry
      await reloadWithRetry(page);
      await page.waitForSelector('#mapViewToggle', { timeout: 10000 });

      // Should be in 2D mode
      const toggle = page.locator('#mapViewToggle');
      await expect(toggle).toHaveText('2D');
    });

    test('should default to 2D when no preference in localStorage', async ({ page }) => {
      // Clear localStorage
      await page.evaluate(() => localStorage.removeItem('mapViewMode'));

      // Reload page with retry
      await reloadWithRetry(page);
      await page.waitForSelector('#mapViewToggle', { timeout: 10000 });

      // Should default to 2D
      const toggle = page.locator('#mapViewToggle');
      await expect(toggle).toHaveText('2D');
    });
  });

  test.describe('Map Controls in Different Views', () => {
    test('show all flights toggle should be visible in 2D mode', async ({ page }) => {
      const flightsToggle = page.locator('#showAllFlightsToggle');
      await expect(flightsToggle).toBeVisible();
    });

    test('map controls should remain accessible when switching views', async ({ page }) => {
      const viewToggle = page.locator('#mapViewToggle');
      const flightsToggle = page.locator('#showAllFlightsToggle');

      // Check in 2D mode
      await expect(flightsToggle).toBeVisible();

      // Switch to 3D using JS click to avoid stability timeout
      await clickToggle(page);

      // Wait for toggle text to change
      await expect(viewToggle).toHaveText('3D', { timeout: 10000 });

      // Map controls should still be present (though their functionality may differ)
      const mapControls = page.locator('#mapControls');
      await expect(mapControls).toBeVisible();
    });
  });
});

test.describe('Map Panel Container', () => {
  test.beforeEach(async ({ page }) => {
    await navigateWithRetry(page);
    await page.waitForSelector('#mapViewToggle', { timeout: 10000 });
  });

  test('should have proper dimensions', async ({ page }) => {
    const panel = page.locator('#mapPanel');
    const height = await panel.evaluate(el => el.style.height || getComputedStyle(el).height);
    expect(height).toBe('550px');
  });

  test('should have hidden overflow', async ({ page }) => {
    const panel = page.locator('#mapPanel');
    await expect(panel).toHaveCSS('overflow', 'hidden');
  });

  test('should have relative positioning for tooltip', async ({ page }) => {
    const panel = page.locator('#mapPanel');
    await expect(panel).toHaveCSS('position', 'relative');
  });

  test('tooltip should have high z-index', async ({ page }) => {
    const tooltip = page.locator('#mapTooltip');
    const zIndex = await tooltip.evaluate(el => getComputedStyle(el).zIndex);
    expect(parseInt(zIndex)).toBeGreaterThanOrEqual(1000);
  });
});
