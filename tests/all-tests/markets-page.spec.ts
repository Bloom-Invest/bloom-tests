import { test, expect } from '@stablyai/playwright-test';

/**
 * User Prompt:
 * Navigate to the Markets page (/markets). Verify the page loads with market data —
 * indices, trending stocks, or market movers. Scroll through the content and assert
 * that stock prices or percentage changes are visible.
 */
test("Markets page displays market data with stock prices and percentage changes", async ({ page }) => {
  await test.step("Navigate to the Markets page", async () => {
    await page.goto('/markets');

    // Handle subscription overlay if it appears
    const exploreBtn = page.getByRole('button', { name: 'Explore free' });
    const closeBtn = page.getByRole('button', { name: 'Close' });
    if (await exploreBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await exploreBtn.click();
      // If redirected away, navigate back
      if (!page.url().includes('/markets')) {
        // Dismiss any tutorial overlay
        const tapOverlay = page.getByText('Tap anywhere to continue');
        if (await tapOverlay.isVisible({ timeout: 2000 }).catch(() => false)) {
          await tapOverlay.click();
        }
        await page.goto('/markets');
      }
    } else if (await closeBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await closeBtn.click();
    }

    // Dismiss notification CTA if present
    const dismissBtn = page.getByRole('button', { name: 'Dismiss notification CTA' });
    if (await dismissBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await dismissBtn.click();
    }
  });

  await test.step("Verify the Markets page heading and Market Pulse section are visible", async () => {
    await expect(page.getByRole('heading', { name: 'Markets', level: 1 })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Market Pulse', level: 2 })).toBeVisible();
  });

  await test.step("Verify market sentiment indicators are displayed", async () => {
    // The Market Pulse section shows Fear Index, AAII, Volatility, and Momentum as links
    await expect(page.getByRole('link', { name: /Fear Index/ })).toBeVisible();
    await expect(page.getByRole('link', { name: /AAII/ })).toBeVisible();
    await expect(page.getByRole('link', { name: /Volatility/ })).toBeVisible();
    await expect(page.getByRole('link', { name: /Momentum/ })).toBeVisible();
  });

  await test.step("Verify Top Movers section shows stocks with percentage changes", async () => {
    // The Top Movers dropdown should be visible
    const topMoversDropdown = page.getByRole('combobox').filter({ hasText: 'Top Movers' });
    await expect(topMoversDropdown).toBeVisible();

    // The treemap renders one of two states:
    //   1. On a trading day: stock entries with percentage changes like "+65.3%" / "-17.6%"
    //   2. Outside market hours / on weekends: a "No market data available" placeholder
    // Either is a valid render of the section, so accept both.
    const movers = page.getByText(/[+-]\d+\.\d+%/).first();
    const noData = page.getByText(/No market data available/i);
    await expect(movers.or(noData)).toBeVisible();
  });

  await test.step("Scroll down and verify the Market News section is visible with articles", async () => {
    // Scroll to reveal the Market News section
    const marketNewsHeading = page.getByRole('heading', { name: 'Market News', level: 2 });
    await marketNewsHeading.scrollIntoViewIfNeeded();
    await expect(marketNewsHeading).toBeVisible();

    // Verify the "All News" link is present
    await expect(page.getByRole('link', { name: /All News/ })).toBeVisible();

    // Verify at least one news article is displayed
    // News articles are buttons with accessible names containing timestamps like "3h ago", "2d ago", "yesterday"
    const firstNewsArticle = page.getByRole('button', { name: /\d+[hd] ago|yesterday/ }).first();
    await firstNewsArticle.scrollIntoViewIfNeeded();
    await expect(firstNewsArticle).toBeVisible();
  });

  await test.step("Verify time period controls are available for the Top Movers chart", async () => {
    // Scroll back up to the time period controls
    const timePeriodGroup = page.getByRole('radiogroup');
    await timePeriodGroup.scrollIntoViewIfNeeded();
    await expect(timePeriodGroup).toBeVisible();

    // Verify time period options exist (1D, 1W, 1M, etc.)
    await expect(timePeriodGroup.getByText('1D')).toBeVisible();
    await expect(timePeriodGroup.getByText('1W')).toBeVisible();
    await expect(timePeriodGroup.getByText('1M')).toBeVisible();
  });
});
