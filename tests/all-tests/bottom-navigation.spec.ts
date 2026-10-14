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

  // Bloom #3074/#3080: the primary nav is Portfolio / Discover / Chat, and
  // Settings moved from the nav into each tab header.
  await test.step("Tap Discover tab and verify navigation", async () => {
    await page.getByRole('navigation', { name: 'Primary' }).getByRole('link', { name: 'Discover', exact: true }).click();
    await expect(page).toHaveURL(/\/feed(?:\?|$)/);
  });

  // Bloom #2917/#3063: Discover's header shows a Settings gear next to Refresh.
  await test.step("Open Settings from the tab header and verify navigation", async () => {
    await page.getByRole('button', { name: 'Settings', exact: true }).click();
    await expect(page).toHaveURL(/\/more/);
    // Settings is a pushed page without the nav bar; Back returns to the tab.
    await expect(page.getByRole('navigation', { name: 'Primary' })).toHaveCount(0);
    await page.getByRole('button', { name: 'Back', exact: true }).click();
    await expect(page).toHaveURL(/\/feed(?:\?|$)/);
  });

  await test.step("Tap Chat tab and verify navigation", async () => {
    await page.getByRole('navigation', { name: 'Primary' }).getByRole('link', { name: 'Chat', exact: true }).click();
    await expect(page).toHaveURL(/\/chat/);
    await expect(page.getByRole('textbox').describe('Chat input')).toBeVisible({ timeout: 10000 });
  });

  await test.step("Tap Portfolio tab and verify navigation back", async () => {
    await page.getByRole('navigation', { name: 'Primary' }).getByRole('link', { name: 'Portfolio', exact: true }).click();
    await expect(page).toHaveURL(/\/portfolios/);
  });
});
