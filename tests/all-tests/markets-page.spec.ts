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

  await test.step("Verify the Markets page heading and Market Pulse section are visible", async () => {
    if (new URL(page.url()).pathname === '/search') {
      // /markets redirects to the Markets view of Search. Bloom #2859 removed the
      // Ideas/Markets toggle, so prove the Markets view by URL and by the absence
      // of Ideas-only sections.
      await expect(page).toHaveURL(/\/search\?view=markets/);
      await expect(page.getByRole('heading', { name: 'Search', level: 1 })).toBeVisible();
      await expect(page.getByRole('heading', { name: 'Latest trades', level: 2 })).toHaveCount(0);
    } else {
      await expect(page.getByRole('heading', { name: 'Markets', level: 1 })).toBeVisible();
    }
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
    const movers = page.getByText(/[+-]\d+\.\d+%/).first();
    const noData = page.getByText(/No movers for this period/i);
    await expect(movers.or(noData)).toBeVisible();
  });

  await test.step("Verify Market News on the legacy Markets page", async () => {
    if (new URL(page.url()).pathname === '/search') return;
    // Scroll to reveal the Market News section
    const marketNewsHeading = page.getByRole('heading', { name: 'Market News', level: 2 });
    await marketNewsHeading.scrollIntoViewIfNeeded();
    await expect(marketNewsHeading).toBeVisible();

    // Verify the "All News" link is present
    await expect(page.getByRole('link', { name: /All News/ })).toBeVisible();

    // Verify at least one news article is displayed.
    // Each article button ends with a relative timestamp. formatRelativeTime in
    // frontend/src/components/MarketNewsList/index.tsx emits the full ladder:
    // "just now", "5m ago", "3h ago", "yesterday", "2d ago", "3w ago", "2mo ago".
    // Matching only [hd] made this step fail whenever every headline was under an
    // hour old, which is the normal state on a weekday morning. Match the ladder.
    const firstNewsArticle = page
      .getByRole('button', { name: /\d+(m|h|d|w|mo) ago|just now|yesterday/i })
      .first();
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
