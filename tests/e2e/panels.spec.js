// @ts-check
import { test, expect } from '@playwright/test';

/**
 * E2E tests for dashboard panels
 * Tests TODO_A completed features: clickable popups, panel rendering, settings
 */

test.describe('Dashboard Panels', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('.settings-btn', { timeout: 10000 });
  });

  test('should display page title', async ({ page }) => {
    await expect(page).toHaveTitle('Situation Monitor');
  });

  test('should have header with title and status', async ({ page }) => {
    const title = page.locator('.header .title');
    await expect(title).toHaveText('Situation Monitor');

    const status = page.locator('#status');
    await expect(status).toBeVisible();
  });

  test('should have refresh button', async ({ page }) => {
    const refreshBtn = page.locator('#refreshBtn');
    await expect(refreshBtn).toBeVisible();
    await expect(refreshBtn).toHaveText('Refresh');
  });

  test('should have settings button', async ({ page }) => {
    const settingsBtn = page.locator('.settings-btn');
    await expect(settingsBtn).toBeVisible();
    await expect(settingsBtn).toHaveText('Panels');
  });

  test('should have monitor button', async ({ page }) => {
    const monitorBtn = page.locator('.monitors-btn');
    await expect(monitorBtn).toBeVisible();
    await expect(monitorBtn).toHaveText('+ Monitor');
  });
});

test.describe('Panel Visibility', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('.settings-btn', { timeout: 10000 });
  });

  const expectedPanels = [
    { name: 'map', title: 'Global Activity Monitor' },
    { name: 'politics', title: 'World / Geopolitical' },
    { name: 'tech', title: 'Technology / AI' },
    { name: 'finance', title: 'Financial' },
    { name: 'pentagon', title: 'Pentagon Tracker' },
    { name: 'gov', title: 'Government / Policy' },
    { name: 'heatmap', title: 'Sector Heatmap' },
    { name: 'markets', title: 'Markets' },
    { name: 'commodities', title: 'Commodities / VIX' },
    { name: 'polymarket', title: 'Polymarket Predictions' },
    { name: 'whales', title: 'Whale Watch' },
    { name: 'mainchar', title: 'Main Character' },
    { name: 'printer', title: 'Money Printer' },
    { name: 'contracts', title: 'Gov Contracts' },
    { name: 'ai', title: 'AI Arms Race' },
    { name: 'layoffs', title: 'Layoffs Tracker' },
    { name: 'venezuela', title: 'Venezuela Situation' },
    { name: 'greenland', title: 'Greenland Situation' },
    { name: 'intel', title: 'Intel Feed' },
    { name: 'monitors', title: 'My Monitors' },
  ];

  for (const panel of expectedPanels) {
    test(`should display ${panel.name} panel`, async ({ page }) => {
      const panelEl = page.locator(`.panel[data-panel="${panel.name}"]`);
      await expect(panelEl).toBeVisible();

      const title = panelEl.locator('.panel-title');
      await expect(title).toHaveText(panel.title);
    });
  }
});

test.describe('Settings Modal', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('.settings-btn', { timeout: 10000 });
  });

  test('should open settings modal on button click', async ({ page }) => {
    const settingsBtn = page.locator('.settings-btn');
    const settingsModal = page.locator('#settingsModal');

    // Modal should not have open class initially
    await expect(settingsModal).not.toHaveClass(/open/);

    // Click to open
    await settingsBtn.click();
    await expect(settingsModal).toHaveClass(/open/);
  });

  test('should display panel toggles in settings', async ({ page }) => {
    const settingsBtn = page.locator('.settings-btn');
    await settingsBtn.click();

    const panelToggles = page.locator('#panelToggles');
    await expect(panelToggles).toBeVisible();
  });

  test('should close settings modal on close button click', async ({ page }) => {
    const settingsBtn = page.locator('.settings-btn');
    await settingsBtn.click();

    // Wait for modal to be open
    const settingsModal = page.locator('#settingsModal');
    await expect(settingsModal).toHaveClass(/open/);

    const closeBtn = page.locator('.settings-close');
    await closeBtn.click();

    await expect(settingsModal).not.toHaveClass(/open/);
  });

  test('should close settings modal on overlay click', async ({ page }) => {
    const settingsBtn = page.locator('.settings-btn');
    await settingsBtn.click();

    const settingsModal = page.locator('#settingsModal');
    await expect(settingsModal).toHaveClass(/open/);

    // Click on the overlay (not the content) - use force to click behind content
    await page.mouse.click(10, 10);

    await expect(settingsModal).not.toHaveClass(/open/);
  });

  test('should have reset layout button', async ({ page }) => {
    const settingsBtn = page.locator('.settings-btn');
    await settingsBtn.click();
    await expect(page.locator('#settingsModal')).toHaveClass(/open/);

    const resetBtn = page.locator('.settings-reset');
    await expect(resetBtn).toBeVisible();
    await expect(resetBtn).toHaveText('Reset Layout');
  });

  test('should have monitors section in settings', async ({ page }) => {
    const settingsBtn = page.locator('.settings-btn');
    await settingsBtn.click();
    await expect(page.locator('#settingsModal')).toHaveClass(/open/);

    const monitorsSection = page.locator('.monitors-section');
    await expect(monitorsSection).toBeVisible();

    const addMonitorBtn = page.locator('.add-monitor-btn');
    await expect(addMonitorBtn).toHaveText('+ Add Monitor');
  });
});

