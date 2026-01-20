import { test, expect } from '@playwright/test';

test.describe('Situation Monitor Application', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Wait for app to initialize by checking for key DOM elements
    await page.waitForSelector('#mapSvg', { timeout: 10000 });
    await page.waitForSelector('.settings-btn', { timeout: 5000 });
  });

  test.describe('Page Load', () => {
    test('should display the page title', async ({ page }) => {
      await expect(page).toHaveTitle('Situation Monitor');
    });

    test('should display header with title', async ({ page }) => {
      const header = page.locator('h1.title');
      await expect(header).toBeVisible();
      await expect(header).toHaveText('Situation Monitor');
    });

    test('should display status indicator', async ({ page }) => {
      const status = page.locator('#status');
      await expect(status).toBeVisible();
    });

    test('should display header buttons', async ({ page }) => {
      await expect(page.locator('.monitors-btn')).toBeVisible();
      await expect(page.locator('.settings-btn')).toBeVisible();
      await expect(page.locator('#refreshBtn')).toBeVisible();
    });
  });

  test.describe('Dashboard Panels', () => {
    test('should display map panel', async ({ page }) => {
      const mapPanel = page.locator('[data-panel="map"]');
      await expect(mapPanel).toBeVisible();
      await expect(mapPanel.locator('.panel-title')).toHaveText('Global Activity Monitor');
    });

    test('should display map legend', async ({ page }) => {
      const legend = page.locator('#mapLegend');
      await expect(legend).toBeVisible();
      await expect(legend).toContainText('Low');
      await expect(legend).toContainText('Elevated');
      await expect(legend).toContainText('High');
    });

    test('should display politics panel', async ({ page }) => {
      const panel = page.locator('[data-panel="politics"]');
      await expect(panel).toBeVisible();
      await expect(panel.locator('.panel-title')).toHaveText('World / Geopolitical');
    });

    test('should display tech panel', async ({ page }) => {
      const panel = page.locator('[data-panel="tech"]');
      await expect(panel).toBeVisible();
      await expect(panel.locator('.panel-title')).toHaveText('Technology / AI');
    });

    test('should display finance panel', async ({ page }) => {
      const panel = page.locator('[data-panel="finance"]');
      await expect(panel).toBeVisible();
      await expect(panel.locator('.panel-title')).toHaveText('Financial');
    });

    test('should display pentagon panel', async ({ page }) => {
      const panel = page.locator('[data-panel="pentagon"]');
      await expect(panel).toBeVisible();
      await expect(panel.locator('.panel-title')).toHaveText('Pentagon Tracker');
    });

    test('should display government panel', async ({ page }) => {
      const panel = page.locator('[data-panel="gov"]');
      await expect(panel).toBeVisible();
      await expect(panel.locator('.panel-title')).toHaveText('Government / Policy');
    });

    test('should display markets panel', async ({ page }) => {
      const panel = page.locator('[data-panel="markets"]');
      await expect(panel).toBeVisible();
      await expect(panel.locator('.panel-title')).toHaveText('Markets');
    });

    test('should display commodities panel', async ({ page }) => {
      const panel = page.locator('[data-panel="commodities"]');
      await expect(panel).toBeVisible();
      await expect(panel.locator('.panel-title')).toHaveText('Commodities / VIX');
    });

    test('should display polymarket panel', async ({ page }) => {
      const panel = page.locator('[data-panel="polymarket"]');
      await expect(panel).toBeVisible();
      await expect(panel.locator('.panel-title')).toHaveText('Polymarket Predictions');
    });

    test('should display whale watch panel', async ({ page }) => {
      const panel = page.locator('[data-panel="whales"]');
      await expect(panel).toBeVisible();
      await expect(panel.locator('.panel-title')).toHaveText('Whale Watch');
    });

    test('should display main character panel', async ({ page }) => {
      const panel = page.locator('[data-panel="mainchar"]');
      await expect(panel).toBeVisible();
      await expect(panel.locator('.panel-title')).toHaveText('Main Character');
    });

    test('should display money printer panel', async ({ page }) => {
      const panel = page.locator('[data-panel="printer"]');
      await expect(panel).toBeVisible();
      await expect(panel.locator('.panel-title')).toHaveText('Money Printer');
    });

    test('should display government contracts panel', async ({ page }) => {
      const panel = page.locator('[data-panel="contracts"]');
      await expect(panel).toBeVisible();
      await expect(panel.locator('.panel-title')).toHaveText('Gov Contracts');
    });

    test('should display AI arms race panel', async ({ page }) => {
      const panel = page.locator('[data-panel="ai"]');
      await expect(panel).toBeVisible();
      await expect(panel.locator('.panel-title')).toHaveText('AI Arms Race');
    });

    test('should display layoffs panel', async ({ page }) => {
      const panel = page.locator('[data-panel="layoffs"]');
      await expect(panel).toBeVisible();
      await expect(panel.locator('.panel-title')).toHaveText('Layoffs Tracker');
    });

    test('should display venezuela panel', async ({ page }) => {
      const panel = page.locator('[data-panel="venezuela"]');
      await expect(panel).toBeVisible();
      await expect(panel.locator('.panel-title')).toHaveText('Venezuela Situation');
    });

    test('should display greenland panel', async ({ page }) => {
      const panel = page.locator('[data-panel="greenland"]');
      await expect(panel).toBeVisible();
      await expect(panel.locator('.panel-title')).toHaveText('Greenland Situation');
    });

    test('should display intel feed panel', async ({ page }) => {
      const panel = page.locator('[data-panel="intel"]');
      await expect(panel).toBeVisible();
      await expect(panel.locator('.panel-title')).toHaveText('Intel Feed');
    });

    test('should display monitors panel', async ({ page }) => {
      const panel = page.locator('[data-panel="monitors"]');
      await expect(panel).toBeVisible();
      await expect(panel.locator('.panel-title')).toHaveText('My Monitors');
    });
  });

  test.describe('Settings Modal', () => {
    test('should open settings modal when clicking Panels button', async ({ page }) => {
      await page.click('.settings-btn');
      const modal = page.locator('#settingsModal');
      await expect(modal).toHaveClass(/open/);
    });

    test('should display settings title', async ({ page }) => {
      await page.click('.settings-btn');
      await page.locator('#settingsModal').waitFor({ state: 'visible' });
      const title = page.locator('.settings-title');
      await expect(title).toHaveText('Panel Settings');
    });

    test('should display panel toggles section', async ({ page }) => {
      await page.click('.settings-btn');
      await page.locator('#settingsModal').waitFor({ state: 'visible' });
      const section = page.locator('.settings-section-title').first();
      await expect(section).toHaveText('Toggle Panels');
    });

    test('should display layout section', async ({ page }) => {
      await page.click('.settings-btn');
      await page.locator('#settingsModal').waitFor({ state: 'visible' });
      const sections = page.locator('.settings-section-title');
      await expect(sections.nth(1)).toHaveText('Layout');
    });

    test('should display custom monitors section', async ({ page }) => {
      await page.click('.settings-btn');
      await page.locator('#settingsModal').waitFor({ state: 'visible' });
      const sections = page.locator('.settings-section-title');
      await expect(sections.nth(2)).toHaveText('Custom Monitors');
    });

    test('should close settings modal when clicking close button', async ({ page }) => {
      await page.click('.settings-btn');
      await expect(page.locator('#settingsModal')).toHaveClass(/open/);
      await page.click('.settings-close');
      await expect(page.locator('#settingsModal')).not.toHaveClass(/open/);
    });

    test('should close settings modal when clicking outside', async ({ page }) => {
      await page.click('.settings-btn');
      await expect(page.locator('#settingsModal')).toHaveClass(/open/);
      // Click on the overlay outside the content
      await page.locator('#settingsModal').click({ position: { x: 10, y: 10 } });
      await expect(page.locator('#settingsModal')).not.toHaveClass(/open/);
    });

    test('should have reset layout button', async ({ page }) => {
      await page.click('.settings-btn');
      await page.locator('#settingsModal').waitFor({ state: 'visible' });
      const resetBtn = page.locator('.settings-reset');
      await expect(resetBtn).toBeVisible();
      await expect(resetBtn).toHaveText('Reset Layout');
    });

    test('should have add monitor button in settings', async ({ page }) => {
      await page.click('.settings-btn');
      await page.locator('#settingsModal').waitFor({ state: 'visible' });
      const addBtn = page.locator('.add-monitor-btn');
      await expect(addBtn).toBeVisible();
      await expect(addBtn).toHaveText('+ Add Monitor');
    });
  });

  test.describe('Monitor Form Modal', () => {
    test('should open monitor form when clicking + Monitor button', async ({ page }) => {
      await page.click('.monitors-btn');
      const form = page.locator('#monitorFormOverlay');
      await expect(form).toHaveClass(/open/);
    });

    test('should display monitor form title', async ({ page }) => {
      await page.click('.monitors-btn');
      await page.locator('#monitorFormOverlay').waitFor({ state: 'visible' });
      const title = page.locator('#monitorFormTitle');
      await expect(title).toHaveText('Add Monitor');
    });

    test('should display name input field', async ({ page }) => {
      await page.click('.monitors-btn');
      await page.locator('#monitorFormOverlay').waitFor({ state: 'visible' });
      const input = page.locator('#monitorName');
      await expect(input).toBeVisible();
      await expect(input).toHaveAttribute('placeholder', 'e.g., TSMC Supply Chain');
    });

    test('should display keywords input field', async ({ page }) => {
      await page.click('.monitors-btn');
      await page.locator('#monitorFormOverlay').waitFor({ state: 'visible' });
      const input = page.locator('#monitorKeywords');
      await expect(input).toBeVisible();
      await expect(input).toHaveAttribute('placeholder', 'e.g., tsmc, taiwan semiconductor, chip');
    });

    test('should display color selector', async ({ page }) => {
      await page.click('.monitors-btn');
      await page.locator('#monitorFormOverlay').waitFor({ state: 'visible' });
      const colors = page.locator('#monitorColors');
      await expect(colors).toBeVisible();
    });

    test('should display latitude input', async ({ page }) => {
      await page.click('.monitors-btn');
      await page.locator('#monitorFormOverlay').waitFor({ state: 'visible' });
      const input = page.locator('#monitorLat');
      await expect(input).toBeVisible();
      await expect(input).toHaveAttribute('placeholder', 'Latitude');
    });

    test('should display longitude input', async ({ page }) => {
      await page.click('.monitors-btn');
      await page.locator('#monitorFormOverlay').waitFor({ state: 'visible' });
      const input = page.locator('#monitorLon');
      await expect(input).toBeVisible();
      await expect(input).toHaveAttribute('placeholder', 'Longitude');
    });

    test('should have cancel button', async ({ page }) => {
      await page.click('.monitors-btn');
      await page.locator('#monitorFormOverlay').waitFor({ state: 'visible' });
      const btn = page.locator('.monitor-cancel-btn');
      await expect(btn).toBeVisible();
      await expect(btn).toHaveText('Cancel');
    });

    test('should have save button', async ({ page }) => {
      await page.click('.monitors-btn');
      await page.locator('#monitorFormOverlay').waitFor({ state: 'visible' });
      const btn = page.locator('.monitor-save-btn');
      await expect(btn).toBeVisible();
      await expect(btn).toHaveText('Save');
    });

    test('should close monitor form when clicking cancel', async ({ page }) => {
      await page.click('.monitors-btn');
      await expect(page.locator('#monitorFormOverlay')).toHaveClass(/open/);
      await page.click('.monitor-cancel-btn');
      await expect(page.locator('#monitorFormOverlay')).not.toHaveClass(/open/);
    });

    test('should close monitor form when clicking outside', async ({ page }) => {
      await page.click('.monitors-btn');
      await expect(page.locator('#monitorFormOverlay')).toHaveClass(/open/);
      await page.locator('#monitorFormOverlay').click({ position: { x: 10, y: 10 } });
      await expect(page.locator('#monitorFormOverlay')).not.toHaveClass(/open/);
    });
  });

  test.describe('Map Panel', () => {
    test('should display map SVG', async ({ page }) => {
      const svg = page.locator('#mapSvg');
      await expect(svg).toBeVisible();
    });

    test('should display globe container (hidden by default)', async ({ page }) => {
      const globe = page.locator('#globeContainer');
      await expect(globe).toHaveCSS('display', 'none');
    });

    test('should display map tooltip (hidden by default)', async ({ page }) => {
      const tooltip = page.locator('#mapTooltip');
      await expect(tooltip).toHaveCSS('display', 'none');
    });

    test('should display show all flights toggle', async ({ page }) => {
      const toggle = page.locator('#showAllFlightsToggle');
      await expect(toggle).toBeVisible();
    });

    test('should display 2D/3D view toggle button', async ({ page }) => {
      const toggle = page.locator('#mapViewToggle');
      await expect(toggle).toBeVisible();
      await expect(toggle).toHaveText('2D');
    });
  });

  test.describe('Pentagon Tracker Config', () => {
    test('should display pentagon config details', async ({ page }) => {
      const config = page.locator('#pentagonConfig');
      await expect(config).toBeVisible();
    });

    test('should expand pentagon config on click', async ({ page }) => {
      const summary = page.locator('#pentagonConfig summary');
      await summary.click();
      const body = page.locator('#pentagonConfig .panel-config-body');
      await expect(body).toBeVisible();
    });

    test('should display BestTime API key input', async ({ page }) => {
      await page.locator('#pentagonConfig summary').click();
      const input = page.locator('#besttimeApiKeyPrivateInput');
      await expect(input).toBeVisible();
      await expect(input).toHaveAttribute('type', 'password');
    });

    test('should display location inputs', async ({ page }) => {
      await page.locator('#pentagonConfig summary').click();
      await expect(page.locator('#pentagonLocName')).toBeVisible();
      await expect(page.locator('#pentagonLocLat')).toBeVisible();
      await expect(page.locator('#pentagonLocLng')).toBeVisible();
      await expect(page.locator('#pentagonLocRadius')).toBeVisible();
    });
  });

  test.describe('Refresh Button', () => {
    test('should have refresh button visible', async ({ page }) => {
      const btn = page.locator('#refreshBtn');
      await expect(btn).toBeVisible();
      await expect(btn).toHaveText('Refresh');
    });

    test('should be clickable', async ({ page }) => {
      const btn = page.locator('#refreshBtn');
      await expect(btn).toBeEnabled();
    });
  });

  test.describe('Responsive Layout', () => {
    test('should have dashboard grid layout', async ({ page }) => {
      const dashboard = page.locator('.dashboard');
      await expect(dashboard).toBeVisible();
    });

    test('map panel should span 4 columns', async ({ page }) => {
      const mapPanel = page.locator('[data-panel="map"]');
      await expect(mapPanel).toHaveAttribute('style', /grid-column: span 4/);
    });

    test('wide panels should have wide class', async ({ page }) => {
      const marketPanel = page.locator('[data-panel="markets"]');
      await expect(marketPanel).toHaveClass(/wide/);
    });
  });
});

test.describe('Accessibility', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForFunction(() => typeof window.toggleSettings === 'function', { timeout: 10000 });
  });

  test('page should have proper lang attribute', async ({ page }) => {
    const html = page.locator('html');
    await expect(html).toHaveAttribute('lang', 'en');
  });

  test('page should have a main element', async ({ page }) => {
    const main = page.locator('main.dashboard');
    await expect(main).toBeVisible();
  });

  test('page should have a header element', async ({ page }) => {
    const header = page.locator('header.header');
    await expect(header).toBeVisible();
  });

  test('all buttons should be keyboard accessible', async ({ page }) => {
    const buttons = page.locator('button');
    const count = await buttons.count();
    expect(count).toBeGreaterThan(0);
  });

  test('inputs should have labels', async ({ page }) => {
    await page.click('.monitors-btn');
    await page.locator('#monitorFormOverlay').waitFor({ state: 'visible' });
    // Check for label elements
    const labels = page.locator('.monitor-form-label');
    await expect(labels.first()).toBeVisible();
  });
});
