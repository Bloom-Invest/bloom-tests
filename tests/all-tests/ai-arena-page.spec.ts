import { test, expect } from '@playwright/test';
import { dismissFeedbackModal } from '../helpers/dismissFeedbackModal';

/**
 * User Prompt:
 * Navigate to the AI Arena page (/ideas/ai-arena). Verify the page loads and shows
 * AI-generated portfolio managers or investment strategies. Click on one of the AI
 * portfolio managers or strategies and verify details are shown.
 */
test("AI Arena page displays AI portfolio managers and shows details on selection", async ({ page }) => {
  const portfoliosResponse = page.waitForResponse((response) =>
    new URL(response.url()).pathname === '/api/portfolios' && response.request().method() === 'GET'
  );
  const escapeRegex = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  let managers: { id: string; name: string }[];
  await test.step("Navigate to the AI Arena page and dismiss any overlays", async () => {
    await page.goto('/ideas/ai-arena', { waitUntil: 'domcontentloaded' });

    // Handle subscription overlay if it appears
    const exploreBtn = page.getByRole('button', { name: 'Explore free' });
    try {
      await exploreBtn.waitFor({ state: 'visible', timeout: 3000 });
      await exploreBtn.click();
      // If redirected, navigate back
      if (!page.url().includes('/ideas/ai-arena')) {
        // Dismiss any tutorial overlay
        const tapOverlay = page.getByText('Tap anywhere to continue');
        try {
          await tapOverlay.waitFor({ state: 'visible', timeout: 2000 });
          await tapOverlay.click();
        } catch {
          // No tutorial overlay
        }
        await page.goto('/ideas/ai-arena', { waitUntil: 'domcontentloaded' });
      }
    } catch {
      const closeBtn = page.getByRole('button', { name: 'Close' });
      try {
        await closeBtn.waitFor({ state: 'visible', timeout: 2000 });
        await closeBtn.click();
      } catch {
        // No overlay
      }
    }

    await dismissFeedbackModal(page);
  });

  await test.step("Verify the AI Arena page heading is visible", async () => {
    await dismissFeedbackModal(page);
    await expect(page.getByRole('heading', { name: 'Copy trade Bloom AI', level: 1 })).toBeVisible();
  });

  await test.step("Verify three AI portfolio managers are displayed with performance data", async () => {
    await dismissFeedbackModal(page);

    const response = await portfoliosResponse;
    expect(response.ok()).toBeTruthy();
    const portfolios: { id: string; name: string }[] = await response.json();
    // These three provider IDs are always visible; model names are API-owned.
    managers = ['openai', 'gemini', 'claude'].map((id) => {
      const portfolio = portfolios.find((item) => item.id === id);
      expect(portfolio, `Missing Arena portfolio ${id}`).toBeDefined();
      expect(portfolio!.name).toBeTruthy();
      return portfolio!;
    });
    for (const manager of managers) {
      const card = page.getByRole('button', {
        name: new RegExp(`${escapeRegex(manager.name)}.*(?:YTD|All-time)`),
      });
      await expect(card).toBeVisible();
      await expect(card.getByText(/[+-]?\d+\.\d+%/)).toBeVisible();
    }
  });

  await test.step("Verify the Performance History chart section is visible", async () => {
    await dismissFeedbackModal(page);
    await expect(page.getByRole('heading', { name: 'Performance History' })).toBeVisible();

    // Verify time period buttons are present
    await expect(page.getByRole('button', { name: '1W' })).toBeVisible();
    await expect(page.getByRole('button', { name: '1M' })).toBeVisible();
    await expect(page.getByRole('button', { name: '3M' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'YTD', exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: 'ALL', exact: true })).toBeVisible();

    // Each live manager name must also appear in the Portfolio Breakdown tabs.
    const breakdown = page.locator('section').filter({
      has: page.getByRole('heading', { name: 'Portfolio Breakdown', exact: true }),
    });
    for (const manager of managers) {
      await expect(breakdown.getByRole('button', { name: manager.name, exact: true })).toBeVisible();
    }
  });

  await test.step("Select a manager and verify its portfolio details load", async () => {
    await dismissFeedbackModal(page);
    const manager = managers.find((item) => item.id === 'openai')!;
    const breakdown = page.locator('section').filter({
      has: page.getByRole('heading', { name: 'Portfolio Breakdown', exact: true }),
    });
    const positionsResponse = page.waitForResponse((response) =>
      new URL(response.url()).pathname === `/api/portfolio/${manager.id}/positions`
    );
    await breakdown.getByRole('button', { name: manager.name, exact: true }).click();
    const response = await positionsResponse;
    expect(response.ok()).toBeTruthy();
    const positions: { symbol: string }[] = await response.json();
    await breakdown.getByRole('button', { name: 'Open', exact: true }).click();
    await expect(breakdown.getByRole('button', { name: 'Open', exact: true })).toHaveAttribute('aria-pressed', 'true');
    if (positions.length) {
      await expect(breakdown.getByRole('button', { name: `Copy ${manager.name} Portfolio`, exact: true })).toBeVisible();
    } else {
      await expect(breakdown.getByText('No positions available')).toBeVisible();
    }
    await page.screenshot({ path: test.info().outputPath('arena-selected.png'), fullPage: true });
  });
});
