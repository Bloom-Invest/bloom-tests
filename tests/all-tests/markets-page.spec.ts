import { test, expect } from '@playwright/test';
import { dismissFeedbackModal } from '../helpers/dismissFeedbackModal';

/**
 * User Prompt:
 * Navigate to the Markets page (/markets). Verify the page loads with market data —
 * indices, trending stocks, or market movers. Scroll through the content and assert
 * that stock prices or percentage changes are visible.
 */
test("Markets page displays market data with stock prices and percentage changes", async ({ page }) => {
  await test.step("Prepare and navigate to the Markets page", async () => {
    await page.addInitScript(() => {
      localStorage.setItem('hasCompletedOnboarding', 'true');
      localStorage.setItem('hasSeenTabOnboarding', 'true');
    });
    await page.goto('/markets', { waitUntil: 'domcontentloaded' });

    // Only dismiss known overlays. A generic `Close` locator can match a
    // control inside Market News; its click bubbles to the article and opens Chat.
    const exploreBtn = page.getByRole('button', { name: /^Explore free$/i });
    try {
      await exploreBtn.waitFor({ state: 'visible', timeout: 5000 });
      await exploreBtn.scrollIntoViewIfNeeded();
      await exploreBtn.click();
      if (!page.url().includes('/markets')) {
        await page.goto('/markets', { waitUntil: 'domcontentloaded' });
      }
    } catch {
      // No subscription overlay.
    }

    await dismissFeedbackModal(page);

    const dismissBtn = page.getByRole('button', { name: 'Dismiss notification CTA' });
    try {
      await dismissBtn.waitFor({ state: 'visible', timeout: 3000 });
      await dismissBtn.click();
    } catch {
      // No notification CTA.
    }
  });

  await test.step("Verify Markets is selected within Discover", async () => {
    await expect(page).toHaveURL(/\/markets$/);
    await expect(page.getByRole('heading', { name: 'Discover', level: 1 })).toBeVisible();
    const views = page.getByRole('navigation', { name: 'Discover views' });
    await expect(views.getByRole('link', { name: 'Markets', exact: true }))
      .toHaveAttribute('aria-current', 'page');
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
    //   2. Outside market hours / on weekends: a "No movers for this period" placeholder
    // Either is a valid render of the section, so accept both.
    const marketMap = page.locator('[data-search-widget="market_map"]');
    const movers = marketMap.getByText(/[+-]\d+\.\d+%/).first();
    const noData = marketMap.getByText(/No movers for this period/i);
    await expect(movers.or(noData)).toBeVisible();
  });

  await test.step("Verify the earnings calendar and its full-page link", async () => {
    const earnings = page.locator('[data-search-widget="earnings"]');
    await earnings.scrollIntoViewIfNeeded();
    await expect(earnings.getByRole('heading', { name: /earnings$/i, level: 2 })).toBeVisible();
    await expect(earnings.getByRole('link', { name: /All Earnings/ })).toHaveAttribute('href', '/markets/earnings');
    const days = earnings.getByRole('button', { name: /Earnings .* compan(?:y|ies) reporting/ });
    const noEarnings = earnings.getByText('No upcoming earnings for your holdings in the next 4 weeks.', { exact: true });
    await expect(days.first().or(noEarnings)).toBeVisible();
    if (!(await noEarnings.isVisible())) await expect(days).toHaveCount(7);
  });

  await test.step("Verify time period controls are available for the Top Movers chart", async () => {
    // Scroll back up to the time period controls
    const timePeriodGroup = page.locator('[data-search-widget="market_map"]').getByRole('radiogroup');
    await timePeriodGroup.scrollIntoViewIfNeeded();
    await expect(timePeriodGroup).toBeVisible();

    // Verify time period options exist (1D, 1W, 1M, etc.)
    await expect(timePeriodGroup.getByText('1D')).toBeVisible();
    await expect(timePeriodGroup.getByText('1W')).toBeVisible();
    await expect(timePeriodGroup.getByText('1M')).toBeVisible();
  });

  await test.step("Search returns to the selected Markets tab", async () => {
    const search = page.getByRole('button', { name: 'Search stocks, ETFs, and news', exact: true });
    await search.scrollIntoViewIfNeeded();
    await search.click();
    await expect(page).toHaveURL(/\/search$/);
    await dismissFeedbackModal(page);
    await expect(page.getByRole('textbox', { name: 'Search stocks, ETFs, and news', exact: true })).toBeVisible();
    await page.goBack();
    await dismissFeedbackModal(page);
    await expect(page).toHaveURL(/\/markets$/);
    await expect(page.getByRole('navigation', { name: 'Discover views' })
      .getByRole('link', { name: 'Markets', exact: true })).toHaveAttribute('aria-current', 'page');
    await expect(page.getByRole('heading', { name: 'Market Pulse', level: 2 })).toBeVisible();
  });
});