test.describe('Monitor Form Modal', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('.monitors-btn', { timeout: 10000 });
  });

  test('should open monitor form from header button', async ({ page }) => {
    const monitorBtn = page.locator('.monitors-btn');
    await monitorBtn.click();

    const formOverlay = page.locator('#monitorFormOverlay');
    await expect(formOverlay).toHaveClass(/open/);
  });

  test('should display monitor form fields', async ({ page }) => {
    const monitorBtn = page.locator('.monitors-btn');
    await monitorBtn.click();
    await expect(page.locator('#monitorFormOverlay')).toHaveClass(/open/);

    const nameInput = page.locator('#monitorName');
    const keywordsInput = page.locator('#monitorKeywords');
    const latInput = page.locator('#monitorLat');
    const lonInput = page.locator('#monitorLon');

    await expect(nameInput).toBeVisible();
    await expect(keywordsInput).toBeVisible();
    await expect(latInput).toBeVisible();
    await expect(lonInput).toBeVisible();
  });

  test('should have color selection in monitor form', async ({ page }) => {
    const monitorBtn = page.locator('.monitors-btn');
    await monitorBtn.click();
    await expect(page.locator('#monitorFormOverlay')).toHaveClass(/open/);

    const colorSelector = page.locator('#monitorColors');
    await expect(colorSelector).toBeVisible();
  });

  test('should close monitor form on cancel button', async ({ page }) => {
    const monitorBtn = page.locator('.monitors-btn');
    await monitorBtn.click();

    const formOverlay = page.locator('#monitorFormOverlay');
    await expect(formOverlay).toHaveClass(/open/);

    const cancelBtn = page.locator('.monitor-cancel-btn');
    await cancelBtn.click();

    await expect(formOverlay).not.toHaveClass(/open/);
  });

  test('should close monitor form on overlay click', async ({ page }) => {
    const monitorBtn = page.locator('.monitors-btn');
    await monitorBtn.click();

    const formOverlay = page.locator('#monitorFormOverlay');
    await expect(formOverlay).toHaveClass(/open/);

    // Click outside the form content
    await page.mouse.click(10, 10);

    await expect(formOverlay).not.toHaveClass(/open/);
  });
});

test.describe('Pentagon Tracker Panel', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('.settings-btn', { timeout: 10000 });
  });

  test('should have config dropdown', async ({ page }) => {
    const pentagonConfig = page.locator('#pentagonConfig');
    await expect(pentagonConfig).toBeVisible();
  });

  test('should expand config on click', async ({ page }) => {
    const configSummary = page.locator('#pentagonConfig summary');
    await configSummary.click();

    const configBody = page.locator('.panel-config-body');
    await expect(configBody).toBeVisible();
  });

  test('should have API key input field', async ({ page }) => {
    const configSummary = page.locator('#pentagonConfig summary');
    await configSummary.click();

    const apiKeyInput = page.locator('#besttimeApiKeyPrivateInput');
    await expect(apiKeyInput).toBeVisible();
    await expect(apiKeyInput).toHaveAttribute('type', 'password');
  });

  test('should have location input fields', async ({ page }) => {
    const configSummary = page.locator('#pentagonConfig summary');
    await configSummary.click();

    const nameInput = page.locator('#pentagonLocName');
    const latInput = page.locator('#pentagonLocLat');
    const lngInput = page.locator('#pentagonLocLng');
    const radiusInput = page.locator('#pentagonLocRadius');

    await expect(nameInput).toBeVisible();
    await expect(latInput).toBeVisible();
    await expect(lngInput).toBeVisible();
    await expect(radiusInput).toBeVisible();
  });
});
