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

  await test.step("Tap discovery tabs and verify navigation", async () => {
    const nav = page.getByRole('navigation', { name: 'Primary' });
    if (await nav.getByRole('link', { name: 'Feed', exact: true }).isVisible()) {
      await nav.getByRole('link', { name: 'Feed', exact: true }).click();
      await expect(page).toHaveURL(/\/feed(?:\?|$)/);
      await nav.getByRole('link', { name: 'Search', exact: true }).click();
      await expect(page).toHaveURL(/\/search\?view=ideas/);
      await page.getByRole('group', { name: 'Search views' }).getByRole('button', { name: 'Markets' }).click();
      await expect(page).toHaveURL(/\/search\?view=markets/);
      await expect(page.getByRole('button', { name: 'Markets', exact: true })).toHaveAttribute('aria-pressed', 'true');
    } else {
      await nav.getByRole('link', { name: 'Ideas', exact: true }).click();
      await expect(page).toHaveURL(/\/ideas/);
      await nav.getByRole('link', { name: 'Markets', exact: true }).click();
      await expect(page).toHaveURL(/\/markets/);
    }
  });

  await test.step("Tap Chat tab and verify navigation", async () => {
    await page.getByRole('navigation', { name: 'Primary' }).getByRole('link', { name: 'Chat' }).click();
    await expect(page).toHaveURL(/\/chat/);
    await expect(page.getByRole('textbox').describe('Chat input')).toBeVisible({ timeout: 10000 });
  });

  await test.step("Tap Settings/More tab and verify navigation", async () => {
    await page.getByRole('navigation', { name: 'Primary' }).getByRole('link', { name: /^(Settings|More)$/ }).click();
    await expect(page).toHaveURL(/\/more/);
  });

  await test.step("Tap Portfolio tab and verify navigation back", async () => {
    await page.getByRole('navigation', { name: 'Primary' }).getByRole('link', { name: 'Portfolio' }).click();
    await expect(page).toHaveURL(/\/portfolios/);
  });
});
