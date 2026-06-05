import { test, expect } from '@stablyai/playwright-test';
import { dismissFeedbackModal } from '../helpers/dismissFeedbackModal';

/**
 * Regression coverage for the market briefing / smart summary generation path.
 *
 * The backend bug this guards against: smart summary generation returned empty
 * or too-short content for every user, while the read endpoint and Markets page
 * shell still loaded. This test seeds a local watchlist so the Markets page
 * auto-generates a briefing, then requires a real rendered summary card.
 */
test('Markets page generates and renders a real market briefing', async ({ page }) => {
  await test.step('Seed onboarding and a watchlist before app boot', async () => {
    await page.addInitScript(() => {
      localStorage.setItem('hasCompletedOnboarding', 'true');
      localStorage.setItem('hasSeenTabOnboarding', 'true');
      localStorage.setItem('watchlist', JSON.stringify({ AAPL: true, MSFT: true }));
      localStorage.setItem(
        'bloom_device_id',
        `stably-market-briefing-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      );
    });
  });

  await test.step('Navigate to Markets and clear overlays', async () => {
    await page.goto('/markets', { waitUntil: 'domcontentloaded' });

    const exploreFree = page.getByRole('button', { name: /^Explore free$/i });
    try {
      await exploreFree.waitFor({ state: 'visible', timeout: 5000 });
      await exploreFree.scrollIntoViewIfNeeded();
      await exploreFree.click();
      if (!page.url().includes('/markets')) {
        await page.goto('/markets', { waitUntil: 'domcontentloaded' });
      }
    } catch {
      // No subscription overlay.
    }

    await dismissFeedbackModal(page);
  });

  await test.step('Wait for a generated market briefing card', async () => {
    await expect(page.getByRole('heading', { name: 'Markets', level: 1 })).toBeVisible();

    const summaryCard = page.getByTestId('market-summary-card');
    await expect(summaryCard).toBeVisible({ timeout: 60000 });

    const text = (await summaryCard.innerText()).trim();
    expect(text.length).toBeGreaterThan(80);
    expect(text).not.toMatch(/Generating your market update|Please wait|couldn't generate|failed/i);
    expect(text).toMatch(/AAPL|MSFT|portfolio|market|stock/i);
  });
});
