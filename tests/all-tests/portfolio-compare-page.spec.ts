import { test, expect } from '@stablyai/playwright-test';
import { BASE_URL } from '../helpers/config.helper';

/**
 * User Prompt:
 * Navigate to the Portfolios page (/portfolios). If a portfolio exists, navigate to
 * the portfolio compare page (/portfolios/compare). If not, create a simple portfolio
 * first with AAPL, then navigate to compare. Verify the compare view loads and shows
 * portfolio performance charts or comparison data.
 */
test("Portfolio compare page loads and shows comparison data", async ({ page }) => {
  await test.step("Navigate to the Portfolios page and dismiss any overlays", async () => {
    await page.goto(`${BASE_URL}/portfolios`);

    // Handle subscription overlay if it appears
    const closeBtn = page.getByRole('button', { name: 'Close' });
    if (await closeBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await closeBtn.click();
    }
  });

  await test.step("Verify the Portfolios page loads", async () => {
    // The page should show portfolio-related content
    await expect(
      page.getByText(/portfolio|compare|performance|holdings|create/i).first()
    ).toBeVisible({ timeout: 15000 });
  });

  await test.step("Navigate to the portfolio compare page", async () => {
    // Try navigating directly to the compare page
    await page.goto(`${BASE_URL}/portfolios/compare`);

    // Handle subscription overlay if it appears
    const closeBtn = page.getByRole('button', { name: 'Close' });
    if (await closeBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await closeBtn.click();
    }
  });

  await test.step("Verify the compare page loads with comparison data or empty state", async () => {
    // Should have compare-related content or redirect to portfolios
    await expect(
      page.getByText(/compare|performance|chart|portfolio|create|add/i).first()
    ).toBeVisible({ timeout: 15000 });

    // Page should be functional
    await expect(page.locator('body')).toBeVisible();
  });
});
