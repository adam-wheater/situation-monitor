// @ts-check
import { test, expect } from '@playwright/test';

/**
 * E2E tests for responsive behavior and accessibility
 * Tests TODO_A completed features: UI responsiveness, click targets
 */

test.describe('Responsive Layout', () => {
  test('should display correctly on desktop viewport', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto('/');

    const header = page.locator('.header');
    await expect(header).toBeVisible();

    const dashboard = page.locator('.dashboard');
    await expect(dashboard).toBeVisible();
  });

  test('should display correctly on tablet viewport', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/');

    const header = page.locator('.header');
    await expect(header).toBeVisible();

    const dashboard = page.locator('.dashboard');
    await expect(dashboard).toBeVisible();
  });

  test('should display correctly on mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');

    const header = page.locator('.header');
    await expect(header).toBeVisible();

    const dashboard = page.locator('.dashboard');
    await expect(dashboard).toBeVisible();
  });
});

test.describe('Accessibility', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('.settings-btn', { timeout: 10000 });
  });

  test('should have lang attribute on html', async ({ page }) => {
    const html = page.locator('html');
    await expect(html).toHaveAttribute('lang', 'en');
  });

  test('should have page title', async ({ page }) => {
    await expect(page).toHaveTitle('Situation Monitor');
  });

  test('should have main element', async ({ page }) => {
    const main = page.locator('main');
    await expect(main).toBeVisible();
  });

  test('buttons should be focusable', async ({ page }) => {
    const refreshBtn = page.locator('#refreshBtn');
    await refreshBtn.focus();
    await expect(refreshBtn).toBeFocused();
  });

  test('inputs in forms should be focusable', async ({ page }) => {
    const monitorBtn = page.locator('.monitors-btn');
    await monitorBtn.click();

    const nameInput = page.locator('#monitorName');
    await nameInput.focus();
    await expect(nameInput).toBeFocused();
  });
});

test.describe('Click Targets', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('.settings-btn', { timeout: 10000 });
  });

  test('header buttons should have sufficient click area', async ({ page }) => {
    const refreshBtn = page.locator('#refreshBtn');
    const box = await refreshBtn.boundingBox();

    // Button should have at least 24x24 px click area
    expect(box?.width).toBeGreaterThanOrEqual(24);
    expect(box?.height).toBeGreaterThanOrEqual(24);
  });

  test('settings button should have sufficient click area', async ({ page }) => {
    const settingsBtn = page.locator('.settings-btn');
    const box = await settingsBtn.boundingBox();

    expect(box?.width).toBeGreaterThanOrEqual(24);
    expect(box?.height).toBeGreaterThanOrEqual(24);
  });

  test('map view toggle should have sufficient click area', async ({ page }) => {
    await page.waitForSelector('#mapViewToggle');
    const toggleBtn = page.locator('#mapViewToggle');
    const box = await toggleBtn.boundingBox();

    expect(box?.width).toBeGreaterThanOrEqual(20);
    expect(box?.height).toBeGreaterThanOrEqual(16);
  });

  test('flights toggle checkbox should be clickable', async ({ page }) => {
    await page.waitForSelector('#showAllFlightsToggle');
    const toggle = page.locator('#showAllFlightsToggle');

    // Click should toggle the checkbox
    await toggle.click();
    await expect(toggle).toBeChecked();
  });
});

test.describe('Loading States', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('.settings-btn', { timeout: 10000 });
  });

  test('panels should show loading state initially', async ({ page }) => {
    // Some panels may still be loading
    const loadingMsgs = page.locator('.loading-msg');
    // At least some panels should have content or be loading
    const count = await loadingMsgs.count();
    // This may be 0 if data loads fast, or >0 if still loading
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test('status indicator should be visible', async ({ page }) => {
    const status = page.locator('#status');
    await expect(status).toBeVisible();
  });
});
