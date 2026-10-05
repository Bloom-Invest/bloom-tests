import { test, expect } from '@playwright/test';

/**
 * Test: Bottom navigation routing
 * Tap each nav tab, verify correct page loads.
 */
test("Bottom navigation routes to correct pages", async ({ page }) => {
  await test.step("Navigate to app and dismiss paywall", async () => {
    await page.goto('/portfolios', { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('domcontentloaded');

    const exploreFree = page.getByRole('button', { name: 'Explore free' }).describe('Explore free button');
    try {
      await exploreFree.waitFor({ state: 'visible', timeout: 5000 });
      await exploreFree.click();
    } catch {
      // Paywall not present
    }
  });

  // Bloom #2859: the primary nav is Discover / Ask / Following / Portfolio, and
  // Settings moved from the nav into each tab header's Options menu.
  await test.step("Tap Discover tab and verify navigation", async () => {
    await page.getByRole('navigation', { name: 'Primary' }).getByRole('link', { name: 'Discover', exact: true }).click();
    await expect(page).toHaveURL(/\/feed(?:\?|$)/);
  });

  await test.step("Tap Ask tab and verify navigation", async () => {
    await page.getByRole('navigation', { name: 'Primary' }).getByRole('link', { name: 'Ask', exact: true }).click();
    await expect(page).toHaveURL(/\/chat/);
    await expect(page.getByRole('textbox').describe('Chat input')).toBeVisible({ timeout: 10000 });
  });

  await test.step("Tap Following tab and verify navigation", async () => {
    await page.getByRole('navigation', { name: 'Primary' }).getByRole('link', { name: 'Following', exact: true }).click();
    await expect(page).toHaveURL(/\/following(?:\?|$)/);
    await expect(page.getByRole('heading', { name: 'Following', level: 1 })).toBeVisible();
  });

  await test.step("Open Settings from the tab Options menu and verify navigation", async () => {
    await page.getByRole('button', { name: 'Options', exact: true }).click();
    await page.getByRole('menuitem', { name: 'Settings', exact: true }).click();
    await expect(page).toHaveURL(/\/more/);
    // Settings is a pushed page without the nav bar; Back returns to the tab.
    await expect(page.getByRole('navigation', { name: 'Primary' })).toHaveCount(0);
    await page.getByRole('button', { name: 'Back', exact: true }).click();
    await expect(page).toHaveURL(/\/following(?:\?|$)/);
  });

  await test.step("Tap Portfolio tab and verify navigation back", async () => {
    await page.getByRole('navigation', { name: 'Primary' }).getByRole('link', { name: 'Portfolio', exact: true }).click();
    await expect(page).toHaveURL(/\/portfolios/);
  });
});
